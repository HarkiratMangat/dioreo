#!/bin/bash
# ⚠️ Comments here are SOFT-WRAPPED: `npm run docs:reflow-comments` gates .sh files, so after editing this header run `node scripts/reflow-comments.mjs --write <this file>` or `npm test` goes red. ctx-index-refresh.sh — PreToolUse on context-mode's ctx_search. Re-indexes this repo's PROSE right before a search reads it.
#
# WHY THIS EXISTS (2026-08-30 11:46 EDT)
# --------------------------------------
# `ctx_index` writes a SNAPSHOT. Edit a rule file and the index keeps serving the old text under the old heading, with a real path — indistinguishable from current. There is no `detect_changes` equivalent (codebase-memory-mcp has one; context-mode does not). A one-off index is therefore a TRAP: it works for a week and then answers confidently with last month's rules, which is worse than not having it at all.
#
# WHY *BEFORE A SEARCH*. Harkirat, 2026-08-30 11:46 EDT: *"isn't the point of the index to UPDATE the database? how does running it at the start make sense?"* Correct. SessionStart refreshes when nobody is reading and misses everything changed during the session. PostToolUse-on-write is the wrong trigger too: a file just edited is already in context and will not be searched for; the reads that matter are of files nobody touched. Freshness only matters at the instant of a READ.
#
# 🔴 TWO DEFECTS FOUND BY ACTUALLY RUNNING IT, 2026-08-30 12:45 EDT — the first version had both, and both were SILENT:
#   1. It wrapped the index in `scripts/testCache.mjs`, which **refuses nested directories by design** ("directory inputs are expanded non-recursively"). `docs/` has five subdirectories, so it threw on every invocation — and `2>/dev/null` swallowed the error. The hook exited 0, indexed NOTHING, and looked healthy. A dead hook that reports success is the exact failure this repo has already been bitten by twice. The cache is now a self-contained content hash (below), which handles nesting and cannot be defeated by a swallowed exception.
#   2. It resolved the repo root from `CLAUDE_PROJECT_DIR`, which **in a git worktree is the WORKTREE**. That would have re-created the very bug this session purged: the content DB is keyed on the project root, so a worktree session would index into its own DB and every other session would silently see none of it. The root is now derived from `git rev-parse --git-common-dir`, which points at the MAIN worktree from anywhere in the repo.
#
# ⚠️ It never blocks and always exits 0 — a failed index must not break a search — but it no longer fails SILENTLY: an indexing failure is reported as additionalContext so the next result is not mistaken for a fresh one.

TOOL=$(jq -r '.tool_name // empty')
case "$TOOL" in *ctx_search*) ;; *) exit 0 ;; esac

# 🔴 THE MAIN WORKTREE, never CLAUDE_PROJECT_DIR. --git-common-dir resolves to <main>/.git from inside any worktree, so its parent is the one project root every session must share.
COMMON=$(git rev-parse --git-common-dir 2>/dev/null) || exit 0
case "$COMMON" in /*) ;; *) COMMON="$PWD/$COMMON" ;; esac
ROOT=$(cd "$(dirname "$COMMON")" 2>/dev/null && pwd) || exit 0
[ -d "$ROOT/docs" ] && [ -d "$ROOT/.claude/rules" ] || exit 0

CLI=$(ls -d "$HOME"/.claude/plugins/cache/context-mode/context-mode/*/cli.bundle.mjs 2>/dev/null | sort -V | tail -1)
[ -n "$CLI" ] && [ -f "$CLI" ] || exit 0
command -v node >/dev/null 2>&1 || exit 0

# Content hash over every indexed file, recursively. Self-contained on purpose: testCache.mjs is for FLAT input sets and throws on a nested directory, which is what made v1 a silent no-op. Stamp keyed BY ROOT: a second clone of this repo would otherwise fight over one stamp file and each would re-index on every search, forever, with nothing reporting it.
ROOTKEY=$(printf '%s' "$ROOT" | shasum | cut -c1-12)
STAMP="$HOME/.claude/context-mode/.dioreo-prose-stamp-$ROOTKEY"
# 🔴 HASH EVERY FILE, NOT JUST *.md. Measured 2026-08-30 13:00 EDT: ctx_index ingests .js and .py too — docs/superpowers/mockups/ contributes .grid.js, .serve.py, .proto-glyph.js — so a hash limited to .md/.json would leave the index STALE while the stamp reported it FRESH, which is the exact silent-staleness this hook exists to prevent, one level down. Over-invalidating costs 3s; under-invalidating costs correctness, so hash everything and sort for a stable order.
HASH=$(cd "$ROOT" && find docs .claude/rules CLAUDE.md -type f -exec shasum {} + 2>/dev/null | sort | shasum | cut -d' ' -f1)
[ -z "$HASH" ] && exit 0
[ -f "$STAMP" ] && [ "$(cat "$STAMP" 2>/dev/null)" = "$HASH" ] && exit 0   # unchanged -> no-op

err=$(cd "$ROOT" && {
  node "$CLI" index docs           --source project:dioreo-docs     --project "$ROOT" 2>&1 >/dev/null
  node "$CLI" index .claude/rules  --source project:dioreo-rules    --project "$ROOT" 2>&1 >/dev/null
  node "$CLI" index CLAUDE.md      --source project:dioreo-claudemd --project "$ROOT" 2>&1 >/dev/null
})
if [ -n "$err" ]; then
  printf 'CTX INDEX REFRESH FAILED — the prose index was NOT updated, so ctx_search results may be STALE. Treat what comes back as possibly out of date, or fall back to rg.\n\n%s' "$err" \
    | jq -Rs '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:.}}'
  exit 0
fi
printf '%s' "$HASH" > "$STAMP" 2>/dev/null
exit 0
