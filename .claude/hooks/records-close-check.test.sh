#!/bin/bash
# Proofs for records-close-check.sh — the gate for the two chore-checklist items CI cannot see:
# (7) the notes file still has open intake, and (6) rules changed with nothing written to memory.
#
# Both were once written off as "NOT checkable", and the hook's own message says so. A claim like
# that is exactly what has to be pinned, because if the check quietly stops working it reverts to
# being un-checkable in practice while still reading as covered.
#
# HOME is redirected at the fixture, because the memory store path is derived from $HOME. Without
# that the suite would read the real memory directory and its verdict would change depending on
# whether this session happened to write a memory — a test whose result moves with the environment
# proves nothing.

HOOK="$(cd "$(dirname "$0")" && pwd)/records-close-check.sh"
pass=0; fail=0
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
MEMREL=".claude/projects/-Applications-Claude-Code-Diors-Builds/memory"

# $1 name · $2 open-notes-items(yes/no) · $3 file changed on branch · $4 memory state
#   $4: none | fresh | archive-only
mkrepo() {
  local d="$TMP/$1" home="$TMP/$1-home"
  mkdir -p "$d/docs" "$d/.claude/hooks" "$home/$MEMREL/archive"
  git -C "$d" init --quiet -b main
  if [ "$2" = yes ]; then
    printf '## Questions\n- an open intake item\n- another open item\n## 📍 pointer\n' > "$d/docs/diors-builds notes.md"
  else
    printf '## Questions\n## 📍 pointer\n' > "$d/docs/diors-builds notes.md"
  fi
  echo seed > "$d/docs/other.md"; echo seed > "$d/.claude/hooks/thing.sh"
  git -C "$d" add -A; git -C "$d" -c user.email=t@t -c user.name=t commit --quiet -m init
  git -C "$d" checkout --quiet -b feat
  sleep 1
  echo changed >> "$d/$3"
  git -C "$d" add -A; git -C "$d" -c user.email=t@t -c user.name=t commit --quiet -m change
  # Memory files are created AFTER the branch commit so their mtime is later than the branch point.
  case "$4" in
    fresh)        echo m > "$home/$MEMREL/a_memory.md" ;;
    archive-only) echo m > "$home/$MEMREL/archive/retired.md" ;;
  esac
  printf '%s\t%s' "$d" "$home"
}
run() { local d h; IFS=$'\t' read -r d h <<< "$1"
        local o; o=$(HOME="$h" CLAUDE_PROJECT_DIR="$d" bash "$HOOK" main)
        [ -z "$o" ] && { echo SILENT; return; }
        printf '%s' "$o" | jq -r '.hookSpecificOutput.permissionDecisionReason // "SILENT"'; }
a() { local n="$1" needle="$2" want="$3" out; out="$(run "$4")"
  case "$out" in *"$needle"*) got=yes;; *) got=no;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1))
  else echo "  FAIL  $n (wanted $want for '$needle')"; echo "        got: [${out:0:200}]"; fail=$((fail+1)); fi; }

echo "records-close-check.sh — proofs"

# ---- (7) the notes file ----
OPEN_UNTOUCHED=$(mkrepo n1 yes docs/other.md fresh)
a "open notes + untouched -> fires"  "(7) NOTES FILE" yes "$OPEN_UNTOUCHED"
a "the open items are previewed"     "an open intake item" yes "$OPEN_UNTOUCHED"
OPEN_TOUCHED=$(mkrepo n2 yes "docs/diors-builds notes.md" fresh)
a "open notes + touched -> silent"   "(7) NOTES FILE" no  "$OPEN_TOUCHED"
NO_OPEN=$(mkrepo n3 no docs/other.md fresh)
a "no open notes -> silent"          "(7) NOTES FILE" no  "$NO_OPEN"

# ---- (6) memory vs rule changes ----
RULE_NOMEM=$(mkrepo m1 no .claude/hooks/thing.sh none)
a "rule change, no memory -> fires"  "(6) MEMORY"     yes "$RULE_NOMEM"
a "names the changed rule file"      "thing.sh"       yes "$RULE_NOMEM"
RULE_MEM=$(mkrepo m2 no .claude/hooks/thing.sh fresh)
a "rule change + fresh memory -> ok" "(6) MEMORY"     no  "$RULE_MEM"
NORULE=$(mkrepo m3 no docs/other.md none)
a "no rule change -> no memory demand" "(6) MEMORY"   no  "$NORULE"
# The -maxdepth 1 claim in the hook: editing a RETIRED memory must not satisfy the check. Retired
# memories are frozen records, so touching one proves no standing rule was written down.
ARCHIVE_ONLY=$(mkrepo m4 no .claude/hooks/thing.sh archive-only)
a "archive-only memory does NOT satisfy" "(6) MEMORY" yes "$ARCHIVE_ONLY"

# ---- fail-safe ----
mkdir -p "$TMP/plain"
a "non-repo directory is silent"     "RECORDS NOT CLOSED" no "$(printf '%s\t%s' "$TMP/plain" "$TMP")"

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
