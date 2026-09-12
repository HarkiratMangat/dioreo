#!/bin/bash
# wide-check-guard.test.sh — proves the nudge FIRES on a Markdown-only tree and stays SILENT everywhere else.
#
# 🔴 THE SILENT HALF IS THE POINT. This guard exists because over-verifying was invisible while under-verifying was instrumented; a guard that cried wolf on a real code change would be filtered inside a day and would then measure nothing at all. Every case below comes in a pair.
#
# ⚠️ Run the way the HOOK runs — a non-interactive shell, and against a THROWAWAY git tree rather than this repo, so each case controls what `git status` reports instead of depending on whatever happens to be uncommitted at the moment the suite runs.
set -u
HOOK="$(cd "$(dirname "$0")" && pwd)/wide-check-guard.sh"
[ -r "$HOOK" ] || { echo "\xe2\x9d\x8c $HOOK is missing"; exit 1; }

pass=0; fail=0
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
git -C "$TMP" init -q 2>/dev/null
git -C "$TMP" config user.email t@t; git -C "$TMP" config user.name t
: > "$TMP/seed"; git -C "$TMP" add -A >/dev/null 2>&1; git -C "$TMP" commit -qm seed >/dev/null 2>&1

run() { printf '%s' "$2" | jq -Rs '{tool_input:{command:.}}' | CLAUDE_PROJECT_DIR="$TMP" bash "$HOOK" 2>/dev/null; }
fires()  { out=$(run "$1" "$2"); if printf '%s' "$out" | grep -q 'WIDE-CHECK NUDGE'; then printf '  \xe2\x9c\x93 FIRES   %s\n' "$1"; pass=$((pass+1)); else printf '  \xe2\x9c\x97 FIRES   %s  \xe2\x80\x94 produced nothing\n' "$1"; fail=$((fail+1)); fi; }
silent() { out=$(run "$1" "$2"); if [ -z "$out" ]; then printf '  \xe2\x9c\x93 SILENT  %s\n' "$1"; pass=$((pass+1)); else printf '  \xe2\x9c\x97 SILENT  %s  \xe2\x80\x94 fired when it must not\n' "$1"; fail=$((fail+1)); fi; }

echo "wide-check-guard self-test"
echo

# ── a Markdown-only working tree: the case this hook was written for.
echo "# a" > "$TMP/notes.md"; echo "# b" > "$TMP/docs.md"
fires  "npm test over two .md files"               "npm test"
fires  "npm run test, the other spelling"          "npm run test"
fires  "the suite behind a cd prefix"              "cd /x && npm test"
# 🔴 THE SCOPED TASKS ARE THE ANSWER THIS NUDGE POINTS AT, so they must never be nudged toward themselves.
silent "npm run test:hooks is already narrow"      "npm run test:hooks"
silent "npm run docs:audit is the right check"     "npm run docs:audit"
silent "npm run docs:audit:test is narrow too"     "npm run docs:audit:test"
silent "not a test command at all"                 "npm run build"

# ── one non-Markdown file in the mix and the suite is legitimate again.
echo "x" > "$TMP/thing.js"
silent "a .js file changed alongside the .md"      "npm test"
rm "$TMP/thing.js"
fires  "and it fires again once the .js is gone"   "npm test"

# ⚠️ A CLEAN TREE IS SILENT ON PURPOSE: a push or a merge is the one row that earns the whole suite.
git -C "$TMP" add -A >/dev/null 2>&1; git -C "$TMP" commit -qm docs >/dev/null 2>&1
silent "clean tree, so a push is plausible"          "npm test"

# 🔴 AND THE REGISTRATION, NOT ONLY THE SCRIPT. Earlier today a `git checkout` on settings.json silently un-registered a different hook while all 30 of its proofs stayed green, because every one of them invokes the script directly. A correct hook that is not wired to the tool it must watch protects nothing.
if SETTINGS="$(cd "$(dirname "$0")/.." && pwd)/settings.json" python3 -c "
import json, io, sys, os
cfg = json.load(io.open(os.environ['SETTINGS'], encoding='utf-8'))
for h in cfg['hooks']['PreToolUse']:
    for e in h.get('hooks', []):
        if 'wide-check-guard' in e.get('command', ''):
            sys.exit(0 if 'ctx_batch_execute' in (h.get('matcher') or '') else 1)
sys.exit(1)
"; then
  printf '  \xe2\x9c\x93 WIRED   settings.json matches wide-check-guard.sh on Bash and ctx_batch_execute\n'; pass=$((pass+1))
else
  printf '  \xe2\x9c\x97 WIRED   wide-check-guard.sh is not registered, or not on ctx_batch_execute\n'; fail=$((fail+1))
fi

echo
echo "  $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
