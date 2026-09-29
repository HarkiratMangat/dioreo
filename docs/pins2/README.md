---
kind: reference
status: live
---

# Portal pins batch 2 — everything Sessions 4 and 5 read

*Gathered here 2026-09-28 23:12 EDT at Harkirat's direction ("everything is scattered all over the place right now from the various boards, previous sessions, docs/claude/, local/, docs/superpowers/"). This file is the index. It states where things are and how they relate; the state table below is the only place it writes state, dated.*

## Read in this order

1. **This file.**
2. **[The plan](plan/2026-09-13-portal-pins-batch-2.md)** — §0 first, then **§5c** (Session 4) or **§5d** (Session 5), §1, §7, §9, §13, and the session's prompt in **§11**. The plan governs; [its spec](spec/2026-09-13-portal-pins-batch-2-design.md) is the frozen decision record it cites.
3. **[FINAL.md](final/FINAL.md)** — which board owns each surface, and the rule for which value wins.
4. **[The handoff, gate by gate](final/board4-spec/HANDOFF.md)** — every current ruling, what the data needs, what was never opened — then the generated values beside it ([`final/board4-spec/README.md`](final/board4-spec/README.md) says the order).
5. **[His words](handoffs/2026-09-21-board4-intake.md)** — every intake round verbatim and dated, grouped by class, with what was built and measured after each. Where this file, the handoff or the plan paraphrase him, this log wins.
6. **The ledger** — `docs/reference/portal-decision-ledger.md` (`ctx_search`, never `rg`): the portal's settled decisions, Board 4's included.

## What is where

| Folder | Holds | Kind |
|---|---|---|
| [`plan/`](plan/) | the batch-2 plan — Sessions 1–5, their prompts, the gates, the close procedure | plan, live |
| [`spec/`](spec/) | the batch-2 design spec (2026-09-13) — frozen; the plan records every place it is superseded | spec, frozen |
| [`final/`](final/) | `FINAL.md` and `lineage.md` (how boards 1–3 became Board 4), and `board4-spec/` — the handoff plus every value generated from the kit | reference |
| [`handoffs/`](handoffs/) | Session 3's records: the intake log, the fix plans (v11, v15), the critiques, checkpoints, compact preps | record |
| [`records/`](records/) | the Session 1–2 drafts and checkpoints, and History's constraint table and change inventory (read these only when touching History, C8) | record |
| [`instruments/`](instruments/) | the Board 4 measuring scripts — [`README.md`](instruments/README.md) lists each and when to run it | reference |
| [`data/`](data/) | source data the boards used — the CODM mode icons (the Modes badge family) and the weapons-and-attachments source | data |
| [`intake-shots/`](intake-shots/) | the screenshots his intake and the handoff cite, by round, tracked so a fresh clone can see what he pointed at | images |

## State — as of 2026-09-28 23:12 EDT

| | |
|---|---|
| Board 4: Collective | artifact `FCAFvDXrKQN28SotQLJhTh`, **Version 40** live |
| The kit | `local/pins2-board-3/redo/` at kit commit `f41c691` — **gitignored**, with its own local git repo (`local/pins2-board-3/redo/KIT-GIT.md`); the published artifact is the only copy off this disk |
| The spec | `final/board4-spec/` regenerated from kit `f41c691` |
| Branch | `feat/portal-pins2-manifests`, nothing pushed. Session 3 has not closed: its close (plan §13) merges Session 2's build and these records into `v3-pre-release`, each step on his word |
| Next | his Version 40 intake round (log only, `handoffs/2026-09-21-board4-intake.md` § Version 40 intake round), then Session 3's close, then Session 4 |

## Where new things go

| New thing | Home |
|---|---|
| his words in an intake round | the intake log, as a new dated section |
| a screenshot he gives | `intake-shots/<round>/`, run through `pngquant`, cited by that path |
| a handoff, compact prep or checkpoint | `handoffs/`, named `YYYY-MM-DD-board4-<topic>.md` |
| a measuring script | `instruments/`, with a line in its README |
| a change to the kit | the kit, then regenerate the spec (below) in the same run |

**Regenerate the spec** after any kit change, with the board served (`preview_start` → `repo-static`):

```bash
D=docs/superpowers/mockups/2026-09-15-pins2-board-3/3e; O=docs/pins2/final/board4-spec
OUT_DIR=$O node $D/switches.cjs && OUT_DIR=$O node $D/overrides.cjs
BOARD=4 node $D/extract-spec.cjs '' $TMPDIR/b4-spec.md && BOARD=4 node $D/split-spec.cjs $TMPDIR/b4-spec.md
node $O/maps.cjs
```

## Left in place, and why

| Where | What | Why it stays |
|---|---|---|
| `docs/superpowers/mockups/2026-09-14-pins2-board/`, `…-pins2-board-2/`, `…2026-09-15-pins2-board-3/` | boards 1, 2 and 3 — their packages, resolved specs and board 3-E's handoff | dated design history; Board 4 carries their designs corrected. **Board 3's `3e/` folder is also the spec generator** the command above runs |
| `docs/portal/portal-sync-notes.md` and `docs/portal/portal-pins/` | the pin log and its crops (the 57 review pins began there) | the portal's own working records |
| `docs/reference/portal-decision-ledger.md` | settled decisions, Board 4's included | a lookup doc for the whole portal |
| `docs/db-deferred-list.md` | the Board 4 entries (search "Board 4") — ported work Session 5 carries, states never opened, the badge set | the project's one deferred list |
| `local/pins2-board-3/` | the kit and the review folders | gitignored working files |
