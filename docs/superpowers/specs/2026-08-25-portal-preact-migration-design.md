---
kind: spec
status: frozen
---

# The portal's design moves onto the portal — mockup → Preact + htm

*Decided 2026-08-25 22:5x EDT by Harkirat. Frozen at its date; superseded by a later dated spec, never edited.*

## The question

Two implementations of the same six realms had been in flight at once: the interactive mockup package at `docs/superpowers/mockups/2026-08-23-portal-interactive/` (vanilla template-literal rendering, eight static HTML pages) and `portal/ui/` (Preact + htm ESM, no bundler, served by `portal/server.js`), with a 415KB `COMPANION.md` whose entire job was translating one into the other. Every design decision was built twice and specified a third time.

Harkirat framed the resolution as a question rather than accepting either of the two options on the table: *"why not bring the current backend that was developed into **this** design? and migrate this design from vanilla.js to Preact + htm? … that's the most seamless transition to wire in the actual capability/function of what the portal is supposed to do + keep our completely new ui/design."*

## Why that is the right direction, measured rather than argued

The two sides are not converging implementations of one design. They are two vocabularies.

| | Mockup | `portal/ui/` |
|---|---|---|
| CSS classes defined | **890** | 176 |
| Classes the markup emits | 652 | 163 |
| CSS bytes | 344,974 | 56,924 |
| Rendering | template literals → `innerHTML` | Preact + htm ESM |
| **Shared vocabulary** | **62 classes — 10% of the mockup's, 38% of portal/ui's** | |
| Mockup CSS classes nothing in `portal/ui` emits | **808** | |

Converging onto `portal/ui` — the recommendation carried into this session from the previous handoff's §8 — would mean re-authoring roughly 808 classes' worth of composed design. Migrating the other way discards `portal/ui`'s 163-class component markup, which is the *less* composed half, and keeps every design decision intact.

**The CSS does not care which paradigm produced the markup.** That single fact is what makes the direction cheap on the expensive half.

### Two claims in the previous handoff's §8 were wrong, and are corrected here

1. §8 called the mockup's harness *"its only real advantage and it is portable"*. Half right. The **instruments** (`.peers.js`, `.grid.js`) are fully portable — they read `getBoundingClientRect` and do not care who rendered the DOM; both were run unchanged against Preact-rendered output in this spike and worked, needing only a `<main>` wrapper because both resolve their coordinate space from `document.querySelector('main')`, which the portal shell already provides. The **audit pages** are not portable — they iframe static files.
2. §8 said designing in `portal/ui` *"means running a server with auth and Mongo instead of opening a file"*, and that was the single biggest entry in its own cost column. **It is false.** `portal/ui` is deliberately no-bundler ESM served verbatim, its components are pure (state in, tree out), `fetchJson` is one seam, and `.claude/launch.json` already carries a no-cache static server on `:8900` rooted at the repo. A fixture harness page is hours.

## The spike

One component — the Track — migrated end to end, at `local/spike-track/` (gitignored). Chosen because it is mature on **both** sides, so the migrated result could be checked against a working reference rather than against my own reasoning, and because it exercises every hard case at once: derived state, persisted UI state, pointer drag, delegated events, and a post-layout measuring pass.

**Scope:** ruler, lanes, bars, points, lane collapse, collapsed-lane summaries (pips / runs / load ribbon), end-date drag, `fitLabels`. Deliberately out: scrubber, crosshair, deadline rail, flags strip, the record, day-opener, composer — more of the same three shapes.

### What was reused with zero changes

| | |
|---|---|
| `assets/tokens.css` + `assets/app.css` | The entire 890-class design vocabulary, unmodified |
| `assets/fixtures.js` | Loads in the browser **and in Node** — `FIX.seasonItems()` returns 39 items in exactly the shape the Track consumes |
| `assets/timeline.js` (`window.TL`) | The whole date↔pixel engine — `make/pct/wpct/dateAt/ticks/days/addDays` |
| `assets/icons.js` | The Lucide sprite and the morphing fold |
| `portal/ui/track.logic.js` | The portal's own pure functions, loaded as a classic script — `editOpFor` built the real staged op from a dragged bar |
| `.peers.js` / `.grid.js` | Ran unchanged against Preact-rendered DOM |

### Measured cost

| | Lines | Code lines |
|---|---|---|
| Mockup source re-hosted (`renderTrack`, `tickStep`+`renderRuler`, `mergeRuns`+`loadCurve`, `fitLabels`) | 278 | 187 |
| …plus `wireTrack`, the imperative wiring layer the components absorb | 99 | 77 |
| **Mockup total** | **377** | **264** |
| **Spike (`Track.js`)** | 386 | **284** |

**≈1.08× code lines — parity.** The component layer grows; the imperative wiring layer shrinks to nothing. The markup itself transfers almost literally, because htm *is* tagged template literals: `` `<div class="bar">` `` becomes `` html`<div class="bar">` ``.

### The three findings that actually cost time

**1. 🔴 A post-layout measuring pass that mutates class names OSCILLATES under declarative rendering.** `fitLabels` measures a bar and adds `lbl-out` / `lbl-cut` / `nolabel`. Ported naively into `useLayoutEffect` with a compare-before-set guard, it locked the browser hard enough to **time out a 300-second call**: `lbl-cut` truncates the label, which changes `bl.clientWidth`, which flips `clipped`, which picks a different branch — a two-cycle that an old-vs-new comparison cannot break. **The fix is a generation key**: measure once per real input change (window, items, collapse state), never in response to your own `setState`, and strip the fit classes before measuring so every pass reads the same unconstrained geometry. **Every measuring pass in the mockup has this shape** — `fitLabels`, `clusterPoints`, `fitFlags`, `pinFarDeadlines`, `pinClippedLabels`, `stackFlags`, `repositionBars` — so this is the migration's one genuinely non-mechanical class of work, and it is now solved once.

**2. ✅ `useLayoutEffect` deletes a whole shipped defect class for free.** The mockup's own comment records that *"EVERY MEASURING PASS LIVED IN `repositionBars()`, WHICH DOES NOT RUN ON FIRST PAINT"* — a freshly loaded Track rendered `"We⋮ We⋮ We⋮"` where five event labels belonged, and only a zoom ever corrected it. A layout effect runs after the first paint and every subsequent one, by definition. Likewise the comment *"a listener bound to the old node would silently stop working after the first interaction"*: handlers declared in the tree are re-attached to whatever node the render produces, so that failure mode cannot occur.

**3. 🔴 The two codebases speak different date vocabularies, and the mismatch fails SILENTLY.** The mockup's `TL.dateAt()` returns an **ISO string**; the portal's `editOpFor()` calls `newEndDate.toISOString()` and expects a **Date**. The drag *looked* like it worked — the ghost state applied and cleared — and simply never committed, throwing only into the console. Neither vocabulary is wrong. **Every wiring seam between mockup code and portal logic must declare which one it is passing.**

### Smaller findings

- **String-returning icon helpers need a component form.** `Icons.fold()` returns HTML; in Preact that is `dangerouslySetInnerHTML` at every call site. One `<Icon name=… />` component retires all sixteen.
- **`assignRows` exists on both sides and they disagree — the mockup's is correct.** `portal/ui`'s uses `rowEnds[r] <= start`, which puts two merely-touching bars on separate rows; the mockup requires a day of clearance so consecutive bars share a row with a gutter. **The migration is where the better of two divergent implementations gets chosen deliberately** rather than inherited by whichever file was opened.
- **The instruments need `<main>`.** Both resolve their coordinate space from it. The portal shell provides one.
- **Preact batches state updates**, so a synchronous DOM read straight after a programmatic `.click()` reads the pre-update tree. This produced a false "lane collapse is broken" reading that survived two checks before a `sessionStorage` before/after bisect settled it.

### Verified working in the browser

39 items · 6 lanes · 9 bars · 14 points · 11 ruler ticks. Lane collapse toggles and persists to `sessionStorage`, the default-collapse rule (>3 rows) fires on Playlists, the load ribbon reports "7 at peak", label fitting resolves to 2 outside / 4 truncated, and dragging the Terminator event's end handle moved it Aug 30 → Sep 15 (+124px), flipped the bar to `staged`, and produced the `calendar.edit` op via the portal's own unchanged `editOpFor`.

## The decision

1. **`portal/ui/` becomes the single home.** The design moves to it; it does not move to the design.
2. **The mockup's CSS and class vocabulary come across whole.** `assets/app.css` + `assets/tokens.css` are the design; they are re-hosted, not re-authored.
3. **`portal/api`, `portal/auth.js`, `portal/server.js`, `httpClient`, `composeClient` and every `portal/ui/*.logic.js` are kept and reused.** The backend is not touched.
4. **`COMPANION.md` stops being a specification and becomes the record of *why*.** It is no longer something a session implements against.
5. **Design work is paused** until the migration lands — *markup-shaped* design work, specifically. A pure-CSS fix survives the migration untouched, since the classes come across intact.

## Order of work

| | |
|---|---|
| ① | A static fixture harness in `portal/ui/` — real ESM modules, `fetchJson` stubbed to fixtures, `?today=`, `<main>`, the instruments. Small: the serving problem is already solved by `repo-static:8900`, and components are already pure |
| ② | One `<Icon>` component, retiring the string-returning helpers |
| ③ | A shared measuring-pass hook carrying finding 1's generation-key discipline, so no realm re-derives it |
| ④ | Realm by realm: Season (Track first — the spike is its head start), Armory, Broadcast, Access, Analytics, Review |
| ⑤ | Per realm, as its composition lands: retire that mockup page, re-point the tests |

**What this costs that nothing else on the list does:** `scripts/portalRender.test.js`, `portalUi.test.js`, `portalRealms.test.js` and `portalContrastRendered.test.js` all assert against the current `portal/ui` components and are wired into `npm test`. They are rewritten as each realm migrates — not deleted, and not left failing.

## Audit log

A falsification pass was run on the recommendation carried in from the previous session (converge onto `portal/ui`) before it was put to Harkirat, and again on his counter-proposal.

| Where it was wrong | |
|---|---|
| **The binary framing itself** | "Mockup or `portal/ui`" treated three separable jobs as one object: a design surface, a specification, and a harness. Only the *specification* job was rotting. Naming the three is what made "keep the design, move its home" visible as an option at all |
| **The biggest stated cost was false** | §8's "server with auth and Mongo instead of opening a file" was never true; nothing had checked whether `portal/ui` could render from fixtures without the server. It can |
| **The strongest counter-argument was missing** | §8 never stated the CSS gap — the one fact that most threatens its own recommendation. Measuring it is what reversed the direction |
| **I was optimising the wrong variable** | Duplication is not what Harkirat has complained about; the portal *looking wrong* is. Any plan costing two sessions of plumbing for zero visible improvement is wrong regardless of how tidy its end state is — which is why the spike came before the commitment |
| **Bias check on my own preference** | Does the chosen direction let me avoid the unglamorous CSS work? No — it spreads it per realm and pays only for what survives contact. A real difference, not an evasion |
| **What the spike could have shown and did not** | It could have shown the markup did not transfer, or that the CSS did not apply to Preact-rendered DOM, or that the instruments broke. A spike whose only possible outcome is success is not a test. All three were live failure modes; the oscillation *was* a real failure and cost a 300-second timeout to find |
