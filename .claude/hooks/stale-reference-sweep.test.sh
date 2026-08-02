#!/bin/bash
# Proofs for stale-reference-sweep.sh — the backward-verification gate: you changed code, so the
# prose that DESCRIBES that code may have just become wrong.
#
# It is the noisiest gate in the directory by design, which makes its EXCLUSIONS the load-bearing
# part: generic names, short names, files already touched on the branch, the hooks directory
# itself, and memory files updated since the branch point. Every one of those exists because
# without it the report is unreadable, and an unreadable report gets dismissed. So most of this
# file tests what must NOT be reported.
#
# HOME is redirected because the memory path derives from it — otherwise the verdict would depend
# on the real memory store's mtimes and drift between runs.

HOOK="$(cd "$(dirname "$0")" && pwd)/stale-reference-sweep.sh"
pass=0; fail=0
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
MEMREL=".claude/projects/-Applications-Claude-Code-Diors-Builds/memory"

# $1 name · $2 file to change on the branch · $3 extra setup function name (optional)
mkrepo() {
  local d="$TMP/$1" home="$TMP/$1-home"
  mkdir -p "$d/docs" "$d/.claude/hooks" "$d/utils" "$home/$MEMREL"
  git -C "$d" init --quiet -b main
  # The code files whose names other prose may describe.
  echo "x" > "$d/utils/accentColor.js"
  echo "x" > "$d/utils/index.js"
  echo "x" > "$d/utils/db.js"
  echo "x" > "$d/.claude/hooks/somehook.sh"
  # Prose that references them. docs/guide.md is NOT touched by any branch below.
  printf 'the accentColor module does things\nindex handles routing\ndb is small\nsomehook guards\n' > "$d/docs/guide.md"
  printf 'CLAUDE describes accentColor too\n' > "$d/CLAUDE.md"
  echo seed > "$d/docs/plain.md"
  git -C "$d" add -A; git -C "$d" -c user.email=t@t -c user.name=t commit --quiet -m init
  git -C "$d" checkout --quiet -b feat
  sleep 1
  echo changed >> "$d/$2"
  shift 2
  for extra in "$@"; do echo changed >> "$d/$extra"; done
  git -C "$d" add -A; git -C "$d" -c user.email=t@t -c user.name=t commit --quiet -m change
  printf '%s\t%s' "$d" "$home"
}
run() { local d h; IFS=$'\t' read -r d h <<< "$1"
        local o; o=$(HOME="$h" CLAUDE_PROJECT_DIR="$d" bash "$HOOK" main)
        [ -z "$o" ] && { echo SILENT; return; }
        printf '%s' "$o" | jq -r '.hookSpecificOutput.additionalContext // "SILENT"'; }
a() { local n="$1" needle="$2" want="$3" out; out="$(run "$4")"
  case "$out" in *"$needle"*) got=yes;; *) got=no;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1))
  else echo "  FAIL  $n (wanted $want for '$needle')"; echo "        got: [${out:0:220}]"; fail=$((fail+1)); fi; }

echo "stale-reference-sweep.sh — proofs"

# --- the case it exists for ---
CODE=$(mkrepo c1 utils/accentColor.js)
a "changed code with stale prose fires" "STALE-REFERENCE SWEEP" yes "$CODE"
a "names the subject"                   "accentColor"           yes "$CODE"
a "names the describing file"           "docs/guide.md"         yes "$CODE"
a "CLAUDE.md is swept too"              "CLAUDE.md"             yes "$CODE"

# --- exclusions: each of these keeps the report readable ---
DOCSONLY=$(mkrepo c2 docs/plain.md)
a "docs-only branch is exempt"          "STALE-REFERENCE"       no  "$DOCSONLY"
GENERIC=$(mkrepo c3 utils/index.js)
a "generic name 'index' is skipped"     "STALE-REFERENCE"       no  "$GENERIC"
SHORT=$(mkrepo c4 utils/db.js)
a "short name 'db' is skipped"          "STALE-REFERENCE"       no  "$SHORT"
HOOKSELF=$(mkrepo c5 .claude/hooks/somehook.sh)
a "hooks dir never reports itself"      ".claude/hooks/"        no  "$HOOKSELF"
# The describing file was updated ON THIS BRANCH, so it was already considered.
SWEPT=$(mkrepo c6 utils/accentColor.js docs/guide.md CLAUDE.md)
a "prose updated on-branch is not flagged" "STALE-REFERENCE"    no  "$SWEPT"

# --- the memory mtime fallback: memory files can never appear in a git diff, so freshness is the
#     only signal. A memory written since the branch point counts as swept.
FRESHMEM=$(mkrepo c7 utils/accentColor.js)
IFS=$'\t' read -r _d _h <<< "$FRESHMEM"
printf 'accentColor is described here\n' > "$_h/$MEMREL/note.md"   # created after the branch commit
a "memory written this branch is swept" "memory/note.md"        no  "$FRESHMEM"

STALEMEM=$(mkrepo c8 utils/accentColor.js)
IFS=$'\t' read -r _d2 _h2 <<< "$STALEMEM"
printf 'accentColor is described here\n' > "$_h2/$MEMREL/old.md"
touch -t 202601010000 "$_h2/$MEMREL/old.md"                        # long before the branch point
a "an OLD memory file IS flagged"       "old.md"                yes "$STALEMEM"

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
