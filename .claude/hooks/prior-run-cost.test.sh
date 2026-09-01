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
says "it separates tool turns from mid-run prose" $f "3 ran a tool, 2 were mid-run prose"

# 🔴 THE DISCRIMINATION IS THE WHOLE POINT — a count that cannot come back non-zero, or cannot come back zero, answers nothing. Harkirat: "where do you draw the line between useful bytes that should be there vs pure useless narration?" These four cases ARE that line.
f=$work/hedge; { usermsg; tool; txt "Now let me check the fixture."; tool; txt "Summary."; } > $f
says "a HEDGE counts as carrying nothing"       $f "1 OF THOSE CARRIED NOTHING"
f=$work/ack;   { usermsg; tool; txt "Found it."; tool; txt "Summary."; } > $f
says "an ACKNOWLEDGEMENT counts as carrying nothing" $f "1 OF THOSE CARRIED NOTHING"
DUP="The geometry check disagreed with the fixture on the count only, which is the signature of an unfrozen clock rather than genuine drift."
f=$work/dup;   { usermsg; tool; txt "$DUP"; tool; txt "$DUP And nothing else changed."; } > $f
says "a DUPLICATE of the summary counts as carrying nothing" $f "1 OF THOSE CARRIED NOTHING"
f=$work/subst; { usermsg; tool; txt "The privacy appendix omits colorsVisibility, so the published policy is inaccurate about live collection."; tool; txt "Unrelated closing summary about branch state and gates."; } > $f
says "a SUBSTANTIVE checkpoint is counted as prose but NOT as carrying nothing" $f "0 OF THOSE CARRIED NOTHING"
f=$work/wait;  { usermsg; tool; txt "Suite running in the background; continuing on docs meanwhile."; tool; txt "Summary."; } > $f
says "his background-wait carve-out carries nothing against it" $f "0 OF THOSE CARRIED NOTHING"
says "it names the round-trip cost of a turn"   $f "round trip it costs"
says "it reports rather than advises"           $f "A number, not advice"
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
