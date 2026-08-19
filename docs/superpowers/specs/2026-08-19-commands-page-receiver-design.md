---
kind: spec
status: frozen
---

# The `/commands` page — "the Receiver"

**2026-08-19 14:03 EDT.** The fifth architecture, and the reasoning behind each part. Supersedes the design half of `2026-08-18-commands-page-bench-design.md`, which is a frozen snapshot of what was true on its date and is deliberately not edited.

---

## 1. Why the Bench was replaced

The Bench was not rejected on taste. It was chosen from renders on 2026-08-18 and it failed on the surface this page is actually read on. Harkirat, 2026-08-19 13:40 EDT: *"because i forgot to mention how poorly it behaves and looks on mobile."*

All ten screenshots in the second critique round were desktop. Measured on the shipped Bench at **375×812 with a real coarse pointer**:

| | Bench | Receiver |
|---|---|---|
| Document height, home | 3010px | **1219px** |
| Command index | 855px, starting at y=1850 | **58px rail**, at y=247 |
| One command's panel | 1282px | **660px** |
| The command line | y=1339, below everything | **pinned to the viewport** |
| Chrome above the fold | 161px (bar + "On this page") | 54px |

The Bench's premise was *two zones, both always on screen*. On a phone there were no zones: it was a stack, and the stack was the single scrolling column that had already been rejected in round two. **A design whose central claim is false in the mode most readers use is not a design that needs tuning.**

## 2. The one rule

**The command line is never off screen.** It is the artifact a reader came for; everything else is arranged around keeping it visible and always valid.

## 3. The grid

```
┌────────────────────────────────────────────────────────────┐
│ DIOREO · 14 COMMANDS   Commands                            │
│ START HERE ● /help ● /invite │ GUNSMITHS ◑ /gunsmiths … ▶  │  rail, sticky
├────────────────────────────────────────────────────────────┤
│ ▌ UTILITIES                                                │  ▌ = accent, LEFT
│ ▌ [/timestamp]                                             │  filled token
│ ▌ Turn a time into one that shows in every reader's own …  │
│ ▌ ┌ /timestamp  datetime[sun 4:30pm] ⌐timezone¬ ⌐style¬ ⌐view¬  [Copy] ┐ │
│ ▌ ┌ DATETIME  needs a value ─────────────────────────────┐ │
│ ▌ │ [ sun 4:30pm                                       ] │ │  real input
│ ▌ │  tomorrow   sun 4:30pm   19:30                       │ │  tap to fill
│ ▌ ├ TIMEZONE   Not set                                 ▸ │ │  <details>
│ ▌ ├ STYLE      Not set                                 ▸ │ │
└────────────────────────────────────────────────────────────┘
```

**One shape in both modes.** The rail wraps into grouped rows when there is width and scrolls horizontally when there is not; the line sticks under the rail on desktop and pins to the bottom of the viewport on a phone. The Bench had two unrelated behaviours and only one of them had been designed.

**`:target` still drives it, so the page still needs no JavaScript.** Every command has a real URL and deep links work. The home panel is LAST in the DOM so `.rx-p:target ~ .rx-home` can hide it with a following-sibling selector; putting it first would need `:has()`.

**There is a way back, and there was not.** `:target` has no native un-target. The rail's first chip links to the bare page URL and Escape does the same. Before this, the only route to the landing state was the "Who sees it" link — it pointed at a guide *inside* the home panel, so taking it un-targeted the panel and threw away the command you were reading, while appearing to be about reply privacy. That is what *"HOW DO I GET BACK TO THE /commands LANDING PAGE???"* was.

## 4. The line

Built from the command's **option list**, never from the set of values the reader has picked.

That is not a refactor, it is the fix for a shipped defect. The old `paint()` walked the picked set; a free-text required option can never be in it, so touching any optional value deleted the required one — verified live before the rewrite: `/timestamp datetime sun 4:30pm` became `/timestamp timezone (UTC−04:00) Eastern`, a command Discord rejects.

Every option now holds a permanent seat. Filled options show name and value; an empty optional is a dashed ghost; an empty **required** is a gap in the command's own colour. Copy refuses while a required slot is empty and says which one.

## 5. Controls, not displays

| Option | Was | Is |
|---|---|---|
| required, free text | read-only block + `REQUIRED` badge | `<input>` seeded with the sample, plus tap-to-fill examples |
| required, fixed choices | *also* a read-only block — and briefly, in this rewrite, a text input, which invited typing a value Discord rejects | pills with one pre-selected; clicking the chosen one does not clear it |
| optional, fixed choices | 348px of always-open pills | `<details>` summarising the chosen value |
| optional, free text | prose | `<details>` with the prose inside |

The old required block wore every visual convention for *disabled*. On a page whose entire offer is "try the command", the one control that mattered was the one you could not touch.

## 6. Colour — the accent is a FILL

The single worst thing in the previous version, and it was a strategy error rather than a bug.

Each accent is chosen for a Discord embed. Bending it into readable text by walking its lightness produced:

| Command | Raw | Light-solved | ΔL |
|---|---|---|---|
| `/patch notes` | `#F2C230` gold | `#7C5F08` | **−31** (brown) |
| `/season end` | `#F2994A` amber | `#9D500B` | −29 (rust) |
| `/help` | `#FF7D5C` coral | `#BD331A` | −21 |

…while the raw hex sat in a dot beside it. Two colours for one command, forty pixels apart, on a page whose stated premise is recognition.

**The accent now appears only as a fill or a mark** — left rule, dot, command token, filled value chip, aura. Headings are `--ink`. Where text sits on the fill, `solveOn()` picks the foreground.

**That cannot fail, and the old approach had no such floor.** Solve the crossover — the fill where black and white are equally bad — and it sits at relative luminance 0.1791, where the better of the two measures **4.58:1**. Gated by four cases including the worst-case grey; the case fails the moment anyone softens `INK_ON_LIGHT` from pure black to the site's near-black, which drops the floor to 4.27 and takes CP Emerald `#1F8A5E` with it.

Measured on the rendered page, light theme: `/patch notes` token is `rgb(0,0,0)` on `rgb(242,194,48)` at **12.53:1**.

**The accent rule moved to the LEFT edge**, which is where Discord puts it — asked directly, and correctly.

## 7. The derived six

Six commands derive an accent per render. Drawn as a hollow outlined dot, that true fact read as *missing*: *"why are all of these commands missing unique colors??"*

`utils/loadoutRender.js` has always carried `MP_CATEGORY_ACCENT` — seven real category colours the bot answers in, keyed by exactly the strings `/gunsmiths list` offers as `scope`. The page reads it at build time. The derived six wear a conic sweep of all seven, and **`/gunsmiths list` re-tints the whole panel to the category you choose** — LMG turns it Grape Purple `#845EC2` — because that is what the bot will do. Verified live: base `#7A6E8C` → LMG `#845EC2` → AR `#FF3B5C`, and back to base when deselected.

They also get a real neutral (`#7A6E8C`) rather than `var(--ink3)`. An ink token as an accent made a selected chip tint out grey, so it read as unselected beside a command whose chips tinted properly — *"blatant inconsistency in design"*, and correctly so.

## 8. Search

Matched name, purpose, option names and choice labels — everything Discord declares, none of which is the word a player types. `loadout` returned `/gunsmiths search` alone while `/gunsmiths list` and `/dmz` matched nothing.

Every command now carries a hand-written `keywords` string, gated by `SEARCH_CASES`: real queries asserted against an **exact** set, not a superset. A search that returns everything fails as badly as one that returns nothing, and only an exact expectation catches both.

## 9. What came off this page

- **The "On this page" accordion.** `mobileNav()` renders it only when given section slots; this page passes none. The rail already is that navigation, and stacking both cost 107px above the fold.
- **The trademark disclaimer.** `pageFoot(page, null, false)` — the variant already existed and two templates already use it.
- **`min-height: 60vh` on the stage.** It existed to stop the footer moving between commands and paid for that with a void under every short panel.

## 10. 🪤 Traps paid for

- 🔴 **A filled animation makes its element a containing block for fixed descendants.** `.rx-bar` is `position:fixed` on a phone and was measured at `top:1268px` in an 812px window. A final keyframe of `transform: none` computes to the **identity matrix**, and any transform creates the containing block. `animation-fill-mode: backwards` released it *after* the animation but not *during*, so every command switch threw the line off screen for 300ms. The card animates opacity only; the arrival motion lives on the heading block and the rule.
- 🔴 **Required-with-choices is not the same case as required-free-text.** The first cut of this rewrite made every required option an input, including `/gunsmiths list scope`, which accepts only seven registered values — the page inviting a reader to type something the bot rejects, and silently killing the category re-tint because there were no pills to hang it off.
- ⚠️ **A brace inside a CSS comment**, again, in the file whose own header warns about it. The hover-guard gate caught it; the message names the comment.
- ⚠️ **`keywords` as a string vs an array.** `.join` on a string is not a function and the build died at require time. Cheap, but it is why the gate runs in `npm test` as well as in the build.

## 11. Measuring this page

⚠️ **Screenshots misplace the fixed nav bar whenever the page is scrolled** — headless Chrome *and* the in-app Browser pane both composite the fixed layer at a stale offset, so the bar appears floating mid-page and reads exactly like a real layout bug. `document.elementFromPoint(x, 20)` settles it; capture at `scrollY === 0`.

⚠️ **A `position:fixed` element can report `position: fixed` and still be in the wrong place.** Read its `getBoundingClientRect()` against `innerHeight` and hit-test its centre with `elementFromPoint`; the computed `position` alone proves nothing.

⚠️ Headless Chrome clamps the layout viewport to 500px minimum, so `--window-size=390` is a 500px layout cropped. Use the Browser pane's mobile preset, which makes `pointer:coarse` actually match — a coarse-pointer branch cannot be reached by resizing a window.
