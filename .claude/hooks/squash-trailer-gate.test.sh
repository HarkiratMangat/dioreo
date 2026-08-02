#!/bin/bash
# Proofs for squash-trailer-gate.sh. Written when the gate was promoted from `ask` to `deny`
# (2026-08-02 16:44 EDT) — a gate that can now BLOCK a merge has to be proven not to block the
# legitimate spellings, or the first false deny gets it disabled and then nothing guards anything.
HOOK="$(cd "$(dirname "$0")" && pwd)/squash-trailer-gate.sh"
pass=0; fail=0

# A hook that decides nothing prints NOTHING, and `jq` on empty stdin also prints nothing — so the
# empty case has to be caught before jq or every silent pass reads as an empty string and fails.
d() { local o; o=$(printf '{"tool_input":{"command":%s}}' "$(printf '%s' "$1" | jq -Rs .)" | bash "$HOOK")
      [ -z "$o" ] && { echo silent; return; }
      printf '%s' "$o" | jq -r '.hookSpecificOutput.permissionDecision // "silent"'; }
a() { local n="$1" want="$2" got; got=$(d "$3")
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1))
  else echo "  FAIL  $n — wanted $want, got $got"; echo "        cmd: $3"; fail=$((fail+1)); fi; }

echo "squash-trailer-gate.sh — proofs"

# --- must DENY: a squash merge with no body of any kind ---
a "bare squash merge denied"          deny   "gh pr merge 67 --squash --delete-branch"
a "squash with no number denied"      deny   "gh pr merge --squash"
# The bypass that made this class of gate useless everywhere else in the repo.
a "rtk-wrapped squash denied"         deny   "rtk gh pr merge 67 --squash --delete-branch"
a "squash after && denied"            deny   "npm test && gh pr merge 67 --squash"
# --delete-branch contains the letters '-b'. It must NOT count as a body flag.
a "--delete-branch is not a body"     deny   "gh pr merge 67 --squash --delete-branch"

# --- must stay SILENT: every legitimate spelling of supplying a body ---
a "--body allowed"                    silent "gh pr merge 67 --squash --body 'text'"
a "--body= allowed"                   silent "gh pr merge 67 --squash --body='text'"
a "--body-file allowed"               silent "gh pr merge 67 --squash --body-file /tmp/b.txt"
a "-b allowed"                        silent "gh pr merge 67 --squash -b 'text'"
a "-F allowed"                        silent "gh pr merge 67 --squash -F /tmp/b.txt"

# --- must stay SILENT: not a squash merge at all ---
a "--merge is not squashed"           silent "gh pr merge 67 --merge"
a "--rebase is not squashed"          silent "gh pr merge 67 --rebase --delete-branch"
a "gh pr create untouched"            silent "gh pr create --base main --title x"
a "unrelated command untouched"       silent "git status"
a "empty command untouched"           silent ""

# --- the word 'squash' appearing in prose must not arm the gate on a non-merge command ---
a "prose mentioning squash is safe"   silent "echo 'remember to --squash next time'"

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
