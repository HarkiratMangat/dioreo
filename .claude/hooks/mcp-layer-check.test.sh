#!/bin/bash
# Proves mcp-layer-check.sh's branches actually fire, against a real fixture DB.
#
# WHY: the first attempt at this test was VACUOUS — it grepped for "misfiled", which matches the healthy status line ("0 misfiled elsewhere") just as well as the warning. It would have passed forever without the warning branch ever executing. A test must give OPPOSITE answers on the healthy and broken states (feedback_verify_before_claiming).
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

# 6. The retired observation window must STAY retired. The block that lived here auto-expired on 2026-08-09 and then spent five days injecting "explicit-request-only is in force again" into every session -- asserting a decision that had been made the OTHER way, with data, the same day. These two assertions exist so restoring it is a test failure rather than a quiet regression.
mkfixture 0
out="$(run 0)"
assert "sequential-thinking stated UNRESTRICTED" "UNRESTRICTED"                yes "$out"
assert "the retired ask-first rule is NOT back"  "explicit-request-only"       no  "$out"
assert "no auto-expiring window remains"         "OBSERVATION WINDOW"          no  "$out"

# 7. MCP SERVER PRESENCE -- the 2026-08-14 failure: a server fixed in the Claude DESKTOP config only, invisible to Claude Code, indistinguishable from a tool nobody bothered to call.
CCOK="$TMP/cc-ok.json"; CCBAD="$TMP/cc-bad.json"; DESK="$TMP/desktop.json"
cat > "$CCOK"  <<'JSON'
{"mcpServers":{"linksee":{},"perseus-vault":{},"sequential-thinking":{},"codebase-memory-mcp":{},"jina-reader":{}}}
JSON
cat > "$CCBAD" <<'JSON'
{"mcpServers":{"linksee":{},"codebase-memory-mcp":{}}}
JSON
cat > "$DESK"  <<'JSON'
{"mcpServers":{"linksee":{},"perseus-vault":{},"sequential-thinking":{},"codebase-memory-mcp":{},"jina-reader":{},"desktop-only-thing":{}}}
JSON
prun() { MCPCHECK_LINKSEE_DB="$TMP/m.db" MCPCHECK_CC_CONFIG="$1" MCPCHECK_DESKTOP_CONFIG="$2" \
         bash "$CHECK" | jq -r '.hookSpecificOutput.additionalContext'; }

# Healthy: every expected server present, desktop matches -> BOTH warnings absent. This is the discriminating half; without it the needles below could match a banner that always prints.
out="$(prun "$CCOK" "$CCOK")"
assert "healthy config: no missing-server warning" "NOT REGISTERED WITH CLAUDE CODE" no "$out"
assert "healthy config: no divergence warning"     "Configured for Claude DESKTOP"   no "$out"

# Broken: two expected servers absent from Claude Code's own config.
out="$(prun "$CCBAD" "$CCBAD")"
assert "missing servers detected"        "NOT REGISTERED WITH CLAUDE CODE" yes "$out"
assert "names the missing server"        "sequential-thinking"             yes "$out"
assert "gives the fix command"           "claude mcp add --scope user"     yes "$out"
assert "warns the configs are separate"  "separate lists"                  yes "$out"
assert "explains pending-approval trap"  "Pending approval"                yes "$out"

# Divergence: present in the desktop config, never mirrored to Claude Code.
out="$(prun "$CCOK" "$DESK")"
assert "desktop-only server detected"    "Configured for Claude DESKTOP"   yes "$out"
assert "names the desktop-only server"   "desktop-only-thing"              yes "$out"

# Absent/unreadable configs must degrade silently, not crash -- a fresh clone or CI has neither file.
out="$(prun /nonexistent/cc.json /nonexistent/desktop.json)"
assert "no config: no false alarm"       "NOT REGISTERED WITH CLAUDE CODE" no "$out"
prun /nonexistent/cc.json /nonexistent/desktop.json >/dev/null 2>&1 \
  && { echo "  PASS  no config still emits valid JSON"; pass=$((pass+1)); } \
  || { echo "  FAIL  no config crashed"; fail=$((fail+1)); }

echo

# ── the SERVER probe ─────────────────────────────────────────────────────────
# 🔴 THESE EXIST BECAUSE THE BANNER REPORTED THE DATABASE AND WAS READ AS REPORTING THE SERVER.
# On 2026-09-02 `claude mcp list` said linksee had failed to connect while this hook printed healthy
# counts, because the counts come from the sqlite file -- which is readable whether or not the
# server is up. The load-bearing case is the third one: a REACHABLE and an UNREACHABLE server must
# produce visibly different output, or the probe is decoration.
ctx_of() { python3 -c 'import sys,json; print(json.load(sys.stdin)["hookSpecificOutput"]["additionalContext"])'; }
ok_json='{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2024-11-05"}}'

up=$(MCPCHECK_PROBE_CMD="printf '%s' '$ok_json'" bash "$CHECK" | ctx_of)
case "$up" in *"linksee MCP: reachable"*) echo "  PASS  a server that answers initialize reports reachable"; pass=$((pass+1));;
  *) echo "  FAIL  a server that answers initialize reports reachable"; fail=$((fail+1));; esac

down=$(MCPCHECK_PROBE_CMD="false" bash "$CHECK" | ctx_of)
case "$down" in *"UNREACHABLE THIS SESSION"*) echo "  PASS  a server that does not answer reports UNREACHABLE"; pass=$((pass+1));;
  *) echo "  FAIL  a server that does not answer reports UNREACHABLE"; fail=$((fail+1));; esac

if [ "$up" != "$down" ]; then echo "  PASS  reachable and unreachable produce different output"; pass=$((pass+1));
else echo "  FAIL  reachable and unreachable produce IDENTICAL output -- the probe is decoration"; fail=$((fail+1)); fi

# The db counts must no longer be phrased as a claim about the server.
case "$down" in *"linksee db:"*) echo "  PASS  the counts line is labelled as db-derived"; pass=$((pass+1));;
  *) echo "  FAIL  the counts line is labelled as db-derived"; fail=$((fail+1));; esac

# And the probe must be skippable, or every hook test pays 3s and CI pays it on every run.
skip=$(MCPCHECK_PROBE=0 bash "$CHECK" | ctx_of)
case "$skip" in *"probe skipped"*) echo "  PASS  MCPCHECK_PROBE=0 skips the round-trip"; pass=$((pass+1));;
  *) echo "  FAIL  MCPCHECK_PROBE=0 skips the round-trip"; fail=$((fail+1));; esac

echo "  $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
