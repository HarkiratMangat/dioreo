#!/bin/bash
# read-routing-nudge.sh -- PreToolUse on Read. Fires on a full native Read of a memory-store file.
#
# WHY THIS EXISTS (2026-09-08 13:25 EDT, context-carriers plan WP7)
# -------------------------------------------------------------------
# Every advisory nudge this repo already has (ctx-search-nudge.sh, codebase-memory-nudge.sh) is registered on Bash only -- nothing watches the native Read tool at all, for any path. That gap was measured live this session: a memory file was opened with `mcp__linksee__read_smart`, came back `status:"unchanged"` with no content and an explicit `call again with force:true`, and the session fell back to a plain Read instead -- exactly the read_smart-bypass this repo's own routing rules name, and nothing said so at the moment it happened.
#
# WHY THIS TRIGGER AND NOT A BROADER ONE, same bar as its siblings: no precision question to gate. A file under the memory store's own directory, read with no offset/limit (a full read), is close to always the read_smart/ctx_execute_file case -- memory files are reference material a session reads far more often than it edits. MEMORY.md itself is excluded: its own sentinel-check procedure wants a direct full Read sometimes, and nagging on that would be the exact cry-wolf failure this repo has already paid for elsewhere.
#
# WHAT IT DELIBERATELY DOES NOT DO. It does not know whether the session is about to Edit the file -- PreToolUse cannot see future intent, the same limitation every sibling nudge already accepts. Advisory only, never a block; the message says so explicitly, same wording as the two existing nudges.
#
# ⚠️ Emits hookSpecificOutput WITH hookEventName -- a hook that omits it is silently discarded.

input=$(cat)
fp=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
[ -z "$fp" ] && exit 0

case "$fp" in
  */.claude/projects/*/memory/*.md) ;;
  *) exit 0 ;;
esac
case "$fp" in */MEMORY.md) exit 0 ;; esac

offset=$(printf '%s' "$input" | jq -r '.tool_input.offset // empty' 2>/dev/null)
limit=$(printf '%s' "$input" | jq -r '.tool_input.limit // empty' 2>/dev/null)
[ -n "$offset" ] && exit 0
[ -n "$limit" ] && exit 0

printf 'READ-ROUTING NUDGE -- this is a full native Read of a memory-store file, not one you appear to be about to Edit.\n\nRoute a file you will not edit through mcp__linksee__read_smart (first read included, not only re-reads -- it returns full content on a first read; if a later call reports "unchanged" with no content, retry with force:true rather than falling back here) or mcp__plugin_context-mode_context-mode__ctx_execute_file for a question about it.\n\nAdvisory only -- if you are about to Edit this file, a plain Read is exactly correct and this is not a verdict on this command.' \
  | jq -Rs --arg fp "$fp" '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:.}}'
