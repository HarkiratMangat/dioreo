---
kind: record
status: frozen
---

# Board 4 v14 — the nitpick round (2026-09-23 00:27 EDT)

His asks (2026-09-23 00:10–00:14 EDT): harshly nitpick the Bulk create panel; "you seem to have messed up the colors for the row's highlight glow" (the manifest rows); sweep the board for small bugs in buttons, hover and pressed states; harshly nitpick Form A (Instrument) of Add build, scroll included. Kit commits `22259bd` → `0ac0554`. **Published as Version 14 at 2026-09-23 08:31 EDT** on his yes ("yes you can publish", 2026-09-23 08:29 EDT): board4.html plus the seven changed files, each matching its local byte size in the artifact's file listing.

## Fixed, each at its class, each re-shot after the last edit

| # | Fault | Cause | Fix | File |
|---|---|---|---|---|
| 1 | History's and Broadcast's row glow read grey | Board 4 rewrote both from raw `--c` and dropped board 3's round-15D oklch lift; their hues sit near L .6 | every manifest row (Armory, Broadcast, History) glows in `--glo`, its hue lifted to at least L .72 | `local/pins2-board-3/redo/b4.css` |
| 2 | The build drawer changed height with its content: 860px for a form, 588px while typing a Bulk block | only `max-height` was set | the drawer keeps `min(84vh, 860px)` in every state | `local/pins2-board-3/redo/b4.css` |
| 3 | The form scrolled under the header's rule with a hard cut | a mask on the scroller would clip the header controls it carries | ~~a header lift~~ → **replaced in Round 2 (his ruling, local only)**: the form column scrolls with the board's `.b3-fady` fade | `local/pins2-board-3/redo/b4.css` |
| 4 | A wheel at the end of a drawer's scroll moved the board behind it | `overscroll-behavior:auto` | `contain` on every drawer scroller and textarea | `local/pins2-board-3/redo/b4.css` |
| 5 | The image tile stopped 35–97px short of its column | a fixed 16:10 tile beside a 150–207px column | the tile fills the well's height, never under 110px | `local/pins2-board-3/redo/b4/form.css` |
| 6 | "Next free key" sat under the word Key, not under the key field | the hint was a sibling of the key row | the hint renders in the key row's field column | `local/pins2-board-3/redo/b4/form.js`, `local/pins2-board-3/redo/b4/form.css` |
| 7 | "Discard this draft?" confirmed in success green | the confirm was called without `danger` | red, like every destructive confirm | `local/pins2-board-3/redo/b3/drawer.js` |
| 8 | The faded example's text ran half-cut above and below its line (form preview, Bulk empty) | the line lay on the example with no clearing | the example opens a clearing where the line sits; wider in the form | `local/pins2-board-3/redo/b4/classes.css` |
| 9 | Compare Table A: the badge dot hung at the end of the first line | the badge group wraps in a narrow head | the dot is dropped inside a column head | `local/pins2-board-3/redo/b4/compare.css` |

Checked after the last edit: drawer heights 860 in five states; key field and hint both at x 543; tile and column both 813–992; header lift 0 at the top and 1 at 140px; `overscroll-behavior: contain`; Discard is `btn dang`; the glows' computed first radial is the lifted hue. The flow test (`local/pins2-board-3/board4-review/r22.cjs`) passes with no FAIL. Shots: `local/pins2-board-3/board4-review/v14prep/v2/`, `local/pins2-board-3/board4-review/v14prep/fa/`.

## Seen and proposed, not changed (his to decide)

| Surface | Observation | Proposal |
|---|---|---|
| Bulk result card | the card has no hover and only its thin line-number rail jumps to the lines | the whole card jumps, with a hover ring in its own hue |
| Form A | its idea is labels above wells, but attachments and Key are label-left rows | one of the two, everywhere in A |
| Form A, B, C | unchecked badge and tier chips sit at 42% and read as disabled | a quieter rest that still reads as available |
| Bulk editor | a key line gets a hint chip; a link line gets none, while its card says Link | a Link chip on the link line |
| ~~Header lift (#3)~~ | answered 2026-09-23 08:32 EDT: the correction stays, the method is the board's fade | done in Round 2 |

## Not checked

- Firefox and Safari (the CLI drives Chrome); a real wheel at a scroll end (the computed value was read, the chaining itself not felt)
- Hover states were forced by copying `:hover` rules onto a class, which misses a hover declared on an ancestor's `:hover`

## Round 2 — the header lift replaced by the board's fade (2026-09-23 08:32–08:54 EDT) — LOCAL ONLY, not published

His ruling, 08:32 EDT: *"keeping it stick is the correction direction but the lift is the wrong method of implementing it. Use the fading method we already utilize elsewhere, such as the tile's scrolling in Export's Pick builds... panel."* The method is `.b3-fady` (`local/pins2-board-3/redo/b3/fady.js`): a mask whose top and bottom depths are read from the scroller's own position, so a run that fits has no fade.

| Change | Why | File |
|---|---|---|
| the header lift removed | his ruling | `local/pins2-board-3/redo/b4.css` |
| the form column (`.f-form`) and the preview column (`.f-side`) are the scrollers, each `.b3-fady`; `.dw-b` no longer scrolls for Add build | a mask on `.dw-b` would clip the header controls it carries | `local/pins2-board-3/redo/b4.css`, `local/pins2-board-3/redo/b4/form.js` |
| the form grid's row is capped (`minmax(0,1fr)`) and both columns stretch to it | an auto row grew to the form's 1160px, then `align-items:start` kept the column at its content height | `local/pins2-board-3/redo/b4.css` |
| the column clips sideways; a list inside it is never wider than the column | a list wider than its field overflowed the column and scrolled it 69px sideways | `local/pins2-board-3/redo/b4.css` |
| a picker's list scrolls only itself | `scrollIntoView` on the highlighted row also scrolled the column, up and sideways, as a list opened | `local/pins2-board-3/redo/b4/form.js` (the same Picker serves Compare's weapon search) |
| the Stage-reason jump finds the column and scrolls before it focuses | it looked for `.dw-b`; and focusing opened the picker, whose row scroll cut a smooth scroll short | `local/pins2-board-3/redo/b3/drawer.js` |
| Bulk's result list uses `.b3-fady` with a 110px bottom depth | it had an always-on mask that dimmed the first and last card even when the list fit | `local/pins2-board-3/redo/b4/bulk.css`, `local/pins2-board-3/redo/b4/bulk.js`, `local/pins2-board-3/redo/b3/fady.js` (`--fdb`) |
| ~~Bulk and Edit's editor column as the scroller~~ → reverted (`7fe1164`) | the editor's frame sits inside the scroller, so its top edge faded away when scrolled; filed | — |

Checked after the last edit: Form A, B and C filled and DMZ scrolled (fade 28px at a scrolled edge, 0 at a closed one; tile and column 796–975 in B, 815–994 in C; key field and hint on one edge); three builds (card edge 4px inside the column, the attachment list inside it, `scrollLeft` 0); the reason jump in two states (field 65px and 231px below the column top, pulse on); the header controls hit-test to themselves; Bulk list fade 28/17 at 60px and the last card 155px above the footer at the end; the Export picker's fade unchanged (28/28); the flow test PASS 35, FAIL 0. Shots: `local/pins2-board-3/board4-review/v14prep/v3/`, `local/pins2-board-3/board4-review/v14prep/v4/`.

## Compact prep 3 — 2026-09-23 08:56 EDT

### The mistakes, as patterns, each with the habit that prevents it

| Pattern | His words | Habit |
|---|---|---|
| Stated what a surface renders from a reading, twice, and wrote it into the contract before testing | "why didn't you use the preview with pop-up question option that's stated in silent.md?" · "you sure? verify that?" · "test it with a sample question?" | a claim about a surface is tested on that surface first: one sample, then the carriers |
| Invented a treatment the board already had | "the lift is the wrong method of implementing it. Use the fading method we already utilize elsewhere" | search the kit for the behaviour (fade, mask, scroll, glow) and use the existing class before drawing a new one |
| Ported a recipe and dropped a decided parameter: Board 4 rewrote History's and Broadcast's glow from raw `--c`, which is caveat 61664 word for word | "you also seem to have messed up the colors for the row's highlight glow" | before porting a recipe, list its constants and recall the element's pinned caveats |
| Asked him to pick and publish while the surface still had defects | "i just notice bugs and nitpicks needing fixing" | the full sweep (every state used, hover forced, scroll) comes before any popup asking him to decide |
| Wrote a layout fix three times on assumption (height chain, grid row, alignment) | — (found by me) | read each ancestor's height, display, rows and align first; then write one fix |
| An edit changed code it did not mean to: a `//` comment appended to a line swallowed the jump's scroll call, and `node --check` passed | — (found by me) | never append a comment inside a replaced line; assert the statements that must survive |
| Moved a structural role and broke its consumers (the scroller: the jump, the picker's up/down test, the row scroll) | — (found by me) | search `closest(...)`, `scrollIntoView`, `scrollTop`, `sticky` for the old role and open each consumer |

### What is only partly verified

| Change | Opened and looked at | Measured only, or not opened |
|---|---|---|
| Manifest glow (`--glo`) | Armory, Broadcast and History rows, one each, hover forced | a real pointer hover; History's `.open` row; Repairs tickets (a separate recipe, filed) |
| Drawer height | Bulk typing and several, Form A | Edit and DMZ measured at 860, not looked at after |
| Scroll containment | — | computed `contain` only; never scrolled with a wheel |
| Image tile, key hint | A, B and C filled, A blank | the Link and Stored image sources; the "Replaces the image on" warning |
| Faded example clearing | Form A MP, DMZ, the half-typed weapon; Bulk A empty; Bulk C empty | Form B and C empty previews |
| Discard in red | the confirm, looked at | — |
| Form column fade (local) | A filled at 140px, DMZ at 300px, three builds with the jump open, B and C at the end | Tab through the fields (focus ring against the column edge, 4px measured); a real wheel; Bulk C typing |
| Picker in-list scroll (local) | the attachment list at the bottom, keyboard ↓ six rows | Compare's weapon search, which uses the same Picker |
| Bulk list fade (local) | several at 60px and at the end | empty and one (the list fits: measured 0 only earlier) |
| The whole board | Chrome, 1440 wide | Firefox, Safari |

### Claims I made that I correct here

- "Previews can only show text", then "in this app a preview is HTML: boxes, colours and sizes work": both wrong. The Code tab shows no preview at all, while choosing or after (tested twice). The contract, working agreement and memory say so now.
- "every manifest's rows glow in their own colour": Armory, Broadcast and History only; Repairs tickets keep their own recipe.
- "The 35-flow test passes": true when I said it only by luck of the count; the output is 35 PASS lines plus a summary line, `PASS 35 FAIL 0`, read at 08:49 and 08:51.
- The v14 record called the header lift a fix; it is replaced (row #3 now says so).

### What this round broke that the last had fixed, by class

| Class change | Reaches | Result |
|---|---|---|
| the scroller moved from `.dw-b` to `.f-form` | the reason jump (round two #18), the picker's up/down test (v11.1), the list row scroll, `.f-side` sticky | the first three broke and are fixed; sticky is moot |
| `.f-form` clips | the three-builds card ring, the focus ring | 4px room, card edge 4px measured, looked at in the jump shot |
| `fady.js` reads `--fdb` | every `.b3-fady` on the board | unchanged unless set; the Export picker re-measured 28/28 |
| `.wg-r:hover` redefined in `b4.css` | every Armory manifest row | one row looked at |

### Instruments that misled me, and the recipe

| Instrument | How it misled | Recipe |
|---|---|---|
| reading the app's code to say what a popup renders | the sanitiser allowed HTML, the Code tab renders none | a sample on the real surface |
| forced hover by copying `:hover` rules to a class | a control that grows on hover was cropped at its rest box and looked broken | crop the union of the rest and hover boxes |
| finding "rows" by geometry | picked a weapon header and a day header | find rows from the rules that paint the glow |
| `scrollHeight > clientHeight` as "it scrolls" | true on an `overflow:hidden` box | read `overflow-y` and move `scrollTop` |
| a test read 1.2s after a smooth scroll | the scroll had been cut short, not slowed | log the scroll events to see who scrolled |
| `node --check` after an edit | passed with a statement commented out | assert the surviving statements |
| a shell chain with `;` after a failing heredoc | later commands ran on the old files | `&&` to the end; the failed batch committed nothing |

### Stale because of the prep itself, re-read

- This record's row #3 and its proposals table: updated above.
- `.remember/remember.md`: its first line, PRE-FLIGHT (29–33 added) and WHERE THIS STANDS: rewritten.
- The v12 critique's start prompt is superseded by the one below.

### Filed, not fixed

- `docs/db-deferred-list.md` → Active Bugs: Bulk and Edit's drawer body scrolls with a hard cut; Repairs tickets' hover recipe; the Board 4 fixes Session 5 must carry into `portal/ui`.

### Open, his to decide

- Publish the fade round as v15.
- The four fork picks (Form, Bulk, Table, Empty).
- The four proposals: a clickable Bulk result card, one label layout in Form A, the chips' rest state, a Link chip in the Bulk editor.
- Still open from before this session: the real-summary rating test (`docs/claude/2026-09-22-summary-corpus-ratings.md`, "Next: the real test"), nine unmarked items in `docs/ideas/diors-notes.md`, four orphaned forks in linksee from other sessions.

### Compact — KEEP / DISCARD

KEEP: this file (Compact prep 3 first) · the v12 critique's Compact prep 2 · the fix plan §0 · `.remember/remember.md` PRE-FLIGHT 0–33 · anchors #47, #48, #50, #51 and the board-fade anchor · the caveats written in this prep · `local/pins2-board-3/board4-review/v14prep/` shots `v3/`, `v4/` · `local/pins2-board-3/board4-review/r22.cjs` and `docs/claude/pins2/instruments/b4states.cjs`. DISCARD: the first fork popup and its previews · the header lift · the reverted Bulk/Edit column scroller (`703abb0`) · the scratch hover sheets in `local/pins2-board-3/board4-review/v14prep/fa/` · every intermediate scroller attempt.

### Post-compact start prompt

```text
/rename Sonnet5-XHigh · Pins2 S3 Board 4 intake round · Sep 23
Continue Board 4 (Session 3 of pins batch 2): an in-chat intake round on the latest board. Before ANY tool call, read_smart in full, in this order: docs/claude/pins2/handoffs/2026-09-23-board4-v14-nitpick.md ("Compact prep 3" at the END first: the patterns with his words, what is only partly verified, the corrected claims, the instruments that lied; then Round 2 and the round above it), then "Compact prep 2" at the end of docs/claude/pins2/handoffs/2026-09-22-board4-v12-critique.md, then §0 WORKING CONTRACT of docs/claude/pins2/handoffs/2026-09-21-board4-fixplan.md, then .remember/remember.md in full (PRE-FLIGHT 0–33). Recall linksee by query on both entities (Diors-Builds, pins2-board-3): 'board 4 v15', 'existing treatment before inventing', 'scroller consumers', 'popup preview test'. Anchors #47, #48, #50, #51 and the board-fade anchor govern. Do not trust this prompt's summary of state; the carriers are the record.
State to confirm from the carriers, not from here: v14 is published; the fade round (kit commits after 0ac0554) is local only and needs his yes to go out as v15.
For his intake: write each item's question, then the surface that answers it (the local board with the chrome-devtools CLI; the artifact's file listing for a publish; never the live page). Before inventing any treatment, search the kit for the one the board already uses. Fix the CLASS, search every consumer of what you change (closest(), scrollIntoView, scrollTop for a scroller) and open every state it reaches: USE it (click, type, paste, Escape, ⌘↵, scroll) and LOOK, three faults per shot. A claim about what a surface renders is tested on that surface first. Never append a comment to a line inside a replacement; assert the survivors after writing. Read a layout chain before writing a layout fix.
Silent mode: zero prose between the first tool call and the final message; the final message in the Silent contract's shape, everything for him in the closing section. Tool routing by the question: read_smart for whole files, codebase-memory for code, ctx_search / ctx_execute_file for prose and slices, rg / sed / cat only as a last resort for one literal. Mega-batch: one heredoc per Bash call, ended with &&, kit paths from one K prefix. Sequential thinking pre-emptively and harshly. Class, not instance. Awwwards worthy, nitpicked never lazy. The phone is not a review surface. Publish only on his yes.
```

