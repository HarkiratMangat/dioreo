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
# 25000 since 2026-08-09 23:28 EDT, and this is now a REAL number rather than an inherited one. History, because the provenance is the whole point: 16000 was never measured -- the design spec chose it as "~20% above the post-consolidation target of ~9KB", i.e. a number derived from another number. It was then bumped to 20000 on 2026-08-08 as a reactive patch when a session started treating the self-imposed 16000 as a hard wall and stalled on it. Harkirat, 2026-08-09 23:27 EDT: "i don't mind the 25kb ceiling. i just raised it to 20kb because a session earlier was freaking out about the self restricted 16kb ceiling it had put on itself." 25000 is the figure in Anthropic's own `consolidate-memory` skill (~/Library/Application Support/ Claude/local-agent-mode-sessions/skills-plugin/<org>/<account>/skills/), so the tool and the hook now agree instead of contradicting each other. ⚠️ There is NO measured cliff anywhere near here. The old "24.4KB hard read limit" DOES NOT reproduce -- a 33,530-byte memory file reads in full -- so 25000 sits comfortably under demonstrated-working, and this is a housekeeping ceiling, not a platform limit. Do NOT "restore" 16000, 20000 or 25000; all are superseded, and none of the first three ever measured anything. RAISED TO 30000 on 2026-08-27 15:4x EDT on Harkirat's instruction -- "increase the threshold to 30,000 bytes for now" -- when the index reached 24,862B and a new one-line entry would not fit, which forced a real lesson to be folded into a neighbouring file rather than filed on its own merits. ⚠️ 30000 is the FIRST value here that sits ABOVE the platform's own advisory ceiling (24.4 KiB = 25,000B exactly), so the two now DISAGREE and the repo hook governs; it is still comfortably under the largest memory file demonstrated to read in full (33,530B). The word "for now" is his: this is a working ceiling, not a finding. RAISED TO 40000 on 2026-08-31 19:1x EDT: the standing SILENT-MODE working style and its vocabulary (call · turn · run · prose-only turn · batch · mega-batch · checkpoint) moved INTO the index so they survive a compact instead of living in chat, which cost ~5.2KB and took the file to 33,582B. Harkirat asked for "35KB or 40KB, whichever fits" -- 35000 was tried first and left the index at 95%, already past this hook own 90% advisory, so it did not fit in any useful sense. 40000 is the value that leaves real headroom.
BUDGET="${MEMCHECK_BUDGET:-25000}"
# 🔴 LOWERED FROM 40000 TO 25000 ON 2026-09-02 15:56 EDT, AND THIS IS THE FIRST VALUE HERE THAT IS NOT A HOUSEKEEPING CHOICE. Every earlier number was invented locally -- 16000 derived from another number, 20000 a reactive patch, 25000 borrowed from a skill, 30000 and 35000 and 40000 raised to fit content that had already grown. 25000 is the PLATFORM's own cap, the one that actually truncates, so the budget and the thing it is protecting against are finally the same number and cannot drift apart. It was raisable before only because it protected nothing real. ⚠️ IT IS SAFE NOW BECAUSE THE CONTENT MOVED, NOT BECAUSE THE NUMBER DID: the index came down from 35,147B/185 lines to ~22,000B/151 by lifting SILENT MODE into .claude/rules/silent-mode.md (an instruction, so it was in the wrong tier) and moving 79 over-long index-line tails into the topic files they point at. Nothing was deleted. ⚠️ DO NOT RAISE IT AGAIN. Past this line the loader drops the tail and no amount of budget says otherwise; the remedy is the one that just worked -- one short line per entry, detail in the topic file, instructions in the instruction tier. 🔴 THE PLATFORM CUTS ON WHICHEVER COMES FIRST, AND THIS HOOK COULD ONLY SEE ONE OF THEM UNTIL 2026-09-02 11:40 EDT. The documented law is "the first 200 lines of MEMORY.md, or the first 25KB, whichever comes first" — two limits, and every number ever argued about in this repo (16000 → 20000 → 25000 → 30000 → 35000 → 40000, six values across four raises) was a BYTE number. Nothing had ever counted the lines. Measured that day: 35,147B over 185 lines, so bytes bind at line 127 and the line limit has ~15 lines of headroom — which is precisely why this was worth fixing BEFORE the index is trimmed rather than after. The whole point of the trim is to shorten entries; shortening entries moves the file TOWARD the line limit while moving it away from the byte limit, so the remedy for one ceiling walks the file into the other. A gate that watches only bytes would report a confident green the moment the trim succeeds, while the tail silently stops loading again — the same vacuous pass this repo has three memories about, re-armed by its own fix.
PLATFORM_CAP="${MEMCHECK_PLATFORM_CAP:-25000}"
PLATFORM_LINES="${MEMCHECK_PLATFORM_LINES:-200}"

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
lines=$(wc -l < "$MEM/MEMORY.md" | tr -d ' ')

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
    ⚠️ Its Phase 3 target is 25,000B and this budget is ${BUDGET}B -- they NO LONGER agree, since 2026-08-27. (Read from the variable on purpose: this line hardcoded 30,000 through one raise and 25,000 through two before that, in the hook whose own job is to report a number accurately.)
    Follow the skill's METHOD (take stock -> consolidate -> tidy index), not its number. ONE
    override: its 'retire dated files / drop what is easy to re-find' step must NOT touch the
    feedback_* memories - those are durable by design and are not re-derivable from the repo.
    The skill lives OUTSIDE ~/.claude and no search there will find it:
    ~/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/<org>/<account>/skills/"
fi

# The line limit gets the same early-warning treatment as the byte budget, and for the same reason: ">limit" is false at 99% right up until the entry that tips it over, which is one edit too late to choose a retirement candidate deliberately.
line_threshold=$(( PLATFORM_LINES * THRESHOLD_PCT / 100 ))
if [ "$lines" -le "$PLATFORM_LINES" ] && [ "$lines" -gt "$line_threshold" ]; then
  warn="$warn
  APPROACHING THE LINE LIMIT: MEMORY.md is ${lines} lines against the platform's ${PLATFORM_LINES}-line
    cap (over the ${THRESHOLD_PCT}% advisory line). This limit is NOT this hook's byte BUDGET and is not
    raisable from here — the loader takes the first ${PLATFORM_LINES} lines OR ${PLATFORM_CAP}B, whichever
    comes first. ⚠️ Shortening entries moves the file TOWARD this ceiling, so do not answer it by
    trimming: merge or retire whole entries."
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
  status="MEMORY INDEX: ok - ${n_active} active + ${n_arch} archived, ${n_links} links resolve, MEMORY.md ${size}B/${BUDGET}B, ${lines} lines/${PLATFORM_LINES}."
fi

# --- the PLATFORM truncates a large MEMORY.md, and this hook is the only channel round it ----------- 🔴 TWO INSTRUMENTS REPORT ON THIS FILE AND ONLY ONE OF THEM IS OURS. This hook reports bytes against BUDGET above. The PLATFORM's own memory loader separately reports "MEMORY.md is 32KB (limit: 24.4KB) -- index entries are too long. Only part of it was loaded", and that one TRUNCATES. Measured 2026-08-31 22:1x EDT: no emitter for that string exists anywhere in .claude/, ~/.claude/hooks/ or either settings.json, so it is the harness and it cannot be raised, configured or silenced from here. The loss is real and it is the TAIL: the final "## Docs & memory structure" section did not arrive in that session's context at all, while everything above it did. ⚠️ So this is a MITIGATION, not a fix. additionalContext is not subject to the memory loader's limit, so re-emitting the last few KB here puts the dropped lines back in front of the session. It is sized against the measured loss (~1.2KB) with better than 2x margin, NOT against the platform's stated 24.4KB -- that figure does not match the observed cut point, and guessing a byte offset from a number that already disagrees with behaviour is how a mitigation becomes a second wrong constant. ⚠️ Most of what it re-emits DID load. That duplication is the price of the margin, and it is cheap next to a session running without its standing instructions and nothing saying so. 🔴 SELF-SIZING, BECAUSE THE FIXED 2500 WAS OUTGROWN AND NOTHING RE-MEASURED IT. That constant was sized 2026-08-31 against a ~1.2KB measured loss with "better than 2x margin". Measured again 2026-09-01 16:0x EDT: the file WAS 33,934B, so the overflow was ~8,900B and **42 index lines never reached a session**. PAST TENSE SINCE 2026-09-02 16:26 EDT: the index is 22,230B over 151 lines and this whole block now stands down. It is kept because the mitigation has to survive the file growing again, not because it is currently firing — the mitigation was covering under a third of the loss while its own comment said it had 2x margin. A margin computed once against a growing file is a constant with an expiry nobody wrote down. It is derived from the actual overflow now, so it cannot drift again. ⚠️ AND THE RE-EMIT IS NOT THE FIX. Harkirat, 2026-09-01: the truncated content is NOT lost, it is merely unloaded — so the session is TOLD to read the file, and the lines below are the fallback for a session that does not. Only INDEX LINES and headings past the cut are repeated: they are the load-bearing content, and emitting lines rather than bytes removes the margin guess entirely.
TAIL_BYTES="${MEMCHECK_TAIL_BYTES:-0}"
over_bytes=0; [ "$size" -gt "$PLATFORM_CAP" ] && over_bytes=1
over_lines=0; [ "$lines" -gt "$PLATFORM_LINES" ] && over_lines=1
binding=""
[ "$over_bytes" = 1 ] && binding="BYTES (${size}B against a ~${PLATFORM_CAP}B cap)"
if [ "$over_lines" = 1 ]; then
  if [ -n "$binding" ]; then binding="$binding AND LINES (${lines} against a ${PLATFORM_LINES}-line cap)"
  else binding="LINES (${lines} against a ${PLATFORM_LINES}-line cap) — the BYTE size is fine at ${size}B, which is exactly how this goes unnoticed"; fi
fi
if [ "$over_bytes" = 1 ] || [ "$over_lines" = 1 ]; then
  status="$status

  🔴 READ THE WHOLE MEMORY INDEX BEFORE YOU RELY ON IT -- Read(${MEM}/MEMORY.md). This is an
  INSTRUCTION, not a warning. The HARNESS's memory loader takes the first ${PLATFORM_LINES} lines OR
  the first ${PLATFORM_CAP}B, WHICHEVER COMES FIRST, and this index is over on ${binding}. The TAIL
  did not arrive in your context. Its own message says so: \"Only part of it was loaded\". **The content is not lost; it is
  simply unloaded, and one Read restores all of it.** That limit is not this hook's BUDGET and cannot
  be raised from this repo.

  The index lines past the cut are repeated below as a FALLBACK for a session that does not read the
  file. They are lines, not a byte count: a hand-sized margin was outgrown once already.

$(MEMCHECK_CAP="$PLATFORM_CAP" MEMCHECK_LINELIM="$PLATFORM_LINES" python3 -c 'import os,sys,pathlib
cap = int(os.environ["MEMCHECK_CAP"]); lim = int(os.environ["MEMCHECK_LINELIM"]); n = 0
for i, line in enumerate(pathlib.Path(sys.argv[1]).read_text().splitlines(), 1):
    n += len(line.encode()) + 1                     # BYTES, not characters: this index is full of multi-byte emoji
    # Past EITHER cut. Whichever comes first is the real one, and re-emitting from both unions correctly
    # when only the line limit binds — the case a byte-only reader renders as an empty, confident tail.
    if (n > cap or i > lim) and (line.startswith("- [") or line.startswith("## ")): print(line)' "$MEM/MEMORY.md")"
fi

printf '%s' "$status" | jq -Rs '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:.}}'
