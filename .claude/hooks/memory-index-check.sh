#!/bin/bash
# memory-index-check.sh — SessionStart guard for the MEMORY.md index.
#
# WHY THIS EXISTS
# Only MEMORY.md is auto-loaded into every session; the other memories are read on demand. That makes
# the index a permanent per-session tax charged per FILE, and it grew unmanaged until it had to be
# emergency-compacted (23.1KB -> 12.9KB) on 2026-08-02. Prose rules on this project have a measured
# record of failing, so the budget is enforced here instead. Design:
# docs/superpowers/specs/2026-08-02-memory-index-scaling-design.md
#
# It also re-runs the conservation check, which previously ran only when someone remembered to.
#
# DELIBERATELY ALWAYS PRINTS ONE LINE, even when clean. A check whose healthy state is silence is
# indistinguishable from a check that has died — see the memory `feedback_verify_before_claiming`.

# Overridable ONLY so the failure modes can be proven against fixtures (see memory-index-check.test.sh).
# A check that has never been seen to fail is not known to work - `feedback_verify_before_claiming`.
# Nothing in normal operation sets these; the defaults are the real store.
MEM="${MEMCHECK_DIR:-$HOME/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory}"
STATE="${MEMCHECK_STATE:-$HOME/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory-index-state}"
BUDGET="${MEMCHECK_BUDGET:-16000}"

[ -d "$MEM" ] || exit 0
[ -f "$MEM/MEMORY.md" ] || {
  printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"MEMORY INDEX: FATAL - %s/MEMORY.md is missing. Per CLAUDE.md'"'"'s canonical-memory-path sanity test, a memory dir without MEMORY.md means you are at the WRONG PATH. Run ls and believe it."}}\n' "$MEM"
  exit 0
}

# --- the three partitions -----------------------------------------------------------------------
# Partition 1: active, flat, excluding the index itself -> must have exactly one index line.
active=$(find "$MEM" -maxdepth 1 -name '*.md' -exec basename {} \; 2>/dev/null | grep -v '^MEMORY.md$' | sort)
# Partition 2: archived -> must have NO index line, and must carry a retirement header.
archived=$(find "$MEM/archive" -maxdepth 1 -name '*.md' -exec basename {} \; 2>/dev/null | sort)
# Partition 3: the links the index actually makes.
links=$(grep -o '](\([a-z0-9_.-]*\.md\))' "$MEM/MEMORY.md" 2>/dev/null | sed 's/^](//;s/)$//' | sort -u)

n_active=$(printf '%s' "$active" | grep -c . )
n_arch=$(printf '%s' "$archived" | grep -c . )
n_links=$(printf '%s' "$links" | grep -c . )
size=$(wc -c < "$MEM/MEMORY.md" | tr -d ' ')

err=""

# Orphan: on disk and active, but nothing points at it. An unreachable memory is a lost memory.
orphans=$(comm -23 <(printf '%s\n' "$active") <(printf '%s\n' "$links") | grep . )
[ -n "$orphans" ] && err="$err
  ORPHANS (active on disk, NOT in the index - unreachable):
$(printf '%s' "$orphans" | sed 's/^/    /')"

# Dangling: the index promises a file that is not there.
dangling=$(comm -13 <(printf '%s\n' "$active") <(printf '%s\n' "$links") | grep . )
if [ -n "$dangling" ]; then
  # Distinguish the two causes - a link into the archive is a different bug than a vanished file.
  into_archive=$(printf '%s\n' "$dangling" | while IFS= read -r f; do
    [ -f "$MEM/archive/$f" ] && echo "$f"; done)
  missing=$(printf '%s\n' "$dangling" | while IFS= read -r f; do
    [ -f "$MEM/archive/$f" ] || echo "$f"; done | grep . )
  [ -n "$into_archive" ] && err="$err
  INDEX LINKS INTO archive/ (archived memories must be STRUCK from the index, not linked):
$(printf '%s' "$into_archive" | sed 's/^/    /')"
  [ -n "$missing" ] && err="$err
  DANGLING (indexed, file does not exist anywhere):
$(printf '%s' "$missing" | sed 's/^/    /')"
fi

# Archived files must announce themselves, or a future session cites a frozen record as current.
if [ -n "$archived" ]; then
  noheader=$(printf '%s\n' "$archived" | while IFS= read -r f; do
    [ -n "$f" ] || continue
    grep -q 'RETIRED' "$MEM/archive/$f" 2>/dev/null || echo "$f"
  done | grep . )
  [ -n "$noheader" ] && err="$err
  ARCHIVED WITHOUT A RETIREMENT HEADER (must state when + why it was retired):
$(printf '%s' "$noheader" | sed 's/^/    /')"
fi

# --- conservation: the store may only lose a file THROUGH the archive --------------------------
# The store is NOT under version control, so a deleted memory is gone for good and nothing else
# would notice. Compare the total against the last run; a drop means a file left without being
# archived. This is the one check here that catches silent data loss.
total=$((n_active + n_arch))
if [ -f "$STATE" ]; then
  prev=$(cat "$STATE" 2>/dev/null | tr -d ' ')
  case "$prev" in ''|*[!0-9]*) prev="" ;; esac
  if [ -n "$prev" ] && [ "$total" -lt "$prev" ]; then
    err="$err
  CONSERVATION VIOLATION: the store held $prev files, now holds $total. A memory left WITHOUT being
    archived. The store has no version control - recover from the newest
    ~/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory-snapshot-*.tar.gz before doing
    anything else."
  fi
fi
printf '%s' "$total" > "$STATE"

# --- budget -------------------------------------------------------------------------------------
warn=""
if [ "$size" -gt "$BUDGET" ]; then
  warn="  BUDGET: MEMORY.md is ${size}B, over the ${BUDGET}B budget. Consolidate near-duplicate lessons
    into one entry with a case list, or archive what is finished - do NOT just trim the lines, that
    lever is already spent. New lessons default to a CASE inside an existing memory (see the memory
    project_memory_index_scaling for the three tests that earn a file)."
fi

if [ -n "$err" ]; then
  status="MEMORY INDEX: ERRORS FOUND$err"
  [ -n "$warn" ] && status="$status
$warn"
elif [ -n "$warn" ]; then
  status="MEMORY INDEX: over budget
$warn"
else
  status="MEMORY INDEX: ok - ${n_active} active + ${n_arch} archived, ${n_links} links resolve, MEMORY.md ${size}B/${BUDGET}B."
fi

printf '%s' "$status" | jq -Rs '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:.}}'
