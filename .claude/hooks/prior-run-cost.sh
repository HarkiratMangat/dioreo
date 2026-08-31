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
# ⚠️ IT REPORTS, IT DOES NOT JUDGE. No threshold, no verdict, no advice — those all exist already and did not work. Just the previous run's numbers, so the first thing in context each run is what the last one cost.

set -uo pipefail
input=$(cat)
tp=$(printf '%s' "$input" | jq -r '.transcript_path // empty' 2>/dev/null)
[ -f "$tp" ] || exit 0

out=$(python3 - "$tp" <<'PY' 2>/dev/null
import sys, json
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
            cur = {'tool': 0, 'prose': 0, 'bytes': 0}
    elif o.get('type') == 'assistant' and cur is not None:
        c = m.get('content') or []
        if not isinstance(c, list):
            continue
        if [b for b in c if b.get('type') == 'tool_use']:
            cur['tool'] += 1
        else:
            t = ''.join(b.get('text') or '' for b in c if b.get('type') == 'text')
            if t.strip():
                cur['prose'] += 1
                cur['bytes'] += len(t)
if cur:
    runs.append(cur)
runs = [r for r in runs if r['tool'] or r['prose']]
if not runs:
    sys.exit(0)
r = runs[-1]
# The final summary is one legitimate prose turn; everything above it is mid-run.
mid = max(0, r['prose'] - 1)
total = r['tool'] + r['prose']
print(f"{total}|{r['tool']}|{mid}|{r['bytes']}")
PY
)
[ -n "$out" ] || exit 0
IFS='|' read -r total tools mid bytes <<< "$out"
[ "${mid:-0}" -ge 1 ] || exit 0

jq -n --arg t "$total" --arg k "$tools" --arg m "$mid" --arg b "$bytes" \
  '{hookSpecificOutput:{hookEventName:"UserPromptSubmit", additionalContext:("PREVIOUS RUN COST " + $t + " TURNS: " + $k + " ran a tool, " + $m + " produced only prose (" + $b + " bytes of visible text).\n\n  A turn is one assistant message and the round trip it costs. A prose-only turn still costs one.\n  The contract is zero mid-run prose and ONE structured summary at the end, so " + $m + " of those\n  were the whole cost of saying something that could have waited.\n\n  This is a number, not advice. Four guards already give advice at the end of a run and it has not\n  moved this figure; the point of putting it here is that it arrives BEFORE the next run is written.")}}' 2>/dev/null
exit 0
