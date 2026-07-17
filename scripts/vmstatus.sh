#!/usr/bin/env bash
# Dior's Builds — GCP VM + bot health at a glance. Run from the Mac (needs gcloud).
#
#   scripts/vmstatus.sh            → health summary (VM state + bot service + gateway + resources + error count)
#   scripts/vmstatus.sh logs [N]   → summary, then tail N bot log lines (default 25)
#
# Added 2026-07-17 with the Render→GCP migration so we're never debugging blind again.
# The bot runs under systemd (unit: diors-bot) on VM 'diors-builds-bot' in us-east1-b.
set -uo pipefail
ZONE="us-east1-b"; VM="diors-builds-bot"
command -v gcloud >/dev/null 2>&1 || export PATH="/opt/homebrew/bin:$PATH"

echo "── VM ─────────────────────────────────────────"
gcloud compute instances describe "$VM" --zone="$ZONE" \
  --format="value(status,networkInterfaces[0].accessConfigs[0].natIP)" 2>/dev/null \
  | awk '{printf "  status: %-8s ip: %s\n",$1,$2}' \
  || echo "  ⚠️ could not reach VM (check gcloud auth / instance exists)"

echo "── Bot ────────────────────────────────────────"
# Remote script piped over SSH via stdin (avoids nested-quoting hell).
gcloud compute ssh "$VM" --zone="$ZONE" --quiet --command='bash -s' 2>/dev/null <<'REMOTE'
active=$(systemctl is-active diors-bot 2>/dev/null)
restarts=$(systemctl show diors-bot -p NRestarts --value 2>/dev/null)
since=$(systemctl show diors-bot -p ActiveEnterTimestamp --value 2>/dev/null)
lastshard=$(sudo journalctl -u diors-bot --no-pager 2>/dev/null | grep -iE "shard 0|authenticated|routing links" | tail -1 | sed 's/.*node\[[0-9]*\]: //')
errs=$(sudo journalctl -u diors-bot --no-pager --since "1 hour ago" 2>/dev/null | grep -ciE "error|10062|unhandled|disconnect|reconnecting")
ram=$(free -m | awk '/Mem:/{print $3"/"$2"MB"}')
load=$(cut -d" " -f1-3 /proc/loadavg)
disk=$(df -h / | awk 'NR==2{print $3"/"$2" ("$5")"}')
printf "  service: %s   restarts: %s\n" "${active:-unknown}" "${restarts:-?}"
printf "  up since: %s\n" "${since:-?}"
printf "  gateway:  %s\n" "${lastshard:-<no shard log yet>}"
printf "  errors(1h): %s   RAM: %s   load: %s   disk: %s\n" "${errs:-?}" "${ram:-?}" "${load:-?}" "${disk:-?}"
REMOTE

if [ "${1:-}" = "logs" ]; then
  N="${2:-25}"
  echo "── Last $N bot log lines ───────────────────────"
  gcloud compute ssh "$VM" --zone="$ZONE" --quiet \
    --command="sudo journalctl -u diors-bot --no-pager -n $N --output=cat" 2>/dev/null \
    | grep -vE "Warning: Permanently added"
fi
