#!/bin/bash
# Proofs for ctx-index-refresh.sh.
#
# ⚠️ REWRITTEN 2026-08-30 12:50 EDT. The first version asserted the presence of `--project '$ROOT'` as a STRING and passed while the hook was a total no-op — testCache.mjs threw on docs/'s nested subdirectories and `2>/dev/null` ate the error. A test that greps a script for a flag proves the flag was typed, never that the script WORKS. These cases run the thing.
HOOK="$(cd "$(dirname "$0")" && pwd)/ctx-index-refresh.sh"; pass=0; fail=0
ok(){ if [ "$2" = "$3" ]; then echo "  PASS  $1"; pass=$((pass+1)); else echo "  FAIL  $1 (want $3 got $2)"; fail=$((fail+1)); fi; }
yes(){ if [ -n "$2" ]; then echo "  PASS  $1"; pass=$((pass+1)); else echo "  FAIL  $1"; fail=$((fail+1)); fi; }
run(){ printf '{"tool_name":"%s","tool_input":{}}' "$1" | bash "$HOOK" 2>/dev/null; }
echo "ctx-index-refresh.sh — proofs"

# ── gating: only ctx_search, and never noisy on the happy path.
out="$(run Bash)";  ok "silent on Bash"  "${out:-EMPTY}" "EMPTY"
out="$(run Read)";  ok "silent on Read"  "${out:-EMPTY}" "EMPTY"
run Bash >/dev/null 2>&1; ok "exit 0 on a non-matching tool" "$?" "0"
printf '{}' | bash "$HOOK" >/dev/null 2>&1; ok "exit 0 on empty payload" "$?" "0"
run mcp__plugin_context-mode_context-mode__ctx_search >/dev/null 2>&1; ok "exit 0 on ctx_search" "$?" "0"

# ── 🔴 IT MUST ACTUALLY INDEX. The v1 defect was a hook that exited 0 having done nothing. Prove the work happened by removing the stamp and checking the hook recreates it. Derive the stamp path the SAME way the hook does — keyed by repo root, so two clones cannot fight over one file. A test that hardcodes the path silently stops testing the moment the hook changes it (which is exactly what happened when the key was introduced).
CDIR=$(git rev-parse --git-common-dir); case "$CDIR" in /*) ;; *) CDIR="$PWD/$CDIR";; esac
RT=$(cd "$(dirname "$CDIR")" && pwd)
STAMP="$HOME/.claude/context-mode/.dioreo-prose-stamp-$(printf '%s' "$RT" | shasum | cut -c1-12)"
cp "$STAMP" "$STAMP.testbak" 2>/dev/null; rm -f "$STAMP"
run mcp__plugin_context-mode_context-mode__ctx_search >/dev/null 2>&1
if [ -s "$STAMP" ]; then echo "  PASS  a cold run REALLY indexes (stamp written)"; pass=$((pass+1))
else echo "  FAIL  cold run wrote no stamp — the hook is a NO-OP, which is the v1 bug"; fail=$((fail+1)); fi
before="$(cat "$STAMP" 2>/dev/null)"
run mcp__plugin_context-mode_context-mode__ctx_search >/dev/null 2>&1
ok "a warm run is a no-op (stamp unchanged)" "$(cat "$STAMP" 2>/dev/null)" "$before"
mv "$STAMP.testbak" "$STAMP" 2>/dev/null

# ── 🔴 THE ROOT MUST BE THE MAIN WORKTREE, NOT CLAUDE_PROJECT_DIR. In a worktree those differ, and the content DB is keyed on the project root — getting this wrong silently splits retrieval across DBs.
grep -q 'git rev-parse --git-common-dir' "$HOOK" && { echo "  PASS  root derived from git, not CLAUDE_PROJECT_DIR"; pass=$((pass+1)); } || { echo "  FAIL  root not derived from git"; fail=$((fail+1)); }
# Scope to EXECUTABLE lines: this hook's own header documents both defects by name, and a check that greps the whole file would flag the documentation of the fix as the bug. (A check firing on its own artifact is a named failure mode here — see completeness-sweep's "NEW ENFORCEMENT" pass.)
code(){ grep -v '^[[:space:]]*#' "$HOOK"; }
code | grep -q 'CLAUDE_PROJECT_DIR' && { echo "  FAIL  still reads CLAUDE_PROJECT_DIR (worktree-unsafe)"; fail=$((fail+1)); } || { echo "  PASS  does not read CLAUDE_PROJECT_DIR in code"; pass=$((pass+1)); }
n_index=$(grep -cE "index [^ ]+ +--source" "$HOOK"); n_proj=$(grep -c -- '--project "\$ROOT"' "$HOOK")
ok "every index call pins --project" "$n_proj" "$n_index"
ok "indexes all three corpora" "$n_index" "3"

# ── 🔴 A FAILURE MUST BE VISIBLE. v1 swallowed its own fatal error for its entire life.
grep -q 'CTX INDEX REFRESH FAILED' "$HOOK" && { echo "  PASS  reports an indexing failure instead of hiding it"; pass=$((pass+1)); } || { echo "  FAIL  an index failure would be silent"; fail=$((fail+1)); }
code | grep -q 'testCache' && { echo "  FAIL  still uses testCache, which throws on docs/'s nested dirs"; fail=$((fail+1)); } || { echo "  PASS  does not use testCache in code (it rejects nested inputs)"; pass=$((pass+1)); }
yes "cache is a content hash over the real tree" "$(grep -E 'shasum' "$HOOK")"
echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
