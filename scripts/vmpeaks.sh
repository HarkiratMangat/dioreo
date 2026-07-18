#!/usr/bin/env bash
# Dior's Builds — historical CPU-utilization PEAKS over rolling windows, from GCP Cloud Monitoring.
# Run from the Mac (needs gcloud). Added 2026-07-17 (Render→GCP migration observability).
#
#   scripts/vmpeaks.sh   → peak CPU over 12h / 24h / 72h / 7d / 30d
#
# NOTES:
#  - CPU history is retained by GCP automatically (hypervisor-level) — NO Ops Agent needed.
#  - RAM peaks DO need the guest-level Ops Agent (guest memory is invisible to GCP without it). The
#    Ops Agent was installed on the VM 2026-07-17, so the RAM section below is now live. Its metrics
#    only START from install time, so the longer windows (7d/30d) will read "(no data ... yet)" until
#    enough history accrues — that's expected, not a failure. RAM uses agent.googleapis.com/memory/
#    percent_used (state="used"), already a 0-100 percentage (no ×100, unlike CPU's 0-1 fraction).
#  - e2-micro is shared-core/burstable, so cpu/utilization is normalized to its 0.25-vCPU BASELINE:
#    values >100% mean the VM BURST above baseline (normal, designed behavior). A brief spike is fine;
#    a SUSTAINED high peak across the longer windows is the thing to watch.
set -uo pipefail
PROJECT="gen-lang-client-0549308254"; ZONE="us-east1-b"; VM="diors-builds-bot"
command -v gcloud >/dev/null 2>&1 || export PATH="/opt/homebrew/bin:$PATH"

IID=$(gcloud compute instances describe "$VM" --zone="$ZONE" --format="value(id)" 2>/dev/null)
TOKEN=$(gcloud auth print-access-token 2>/dev/null)
END=$(date -u +%Y-%m-%dT%H:%M:%SZ)
NOW=$(date -u +%s)

peak() { # $1=label  $2=seconds
  local start v
  start=$(date -u -r $((NOW - $2)) +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d "@$((NOW - $2))" +%Y-%m-%dT%H:%M:%SZ)
  v=$(curl -s -G "https://monitoring.googleapis.com/v3/projects/$PROJECT/timeSeries" \
      -H "Authorization: Bearer $TOKEN" \
      --data-urlencode 'filter=metric.type="compute.googleapis.com/instance/cpu/utilization" AND resource.label.instance_id="'"$IID"'"' \
      --data-urlencode "interval.startTime=$start" \
      --data-urlencode "interval.endTime=$END" \
      --data-urlencode "aggregation.alignmentPeriod=$2s" \
      --data-urlencode "aggregation.perSeriesAligner=ALIGN_MAX" \
      2>/dev/null | jq -r '[.timeSeries[]?.points[]?.value.doubleValue] | max // empty' 2>/dev/null)
  if [ -n "$v" ] && [ "$v" != "null" ]; then
    printf "  %-5s peak CPU: %s\n" "$1" "$(awk -v x="$v" 'BEGIN{printf "%.1f%%", x*100}')"
  else
    printf "  %-5s (no data in window yet)\n" "$1"
  fi
}

rampeak() { # $1=label  $2=seconds — peak guest RAM %USED (Ops Agent metric; already 0-100, no ×100)
  local start v
  start=$(date -u -r $((NOW - $2)) +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d "@$((NOW - $2))" +%Y-%m-%dT%H:%M:%SZ)
  v=$(curl -s -G "https://monitoring.googleapis.com/v3/projects/$PROJECT/timeSeries" \
      -H "Authorization: Bearer $TOKEN" \
      --data-urlencode 'filter=metric.type="agent.googleapis.com/memory/percent_used" AND resource.label.instance_id="'"$IID"'" AND metric.label.state="used"' \
      --data-urlencode "interval.startTime=$start" \
      --data-urlencode "interval.endTime=$END" \
      --data-urlencode "aggregation.alignmentPeriod=$2s" \
      --data-urlencode "aggregation.perSeriesAligner=ALIGN_MAX" \
      2>/dev/null | jq -r '[.timeSeries[]?.points[]?.value.doubleValue] | max // empty' 2>/dev/null)
  if [ -n "$v" ] && [ "$v" != "null" ]; then
    printf "  %-5s peak RAM: %s\n" "$1" "$(awk -v x="$v" 'BEGIN{printf "%.1f%%", x}')"
  else
    printf "  %-5s (no data in window yet)\n" "$1"
  fi
}

echo "── CPU peaks (Cloud Monitoring · >100% = bursting above e2-micro baseline, normal) ──"
peak "12h" 43200
peak "24h" 86400
peak "72h" 259200
peak "7d"  604800
peak "30d" 2592000
echo "── RAM peaks (Cloud Monitoring · Ops Agent · % of guest RAM used · e2-micro = 1 GB) ──"
rampeak "12h" 43200
rampeak "24h" 86400
rampeak "72h" 259200
rampeak "7d"  604800
rampeak "30d" 2592000
