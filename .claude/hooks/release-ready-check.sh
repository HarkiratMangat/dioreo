#!/bin/bash
# release-ready-check.sh — PreToolUse on `gh pr merge`. Checks the BRANCH, before the merge lands.
#
# WHY IT EXISTS: the wrong-moment bug, caught live 2026-08-02 16:09 EDT.
# Four release checks were gated PostToolUse on `gh pr merge` — they fired AFTER the merge, when the
# branch is gone and nothing can be added to that release. The DEVLOG one caught a genuine omission in
# v2.49.1 and the only remedy it could offer was "ship a follow-up release", which manufactured an
# extra PR, merge, version and tag purely to satisfy a gate that fired too late. Harkirat: *"thats just
# poor timing for the hook to trigger, no? it stopped you AFTER you had already merged and thus caused
# another merge."*
#
# That is textbook: **a check at the wrong MOMENT is the same bug as no check** — already written down
# in feedback_not_checkable_is_usually_unexamined, and still shipped. The correct moment is
# immediately BEFORE the merge, which is exactly when the pre-merge checkpoint happens on the branch.
#
# It inspects `origin/main...HEAD` — the branch's own diff — NOT origin/main after the fact. That is
# the whole difference, and it is why this could not be a simple event-name swap.
#
# ASKS rather than blocks: a docs-only or hotfix merge can legitimately skip a DEVLOG entry, and the
# judgement is the human's. But it must be a decision, not an omission.

cmd=$(jq -r '.tool_input.command // empty')
printf '%s' "$cmd" | grep -qE '(^|[;&|] *)((rtk|sudo|command|nohup|time) +)*gh pr merge' || exit 0

cd "${CLAUDE_PROJECT_DIR:-/Applications/Claude Code/Diors-Builds}" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

# ⚠️ THE BASE IS NOT ALWAYS `main` — fixed 2026-08-02 16:49 EDT. This diffed `origin/main...HEAD`
# unconditionally, which is wrong for every v3 PR: those target the long-lived `v3-pre-release`
# integration branch, so the diff would have included all of that branch's divergence and the
# verdict would have been about the wrong set of files. It is invisible today only because
# `main` and `v3-pre-release` happen to be identical (`git rev-list --left-right --count` = 0 0),
# which is exactly the kind of coincidence that hides a bug until the day it matters.
# RELEASE_CHECK_BASE lets the test pin the base without a network call.
base="${RELEASE_CHECK_BASE:-}"
if [ -z "$base" ]; then
  pr=$(printf '%s' "$cmd" | grep -oE 'gh pr merge +[0-9]+' | grep -oE '[0-9]+$')
  base=$(gh pr view ${pr:+"$pr"} --json baseRefName -q .baseRefName 2>/dev/null)
  [ -z "$base" ] && base=main
fi
git fetch origin "$base" --quiet 2>/dev/null

# RELEASE_CHECK_FILES overrides the diff so the miss-branches can be PROVEN, not assumed. Nothing in
# normal operation sets it. Every hook written without tests today regressed; the four written with
# them did not.
changed="${RELEASE_CHECK_FILES:-$(git diff --name-only "origin/$base...HEAD" 2>/dev/null)}"
[ -z "$changed" ] && exit 0

miss=""
echo "$changed" | grep -qx 'docs/CHANGELOG.md' \
  || miss="$miss
  · docs/CHANGELOG.md has no entry on this branch. Every merge gets a version (corrected
    2026-08-02 16:02 EDT — the newest untagged commit is 2026-07-28; the last 14 are all tagged)."

# During v3 pre-release the records rule is CHANGELOG-only: docs/CHANGELOG.md carries
# `Pre-Release v3.MAJOR.MINOR`, package.json carries a matching `-pre` suffix, and no
# CHANGELOG-SUMMARY line or tag is minted until v3.0.0 (2026-07-27 v3 development-structure spec).
# Demanding a SUMMARY line on a v3 branch would be the gate enforcing a rule that does not apply —
# which teaches you to merge past it, and then it is not a gate on main either.
if [ "$base" != "v3-pre-release" ]; then
  echo "$changed" | grep -qx 'docs/CHANGELOG-SUMMARY.md' \
    || miss="$miss
  · docs/CHANGELOG-SUMMARY.md has no line. Every version number needs one, even ops/docs-only."
fi
echo "$changed" | grep -qx 'package.json' \
  || miss="$miss
  · package.json was not bumped. (package-lock.json carries the version twice — both fields move.)"

# DEVLOG default is INVERTED: write it unless the change is purely mechanical. Measured across 22
# releases, CHANGELOG was 22/22 while DEVLOG was 8/22, and the misses were never the trivial ones.
if ! echo "$changed" | grep -qx 'docs/DEVLOG.md'; then
  mechanical=$(echo "$changed" | grep -vE '^(package(-lock)?\.json|docs/CHANGELOG(-SUMMARY)?\.md)$' | wc -l | tr -d ' ')
  [ "${mechanical:-0}" -gt 0 ] && miss="$miss
  · docs/DEVLOG.md has no entry, and this branch changes $mechanical non-mechanical file(s). Write it
    unless the change is genuinely mechanical — and if you are skipping it, SAY SO OUT LOUD and why."
fi

[ -z "$miss" ] && exit 0
printf 'RELEASE NOT READY — checked the BRANCH before merging, which is the only moment these can still be fixed:%s\n\nAdd them to this branch now; after the merge the only remedy is an extra release, which is what this gate exists to prevent. If a gap is deliberate, say which and why — then proceed.' "$miss" \
  | jq -Rs '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:.}}'
