#!/bin/bash
# memory-index-check.sh — SessionStart guard for the MEMORY.md index.
#
# WHY THIS EXISTS Only MEMORY.md is auto-loaded into every session; the other memories are read on demand. That makes the index a permanent per-session tax charged per FILE, and it grew unmanaged until it had to be emergency-compacted (23.1KB -> 12.9KB) on 2026-08-02. Prose rules on this project have a measured record of failing, so the budget is enforced here instead. Design: docs/superpowers/specs/2026-08-02-memory-index-scaling-design.md
#
# It also re-runs the conservation check, which previously ran only when someone remembered to.
#
# DELIBERATELY ALWAYS PRINTS ONE LINE, even when clean. A check whose healthy state is silence is indistinguishable from a check that has died — see the memory `feedback_verify_before_claiming`.

# Overridable ONLY so the failure modes can be proven against fixtures (see memory-index-check.test.sh). A check that has never been seen to fail is not known to work - `feedback_verify_before_claiming`. Nothing in normal operation sets these; the defaults are the real store.
MEM="${MEMCHECK_DIR:-$HOME/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory}"
STATE="${MEMCHECK_STATE:-$HOME/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory-index-state}"
# 25000 since 2026-08-09 23:28 EDT, and this is now a REAL number rather than an inherited one. History, because the provenance is the whole point: 16000 was never measured -- the design spec chose it as "~20% above the post-consolidation target of ~9KB", i.e. a number derived from another number. It was then bumped to 20000 on 2026-08-08 as a reactive patch when a session started treating the self-imposed 16000 as a hard wall and stalled on it. Harkirat, 2026-08-09 23:27 EDT: "i don't mind the 25kb ceiling. i just raised it to 20kb because a session earlier was freaking out about the self restricted 16kb ceiling it had put on itself." 25000 is the figure in Anthropic's own `consolidate-memory` skill (~/Library/Application Support/ Claude/local-agent-mode-sessions/skills-plugin/<org>/<account>/skills/), so the tool and the hook now agree instead of contradicting each other. ⚠️ There is NO measured cliff anywhere near here. The old "24.4KB hard read limit" DOES NOT reproduce -- a 33,530-byte memory file reads in full -- so 25000 sits comfortably under demonstrated-working, and this is a housekeeping ceiling, not a platform limit. Do NOT "restore" 16000, 20000 or 25000; all are superseded, and none of the first three ever measured anything. RAISED TO 30000 on 2026-08-27 15:4x EDT on Harkirat's instruction -- "increase the threshold to 30,000 bytes for now" -- when the index reached 24,862B and a new one-line entry would not fit, which forced a real lesson to be folded into a neighbouring file rather than filed on its own merits. ⚠️ 30000 is the FIRST value here that sits ABOVE the platform's own advisory ceiling (24.4 KiB = 25,000B exactly), so the two now DISAGREE and the repo hook governs; it is still comfortably under the largest memory file demonstrated to read in full (33,530B). The word "for now" is his: this is a working ceiling, not a finding.
BUDGET="${MEMCHECK_BUDGET:-35000}"

[ -d "$MEM" ] || exit 0
[ -f "$MEM/MEMORY.md" ] || {
  printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"MEMORY INDEX: FATAL - %s/MEMORY.md is missing. Per CLAUDE.md'"'"'s canonical-memory-path sanity test, a memory dir without MEMORY.md means you are at the WRONG PATH. Run ls and believe it."}}\n' "$MEM"
  exit 0
}

# --- the three partitions ----------------------------------------------------------------------- Partition 1: active, flat, excluding the index itself -> must have exactly one index line.
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

# --- conservation: the store may only lose a file THROUGH the archive -------------------------- The store is NOT under version control, so a deleted memory is gone for good and nothing else would notice. Compare the total against the last run; a drop means a file left without being archived. This is the one check here that catches silent data loss.
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

# --- budget ------------------------------------------------------------------------------------- TWO tiers, not one - added 2026-08-07 10:53 EDT. The over-budget check alone reported a clean "ok" at 15,691/16,000 (98% full) right up until the byte that tipped it over, because ">BUDGET" is false at 98%. A session reasonably reads "ok" as "nothing to do" and only gets a real signal once the NEXT index-line addition already doesn't fit - too late to act on with any room to think about it. THRESHOLD_PCT (default 90%) fires an advisory early, while there's still slack to consolidate/ archive something deliberately instead of being forced into it mid-edit. Distinct wording from "over budget" so the two states are never conflated in a status line or a test assertion.
THRESHOLD_PCT="${MEMCHECK_THRESHOLD_PCT:-90}"
threshold=$(( BUDGET * THRESHOLD_PCT / 100 ))

warn=""
if [ "$size" -gt "$BUDGET" ]; then
  warn="  BUDGET: MEMORY.md is ${size}B, over the ${BUDGET}B budget. Consolidate near-duplicate lessons
    into one entry with a case list, or archive what is finished - do NOT just trim the lines, that
    lever is already spent. New lessons default to a CASE inside an existing memory (see the memory
    project_memory_index_scaling for the three tests that earn a file)."
elif [ "$size" -gt "$threshold" ]; then
  pct=$(( size * 100 / BUDGET ))
  warn="  APPROACHING BUDGET: MEMORY.md is ${size}B/${BUDGET}B (${pct}%, over the ${THRESHOLD_PCT}%
    advisory line). Still under budget, but the NEXT new index line may not fit - look for a
    retirement/merge candidate now, while there's room to choose one deliberately, rather than being
    forced into it mid-edit. See project_memory_index_scaling for the retirement criteria.
    METHOD: run Anthropic's own 'consolidate-memory' skill (take stock -> consolidate -> tidy index).
    ⚠️ Its Phase 3 target is 25,000B and this budget is 30,000B -- they NO LONGER agree, since 2026-08-27.
    Follow the skill's METHOD (take stock -> consolidate -> tidy index), not its number. ONE
    override: its 'retire dated files / drop what is easy to re-find' step must NOT touch the
    feedback_* memories - those are durable by design and are not re-derivable from the repo.
    The skill lives OUTSIDE ~/.claude and no search there will find it:
    ~/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/<org>/<account>/skills/"
fi

if [ -n "$err" ]; then
  status="MEMORY INDEX: ERRORS FOUND$err"
  [ -n "$warn" ] && status="$status
$warn"
elif [ "$size" -gt "$BUDGET" ]; then
  status="MEMORY INDEX: over budget
$warn"
elif [ -n "$warn" ]; then
  status="MEMORY INDEX: ok, approaching budget
$warn"
else
  status="MEMORY INDEX: ok - ${n_active} active + ${n_arch} archived, ${n_links} links resolve, MEMORY.md ${size}B/${BUDGET}B."
fi

printf '%s' "$status" | jq -Rs '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:.}}'
