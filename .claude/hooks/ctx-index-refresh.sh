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

# 🔴 THE THREE SURFACES NO IN-REPO SEARCH CAN REACH, ADDED 2026-09-01 17:43 EDT. The completeness sweep names them every run as "invisible by construction, not by oversight", and `ctx_search` could not see them either for the same reason: everything above resolves inside $ROOT. Measured the same day — four memory assertions, a cross-project worktree list and the 83-step plan's own pointer were all wrong at once, and every one was found with `rg` because the index did not carry them. ⚠️ **DERIVED, NEVER HARDCODED.** The memory slug is $ROOT with `/` and space folded to `-`; hardcoding it would re-create the 2026-07-28 slug-migration fragility, where the store was stranded at a path nothing read and only a note bridged it. The cross-project docs sit in $ROOT's PARENT. ⚠️ **SECOND STAMP ON PURPOSE.** Auto-memory writes far more often than `docs/` changes, so sharing one hash would re-index all of docs/ on every memory write. Two hashes, two stamps, each invalidating only its own sources.
MEMDIR="$HOME/.claude/projects/$(printf '%s' "$ROOT" | tr '/ ' '--')/memory"
XDIR="$(dirname "$ROOT")"
EXT_STAMP="${STAMP}.ext"
EXT_PATHS=""
[ -d "$MEMDIR" ] && EXT_PATHS="$EXT_PATHS $MEMDIR"
for f in "$XDIR/meta-deferred-list.md" "$XDIR/2026-08-23-workflow-compliance-plan.md" "$HOME/.claude/TOOLING.md"; do
  [ -f "$f" ] && EXT_PATHS="$EXT_PATHS $f"
done

EXT_HASH=""
if [ -n "$EXT_PATHS" ]; then
  # shellcheck disable=SC2086
  EXT_HASH=$(find $EXT_PATHS -type f -exec shasum {} + 2>/dev/null | sort | shasum | cut -d' ' -f1)
fi

REPO_FRESH=0; EXT_FRESH=0
[ -f "$STAMP" ] && [ "$(cat "$STAMP" 2>/dev/null)" = "$HASH" ] && REPO_FRESH=1
[ -z "$EXT_HASH" ] && EXT_FRESH=1
[ -f "$EXT_STAMP" ] && [ "$(cat "$EXT_STAMP" 2>/dev/null)" = "$EXT_HASH" ] && EXT_FRESH=1
[ "$REPO_FRESH" = 1 ] && [ "$EXT_FRESH" = 1 ] && exit 0   # both unchanged -> no-op

err=$(cd "$ROOT" && {
  if [ "$REPO_FRESH" = 0 ]; then
    node "$CLI" index docs           --source project:dioreo-docs     --project "$ROOT" 2>&1 >/dev/null
    node "$CLI" index .claude/rules  --source project:dioreo-rules    --project "$ROOT" 2>&1 >/dev/null
    node "$CLI" index CLAUDE.md      --source project:dioreo-claudemd --project "$ROOT" 2>&1 >/dev/null
  fi
  if [ "$EXT_FRESH" = 0 ]; then
    [ -d "$MEMDIR" ] && node "$CLI" index "$MEMDIR" --source project:dioreo-memory --project "$ROOT" 2>&1 >/dev/null
    [ -f "$XDIR/meta-deferred-list.md" ] && node "$CLI" index "$XDIR/meta-deferred-list.md" --source project:dioreo-meta-deferred --project "$ROOT" 2>&1 >/dev/null
    [ -f "$XDIR/2026-08-23-workflow-compliance-plan.md" ] && node "$CLI" index "$XDIR/2026-08-23-workflow-compliance-plan.md" --source project:dioreo-compliance-plan --project "$ROOT" 2>&1 >/dev/null
    [ -f "$HOME/.claude/TOOLING.md" ] && node "$CLI" index "$HOME/.claude/TOOLING.md" --source project:dioreo-tooling --project "$ROOT" 2>&1 >/dev/null
  fi
})
if [ -n "$err" ]; then
  printf 'CTX INDEX REFRESH FAILED — the prose index was NOT updated, so ctx_search results may be STALE. Treat what comes back as possibly out of date, or fall back to rg.\n\n%s' "$err" \
    | jq -Rs '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:.}}'
  exit 0
fi
[ "$REPO_FRESH" = 0 ] && printf '%s' "$HASH" > "$STAMP" 2>/dev/null
[ "$EXT_FRESH" = 0 ] && [ -n "$EXT_HASH" ] && printf '%s' "$EXT_HASH" > "$EXT_STAMP" 2>/dev/null
exit 0
