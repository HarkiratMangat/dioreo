#!/bin/bash
# Proofs for branch-discipline-guard.sh.
#
# This guard can BLOCK every Edit and Write in the session, so its false-positive surface matters
# more than its true-positive one: if it ever denies a legitimate write, it gets switched off and
# then nothing guards anything. Most of these cases are therefore "must stay silent".
#
# Throwaway repos with known branches, so the result never depends on the branch the suite runs on.

HOOK="$(cd "$(dirname "$0")" && pwd)/branch-discipline-guard.sh"
pass=0; fail=0
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

mkrepo() { # $1 = branch -> repo path with one tracked file `tracked.md` and one ignored file
  local d="$TMP/$1"; mkdir -p "$d"
  git -C "$d" init --quiet -b "$1"
  echo tracked > "$d/tracked.md"
  echo "ignored.md" > "$d/.gitignore"
  echo ignored > "$d/ignored.md"
  git -C "$d" add tracked.md .gitignore
  git -C "$d" -c user.email=t@t -c user.name=t commit --quiet -m init
  echo untracked > "$d/untracked.md"
  echo "$d"
}
MAIN=$(mkrepo main); MASTER=$(mkrepo master); FEAT=$(mkrepo feat-x)
NOREPO="$TMP/plain"; mkdir -p "$NOREPO"; echo hi > "$NOREPO/notes.md"

# A hook that decides nothing prints NOTHING, and `jq` on empty stdin also prints nothing — so the
# empty case has to be caught before jq or every silent pass reads as an empty string and fails.
decide() { local o="$1"; [ -z "$o" ] && { echo silent; return; }
           printf '%s' "$o" | jq -r '.hookSpecificOutput.permissionDecision // "silent"'; }
edit() { decide "$(printf '{"tool_name":"%s","tool_input":{"file_path":%s}}' "$1" "$(printf '%s' "$2" | jq -Rs .)" | bash "$HOOK")"; }
bash_() { decide "$(printf '{"tool_name":"Bash","tool_input":{"command":%s}}' "$(printf '%s' "$2" | jq -Rs .)" | CLAUDE_PROJECT_DIR="$1" bash "$HOOK")"; }
raw() { decide "$(printf '%s' "$1" | bash "$HOOK")"; }
chk() { local n="$1" want="$2" got="$3"
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1))
  else echo "  FAIL  $n — wanted $want, got $got"; fail=$((fail+1)); fi; }

echo "branch-discipline-guard.sh — proofs"

# --- Edit/Write on a protected branch: tracked files only ---
chk "Edit tracked file on main denied"    deny   "$(edit Edit  "$MAIN/tracked.md")"
chk "Write tracked file on main denied"   deny   "$(edit Write "$MAIN/tracked.md")"
chk "master is protected too"             deny   "$(edit Edit  "$MASTER/tracked.md")"

# --- the false-positive surface. Every one of these must stay silent. ---
chk "untracked file on main is fine"      silent "$(edit Write "$MAIN/untracked.md")"
chk "gitignored file on main is fine"     silent "$(edit Edit  "$MAIN/ignored.md")"
chk "brand-new file on main is fine"      silent "$(edit Write "$MAIN/does-not-exist-yet.md")"
chk "tracked file on a BRANCH is fine"    silent "$(edit Edit  "$FEAT/tracked.md")"
chk "file in no repo at all is fine"      silent "$(edit Edit  "$NOREPO/notes.md")"
chk "path in a missing dir is fine"       silent "$(edit Write "$TMP/nope/deep/x.md")"
chk "empty file_path is fine"             silent "$(raw '{"tool_name":"Edit","tool_input":{}}')"

# --- git commit on a protected branch ---
chk "git commit on main denied"           deny   "$(bash_ "$MAIN" "git commit -m 'x'")"
chk "git commit --amend on main denied"   deny   "$(bash_ "$MAIN" "git commit --amend --no-edit")"
chk "rtk-wrapped commit on main denied"   deny   "$(bash_ "$MAIN" "rtk git commit -m 'x'")"
chk "commit after && on main denied"      deny   "$(bash_ "$MAIN" "git add -A && git commit -m x")"
chk "commit on a feature branch is fine"  silent "$(bash_ "$FEAT" "git commit -m 'x'")"
chk "git status on main is fine"          silent "$(bash_ "$MAIN" "git status")"
chk "'commit' in prose is fine"           silent "$(bash_ "$MAIN" "echo we should commit later")"
chk "git commit-tree is not a commit"     silent "$(bash_ "$MAIN" "git commit-tree abc")"

# --- the deny must carry a remedy that FITS the case (2026-08-06) ---
# The block was always right; the remedy was not. Writing only to gitignored paths needs no commit at
# all, yet the message said "git switch -c" — which produces a branch for an empty commit and reads as
# "you needed a branch". A guard whose suggested fix is wrong for your situation teaches the wrong
# lesson, which is the same failure class as a guard that fires on correct input.
# `bash_` normalises to deny/silent via decide(); the MESSAGE needs the raw payload, so call the
# hook directly and pull permissionDecisionReason out of it.
remedy=$(printf '{"tool_name":"Bash","tool_input":{"command":"git commit -m x"}}' \
  | CLAUDE_PROJECT_DIR="$MAIN" bash "$HOOK" \
  | jq -r '.hookSpecificOutput.permissionDecisionReason // ""')
case "$remedy" in *"nothing TRACKED changed"*) r=yes;; *) r=no;; esac
if [ "$r" = yes ]; then echo "  PASS  deny names the gitignored-only escape"; pass=$((pass+1))
else echo "  FAIL  deny names the gitignored-only escape"; echo "        got: $remedy"; fail=$((fail+1)); fi
case "$remedy" in *"git status --porcelain"*) r=yes;; *) r=no;; esac
if [ "$r" = yes ]; then echo "  PASS  deny names the command that settles it"; pass=$((pass+1))
else echo "  FAIL  deny names the command that settles it"; fail=$((fail+1)); fi

# --- tools this guard must ignore entirely ---
chk "Read is never blocked"               silent "$(raw "$(printf '{"tool_name":"Read","tool_input":{"file_path":"%s"}}' "$MAIN/tracked.md")")"

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
