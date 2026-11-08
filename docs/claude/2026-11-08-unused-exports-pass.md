---
kind: record
status: frozen
---

# The unused-exports pass — 2026-11-08 01:29 EST

*Acts on `docs/claude/2026-10-22-unused-exports-scan.md` (89 candidates), at Harkirat's pick D in the small-fixes batch (2026-11-08 00:59 EST). Frozen: what the tree held on this date.*

## Method

Each candidate was re-checked against today's tree, not the 17-day-old scan: `git grep -w` over every tracked `.js`/`.mjs`/`.cjs`/`.sh`/`.json` outside its own file, then the uses inside its own file counted line by line (comment-only lines and the `module.exports` block left out). A name used inside its file lost only its place in `module.exports`; nothing that still runs was deleted. Every module was then required and checked that the name is gone, and `npm test` ran in full.

## Result

| Outcome | Count | Which |
|---|---:|---|
| Dropped from `module.exports`, code kept (still used in its own file) | 63 | the rows of the scan not listed below |
| Kept: another file now names it | 12 | `FILTER_OPTIONS`, `entryState`, `MODAL_ID`, `resolveCommandToCategory`, `resolveManagePanelMatches`, `flagsOf`, `writeLoadoutDoc`, `CATEGORY_KEYS`, `drawEndCustomId`, `UNKNOWN_TYPE`, `MAX_IMAGES`, `commandLabel` |
| Kept: the Cloudinary SDK passthrough in `utils/cloudinaryClient.js`, never in an export list | 7 | `AKAMAI_SHARED_CDN`, `CF_SHARED_CDN`, `PreloadedFile`, `SHARED_CDN`, `cloudinary_js_config`, `provisioning`, `search_folders` |
| Kept: `utils/emojiMap.js` keys, looked up by string | 4 | `blueDash`, `dioreoKawaii`, `season6`, `season8` |
| Kept: never called, but they are Your Stats counters, not dead code | 2 | `noteBuildOpened`, `noteShare` (filed in `docs/db-deferred-list.md`: builds opened and panels shared are never counted) |
| Already gone before this pass | 1 | `noteFirstCommandSafely` |

63 + 12 + 7 + 4 + 2 + 1 = 89.

## What to know next time

- A same-named symbol in another file counts as a reference to `git grep -w`, so the 12 kept for "another file names it" may include a few false keeps. That errs safe.
- `COMMAND_NAME` in `commands/addToPatchNotes.js` is used by `.setName()` inside the module's own export object; a line scan that skips the export block reads it as unused. Re-checked by requiring the module.
