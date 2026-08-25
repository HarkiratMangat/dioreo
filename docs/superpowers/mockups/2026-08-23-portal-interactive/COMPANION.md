---
kind: reference
status: live
---

# Dioreo web admin portal — the interactive mockup, explained in full


> ## 🔴 THIS DOCUMENT IS EXHAUSTIVE BY DESIGN. SIZE IS NEVER A REASON TO TRIM IT.
>
> **Harkirat, 2026-08-24, verbatim:** *"the companion doc is a DETAILED AS HELL, fine blueprint, to implement the portal with zero mistakes. Do not be scared by the 143KB size. I have said it before, and I'll repeat it for you, IDC WHAT SIZE THE FILE IS, HOW LARGE, HOW MANY TOKENS, HOW MANY BYTES, it must include everything about the design, every element, for a perfect portal."*
>
> He has now said it **more than once**, which means the instinct it corrects is a recurring one — a session opens this file, sees six figures of bytes, and starts writing "a focused section rather than bloat". That instinct is wrong here and it has already cost a pass: §5.9–§5.9e were first written short and had to be rewritten to blueprint depth the same hour.
>
> **What that means in practice, when you add to this file:**
> - Every element gets a row: **what it is, what it does, what it wires to, and the trap it already paid for.** Exact selectors, exact values, exact measurements — `1464px in an 828px viewport`, not "below the fold".
> - A decision records **the reasoning and the rejected alternative**, not just the outcome. The outcome alone cannot stop the next session re-deriving the wrong thing.
> - A defect records **what it looked like on screen**, so a reader recognises it before a probe catches it.
> - Never summarise a section away to save room. **Never say "for brevity".** If something genuinely belongs elsewhere, move it and leave a pointer — that is the only acceptable subtraction, and §8, §11 and §12.1–12.4 are the precedent for how to do it.
> - ⚠️ The one thing that IS worth cutting is **duplication that has drifted** — three copies of one rule where two are stale. Cut to a single authoritative statement, never to a shorter one.
>
> A stale or thin COMPANION is worse than a wrong fixture. A wrong fixture produces a wrong render and someone notices; **this document IS the instruction**, so a gap in it gets implemented faithfully, carefully, by someone doing exactly what they were told.

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
| **10 / 12** | Art direction as specified · what is still outstanding | When judging whether it looks right. §12's measurement half was cut 2026-08-24 — it governed nothing and said so |
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
| **Changeset composition and commit** | `core/changeset.js` — exports `validateSet`/`previewSet`/`commitSet`/`pageForOp`. `core/revert.js` replays a ChangeLog row's stored inverse. ⚠️ *This row used to hedge that the file might not exist and to "check which before importing" — it does exist, at that path, and §5.1/§5.8/§6 all cite it without a hedge, so the hedge handed the reader a contradiction plus homework.* | Code on disk |
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
Shell.mountHeader(crumb, subCrumb)   // brand, breadcrumb, COMMAND BAR, sign out, account menu
Shell.commandBar({items, run, placeholder})   // a realm's own commands; a default set is
                                              // installed by mountHeader so no realm ships a dead input
Shell.defaultCommands()              // realms + review + sign out — the floor every page gets
Shell.compose({types, initial, preview, onStage, host, onClose})  // pass `host` to render INLINE
Shell.inkOn(hex)                     // the text colour a filled surface can actually carry
Shell.fitPlaceholders(root)          // no placeholder may be cut; measured, not guessed
Shell.installTips()                  // delegated `data-tip` tooltips — never a native `title`
Shell.holdTop()                      // the page owns its opening scroll position
Shell.drawer({eyebrow, title, body, actions, wide})
Shell.confirm({title, body, confirm, danger, op, tier, onConfirm})
Shell.toast(msg, actionLabel, onAction)
Shell.discordCard({accent, title, sub, rows, badges, code})
Shell.Store                          // staged ops, sessionStorage-backed
Shell.Store.onInvert(id, fn)         // how to undo a staged op
Shell.audit({ states, extra, interactions }) — ⚠️ **`interactions` is the field that matters most, and it was missing from this line until 2026-08-24.** It is an array of `{ name, run }`; each `run()` is driven and the drawer it opens is asserted for a title, a non-empty body and no garbage text. **A panel absent from that array is never opened and never checked** (§15.1) — the largest hole in what a green audit means.         // the invariant audit — call once, last
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
| ~~Broadcast — priority stack~~ | — | **Retired.** The interaction it served was drag-to-reorder a `priority` field that exists on no model (§5.4). Broadcast has no drag surface, so it needs no keyboard path; the row is kept struck through because "Broadcast has one" was asserted in three places and is worth contradicting once, loudly. |
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
python3 .serve.py                    # the server. NOT `python3 -m http.server`, see §7
open  http://127.0.0.1:8899/.audit-all.html?w=1280     # all 8 pages' self-audit at one width
open  http://127.0.0.1:8899/.audit-all.html?w=390      # …and at phone width
open  http://127.0.0.1:8899/.mobile.html?p=season,armory,broadcast   # three pages side by side in real 390px frames
```

⚠️ **`.audit-all.html` runs every page's `Shell.audit()` in a 390-or-1280px iframe and reports one line each** — an iframe's element width IS its viewport width, which is the only way to check the phone layout without resizing the browser. It reports the viewport it actually measured at, because a degenerate frame still returns well-formed numbers (§14). **`.mobile.html` is for your eyes, not the audit** — the audit cannot see that something is ugly, and §7 records four defects that passed every invariant while being visibly wrong.

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
| **Command bar** | `#cmdBar` `#cbIn` `#cbDrop` | 🔴 **NOT a launcher.** It was a 44px `⌘K` chip in a header with ~700px of unused space — a keyboard shortcut wearing a button's clothes, whose palette then covered the realm you were searching. It is now the widest element in the header, says what it does in words, and drops results beneath itself with the page still visible. Opens on INTENT (`pointerdown`, typing, `⌘K`) and **never on focus**: the audit's own focus-ring sweep fired the old `focus` handler and every realm loaded with the palette already open. | `Shell.commandBar` |
| **Sign out** | `#hdrOut` | In the bar, not three clicks deep in a menu. Still confirms — it discards staged work — and shares ONE handler with the menu item so they cannot disagree | `session.end` |
| Account chevron | `.whobtn .cv` | A drawn chevron that **rotates** when the menu opens. It was an 8px `▾` — at that size a smudge that says "something is here" without saying what, which is the only review a disclosure indicator can fail | — |
| Account button | `#whoBtn` | Toggles the account menu; `aria-expanded` tracks state | Discord OAuth session |
| Account avatar | `.uav` | Initial + presence dot. Presence dot is `--ok` when the session is live | — |
| Role badge | `.rolebadge` | **`OWNER` only.** There are exactly two roles — the hardcoded owner and a Mongo-granted admin — and `shell.js` renders the literal `OWNER` because the mockup signs you in as one. ⚠️ *This row read `OWNER / ADMIN / EDITOR` until 2026-08-24; there is no `editor` and there is no `role` field on `models/AdminUser.js` at all. See §5.5.* | `utils/owner.js` |
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

#### 🔴 FIVE LANES ON THE TRACK, AND A SIXTH KIND THAT IS NOT A LANE AT ALL
*(Updated 2026-08-24. This section read **SIX LANES** until patch notes were split out — see §5.2b. Three of the five still hold POINTS, which is the correction the rest of this section describes and which still stands.)*

#### 🔴 SIX KINDS OF THING, AND THREE OF THEM HOLD POINTS — the correction that changed the design

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
| `.lane` ×6 (+ draft lanes) | New draws · Returning · **Draw windows** · Events · Playlists · Patch notes. Height is **computed from the rows the lane needs**, not fixed — see the row-assignment note above | `overflow:hidden` — it is the viewport for its lane. ⚠️ *This row said ×5 and omitted Draw windows until 2026-08-24, two screens below the heading that says six.* |
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

| View | `data-view` | What it answers |
|---|---|---|
| Tier board | `rack` | Where every build sits in its category's ranking |
| Repairs | `coverage` | What is wrong, split mechanical / judgement |
| Compare | `compare` | Two builds side by side |
| Bulk & export | `bulk` | The pipe format, round-tripped |

⚠️ **The `data-view` values do not match the labels**, and §10.3 calls the first one "Rack" while the tab reads "Tier board". §5.0 exists *because* a coverage count found this section naming 2 of 24 ids; the table above is the correction. The MP/DMZ switch is `.modesw`, and one `inMode()` helper owns the partition — `manageActions.js` registers `loadouts_mp` and `loadouts_dmz` as distinct pages with distinct permission scopes, so this is never a filter.

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
| `.nstack` | The live set **in delivery order** — `createdAt` ascending, oldest first, exactly what `utils/announcement.js` sends | `F.announcements` filtered to `state === 'live'` |
| `.nscard` | One announcement. `--c` is its **own stored `color`**, so the dot matches the embed Discord actually renders. `.staged` = dashed, `.over` dims anything past the cap, `data-live="1"` when saved so audit rule 5 can police it | — |
| `.np` | Delivery position. **A label, not a field** — the copy beneath the stack says so, because `models/Announcement.js` has no ordering column | index in the sorted array |
| `.nscard` click / Enter | Opens the editor drawer | `announcement.edit` |
| `.nspin.warn` | `never ends` when `expiresAt` is null; `waits` when the card falls past the 10-embed cap | — |
| `.nschan` | `ends <date>` — the real expiry, not a surface name | `expiresAt` |
| `.nprev` | `Shell.discordCard()` per live announcement, capped at `MAX_EMBEDS_PER_MESSAGE`. **No title when no markdown heading was typed**, because `buildAnnouncementEmbed` sets `description` and `color` and nothing else | `utils/announcement.js` |

> 🔴 **THERE IS NO PRIORITY, NO PIN AND NO CHANNEL.** An earlier build of this page made drag-to-reorder its *primary* interaction, and the field it reordered exists on no model — `portal/ui/broadcast.js` states outright that adding an ordering column would be a schema change to file rather than assume. `pinned` and `channel` were invented the same way, and `views: 12840` was fabricated telemetry. **This table used to specify all four**, sitting fifteen lines below the callout that rules them out, because the prose was rewritten and the tables were not. If you are reading a table here that contradicts the callout above it, the table is the stale half — check `broadcast.html`.

#### Airtime (`#viewAir`)
Every announcement on one horizontal axis, windowed by `airtimeWindow()` (a 21-day floor so a single announcement is still a readable axis), with a `.now` line at today.

| Element | What it is | Notes |
|---|---|---|
| `.lane` | One announcement, label + track. The label **strips the prefix every announcement shares** — four rows all opening `SESSIONB-SEED ` truncated to byte-identical strings, and four different names rendering as one is not a truncation problem, it is an identity problem | `commonPrefix()` |
| `.bar` | Its window. Begins at `startsAt` when set, otherwise `createdAt`. `.saved` live · `.staged` scheduled · `.ended` expired | Click opens the editor |
| `.bar.forever` | **No right edge** — masked out rather than stopped, because a bar that stops reads as an end date and `expiresAt: null` is precisely the thing that does not stop | `!a.expiresAt` |
| `.ruler` | Window start and end | — |

> **The finding this view exists for is the bar with no end**, and it is invisible in a chronological list because "still running" and "ran for three weeks" look identical there. The `.callout` beneath names the specific offender and its day count — *"has no expiry and has been showing for 19 days"* — because the general rule teaches nothing.

⚠️ **Airtime bars are NOT draggable here.** Season's Track uses a horizontal bar on a date axis to mean *draggable*, and shipping the same shape as click-only does make one mark mean two things — that objection is real and is being accepted rather than answered, because the two edits Broadcast supports (`startsAt`, `expiresAt`) are a date and a **day count**, and a drag cannot express "60 days from now". The drawer's two fields can.

#### Editor drawer
One text field, a start date and an expiry, plus the stored accent shown read-only.

| Control | What it does |
|---|---|
| `#aText` | **The only content field there is.** No title: a heading is markdown typed into the text, and the generic embed header was removed on 2026-08-13 |
| `#aStart` | `startsAt`, an absolute admin date. Blank = immediately |
| `#aExp` | ⚠️ **NOT A DATE.** `computeExpiresAt` understands blank (the 60-day default), `never`/`none`, or a whole number of **days** — and returns `undefined` for anything else, which a caller must treat as a validation error. `#expHint` reads the field back in words or names the bad input. The prefill **ceils**, matching `expiryToInputValue`; rounding it would let a re-submit silently shorten an expiry |
| accent readout | The stored `color`, **generated once at creation and never regenerated on edit** — an edit is a correction to the same announcement, so its colour is part of its identity |

Saving stages `announcement.edit` with `rows` naming only the fields that changed. `Stage deletion` stages `announcement.delete`. **Bulk delete is N × `announcement.delete` in one changeset** — no bulk op exists for announcements, unlike loadouts, and a multi-op changeset is exactly what that case is for.

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
| `.hcard .att` | The attention line — computed, never decorative: `N run past the season` or `N to repair` (Season), `N need repair` (Armory), `N never ends · oldest up Nd` (Broadcast), `N scopes held by one person` (Access), `N errors pinged` (Analytics). ⚠️ *Broadcast and Access used to read `N gaps in coverage` and `N signed in` here. The first counted a coverage gap the realm does not have; the second is rejected by name in `index.html`'s own comment — zero sessions is the resting state, so printing it every time trains you to ignore the card.*. **Staged work outranks it**: a realm with staged changes shows `N staged` in `--staged` instead |
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
  op:      'loadout.edit',       // ⚠️ SINGULAR. Every registry namespace is singular and every
                                 // invented name found so far pluralised one. This template read
                                 // the pluralised `loadouts.edit` until 2026-08-24 — the error §3.9.1
                                 // records the gate catching in armory.html, reproduced inside the
                                 // block labelled "the part you can copy". The gate now scans this
                                 // document, in code form and in prose, so it cannot recur.
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

## 5.9 THE COMPONENT LAYER — every class, every state, every value

🔴 **This package had TOKENS AND NO COMPONENTS, and that is not a tidiness complaint — it is the mechanical cause of four separate defects found in one sitting.** `tokens.css` is disciplined: hues, the 31° gap rule, the three-tone ink scale. Nothing sat above it. So every surface hand-rolled its own chip, tooltip, card and plate — and the composer's type chips could not match the masthead button they were asked to match, because **there was no shared chip to reach for**. Nobody was careless. There was nothing to reuse.

**Measured before the fix: one `.pill` on the whole portal against 93 hand-rolled chips.** Building a component and then not adopting it is the same defect as not building one.

### 5.9.1 `.pill` — the one interactive chip

```
.pill                    base: 8px 13px, radius 999px, --rule border, --sunk fill, --ink2
.pill:hover              border --rule2, colour --ink, translateY(-1px)
.pill:active             translateY(0)   ← the lift must resolve, or the press feels dead
.pill:focus-visible      2px --patch outline, 2px offset
.pill.on                 border var(--c), background color-mix(--c 13%), --ink
.pill.lead               PRIMARY. border --patch, background color-mix(--patch 14%), 600/13px, 10px 15px
.pill.ghost              dashed --rule2, --ink3 — an ADD affordance, never a live one
.pill.sm                 5px 10px / 11.5px — dense contexts (attention rows, inline actions)
.pill[disabled]          opacity .45, cursor default, no lift
.pill .dot               9×9, radius 2, rotate(45deg), background var(--c) — the topic mark
.pill .sub               10px --data, .09em, uppercase, --ink4 — metadata, never the label's weight
.pill kbd                10.5px --ui (NOT --data: ⌘ is not in JetBrains Mono and renders as tofu)
```

| Adopted by | How |
|---|---|
| `.chip`, `.seg button`, `.tbdsw button` | **redefined in terms of `.pill`, not renamed.** `.chip` is queried by name in six pages of JS; a mass rename trades a styling inconsistency for a functional break. They inherit radius, transition, hover lift and focus ring |
| `.mh-new`, `.mh-t` | the masthead primary action and Season's six type pills |
| `.att-go` | Home's per-row verb |
| `.rec-cta`, `.rec-add button` | the Season Record's publish affordance |

⚠️ **Do not add a seventh variant without checking these five first.** The variant set is deliberately small: primary (`lead`), selected (`on`), additive (`ghost`), dense (`sm`), inert (`[disabled]`). Anything else is a colour or a size, and both already exist as tokens.

### 5.9.2 `.tip` + `data-tip` — the only tooltip

**A native `title` is OS chrome**: grey, delayed, unstyled, and rendered UNDER the pointer, so it covers the very thing it describes. The cluster readout shipped as one while `.tip` sat defined and unused two hundred lines away.

| Rule | Detail |
|---|---|
| Anything a person must READ uses `data-tip` | `title` survives only for hints ≤24 characters that an assistive user can reach another way |
| Delegated from `document` | `pointerover` / `pointerout` / `focusin` / `focusout` / `Escape` / `scroll` (capture). It must survive every `innerHTML` rebuild the Track performs — a listener bound to a node dies with that node |
| Positioned BESIDE, never over | prefer right at `+10px`, flip left when it would pass `innerWidth - 8`, clamp vertically into the viewport |
| First line is the title, subsequent lines are `.sub` | `data-tip` splits on `\n` |
| Enforced | audit rule 5b: any `title` over 24 chars without a `data-tip` sibling is a finding. It immediately caught four more that a static scan could not see, because they are assigned in JS at render time |

### 5.9.3 `.plate` / `.scrim-b` — contrast over imagery

Legibility that depends on which photograph the user uploaded is a coin toss, not a design decision.

- `.plate` — `position:relative; background:var(--raised); z-index:1`. Anything read over an image sits on one.
- `.scrim-b` — a `::after` gradient over the bottom 70%, `transparent → color-mix(--raised 92%)`. For a surface that must stay visible while text sits below it.
- **The account popout is the reference implementation.** `margin-top:-22px` used to pull the WHOLE head — avatar and name — over the banner's bottom third with only an inset shadow standing in for a scrim, so on a light banner the entire block vanished. Discord's own popout overlaps only the AVATAR and puts the name on solid ground; that is the half that makes it work and it was the half that had been dropped. Now: `.ubanner` is 74px with a real `::after` gradient, `.umenu .uhead` sits on `--raised` at `margin-top:0`, and only `.uav` carries `margin-top:-24px`.
- The presence dot moved from `right:-1px;bottom:-1px` (half outside the ring) to `right:6.5%;bottom:6.5%` — where a 46px circle's own curve puts it — plus a 1px dark ring so it reads on any avatar.
- Enforced by audit rule 5d: a text-bearing child of an element with a background image and no plate is a finding.

### 5.9.4 `.mark` — the point vocabulary

| Class | Renders | Means |
|---|---|---|
| `.mark` | 13×13, radius 2.5, `rotate(45deg)`, `background var(--c)` | one thing at one date |
| `.mark.staged` | same, `background:none` + `inset 0 0 0 1.5px var(--c)` | dashed/hollow = STAGED, per §4.1 |
| `.mark.stack` | 15×15 plus a `::before` twin offset `translate(4px,-4px)` at `.4` opacity, count in `.n` | **several.** The shape says it before the number does |
| `.mark.tier-mythic` | 2px ring + 10px glow in `--c` | rarity, on draw lanes only |
| `.pt[data-tier=…]` | `mythic` → ring+glow, `legendary` → 1.5px ring | the Track's own markers carry the same vocabulary |
| `.pt[data-lanekind=returningDraws]::after` | a 5px paper-coloured centre | a RETURN reads as a ring, not a fill |

🔴 **A cluster REPLACES what it stands for.** It used to be a count drawn ON TOP of the diamonds, so one bled out from behind the disc and the mark read as a diamond with a blister. `.pt.hid{display:none}` — not opacity, not visibility. And the retired pill-shaped `.ptc` rule had to be DELETED, not out-ranked: its surviving `min-width:19px` beat the new `width:15px` and rendered a 19×15 lozenge. **A higher-specificity rule only wins the properties it SETS.**

### 5.9.5 `Shell.inkOn(hex)` — what a filled surface can carry

Not a luminance threshold. **A threshold is a guess**, and the first version put white on Events' blue (`#4A90D9`) at 3.08:1 when black on the same blue measures 5.97:1. There are only two candidates, so compute BOTH ratios and take the winner:

```js
dark  = (L + 0.05) / 0.05        // ratio of #07090A against the surface
light = 1.05 / (L + 0.05)        // ratio of #FFFFFF against the surface
return dark >= light ? '#07090A' : '#FFFFFF'
```

Consumers pass the result as `--ci` and the CSS reads `var(--ci, var(--on-accent))`, so an unconverted surface degrades to the old global rather than to nothing. Adopted by `.bar.saved`, `.bar.saved .bl`, `.stt.saved`, `.bdg.filled`.

⚠️ **An outside label must LEAVE the bar's text colour behind with it.** `.bar.saved .bl` paints near-black designed for a filled bar; once the label renders on the dark lane instead, that is black-on-black — **measured at 1.41:1**. `.bar.lbl-out .bl` forces `var(--ink)`.

### 5.9.6 `Shell.fitPlaceholders(root)` — no placeholder may be cut

The surface sweep measured every placeholder against its own rendered field and found them clipped on **six of eight realms**: "…attachment or Gunsm", "Search this realm, or run ", "Paste an image URL — blank". Harkirat called the first one *"that text error in the placeholder"*, which is exactly right — a sentence chopped mid-word reads as a bug, not as brevity.

- Runs on load, on `document.fonts.ready`, and on a debounced `resize` — a placeholder fits or does not fit only relative to a **rendered** field.
- Walks a ladder of progressively shorter candidates: the full string → `data-ph-short` → the part before an em-dash → the part before a comma or " or " → the first two words → **empty**. An empty placeholder is a legitimate answer for a genuinely tiny field.
- The full sentence survives on `aria-label`, so nothing is lost to a reader who hears it.
- 🔴 **Fix the CATEGORY, not the field.** Shortening them one at a time is how they come back; two had already been hand-fixed earlier the same day and the sweep still found four more.

---

## 5.9b THE HEADER, THE COMPOSER, AND WHERE CREATION LIVES

**Measured before any of this**, by rendering every realm and reading each control's position against its own fold:

| Realm | Create controls | Where |
|---|---|---|
| Season | 3 | **1464px, 3548px, 3551px** in an 828px viewport — the primary one 4.3 screens down |
| Armory | 1 | 1208px, below the fold, on the realm that manages 133 builds |
| Broadcast | 1 | 770px — above the fold only at 880px window height |
| Access | 1 | 621px |
| **DELETE** | **0 visible on any page** | against **12** delete/purge actions in `utils/manageActions.js` |
| **EXPORT** | **1** (Armory) | against **8** in the registry; Season has none |

**The baseline being beaten: `/manage` registers 57 actions across 7 pages, and every one of those pages ships a `formatguide` action** — because there creation means typing a formatted string into a Discord modal, so the format IS the interface and has to be documented. A patch note costs **four modals** (Date/Info, URLs 1, URLs 2, Add New Season) purely because a Discord modal caps at five inputs. A form needs no guide and has no cap. **That asymmetry is the entire opportunity — quote it when justifying portal work.**

Harkirat named the class, not the instance: *"the page is just the visualization of what they trigger."*

### 5.9b.1 The header — every element

| Element | Selector | Behaviour | Wires to |
|---|---|---|---|
| Brand | `#home` `.mk` | navigates to `index.html` | — |
| Breadcrumb | `.crumb` `#crumbView` | `Realm › View`, second half live | — |
| **Command bar** | `#cmdBar` / `#cbIn` / `#cbDrop` / `#cbList` | `flex:1 1 460px; max-width:520px`. Magnifier, input, `⌘K` hint (hidden on focus), dropdown at `top:calc(100% + 7px)` | `Shell.commandBar` |
| **Sign out** | `#hdrOut` | icon + label, `--del` on hover, label hidden below 1100px, whole control hidden below 820px (the account menu still carries it) | `session.end` |
| Account | `#whoBtn` / `.cv` | drawn chevron, `rotate(180deg)` at `aria-expanded=true` | Discord OAuth |

🔴 **THE COMMAND BAR IS NOT A LAUNCHER.** A 44px `⌘K` chip in a header with ~700px of unused space is a keyboard shortcut wearing a button's clothes: it advertises a feature instead of being one, and its full-screen scrim covered the realm you were searching. Season's own 60-line overlay palette is **deleted**; `.pwrap` / `.pbox` / `.pal` are retired.

⚠️ **It opens on INTENT, never on focus.** `pointerdown`, a printable key, `ArrowDown`, or `⌘K` — because the audit's own focus-ring sweep calls `el.focus()` on every input, which fired the old `focus` handler and **every realm loaded with the palette already open**. Closes on blur after 130ms so a click on a result still lands.

⚠️ **`Shell.commandBar` is IDEMPOTENT.** `mountHeader` installs `defaultCommands()` so no realm can ship a dead input — a search box that does nothing is worse than none — and a realm then calls it again with its own richer list. Without the guard that second call stacks a duplicate listener set and every keystroke paints twice.

⚠️ **Two search bars once rendered inside one.** The global reset `input:not([type="checkbox"]):not([type="radio"]):not([type="range"])` scores **0,3,1** — three `:not()` arguments each contributing an attribute selector — and outranked `.cb-in` at 0,1,0, painting the input as its own bordered box inside the bar. `.cmdbar input.cb-in` restores it. **Specificity is not a matter of which rule was written last.**

**Command shape:** `{ k: label, run: fn, hex?: '#RRGGBB', c?: tokenName }`. 🔴 Pass `hex` — five entries once hard-coded `c:'draw'`, and `--draw` does not resolve, so all five rendered the same red dot on a page whose whole discipline is COLOUR CARRIES TOPIC.

### 5.9b.2 The masthead — one shape in every realm

```
.masthead   grid, 1fr auto, column-gap 28px
  .mh-id    row 1 col 1   title + job line
  .mh-stats row 1 col 2   the numbers, right-aligned
  .mh-new / .mh-add  row 2 col 2   the PRIMARY ACTION, right-aligned
  .nwhost   row 3, full width   the inline composer
  ≤820px    collapses to one column, everything left-aligned
```

It lived in `season.html`'s own `<style>`, which is why Armory's primary action had nowhere to go and stayed parked under a filter row. It is in `app.css` now, so every realm's masthead is the same shape and a reader learns ONE place to look. `N` opens creation on every realm.

🔴 **Season shows the six TYPES, not a wrapper.** `+ New item` was a beautiful button whose only job was to reveal six more buttons — two clicks to begin, with the realm's vocabulary hidden behind the first. `.mh-add` renders one `.pill.mh-t` per lane, built from `COMPOSE_TYPES()` so a type cannot go missing from here while existing on the Track. One click starts the thing you wanted. **The other realms keep a single button, because a single button has nothing to reveal.**

### 5.9b.3 `Shell.compose({host})` — the composer

| Part | Detail |
|---|---|
| **Container** | `host` renders INLINE into `#nwHost`; omit it and you get the drawer, kept for surfaces with nowhere to put a bar. 🔴 `/manage`'s creation flow IS a Discord modal — putting the portal's in one reproduces the shape of the thing it exists to beat |
| **Layout** | ONE row. `.nwhost .nw` is a grid `1fr auto`: types span, form left, actions right. Measured at 134px tall; the stacked version was ~300px and pushed the Track — the preview — off the bottom of the screen, which defeats the entire reason it is inline |
| **Type first** | picking the type picks the SHAPE, so nothing below it exists until one is chosen |
| **The form IS the schema** | point types show ONE date labelled by `dateLabel`; span types show Opens/Closes. The old add-row offered `start` AND `end` for every type including draws, which have exactly one field and no end — a form asking for data the record cannot hold, the same defect the Track had when it painted a draw as a band |
| **Field boxes** | each field is wrapped (`.nw-f`) so the inline bar can lay them on one row; bare label/input siblings force a column |
| **Gate** | `#nw-why` states the reason in words; `#nw-go` reads `Stage <single>` — never `Stage new draw`, which is what deriving a singular by chopping an "s" off a COLUMN HEADING produced |
| **`onStage.live(state)`** | called on every keystroke so the realm can draw its own preview |

🔴 **THE TRACK IS THE PREVIEW.** Not a miniature axis inside a dialog — the real one, at real scale, beside real neighbours. `drawComposeGhost(c)` appends `.ghost.cmp` into the target lane, dashed because it is STAGED, and `lane.scrollIntoView({block:'nearest'})` because a ghost is only a preview if you can see it. Aiming at a folded lane unfolds it. `composePreview()`'s mini-axis is deleted — a lower-fidelity copy of the thing directly behind the scrim.

⚠️ **`drawComposeGhost` was DELETED by a dead-code sweep an hour after it was written**, and called from three places for the rest of the session without ever throwing, because it is only reached when the composer opens. `npm run portal:refs` exists because of it.

---

## 5.9c THE TRACK IS INSTRUMENTS, NOT SIX ROWS OF RECTANGLES

Six identical rows of rectangles is a table drawn sideways. Each lane holds a genuinely different KIND of fact, and until 2026-08-24 every one was drawn the same way — which is why the Track read as one undifferentiated block and why it stopped working the moment a lane needed five rows.

**Measured before:** the live season put 39 items into six lanes with row heights of 38 / 38 / 88 / 62 / 220px — four different heights carrying no meaning, just whatever fell out of interval packing. The Track was ~1,100px tall and the lane you came for was off-screen while you read another. **After:** ~250px, everything on one screen.

### 5.9c.1 `LANE_KIT` — one entry per lane, in `season.html`

| Key | `sum` | `single` | `ask` | `overlapMatters` |
|---|---|---|---|---|
| `newDraws` | `pips` | draw | what released, and how rare | — |
| `returningDraws` | `pips` | returning draw | what came back | — |
| `drawWindow` | `runs` | draw window | when you could buy | **`true`** |
| `event` | `runs` | event | what was running | — |
| `playlist` | `load` | playlist | how many modes at once | — |
| `patchNotes` | `pips` | patch note | what was published | — |

🔴 **`single` exists because deriving a singular by chopping an "s" is wrong.** The lane LABEL is a column heading ("New draws"), not a noun for one of the things in it — so `'New ' + label.replace(/s$/,'')` produced **"New new draw"** in the command bar and **"Stage new draw"** on the composer's button. Two different jobs, two different words, written down rather than computed.

`ask` is the lane's own question and appears in the header's `data-tip`, so the tooltip explains what collapsing costs you rather than merely announcing that the control exists.

### 5.9c.2 The collapsed forms — each answers that lane's own question

A collapsed row that only says "5 hidden" is a worse version of nothing.

| `sum` | Renders | Because |
|---|---|---|
| `pips` | `.lpip` at each item's true `pct(start)`, 7×7 rotated; `.myth` grows to 9×9 with a 2px ring | a release is a moment; **rarity** is the fact worth keeping when the name goes |
| `runs` | `mergeRuns()` unions overlapping intervals into `.lrun` bars, 6px tall at `.65` opacity, each tipped `N items · from → to` | overlapping bands are perceived as one span, so that is what the summary shows |
| `load` | `loadCurve()` samples the visible window at **64 points**, counts how many items are live at each, draws 2px bars scaled to the peak at opacity `.35 + (n/max)*.65`, plus a right-aligned `N at peak` | 🔴 the question in the playlists lane is **never "which one" but "how many are live at once"** — which is exactly why sixteen "overlap" warnings were wrong |

### 5.9c.3 Collapse — per lane, persisted, never a mode

- **Default:** a lane needing **more than three rows** opens collapsed. Playlists alone needs five — ~130px before anything else is drawn.
- **Explicit choice always wins** and persists: `sessionStorage['dioreo-lane-col']`, keyed `type` or `d:type` for draft lanes.
- **Alt-click solos** — everything else folds. That is the gesture you want when one lane is the reason you opened the page.
- **No global "dense mode".** A mode is what you build when you cannot decide.
- `.lnh` is the header: caret · colour chip · name · count. It is a **button**, `aria-expanded` tracks state, and the name **WRAPS rather than truncates** — "DRAW WINDOWS" is two words in a 38px row and there was never a reason to cut it.

⚠️ **The collapsed class is `.lnc`, NEVER `.col`.** `.col{…min-height:220px}` is a BOARD COLUMN defined 2,400 lines earlier. A collapsed 30px lane inherited it, computed to 220px, and rendered as **a black void with its header floating in the middle** — because `.lane{align-items:center}` centres a 12px button inside a 220px row. Eighth collision on this package's roster after `.now`, `.left`, `.tbd`, `.k`, `.tk`, `.ed` and `window.frames`.

### 5.9c.4 `--gutter` — one token, three consumers

`.ruler`, `.deadrail` and `.lnh` hang off the same left edge. It was `96px` **hard-coded in three places**, and once the lane header gained a caret, a chip, a name and a count the names truncated to "NEW…", "RE…", "DRA…" — a worse label than the one it replaced. `:root{--gutter:138px}`, `96px` below 820px. **Three copies of a measurement is three chances to disagree.**

### 5.9c.5 Labels leave the bar before they truncate

```
fits && !clipped   → leave it alone
room to the RIGHT  → .lbl-out      (label at left:calc(100% + 7px))
room to the LEFT   → .lbl-out-l    (label at right:calc(100% + 7px))
neither            → .nolabel
```

- 🔴 **"Room" means room before the NEXT BAR, not before the lane ends.** Five weekly events sit end to end; measuring to the lane's right edge put every label on top of its neighbour — worse than the truncation it replaced. Only siblings on the SAME row can collide, since row assignment already guarantees no vertical overlap.
- 🔴 **The 55% threshold was retired.** It was right when the only alternatives were "cut the name in half" and "drop the label"; once a label can move outside, accepting a 55%-cut name is accepting a worse outcome than one that is available. **Measured at 620px with every lane expanded: ten labels moved outside cleanly and three stayed clipped purely because they cleared that gate.** After: eight outside, zero dropped, zero clipped.
- ⚠️ **An outside label must leave the bar's TEXT COLOUR behind with it** — `.bar.saved .bl` is near-black for a filled bar, and on the dark lane that measured **1.41:1**.
- **`.stemmed` no longer prints a literal "·".** "· Week 1" read as a stray bullet. A dotted left border is the "continues from" convention and carries the same fact without putting a glyph among the words.

### 5.9c.6 The deadline rail

| Element | Rule |
|---|---|
| `.dflag` | **ONE CHIP PER DATE.** Battle Pass and Ranked both end Sep 10; stacking drew two boxes over one line with two stems to the same x. Two labels for one moment is a **modelling error**, and modelling it fixes the alignment by construction — one date, one chip, one stem, plus a `.dfk` key dot per deadline in the group |
| `.dpin.edge` | an out-of-view deadline **welds to the edge it is beyond** (`right:0` / `left:0`), not floating mid-rail at no grid position. "Beyond this view" is a statement about the boundary |
| `stackFlags()` | packs `.dflag`, `.dspan` **and `.dpin`** — the pin was missing from the query and is appended AFTER, so it took no row, sat at `top:0` and painted over the Ranked flag, which vanished entirely |
| `--xtop` | the rail's measured height drives the crosshair offset. It was **hard-coded at 60px**, so the moment the rail grew a row the date bubble landed on the flags it was meant to sit above |
| `fitFlags()` | flips a chip whose box would pass the right edge. ⚠️ It queried **`.dend .dflag` and matched NOTHING, ever** — the flags live in `.deadrail`; `.dend` is the vertical LINE on the overlay. A selector that matches nothing fails silently forever, and merging two chips into one 205px box turned it into a horizontal scroll at 1024px |

### 5.9c.7 Clusters, and the sentence that could not be obeyed

`CLUSTER_PX = 17`. Points inside that distance group into one `.mark.stack`.

🔴 **It used to read "2 releases within 17px at this zoom — zoom in to separate them" for two draws BOTH dated Aug 22.** No zoom separates two points at one coordinate, so the instruction cannot succeed — and it leaked a pixel constant into a sentence a person reads. **Branch on the FACT, not on the pixel condition that triggered the grouping:**

- **same day** → "N releases on Aug 22 — the same day, so zooming will not separate them", `.same` ring, and clicking **selects those rows in the manifest** and scrolls to them. That is the action actually available.
- **merely close** → "N releases within N days of each other", and clicking zooms to their span.

### 5.9c.8 🔴 CONCURRENCY IS NOT A DEFECT

**Sixteen "X and Y overlap · Show both" boxes rendered below the Track, taller than the Track itself, and NINE were playlists overlapping playlists** — while the same page drew a load ribbon whose entire purpose is to show several running at once. **Two features on one screen disagreeing about whether the same fact is a problem.**

Capping at three would have hidden the symptom and kept the contradiction. **The rule changed instead:** overlap is a finding only where the lane's own semantics make it one — `LANE_KIT[key].overlapMatters`. Two draw WINDOWS open at once is a real conflict, because a player cannot tell which draw they are buying into. Two events, or two playlists, is Tuesday. **16 → 2.**

---

## 5.9d PATCH NOTES ARE NOT A LANE — the Season Record

A patch note is a **publication**, not a state with a duration. `models/PatchNote.js` gives it a `releaseDate` and no end, and `isEventEnded()` returns false for it forever. Every other lane answers "when is this ON?"; this one answers "what was said, and when".

### 5.9d.1 It does not stretch the axis

`dataBounds()` excludes publications via `isPublication(it)`. The live season publishes **Jul 6 and Jul 22 while nothing is scheduled before Aug 6** — including them spent the left third of the canvas on empty time. The axis now opens **Aug 4** instead of Jul 3, and reads "48 days shown" instead of 82.

⚠️ **This is the same rule the deadline REACH already applied to outliers AHEAD of the content and never to outliers behind it.** Fixing the right edge and not the left is the instance-not-the-class failure, inside the same function.

### 5.9d.2 The instrument — three variants were built, one was chosen

| Variant | What it was | Verdict |
|---|---|---|
| **A · release ledger** | horizontal spine, evenly spaced nodes oldest→newest, current note in its own bordered card | recommended; not chosen |
| **B · vertical rail** | stacked newest-first: mark · title · date · image count · `CURRENT`/`HISTORY` | ✅ **Harkirat's pick** |
| **C · filmstrip** | real Cloudinary banner thumbnails, newest largest | technically fine — the images are Cloudinary `f_auto,q_auto` URLs, not the expiring `media.discordapp.net` links the calendar banners use — but the art is **dense text screenshots**, unreadable at 82px and pure noise |

**Shipped (B):** `.rec.rec-b` under the Track, inside `viewTrack`'s markup so it re-renders with the view and appears only on Track. `.rec-row` grid `20px 1fr auto auto auto`; the newest carries `.cur`, a filled `--patch` mark with a 4px halo and the `CURRENT` tag; the rest read `HISTORY`. `+ Publish` opens the composer pre-typed to `patchNotes` — **creation lives where the thing lives**.

### 5.9d.3 What did NOT move

Patch notes **keep their row in the Manifest and their chip in the legend**. Only the Track lane went. `F.LANES` still has six entries; the Track render filters `l.key !== 'patchNotes'` and nothing else does.

⚠️ **`addItem` stages a patch note as `patchnote.addSeason`, not `draw.add`.** `kind === 'point'` is true for three lanes and they are not all draws — `OP_FOR` maps lane → op explicitly.

---

## 5.9e THE CHECKS — and why the audit could not see any of it

**Every defect found on 2026-08-24 was visible in one second of looking and invisible to every check this package ran.** The audit asserts things about elements someone already thought about; a person's eyes scan the whole surface with no prior about what should be there. **The verification was component-scoped; the defects were surface-scoped.**

### 5.9e.1 The four commands

| Command | What it does | Self-test |
|---|---|---|
| `npm run portal:gate` | op names, permission scopes, model fields, tiers — and it scans `COMPANION.md` itself, in code form and in prose | `--self-test`, four probes each proven able to fail |
| `npm run portal:refs` | identifiers **called but never declared**, per file | `--self-test` renames a real function and asserts it is caught |
| `.sweep.html?self=1` | the **surface sweep**, 8 pages × 5 widths | plants a clipped node and asserts it is caught |
| `.audit-all.html?w=` | the per-page `__selfCheck` | `interactions` under `?audit=1` |

### 5.9e.2 The seven surface invariants

Each was derived from a real defect by asking: *what generic rule, applied to every element with no knowledge of what it is, would have caught this?*

| Invariant | Fires when | Caught |
|---|---|---|
| `overridden` | an inline `height`/`width` differs from computed by >2px | the `.col` collision — a 220px void |
| `cut` | `scrollWidth > clientWidth`, overflow hidden, no ellipsis; and any placeholder measured wider than its field | "We⋮", "Gunsm", "2 bui…", six realms' placeholders |
| `flood` | >8 siblings that **each read as a BOX** (own border + ≥6px padding) | sixteen overlap warnings |
| `monochrome` | N siblings carrying their own `--c`, N distinct labels, one colour | five identical red palette dots |
| `flush` | flow neighbours of one class touching with no gap and no rule | the announcement cards |
| `spill` | past its scroll container **at ≥1024px**, where there was room | the armory table scrolling sideways |
| `ajar` | a drawer, scrim, menu or dropdown open after load | the palette, on all eight realms |

**Every exclusion is a measurement, not a guess** — and the tuning was most of the work:

- `.sr` is screen-reader-only and clipped **by design**; reporting it is the probe misreading the page.
- **Repetition is not the defect, separate BOXES are.** 31 table rows are a table, nine list items are a list, ten `<code>` spans are prose — sixteen bordered padded blocks are more alarms than anyone can act on. So the test reads each sibling's own computed border and padding rather than maintaining a blocklist of class names.
- **A Track lane is SUPPOSED to be one colour.** Colour carries topic, so thirteen draws sharing the draw hue is the rule working.
- **A wide table scrolling on a phone is the design; the same table scrolling at 1280 is a defect.** The discriminator is whether there was room.
- The scrubber's density strip is a **plotted series**, not stacked cards — `position:absolute` siblings are excluded from `flush`.
- **An EMPTY placeholder cannot fail to fit** — the probe was arguing with the fix it had asked for one run earlier.

### 5.9e.3 The audit's new rules (5b–5f)

| Rule | Asserts |
|---|---|
| 5b | nothing a person must read lives in a native `title` (>24 chars without `data-tip`) |
| 5c | no label truncates while there is room beside it |
| 5d | no text sits on an image without a plate |
| 5e | the command bar is **CALLED**, not looked at — `items()` must return a non-empty list without throwing |
| 5f | **real computed contrast** on every rendered text node, against the **actually composited** background. 4.5:1, or 3:1 at ≥18.66px or bold ≥14px |

Rule 5f found four on its first run, every one `--ink4` used as TEXT when the ink scale is **three text tones and `--ink4` is non-text**: ⌘K at 3.46:1, Home's index at 3.02:1, the lane count at 3.02:1, and an outside label at **1.41:1**.

### 5.9e.4 🔴 THREE PROBES REPORTED CLEAN WHILE BEING INCAPABLE OF FAILING

All three were written the same day, and each was caught only by deliberately trying to falsify it:

1. **The reference probe** built its `declared` set with a regex matching `name(` — which is every **call site** — so everything called was also "declared" and nothing could ever be missing. It printed a green tick one commit after `drawComposeGhost` had been missing all day.
2. **The contrast probe** measured a **semi-transparent** background as opaque, reporting a lavender chip on a dark row at 1.59:1 — *a number not physically possible for that pair*, which is the tell that the probe rather than the page was wrong. After compositing was added it then failed to **premultiply the first layer** and produced the same class of nonsense again.
3. **The sweep** ran a light-mode pass that was really a second dark pass — `data-theme` does nothing here, and the body background measured identical under both. **Forty renders reported a pass on a mode that never rendered.**

**So every probe in this package carries a falsifier that runs on every invocation.** A probe that cannot report PRESENCE is not evidence of absence.

⚠️ **Hardening the reference probe was itself instructive:** 103 raw hits → strip comments and string literals → most were **English**, from prose like "the window (meaning the visible span)". A checker that cries wolf a hundred times gets muted, which ends where having none ends. A page and the assets it loads are **one runtime scope**. The six survivors are all false and are listed in `KNOWN_FALSE` — **written down rather than silently filtered**, because suppressing the category would hide a real one later.

### 5.9e.5 ✅ THE PORTAL IS DARK-ONLY — a decision, not a gap

**Harkirat, 2026-08-24:** *"we don't need a light mode inside of the portal. it will remain dark mode only. the light mode is only a real thing to check for the other parts of the dioreo.app website, such as the legal pages."*

Do not re-add a theme axis to the sweep. The published SITE is where light mode has to be checked, and that is a different surface with its own build (`scripts/buildLegalPages.js`).

---

## 5.9f HOME IS TRIAGE, NOT A DIRECTORY

**Before:** five identical cards in a 3+2 grid with a hole in the last row, ~40% of the viewport empty below them, and five orange badges of identical weight — `16 TO REPAIR`, `33 NEED REPAIR`, `1 NEVER ENDS`, `9 SCOPES HELD BY ONE PERSON`, `23 ERRORS PINGED`. **When five things are all alarms, none is.** The page is titled *"What needs you"* and nothing answered it in priority order. It had **zero buttons in `main`** — it named five problems and offered no way to act on one.

### 5.9f.1 The attention list

```
.att-list   <ol>, 1px gaps, first/last rows carry the 11px corner radius
.att-row    grid 34px 3px 1fr auto  →  index · severity bar · fact+realm · verb
.att-i      the rank, tabular, --ink3
.att-b      a 3px full-height bar in var(--sev) — the severity LADDER, not five equal alarms
.att-x b    the fact, 14.5px/600
.att-x em   the realm, 10px --data uppercase
.att-go     .pill.sm — the verb that fixes it
```

**Severity is a property of the KIND, not of the count** — 33 builds needing a caption is not more urgent than one scope only one person can use. The count only breaks ties.

| Kind | Weight | Colour | Line |
|---|---|---|---|
| `conflict` | 95 | `--warn` | N items run past the season's own deadlines |
| `spof` | 90 | `--del` | N scopes held by exactly one person |
| `error` | 80 | `--del` | N errors pinged |
| `repair` | 60 | `--patch` | N builds / season items need repair |
| `forever` | 50 | `--ink4` | N announcements never end — oldest up Nd |

**The numbering is real information** — these are in priority order and the order is the point. (Per the frontend-design rule: numbered markers are only appropriate when the content genuinely is a sequence.)

**The empty state names what it means:** "Nothing needs you right now. / Every realm matches what the bot is serving." — never "Nothing here".

### 5.9f.2 The realm strip

Once the findings moved up, the cards became a **way IN**, not a second alarm surface — a card repeating a fact from the list is the same fact twice at two different weights. Only a **staged** count survives there, because that is the one thing the attention list deliberately does not rank: it is your own unfinished work, not a fault.

`.hgrid.quiet` is **five across in one row** (3 at ≤1180, 2 at ≤720, 1 at ≤460). The 3+2 grid left a hole in the second row for no gain.

---

## 5.9g ARMORY — the tier board that did not read as tiered

| Defect | What it looked like | Fix |
|---|---|---|
| **Six pairs of apparent duplicates** | LOCUS/LOCUS, DR-H/DR-H, HS0405/HS0405, LK24/LK24, HVK-30/HVK-30, SWITCHBLADE X9 ×2 — adjacent cards with identical titles, told apart only by a stored `buildName` that is an INDEX ("Build 1", "Build 2"). The DATA is right; the presentation asked a reader to spot a one-character difference between two identical rectangles, which reads as a duplicate-render bug | `groupChips()` — siblings of one weapon in one tier render as **one `.bgrp`**, weapon named once, builds inside. Inner elements stay `.bchip`, so drag-to-rerank is untouched |
| **No visual ladder** | ★ / T3 / T4 / T5 / — all identical weight, so the one thing a tier board exists to express was the one thing it did not show | `.trow.t-best` gets a `--patch` wash and a 20px key; T3 17px, T4 15px, T5 14px, unranked `.72` opacity. Cards dim `.94` / `.86` down the ladder and return to full on row hover |
| **Headers floating in ~110px of dead space** | key, count, label and note as four separate blocks, the key optically centred while everything under it was left-aligned | `.trow-h` is a 3-area grid (`k n` / `t t` / `note note`), `align-self:start`, so the block hangs from the top and the row's height follows its contents |
| **The same sentence three times** | "ranked within its own category, not across the armory" on T3, T4 **and** T5 — and again, in full, under the whole rack. Four copies of one fact, each taking a third of its row's header height | only `best` and `unranked` keep a note; the shared fact lives once, in `.racknote` |
| **The table scrolled sideways** | the WEAPON column slid under the panel edge and the first thing you read became "APON" | the BADGES cell held a `nowrap` `.tiers` group at 122px in a 104px cell, forcing the table 65px wider than `.mscroll`. Badges wrap now, right-aligned. **A table whose last column cannot wrap makes the whole table horizontal**|
| **…and it scrolled again at 1024** | the manifest overflowed by 58px at the width Harkirat actually uses — between the two the old audit tested | the `<colgroup>` minimums summed to **960px** (38+210+118+170+130+190+104) against a 902px content area. Trimmed to **832**. ⚠️ **832 is NOT the effective floor — `.mtable{min-width:860px}` still binds**, so the real minimum is 860 and trimming columns below that buys nothing. Recorded because the commit that made this change reasoned from 832 and would have misled anyone trimming further |
| **`+ Add build` below the fold** | at 1208px in an 828px viewport, under a filter row, on the realm that manages 133 builds | promoted to the masthead; the in-table button stays as the shortcut for when you are already scrolled there |
| **Placeholder cut mid-word** | "Weapon, build, attachment or Gunsm" | shortened, full sentence on `aria-label` — then generalised into `Shell.fitPlaceholders()` |

---

## 5.9h BROADCAST AND ACCESS — the smaller realms

**Broadcast.** Two `.dcard` previews stacked **flush**, so two separate announcements read as one block with a colour change in the middle (`.dcard + .dcard{margin-top:12px}`). And the text was cut mid-word — "…and the battle pas", "Use /draw calculator to" — on a card whose stated job is *"the bot's OWN render shape — a truthful preview"*. **A preview that silently drops the end of the sentence is not truthful;** Discord shows the whole thing. `.dcard h6` no longer clamps.

**Access.** The orange ring on a column header was **the most loaded mark on the page and the only one not in the key** — it flags a scope exactly one person besides the owner holds, which is the finding Home ranks *second out of everything in the portal*, and a reader had no way to learn that. `.klg.spofk` now states it, and every column header carries a `data-tip` naming the scope and its status. The two column groups (`COMMANDS` / `/MANAGE PAGES`) also gained a real gutter — a group needs separation, not just a caption.

---

## 5.9i THE SCROLL BUG — and the probe that could never have found it

🔴 **`main` IS THE SCROLL CONTAINER.** `app.css`: `main{overflow:auto;padding-bottom:96px}` inside `.app{display:grid;height:100vh}`. **Consequence: `window.scrollY` is ALWAYS 0 and `document.documentElement.scrollHeight` ALWAYS equals `innerHeight`, on every portal page.**

A previous investigation read exactly those two numbers, concluded *"there was nothing to scroll"*, and closed a reproduced bug as non-reproducible. **Both numbers were healthy and neither could ever have shown the fault.**

**What is measured:** on a cold load, Season lands at exactly `scrollHeight - clientHeight` — the precise bottom — with ~39 manifest rows inserted after first paint. **Five of five cold loads; zero of roughly fifty once the assets were warm.** Width is NOT the variable: 900px is clean when warm, so an early "narrow viewports only" reading was confounded with warm-up and is withdrawn.

**What is NOT measured:** which late mechanism moves it. Scroll anchoring, a restored offset and a stray focus all produce this signature and none was isolated.

**So the fix is the one that holds for all three:** `Shell.holdTop()` asserts the opening position once the first render and the font reflow are done, and **stands down the instant a real user gesture arrives** (`wheel`, `keydown`, `pointerdown`, `touchstart`, capture) so it can never fight someone scrolling. It self-disarms after 4s regardless.

**The general lesson, which outlives this bug:** when a probe returns well-formed healthy numbers for a fault a person can see, **suspect the probe is reading a different element before suspecting the report.** Ask which element actually scrolls, paints or sizes — and read THAT one.

---

## 5.9j DELETE AND EXPORT — the two verbs the portal exists for

> Harkirat, 2026-08-24: *"THE ENTIRE PORTAL SHOULD BE THE BETTER DATA MANAGEMENT, CREATION, EDIT, DELETE, EXPORT, ETC METHOD FOR MANAGING THE CONTENT INSIDE THE BOT. i want it to make /manage trivial."*

### 5.9j.0 The measurement, and the correction to it

`.verbs.html` (in the package; a probe that plants the words `DELETE EXPORT PURGE` into every page and re-reads, so its silence is only trusted after it has proved it can report presence) across all eight pages at 1280×860:

| page | delete | export | checkboxes | selection bar in DOM |
|---|---|---|---|---|
| index | 0 | 0 | 0 | 0 |
| season | 0 | 0 | **40** | 0 |
| armory | 0 | **1** | **32** | 0 |
| broadcast | 0 | 0 | 0 | 0 |
| access | 0 | 0 | 0 | 0 |
| review | 0 | 0 | 0 | 0 |
| analytics | 2 | 0 | 1 | 0 |
| door | 0 | 0 | 0 | 0 |

Against `core/ops`, which registers **thirteen destructive op types** — `draw.delete` `draw.bulkDelete` `draw.purge` `calendar.delete` `calendar.bulkDelete` `calendar.purge` `loadout.delete` `loadout.bulkDelete` `patchnote.removeSeason` `patchnote.purge` `season.startNew` `season.discardDraft` `announcement.delete` — and `utils/manageActions.js`, which registers **nine export actions**.

🔴 **THE DEFECT WAS NOT ABSENCE. IT WAS DISTANCE — and that is why every check missed it.** Season and Armory both *built* a selection bar containing "Export selection" and "Stage deletion". Each rendered into a `<div id="bulk">` sitting in normal document flow **after a 39-row table**. Measured: selecting the first row put every verb it unlocked **1,682px below the fold**. The word "delete" was missing from the page text only because that container is `[hidden]` at rest, so a census counting markup would have reported the feature covered.

**The user selected two rows, saw two checkmarks and no consequence, and reported delete and export as missing. He was right.** An affordance nobody can see does not exist. Anything built on top of the opposite reading — "it's there, it just needs surfacing" — would have been polish on a feature that functionally was not present.

**The rule this encodes, and it generalises past this bug:** *an action unlocked by a selection is shown where the selection happened.* Docked to the viewport, never in document flow.

### 5.9j.1 The spine: reversibility, which `core/ops` already graded

`core/ops` grades every operation by whether it can be taken back, and the grades are not decoration — they are the interaction:

| tier | meaning | examples | how the portal treats it |
|---|---|---|---|
| **1** | an exact inverse was captured at apply time | `draw.delete` `calendar.delete` `loadout.delete` `announcement.delete` | one confirm, plain words, **not red-alarm**. Undo lives in the tray |
| **2** | same, but wide | `*.bulkDelete` `season.discardDraft` | one confirm that **lists what goes** |
| **3** | one-way | `draw.purge` `calendar.purge` `patchnote.purge` `season.startNew` | its own strip at the foot of the realm, behind an **export gate**, then a **typed** confirm |

🔴 **A DELETE IS TIER 1, AND THE DIALOG MUST SAY SO.** `core/ops` captures the whole document before removing it, so the inverse is exact. Three surfaces had previously typed a delete as tier 3 because deleting *feels* destructive. A portal that treats a reversible delete as a crisis trains its operator to click through the one that is not — which is precisely the click you need them to read.

🔴 **THEREFORE EXPORT IS NOT A SIDE FEATURE. IT IS THE SAFETY INTERLOCK FOR PURGE.** `Store.blocked()` already refused to commit a tier-3 op that did not carry `exported`, and `review.html` already rendered that gate. Everything downstream of a delete existed — the op, the tier, the staging, the inverse, the Review diff, the interlock. **The only missing piece was the affordance**, which is why building this was wiring rather than invention.

### 5.9j.2 `Shell.selection()` — the docked bar

```js
Shell.selection({
  count,          // 0 dismisses it; any other value is one full repaint
  summary,        // the realm speaking in its own terms, never "2 rows"
  tier,           // the HIGHEST tier in the selection — it sets the badge
  badge,          // OPTIONAL per-realm sentence; see the warning below
  noun = 'selected',
  clearLabel = 'Clear',
  actions,        // [{ label, kind:'danger'|'normal', on() }]
  onClear
});
```

| element | value | why |
|---|---|---|
| `.selbar` | `position:fixed; left:var(--rail-w); right:0; bottom:0; z-index:42` | above content (1) and the sticky header (40), **below the scrim (44)** so a drawer covers it rather than a bar floating over a modal |
| entrance | `transform:translateY(130%)` → `none`, `var(--dur-3)` `var(--ease)` | it arrives from where it lives, so its position is learned once |
| `.selbar-in` | `max-width:1060px`, `border-radius:11px`, `background:var(--raised)`, `box-shadow:0 20px 46px -18px #000` | a raised object over the page, not a band welded to the bottom |
| `.selbar-n` | `19px var(--data)`, `color:var(--staged)`, `min-width:30px` | the count reads as a **figure**, because it is the one number the bar is about |
| `.selbar-rev` | pill, `--ok` when reversible, `--danger-ink` + `--danger-edge` when gated | answers *"can I take this back?"* **at the moment of deciding**, the only moment the answer is worth anything |
| `body.has-selbar .tray` | `translateY(-78px)` | the tray steps up rather than either surface hiding the other |
| mobile ≤768px | `left:0; bottom:58px`, summary and badge hidden, actions go full-width | the bottom tab bar owns the bottom edge |

🔴 **THE BADGE IS PER-REALM AND A DEFAULT SENTENCE CAN BE A WRONG ONE.** The first version always printed *"reversible · undo stays in the tray"*. Access uses this bar for permission edits, which do **not** go through the tray — `portal/api/access.js` writes them directly, a documented decision (§5.9j.5). So the shared component printed a false statement on a realm that used it. A shared component may carry a default; it may not carry one that is false where it is used. Access passes `badge:'written directly · not staged'`, or `'deletes N admin records · no undo'` when a revoke would empty someone.

**Escape now means one thing at a time:** a drawer is modal and wins; otherwise Escape clears the selection.

### 5.9j.3 `Shell.Export` — the panel, the ledger, and the real file

```js
Shell.Export.has(scope)        // has a real file been produced for this scope THIS session
Shell.Export.at(scope)         // when — the typed confirm quotes the time back at you
Shell.Export.mark(scope, meta) // record it, and unblock staged tier-3 ops naming this scope
Shell.Export.file(name, text)  // Blob + <a download>, revoked after 4s
Shell.Export.panel({ title, note, scopes, focus })
```

A scope is `{ id, label, note, count, unit, file, build() → string }`. `Shell.mastheadExport({ host, scopes, summary, label, note })` mounts the "take out" line **after** the realm's create control, as ONE implementation — Season wrote it inline first, and the moment Access and Broadcast needed the same line that inline copy became the first of five that could drift.

🔴 **`mark()` IS DELIBERATELY STRICT.** An earlier draft also unblocked ops carrying **no** scope, reasoning that a scopeless op could not be matched anyway. That is the shape of a silent wrong result: it would have opened the one-way gate on the strength of an unrelated download. An op that cannot name what would restore it is a hole, so it is `console.warn`ed, never papered over.

🔴 **THE INTERLOCK HAS TWO HALVES AND ONLY ONE EXISTED.** `mark()` stamps ops **already staged**. The one-way strip literally instructs the opposite order — *"Export first →"*, then the verb unlocks — so exporting first and staging second produced an op `Store.blocked()` counted as blocked **with no way left to satisfy it short of exporting the same file twice**. Measured end to end before the fix: export the calendar, purge the calendar, and Review still said *"1 tier-3 change needs an export"*. `Store.add` now answers the same question at staging time. The gate is *"does a copy of this data exist in this session"*, so both entry points must answer it.

**Export placement is three surfaces, one component:** the masthead line (realm-wide scopes) · the selection bar (`Export N`, exactly what is selected) · the one-way gate (`Export first →`, opening the panel **focused** on the scope that gate needs, via `focus:` → `.exs-i.focus`, a `--patch` ring).

**Review deep-links rather than exporting.** A tier-3 op on the commit screen offers `Export in Season →` pointing at `season.html#export=season.calendar`; `mastheadExport` honours that hash **once** and `history.replaceState`s it away, or every later re-render would reopen the drawer on top of the reader. Review holding its own copy of five export builders is how the package got two disagreeing answers to *"has this been exported?"* in the first place.

### 5.9j.4 `Shell.oneWay()` — the strip, and the hazard rail

At the **foot** of the realm, deliberately: the end of the page is where a reader has already seen everything the operation would destroy.

```js
Shell.oneWay({ host:'#oneway', exportScopes, items:[
  { id, title, note, count, unit, scope, op, confirmWord, onRun }
]});
```

The button **is** the interlock: `Export first →` (`.pill.ghost`) until `Export.has(scope)`, then the verb itself (`.pill.dang`). It repaints on the `dioreo:export` event, so the gate opens the instant the file lands.

| element | value | why |
|---|---|---|
| `.ow` | `border:1px solid var(--danger-edge)`, gradient `--del` 9% → transparent at 58% | a boundary being crossed, not a red box someone drew |
| `.ow::before` | `width:9px`, `repeating-linear-gradient(135deg, --del 62% 0 5px, transparent 5px 10px)`, `opacity:.85` | **the hazard hatch rail is the whole visual argument.** A real-world convention for a boundary, one pseudo-element, and it lets the panel itself stay quiet enough to read. This is the strip's one accessory; everything inside it is ordinary type |
| `.ow-k` | `--danger-ink` on `--del` 15%, bordered chip | the eyebrow was a bare 9.5px word and disappeared |
| `.ow-c` | `min-width:88px; text-align:right` | the count sits **next to** its button rather than floating mid-row |
| `.ow-i .pill` | `min-width:126px` | the gate button does not change width when its label changes from "Export first →" to the verb |

**Season's five**, all from `core/ops`: purge new draws · purge returning draws · purge calendar · purge patch notes · start a new season. `season.discardDraft` is **tier 2** and deliberately NOT here — it lives with the draft it discards. Armory has no tier 3 at all (`loadout.bulkDelete` is tier 2); Broadcast and Access have none.

**Even a one-way op STAGES rather than firing.** Review is the only place anything is written, and a purge that skipped it would make the commit screen a partial record of what the portal did.

### 5.9j.5 `Shell.typedConfirm()` — and where it is NOT used

Disabled until the typed word matches (case-insensitive, trimmed). Used **only for tier 3**: asking someone to type a word for a reversible change teaches them to type it without reading, which is worse than not asking.

The one exception outside tier 3 is Access, and it earns it: a batch of revokes that would leave an `AdminUser` holding **nothing** is not a permission change — the matrix's own note states *"A permissions array is never allowed to be empty — an admin with nothing granted should be revoked, not parked in limbo."* So that save **deletes the record**, the confirm says so in those words, and it asks for the id.

🔴 **The invariant is enforced at save, not at click.** Refusing the click would leave the operator holding a change they meant and no way to express it. Emptying someone is a real intention; it just means something bigger than a permission edit.

### 5.9j.6 `Shell.removeCell()` — the per-row control

```html
<td class="ra"><button class="rmv" data-rmv aria-label="Remove …"><svg …/></button></td>
```

A **real column with a real header** (`<th class="ra"><span class="sr">Remove</span></th>`), on Season, Armory and Broadcast.

- **Not a hover reveal.** It does not exist on touch and cannot be scanned.
- **Not a `⋯` menu.** Harkirat, on exactly this pattern elsewhere: *"why are these buttons still buried in a 2 click step? WHY NOT JUST SHOW THEM ALL OUTRIGHT?"*
- `color:var(--ink3)` at rest — **5.35:1, over the 3:1 non-text floor**, so it is findable — taking `--danger-ink` + `--danger-edge` + a `--del` 13% wash on hover and focus. `--ink4` would be 3.02:1: legal for a graphic, but this one has to be *found*, not merely perceived.
- Every wiring site calls `e.stopPropagation()`, or the row click behind it opens the detail drawer underneath the confirm.
- **The `colspan` on each table's empty row moves with the column.** Season 6→8, Armory 7→8, Broadcast 5→6. A stale colspan is invisible until the table is empty, which is the state nobody looks at.

### 5.9j.7 Access — click-to-toggle

> Harkirat: *"why can't i just directly click these boxes to give/revoke access and then just click an overall 'save' at the end somewhere"*

Before this, the matrix was 8 scopes × N admins of `role="img"` spans: it **displayed the answer to the question the realm exists to answer and could not change it.** Every edit went through a drawer, one admin at a time.

| decision | shape | why |
|---|---|---|
| clicking | free, no dialog per click | the tray is for work that crosses realms and commits together; permissions are one write to one collection |
| pending | `.mxcell.pend` — `box-shadow:0 0 0 2px var(--desk), 0 0 0 3.5px var(--staged)`; `.pend.off` adds a `--danger-ink` bar | the fill shows **what it will be**; the dashed `--staged` ring marks it unsaved — the same language the Track uses for staged bars, learned once |
| saving | ONE Save → ONE confirm, grouped `Granting N` / `Revoking N` (`.acg-k.on` / `.acg-k.off`) | reading the whole diff once is what makes a batch **safer** than eight separate yes-clicks |
| typed id | only when a revoke empties someone | §5.9j.5 |

🔴 **AN INHERITED CELL IS NOT TOGGLEABLE, AND SAYING SO IS THE POINT.** It is filled by a bare `manage` token covering every page at once, so "revoking" it here would silently mean revoking `manage` — a far wider act than the cell describes. Clicking one explains where the grant comes from and offers the editor, `cursor:help`.

Access also gains a **row-level revoke** (`.mxact` beside Edit) and an **audit export** — three scopes, and note that `utils/manageActions` registers no permissions export at all. The portal is not limited to what the Discord panel can do, and *"who could do what, on this date"* is the single most useful thing to be able to hand someone later.

### 5.9j.8 Analytics — export only, and it says so

Nothing in Analytics is destructive: `core/ops` registers no analytics operation, and `AnalyticsEvent` expires on its own TTL. So this realm gets export and **no delete** — the honest shape rather than a symmetric one. It has no create control either, so `#mhAnchor` is a zero-height stand-in occupying the same grid cell `.mh-new` uses elsewhere, and the take-out line lands in the same place on every realm.

🔴 **THESE DO NOT ROUND-TRIP, AND THE PANEL SAYS SO.** Every other export is checked byte for byte against `utils/adminParser.js` because something re-ingests it. Nothing re-ingests analytics: the destination is a spreadsheet, so the format is **RFC-4180 CSV** and the note states that rather than implying a symmetry that does not exist. `mastheadExport` derives that note from the scopes themselves (`every(x => /\.csv$/.test(x.file))`), so a realm that later adds a CSV scope cannot forget to change its own copy.

Quoting is not reflex: a search **term** is arbitrary text a player typed, and a change-log **summary** is a sentence with a quoted title inside it (`Added new draw "Test Draw"`). Those are the two columns most worth exporting and the two most likely to break a naive join.

### 5.9j.9 `npm run portal:roundtrip` — the gate that found two wrong formats

Every export claims, in its own copy, that pasting it back restores the data exactly. **Nothing checked that, and nothing could:** an export's output is written to a file and never read again by anything in the package, so a wrong format looks correct by construction and stays wrong indefinitely.

The gate lifts the **shipped source** out of the `.html` files between literal markers and runs *that* — never a retyped copy, which would prove only that the copy matches — then runs the bot's own `utils/adminParser.js` over the same fixture documents and compares byte for byte.

**What it found on its first run:**

1. 🔴 **Armory was emitting the RETIRED seven-segment pipe line.** `parseBulkLoadoutList` was rewritten to a labelled block on 2026-08-22 and **explicitly does not re-read the old shape** (Harkirat's no-back-compat call — under the old positional reading `AK117 | ar` half-parses into a weapon literally named "Weapon"). The mockup's format-guide drawer taught the retired shape to the reader as well. **Mode is also gone from that format, and removing it was itself a bug fix:** the parser demanded a segment `upsertBulkBlocks` overwrote with the page's own mode, so exporting DMZ builds and pasting them on the MP page silently reassigned every one.
2. 🔴 **Season's patch notes joined entries with a blank line;** the bot joins with `\n\n---\n\n`. And it read `titleOverride` where the bot reads `title`.

Two of four formats would have failed on paste-back — at the exact moment an export matters, and the only moment nobody is watching.

**The gate carries two falsifiers and FAILS the run if either stops working:** a one-character change to an input must be detected, and a naive comma-join must be rejected by the CSV reader. A check that cannot fail is not evidence — three probes shipped clean and structurally incapable of failing in this package on 2026-08-24 alone.

Current: **5 formats byte-identical + 7 adversarial CSV cells, both falsifiers passing.**

### 5.9j.10 Five more defects the same pass surfaced

1. 🔴 **`.ghost` was the ninth generic class collision.** `.ghost{position:absolute;top:50%;transform:translateY(-50%);height:22px}` is the **Track's drag preview** and it held the most generic name in the package. `.pill.ghost` sets only border and colour, so all four of those properties leaked straight through it — **a higher-specificity rule wins only the properties it SETS.** The variant had been unusable since the day it was written and nothing had used it, so nothing reported it; the first real use stacked five one-way buttons on top of each other at (93,445), over the Track, ~2,900px from the strip they belong to. Renamed to **`.tghost`**. Roster now: `.now .left .tbd .k .tk .ed .col` `window.frames` `.ghost`.
2. 🔴 **Review kept a second export ledger.** `st.exported = {}` page-local, while `Store.blocked()` read `o.exported`. Measured: `blocked() === 0` while the commit screen said an export was still required and refused the commit. **Two answers to one question, and the screen that decides was reading the wrong one.**
3. 🔴 **Two row shapes in one store.** Season and Broadcast staged `{field, was, becomes}`; Armory staged `[field, was, becomes]`; Review read `r[0] r[1] r[2]`. Every object-shaped op rendered its whole diff as em-dashes — **a commit screen showing an empty table for a change it was about to make**, the one thing that screen exists not to do. Neither shape was wrong; having two was. Normalised in `Store.add`, the choke point every staging path already passes through, so no page had to be migrated to be correct.
4. 🔴 **Review was not in the rail.** The only surface that writes anything was reachable only through the tray — which requires staged work to exist, so the commit screen was unreachable from a page with nothing staged, exactly when you would want to check that nothing is staged. It now sits **below a `.rail-rule`**: five realms are places to work, Review is the way out, and a divider says that without a heading nobody would read at 9px. **And the staged count sat on Season** whatever realm staged the work — it is a property of the changeset, so it moved to Review.
5. 🔴 **The tray covered controls, and collapsing hid its verbs.** `position:fixed` bottom-right, **320×269 expanded**, it sat on the one-way strip's last button and on Access's last three scope columns. Three changes: it **defaults to its summary** (a status object states the summary and keeps its verbs; the detail folds away), `.tray.collapsed` no longer hides `.tray-f` (you used to have to expand before you could discard), and it **reserves its own space** through `Shell.reserveForTray()` driven by a **`ResizeObserver`** — a one-shot `rAF` after `renderTray` measured before webfont metrics settled and left the overlap live often enough to matter.

**And one lie:** Season's old export ran a 700ms `setTimeout` and toasted *"Exported N items in Bulk Add format"* while producing no file at all. A mockup may simplify; it may not claim an outcome that did not happen. That is the same defect class as a probe reporting clean without being able to fail.

### 5.9j.11 Tiers are DERIVED, never typed, where the op is dynamic

The schema gate flagged three new staging sites stating `tier:` beside an `op` held in a **variable** (`removeOne` picks `draw.delete` or `calendar.delete` per row; `stageOneWay` takes the op as a parameter). The gate cannot resolve a variable statically and correctly refuses to accept a tier it has no way to check.

**The fix is not to teach the gate the shorthand — that would stop the report while leaving the tier unverified, which is a vacuous pass.** `Store.add` and `Shell.confirm` both derive the real tier from `FIX.OP_TIERS`, so the sites simply stop stating one. `Store.blocked()` still finds tier 3 because it reads the derived value.

---

## 5.9k MOTION — three moments, and the rail icons

### 5.9k.0 The standard, which was already written down

`tokens.css`: *"Motion earns its place by explaining where something came from; anything that is not doing that stays a colour fade."* One easing (`--ease`), three durations (`--dur-1` 130ms state · `--dur-2` 180ms transition · `--dur-3` 320ms entrance).

**The premise of Season is a TIMELINE and it never animated time.** Zoom teleported, NOW was a static gold hairline, and an item you had just staged simply *existed* on the next frame. Three moments were added; anything that could not answer *"what does this explain?"* is deliberately not here.

### 5.9k.1 Zoom interpolates — and why a CSS transition works at all

🔴 **Zoom and pan do NOT rebuild the Track.** They call `repositionBars()`, which rewrites `left` and `width` on the **same nodes**. So the browser can interpolate them, and **object identity survives the view change** — which is the textbook justification for animating a view change, and the reason this is worth doing rather than decorative. *If a later change ever makes zoom rebuild `innerHTML`, this silently stops animating and would need FLIP.*

🔴 **It is opt-in per change, not a standing transition on `.bar`.** A trackpad pinch fires **tens** of wheel events; a 320ms interpolation restarted on each lags the gesture by a third of a second — the pointer stops and the bars keep sliding. So `withMotion(fn)` adds the class only around a **discrete** change and removes it after 380ms:

| animated | not animated |
|---|---|
| `−` / `+` / `FIT` buttons · `+` `-` keys · command-bar Zoom in/out · zoom-to-cluster | ruler drag-to-pan · ⌘-wheel pinch · horizontal-wheel pan · dragging a bar |

**Two defects this shipped with, both found by measuring rather than by looking:**

1. 🔴 **`.tk` IS PER-LANE — there are five of them.** `viewTrack.querySelector('.tk')` returns the first, so the first version animated **one lane while the other four teleported**, which reads as a rendering fault rather than as a missing feature. The class goes on **`.tk-inner`**, the one node containing every lane. *Same defect class as `fitFlags()` querying `.dend .dflag`: a selector that reads as "the Track" and reaches part of it.* Verified after the fix: `.tk-inner.animate .bar` matches **9 of 9**.
2. 🔴 **The `transition` shorthand REPLACES the whole list.** `.bar` already carries `transition:transform .14s, box-shadow .14s, filter .12s` for its hover lift. Writing only `left`/`width` killed that lift for the 380ms the class is on — visible only if you happened to hover *during* a zoom, which is to say never, until it shipped. The rule restates all five properties. Verified: `left, width, transform, box-shadow, filter | 0.32s, 0.32s, 0.14s, 0.14s, 0.12s`.

`.dragging` gets `transition:none` inside the animate scope, and the whole block is disabled under `prefers-reduced-motion` **and** short-circuited in `withMotion` itself, so reduced motion costs nothing rather than animating invisibly.

### 5.9k.2 NOW carries the real clock

🔴 **A literal creeping marker would have been theatre.** At a 48-day window one day is ~14px, so an hour is **0.6px** — a marker that crept would move imperceptibly and say nothing. So the marker states the *fact* instead: `.nowt`, a 9px `--data` readout in `--patch`, tabular figures (or the minute changing shifts the whole string), `pointer-events:none`.

`startClock()` **aligns to the next minute boundary** rather than firing every 60s from load — otherwise the readout can sit up to 59 seconds stale against the wall clock it claims to be.

**The fixture date stays frozen at `F.today` and the clock is real.** Every screenshot of this package must be reproducible, so the *date* is pinned; the *time of day* is not part of what the fixture pins, and a stopped clock beside a live-looking marker is worse than no clock at all.

### 5.9k.3 A staged item ARRIVES

`@keyframes arrive` — `opacity 0→1`, `scaleX(.72)→1` from the bar's own centre, so it grows out of its lane rather than flying in from nowhere. Points get `arrive-pt` (`rotate(45deg) scale(.4)→1`), because a `.pt` is a rotated square and reusing the bar keyframe would un-rotate it mid-flight.

Applied in `addItem()` **after** `renderAll()` (the node does not exist until the Track is rebuilt) inside one `requestAnimationFrame`, and removed on `animationend` with `{ once:true }` so a later re-render cannot replay it.

**Why it earns its place:** without it a staged item is indistinguishable from one that was already there, and the reader loses the object they were looking at — the single most common reason a person re-reads a whole list after adding one row to it.

### 5.9k.4 The rail icons — Armory and Broadcast

> Harkirat, 2026-08-24: *"can you use better, more relevant, icons for 'armory' and 'broadcast'."*

| realm | was | is | why |
|---|---|---|---|
| **Armory** | an abstract stroke assembly (`M3 13h11l3-3h4…` plus a stray circle) | a **weapon reticle** — ring, centre dot, four ticks | the old glyph resolved to nothing at 20px. A rifle silhouette is unreadable at this size in stroke; the reticle is the one shooter-game motif that survives it, and **nothing else in the rail is round** |
| **Broadcast** | a **volume speaker** with one arc | a **megaphone** — cone, handle, two emission arcs | the old glyph reads as *"sound settings"* in every other interface a person has used. Announcements are pushed **out to players**, and a megaphone is the glyph that says "said to everyone" rather than "audio" |

**The test an icon in a five-item rail has to pass** is not "is it pretty" — it is read at a glance, beside its own label, so it has exactly one job: **be unmistakable for the other four.** Checked by rendering all six at 56px side by side (`Season` calendar · `Armory` reticle · `Broadcast` megaphone · `Access` padlock · `Analytics` bars · `Review` lines-and-check) — six distinct silhouettes, no two sharing a dominant shape.

---

## 5.9l THE STATES SWEEP — every surface nobody had ever opened

### 5.9l.0 What was never looked at, and why the existing checks could not have

Every screenshot, every audit run and every design decision in this package had been made against **eight resting states at fixed widths**. Nothing had opened a drawer, clicked a view tab, or rendered a page with no data. That is not a small gap: it is most of the product.

- **The interaction smoke test had never been run once.** `Shell._audit`'s rule 9 drives every declared path that opens a panel and asserts it produced a real title and a non-empty body — gated on `?audit=1`, a flag nothing ever passed.
- **A view that is `[hidden]` at load is audited by nothing.** Season has 3 views, Armory 4, Broadcast 2, Access 2, Analytics 5. Sixteen surfaces, of which the load-time pass reaches five.
- **Empty data had never rendered.** That is where a stale `colspan` lives (invisible until the table is empty — and three *were* stale the moment the remove column landed), and an empty state that teaches nothing, and a stat that reports a count over an empty list.

`.states.html` (`?self=1` for the falsifier) runs **32 passes**: interactions × 8 pages, then every view tab with the full audit re-run against it, then every page under `?empty=1`.

### 5.9l.1 `?empty=1` — a flag, not a second fixture

`assets/fixtures.js` blanks every **record array** when the flag is present.

🔴 **It is a query flag rather than a second fixture file on purpose.** A copy of the fixtures with the arrays emptied is a second thing to keep true, and it would drift the first time a field was added. Blanking the real arrays cannot describe a shape the full fixture does not have.

🔴 **Scalars are NOT zeroed.** `season.title`, the three deadline dates, `OWNER_ID`, the `*_MS` constants. An empty portal is one with **no records**, not one with no configuration — zeroing those would test a state the bot cannot be in.

🔴 **AND THE FLAG SHIPPED WITH THE EXACT BUG IT EXISTS TO CATCH.** The first version wrote a hand-written `{ MP:0, DMZ:0, total:0, weapons:0 }` over `ARMORY_COUNTS`, which really carries `sample` and `needRepair` too — so Home rendered a literal **"undefined of 0 builds"**. A hand-written empty shape is a second thing to keep true, and this one went stale in the same commit that created it. It maps over the real object now (`zeroNumbers`), across nine derived-count objects.

🔴 **AND IT TOOK BOTH NODE GATES DOWN.** `location.search` does not exist in Node, and `.schema-gate.mjs` and `.roundtrip.mjs` both `eval` this file to read the fixtures — so an unguarded reference did not degrade, it threw. Caught by *running* the gates, not by reading the diff: the browser was perfectly happy. `typeof location !== 'undefined'` guards it.

### 5.9l.2 What the first run found

1. 🔴 **`span.bl` in `div.bar.staged` at 3.87:1** — Broadcast's **Airtime** view, which nothing had ever audited because it is `[hidden]` at load. `.bar.staged` paints its label `var(--c)`, but a staged bar is **dashed and hollow**, so the label renders on the lane rather than on a fill — a topic accent is designed to fill a shape, not to carry 10.5px text. **This is the same correction the shipped portal already made for Season's staged bars** (three of four Season accents fail as text on `--paper`: `--ret` 3.63, `--ev` 3.89, `--play` 4.09). The mockup had never received it, in a view no check had opened. `.bar.staged .bl{color:var(--ink)}` — the border already carries the topic.
2. 🔴 **Analytics died on empty data** before `S.audit` ever ran, so the sweep reported *"no `__selfCheck`"* rather than a result. Its two interactions index `F.cmdStats[0].command` and click `tr[data-id]`, both of which throw against an empty fixture.
3. 🔴 **The `?empty=1` bug above**, found by the sweep against its own author.

### 5.9l.3 `when` — because a skipped check must be a visible one

An interaction may now declare `when()`. If it returns false the audit pushes **`note: <name> not applicable (no data)`** into the problem list rather than silently passing.

🔴 **Silence would have been the easy fix and the wrong one.** An interaction check that quietly stops running is exactly the vacuous pass this package has now shipped three times: the run still looks clean, and nothing was checked. A note is visible, greppable, and cheap.

### 5.9l.4 The probe cried wolf, and that is a defect too

The first run reported **10 findings**; seven were the same false positive. The count probe read every `.mh-stats .v` and flagged Season's **"79 days left"** and the tray's **"1 staged"** — both true statements about things `?empty=1` deliberately does not blank (a season still has an end date; `sessionStorage` still holds staged work).

It is narrowed to stats whose own `.k` **label names a record noun** (`items|builds|admins|announcements|events|draws|entries|terms|alerts|commands|changes|tokens|granted|weapons|sessions`), plus `#count` and `.rt`, which are unambiguously "N of M shown" lines.

**A probe that cries wolf trains its reader to skim the real ones**, which is the same end state as a probe that misses them. Both halves of a check matter: it must be able to fail, *and* it must not fail on things that are fine.

### 5.9l.4b And one the empty pass found that has nothing to do with empty data

🔴 **Analytics' river pushed a hand-written boot row unconditionally.** `rows.push({ kind:'boot', at:'2026-08-23 17:17', … })` ran whether or not any boot had been recorded — so with an empty `BootRecord` the stream read *"Bot online — 3.66.0-pre"* beside a header saying **"0 recorded"**.

**The river is a record of what happened; a row it invents is worse than a row it omits**, because a reader has no way to tell the two apart. With real data that row is indistinguishable from a true one, which is why only the empty pass could have found it — and why "we only ever look at the populated state" is a coverage gap rather than a preference.

Also fixed in the same pass: the timing banner made **three** separate assumptions that data exists (`depStats[0]`, the `atlas` lookup, and the reader's need to be told *why* it is empty). The atlas one is not hypothetical — a dependency that has simply never been called is a real state on a freshly started bot, not only a fixture artefact.

### 5.9l.4c PASS 4 — keyboard reachability

Nobody had ever tabbed through a realm. The audit checks that a **focus-visible style exists**; it had never checked that a control can be **reached**. The delete/export layer added four new families of control (row remove, matrix cells, the docked bar's actions, the one-way gate) and every one of them would have been invisible to a keyboard if any had been a `div`.

Three properties, each a real failure mode rather than a checklist item:

| checked | why it is a defect, not a nicety |
|---|---|
| anything with `role=button` / `role=checkbox` / `role=tab` is focusable | a control a keyboard cannot reach is not a control; the ARIA role makes it *announce* itself as one, which is worse than silence |
| nothing focusable is `display:none`, `visibility:hidden` or 0×0 | **a focus trap you cannot see is worse than one you can** — the caret vanishes and the reader has no idea where it went |
| no positive `tabindex` | a positive value reorders the whole document relative to every other element on the page, and is almost always a mistake rather than a plan |

**Its own falsifier plants a `<div role="button">` and asserts the pass reports it** — this is the newest of the four passes and the one most likely to be silently vacuous, because "no findings" is its *expected* output on a healthy page. That is exactly the shape a check has when it has stopped working.

🔴 **AND ITS FIRST RUN REPORTED NINETEEN FALSE FAILURES, WHICH IS THE MORE USEFUL HALF.** It read `getComputedStyle(el).display` on the **element itself** and flagged every control inside Season's **collapsed identity panel**. `.identity.collapsed .idbody{display:none}` puts the `display:none` on an **ancestor** — and a child of a `display:none` parent computes its own `display` normally (`inline-block` here) while measuring 0×0. So the naive test saw *"CSS-visible but sizeless"* for nineteen elements the browser had already removed from the tab order entirely.

It uses `el.checkVisibility({checkVisibilityCSS:true, checkOpacity:true})` now, which answers the question actually being asked.

🔴 **A FIX THAT SILENCES IS ONE KEYSTROKE FROM A FIX THAT BLINDS**, so the change is asserted in **both directions** rather than trusted, permanently, in the self-test:

| assertion | proves |
|---|---|
| a real 0×0 `<button>` still reports `checkVisibility === true` | the pass can still catch the defect it exists for |
| a `<button>` inside a `display:none` `<div>` reports `checkVisibility === false` | the false positives really are gone, not merely unreported |

Both were verified live before the change was kept. **This is the pattern for every "the probe was wrong" fix in this package: prove the new test still fails on the real thing before trusting that it passes on the false one.**

### 5.9l.4d Row arrival — the same idea as the Track's, everywhere a row is created

`Shell.arrive(sel)` adds `.rowin` (opacity + a 10px slide from the left, `--dur-3`, with a `--staged` wash on the cells) and removes it on `animationend`.

**It slides rather than scales** — a row's identity is its full width, and scaling one reads as the table resizing rather than as a row appearing. Season's bar keyframe scales because a *bar's* identity is its span.

Wired into Armory's `+ New build` and Broadcast's `+ Post announcement`, both **after** their `renderAll()` — the node does not exist until the table is rebuilt. Reduced motion disables it in the helper *and* in the stylesheet, so it costs nothing rather than animating invisibly.

**Where motion deliberately stops:** Access and Analytics get none. Season's Track is the only surface where a continuous spatial view makes interpolation *mean* something; a permission matrix and a stats dashboard have no geometry a reader is tracking through a change. That is a decision, not an omission — noted here so a later session does not "finish the job" by animating things that carry nothing.

### 5.9l.5 The falsifier

`?self=1` builds a three-column table whose empty row spans nine, and asserts the sweep reports it. **If that self-test ever fails the run exits non-zero rather than printing a clean result**, because a sweep that cannot report a defect is worth less than no sweep — it manufactures confidence.

---

## 5.9m THE ARMORY ON REAL DATA — 133 builds, and the form that stopped being a Discord modal

### 5.9m.0 The sample was the problem

> Harkirat, 2026-08-24: *"why dont you import all 130+ builds and actually stress test how the armory behaves with ALL those loadouts, using their real info...??"*

The fixture held **36 documents**. The dev collection holds **133**. A sample answers *"does this render"* and cannot answer *"does this hold up"* — and the Armory's entire job is density.

**The full catalogue, counted rather than estimated:** 133 builds · 125 MP · 8 DMZ · **70 distinct weapons** · 123 carry a `shareCode` · 2 carry a `description` · 0 carry `attachmentSlots` · 34 meta · 10 toxic · 69 ranked.

Regenerate with `sort({weaponName:1, buildName:1})` out of `mongodb://localhost:27017/diors-builds-dev`, every schema field, `lastUpdated` truncated to a date. **`npm run portal:roundtrip` now validates all 133 against `utils/adminParser.js` byte for byte** — the round-trip claim went from covering a slice to covering the catalogue.

### 5.9m.1 Three things only real scale could show

| found | why 36 documents hid it |
|---|---|
| 🔴 **The Best row holds 18 cards; the header said "one per category" and there are 7.** The COUNT was never wrong — the **sentence** was. A badge describes the **weapon**, and the bot propagates it across every build sharing a `weaponKey` and mode, so BAL-27's five builds each carry it. Measured across the full catalogue: **every category has exactly one best weapon, and none has zero.** | at 36 the row held 6 cards against 7 categories, and the sentence read as true |
| 🔴 **The Tier board was 11,490px — fourteen screens** — with **Unranked holding 61 of 133**: the row with the most cards and the least to say. Tiers collapse now, Unranked starts collapsed (remembered per session), and **the header keeps its count while closed**, so collapsing hides the cards and never the fact. 11,490 → 9,353px. | at 36 the whole board was about two screens |
| 🔴 **Cards ranged ~120px to ~590px tall**, and a wrapping flex row aligns every card in a line to its tallest — a dead column under each short one. `.trow-body` is `columns:182px` now with `break-inside:avoid` on each card, so a weapon's builds cannot split across a column boundary and orphan its header. | at 36 almost every weapon had one or two builds, so the heights barely varied |

### 5.9m.2 The create form — five fields was a shape, not a decision

> *"SO barebone. It doesn't even state in any way which fields are required/optional. MP and DMZ do not and should not share the same modal. Where's the gunsmith code field? why are attachments in 1 line? that's so unintuitive for an IMMERSIVE DESKTOP PORTAL. Those placeholder texts look more like real filled in text than placeholder. where's the URL, cloudinary public ID fields? Wheres the badge fields?"*

🔴 **Five is not a coincidence — it is Discord's modal cap, reproduced in a browser.** `.claude/rules/manage-panel.md` records that the bot's loadout modal is **at** that cap, which is why Build Name and Share Code share one pipe-delimited field there. Copying the shape into a portal inherits a limit nothing imposes, and then defers everything else to "the editor" — **two screens for one act of creation**, in the surface whose whole purpose is to make `/manage` trivial.

| section | what it holds | the fact it states |
|---|---|---|
| Identity | weapon `*`, build name, category `*` | `weaponKey` is derived from the name; build name is a label, not a code, and defaults to `Build 1` |
| Attachments | **five numbered rows**, Gunsmith order, each clearable | 123 of 133 real builds carry exactly five — the shape is the data's. Free text rather than slot-typed selects, because `attachmentSlots` is empty on all 133 documents and typing a slot would invent structure the data does not have |
| Gunsmith code | MP only, live-validated `^(\d[A-Za-z]){5}$` | on DMZ the field is **absent and the absence is explained** — that screen generates no code, so showing it and ignoring it would be worse |
| Image | one field, Cloudinary key **or** full URL | it says which it read, and warns that a full URL will not survive a bulk-export round trip |
| Badges | meta · toxic · category rank · DMZ range rank | 🔴 **badges describe the WEAPON, not this build** — setting one here changes its siblings |
| Description | optional blurb | 2 of 133 carry one |

**Required is marked `*` AND the legend explaining the mark is in the same panel** — an asterisk with no legend is a convention the reader has to already know, and the legend costs one line. The Stage button **states why it is disabled** rather than sitting dead: a disabled control with no reason teaches a reader nothing, which is the same defect as a check that cannot fail.

🔴 **MODE IS NOT A FIELD, AND THE OLD DROPDOWN WAS A REAL DEFECT.** `core/ops/loadouts.js`'s `upsertBulkBlocks` does `{ ...rawEntry, mode }` and overwrites mode with the **page's** mode unconditionally. The bot removed Mode from its own paste format on 2026-08-22 after verifying that a DMZ export pasted on the MP page silently reassigned every build. The dropdown offered a choice the write path ignores. **Two buttons** — `New MP build` and `New DMZ build`, in the create-family shape Harkirat approved — and which one you press decides it.

### 5.9m.3 The eyebrow was debug output

> *"'LOADOUTS.ADD • TIER 1' what does that even mean...?"*

An op id and a reversibility tier are things **I** need while wiring this. A person using the portal has no way to decode either. The eyebrow says what the panel does — *"Adding to the MP armory · you can undo this"* — and the op id moved onto a `title` attribute, still one hover away for whoever is wiring it.

**The general rule:** internal identifiers belong on a surface only where the reader is the person who wrote them. Everywhere else they are a shibboleth that makes a product look unfinished.

### 5.9m.4 Placeholders that read as values

> *"Those placeholder texts look more like real filled in text than placeholder."*

They were `--ink3` at the **same weight and size** as real input text, so a hint looked like a filled field — **worse than no placeholder**, because it makes an empty form look complete. Real input is now `--ink` at 500; placeholders are `--ink3` at 400 **italic**. Three axes of separation (colour, weight, slant), and `--ink3` (5.35:1) keeps the hint legible rather than merely faint.

**And the format rule moved out of the placeholder entirely.** A placeholder disappears the moment you type — which is exactly when a format rule becomes useful. Each field carries a `.bf-hint` underneath it that stays.

### 5.9m.5 One card language, and a header that fits

> *"why are these different colors/styles, like i'm confused why is 1 a sleek dark style, while the other is a lifted grey style? look at switchblade x9 with it's info being cutoff and terribly formatted."*

`groupChips()` returned a bare `.bchip` for a weapon with one build and a `.bgrp` for one with several — **literally different components**, sitting adjacent in the same row. A single card carried `--raised` with a 3px accent edge; a group carried `--sunk` with a header band and no edge.

**A weapon with one build is a group of one.** One shape always, inheriting the single card's surface and edge (the better-looking of the two, and the one a reader sees most often).

The header was one flex row with the count pushed right by `margin-left:auto`, so `SWITCHBLADE X9` wrapped inside a 182px card and shoved `2 builds` off the edge as `2 buil`. **A name is variable-length and a count is not; they do not belong on one line at a fixed width.** Two lines by design, the name clamped to two and `min-height`-reserved so every header in a tier row is the same height — measured before: 48px and 51px side by side, which reads as sloppy long before it reads as "that name is longer".

### 5.9m.6 `[hidden]` — the fix that had to be unconditional

🔴 **`[hidden]` is a UA rule at specificity 0,0,1 and ANY class that sets `display` beats it.** `.pill{display:inline-flex}` is 0,1,0, so `<button class="pill" hidden>` stays on screen. Measured: Armory's superseded single create button and its two replacements rendered into the same grid cell and overprinted each other as **"+ Mew DMZbuild"**.

Enumerating the components that set `display` would fix today's cases and miss tomorrow's — there are **40+** in this stylesheet. `hidden` means hidden, unconditionally, so this is the one place `!important` is the correct tool rather than a shortcut: there is no legitimate pattern where an author sets the attribute and wants the element painted. **Audit rule 11** asserts it on every page so a future override cannot quietly reopen it.

### 5.9m.7 The backtick trap, caught by a gate for the first time

Editing this section's own comment fired the **fourth** occurrence of a backtick inside an HTML comment inside a template literal. Every previous one was found by opening the page and seeing it blank.

This time `npm run portal:refs` — which had gained a `new Function(src)` parse check **an hour earlier** — reported `armory.html: does not parse — missing ) after argument list` within a minute of the edit.

**Worth stating as a pattern rather than an anecdote:** the general check (does this file parse) beat every specific one anybody would have written for this trap. A text heuristic hunting for backticks-in-comments would also have to know whether the comment is inside a literal; the parser already knows.

---

## 5.9n THE TRACK REDESIGN — six coordinate authorities, and why four attempts failed

> Harkirat, on the fifth report of this surface: *"that entire thing needs a proper redesign because it is not working in my eyes. this is like the 4th or 5th time i've tried to have it fixed."*
> And then the question that matters more: *"why am i finding the bugs when ALL of your repeated tests keep missing them?"*

### 5.9n.0 The honest answer to that question

**Every probe in this package has the shape `for each element: assert P(element)`.** Contrast, focusability, overflow, colspan, zero-size, `[hidden]`. Forty passes of it. They are genuinely useful and they caught real defects.

**Not one of them asks whether two elements AGREE.** And five of the six things he found are exactly that:

| what he saw | what it actually is |
|---|---|
| "look at this disconnect in the line" | two elements representing ONE date, drawn 8px apart |
| flags "stacking on top of each other and hiding things" | two layers occupying the same pixels |
| the clock "randomly in the middle of the track" | an element with no defined home |
| the Season Record rail misaligned | a spine and its markers expressed in two units |
| "the entire track like an open blended canvas" | **no check will ever catch this one** |

So the missing category is **relational assertions**, and adding a 41st single-element pass would have been the same mistake a sixth time.

### 5.9n.1 The architectural cause, measured

**The Track is the only surface in the portal where position is COMPUTED rather than laid out.** Everywhere else the browser aligns things: a table's cells share a column, a flex row spaces its children. Here every dated element's x is a percentage *I* assign — bars, points, deadline lines, deadline flags, the NOW line, cluster badges, pinned chips, labels.

🔴 **Which means alignment is not a property of the layout — it is an assertion made in code, and it was made separately, in six different functions:** `_reposition` · `renderOverlay` · `fitFlags` · `stackFlags` · `pinFarDeadlines` · `clusterPoints`.

**MEASURED 2026-08-24:** `.ov` at **left=207 width=1158**; `.deadrail` at **left=249 width=1116** — a **42px origin gap**. A deadline's line and its own flag both carried the *identical* inline `left:77.0833%`, and it resolved to **x=1100** in one box and **x=1108** in the other.

**That is why four attempts failed.** Each fixed the instance — nudged a value until one screenshot looked right — and left six authorities and multiple origins in place. The next element then drifted, and the surface was "broken" again.

`--plot-l` is the single origin now, and **audit rule 13** compares the *containing blocks* of every percentage-positioned layer rather than the elements in them, so a future layer that forgets is reported the first time it renders.

**It found two more within a minute of existing:**

1. 🔴 **`.ruler` was 1116 wide while `.tk` was 1115** — a tick at 100% sat one pixel from a bar at 100%, across the whole axis, permanently. Invisible on any single element, and a misalignment of *the one thing this realm is*.
2. 🔴 **My own later `.deadrail{right:auto}` undid my own earlier `right:1px`.** Third time the shared origin was broken by a later declaration — caught within a minute of both being written, which is the entire argument for the rule.

### 5.9n.2 Lanes are spaces — the split that makes it work

🔴 **`.lanes` painted ONE gradient across every row.** The ground under lane 1 and lane 5 was literally the same painted surface. They were never separate spaces; they were **stripes on one field**, and no amount of hairline tuning could have changed that. He was reacting to something real and specific, five times.

**THE LANE OWNS THE GROUND. TIME OWNS THE VERTICALS.**

| channel | carries | why |
|---|---|---|
| **the lane** | its own surface (`--sunk`), border, radius, **2px left edge in its topic accent**, header on an inset ground, internal `--tk-pad`, and its own copy of the time grid at the same scale | this is what makes it a *space*: separate ground, own edge, own margin, own identity before you read the label |
| **the overlay** | the NOW line and every deadline line, spanning the whole region so they run **through the cards and across the gaps between them** | this is what keeps five spaces reading as one *timeline* — the crossing is the moment the design is about |

A gap of 7px between cards. The grid moves *into* each lane so the columns still align across all five while the surfaces stay separate.

### 5.9n.3 The blank bars — and the probe that could not see them

🔴 **My first probe found ZERO blank bars.** The playlist lane was **collapsed** by my own ">3 rows" default; his screenshot has it open. Expanded: **four bars, 140px wide, carrying real text, rendering as anonymous coloured rectangles.**

Two causes, both **order** bugs:

1. **`fitLabels` went inside → outside → HIDE**, while its own comment three lines above said *"truncation is the LAST resort... dropping the label entirely is worse still"*. The rung was in the prose and not in the code. `.lbl-cut` is that rung; below 44px (~six characters and an ellipsis) there is genuinely nothing to say and it hides.
2. **`stripSharedPrefixes()` ran AFTER fitting and skipped `.nolabel` bars** — so a label was hidden for not fitting, and then the one transformation that would have made it fit was *deliberately not applied to it*. "Nuketown Dedicated MP Playlist" and "Nuketown 10v10 MP Playlist" share nine characters. It runs first now.

And **"same row" was a string comparison on `style.top`**, which silently grouped every bar positioned by a class or a variable into one pseudo-row, so `rightWall` became the nearest bar in *any* row. It is measured vertical overlap now — **in `fitLabels` AND in the audit rule that checks it**, because those two computed "free space" independently and disagreed. The audit was reporting *"928px free beside it"* for bars with **23px** before their neighbour: four false positives, fixed **with a falsifier proving the rule still fires when the room is real**.

### 5.9n.4 The doubled search bar — reported twice, "fixed" once, never measured

🔴 **The global form reset is `input:not([type=checkbox]):not([type=radio]):not([type=range])` — specificity 0,3,1**, because each `:not()` contributes its argument's specificity. My earlier fix wrote `.cmdbar input.cb-in{border:0}` at **0,2,1** and **lost, silently**. Measured weeks later: the input still painted a `--sunk` background with a `--rule2` border and a **44px min-height inside a 34px wrapper**.

**It opts OUT of matching now (`[data-bare]`) rather than trying to out-specify.** An opt-out cannot lose an argument it is not having, and no future rule ordering can revive the box.

⚠️ **AND RULE 12'S FIRST VERSION WAS VACUOUS.** It iterated `[data-bare]` — so removing the marker, *the exact regression it exists to catch*, left it nothing to iterate and it reported clean. Written one minute after documenting that trap, and found only because the falsifier was run.

> **A check must select the thing it protects, never the fix that protects it.**

### 5.9n.5 The three relational assertions

| rule | asserts | what it caught |
|---|---|---|
| **13 · agreement** | every percentage-positioned layer inside `.tk-inner` shares one containing block | the 42px origin gap, the 1px ruler drift, and my own `right:auto` regression |
| **12 · occupancy** | a control inside a composite paints no box of its own and fits its wrapper | the doubled search bar, with all three symptoms named |
| **11 · `[hidden]`** | the attribute actually hides | two create buttons overprinting as "+ Mew DMZbuild" |

The **OVERVIEW strip is excluded from rule 13**, and the exclusion is a real distinction rather than a convenience: it plots the **whole season** while the lanes plot the **current window**, so its percentages mean something different and unifying them would be wrong.

### 5.9n.5b THE AUDIT HAD BEEN MEASURING A HALF-LAID-OUT PAGE

Chasing the one origin report rule 13 kept making turned up something larger than the report itself, and it is the most consequential finding in this whole section.

🔴 **`Shell.audit()`'s settled re-run was gated on fonts being PENDING.**

```js
if (document.fonts && document.fonts.status !== 'loaded') {   // ← the bug
  document.fonts.ready.then(() => Shell._audit(opts));
}
```

On a **warm** load `status` is already `'loaded'`, so **no second pass was scheduled at all** — and the only pass that ran was the synchronous one, which fires *before* the Track's own measuring passes (`repositionBars`, `fitLabels`, `clusterPoints`, `stackFlags`) run inside their `requestAnimationFrame`.

**Measured:** rule 13 reported `.tk at 239` while the very same element, queried moments later in the same frame tree, was at **249**. The geometry was correct; the audit was looking at it too early.

**Every geometric rule in that file has been doing this** — which means some of the audit's silence has been silence about the *wrong pixels*. It re-runs unconditionally now, two frames after fonts settle. The pass is idempotent, so the extra run costs nothing but honesty.

> **"Fonts loaded" is not "the page has finished measuring itself."** The `inkFills()` note at the top of `_audit` had already learned half of this lesson ("an audit must measure the page as it settles, so it settles the derived parts first") and stopped one step short.

### 5.9n.5c Two more in the same thread

**`.scrim` PERSISTS IN THE DOM.** `closeDrawer()` only removes its `.on` class. So a rule testing for the *element* rather than the open *state* stood down on every page after a single interaction, permanently and invisibly. Rule 13 tests `.drawer.open, .scrim.on`.

**And geometry really is only measurable at rest.** While a dialog is up the suppressed scrollbar widens the layout and moves every percentage-positioned element with it — a disagreement between two **moments**, not two containers. The rule reports a visible `note:` in that case rather than passing silently.

🔴 **A `note:` WAS BEING COUNTED AS A FAILURE**, which turned eight clean pages red. Notes exist so a skip is *visible* instead of silent; counting them as failures teaches the reader to ignore the colour, which is the exact opposite of what the note is for. `PASS`/`FAIL` is decided from the failures that survive the filter, and the note count prints beside the row.

### 5.9n.5d The plot origin is a padding, not a sum

Three separate times the lane header's rendered width drifted from `--gutter`: a compensating `calc(var(--gutter) - 2px)`, a border that shifted the content box, and a residual the harness reported. **Each time the plot area moved with it and every bar left the axis the ruler draws.**

`.lnh` is `position:absolute` inside a reserved `padding-left:var(--gutter)` now, so `.tk` begins at exactly `--gutter` no matter what the header does to itself — a different font, a wrapped label, a media query, a future padding change.

> **The compensation is deleted rather than corrected. A second expression for one number is the bug, not its value.**

The lane's accent edge is an `inset` box-shadow for the same reason: it paints in the same place and occupies **no layout**.

### 5.9n.5e A check must report an address, not a symptom

Rule 13's first version printed only the boxes — `"249x995 · 239x995"` — which told a reader that something was wrong and **nothing about where**. Acting on it meant re-deriving the entire measurement by hand.

It names the offending container now: `.ruler at 249x995 (11) vs .tk at 239x995 (36)`. **A check that reports a symptom without an address is a check somebody skips**, and a skipped check is indistinguishable from one that never ran.

### 5.9n.6 The limit, stated rather than papered over

**None of these can catch "the entire track is an open blended canvas."** No assertion reports that a composition fails to read as intended. That one needed looking at the whole picture the way a reader does — asking what it *says* — rather than the way I had been looking, at a diff, asking whether my change landed.

**The check catches drift. Only looking catches design.** Both are required, and adding more of the first will never substitute for the second.

---

## 5.9o THE FOUR FILED BUGS — two were the product, two were the checks

*Written 2026-08-25. Four items were filed in `docs/db-deferred-list.md` at the end of the previous session, each with a repro and a verification step. Working them turned out to be the most instructive hour of the whole project, because **two of the four were defects in the checking apparatus, and one of those had a diagnosis that was confidently wrong**. What follows is what each one actually was.*

### 5.9o.1 Broadcast's Airtime: one class, two contracts — REAL, 128px

Measured at w=1280 before the fix: the Airtime ruler ran `221 → 1244` and the lane's plot area ran `349 → 1234`. A date at 0% therefore rendered **128px apart** on the ruler and in the lanes, and a date at 100% rendered 10px apart — **the axis was wrong in both origin and scale, on the one realm whose entire chart is a time axis.**

The cause is not a styling slip and it is worth naming precisely, because it is a shape that recurs:

> **`.lane` had two contracts.** Season's redesign made the lane reserve `--gutter` as `padding-left` and lay the header into it out of flow — that is the whole reason `.tk` begins at exactly `--gutter` with no arithmetic to get wrong (§5.9n.5d). Broadcast's Airtime still used the OLD contract: a `.nm` header **in the flex flow**, sitting on top of a padding it knew nothing about. So its plot area began at `--gutter + 110px`, while its ruler carried an inline `margin-left:110px` that overrode the shared token, and its `.ov` carried an inline `left:110px` that overrode the shared origin.

Three inline overrides, each individually reasonable when written, collectively describing a second coordinate system. **Two consumers of one class disagreeing is invisible to every per-element rule** — each element was internally consistent. Audit rule 13 reported it the first time a view pass made the Airtime track visible.

**The fix deletes the second contract rather than compensating for it:** the three inline overrides are gone, and `.lane .nm` is now absolutely positioned into the reserved gutter, exactly as `.lnh` is. A later `.lane .nm{position:relative;…}` rule was deleted in the same change — same selector, same specificity, later in the file, so it had been silently putting the header back into flow whatever the header rule declared, and painting `var(--paper)` (the desk colour) inside a card whose ground is `var(--sunk)`. That is why the Airtime gutter read as a strip *beside* the lanes rather than as part of them.

**And one thing that was simply missing:** Broadcast's Airtime lanes carried no topic colour at all. `.lane`'s spine is `inset 2px 0 0 var(--c, var(--rule2))` and nothing set `--c`, so all four lanes had the same grey edge while their own bars were coloured — in a realm whose vocabulary is *shape = state, colour = topic*. The lane now takes `--c` from the same `F.annAccent(a)` its bar uses.

After: `.ruler`, `.ov` and `.tk` all measure **249×995**. One origin.

### 5.9o.2 The states sweep's "false positive" — REAL, and the filed diagnosis was WRONG

The filed entry blamed two things: a flat 1400ms wait, and calling `Shell._audit()` (the raw inner pass) instead of `Shell.audit()` (the wrapper that schedules the settled re-run). Both are real faults and both are fixed. **Neither was the cause.** Fixing only those left the sweep reporting the identical gap.

The actual chain took four measurements to find, and every step of it is a trap worth keeping:

1. **`requestAnimationFrame` does not fire in a document that is not being rendered.** The settled pass was gated on rAF alone, so in a backgrounded tab, a hidden pane, or an iframe parked off-screen it **never ran at all** — `pending` stayed `true` forever and nothing said so. `.states.html` positioned its frames at `left:-4000px`; `.audit-all.html` renders its frames in flow. That difference alone is why the two harnesses disagreed about identical bytes, and why the disagreement never reproduced by hand — the reproduction step is "look at it", which makes the tab visible.
2. **The settled re-run was re-driving the interaction pass.** `Shell.audit()` re-invoked `_audit` with the same options, including `interactions`, so the re-measure opened and closed a drawer first. A drawer suppresses the page scrollbar; every percentage-positioned element moves by its width; the geometry rules then measured a page mid-transition. **Two jobs were sharing one moment: the interaction pass CHANGES the page and every other rule MEASURES it.** Only one of them may run twice.
3. **"Settled" was defined as elapsed time, and elapsed time is not the thing.** Two fixed waits were tried and both were wrong on Season.
4. **And the actual last 10px was an ANIMATION.** Frame-by-frame at 120ms intervals: `.tk` sits at **239 on the first frame, 246 at 120ms, 249 from 240ms on**, while `.ruler` and `.lanes` never move. The lanes have an entry transition and the plot area slides its last 10px into place. Crucially the layout is genuinely **stable for the first few frames** — the animation has not started yet — so watching for stability alone still went too early.

**The audit now defines "at rest" as all four things at once:** fonts loaded, every *finite* animation finished (a looping accent pulse is excluded, or it would hold the gate open forever), the layout repeating for two consecutive frames, and a 2.5s wall-clock backstop so a page that never stops moving still produces a result rather than hanging.

**And rule 13 now reports the context that would have short-circuited all of this:** every two-origin line carries `[w=… sbar=… h=… vis=…]`. If two runs disagree in the scrollbar, the page height or the visibility state, the disagreement was between two **moments** rather than two containers — readable from the line instead of re-derived by hand for the third time.

> **The general lesson, and it is the same one as §5.9n.5b: a probe must prove it can report PRESENCE before its silence is worth anything — and it must refuse to hand back a verdict about something it could not measure.** Rule 13 used to `.find()` the first visible track host and `return` silently when there was none, so a page whose Track lives behind a view tab passed in silence. Broadcast's 128px defect sat one tab away from an `ALL 8 PASS`. It now checks *every* visible host and reports the hidden ones as a note.

### 5.9o.3 Season's `draft zone` opened no panel — REAL, and the interaction was mis-declared

The declared interaction clicked `#dPromote` if it existed and fell back to `#mkDraft` otherwise. On the default fixture no draft is staged, so it always took the fallback — and **"Start a draft" raises a toast; it opens no drawer.** Rule 9, which asserts that a declared interaction produces a real panel with a real title and a non-empty body, was correct every time it complained.

The interaction now drives the path end to end: stage a draft, re-render, **re-wire the handlers** (`renderDraftZone()` only rebuilds markup; `wireIdentity()` is what attaches `onclick`, and without it `#dPromote` exists and does nothing), then promote — which is the page's only tier-3 op and the one whose confirmation copy is actually worth asserting. It then puts the state back, because later passes re-audit the same document and an active draft silently changes what they see.

### 5.9o.4 A row read ENDED "before the season starts" — the CHECK was false, and it hid a real bug behind it

The assertion was: on `?today=2026-08-04`, no row may read `ENDED`. The row that tripped it was a patch note **published 2026-07-06**, which on 2026-08-04 is correctly history. **A hard-coded date in a check is a guess about the fixture**, and this one was simply wrong. It also read *every* `.rowmeta` — and a row has two, the lifecycle and the duration — so it was scanning the strings "1 DAY" and "14 DAYS" for the word ENDED.

The replacement is relational and holds at every date: each row now carries `data-life`, `data-start`, `data-end`, `data-lane` and `data-open`, and the sweep checks **each row's label against that row's own dates**. Two documented divergences are exempted *by name* rather than discovered as noise — a patch note is a publication with no duration, and a `dateOnly` draw never ends at all.

**And that rewritten check immediately found something the hand-picked dates never could.** At `?today=2026-09-10`, three rows read **LIVE NOW weeks after they happened**:

| row | its own dates | it claimed |
|---|---|---|
| Judgment Day - It Goes Two | 2026-08-07 → 2026-08-07 | LIVE NOW |
| Undead Legion Series Armory | 2026-08-11 → 2026-08-11 | LIVE NOW |
| The Widow's Bite Draw | 2026-09-01 → 2026-09-01 | LIVE NOW |

All three are `kind: 'point'` — a release, a single date. `isEventEnded()` short-circuits `kind === 'point'` to `false` because **the bot's own function never sees one** (draws and patch notes are not calendar rows), so the port fell through to "started and not ended" and labelled every past release LIVE NOW **permanently**. Invisible on the pinned date because the season was young.

The distinction that fixes it is `dateOnly`, and it is a real product distinction rather than a patch:

- A draw with **no** calendar window genuinely never ends. That is deliberate bot behaviour, it is the single most useful thing this page tells an admin, and **11 of the 14 real draws are like that**.
- A draw **with** a window has its liveness carried by that window row. Its release marker is history the day after it fires.

**A release is a moment, and a moment cannot be "live now" for a month.**

One further finding from the same pass was *not* a bug and is recorded so it does not get "fixed" later: a row whose window closes **today** reads ENDED from midnight, because `commands/calendar.js` ends an event when `endDate <= now`. The port mirrors that deliberately; the assertion was relaxed from `>=` to `>` so that faithfulness is not flagged as a defect.

### 5.9o.5 A note is not a failure — the second time this regressed

Rules that decline to judge report as `note:` — a geometry check skipped because a dialog is up, an interaction skipped for want of data, a track host that was never visible. `say()` counted them, so **twenty of thirty-two "findings" in one run were not defects**, and eight clean pages read red. This is the second occurrence of exactly that regression; it came back because two new note types were added.

Notes are now split from failures: both are printed, only failures count. **A report where most of the red lines are not defects is a report nobody reads to the end**, which costs more than a check that never ran.

### 5.9o.6 The falsifiers added with these fixes

Every new mechanism here can fail silently, so each got a falsifier that proves it can report the bad case:

| mechanism | its falsifier |
|---|---|
| `rafAlive()` | a stub frame whose `requestAnimationFrame` never calls back **must** report dead |
| `settle()` | a stub whose `__selfCheck.pending` never clears **must** come back marked `timedOut`, not read |
| the sweep as a whole | a **render-liveness gate runs before any pass** and aborts loudly rather than printing 45 confident lines about a page Chrome is not painting |

The last one is the important one. It is the difference between a harness that measures and a harness that recites.

---

## 5.9p WHAT LOOKING FOUND — the design pass the checks cannot do

*Written 2026-08-25, opening each realm at 1440×960 and judging the composition rather than the diff. Every item here passed every gate.*

### 5.9p.1 The audit was scrolling the page it audits — and the earlier fix treated the symptom

**Season opened at `main.scrollTop` 2862 of a 3102 maximum.** The bug had been reported, filed, "fixed" with `Shell.holdTop()`, closed to the archive on 2026-08-24 — and it was still there, at 1440×960, on the first load of the design pass.

Instrumenting `scrollTop`, `scrollIntoView` and `focus` gave the answer in one run:

```
{"el":".INPUT","from":0,"to":2785,"opt":"{\"preventScroll\":true}"}
```

**One `.focus()` call — with `preventScroll:true` explicitly set — moved the scroller 2785px.** Chrome does not honour the option here. The falsifiers were decisive: stubbing `HTMLElement.prototype.focus` gave scrollTop 0, and stubbing `Shell._audit` gave scrollTop 0, so the audit's own focus-ring sweep (rule 5) was the whole cause.

Two fixes, and the second is the one that generalises:

1. The sweep **saves and restores the scroller** around itself. A diagnostic must not damage the thing it is diagnosing.
2. It restores **`main`**, not `window`. Rule 9 already had a restore line — `window.scrollTo(0, scrollY)` — and it had **never once worked**, because `main` is the scroll container on every portal page and `window.scrollY` is permanently 0. That trap is written down in three places in this repo and still produced a dead line of code in the very function meant to prevent this.

**Why `holdTop()` could not have fixed it:** it releases as soon as fonts settle, and the *settled* audit pass — which runs the sweep a second time — comes later. Verified after: all eight pages open at 0, at 1280, 1440 and 1600.

### 5.9p.2 Season's ADD row was a colour chart, and the comment above it said otherwise

Six create buttons sat under the season title, each with its own border colour and its own tinted ground. They were the loudest object on the page — louder than the 46px H1 — and they made a toolbar read as a palette.

The instruction had been explicit: *"i mainly want the pill, spacing, border, etc to feel like the original button's style … however, i do like those colored diamonds in the buttons, please keep those."* The original button had **one neutral border**.

What makes this worth recording is that **the comment directly above the rule already stated the correct design**: *"the diamond … is the only per-type mark left now that every button carries the same border weight."* The rule underneath it set `border-color: var(--c)` and a per-type background. The prose was right and the code was wrong, and a comment that describes an intention rather than the code is worse than no comment — it stops the next reader from looking.

Now: one neutral border and ground for all six, the diamond carrying the whole per-type job, and the colour arriving on **hover**, where it confirms the choice you are about to make instead of competing with five you are not.

### 5.9p.3 A zero painted as an alert

`STAGED 0` rendered in staged-cyan and `FLAGS 0` in warning-amber, so a page with nothing wrong still showed coloured numbers in its masthead. **A colour that is on whether or not it means anything stops meaning anything.** `.zero` is now written by the same line that writes the number, so the two cannot disagree.

### 5.9p.4 The identity strip repeated the H1 verbatim

"Season 7 — Terminated" in 46px, and then "Season 7 — Terminated" again 280px below it. The strip's job is the **deadlines**; it now says *which record you are editing* — "Live season" or "Next season · staged" — which is the one thing there that the H1 does not already tell you.

### 5.9p.5 The overview strip placed items by their array index

`top: 8 + (i % 4) * 6`. **Vertical position in the season overview carried no meaning at all** — two draws a day apart landed on different rows, a draw and a playlist landed on the same one, and the strip rendered as a smear of colour with a box drawn around part of it. It looked like data and was texture. It is the same failure Harkirat named on the Track itself: *"why is the entire track like an open blended canvas?"*

One row per **lane**, in the Track's own lane order, makes the overview a **miniature of the Track directly below it** — so the eye can carry structure from one to the other, which is the entire job of an overview strip. A `min-width:3px` came with it, because a single-day draw at season scale computes to under a pixel and simply vanished, and **eleven of the fourteen real draws are single-day**.

### 5.9p.6 Armory's headline alarm was 89% "this record is a few months old"

**NEED REPAIR 109**, in alarm orange, out of 125 builds shown. Measured over the real collection of 133:

| what | count |
|---|---|
| no Gunsmith code | 2 |
| image is an external URL | 1 |
| not 5 attachments | 10 |
| Meta but unranked | 2 |
| **actual faults** | **13** |
| **stale — not updated in 120 days** | **104** |

**A number that is red on almost every row is not a signal, it is the wallpaper**, and the rows worth acting on were invisible inside it. The `stale` defect now carries `age:true`: it stays a defect and the Repairs queue still lists it — a stale build *is* probably wrong, and that is the realm's whole argument — but it does not get to be the alarm. The masthead reads **NEED REPAIR 11 · STALE 106**, and the legend names clean / needs repair / stale as three separate states.

### 5.9p.7 Our own tooling was the first word on three surfaces

Every seeded announcement and every grant note carried a **`SESSIONB-SEED ` prefix** — a marker a seeding script writes so its rows can be deleted from the dev database again. Not content. It rendered at the head of every row in the delivery queue, inside the "what one player gets" preview (which exists specifically to show what Discord will send), and on every note in Access.

Stripped at the fixture, which is the one place it can be stripped once. The note in `fixtures.js` says to strip it again on the next export rather than teaching the pages to hide it — **a page that hides a data problem is how the data problem survives.**

### 5.9p.8 One regression, and what caught it

The legend edit referenced `b` outside its scope, and the page died on render. **`portal:refs` passed** — it parses every inline script and checks declared identifiers, but it does not do scope analysis, so a free variable inside a template literal is invisible to it. The states sweep would have caught it (a page that throws never calls `S.audit`, so it reports "no `__selfCheck`"), and the browser console caught it in one call. Worth knowing precisely where each gate's edge is: **`portal:refs` proves a page PARSES, never that it RUNS.**

---

## 6. Wiring guide — the order to do it in

1. ✅ **`utils/owner.js` — ALREADY DONE, skip it.** *(Shipped in `009931a`, the portal operation core; this step read as outstanding until 2026-08-24 and a cold reader confirmed it would have cost the first hour of a wiring session.)* The leaf module exists and imports nothing, `utils/adminAccess.js` and `scripts/botAccessPermissions.test.js` already require it, `scripts/ownerModule.test.js` asserts the closure stays clean, and `docs/legal/PRIVACY.md` already names `utils/owner.js` rather than `commands/manage.js`. **Verify in one command before trusting this line:** `rg -n "require.*owner" utils/adminAccess.js scripts/botAccessPermissions.test.js`. The original reasoning is kept because it explains why the module exists: `isOwner()` used to `require('../commands/manage')`, pulling 39 local files plus discord.js, jimp and child_process into anything that wanted one constant.
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

## 8. The journey — folded into the sections that use it

*Fourteen numbered "what changed and why" items lived here until 2026-08-24. A cold reader found that every one restated something already made with more force at the place it applies — shape/colour → §4.1, the two vocabularies → §4.3, the bot's palette → §4.2, the audit rules → §3 — and that §0.0 routed nobody here. Its stated purpose was that "the **sequence** explains decisions that look arbitrary in isolation", and one line per item did not deliver that.*

**Where the lessons live now:** §3 (the invariants and the bug each one earned) · §4 (the design language and why each rule exists) · §7 (traps already paid for, grouped by what you would SEE) · §5.99.5 (symptom → cause) · §14 (what a green audit does not mean). If you want the chronology, `git log --follow COMPANION.md`.

## 9. The realm roster

*Every surface below is built and audits clean as of 2026-08-24. This section was the not-built list; it is now the roster.* ⚠️ **§5 CARRIES THE ELEMENT-LEVEL CONTRACT FOR ALL FIVE REALMS, including Broadcast, Access and Analytics.** §5's preamble used to delegate those three here, while §9's table held rows for them and §5 gave them fuller treatment anyway — so the stated precedence and the actual content pointed in opposite directions, which is the ambiguity the stale §5.4 tables lived inside. **§5 wins. This section is a roster, not a spec.** **Five realms appear in the rail** — Season, Armory, Broadcast, Access, Analytics. `index.html` (home), `review.html` (commit) and `door.html` (sign-in) are deliberately **not** realms and must never be added to `REALMS`.

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

## 11. The process lesson, in one line

*Four "process findings" lived here until 2026-08-24. Their content was already in §3's table, §7's Process block and §14 — and a third copy of the colliding-class-name roster had drifted here, naming `.tier` (which never collided) and omitting `.tk` (which did, with a worked example). A list kept in three places is a list that will disagree with itself.*

🔴 **The lesson, and it is the only one this section had that the others do not:** *the check that catches a class of defect must live where the defect is INTRODUCED, not where it is noticed.* Every mechanism in this package follows from that — the tier derives at `Store.add()` rather than being reviewed later; the fixtures are exported rather than proofread; the gate scans the document as well as the pages, because the document is where the last nine bad names were found. **Class-collision roster: §7, one copy.**

## 12. Art direction — what is still outstanding

*§12.1–12.4 measured the shipped result against §10 and confirmed it landed: type scale on the live page, composition, the three motion moments, the edge states. Its own preamble said "§12 is the measurement and **governs nothing**", and a cold reader agreed — so the measurements are gone and the part that changes behaviour is kept. If you need them back: `git log -p COMPANION.md`.*

### What is still outstanding from §10

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

**Closed, spec §6.2 H7/H8/H10.** Permissions resolve **server-side on every request** through `resolveAction()`'s existing choke point; the client is not trusted for anything, *including which realm it may see*. The `.rolebadge` and the rail's realm list are display conveniences and enforce nothing. *(This sentence used to enumerate `OWNER / ADMIN / EDITOR`; there is no editor role — §5.5.)*

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

### 15.11 Decided 2026-08-25 — three of the four, by Harkirat

*These were the open questions that gated "ready for wiring". They are answers, not proposals; the consequences below are what the wiring session inherits.*

**1. STAGING MOVES SERVER-SIDE.** A staged change set lives in Mongo against the admin's id, not in `sessionStorage`.
- It survives a tab close, it is visible to a second admin, and **§15.4's conflict surface stops being hypothetical** — two admins staging against one season document is now a state the design has to answer rather than one it can leave undefined.
- The mockups still stage into `sessionStorage` under `dioreo-portal-staged`, and that is now **explicitly a mockup-only shim**, not a specification. Read `Store` as *the shape of the change set*, never as *where it lives*.
- The export interlock (`Shell.Export`) is scoped to the browser session today. Server-side staging means the interlock has to be too — an export that unblocks a tier-3 op must be a fact about the account, not about the tab.

**2. THE WIRING REBUILDS FROM THESE MOCKUPS.** `portal/ui/**` is not brought up in place.
- The package is the more advanced artifact: the Track redesign, delete/export across five realms, the Access matrix, motion, and the whole audit layer exist only here.
- ⚠️ **That does NOT retire §0.5's diff.** A previous session found `portal/ui/*` *ahead of* the mockup that was supposed to specify it, and wiring the mockup faithfully would have rolled back working design. Rebuilding means the mockup is the source — it does not mean the existing code has nothing to teach. Diff first, then rebuild, and carry anything the diff finds.

**3. TIER-3 IS OWNER-ONLY BY DEFAULT, WITH AN OWNER-GRANTABLE CAPABILITY.** Harkirat's own words: *"owner only by default, with explicit permission capability to allow scope to an admin, authorizable only by the owner with explicit warnings (and possibly safeguards like caching/storing the export) so the owner is fully aware."*

What that means concretely, and each line is a design obligation rather than a summary:
- **Default:** every tier-3 operation — the purges, `season.promoteDraft`, `season.discardDraft`, anything with no inverse — requires the owner id. Another admin holding the page scope sees the control **present and disabled with the reason stated**, never hidden. Hiding it teaches nothing and produces a support question.
- **The capability is a real, separate grant**, not a side effect of holding a page scope. An admin can hold `manage.draws` and still not be able to purge draws.
- **Only the owner can grant it.** Not an admin holding `manage`. This is the first token in the model whose *granting* is restricted, so the Access matrix has to say so — a column that looks like the other eleven but behaves differently is exactly the "one class, two contracts" failure §5.9o.1 is about.
- **The grant flow carries explicit warnings**, in the same voice as the one-way strip: it names what the admin will be able to do that cannot be undone, and it is a typed confirmation, not a checkbox.
- **The safeguard is export retention.** The interlock today only asks whether an export *happened*; the tier-3 record should keep the export itself, so a purge run by a delegated admin leaves the owner holding the data that was purged rather than a note saying somebody downloaded it.

⏳ **Not yet built in the mockups.** The matrix still shows eleven tokens and the one-way strip still states only the export gate. Doing it touches `fixtures.js`'s grant objects, the Access columns, `portal:gate`'s token count, and the one-way copy on five realms — it is the next unit, and it is named here so the gap is visible rather than assumed away.

**4. Still genuinely open:** whether `--ink4` should exist at all. It is a non-text token with 15 uses; if those 15 could take `--rule2`, the ink scale would be honestly three tokens instead of three-plus-a-footnote. Cosmetic, and it does not gate wiring.
4. **Whether `--ink4` should exist at all.** It is now a non-text token with 15 uses. If those 15 could take `--rule2`, the ink scale would be honestly three tokens instead of three-plus-a-footnote.

*Closed 2026-08-24: the accents for Broadcast, Access and Analytics (§4.2); `review.html`'s design (§5.8); the WCAG AA floor, now measured rather than claimed; the responsive contract, verified at 390px rather than assumed; and keyboard paths for **both** drag surfaces — Season's Board and Armory's tier board. *(This read "all three" until 2026-08-24, counting a Broadcast reorder that had been removed.)**

> ⚠️ **`prefers-reduced-motion` is still UNVERIFIED and should not be called done.** Six blocks exist in `app.css` and the syntax is right, but no tool in this session could emulate the preference, so nothing has ever observed those rules taking effect. **Do not read "the CSS is there" as "it works"** — that is the shape of assumption this document exists to stop.
