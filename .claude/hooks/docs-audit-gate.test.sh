#!/bin/bash
# Proofs for docs-audit-gate.sh.
#
# The branches worth pinning are the FAILSAFES, not the happy path. This gate delegates everything to scripts/docs-audit.mjs, so the dangerous states are "the audit is gone" and "the audit crashed" — both of which a naive `exit 0` would render as a clean PR. Its own header says it: "a silent skip here would turn a deleted or crashing script into a permanent green." That claim was written down and never tested; this file tests it.
#
# Everything runs against a throwaway repo with a STUB docs-audit.mjs, so the real audit's current findings can never make this suite pass or fail by accident.

HOOK="$(cd "$(dirname "$0")" && pwd)/docs-audit-gate.sh"
pass=0; fail=0
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

mkrepo() { # $1 = name, $2 = stub body (empty = no audit script at all)
  local d="$TMP/$1"; mkdir -p "$d/scripts"
  git -C "$d" init --quiet -b main
  echo x > "$d/f.md"; git -C "$d" add f.md
  git -C "$d" -c user.email=t@t -c user.name=t commit --quiet -m init
  if [ -n "$2" ]; then printf '%s\n' "$2" > "$d/scripts/docs-audit.mjs"; fi
  echo "$d"
}
run() { local o; o=$(CLAUDE_PROJECT_DIR="$1" bash "$HOOK" main)
        [ -z "$o" ] && { echo SILENT; return; }
        printf '%s' "$o" | jq -r '.hookSpecificOutput.additionalContext // "SILENT"'; }
a() { local n="$1" needle="$2" want="$3" out; out="$(run "$4")"
  case "$out" in *"$needle"*) got=yes;; *) got=no;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1))
  else echo "  FAIL  $n (wanted $want for '$needle')"; echo "        got: [${out:0:160}]"; fail=$((fail+1)); fi; }

CLEAN=$(mkrepo clean   'console.log(JSON.stringify({errors:0,results:[],ledger:[]}))')
ERRS=$(mkrepo errs     'console.log(JSON.stringify({errors:2,results:[{severity:"ERROR",id:"xref",msg:"a dead path"},{severity:"WARN",id:"w",msg:"advisory"}],ledger:[]}))')
WARNS=$(mkrepo warns   'console.log(JSON.stringify({errors:0,results:[{severity:"WARN",id:"w",msg:"advisory only"}],ledger:[]}))')
CRASH=$(mkrepo crash   'process.stderr.write("ReferenceError: boom\n"); process.exit(1)')
# ⚠️ A HEALTHY audit that also writes to STDERR. `--json` makes stdout a contract, so the audit deliberately puts its human-readable notices (the chronicle-drift suppression line) on stderr. This gate captured with `2>&1`, which put that notice in front of the JSON — `jq -e .` failed and the gate announced "DOCS AUDIT CRASHED: nothing was verified" about an audit that ran perfectly. It did that on EVERY PR from 2026-08-06 00:20 EDT until 10:30 EDT, and none of the eight existing cases could see it: the crash fixture writes to stderr AND exits non-zero, so it never separated "wrote to stderr" from "actually failed". A false crash is worse than a missed check — it teaches everyone the gate is broken, so the one real crash reads as more noise.
NOISY=$(mkrepo noisy   'process.stderr.write("  · chronicle-drift SUPPRESSED: 2 of 2 pages behind\n"); console.log(JSON.stringify({errors:0,results:[],ledger:[]}))')
GONE=$(mkrepo gone     '')
NOREPO="$TMP/plain"; mkdir -p "$NOREPO"

echo "docs-audit-gate.sh — proofs"
a "clean audit is silent"          "DOCS AUDIT"          no  "$CLEAN"
a "errors gate the PR"               "DOCS AUDIT FAILED"   yes "$ERRS"
a "the error detail is included"   "a dead path"         yes "$ERRS"
# WARNs are advisory BY CONTRACT. Blocking on them is the fastest way to teach everyone to bypass the gate, which the hook's own comment says — so it is pinned rather than left to good intentions.
a "WARNs alone never gate"         "DOCS AUDIT"          no  "$WARNS"
# The two failsafes. These are the whole reason the file exists.
a "missing audit is REPORTED"      "CANNOT RUN"          yes "$GONE"
a "crashing audit is REPORTED"     "CRASHED"             yes "$CRASH"
a "crash output is surfaced"       "ReferenceError"      yes "$CRASH"
# The regression this suite could not see: stderr noise from a HEALTHY audit must not read as a crash.
a "stderr noise is NOT a crash"    "CRASHED"             no  "$NOISY"
a "and a clean noisy audit is silent" "SILENT"           yes "$NOISY"
# Fail-safe in the other direction: outside a repo it must do nothing rather than error.
a "non-repo directory is silent"   "DOCS AUDIT"          no  "$NOREPO"

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
