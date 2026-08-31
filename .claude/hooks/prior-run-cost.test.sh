#!/usr/bin/env bash
# prior-run-cost.test.sh — self-test for prior-run-cost.sh.
#
# ⚠️ THE CASES THAT CARRY WEIGHT ARE THE SILENT ONES. A report that fires on a clean run is noise at the START of every run, which is worse than noise at the end.
GATE="$(cd "$(dirname "$0")" && pwd)/prior-run-cost.sh"
pass=0; fail=0
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
usermsg() { printf '{"type":"user","message":{"role":"user","content":"go"}}\n'; }
attach() { printf '{"type":"user","message":{"role":"user","content":[{"type":"image"},{"type":"text","text":"look"}]}}\n'; }
result() { printf '{"type":"user","message":{"role":"user","content":[{"type":"tool_result","content":"x"}]}}\n'; }
tool() { printf '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Bash","input":{}}]}}\n'; }
txt() { printf '{"type":"assistant","message":{"content":[{"type":"text","text":"%s"}]}}\n' "$1"; }
run() { printf '{"transcript_path":"%s"}' "$1" | bash "$GATE"; }
silent() { if [ -z "$(run "$2")" ]; then echo "  ok  $1"; pass=$((pass+1)); else echo "  FAIL  $1 — fired: $(run "$2" | head -c 120)"; fail=$((fail+1)); fi; }
says() { o=$(run "$2" | jq -r '.hookSpecificOutput.additionalContext // ""'); if printf '%s' "$o" | grep -qF "$3"; then echo "  ok  $1"; pass=$((pass+1)); else echo "  FAIL  $1 — missing '$3': $o"; fail=$((fail+1)); fi; }

echo "prior-run-cost:"
# A clean run: tools, then ONE final summary. The summary is legitimate and must not be reported.
f=$work/clean; { usermsg; tool; tool; tool; txt "Done, here is the summary of what changed and why."; } > $f
silent "a clean run ending in one summary reports nothing" $f
f=$work/none;  { usermsg; tool; tool; } > $f
silent "a run with no prose at all reports nothing" $f
# Mid-run prose is the whole subject.
f=$work/dirty; { usermsg; tool; txt "Now let me check the next thing here."; tool; txt "And now this one too."; tool; txt "Final summary of the run."; } > $f
says "it counts turns, not messages"            $f "COST 6 TURNS"
says "it separates tool turns from prose turns" $f "3 ran a tool, 2 produced only prose"
says "it names the round-trip cost of a turn"   $f "round trip it costs"
says "it reports rather than advises"           $f "a number, not advice"
# It must measure the PREVIOUS run only, and an attachment must open a new one.
f=$work/prev; { usermsg; tool; txt "Now let me do a thing here mid-run."; tool; txt "Summary."; attach; tool; } > $f
silent "the run in progress is not reported — only a COMPLETED previous one that was dirty" $f
f=$work/prev2; { usermsg; tool; txt "Summary only."; usermsg; tool; txt "Now something mid-run."; tool; txt "Summary."; } > $f
says "a dirty PREVIOUS run is reported at the start of the next" $f "COST"
# tool_result carriers must never open a run.
f=$work/res; { usermsg; tool; result; txt "Summary."; } > $f
silent "a tool_result carrier does not open a new run" $f
echo "  $pass passed, $fail failed"
[ "$fail" -eq 0 ]
