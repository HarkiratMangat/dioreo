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
| **8 / 9** | The journey, folded into the sections that use it · the realm roster | §9 is the fastest way to find which realm owns a surface |
| **10 / 11 / 12** | Art direction as specified · the process lesson in one line · what is still outstanding | When judging whether it looks right. §12's measurement half was cut 2026-08-24 — it governed nothing and said so |
| **13** | Where the work stands — every surface and its verification state | Before believing anything in this document is current |
| **14** | What a passing audit does **not** mean | Before saying "verified" |
| **14.5** | Two defects found in **shipped** `portal/api/access.js`, fixed test-first | Before trusting a portal endpoint's own comments |
| **15** | Contracts the mockup cannot express — transactions, concurrency, authz, dates, async | While wiring the backend |
| **5.9j–5.9t** | **The design-and-defect record** — delete/export, motion, the states sweep, the Armory on real data, the Track redesign, the four filed bugs, what *looking* found, the destructive capability, the four unlooked-at realms, **the shape scale, the tray’s per-row undo, the four filed bugs, what *looking* found, the destructive capability |
| **5.9u–5.9x** | The shape scale · the tray’s per-row undo · the display voice · the copy audit · the twelve words | Before touching type, corners, the tray, or any user-facing string |
| **5.9y / 5.9z** | **The falsification pass** — a gate that could not fail, and the four-instance defect family · **liveliness, magic, the three rejections, and the account panel** | 🔴 **Before believing any green in 5.9u–5.9x, and before proposing anything as “lively”** | When you want to know why something is the way it is, or before "fixing" something that looks odd |
| **15.7 / 15.7b** | Async — every loading, in-flight and failure state · `prefers-reduced-motion`, measured | Before wiring anything that waits, fails, or moves |
| **15.11** | **Decided 2026-08-25** — server-side staging, rebuild-from-mockups, owner-only tier-3 — and the one question still open | Before assuming something is settled |
| **16** | **BUILT 2026-08-25** — the eight micro-interactions · the masthead figure grammar · Home rebuilt around the rail · the account panel · **the light model, falsified and dropped with numbers** · the parser behind paste/dates/⌘K · the chart aesthetic · **the Track's deadline markers** · and three defects this session created and caught | 🔴 **After §5.9z, always.** §5.9z is what was decided; this is what was built, and it records the three places the decision turned out to be wrong once the page was open |

⚠️ **This table is the only navigation this document has, and the document is very long.** *(No byte count here on purpose — the previous one said 280KB and was stale within a day of being written, which is `feedback_no_duplicated_state_in_prose` applied to this file's own index. `wc -c` it if you need the number.)* A section that is not in it is a section a wiring session will not find. Three whole families — §5.9j–5.9r, §15.7 and §15.7b — were missing from it for a day after being written, which made them exhaustive and unreachable at the same time. **If you add a section, add its row.**

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
Every admin × all twelve tokens, commands and `/manage` pages in visually separated blocks. **This is the capability Discord physically cannot offer**: `/manage` shows one admin's permissions in one ephemeral reply, so answering *"who can touch draws?"* means opening it once per admin and holding the answers in your head.

#### By scope (`#viewScope`) — the inverse
Each token with its holders, derived from the *same* grants so the two views cannot disagree. Two findings live only here: a scope held by **exactly one** non-owner (a single point of failure — **6** on the live data, including the bare `manage` token itself), and a scope held by **nobody** but the owner (`autobuild`).

⚠️ **The page READS `F.spof`; it does not re-derive it.** An earlier build reproduced `singlePointsOfFailure()`'s blind spot deliberately — that function used to expand a bare `manage` into the eight page scopes without ever recording a holder for `manage` itself, so a lone holder of the full token went unreported. **That defect was then fixed** (§14.5), the export picked the fix up, and the page's hand-written copy of the old rule kept saying 5 while `F.spof` and `index.html` both said 6. Two surfaces of one package answering the same question differently is exactly what the fix existed to end. There is now one definition, in the export, and every surface reads it.

| Element | What it is | Wires to |
|---|---|---|
| `.mxgrp th` | Two group headers — **Commands** and **/manage pages** — over the twelve columns. The split is the model's, not a layout choice: four `ADMIN_COMMANDS` and eight `MANAGE_PAGE_SCOPES`. ⚠️ **Order IS the grouping**: the colspans come from the two lists' lengths while the columns come from `accessScopes` order, so appending a command at the end made "Commands" span three commands and a page | `utils/adminAccess.js` |
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
| **Access** | `AdminUser[]` + `PortalSession[]` | `models/AdminUser.js`, `models/PortalSession.js`, `portal/api/access.js` | 🔴 **Twelve tokens**: 4 `ADMIN_COMMANDS` + 8 `MANAGE_PAGE_SCOPES` (including the `season` pseudo-page). The fourth command is **`destructive`** (2026-08-25), which names no surface — it gates the right to RUN a tier-3 operation on all of them — and which **`all` deliberately never expands to** (`NOT_IN_ALL`). **Two roles**, no `editor`. `permissions` is never empty. Grants and revokes are **direct writes, not ops** — typed-Discord-ID confirmation, no export leg, no staging. `grantedAt` **is** stored. `PortalSession` holds no IP; "signed in now" is derived from `lastSeenAt` inside 15 minutes. `invalidateAdminCache()` after every write, or the 60s TTL delays it |
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

> Harkirat, on the fifth report of this surface: *"that entire thing needs a proper redesign because it is not working in my eyes. this is like the 4th or 5th time i've tried to have it fixed."* And then the question that matters more: *"why am i finding the bugs when ALL of your repeated tests keep missing them?"*

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

## 5.9r THE FOUR REALMS NOTHING HAD LOOKED AT — Home, Review, Analytics, the Door

*Written 2026-08-25. Season, Armory, Broadcast and Access got a design pass on 2026-08-24; these four had only ever been audited. Every finding below passed every gate, and three of them are **one quantity with two authorities** — the shape no per-element rule can see.*

### 5.9r.1 Home said 117 need repair; Armory said 11

Splitting age out of Armory's alarm (§5.9p.6) fixed one surface and **broke the agreement between two.** `F.ARMORY_COUNTS.needRepair` still ran the combined predicate, so Home's most prominent row read **117 builds need repair** while Armory's masthead read 11.

The comment at Home's own call site already described this exact failure **from the other direction** — *"This used to hold its own copy of Armory's defect predicate, and the two surfaces reported different numbers for the same collection"* — and the fix that comment records (one shared derivation) was in place and did not prevent it.

> 🔴 **Reading a shared derivation is not sufficient. The derivation has to carry the same DISTINCTION its readers make** — otherwise one of them silently answers a different question.

So the split lives in `fixtures.js` now: `armoryFault`, `armoryStale`, and `ARMORY_COUNTS.{needRepair, stale, flagged}`. Home's card shows both figures, because a realm with 11 faults and 106 stale records is in a different condition from one with 11 and none, and one number cannot say which.

**And it is now asserted.** `.states.html` PASS 4e is the only check in the package that loads two pages at once and compares them — Home's headline against Home's own derivation, Armory's derivation against Home's, and a guard that the split has not collapsed back (`stale > faults`). Both times this defect happened, **each page was internally consistent**; counting the authorities over one quantity is the only shape of check that could have seen it.

### 5.9r.2 Two rows, one label

Home's list had two rows reading **`Open repairs →`** — one to Armory, one to Season. A reader scanning a column of five actions cannot tell them apart. They name their realm now.

### 5.9r.3 The zero-in-an-alert-colour, third instance

Season and Armory were fixed by hand on 2026-08-24. **Review still showed `CHANGES 0` in staged-cyan the next morning**, with `REALMS 0` and `GATES OPEN 0` beside it.

That is the second time a per-call-site fix left the other sites wrong, so it moved to the Shell: **`Shell.zeroStats()`**, computed once for every realm, and **observed** — the stat block is rewritten on every stage, filter and save, so a one-shot pass at boot would have been correct exactly once. The render sites are the thing that keeps forgetting, so nothing is asked of them.

Verified across all six realms: every `0` renders at `--ink4`, none at an accent.

### 5.9r.4 Analytics had two tiles with inverted semantics

**`SUCCESS RATE 99.0%` in alarm orange, `MEMORY 132 MB` in success green**, side by side.

The rule was `t: errN ? 'warn' : 'ok'` — a **binary test on a continuous quantity**. In production there is always at least one error, so the tile would have been orange forever; and 132 MB was being congratulated for a number nobody set a goal for.

Same family as Armory's 109: a colour that is on regardless carries no information. Now the rate takes a **threshold** (green only with nothing against it, orange under 99%, neutral between), and memory is neutral unless it is actually high.

### 5.9r.5 The Door contradicted a decision made hours earlier

*"A session lasts 12 hours and lives in this browser only. Staged changes live with it, so signing out discards them."*

Harkirat decided on 2026-08-25 that **staging moves server-side** (§15.11), and the async layer's own `expired` banner already said the opposite of the Door: *"Your staged work is still here; signing in again returns you to it."* **Two surfaces, one fact, and the first thing an admin reads was the wrong one.**

A decision changes the sentences that were true before it. The Door now says staged work is held against the account and survives the session — which is also the reader's actual fear at that screen, and the thing worth answering there.

### 5.9r.6 What was already right, and is worth not breaking

Review's empty state is the best edge state in the package: it names what is missing, why, and **three** ways forward, then explains why the sample changeset is loaded on request and never automatically — *"a mockup that invented staged work would teach the wrong thing about what staging means."* Analytics' "Alerts by level" panel states the three-tier model and why it must never collapse into one number. The Door's three notes answer being-signed-in vs being-allowed, session lifetime, and exactly what scope is requested.

---

## 5.9t THE PROSE WAS THE ONLY UNGATED ARTIFACT — and it had gone wrong in four ways

*Written 2026-08-25, from a pass whose brief was to attack everything: the code, this document, the design, and the work itself.*

### 5.9t.1 The measurement

| | |
|---|---|
| package | **12,875 lines** — `app.css` 3,756 · `season.html` 2,846 · `shell.js` 2,134 *(measured 2026-08-25 morning; §16's work has since moved all three, and this row is a SNAPSHOT that made the argument below — re-measure with `wc -l`, never read it as current)* |
| `shell.js` | **38% comment** (785 of 2,067 non-blank) |
| `app.css` | 14% comment |
| gates on the **code** | five (`portal:gate`, `portal:refs`, `portal:roundtrip`, `.states.html`, `.audit-all.html`) |
| gates on **this document** | **none, until today** |

**Every quantity in a 296KB document was a hand-maintained copy of state**, which is exactly what `feedback_no_duplicated_state_in_prose` says never to write, and there are hundreds of them.

### 5.9t.2 Four ways it had gone wrong

1. **The data-contract table said "Eleven tokens: 3 `ADMIN_COMMANDS` + 8 `MANAGE_PAGE_SCOPES`."** The bot has twelve. §0.0's own map labels that table **"the part you can copy"** — the single worst placement for a stale number, because a wiring session copying it builds the wrong thing.
2. **A correction written three hours earlier had itself gone stale.** §15.11 said `portal:gate` "still reports eleven, and will until the bot itself gains the token" — and the same session put the token in the bot. **A correction is a claim like any other and rots at the same rate.**
3. **A claim fixed in one place was not fixed in the other.** "the same permission test copied into five realms' one-way strips" was corrected in §15.11 and survived verbatim in §5.9q.
4. **Four top-level sections — §8, §9, §11, §13 — had no route from the §0.0 map.** 296KB of exhaustive is unreachable without its index, and the index is hand-maintained too.

### 5.9t.3 `--ink4`: the open question was wrong twice over

§15.11's fourth question asked whether `--ink4`, "a non-text token with 15 uses", could collapse into `--rule2`.

**Measured: 35 uses, and 12 of them are text** — 9 `color`, 3 `stroke`. So the count was 2.3× wrong and the premise was false. `--rule2` is `#3A4752`, a border colour; 13px text on it over `#0B0D0E` is near 1.6:1, and the audit's contrast rule would fail all twelve. **The token stays.**

It had also been asked **twice, in the same section, with the same stale number**. An unanswered question rots exactly like an unmaintained count, and this one was quotable and untrue for a week.

### 5.9t.4 The two checks — and both of them shipped vacuous

`.schema-gate.mjs` now asserts two things about this document: that it does not state a **live** permission-token or op-type count that disagrees with the code, and that every top-level `##` is named in the §0.0 map. Narrow on purpose — a check that guesses at prose cries wolf and gets switched off.

> 🔴 **Both went GREEN on their first falsifier.** The quantity check's history filter exempted any line carrying a **date**, and this document dates almost everything, so a planted "Nine permission tokens" sailed through. The map check was sound and my **plant** was wrong — renaming a row to `13-removed` still mentions 13. **Two different routes to a false green in one afternoon**, written by someone who had spent two days documenting false greens.

**The practice that earned its place:** a falsifier is not something you run once at authoring time. Both now run **on every invocation**, printing `✅ self-test: …`, which is the standard the other four gates in this package already held.

⚠️ **And then the check fired on this very section, within a minute of it being written** — because a document that describes its own falsifiers necessarily contains the strings they plant. A quoted wrong value is an **example**, not a claim; backticks or quotes around a match exempt it. The repo already learned this once: `timestamp-check.sh` carries a `TS-EXAMPLE` escape for exactly the case of quoting a bad value while writing about it. **The first attempt at the exemption was off by one** (it looked two characters out instead of one), so it exempted nothing and the gate stayed red — a fix that does not fix, found by running the gate rather than by reading the patch.

### 5.9t.5 🔴 NONE OF THESE GATES WAS IN CI — the repo's own recorded mistake, made again

Checked at the end of the pass rather than assumed: **`portal:gate`, `portal:refs` and `portal:roundtrip` were not in `npm test`**, and CI runs `npm test`. So every gate in this package — the schema check, the undeclared-identifier and parse checks, the backtick lint, the cache-buster check, the two new COMPANION checks, and the export round-trip against the real `adminParser.js` — **ran only when somebody typed it by hand.**

`.github/workflows/ci.yml` carries a comment about this exact failure, from 2026-08-02:

> *"Two suites existed and NOTHING RAN THEM in CI … they ran only when someone hand-typed `bash <file>`. Harkirat: 'i literally spent hours last session working on some of these gates and … they dont even seem to hold despite their tests.' The tests were fine. Nothing was running them. **A test nobody runs is worse than no test**, because it produces a documented belief that the behaviour is covered."*

All three are in the chain now, and **that was verified by planting a defect and watching `npm test` go red** — not by reading `package.json`.

⚠️ **And the same question — does a check look at its OWN artifacts? — found one more.** The parse check and the new backtick lint both filtered `!f.startsWith('.')`, so **`.states.html` and `.audit-all.html` were exempt from the two checks that protect them most.** That exclusion is correct for the undeclared-identifier pass (the harnesses reach across an iframe boundary for globals it cannot see) and wrong for syntax, which does not care. `.states.html` is 400+ lines of template literals, and a backtick in a comment there kills the sweep — which then reports "no `__selfCheck`" for every page, reading as **eight broken realms rather than one broken harness**. Both checks now use a separate file list that includes the dot-files, proven by planting a backtick in `.states.html` and watching it get named. ⚠️ The two **browser** harnesses (`.states.html`, `.audit-all.html`) still cannot run in CI; they need a browser, and that is a real limitation rather than an oversight. They remain manual, which is worth knowing when reading "ALL CLEAN — 73 passes": that number comes from a human running it.

### 5.9t.6 Two design-system faults, upstream of every surface

- **There were two type scales in `:root`, each under a comment claiming to be *the* scale, colliding on `--t-micro` (9.5px and 9px).** The later wins, so **48 usages silently took 9px** while the first declaration said 9.5. One quantity, two authorities, at the level of the tokens file — every surface inherits it and no per-element rule can see it. Collapsed into one scale in two ranges: display (44/34/22, five uses total) and UI (9→24, where `--t-sm` alone is used 55 times). `--t-body` and `--t-label` were a *third* set of names for 13.5px and 11px and are gone rather than aliased, because an alias is a second name for one value and that is how this collided.
- **`border-radius` is `var(--rad)` 43 times and a hardcoded literal 256 times**, across nine distinct values. The radius token exists and loses 6:1. **Left as-is deliberately** — the values are mostly intentional at their sites (a 2px chip corner is not a 7px card corner) and collapsing them would be a restyle, not a fix. Recorded so the next reader knows the scale is nominal rather than enforced.

---

## 5.9s THE SCRUTINY PASS — five recurring classes, and the gates that now hold them

*Written 2026-08-25, after the sub-views. This section is not a list of fixes; it is the count that made the fixes stop being the point.*

### 5.9s.1 Five classes, thirty instances

| class | instances across this branch |
|---|---|
| **One quantity, two authorities** | 7 — the Track's origins (×3), Home vs Armory, the identity chip vs the permission model, the Door vs the expired banner, the coverage meter's dead override |
| **A mark that fires on ~every row** | 7 — Armory's 109-of-125 alarm, three zeros in an accent, Analytics' always-orange success rate, the Board's 39-of-39, the tier board badging age on 109 builds |
| **A probe that cannot report presence** | 6 — rAF in an unrendered frame, `.find()` on the first track host, the keyboard pass blind to a bare `onclick`, `states()` gone vacuous, a dead CSS selector, retention built and rendered nowhere |
| **A backtick in a template-literal comment** | 6 — two of them on 2026-08-25, and the sixth was inside the comment written to warn about the fifth |
| **A per-call-site fix leaving siblings wrong** | 4 — the zero colour, the lane contract, the meter, the kept-copies surface |

**Thirty instances, five shapes.** Every one passed every gate at the time it shipped, and every fix so far has been to the instance. That is the finding.

### 5.9s.2 What changed: three of the five became mechanical

- **Backticks** → `portal:refs` now lints for a backtick inside `<!-- -->` in extracted script source, with its own falsifier. Prose failed six times; five lines of regex cannot. **And the fifth occurrence taught something the parse check alone could not catch:** two backticks terminate and restart the template, which *parses* — and if the restart lands before a member access it becomes a **tagged template**, valid JavaScript that fails at runtime. A green parse gate is not a green page.
- **Dominance** → audit rule 15 reports, as a **note**, any mark carrying a non-neutral colour on ≥90% of its sibling set. It found the tier-board badge on 109 of 125 builds within a minute of being written — the third place that one conflation was hiding after the masthead and the meter were both fixed. ⚠️ **A note, never a failure**: a universally-applied accent is sometimes right, and a rule that cannot tell those apart gets switched off. ⚠️ **Its first version reported "25 of 14 siblings (179%)"** because it tallied marks rather than marked rows. A ratio above 100% discredits a check instantly, whatever it found.
- **Reduced motion** → rule 14 (coverage) plus PASS 4f (effect). See §15.7b.

The other two — two authorities, and a per-call-site fix — are not mechanisable in general. What exists instead is **PASS 4e**, the only check that loads two pages and compares them, and the standing habit of moving a fix into the Shell rather than repeating it.

### 5.9s.3 What the pass found by looking

- **The Board painted all 39 relative-time figures in the alarm colour** — "released 15d ago" as loudly as "releases in 1d". A `.soon` class now marks only what is within two days, so orange marks 6 of 39: the rows an admin can still act on. Its column headers also answered three different questions; Ended said "10 archived", repeating the count already beside it.
- **Season's repair findings were clickable `<li>`s with `tabIndex -1`** — mouse-only, and invisible to the keyboard pass, which selects by role and a bare `li` has none. **The element that handles a click is the element that must take focus**, and a check that only inspects elements which already declared themselves cannot see the ones that did not.
- **Sorting was mouse-only on four realms.** Every `<th class="sortable">` carried an `onclick` and no tabindex. Now a real `<button>` inside the `th`. ⚠️ **The widened probe first reported 151 findings, and 125 were noise** — table rows whose click merely duplicates a button already inside them. The rule is **reachability**: a click handler is a defect only when nothing inside it can take focus. Burying 3 real findings under 125 false ones is how a probe gets switched off.
- **The Armory coverage meter was green on every card**, because its override selector `.cn.bad ~ * .cmeter i` asks for a `.cmeter` *descendant* of a later sibling and `.cmeter` **is** the sibling. It never matched. A bar meaning "106 of 125 builds are affected" rendered in the success colour. **A dead selector and a deliberate colour look identical.**
- **`Shell.async` was integrated nowhere.** It is a spec for the wiring session to call, not code that runs today — stated in §15.7 so nobody assumes otherwise.

### 5.9s.4 The drawer was modal to a mouse and not to a keyboard

Measured with a typed confirmation open: **218 focusable elements outside the drawer were still reachable**. Somebody could tab past a purge dialog and press something on the page behind it. The scrim stops a pointer and says nothing to a keyboard — the visual half of modality was built and the behavioural half was not, which is the same shape as an `onclick` with no tabindex.

Fixed with `inert` on every sibling of the drawer (which removes the page behind from the **accessibility tree** as well as the tab order — a hand-rolled TAB cycle never does), a manual cycle as fallback, and focus returned to whatever opened it.

> ⚠️ **The first probe for this measured the wrong thing precisely.** It counted elements matching a focusable selector — and `inert` elements still match selectors and still report visible; they are merely unfocusable. It reported 218 both before and after the fix. **The only honest test calls `focus()` and sees where focus lands**, with a baseline that can fail. PASS 4g does exactly that, and asserts the page is usable again afterwards, because an `inert` left behind is a worse failure than the one it fixes.

### 5.9s.5 Checked, and nothing there

Stated because silence is not coverage: the **768 / 900 / 1024 tablet band** — never measured before — is clean on Season, Armory and Access, zero horizontal overflow and zero audit failures at all three.

---

## 5.9q THE DESTRUCTIVE CAPABILITY — the twelfth token, and the first whose *granting* is restricted

*Built 2026-08-25 to Harkirat's specification (§15.11 decision 3). His words: "owner only by default, with explicit permission capability to allow scope to an admin, authorizable only by the owner with explicit warnings (and possibly safeguards like caching/storing the export) so the owner is fully aware."*

### 5.9q.1 What it is, and what it is not

`destructive` is a **command-level token**, not a `manage.*` page scope. It grants nothing on any surface; it grants the right to run the operations that **cannot be undone** — every purge, `season.startNew`, `season.promoteDraft` — across **every realm**, whatever page scopes the holder does or does not have.

Three properties make it unlike the other eleven, and each one is a design obligation rather than a note:

1. **Only the owner may grant or revoke it.** Every other token can be handed out by anyone holding a bare `manage`. This one cannot, which means a delegated admin cannot delegate irreversibility onward.
2. **`all` does not expand to it.** The input-only convenience covers the three original commands and stops there — a convenience that quietly hands out irreversibility is the opposite of one.
3. **It is the one scope that borrows no realm's colour.** Access is the achromatic realm and every other token wears the accent of the realm it governs; this one governs harm rather than a realm, so it wears `--danger-ink`.

### 5.9q.2 Disabled with the reason, never hidden

`Shell.canDestroy()` is the single authority. **One function, because the alternative is the same permission test copied into every surface that gates on irreversibility — and N copies of a rule is N chances for one of them to be the lenient one.** *(This read "five realms' one-way strips" until 2026-08-25. There is **one** `Shell.oneWay` strip, on Season; the other tier-3 surfaces are Review's commit gate and Access's typed revoke. The same overstatement was corrected in §15.11 and survived here — a claim fixed in one place is not fixed.)*

An admin without the capability sees every one-way row **present, legible, and disabled**, with `Shell.whyNoDestroy()` on the control and the rule stated in the strip's own header. Hiding the row would teach nothing, produce a support question, and conceal from that person that somebody else can do this to their data.

⚠️ **The client is not the authority.** This decides what the page *shows*; §15.5 still governs. A portal that only hides the button has no security at all.

### 5.9q.3 The safeguard is retention, not a receipt

The export interlock used to record only *that* an export happened, which makes it a ceremony: an admin could export, discard the file, purge, and leave the owner holding a timestamp instead of the data. `Shell.Export.mark()` now carries `body` — **the exact bytes the download contained**, so the kept copy and the file cannot diverge — and `Shell.Export.retained(scope)` reports whether a copy is actually present.

The confirm only *promises* retention when `retained()` is true. **A safeguard the copy claims and the code does not provide is worse than none.**

⚠️ In the real portal the kept copy belongs beside the ChangeLog row, **server-side**. `sessionStorage` is a mockup shim (§15.11 decision 1), and an export that dies with the tab is not a safeguard for anybody.

### 5.9q.4 The grant is typed, because it authorises typed things

Granting the capability raises a **typed confirmation** — the word is `DESTRUCTIVE`, not an id, because the thing being confirmed is the capability rather than a particular person — carrying a callout that names the specific admin, says what they will be able to do, states that the export is kept, and states that only the owner can grant or revoke it and they cannot pass it on.

**Revoking it does not warn.** A dialog that shouts equally in both directions teaches the reader to skip both; the safe direction stays quiet.

This file uses typed confirmation sparingly on purpose — asking for a typed word on a reversible change teaches people to type without reading. This is the case it exists for.

### 5.9q.5 `?as=` — a state that cannot be rendered is a state nobody designs

The interesting state here is one the mockup's viewer could never reach, because that viewer is always the owner. `?as=admin` is an admin who **holds** the capability; `?as=plain` is one who does not. Both are swept.

That is the same gap that left `?audit=1` never run and every `[hidden]` view unaudited for weeks: **the surface existed and nothing could open it.**

The sweep's assertions are **relational** — the page's own permission verdict must agree with what it drew:

| assertion | the failure it catches |
|---|---|
| `?as=admin` must hold it, `?as=plain` must not | the flag silently doing nothing |
| every one-way row locked ⇔ `!canDestroy()` | a strip that says "owner only" while leaving a button live |
| no one-way row may lack a control entirely | a future edit "fixing" the disabled state by hiding it |
| the identity chip must not read OWNER while the model disagrees | two authorities over one fact |

**That last one caught a real defect the moment it was written:** under `?as=plain` the page correctly refused every one-way operation as owner-only while the header still read *"dior · OWNER"*. Same shape as a ruler and its lanes on two origins — one fact, two authorities, and no per-element rule can see it.

### 5.9q.6 What the audit forced, and why the fix went the other way

Rule 6 asserts a legend may only name states present on screen, and it flagged the new lock entry: *"legend claims 🔒owner-grantable only with none on screen."*

**The tempting fix was to add it to `states()`, which would have made `states()` a lie so that a check would pass.** A legend carries two kinds of entry and only one is a row state — the lock explains a property of a *column*, true whether or not any cell shows it. So the annotation is marked `data-note` and rule 6 skips it: **opting out of matching, never out-specifying.**

### 5.9q.7 ✅ Paid the same day — and what paying it found

`destructive` is a real token in `utils/adminAccess.js`'s `ADMIN_COMMANDS` now, documented on `AdminUser`, and **`portal:gate` reports 12 permission tokens** where it reported eleven all week. The mockup's twelfth column is validated against the bot rather than merely declared.

**Three things the wiring found that the design had not:**

1. **`parsePermissionsInput('all')` returned `[...ADMIN_COMMANDS]`**, so adding the token would have made `all` hand out irreversibility — the exact thing this design says it must never do. `NOT_IN_ALL` is a separate list checked at the one place `all` expands, so the exclusion is visible where it matters rather than as a flag somewhere else.
2. **The existing test asserted `parsePermissionsInput('all')` equals `[...ADMIN_COMMANDS].sort()`.** A test that tracks the implementation cannot notice the implementation going wrong — it would have absorbed the new token in silence. It names the three expected commands literally now.
3. **`formatPermissions` silently dropped it.** It enumerates tokens by name, so `['destructive','manage']` read back as `/manage (full)` — an owner reviewing an admin's access could not see they held the right to purge. **A permission that is granted and invisible is worse than one that is not granted.** Fixed, and `unformattablePermissions()` reports any grantable token the formatter cannot render, so the *next* one is caught by a test rather than by somebody noticing a gap in a summary.

⚠️ **No privacy amendment is needed, and that was checked rather than assumed.** `docs/legal/PRIVACY.md` §2.1b and Appendix A already describe `AdminUser` as holding "which pages/commands they can use" — the `permissions` array is disclosed generically, so a new token in it is neither a new field nor a new kind of data.

---

## 5.9y THE FALSIFICATION PASS — a gate that could not fail, and a family of defects with one shape

*2026-08-25 15:0x EDT. Run at Harkirat's request over the portal, its code, this document and my own work.*

### 5.9y.1 🔴 `.audit-all` could not see a resting-state failure, and I quoted it all day

The harness loaded every page as `p + '.html?audit=1&v=' + Date.now()`. **`?audit=1` DRIVES the page's declared interactions, which MUTATES its data.** Measured on Broadcast: the element carrying a contrast failure existed and was visible at first read, and **3.4 seconds later `span.nspin.warn` no longer matched any element**, because the driven interactions had changed `renderStats`'s `forever` count. A fresh `Shell.audit({})` then returned `ok:true, problems:[]`.

So the harness audited eight pages **that had already been poked**, and reported PASS. **"ALL 8 PASS at 1280 and 390" was a true statement about a page nobody opens**, and it appears in three commit messages and every summary written today.

**Fixed:** every page is now audited **twice — plain first, then `?audit=1`** — and either half can fail. Verified: **ALL 16 PASS at 1280**, so nothing regressed and the resting half is genuinely clean.

⚠️ **Read every green in §5.9u–§5.9x with this attached.** Those sections cite `.audit-all` as evidence and were written before it was known to be half-blind. The claims survive — the two-mode run confirms them — but the *reasoning* that produced them did not, and a green quoted after its instrument was found unreliable is the stale-warning defect running the other way.

### 5.9y.2 The defect the hunt found, flagged twice and fixed by neither

Chasing the contrast finding surfaced one that IS confirmed: `native title carries 146 chars of content` — on the disabled Undo shipped that morning. **Two independent authorities had already said so** — audit rule *"native title carries N chars"* and the copy audit's **E5** — and neither fix landed, because **the rule only fires when the tray holds an op with no registered inverse**, a state no harness reaches: nothing stages work, reloads, and comes back.

Fixed by putting the reason **on the row** (`staged earlier`, with the full sentence in `aria-label`) rather than behind a hover a **disabled** control cannot receive.

### 5.9y.3 A finding recorded WITHOUT a reproduction, deliberately

Broadcast reported `"never ends" is 4.28:1 at 9px — needs 4.5:1` twice, stable across a 3.2-second settle, in a tab that had been driven through many interactions. It does **not** reproduce on a fresh load at 1280 or 1440, scrolled to 600, or with the tray on screen. All eight pages pass a purpose-built **resting-state** audit.

**So it is filed as unreproduced rather than dropped.** ⚠️ **The dishonest move available here was to quietly let it go because it resisted a third look** — a finding observed twice, stable, is not noise for being inconvenient. What is known: `--warn` `#FF7A45` at `--t-micro` (9px) sits at **4.28:1**, genuinely under the 4.5:1 floor, so **any state that paints a 9px `--warn` figure on the masthead ground is a real AA failure**; what is unknown is which state produced it.

### 5.9y.4 🔴 THE FAMILY — four instances, one shape, and this document had no name for it

Every one of these was found on this branch, and each was rediscovered as a novelty because nothing named the class:

| instance | what it answered instead |
|---|---|
| a **cached** test result | "did this pass **last time**" |
| the audit measuring a **half-laid-out** page | "is it correct **before layout finishes**" |
| `document.fonts.check()` returning **true for a font that does not exist** | "**can** text be rendered" |
| the write-once **batch heredoc** | "did the replacement **match**" |
| `.audit-all` loading only **`?audit=1`** | "is the **poked** page clean" |

**The shape: a well-formed answer to a question ADJACENT to the one being asked.** None of them errors, none looks suspicious, and every one reads as a pass. **The only defence that has ever worked is the same in all five — check the artifact, not the log about the artifact**, and give every probe a case it must answer NO to before trusting a yes.

### 5.9z.6 The account panel — brainstormed, after the first pass was reaction rather than design

> *"theres so much redundancy and uselessness. Why are the signout buttons 2 different styles? why is the discord id cut off? what's even the point of 'Find a page or an action / Command palette', whats it even for and is it helpful/useful being there?"*

⚠️ **This section was first written as tidying and is replaced.** It listed his four problems and proposed the inverse of each — keep one sign-out, show the id whole, delete the rows, make the session line live. Every one may be right and **not one is a design decision.** Tidying a panel that should not exist in its current form yields a tidy panel that still should not exist.

**Start from what the panel is FOR.** In ordinary software an account menu carries switching, settings, billing, identity, exit. This product has **one owner and a handful of admins** — no switching, no billing, and preferences live in the bot's `/settings`. Strip those and only identity, session and exit remain.

🔴 **And identity is already answered before the panel opens: the button you clicked IS the avatar and the name.** So the panel's whole header — avatar again, name, handle — duplicates its own trigger. **That is the real redundancy, and it is the top third of the panel**, not the two ⌘K rows.

🔮 **What only the panel can say, and currently does not:** *what you are allowed to do.* Twelve permissions, an owner-only tier, and a `destructive` capability only the owner may grant — and **nothing anywhere in the portal tells you what YOU hold.** A delegated admin discovers it by clicking something and being refused. **The panel becomes: who you are · what you can do · how long you have · the way out.** Three of those four are answered nowhere else.

**The two sign-outs, and the question underneath them.** The shell defends the header button — *"finding it is not the part that should be hard"*. Attack that: **how often does anyone sign out of a single-user admin portal kept open in a tab?** Rarely. So the header spends **permanent, always-visible space on one of the rarest acts in the product.** Now invert it — what is the **most frequent** thing the header does *not* surface? **Committing staged work**, which is what the whole portal is built around, and which lives on a rail badge and a floating tray.

🔴 **The header's allocation is backwards: permanent space to the rarest act, none to the most frequent.** Sign-out moves into the panel, alone, in one style; the freed slot goes to a commit affordance that appears when there is something to commit. ⚠️ **The fair counter:** a sign-out you cannot see is one a delegated admin cannot find in a hurry at a shared machine. Real — and answered by making the panel *obviously* the account panel, not by a second button in a different colour, which is what teaches that they are two different acts.

**The panel is five-sixths label.** Rows that SAY something: name, handle, role badge, staged count, session policy. Rows that DO something: copy-id, sign-out. **A panel that is mostly labels is a card wearing a menu's clothes.**

**The ID, taken seriously.** It exists to be pasted into `/bot access` or a grant — real, but rare. `1139…2283` elides **the middle, which is the only part distinguishing it from any other snowflake**, so the preview cannot confirm it is the right id. Two coherent answers: show it **whole** (19 digits fit and are verifiable), or show **nothing** and let the toast confirm. The elided middle is the one option that serves neither.

**The decoration, and where I disagree with the cheap call.** The presence dot says *"Signed in"* — trivially true of anyone looking at it, so it is decoration wearing status. **It goes.** The banner is ~90px of Discord's own image, and cutting it as waste would be wrong: it is the one place the portal shows something personal, and it makes this feel like Discord's own account panel — **an affinity that is true here, because the product is a Discord bot's console.** It earns its place by shrinking and by carrying the identity block **on** it rather than above it, which also dissolves the duplicated-avatar problem.

**`Session · 12 hours` is the sharpest small example of the whole critique.** It states the **policy**. What a person wants is *"expires in 7h 20m"*. The difference is not wording: **one is documentation about the system, the other is a fact about you** — and that is exactly what separates five label rows from a panel worth opening.

✅ **Already done:** both duplicate ⌘K rows removed. 🔴 **That duplicate was created in this session** — renaming a dead `Switch realm ⌨ G` row into an exact copy of the `Command palette` row beneath it. Failure mode #5, *a per-call-site fix that leaves its siblings wrong*, committed inside the fix for a sibling defect. And his better question stands: **neither row should have existed**, because ⌘K is a permanently visible header control with its own hint.


## 5.9z LIVELINESS, MAGIC, AND THE THREE THINGS HARKIRAT REJECTED

*Decided 2026-08-25. **Recorded here because it existed only in chat**, and a wiring session starting from this document would not have known any of it.*

### 5.9z.1 His definitions, which are not the ones I reached for

> **Liveliness** — *"aesthetically pleasing, breathing life into elements, such as subtle glows, tints, animations upon clicking or doing something, elements dynamically changing on behavior."* **Magic** — *"'wow that was awesome', 'omg the portal can do that?', 'woah that made it so easy' — aspects/features into the portal and its features/design elements."*

**Liveliness is FEEL. Magic is CAPABILITY.** My first pass answered neither: I proposed cursor glow, count-up figures, film grain and a login redesign, and he called them *"such lame and boring ideas"* — correctly, because **not one of the four could only exist in this product.** My second pass over-corrected into metaphor (time as the live material, the season's shape) and he rejected three of four for a better reason than taste.

### 5.9z.2 The three rejections ARE design constraints — do not re-propose them

| rejected | his reason, which is the constraint |
|---|---|
| **time as the live material** (draining windows, a creeping NOW) | *"useless for majority of the seasonal info since it spans days and I'm not going to be staring at my screen for days"* — **a quantity that moves slower than a session cannot be shown as motion.** That kills every ambient-time idea, not just this one |
| **the player's phone** (a live Discord render) | *"a confusing mechanism that doesn't help me at all when drafting things"* — a second surface to read while editing is a cost, not a preview |
| **the season's shape** (a density glyph) | *"so useless and tells me nothing"* — but ✅ **"i like the chart design and want its aesthetic implemented to some areas of the Analytics realm"**, my choice where |

### 5.9z.3 Approved, with his refinement notes attached

**All eight liveliness items**, plus a refinement pass. Two named: ⚠️ **the toast needs a much smoother animation**, and ⚠️ **the lifted card needs colour on the lifted state**, not just a shadow.

**All four capabilities.** Two named: ⚠️ **paste-anything must be more intuitive**, and 🔴 **fix-all-mechanical needs a companion element that VISUALISES the proposed change** — *"rather than it being blind trust and execute."* That note is the whole feature: a one-click fix you cannot inspect is precisely what the staging model exists to prevent, so each fix shows its **before → after** before anything stages.

**Filed, not built:** motion as a system across all realms. ⚠️ **That is NOT the liveliness work** — conflating the two is how the deferred entry gets wrongly closed.

### 5.9z.4 The masthead figures — and the trap inside "can they all have relevant colours"

⚠️ **Taken literally, the ask destroys what it is trying to improve.** If every figure is coloured, colour stops carrying information and becomes texture. The current row at least means *this one is a problem*, even if it says it badly. So the question is not which colour each number gets — it is **what a masthead figure is for.**

**Three kinds of number are wearing one costume.** From `MP BUILDS SHOWN 125 · RANKED 64 · STAGED 0 · NEED REPAIR 11 · STALE 106`:

| kind | example | valence |
|---|---|---|
| **a SIZE** — how much there is | 125 builds · 2 live | never good or bad |
| **a STATE** — how much needs you | 11 need repair · 1 never ends · 106 stale | has a valence |
| **YOUR OWN WORK** | staged | neither — but it is the only one you can act on directly |

🔴 **The grammar that falls out, and it is §4's own rule finally applied:** a **size** takes its realm's **topic** colour (MP builds in Armory red, live announcements in Broadcast yellow), because a size names a topic. A **state** takes a state colour **only when it is non-neutral** — `NEED REPAIR 11` is warn, `NEED REPAIR 0` is not. **Staged takes `--staged` cyan when non-zero**, so the one figure you can act on is the one that changes appearance when there is something to act on.

🔴 **`0 STAGED` rendering grey-dimmed is the most wrong thing in the row, and it is wrong in an instructive way.** The `.zero` class dims a zero to mean *nothing here* — correct for `NEED REPAIR 0`, and **exactly backwards for `STAGED 0`**, where a clean slate is the *good* state and dimming makes it read as absence rather than as *you are up to date*. **One class, two opposite meanings** — the one-quantity-two-authorities shape, in CSS.

**And "improve their design in some way" has an answer bigger than colour: the row has no hierarchy.** Five figures at one size, one weight, evenly spaced, so the eye has nowhere to land. The realm's **defining** number should lead at full size and the rest should be secondary — which is a larger improvement than any palette, and neither of us reached it until the numbers were sorted into kinds.

### 5.9z.4b The underlined controls — the answer is not "remove the underline"

**Three affordances are stacked on one control:** a border says *button*, an underline says *link*, an arrow says *navigation*. Any one would do; all three at once is why they read badly, and deleting the `text-decoration` fixes a third of it.

🔴 **The larger question nobody asked: does that row need a button at all?** Each Home attention row already names one destination and one thing wrong with it. **The whole row could be the target.** Then the arrow is the only affordance, the underline problem disappears, the right column stops being a wall of five near-identical controls, and the reclaimed width can say **how bad** instead of **where to go**.

⚠️ **The cost, stated fairly:** a whole-row target is worse for keyboard and screen-reader users if built as a click handler on a `div`. It has to be a real anchor wrapping the row, which puts the rank number and the severity bar inside a link — legitimate, but deliberate. That is a real cost, not a reason to avoid it.

### 5.9z.4c 🔴 THE THREAD THROUGH ALL FOUR OF HIS NOTES

The account panel duplicates the button that opens it · Home's cards duplicate its attention list · the masthead's `.zero` class serves two opposite meanings · the attention rows carry three affordances for one act.

**Every one is a REDUNDANCY THAT LOOKS LIKE COMPLETENESS.** Nothing is missing anywhere. Things are said twice, in ways where the second saying weakens the first. **That is the portal's actual design problem**, and no per-surface tidy would have surfaced it — which is precisely why he insisted these get a thinking pass rather than a quick read.

### 5.9z.5 Home — why it goes unused, and the plan

His words: *"its all over the place… looking at it, i feel like i'd never utilize it."* Five reasons, ranked by cost:

1. 🔴 **The cards and the attention list are two authorities over one question.** The list ranks what needs you; the cards then list every realm again, undifferentiated, one stat each — so Armory is card #2 whether it has 13 broken builds or none. **The same defect class as Home saying 117 need repair while Armory said 11, one level up: not two numbers disagreeing, two layouts disagreeing about what matters.**
2. 🔴 **Home is the only realm with no masthead figures.** The one page whose job is *"what is the state of things"* opens with a title and a paragraph.
3. 🔴 **No card stat says whether it is GOOD.** *39 scheduled items · 133 of 133 builds · 2 showing now · 3 admins · 496 interactions* — only one carries a judgement, and only by accident of its denominator. A number with no comparison is homework, not a glance.
4. 🟡 **"Nothing staged" sits at the BOTTOM**, ~1500px down, under five cards — the most actionable fact on the page, reached last.
5. 🟡 **The three-line lede is design rationale addressed to a reviewer**, costing ~180px above the fold on the page he opens first. The §F2 defect, fixed on four other pages and left on this one.

**Plus the mechanics:** five cards in a 2-up grid **orphans Analytics** on its own row, which is the literal source of "all over the place".

**THE PLAN — Home answers three questions in one screenful, in this order:**
1. **Is anything wrong?** → the attention list, which already works and is the best thing on the page.
2. **What is live right now?** → 🔴 **the portal's actual subject, and Home does not answer it at all.** What a player would see this second — the live season and its days left, what announcements are showing, what runs today.
3. **What is uncommitted?** → the staged bar, moved to the top.

**Concretely:** cut the philosophy lede · give Home a masthead figure row that summarises **all five realms** (days left · live now · staged · needs you) · demote the five realm cards to a **compact navigation rail** with one figure and a state dot, so they stop competing with the attention list · spend the reclaimed space on **what is live** · move the staged bar directly under the figures.

## 5.9x THE TWELVE WORDS — the vocabulary, settled before the rebuild

*Decided 2026-08-25 14:0x EDT by Harkirat, from a rendered decision document rather than a list in prose. Settling it now is not tidiness: **the wiring rebuild copies these strings forward**, and a rebuild is where a vocabulary stops being a choice and becomes the product.*

### 5.9x.1 The four that were real forks

| concept | decided | what it means in practice |
|---|---|---|
| **a section of the portal** | `realm` **stays in the code, leaves the copy** | `Shell.REALMS` and the rail's grouping keep the word — it is a good developer word for "one of the eight". Anything a person reads names the page: *"Could not load Season"*, *"Search Access, or run a command"* |
| **a grantable unit of access** | **`permission`** | Four words for one thing — token (38), scope (69), permission (30), capability (10) — on the screen where you hand someone the ability to purge data. "Permission" is the only one a non-author would reach for, and the form field already used it |
| **taking a record out** | **`Remove`** (reversible) + **`Purge`** (one-way), `Delete` retired | The two words map onto reversibility, so the word itself tells you whether you can take it back. `Delete` meant the same as `Remove` but *sounded* worse, which made the safe act feel dangerous and the dangerous one feel ordinary |
| **the big table** | **give it a visible heading** | "Manifest" existed only in an `aria-label` and two toasts, so a toast saying *"Pick a category chip in the Manifest"* pointed at a word nowhere on the screen it pointed at. It now carries the same eyebrow every other labelled row uses, inside the tools row so it costs no vertical space |

⚠️ **The `permission` decision creates a deliberate split and it must not be "fixed" later.** The bot's model is `MANAGE_PAGE_SCOPES`, so **scope is the right word in the source and permission is the right word in the UI.** They differ on purpose.

### 5.9x.2 The eight with no real fork

**Undo** for taking one staged change back (retiring *Drop*, *take back*, item-level *Discard*) · **Discard all** as the single all-or-nothing label, which is what lets *Undo* always mean "this one" · **staged changes**, not *changeset*, a git word that appeared only on Review · **Export** for the control and the verb with **Download** reserved for the button that produces a file, retiring *Take out*, *Record*, *Audit*, *Export out* · **blocker**, not *gate* · **format** for an export's shape, because *scope* already means a permission on an adjacent screen · **Reverse** for undoing something already **committed**, because that is a new write and not an un-happening · and **one past-tense verb per op** in the tray, which is where every realm's language ends up side by side.

🔴 **The `Undo` / `Reverse` split is the one with teeth.** Analytics offered *"Undo this change"* on a row that had already reached players. Keeping one word for both senses teaches that committing is reversible — the single belief the whole tier system exists to prevent.

### 5.9x.3 A defect in my own tooling, recorded because it repeated

The scripted multi-edit helper used all session **wrote the file once, after its loop**. So when a later assertion failed, **five edits that had already printed a tick were silently discarded** — `reachable scope`, the TTL-index line and three drawer eyebrows were still in the tree hours after being "applied".

⚠️ **This exact failure was recorded earlier the same day and repeated anyway.** A per-edit print says the replacement **matched**; only the write says it **landed**. The helper now writes after **every** edit and reports a miss without aborting, so one bad anchor can never take the successful edits with it.

**The general form, which is the part worth keeping:** an operation that batches N changes and commits once has a failure mode that looks exactly like success right up until you check the artifact — the same shape as a cached green, and the same answer: **verify the thing, not the log.**

## 5.9w THE COPY AUDIT — the portal promised opposite things one click apart

*2026-08-25 13:4x EDT. A read-only pass over every user-facing string in the eight pages and `shell.js` returned ~45 findings, five blocking. Full report: `local/handoff/2026-08-25-portal-ux-copy-audit.md` (gitignored — state that path).*

### 5.9w.1 The one that could have cost real work

**The portal made flatly opposite promises about whether staged work survives sign-out, in five places, and the two loudest were one click apart.** `door.html` and the expired banner said it is held against your account and returns when you sign back in. The sign-out confirmation said it *"lives in this browser session and is lost on sign out"* — **and then called `Store.clear()`**, so the copy was wrong and the behaviour was wrong with it. §15.11 settled this in the portal's favour: staging is server-side. The store now survives, the dialog says so, and with nothing staged it stops being a data-loss warning about zero items.

⚠️ **This is the shape to watch for, not the instance.** A decision recorded in one document does not propagate to five strings written before it. Nothing in the gate roster can compare two sentences for agreement — which is the prose version of the same relational blind spot every audit rule has.

### 5.9w.2 The other four blockers

| | |
|---|---|
| `season.html` | a **tier-3** op said *"Undo is available afterwards"* while every other tier-3 surface says the opposite, and it is not export-gated. The tier number is the whole safety contract; one op that says 3 and reads 1 teaches you to stop reading it |
| `broadcast.html` · `armory.html` | **Delete and Remove were the same op at two tiers**, chosen by which control you clicked. One verb now: *Remove* |
| `review.html` | the masthead read **"1 GATES OPEN"** — warn-coloured, plural on a count of one, and *"gates open"* means the reverse of what it says. Now *"1 blocker"*, with the noun agreeing |
| `shell.js` | the fallback banner was **`"Something is wrong."` with an EMPTY `means`** — the pattern §10.6 explicitly bans, as the default for every unclassified failure, two lines below the two cases that do it right |

### 5.9w.3 A live logic bug the copy pass found

`broadcast.html` guarded on `lifecycle(a) === 'live'`, and `lifecycle()` returns **`'LIVE NOW'`** — it never returns `'live'`. So the "this one is live right now" callout had never rendered once, and **the "What is live now" export permanently counted 0 announcements and built an empty file.** `a.state` is the field it meant, and `queue()` two lines away already used it. A copy audit found a data bug, because reading a string in context means reading what produces it.

### 5.9w.4 A defect the new tray undo had introduced

Ten staging sites already passed **`realm:'season'` as a string**, and `fixtures.js`'s sample changeset does too. §5.9u's per-row undo reads `realm.href`, so every one of those got `undefined` and drew a **disabled** button. Normalised at `Store.add()` — the same choke-point argument as the tier and the row shape, and the same lesson: **a new field added at one call site is a field nine other call sites already have their own idea about.**

### 5.9w.5 What was cut, and the rule behind it

**Engineering leaked into the UI in nine places** — `core/ops`, `apply()`, `ownerOnly()`, `utils/owner.js`, `ADMIN_COMMANDS`, `NOT_IN_ALL`, `models/Announcement.js`, `UserPreference.seenAnnouncementIds`, `ChangeLog`, "on every build", "a Mongo TTL index". The reader is an admin deciding whether to destroy data, not a maintainer reading the repo: a file path costs them a beat and buys nothing.

**Copy that justified its own existence** — *"Why the Best row holds 18 cards and not 7"*, *"Why this view exists at all"*, *"Comparing is the reason this view exists"*, *"is deliberate and must never collapse into one number"*. A UI explaining why it was built this way is arguing with a reviewer who is not there.

**One rhetorical template used three times** — *[terse fact] — and the two [things] [X] cannot [show]: [a], [b]*. Once it is a voice; three times the reader hears the pattern instead of the content. Broadcast's kept, Access's flattened.

**Dates and "now"** — *"removed on 2026-08-13"*, *"as of 2026-08-25"*, *"the old in-memory undo Map"*. A "now" only means something to a reader who saw the before; a date in UI copy is a changelog entry.

⚠️ **`review.html`'s "Load a sample changeset" button and its note are DEMO ONLY and must not ship.** Both address a reader of the mockup rather than a user of the portal. Marked `data-demo-only` with a 🔴 comment naming the removal, because a thing that must be deleted later needs to be findable later.

### 5.9w.6 What the audit said is already strong — do not "improve" it

The empty states as a set (`season.html`'s `EMPTY` map names what each column *is*, why it is empty, and what to do, in one line each) · the offline and expired banners, which are the proof that the fallback was a miss and not a limitation · **consequence-first framing that names what a *player* experiences** · headings that carry an idea ("What one player gets", "Ack — the clock Discord is holding") · the confirmation chain, where `Shell.confirm` derives the button from the title · the typed-confirmation and one-way copy · validation microcopy · **and the domain vocabulary, used correctly and consistently throughout — none of it should be simplified.**

### 5.9w.7 The vocabulary table is the part that has to be settled BEFORE the rebuild

The report's highest-leverage section is not a finding, it is a table: **twelve concepts the portal names more than one way.** Undo / drop / take back / discard. Remove / delete / purge. Token / scope / permission / capability. Export / take out / record / audit / download. Realm / section / the page's own name. Gate / blocker. This pass standardised the ones inside the blockers; **the rest must be settled before the wiring rebuild copies the strings forward**, because a rebuild is where a vocabulary hardens.

## 5.9v THE DISPLAY VOICE — two faces, four declarations

*2026-08-25 13:1x EDT. Harkirat picked from a rendered specimen, not from a list of names: **Big Shoulders Display on the figures, Instrument Serif on the page titles.***

### 5.9v.1 The gap, stated as a measurement

One family — Space Grotesk — was setting a **9px uppercase label and a 44px masthead figure**, three sizes apart and nothing else. `tokens.css` declares three display steps (`--t-display` 44 · `--t-figure` 34 · `--t-h1` 22) and then set all of them in the UI face, because there was no other face to set them in. A UI face doing display work is not a neutral choice; it is the absence of one.

### 5.9v.2 Why two faces and not one

The specimen answered this rather than an argument. **Instrument Serif is the most memorable of the four candidates and it fails on function**: at 34px its hairlines make an alarm figure read *delicate*, and on this portal a figure is a **status signal** — the number that most needs to shout is the one that face whispers. **Big Shoulders is the opposite**: condensed, flat-sided numerals that read like a gauge, which is what a season masthead is.

So the split is not indecision, it is the falsifier's answer: **the serif never touches a number, so its one real failure never happens**, and the figures get the face that makes them instruments.

| token | face | where | why |
|---|---|---|---|
| `--title` | Instrument Serif | `.masthead h1` · `.hmast h1` | a serif over a monospace data grid, on near-black — the identity |
| `--display` | Big Shoulders Display | `.mh-stats .v` · `.tile .tl-v` | condensed numerals read as a gauge, and buy real width at 390px |

🔴 **BOTH FALL BACK TO `--ui`.** If a webfont fails, the masthead degrades to exactly what it looked like before this change rather than to a stranger. ⚠️ **`--title` ships ONE weight (400)** — never write a `font-weight` against it.

### 5.9v.3 Four declarations, and the restraint IS the design

Everything from `--t-hero` (24px) down stays Space Grotesk; data stays JetBrains Mono. The two new families appear about **five times per screen**. `.dw-h h2` (a drawer title at 22px) was deliberately left in the UI face — a confirmation dialog is functional copy, and giving it a display face would spend the effect where it means nothing.

⚠️ **A relational check, not a per-site one, is what proved this landed.** Enumerating every rule in `app.css` that sets a font-size ≥22px and reporting **which face each actually resolves to** is the only shape of check that can see a display step still sitting in the UI face — asking "does this element have a family?" never could. Home's realm-card figures (`.hcard .hf b`) came back in `--ui` and were **left there on purpose**: they are `--t-xl` (19px), in the UI range, and the hierarchy *masthead figure 34px display → card figure 19px UI* is legible. Sprinkling the face into the UI range is exactly what would erode the restraint that makes it work.

### 5.9v.4 The probe that lied, recorded because it will be reached for again

`document.fonts.check('700 44px "SomeFace"')` **returns `true` for a family that does not exist.** It answers whether text can be rendered, not whether the named face loaded — so every "the font is loaded" reading from it is worthless, and a fallback render and a real render are indistinguishable.

**The honest probe is width:** set the same string in each face over a *monospace* fallback and compare. Baseline 742px; the invented face measured **742** (not loaded) and every real face measured differently — Instrument Serif 442, Big Shoulders 464, Chakra Petch 628, Space Grotesk 639, **Archivo 641**. That last pair is also the evidence that retired Archivo: a display face whose whole job is to differ from the UI face should not set the same string within 2px of it.

### 5.9v.5 The two artifacts

Both are published and both were verified by rendering, not by reading: **the display-face specimen** (the four faces in the real masthead, live-switching, with the token diff) and **four live ideas** (the liveliness and magic proposals, built as working demos rather than described — a draining window, a creeping NOW, a Discord card that updates as you drag, two season density glyphs, and a commit that resolves its ghosts one per beat).

⚠️ **A charset trap worth carrying:** a published page with no `<meta charset>` was served as **windows-1252**, and every `·` and `—` became mojibake. The encoding sniffer scans the first 1024 bytes wherever the tag sits, so `<meta charset="utf-8">` as the first line fixes it even though the publish wrapper supplies its own `<head>`.

## 5.9u THE SHAPE SCALE, AND AN UNDO THE COPY HAD BEEN PROMISING FOR WEEKS

*2026-08-25 12:29 EDT. Two of Harkirat's four answers landed as code; the other two landed as judgement and are recorded here so they are not re-litigated.*

### 5.9u.1 ⌘Z stays NATIVE — the undo is a button, and the tray never had one

**His words:** *"i dont want cmd z to revert a fully staged item, i'd rather have a mechanic button for that action. i want cmd z to remain as a native undo, such as undoing typed edits in a text field, etc"*

Measured before changing anything, because the question was whether ⌘Z was already taken: **nothing in the package binds it.** `shell.js` binds ⌘K for the palette and checks `metaKey` explicitly; the three bare-key `n` shortcuts on Broadcast, Armory and Access all return early on `metaKey || ctrlKey || altKey` **and** on `INPUT|TEXTAREA|SELECT`. So native undo inside a field has always worked and no code was needed for that half.

The other half was a defect. `shell.js` has rendered the copy **`reversible · undo stays in the tray`** on the selection bar since the delete/export work, and the tray offered exactly two verbs — **Discard everything**, and Review. The one thing the copy named was the one thing missing. That is the same class as the tray header that carried `role="button" aria-expanded` with nothing listening, and as the remove-confirmation drawer whose body reads *"the tray can put it back until then"* — written for a mechanic that did not exist.

**Now:** every row in the tray carries its own `Undo`. Per row, because `Discard` is all-or-nothing and one mistake in a five-op changeset should not cost the other four.

### 5.9u.2 The undo is honest about where it can run — a route, not a refusal

`Store.inverses` is an **in-memory** map; `Store.all()` reads `sessionStorage`, which survives navigation. So an op staged on Season has no inverse the moment you walk to Armory, and a naive button would be dead on every other realm.

`Store.add()` now stamps `op.realm` at the one choke point every staging path already passes through — the same place the tier is derived, and for the same reason: a per-page stamp is a per-page thing to forget. The tray then renders one of three states:

| state | control |
|---|---|
| the inverse is registered here | **`Undo`** — reverts the change and drops the record |
| staged on another realm | **`Undo on Season`**, a link to that realm — *the answer is a route, not a no* |
| no inverse and no realm known | disabled, with the reason in the title |

🔴 **A DEFECT THIS FOUND, AND ONLY LOOKING FOUND IT.** Every staging site calls `Store.add()` — which renders the tray — and *then* `Store.onInvert()`. So at the moment a row is first drawn, its own inverse does not exist yet: staging two removals on Season live produced `Store.inverses` holding **both** ids and the **second button still disabled**. A state read one call too early, which is the same shape as an audit measuring a half-laid-out page. `onInvert()` re-renders the tray now.

### 5.9u.3 The shape scale — 308 declarations, 29 values, and no rule could ever have seen it

**Measured:** `border-radius` appeared **308 times across 29 distinct values** — `1px 1.5px 2px 2.5px 3px 4px 5px 6px 7px 8px 9px 10px 11px 12px 14px 20px 50% 99px 999px` and multi-value forms — while `--rad` existed and carried **44** of them. Eight steps inside a 1–9px band is not a scale; it is noise. It is `tokens.css`'s own type warning — *"a dashboard fails typographically when every size is within 4px of every other size"* — applied to corners instead of text, and sitting in the file that states it.

**No browser rule could have caught this, and that is the general lesson rather than a detail.** Every audit rule asks *for each element, is P true?* — and 29 answers disagreeing is not a property of any one element. It is a source-level invariant, so it is checked at the source, in CI, by `portal:gate`'s **`radius-scale`**, rather than in a harness a human has to remember to open.

**The scale, with steps at the population centroids so the collapse moves most declarations by 0–1px:**

| token | value | for |
|---|---|---|
| `--rad-1` | 3px | chips, ticks, tags — boxes under ~24px |
| `--rad-2` | 6px | the default: buttons, inputs, cards, panels |
| `--rad-3` | 10px | large containers: drawers, modals, the ⌘K palette |
| `--rad-round` | 50% | circles — avatars, dots, status beads |
| `--rad-pill` | 999px | pills — a radius that always exceeds half the height |

⚠️ **The last two are NOT steps.** A pill and a circle are *shapes*, not sizes, and folding them into a numeric scale is exactly how a pill becomes a rounded rectangle. The four `20px` declarations were all pill-shaped chips at 32px tall, so they became `--rad-pill`, not `--rad-3` — nearest-number would have been wrong.

**One exemption, declared at the site rather than in an allowlist:** `.dcard`'s 8px is *Discord's own* corner, namespaced-foreign in the same spirit as the `--dc-*` colours, because the preview must look like Discord or it stops being a truthful preview. It carries `/* foreign-radius: … */` where a reader will see it.

### 5.9u.4 This REVERSES a decision made two days ago, and says so

v3.68.0's changelog entry recorded this same measurement and concluded: *"left alone deliberately, since most are intentional at their sites."* That is now reversed, on Harkirat's answer of 2026-08-25 — asked whether one surface should be pushed to be memorable, he replied: *"why push one surface? does an awwwards worthy website compromise on one thing? or does it push every aspect of the website to it's upper echelon?"* A shape language is an aspect. ⚠️ **The earlier entry also undercounted** — it said *"256 hardcoded literals across nine values"*, which was `app.css` simple-`px` declarations only; the full figure across every file and form is 308 / 29.

### 5.9u.5 The gate's own falsifier was blind before it was vacuous

`radius-scale` shipped with **two** probes, because a check that fires on everything is as useless as one that fires on nothing and the second half is the one normally left out: an off-scale value must fail, **and a legal corner must stay quiet**. Without the second, the function could be rewritten to fail unconditionally and every existing falsifier would still go green.

It also failed a way no plant would have found. The first version matched the exemption comment with `/\*[^*]*\*/`, which **cannot cross an internal `*`** — and the one real exemption in this package contains `--dc-*`. The comment was never recognised, so its prose was parsed as the value and the gate reported **fourteen English words as illegal corner values**. A pattern that cannot parse the single case it was written for is the same defect as a probe that cannot report presence; it cost nothing to find because the gate simply went red.

### 5.9u.6 `season.html` stays one file — the reason, since the question will come back

Harkirat delegated this one: *"i'll leave it in your judgement based on agentic workflow because realistically claude code will be touching it, not really me or another human dev."*

**Measured rather than felt:** 2,847 lines, of which **2,630 are one `<script>`** holding **one IIFE and 78 top-level functions** — but also **twelve `═══` section banners** spread evenly (442, 721, 1663, 1856, 1921, 1973, 2200, 2276, 2553, 2653, 2700, 2752) and 82 top-level rationale comments. ⚠️ **My first probe said there were none**, because its pattern also returned zero on `shell.js`, which is full of them — a blind probe, caught by falsifying it against a file whose answer was known. A second wrong reading followed: "two 1,100-line unsectioned regions" was an artifact of `head -50` truncating the banner list.

So the file is **navigable**: `rg '═══' season.html` derives its map live and can never go stale, which is strictly better than any index written into the file. Against that, splitting would touch the most-verified file in the package, teach the refs gate about external page scripts, add cache-buster stamps, and produce structure that Harkirat's decision #2 (§15.11 — the wiring **rebuilds** from these mockups) throws away for a different runtime. **It stays.**

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

### 15.7 Async — designed 2026-08-25, and renderable

*This section read "every loading, in-flight and failure state is undesigned" until 2026-08-25. It was the real wiring blocker: you cannot build "to the mockup" against states nobody drew. It is built now, in `Shell.async`, and every state below can be put on screen with `?net=`.*

**Four rules, and they disagree with each other on purpose:**

| rule | the failure it prevents |
|---|---|
| A **first** load skeletons **in the shape of the content**, never a spinner (§10.6) | a spinner says "something is happening"; a skeleton says "a Track with five lanes is coming", and only the second lets the reader start reading the layout |
| A **refresh does not skeleton** | blanking correct data to announce that you are re-fetching it is a regression dressed as feedback |
| **Slow is its own state**, at a 2.5s threshold | a reader who concludes the portal is broken reloads **mid-write** |
| A failure names **what failed, what it means, and the one action** (§10.6) | "Something went wrong" is the error equivalent of a bare "No results" |

**A commit is N ops in one transaction (§15.3), so progress is per-op and a failure NAMES the op.** A percentage cannot say which one broke, and at that moment "which one" is the only question worth answering: *Stopped at 24 of 40 · calendar.bulkReplace refused: the row it targets was edited 40s ago.*

**A rollback is SEEN.** An optimistic write that loses a concurrency check (§15.4) is taken back visibly — the row returns to its old value with a mark and a sentence. A value that silently reverts is indistinguishable from a portal that ignored the click, and the reader's next move is to do it again, which is how one lost edit becomes three.

**Two page-level facts take a page-level bar** — the backend is unreachable, or this tab outlived its 12h `PortalSession`. Both name the one action, and both say **staged work is safe**, because that is the reader's actual fear and an "offline" notice that does not answer it only adds to it.

⚠️ **`Shell.async` IS A SPEC TO CALL, NOT CODE THAT RUNS TODAY.** No realm's render path invokes it, because the mockup has no async — the fixtures are synchronous. `?net=` demonstrates every state; **nothing integrates them**. Do not read the presence of `Shell.async` as "async is already handled".

**A realm opts in with one attribute pair:** `data-async-host` on the element that owns its data, and `data-skel="rows|w,w,w"` declaring its own skeleton rhythm. No per-realm JS, so a new realm cannot forget to wire async and quietly ship with no loading state.

🔴 **`?net=loading|refresh|slow|fail|commit|commitfail|offline|expired|rollback` makes every one of these renderable, and that is not a convenience.** This package keeps re-learning that a state nothing can put on screen is a state nobody designs and no check can open — `?audit=1` went unrun for weeks, every `[hidden]` view was audited by nothing, and the owner-only refusal was undesignable until `?as=` existed.

✅ **Swept 2026-08-25.** `.states.html` PASS 4d drives all nine and asserts the **rules**, not pixels — because the rules are what a future edit breaks: the skeleton must be shaped like the content and announce itself exactly once, a refresh must not blank its data or render a skeleton, a failure must carry all three of what/means/action, a commit failure must NAME the op, and both banners must say whether staged work survived. Six falsifiers prove each of those can fail (a slab skeleton, a silent live region, a refresh that blanked, a failure with no action, a commit failure that names no op, a banner silent about staged work).

### 15.7b `prefers-reduced-motion` — measured, and it was a third broken

*This document said for weeks that six blocks existed, the syntax was right, and nothing had ever observed them take effect — with the standing warning **"do not read 'the CSS is there' as 'it works'"**. Measured 2026-08-25 by enumerating every rule in every sheet:*

| | |
|---|---|
| selectors declaring motion | **93** |
| selectors with a reduced-motion override | **44** |
| carrying a real `animation` and **not** covered | **10** |

The ten included **`.now::before`, an infinite 2.8s pulse on the NOW marker** — the single most literal case the preference exists for — plus `viewIn` on every view switch, the Board and Rack stagger, `.bar.conflict`, and the composer opening.

**None of that is visible in a diff and none of it is visible by reading a block.** Coverage is a relationship between two sets of selectors, and no amount of looking at one block reveals what the other set contains — the same shape as a ruler and its lanes on two origins.

Fixed, and **audit rule 14 now holds the line**: the first rule in this file that reads the *stylesheet* rather than the page, failing when any selector declares a non-`none` `animation` with no override.

⚠️ **Scope is `animation`, not every transition.** A colour or opacity transition is not movement, and neutralising all 57 of them would flatten the interface for no accessibility gain — a check that demands the wrong thing gets switched off.

⚠️ **It asserts COVERAGE, not that the preference works.** Nothing available here can emulate the media feature. What is proven is that every animating selector has an override — a necessary condition, and the one that was actually false.

### 15.8 Constants named elsewhere in this document

**The three view-flags, because a state nobody can render is a state nobody designs:** `?audit=1` drives the declared interactions, `?as=admin|plain` renders the portal as somebody who is not the owner, and `?net=loading|refresh|slow|fail|commit|commitfail|offline|expired|rollback` puts each async state on screen. `?empty=1` blanks every record array and `?today=YYYY-MM-DD` moves the pinned date. All six are swept.

**Two tabs share one `sessionStorage` key today, and they will fight.** Each tab reads the staged list at render and writes the whole array back, so the last write wins and the other tab's staged op disappears with no warning. That is a mockup-shim consequence, not a design — §15.11's server-side staging decision is what fixes it, and the fix is *per-account records*, not a smarter merge. Said here so a wiring session does not inherit the shim's behaviour as a specification.

`MIN_SPAN = 7` days — the Track never zooms past a readable week. `Store` persists under the `sessionStorage` key `dioreo-portal-staged`. `.serve.py` binds `127.0.0.1:8899`. The `?v=` cache-buster on asset URLs is still bumped by hand, but **it is no longer unenforced**: `portal:refs` fails when an asset's mtime is newer than the `?v=` stamp of the pages referencing it. That was the last admitted-unenforced step in this package, and it was the obvious one to close — a stale asset has produced three false "verified" claims here, and thirty-five references were bumped by hand on 2026-08-25 with nothing checking whether that had happened. ⚠️ It uses **mtime**, so a fresh `git clone` (which stamps every file at checkout time) can report a false positive; that is the safe direction, since the remedy is to bump and bumping is free. Proven able to fail by touching `app.css` and watching it go red. None of this transfers to the real portal, which serves its own assets and needs its own cache policy.

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
- **Only the owner can grant it** — true, and ⚠️ **the REASON stated here on 2026-08-25 was wrong, and is corrected rather than quietly deleted.** It read *"Not an admin holding `manage`. This is the first token in the model whose granting is restricted."* It is not the first: **every route in `portal/api/access.js` is wrapped in `ownerOnly()`**, and in the bot only the owner may grant at all. Granting has always been owner-only for all twelve tokens. What IS novel is two things the check found while wiring it into the bot: it gates **who may RUN a tier-3 operation**, which no other token touches, and **`all` deliberately does not expand to it** — `NOT_IN_ALL` in `utils/adminAccess.js` — so it is the one token that can never arrive by shorthand. A convenience that quietly hands out irreversibility is the opposite of one. The matrix still marks the column, because "the owner grants this" is worth saying even when it is true of everything.
- **The grant flow carries explicit warnings**, in the same voice as the one-way strip: it names what the admin will be able to do that cannot be undone, and it is a typed confirmation, not a checkbox.
- **The safeguard is export retention.** The interlock today only asks whether an export *happened*; the tier-3 record should keep the export itself, so a purge run by a delegated admin leaves the owner holding the data that was purged rather than a note saying somebody downloaded it.

✅ **BUILT 2026-08-25 — see §5.9q.** The matrix carries twelve tokens with the owner-only one marked, the one-way strip states the rule and disables with the reason, the grant is typed, and the export is retained rather than witnessed.

⚠️ **Two claims in the original note were wrong, and they are corrected rather than deleted.** It said the work would touch **`portal:gate`'s token count** — which at the time it could not, because the gate builds `PERM_TOKENS` from the real `utils/adminAccess.js`. ⚠️ **That correction is itself now out of date, three hours after being written:** the token went into the bot the same day, so the gate reports **twelve**. A correction is a claim like any other and rots at the same rate. And it said **"the one-way copy on five realms"** — there is one `Shell.oneWay` strip, on Season, because Season holds every tier-3 *entity* op (`draw.purge`, `calendar.purge`, `patchnote.purge`, `season.startNew`); Review's commit gate and Access's typed revoke are the other two tier-3 surfaces and they are not strips. A scope written from memory rather than from the tree overstates in exactly this direction.

**4. ✅ ANSWERED 2026-08-25 — `--ink4` stays, and the question was wrong twice over.** It asked whether a "non-text token with 15 uses" could collapse into `--rule2`. Measured: **35 uses, not 15** — and **12 of them are text** (9 `color`, 3 `stroke`), so the premise that it is non-text is false. `--rule2` is `#3A4752`, a border colour: putting 13px text on it over `#0B0D0E` lands near 1.6:1, nowhere close to AA, and the audit's contrast rule would fail every one of those twelve. The ink scale is honestly four steps because four are used as ink. **A question carried in an open-items list for a week on a count that was 2.3× wrong is its own lesson** — an unanswered question rots exactly like an unmaintained number, and this one was quotable and untrue the whole time.
4. ✅ **`--ink4` — ANSWERED, it stays.** See the entry above; the "15 non-text uses" premise measured out at 35 uses of which 12 are text. *(This question appeared twice in this document, in the same section, with the same stale number — which is what a hand-maintained open-items list does when nothing checks it.)*

*Closed 2026-08-24: the accents for Broadcast, Access and Analytics (§4.2); `review.html`'s design (§5.8); the WCAG AA floor, now measured rather than claimed; the responsive contract, verified at 390px rather than assumed; and keyboard paths for **both** drag surfaces — Season's Board and Armory's tier board. *(This read "all three" until 2026-08-24, counting a Broadcast reorder that had been removed.)**

> ⚠️ **`prefers-reduced-motion` is TWO-THIRDS proven — and this paragraph was the stale third.** It read *"still UNVERIFIED… six blocks exist… nothing has ever observed those rules taking effect"* until 2026-08-25 11:4x EDT, which stopped being true earlier the same day and in the same document: **§15.7b** measured 93 animating selectors, found **10 with no override** (including an infinite 2.8s pulse), covered them, and put **audit rule 14** on the relationship; `.states.html` **PASS 4f** then lifted every reduced-motion rule and observed `getAnimations()` reporting zero *running* animations on all eight pages. What is still unproven is only the **gating** — that the media query switches them on — because nothing here can emulate the feature (filed in `docs/db-deferred-list.md` with the CDP one-liner). **The lesson survives its own correction:** three claims — coverage, effect, gating — do not collapse into one green, and a warning left standing after the thing it warns about is fixed is the same defect it was written to prevent, pointing the other way.

## 16 LIVELINESS, MAGIC, AND THE FOUR SURFACES HARKIRAT OPENED — built 2026-08-25

*Everything in §5.9z was a decision. This is what was built from it, plus the four findings that only appeared once the pages were open. Read §5.9z first — it carries the reasoning; this carries the result and the places the reasoning turned out to be wrong.*

### 16.1 The eight micro-interactions, applied BY SELECTOR

**Liveliness is FEEL** (§5.9z.1). Eight items, all of them transforms, tints and opacity on markup that already exists — so no audit rule and no gate can be broken by them, which is also why the whole set was affordable at once.

| # | what it is | where it lives | the reason it is not decoration |
|---|---|---|---|
| **1** | **Press has weight** — every control compresses ~1px and springs back | `button,.pill,.chip,.btn,.mi:active` | The portal stages constantly and a staged op answers with a toast ~300ms later. In that window the button was dead, which is exactly when a person is still asking "did that land?" |
| **2** | **The change that just landed** — the row tints its own topic colour once | `.landed`, hooked into `Shell.arrive()` | The only acknowledgement was a toast at the bottom of the screen, 600px from the row you were looking at. "Which one did I just change?" was answered nowhere near the change |
| **3** | **Topic tint on touch** | `.pill[style*="--c"]:hover` and friends | A grey hover says *this is a control*. A topic hover says *this is a control FOR THAT* |
| **4** | **Cards lift — and the lifted card carries COLOUR** | `.wcard,.ccard,.tile,.dcard,.hlive .lp` | ⚠️ His note: *"cards lift needs some kind of colour even on the lifted card."* A coloured SHADOW would not have answered it — a shadow is still under the card. The colour goes on the PLANE: a topic tint in the surface plus a hairline top edge in the topic colour |
| **5** | **Figures roll and show the delta** | `Shell.setFigure()` | A figure that silently reads 40 instead of 39 tells you the new value and hides the event — and the event is the thing you were watching for |
| **6** | **The rail fills** | `.realm:hover`, `--c` from the new realm tokens | The rail previews where you are about to be |
| **7** | **Toasts settle** | `@keyframes toastIn/toastOut` | See §16.2 |
| **8** | **Selection moves** — a chosen row steps 3px out of the stack | `tbody tr:has(.cb.on)` | A checkbox answers "is this ticked" one row at a time. The eye wants the SHAPE of a selection down a 39-row table without reading any of it |

🔴 **THEY ARE APPLIED BY SELECTOR, NOT BY ADDING A CLASS AT EVERY CALL SITE.** Half of these elements are built inside template literals across six files. A `.tint`/`.lift` class hand-added to each is ~40 edits that a new surface then forgets — the same per-call-site failure that produced 29 corner radii and a `.zero` class with two meanings. Anything that already declares its own `--c` gets the topic hover for free, and the card shapes are enumerated once in `docs/superpowers/mockups/2026-08-23-portal-interactive/assets/app.css`.

**Four tokens, so "lifted" and "hovered" cannot drift into two hand-tuned alphas:** `--tint-hover` 9% · `--tint-lift` 14% · `--lift` 2px · `--press` 1px.

### 16.2 The toast, and why "smoother" is three changes and not one

⚠️ His note: *"toasts settle needs a MUCH smoother animation."*

The old one played `trayIn .22s` on arrival and **did not leave at all** — `el.remove()` deleted the node mid-frame. Half of every toast's life had no motion in it, and a thing that appears smoothly and vanishes instantly reads as broken rather than as fast. The instinct — reach for a springier curve — would have made it worse: a `cubic-bezier` overshoot on 220ms reads as a *snap*, which is the opposite of smooth.

Three changes, all of them in CSS:
1. **Longer travel** (460ms) on `cubic-bezier(.22,1,.36,1)`, which has no overshoot spike, so the eye tracks it rather than catching it.
2. **Opacity finishes EARLY** (at 35%), so the shape is solid while it is still moving. A toast that fades and travels together reads as a smear.
3. **A separate, FASTER exit** (260ms, `ease-in`) that drifts *down* rather than reversing the entrance.

Only `transform` and `opacity` animate, so it stays on the compositor and never repaints. `Shell._dismissToast()` exists to give the exit somewhere to happen. ⚠️ **`animationend` never fires under `prefers-reduced-motion`** (the global kill sets `animation:none`), so the timeout is the mechanism there and the listener is the optimisation — the other way round is how an animated dismissal becomes a permanently stuck element for the one group of users who asked for less motion.

### 16.3 The masthead figure grammar — and the rule in §5.9z.4 fails on its own example

§5.9z.4 sorted the numbers into three kinds and derived: *a SIZE takes its realm's topic colour · a STATE takes a state colour only when non-neutral · STAGED takes `--staged` when non-zero.*

🔴 **Applied literally to the row it was derived from, that grammar reproduces the defect it was written to prevent.** Armory's masthead holds **two** sizes — `MP BUILDS SHOWN 125` and `RANKED 64`. Colouring every size paints three of five figures, two of them the same red, and the topic colour becomes the row's most common ink. "If every figure is coloured, colour stops carrying information" — the section's own opening line, defeated by the section's own rule.

**The rule that ships:** the topic colour marks the **LEAD** figure, and it marks it **because it leads**, not because it is a size.

| | treatment |
|---|---|
| **LEAD** | `--t-display` (44px), in the realm's own accent. **Exactly one per masthead** |
| **REST** | `--t-h1` (22px), neutral ink. A supporting figure states its value, not its importance |
| **STATE** | a state colour only when non-neutral. `NEED REPAIR 11` is warn; `NEED REPAIR 0` is `.zero` and dims |
| **STAGED** | `--staged` when non-zero, plain secondary ink at zero, and **never `.zero`** |

This fuses the two halves of his ask — *"can they all have relevant colours, or improve their design in some way"* — into one decision: hierarchy and colour are the same move. It is also checkable, which the original was not.

**The leads, and the test each was chosen by** (*"if I only saw this number, would I know the state of this realm?"*): Season → **days left** · Armory → **builds** · Broadcast → **live** · Access → **granted** · Analytics → **interactions** · Review → **changes** · Home → **needs you**.

⚠️ **Review's lead is the staged cyan, and that is the rule rather than an exception:** the lead takes its realm's own accent, and Review's accent IS `--staged`, because the realm is the staging area. **A ZERO LEAD keeps its SIZE and drops its COLOUR** — size carries hierarchy, colour carries meaning, and "0 live now" in Broadcast yellow is an alert about nothing.

### 16.4 🔴 `.zero` meant two opposite things, and the fix is at the observer

Dimming a zero to mean *nothing here* is correct on `NEED REPAIR 0` and **exactly backwards on `STAGED 0`**, where a clean slate is the *good* state and dimming makes it read as absence rather than as *you are up to date*. One class, two contracts — the one-quantity-two-authorities shape, in CSS.

`Shell.zeroStats()` is where **both** were applied, so that is where it is fixed: `.zero` is never written to a `.stg` stat, which takes `.stg-clear` (plain secondary ink) instead. **The staged figure is the one number in the row whose appearance should change when it becomes actionable** — which is also why micro-interaction #5 lands on it first. `Shell.markZero(el, n, isStaged)` is the single writer.

### 16.5 The attention rows — the answer was not "remove the underline"

⚠️ **The comfortable reading of "those underlined buttons look bad" is "remove the underline", and it hid the real question.** Three affordances were stacked on one control: a **border** said BUTTON, an **underline** said LINK, an **arrow** said NAVIGATION. Deleting the `text-decoration` fixes a third of it.

🔴 **The row is the target.** Each row already names one destination and one thing wrong with it, so the whole row is now a real `<a>`. The arrow is the only affordance left, the right column stops being a wall of five near-identical controls, and the reclaimed width says **how bad** — `13 of 133` — because a count with no comparison is homework, not a glance.

⚠️ **The cost, paid rather than avoided:** a whole-row target is worse for keyboard and screen-reader users if it is a click handler on a `div`. It is a real anchor; the rank number and the severity bar are decorative and `aria-hidden`, so the accessible name is the finding plus its destination ("13 builds need repair, Armory · Repairs") — better than the old link's name ("Armory repairs") standing alone.

🔴 **And the first version of it painted a GREEN bar next to "23 errors pinged".** The row's `--c` is the realm accent (Analytics is `--ev`), and the severity bar was switched to `var(--c)` in the same edit. Two colours, two jobs, and §4.1's split is what keeps them apart: **the hover tint is the TOPIC** (where this goes), **the bar is the STATE** (how bad it is). Making one carry both is how a colour stops meaning anything.

### 16.6 Home — the cards were a second authority, and the rail was the missing half

His words: *"its all over the place… i feel like i'd never utilize it."* The five ranked reasons are in §5.9z.5. What was built:

🔴 **HOME NOW CARRIES THE RAIL AND THE FIVE CARDS ARE GONE.** `index.html` overrode the grid to one column under a comment that read: *"the rail is the in-realm switcher, and repeating it on the page whose entire job IS choosing a realm would say the same thing twice."* **The reasoning is sound and its PREMISE is what was wrong** — the page's own H1 is "What needs you", not "Choose a realm". The cards existed because Home was believed to be a directory, and they were a second authority over the question the attention list already answers: the list ranks what needs you, then the cards listed every realm again, undifferentiated, so Armory was card #2 whether it had 13 broken builds or none.

With the rail present, navigation is one mechanism in one place on all eight pages. The way back to Home is the `DIOREO/PORTAL` mark, which was already a Home button in every header.

⚠️ **THE FIGURES DELIBERATELY DO NOT REPEAT THE RAIL.** §5.9z.5's plan said *"demote the cards to a compact navigation rail with one figure and a state dot"* — **a figure there would have rebuilt the cards-versus-list defect one level up.** The masthead answers WHAT IS THE STATE (`needs you · days left · live now · staged`); the rail answers WHERE DO I GO and carries no counts at all.

**What is live right now** is the new panel and the portal's actual subject — five cards said how many rows each realm holds and not one said what a player would see this second. It is not a second authority over the attention list: **that list is EXCEPTIONS, this is the CURRENT STATE.**

**The staged bar renders only when something is staged.** At zero the masthead's `STAGED 0` carries it. A permanent bar reading "Nothing staged" was a third copy of a fact stated above it.

**The three-line lede is gone** — the §F2 defect, fixed on four other pages and left on this one, costing ~180px above the fold on the page opened first.

### 16.7 🔴 One quantity, two authorities — and this time the second one was mine

Season's masthead read **79 days left** while its own *Live season* strip three lines below read **"battle pass Sep 10 · 17 days left"**, and Home's new figure row made it a third reading.

The cause: `seasonEnd()` in `docs/superpowers/mockups/2026-08-23-portal-interactive/season.html` takes the **LAST** of the three deadlines — which is **correct** for the conflict predicate it was written for (*"an item running past BP but inside Ranked is not a conflict"*) and **wrong** for "how long is left", because what a player calls the season ends at the **first** deadline. Two different questions wearing one function.

`Shell.seasonDaysLeft(season, today)` is now the single derivation both surfaces read. It takes the first deadline, and it **names which one**, because an unlabelled "17" beside a strip listing three different dates is the ambiguity that let them drift. The conflict predicate keeps the last deadline and now says why in its own comment.

### 16.8 The account panel — start from what the panel is FOR

His words: *"theres so much redundancy and uselessness. Why are the signout buttons 2 different styles? why is the discord id cut off? what's even the point of 'Find a page or an action / Command palette'?"* The full brainstorm is §5.9z.6. What shipped:

- 🔴 **The panel duplicated the button that opens it.** Its header was an avatar, a name and a handle — and the trigger you just clicked IS the avatar and the name. That was the top third of the panel, and a bigger redundancy than the two ⌘K rows that were the visible complaint. The identity block now sits **on** the banner, which dissolves the duplicated avatar and earns the banner its ~74px: it is the one personal thing in the portal, and a Discord bot's console looking like Discord's own account panel is an affinity that is **true here** rather than borrowed.
- 🔮 **"What you can do" is the one thing only this panel could say, and it did not.** Twelve permissions, an owner-only tier, and a `destructive` capability only the owner may grant — and nowhere in the portal told you which you hold. A delegated admin found out by clicking something and being refused. It is a row that **does** something (it opens Access on your own row), which is also the fix for the panel being five-sixths label.
- 🔴 **The header's allocation was backwards.** Who signs out of a single-user admin console kept open in a tab? Almost nobody — so the header spent permanent, always-visible space on one of the rarest acts in the product and none on the most frequent, committing staged work. Sign-out moved into the panel, alone, in one style. ⚠️ **The fair counter** — a sign-out you cannot see is one a delegated admin cannot find in a hurry — is answered by making the panel obviously the account panel, not by a second button in a different colour, which is exactly what taught that they were two different acts.
- **The freed slot carries a commit chip that is ABSENT at zero.** A chip that is always there is a permanent third copy of the tray and the rail badge; one that appears only when there is something to act on is the same fact at the moment it becomes actionable.
- **The ID is shown WHOLE.** `1139…2283` elided **the middle**, which is the only part that distinguishes it from any other snowflake — so the preview could not confirm it was the right id, which is the entire reason anyone looks before pasting it into a grant.
- **`Session · 12 hours` stated the POLICY.** It now reads `expires in 7h 20m` and ticks on the minute. One is documentation about the system; the other is a fact about you, and that difference is what separates five label rows from a panel worth opening.
- **The presence dot is gone** — "Signed in" is trivially true of anyone looking at it, so it was decoration wearing status.

⚠️ **AND THE PANEL SHIPPED A DEAD, EMPTY, FOCUSABLE ROW.** The earlier removal of the duplicate ⌘K rows deleted a label and left its `<button class="mi" data-m="realm">` **unclosed**, holding only a hamburger glyph. The browser auto-closed it at the next `<button>`, so the panel rendered an icon-only row that fell through to "focus the command bar". Visible in one second, invisible to every check — and it was created by the fix for a sibling defect, which is failure mode #5 for the third time on this branch.

### 16.9 🔴 THE LIGHT MODEL — FALSIFIED AND DROPPED, with numbers

The proposal was *"one elevation scale + a hairline top edge"*. The instruction was to falsify it before spending a session: rasterise a panel edge, read the pixel delta, and if it is under ~2 RGB steps say so and drop it rather than shipping decoration.

**Measured 2026-08-25 15:2x EDT on `analytics.html` at 1280×806, dpr 2:**

| what | measured |
|---|---|
| distinct opaque backgrounds painted on the page | **5**, and all five are exactly the five declared surface tokens — **zero drift** |
| adjacent-surface deltas actually painted (max channel) | **6 · 10 · 12 · 18 · 28 · 34** RGB steps |
| the panel's top edge, rasterised | ground `(15,20,24)` → border `(58,71,82)` → surface `(31,39,46)` |
| ground → border | **58 steps** |
| ground → surface | **22 steps** |

**Verdict: DROP.** The elevation scale already exists, is exactly five steps, and every painted surface uses one of them — there is nothing for "one elevation scale" to unify. Every adjacent delta is at least **3× the 2-step floor**. And the hairline already exists: the panel's top border is **58 steps** brighter than the ground it sits on. The light model would have been a second authority over a quantity that already has one — the branch's own theme, in a proposal about lighting.

⚠️ **THE PROBE WAS GIVEN BOTH DIRECTIONS BEFORE ITS ANSWER WAS TRUSTED.** The same measurement returned **0** on a sample where nothing changes and **58** at the border, so it can report presence and absence. A falsifier that can only say one of those proves nothing.

**One piece survives, and for the opposite reason:** the hairline top edge is now the **hover** treatment on a lifted card (§16.1 #4). As a permanent global treatment it measured redundant; as a hover-only cue it is the thing that says WHICH card is lifted, which nothing else in the frame says.

### 16.10 MAGIC — one parser, four capabilities

**Magic is CAPABILITY** (§5.9z.1) — *"the portal can do that?"* / *"that made it so easy"*. Three of the four are the same engine pointed at three surfaces, which is what made four affordable at once.

`Shell.Parse` — `date()` · `range()` · `line()` · `rows()` · `KIND`.

🔴 **THIS IS A MOCKUP OF THE SURFACE, NOT OF THE PARSING.** The bot already ships `utils/adminParser.js` for the line formats and already depends on `chrono-node` for the dates — `/manage` parses admin dates with it today. The portal is the surface that does not use either. What is in `docs/superpowers/mockups/2026-08-23-portal-interactive/assets/shell.js` is a deliberately small subset with the same SHAPE, so a wiring session replaces the body and keeps every call site. ⚠️ **Do not "improve" this grammar** — the real one inherits everything the bot already understands, and a richer mockup grammar teaches a wiring session to keep it.

| # | capability | where it lives | his note, and what it forced |
|---|---|---|---|
| **2** | **Paste anything. Get rows.** | a field **inside the composer**, `Shell.pasteRows()` | ⚠️ *"needs to be more intuitive."* The intuitive version is not a better drawer — it is **not being a drawer**. Three steps before you could paste, and the feature's whole claim is that there are no steps. It now parses as you type, beside the form it replaces, so the demonstration and the control are the same object |
| **3** | **Type the date like a person** | `Shell.dateField()`, on both composer date inputs | The bot has understood "in 3 weeks" for a year; the portal made you use a date picker. That is not a smaller feature, it is the same feature with the understanding removed. The typed TEXT and the resolved ISO are kept apart (`st.a` vs `st.aText`), and the resolved date is **echoed in words** before anything is stored |
| **4** | **Fix everything a machine is sure about** | `fixMechanical()` in `docs/superpowers/mockups/2026-08-23-portal-interactive/armory.html` | 🔴 *"it needs some sort of companion element which actually visualizes the proposed change, rather than it being blind trust and execute."* **That note is the feature** — see §16.11 |
| **5** | **⌘K that acts, not just navigates** | `Shell.registerCommandStage()` | The bar existed and only navigated: it could find a page and could not do anything on one. It runs the same parser, so one typed line stages a draw window without opening a drawer. **Offered, never auto-run** — the top row is a suggestion you press Enter on, and it says what it will stage |

**Not built, and it is still the best of the four:** *diff against live* — one button answering "what is different between this portal and what players are seeing right now?". It needs the real bot on the other end.

### 16.11 Fix-all is a DECISION, not a receipt

The panel already showed a Build/Was/Becomes table. That is a receipt. Three changes make it the decision:

1. **Every fix shows its own before → after in the field's own words.** A diff that says `imageKey` is about a schema; one that says **Image reference** is about the build. `FIELD_WORDS` does that mapping.
2. **Every fix has a checkbox.** All-or-nothing on six fixes means one doubtful fix costs the other five — and that is what makes people not press the button at all. "Fix all" is now a *starting selection*.
3. **The count on the button tracks the selection**, so what you are about to stage is stated in the control that stages it.

⚠️ **The line it does not cross, unchanged:** it STAGES, it never commits, and it never touches the Judgement column.

### 16.12 🔴 THE PARSER'S FIRST VERSION WAS WRONG ON HALF THE REFERENCE LINES, AND TWO OF THE FAILURES LOOKED LIKE SUCCESSES

The first `line()` split each line on `|`, `,`, `—` and rejoined the pieces with spaces. Measured against the six known reference lines **before it was pointed at anything unknown**:

| line | first version |
|---|---|
| `Undead Legion Series Armory \| Sep 8 - Sep 22` | name kept `"\| Sep 8"`, start **Sep 22**, no end — the split cut the range in half at the pipe and the rejoin destroyed the hyphen |
| `Ranked Series 12 ends Sep 10` | **no date at all** |
| `Zombies: Undead Siege returns Sep 20 through Oct 4` | name **empty** |

Two of those three carry a plausible single date and would have read as successes in a table. The rewrite **matches a date expression instead of splitting**, and the expression is built from the month NAMES rather than `[a-z]{3,9}` — the loose version matched `"Series 12"` in `"Ranked Series 12 ends Sep 10"` and dated the row to nothing. **A parser that finds a date in a serial number is worse than one that finds none, because the wrong answer is the one you act on.**

**Falsifiers it must answer NO to, and does:** an empty line · a line with no date · `"Ranked Series 12"` alone · `"purple monkey dishwasher"` · a reversed range (`Sep 22 - Sep 8`). All five return `null`.

🔴 **AND THE FALLBACK WAS AN ARRAY INDEX.** `KIND[3]` meant "a new draw" until a `ranked` entry was inserted above it, at which point every unrecognised line silently became a **draw window** — no error, plausible output, wrong answer. It looks up by key now. An index into a list that is expected to grow is a reference nothing checks.

### 16.13 The chart aesthetic — and the canvas glyph that was built and deleted

He rejected the season-shape glyph as INFORMATION (*"so useless and tells me nothing"*) and kept its LOOK: *"i like the chart design and want it's aesthetic implemented to some areas of the Analytics realm, based on your decision of wherever it would look nice."*

⚠️ **My first call was a canvas density glyph on the ack distribution, and it was wrong.** It was built, rendered, and deleted after looking at it: **the reference reads as a shape because it is twenty-eight narrow bars**, and seven buckets drawn the same way is one green block beside six invisible slivers. Same code, nothing like the picture. The aesthetic is portable; the cardinality is not, and only opening the page said so.

**Where it landed instead — all five bar groups in Analytics, not one canvas:**
- the fill **fades along the bar** instead of ending flat, so length reads as a quantity rather than as a block;
- a hairline sits under each track, which is what makes a row read as an axis;
- 🔴 **an empty slot is DRAWN** — a warn sliver at the baseline. That is the one idea in the reference worth more than its look: **the gap is the information.** *"5 of 7 buckets are empty, including the one past the deadline"* is the reading of the ack panel, and an em-dash in a table cell was not saying it.

🔮 **Offered and NOT built, because it is a new derivation rather than a restyle:** the collapsed Playlists strip is 14 bare ticks and a stated "7 at peak". Computing per-day concurrency and drawing it with this treatment would make the peak visible instead of asserted. It needs its own yes.

### 16.14 🔴 THE TRACK'S DEADLINE MARKERS — the line was drawing the wrong boundary

His words: *"why do they even have a line going down into the track? How is that helpful to anyone?"*

**The comfortable defence is the textbook one** — a vertical rule lets you see which bars cross the deadline — and it is the one to attack hardest. It fails three ways here:

1. **The page already answers it.** `FLAGS` in the masthead, the Repairs view and the Manifest's WINDOW column all state which items run past the season. A visual affordance whose output is a worse copy of a computed answer is a ritual, not information.
2. 🔴 **It drew the WRONG boundary.** `seasonEnd()` deliberately takes the **last** of the three deadlines. The line was drawn at the **first**. So the full-height rule invited you to eyeball a boundary the page's own conflict rule does not use.
3. 🔴 **Measured 2026-08-25 16:1x EDT: `.dend` returned TWO elements at the SAME x (1016)** — `rgb(242,153,74)` and `rgb(255,52,48)`, both at `opacity:.5` — so one date rendered as two overlapping half-transparent lines whose visible colour is whichever painted last, plus a **third** rendering, the chip's amber stem. §5.9c.6 fixed "two chips for one date" by grouping and **left the LINE ungrouped: the identical modelling error survived one layer down and was on screen for days.**

**What replaces it:**

| element | rule |
|---|---|
| `.dnotch` | **ONE notch per DATE**, at the top of the plot, with one stop per deadline sharing that date. A deadline marks its own coordinate on the axis it belongs to and does not cross content it makes no claim about |
| `.oos` | 🔴 **THE BOUNDARY IS A REGION, NOT AN EDGE.** Past `seasonEnd()` the plot is OUT OF SEASON and now looks it — hatched, not flat-grey, because a plain wash reads as *disabled* and this area is not switched off. ⚠️ It renders from the **LAST** deadline, so it agrees with the flag count on the same screen |
| `.dpin` | On today's data the boundary is Nov 11, 51 days beyond the view, so **`.oos` does not render at all** — and that is the point. The picture stops asserting a boundary that is not there, and the pin ("DMZ NOV 11 · 51d beyond this view") is promoted from a footnote to the boundary's stand-in |
| `markFlagged()` | Every finding marks the BAR it is about. Two large cards under the plot named two bars and pointed at neither — affordance-distance at reading distance instead of scroll distance. 🔴 **The count is reported, not assumed**: a flag whose bar cannot be found warns in the console, because a selector that matches nothing fails silently forever and this file has already paid for that twice |
| `.ruler span.masked` | ⚠️ **The mask used to hide the whole tick.** Measured: `Aug 25` was in the DOM and invisible on screen, so the ruler ran Aug 18 → [gap] → Sep 1 under the NOW pill. **A ruler's regularity IS its legibility.** The LABEL is the redundant half (NOW's own chip already states that date); the tick mark is the axis. Only the text is hidden — and via `display:none` on a child element, because `color:transparent` failed the contrast rule at 1.25:1 and was right to: **invisible text is still text.** |

⬇️ **DROPPED AFTER MEASURING:** *"bars run off the right edge with no indication they continue."* `clipped: []` — no bar touches either plot edge, at this zoom, on this data. I was one edit from shipping a fix for a defect that does not reproduce.

### 16.15 The backtick trap, occurrences seven through nine

**A backtick inside an HTML comment inside a template literal ends the literal and kills the page.** It fired three more times today — twice inside the comment documenting the account-panel redesign, and once inside the comment explaining why the deadline line was removed. `portal:refs` lints for it and cannot catch an edit that has not been run yet.

**The sweep that ends it:** every HTML comment in `docs/superpowers/mockups/2026-08-23-portal-interactive/season.html` was passed through a regex that replaces backticks with quotes inside `<!-- … -->` only. Do the same before committing any comment written inside a template literal.

### 16.16 🔴 A HELPER PRINTED A TICK FOR EVERY EDIT WHILE GROWING THE FILE TO 11.9MB

A one-off script removed seven dead CSS rules by finding each selector and scanning for its closing brace with `while s.count('}', i, j) < s.count('{', i, j)`. **Python's slice excludes `j`**, so the condition was always one short and the scan ran off the end of the file. `find` returned `-1`, `end` became `0`, and the write was `s[:i] + s[0:]` — **prepending a copy of the entire file.** Seven times, doubling each pass: 128 copies, **11,876,600 characters**, and a tick printed for every one.

**Recovered losslessly** because each pass only ever *prepended*, so the final string still ended with the original in full: `dmg[dmg.rfind(head[:120]):]` returned exactly the pre-edit content plus this session's three appends, verified by `git diff --stat` reading `359 insertions(+), 0 deletions`.

**The rewrite scans real brace DEPTH and asserts a bound** (`end - i < 600`), so a runaway is a loud failure instead of a silent duplication. ⚠️ **The only reason this was caught is that the script printed its byte delta** and the number was negative. A helper that reports "✓ removed 7 rules" and nothing else would have committed 11.9MB.

⚠️ **And a second lesson inside it:** `wc -c` reports BYTES and Python `len()` counts CHARACTERS. This file is full of `═`, `🔴` and `—`, so the two differ by ~4%. The recovery briefly looked wrong because a 285,115-character result was compared against a 285,207-byte measurement.

### 16.17 🔴 THE SERIF WAS A MAGAZINE VOICE IN AN INSTRUMENT — the type system, restated as a rule

Instrument Serif carried every realm page title from 2026-08-25 13:1x until 17:4x the same day. Harkirat: *"i was under the impression this font was just for the season titles and similar stuff… it's an accessory/accent font only, not the main typeface."*

**He is right, and the reason is worth keeping:** a high-contrast display serif is a **magazine** voice, and this portal is an **instrument** — a mono data grid, condensed gauge figures, a time axis, a permission matrix. The serif was a headline pretending to be a console, which is exactly why it read as borrowed rather than chosen.

🔴 **THE RULE, AND IT IS SAYABLE IN ONE LINE:**

> **The serif names things the BOT HOLDS. The condensed face names things the PORTAL IS.**

A season is a thing with a name someone chose (`BP Season 7: Terminated`). "Access" is a page. The serif gets the first and never the second, so its presence now *means* something instead of being decoration.

| role | face | where |
|---|---|---|
| **Realm titles** | Big Shoulders Display 700, **uppercase**, `--t-figure`, +.055em | `.masthead h1` · `.hmast h1` |
| **Masthead figures** | Big Shoulders Display 700, `--t-display`, in the realm accent | `.mh-stats .v` |
| **Content names** | Instrument Serif 400 | season names, Season Record rows — never chrome |
| **Everything else** | Space Grotesk · JetBrains Mono | prose · data, labels, eyebrows |

⚠️ **The title sits one step BELOW the lead figure on purpose.** The figure is the realm's defining number and is bigger *and* coloured; the title labels it. That is §16.3's masthead grammar applied to type instead of to colour, and it is why two 44px condensed elements do not compete.

✅ **This REMOVES a family from the chrome rather than adding one** — chrome now has one display voice in two registers. Chanel's rule, applied to a typeface.

⚠️ **AND A PROBE LIED AGAIN, IN THE OTHER DIRECTION.** `document.fonts.check('16px "Big Shoulders Display"')` returned **NO**, which read exactly like the figures silently falling back to Space Grotesk — a bug I was one message from reporting. It is a **false negative**: only weights 600/700 are requested, so a 400-weight query at 16px is legitimately absent. Measured properly against a fallback control at the real weight and size: **459.43px vs 679.72px**, so it is loading. §5.9v.4 recorded this same API returning **true** for a font that does not exist. **It is unreliable in BOTH directions; the width comparison is the only probe that has ever been right.**

### 16.18 Access had no colour identity, and it was the one realm whose lead figure could not lead

Every realm accent is a hue except Access, which was `--ink2` — a grey. Consequence, visible on screen: the warn-orange `7 SINGLE POINTS` was **louder than the `3 GRANTED`** that defines the page, and the rail item filled with grey on hover while every other realm filled with its own colour. **Grey is the absence of a topic colour, not a choice.**

`--r-access` is now `--info` #409AD0 — already a declared signal, already AA-corrected, unused by any realm, and the right register for identity and locks. Six realms, six distinct hues.

### 16.19 🔴 A STATE MARK PAINTED IN COLOUR, ON TOP OF A TOPIC COLOUR — and it won

Harkirat, on the Access matrix's column headers: *"the orange ring is just bad. it hides and swallows the color it's surrounding."*

**Measured:** a 22×7px pill with a 2px ring loses roughly **half its visible area** to the ring, so `manage` grey and `bot` green both read as *orange objects with a coloured filling*. That inverts §4.1 — **colour carries topic, shape carries state** — and it is the same defect class as a zero painted in an alert colour: a mark that overrides the thing it is meant to annotate.

**The fix is the same correction the Track's deadline notch got the same day:** a mark may point at content it does not cross. The state moved **beside** the swatch — a warn rule directly beneath it (`box-shadow:0 3px 0 -1px`) — and the holder count turned warn too, so the fact has **two carriers and neither is destructive**.

### 16.20 🔴 THE MOST LOADED MARK ON THE PAGE WAS EXPLAINED 600px BELOW ITSELF

Harkirat asked what the orange rings meant **two sessions ago**, and asked again on 2026-08-25. The answer was on the page the whole time — `ringed — a single point of failure: one person besides the owner holds it` — in a legend at the **foot of the panel**, while the key for the *other* two marks (direct, inherited) sat **60px above the matrix**.

⚠️ **An earlier pass noticed the ring was unexplained and "fixed" it by adding a line to the far legend.** That treated absence when the defect was **distance** — the same failure as the selection bar 1,682px below the fold. A comment in the source even says *"a reader had no way to learn that"*, directly above the fix that did not work.

The key now sits with the other two marks, and its swatch **is** the mark rather than a description of it. ⚠️ **And the wording had to change with it** — the key still read "ringed" for three minutes after the ring was removed. A legend naming a mark the page no longer draws is worse than no legend: it sends a reader hunting for something that is not there.

### 16.21 A real countdown — and the constraint I misread to avoid building one

`DAYS LEFT 17` was a frozen integer while the account panel counts a session down to the minute and NOW carries a live clock — **three approaches to time in one product**.

🔴 **The reason it was frozen was a misreading of Harkirat's own constraint.** §5.9z.2 killed **ambient** time — draining windows, a creeping NOW — because *"a quantity that moves slower than a session cannot be shown as MOTION."* **That is an argument about animation. It says nothing about PRECISION**, and filing a countdown under it was my error.

`Shell.countdown(iso)` + `Shell.tick(fn)`: one shared 60s timer so a page cannot end up with two clocks disagreeing, and a page with nothing to count starts no interval at all. **The unit follows what the record HOLDS** — `bpEnd` is a *date*, so hours are invented precision for most of a season; it switches at **3 days**, the only point where an hour changes a decision.

⚠️ **And the label was the actual visual fault, not the font sizes.** Harkirat: *"whats with the some large, some small numbers in this area?"* Measured: the lead's label `days left · battle pass` was **145px against a 26px value**, so its cell ran **three times wider** than every other stat and the figure floated at the far right of its own box. The unit moved onto the value (`17d`) and the label carries only which deadline it is. ⚠️ My first fix for that was `max-width:11ch` on every stat label — which **clipped 2 of the 4 labels on Access** ("permissions" 69px into 59, "single points" 82px into 59) and with `overflow:visible` overlapped their neighbours instead of cutting. **A width cap on a label that is already too long is a worse failure than the long label.** Removed; short labels are the fix.

### 16.22 The playlist load ribbon — the peak was asserted, not shown

⚠️ **CORRECTION TO WHAT WAS PUT TO HARKIRAT.** This was presented to him as *"a new derivation, not a restyle"* and that is why it was raised as a separate decision. **It is not.** `loadCurve()` has computed per-day concurrency since the lane kit was written and already drove the bars. He decided on a wrong cost basis, and it was cheaper than stated.

Two faults, both about the same thing — the ribbon painted a curve and let a **label** carry the reading:
- **Linear heights.** On a curve whose peak is 7 and whose typical value is 1–2, six bars of seven rendered as a 14% stub and only the text `7 at peak` said otherwise. Gamma-compressed at **0.6**, the shape carries it and the label confirms.
- 🔴 **`opacity:0` erased every empty day.** A gap in the rotation — the one thing a person scanning this lane would act on — was indistinguishable from the lane ending. An empty day is now a warn tick on the baseline: the same idea the ack panel uses, and the half of the density glyph worth keeping.


### 16.23 🔴 A PARAMETER THAT WAS DECLARED, PASSED, AND NEVER READ

`Shell.countdown(iso, today)` computed `end - Date.now()`. `today` was in the signature, named for exactly what it was for, and dead.

**How it surfaced:** the Board view was opened — one of the four sub-views nobody had ever looked at — and the masthead read **`16d BATTLE PASS`** about 120px above a strip reading **`battle pass · Sep 10 · 17 days left`**. Same quantity, same fold, two numbers. `seasonDaysLeft()` was correct; `countdown()` was counting from the real wall clock (2026-08-25) while the rest of the page counted from `F.today` (2026-08-24).

🔴 **The call site looked right, and that is the whole lesson.** `season.html` calls `S.countdown(dl.iso, F.today)`. Reading the call tells you nothing is wrong. Only reading the callee does, and nothing routes you there.

🔴 **The worse half is not the off-by-one.** `?today=YYYY-MM-DD` is this package's mechanism for rendering states the fixtures never produce — it is how the out-of-season region was verified and how the DMZ contrast failure was found. This element **ignored it**. Every `?today=` sweep that has ever run passed over this figure without being able to touch it. **A check cannot fail on an element it cannot reach**, which is the same shape as §5.9y.4's gate that could not fail, arriving from the opposite direction: there the check was vacuous, here the *subject* was unreachable.

Fixed by reading `today` when given and falling back to `Date.now()` only when it is not. Verified at three dates: `?today=2026-08-24` → `17d`, agreeing with the strip; `?today=2026-09-09` → `47h`, hot; `?today=2026-09-10` → `23h`.

### 16.24 "1 days left" — the fourth occurrence, directly below the pluraliser written for it

`season.html`'s `fmtLeft` returned `` `<b>${d}</b> days left` ``. Fourteen lines above it sits `const plural = (n, word) => ...` under the comment *"One pluraliser, because '1 days' turned up in three different templates independently."*

Found by driving `?today=2026-09-09` after fixing §16.23 — the fix for one defect is what made the next one visible, because until the countdown honoured `?today=` there was no way to render the `d === 1` state at all.

A sweep for the same shape across the package found **nine more**: the span-length tooltip, the past-season-end repair text, the draw-gap repair text, three `broadcast.html` strings (posted-ago, the no-expiry warning, the expiry parse echo), Home's masthead figure label, Home's attention row, and one in `fixtures.js`.

**And zero is not "0 days left."** That is a number where a word belongs; the sentence is **"ends today"**.

⚠️ **Two pluralisers, same name, opposite contracts.** `S.plural(n, unit)` returns the **unit** — the caller supplies the number, and a written-plural unit loses its `s` at one. `season.html`'s local `plural(n, word)` returns the **whole phrase**, number included. Both are used correctly at every site, so nothing is broken; the collision is recorded here because the next person to reach for "the pluraliser" has a 50% chance of picking the one that does not fit their template.

### 16.25 Four KINDS of deadline element — and the season has two walls, not three deadlines

The season-deadline problem has been raised **nine times**. §16.14 records why the first eight failed: every one was an **annotation on something else**. The ninth replacement — a row of three equal cards — was rejected as *"boring"*, and the honest diagnosis is that three data points were allowed to choose a three-column layout. **That is arithmetic, not design**, and the row asserts something false: that the three deadlines are peers. There is a next wall, and then there is later.

**The artifact** (`local/design/season-deadline-options.html`, published) presents four options that differ in *what they claim a deadline IS*, which is the only axis on which "different in kind" means anything:

| | Kind | The claim | Where it is wrong |
|---|---|---|---|
| **A** | The Horizon | a deadline is a **duration** — depleting measures, length ∝ days remaining | at true scale **the least urgent thing draws the longest bar**; and two 17-day bars cannot express that they are the same day |
| **B** | The Moments | a deadline is a **moment**, and moments merge | degrades to an ordered list of three when no dates coincide; TBD has no date to merge on |
| **C** | The Board | a deadline is a **position in a queue** — rank words, not size | quiet, and restraint is the method that has already failed nine times here |
| **D** | The Sentence | a deadline is a **consequence**, and a consequence is a sentence | must stay true in every state; and it is read once, not scanned repeatedly |

🔴 **The finding that came out of building it.** `bpEnd` and `rankEnd` are **both `2026-09-10`**. This season does not have three deadlines — it has **two walls**, one of which two lines hit together. The Track's `.dnotch` layer already knows this (*"two deadlines on one date share the notch"*, §16.14) while the identity strip 200px above it still counts three. **The page states both at once, right now.**

That is also where the memorable idea is: every generic admin tool renders three rows because the schema has three fields. Rendering two is the design doing something the data model did not do for it.

**Also verified while building it:** the page has no start date of any kind, so any "progress through the cycle" reading is dead on arrival — an option was designed and cut for exactly this. And whatever wins must **replace**: the "Live season" strip goes, the masthead `days left` figure goes, the Track chips shrink to dot + date. Four weak sayings into one. That is the test the previous nine failed.
