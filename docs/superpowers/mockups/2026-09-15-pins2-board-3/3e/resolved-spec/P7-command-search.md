---
kind: reference
status: live
---

# Board 3-E resolved values · P7 · Command search — settled "as shown", mounted here from `b3/palette.js`

*Part of the generated spec; read `README.md` in this folder first.*

## P7 · Command search — settled "as shown", mounted here from `b3/palette.js`

He settled it: *"Build it properly, and exactly as shown."* It carries no fork, it is no longer a gate, and this board is still its only specification — so it is mounted here from the kit's own `B3CommandBar` over the board's stylesheets. ⚠️ **The LOOK ships with this plan; the RANKING does not** — `gates/main.js` records it as its own session: *"badge cx9" returns what "badge" alone returns, and the ranking needs rebuilding.*


### P7 · closed, resting

4 distinct signatures on screen; 4 not already specced above.


### `div.b3-cmdbar.cmdbar`

inside `.pb-stage` · 1 on screen · **1 look**

#### the one look

`P7-1` · rendered **253×34** · 1 instance look like this

```html
<div class="cmdbar b3-cmdbar">⟨svg.ic.b3-cmdmag⟩<input class="cb-in" data-bare="true" autocomplete="off" spellcheck="true" role="combobox" aria-expanded="false" aria-controls="b3cmdList" placeholder="Search Armory, or run a command" aria-label="Search, or run a command"><kbd>⌘/</kbd></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .cmdbar · app.css:4700 |
| position | `relative` | `relative` | .cmdbar · app.css:4700 |
| gap | `9px` | `` | .cmdbar · app.css:4700 |
| column-gap | `9px` | `9px` | .cmdbar · app.css:4700 |
| row-gap | `9px` | `9px` | .cmdbar · app.css:4700 |
| flex | `1 1 460px` | `` | .cmdbar · app.css:4700 |
| align-items | `center` | `center` | .cmdbar · app.css:4700 |
| min-width | `0px` | `0px` | .cmdbar · app.css:4700 |
| max-width | `520px` | `520px` | .cmdbar · app.css:4700 |
| height | `34px` | `34px` | .cmdbar · app.css:4700 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `0 11px` | `` | .cmdbar · app.css:4700 |
| padding-top | `0px` | `0px` | .cmdbar · app.css:4700 |
| padding-right | `11px` | `11px` | .cmdbar · app.css:4700 |
| padding-bottom | `0px` | `0px` | .cmdbar · app.css:4700 |
| padding-left | `11px` | `11px` | .cmdbar · app.css:4700 |
| border | `1px solid var(--rule)` | `` | .cmdbar · app.css:4700 |
| border-radius | `var(--rad-3)` | `` | .cmdbar · app.css:4700 |
| background | `var(--sunk)` | `` | .cmdbar · app.css:4700 |
| background-color | `` | `rgb(11, 15, 18)` | .cmdbar · app.css:4700 |
| background-image | `` | `none` | .cmdbar · app.css:4700 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| transition | `border-color .15s,background .15s` | `` | .cmdbar · app.css:4700 |


### `svg.b3-cmdmag.ic`

inside `.cmdbar` · 1 on screen · **1 look**

#### the one look

`P7-2` · rendered **15×15** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic b3-cmdmag" aria-hidden="true"><use href="#i-search"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · app.css:6457 |
| flex | `none` | `` | .b3-cmdbar .b3-cmdmag · b3/board.css:1404 |
| width | `15px` | `15px` | .b3-cmdbar .b3-cmdmag · b3/board.css:1404 |
| height | `15px` | `15px` | .b3-cmdbar .b3-cmdmag · b3/board.css:1404 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .b3-cmdbar .b3-cmdmag · b3/board.css:1404 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |


### `input.cb-in[role=combobox]`

inside `.cmdbar` · 1 on screen · **1 look**

#### the one look

`P7-3` · rendered **165×17** · 1 instance look like this · aria-label="Search, or run a command" aria-expanded="false" role="combobox"

```html
<input class="cb-in" data-bare="true" autocomplete="off" spellcheck="true" role="combobox" aria-expanded="false" aria-controls="b3cmdList" placeholder="Search Armory, or run a command" aria-label="Search, or run a command">
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | input, textarea, select, button · user-agent:? |
| flex | `1 1 auto` | `` | .cb-in · app.css:4712 |
| min-width | `0px` | `0px` | .cb-in · app.css:4712 |
| min-height | `0px` | `0px` | .cmdbar input.cb-in · app.css:4879 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `0` | `` | .cmdbar input.cb-in · app.css:4879 |
| padding-top | `0px` | `0px` | .cmdbar input.cb-in · app.css:4879 |
| padding-right | `0px` | `0px` | .cmdbar input.cb-in · app.css:4879 |
| padding-bottom | `0px` | `0px` | .cmdbar input.cb-in · app.css:4879 |
| padding-left | `0px` | `0px` | .cmdbar input.cb-in · app.css:4879 |
| border | `0` | `` | .cmdbar input.cb-in · app.css:4879 |
| border-radius | `0` | `` | .cmdbar input.cb-in · app.css:4879 |
| background | `none` | `` | .cmdbar input.cb-in · app.css:4879 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .cmdbar input.cb-in · app.css:4879 |
| background-image | `none` | `none` | .cmdbar input.cb-in · app.css:4879 |
| box-shadow | `none` | `none` | .cmdbar input.cb-in · app.css:4879 |
| font | `400 var(--t-base)/1 var(--ui)` | `` | .cb-in · app.css:4712 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .cb-in · app.css:4712 |
| font-size | `` | `13px` | .cb-in · app.css:4712 |
| font-weight | `` | `400` | .cb-in · app.css:4712 |
| font-style | `` | `normal` | .cb-in · app.css:4712 |
| font-variant-numeric | `` | `normal` | .cb-in · app.css:4712 |
| line-height | `` | `13px` | .cb-in · app.css:4712 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `start` | `start` | input, textarea, select, button · user-agent:? |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .cb-in · app.css:4712 |
| overflow-x | `clip !important !important` | `clip` | input:not([type="range" i], [type="checkbox" i], [type="radio" i]) · user-agent:? |
| overflow-y | `clip !important !important` | `clip` | input:not([type="range" i], [type="checkbox" i], [type="radio" i]) · user-agent:? |
| cursor | `text` | `text` | input · user-agent:? |
| user-select | `text` | `text` | :is(.b3-xt-code, .b3-src, .b3-ent, .exs-f, .b3-xt-pwf, code, kbd, input, textarea), [data- · b3/board.css:4977 |

**:hover** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |

**:active** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)


### `kbd`

inside `.cmdbar` · 1 on screen · **1 look**

#### the one look

`P7-4` · rendered **31×22** · 1 instance look like this · text “⌘/”

```html
<kbd>⌘/</kbd>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .cmdbar kbd · app.css:4717 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `4px 6px` | `` | .cmdbar kbd · app.css:4717 |
| padding-top | `4px` | `4px` | .cmdbar kbd · app.css:4717 |
| padding-right | `6px` | `6px` | .cmdbar kbd · app.css:4717 |
| padding-bottom | `4px` | `4px` | .cmdbar kbd · app.css:4717 |
| padding-left | `6px` | `6px` | .cmdbar kbd · app.css:4717 |
| border | `1px solid var(--rule2)` | `` | .cmdbar kbd · app.css:4717 |
| border-radius | `var(--rad-2)` | `` | .cmdbar kbd · app.css:4717 |
| font | `500 var(--t-sm)/1 var(--ui)` | `` | .cmdbar kbd · app.css:4717 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .cmdbar kbd · app.css:4717 |
| font-size | `` | `12px` | .cmdbar kbd · app.css:4717 |
| font-weight | `` | `500` | .cmdbar kbd · app.css:4717 |
| font-style | `` | `normal` | .cmdbar kbd · app.css:4717 |
| font-variant-numeric | `` | `normal` | .cmdbar kbd · app.css:4717 |
| line-height | `` | `12px` | .cmdbar kbd · app.css:4717 |
| letter-spacing | `0.04em` | `0.48px` | .cmdbar kbd · app.css:4717 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .cmdbar kbd · app.css:4979 |
| user-select | `text` | `text` | :is(.b3-xt-code, .b3-src, .b3-ent, .exs-f, .b3-xt-pwf, code, kbd, input, textarea), [data- · b3/board.css:4977 |


### P7 · typed “meta cx9” — a badge and a weapon — the compose row

24 distinct signatures on screen; 23 not already specced above.


### `div.b3-cmdbar.cmdbar.on`

inside `.pb-stage` · 1 on screen · **1 look**

#### the one look

`P7metacx9-1` · rendered **253×34** · 1 instance look like this

```html
<div class="cmdbar b3-cmdbar on">⟨svg.ic.b3-cmdmag⟩<input class="cb-in" data-bare="true" autocomplete="off" spellcheck="true" role="combobox" aria-expanded="true" aria-controls="b3cmdList" placeholder="Search Armory, or run a command" aria-label="Search, or run a command"><kbd>⌘/</kbd><div class="b3-cmd" role="listbox" id="b3cmdList" aria-label="Results"><button type="button" class="b3-compose on"><span class="row"><
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .cmdbar · app.css:4700 |
| position | `relative` | `relative` | .cmdbar · app.css:4700 |
| gap | `9px` | `` | .cmdbar · app.css:4700 |
| column-gap | `9px` | `9px` | .cmdbar · app.css:4700 |
| row-gap | `9px` | `9px` | .cmdbar · app.css:4700 |
| flex | `1 1 460px` | `` | .cmdbar · app.css:4700 |
| align-items | `center` | `center` | .cmdbar · app.css:4700 |
| min-width | `0px` | `0px` | .cmdbar · app.css:4700 |
| max-width | `520px` | `520px` | .cmdbar · app.css:4700 |
| height | `34px` | `34px` | .cmdbar · app.css:4700 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `0 11px` | `` | .cmdbar · app.css:4700 |
| padding-top | `0px` | `0px` | .cmdbar · app.css:4700 |
| padding-right | `11px` | `11px` | .cmdbar · app.css:4700 |
| padding-bottom | `0px` | `0px` | .cmdbar · app.css:4700 |
| padding-left | `11px` | `11px` | .cmdbar · app.css:4700 |
| border | `1px solid var(--rule)` | `` | .cmdbar · app.css:4700 |
| border-color | `var(--patch)` | `` | .cmdbar.on, .cmdbar:focus-within · app.css:4706 |
| border-radius | `var(--rad-3)` | `` | .cmdbar · app.css:4700 |
| background | `var(--paper)` | `` | .cmdbar.on, .cmdbar:focus-within · app.css:4706 |
| background-color | `` | `rgb(23, 30, 36)` | .cmdbar.on, .cmdbar:focus-within · app.css:4706 |
| background-image | `` | `none` | .cmdbar.on, .cmdbar:focus-within · app.css:4706 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| transition | `border-color .15s,background .15s` | `` | .cmdbar · app.css:4700 |


### `svg.b3-cmdmag.ic`

inside `.cmdbar` · 1 on screen · **1 look**

#### the one look

`P7metacx9-2` · rendered **15×15** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic b3-cmdmag" aria-hidden="true"><use href="#i-search"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · app.css:6457 |
| flex | `none` | `` | .b3-cmdbar .b3-cmdmag · b3/board.css:1404 |
| width | `15px` | `15px` | .b3-cmdbar .b3-cmdmag · b3/board.css:1404 |
| height | `15px` | `15px` | .b3-cmdbar .b3-cmdmag · b3/board.css:1404 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | `var(--patch)` | `rgb(242, 194, 48)` | .b3-cmdbar:focus-within .b3-cmdmag · b3/board.css:1405 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |


### `kbd`

inside `.cmdbar` · 6 on screen · **3 looks**

#### look 1 of 3

`P7metacx9-4` · rendered **31×22** · 1 instance look like this · text “⌘/”

```html
<kbd>⌘/</kbd>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .cmdbar kbd · app.css:4717 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `4px 6px` | `` | .cmdbar kbd · app.css:4717 |
| padding-top | `4px` | `4px` | .cmdbar kbd · app.css:4717 |
| padding-right | `6px` | `6px` | .cmdbar kbd · app.css:4717 |
| padding-bottom | `4px` | `4px` | .cmdbar kbd · app.css:4717 |
| padding-left | `6px` | `6px` | .cmdbar kbd · app.css:4717 |
| border | `1px solid var(--rule2)` | `` | .cmdbar kbd · app.css:4717 |
| border-radius | `var(--rad-2)` | `` | .cmdbar kbd · app.css:4717 |
| font | `500 var(--t-sm)/1 var(--ui)` | `` | .cmdbar kbd · app.css:4717 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .cmdbar kbd · app.css:4717 |
| font-size | `` | `12px` | .cmdbar kbd · app.css:4717 |
| font-weight | `` | `500` | .cmdbar kbd · app.css:4717 |
| font-style | `` | `normal` | .cmdbar kbd · app.css:4717 |
| font-variant-numeric | `` | `normal` | .cmdbar kbd · app.css:4717 |
| line-height | `` | `12px` | .cmdbar kbd · app.css:4717 |
| letter-spacing | `0.04em` | `0.48px` | .cmdbar kbd · app.css:4717 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .cmdbar kbd · app.css:4979 |
| opacity | `0` | `0` | .cmdbar:focus-within kbd · app.css:4719 |
| user-select | `text` | `text` | :is(.b3-xt-code, .b3-src, .b3-ent, .exs-f, .b3-xt-pwf, code, kbd, input, textarea), [data- · b3/board.css:4977 |

#### look 2 of 3

`P7metacx9-17` · rendered **24×24** · 1 instance look like this · text “↵”

```html
<kbd>↵</kbd>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-cmdbar .b3-compose .go kbd · b3/board.css:1436 |
| flex | `none` | `` | .b3-cmdbar .b3-cmd kbd · b3/board.css:1407 |
| align-items | `center` | `center` | .b3-cmdbar .b3-compose .go kbd · b3/board.css:1436 |
| place-items | `center` | `` | .b3-cmdbar .b3-compose .go kbd · b3/board.css:1436 |
| min-width | `24px` | `24px` | .b3-cmdbar .b3-compose .go kbd · b3/board.css:1436 |
| height | `24px` | `24px` | .b3-cmdbar .b3-compose .go kbd · b3/board.css:1436 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `4px 6px` | `` | .cmdbar kbd · app.css:4717 |
| padding-top | `4px` | `4px` | .cmdbar kbd · app.css:4717 |
| padding-right | `6px` | `6px` | .cmdbar kbd · app.css:4717 |
| padding-bottom | `4px` | `4px` | .cmdbar kbd · app.css:4717 |
| padding-left | `6px` | `6px` | .cmdbar kbd · app.css:4717 |
| border | `1px solid var(--rule2)` | `` | .cmdbar kbd · app.css:4717 |
| border-radius | `6px` | `` | .b3-cmdbar .b3-compose .go kbd · b3/board.css:1436 |
| background | `var(--r-review)` | `` | .b3-cmdbar .b3-compose .go kbd · b3/board.css:1436 |
| background-color | `` | `rgb(216, 242, 74)` | .b3-cmdbar .b3-compose .go kbd · b3/board.css:1436 |
| background-image | `` | `none` | .b3-cmdbar .b3-compose .go kbd · b3/board.css:1436 |
| font | `700 12px/1 var(--data)` | `` | .b3-cmdbar .b3-compose .go kbd · b3/board.css:1436 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .b3-cmdbar .b3-compose .go kbd · b3/board.css:1436 |
| font-size | `` | `12px` | .b3-cmdbar .b3-compose .go kbd · b3/board.css:1436 |
| font-weight | `` | `700` | .b3-cmdbar .b3-compose .go kbd · b3/board.css:1436 |
| font-style | `` | `normal` | .b3-cmdbar .b3-compose .go kbd · b3/board.css:1436 |
| font-variant-numeric | `` | `normal` | .b3-cmdbar .b3-compose .go kbd · b3/board.css:1436 |
| line-height | `` | `12px` | .b3-cmdbar .b3-compose .go kbd · b3/board.css:1436 |
| letter-spacing | `0.04em` | `0.48px` | .cmdbar kbd · app.css:4717 |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-compose · b3/board.css:1424 |
| color | `rgb(26, 32, 0)` | `rgb(26, 32, 0)` | .b3-cmdbar .b3-compose .go kbd · b3/board.css:1436 |
| opacity | `1` | `1` | .b3-cmdbar .b3-cmd kbd · b3/board.css:1407 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-compose · b3/board.css:1424 |
| user-select | `text` | `text` | :is(.b3-xt-code, .b3-src, .b3-ent, .exs-f, .b3-xt-pwf, code, kbd, input, textarea), [data- · b3/board.css:4977 |

#### look 3 of 3

`P7metacx9-53` · rendered **19×22** · 4 instances look like this · text “↑”

```html
<kbd>↑</kbd>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `inline` | initial |
| flex | `none` | `` | .b3-cmdbar .b3-cmd kbd · b3/board.css:1407 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `3px 5px` | `` | .b3-cmdf kbd · b3/board.css:1421 |
| padding-top | `3px` | `3px` | .b3-cmdf kbd · b3/board.css:1421 |
| padding-right | `5px` | `5px` | .b3-cmdf kbd · b3/board.css:1421 |
| padding-bottom | `3px` | `3px` | .b3-cmdf kbd · b3/board.css:1421 |
| padding-left | `5px` | `5px` | .b3-cmdf kbd · b3/board.css:1421 |
| margin-right | `5px` | `5px` | .b3-cmdf kbd · b3/board.css:1421 |
| border | `1px solid var(--rule2)` | `` | .cmdbar kbd · app.css:4717 |
| border-radius | `var(--rad-1)` | `` | .b3-cmdf kbd · b3/board.css:1421 |
| box-shadow | `var(--b3-ring)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .b3-cmdf kbd · b3/board.css:1421 |
| font | `600 10.5px/1 var(--data)` | `` | .b3-cmdf kbd · b3/board.css:1421 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .b3-cmdf kbd · b3/board.css:1421 |
| font-size | `` | `10.5px` | .b3-cmdf kbd · b3/board.css:1421 |
| font-weight | `` | `600` | .b3-cmdf kbd · b3/board.css:1421 |
| font-style | `` | `normal` | .b3-cmdf kbd · b3/board.css:1421 |
| font-variant-numeric | `` | `normal` | .b3-cmdf kbd · b3/board.css:1421 |
| line-height | `` | `10.5px` | .b3-cmdf kbd · b3/board.css:1421 |
| letter-spacing | `0.04em` | `0.42px` | .cmdbar kbd · app.css:4717 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .b3-cmdf kbd · b3/board.css:1421 |
| opacity | `1` | `1` | .b3-cmdbar .b3-cmd kbd · b3/board.css:1407 |
| user-select | `text` | `text` | :is(.b3-xt-code, .b3-src, .b3-ent, .exs-f, .b3-xt-pwf, code, kbd, input, textarea), [data- · b3/board.css:4977 |


### `div.b3-cmd[role=listbox]`

inside `.cmdbar` · 1 on screen · **1 look**

#### the one look

`P7metacx9-5` · rendered **520×403** · 1 instance look like this · aria-label="Results" role="listbox"

```html
<div class="b3-cmd" role="listbox" id="b3cmdList" aria-label="Results"><button type="button" class="b3-compose on"><span class="row"><span class="b3-tok verb">⟨svg.ic⟩Set badge</span><span class="b3-tok badge" style="--c: #38D6F0;">META</span><span class="b3-joiner">on</span><span class="b3-tok weap" style="--c: #ffd23f;"><i></i>CX-9<em>3 builds</em></span></span><span class="go"><span>CX-9 is already META — opens it
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `absolute` | `absolute` | .b3-cmd · b3/board.css:1406 |
| min-width | `520px` | `520px` | .b3-cmd · b3/board.css:1406 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| top | `calc(100% + 8px)` | `40px` | .b3-cmd · b3/board.css:1406 |
| right | `-1px` | `-1px` | .b3-cmd · b3/board.css:1406 |
| left | `-1px` | `-1px` | .b3-cmd · b3/board.css:1406 |
| border-radius | `var(--rad-3)` | `` | .b3-cmd · b3/board.css:1406 |
| background | `var(--raised)` | `` | .b3-cmd · b3/board.css:1406 |
| background-color | `` | `rgb(31, 39, 46)` | .b3-cmd · b3/board.css:1406 |
| background-image | `` | `none` | .b3-cmd · b3/board.css:1406 |
| box-shadow | `var(--b3-ring),0 28px 60px -20px var(--scrim-90)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.9) 0px 28px 60px -20px` | .b3-cmd · b3/board.css:1406 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| overflow | `hidden` | `` | .b3-cmd · b3/board.css:1406 |
| overflow-x | `hidden` | `hidden` | .b3-cmd · b3/board.css:1406 |
| overflow-y | `hidden` | `hidden` | .b3-cmd · b3/board.css:1406 |
| animation | `b3pop .14s var(--ease) both` | `` | .b3-cmd · b3/board.css:1406 |
| z-index | `70` | `70` | .b3-cmd · b3/board.css:1406 |


### `button.b3-compose.on`

inside `.b3-cmd` · 1 on screen · **1 look**

#### the one look

`P7metacx9-6` · rendered **504×91** · 1 instance look like this · type="button"

```html
<button type="button" class="b3-compose on"><span class="row"><span class="b3-tok verb">⟨svg.ic⟩Set badge</span><span class="b3-tok badge" style="--c: #38D6F0;">META</span><span class="b3-joiner">on</span><span class="b3-tok weap" style="--c: #ffd23f;"><i></i>CX-9<em>3 builds</em></span></span><span class="go"><span>CX-9 is already META — opens its builds …</span><kbd>↵</kbd></span></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-compose · b3/board.css:1424 |
| gap | `11px` | `` | .b3-compose · b3/board.css:1424 |
| column-gap | `11px` | `11px` | .b3-compose · b3/board.css:1424 |
| row-gap | `11px` | `11px` | .b3-compose · b3/board.css:1424 |
| width | `calc(100% - 16px)` | `504px` | .b3-compose · b3/board.css:1424 |
| min-height | `var(--ctl-min, 32px)` | `0px` | input, select, textarea, button · app.css:388 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `13px 14px` | `` | .b3-compose · b3/board.css:1424 |
| padding-top | `13px` | `13px` | .b3-compose · b3/board.css:1424 |
| padding-right | `14px` | `14px` | .b3-compose · b3/board.css:1424 |
| padding-bottom | `13px` | `13px` | .b3-compose · b3/board.css:1424 |
| padding-left | `14px` | `14px` | .b3-compose · b3/board.css:1424 |
| margin | `8px 8px 4px` | `` | .b3-compose · b3/board.css:1424 |
| margin-top | `8px` | `8px` | .b3-compose · b3/board.css:1424 |
| margin-right | `8px` | `8px` | .b3-compose · b3/board.css:1424 |
| margin-bottom | `4px` | `4px` | .b3-compose · b3/board.css:1424 |
| margin-left | `8px` | `8px` | .b3-compose · b3/board.css:1424 |
| border | `0` | `` | .b3-compose · b3/board.css:1424 |
| border-radius | `var(--rad-2)` | `` | .b3-compose · b3/board.css:1424 |
| background | `var(--sunk)` | `` | .b3-compose · b3/board.css:1424 |
| background-color | `` | `rgb(11, 15, 18)` | .b3-compose · b3/board.css:1424 |
| background-image | `` | `none` | .b3-compose · b3/board.css:1424 |
| box-shadow | `inset 0 0 0 1px var(--r-review),0 0 0 3px color-mix(in srgb,var(--r-review) 14%,transparent)` | `rgb(216, 242, 74) 0px 0px 0px 1px inset, color(srgb 0.847059 0.94902 0.290196 / 0.14) 0px 0px 0px 3px` | .b3-compose.on · b3/board.css:1425 |
| font | `inherit` | `` | button · app.css:621 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · app.css:621 |
| font-size | `inherit` | `13px` | button · app.css:621 |
| font-weight | `inherit` | `400` | button · app.css:621 |
| font-style | `inherit` | `normal` | button · app.css:621 |
| font-variant-numeric | `inherit` | `normal` | button · app.css:621 |
| line-height | `inherit` | `19.5px` | button · app.css:621 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `left` | `left` | .b3-compose · b3/board.css:1424 |
| color | `inherit` | `rgb(232, 237, 241)` | button · app.css:621 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · app.css:5549 |
| cursor | `pointer` | `pointer` | .b3-compose · b3/board.css:1424 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(1, 0, 0, 1, 0, 0)` |


### `span.row`

inside `.b3-compose` · 1 on screen · **1 look**

#### the one look

`P7metacx9-7` · rendered **476×30** · 1 instance look like this

```html
<span class="row"><span class="b3-tok verb">⟨svg.ic⟩Set badge</span><span class="b3-tok badge" style="--c: #38D6F0;">META</span><span class="b3-joiner">on</span><span class="b3-tok weap" style="--c: #ffd23f;"><i></i>CX-9<em>3 builds</em></span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-compose .row · b3/board.css:1426 |
| gap | `8px` | `` | .b3-compose .row · b3/board.css:1426 |
| column-gap | `8px` | `8px` | .b3-compose .row · b3/board.css:1426 |
| row-gap | `8px` | `8px` | .b3-compose .row · b3/board.css:1426 |
| flex-wrap | `wrap` | `wrap` | .b3-compose .row · b3/board.css:1426 |
| align-items | `center` | `center` | .b3-compose .row · b3/board.css:1426 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · app.css:621 |
| font-size | ↑ `inherit` | `13px` | inherited · button · app.css:621 |
| font-weight | ↑ `inherit` | `400` | inherited · button · app.css:621 |
| font-style | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `19.5px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-compose · b3/board.css:1424 |
| color | ↑ `inherit` | `rgb(232, 237, 241)` | inherited · button · app.css:621 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-compose · b3/board.css:1424 |


### `span.b3-tok.verb`

inside `.row` · 1 on screen · **1 look**

#### the one look

`P7metacx9-8` · rendered **102×30** · 1 instance look like this

```html
<span class="b3-tok verb">⟨svg.ic⟩Set badge</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-tok · b3/board.css:1427 |
| gap | `7px` | `` | .b3-tok · b3/board.css:1427 |
| column-gap | `7px` | `7px` | .b3-tok · b3/board.css:1427 |
| row-gap | `7px` | `7px` | .b3-tok · b3/board.css:1427 |
| align-items | `center` | `center` | .b3-tok · b3/board.css:1427 |
| height | `30px` | `30px` | .b3-tok · b3/board.css:1427 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `0 11px` | `` | .b3-tok · b3/board.css:1427 |
| padding-top | `0px` | `0px` | .b3-tok · b3/board.css:1427 |
| padding-right | `11px` | `11px` | .b3-tok · b3/board.css:1427 |
| padding-bottom | `0px` | `0px` | .b3-tok · b3/board.css:1427 |
| padding-left | `11px` | `11px` | .b3-tok · b3/board.css:1427 |
| border-radius | `var(--rad-2)` | `` | .b3-tok · b3/board.css:1427 |
| background | `var(--r-review)` | `` | .b3-tok.verb · b3/board.css:1429 |
| background-color | `` | `rgb(216, 242, 74)` | .b3-tok.verb · b3/board.css:1429 |
| background-image | `` | `none` | .b3-tok.verb · b3/board.css:1429 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .b3-tok · b3/board.css:1427 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-tok · b3/board.css:1427 |
| font-size | `` | `12px` | .b3-tok · b3/board.css:1427 |
| font-weight | `` | `600` | .b3-tok · b3/board.css:1427 |
| font-style | `` | `normal` | .b3-tok · b3/board.css:1427 |
| font-variant-numeric | `` | `normal` | .b3-tok · b3/board.css:1427 |
| line-height | `` | `12px` | .b3-tok · b3/board.css:1427 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-compose · b3/board.css:1424 |
| white-space | `nowrap` | `` | .b3-tok · b3/board.css:1427 |
| color | `rgb(26, 32, 0)` | `rgb(26, 32, 0)` | .b3-tok.verb · b3/board.css:1429 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-compose · b3/board.css:1424 |


### `svg.ic`

inside `.b3-tok` · 5 on screen · **4 looks**

#### look 1 of 4

`P7metacx9-9` · rendered **14×14** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic" aria-hidden="true"><use href="#i-tag"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · app.css:6457 |
| flex | `none` | `` | .ic · b2.css:4 |
| width | `14px` | `14px` | .b3-tok .ic · b3/board.css:1428 |
| height | `14px` | `14px` | .b3-tok .ic · b3/board.css:1428 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `600 var(--t-sm)/1 var(--ui)` | `` | inherited · .b3-tok · b3/board.css:1427 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .b3-tok · b3/board.css:1427 |
| font-size | ↑ `` | `12px` | inherited · .b3-tok · b3/board.css:1427 |
| font-weight | ↑ `` | `600` | inherited · .b3-tok · b3/board.css:1427 |
| font-style | ↑ `` | `normal` | inherited · .b3-tok · b3/board.css:1427 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-tok · b3/board.css:1427 |
| line-height | ↑ `` | `12px` | inherited · .b3-tok · b3/board.css:1427 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-compose · b3/board.css:1424 |
| white-space | ↑ `nowrap` | `` | inherited · .b3-tok · b3/board.css:1427 |
| color | ↑ `rgb(26, 32, 0)` | `rgb(26, 32, 0)` | inherited · .b3-tok.verb · b3/board.css:1429 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-compose · b3/board.css:1424 |
| pointer-events | `none` | `none` | button .ic, a .ic · app.css:6464 |

#### look 2 of 4

`P7metacx9-22` · rendered **15×15** · 2 instances look like this · aria-hidden="true"

```html
<svg class="ic" aria-hidden="true"><use href="#i-tag"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · app.css:6457 |
| flex | `none` | `` | .ic · b2.css:4 |
| width | `15px` | `15px` | .b3-cmdr > i .ic · b3/board.css:1413 |
| height | `15px` | `15px` | .b3-cmdr > i .ic · b3/board.css:1413 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · app.css:621 |
| font-size | ↑ `inherit` | `13px` | inherited · button · app.css:621 |
| font-weight | ↑ `inherit` | `400` | inherited · button · app.css:621 |
| font-style | ↑ `italic` | `italic` | inherited · i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `19.5px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-cmdr · b3/board.css:1410 |
| color | ↑ `var(--c)` | `rgb(239, 68, 68)` | inherited · .b3-cmdr > i · b3/board.css:1412 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-cmdr · b3/board.css:1410 |
| pointer-events | `none` | `none` | button .ic, a .ic · app.css:6464 |

#### look 3 of 4

`P7metacx9-39` · rendered **15×15** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic" aria-hidden="true"><use href="#i-zap"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · app.css:6457 |
| flex | `none` | `` | .ic · b2.css:4 |
| width | `15px` | `15px` | .b3-cmdr > i .ic · b3/board.css:1413 |
| height | `15px` | `15px` | .b3-cmdr > i .ic · b3/board.css:1413 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · app.css:621 |
| font-size | ↑ `inherit` | `13px` | inherited · button · app.css:621 |
| font-weight | ↑ `inherit` | `400` | inherited · button · app.css:621 |
| font-style | ↑ `italic` | `italic` | inherited · i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `19.5px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-cmdr · b3/board.css:1410 |
| color | ↑ `var(--c)` | `rgb(56, 214, 240)` | inherited · .b3-cmdr > i · b3/board.css:1412 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-cmdr · b3/board.css:1410 |
| pointer-events | `none` | `none` | button .ic, a .ic · app.css:6464 |

#### look 4 of 4

`P7metacx9-46` · rendered **15×15** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic" aria-hidden="true"><use href="#i-layers"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · app.css:6457 |
| flex | `none` | `` | .ic · b2.css:4 |
| width | `15px` | `15px` | .b3-cmdr > i .ic · b3/board.css:1413 |
| height | `15px` | `15px` | .b3-cmdr > i .ic · b3/board.css:1413 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · app.css:621 |
| font-size | ↑ `inherit` | `13px` | inherited · button · app.css:621 |
| font-weight | ↑ `inherit` | `400` | inherited · button · app.css:621 |
| font-style | ↑ `italic` | `italic` | inherited · i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `19.5px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-cmdr · b3/board.css:1410 |
| color | ↑ `var(--c)` | `rgb(255, 210, 63)` | inherited · .b3-cmdr > i · b3/board.css:1412 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-cmdr · b3/board.css:1410 |
| pointer-events | `none` | `none` | button .ic, a .ic · app.css:6464 |


### `span.b3-tok.badge`

inside `.row` · 1 on screen · **1 look**

#### the one look

`P7metacx9-10` · rendered **56×30** · 1 instance look like this · text “META”

```html
<span class="b3-tok badge" style="--c: #38D6F0;">META</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-tok · b3/board.css:1427 |
| gap | `7px` | `` | .b3-tok · b3/board.css:1427 |
| column-gap | `7px` | `7px` | .b3-tok · b3/board.css:1427 |
| row-gap | `7px` | `7px` | .b3-tok · b3/board.css:1427 |
| align-items | `center` | `center` | .b3-tok · b3/board.css:1427 |
| height | `30px` | `30px` | .b3-tok · b3/board.css:1427 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `0 11px` | `` | .b3-tok · b3/board.css:1427 |
| padding-top | `0px` | `0px` | .b3-tok · b3/board.css:1427 |
| padding-right | `11px` | `11px` | .b3-tok · b3/board.css:1427 |
| padding-bottom | `0px` | `0px` | .b3-tok · b3/board.css:1427 |
| padding-left | `11px` | `11px` | .b3-tok · b3/board.css:1427 |
| border-radius | `var(--rad-2)` | `` | .b3-tok · b3/board.css:1427 |
| background | `color-mix(in srgb,var(--c) 12%,transparent)` | `` | .b3-tok.badge · b3/board.css:1430 |
| background-color | `` | `color(srgb 0.219608 0.839216 0.941176 / 0.12)` | .b3-tok.badge · b3/board.css:1430 |
| background-image | `` | `none` | .b3-tok.badge · b3/board.css:1430 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--c) 50%,transparent)` | `color(srgb 0.219608 0.839216 0.941176 / 0.5) 0px 0px 0px 1px inset` | .b3-tok.badge · b3/board.css:1430 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .b3-tok · b3/board.css:1427 |
| font-family | `var(--data)` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .b3-tok.badge · b3/board.css:1430 |
| font-size | `` | `12px` | .b3-tok · b3/board.css:1427 |
| font-weight | `` | `600` | .b3-tok · b3/board.css:1427 |
| font-style | `` | `normal` | .b3-tok · b3/board.css:1427 |
| font-variant-numeric | `` | `normal` | .b3-tok · b3/board.css:1427 |
| line-height | `` | `12px` | .b3-tok · b3/board.css:1427 |
| letter-spacing | `var(--b3-tr)` | `1.32px` | .b3-tok.badge · b3/board.css:1430 |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-compose · b3/board.css:1424 |
| white-space | `nowrap` | `` | .b3-tok · b3/board.css:1427 |
| color | `var(--c)` | `rgb(56, 214, 240)` | .b3-tok.badge · b3/board.css:1430 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-compose · b3/board.css:1424 |


### `span.b3-joiner`

inside `.row` · 1 on screen · **1 look**

#### the one look

`P7metacx9-11` · rendered **15×12** · 1 instance look like this · text “on”

```html
<span class="b3-joiner">on</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `500 var(--t-sm)/1 var(--ui)` | `` | .b3-joiner · b3/board.css:1434 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-joiner · b3/board.css:1434 |
| font-size | `` | `12px` | .b3-joiner · b3/board.css:1434 |
| font-weight | `` | `500` | .b3-joiner · b3/board.css:1434 |
| font-style | `` | `normal` | .b3-joiner · b3/board.css:1434 |
| font-variant-numeric | `` | `normal` | .b3-joiner · b3/board.css:1434 |
| line-height | `` | `12px` | .b3-joiner · b3/board.css:1434 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-compose · b3/board.css:1424 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .b3-joiner · b3/board.css:1434 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-compose · b3/board.css:1424 |


### `span.b3-tok.weap`

inside `.row` · 1 on screen · **1 look**

#### the one look

`P7metacx9-12` · rendered **129×30** · 1 instance look like this

```html
<span class="b3-tok weap" style="--c: #ffd23f;"><i></i>CX-9<em>3 builds</em></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-tok · b3/board.css:1427 |
| gap | `7px` | `` | .b3-tok · b3/board.css:1427 |
| column-gap | `7px` | `7px` | .b3-tok · b3/board.css:1427 |
| row-gap | `7px` | `7px` | .b3-tok · b3/board.css:1427 |
| align-items | `center` | `center` | .b3-tok · b3/board.css:1427 |
| height | `30px` | `30px` | .b3-tok · b3/board.css:1427 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `0 11px` | `` | .b3-tok · b3/board.css:1427 |
| padding-top | `0px` | `0px` | .b3-tok · b3/board.css:1427 |
| padding-right | `11px` | `11px` | .b3-tok · b3/board.css:1427 |
| padding-bottom | `0px` | `0px` | .b3-tok · b3/board.css:1427 |
| padding-left | `11px` | `11px` | .b3-tok · b3/board.css:1427 |
| border-radius | `var(--rad-2)` | `` | .b3-tok · b3/board.css:1427 |
| background | `var(--raised)` | `` | .b3-tok.weap · b3/board.css:1431 |
| background-color | `` | `rgb(31, 39, 46)` | .b3-tok.weap · b3/board.css:1431 |
| background-image | `` | `none` | .b3-tok.weap · b3/board.css:1431 |
| box-shadow | `var(--b3-ring)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .b3-tok.weap · b3/board.css:1431 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .b3-tok · b3/board.css:1427 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-tok · b3/board.css:1427 |
| font-size | `` | `12px` | .b3-tok · b3/board.css:1427 |
| font-weight | `` | `600` | .b3-tok · b3/board.css:1427 |
| font-style | `` | `normal` | .b3-tok · b3/board.css:1427 |
| font-variant-numeric | `` | `normal` | .b3-tok · b3/board.css:1427 |
| line-height | `` | `12px` | .b3-tok · b3/board.css:1427 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-compose · b3/board.css:1424 |
| white-space | `nowrap` | `` | .b3-tok · b3/board.css:1427 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .b3-tok.weap · b3/board.css:1431 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-compose · b3/board.css:1424 |


### `i`

inside `.b3-tok` · 5 on screen · **4 looks**

#### look 1 of 4

`P7metacx9-13` · rendered **8×8** · 1 instance look like this

```html
<i></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| width | `8px` | `8px` | .b3-tok.weap i · b3/board.css:1432 |
| height | `8px` | `8px` | .b3-tok.weap i · b3/board.css:1432 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border-radius | `2px` | `` | .b3-tok.weap i · b3/board.css:1432 |
| background | `var(--c)` | `` | .b3-tok.weap i · b3/board.css:1432 |
| background-color | `` | `rgb(255, 210, 63)` | .b3-tok.weap i · b3/board.css:1432 |
| background-image | `` | `none` | .b3-tok.weap i · b3/board.css:1432 |
| font | ↑ `600 var(--t-sm)/1 var(--ui)` | `` | inherited · .b3-tok · b3/board.css:1427 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .b3-tok · b3/board.css:1427 |
| font-size | ↑ `` | `12px` | inherited · .b3-tok · b3/board.css:1427 |
| font-weight | ↑ `` | `600` | inherited · .b3-tok · b3/board.css:1427 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-tok · b3/board.css:1427 |
| line-height | ↑ `` | `12px` | inherited · .b3-tok · b3/board.css:1427 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-compose · b3/board.css:1424 |
| white-space | ↑ `nowrap` | `` | inherited · .b3-tok · b3/board.css:1427 |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · .b3-tok.weap · b3/board.css:1431 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-compose · b3/board.css:1424 |

#### look 2 of 4

`P7metacx9-21` · rendered **30×30** · 2 instances look like this

```html
<i>⟨svg.ic⟩</i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-cmdr > i · b3/board.css:1412 |
| align-items | `center` | `center` | .b3-cmdr > i · b3/board.css:1412 |
| place-items | `center` | `` | .b3-cmdr > i · b3/board.css:1412 |
| width | `30px` | `30px` | .b3-cmdr > i · b3/board.css:1412 |
| height | `30px` | `30px` | .b3-cmdr > i · b3/board.css:1412 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border-radius | `var(--rad-box)` | `` | .b3-cmdr > i · b3/board.css:1412 |
| background | `color-mix(in srgb,var(--c) 13%,transparent)` | `` | .b3-cmdr > i · b3/board.css:1412 |
| background-color | `` | `color(srgb 0.937255 0.266667 0.266667 / 0.13)` | .b3-cmdr > i · b3/board.css:1412 |
| background-image | `` | `none` | .b3-cmdr > i · b3/board.css:1412 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · app.css:621 |
| font-size | ↑ `inherit` | `13px` | inherited · button · app.css:621 |
| font-weight | ↑ `inherit` | `400` | inherited · button · app.css:621 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `19.5px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-cmdr · b3/board.css:1410 |
| color | `var(--c)` | `rgb(239, 68, 68)` | .b3-cmdr > i · b3/board.css:1412 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-cmdr · b3/board.css:1410 |

#### look 3 of 4

`P7metacx9-38` · rendered **30×30** · 1 instance look like this

```html
<i>⟨svg.ic⟩</i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-cmdr > i · b3/board.css:1412 |
| align-items | `center` | `center` | .b3-cmdr > i · b3/board.css:1412 |
| place-items | `center` | `` | .b3-cmdr > i · b3/board.css:1412 |
| width | `30px` | `30px` | .b3-cmdr > i · b3/board.css:1412 |
| height | `30px` | `30px` | .b3-cmdr > i · b3/board.css:1412 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border-radius | `var(--rad-box)` | `` | .b3-cmdr > i · b3/board.css:1412 |
| background | `color-mix(in srgb,var(--c) 13%,transparent)` | `` | .b3-cmdr > i · b3/board.css:1412 |
| background-color | `` | `color(srgb 0.219608 0.839216 0.941176 / 0.13)` | .b3-cmdr > i · b3/board.css:1412 |
| background-image | `` | `none` | .b3-cmdr > i · b3/board.css:1412 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · app.css:621 |
| font-size | ↑ `inherit` | `13px` | inherited · button · app.css:621 |
| font-weight | ↑ `inherit` | `400` | inherited · button · app.css:621 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `19.5px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-cmdr · b3/board.css:1410 |
| color | `var(--c)` | `rgb(56, 214, 240)` | .b3-cmdr > i · b3/board.css:1412 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-cmdr · b3/board.css:1410 |

#### look 4 of 4

`P7metacx9-45` · rendered **30×30** · 1 instance look like this

```html
<i>⟨svg.ic⟩</i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-cmdr > i · b3/board.css:1412 |
| align-items | `center` | `center` | .b3-cmdr > i · b3/board.css:1412 |
| place-items | `center` | `` | .b3-cmdr > i · b3/board.css:1412 |
| width | `30px` | `30px` | .b3-cmdr > i · b3/board.css:1412 |
| height | `30px` | `30px` | .b3-cmdr > i · b3/board.css:1412 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border-radius | `var(--rad-box)` | `` | .b3-cmdr > i · b3/board.css:1412 |
| background | `color-mix(in srgb,var(--c) 13%,transparent)` | `` | .b3-cmdr > i · b3/board.css:1412 |
| background-color | `` | `color(srgb 1 0.823529 0.247059 / 0.13)` | .b3-cmdr > i · b3/board.css:1412 |
| background-image | `` | `none` | .b3-cmdr > i · b3/board.css:1412 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · app.css:621 |
| font-size | ↑ `inherit` | `13px` | inherited · button · app.css:621 |
| font-weight | ↑ `inherit` | `400` | inherited · button · app.css:621 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `19.5px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-cmdr · b3/board.css:1410 |
| color | `var(--c)` | `rgb(255, 210, 63)` | .b3-cmdr > i · b3/board.css:1412 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-cmdr · b3/board.css:1410 |


### `em`

inside `.b3-tok` · 3 on screen · **2 looks**

#### look 1 of 2

`P7metacx9-14` · rendered **58×12** · 1 instance look like this · text “3 builds”

```html
<em>3 builds</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `500 var(--t-sm)/1 var(--data)` | `` | .b3-tok.weap em · b3/board.css:1433 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .b3-tok.weap em · b3/board.css:1433 |
| font-size | `` | `12px` | .b3-tok.weap em · b3/board.css:1433 |
| font-weight | `` | `500` | .b3-tok.weap em · b3/board.css:1433 |
| font-style | `normal` | `normal` | .b3-tok.weap em · b3/board.css:1433 |
| font-variant-numeric | `` | `normal` | .b3-tok.weap em · b3/board.css:1433 |
| line-height | `` | `12px` | .b3-tok.weap em · b3/board.css:1433 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-compose · b3/board.css:1424 |
| white-space | ↑ `nowrap` | `` | inherited · .b3-tok · b3/board.css:1427 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .b3-tok.weap em · b3/board.css:1433 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-compose · b3/board.css:1424 |

#### look 2 of 2

`P7metacx9-27` · rendered **54×20** · 2 instances look like this · text “Armory”

```html
<em>Armory</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `5px 7px` | `` | .b3-cmdr > em · b3/board.css:1419 |
| padding-top | `5px` | `5px` | .b3-cmdr > em · b3/board.css:1419 |
| padding-right | `7px` | `7px` | .b3-cmdr > em · b3/board.css:1419 |
| padding-bottom | `5px` | `5px` | .b3-cmdr > em · b3/board.css:1419 |
| padding-left | `7px` | `7px` | .b3-cmdr > em · b3/board.css:1419 |
| border-radius | `var(--rad-1)` | `` | .b3-cmdr > em · b3/board.css:1419 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--c) 40%,transparent)` | `color(srgb 0.937255 0.266667 0.266667 / 0.4) 0px 0px 0px 1px inset` | .b3-cmdr > em · b3/board.css:1419 |
| font | `600 var(--t-micro)/1 var(--data)` | `` | .b3-cmdr > em · b3/board.css:1419 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .b3-cmdr > em · b3/board.css:1419 |
| font-size | `` | `9.5px` | .b3-cmdr > em · b3/board.css:1419 |
| font-weight | `` | `600` | .b3-cmdr > em · b3/board.css:1419 |
| font-style | `normal` | `normal` | .b3-cmdr > em · b3/board.css:1419 |
| font-variant-numeric | `` | `normal` | .b3-cmdr > em · b3/board.css:1419 |
| line-height | `` | `9.5px` | .b3-cmdr > em · b3/board.css:1419 |
| letter-spacing | `var(--b3-tr)` | `1.045px` | .b3-cmdr > em · b3/board.css:1419 |
| text-transform | `uppercase` | `uppercase` | .b3-cmdr > em · b3/board.css:1419 |
| text-align | ↑ `left` | `left` | inherited · .b3-cmdr · b3/board.css:1410 |
| color | `oklch(from var(--c) max(l, .76) c h)` | `oklch(0.76 0.207874 25.3325)` | .b3-sd-gh > small, .b3-sd-w small, .b3-wg-h small, .b3-wr-b small em, .b3-cmdr > em, .pb-g · b3/board.css:2655 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-cmdr · b3/board.css:1410 |


### `span.go`

inside `.b3-compose` · 1 on screen · **1 look**

#### the one look

`P7metacx9-15` · rendered **476×24** · 1 instance look like this

```html
<span class="go"><span>CX-9 is already META — opens its builds …</span><kbd>↵</kbd></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-compose .go · b3/board.css:1435 |
| gap | `12px` | `` | .b3-compose .go · b3/board.css:1435 |
| column-gap | `12px` | `12px` | .b3-compose .go · b3/board.css:1435 |
| row-gap | `12px` | `12px` | .b3-compose .go · b3/board.css:1435 |
| align-items | `center` | `center` | .b3-compose .go · b3/board.css:1435 |
| justify-content | `space-between` | `space-between` | .b3-compose .go · b3/board.css:1435 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `500 var(--t-sm)/1.3 var(--ui)` | `` | .b3-compose .go · b3/board.css:1435 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-compose .go · b3/board.css:1435 |
| font-size | `` | `12px` | .b3-compose .go · b3/board.css:1435 |
| font-weight | `` | `500` | .b3-compose .go · b3/board.css:1435 |
| font-style | `` | `normal` | .b3-compose .go · b3/board.css:1435 |
| font-variant-numeric | `` | `normal` | .b3-compose .go · b3/board.css:1435 |
| line-height | `` | `15.6px` | .b3-compose .go · b3/board.css:1435 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-compose · b3/board.css:1424 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .b3-compose .go · b3/board.css:1435 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-compose · b3/board.css:1424 |


### `span`

inside `.go` · 6 on screen · **2 looks**

#### look 1 of 2

`P7metacx9-16` · rendered **302×16** · 1 instance look like this · text “CX-9 is already META — opens its builds to chang”

```html
<span>CX-9 is already META — opens its builds …</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `500 var(--t-sm)/1.3 var(--ui)` | `` | inherited · .b3-compose .go · b3/board.css:1435 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .b3-compose .go · b3/board.css:1435 |
| font-size | ↑ `` | `12px` | inherited · .b3-compose .go · b3/board.css:1435 |
| font-weight | ↑ `` | `500` | inherited · .b3-compose .go · b3/board.css:1435 |
| font-style | ↑ `` | `normal` | inherited · .b3-compose .go · b3/board.css:1435 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-compose .go · b3/board.css:1435 |
| line-height | ↑ `` | `15.6px` | inherited · .b3-compose .go · b3/board.css:1435 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-compose · b3/board.css:1424 |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .b3-compose .go · b3/board.css:1435 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-compose · b3/board.css:1424 |

#### look 2 of 2

`P7metacx9-52` · rendered **74×12** · 3 instances look like this

```html
<span><kbd>↑</kbd><kbd>↓</kbd>move</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `500 var(--t-xs)/1 var(--ui)` | `` | inherited · .b3-cmdf · b3/board.css:1420 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .b3-cmdf · b3/board.css:1420 |
| font-size | ↑ `` | `10.5px` | inherited · .b3-cmdf · b3/board.css:1420 |
| font-weight | ↑ `` | `500` | inherited · .b3-cmdf · b3/board.css:1420 |
| font-style | ↑ `` | `normal` | inherited · .b3-cmdf · b3/board.css:1420 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-cmdf · b3/board.css:1420 |
| line-height | ↑ `` | `10.5px` | inherited · .b3-cmdf · b3/board.css:1420 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .b3-cmdf · b3/board.css:1420 |


### `div.b3-cmdl`

inside `.b3-cmd` · 1 on screen · **1 look**

#### the one look

`P7metacx9-18` · rendered **520×267** · 1 instance look like this

```html
<div class="b3-cmdl" style="--fo: 0px; --ft: 0px; --fb: 0px;"><p class="b3-cmds">Do</p><button type="button" class="b3-cmdr" role="option" aria-selected="false" style="--c: var(--r-armory);"><i>⟨svg.ic⟩</i><span class="t"><b>Set <mark>badges</mark> on builds</b><small>META, TOXIC and the tier, on the builds …</small></span><em>Armory</em></button><button type="button" class="b3-cmdr" role="option" aria-selected="fals
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| max-height | `min(56vh, 460px)` | `460px` | .b3-cmdl · b3/board.css:1408 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `4px 8px 8px` | `` | .b3-cmdl · b3/board.css:1408 |
| padding-top | `4px` | `4px` | .b3-cmdl · b3/board.css:1408 |
| padding-right | `8px` | `8px` | .b3-cmdl · b3/board.css:1408 |
| padding-bottom | `8px` | `8px` | .b3-cmdl · b3/board.css:1408 |
| padding-left | `8px` | `8px` | .b3-cmdl · b3/board.css:1408 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| overflow | `auto` | `` | .b3-cmdl · b3/board.css:1408 |
| overflow-x | `auto` | `auto` | .b3-cmdl · b3/board.css:1408 |
| overflow-y | `auto` | `auto` | .b3-fady, .b3-sd-rows, .b3-cmdl, .b3dock-list, .b3dock-cur, .b3-sd-chips:has(.b3-sc ~ .b3- · b3/board.css:2360 |
| mask-image | `linear-gradient(to bottom,#000 0,#000 var(--fo,0px),rgb(0 0 0/0) var(--fo,0px),rgb(0 0 0/.3) calc(var(--fo,0px) + var(--ft,0px)*.45),rgb(0 0 0/.78) calc(var(--fo,0px) + var(--ft,0px)*.8),#000 calc(var(--fo,0px) + var(--ft,0px)),#000 calc(100% - var(--fb,0px)),rgb(0 0 0/.78) calc(100% - var(--fb,0px)*.8),rgb(0 0 0/.3) calc(100% - var(--fb,0px)*.45),rgb(0 0 0/0) 100%)` | `linear-gradient(rgb(0, 0, 0) 0px, rgb(0, 0, 0) 0px, rgba(0, 0, 0, 0) 0px, rgba(0, 0, 0, 0.3) 0px, rgba(0, 0, 0, 0.78) 0px, rgb(0, 0, 0) 0px, rgb(0, 0, 0) 100%, rgba(0, 0, 0, 0.78) 100%, rgba(0, 0, 0, 0.3) 100%, rgba(0, 0, 0, 0) 100%)` | .b3-fady, .b3-sd-rows, .b3-cmdl, .b3dock-list, .b3dock-cur, .b3-sd-chips:has(.b3-sc ~ .b3- · b3/board.css:2360 |


### `p.b3-cmds`

inside `.b3-cmdl` · 2 on screen · **1 look**

#### the one look

`P7metacx9-19` · rendered **504×28** · 2 instances look like this · text “Do”

```html
<p class="b3-cmds">Do</p>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | p · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `12px 10px 6px` | `` | .b3-cmds · b3/board.css:1409 |
| padding-top | `12px` | `12px` | .b3-cmds · b3/board.css:1409 |
| padding-right | `10px` | `10px` | .b3-cmds · b3/board.css:1409 |
| padding-bottom | `6px` | `6px` | .b3-cmds · b3/board.css:1409 |
| padding-left | `10px` | `10px` | .b3-cmds · b3/board.css:1409 |
| margin | `0` | `` | .b3-cmds · b3/board.css:1409 |
| margin-top | `0px` | `0px` | .b3-cmds · b3/board.css:1409 |
| margin-right | `0px` | `0px` | .b3-cmds · b3/board.css:1409 |
| margin-bottom | `0px` | `0px` | .b3-cmds · b3/board.css:1409 |
| margin-left | `0px` | `0px` | .b3-cmds · b3/board.css:1409 |
| font | `600 var(--t-micro)/1 var(--data)` | `` | .b3-cmds · b3/board.css:1409 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .b3-cmds · b3/board.css:1409 |
| font-size | `` | `9.5px` | .b3-cmds · b3/board.css:1409 |
| font-weight | `` | `600` | .b3-cmds · b3/board.css:1409 |
| font-style | `` | `normal` | .b3-cmds · b3/board.css:1409 |
| font-variant-numeric | `` | `normal` | .b3-cmds · b3/board.css:1409 |
| line-height | `` | `9.5px` | .b3-cmds · b3/board.css:1409 |
| letter-spacing | `var(--b3-tr-wide)` | `1.33px` | .b3-cmds · b3/board.css:1409 |
| text-transform | `uppercase` | `uppercase` | .b3-cmds · b3/board.css:1409 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .b3-cmds · b3/board.css:1409 |


### `button.b3-cmdr[role=option]`

inside `.b3-cmdl` · 4 on screen · **1 look**

#### the one look

`P7metacx9-20` · rendered **504×50** · 4 instances look like this · aria-selected="false" role="option" type="button"

```html
<button type="button" class="b3-cmdr" role="option" aria-selected="false" style="--c: var(--r-armory);"><i>⟨svg.ic⟩</i><span class="t"><b>Set <mark>badges</mark> on builds</b><small>META, TOXIC and the tier, on the builds …</small></span><em>Armory</em></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-cmdr · b3/board.css:1410 |
| grid-template-columns | `30px minmax(0px, 1fr) auto` | `30px 375.516px 54.4844px` | .b3-cmdr · b3/board.css:1410 |
| gap | `12px` | `` | .b3-cmdr · b3/board.css:1410 |
| column-gap | `12px` | `12px` | .b3-cmdr · b3/board.css:1410 |
| row-gap | `12px` | `12px` | .b3-cmdr · b3/board.css:1410 |
| align-items | `center` | `center` | .b3-cmdr · b3/board.css:1410 |
| width | ⚠️ `100%` | `504px` | .b3-cmdr · b3/board.css:1410 · **overridden — see computed** |
| min-height | `50px` | `50px` | .b3-cmdr · b3/board.css:1410 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `0 10px` | `` | .b3-cmdr · b3/board.css:1410 |
| padding-top | `0px` | `0px` | .b3-cmdr · b3/board.css:1410 |
| padding-right | `10px` | `10px` | .b3-cmdr · b3/board.css:1410 |
| padding-bottom | `0px` | `0px` | .b3-cmdr · b3/board.css:1410 |
| padding-left | `10px` | `10px` | .b3-cmdr · b3/board.css:1410 |
| border | `0` | `` | .b3-cmdr · b3/board.css:1410 |
| border-radius | `var(--rad-box)` | `` | .b3-cmdr · b3/board.css:1410 |
| background | `none` | `` | .b3-cmdr · b3/board.css:1410 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .b3-cmdr · b3/board.css:1410 |
| background-image | `none` | `none` | .b3-cmdr · b3/board.css:1410 |
| font | `inherit` | `` | button · app.css:621 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · app.css:621 |
| font-size | `inherit` | `13px` | button · app.css:621 |
| font-weight | `inherit` | `400` | button · app.css:621 |
| font-style | `inherit` | `normal` | button · app.css:621 |
| font-variant-numeric | `inherit` | `normal` | button · app.css:621 |
| line-height | `inherit` | `19.5px` | button · app.css:621 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `left` | `left` | .b3-cmdr · b3/board.css:1410 |
| color | `inherit` | `rgb(232, 237, 241)` | button · app.css:621 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · app.css:5549 |
| cursor | `pointer` | `pointer` | .b3-cmdr · b3/board.css:1410 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(1, 0, 0, 1, 0, 0)` |


### `span.t`

inside `.b3-cmdr` · 4 on screen · **1 look**

#### the one look

`P7metacx9-23` · rendered **376×34** · 4 instances look like this

```html
<span class="t"><b>Set <mark>badges</mark> on builds</b><small>META, TOXIC and the tier, on the builds …</small></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-cmdr .t · b3/board.css:1414 |
| gap | `4px` | `` | .b3-cmdr .t · b3/board.css:1414 |
| column-gap | `4px` | `4px` | .b3-cmdr .t · b3/board.css:1414 |
| row-gap | `4px` | `4px` | .b3-cmdr .t · b3/board.css:1414 |
| min-width | `0px` | `0px` | .b3-cmdr .t · b3/board.css:1414 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · app.css:621 |
| font-size | ↑ `inherit` | `13px` | inherited · button · app.css:621 |
| font-weight | ↑ `inherit` | `400` | inherited · button · app.css:621 |
| font-style | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `19.5px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-cmdr · b3/board.css:1410 |
| color | ↑ `inherit` | `rgb(232, 237, 241)` | inherited · button · app.css:621 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-cmdr · b3/board.css:1410 |


### `b`

inside `.t` · 4 on screen · **1 look**

#### the one look

`P7metacx9-24` · rendered **376×16** · 4 instances look like this

```html
<b>Set <mark>badges</mark> on builds</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `600 var(--t-base)/1.2 var(--ui)` | `` | .b3-cmdr .t b · b3/board.css:1415 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-cmdr .t b · b3/board.css:1415 |
| font-size | `` | `13px` | .b3-cmdr .t b · b3/board.css:1415 |
| font-weight | `` | `600` | .b3-cmdr .t b · b3/board.css:1415 |
| font-style | `` | `normal` | .b3-cmdr .t b · b3/board.css:1415 |
| font-variant-numeric | `` | `normal` | .b3-cmdr .t b · b3/board.css:1415 |
| line-height | `` | `15.6px` | .b3-cmdr .t b · b3/board.css:1415 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-cmdr · b3/board.css:1410 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .b3-cmdr .t b · b3/board.css:1415 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-cmdr · b3/board.css:1410 |


### `mark`

inside `.—` · 2 on screen · **2 looks**

#### look 1 of 2

`P7metacx9-25` · rendered **47×17** · 1 instance look like this · text “badges”

```html
<mark>badges</mark>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `inline` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| background | `none` | `` | .b3-cmdr mark · b3/board.css:1417 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .b3-cmdr mark · b3/board.css:1417 |
| background-image | `none` | `none` | .b3-cmdr mark · b3/board.css:1417 |
| font | ↑ `600 var(--t-base)/1.2 var(--ui)` | `` | inherited · .b3-cmdr .t b · b3/board.css:1415 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .b3-cmdr .t b · b3/board.css:1415 |
| font-size | ↑ `` | `13px` | inherited · .b3-cmdr .t b · b3/board.css:1415 |
| font-weight | ↑ `` | `600` | inherited · .b3-cmdr .t b · b3/board.css:1415 |
| font-style | ↑ `` | `normal` | inherited · .b3-cmdr .t b · b3/board.css:1415 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-cmdr .t b · b3/board.css:1415 |
| line-height | ↑ `` | `15.6px` | inherited · .b3-cmdr .t b · b3/board.css:1415 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-cmdr · b3/board.css:1410 |
| text-decoration | `underline` | `` | .b3-cmdr mark · b3/board.css:1417 |
| color | `var(--c)` | `rgb(239, 68, 68)` | .b3-cmdr mark · b3/board.css:1417 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-cmdr · b3/board.css:1410 |

#### look 2 of 2

`P7metacx9-34` · rendered **37×16** · 1 instance look like this · text “badge”

```html
<mark>badge</mark>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `inline` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| background | `none` | `` | .b3-cmdr mark · b3/board.css:1417 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .b3-cmdr mark · b3/board.css:1417 |
| background-image | `none` | `none` | .b3-cmdr mark · b3/board.css:1417 |
| font | ↑ `500 var(--t-sm)/1.2 var(--ui)` | `` | inherited · .b3-cmdr .t small · b3/board.css:1416 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .b3-cmdr .t small · b3/board.css:1416 |
| font-size | ↑ `` | `12px` | inherited · .b3-cmdr .t small · b3/board.css:1416 |
| font-weight | ↑ `` | `500` | inherited · .b3-cmdr .t small · b3/board.css:1416 |
| font-style | ↑ `` | `normal` | inherited · .b3-cmdr .t small · b3/board.css:1416 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-cmdr .t small · b3/board.css:1416 |
| line-height | ↑ `` | `14.4px` | inherited · .b3-cmdr .t small · b3/board.css:1416 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-cmdr · b3/board.css:1410 |
| text-decoration | `underline` | `` | .b3-cmdr mark · b3/board.css:1417 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .b3-cmdr small mark · b3/board.css:1418 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-cmdr · b3/board.css:1410 |


### `small`

inside `.t` · 4 on screen · **1 look**

#### the one look

`P7metacx9-26` · rendered **376×14** · 4 instances look like this · text “META, TOXIC and the tier, on the builds you pick”

```html
<small>META, TOXIC and the tier, on the builds …</small>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `500 var(--t-sm)/1.2 var(--ui)` | `` | .b3-cmdr .t small · b3/board.css:1416 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-cmdr .t small · b3/board.css:1416 |
| font-size | `` | `12px` | .b3-cmdr .t small · b3/board.css:1416 |
| font-weight | `` | `500` | .b3-cmdr .t small · b3/board.css:1416 |
| font-style | `` | `normal` | .b3-cmdr .t small · b3/board.css:1416 |
| font-variant-numeric | `` | `normal` | .b3-cmdr .t small · b3/board.css:1416 |
| line-height | `` | `14.4px` | .b3-cmdr .t small · b3/board.css:1416 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .b3-cmdr · b3/board.css:1410 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .b3-cmdr .t small · b3/board.css:1416 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-cmdr · b3/board.css:1410 |


### `div.b3-cmdf`

inside `.b3-cmd` · 1 on screen · **1 look**

#### the one look

`P7metacx9-51` · rendered **520×33** · 1 instance look like this

```html
<div class="b3-cmdf"><span><kbd>↑</kbd><kbd>↓</kbd>move</span><span><kbd>↵</kbd>open</span><span><kbd>esc</kbd>close</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-cmdf · b3/board.css:1420 |
| gap | `14px` | `` | .b3-cmdf · b3/board.css:1420 |
| column-gap | `14px` | `14px` | .b3-cmdf · b3/board.css:1420 |
| row-gap | `14px` | `14px` | .b3-cmdf · b3/board.css:1420 |
| align-items | `center` | `center` | .b3-cmdf · b3/board.css:1420 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `10px 16px` | `` | .b3-cmdf · b3/board.css:1420 |
| padding-top | `10px` | `10px` | .b3-cmdf · b3/board.css:1420 |
| padding-right | `16px` | `16px` | .b3-cmdf · b3/board.css:1420 |
| padding-bottom | `10px` | `10px` | .b3-cmdf · b3/board.css:1420 |
| padding-left | `16px` | `16px` | .b3-cmdf · b3/board.css:1420 |
| border-top | `1px solid var(--rule)` | `` | .b3-cmdf · b3/board.css:1420 |
| font | `500 var(--t-xs)/1 var(--ui)` | `` | .b3-cmdf · b3/board.css:1420 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-cmdf · b3/board.css:1420 |
| font-size | `` | `10.5px` | .b3-cmdf · b3/board.css:1420 |
| font-weight | `` | `500` | .b3-cmdf · b3/board.css:1420 |
| font-style | `` | `normal` | .b3-cmdf · b3/board.css:1420 |
| font-variant-numeric | `` | `normal` | .b3-cmdf · b3/board.css:1420 |
| line-height | `` | `10.5px` | .b3-cmdf · b3/board.css:1420 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .b3-cmdf · b3/board.css:1420 |


### P7 · typed “badge” — an action word — Do · Find · Go

18 distinct signatures on screen; 3 not already specced above.


### `div.b3-cmd[role=listbox]`

inside `.cmdbar` · 1 on screen · **1 look**

#### the one look

`P7badge-5` · rendered **520×250** · 1 instance look like this · aria-label="Results" role="listbox"

```html
<div class="b3-cmd" role="listbox" id="b3cmdList" aria-label="Results"><div class="b3-cmdl" style="--fo: 0px; --ft: 0px; --fb: 0px;"><p class="b3-cmds">Do</p><button type="button" class="b3-cmdr on" role="option" aria-selected="true" style="--c: var(--r-armory);"><i>⟨svg.ic⟩</i><span class="t"><b>Set <mark>badges</mark> on builds</b><small>META, TOXIC and the tier, on the builds …</small></span><em>Armory</em></butto
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `absolute` | `absolute` | .b3-cmd · b3/board.css:1406 |
| min-width | `520px` | `520px` | .b3-cmd · b3/board.css:1406 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| top | `calc(100% + 8px)` | `40px` | .b3-cmd · b3/board.css:1406 |
| right | `-1px` | `-1px` | .b3-cmd · b3/board.css:1406 |
| left | `-1px` | `-1px` | .b3-cmd · b3/board.css:1406 |
| border-radius | `var(--rad-3)` | `` | .b3-cmd · b3/board.css:1406 |
| background | `var(--raised)` | `` | .b3-cmd · b3/board.css:1406 |
| background-color | `` | `rgb(31, 39, 46)` | .b3-cmd · b3/board.css:1406 |
| background-image | `` | `none` | .b3-cmd · b3/board.css:1406 |
| box-shadow | `var(--b3-ring),0 28px 60px -20px var(--scrim-90)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.9) 0px 28px 60px -20px` | .b3-cmd · b3/board.css:1406 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| overflow | `hidden` | `` | .b3-cmd · b3/board.css:1406 |
| overflow-x | `hidden` | `hidden` | .b3-cmd · b3/board.css:1406 |
| overflow-y | `hidden` | `hidden` | .b3-cmd · b3/board.css:1406 |
| animation | `b3pop .14s var(--ease) both` | `` | .b3-cmd · b3/board.css:1406 |
| z-index | `70` | `70` | .b3-cmd · b3/board.css:1406 |


### `div.b3-cmdl`

inside `.b3-cmd` · 1 on screen · **1 look**

#### the one look

`P7badge-6` · rendered **520×217** · 1 instance look like this

```html
<div class="b3-cmdl" style="--fo: 0px; --ft: 0px; --fb: 0px;"><p class="b3-cmds">Do</p><button type="button" class="b3-cmdr on" role="option" aria-selected="true" style="--c: var(--r-armory);"><i>⟨svg.ic⟩</i><span class="t"><b>Set <mark>badges</mark> on builds</b><small>META, TOXIC and the tier, on the builds …</small></span><em>Armory</em></button><button type="button" class="b3-cmdr" role="option" aria-selected="fa
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| max-height | `min(56vh, 460px)` | `460px` | .b3-cmdl · b3/board.css:1408 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `4px 8px 8px` | `` | .b3-cmdl · b3/board.css:1408 |
| padding-top | `4px` | `4px` | .b3-cmdl · b3/board.css:1408 |
| padding-right | `8px` | `8px` | .b3-cmdl · b3/board.css:1408 |
| padding-bottom | `8px` | `8px` | .b3-cmdl · b3/board.css:1408 |
| padding-left | `8px` | `8px` | .b3-cmdl · b3/board.css:1408 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| overflow | `auto` | `` | .b3-cmdl · b3/board.css:1408 |
| overflow-x | `auto` | `auto` | .b3-cmdl · b3/board.css:1408 |
| overflow-y | `auto` | `auto` | .b3-fady, .b3-sd-rows, .b3-cmdl, .b3dock-list, .b3dock-cur, .b3-sd-chips:has(.b3-sc ~ .b3- · b3/board.css:2360 |
| mask-image | `linear-gradient(to bottom,#000 0,#000 var(--fo,0px),rgb(0 0 0/0) var(--fo,0px),rgb(0 0 0/.3) calc(var(--fo,0px) + var(--ft,0px)*.45),rgb(0 0 0/.78) calc(var(--fo,0px) + var(--ft,0px)*.8),#000 calc(var(--fo,0px) + var(--ft,0px)),#000 calc(100% - var(--fb,0px)),rgb(0 0 0/.78) calc(100% - var(--fb,0px)*.8),rgb(0 0 0/.3) calc(100% - var(--fb,0px)*.45),rgb(0 0 0/0) 100%)` | `linear-gradient(rgb(0, 0, 0) 0px, rgb(0, 0, 0) 0px, rgba(0, 0, 0, 0) 0px, rgba(0, 0, 0, 0.3) 0px, rgba(0, 0, 0, 0.78) 0px, rgb(0, 0, 0) 0px, rgb(0, 0, 0) 100%, rgba(0, 0, 0, 0.78) 100%, rgba(0, 0, 0, 0.3) 100%, rgba(0, 0, 0, 0) 100%)` | .b3-fady, .b3-sd-rows, .b3-cmdl, .b3dock-list, .b3dock-cur, .b3-sd-chips:has(.b3-sc ~ .b3- · b3/board.css:2360 |


### `button.b3-cmdr.on[role=option]`

inside `.b3-cmdl` · 1 on screen · **1 look**

#### the one look

`P7badge-8` · rendered **504×50** · 1 instance look like this · aria-selected="true" role="option" type="button"

```html
<button type="button" class="b3-cmdr on" role="option" aria-selected="true" style="--c: var(--r-armory);"><i>⟨svg.ic⟩</i><span class="t"><b>Set <mark>badges</mark> on builds</b><small>META, TOXIC and the tier, on the builds …</small></span><em>Armory</em></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-cmdr · b3/board.css:1410 |
| grid-template-columns | `30px minmax(0px, 1fr) auto` | `30px 375.516px 54.4844px` | .b3-cmdr · b3/board.css:1410 |
| gap | `12px` | `` | .b3-cmdr · b3/board.css:1410 |
| column-gap | `12px` | `12px` | .b3-cmdr · b3/board.css:1410 |
| row-gap | `12px` | `12px` | .b3-cmdr · b3/board.css:1410 |
| align-items | `center` | `center` | .b3-cmdr · b3/board.css:1410 |
| width | ⚠️ `100%` | `504px` | .b3-cmdr · b3/board.css:1410 · **overridden — see computed** |
| min-height | `50px` | `50px` | .b3-cmdr · b3/board.css:1410 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `0 10px` | `` | .b3-cmdr · b3/board.css:1410 |
| padding-top | `0px` | `0px` | .b3-cmdr · b3/board.css:1410 |
| padding-right | `10px` | `10px` | .b3-cmdr · b3/board.css:1410 |
| padding-bottom | `0px` | `0px` | .b3-cmdr · b3/board.css:1410 |
| padding-left | `10px` | `10px` | .b3-cmdr · b3/board.css:1410 |
| border | `0` | `` | .b3-cmdr · b3/board.css:1410 |
| border-radius | `var(--rad-box)` | `` | .b3-cmdr · b3/board.css:1410 |
| background | `var(--hi)` | `` | .b3-cmdr.on · b3/board.css:1411 |
| background-color | `` | `rgb(35, 44, 52)` | .b3-cmdr.on · b3/board.css:1411 |
| background-image | `` | `none` | .b3-cmdr.on · b3/board.css:1411 |
| box-shadow | `inset 2px 0 0 var(--c)` | `rgb(239, 68, 68) 2px 0px 0px 0px inset` | .b3-cmdr.on · b3/board.css:1411 |
| font | `inherit` | `` | button · app.css:621 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · app.css:621 |
| font-size | `inherit` | `13px` | button · app.css:621 |
| font-weight | `inherit` | `400` | button · app.css:621 |
| font-style | `inherit` | `normal` | button · app.css:621 |
| font-variant-numeric | `inherit` | `normal` | button · app.css:621 |
| line-height | `inherit` | `19.5px` | button · app.css:621 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `left` | `left` | .b3-cmdr · b3/board.css:1410 |
| color | `inherit` | `rgb(232, 237, 241)` | button · app.css:621 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · app.css:5549 |
| cursor | `pointer` | `pointer` | .b3-cmdr · b3/board.css:1410 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(1, 0, 0, 1, 0, 0)` |


### P7 · typed “zzzz” — nothing matches — the empty state

10 distinct signatures on screen; 4 not already specced above.


### `div.b3-cmd[role=listbox]`

inside `.cmdbar` · 1 on screen · **1 look**

#### the one look

`P7zzzz-5` · rendered **520×117** · 1 instance look like this · aria-label="Results" role="listbox"

```html
<div class="b3-cmd" role="listbox" id="b3cmdList" aria-label="Results"><div class="b3-cmdl" style="--fo: 0px; --ft: 0px; --fb: 0px;"><p class="b3-cmdnone"><b>Nothing named “zzzz”.</b> Try an action (edit, new, badge), a wea…</p></div><div class="b3-cmdf"><span><kbd>↑</kbd><kbd>↓</kbd>move</span><span><kbd>↵</kbd>open</span><span><kbd>esc</kbd>close</span></div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `absolute` | `absolute` | .b3-cmd · b3/board.css:1406 |
| min-width | `520px` | `520px` | .b3-cmd · b3/board.css:1406 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| top | `calc(100% + 8px)` | `40px` | .b3-cmd · b3/board.css:1406 |
| right | `-1px` | `-1px` | .b3-cmd · b3/board.css:1406 |
| left | `-1px` | `-1px` | .b3-cmd · b3/board.css:1406 |
| border-radius | `var(--rad-3)` | `` | .b3-cmd · b3/board.css:1406 |
| background | `var(--raised)` | `` | .b3-cmd · b3/board.css:1406 |
| background-color | `` | `rgb(31, 39, 46)` | .b3-cmd · b3/board.css:1406 |
| background-image | `` | `none` | .b3-cmd · b3/board.css:1406 |
| box-shadow | `var(--b3-ring),0 28px 60px -20px var(--scrim-90)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.9) 0px 28px 60px -20px` | .b3-cmd · b3/board.css:1406 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| overflow | `hidden` | `` | .b3-cmd · b3/board.css:1406 |
| overflow-x | `hidden` | `hidden` | .b3-cmd · b3/board.css:1406 |
| overflow-y | `hidden` | `hidden` | .b3-cmd · b3/board.css:1406 |
| animation | `b3pop .14s var(--ease) both` | `` | .b3-cmd · b3/board.css:1406 |
| z-index | `70` | `70` | .b3-cmd · b3/board.css:1406 |


### `div.b3-cmdl`

inside `.b3-cmd` · 1 on screen · **1 look**

#### the one look

`P7zzzz-6` · rendered **520×84** · 1 instance look like this

```html
<div class="b3-cmdl" style="--fo: 0px; --ft: 0px; --fb: 0px;"><p class="b3-cmdnone"><b>Nothing named “zzzz”.</b> Try an action (edit, new, badge), a wea…</p></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| max-height | `min(56vh, 460px)` | `460px` | .b3-cmdl · b3/board.css:1408 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `4px 8px 8px` | `` | .b3-cmdl · b3/board.css:1408 |
| padding-top | `4px` | `4px` | .b3-cmdl · b3/board.css:1408 |
| padding-right | `8px` | `8px` | .b3-cmdl · b3/board.css:1408 |
| padding-bottom | `8px` | `8px` | .b3-cmdl · b3/board.css:1408 |
| padding-left | `8px` | `8px` | .b3-cmdl · b3/board.css:1408 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| overflow | `auto` | `` | .b3-cmdl · b3/board.css:1408 |
| overflow-x | `auto` | `auto` | .b3-cmdl · b3/board.css:1408 |
| overflow-y | `auto` | `auto` | .b3-fady, .b3-sd-rows, .b3-cmdl, .b3dock-list, .b3dock-cur, .b3-sd-chips:has(.b3-sc ~ .b3- · b3/board.css:2360 |
| mask-image | `linear-gradient(to bottom,#000 0,#000 var(--fo,0px),rgb(0 0 0/0) var(--fo,0px),rgb(0 0 0/.3) calc(var(--fo,0px) + var(--ft,0px)*.45),rgb(0 0 0/.78) calc(var(--fo,0px) + var(--ft,0px)*.8),#000 calc(var(--fo,0px) + var(--ft,0px)),#000 calc(100% - var(--fb,0px)),rgb(0 0 0/.78) calc(100% - var(--fb,0px)*.8),rgb(0 0 0/.3) calc(100% - var(--fb,0px)*.45),rgb(0 0 0/0) 100%)` | `linear-gradient(rgb(0, 0, 0) 0px, rgb(0, 0, 0) 0px, rgba(0, 0, 0, 0) 0px, rgba(0, 0, 0, 0.3) 0px, rgba(0, 0, 0, 0.78) 0px, rgb(0, 0, 0) 0px, rgb(0, 0, 0) 100%, rgba(0, 0, 0, 0.78) 100%, rgba(0, 0, 0, 0.3) 100%, rgba(0, 0, 0, 0) 100%)` | .b3-fady, .b3-sd-rows, .b3-cmdl, .b3dock-list, .b3dock-cur, .b3-sd-chips:has(.b3-sc ~ .b3- · b3/board.css:2360 |


### `p.b3-cmdnone`

inside `.b3-cmdl` · 1 on screen · **1 look**

#### the one look

`P7zzzz-7` · rendered **504×72** · 1 instance look like this

```html
<p class="b3-cmdnone"><b>Nothing named “zzzz”.</b> Try an action (edit, new, badge), a wea…</p>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | p · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `18px 12px` | `` | .b3-cmdnone · b3/board.css:1422 |
| padding-top | `18px` | `18px` | .b3-cmdnone · b3/board.css:1422 |
| padding-right | `12px` | `12px` | .b3-cmdnone · b3/board.css:1422 |
| padding-bottom | `18px` | `18px` | .b3-cmdnone · b3/board.css:1422 |
| padding-left | `12px` | `12px` | .b3-cmdnone · b3/board.css:1422 |
| margin | `0` | `` | .b3-cmdnone · b3/board.css:1422 |
| margin-top | `0px` | `0px` | .b3-cmdnone · b3/board.css:1422 |
| margin-right | `0px` | `0px` | .b3-cmdnone · b3/board.css:1422 |
| margin-bottom | `0px` | `0px` | .b3-cmdnone · b3/board.css:1422 |
| margin-left | `0px` | `0px` | .b3-cmdnone · b3/board.css:1422 |
| font | `500 var(--t-sm)/1.5 var(--ui)` | `` | .b3-cmdnone · b3/board.css:1422 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-cmdnone · b3/board.css:1422 |
| font-size | `` | `12px` | .b3-cmdnone · b3/board.css:1422 |
| font-weight | `` | `500` | .b3-cmdnone · b3/board.css:1422 |
| font-style | `` | `normal` | .b3-cmdnone · b3/board.css:1422 |
| font-variant-numeric | `` | `normal` | .b3-cmdnone · b3/board.css:1422 |
| line-height | `` | `18px` | .b3-cmdnone · b3/board.css:1422 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .b3-cmdnone · b3/board.css:1422 |


### `b`

inside `.b3-cmdnone` · 1 on screen · **1 look**

#### the one look

`P7zzzz-8` · rendered **132×16** · 1 instance look like this · text “Nothing named “zzzz”.”

```html
<b>Nothing named “zzzz”.</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `inline` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `500 var(--t-sm)/1.5 var(--ui)` | `` | inherited · .b3-cmdnone · b3/board.css:1422 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .b3-cmdnone · b3/board.css:1422 |
| font-size | ↑ `` | `12px` | inherited · .b3-cmdnone · b3/board.css:1422 |
| font-weight | `bolder` | `700` | strong, b · user-agent:? |
| font-style | ↑ `` | `normal` | inherited · .b3-cmdnone · b3/board.css:1422 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-cmdnone · b3/board.css:1422 |
| line-height | ↑ `` | `18px` | inherited · .b3-cmdnone · b3/board.css:1422 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .b3-cmdnone b · b3/board.css:1423 |
