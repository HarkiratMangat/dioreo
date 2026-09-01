#!/bin/bash
# mcp-layer-check.sh — SessionStart guard for the MCP memory/graph layer.
#
# WHY THIS EXISTS On 2026-08-02 15:00 EDT Harkirat had to ask, unprompted, whether we were using perseus-vault, linksee, context-mode and codebase-memory at all. The answer was: barely, and partly wrong.
#   · ~29% of this project's linksee memories had been filed under FAKE path-derived entities
#     ("Application" held the entire licensing session) and entity-scoped recall missed them SILENTLY.
#   · The global usage-guard hook was injecting a stale "codebase-index is PYTHON-ONLY" claim into
#     every large Read, routing sessions away from a graph tool that DOES index this JS repo.
#   · An entire session ran without a single ctx_execute* call despite that being the mandated path.
#   · The linksee SKILL.md taught four tools removed in v0.11.x.
#
# Every one of those was already "documented somewhere". Prose did not work — it never has on this project (measured: `grep` 788x vs `rg` 4x). So the routing rules live HERE, where they are injected every session and cannot be skipped, per the standing doctrine in reference_enforcement_hooks: a checkable rule becomes a hook, not more prose.
#
# DELIBERATELY ALWAYS PRINTS. A guard whose healthy state is silence cannot be told from a dead one (feedback_verify_before_claiming). Keep it SHORT — it is paid on every session.

LINKSEE_DB="${MCPCHECK_LINKSEE_DB:-$HOME/.linksee-memory/memory.db}"
CANON_ENTITY="${MCPCHECK_CANON:-Diors-Builds}"
FRAG_WARN="${MCPCHECK_FRAG_WARN:-25}"   # warn if more than N memories sit off the canonical entity

warn=""
frag_line="linksee: db not found (memory layer unavailable)"

if [ -r "$LINKSEE_DB" ] && command -v sqlite3 >/dev/null 2>&1; then
  # Junk entities are PATH-DERIVED (folder names), so anything that is not the canonical project and not a known real sibling project is a fragment. `dior` is a REAL separate repo - never count it.
  frag=$(sqlite3 "$LINKSEE_DB" "
    SELECT COALESCE(SUM(c),0) FROM (
      SELECT COUNT(m.id) c FROM memories m JOIN entities e ON e.id=m.entity_id
      WHERE e.name NOT IN ('$CANON_ENTITY','dior')
        AND (m.content LIKE '%Claude Code/$CANON_ENTITY%'
          OR m.content LIKE '%-Applications-Claude-Code-$CANON_ENTITY%')
      GROUP BY e.id);" 2>/dev/null)
  canon=$(sqlite3 "$LINKSEE_DB" "SELECT COUNT(*) FROM memories m JOIN entities e ON e.id=m.entity_id WHERE e.name='$CANON_ENTITY';" 2>/dev/null)
  frag=${frag:-0}; canon=${canon:-0}
  # Auto-capture files RAW USER UTTERANCES as learnings/caveats (no LLM in the Stop-hook path), so a future session recalling "learnings" gets served Harkirat's to-do list. Nothing PREVENTS this upstream; distilling is the only remedy, so the backlog has to at least be VISIBLE. Count the flag directly: dream() returns a BATCH of up to 8, which is not the total.
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

# --- MCP SERVER PRESENCE ------------------------------------------------------------------------ ADDED 2026-08-14 15:10 EDT. Every routing rule below is worthless if the server is not REGISTERED WITH CLAUDE CODE, and that failure is invisible from inside a session: an absent tool and a forgotten tool look identical. Measured that day — `sequential-thinking` had been fixed on 2026-08-13 (a JSON-Schema dialect shim, which works), but the fix was written into the Claude DESKTOP config only. Claude Code reads ~/.claude.json and never saw it. `perseus-vault` was worse: it surfaced in `claude mcp list` as "⏸ Pending approval", a state only an INTERACTIVE `claude` run can clear, so every non-interactive session silently ran without it — while memory-write-gate nagged about zero perseus writes that were impossible to make. Reads the config directly rather than shelling out to `claude mcp list`: that command runs health checks over every remote connector and takes tens of seconds, which is not payable on SessionStart.
CC_CONFIG="${MCPCHECK_CC_CONFIG:-$HOME/.claude.json}"
DESKTOP_CONFIG="${MCPCHECK_DESKTOP_CONFIG:-$HOME/Library/Application Support/Claude/claude_desktop_config.json}"
EXPECTED="${MCPCHECK_EXPECTED:-linksee perseus-vault sequential-thinking codebase-memory-mcp jina-reader}"

if [ -r "$CC_CONFIG" ] && command -v jq >/dev/null 2>&1; then
  have=" $(jq -r '(.mcpServers // {}) | keys[]' "$CC_CONFIG" 2>/dev/null | tr '\n' ' ')"
  missing=""
  for want in $EXPECTED; do
    case "$have" in *" $want "*) ;; *) missing="$missing $want";; esac
  done
  if [ -n "$missing" ]; then
    warn="  🔴 MCP SERVER(S) NOT REGISTERED WITH CLAUDE CODE:${missing}
     These are ABSENT, not merely unused — no amount of remembering will make them callable, and
     from inside a session absent and forgotten look the same. Register each in the USER scope:
       claude mcp add --scope user <name> -- <command> <args...>
     ⚠️ Editing the Claude DESKTOP config does NOT fix this. They are separate lists.
     ⚠️ If \`claude mcp list\` shows one as '⏸ Pending approval', only an INTERACTIVE \`claude\` run
        can clear that — a non-interactive session never can.$warn"
  fi
  # Divergence the other way: configured for Desktop but never mirrored to Claude Code. This is the exact shape of the 2026-08-14 failure, so it is reported even for servers not on the expected list.
  if [ -r "$DESKTOP_CONFIG" ]; then
    only_desktop=""
    for d in $(jq -r '(.mcpServers // {}) | keys[]' "$DESKTOP_CONFIG" 2>/dev/null); do
      case "$have" in *" $d "*) ;; *) only_desktop="$only_desktop $d";; esac
    done
    if [ -n "$only_desktop" ]; then
      warn="  ⚠️ Configured for Claude DESKTOP but NOT for Claude Code:${only_desktop}
     Desktop-only servers are invisible here. Mirror them with \`claude mcp add --scope user\`.$warn"
    fi
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
  · [UNMEASURED — said so on purpose; see the ctx_search line below for what a measured rule looks like]
    codebase-memory-mcp DOES index this JS repo — try search_graph BEFORE rg for
    "where is X / what calls it". If head_sha lags, run detect_changes (a docs-only lag is harmless).
  · [MEASURED, but on PAYLOAD not on hit rate: a 300-line file cost 5,632 tokens on first Read and
    ~150 on a read_smart re-read, 97% saved, 2026-07-24 23:02 EDT. No hit-rate figure exists.]
  · context-mode ctx_execute/ctx_batch_execute/ctx_execute_file for anything whose output you
    PROCESS; Bash only to observe short fixed output or mutate state.
  · [MEASURED 2026-08-31 12:5x EDT, and this is the strongest routing figure in the system:
    against the six selectors a portal audit finding actually prints, `rg` found 1 of 6 and
    `ctx_search` found 5 of 5 — a ledger row is PROSE and a finding is a LITERAL. Ask a prose
    QUESTION through ctx_search; reach for rg only when you already know the literal string.]
  · perseus-vault for durable cross-session decisions; linksee for project/file-scoped caveats.
  · Write to the memory layer at the real moments: a decision, a failure, a correction. An entire
    session once passed with zero writes because nothing forced them.

CLI ROUTING — installed 2026-08-02 15:25 EDT and listed HERE so they get used. shellcheck sat
installed and unrun for weeks while the bug it catches shipped; being on disk is not being available.
  · sd      instead of sed/perl for find-replace — no escaping/quoting minefield (several retries today)
  · ast-grep (sg) for STRUCTURAL code search — `sg -p 'foo($A)'`; beats rg when the shape matters
  · gron    to make unknown JSON greppable — `gron f.json | rg key`; better than hand-rolled node -e
  · difft   for structural diffs when a plain git diff is unreadable
  · deno    for one-off TS/JS scripts with no package.json (instead of long `node -e` one-liners)
  · gtimeout (coreutils) to bound anything that might hang
  · bats    is installed but the hook test suites are still hand-rolled — see db-deferred-list
EOF

# --- sequential-thinking: PERMANENTLY UNRESTRICTED ----------------------------------------------- ⚠️ THE MEASUREMENT WINDOW BLOCK THAT USED TO LIVE HERE WAS REMOVED 2026-08-14 15:10 EDT, AND IT WAS ACTIVELY WRONG, NOT MERELY STALE. It auto-expired on 2026-08-09 and from then on injected "the suspension has EXPIRED — explicit-request-only is in force again" into every single session. Harkirat closed the window that same day with the opposite verdict, on data: unrestricted, the trigger rate rose ~10x and every logged use was high-value, at a cost of ~4k tokens against a window total of 8.23 BILLION. So the hook spent five days telling sessions the tool was restricted when it had been permanently freed — a self-expiring block whose expiry text asserted a decision nobody had made.
#
# THE LESSON, kept because this hook's whole purpose is to stop stale state: an auto-expiring guard must expire into SILENCE or into "ask", never into a substantive claim about a decision. The expiry can only know that a date passed; it cannot know what was decided.
window="
🧠 sequential-thinking is UNRESTRICTED — permanently, decided 2026-08-09 23:08 EDT with data.
   Use it on judgement, no permission needed, no observation log required. Do NOT restore the old
   ask-first rule; the measurement that would justify it was already run and came out the other way."

printf '%s\n%s%s%s' "$frag_line" "$RULES" "$warn" "$window" \
  | jq -Rs '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:.}}'
