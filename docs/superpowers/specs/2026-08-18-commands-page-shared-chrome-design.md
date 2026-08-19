---
kind: spec
status: frozen
---

# The `/commands` page, and why the site's chrome CSS became shared — 2026-08-18

*A frozen snapshot of what was decided on this date and why. Superseded by a later dated spec, never edited.*

## What shipped

`dioreo.app/commands` — the site's **fourth page family** (`TOOL_PAGES`), and the first with no Markdown source. Three new modules: `scripts/lib/commandCatalog.js` (reads the bot's real command builders at build time), `scripts/lib/commandProse.js` (the hand-written "why you'd want this" layer, gated both ways), `scripts/lib/commandsPage.js` (the template).

## The decision that mattered most: extract the chrome, don't add a gate

`.bar`, `.bar nav{margin-left:auto}` and `.page` were written out verbatim in `shell()`, `warmShell()` and `scripts/lib/chronicle.js` — three byte-identical copies. The fourth family was added with the bar **markup** and none of its **styling**, and shipped that way: the built `public/commands.html` contained none of those rules. Every build gate passed, because the roster checks content, links, class collisions, contrast and coverage, and **no gate asks whether a class in the markup resolves to a rule in the stylesheet**.

Two options were on the table.

1. **Add a fourteenth gate** that cross-references emitted class names against emitted CSS selectors.
2. **Remove the opportunity** by extracting the duplicated rules into `CHROME.BAR_CSS` and `CHROME.PAGE_CSS`.

Option 2 was chosen. A markup-vs-stylesheet resolution check is genuinely hard to get right in general — dynamic classes, state selectors, classes styled by `COMPONENT_CSS`, classes that are hooks for JS and intentionally unstyled — so it would either be noisy or narrow enough to miss the next instance. Extraction is exact: after it, a new family that wants the chrome gets one constant, and a family that forgets it has no chrome at all rather than partial chrome, which is visible immediately.

`#prog` deliberately stayed at each call site: its accent variable genuinely differs per family (`--accent` on the documents, `--sig` on the chronicle) and `warmShell()` has no progress bar. Sharing it would have meant parameterising a rule that has three legitimately different forms.

**Verification of the extraction:** the other eight pages were diffed byte-for-byte before and after. `contributing.html` and `changelog/index.html` are identical ignoring whitespace; `terms.html` is 768 bytes smaller because a CSS comment that used to be emitted into the page now lives outside the template literal as a JS comment. Every rule the extraction touched was re-confirmed present in the built output.

## The mobile failure, and what it says about reviewing CSS

`.cx-fold{display:none}` sat after the `@media (max-width:880px)` block that sets it to `display:block`. Both selectors are `(0,1,0)`, so source order decided and the base rule won at every width — the picker's reopen button had never been visible anywhere. `setOpen()` collapses the picker below 880px deliberately (sixteen rows is a lot of phone), so the combined effect was a phone getting a search field, no command list, and no control to produce one.

This is not findable by reading. The media query is directly above, the intent is obvious, and every gate passes because the markup, the links and the contrast are all correct. It was found by opening the page at 390px and asking the DOM what it had computed.

**Two rendering surfaces returned well-formed numbers about the wrong thing during that investigation, and both are recorded here because they will recur:**

- The in-app browser pane went `document.hidden = true`. Screenshots painted a flat background while `elementFromPoint` still resolved elements correctly — so the DOM was fine and only the raster was dead.
- Headless Chrome **clamps the layout viewport to a minimum of 500px** regardless of `--window-size`. A `--window-size=390` capture is a 500px layout cropped to 390, which reads exactly like text being clipped by a real overflow bug. A three-line probe page printing `innerWidth` settled it immediately.

## Design direction

Identity comes from the **grid**, not the accent — carried over from the changelog pages, where three accent colours read as one template in three shades and the grid is what finally separated them.

- **The Composer is the signature and the only loud element.** A command line spanning the page, docked flush under the bar, that adopts whichever command you scroll to, fills in as you choose option values, and copies exactly what it shows. Its caret retires the moment a command is adopted, because a caret after a finished line claims it is still being typed.
- **Bays have two zones**: what a command *is* (prose, on `--raised`) over what it *takes* (data, on `--sunk`), with a continuous hairline so every option name stops at the same x.
- **Mono is reserved for things you type.** Guides take the display face so a concept and an invocation stop reading as the same kind of object.
- **The shared option is stated once per bay, not explained once per bay.** `visibility` is on all fourteen commands; printing "Who sees the answer" under each of them buried the options that actually differ. It renders last, dimmed, with its name linking to the guide that explains it — the same call Harkirat made on the bot side on 2026-08-10.

## Accepted, not resolved

- **No gate can tell whether the prose is TRUE.** Fourteen purpose lines and roughly thirty option blurbs were written from reading the builders and the source, having run none of those commands in Discord. Structural gates verify coverage in both directions and will stay green over a confident, well-formatted lie. The only oracle is a person running each command and comparing.
- Print, screen-reader traversal, and the no-JS path are reasoned rather than exercised.
