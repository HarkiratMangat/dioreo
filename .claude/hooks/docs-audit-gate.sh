#!/usr/bin/env bash
# PreToolUse(Bash) gate on `gh pr create` — run the FULL documentation audit before the PR exists.
#
# WHY (2026-07-29 00:50 EDT): the audit was already a CI gate, which is the durable half — it holds for
# PRs opened by anyone, forever. But CI is also the SLOW half: you find out after pushing, after the PR
# is open, after a reviewer may already be looking. This runs the same single implementation locally, at
# the last moment where fixing it is still free.
#
# It also closes a real hole in the trigger map. Only three things fired at `gh pr create` before this
# (the stale-reference sweep, the DEVLOG TOC check, and the records-close check) and NONE of them ran
# the tree-level invariants. A branch could reach CI with a broken doc map and nothing local would have
# said a word.
#
# ⚠️ HONEST LIMIT, stated so nobody mistakes this for total coverage: this fires only on the literal
# `gh pr create` command inside a Claude Code session on this machine. A PR opened through the GitHub
# web UI, from another machine, or by another tool bypasses it entirely — which is exactly why the same
# audit also runs in CI. The local gate is a convenience; CI is the guarantee.
#
# `--diff "$BASE"` adds archive-conservation, which is a fact about the CHANGE (did items removed from
# an active list actually land in an archive) and cannot be evaluated from the tree alone.

set -uo pipefail
REPO="${CLAUDE_PROJECT_DIR:-/Applications/Claude Code/Diors-Builds}"
cd "$REPO" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0
[ -f scripts/docs-audit.mjs ] || exit 0
BASE="${1:-main}"

out=$(node scripts/docs-audit.mjs --diff "$BASE" --json 2>/dev/null)
[ -n "$out" ] || exit 0

# Only ERRORs gate. WARNs are advisory by contract and must never block a hotfix — surfacing them here
# as a blocker would be the fastest way to teach everyone to bypass the gate.
errors=$(printf '%s' "$out" | jq -r '.errors // 0' 2>/dev/null)
[ "${errors:-0}" -gt 0 ] 2>/dev/null || exit 0

detail=$(printf '%s' "$out" | jq -r '[.results[] | select(.severity=="ERROR")] | map("    [" + .id + "] " + .msg) | join("\n")' 2>/dev/null)
ledger=$(printf '%s' "$out" | jq -r '[.ledger[] | select(.skipped != null)] | map("    skipped [" + .id + "]: " + .skipped) | join("\n")' 2>/dev/null)

jq -n --arg d "$detail" --arg l "$ledger" --arg n "$errors" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "ask",
    permissionDecisionReason: ("DOCS AUDIT FAILED -- " + $n + " error(s). This is the same check CI runs, run early so the fix is still free:\n\n" + $d + "\n" + (if $l == "" then "" else "\n  Checks that did NOT run:\n" + $l + "\n" end) + "\nFix them, or run `npm run docs:audit` to see the full report. If a finding is wrong, fix the CHECK -- do not add an exemption to silence a real defect.")
  }
}'
