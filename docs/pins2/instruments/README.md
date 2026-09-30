---
kind: reference
status: live
---

# Session 3's measuring instruments — copied out of the scratchpad 2026-09-21 12:41 EDT

Throwaway-shaped but load-bearing for Board 4: each was used to measure a claim in `../handoffs/2026-09-21-pins2-s3-board4-checkpoint.md`. Run from the repo root with the kit on :8900 (`repo-static`). They are not portal tools and nothing runs them automatically.

| Script | What it measures |
|---|---|
| `elcmp.cjs g8` | board 1's post drawer against Board 4's, every element paired by class path, every differing property listed |
| `g10cmp.cjs [out.png]` | the same for Compare (board 1 G10 one-weapon view vs Board 4 C3). **Retired 2026-09-29 00:40 EDT:** Compare has diverged from board 1 by his C3 rulings (Version 39) and this drives markup that no longer exists; not run since the move |
| `filled.cjs <dir>` | captures board 1's drawers and Compare beside Board 4's in filled states, same scale |
| `pairs.cjs <dir>` | captures board 1 G9/G10/G8 and board 2 G11/G2 beside Board 4's sections |
| `b4shots.cjs <dir>` | renders every Board 4 section and each of its Try states; prints page errors |
| `cssdrift.cjs <board index.html> <app.css>` | how far a board renders from a given stylesheet — proved boards 1/2 had 0 drift before freezing |
| `crop.cjs <dir>` | the M1 weapon group on board 2 and board 3, with the build number's weight and the weapon-line gap read off |
| `board4-ink-centre.cjs '[css]'` (env `DSF=2|4`, `ROWS`, `SEL`, `PW`) | each manifest-row element's box centre and drawn-ink centre against the row centre, by hiding only that element's ink and diffing; run at 2x AND 4x |
| `board4-focus-sweep.js` | every typing field's focus glow and placeholder, read by computed style |
| `board4-shot.sh <name> <js>` | reload, load `board4-forced-hover.js`, run a shot script, screenshot and crop to its returned rect; deletes the old crop first |
| `board4-shot-add-build.js` | the Add build drawer with the Stage hint open (dispatched `mouseenter`, 900ms) |
| `board4-forced-hover.js` · `board4-class-sweep.js` · `board4-class-sweep-agg.js` | forced `:hover`/`:active` as classes (cannot reveal JS hover UI) · one recipe measured across a class's every instance |
| `board4-row-ink.cjs` | form rows: the label's drawn ink against its field's centre, 2x and 4x |
| `board4-row-boxes.cjs` | form rows: boxes, overflow and stacking at 1440/1280 — never an alignment claim |
| `board4-image-well-walk.cjs` · `board4-export-card.cjs` · `board4-bulk-walk.cjs` | walks through the image well, the Export hover card and Bulk |
| `board4-badge-gif.cjs` | a badge's motion as frames, for a gif he can judge |
| `prep-helpers.py` | `insert_after`, the insert that asserts its line delta |
| `r22.cjs` | 35 flows on the board — what happens when a person USES a surface, each step asserting an outcome that can fail (Escape closes a clean drawer, a build off drops its column, a list stays inside the drawer). Exit 0 and `PASS 35 FAIL 0`. It compares no two elements, so a layout defect can pass it |
| `r20.cjs` | every state of every surface swept, screenshots to a temp folder |
| `b4states.cjs` | hover, focus and active on every control of every surface: NONE, GREY, SHAPES, CENTRE, CONTAIN, NOFOCUS, NOACTIVE, BLOCKED counts per gate. Exit 0; the counts are the report |
| `b4parity.cjs [surface,…]` | Board 4's element tree against the board that drew each surface, printing every EXTRA, MISSING and DIFF. **`g8` and `g9` run (exit 0). The `g10*` Compare surfaces fail with `Illegal invocation`:** they drive `#cmp-weapon`, which Version 39 replaced, and Compare has diverged from board 1 by his C3 rulings — retired, not repaired (found 2026-09-29 00:40 EDT) |
| `cites-check.cjs [doc …]` (`--all`, `--selftest`) | every `path:line` cite in the live docs, the deferred list and `DESIGN.md`, judged by the backticked words in its own row or sentence: ok · moved · absent · untestable · ambiguous · missing · range. Exit 1 only for the live pins2 docs (the plan: only Sessions 4 and 5's sections). Written and first run 2026-09-29 12:21 EDT |
| `counts-check.cjs` (`--selftest`) | 13 numbers the live docs state (kit files, r22's flows, the gates, the Version, the post limits, the intake index) against what decides each; `--selftest` shifts every number by one and requires all 13 to fail. Written and first run 2026-09-29 12:21 EDT |
| `board4-v44-probe.cjs` | His Version 44 round's falsifiers, run before and after the build: every hover target of Compare's table by real mouse hovers (no cell may move or stop being a cell), the badge pop frame by frame in and out, the two weapon lists' order, hairlines, ticks and hovered ×, the count readouts' numerals, the kept shared rows, PHARO and .50 GS on the manifest; prints one JSON object |
| `paths-resolve.cjs [doc …]` | every path the live docs name, against the disk and the tracked tree — exit 1 on a dead one, `UNTRACKED` listed. The instrument `docs-audit`'s skip of `plan/`, `spec/` and `final/` made necessary |

The spec generators — `switches.cjs`, `overrides.cjs`, `extract-spec.cjs`, `split-spec.cjs`, `maps.cjs` — live beside their outputs in [`../final/board4-spec/`](../final/board4-spec/README.md); the command is in [`../README.md`](../README.md).

**Run after the move of 2026-09-29 00:02 EDT:** `board4-menu-fit`, `r20`, `r22`, `b4states`, `b4parity g8,g9` and `paths-resolve` were run against the board at `docs/pins2/kit/`; the rest were re-pointed by URL and path, syntax-checked and **not run** — run one before quoting it.
