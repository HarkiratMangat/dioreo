#!/usr/bin/env bash
# Dior's Builds — GCP VM + bot health at a glance. Run from the Mac (needs gcloud).
#
#   scripts/vmstatus.sh                  → full instrument panel (VM · service · deploy · health · errors · alerts · activity)
#   scripts/vmstatus.sh logs             → panel, then the last 40 log lines
#   scripts/vmstatus.sh logs 120         → last 120 lines
#   scripts/vmstatus.sh logs 2h          → lines from the last 2 hours (up to 40)
#   scripts/vmstatus.sh logs 2h 60       → lines from the last 2 hours (up to 60)
#   scripts/vmstatus.sh logs 20h-5d      → from 5 days ago UP TO 20 hours ago (excludes the last 20h)
#   scripts/vmstatus.sh logs 30m-260h 200
#
# Time units: m/h/d only. History is 30 days, so weeks/months would be meaningless.
# A range is <newer>-<older>: the FIRST bound is the recent edge, the SECOND is how far back to go.
#
# Added 2026-07-17 with the Render→GCP migration so we're never debugging blind again.
# Overhauled 2026-07-28 15:34 EDT: Cloud Logging as the primary source, real per-line severity,
# per-line version+commit, time-window args, deploy-drift detection, and an error counter that is
# actually correct (see the ERROR ACCOUNTING note below).
#
# ⚠️ TARGETS BASH 3.2 — the stock /bin/bash on macOS, and the only bash on Harkirat's Mac (checked
# 2026-07-28 15:40 EDT: no homebrew bash installed). So NO associative arrays (`declare -A`), NO
# `${var^^}` case expansion, NO `mapfile`. `bash -n` does NOT catch these; they fail at runtime only.
# If you add bash 4+ syntax here, the script breaks on the one machine that runs it.
#
# The bot runs under systemd (unit: diors-bot) on VM 'diors-builds-bot' in us-east1-b.
set -uo pipefail

ZONE="us-east1-b"; VM="diors-builds-bot"; UNIT="diors-bot"
CLOUD_LOG="diors_bot"          # Ops Agent receiver id → Cloud Logging logName (scripts/ops-agent-config.yaml)
DEFAULT_LINES=40               # was 25 until 2026-07-28 15:34 EDT
FETCH_CAP=2000                 # upper bound on lines pulled per query; the bot emits ~56/day, so 30d ≈ 1700
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
command -v gcloud >/dev/null 2>&1 || export PATH="/opt/homebrew/bin:$PATH"

# ── Mac vs VM ────────────────────────────────────────────────────────────────
# This script is normally run FROM THE MAC and reaches the VM over SSH. But `scripts/deploy.sh` runs it
# ON the VM as its final post-restart check — which had been quietly half-broken since 2026-07-18 (the
# outward-facing `gcloud compute instances describe` needs the Mac's auth context and just reported
# "could not reach VM"), and the SSH-based rewrite would have made it far worse by trying to SSH into
# the VM from inside itself. Detect where we are and read everything locally when we're already there.
ON_VM=0
[ "$(hostname -s 2>/dev/null)" = "$VM" ] && ON_VM=1
HAVE_GCLOUD=0
command -v gcloud >/dev/null 2>&1 && HAVE_GCLOUD=1

# ── ERROR ACCOUNTING (read this before "fixing" the counter) ─────────────────────────────────────
# The old script grepped every log line's TEXT for /error|10062|unhandled|disconnect|reconnecting/.
# That counted routine `🔌 Shard 0 reconnecting...` gateway churn as errors — the long-standing
# "script says errors(1h)=1 but journalctl -p err says 0" discrepancy, root-caused 2026-07-28 15:10 EDT.
# `-p err` was equally useless: the bot logged everything to stdout, so journald tagged EVERY line
# priority 6 and `-p err` would have read 0 during a crash too. utils/logger.js fixed the source.
# Three tiers are now reported, deliberately kept separate because they answer different questions:
#   errors  — LogEntry.severity >= ERROR. Trustworthy only for logs written after logger.js shipped.
#   alerts  — AlertLog in Mongo (what actually pinged Harkirat). The authoritative incident record.
#   noise   — gateway reconnect/resume. Counted, shown, and NEVER added to the error total.
# If these three ever disagree, that disagreement is information. Do not collapse them into one number.

# ── presentation helpers ─────────────────────────────────────────────────────
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  B=$'\033[1m'; D=$'\033[2m'; R=$'\033[0m'
  GRN=$'\033[32m'; YEL=$'\033[33m'; RED=$'\033[31m'; CYN=$'\033[36m'
else
  B=""; D=""; R=""; GRN=""; YEL=""; RED=""; CYN=""
fi

gauge() {  # gauge <used> <total> [width]
  local used=$1 total=$2 width=${3:-12} filled i out=""
  case "$total" in ''|*[!0-9]*) total=0;; esac
  case "$used"  in ''|*[!0-9]*) used=0;;  esac
  [ "$total" -gt 0 ] || { printf '%*s' "$width" "" | tr ' ' '?'; return; }
  filled=$(( used * width / total )); [ "$filled" -gt "$width" ] && filled=$width
  i=0; while [ "$i" -lt "$width" ]; do
    if [ "$i" -lt "$filled" ]; then out="$out█"; else out="$out░"; fi
    i=$(( i + 1 ))
  done
  printf '%s' "$out"
}

pct_color() { if [ "$1" -lt 70 ]; then printf '%s' "$GRN"; elif [ "$1" -lt 90 ]; then printf '%s' "$YEL"; else printf '%s' "$RED"; fi; }

# MB → GB with one decimal. The awk program MUST stay single-quoted with the value passed via -v:
# an earlier version inlined the value inside a nested double-quoted "$(awk "BEGIN{printf \"%.1f\"...")"
# and bash ate the escaped quotes, leaving awk with a bare `BEGIN{ 4049/1024 }` syntax error.
gb() { awk -v m="${1:-0}" 'BEGIN{printf "%.1f", m/1024}'; }
section()   { printf '\n  %s%s%s\n' "$B" "$1" "$R"; }
row()       { printf '            %s\n' "$1"; }
head_row()  { printf '  %-9s %s\n' "" "$1"; }

# epoch → ISO-8601 UTC. macOS (BSD) and GNU date disagree on the flag, so try both rather than
# assuming coreutils is installed.
iso_at() { date -u -r "$1" "+%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "@$1" "+%Y-%m-%dT%H:%M:%SZ"; }

# epoch → the format journalctl's date parser actually accepts. It does NOT understand ISO-8601's `T`
# separator or a `Z` suffix, and rather than erroring it silently matches nothing — which made the
# fallback path report "0 lines" for windows that were full of logs.
journal_at() { date -u -r "$1" "+%Y-%m-%d %H:%M:%S UTC" 2>/dev/null || date -u -d "@$1" "+%Y-%m-%d %H:%M:%S UTC"; }

to_seconds() {  # "2h" / "45m" / "3d" → seconds; returns 1 on a malformed token
  local t=$1 n u
  [[ "$t" =~ ^([0-9]+)([mhd])$ ]] || return 1
  n="${BASH_REMATCH[1]}"; u="${BASH_REMATCH[2]}"
  case "$u" in m) echo $(( n * 60 ));; h) echo $(( n * 3600 ));; d) echo $(( n * 86400 ));; esac
}

human_secs() {
  local s=$1
  if   [ "$s" -ge 86400 ]; then printf '%dd %dh' $(( s/86400 )) $(( (s%86400)/3600 ))
  elif [ "$s" -ge 3600 ];  then printf '%dh %02dm' $(( s/3600 )) $(( (s%3600)/60 ))
  else printf '%dm' $(( s/60 )); fi
}

# ── remote probe: ONE SSH round-trip for everything the VM knows ─────────────
# Deliberately one call. Each `gcloud compute ssh` costs several seconds of connection setup and the
# old script paid it twice. Results are KEY=VALUE lines held in $PROBE; get() reads them.
# (bash 3.2 has no associative arrays — see the header warning.)
probe_vm() {
  # On the VM, feed the same script to a local shell instead of an SSH one. Identical body either way —
  # duplicating it into a "local version" is how the two drift apart and one silently stops being tested.
  if [ "$ON_VM" -eq 1 ]; then probe_runner() { bash -s; }; else
    probe_runner() { gcloud compute ssh "$VM" --zone="$ZONE" --quiet --command='bash -s' 2>/dev/null; }
  fi
  probe_runner <<REMOTE
U="$UNIT"
echo "ACTIVE=\$(systemctl is-active \$U 2>/dev/null)"
echo "RESTARTS=\$(systemctl show \$U -p NRestarts --value 2>/dev/null)"
echo "SINCE_H=\$(systemctl show \$U -p ActiveEnterTimestamp --value 2>/dev/null)"
echo "BOOT=\$(cut -d. -f1 /proc/uptime)"
free -m | awk '/Mem:/{print "RAM_USED="\$3"\nRAM_TOTAL="\$2"\nRAM_AVAIL="\$7}'
echo "LOAD=\$(cut -d' ' -f1-3 /proc/loadavg)"
echo "CPUS=\$(nproc)"
df -BM / | awk 'NR==2{gsub("M","",\$3); gsub("M","",\$2); print "DISK_USED="\$3"\nDISK_TOTAL="\$2}'
# Bot RSS broken out from system RSS on purpose: the raw "536/969MB" reading looked alarming for a long
# time and the answer turned out to be that the Ops Agent + guest agents account for ~127MB of it while
# the bot itself sits near 126MB. Showing only the total invites the same false alarm again.
# Match on the command LINE, not the command NAME: node renames its main thread, so \`ps -o comm\`
# reports "MainThread" and a \`-C node\` lookup silently returns 0 (which read as "the bot uses no
# memory" in the first version of this panel).
echo "BOT_RSS=\$(ps -eo rss,args 2>/dev/null | awk '/node .*index\.js/ && !/awk/ {s+=\$1} END{print int(s/1024)}')"
echo "AGENT_RSS=\$(ps -eo rss,comm 2>/dev/null | awk '/otelopscol|ops-agent|core_plugin|guest_telemetry|google_guest/{s+=\$1} END{print int(s/1024)}')"
echo "JRNL_SIZE=\$(sudo journalctl --disk-usage 2>/dev/null | grep -oE '[0-9.]+[KMG]' | tail -1)"
echo "JRNL_LINES=\$(sudo journalctl -u \$U --no-pager 2>/dev/null | wc -l | tr -d ' ')"
echo "JRNL_OLDEST=\$(sudo journalctl -u \$U --no-pager -o short-iso 2>/dev/null | head -1 | cut -d' ' -f1)"
echo "GATEWAY=\$(sudo journalctl -u \$U --no-pager 2>/dev/null | grep -iE 'shard 0|authenticated|routing links' | tail -1 | sed 's/.*node\[[0-9]*\]: //')"
echo "GATEWAY_AT=\$(sudo journalctl -u \$U --no-pager -o short-iso 2>/dev/null | grep -iE 'shard 0' | tail -1 | cut -d' ' -f1)"
echo "OPSAGENT=\$(systemctl is-active google-cloud-ops-agent 2>/dev/null)"
cd ~/diors-builds 2>/dev/null && {
  echo "RUN_COMMIT=\$(git rev-parse --short HEAD 2>/dev/null)"
  echo "RUN_VERSION=\$(node -p "require('./package.json').version" 2>/dev/null)"
  echo "DEPLOY_AT=\$(git log -1 --format=%cI 2>/dev/null)"
  if [ -f logs/app.log ]; then
    echo "SINK=\$(wc -l < logs/app.log | tr -d ' ') lines, \$(du -h logs/app.log | cut -f1)"
  else
    echo "SINK=absent (logger.js sink not yet deployed)"
  fi
}
# Alert tallies straight from the bot's own store — the authoritative incident record. Runs inside the
# repo so it reuses the bot's .env and Mongoose models instead of duplicating connection logic here.
cd ~/diors-builds 2>/dev/null && timeout 25 node -e "
require('dotenv').config({quiet:true});
const m=require('mongoose');
m.connect(process.env.MONGODB_URI).then(async()=>{
  const {getAlertSummary}=require('./utils/alertStore');
  const s=await getAlertSummary();
  const f=t=>[t.error,t.warn,t.caution,t.info].join('/');
  console.log('ALERT_24H='+f(s.last24h));
  console.log('ALERT_7D='+f(s.last7d));
  console.log('ALERT_TOTAL='+s.total);
  console.log('ALERT_LAST='+(s.lastError?s.lastError.alertId+' · '+new Date(s.lastError.createdAt).toISOString().slice(0,16).replace('T',' ')+' UTC · '+s.lastError.title:'none in 30d'));
  process.exit(0);
}).catch(()=>{console.log('ALERT_TOTAL=? (Mongo unreachable)');process.exit(0);});
" 2>/dev/null
REMOTE
}

now=$(date +%s)

# ── argument parsing ─────────────────────────────────────────────────────────
# Deliberately BEFORE the panel renders. The panel costs an SSH round-trip plus several Cloud Logging
# queries (measured ~10s on 2026-07-28 18:05 EDT), and validating afterwards meant a typo'd window made
# you wait out the whole probe just to be told you'd mistyped it. Parse first, fail fast, then do the
# slow work. (The `#` on the third line here went missing at some point, so a fragment of this very
# comment was being executed as a command — it printed "you: command not found" on every single run.)
WANT_LOGS=0; LINES=$DEFAULT_LINES; SINCE=""; UNTIL=""; WINDOW_LABEL="last 30d"; WINDOW_ARG=""
if [ "${1:-}" = "logs" ]; then
  WANT_LOGS=1; shift
  for arg in "$@"; do
    if [[ "$arg" =~ ^[0-9]+$ ]]; then
      LINES="$arg"
    elif [[ "$arg" =~ ^([0-9]+[mhd])-([0-9]+[mhd])$ ]]; then
      # <newer>-<older>: `20h-5d` = from 5 days ago UP TO 20 hours ago, EXCLUDING the last 20h.
      newer=$(to_seconds "${BASH_REMATCH[1]}") || { echo "bad time: ${BASH_REMATCH[1]}" >&2; exit 1; }
      older=$(to_seconds "${BASH_REMATCH[2]}") || { echo "bad time: ${BASH_REMATCH[2]}" >&2; exit 1; }
      if [ "$newer" -ge "$older" ]; then
        printf '⚠ "%s" reads as <newer>-<older>, but %s is not more recent than %s.\n' \
          "$arg" "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}" >&2
        exit 1
      fi
      SINCE=$(( now - older )); UNTIL=$(( now - newer )); WINDOW_LABEL="$arg"; WINDOW_ARG="$arg"
    elif [[ "$arg" =~ ^[0-9]+[mhd]$ ]]; then
      s=$(to_seconds "$arg") || { echo "bad time: $arg" >&2; exit 1; }
      SINCE=$(( now - s )); WINDOW_LABEL="last $arg"; WINDOW_ARG="$arg"
    else
      printf '⚠ unrecognised argument "%s". Times are m/h/d (2h, 30m, 3d) or a range (20h-5d); a bare number is a line count.\n' "$arg" >&2
      exit 1
    fi
  done
  [ -n "$SINCE" ] || SINCE=$(( now - 2592000 ))   # no window → whole 30d retention, newest N shown
elif [ -n "${1:-}" ]; then
  printf '⚠ unknown subcommand "%s". Usage: vmstatus.sh [logs [<time>] [<lines>]]\n' "$1" >&2
  exit 1
fi

PROBE="$(probe_vm)"
get() { printf '%s\n' "$PROBE" | sed -n "s/^$1=//p" | head -1; }

# ── Cloud Logging ────────────────────────────────────────────────────────────
# Primary source: real severity, arbitrary time ranges, 30-day retention, no SSH round-trip.
# Fetched in bulk ONCE per concern and bucketed locally — an earlier draft issued 19 sequential
# `gcloud logging read` calls for the counters alone, which took ~30s for a "status at a glance".
# ISO-8601 UTC sorts lexicographically, so a string compare is a valid time compare and we never have
# to parse a timestamp back into epoch (BSD awk has no mktime()).
cl_read() {  # cl_read <extra-filter> <since-epoch> [until-epoch] [format]
  # Skipped entirely on the VM: the instance's service account is provisioned to WRITE logs, not read
  # them back, and deploy.sh calls this script as its post-restart check — paying those API round-trips
  # there (for counters that would come back empty) would turn every deploy into a coffee break.
  [ "$HAVE_GCLOUD" -eq 1 ] && [ "$ON_VM" -eq 0 ] || return 0
  local extra=$1 since=$2 until=${3:-} fmt=${4:-value(timestamp)}
  local f="logName:\"logs/$CLOUD_LOG\" AND timestamp>=\"$(iso_at "$since")\""
  [ -n "$until" ] && f="$f AND timestamp<=\"$(iso_at "$until")\""
  [ -n "$extra" ] && f="$f AND $extra"
  gcloud logging read "$f" --limit="$FETCH_CAP" --format="$fmt" 2>/dev/null
}
count_since() { awk -v b="$1" '$1 >= b' | grep -c . ; }   # stdin = timestamp-first lines

BOXW=62
bar() { i=0; out=""; while [ "$i" -lt "$1" ]; do out="$out─"; i=$(( i + 1 )); done; printf '%s' "$out"; }
stamp="$(date '+%Y-%m-%d %H:%M %Z')"
printf '%s╭─ DIOR'"'"'S BUILDS %s %s ─╮%s\n' "$CYN" "$(bar $(( BOXW - 18 - ${#stamp} )))" "$stamp" "$R"
active="$(get ACTIVE)"; active="${active:-unknown}"
if [ "$active" = "active" ]; then
  verdict="${GRN}● RUNNING${R}"
else
  verdict="${RED}● $(printf '%s' "$active" | tr '[:lower:]' '[:upper:]')${R}"
fi
printf '%s│%s  %s   v%s · %s\n' "$CYN" "$R" "$verdict" "$(get RUN_VERSION)" "$(get RUN_COMMIT)"
printf '%s╰%s╯%s\n' "$CYN" "$(bar $(( BOXW - 2 )))" "$R"

section "VM"
boot="$(get BOOT)"
if [ "$ON_VM" -eq 1 ]; then
  # `instances describe` queries the VM from OUTSIDE and needs the Mac's gcloud context; from inside it
  # only ever returned "could not reach VM", which read like a fault rather than a wrong vantage point.
  head_row "${D}(running ON the VM — hypervisor-level state needs the Mac's gcloud context)${R}"
  row "$(hostname -s)      booted $([ -n "$boot" ] && human_secs "$boot" || echo '?') ago"
else
  vm_line=$(gcloud compute instances describe "$VM" --zone="$ZONE" \
    --format="value(status,networkInterfaces[0].accessConfigs[0].natIP,machineType.basename())" 2>/dev/null)
  vm_status=$(printf '%s' "$vm_line" | awk '{print $1}')
  vm_ip=$(printf '%s' "$vm_line" | awk '{print $2}')
  vm_type=$(printf '%s' "$vm_line" | awk '{print $3}')
  if [ "$vm_status" = "RUNNING" ]; then vs="${GRN}● RUNNING${R}"; else vs="${RED}● ${vm_status:-UNREACHABLE}${R}"; fi
  head_row "$vs  $VM · $ZONE · ${vm_type:-?}"
  row "${vm_ip:-?}      booted $([ -n "$boot" ] && human_secs "$boot" || echo '?') ago"
fi

section "SERVICE"
head_row "$verdict   restarts $(get RESTARTS)   up since $(get SINCE_H)"
gw_at="$(get GATEWAY_AT)"
row "gateway  $(get GATEWAY)${gw_at:+  ·  $gw_at}"

section "DEPLOY"
git -C "$REPO_DIR" fetch --quiet origin main 2>/dev/null
main_commit=$(git -C "$REPO_DIR" rev-parse --short origin/main 2>/dev/null)
main_version=$(git -C "$REPO_DIR" show origin/main:package.json 2>/dev/null | sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' | head -1)
run_commit="$(get RUN_COMMIT)"; run_version="$(get RUN_VERSION)"
behind=$(git -C "$REPO_DIR" rev-list --count "${run_commit}..origin/main" 2>/dev/null)
if [ -n "$run_commit" ] && [ -n "${behind:-}" ]; then
  if [ "$behind" -eq 0 ]; then
    head_row "${GRN}● up to date${R}   running ${run_commit} (v${run_version})"
  else
    head_row "${YEL}⚠ ${behind} commits behind${R}   running ${run_commit} (v${run_version})"
    row "main at ${main_commit} (v${main_version:-?}) — deploy with ./scripts/deploy.sh on the VM"
  fi
else
  head_row "running ${run_commit:-?} (v${run_version:-?})   main ${main_commit:-?} (v${main_version:-?})"
fi
row "last deploy  $(get DEPLOY_AT)"

section "HEALTH"
ru=$(get RAM_USED); rt=$(get RAM_TOTAL); du_=$(get DISK_USED); dt=$(get DISK_TOTAL)
ru=${ru:-0}; rt=${rt:-1}; du_=${du_:-0}; dt=${dt:-1}
rp=$(( ru * 100 / rt )); dp=$(( du_ * 100 / dt ))
head_row "RAM   $(gauge "$ru" "$rt")  ${ru}/${rt} MB  $(pct_color $rp)(${rp}%)${R}"
row "      ${D}bot $(get BOT_RSS)MB · agents $(get AGENT_RSS)MB · avail $(get RAM_AVAIL)MB${R}"
head_row "CPU   $(gauge 0 100)  load $(get LOAD)  ($(get CPUS) vCPU)"
head_row "DISK  $(gauge "$du_" "$dt")  $(gb "$du_")/$(gb "$dt") GB  $(pct_color $dp)(${dp}%)${R}"
row "JRNL  $(get JRNL_LINES) lines · $(get JRNL_SIZE) · since $(get JRNL_OLDEST)"
row "SINK  $(get SINK)   ops-agent $(get OPSAGENT)"

section "ERRORS"
err_ts="$(cl_read 'severity>="ERROR"' $(( now - 2592000 )))"
warn_ts="$(cl_read 'severity="WARNING"' $(( now - 604800 )))"
e1h=$(printf '%s\n' "$err_ts" | count_since "$(iso_at $(( now - 3600 )))")
e12=$(printf '%s\n' "$err_ts" | count_since "$(iso_at $(( now - 43200 )))")
e48=$(printf '%s\n' "$err_ts" | count_since "$(iso_at $(( now - 172800 )))")
e7d=$(printf '%s\n' "$err_ts" | count_since "$(iso_at $(( now - 604800 )))")
e30=$(printf '%s\n' "$err_ts" | grep -c . )
w7d=$(printf '%s\n' "$warn_ts" | grep -c . )
if [ "$e30" -eq 0 ]; then ec="$GRN"; else ec="$RED"; fi
head_row "${ec}1h ${e1h}    12h ${e12}    48h ${e48}    7d ${e7d}    30d ${e30}${R}"
row "warnings (7d)  ${w7d}"
# A zero that means "no data" must never be displayed as if it meant "no errors" — that conflation is
# the exact failure this whole overhaul exists to fix. If the structured sink isn't reporting, say so
# loudly instead of showing a reassuring row of zeros.
if [ "$ON_VM" -eq 1 ] || [ "$HAVE_GCLOUD" -eq 0 ]; then
  row "${YEL}⚠ NOT LIVE — Cloud Logging is only queried from the Mac. Re-run there for real${R}"
  row "${YEL}  counts; the ALERTS block below is accurate from anywhere.${R}"
fi
case "$(get SINK)" in
  absent*)
    row "${YEL}⚠ NOT LIVE — the structured log sink is not deployed on this VM, so Cloud${R}"
    row "${YEL}  Logging holds no diors_bot entries. These zeros mean NO DATA, not no${R}"
    row "${YEL}  errors. Trust the ALERTS block below until ./scripts/deploy.sh has run.${R}"
    ;;
esac

# 24h of everything, reused for BOTH the noise line and the activity sparkline — one fetch, two uses.
day_ts="$(cl_read '' $(( now - 86400 )) '' 'value(timestamp,jsonPayload.message)')"
noise=$(printf '%s\n' "$day_ts" | grep -ciE 'shard|reconnect|resumed' )
row "${D}noise  ${noise} gateway reconnect/resume lines in 24h — excluded from the counts above${R}"

section "ALERTS"
head_row "24h  err/warn/caution/info = $(get ALERT_24H)"
row "7d   err/warn/caution/info = $(get ALERT_7D)      store $(get ALERT_TOTAL)/1000"
row "last error: $(get ALERT_LAST)"

section "ACTIVITY"
# Log-line volume per hour over the last 12h. Labelled honestly as LOG VOLUME rather than dressed up
# as an interaction count — the bot does not log per-interaction, so an "interactions/hr" figure would
# be invented. Volume still reads as a useful liveness/incident signal.
counts=""; peak=0; i=11
while [ "$i" -ge 0 ]; do
  lo="$(iso_at $(( now - (i+1)*3600 )))"; hi="$(iso_at $(( now - i*3600 )))"
  c=$(printf '%s\n' "$day_ts" | awk -v a="$lo" -v b="$hi" '$1 >= a && $1 < b' | grep -c . )
  counts="$counts $c"; [ "$c" -gt "$peak" ] && peak=$c
  i=$(( i - 1 ))
done
spark=""
for c in $counts; do
  if [ "$peak" -eq 0 ]; then spark="$spark▁"; else
    case $(( c * 7 / peak )) in
      0) spark="$spark▁";; 1) spark="$spark▂";; 2) spark="$spark▃";; 3) spark="$spark▄";;
      4) spark="$spark▅";; 5) spark="$spark▆";; 6) spark="$spark▇";; *) spark="$spark█";;
    esac
  fi
done
head_row "$spark  log lines/hr, last 12h (peak ${peak}/hr)"
echo

# ── logs subcommand ──────────────────────────────────────────────────────────
[ "$WANT_LOGS" -eq 1 ] || exit 0

# Cloud Logging first; journald over SSH as the fallback, so the script never hard-depends on the
# GCP logging API staying healthy — losing the nicer source must not mean losing the logs.
raw="$(cl_read '' "$SINCE" "$UNTIL" 'value(timestamp,jsonPayload.version,jsonPayload.commit,severity,jsonPayload.message)')"
source_name="Cloud Logging"
if [ -z "$raw" ]; then
  source_name="journald fallback"
  raw=$(gcloud compute ssh "$VM" --zone="$ZONE" --quiet \
    --command="sudo journalctl -u $UNIT --no-pager -o short-iso --since '$(journal_at "$SINCE")' ${UNTIL:+--until '$(journal_at "$UNTIL")'}" 2>/dev/null \
    | grep -vE "Warning: Permanently added")
fi

total=$(printf '%s\n' "$raw" | grep -c . )
printf '%s── logs · %s · %s lines · via %s ───────────────%s\n' "$B" "$WINDOW_LABEL" "$total" "$source_name" "$R"

if [ "$total" -eq 0 ]; then
  printf '  %s(no log lines in this window)%s\n' "$D" "$R"
  exit 0
fi

# Cloud Logging returns newest-first; take the newest N, then flip so it reads oldest-first like a tail.
# The journald fallback is already oldest-first, so only reverse when the source was Cloud Logging.
if [ "$source_name" = "Cloud Logging" ]; then
  printf '%s\n' "$raw" | grep . | head -n "$LINES" | awk '{a[NR]=$0} END{for(i=NR;i>0;i--) print a[i]}'
else
  printf '%s\n' "$raw" | grep . | tail -n "$LINES"
fi

if [ "$total" -gt "$LINES" ]; then
  printf '\n%s  ↑ showing %s of %s lines in this window. Re-run with a higher count to see the rest:%s\n' \
    "$YEL" "$LINES" "$total" "$R"
  printf '    scripts/vmstatus.sh logs %s%s\n' "${WINDOW_ARG:+$WINDOW_ARG }" "$total"
fi
if [ "$total" -ge "$FETCH_CAP" ]; then
  printf '%s  (capped at %s fetched lines — narrow the window for an exact total)%s\n' "$D" "$FETCH_CAP" "$R"
fi
