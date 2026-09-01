---
kind: plan
status: live
---

# Part 3 — Broadcast. Paste this in.

> Written 2026-09-01 by the Armory session, per §0.0. **It is deliberately a third the length of `ARMORY-PROMPT.md`, because Broadcast is a third the realm** — 39KB and 5 handlers against Armory's 96KB and 14. Handing over Armory's prompt unchanged would invite Armory-sized effort on a realm that does not need it, which is its own kind of waste.

## The two lines §0.0 requires before any task content

- `/rename Sonnet5-High · Broadcast conformance · <Mon DD>`
- `Premise Low · Delib High -> Sonnet5-High` — the audit produces the findings, so the facts are given and checkable; the load is breadth across sites. Escalate on events only.

## Branch state as of 2026-09-01

`feat/armory-portal-conformance`, PR **#177** into `v3-pre-release`, `package.json` `3.70.0-pre`, `npm test` green, CI `syntax-check` SUCCESS. **Check whether it merged before you start** (`git log --oneline -3 v3-pre-release`) — Broadcast's shared surfaces move with it.

## The mode

🔇 **Silent mode**, per `MEMORY.md`'s section — auto-loaded, already in context. No narration between calls, one summary at the end, batch aggressively, `sequentialthinking` before any audit or review. Nothing enforces it.

## First three calls, in this order

```bash
# 🔴 THE PREREQUISITES. portalAudit and portalInventory hardcode localhost:8900 and :8901 and spawn
# NOTHING — without these three they fail with connection-refused, which is what the first draft of
# this file would have done to you.
preview_start {name:"repo-static"}         # :8900, the mockup package — not batchable
preview_start {name:"portal-harness"}      # :8901, the built portal
node -e "require('./scripts/buildPortal').build()"   # :8901 serves BUILD OUTPUT; skip it and you measure the last build

npm run portal:status                      # the close-condition board is at the FOOT
npm run portal:audit -- --realm broadcast --view "Delivery queue" --all
npm run portal:audit -- --realm broadcast --view "Airtime" --all
npm run portal:audit -- --realm broadcast --triggers
npm run portal:inventory -- --realm broadcast
```

🔴 **`--all` LIFTS THE ROW CAPS ON ONE VIEW. IT DOES NOT WALK VIEWS.** Broadcast has two — `Delivery queue` and `Airtime` — and an earlier draft of this file gave a single `--all` call, which is precisely how Armory came to be recorded as closed with three of its four views never audited. `portal:status` prints each realm's view names; use them literally.

🔴 **`portal:status`'s close-condition board is new (2026-09-01) and it is the thing to read first.** It reports, per realm, whether each of `audit · inventory · diff · converge · realwalk` has run against the CURRENT `portal/ui`. It exists because Armory came one summary away from being reported closed with `portal:inventory` — §0.5a R4's own named close condition — never having been run on that realm once, because `portal:audit`'s five sections resemble the inventory's four lists and one was substituted for the other. **A row of `· never` is the honest starting state; do not treat Broadcast's recorded 0.2% as evidence anything has been checked recently.**

## What is actually true about Broadcast, and what is stale

| | |
|---|---|
| **Recorded** | resting pass closed, 0.2% / 0.3%, both views height-identical at 1258px |
| ⚠️ **Measured when** | **2026-08-28** — before the mode collapse, before the ④ reach change, before everything of 2026-08-31 and 09-01 |
| **Never done** | overlays have never been opened on this realm. `--triggers` has never been run on it |
| **Never done** | ④ has never been read under reach ranking, and Broadcast's nine ④ rows were ordered by repetition |

🔴 **A SMALL PERCENTAGE IS NOT EVIDENCE OF A SMALL JOB.** Armory's Tier board sat at 9.6% and hid twenty defects, four of which had **never rendered once** ⚠️ (an earlier draft said 8.4%, which is **Broadcast's own** pre-conformance figure from 2026-08-28 transplanted onto Armory — the argument survives the correction, the number did not) — a whole tier-grading system behind a renamed class. Broadcast at 0.2% has been measured on exactly one axis, at one width, in one state, by an instrument whose ordering was wrong until yesterday.

## The three instrument changes since Broadcast was last measured

1. **④ STYLE ranks by REACH**, not ×count — how many elements the difference is drawn through. A container difference now sorts above the same delta repeated on leaves. It also refuses to claim the ordering if the walk stops supplying descendant counts.
2. **`portal:audit --triggers` names the realm it ran on.** It printed `season` as a literal on every realm until 2026-09-01, so any earlier `--triggers` output on Broadcast was headed with the wrong subject.
3. **Every instrument leaves a receipt** in gitignored `local/.portal-receipts/`, which is what the status board reads — `audit · inventory · diff · converge · realwalk` and no others. `probe`, `geometry`, `states` and `reverse-orphans` write none, so a run of those leaves no trace on the board.

## The two rules added the day before you start

- **R10** — a claim that no instrument can see something is a claim ABOUT the instruments, and it needs their output. Before writing "nothing could catch this", grep the last run for the value. It was written because that exact sentence was committed and was false.
- **R11** — before ADDING an instrument, name the existing one that should have caught it and say why it did not. A fifth instrument was built and deleted the same day when the answer turned out to be "④ did, and I misread it."

## What Armory's pass proved about where defects actually come from

Seventeen closed. **Zero** were located by the pixel percentage. Three came from an instrument section read correctly, four from reading the CODE around a difference, **seven from cropping the two captures into aligned bands and looking at them**, one from Harkirat on a phone, two from chasing why the previous one was missed.

**So: crop the captures early.** `portalDiff` writes `local/diff-broadcast/mk-broadcast.png` and `pt-broadcast.png`. This is the whole command, not a shape to fill in:

```bash
Y=0; H=900          # walk Y down in H-sized steps; 900 is about a screenful and stays legible at 660px wide
magick local/diff-broadcast/mk-broadcast.png -crop 1282x${H}+0+${Y} +repage -resize 660 /tmp/mk.png
magick local/diff-broadcast/pt-broadcast.png -crop 1282x${H}+0+${Y} +repage -resize 660 /tmp/pt.png
magick /tmp/mk.png /tmp/pt.png +append -bordercolor '#777' -border 2 /tmp/band.png   # mockup LEFT, portal RIGHT
```

Then `Read /tmp/band.png`. Two pages of unequal height drift apart as you descend, so early bands compare cleanly and late ones do not — which is itself information. That one habit found more than every section of every instrument combined.

## Out of scope, do not reopen

Redesigns wait for **all six realms** (`CLAUDE.md`, re-affirmed 2026-08-31 against my own argument). 375×812 is a decision, not a gap. The cited floors in `docs/reference/portal-decision-ledger.md` are settled — the ledger **annotates, it never filters**, so a hit means go check, never ignore.

## Closing

## Three things this realm carries that no instrument will hand you

1. 🔴 **TWO QUESTIONS ARE HITL AND MUST NOT BE ADJUDICATED.** §0.8 lists both as *"Still genuinely HITL — ask, never decide"*: the portal's **`Delivery queue`** against a mockup label the plan records as **`Now showing`**, and **the severity dot inside the Announcement name cell**. ⚠️ **Verify which way round the first one is before asking** — the portal renders `Delivery queue` and "Now showing" survives only in two code comments, so the plan's phrasing may be backwards. A neighbouring entry here was recently found recorded exactly that way. One batched `AskUserQuestion` at the START, per §0.4.
2. 🔴 **SEVEN SELECTORS ARE STYLED WITH NO EMITTER FOUND** — `atbar` · `atrow` · `atruler` · `atnow` · `timax` · `timb` · `timleg`. This is §0's central mechanism and it was **Armory's largest defect**: a stylesheet carried whole while the markup that activates it was dropped. `npm run portal:reverse-orphans` is the instrument. ⚠️ **Read its BASELINE too** — Armory's equivalent sat in `portal/fixtures/reverse-orphans.json` as accepted debt, which is exactly why nobody read it for weeks.
3. 🔴 **FOUR SHARED-SURFACE SELECTORS MOVED AFTER Broadcast was last measured** — `.pill .sub`, `.bar.saved`, `.stt.saved`, `.mark.stack .n`, per Task 8 of `docs/superpowers/plans/2026-08-31-post-compact-remediation.md`. Re-record `portal/fixtures/geometry/broadcast.json` when you re-measure.

## Before you hand this on

🔴 **§L condition ⑥ — run the READER TEST on whatever you write for Part 4, and fix everything it finds.** Two read-only agents with no transcript, one asked to start the next Part and list every place it cannot, one asked to falsify every checkable claim in the documents. On Part 2's carriers this found sixteen defects in twenty minutes, including two that would have broken Part 3 on its first three commands. **This document exists in its current state because that test was run on it** — its first draft named no prerequisites, gave one audit call for a two-view realm, and quoted another realm's percentage as this one's.

## Closing

§L's seven conditions, and the seventh is Harkirat looking. Never write "done" (R5). The deliverable is both servers running and the two URLs side by side — `http://localhost:8900/docs/superpowers/mockups/2026-08-23-portal-interactive/broadcast.html` for the mockup — **`repo-static` serves the REPO ROOT, so a bare `:8900` is a directory listing**, `http://localhost:8901/harness.html?fresh=1&b=<any number>#/broadcast` — **the `b=` cache-buster is not optional**; without it the page can come from bfcache and you review the previous build for the portal.
