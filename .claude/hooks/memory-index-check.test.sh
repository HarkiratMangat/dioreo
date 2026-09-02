#!/bin/bash
# Proves every failure mode of memory-index-check.sh can actually fire.
#
# WHY: `npm run docs:audit:test` exists for exactly this reason - a guard that has only ever been seen to pass is not known to work. Twice on this project something was called "not checkable" when it was simply never checked. Run this after touching memory-index-check.sh.
#
#   bash .claude/hooks/memory-index-check.test.sh

CHECK="$(dirname "$0")/memory-index-check.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
pass=0; fail=0

# Build a minimal but VALID store: two active memories, one archived with a retirement header.
fixture() {
  rm -rf "$TMP/mem" "$TMP/state"
  mkdir -p "$TMP/mem/archive"
  echo "# alpha" > "$TMP/mem/alpha.md"
  echo "# beta"  > "$TMP/mem/beta.md"
  echo "RETIRED 2026-08-02 13:05 EDT - shipped and absorbed." > "$TMP/mem/archive/gone.md"
  cat > "$TMP/mem/MEMORY.md" <<'EOF'
- [Alpha](alpha.md) - a thing
- [Beta](beta.md) - another thing
EOF
}

run() { MEMCHECK_DIR="$TMP/mem" MEMCHECK_STATE="$TMP/state" MEMCHECK_BUDGET="${1:-16000}" bash "$CHECK"; }

# assert <name> <expect-substring> <should-be-present:yes|no>
assert() {
  local name="$1" needle="$2" want="${3:-yes}" out
  out="$(run "$BUDGET_OVERRIDE")"
  if [ "$want" = yes ]; then
    case "$out" in *"$needle"*) echo "  PASS  $name"; pass=$((pass+1));;
      *) echo "  FAIL  $name -- expected to see '$needle'"; echo "        got: $out"; fail=$((fail+1));; esac
  else
    case "$out" in *"$needle"*) echo "  FAIL  $name -- did NOT expect '$needle'"; echo "        got: $out"; fail=$((fail+1));;
      *) echo "  PASS  $name"; pass=$((pass+1));; esac
  fi
}

echo "memory-index-check.sh -- failure-mode proofs"

# 1. A valid store must report ok. If this fails, every other result is meaningless.
fixture; BUDGET_OVERRIDE=16000
assert "clean store reports ok"                 "MEMORY INDEX: ok"                   yes
assert "clean store reports no errors"          "ERRORS FOUND"                       no

# 2. Orphan - on disk, unreachable from the index.
fixture; echo "# orphan" > "$TMP/mem/orphan.md"
assert "orphan detected"                        "ORPHANS"                            yes

# 3. Dangling - indexed, file absent everywhere.
fixture; echo "- [Ghost](ghost.md) - nope" >> "$TMP/mem/MEMORY.md"
assert "dangling link detected"                 "DANGLING"                           yes

# 4. Index pointing INTO the archive - a distinct bug from a missing file, and must say so.
fixture; echo "- [Gone](gone.md) - archived" >> "$TMP/mem/MEMORY.md"
assert "link into archive/ detected"            "INDEX LINKS INTO archive/"          yes
assert "link into archive not mislabelled"      "DANGLING"                           no

# 5. Archived file with no retirement header.
fixture; echo "no header here" > "$TMP/mem/archive/gone.md"
assert "missing retirement header detected"     "ARCHIVED WITHOUT A RETIREMENT"      yes

# 6. Conservation - the store may only shrink THROUGH the archive.
fixture; run >/dev/null            # first run records total=3
rm "$TMP/mem/beta.md"              # deleted outright, not archived
sed -i.bak '/beta.md/d' "$TMP/mem/MEMORY.md" && rm -f "$TMP/mem/MEMORY.md.bak"
assert "outright deletion detected"             "CONSERVATION VIOLATION"             yes

# 7. Budget breach.
fixture; BUDGET_OVERRIDE=50
assert "over-budget detected"                   "over budget"                        yes
fixture; BUDGET_OVERRIDE=16000
assert "under-budget not flagged"               "over budget"                        no

# 7b. Approaching-budget advisory - added 2026-08-07 10:54 EDT. The fixture's MEMORY.md is exactly 64 bytes (verified: `printf -- '...' | wc -c`, not guessed). A budget of 70 puts the 90% threshold at 63 (70*90/100, integer division) - 64 > 63 fires the advisory while 64 <= 70 stays under budget, proving the advisory fires BEFORE the hard over-budget state, not only at/after it.
fixture; BUDGET_OVERRIDE=70
assert "approaching-budget advisory fires under budget" "APPROACHING BUDGET"          yes
assert "approaching-budget is not the over-budget error" "  BUDGET: MEMORY.md is"     no
fixture; BUDGET_OVERRIDE=16000
assert "comfortably under budget: no advisory"  "APPROACHING BUDGET"                 no

# 8. Wrong path / missing index - the canonical-path sanity test.
fixture; rm "$TMP/mem/MEMORY.md"
assert "missing MEMORY.md is FATAL"             "WRONG PATH"                         yes

echo
# ── the PLATFORM-TRUNCATION mitigation ──────────────────────────────────────── 🔴 THESE EXIST BECAUSE THE MITIGATION SHIPPED WITH A HAND-SIZED 2500-BYTE TAIL THAT THE INDEX OUTGREW. Measured 2026-09-01 16:0x EDT: the real index was 33,934B against a ~25,000B platform cap, so ~8,900B and 42 index lines never reached a session — while the block's own comment claimed "better than 2x margin" against a 1.2KB loss measured when the file was smaller. A margin computed once against a growing file is a constant with an expiry nobody wrote down. The second case is the one that would have caught it: it asserts the re-emitted set tracks the CUT rather than a size.
big_fixture() {
  rm -rf "$TMP/mem" "$TMP/state"; mkdir -p "$TMP/mem/archive"
  echo "# alpha" > "$TMP/mem/alpha.md"
  echo "RETIRED 2026-08-02 13:05 EDT - shipped and absorbed." > "$TMP/mem/archive/gone.md"
  : > "$TMP/mem/MEMORY.md"
  i=0
  while [ "$i" -lt 60 ]; do
    printf -- '- [Alpha](alpha.md) - padding entry %02d %s\n' "$i" \
      "$(printf 'x%.0s' $(seq 1 60))" >> "$TMP/mem/MEMORY.md"
    i=$((i+1))
  done
}
big_run() { MEMCHECK_DIR="$TMP/mem" MEMCHECK_STATE="$TMP/state" MEMCHECK_BUDGET=99999 \
            MEMCHECK_PLATFORM_CAP="$1" bash "$CHECK"; }

big_fixture
ctx="$(big_run 1500 | python3 -c 'import sys,json; print(json.load(sys.stdin)["hookSpecificOutput"]["additionalContext"])')"
case "$ctx" in
  *"READ THE WHOLE MEMORY INDEX"*) echo "  PASS  oversized index INSTRUCTS a full read, not only a warning"; pass=$((pass+1));;
  *) echo "  FAIL  oversized index INSTRUCTS a full read -- no read instruction emitted"; fail=$((fail+1));;
esac

n_all=$(grep -c '^- \[' "$TMP/mem/MEMORY.md")
n_emit=$(printf '%s\n' "$ctx" | grep -c '^- \[')
if [ "$n_emit" -gt 0 ] && [ "$n_emit" -lt "$n_all" ]; then
  echo "  PASS  re-emits only the lines past the cut ($n_emit of $n_all), never the whole index"; pass=$((pass+1))
else
  echo "  FAIL  re-emits only the lines past the cut -- got $n_emit of $n_all (a fixed size, or everything)"; fail=$((fail+1))
fi

# The load-bearing case: RAISE the cap and the re-emitted set must SHRINK. A fixed-size tail cannot pass this.
n_narrow=$(big_run 4000 | python3 -c 'import sys,json; print(json.load(sys.stdin)["hookSpecificOutput"]["additionalContext"])' | grep -c '^- \[')
if [ "$n_narrow" -lt "$n_emit" ]; then
  echo "  PASS  the re-emitted set TRACKS the cut ($n_emit at cap 1500 -> $n_narrow at cap 4000)"; pass=$((pass+1))
else
  echo "  FAIL  the re-emitted set tracks the cut -- $n_emit then $n_narrow; it is not derived from the overflow"; fail=$((fail+1))
fi

case "$(big_run 999999)" in
  *"READ THE WHOLE MEMORY INDEX"*) echo "  FAIL  mitigation stands down when the index fits -- it fired anyway"; fail=$((fail+1));;
  *) echo "  PASS  mitigation stands down when the index fits under the platform cap"; pass=$((pass+1));;
esac

# ── the LINE limit ─────────────────────────────────────────────────────────── 🔴 THIS IS THE VACUOUS PASS THE BYTE-ONLY GATE WOULD HAVE SHIPPED. The platform cuts at the first 200 lines OR 25KB, whichever comes FIRST, and until 2026-09-02 11:40 EDT this hook only ever measured bytes. The trap is that the remedy for the byte ceiling — shortening entries — walks the file toward the LINE ceiling, so the gate would go green at exactly the moment the fix succeeded while the tail silently stopped loading again. These cases use many SHORT lines: comfortably under any byte cap, far over the line cap. A byte-only implementation passes every one of them.
lines_fixture() {
  rm -rf "$TMP/mem" "$TMP/state"; mkdir -p "$TMP/mem/archive"
  echo "# alpha" > "$TMP/mem/alpha.md"
  echo "RETIRED 2026-08-02 13:05 EDT - shipped and absorbed." > "$TMP/mem/archive/gone.md"
  : > "$TMP/mem/MEMORY.md"
  i=0
  while [ "$i" -lt 250 ]; do
    printf -- '- [Alpha](alpha.md) - %03d\n' "$i" >> "$TMP/mem/MEMORY.md"
    i=$((i+1))
  done
}
# Cap set absurdly high so BYTES cannot possibly be the thing that fires.
lines_run() { MEMCHECK_DIR="$TMP/mem" MEMCHECK_STATE="$TMP/state" MEMCHECK_BUDGET=99999 \
              MEMCHECK_PLATFORM_CAP=9999999 MEMCHECK_PLATFORM_LINES="${1:-200}" bash "$CHECK"; }

lines_fixture
lctx="$(lines_run 200 | python3 -c 'import sys,json; print(json.load(sys.stdin)["hookSpecificOutput"]["additionalContext"])')"
lsize=$(wc -c < "$TMP/mem/MEMORY.md" | tr -d ' ')

case "$lctx" in
  *"READ THE WHOLE MEMORY INDEX"*) echo "  PASS  a 250-line index fires on LINES while only ${lsize}B (bytes never bind)"; pass=$((pass+1));;
  *) echo "  FAIL  a 250-line index fires on LINES -- byte-only gate, the tail drops silently"; fail=$((fail+1));;
esac
case "$lctx" in
  *"LINES (250 against a 200-line cap)"*) echo "  PASS  names LINES as the binding limit"; pass=$((pass+1));;
  *) echo "  FAIL  names LINES as the binding limit -- got no such phrase"; fail=$((fail+1));;
esac
# The re-emit must carry the lines past 200, not nothing and not everything.
n_lall=$(grep -c '^- \[' "$TMP/mem/MEMORY.md")
n_lemit=$(printf '%s\n' "$lctx" | grep -c '^- \[')
if [ "$n_lemit" -gt 0 ] && [ "$n_lemit" -lt "$n_lall" ]; then
  echo "  PASS  re-emits only the lines past the LINE cut ($n_lemit of $n_lall)"; pass=$((pass+1))
else
  echo "  FAIL  re-emits only the lines past the LINE cut -- got $n_lemit of $n_lall"; fail=$((fail+1))
fi
# Raise the line limit above the file and it must stand down entirely.
case "$(lines_run 999)" in
  *"READ THE WHOLE MEMORY INDEX"*) echo "  FAIL  line mitigation stands down when the index fits -- it fired anyway"; fail=$((fail+1));;
  *) echo "  PASS  line mitigation stands down when the index fits under the line cap"; pass=$((pass+1));;
esac
# And the advisory must fire BEFORE the breach, same contract as the byte tier: 190 lines against a 200-line cap is 95%, over the 90% line, and still under the cap.
lines_fixture
head -190 "$TMP/mem/MEMORY.md" > "$TMP/mem/MEMORY.tmp" && mv "$TMP/mem/MEMORY.tmp" "$TMP/mem/MEMORY.md"
adv="$(lines_run 200)"
case "$adv" in
  *"APPROACHING THE LINE LIMIT"*) echo "  PASS  line advisory fires at 190/200, before the breach"; pass=$((pass+1));;
  *) echo "  FAIL  line advisory fires at 190/200 -- no advisory emitted"; fail=$((fail+1));;
esac
case "$adv" in
  *"READ THE WHOLE MEMORY INDEX"*) echo "  FAIL  advisory must not be the breach -- the read instruction fired under the cap"; fail=$((fail+1));;
  *) echo "  PASS  the advisory is not the breach (no read instruction under the cap)"; pass=$((pass+1));;
esac

echo "  $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
