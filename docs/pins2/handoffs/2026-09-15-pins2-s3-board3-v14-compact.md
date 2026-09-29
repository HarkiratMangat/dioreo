---
kind: record
status: frozen
---

# Handoff — pins 2, Session 3, board 3 at version 14

*Written 2026-09-15 21:01 EDT for a compact Harkirat asked for at ~950k context. Branch `feat/portal-pins2-manifests`, clean, unpushed. The board is <https://claude.ai/artifact/2yJmND6URRPwLbNJbzySFc>, kit `local/pins2-board-3/redo/` (gitignored), tracked record `docs/superpowers/mockups/2026-09-15-pins2-board-3/README.md`.*

## Read these first, in this order

1. `docs/superpowers/mockups/2026-09-15-pins2-board-3/README.md` — the surfaces, the decisions, every fix value, and the traps already paid for.
2. This file's **Open defects** section — it is the next unit of work and it is not optional polish.
3. Plan `docs/pins2/plan/2026-09-13-portal-pins-batch-2.md` §5b (Session 3), §5c (Session 4), §5d (Session 5).

## 🔴 Open defects — his 2026-09-15 21:01 EDT screenshot, all five still live

He is frustrated, and the reason matters more than the list: **what he refines in the artifact is what he expects to see in the portal**, so an approximate stage reads as a promise of an approximate portal. Three rounds of "fixed" preceded these, so fix the CLASS and prove it with a measurement, per defect, before replying.

| # | What he sees | Where it lives |
|---|---|---|
| 1 | The per-weapon collapse icon sits off-centre in its box | `.wg-ib.wg-fbtn` is now `inline-flex` with `justify-content: flex-end` and 12px padding; at rest, with the label at `max-width: 0`, the icon lands off the box's centre. Centre it at rest and only shift when the word is revealed |
| 2 | **Collapse all** has no border and still highlights the whole wrapper | `gates.css`'s fixed-state rules kill the box on `.wg-r .wg-ib` only; `.wg-fold` (the heads control) was never given the same treatment, so it lost/keeps the wrong half. It needs the same rule as the row buttons: box always, element background never |
| 3 | The gunsmith copy button still highlights its wrapper div | The tint is on `.wg-igb`, but `.wg-code:hover .wg-ig` / the field wrapper still paints. Kill the wrapper's hover paint the way the row buttons' element background was killed |
| 4 | The "Build N · 1 problem" warn chip is not aligned with the Share button beside it | `.b3-fchip` is 34px in a 44px row cell; align it to the same centre line as `.wg-acts`'s 44px buttons, or give both one height token |
| 5 | The Collapse label's reveal is not smooth and not the speed he asked for | `max-width` transitions are not smooth by construction — the easing applies to a width that snaps at the content edge. Animate `clip-path` or a `grid-template-columns: 0fr → 1fr`, and set the duration he asked for rather than the 0.18s default |

**How to work them:** open the surface in the harness, measure the defect (computed style plus rects) BEFORE writing CSS, fix it in the shared rule, re-measure with the switch on and off, put the reading in `verify.cjs` so it can fail later, then reply on his thread with the numbers. `local/pins2-board-3/redo/verify.cjs` already carries the tools-row, checkbox-column and divider checks and the three probes in `/tmp/*.cjs` are the pattern for the rest.

## State

- **Version 14** published. Ten surfaces in this order: `shared → armory-manifest → build-drawer → repairs → command → export → queue → broadcast-manifest → composer → history`.
- **18 decisions** write to `decisions/<fork>`; a note box per surface writes to `notes/<surface>`. Read them with `Artifact action:"read_db"`, collection `decisions` (then `notes`). None is picked yet.
- **Comment threads:** every thread he sent to Claude is answered and resolved. The older round-1 threads (b07ede3c, 1b45fe5f, 26e8cb71, 4275de43, 06220e77, 220f81bc, 685af6c5, 10f18907, 318c1ffd, 6e409d9d, 1b1ea88d, 263835ae, af1a8c31, f10c6ed1) are NOT activated for Claude, so they stay open on the artifact; their content is built into the board.
- **Commits on the branch** (unpushed): `f9424c8e` → `4b87c239`, each one a correction with its measurement in the message.

## What the board is

One block per surface: every switch in a strip above one stage, the notes under it, one Decide panel at the foot. The shared vocabulary is answered first because everything below is drawn with what was picked there. Where board 1 or board 2 already answered a design (G8, G9), the board frames **that board's own page**; the port sits beside it as the visible gap. Every stage is the portal's own component on the captured dev database, so what he clicks is what Session 5 builds.

## Next

1. The five defects above, one at a time, measured.
2. Then §5b Step 5 (his answers → §10.5, the ledger, `resolved-spec.md`), Step 6 (the port table), Step 7 (pin marks), Step 8 (close: prod slot backfill and the FSS re-sync popup, then §13 push/PR/merge of Session 2's build — **each approval restated at the moment**).

## Carriers checked this session

`.remember/remember.md` rewritten · linksee: caveat **50091** (what the artifact promises) and context **50092** (the five defects) both saved · deferred list's Session 3 entry amended rather than grown · tracked README rewritten per correction.

🔴 **Two linksee writes did NOT land and must be redone.** `declare_anchor` (the version-14 structure decision) and `resolve_drift` on **anchor 17** (which still reads "board 3 version 1 … awaits Harkirat's choices" and is now false) both failed five times on tool-input serialisation — every attempt came back "could not be parsed as JSON" because the `violation_signal` and `gate` values were emitted unquoted. Redo them with short, plain, fully-quoted values; `drift_status` needs `verbose`, `declare_anchor` needs `kind` + `statement` + `violation_signal`, `resolve_drift` needs `anchor_id` + `action` + `gate`. Until then anchor 17 is stale in the startup brief.
