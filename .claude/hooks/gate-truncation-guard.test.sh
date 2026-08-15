#!/bin/bash
# Proofs for gate-truncation-guard.sh.
#
# The cases that matter are the SILENT ones. A guard that fires on every pipeline gets switched off,
# and this one deliberately allows the honest shape (redirect + read $? + slice the log), so the
# "does not fire" half is what keeps it usable rather than noise.

HOOK="$(cd "$(dirname "$0")" && pwd)/gate-truncation-guard.sh"
pass=0; fail=0

r() { printf '{"tool_input":{"command":%s}}' "$(printf '%s' "$1" | jq -Rs .)" | bash "$HOOK" \
      | jq -r '.hookSpecificOutput.additionalContext // "SILENT"' 2>/dev/null || echo SILENT; }
a() { local n="$1" want="$2" out got; out="$(r "$3")"
  case "$out" in SILENT|"") got=silent;; *) got=fires;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1))
  else echo "  FAIL  $n (want $want, got $got)"; fail=$((fail+1)); fi; }

echo "gate-truncation-guard.sh — proofs"
# The real failure this hook exists for, verbatim from the session that motivated it.
a "docs:audit piped to tail fires"        fires  'npm run docs:audit 2>&1 | tail -3'
a "npm test piped to tail fires"          fires  'npm test 2>&1 | tail -4'
a "docs:reflow piped to tail fires"       fires  'npm run docs:reflow 2>&1 | tail -2'
a "a test script piped to head fires"     fires  'node scripts/drawCost.test.js | head -5'
# The honest shape must stay silent, or the hook teaches people to avoid gates entirely.
a "redirect + \$? + slice is silent"      silent 'npm run docs:audit >/tmp/a.log 2>&1; echo "exit=$?"; tail -5 /tmp/a.log'
a "PIPESTATUS capture is silent"          silent 'npm test | tail -3; echo "${PIPESTATUS[0]}"'
a "gate with no truncation is silent"     silent 'npm run docs:audit'
a "non-gate piped to tail is silent"      silent 'git log --oneline | tail -3'
a "empty command is silent"               silent ''
# A gate whose output is filtered by rg is fine -- rg does not hide the ERROR block by position.
a "gate piped to rg is silent"            silent 'npm run docs:audit 2>&1 | rg ERRORS'

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
