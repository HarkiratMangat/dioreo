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
# ⚠️ DATE AND TIME MUST COME FROM THE SAME SHIFTED INSTANT — CI caught this, 2026-08-02 22:00 UTC.
# The first version took `$TODAY` from now and `$FUT` from now+3h *independently*. On the Mac (17:00
# EDT) that is harmlessly same-day; on the UTC CI runner at 22:00 it produced "today 01:00" — a PAST
# timestamp — so every "future is denied" case silently asserted the wrong thing and failed. Seven
# tests, one root cause: two halves of a timestamp read from two different moments.
#
# `when()` shifts once and formats once, on either BSD or GNU date, so the pair can never disagree.
when() { # $1 = offset like '+3H' / '-2H' / '+1d'  -> "YYYY-MM-DD HH:MM"
  date -v"$1" '+%Y-%m-%d %H:%M' 2>/dev/null && return
  local gnu="${1#+}"; gnu="${gnu/H/ hours}"; gnu="${gnu/d/ days}"
  case "$1" in -*) date -d "${gnu#-} ago" '+%Y-%m-%d %H:%M';; *) date -d "$gnu" '+%Y-%m-%d %H:%M';; esac
}
TODAY=$(date +%Y-%m-%d)
LOCALTZ=$(date '+%Z')
FUTSTAMP=$(when '+3H')            # a genuinely future date+time, whatever the zone or hour
PASTSTAMP=$(when '-2H')           # genuinely past, same guarantee
TOMORROWSTAMP="$(when '+1d' | cut -d' ' -f1) 09:00"

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
a "future time today denied"        pre "deny:"             yes "Measured $FUTSTAMP $LOCALTZ during the run."
a "TOMORROW's stamp denied"         pre "deny:"             yes "Filed $TOMORROWSTAMP $LOCALTZ."
a "future stamp in BACKTICKS denied" pre "deny:"            yes "Shipped \`$FUTSTAMP $LOCALTZ\` per the log."
a "past time not denied"            pre "deny:"             no  "Measured $PASTSTAMP $LOCALTZ during the run."
a "bare date never denied"          pre "deny:"             no  "Corrected on $TODAY after review."
a "TS-EXAMPLE line is exempt"       pre "deny:"             no  "Illustration only: $TOMORROWSTAMP $LOCALTZ (TS-EXAMPLE)."
# A REAL scheduled deadline carries a clock time on purpose — the window closes at an hour, not on a
# day — so "write it without a time" is not available. Added after this gate refused an edit that
# merely touched the line holding the MCP observation-window close-out.
a "TS-DEADLINE line is exempt"      pre "deny:"             no  "CLOSE OUT the window: $TOMORROWSTAMP $LOCALTZ (TS-DEADLINE)."
a "an UNMARKED future deadline still denies" pre "deny:"     yes "CLOSE OUT the window: $TOMORROWSTAMP $LOCALTZ."
a "undated content not denied"      pre "deny:"             no  "Ordinary prose with no dates at all."
a "a future DATE alone is allowed"  pre "deny:"             no  "Deadline: ${TOMORROWSTAMP%% *} — no clock time, deliberately."

echo "  -- post mode: advisory only --"
a "'on DATE' is prose, now silent" post "BARE DATE"        no  "Corrected on $TODAY after review."
a "past timestamp silent"           post "TIMESTAMP CHECK"  no  "Measured $PASTSTAMP $LOCALTZ during the run."
a "date-prefixed FILENAME silent"   post "TIMESTAMP CHECK"  no  "See docs/specs/$TODAY-some-protocol.md for detail."
a "CLI date argument silent"        post "TIMESTAMP CHECK"  no  "Run: node x.mjs --from $TODAY --to $TODAY-x"
a "backticked bare date silent"     post "TIMESTAMP CHECK"  no  "The window is \`$TODAY\` in the config."
a "undated content silent"          post "TIMESTAMP CHECK"  no  "Just some ordinary prose with no dates."
a "future still reported in post"   post "IMPOSSIBLE"       yes "Measured $FUTSTAMP $LOCALTZ during the run."

echo "  -- BARE DATE precision: prose names a day, a record stamps a moment --"
# Measured on 164 real lines added to main on 2026-08-02: the old rule fired 22 times and was right
# 4 times (18%). Every one of these suppressions is a shape that actually appeared in that corpus.
a "prose 'on DATE' silent"          post "BARE DATE" no  "Three separate times on $TODAY I passed the wrong flag."
a "prose 'from DATE' silent"        post "BARE DATE" no  "MEASURED from $TODAY, and this day counts."
a "article 'a DATE session' silent" post "BARE DATE" no  "A $TODAY session handoff asserted it was deleted."
# ⚠️ Only the word IMMEDIATELY before the date is examined, so "the actual DATE" is NOT
#    suppressed by the article. That is deliberate — widening it to "article + any adjective"
#    starts guessing at grammar. The real corpus line was QUOTED, and the quote strip is what
#    handles it; the case below pins that, and this one pins the deliberate limit.
a "'the ADJ DATE' still fires"     post "BARE DATE" yes "the actual $TODAY failure blocks on this."
a "prose 'by DATE' silent"          post "BARE DATE" no  "It had all landed by $TODAY without anyone noticing."
# A range BOUND is a date, not a moment — a clock time there would be wrong, not merely verbose.
a "range with arrow silent"         post "BARE DATE" no  "Baseline — control window 2026-07-24 → $TODAY"
a "range, date on the left, silent" post "BARE DATE" no  "The window is $TODAY → 2026-08-10 (exclusive)."
# A date inside a string literal is data, not a record.
a "date in a quoted literal silent" post "BARE DATE" no  "assert \"the actual $TODAY failure blocks\" block"
# An ENUMERATION of dates is data too. Added 2026-08-02 23:10 EDT after the branch fired on exactly
# this sentence, in a memory file being edited to explain the rule — a shape absent from the 164-line
# corpus the "100% precision" figure was measured on. The test is a comma adjacent to ANOTHER date,
# never a bare trailing comma: a stamp followed by a comma is still a stamp (see below), and a first
# attempt using [,;] alone would have silenced that while not even matching the list.
a "date list, today last, silent"   post "BARE DATE" no  "caught in three sessions (2026-07-24, 2026-07-26, $TODAY), each time"
a "date list, today first, silent"  post "BARE DATE" no  "sessions $TODAY, 2026-07-26 and 2026-07-24 all repeated it."
a "stamp + comma still fires"       post "BARE DATE" yes "A reasonable question, asked $TODAY, and nobody answered."
# …and the shapes that MUST still fire: these are record stamps missing their time.
a "'(added DATE)' still fires"      post "BARE DATE" yes "## Licence & attribution gates (added $TODAY)"
a "'UPDATED DATE:' still fires"     post "BARE DATE" yes "PATH UPDATED $TODAY: the spreadsheet moved out of the repo root."
a "'asked DATE:' still fires"       post "BARE DATE" yes "A reasonable question, asked $TODAY: where do these live?"
a "bare prose date alone fires"     post "BARE DATE" yes "Corrected $TODAY after review."

echo "  -- foreign timezones are out of scope, not violations --"
# A stamp in a zone that is NOT the local one cannot be compared against the local clock without
# conversion, so it is skipped. This gate denied a legitimate UTC stamp on 2026-08-02 17:21 EDT while
# documenting a CI run, and GitHub API times are always UTC — it would have recurred constantly.
# ⚠️ The label must be a zone the machine is NOT in, or the case proves nothing. CI runs in UTC and
# the Mac in EDT, so pick whichever the local zone is not.
if [ "$LOCALTZ" = "UTC" ]; then FOREIGNTZ=EST; else FOREIGNTZ=UTC; fi
a "explicit foreign TZ is skipped"  pre "deny:" no  "The run finished $FUTSTAMP $FOREIGNTZ per the API."
# …but the LOCAL zone spelled out must still be judged, or the escape swallows everything.
a "explicit LOCAL tz still denied"  pre "deny:" yes "Measured $FUTSTAMP $LOCALTZ during the run."
a "no timezone at all still denied" pre "deny:" yes "Measured $FUTSTAMP during the run."

echo "  -- the line-wrap false positive (defect 4) --"
# A timestamp split across a wrapped comment must NOT read as a bare date. This is verbatim the
# shape that fired while writing main-push-guard.test.sh.
a "wrapped stamp is not a bare date" post "BARE DATE" no "$(printf '# it shipped %s\n# %s '"$LOCALTZ"' with no test\n' "${PASTSTAMP%% *}" "${PASTSTAMP##* }")"
a "wrapped stamp in prose too"       post "BARE DATE" no "$(printf 'filed %s\n%s %s\n' "${PASTSTAMP%% *}" "${PASTSTAMP##* }" "$LOCALTZ")"
# …and a wrapped FUTURE stamp must still be caught, not hidden by the rejoin.
a "wrapped future stamp still denied" pre "deny:" yes "$(printf '# filed %s\n# %s %s\n' "${FUTSTAMP%% *}" "${FUTSTAMP##* }" "$LOCALTZ")"

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
