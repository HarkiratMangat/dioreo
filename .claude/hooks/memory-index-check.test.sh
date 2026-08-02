#!/bin/bash
# Proves every failure mode of memory-index-check.sh can actually fire.
#
# WHY: `npm run docs:audit:test` exists for exactly this reason - a guard that has only ever been seen
# to pass is not known to work. Twice on this project something was called "not checkable" when it was
# simply never checked. Run this after touching memory-index-check.sh.
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

# 8. Wrong path / missing index - the canonical-path sanity test.
fixture; rm "$TMP/mem/MEMORY.md"
assert "missing MEMORY.md is FATAL"             "WRONG PATH"                         yes

echo
echo "  $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
