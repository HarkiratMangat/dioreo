---
kind: record
status: live
---

# Compact prep 21 — Board 4 Version 46 live; screenshots local; the unchecked items run; three things left open

*Written 2026-09-29 23:52 EDT, at his "prep compact. after compact, publish, and continue the checks, sweeps, etc."*

## Where it stands

| | |
|---|---|
| Live | Board 4 `FCAFvDXrKQN28SotQLJhTh` **Version 46** (2026-09-29 23:44 EDT): Version 45 (his V44 round AT–BB, 23:16 EDT) plus the build name as its own table row |
| In the kit, NOT published | the name cell's clipped descenders fixed (`b4/compare.css`, `.cx-nm .cx-vt`) · seven builds named, one per category (`data/armory.js`: BAL-27 2 "Long range", FENNEC 1 "Hip-fire" (not "Run and gun": the click-flow suite types a FENNEC "Run and gun" into Bulk and expects a NEW card; naming the stored build that made it an Update, 34/35 — renamed, the flow re-run), HOLGER 26 2 "Anchor", SO-14 1 "Long-range support marksman", DL Q33 1 "Quickscope", STRIKER 2 "Close quarters", .50 GS 2 "Sidearm") · the wheel routing (`b3/fady.js`: a column that cannot scroll is passed over — post drawer 22 of 58 dead → 0) · `relations.cjs` 38/38 |
| **His order after the compact** | **publish** these as Version 47 (his words: "after compact, publish"), then **continue the checks and sweeps** |
| Sign-off | not signed off |
| Branch | `feat/portal-pins2-manifests`, nothing pushed; **history rewritten** so no screenshot is in it (every one of 546 commits differs from its original only by image files; backup ref `backup/pins2-with-screenshots-20260929-2335`, local only — delete only on his word) |
| Screenshots | his call 23:31 EDT: "kit can be tracked but leave screenshots local". Board 4's shots: `local/pins2/intake-shots/`. Every other image under `docs/` untracked where it sits; `.gitignore` refuses any image under `docs/` outside the kit |

## His words this stretch

- 23:16 EDT "publish. then THOROUGHLY make sure you're fully prepped and ready for session 4/5 …" → Version 45; the readiness sweep (HANDOFF § "Ready for Sessions 4 and 5")
- 23:31 EDT "kit can be tracked but leave screenshots local … finish the 'not checked' items … thats work you need to be doing as part of session 3, so why are you handing it off to session 4?"
- 23:41 EDT the build name as its own row: the cell in the build-name chip's design, BUILD NAME in the row-name column, "Not set" slightly dimmed → built; 23:44 EDT "publish the updated build name" → Version 46
- 23:47 EDT "text is clipping. where's the 'g'?" → fixed in the kit (not published) · "set a name one of the bal-27 build, as well as 1 marksman, 1 lmg, etc" → seven named (not published)
- 23:52 EDT "prep compact. after compact, publish, and continue the checks, sweeps, etc."

## The ten "not exercised" items — run through the real interaction (`docs/pins2/instruments/board4-unchecked.cjs`)

| Item | Result |
|---|---|
| Image well: aspect snap, clear | 3:1 → 16:9, 1:1 → 1:1, 2:3 → 3:4; "Remove the image" empties it ✓ |
| Bulk: copy tick, card jump | the ✓ holds ~1.03s then returns; a card click lights its block, centred (−1%) ✓ |
| Export's peek fade | fades in place (opacity 1 → 0 in ~100ms, a 9px settle), never from the list's top ✓ |
| Repairs tickets, no hover | computed style identical at rest and hovered ✓ |
| ASS motion | `b3-stink`, 2.7s, running, frames differ ✓ |
| Capable in DMZ | the DMZ tier row: No tier · Best · Top 3 · Top 5 · Capable ✓ |
| META + BEST + TOXIC wraps | STRIKER Build 1 (META · BEST SHOTGUN · TOXIC · S&D): one line in the wide peek; narrowed to 240px it wraps to 2 lines, no overflow ✓ |
| Unticked chips | rest 0.6, hover 1, disabled 0.18 ✓ |
| Discard confirm | "Discard BAL-27?" · Keep editing · Discard build (the `.b4-ask`) ✓ — the instrument's own check still looks inside the gate and reads false: **fix the instrument** (look for `.b4-ask, .cfm`) |
| Drawer wheel | Add 0/56, Add three 0/44, Bulk several 0/35, Edit 0/35, Post 0/58 (after the fix) · **Export picker 66 of 66 dead — NOT yet explained; investigate first** |

## Left open — Session 3's, not Session 4's (his 23:31 EDT words)

1. **Export picker wheel**: 66/66 dead points in `#c-export aside.drawer` — find whether the instrument or the board is wrong (a cover over the drawer? its columns not in `SEL`?), fix, re-measure.
2. **The accessibility findings HANDOFF still hands to "the port"**: Broadcast manifest rows focusable with no name (C7), History rows open by pointer only (C8), Compare's table rows and list headers with a pointer cursor and no action (C3) — fix in the kit, re-run `a11y.cjs`.
3. **HANDOFF rows** that still say "NOT exercised": rewrite each with the result above; the Compare heads row and a new "Compare name row" row for his 23:41 EDT ruling; the readiness section's "Not exercised" cell; the Dead space row with the fady fix.
4. The regenerate command, r22 and the spec regeneration were running at the compact (`/tmp/final-run.log`); re-run them after the kit changes land.

## Next

1. Publish Version 47 on his "after compact, publish": the page plus `b4/compare.css`, `data/armory.js`, `b3/fady.js` (and any file changed after), checked against the artifact's listing.
2. Items 1–4 above, measured; then the records (HANDOFF, intake log, DEVLOG, README, remember) and a commit.
3. His sign-off; Session 3's close (plan §13) on his word — the push now carries the kit and no screenshot.
