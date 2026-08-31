#!/usr/bin/env bash
# turn-shape-guard.sh — Stop hook. Non-blocking. Reports the clauses of Harkirat's working-style prompt that a Stop event can actually see: narration between tool calls, a blocking question left in prose, and a sustained one-at-a-time run.
#
# 🔴 REBUILT TWICE ON 2026-08-31. Read this before changing a threshold.
# ------------------------------------------------------------------------------------------
# V1 fired on nearly every turn, and HARDEST ON THE COMPLIANT ONES: `$firstTool` defaulted to 999 on a message with no tool calls, so every text-only message scored as narration — and this is a Stop hook, so the last message of a well-formed turn is exactly the ONE STRUCTURED SUMMARY the contract demands. It also fired on a prose answer, on a turn correctly blocked awaiting push approval, and on the framing before an AskUserQuestion. Three shapes the contract REQUIRES.
#
# V2 (mine, an hour later) "fixed" that by requiring the text to sit before a tool call IN THE SAME MESSAGE, with a 140-character floor. Measured against 40 real transcripts: it matched 0 of 13,922 tool-carrying messages. THE SHAPE DOES NOT EXIST — in this transcript format text and tool calls are always separate assistant messages. The suite still went 21/21, because every fixture was synthetic.
#
# 🔴 THE TWO LESSONS, both of which invert what V1 and V2 assumed:
# 1. A HIGH FIRE RATE IS NOT NOISE IF THE FIRINGS ARE TRUE. "A good alert is a rare alert" comes from monitoring, where alerts compete for a human's scarce attention. The reader here is Claude, and the rate IS the finding — measured, narration occurs in 45% of real turns and every sampled match was a genuine violation ("Now lets extend the test file...", "Now I have everything needed. Let me make the three edits."). Tuning for rarity was optimising the wrong variable, and it is what produced a 140-char floor that excluded the true positives.
# 2. LENGTH IS NOT THE DISCRIMINATOR IN EITHER DIRECTION, AND POSITION IS. V2 required long text; my first correction required SHORT text, on the theory that "Found it." is narration while a 400-char block carries information. Harkirat falsified that with a screenshot of a real session: page-long structured blocks, tables included, sitting between tool calls all morning. Measured across 3,775 real instances, they run from 13 to 7,869 characters with a median of 128 and mass in EVERY band — so any length filter, set either way, discards real violations. THE RULE IS NOW PURELY POSITIONAL: a text-only message with more tool calls after it is mid-turn commentary, whatever it says and however long it is. No regex, no length bound, no tunable constant. The only carve-outs are the two Harkirat states himself: a note while waiting on a long background task, and the framing immediately before an AskUserQuestion popup.
#
# 3. ONE BINARY TRIGGER IS STILL WRONG, because narration is SITUATION-DEPENDENT. Position detects a candidate; it cannot judge one. A single substantive checkpoint halfway through a long autonomous run is legitimate; the same message repeated after every tool call is running commentary. So each mid-turn block is now classified on FOUR independent signals and only the ones that classify are reported: HEDGE (opens by pre-registering intent), ACK (contentless acknowledgement), DUPLICATE (its own distinctive words already appear in the turn final summary, so it will be said twice), and CADENCE (narration keeping pace 1:1 with tool calls). A block that is none of these stays silent - that is the legitimate checkpoint, and treating it identically to a hedge is what made the earlier versions feel like friction rather than help.
#
# 4. THE REAL TEST IS REDUNDANCY AND IMPORTANCE, WHICH ONLY THE SESSION CAN APPLY. Harkirat framing: is this important enough to say right now, or can it wait for the checkpoint summary - and will it be repeated in that summary anyway, making it bloat paid for twice? DUPLICATE approximates that mechanically by comparing word overlap with the final message; the warning also asks the question outright, because a guard that only reports a count teaches silence, and the goal is compliance.
#
# 5. THE SCALE, so the number in the warning means something: 3,775 instances across 615 real turns, a mean of 6.1 per turn against a contract of zero, present in 76.6% of turns.
#
# WHAT LIVES ELSEWHERE, because a Stop hook is a post-mortem and cannot change the turn it measures:
#   · Multiple edits to one file -> `batch-edit-guard.sh`, PreToolUse, fires at the second edit while the rest can still be collapsed.
#   · sequentialthinking mandatory on an audit/review -> `audit-think-gate.sh`, UserPromptSubmit, fires before the work starts.
# Asking which EVENT each clause wants is the question V1 and V2 never asked; forcing all of them into one Stop hook is most of why it was useless.
#
# WHY NON-BLOCKING. Harkirat: "a gate is better than advisory but i dont want it denying things."
#
# WHAT IT STILL CANNOT SEE, stated rather than hidden. Intent. A long singleton run of genuinely dependent calls looks identical, from outside the transcript, to an avoidable one — which is why that rule is set at a MEASURED extreme (40, ~15% of 615 real turns) rather than at a number picked from one screenshot, and why it names a real serial dependency as a legitimate answer. It also cannot see "finish the work": the absence of stopping has no shape in what ran.

set -uo pipefail
input=$(cat)
active=$(printf '%s' "$input" | jq -r '.stop_hook_active // false' 2>/dev/null)
[ "$active" = "true" ] && exit 0
tp=$(printf '%s' "$input" | jq -r '.transcript_path // empty' 2>/dev/null)
[ -f "$tp" ] || exit 0

# 🔴 A TURN BOUNDARY IS A HUMAN MESSAGE, AND CONTENT SHAPE DOES NOT DECIDE THAT. The first version matched only `"role":"user","content":"` — a STRING body. A message carrying an attachment has ARRAY content (`['image','text']`), so it was skipped, the scope silently extended back through the PREVIOUS turn, and the counts summed two turns together. Observed live on 2026-08-31: the reported run went 47 -> 57 across a turn containing ONE tool call, which is the signature. A tool_result carrier is also `type:"user"` with array content, so shape alone cannot separate them — the test is whether the array holds a text or image block, which only a human message does.
ln=$(python3 - "$tp" <<'PYSCOPE' 2>/dev/null
import sys, json
last = 1
for i, line in enumerate(open(sys.argv[1], encoding='utf-8', errors='replace'), 1):
    try:
        o = json.loads(line)
    except Exception:
        continue
    if o.get('type') != 'user':
        continue
    c = o.get('message', {}).get('content')
    if isinstance(c, str):
        last = i
    elif isinstance(c, list) and any(b.get('type') in ('text', 'image') for b in c):
        last = i
print(last)
PYSCOPE
)
ln=${ln:-1}

# One row per assistant message: a tool-carrying message, or the text of a text-only one. Regex note: apostrophes are written as `.` (let.s, i.ll) so the jq program can stay single-quoted.
rows=$(tail -n +"$ln" "$tp" 2>/dev/null | grep '"type":"assistant"' | jq -c '
  .message.content as $c
  | ($c | map(select(.type=="tool_use"))) as $t
  | if ($t | length) > 0
    then {k:"tool", n: ($t | map(select(.name as $x | ["Bash","Read","Grep","Glob","Edit","Write","MultiEdit","NotebookEdit"] | index($x))) | length),
          ask: (($t | map(select(.name != "AskUserQuestion")) | length) == 0)}
    else {k:"text", t: ($c | map(select(.type=="text")) | map(.text // "") | join(" "))}
    end
' 2>/dev/null)
[ -n "$rows" ] || exit 0

metrics=$(printf '%s\n' "$rows" | jq -s '
  def words: ascii_downcase | [splits("[^a-z0-9]+")] | map(select(length > 6)) | unique;
  . as $m
  | ([ $m | to_entries[] | select(.value.k=="tool") | .key ] | max) as $lastTool
  | (($m | last | select(.k=="text") | .t) // "" | words) as $fin
  | ([ $m | to_entries[]
        | select(.value.k=="text" and ($lastTool != null) and .key < $lastTool)
        | select((($m[.key + 1] // {}) | (.k == "tool" and (.ask // false))) | not)
        | select(((.value.t | test("background|still running|waiting on|in the meantime"; "i")) and ((.value.t | length) < 200)) | not)
        | .value.t
     ]) as $blocks
  | ([ $blocks[] | select(test("^ *(now |next[,:. ]|let me|let.s |i.ll |i will |going to|time to|first[,:. ]|then i|one more)"; "i")) ] | length) as $hedge
  | ([ $blocks[] | select(length < 90) | select(test("^ *(found it|confirmed|perfect|got it|there it is|that.s it|nice|great|good|exactly|interesting|hmm|aha|as expected|makes sense|reproduced|clean|green|all good|done[,.!]|yes[,.!])"; "i")) ] | length) as $ack
  | ([ $blocks[] | (words) as $bw | select(($bw | length) >= 5)
        | select((([ $bw[] | select(. as $w | $fin | index($w)) ] | length) / ($bw | length)) >= 0.6) ] | length) as $dup
  | ([ $m[] | select(.k=="tool") ] | length) as $tools
  | ($blocks | length) as $blocks_n
  | ([ $m[] | select(.k=="tool") | select(.n > 0) | .n ]
     | reduce .[] as $x ({cur:0,max:0}; if $x==1 then {cur:(.cur+1),max:([.max,.cur+1]|max)} else {cur:0,max:.max} end)
     | .max) as $run
  | ([ $m[] | select(.k=="tool") | select(.ask) ] | length > 0) as $asked
  | (($m | last) as $l | ($l.k == "text") and ($l.t | test("\\?")) and ($asked | not)) as $qprose
  | {hedge:$hedge, ack:$ack, dup:$dup, blocks:$blocks_n, tools:$tools, run:$run, qprose:$qprose}
' 2>/dev/null)
[ -n "$metrics" ] || exit 0

eval "$(printf '%s' "$metrics" | jq -r 'to_entries[] | .key + "=" + (.value|tostring)' 2>/dev/null | grep -E '^[a-z_]+=')"
hedge=${hedge:-0}; ack=${ack:-0}; dup=${dup:-0}; blocks=${blocks:-0}; tools=${tools:-0}; run=${run:-0}; qprose=${qprose:-false}
# CADENCE: narration keeping pace with tool calls. Needs a real turn under it, so at least 4 blocks.
cadence=0
if [ "$blocks" -ge 4 ] && [ "$tools" -gt 0 ] && [ $((blocks * 2)) -ge "$tools" ]; then cadence=1; fi

findings=""
if [ "$hedge" -gt 0 ]; then
  findings="$findings
  HEDGE x$hedge - that many mid-turn messages OPENED by announcing what you were about to do (now /
     let me / next / going to). Pre-registration is not information: the tool call that follows says
     it, and saying it first only makes a surprising result read as intended. Delete these outright -
     unlike a finding, there is nothing here to move to the summary."
fi
if [ "$ack" -gt 0 ]; then
  findings="$findings
  ACKNOWLEDGEMENT x$ack - contentless reactions between tool calls (found it / confirmed / perfect).
     They carry no fact the summary will not carry better. Ask the question directly: does this need
     to be said OUT LOUD right now, or does it just make the work look considered?"
fi
if [ "$dup" -gt 0 ]; then
  findings="$findings
  DUPLICATE x$dup - that many mid-turn blocks share most of their distinctive words with this turn
     own final summary. The reader pays for it twice. This is the test that matters and the one a hook
     can only approximate: WILL THIS BE IN THE SUMMARY ANYWAY? If yes, it was never a mid-turn line."
fi
if [ "$cadence" -eq 1 ]; then
  findings="$findings
  RUNNING COMMENTARY - $blocks narration messages against $tools tool-carrying ones, so prose is
     keeping pace with the work rather than concluding it. One substantive checkpoint in a long
     autonomous run is fine and is deliberately NOT flagged; a block after each call is the pattern.
     Save it all for one structured summary at the end."
fi
if [ "$qprose" = "true" ]; then
  findings="$findings
  QUESTION LEFT IN PROSE - this turn ends with a question mark and never called AskUserQuestion. A
     genuinely blocked decision goes in a popup, one decision per option, never buried in prose where
     it gets missed. If it was rhetorical, it did not need the question mark."
fi
if [ "$run" -ge 40 ]; then
  findings="$findings
  ONE-AT-A-TIME, SUSTAINED - $run consecutive messages each ran exactly ONE work-tool call. That is
     the measured 85th percentile of 615 real turns, so it is not an ordinary run. Batch the rest of
     this unit: independent probes into one ctx_batch_execute, edits into one python heredoc with the
     verification chained on. If each call genuinely needed the previous one output, that is a real
     serial dependency, not this pattern - say so and carry on."
fi

[ -n "$findings" ] || exit 0
jq -n --arg f "$findings" '{hookSpecificOutput:{hookEventName:"Stop", additionalContext:("TURN SHAPE - non-blocking, never denies. Classified on independent signals, not one binary test: a substantive mid-turn checkpoint is deliberately NOT flagged. Silent on a final summary, a thinking chain, an approval gate and a popup.\n" + $f)}}' 2>/dev/null
exit 0
