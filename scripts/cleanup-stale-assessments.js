#!/usr/bin/env node
/**
 * Deletes survey_sessions (Assessments) records more than 30 days old that
 * either aren't linked to an account, or are an older duplicate for a linked
 * account whose single most recent old submission is kept. Records within
 * the last 30 days are never touched, regardless of linkage.
 *
 * This mirrors computeStaleAssessmentIds() in admin.html's Assessments tab
 * ("Clean Up" button) exactly -- keep both in sync if the criteria ever
 * change. This script is the scheduled/unattended version of that same
 * on-demand action, run via the GitHub Actions workflow in
 * .github/workflows/cleanup-stale-assessments.yml.
 *
 * Usage:
 *   node cleanup-stale-assessments.js             # deletes for real
 *   node cleanup-stale-assessments.js --dry-run   # preview only, no deletes
 *
 * Requires the FIREBASE_SERVICE_ACCOUNT_KEY env var: the full JSON contents
 * of a Firebase service account key (Firebase Console -> Project Settings ->
 * Service Accounts -> Generate new private key), as a single JSON string.
 * Never commit that key to the repo -- it's supplied via a GitHub Actions
 * secret in CI, or a local env var for manual runs.
 */

const admin = require('firebase-admin');

const DRY_RUN = process.argv.includes('--dry-run');
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const BATCH_CHUNK_SIZE = 450; // headroom under Firestore's 500-write batch cap

function initFirestore() {
  const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) {
    console.error('Missing FIREBASE_SERVICE_ACCOUNT_KEY env var.');
    process.exit(1);
  }
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(keyJson);
  } catch (err) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON:', err.message);
    process.exit(1);
  }
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return admin.firestore();
}

/* Same selection rules as computeStaleAssessmentIds() in admin.html. */
function computeStaleAssessmentIds(records) {
  const cutoffMs = Date.now() - THIRTY_DAYS_MS;
  const old = records.filter((r) => r.submitted_at && typeof r.submitted_at.toDate === 'function'
    && r.submitted_at.toDate().getTime() < cutoffMs);

  const toDelete = [];
  const byUser = {};
  old.forEach((r) => {
    if (!r.user_id) { toDelete.push(r.id); return; }
    (byUser[r.user_id] = byUser[r.user_id] || []).push(r);
  });
  const unlinkedCount = toDelete.length;

  let keptCount = 0;
  Object.values(byUser).forEach((group) => {
    group.sort((a, b) => b.submitted_at.toDate().getTime() - a.submitted_at.toDate().getTime());
    keptCount++;
    group.slice(1).forEach((r) => toDelete.push(r.id));
  });

  return {
    toDelete,
    unlinkedCount,
    linkedDuplicateCount: toDelete.length - unlinkedCount,
    keptCount,
    totalScanned: records.length,
    oldCount: old.length
  };
}

async function deleteInBatches(db, collectionName, ids) {
  for (let i = 0; i < ids.length; i += BATCH_CHUNK_SIZE) {
    const chunk = ids.slice(i, i + BATCH_CHUNK_SIZE);
    const batch = db.batch();
    chunk.forEach((id) => batch.delete(db.collection(collectionName).doc(id)));
    await batch.commit();
  }
}

async function main() {
  const db = initFirestore();
  console.log(`Scanning survey_sessions${DRY_RUN ? ' (dry run -- nothing will be deleted)' : ''}...`);

  const snapshot = await db.collection('survey_sessions').get();
  const records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const { toDelete, unlinkedCount, linkedDuplicateCount, keptCount, totalScanned, oldCount } =
    computeStaleAssessmentIds(records);

  console.log(`Total records: ${totalScanned}`);
  console.log(`Older than 30 days: ${oldCount}`);
  console.log(`  Not linked to any account: ${unlinkedCount}`);
  console.log(`  Older duplicates for ${keptCount} linked account(s): ${linkedDuplicateCount}`);
  console.log(`To delete: ${toDelete.length}`);

  if (!toDelete.length) {
    console.log('Nothing to clean up.');
    return;
  }

  if (DRY_RUN) {
    console.log('Dry run -- skipping actual deletion. IDs that would be deleted:');
    toDelete.forEach((id) => console.log(`  ${id}`));
    return;
  }

  await deleteInBatches(db, 'survey_sessions', toDelete);
  console.log(`Deleted ${toDelete.length} record(s).`);
}

main().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
