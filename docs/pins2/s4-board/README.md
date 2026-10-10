---
kind: reference
status: live
---

# The Board 4 kit — the design code

*Moved here 2026-09-29 00:02 EDT from the gitignored `local/pins2-board-3/redo/`, at Harkirat's call of 2026-09-28 23:27 EDT (*"why not just move the board to the new collective folder?"*). Everything Sessions 4 and 5 read is in [`docs/pins2/`](../README.md); this folder is the board itself.*

## What it is

The portal's own code (Preact and htm, ES modules) running on fixtures from the dev database, with the boards' design work laid on top. **Board 4: Collective** is `board4.html`: every finished surface of boards 1–3, no switches. It is the design: Harkirat signed it off at Version 81 on 2026-09-30 19:31 EDT ("approved, run the held checks. board is done.") ([`../final/FINAL.md`](../final/FINAL.md)).

## Serve and open it

Serve the repo root with `.claude/launch.json` → `repo-static` (`preview_start`, port 8900). The kit is ES modules, so `file://` does not work.

| Page | Board | Publish |
|---|---|---|
| `http://127.0.0.1:8900/docs/pins2/kit/board4.html` | Board 4: Collective, artifact `FCAFvDXrKQN28SotQLJhTh` | only on his word, never mid-work |
| `board3e.html`, `index.html`, `board3.html`, `board3c.html`, `board3d.html` | Boards 3-E, 3-A, 3-B, 3-C, 3-D — closed | **never** — each overwrites a closed artifact and its comment threads |
| `badge-lab.html`, `badge-playground.html`, `badges-compare.html`, `hdr.html`, `retitle-a.html`, `retitle-b.html` | badge and header labs | no |

## Layout

| Folder | Holds |
|---|---|
| `ui/` | the portal's `portal/ui/` files, copied and, where the board needed it, modified. [`../final/board4-spec/portal-diff.md`](../final/board4-spec/portal-diff.md) is the diff; [`file-map.md`](../final/board4-spec/file-map.md) labels every kit file PORTAL-COPY, DESIGN-CODE, MIXED or CHROME |
| `b3/` | board 3's design code: the pop-up family, badges, the selection bar, Export, History's rail, the command search |
| `b4/`, `b4.css` | Board 4's: the build form, Bulk and Edit, Compare, the form system and its classes |
| `gates/`, `gates4/` | the surfaces (`gates4/main.js` and `surfaces.js` compose Board 4), each mounted as the portal mounts it |
| `data/` | fixtures exported from the dev database: `analytics.js`, `analytics300.js`, `armory.js`, `broadcast.js`, `changeset.js`, `csrf.js`, `previews.js`, `review.js`, and `thumbs.js` (the seven named builds' pictures, board-only). They carry Harkirat's own Discord id (public in this repo's docs) and the bot's custom-emoji ids |
| `vendor/` | Preact and htm, vendored: `htm-preact.mjs`, `htm.mjs`, `preact-hooks.mjs`, `preact.mjs` |
| `cmp/`, `ref/` | comparison and reference inputs: `badges.js` · `board1-g8.html`, `board1-g9.html` |
| `app.css`, `b1.css`, `b2.css`, `gates.css`, `b3/board.css` | the stylesheets: the portal's, board 1's (scoped `.b1`), board 2's, the gate chrome and the proposals |
| `*.cjs` | Board 3-era measuring scripts (`class-sweep`, `sweep-screens`, `shot-*`, `verify`); Board 4's instruments are in [`../instruments/`](../instruments/README.md) |

## Publish (Board 4 only)

The Artifact tool's root is this folder: publish `board4.html` plus every file that changed since the last publish (files left out are kept). Publishing another page overwrites another board. Verify by the artifact's file listing, not by opening the live page.

## History, and one thing he said

The kit's git history up to its move is local, in `local/pins2-board-3/.git` (`git -C local/pins2-board-3 log --stat`); nothing before the move is imported into the repo's history.

✅ **Decided 2026-09-30 21:16 EDT, his option (c): this folder is on his Mac only — gitignored by the dioreo repo, with its own local git repo (this one, holding the kit's commits since 2026-09-29). The paragraph below is the history.**

🔴 **On 2026-09-20 21:33 EDT he said the kit was not to go on the online GitHub** (*"i dont want it in the online github for the dioreo repo"*). Moving it into the tracked `docs/pins2/` folder was his call of 2026-09-28; publishing it is not decided. **A push, or a merge into `v3-pre-release`, that carries this folder puts it on GitHub** — the approval sentence names `docs/pins2/kit/`.

## Screenshots

`shots/` is gitignored scratch. The old kit's 277 MB stayed in `local/pins2-board-3/redo/shots/`; anything a script writes to `shots/` here is ignored too.
