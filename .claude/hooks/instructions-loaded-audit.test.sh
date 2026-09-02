#!/bin/bash
# Proofs for instructions-loaded-audit.sh.
#
# This hook's only job is to OBSERVE, so the properties that matter are the boring ones: it must never
# fail a session, it must never print to stdout (InstructionsLoaded discards output, and stray stdout
# is noise at best), and the line it writes must actually carry the two fields the whole measurement
# depends on — `load_reason` and `trigger_file_path`. A logger that silently drops those would produce
# a full-looking log that answers neither question, which is the exact vacuous-pass shape this repo
# keeps paying for.

HOOK="$(cd "$(dirname "$0")" && pwd)/instructions-loaded-audit.sh"
pass=0; fail=0
chk() { local n="$1" cond="$2"
  if [ "$cond" = ok ]; then echo "  PASS  $n"; pass=$((pass+1)); else echo "  FAIL  $n"; fail=$((fail+1)); fi; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
LOG="$TMP/il.jsonl"
export IL_AUDIT_LOG="$LOG"

echo "instructions-loaded-audit.sh — proofs"

# A real rule file so the bytes field has something true to report.
RULE="$TMP/fake-rule.md"
printf -- '---\npaths:\n  - "models/**"\n---\n# fake\n' > "$RULE"
RULEBYTES=$(wc -c < "$RULE" | tr -d ' ')

payload=$(jq -nc --arg f "$RULE" '{session_id:"s1",hook_event_name:"InstructionsLoaded",file_path:$f,memory_type:"Project",load_reason:"path_glob_match",globs:["models/**"],trigger_file_path:"/repo/models/GuildSettings.js"}')

out=$(printf '%s' "$payload" | bash "$HOOK"); rc=$?
chk "exits 0"                       "$([ "$rc" -eq 0 ] && echo ok)"
chk "prints NOTHING to stdout"      "$([ -z "$out" ] && echo ok)"
chk "wrote one line"                "$([ "$(wc -l < "$LOG" | tr -d ' ')" = 1 ] && echo ok)"
chk "line is valid JSON"            "$(jq -e . "$LOG" >/dev/null 2>&1 && echo ok)"

# The two fields the measurement lives or dies on.
chk "carries load_reason"           "$(jq -e '.load_reason=="path_glob_match"' "$LOG" >/dev/null 2>&1 && echo ok)"
chk "carries trigger_file_path"     "$(jq -e '.trigger_file_path=="/repo/models/GuildSettings.js"' "$LOG" >/dev/null 2>&1 && echo ok)"
chk "carries globs"                 "$(jq -e '.globs==["models/**"]' "$LOG" >/dev/null 2>&1 && echo ok)"

# bytes must be the REAL size — a hardcoded or zero value would make every cost figure fiction.
chk "records the file's real byte size" "$(jq -e --argjson b "$RULEBYTES" '.bytes==$b' "$LOG" >/dev/null 2>&1 && echo ok)"

# Appends rather than overwrites: "how many times did this file load" is the per-session-vs-per-read question.
printf '%s' "$payload" | bash "$HOOK" >/dev/null 2>&1
chk "appends (2 lines after 2 calls)" "$([ "$(wc -l < "$LOG" | tr -d ' ')" = 2 ] && echo ok)"

# Robustness: none of these may fail a session.
printf 'not json at all' | bash "$HOOK" >/dev/null 2>&1
chk "malformed JSON exits 0"        "$([ $? -eq 0 ] && echo ok)"
printf '' | bash "$HOOK" >/dev/null 2>&1
chk "empty stdin exits 0"           "$([ $? -eq 0 ] && echo ok)"
printf '{"file_path":"/nope/missing.md","load_reason":"session_start"}' | bash "$HOOK" >/dev/null 2>&1
chk "missing file exits 0"          "$([ $? -eq 0 ] && echo ok)"
chk "missing file records bytes 0"  "$(tail -1 "$LOG" | jq -e '.bytes==0' >/dev/null 2>&1 && echo ok)"

# --report must actually read the fields back. A reporter that renders an empty table on a full log is
# the failure this repo calls a vacuous pass, so assert real content, not merely exit 0.
rep=$(bash "$HOOK" --report 2>&1); rrc=$?
chk "--report exits 0"              "$([ "$rrc" -eq 0 ] && echo ok)"
case "$rep" in *path_glob_match*) r1=ok;; *) r1=no;; esac
chk "--report names the load_reason" "$r1"
case "$rep" in *"GuildSettings.js"*) r2=ok;; *) r2=no;; esac
chk "--report names the trigger file" "$r2"
case "$rep" in *ambiguous*) r3=ok;; *) r3=no;; esac
chk "--report warns that an empty result is ambiguous" "$r3"

# A missing log must say so rather than render an empty-but-confident report.
export IL_AUDIT_LOG="$TMP/nonexistent.jsonl"
rep2=$(bash "$HOOK" --report 2>&1)
case "$rep2" in *"has not fired"*) r4=ok;; *) r4=no;; esac
chk "--report distinguishes 'no log' from 'no loads'" "$r4"

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
