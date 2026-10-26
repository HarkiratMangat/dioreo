#!/bin/bash
# read-routing-nudge.test.sh — proves the nudge FIRES on a full read of a memory-store file and stays SILENT everywhere else.
#
# 🔴 THE SILENT HALF IS THE POINT — same lesson rg-flag-guard paid for five times: an advisory that fires on the wrong call gets filtered, and a filtered advisory protects nothing.
set -u
HOOK="$(cd "$(dirname "$0")" && pwd)/read-routing-nudge.sh"
[ -r "$HOOK" ] || { echo "❌ $HOOK is missing"; exit 1; }

MEM="/Users/harkirat/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory"
pass=0; fail=0

run() { printf '%s' "$1" | bash "$HOOK" 2>/dev/null; }

fires() {  # $1 = label, $2 = tool_input JSON
  out=$(run "$2")
  if printf '%s' "$out" | grep -q 'READ-ROUTING NUDGE'; then
    printf '  ✓ FIRES   %s\n' "$1"; pass=$((pass+1))
  else
    printf '  ✗ FIRES   %s  — produced nothing\n' "$1"; fail=$((fail+1))
  fi
}
silent() {  # $1 = label, $2 = tool_input JSON
  out=$(run "$2")
  if [ -z "$out" ]; then
    printf '  ✓ SILENT  %s\n' "$1"; pass=$((pass+1))
  else
    printf '  ✗ SILENT  %s  — fired when it must not\n' "$1"; fail=$((fail+1))
  fi
}

echo "read-routing-nudge:"

# ── MUST FIRE — the case the hook exists for ─────────────────────────────────
fires "a full Read of a memory file, no offset/limit" \
  "{\"tool_input\":{\"file_path\":\"$MEM/project_git_workflow.md\"}}"

# ── MUST STAY SILENT ─────────────────────────────────────────────────────────
silent "MEMORY.md itself — its own sentinel check wants a direct Read" \
  "{\"tool_input\":{\"file_path\":\"$MEM/MEMORY.md\"}}"
silent "a targeted Read with offset set (about to Edit)" \
  "{\"tool_input\":{\"file_path\":\"$MEM/project_git_workflow.md\",\"offset\":13}}"
silent "a targeted Read with limit set (about to Edit)" \
  "{\"tool_input\":{\"file_path\":\"$MEM/project_git_workflow.md\",\"limit\":50}}"
fires "the OLD frozen-backup memory store — same anti-pattern, different slug" \
  "{\"tool_input\":{\"file_path\":\"/Users/harkirat/.claude/projects/-Applications-Diors-Builds/memory/foo.md\"}}"
silent "a path merely containing the word memory, not the store shape" \
  "{\"tool_input\":{\"file_path\":\"/Applications/Claude Code/Diors-Builds/utils/memoryCache.js\"}}"
silent "a non-memory repo file" \
  "{\"tool_input\":{\"file_path\":\"/Applications/Claude Code/Diors-Builds/CLAUDE.md\"}}"
silent "no file_path at all" \
  "{\"tool_input\":{}}"

# ── malformed input must not crash it into a false silence ──────────────────
out=$(printf 'not json' | bash "$HOOK" 2>/dev/null); rc=$?
if [ "$rc" -eq 0 ] && [ -z "$out" ]; then
  printf '  ✓ SILENT  malformed hook input — exits clean rather than crashing\n'; pass=$((pass+1))
else
  printf '  ✗ SILENT  malformed hook input — rc=%s out=%s\n' "$rc" "$out"; fail=$((fail+1))
fi

printf '\n  %s passed, %s failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ] || exit 1
