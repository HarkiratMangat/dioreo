#!/bin/bash
# untracked-doc-guard.sh — PreToolUse on Bash. Fires when a docs gate is about to run while UNTRACKED .md files exist, because those gates cannot see them.
#
# WHY THIS EXISTS (2026-08-15 15:45 EDT, measured) `scripts/reflow-prose.mjs` resolves its file list with `git ls-files '*.md'`, and docs-audit walks the tracked tree the same way. A brand-new document is therefore INVISIBLE to both until it is staged or committed. In this session a 1,000-line plan was written, both gates were run, both reported green, and it was committed on that basis -- at which point the gates finally saw it and found two real problems (hard-wrapped prose and invalid front matter).
#
# The trap is that the gate does not say "0 files matched"; it reports a healthy-looking count of the files it DID check. A green run on an incomplete corpus is indistinguishable from a green run.
#
# Advisory, never blocking: untracked .md files are often scratch notes that SHOULD be ignored. The point is to make the invisibility visible at the moment it would otherwise mislead.

cmd=$(jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0
echo "$cmd" | grep -qE '(npm (run )?(docs:audit|docs:reflow)|docs-audit\.mjs|reflow-prose\.mjs)' || exit 0

root="${CLAUDE_PROJECT_DIR:-/Applications/Claude Code/Diors-Builds}"
cd "$root" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

# Untracked markdown only. Gitignored paths are excluded by default, which is right: local/ and docs/ideas/Harkirats-Space.md are deliberately outside the tracked corpus.
untracked=$(git status --porcelain 2>/dev/null | grep -E '^\?\? .*\.md$' | sed 's/^?? //' | head -8)
[ -z "$untracked" ] && exit 0
n=$(printf '%s\n' "$untracked" | grep -c .)

printf 'UNTRACKED DOCS ARE INVISIBLE TO THIS GATE — %s new .md file(s) will NOT be checked:\n%s\n\nBoth docs:audit and docs:reflow resolve their file list from `git ls-files`, so an untracked file is not merely unchecked, it is uncounted -- the gate reports green over the corpus it CAN see, which looks identical to a genuinely clean run. Measured 2026-08-15: a new plan passed both gates, was committed on that basis, and only then failed on front matter and hard-wrapped prose.\n\n`git add` them first, then run the gate. Advisory -- if these are scratch files that should stay out of the tracked corpus, ignore this.' \
  "$n" "$(printf '%s\n' "$untracked" | sed 's/^/  · /')" \
  | jq -Rs '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:.}}'
