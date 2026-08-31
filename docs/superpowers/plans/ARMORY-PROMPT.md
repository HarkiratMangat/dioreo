---
kind: plan
status: live
---

# Armory's first prompt — paste this in, don't re-derive it

> Task 10, `docs/superpowers/plans/2026-08-31-post-compact-remediation.md`. Season's Batches 0–H were invented ad hoc, in a gitignored file, across many sessions. This is the paste-ready version so Armory does not repeat that.

## First action — receiving, before anything else

Per `docs/reference/session-handoff-guide.md`'s receiving section:
1. `npm run portal:status`
2. `npm run portal:audit -- --realm armory --all`

If those numbers disagree with anything below, THAT disagreement is the most valuable thing in the session — say so before doing anything else.

## The batch skeleton — capture → triage → one edit → close

Season's real batches, stripped to the shape that mattered, per batch:
1. **Capture** — run `portal:audit -- --realm armory [--view <tab>]`. Read the header block it now prints (Task 4): triage every finding into CITED / DEAD-ON-BOTH / ALREADY-SETTLED / FIX before doing anything else. Check the ⚠ ledger-annotation lines it prints against `docs/reference/portal-decision-ledger.md` with **`ctx_search`, never `rg`** — measured 1 of 6 vs 5 of 5 on the same questions.
2. **Triage** — sections ②–⑤ never cascade into each other; batch each section's fixes as ONE scripted edit, never one finding at a time. Section ① CASCADE is the one exception: fix it alone, re-run, and only then move to ②–⑤.
3. **One edit** — apply the batch, chaining the verification command into the SAME call (`node --check`, then re-run the relevant audit section).
4. **Close** — re-run `portal:audit` and confirm the section shrank or the remaining rows are all CITED/DEAD/SETTLED. State the budget spent against the estimate below before starting the next batch.

## Two things Season's numbers do NOT transfer

⚠️ **Armory's resting-pass triage ratio will NOT be 23-of-169.** Season's ratio collapsed because 83 of its 169 rows were CITED by decisions made minutes earlier in the mode collapse (2026-08-31). Armory has no collapse behind it — its findings are genuinely open, and a session assuming a similar ratio is assuming Season's history onto a realm that doesn't have it.

⚠️ **§0.7c (the four-call resting-pass loop) is UNTESTED, and its own falsifier is Armory.** State this before starting: Armory's resting pass must complete in **≤10 calls**, or the failure gets written into §0.7c's own text the way an equivalent gap was written into §0.7a. Track the call count as you go; do not reconstruct it afterward from memory.

## Before probing anything that might already be decided

Query `docs/reference/portal-decision-ledger.md` with `ctx_search`, batched with the realm's audit via `ctx_batch_execute` in the same round trip. The ledger annotates, it never filters — a hit means "go check," never "ignore this finding."

## What is NOT in scope for Armory yet

Redesigns stay stood down until **all six realms** match (Season, Armory, Broadcast, Access, Analytics, Review) — this is re-affirmed in `CLAUDE.md`, do not re-derive it. The re-apply list for what the mode collapse deleted lives in `docs/db-deferred-list.md`'s "RE-APPLY QUEUE" entry and is Armory's business only once its own resting pass closes.
