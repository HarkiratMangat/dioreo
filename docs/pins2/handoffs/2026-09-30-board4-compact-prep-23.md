---
kind: record
status: live
---

# Compact prep 23 — Board 4 Version 75 live; his V62–V74 reviews built; not signed off

*Written 2026-09-30 17:32 EDT, at his "quickly prep compact so we can continue".*

## Where it stands

| | |
|---|---|
| Live | Board 4 `FCAFvDXrKQN28SotQLJhTh` **Version 75** (every publish checked against the live copy by size) |
| His standing flow | 10:31 EDT: changes are published for his review; relations / r22 / a11y / regen HELD until he approves |
| Branch | `feat/portal-pins2-manifests`, compact-prep commit below; nothing pushed; not signed off |
| Intake log | `docs/pins2/handoffs/2026-09-21-board4-intake.md` § Version 62 review → § Version 70 review and the notes after it, verbatim, with a class table per round |
| Screenshots / checks output | `local/pins2/intake-shots/checks/` (this Mac only); old kits for comparison in `local/oldkit` (V62) and `local/oldkit2` (e66a5e89) |

## What V63–V75 built (classes BO–CN in the intake log)

- V63: Hint re-places on scroll, Escape; a pinned card holds the board (`popHeld`); 1440px thumbs; manifest image mark = Compare's (BuildImage + toggleMark in armory-parts); fault tiles; one field glow
- V64: ONE border drawn above the content (`.b3-pc-line`); Repairs tiles all warn chips with rings, Below standard mark black; manifest mark 28px; one delete hover, Edit staged, Shown hover; badgeDir bounds; Pick builds tiles = Compare landing tiles (shared rules `:is(#compare, .b3-xt)`), + nudged 6/6
- V65–V66: mark glyph centred; Shown pink everywhere; showings pop `w="auto"`; Pick tiles back to 3 columns; badge unfold anchored to its growing edge
- V67: Repairs caption removed (PHARO's cleared image had made it show); pop stepper = drawer's
- V68: one focus ring per composite field (ring on the box)
- V69–V70: pop-up family = the cards' arc container (`PopBox`, tone per chip, tip on the chip's centre); ring as an `::after` over the content; Post drawer 880 → 910 (form 496, preview 340)
- V71: menus/pop-ups inside a faded column render in a layer beside it (`docs/pins2/kit/b3/layer.js`); stepper rebuilt
- V72: Shown + start/end chips hover and pop in the announcement's accent (`t-accent`)
- V73: stepper C (his pick): one ring, − / + inset pills, 17px glyphs, accent-tinted hover
- V74: `--meshGold` #F2C230 on the drawers' / selection dock's mesh glow (ledger § Colour names)
- V75: the layer is out of flow (the column kept its height; the fade no longer moves)

## Instruments added (tracked, held with the other checks)

`docs/pins2/instruments/board4-checks.cjs` + `-lib.cjs` (drawn border, clip, pinned scroll, hover states) · `board4-rings.cjs` (styles, gates + drawers) · `board4-rings-painted.cjs` (pixels, starts 2px outside the edge)

## Lessons he paid for (apply from turn 1)

1. A question is not a work order ("mini intake round" = answer only).
2. Measure PAINTED pixels, not computed styles, and start every sample outside the edge (half-pixel boxes).
3. A check must be able to fail on the old version first; a probe that closes the drawer it measures is blind.
4. Never explain an oddity away ("mid-animation", "crop ended") — measure it.
5. A helper element that inherits a component's classes inherits its layout rules too.

## Next

1. His review of Version 75 → fix, publish on his standing flow (restate it).
2. On his approval: relations.cjs (Compare name row gone), r22, a11y.cjs, the regenerate command, HANDOFF rows (C3 heads, image mark, FaultHint, colour names, PopBox/layer, stepper), plan; commit.
3. Sign-off; Session 3's close (plan §13) on his word.
