---
kind: record
status: live
---

# H1 — every element of the History manifest, and what decided it

*Written 2026-09-20 13:16 EDT, after Harkirat's verdict on a day of work: **"narrow minded, short scoped, blind work. not considering relevant redesigns already in use, not considering layout, structure. Not using any of the design skills available to you. Working on the instance instead of the class."** He was right, and the cause is that this table did not exist. Every complaint he raised today was me redesigning something the record had already settled, because I had never written down what the record says.*

**The rule this table exists to enforce:** before any element of H1 changes, find its row. If the row names a pin, a ledger decision or a round, that element is a CONSTRAINT and changing it is a proposal to be shown, not a fix to be shipped. If the row says OPEN, it is mine to design. If an element has no row, it was introduced without authority and needs one.

## Sources

| Source | What it carries |
|---|---|
| `local/pins2-board-3/redo/gates/history.js` → `notes` | Pins 51–57, the gate's own statement of his decisions |
| `docs/reference/portal-decision-ledger.md` § History | Nine adjudicated rows from the Analytics split, 2026-09-13 |
| `.impeccable/surfaces/portal-ui-history-js.md` | The surface brief: mode, audience, job, what must stay untouched |
| `docs/superpowers/mockups/2026-09-15-pins2-board-3/README.md` | Rounds 3f, 4g, 9A, 9B and versions 57–67 |

## The surface's job, in its own brief's words

> Every change, alert and restart on one timeline, with revert as its single action. **The arriving state: something changed and he wants to see what, who did it, and put it back.** The memorable moment: the one place a committed mistake can be undone.

Mode is **Operate**. Colour carries topic; shape carries state.

## The table

| Element | Decided by | What it is allowed to be |
|---|---|---|
| Kind | **pin 53** | A state tab — one shape, one colour per kind. Not a dot, not a bare icon. |
| The row's left edge | **pin 56** | Carries the kind's colour. The square chip that used to is gone. |
| Who | **pin 54** | Names the person. |
| Level | **pin 55** | A meter, four rungs filled to the severity, shown ONLY on an alert. |
| The filter groups | **pin 57** | Six — kind, level, who, realm, when, can-be-undone — each counting what it would leave standing. |
| Counts | **pin 51** | Upright, not rotated. |
| The panel's explanatory sentence | **pin 52** | Behind an info button. Session 4 writes the words. |
| A uniform column | **round 3f** | DEMOTES (kind to a mark, who to the avatar) — never disappears. Measured on the shown rows, not the whole log. |
| The entity | **round 3f** | Text with its realm icon. Never a chip: "a chip is for something you act on, a name is a name". |
| `undone` and the undo button | **round 3f** | Both in the action column. They are one relationship. |
| The verb | **round 3f** | Drops a trailing type noun when the entity renders beside it. |
| The river's columns | **ledger 2026-09-01, narrowed by round 3f** | Five. 🔴 **The ledger names them When / Kind / Source / What / Who; the BOARD's five are Time / Kind / What / Who / Undo with source folded into the WHAT cell as `.b3-src`, and round 3f settled that ("Five columns, four header labels | The fifth is named").** Round 3f is later and wins. Read this row before "restoring" a Source column - the first draft of this table said the ledger's five plainly and would have caused exactly the mistake the table exists to prevent (caught 2026-09-20 13:46 EDT). |
| The search's label | **ledger, 2026-09-01** | "Search events" — the river holds alerts, changes AND restarts. |
| The panel's title | **ledger, 2026-09-01** | Titles the panel with what it is FOR, not with the component's name. |
| A row opens the event drawer | **ledger, closed** | It must open the drawer and be keyboard-reachable. ⚠ The ROW no longer carries `role=button`: a real button around the phrase does, because a row carrying it CONTAINED the Undo button (fixed 2026-09-20 13:40 EDT). |
| Filter chips by kind AND level | **ledger, 2026-09-01** | Nine chips against the design's seven. Kept. |
| The day as a row of the table | **round 9A** | The day header is a row of the list's own grid. |
| One grid, rows as subgrids | **v14 `7e265e57`, round 9B** | A column is as wide as its widest entry and still lines up. |
| Chip states | **round 6B** | Rest → hover → pressed, hover being the pressed fill at a third, in the hue. |
| The row's hover ground | **his instruction, 2026-09-20** | The Armory manifest's mesh, layer for layer. Only `--c` differs. |
| The realm marks | **his instruction, 2026-09-20** | `portal/ui/shell.js`'s own `REALM_ICON` paths. |
| Every toggle rail | **his instruction, 2026-09-20** | Carries an icon matched to the view it opens. |

## OPEN — genuinely mine to design, and not yet shown

| Question | Status |
|---|---|
| The count readout ("12 shown · 1,323 recorded" against "11 of 11") | **Flagged OPEN in the ledger, 2026-09-01, never adjudicated.** |
| The When column: UTC or local | Brief, § Unresolved — batch-2 Session 2 owns it |
| Column widths by role | Brief, § Unresolved |
| Severity on the level chips | Brief, § Unresolved |
| Whether the row's Undo carries a colour at all | Raised by his "can be undone uses staging yellow but Undone doesn't" — half answered, half open |
| The day's shape (`p9` a–e) | Five options built, none picked |

## 🔴 Three things I changed against this record without showing him

*Each is live on the board right now and each needs his word — keep or strike. Listing them because a decision of mine buried inside a bug fix is one he cannot see to refuse.*

1. **The panel's title is now "EVENTS".** The ledger says the portal titles the panel with what it is FOR. "Events" is a noun; the ledger's example is "One history, both front doors". I replaced a purposeful title with a category label while porting the toolbar.
2. **The count line is gone.** I removed "100 shown · 1,421 recorded" on the argument that the portal's own manifest toolbar carries no count readout. But the ledger has that exact question **flagged OPEN and explicitly not adjudicated** — so it was not mine to settle by porting.
3. **The whole toolbar is now the portal's `.mtools` component.** He asked for the header to be reworked and for it to stop using a different search bar. Adopting the portal's entire two-row toolbar is broader than that, and it is what silently dropped items 1 and 2.

## Added after this table was first written (2026-09-20 13:40 EDT)

| Element | Decided by | What it is allowed to be |
|---|---|---|
| A story - consecutive rows in a day on one entity by one person | **round 3f's unbuilt note**, built 2026-09-20 | Bound, never merged: one unbroken left rail, no hairline inside the pair. Completeness untouched. ⚠ **THE RULE IS MINE AND HAS TWO KNOWN LIMITS, neither shown to him:** two genuinely separate changes to one entity minutes apart WILL bind, and a real pair separated by an unrelated row will NOT. Measured: 13 stories, all pairs, in 100 rows. |
| The row separator | **the design review, P1** | Visible between UNBOUND rows only; a bound pair has none |
| Undone | **the design review, P0** | Not a button. A tick and a word, no box, no pointer. Undo is the only button-shaped thing in the column |
| The kind tab's saturation | **the design review, P3**, inside pin 53 | Lowered. Shape, hue and position are pin 53's and are untouched. ⚠️ `:not(.quiet)` — the DEMOTED mark keeps its 14% fill and no ring |
| The row as a control | **a11y, and the ledger's closed row still holds** | The row is a plain div; the keyboard path is a real button around the phrase. No interactive nested in an interactive |
| Anything measured on a shared browser page | **anchor #42 and the page-2 contamination** | Re-taken on a page no other actor is using |

## Added by ROUND 12 (2026-09-20 14:19 EDT)

| Element | Decided by | What it is allowed to be |
|---|---|---|
| Which part of the panel scrolls | **ROUND 12, measured** | The LIST scrolls; the toolbar and the column head are the frame. The head sticks inside the list's scrollport; day headers stack beneath it at `--hi-head`. The day header's sticky had never worked before this |
| The story's identity key | **round 3f's rule, extended in ROUND 12F** | An event with no entity is identified by WHAT IT SAYS. Repeated alerts bind exactly as a change pair does. Nothing merges, nothing hides |
| A run of content longer than its box | **DESIGN.md § Overflow fades** | Fades on the BOX, never cuts. On a row it is the verb-and-entity group that carries the mask, not the cell — a mask on the cell eats whatever is right-aligned in it |
| The WHO avatar | **round 3f's demotion, applied to weight** | 22px, initial at `--ink2`. It keeps its shape and gradient; it stops being louder than the name beside it |
| The row's open affordance | **ROUND 12H** | The verb underlines on hover and on focus. No new control, no new column |
| ⚠️ The level meter's position | **round 3f, re-read** | It stays in the WHAT cell, trailing the phrase. Moving it into the action column was tried and is WRONG: 3f says `undone` and the undo button are both in the action column because *they are one relationship*, so that column is the undo relationship and nothing else |

**Recorded as answered, not built:** the design review's "73 of 100 rows are structurally half-empty". The census is 27 change / 47 alert / 26 restart, with 27 entities and 73 empty action cells. That is the log telling the truth, not a layout defect, and the board's own answers to it are round 3f's demotion and ROUND 12F's story binding. No column was added and none was hidden.

**Still his, untouched:** the count readout (ledger-OPEN) · whether Alert is a kind or a property of a restart · the `p9` day shape.

## Added by ROUND 15 — the intake round (2026-09-20 17:46 EDT)

*Seven items from Harkirat, sorted by CAUSE. Three roots: PROVENANCE (a component existed and the surface drew its own), EDGE OWNERSHIP (a boundary drawn by something that does not own it), and A MISSING SYSTEM (H1 had no spacing scale).*

| Element | Decided by | What it is allowed to be |
|---|---|---|
| The day shape (`p9`) | **his instruction, 2026-09-20 17:22 EDT** | **B · Time rail. DECIDED** — *"the drastic redesign is deferred for now."* A, C, D and E are no longer offered; the fork carries `decided` and the switch collapses to it |
| The row's left accent | **his instruction, ROUND 15** | The Armory manifest's rail, ported: 3px at `--c` 42%, `left:0`, inset 9px top and bottom, joined across a bound story. The p9=b dots and the 1px rail line are gone — that line carried `z-index:-1` and had never once rendered |
| The kind tab's edge | **pin 53, restored** | `inset 3px 0 0 var(--c)` — the state tab "carried on its left edge". A ring had replaced it while the design review's saturation change was applied; a saturation change must not take the shape with it |
| The day row's kind mix | **ROUND 15** | The same kind tab as the rows, not bare text. One object names a kind on this surface |
| The row's hover ground | **his instruction, 2026-09-20, corrected in ROUND 15** | The Armory mesh **parameterised, not copied**. The recipe's middle radial is hard-coded to `--warn`, which screens to grey against H1's cool state hues; it derives from `--c` here. A literal port of a parameterised recipe is not a port |
| Any 1px container edge | **ROUND 15, board-wide** | Declared as `--b3-edge` and drawn by the shared `outline` rule, never as an inset ring. An outline paints above descendants; an inset ring does not, which is why a full-bleed child cut it. 153 crossings over 24 child/parent pairs before the change |
| A band's inset | **ROUND 15** | Declared once, by the band that spans the panel. The toolbar owns its bottom edge; the filter grid owns neither an edge nor an inset |
| H1's spacing | **his instruction, 2026-09-20 17:22 EDT** | Thirteen named relationships as `--h1-*` on `:root`, written by the Spacing playground in the gate's own controls and persisted in the board store. No hard-coded gap in the H1 block |

**Still his, untouched:** the count readout (ledger-OPEN) · the panel titled EVENTS · the whole-toolbar port · whether Alert is a kind or a property of a restart.

## Also unattributed, introduced by me today

`--fc` as the chip hue contract · the chip's four-state percentages · the burst sub-head's "6 in 9 min" wording · the export landing's lead/secondary/strip composition · `exs-pick` · the story binding's own rule (consecutive, same entity, same actor, within a day) · the row separator's weight · the 440px filter column. Each may be fine; none was shown as a choice.

## Ruled on Board 4 — 2026-09-21 16:12 EDT

*Harkirat's popup answers, shown each option as a capture from Board 4 first (`local/b4-nitpick/C8-*.png`).*

| Element | Ruling | Built |
|---|---|---|
| Toolbar label | **EVENTS** stays (MANIFEST offered and declined) | unchanged |
| Count line at the toolbar's right | **Left out** | unchanged — the ledger's OPEN count-line row is now ruled |
| Is Alert a kind? | **No — a "Bot online" alert in the same minute as a restart is how that restart ended.** The pair folds into the restart row | Board 4 only (`window.B4_COLLECTIVE` in `local/pins2-board-3/redo/b3/history.js`): 26 folds, Alerts 47 → 21 |
| The folded row's mark | Direction A, a tag — then *"that design is ass"*; rebuilt as a **Back online** chip in the row's own kind-chip family (`.b3-htab`, `--c: var(--ok)`) | `local/pins2-board-3/redo/b3/history.js`, `b4.css` |
| Row accent (intake 7a) | **Right** — full `--c` | ruled |
| Container edge (intake item 2) | **Right** — the edge drawn on top | ruled |
| Day-row chip (intake 7e) | **Not right:** *"look at the chips in the rows below it."* Now the kind chip's size and type (24px, t-sm, 13px icon), its colours unchanged; measured identical on every property, centred to 0px | `b4.css` |
| Row hover glow | Must equal the Armory manifest's — now `.wg-r:hover`'s recipe exactly, `var(--paper)` base included | `b4.css` |
