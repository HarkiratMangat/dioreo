---
kind: plan
status: live
---

# Armory's first prompt — paste this in, don't re-derive it

> Task 10, `docs/superpowers/plans/2026-08-31-post-compact-remediation.md`. Season's Batches 0–H were invented ad hoc, in a gitignored file, across many sessions. This is the paste-ready version so Armory does not repeat that.

## Before anything: the mode

🔇 **Silent mode, per `MEMORY.md`'s `🔇 SILENT MODE` section** — auto-loaded, already in context. No narration between tool calls, one structured summary at the end, batch aggressively, `sequentialthinking` mandatory on any audit or review. The vocabulary is there too (**turn · run · prose-only turn · batch · mega-batch · checkpoint**), and it matters here specifically: this realm's budget is stated in CALLS, and a call is a turn.

⚠️ **No hook enforces it.** The guards are parked on `claude/silent-mode-compliance` pending the 83-step workflow-compliance plan.

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

🔴 **FALSIFIED 2026-08-31 20:50 EDT.** `--triggers` (1 call) + one `--open "+ Add build"` + one `--probe` to check its own new ① CASCADE line = 3 calls to characterize a SINGLE overlay surface, and the derivative claim's own "2-3 distinct surfaces" means the edit-drawer and the bulk-delete Confirm dialog are still unopened — the real total is well past 4. What the one opened surface showed: mostly resting-page findings already triaged (same span.k/span.v/mh-take-n pattern), the crumb-separator "cascade" turned out to be the ALREADY-CITED cross-realm SVG-vs-text-glyph decision showing up as the first offset (not a new defect), plus two genuinely new items — the breadcrumb doesn't update to name the open view ("Armory" vs mockup's "Armory Tier board"), and the identity chip (`button.whobtn`) renders empty instead of a name. The Add-build form's ~30 "ONLY IN MOCKUP" field-level SHAPE rows were NOT individually re-verified as pairing artifacts vs real gaps — every other SHAPE finding this realm turned out to be a class-rename pairing artifact, and that pattern is the working assumption here too, but it is an assumption, not a check. **The derivative claim held for the SHELL (the crumb/masthead chrome came for free); it did not hold for CALL COUNT, because each surface still needs its own diagnose-and-triage pass, same as a fresh cascade would.**

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


---

## 🔴 OUTCOME — the second pass, 2026-08-31 22:0x EDT. Read this before treating anything above as current.

**The first pass read the conformance plan at the END of its work.** It audited only the DEFAULT view and recorded *resting pass closed* in §L while Repairs, Compare and Bulk & export had never been looked at — and it wrote every date as **2026-09-01**, three hours in the future, into two plans, the decision ledger and the deferred list. Git dates its five commits 2026-08-31 20:40–21:19 EDT. All of those stamps are corrected; the lesson is `feedback_never_estimate_timestamps`, and the damage was that a ledger whose whole purpose is to be trusted by a later session carried twelve fabricated dates.

**What the second pass found, in one line each, in the order they matter:**

| Finding | Class |
|---|---|
| `RANK_KEY` emitted `t-t3`/`t-t4`/`t-t5`/`t-none` while BOTH stylesheets key on `.trow.t-top3`/`.t-top4`/`.t-top5`/`.t-unranked` — **four of the five Armory tier rules had never applied once**, so the graded marks and the `--bc-dim` card fade that make the board read as tiered were dead | live CSS, dead selector — the `id="mhAdd"` class again |
| Rack, Coverage and Compare each drew their own `.ph`, so the page had two view headers. `Shell` has carried a `meta` slot since Broadcast needed one; Armory never passed it | the design has one header |
| The export strip offered 2 of the 4 scopes `/manage` has | a capability gap, now built |
| A Manifest `mode` chip over rows already filtered by armoury — every non-default value guaranteed an empty table | a control that could only ever fail |
| The Manifest count divided by the rows handed in, not the catalogue | "125 of 125" over 133 builds |
| The tier rows' accessible name fused — htm drops a whitespace-only text node that spans a newline | PASS 6's class |
| `portalAudit --triggers` printed `season` as a literal on every realm | §0.5a R1, in the tool that enforces it |

⚠️ **The trigger table earlier in this file is now STALE in the good direction and is kept as the before-picture.** `+ Add build`, the seven category chips, `MP`/`DMZ`/`All ×2` and the fused accessible names are all closed; the ONLY-IN lists went **6+6 → 3+3**. The three survivors are the identity chip (a privacy decision) and the two `ADD_KEY` hints (deliberate, commented) — cited, not open.

⚠️ **The `≤4 calls` overlay budget is settled and should not be re-argued.** It failed for both passes and §0.6c already carries why. What this pass adds: **Armory's build editor and Add form are INLINE panels in `.bed`, not overlays** — which is what made the first pass's `--open-sel` result look "inconclusive". Clicking a row REPLACES the rack, so a shorter page is the correct answer. Only the bulk-delete `Confirm` is genuinely an unopened overlay, and it needs a row selected first.
