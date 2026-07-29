#!/usr/bin/env bash
# PreToolUse(Bash) gate on `gh pr create` — the BACKWARD-verification sweep.
#
# WHY THIS EXISTS (2026-07-28 16:45 EDT, Harkirat's ask):
# The recurring complaint, in his words: "EVERY session I have to ask to double check and verify
# things, and it ALWAYS catches errors."
#
# Root cause, named honestly: I verify FORWARD (does the thing I built work?) and not BACKWARD (what
# did building it make untrue?). Both are real verification; only the first one happens on its own.
# In the v2.41.0 session I tested the rewritten script on the Mac, on the VM, in both log sources, with
# malformed args, and boot-tested the bot — all forward, all passing — then declared it ready to push.
# The sweep Harkirat then asked for found: a memory file documenting the RETIRED deploy workflow, two
# `.claude/rules/` files describing the old behaviour, a stale ROADMAP note, a stale SESSION-START note,
# and a genuine pre-existing bug in `deploy.sh`'s use of the very script being rewritten. Every one of
# those files contained the string "vmstatus" and none of them were opened.
#
# That is mechanically checkable, which per `reference_enforcement_hooks` means it must be a hook and
# not a fifth prose copy of "remember to check references" — prose rules have a measured failure rate
# here (`grep` 788x vs `rg` 4x). The rule this enforces: if you changed a file, every OTHER file that
# names it is a candidate for having just become wrong.
#
# Silent when the branch is clean. It only speaks when there is something unswept — so the interruption
# is exactly proportional to the miss, and doing the job properly costs nothing.

set -uo pipefail
# ⚠️ CLAUDE_PROJECT_DIR, not a hardcoded path. Fixed 2026-07-29 00:45 EDT after discovering it
# while using a worktree to avoid disturbing a parallel session: superpowers' using-git-worktrees skill
# actively encourages worktrees, and with the path pinned to the main tree this gate silently inspected
# the WRONG branch -- reporting clean about work that isn't there, or dirty about work you can't see.
# A gate that answers confidently about the wrong tree is worse than no gate.
REPO="${CLAUDE_PROJECT_DIR:-/Applications/Claude Code/Diors-Builds}"
MEM="$HOME/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory"

cd "$REPO" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

BASE="${1:-main}"
changed=$(git diff --name-only "$BASE...HEAD" 2>/dev/null)
[ -n "$changed" ] || exit 0

# Only code/config/script changes redefine behaviour that prose elsewhere describes. A docs-only branch
# is exempt: doc-to-doc references are what the changelog/DEVLOG hooks already cover, and flagging them
# here would fire on every release and train the gate into background noise.
subjects=$(printf '%s\n' "$changed" \
  | grep -E '\.(js|mjs|sh|ya?ml)$' \
  | grep -vE '^(docs|node_modules)/' \
  | xargs -n1 basename 2>/dev/null \
  | sed 's/\.[^.]*$//' \
  | sort -u)
[ -n "$subjects" ] || exit 0

report=""
for s in $subjects; do
  # Skip names too generic to be a meaningful reference (index, config, utils...) — matching those
  # returns the whole repo and buries the real signal.
  case "$s" in index|config|utils|main|test|setup|package) continue;; esac
  [ "${#s}" -ge 5 ] || continue

  # --hidden --no-ignore is mandatory here: .claude/ is a dot-dir and would otherwise be invisible —
  # which is precisely where two of the stale files that prompted this hook were sitting.
  hits=$(rg --hidden --no-ignore -l --fixed-strings "$s" \
           "$REPO/docs" "$REPO/.claude" "$REPO/CLAUDE.md" "$MEM" 2>/dev/null \
         | sed "s|^$REPO/||" | sort -u)
  [ -n "$hits" ] || continue

  # When did this branch start? Anything edited since then was part of this work and counts as swept.
  branch_start=$(git log -1 --format=%ct "$BASE" 2>/dev/null || echo 0)

  unswept=""
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    # Don't flag this hook, or the sweep would forever report itself for every subject it names.
    case "$f" in .claude/hooks/*) continue;; esac
    # Already updated on this branch? Then it was considered.
    printf '%s\n' "$changed" | grep -qxF "$f" && continue
    # Memory files live OUTSIDE the repo and can never appear in a git diff, so fall back to mtime:
    # touched since the branch started = swept. Without this the same handful of memory files would be
    # listed on every single PR including ones that just updated them — and a gate that cries wolf on
    # work you actually did is a gate that gets dismissed unread.
    case "$f" in
      /*) m=$(stat -f %m "$f" 2>/dev/null || stat -c %Y "$f" 2>/dev/null || echo 0)
          [ "${m:-0}" -gt "${branch_start:-0}" ] && continue ;;
    esac
    unswept="$unswept
      - $f"
  done <<< "$hits"

  [ -n "$unswept" ] && report="$report
  '$s' is referenced by files NOT touched on this branch:$unswept"
done

[ -n "$report" ] || exit 0

jq -n --arg r "$report" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "ask",
    permissionDecisionReason: ("STALE-REFERENCE SWEEP (backward verification).\n\nYou changed code that other files DESCRIBE. Those descriptions may have just become wrong -- this is the miss Harkirat has had to catch by hand every session, and it is the reason this gate exists.\n" + $r + "\n\nOpen each one and confirm it is still TRUE of the new behaviour. Fix the stale ones ON THIS BRANCH so they ride in the PR (docs land in the PR -- project_git_workflow). Memory files never appear in a git diff, so they are always listed here; that is deliberate, they go stale the most.\n\nProceed only once you have actually checked them -- not because the list looks short.")
  }
}'
