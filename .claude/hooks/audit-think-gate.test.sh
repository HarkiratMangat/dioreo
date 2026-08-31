#!/usr/bin/env bash
# audit-think-gate.test.sh — self-test for audit-think-gate.sh.
GATE="$(cd "$(dirname "$0")" && pwd)/audit-think-gate.sh"
pass=0; fail=0
run() { printf '{"prompt":"%s"}' "$1" | bash "$GATE"; }
fires() { if [ -n "$(run "$2")" ]; then echo "  ok  $1"; pass=$((pass+1)); else echo "  FAIL  $1"; fail=$((fail+1)); fi; }
silent() { if [ -z "$(run "$2")" ]; then echo "  ok  $1"; pass=$((pass+1)); else echo "  FAIL  $1 — fired on a non-audit prompt"; fail=$((fail+1)); fi; }
echo "audit-think-gate:"
fires   "an explicit audit request"            "run a harsh audit of the portal work"
fires   "a review request"                     "review this branch before we merge"
fires   "a verification request"               "verify the fixture is still current"
fires   "a falsification request"              "try to falsify the plan"
silent  "an ordinary build request"            "add a column to the season table"
silent  "an empty prompt"                      ""
# ANTI-VACUOUS: it must name the tool, or it is just a mood.
out=$(run "audit this")
for want in sequentialthinking MANDATORY falsify; do
  if printf '%s' "$out" | grep -qF "$want"; then echo "  ok  the reminder names '$want'"; pass=$((pass+1))
  else echo "  FAIL  the reminder omits '$want'"; fail=$((fail+1)); fi
done
echo "  $pass passed, $fail failed"
[ "$fail" -eq 0 ]
