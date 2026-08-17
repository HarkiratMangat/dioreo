#!/usr/bin/env bash
# .claude/hooks/self-check.sh -- UserPromptSubmit. The per-turn self-check nudge.
#
# Was an inline `echo` in .claude/settings.json until 2026-08-11 21:07 EDT. Promoted to a script for one reason: it now has to CARRY the model-selection grid, and a lookup table does not survive being JSON-escaped onto one line of a settings file.
#
# ⚠️ WHY THE GRID IS IN HERE RATHER THAN POINTED AT. Measured the hard way this session. Every layer already said "use the grid": docs/SESSION-START.md (auto-loaded, names the file), the MEMORY.md index line (auto-loaded, names the axes), and this hook (fires every turn, names the requirement). All three were in context, and the recommendation was STILL made from a remembered shape of the table -- twice, wrongly, in opposite directions. Harkirat: *"so you just ignored our new model recommendation system?"*
#
# The failure mode is precise and worth stating: a POINTER preserves the concept and drops the DISCRIMINATING VALUES. "premise-risk x deliberation-load grid" is enough to feel informed and not enough to be correct -- it carries neither axis DEFINITION nor the retired-cell rule, and those two facts are exactly what both wrong picks turned on. A fourth layer of prose saying "really do open it" would have failed the same way. So the table is present at the moment of the decision instead.
#
# ⚠️ THIS IS A SECOND COPY of content owned by the `reference_priority_tier_system` memory, which is duplicated state and can drift (see `feedback_no_duplicated_state_in_prose`). Accepted knowingly: the alternative is a pointer, and a pointer is the thing that measurably failed. The memory is named below as canonical so a reader knows which side wins, and `self-check.test.sh` pins the values that actually discriminate, so silent drift fails the suite rather than a session.
#
# ⚠️ `hookEventName` is REQUIRED. A hook emitting hookSpecificOutput without it is SILENTLY DISCARDED -- runs, exits 0, prints valid JSON, reaches nobody. Two hooks were dead this way for weeks.
set -euo pipefail

read -r -d '' CONTEXT <<'EOF' || true
[self-check] (1) FIRST ACTION: if you have NOT yet this session output the ready-to-paste /rename string + a one-line model+effort recommendation, do it now before any task content -- this is a hard gate (feedback_suggest_model_switch memory), not optional. (2) CHAPTERS: if this turn shifted into a new distinct TOPIC since the last mark, call mark_chapter now -- mark finely, one per topic, no cap. (3) JUDGMENT RULES: fix a gap you notice THIS turn rather than deferring/flagging it (working-agreement rule 9), and never assert done/synced/caught-up/matches without running the actual check first (verify before claiming).

[model-gate] The recommendation is a LOOKUP. The table is here so it needs no file read -- canonical copy lives in the `reference_priority_tier_system` memory; open it if anything below is unclear.
  Axis A - PREMISE RISK: Low = facts given and checkable | Med = mostly given, one could be stale | High = the task IS working out whether the framing is right.
  Axis B - DELIBERATION LOAD: Low = ONE place | Med = several | High = many sites | Very high = must hold the whole system at once.
  !! Axis B is HOW MANY PLACES, never how hard the thinking is, and never whose judgement it is. A session full of hard calls that HARKIRAT makes is not a high-deliberation session.
                   | Delib Low       | Med             | High           | Very high
    Premise Low    | Sonnet5-Low     | Sonnet5-Medium  | Sonnet5-High   | Sonnet5-XHigh
    Premise Med    | Sonnet5-Medium  | Sonnet5-High    | Sonnet5-XHigh  | Opus5-High
    Premise High   | Opus5-Medium    | Opus5-High      | Opus5-XHigh    | Opus5-Max
  !! Sonnet5-Low is effectively RETIRED (Harkirat: "truly VERY minor work" only) -- the practical floor is Sonnet5-Medium.
  !! ONE cell, never a range. If torn, take the LOWER cell and say why in one clause.
  !! Escalate on EVENTS, never pre-emptively: two hypotheses wrong -> +1 effort; a premise turned out false, or a silent-failure surface appeared -> Sonnet->Opus at the same effort; scope turned out mechanical -> STEP DOWN.
  !! Tie-break, answered BEFORE starting: "if I'm wrong, will it be because I missed one of many things, or because I believed something false?" Breadth -> stay Sonnet, raise effort. Premise -> switch to Opus.
EOF

jq -n --arg ctx "$CONTEXT" \
  '{hookSpecificOutput:{hookEventName:"UserPromptSubmit", additionalContext:$ctx}}'
