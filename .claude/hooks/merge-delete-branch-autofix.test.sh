#!/bin/bash
# Proofs for merge-delete-branch-autofix.sh.
#
# The property that matters most is the NEGATIVE one: this hook sees every Bash command in the session, so anything that is not a gh pr merge must pass through in complete silence. A guard that speaks on ordinary commands is how the real warning gets filtered out -- the lesson rg-flag-guard paid for five times.

HOOK="$(cd "$(dirname "$0")" && pwd)/merge-delete-branch-autofix.sh"
pass=0; fail=0
run() { printf '{"tool_input":{"command":%s}}' "$(printf '%s' "$1" | jq -Rs .)" | bash "$HOOK"; }
chk() { local n="$1" c="$2"; if [ "$c" = ok ]; then echo "  PASS  $n"; pass=$((pass+1)); else echo "  FAIL  $n"; fail=$((fail+1)); fi; }

echo "merge-delete-branch-autofix.sh — proofs"

out=$(run 'gh pr merge 42 --squash --body "x"')
chk "a merge without the flag is corrected" "$(printf '%s' "$out" | jq -e '.hookSpecificOutput.updatedInput.command | endswith("--delete-branch")' >/dev/null 2>&1 && echo ok)"
chk "the rest of the command survives"      "$(printf '%s' "$out" | jq -e '.hookSpecificOutput.updatedInput.command | startswith("gh pr merge 42 --squash")' >/dev/null 2>&1 && echo ok)"
chk "it asks rather than allows"            "$(printf '%s' "$out" | jq -e '.hookSpecificOutput.permissionDecision=="ask"' >/dev/null 2>&1 && echo ok)"

# The rtk prefix is the spelling the rewrite layer actually produces, and missing it is a defect this repo has already shipped once in main-push-guard.
out2=$(run 'rtk gh pr merge 7 --squash --body "y"')
chk "the rtk-prefixed spelling is matched"  "$(printf '%s' "$out2" | jq -e '.hookSpecificOutput.updatedInput' >/dev/null 2>&1 && echo ok)"

chk "a merge that already has the flag is silent" "$([ -z "$(run 'gh pr merge 42 --squash --delete-branch')" ] && echo ok)"
chk "an unrelated command is silent"              "$([ -z "$(run 'git status --porcelain')" ] && echo ok)"
chk "a command merely MENTIONING the flag is silent" "$([ -z "$(run 'echo remember --delete-branch')" ] && echo ok)"
chk "empty input is silent"                       "$([ -z "$(printf '{}' | bash "$HOOK")" ] && echo ok)"

seam=$(printf '{"tool_input":{"command":%s}}' "$(printf '%s' 'gh pr merge 42 --squash --body x' | jq -Rs .)" | MERGE_NO_AUTOFIX=1 bash "$HOOK")
chk "MERGE_NO_AUTOFIX falls back to an advisory" "$(printf '%s' "$seam" | jq -e '.hookSpecificOutput.additionalContext and (.hookSpecificOutput.updatedInput | not)' >/dev/null 2>&1 && echo ok)"

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
