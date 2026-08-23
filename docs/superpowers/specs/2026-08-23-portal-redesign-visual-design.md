---
kind: spec
status: frozen
---

# Portal redesign — visual design

> Phase 3 of `docs/superpowers/plans/2026-08-22-portal-design-alignment.md`, written by Session B on 2026-08-23. Session A (Phases 1–2) shipped in PR #170; Session C (Phase 4) verifies this document's claims against the shipped code. Every decision below states the evidence it rests on, and the four that were Harkirat's rather than mine are marked **[HK]**.

## 0. What changed about the inputs before any design started

Two corrections landed before a line of CSS was written, and both are the reason this spec is not the one the plan anticipated.

**The mockups are not all the same kind of document (Harkirat, 2026-08-23 14:47 EDT).** `01-season-spine.html` is a **full-style** mockup — one page, designed completely, the way the app should actually look. `02`–`06` are **compiled-style** sheets: several pages and sections stacked into one file for review, wrapped in a document-navigation bar and annotated with explanatory prose. Reading a compiled sheet as though it were app chrome is a real trap and it has already cost this project once: the shipped portal's horizontal top bar, carrying all five realm names in a row, is almost exactly `06`'s *document* nav. That is the bar this redesign removes.

**Which makes `01` authoritative for style and the design spec authoritative for structure.** `docs/superpowers/specs/2026-08-20-web-admin-portal-design.md` §8.2 and its decision 10 settle **five realms**, and its realm↔page↔scope join table gives Access and Analytics *different* permission gates — Access is `isOwner()` only, Analytics is the `bot` command token. `01`'s rail shows four items with Access and Analytics merged as "OPS", which is the earlier sketch; merging them now would collapse two different gates into one and is exactly the incompatible-authorization failure that table exists to prevent. **Five realms, in `01`'s rail form.**

## 1. Task 3.1 — what Phase 2 actually shipped, checked rather than assumed

The plan's Task 3.1 says to confirm the audit's predictions match what Phase 2 shipped. Taken literally: every §2/§3 finding was re-checked against the tree and against a real render at 1400px and at an emulated 375×812 viewport, signed in as the owner against local dev Mongo. Seven predictions held. **Three did not**, and all three were found by looking rather than by reading the audit.

### D1 — `row.topicVar` is read, deleted, and never set

Audit §2.2 says `manifest.js:61` consumes `row.topicVar` and that "`season.js`'s `toManifestRows()`/track-item builders are the source of that `topicVar`, so both consumers hit the identical gap." They are not the source. `rg topicVar portal/ --hidden` returns exactly three hits: the read at `manifest.js:61`, a `delete rawPayload.topicVar` at `season.logic.js:68`, and a comment. **Nothing anywhere assigns it.**

So Phase 2's Task 2.2 — which added the four missing tokens — fixed the Track bars only, because `track.js:16` computes its own `--topic-accent` from `TOPIC_VAR[laneFor(item)]`. The Manifest's row dots have never been coloured in any realm. Confirmed on a real render: all 39 Season rows show an identical `--ink3` grey square. This is a wiring gap wearing a token gap's clothes, and it survived Phase 2 precisely because Phase 2 correctly did only what the audit scoped.

### D2 — form controls have no base styling, not merely no states

Audit §4's completeness table records "Form inputs (Access/Armory/Broadcast) | Default ✅ | Hover **not found** | Disabled **not found**". The "Default ✅" is false. Measured with `getComputedStyle` on the live page rather than inferred from a screenshot:

| Element | background | color | border | font | height |
|---|---|---|---|---|---|
| `#grant-discordid` | `rgb(255,255,255)` | `#000` | `2px inset` | Arial | 21.5px |
| Revoke `<button>` | `rgb(239,239,239)` | `#000` | `2px outset` | Arial | 21.5px |
| `#manifest-search` | `#0B0F12` | `#E8EDF1` | `1px solid` | **Arial** | 31.5px |

Enumerating every rule in the stylesheet whose selector touches `input|select|textarea|button` returns **five**: `.srch input`, `td input`, `.bulk button`, `.v2-card .v2-row button`, `.tray-item button`. Everything else is browser chrome — white boxes on a near-black page. Even the one search input that *is* styled renders in Arial, because form controls do not inherit `font-family` and nothing sets it.

That reframes the finding: not "hover and disabled are missing" but "**there is no base state**", which is both more severe and cheaper to fix properly.

### D3 — neither webfont is loaded

Audit §6 lists under *what's already working*: "Type matches the approved mockups exactly. Space Grotesk (UI) + JetBrains Mono (data)… **No gap here.**"

`portal/public/index.html` contains exactly one `<link>` — `/app.css`. There are zero `@font-face` rules and `document.fonts.size === 0`. The falsifier that could actually fail: render the same string at 40px in `"Space Grotesk"` and in `"JetBrains Mono"` and compare widths. A real proportional sans and a real monospace face cannot measure the same.

```
"Space Grotesk"  579.87px
"JetBrains Mono" 579.87px      ← identical: both fall back to the same last-resort face
sans-serif       606.88px
monospace        746.55px
```

Conclusive: **neither face has ever shipped.** Data columns still *look* monospaced because the declared stacks list `ui-monospace`/`Menlo` after JetBrains Mono, so the tabular convention survives by luck — but the approved typography has never once been on screen. §6's "no gap here" is wrong, and fixing it is the highest visual return per line in this whole phase.

### Three further defects, none of them styling

- **D4 — Broadcast shows unstarted announcements as live.** `/api/broadcast`'s `live` list does not filter on `startsAt`. Seeded a real announcement with `startsAt` three days out; it renders under "Now showing" as item 3. `startsAt` was added on 2026-08-21 specifically to make this expressible, and nothing consumes it.
- **D5 — Season's Track collapses when `bpEnd` is null.** `visibleWindow` is `{start: today, end: state.live?.bpEnd || today}`. With `bpEnd` unset — its state in the dev database right now — start equals end, `barGeometry` divides by a 1ms window, every bar renders as a sliver at 0%, and the ruler prints today's date twice. Not in the audit at all.
- **D6 — the draft rail renders five empty lanes** (~200px of dead vertical space) whenever `state.draft` exists but holds nothing.

### The mobile measurement, with the viewport asserted first

The layout viewport was asserted to be exactly 375 before any number was trusted. This mattered: the first pass reported `innerWidth: 871` and read like an emulation failure. It is not — it is the symptom. Overflowing content stretches the visual viewport, so `innerWidth` is a *result*, and `document.documentElement.clientWidth` is the guard.

| Realm | doc scrollWidth | overflows by | header scrollWidth | header overflows by | controls under 44px |
|---|---|---|---|---|---|
| Season | 871 | **+496** | 863 / 359 | **+504** | 48 of 48 |
| Armory | 711 | +336 | 703 / 359 | +344 | 145 of 145 |
| Broadcast | 711 | +336 | 703 / 359 | +344 | 11 of 11 |
| Access | 711 | +336 | 703 / 359 | +344 | 14 of 14 |
| Analytics | 711 | +336 | 703 / 359 | +344 | 106 of 106 |

Session A's "content-dependent, not one global breakpoint failure" is right about the *mechanism* and understates the *scale*: the base header — wordmark, five realm links, owner id, nothing else — already overflows by 344px on its own, and Season's Track/Board toggle adds a further 160px on top of that. Both need fixing. And the touch-target figure is not "some controls are small": it is **every control on every realm**, without exception.

## 2. The four decisions that were Harkirat's

**[HK] Navigation: left icon rail on desktop, bottom tab bar on phone.** `01`'s 76px rail with icon-over-label and a coloured active edge; the top bar shrinks to `--hdr` and carries only the wordmark, a breadcrumb, and identity. Below 900px the rail becomes a fixed bottom tab bar. This is what makes `--rail` a real token rather than decoration — see §3.

**[HK] Analytics: the full dashboard, health sourced from Mongo.** Health/Usage/Timing switcher, four KPI tiles with sparklines, and the filterable event river. The river needed no API change at all — `/api/analytics` has always returned it as structured JSON and the UI was throwing the structure away into a `<pre>`. Only the tiles needed new data. Because the portal is a **separate process from the bot**, `computeHealthStats(client)` is unreachable, so uptime and restarts come from `BootRecord` and errors from `AlertLog`, and the UI says so rather than implying a live reading.

**[HK] Commit: build the full REVIEW CHANGESET screen.** `04`'s highest-consequence surface — operations list, before/after field diffs, the destructive summary, and the three-step gate — rather than only enriching Board's cards.

**[HK] Masthead: data only, per `01`.** Title, context line, right-aligned stat cluster. **No `ANSWERS:` tags and no explanatory paragraphs**, because those live only in the compiled sheets and are reviewer annotation. This resolves audit §3.3 as *a finding that read a compiled sheet as chrome*, not as a gap to close — see §5's resolution table.

## 3. The design system

### 3.1 Layout tokens — the "one place to override" Task 3.4 asks for

```css
--rail: 76px;   /* the nav rail's THICKNESS — width when vertical, height when horizontal */
--hdr: 52px;    /* top bar height */
--gut: 24px;    /* panel side margin (was hardcoded in .panel{margin:16px 24px}) */
--gap: 16px;    /* vertical rhythm between panels */
```

`--rail` deliberately names a *thickness*, not a width. The rail is vertical on desktop and horizontal on phone, so one token serves both axes and the breakpoint overrides a single declaration instead of a dozen scattered ones. Both values come from `01-season-spine.html:15`.

### 3.2 Breakpoints — exactly two

**900px** (rail → bottom tabs, multi-column → single) and **640px** (tables → their own scroll container, tighter type and gutters). A third breakpoint is a third state nobody tests. Note these are *far* below the mockups' own 1180–1240px collapses, which are a tablet concern and were never a phone layout — audit §2.1's nuance, and it is correct.

### 3.3 Form controls — styled as elements, never as classes

There are roughly twenty bare `<input>`/`<select>`/`<textarea>`/`<button>` call sites across six files. A class-based fix is one you can forget at the twenty-first site; an element selector cannot be forgotten. Element rules also sit at lower specificity than the existing `.accent-fill`/`.danger`/`.commit` modifiers, so nothing that already works changes.

The full state set the audit found missing everywhere: base, `:hover`, `:focus-visible` (already global and confirmed keyboard-reachable by Session A), `:disabled`, and `[aria-busy="true"]` for loading.

### 3.4 Touch targets

Desktop stays dense per design spec §7 (32px minimum). Below 900px every control gets a 44px minimum. One rule in one media block, not a per-component fix.

### 3.5 Type

Add `preconnect` + the Google Fonts stylesheet for Space Grotesk and JetBrains Mono to `buildIndexHtml()`. Three lines that make §6's claim true instead of false. The existing fallback stacks stay exactly as they are, so an offline or blocked load degrades to what ships today rather than to nothing.

### 3.6 Colour and shape stay as decided

`SHAPE` carries state, `COLOUR` carries topic (design spec §9) — unchanged, and it is the reason the state pills work in greyscale. D1's fix means the row dots finally participate in that system: `toManifestRows` stamps `topicVar` from the row's lane, and the other realms stamp theirs where they have a real topic.

## 4. Per-realm treatment

| Realm | View layer | Masthead stats | The designed surfaces built |
|---|---|---|---|
| **Season** | Track · Board | days left · draws live · staged | Track window derived from the data's own range when `bpEnd` is null (D5); draft rail hidden when empty (D6); Type/State filter chips; coloured row dots (D1) |
| **Armory** | Rack · Coverage | weapons · builds · flagged | Rack as category-coloured cards with a left-edge accent bar and per-category section dividers; Coverage as a real matrix whose every cell filters the Manifest |
| **Broadcast** | Now showing · Airtime | live · scheduled · never expires | Slot cards with an accent edge; Airtime as a real time axis; `LIVE`/`SCHEDULED`/`EXPIRED` state pills; the heads-up callout; and the `startsAt` filter fix (D4) |
| **Access** | By admin · By scope | admins · signed in now | The permission grid over Phase 2's `/api/access/matrix`, with granted-directly vs inherited rendered distinctly; By scope as cards with single-point-of-failure warnings |
| **Analytics** | Health · Usage · Timing | uptime · errors 24h | Four KPI tiles with sparklines; the filterable event river with kind and source chips |
| **Board** | — | ready · blocked · conflicts | Cards carrying the op in words and its inverse preview; the REVIEW CHANGESET screen with before/after diffs and the three-step gate |

## 5. Task 3.5 — every audit §2/§3 finding, with its disposition

One line per numbered finding in `docs/superpowers/specs/2026-08-22-portal-mockup-vs-live-gap-audit.md`. Every "fixed" below was checked against a real render at 1400px and at an emulated 375×812 viewport, signed in as the owner against local dev Mongo — not against the code alone.

| Finding | Disposition |
|---|---|
| **§2.1** Zero responsive CSS; header overflows | **Fixed.** Two breakpoints (900px, 640px) over four layout tokens. Measured after: **0px horizontal overflow on all five realms** at a real 375px layout viewport, down from +336 to +496. The header no longer carries the realm links at all — the rail does — so the specific 344px base overflow cannot recur. |
| **§2.2** Four Season accent tokens undefined | **Already fixed by Phase 2, and half of it was still broken.** The tokens exist and the Track bars render red/blue/green/purple. But `row.topicVar` — the Manifest's half of the same finding — is read by `manifest.js:61`, deleted by `season.logic.js:68`, and was never set anywhere, so all 39 rows drew the `--ink3` grey fallback. Now stamped in `toManifestRows`, with Playlist split off Event. Verified: 0 grey dots of 39. See §1's D1. |
| **§2.3** Login button fails WCAG contrast | **Already fixed by Phase 2.** Re-verified live: `.door .door-cta` renders `#5865F2` on `#fff`. Extended, not re-done — the door now also carries the wordmark, the subtitle, and the two OAuth disclosure blocks from `05`. |
| **§3.1** The door has no Discord branding | **Fixed.** The button was Phase 2's; this phase added the `DIOREO/PORTAL` wordmark, the `bot management` tag, and the "What this asks Discord for" / "What gets stored" blocks. Those are the page's real content per spec §10, not decoration. |
| **§3.2** Access's permission grid does not exist | **Fixed.** The grid consumes Phase 2's `GET /api/access/matrix`, which was extended to return `{direct, inherited, held}` per scope rather than one boolean — the direct-vs-inherited distinction is the whole reason a grid beats the comma-separated string, and it was collapsed away. `grantedAt` is derived from the `AdminUser` ObjectId's own timestamp (verified identical to Mongoose's `getTimestamp()`) rather than adding a schema field. |
| **§3.3** Every realm's masthead copy is absent | **Resolved as a misread, then built differently.** The `ANSWERS:` tags and explanatory paragraphs this finding describes appear only in the **compiled-style** sheets (03–06), which are review documents, not chrome — `01`, the full-style mockup, has a data masthead only. Harkirat's call (2026-08-23 14:52 EDT) was the data masthead. Every realm now carries a title, a context line, and a stat cluster computed from live data. |
| **§3.4** Season's Manifest config (2 defects) | **Already fixed by Phase 2, both verified live.** The Type column reads "New draw"/"Returning draw"/"Event"/"Playlist"; the state pill now genuinely varies — screenshotted with a real staged changeset showing one row `STAGED` against 38 `LIVE`, which nobody had seen before because no changeset had ever existed while looking. |
| **§3.5** Broadcast's state pills and callout | **Fixed, plus a real bug the finding did not reach.** `LIVE`/`SCHEDULED`/`EXPIRED` pills, a `Starts` column, slot cards, a real Airtime time axis, and the heads-up callout. The bug: `/api/broadcast` filtered only on `expiresAt`, so a not-yet-started announcement listed under "Now showing" — while `utils/announcement.js` correctly withheld it from Discord. State is now computed server-side in one place. See §1's D4. |
| **§3.6** Armory/Board/Analytics unverified | **Resolved by Phase 1, then styled.** Armory: category-coloured rack cards with section dividers and a clickable coverage matrix. Board: enriched cards plus the review screen. Analytics: the full dashboard. |
| **§4** Layout dimension tokens missing | **Fixed.** `--rail`/`--hdr`/`--gut`/`--gap`. `--rail` names a thickness so the phone breakpoint overrides one declaration. |
| **§4** Component states (hover/disabled/loading) | **Fixed, and the finding understated it.** The table recorded form inputs as "Default ✅"; measured, they were browser chrome — white boxes, Arial, 21.5px. Now styled as elements with base/hover/focus-visible/disabled/`aria-busy`. See §1's D2. |
| **§4** No `prefers-reduced-motion` | **Fixed.** A global reduce block; the one animation (the busy spinner) keeps a non-animated ring so "busy" still reads. |
| **§5** Raw identifiers leaking to users | **Already fixed by Phase 2**, verified live. |
| **§5** Error/empty-state copy unaudited | **Fixed.** Every realm and the Manifest now carry a written empty state that says what is missing and where the thing would come from, instead of a blank table. |
| **§6** "Type matches the mockups exactly — no gap" | **Falsified.** The portal declared Space Grotesk and JetBrains Mono and loaded neither; `document.fonts.size` was 0. Fixed by adding the font links to `buildIndexHtml`. Verified with the same falsifier that found it: the two faces now measure 623.04 vs 744 rather than an identical 579.87. See §1's D3. |
| **§7** Six unverified items | **Resolved by Phase 1** (Session A's addendum). Nothing re-derived here. |
| **§8** `portalContrastAudit()` cannot see fallback chains | **Closed in full, 2026-08-23 16:24 EDT.** Both halves. The static pass now resolves `var()` chains and their fallbacks and checks every rule declaring a `color` — 12 pairs to **157** — and found `.accent-fill` at **1.39:1**, this audit's own §2.3 login button still latent on every Stage button. The rendered half is `scripts/portalContrastRendered.test.js`, which walks 285 rendered elements against the nearest ancestor actually painting a background. ⚠️ **This row said "still open, deliberately" until Harkirat asked why a missing browser package was being treated as a constraint.** It was not one. |

### Found in this phase, outside the audit's numbering

- **`columnFor` put a validation-failed changeset in Ready**, and the Staged column was structurally unreachable — nothing ever returned it. Both fixed, both now asserted in `scripts/portalUi.test.js`; neither had any test coverage before, which is why they survived.
- **`findOverlaps`/`findGaps`/`tierOf` had never been called by anything.** The Track's `flags` prop existed and every caller passed nothing, so the defect row — the realm's stated reason for existing — never rendered. Now derived, ranked conflict → gap → overlap, and capped at three.
- **Season's Track collapsed to a zero-width window** whenever `bpEnd` was unset. See §1's D5.
- **The draft rail rendered five empty lanes** whenever `state.draft` existed but held nothing. See §1's D6.
- **A CSS class collision**: the sparkline's `.now` matched `track.css`'s absolutely-positioned NOW line and painted a gold rule down the whole Analytics page. Renamed, and a sweep for bare single-class selectors defined in more than one portal stylesheet found only `.bar`, which is deliberate.

## Audit log

The falsification pass, run as `.claude/rules/plan-drafting.md` requires — the question was *where is this wrong*, aimed at the audit spec this phase was supposed to implement rather than at a plan of my own.

| Finding | Severity | Where fixed |
|---|---|---|
| `row.topicVar` read, deleted, never set — audit §2.2 asserts `toManifestRows` is its source | High — silent; the token fix looked complete | `season.logic.js` stamps it; §1 D1 |
| Form controls have no base styling — audit §4 records "Default ✅" | High — visible on every realm | `tokens.css` element rules; §1 D2 |
| Neither webfont loaded — audit §6 lists type under "already working" | Medium — silent, the fallback stacks are decent | `buildPortal.js` font links; §1 D3 |
| `/api/broadcast` ignores `startsAt` | High — the portal contradicts Discord | server-side `announcementState`; §1 D4 |
| Track window collapses when `bpEnd` is null | High — unusable Track, and `bpEnd` is genuinely optional | `seasonWindow()`; §1 D5 |
| `columnFor` puts a validation-failed changeset in Ready | High — offers to commit what cannot commit | `board.logic.js`; no prior test coverage |
| Staged column structurally unreachable | Medium | same |
| `findOverlaps`/`findGaps`/`tierOf` never called by anything | Medium — a built, tested feature that never rendered | `track.js` `deriveFlags()` |
| Sparkline `.now` collides with the Track's global NOW line | Medium — a gold rule down the whole Analytics page | renamed `.tip`; swept for other bare-class clashes |
| Ruler end label clipped by `.panel{overflow:hidden}` at 375px | Low | `.ruler span[data-end]` right-anchored |

**Cleared, not fixed.** The four-vs-five realm question looked like a live fork (mockup 01's rail says "OPS") and is not: design spec §8.2 and its decision 10 settle five, and Access and Analytics carry *different* permission gates, so merging them would collapse two gates into one. `.bar` is defined in two stylesheets and that is deliberate — `tokens.css` owns the shape semantics, `track.css` the geometry. Phase 2's Tasks 2.1/2.3/2.4 were each re-verified against a real render rather than trusted; all three held.

**Assumptions converted to measurements.** "Neither font loads" was tested by comparing two named families against each other, not against a generic — the identical width was the proof. `grantedAt` derived from an ObjectId was diffed against Mongoose's own `getTimestamp()` before being shipped. The mobile numbers assert `document.documentElement.clientWidth === 375` before trusting anything, after the first pass reported `innerWidth: 871` and read like an emulation failure.

**Alternatives re-examined and still rejected.** Restricting overlap detection to the draw lanes would have cut the flag noise at the source, and was rejected: it asserts a CODM scheduling rule this session cannot verify, and a detector that silently drops a real finding is worse than one that ranks it last. Making in-table checkboxes 44px was rejected for the same class of reason — it clears WCAG 2.5.5 (AAA) at the cost of turning a 39-row manifest into six screens; 24px clears SC 2.5.8 (AA), which is the actual requirement.

## Addendum — 2026-08-23 16:12 EDT: the three deferred items, closed

Harkirat's call once the sizing was on the table: *"you could just do them right now since you have everything in context, and they're gonna touch the same files anyway."* All three are done and archived in `docs/archive/resolved-list.md`. One of them stopped being a deferral the moment it was measured, and that is the part worth carrying:

**The contrast gate found a live bug on its first real run — the original one.** Extending `portalContrastAudit()` from token pairs to **every rule that declares a `color`**, resolving `var()` chains and fallbacks to a literal hex, took it from 12 pairs to **157** and immediately reported `.accent-fill` declaring `#000` on `--raised` at **1.39:1**. That is the login button's own bug, §2.3, *still latent* — Phase 2 fixed the door by giving it a separate rule and left `.accent-fill` itself intact, so every Stage button in Season, Armory and Broadcast (outside `.mtools`, so nothing overrode the background) was rendering black on dark grey the whole time. Two more: `.stt.sched` at 3.68:1, which is a Season **topic** accent borrowed as pill text — *the same mistake `--info` had been created to correct forty minutes earlier, made a second time in the same session* — and `.bar.live` in Airtime.

The fix is structural rather than per-instance. Measured: `#000` ink clears AA on **every** real topic accent (`--ret` 4.52:1 floor, `--patch` 12.53:1 ceiling) and fails only on a **surface** (1.39:1 on `--raised`). So a rule pairing `--on-accent` with a topic fill now falls back to `--patch`, never to a surface — safe by construction instead of by every caller remembering.

**What this says about §3's design system, honestly.** Three separate times this session a Season topic token was reached for as text — `--ret` for a kind chip, `--play` for a state pill, and `--raised` as a fill fallback. Each was caught by measurement, none by review. The `SHAPE carries state, COLOUR carries topic` rule tells you what colour *means*; it says nothing about which tokens are safe as *text*, and that distinction is where all three went wrong. The audit now enforces it, which is the only reason writing it down here is worth anything.

## Addendum — 2026-08-23 (Session B, Phase 3)

Everything above was written after implementation and against real renders. Three things a reader should not have to infer:

**The design decisions in §2 are Harkirat's, and two of them changed the shape of this phase.** The masthead call turned the single most labour-intensive item on the plan's list into a smaller one, and it did so by reclassifying a finding rather than by cutting scope. The Analytics call turned a styling pass into a feature build. Neither was mine to make.

**The `viewport not applied` trap is worth carrying forward.** The first mobile measurement reported `innerWidth: 871` and read exactly like an emulation failure. It was the symptom: overflowing content stretches the visual viewport, so `window.innerWidth` is a *result* and `document.documentElement.clientWidth` is the guard. Every measurement in this document asserts `clientWidth === 375` before trusting a number.

**The stale-module trap Session A documented is real and cost turns again.** A hard reload with `ignoreCache` was not enough to pick up rebuilt ES modules or CSS twice; only a brand-new tab was. If a fix "isn't showing up", open a new tab before doubting the fix.
