# Design: Modularizing CLAUDE.md into path-scoped rules

**Date:** 2026-07-22 13:27 EDT · **Author:** Claude (Opus 4.8, extra-high) · **Status:** approved, executing

## Objective
`CLAUDE.md` had grown to **3,272 lines / ~111k startup tokens**, loaded in full on every session. Split the domain detail into **path-scoped `.claude/rules/*.md`** (load only when a matching file is read) and **nav-referenced `docs/` reference files** (read on demand), leaving a slim root `CLAUDE.md` of invariants + a navigation map. Target startup: ~15–22k always-on. **Zero knowledge loss** — this is a move + index + inline cleanup, never a summarize-away.

## Mechanism (verified against official docs, 2026-07-22)
- `.claude/rules/*.md` is a **real, native Claude Code feature**. Files with `paths:` YAML frontmatter load into context **only when Claude reads a file matching the glob**; rules with no `paths:` load every session (same as CLAUDE.md, so no savings). Source: code.claude.com/docs/en/memory.
- `@import` loads **eagerly at launch** → does NOT save startup tokens. Not used here.
- **Compaction:** only project-root `CLAUDE.md` is re-injected after `/compact`. Path-scoped rules reload on the next matching file read. → **all hard invariants live physically in root.**
- **Version:** Harkirat is on **2.1.207** (updated this session from 2.1.206, which clears the pre-2.1.207 "one invalid glob breaks the Read tool" hazard). Globs are still kept conservative/valid.

## Three governing design rules
1. **Invariants never leave root** (compaction safety) — canonical memory path, `.env` gitignore, Cloudinary secret-logging ban, user-installed-only architecture, database schema gotcha, deploy summary, platform cheat-sheet.
2. **The root nav map is a permanent redirect index** — every moved topic gets a keyworded entry, so the ~40 historical `"see CLAUDE.md's X section"` references in changelogs/DEVLOG/plans stay resolvable without rewriting history. Only CLAUDE.md's *own* internal `"see X above/below"` cross-refs (which genuinely break across files) are re-pointed.
3. **Separate live config from its story** — live values (accent hexes, etc.) → the path-scoped rule for that code; the narrative of choosing them → `docs/reference/design-history.md`.

## Section → destination ledger (all 39 top-level sections; source line ranges in the pre-split file)
| # | Section (source lines) | Destination |
|---|---|---|
| 1 | What this is + canonical-memory warning (3–33) | **root** (invariants) |
| 2 | Table of contents (34–50) | **root** → becomes the nav map |
| 3 | Local-only files, `local/` vs `docs/` (51–76) | **root** (condensed; `.env` invariant kept) |
| 4 | Stack (77–147) | root (trim to live stack) + historical Render/Railway → `design-history.md` |
| 5 | Deployment & Ops (GCP) (148–279) | `docs/reference/deployment-and-ops.md` (+ root 2-line summary) |
| 6 | Version tagging (280–306) | `docs/reference/deployment-and-ops.md` |
| 7 | Maintaining context comments (307–317) | **root** (kept in full, short) |
| 8 | Command architecture (318–451) | general → `rules/commands-overview.md`; `/manage` detail → `rules/manage-panel.md`; router bits → `rules/interaction-router.md` |
| 9 | `/manage` per-page accent colors (452–472) | `rules/manage-panel.md` |
| 10 | Panel interaction locks (473–574) | `/manage` guard → `manage-panel.md`; `/settings` lock+expiry → `settings-and-expiry.md` |
| 11 | Components V2 lessons (575–602) | `rules/rendering-and-ui.md` (+ condensed cheat-sheet in root) |
| 12 | Crash resilience (603–663) | `rules/interaction-router.md` (+ 1-line root pointer) |
| 13 | User-install / DM per-command (664–681) | `rules/commands-overview.md` |
| 14 | `/timestamp` dropdown + view (682–720) | `rules/commands-overview.md` |
| 15 | Synthetic interaction pattern (721–741) | `rules/interaction-router.md` (+ cheat-sheet line in root) |
| 16 | Database schema gotcha (742–749) | **root** (short/universal) + `rules/models.md` |
| 17 | Data models (750–776) | `rules/models.md` |
| 18 | Design decision log (777–980) | cross-cutting rules (UTC dates, chrono-noon → relevant rules); rest → `design-history.md`; live color/nav map → `rendering-and-ui.md` |
| 19 | Accent color system (981–1176) | `rules/accent-and-colors.md` |
| 20 | View Colors panel (1177–1537) | `rules/accent-and-colors.md` |
| 21 | Light anti-spam cooldown (1538–1552) | `rules/interaction-router.md` |
| 22 | Shared UI builders (1553–1637) | `rules/rendering-and-ui.md` |
| 23 | Loadout commands build/private (1638–1645) | `rules/commands-overview.md` |
| 24 | MP loadout accent colors (1646–1680) | `rules/loadouts.md` |
| 25 | MP loadout system (1681–1917) | `rules/loadouts.md` |
| 26 | Autocomplete search (1918–1979) | `rules/loadouts.md` (scoped to `utils/search.js` too) |
| 27 | User-installed-only architecture (1980–1995) | **root** (load-bearing invariant) |
| 28 | "Show Everyone" (1996–2039) | `rules/rendering-and-ui.md` |
| 29 | Draw thumbnail Cloudinary cache (2040–2104) | `rules/loadout-images-and-metadata.md` |
| 30 | Patch notes Cloudinary caching (2105–2162) | `rules/loadout-images-and-metadata.md` |
| 31 | Batch refinement pass 07-12 (2163–2278) | `docs/reference/design-history.md` (live facts extracted first) |
| 32 | Slash-command wording overpass (2279–2308) | `docs/reference/design-history.md` |
| 33 | Color repalette (2309–2376) | live hexes → `rendering-and-ui.md`/`accent-and-colors.md`; narrative → `design-history.md` |
| 34 | Post-deploy fixes 07-12 (2377–2490) | `docs/reference/design-history.md` (live facts extracted first) |
| 35 | Browse other builds dropdown (2491–2535) | `rules/loadouts.md` |
| 36 | `/draw prices` layout correction (2536–2552) | `rules/draw-prices.md` |
| 37 | Advanced Double Legendary page (2553–2603) | `rules/draw-prices.md` |
| 38 | Known open issues (2604–2668) | `docs/reference/known-issues.md` (+ root nav pointer) |
| 39 | Next planned work / roadmap (2669–3272) | roadmap (v2–v5) → `docs/ROADMAP.md`; implemented autobuild → `rules/autobuild.md`; implemented Cloudinary metadata → `rules/loadout-images-and-metadata.md` |

### `.claude/rules/` files & globs
- `interaction-router.md` → `paths: [index.js]`
- `commands-overview.md` → `paths: [commands/**]`
- `manage-panel.md` → `paths: [commands/manage.js]`
- `settings-and-expiry.md` → `paths: [commands/settings.js, utils/passiveExpiry.js]`
- `rendering-and-ui.md` → `paths: [utils/sendV2Payload.js, utils/titleBlock.js, utils/paginationRow.js, utils/globalNav.js, utils/ephemeral.js, utils/emojiMap.js, utils/shareButton.js]`
- `accent-and-colors.md` → `paths: [utils/accentColor.js, utils/colorExtract.js, utils/colorPalette.js, utils/colorPaletteView.js, utils/colorSwatchImage.js, utils/colorGradientImage.js, utils/resizedImage.js, utils/stillFrame.js, commands/colors.js]`
- `loadouts.md` → `paths: [utils/loadoutRender.js, utils/search.js, commands/dmz.js, models/Loadout.js]`
- `loadout-images-and-metadata.md` → `paths: [utils/cloudinaryCache.js, utils/patchNotesCache.js, utils/loadoutImageCache.js]`
- `autobuild.md` → `paths: [commands/autobuild.js, utils/autobuildPipeline.js, utils/visionExtract.js]`
- `draw-prices.md` → `paths: [commands/drawprices.js]`
- `models.md` → `paths: [models/**]`
- `scripts-and-migrations.md` → `paths: [scripts/**]`

### `docs/` reference files
- `docs/reference/deployment-and-ops.md`, `docs/ROADMAP.md`, `docs/reference/design-history.md`, `docs/reference/known-issues.md`

## Cross-reference rewiring (the "nothing unlinked" guarantee)
- `docs/README.md` — describe new shape; "source of truth for roadmap" → `docs/ROADMAP.md`.
- `docs/SESSION-START.md` — add a "where detail lives now" note; fix Version-tagging/planned-work pointers.
- **~20 memory pointers** to CLAUDE.md sections → re-point to their new homes (list built from grep).
- Historical changelog/DEVLOG/plan refs → left as-is, resolved via the root nav map.
- **Verify:** `git status`, grep the split files for dangling "see the X section above/below", and a line-accounting pass; `/context` after (Harkirat) to confirm root + on-demand loading.

## Deferred (evaluated, not shrugged): splitting `index.js`
`index.js` is 3,313 lines, ~2,680 of which are a single `client.on('interactionCreate')` handler. It is a strong candidate to modularize into `handlers/*.js` (per-subsystem routing modules), but this is a **runtime code refactor** — it needs boot-testing, a real deploy, and live verification, a completely different risk class from this docs-only reorg. Bundling it here would be the "too much at once" failure. **Filed as its own session** with a concrete plan in `docs/ROADMAP.md`. Not done here on purpose.
