#!/bin/bash
# instructions-loaded-audit.sh — record WHICH instruction files actually load, WHEN, and WHY.
#
# WHY THIS EXISTS (2026-09-02 10:55 EDT)
# ------------------------------------------------
# This repo's context strategy rests on a claim nobody had ever measured: that `.claude/rules/*.md`
# with `paths:` frontmatter load "only when you read a matching file", so the root CLAUDE.md can stay
# small and the detail can live in rules. Two things about that were unknown on the day this shipped:
#
#   1. WHETHER THEY FIRE UNDER THE WORKFLOW THIS REPO ACTUALLY MANDATES. The batching contract in
#      ~/.claude/CLAUDE.md says any multi-file edit goes through a `python3` heredoc, and the routing
#      rules push reads through `ctx_execute_file` and `rg`. None of those is a Read or an Edit. The
#      docs say path-scoped rules load "when Claude reads or edits files matching those patterns" —
#      so on the documented wording, the mandated workflow may bypass the entire rules layer.
#      `.claude/rules/portal-editing.md`'s own header already suspects this and says so.
#   2. WHETHER A RULE LOADS ONCE PER SESSION OR ONCE PER MATCHING ACCESS. That factor multiplies the
#      measured cost: reading one file in commands/ injects a median 72,420B of rule text, worst case
#      187,237B (~47k tokens) across three rules. Once per session is a tax; once per read is a bill.
#
# Both questions are answerable, and neither was answered by reading — which is exactly the pattern
# this repo has three memories about. `InstructionsLoaded` is Anthropic's purpose-built event for it:
# it fires when a CLAUDE.md or .claude/rules/*.md enters context, at session start for eager files and
# mid-session for lazy ones, and carries `load_reason` (session_start | nested_traversal |
# path_glob_match | include | compact) plus `trigger_file_path` naming the file whose access caused it.
#
# ⚠️ THIS HOOK OBSERVES AND NOTHING ELSE. InstructionsLoaded has no decision control — Claude Code
# discards `systemMessage`, `continue`, and every other output field. It cannot block or alter a load.
# So it writes a log and exits 0, always. It must never be the reason a session fails.
#
# ⚠️ THE LOG IS GITIGNORED (`local/`) ON PURPOSE. It records file paths and session ids from real work
# and is a measurement artifact, not a record. Nothing should ever depend on its contents surviving.
#
# ⚠️ READ THE EMPTY LOG CAREFULLY — an absent `path_glob_match` line is AMBIGUOUS. It means either
# "rules did not fire for that access" or "this hook never ran at all". A measurement run must include
# a POSITIVE CONTROL: a real `Read` of a file matching some rule's globs, in the same session. If that
# control produces no line either, the instrument is broken and the run proves nothing about heredocs.
# Stating this here because an instrument that cannot report its own absence is the failure mode this
# whole audit exists to find.

set -u
LOG="${IL_AUDIT_LOG:-${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}/local/instructions-loaded.jsonl}"

# --report reads the log back and answers the two questions above directly. Kept in the same file as
# the writer so the field names cannot drift between what is written and what is read.
if [ "${1:-}" = "--report" ]; then
  if [ ! -f "$LOG" ]; then
    echo "no log at $LOG — the hook has not fired yet, or IL_AUDIT_LOG points elsewhere"
    exit 0
  fi
  echo "instruction loads recorded at $LOG"
  echo
  echo "by load_reason:"
  jq -r '.load_reason // "?"' "$LOG" 2>/dev/null | sort | uniq -c | sort -rn | sed 's/^/  /'
  echo
  echo "per file — loads, total bytes, and what triggered the first one:"
  jq -rs '
    group_by(.file_path)
    | map({f: .[0].file_path, n: length, b: (.[0].bytes // 0), t: (map(.trigger_file_path // empty) | first // "-")})
    | sort_by(-.n)[]
    | "  \(.n)x  \(.b)B  \(.f)   first trigger: \(.t)"
  ' "$LOG" 2>/dev/null
  echo
  echo "⚠️ A file listed ONCE loaded once this session; listed N times, it reloads per access."
  echo "⚠️ NO path_glob_match lines is ambiguous — confirm a positive control ran (see this file's header)."
  exit 0
fi

payload=$(cat 2>/dev/null || true)
[ -z "$payload" ] && exit 0

mkdir -p "$(dirname "$LOG")" 2>/dev/null || exit 0

# `bytes` is resolved HERE rather than at report time because a rule file can be edited between the
# load and the report, and the number that matters is what was actually injected.
line=$(printf '%s' "$payload" | jq -c --arg ts "$(date '+%Y-%m-%dT%H:%M:%S%z')" '
  {ts: $ts,
   session_id: (.session_id // null),
   file_path: (.file_path // null),
   memory_type: (.memory_type // null),
   load_reason: (.load_reason // null),
   globs: (.globs // null),
   trigger_file_path: (.trigger_file_path // null),
   parent_file_path: (.parent_file_path // null)}' 2>/dev/null) || exit 0
[ -z "$line" ] && exit 0

fp=$(printf '%s' "$line" | jq -r '.file_path // empty' 2>/dev/null)
bytes=0
[ -n "$fp" ] && [ -f "$fp" ] && bytes=$(wc -c < "$fp" | tr -d ' ')
line=$(printf '%s' "$line" | jq -c --argjson b "${bytes:-0}" '. + {bytes: $b}' 2>/dev/null) || exit 0

# Bounded so a long-running session cannot fill the disk with an observability artifact.
if [ -f "$LOG" ]; then
  sz=$(wc -c < "$LOG" | tr -d ' ')
  [ "${sz:-0}" -gt 4000000 ] && mv -f "$LOG" "$LOG.1" 2>/dev/null
fi

printf '%s\n' "$line" >> "$LOG" 2>/dev/null
exit 0
