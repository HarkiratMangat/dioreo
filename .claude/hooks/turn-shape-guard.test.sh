#!/usr/bin/env bash
# turn-shape-guard.test.sh — self-test for turn-shape-guard.sh.
#
# 🔴 THE CASE CLASS THIS SUITE GAINED, AND WHY. On 2026-08-31 this suite reported 21/21 green while one of its two rules matched 0 of 13,922 real messages: every fixture was synthetic and asserted the shape its author already had in mind. So the final section REPLAYS REAL TRANSCRIPTS and asserts the rule fires on some turns and stays silent on others. A predicate that hits 0% or 100% of real turns is broken regardless of what the hand-written cases say — and neither of the two earlier versions could have failed a hand-written case.
#
# The rule for anything added here: a case belongs in the SILENT half if firing would push the session toward deleting its summary, thinking less, or skipping an approval gate. Compliance has to be the cheaper path, or the hook is friction.
GATE="$(cd "$(dirname "$0")" && pwd)/turn-shape-guard.sh"
pass=0; fail=0
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
usermsg() { printf '{"type":"user","role":"user","content":"go"}\n'; }
txt() { printf '{"type":"assistant","message":{"content":[{"type":"text","text":"%s"}]}}\n' "$1"; }
tool() { printf '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"%s","input":{}}]}}\n' "$1"; }
tool2() { printf '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"%s","input":{}},{"type":"tool_use","name":"%s","input":{}}]}}\n' "$1" "$2"; }
SUM="Remediation plan closed and committed as 2ced8c0. Task 11 the merge needs your explicit push approval before I touch anything visible, so nothing has been pushed."
LONGNARR="The morning list, three of four now closed. Geometry: the clock was never frozen, so the collapse made it reproducible and the tell was two consecutive checks agreeing with each other while both disagreed with the fixture. Breadcrumbs: checked by reading each line and none were wrong. Gate: the sweep orphan split was unproven. Memory: three entries still called conform live, so they were rewritten."
fires() { out=$(printf '{"transcript_path":"%s"}' "$2" | bash "$GATE"); if [ -n "$out" ]; then echo "  ok  $1"; pass=$((pass+1)); else echo "  FAIL  $1 — expected a warning, got nothing"; fail=$((fail+1)); fi; }
silent() { out=$(printf '{"transcript_path":"%s"}' "$2" | bash "$GATE"); if [ -z "$out" ]; then echo "  ok  $1"; pass=$((pass+1)); else echo "  FAIL  $1 — expected silence, got: $out"; fail=$((fail+1)); fi; }
says() { out=$(printf '{"transcript_path":"%s"}' "$2" | bash "$GATE" | jq -r '.hookSpecificOutput.additionalContext // ""'); if printf '%s' "$out" | grep -qF "$3"; then echo "  ok  $1"; pass=$((pass+1)); else echo "  FAIL  $1 — missing '$3'"; fail=$((fail+1)); fi; }

echo "turn-shape-guard:"

# ── MUST STAY SILENT — every one of these fired in V1 or V2 ──
f=$work/a; { usermsg; tool2 Bash Read; tool2 Edit Edit; txt "$SUM"; } > $f
silent "a batched turn ending in the required final summary" $f
f=$work/b; { usermsg; tool2 Bash Bash; txt "$SUM"; } > $f
silent "a text-only blocked-on-approval close" $f
f=$work/c; { usermsg; txt "$SUM"; } > $f
silent "a prose answer with no tool calls" $f
f=$work/d; { usermsg; tool Bash; txt "Kicked the suite off in the background; continuing on the docs while it runs."; tool Edit; } > $f
silent "a note while waiting on a long background task (his stated exception)" $f
f=$work/e; { usermsg; tool Bash; txt "$LONGNARR"; tool AskUserQuestion; tool Edit; } > $f
silent "framing immediately before an AskUserQuestion popup (his stated exception)" $f
f=$work/f; { usermsg; for i in 1 2 3 4; do tool mcp__sequential-thinking__sequentialthinking; done; txt "$SUM"; } > $f
silent "a chain of sequentialthinking calls" $f
f=$work/g; { usermsg; for i in $(seq 1 10); do tool Bash; done; txt "$SUM"; } > $f
silent "a run of ten singletons is below the measured extreme" $f
f=$work/h; { usermsg; tool Bash; tool Read; } > $f
silent "a turn with no text at all" $f

f=$work/chk; { usermsg; tool2 Bash Read; tool2 Edit Edit; tool Bash; txt "The geometry check disagreed with the fixture on count only, which is the signature of an unfrozen clock rather than a real drift, so the remaining work is unaffected."; tool2 Edit Bash; txt "$SUM"; } > $f
silent "ONE substantive mid-turn checkpoint in a long run is legitimate and deliberately not flagged" $f

# ── MUST FIRE ──
f=$work/i; { usermsg; tool Bash; txt "Found it."; tool Edit; txt "$SUM"; } > $f
fires "ACK: a nine-character acknowledgement between tool calls" $f
says "it classifies it as an acknowledgement" $f "ACKNOWLEDGEMENT x1"
f=$work/hg; { usermsg; tool Bash; txt "Now let me make the three edits and then run the suite."; tool Edit; txt "$SUM"; } > $f
says "HEDGE: an opener that pre-registers intent is classified separately" $f "HEDGE x1"
says "the hedge guidance says to DELETE rather than move" $f "Delete these outright"
DUPTXT="The geometry check disagreed with the fixture on the count only, which is the signature of an unfrozen clock rather than genuine drift in the measurement."
f=$work/dp; { usermsg; tool Bash; txt "$DUPTXT"; tool Edit; txt "$DUPTXT And nothing else changed."; } > $f
says "DUPLICATE: a mid-turn block whose words reappear in the summary is caught as redundancy" $f "DUPLICATE x1"
says "the duplicate guidance asks the redundancy question outright" $f "WILL THIS BE IN THE SUMMARY ANYWAY"
f=$work/cad; { usermsg; for i in 1 2 3 4 5; do tool Bash; txt "The season fixture reports four lanes and the manifest agrees with all four of them here."; done; tool Bash; txt "$SUM"; } > $f
says "CADENCE: narration keeping pace 1:1 with tool calls is its own signal" $f "RUNNING COMMENTARY"
# 🔴 THE CASE THAT FALSIFIED THE FIRST CORRECTION. I claimed short text is the narration and long text carries information; Harkirat produced a real session of page-long formatted blocks between tool calls. Measured across 3,775 instances: 13 to 7,869 chars, mass in every band. Position, not length. 🔴 THE PAIR THAT SETTLES TWO FALSIFIED THEORIES. V2 said narration is LONG; my first correction said SHORT; the measurement said neither (3,775 instances, 13 to 7,869 chars, mass in every band). Harkirat third point is what resolves it: narration is SITUATION-DEPENDENT, so ONE such block is a legitimate checkpoint and MANY interleaved with the work is running commentary. This pair is the reason one binary trigger had to become four independent signals.
f=$work/j1; { usermsg; tool Bash; txt "$LONGNARR"; tool Edit; txt "$SUM"; } > $f
silent "ONE long structured block, no hedge and not duplicated, is a legitimate checkpoint" $f
f=$work/j2; { usermsg; for i in 1 2 3 4 5; do tool Bash; txt "$LONGNARR"; done; tool Edit; txt "$SUM"; } > $f
fires "the SAME block repeated between every call is running commentary" $f
f=$work/k; { usermsg; tool Bash; txt "Found it."; tool Read; txt "$LONGNARR"; tool Edit; txt "$SUM"; } > $f
says "it counts per CLASS, so guidance can differ by kind" $f "ACKNOWLEDGEMENT x1"
f=$work/l; { usermsg; tool2 Bash Read; txt "Do you want me to merge this now, or hold it?"; } > $f
fires "a question left in prose with no AskUserQuestion" $f
says "the question warning names the popup" $f "popup"
f=$work/m; { usermsg; for i in $(seq 1 40); do tool Bash; done; txt "$SUM"; } > $f
says "a sustained run of 40 is reported with its length" $f "40 consecutive"
f=$work/n; { usermsg; tool Bash; tool Bash; usermsg; tool2 Bash Read; txt "$SUM"; } > $f
silent "a prior turn does not leak into this one" $f
f=$work/o; { usermsg; tool Bash; txt "Found it."; tool Edit; } > $f
out=$(printf '{"transcript_path":"%s","stop_hook_active":true}' $f | bash "$GATE")
if [ -z "$out" ]; then echo "  ok  stop_hook_active=true stays silent"; pass=$((pass+1)); else echo "  FAIL  re-entrancy"; fail=$((fail+1)); fi

# ── ANTI-VACUOUS: a warning that instructs nothing is furniture ──
f=$work/p; { usermsg; tool Bash; txt "Found it."; tool Edit; txt "$SUM"; } > $f
says "it redirects narration to the end summary rather than deleting it" $f "summary"
says "it says a substantive checkpoint is deliberately not flagged" $f "deliberately NOT flagged"
says "it states it never denies" $f "never denies"

# ── 🔴 REAL-TRANSCRIPT REPLAY — the class of case whose absence let two broken versions ship ──
D="$HOME/.claude/projects/-Applications-Claude-Code-Diors-Builds"
if [ -d "$D" ]; then
  rep="$work/replay"; mkdir -p "$rep"
  python3 - "$D" "$rep" <<'PY'
import sys, os, glob, json
out=0
for f in sorted(glob.glob(os.path.join(sys.argv[1],'*.jsonl')))[-6:]:
    try: lines=open(f,encoding='utf-8',errors='replace').read().splitlines()
    except Exception: continue
    cur=[]
    for ln in lines:
        try: o=json.loads(ln)
        except Exception: continue
        if o.get('type')=='user' and isinstance(o.get('message',{}).get('content'),str):
            if len(cur)>2 and out<40:
                open(os.path.join(sys.argv[2],f'{out}.jsonl'),'w',encoding='utf-8').write('\n'.join(cur)+'\n'); out+=1
            cur=[ln]
        elif cur and o.get('type')=='assistant': cur.append(ln)
print(out)
PY
  n=$(ls "$rep" 2>/dev/null | wc -l | tr -d ' ')
  if [ "${n:-0}" -ge 5 ]; then
    fired=0; quiet=0
    for t in "$rep"/*.jsonl; do
      if [ -n "$(printf '{"transcript_path":"%s"}' "$t" | bash "$GATE")" ]; then fired=$((fired+1)); else quiet=$((quiet+1)); fi
    done
    echo "     replayed $n real turns: fired on $fired, silent on $quiet"
    if [ "$fired" -gt 0 ] && [ "$quiet" -gt 0 ]; then
      echo "  ok  on REAL transcripts it both fires and stays silent (not 0%, not 100%)"; pass=$((pass+1))
    else
      echo "  FAIL  on real transcripts it is degenerate: fired=$fired quiet=$quiet — a predicate that hits every turn or no turn is broken whatever the synthetic cases say"; fail=$((fail+1))
    fi
  else
    echo "  --  replay skipped: only $n usable real turns found"
  fi
else
  echo "  --  replay skipped: no transcript store on this machine"
fi

echo "  $pass passed, $fail failed"
[ "$fail" -eq 0 ]
