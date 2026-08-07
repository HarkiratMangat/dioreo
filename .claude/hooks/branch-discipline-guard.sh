#!/bin/bash
# branch-discipline-guard.sh — PreToolUse. Refuse to modify a TRACKED file, or to commit, while
# HEAD sits on a protected branch (`main` / `master`).
#
# WHY THIS EXISTS (2026-08-02 16:44 EDT)
# --------------------------------------
# Harkirat, this session: *"you should *already* be on a branch... not editing directly to main.
# there's also a gate/hook that's supposed to be preventing you from doing that."*
#
# The first half was right and the second half was not, and the gap is the point. Measured at the
# time: PreToolUse had 7 hooks — `Artifact` ×1 and `Bash` ×6 — and **not one on `Edit|Write`**.
# All three `Edit|Write` hooks were PostToolUse. So `main-push-guard.sh` caught a `git push` from
# main, but editing tracked files on main and committing them was completely unguarded; the guard
# only spoke at the last step, by which point there are commits on `main` to unwind. Retracting
# `ebbf196` is what that costs.
#
# TWO SURFACES, ONE SCRIPT, because they are one rule and splitting them would let the two drift:
#   · Edit|Write → deny when the target file is TRACKED in a repo whose HEAD is protected.
#   · Bash       → deny `git commit` while HEAD is protected.
#
# WHY "TRACKED", NOT "INSIDE THE REPO". An untracked or gitignored file (`local/`, `.env.dev`, a
# scratch file) carries no history and cannot pollute a release, so blocking it would be pure
# friction. The commit guard is what catches a NEW file: it can be written freely, but it cannot
# be committed onto main. The two halves layer deliberately.
#
# WHY THE FILE'S OWN REPO, NOT $CLAUDE_PROJECT_DIR. Sessions here routinely edit files outside
# this repo — `/Applications/Claude Code/meta-deferred-list.md` is not in a git repo at all, and
# `~/.claude/` is a different tree. Resolving the repo from the file being written keeps this
# from either missing those or falsely blocking them.
#
# ESCAPE: `git switch -c <type>/<kebab-description>` carries uncommitted changes with it, so
# complying costs one command and loses nothing. That is why this is a deny and not an ask.

input=$(cat)
tool=$(printf '%s' "$input" | jq -r '.tool_name // empty')

deny() { jq -n --arg r "$1" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'; exit 0; }

# Returns the protected branch name on stdout if $1's repo is on one, else nothing.
protected_branch_for() { # $1 = a directory
  local top br
  top=$(git -C "$1" rev-parse --show-toplevel 2>/dev/null) || return 1
  [ -n "$top" ] || return 1
  br=$(git -C "$top" rev-parse --abbrev-ref HEAD 2>/dev/null) || return 1
  case "$br" in main|master) printf '%s' "$br";; *) return 1;; esac
}

case "$tool" in
  Edit|Write|NotebookEdit)
    fp=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')
    [ -z "$fp" ] && exit 0
    dir=$(dirname "$fp")
    [ -d "$dir" ] || exit 0
    br=$(protected_branch_for "$dir") || exit 0
    # Only TRACKED files. `--error-unmatch` is the exact question: does git already know this path?
    git -C "$dir" ls-files --error-unmatch -- "$fp" >/dev/null 2>&1 || exit 0
    deny "BRANCH DISCIPLINE (deny): \`$(basename "$fp")\` is tracked in a repo whose HEAD is on \`$br\`, and this repo's flow is Branch → Commit → Test → Push → PR → Merge → Deploy. Editing tracked files on \`$br\` is how work ends up committed there — and \`main\` is branch-protected, so it then has to be unwound rather than merged. Run: git switch -c <type>/<kebab-description>. Uncommitted changes COME WITH YOU, so nothing is lost and nothing needs redoing — then repeat this edit. Untracked and gitignored files (local/, scratch files) are deliberately not blocked."
    ;;
  Bash)
    cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
    [ -z "$cmd" ] && exit 0
    # Wrapper prefixes for the same reason as main-push-guard.sh: `rtk git commit` is a documented
    # normal spelling, and an anchor that only accepts a bare `git` silently passes it.
    printf '%s' "$cmd" | grep -qE '(^|[;&|] *)((rtk|sudo|command|nohup|time|env( +[A-Za-z_][A-Za-z0-9_]*=[^ ]*)*) +)*git +commit([^[:alnum:]-]|$)' || exit 0
    dir="${CLAUDE_PROJECT_DIR:-$PWD}"
    br=$(protected_branch_for "$dir") || exit 0
    # ⚠️ DELIBERATELY does not check whether anything is staged. This is PreToolUse, so there is nothing
    # to inspect yet — but even if there were, matching the COMMAND PATTERN rather than the outcome is
    # the point: a version that waved a commit through whenever the index happened to be empty would let
    # the reflex form, and the next time something tracked IS staged it lands on a protected branch.
    # ⚠️ The REMEDY carries the gitignored-only escape (added 2026-08-06 21:24 EDT). The block was right
    # and the suggested fix was wrong for the case that triggered it: writing two handoffs into
    # gitignored `local/` needed no commit AT ALL, yet the message said "git switch -c", which would
    # have produced a branch for an empty commit. The Write/Edit branch above already states this
    # exemption; this one did not, and that asymmetry taught the wrong lesson.
    deny "BRANCH DISCIPLINE (deny): you are on \`$br\` and this would commit straight onto it. Every commit on \`$br\` must arrive through a squashed PR — a direct commit skips review and CI, and belongs to no release. Run: git switch -c <type>/<kebab-description> (staged and unstaged changes come with you), commit there, then open the PR. If commits are ALREADY on \`$br\`: git branch <type>/<name> && git reset --hard origin/$br && git switch <type>/<name>. AND FIRST, CHECK WHETHER YOU NEED A COMMIT AT ALL: if nothing TRACKED changed — you only wrote to \`local/\`, a scratch file, or another gitignored path — there is nothing to commit and nothing to branch. Skip it entirely rather than creating a branch for an empty commit. \`git status --porcelain\` settles it."
    ;;
esac
exit 0
