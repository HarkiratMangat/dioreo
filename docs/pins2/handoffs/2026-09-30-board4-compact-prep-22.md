---
kind: record
status: live
---

# Compact prep 22 — Board 4 Version 62 live; his V47–V62 rounds built; not signed off

*Written 2026-09-30 12:51 EDT, at his "then prep compact quickly".*

## Where it stands

| | |
|---|---|
| Live | Board 4 `FCAFvDXrKQN28SotQLJhTh` **Version 62** (each publish checked against the artifact's file listing by size) |
| His standing flow | 10:31 EDT: "hold off on any tests/checks, until you've made my changes and i approve the published board 4" — changes are published for his review; relations / r22 / a11y / regen are HELD until he approves |
| Branch | `feat/portal-pins2-manifests`, kit + records UNCOMMITTED since e66a5e89 (commit at the start of the next session, after his approval or on his word); nothing pushed; not signed off |
| Intake log | `docs/pins2/handoffs/2026-09-21-board4-intake.md` § Version 47 intake round and every later note, verbatim (classes BC–BN + his notes to 12:50 EDT) |
| Screenshots / recordings | `local/pins2/intake-shots/intake-v47/` (this Mac only) |

## What was built today (all published)

- V47: name-cell g, named builds, fady wheel · morning checks: Export picker wheel was the INSTRUMENT (0/74 dead), discard read fixed, C7 row names, C3 row cursor, C8 keyboard path already existed
- Round BC–BI (V48): rail two lines then sideways (V49: `.b3-fadx data-rows=2` in every manifest row), hover tiles, ghost `5TH SLOT · Not listed` chip, FaultHint (code pairs over slot-coloured pills + a tall "N missing / from the build|code" tag; Attachments missing = slot cells + tag), plate in the head, Broadcast "Shown N times" inline chip, badge pop fold (the run's mask came back on hover-out), fault glow, one-colour hint containers
- V49–V52: Compare head rebuilt (plate w/ caption, Build chip, badges row full width, shield + image mark stacked, 10px), image mark = the shield's object, image card (bundled thumbs for the 7 named builds in `docs/pins2/kit/thumbs/` + `docs/pins2/kit/data/thumbs.js`), one pop-up at a time (POP handoff), badges one line + direction-aware pop
- V53–V54: `--patch` RETIRED — every use reads `--staged` #D8F24A (the staged yellow); `--ok` #7BDB63 confirm green; `--pn` stays Patch Notes' gold; BEST tier gold stays; checkbox flat staged in every state; focus ring stays cyan (his call); ledger § Colour names + HANDOFF note written
- V55–V62: image card — waits for its image before measuring, anchored by its pointer edge, the container's own animation (no custom), fills to the edges, no pointer-side edge, failed = black incl. the arc + key in an --ok chip, 1.5× image, clamped to the panel with the pointer kept ON the mark (right-most overhangs the panel by 7px), click-to-pin; PHARO's image cleared in board data only; missing-image fault = "No Image or Key" / "Cloudinary hosted image not found" (warn); no-image panel on #0A0D10, no hatch, no inner edge

## Lessons he paid for today (apply from turn 1)

1. Judge every crop against a written inventory; never explain an oddity away (V56 "correct" was wrong).
2. Fix the CLASS: the no-image panel's line along the arc was the same fault he had named for the image card.
3. Clip coordinates = viewport box + scroll; element screenshots move the page and drop hovers.
4. Always film BOTH states (loaded and failed) and BOTH directions.
5. Batch: one evidence call, one heredoc, one capture; sequential-thinking before each unit.

## Next

1. His review of Version 62. Fix what he sends; publish on his standing flow (restate it).
2. On his approval: run relations.cjs (Compare name row is GONE — its rows need updating), r22, a11y.cjs, the regenerate command; update HANDOFF rows (C3 heads, image mark, FaultHint, colour names) and the plan; commit.
3. His sign-off; Session 3's close (plan §13) on his word.
