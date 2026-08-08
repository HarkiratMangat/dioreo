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
# ⚠️ NON-FATAL, AND SKIPPED ENTIRELY WHEN THE TEST INJECTS ITS OWN FILE LIST.
# This script runs under `set -e`, so a failing fetch killed it outright and produced NO output —
# which reads exactly like "the release is complete". It passed locally and failed only in CI
# (2026-08-06 11:12 EDT), the classic shape of an environment-dependent gate: green on the machine
# that wrote it, silently dead on the machine that runs it. And when RELEASE_CHECK_FILES is set the
# diff is overridden anyway, so reaching the network at all was pointless — a unit test must never
# depend on a remote being reachable.
if [ -z "${RELEASE_CHECK_FILES:-}" ]; then
  git fetch origin "$base" --quiet 2>/dev/null || true
fi

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

# ADDED HERE 2026-08-07 22:25 EDT — the PostToolUse hook in settings.json's "RELEASE DOC CHECK" has
# checked this since 2026-07-28 (predates this file by 5 days), but only ever AFTER the merge, which
# is the exact wrong-moment bug this whole file's header describes, caught live a second time here:
# it flagged design-decisions.md needing an update for the v2.61.0 merge, but only after that merge
# was done, forcing a whole extra release (v2.61.1) to fix it. Same diff-based shape as the DEVLOG
# check above, now ALSO checked at the moment it can still be fixed for free.
# ⚠️ NOT removed from the PostToolUse hook — it stays there deliberately, same role items (1)
# package.json and (3) CHANGELOG-SUMMARY already play: RELEASE_SKIP below bypasses this gate's WHOLE
# miss-list, so a skipped merge needs an unconditional post-merge check as a safety net, not just a
# pre-merge one that a skip can wave through.
if echo "$changed" | grep -qE '^(commands|utils|models|scripts)/' && ! echo "$changed" | grep -qE '^(CLAUDE\.md|\.claude/rules/)'; then
  miss="$miss
  · code changed under commands/utils/models/scripts but no CLAUDE.md or .claude/rules/*.md note.
    Update the design/why note in the SAME change, or it goes stale the moment this merges."
fi

[ -z "$miss" ] && exit 0

# 🔴 THIS MUST **DENY**, NOT NARRATE — changed 2026-08-06 11:02 EDT, and it cost a release to learn.
# It emitted `additionalContext` only: a pure notice with NO permissionDecision at all, so it could
# never stop anything. It fired correctly on v2.56.1 — "four non-mechanical files, no DEVLOG entry" —
# and the merge proceeded regardless, exactly as it had every previous time. The fix then needed its
# own release (v2.56.2), which is precisely the cost this gate's own message warns about.
#
# This is the THIRD hook here caught at the wrong enforcement level. The force-overwrite gate and the
# squash-trailer gate were both `ask` until 2026-08-02, when it was measured that an `ask` from a
# PreToolUse hook is SILENTLY AUTO-APPROVED in this permission mode — never even shown. Both became
# `deny` and both now actually work (the trailer gate blocked this very session's first merge attempt
# and was right to). This one was weaker still and nobody re-checked it when those two were fixed.
# **When you fix one gate's enforcement level, audit every sibling the same day.**
#
# ⚠️ THE ESCAPE IS DELIBERATE AND MUST STAY. A hard deny on a JUDGEMENT call with no way through is a
# gate people route around by editing the hook — the failure mode the filed `--delete` item named as
# "how a guard becomes decorative". Skipping a DEVLOG entry is legitimately right for a purely
# mechanical release. So the skip is allowed, but only NAMED: prefix the merge with
#   RELEASE_SKIP="why this release genuinely needs no DEVLOG entry" gh pr merge …
# which turns an omission into a recorded decision sitting in the command itself. That is the
# distinction this gate has always been about — "it must be a decision, not an omission".
# ⚠️ `grep -o`, not a sed backreference, and `|| true` is load-bearing. This script runs under
# `set -eu`. The first version used `sed -nE 's/…\2\3/p'` with alternating groups, and when only one
# group participated BSD sed exited non-zero — `set -e` then killed the script MID-CHECK, producing
# ZERO output. A gate that silently emits nothing reads exactly like a gate that found no problems,
# which is the failure this whole file exists to prevent, reintroduced by the fix for it.
skip=$(printf '%s' "$cmd" | grep -oE 'RELEASE_SKIP=("[^"]*"|[^ ]+)' | head -1 || true)
skip=$(printf '%s' "$skip" | sed -e 's/^RELEASE_SKIP=//' -e 's/^"//' -e 's/"$//')
if [ -n "$skip" ]; then
  printf 'RELEASE GATE SKIPPED BY EXPLICIT DECISION: "%s"\n\nUnmet items were:%s\n\nThis is recorded rather than silent. If the reason above is not actually true, stop and fix the gap instead.' "$skip" "$miss" \
    | jq -Rs '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:.}}'
  exit 0
fi

printf 'RELEASE NOT READY — checked the BRANCH before merging, which is the only moment these can still be fixed:%s\n\nAdd them to this branch NOW, push, then merge: after the merge the only remedy is an extra release, which is what this gate exists to prevent (and it already cost one — v2.56.2 exists solely because this check could not block v2.56.1).\n\nIf the gap is genuinely deliberate — a purely mechanical release needs no DEVLOG entry — re-run the merge naming the reason, so the skip is a decision on the record instead of an omission:\n  RELEASE_SKIP="why this release needs no DEVLOG entry" gh pr merge …' "$miss" \
  | jq -Rs '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:.}}'
