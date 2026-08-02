#!/bin/bash
# timestamp-check.sh — PostToolUse on Edit|Write. Replaces the inline TIMESTAMP nag.
#
# WHY IT WAS REPLACED (2026-08-02 15:02 EDT)
# The old inline version had two faults, and the second one is the serious one.
#
# 1. FALSE POSITIVES, constantly. It was LINE-based: any line containing today's date without an
#    adjacent HH:MM fired. But a date-prefixed FILENAME (`2026-08-02-protocol.md`) and a CLI date
#    ARGUMENT (`--from 2026-08-02`) are both correct and both have no time. In one session it fired
#    ~15 times and nearly every fire was answered "deliberate — filename / CLI arg / historical
#    reference". A gate that is usually wrong trains you to dismiss it, which is how the real one gets
#    dismissed too.
#
# 2. IT NEVER CHECKED WHETHER THE TIME WAS TRUE. It asserted a time was PRESENT, never PLAUSIBLE. On
#    2026-08-02 I ran `date` once at 12:57 and then INVENTED every subsequent timestamp, drifting to
#    19:30 while the real clock read 15:02. Thirty fabricated future stamps landed in docs, hooks,
#    memory, a released CHANGELOG, the DEVLOG and a git tag annotation — and this hook passed every
#    one of them, because they all had a well-formed HH:MM. **The format was right and the data was
#    fiction.** Harkirat caught it, not the gate.
#
# So this version: strips the known-legitimate shapes to kill the noise, and adds the check that
# actually mattered — a timestamp LATER THAN NOW cannot have been observed.
#
# The real prevention is upstream: a UserPromptSubmit hook now injects the current time every turn, so
# there is never a reason to guess one. This gate is the safety net for when I guess anyway.

content=$(jq -r '.tool_input.new_string // .tool_input.content // empty')
[ -z "$content" ] && exit 0

today=$(date +%Y-%m-%d)
now_min=$(( 10#$(date +%H) * 60 + 10#$(date +%M) ))

# --- kill the known-legitimate shapes BEFORE judging -------------------------------------------
# Order matters: filenames first (they contain the date followed by '-'), then flag arguments.
clean=$(printf '%s' "$content" \
  | sed -E "s/${today}-[A-Za-z0-9._-]+//g" \
  | sed -E "s/--[a-z-]+[= ]${today}//g" \
  | sed -E "s/\`[^\`]*\`//g")

findings=""

# --- (A) the check that actually matters: a time later than NOW was not observed ----------------
future=$(printf '%s' "$clean" | grep -oE "${today} [0-9]{2}:[0-9]{2}" | while read -r _ hm; do
  h=${hm%%:*}; m=${hm##*:}
  [ $(( 10#$h * 60 + 10#$m )) -gt "$now_min" ] && echo "$hm"
done | sort -u | tr '\n' ' ')
if [ -n "$future" ]; then
  findings="${findings}
  🚨 IMPOSSIBLE TIMESTAMP — this edit writes today at ${future}but the clock reads $(date +%H:%M). A
     time later than now cannot have been observed, so it was invented. On 2026-08-02 exactly this put
     30 fabricated stamps into docs, memory, a released CHANGELOG and a git tag. Get the real time
     (\`date\`) and use it. If it is genuinely a FUTURE deadline, write the date without a clock time,
     or say plainly that it is a target."
fi

# --- (B) the original check, now only on prose ---------------------------------------------------
# OCCURRENCE-based, not line-based. The old hook judged whole LINES, so a line carrying one good
# timestamp masked a bare date sitting next to it — the same granularity flaw in mirror image. Strip
# every well-formed stamp first; whatever date text survives is genuinely bare.
bare=$(printf '%s' "$clean" | sed -E "s/${today} [0-9]{2}:[0-9]{2}//g" | grep -F "$today")
if [ -n "$bare" ]; then
  findings="${findings}
  ⏱️ BARE DATE — today's date appears with no HH:MM TZ beside it. Working-agreement rule 10: dated
     content in docs, memory, DEVLOG, changelogs, notes marks and code comments carries
     YYYY-MM-DD HH:MM TZ. Filenames, \`--flag DATE\` arguments and backticked spans are already
     stripped before this check, so this is prose. Add the time, or confirm it is a deliberate bare
     date (a historical reference, or the player-facing summary)."
fi

[ -z "$findings" ] && exit 0
printf 'TIMESTAMP CHECK%s' "$findings" | jq -Rs '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:.}}'
