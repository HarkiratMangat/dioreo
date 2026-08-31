#!/usr/bin/env bash
# batch-edit-guard.sh — PreToolUse on Edit/Write/MultiEdit/NotebookEdit. Non-blocking. Fires when the file about to be edited was ALREADY edited in an earlier assistant message this turn, with no non-edit tool call in between.
#
# WHY THIS EVENT, AND WHY THIS CLAUSE (built 2026-08-31 15:0x EDT)
# ------------------------------------------------------------------------------------------
# `turn-shape-guard.sh` is a Stop hook, which is a POST-MORTEM: it cannot change the turn it measures. This one fires at the moment of the second edit, while the remaining edits can still be collapsed into one heredoc. That is why it is a separate file rather than another branch of the Stop hook — the clause is preventable, so it belongs at the moment of prevention. The original design never asked which EVENT each clause wanted; forcing all of them into one Stop hook is most of why it was useless.
#
# 🔴 IT HAS NO ESCAPE HATCH, WHICH IS THE POINT. Harkirat's working-style prompt: "use a scripted multi-edit (python heredoc) for anything touching more than one file, or touching multiple edits/reads in a single file." Two edits to one file in one turn is never a data dependency — unlike a read-chain, where call B's target genuinely comes from call A's output. Every shape rule that FAILED had an "unless it was really serial" out that could be invoked silently; every rule that HELD (never push, never delete a worktree, never write "done") had none. This one has none.
#
# THE NARROWING, by construction rather than by judgement: ANY non-edit tool call resets the map. So edit X -> run the test -> the test reveals a second defect in X -> edit X again does NOT fire. That is a real dependency, and the reset encodes it instead of leaving it to be argued after the fact. Measured over 615 real turns: 35.4% before the reset, 30.1% after — it removes the genuine cases without gutting the rule.
#
# NON-BLOCKING, per Harkirat's standing constraint ("a gate is better than advisory but i dont want it denying things"): additionalContext only, never permissionDecision "deny".

set -uo pipefail
input=$(cat)
tool=$(printf '%s' "$input" | jq -r '.tool_name // empty' 2>/dev/null)
case "$tool" in Edit|Write|MultiEdit|NotebookEdit) ;; *) exit 0 ;; esac
target=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' 2>/dev/null)
[ -n "$target" ] || exit 0
tp=$(printf '%s' "$input" | jq -r '.transcript_path // empty' 2>/dev/null)
[ -f "$tp" ] || exit 0

# Scope to the current turn: after the last REAL typed user message (content is a string, not a tool_result array).
ln=$(grep -n '"role":"user","content":"' "$tp" 2>/dev/null | tail -1 | cut -d: -f1)
ln=${ln:-1}

# One row per tool-carrying assistant message: the pipe-delimited files it edited, or RESET if it made any non-edit call. Pipes delimit so a path can never partially match another path.
rows=$(tail -n +"$ln" "$tp" 2>/dev/null | grep '"type":"assistant"' | jq -rc '
  .message.content as $c
  | ($c | map(select(.type=="tool_use"))) as $t
  | select(($t | length) > 0)
  | if (($t | map(select(.name as $n | ["Edit","Write","MultiEdit","NotebookEdit"] | index($n))) | length) == ($t | length))
    then "|" + (($t | map(.input.file_path // .input.notebook_path // empty)) | join("|")) + "|"
    else "RESET" end
' 2>/dev/null)

seen=""
while IFS= read -r row; do
  [ -n "$row" ] || continue
  if [ "$row" = "RESET" ]; then seen=""; continue; fi
  seen="$seen$row"
done <<< "$rows"

case "$seen" in
  *"|$target|"*) ;;
  *) exit 0 ;;
esac

jq -n --arg f "$target" '{hookSpecificOutput:{hookEventName:"PreToolUse", additionalContext:("SECOND EDIT TO THE SAME FILE THIS TURN — non-blocking, never denies.\n\n  " + $f + "\n  was already edited in an earlier message this turn, with no other tool call since. Two messages\n  where one would have done, and the working contract names this case exactly: a scripted multi-edit\n  for multiple edits in a single file.\n\n  Collapse THE REST of this unit into one python3 heredoc (<<PYEOF): an `assert <anchor> in s` before\n  each replacement so a missed anchor fails loudly instead of silently no-opping, a print() per edit\n  so a partial batch says which landed, and the verification command chained onto the same call.\n  Unlike a read-chain, a second edit to a file you already know is never waiting on the first one output.")}}' 2>/dev/null
exit 0
