#!/usr/bin/env bash
# .claude/hooks/self-check.test.sh -- self-test for self-check.sh (added 2026-08-11 21:08 EDT).
#
# ⚠️ WHAT THIS IS ACTUALLY GUARDING, because it is not "does the hook print something". The hook now carries a SECOND COPY of the model-selection grid, duplicated from the `reference_priority_tier_system` memory. That copy was accepted knowingly -- a pointer is what measurably failed -- but duplicated state rots silently, and the values that rot are precisely the ones that discriminate between cells. So this pins the DISCRIMINATING content, not the prose: the axis definitions, the corner cells, and the retired-cell rule. Reword the surrounding text freely; change a cell or drop an axis definition and the suite fails.
#
# ⚠️ It also pins `hookEventName`, whose absence makes the whole payload SILENTLY DISCARDED -- the failure that left two hooks dead for weeks while exiting 0 and printing valid JSON.
set -uo pipefail

HOOK="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/self-check.sh"
fails=0
pass=0

check() { # check <description> <pattern>
    if printf '%s' "$OUT" | grep -qF -- "$2"; then
        pass=$((pass + 1)); printf '  PASS  %s\n' "$1"
    else
        fails=$((fails + 1)); printf '  FAIL  %s\n        missing: %s\n' "$1" "$2"
    fi
}

printf '\nself-check.sh — the model grid must survive verbatim\n\n'

OUT="$(bash "$HOOK" 2>/dev/null)" || { printf '  FAIL  hook exited non-zero\n'; exit 1; }

# --- The payload has to be reachable at all.
if printf '%s' "$OUT" | jq -e '.hookSpecificOutput.hookEventName == "UserPromptSubmit"' >/dev/null 2>&1; then
    pass=$((pass + 1)); printf '  PASS  emits hookEventName (without it the payload is silently discarded)\n'
else
    fails=$((fails + 1)); printf '  FAIL  hookEventName missing or wrong -- payload would reach nobody\n'
fi

OUT="$(printf '%s' "$OUT" | jq -r '.hookSpecificOutput.additionalContext')"

# --- The three original self-check items must not be lost in the promotion to a script.
check 'still carries the FIRST ACTION gate' 'FIRST ACTION'
check 'still carries the CHAPTERS nudge' 'CHAPTERS'
check 'still carries the JUDGMENT RULES' 'JUDGMENT RULES'

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

printf '\n  %d passed, %d failed\n\n' "$pass" "$fails"
[ "$fails" -eq 0 ]
