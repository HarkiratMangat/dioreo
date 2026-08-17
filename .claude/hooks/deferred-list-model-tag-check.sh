#!/bin/bash
# deferred-list-model-tag-check.sh — PostToolUse (Edit|Write) gate.
#
# WHY THIS EXISTS. `docs/db-deferred-list.md`'s own legend states a STANDING RULE (Harkirat, 2026-08-07 10:22 EDT): every item gets a `[Priority · Effort · Model<ver>-<eff>]` tag, not just ones that "feel like" a real build — see `reference_priority_tier_system` memory. Prose rules that get missed repeatedly become machine gates (`reference_enforcement_hooks`), and this one was missed again live 2026-08-11 22:58 EDT: three items were filed/edited across one session with only `[Px · size]` or `[Px · size · flags]`, no model tag, until Harkirat caught it by hand and pointed at "so many of them" already missing it. That's the exact failure mode this exists to stop.
#
# WHAT IT CHECKS. Only `docs/db-deferred-list.md`, and only the text actually being WRITTEN by this edit -- never the whole file on disk. A `[P0-3 · ...]` bracket found in the incoming content is flagged if it contains no `Sonnet5-`/`Opus5-` token (abbreviated forms like `Opus5-H` count -- see the file's own line ~225 note on normalizing tag notation; this only checks the MODEL PREFIX is present, so it does not need to know every valid effort-word spelling).
#
# ITS FAILURE MODE, STATED. Advisory only, never blocks -- Harkirat's own words on a sibling gate: "a gate is better than advisory but i dont want it denying things." A pre-existing untagged item that isn't touched by this edit is correctly invisible to it (per the legend's own "not retroactively wrong, tag it next time it's touched" rule) -- this is entirely by design, not a gap.

set -uo pipefail

input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

case "$file" in
    *"docs/db-deferred-list.md") ;;
    *) exit 0 ;;
esac

content=$(printf '%s' "$input" | jq -r '.tool_input.new_string // .tool_input.content // empty')
[ -z "$content" ] && exit 0

# Every `[P0-3 · ...]` bracket in the incoming text, checked independently -- a bracket qualifies as tagged if it contains a Sonnet5-/Opus5- prefix anywhere inside it (abbreviated suffix or not).
offenders=$(printf '%s' "$content" | grep -oE '\[P[0-3][^][]*\]' | grep -vE '(Sonnet5|Opus5)-')

if [ -n "$offenders" ]; then
    jq -n --arg o "$offenders" '{
        hookSpecificOutput: {
            hookEventName: "PostToolUse",
            additionalContext: (
                "DEFERRED-LIST MODEL-TAG CHECK: this edit to docs/db-deferred-list.md wrote a priority tag with no model+effort token:\n"
                + $o
                + "\n\nThe file'"'"'s own legend (STANDING RULE, Harkirat 2026-08-07 10:22 EDT) requires `[Priority · Effort · Model<ver>-<eff>]` on every item, not just real builds -- see reference_priority_tier_system memory for the grid (premise risk x deliberation load). Run the grid and add the tag, e.g. `[P2 · M · Sonnet5-High]`. A pre-existing item this edit didn'"'"'t otherwise touch is not what this is flagging."
            )
        }
    }'
fi

exit 0
