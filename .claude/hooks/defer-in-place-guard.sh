#!/bin/bash
# defer-in-place-guard.sh — PreToolUse (Edit|Write). NEVER blocks; warns only.
#
# WHY THIS EXISTS
# 2026-08-09 23:32 EDT: while editing docs/db-deferred-list.md's memory-index item — removing the
# very premise that made it urgent — I wrote "**re-tag it and stop citing 'approaching read limit'
# as the reason**" INTO that item. I was already editing it. Re-tagging was two keystrokes away.
# Harkirat: *"why are u making a future session retag the deferred item? you're literally correcting
# and updating it right now so why not [just] retag it yourself? man this is another edge case for
# your deferral hook."*
#
# THE GAP THIS FILLS, and why it is NOT outstanding-not-filed.sh
# `outstanding-not-filed.sh` (Stop) catches "I NAMED an outstanding item and never FILED it."
# This is the INVERSE failure: the item WAS filed — filed as an instruction for someone else to do
# a thing the editor could have done in the same keystroke. It passes every existing gate, because
# a written-down deferral looks exactly like diligence. Working-agreement rule 9: fix a gap you
# notice THIS turn rather than deferring it. A deferral is a gap with paperwork.
#
# ⚠️ SCOPED TO new_string/content ON PURPOSE — NOT to the file.
# docs/db-deferred-list.md is BUILT of legitimate deferrals and would match on every edit. Only text
# being ADDED right now is examined. Legitimate deferrals are still fine and common (blocked on
# Harkirat, genuinely wants its own session, needs a decision) — this only asks the question.
#
# ⚠️ IT FIRES ON THE RECORDS THAT DOCUMENT IT. That is ACCEPTED, not a bug to fix.
# Writing the v2.63.1 CHANGELOG and DEVLOG entries tripped it twice, because describing the guard
# means quoting its own triggers. Do NOT "fix" that by exempting CHANGELOG.md / DEVLOG.md: a real
# deferral instruction genuinely did live in a changelog once ("revert to 16000 once that item
# lands") and propagated for a day — so a record IS an actionable place, and exempting it would
# trade a one-time warn for a permanent hole. Rephrase the prose, or ignore it; it never blocks.
set -u

payload=$(cat 2>/dev/null) || exit 0
[ -n "$payload" ] || exit 0

jqr() { printf '%s' "$payload" | jq -r "$1" 2>/dev/null; }

fp=$(jqr '.tool_input.file_path // empty')
[ -n "$fp" ] || exit 0

# ⚠️ SELF-EXEMPTION. This file and its test contain every trigger phrase by construction. The repo
# has already paid for this exact trap once (completeness-sweep's derivation detector matched a
# string in its own source). Exempt by basename, before any matching happens.
# `reference_enforcement_hooks.md` is the registry DOCUMENTING every hook, so it quotes trigger
# phrases by necessity — it fired on its own registry entry within a minute of going live
# (2026-08-09 23:39 EDT). Documenting a detector is not committing the thing it detects.
case "${fp##*/}" in
  defer-in-place-guard.sh|defer-in-place-guard.test.sh|reference_enforcement_hooks.md) exit 0 ;;
esac

added=$(jqr '.tool_input.new_string // .tool_input.content // empty')
[ -n "$added" ] || exit 0

# Tight list: an IMPERATIVE aimed at a future actor about the artifact being touched right now.
# Deliberately does NOT match neutral filing language ("filed", "queued", "deferred to", "P2"),
# which is how a legitimate tracker entry reads.
pat='re-?tag it|re-?title it|update the tag|revert (this|the) (constant|default|number|budget)|a future session (should|must|will|needs to|can)|whoever picks (this|it) up|stop citing|fix (this|it) later|update (this|it) later|leave (this|that) for (a|the) (later|future|next)|someone should|to be (re-?tagged|updated) later'

printf '%s' "$added" | grep -qiE "$pat" || exit 0

hit=$(printf '%s' "$added" | grep -oiE "$pat" | head -1)

jq -nc --arg f "${fp##*/}" --arg h "$hit" '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:("DEFER-IN-PLACE: the text you are writing into `" + $f + "` instructs a FUTURE actor (\"" + $h + "\") — while you have that file open. Ask the one question: can you just DO it in this same edit? If yes, do it now and delete the instruction; that is working-agreement rule 9, and a deferral is a gap with paperwork. This is the failure mode `outstanding-not-filed.sh` CANNOT see, because the item does get filed — it is filed as someone elses job. If the deferral is genuine (blocked on Harkirat, needs its own session, needs a decision you cannot make), say so explicitly in the entry and carry on. Never blocks.")}}'
exit 0
