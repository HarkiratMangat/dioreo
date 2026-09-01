# Silent-mode guards — parked here, NOT registered anywhere

**Three hooks:** `turn-shape-guard.sh`, `prior-run-cost.sh` and `audit-think-gate.sh`.

**Parked 2026-08-31 18:5x EDT by Harkirat's call:** *"better to not implement the turn hook than have it build half-ass. How about we move it out of this branch, into it's own worktree and fold it in as part of the overall larger 83 step plan?"*

## Why they were pulled out of `feat/portal-redesign-session-b`

They duplicate **Tasks 7–9** of `/Applications/Claude Code/2026-08-23-workflow-compliance-plan.md` (silent-mode ARM / CHECK / LOG), which has **0 of 83 steps done** and was written from a 155-session insight report. That report named narration as *"the single most repeated correction in the data"* nine days before these were built. **These were that plan happening by accident, without reading it.**

## What the plan has that these do NOT — this is the whole reason they are parked

| Plan | These |
|---|---|
| **Task 7 ARM** — a session-scoped flag set only when the prompt asks for silent mode, so the guard is inert otherwise | fires unconditionally |
| **Task 9 LOG** — `~/.claude/compliance-ledger.jsonl`, `{at, session, armed, interstitial, turns}` per stop, so *"did it work"* is answerable | no ledger; answering that question meant hand-rolling a transcript scan |
| **Task 5** — build `complianceReport.mjs` FIRST so a baseline exists before any guard | guards first, no baseline |
| 🔴 **Task 6 — a hand-labelled PRECISION GATE. Under 80% means the detector's definition is wrong and Tasks 7–10 are NOT BUILT.** | four detectors shipped, precision never measured |

## What they have that the plan does not — carry these forward, do not rewrite from scratch

- **A four-signal classifier instead of one binary test.** HEDGE (pre-registers intent) · ACK (contentless) · DUPLICATE (its distinctive words already in the run's own final summary) · CADENCE (prose keeping pace 1:1). A mid-run block that is none of those is a legitimate checkpoint and is deliberately not flagged. The plan's silent-mode counts interstitial blocks and cannot make that distinction.
- **Turn-start delivery.** `prior-run-cost.sh` is `UserPromptSubmit`, so the number arrives BEFORE the next run is written. Every plan guard is Stop-only, which is a receipt rather than a control.
- **Three defects already paid for, each with a regression test.** (1) `$firstTool` defaulting to `999` made every text-only message score as narration, so v1 fired hardest on compliant runs. (2) Requiring text and tool call in the SAME message matched 0 of 13,922 real messages — that shape does not exist in this transcript format. (3) A turn boundary is a HUMAN message whatever its content shape: an attachment gives array content, so a string-only detector skipped the boundary and summed two runs, which is why a reported figure climbed 47 → 57 across a run with one tool call.
- **Measured facts the plan should not re-derive.** Narration length runs 13 → 7,869 chars with mass in every band across 3,775 real instances, so **no length filter works in either direction — position and content decide, never size.** And no run-length threshold makes the one-at-a-time signal rare: ≥3 fires on 71.5% of 615 real runs, ≥8 on 51.4%, ≥20 on 30.1%.

## `audit-think-gate.sh` — added to this branch 2026-08-31 19:1x EDT

UserPromptSubmit. Fires when a prompt asks for an audit, review, verification or falsification and reminds that `sequentialthinking` is mandatory for those — the one clause of the working contract carrying the word *mandatorily*. **Parked for the same reason as the other two: its precision is UNMEASURED.** The 84% non-compliance figure that motivated it came from scanning transcripts, which cannot tell a typed prompt from a task-notification or injected hook feedback, and the sampled matches included all three. UserPromptSubmit sees only the real typed prompt so the hook should be strictly more precise than that measurement — but *should be* is not a number, and Task 6 exists to refuse exactly that. ⚠️ It also fires on prompts that merely contain "verify" or "review" in passing; observed live on a prompt about opening a PR.

## State

All three carry their `.test.sh` and were green when parked (30/30, 14/14 and 9/9). **Neither is registered in any `settings.json`** — they run only if something registers them. Fold them into the plan at Tasks 7–9 rather than re-registering them as they are.
