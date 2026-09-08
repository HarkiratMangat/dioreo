#!/usr/bin/env bash
# scripts/hookOutputCap.test.sh -- every registered hook command must stay under a 9,000B stdout cap.
#
# WHY THIS EXISTS (2026-09-08, context-carriers plan WP3, ~/.claude/plans/okay-so-i-want-majestic-yao.md)
# ---------------------------------------------------------------------------------------------------
# Any hook output over ~10KB reaches a session as a silently truncated ~2KB preview -- measured
# directly against docs/SESSION-START.md, which sat over that line from 2026-07-18 (it crossed 10KB
# at 4e6af78a) until this WP retired its own cat-hook and switched delivery to an @-import. The
# harness truncates, not the hook, so the hook's own exit code and JSON stay valid the whole time --
# nothing about running the hook by hand tells you it degraded. This test parses every command
# registered under EVERY event in BOTH settings.json files (this repo's tracked one and the global
# ~/.claude one) and actually RUNS each one, measuring real stdout bytes on a quiet turn.
#
# ⚠️ Fed a minimal `{}` stdin on purpose. A PreToolUse/PostToolUse guard gating on
# `.tool_input.command` sees an empty command and no-ops (its normal, safe behavior on a turn that
# isn't the one it cares about); a SessionStart/SessionEnd hook that reads files from disk regardless
# of stdin runs for real, which is exactly the class this cap protects.
#
# ⚠️ A command that errors or hangs under this synthetic input is not what this test is FOR -- it
# is testing OUTPUT SIZE when a hook does produce output, not exercising every real branch. Each
# command gets a short timeout and a failure/empty result is counted as a skip, never a cap failure.
set -uo pipefail

REPO="${CLAUDE_PROJECT_DIR:-/Applications/Claude Code/Diors-Builds}"
CAP=9000
TIMEOUT_SECS=10
fails=0
pass=0
skipped=0

TIMEOUT_BIN=""
if command -v gtimeout >/dev/null 2>&1; then TIMEOUT_BIN="gtimeout"
elif command -v timeout >/dev/null 2>&1; then TIMEOUT_BIN="timeout"
fi

# One command per line, de-duplicated across every event in the file. Newlines inside a command
# (none exist in this repo's hooks today) are flattened so the line-oriented `while read` below
# cannot be confused by one.
extract_commands() {
  python3 -c '
import json, sys
try:
    d = json.load(open(sys.argv[1]))
except Exception:
    sys.exit(0)
seen = set()
for _event, groups in d.get("hooks", {}).items():
    for g in groups:
        for h in g.get("hooks", []):
            cmd = h.get("command", "")
            if cmd and cmd not in seen:
                seen.add(cmd)
                print(cmd.replace("\n", " "))
' "$1" 2>/dev/null
}

run_one() {
  local cmd="$1"
  if [ -n "$TIMEOUT_BIN" ]; then
    (cd "$REPO" && printf '{}' | CLAUDE_PROJECT_DIR="$REPO" "$TIMEOUT_BIN" "$TIMEOUT_SECS" bash -c "$cmd") 2>/dev/null
  else
    (cd "$REPO" && printf '{}' | CLAUDE_PROJECT_DIR="$REPO" bash -c "$cmd") 2>/dev/null
  fi
}

check_settings_file() {
  local f="$1" label="$2"
  if [ ! -f "$f" ]; then
    printf '  – %s not found, skipping\n' "$f"
    return
  fi
  while IFS= read -r cmd; do
    [ -z "$cmd" ] && continue
    out="$(run_one "$cmd")"
    rc=$?
    short="$(printf '%s' "$cmd" | cut -c1-64)"
    if [ $rc -ne 0 ] && [ -z "$out" ]; then
      printf '  – [%s] skipped (errored/empty under synthetic input) — %s...\n' "$label" "$short"
      skipped=$((skipped+1))
      continue
    fi
    bytes=$(printf '%s' "$out" | wc -c | tr -d ' ')
    if [ "$bytes" -gt "$CAP" ]; then
      printf '  ✗ [%s] %sB > %sB cap — %s...\n' "$label" "$bytes" "$CAP" "$short"
      fails=$((fails+1))
    else
      printf '  ✓ [%s] %sB — %s...\n' "$label" "$bytes" "$short"
      pass=$((pass+1))
    fi
  done < <(extract_commands "$f")
}

printf 'hook output cap — every registered hook command stays under %sB of stdout on a quiet turn\n' "$CAP"
printf '─────────────────────────────────────────────\n'

check_settings_file "$REPO/.claude/settings.json" "project"
check_settings_file "$HOME/.claude/settings.json" "global"

echo
echo "  $pass passed, $fails failed, $skipped skipped (synthetic-input errors, not measured)"
[ "$fails" -eq 0 ]
