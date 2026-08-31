#!/usr/bin/env bash
# turn-shape-guard.sh — Stop hook. Non-blocking. Warns on two SHAPES this repo already has prohibitions for but nothing mechanical checks: narration ahead of a turn's first tool call, and two-or-more CONSECUTIVE messages each running exactly one Bash/Read/Grep/Glob call since the last real user message — "probe one thing, look, probe the next thing" instead of a batched investigation.
#
# WHY THIS EXISTS (Task 2, docs/superpowers/plans/2026-08-31-post-compact-remediation.md)
# ------------------------------------------------------------------------------------------
# Of the eleven working-contract rules in .remember/remember.md, the four never violated in one measured session were all SINGLE-ACT prohibitions (never push, never `npm run portal`, never delete a worktree, never say "done"). The three violated repeatedly — mega-batch, zero narration, finish the work — describe the SHAPE of continuous work and are checkable at no single point. That is the gap this fills, the same reasoning `push-approval-gate.sh` already applied to "approval never carries over": a rule that lives only in a document a session read hours ago is indistinguishable from a rule nobody wrote, under correction, with the rule loaded in context and recited verbatim.
#
# WHY NON-BLOCKING. Harkirat's standing constraint, same as the memory-write gate and push-approval-gate.sh: "a gate is better than advisory but i dont want it denying things." So this WARNS via non-blocking additionalContext, never `decision:"block"`.
#
# WHAT IT CANNOT SEE, stated rather than hidden. A Bash/Read call whose CONTENT genuinely depends on the previous call's OUTPUT is a real serial dependency and looks identical, from outside the transcript, to plain one-at-a-time avoidance. This fires on the shape, never on intent — read the warning, and if the dependency is real, say so and move on.

set -uo pipefail
input=$(cat)
active=$(printf '%s' "$input" | jq -r '.stop_hook_active // false' 2>/dev/null)
[ "$active" = "true" ] && exit 0
tp=$(printf '%s' "$input" | jq -r '.transcript_path // empty' 2>/dev/null)
[ -f "$tp" ] || exit 0

# Scope to the CURRENT turn: everything after the last message that is a real typed user message (content is a STRING), never a tool_result carrier (content is an ARRAY, also role:"user").
ln=$(grep -n '"role":"user","content":"' "$tp" 2>/dev/null | tail -1 | cut -d: -f1)
ln=${ln:-1}

# One jq object per assistant message in scope: n = count of Bash/Read/Grep/Glob tool_use blocks, narrated = true if a text block of real length (>40 chars) appears before the first tool_use block.
shape=$(tail -n +"$ln" "$tp" 2>/dev/null | grep '"type":"assistant"' | jq -c '
  .message.content as $c
  | ($c | map(select(.type=="tool_use" and (.name=="Bash" or .name=="Read" or .name=="Grep" or .name=="Glob"))) | length) as $n
  | ($c | to_entries | map(select(.value.type=="tool_use")) | (.[0].key // 999)) as $firstTool
  | ($c | to_entries
        | map(select(.value.type=="text" and (((.value.text // "") | length) > 40) and .key < $firstTool))
        | length > 0) as $narrated
  | {n: $n, narrated: $narrated}
' 2>/dev/null)

[ -n "$shape" ] || exit 0

narrated_hit=$(printf '%s\n' "$shape" | jq -s '[.[] | select(.narrated==true)] | length' 2>/dev/null)
# Two-or-more consecutive turns where EACH ran exactly one investigative call.
consec=$(printf '%s\n' "$shape" | jq -s '
  [.[].n] as $ns
  | if ($ns | length) < 2 then 0
    else ([range(0; ($ns|length)-1)] | map(select($ns[.]==1 and $ns[.+1]==1)) | length)
    end
' 2>/dev/null)

findings=""
if [ "${narrated_hit:-0}" -gt 0 ]; then
  findings="$findings
  📢 NARRATION AHEAD OF A TOOL CALL — this turn has prose before its first tool call. Delete it and
     ask whether anything was lost. If not, it was a hedge (pre-registering intent so a surprising
     result still reads as competent), not information — cut it."
fi
if [ "${consec:-0}" -gt 0 ]; then
  findings="$findings
  🔂 ONE-AT-A-TIME — two or more consecutive messages this turn each ran exactly one Bash/Read/Grep/
     Glob call. Batch the ones that are independent into a single message. If one genuinely needs the
     PREVIOUS call's output to know what to run next, that is a real serial dependency, not this
     pattern — say so and continue."
fi

[ -n "$findings" ] || exit 0
jq -n --arg f "$findings" '{hookSpecificOutput:{hookEventName:"Stop", additionalContext:("TURN SHAPE — non-blocking, fires on shape not intent, never denies.\n" + $f)}}' 2>/dev/null
exit 0
