---
kind: reference
status: live
---

# Dioreo web admin portal — the interactive mockup, explained in full

This document exists for **the session that wires this design into real data and a real backend.** A previous attempt at that struggled because the plan said *what* to build without saying *why anything is shaped the way it is*, so it made locally-reasonable choices that broke the design. Everything here is written to prevent that recurring. It is deliberately long; the traps section alone will save more time than reading it costs.

The mockups carry **no explanatory prose of their own**, on purpose — the HTML has to read as a product, not as a document about a product. All the reasoning lives here.

---

## 0.0 Map — read in this order

**If you have 5 minutes and are about to write code**, read §3.9 (design from the system, not the fixtures), §5.99 (the data contracts, in code), and §5.99.4 (definition of done per realm). Those three are the ones that stop you shipping something wrong.

**If you have 30 seconds**, run the gate. It answers the one question this whole document exists to answer, mechanically:

```bash
node .schema-gate.mjs --self-test
```

| § | What it is | Read it when |
|---|---|---|
| **0.5** | The territory — what already exists in `core/`, `portal/` and the frozen specs | **First, always.** It exists because a cold reader concluded the whole backend needed inventing |
| **1–2** | What the portal is for; the shared foundation | Before adding any page |
| **3** | The ten audit invariants and the bug each one earned | Before trusting a green audit |
| **3.6–3.9** | The four standing contracts: keyboard · accessibility · responsive · **design from the system** | Before writing a surface. §3.9 is the one that matters most, and it names **five** sources — the fifth is `portal/` itself |
| **3.9.1–3.9.2** | `.export-fixtures.mjs` and `.schema-gate.mjs`; why a tier is **derived** at `Store.add()` and never stated | Before writing a fixture or staging an op |
| **4** | The design language — shape/colour, the two vocabularies, tier derivation | Before making any visual decision |
| **5.0** | The Manifest — one component, six pages, spec'd once | Before building any list surface |
| **5.2–5.8** | Element-level spec per realm | While building that realm |
| **5.99** | **Data contracts, predicates in code, done-criteria, symptom→cause** | While wiring. This is the part you can copy |
| **6** | Wiring order | When you start |
| **7** | Traps already paid for | When something behaves oddly |
| **10 / 12** | Art direction as specified / as built | When judging whether it looks right |
| **14** | What a passing audit does **not** mean | Before saying "verified" |
| **14.5** | Two defects found in **shipped** `portal/api/access.js`, fixed test-first | Before trusting a portal endpoint's own comments |
| **15** | Contracts the mockup cannot express — transactions, concurrency, authz, dates, async | While wiring the backend |
| **15.11** | Still open — ask before deciding | Before assuming something is settled |

---

## 0. How to run it

```bash
cd docs/superpowers/mockups/2026-08-23-portal-interactive
python3 .serve.py          # 127.0.0.1:8899, with no-store headers
```

> ⚠️ **Use `.serve.py`, not `python3 -m http.server`.** The built-in server sends no cache headers and Chrome will serve a stale `fixtures.js` while disk has the new one. This cost several rounds in the session that built this — three separate "verified" claims were measuring old assets. `.serve.py` sends `Cache-Control: no-store`, and asset URLs additionally carry a `?v=` query bumped on edit, because the memory cache defeated the header alone.

Start at `season.html`. Classic (non-module) scripts and relative paths throughout, so `file://` also works minus the cache guarantees.

---

## 0.5 The territory — what already exists, and what this document is *not*

**Read this before you conclude anything is missing.** A cold reader of an earlier draft came away believing they would have to invent the API, the transaction semantics, the auth model and the concurrency story. **All four already exist**, as decisions and as code, and none of them are in this document. This document is the *visual and interaction* contract. It deliberately does not restate the backend, and an earlier draft never said so — which is exactly the failure it exists to prevent.

| What | Where | State |
|---|---|---|
| **The operation algebra** — `validate` / `preview` / `apply` / `invert` | `core/ops/*.js` — `season` · `draws` · `calendar` · `loadouts` · `patchnotes` · `announcements` · `index` | **Code on disk.** This is what every portal mutation calls |
| **Changeset composition and commit** | The spec names `core/changeset.js`; on disk the composition and revert paths sit in `core/ops/index.js` and `core/revert.js` — **check which before importing** | Code on disk, path differs from the spec |
| **HTTP entry, sessions, static assets** | `portal/server.js`, `portal/auth.js` | Code on disk |
| **The realm endpoints** | `portal/api/*.js` — `season` · `armory` · `broadcast` · `access` · `analytics` · `changesets` · `policy` · `realmAccess` · `httpUtil` | Code on disk |
| **The live frontend** | `portal/ui/**` (source) → `portal/public/**` (built output, served by the VM) | Code on disk — **see the warning below** |
| **The backend design record** — algebra, tiers, safeguards, hosting, auth, data-model changes | `docs/superpowers/specs/2026-08-20-web-admin-portal-design.md` | Frozen spec, still authoritative on everything except visual design |

**There are nine other portal documents, all `status: frozen`, and none of them reference this package.** That is a discoverability problem in itself — if you arrived here from one of them, nothing told you this existed. The map:

| Document | Governs | Read it when |
|---|---|---|
| `specs/2026-08-20-web-admin-portal-design.md` | The whole backend: op algebra, tier derivation, safeguards, hosting, auth, data-model changes | **Always.** Everything §15 points at lives here |
| `plans/2026-08-20-portal-core-operation-algebra.md` · `-core-remaining-entities.md` · `-server-and-realms.md` | How `core/ops/*` and `portal/server.js` were built | You are changing the core or adding an entity |
| `specs/2026-08-21-portal-compose-ui-design.md` + `plans/2026-08-21-portal-compose-ui.md` | The compose/editing UI as originally designed | Before redesigning any compose surface — it may already answer you |
| `specs/2026-08-22-portal-mockup-vs-live-gap-audit.md` | A findings list comparing the earlier mockups to the live portal | ⚠️ **Three of its claims did not survive being checked.** Treat every remaining finding as unverified |
| `plans/2026-08-22-portal-design-alignment.md` | The plan that acted on that audit | Historical context for why `portal/ui/` looks the way it does |
| `specs/2026-08-23-portal-redesign-visual-design.md` | The visual redesign decided the same day as this package | Same-day sibling — see the precedence note below |

> **Precedence, on this repo's own convention rather than on assertion.** Those are `kind: spec, status: frozen` — dated snapshots that are superseded rather than edited, and a stale one is *correct* by design. This file is `kind: reference, status: live` — a document kept true. So **for anything a reader sees on screen, this file governs and the frozen specs record how the thinking got here.** For anything behind the request, the 2026-08-20 spec governs, because this file does not cover it and never should. If you find a live disagreement that this rule does not settle, ask rather than picking — do not silently resolve it by date.

> 🔴 **`portal/ui/` is not empty, and it is not this mockup.** It already contains `season` · `armory` · `broadcast` · `access` · `analytics` · `board` · `manifest` implementations with their own CSS. **That is the earlier wiring attempt — the one that did not honour the design, and the reason this package exists.** So your job is almost never "build a page from nothing"; it is **bring an existing implementation to match the mockup**. Diff the two before you write anything. Do not assume a file in `portal/ui/` is correct because it exists, and do not assume it is wrong because it predates this document — read it.

**Which document wins, on what:**

- **This one** governs everything a reader sees: layout, type, colour, motion, state encoding, copy, element behaviour, edge states. Where it and the 2026-08-20 spec disagree about how something *looks or behaves on screen*, this one is newer and wins.
- **The 2026-08-20 spec** governs everything behind the request: the op algebra and its four verbs, how tiers are derived, transactions, concurrency, permissions, sessions, hosting, and the data-model changes. Nothing here overrides it, and §15 below only *points at* it rather than restating it, because a second copy of a contract is a contract that drifts.
- **The bot's own code** governs colour (§4.2) and the Discord render (§6.5). Neither document may invent those.

---

## 1. What the portal is for

`/manage` is constrained by Discord in ways that will not change: a modal caps at **five text inputs, text only** — no dropdown, no date picker, no file upload, no checkbox. A message caps at **40 components counted recursively**, which this project has already crashed production against. An interaction token expires in about **fifteen minutes**, so there is no long editing session, no autosave, no draft. Nothing can preview what an edit looks like once rendered. There is no diff before a destructive bulk replace. There is no scheduling.

The portal is not a prettier `/manage`. It exists for **what Discord structurally cannot do**:

| Discord does this well | The portal exists for this |
|---|---|
| One question, one answer, one screenful | Holding a whole season in view at once |
| Quick single edits | Multi-entity changes previewed and committed atomically |
| Being where the players are | Seeing what players will see, before committing |
| — | Diffing a staged change against what is live |
| — | Scheduling, bulk editing, long sessions |

**The most valuable single thing here is the Live ↔ Next comparison on Season.** `SeasonalData` is one global document, so Discord can only render one season; the entire `draft` subsystem exists because editing live fields during a season overlap immediately overwrote what players could still see. A web page can show both at once. Nothing else in the portal is as hard to replace.

**Division of labour, stated once: Discord = glance, portal = depth.** One question and one screenful stays in the bot. Pagers, filters, cross-referencing, bulk operations and exports move here. Before "relocating" anything out of the bot, verify the portal actually carries it.

---

## 2. The foundation — read before adding a page

Five shared files. A new page should add **no** infrastructure; if you are writing chrome, it belongs in `shell.js`.

| File | Holds | Notes |
|---|---|---|
| `assets/tokens.css` | Colours, type scale, layout constants | **One `:root` block, deliberately** — a split block previously defeated the contrast gate |
| `assets/app.css` | Every component and state | Ordered shell → track → manifest → board → drawer → per-realm |
| `assets/timeline.js` | Date engine: `days` `addDays` `fmt` `fmtLong` `make` `ticks` `drag` | Pure; only `drag` touches the DOM |
| `assets/shell.js` | Rail, header, account menu, staging tray, toasts, drawer, confirm, Discord card, **the audit** | Everything cross-realm |
| `assets/fixtures.js` | Fixture data for every realm | Field names mirror the real models **verbatim** |

### What `shell.js` gives you free

```js
Shell.init(realmId)                  // rail + staging tray
Shell.mountHeader(crumb, subCrumb)   // brand, breadcrumb, ⌘K, account menu
Shell.drawer({eyebrow, title, body, actions, wide})
Shell.confirm({title, body, confirm, danger, op, tier, onConfirm})
Shell.toast(msg, actionLabel, onAction)
Shell.discordCard({accent, title, sub, rows, badges, code})
Shell.Store                          // staged ops, sessionStorage-backed
Shell.Store.onInvert(id, fn)         // how to undo a staged op
Shell.audit({states, extra})         // the invariant audit — call once, last
```

**A realm page is therefore: markup + a state object + render functions + one `Shell.audit()` call.** Armory is ~340 lines including comments and was correct on its first run. That is the foundation working — and it only became true after Season had been rebuilt several times.

---

## 3. The invariant audit — every rule, and the bug that earned it

`Shell.audit()` runs on every page, writes `window.__selfCheck`, and logs. **Every rule was earned by a real defect in this session**, and most shipped more than once because the first fix addressed the *instance* rather than the *class*.

| # | Invariant | The bug that earned it |
|---|---|---|
| 1 | **No `<td>` may carry `display:flex`** | It stops the cell stretching to the row height; the row background shows through the gap as a black bar under the text. **Shipped three times** — on `.n`, then on `.det` in the same session as the fix, and the original `td.n{display:flex}` was never removed so the first fix never took |
| 2 | Every cell fills its row | Same defect, checked structurally instead of by naming known offenders |
| 3 | **Hover lifts, never sinks** | A row hover used `--sunk` (#0B0F12, the darkest token) so hovering flashed rows black |
| 4 | **A cursor promises an interaction that exists** | Eleven unclassed elements plus every ruler tick showed `ew-resize`; the scrubber's decorative minis showed `grab`. None were draggable |
| 5 | **Dashed means STAGED** — nothing live may be dashed | Live season deadlines were drawn dashed, which in this language reads "not real yet" |
| 6 | **Every visible interactive element shows a focus ring** | Never checked once until the audit existed. The page was unusable by keyboard and nothing said so |
| 7 | **A legend may only name states present on screen** | The key advertised `conflict` with zero such items, sending the reader hunting for something absent |
| 8 | **No element may claim an unresolved colour** | A data-shape change left `var(--undefined)` everywhere and the whole Track rendered grey |
| 9 | **No rendered text may contain `undefined`, `NaN` or `[object Object]`** | `Shell.drawer()` changed from taking an HTML string to taking an options object, one call site was missed, and the panel rendered "undefined / undefined" **while the audit reported clean** — because the audit had never opened it. The static checks inspect state; none of them can see a broken API contract behind a click |
| 10 | **Nothing rests at opacity 0, and no element with children has zero height** | A staggered entrance animation applied while its parent view was `[hidden]` never started, `fill-mode: both` back-filled the FROM state, and all four Board columns sat at opacity 0 with a clean audit. An element legitimately *passes through* opacity 0 during an entrance — only a **resting** invisible element is a defect, or this fires on every load and gets ignored |

Rules 9 and 10 need the page driven, not just inspected, so **rule 9's panel sweep and the interaction smoke test run only under `?audit=1`** — they open dialogs, and firing that on a page someone is using is its own defect. Rules 1–8 and 10 run on every load.

> **The count is ten, and both numbers in this document must agree.** An earlier draft listed eight here while §14 said ten, which left a reader unable to reconstruct the rule set their new page has to satisfy.

### Four defects the six new pages put back into the shared layer (2026-08-24)

**Every one had already been silently wrong on Season or Armory.** That is the argument for fixing the rule rather than the call site, stated as evidence rather than principle.

| Defect | How it surfaced | The class fix |
|---|---|---|
| **The audit measured geometry BEFORE webfonts loaded** | Broadcast reported five `.nums` cells "short of their row"; a re-run after `document.fonts.status === 'loaded'` was clean. The cells were never short — the fallback font produced a different row height at measure time | `Shell.audit()` now runs immediately *and* re-runs on `document.fonts.ready`, with the second result authoritative. **Deliberately not deferred through `requestAnimationFrame`** — that never fires in a background tab (§14); `document.fonts.ready` resolves regardless of visibility |
| **`.rowmeta` had no `display`** | On the Broadcast manifest the subtitle ran straight into the title and the two read as one mangled string. Every earlier caller happened to wrap it in a flex child that forced its own line | `.mtable .rowmeta{display:block}` — it is a subtitle line everywhere it appears |
| **The tray header promised an interaction it did not have** | Marked up `role="button" aria-expanded` since it was written, with nothing listening. Same class as audit rule 3 | Collapse wired in `shell.js`, remembered in `sessionStorage`, chevron added |
| **The tray covered page content with no way out** | `position:fixed` bottom-right; measured sitting over Broadcast's `+ New announcement`, and the last Manifest rows were unreachable by scrolling | A `:has()`-gated bottom gutter on `main`, plus the collapse above |

> **And one non-defect worth recording, because it cost three tool calls.** The audit also reported "cell short of its row" when run in a **collapsed browser pane** — `window.innerWidth === 0`. A degenerate viewport returns well-formed geometry that means nothing. **Assert `innerWidth` before believing any measurement**; this is the same family as §14's other three traps and it is now four.

## 3.6 Every drag surface has a keyboard path

**Three surfaces in this portal are spatial: Broadcast's priority stack, Season's Board, and Armory's tier board.** All three shipped drag-only, which meant each page's *primary* interaction was unreachable without a pointer. The audit cannot see this — rule 6 checks that a focus ring exists, not that the focused element can do anything.

| Surface | Keys | Moves along |
|---|---|---|
| Broadcast — priority stack | <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd> | Priority order |
| Season — Board | <kbd>Alt</kbd>+<kbd>←</kbd>/<kbd>→</kbd> | `MOVE_TARGETS` = live · upcoming · staged (**`ended` is derived from today and is never a target**) |
| Armory — tier board | <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd> | `TIERS` = S · A · B · unranked |

**The pattern, in the order it has to happen:**

1. **Extract the move out of the drop handler.** All three had the behaviour written *inline inside `drop`*, which is exactly why they were pointer-only: the behaviour existed but had one way in. `moveToTier(id, to, focusAfter)` and `moveToColumn(id, k, focusAfter)` are now called by both paths, so the two can never diverge.
2. **Register the inverse BEFORE `Store.add`.** Two reasons and the second is the real one: `Store.add` warns when an op arrives without an inverse, and a `revertAll()` landing between the two calls skips the op entirely — clearing its record without undoing it.
3. **The inverse must re-render.** Armory's only reassigned `b.categoryRank`, so an undo restored the data and left the chip sitting in the wrong tier — the surface disagreeing with the state it was drawn from. Measured 2026-08-24: rank back to `S` in memory while the board still showed `A`.
4. **Re-focus by ID after the render**, never by holding the node. `renderAll()` replaces the element the handler was attached to, so without this a keyboard user gets exactly one press before focus falls to `<body>`.
5. **Refuse at the ends with a toast** — "Already at the top tier", "Already unranked" — rather than silently doing nothing, which is indistinguishable from broken.
6. **Every hint that names dragging must name the keys too.** A hint offering one way in tells a keyboard user the feature is not for them, even once it works.

> **`Store.add` now warns on both contracts** — a missing `rows[]` and a missing inverse — at the one choke point every staging path already passes through, which is the same reason the tray pulse lives there. It **warns rather than throws**: a missing preview must never block a real edit.

## 3.9 🔴 THE RULE THIS PACKAGE EXISTS TO ENFORCE: design from the system, never from the fixtures

**This is the most important paragraph in the document, and it was learned the expensive way.** On 2026-08-24 the Armory and Analytics pages were rebuilt from scratch because both had been designed against `fixtures.js` — a file written in the same session — instead of against the schemas, the action registries and the live data, all of which were one command away. The result looked finished and was wrong in ways that changed the design, not merely the content.

**Before writing any surface, read these five things. They take minutes and there is no substitute.**

1. **The model.** `models/*.js` — field names, types, and the long comments that explain *why* a field exists. `models/Loadout.js` alone explains why `buildName` and `shareCode` are separate, why `categoryRank` is deliberately not an enum, and why badges propagate across siblings.
2. **The action registry.** `utils/manageActions.js` is the authoritative list of what an admin can *do* to that entity. Loadouts has **ten** actions; the first version of Armory implemented three and named none of the rest, which is why it read as complete while being half a page.
3. **The parser.** `utils/adminParser.js` holds the real vocabularies — `parseLoadoutBadges()` is where `best` / `top{N}` / `meta` / `toxic` / `best-close` come from. An invented vocabulary (S/A/B) cannot round-trip through the bot at all.
4. **The renderer.** `utils/loadoutRender.js` is what Discord actually sends. A preview built from anything else is a drawing of a card, not a preview of one — and it will drift silently.

**Then read the data.** `mongosh "mongodb://localhost:27017/diors-builds-dev"` answers questions no schema can: which optional fields are actually populated (2 of 133 descriptions), what the real distributions look like (123 of 133 builds carry exactly five attachments), and where the edge cases live (one external image URL, one `.png`-suffixed key). **Fixtures should be exported from that, not authored.** The 36 loadouts and every analytics aggregate in `fixtures.js` are real rows.

5. **🔴 THE PORTAL ITSELF — added 2026-08-24, and this rule cost the most to learn.** `portal/api/*.js` and `portal/ui/*.js` are **already built**, and for two realms they were **ahead of this mockup**. `portal/ui/access.js` had a permission grid with a direct-vs-inherited distinction, single-points-of-failure, and typed-Discord-ID confirmation while `access.html` still showed a fictional `editor` role and seven of eleven tokens. `portal/ui/broadcast.js` had a real time axis and the never-expiring-bar treatment while `broadcast.html` was built on a drag-to-reorder priority field that does not exist on the model.
>
> **A stale mockup is worse than a wrong fixture.** A wrong fixture produces a wrong render, which someone notices. A stale mockup is *the specification* — §0.5 and the project memory both say this package is the design source of truth — so wiring it faithfully would have been a deliberate rollback of working design. Read `portal/api/<realm>.js` for the real payload shape and `portal/ui/<realm>.js` (plus its `.logic.js` sibling) for what has already been decided, **before** deciding anything.
>
> ⚠️ **The four-source rule as originally written would not have caught this.** It named the model, the registry, the parser and the renderer — all bot-side — and following it exactly still left the portal's own code unread. That gap is the reason this fifth entry exists rather than a footnote.

> **The test:** if a reviewer opened the bot's source beside your surface, would any label, any vocabulary, or any field shape disagree? If you have not looked, you do not know — and "the fixtures said so" is not an answer, because you wrote the fixtures.

### 3.9.1 The two mechanisms that make this checkable rather than remembered

Prose rules degrade. Both of these are scripts, both live in the package, and both are meant to be run before you believe anything.

**`.export-fixtures.mjs` — fixtures are exported, never typed.** It reads `mongodb://localhost:27017/diors-builds-dev` *and the bot's own registries* (`core/ops`'s `listOpTypes()`, `utils/adminAccess`'s `MANAGE_PAGE_SCOPES`/`ADMIN_COMMANDS`, `portal/api/access.js`'s `buildPermissionMatrix`) and emits the Season/Broadcast/Access block of `fixtures.js` verbatim. Re-run it; do not hand-edit inside the exported block. Everything below that block is *derived* from it, so no fact is stored twice.

```bash
node .export-fixtures.mjs > /tmp/block.js
```

**`.schema-gate.mjs` — nothing may be named that the bot does not have.** Four checks, each proven able to fail:

| Check | Asserts | Caught, first run |
|---|---|---|
| `op-registered` | every `op:'…'` / `type:'…'` is one of the **42** registered types, or one of the 8 documented non-op actions | **31 violations** — including **ten in `armory.html`**, a page declared finished the day before: `loadouts.setRank`, `loadouts.bulkEdit`, `loadouts.setBadges` do not exist at all, and the rest were pluralised (`loadouts.edit` for `loadout.edit`) |
| `scope-real` | every `manage.<page>` token is in `MANAGE_PAGE_SCOPES` | — |
| `field-on-model` | every exported fixture key exists on that model's real Mongoose schema paths | structural, so a *newly* invented field is caught too, not only the four already found |
| `tier-matches` | a stated tier equals `core/ops`'s tier for that op | **3 deletes typed as tier 3** that the registry registers as tier 1 |

```bash
npm run portal:gate                  # from the repo root — runs the gate WITH --self-test
node .schema-gate.mjs --self-test    # from this directory, same thing
```

⚠️ **It is a named script and NOT part of `npm test`, deliberately** (Harkirat's call, 2026-08-24). It reads `fixtures.js` plus `core/ops` and `utils/adminAccess` and needs no database, so it *could* run in CI — but a docs artifact blocking a code merge is the wrong coupling. **That trade has a cost and you are the one paying it:** this repo has already been burned by self-tests that nothing invoked, so **run it before you touch this package and again before you hand it back.**

⚠️ **Run it with `--self-test` at least once per session.** A gate that cannot fail manufactures confidence, which is worse than no gate — see §14.

### 3.9.2 The tier is DERIVED at `Store.add()`, never stated

§4.4 says tiers fall out of reversibility. That makes the tier a property of the **op**, not of the surface staging it — so three surfaces had hand-typed a delete as tier 3 on the intuition that deleting is scary, while `core/ops` registers `loadout.delete` and `draw.delete` as **tier 1**: `apply()` captures the whole document before removing it, so the inverse is exact and the export gate (which exists for changes that cannot be undone) does not apply.

`Store.add()` now reads `FIX.OP_TIERS` — exported straight from the registry — overwrites whatever the page passed, and warns on disagreement. A page may still pass a tier; it is only ever *checked*.

## 3.7 The accessibility contract — measured, not asserted

**Every colour pair in the portal was computed against every surface token.** The design system had claimed a WCAG AA floor since it was written; nobody had ever run the numbers. Three findings, all systemic rather than local:

| Finding | Measurement | Resolution |
|---|---|---|
| **`--ink4` could not carry text anywhere** | 3.02:1 on `--paper`, **2.55:1 on `--hi`** — failing AA in all **112** places it coloured text, on every page including the two already reviewed | Solving for four AA-passing tones proved impossible: raising `--ink4` to the floor collapses it into `--ink3`, and raising `--ink3` to compensate collapses *that* into `--ink2`. **On these surfaces the scale has room for three text tones, not four.** So it has three. `--ink3` lifted to `#85939F` (4.50 on `--hi`, the floor), all 112 text uses migrated, and `--ink4` stays dark under a written contract as a **non-text** token for the 16 places it draws a border, stroke, fill or underline |
| **`--ev` was used as text twice** | 3.28:1 on `--hi` | Given `--ev-ink` `#25A570`, the same `hex`-vs-`bar` split the LANES data already uses for dark bot accents: one value fills, one carries ink, hue and saturation untouched because those *are* the identity |
| **Four tokens had been re-typed as literals** | `#3DDC97`×3, `#07090A`×3, `#1C242A`×2, `#FF8A85` | Replaced with `var(--ok)`, `var(--on-accent)`, `var(--rule3)`, `var(--danger-ink)`. A hex repeated across components is a token nobody reached for, and the next use drifts |

**Result: every text token now clears 4.5:1 on all five surfaces** (`--desk` `--paper` `--raised` `--sunk` `--hi`). `--ev` and `--dsc` remain below it and that is correct — both are *fills* that carry `--on-accent` or white, never text on a surface.

> **The method matters more than the numbers.** I asserted "`--ev` and `--dsc` are fills only" and then checked it — and was wrong about `--ev`, which coloured text in two places. **Grep the claim before writing it down.** An assertion about your own code is exactly as reliable as an assertion about anyone else's.

## 3.8 The responsive contract — and why the audit had never passed at phone width

The portal has a real mobile mode: below 768px `--rail-w` goes to 0 and `nav.rail` becomes a fixed bottom tab bar, 55px tall (above the 44px touch floor). **It had never been opened at that width.** Doing so on 2026-08-24 found three defects:

1. **The audit could not pass at all.** Rule 2 measures every `<td>` against its row height, and a cell hidden by the breakpoint is 0px tall — so every responsive column produced a false "short of its row". Five per page. The rule now skips `display:none` cells. **The audit had been unrunnable at mobile width since the responsive rule was written, and nobody had found out because nobody had run it there.**
2. **Every table page scrolled sideways.** A grid child's default `min-width:auto` meant `main` refused to shrink below `.mtable`'s `min-width:860px`, so the *page* scrolled instead of the table inside `.mscroll`. Fixed with `min-width:0` down the whole chain.
3. **Then the header was still 419px wide in a 390px viewport** — and this is the one worth remembering. Hunting the **widest element** found the table at 873px, which was *clipped and innocent*; the guilty element was narrower than the one I was looking at. **Compare `scrollWidth` up the ancestor chain instead: the culprit is the first ancestor whose `scrollWidth` exceeds its own width.** The breadcrumb now hides below 768px, where the masthead and the tab bar already say which realm you are in.

**Verified after the fixes: all eight pages at 390×844 — zero horizontal overflow, `__selfCheck.ok === true` on every one.**

### Rules the audit cannot check — hold these yourself

- **Every render path that rebuilds nodes must re-attach their handlers.** `renderOverlay()` runs alone during zoom, pan and scrubbing; for a long time only `renderTrack()` re-wired, so **any zoom silently killed every deadline drag, with no error**. Now extracted to `wireOverlay()` and called from all four paths.
- **Generic class names must not be reused.** `.now`, `.left`, `.tbd`, `.k` and `.tk` each caused a live visual bug by colliding with an unrelated component. The newest: Analytics' tile label took `.tk`, which is Season's Track *column* (`flex:1; height:100%`), so an 11px label rendered **72px tall** and pushed every tile's number out of its own box. Two-letter class names are collision bait — this happened **while the rule against it was written down in this very document**. The worst: the Live↔Next diff's value column was `class="now"` — the Track's today-marker (`position:absolute; width:1px; background:gold`) — so it rendered as a glowing hairline pinned left instead of a table column. **Namespace everything.**
- **One rule owns one thing.** An appended `.bcard .actions .go` lost a specificity race to an existing `.bcard .actions button.go`. Edit the existing rule; never escalate specificity against yourself.
- **`requestAnimationFrame` does not fire in a background tab.** Ruler masking and the self-check were both deferred through rAF "to wait for layout" — Chrome suspends it when hidden, so a page opened in a background tab rendered with masking silently absent. `getBoundingClientRect()` forces layout by itself, so the wait bought nothing. **Nothing that decides what the reader sees may depend on the tab being frontmost.**
- **Never invent a visual encoding without labelling it.** The Rack cards briefly showed one abstract tick per build (tall = meta, hatched = flagged). Nothing on screen said so, so it was undecodable — and at 1–4 builds a distribution says less than the count already does. They now list the actual weapon names. **If a reader cannot decode it without a legend, it is decoration.**

---

## 4. The design language

### 4.1 Shape carries state. Colour carries topic.

The most load-bearing rule in the design, and Harkirat's correction to an earlier draft that used colour for state.

| State | Shape | Never |
|---|---|---|
| **Saved / live** | Solid fill, solid border | — |
| **Staged** | Hollow, **dashed** border | Never a colour change alone |
| **Conflict** | **Diagonal hatch**, 45° | Hatch is reserved for conflict, nothing else |

Colour only ever answers *what kind of thing is this*, never *what state is it in*. Shape survives greyscale, colourblindness and a bad monitor.

> **One exemption, and it is narrow: persistent chrome may use colour for state, because chrome has no shape to vary.** The staged counter `#uStaged` turning cyan when non-zero, the `--ok` presence dot, and `.editing-draft`'s dashed-cyan restyle of the whole editor are all deliberate. The distinction that makes this safe: **chrome is a fixed, singular, always-in-the-same-place element that the reader learns once** — there is no second counter to confuse it with, so colour is not being asked to discriminate between items. **Data does have shape to vary, so data never gets this exemption.** If you find yourself wanting to tint a row, a bar, a card or a cell to say *what state it is in*, the answer is no; vary its shape. Note `.editing-draft` is *dashed*-cyan, not merely cyan — it carries the staging shape as well, and that is the pattern to copy if you extend this.

> A corollary that took two rounds: **"neutral" does not mean "invisible."** Making the 2× CP band "not a lane colour" produced `rgba(255,255,255,.035)` on a dark ground and it disappeared. The correction then overshot into a heavy diagonal hatch — which **stole the conflict treatment**. A global span now reads as bounded edges plus a quiet tint, and its *shape* (wide, bracketed) is what separates it from a point-in-time flag.

### 4.2 Colours come from the bot. They are never invented.

A user moves between the bot and the portal constantly; colour is familiarity.

| Surface | Colour | Source |
|---|---|---|
| Draws | Plum Fortune `#6B4E7D` | `commands/draws.js` `PRESET_ACCENT` |
| Calendar | Slate Harbor `#3A5068` | `commands/calendar.js` |
| Draw Prices / CP | CP Emerald `#1F8A5E` | `commands/drawprices.js` |
| Patch Notes | Patch Gold `#F2C230` | `commands/patchnotes.js` |
| Season End | Neon Amber `#F2994A` | `commands/seasonend.js` |
| Timestamp | Cyber Teal `#17A2A2` | `commands/timestamp.js` |
| Loadouts **MP** | `#FF3430` | `manage.js` `PAGE_ACCENT.loadouts_mp`, sampled from `Rank_7Legendary` |
| Loadouts **DMZ** | `#337BA6` | `manage.js` `PAGE_ACCENT.loadouts_dmz`, sampled from `DMZ` |

**Weapon categories** use `utils/loadoutRender.js`'s `MP_CATEGORY_ACCENT` verbatim: AR `#FF3B5C` · SMG `#FFD23F` · LMG `#845EC2` · MARKSMAN `#3DDC97` · SNIPER `#4361EE` · SHOTGUN `#F6A93B` · SECONDARIES `#023047`.

> ⚠️ Three traps, all paid for. **One.** `#023047` and `#3A5068` are too dark to carry text as a filled bar, so `fixtures.js` stores both `hex` (the bot's true value, for identity) and `bar` (lifted, for use as a filled surface). Keep both; do not collapse them. **Two.** Deriving two lanes from one bot hue by lightening produced *two plums and two blues* that read as one family. Each lane now takes a genuinely separate **hue**, still bot-rooted: draws keep Plum, playlists take Cyber Teal, events take Slate pushed to a true blue, returning takes a rose so it reads draw-adjacent without being another violet. Measured minimum hue gap: **31°**.

> **`bar` is derived, not picked.** Take the bot's `hex`, and if it cannot carry `--ink` text at **4.5:1** as a filled surface, raise its lightness in HSL until it does, changing nothing else. Hue and saturation are the identity and must not move — that is the whole reason the two values are stored separately rather than one being "the nicer version" of the other. Only `#023047` and `#3A5068` needed it; anything darker than roughly 35% L will. **The 31° is a floor, not a footnote.** Any new lane or realm accent must sit at least 31° from every existing one in hue, because that is the gap measured on the pair a reader could still just barely tell apart. Check it before adopting a colour, not after. **The three remaining realms were resolved 2026-08-24 without inventing anything — copy the reasoning, not just the outcome.** **Broadcast → Patch Gold `#F2C230`** (`commands/patchnotes.js`): an announcement *is* what a patch note is — a thing the bot says to everyone, unprompted. Same job, same colour. **Analytics → CP Emerald `#1F8A5E`** (`commands/drawprices.js`): emerald is already the bot's numbers colour and Analytics is the numbers realm. **Access → no accent at all**, the one deliberately **achromatic** realm: its subject *is* the other realms, so every colour on the page is borrowed from the scope it governs — each matrix column header carries its own scope's hue while the page chrome stays in the neutral ink scale. That was the alternative to inventing an eighth hue for a page about other people's permissions over other realms, and it turned out better rather than merely cheaper: the grid is legible at a glance *because* each column is the colour of the thing it controls. **The lesson generalises** — when a surface has no bot counterpart, ask what it is *about* before reaching for a colour. **Three.** **Red means MP, blue means DMZ.** An earlier draft used blue for Ranked *and* for Returning draws, contradicting the bot. Ranked Series is MP → red.

### 4.3 Two vocabularies, deliberately separate

An earlier build let a row read `ENDED` under Type and `LIVE` under State at once, because both axes had a value called "live".

- `stateOf()` — the **staging** axis: `SAVED` / `STAGED` / `CONFLICT`
- `lifecycle()` — the **content** axis: `LIVE NOW` / `UPCOMING` / `NOT LIVE` / `ENDED`

**No word means two things.** Do not merge them; do not add a value to one that exists in the other. Related: `NOT LIVE` has two causes — staged against the live season, or belonging to the staged *next* season — so draft items read `NEXT SEASON` instead.

**`NEXT SEASON` is a display substitution for `NOT LIVE`, not a fifth return value.** `lifecycle()` returns exactly four values and anything switching on it must handle exactly four. The substitution happens at render time, where the cause is known.

**What actually makes something `CONFLICT`, stated precisely, because hatch is reserved for it and nothing else may borrow it.** In the mockup, `conflicts(it)` is true when an item's `end` falls **after the last deadline of the season it belongs to** — `T.days(it.end, seasonEnd(...)) < 0`, where `seasonEnd()` is the latest of `bpEnd`/`rankEnd`/`dmzEnd` that is set and not TBD. It is evaluated against the **draft** season for draft items and the live season otherwise, so promoting a draft can legitimately clear or create conflicts. That is the only conflict condition the mockup implements.

> ⚠️ **At wiring time `CONFLICT` gains a second, unrelated cause and you must not let them share a name.** The above is a *content* conflict — an item outlives its season. A live portal also has a *staging* conflict: the underlying record changed after you staged an op against it, so your inverse no longer describes reality. Both are real, both matter, and they need different words and different treatments. See §15.4 — the staging kind is a stale-write hazard, not a scheduling error, and it must never be drawn with the content hatch.

**The Track's `.flags` — "conflicts, overlaps, gaps" — are content-axis findings only.** An overlap or a gap is not `stateOf() === 'CONFLICT'`; they are schedule observations rendered in the same strip because that is where a reader looks for schedule trouble.

### 4.4 Tiers fall out of reversibility

- **Tier 1** — one op applied immediately, inverse captured, inline `saved · undo`.
- **Tier 2** — N ops previewed together, committed in one transaction.
- **Tier 3** — tier 2 plus an export gate and a confirm drawer naming the operation.

**The derivation rule, which this section's title asserts and an earlier draft never actually stated:**

> **The portal writes directly when it can guarantee an exact inverse. It stages when it cannot.** *(2026-08-20 spec §5.)*

That is the whole rule, and it is not a judgement call. Apply it to a new action like this:

1. **Can you record an exact inverse, cheaply, at the moment of the write?** A single-field edit, one record added, a flag toggled — yes. → **Tier 1.**
2. **No, because it spans documents, destroys prior state, or is a bulk import?** Then the inverse must be captured as a deliberate snapshot before the write, which is what staging *is*. → **Tier 2.**
3. **Is it genuinely irreversible or system-altering** — a purge, a promote that rotates live data, an admin grant or revoke? → **Tier 3**: tier 2 plus a typed confirmation naming the real target (never the word DELETE, so muscle memory cannot carry you through) and a **mandatory export of what is about to be destroyed, downloaded before the control unlocks**.

**Two apparent contradictions in this document dissolve under that rule, and both are worth understanding rather than pattern-matching around:**

- **`#dDiscard` is tier 3 and "cannot be undone".** Correct — discarding a draft destroys it, so it takes the highest tier. Tier 3 does not mean "reversible with ceremony"; it means "irreversible enough to deserve a gate."
- **Armory's bulk `Delete` is tier 3 *and* undoable.** Also correct, and this is the point of the export gate rather than a contradiction: the export converts "irreversible" into "reversible, with a file you are holding." The bot can already serialize its own state into a format its bulk parsers re-ingest (`formatDrawsAsBulkText`, `formatCalendarAsBulkText`, `formatLoadoutsAsBulkText`) — the gate wires that to the destructive path.

⚠️ **`Sign out` is described elsewhere in this document as a "tier-1 confirm", and that phrase is wrong.** Tiers classify *data operations*; signing out is not one and has no inverse. It uses the confirm component at its lightest weight. **Do not generalise "tier-N confirm" into a vocabulary** — a confirm has a weight, an op has a tier, and they are not the same axis.

> Reversibility is not invisibility. A tier-1 edit writes live data and the bot re-reads on every interaction, so a mistyped season title is **publicly wrong within seconds** even though undo is one click. That is why the inline confirmation states *what* was saved, not merely that something was.

### 4.5 Two meanings of "discard" — never conflate them

`Shell.Store` holds a **record** of a staged change; clearing the record does not undo the change. This shipped as a real bug — an item created on the Track survived "discard staged changes" because only the record was cleared. Staged ops now register an inverse via `Store.onInvert(id, fn)`, and `Store.revertAll()` runs them. In the real system this is `core/ops/*`'s `invert()`.

---

## 5. Every element on Season and Armory — what it is, what it does, what it wires to

This section is the contract **for the two pages it describes** — Season and Armory. If the live portal differs from what is written here for those two, the live portal is wrong.

For the other realms this section is silent, and that silence is not permission to invent: **Broadcast, Access and Analytics are governed by §9's realm table plus the whole shared layer** (§2 foundation, §4 design language, §10 art direction, §15 contracts). `index.html`, `review.html` and `door.html` are not realms and never appear in the rail, but they are built and specified too — §5.7, §5.8 and §5.9.

### 5.0 The Manifest — one component, six pages, spec'd once

**This section exists because measuring the document found it missing.** On 2026-08-24 a coverage check counted how many of each page's real DOM ids the spec actually names: **Season 14 of 58 · Armory 2 of 24 · Home 0 of 4.** The document was specifying *pages* and never specifying the *repeated components inside them* — so a wiring session would build the Manifest toolbar six separate times from six partial descriptions, and they would drift. What follows is the shared contract; §5.2–§5.9 then state only each page's **deltas** from it.

Every realm page ends in a `.panel` containing a toolbar, a scrolling table, and an optional bulk bar. The markup is identical everywhere; only the columns change.

#### The toolbar (`.mtools`)

| Element | Id | Contract |
|---|---|---|
| Search | `#q` | `type="search"`, always with a visually-hidden `<label class="sr">`. Filters on **lowercased, trimmed** input against a page-defined field set. Never debounced in the mockup — at wiring time debounce the *request*, never the local filter |
| Reset chip | `[data-filter="all"]` | Always the first chip, always `aria-pressed="true"` at rest |
| Topic chips | `.chipset` | **Built from the data, never hand-listed** — Armory from `CATS`, Broadcast from the state list, Access from the roles. A chip that is typed by hand can drift from the lane it filters, which is how they briefly went all-grey |
| Count | `#count` | Reads `N of M`. **M is the unfiltered total** — it is what tells the reader an empty result is a filter and not an empty database |
| Primary action | `.chip.go` | Optional. `+ New announcement`, `+ Grant access` |

#### The table (`.mscroll` > `table.mtable`)

- `table-layout:fixed` with an explicit `<colgroup>`; `min-width:860px` and the horizontal scroll lives on `.mscroll`, **never on the page**.
- `#cbAll` is the select-all: `role="checkbox"`, `aria-checked`, `tabindex="0"`. It toggles **the currently visible rows only**, not the whole dataset — selecting things you cannot see is how bulk deletes go wrong.
- `th.sortable[data-sort]` → click toggles `sorted-asc`/`sorted-desc`; **only one column carries the class at a time**, so the arrow can never appear twice.
- A row click opens that entity's drawer. A click inside `[data-cb]` must `stopPropagation()` or selecting a checkbox also opens the panel.
- `td.n` holds `.ncell` → a topic dot, the name in `<b>`, and `.rowmeta` beneath. **`.rowmeta` is `display:block`** — inline it runs into the title (this shipped on Broadcast).
- 🔴 **No `<td>` may be `display:flex`** (invariant 1) and **exactly one column per table carries `.drop-sm`**, declaring which column that page can afford to lose below 768px. That used to be a positional `nth-child(4)` rule in the shared layer, which hid *Window* on Season and Broadcast — the dates, on two date-driven pages.

#### The bulk bar (`#bulk` > `.bulkbar`)

Hidden at zero selection. Shows the count, the actions, and a Clear. **Every bulk action is tier 2 at minimum** — N writes that must land together are one changeset with one inverse, never N tier-1 ops that have to be undone in the right order.

#### Empty states — three of them, never one

Written per page, never a bare "No results" (§10.6):

- **empty by filter** — "No X matches that. *M* exist in total" + how to clear it.
- **empty by data** — says what the emptiness *means* for players, not just that the list is short.
- **empty by design** — a state that is correct, said so it does not read as broken.

---

### 5.1 Shared chrome — present on every realm page

| Element | Selector | Behaviour | Wires to |
|---|---|---|---|
| Brand button | `#home` `.mk` | Navigates to `index.html`. It is a **button**, not decoration | — |
| Breadcrumb | `.crumb` | `Realm › View`. The second half updates live when the view switches | — |
| Palette affordance | `#palBtn` | Shows `⌘K`; opens the command palette | — |
| Account button | `#whoBtn` | Toggles the account menu; `aria-expanded` tracks state | Discord OAuth session |
| Account avatar | `.uav` | Initial + presence dot. Presence dot is `--ok` when the session is live | — |
| Role badge | `.rolebadge` | `OWNER` / `ADMIN` / `EDITOR` | `utils/adminAccess.js` |
| Discord ID | `.uinfo .id` | Full snowflake in tabular mono | — |
| Staged count | `#uStaged` | **Live** count, recomputed each time the menu opens; turns cyan when non-zero | `Store.all().length` |
| Sign out | `.mi.danger` | Tier-1 confirm that **names how many staged changes will be lost** | `session.revoke` |
| Rail | `nav.rail` | Five realms; `aria-current="page"` on the active one; staged badge | — |
| Staging tray | `aside.tray` | Staged ops with tier badges; **Discard reverts via the inverse registry**; Review & commit → `review.html` | `core/changeset.js` |
| Dialog | `.drawer` | **Centred**, 560px (880px with `wide:true`), scrim behind, eyebrow + title + scrolling body + sticky footer. `side:true` gives the old right-hand sheet, for the rare case where a sheet beside content is right | — |
| Toast | `.toast` | Message plus an optional single action, auto-dismiss at 6s | — |

> ⚠️ The dialog started as a 340px right-hand rail and was rebuilt twice. A tier-3 confirm squeezed into a column at the edge of vision is the wrong shape for a decision that writes live data. **Centred is the default; do not revert it.**

### 5.2 Season — *answers: when, and does it fit*

Track, Board and **Repairs** are switchable views of the same data. The Manifest is always present beneath them, because the views are the picture and the Manifest is the mechanism.

#### 🔴 SIX LANES, AND THREE OF THEM HOLD POINTS — the correction that changed the design

`models/SeasonalData.js` gives a draw **one** field, `date`, and no end at all. Only a `calendar` row has both `date` and `endDate`. So there are six kinds of thing here, not five, and half of them have no duration:

| Lane | Source | Shape | Why |
|---|---|---|---|
| New draws | `newDraws[]` | **point** | a release date, nothing more |
| Returning | `returningDraws[]` | **point** | same |
| Draw windows | `calendar[]` where `category:'draw'` | span | the *only* place a draw's window lives |
| Events | `calendar[]` where `category:'event'` | span | |
| Playlists | `calendar[]` where `category:'playlist'` | span | `--play` had existed unassigned since the first build; a playlist was indistinguishable from an event on every Season surface |
| Patch notes | `patchNotes[]` | **point** | `releaseDate` only |

⚠️ **This deliberately diverges from the shipped `portal/ui/season.js`,** which synthesises `startDate: item.date` for a draw and lets `barGeometry`'s `Math.max(1, …)` floor paint it as a 1%-wide band. A 1% band still reads as a *short duration*, which is the exact misreading. A release is a marker. Divergence from running code is stated here rather than made silently.

#### The link between a draw and its window — the most useful thing this page shows

`commands/calendar.js`'s `getDrawSectionEntries()` merges explicit `category:'draw'` calendar rows with **synthetic** entries for any draw that has none, matched by `utils/search.js`'s `isSameDrawTitle()` — two shared *distinctive* words, not a substring test, because real pairs fail one ("The Widow's Bite Draw" vs "Widow's Bite Draw", both live in the document right now). A synthetic entry is tagged `dateOnly: true`, renders as *"Releases <date>"*, and `isEventEnded()` returns **false for it forever**: it leaves `/calendar` only when a season rollover drops it from the array.

**Measured on the live document: 11 of the 14 draws have no window.** That is not a bug and not a tidy number — it is a decision surface, and it is invisible in Discord.

#### `isOngoing` — a span with no `endDate`, and what it actually means

One live row has it ("Judgment Day - It Goes Two Draw"). `isEventEnded()` resolves such a row against **`bpEnd`**, and treats it as running indefinitely while `bpEndTBD`. Leaving `end` null put a null into every date computation on the page and rendered a literal **"NaN days"** — found by the audit, not by reading the code. An open-ended bar loses its right edge, exactly as Broadcast does for an announcement with no expiry, because a bar that *stops* reads as an end date.

#### Repairs (`#viewRepairs`) — six checks, and why Season did not have one until now

Armory has had a Repairs view since it was rebuilt on real documents. Season did not, and the reason is instructive rather than an oversight: **a set of hand-written draws has no duplicate row, no expiring banner and no draw missing its window**, so there was nothing for such a view to find. Against the live document there are **16 findings**.

| Check | Kind | Live count | What it is |
|---|---|---|---|
| Duplicate calendar rows | mechanical | **1** | "Attack of the Undead MP Mode" appears twice with identical dates; `/calendar` renders both |
| Banner on an expiring Discord link | mechanical | **2** | a `media.discordapp.net` URL is *signed* and 404s once its `ex=` parameter passes. `utils/calendarBannerCache.js` exists to re-host these; two of three never went through it |
| Runs past the battle pass | mechanical | **2** | measured against `bpEnd`, not the latest deadline |
| Draw window with no draw | mechanical | 0 | an orphan explicit row. Reports zero and **can** fire — rename any draw and its window orphans immediately |
| Draw served synthetic | judgement | **11** | see above |
| Looks like 2× CP, not flagged | judgement | 0 | requires **both** a CP token and a doubling indicator. Five "COD Point Rush" rows carry a CP token and no doubling word — reporting zero here is the rule, corrected twice live on 2026-08-22, *working* |

⚠️ **A check that reports zero stays on screen with its reason.** A panel that only shows problems cannot tell you what it is watching.

#### Masthead
`answers: when, and does it fit` · the season title as H1 · four stats: **days left** (to the *last* deadline), **live now**, **staged**, **flags**.

#### Season identity — collapsed by default
| Element | Behaviour | Wires to |
|---|---|---|
| `.idsum` summary strip | Title, each deadline with days-left, and whether a draft is staged. Click or Enter expands | read-only projection |
| `#idClose` **Done ▲** | Collapses. Exists because the summary strip *is* the toggle and is `display:none` when open — the editor was a one-way door that survived a reload | — |
| `#lnsw` Live / Next | Swaps the editor between `SeasonalData` and `SeasonalData.draft` | — |
| `.editing-draft` | Whole editor restyles dashed-cyan with a banner. **Without it the switch reads as a dead button**, because the two seasons share most of their strings | — |
| `#f-title` | `currentSeasonTitle` | `season.setTitlesDeadlines` (t1) |
| `.dline` ×3 | Track label · title · date · DATE/TBD · live days-left | `bpLine` / `rankLine` / `dmzLine` |
| `.tbdsw` | Two-option segment. **Three states exist** — unset, a date, "known to be undecided" — which a checkbox cannot express | `*EndTBD` |
| `.dl-left` | `N days left` / `ended N ago` / `TBD` / `not set` | derived |
| `.ban` ×3 | One banner URL per `/calendar` page. **Blank is a real value meaning "show nothing"** | `drawsBannerUrl` · `eventsBannerUrl` · `playlistsBannerUrl` |
| `.draftbar` | Appears when `draft.active`: Compare · Discard · Promote to live | — |
| `#dDiff` Compare | Renders **only changed fields**, so an identical draft is visibly empty | — |
| `#dPromote` | Tier-3 confirm naming the op, showing the diff, undo after | `season.promoteDraft` |
| `#dDiscard` | Tier-3 confirm, **explicitly cannot be undone** | `season.discardDraft` |
| `#mkDraft` | Appears when no draft: seeds a draft from the live season | `season.setDraftTitlesDeadlines` |

#### Track
| Element | Behaviour | Notes |
|---|---|---|
| `.scrub` | Overview spanning **the data**, dimmed outside the window | The caption is a gutter label, outside the draggable strip |
| `.smask` ×2 | Dim what is outside the window | Dim the outside, never tint the selection |
| `.winbox` + `.wh` ×2 | Drag the middle to pan, the 11px grips to resize | Grips clamp against each other at `MIN_SPAN` |
| `#ruler` | Drag to pan · ⌘/ctrl-wheel zooms at cursor · horizontal wheel pans | Tick spacing derives from **pixels**, not day thresholds |
| `#ruler span` | **Clickable** — opens "what runs on this day" | — |
| `#deadrail` | Rail between ruler and lanes holding everything that applies to **every lane** | — |
| `.dflag` ×3 | Deadline label + date. Drag to move, click to edit. Stacks when flags collide | `season.setTitlesDeadlines` |
| `.dend` ×3 | The vertical line. **Solid** (live), `pointer-events:none` — the flag is the target | — |
| `.dspan` | 2× CP on the same rail, in **CP Emerald** because it is a CP-pricing condition | `calendar.isDoubleCP` |
| `.win` | The band marking the span across all lanes: bounded edges, quiet tint, **never hatched** | — |
| `.lane` ×5 (+ draft lanes) | New draws · Returning · Events · Playlists · Patch notes | `overflow:hidden` — it is the viewport for its lane |
| `.bar` | Drag to move, edges to resize, click to open, live date readout | date fields |
| `.bar .bl` | Label; nudges into view when clipped, cut edge marked `.clipped-l` | — |
| `.pt` | Patch notes render as diamonds — a point in time, not a span | — |
| `.ghost` | Hover an empty lane → preview at that date; click creates. **Suppressed over an item** | `*.add` |
| `#xhair` | Crosshair reporting the **exact date** under the pointer, or the item's real window over a bar | The answer to "when does this actually start?" |
| `.now` | Today. One thin line and a chip — **context, not the subject** | — |
| `.flags` | Conflicts, overlaps, gaps; each with a one-click fix | — |
| `.zoomer` | `−` `+` `FIT` and a live span readout; `+` `−` `0` and arrows on the keyboard | `FIT` frames the data |

#### Board
Columns are **content state**: `Live now · Upcoming · Staged · Ended`.

> ⚠️ **`Staged` is a deliberate, single, documented exception to §4.3, and it is the only one.** It is a `stateOf()` value sitting in a row of `lifecycle()` values. It earns its place because the Board's columns *are* dates — a card's column determines its dates when you drag it — and **a staged item has no agreed dates yet, so it has no content lifecycle to sort into.** The alternative was showing staged cards in whichever column their unsaved dates implied, which asserts a schedule the season does not have. If you extend the Board, do not read this as licence to mix the axes further; it is one column, for items that are genuinely outside the content axis until they commit.
 The whole header is the collapse control. Collapsed → labelled rail with the count upright. **All four collapsing is refused**, and **Expand all** guarantees a way back. Cards drag between columns, which **moves the item's dates**, because the columns *are* dates.

#### Manifest
`.mtable` with a `colgroup` — checkbox · Item · Type · Window · Span · Detail · State. Live search · topic chips **coloured by lane** · staged-only · sortable · select-all · bulk bar · inline rename. Hovering a row lights its bar and vice versa (`link()`), because the two are one instrument.

### 5.3 Armory — *answers: what exists, and what is wrong with it*

> 🔴 **REBUILT 2026-08-24, and the reason matters more than the result.** The first version of this page was designed from `fixtures.js` — a file this same session had invented — rather than from `models/Loadout.js`, `utils/manageActions.js`, `utils/adminParser.js`, `utils/loadoutRender.js` and the 133 real documents sitting in the dev database. Harkirat's description was exact: *"a skeleton with makeup, when it should be an entire embodiment of the system."* Three things were not merely thin, they were **wrong**, and each one changed the design:
>
> | Invented | Actually |
> |---|---|
> | `attachments` rendered as a **count** (“5”) | An **array of names** — `Monolithic Suppressor`, `MIP Extended Light Barrel`, `No Stock`… A count tells an admin nothing they can act on |
> | A tier board of **S / A / B / Unranked** | `categoryRank` is `best` / `top3` / `top4` / `top5` / `null`, validated by `parseLoadoutBadges()`. S/A/B exists nowhere in the bot |
> | `buildName` labelled “Gunsmith code” | `buildName` is a human variant label (`Build 1`, `Aggressive Flex`). The real code is `shareCode`, a **separate field** |
>
> **The lesson, stated so it generalises:** fixtures are a convenience for rendering, never a source of truth for design. When the real schema, the real action registry and the real data are all one command away, designing from a guess is a choice.

#### What the collection actually contains (measured, not estimated)

133 loadouts — **125 MP, 8 DMZ**. MP by category: AR 35 · SMG 26 · SNIPER 19 · MARKSMAN 14 · LMG 12 · SHOTGUN 10 · SECONDARIES 9. 34 meta · 10 toxic · **123 carry a `shareCode`** · only **2 carry a `description`** · **0 carry `attachmentSlots`** · 123 have exactly 5 attachments, the rest run 1, 4, 6, 7, 8, 9 · one `imageKey` is a full external URL, the rest are bare Cloudinary keys and some carry a `.png` suffix. `fixtures.js` holds **36 of these documents verbatim**, chosen to span every one of those edge cases.

#### The four views

| View | What it is |
|---|---|
| **Tier board** | The real rank vocabulary, one row per tier, drag or <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd>. Rank is **per category** — “Best” means best AR, and the bot renders it `BEST ASSAULT`. **DMZ never uses it**: those builds carry `dmzRangeRank`, which also encodes a combat range (`best-close`, `best-midlong`) |
| **Repairs** | Eight checks, every one a real property of the real schema. **Mechanical** defects have one derivable answer and can be bulk-fixed; the rest need a person. `noslots` is marked `collection:true` — it is true of 133 of 133 rows, so counting it per build flags everything and the number stops meaning anything |
| **Compare** | Two builds, field by field, differing rows lit, with both real Discord cards beneath |
| **Bulk & export** | The half of `/manage` the first version silently dropped |

#### The build editor — every field in the document, not a summary of it

| Surface | Contract |
|---|---|
| **Image** | Live preview at the real delivery URL (`buildImageUrl()`'s own `f_auto,q_auto` base), the `imageKey` field, **Use convention** (`WEAPON-N`, caps, spaces→hyphens), **Open asset** straight to Cloudinary, and **Remove**. An `onerror` swaps in a failure state naming the key, because a broken key and a missing key are different problems |
| **Attachments** | The **array**, editable — add, remove, per-slot label. The footer states whether this count is the usual 5 and that `attachmentSlots` is only ever filled by `/autobuild`'s vision pass |
| **Identity** | `weaponName`, `buildName` (labelled *a variant label, not a code*), `category`, `mode`, and `weaponKey` shown **read-only** so the derivation convention is visible rather than folklore |
| **Gunsmith code** | `shareCode` with a copy button. **Disabled for DMZ** — that Gunsmith screen exposes no code, so the bot omits the whole section rather than showing `buildName` as if it were one |
| **Badges** | `isMeta` · `isToxic` · `categoryRank` (MP) or `dmzRangeRank` (DMZ), with the token set the parser accepts. 🔴 **Editing one propagates to every build sharing the weapon and mode** — the note says so *before* you commit, and the staged op records it as a row |
| **Preview** | A component-for-component mirror of `buildLoadoutCardBody()`. Change anything and the card changes with it |
| **Delete** | Tier 3, and the copy states whether this is the weapon's **only** build — in which case it vanishes from `/gunsmiths` entirely |

### 5.4 Broadcast — *answers: what is showing, in what order, until when*

**Accent Patch Gold `#F2C230`** for the chrome — but **each announcement wears its own stored `color`**, and that is not decoration. `utils/announcement.js`'s `generateAccentColor()` runs **once at creation and never again on edit**, so the colour is identity: it is the only thing telling two announcements apart in a single delivered message. The shape/colour rule holds — colour carries *which announcement*, shape still carries live / scheduled / expired.

#### 🔴 FOUR INVENTED FIELDS, and each one changed what the page claimed

`models/Announcement.js` has **six** fields: `text`, `createdAt`, `createdBy`, `expiresAt`, `color`, `startsAt`. The first build of this page added four more:

| Invented | Reality |
|---|---|
| `title` + `body` | There is **one** content field. `buildAnnouncementEmbed` sets `description` and `color` and nothing else — the generic header was **removed** on 2026-08-13 at Harkirat's direct correction, and a heading is markdown typed into the text. The split re-introduced the thing he had deleted. |
| `pinned` | No such field. |
| a drag-to-reorder **priority** | **The page's primary interaction was a field that does not exist.** Delivery order is `createdAt` ascending; `portal/ui/broadcast.js` states outright that adding an ordering column is a schema change to file rather than assume. |
| `views: 12840` | There is no view counter anywhere. **Fabricated telemetry is the worst kind of fixture error, because it is indistinguishable from data.** |

**Reach is real or it is absent.** The only record of delivery is `UserPreference.seenAnnouncementIds`. Measured 2026-08-24: 21 preference documents, one with a non-empty seen list, and **every announcement's count is 0** — so the page shows reach only where it is non-zero rather than printing a column of zeroes that teaches nothing. Replacing a fake metric with a second fake metric is not a fix.

#### What replaced the fake priority — the real portal-only capabilities

- **`startsAt`.** Schema-declared and settable since 2026-08-21, and **no Discord surface has ever rendered it.** A scheduled announcement is indistinguishable from a live one everywhere else.
- **No expiry.** `expiresAt: null` means forever. The Airtime bar loses its **right edge** rather than stopping, because a bar that stops reads as an end date. The callout names the specific offender and its day count — *"this one has been up 19 days"* teaches something; *"announcements can stay up forever"* does not.
- **The 10-embed cap.** `MAX_EMBEDS_PER_MESSAGE`, oldest unseen first, the rest waiting for that player's next command. Invisible in Discord; drawn here as a line through the queue.

#### The expiry field is not a date, and reproducing that is not pedantry

`computeExpiresAt()` understands **blank** (the 60-day default), **`never`/`none`**, or **a whole number of days** — and returns `undefined` for anything else, which callers must treat as a validation error rather than silently defaulting, *"or a typo silently means something the admin didn't type."* `core/ops/announcements.js`'s own header records that an earlier draft of its **own test** assumed an absolute date and would have rejected every valid post. `startsAt` **is** an absolute admin date, because "starts on" reads as a calendar day where "expires in" does not.

#### Delivery queue (`#viewQueue`)
Two columns: the live set in delivery order on the left, the real per-announcement Discord preview pinned right. Position is labelled **delivery order** and the copy says why it is not editable.

| Element | What it is | Wires to |
|---|---|---|
| `.nstack` | The announcements a player currently gets, **in priority order** — index 1 is what they see first | read of `announcements` sorted by `priority` |
| `.nscard` | One announcement. Draggable by pointer. `.p0` tints its number in the accent (this is the one that actually shows). `.staged` = dashed. Carries `data-live="1"` when saved, so audit rule 5 can police it | — |
| drag → drop | Reorders priority. Stages **`announcements.reorder`, tier 1**, with an inverse that restores the whole previous order — not just the moved card | `announcements.reorder` |
| `.nscard` click / Enter | Opens the editor drawer | see below |
| `.nspin` | "Pinned" badge, shown only when `pinned` | `announcements.setPinned` |
| `.nschan` | Which surface it appears on — `On /start`, `Above output`, `Calendar top` | `channel` |
| `.nprev` | `Shell.discordCard()` render of the top-priority announcement. **Sticky.** It is the bot's own card shape, so it is a preview and not an approximation | `buildAnnouncementCard()` |

> **Why priority is the whole realm.** A Discord bot posts in time order and has no spatial arrangement — "this one first" is not expressible. Dragging a card is the capability, and everything else on the page exists to make that decision informed.

> 🔴 **The reorder has a keyboard path and it is not optional.** Focus a card and press <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd>. It shipped drag-only, which made the page's *primary* interaction unreachable without a pointer — the audit checks that focus rings exist and cannot check that a focused element can do anything. The handler re-focuses the card by id after the re-render, so repeated presses keep working; without that the element it was attached to is gone and focus falls to `<body>` after one press. **Season's Board and Armory's tier board have the same gap and it is still open** — see §15.11.

**Airtime bars are draggable**, and that is a language decision rather than a feature: a horizontal bar on a date axis means *draggable* on Season's Track, so shipping the same shape as click-only here would make one mark mean two things in one product. Dragging moves the whole window (`posted` and `until` together) and stages `announcements.edit` with both dates in `rows`. ⚠️ `T.drag`'s `pxPerDay` is **called** inside the helper, so it must be passed as a *function* — passing `pxPerDay()` throws on the first pointermove, and nothing in the audit would have caught it.

#### Airtime (`#viewAir`)
Every announcement window on one horizontal axis, `2026-07-15 → 2026-09-15`, with `.atnow` marking today.

| Element | What it is | Notes |
|---|---|---|
| `.atbar` | One announcement's window. Solid = live, dashed = staged, outlined = ended | Click opens the editor |
| `.atgap` | **A stretch where a player sees nothing at all.** Hatched in warn, labelled `Nd dark` | Computed by `gaps()` — sort windows, walk a cursor, record every hole |
| `.atruler` | Five month ticks | — |

> **The gap is the finding this view exists for**, and it is *invisible* in a chronological list because an absence has no row. This is the clearest example in the whole portal of a view earning its place: the same data, sorted the same way, in a table tells you nothing about coverage.

#### Editor drawer (tier 1)
Title · body · channel · shows-from · shows-until · pin, with a **live Discord preview that updates as you type** (`#ePrev`). Saving stages `announcements.edit` with `rows` naming only the fields that actually changed. `Delete…` escalates to the tier-3 confirm. **Bulk**: pin/unpin stage as one tier-2 changeset; delete is tier 3.

---

### 5.5 Access — *answers: who can do what, and who is in here now*

**No accent — the achromatic realm.** See §4.2: every colour here is borrowed from the realm the scope governs, because inventing an eighth accent would put a colour on screen that means nothing anywhere else in the product.

#### 🔴 TWO ROLES, ELEVEN TOKENS, AND PERMISSION CHANGES DO NOT STAGE

Four corrections, all the same class — a name written confidently that exists nowhere in the system:

| Was | Reality |
|---|---|
| roles `owner` / `admin` / **`editor`** | **There is no `editor`.** Two roles: the hardcoded owner (`utils/owner.js`) and a Mongo-granted admin. It was not *unenforced*, it was **fictional** — and the deferred-list entry calling it "visible but unenforced" invited a future session to build it. |
| seven page scopes | `MANAGE_PAGE_SCOPES` has **eight**, and the missing one was **`season`** — the pseudo-page that exists precisely because *"editing what's LIVE right now and staging what's NEXT are different blast radii."* Dropping it erased the most interesting distinction in the model. |
| no command tokens at all | `ADMIN_COMMANDS` is `manage` / `autobuild` / `bot`. A real dev admin holds `["manage","bot"]` — **the page meant to show admins could not represent one.** |
| every grant **staged into the tray** | `portal/api/access.js`: admin grants and revokes are *"NOT part of the core operation algebra"* — direct `AdminUser` writes. The only safeguard is **typing the target's own Discord ID**, and the export half of the tier-3 gate is meaningless here because there is no data to export. The page's own copy about session revokes — *"a security action that waits in a tray is not a security action"* — is the argument, applied inconsistently. |

**Direct vs inherited is the entire reason a grid beats the string it replaces.** A bare `manage` lights all eight page columns — but you did not hand those pages over one at a time, and revoking `manage` takes all eight back at once. **Shape carries it, not brightness**: a direct grant is a filled square, an inherited one a hollow ring. Reading "paler = inherited" needs both cells side by side; the ring reads alone.

**One bad token rejects the whole submission.** `parsePermissionsInput` returns `null` if any token is unrecognised, on the stated reasoning that *a partial grant from a typo is worse than an error*. Reproduced, not softened. `all` is an input-only convenience expanding to the three commands. A permissions array is never allowed to be empty.

**Access is owner-only, and not by policy.** It has **no grantable token at any scope**: `portal/api/realmAccess.js` pushes `'access'` onto the visible realms only `if (owner)`, and every route is wrapped in `ownerOnly()`.

**A 60-second cache sits between a grant and its effect.** `utils/adminAccess.js` caches the allowlist for a minute; `invalidateAdminCache()` is called on every write, so in practice the change lands on their next click — but a write that forgets it is up to a minute late, and that belongs in the copy rather than in a comment.

#### Sessions — a browser, not a Discord account
`models/PortalSession.js` stores `sessionHash` (the cookie holds the raw value; a database leak must not hand anyone a working session), `discordId`, `lastSeenAt`, `userAgent`, `revokedAt`. **No IP is stored anywhere** — an earlier build had an `ip` column and a `current` flag, and neither field exists. "Signed in now" is *derived* from `lastSeenAt` inside 15 minutes, because a browser session has no logout event unless somebody clicks one. **Live export: zero rows** — so the empty state is the real state and had to be designed, not assumed away.

#### By admin (`#viewGrid`) — the grid
Every admin × all eleven tokens, commands and `/manage` pages in visually separated blocks. **This is the capability Discord physically cannot offer**: `/manage` shows one admin's permissions in one ephemeral reply, so answering *"who can touch draws?"* means opening it once per admin and holding the answers in your head.

#### By scope (`#viewScope`) — the inverse
Each token with its holders, derived from the *same* grants so the two views cannot disagree. Two findings live only here: a scope held by **exactly one** non-owner (a single point of failure — **6** on the live data, including the bare `manage` token itself), and a scope held by **nobody** but the owner (`autobuild`).

⚠️ **The page READS `F.spof`; it does not re-derive it.** An earlier build reproduced `singlePointsOfFailure()`'s blind spot deliberately — that function used to expand a bare `manage` into the eight page scopes without ever recording a holder for `manage` itself, so a lone holder of the full token went unreported. **That defect was then fixed** (§14.5), the export picked the fix up, and the page's hand-written copy of the old rule kept saying 5 while `F.spof` and `index.html` both said 6. Two surfaces of one package answering the same question differently is exactly what the fix existed to end. There is now one definition, in the export, and every surface reads it.

| Element | What it is | Wires to |
|---|---|---|
| `.mxgrp th` | Two group headers — **Commands** and **/manage pages** — over the eleven columns. The split is the model's, not a layout choice: three `ADMIN_COMMANDS` and eight `MANAGE_PAGE_SCOPES` | `utils/adminAccess.js` |
| `.mx thead .mxs.mxcol` | Scope column header. `i` is a 3px bar in that scope's borrowed topic colour; `em.mxn2` carries the live holder count; `.spof` rings it when exactly one non-owner holds it | `F.SCOPE_META[key]` |
| `.mxcell` | One grant, `role="img"` — **not interactive**. Filled square = **direct**, hollow ring = **inherited** from a bare `manage`, empty = not held | `F.accessAdmins[i].grants[key]` |
| `.mxcell.locked` | The owner row. Every scope, permanently, by short-circuit before the allowlist is read | `utils/owner.js` |
| `.ownerrow` | The owner, rendered as a row rather than described in prose, so the grid is complete | — |
| `button.chip[data-edit]` | Opens the permissions drawer for that admin | `access.grant` — a **direct write** |
| `.mxfoot` legend | What a filled square means versus a ring, and the `+ Grant access` entry point | — |

> 🔴 **THE GRID IS READ-ONLY, AND THAT IS THE DESIGN.** An earlier build made every cell a toggle that STAGED into the tray. `portal/api/access.js` is explicit that admin grants and revokes are *"NOT part of the core operation algebra"* — they are direct `AdminUser` writes whose only gate is typing the target's own Discord ID, because the export half of the tier-3 model has no meaning for a permission change. So there is no cell op, no tier, no tray and no undo: **the typed confirmation is the gate**, and the grid's job is to show you what you are about to change, not to be the control that changes it.

#### Grant, edit and revoke

One drawer does all three, because they are one write: `findOneAndUpdate` with `upsert`. The form carries the token field, a chip grid that reflects it both ways, an optional label, and a confirm field that must equal the target id exactly.

| Control | What it does |
|---|---|
| `#gPerm` + `.tokgrid` | The comma-separated token string and its chips stay in sync in both directions. A chip lights `.inh` when a bare `manage` would cover it, so you can see inheritance before you commit it |
| `#gConf` | Must equal the Discord ID being granted or revoked. `portal/api/access.js`'s `confirmMatchesTarget` |
| `#gHint` | Reads the token string back in words, or names the exact bad token |

> ⚠️ **ONE BAD TOKEN REJECTS THE WHOLE SUBMISSION**, reproduced rather than softened. `parsePermissionsInput` returns `null` on any unrecognised token, on the stated reasoning that *a partial grant from a typo is worse than an error*. `all` is input-only and expands to the three commands. A permissions array is never allowed to be empty.

#### Signed in (`#viewSess`)
Live **portal** sessions (12h TTL on a Mongo index), not Discord ones. `models/PortalSession.js` stores `sessionHash`, `discordId`, `lastSeenAt`, `userAgent`, `revokedAt` — **no IP**, and no "is this me" flag. `.sess.stale` dims a session not seen in 15 minutes, which is derived rather than stored because a browser session has no logout event unless somebody clicks one.

> 🔴 **Ending a session is NOT a data operation and has no tier.** It takes effect immediately and never stages, because a security action that waits in a tray is not a security action. See §4.4 on why "tier-N confirm" must not become a vocabulary.

⚠️ **There is no Manifest on this page.** The grid *is* the roster — a second table listing the same admins would be the "one interaction repeated" thinness the grid was built to end. The one list that would have been a Manifest is the session list, and it is short enough to be a panel.

---

### 5.6 Analytics — *answers: what happened*

> 🔴 **REBUILT 2026-08-24, same cause as Armory.** The first version invented six commands and one flat “usage” number. The bot has a real observability layer — `models/AnalyticsEvent.js`, `AlertLog.js`, `ChangeLog.js`, `SearchTerm.js`, `BootRecord.js`, `AnalyticsRollup.js` — and **every dimension it records was missing from the page**. Numbers below are aggregated from the dev database: **496 events · 998 alerts · 303 boots · 26 rollups · 22 changes · 1 search term**.

#### The dimensions the schema actually records

| Field | Values | Why the page must show it |
|---|---|---|
| `outcome` | **six** — `ok` · `error` · `expired` · `blocked_by_policy` · `swallowed_by_cooldown` · `rejected_admin` | Only two have ever occurred. **The four that have not are the finding**: nothing has been blocked by policy, swallowed by a cooldown, expired, or rejected for lack of admin |
| `entry` | **seven** — `slash` · `button` · `select` · `autocomplete` · `modal` · `synthetic` · `background` | `background` is the **largest** at 320 of 496. This is a bot that does most of its work with nobody typing anything |
| `context` + `installType` | `guild`/`dm`, `guild`/`user`/null | **DMs are more than half of all use.** That is the strongest single argument for the portal existing |
| `isAdmin` | boolean | 136 of 496 events are the system watching itself. **Excluded from product stats by default**, with a toggle — a self-observing system that counts its own admin traffic reports a product ~27% busier than it is |
| `ackMs` vs `durationMs` | two clocks | Ack has a **hard 3-second Discord deadline**; duration is what the user feels, and only matters once deferred. Averaging them into one “latency” hides which one is at risk |
| `deps[]` | `[{name, ms, calls, ok}]` | Atlas answers in **52ms across 437 calls**; `webp_nameplate` is a **3.55-second** outlier on one. The database is not the cost — image work is |
| `SearchTerm.zeroResults` | count | The only signal in the entire system that names something the bot **does not have** |

#### The five views

| View | Answers |
|---|---|
| **Health** | Is it up, what does it cost, what broke. Dependency waterfall, the three alert levels with their ping counts, and the last `BootRecord` in full — version, commit, guilds, emoji sync, Mongo and Cloudinary status |
| **Usage** | Per command **and subcommand**, bars stacked ok/failed, with the entry-point and outcome splits beside them. All six outcomes are listed even at zero, because an absent failure mode is information |
| **Timing** | The two clocks, side by side, drawn against the **real 3-second deadline** rather than an invented target. The deadline is marked on the duration axis so “must defer first” is visible rather than asserted |
| **Reach** | Context and install type. This is how you find out whether the v3 guild-install work landed, and Discord will never tell you |
| **Search** | What people typed and did not find. One row exists: someone typed `ad` into `/manage`'s action field and got nothing — either a missing alias or a missing feature, and invisible everywhere else |

**The river** carries alerts, changes and deploys in one stream. A `ChangeLog` row is the only kind that offers **Undo**, because it is the only one carrying an inverse — and the copy says the undo is *staged as its own change* rather than editing the record, since an audit trail you can edit is not one.

> ⚠️ **Analytics remains the one realm where the view layer and the Manifest show different entities** — metrics above, events below. Still correct, still not to be "fixed".

### 5.7 Home (`index.html`) — *answers: what needs you*

**Not a realm.** No rail — the rail is the in-realm switcher, and repeating it on the page whose entire job is choosing a realm would say the same thing twice.

| Element | What it is |
|---|---|
| `.hmast` | Display-size masthead stating the portal's thesis: Discord answers one question in one screenful; this answers the ones needing a whole picture |
| `.hcard` ×5 | One per realm. Icon + name in the realm's colour, the question it answers, its live count, and **the one thing in it that currently wants a person** |
| `.hcard .att` | The attention line — computed, never decorative: `N outlive the season` (Season), `N need repair` (Armory), `N gaps in coverage` (Broadcast), `N signed in` (Access), `N alerts` (Analytics). **Staged work outranks it**: a realm with staged changes shows `N staged` in `--staged` instead |
| `.hres` | The resume bar — staged count, which realms, and both actions (Discard all / Review & commit) inline |

> **Why the attention line matters.** A home screen that only counts rows makes you open all five realms to find out whether anything is wrong. Every number here is derived from the same predicates the realm pages use, so Home cannot disagree with the page it links to.

---

### 5.8 Review (`review.html`) — *answers: exactly what is about to change, before it does*

**The commit screen the staging tray points at, and the page carrying the most of the safety model.** No rail item, and **no floating tray** — here the page *is* the tray, expanded.

| Element | What it is | Contract |
|---|---|---|
| `.rvlist` | Every staged op, in stage order. `.rvt` shows `T1/T2/T3`; `.rvop.t3` tints it. A per-op status line reads `needs attention` / `export required` / `export saved` | `Store.all()` |
| `.rvdet` | The selected op: its name, its `core/ops/*` operation verbatim, and the diff | — |
| `.rvgrid` | **Field · Was · Becomes.** `.rvwas` struck through, `.rvnow` in `--ok`; `.rvr.del` turns *becomes* to `--danger-ink` for a destruction | `op.rows` |
| `.rvcon` | **The staging conflict.** Appears when `op.stale` — the record moved underneath the staged op, so its captured inverse no longer describes reality. Offers *Keep mine, overwrite theirs* and *Drop my change* | §15.4 |
| `.rvexp` | The **tier-3 export gate**. States why the export exists (it converts irreversible into reversible-with-a-file) and stays closed until taken. Flips to `.rvexp.done` | `formatDrawsAsBulkText` and friends |
| `.rvconf` | The typed confirmation — **the actual target's name, never the word DELETE**, so muscle memory cannot carry you through | — |
| `.rvgate` | Says **why** the commit is closed, one blocker at a time, and turns `--ok` with `Ready — N changes in one transaction` when it opens | `blockers()` |
| `#commit` | Raises the final confirm, then commits. Disabled only while `blockers()` is non-empty | `changeset.commit` |

**`.rvdrop` — the × on each op** removes that one change from the changeset and **reverts it**, rather than merely forgetting it (§4.5). Without it you could stage four things and then only commit all four or none, which is a receipt rather than a review screen. Dropping also clears that op's export and conflict-resolution state, so re-staging it starts clean.

> 🔴 **`blockers()` is the single source for both the footer gate and the masthead `gates open` stat.** They were briefly computed separately and the stat contradicted the footer once the typed confirmation opened the gate — two places telling the reader different things about one piece of state.

**Empty state.** Names what empty *means* ("everything in the portal matches what the bot is serving"), links to two realms, and offers **Load a sample changeset** — seeded on request and never automatically, because a mockup that invented staged work would teach the wrong thing about what staging means.

---

### 5.9 Door (`door.html`) — *the only surface a signed-out person can reach*

No rail, no tray, no realm — it must not imply the app is already open behind it. A single centred card: the Discord OAuth button in Discord's own brand `--dsc`, and three notes that state the security posture in plain words — **being signed in is not being allowed** (every request re-checks server-side), a session is 12 hours and lives in this browser only (so signing out discards staged work), and Dioreo reads only the Discord user ID.

`?denied=1` renders `.dfail`: *signing in worked; you simply have no permissions here* — which is the accurate and much less alarming reading of that failure.

---

## 5.99 DATA CONTRACTS — the shape every realm reads, field by field

**Added 2026-08-24 because the document was 107KB of prose with four code blocks in it.** Every sentence above has to be *translated* into code by whoever wires this, and each translation is a chance to drift — which is precisely how the earlier attempt drifted. What follows is the part that does not need translating. Match these shapes and the page renders; change one and something breaks visibly rather than silently.

### 5.99.1 The staged-op record — the single most important shape in the package

```js
/** One entry in Shell.Store. Every realm produces these; review.html consumes them. */
const op = {
  id:      'arm-edit-6a4c69…',   // STABLE + DETERMINISTIC. Store.add() dedupes on it, so
                                 //   re-staging the same logical change must produce the same id.
  tier:    1,                    // 1 | 2 | 3 — derived, never assigned. See §4.4.
  name:    'LOCUS — Build 1',    // the subject, as a person would say it
  verb:    '3 fields changed',   // past tense, what happened to it
  realm:   'armory',             // rail id — Home attributes staged work by this
  op:      'loadouts.edit',      // the core/ops/* operation, shown verbatim on the review screen
  rows: [                        // THE FIELD-LEVEL DIFF. Review renders exactly this.
    ['categoryRank', 'best', 'top3'],          // [field, was, becomes]
    ['attachments',  'A, B, C', 'A, B, D']     // stringify arrays; never pass the array itself
  ],
  destroys: true,                // OPTIONAL. Tints the "becomes" column red; implies tier 3.
  exported: false,               // OPTIONAL. Set true once a tier-3 export gate is satisfied.
  stale:    false                // OPTIONAL. Set at REVIEW time, never at stage time — §15.4.
};
Shell.Store.onInvert(op.id, () => { /* restore + re-render */ });   // BEFORE add(), always
Shell.Store.add(op);
```

🔴 **Three rules that are not negotiable, each earned by a real defect.** The inverse is registered **before** `add()` — a `revertAll()` landing between them skips the op and clears its record without undoing it. The inverse **re-renders** — Armory's only reassigned a field, so an undo restored the data and left the card in the wrong tier. And `rows` is **always populated** — an op without it renders as *"(no field-level preview captured)"*, which defeats the screen whose whole job is showing what changes. `Store.add()` warns on the last two.

### 5.99.2 What each realm reads

| Realm | Reads | Real source | Notes that change the code |
|---|---|---|---|
| **Season** | `SeasonalData` — one global doc | `models/SeasonalData.js`, `portal/api/season.js` | `bpEnd`/`rankEnd`/`dmzEnd` are `Date`, each with a **separate `*TBD` boolean that nulls the date**. There is **no season-start field** — the Track derives its window from the data. `draft` mirrors the live fields minus `patchNotes`. 🔴 **A draw has `date` and NO end**; a calendar row has `date` + `endDate` + `isOngoing`. Tiers are lowercase words (`mythic·legendary·legacy·epic`) plus **`comment`, which is not a tier** but a free-text note rendered as Discord subtext. `isDoubleCP` (not `is2XCP`). Patch-note display is always `titleOverride \|\| title` |
| **Armory** | `Loadout[]` | `models/Loadout.js` | `attachments` is `[String]`; `attachmentSlots` is a **parallel array** only `/autobuild` fills. `categoryRank` ∈ `best·top3·top4·top5·null` (MP only); `dmzRangeRank` ∈ `best-close·best-midlong·top{N}·top{N}-close·top{N}-midlong` (DMZ only). `imageKey` is a Cloudinary key **or** a full URL. **Badges propagate across `weaponKey`+`mode`** |
| **Broadcast** | `Announcement[]` | `models/Announcement.js`, `portal/api/broadcast.js` | 🔴 **Six fields, and one of them is the whole content**: `text`. No title, no body, no pin, no view count. `expiresAt: null` means forever; `startsAt: null` means immediately. `state` is computed **server-side** by `announcementState()` and must agree with `getActiveAnnouncements()` — a second, laxer definition of "live" is the bug, reproduced on 2026-08-23. Expiry INPUT is blank / `never` / a whole number of days, **never an absolute date**. Reach, if shown, comes only from `UserPreference.seenAnnouncementIds` |
| **Access** | `AdminUser[]` + `PortalSession[]` | `models/AdminUser.js`, `models/PortalSession.js`, `portal/api/access.js` | 🔴 **Eleven tokens**: 3 `ADMIN_COMMANDS` + 8 `MANAGE_PAGE_SCOPES` (including the `season` pseudo-page). **Two roles**, no `editor`. `permissions` is never empty. Grants and revokes are **direct writes, not ops** — typed-Discord-ID confirmation, no export leg, no staging. `grantedAt` **is** stored. `PortalSession` holds no IP; "signed in now" is derived from `lastSeenAt` inside 15 minutes. `invalidateAdminCache()` after every write, or the 60s TTL delays it |
| **Analytics** | `AnalyticsEvent` · `AlertLog` · `ChangeLog` · `SearchTerm` · `BootRecord` · `AnalyticsRollup` | six models | **Read `AnalyticsRollup` for anything spanning days** — `AnalyticsEvent` is a grow-forever collection on a 512MB free tier with exactly ONE index (`{createdAt:-1, command:1}`). A query that cannot use that prefix collection-scans |
| **Review** | `Shell.Store` + a live re-read | `core/ops/*` | The re-read at review time is what sets `stale` — §15.4 |

### 5.99.3 The predicates, in code

```js
/* Season — the CONTENT conflict. An item outliving the season it belongs to. */
const seasonEnd = o => {
  const ends = ['bpEnd','rankEnd','dmzEnd']
    .filter(k => !o[k + 'TBD'] && o[k]).map(k => o[k]).sort();
  return ends.length ? ends[ends.length - 1] : null;      // latest SET, non-TBD deadline
};
const conflicts = it => {
  const e = seasonEnd(it.draft ? state.draft : state.season);
  return !!e && daysBetween(it.end, e) < 0;
};

/* The two vocabularies. They never share a value — §4.3. */
const stateOf   = x => x.state === 'staged' ? 'STAGED' : conflicts(x) ? 'CONFLICT' : 'SAVED';
const lifecycle = x => x.state === 'staged' ? 'NOT LIVE'
                     : x.start > TODAY      ? 'UPCOMING'
                     : x.end   < TODAY      ? 'ENDED' : 'LIVE NOW';

/* Armory — rank is per MODE, and the two fields are mutually exclusive by schema. */
const rankOf = b => b.mode === 'DMZ'
  ? (b.dmzRangeRank ? b.dmzRangeRank.split('-')[0] : null)   // 'best-close' → 'best'
  : (b.categoryRank || null);
```

### 5.99.4 Definition of done, per realm

*There is no visual-diff harness (§15.10), so "done" needs to be a list rather than a feeling.*

| Realm | Wired correctly when |
|---|---|
| **Season** | Editing a deadline writes a real `Date` through `parseAdminDate` (**never `new Date(str)`** — §15.6) · TBD sets the boolean AND nulls the date · promoting a draft moves every mirrored field and clears `draft.active` · a dragged bar's new dates survive a reload · the Track's conflict hatch appears only for items past the **latest set** deadline |
| **Armory** | MP and DMZ are separate surfaces, never a filter · a badge edit propagates to every build sharing `weaponKey`+`mode` · a DMZ build shows **no** Gunsmith code anywhere · the image preview URL equals `buildImageUrl()`'s output exactly · an export re-imports through `parseBulkLoadouts` with zero diff |
| **Broadcast** | Reordering writes priority for **every** affected row, not just the moved one · a gap in Airtime matches what a player actually sees · the preview equals the announcement render |
| **Access** | Every scope key exists in `manageActions.js` · revoking calls `invalidateAdminCache()` · **the server re-checks permissions on every request regardless of what the client sent** (§15.5) · session revoke takes effect immediately and never stages |
| **Analytics** | Multi-day figures come from `AnalyticsRollup`, not a scan · admin traffic is excluded by default · ack and duration stay two separate numbers · no raw Discord id ever reaches the page (`userHash` only) |
| **Review** | A changeset commits in ONE transaction or not at all · a stale op is detected by re-reading at review time · a tier-3 export downloads before the gate opens · a dropped op is **reverted**, not forgotten |

### 5.99.5 Symptom → cause

*The traps in §3 and §7 are organised by when they were found. This is the same knowledge indexed by what you would actually see.*

| You see | It is |
|---|---|
| A black bar under a table row's text | A `<td>` with `display:flex` — the cell stops stretching to the row height. Shipped **three times** |
| A label rendering far taller than its font size | A **class collision**. `.tk` (tile key) hit Season's Track column `.tk` (`flex:1;height:100%`). Also burned: `.now` `.left` `.tbd` `.k` `.ed` |
| A white button or a white input | A UA default leaking through. A bare `.btn` gets Chrome's `ButtonFace`; `input[type=text]` **does not match** an `<input>` with no explicit type |
| An undo that restores data but leaves the UI wrong | An inverse that reassigns a field without re-rendering |
| A subtitle running into the title above it | `.rowmeta` without `display:block` |
| A control that stretches to the full row width | A flex item that wrapped onto a line of its own. Season's EDIT chip became a 410px slab this way |
| Equal-height columns with one nearly empty | A grid where a **row** layout was meant. Five tiers as columns forced 822px on a tier holding two builds |
| A panel stretched to a tall empty box | A block nested inside a container that is itself a grid — `.repbar` inside `.cov` became a grid item and stretched to 1058px |
| The audit reporting geometry failures that are not real | A **degenerate viewport** (`innerWidth === 0`), a **backgrounded tab** (`document.timeline` frozen), **pre-webfont** measurement, or a **cached asset**. All four are documented in §14 — check before believing any of them |
| A count that disagrees with the list beneath it | A numerator scoped one way and a denominator scoped another. Armory's repair meters read `27/36` where `27/31` was true |

---

## 6. Wiring guide — the order to do it in

1. **`utils/owner.js` first.** `utils/adminAccess.js` is not reusable as it stands: measured 2026-08-20, it pulls **39 local files plus discord.js, jimp and child_process**, because `isOwner()` does `require('../commands/manage')` to read `ALLOWED_ADMIN_ID`. Extract that constant into a leaf module importing nothing, repoint `adminAccess.js`, `handlers/router.js` and `scripts/botAccessPermissions.test.js`. ⚠️ **`docs/legal/PRIVACY.md`'s verification table names `commands/manage.js` as where the admin guard lives — update it in the same change or the published policy becomes false.**
2. **Swap `fixtures.js` for real reads.** Field names already match the models verbatim: this is a swap, not a rename pass.
3. **Route every mutation through `core/ops/*`.** Never write Mongo from the portal directly. The ops already carry `validate` / `preview` / `apply` / `invert`.
4. **Wire the staging tray to `core/changeset.js`**, replacing `Store.onInvert` with the ops' real `invert()`.
5. **Replace preview cards with the bot's own render functions.** `buildLoadoutCard()` returns plain Components V2 JSON and imports no discord.js, so the browser can render exactly what Discord will send. A preview that can drift is worse than none; this one structurally cannot.

> ⚠️ **`utils/manageActions.js` has the same 39-file closure and step 1 does not fix it.** Its `require()`s are all lazy, so *loading* it is cheap and its table is readable — but a static closure scan cannot tell lazy from eager, so `scripts/ownerModule.test.js`'s technique must never be pointed at it and expected to pass. The portal reads its **table** and never calls its `run`.
>
> ⚠️ **The bot barely caches domain data.** `draws.js`, `calendar.js` and `patchnotes.js` each call `SeasonalData.findOne({docType:'global'}).lean()` **fresh on every interaction**; loadouts read fresh too. A portal write is visible immediately — worst case 60s for a permission change (`adminAccess` TTL), and `invalidateAdminCache()` collapses that to ~0. **There is no sync mechanism to build. v1 needs zero bot-side runtime changes beyond step 1.**

---

## 7. Traps already paid for — do not re-derive these

### Measurement
- **A measurement can measure the wrong thing precisely.** An alignment probe compared the **top edges** of a 9px dot and a 26px input, which can never match under `align-items:center`; it reported a bug that did not exist. Compare centres.
- **`getBoundingClientRect()` returns the unclipped box.** It cannot tell you whether something is visually clipped.
- **Delta-optimised GIFs.** Extracting frames without `-coalesce` gives changed-pixel rectangles, not images. This was misread as visual corruption and produced a completely wrong diagnosis. Coalesce → measure per-frame change to find the event windows → review **consecutive** frames.
- **A screen recording contains the cursor halo.** It is not a UI element.
- **The browser may be running code you are not looking at.** `python3 -m http.server` sends no cache headers and Chrome served a stale `fixtures.js` through three "verified" claims. Verify against the **live page**, not the source.

### Naming and selectors
- **🔴 A SELF-DESTROYING SELECTOR.** `document.querySelector('#lnsw .pip.draft').className = 'pip ' + (…)` queried by a class and then **renamed that very class**. With a draft staged it left the class in place and worked forever; against the live document (`draft.active === false`) it worked exactly once and threw `Cannot set properties of null` on every render after. **Query by what a thing IS — a `data-` hook — never by the state you are about to overwrite.**
- **`window.frames` is a read-only built-in, and `id="frames"` does not shadow it.** An audit harness sat on "running…" forever because `frames.appendChild(f)` threw. Same class as the `.now` / `.left` / `.tbd` / `.k` / `.tk` / `.ed` CSS collisions: a name that already means something else. Check globals as well as classes.
- **An HTML entity assigned to `textContent` renders as literal characters.** `&middot;` appeared on screen as `&middot;`. Invisible to every geometric audit rule, because a stray entity is well-formed text.
- **A harness that reads the wrong key reports "failed, no detail".** The audit sets `{ok, problems}`; the harness read `sc.failures`, which is always `undefined`. **A tool that fails without a reason is worse than one that crashes** — it invites a re-run instead of a look.

### State and geometry
- **One owner per invariant.** Three code paths built `st.view` with different clamping, and `T.make().clamp()` only ever *shifts* a window — never shrinks one — so dragging a scrubber grip marched the view start backward a month per frame into the previous year. `setView()` now owns it; never construct `st.view` directly.
- **Gesture responses must be proportional and capped.** Pinch-zoom applied a fixed factor per wheel event; a trackpad gesture fires tens of them, so one pinch compounded `1.09³⁰ ≈ 13×`.
- **Never hijack plain scroll.** A bare wheel over the Track used to zoom; on a trackpad that *is* scrolling, so the page zoomed with no way back. Zoom needs a deliberate modifier.
- **Density rules must derive from pixels.** Ruler tick spacing from fixed day thresholds produced ~28 overlapping labels.
- **A container that positions children must clip them**, or bars paint over the lane-name gutter.

### Process
- **A scripted multi-edit that asserts before writing is atomic.** One failed assert discards the whole batch. Twice a fix was reported as done when the write never happened.
- **Fixing the instance instead of the class** is how `display:flex` on a `<td>` shipped three times.
- **An API change must update every call site in the same edit.** `Shell.drawer()` went from taking an HTML string to an options object; one call site was missed and rendered `undefined / undefined` — while the audit reported clean, because the audit had never opened it.
- **An audit must not act on a page someone is using.** The interaction smoke test drove Promote on every load, leaving the user staring at a tier-3 confirm. It is now gated behind `?audit=1` and restores scroll and drawer state.

---

## 8. The journey — what changed, and why, in order

Recorded because the *sequence* explains decisions that look arbitrary in isolation.

1. **Colour was used for state.** Corrected to shape-for-state, colour-for-topic. Shape survives greyscale and colourblindness.
2. **Board columns were Draft/Staged/Blocked/Ready** — a pipeline this project does not have. Replaced with content state.
3. **The Season page had no way to edit the season.** The identity editor was added, then rebuilt against the real schema when it turned out `setTitlesDeadlines` takes three parallel lines.
4. **The Track was a picture of a timeline.** Rebuilt on a real date engine.
5. **Prose lived inside the mockup.** Moved here.
6. **The vocabulary collided** — a row read `ENDED` and `LIVE` at once. Split into two named axes.
7. **The state class drifted between JS and CSS** and the whole Track went grey. Produced the first self-check.
8. **The scrubber ran away** — found by coalescing a screen recording and measuring per-frame change.
9. **FIT framed a month of empty space**, then the fix reintroduced the emptiness in the overview. Corrected by separating the FIT range from the pan range.
10. **Deadline flags were afterthoughts.** Given their own rail.
11. **Colours were invented.** Replaced with the bot's own palette, then spread across genuinely separate hues.
12. **Armory was a filter and a table.** Rebuilt as a tier board, a repair queue, and a comparison view.
13. **The audit was static-only** and reported clean while a panel rendered `undefined`. Extended to scan rendered text and drive interactions.
14. **The dialog was a side rail.** Made a centred modal.

---

## 9. The realm roster

*Every surface below is built and audits clean as of 2026-08-24. This section was the not-built list; it is now the roster, and §5 carries each page's element-level contract.* **Five realms appear in the rail** — Season, Armory, Broadcast, Access, Analytics. `index.html` (home), `review.html` (commit) and `door.html` (sign-in) are deliberately **not** realms and must never be added to `REALMS`.

| Realm | View layer | Manifest | Answers |
|---|---|---|---|
| **Broadcast** | Now showing · Airtime | Every announcement | *What is showing, in what order, until when* |
| **Access** | By admin · By scope | Admins and live sessions | *Who can do what — and who is in here now* |
| **Analytics** | Health · Usage · Timing | One filterable event river | *What happened* |

> ⚠️ **Analytics is a genuine exception and pretending otherwise would be worse than naming it.** In Season, Armory, Broadcast and Access the view layer and the Manifest show **the same entities** — a picture of the thing, over the list of the thing. In Analytics they do not: the view layer shows *metrics*, the Manifest shows *events*. That is right for the realm, but the layering there is shared chrome rather than the same promise. **Do not "fix" it by forcing Analytics into the other shape.**

### The test every new surface must pass
**Could Discord do this?** If yes, it does not belong in the portal. Every capability here was checked against that: the tier board (no drag, no spatial arrangement, 40-component ceiling), the repair queue (no diff before a bulk replace), Compare (no side-by-side), the Live↔Next diff (one global document), the crosshair (no hover). If a proposed feature fails that test, it is a prettier `/manage`, and the whole point was that this is not one.

> ⚠️ **Apply the test to the CAPABILITY, never to the individual control** — read literally it excludes things this portal already ships and should. `#f-title` edits the season title, and `/manage` edits the season title too; both Manifests are lists, and Discord renders lists. The capability those controls belong to is *editing the whole season identity as one coherent object, against a live-vs-next diff, in one screen* — which Discord cannot do. §1's framing is the usable form of the same rule: **Discord = glance, portal = depth.** One question and one screenful stays in the bot; pagers, filters, cross-referencing, bulk operations and exports come here. If §9 and §1 seem to disagree about a proposed feature, §1 governs and §9 was being read at the wrong granularity.

---

## 10. Art direction — the specification

> This section was written **before** the implementation it describes, deliberately, so the doc leads the work rather than trailing it. It exists because a self-audit on 2026-08-24 concluded the portal was *functionally rich and visually anonymous*: strip the logo and it could be any admin dashboard. Everything below is the remedy, and all of it lives in the **shared layer** so unbuilt pages are born with it.

### 10.1 The problem, stated precisely

| Missing | Evidence at audit time |
|---|---|
| Typographic personality | Everything 11–15px. H1 at 24px — a heading, not a statement. No scale contrast anywhere |
| Motion design | Only `.13s` colour fades. Track↔Board is an instant swap. Nothing has weight or origin |
| Composition | One centred column of equal-weight stacked panels. The Track — the reason the page exists — competes with two chrome panels |
| A signature | No element is unmistakably *this* product. The subject is Call of Duty Mobile and none of its vocabulary appears beyond borrowed hex values |
| Edge-state craft | "Nothing matches these filters." — the cheapest place to show care, and nothing was spent there |

### 10.2 Type scale

A dashboard fails typographically when every size is within 4px of every other size. The scale below has **real jumps**, and each step has one job.

| Token | Size | Used for |
|---|---|---|
| `--t-display` | 44px | The realm's subject — the season title, the weapon being compared. One per page, at most |
| `--t-figure` | 34px | The single number that matters — days left, builds, flags |
| `--t-h1` | 22px | Panel titles and dialog titles |
| `--t-body` | 13.5px | Prose and table content |
| `--t-label` | 11px | Field labels, card captions |
| `--t-micro` | 9.5px | Eyebrows, meta, monospace annotation |

Rules: **tracking tightens as size grows** (`-0.02em` at display, `0` at body, `+0.1em` at micro) · every numeral is `tabular-nums` · the eyebrow above a display line is always micro, uppercase, and coloured `--patch`.

### 10.3 Motion

Motion earns its place by explaining *where something came from*. Three moments are choreographed; everything else stays a colour fade.

| Moment | Behaviour | Why |
|---|---|---|
| **View switch** (Track↔Board, Rack↔Repairs↔Compare) | Outgoing fades and lifts 6px; incoming fades in from 6px below, 180ms, staggered 20ms per lane/column | It is *the same data reorganising*, not two different screens |
| **Staging a change** | The item pulses once and the tray's count ticks with a scale bump | The tray is easy to miss; the change should visibly *go somewhere* |
| **Tier-board drop** | The chip settles with a short spring; the row flashes its accent | Weight. A drag with no landing feels broken |

Tokens: `--ease` `cubic-bezier(.2,.8,.3,1)` · `--dur-1` 130ms (state) · `--dur-2` 180ms (transition) · `--dur-3` 320ms (entrance). **All of it is disabled under `prefers-reduced-motion`,** which is already wired.

### 10.4 Composition

**The view layer is the hero.** On every realm the sequence is:

1. **Masthead** — eyebrow, display-size subject, figure-size stats. Generous, quiet, no border.
2. **Context strip** — a slim bar, never a panel. On Season this is the identity summary; on Armory the category selector. It must not look like it competes with what follows.
3. **The view layer** — the Track, the tier board, the airtime chart. Given the most vertical space and the strongest border treatment.
4. **The Manifest** — visually recessive: no accent border, quieter header, so it reads as the mechanism beneath the picture.

The failure this replaces: three panels of identical weight where nothing said which mattered.

### 10.5 The signature

**The crosshair.** A timeline you read by hovering — it names the exact date under the pointer and the item's real window when over a bar. It already exists and is the one element here that nothing else in this category does. It gets pushed further: the date follows along the ruler, the hovered lane lifts, and the readout is typeset rather than merely present.

The supporting signature is the **tier board**, because it is the one surface that speaks the audience's own language. S is treated as a podium, not as the first row of a list.

### 10.6 Edge states

Every empty, loading and error state names **what is missing, why, and the one action that fixes it.** No bare "No results."

| State | Shape |
|---|---|
| Empty by filter | *"No builds match Assault + missing image."* + `Clear filters` |
| Empty by data | *"Nothing in this category yet."* + `Add the first build` |
| Empty by design | *"Every build in view carries a rank."* — a success, and it should read as one |
| Loading | Skeleton in the shape of the content, never a spinner |
| Error | What failed, what it means, what to do |

---

## 11. Self-audit, 2026-08-24 — process findings

Recorded because the *pattern* is more useful to a future session than any single defect.

| Failure mode | Measured occurrences |
|---|---|
| **Fixed the instance, not the class** | `display:flex` on a `<td>` shipped **3×**; generic class-name collisions caused **4** separate visual bugs (`.now`, `.left`, `.tbd`, `.tier`) |
| **Claimed verification not performed** | "Audit clean" while a panel rendered `undefined`; "FIT fixed" when the write never reached disk; "colours fixed" while the browser ran a cached file |
| **Answered the symptom, not the question** | Asked *why* 2×CP had a full-height overlay → restyled it instead of examining the reasoning. Asked about colours → changed hex values before reading what the bot uses |
| **Regression inside the QA tool** | The interaction audit drove a tier-3 confirm on every page load — a checker that damaged the page it checked |

**The single transferable lesson:** every one of these came from verifying *the thing I changed* rather than *the property I claimed*. The audit exists to convert that instinct into code, and it only works if it is run on the live page after every shared-layer change — not at the end.

---

## 12. Art direction — as built, verified 2026-08-24

§10 was the specification, written before the work. This section records what shipped and how it was checked, so a future session can tell intent from outcome.

### 12.1 Type — measured on the live page

> **§10 is the specification and governs new work; §12 is the measurement and governs nothing.** Where they differ, build to §10 and treat the delta as a defect to close, not as a licence. The two known deltas: `--t-micro` is specified at 9.5px and renders at 9px, and `--t-label` (11px, control labels and column headers) is absent from the as-built table below because it was never separately measured, not because it was dropped.


| Token | Spec | Built | Where |
|---|---|---|---|
| `--t-display` | 44px | **44px**, tracking `-1.23px` | `.masthead h1` |
| `--t-figure` | 34px | **34px**, tabular | `.mh-stats .v` |
| `--t-h1` | 22px | 22px | `.ph .t`, `.dw-h h2` |
| `--t-body` | 13.5px | 13.5px | table + prose |
| `--t-micro` | 9.5px | 9px rendered | eyebrows, labels |

**Display-to-body ratio is now 3.26×**, up from roughly 1.8×. That single number is the difference between "a dashboard where everything is the same size" and a page with a subject.

The masthead stat is set **`column-reverse`**: the label sits above the number, so the eye lands on the figure. `19` and `DAYS LEFT` are no longer competing at similar weights.

### 12.2 Composition — the view layer is the hero

Three levels of frame, and the audit checks they stay distinct:

| Level | Treatment | Verified |
|---|---|---|
| Masthead | No border, 34px top padding | — |
| Context strip | Slim bar, never a panel | — |
| **View layer** | `--rule2` border — the strongest | `rgb(58,71,82)` |
| Manifest | `--rule` border, transparent header — recessive | `rgb(42,52,61)` |

The rule that makes it survive: `.panel + .panel` is *automatically* recessive. A new page cannot get this wrong by forgetting, because the second panel on any page inherits the quieter treatment by position.

### 12.3 Motion — three moments, and nothing else

| Moment | Implementation | Lives in |
|---|---|---|
| **View switch** | `viewIn` — fade + 6px rise, `--dur-2`, staggered 20ms per column/row | `app.css`, keyed on `[hidden]` |
| **Staging** | `Shell.pulseTray()` — tray pulses, count bumps | **`Store.add()`**, the one choke point every staging path already passes through |
| **Tier drop** | `settle` spring on the chip + `flash` on the row it landed in | `armory.html` drop handler |

Putting the staging acknowledgement inside `Store.add` rather than at each call site is the same principle as the audit: **one place, so it cannot be forgotten by a caller.** Every future page gets it for free.

All three are disabled under `prefers-reduced-motion`.

### 12.4 Edge states — as built

The Armory manifest now distinguishes three empty cases, and says which one it is:

- **Empty by filter** — *"No builds match this combination. `Assault + missing image` returns nothing. Every other build is still there."* + `Clear filters`. The reassurance matters: a filtered empty list is how someone concludes their data is gone.
- **Empty by data** — *"The Armory is empty. Add the first build and it will appear here and in `/gunsmiths` immediately."* + `Add the first build`.
- **Empty by design** — *"Every build in view carries a rank."* This is a **success**, and it is styled as one (`.estate.good`, green).

### 12.5 What is still outstanding from §10

Stated plainly rather than quietly dropped:

- **§10.5 the signature** — the crosshair exists and works, but has not yet been pushed further (date following along the ruler, hovered lane lifting, the readout typeset rather than merely present).
- **§10.4 Track as hero** — the composition hierarchy landed, but the Track panel has not been given full-bleed treatment.
- **Loading skeletons** — specified, not built. There is no async state in a fixture-driven mockup, so this only becomes real at wiring time. **When you add loading, use a skeleton in the shape of the content, never a spinner.**

---

## 13. Where the work stands

**All eight surfaces are built and audit clean at two viewports** — verified 2026-08-24 at **1280×880** and **390×844**: `__selfCheck.ok === true` on every page at both, zero horizontal overflow at both, no console errors. Every text token clears WCAG AA 4.5:1 on all five surface tokens, computed rather than eyeballed.

> ⚠️ **An earlier version of this line said "verified at a 1280px viewport" and meant it as reassurance.** One viewport is not a verification — opening the same eight pages at 390px found that the audit could not pass at all at that width, on any page, and never had. If you extend this package, run both.

| Page | State |
|---|---|
| `season.html` | **Complete.** Identity editor with the draft subsystem, Track, Board, Manifest, crosshair, palette |
| `armory.html` | **Complete.** Tier board, repair queue, Compare, Manifest, build editor |
| `broadcast.html` | **Complete.** Priority stack with drag-to-reorder + live Discord preview, Airtime with gap detection, editor, bulk pin/delete |
| `access.html` | **Complete.** Scope matrix, live sessions, admin roster, grant/revoke |
| `analytics.html` | **Complete.** Health tiles, usage bars, 24-hour timing chart, filterable event river |
| `index.html` | **Complete.** Realm chooser with per-realm attention lines and the staged-work resume bar |
| `review.html` | **Complete.** Changeset list, field-level diff, staging-conflict resolution, tier-3 export gate, typed confirmation, atomic commit |
| `door.html` | **Complete.** Discord OAuth sign-in with the security posture stated in plain words |

> ⚠️ **"Built" here means the MOCKUP is built.** `portal/ui/**` is a separate, earlier implementation — see §0.5. Bringing it to match these is the wiring job, and nothing in this table says anything about how far along that is.

**The foundation is why the last six went fast.** `shell.js` carries the rail, header, account menu, dialog, confirm, toast, Discord card, staging store, inverse registry, staging acknowledgement, the tray (now collapsible) and the audit. `app.css` carries the type scale, composition hierarchy, motion, edge states and every component. A new page is markup + a state object + render functions + one `Shell.audit()` call.

**What the six added back INTO the shared layer**, because a page that needs chrome means the chrome was incomplete: the audit's webfont gate (§3), the tray collapse control, the tray gutter, and `.mtable .rowmeta{display:block}`. All four were **class fixes applied in `shell.js`/`app.css`, never patched at the call site** — each one had already been silently wrong on Season or Armory too.

---

## 14. What `__selfCheck.ok === true` does NOT mean

Stated separately because reading it as "the page works" caused a false report twice in the session that built this.

It means: **ten static invariants hold, and the registered panels open without rendering garbage.** It does not mean:

- **That anything is visible.** An element can be present, correctly coloured, free of `undefined`, and completely invisible. The audit gained a visibility invariant for exactly this — but see the trap below, because visibility itself is hard to measure.
- **That a click produced its side effect.** The interaction pass opens panels; it does not assert that staging staged, that a drag moved a date, or that an undo undid.
- **That the layout is right.** Nothing checks overlap, alignment or hierarchy. Those need eyes or a targeted geometric probe.

### ⚠️ The measurement trap that produced three false conclusions

**A backgrounded tab has a stopped animation timeline.** Measured directly: `document.visibilityState === 'hidden'` and `document.timeline.currentTime === 0`, with every animation reporting `playState: 'running', currentTime: 0` forever. So **any measurement of an animated property in a non-fronted tab is meaningless** — entrance animations sit at their `from` state permanently, and an element mid-entrance reads as `opacity: 0` no matter how long you wait.

This is the third instance of one family in a single session, and they are worth naming together because the next one will look different again:

| Instance | The stopped clock |
|---|---|
| `requestAnimationFrame` never fires in a background tab | ruler masking and the self-check silently never ran |
| Chrome served a **cached** `fixtures.js` while disk had new bytes | three "verified" claims measured old code |
| `document.timeline` frozen at 0 in a background tab | animated opacity read as 0; a Board bug was "found" that did not exist |

**The rule:** before concluding anything from a measurement of *time-dependent or animated* state, assert the tab is actually rendering — `document.visibilityState`, `document.timeline.currentTime`, or simply take a screenshot, which forces a paint. A screenshot proved the Board renders correctly while `getComputedStyle` insisted every column was invisible.

### The hardening that came out of it anyway

Even though the reported bug was an artefact, the pattern it exposed was real and was fixed: **invisibility was the resting state of several elements.** `.lane` and `.rise` carried a static `opacity:0` and relied on an animation to reveal them, which means any stalled timeline leaves content permanently invisible. Those now use `animation-fill-mode: backwards`, which gives the identical entrance while the **resting** state stays visible. `rg "opacity:0;animation" assets/app.css` returns nothing — keep it that way.

---

## 14.5 Two defects found in SHIPPED portal code, and fixed test-first

Rebuilding Access against the real permission model made the mockup and the endpoint disagree out loud, which is how both of these surfaced. Both were fixed in `portal/api/access.js` with a failing test written first (`scripts/portalRealms.test.js`, 5 new cases, RED confirmed before GREEN).

**1. `grantedAt` was derived from the ObjectId while the field was sitting right there.** `buildPermissionMatrix()` carried a comment asserting `models/AdminUser.js` "has discordId/permissions/grantedBy/note and no timestamp at all". It has declared `grantedAt: { type: Date, default: Date.now }` since **566b3ca (2026-08-13)** — ten days before that file was last touched — and every live document carries one. The derivation discarded a real value *and* answered a different question: an ObjectId's embedded timestamp is the **document's** creation and never moves when permissions are later edited. The ObjectId path is now a fallback for pre-field documents, with a test pinning each branch.

**2. A bare `manage` held by one person could never be reported as a single point of failure.** `singlePointsOfFailure()` expanded `manage` into the eight page scopes inside an `else if`, so it never recorded a holder for `manage` **itself** — the token sat permanently at zero holders and therefore never qualified. That is the *most* consequential single point there is: lose that person and every page goes at once. Both effects now apply.

⚠️ **The mockup deliberately reproduced defect 2 before it was fixed**, because a specification that quietly disagrees with the endpoint it specifies is worse than one that matches a flaw. Once the endpoint was fixed, the mockup's hand-written copy of the old rule was left behind and the package reported **6** on Home and **5** on Access for one commit — caught by a code review, and closed by deleting the copy: Access now reads the exported `F.spof` instead of re-deriving it.

## 15. The contracts this mockup cannot express

A fixture-driven mockup has no server, no clock, no second user and no failure. Everything in this section is therefore **invisible in the mockup and mandatory in the portal**. A cold reader of an earlier draft listed most of it as "missing" — it was not missing, it was elsewhere and unsignposted. Each item below says where the decision lives and whether it is closed or genuinely open.

### 15.1 The `Shell` API, in full — these are called on every page and were previously given as bare names

| Call | Signature | Notes |
|---|---|---|
| `Shell.init(realmId)` | `realmId` matches an `id` in `REALMS` | Builds the rail, marks the current realm, wires the account menu |
| `Shell.mountHeader(crumb, sub)` | two strings | Crumb is the realm, `sub` the current view |
| `Shell.drawer({eyebrow, title, body, actions, wide, side})` | **options object, never an HTML string** | `side:true` returns the sheet form, for the rare case a rail is right. Passing a string is the exact regression audit rule 9 exists to catch |
| `Shell.confirm({eyebrow, title, body, op, tier, onConfirm})` | `tier` 1–3 drives the ceremony | Tier 3 additionally requires the export before `onConfirm` unlocks |
| `Shell.toast(msg, actionLabel, onAction)` | | The `undo` affordance on tier-1 writes |
| `Shell.discordCard({accent, title, rows, badges, …})` | | Renders the bot's own card shape. At wiring time this must be replaced by the bot's real render output — see §6.5 |
| `Shell.audit({states, extra, interactions})` | **all three optional** | `states` — an array of the `stateOf()` values this page can legitimately display, so rule 7 can tell a legend advertising an absent state from a correct one. `extra` — a function returning an array of extra problem strings, for page-specific invariants. `interactions` — an array of `{name, open}` entries the smoke test drives under `?audit=1`; **a panel absent from this array is never opened and never checked**, which is precisely how the drawer break survived a clean audit |
| `Store.add(op)` | `op = {id, tier, name, verb, realm, op, rows, destroys?, exported?, stale?}` | `id` must be **stable and deterministic** — re-staging the same logical change must produce the same id, because `add()` refuses duplicates by id. `name` is the subject, `verb` the past-tense change (`'dates changed'`). `realm` is the rail id, used by Home to attribute staged work and by Review to group it. `op` is the `core/ops/*` operation name, shown verbatim on the review screen so the reader can see which algebra call is about to run. **`rows` is the field-level preview — `[[field, was, becomes], …]` — and it is what Review renders**; an op without it degrades to "(no field-level preview captured)", which is legible but is a gap, so populate it at stage time when you still hold both values. `destroys:true` marks a row set as a destruction rather than an edit (Review tints the *becomes* column). `exported:true` is set once a tier-3 export gate is satisfied; `Store.blocked()` counts tier-3 ops that lack it. `stale:true` marks a staging conflict — see §15.4 |
| `Store.onInvert(id, fn)` | | **Mandatory before an op may be staged.** See §4.5 |

### 15.2 How a realm joins the rail

`REALMS` is a literal array at the top of `assets/shell.js`, currently five entries of `{id, label, href, icon}` where `icon` is raw SVG path markup. Adding a realm is one entry there plus the page. **This is the one case where "a new page adds no infrastructure" (§2) still means touching `shell.js`** — adding a row to a data table is not writing chrome. Note `door.html`, `review.html` and `index.html` are deliberately **not** realms and must not be added to `REALMS`; they are surfaces the rail never links to.

### 15.3 Transactions, and what happens when op 23 of 40 fails

**Closed, in the 2026-08-20 spec §6.2 (H2/H3): a changeset commits as one Mongo transaction, or not at all.** This is load-bearing rather than nice-to-have, because the bot re-reads on every interaction, so a half-applied multi-document write reaches real players within seconds. The spec flags the underlying premise — that the deployment supports transactions — as **unverified**; verify it before building on it, because if it is false the entire tier-2 design needs rethinking, not patching.

**What the mockup does not show and you must design:** what the tray displays *during* a commit, and what the reader sees when the transaction aborts. The rule from §10.6 applies — the failure state gets written copy naming what failed and what is still true, never a bare error.

### 15.4 Concurrency, and the second meaning of "conflict"

**Closed, in the spec §6.1, and it is the least obvious decision in the whole design.** `SeasonalData` is one global document, so ordinary document-level `__v` optimistic locking is *wrong* here — it would raise a false conflict on nearly every pair of unrelated concurrent edits, training you to click through the warning. The design is **element identity**: an op names its target array element by stable subdocument `_id` and commits with a targeted positional update asserting the prior value.

> 🔴 **The portal never calls `.save()` on a whole `SeasonalData` document.** A stale in-memory copy writes the entire array back and silently reverts someone else's edit.

**This is the staging-axis conflict promised in §4.3**: the record moved underneath a staged op, so its captured inverse no longer describes reality. It is a stale-write hazard, not a scheduling error. **Do not draw it with the content hatch** — that treatment is spoken for. Surface it on the commit screen, where the spec puts it (live state is re-read at review time so the conflict appears before the write, not after).

### 15.5 Authorization — the client is never trusted

**Closed, spec §6.2 H7/H8/H10.** Permissions resolve **server-side on every request** through `resolveAction()`'s existing choke point; the client is not trusted for anything, *including which realm it may see*. The `.rolebadge` (`OWNER` / `ADMIN` / `EDITOR`) and the rail's realm list are display conveniences and enforce nothing.

Two consequences the mockup cannot show. **A staging tray in `sessionStorage` is a client-trust surface** — every op must be re-validated and re-authorized server-side at commit, never accepted because it arrived in a changeset. And **revocation is not instant**: `hasCommandAccess` serves a 60-second cache, so re-checking per request bounds exposure at 60 seconds rather than the 12-hour session, and only the explicit `invalidateAdminCache()` on revoke collapses it to ~0. Call it.

### 15.6 Dates — the conversion is already decided, do not invent one

The mockup uses bare `YYYY-MM-DD` strings with no time component, because a timeline only needs days. **The model does not.** `SeasonalData.bpEnd` / `rankEnd` / `dmzEnd`, `calendar[].date` / `.endDate`, and the draw `date` fields are all Mongoose `Date` — full timestamps.

> 🔴 **Convert through `utils/adminParser.js`'s `parseAdminDate`, never `new Date(str)`.** The project's date semantics are a settled decision recorded in `.claude/rules/design-decisions.md`: admin dates are handled as **UTC**, and a `chrono` parse with no time lands at **noon** rather than midnight, specifically so a timezone shift cannot slide a date across a day boundary. `new Date('2026-08-20')` parses as UTC midnight and is exactly the bug that convention exists to prevent.

So: dragging a bar produces a day, and the day must be mapped back onto the existing time-of-day rather than zeroed. The TBD flags (`bpEndTBD` etc.) are **separate booleans that null the Date** — "known to be undecided" is a different state from "not set yet", and `calendar.js`'s `isEventEnded` treats a TBD end as indefinitely running. Preserve that distinction; collapsing it corrupts the season-end display.

### 15.7 Async — every loading, in-flight and failure state is undesigned

The mockup has no async state at all, so **none of it was designed and you are not "matching the mockup" when you build it.** The only rules that carry over: a skeleton **in the shape of the content**, never a spinner (§10.6); the three edge states get written copy, and so does failure; and motion stays within the three moments (§10.3). Beyond that, treat in-flight and error design as new work — and note that optimistic updates interact directly with §15.4, because an optimistic write that loses a concurrency check has to be visibly rolled back, not silently reconciled.

### 15.8 Constants named elsewhere in this document

`MIN_SPAN = 7` days — the Track never zooms past a readable week. `Store` persists under the `sessionStorage` key `dioreo-portal-staged`. `.serve.py` binds `127.0.0.1:8899`. The `?v=` cache-buster on asset URLs is **bumped by hand when an asset changes** — it is an unenforced step guarding against the exact staleness failure §0 describes, so if you edit an asset and your change appears not to take, check that first. None of this transfers to the real portal, which serves its own assets and needs its own cache policy.

### 15.9 Surfaces that were undesigned, and now are not

`index.html`, `review.html` and `door.html` were one clause each when this document was written. All three are now built and specified — §5.7, §5.8, §5.9. Two notes survive the change:

- **`review.html` carries more of the safety model than any other page**, and its design is therefore load-bearing rather than decorative: the tier-3 export gate, the typed confirmation, the staging-conflict resolution and the atomic-commit promise all live there and nowhere else. Changing it is a safety decision.
- **Scheduling** is named twice in §1 as a reason the portal exists and appears in no page, fixture or element table. It is **not in v1** — do not build it, and do not treat its absence as an oversight to quietly fix. If it is wanted, it is a new design conversation.

### 15.10 How to prove the shipped portal actually matches

This is the thinnest part of the whole package, and it is worth saying plainly rather than implying the audit covers it. **`Shell.audit()` proves almost nothing about visual fidelity** — §14 is explicit about that. There is no visual-diff harness, no fixture-versus-live comparison, and no automated way to catch the shipped portal drifting from these mockups. Given that drift is the exact failure this document exists to prevent, the honest position is: **the mockup is the reference, opened side by side, and checked by eye against §5 and §10.**

If you build one thing beyond the pages themselves, build that comparison. Until it exists, the practical discipline is: keep the mockup runnable, open it next to the live portal on the same viewport, and treat any difference as a defect in the portal until someone decides otherwise.

### 15.11 Still open — ask before deciding

1. **Whether staging stays client-side.** `sessionStorage` means per-tab, lost on close, invisible to a second admin. Two admins staging against one global document is not addressed anywhere, and §15.4's conflict surface assumes the answer.
2. **Whether tier-3 operations are restricted by role**, beyond the general server-side permission check. Any signed-in admin can currently reach the export gate. Related: the `editor` role means "granted scopes minus destructive actions", which the grid now *shows* but nothing yet *enforces*.
3. **Whether `portal/ui/**` is brought to match these mockups in place, or reimplemented from them.** §0.5 says diff first; which way that goes is a real decision with real cost either way.
4. **Whether `--ink4` should exist at all.** It is now a non-text token with 15 uses. If those 15 could take `--rule2`, the ink scale would be honestly three tokens instead of three-plus-a-footnote.

*Closed 2026-08-24: the accents for Broadcast, Access and Analytics (§4.2); `review.html`'s design (§5.8); the WCAG AA floor, now measured rather than claimed; the responsive contract, verified at 390px rather than assumed; and keyboard paths for **all three** drag surfaces.*

> ⚠️ **`prefers-reduced-motion` is still UNVERIFIED and should not be called done.** Six blocks exist in `app.css` and the syntax is right, but no tool in this session could emulate the preference, so nothing has ever observed those rules taking effect. **Do not read "the CSS is there" as "it works"** — that is the shape of assumption this document exists to stop.
