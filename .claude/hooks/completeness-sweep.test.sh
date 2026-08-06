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
printf '{"type":"assistant","message":{"content":[{"type":"text","text":"All three jobs done and verified, no gaps remaining."}]}}\n' > "$tr_claim"
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
printf '{"type":"assistant","message":{"content":[{"type":"text","text":"All done and verified."}]}}\n{"type":"user","content":"rg over /Users/x/.config/dior/workspace.zsh"}\n' > "$tr_ang"
out_ang=$(run "$CLAIM3" "$tr_ang" stop)
a "covered angle is NOT reported"     "external-trees"   no  "$out_ang"
a "other angles still reported"       "memory-store"     yes "$out_ang"

# ---- fail-safe ----
mkdir -p "$TMP/plain"
a "non-repo directory is silent" "COMPLETENESS SWEEP" no "$(run "$TMP/plain" "" pr)"

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
