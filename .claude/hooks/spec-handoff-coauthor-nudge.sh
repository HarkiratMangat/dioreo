#!/bin/bash
# spec-handoff-coauthor-nudge.sh — PreToolUse (Write). NEVER blocks; warns only.
#
# WHY THIS EXISTS
# `doc-coauthoring` has been installed and available for a long time and was used ZERO times. On
# 2026-08-09 23:46 EDT Harkirat asked the question that made the gap concrete: "it's been available
# for a while but not used, so is that 'nudge' new? did you change something to actively bring it to
# the front of mind?" The honest answer at that moment was NO — the skill had been catalogued in a
# memory file and nothing more. A reference entry is PASSIVE: it helps only a session that happens
# to open that file. That is the same failure this whole investigation was about (2026-08-09) —
# prose without a mechanism does not fire. (That investigation ran 2026-08-09 22:34-23:47 EDT.)
#
# So this is the mechanism. It fires at the ONE moment the skill is actually useful: creating a new
# spec or handoff. Both the decoration-caching spec and the enforcement-gap handoff were written in
# a single pass, which is exactly what the skill's staged workflow exists to improve on.
#
# NEW FILES ONLY, on purpose: co-authoring is about how a document gets BUILT. Editing an existing
# spec is not that moment, and firing there would make this noise — and a nudge that becomes noise
# gets ignored, then deleted.
set -u

payload=$(cat 2>/dev/null) || exit 0
[ -n "$payload" ] || exit 0

fp=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
[ -n "$fp" ] || exit 0

# Already exists -> this is a rewrite, not an authoring moment.
[ -e "$fp" ] && exit 0

case "$fp" in
  *.md) ;;
  *) exit 0 ;;
esac

kind=""
case "$fp" in
  */docs/superpowers/specs/*) kind="a dated design spec" ;;
  */local/handoff/*)          kind="a session handoff" ;;
  *-design.md)                kind="a design document" ;;
  *-handoff.md)               kind="a handoff" ;;
esac
[ -n "$kind" ] || exit 0

jq -nc --arg k "$kind" '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:("DOC CO-AUTHORING: you are creating " + $k + " from scratch. Anthropics `doc-coauthoring` skill (375 lines) exists for exactly this and has been installed, available, and used ZERO times. Its staged workflow is context gathering -> clarifying questions -> brainstorming -> curation -> GAP CHECK -> drafting -> iterative refinement -> quality checking. The gap-check stage is the one a single-pass author reliably skips, and single-pass is how every spec and handoff in this repo has been written so far. It lives OUTSIDE ~/.claude and no search there will find it: ~/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/<org>/<account>/skills/doc-coauthoring/. Optional and never blocking - if this document is short, mechanical, or already fully specified in the conversation, just write it.")}}'
exit 0
