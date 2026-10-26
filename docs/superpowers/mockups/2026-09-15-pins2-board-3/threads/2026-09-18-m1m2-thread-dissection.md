---
kind: reference
status: live
---

# Board 3-E · M1/M2 threads, dissected before any work (2026-09-18 22:57 EDT)

Thirteen threads, every screenshot opened (the GIF read frame by frame), each traced to the rule or handler that causes it. Nothing is built yet.

## The mechanisms underneath — why these keep coming back

| # | Mechanism | Threads it produced this round |
|---|---|---|
| 1 | A fix declared on a class and never measured where the element lives | VIEW label "fixed to 9.5px" in round 3t, still 12px |
| 2 | Tag-scoped or context-inherited styles leaking into new children | VIEW 12px and "7builds" (`.b3-sd-lh > span`); the hint in capitals (inherits the column head's type) |
| 3 | State matrices written one cell at a time | blank yellow mixed checkbox on hover; pill dot glow only when pressed |
| 4 | Per-row grids pretending to be a table | all three gap threads |
| 5 | A handler and its tooltip written separately | [-] selects all while its own hint says "Click to clear the selection" |
| 6 | Instance overrides splitting one class into two | `.b3-btn2` pill vs 8px in Export; three popover outlines; ghost button patched once in the dock |

## Thread by thread

**2aed701d · select-all hint and [-]**
- Mixed click: `SelectAllBox` does `setMany(ids, !all)`, so mixed → select all. Same in every weapon-group header (`ArmoryGroups`, `!allSel`) and in the portal's own `Manifest.toggleAll` — every realm's select-all. Fix: select only when none is selected; otherwise clear.
- Blank yellow: hovering a mixed box matches `.wg-cb:hover .cb:not(.on)::after` (0,5,2), which beats the mixed dash rule (0,4,2) and paints the dash in the fill colour. p4 a and b both. Class: every tri-state box (manifest header, weapon headers, Export All chip, Export weapon names). Fix: a real `mx` value class and every state rule written as `:is(.on,.mx)` / `:not(.on,.mx)`, then all 15 value × state cells rendered and looked at. Hover should preview what the click will do: on a mixed box, the dash receding.
- Hint in capitals: the card never resets inherited type, so it wears the column head's uppercase tracking. Concise copy: one state-driven line ("Select the 21 shown" / "Clear 5 of 21"). Shape: the problem card's pcPath outline and two-way transition; the board has three popover outlines (`.b3-hint-card`, `.b3-infocard`, `.b3-pc`) and only the last moved to pcPath. The class is those three.
- Unasked: when a filter hides some selected builds, does [-] clear only the shown ones?

**835f9aa3 · category pills**
- The "text selection" highlight is app.css 3956: a pressed topic chip's count gets `background:var(--c)` with no padding or radius.
- Colour and weight: the number takes the pill's hue lifted for legibility (`oklch(from var(--c) max(l,.76) c h)`, already used on the board) and one weight step up.
- Middle alignment: flex centres the line boxes, not the ink, and the count is a different size. `text-box: trim-both cap alphabetic` on label and count centres the glyphs (Chromium 133+; verify in Arc).
- Hover dot glow: only the pressed state draws the ring; hover should preview it.
- All has no count: FilterChips builds "All" without one, while Repairs' All and the Export picker's All carry one.
- Class: five rule sets style "a count in a chip" (`.chip.topic em`, `.mmore .chip em`, `.b3-xt-chips … em`, `.b3-fc em`, `.segn`). One count token.
- Unasked: counts ignore the search query and the other filter group, so typing "kilo" leaves "Assault 7" beside 2 rows.

**9ac5e9ae · rail toggles**
- VIEW at 12px: `.b3-sd-lh > span` (0,1,1) sets 12px and beats `.b3-sd-vl` (0,1,0); the label is a span in that header.
- The ring: `.b3-sd-vt button.on` draws an ink ring; `.seg` pressed is fill only. `.seg` is portal-wide (Season, Broadcast, Access).
- Icons: List → `list`, By slot → `columns-3` (mirrors what that view looks like, as `layers`/`table` do). Mode toggles (MP/DMZ) would need a guess at game semantics.

**28dca303 · "7builds"**: the count and word sit in a span that the `.b3-sd-lh > span` family restyles. Default p10 is `state` (8px gap), so the exact zeroing declaration is **unverified** until measured in his stored state.

**3300d186 · critique (full frame, 2190px)** — awaiting approval
1. Over half the bar is empty: the range that qualifies the name sits a screen-width from it.
2. SMG's hue and the selection colour are the same yellow, so one hue means two things in one row.
3. Two formats of build reference side by side ("Build 3", "Builds 1–3").
4. The problem chip is louder than the name that heads the row.
5. The × is the only circle on the bar, and heavier than the text.
6. The accent rail is a flat bar parked inside a rounded corner.
7. When the group is open, "Builds 1–3" and "Build 3 · 1 problem" restate the rows directly beneath. They earn their place only when the group is collapsed.
Recommendation: a name-led header; range and problem summary only when collapsed; the row's controls on the right; a selection hue that is not a category hue.

**7e265e57 · ae7b2bbb · d3120fb3 · gaps**: each row is its own grid with worst-case tracks (weapon up to 150px, code 132px, marks 110px), and the marks cell has six competing templates. Fix: one grid per list, rows as `subgrid`, `max-content` for #, weapon, code and marks, `1fr` for attachments. An even rhythm from the rail inward (rail→#→weapon), the triangle slot kept so images align, and one marks template for both views. Unasked: the green image mark on nearly every row reports one absence twenty times. Marking only a missing image would quiet the table and remove most of the marks gap.

**846eb917 · ticket footers**
- "Correct the code" touching the ring is an overflow, not spacing: three nowrap items exceed the card, and "Add the code" fits only because it is shorter. The padding is also asymmetric (18 left, 12 right).
- Pills → soft rectangles is the `.b3-btn2` radius. Export already overrides it to 8px as an instance.
- Age → reuse Broadcast's `.pb-pill` itself ("touched 5mo"), and the same chip on every other age readout.
- "Show in the manifest" is `.b3-btn2.ghost`: no fill and no ring, so it reads as text. Ghost is also used by the dock toggle (already patched as an instance), History and EndPicker.

**1f502de1 · ticket layout**: `auto-fill` rows with `align-items:start` leave holes under short tickets. Options: masonry (order zig-zags), equal-height rows (space moves inside), columns (order runs down), or sections by severity. To be **shown** before asking.

**96b7a5b1 · pass card**: the tickets' anatomy (header, body, footer, ring) with the ok hue on the ring, dot and badge, spanning both lanes. It names the five checks with a tick each, and the 90-day nudge uses the same age chip. It is not a filled green slab, which would outshout five warnings. The clean-day state is the same card, grown, not a second design.

**444d806a · slot palette**
- Ammunition #FF2A55 ≈ the MP red and the danger family.
- Laser #00F69B reads as the ok/pass green.
- Unknown #E6EAEE ≈ the attachment-name white (#E8EDF1), so an unknown slot's label merges with its name.
- The remaps are safe only if the paired slots never share a build. **The dev database carries none of the six extra slots** (its slots: Ammunition, Barrel, Laser, Muzzle, Optic, Perk, Rear Grip, Stock, Underbarrel, plus a blank "" on some builds), so that is unverifiable here. The round-3u Active Bug stands.

**23900247 · tag style**: once Laid on takes Outline's hue ring, the two differ only by fill. His lean becomes one choice, ring with fill or ring alone, shown side by side. A hue ring also makes the palette collisions louder.
