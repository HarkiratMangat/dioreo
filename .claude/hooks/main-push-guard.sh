#!/bin/sh
# main-push-guard.sh — refuse a push while HEAD is on `main`.
#
# WHY THIS EXISTS (2026-08-02 01:30 EDT)
# --------------------------------------
# The workflow is Branch → Commit → Test → Push → PR → Merge → Deploy, and CLAUDE.md
# spells out the exact failure: "if you find yourself about to commit on main after
# merging, stop." Immediately after merging and tagging v2.47.0 I committed a
# documentation change straight onto `main` and pushed it. Nothing stopped me,
# because that rule had never been anything but prose.
#
# It did no damage that time — the commit was docs-only and the tag still pointed at
# a `package.json` reading the tagged version — but it is the same class as the two
# real incidents already recorded: a release tag landing on the wrong commit, and a
# `chore(release)` follow-up commit that produced sixteen two-commit releases.
#
# WHAT IT DOES NOT COVER, deliberately stated so nobody assumes more than is true:
#   · It is a Claude Code PreToolUse hook, so it only fires for pushes issued
#     through this tool. A push typed into a terminal is unaffected.
#   · The real, universal control is GitHub branch protection on `main` (require a
#     pull request). This hook is the cheap in-repo half; it is not a substitute.
#
# ⚠️ It reads the branch from git, never from the command string. Parsing the push
# command would miss `git push` with no arguments, which is exactly how the
# violation happened.
set -eu

cmd=$(jq -r '.tool_input.command // empty')

# Only look at real pushes. `--dry-run` changes nothing, and a push that names an
# explicit non-main refspec (`git push origin HEAD:refs/...`) is not this failure.
#
# ⚠️ WRAPPER PREFIXES — found by the test written 2026-08-02 16:38 EDT, three weeks after this
# guard shipped. The old anchor was `(^|[;&|] *)git +push`, which requires `git` to sit at the
# start of a command. `rtk git push` therefore did NOT match, and this hook — the only one in the
# repo that can actually block — silently allowed the exact command it exists to stop. RTK.md
# documents that shell commands are transparently rewritten through `rtk`, so this was not a
# hypothetical spelling; it is the documented normal form. `sudo`, `env`, `command`, `nohup` and
# `time` are covered for the same reason.
#
# The wrapper list is EXPLICIT rather than "any leading words" on purpose: a permissive prefix
# would make `echo git push ...` match, and a guard that fires on prose trains you to dismiss it —
# which is how the real fire gets dismissed too (the noise lesson from timestamp-check.sh).
#
# `([^[:alnum:]]|$)` after `push` keeps `git pushing` from matching, which the loose form allowed.
echo "$cmd" | grep -qE '(^|[;&|] *)((rtk|sudo|command|nohup|time|env( +[A-Za-z_][A-Za-z0-9_]*=[^ ]*)*) +)*git +push([^[:alnum:]]|$)' || exit 0
echo "$cmd" | grep -q -- '--dry-run' && exit 0

dir="${CLAUDE_PROJECT_DIR:-/Applications/Claude Code/Diors-Builds}"
branch=$(cd "$dir" 2>/dev/null && git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0

# ⚠️ TWO WAYS TO PUSH TO main, AND THE FIRST VERSION ONLY CAUGHT ONE. Checking the
# current branch misses an explicit refspec — `git push origin HEAD:main`, or
# `git push origin <sha>:main`, or `git push origin main` from a feature branch — all
# advance main from anywhere. Found while force-pushing main to retract a commit,
# using a command this guard was supposed to cover and did not.
# The word boundary matters: `main` must not match `main-something` or `maintenance`.
targets_main=0
echo "$cmd" | grep -qE 'git +push[^;&|]*(^| |:)main( |$)' && targets_main=1

[ "$branch" = "main" ] || [ "$targets_main" = "1" ] || exit 0

# Pushing a TAG from main is legitimate and is part of the release flow — the tag is
# created on main after the squash merge. Allow it; block only branch pushes.
if echo "$cmd" | grep -qE 'git +push[^;&|]*(--tags|refs/tags/|[[:space:]]v[0-9]+\.[0-9]+\.[0-9]+)'; then
  exit 0
fi

cat <<'MSG' >&2
BLOCKED: you are on `main` and this would push commits directly to it.

This repo's flow is Branch → Commit → Test → Push → PR → Merge → Deploy. A direct
push to `main` skips PR review, skips CI on the change itself, and produces a commit
that belongs to no release.

Do this instead:
  git switch -c <type>/<kebab-description>
  git push -u origin <that branch>
  gh pr create --base main      # or --base v3-pre-release for v3 work

If the commits are already on main, move them:
  git branch <type>/<name> && git reset --hard origin/main && git switch <type>/<name>

Pushing a release TAG from main is allowed and is not affected by this.
MSG
exit 2
