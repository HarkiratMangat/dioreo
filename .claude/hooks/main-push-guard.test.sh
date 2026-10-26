#!/bin/bash
# Proofs for main-push-guard.sh — the ONLY hook in this repo that can actually block a tool call (it is the one script that exits 2; every other hook can only print). It shipped with no test at all on 2026-08-02 01:30 EDT, which is the wrong way round: the more a gate can do, the more it needs proving.
#
# Branch state is the hook's main input, so each case runs against a THROWAWAY git repo created here with a known branch name, pointed at by CLAUDE_PROJECT_DIR. Reading the real repo's branch would make the results depend on whatever branch the suite happens to run on — a test whose outcome moves with the environment is not a proof.

HOOK="$(cd "$(dirname "$0")" && pwd)/main-push-guard.sh"
pass=0; fail=0

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

mkrepo() { # $1 = branch name -> echoes the repo path
  local d="$TMP/$1"; mkdir -p "$d"
  git -C "$d" init --quiet -b "$1"
  git -C "$d" -c user.email=t@t -c user.name=t commit --quiet --allow-empty -m init
  echo "$d"
}
ON_MAIN=$(mkrepo main)
ON_FEAT=$(mkrepo feat-x)

# BLOCKED is exit 2. Anything else is "allowed through".
run() { # $1 = repo dir, $2 = command string
  printf '{"tool_input":{"command":%s}}' "$(printf '%s' "$2" | jq -Rs .)" \
    | CLAUDE_PROJECT_DIR="$1" bash "$HOOK" >/dev/null 2>&1
  echo $?
}
a() { # name, repo, command, expected: BLOCK|ALLOW
  local n="$1" dir="$2" cmd="$3" want="$4" rc got
  rc=$(run "$dir" "$cmd")
  [ "$rc" = "2" ] && got=BLOCK || got=ALLOW
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1))
  else echo "  FAIL  $n — wanted $want, got $got (exit $rc)"; echo "        cmd: $cmd"; fail=$((fail+1)); fi
}

echo "main-push-guard.sh — proofs"

# --- the core failure it was built for: a bare push while sitting on main ---
a "bare 'git push' on main blocks"        "$ON_MAIN" "git push"                          BLOCK
a "'git push -u origin main' blocks"      "$ON_MAIN" "git push -u origin main"           BLOCK

# --- the escape the FIRST version missed: an explicit refspec from a feature branch ---
a "HEAD:main from a branch blocks"        "$ON_FEAT" "git push origin HEAD:main"         BLOCK
a "sha:main from a branch blocks"         "$ON_FEAT" "git push origin abc1234:main"      BLOCK
a "'origin main' from a branch blocks"    "$ON_FEAT" "git push origin main"              BLOCK

# --- legitimate things that must NOT be blocked ---
a "pushing a feature branch is fine"      "$ON_FEAT" "git push -u origin feat/x"         ALLOW
a "--dry-run on main is fine"             "$ON_MAIN" "git push --dry-run"                ALLOW
a "release tag from main is fine"         "$ON_MAIN" "git push origin v2.49.2"           ALLOW
a "--tags from main is fine"              "$ON_MAIN" "git push --tags"                   ALLOW
a "non-push command is ignored"           "$ON_MAIN" "git status"                        ALLOW
a "'git pushd' is not a push"             "$ON_MAIN" "echo git pushing things"           ALLOW

# --- the FALSE POSITIVE that blocked real work, 2026-08-06 10:46 EDT --- Once a squash-merge deletes the working branch, HEAD lands back on main — and from that moment the guard denied EVERY push, including pushing a brand-new feature branch and including pushes aimed at a DIFFERENT REPOSITORY, where the project dir's branch says nothing about the operation. It blocked the dior-CLI PR minutes after this guard's own release merged. An explicit non-main destination ref disclaims main; a bare push does not, which is why the first case below must still BLOCK.
a "feature branch pushed FROM main is fine" "$ON_MAIN" "git push -u origin fix/some-branch"  ALLOW
a "another repo's push from main is fine"   "$ON_MAIN" "cd ~/.config/dior && git push -u origin fix/x" ALLOW
a "branch DELETE from main is fine"         "$ON_MAIN" "git push origin --delete old-branch"  ALLOW
a "short -d delete from main is fine"       "$ON_MAIN" "git push origin -d old-branch"        ALLOW
# ...and the deny path must survive all of that, or the fix has hollowed the guard out.
a "still blocks 'origin HEAD' on main"      "$ON_MAIN" "git push origin HEAD"                 BLOCK
a "still blocks the rtk-wrapped bare push"  "$ON_MAIN" "rtk git push"                         BLOCK
a "still blocks deleting main itself"       "$ON_MAIN" "git push origin --delete main"        BLOCK

# --- word boundary: 'main' must not match a branch that merely starts with it ---
a "pushing 'maintenance' is fine"         "$ON_FEAT" "git push origin maintenance"       ALLOW
a "pushing 'main-notes' is fine"          "$ON_FEAT" "git push origin main-notes"        ALLOW

# --- command position: a push hidden after a separator still counts ---
a "push after ';' on main blocks"         "$ON_MAIN" "cd /tmp; git push"                 BLOCK
a "push after '&&' on main blocks"        "$ON_MAIN" "npm test && git push"              BLOCK

# --- WRAPPER PREFIX. RTK.md documents that shell commands are transparently rewritten through
#     `rtk` ("git status -> rtk git status"). If a rewritten push ever reaches this hook, an
#     anchor of (^|[;&|] *) does NOT match `rtk git push` — the guard would silently pass the
#     exact command it exists to stop. Cheap to defend against, expensive to discover in the wild.
a "'rtk git push' on main blocks"         "$ON_MAIN" "rtk git push"                      BLOCK
a "'rtk git push origin main' blocks"     "$ON_FEAT" "rtk git push origin main"          BLOCK

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
