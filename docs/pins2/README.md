---
kind: reference
status: live
---

# Portal pins batch 2 — everything Sessions 4 and 5 read

*Gathered here 2026-09-28 23:12 EDT at Harkirat's direction ("everything is scattered all over the place right now from the various boards, previous sessions, docs/claude/, local/, docs/superpowers/"). This file is the index. It states where things are and how they relate; the state table below is the only place it writes state, dated.*

## Read in this order

1. **This file.**
2. **[The plan](plan/2026-09-13-portal-pins-batch-2.md)** — §0 first, then the session's prompt in **§11**, which names its own reading list — Session 4's is §0, §1, §2b, §9, §10.5 and §13, then **§5c**; Session 5's is in its prompt, then **§5d**. Where §0's default list and a prompt differ, the prompt wins (§0 item 1). The plan governs; [its spec](spec/2026-09-13-portal-pins-batch-2-design.md) is the frozen decision record it cites.
3. **[FINAL.md](final/FINAL.md)** — which board owns each surface, and the rule for which value wins.
4. **[The handoff, gate by gate](final/board4-spec/HANDOFF.md)** — every current ruling, what the data needs, what was never opened — then the generated values beside it ([`final/board4-spec/README.md`](final/board4-spec/README.md) says the order).
5. **[His words](handoffs/2026-09-21-board4-intake.md)** — every intake round verbatim and dated, grouped by class, with what was built and measured after each. Where this file, the handoff or the plan paraphrase him, this log wins.
6. **The ledger** — `docs/reference/portal-decision-ledger.md` (`ctx_search`, never `rg`): the portal's settled decisions, Board 4's included.
7. **The board itself** — [`kit/`](kit/README.md): serve the repo with `repo-static` and open `/docs/pins2/kit/board4.html`.

## What is where

| Folder | Holds | Kind |
|---|---|---|
| [`plan/`](plan/) | the batch-2 plan — Sessions 1–5, their prompts, the gates, the close procedure | plan, live |
| [`spec/`](spec/) | the batch-2 design spec (2026-09-13) — frozen; the plan records every place it is superseded | spec, frozen |
| [`final/`](final/) | `FINAL.md` and `lineage.md` (how boards 1–3 became Board 4), and `board4-spec/` — the handoff, every value generated from the kit, and the scripts that generate them | reference |
| [`handoffs/`](handoffs/) | Session 3's records: the intake log, the fix plans (v11, v15), the critiques, checkpoints, compact preps | record |
| [`records/`](records/) | the Session 1–2 drafts and checkpoints, and History's constraint table and change inventory (read these only when touching History, C8) | record |
| [`instruments/`](instruments/) | the Board 4 measuring scripts — [`README.md`](instruments/README.md) lists each and when to run it | reference |
| [`kit/`](kit/) | the Board 4 kit — the design code itself, tracked. [`README.md`](kit/README.md) says how to serve, open and publish it | reference |
| [`data/`](data/) | source data the boards used — the CODM mode icons (the Modes badge family) and the weapons-and-attachments source | data |
| [`intake-shots/`](intake-shots/) | the screenshots his intake and the handoff cite, by round, tracked so a fresh clone can see what he pointed at | images |

## State — as of 2026-09-29 18:50 EDT

| | |
|---|---|
| Board 4: Collective | artifact `FCAFvDXrKQN28SotQLJhTh`, **Version 44** live; his Version 44 intake round (classes AT–BB) built in the kit 2026-09-29 22:59 EDT, not published (2026-09-29 21:39 EDT: the upward passing card fixed; Version 43 published 2026-09-29 21:30 EDT on his "publish": the Version 40, 41 and 42 intake rounds, built, and History's event-drawer fix); **not signed off** |
| The kit | [`kit/`](kit/README.md), **tracked** — moved here from the gitignored `local/pins2-board-3/redo/` on his call of 2026-09-28 23:27 EDT (*"why not just move the board to the new collective folder?"*). Its git history to the move stays local: `git -C local/pins2-board-3 log --stat` |
| The spec | `final/board4-spec/`, **regenerated 2026-09-29 00:12 EDT from the tracked kit** — its header carries the counts. The `C*.md` and `states.md` that sat in the live folder before were from kit `ecc93ee`, *before* Version 39: `split-spec.cjs` had written the Version 40 values into a folder nothing pointed at |
| Board 3-E | **superseded by Board 4** (his 2026-09-28 23:27 EDT). `3e/` in board 3's package is history: `handoff-3e.md` survives only as the inherited *structure* narrative `HANDOFF.md` cites, and the generators moved to `final/board4-spec/` |
| Publishing the kit | 🔴 he said on 2026-09-20 21:33 EDT that the kit was not to go on the online GitHub. It is tracked now, so a push or a merge into `v3-pre-release` that carries `kit/` puts it there — the approval sentence names it (plan §13 Step 1). Not decided |
| Branch | `feat/portal-pins2-manifests`, nothing pushed. Session 3 has not closed: its close (plan §13) merges Session 2's build and these records into `v3-pre-release`, each step on his word |
| Next | his review of the Version 44 round in the kit (intake log § Version 44 intake round), then a publish on his word; the Version 40 round's all 21 classes A–U, the Version 41 round's 13, the Version 42 round's 11); then the Collective's sign-off (plan §5c Step 1) and Session 3's close (plan §13), each on his word; compact prep: `handoffs/2026-09-29-board4-compact-prep-20.md` |

## Where new things go

| New thing | Home |
|---|---|
| his words in an intake round | the intake log, as a new dated section |
| a screenshot he gives | `intake-shots/<round>/`, run through `pngquant`, cited by that path |
| a handoff, compact prep or checkpoint | `handoffs/`, named `YYYY-MM-DD-board4-<topic>.md` |
| a measuring script | `instruments/`, with a line in its README |
| a change to the kit | [`kit/`](kit/README.md), then regenerate the spec (below) in the same run — and read the mtimes of what it wrote |

**Regenerate the spec** after any kit change, with the board served (`preview_start` → `repo-static`):

```bash
O=docs/pins2/final/board4-spec
node $O/switches.cjs && node $O/overrides.cjs
BOARD=4 node $O/extract-spec.cjs '' $TMPDIR/b4-spec.md && BOARD=4 node $O/split-spec.cjs $TMPDIR/b4-spec.md
node $O/maps.cjs
node $O/structure.cjs && node $O/relations.cjs && node $O/a11y.cjs
```

**The extractor is not deterministic on Board 4** (measured 2026-09-29): three fresh runs of the same kit specced 1420, 1425 and 1428 looks and two runs differ in about 300 lines both ways, so a spec diff after a kit change carries that noise — judge a change against it, not against zero.

**Prove the docs still point at things:** `node docs/pins2/instruments/paths-resolve.cjs` reads every path the live docs name and exits 1 on a dead one. `docs-audit`'s `xref` skips `plan/`, `spec/` and `final/`, so nothing else does. **Prove the board still works:** `node docs/pins2/instruments/r22.cjs` walks 35 flows with the kit on :8900.

## Left in place, and why

| Where | What | Why it stays |
|---|---|---|
| `docs/superpowers/mockups/2026-09-14-pins2-board/`, `…-pins2-board-2/`, `…2026-09-15-pins2-board-3/` | boards 1, 2 and 3 — their packages, resolved specs and Board 3-E's `handoff-3e.md` and `3e/` | dated design history; Board 4 carries their designs corrected. `handoff-3e.md` is also the inherited structure narrative `HANDOFF.md` cites, and `3e/measure.cjs` Board 3-E's relations (Board 4's are `final/board4-spec/relations.cjs`) |
| `docs/portal/portal-sync-notes.md` and `docs/portal/portal-pins/` | the pin log and its crops (the 57 review pins began there) | the portal's own working records |
| `docs/reference/portal-decision-ledger.md` | settled decisions, Board 4's included | a lookup doc for the whole portal |
| `docs/db-deferred-list.md` | the Board 4 entries (search "Board 4") — ported work Session 5 carries, states never opened, the badge set | the project's one deferred list |
| `local/pins2-board-3/` | the kit's old git history (`.git`), `board4-review/` (the review renders and the flow scripts' older copies) and `redo/shots/` (277 MB of screenshots) | gitignored working files; the kit itself is `kit/` |
