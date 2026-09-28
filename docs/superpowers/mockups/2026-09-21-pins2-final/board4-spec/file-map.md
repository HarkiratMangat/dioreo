---
kind: reference
status: live
---

# Board 4: Collective — every kit file, and what a port does with it

*Generated 2026-09-28T02:12:34.634Z by `maps.cjs` from `local/pins2-board-3/redo/` at kit commit `fc3c23b`. A file Board 3-E already labelled keeps Board 3-E's reviewed label (`../../2026-09-15-pins2-board-3/3e/file-map.md`, including its 2026-09-21 correction that `ui/app.js`, `ui/httpClient.js` and `ui/conform.js` are board chrome); a file new since then carries the rule that labelled it, marked "labelled by rule, not reviewed".*

| File | Label | Goes to | Note |
|---|---|---|---|
| `KIT-GIT.md` | **CHROME** | — | kit documentation |
| `app.css` | **PORTAL-COPY** | `portal/ui/app.css` (source) → `portal/public/app.css` (built) | `portal-diff.md` re-locates each changed line in the SOURCE by content |
| `b1.css` | **MIXED** | `portal/ui/app.css` | board 1's G8/G9/G10 rules that Board 4's build drawer, Compare (`.b1 .b4-cmp`) and the post drawer still wear; split by selector against `class-map.md` · labelled by rule, not reviewed |
| `b2.css` | **MIXED** | board 2's `pb-*` card and queue rules the delivery queue still wears | Board 2's port sheet already maps `pb-*` → `b*` for the queue card |
| `b3/armory-parts.js` | **DESIGN-CODE** | `portal/ui/armory.js` and `portal/ui/manifest.js` | Badges, `SelectAllBox`, the problem card (`pcPath`), the selection bar, the hint card |
| `b3/board.css` | **MIXED** | mostly `portal/ui/app.css`; `.b3dock*`, `.dk-*`, `.g-*`, `.lab-*`, `.pidx*` are chrome | Split by selector, not by file |
| `b3/bolt-raw.svg` | **DESIGN-CODE** | the META badge art |  |
| `b3/bolt.svg` | **DESIGN-CODE** | the META badge art |  |
| `b3/broadcast.js` | **DESIGN-CODE** | `portal/ui/broadcast.js` | The delivery-queue card and the never-ends warning on the card (p8 = A) |
| `b3/build-frame.py` | **CHROME** | — | a board instrument · labelled by rule, not reviewed |
| `b3/build-ribbon.py` | **CHROME** | — | a board instrument · labelled by rule, not reviewed |
| `b3/dock.js` | **CHROME** | — | The board dock |
| `b3/drawer.js` | **DESIGN-CODE** | the build drawer in `portal/ui/armory.js` | Board 1 G9's drawer as board 3 carries it; its structural spec is `../2026-09-14-pins2-board/handoff-g9-g8.md` |
| `b3/fady.js` | **DESIGN-CODE** | a shared scroll-edge utility in `portal/ui/` | The edge fade on every horizontally-scrolling run |
| `b3/history.js` | **DESIGN-CODE** | `portal/ui/history.js` | The time rail (p9 = B), the toolbar, the filter groups, the row glow. 19-line diff on `ui/history.js` alone; the rest lives here |
| `b3/palette.js` | **DESIGN-CODE** | `portal/ui/palette.js` | Command search, settled "as shown". ⚠️ The LOOK ships; the RANKING is its own session |
| `b3/ref-band.svg` | **CHROME** | — |  |
| `b3/ref-strip.svg` | **CHROME** | — |  |
| `b3/repairs.js` | **DESIGN-CODE** | Repairs, rendered from `portal/ui/armory.js` | Tickets by severity, the pass card, `agoShort`, the `.pb-pill` age chip |
| `b3/state.js` | **CHROME** | — | Fork switches and the `--h1-*` stamp. ⚠️ The stamp is the ONLY place `--h1-*` exist; see `token-map.md` |
| `b3/volt.js` | **DESIGN-CODE** | the META badge in `portal/ui/armory.js` | META's discharge, drawn from his own settings (round 4g) |
| `b4.css` | **DESIGN-CODE** | `portal/ui/app.css` | Board 4's own stylesheet (the post form's count row, the Before staging panel, drawer sizes) · labelled by rule, not reviewed |
| `b4/bulk.css` | **DESIGN-CODE** | the portal file named in HANDOFF.md for its gate | Board 4's own design code (the build form, Bulk, Compare and their styles) · labelled by rule, not reviewed |
| `b4/bulk.js` | **DESIGN-CODE** | the portal file named in HANDOFF.md for its gate | Board 4's own design code (the build form, Bulk, Compare and their styles) · labelled by rule, not reviewed |
| `b4/bulkformat.js` | **DESIGN-CODE** | the portal file named in HANDOFF.md for its gate | Board 4's own design code (the build form, Bulk, Compare and their styles) · labelled by rule, not reviewed |
| `b4/bulkformat.test.mjs` | **CHROME** | — | a test of the design code; ports with it as a test, never as UI · labelled by rule, not reviewed |
| `b4/classes.css` | **DESIGN-CODE** | the portal file named in HANDOFF.md for its gate | Board 4's own design code (the build form, Bulk, Compare and their styles) · labelled by rule, not reviewed |
| `b4/compare.css` | **DESIGN-CODE** | the portal file named in HANDOFF.md for its gate | Board 4's own design code (the build form, Bulk, Compare and their styles) · labelled by rule, not reviewed |
| `b4/compare.js` | **DESIGN-CODE** | the portal file named in HANDOFF.md for its gate | Board 4's own design code (the build form, Bulk, Compare and their styles) · labelled by rule, not reviewed |
| `b4/form.css` | **DESIGN-CODE** | the portal file named in HANDOFF.md for its gate | Board 4's own design code (the build form, Bulk, Compare and their styles) · labelled by rule, not reviewed |
| `b4/form.js` | **DESIGN-CODE** | the portal file named in HANDOFF.md for its gate | Board 4's own design code (the build form, Bulk, Compare and their styles) · labelled by rule, not reviewed |
| `badge-lab.html` | **CHROME** | — | An earlier board version, a lab or a comparison page |
| `badge-playground.html` | **CHROME** | — | An earlier board version, a lab or a comparison page |
| `badges-compare.html` | **CHROME** | — | An earlier board version, a lab or a comparison page |
| `board3.html` | **CHROME** | — | An earlier board version, a lab or a comparison page |
| `board3c.html` | **CHROME** | — | An earlier board version, a lab or a comparison page |
| `board3d.html` | **CHROME** | — | An earlier board version, a lab or a comparison page |
| `board3e.html` | **CHROME** | — | The page |
| `board4.html` | **CHROME** | — | a board page, a lab or a comparison page · labelled by rule, not reviewed |
| `class-sweep.cjs` | **CHROME** | — | a board instrument · labelled by rule, not reviewed |
| `cmp/badges.js` | **CHROME** | — | A badge comparison page from round 4a |
| `data/analytics.js` | **CHROME** | — | The dev-database fixture the board renders. Never ships; the portal reads the API |
| `data/analytics300.js` | **CHROME** | — | The dev-database fixture the board renders. Never ships; the portal reads the API |
| `data/armory.js` | **CHROME** | — | The dev-database fixture the board renders. Never ships; the portal reads the API |
| `data/broadcast.js` | **CHROME** | — | The dev-database fixture the board renders. Never ships; the portal reads the API |
| `data/changeset.js` | **CHROME** | — | The dev-database fixture the board renders. Never ships; the portal reads the API |
| `data/csrf.js` | **CHROME** | — | The dev-database fixture the board renders. Never ships; the portal reads the API |
| `data/previews.js` | **CHROME** | — | The dev-database fixture the board renders. Never ships; the portal reads the API |
| `data/review.js` | **CHROME** | — | The dev-database fixture the board renders. Never ships; the portal reads the API |
| `gates.css` | **MIXED** | the export landing, the H1 toolbar and the edge rule → `portal/ui/app.css`; the gate frame is chrome | Its own header says "the board's chrome AND this round's fixes" — tonight's export landing rules live here and ARE the design |
| `gates/armory.js` | **MIXED** | `ExportPicker` + the landing → `portal/ui/exportPanel.js`; `PaletteSpecimen`/`SlotSpecimen` and the gate sections are chrome | The export design is ~700 lines of BOARD-ONLY code with a 4-line diff against the portal. It is a code port, not a CSS port |
| `gates/broadcast.js` | **MIXED** | the queue gate wraps `b3/broadcast.js` → `portal/ui/broadcast.js` |  |
| `gates/history.js` | **CHROME** | — | The H1 gate wrapper; the design is `b3/history.js` |
| `gates/lib.js` | **MIXED** | `CharCount` → `portal/ui/broadcast.js` + `portal/ui/exportPanel.js`; `Stage`/`Gate` are chrome | README port list, v28: ONE character chip for the Broadcast card and the Export file |
| `gates/main.js` | **CHROME** | — | Mounts the six gates, the index and the coverage banner |
| `gates/picks.js` | **CHROME** | — | The Decide panel, the fork records and the H1 spacing lab. Its OUTPUT — the ruled answers and his spacing values — is the design; `handoff-3e.md` §1–§2 carry it |
| `gates/shared.js` | **CHROME** | — | Gate controls (`Seg`, `segOpts`) and the E4 type roles, which went to Session 4 |
| `gates4/main.js` | **CHROME** | — | Board 4's own page: the sections, their state switches and forks · labelled by rule, not reviewed |
| `gates4/surfaces.js` | **CHROME** | — | Board 4's own page: the sections, their state switches and forks · labelled by rule, not reviewed |
| `hdr.html` | **CHROME** | — | An earlier board version, a lab or a comparison page |
| `index.html` | **CHROME** | — | An earlier board version, a lab or a comparison page |
| `ref/board1-g8.html` | **CHROME** | — | An earlier board version, a lab or a comparison page |
| `ref/board1-g9.html` | **CHROME** | — | An earlier board version, a lab or a comparison page |
| `retitle-a.html` | **CHROME** | — | An earlier board version, a lab or a comparison page |
| `retitle-b.html` | **CHROME** | — | An earlier board version, a lab or a comparison page |
| `shot-el.cjs` | **CHROME** | — | a board instrument · labelled by rule, not reviewed |
| `shot-lab.cjs` | **CHROME** | — | a board instrument · labelled by rule, not reviewed |
| `shot-volt.cjs` | **CHROME** | — | a board instrument · labelled by rule, not reviewed |
| `sweep-screens.cjs` | **CHROME** | — | a board instrument · labelled by rule, not reviewed |
| `ui/access.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/access.logic.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/analytics.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/app.js` | **CHROME** | — never ported | Board plumbing only: it stubs out five realms with a "Not on this board" page. **Applying it would delete Season, Access, Analytics, Review and Home from the portal.** |
| `ui/armory.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file |
| `ui/armory.logic.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file |
| `ui/async.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/async.logic.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/avatarTint.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/board.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/board.logic.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/broadcast.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file |
| `ui/broadcast.logic.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/composeClient.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/composer.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/composer.logic.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/conform.js` | **CHROME** | — never ported | Kit-only instrument; the portal has no such file. |
| `ui/download.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/exportPanel.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file |
| `ui/exportPanel.logic.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/history.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file |
| `ui/home.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/httpClient.js` | **CHROME** | — never ported | A FAKE fetch client: every GET answers from `data/*.js` fixtures and every write stages into an in-page store. **Applying it would replace the portal's real network layer.** Its base is also pre-Preact (`009931ae`), so its diff is mostly portal drift. |
| `ui/icons.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file |
| `ui/manifest.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file |
| `ui/manifest.logic.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/oneway.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/oneway.logic.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/overlay.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file |
| `ui/overlay.logic.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/palette.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/palette.logic.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/review.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/review.logic.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/season.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/season.logic.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/shell.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file |
| `ui/timeline.logic.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/tips.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/tips.logic.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/track.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/track.logic.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/tray.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/useMeasured.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/v2Render.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `ui/v2Render.logic.js` | **PORTAL-COPY** | the same file in `portal/ui/` | Apply its hunks by `portal-diff.md` § *How to apply*: every `useB3()` branch collapses to the arm `switches.md` names, and no `../b3/` import is ever carried. Never copy the whole file · **identical to the portal now** — nothing to apply |
| `verify.cjs` | **CHROME** | — | a board instrument · labelled by rule, not reviewed |
