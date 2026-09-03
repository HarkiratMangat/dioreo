---
kind: rule
status: live
unconditional: true
---

# Silent mode — the standing working style

*Moved out of the auto-memory index on 2026-09-02 15:55 EDT. It carries **no `paths:` frontmatter on purpose**, so it loads unconditionally at launch at the same priority as `.claude/CLAUDE.md` — this is an instruction that applies to every turn, not a trap that applies to one subsystem.*

> 🔴 **WHY IT MOVED.** Auto memory is for what Claude writes about you; `CLAUDE.md` and rules are for instructions you write. This is your instruction, so it was in the wrong tier — and the cost was measurable: at ~5.4 KB it was about **a fifth of the 25 KB the loader actually reads**, competing for room with finished work still sitting in a live-state list, inside the one file whose tail silently drops. Here it is always loaded and it is not paying that rent.


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
3. **Any edit touching more than one file, or more than one place in a file, is ONE `python3` heredoc** with an `assert <anchor> in s` before each replacement, a `print()` per edit, and the verification chained onto the same call.
4. **`sequentialthinking` freely, and MANDATORILY before any audit, review, verification or falsification.**
5. **`ctx_search` for questions about prose; `rg` for a known literal string.** Never re-read a file already in context — `read_smart` if a genuine re-read is needed.
6. **Autonomous means: never stop to ask permission to CONTINUE.** It does not mean deciding what is Harkirat's to decide. ⚠️ **Three things are his and are not softened by autonomy:** a push, a PR or a merge needs his approval **restated at the moment of the action** (who · to what · when); anything irreversible or outward-facing is confirmed first; and a genuine fork goes in a popup. Autonomy removes check-ins, never authority.
7. **A turn-budget warning is not permission to stop mid-unit.** Past ~60 turns, finish the unit you are in — including its records and its verification — and then report. A checkpoint taken with a claim unverified costs more than the turns it saved.

### The one test for a mid-run line

🔴 **Will this be in the summary anyway?** If yes it was never a mid-run line and the reader pays twice. **Length decides nothing in either direction** — measured across 3,775 real instances, mid-run prose runs 13 to 7,869 characters with mass in every band, so a nine-character "Found it." and a page-long formatted block are the same violation. ⚠️ **THIS TEST DOES NOT AUTHORISE MID-RUN PROSE — rule 1 is still zero.** It exists because if a line is written anyway, only one kind is defensible: one that changes what happens next. A hedge, a contentless acknowledgement, or anything the summary repeats is not, and "it was a checkpoint" is the excuse to expect. **One per run at most, and the honest default is none.**

⚠️ **NOTHING ENFORCES ANY OF THIS.** The silent-mode guards are parked on **`chore/silent-mode-guards-parked`** (pushed to origin 2026-09-01 17:34 EDT; the original `claude/silent-mode-compliance` was a 315-commit unpushed branch and is deleted — its seven unique files were verified byte-identical on origin first) on 2026-08-31 because they duplicated Tasks 7–9 of `/Applications/Claude Code/2026-08-23-workflow-compliance-plan.md` (**0 of 83 steps done**) without its ARM flag, its ledger, or its 80% precision gate. Until that plan runs, **this section is the entire mechanism.**
