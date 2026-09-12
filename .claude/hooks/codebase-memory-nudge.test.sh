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
# 🔴 AND THE OTHER PAYLOAD SHAPE, WHICH IS THE ONE THE WORKING CONTRACT ACTUALLY PRODUCES. `ctx_batch_execute` carries `.tool_input.commands[]`, not `.tool_input.command`, and this hook read only the second — so every batched code search was invisible to it. A test suite that only ever builds the Bash shape can never see that, which is why these helpers exist rather than one more Bash case.
rb() { printf '%s' "$1" | jq -Rs '{tool_input:{commands:[{command:.}]}}' | bash "$HOOK" 2>/dev/null; }
firesb() { out=$(rb "$2"); if printf '%s' "$out" | grep -q 'CODEBASE-MEMORY NUDGE'; then printf '  \xe2\x9c\x93 FIRES-B %s\n' "$1"; pass=$((pass+1)); else printf '  \xe2\x9c\x97 FIRES-B %s  \xe2\x80\x94 produced nothing\n' "$1"; fail=$((fail+1)); fi; }
silentb() { out=$(rb "$2"); if [ -z "$out" ]; then printf '  \xe2\x9c\x93 SILENT-B %s\n' "$1"; pass=$((pass+1)); else printf '  \xe2\x9c\x97 SILENT-B %s  \xe2\x80\x94 fired when it must not\n' "$1"; fail=$((fail+1)); fi; }

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

# ── a sentence is not a symbol, even in a .js file. Found by replaying real traffic, not by reasoning: `search_graph` cannot answer a query that is prose, so firing on one is the wolf-cry this file's header refuses. The pair pins the boundary — a phrase stays silent, an alternation of symbols still fires.
silent "a prose sentence inside a test file" "rg -n 'this proof no longer reintroduces anything' scripts/portalUi.test.js"
fires  "an alternation of real symbols"      "rg -n 'clearRow|ByAdmin|GrantForm' portal/ui/access.js"

# ── the ctx_batch_execute shape, both directions. The `cd …&&` prefix is on every batched command in this repo, so if the strip regressed, the first of these goes silent and says so.
firesb "batch: a code path behind a cd prefix"  "cd '/Applications/Claude Code/Diors-Builds' && rg -n 'buildPermissionMatrix' portal/api/access.js"
silentb "batch: the PROSE corpus is the sibling's" "cd '/Applications/Claude Code/Diors-Builds' && rg -n 'buildPermissionMatrix' docs/db-deferred-list.md"
silentb "batch: a genuine chain is still a chain"  "cd '/tmp' && ls && rg -n 'foo' portal/ui/app.js && echo done"

# 🔴 AND THE REGISTRATION, NOT ONLY THE SCRIPT. A `git checkout .claude/settings.json` run to undo an unrelated reformat silently discarded this hook's matcher widening on 2026-09-09 16:24 EDT, and every proof above stayed green because they all invoke the script directly. A correct hook that is not wired to the tool it must watch protects nothing, and nothing in this repo was looking at the wiring.
if SETTINGS="$(cd "$(dirname "$0")/.." && pwd)/settings.json" python3 -c "
import json, io, sys, os
cfg = json.load(io.open(os.environ['SETTINGS'], encoding='utf-8'))
for h in cfg['hooks']['PreToolUse']:
    for e in h.get('hooks', []):
        if 'codebase-memory-nudge.sh' in e.get('command', ''):
            sys.exit(0 if 'ctx_batch_execute' in (h.get('matcher') or '') else 1)
sys.exit(1)
"; then
  printf '  \xe2\x9c\x93 WIRED   settings.json matches codebase-memory-nudge.sh on ctx_batch_execute too\n'; pass=$((pass+1))
else
  printf '  \xe2\x9c\x97 WIRED   codebase-memory-nudge.sh is registered on Bash alone \xe2\x80\x94 batched searches are invisible to it\n'; fail=$((fail+1))
fi

printf '\n  %s passed, %s failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ] || exit 1
