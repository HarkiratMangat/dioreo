---
kind: plan
status: live
---

# OWED — the starting prompt for the next session

> 🔴 **THE BLOCK IN §1 IS AN OPENER AND IS NOT A SUMMARY OF THIS FILE. Read the whole thing before acting on it.**
>
> The opener says what to do and in what order. It does **not** carry §3, and §3 is the half that stops a paid mistake being repeated — that reduced motion is dropped, that `.claude/settings.json.impeccable-bak` must stay untracked, that no subagent is dispatched until triage has run, that no turn estimate is given before the unknowns are verified.
>
> Nor does it carry **§4, the compliance half**, which exists only in this file: the ten corrections Harkirat made on 2026-09-06, the tool-routing table, the nine mechanical traps that each cost turns, and the five judgement failures. **A session handed only the opener will batch badly, write walls of prose, and rebuild things that were already built — because nothing in the opener forbids any of it.**

*Written 2026-09-07 00:51 EDT. Tracked on purpose — a gitignored handoff does not survive a fresh clone, and this is the file the next session is told to open first. Narrative half: `local/handoff/2026-09-07-owed-items-handoff.md`.*

## 1 · The prompt

```
Read docs/superpowers/plans/OWED-PROMPT.md IN FULL before any other tool call, then local/handoff/2026-09-07-owed-items-handoff.md.

FOUR owed items, in THREE units of work: (a) the §L⑥ remainder, (b) a harness delay knob, (c) states registries for broadcast/review/home, (d) 78 literal colours. **(b) and (c) are one unit** — the knob is what makes the async states reachable, so registering them without it produces states nothing can walk. The list below keeps all four numbered because you do them in that order; steps 2 and 3 are one unit and ship together.

DO THEM IN THIS ORDER:
  1. TRIAGE the §L⑥ remainder. THEY LIVE IN ONE PLACE: `docs/db-deferred-list.md`, the entry headed "The §L ⑥ two-agent audit's remainder" (around line 939). §L is section L of `docs/superpowers/plans/2026-08-27-portal-conformance.md` and ⑥ is its reader-test condition — you do not need to read either to do this. The entry lists its findings as bullets, each ending in a **Verify:** line. Run ONLY those Verify commands. Record pass/fail as a table in your reply; do not write a file and do not open a source file to fix anything yet. ⚠️ **The records step is NOT skipped, it is DEFERRED** — an item triage proves dead is closed into `docs/archive/resolved-list.md` per §4c, but AFTER the triage table exists, not during it. On 2026-09-06, five of the NINE step-3 bucket-A items — a DIFFERENT, now-closed set — turned out already done, and two more were refuted by one measurement. That is the base rate to expect here, not a claim about these seven.
  2. The harness delay knob. WHAT IT IS: `portal/ui/harness/` builds a page that runs the real components against fixtures, with `portal/ui/harness/stub.js` aliased over `httpClient.js` by an import map — so `fetchJson` returns canned data INSTANTLY. Three async states (`refreshing`, `slow`, `progress`) exist only while a request is in flight, so against an instant stub they enter and exit inside one microtask and never survive a render commit. The knob is a way to make that stub resolve slowly on demand. `scripts/portalStates.mjs`'s registry already walks a `slow=4000` case, so a seam may exist — LOOK BEFORE BUILDING ONE. Small, and it unblocks 3.
  3. States registries for broadcast, review and home. WHAT ONE IS: a JSON file per realm at `portal/fixtures/states/<realm>.json` — `{surface, note, states:[{name, query, expect}]}` — where `expect` is a CSS selector that proves the walk actually reached the state. `node scripts/portalStates.mjs --ci` opens each and runs its passes. Five realms have one (`season` `shell` `armory` `analytics` `access`); these three do not, so nothing has ever opened their drawers in a test. The knob exists by then, so the async states register in the SAME pass.
  4. The 78 literal colours. Invoke the SKILL — `Skill(skill: "impeccable", args: "extract portal/ui")` — it is not a shell command. `extract` is "pull reusable tokens and components into design system", which is exactly this job. Finish with `node scripts/portalGeometry.mjs --all --check` and `node scripts/portalDiff.mjs --realm <r> --portal harness` on the realms whose colours moved (it takes ONE realm; `npm run portal:sweep` does all seven in a pass), because collapsing a colour ramp CHANGES RENDERED PIXELS and "just declaring them" is a prediction, not a measurement.

A FILED ITEM IS A CLAIM WITH A VERIFY CONDITION, NOT A FACT. Run the Verify before you build anything. Before any pop-up asking Harkirat to decide, ctx_search docs/reference/portal-decision-ledger.md.

BATCH. A step in a plan is not a message. Group every call whose input you can write RIGHT NOW without seeing the previous result, and issue them together. The test is never "are these independent".

Branch docs/build-out-handoff at ed5ddf66, nothing pushed, PR #186 stays open and unmerged. Push, PR and merge each need Harkirat's approval restated at the moment of the action; branch commits are free.
```

## 2 · Why each line is in it

| Line | The failure it prevents |
|---|---|
| Triage before fix | **Five of nine** filed step-3 items were already done on 2026-09-06, and two more were refuted by a single measurement. Building them would have been pure waste |
| The knob before the registries | Registering a state the harness cannot reach is the "vacuous state" failure `portalStates.mjs` already records in its own comments |
| `impeccable extract` | The command table was never read; `detect.mjs` (the finder) was used while `extract` — *"pull reusable tokens and components into design system"* — sat unused. Harkirat spotted it |
| Geometry + diff after the colours | *"mostly declaring, not repainting"* is a PREDICTION. If `extract` collapses the black ramp from 9 alphas to 3 tokens, every scrim on the portal changes |
| Batch, with the rewritten test | *"are these independent?"* returns **no** for everything under uncertainty, which is exactly when a run is longest. 28 turns went on one item against an estimate of 7 |
| Ledger before a pop-up | Four settled decisions were put to Harkirat as live work in one day |

## 3 · What the next session must NOT do

- **Do not open a §L⑥ file before its Verify has been run.** Triage is a scripted pass, not seven investigations.
- **Do not dispatch a subagent yet.** There is exactly ONE opportunity — the §L⑥ items that SURVIVE triage — and the threshold is **≥3 survivors**. Below that, do them inline: an agent re-reads a large transcript to hand back two fixes. Colours, registries and triage itself are all wrong shapes for an agent.
- **Do not touch reduced motion / PASS 5.** Harkirat dropped it 2026-09-07: *"reduced motion isn't important, skip that."*
- **Do not commit `.claude/settings.json.impeccable-bak`** — it is the pre-move backup of the settings file and is deliberately untracked.
- **Do not re-enable `Stop__PARKED_NEEDS_REFINING`.** Two hooks sit there on purpose, each with a filed refinement.
- **Do not push, PR or merge** without approval restated at the moment of the action.

## 3b · 🔴 THREE SURFACES THIS SESSION CREATED THAT YOU MEET BLIND

*None of these existed before 2026-09-06. All three will fire on you without warning and are EXPECTED, not errors.*

| Surface | What you will see | Why |
|---|---|---|
| **`Stop` is LIVE again with three hooks** | A block if your message says *"left it as-is rather than fixing"*, or gives an effort RANGE like "medium-high" | The bucket was off all of 2026-09-06 and was re-enabled at its end. `DEFERRAL-TELL`, `EFFORT-RANGE` and the impeccable hook are live; **two others are parked** under `Stop__PARKED_NEEDS_REFINING`, a key the harness does not know |
| **The sweep fires on your FIRST `git commit`** | A long COMPLETENESS SWEEP block listing angles not taken | It moved off `Stop` onto `PreToolUse`/Bash for commit-or-merge verbs. **It never denies** — it emits `additionalContext`. Work through it or say which angles do not apply; do not treat it as a failure |
| **`.claude/settings.json` is COMMITTED with that new shape** | nothing visible | So a worktree or a fresh clone inherits it. Peer sessions on other branches do NOT have it until this merges — which is why the DEVLOG entry is the only warning anyone gets |

## 3c · A PREDICTION THIS FILE MAKES ABOUT ITSELF, so it can be graded

🔴 **If §4 worked, your FIRST evidence-gathering move is ONE batched call, not four sequential ones.**

That is observable in your own transcript and it can fail. On 2026-09-06 the first four turns were `cat`, `wc`, `cat`, `sed` — four round trips for files named in the user's own message. The last ten turns of that session were mega-batched heredocs with the gate chained on. **Nothing about the rules changed between those two halves; six corrections did.** The working style was acquired per session and decayed at the boundary. This file exists to make the END-of-session style available at the START, and the first ten turns are how you tell whether it did.
- **Do not give a turn estimate** until the unknowns are enumerated AND verified. Two estimates were wrong by 4× on 2026-09-06.

## 4 · 🔴 THE COMPLIANCE HALF — every one of these cost real turns on 2026-09-06

### 4a · How to work

| Rule | The measured failure |
|---|---|
| **A step in a plan is NOT a message.** Group steps that can share one | `superpowers:writing-plans` mandates one action per step and never mentions a turn. **28 turns on one item.** The method is THE CONFORMANCE PASS in `docs/reference/session-handoff-guide.md` |
| **The batching test is "can I write this call IN FULL right now, without seeing the previous result?"** | "Are these independent?" returns *no* under uncertainty — the loophole opens exactly when it matters |
| **Session start is the MOST batchable moment**, not a warm-up | Three `cat`s and a `wc` of files named in Harkirat's own message |
| **The habit attaches to Bash and does not transfer.** Check the browser and MCP steps | `browser_batch` used twice in ~10 browser turns |
| **`sequentialthinking`: length follows the question.** Never pad to a preset number | *"why are you wasting so many sequential thinking thoughts on such tiny 1 off questions"* |
| **Run anything minutes-long with `run_in_background: true`** and do other work while it runs | `npm test` is ~2.5 min and was run in the FOREGROUND twice on 2026-09-06 with nothing else happening. Harkirat: *"so much wasted time on these full suites when you couldve had the agent re-running the entire time"* |
| **Zero mid-run prose.** Questions go in pop-ups | *"HOLY FUCKING PROSE AND WALLS OF TEXT"* |
| **Every summary is a TABLE.** Formatted, navigable, scannable | *"I HATE LONG PROSE, idk what to read or where and i get overwhelmed"* |

### 4b · Tool routing — this was corrected twice in one session

| Instead of | Use |
|---|---|
| `cat` / `sed` / `head` on a file you will not `Edit` | **`mcp__linksee__read_smart`** — first read included |
| `rg` for a question about PROSE | **`ctx_search`** — measured 5/5 vs `rg`'s 1/6 on ledger selectors |
| several `Bash` calls whose output you will process | **`ctx_batch_execute`** with `commands` + `queries` |
| a grep dressed as `ctx_execute` | `ctx_execute` **captures**, `ctx_search` **filters**. Never narrow inside the capture. Under ~20 lines, plain Bash is correct |
| hand-tracing a symbol | `codebase-memory` `search_graph` |

### 4c · The traps that cost turns — all mechanical, all preventable

| Trap | The assert that stops it |
|---|---|
| A **backtick inside an HTML comment** inside a template literal | `assert not re.search(r'<!--(?:(?!-->).)*`', s, re.S)` before the write |
| A comment rewrite that **loses its `/*` or `*/`** | Scan comment SPANS. A raw count of the two tokens is the WRONG instrument — they appear inside comment prose |
| A **python f-string eating `{display:flex}`** | Do not f-string CSS or JS. Concatenate |
| **Two heredocs in one command** | Their BODIES appear in the order the redirections do. Put the first heredoc's body first |
| **`echo "gate exit=$?"` after `&&`** | Reports the exit of whatever ran LAST. Use `if npm test; then … else … fi` |
| **`rg` with a lookbehind** | `(?<!…)` needs `--pcre2`; without it the search fails **silently** |
| Clicking a toggle **without reading `aria-expanded`** | Half the browser turns went on closing what I meant to open |
| **A heredoc that writes a MULTI-LINE COMMENT** | 🔴 **Hit THREE times on 2026-09-06/07 and it is the same one every time.** `docs:reflow-comments` is a BLOCKING gate in `npm test`, and a comment block written by a heredoc is hard-wrapped by default, so the suite goes red at a commit with nothing at commit time saying so. **Chain `npm run docs:reflow-comments -- --write` onto any heredoc that writes a comment**, the way the gate is chained onto an edit |
| **`git add -A`** | Always name paths. `.claude/settings.json.impeccable-bak` must stay untracked |
| Marking a closed item **`- [x]` in place** | A closed item leaves the active list only by appearing in `docs/archive/resolved-list.md`. `docs-audit` catches it |

### 4d · The judgement failures — these are the expensive ones

| Failure | What it looked like |
|---|---|
| **Asserting a defect in a mechanism without reading why it is that way** | Claimed `usage-guard.mjs`'s turn-30 trigger was "wrong". Its own comment says *"a cost alarm is the wrong place to first learn good practice"*, and the threshold had already been RAISED from 25 by Harkirat |
| **The near-neighbour** | Reached for `detect.mjs` because it was familiar; `extract` is the command for the job |
| **Estimating from someone else's unverified prediction** | Costed C1 at 7 turns from the filed item's own guess. Three of its nine sub-claims were wrong; it took 28 |
| **Building what was already built** | 5 of 9. Always run the Verify first |
| **A check that cannot fail** | Two "does it deny?" proofs were written against a helper that unwraps the JSON. Assert on RAW output |

## 5 · State

| | |
|---|---|
| Branch | `docs/build-out-handoff` · v3.79.0-pre |
| **HEAD when this was written** | **`365c6534`** — 🔴 **`git log -1 --format=%h` FIRST. If it differs, every gate row below is about a tree that no longer exists and none of them apply.** This is the one number in this file that goes stale by itself |
| Pushed | **No.** PR #186 open, **do not merge** |
| Commits this session | `6d57e68d` · `06da92ca` · `ed5ddf66` · `dcc814ef` · `3d355c11` · `b029f541` · `d702f9cf` |
| **`npm test`** | 🟢 **PASS at `365c6534`**, run 2026-09-07 01:30 EDT. ⚠️ It was RED for three commits before that and nothing at commit time said so — `npm run handoff` caught it |
| Other gates | `docs:audit` PASS · hooks **36/36** · states **56 @ exit 0** · reverse-orphans matches baseline |
| Tree | clean except the deliberate `.claude/settings.json.impeccable-bak` |
