---
kind: plan
status: live
---

# Part 3 — Broadcast. Paste this in.

> Written 2026-09-01 by the Armory session, per §0.0. **It is deliberately a third the length of `ARMORY-PROMPT.md`, because Broadcast is a third the realm** — 39KB and 5 handlers against Armory's 96KB and 14. Handing over Armory's prompt unchanged would invite Armory-sized effort on a realm that does not need it, which is its own kind of waste.

## The mode

🔇 **Silent mode**, per `MEMORY.md`'s section — auto-loaded, already in context. No narration between calls, one summary at the end, batch aggressively, `sequentialthinking` before any audit or review. Nothing enforces it.

## First three calls, in this order

```bash
npm run portal:status                      # the close-condition board is at the FOOT now
npm run portal:audit -- --realm broadcast --all
npm run portal:inventory -- --realm broadcast
```

🔴 **`portal:status`'s close-condition board is new (2026-09-01) and it is the thing to read first.** It reports, per realm, whether each of `audit · inventory · diff · converge · realwalk` has run against the CURRENT `portal/ui`. It exists because Armory came one summary away from being reported closed with `portal:inventory` — §0.5a R4's own named close condition — never having been run on that realm once, because `portal:audit`'s five sections resemble the inventory's four lists and one was substituted for the other. **A row of `· never` is the honest starting state; do not treat Broadcast's recorded 0.2% as evidence anything has been checked recently.**

## What is actually true about Broadcast, and what is stale

| | |
|---|---|
| **Recorded** | resting pass closed, 0.2% / 0.3%, both views height-identical at 1258px |
| ⚠️ **Measured when** | **2026-08-28** — before the mode collapse, before the ④ reach change, before everything of 2026-08-31 and 09-01 |
| **Never done** | overlays have never been opened on this realm. `--triggers` has never been run on it |
| **Never done** | ④ has never been read under reach ranking, and Broadcast's nine ④ rows were ordered by repetition |

🔴 **A SMALL PERCENTAGE IS NOT EVIDENCE OF A SMALL JOB.** Armory's Tier board sat at 8.4% and hid seventeen defects, four of which had **never rendered once** — a whole tier-grading system behind a renamed class. Broadcast at 0.2% has been measured on exactly one axis, at one width, in one state, by an instrument whose ordering was wrong until yesterday.

## The three instrument changes since Broadcast was last measured

1. **④ STYLE ranks by REACH**, not ×count — how many elements the difference is drawn through. A container difference now sorts above the same delta repeated on leaves. It also refuses to claim the ordering if the walk stops supplying descendant counts.
2. **`portal:audit --triggers` names the realm it ran on.** It printed `season` as a literal on every realm until 2026-09-01, so any earlier `--triggers` output on Broadcast was headed with the wrong subject.
3. **Every instrument leaves a receipt** in gitignored `local/.portal-receipts/`, which is what the status board reads.

## The two rules added the day before you start

- **R10** — a claim that no instrument can see something is a claim ABOUT the instruments, and it needs their output. Before writing "nothing could catch this", grep the last run for the value. It was written because that exact sentence was committed and was false.
- **R11** — before ADDING an instrument, name the existing one that should have caught it and say why it did not. A fifth instrument was built and deleted the same day when the answer turned out to be "④ did, and I misread it."

## What Armory's pass proved about where defects actually come from

Seventeen closed. **Zero** were located by the pixel percentage. Three came from an instrument section read correctly, four from reading the CODE around a difference, **seven from cropping the two captures into aligned bands and looking at them**, one from Harkirat on a phone, two from chasing why the previous one was missed.

**So: crop the captures early.** `portalDiff` writes `local/diff-broadcast/mk-*.png` and `pt-*.png`; `magick <f> -crop 1282xH+0+Y +repage -resize 660` on both and `+append` them gives a side-by-side band you can actually read. That one habit found more than every section of every instrument combined.

## Out of scope, do not reopen

Redesigns wait for **all six realms** (`CLAUDE.md`, re-affirmed 2026-08-31 against my own argument). 375×812 is a decision, not a gap. The cited floors in `docs/reference/portal-decision-ledger.md` are settled — the ledger **annotates, it never filters**, so a hit means go check, never ignore.

## Closing

§L's six conditions, and the sixth is Harkirat looking. Never write "done" (R5). The deliverable is both servers running and the two URLs side by side — `:8900` for the mockup, `:8901/harness.html?fresh=1#/broadcast` for the portal.
