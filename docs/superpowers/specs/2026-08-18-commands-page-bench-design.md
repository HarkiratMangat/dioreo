---
kind: spec
status: frozen
---

# The `/commands` page — "the Bench"

**2026-08-18 23:14 EDT.** The design that shipped after three rejected rounds, and the reasoning behind each part of it. Supersedes the design half of `2026-08-18-commands-page-shared-chrome-design.md`, which described the page-wide Composer as the family's signature — that document is a frozen snapshot of what was true on its date and is deliberately not edited.

---

## 1. What the page is for

A CODM player in Discord, mid-task, usually on a phone, who is stuck. Harkirat's own framing, 2026-08-17 19:57 EDT: *"people don't want to read essays, they just need to be guided and shown how to do something ... the user is literally only here because **they need help**."*

They arrive in one of three states, and the page before this one served exactly one of them:

| Arrival | What they need | Served by |
|---|---|---|
| Knows the command, forgot an option | the option list, fast | the dot column, or search |
| Has a goal, not a command name | a route from the goal | **the ask index** |
| Knows nothing about the bot | what it can do at all | the ask index + the two guides |

The old page was organised by `commands/help.js`'s `CATEGORY_DEFS` — Gunsmiths, Draws, Seasonal, Utilities. That taxonomy exists because the **bot** is organised that way. Nobody arrives wanting "Utilities"; they arrive wanting to know how much CP they are short. That mismatch is what "unintuitive" was.

## 2. The grid

**Two zones, both always on screen. You do not scroll a list of commands — you pick one.**

```
┌──────────────────┬──────────────────────────────────────┐
│ [search]         │  SEASONAL                            │
│ START HERE       │  /patch notes            ← gold      │
│  ● /help         │  Weapon balance changes.             │
│  ● /invite       │  ┌ SEASON ──────────┐                │
│ GUNSMITHS        │  │ Look up an earlier│                │
│  ○ /gunsmiths …  │  └───────────────────┘                │
│  ● /patch notes ◀│  /patch notes            [Copy]      │
└──────────────────┴──────────────────────────────────────┘
   ● fixed colour     ○ derives one per render
```

- **The dot column is the signature.** Fourteen dots in the bot's own per-command accents. It is an index, a legend, and a portrait of the product in one object, and every part of it is true.
- **The stage's resting state is the ask index**, so one object answers both *I know exactly what I want* and *I have no idea what this does*.
- **Below 900px the stage comes FIRST and the index second** (flex `order`, so the DOM and tab order are unchanged). Measured at 375px with a real coarse pointer, the index is 846px tall once its targets are 44px — whichever zone is first costs the other a screenful, and it goes to the reader who is lost.

### Why `:target` and not JavaScript

The whole switch is `.cx-p:target{display:block}`. Every command has a real URL, deep links work, and the page's core function survives with scripting off — which the previous filter-driven page did not. The home panel is **last** in the DOM so `.cx-p:target ~ .cx-home` can hide it with a following-sibling selector; putting it first would need `:has()`, and this generator's own rules warn against making rendering depend on a selector feature behaving identically across engines.

JavaScript adds exactly three things, all of which the page is complete without: the active mark on the index (CSS cannot reach backward from a target to the link pointing at it), option pills writing into the copy line, and the live clock in `/timestamp`.

## 3. Colour

**The page is polychrome and the colours are the bot's own**, read out of each module's `PRESET_ACCENT` constant at build time so the page and the bot cannot silently stop agreeing. Recognition, not decoration: a reader who has seen `/patch notes` come back gold in Discord knows the panel before reading its name.

**Six of the fourteen have no fixed colour by design** and get a hollow dot plus a line saying so. Inventing six hexes to make the set look complete would be the page lying about the product.

**Signal Green `#58D05A` remains the PAGE's accent** — nav tab, Install button, focus rings, selection. The two do different jobs and must not be merged.

### The contrast contract

Each accent was chosen for a Discord embed, so it is solved to a text-safe variant per theme by walking its **lightness only** (the hue is what a reader recognises) until it *measures* 4.5:1. Not the site's 38%-mix formula, which this repo already records as turning saturated hues to mud.

🔴 **Solve against the harder surface of each theme, and it is not the same surface in both.** Dark `--raised` `#241F30` is *lighter* than dark `--desk` `#16131B`, so for near-white text the panel is harder. Light `--desk` `#E7E4EC` is *darker* than light `--raised` `#EEECF2`, so there the page is. Solving both against `--desk` put three colours at **4.00 / 4.05 / 4.08 on the panel they are actually painted on** while reporting 4.60 / 4.66 / 4.69 and passing.

Both solved values are emitted as **inline** custom properties and the **stylesheet** picks between them into `--ci`, because an inline style beats every stylesheet rule — one inline value could never be corrected for light theme. Light arrives two ways, so that is three blocks, mirroring TOKENS.

Gated by four cases in `scripts/commandCatalog.test.js`, one of which feeds the solver a colour it cannot fix so the others cannot pass vacuously.

## 4. Copy

Voice decided by Harkirat, 2026-08-18 22:10 EDT: **precision, no jokes.** A person reading this page is stuck; wit costs them time. The personality comes from calling things what a CODM player calls them.

- The kicker was `Read straight from the bot` — a fact about the build pipeline that no reader has a stake in. Now the product name plus a derived count.
- The lede narrated the page's own UI. Now it names the two ways in, with the second half in serif italic — the one device every site in the reference crawl uses and this site used nowhere. It costs no asset: `--serif` is already the body face.
- `visibility` is on all fourteen commands and is a property of the **answer**, not the query. It is stated once in a guide instead of printing the same sentence fourteen times.

## 5. Accessibility

- **WCAG 4.1.3** — filtering changed the index with no status message. A polite `role="status"` region is silent at rest and says "2 of 14 match" or names the miss.
- **Focus** — a `:target` swap moved the viewport but no focus, leaving a keyboard user on the link while the stage changed behind them. Panels carry `tabindex="-1"`, the same technique the skip link uses on `<main>`.
- **2.5.5** — verified at 375px with `pointer:coarse` actually matching (asserted, so the pass is not vacuous): every control ≥44px, no horizontal overflow.
- The dots are `aria-hidden`; the option pills are real `<button>`s carrying `aria-pressed`; folded choices use the `hidden` attribute so they leave the accessibility tree too.

## 6. Rejected, with reasons — do not re-propose

| Rejected | Why |
|---|---|
| **A page-wide command bar in any form** | A read-only box that reads as an input. Harkirat tried to type in it *every time he opened the site.* The lesson generalises down: the search field must not be dressed as a command line either. |
| **Ledger / cross-reference / sticky grids** | INVALIDATED, not judged — all three contained the Composer, so the round varied the layout while the defect sat inside every option. |
| **Ask-index / rack / both** | All three were a single column you scroll. That is one of the three looks AI design defaults to. A tidier list is not a spatial idea. |
| **The reply wall** (lead with pictures of real bot replies) | Needs Mongo at build time and the site builds with no DB; screenshots go stale on every UI change, breaking the page's no-drift premise. Ruled out 2026-08-18 22:15 EDT. |
| **The rooms** (ground inverts per group) | Every shared component dropped onto an inverted ground keeps the page's own ink tokens, so all of them need re-tokenising six times and no gate can see it. |
| **A live season countdown in the hero** | Season end lives in Mongo. A baked date rots, and a stale countdown is worse than none. |

## 7. Measuring this page

⚠️ **Screenshots misplace the fixed nav bar whenever the page is scrolled** — in headless Chrome *and* in the in-app Browser pane. Both composite the fixed layer at a stale offset, so the bar appears floating mid-page and it looks exactly like a real layout bug. `document.elementFromPoint(x, 20)` resolving to a `.tab` inside `.bar` settles it; capture at `scrollY === 0` for a clean image.

⚠️ Headless Chrome clamps the layout viewport to 500px minimum, so `--window-size=390` is a 500px layout cropped. Use a 390px iframe, or the Browser pane's mobile preset, which makes `pointer:coarse` actually match — a coarse-pointer branch cannot be reached by resizing a window.
