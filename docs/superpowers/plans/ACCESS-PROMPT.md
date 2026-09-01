---
kind: plan
status: live
---

# Part 4 — Access. Paste this in.

> Written 2026-09-01 14:45 EDT by the Broadcast session, per §0.0. **Access is the middle realm** — 46KB and 7 handlers against Broadcast's 39/5 and Armory's 96/14 — but it has **17 `onX` props in `access.js`** and it is the only realm whose subject is a *matrix*, so its interaction tier is not derivative of Broadcast's and should not be budgeted as if it were.

## The two lines §0.0 requires before any task content

- `/rename Sonnet5-High · Access conformance · <Mon DD>`
- `Premise Low · Delib High -> Sonnet5-High` — the audit produces the findings, so the facts are given and checkable; the load is breadth across sites. Escalate on events only: a premise turning out false, or two hypotheses wrong.

## Branch state as of 2026-09-01 14:45 EDT

`feat/broadcast-portal-conformance`, commit `804fa8b`, **unpushed and with no PR** — Harkirat had not approved a push when it was written. `package.json` is still `3.70.0-pre`: the changelog paragraph and the bump are the pre-merge checkpoint and cannot be written until the PR number exists. `npm test` exit **0**, `docs:audit` exit **0** with 4 advisory warnings.

🔴 **Check whether it merged before you start** — `git log --oneline -3 v3-pre-release` — because Broadcast's pass changed `manifest.js` and `app.css`, which Access renders through.

## The mode

🔇 **Silent mode**, per `MEMORY.md`'s section — auto-loaded, already in context. No narration between calls, one summary at the end, batch aggressively, `sequentialthinking` before any audit or review. ⚠️ **Nothing enforces it**, and the Broadcast session was told twice to batch harder. The concrete technique is the one that gets skipped: **N edits across N files is ONE `python3` heredoc** with an `assert <anchor> in s` before each replacement, a `print()` per edit, and `node --check` + the build + the re-audit chained onto the same call.

## First calls, in this order

```bash
# 🔴 THE PREREQUISITES. portalAudit and portalInventory hardcode :8900 and :8901 and spawn NOTHING.
# Check before starting them — on 2026-09-01 both were ALREADY running from an earlier session and
# preview_start failed with "port in use", which is not an error you need to fix:
#   lsof -nP -iTCP:8900 -iTCP:8901 -sTCP:LISTEN
preview_start {name:"repo-static"}       # :8900, the mockup — serves the REPO ROOT, so a bare :8900 is a directory listing
preview_start {name:"portal-harness"}    # :8901, the built portal
node -e "require('./scripts/buildPortal').build()"   # :8901 serves BUILD OUTPUT

npm run portal:status                    # the close-condition board is at the FOOT
npm run portal:audit -- --realm access --view "By admin" --all
npm run portal:audit -- --realm access --view "By scope" --all
npm run portal:audit -- --realm access --view "Sessions" --all
npm run portal:audit -- --realm access --triggers
npm run portal:inventory -- --realm access
node scripts/portalDiff.mjs --realm access --portal harness
```

🔴 **`--all` LIFTS THE ROW CAPS ON ONE VIEW. IT DOES NOT WALK VIEWS.** Access has three — `By admin`, `By scope`, `Sessions` — and `portal:status` prints them. Auditing one and recording the realm closed is how Armory came to be recorded closed with three of four views never looked at.

## Then crop the captures and LOOK, early

`portalDiff` writes `local/diff-access/mk-access.png` and `pt-access.png`. This is the whole command:

```bash
Y=0; H=900
magick local/diff-access/mk-access.png -crop 1282x${H}+0+${Y} +repage -resize 660 /tmp/mk.png
magick local/diff-access/pt-access.png -crop 1282x${H}+0+${Y} +repage -resize 660 /tmp/pt.png
magick /tmp/mk.png /tmp/pt.png +append -bordercolor '#777' -border 2 /tmp/band.png   # mockup LEFT, portal RIGHT
```

Then `Read /tmp/band.png`. **Of Armory's seventeen closed defects seven came from this and zero from the percentage; of Broadcast's, the single largest did too** — a `SAVED` badge painting pale grey on a bright green fill at 1.34:1, which every gate passed and which ④ STYLE reported as one row among nine.

## What is actually true about Access, and what is stale

| | |
|---|---|
| **Recorded** | `☐ open` in §L. 47.7KB · 7 handlers · 15 data-attrs — "medium fidelity" |
| ⚠️ **Measured when** | the geometry fixture is stamped `56ff4cc`; `portal:status` reported access as **🔴 2 — RE-MEASURE** on 2026-09-01 |
| **Never done** | every instrument. `portal:status`'s close-condition board reads `· never` across all five columns for this realm |
| ⚠️ **The KB figure disagrees with the tool** | §L says 47.7KB, `portal:status` printed **46KB**. Two measurement methods, neither labelled — cite the tool's, per §0.6a's own rule about numbers a tool can print |

## What Part 3 leaves you that is not in any instrument

1. 🔴 **THE SHARED `Manifest` HAS NOW HAD TWO CLASS-NAME DEFECTS AND BOTH WERE IN ITS BASELINE.** Armory's `RANK_KEY` emitted `t-t3` against `.t-top3`; Broadcast found `PILL` emitting `stag`/`sched`/`exp`/`conf` against stylesheets defining only `.stt.saved`/`.stt.staged`/`.stt.conflict`. **Access renders `mxcell` state through a class expression too** (`access.js:187`, `const cls = 'mxcell' …`) and its own comment records that a cell wearing `.on` alone "fills with the accent and draws nothing inside it" because the tick is `.mxcell[aria-checked=true]::after`. **Run `npm run portal:reverse-orphans -- --why <class>` on every class that grid builds, and read the BASELINE file, not only the exit code** — `portal/fixtures/reverse-orphans.json` is by construction a list of things already agreed to live with, which is exactly why two of these survived weeks.
2. 🔴 **`mxrole`/`mxrow` are recorded in PART 4 as "styled with no emitter found" — VERIFY BEFORE TREATING THEM AS DEFECTS.** Broadcast's equivalent list (`atbar` · `atrow` · `atruler` · `atnow` · `timax` · `timb` · `timleg`) turned out to be **DEAD ON BOTH SIDES**: styled in both stylesheets, emitted in neither, superseded by the shared `.tk-wrap` rail. The handover called them "§0's central mechanism" and they were §0.7c bucket 2. ⚠️ **A grep cannot settle this** — it cannot see the ④ MISMATCH shape, where an emitter exists under a name built from a lookup table. `portal:reverse-orphans` can, because it evaluates expressions.
3. 🔴 **`.mxgrp th`'s two group headers span four `ADMIN_COMMANDS` and eight `MANAGE_PAGE_SCOPES` while the COLUMNS come from `accessScopes` order** — so appending a command silently mis-groups the grid. That is a correctness defect the overlay cannot see (the fixture happens to line up), and §0.2's rule applies: the mockup and the harness are both fixture-driven and corroborate each other vacuously. **The real server is the first artifact you open, not the last one you check.**
4. ⚠️ **`§0.9` says Access's grant inputs "having no label" is NOT a defect** — they are `<label for=…><span>…</span><input id=…>` and a probe reading only `innerText`/`aria-label` reports them as nameless. Do not "fix" it.

## The rules that were added or earned in the last two days

- **R10** — a claim that no instrument can see something is a claim ABOUT the instruments and needs their output. Grep the last run for the value before writing "nothing could catch this."
- **R11** — before ADDING an instrument, name the existing one that should have caught it and say why it did not. Broadcast's `portalRealWalk` fix came from this: it defaulted to Season's view names on every realm, and the instrument that already knew each realm's views was `portal:status`, reading the same fixtures. It reads them now.
- **§0.7c's triage buckets** — CITED / DEAD-ON-BOTH / ALREADY-SETTLED / FIX, sorted from the audit's own output plus the comment beside the code, **before any probe**. Broadcast's `button.chip "All"` looked like a missing control and `--triggers` showed 17 · 17 on both sides: a pairing artifact. **Check the page before closing a SHAPE finding.**
- 🔴 **A CITED ① CASCADE is CLOSED, not fixed.** Access will report `b.crumb-sep +4 top / −6 height` under every `--open`, exactly as Broadcast did. It is the cross-realm SVG-vs-text-glyph row. Work ④ through it.

## Two questions to settle before you spend a pop-up

🔴 **Measure both sides FIRST.** Two of §0.8's HITL rows were retired on 2026-09-01 without asking, because measurement showed there was nothing to decide — the mockup renders `Delivery queue` and contains `Now showing` zero times, and both sides draw the severity dot identically. Harkirat's reply to being shown the one real difference was *"why are you being so closed minded and relying on me for tiny things like this when you're literally capable of these judgement calls on your own."* **A pop-up is for a genuine fork in scope, not for a difference you have not yet measured.**

## Out of scope, do not reopen

Redesigns wait for **all six realms** (`CLAUDE.md`, re-affirmed 2026-08-31 against my own argument — do not re-derive it). 375×812 is a decision, not a gap. `core/ops` and the operation algebra. Refactors. **Never push, open a PR, ask about either, or raise the branch's size.**

## Before you hand this on

🔴 **§L condition ⑥ — run the READER TEST on whatever you write for Part 5, and fix everything it finds.** Two read-only agents with no transcript: one asked to start the next Part and to list every place it cannot, one asked to falsify every checkable claim. On Part 2's carriers it found sixteen defects in twenty minutes, two of which would have broken Part 3 on its first three commands.

## Closing

§L's seven conditions, and the seventh is Harkirat looking. Never write "done" (R5). **The deliverable is both servers running and the two URLs side by side** — `http://localhost:8900/docs/superpowers/mockups/2026-08-23-portal-interactive/access.html` for the mockup, `http://localhost:8901/harness.html?fresh=1&b=<any number>#/access` for the portal. **The `b=` cache-buster is not optional**; without it the page can come from bfcache and you review the previous build.
