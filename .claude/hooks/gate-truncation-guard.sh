#!/bin/bash
# gate-truncation-guard.sh — PreToolUse on Bash. Fires when a GATE's output is piped to tail/head
# without the exit status being captured.
#
# WHY THIS EXISTS (2026-08-15 16:20 EDT, measured, not hypothetical)
# `npm run docs:audit | tail -3` prints the trailing summary line — which reads reassuringly, because
# the summary reports how many checks RAN, not whether any FAILED. The "❌ ERRORS" block sits ABOVE it
# and is scrolled away by the pipe. In this session that hid a real doc-frontmatter failure across TWO
# commits, and it happened despite `feedback_wrong_reference_beats_stale_one` already recording the
# exact rule ("read a gate's exit code, never its trailing summary line"). Prose had already failed to
# prevent it once; that is this repo's own trigger for turning a rule into a hook.
#
# WHY IT WARNS RATHER THAN DENIES
# Piping a gate to tail is legitimate when the exit status is captured separately — the usual honest
# shape is `npm test >/tmp/log 2>&1; echo "exit=$?"; tail -5 /tmp/log`. Denying that would push work
# toward MORE noise, not less. So this fires only on the genuinely blind form, and stays advisory.

cmd=$(jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0

# The gates whose output actually carries a pass/fail verdict worth reading.
echo "$cmd" | grep -qE '(npm (run )?(test|docs:audit|docs:audit:test|docs:reflow|docs:reflow:test|test:hooks)|run-all-tests\.sh|docs-audit\.mjs|reflow-prose\.mjs|scripts/[a-zA-Z]+\.test\.js)' || exit 0

# Only the blind form: piped straight into a truncator.
echo "$cmd" | grep -qE '\|[[:space:]]*(tail|head)([[:space:]]|$)' || exit 0

# If the exit status is captured anywhere, this is the honest shape -- stay silent.
echo "$cmd" | grep -qE '\$\?|PIPESTATUS' && exit 0

printf 'GATE OUTPUT TRUNCATED — this pipes a gate straight into tail/head and never reads its exit status.\n\nA pipeline exits with the status of its LAST command, so `... | tail` reports tail'"'"'s success, not the gate'"'"'s. Worse, these gates print their ERROR block ABOVE the trailing summary, and that summary counts how many checks RAN rather than how many PASSED -- so a truncated view reads exactly like a clean run. Measured 2026-08-15: this hid a real docs-audit failure for two commits.\n\nUse the shape that keeps both: redirect, read the code, then look at whatever slice you want.\n  npm run docs:audit >/tmp/a.log 2>&1; echo "exit=$?"; rg -A5 "ERRORS" /tmp/a.log\n\nAdvisory only -- if you have already captured the status another way, carry on.' \
  | jq -Rs '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:.}}'
