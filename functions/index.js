const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

function normalizeAnswers(rawAnswers) {
  if (!Array.isArray(rawAnswers) || rawAnswers.length !== 12) {
    throw new Error("answers must be an array of 12 values");
  }

  const answersList = rawAnswers.map((value) => {
    if (!Number.isInteger(value) || value < 0 || value > 3) {
      throw new Error("answers must contain integers from 0 to 3");
    }
    return value;
  });

  const answers = {};
  answersList.forEach((value, index) => {
    answers[String(index)] = value;
  });

  return { answers, answersList };
}

function parsePayload(body) {
  const sessionId = String(body?.session_id || "").trim();
  const resultType = String(body?.result_type || "").trim().toLowerCase();
  const source = String(body?.source || "quiz").trim();
  const submittedAtClient = String(body?.submitted_at_client || "").trim();

  if (!sessionId) throw new Error("session_id is required");
  if (!resultType) throw new Error("result_type is required");

  const { answers, answersList } = normalizeAnswers(body?.answers);

  return {
    sessionId,
    resultType,
    source,
    submittedAtClient: submittedAtClient || null,
    answers,
    answersList,
  };
}

async function getAuthenticatedUser(req) {
  const authHeader = String(req.get("authorization") || "").trim();
  const match = authHeader.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return null;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(match[1]);
    return {
      uid: decodedToken.uid || null,
      email: decodedToken.email || null,
    };
  } catch (error) {
    logger.warn("submitSurvey received invalid auth token", error);
    return null;
  }
}

exports.submitSurvey = onRequest(
  {
    region: "us-central1",
    cors: true,
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    let payload;
    let authenticatedUser = null;
    try {
      payload = parsePayload(req.body);
      authenticatedUser = await getAuthenticatedUser(req);
    } catch (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    try {
      const counterRef = db.collection("_meta").doc("survey_submission_counter");
      const surveyRef = db.collection("survey_sessions").doc();

      const result = await db.runTransaction(async (tx) => {
        const counterSnap = await tx.get(counterRef);
        const current = counterSnap.exists ? Number(counterSnap.data().current || 0) : 0;
        const submissionNumber = current + 1;

        tx.set(counterRef, {
          current: submissionNumber,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        tx.set(surveyRef, {
          submission_number: submissionNumber,
          session_id: payload.sessionId,
          user_id: authenticatedUser?.uid || null,
          user_email: authenticatedUser?.email || null,
          result_type: payload.resultType,
          answers: payload.answers,
          answers_list: payload.answersList,
          source: payload.source,
          submitted_at_client: payload.submittedAtClient,
          submitted_at: admin.firestore.FieldValue.serverTimestamp(),
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
          document_id: surveyRef.id,
          submission_number: submissionNumber,
        };
      });

      res.status(201).json({
        ok: true,
        user_id: authenticatedUser?.uid || null,
        ...result,
      });
    } catch (error) {
      logger.error("submitSurvey failed", error);
      res.status(500).json({ error: "Unable to store survey submission" });
    }
  }
);
