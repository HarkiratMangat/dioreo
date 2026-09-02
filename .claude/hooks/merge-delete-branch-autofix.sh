#!/bin/bash
# merge-delete-branch-autofix.sh — PreToolUse on Bash. Appends --delete-branch to a `gh pr merge`.
#
# WHY THIS EXISTS (2026-09-02 15:46 EDT)
# ------------------------------------------------
# The repo already had a `--delete-branch` check and it fired at the WRONG MOMENT: a PostToolUse
# advisory, reached only after the merge had already happened, telling you to go and clean up by
# hand. That is documentation wearing a hook's clothes, and this repo has a standing test for it --
# "at the moment this fires, can the thing it complains about still be prevented?" It could not.
#
# The defect it reports is real: 10 merged branches were found rotting on 2026-07-27 21:50 EDT, the
# oldest from PR #11, because GitHub's auto-delete removes the REMOTE branch and nothing removes the
# local one. `--delete-branch` does both in one step and the workflow in CLAUDE.md asks for it on
# every merge without exception.
#
# So the corrected value is known, fixed, and has no second reading -- the promotion test this repo
# applies to any autofix. Unlike a typo (many plausible corrections) or a lone `rg -r` (a legitimate
# --replace), there is exactly one right answer here and it is a constant.
#
# ⚠️ IT ASKS RATHER THAN ALLOWS. A merge is irreversible and outward-facing, so the modified command
# is put in front of Harkirat rather than waved through. Note the honest caveat: an `ask` from a
# PreToolUse hook is silently auto-approved in this permission mode -- measured, recorded in
# squash-trailer-gate.sh -- so in practice this behaves like allow. It is written as `ask` because
# that is the intent, and if the permission mode ever changes the intent is what should survive.
#
# ⚠️ IT DOES NOT COMPETE WITH squash-trailer-gate. That hook DENIES a `--squash` merge with no
# --body, and deny beats ask in the documented precedence, so a merge missing its trailer block is
# still stopped first. This only ever adds a flag to a merge that was otherwise going to run.

set -u
cmd=$(jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0

# Same invocation pattern the sibling gh hooks use, including the rtk/sudo/nohup prefixes that the
# rewrite layer adds -- a guard that misses `rtk gh pr merge` is the exact defect main-push-guard
# shipped with (it passed `rtk git push` straight through, and it is the only hook that can block).
printf '%s' "$cmd" | grep -qE '(^|[;&|] *)((rtk|sudo|command|nohup|time) +)*gh pr merge' || exit 0
printf '%s' "$cmd" | grep -q -- '--delete-branch' && exit 0

msg="BRANCH-PRUNE: this \`gh pr merge\` had no --delete-branch, so the merged branch would survive locally (and remotely unless GitHub's auto-delete caught it). That is how 10 merged branches accumulated unpruned by 2026-07-27. The flag was appended rather than reported after the fact -- the old check was PostToolUse and could only ever tell you to clean up by hand."

# The capability seam, same shape as timestamp-check's TS_NO_AUTOFIX: every input this detector
# matches is by construction one the substitution can repair, so no content can reach the advisory
# branch. Without a seam that branch is unreachable, and an unreachable branch rots.
if [ -n "${MERGE_NO_AUTOFIX:-}" ]; then
  printf '%s' "$msg" | jq -Rs '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:.}}'
  exit 0
fi

fixed="$cmd --delete-branch"
jq -n --arg c "$fixed" --arg r "$msg" \
  '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"ask",updatedInput:{command:$c},permissionDecisionReason:$r}}'
