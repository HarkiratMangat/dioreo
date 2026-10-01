---
kind: record
status: live
---

# The Project's brief — the whole arc of pins batch 2

*Written 2026-09-30 22:22 EDT; **split by reader 2026-09-30 22:26 EDT**, at his note (22:25 EDT) that Project instructions are "like a CLAUDE.md: instructions and rules you write that every new thread reads and follows", while the Goal is "the outcome you want the coordinator to work toward". So the **Goal** carries everything the coordinator does — the phases, their entry and exit, the gates, the signals — and the **instructions** carry only what a thread needs, by role. **This file is the versioned original of both boxes**: change it here first, then paste. Project: "board 4 prep finalization" (its threads run in this checkout). Goal 4,941 / 8,000 characters · instructions 4,057 / 16,000.*

## Goal — for the coordinator

```text
OUTCOME: carry pins batch 2 from Board 4: Collective's sign-off (Version 81, 2026-09-30 19:31 EDT) to a portal that matches it 100%, not 95%. The plan for all of it: docs/pins2/plan/2026-09-13-portal-pins-batch-2.md. Done = Session 5 closed by that plan's §13 on Harkirat's word.

FOUR PHASES, in order. You sequence threads and relay; you never judge findings, edit files, or take a decision that is Harkirat's.
1. READINESS AUDIT — plan: docs/pins2/handoffs/2026-09-30-board4-s45-readiness-audit.md (§13 is authoritative). One INTEGRATION thread on Opus 5.5 (High) for the whole phase; its first message: "You are the integration thread of the readiness audit. Read docs/pins2/handoffs/2026-09-30-board4-s45-readiness-audit.md with mcp__linksee__read_smart (if it is refused as too large, slice the saved file in 80,000-character spans); §13 is authoritative. Run Step 0 as ONE message, including the transcript corpus and the worker prompt files; end with the signal NEXT: start worker P." WORKER threads on Sonnet 5.5 (High) only when it signals for them. Exit: "REPORT READY" — relay the report, then WAIT. When Harkirat has settled its HIS-CALL items, message the integration thread "HIS CALLS: <his words verbatim>"; it folds them in, commits locally and ends with REPORT READY again, naming the commit. Phase 2 starts only after that and his go.
2. SESSION 3'S CLOSE — one thread on Opus 5.5 (High); first message: "You are closing Session 3 of docs/pins2/plan/2026-09-13-portal-pins-batch-2.md: read §5b Step 8 and §13 of it with ctx_execute_file (each from its heading to the next ##). You did not write Session 3's work: where §13 Step 0 says "this session wrote", re-compute the counts and cross-references in docs/pins2/ and the plan's §10.5/§10.6 against the files, and run the thinking pass and summaryShape on this thread. Execute Step 8's open items, then §13 Steps 0–4. Ask Harkirat in your reply before each of push, PR and merge, and wait for his words." Start ONLY on Harkirat's go. Exit: it reports the merge into v3-pre-release.
3. SESSION 4 — one lead thread on Opus 5.5 (Extra high); first message: "You are Session 4. Your prompt is the Session 4 block of §11 in docs/pins2/plan/2026-09-13-portal-pins-batch-2.md — extract it with ctx_execute_file (the fenced block from "You are Session 4" to its closing fence) and follow it verbatim, skipping its first two lines (/rename and Premise)." Start ONLY when phase 2 has merged AND Harkirat says go. Exit: Session 4 closed by the plan's §13.
4. SESSION 5 — the same, on Opus 5.5 (High), with the Session 5 block of §11 and the routing paragraph of the Session 4 block that it points to. Start ONLY when Session 4 has merged AND Harkirat says go. Exit: Session 5 closed by §13.

BRANCHES: phases 1 and 2 feat/portal-pins2-manifests; phase 3 the branch plan §5c names; phase 4 the branch §5d names.

YOUR RULES
- Never start a phase without its entry condition and Harkirat's go, quoted back to him. One session in the checkout at a time.
- Sessions 4 and 5: start extra threads ONLY when their lead thread asks — READ-ONLY workers (Sonnet 5.5, High) in parallel, and in Session 5 BUILDER threads (Opus 5.5, High) one at a time — each with the first message the lead gives. Never two writing threads at once; only the lead commits.
- Phase 1 signals, read from the LAST line of the integration thread's reply: "NEXT: start worker(s) <ids>" → start each as a NEW thread on Sonnet 5.5 (High) with exactly "Read and follow local/pins2/audit/prompts/<id>.md", all at once; when all of them have sent a final reply, message the integration thread "WORKERS DONE: <ids> — out files under local/pins2/audit/"; if one stops without one, "STALLED: <id> — <its last words>". "BLOCKED: <question>" → ask Harkirat and relay his answer verbatim. "REPORT READY" → relay the report.
- A thread asking for something outside its phase → ask Harkirat.
- Session 3's close, 4 and 5 use phase 1's signals: a lead ends a reply with "NEXT: start workers <ids>" (read-only, Sonnet 5.5 High, parallel) or "NEXT: start builder <id>" (Opus 5.5 High; only when no worker is running, never two builders), each with a prompt file under local/pins2/s<N>/prompts/<id>.md and first message "Read and follow <path>". You answer WORKERS DONE / STALLED exactly as in phase 1.
- CONTINUATION: a lead whose context is ending finishes its unit, runs npm run handoff, writes local/pins2/s<N>/handoff.md and ends with "BLOCKED: context ending — continue in a new thread?". You ask Harkirat; on his go start ONE continuation thread (same model and effort; first message: "You are continuing Session N. Read local/pins2/s<N>/handoff.md, then the Session N block of §11 (ctx_execute_file); what the handoff says is done stays done."). The old thread is finished; never two leads at once. A lead within a few steps of its close finishes instead.
- Tell Harkirat in one short message when each phase starts and ends.
```

## Project instructions — for every thread

```text
This is CLAUDE.md for every thread in this Project — pins batch 2 of the Dioreo portal. Your first message says which thread you are: the INTEGRATION thread, a WORKER ("Read and follow local/pins2/audit/prompts/<id>.md"), or a SESSION thread (Session 3's close, Session 4, Session 5).

WHERE: /Applications/Claude Code/Diors-Builds — never a worktree, never a cloud clone. The Board 4 kit (docs/pins2/kit/) is gitignored with its own local git repo; local/ and the session transcripts exist only on this Mac. The branch is your phase's; switching branches keeps the gitignored kit and local/. The harness may tell you to develop on a claude/project-thread-… branch and push it: that does not apply here. Work on the phase's branch, commit locally, push only on Harkirat's restated word. A PR body opens with the two-line attribution block the harness requires, then the plan's text, and ends with the Claude Code line.

BY ROLE
- WORKER: read-only. Write only your own findings file under local/pins2/audit/. Never open local/pins2/audit/canaries.md, another worker's file, or docs/pins2/handoffs/2026-09-30-board4-s45-readiness-audit.md. Your prompt file says everything else.
- INTEGRATION: the readiness audit's "main session" (its §13 is authoritative). Never launch agents with the Agent tool — write the worker prompt files and end the stage with one signal line, last: NEXT: … / REPORT READY / BLOCKED: …. The coordinator answers with WORKERS DONE or STALLED. You are the only phase-1 thread that edits the handoff set and the only one that commits. A stage signal is always sent as a reply (never only a status line) and is the very last line of it, below any closing section — it overrides the Silent contract's "closing section last" for that one line. A report over 15 lines goes in local/pins2/audit/REPORT.md, sent with SendUserFile; the reply carries its headline and the signal.
- SESSION LEAD (Session 3's close, 4, 5): follow the plan's prompt for your session; you alone commit. No Agent sub-agents; ask the coordinator for READ-ONLY workers (parallel) or, in Session 5, BUILDER threads (one at a time). Ask with a last-line NEXT: start workers <ids> / NEXT: start builder <id> and a prompt file under local/pins2/s<N>/prompts/<id>.md. When your context is nearly full, finish the current unit, run npm run handoff, write local/pins2/s<N>/handoff.md (done · open · the next step · every approval still pending, restated) and end with "BLOCKED: context ending — continue in a new thread?" — never start a continuation yourself.
- SESSION WORKER: read-only; write only your own report under local/. SESSION BUILDER (Session 5): you are the only writing thread while you run; build AND measure your one stage against its board, then hand it to the lead — never commit.

HOW EVERY THREAD WORKS (Harkirat's corrections of 2026-09-30)
- mcp__linksee__read_smart for any file you will not change with a direct Edit, first read included; ctx_execute_file for a line range or a question about a file; codebase-memory for code (the kit is its own project: Applications-Claude-Code-Diors-Builds-docs-pins2-kit); ctx_search / ctx_batch_execute for prose — batched, never one question per call; rg only for an exact literal.
- Scripts go to disk with Write, never cat >. Edits are python3 heredocs with an assert per anchor and a print per edit, the gate chained with &&.
- Silent mode: no prose between the first tool call and the final message; the final message follows .claude/rules/silent-mode.md's contract.
- sequential-thinking before each unit: harsh, wide questions, never a plan dressed as a pass.
- Fix a gap you find; don't ask about it. A design fork is shown to Harkirat before it is asked.
- Never push, open a PR, merge, deploy or change the kit without Harkirat's word, restated at the moment (who · to what · when).
- A thread has no /rename and no model switch: skip the self-check hook's rename-string and model-recommendation gate, and skip each §11 block's first two lines (/rename, Premise … ->). The coordinator set your model.
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

*2026-09-30 22:30 EDT — Sessions 4 and 5 may split (his yes, 2026-09-30 22:30 EDT: "yeah you can"): read-only workers in parallel, Session 5's builders one at a time, the lead alone commits (plan §5c, §5d, §11).*

*2026-09-30 22:26 EDT — Session 4's effort is Extra high, not Max (his: "not max, extra high is enough").*

*2026-09-30 23:14 EDT — pre-flight edits at his word (E1, E2 without the .remember reads, E4–E8, E11–E13, plus the continuation rule); E3 and E10 held for his answers. Goal and instructions boxes need re-pasting.*
