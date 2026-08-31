#!/usr/bin/env bash
# prior-run-cost.sh — UserPromptSubmit. Non-blocking. Reports the PREVIOUS run's cost, before this one is written.
#
# WHY THIS EVENT AND NOT Stop (built 2026-08-31 18:4x EDT)
# ------------------------------------------------------------------------------------------
# Four guards existed and all of them fire at Stop, which is after the prose has already been written and paid for. Measured over one day: the Stop guard fired on nearly every run, was acknowledged in a line every time, and changed nothing. A report that arrives after the cost is a receipt, not a control.
#
# 🔴 WHAT THE MEASUREMENT ACTUALLY POINTED AT. Eight consecutive runs on 2026-08-31 produced ZERO mid-run prose — one of them 26 turns long — and no guard existed then. What those runs shared was a dense stretch of terse corrections from Harkirat. Compliance held while correction was RECENT and decayed once it was not, while every durable mechanism (the rule in .remember, the Stop guard, the working-style prompt in context) was live during the 12,657-byte run that followed. So the lever is recency, and the only thing a machine can do about recency is deliver the number at the moment of writing rather than after it.
#
# VOCABULARY, corrected by Harkirat the same day: a TURN is one assistant message and the round trip it costs; a user prompt through to the final summary is a RUN. A turn that produces only prose is still a turn — the merge-flow run was 64 turns and 24 of them talked and did nothing else.
#
# 🔴 WHERE THE LINE IS, because a raw byte count cannot draw one (Harkirat, 2026-08-31 18:5x EDT: "where do you draw the line between useful bytes that should be there vs pure useless narration?"). The first version counted every prose turn, which contradicted `turn-shape-guard.sh` — that one deliberately EXEMPTS one substantive checkpoint in a long run as legitimate. Two guards disagreeing about the same behaviour is worse than either being wrong alone.
#
# The line is the contract plus one test. The contract says zero mid-run prose and ONE structured summary, with exactly two carve-outs Harkirat states himself: a blocking question (which goes in a popup, not prose) and a one-line note while waiting on a long background task. Beyond that, the discriminator is REDUNDANCY, and it is his: WILL THIS BE IN THE SUMMARY ANYWAY? If yes it was never a mid-run line, and the reader pays for it twice.
#
# So a mid-run prose turn is counted as CARRYING NOTHING when it is a hedge (opens by pre-registering intent), an acknowledgement (contentless reaction), or a duplicate (most of its distinctive words already appear in the run own final summary). A turn that is none of those is a substantive checkpoint and is reported separately rather than folded into the complaint — the same classification `turn-shape-guard.sh` uses, so the two agree by construction instead of by coincidence.
#
# ⚠️ IT REPORTS, IT DOES NOT ADVISE. No threshold and no verdict — advice exists four times over already and did not move this number. Just what the last run cost, so it is the first thing in context rather than the last.

set -uo pipefail
input=$(cat)
tp=$(printf '%s' "$input" | jq -r '.transcript_path // empty' 2>/dev/null)
[ -f "$tp" ] || exit 0

out=$(python3 - "$tp" <<'PY' 2>/dev/null
import sys, json, re
runs, cur = [], None
for line in open(sys.argv[1], encoding='utf-8', errors='replace'):
    try:
        o = json.loads(line)
    except Exception:
        continue
    m = o.get('message', {})
    if o.get('type') == 'user':
        c = m.get('content')
        # A boundary is a HUMAN message whatever shape its content has. A tool_result carrier is also
        # type:"user" with array content, so the test is whether the array holds text or an image.
        if isinstance(c, str) or (isinstance(c, list) and any(b.get('type') in ('text', 'image') for b in c)):
            if cur:
                runs.append(cur)
            cur = {'tool': 0, 'prose': []}
    elif o.get('type') == 'assistant' and cur is not None:
        c = m.get('content') or []
        if not isinstance(c, list):
            continue
        if [b for b in c if b.get('type') == 'tool_use']:
            cur['tool'] += 1
        else:
            t = ''.join(b.get('text') or '' for b in c if b.get('type') == 'text')
            if t.strip():
                cur['prose'].append(t)
if cur:
    runs.append(cur)
runs = [r for r in runs if r['tool'] or r['prose']]
if not runs:
    sys.exit(0)
r = runs[-1]

# The final prose turn is the summary and is legitimate. Everything above it is mid-run.
summary = r['prose'][-1] if r['prose'] else ''
mid_turns = r['prose'][:-1] if r['prose'] else []

HEDGE = re.compile(r'^\s*(now\b|next[,:. ]|let me|let.s |i.ll |i will |going to|time to|first[,:. ]|then i|one more)', re.I)
ACK = re.compile(r'^\s*(found it|confirmed|perfect|got it|there it is|that.s it|nice|great|good|exactly|interesting|hmm|aha|as expected|makes sense|reproduced|clean|green|all good|done[,.!]|yes[,.!])', re.I)
WAIT = re.compile(r'background|still running|waiting on|in the meantime', re.I)

def words(t):
    return {w for w in re.findall(r'[a-z][a-z0-9]{6,}', t.lower())}

sw = words(summary)
empty = 0
for t in mid_turns:
    if WAIT.search(t) and len(t) < 200:      # his stated carve-out
        continue
    if HEDGE.match(t) or ACK.match(t):
        empty += 1
        continue
    bw = words(t)
    if len(bw) >= 5 and len(bw & sw) / len(bw) >= 0.6:   # it is in the summary anyway
        empty += 1

total = r['tool'] + len(r['prose'])
by = sum(len(t) for t in mid_turns)
print(f"{total}|{r['tool']}|{len(mid_turns)}|{by}|{empty}")
PY
)
[ -n "$out" ] || exit 0
IFS='|' read -r total tools mid bytes empty <<< "$out"
[ "${mid:-0}" -ge 1 ] || exit 0

jq -n --arg t "$total" --arg k "$tools" --arg m "$mid" --arg b "$bytes" --arg e "$empty" \
  '{hookSpecificOutput:{hookEventName:"UserPromptSubmit", additionalContext:("PREVIOUS RUN COST " + $t + " TURNS: " + $k + " ran a tool, " + $m + " were mid-run prose (" + $b + " bytes), and " + $e + " OF THOSE CARRIED NOTHING.\n\n  A turn is one assistant message and the round trip it costs; a prose-only turn still costs one.\n  Carried nothing means: it pre-registered what was about to happen, it was a contentless\n  acknowledgement, or most of its distinctive words already appear in the run own final summary\n  — the test being WILL THIS BE IN THE SUMMARY ANYWAY. A mid-run turn that is none of those is a\n  substantive checkpoint and is in the " + $m + " but not the " + $e + ".\n\n  A number, not advice. Advice exists four times over at the END of a run and has not moved it;\n  the point of this one is that it arrives BEFORE the next run is written.")}}' 2>/dev/null
exit 0
