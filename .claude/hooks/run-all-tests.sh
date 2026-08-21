#!/bin/bash
# run-all-tests.sh — run every hook self-test, and report which hooks have none.
#
# WHY THIS EXISTS (2026-08-02 16:35 EDT)
# --------------------------------------
# Six hook self-tests existed and NOTHING RAN THEM. Measured: each of mcp-layer-check / memory-index-check / outstanding-not-filed / release-ready-check / rg-flag-guard / timestamp-check `.test.sh` was referenced by package.json, .github/workflows/ and .claude/settings.json a combined ZERO times. They ran only when someone hand-typed `bash <file>`, which in practice meant the session that wrote them and never again.
#
# That is the same failure already recorded twice in this repo: shellcheck sat installed and unrun for weeks while the bug it catches shipped, and usage-guard.mjs shipped with every Bash rule dead from line 2 and looked fine. A test that nothing invokes is not weaker than no test — it is worse, because it produces a documented belief that the behaviour is covered.
#
# Harkirat, 2026-08-02 16:32 EDT: *"i literally spent hours last session working on some of these gates and literally within the first few minutes of this session, they dont even seem to hold despite their 'tests'."* The tests were fine. Nothing was running them.
#
# TWO THINGS THIS ASSERTS, and the second is the one that will not go stale:
#   1. Every *.test.sh passes.
#   2. COVERAGE: every non-test hook script HAS a test. A suite that only runs the tests that happen to exist silently rewards deleting a test — the conservation flaw from feedback_not_checkable_is_usually_unexamined. Coverage is therefore computed from the hook scripts on disk, never from a hand-maintained list.
#
# UNTESTED_OK is the shrinking allowlist. It is deliberately NOT a config knob: adding a name to it is a visible admission in a diff, and the suite fails if a name in it no longer needs to be (i.e. a test appeared) so it cannot rot in the permissive direction.

cd "$(dirname "$0")" || exit 1

# Hooks with no test yet. REMOVE a name when you write its test — the suite fails if a listed hook turns out to have one, so this list can only shrink.
#
# ✅ EMPTY as of 2026-08-02 17:08 EDT: every hook in this directory has a self-test. It started that day with six named here and six hooks tested; writing the missing six found two live defects that had been invisible since the day they shipped —
#   · main-push-guard.sh passed `rtk git push` straight through (the documented normal spelling),
#     and it is the ONLY hook that can actually block anything;
#   · records-close-check.sh's memory branch used `find -newermt "@epoch"`, which BSD find cannot
#     parse, so it errored into /dev/null and the check fired on every PR regardless.
# Neither was findable by reading. Keep this list empty.
UNTESTED_OK=""

pass=0; fail=0; failed_names=""

echo "hook self-tests"
echo "─────────────────────────────────────────────"
shopt -s nullglob
tests=(*.test.sh)
if [ ${#tests[@]} -eq 0 ]; then
  echo "  ✗ no *.test.sh found at all — the suite cannot be vacuously green"
  exit 1
fi

# PARALLEL, added 2026-08-21 10:05 EDT, revised 2026-08-21 10:47 EDT. Measured serial: ~50.5s total, but 3 of the 28 tests (completeness-sweep, records-close-check, stale-reference-sweep — each an rg sweep over the real repo tree, repeated per test case) account for 64% of it (~32.4s) while the other 25 sum to ~18.1s. Each test already builds its own throwaway fixture via `mktemp -d` (verified by grepping every *.test.sh for a fixed, non-mktemp /tmp path before this change — none exist), so the 28 runs are independent and safe to run concurrently.
#
# Uses `xargs -P`, the same mechanism package.json's `check` script already uses for `node --check` — a first version hand-rolled a `jobs -r -p | wc -l` busy-poll scheduler here to work around bash 3.2 lacking `wait -n`, which code review correctly flagged as solving an already-solved problem: `xargs -P` needs no `wait -n`, adds no poll-loop CPU churn, and that same review caught that the poll loop's own `HOOK_TEST_JOBS=0` override deadlocked the suite forever (0 running jobs, gate condition `0 -ge 0` never opens). `xargs -P` doesn't have that failure mode, but JOBS is still clamped to a floor of 1 defensively — a bad/empty override should never be able to hang the suite silently.
JOBS="${HOOK_TEST_JOBS:-8}"
case "$JOBS" in ''|*[!0-9]*) JOBS=8;; esac
[ "$JOBS" -lt 1 ] && JOBS=1
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
export WORK="$work"

printf '%s\n' "${tests[@]}" | xargs -I{} -P "$JOBS" bash -c '
  bash "$1" >"$WORK/$1.out" 2>&1
  echo $? >"$WORK/$1.rc"
' _ {}

for t in "${tests[@]}"; do
  rc="$(cat "$work/$t.rc" 2>/dev/null || echo 1)"
  if [ "$rc" -eq 0 ]; then
    printf '  ✓ %s\n' "$t"
    pass=$((pass+1))
  else
    printf '  ✗ %s\n' "$t"
    sed 's/^/      /' "$work/$t.out"
    fail=$((fail+1)); failed_names="$failed_names $t"
  fi
done

echo
echo "coverage — every hook script must have a test"
echo "─────────────────────────────────────────────"
missing=""; unexpected=""
for f in *.sh; do
  case "$f" in *.test.sh|run-all-tests.sh) continue;; esac
  name="${f%.sh}"
  listed=no
  case " $UNTESTED_OK " in *" $name "*) listed=yes;; esac
  if [ -f "$name.test.sh" ]; then
    # A hook that HAS a test must not still be excused. This is the direction that rots.
    [ "$listed" = yes ] && unexpected="$unexpected $name"
  else
    if [ "$listed" = yes ]; then
      printf '  – %s (no test, known)\n' "$f"
    else
      printf '  ✗ %s has NO test and is not in UNTESTED_OK\n' "$f"
      missing="$missing $name"
    fi
  fi
done

rc=0
[ "$fail" -gt 0 ] && rc=1
if [ -n "$missing" ]; then
  echo
  echo "  A new hook shipped without a self-test:$missing"
  echo "  Write <name>.test.sh, or add the name to UNTESTED_OK with a reason in the commit."
  rc=1
fi
if [ -n "$unexpected" ]; then
  echo
  echo "  These are in UNTESTED_OK but DO have a test now:$unexpected"
  echo "  Remove them from the list — an allowlist that never shrinks stops meaning anything."
  rc=1
fi

echo
echo "  $pass passed, $fail failed$([ -n "$failed_names" ] && echo " ($failed_names )")"
exit $rc
