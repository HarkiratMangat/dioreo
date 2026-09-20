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
| The river's columns | **ledger, 2026-09-01** | Five, including **Source**, against the design's four. He chose to keep Source. |
| The search's label | **ledger, 2026-09-01** | "Search events" — the river holds alerts, changes AND restarts. |
| The panel's title | **ledger, 2026-09-01** | Titles the panel with what it is FOR, not with the component's name. |
| A row opens the event drawer | **ledger, closed** | It was a gap, not a difference. Rows are `role=button` and keyboard-reachable. |
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

## Also unattributed, introduced by me today

`--fc` as the chip hue contract · the chip's four-state percentages · the burst sub-head's "6 in 9 min" wording · the export landing's lead/secondary/strip composition · `exs-pick`. Each may be fine; none was shown as a choice.
