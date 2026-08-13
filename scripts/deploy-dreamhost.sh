#!/usr/bin/env bash
#
# Deploy the static myroomeo.com site (index.html, quiz.html, assets/, etc.)
# to DreamHost.
#
# Setup (one-time, per person deploying):
#   1. Generate your own SSH keypair if you don't already have one:
#        ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_myroomeo -C "myroomeo-deploy"
#   2. Send the PUBLIC key (id_ed25519_myroomeo.pub) to whoever manages the
#      DreamHost account, so they can add it to the dh_njamnc user's SSH keys
#      in the DreamHost panel (Manage Users -> dh_njamnc -> SSH Keys).
#      NEVER send the private key (id_ed25519_myroomeo, no .pub) to anyone.
#   3. Confirm access works:
#        ssh -i ~/.ssh/id_ed25519_myroomeo dh_njamnc@myroomeo.com "echo ok"
#
# Usage:
#   ./scripts/deploy-dreamhost.sh            # deploy for real
#   ./scripts/deploy-dreamhost.sh --dry-run  # show what would change, no upload
#
# Override the key path if yours lives somewhere else:
#   SSH_KEY=~/.ssh/some_other_key ./scripts/deploy-dreamhost.sh

set -euo pipefail

REMOTE_USER="dh_njamnc"
REMOTE_HOST="myroomeo.com"
REMOTE_DIR="~/myroomeo.com/"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519_myroomeo}"

# Files/directories that make up the live static site.
DEPLOY_PATHS=(
  index.html
  quiz.html
  account.html
  role-cutouts.js
  roomie-cast.js
  roomie-mini.js
  scroll-world-3d.html
  scroll-world-preview.html
  assets
)

cd "$(dirname "$0")/.."

if [[ ! -f "$SSH_KEY" ]]; then
  echo "error: SSH key not found at $SSH_KEY" >&2
  echo "  Generate one (see the setup notes at the top of this script), or set SSH_KEY=/path/to/key" >&2
  exit 1
fi

RSYNC_FLAGS=(-az)
if [[ "${1:-}" == "--dry-run" ]]; then
  echo "Dry run — no files will actually be uploaded."
  RSYNC_FLAGS+=(--dry-run -v)
fi

echo "Deploying to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR} using key ${SSH_KEY}"
rsync "${RSYNC_FLAGS[@]}" \
  -e "ssh -i ${SSH_KEY}" \
  "${DEPLOY_PATHS[@]}" \
  "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}"

echo "Done."
