---
kind: spec
status: frozen
---

# Portal mockup-vs-live gap audit

> Written for a cold reader with zero context on this conversation — most likely an Opus 5 session picking up `docs/superpowers/plans/2026-08-22-portal-design-alignment.md`'s Phase 3. Every claim below states its own evidence and confidence. Where evidence is thin, that is said explicitly rather than smoothed over — a wrong "confirmed" here costs a future session real implementation time re-deriving what should have been checked once.

## 0. Why this document exists, and why it went through two drafts

Harkirat asked for a mobile-friendliness pass on the live portal. The first critique (folded into this investigation, not preserved as a separate artifact) framed the problem as CSS: missing color tokens, zero responsive breakpoints. Both of those are real and are still the two most severe findings below. But when asked directly — **"does the real portal even remotely resemble the design?"** — actually rendering all six approved mockups next to Harkirat's real device screenshots showed something the CSS framing missed entirely: **whole designed surfaces were simplified away during implementation**, not just left unstyled. Access shipped as three plain text inputs where the mockup specs a full permission grid. The login page shipped with no Discord branding at all. Every realm's explanatory copy — the writing that tells a user what a view is for — is absent from the build.

The lesson for whoever reads this next: **diffing CSS variables is necessary but not sufficient.** Render the mockup and the real page side by side before concluding a gap is "just styling."

## 1. Methodology and evidence grades

Every finding below is tagged with how it was established:

- **[screenshot]** — a real mobile screenshot from Harkirat's phone, taken through a live Cloudflare quick-tunnel session against the `Dioreo (Dev)` Discord app and local dev Mongo (2026-08-22 09:49 EDT, session owner `1139845545754632283`). Ground truth for what a real user sees.
- **[mockup]** — one of the six approved mockups at `docs/superpowers/mockups/2026-08-20-portal/`, rendered directly in a browser (not read as markup) during this audit.
- **[code]** — read directly from the `v3-pre-release` tree, with file:line citations. Where a finding rests on CSS custom-property fallback semantics rather than a screenshot, that's stated — it is provably correct (an undefined `var()` reference is invalid at computed-value time and the whole containing declaration falls through to its own fallback) but wasn't independently screenshotted for every instance.
- **[inferred]** — a reasonable conclusion from a pattern seen elsewhere, explicitly flagged as not directly verified. Treat these as hypotheses to confirm in Phase 1, not settled facts.
- **[unverified — no evidence either direction]** — realms or views nobody has looked at yet, real or mockup. Listed in §7 so Phase 1 knows exactly what to go get before Phase 3 starts.

## 2. The three critical, repo-wide findings

### 2.1 Zero responsive CSS anywhere in the shipped stylesheets — [code]

`portal/ui/*.css` is 213 lines across 7 files (`board.css`, `manifest.css`, `preview.css`, `shell.css`, `tokens.css`, `track.css`, `tray.css`). `rg -c "@media" portal/ui/*.css` returns zero matches in every file. The six approved mockups carry **8 `@media` rules between them**: grid-to-single-column collapses at `max-width:1180px`/`1200px`/`1240px` (`02-skins-and-structures.html:13`, `05-door-broadcast-ops.html:35`, `06-access-and-analytics.html:120`), plus `prefers-reduced-motion` support in five of the six files. None of this reached the build.

**Important nuance for Phase 3:** the mockups' own breakpoints bottom out around 1180–1240px — that is a *tablet* collapse, not a phone-optimized layout. Porting the mockups' existing media queries verbatim will not by itself produce something usable at 375px width. Phase 3 needs new, below-640px-specific design work that the mockups never speced, not just a port of what exists.

**Consequence, confirmed [screenshot]:** the `.top` header bar (`shell.css:2-16`) lays out the wordmark, five realm links, the Track/Board tabs, and the raw owner Discord ID in one non-wrapping flex row. Every one of Harkirat's four screenshots (Season, Access, Broadcast, Analytics) shows the owner ID (`1139845545754632283 (owner)`) clipped or overflowing the right edge. `.panel{margin:16px 24px}` (`shell.css:17`) costs 48px of a 375px screen to side margins before any content starts. `.cols{grid-template-columns:repeat(4,1fr)}` (`board.css:2`) has no override, so Board's card grid would render four ~80px-wide columns on a phone (Board itself is **[unverified]** — see §7 — but this specific CSS rule is fact).

### 2.2 Four of five Season category-accent tokens were never added to `tokens.css` — [code], reproduced live

`portal/ui/track.js:8` declares `TOPIC_VAR = { draw: '--draw', returning: '--ret', event: '--ev', playlist: '--play', patchnote: '--patch' }`. `track.js:16` sets `--topic-accent:var(${TOPIC_VAR[laneFor(item)] || '--ink2'})` per timeline bar. `portal/ui/manifest.js:61` does the same via `row.topicVar` for Season's row-dots — and `season.js`'s `toManifestRows()`/track-item builders are the source of that `topicVar`, so both consumers hit the identical gap.

`grep -- "--draw:|--ret:|--ev:|--play:" portal/ui/*.css` returns **nothing**. Only `--patch` (`#F2C230`) exists in `tokens.css`'s one `:root` block (`tokens.css:11-39`). The other four are referenced and never defined.

This is not cosmetic-severity: `background:var(--topic-accent, var(--raised))` (`tokens.css:60`, `track.css:15`) means an undefined `--topic-accent` reference is invalid at computed-value time, so the whole declaration falls through to its *own* fallback — `--raised`, a flat dark grey (`#1F272E`). Every draw/returning/event/playlist bar and dot renders in that one neutral color instead of the mockup's four-color system. Confirmed **[screenshot]**: Harkirat's Track screenshot shows lanes that are visually almost empty — exactly the predicted symptom, not a coincidence.

The mockup's intended values, read directly from `03-three-surfaces.html:10-11`: `--draw:#FF3430; --ret:#337BA6; --ev:#1F8A5E; --play:#8A6BD1;` (`--patch:#F2C230` already matches). These four hex values are the entire fix for the color half of this finding.

### 2.3 The login button — the one element every user must read — fails WCAG contrast by a wide margin

`shell.js:44`: `<a class="accent-fill" href="/auth/login">Sign in with Discord</a>`. `tokens.css:74-77`: `.accent-fill{background:var(--topic-accent,var(--raised));color:var(--on-accent)}`, where `--on-accent:#000000` (`tokens.css:38`). No `--topic-accent` is set on this element anywhere in `shell.js`, so background falls back to `--raised` (`#1F272E`) while text stays pure black. Contrast is approximately 1.3:1 against a 4.5:1 AA floor. Confirmed **[screenshot]**: the button text is genuinely, visibly unreadable in Harkirat's real mobile screenshot of the login page.

This slipped past the portal build's own `portalContrastAudit()` (`scripts/buildPortal.js`, documented in `.claude/rules/scripts-and-migrations.md`) because that audit checks `:root` token pairs directly — it does not simulate a fallback chain that only breaks when a referencing property's variable is left unset. **Filed as a gap in that audit tool itself, not just this one button** — see §8.

## 3. Whole surfaces that were simplified away, not left unstyled

This is the section that corrects the first, CSS-only framing of this audit. Each of these is a **feature gap**, most with a precise, evidence-backed root cause — not "needs polish."

### 3.1 The door (login page) — no Discord branding at all

**[mockup]** `05-door-broadcast-ops.html`, "The door" section: `DIOREO/PORTAL` wordmark, `bot management` subtitle, a masthead paragraph explaining why this page must leak nothing to a stranger, then a button with the real Discord logo mark and Discord's brand color `#5865F2`, white text, "Continue with Discord."

**[screenshot] + [code]** `shell.js:40-45`: title, one line of plain copy (`Sign in with Discord to continue.`), and the broken `.accent-fill` button from §2.3 — no SVG icon, no brand color anywhere in `shell.js` or `tokens.css` (`rg "#5865F2|5865F2" portal/` returns nothing).

**Root cause:** not a missing token, a missing decision — nobody carried the Discord brand color or icon over from the mockup into the design token set or the markup. Trivial to fix once decided.

### 3.2 Access — the entire permission grid does not exist; the data layer for it already does

**[mockup]** `06-access-and-analytics.html`: a matrix — every admin as a row, every command and `/manage` page as a column, green checkmarks per granted scope — plus a header stat line ("owner + 3 granted · 2 signed in now") and a "By admin / By scope" tab switch.

**[screenshot]** the real Access page has three plain text inputs to hand-type a grant (`Discord ID to grant` / `permissions (e.g. manage.c...` truncated / `Type the Discord ID to confirm`), and "By scope" renders as one static sentence ("No scope is held by exactly one non-owner admin") with no grid under it.

**[code] — important, precise finding for Phase 2 sizing:** the *data* this grid needs already exists and is already built. `utils/adminAccess.js:30-36`'s `getAdminPermissionsMap()` returns a cached `Map<discordId, permissions[]>` straight from `AdminUser.find({}).select('discordId permissions')`. `utils/manageActions.js` already holds the full command/page registry (`DRAWS_ACTIONS`, `CALENDAR_ACTIONS`, `PATCHNOTES_ACTIONS`, `SEASONDRAFT_ACTIONS`, `ANNOUNCEMENT_ACTIONS`, `ACTIONS_BY_PAGE` — `utils/manageActions.js:78-268`) — this is the exact column set the mockup's matrix needs. **`portal/api/access.js` never calls `getAdminPermissionsMap()` at all** (`rg "getAdminPermissionsMap" portal/api/access.js` — zero matches). The gap is that nothing exposes this existing data through the portal's API and renders it as a grid — it is not a missing data model. Phase 2's task here is scoped, not open-ended: add a route, shape the response, build the grid component.

### 3.3 Every realm's masthead copy is absent

**[mockup]** every one of the six mockups opens each view with a heading, a short all-caps "answers" tag (e.g. Track: `ANSWERS: WHEN, AND DOES IT FIT`), and a full explanatory paragraph with inline bold emphasis on the key claims — telling the reader what the view is *for* before they use it. `Access`'s masthead literally explains why the page is split into two visualizations. `The door`'s masthead explains the page's own security posture.

**[code]** none of `access.js`, `armory.js`, `board.js`, `broadcast.js`, `season.js`, `shell.js` render this pattern anywhere — confirmed by reading each file's render function; the closest thing shipped is bare section headers (`SEASON TRACK`, `BY ADMIN`, `NOW SHOWING`) with zero explanatory body copy.

**Root cause:** this was never a CSS omission — the copy itself was never written into the component tree. This is real writing work (`design:ux-copy`'s territory), not styling, and it's the single most labor-intensive item in this list because it has to be authored per realm, not just wired.

### 3.4 Season's Manifest — the reusable engine is real; one realm's config is wrong

This finding **replaces and corrects** an earlier, less precise version of itself found earlier in this same investigation. The first read of the evidence assumed the whole filter/sort/pill system needed to be built. It does not. Read the actual component before concluding that.

**[code] — the shared `Manifest` component already has everything the mockup shows:** `portal/ui/manifest.logic.js` is a complete, pure, realm-agnostic engine — `filterRows`/`sortRows`/`matchesSearch`/`matchesFilters`/`toggleSelection` — reused unchanged by every realm per spec §8.2. `portal/ui/manifest.js` actually calls it (`sortRows(filterRows(rows, {query, searchableFields, filters}), sort)`, line 18-19), renders a real search input, sortable `<th>` headers, and **already has state-pill markup** (`manifest.js:63`: `class="stt " + (stateOf(row)==='live' ? 'live' : ...)`), styled by `manifest.css:22-25`'s `.stt.live`/`.stt.stag` rules. `.chip`/`.chip[aria-pressed=true]` styling (`manifest.css:5-7`) exists for filter-chip UI too.

**The actual, narrow defects, both in `season.js`, not in the shared component:**

1. **`SEASON_COLUMNS`** (`season.js:16-19`) declares a `lane` column labeled `'Type'` with no label-formatting. `Manifest` prints `row.lane`'s raw value verbatim — and `toManifestRows()` (`season.js:29-44`) sets `row.lane` to the internal key (`'newDraws'`, `'returningDraws'`, `'calendar'`), never the humanized string. The humanized labels **already exist** in the same file, just for a different control: `season.js:23-26` declares `{value:'draw', label:'New draw'}, {value:'returning', label:'Returning draw'}, {value:'event', label:'Event'}, {value:'playlist', label:'Playlist'}` — a `LANE_LABELS`-shaped map just needs to be built from this existing data and applied to the column render.
2. **`toManifestRows()` hardcodes `state: 'live'` for every single row** (`season.js:37`), always, regardless of the item's real staged/draft/conflict status. The State column and its color pill therefore always says LIVE, never reflecting reality. **[inferred, needs a 10-minute confirm]:** this may be partly masked in Harkirat's screenshot by §2.1's overflow problem pushing the State column off the visible viewport rather than the pill visibly showing the wrong value — worth checking both are true, not just the more visible one.

Phase 2's task list should read "fix these two specific defects in `season.js`," not "build a filter/sort/state-pill system" — the latter already exists and the former is a much smaller job.

### 3.5 Broadcast — state-pill classes and the data-quality callout pattern don't exist in code

**[mockup]** `05-door-broadcast-ops.html`'s Broadcast section: a populated announcement table with colored state pills (`LIVE` green, `SCHEDULED` purple dashed, `EXPIRED` muted grey), and a proactive "Heads up" callout that flags a real data problem — an announcement live 19 days with no expiry.

**[screenshot]** currently empty in dev ("Nothing is currently showing" / an empty Airtime table) — which is a fair, legitimate reason the real page currently looks bare. But **[code]**: `portal/ui/broadcast.js` (grepped in full for state-pill or callout patterns) contains no `LIVE`/`SCHEDULED`/`EXPIRED` class logic and no callout component — so the moment a real announcement exists, the page still won't look like the mockup.

**Cross-cutting blocker for Phase 2, confirmed against memory (`project_web_admin_portal.md`):** `models/Announcement.js` has `expiresAt` but **no `startsAt` field** — this was already flagged during the original portal design ("Scheduling does not exist today") and filed in `docs/db-deferred-list.md`. The mockup's `SCHEDULED` pill state cannot be computed without this schema field existing first. **This is a hard Phase-2-before-Phase-3 dependency: adding `Announcement.startsAt` must happen before Broadcast's state-pill work can be finished, not after.** `startsAt` is not a per-user field, so `docs-audit`'s `privacy-inventory` check does not apply to this change — confirmed by reading that check's scope (it only tracks `discordId`/`userId`-carrying fields).

### 3.6 Armory, Board, and Analytics's native design — unverified, flagged not assumed

See §7. All three have real, richly designed mockups; none has a confirmed real-device screenshot in this investigation. Given every realm checked so far shipped noticeably thinner than its mockup, it would be reasonable to *expect* the same pattern here — but that is a prediction, not a finding, and this document is explicit about the difference.

## 4. Design-system audit (structured per `design:design-system`'s template)

### Token coverage

| Category | Defined in `tokens.css` | Gap |
|---|---|---|
| Surface colors | `--desk --paper --raised --sunk --rule` | none found |
| Ink/text colors | `--ink --ink2 --ink3` | matches mockups (with a deliberate, correct WCAG-driven adjustment to `--ink3`, see `tokens.css:22-26`'s own comment) |
| Semantic/status colors | `--patch --warn --ok` | none found |
| Season topic-accent colors | `--patch` only | **missing `--draw --ret --ev --play`** — §2.2 |
| Layout dimension tokens | none | mockups define `--rail:76px --hdr:52px` (`01-season-spine.html:15`); shell dimensions are hardcoded per-property in `shell.css` instead of tokenized |
| Broadcast/Access-only accents | none | mockups define `--rule2 --ink4 --del --dsc` (Discord blurple) and more; **lower urgency** — these realms mostly lean on tokens that already exist, so nothing visibly breaks today the way Season does |
| Armory weapon-category hues | none in `tokens.css` | `armory.js:36` reads `list[0]?.accent` from **data**, not a CSS token — a different, likely-correct mechanism reusing the bot's existing per-category accent system. Not the same defect class as §2.2; needs its own verification once a real Armory screenshot exists |

### Hardcoded-value scan

`rg "#[0-9A-Fa-f]{6}\b" portal/ui/*.css portal/ui/*.js` (excluding `tokens.css` itself) returns **zero hits**. This is a genuinely strong positive: the palette is centrally sourced everywhere. The defect class here is *missing* tokens, never *scattered* ones — a materially cheaper problem to fix than an inconsistent system would be.

### Component completeness (states)

| Component | Default | Hover | Focus-visible | Disabled | Loading | Notes |
|---|---|---|---|---|---|---|
| `:focus-visible` | — | — | ✅ (`tokens.css:82-85`) | — | — | Global rule exists and is real — a genuine positive finding, not assumed |
| `.rail a` / `.tab` (nav) | ✅ | ✅ (`shell.css:10`) | inherits global | n/a | n/a | |
| `.accent-fill` (buttons) | ✅ (broken, §2.3) | **not found** | inherits global | **not found** | **not found** | No hover/disabled/loading treatment found anywhere in `portal/ui/*.css` |
| Manifest state pill (`.stt`) | ✅ | n/a | n/a | n/a | n/a | Exists; see §3.4 for why it may show the wrong state |
| Form inputs (Access/Armory/Broadcast) | ✅ | **not found** | inherits global | **not found** | **not found** | |

**Reduced motion:** the mockups' `prefers-reduced-motion` rules (5 of 6 files) have no shipped counterpart, by definition of §2.1 (zero `@media` rules exist at all).

## 5. UX copy audit (per `design:ux-copy`'s lens)

The masthead-copy gap (§3.3) is the headline finding, but there are smaller, correctness-grade copy defects worth fixing regardless of the larger redesign:

- **Raw internal identifiers leaking to users**: `newDraws`/`returningDraws` as visible Type values (§3.4) is a "name things by what people recognize, not how the system is built" violation — a real user has no reason to know the schema's field names.
- **Generic error/empty-state copy not yet audited**: this document did not check whether Broadcast's `"Nothing is currently showing."` or Access's `"No scope is held by exactly one non-owner admin."` follow this project's error/empty-state conventions (what-why-how-to-fix). Both currently read as acceptable, plain, honest copy — worth a pass in Phase 3 alongside the masthead writing, not treated as a separate defect here.
- **The login page's copy is functionally fine** (`"Sign in with Discord to continue."` is clear and active-voice) — the defect there is entirely visual (§2.3, §3.1), not copy.

## 6. What's already working — carry this forward, don't rebuild it

- **The color system is centrally sourced.** Zero hardcoded hex outside `tokens.css`. Fix the four missing tokens (§2.2) and most of the visible color problem resolves at the token layer, not through scattered CSS changes.
- **Type matches the approved mockups exactly.** Space Grotesk (UI) + JetBrains Mono (data), tabular alignment on dates/ids/codes — verified against the "blued steel" skin mockup (`02-skins-and-structures.html`), which is also where "roomy" spacing and 6px radius were decided as the final merged skin (`docs/superpowers/specs/2026-08-20-web-admin-portal-design.md:230`) — `tokens.css:35`'s `--radius:6px` correctly reflects that decision. **No gap here.**
- **The changeset/commit pipeline's actual logic is real and tested**, not mocked or missing. `portal/ui/board.logic.js`'s `gateCommit()` (typed-confirmation check), `columnFor()` (Draft→Staged→Blocked→Ready classification), `blockedReason()`, and `track.logic.js`'s `tierOf()` (date-based conflict detection comparing `endDate` to `season.bpEnd`) are all real, working code with dedicated tests (`scripts/portalApi.test.js`, `scripts/portalUi.test.js` per `.claude/rules/scripts-and-migrations.md`). The mockup's rich "2 of 3 ready · 1 blocked · 1 conflict" summary and conflict-warning callout (`04-armory-and-commit.html`, Commit & diff section) are a **visual treatment gap (Phase 3), not a functionality gap (Phase 2)** — get this distinction right, it changes which phase owns the work.
- **Access and Broadcast hold up structurally at 375px width**, aside from the shared header overflow (§2.1) — both stack into a single readable column with no overlapping or clipped content in the body, per Harkirat's real screenshots.

## 7. Explicitly unverified — Phase 1's first job

Nobody has looked at any of these yet, in either direction (mockup or real). Do not assume they match the pattern above; go get the evidence first.

1. **Armory's real rendering** — mockup (`04-armory-and-commit.html`) shows a card grid with a colored left-edge bar per weapon category, section dividers by class (`SNIPER · 10 weapons · 19 builds`), build counts, `dupe?` warning tags, dashed "no image" placeholders. No real screenshot exists. Get one before scoping Phase 3's Armory work.
2. **Board's real rendering** — the Season realm's second tab (alongside Track). Mockup shows a 4-column pipeline (Draft/Staged/Blocked/Ready) with card-based changesets. No real screenshot.
3. **The Commit & diff flow's real rendering** — `04-armory-and-commit.html`'s third section: the conflict-warning callout, the typed-confirmation UI, the "N of M ready" summary line. The underlying logic is confirmed real (§6) but its visual treatment is unconfirmed.
4. **Analytics's native design intent** — the one real screenshot obtained for this realm is a raw monospace text dump (Usage/Timing/Alerts), which reads like the `/bot analytics` Discord command's own export rendered inside the portal tab, not a portal-native dashboard. This investigation never rendered `06-access-and-analytics.html`'s Analytics half (only its Access half was screenshotted) — do that before concluding anything about the gap here.
5. **Whether `toManifestRows()`'s hardcoded `state:'live'` (§3.4) is independently visible**, or fully masked by the header/column overflow from §2.1, on a real device.
6. **Tablet-width (768–1024px) rendering** — nobody has checked this viewport at all, real or mockup, in either direction.

## 8. One finding about the audit tooling itself

`scripts/buildPortal.js`'s `portalContrastAudit()` (documented in `.claude/rules/scripts-and-migrations.md`) checks `:root` token pairs directly and would not have caught §2.3's login-button failure, because that failure only exists in a fallback chain that triggers when a *referencing* property's variable is left unset — not in the token definitions themselves. Worth filing as a real gap in that tool, separate from fixing this one button: extending the audit to check computed contrast on real rendered elements (not just token pairs) would catch this whole class of bug going forward. Not scoped into the phases below; noted here so it isn't lost.

## Appendix: source inventory

- Mockups rendered live during this audit: `01-season-spine.html`, `02-skins-and-structures.html`, `03-three-surfaces.html` (fully — Track and Manifest sections), `04-armory-and-commit.html` (Armory card grid + Commit & diff sections), `05-door-broadcast-ops.html` (Door + Broadcast + start of Operations), `06-access-and-analytics.html` (Access section only — see §7.4).
- Real screenshots evaluated: Season/Track+Manifest, Access, Broadcast, Analytics (raw export view) — all from Harkirat's phone, 2026-08-22 09:46-10:02 EDT, against `Dioreo (Dev)` + local dev Mongo.
- Code read directly, not recalled from memory: `portal/ui/*.{js,css}`, `portal/api/access.js`, `portal/api/policy.js`, `utils/adminAccess.js`, `utils/manageActions.js`, `models/Announcement.js` (via memory cross-check, confirmed against `docs/db-deferred-list.md`'s existing entry).
