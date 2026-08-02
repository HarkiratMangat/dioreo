#!/bin/bash
# Proofs for devlog-toc-check.sh.
#
# Two things matter here and neither had been tested:
#   1. THE TRIGGER. It only fires when docs/DEVLOG.md is in the branch diff. If that comparison is
#      wrong the gate is dead, and a dead gate looks exactly like a clean PR.
#   2. THE FAILSAFES. It delegates the TOC rule to scripts/docs-audit.mjs so there is one
#      implementation — but its header notes that delegation "replaced a working standalone check
#      with a single point of failure", and that a missing or throwing audit must be REPORTED
#      rather than skipped. That is asserted here rather than trusted.
#
# A stub audit is used so the real DEVLOG's current state cannot make this pass or fail by accident.

HOOK="$(cd "$(dirname "$0")" && pwd)/devlog-toc-check.sh"
pass=0; fail=0
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

# $1 name, $2 stub body ('' = no audit script), $3 = file to change on the branch
mkrepo() {
  local d="$TMP/$1"; mkdir -p "$d/scripts" "$d/docs"
  git -C "$d" init --quiet -b main
  echo seed > "$d/docs/DEVLOG.md"; echo seed > "$d/docs/other.md"
  git -C "$d" add -A; git -C "$d" -c user.email=t@t -c user.name=t commit --quiet -m init
  git -C "$d" checkout --quiet -b feat
  echo changed >> "$d/$3"
  [ -n "$2" ] && printf '%s\n' "$2" > "$d/scripts/docs-audit.mjs"
  git -C "$d" add -A; git -C "$d" -c user.email=t@t -c user.name=t commit --quiet -m change
  echo "$d"
}
run() { local o; o=$(CLAUDE_PROJECT_DIR="$1" bash "$HOOK" main)
        [ -z "$o" ] && { echo SILENT; return; }
        printf '%s' "$o" | jq -r '.hookSpecificOutput.additionalContext // "SILENT"'; }
a() { local n="$1" needle="$2" want="$3" out; out="$(run "$4")"
  case "$out" in *"$needle"*) got=yes;; *) got=no;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1))
  else echo "  FAIL  $n (wanted $want for '$needle')"; echo "        got: [${out:0:160}]"; fail=$((fail+1)); fi; }

OK=$(mkrepo ok       'console.log(JSON.stringify({results:[]}))'                                              docs/DEVLOG.md)
DRIFT=$(mkrepo drift 'console.log(JSON.stringify({results:[{msg:"TOC line 12 does not match its heading"}]}))' docs/DEVLOG.md)
OTHER=$(mkrepo other 'console.log(JSON.stringify({results:[{msg:"TOC line 12 does not match its heading"}]}))' docs/other.md)
CRASH=$(mkrepo crash 'process.stderr.write("SyntaxError: bad\n"); process.exit(1)'                             docs/DEVLOG.md)
GONE=$(mkrepo gone   ''                                                                                       docs/DEVLOG.md)

echo "devlog-toc-check.sh — proofs"
# THE TRIGGER — the half that silently dies. The `other` fixture has drift waiting in the stub, so
# a pass here proves the trigger gated it, not that there was nothing to find.
a "DEVLOG untouched -> silent"       "DEVLOG TOC"     no  "$OTHER"
a "DEVLOG touched + clean -> silent" "DEVLOG TOC"     no  "$OK"
a "DEVLOG touched + drift -> asks"   "OUT OF SYNC"    yes "$DRIFT"
a "the finding is quoted"            "does not match" yes "$DRIFT"
# THE FAILSAFES — a broken audit must never read as a clean one.
a "missing audit is REPORTED"        "CANNOT RUN"     yes "$GONE"
a "crashing audit is REPORTED"       "CANNOT RUN"     yes "$CRASH"
a "crash output is surfaced"         "SyntaxError"    yes "$CRASH"

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
