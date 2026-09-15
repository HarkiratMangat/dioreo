---
kind: reference
status: live
---
# Board 3, version 2 — built on the portal

*Written 2026-09-15 17:49 EDT.* Published as version 2 of https://claude.ai/artifact/2yJmND6URRPwLbNJbzySFc. Harkirat on version 1, 2026-09-15 16:43 EDT: *"honestly, i don't even want to look at the rest of it yet until you go and create v2 with actually interactive elements… if i wanted snapshots, i couldnt just asked google gemini to create me an image."* In chat he asked for the *"exact proposed designs"*, *"fully built instead of partial mockup snapshots"*, and for board 1's G9 New build drawer: *"both versions need proper building to match the design board."*

## What it is

The portal's own Armory, Broadcast and History modules, copied from `portal/ui/`, with every board-3 proposal mounted into the real page and switched from a dock. A stub `ui/httpClient.js` answers each route from dev API answers captured on 2026-09-15 and keeps an in-page changeset, so staging works and nothing reaches a database. Season, Access, Analytics, Review and Home open a page saying they are not on this board.

## Files here

| File | What it is |
|---|---|
| `b3/state.js` | The variant store: `useB3`, `setB3`, `hooks`, the `html[data-b3-*]` stamps, kept per viewer |
| `b3/dock.js` | The dock: sections P1–P9, G9 and E1–E6 with their variants, notes and Try buttons |
| `b3/armory-parts.js` | P1 badges, P3 problem chip and popover, P4 select all, P5 selection dock, the hint |
| `b3/drawer.js` | G9: New build (Add build and Bulk create) and bulk edit, as board 1 drew it |
| `b3/repairs.js` | P6: the Repairs worklist and the block of builds that pass |
| `b3/palette.js` | P7: the command bar |
| `b3/broadcast.js` | P8: the end-date picker, the never-ends chip and the Changes-ahead item |
| `b3/history.js` | P9: the timeline and its filters |
| `b3/board.css` | Every proposal's styles, over the portal's `app.css` |
| `ui.patch` | The edits to nine `portal/ui` modules that mount the proposals, `diff -u` against this branch |
| `index.html` | The page: fonts, `app.css`, `board.css`, the logic scripts, `ui/app.js`, the dock |
| `capture.cjs` | Captures the dev API answers into `data/`, run with `node --env-file=.env.dev` |
| `shoot.cjs` | Serves the kit and screenshots any hash with puppeteer |

## Not here, on purpose

The captured data (dev builds and history carrying Discord ids) and the copied portal modules stay in the gitignored kit, `local/pins2-board-3/v2/`. To rebuild the kit: copy `portal/public/ui/`, `portal/public/vendor/` and `portal/public/app.css` beside these files, apply `ui.patch` inside `ui/`, run `capture.cjs`, and write each `data/*.json` as `data/*.js` holding `export default <json>;`.

## For Session 5

Session 5 ports from `b3/` and `ui.patch`: the components are the build source, and every value is read off the rendered board, never recalled. Version 2 cannot show Cloudinary images inside the artifact sandbox, or a write reaching the server.
