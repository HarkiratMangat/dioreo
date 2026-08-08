#!/bin/bash
# Proofs for completeness-sweep.sh — passes 2 and 3 of the pre-PR audit.
#
# This hook makes three claims that are worthless if untrue, so each is pinned here:
#   (a) it DETECTS content that vanished in a delete/rename — the thing a reference check cannot see;
#   (b) it stays SILENT when the content survived, including across a rename (no invented data loss);
#   (c) its cost controls actually short-circuit — the stamp and the claim gate, in that order.
#
# ⚠️ (b) is the case that already failed once for real. The first live run reported 29 of 60 lines
# missing from a file whose bytes were IDENTICAL, because rg parsed a markdown bullet's leading `-`
# as a flag. A conservation checker that invents data loss is worse than none — it would train
# everyone to dismiss the one run that matters. That regression is pinned by the RENAME case below,
# whose fixture content deliberately starts with `- `.
#
# Run the hook the way the hook RUNS: a non-interactive shell. This machine aliases find->bfs and
# git->rtk interactively, which is how a BSD-find bug in another hook nearly escaped twice.

HOOK="$(cd "$(dirname "$0")" && pwd)/completeness-sweep.sh"
pass=0; fail=0
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

# $1 name · $2 what to do on the branch (delete|rename|edit|none)
mkrepo() {
  local d="$TMP/$1"
  mkdir -p "$d/docs"
  git -C "$d" init --quiet -b main
  # Lines start with "- " ON PURPOSE: that is the rg-leading-dash trap this suite exists to pin.
  printf '# Doc\n\n- a substantial content line long enough to clear the 45-char sampling floor\n- a second substantial content line that is also comfortably past the floor\n' > "$d/docs/subject.md"
  echo seed > "$d/docs/other.md"
  git -C "$d" add -A; git -C "$d" -c user.email=t@t -c user.name=t commit --quiet -m init
  git -C "$d" checkout --quiet -b feat
  case "$2" in
    delete) git -C "$d" rm -q "docs/subject.md" ;;
    rename) git -C "$d" mv "docs/subject.md" "docs/renamed.md" ;;
    edit)   echo "another line" >> "$d/docs/other.md" ;;
  esac
  git -C "$d" add -A; git -C "$d" -c user.email=t@t -c user.name=t commit --quiet -m change
  printf '%s' "$d"
}

run() { # $1 repo · $2 transcript ("" for none) · $3 mode
  CLAUDE_PROJECT_DIR="$1" bash "$HOOK" main "$2" "$3" 2>/dev/null \
    | jq -r '.reason // .hookSpecificOutput.additionalContext // "SILENT"' 2>/dev/null || echo SILENT
}
a() { local n="$1" needle="$2" want="$3" out="$4" got
  case "$out" in *"$needle"*) got=yes;; *) got=no;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1))
  else echo "  FAIL  $n (wanted $want for '$needle')"; echo "        got: [${out:0:220}]"; fail=$((fail+1)); fi; }

# ⚠️ EVERY angle fixture must contain at least ONE Bash tool_use entry that is IRRELEVANT to the
# angles. Since 2026-08-06 12:37 EDT a transcript with zero Bash entries reports "ANGLE DETECTION
# COULD NOT RUN" instead of listing angles — because "I cannot see the session" and "no angle was
# taken" are different answers and must not look alike. A fixture with no Bash calls therefore tests
# the unreadable path, not the detection path. The filler below is that one irrelevant call.
FILLER='{"type":"tool_use","name":"Bash","input":{"command":"git status --short"}}'

echo "completeness-sweep.sh — proofs"

# ⚠️ CAPTURE EACH FIXTURE'S OUTPUT ONCE, then assert against the variable — never call run() twice
# on the same repo. The stamp deliberately makes a second run on unchanged state SILENT, so a second
# call returns empty and every later assertion fails for a reason that has nothing to do with the
# behaviour under test. Three cases failed exactly this way on the suite's first run
# (2026-08-06 09:21 EDT); the cost control was working and the test was wrong.

# ---- (a) it detects content that actually vanished ----
DEL=$(mkrepo d1 delete); out_del=$(run "$DEL" "" pr)
a "deleted file's lost content is reported" "CONSERVATION" yes "$out_del"
a "names the file that lost it"             "docs/subject.md" yes "$out_del"

# ---- (b) it does NOT invent data loss ----
# A rename preserves every byte, so a correct checker is silent. This is the rg-leading-dash
# regression: without `-e`, every "- ..." line reads as missing and this fires on a clean move.
REN=$(mkrepo d2 rename)
a "rename that preserves content -> silent" "CONSERVATION" no "$(run "$REN" "" pr)"
EDIT=$(mkrepo d3 edit)
a "ordinary edit, nothing deleted -> silent" "CONSERVATION" no "$(run "$EDIT" "" pr)"

# ---- (c) cost controls ----
# The stamp: a second identical run must short-circuit. Proving it means the FIRST run reported and
# the SECOND is silent on unchanged state -- the property that keeps this off every message.
STAMP=$(mkrepo d4 delete)
first=$(run "$STAMP" "" pr)
a "first run on new state reports"     "CONSERVATION" yes "$first"
a "second run, unchanged state, silent" "CONSERVATION" no  "$(run "$STAMP" "" pr)"

# The claim gate: in stop mode with no completion claim in the transcript, silence regardless of
# findings. Without this the hook would fire on every assistant message and be disabled within a day.
CLAIM=$(mkrepo d5 delete)
tr_noclaim="$TMP/t-noclaim.jsonl"
printf '{"type":"assistant","message":{"content":[{"type":"text","text":"still working on it, next I will look at the parser"}]}}\n' > "$tr_noclaim"
a "stop mode, no completion claim -> silent" "CONSERVATION" no "$(run "$CLAIM" "$tr_noclaim" stop)"

CLAIM2=$(mkrepo d6 delete)
tr_claim="$TMP/t-claim.jsonl"
printf '{"type":"assistant","message":{"content":[{"type":"text","text":"All three jobs done and verified, no gaps remaining."},%s]}}\n' "$FILLER" > "$tr_claim"
out_claim=$(run "$CLAIM2" "$tr_claim" stop)
a "stop mode, completion claim -> fires"     "CONSERVATION" yes "$out_claim"

# ---- pass 3: the angle set difference ----
# That transcript contains no `config/dior`, so that angle must be reported as un-taken.
a "un-taken angle is reported"        "ANGLES NOT TAKEN" yes "$out_claim"
a "names the external-trees angle"    "external-trees"   yes "$out_claim"

# ...and an angle whose signature IS present must NOT be reported. This is the half that catches a
# detector matching nothing -- a registry where every angle always reports is a registry nobody reads.
CLAIM3=$(mkrepo d7 delete)
tr_ang="$TMP/t-angles.jsonl"
# ⚠️ Must be a real `"name":"Bash"` tool_use. This fixture used a plain `"type":"user"` line until
# 2026-08-06 09:33 EDT, and it passed only because detection was an unscoped whole-transcript grep —
# the very bug that let the gate suppress every angle after one fire. Once scoping landed, this case
# correctly began reporting the angle as un-taken and the assertion failed. The test was asserting
# the defect, which is exactly what the docs-only exemption did in the sibling sweep's suite.
printf '{"type":"assistant","message":{"content":[{"type":"text","text":"All done and verified."},{"type":"tool_use","name":"Bash","input":{"command":"rg -n zsh /Users/x/.config/dior/workspace.zsh"}}]}}\n' > "$tr_ang"
out_ang=$(run "$CLAIM3" "$tr_ang" stop)
a "covered angle is NOT reported"     "external-trees"   no  "$out_ang"
a "other angles still reported"       "memory-store"     yes "$out_ang"

# ---- 🔴 SELF-POISONING: the failure that made this gate switch itself off ----
# An angle's detector string appearing in PROSE — the hook's own block message, or this file's own
# source when someone Writes/Reads it — must NOT count as having run the angle. Measured against the
# live transcript 2026-08-06 09:31 EDT: a whole-transcript grep marked ALL FIVE angles covered on a
# session where most had never run, i.e. the gate suppressed itself permanently after one fire.
# Detection is scoped to `"name":"Bash"` lines; these two cases pin both directions of that.
POISON=$(mkrepo d8 delete)
tr_poison="$TMP/t-poison.jsonl"
# The detector string appears ONLY in assistant prose (exactly how the hook's own output arrives).
# ⚠️ The filler is a SEPARATE JSONL LINE, not another block in the same message. JSONL puts a whole
# assistant message on ONE line, so a Bash call sharing a message with the prose makes that line
# match `"name":"Bash"` and drags the prose through with it — which broke this test's own premise on
# the first run. Scoping to Bash lines excludes messages containing no tool call at all; it cannot
# separate prose from a command inside the SAME message. That limit is stated in the hook.
printf '{"type":"assistant","message":{"content":[{"type":"text","text":"All done. Remember to sweep ~/.config/dior for external references."}]}}\n%s\n' "$FILLER" > "$tr_poison"
out_poison=$(run "$POISON" "$tr_poison" stop)
a "detector in PROSE does not count as run" "external-trees" yes "$out_poison"

POISON2=$(mkrepo d9 delete)
tr_real="$TMP/t-real.jsonl"
# Same string, this time inside a real Bash tool_use — that DOES count.
printf '{"type":"assistant","message":{"content":[{"type":"text","text":"All done."},{"type":"tool_use","name":"Bash","input":{"command":"rg -n foo /Users/x/.config/dior/"}}]}}\n' > "$tr_real"
out_real=$(run "$POISON2" "$tr_real" stop)
a "detector in a Bash COMMAND does count"   "external-trees" no  "$out_real"

# ---- two bases: a v3 branch must not be diffed against main ----
# The Stop wiring passes a literal `main` because it fires long before any --base flag is typed. A
# branch cut from v3-pre-release diffed against main reports the entire v3 delta as "changed".
V3="$TMP/v3"
mkdir -p "$V3/docs"; git -C "$V3" init --quiet -b main
# ⚠️ Must clear the hook's 45-char sampling floor. A 4-char "base" line meant ZERO lines were
# sampled, so the conservation check correctly found nothing and this assertion failed against a
# fixture that could never have triggered it — a test that cannot fail for the right reason.
printf 'a base-branch content line comfortably past the forty-five character sampling floor\n' > "$V3/docs/a.md"
git -C "$V3" add -A; git -C "$V3" -c user.email=t@t -c user.name=t commit --quiet -m init
git -C "$V3" checkout --quiet -b v3-pre-release
printf 'a v3 line long enough to clear the forty-five character sampling floor here\n' > "$V3/docs/v3only.md"
git -C "$V3" add -A; git -C "$V3" -c user.email=t@t -c user.name=t commit --quiet -m v3
git -C "$V3" checkout --quiet -b feat/on-v3
git -C "$V3" rm -q docs/a.md
git -C "$V3" add -A; git -C "$V3" -c user.email=t@t -c user.name=t commit --quiet -m change
out_v3=$(run "$V3" "" pr)
# docs/v3only.md belongs to v3-pre-release, not to this branch. With the base wrongly resolved to
# main it would appear in the diff; with it correctly resolved to v3-pre-release it must not.
a "v3 branch is diffed against v3-pre-release" "v3only" no "$out_v3"
a "v3 branch still reports its OWN deletion"   "docs/a.md" yes "$out_v3"

# ---- 🔴 UNCOMMITTED WORK: the highest-likelihood miss in the whole design ----
# `$BASE...HEAD` sees committed history only, so a session that edits files and claims "done"
# WITHOUT COMMITTING produced an empty diff and total silence. That is the default state mid-session
# and precisely when a premature "done" is most likely. Found 2026-08-06 09:44 EDT by asking what the
# gate's PRECONDITIONS are, an angle neither earlier pass took.
UNC="$TMP/uncommitted"
mkdir -p "$UNC/docs"; git -C "$UNC" init --quiet -b main
printf 'a content line comfortably past the forty-five character sampling floor here\n' > "$UNC/docs/a.md"
git -C "$UNC" add -A; git -C "$UNC" -c user.email=t@t -c user.name=t commit --quiet -m init
git -C "$UNC" checkout --quiet -b feat
rm "$UNC/docs/a.md"          # deleted, NOT committed
out_unc=$(run "$UNC" "" pr)
a "uncommitted deletion is still swept" "CONSERVATION" yes "$out_unc"

# ---- 🔴 MISSING rg: must fail LOUD, never fabricate ----
# Without rg the conservation loop's `rg -q` fails for EVERY line, so a missing binary would report
# 100% data loss on every deleted file — a confident FABRICATED alarm, worse than silence because it
# trains dismissal. The sibling sweep guards this and CI proved it real (the ubuntu runner has no
# ripgrep); this hook shipped with the inverse of that bug.
NORG=$(mkrepo r1 delete)
out_norg=$(PATH="/usr/bin:/bin" CLAUDE_PROJECT_DIR="$NORG" bash "$HOOK" main "" pr 2>/dev/null \
           | jq -r '.hookSpecificOutput.additionalContext // "SILENT"' 2>/dev/null)
if command -v rg >/dev/null 2>&1 && ! PATH="/usr/bin:/bin" command -v rg >/dev/null 2>&1; then
  a "missing rg is REPORTED, not fabricated" "CANNOT RUN" yes "$out_norg"
  a "and it does NOT claim data loss"        "CONSERVATION" no  "$out_norg"
else
  echo "  SKIP  missing-rg case (rg is on the minimal PATH here, so it cannot be simulated)"
fi

# ---- the stamp must be SESSION-scoped, not repo-state-scoped ----
# It lives in .git/ and persists across sessions. Without the session in the fingerprint, a NEW
# session inheriting an unchanged repo got silence on its first claim — exactly when pass 3 is worth
# most, because a fresh session has taken zero angles.
SESS=$(mkrepo s1 delete)
tr_s1="$TMP/sess-one.jsonl"; tr_s2="$TMP/sess-two.jsonl"
printf '{"type":"assistant","message":{"content":[{"type":"text","text":"All done and verified."}]}}\n' > "$tr_s1"
cp "$tr_s1" "$tr_s2"
first_sess=$(run "$SESS" "$tr_s1" stop)
a "session 1 first claim reports"        "CONSERVATION" yes "$first_sess"
a "same session, same state -> silent"   "CONSERVATION" no  "$(run "$SESS" "$tr_s1" stop)"
a "NEW session, same state -> reports"   "CONSERVATION" yes "$(run "$SESS" "$tr_s2" stop)"

# ---- fail-safe ----
mkdir -p "$TMP/plain"
a "non-repo directory is silent" "COMPLETENESS SWEEP" no "$(run "$TMP/plain" "" pr)"


# ══ PASSES 4 & 5 — change-shaped demands + the derivation requirement ══════════════════════════════
# These exist because pass 3's registry asks the SAME question every session. Each proof below pins a
# demand to the property that triggers it, and — just as importantly — pins that it stays QUIET when
# that property is absent. A demand that fires on everything is the failure mode four hooks here warn
# about, so the negative cases are the load-bearing half.

# $1 name · $2.. relative paths to create+modify on the branch
mkfiles() {
  local d="$TMP/$1"; shift
  mkdir -p "$d"; git -C "$d" init --quiet -b main
  echo seed > "$d/seed.txt"
  git -C "$d" add -A; git -C "$d" -c user.email=t@t -c user.name=t commit --quiet -m init
  git -C "$d" checkout --quiet -b feat
  local f
  for f in "$@"; do mkdir -p "$d/$(dirname "$f")"; printf 'a substantial content line for %s\n' "$f" > "$d/$f"; done
  git -C "$d" add -A; git -C "$d" -c user.email=t@t -c user.name=t commit --quiet -m change
  printf '%s' "$d"
}

TR="$TMP/derive-absent.jsonl"
printf '%s\n' "$FILLER" > "$TR"
TR_OK="$TMP/derive-present.jsonl"
{ printf '%s\n' "$FILLER"
  printf '{"type":"tool_use","name":"mcp__sequential-thinking__sequentialthinking","input":{"thought":"x"}}\n'; } > "$TR_OK"

# ---- scope conservation: a tracking list changed => account for the closed item's whole scope ----
out=$(run "$(mkfiles scope docs/db-deferred-list.md)" "$TR" pr)
a "tracking-list change demands SCOPE CONSERVATION" "SCOPE CONSERVATION" yes "$out"

# ---- ...and does NOT demand it for an unrelated file ----
out=$(run "$(mkfiles noscope docs/other.md)" "$TR" pr)
a "unrelated change does not demand scope conservation" "SCOPE CONSERVATION" no "$out"

# ---- bulk transform => name the downstream heuristics ----
many=$(for i in $(seq 1 16); do printf 'docs/f%s.md ' "$i"; done)
# shellcheck disable=SC2086
out=$(run "$(mkfiles bulk $many)" "$TR" pr)
a "16-file change demands DOWNSTREAM HEURISTICS" "DOWNSTREAM HEURISTICS" yes "$out"

# ---- a migration/reflow script alone is enough, even with few files ----
out=$(run "$(mkfiles script scripts/reflow-thing.mjs)" "$TR" pr)
a "a reflow script demands DOWNSTREAM HEURISTICS" "DOWNSTREAM HEURISTICS" yes "$out"

# ---- new enforcement => prove it can fail ----
out=$(run "$(mkfiles hooky .claude/hooks/new-guard.sh)" "$TR" pr)
a "a new hook demands NEW ENFORCEMENT proof" "NEW ENFORCEMENT" yes "$out"

# ---- a parsed file => run the parser across the change ----
out=$(run "$(mkfiles parsed docs/ideas/diors-notes.md)" "$TR" pr)
a "notes-file change demands PARSED BY SOMETHING" "PARSED BY SOMETHING" yes "$out"

# ---- derivation: demanded on a wide change when no derivation ran ----
# shellcheck disable=SC2086
out=$(run "$(mkfiles wide $many)" "$TR" pr)
a "wide change demands DERIVE THE ANGLES" "DERIVE THE ANGLES" yes "$out"

# ---- ...and is SATISFIED when the transcript carries a real sequential-thinking tool_use ----
# shellcheck disable=SC2086
out=$(run "$(mkfiles wideok $many)" "$TR_OK" pr)
a "a real derivation satisfies the demand" "DERIVE THE ANGLES" no "$out"

# ---- ...and a trivial change never triggers it (this is what stops it firing on everything) ----
out=$(run "$(mkfiles tiny docs/one.md)" "$TR" pr)
a "a 1-file change does NOT demand derivation" "DERIVE THE ANGLES" no "$out"

# ---- SELF-POISONING GUARD: writing this hook's own source must not count as a derivation ----
TR_WRITE="$TMP/derive-write.jsonl"
{ printf '%s\n' "$FILLER"
  printf '{"type":"tool_use","name":"Write","input":{"file_path":"x.sh","content":"rg -c sequential-thinking__sequentialthinking"}}\n'; } > "$TR_WRITE"
# shellcheck disable=SC2086
out=$(run "$(mkfiles poison $many)" "$TR_WRITE" pr)
a "a Write containing the detector does NOT count as derivation" "DERIVE THE ANGLES" yes "$out"

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
