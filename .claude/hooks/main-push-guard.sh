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

# ⚠️ AN EXPLICIT NON-main DESTINATION REF IS NOT A PUSH TO main — added 2026-08-06 10:46 EDT.
# The only question asked before this was "is the PROJECT DIR on main?", so once a merge deleted the
# working branch and left HEAD on main, this denied EVERY push — including pushing a feature branch,
# and including pushes belonging to a DIFFERENT REPOSITORY (`cd ~/.config/dior && git push -u origin
# fix/...`), where the project dir's branch says nothing about the operation at all. That blocked the
# dior-CLI PR minutes after this same session shipped the guard's own release.
#
# Same matcher defect already filed at [P3 · XS] for `git push origin --delete <branch>`: the pattern
# saw `git push` plus a remote and stopped there. One rule fixes both, and it is the narrow shape the
# filed item asked for rather than broadening until it stops firing — "that is how a guard becomes
# decorative".
#
# Only an EXPLICIT ref counts. A bare `git push` on main still denies, because there the destination
# really is main and no refspec disclaims it.
# ⚠️ `:` MUST be in the ref character class, in BOTH the test and the extraction. Without it the
# extractor stopped at the colon of `abc1234:main`, yielding dest `abc1234` — so pushing an arbitrary
# sha straight onto main read as "a branch that is not main" and was allowed. The suite's existing
# sha:main case caught it, which is exactly why that case exists.
if echo "$cmd" | grep -qE 'git +push[^;&|]*[[:space:]](origin|upstream)[[:space:]]+(-d[[:space:]]+|--delete[[:space:]]+)?[A-Za-z0-9._/:-]+'; then
  ref=$(echo "$cmd" | sed -E 's|.*git +push[^;\&\|]*[[:space:]](origin\|upstream)[[:space:]]+(-d[[:space:]]+\|--delete[[:space:]]+)?([A-Za-z0-9._/:-]+).*|\3|')
  # ⚠️ JUDGE THE DESTINATION, NOT THE WHOLE REFSPEC. A refspec is `<src>:<dst>`, and only the
  # destination decides where the commits land. The first version of this exemption compared the
  # whole string against a fixed list, so `git push origin abc1234:main` — pushing an arbitrary sha
  # straight onto main — matched none of them and was ALLOWED. Caught by this suite's existing
  # `sha:main` case, which is the reason that case was written in the first place.
  dest="${ref##*:}"
  case "$dest" in
    main|HEAD) ;;    # destined for main (bare HEAD on main IS main) -> keep denying
    *) exit 0 ;;     # a named branch that is not main -> allowed
  esac
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
