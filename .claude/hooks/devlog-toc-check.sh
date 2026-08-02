#!/usr/bin/env bash
# PreToolUse(Bash) gate on `gh pr create` — DEVLOG table-of-contents sync.
#
# WHY (2026-07-28 17:35 EDT): `docs/DEVLOG.md`'s Part A table of contents is maintained by hand, with a
# "**Keep in sync** when you add an entry" note. It was found **15 entries behind the body** on
# 2026-07-28 16:20 EDT — every 2026-07-27 and 2026-07-28 entry missing — the same asymmetry already
# measured for the DEVLOG itself (machine-checked 22/22, attention-dependent 8/22). A note asking
# politely is not a mechanism.
#
# Harkirat caught the second half of the problem the same day: the TOC used vague qualifiers ("later",
# "afternoon", "late afternoon") instead of the timestamps the body headings carry. That made it
# ambiguous, made it ROT (insert one entry and every "later" below it silently shifts meaning), and
# defeated the TOC's own stated purpose — its header says to jump by SEARCHING the entry text, which
# cannot work when the TOC text doesn't match the heading text.
#
# The rule is exact mirroring: **every DATED Part A TOC line is its body heading with `## ` stripped.**
#
# ⚠️ CHANGED 2026-07-28 20:45 EDT — the comparison logic MOVED to `scripts/docs-audit.mjs` (check id
# `devlog-toc`) and this file now just calls it. Two reasons, both learned the hard way:
#   1. It was the only copy. A hook runs solely inside a Claude session on this Mac, so a PR opened
#      any other way was unchecked. The audit also runs in CI, on every PR, forever.
#   2. Its exemption for the intentional non-dated TOC pointer ("Earlier milestones", which has no
#      body heading and was very nearly deleted by a naive regeneration) now lives in ONE place with
#      a self-test proving it, instead of being re-derived in each copy.

set -uo pipefail
# ⚠️ CLAUDE_PROJECT_DIR, not a hardcoded path. Fixed 2026-07-29 00:45 EDT after discovering it
# while using a worktree to avoid disturbing a parallel session: superpowers' using-git-worktrees skill
# actively encourages worktrees, and with the path pinned to the main tree this gate silently inspected
# the WRONG branch -- reporting clean about work that isn't there, or dirty about work you can't see.
# A gate that answers confidently about the wrong tree is worse than no gate.
REPO="${CLAUDE_PROJECT_DIR:-/Applications/Claude Code/Diors-Builds}"
cd "$REPO" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0
BASE="${1:-main}"

# Committed changes only — correct for a `gh pr create` gate, since you commit before opening a PR.
git diff --name-only "$BASE...HEAD" 2>/dev/null | grep -qx 'docs/DEVLOG.md' || exit 0

# ⚠️ FAILSAFE (2026-07-29 02:00 EDT). This gate DELEGATES to scripts/docs-audit.mjs so there is one
# implementation of the TOC rule -- but delegation replaced a working standalone check with a single
# point of failure. If the audit is deleted, renamed, or throws, a bare \`exit 0\` here would silently
# retire the gate, which is the exact class of failure this whole enforcement layer exists to stop.
# So an audit that cannot RUN is itself reported. Deliberately NOT a duplicated copy of the comparison
# logic: two copies drift, and the drift is silent too.
if [ ! -f scripts/docs-audit.mjs ]; then
  jq -n '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:"DEVLOG TOC GATE CANNOT RUN: scripts/docs-audit.mjs is missing, so the table of contents was NOT checked against the body. Restore it, or check the TOC by hand before opening this PR -- do not treat this as a pass."}}'
  exit 0
fi

raw=$(node scripts/docs-audit.mjs --only devlog-toc --json 2>&1)
if ! printf '%s' "$raw" | jq -e . >/dev/null 2>&1; then
  jq -n --arg e "$(printf '%s' "$raw" | head -c 400)" '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:("DEVLOG TOC GATE CANNOT RUN: docs-audit.mjs did not return valid JSON, so the TOC was NOT checked. A broken audit must never read as a clean one.\n\n" + $e)}}'
  exit 0
fi

findings=$(printf '%s' "$raw" | jq -r '.results[]? | "    - " + .msg' 2>/dev/null)

[ -n "${findings// /}" ] || exit 0

jq -n --arg d "$findings" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    additionalContext: ("DEVLOG TOC OUT OF SYNC.\n\nEvery dated Part A entry in the table of contents must be its body heading verbatim (with `## ` stripped) -- that is what makes the TOC greppable straight to the entry, and it is why vague qualifiers like \"(later)\" were retired 2026-07-28 17:35 EDT.\n\n" + $d + "\n\nFix the TOC, but do NOT blind-regenerate it: the block also holds intentional non-dated pointer lines with no body heading, and a naive rebuild deletes them.\n\nRun `npm run docs:audit` to re-check.")
  }
}'
