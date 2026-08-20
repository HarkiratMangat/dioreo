#!/usr/bin/env bash
# .claude/hooks/self-check.test.sh -- self-test for self-check.sh (added 2026-08-11 21:08 EDT, rebuilt 2026-08-20 12:25 EDT).
#
# ⚠️ WHAT THIS IS ACTUALLY GUARDING, because it is not "does the hook print something". The hook carries a SECOND COPY of the model-selection grid, duplicated from the `reference_priority_tier_system` memory. That copy was accepted knowingly -- a pointer is what measurably failed -- but duplicated state rots silently, and the values that rot are precisely the ones that discriminate between cells. So this pins the DISCRIMINATING content, not the prose: the axis definitions, the corner cells, the retired-cell rule, both OFF-GRID moves, and the anti-calibration rule. Reword the surrounding text freely; change a cell or drop one of those and the suite fails.
#
# ⚠️ It also pins the five MODES added 2026-08-20 12:25 EDT. Those exist because Harkirat measured two failures in the field: sessions re-emitting the rename+model line on nearly every prompt, and sessions picking a cell pre-emptively rather than deriving it. A mode that silently stops working would restore both with no other symptom -- the hook would still print a perfectly good grid forever.
#
# ⚠️ And it pins the SINGLE-SOURCE property: the printed table is rendered from `cell_for()`, so the validator cannot drift away from the grid it validates against. That check fails if anyone re-introduces a hand-written table.
#
# ⚠️ It pins `hookEventName`, whose absence makes the whole payload SILENTLY DISCARDED -- the failure that left two hooks dead for weeks while exiting 0 and printing valid JSON.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$HERE/self-check.sh"
fails=0
pass=0

ok()  { pass=$((pass + 1)); printf '  PASS  %s\n' "$1"; }
bad() { fails=$((fails + 1)); printf '  FAIL  %s\n        %s\n' "$1" "$2"; }

check()  { if printf '%s' "$OUT" | grep -qF -- "$2"; then ok "$1"; else bad "$1" "missing: $2"; fi; }
absent() { if printf '%s' "$OUT" | grep -qF -- "$2"; then bad "$1" "present but must NOT be: $2"; else ok "$1"; fi; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
# Runs the hook against a fixture transcript and leaves the injected context in $OUT. ⚠️ Every call site carries a trailing `# MG-EXAMPLE` so that THIS FILE's text, once it lands in a real session transcript as tool-call output, is not read by the hook as a genuine recommendation. It must sit AFTER the closing quote: put it on the opening line of a multi-line fixture and it goes INSIDE the string, excluding the fixture's own derivation and silently converting a mode test into a mode-1 test. That happened on the first attempt and mode 4 failed loudly, which is the only reason it was caught.
run_with() {
    printf '%s\n' "$1" > "$TMP/t.jsonl"
    OUT="$(printf '{"transcript_path":"%s/t.jsonl"}' "$TMP" | bash "$HOOK" 2>/dev/null | jq -r '.hookSpecificOutput.additionalContext')"
}
run_bare() { OUT="$(printf '{}' | bash "$HOOK" 2>/dev/null | jq -r '.hookSpecificOutput.additionalContext')"; }

printf '\nself-check.sh — the model grid, and the five modes that decide how much of it to show\n\n'

# ===========================================================================
# MODE 1 — no derivation on record: the full grid, plus the FIRST ACTION gate.
# ===========================================================================
RAW="$(printf '{}' | bash "$HOOK" 2>/dev/null)" || { printf '  FAIL  hook exited non-zero\n'; exit 1; }
if printf '%s' "$RAW" | jq -e '.hookSpecificOutput.hookEventName == "UserPromptSubmit"' >/dev/null 2>&1; then
    ok 'emits hookEventName (without it the payload is silently discarded)'
else
    bad 'emits hookEventName' 'missing or wrong -- payload would reach nobody'
fi

run_bare
check 'mode 1: carries the FIRST ACTION gate' 'FIRST ACTION'
check 'mode 1: carries the CHAPTERS nudge' 'CHAPTERS'
check 'mode 1: carries the JUDGMENT RULES' 'JUDGMENT RULES'

# --- Axis definitions. These are the two facts whose ABSENCE caused two wrong picks on 2026-08-11: the grid was named everywhere and defined nowhere that loads.
check 'defines premise risk (High = the framing itself is in question)' 'the task IS working out whether the framing is right'
check 'defines deliberation load as PLACES' 'Low = ONE place'
check 'warns that Axis B is not thinking difficulty' 'never how hard the thinking is'

# --- Corner cells. If a cell changes here without changing the memory, one of them is wrong.
check 'cell: Premise Low x Delib Low' 'Sonnet5-Low'
check 'cell: Premise Low x Delib Very high' 'Sonnet5-XHigh'
check 'cell: Premise High x Delib Low' 'Opus5-Medium'
check 'cell: Premise High x Delib Very high' 'Opus5-Max'

# --- The rule that made the OVER-CORRECTION wrong, which a bare table would not convey.
check 'states that Sonnet5-Low is retired' 'RETIRED'
check 'states the practical floor' 'floor is Sonnet5-Medium'

# --- Anti-wobble and event-driven escalation.
check 'forbids naming a range' 'ONE cell, never a range'
check 'requires event-driven escalation' 'never pre-emptively'
check 'carries the tie-break question' 'missed one of many things'

# --- The three things the hook was MISSING until 2026-08-20 while claiming "needs no file read". A
#     session working from the hook alone could not reach either off-grid cell: the twelve-cell table
#     read as complete and was not.
check 'off-grid: Sonnet5-Max, with its trigger' 'Sonnet5-Max'
check 'off-grid: Sonnet5-Max names the script alternative' 'WRITING A SCRIPT'
check 'off-grid: Opus5-Low, the downshift' 'Opus5-Low'
check 'off-grid: Opus5-Low names its fallback' 'it is Sonnet5-Medium'
check 'forbids calibrating on past usage' 'DO NOT calibrate on Harkirat'

# --- The SHAPE requirement is the whole anti-pre-emption mechanism. Without it, a bare cell plus a
#     justification satisfies every gate -- which is exactly what was happening in the field.
check 'demands the derivation shape' 'Premise <Low|Med|High>'
check 'explains why a bare cell is not enough' 'A bare cell with a justification'

# --- Single-source proof: the printed table must be RENDERED from cell_for(), not a second literal.
if grep -q 'tbl_row' "$HOOK" && ! grep -qE '^\s*Premise (Low|Med|High)[[:space:]]+\| Sonnet5' "$HOOK"; then
    ok 'printed table is RENDERED from cell_for(), not a hand-written second copy'
else
    bad 'printed table is rendered from cell_for()' 'found a literal table in the source -- the validator can now drift from the grid it validates against'
fi

# ===========================================================================
# MODE 2 — a valid derivation on record: short block, and the rename gate goes QUIET. The fix for "sessions give me the model recommendation on nearly every prompt".
# ===========================================================================
run_with '{"type":"assistant","text":"Sonnet5-H · Some task · Aug 20. Premise Low · Delib High → Sonnet5-High for this one."}'   # MG-EXAMPLE
check  'mode 2: says the derivation is on record' 'Derivation on record'
check  'mode 2: tells the session NOT to repeat the rename+model' 'do NOT repeat either'
check  'mode 2: names the only reasons to re-state' 'drastically pivots'
absent 'mode 2: DROPS the FIRST ACTION gate' 'FIRST ACTION'
absent 'mode 2: DROPS the full table' 'Opus5-Max'   # table-only string: a vacuous 'Delib Very high' passed here for free
check  'mode 2: keeps the escalation triggers' 'never pre-emptively'
check  'mode 2: keeps the off-grid moves reachable' 'Opus5-Low'

# ===========================================================================
# MODE 3 — the stated cell contradicts the stated axes. The pre-emptive pick, caught.
# ===========================================================================
run_with '{"type":"assistant","text":"Premise Low · Delib Med → Opus5-XHigh because this is complex."}'   # MG-EXAMPLE
check 'mode 3: flags the mismatch' 'DOES NOT MATCH THE TABLE'
check 'mode 3: quotes what was written' 'Premise Low · Delib Med -> Opus5-XHigh'
check 'mode 3: names the cell the table actually gives' 'is: Sonnet5-Medium'
check 'mode 3: names the failure mode by name' 'the axes written to fit it'
check 'mode 3: re-shows the grid so it can be re-derived' 'Opus5-Max'

# --- 🔴 SELF-REFERENCE. The correction quotes the stated derivation verbatim, so without the escape
#     the hook's own output matches its own detector: the echo lands in the transcript and becomes
#     evidence for the next firing. Found by the completeness sweep, not by design.
# ⚠️ NO `-o` here, deliberately: -o prints only the matched span, which ENDS before the trailing
#    MG-EXAMPLE -- so an -o pipeline can never see the escape and the check fails even when correct.
#    That is exactly what happened on the first attempt. Match whole LINES.
if printf '%s' "$OUT" | grep -iE 'Premise[ _-]*(Low|Med|Medium|High)[^A-Za-z]{1,8}Delib(eration)?[ _-]*(Very high|Low|Med|Medium|High)[^A-Za-z]{0,10}(Sonnet5|Opus5)-(Low|Medium|High|XHigh|Max)' | grep -qv 'MG-EXAMPLE'; then
    bad 'mode 3: the correction does not self-match its own detector' 'an unescaped derivation is echoed back -- the hook will re-validate its own output forever'
else
    ok 'mode 3: the correction does not self-match its own detector'
fi

# ===========================================================================
# MODE 4 — a /compact landed AFTER the derivation: the reasoning is gone, re-derive once. Order matters, so the reverse case must NOT trigger it.
# ===========================================================================
run_with '{"type":"assistant","text":"Sonnet5-H · Some task · Aug 20. Premise Low · Delib High → Sonnet5-High"}
{"type":"system","subtype":"compact_boundary"}'   # MG-EXAMPLE
check 'mode 4: compact AFTER the derivation forces a re-derive' 'A /compact ran after the last derivation'
check 'mode 4: brings the FIRST ACTION gate back' 'FIRST ACTION'

run_with '{"type":"system","subtype":"compact_boundary"}
{"type":"assistant","text":"Sonnet5-H · Some task · Aug 20. Premise Low · Delib High → Sonnet5-High"}'   # MG-EXAMPLE
check  'mode 4b: compact BEFORE the derivation stays quiet' 'Derivation on record'
absent 'mode 4b: does not falsely claim a compact invalidated it' 'A /compact ran after'

# ===========================================================================
# MODE 5 — the fork/compact SessionStart marker. A fork COPIES the transcript, so without this the inherited derivation would suppress the one re-pick Harkirat explicitly asked for.
# ===========================================================================
MARKER="${CLAUDE_PROJECT_DIR:-/Applications/Claude Code/Diors-Builds}/.claude/.model-gate-reset"
touch "$MARKER"
run_with '{"type":"assistant","text":"Sonnet5-H · Some task · Aug 20. Premise Low · Delib High → Sonnet5-High"}'   # MG-EXAMPLE
check 'mode 5: the marker forces a fresh derivation despite an inherited one' 'started from a FORK or a COMPACT'
if [ -f "$MARKER" ]; then
    bad 'mode 5: marker is consumed once' 'marker still present -- every later prompt would re-fire'
    rm -f "$MARKER"
else
    ok 'mode 5: marker is consumed once (a sticky marker would re-fire forever)'
fi

# --- MG-EXAMPLE escape. A derivation QUOTED rather than made -- in this very file, in the hook's
#     docs, in a message explaining the gate -- must not be read as a real pick. This fired as a real
#     false positive on 2026-08-20 12:54 EDT, minutes after shipping, on this test's own fixtures.
run_with '{"type":"assistant","text":"e.g. Premise Low · Delib Med → Opus5-XHigh   MG-EXAMPLE"}'   # MG-EXAMPLE
check  'MG-EXAMPLE: a quoted derivation is ignored, not validated' 'FIRST ACTION'
absent 'MG-EXAMPLE: does not fire the mismatch correction on a quoted example' 'DOES NOT MATCH THE TABLE'

# ===========================================================================
# THE RENAME-STRING GATE (added 2026-08-20 14:07 EDT). FIRST_ACTION has always asked for the /rename string ALONGSIDE the model recommendation, but until now nothing checked for the rename half, so stating the derivation alone silently satisfied the WHOLE gate. Reproduced live: session 6b0ed127 stated only the model derivation on its first message and the very next prompt got "already given -- do NOT repeat it" for BOTH, and the rename string was never asked for again until Harkirat pointed out its absence by hand. These three cases pin the fix from both directions.
# ===========================================================================
run_with '{"type":"assistant","text":"Premise Low · Delib High → Sonnet5-High for this one."}'   # MG-EXAMPLE
check 'rename gate: model given ALONE keeps the FIRST ACTION gate open' 'FIRST ACTION'
absent 'rename gate: model given ALONE does not claim both are already given' 'already given'

run_with '{"type":"assistant","text":"Sonnet5-H · Some task · Aug 20"}'   # MG-EXAMPLE
check 'rename gate: rename given ALONE keeps the FIRST ACTION gate open' 'FIRST ACTION'
absent 'rename gate: rename given ALONE does not claim both are already given' 'already given'

run_with '{"type":"assistant","text":"Sonnet5-H · Some task · Aug 20. Premise Low · Delib High → Sonnet5-High for this one."}'   # MG-EXAMPLE
check  'rename gate: BOTH given together goes quiet' 'Derivation on record'
absent 'rename gate: BOTH given together drops the FIRST ACTION gate' 'FIRST ACTION'

# --- A wrong pick must still be flagged even when the rename string hasn't been given yet -- MODEL_OK
#     is independent of RENAME_GIVEN so this doesn't regress just because the two got coupled above.
run_with '{"type":"assistant","text":"Premise Low · Delib Med → Opus5-XHigh because this is complex."}'   # MG-EXAMPLE
check 'rename gate: a wrong pick is still flagged with no rename string given' 'DOES NOT MATCH THE TABLE'

# --- The same transcript with no marker must go quiet again. Proves the MARKER did it, not the text.
run_with '{"type":"assistant","text":"Sonnet5-H · Some task · Aug 20. Premise Low · Delib High → Sonnet5-High"}'   # MG-EXAMPLE
absent 'mode 5b: without the marker the same transcript is quiet' 'started from a FORK'

# ===========================================================================
# The registration that makes mode 5 reachable at all. A hook nobody runs is documentation.
# ===========================================================================
SETTINGS="${CLAUDE_PROJECT_DIR:-/Applications/Claude Code/Diors-Builds}/.claude/settings.json"
if python3 -c "
import json,sys
d=json.load(open('$SETTINGS'))
for g in d['hooks'].get('SessionStart',[]):
    if g.get('matcher')=='compact|fork' and any('model-gate-reset' in h.get('command','') for h in g.get('hooks',[])):
        sys.exit(0)
sys.exit(1)
" 2>/dev/null; then
    ok 'SessionStart(compact|fork) writes the reset marker (mode 5 is actually wired)'
else
    bad 'SessionStart(compact|fork) marker hook is registered' 'not found in .claude/settings.json -- mode 5 can never fire'
fi

printf '\n  %d passed, %d failed\n\n' "$pass" "$fails"
[ "$fails" -eq 0 ]
