#!/bin/bash
# Proves timestamp-check.sh kills the false positives AND catches the fabricated-future case the old
# inline version passed 30 times in one session.
HOOK="$(dirname "$0")/timestamp-check.sh"
pass=0; fail=0
TODAY=$(date +%Y-%m-%d)
PAST=$(date -v-2H +%H:%M 2>/dev/null || date -d '2 hours ago' +%H:%M)
FUT=$(date -v+3H +%H:%M 2>/dev/null || date -d '3 hours' +%H:%M)

run() { printf '{"tool_input":{"content":%s}}' "$(printf '%s' "$1" | jq -Rs .)" | bash "$HOOK" \
        | jq -r '.hookSpecificOutput.additionalContext // ""'; }
assert() { local n="$1" needle="$2" want="$3" out; out="$(run "$4")"
  case "$out" in *"$needle"*) got=yes;; *) got=no;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1));
  else echo "  FAIL  $n (expected $want for '$needle')"; echo "        got: [$out]"; fail=$((fail+1)); fi; }

echo "timestamp-check.sh — proofs"
# THE case the old hook missed: a well-formed but impossible time.
assert "future time flagged as IMPOSSIBLE" "IMPOSSIBLE TIMESTAMP" yes "Measured $TODAY $FUT EDT during the run."
assert "past time is silent"               "TIMESTAMP CHECK"      no  "Measured $TODAY $PAST EDT during the run."
# The false positives that made the old hook noise.
assert "date-prefixed FILENAME silent"     "TIMESTAMP CHECK"      no  "See docs/specs/$TODAY-some-protocol.md for detail."
assert "CLI date argument silent"          "TIMESTAMP CHECK"      no  "Run: node x.mjs --from $TODAY --to $TODAY-x"
assert "backticked date silent"            "TIMESTAMP CHECK"      no  "The window is \`$TODAY\` in the config."
# The real miss it must still catch.
assert "bare prose date flagged"           "BARE DATE"            yes "Corrected on $TODAY after review."
# Both at once.
assert "both findings can co-occur"        "IMPOSSIBLE TIMESTAMP" yes "Filed $TODAY and measured $TODAY $FUT EDT."
assert "…and the bare-date half too"       "BARE DATE"            yes "Filed $TODAY and measured $TODAY $FUT EDT."
# Nothing dated at all.
assert "undated content silent"            "TIMESTAMP CHECK"      no  "Just some ordinary prose with no dates."
echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
