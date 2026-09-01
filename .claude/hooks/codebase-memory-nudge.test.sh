#!/bin/bash
# codebase-memory-nudge.test.sh — proves the nudge FIRES on the code corpus and stays SILENT everywhere else.
#
# 🔴 THE SILENT HALF IS THE POINT. An advisory that fires on the wrong command gets filtered, and a filtered advisory protects nothing — rg-flag-guard next door paid for that lesson five times. So every case below comes in a pair: a command that must produce the nudge, and the nearest command that must not.
#
# ⚠️ Run the way the HOOK runs — a non-interactive shell. This machine's interactive aliases (`find`->`bfs`, `git`->`rtk`) make probes succeed where the real hook fails, and that is how a BSD-find bug nearly escaped a second time (see reference_enforcement_hooks).
set -u
HOOK="$(cd "$(dirname "$0")" && pwd)/codebase-memory-nudge.sh"
[ -r "$HOOK" ] || { echo "❌ $HOOK is missing"; exit 1; }

pass=0; fail=0
# Feed a command through the hook exactly as the harness does, and return its stdout.
run() { printf '%s' "$1" | jq -Rs '{tool_input:{command:.}}' | bash "$HOOK" 2>/dev/null; }

fires() {  # $1 = label, $2 = command
  out=$(run "$2")
  if printf '%s' "$out" | grep -q 'CODEBASE-MEMORY NUDGE'; then
    printf '  ✓ FIRES   %s\n' "$1"; pass=$((pass+1))
  else
    printf '  ✗ FIRES   %s  — produced nothing\n' "$1"; fail=$((fail+1))
  fi
}
silent() {  # $1 = label, $2 = command
  out=$(run "$2")
  if [ -z "$out" ]; then
    printf '  ✓ SILENT  %s\n' "$1"; pass=$((pass+1))
  else
    printf '  ✗ SILENT  %s  — fired when it must not\n' "$1"; fail=$((fail+1))
  fi
}

echo "codebase-memory-nudge:"

# ── MUST FIRE — the case the hook exists for ─────────────────────────────────
fires "rg at a .js path"                 "rg -n 'RANK_KEY' portal/ui/armory.js"
fires "rg at a source DIRECTORY"         "rg -n 'stageOps' handlers"
fires "grep at a .mjs path"              "grep -n scanSource scripts/portalAudit.mjs"
fires "rg at a glob under a source dir"  "rg -n 'useOverlay' portal/ui/*.js"
fires "rg with a symbol and no quotes"   "rg -n buildSyntheticInteraction utils/interactionContext.js"

# ── MUST STAY SILENT ─────────────────────────────────────────────────────────
silent "the PROSE corpus — ctx-search-nudge.sh owns that one" "rg -n 'the overlay method' docs/superpowers/plans"
silent "a rules file, same reason"        "rg -n 'accent' .claude/rules/accent-and-colors.md"
silent "find, which searches FILENAMES"   "fd -e js portal/ui"
silent "find(1) by name"                  "find portal/ui -name '*.logic.js'"
silent "no path named — cwd is not known to be code" "rg -n 'RANK_KEY'"
silent "a non-code path"                  "rg -n BOT_TOKEN .env.dev"
silent "a compound command"               "rg -n 'x' portal/ui/armory.js && echo done"
silent "not a search at all"              "node --check portal/ui/armory.js"
silent "an empty command"                 ""

# ── the heredoc carve-out: PROSE ABOUT a search is not a search ────────────── Written as a single string so this file's own body cannot be mistaken for the case it describes.
HD='python3 - <<PYEOF
# rg -n RANK_KEY portal/ui/armory.js
print(1)
PYEOF'
silent "a heredoc body that merely mentions one" "$HD"

# ── §0.5a R7: the guard must not swallow the failure it was written for ────── A hook whose matcher never matches passes every run and certifies nothing. The FIRES block above is that proof; this asserts the harness wiring too — malformed input must not crash it into a false silence.
out=$(printf 'not json' | bash "$HOOK" 2>/dev/null); rc=$?
if [ "$rc" -eq 0 ] && [ -z "$out" ]; then
  printf '  ✓ SILENT  malformed hook input — exits clean rather than crashing\n'; pass=$((pass+1))
else
  printf '  ✗ SILENT  malformed hook input — rc=%s out=%s\n' "$rc" "$out"; fail=$((fail+1))
fi

printf '\n  %s passed, %s failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ] || exit 1
