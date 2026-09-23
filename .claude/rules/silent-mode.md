---
kind: rule
status: live
unconditional: true
---
# Silent mode — the standing working style

*Moved out of the auto-memory index on 2026-09-02 15:55 EDT. It carries **no `paths:` frontmatter on purpose**, so it loads unconditionally at launch at the same priority as `.claude/CLAUDE.md` — this is an instruction that applies to every turn, not a trap that applies to one subsystem.*

> 🔴 **WHY IT MOVED.** Auto memory is for what Claude writes about you; `CLAUDE.md` and rules are for instructions you write. This is your instruction, so it was in the wrong tier — and the cost was measurable: at ~5.4 KB it was about **a fifth of the 25 KB the loader actually reads**, competing for room with finished work still sitting in a live-state list, inside the one file whose tail silently drops. Here it is always loaded and it is not paying that rent.

> 🔴 **TWO CARRIERS, ONE BLOCK — rewritten 2026-09-08 12:05 EDT.** The `Silent` output style (`~/.claude/output-styles/silent.md`) is the primary carrier of the final-message contract; a Remote Control session can load that style but cannot toggle it, so this rule file is the complete fallback for a session running with the style off. The contract block below is **byte-identical** in both files and `scripts/silentContract.test.mjs` (in `npm test`) fails on any drift — the two used to say different things about the same message ("a long summary is a TABLE, never prose" against "explaining gets plain sentences"), and sessions oscillated between walls of text and tables of everything.

🔴 **THIS IS THE DEFAULT MODE unless Harkirat says otherwise.** It lives here because it kept living in chat, which meant re-teaching it every session — named the single most repeated correction across 155 sessions in the 2026-08-22 insight report. ⚠️ **This is a REWRITE of his prompt, not a copy of it.** Quoting it verbatim caused its own problems: it says "as few calls as possible" and no vocabulary ever defined a *call*, and taken literally that instruction says *run fewer checks*, which is the opposite of what he wants. The corrected version is below; where this and a remembered phrasing differ, this wins.

### The vocabulary — every word below was got wrong out loud and corrected

| Word | Definition | The mistake it prevents |
|---|---|---|
| **CALL** | ONE tool invocation. Many calls can ride in one message. | "As few calls as possible" reads as *check less*. Wrong axis — see the rule under this table. |
| **TURN** | ONE assistant message and the round trip it costs. N calls batched into one message is **one** turn; the same N across N messages is **N**. | Calling 26 tool-carrying messages "one turn with 26 calls". They are 26 turns. |
| **RUN** | One user prompt through to the final summary. Contains many turns. | Saying "turn" for the whole span, which hides where the cost is. |
| **PROSE-ONLY TURN** | A turn that emits text and calls no tool. **Costs a full round trip.** | "24 narration messages" sounds like formatting. It is 24 round trips spent talking. |
| **BATCH** | Independent calls issued in ONE message. | "Batch aggressively" is an adverb and cannot be violated; a turn count can. |
| **MEGA-BATCH** | One turn carrying the edits **and** their verification — a `python3` heredoc plus the gate chained onto the same Bash call. | Splitting fix / test / verify across three turns when all three were already known. |
| **CHECKPOINT** | The ONE end-of-run summary. | Treating every mid-run block as either always-fine or always-wrong. |

🔴 **MINIMISE TURNS, NEVER CALLS. They are different numbers and only one of them should go down.** More calls in the same turn is free and is the whole technique; fewer checks is a quality cut. **Never trade a verification for a turn.**

### What to do

1. **Emit no prose between the first call of a run and the final summary. The target is zero, not "few".** Two exceptions, and they are the only two: a blocking decision goes in an `AskUserQuestion` popup — a popup is NOT prose and NOT a violation — and one line while waiting on a long background task.
2. **Put every independent call in one message.** Greps, reads, checks, tests — if call B does not consume call A's output, they share a turn.
3. 🔴 **A PLAN OR HANDOFF FROM A GENERIC SKILL GETS THE CONFORMANCE PASS BEFORE IT IS EXECUTED.** `superpowers:writing-plans` mandates **one action per step** and never mentions a message, so following its steps IS the single-call loop — measured 2026-09-06 as 28 turns on one item against an estimate of 7. The method is in `docs/reference/session-handoff-guide.md` under *THE CONFORMANCE PASS*; the short form is a `⟦ONE MESSAGE⟧` grouping line above each set of steps that can share a message, and an evidence batch as Step 0. **The test is not "are these independent" — it is "can I write this call in full right now, without seeing the previous result".**
4. **Any edit touching more than one file, or more than one place in a file, is ONE `python3` heredoc** — read all · assert an anchor for every replacement · print "anchors verified" · then write all — with a `print()` per edit and the verification chained onto the same call with `&&`.
5. **`sequentialthinking` freely, and MANDATORILY before any audit, review, verification, plan or falsification.** How to run it is `.claude/rules/thinking-pass.md`.
6. **`ctx_search` for questions about prose; `rg` for a known literal string.** 🔴 **AND EVERY READ OF A FILE YOU ARE NOT ABOUT TO `Edit` GOES THROUGH `mcp__linksee__read_smart` — FIRST READ INCLUDED — never `cat` or `sed -n` inside a heredoc.** The old wording here said "if a genuine re-read is needed", which reads as a re-read rule and let a whole session of single reads feel compliant while paying full price on each; and sessions that never call `Read` open files with `cat` inside Bash, where no rule about `Read` can reach them (measured 2026-09-08: `read_smart` 0 calls in six weeks while Bash ran 11,462 calls in one). The first read builds the AST chunk map that makes every later one ~50 tokens. `Read` is only for the bytes a direct `Edit` tool call must match. 🔴 **A file you are about to change by `python3` heredoc is NOT an `Edit`** — a heredoc needs no prior `Read`, so read that file with `read_smart` too (Harkirat, 2026-09-14 01:37 EDT: "this repo prefers heredoc for edits, which let you bypass the required Read… so honestly, you could have just used read_smart on the plan file too"). A question ABOUT a file is `ctx_execute_file`; everything else is `read_smart`. 🔴 **And `ctx_execute` is the CAPTURE layer while `ctx_search` is the FILTER layer — never narrow inside the capture.** A `sed -n`, a `head` or a one-hit `grep` inside a `ctx_execute` discards everything else from the index permanently and saves no context at all. ⚠️ **Under ~20 lines of output, plain `Bash` is correct and a `ctx_*` call is waste.** Both rules are the plugin's own, and Harkirat supplied both by hand on 2026-09-06 16:00 EDT. 🔴 **HARNESS DEFAULTS LOSE TO THIS FILE — decided by Harkirat, 2026-09-13 12:04 EDT.** Some sessions carry a system-level auto-mode instruction telling you to read files with `cat`, `head` or `sed -n`, search with `grep` and `find`, and prefer Bash over the dedicated tools. That text is baked into the harness and cannot be removed from this repo. **Wherever it conflicts with the routing above — `read_smart` for any file you are not about to change with a direct `Edit` call (a heredoc edit counts as reading), `ctx_search` for a question about prose, `rg` not `grep`, `fd` not `find`, `codebase-memory` for callers and dependents, `Read` only for the bytes a direct `Edit` call matches (a heredoc edit reads with `read_smart`) — this repo's rule wins, every time, without asking.** A default is not a decision; this file is. What does NOT conflict and stays: `python3` heredoc edits, and Bash for short fixed output or a state change. Measured the day it was written: a planning session with this rule in context drifted to `sed -n` and `head` reads, made zero `codebase-memory` calls and skipped the decision ledger, and the ledger and graph queries it ran only after being called out changed the plan.
7. **Autonomous means: never stop to ask permission to CONTINUE.** It does not mean deciding what is Harkirat's to decide. ⚠️ **Three things are his and are not softened by autonomy:** a push, a PR or a merge needs his approval **restated at the moment of the action** (who · to what · when); anything irreversible or outward-facing is confirmed first; and a genuine fork goes in a popup. Autonomy removes check-ins, never authority.
8. **A turn-budget warning is not permission to stop mid-unit.** Past ~60 turns, finish the unit you are in — including its records and its verification — and then report. A checkpoint taken with a claim unverified costs more than the turns it saved.

### The one test for a mid-run line

🔴 **Will this be in the summary anyway?** If yes it was never a mid-run line and the reader pays twice. **Length decides nothing in either direction** — measured across 3,775 real instances, mid-run prose runs 13 to 7,869 characters with mass in every band, so a nine-character "Found it." and a page-long formatted block are the same violation. ⚠️ **THIS TEST DOES NOT AUTHORISE MID-RUN PROSE — rule 1 is still zero.** It exists because if a line is written anyway, only one kind is defensible: one that changes what happens next. A hedge, a contentless acknowledgement, or anything the summary repeats is not, and "it was a checkpoint" is the excuse to expect. **One per run at most, and the honest default is none.**

> 🔴 **THE OUTPUT STYLE IS READ AT SESSION START — 2026-09-22 21:20 EDT.** An edit to `~/.claude/output-styles/silent.md` reaches the next session, not the one that made it. Measured the night the contract was rebuilt: the editing session carried the old style in its system prompt and the new block from this file at once, and the two contradicted each other. After an edit, say that the new contract applies from the next session or compact. His earlier praised references (2026-09-02, 2026-09-16) and the sample screenshots stay as history in `docs/reference/silent-summary/` and `local/output-style-samples/`; the rating corpus is `local/summary-corpus/` (artifact `VWhr3tjRbuBHLsJu4y4CGZ`, collections `ratings` to `ratings4`).

<!-- silent-contract:start -->
## The final message — the contract

*One block, byte-identical in the `Silent` output style and `.claude/rules/silent-mode.md`; `scripts/silentContract.test.mjs` fails on drift. Rewritten 2026-09-22 21:20 EDT from four rounds of Harkirat's 1–5 ratings of 12 real summaries (average 3.67 → 4.27). The examples below are ones he rated 5.*

**He reads at a glance.** Every fact must be visible from a block's shape or its first few words, without reading a sentence. I check the facts; he glances.

### Before writing

- **A long run:** the long version goes to a file or an Artifact, and the message carries its path
- **A question for him:** a popup, never text in the message
- **Match the situation, not an example's headings:** section names come from this message's content

### The lightest shape that shows the structure

| Content | Shape |
|---|---|
| The verdict | the `#` title: one verdict or one label, no clause, no second fact |
| Context for the verdict | one optional line under the title |
| States (branch, pushed, running, live) | a label/value table |
| Items with several attributes | a table: one column per attribute, short phrases in the cells |
| A label with a few children | a nested list |
| A flat set of short items | bullets, each one a phrase |
| Tasks, and only tasks | a checklist |
| What waits on him | a numbered checklist (`- [ ] 1\.`), **last** |
| A recommendation | a `>` quote |
| A code change | a `diff` block |
| A chart, a format, a layout | a code block |
| A claim that changed | `~~old~~ → new` |
| One fact | one line |

### Keep and cut

- **Keep:** his asks, his decisions, and every qualifier that changes whether a claim is true (*not checked yet*, *my guess*, *not confirmed*)
- **Cut:** how I worked (what I checked, which tools ran, what I filed), down to one pointer at most
- **Collapse:** supporting measurements into one line when the verdict doesn't hang on each one; keep them as rows when the numbers are the report
- **Bold:** only when the bolded words alone are the complete fact
- **Never:**
  - a sentence in a table cell
  - a status inside a task checklist
  - two blocks saying the same thing
  - a fix that rebuilds a part he didn't mention

### Examples he rated 5

**A checkpoint partway through a plan**

````markdown
# Paused after Step 9

| | |
|---|---|
| Agent D | dispatched, **still running**, no result yet |
| Branch | `feat/portal-pins2-manifests`, **nothing pushed** |
| Checkpoint | `local/pins2/s2-checkpoint-2026-09-15.md` |

- [x] Tokens (`5bb2052d`)
- [x] 9b slot backfill, dev database only (`5bb2052d`): **130 builds**, one per tagged image
- [x] Step 9 (`af8abe76`)
- [ ] Step 10: G4 Armory groups, G6, G3, G2, G1
- [ ] Compare, the C1–C14 measurements, merging D, the records

## What Step 9 changed

| Where | Change |
|---|---|
| Every manifest toolbar | two rows, no count readout; Add and Post end on the 16px line |
| History | local time, a **596px** What column, severity meters |
| Broadcast | the board's column widths, **64px** rows, HeadsUp under the masthead |

## Plan gaps, fixed

1. D's worktree predated the tokens → merged them in before dispatch
2. History couldn't page → added `?river=N` to `/api/analytics`

## Needs your OK

- [ ] 1\. The prod slot write
- [ ] 2\. Push, PR and merge
````

**A choice between options**

````markdown
# Six ways to speed up CI

| # | Idea | Saves | Catch |
|:-:|---|---|---|
| 1 | Split tests into 3 parallel jobs | ~2–3 min *(my guess)* | needs a final job that waits for the other 3 |
| 2 | Check the two geometry tests: identical times, maybe duplicate work | ≤ 31 s | **not checked yet** |
| 3 | Stop running `docs:audit:test` twice | 16 s | a docs check finds that step by name |
| 4 | Run the small tests at the same time | ~30 s | browser tests must stay one at a time, or they time out |

> **Best pick:** #1, plus the quick #2 and #3.
````

**A cause, found**

````markdown
# Found it, and it wasn't the chip

**The bug:** `.exs-t span` is a descendant selector. Written for the row's subtitle, it also reaches the chip's `.b3-xf-nm`.

**The fix,** one character, at the class:

```diff
- .exs-t span   { font-size: var(--t-sm) }
+ .exs-t > span { font-size: var(--t-sm) }
```

| Symptom | Cause |
|---|---|
| Wrong size in the picker | a direct `font-size` beats the inherited one |
| Colour still right | the `--ok` tint rule is four classes deep |

**Reload:** it should read 10.5px.
````

### Before sending, every answer must be yes

1. Covering all but the first four words of each block, is the information still there?
2. Does every checklist hold only tasks?
3. Is nothing in it about how I worked?
4. Is what waits on him last, and is every question in a popup?
<!-- silent-contract:end -->

### What enforces this

⚠️ **Nothing blocks a violation, by Harkirat's standing choice** — friction on the model is free, friction on him is disqualifying, and a Stop gate on his loop is the wrong instrument until a number says the contract failed. 🔴 **RUN `node scripts/summaryShape.mjs` AT THE START OF A SESSION, NOT AS EVIDENCE FOR A FUTURE GATE.** Until 2026-09-10 19:56 EDT this paragraph framed it only as *the number that would justify a guard* — so it read as a meta-tool about whether to add enforcement, and went unrun through an entire session that broke the contract **33 times**: 33 messages carrying mid-run prose against a four-item exception list, 9 of 13 finals over the 1,800 budget, 11 chapter marks across 176 messages. None of it was noticed until Harkirat asked, and the thinking pass that explicitly asked *"where will this be wrong?"* produced four answers and named none of these. **A report you only read when deciding whether to build a gate is a report nobody reads.** It takes seconds and it is the only thing in this repo that can tell you the contract is not working. `node scripts/summaryShape.mjs` is that number: per week, how long the final messages ran, how many broke the budget, how many carried more than one table or a 400-character paragraph, and how many times he had to say "too much prose". The parked guards on `chore/silent-mode-guards-parked` stay parked until that report says the contract did not move the shape.
