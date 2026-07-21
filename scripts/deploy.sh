#!/usr/bin/env bash
# Dior's Builds — VM-side deploy. Run ON the GCP VM (from anywhere; it cd's to the repo root itself) to
# pull the latest code and restart the bot under systemd. Added 2026-07-20.
#
# Why this exists: the bot can't natively tell WHY systemd started it (deliberate deploy vs an unattended
# crash-restart). This script writes a `.restart-reason` marker (gitignored) right before the restart, so
# the bot's "Bot online" alert can LABEL the restart. On boot the bot reads + consumes that marker
# (index.js's readRestartReason). No marker => the alert reads "automatic/unattended restart".
#
#   ./scripts/deploy.sh          → deploy: git pull, mark "deploy", restart, status
#   ./scripts/deploy.sh manual   → restart WITHOUT pulling (mark "manual") — e.g. to apply an .env change
#
# NOTE: this replaces the old manual command sequence (`git pull && sudo systemctl restart diors-bot`).
# Using it is what makes the manual-vs-auto restart labeling work — a bare `systemctl restart` that skips
# this script will (correctly) show up as an "automatic/unattended restart".
set -euo pipefail
cd "$(dirname "$0")/.."   # repo root, regardless of where invoked from
REASON="${1:-deploy}"

if [ "$REASON" = "deploy" ]; then
  echo "── git pull ──"
  git pull
fi

# Written immediately before the restart so it's freshest, and so a failed `git pull` (set -e aborts
# above) leaves NO marker to mislabel a later restart. Format: "<reason> <unix-seconds>".
echo "$REASON $(date -u +%s)" > .restart-reason
echo "── restart diors-bot ($REASON) ──"
sudo systemctl restart diors-bot

echo "── status ──"
sleep 2
"$(dirname "$0")/vmstatus.sh" || true
