#!/bin/bash
# mcp-layer-check.sh — SessionStart guard for the MCP memory/graph layer.
#
# WHY THIS EXISTS
# On 2026-08-02 15:00 EDT Harkirat had to ask, unprompted, whether we were using perseus-vault, linksee,
# context-mode and codebase-memory at all. The answer was: barely, and partly wrong.
#   · ~29% of this project's linksee memories had been filed under FAKE path-derived entities
#     ("Application" held the entire licensing session) and entity-scoped recall missed them SILENTLY.
#   · The global usage-guard hook was injecting a stale "codebase-index is PYTHON-ONLY" claim into
#     every large Read, routing sessions away from a graph tool that DOES index this JS repo.
#   · An entire session ran without a single ctx_execute* call despite that being the mandated path.
#   · The linksee SKILL.md taught four tools removed in v0.11.x.
#
# Every one of those was already "documented somewhere". Prose did not work — it never has on this
# project (measured: `grep` 788x vs `rg` 4x). So the routing rules live HERE, where they are injected
# every session and cannot be skipped, per the standing doctrine in reference_enforcement_hooks:
# a checkable rule becomes a hook, not more prose.
#
# DELIBERATELY ALWAYS PRINTS. A guard whose healthy state is silence cannot be told from a dead one
# (feedback_verify_before_claiming). Keep it SHORT — it is paid on every session.

LINKSEE_DB="${MCPCHECK_LINKSEE_DB:-$HOME/.linksee-memory/memory.db}"
CANON_ENTITY="${MCPCHECK_CANON:-Diors-Builds}"
FRAG_WARN="${MCPCHECK_FRAG_WARN:-25}"   # warn if more than N memories sit off the canonical entity

warn=""
frag_line="linksee: db not found (memory layer unavailable)"

if [ -r "$LINKSEE_DB" ] && command -v sqlite3 >/dev/null 2>&1; then
  # Junk entities are PATH-DERIVED (folder names), so anything that is not the canonical project and
  # not a known real sibling project is a fragment. `dior` is a REAL separate repo - never count it.
  frag=$(sqlite3 "$LINKSEE_DB" "
    SELECT COALESCE(SUM(c),0) FROM (
      SELECT COUNT(m.id) c FROM memories m JOIN entities e ON e.id=m.entity_id
      WHERE e.name NOT IN ('$CANON_ENTITY','dior')
        AND (m.content LIKE '%Claude Code/$CANON_ENTITY%'
          OR m.content LIKE '%-Applications-Claude-Code-$CANON_ENTITY%')
      GROUP BY e.id);" 2>/dev/null)
  canon=$(sqlite3 "$LINKSEE_DB" "SELECT COUNT(*) FROM memories m JOIN entities e ON e.id=m.entity_id WHERE e.name='$CANON_ENTITY';" 2>/dev/null)
  frag=${frag:-0}; canon=${canon:-0}
  # Auto-capture files RAW USER UTTERANCES as learnings/caveats (no LLM in the Stop-hook path), so a
  # future session recalling "learnings" gets served Harkirat's to-do list. Nothing PREVENTS this
  # upstream; distilling is the only remedy, so the backlog has to at least be VISIBLE.
  # Count the flag directly: dream() returns a BATCH of up to 8, which is not the total.
  distill=$(sqlite3 "$LINKSEE_DB" "SELECT COUNT(*) FROM memories WHERE content LIKE '%needs_distill%' AND COALESCE(json_extract(content,'\$.distilled'),0)!=1;" 2>/dev/null)
  distill=${distill:-0}
  frag_line="linksee: ${canon} on '${CANON_ENTITY}', ${frag} misfiled elsewhere, ${distill} awaiting distil"
  if [ "$distill" -gt 12 ] 2>/dev/null; then
    warn="$warn
  ⚠️ ${distill} auto-captured memories are still RAW user utterances filed as learnings/caveats.
     dream() drains up to 8 PER CALL, so this needs repeat calls. Rewrite each via
     remember({memory_id, content}) with \"distilled\": true — without that marker the next Stop-hook
     sync wipes the rewrite and the raw utterance comes back. Filed in docs/db-deferred-list.md."
  fi
  if [ "$frag" -gt "$FRAG_WARN" ] 2>/dev/null; then
    warn="$warn
  ⚠️ ${frag} memories referencing this repo are filed under PATH-DERIVED junk entities (folder names
     like Application/Containers). Entity-scoped recall MISSES them silently. Root cause is unfixed
     upstream (no config knob; map_projects is empty). Re-home with the documented UPDATE - see the
     memory reference_tool_capability_tests. Until then the query-mode rule below is the defence."
  fi
fi

read -r -d '' RULES <<'EOF'
MCP LAYER — the routing that was measured, not assumed (2026-08-02 14:43 EDT):
  · linksee RECALL BY query, NEVER entity_name — entity attribution is path-derived and
    entity-scoped recall under-returns SILENTLY. On WRITE always pass entity_name explicitly.
    Removed in v0.11.x: list_entities -> recall({}) · recall_file -> recall({path}) ·
    update_memory -> remember({memory_id}) · consolidate -> auto-runs at startup, never call it.
    Deliberate remember() writes have source=NULL so the Stop-hook sync never wipes them; only
    auto-captured session rows are wiped+reinserted.
  · codebase-memory-mcp DOES index this JS repo — try search_graph BEFORE rg for
    "where is X / what calls it". If head_sha lags, run detect_changes (a docs-only lag is harmless).
  · context-mode ctx_execute/ctx_batch_execute/ctx_execute_file for anything whose output you
    PROCESS; Bash only to observe short fixed output or mutate state.
  · perseus-vault for durable cross-session decisions; linksee for project/file-scoped caveats.
  · Write to the memory layer at the real moments: a decision, a failure, a correction. An entire
    session once passed with zero writes because nothing forced them.
EOF

# --- the 7-day sequential-thinking measurement window ------------------------------------------
# AUTO-EXPIRES ON PURPOSE. A suspension that has to be manually revoked becomes a permanent silent
# change the moment someone forgets — the exact stale-state failure this whole hook exists to stop.
# The date comparison does the revoking, and after the end date this block starts CHASING the
# close-out instead of announcing the window.
WINDOW_END="${MCPCHECK_WINDOW_END:-2026-08-09}"
TODAY="${MCPCHECK_TODAY:-$(date +%Y-%m-%d)}"
PROTO="docs/superpowers/specs/2026-08-02-mcp-observation-window-protocol.md"

# NOTE the comparison direction: OPEN while today <= WINDOW_END, so the final day stays open. An
# earlier version used `today < end`, which flipped to CLOSED at 00:00 on the last day and would have
# silently reverted behaviour for the window's final 17 hours — biasing exactly the data being
# collected. Off-by-one in an experiment's own instrument is a data-integrity bug, not a cosmetic one.
if [ ! "$TODAY" \> "$WINDOW_END" ]; then
  window="
🧪 OBSERVATION WINDOW OPEN until ${WINDOW_END} 17:00 EDT — sequential-thinking is UNRESTRICTED.
   Use it on judgement, no permission needed. This is a measurement: the tool has never existed
   without its rule, so the 'used twice' figure measures the RULE, not the tool.
   ⚠️ EVERY use must be logged in local/mcp-observation-log.md with why + outcome. An unlogged use is
   a lost data point. Baseline: 0.014 calls/100 turns, median 276 turns/session, 290,915 cacheRead/turn.
   MEASURED from 2026-08-02 (this day counts) — the two sessions that ran BEFORE 17:00 EDT are
   filtered out by session id inside the instrument, so no flag is needed at close-out.
   Protocol: ${PROTO}"
else
  window="
⏰ OBSERVATION WINDOW CLOSED (ended ${WINDOW_END}). The sequential-thinking suspension has EXPIRED —
   explicit-request-only is in force again unless a close-out recorded otherwise WITH DATA.
   Close it out: node scripts/mcp-observation-metrics.mjs --from 2026-08-02 --to 2026-08-10 --label treatment
   then compare against the pre-registered baseline in ${PROTO} and record the verdict."
fi

printf '%s\n%s%s%s' "$frag_line" "$RULES" "$warn" "$window" \
  | jq -Rs '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:.}}'
