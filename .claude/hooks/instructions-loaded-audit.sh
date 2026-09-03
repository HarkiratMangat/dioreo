#!/bin/bash
# instructions-loaded-audit.sh — record WHICH instruction files actually load, WHEN, and WHY.
#
# WHY THIS EXISTS (2026-09-02 10:55 EDT)
# ------------------------------------------------
# This repo's context strategy rests on a claim nobody had ever measured: that `.claude/rules/*.md` with `paths:` frontmatter load "only when you read a matching file", so the root CLAUDE.md can stay small and the detail can live in rules. Two things about that were unknown on the day this shipped:
#
#   1. WHETHER THEY FIRE UNDER THE WORKFLOW THIS REPO ACTUALLY MANDATES. The batching contract in ~/.claude/CLAUDE.md says any multi-file edit goes through a `python3` heredoc, and the routing rules push reads through `ctx_execute_file` and `rg`. None of those is a Read or an Edit. The docs say path-scoped rules load "when Claude reads or edits files matching those patterns" — so on the documented wording, the mandated workflow may bypass the entire rules layer. `.claude/rules/portal-editing.md`'s own header already suspects this and says so.
#   2. WHETHER A RULE LOADS ONCE PER SESSION OR ONCE PER MATCHING ACCESS. That factor multiplies the measured cost: reading one file in commands/ injects a median 72,420B of rule text, worst case 187,237B (~47k tokens) across three rules. Once per session is a tax; once per read is a bill.
#
# Both questions are answerable, and neither was answered by reading — which is exactly the pattern this repo has three memories about. `InstructionsLoaded` is Anthropic's purpose-built event for it: it fires when a CLAUDE.md or .claude/rules/*.md enters context, at session start for eager files and mid-session for lazy ones, and carries `load_reason` (session_start | nested_traversal | path_glob_match | include | compact) plus `trigger_file_path` naming the file whose access caused it.
#
# ⚠️ THIS HOOK OBSERVES AND NOTHING ELSE. InstructionsLoaded has no decision control — Claude Code discards `systemMessage`, `continue`, and every other output field. It cannot block or alter a load. So it writes a log and exits 0, always. It must never be the reason a session fails.
#
# ⚠️ THE LOG IS GITIGNORED (`local/`) ON PURPOSE. It records file paths and session ids from real work and is a measurement artifact, not a record. Nothing should ever depend on its contents surviving.
#
# ⚠️ READ THE EMPTY LOG CAREFULLY — an absent `path_glob_match` line is AMBIGUOUS. It means either "rules did not fire for that access" or "this hook never ran at all". A measurement run must include a POSITIVE CONTROL: a real `Read` of a file matching some rule's globs, in the same session. If that control produces no line either, the instrument is broken and the run proves nothing about heredocs. Stating this here because an instrument that cannot report its own absence is the failure mode this whole audit exists to find.

set -u
LOG="${IL_AUDIT_LOG:-${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}/local/instructions-loaded.jsonl}"

# --report reads the log back and answers the two questions above directly. Kept in the same file as the writer so the field names cannot drift between what is written and what is read.
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

# --- the SessionStart line ------------------------------------------------------------------------ 🔴 AN INSTRUMENT NOBODY RUNS IS NOT AN INSTRUMENT — added 2026-09-02 20:27 EDT. This hook answered the session's headline question and then sat there: no always-loaded file mentioned it, its log is gitignored, and `--report` had to be typed by someone who already knew it existed. That is the exact failure the global CLAUDE.md records at length (codebase-index never invoked once, read_smart never invoked, shellcheck installed and unrun for weeks), reproduced within hours of my reading it.
#
# The fix is not a pointer in a document -- prose failed three separate times in this same session. The hook already runs; it reports now. One line, arriving unasked, which also makes a rules-tier regression visible: if the injected total climbs back toward the 651KB it started at, every session sees the number without anyone deciding to look.
#
# ⚠️ IT REPORTS THE MOST RECENT session_start BATCH, WHICH MAY BE THE PREVIOUS SESSION'S. At the moment a SessionStart hook runs, this session's own instruction loads have not necessarily happened yet, so claiming they are this session's would be a guess. The line says which batch it is reading and when.
if [ "${1:-}" = "--session" ]; then
  [ -f "$LOG" ] || exit 0
  jq -rs '
    map(select(.load_reason == "session_start" or .load_reason == "include"))
    | if length == 0 then empty else
      (max_by(.ts) | .ts[0:16]) as $latest
      | map(select(.ts[0:16] == $latest)) as $batch
      # DEDUPE BY PATH. The harness emits a file more than once in a batch, so summing rows reported
      # 266,496B for three files whose real total is 95,593 -- a wrong number in a line every session
      # reads, which is the defect this whole session was about. Corrected 2026-09-02 20:28 EDT.
      | ($batch | group_by(.file_path) | map(.[0])) as $uniq
      # Last TWO segments, because the project and the global CLAUDE.md have the same basename and the
      # line rendered "CLAUDE.md, CLAUDE.md" as if one file had loaded twice.
      | ($uniq | map(.file_path | split("/") | .[-2:] | join("/")) | sort) as $files
      | ($uniq | map(.bytes) | add) as $bytes
      | "INSTRUCTION LOAD (most recent batch, \($latest)): \($files | length) file(s), \($bytes)B — \($files | join(", "))."
        + (if ($files | map(select(endswith("silent-mode.md"))) | length > 0) then " ✅ silent-mode.md is among them, so the standing working style IS loading." else " 🔴 silent-mode.md is NOT among them. If CLAUDE.md IS listed, the unconditional rule did not load and SILENT MODE IS NOT IN EFFECT — switch it to an @-import from CLAUDE.md and move the file out of .claude/rules/ so it cannot double-load. If CLAUDE.md is not listed either, this hook simply had not run yet and the batch is stale." end)
    end' "$LOG" 2>/dev/null | jq -Rs 'if . == "" then empty else {hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:.}} end'
  exit 0
fi

payload=$(cat 2>/dev/null || true)
[ -z "$payload" ] && exit 0

mkdir -p "$(dirname "$LOG")" 2>/dev/null || exit 0

# `bytes` is resolved HERE rather than at report time because a rule file can be edited between the load and the report, and the number that matters is what was actually injected.
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
