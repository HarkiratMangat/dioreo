#!/bin/bash
# typos-check.sh — PostToolUse on Edit|Write. Spellchecks ONLY the text being written.
#
# WHY IT CHECKS THE EDIT AND NOT THE FILE
# Measured 2026-08-02 15:25 EDT: `typos` over the existing docs returns ~50 findings. Hooking it at
# FILE level would flag pre-existing prose in every file I touch — noise I did not introduce and am
# not fixing in that turn. A gate that is mostly not-your-fault is one you learn to scroll past, which
# is exactly how the timestamp gate's real miss got waved through 30 times the same day.
#
# So it reads `tool_input.new_string`/`content` — the words being added right now. Precise, and every
# finding is actionable by the person seeing it.
#
# Config lives in the repo's `_typos.toml`. NOTE: typos resolves config relative to the FILE it is
# checking, not the working directory — a probe run against /tmp silently ignored the config and
# reported false positives that looked like the config was broken. The temp file is written INSIDE the
# repo for that reason.

content=$(jq -r '.tool_input.new_string // .tool_input.content // empty')
[ -z "$content" ] && exit 0
command -v typos >/dev/null 2>&1 || exit 0

root="${CLAUDE_PROJECT_DIR:-/Applications/Claude Code/Diors-Builds}"
[ -d "$root" ] || exit 0
tmp="$root/.typos-probe-$$.md"
printf '%s' "$content" > "$tmp"
out=$(typos "$tmp" 2>/dev/null | grep '^error' | sed "s|$tmp|<this edit>|" | head -8)
rm -f "$tmp"

[ -z "$out" ] && exit 0
printf 'TYPO CHECK — in the text this edit is writing:\n%s\n\nThese are in NEW content, not pre-existing prose. Fix them in this edit rather than leaving them in a permanent record. If a flagged word is deliberate project vocabulary, add it to _typos.toml so it stops firing for everyone.' "$out" \
  | jq -Rs '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:.}}'
