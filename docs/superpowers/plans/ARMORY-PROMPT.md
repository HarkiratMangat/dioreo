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

## The overlay tier — IN SCOPE, and cheaper than it looks. Budget ≤4 calls.

**Already decided, do not re-open:** the conformance plan's realm table, row 2, says Armory *"earns the full overlay treatment incl. the interaction tier."* It is the second-densest reference (99.6KB, 13 handlers, 48 data-attrs). This section is the METHOD and the BUDGET, not a re-litigation of whether.

🔴 **RUN `--triggers` BEFORE OPENING ANYTHING. Most of what looks like overlay work is not.** Measured 2026-08-31 16:0x EDT, one call, zero overlays opened — these are already found, so **do not spend the call again, spend it confirming they are still true**:

| Mockup | Portal | Kind |
|---|---|---|
| `New MP build` **N** · `New DMZ build` | `New MP build` **B** · `New DMZ build` **D** | keyboard hints differ / invented |
| `MP` · `DMZ` | `MP ×2` · `DMZ ×2` | portal appends a count the design has not got |
| `+ Add build` | `+ Add` | truncated label |
| `dior` | `…2283` | the identity chip renders a raw **id**, not a name ⚠️ see Season's row — the raw id is an adjudicated PRIVACY question, not a conformance fix; check before "fixing" it |
| `Assault 35` · `SMG 26` · `LMG 12` · `Marksman 14` · `Sniper 19` · `Shotgun 10` · `Secondaries 9` | *absent* | **seven category chips missing entirely** |
| — | `Best in category18one weapon per category` | fused accessible name, no separators — PASS 6's class of defect |

**Every one of those is a resting-page finding.** They land in ③ WORDS and the inventory, not in an overlay diff.

🔴 **WHY ≤4 CALLS IS DEFENSIBLE: overlay conformance is mostly a DERIVATIVE of shell conformance, and that is verified for Armory rather than assumed.** `armory.js` imports `useOverlay` from `overlay.js`, `Shell`/`Masthead` from `shell.js`, plus `manifest.js`, `exportPanel` and `async.js`'s `RealmShell`. **It builds no overlay chrome of its own** and references `Overlay` ×2 and `Confirm` ×1 — two or three distinct surfaces, not Season's six composer kinds. The scrim, panel frame, header, button row and type scale are all Season's, already conformed. That is why Season's own overlays measured 0.2–1.2%: the shell was right underneath them. Season's overlay pass was expensive because it was FIRST — `--open`, `--open-sel` and `--triggers` were all built during it, and Armory inherits finished instruments.

**The budget, stated so it can fail:** `--triggers` (spent) · one `--open` per distinct surface · one re-run. **If the overlay tier exceeds 4 calls, the derivative claim above was WRONG and that gets written into this file**, exactly as a resting pass over 10 gets written into §0.7c.

⚠️ **Three ways the derivative claim could still break, in order of likelihood:**
1. **`--triggers` filters out data rows**, so an overlay reachable only from a build row will not appear. The inventory is a FLOOR on what exists, never a ceiling — Season needed `--open-sel` for exactly this.
2. **Season's trapped-scrim finding proved an overlay inside `main` is a DIFFERENT component** from one at the root: inherited type, clipped stacking context. If Armory mounts at a different depth, sharing the module saves nothing. **The first `--open` tests this** — a reading near 0.2% confirms inheritance is real and the second surface is nearly free.
3. **A finding can enlarge its own surface.** If the seven missing category chips gate filtered views, building them may reveal surfaces that do not render today.

## Model for this session

`Premise Low · Delib High → Sonnet5-High`. The audit produces the findings, so the facts are given and checkable; the load is breadth across many sites, not judgement about whether the framing is right. **Running a conformance realm on Opus is a large part of why this phase has felt expensive.** Escalate on events only — a premise turning out false, or two hypotheses wrong.

## Two things Season's numbers do NOT transfer

⚠️ **Armory's resting-pass triage ratio will NOT be 23-of-169.** Season's ratio collapsed because 83 of its 169 rows were CITED by decisions made minutes earlier in the mode collapse (2026-08-31). Armory has no collapse behind it — its findings are genuinely open, and a session assuming a similar ratio is assuming Season's history onto a realm that doesn't have it.

⚠️ **§0.7c (the four-call resting-pass loop) is UNTESTED, and its own falsifier is Armory.** State this before starting: Armory's resting pass must complete in **≤10 calls**, or the failure gets written into §0.7c's own text the way an equivalent gap was written into §0.7a. Track the call count as you go; do not reconstruct it afterward from memory.

## Before probing anything that might already be decided

Query `docs/reference/portal-decision-ledger.md` with `ctx_search`, batched with the realm's audit via `ctx_batch_execute` in the same round trip. The ledger annotates, it never filters — a hit means "go check," never "ignore this finding."

## What is NOT in scope for Armory yet

Redesigns stay stood down until **all six realms** match (Season, Armory, Broadcast, Access, Analytics, Review) — this is re-affirmed in `CLAUDE.md`, do not re-derive it. The re-apply list for what the mode collapse deleted lives in `docs/db-deferred-list.md`'s "RE-APPLY QUEUE" entry and is Armory's business only once its own resting pass closes.
