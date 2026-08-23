#!/bin/bash
# push-approval-gate.test.sh — self-test for push-approval-gate.sh.
#
# ⚠️ RUN THE HOOK THE WAY THE HOOK RUNS — a NON-interactive shell. This machine's interactive aliases rewrite `git` to `rtk`, which makes a hand-typed probe succeed where the real hook fails. That is how the BSD-`find` bug in records-close-check nearly escaped twice.
#
# The cases that matter are the SILENT ones. A gate that fires on everything gets tuned out, and a gate that fires on `git push --delete` would make undoing an unauthorized push harder than making one.
GATE="$(cd "$(dirname "$0")" && pwd)/push-approval-gate.sh"
pass=0; fail=0

fires() {  # description, command
    out=$(printf '{"tool_input":{"command":%s}}' "$(printf '%s' "$2" | jq -Rs .)" | bash "$GATE")
    ev=$(printf '%s' "$out" | jq -r '.hookSpecificOutput.hookEventName // empty' 2>/dev/null)
    if [ "$ev" = "PreToolUse" ]; then echo "  ✓ $1"; pass=$((pass+1))
    else echo "  ✗ $1 — expected a PreToolUse block, got: ${out:-<nothing>}"; fail=$((fail+1)); fi
}
silent() {
    out=$(printf '{"tool_input":{"command":%s}}' "$(printf '%s' "$2" | jq -Rs .)" | bash "$GATE")
    if [ -z "$out" ]; then echo "  ✓ $1"; pass=$((pass+1))
    else echo "  ✗ $1 — expected silence, got: $out"; fail=$((fail+1)); fi
}

echo "push-approval-gate:"
fires  "a plain push"                                   "git push"
fires  "the -u form that FEELS like setup and is not"   "git push -u origin feat/x"
fires  "rtk-wrapped, which the hook rewriter produces"  "rtk git push"
fires  "a push chained after another command"           "npm test && git push"
fires  "an explicit refspec"                            "git push origin HEAD:refs/heads/feat/x"

silent "--dry-run publishes nothing"                    "git push --dry-run"
silent "--delete is the UNDO of a push"                 "git push origin --delete feat/x"
silent "a non-push git command"                         "git status"
silent "the word push inside another command"           "echo git push"
silent "git pushing is not git push"                    "git pushing"

# 🔴 THE ANTI-VACUOUS CASE. Every check above passes trivially if the gate emits its block for EVERY input — including the silent ones, which is why they are half the suite. This asserts the block actually CARRIES the instruction, so a gate gutted to `exit 0`-with-empty-JSON fails here rather than reporting five green ticks.
out=$(printf '{"tool_input":{"command":"git push"}}' | bash "$GATE" | jq -r '.hookSpecificOutput.additionalContext')
if printf '%s' "$out" | grep -q "Approved by:" && printf '%s' "$out" | grep -q "consumed by that merge"; then
    echo "  ✓ the block names the required shape AND the consumed-approval trap"; pass=$((pass+1))
else
    echo "  ✗ the block fired but carries no instruction — a gate that says nothing is decoration"; fail=$((fail+1))
fi

echo "  $pass passed, $fail failed"
[ "$fail" -eq 0 ]
