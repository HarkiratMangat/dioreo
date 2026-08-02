#!/bin/bash
# Proofs for timestamp-check.sh, in BOTH modes.
#
# `pre` can now DENY a write, so its false-positive surface is the dangerous one: a wrong deny
# stops work dead and gets the hook switched off. `post` stays advisory and only has to avoid noise.
#
# Every case below corresponds to something that actually happened, not a hypothetical:
#   · the fabricated-future stamp the old hook passed 30 times in one session
#   · the tomorrow-dated stamp neither old branch even looked at
#   · the backticked stamp that was exempt precisely where the fabrications landed
#   · the line-wrapped timestamp that read as a bare date (this hook did it to its own commit)
#   · the filename / CLI-arg false positives that made the original version noise

HOOK="$(cd "$(dirname "$0")" && pwd)/timestamp-check.sh"
pass=0; fail=0
TODAY=$(date +%Y-%m-%d)
TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d tomorrow +%Y-%m-%d)
PAST=$(date -v-2H '+%H:%M' 2>/dev/null || date -d '2 hours ago' '+%H:%M')
FUT=$(date -v+3H '+%H:%M' 2>/dev/null || date -d '3 hours' '+%H:%M')

# A hook that decides nothing prints nothing; jq on empty stdin also prints nothing. Catch empty
# BEFORE jq or every silent case reads as "" and the suite lies about which way it failed.
run() { # $1 = mode, $2 = content -> "deny:<reason>" | "<advisory text>" | "SILENT"
  local o; o=$(printf '{"tool_input":{"content":%s}}' "$(printf '%s' "$2" | jq -Rs .)" | bash "$HOOK" "$1")
  [ -z "$o" ] && { echo SILENT; return; }
  local d; d=$(printf '%s' "$o" | jq -r '.hookSpecificOutput.permissionDecision // empty')
  if [ -n "$d" ]; then printf 'deny:%s' "$(printf '%s' "$o" | jq -r '.hookSpecificOutput.permissionDecisionReason')"
  else printf '%s' "$o" | jq -r '.hookSpecificOutput.additionalContext // "SILENT"'; fi; }
a() { local n="$1" mode="$2" needle="$3" want="$4" out; out="$(run "$mode" "$5")"
  case "$out" in *"$needle"*) got=yes;; *) got=no;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1))
  else echo "  FAIL  $n (wanted $want for '$needle')"; echo "        got: [$out]"; fail=$((fail+1)); fi; }

echo "timestamp-check.sh — proofs"

echo "  -- pre mode: DENIES the impossible, blocks nothing else --"
a "future time today denied"        pre "deny:"             yes "Measured $TODAY $FUT EDT during the run."
a "TOMORROW's stamp denied"         pre "deny:"             yes "Filed $TOMORROW 09:00 EDT."
a "future stamp in BACKTICKS denied" pre "deny:"            yes "Shipped \`$TODAY $FUT EDT\` per the log."
a "past time not denied"            pre "deny:"             no  "Measured $TODAY $PAST EDT during the run."
a "bare date never denied"          pre "deny:"             no  "Corrected on $TODAY after review."
a "TS-EXAMPLE line is exempt"       pre "deny:"             no  "Illustration only: $TOMORROW 09:00 EDT (TS-EXAMPLE)."
a "undated content not denied"      pre "deny:"             no  "Ordinary prose with no dates at all."
a "a future DATE alone is allowed"  pre "deny:"             no  "Deadline: $TOMORROW — no clock time, deliberately."

echo "  -- post mode: advisory only --"
a "bare prose date flagged"         post "BARE DATE"        yes "Corrected on $TODAY after review."
a "past timestamp silent"           post "TIMESTAMP CHECK"  no  "Measured $TODAY $PAST EDT during the run."
a "date-prefixed FILENAME silent"   post "TIMESTAMP CHECK"  no  "See docs/specs/$TODAY-some-protocol.md for detail."
a "CLI date argument silent"        post "TIMESTAMP CHECK"  no  "Run: node x.mjs --from $TODAY --to $TODAY-x"
a "backticked bare date silent"     post "TIMESTAMP CHECK"  no  "The window is \`$TODAY\` in the config."
a "undated content silent"          post "TIMESTAMP CHECK"  no  "Just some ordinary prose with no dates."
a "future still reported in post"   post "IMPOSSIBLE"       yes "Measured $TODAY $FUT EDT during the run."

echo "  -- foreign timezones are out of scope, not violations --"
# A UTC stamp that is PAST in real terms but reads as future against the local clock. This gate
# denied exactly that on 2026-08-02 17:21 EDT while documenting a CI run, and GitHub API times are
# always UTC — so it would have recurred constantly.
UTCFUT=$(date -u -v+3H '+%H:%M' 2>/dev/null || date -u -d '3 hours' '+%H:%M')
a "explicit foreign TZ is skipped"  pre "deny:" no  "The run finished $TODAY $UTCFUT UTC per the API."
# …but the LOCAL zone spelled out must still be judged, or the escape swallows everything.
a "explicit LOCAL tz still denied"  pre "deny:" yes "Measured $TODAY $FUT $(date '+%Z') during the run."
a "no timezone at all still denied" pre "deny:" yes "Measured $TODAY $FUT during the run."

echo "  -- the line-wrap false positive (defect 4) --"
# A timestamp split across a wrapped comment must NOT read as a bare date. This is verbatim the
# shape that fired while writing main-push-guard.test.sh.
a "wrapped stamp is not a bare date" post "BARE DATE" no "$(printf '# it shipped %s\n# %s EDT with no test\n' "$TODAY" "$PAST")"
a "wrapped stamp in prose too"       post "BARE DATE" no "$(printf 'filed %s\n%s EDT\n' "$TODAY" "$PAST")"
# …and a wrapped FUTURE stamp must still be caught, not hidden by the rejoin.
a "wrapped future stamp still denied" pre "deny:" yes "$(printf '# filed %s\n# %s EDT\n' "$TODAY" "$FUT")"

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
