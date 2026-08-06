#!/usr/bin/env bash
# completeness-sweep.sh — passes 2 and 3 of the pre-PR audit.
#
# WHY THIS EXISTS (2026-08-06 09:19 EDT, Harkirat's ask, in his words):
#   "I usually tell you to check, then after I'll usually tell you do another check with a different
#    angle or with a wider scope, then I'll usually tell you to check again and think hard about what
#    you might have missed... I don't want to have to repeat that to you 3 separate times."
#
# Three prompts, three DIFFERENT KINDS of check — encoding the kinds is the whole point:
#   1. references   — did I update everything naming what I changed?  -> stale-reference-sweep.sh
#   2. conservation — did the change LOSE something, or leave a surviving claim FALSE?  -> here
#   3. angles       — which KIND of check never ran at all?           -> here
#
# ── TIMING: WHY `Stop`, NOT ONLY `gh pr create` ───────────────────────────────────────────────────
# stale-reference-sweep.sh fires at `gh pr create`. On 2026-08-06 that gate COULD NOT HAVE FIRED: the
# session made three completion claims across six commits and never opened a PR. Harkirat had to
# prompt three times — each one AFTER a false "done" had already reached him.
# The moment this must fire is the moment the CLAIM IS MADE. That is `Stop`, per assistant message.
# `gh pr create` is kept as the backstop for a session that opens a PR without ever claiming done.
# Same lesson as records-close-check.sh's header ("the real defect was never absence, it was
# TIMING") and as that hook's dead `grep -qx`, found the same morning.
#
# ── COST: WHY IT IS NOT A TOKEN BURNER (Harkirat's second ask, same session) ──────────────────────
# A Stop hook runs on EVERY assistant message, so an expensive one is worse than none — it adds
# latency to every turn and, printing the same block repeatedly, trains the reader to skip it.
# Four cost controls, in the order they execute:
#   1. STAMP FIRST. A fingerprint of (base + HEAD + working-tree state) is cached in .git/. Unchanged
#      since the last report -> exit 0 having run two git commands. The overwhelmingly common case.
#   2. CLAIM-GATED. Fires only when the message actually claims done/verified/clean, read from the
#      LAST assistant message via `tail -c` — never the whole transcript.
#   3. NEVER `cat` THE TRANSCRIPT. Angle detection uses `rg -q` STREAMING over the file, once per
#      angle. A 10 MB transcript costs a bounded scan, not 10 MB of shell memory. (`cat` into a
#      variable was the first draft's real defect.)
#   4. docs-audit RUNS IN `pr` MODE ONLY. It examines ~2,700 items; per-message that would make this
#      the thing everyone disables. At `gh pr create`, docs-audit-gate.sh runs it anyway.
# Output is hard-capped: counts plus ONE example per finding, never a dump. Output is the only part
# that costs context, so output is the part that is budgeted.
#
# ── ITS FAILURE MODE, STATED (every guard here declares one) ──────────────────────────────────────
# Pass 3 proves an angle's SIGNATURE appears in the session, never that it was applied WELL. A single
# token `rg` over one file satisfies a detector. That is a real limit, not a hidden one: the job is
# to make UNRUN angles impossible to overlook, not to grade the ones that ran. It reports what
# nothing has looked at; it never reports that the work is complete.

set -uo pipefail

REPO="${CLAUDE_PROJECT_DIR:-/Applications/Claude Code/Diors-Builds}"
BASE="${1:-main}"
TRANSCRIPT="${2:-}"
MODE="${3:-pr}"          # stop | pr

cd "$REPO" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

# ⚠️ TWO BASES EXIST IN THIS REPO and the `Stop` wiring cannot know which one applies — it fires on
# every message, long before any `--base` flag is typed, so it passes a literal `main`. A v3 branch
# is cut from `v3-pre-release`, and diffing it against `main` yields the whole v3 delta: every v3
# file reads as "changed", conservation scans hundreds of irrelevant lines, and the report is noise
# on the branch type that most needs it. Detected 2026-08-06 09:32 EDT while adversarially testing
# this hook rather than by hitting it in production.
# Three cheap git calls: if the merge-base with v3-pre-release is a DESCENDANT of the merge-base with
# main, the branch was cut from v3 and v3 is the truer base.
if [ "$BASE" = main ] && git rev-parse --verify -q v3-pre-release >/dev/null 2>&1; then
  mb_main=$(git merge-base main HEAD 2>/dev/null)
  mb_v3=$(git merge-base v3-pre-release HEAD 2>/dev/null)
  if [ -n "$mb_main" ] && [ -n "$mb_v3" ] && [ "$mb_main" != "$mb_v3" ] \
     && git merge-base --is-ancestor "$mb_main" "$mb_v3" 2>/dev/null; then
    BASE=v3-pre-release
  fi
fi

emit() {
  if [ "$MODE" = stop ]; then
    jq -n --arg f "$1" '{decision:"block", reason:("COMPLETENESS SWEEP -- you are reporting this as done. These are the checks that normally take three prompts to get.\n\nPass 1 (references) is stale-reference-sweep.sh. Below are passes 2 and 3: what the change may have LOST or left FALSE, and which KIND of check never ran.\n" + $f + "\n\nNone of it is a verdict -- it is what nothing has looked at yet. Work through it and report what each turned up, including \"checked, nothing there\". Do not restate the work as done while an item above is unexamined; that sequence is the reason this gate exists.")}'
  else
    jq -n --arg f "$1" '{hookSpecificOutput:{hookEventName:"PreToolUse", additionalContext:("COMPLETENESS SWEEP -- passes 2 and 3 of the pre-PR audit (pass 1 is stale-reference-sweep.sh).\n" + $f + "\n\nNone of it is a verdict -- it is what nothing has looked at yet. Report what each turned up, including \"checked, nothing there\".")}}'
  fi
}

# ── COST CONTROL 1: the stamp. Two git commands, then usually exit. ───────────────────────────────
# Lives in .git/ deliberately: never committed, never shared between clones or worktrees, discarded
# with the clone. A stamp in the tree would be state that rots and needs gitignoring.
STAMP="$(git rev-parse --git-dir)/completeness-sweep.stamp"
# ⚠️ THE SESSION IS PART OF THE FINGERPRINT — added 2026-08-06 09:44 EDT.
# The stamp lives in .git/ and therefore PERSISTS ACROSS SESSIONS. Without the session component, a
# new session inheriting an unchanged repo state got SILENCE on its first completion claim — and a
# fresh session has taken ZERO angles, which is precisely when pass 3 is worth the most. The stamp
# is meant to suppress repeats within a session, never to carry "already checked" into a new one.
fingerprint=$(printf '%s|%s|%s|%s' "$BASE" "${TRANSCRIPT##*/}" \
  "$(git rev-parse HEAD 2>/dev/null)" "$(git status --porcelain 2>/dev/null | cksum)")
if [ -f "$STAMP" ] && [ "$(cat "$STAMP" 2>/dev/null)" = "$fingerprint" ]; then
  exit 0   # nothing changed since this exact state was reported IN THIS SESSION. Silence is correct.
fi

# ⚠️ UNCOMMITTED WORK WAS INVISIBLE — the single highest-likelihood miss in the whole design.
# `$BASE...HEAD` sees COMMITTED work only, so a session that edits twenty files and claims "done"
# without committing produced an empty diff and total silence. That is not an edge case: it is the
# default state mid-session, and it is exactly when a premature "done" is most likely. The sweep now
# unions committed changes with the working tree, so the gate covers the work as it actually exists
# rather than as git has recorded it so far.
changed=$(
  { git diff --name-only "$BASE...HEAD" 2>/dev/null
    git status --porcelain 2>/dev/null | sed 's/^...//'
  } | sort -u
)
[ -n "$changed" ] || exit 0

# ⚠️ FAIL LOUD IF `rg` IS ABSENT. Without it the conservation loop's `rg -q` returns non-zero for
# EVERY sampled line, so a missing binary reports 100% data loss on every deleted file — a confident
# FABRICATED alarm, which is worse than silence because it trains dismissal of the one run that
# matters. stale-reference-sweep.sh already guards exactly this ("the tool is missing" and "the tool
# found nothing" must never look the same); CI proved it is not hypothetical, since the ubuntu runner
# has no ripgrep. This hook shipped without the guard and inherited the inverse of that bug.
if ! command -v rg >/dev/null 2>&1; then
  msg="COMPLETENESS SWEEP CANNOT RUN: ripgrep (rg) is not installed, so conservation and angle detection did NOT run. Do NOT read this as a clean sweep — with rg absent the conservation check would report every line as lost, so it is disabled rather than allowed to fabricate findings."
  if [ "$MODE" = stop ]; then jq -n --arg m "$msg" '{decision:"block",reason:$m}'
  else jq -n --arg m "$msg" '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:$m}}'; fi
  exit 0
fi

# ── COST CONTROL 2: claim gate (stop mode only) ───────────────────────────────────────────────────
# ⚠️ DELEGATES to claim-detect.sh. This carried its OWN copy of the completion-claim regex while the
# gate in settings.json carried a different one — two dialects for one concept, in the same repo
# whose `notes-open-items.sh` exists precisely because a duplicated regex drifted and one copy went
# silently unfixed for weeks. Consolidated 2026-08-06 09:47 EDT, found by asking what this hook
# DUPLICATES — an angle neither earlier pass took. The comment here used to claim it "mirrors" that
# vocabulary; mirroring by hand is what drift looks like before it drifts.
if [ "$MODE" = stop ]; then
  [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ] || exit 0
  DETECT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/claim-detect.sh"
  # A missing detector must not silently disable the gate: "no claim was made" and "the test for a
  # claim is gone" must never look the same — the failure shape three other hooks here guard against.
  if [ ! -r "$DETECT" ]; then
    jq -n '{decision:"block",reason:"COMPLETENESS SWEEP: .claude/hooks/claim-detect.sh is missing, so the completion-claim gate could not be evaluated and passes 2 and 3 did NOT run. This is not a clean sweep."}'
    exit 0
  fi
  bash "$DETECT" "$TRANSCRIPT" || exit 0
fi

findings=""

# ══ PASS 2a — CONSERVATION ════════════════════════════════════════════════════════════════════════
# For every file DELETED or RENAMED on this branch: is its content still findable in the tree? A move
# that silently drops a paragraph passes every reference check ever written, because nothing is left
# pointing at the missing text. Reference conservation and CONTENT conservation are different
# properties, and only the first has ever been checked here.
#
# Sampling, not exhaustive diffing — the question is "did a chunk vanish?", not a byte audit.
# Substantial lines only, capped at 40, stopping after 6 misses: past that the answer is already
# "yes, look at this file" and more scanning buys nothing.
# Committed deletes/renames UNION uncommitted ones. Leaving the working tree out here would have
# made the uncommitted-work fix above half a fix: `changed` would cover the tree while the
# conservation pass — the only check that can see content vanish — still saw committed history only.
# `git status --porcelain` reports a delete as `D ` or ` D` and a rename as `R  old -> new`; take the
# OLD path in both cases, since that is the name whose content has to be accounted for.
gone_files=$(
  { git diff --name-status -M "$BASE...HEAD" 2>/dev/null | awk -F'\t' '$1=="D"||$1 ~ /^R/{print $2}'
    git status --porcelain 2>/dev/null | awk '/^ ?[DR]/{sub(/^.../,""); sub(/ -> .*/,""); print}'
  } | sort -u
)

while IFS= read -r f; do
  [ -n "$f" ] || continue
  case "$f" in *.md|*.js|*.mjs|*.sh) ;; *) continue;; esac
  total=0; missing=0; worst=""
  while IFS= read -r line; do
    [ "${#line}" -ge 45 ] || continue
    total=$((total+1))
    # ⚠️ `-e "$line"` IS LOAD-BEARING. Markdown content lines routinely start with `-` (every
    # bullet) and rg parses a leading-dash argument as a FLAG. Without it this reported 29 of 60
    # lines "missing" from a file whose bytes are provably IDENTICAL across the move — a
    # conservation checker inventing data loss, caught on its first live run 2026-08-06 09:16 EDT.
    # Same family as the three rg-flag traps already recorded in ~/.claude/CLAUDE.md.
    if ! rg -q --hidden --no-ignore --fixed-strings -e "$line" "$REPO" 2>/dev/null; then
      missing=$((missing+1))
      [ -z "$worst" ] && worst="${line:0:100}"
      [ "$missing" -ge 6 ] && break
    fi
    [ "$total" -ge 40 ] && break
  done < <(git show "$BASE:$f" 2>/dev/null | sed 's/^[[:space:]]*//')

  # ⚠️ Say so when the count STOPPED EARLY. The 6-miss break is a cost control, but it made the
  # report read "6 of 6 lines missing" — 100% loss — for a file where the real figure was 10 of 60.
  # A ratio that overstates by 10x on its first live run is how a finding gets dismissed as broken.
  qual=$([ "$missing" -ge 6 ] && printf 'at least %s of the first %s' "$missing" "$total" || printf '%s of %s' "$missing" "$total")
  [ "$missing" -gt 0 ] && findings="$findings
  📦 CONSERVATION — '$f' was deleted or renamed and $qual sampled lines are findable nowhere in the
     tree. Deliberate rewrite, or content DROPPED? A reference check cannot see this: nothing points
     at text that no longer exists. First: \"$worst\""
done <<< "$gone_files"

# ══ PASS 2b — DID I ADD AUDIT WARNINGS? (pr mode only — see COST CONTROL 4) ═══════════════════════
# A warning naming a file this branch touched is one this branch plausibly INTRODUCED. No second
# worktree, no recorded baseline to rot — an attribution heuristic, stated as a question.
if [ "$MODE" = pr ] && command -v node >/dev/null 2>&1 && [ -f "$REPO/scripts/docs-audit.mjs" ]; then
  # ⚠️ Shape VERIFIED against a real run 2026-08-06 09:16 EDT, not assumed: the document is
  # {errors, warnings, results, ledger} with `results` a FLAT array of {id,severity,title,msg}.
  # The first draft guessed `.checks[].findings[].msg`, which yields null on every run — a check
  # that can never fire reads exactly like a check that found nothing. One `jq keys` settled it.
  warned=$(node "$REPO/scripts/docs-audit.mjs" --json 2>/dev/null \
           | jq -r '.results[]? | select(.severity=="WARN") | .msg' 2>/dev/null)
  if [ -n "$warned" ]; then
    suspect=$(while IFS= read -r f; do
                [ -n "$f" ] && printf '%s' "$warned" | grep -qF "$f" && printf '%s ' "$f"
              done <<< "$changed")
    [ -n "$suspect" ] && findings="$findings
  📊 AUDIT DELTA — docs-audit warnings name files this branch changed, so they may be warnings you
     just introduced rather than pre-existing ones. Confirm against origin/$BASE before calling the
     warning count unchanged: $suspect"
  fi
fi

# ══ PASS 3 — WHICH ANGLE WAS NEVER RUN ════════════════════════════════════════════════════════════
# The third prompt Harkirat has had to give — "think hard about what you might have missed" — is NOT
# un-mechanisable. "Which angle didn't I check" is a SET DIFFERENCE: a registry of audit angles minus
# those whose signature appears in this session. outstanding-not-filed.sh already parses the
# transcript this way, so the technique is proven in this directory.
#
# Format: id|detector|demand. Detectors are deliberately BROAD — a false "covered" beats a gate that
# fires on everything and gets dismissed unread, the failure mode written into four other hooks here.
# `rg -q` STREAMS the file; nothing is read into memory (COST CONTROL 3).
ANGLES=(
"external-trees|config/dior|Sweep the surfaces OUTSIDE this repo that name paths inside it: ~/.config/dior (its own git repo — this is how \`dior notes\` broke), /Applications/Claude Code/meta-deferred-list.md, and ~/.claude/settings.json. No in-repo search reaches any of them; they are invisible by construction, not by oversight."
"memory-store|Claude-Code-Diors-Builds/memory|Sweep the memory store. Memory files never appear in a git diff, so nothing else surfaces them."
"content-conservation|git show |Ask what MOVED text still ASSERTS, not just that its filename resolves. A fold carries stale claims into a record, where they stop looking stale."
"hook-selftests|test\\.sh|Run the affected *.test.sh individually. An \`npm test\` total hides which case exercises your change — and whether it can still fail."
"generated-output|buildLegalPages|If a site source changed, rebuild public/. Nothing else regenerates it and a stale build ships silently."
)

# 🔴 SCOPED TO BASH COMMANDS — this hook POISONED ITSELF without it, and the failure was total.
# Measured 2026-08-06 09:31 EDT against the live 4 MB transcript: ALL FIVE angles read as "covered"
# on a session where most had never run. Two structural leaks, both unavoidable:
#   · this file's own SOURCE enters the transcript the moment anyone Writes or Reads it, and its
#     ANGLES array literally contains every detector string;
#   · the hook's own block message enters the transcript when it fires, and the demands quote
#     `~/.config/dior`, `git show`, `*.test.sh`, `buildLegalPages` by name.
# So a naive whole-transcript grep meant the gate SUPPRESSED EVERY ANGLE FOREVER after its first
# fire — a gate that switches itself off while continuing to run and report success. Exactly the
# class `records-close-check`'s dead `grep -qx` and the never-invoked self-tests belong to.
# Restricting to `"name":"Bash"` lines removes both leaks: a Write of this file is `"name":"Write"`,
# and the block message is not a tool_use at all. Two STREAMING passes, nothing read into memory.
# ⚠️ Residual, stated: searching FOR a string in a Bash command counts as having run that angle
# (`rg -n 'buildLegalPages'` reads as covered). That is the deliberate broad-detector trade-off —
# a false "covered" beats a gate that fires on everything and gets dismissed — and it is bounded
# noise, not the systematic self-suppression above.
if [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ]; then
  untaken=""
  for a in "${ANGLES[@]}"; do
    rest="${a#*|}"; det="${rest%%|*}"; demand="${rest#*|}"; id="${a%%|*}"
    rg '"name":"Bash"' "$TRANSCRIPT" 2>/dev/null | rg -q -e "$det" 2>/dev/null && continue
    untaken="$untaken
        · [$id] $demand"
  done
  [ -n "$untaken" ] && findings="$findings
  🧭 ANGLES NOT TAKEN — no tool call this session carries these checks' signature. This is the third
     prompt you would otherwise be given, computed instead of asked. Run them, or say plainly which
     are not applicable to this change and why:$untaken"
fi

# Stamped AFTER the work, so a crash mid-sweep re-runs instead of marking the state clean.
printf '%s' "$fingerprint" > "$STAMP" 2>/dev/null

[ -n "$findings" ] || exit 0
emit "$findings"
