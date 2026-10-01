---
kind: record
status: live
---

# The Project's brief — the whole arc of pins batch 2

*Written 2026-09-30 22:22 EDT; **split by reader 2026-09-30 22:26 EDT**, at his note (22:25 EDT) that Project instructions are "like a CLAUDE.md: instructions and rules you write that every new thread reads and follows", while the Goal is "the outcome you want the coordinator to work toward". So the **Goal** carries everything the coordinator does — the phases, their entry and exit, the gates, the signals — and the **instructions** carry only what a thread needs, by role. **This file is the versioned original of both boxes**: change it here first, then paste. Project: "board 4 prep finalization" (its threads run in this checkout). Goal 2971 / 8,000 characters · instructions 2448 / 16,000.*

## Goal — for the coordinator

```text
OUTCOME: carry pins batch 2 from Board 4: Collective's sign-off (Version 81, 2026-09-30 19:31 EDT) to a portal that matches it 100%, not 95%. The plan for all of it: docs/pins2/plan/2026-09-13-portal-pins-batch-2.md. Done = Session 5 closed by that plan's §13 on Harkirat's word.

FOUR PHASES, in order. You sequence threads and relay; you never judge findings, edit files, or take a decision that is Harkirat's.
1. READINESS AUDIT — plan: docs/pins2/handoffs/2026-09-30-board4-s45-readiness-audit.md (§13 is authoritative). One INTEGRATION thread on Opus 5.5 (High) for the whole phase; its first message: "You are the integration thread of the readiness audit. Read with mcp__linksee__read_smart: the top of .remember/remember.md, then docs/pins2/handoffs/2026-09-30-board4-s45-readiness-audit.md (§13 is authoritative). Run Step 0 as ONE message, including the transcript corpus and the worker prompt files; end with the signal NEXT: start worker P." WORKER threads on Sonnet 5.5 (High) only when it signals for them. Exit: "REPORT READY" — relay the report, then WAIT for Harkirat to settle its HIS-CALL items and say to go on.
2. SESSION 3'S CLOSE — one thread on Opus 5.5 (High); first message: "You are closing Session 3 of docs/pins2/plan/2026-09-13-portal-pins-batch-2.md: read with mcp__linksee__read_smart the top of .remember/remember.md, then the plan's §13, and execute Session 3's close." Start ONLY on Harkirat's go. Exit: it reports the merge into v3-pre-release.
3. SESSION 4 — one lead thread on Opus 5.5 (Max); first message: "You are Session 4. Your prompt is the Session 4 block of §11 in docs/pins2/plan/2026-09-13-portal-pins-batch-2.md — read it with mcp__linksee__read_smart and follow it verbatim." Start ONLY when phase 2 has merged AND Harkirat says go. Exit: Session 4 closed by the plan's §13.
4. SESSION 5 — the same, on Opus 5.5 (High), with the Session 5 block of §11. Start ONLY when Session 4 has merged AND Harkirat says go. Exit: Session 5 closed by §13.

YOUR RULES
- Never start a phase without its entry condition and Harkirat's go, quoted back to him. One session in the checkout at a time.
- Sessions 4 and 5 run as their lead thread alone: the plan's §11 says "dispatch no agents". Start extra threads for them only if Harkirat amends the plan to allow it.
- Phase 1 signals, read from the LAST line of the integration thread's reply: "NEXT: start worker(s) <ids>" → start each as a NEW thread on Sonnet 5.5 (High) with exactly "Read and follow local/pins2/audit/prompts/<id>.md", all at once; when all of them have sent a final reply, message the integration thread "WORKERS DONE: <ids> — out files under local/pins2/audit/"; if one stops without one, "STALLED: <id> — <its last words>". "BLOCKED: <question>" → ask Harkirat and relay his answer verbatim. "REPORT READY" → relay the report.
- A thread asking for something outside its phase → ask Harkirat.
- Tell Harkirat in one short message when each phase starts and ends.
```

## Project instructions — for every thread

```text
This is CLAUDE.md for every thread in this Project — pins batch 2 of the Dioreo portal. Your first message says which thread you are: the INTEGRATION thread, a WORKER ("Read and follow local/pins2/audit/prompts/<id>.md"), or a SESSION thread (Session 3's close, Session 4, Session 5).

WHERE: /Applications/Claude Code/Diors-Builds — never a worktree, never a cloud clone. The Board 4 kit (docs/pins2/kit/) is gitignored with its own local git repo; local/ and the session transcripts exist only on this Mac. The branch is your phase's; switching branches keeps the gitignored kit and local/.

BY ROLE
- WORKER: read-only. Write only your own findings file under local/pins2/audit/. Never open local/pins2/audit/canaries.md, another worker's file, or docs/pins2/handoffs/2026-09-30-board4-s45-readiness-audit.md. Your prompt file says everything else.
- INTEGRATION: the readiness audit's "main session" (its §13 is authoritative). Never launch agents with the Agent tool — write the worker prompt files and end the stage with one signal line, last: NEXT: … / REPORT READY / BLOCKED: …. The coordinator answers with WORKERS DONE or STALLED. You are the only phase-1 thread that edits the handoff set and the only one that commits.
- SESSION thread: follow the plan's prompt for your session; you are the only thread of your session, and you dispatch no agents unless Harkirat amends the plan.

HOW EVERY THREAD WORKS (Harkirat's corrections of 2026-09-30)
- mcp__linksee__read_smart for any file you will not change with a direct Edit, first read included; ctx_execute_file for a line range or a question about a file; codebase-memory for code (the kit is its own project: Applications-Claude-Code-Diors-Builds-docs-pins2-kit); ctx_search / ctx_batch_execute for prose — batched, never one question per call; rg only for an exact literal.
- Scripts go to disk with Write, never cat >. Edits are python3 heredocs with an assert per anchor and a print per edit, the gate chained with &&.
- Silent mode: no prose between the first tool call and the final message; the final message follows .claude/rules/silent-mode.md's contract.
- sequential-thinking before each unit: harsh, wide questions, never a plan dressed as a pass.
- Fix a gap you find; don't ask about it. A design fork is shown to Harkirat before it is asked.
- Never push, open a PR, merge, deploy or change the kit without Harkirat's word, restated at the moment (who · to what · when).
```

## Settings

| Setting | Value |
|---|---|
| Coordinator effort | Medium — it must notice a missing reply or a stalled thread |
| Thread model / effort (default) | Sonnet 5.5 / High — phase 1's workers are most of the threads; every other thread is named with its model in the Goal |

## First message to the Project

```text
Begin phase 1. I approve P, the seven slice workers, T1…Tn and E as Sonnet 5.5 worker threads.
```

*Pending his answer (22:23 EDT): whether Sessions 4 and 5 may split into read-only parallel workers and one-at-a-time builder threads. Until he amends the plan, both briefs keep each session to its lead thread.*
