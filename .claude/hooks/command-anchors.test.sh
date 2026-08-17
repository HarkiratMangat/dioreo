#!/bin/bash
# command-anchors.test.sh — a REGRESSION LOCK, not a unit test. It asserts a property of the whole enforcement layer rather than the behaviour of one script.
#
# WHY (2026-08-02 16:49 EDT) Every command gate in this repo decides whether to act by matching the command string against `(^|[;&|] *)<tool>` — "the command starts here, or right after a separator". That anchor has a hole: it does not match a WRAPPED invocation. RTK.md documents that shell commands are transparently rewritten through `rtk`, and `rtk --help` confirms `rtk git` and `rtk gh` are both real subcommands. So `rtk gh pr merge --squash` and `rtk git push` are normal spellings that NINE gate invocations silently ignored:
#
#   main-push-guard · squash-trailer-gate · release-ready-check · the four gh-pr-create
#   dispatchers (stale-reference-sweep, devlog-toc-check, records-close-check, docs-audit-gate)
#   · the three PostToolUse post-merge checks
#
# Proven, not assumed: main-push-guard.test.sh's `rtk git push` case failed against the old anchor and passes against the new one.
#
# A per-hook test cannot catch the NEXT gate someone adds with the naive anchor — only a scan of the whole layer can. This is the conservation-shaped check from feedback_not_checkable_is_usually_unexamined: derive the invariant, then assert it across the set.

cd "$(cd "$(dirname "$0")/../.." && pwd)" || exit 1
pass=0; fail=0

# Every occurrence of the separator anchor must be followed immediately by a wrapper-prefix group. Files scanned: the tracked settings file plus every hook script. Test files are excluded — they deliberately contain naive strings as fixtures.
targets=(.claude/settings.json)
while IFS= read -r f; do targets+=("$f"); done < <(find .claude/hooks -name '*.sh' ! -name '*.test.sh' | sort)

bad=""
for f in "${targets[@]}"; do
  # `(^|[;&|] *)` NOT followed by `(` — i.e. no wrapper-prefix alternation after the anchor.
  #
  # COMMENT LINES ARE EXCLUDED. Every hardened hook DOCUMENTS the old naive anchor in its header so the next reader understands what was wrong with it — and the first build of this scan then reported those explanations as violations. Same false-positive shape as the TS-EXAMPLE escape in timestamp-check.sh: a check that cannot tell an assertion from a quotation. Shell comments cannot execute, so skipping them loses no coverage.
  while IFS= read -r hit; do
    [ -n "$hit" ] && bad="$bad
    $f: $hit"
  done < <(grep -vE '^[[:space:]]*#' "$f" 2>/dev/null | grep -oE '\(\^\|\[;&\|\] \*\)[^(]' 2>/dev/null)
done

if [ -z "$bad" ]; then
  echo "  PASS  every (^|[;&|] *) anchor allows a wrapper prefix"; pass=$((pass+1))
else
  echo "  FAIL  a command gate uses the naive anchor and will miss 'rtk <cmd>':$bad"
  echo "        Fix: (^|[;&|] *)((rtk|sudo|command|nohup|time) +)*<tool>"
  fail=$((fail+1))
fi

# The wrapper list itself must stay consistent — a gate that accepts only some wrappers is a gate with a hole in the same shape as the one this file exists to close.
expected='(rtk|sudo|command|nohup|time'
n_ok=0
for f in "${targets[@]}"; do
  # `grep -c` exits 1 on zero matches, so `|| echo 0` APPENDS a second line and $c becomes "0\n0", which then fails `[ -gt ]` with "integer expression expected". Assign first, default after.
  c=$(grep -c -- "$expected" "$f" 2>/dev/null); c=${c:-0}
  [ "$c" -gt 0 ] 2>/dev/null && n_ok=$((n_ok+c))
done
if [ "$n_ok" -ge 8 ]; then
  echo "  PASS  $n_ok hardened anchors present"; pass=$((pass+1))
else
  echo "  FAIL  only $n_ok hardened anchors found — expected at least 8 (4 gh-pr-create, 4 gh-pr-merge)."
  echo "        A drop means a gate was rewritten back to the naive form, or deleted."
  fail=$((fail+1))
fi

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
