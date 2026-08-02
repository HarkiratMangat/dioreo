#!/bin/bash
# squash-trailer-gate.sh — PreToolUse on Bash. DENY `gh pr merge --squash` with no explicit body.
#
# WHY IT IS A DENY AND NOT AN ASK (changed 2026-08-02 16:44 EDT)
# --------------------------------------------------------------
# This gate existed as `permissionDecision:"ask"` and did not work. An `ask` is a prompt, and a
# prompt is something a session in a hurry clicks past. Measured on the last 8 squash commits on
# `main`, where the correct shape is exactly 2 trailer lines (one Claude, one diorswrld):
#
#     ee3b0cd    2  ✅        f778195   20        a4b17d6   32
#     c6cd875    6            7cd21e7   22        8731b6f   28
#     6bf05ed    8            9b9b4ce  130
#
# The damning three are 7cd21e7 / 6bf05ed / c6cd875 — the merges that shipped the hook work
# ITSELF. The gate was installed and they still duplicated. As an `ask` it was never an
# enforcement layer, only a speed bump.
#
# Deny is safe rather than deadlocking: passing ANY body flag satisfies it and the gate never
# fires. It blocks exactly the call that produces the bug and nothing else.
#
# ROOT CAUSE, for whoever reads this later: the repo is set to
# `squash_merge_commit_message=COMMIT_MESSAGES`, so GitHub builds the squash body by
# CONCATENATING every commit on the branch — each commit's trailer block repeats once per commit.
# Flipping that repo setting is NOT the fix Harkirat wants; he wants a composed message
# (`dior pr compose`, filed in meta-deferred-list.md). This gate is what holds the line until then.

cmd=$(jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0

# Wrapper prefixes are matched because RTK.md documents that commands are transparently rewritten
# through `rtk`, and `rtk gh pr merge` is therefore a normal spelling. An anchor of
# `(^|[;&|] *)gh` missed it entirely — the same bypass found in main-push-guard.sh on 2026-08-02 16:44 EDT.
printf '%s' "$cmd" | grep -qE '(^|[;&|] *)((rtk|sudo|command|nohup|time) +)*gh pr merge' || exit 0
printf '%s' "$cmd" | grep -q -- '--squash' || exit 0

# A body flag in ANY accepted spelling. Anchored to a word start so that `--delete-branch` cannot
# satisfy it by containing the letters `-b`, and `--body-file`/`--body=` both count.
if printf '%s' "$cmd" | grep -qE '(^| )(--body(-file)?([= ]|$)|-b |-F )'; then
  exit 0
fi

jq -n '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:"SQUASH-TRAILER GATE (deny): `gh pr merge --squash` with no --body lets GitHub build the squash message by CONCATENATING every commit on the branch, so the Co-Authored-By block repeats once per commit. Measured on main: f778195 carries 20 trailer lines and 9b9b4ce carries 130; the correct shape is exactly 2. This was an `ask` until 2026-08-02 and got clicked past on three consecutive merges — including the ones that shipped the hooks. Re-run with an explicit --body whose LAST lines are exactly one trailer block: Co-Authored-By: Claude Opus 5 <noreply@anthropic.com> then Co-Authored-By: diorswrld <310361322+diorswrld@users.noreply.github.com>. Compose the body from the branch commits with the trailers stripped — do not paste the PR body, and do not concatenate the commit messages."}}'
