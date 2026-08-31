#!/usr/bin/env bash
# audit-think-gate.sh — UserPromptSubmit. Non-blocking. Fires when the prompt asks for an audit, a review, a verification or a falsification, and reminds that sequentialthinking is MANDATORY for those.
#
# WHY THIS EVENT. Harkirat's working-style prompt: "Use sequential thinking freely and frequently, and MANDATORILY when auditing or reviewing." That is the one clause in the whole contract carrying the word mandatorily, and nothing checked it. It belongs at UserPromptSubmit because the trigger is IN THE PROMPT — so the reminder lands before the work starts, which is the only moment it can change anything. Firing at Stop would report that thinking should have happened, hours after it would have helped.
#
# MEASUREMENT NOTE, and it cuts in this hook's favour. Replaying 615 real turns, 78 of 93 audit-ish turns ran zero thinking calls. That 84% overstates it: scanning a transcript cannot tell a typed prompt from a task-notification or injected hook feedback, and the sampled matches included all three. UserPromptSubmit receives ONLY the real typed prompt, so this hook is strictly more precise than the measurement that motivated it. The residual false positive costs one injected line before work begins — a cheap asymmetry against missing a mandatory step.

set -uo pipefail
input=$(cat)
prompt=$(printf '%s' "$input" | jq -r '.prompt // empty' 2>/dev/null)
[ -n "$prompt" ] || exit 0
printf '%s' "$prompt" | grep -qiE '\b(audit|review|verify|verification|assess|falsif|critique|sanity.check|double.check)' || exit 0
jq -n '{hookSpecificOutput:{hookEventName:"UserPromptSubmit", additionalContext:"AUDIT/REVIEW REQUESTED — sequentialthinking is MANDATORY for this, per the standing working-style contract (the one clause in it carrying the word mandatorily). Start with it, before the first probe, and use it to set the METHOD: what would falsify the thing being reviewed, which angles are unasked, what a check would have to look like to be able to fail. An audit finds what you ask it to find, so the questions are the deliverable. Measured: 78 of 93 audit-ish turns in this project ran zero thinking calls."}}'
exit 0
