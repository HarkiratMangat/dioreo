#!/bin/bash
# Proofs for clock-inject.sh. Small hook, but it runs before EVERY Edit and Write, so the two
# things that matter are: it must always speak, and it must never block.

HOOK="$(cd "$(dirname "$0")" && pwd)/clock-inject.sh"
pass=0; fail=0
chk() { local n="$1" cond="$2"
  if [ "$cond" = ok ]; then echo "  PASS  $n"; pass=$((pass+1)); else echo "  FAIL  $n"; fail=$((fail+1)); fi; }

echo "clock-inject.sh — proofs"

out=$(printf '{"tool_name":"Write","tool_input":{"file_path":"/tmp/x.md","content":"hi"}}' | bash "$HOOK")
rc=$?

chk "exits 0 (must never block a write)" "$([ "$rc" -eq 0 ] && echo ok)"
chk "emits valid JSON"                   "$(printf '%s' "$out" | jq -e . >/dev/null 2>&1 && echo ok)"
chk "is PreToolUse additionalContext"    "$(printf '%s' "$out" | jq -e '.hookSpecificOutput.hookEventName=="PreToolUse" and (.hookSpecificOutput.additionalContext|type=="string")' >/dev/null 2>&1 && echo ok)"

ctx=$(printf '%s' "$out" | jq -r '.hookSpecificOutput.additionalContext')
# The whole point is a CURRENT reading, so assert it matches the clock to the minute rather than
# merely "looks like a date" — a hook that emits a frozen or wrong time is worse than none, because
# it would be trusted and then reproduce the exact fabrication it exists to prevent.
nowmin=$(date '+%Y-%m-%d %H:%M')
case "$ctx" in *"$nowmin"*) m=ok;; *) m=no;; esac
chk "carries the CURRENT time to the minute" "$m"

# It must state a timezone — a bare HH:MM is what the records convention forbids.
case "$ctx" in *"$(date '+%Z')"*) z=ok;; *) z=no;; esac
chk "includes the timezone" "$z"

# No trailing newline smuggled into the JSON string (jq -Rs keeps one unless it is trimmed).
case "$ctx" in *"
"*) nl=no;; *) nl=ok;; esac
chk "no embedded newline" "$nl"

# It must not care what it is called with — it reads no input and judges nothing.
out2=$(printf '' | bash "$HOOK"); rc2=$?
chk "empty stdin still works" "$([ "$rc2" -eq 0 ] && printf '%s' "$out2" | jq -e . >/dev/null 2>&1 && echo ok)"

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
