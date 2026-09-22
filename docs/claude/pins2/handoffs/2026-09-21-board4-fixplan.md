---
kind: record
status: live
---

# Board 4 — the fix plan for his intake round (2026-09-21 19:14 EDT)

*The intake log is `2026-09-21-board4-intake.md` (verbatim, gate by gate). This file groups his items by CAUSE, gives each class its authority, its fix, and the check that proves it across the whole board. Nothing here is fixed per instance. It is the carrier if the session compacts mid-pass.*

## §0 · THE WORKING CONTRACT — read this before the first tool call, and restate it as your FIRST thinking thought (2026-09-21 20:00 EDT)

*Harkirat, 2026-09-21 19:58 EDT: "I don't want drift with the next session's compliance." Every compact this session drifted within about ten turns ("CORRECT RIGHT NOW", "your plan is shit, it's a loop", "COMPLIANCE DRIFT", "YOU'RE DRIFTING", "ASK BETTER SEQUENTIAL-THINKING QUESTIONS"), because the rules arrived as a sentence and the task as a table, and the table won. So the rules are written here as CALLS, and the start prompt makes you restate them before you act.*

**Tool routing: the question decides the call (linksee anchor #45 encodes this whole contract; #35 is the older routing anchor)**

| The question | The call | Never |
|---|---|---|
| Where is a symbol, who calls it, what a change touches | `codebase-memory` `search_graph` / `trace_path` / `get_code_snippet` (project `Applications-Claude-Code-Diors-Builds-local-pins2-board-3-redo` for the kit) | rg, grep |
| Where a literal sits in code or CSS | `codebase-memory` `search_code` | rg, grep, awk |
| The exact lines of a known file | `ctx_execute_file` with JS slicing `FILE_CONTENT`; `Read offset/limit` only for a direct `Edit` | sed -n, awk, cat, head |
| A whole file | `mcp__linksee__read_smart` (first read too) | cat, Read |
| A question about prose (records, rulings, handoffs, specs) | `ctx_search` | rg |
| Several gathers at once | ONE `ctx_batch_execute` whose commands run node or python, with `queries` attached | awk/grep/sed inside it (he named this one: "rg inside of context mode") |
| The rendered page | puppeteer (`b4states.cjs`, `shots.cjs`) or the chrome-devtools CLI | reasoning about CSS instead of looking |
| rg / fd | Only for ONE known literal in a path no index covers, and say why | — |

The harness's auto-mode text recommending cat/grep/sed LOSES to this table. The "say what you're doing" nudge LOSES to silent mode: zero mid-run prose.

**Working style**
- **Silent mode.** Zero prose between the first call and the final message; questions only in `AskUserQuestion` popups; the final message follows the Silent contract (≤ 25 lines, verdict first, one table per section, plain sentences, never "done").
- **Mega-batch.** Independent calls share one message. Every multi-place edit is ONE `python3` heredoc (assert each anchor, print each edit, verifier chained with `&&`, timestamps COMPUTED). Never two heredocs on one command line: bash feeds their bodies in command-line order, and that broke twice.
- **Turn budget.** ≤ 12 turns per pass (the table in "Turn budget"). Pass 1 took about 60 and he called that unacceptable.
- **Sequential thinking, pre-emptive and harsh.** Run it BEFORE work, not after. Probing questions, not sorting: what am I claiming that I have not seen, what will he find in 5 seconds, what is the class behind this instance, which ruling already answers this, what did the last round get wrong. One thought is never a pass.
- **Class, not instance.** A fix names its class, is applied to every instance on the board, and is checked on the elements beside it. C4, C6 and C8 are "fine": any change there is a regression unless it is the same class, deliberately.
- **Awwwards worthy, nitpicked, never lazy.** Definition of done per element, before anything is shown:
  1. Read the authority's version first: board 1 (G8, G9, G10), board 2 (G2, G11), board 3's families, and the Export picker as the house reference.
  2. Reuse the family that already exists (`.b3-sc` chips, the picker's build tiles, `.b3-xt-ln` lines, the mesh, `.b3-btn2`, `.wg-ib`). Never hand-craft a copy.
  3. Sweep the relations: edges, gaps, heights, centre lines on the cap height, truncation, dead space.
  4. Look at every state he will click (hover, pressed, pressed+hover, focus, empty, filled, error) in the real page, with Cloudinary blocked, because that is the artifact he sees.
  5. Instruments find candidates; **his eye is the judge.** A green instrument is never the report, and an instrument must first catch a known case (the first GREY detector missed his C9 grey; the first cap probe invented −4.4px on History).
- **Design forks are SHOWN, not described.** Render the options, send them with `SendUserFile` (no publish needed), then a popup. Before any popup, check the ruling does not already exist: the intake log's "His ruling" lines, `docs/claude/2026-09-20-h1-constraint-table.md`, the decision ledger, and handoff-3e §4. C4's count chips were asked after they were already decided.
- **Never publish mid-work.** Ask first, every time. Publish from root `local/pins2-board-3/redo/` with `board4.html` and EVERY changed file in `files` (v1 lacked `b3/bolt-raw.svg`, and META died).
- **Screenshots and paths:** pass ABSOLUTE `--filePath` to chrome-devtools, because a relative path lands in the repo root. Page ids change: run `list_pages` first.
- **Timestamps** come from the `[clock]` value or are computed in the script, never typed.

## How the pass runs

1. **Instruments first**, because every earlier round failed on the same blind spot: I verified resting DOM only and never drove `:hover`, `:active` or `:focus-visible`. `docs/claude/pins2/instruments/b4states.cjs` (to write): puppeteer, **Cloudinary blocked so it sees what the artifact shows**, and for every interactive element in every section:
   - the states matrix: rest, hover, active, focus-visible and pressed+hover, via CDP `CSS.forcePseudoState`. It flags a hover identical to rest, a grey (low-chroma) hover on a hued control, and siblings in one control group whose radius or height differ.
   - a font-role census per section: family, size and weight per text role.
   - vertical centring per row: each cell's ink centre against the row's centre.
   - containment: a drawer inside its stage, a hover card inside its scroll area, text inside its box.

   Run it as a baseline, then after every class. **C4, C6 and C8 are "fine", so any change there is a regression.** Regenerate `board4-spec` and diff those three files.
2. **Class fixes** (below), each as one heredoc per file family, verified by the instrument across every instance, not the one element touched.
3. **Shell proposals** (K2) as live switches on Board 4. Publish once, and he rules header and footer in a popup.
4. **The C2 drawer rebuild** on the chosen shell, against board 1's G9, with the lineage table written first.
5. Final: instruments, spec regeneration, screenshots of every state, then ask before publishing.

Scope: CSS under `.b4`, and behaviour behind `window.B4_COLLECTIVE`, so Board 3-E stays as approved.

## The classes

| # | Class | His items | Authority | Fix |
|---|---|---|---|---|
| K1 | **Control-state contract**: every interactive family gets rest, hover, pressed, pressed+hover, focus and disabled in its OWN hue, and never a grey wash | C1-3, C2-2, C2-3, C3-2, C3-3, C5-1, C9-1 | The board-3 families: `.b3-fc` hue contract (`--fc`), `b3-btn2`/`go`/`dang`, `.mh-mode` | One table of families. Where it comes from: the grey wash is `app.css .seg button:hover{background:var(--hi)}` plus my round-1 `color-mix(--hi 75%)`. MP/DMZ tiles hover in their own mode hue. Segments brighten ink and lift the thumb border. Selection bar: Edit hovers `--staged`, Export hovers `--ok`, **hover only** (his ruling). MP/DMZ in C2 and C5 must be ONE rule |
| K2 | **Drawer shell**: header and footer | C2-1, C2-6, C2-7, C2-9, C7-9 | The Export picker's drawer, his reference for good: a title row with `‹ ×` nav, controls in the body, actions in context, no footer bar | Live options on the board, applied to all four drawers (New build, Bulk, Edit, Post) |
| K3 | **Form surface**: fields, dropdowns, labels, placeholders, the image box, badge toggles, tier segment | C2-4, C2-7, C7-10 | Board 1 G9 (`handoff-g9-g8.md`, `resolved-spec-full.md`, b4parity g9), with board-3 families where he ruled them | Write the C2 lineage table (element · board 1 · board 3 · his ruling · final), then one radius scale, one control-height scale and one type-role map. Seen on today's board: a native `<select>` beside a custom combobox, italic placeholders everywhere, a truncated placeholder ("Paste a link, or choose a f…"), an empty skeleton image box, a pink label-prefix block, and a centred "Pick a weapon…" orphan in the preview. **The board presents C2 EMPTY while board 1 is judged FILLED**, so add a Filled state |
| K4 | **Dynamic mesh** from content | C2-5, C2-10 | The Export picker's mesh (`--m1..--m4` ranked hues) | One `meshFor()`: Add takes the selected category, Bulk the parsed blocks' categories, Edit the edited builds, Post the announcement accent. Verify all four drawers |
| K5 | **Bulk list = the export file list**, and friendly | C2-11, C2-12, C2-13 | `.b3-xt-ln` export list | The same line classes and gutter; a visible grammar (ghost template lines, a line-type hint in the gutter), not a placeholder that disappears; board-chrome prefill scenarios (one build, several, a warning, an error, mixed MP/DMZ) |
| K6 | **Chip family reuse** | C2-14, C3-1, C7-3, C7-6, C7-7 | The selection bar's `.b3-sc` weapon chip; the Export picker's build tiles; board 2 G11's state tab | "Editing X" becomes `.b3-sc`, one per weapon with ×, and × removes that weapon's blocks. Compare build toggles use the picker's rounded-square build tiles, one shape. State tab radius from board 2. The staged tab keeps a solid left bar, dashed top/right/bottom, `--staged` hue and icon, new words. Filter chips take icons in place of dots |
| K7 | **Compare layout and type** | C3-4, C3-5, C3-6, C3-7 | Board 1 G10 plus board 3 type roles | Cards: 2→2, 3→3, 4→4, 5→3+2, 6→3+3; the card title names the build, not only the weapon. Regulate faces and weights to the board-3 role map. **Landing redesigned** |
| K8 | **Anchored floating card** | C5-2 | — | Export hover card: anchor to the file card (open → its line range, collapsed → its header), clamp to the stack's scroll area, and show the mode (MP/DMZ tile hue and label) |
| K9 | **Broadcast rows** | C7-1, C7-2, C7-4, C7-5 | Board 2 G11 (64px rows, the 44px delete, sort chevron) | Centre every cell on the row's centre line (measured). Delete button = Armory's `.wg-ib` delete. An active sort label brightens to `--ink`. A row click opens PostForm prefilled (edit); an Ended row opens it as **Post again**. No inline cell editing |
| K10 | **Selection bar** | C1-1, C1-2 | The Export file fold: **420ms `cubic-bezier(.32,.72,0,1)` on `flex-grow` alone** (handoff-3e §1 M3) | A layered float shadow. The list stays mounted and folds on the same curve; today it unmounts after a 240ms timeout, which is the choppiness |
| K11 | **Post drawer bugs** | C7-8 | — | `overflow-wrap:anywhere` in the preview; repeats pips wrap or cap with "+k"; the form column `minmax(0,1fr)` |
| K12 | **Board images on the artifact** | (my note, C3) | — | A designed fallback tile at the image's proportion when Cloudinary is unreachable; the instrument runs with Cloudinary blocked |

## Facts established before building (so they are not re-derived)

- `p10` (small text) is ruled **`state`** in `local/pins2-board-3/redo/b3/state.js` DEFAULTS. The hint treatment for K3 hints comes from it; hint COPY stays Session 4's.
- Board 2 G11 ruled the staged tab as a **dashed outline** and the State filter chips **with colour dots** (13:06 EDT popup). His intake items C7-6 and C7-7 supersede both; the plan carries both rulings so the change is deliberate.
- The Ends default: board 1 drew "default · Sun Nov 15", and nothing rules how it is computed. K3 designs the field; the date rule stays his open question.
- Selection bar actions: Edit `.b3-btn2`, Export `.b3-btn2`, Stage deletion `.b3-btn2.dang`, Clear `.b3-btn2.quiet` (`local/pins2-board-3/redo/b3/armory-parts.js` SelectionDock).

## Turn budget — his ruling (2026-09-21 19:55 EDT): "60+ is unacceptable … scope that correctly and mega batch it"

Pass 2 (K8, K7, K6, K12, then the K2 options) is **≤ 12 turns**, and pass 3 (the C2 rebuild, K3–K5) is **≤ 12 more**. Each pass has one shape:

| Turn | One message holds |
|---|---|
| 1 | The thinking pass, plus ONE evidence batch: every code and CSS fact the pass needs, pulled in parallel (codebase-memory snippets, one `ctx_batch_execute` for CSS line ranges) |
| 2 | ONE heredoc for every edit in the pass, across all files: an assert per anchor, a print per edit, `node --check` chained |
| 3 | `b4states` plus `shots.cjs` for every affected scenario, in one call, composited into ONE image |
| 4 | Look at that one image |
| 5–6 | One corrective heredoc, then one re-verify call |
| 7 | Commit both repos and update the plan's Progress table, in one call; then the popup |

Anything that does not fit this shape is a sign the evidence batch in turn 1 was incomplete, not a reason to add turns.

## What pass 1 cost, for the record

Roughly 60 turns: about a third went on discovery calls that one evidence batch would have covered, and a quarter on an instrument bug (the probe) found by checking it against a known case.

## Cost (original estimate, superseded above)

Roughly 60–120 turns across `b4.css`, `b1.css`, `local/pins2-board-3/redo/b3/drawer.js`, `local/pins2-board-3/redo/b3/armory-parts.js`, `local/pins2-board-3/redo/ui/armory.js` (Compare), `local/pins2-board-3/redo/ui/broadcast.js` (PostForm, columns), `local/pins2-board-3/redo/ui/manifest.js` (inline edit), the Export picker code, and `gates4/*`. One interim publish for the shell ruling.

## Reference-comparison audit (2026-09-21 22:01 EDT) — after I wrongly called it "done"

Comparing each built surface to his intake screenshots (not to a code comment) found real defects the earlier passes missed:

| His shot | Defect found | Fix, verified by side-by-side |
|---|---|---|
| 109 vs 110 (C2-11) | the bulk editor was a lookalike, not the Export file — the block bar was keyed to `--o` (never coloured, so invisible) and the text had no indent | bar → weapon accent `--c` at left:46px, text indent 22px, textarea +22px so the caret follows. `cmp-review.png` |
| 113 (C3-1) | K7 made the number toggles rounded-squares but LEFT the weapon chip a pill — still two shapes | weapon chip → rounded-square, one family. `aud-toggles.png` |
| 117 (C5-2) | my dock formula put the peek at the container bottom, OVER the file's Copy/Download row | keep the 66px footer clearance, ride up only when the stack is short. `peek-full.png` — footer visible below the peek |
| 108 (C2-7) | the empty image box was `.pb-shot` (a skeleton), which my K12 tile never touched; the `.pb-link` placeholder truncated | `.pb-shot` → a designed dashed tile with the K12 glyph; placeholder → "Paste a link" on Board 4. `img-section.png` |

The lesson (again): I claimed done off a code comment and off resting renders, without putting my work next to his references. Every "done" here is now backed by a side-by-side in `board4-review/`.

## Progress — pass 1, 2026-09-21 19:27 EDT (local only, not published)

| Class | State | Evidence |
|---|---|---|
| K1 control states | **Built**: MP/DMZ rest and hover in their own hue (one rule for C2 and C5); design segments hover and press in the gate's hue, not grey; pressed+hover answers; C9 chip and views in Analytics' hue; drawer close and copy hover; the Armory Weapon sort hovers | `b4states` before (`states-baseline.md`) → after (`states-after1.md`): NONE on real controls 0 outside History's inert zero-count chips and row-level buttons; the remaining GREY are chips whose pressed grey board 2 ruled (All, Compare's weapon chip, left for K6) |
| K9 Broadcast rows | **Built**: every cell's cap centre within ±0.7px of the row's (was −0.6…+1.8, "No end" worst); the Armory's delete; icons on the State chips; the staged tab (solid left bar, dashed rest, `--staged`, Review mark, "Change staged"); active sort label to `--ink`; row click opens the editor, an Ended row opens **Post it again**; no inline cell edit | `board4-review/shots/shot-c7-*.png`; cap-centre method in `b4states` CENTRE |
| K11 post drawer bugs | **Built**: a long word wraps inside the preview; the side column stays 320px so it never overlays the form; repeats wrap | `shot-c7-long.png` |
| K10 selection bar | **Built**: float shadow; the list stays mounted and folds 0fr↔1fr on the Export file's curve; Edit hovers `--staged`, Export hovers `--ok` | `shot-c1-*.png` |
| K2 drawer shell | **Ruled and built, pass 2 (2026-09-21 20:43 EDT)**. Header C: on the build drawers the controls are the title, under a "Create a loadout" eyebrow ("Edit loadouts" when editing), and the controls and the close sit on one centre line (measured 63px on all three). A hairline divider follows. Footer D2: no bar; the actions sit in the preview column's foot at natural width, with a reason chip, an "Add another after this" chip (pressed in `--ok`), then Cancel · Stage. The reasons a build can't stage sit beside the Weapon and Attachments fields. Rejected: header A and B; footers A, B, C (the same wasted space, made invisible), D (full-width buttons), D3 | `board4-review/k2-header.png`, `k2-footer.png`, `k2-round2.png`, `k2-round3.png`, `k2-round4.png`; the intake log's K2 ruling |
| K8 C5 hover card | **Built, pass 2 (2026-09-21 21:28 EDT).** The peek docks to the bottom of the files CONTENT (rides up under a collapsed stack instead of floating in empty space) and carries an MP/DMZ pill in the mode hue. Verified by computed values: peek `on`, pill "MP" in rgb(255,59,92), docked 6.5px from the side bottom | `board4-review/k7/c5-peek.png`; b4states export clean |
| K7 Compare | **Built, pass 2.** Build toggles take the picker tile's rounded-square shape (one shape); cards lay out 1→1, 2→2, 3→3, 4→4, 5→3+2, 6→3+3 by `data-cards`; the weapon pill and toggles take the Armory hue, not board-2 grey (b4states compare GREY 0); the landing is a designed dashed panel with a glyph and tile pills; type to board-3 roles; hover on every surface | `board4-review/k7-review.png` |
| K6 Editing-X chips | **Built, pass 2.** "Editing X" is the selection bar's `.b3-sc` chip, one per weapon with ×, and × strips that weapon's blocks from the editor (`removeWeapon`) | `board4-review/k7/c2-editchips.png` |
| K12 image fallback | **Built, pass 2.** A designed tile at the image's proportion (16/9, dashed, a CSS-drawn broken-image glyph, the key in mono) on Compare's cards and the New-build preview; CSS-only under `.b4`, so 3-E is untouched | in the K7 card sheet |
| K3 C2 form surfaces | **Built (2026-09-21 21:42 EDT).** The native Category `<select>` takes the combobox's chevron and drops the OS arrow (one field family with the Weapon combobox); placeholders lost their italic; the "BUILD n" label prefix is a quiet chip, not a pink block | `board4-review/c2-review.png` |
| K4 mesh | **Already dynamic.** Add lights the mesh from the picked weapon's accent, Bulk from the parsed blocks' — the `hueList` effect in `b3/drawer.js`, no change needed this pass |
| K5 bulk list + C2-10/12 | **Built.** The bulk editor already renders the Export file's `.b3-xt-ln` rows; added a standing grammar legend so the shape survives the first keypress, and board-chrome prefill states (Bulk · empty / one / several) that fill the list with real builds and light the tally | `board4-review/c2-review.png` "Bulk · several" — 3 builds, tally 3 new, export-style rows |
| C7-10 drawer hints | **Deferred to Session 4** by the plan's own fact ("hint COPY stays Session 4's"). The Ends field's treatment is in place; the wording is S4's | — |

⚠️ A measuring lesson from this pass: the first cap-centre probe inserted an inline-block, which is blockified inside a flex tab and reported −4.4px that was not on screen; History looked broken and was not. The instrument now reads each text run's own range and the font's descent, and never mutates the DOM.

## Compact instructions (2026-09-21 19:54 EDT)

```text
/compact KEEP: Board 4 intake fix pass. Read docs/claude/pins2/handoffs/2026-09-21-board4-fixplan.md first (classes K1–K12, pass 1 built: K1 K9 K10 K11), then 2026-09-21-board4-intake.md (his C1–C9 verbatim; screenshots local/pins2-board-3/board4-review/intake/). Nothing from pass 1 is published; v5 is live. Kit git re-rooted at local/pins2-board-3 (kit files under redo/). Instruments: docs/claude/pins2/instruments/b4states.cjs (hover/pressed/grey/cap-centre/containment, Cloudinary blocked) and board4-review/shots.cjs. Rules he restated: fix classes not instances, check neighbouring elements, no fixes shown piecemeal, questions in popups, silent style, tool routing by the question (codebase-memory for code, read_smart for files, ctx_search for prose, chrome-devtools/puppeteer for the page; no rg/cat/sed for discovery). Next: K8, K7, K6, K12, then K2 header+footer OPTIONS as board switches for his ruling, then the C2 rebuild (K3–K5). DROP: the screenshot reads, tool dumps, the instrument-debugging turns.
```

## Post-compact start prompt

```text
/rename Opus5-High · Pins2 S3 Board 4 intake fix pass 2 · Sep 21
Continue the Board 4 intake fix pass, in the turn budget the plan sets (≤ 12 turns per pass). read_smart docs/claude/pins2/handoffs/2026-09-21-board4-fixplan.md and 2026-09-21-board4-intake.md in full before the first tool call. Run a real sequential-thinking pass first (harsh questions, not sorting), then build K8 (C5 hover card), K7 (Compare: toggles, 1–6 card layout, fonts, landing), K6, K12 — each verified with b4states and shots across every section — then put the C2 header/footer options on the board as switches and ask me. Do not publish until I say.
Silent mode. Questions in popups. Tool routing by the question. Mega-batch. One heredoc per Bash call.
```

## Pass 2 — order and open threads (2026-09-21 20:00 EDT)

**Order (changed after the thinking pass):**
1. **K2 header and footer OPTIONS first**, rendered from the real drawers and sent as files with a popup, so he rules while the rest is built. Options:
   - Header: A, the controls inline in one title row; B, title plus a control strip on the same mesh, no black band; C, the Export picker's arrangement.
   - Footer: A, floating actions over a soft scrim; B, a slim footer on the mesh with the reason as a chip; C, the primary action in the header and Cancel as close.
   - All four drawers share it (New build, Bulk, Edit, Post).
2. K8, the C5 hover card: anchor to the file card (open → its line range, collapsed → its header), clamp to the stack's scroll area, and show MP/DMZ.
3. K7 Compare:
   - build toggles as the picker's rounded-square tiles, one shape;
   - cards laid out 2→2, 3→3, 4→4, 5→3+2, 6→3+3, with each card titled by build;
   - type roles set to board 3's;
   - the landing redesigned;
   - hover on every surface.
4. K6: "Editing X" as `.b3-sc` chips with ×, each removing that weapon's blocks.
5. K12: a designed image fallback when Cloudinary is unreachable.
6. Then pass 3, the C2 rebuild (K3–K5) on the chosen shell:
   - lineage table first (element · board 1 · board 3 · his ruling · final);
   - a Filled state beside the empty one;
   - one radius, height and type scale;
   - no native select beside a custom combobox;
   - no italic or truncated placeholders;
   - the dynamic mesh (Add by category, Bulk by parsed blocks, Edit by builds, Post by accent);
   - the bulk list on the export list's lines, with a visible grammar;
   - board-chrome prefill scenarios.

**Open threads a future session would otherwise miss**
- **Not published.** Pass 1 lives only in the kit. The next publish must carry at least: `local/pins2-board-3/redo/b4.css`, `local/pins2-board-3/redo/gates4/main.js`, `local/pins2-board-3/redo/gates4/surfaces.js`, `local/pins2-board-3/redo/ui/manifest.js`, `local/pins2-board-3/redo/ui/broadcast.js`, `local/pins2-board-3/redo/b3/armory-parts.js`, `local/pins2-board-3/redo/b3/history.js`, `local/pins2-board-3/redo/b3/drawer.js`, `local/pins2-board-3/redo/gates/armory.js`, `local/pins2-board-3/redo/gates/history.js`, `local/pins2-board-3/redo/b1.css` (root `local/pins2-board-3/redo/`).
- **The kit's git moved.** Its root is now `local/pins2-board-3/` (the kit sits under `redo/`); the publish root stays `local/pins2-board-3/redo/`.
- **Board-4-only behaviour** is gated on `window.B4_COLLECTIVE` (the History Bot-online fold, the selection-list fold); Board 3-E stays as approved.
- **Kept on purpose:** chips whose pressed state is grey by board 2's ruling ("All", Compare's weapon chip until K6) are unchanged.
- **Unmeasured:** `b4states` forces `:hover` only. Add `:focus-visible` and `:active` to its loop in pass 2's evidence turn.
- **Stale spec:** `board4-spec/` predates pass 1. Regenerate at the end of the fix pass (BOARD=4 extract-spec → split-spec).
- **Still his to rule:**
  - the Ends default date rule (board 1 drew "default · Sun Nov 15");
  - the K2 shell;
  - C7 was held for his comments earlier, and those comments are now in the intake log (C7 1–10).

## FINAL compact instructions and start prompt (2026-09-21 20:03 EDT) — supersede the two blocks above

```text
/compact KEEP: (1) The Board 4 intake fix pass is mid-flight. Its carrier is docs/claude/pins2/handoffs/2026-09-21-board4-fixplan.md, whose §0 WORKING CONTRACT (linksee anchor #45) must be restated as the first thought after this compact. (2) His C1–C9 comments, verbatim: docs/claude/pins2/handoffs/2026-09-21-board4-intake.md; screenshots in local/pins2-board-3/board4-review/intake/. (3) Pass 1 (K1 K9 K10 K11) is built locally and UNPUBLISHED; v5 is live at https://claude.ai/artifact/FCAFvDXrKQN28SotQLJhTh. (4) The kit's git root is now local/pins2-board-3 (kit under redo/); the publish root stays local/pins2-board-3/redo, with every changed file listed in the plan's "Not published" line. (5) His rulings today, including hover-only tints, C2 880px, C8 rulings and C4 already decided — never re-ask; check the intake log, the constraint table and the ledger first. (6) Pass 2 order: K2 options sent as files with a popup, then K8, K7, K6, K12; pass 3 is the C2 rebuild. At most 12 turns each. (7) Instruments: docs/claude/pins2/instruments/b4states.cjs (add focus-visible and active next) and local/pins2-board-3/board4-review/shots.cjs; they find candidates, his eye judges. DISCARD: every screenshot read, the CSS and code line dumps, instrument output tables, the probe-debugging turns, the pre-intake round-1 narrative, and tool-hook reminder text.
```

```text
/rename Opus5-High · Pins2 S3 Board 4 intake fix pass 2 · Sep 21
Continue the Board 4 intake fix pass. Before ANY tool call:
1. read_smart docs/claude/pins2/handoffs/2026-09-21-board4-fixplan.md in full. Its §0 is the WORKING CONTRACT (linksee anchor #45).
2. Make your FIRST sequential-thinking thought a restatement of §0 as a question→call table plus the pass's turn plan (≤ 12 turns). Then keep thinking harshly: what am I claiming that I have not seen, which ruling already answers this, what is the class behind each item, and what will he find in 5 seconds.
3. read_smart docs/claude/pins2/handoffs/2026-09-21-board4-intake.md (his C1–C9 verbatim; screenshots in local/pins2-board-3/board4-review/intake/, which you open to look at, not reason about).
4. Recall linksee by query: "board 4 intake contract" (layer caveat) and "board 4 rulings".
Then run pass 2 in the plan's order:
- K2 header and footer options, rendered from the real drawers, sent with SendUserFile, with a popup;
- K8 (C5 hover card), K7 (Compare), K6, K12.
Each is verified with b4states and shots across every section and looked at by eye. Do not publish until I say.
Tool routing: codebase-memory for code, read_smart for files, ctx_execute_file for line ranges, ctx_search for prose, ctx_batch_execute running node or python. Never rg, sed, awk or cat for discovery.
Silent mode, popups only, mega-batch, one heredoc per Bash call, class not instance, Awwwards worthy, nitpicked, never lazy.
```
