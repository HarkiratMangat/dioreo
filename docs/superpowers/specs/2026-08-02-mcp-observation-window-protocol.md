# 7-day MCP observation window — protocol

**Status:** ▶️ RUNNING. Opened 2026-08-02 17:00 EDT. **Closes 2026-08-09 17:00 EDT.**
**Analysis:** a dedicated session after close. Do not analyse early and do not extend silently.
**Instrument:** `scripts/mcp-observation-metrics.mjs` — the same script for both windows.

---

## 1. The question

Harkirat, 2026-08-02 16:45 EDT: *"is the lack of usage due to the rule or due to the actual cost of
using the tool?"*

`sequential-thinking` has been invoked **twice, ever**. That number is currently **uninterpretable**,
because the tool was installed by the very 2026-07-24 MCP integration that restricted it — measured:
**310 pre-rule transcripts, tool present in 0; 45 post-rule, present in 38.** It has never existed
unrestricted for a single session, so its usage count measures *the rule*, not the tool.

**This window removes the restriction to get a readable number.**

## 2. The intervention

> **For the window only, `sequential-thinking` is UNRESTRICTED.** Use it whenever it seems useful, on
> judgement, with no permission needed and no fit-conditions to satisfy.

**Why fully unrestricted and not "relaxed":** any residual gate re-creates the original confound. A
rule of the form *"use it when the three fit-conditions hold"* would measure **adherence to those
conditions**, not the tool's natural trigger rate — and we would end the week with another
uninterpretable number. The restriction is the variable under test; it has to actually come off.

**Mandatory in exchange:** every invocation gets a one-line log entry (§5). An unlogged use is a lost
data point — the transcript records *that* it happened, never *why*.

## 3. Pre-registered metrics — fixed BEFORE seeing any treatment data

Chosen now, in advance, so they cannot be swapped for whichever ones flatter the outcome afterwards.
That failure has a name in this repo: the verifier halo ([[feedback_verify_before_claiming]]).

| Metric | Why it is here |
|---|---|
| `sequential-thinking` calls · calls per 100 turns | the direct trigger-rate answer |
| `turnsPerSession` | the cost claim: does an unrestricted tool inflate turns? |
| `totalThoughts` distribution | a 2-thought run is not a real exercise of the tool; long runs are |
| `Read` + `Bash` counts | control variables — a turn spike must be attributable, not assumed |
| `linksee-remember` + `perseus-remember` per session | do the memory-layer fixes hold? |
| `linksee-recall`, `read_smart`, `perseus-recall` | is recall actually being used, or just written? |
| `codebase-search_graph` | did correcting the stale "Python-only" hook change routing? |
| `ctx-execute*` | did the injected routing move work off `Bash`? |

### Baseline — control window 2026-07-24 → 2026-08-02 (measured 2026-08-02 17:00 EDT)

```
sessions 41 · assistantTurns 14,344 · turnsPerSession 349.9
sequential-thinking        2   (0.014 per 100 turns)   ← both in ONE session, totalThoughts: 2
linksee-recall             7      linksee-remember     9
linksee-read_smart         2      perseus-recall       6
perseus-remember           8      codebase-search_graph 1
ctx-execute*             108      Read              1,015      Bash            3,253
memoryWritesPerSession  0.41
```

Two baseline numbers are findings in their own right: **0.41 deliberate memory writes per session**
(the "starved layers" problem, quantified) and **`search_graph` used once in 41 sessions** (the
measurable cost of a hook that spent nine days asserting the tool did not work on JS).

## 4. What would count as evidence — declared in advance

**On the rule (the primary question):**
- **Rule was suppressing genuine value** → trigger rate rises well above 0.014/100 turns, runs are
  substantial (`totalThoughts` ≥ 4), and turns/session does **not** materially rise. Reinstating the
  rule would then be costing us something real.
- **Rule was correctly protecting cost** → turns/session rises materially with no offsetting benefit.
- **Rule was irrelevant** → trigger rate stays near zero even unrestricted. That would mean the tool
  simply does not fit this work, and the rule was never the binding constraint.
- ⚠️ **Anticipated failure mode: novelty.** Removing a restriction invites using the thing *because*
  it is newly allowed. A spike of short (`totalThoughts` 2–3) runs with no decision attached is
  novelty, not fit — the log's *why* field is what separates them, which is why the log is mandatory.

**On the MCP fixes (the secondary question):** memory writes per session should rise from 0.41;
`search_graph` should rise from 1; `ctx-execute*` should rise from 2.6/session. If they do not, the
SessionStart routing hook is not working and prose-in-a-hook failed the same way prose-in-a-doc did —
which is itself the more valuable finding.

## 5. The usage log

Append to `local/mcp-observation-log.md` (gitignored — it is scratch data, not a record):

```
- 2026-08-0X HH:MM EDT | seq-thinking | thoughts: N | why: <what made me reach for it>
  outcome: <did it change the answer, or just narrate one I already had?>
```

The `outcome` line is the one that matters. "It felt thorough" is not an outcome.

## 6. Close-out

1. Re-run the instrument **unchanged**: `node scripts/mcp-observation-metrics.mjs --from 2026-08-02 --to 2026-08-09 --label treatment`
2. Compare against §3 using only the §4 criteria.
3. Decide: keep unrestricted · reinstate explicit-request-only · or adopt the fit-conditions version.
4. Update `~/.claude/CLAUDE.md` and `project_context_token_budget` with the verdict **and the data**.

⚠️ **If `scripts/mcp-observation-metrics.mjs` is edited during the window, the comparison is void.**
Note the change and re-baseline. Same instrument, both windows, or it is not a measurement.

⚠️ **Do not draw the conclusion early.** A 3-day read is a different experiment, and the temptation
will be strongest if the first two days look decisive.
