#!/usr/bin/env bash
# PreToolUse(Bash) gate on `gh pr create` — the two records CI cannot see.
#
# WHY THIS EXISTS (2026-07-28 20:35 EDT, Harkirat's ask)
# ------------------------------------------------------
# The chore checklist's items 6 (memory) and 7 (notes file) were documented as "NOT checkable", in the
# README and in the RELEASE DOC CHECK hook's own message. That was wrong, and lazily so — a
# SessionStart hook had been counting the notes file's open items the whole time.
#
# The real defect was never absence, it was TIMING. That check fires at session START: the moment of
# DISCOVERY, when there is nothing filed yet and nothing to compare against. It never fires at the
# moment of CLOSURE. This is the exact shape of the DEVLOG failure that was measured at 8/22 — a
# condition evaluated at the one moment it cannot be acted on.
#
# So these two run at `gh pr create`, next to the stale-reference sweep and the DEVLOG TOC check,
# which is when the work is actually closable. Both are DERIVED, not guessed:
#   (7) the notes file has open items, and this branch never touched it
#   (6) this branch changed a rule/enforcement file, and no memory file was written since the branch
#       point -- so a rule was changed with nothing recorded about why
#
# Neither can prove a JUDGMENT was made correctly. They prove an artifact was never opened, which is
# the failure that actually kept happening. `permissionDecision: "ask"` on purpose: skipping is often
# right, but it should be a decision, not an omission.

set -uo pipefail
# ⚠️ CLAUDE_PROJECT_DIR, not a hardcoded path. Fixed 2026-07-29 00:45 EDT after discovering it
# while using a worktree to avoid disturbing a parallel session: superpowers' using-git-worktrees skill
# actively encourages worktrees, and with the path pinned to the main tree this gate silently inspected
# the WRONG branch -- reporting clean about work that isn't there, or dirty about work you can't see.
# A gate that answers confidently about the wrong tree is worse than no gate.
REPO="${CLAUDE_PROJECT_DIR:-/Applications/Claude Code/Diors-Builds}"
NOTES="$REPO/docs/diors-builds notes.md"
MEM="$HOME/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory"

cd "$REPO" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0
BASE="${1:-main}"

changed=$(git diff --name-only "$BASE...HEAD" 2>/dev/null)
[ -n "$changed" ] || exit 0

msg=""

# ---- (7) notes file -------------------------------------------------------
# Same scoping as the SessionStart counter: the working sections only. The 🔑 Legend above them
# documents the markers using identical syntax and must not be counted as intake.
if [ -f "$NOTES" ]; then
  open=$(awk '/^## Questions/{f=1} /^## 📍/{exit} f{print}' "$NOTES" | grep -cE '^- [^<[]' || true)
  if [ "${open:-0}" -gt 0 ] && ! printf '%s' "$changed" | grep -qx 'docs/diors-builds notes.md'; then
    preview=$(awk '/^## Questions/{f=1} /^## 📍/{exit} f{print}' "$NOTES" | grep -E '^- [^<[]' | cut -c1-100 | head -3)
    msg="$msg(7) NOTES FILE: it carries $open open item(s) and this branch never touched it. Items are marked and filed IN-FILE the same session -- a note that stays open across sessions is how the DMZ /autobuild item sat only in the scratchpad for days. Open items:
$preview
"
  fi
fi

# ---- (6) memory -----------------------------------------------------------
# A rule changed with nothing written down is the drift this whole enforcement layer exists to stop.
if [ -d "$MEM" ]; then
  rulechange=$(printf '%s' "$changed" | grep -E '^(CLAUDE\.md|\.claude/rules/|\.claude/settings\.json|\.claude/hooks/)' | head -5)
  if [ -n "$rulechange" ]; then
    point=$(git merge-base "$BASE" HEAD 2>/dev/null)
    since=$(git log -1 --format=%ct "$point" 2>/dev/null)
    if [ -n "$since" ]; then
      # -maxdepth 1 is load-bearing: memory/archive/ holds RETIRED memories, and editing one (e.g.
      # stamping its retirement header) bumps its mtime — which without this flag would count as
      # "a memory was written this branch" and silently satisfy check (6) while nothing live was
      # recorded. Only ACTIVE memory proves a standing rule was written down.
      recent=$(find "$MEM" -maxdepth 1 -name '*.md' -newermt "@$since" 2>/dev/null | wc -l | tr -d ' ')
      if [ "${recent:-0}" -eq 0 ]; then
        msg="$msg(6) MEMORY: this branch changes rule/enforcement files but NO memory file has been written since the branch point. Changed:
$(printf '%s' "$rulechange" | sed 's/^/    /')
The memory store is the only place a standing rule survives the session that established it.
"
      fi
    fi
  fi
fi

[ -n "$msg" ] || exit 0

jq -n --arg m "$msg" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "ask",
    permissionDecisionReason: ("RECORDS NOT CLOSED -- the two chore-checklist items CI cannot see:\n\n" + $m + "\nBoth were previously documented as \"NOT checkable\". They are checkable; the old check simply ran at session START, when there is nothing to close yet. If skipping either is the right call here, say so out loud and why -- a silent omission is the failure this gate exists to stop.")
  }
}'
