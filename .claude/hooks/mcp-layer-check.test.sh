#!/bin/bash
# Proves mcp-layer-check.sh's branches actually fire, against a real fixture DB.
#
# WHY: the first attempt at this test was VACUOUS — it grepped for "misfiled", which matches the
# healthy status line ("0 misfiled elsewhere") just as well as the warning. It would have passed
# forever without the warning branch ever executing. A test must give OPPOSITE answers on the
# healthy and broken states (feedback_verify_before_claiming).
#
#   bash .claude/hooks/mcp-layer-check.test.sh

CHECK="$(dirname "$0")/mcp-layer-check.sh"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
pass=0; fail=0
WARN_MARKER='PATH-DERIVED junk entities'   # appears ONLY in the warning branch

mkfixture() { # $1 = number of misfiled memories to plant
  rm -f "$TMP/m.db"
  sqlite3 "$TMP/m.db" "
    CREATE TABLE entities (id INTEGER PRIMARY KEY, name TEXT);
    CREATE TABLE memories (id INTEGER PRIMARY KEY, entity_id INTEGER, content TEXT);
    INSERT INTO entities (id,name) VALUES (1,'Diors-Builds'),(2,'Application'),(3,'dior');
    INSERT INTO memories (entity_id,content) VALUES (1,'work on /Applications/Claude Code/Diors-Builds/x.js');
    -- 'dior' is a REAL sibling project and must NEVER be counted as fragmentation, even though its
    -- memories legitimately mention the Diors-Builds path.
    INSERT INTO memories (entity_id,content) VALUES (3,'cli notes referencing Claude Code/Diors-Builds');
  "
  i=0; while [ "$i" -lt "${1:-0}" ]; do
    sqlite3 "$TMP/m.db" "INSERT INTO memories (entity_id,content) VALUES (2,'edit /Applications/Claude Code/Diors-Builds/f$i.js');"
    i=$((i+1))
  done
}

run() { MCPCHECK_LINKSEE_DB="$TMP/m.db" MCPCHECK_FRAG_WARN="${1:-25}" bash "$CHECK" | jq -r '.hookSpecificOutput.additionalContext'; }

assert() { # name | needle | yes|no
  local name="$1" needle="$2" want="$3" out="$4"
  case "$out" in
    *"$needle"*) [ "$want" = yes ] && { echo "  PASS  $name"; pass=$((pass+1)); } || { echo "  FAIL  $name (unexpected '$needle')"; fail=$((fail+1)); };;
    *)           [ "$want" = no  ] && { echo "  PASS  $name"; pass=$((pass+1)); } || { echo "  FAIL  $name (missing '$needle')"; echo "        got: $out"; fail=$((fail+1)); };;
  esac
}

echo "mcp-layer-check.sh — branch proofs"

# 1. Healthy store: no fragmentation -> warning must be ABSENT (the discriminating half).
mkfixture 0; out="$(run 25)"
assert "clean store: no warning"            "$WARN_MARKER"           no  "$out"
assert "clean store: counts reported"       "misfiled elsewhere"     yes "$out"
assert "clean store: routing rules present" "RECALL BY query"        yes "$out"

# 2. 30 misfiled memories over a threshold of 25 -> warning MUST fire.
mkfixture 30; out="$(run 25)"
assert "fragmentation detected"             "$WARN_MARKER"           yes "$out"
assert "count is accurate (30)"             "30 misfiled elsewhere"  yes "$out"

# 3. Same 30, threshold 50 -> under budget, warning silent. Proves the threshold is real.
out="$(run 50)"
assert "under threshold: no warning"        "$WARN_MARKER"           no  "$out"

# 4. The 'dior' sibling project must never be counted, however many memories it has.
mkfixture 0
sqlite3 "$TMP/m.db" "INSERT INTO memories (entity_id,content) SELECT 3,'Claude Code/Diors-Builds ref' FROM (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4);"
out="$(run 0)"
assert "sibling project 'dior' excluded"    "0 misfiled elsewhere"   yes "$out"

# 5. Missing DB must degrade loudly, not crash or emit invalid JSON.
out="$(MCPCHECK_LINKSEE_DB=/nonexistent/x.db bash "$CHECK" | jq -r '.hookSpecificOutput.additionalContext')"
assert "missing db reported"                "db not found"           yes "$out"
MCPCHECK_LINKSEE_DB=/nonexistent/x.db bash "$CHECK" | jq -e . >/dev/null 2>&1 \
  && { echo "  PASS  missing db still emits valid JSON"; pass=$((pass+1)); } \
  || { echo "  FAIL  missing db emitted invalid JSON"; fail=$((fail+1)); }

# 6. The observation window must AUTO-EXPIRE, and must stay open through its final day.
#    An earlier version compared `today < end`, flipping to CLOSED at 00:00 on the last day — which
#    would have reverted behaviour for the window's final 17 hours and biased the very data being
#    collected. Off-by-one in an experiment's own instrument is a data-integrity bug.
mkfixture 0
wrun() { MCPCHECK_LINKSEE_DB="$TMP/m.db" MCPCHECK_TODAY="$1" MCPCHECK_WINDOW_END=2026-08-09 bash "$CHECK" | jq -r '.hookSpecificOutput.additionalContext'; }
assert "window OPEN mid-window"        "WINDOW OPEN"   yes "$(wrun 2026-08-05)"
assert "window OPEN on its LAST day"   "WINDOW OPEN"   yes "$(wrun 2026-08-09)"
assert "window CLOSED the day after"   "WINDOW CLOSED" yes "$(wrun 2026-08-10)"
assert "closed state chases close-out" "close it out"  no  "$(wrun 2026-08-05)"
assert "closed state names the script" "mcp-observation-metrics.mjs" yes "$(wrun 2026-08-10)"

echo
echo "  $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
