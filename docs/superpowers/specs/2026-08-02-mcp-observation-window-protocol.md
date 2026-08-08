# 7-day MCP observation window — protocol

**Status:** ▶️ RUNNING. Opened 2026-08-02 14:43 EDT. **Closes 2026-08-09 17:00 EDT.**
**Analysis:** a dedicated session after close. Do not analyse early and do not extend silently.
**Instrument:** `scripts/mcp-observation-metrics.mjs` — the same script for both windows.

---

## 1. The question

Harkirat, 2026-08-02 14:43 EDT: *"is the lack of usage due to the rule or due to the actual cost of using the tool?"*

`sequential-thinking` has been invoked **twice, ever**. That number is currently **uninterpretable**, because the tool was installed by the very 2026-07-24 MCP integration that restricted it — measured: **310 pre-rule transcripts, tool present in 0; 45 post-rule, present in 38.** It has never existed unrestricted for a single session, so its usage count measures *the rule*, not the tool.

**This window removes the restriction to get a readable number.**

## 2. The intervention

> **For the window only, `sequential-thinking` is UNRESTRICTED.** Use it whenever it seems useful, on judgement, with no permission needed and no fit-conditions to satisfy.

**Why fully unrestricted and not "relaxed":** any residual gate re-creates the original confound. A rule of the form *"use it when the three fit-conditions hold"* would measure **adherence to those conditions**, not the tool's natural trigger rate — and we would end the week with another uninterpretable number. The restriction is the variable under test; it has to actually come off.

**Mandatory in exchange:** every invocation gets a one-line log entry (§5). An unlogged use is a lost data point — the transcript records *that* it happened, never *why*.

## 3. Pre-registered metrics — fixed BEFORE seeing any treatment data

Chosen now, in advance, so they cannot be swapped for whichever ones flatter the outcome afterwards. That failure has a name in this repo: the verifier halo ([[feedback_verify_before_claiming]]).

| Metric | Why it is here |
|---|---|
| `sequential-thinking` calls · calls per 100 turns | the direct trigger-rate answer |
| `turnsPerSession` | the cost claim: does an unrestricted tool inflate turns? |
| `totalThoughts` distribution | a 2-thought run is not a real exercise of the tool; long runs are |
| `Read` / `Write` / `Edit` / `Bash` counts | control variables — a turn spike must be attributable, not assumed |
| **`cacheRead` total · `cacheReadPerTurn`** | **the actual cost driver.** *cost ≈ turns × context*, and this IS the context term. Baseline **290,915/turn** |
| **`tokens.{input,output,cacheCreate,cacheRead}`** | the full token picture; output tokens are the expensive ones per unit |
| **`cache1h` vs `cache5m`** | a shift toward 5m ephemeral means cache is being rebuilt more often — a silent cost rise |
| **`models` mix** | ⚠️ **the biggest confounder.** An Opus-skewed treatment week moves every number on its own |
| **`efforts` mix** | same confounder class — high/xhigh vs medium changes turn behaviour |
| **`compactions`** | a compacted session distorts turn counts and context curves; must be comparable across windows |
| **`apiErrors` + `toolErrors`** | quality signal — more thinking must not come with more failed calls |
| **`subagent-spawn`** | the *other* turn-multiplier; if it moves, turn changes may not be sequential-thinking at all |
| **`turnsPerSession.median` and `.max`** | the mean is carried by outliers — baseline mean 541.1 vs **median 276**, max 5,380. **Compare on the MEDIAN.** |
| `estCostUSD` | relative index only (list is **2.57×** observed, and model-specific) — direction, never dollars |
| `linksee-remember` + `perseus-remember` per session | do the memory-layer fixes hold? |
| `linksee-recall`, `read_smart`, `perseus-recall` | is recall actually being used, or just written? |
| `codebase-search_graph` | did correcting the stale "Python-only" hook change routing? |
| `ctx-execute*` | did the injected routing move work off `Bash`? |

### Baseline — control window 2026-07-24 → 2026-08-02

> **⚠️ INSTRUMENT v1 → v2, re-baselined 2026-08-02 14:43 EDT — before any treatment data existed.** v1 measured turns and tool counts only, which is **half the cost model**: the standing formula is *cost ≈ turns × context*, and v1 never measured context. It also ignored the **model/effort mix**, a real confounder — the corpus spans `sonnet-5`, `opus-5`, `opus-4-8` and `haiku-4-5` across three effort levels, so a treatment week skewed toward Opus would move every number on its own. v1 also silently scanned **all projects**, not just this one. Caught by Harkirat, 2026-08-02 14:43 EDT. Re-baselining now is legitimate precisely because zero treatment data exists yet; the same edit on day 3 would have voided the experiment.

> **⚠️ SECOND instrument correction, 2026-08-02 14:43 EDT — bucketing by session START, not mtime.** Sessions were being attributed by *last-modified*, so any session that began before a window and ran into it landed on the wrong side. **Not hypothetical: the session that built this instrument started 12:53 EDT — over four hours before the window opened at 17:00 — and by mtime would have joined the TREATMENT set, contributing 884 turns of pre-relaxation work with zero sequential-thinking uses.** The fix moved the baseline materially (mean 365.5 → 541.1, max 1,729 → 5,380) while the **median barely moved, 279 → 276** — i.e. the mean had been carried by misattributed long sessions all along.

**Diors-Builds only (the comparison set), bucketed by session start — `--project -Applications-Claude-Code-Diors-Builds`:**

```
sessions 35 · assistantTurns 18,939
turnsPerSession   mean 541.1 · median 276 · max 5,380   ← use the MEDIAN; the mean is outlier-driven
cacheReadPerTurn  290,915
models   sonnet-5 · opus-5 · opus-4-8 (mix — check FIRST at close-out)
compactions 18 · toolErrors 192 · apiErrors 11 · speed/tier: all "standard"

sequential-thinking 2 (0.014 /100 turns)  ← both in ONE session, totalThoughts: 2
linksee-recall 7 · linksee-remember 9 · linksee-read_smart 2
perseus-recall 6 · perseus-remember 8 · codebase-search_graph 1
ctx-execute* 108 · subagent-spawn 27
Read 993 · Write 149 · Edit 1,725 · Bash 3,165
memoryWritesPerSession 0.49
```

### ⏱️ Relaxation period ≠ measured window

- **Relaxation is LIVE from 2026-08-02 14:43 EDT** through 2026-08-09 17:00 EDT — exactly 7×24h.
- **The MEASURED window is 2026-08-02 → 2026-08-10 (exclusive), and 08-02 COUNTS.**

**Harkirat's call, 2026-08-02 14:43 EDT:** start measuring today, from the next session opened, with the already-run sessions filtered out. Starting on 08-03 instead would have discarded a full day of the relaxation period — and the first day is where a novelty spike, if there is one, would show.

**Two Aug-2 sessions are excluded BY SESSION ID, not by date:** `0bffaf56` (618 turns — the session that built this instrument) and `e754deb0` (301 turns). Both started before 17:00 EDT, both have zero sequential-thinking uses. The IDs are **hardcoded in the instrument**, not passed as a flag, because a close-out that forgot `--exclude` would silently pull ~919 zero-use turns into the treatment set and understate the trigger rate. Verified to discriminate: the window reads **0 sessions** with the filter and **2 sessions / 922 turns** under `--exclude none`. ✅ **A day-one novelty spike IS now captured**, which is the point of starting on 08-02 rather than 08-03. Treat a cluster of short (`totalThoughts` 2–3) runs on the first day as *novelty until the log's `why`/`outcome` says otherwise* — a newly-unlocked tool gets reached for because it is new.

### ⚠️ DECLARED IN ADVANCE: the treatment period is expected to be DESIGN-heavy

Harkirat stated 2026-08-02 14:43 EDT that he resumes **website work** next session, and that it *"could very easily trigger the tool."* He is right, and that is exactly why this has to be written down now rather than discovered in the analysis.

**The task mix is the largest UNCONTROLLED variable in this experiment**, and the two windows are already known to differ:

| | control window | treatment window (expected) |
|---|---|---|
| dominant work | auditing, records, debugging, memory forensics | website / visual design |
| shape | verify-and-sweep — premises unknown, checking is the bottleneck | design forks — premises known, *choosing* is the bottleneck |

Design work is **precisely the declared fit case** (verified premises · real branches · a wrong choice costing >10 turns). So:

- **A high trigger rate next week does NOT prove the tool is generally useful.** It would show the tool fires on design work. That is a narrower claim — and arguably the more useful one — but it must be stated that way, not generalised into "sequential-thinking earns its place."
- **A low trigger rate even in its best-fit week is strong evidence the other way**, and is the single most informative outcome available.
- **Cost comparisons are contaminated too.** Design work has a different tool profile (more browsing, more artifact iteration, longer outputs), so a change in `turnsPerSession` or `cacheReadPerTurn` cannot be attributed to sequential-thinking without first ruling this out.

**The partial control:** the instrument already records `Read`/`Write`/`Edit`/`Bash`, `subagent-spawn`, `ctx-execute*`, model and effort mix. **At close-out, compare the tool PROFILE between windows first.** If the profiles differ sharply, the cost metrics are describing two different kinds of week and only the trigger-rate question survives. Say so plainly rather than reporting a clean-looking delta.

> **⚠️ `estCostUSD` is NOT money.** Calibrated 2026-08-02 14:43 EDT against the only real figure on record, recomputed **from its transcript** rather than a remembered summary — session `38972d5e`: **404 `claude-sonnet-5` turns, 87.4M cache reads, 430k output → $44.02 at list vs $17.10 billed = list is 2.57× actual.**
>
> **A first attempt said 7.7× and was wrong twice:** it applied **Opus** cache-read rates ($1.50/M) to a **Sonnet** session ($0.30/M), and counted only cache reads while ignoring 430k output tokens. Harkirat caught the model error. Two wrong inputs produced one confident number — inside the instrument built to measure rigour. Logged here because the protocol should carry its own scars.
>
> **The 2.57× factor is model-specific.** Opus and Sonnet rates differ ~5×, so a single scalar holds only while the model mix holds — a second reason `models` is the **first** thing to check at close-out. If the mix shifted, even the *relative* comparison distorts.

**Three baseline numbers are findings in their own right:** **0.49 deliberate memory writes per session** (the "starved layers" problem, quantified) · **`search_graph` used once in 35 sessions** (the measurable cost of a hook that spent nine days asserting the tool did not work on JS) · **290,915 cache reads per turn**, which is the actual cost driver and the reason turn count matters at all.

## 4. What would count as evidence — declared in advance

**On the rule (the primary question):**
- **Rule was suppressing genuine value** → trigger rate rises well above 0.014/100 turns, runs are substantial (`totalThoughts` ≥ 4), and turns/session does **not** materially rise. Reinstating the rule would then be costing us something real.
- **Rule was correctly protecting cost** → turns/session rises materially with no offsetting benefit.
- **Rule was irrelevant** → trigger rate stays near zero even unrestricted. That would mean the tool simply does not fit this work, and the rule was never the binding constraint.
- ⚠️ **Anticipated failure mode: novelty.** Removing a restriction invites using the thing *because* it is newly allowed. A spike of short (`totalThoughts` 2–3) runs with no decision attached is novelty, not fit — the log's *why* field is what separates them, which is why the log is mandatory.

**On the MCP fixes (the secondary question):** memory writes per session should rise from 0.41; `search_graph` should rise from 1; `ctx-execute*` should rise from 2.6/session. If they do not, the SessionStart routing hook is not working and prose-in-a-hook failed the same way prose-in-a-doc did — which is itself the more valuable finding.

## 5. The usage log

Append to `local/mcp-observation-log.md` (gitignored — it is scratch data, not a record):

```
- 2026-08-0X HH:MM EDT | seq-thinking | thoughts: N | why: <what made me reach for it>
  outcome: <did it change the answer, or just narrate one I already had?>
```

The `outcome` line is the one that matters. "It felt thorough" is not an outcome.

## 6. Close-out

1. Re-run the instrument **unchanged**, both scopes:
   ```bash
   node scripts/mcp-observation-metrics.mjs --from 2026-08-02 --to 2026-08-10 --label treatment --project -Applications-Claude-Code-Diors-Builds
   node scripts/mcp-observation-metrics.mjs --from 2026-08-02 --to 2026-08-10 --label treatment-all
   ```
   ⚠️ **`--to` is EXCLUSIVE, so it must be `2026-08-10` to include the window's final day.** An earlier draft said `--to 2026-08-09`, which would have silently dropped Aug 9 — the same off-by-one already caught in the hook's own date comparison. Off-by-one in an experiment's instrument is a data-integrity bug, and this one bit twice.
2. Compare against §3 using only the §4 criteria.
3. Decide: keep unrestricted · reinstate explicit-request-only · or adopt the fit-conditions version.
4. Update `~/.claude/CLAUDE.md` and `project_context_token_budget` with the verdict **and the data**.

⚠️ **If `scripts/mcp-observation-metrics.mjs` is edited during the window, the comparison is void.** Note the change and re-baseline. Same instrument, both windows, or it is not a measurement.

⚠️ **Do not draw the conclusion early.** A 3-day read is a different experiment, and the temptation will be strongest if the first two days look decisive.
