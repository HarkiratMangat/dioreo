---
kind: reference
status: live
---

# Board 3-E resolved values · Reachable states

*Part of the generated spec; read `README.md` in this folder first.*

## Reachable states

Each state is reached by the interaction named, then the stage is walked again; only signatures or looks not seen above are specced.


### M3 · the landing's rename field, open

28 distinct signatures on screen; 4 not already specced above.


### `button.x`

inside `.dw-nav` · 1 on screen · **1 look**

#### the one look

`M3e-6` · rendered **28×28** · 1 instance look like this · aria-label="Close"

```html
<button class="x" aria-label="Close">⟨svg.ic.sm⟩<b aria-hidden="true">Close</b></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .dw-h .dw-nav .x · gates.css:812 |
| position | `relative` | `relative` | .dw-h .x · app.css:1383 |
| gap | `0` | `` | .dw-h .dw-nav .x · gates.css:812 |
| column-gap | `0px` | `0px` | .dw-h .dw-nav .x · gates.css:812 |
| row-gap | `0px` | `0px` | .dw-h .dw-nav .x · gates.css:812 |
| flex | `none` | `` | .dw-h .x · app.css:1383 |
| align-items | `center` | `center` | .dw-h .dw-nav .x · gates.css:812 |
| justify-content | `center` | `center` | .dw-h .dw-nav .x · gates.css:812 |
| width | `auto` | `28px` | .dw-h .dw-nav .x · gates.css:812 |
| min-width | `28px` | `28px` | .dw-h .dw-nav .x · gates.css:812 |
| height | `28px` | `28px` | .drawer .x · app.css:1398 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · app.css:388 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `0 6px` | `` | .dw-h .dw-nav .x · gates.css:812 |
| padding-top | `0px` | `0px` | .dw-h .dw-nav .x · gates.css:812 |
| padding-right | `6px` | `6px` | .dw-h .dw-nav .x · gates.css:812 |
| padding-bottom | `0px` | `0px` | .dw-h .dw-nav .x · gates.css:812 |
| padding-left | `6px` | `6px` | .dw-h .dw-nav .x · gates.css:812 |
| margin-left | `0px` | `0px` | .dw-h .dw-nav .x · gates.css:812 |
| border | `1px solid var(--rule2)` | `` | .drawer .x · app.css:1398 |
| border-radius | `var(--rad-2)` | `` | .drawer .x · app.css:1398 |
| background | `none` | `` | .drawer .x · app.css:1398 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .drawer .x · app.css:1398 |
| background-image | `none` | `none` | .drawer .x · app.css:1398 |
| font | `inherit` | `` | button · app.css:621 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · app.css:621 |
| font-size | `var(--t-sm)` | `12px` | .dw-h .x · app.css:1383 |
| font-weight | `inherit` | `400` | button · app.css:621 |
| font-style | `inherit` | `normal` | button · app.css:621 |
| font-variant-numeric | `inherit` | `normal` | button · app.css:621 |
| line-height | `inherit` | `18px` | button · app.css:621 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .drawer .x · app.css:1398 |
| transition | `gap 360ms cubic-bezier(.4,0,.2,1),padding 360ms cubic-bezier(.4,0,.2,1),color 200ms ease,background 200ms ease,border-color 200ms ease` | `` | .dw-h .dw-nav .x · gates.css:812 |
| cursor | `pointer` | `pointer` | .dw-h .x · app.css:1383 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .dw-h .x::after · app.css:1385 |
| inset | `-8px` | .dw-h .x::after · app.css:1385 |
| top | `-8px` | .dw-h .x::after · app.css:1385 |
| right | `-8px` | .dw-h .x::after · app.css:1385 |
| bottom | `-8px` | .dw-h .x::after · app.css:1385 |
| left | `-8px` | .dw-h .x::after · app.css:1385 |
| border-radius | `inherit` | .dw-h .x::after · app.css:1385 |
| content | `""` | .dw-h .x::after · app.css:1385 |

**:hover** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| column-gap | `0px` | `0.664278px` |
| row-gap | `0px` | `0.664278px` |
| width | `28px` | `29.9062px` |
| padding-right | `6px` | `6.44285px` |
| padding-left | `6px` | `6.11071px` |
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `b`

inside `.x` · 4 on screen · **1 look**

#### the one look

`M3e-8` · rendered **0×12** · 1 instance look like this · text “Close” · aria-hidden="true"

```html
<b aria-hidden="true">Close</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .dw-h .dw-nav .x > b · gates.css:814 |
| max-width | `0px` | `0px` | .dw-h .dw-nav .x > b · gates.css:814 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `600 12px/1 var(--ui)` | `` | .dw-h .dw-nav .x > b · gates.css:814 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .dw-h .dw-nav .x > b · gates.css:814 |
| font-size | `` | `12px` | .dw-h .dw-nav .x > b · gates.css:814 |
| font-weight | `` | `600` | .dw-h .dw-nav .x > b · gates.css:814 |
| font-style | `` | `normal` | .dw-h .dw-nav .x > b · gates.css:814 |
| font-variant-numeric | `` | `normal` | .dw-h .dw-nav .x > b · gates.css:814 |
| line-height | `` | `12px` | .dw-h .dw-nav .x > b · gates.css:814 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | `nowrap` | `` | .dw-h .dw-nav .x > b · gates.css:814 |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .drawer .x · app.css:1398 |
| opacity | `0` | `0` | .dw-h .dw-nav .x > b · gates.css:814 |
| overflow | `hidden` | `` | .dw-h .dw-nav .x > b · gates.css:814 |
| overflow-x | `hidden` | `hidden` | .dw-h .dw-nav .x > b · gates.css:814 |
| overflow-y | `hidden` | `hidden` | .dw-h .dw-nav .x > b · gates.css:814 |
| transform | `translateX(-3px)` | `matrix(1, 0, 0, 1, -3, 0)` | .dw-h .dw-nav .x > b · gates.css:814 |
| transition | `max-width 360ms cubic-bezier(.4,0,.2,1),opacity 240ms ease 60ms,transform 360ms cubic-bezier(.4,0,.2,1)` | `` | .dw-h .dw-nav .x > b · gates.css:814 |
| cursor | ↑ `pointer` | `pointer` | inherited · .dw-h .x · app.css:1383 |


### `label.b3-xf-fn.editing`

inside `.b3-xf-fid` · 1 on screen · **1 look**

#### the one look

`M3e-23` · rendered **209×24** · 1 instance look like this

```html
<label class="b3-xf-fn editing"><input type="text" spellcheck="true" aria-label="File name for MP builds"><span class="b3-xf-ext" aria-hidden="true">.txt</span></label>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| grid-column | `2` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3800 |
| grid-row | `1` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3800 |
| gap | `0` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn · b3/board.css:3662 |
| column-gap | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fn · b3/board.css:3662 |
| row-gap | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fn · b3/board.css:3662 |
| flex | `0 0 auto` | `` | .exs-i .b3-xf-fn:not(.editing), .exs-i .b3-xf-fn.editing · gates.css:583 |
| align-items | `center` | `center` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| align-self | `start` | `start` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3838 |
| justify-self | `stretch` | `stretch` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3764 |
| width | ⚠️ `100%` | `209.312px` | .exs-i .b3-xf-fn:not(.editing), .exs-i .b3-xf-fn.editing · gates.css:583 · **overridden — see computed** |
| min-width | `0px` | `0px` | .b3-xf-fid .b3-xf-fn · b3/board.css:4580 |
| max-width | `100%` | `100%` | .exs-i .b3-xf-fn:not(.editing), .exs-i .b3-xf-fn.editing · gates.css:583 |
| height | `24px` | `24px` | .exs-i .b3-xf-fn:not(.editing), .exs-i .b3-xf-fn.editing · gates.css:583 |
| min-height | `24px` | `24px` | .exs-i .b3-xf-fn:not(.editing), .exs-i .b3-xf-fn.editing · gates.css:583 |
| box-sizing | `border-box` | `border-box` | .exs-i .b3-xf-fn:not(.editing), .exs-i .b3-xf-fn.editing · gates.css:583 |
| padding | `0 6px` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| padding-top | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| padding-right | `6px` | `6px` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| padding-bottom | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| padding-left | `6px` | `6px` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| margin | `0` | `` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn, :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn.editing · b3/board.css:4579 |
| margin-top | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn, :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn.editing · b3/board.css:4579 |
| margin-right | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn, :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn.editing · b3/board.css:4579 |
| margin-bottom | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn, :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn.editing · b3/board.css:4579 |
| margin-left | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn, :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn.editing · b3/board.css:4579 |
| border | `1px solid color-mix(in srgb,var(--ok) 55%,transparent)` | `` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fid .b3 · b3/board.css:4597 |
| border-radius | `6px` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| outline | `0` | `` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fid .b3 · b3/board.css:4597 |
| outline-offset | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fid .b3 · b3/board.css:4597 |
| background | `color-mix(in srgb,var(--ok) 11%,var(--sunk))` | `` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fid .b3 · b3/board.css:4597 |
| background-color | `` | `color(srgb 0.091451 0.146824 0.105529)` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fid .b3 · b3/board.css:4597 |
| background-image | `` | `none` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fid .b3 · b3/board.css:4597 |
| box-shadow | `inset 0 0 0 1px var(--focus), 0 0 0 3px color-mix(in srgb, var(--ok) 26%, transparent), 0 0 16px -2px color-mix(in srgb, var(--ok) 40%, transparent)` | `rgb(95, 212, 232) 0px 0px 0px 1px inset, color(srgb 0.482353 0.858824 0.388235 / 0.26) 0px 0px 0px 3px, color(srgb 0.482353 0.858824 0.388235 / 0.4) 0px 0px 16px -2px` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn.editing, :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn · gates.css:600 |
| font | `500 var(--t-xs)/1 var(--data)` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| font-size | `` | `10.5px` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| font-weight | `` | `500` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| font-style | `` | `normal` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| font-variant-numeric | `` | `normal` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| line-height | `` | `10.5px` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| letter-spacing | — | `normal` | initial |
| text-overflow | `ellipsis` | `ellipsis` | .b3-xf-fn · b3/board.css:3054 |
| white-space | `nowrap` | `` | .b3-xf-fn · b3/board.css:3054 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| overflow | `hidden` | `` | .b3-xf-fid .b3-xf-fn · b3/board.css:4580 |
| overflow-x | `hidden` | `hidden` | .b3-xf-fid .b3-xf-fn · b3/board.css:4580 |
| overflow-y | `hidden` | `hidden` | .b3-xf-fid .b3-xf-fn · b3/board.css:4580 |
| transition | `box-shadow var(--b3-d1) var(--ease), background var(--b3-d1) var(--ease)` | `` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn.editing, :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn · gates.css:600 |
| cursor | `text` | `text` | :is(.b3-xf, .exs-i) .b3-xf-fn · b3/board.css:3662 |

**:hover** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)

**:focus-visible** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)

**:active** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)


### `span.b3-xf-ext`

inside `.b3-xf-fn` · 2 on screen · **1 look**

#### the one look

`M3e-24` · rendered **25×11** · 1 instance look like this · text “.txt” · aria-hidden="true"

```html
<span class="b3-xf-ext" aria-hidden="true">.txt</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `500 var(--t-xs)/1 var(--data)` | `` | inherited · :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| font-size | ↑ `` | `10.5px` | inherited · :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| font-weight | ↑ `` | `500` | inherited · :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| font-style | ↑ `` | `normal` | inherited · :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| font-variant-numeric | ↑ `` | `normal` | inherited · :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| line-height | ↑ `` | `10.5px` | inherited · :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| letter-spacing | — | `normal` | initial |
| white-space | ↑ `nowrap` | `` | inherited · .b3-xf-fn · b3/board.css:3054 |
| color | `var(--ink4)` | `rgb(92, 106, 117)` | .b3-xf-ext · b3/board.css:3665 |
| cursor | ↑ `text` | `text` | inherited · :is(.b3-xf, .exs-i) .b3-xf-fn · b3/board.css:3662 |


### M3 · the picker step

60 distinct signatures on screen; 53 not already specced above.


### `aside.drawer.open.wide[role=dialog]`

inside `.pb-stage` · 1 on screen · **1 look**

#### the one look

`M3p-2` · rendered **1100×746** · 1 instance look like this · aria-label="Pick builds to export" role="dialog"

```html
<aside class="drawer open wide" role="dialog" aria-modal="true" aria-label="Pick builds to export"><header class="dw-h"><div class="dw-ttl"><h2>Pick builds to export</h2></div><div class="dw-nav"><button class="x bk" aria-label="Back">⟨svg.ic.sm⟩<b aria-hidden="true">Back</b></button><button class="x" aria-label="Close">⟨svg.ic.sm⟩<b aria-hidden="true">Close</b></button></div></header><div class="dw-b"><div class="b3
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .drawer · app.css:1361 |
| position | `absolute` | `absolute` | .g-stage .drawer · gates.css:165 |
| flex-direction | `column` | `column` | .drawer · app.css:1361 |
| width | `min(1100px, 100% - 48px)` | `1100px` | .drawer.wide:has(.b3-xt) · b3/board.css:2958 |
| max-width | `none` | `none` | .drawer.wide:has(.b3-xt) · b3/board.css:2958 |
| max-height | `min(84vh, 860px)` | `745.92px` | .drawer · app.css:1361 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| top | ⚠️ `50%` | `450px` | .drawer · app.css:1361 · **overridden — see computed** |
| left | ⚠️ `50%` | `574px` | .drawer · app.css:1361 · **overridden — see computed** |
| border | `1px solid var(--rule2)` | `` | .drawer · app.css:1361 |
| border-radius | `var(--rad-3)` | `` | .drawer · app.css:1361 |
| background | `radial-gradient(78% 210% at -8% 118%,color-mix(in srgb,var(--m1) 15%,transparent) 0,transparent 68%), radial-gradient(66% 190% at 26% -22%,color-mix(in srgb,var(--m3,var(--patch)) 13%,transparent) 0,transparent 66%), radial-gradient(72% 200% at 68% 132%,color-mix(in srgb,var(--m2) 12%,transparent) 0,transparent 70%), radial-gradient(60% 180% at 112% -16%,color-mix(in srgb,var(--m4,var(--r-armory)) 11%,transparent) 0,transparent 68%), radial-gradient(120% 120% at 50% 50%,transparent 38%,#00000055 100%), linear-gradient(180deg,#ffffff0a 0,transparent 26%), color-mix(in srgb,#0B0F12 42%,var(--raised))` | `` | html:is([data-b3-xbg="mesh"], [data-b3-xbg="ground"]) .drawer:has(.b3-xt) · b3/board.css:4214 |
| background-color | `` | `color(srgb 0.0886275 0.113412 0.134275)` | html:is([data-b3-xbg="mesh"], [data-b3-xbg="ground"]) .drawer:has(.b3-xt) · b3/board.css:4214 |
| background-image | `` | `radial-gradient(78% 210% at -8% 118%, color(srgb 1 0.231373 0.360784 / 0.15) 0px, rgba(0, 0, 0, 0) 68%), radial-gradient(66% 190% at 26% -22%, color(srgb 0.94902 0.760784 0.188235 / 0.13) 0px, rgba(0, 0, 0, 0) 66%), radial-gradient(72% 200% at 68% 132%, color(srgb 0.964706 0.662745 0.231373 / 0.12) 0px, rgba(0, 0, 0, 0) 70%), radial-gradient(60% 180% at 112% -16%, color(srgb 0.937255 0.266667 0.266667 / 0.11) 0px, rgba(0, 0, 0, 0) 68%), radial-gradient(120% 120%, rgba(0, 0, 0, 0) 38%, rgba(0, 0, 0, 0.333) 100%), linear-gradient(rgba(255, 255, 255, 0.04) 0px, rgba(0, 0, 0, 0) 26%), none` | html:is([data-b3-xbg="mesh"], [data-b3-xbg="ground"]) .drawer:has(.b3-xt) · b3/board.css:4214 |
| box-shadow | `0 40px 90px -20px var(--scrim-90),0 0 0 1px rgba(255,255,255,.04)` | `rgba(0, 0, 0, 0.9) 0px 40px 90px -20px, rgba(255, 255, 255, 0.04) 0px 0px 0px 1px` | .drawer · app.css:1361 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| opacity | `1` | `1` | .drawer.open · app.css:1366 |
| overflow | `hidden` | `` | .drawer · app.css:1361 |
| overflow-x | `hidden` | `hidden` | .drawer · app.css:1361 |
| overflow-y | `hidden` | `hidden` | .drawer · app.css:1361 |
| transform | `translate(-50%, -50%) scale(1)` | `matrix(1, 0, 0, 1, -550, -372.953)` | .drawer.open · app.css:1366 |
| transition | `opacity .18s,transform .18s cubic-bezier(.2,.8,.3,1)` | `` | .drawer · app.css:1361 |
| z-index | `45` | `45` | .drawer · app.css:1361 |
| pointer-events | `auto` | `auto` | .drawer.open · app.css:1366 |


### `button.bk.x`

inside `.dw-nav` · 1 on screen · **1 look**

#### the one look

`M3p-6` · rendered **28×28** · 1 instance look like this · aria-label="Back"

```html
<button class="x bk" aria-label="Back">⟨svg.ic.sm⟩<b aria-hidden="true">Back</b></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .dw-h .dw-nav .x · gates.css:812 |
| position | `relative` | `relative` | .dw-h .x · app.css:1383 |
| gap | `0` | `` | .dw-h .dw-nav .x · gates.css:812 |
| column-gap | `0px` | `0px` | .dw-h .dw-nav .x · gates.css:812 |
| row-gap | `0px` | `0px` | .dw-h .dw-nav .x · gates.css:812 |
| flex | `none` | `` | .dw-h .x · app.css:1383 |
| align-items | `center` | `center` | .dw-h .dw-nav .x · gates.css:812 |
| justify-content | `center` | `center` | .dw-h .dw-nav .x · gates.css:812 |
| width | `auto` | `28px` | .dw-h .dw-nav .x · gates.css:812 |
| min-width | `28px` | `28px` | .dw-h .dw-nav .x · gates.css:812 |
| height | `28px` | `28px` | .drawer .x · app.css:1398 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · app.css:388 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `0 6px` | `` | .dw-h .dw-nav .x · gates.css:812 |
| padding-top | `0px` | `0px` | .dw-h .dw-nav .x · gates.css:812 |
| padding-right | `6px` | `6px` | .dw-h .dw-nav .x · gates.css:812 |
| padding-bottom | `0px` | `0px` | .dw-h .dw-nav .x · gates.css:812 |
| padding-left | `6px` | `6px` | .dw-h .dw-nav .x · gates.css:812 |
| margin-left | `0px` | `0px` | .dw-h .dw-nav .x · gates.css:812 |
| border | `1px solid var(--rule2)` | `` | .drawer .x · app.css:1398 |
| border-radius | `var(--rad-2)` | `` | .drawer .x · app.css:1398 |
| background | `none` | `` | .drawer .x · app.css:1398 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .drawer .x · app.css:1398 |
| background-image | `none` | `none` | .drawer .x · app.css:1398 |
| font | `inherit` | `` | button · app.css:621 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · app.css:621 |
| font-size | `var(--t-sm)` | `12px` | .dw-h .x · app.css:1383 |
| font-weight | `inherit` | `400` | button · app.css:621 |
| font-style | `inherit` | `normal` | button · app.css:621 |
| font-variant-numeric | `inherit` | `normal` | button · app.css:621 |
| line-height | `inherit` | `18px` | button · app.css:621 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .drawer .x · app.css:1398 |
| transition | `gap 360ms cubic-bezier(.4,0,.2,1),padding 360ms cubic-bezier(.4,0,.2,1),color 200ms ease,background 200ms ease,border-color 200ms ease` | `` | .dw-h .dw-nav .x · gates.css:812 |
| cursor | `pointer` | `pointer` | .dw-h .x · app.css:1383 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .dw-h .x::after · app.css:1385 |
| inset | `-8px` | .dw-h .x::after · app.css:1385 |
| top | `-8px` | .dw-h .x::after · app.css:1385 |
| right | `-8px` | .dw-h .x::after · app.css:1385 |
| bottom | `-8px` | .dw-h .x::after · app.css:1385 |
| left | `-8px` | .dw-h .x::after · app.css:1385 |
| border-radius | `inherit` | .dw-h .x::after · app.css:1385 |
| content | `""` | .dw-h .x::after · app.css:1385 |

**:hover** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| column-gap | `0px` | `0.029794px` |
| row-gap | `0px` | `0.029794px` |
| padding-right | `6px` | `6.01986px` |
| padding-left | `6px` | `6.00497px` |
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `b`

inside `.x` · 212 on screen · **12 looks**

#### look 1 of 12

`M3p-24` · rendered **8×17** · 8 instances look like this · text “0”

```html
<b>0</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `inline` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `500 13px/1 var(--data)` | `` | inherited · .b3-xt-n · b3/board.css:2993 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .b3-xt-n · b3/board.css:2993 |
| font-size | ↑ `` | `13px` | inherited · .b3-xt-n · b3/board.css:2993 |
| font-weight | `600` | `600` | .b3-xt-n b · b3/board.css:2994 |
| font-style | ↑ `` | `normal` | inherited · .b3-xt-n · b3/board.css:2993 |
| font-variant-numeric | ↑ `tabular-nums` | `tabular-nums` | inherited · .b3-xt-n · b3/board.css:2993 |
| line-height | ↑ `` | `13px` | inherited · .b3-xt-n · b3/board.css:2993 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | ↑ `nowrap` | `` | inherited · .b3-xt-n · b3/board.css:2993 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .b3-xt-n b · b3/board.css:2994 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · app.css:621 |

#### look 2 of 12

`M3p-52` · rendered **53×15** · 1 instance look like this · text “Assault”

```html
<b>Assault</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `600 15px/1 var(--ui)` | `` | .b3-xt-sech > b · b3/board.css:2988 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-xt-sech > b · b3/board.css:2988 |
| font-size | `` | `15px` | .b3-xt-sech > b · b3/board.css:2988 |
| font-weight | `` | `600` | .b3-xt-sech > b · b3/board.css:2988 |
| font-style | `` | `normal` | .b3-xt-sech > b · b3/board.css:2988 |
| font-variant-numeric | `` | `normal` | .b3-xt-sech > b · b3/board.css:2988 |
| line-height | `` | `15px` | .b3-xt-sech > b · b3/board.css:2988 |
| letter-spacing | `-0.005em` | `-0.075px` | .b3-xt-sech > b · b3/board.css:2988 |
| color | `color-mix(in srgb,var(--c) 45%,white)` | `color(srgb 1 0.654118 0.712353)` | .b3-xt-sech > b · b3/board.css:2988 |

#### look 3 of 12

`M3p-63` · rendered **39×17** · 68 instances look like this · text “AK117”

```html
<b>AK117</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .b3-xt-wn b · b3/board.css:4408 |
| min-width | `max-content` | `max-content` | .b3-xt-wn b · b3/board.css:4408 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `600 var(--t-md)/1.2 var(--ui)` | `` | .b3-xt-wn b · b3/board.css:3680 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-xt-wn b · b3/board.css:3680 |
| font-size | `` | `14.5px` | .b3-xt-wn b · b3/board.css:3680 |
| font-weight | `` | `600` | .b3-xt-wn b · b3/board.css:3680 |
| font-style | `` | `normal` | .b3-xt-wn b · b3/board.css:3680 |
| font-variant-numeric | `` | `normal` | .b3-xt-wn b · b3/board.css:3680 |
| line-height | `` | `17.4px` | .b3-xt-wn b · b3/board.css:3680 |
| letter-spacing | `-0.005em` | `-0.0725px` | .b3-xt-wn b · b3/board.css:3680 |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `start` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| text-overflow | `clip` | `clip` | .b3-xt-wn b · b3/board.css:4408 |
| white-space | `nowrap` | `` | .b3-xt-wn b · b3/board.css:3005 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .b3-xt-wn b · b3/board.css:3005 |
| overflow | `visible` | `` | .b3-xt-wn b · b3/board.css:4408 |
| overflow-x | `visible` | `visible` | .b3-xt-wn b · b3/board.css:4408 |
| overflow-y | `visible` | `visible` | .b3-xt-wn b · b3/board.css:4408 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xt-wn · b3/board.css:3004 |

#### look 4 of 12

`M3p-66` · rendered **10×13** · 125 instances look like this · text “1”

```html
<b>1</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .b3-xt-c b · b3/board.css:3685 |
| min-width | `10px` | `10px` | .b3-xt-c b · b3/board.css:3685 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `600 var(--t-base)/1 var(--ui)` | `` | .b3-xt-c b · b3/board.css:4196 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-xt-c b · b3/board.css:4196 |
| font-size | `` | `13px` | .b3-xt-c b · b3/board.css:4196 |
| font-weight | `` | `600` | .b3-xt-c b · b3/board.css:4196 |
| font-style | `` | `normal` | .b3-xt-c b · b3/board.css:4196 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .b3-xt-c b · b3/board.css:4196 |
| line-height | `` | `13px` | .b3-xt-c b · b3/board.css:4196 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | .b3-xt-c b · b3/board.css:3685 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .b3-xt-c b · b3/board.css:4196 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xt-c · b3/board.css:3011 |

#### look 5 of 12

`M3p-272` · rendered **32×15** · 1 instance look like this · text “SMG”

```html
<b>SMG</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `600 15px/1 var(--ui)` | `` | .b3-xt-sech > b · b3/board.css:2988 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-xt-sech > b · b3/board.css:2988 |
| font-size | `` | `15px` | .b3-xt-sech > b · b3/board.css:2988 |
| font-weight | `` | `600` | .b3-xt-sech > b · b3/board.css:2988 |
| font-style | `` | `normal` | .b3-xt-sech > b · b3/board.css:2988 |
| font-variant-numeric | `` | `normal` | .b3-xt-sech > b · b3/board.css:2988 |
| line-height | `` | `15px` | .b3-xt-sech > b · b3/board.css:2988 |
| letter-spacing | `-0.005em` | `-0.075px` | .b3-xt-sech > b · b3/board.css:2988 |
| color | `color-mix(in srgb,var(--c) 45%,white)` | `color(srgb 1 0.920588 0.661177)` | .b3-xt-sech > b · b3/board.css:2988 |

#### look 6 of 12

`M3p-450` · rendered **31×15** · 1 instance look like this · text “LMG”

```html
<b>LMG</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `600 15px/1 var(--ui)` | `` | .b3-xt-sech > b · b3/board.css:2988 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-xt-sech > b · b3/board.css:2988 |
| font-size | `` | `15px` | .b3-xt-sech > b · b3/board.css:2988 |
| font-weight | `` | `600` | .b3-xt-sech > b · b3/board.css:2988 |
| font-style | `` | `normal` | .b3-xt-sech > b · b3/board.css:2988 |
| font-variant-numeric | `` | `normal` | .b3-xt-sech > b · b3/board.css:2988 |
| line-height | `` | `15px` | .b3-xt-sech > b · b3/board.css:2988 |
| letter-spacing | `-0.005em` | `-0.075px` | .b3-xt-sech > b · b3/board.css:2988 |
| color | `color-mix(in srgb,var(--c) 45%,white)` | `color(srgb 0.782941 0.715882 0.892353)` | .b3-xt-sech > b · b3/board.css:2988 |

*6 further looks are the same component in other data hues (a per-row `--c` / `--m` / `--sl`); they differ in colour only.*


### `div.dw-b`

inside `.drawer` · 1 on screen · **1 look**

#### the one look

`M3p-12` · rendered **1098×687** · 1 instance look like this

```html
<div class="dw-b"><div class="b3-xt"><section class="b3-xt-cat" aria-label="Builds to pick"><div class="b3-xt-top"><div class="b3-xt-row"><div class="mh-mode b3-xt-mode" role="radiogroup" aria-label="Game mode"><button type="button" role="radio" data-arm="MP" aria-checked="true">MP</button><button type="button" role="radio" data-arm="DMZ" aria-checked="false">DMZ</button></div><span class="srch b3-xt-find">⟨svg⟩<labe
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .drawer.wide:has(.b3-xt) .dw-b · b3/board.css:2959 |
| grid-template-rows | `minmax(0px, 1fr)` | `650.906px` | .drawer.wide:has(.b3-xt) .dw-b · b3/board.css:2959 |
| flex | `1 1 auto` | `` | .dw-b · app.css:1387 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `var(--s4) var(--s5)` | `` | .dw-b · app.css:1387 |
| padding-top | `16px` | `16px` | .drawer.wide:has(.b3-xt) .dw-b · b3/board.css:2959 |
| padding-right | `` | `24px` | .dw-b · app.css:1387 |
| padding-bottom | `20px` | `20px` | .drawer.wide:has(.b3-xt) .dw-b · b3/board.css:2959 |
| padding-left | `` | `24px` | .dw-b · app.css:1387 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| overflow | `hidden` | `` | .drawer.wide:has(.b3-xt) .dw-b · b3/board.css:2959 |
| overflow-x | `hidden` | `hidden` | .drawer.wide:has(.b3-xt) .dw-b · b3/board.css:2959 |
| overflow-y | `hidden` | `hidden` | .drawer.wide:has(.b3-xt) .dw-b · b3/board.css:2959 |


### `div.b3-xt`

inside `.dw-b` · 1 on screen · **1 look**

#### the one look

`M3p-13` · rendered **1050×651** · 1 instance look like this

```html
<div class="b3-xt"><section class="b3-xt-cat" aria-label="Builds to pick"><div class="b3-xt-top"><div class="b3-xt-row"><div class="mh-mode b3-xt-mode" role="radiogroup" aria-label="Game mode"><button type="button" role="radio" data-arm="MP" aria-checked="true">MP</button><button type="button" role="radio" data-arm="DMZ" aria-checked="false">DMZ</button></div><span class="srch b3-xt-find">⟨svg⟩<label class="sr" for="
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt · b3/board.css:2960 |
| grid-template-columns | `minmax(0px, 1fr) minmax(0px, 440px)` | `586px 440px` | .b3-xt · b3/board.css:2960 |
| gap | `24px` | `` | .b3-xt · b3/board.css:2960 |
| column-gap | `24px` | `24px` | .b3-xt · b3/board.css:2960 |
| row-gap | `24px` | `24px` | .b3-xt · b3/board.css:2960 |
| min-height | `0px` | `0px` | .b3-xt · b3/board.css:2960 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `section.b3-xt-cat`

inside `.b3-xt` · 1 on screen · **1 look**

#### the one look

`M3p-14` · rendered **586×651** · 1 instance look like this · aria-label="Builds to pick"

```html
<section class="b3-xt-cat" aria-label="Builds to pick"><div class="b3-xt-top"><div class="b3-xt-row"><div class="mh-mode b3-xt-mode" role="radiogroup" aria-label="Game mode"><button type="button" role="radio" data-arm="MP" aria-checked="true">MP</button><button type="button" role="radio" data-arm="DMZ" aria-checked="false">DMZ</button></div><span class="srch b3-xt-find">⟨svg⟩<label class="sr" for="xt-q">Search MP bui
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-cat · b3/board.css:2962 |
| grid-template-rows | `auto minmax(0px, 1fr)` | `88px 562.906px` | .b3-xt-cat · b3/board.css:2962 |
| min-width | `0px` | `0px` | main .panel, main section · app.css:680 |
| min-height | `0px` | `0px` | .b3-xt-cat · b3/board.css:2962 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `div.b3-xt-top`

inside `.b3-xt-cat` · 1 on screen · **1 look**

#### the one look

`M3p-15` · rendered **586×88** · 1 instance look like this

```html
<div class="b3-xt-top"><div class="b3-xt-row"><div class="mh-mode b3-xt-mode" role="radiogroup" aria-label="Game mode"><button type="button" role="radio" data-arm="MP" aria-checked="true">MP</button><button type="button" role="radio" data-arm="DMZ" aria-checked="false">DMZ</button></div><span class="srch b3-xt-find">⟨svg⟩<label class="sr" for="xt-q">Search MP builds</label><input id="xt-q" placeholder="Find a weapon,
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-top · b3/board.css:2963 |
| gap | `12px` | `` | .b3-xt-top · b3/board.css:2963 |
| column-gap | `12px` | `12px` | .b3-xt-top · b3/board.css:2963 |
| row-gap | `12px` | `12px` | .b3-xt-top · b3/board.css:2963 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `div.b3-xt-row`

inside `.b3-xt-top` · 1 on screen · **1 look**

#### the one look

`M3p-16` · rendered **586×44** · 1 instance look like this

```html
<div class="b3-xt-row"><div class="mh-mode b3-xt-mode" role="radiogroup" aria-label="Game mode"><button type="button" role="radio" data-arm="MP" aria-checked="true">MP</button><button type="button" role="radio" data-arm="DMZ" aria-checked="false">DMZ</button></div><span class="srch b3-xt-find">⟨svg⟩<label class="sr" for="xt-q">Search MP builds</label><input id="xt-q" placeholder="Find a weapon, code or attachment"></
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-xt-row · b3/board.css:2964 |
| gap | `10px` | `` | .b3-xt-row · b3/board.css:2964 |
| column-gap | `10px` | `10px` | .b3-xt-row · b3/board.css:2964 |
| row-gap | `10px` | `10px` | .b3-xt-row · b3/board.css:2964 |
| align-items | `stretch` | `stretch` | .b3-xt-row · b3/board.css:2964 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `div.b3-xt-mode.mh-mode[role=radiogroup]`

inside `.b3-xt-row` · 1 on screen · **1 look**

#### the one look

`M3p-17` · rendered **167×44** · 1 instance look like this · aria-label="Game mode" role="radiogroup"

```html
<div class="mh-mode b3-xt-mode" role="radiogroup" aria-label="Game mode"><button type="button" role="radio" data-arm="MP" aria-checked="true">MP</button><button type="button" role="radio" data-arm="DMZ" aria-checked="false">DMZ</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .mh-mode · app.css:3047 |
| gap | `var(--s2)` | `` | .mh-mode · app.css:3047 |
| column-gap | `` | `8px` | .mh-mode · app.css:3047 |
| row-gap | `` | `8px` | .mh-mode · app.css:3047 |
| flex | `none` | `` | .b3-xt .mh-mode · b3/board.css:2965 |
| width | `max-content` | `167.406px` | .mh-mode · app.css:3047 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| margin-top | `0px` | `0px` | .b3-xt .mh-mode · b3/board.css:2965 |
| border | `0` | `` | .mh-mode · app.css:3047 |
| background | `transparent` | `` | .mh-mode · app.css:3047 |
| background-color | `transparent` | `rgba(0, 0, 0, 0)` | .mh-mode · app.css:3047 |
| background-image | `initial` | `none` | .mh-mode · app.css:3047 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `span.b3-xt-find.srch`

inside `.b3-xt-row` · 1 on screen · **1 look**

#### the one look

`M3p-18` · rendered **296×44** · 1 instance look like this

```html
<span class="srch b3-xt-find">⟨svg⟩<label class="sr" for="xt-q">Search MP builds</label><input id="xt-q" placeholder="Find a weapon, code or attachment"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .srch · app.css:1225 |
| position | `relative` | `relative` | .srch · app.css:1225 |
| flex | `1 1 auto` | `` | .b3-xt .srch · b3/board.css:2966 |
| align-items | `center` | `center` | .srch · app.css:1225 |
| max-width | `none` | `none` | .b3-xt .srch · b3/board.css:2966 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `button.b3-xt-all.b3-xt-every.chip`

inside `.b3-xt-row` · 1 on screen · **1 look**

#### the one look

`M3p-20` · rendered **103×44** · 1 instance look like this · aria-label="Pick every MP build shown, 0 of 125 pick" aria-pressed="false" type="button"

```html
<button type="button" class="chip b3-xt-all b3-xt-every" aria-pressed="false" aria-label="Pick every MP build shown, 0 of 125 picked"><span class="wg-cb" aria-hidden="true" aria-checked="false"><span class="cb"></span></span><span class="b3-xt-n" aria-hidden="true"><b>0</b> / 125</span><span class="b3-xt-w8" aria-hidden="true">Pick all</span></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .chip.b3-xt-all · b3/board.css:2990 |
| flex | `none` | `` | .b3-xt-every · b3/board.css:3688 |
| align-items | `center` | `center` | .chip.b3-xt-all · b3/board.css:2990 |
| justify-content | `center` | `center` | .chip · app.css:1242 |
| min-height | `32px` | `32px` | .chip.b3-xt-all · b3/board.css:2990 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `0 10px 0 9px` | `` | .chip.b3-xt-all · b3/board.css:2990 |
| padding-top | `0px` | `0px` | .chip.b3-xt-all · b3/board.css:2990 |
| padding-right | `10px` | `10px` | .chip.b3-xt-all · b3/board.css:2990 |
| padding-bottom | `0px` | `0px` | .chip.b3-xt-all · b3/board.css:2990 |
| padding-left | `9px` | `9px` | .chip.b3-xt-all · b3/board.css:2990 |
| margin-left | `auto` | `0px` | .chip.b3-xt-all · b3/board.css:2990 |
| border | `1px solid var(--rule2)` | `` | .chip · app.css:1242 |
| border-radius | `8px` | `` | .chip.b3-xt-all · b3/board.css:2990 |
| background | `var(--sunk)` | `` | .chip.b3-xt-all · b3/board.css:2990 |
| background-color | `` | `rgb(11, 15, 18)` | .chip.b3-xt-all · b3/board.css:2990 |
| background-image | `` | `none` | .chip.b3-xt-all · b3/board.css:2990 |
| font | `inherit` | `` | button · app.css:621 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · app.css:621 |
| font-size | `var(--t-sm)` | `12px` | .chip · app.css:1242 |
| font-weight | `600` | `600` | .chip · app.css:1242 |
| font-style | `inherit` | `normal` | button · app.css:621 |
| font-variant-numeric | `inherit` | `normal` | button · app.css:621 |
| line-height | `inherit` | `18px` | button · app.css:621 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| text-decoration | `none` | `` | .chip · app.css:1242 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .chip · app.css:1242 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · app.css:5549 |
| cursor | `pointer` | `pointer` | button · app.css:621 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| transform | `none` | `matrix(1, 0, 0, 1, 0, 0)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| width | `102.625px` | `106.922px` |
| transform | `none` | `matrix(1, 0, 0, 1, 0, 0)` |


### `span.wg-cb`

inside `.chip` · 8 on screen · **1 look**

#### the one look

`M3p-21` · rendered **18×18** · 8 instances look like this · aria-hidden="true"

```html
<span class="wg-cb" aria-hidden="true" aria-checked="false"><span class="cb"></span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .wg-cb · app.css:1120 |
| align-items | `center` | `center` | .wg-cb · app.css:1120 |
| place-items | `center` | `` | .wg-cb · app.css:1120 |
| width | `auto` | `18px` | .b3-xt-all .wg-cb · b3/board.css:2991 |
| height | `auto` | `18px` | .b3-xt-all .wg-cb · b3/board.css:2991 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| margin | `0 9px 0 0` | `` | .b3-xt-all .wg-cb · b3/board.css:2991 |
| margin-top | `0px` | `0px` | .b3-xt-all .wg-cb · b3/board.css:2991 |
| margin-right | `9px` | `9px` | .b3-xt-all .wg-cb · b3/board.css:2991 |
| margin-bottom | `0px` | `0px` | .b3-xt-all .wg-cb · b3/board.css:2991 |
| margin-left | `0px` | `0px` | .b3-xt-all .wg-cb · b3/board.css:2991 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · app.css:621 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .chip · app.css:1242 |
| font-weight | ↑ `600` | `600` | inherited · .chip · app.css:1242 |
| font-style | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `18px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .chip · app.css:1242 |
| cursor | `inherit` | `pointer` | .b3-xt-all .wg-cb · b3/board.css:2991 |


### `span.cb`

inside `.wg-cb` · 8 on screen · **1 look**

#### the one look

`M3p-22` · rendered **18×18** · 8 instances look like this

```html
<span class="cb"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .cb · app.css:1280 |
| position | `relative` | `relative` | .cb · app.css:1280 |
| width | `18px` | `18px` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| height | `18px` | `18px` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border | `0` | `` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| border-radius | `6px` | `` | html[data-b3-p4="b"] .cb · b3/board.css:723 |
| background | `var(--desk)` | `` | html[data-b3-p4="b"] .cb · b3/board.css:723 |
| background-color | `` | `rgb(15, 20, 24)` | html[data-b3-p4="b"] .cb · b3/board.css:723 |
| background-image | `` | `none` | html[data-b3-p4="b"] .cb · b3/board.css:723 |
| box-shadow | `inset 0 1px 2px rgba(0,0,0,.55),var(--b3-ring)` | `rgba(0, 0, 0, 0.55) 0px 1px 2px 0px inset, rgb(58, 71, 82) 0px 0px 0px 1px inset` | html[data-b3-p4="b"] .cb · b3/board.css:723 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · app.css:621 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .chip · app.css:1242 |
| font-weight | ↑ `600` | `600` | inherited · .chip · app.css:1242 |
| font-style | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `18px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .chip · app.css:1242 |
| transition | `background var(--b3-d1) var(--ease),box-shadow var(--b3-d1) var(--ease)` | `` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| cursor | ↑ `inherit` | `pointer` | inherited · .b3-xt-all .wg-cb · b3/board.css:2991 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| width | `100%` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| height | `100%` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| top | `0px` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| left | `0px` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| border | `0` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| background | `transparent` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| background-color | `transparent` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| background-image | `initial` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| clip-path | `inset(0px 100% 0px 0px)` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:282 |
| mask | `var(--b3-check) center/12px no-repeat` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| mask-image | `` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| transform | `none` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| transition | `clip-path var(--b3-d2) cubic-bezier(.16,1,.3,1),background var(--b3-d1) var(--ease)` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:282 |
| content | `""` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |


### `span.b3-xt-n`

inside `.chip` · 8 on screen · **1 look**

#### the one look

`M3p-23` · rendered **55×13** · 8 instances look like this · aria-hidden="true"

```html
<span class="b3-xt-n" aria-hidden="true"><b>0</b> / 125</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `500 13px/1 var(--data)` | `` | .b3-xt-n · b3/board.css:2993 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .b3-xt-n · b3/board.css:2993 |
| font-size | `` | `13px` | .b3-xt-n · b3/board.css:2993 |
| font-weight | `` | `500` | .b3-xt-n · b3/board.css:2993 |
| font-style | `` | `normal` | .b3-xt-n · b3/board.css:2993 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .b3-xt-n · b3/board.css:2993 |
| line-height | `` | `13px` | .b3-xt-n · b3/board.css:2993 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | `nowrap` | `` | .b3-xt-n · b3/board.css:2993 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .b3-xt-n · b3/board.css:2993 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · app.css:621 |


### `span.b3-xt-w8`

inside `.chip` · 8 on screen · **1 look**

#### the one look

`M3p-25` · rendered **0×13** · 8 instances look like this · text “Pick all” · aria-hidden="true"

```html
<span class="b3-xt-w8" aria-hidden="true">Pick all</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .b3-xt-w8 · b3/board.css:2995 |
| max-width | `0px` | `0px` | .b3-xt-w8 · b3/board.css:2995 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `600 12.5px/1 var(--ui)` | `` | .b3-xt-w8 · b3/board.css:2995 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-xt-w8 · b3/board.css:2995 |
| font-size | `` | `12.5px` | .b3-xt-w8 · b3/board.css:2995 |
| font-weight | `` | `600` | .b3-xt-w8 · b3/board.css:2995 |
| font-style | `` | `normal` | .b3-xt-w8 · b3/board.css:2995 |
| font-variant-numeric | `` | `normal` | .b3-xt-w8 · b3/board.css:2995 |
| line-height | `` | `12.5px` | .b3-xt-w8 · b3/board.css:2995 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | `nowrap` | `` | .b3-xt-w8 · b3/board.css:2995 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .b3-xt-w8 · b3/board.css:2995 |
| opacity | `0` | `0` | .b3-xt-w8 · b3/board.css:2995 |
| overflow | `hidden` | `` | .b3-xt-w8 · b3/board.css:2995 |
| overflow-x | `hidden` | `hidden` | .b3-xt-w8 · b3/board.css:2995 |
| overflow-y | `hidden` | `hidden` | .b3-xt-w8 · b3/board.css:2995 |
| transition | `max-width 240ms cubic-bezier(.22,1,.36,1),opacity 180ms ease-out,margin 240ms cubic-bezier(.22,1,.36,1)` | `` | .b3-xt-w8 · b3/board.css:2995 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · app.css:621 |


### `div.b3-xt-chips.mt-grp[role=group]`

inside `.b3-xt-top` · 1 on screen · **1 look**

#### the one look

`M3p-26` · rendered **586×40** · 1 instance look like this · aria-label="Jump to a category" role="group"

```html
<div class="mt-grp b3-xt-chips" role="group" aria-label="Jump to a category"><button type="button" class="chip topic" aria-pressed="true" data-bay="AR" style="--c: #ff3b5c;"><i></i>Assault <em>35</em></button><button type="button" class="chip topic" aria-pressed="false" data-bay="SMG" style="--c: #ffd23f;"><i></i>SMG <em>26</em></button><button type="button" class="chip topic" aria-pressed="false" data-bay="LMG" styl
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-xt-chips · b3/board.css:2977 |
| gap | `6px` | `` | .b3-xt-chips · b3/board.css:2977 |
| column-gap | `6px` | `6px` | .b3-xt-chips · b3/board.css:2977 |
| row-gap | `6px` | `6px` | .b3-xt-chips · b3/board.css:2977 |
| flex-wrap | `nowrap` | `nowrap` | .b3-xt-chips · b3/board.css:4421 |
| align-items | `center` | `center` | .mt-grp · app.css:945 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding-block | `4px` | `` | .b3-xt-chips · b3/board.css:4658 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| overflow-x | `auto` | `auto` | .b3-xt-chips · b3/board.css:4421 |
| overflow-y | `hidden` | `hidden` | .b3-xt-chips · b3/board.css:4421 |
| mask-image | `linear-gradient(90deg,transparent 0,#000 var(--fx-l,0px),#000 calc(100% - var(--fx-r,28px)),transparent 100%)` | `linear-gradient(90deg, rgba(0, 0, 0, 0) 0px, rgb(0, 0, 0) 0px, rgb(0, 0, 0) calc(100% - 28px), rgba(0, 0, 0, 0) 100%)` | .b3-xt-chips · b3/board.css:4421 |


### `button.chip.topic`

inside `.mt-grp` · 7 on screen · **2 looks**

#### look 1 of 2

`M3p-27` · rendered **95×32** · 1 instance look like this · aria-pressed="true" type="button"

```html
<button type="button" class="chip topic" aria-pressed="true" data-bay="AR" style="--c: #ff3b5c;"><i></i>Assault <em>35</em></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-xt-chips .chip · b3/board.css:2978 |
| gap | `5px` | `` | .b3-xt-chips .chip · b3/board.css:2978 |
| column-gap | `5px` | `5px` | .b3-xt-chips .chip · b3/board.css:2978 |
| row-gap | `5px` | `5px` | .b3-xt-chips .chip · b3/board.css:2978 |
| flex | `0 0 auto` | `` | .b3-xt-chips .chip · b3/board.css:4426 |
| align-items | `center` | `center` | .b3-xt-chips .chip · b3/board.css:2978 |
| justify-content | `center` | `center` | .chip · app.css:1242 |
| min-height | `32px` | `32px` | .b3-xt-chips .chip · b3/board.css:2978 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `0 8px` | `` | .b3-xt-chips .chip · b3/board.css:2978 |
| padding-top | `0px` | `0px` | .b3-xt-chips .chip · b3/board.css:2978 |
| padding-right | `8px` | `8px` | .b3-xt-chips .chip · b3/board.css:2978 |
| padding-bottom | `0px` | `0px` | .b3-xt-chips .chip · b3/board.css:2978 |
| padding-left | `8px` | `8px` | .b3-xt-chips .chip · b3/board.css:2978 |
| border | `1px solid var(--rule2)` | `` | .chip · app.css:1242 |
| border-color | `var(--c)` | `` | .chip.topic[aria-pressed="true"] · app.css:2346 |
| border-radius | `var(--rad-pill)` | `` | .chip, .seg button, .tbdsw button · app.css:4762 |
| background | `color-mix(in srgb,var(--c) 16%,transparent)` | `` | .chip.topic[aria-pressed="true"] · app.css:2346 |
| background-color | `` | `color(srgb 1 0.231373 0.360784 / 0.16)` | .chip.topic[aria-pressed="true"] · app.css:2346 |
| background-image | `` | `none` | .chip.topic[aria-pressed="true"] · app.css:2346 |
| font | `inherit` | `` | button · app.css:621 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · app.css:621 |
| font-size | `var(--t-sm)` | `12px` | .chip · app.css:1242 |
| font-weight | `600` | `600` | .chip · app.css:1242 |
| font-style | `inherit` | `normal` | button · app.css:621 |
| font-variant-numeric | `inherit` | `normal` | button · app.css:621 |
| line-height | `inherit` | `18px` | button · app.css:621 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| text-decoration | `none` | `` | .chip · app.css:1242 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .chip.topic[aria-pressed="true"] · app.css:2346 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · app.css:5549 |
| cursor | `pointer` | `pointer` | button · app.css:621 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `color(srgb 1 0.231373 0.360784 / 0.16)` | `oklab(0.660024 0.218116 0.0686707 / 0.16)` |
| transform | `none` | `matrix(1, 0, 0, 1, 0, 0)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(1, 0, 0, 1, 0, 0)` |

#### look 2 of 2

`M3p-30` · rendered **78×32** · 6 instances look like this · aria-pressed="false" type="button"

```html
<button type="button" class="chip topic" aria-pressed="false" data-bay="SMG" style="--c: #ffd23f;"><i></i>SMG <em>26</em></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-xt-chips .chip · b3/board.css:2978 |
| gap | `5px` | `` | .b3-xt-chips .chip · b3/board.css:2978 |
| column-gap | `5px` | `5px` | .b3-xt-chips .chip · b3/board.css:2978 |
| row-gap | `5px` | `5px` | .b3-xt-chips .chip · b3/board.css:2978 |
| flex | `0 0 auto` | `` | .b3-xt-chips .chip · b3/board.css:4426 |
| align-items | `center` | `center` | .b3-xt-chips .chip · b3/board.css:2978 |
| justify-content | `center` | `center` | .chip · app.css:1242 |
| min-height | `32px` | `32px` | .b3-xt-chips .chip · b3/board.css:2978 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `0 8px` | `` | .b3-xt-chips .chip · b3/board.css:2978 |
| padding-top | `0px` | `0px` | .b3-xt-chips .chip · b3/board.css:2978 |
| padding-right | `8px` | `8px` | .b3-xt-chips .chip · b3/board.css:2978 |
| padding-bottom | `0px` | `0px` | .b3-xt-chips .chip · b3/board.css:2978 |
| padding-left | `8px` | `8px` | .b3-xt-chips .chip · b3/board.css:2978 |
| border | `1px solid var(--rule2)` | `` | .chip · app.css:1242 |
| border-radius | `var(--rad-pill)` | `` | .chip, .seg button, .tbdsw button · app.css:4762 |
| background | `var(--sunk)` | `` | .chip · app.css:1242 |
| background-color | `` | `rgb(11, 15, 18)` | .chip · app.css:1242 |
| background-image | `` | `none` | .chip · app.css:1242 |
| font | `inherit` | `` | button · app.css:621 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · app.css:621 |
| font-size | `var(--t-sm)` | `12px` | .chip · app.css:1242 |
| font-weight | `600` | `600` | .chip · app.css:1242 |
| font-style | `inherit` | `normal` | button · app.css:621 |
| font-variant-numeric | `inherit` | `normal` | button · app.css:621 |
| line-height | `inherit` | `18px` | button · app.css:621 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| text-decoration | `none` | `` | .chip · app.css:1242 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .chip · app.css:1242 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · app.css:5549 |
| cursor | `pointer` | `pointer` | button · app.css:621 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `rgb(11, 15, 18)` | `oklab(0.165465 -0.0044266 -0.0078463)` |
| transform | `none` | `matrix(1, 0, 0, 1, 0, 0)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| background-color | `rgb(11, 15, 18)` | `oklab(0.165572 -0.00442633 -0.00782082 / 0.998275)` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |
| transform | `none` | `matrix(1, 0, 0, 1, 0, -0.00187466)` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| background-color | `rgb(11, 15, 18)` | `oklab(0.165572 -0.00442633 -0.00782082 / 0.998275)` |
| transform | `none` | `matrix(1, 0, 0, 1, 0, -0.00187466)` |


### `i`

inside `.chip` · 120 on screen · **13 looks**

#### look 1 of 13

`M3p-28` · rendered **8×8** · 1 instance look like this

```html
<i></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .chip.topic i · app.css:2343 |
| width | `8px` | `8px` | .chip.topic i · app.css:2343 |
| height | `8px` | `8px` | .chip.topic i · app.css:2343 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border-radius | `50%` | `` | .chip.topic i, .pill .dot, .b3-sc > i, .b3-sd-gh > i · b3/board.css:1236 |
| background | `var(--c)` | `` | .chip.topic i · app.css:2343 |
| background-color | `` | `rgb(255, 59, 92)` | .chip.topic i · app.css:2343 |
| background-image | `` | `none` | .chip.topic i · app.css:2343 |
| box-shadow | `0 0 0 2px color-mix(in srgb,var(--c) 35%,transparent)` | `color(srgb 1 0.231373 0.360784 / 0.35) 0px 0px 0px 2px` | .chip.topic[aria-pressed="true"] i · app.css:2348 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · app.css:621 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .chip · app.css:1242 |
| font-weight | ↑ `600` | `600` | inherited · .chip · app.css:1242 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `18px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · .chip.topic[aria-pressed="true"] · app.css:2346 |
| transition | `box-shadow var(--b3-d1) var(--ease)` | `` | .chip.topic i · b3/board.css:3292 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · app.css:621 |

#### look 2 of 13

`M3p-51` · rendered **10×10** · 1 instance look like this · aria-hidden="true"

```html
<i aria-hidden="true"></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| width | `10px` | `10px` | .b3-xt-sech > i · b3/board.css:2987 |
| height | `10px` | `10px` | .b3-xt-sech > i · b3/board.css:2987 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border-radius | `50%` | `` | .b3-xt-sech > i · b3/board.css:2987 |
| background | `var(--c)` | `` | .b3-xt-sech > i · b3/board.css:2987 |
| background-color | `` | `rgb(255, 59, 92)` | .b3-xt-sech > i · b3/board.css:2987 |
| background-image | `` | `none` | .b3-xt-sech > i · b3/board.css:2987 |
| box-shadow | `0 0 0 3px color-mix(in srgb,var(--c) 22%,transparent)` | `color(srgb 1 0.231373 0.360784 / 0.22) 0px 0px 0px 3px` | .b3-xt-sech > i · b3/board.css:2987 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |

#### look 3 of 13

`M3p-74` · rendered **12×12** · 30 instances look like this · aria-hidden="true"

```html
<i data-k="meta" aria-hidden="true">⟨svg.ic⟩</i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-grid` | `grid` | .b3-xt-c i · b3/board.css:3014 |
| align-items | `center` | `center` | .b3-xt-c i · b3/board.css:3014 |
| place-items | `center` | `` | .b3-xt-c i · b3/board.css:3014 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · app.css:621 |
| font-size | ↑ `inherit` | `13px` | inherited · button · app.css:621 |
| font-weight | ↑ `inherit` | `400` | inherited · button · app.css:621 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `19.5px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `start` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--mk)` | `rgb(56, 214, 240)` | .b3-xt-c i · b3/board.css:3014 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xt-c · b3/board.css:3011 |

#### look 4 of 13

`M3p-76` · rendered **12×12** · 46 instances look like this · aria-hidden="true"

```html
<i data-k="top" aria-hidden="true">⟨svg.ic⟩</i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-grid` | `grid` | .b3-xt-c i · b3/board.css:3014 |
| align-items | `center` | `center` | .b3-xt-c i · b3/board.css:3014 |
| place-items | `center` | `` | .b3-xt-c i · b3/board.css:3014 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · app.css:621 |
| font-size | ↑ `inherit` | `13px` | inherited · button · app.css:621 |
| font-weight | ↑ `inherit` | `400` | inherited · button · app.css:621 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `19.5px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `start` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--mk)` | `rgb(169, 155, 255)` | .b3-xt-c i · b3/board.css:3014 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xt-c · b3/board.css:3011 |

#### look 5 of 13

`M3p-100` · rendered **12×12** · 9 instances look like this · aria-hidden="true"

```html
<i data-k="toxic" aria-hidden="true">⟨svg.ic⟩</i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-grid` | `grid` | .b3-xt-c i · b3/board.css:3014 |
| align-items | `center` | `center` | .b3-xt-c i · b3/board.css:3014 |
| place-items | `center` | `` | .b3-xt-c i · b3/board.css:3014 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · app.css:621 |
| font-size | ↑ `inherit` | `13px` | inherited · button · app.css:621 |
| font-weight | ↑ `inherit` | `400` | inherited · button · app.css:621 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `19.5px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `start` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--mk)` | `rgb(155, 225, 93)` | .b3-xt-c i · b3/board.css:3014 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xt-c · b3/board.css:3011 |

#### look 6 of 13

`M3p-243` · rendered **12×12** · 18 instances look like this · aria-hidden="true"

```html
<i data-k="best" aria-hidden="true">⟨svg.ic⟩</i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-grid` | `grid` | .b3-xt-c i · b3/board.css:3014 |
| align-items | `center` | `center` | .b3-xt-c i · b3/board.css:3014 |
| place-items | `center` | `` | .b3-xt-c i · b3/board.css:3014 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · app.css:621 |
| font-size | ↑ `inherit` | `13px` | inherited · button · app.css:621 |
| font-weight | ↑ `inherit` | `400` | inherited · button · app.css:621 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `19.5px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `start` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--mk)` | `rgb(242, 194, 48)` | .b3-xt-c i · b3/board.css:3014 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xt-c · b3/board.css:3011 |

*7 further looks are the same component in other data hues (a per-row `--c` / `--m` / `--sl`); they differ in colour only.*


### `em`

inside `.chip` · 11 on screen · **8 looks**

#### look 1 of 8

`M3p-29` · rendered **11×7** · 1 instance look like this · text “35”

```html
<em>35</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| margin-left | `5px` | `5px` | .chip.topic em · app.css:3965 |
| background | `none` | `` | .chip.topic[aria-pressed="true"] em · b3/board.css:3290 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .chip.topic[aria-pressed="true"] em · b3/board.css:3290 |
| background-image | `none` | `none` | .chip.topic[aria-pressed="true"] em · b3/board.css:3290 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | `var(--data)` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .chip.topic em · app.css:3965 |
| font-size | `var(--t-micro)` | `9.5px` | .chip.topic em · app.css:3965 |
| font-weight | `700` | `700` | .chip.topic em · b3/board.css:3289 |
| font-style | `normal` | `normal` | .chip.topic em · app.css:3965 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `14.25px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `oklch(from var(--c) max(l,.8) c h)` | `oklch(0.8 0.228671 17.4759)` | .chip.topic[aria-pressed="true"] em · b3/board.css:3290 |
| opacity | `1` | `1` | .chip.topic[aria-pressed="true"] em · b3/board.css:3290 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · app.css:621 |

#### look 2 of 8

`M3p-32` · rendered **11×7** · 1 instance look like this · text “26”

```html
<em>26</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| margin-left | `5px` | `5px` | .chip.topic em · app.css:3965 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | `var(--data)` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .chip.topic em · app.css:3965 |
| font-size | `var(--t-micro)` | `9.5px` | .chip.topic em · app.css:3965 |
| font-weight | `700` | `700` | .chip.topic em · b3/board.css:3289 |
| font-style | `normal` | `normal` | .chip.topic em · app.css:3965 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `14.25px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `oklch(from var(--c) max(l,.76) c h)` | `oklch(0.878915 0.161739 90.9295)` | .chip.topic em · b3/board.css:3289 |
| opacity | `1` | `1` | .chip.topic em · b3/board.css:3289 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · app.css:621 |

#### look 3 of 8

`M3p-35` · rendered **11×7** · 1 instance look like this · text “12”

```html
<em>12</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| margin-left | `5px` | `5px` | .chip.topic em · app.css:3965 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | `var(--data)` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .chip.topic em · app.css:3965 |
| font-size | `var(--t-micro)` | `9.5px` | .chip.topic em · app.css:3965 |
| font-weight | `700` | `700` | .chip.topic em · b3/board.css:3289 |
| font-style | `normal` | `normal` | .chip.topic em · app.css:3965 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `14.25px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `oklch(from var(--c) max(l,.76) c h)` | `oklch(0.76 0.151655 299.054)` | .chip.topic em · b3/board.css:3289 |
| opacity | `1` | `1` | .chip.topic em · b3/board.css:3289 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · app.css:621 |

#### look 4 of 8

`M3p-38` · rendered **11×7** · 1 instance look like this · text “14”

```html
<em>14</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| margin-left | `5px` | `5px` | .chip.topic em · app.css:3965 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | `var(--data)` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .chip.topic em · app.css:3965 |
| font-size | `var(--t-micro)` | `9.5px` | .chip.topic em · app.css:3965 |
| font-weight | `700` | `700` | .chip.topic em · b3/board.css:3289 |
| font-style | `normal` | `normal` | .chip.topic em · app.css:3965 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `14.25px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `oklch(from var(--c) max(l,.76) c h)` | `oklch(0.796842 0.163562 159.681)` | .chip.topic em · b3/board.css:3289 |
| opacity | `1` | `1` | .chip.topic em · b3/board.css:3289 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · app.css:621 |

#### look 5 of 8

`M3p-41` · rendered **11×7** · 1 instance look like this · text “19”

```html
<em>19</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| margin-left | `5px` | `5px` | .chip.topic em · app.css:3965 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | `var(--data)` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .chip.topic em · app.css:3965 |
| font-size | `var(--t-micro)` | `9.5px` | .chip.topic em · app.css:3965 |
| font-weight | `700` | `700` | .chip.topic em · b3/board.css:3289 |
| font-style | `normal` | `normal` | .chip.topic em · app.css:3965 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `14.25px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `oklch(from var(--c) max(l,.76) c h)` | `oklch(0.76 0.214095 269.022)` | .chip.topic em · b3/board.css:3289 |
| opacity | `1` | `1` | .chip.topic em · b3/board.css:3289 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · app.css:621 |

#### look 6 of 8

`M3p-44` · rendered **11×7** · 1 instance look like this · text “10”

```html
<em>10</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| margin-left | `5px` | `5px` | .chip.topic em · app.css:3965 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | `var(--data)` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .chip.topic em · app.css:3965 |
| font-size | `var(--t-micro)` | `9.5px` | .chip.topic em · app.css:3965 |
| font-weight | `700` | `700` | .chip.topic em · b3/board.css:3289 |
| font-style | `normal` | `normal` | .chip.topic em · app.css:3965 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `14.25px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `oklch(from var(--c) max(l,.76) c h)` | `oklch(0.791606 0.149517 71.4177)` | .chip.topic em · b3/board.css:3289 |
| opacity | `1` | `1` | .chip.topic em · b3/board.css:3289 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · app.css:621 |

*2 further looks are the same component in other data hues (a per-row `--c` / `--m` / `--sl`); they differ in colour only.*


### `div.b3-fady.b3-xt-list`

inside `.b3-xt-cat` · 1 on screen · **1 look**

#### the one look

`M3p-48` · rendered **586×563** · 1 instance look like this

```html
<div class="b3-xt-list b3-fady" style="--fo: 0px; --ft: 0px; --fb: 28px;"><section class="b3-xt-sec" data-cat="AR" style="--c: #ff3b5c;"><div class="b3-xt-sech"><i aria-hidden="true"></i><b>Assault</b><button type="button" class="chip b3-xt-all" aria-pressed="false" aria-label="Pick all Assault builds, 0 of 35 picked"><span class="wg-cb" aria-hidden="true" aria-checked="false"><span class="cb"></span></span><span cla
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .b3-xt-list · b3/board.css:2981 |
| min-height | `0px` | `0px` | .b3-xt-list · b3/board.css:2981 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `0 0 24px` | `` | .b3-xt-list · b3/board.css:2981 |
| padding-top | `0px` | `0px` | .b3-xt-list · b3/board.css:2981 |
| padding-right | `0px` | `0px` | .b3-xt-list · b3/board.css:2981 |
| padding-bottom | `24px` | `24px` | .b3-xt-list · b3/board.css:2981 |
| padding-left | `0px` | `0px` | .b3-xt-list · b3/board.css:2981 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| overflow-y | `auto` | `auto` | .b3-xt-list · b3/board.css:2981 |
| mask-image | `linear-gradient(to bottom,#000 0,#000 var(--fo,0px),rgb(0 0 0/0) var(--fo,0px),rgb(0 0 0/.3) calc(var(--fo,0px) + var(--ft,0px)*.45),rgb(0 0 0/.78) calc(var(--fo,0px) + var(--ft,0px)*.8),#000 calc(var(--fo,0px) + var(--ft,0px)),#000 calc(100% - var(--fb,0px)),rgb(0 0 0/.78) calc(100% - var(--fb,0px)*.8),rgb(0 0 0/.3) calc(100% - var(--fb,0px)*.45),rgb(0 0 0/0) 100%)` | `linear-gradient(rgb(0, 0, 0) 0px, rgb(0, 0, 0) 0px, rgba(0, 0, 0, 0) 0px, rgba(0, 0, 0, 0.3) 0px, rgba(0, 0, 0, 0.78) 0px, rgb(0, 0, 0) 0px, rgb(0, 0, 0) calc(100% - 28px), rgba(0, 0, 0, 0.78) calc(100% - 22.4px), rgba(0, 0, 0, 0.3) calc(100% - 12.6px), rgba(0, 0, 0, 0) 100%)` | .b3-fady, .b3-sd-rows, .b3-cmdl, .b3dock-list, .b3dock-cur, .b3-sd-chips:has(.b3-sc ~ .b3- · b3/board.css:2360 |


### `section.b3-xt-sec`

inside `.b3-xt-list` · 7 on screen · **7 looks**

#### look 1 of 7

`M3p-49` · rendered **586×608** · 1 instance look like this

```html
<section class="b3-xt-sec" data-cat="AR" style="--c: #ff3b5c;"><div class="b3-xt-sech"><i aria-hidden="true"></i><b>Assault</b><button type="button" class="chip b3-xt-all" aria-pressed="false" aria-label="Pick all Assault builds, 0 of 35 picked"><span class="wg-cb" aria-hidden="true" aria-checked="false"><span class="cb"></span></span><span class="b3-xt-n" aria-hidden="true"><b>0</b> / 35</span><span class="b3-xt-w8"
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-sec · b3/board.css:2984 |
| gap | `12px` | `` | .b3-xt-sec · b3/board.css:2984 |
| column-gap | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| row-gap | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| min-width | `0px` | `0px` | main .panel, main section · app.css:680 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `12px 12px 14px` | `` | .b3-xt-sec · b3/board.css:2984 |
| padding-top | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| padding-right | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| padding-bottom | `14px` | `14px` | .b3-xt-sec · b3/board.css:2984 |
| padding-left | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| margin-top | `14px` | `14px` | .b3-xt-sec · b3/board.css:2984 |
| border | `1px solid color-mix(in srgb,var(--c) 30%,var(--rule))` | `` | .b3-xt-sec · b3/board.css:2984 |
| border-radius | `12px` | `` | .b3-xt-sec · b3/board.css:2984 |
| background | `color-mix(in srgb,var(--c) 8%,color-mix(in srgb,var(--paper) 52%,transparent))` | `` | html[data-b3-xbg="ground"] .b3-xt-sec · b3/board.css:4327 |
| background-color | `` | `color(srgb 0.22054 0.13394 0.172639 / 0.5584)` | html[data-b3-xbg="ground"] .b3-xt-sec · b3/board.css:4327 |
| background-image | `` | `none` | html[data-b3-xbg="ground"] .b3-xt-sec · b3/board.css:4327 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |

#### look 2 of 7

`M3p-269` · rendered **586×586** · 1 instance look like this

```html
<section class="b3-xt-sec" data-cat="SMG" style="--c: #ffd23f;"><div class="b3-xt-sech"><i aria-hidden="true"></i><b>SMG</b><button type="button" class="chip b3-xt-all" aria-pressed="false" aria-label="Pick all SMG builds, 0 of 26 picked"><span class="wg-cb" aria-hidden="true" aria-checked="false"><span class="cb"></span></span><span class="b3-xt-n" aria-hidden="true"><b>0</b> / 26</span><span class="b3-xt-w8" aria-h
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-sec · b3/board.css:2984 |
| gap | `12px` | `` | .b3-xt-sec · b3/board.css:2984 |
| column-gap | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| row-gap | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| min-width | `0px` | `0px` | main .panel, main section · app.css:680 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `12px 12px 14px` | `` | .b3-xt-sec · b3/board.css:2984 |
| padding-top | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| padding-right | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| padding-bottom | `14px` | `14px` | .b3-xt-sec · b3/board.css:2984 |
| padding-left | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| margin-top | `14px` | `14px` | .b3-xt-sec · b3/board.css:2984 |
| border | `1px solid color-mix(in srgb,var(--c) 30%,var(--rule))` | `` | .b3-xt-sec · b3/board.css:2984 |
| border-radius | `12px` | `` | .b3-xt-sec · b3/board.css:2984 |
| background | `color-mix(in srgb,var(--c) 8%,color-mix(in srgb,var(--paper) 52%,transparent))` | `` | html[data-b3-xbg="ground"] .b3-xt-sec · b3/board.css:4327 |
| background-color | `` | `color(srgb 0.22054 0.218776 0.156346 / 0.5584)` | html[data-b3-xbg="ground"] .b3-xt-sec · b3/board.css:4327 |
| background-image | `` | `none` | html[data-b3-xbg="ground"] .b3-xt-sec · b3/board.css:4327 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |

#### look 3 of 7

`M3p-447` · rendered **586×335** · 1 instance look like this

```html
<section class="b3-xt-sec" data-cat="LMG" style="--c: #845ec2;"><div class="b3-xt-sech"><i aria-hidden="true"></i><b>LMG</b><button type="button" class="chip b3-xt-all" aria-pressed="false" aria-label="Pick all LMG builds, 0 of 12 picked"><span class="wg-cb" aria-hidden="true" aria-checked="false"><span class="cb"></span></span><span class="b3-xt-n" aria-hidden="true"><b>0</b> / 12</span><span class="b3-xt-w8" aria-h
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-sec · b3/board.css:2984 |
| gap | `12px` | `` | .b3-xt-sec · b3/board.css:2984 |
| column-gap | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| row-gap | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| min-width | `0px` | `0px` | main .panel, main section · app.css:680 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `12px 12px 14px` | `` | .b3-xt-sec · b3/board.css:2984 |
| padding-top | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| padding-right | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| padding-bottom | `14px` | `14px` | .b3-xt-sec · b3/board.css:2984 |
| padding-left | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| margin-top | `14px` | `14px` | .b3-xt-sec · b3/board.css:2984 |
| border | `1px solid color-mix(in srgb,var(--c) 30%,var(--rule))` | `` | .b3-xt-sec · b3/board.css:2984 |
| border-radius | `12px` | `` | .b3-xt-sec · b3/board.css:2984 |
| background | `color-mix(in srgb,var(--c) 8%,color-mix(in srgb,var(--paper) 52%,transparent))` | `` | html[data-b3-xbg="ground"] .b3-xt-sec · b3/board.css:4327 |
| background-color | `` | `color(srgb 0.151435 0.153604 0.229945 / 0.5584)` | html[data-b3-xbg="ground"] .b3-xt-sec · b3/board.css:4327 |
| background-image | `` | `none` | html[data-b3-xbg="ground"] .b3-xt-sec · b3/board.css:4327 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |

#### look 4 of 7

`M3p-532` · rendered **586×280** · 1 instance look like this

```html
<section class="b3-xt-sec" data-cat="MARKSMAN" style="--c: #3ddc97;"><div class="b3-xt-sech"><i aria-hidden="true"></i><b>Marksman</b><button type="button" class="chip b3-xt-all" aria-pressed="false" aria-label="Pick all Marksman builds, 0 of 14 picked"><span class="wg-cb" aria-hidden="true" aria-checked="false"><span class="cb"></span></span><span class="b3-xt-n" aria-hidden="true"><b>0</b> / 14</span><span class="b
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-sec · b3/board.css:2984 |
| gap | `12px` | `` | .b3-xt-sec · b3/board.css:2984 |
| column-gap | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| row-gap | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| min-width | `0px` | `0px` | main .panel, main section · app.css:680 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `12px 12px 14px` | `` | .b3-xt-sec · b3/board.css:2984 |
| padding-top | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| padding-right | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| padding-bottom | `14px` | `14px` | .b3-xt-sec · b3/board.css:2984 |
| padding-left | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| margin-top | `14px` | `14px` | .b3-xt-sec · b3/board.css:2984 |
| border | `1px solid color-mix(in srgb,var(--c) 30%,var(--rule))` | `` | .b3-xt-sec · b3/board.css:2984 |
| border-radius | `12px` | `` | .b3-xt-sec · b3/board.css:2984 |
| background | `color-mix(in srgb,var(--c) 8%,color-mix(in srgb,var(--paper) 52%,transparent))` | `` | html[data-b3-xbg="ground"] .b3-xt-sec · b3/board.css:4327 |
| background-color | `` | `color(srgb 0.111546 0.224395 0.205787 / 0.5584)` | html[data-b3-xbg="ground"] .b3-xt-sec · b3/board.css:4327 |
| background-image | `` | `none` | html[data-b3-xbg="ground"] .b3-xt-sec · b3/board.css:4327 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |

#### look 5 of 7

`M3p-624` · rendered **586×426** · 1 instance look like this

```html
<section class="b3-xt-sec" data-cat="SNIPER" style="--c: #4361ee;"><div class="b3-xt-sech"><i aria-hidden="true"></i><b>Sniper</b><button type="button" class="chip b3-xt-all" aria-pressed="false" aria-label="Pick all Sniper builds, 0 of 19 picked"><span class="wg-cb" aria-hidden="true" aria-checked="false"><span class="cb"></span></span><span class="b3-xt-n" aria-hidden="true"><b>0</b> / 19</span><span class="b3-xt-w
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-sec · b3/board.css:2984 |
| gap | `12px` | `` | .b3-xt-sec · b3/board.css:2984 |
| column-gap | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| row-gap | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| min-width | `0px` | `0px` | main .panel, main section · app.css:680 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `12px 12px 14px` | `` | .b3-xt-sec · b3/board.css:2984 |
| padding-top | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| padding-right | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| padding-bottom | `14px` | `14px` | .b3-xt-sec · b3/board.css:2984 |
| padding-left | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| margin-top | `14px` | `14px` | .b3-xt-sec · b3/board.css:2984 |
| border | `1px solid color-mix(in srgb,var(--c) 30%,var(--rule))` | `` | .b3-xt-sec · b3/board.css:2984 |
| border-radius | `12px` | `` | .b3-xt-sec · b3/board.css:2984 |
| background | `color-mix(in srgb,var(--c) 8%,color-mix(in srgb,var(--paper) 52%,transparent))` | `` | html[data-b3-xbg="ground"] .b3-xt-sec · b3/board.css:4327 |
| background-color | `` | `color(srgb 0.114917 0.15529 0.254666 / 0.5584)` | html[data-b3-xbg="ground"] .b3-xt-sec · b3/board.css:4327 |
| background-image | `` | `none` | html[data-b3-xbg="ground"] .b3-xt-sec · b3/board.css:4327 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |

#### look 6 of 7

`M3p-755` · rendered **586×335** · 1 instance look like this

```html
<section class="b3-xt-sec" data-cat="SHOTGUN" style="--c: #f6a93b;"><div class="b3-xt-sech"><i aria-hidden="true"></i><b>Shotgun</b><button type="button" class="chip b3-xt-all" aria-pressed="false" aria-label="Pick all Shotgun builds, 0 of 10 picked"><span class="wg-cb" aria-hidden="true" aria-checked="false"><span class="cb"></span></span><span class="b3-xt-n" aria-hidden="true"><b>0</b> / 10</span><span class="b3-x
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-sec · b3/board.css:2984 |
| gap | `12px` | `` | .b3-xt-sec · b3/board.css:2984 |
| column-gap | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| row-gap | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| min-width | `0px` | `0px` | main .panel, main section · app.css:680 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `12px 12px 14px` | `` | .b3-xt-sec · b3/board.css:2984 |
| padding-top | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| padding-right | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| padding-bottom | `14px` | `14px` | .b3-xt-sec · b3/board.css:2984 |
| padding-left | `12px` | `12px` | .b3-xt-sec · b3/board.css:2984 |
| margin-top | `14px` | `14px` | .b3-xt-sec · b3/board.css:2984 |
| border | `1px solid color-mix(in srgb,var(--c) 30%,var(--rule))` | `` | .b3-xt-sec · b3/board.css:2984 |
| border-radius | `12px` | `` | .b3-xt-sec · b3/board.css:2984 |
| background | `color-mix(in srgb,var(--c) 8%,color-mix(in srgb,var(--paper) 52%,transparent))` | `` | html[data-b3-xbg="ground"] .b3-xt-sec · b3/board.css:4327 |
| background-color | `` | `color(srgb 0.215484 0.195741 0.154099 / 0.5584)` | html[data-b3-xbg="ground"] .b3-xt-sec · b3/board.css:4327 |
| background-image | `` | `none` | html[data-b3-xbg="ground"] .b3-xt-sec · b3/board.css:4327 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |

*1 further looks are the same component in other data hues (a per-row `--c` / `--m` / `--sl`); they differ in colour only.*


### `div.b3-xt-sech`

inside `.b3-xt-sec` · 7 on screen · **1 look**

#### the one look

`M3p-50` · rendered **560×32** · 7 instances look like this

```html
<div class="b3-xt-sech"><i aria-hidden="true"></i><b>Assault</b><button type="button" class="chip b3-xt-all" aria-pressed="false" aria-label="Pick all Assault builds, 0 of 35 picked"><span class="wg-cb" aria-hidden="true" aria-checked="false"><span class="cb"></span></span><span class="b3-xt-n" aria-hidden="true"><b>0</b> / 35</span><span class="b3-xt-w8" aria-hidden="true">Pick all</span></button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-xt-sech · b3/board.css:2986 |
| gap | `10px` | `` | .b3-xt-sech · b3/board.css:2986 |
| column-gap | `10px` | `10px` | .b3-xt-sech · b3/board.css:2986 |
| row-gap | `10px` | `10px` | .b3-xt-sech · b3/board.css:2986 |
| align-items | `center` | `center` | .b3-xt-sech · b3/board.css:2986 |
| min-height | `32px` | `32px` | .b3-xt-sech · b3/board.css:2986 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `button.b3-xt-all.chip`

inside `.b3-xt-sech` · 7 on screen · **1 look**

#### the one look

`M3p-53` · rendered **95×32** · 7 instances look like this · aria-label="Pick all Assault builds, 0 of 35 picked" aria-pressed="false" type="button"

```html
<button type="button" class="chip b3-xt-all" aria-pressed="false" aria-label="Pick all Assault builds, 0 of 35 picked"><span class="wg-cb" aria-hidden="true" aria-checked="false"><span class="cb"></span></span><span class="b3-xt-n" aria-hidden="true"><b>0</b> / 35</span><span class="b3-xt-w8" aria-hidden="true">Pick all</span></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .chip.b3-xt-all · b3/board.css:2990 |
| align-items | `center` | `center` | .chip.b3-xt-all · b3/board.css:2990 |
| justify-content | `center` | `center` | .chip · app.css:1242 |
| min-height | `32px` | `32px` | .chip.b3-xt-all · b3/board.css:2990 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `0 10px 0 9px` | `` | .chip.b3-xt-all · b3/board.css:2990 |
| padding-top | `0px` | `0px` | .chip.b3-xt-all · b3/board.css:2990 |
| padding-right | `10px` | `10px` | .chip.b3-xt-all · b3/board.css:2990 |
| padding-bottom | `0px` | `0px` | .chip.b3-xt-all · b3/board.css:2990 |
| padding-left | `9px` | `9px` | .chip.b3-xt-all · b3/board.css:2990 |
| margin-left | `auto` | `382.062px` | .chip.b3-xt-all · b3/board.css:2990 |
| border | `1px solid var(--rule2)` | `` | .chip · app.css:1242 |
| border-radius | `8px` | `` | .chip.b3-xt-all · b3/board.css:2990 |
| background | `var(--sunk)` | `` | .chip.b3-xt-all · b3/board.css:2990 |
| background-color | `` | `rgb(11, 15, 18)` | .chip.b3-xt-all · b3/board.css:2990 |
| background-image | `` | `none` | .chip.b3-xt-all · b3/board.css:2990 |
| font | `inherit` | `` | button · app.css:621 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · app.css:621 |
| font-size | `var(--t-sm)` | `12px` | .chip · app.css:1242 |
| font-weight | `600` | `600` | .chip · app.css:1242 |
| font-style | `inherit` | `normal` | button · app.css:621 |
| font-variant-numeric | `inherit` | `normal` | button · app.css:621 |
| line-height | `inherit` | `18px` | button · app.css:621 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| text-decoration | `none` | `` | .chip · app.css:1242 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .chip · app.css:1242 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · app.css:5549 |
| cursor | `pointer` | `pointer` | button · app.css:621 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| transform | `none` | `matrix(1, 0, 0, 1, 0, 0)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| width | `94.8281px` | `99.125px` |
| margin-left | `382.062px` | `377.766px` |
| transform | `none` | `matrix(1, 0, 0, 1, 0, 0)` |


### `div.b3-xt-tiles`

inside `.b3-xt-sec` · 7 on screen · **6 looks**

#### look 1 of 6

`M3p-59` · rendered **560×536** · 1 instance look like this

```html
<div class="b3-xt-tiles"><div class="b3-xt-w" style="--c: #ff3b5c;"><div class="b3-xt-wh"><button type="button" class="b3-xt-wn" aria-pressed="false" aria-label="Pick every AK117 build"><b>AK117</b></button></div><div class="b3-xt-cs" role="group" aria-label="AK117 builds"><button type="button" class="b3-xt-c" aria-pressed="false" aria-label="AK117 build 1"><b>1</b></button></div></div><div class="b3-xt-w" style="--c
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .b3-xt-tiles · b3/board.css:4398 |
| grid-template-columns | `repeat(auto-fill, minmax(160px, 1fr))` | `repeat(auto-fill, minmax(160px, 1fr))` | .b3-xt-tiles · b3/board.css:2998 |
| gap | `10px` | `` | .b3-xt-tiles · b3/board.css:3673 |
| column-gap | `8px` | `8px` | .b3-xt-tiles · b3/board.css:4398 |
| row-gap | `10px` | `10px` | .b3-xt-tiles · b3/board.css:3673 |
| align-items | `stretch` | `stretch` | .b3-xt-tiles · b3/board.css:3673 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |

#### look 2 of 6

`M3p-279` · rendered **560×514** · 1 instance look like this

```html
<div class="b3-xt-tiles"><div class="b3-xt-w" style="--c: #ffd23f;"><div class="b3-xt-wh"><button type="button" class="b3-xt-wn" aria-pressed="false" aria-label="Pick every PDW-57 build"><b>PDW-57</b></button></div><div class="b3-xt-cs" role="group" aria-label="PDW-57 builds"><button type="button" class="b3-xt-c" aria-pressed="false" aria-label="PDW-57 build 1"><b>1</b></button></div></div><div class="b3-xt-w" style=
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .b3-xt-tiles · b3/board.css:4398 |
| grid-template-columns | `repeat(auto-fill, minmax(160px, 1fr))` | `repeat(auto-fill, minmax(160px, 1fr))` | .b3-xt-tiles · b3/board.css:2998 |
| gap | `10px` | `` | .b3-xt-tiles · b3/board.css:3673 |
| column-gap | `8px` | `8px` | .b3-xt-tiles · b3/board.css:4398 |
| row-gap | `10px` | `10px` | .b3-xt-tiles · b3/board.css:3673 |
| align-items | `stretch` | `stretch` | .b3-xt-tiles · b3/board.css:3673 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |

#### look 3 of 6

`M3p-457` · rendered **560×263** · 2 instances look like this

```html
<div class="b3-xt-tiles"><div class="b3-xt-w" style="--c: #845ec2;"><div class="b3-xt-wh"><button type="button" class="b3-xt-wn" aria-pressed="false" aria-label="Pick every UL736 build"><b>UL736</b></button></div><div class="b3-xt-cs" role="group" aria-label="UL736 builds"><button type="button" class="b3-xt-c" aria-pressed="false" aria-label="UL736 build 1"><b>1</b></button><button type="button" class="b3-xt-c" aria-
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .b3-xt-tiles · b3/board.css:4398 |
| grid-template-columns | `repeat(auto-fill, minmax(160px, 1fr))` | `repeat(auto-fill, minmax(160px, 1fr))` | .b3-xt-tiles · b3/board.css:2998 |
| gap | `10px` | `` | .b3-xt-tiles · b3/board.css:3673 |
| column-gap | `8px` | `8px` | .b3-xt-tiles · b3/board.css:4398 |
| row-gap | `10px` | `10px` | .b3-xt-tiles · b3/board.css:3673 |
| align-items | `stretch` | `stretch` | .b3-xt-tiles · b3/board.css:3673 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |

#### look 4 of 6

`M3p-542` · rendered **560×208** · 1 instance look like this

```html
<div class="b3-xt-tiles"><div class="b3-xt-w" style="--c: #3ddc97;"><div class="b3-xt-wh"><button type="button" class="b3-xt-wn" aria-pressed="false" aria-label="Pick every KILO BOLT-ACTION build"><b>KILO BOLT-ACTION</b></button></div><div class="b3-xt-cs" role="group" aria-label="KILO BOLT-ACTION builds"><button type="button" class="b3-xt-c" aria-pressed="false" aria-label="KILO BOLT-ACTION build 1"><b>1</b></button
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .b3-xt-tiles · b3/board.css:4398 |
| grid-template-columns | `repeat(auto-fill, minmax(160px, 1fr))` | `repeat(auto-fill, minmax(160px, 1fr))` | .b3-xt-tiles · b3/board.css:2998 |
| gap | `10px` | `` | .b3-xt-tiles · b3/board.css:3673 |
| column-gap | `8px` | `8px` | .b3-xt-tiles · b3/board.css:4398 |
| row-gap | `10px` | `10px` | .b3-xt-tiles · b3/board.css:3673 |
| align-items | `stretch` | `stretch` | .b3-xt-tiles · b3/board.css:3673 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |

#### look 5 of 6

`M3p-634` · rendered **560×354** · 1 instance look like this

```html
<div class="b3-xt-tiles"><div class="b3-xt-w" style="--c: #4361ee;"><div class="b3-xt-wh"><button type="button" class="b3-xt-wn" aria-pressed="false" aria-label="Pick every LOCUS build"><b>LOCUS</b></button></div><div class="b3-xt-cs" role="group" aria-label="LOCUS builds"><button type="button" class="b3-xt-c" aria-pressed="false" aria-label="LOCUS build 1, META, BEST"><b>1</b><i data-k="meta" aria-hidden="true">⟨svg
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .b3-xt-tiles · b3/board.css:4398 |
| grid-template-columns | `repeat(auto-fill, minmax(160px, 1fr))` | `repeat(auto-fill, minmax(160px, 1fr))` | .b3-xt-tiles · b3/board.css:2998 |
| gap | `10px` | `` | .b3-xt-tiles · b3/board.css:3673 |
| column-gap | `8px` | `8px` | .b3-xt-tiles · b3/board.css:4398 |
| row-gap | `10px` | `10px` | .b3-xt-tiles · b3/board.css:3673 |
| align-items | `stretch` | `stretch` | .b3-xt-tiles · b3/board.css:3673 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |

#### look 6 of 6

`M3p-859` · rendered **560×181** · 1 instance look like this

```html
<div class="b3-xt-tiles"><div class="b3-xt-w" style="--c: #3F6E8E;"><div class="b3-xt-wh"><button type="button" class="b3-xt-wn" aria-pressed="false" aria-label="Pick every MACHINE PISTOL build"><b>MACHINE PISTOL</b></button></div><div class="b3-xt-cs" role="group" aria-label="MACHINE PISTOL builds"><button type="button" class="b3-xt-c" aria-pressed="false" aria-label="MACHINE PISTOL build 1, BEST"><b>1</b><i data-k=
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .b3-xt-tiles · b3/board.css:4398 |
| grid-template-columns | `repeat(auto-fill, minmax(160px, 1fr))` | `repeat(auto-fill, minmax(160px, 1fr))` | .b3-xt-tiles · b3/board.css:2998 |
| gap | `10px` | `` | .b3-xt-tiles · b3/board.css:3673 |
| column-gap | `8px` | `8px` | .b3-xt-tiles · b3/board.css:4398 |
| row-gap | `10px` | `10px` | .b3-xt-tiles · b3/board.css:3673 |
| align-items | `stretch` | `stretch` | .b3-xt-tiles · b3/board.css:3673 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `div.b3-xt-w`

inside `.b3-xt-tiles` · 68 on screen · **3 looks**

#### look 1 of 3

`M3p-60` · rendered **181×82** · 60 instances look like this

```html
<div class="b3-xt-w" style="--c: #ff3b5c;"><div class="b3-xt-wh"><button type="button" class="b3-xt-wn" aria-pressed="false" aria-label="Pick every AK117 build"><b>AK117</b></button></div><div class="b3-xt-cs" role="group" aria-label="AK117 builds"><button type="button" class="b3-xt-c" aria-pressed="false" aria-label="AK117 build 1"><b>1</b></button></div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-w · b3/board.css:2999 |
| gap | `10px` | `` | .b3-xt-w · b3/board.css:3674 |
| column-gap | `10px` | `10px` | .b3-xt-w · b3/board.css:3674 |
| row-gap | `10px` | `10px` | .b3-xt-w · b3/board.css:3674 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `11px 12px 12px` | `` | .b3-xt-w · b3/board.css:3674 |
| padding-top | `11px` | `11px` | .b3-xt-w · b3/board.css:3674 |
| padding-right | `12px` | `12px` | .b3-xt-w · b3/board.css:3674 |
| padding-bottom | `12px` | `12px` | .b3-xt-w · b3/board.css:3674 |
| padding-left | `12px` | `12px` | .b3-xt-w · b3/board.css:3674 |
| margin | `0 0 8px` | `` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| margin-top | `0px` | `0px` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| margin-right | `0px` | `0px` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| margin-bottom | `8px` | `8px` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| margin-left | `0px` | `0px` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| border | `1px solid var(--rule2)` | `` | .b3-xt-w · b3/board.css:2999 |
| border-radius | `8px` | `` | .b3-xt-w · b3/board.css:2999 |
| background | `var(--raised)` | `` | .b3-xt-w · b3/board.css:2999 |
| background-color | `` | `rgb(31, 39, 46)` | .b3-xt-w · b3/board.css:2999 |
| background-image | `` | `none` | .b3-xt-w · b3/board.css:2999 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| transition | `border-color var(--b3-d1),box-shadow var(--b3-d1),background var(--b3-d1)` | `` | .b3-xt-w · b3/board.css:3674 |
| cursor | `pointer` | `pointer` | .b3-xt-w · b3/board.css:3674 |

#### look 2 of 3

`M3p-234` · rendered **181×152** · 1 instance look like this

```html
<div class="b3-xt-w" style="--c: #ff3b5c;"><div class="b3-xt-wh"><button type="button" class="b3-xt-wn" aria-pressed="false" aria-label="Pick every BAL-27 build"><b>BAL-27</b></button></div><div class="b3-xt-cs" role="group" aria-label="BAL-27 builds"><button type="button" class="b3-xt-c" aria-pressed="false" aria-label="BAL-27 build 1, META, BEST"><b>1</b><i data-k="meta" aria-hidden="true">⟨svg.ic⟩</i><i data-k="be
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-w · b3/board.css:2999 |
| gap | `10px` | `` | .b3-xt-w · b3/board.css:3674 |
| column-gap | `10px` | `10px` | .b3-xt-w · b3/board.css:3674 |
| row-gap | `10px` | `10px` | .b3-xt-w · b3/board.css:3674 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `11px 12px 12px` | `` | .b3-xt-w · b3/board.css:3674 |
| padding-top | `11px` | `11px` | .b3-xt-w · b3/board.css:3674 |
| padding-right | `12px` | `12px` | .b3-xt-w · b3/board.css:3674 |
| padding-bottom | `12px` | `12px` | .b3-xt-w · b3/board.css:3674 |
| padding-left | `12px` | `12px` | .b3-xt-w · b3/board.css:3674 |
| margin | `0 0 8px` | `` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| margin-top | `0px` | `0px` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| margin-right | `0px` | `0px` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| margin-bottom | `8px` | `8px` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| margin-left | `0px` | `0px` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| border | `1px solid var(--rule2)` | `` | .b3-xt-w · b3/board.css:2999 |
| border-radius | `8px` | `` | .b3-xt-w · b3/board.css:2999 |
| background | `var(--raised)` | `` | .b3-xt-w · b3/board.css:2999 |
| background-color | `` | `rgb(31, 39, 46)` | .b3-xt-w · b3/board.css:2999 |
| background-image | `` | `none` | .b3-xt-w · b3/board.css:2999 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| transition | `border-color var(--b3-d1),box-shadow var(--b3-d1),background var(--b3-d1)` | `` | .b3-xt-w · b3/board.css:3674 |
| cursor | `pointer` | `pointer` | .b3-xt-w · b3/board.css:3674 |

#### look 3 of 3

`M3p-346` · rendered **181×117** · 7 instances look like this

```html
<div class="b3-xt-w" style="--c: #ffd23f;"><div class="b3-xt-wh"><button type="button" class="b3-xt-wn" aria-pressed="false" aria-label="Pick every SWITCHBLADE X9 build"><b>SWITCHBLADE X9</b></button></div><div class="b3-xt-cs" role="group" aria-label="SWITCHBLADE X9 builds"><button type="button" class="b3-xt-c" aria-pressed="false" aria-label="SWITCHBLADE X9 build 1, META, BEST"><b>1</b><i data-k="meta" aria-hidden=
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-w · b3/board.css:2999 |
| gap | `10px` | `` | .b3-xt-w · b3/board.css:3674 |
| column-gap | `10px` | `10px` | .b3-xt-w · b3/board.css:3674 |
| row-gap | `10px` | `10px` | .b3-xt-w · b3/board.css:3674 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `11px 12px 12px` | `` | .b3-xt-w · b3/board.css:3674 |
| padding-top | `11px` | `11px` | .b3-xt-w · b3/board.css:3674 |
| padding-right | `12px` | `12px` | .b3-xt-w · b3/board.css:3674 |
| padding-bottom | `12px` | `12px` | .b3-xt-w · b3/board.css:3674 |
| padding-left | `12px` | `12px` | .b3-xt-w · b3/board.css:3674 |
| margin | `0 0 8px` | `` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| margin-top | `0px` | `0px` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| margin-right | `0px` | `0px` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| margin-bottom | `8px` | `8px` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| margin-left | `0px` | `0px` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| border | `1px solid var(--rule2)` | `` | .b3-xt-w · b3/board.css:2999 |
| border-radius | `8px` | `` | .b3-xt-w · b3/board.css:2999 |
| background | `var(--raised)` | `` | .b3-xt-w · b3/board.css:2999 |
| background-color | `` | `rgb(31, 39, 46)` | .b3-xt-w · b3/board.css:2999 |
| background-image | `` | `none` | .b3-xt-w · b3/board.css:2999 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| transition | `border-color var(--b3-d1),box-shadow var(--b3-d1),background var(--b3-d1)` | `` | .b3-xt-w · b3/board.css:3674 |
| cursor | `pointer` | `pointer` | .b3-xt-w · b3/board.css:3674 |


### `div.b3-xt-wh`

inside `.b3-xt-w` · 68 on screen · **1 look**

#### the one look

`M3p-61` · rendered **155×17** · 68 instances look like this

```html
<div class="b3-xt-wh"><button type="button" class="b3-xt-wn" aria-pressed="false" aria-label="Pick every AK117 build"><b>AK117</b></button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-xt-wh · b3/board.css:3679 |
| gap | `8px` | `` | .b3-xt-wh · b3/board.css:4400 |
| column-gap | `8px` | `8px` | .b3-xt-wh · b3/board.css:4400 |
| row-gap | `8px` | `8px` | .b3-xt-wh · b3/board.css:4400 |
| align-items | `baseline` | `baseline` | .b3-xt-wh · b3/board.css:3679 |
| min-width | `0px` | `0px` | .b3-xt-wh · b3/board.css:3679 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xt-w · b3/board.css:3674 |


### `button.b3-xt-wn`

inside `.b3-xt-wh` · 68 on screen · **1 look**

#### the one look

`M3p-62` · rendered **155×17** · 68 instances look like this · aria-label="Pick every AK117 build" aria-pressed="false" type="button"

```html
<button type="button" class="b3-xt-wn" aria-pressed="false" aria-label="Pick every AK117 build"><b>AK117</b></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-xt-wn · b3/board.css:3004 |
| flex | `1 1 auto` | `` | .b3-xt-wn · b3/board.css:4406 |
| min-width | `0px` | `0px` | .b3-xt-wn · b3/board.css:4406 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · app.css:388 |
| box-sizing | `border-box` | `border-box` | .b3-xt-wn · b3/board.css:3004 |
| padding | `var(--ctl-pad, 7px 10px)` | `` | input, select, textarea, button · app.css:388 |
| padding-top | `` | `0px` | input, select, textarea, button · app.css:388 |
| padding-right | `` | `0px` | input, select, textarea, button · app.css:388 |
| padding-bottom | `` | `0px` | input, select, textarea, button · app.css:388 |
| padding-left | `` | `0px` | input, select, textarea, button · app.css:388 |
| border | `0` | `` | button · app.css:621 |
| border-radius | `4px` | `` | .b3-xt-wn · b3/board.css:3004 |
| background | `none` | `` | button · app.css:621 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | button · app.css:621 |
| background-image | `none` | `none` | button · app.css:621 |
| font | `inherit` | `` | button · app.css:621 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · app.css:621 |
| font-size | `inherit` | `13px` | button · app.css:621 |
| font-weight | `inherit` | `400` | button · app.css:621 |
| font-style | `inherit` | `normal` | button · app.css:621 |
| font-variant-numeric | `inherit` | `normal` | button · app.css:621 |
| line-height | `inherit` | `19.5px` | button · app.css:621 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `start` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `inherit` | `rgb(232, 237, 241)` | button · app.css:621 |
| overflow | `hidden` | `` | .b3-xt-wn · b3/board.css:4406 |
| overflow-x | `hidden` | `hidden` | .b3-xt-wn · b3/board.css:4406 |
| overflow-y | `hidden` | `hidden` | .b3-xt-wn · b3/board.css:4406 |
| mask-image | `linear-gradient(90deg, rgb(0, 0, 0) calc(100% - 18px), transparent)` | `linear-gradient(90deg, rgb(0, 0, 0) calc(100% - 18px), rgba(0, 0, 0, 0))` | .b3-xt-wn · b3/board.css:4406 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · app.css:5549 |
| cursor | `pointer` | `pointer` | .b3-xt-wn · b3/board.css:3004 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `3px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `div.b3-xt-cs[role=group]`

inside `.b3-xt-w` · 68 on screen · **3 looks**

#### look 1 of 3

`M3p-64` · rendered **155×30** · 60 instances look like this · aria-label="AK117 builds" role="group"

```html
<div class="b3-xt-cs" role="group" aria-label="AK117 builds"><button type="button" class="b3-xt-c" aria-pressed="false" aria-label="AK117 build 1"><b>1</b></button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-xt-cs · b3/board.css:3010 |
| gap | `5px` | `` | .b3-xt-cs · b3/board.css:3010 |
| column-gap | `5px` | `5px` | .b3-xt-cs · b3/board.css:3010 |
| row-gap | `5px` | `5px` | .b3-xt-cs · b3/board.css:3010 |
| flex-wrap | `wrap` | `wrap` | .b3-xt-cs · b3/board.css:3010 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xt-w · b3/board.css:3674 |

#### look 2 of 3

`M3p-238` · rendered **155×100** · 1 instance look like this · aria-label="BAL-27 builds" role="group"

```html
<div class="b3-xt-cs" role="group" aria-label="BAL-27 builds"><button type="button" class="b3-xt-c" aria-pressed="false" aria-label="BAL-27 build 1, META, BEST"><b>1</b><i data-k="meta" aria-hidden="true">⟨svg.ic⟩</i><i data-k="best" aria-hidden="true">⟨svg.ic⟩</i></button><button type="button" class="b3-xt-c" aria-pressed="false" aria-label="BAL-27 build 2, META, BEST"><b>2</b><i data-k="meta" aria-hidden="true">⟨sv
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-xt-cs · b3/board.css:3010 |
| gap | `5px` | `` | .b3-xt-cs · b3/board.css:3010 |
| column-gap | `5px` | `5px` | .b3-xt-cs · b3/board.css:3010 |
| row-gap | `5px` | `5px` | .b3-xt-cs · b3/board.css:3010 |
| flex-wrap | `wrap` | `wrap` | .b3-xt-cs · b3/board.css:3010 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xt-w · b3/board.css:3674 |

#### look 3 of 3

`M3p-350` · rendered **155×65** · 7 instances look like this · aria-label="SWITCHBLADE X9 builds" role="group"

```html
<div class="b3-xt-cs" role="group" aria-label="SWITCHBLADE X9 builds"><button type="button" class="b3-xt-c" aria-pressed="false" aria-label="SWITCHBLADE X9 build 1, META, BEST"><b>1</b><i data-k="meta" aria-hidden="true">⟨svg.ic⟩</i><i data-k="best" aria-hidden="true">⟨svg.ic⟩</i></button><button type="button" class="b3-xt-c" aria-pressed="false" aria-label="SWITCHBLADE X9 build 2, META, BEST"><b>2</b><i data-k="meta
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-xt-cs · b3/board.css:3010 |
| gap | `5px` | `` | .b3-xt-cs · b3/board.css:3010 |
| column-gap | `5px` | `5px` | .b3-xt-cs · b3/board.css:3010 |
| row-gap | `5px` | `5px` | .b3-xt-cs · b3/board.css:3010 |
| flex-wrap | `wrap` | `wrap` | .b3-xt-cs · b3/board.css:3010 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xt-w · b3/board.css:3674 |


### `button.b3-xt-c`

inside `.b3-xt-cs` · 125 on screen · **1 look**

#### the one look

`M3p-65` · rendered **32×30** · 125 instances look like this · aria-label="AK117 build 1" aria-pressed="false" type="button"

```html
<button type="button" class="b3-xt-c" aria-pressed="false" aria-label="AK117 build 1"><b>1</b></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-xt-c · b3/board.css:3011 |
| gap | `5px` | `` | .b3-xt-c · b3/board.css:3011 |
| column-gap | `5px` | `5px` | .b3-xt-c · b3/board.css:3011 |
| row-gap | `5px` | `5px` | .b3-xt-c · b3/board.css:3011 |
| align-items | `center` | `center` | .b3-xt-c · b3/board.css:3011 |
| justify-content | `center` | `center` | .b3-xt-c · b3/board.css:3011 |
| min-width | `32px` | `32px` | .b3-xt-c · b3/board.css:3011 |
| height | `30px` | `30px` | .b3-xt-c · b3/board.css:3011 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · app.css:388 |
| box-sizing | `border-box` | `border-box` | .b3-xt-c · b3/board.css:3011 |
| padding | `0 9px` | `` | .b3-xt-c · b3/board.css:3011 |
| padding-top | `0px` | `0px` | .b3-xt-c · b3/board.css:3011 |
| padding-right | `9px` | `9px` | .b3-xt-c · b3/board.css:3011 |
| padding-bottom | `0px` | `0px` | .b3-xt-c · b3/board.css:3011 |
| padding-left | `9px` | `9px` | .b3-xt-c · b3/board.css:3011 |
| border | `0` | `` | button · app.css:621 |
| border-radius | `6px` | `` | .b3-xt-c · b3/board.css:3011 |
| background | `var(--sunk)` | `` | .b3-xt-c · b3/board.css:3011 |
| background-color | `` | `rgb(11, 15, 18)` | .b3-xt-c · b3/board.css:3011 |
| background-image | `` | `none` | .b3-xt-c · b3/board.css:3011 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .b3-xt-c · b3/board.css:3011 |
| font | `inherit` | `` | button · app.css:621 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · app.css:621 |
| font-size | `inherit` | `13px` | button · app.css:621 |
| font-weight | `inherit` | `400` | button · app.css:621 |
| font-style | `inherit` | `normal` | button · app.css:621 |
| font-variant-numeric | `inherit` | `normal` | button · app.css:621 |
| line-height | `inherit` | `19.5px` | button · app.css:621 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `start` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `inherit` | `rgb(232, 237, 241)` | button · app.css:621 |
| transition | `background 140ms ease-out,box-shadow 140ms ease-out` | `` | .b3-xt-c · b3/board.css:3011 |
| cursor | `pointer` | `pointer` | .b3-xt-c · b3/board.css:3011 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `rgb(11, 15, 18)` | `oklab(0.165465 -0.0044266 -0.0078463)` |
| box-shadow | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | `oklab(0.390863 -0.0110071 -0.0225948) 0px 0px 0px 1px inset` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `1px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `svg.ic`

inside `.—` · 105 on screen · **4 looks**

#### look 1 of 4

`M3p-75` · rendered **12×12** · 30 instances look like this · aria-hidden="true"

```html
<svg class="ic" aria-hidden="true"><use href="#i-zap"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · app.css:6457 |
| flex | `none` | `` | .ic · b2.css:4 |
| width | `12px` | `12px` | .b3-xt-c .ic · b3/board.css:3015 |
| height | `12px` | `12px` | .b3-xt-c .ic · b3/board.css:3015 |
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
| text-align | ↑ `center` | `start` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--mk)` | `rgb(56, 214, 240)` | inherited · .b3-xt-c i · b3/board.css:3014 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xt-c · b3/board.css:3011 |
| pointer-events | `none` | `none` | button .ic, a .ic · app.css:6464 |

#### look 2 of 4

`M3p-77` · rendered **12×12** · 46 instances look like this · aria-hidden="true"

```html
<svg class="ic" aria-hidden="true"><use href="#i-award"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · app.css:6457 |
| flex | `none` | `` | .ic · b2.css:4 |
| width | `12px` | `12px` | .b3-xt-c .ic · b3/board.css:3015 |
| height | `12px` | `12px` | .b3-xt-c .ic · b3/board.css:3015 |
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
| text-align | ↑ `center` | `start` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--mk)` | `rgb(169, 155, 255)` | inherited · .b3-xt-c i · b3/board.css:3014 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xt-c · b3/board.css:3011 |
| pointer-events | `none` | `none` | button .ic, a .ic · app.css:6464 |

#### look 3 of 4

`M3p-101` · rendered **12×12** · 9 instances look like this · aria-hidden="true"

```html
<svg class="ic" aria-hidden="true"><use href="#i-skull"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · app.css:6457 |
| flex | `none` | `` | .ic · b2.css:4 |
| width | `12px` | `12px` | .b3-xt-c .ic · b3/board.css:3015 |
| height | `12px` | `12px` | .b3-xt-c .ic · b3/board.css:3015 |
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
| text-align | ↑ `center` | `start` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--mk)` | `rgb(155, 225, 93)` | inherited · .b3-xt-c i · b3/board.css:3014 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xt-c · b3/board.css:3011 |
| pointer-events | `none` | `none` | button .ic, a .ic · app.css:6464 |

#### look 4 of 4

`M3p-244` · rendered **12×12** · 18 instances look like this · aria-hidden="true"

```html
<svg class="ic" aria-hidden="true"><use href="#i-crown"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · app.css:6457 |
| flex | `none` | `` | .ic · b2.css:4 |
| width | `12px` | `12px` | .b3-xt-c .ic · b3/board.css:3015 |
| height | `12px` | `12px` | .b3-xt-c .ic · b3/board.css:3015 |
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
| text-align | ↑ `center` | `start` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--mk)` | `rgb(242, 194, 48)` | inherited · .b3-xt-c i · b3/board.css:3014 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xt-c · b3/board.css:3011 |
| pointer-events | `none` | `none` | button .ic, a .ic · app.css:6464 |


### `section.b3-xt-side`

inside `.b3-xt` · 1 on screen · **1 look**

#### the one look

`M3p-922` · rendered **440×651** · 1 instance look like this · aria-label="The files"

```html
<section class="b3-xt-side" aria-label="The files"><div class="b3-xt-files"><section class="b3-xf b3-xf-none" data-fk="MP-1" aria-label="dioreo-mp-2026-09-21.txt" style="--m: #FF3B5C;"><header class="b3-xf-h0"><strong class="b3-xf-t" aria-label="No MP builds picked yet"><i class="b3-xf-sq" aria-hidden="true">0</i>MP builds</strong></header><div class="b3-xf-bw"><div class="b3-xf-b b3-fady" role="list" style="--fo: 0p
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-side · b3/board.css:3031 |
| position | `relative` | `relative` | .b3-xt-side · b3/board.css:3031 |
| min-width | `0px` | `0px` | main .panel, main section · app.css:680 |
| min-height | `0px` | `0px` | .b3-xt-side · b3/board.css:3031 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `div.b3-xt-files`

inside `.b3-xt-side` · 1 on screen · **1 look**

#### the one look

`M3p-923` · rendered **440×651** · 1 instance look like this

```html
<div class="b3-xt-files"><section class="b3-xf b3-xf-none" data-fk="MP-1" aria-label="dioreo-mp-2026-09-21.txt" style="--m: #FF3B5C;"><header class="b3-xf-h0"><strong class="b3-xf-t" aria-label="No MP builds picked yet"><i class="b3-xf-sq" aria-hidden="true">0</i>MP builds</strong></header><div class="b3-xf-bw"><div class="b3-xf-b b3-fady" role="list" style="--fo: 0px; --ft: 0px; --fb: 0px;"><div class="b3-xt-empty">
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-xt-files · b3/board.css:3032 |
| gap | `12px` | `` | .b3-xt-files · b3/board.css:3032 |
| column-gap | `12px` | `12px` | .b3-xt-files · b3/board.css:3032 |
| row-gap | `12px` | `12px` | .b3-xt-files · b3/board.css:3032 |
| flex-direction | `column` | `column` | .b3-xt-files · b3/board.css:3032 |
| min-height | `0px` | `0px` | .b3-xt-files · b3/board.css:3032 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| overflow-y | `auto` | `auto` | .b3-xt-files · b3/board.css:3032 |


### `section.b3-xf.b3-xf-none`

inside `.b3-xt-files` · 1 on screen · **1 look**

#### the one look

`M3p-924` · rendered **440×651** · 1 instance look like this · aria-label="dioreo-mp-2026-09-21.txt"

```html
<section class="b3-xf b3-xf-none" data-fk="MP-1" aria-label="dioreo-mp-2026-09-21.txt" style="--m: #FF3B5C;"><header class="b3-xf-h0"><strong class="b3-xf-t" aria-label="No MP builds picked yet"><i class="b3-xf-sq" aria-hidden="true">0</i>MP builds</strong></header><div class="b3-xf-bw"><div class="b3-xf-b b3-fady" role="list" style="--fo: 0px; --ft: 0px; --fb: 0px;"><div class="b3-xt-empty"><div class="b3-xt-ghost" 
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-xf · b3/board.css:3037 |
| position | `relative` | `relative` | .dk, .exs-i, .exs-pick, .b3-tk, .b3-xf, .pb-enc, .b3-sd · gates.css:868 |
| flex | `0 0 auto` | `` | .b3-xf, .b3-xf.shut · b3/board.css:3815 |
| flex-direction | `column` | `column` | .b3-xf · b3/board.css:3037 |
| min-width | `0px` | `0px` | main .panel, main section · app.css:680 |
| min-height | `0px` | `0px` | .b3-xf:not(.shut) · b3/board.css:4517 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border | `1px solid var(--b3-edge,var(--rule2))` | `` | .dk, .exs-i, .exs-pick, .b3-tk, .b3-xf, .pb-enc, .b3-sd · gates.css:868 |
| border-radius | `12px` | `` | .b3-xf · b3/board.css:3037 |
| outline | `0` | `` | .dk, .exs-i, .exs-pick, .b3-tk, .b3-xf, .pb-enc, .b3-sd · gates.css:868 |
| outline-offset | `-1px` | `-1px` | .b3-tk, .b3-xf, .pb-enc, .b3-sd · b3/board.css:4057 |
| background | `linear-gradient(180deg,color-mix(in srgb,var(--m) 6%,var(--sunk)),var(--sunk) 64px)` | `` | .b3-xf · b3/board.css:3748 |
| background-color | `` | `rgba(0, 0, 0, 0)` | .b3-xf · b3/board.css:3748 |
| background-image | `` | `linear-gradient(color(srgb 0.100549 0.0691765 0.088), rgb(11, 15, 18) 64px)` | .b3-xf · b3/board.css:3748 |
| box-shadow | `inset 0 1px 0 color-mix(in srgb,var(--m) 35%,transparent)` | `color(srgb 1 0.231373 0.360784 / 0.35) 0px 1px 0px 0px inset` | .b3-xf · gates.css:872 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| overflow | `clip` | `` | .b3-xf · b3/board.css:3037 |
| overflow-x | `clip` | `clip` | .b3-xf · b3/board.css:3037 |
| overflow-y | `clip` | `clip` | .b3-xf · b3/board.css:3037 |
| transition | `flex-grow var(--xf-dur) var(--xf-ease)` | `` | .b3-xf, .b3-xf.shut · b3/board.css:4502 |
| animation | `b3xfin 360ms cubic-bezier(.22,1,.36,1) backwards` | `` | .b3-xf · b3/board.css:3111 |


### `header.b3-xf-h0`

inside `.b3-xf` · 1 on screen · **1 look**

#### the one look

`M3p-925` · rendered **438×58** · 1 instance look like this

```html
<header class="b3-xf-h0"><strong class="b3-xf-t" aria-label="No MP builds picked yet"><i class="b3-xf-sq" aria-hidden="true">0</i>MP builds</strong></header>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-xf-h0 · b3/board.css:4551 |
| position | `sticky` | `sticky` | header · app.css:682 |
| grid-column | `1/-1` | `` | header · app.css:682 |
| gap | `14px` | `` | header · app.css:682 |
| column-gap | `14px` | `14px` | header · app.css:682 |
| row-gap | `14px` | `14px` | header · app.css:682 |
| flex | `0 0 auto` | `` | .b3-xf-h0 · b3/board.css:4551 |
| align-items | `center` | `center` | .b3-xf-h0 · b3/board.css:4551 |
| min-width | `0px` | `0px` | header · app.css:1427 |
| height | `58px` | `58px` | .b3-xf-h0 · b3/board.css:4551 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `0 16px` | `` | .b3-xf-h0 · b3/board.css:4551 |
| padding-top | `0px` | `0px` | .b3-xf-h0 · b3/board.css:4551 |
| padding-right | `16px` | `16px` | .b3-xf-h0 · b3/board.css:4551 |
| padding-bottom | `0px` | `0px` | .b3-xf-h0 · b3/board.css:4551 |
| padding-left | `16px` | `16px` | .b3-xf-h0 · b3/board.css:4551 |
| top | `0px` | `0px` | header · app.css:682 |
| border-bottom | `0` | `` | .b3-xf-h0 · b3/board.css:4551 |
| background | `var(--paper)` | `` | header · app.css:682 |
| background-color | `` | `rgb(23, 30, 36)` | header · app.css:682 |
| background-image | `` | `none` | header · app.css:682 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| z-index | `40` | `40` | header · app.css:682 |


### `strong.b3-xf-t`

inside `.b3-xf-h0` · 1 on screen · **1 look**

#### the one look

`M3p-926` · rendered **152×40** · 1 instance look like this · aria-label="No MP builds picked yet"

```html
<strong class="b3-xf-t" aria-label="No MP builds picked yet"><i class="b3-xf-sq" aria-hidden="true">0</i>MP builds</strong>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4552 |
| position | `static` | `static` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4037 |
| gap | `16px` | `` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4552 |
| column-gap | `16px` | `16px` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4552 |
| row-gap | `16px` | `16px` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4552 |
| flex | `0 1 auto` | `` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4552 |
| align-items | `center` | `center` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4552 |
| min-width | `0px` | `0px` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4552 |
| height | `40px` | `40px` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4552 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| margin | `0` | `` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4037 |
| margin-top | `0px` | `0px` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4037 |
| margin-right | `0px` | `0px` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4037 |
| margin-bottom | `0px` | `0px` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4037 |
| margin-left | `0px` | `0px` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4037 |
| font | `600 21px/40px var(--ui)` | `` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4552 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4552 |
| font-size | `` | `21px` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4552 |
| font-weight | `` | `600` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4552 |
| font-style | `` | `normal` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4552 |
| font-variant-numeric | `` | `normal` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4552 |
| line-height | `` | `40px` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4552 |
| letter-spacing | `-0.012em` | `-0.252px` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4552 |
| white-space | `nowrap` | `` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4552 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .b3-xf-h0 > .b3-xf-t · b3/board.css:4552 |


### `i.b3-xf-sq`

inside `.b3-xf-t` · 1 on screen · **1 look**

#### the one look

`M3p-927` · rendered **40×40** · 1 instance look like this · text “0” · aria-hidden="true"

```html
<i class="b3-xf-sq" aria-hidden="true">0</i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-xf-sq · b3/board.css:4460 |
| flex | `0 0 auto` | `` | .b3-xf-sq · b3/board.css:4460 |
| align-items | `center` | `center` | .b3-xf-sq · b3/board.css:4460 |
| justify-content | `center` | `center` | .b3-xf-sq · b3/board.css:4460 |
| width | `40px` | `40px` | .b3-xf-sq · b3/board.css:4460 |
| height | `40px` | `40px` | .b3-xf-sq · b3/board.css:4460 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border-radius | `10px` | `` | .b3-xf-sq · b3/board.css:4460 |
| outline | `1px solid var(--rule2)` | `` | .b3-xf-h0 .b3-xf-sq · b3/board.css:4554 |
| outline-offset | `-1px` | `-1px` | .b3-xf-h0 .b3-xf-sq · b3/board.css:4554 |
| background | `var(--sunk)` | `` | .b3-xf-h0 .b3-xf-sq · b3/board.css:4554 |
| background-color | `` | `rgb(11, 15, 18)` | .b3-xf-h0 .b3-xf-sq · b3/board.css:4554 |
| background-image | `` | `none` | .b3-xf-h0 .b3-xf-sq · b3/board.css:4554 |
| font | `700 19px/1 var(--display)` | `` | .b3-xf-sq · b3/board.css:4460 |
| font-family | `` | `"Big Shoulders Display", "Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-xf-sq · b3/board.css:4460 |
| font-size | `` | `19px` | .b3-xf-sq · b3/board.css:4460 |
| font-weight | `` | `700` | .b3-xf-sq · b3/board.css:4460 |
| font-style | `normal` | `normal` | .b3-xf-sq · b3/board.css:4460 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .b3-xf-sq · b3/board.css:4460 |
| line-height | `` | `19px` | .b3-xf-sq · b3/board.css:4460 |
| letter-spacing | `var(--tr-fig)` | `0.076px` | .b3-xf-sq · b3/board.css:4460 |
| white-space | ↑ `nowrap` | `` | inherited · .b3-xf-h0 > .b3-xf-t · b3/board.css:4552 |
| color | `var(--ink4)` | `rgb(92, 106, 117)` | .b3-xf-h0 .b3-xf-sq · b3/board.css:4554 |


### `div.b3-xf-bw`

inside `.b3-xf` · 1 on screen · **1 look**

#### the one look

`M3p-928` · rendered **438×538** · 1 instance look like this

```html
<div class="b3-xf-bw"><div class="b3-xf-b b3-fady" role="list" style="--fo: 0px; --ft: 0px; --fb: 0px;"><div class="b3-xt-empty"><div class="b3-xt-ghost" aria-hidden="true" style="--c: #4361ee;"><div class="b3-xt-bin"><div class="b3-xt-ln x-hd"><span class="b3-xt-no">1</span><span class="b3-xt-tx"><b>LOCUS</b><i> | </i>SNIPER</span></div><div class="b3-xt-ln x-kv"><span class="b3-xt-no">2</span><span class="b3-xt-tx"
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xf-bw · b3/board.css:3059 |
| grid-template-rows | `minmax(0px, 1fr)` | `537.906px` | .b3-xf-bw, .b3-xf.shut .b3-xf-bw · b3/board.css:3817 |
| flex | `1 1 0` | `` | .b3-xf-bw, .b3-xf.shut .b3-xf-bw · b3/board.css:3817 |
| min-height | `0px` | `0px` | .b3-xf-bw, .b3-xf.shut .b3-xf-bw · b3/board.css:3817 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border-top | `0` | `` | .b3-xf-bw · b3/board.css:3725 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| opacity | `1` | `1` | .b3-xf-bw, .b3-xf.shut .b3-xf-bw · b3/board.css:3817 |
| overflow | `hidden` | `` | .b3-xf-bw · b3/board.css:3059 |
| overflow-x | `hidden` | `hidden` | .b3-xf-bw · b3/board.css:3059 |
| overflow-y | `hidden` | `hidden` | .b3-xf-bw · b3/board.css:3059 |
| transition | `none` | `` | .b3-xf-bw, .b3-xf.shut .b3-xf-bw · b3/board.css:3817 |


### `div.b3-fady.b3-xf-b[role=list]`

inside `.b3-xf-bw` · 1 on screen · **1 look**

#### the one look

`M3p-929` · rendered **438×538** · 1 instance look like this · role="list"

```html
<div class="b3-xf-b b3-fady" role="list" style="--fo: 0px; --ft: 0px; --fb: 0px;"><div class="b3-xt-empty"><div class="b3-xt-ghost" aria-hidden="true" style="--c: #4361ee;"><div class="b3-xt-bin"><div class="b3-xt-ln x-hd"><span class="b3-xt-no">1</span><span class="b3-xt-tx"><b>LOCUS</b><i> | </i>SNIPER</span></div><div class="b3-xt-ln x-kv"><span class="b3-xt-no">2</span><span class="b3-xt-tx"><em>Build:</em> Build
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| min-height | `0px` | `0px` | .b3-xf-b · b3/board.css:3062 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `12px 0 72px` | `` | .b3-xf-b, .b3-xf.shut .b3-xf-b · b3/board.css:3818 |
| padding-top | `12px` | `12px` | .b3-xf-b, .b3-xf.shut .b3-xf-b · b3/board.css:3818 |
| padding-right | `0px` | `0px` | .b3-xf-b, .b3-xf.shut .b3-xf-b · b3/board.css:3818 |
| padding-bottom | `72px` | `72px` | .b3-xf-b, .b3-xf.shut .b3-xf-b · b3/board.css:3818 |
| padding-left | `0px` | `0px` | .b3-xf-b, .b3-xf.shut .b3-xf-b · b3/board.css:3818 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| overflow-y | `auto` | `auto` | .b3-xf-b · b3/board.css:3062 |
| mask-image | `linear-gradient(to bottom,#000 0,#000 var(--fo,0px),rgb(0 0 0/0) var(--fo,0px),rgb(0 0 0/.3) calc(var(--fo,0px) + var(--ft,0px)*.45),rgb(0 0 0/.78) calc(var(--fo,0px) + var(--ft,0px)*.8),#000 calc(var(--fo,0px) + var(--ft,0px)),#000 calc(100% - var(--fb,0px)),rgb(0 0 0/.78) calc(100% - var(--fb,0px)*.8),rgb(0 0 0/.3) calc(100% - var(--fb,0px)*.45),rgb(0 0 0/0) 100%)` | `linear-gradient(rgb(0, 0, 0) 0px, rgb(0, 0, 0) 0px, rgba(0, 0, 0, 0) 0px, rgba(0, 0, 0, 0.3) 0px, rgba(0, 0, 0, 0.78) 0px, rgb(0, 0, 0) 0px, rgb(0, 0, 0) 100%, rgba(0, 0, 0, 0.78) 100%, rgba(0, 0, 0, 0.3) 100%, rgba(0, 0, 0, 0) 100%)` | .b3-fady, .b3-sd-rows, .b3-cmdl, .b3dock-list, .b3dock-cur, .b3-sd-chips:has(.b3-sc ~ .b3- · b3/board.css:2360 |
| transition | `opacity 240ms ease-out 90ms,transform 380ms var(--xf-ease) 40ms,visibility 0s` | `` | .b3-xf-b · b3/board.css:3819 |


### `div.b3-xt-empty`

inside `.b3-xf-b` · 1 on screen · **1 look**

#### the one look

`M3p-930` · rendered **438×322** · 1 instance look like this

```html
<div class="b3-xt-empty"><div class="b3-xt-ghost" aria-hidden="true" style="--c: #4361ee;"><div class="b3-xt-bin"><div class="b3-xt-ln x-hd"><span class="b3-xt-no">1</span><span class="b3-xt-tx"><b>LOCUS</b><i> | </i>SNIPER</span></div><div class="b3-xt-ln x-kv"><span class="b3-xt-no">2</span><span class="b3-xt-tx"><em>Build:</em> Build 1</span></div><div class="b3-xt-ln x-kv"><span class="b3-xt-no">3</span><span cla
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-empty · b3/board.css:3094 |
| gap | `8px` | `` | .b3-xt-empty · b3/board.css:3094 |
| column-gap | `8px` | `8px` | .b3-xt-empty · b3/board.css:3094 |
| row-gap | `8px` | `8px` | .b3-xt-empty · b3/board.css:3094 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `8px 32px 24px` | `` | .b3-xt-empty · b3/board.css:3094 |
| padding-top | `8px` | `8px` | .b3-xt-empty · b3/board.css:3094 |
| padding-right | `32px` | `32px` | .b3-xt-empty · b3/board.css:3094 |
| padding-bottom | `24px` | `24px` | .b3-xt-empty · b3/board.css:3094 |
| padding-left | `32px` | `32px` | .b3-xt-empty · b3/board.css:3094 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| text-align | `center` | `center` | .b3-xt-empty · b3/board.css:3094 |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `div.b3-xt-ghost`

inside `.b3-xt-empty` · 1 on screen · **1 look**

#### the one look

`M3p-931` · rendered **438×162** · 1 instance look like this · aria-hidden="true"

```html
<div class="b3-xt-ghost" aria-hidden="true" style="--c: #4361ee;"><div class="b3-xt-bin"><div class="b3-xt-ln x-hd"><span class="b3-xt-no">1</span><span class="b3-xt-tx"><b>LOCUS</b><i> | </i>SNIPER</span></div><div class="b3-xt-ln x-kv"><span class="b3-xt-no">2</span><span class="b3-xt-tx"><em>Build:</em> Build 1</span></div><div class="b3-xt-ln x-kv"><span class="b3-xt-no">3</span><span class="b3-xt-tx"><em>Image:<
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| justify-self | `stretch` | `stretch` | .b3-xt-ghost · b3/board.css:3097 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `4px 0` | `` | .b3-xt-ghost · b3/board.css:3097 |
| padding-top | `4px` | `4px` | .b3-xt-ghost · b3/board.css:3097 |
| padding-right | `0px` | `0px` | .b3-xt-ghost · b3/board.css:3097 |
| padding-bottom | `4px` | `4px` | .b3-xt-ghost · b3/board.css:3097 |
| padding-left | `0px` | `0px` | .b3-xt-ghost · b3/board.css:3097 |
| margin | `0 -32px 16px` | `` | .b3-xt-ghost · b3/board.css:3097 |
| margin-top | `0px` | `0px` | .b3-xt-ghost · b3/board.css:3097 |
| margin-right | `-32px` | `-32px` | .b3-xt-ghost · b3/board.css:3097 |
| margin-bottom | `16px` | `16px` | .b3-xt-ghost · b3/board.css:3097 |
| margin-left | `-32px` | `-32px` | .b3-xt-ghost · b3/board.css:3097 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| text-align | `left` | `left` | .b3-xt-ghost · b3/board.css:3097 |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| opacity | `0.4` | `0.4` | .b3-xt-ghost · b3/board.css:3097 |
| mask-image | `linear-gradient(rgb(0, 0, 0) 45%, transparent)` | `linear-gradient(rgb(0, 0, 0) 45%, rgba(0, 0, 0, 0))` | .b3-xt-ghost · b3/board.css:3097 |


### `div.b3-xt-bin`

inside `.b3-xt-ghost` · 1 on screen · **1 look**

#### the one look

`M3p-932` · rendered **438×154** · 1 instance look like this

```html
<div class="b3-xt-bin"><div class="b3-xt-ln x-hd"><span class="b3-xt-no">1</span><span class="b3-xt-tx"><b>LOCUS</b><i> | </i>SNIPER</span></div><div class="b3-xt-ln x-kv"><span class="b3-xt-no">2</span><span class="b3-xt-tx"><em>Build:</em> Build 1</span></div><div class="b3-xt-ln x-kv"><span class="b3-xt-no">3</span><span class="b3-xt-tx"><em>Image:</em> LOCUS-1</span></div><div class="b3-xt-ln x-kv"><span class="b
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .b3-xt-bin · b3/board.css:3079 |
| min-height | `0px` | `0px` | .b3-xt-bin · b3/board.css:3079 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| text-align | ↑ `left` | `left` | inherited · .b3-xt-ghost · b3/board.css:3097 |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| overflow | `hidden` | `` | .b3-xt-bin · b3/board.css:3079 |
| overflow-x | `hidden` | `hidden` | .b3-xt-bin · b3/board.css:3079 |
| overflow-y | `hidden` | `hidden` | .b3-xt-bin · b3/board.css:3079 |
| transition | `background 200ms ease-out` | `` | .b3-xt-bin · b3/board.css:3079 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .b3-xt-bin::before · b3/board.css:3080 |
| width | `2px` | .b3-xt-bin::before · b3/board.css:3080 |
| top | `3px` | .b3-xt-bin::before · b3/board.css:3080 |
| bottom | `3px` | .b3-xt-bin::before · b3/board.css:3080 |
| left | `46px` | .b3-xt-bin::before · b3/board.css:3080 |
| border-radius | `1px` | .b3-xt-bin::before · b3/board.css:3080 |
| background | `color-mix(in srgb,var(--c) 75%,transparent)` | .b3-xt-bin::before · b3/board.css:3080 |
| background-color | `` | .b3-xt-bin::before · b3/board.css:3080 |
| background-image | `` | .b3-xt-bin::before · b3/board.css:3080 |
| content | `""` | .b3-xt-bin::before · b3/board.css:3080 |


### `div.b3-xt-ln.x-hd`

inside `.b3-xt-bin` · 1 on screen · **1 look**

#### the one look

`M3p-933` · rendered **438×22** · 1 instance look like this

```html
<div class="b3-xt-ln x-hd"><span class="b3-xt-no">1</span><span class="b3-xt-tx"><b>LOCUS</b><i> | </i>SNIPER</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-ln · b3/board.css:3082 |
| grid-template-columns | `36px minmax(0px, 1fr)` | `36px 402px` | .b3-xt-ln · b3/board.css:3082 |
| min-height | `22px` | `22px` | .b3-xt-ln · b3/board.css:3082 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| text-align | ↑ `left` | `left` | inherited · .b3-xt-ghost · b3/board.css:3097 |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `span.b3-xt-no`

inside `.b3-xt-ln` · 7 on screen · **1 look**

#### the one look

`M3p-934` · rendered **36×22** · 7 instances look like this · text “1”

```html
<span class="b3-xt-no">1</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `500 11px/22px var(--data)` | `` | .b3-xt-no · b3/board.css:3083 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .b3-xt-no · b3/board.css:3083 |
| font-size | `` | `11px` | .b3-xt-no · b3/board.css:3083 |
| font-weight | `` | `500` | .b3-xt-no · b3/board.css:3083 |
| font-style | `` | `normal` | .b3-xt-no · b3/board.css:3083 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .b3-xt-no · b3/board.css:3083 |
| line-height | `` | `22px` | .b3-xt-no · b3/board.css:3083 |
| letter-spacing | — | `normal` | initial |
| text-align | `right` | `right` | .b3-xt-no · b3/board.css:3083 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .b3-xt-no · b3/board.css:3083 |
| user-select | `none` | `none` | .b3-xt-no · b3/board.css:3083 |


### `span.b3-xt-tx`

inside `.b3-xt-ln` · 7 on screen · **2 looks**

#### look 1 of 2

`M3p-935` · rendered **402×22** · 5 instances look like this

```html
<span class="b3-xt-tx"><b>LOCUS</b><i> | </i>SNIPER</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `0 40px 0 22px` | `` | .b3-xt-tx · b3/board.css:3084 |
| padding-top | `0px` | `0px` | .b3-xt-tx · b3/board.css:3084 |
| padding-right | `40px` | `40px` | .b3-xt-tx · b3/board.css:3084 |
| padding-bottom | `0px` | `0px` | .b3-xt-tx · b3/board.css:3084 |
| padding-left | `22px` | `22px` | .b3-xt-tx · b3/board.css:3084 |
| font | `500 12.5px/22px var(--data)` | `` | .b3-xt-tx · b3/board.css:3084 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .b3-xt-tx · b3/board.css:3084 |
| font-size | `` | `12.5px` | .b3-xt-tx · b3/board.css:3084 |
| font-weight | `` | `500` | .b3-xt-tx · b3/board.css:3084 |
| font-style | `` | `normal` | .b3-xt-tx · b3/board.css:3084 |
| font-variant-numeric | `` | `normal` | .b3-xt-tx · b3/board.css:3084 |
| line-height | `` | `22px` | .b3-xt-tx · b3/board.css:3084 |
| letter-spacing | — | `normal` | initial |
| text-align | ↑ `left` | `left` | inherited · .b3-xt-ghost · b3/board.css:3097 |
| white-space | `pre-wrap` | `` | .b3-xt-tx · b3/board.css:3084 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .b3-xt-tx · b3/board.css:3084 |

#### look 2 of 2

`M3p-956` · rendered **402×22** · 2 instances look like this

```html
<span class="b3-xt-tx"><i>- </i>YKM Lightweight Short</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `0 40px 0 22px` | `` | .b3-xt-tx · b3/board.css:3084 |
| padding-top | `0px` | `0px` | .b3-xt-tx · b3/board.css:3084 |
| padding-right | `40px` | `40px` | .b3-xt-tx · b3/board.css:3084 |
| padding-bottom | `0px` | `0px` | .b3-xt-tx · b3/board.css:3084 |
| padding-left | `22px` | `22px` | .b3-xt-tx · b3/board.css:3084 |
| font | `500 12.5px/22px var(--data)` | `` | .b3-xt-tx · b3/board.css:3084 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .b3-xt-tx · b3/board.css:3084 |
| font-size | `` | `12.5px` | .b3-xt-tx · b3/board.css:3084 |
| font-weight | `` | `500` | .b3-xt-tx · b3/board.css:3084 |
| font-style | `` | `normal` | .b3-xt-tx · b3/board.css:3084 |
| font-variant-numeric | `` | `normal` | .b3-xt-tx · b3/board.css:3084 |
| line-height | `` | `22px` | .b3-xt-tx · b3/board.css:3084 |
| letter-spacing | — | `normal` | initial |
| text-align | ↑ `left` | `left` | inherited · .b3-xt-ghost · b3/board.css:3097 |
| white-space | `pre-wrap` | `` | .b3-xt-tx · b3/board.css:3084 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .b3-xt-ln.x-at .b3-xt-tx · b3/board.css:3088 |


### `div.b3-xt-ln.x-kv`

inside `.b3-xt-bin` · 4 on screen · **1 look**

#### the one look

`M3p-938` · rendered **438×22** · 4 instances look like this

```html
<div class="b3-xt-ln x-kv"><span class="b3-xt-no">2</span><span class="b3-xt-tx"><em>Build:</em> Build 1</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-ln · b3/board.css:3082 |
| grid-template-columns | `36px minmax(0px, 1fr)` | `36px 402px` | .b3-xt-ln · b3/board.css:3082 |
| min-height | `22px` | `22px` | .b3-xt-ln · b3/board.css:3082 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| text-align | ↑ `left` | `left` | inherited · .b3-xt-ghost · b3/board.css:3097 |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `div.b3-xt-ln.x-at`

inside `.b3-xt-bin` · 2 on screen · **1 look**

#### the one look

`M3p-954` · rendered **438×22** · 2 instances look like this

```html
<div class="b3-xt-ln x-at"><span class="b3-xt-no">6</span><span class="b3-xt-tx"><i>- </i>YKM Lightweight Short</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-ln · b3/board.css:3082 |
| grid-template-columns | `36px minmax(0px, 1fr)` | `36px 402px` | .b3-xt-ln · b3/board.css:3082 |
| min-height | `22px` | `22px` | .b3-xt-ln · b3/board.css:3082 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| text-align | ↑ `left` | `left` | inherited · .b3-xt-ghost · b3/board.css:3097 |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `span`

inside `.b3-xt-empty` · 1 on screen · **1 look**

#### the one look

`M3p-963` · rendered **335×78** · 1 instance look like this · text “Pick a build number on the left. It lands here i”

```html
<span>Pick a build number on the left. It land…</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| max-width | `40ch` | `335.14px` | .b3-xt-empty > span · b3/board.css:3095 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `500 13px/1.5 var(--ui)` | `` | .b3-xt-empty > span · b3/board.css:3095 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-xt-empty > span · b3/board.css:3095 |
| font-size | `` | `13px` | .b3-xt-empty > span · b3/board.css:3095 |
| font-weight | `` | `500` | .b3-xt-empty > span · b3/board.css:3095 |
| font-style | `` | `normal` | .b3-xt-empty > span · b3/board.css:3095 |
| font-variant-numeric | `` | `normal` | .b3-xt-empty > span · b3/board.css:3095 |
| line-height | `` | `19.5px` | .b3-xt-empty > span · b3/board.css:3095 |
| letter-spacing | — | `normal` | initial |
| text-align | ↑ `center` | `center` | inherited · .b3-xt-empty · b3/board.css:3094 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .b3-xt-empty > span · b3/board.css:3095 |


### `footer.b3-xf-f`

inside `.b3-xf` · 1 on screen · **1 look**

#### the one look

`M3p-964` · rendered **438×53** · 1 instance look like this

```html
<footer class="b3-xf-f"><div class="b3-xf-fid"></div><span class="b3-xf-fact"><button type="button" class="b3-btn2 sm" disabled="">⟨svg.ic⟩Copy</button><button type="button" class="b3-btn2 sm go" disabled="">⟨svg.ic⟩Download</button></span></footer>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xf-f · b3/board.css:4566 |
| grid-template-columns | `minmax(0px, 1fr) max-content` | `212.75px 181.25px` | .b3-xf-f · b3/board.css:4566 |
| gap | `8px` | `` | .b3-xf-f · b3/board.css:3727 |
| column-gap | `12px` | `12px` | .b3-xf-f · b3/board.css:4566 |
| row-gap | `8px` | `8px` | .b3-xf-f · b3/board.css:3727 |
| flex | `none` | `` | .b3-xf-f · b3/board.css:3065 |
| align-items | `center` | `center` | .b3-xf-f · b3/board.css:4566 |
| height | `auto` | `53px` | .b3-xf-f · b3/board.css:4566 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `10px 16px` | `` | .b3-xf-f · b3/board.css:4566 |
| padding-top | `10px` | `10px` | .b3-xf-f · b3/board.css:4566 |
| padding-right | `16px` | `16px` | .b3-xf-f · b3/board.css:4566 |
| padding-bottom | `10px` | `10px` | .b3-xf-f · b3/board.css:4566 |
| padding-left | `16px` | `16px` | .b3-xf-f · b3/board.css:4566 |
| border-top | `1px dashed var(--rule2)` | `` | .b3-xf-f, .b3-xf.shut .b3-xf-f · b3/board.css:3758 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| opacity | `0.55` | `0.55` | .b3-xf-none .b3-xf-f · b3/board.css:4041 |


### `div.b3-xf-fid`

inside `.b3-xf-f` · 1 on screen · **1 look**

#### the one look

`M3p-965` · rendered **213×0** · 1 instance look like this

```html
<div class="b3-xf-fid"></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-xf-fid · b3/board.css:4568 |
| gap | `8px` | `` | .b3-xf-fid · b3/board.css:4568 |
| column-gap | `8px` | `8px` | .b3-xf-fid · b3/board.css:4568 |
| row-gap | `8px` | `8px` | .b3-xf-fid · b3/board.css:4568 |
| flex-direction | `column` | `column` | .b3-xf-fid · b3/board.css:4568 |
| align-items | `flex-start` | `flex-start` | .b3-xf-fid · b3/board.css:4568 |
| min-width | `0px` | `0px` | .b3-xf-fid · b3/board.css:4568 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `span.b3-xf-fact`

inside `.b3-xf-f` · 1 on screen · **1 look**

#### the one look

`M3p-966` · rendered **181×32** · 1 instance look like this

```html
<span class="b3-xf-fact"><button type="button" class="b3-btn2 sm" disabled="">⟨svg.ic⟩Copy</button><button type="button" class="b3-btn2 sm go" disabled="">⟨svg.ic⟩Download</button></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-xf-fact · b3/board.css:4582 |
| gap | `8px` | `` | .b3-xf-fact · b3/board.css:4582 |
| column-gap | `8px` | `8px` | .b3-xf-fact · b3/board.css:4582 |
| row-gap | `8px` | `8px` | .b3-xf-fact · b3/board.css:4582 |
| align-self | `center` | `center` | .b3-xf-fact · b3/board.css:4582 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `button.b3-btn2.sm`

inside `.b3-xf-fact` · 1 on screen · **1 look**

#### the one look

`M3p-967` · rendered **73×32** · 1 instance look like this · type="button"

```html
<button type="button" class="b3-btn2 sm" disabled="">⟨svg.ic⟩Copy</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-btn2 · b3/board.css:801 |
| gap | `7px` | `` | .b3-btn2.sm · b3/board.css:1349 |
| column-gap | `7px` | `7px` | .b3-btn2.sm · b3/board.css:1349 |
| row-gap | `7px` | `7px` | .b3-btn2.sm · b3/board.css:1349 |
| flex | `none` | `` | .b3-btn2 · b3/board.css:801 |
| align-items | `center` | `center` | .b3-btn2 · b3/board.css:801 |
| height | `32px` | `32px` | .b3-btn2.sm · b3/board.css:1349 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · app.css:388 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `0 12px 0 10px` | `` | .b3-btn2.sm · b3/board.css:1349 |
| padding-top | `0px` | `0px` | .b3-btn2.sm · b3/board.css:1349 |
| padding-right | `12px` | `12px` | .b3-btn2.sm · b3/board.css:1349 |
| padding-bottom | `0px` | `0px` | .b3-btn2.sm · b3/board.css:1349 |
| padding-left | `10px` | `10px` | .b3-btn2.sm · b3/board.css:1349 |
| border | `0` | `` | .b3-btn2 · b3/board.css:801 |
| border-radius | `8px` | `` | .b3-xf-f .b3-btn2 · b3/board.css:3067 |
| background | `color-mix(in srgb,var(--sunk) 85%,transparent)` | `` | .b3-btn2 · b3/board.css:801 |
| background-color | `` | `color(srgb 0.0431373 0.0588235 0.0705882 / 0.85)` | .b3-btn2 · b3/board.css:801 |
| background-image | `` | `none` | .b3-btn2 · b3/board.css:801 |
| box-shadow | `var(--b3-ring)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .b3-btn2 · b3/board.css:801 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .b3-btn2 · b3/board.css:801 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-btn2 · b3/board.css:801 |
| font-size | `` | `12px` | .b3-btn2 · b3/board.css:801 |
| font-weight | `` | `600` | .b3-btn2 · b3/board.css:801 |
| font-style | `` | `normal` | .b3-btn2 · b3/board.css:801 |
| font-variant-numeric | `` | `normal` | .b3-btn2 · b3/board.css:801 |
| line-height | `` | `12px` | .b3-btn2 · b3/board.css:801 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | `nowrap` | `` | .b3-btn2 · b3/board.css:801 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .b3-btn2 · b3/board.css:801 |
| opacity | `0.45` | `0.45` | .b3-btn2:disabled · b3/board.css:1353 |
| transition | `background var(--dur-1) var(--ease),box-shadow var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | .b3-btn2 · b3/board.css:801 |
| cursor | `default` | `default` | .b3-btn2:disabled · b3/board.css:1353 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `color(srgb 0.0431373 0.0588235 0.0705882 / 0.85)` | `oklab(0.165465 -0.0044266 -0.0078463 / 0.85)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(1, 0, 0, 1, 0, 1)` |


### `button.b3-btn2.go.sm`

inside `.b3-xf-fact` · 1 on screen · **1 look**

#### the one look

`M3p-969` · rendered **100×32** · 1 instance look like this · type="button"

```html
<button type="button" class="b3-btn2 sm go" disabled="">⟨svg.ic⟩Download</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-btn2 · b3/board.css:801 |
| gap | `7px` | `` | .b3-btn2.sm · b3/board.css:1349 |
| column-gap | `7px` | `7px` | .b3-btn2.sm · b3/board.css:1349 |
| row-gap | `7px` | `7px` | .b3-btn2.sm · b3/board.css:1349 |
| flex | `none` | `` | .b3-btn2 · b3/board.css:801 |
| align-items | `center` | `center` | .b3-btn2 · b3/board.css:801 |
| height | `32px` | `32px` | .b3-btn2.sm · b3/board.css:1349 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · app.css:388 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `0 12px 0 10px` | `` | .b3-btn2.sm · b3/board.css:1349 |
| padding-top | `0px` | `0px` | .b3-btn2.sm · b3/board.css:1349 |
| padding-right | `12px` | `12px` | .b3-btn2.sm · b3/board.css:1349 |
| padding-bottom | `0px` | `0px` | .b3-btn2.sm · b3/board.css:1349 |
| padding-left | `10px` | `10px` | .b3-btn2.sm · b3/board.css:1349 |
| border | `0` | `` | .b3-btn2 · b3/board.css:801 |
| border-radius | `8px` | `` | .b3-xf-f .b3-btn2 · b3/board.css:3067 |
| background | `var(--ok)` | `` | .b3-btn2.go · b3/board.css:1351 |
| background-color | `` | `rgb(123, 219, 99)` | .b3-btn2.go · b3/board.css:1351 |
| background-image | `` | `none` | .b3-btn2.go · b3/board.css:1351 |
| box-shadow | `none` | `none` | .b3-btn2.go · b3/board.css:1351 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .b3-btn2 · b3/board.css:801 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-btn2 · b3/board.css:801 |
| font-size | `` | `12px` | .b3-btn2 · b3/board.css:801 |
| font-weight | `` | `600` | .b3-btn2 · b3/board.css:801 |
| font-style | `` | `normal` | .b3-btn2 · b3/board.css:801 |
| font-variant-numeric | `` | `normal` | .b3-btn2 · b3/board.css:801 |
| line-height | `` | `12px` | .b3-btn2 · b3/board.css:801 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | `nowrap` | `` | .b3-btn2 · b3/board.css:801 |
| color | `var(--on-ok)` | `rgb(7, 19, 10)` | .b3-btn2.go · b3/board.css:1351 |
| opacity | `0.45` | `0.45` | .b3-btn2:disabled · b3/board.css:1353 |
| filter | `grayscale(0.4)` | `grayscale(0.4)` | .chip:disabled, .btn:disabled, .go:disabled, .bulk button:disabled, .flag button:disabled · app.css:1580 |
| transition | `background var(--b3-d1) var(--ease),box-shadow var(--b3-d1) var(--ease),transform var(--b3-d1) var(--ease)` | `` | .b3-btn2.go · b3/board.css:4110 |
| cursor | `default` | `default` | .b3-btn2:disabled · b3/board.css:1353 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `rgb(123, 219, 99)` | `oklab(0.805967 -0.138767 0.117861)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `oklab(0.805967 -0.138767 0.117861 / 0.121057) 0px 0px 0px 1.21057px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| box-shadow | `none` | `oklab(0.805967 -0.138767 0.117861 / 0.121057) 0px 0px 0px 1.21057px` |
| transform | `none` | `matrix(1, 0, 0, 1, 0, 0)` |


### `div.b3-xt-peek`

inside `.b3-xt-side` · 1 on screen · **1 look**

#### the one look

`M3p-971` · rendered **404×24** · 1 instance look like this · aria-hidden="true"

```html
<div class="b3-xt-peek" aria-hidden="true"></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-peek · b3/board.css:3098 |
| position | `absolute` | `absolute` | .b3-xt-peek · b3/board.css:3098 |
| gap | `8px` | `` | .b3-xt-peek · b3/board.css:3098 |
| column-gap | `8px` | `8px` | .b3-xt-peek · b3/board.css:3098 |
| row-gap | `8px` | `8px` | .b3-xt-peek · b3/board.css:3098 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `12px 14px` | `` | .b3-xt-peek · b3/board.css:3098 |
| padding-top | `12px` | `12px` | .b3-xt-peek · b3/board.css:3098 |
| padding-right | `14px` | `14px` | .b3-xt-peek · b3/board.css:3098 |
| padding-bottom | `12px` | `12px` | .b3-xt-peek · b3/board.css:3098 |
| padding-left | `14px` | `14px` | .b3-xt-peek · b3/board.css:3098 |
| right | `14px` | `14px` | .b3-xt-peek · b3/board.css:3098 |
| bottom | `66px` | `66px` | .b3-xt-peek · b3/board.css:3098 |
| left | `14px` | `14px` | .b3-xt-peek · b3/board.css:3098 |
| border-radius | `10px` | `` | .b3-xt-peek · b3/board.css:3098 |
| background | `color-mix(in srgb,var(--raised) 92%,transparent)` | `` | .b3-xt-peek · b3/board.css:3098 |
| background-color | `` | `color(srgb 0.121569 0.152941 0.180392 / 0.92)` | .b3-xt-peek · b3/board.css:3098 |
| background-image | `` | `none` | .b3-xt-peek · b3/board.css:3098 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--c,var(--rule2)) 45%,transparent),0 16px 32px -18px var(--scrim-90)` | `color(srgb 0.227451 0.278431 0.321569 / 0.45) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.9) 0px 16px 32px -18px` | .b3-xt-peek · b3/board.css:3098 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| opacity | `0` | `0` | .b3-xt-peek · b3/board.css:3098 |
| transform | `translateY(8px) scale(0.98)` | `matrix(0.98, 0, 0, 0.98, 0, 8)` | .b3-xt-peek · b3/board.css:3098 |
| transition | `opacity 150ms cubic-bezier(.23,1,.32,1),transform 200ms cubic-bezier(.23,1,.32,1)` | `` | .b3-xt-peek · b3/board.css:3098 |
| pointer-events | `none` | `none` | .b3-xt-peek · b3/board.css:3098 |


### M3 · a file with builds in it

72 distinct signatures on screen; 28 not already specced above.


### `aside.drawer.open.wide[role=dialog]`

inside `.pb-stage` · 1 on screen · **1 look**

#### the one look

`M3f-2` · rendered **1100×746** · 1 instance look like this · aria-label="Pick builds to export" role="dialog"

```html
<aside class="drawer open wide" role="dialog" aria-modal="true" aria-label="Pick builds to export" style="--m1: #ff3b5c; --m2: var(--r-armory); --m3: var(--patch); --m4: var(--r-armory);"><header class="dw-h"><div class="dw-ttl"><h2>Pick builds to export</h2></div><div class="dw-nav"><button class="x bk" aria-label="Back">⟨svg.ic.sm⟩<b aria-hidden="true">Back</b></button><button class="x" aria-label="Close">⟨svg.ic.s
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .drawer · app.css:1361 |
| position | `absolute` | `absolute` | .g-stage .drawer · gates.css:165 |
| flex-direction | `column` | `column` | .drawer · app.css:1361 |
| width | `min(1100px, 100% - 48px)` | `1100px` | .drawer.wide:has(.b3-xt) · b3/board.css:2958 |
| max-width | `none` | `none` | .drawer.wide:has(.b3-xt) · b3/board.css:2958 |
| max-height | `min(84vh, 860px)` | `745.92px` | .drawer · app.css:1361 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| top | ⚠️ `50%` | `450px` | .drawer · app.css:1361 · **overridden — see computed** |
| left | ⚠️ `50%` | `574px` | .drawer · app.css:1361 · **overridden — see computed** |
| border | `1px solid var(--rule2)` | `` | .drawer · app.css:1361 |
| border-radius | `var(--rad-3)` | `` | .drawer · app.css:1361 |
| background | `radial-gradient(78% 210% at -8% 118%,color-mix(in srgb,var(--m1) 15%,transparent) 0,transparent 68%), radial-gradient(66% 190% at 26% -22%,color-mix(in srgb,var(--m3,var(--patch)) 13%,transparent) 0,transparent 66%), radial-gradient(72% 200% at 68% 132%,color-mix(in srgb,var(--m2) 12%,transparent) 0,transparent 70%), radial-gradient(60% 180% at 112% -16%,color-mix(in srgb,var(--m4,var(--r-armory)) 11%,transparent) 0,transparent 68%), radial-gradient(120% 120% at 50% 50%,transparent 38%,#00000055 100%), linear-gradient(180deg,#ffffff0a 0,transparent 26%), color-mix(in srgb,#0B0F12 42%,var(--raised))` | `` | html:is([data-b3-xbg="mesh"], [data-b3-xbg="ground"]) .drawer:has(.b3-xt) · b3/board.css:4214 |
| background-color | `` | `color(srgb 0.0886275 0.113412 0.134275)` | html:is([data-b3-xbg="mesh"], [data-b3-xbg="ground"]) .drawer:has(.b3-xt) · b3/board.css:4214 |
| background-image | `` | `radial-gradient(78% 210% at -8% 118%, color(srgb 1 0.231373 0.360784 / 0.15) 0px, rgba(0, 0, 0, 0) 68%), radial-gradient(66% 190% at 26% -22%, color(srgb 0.94902 0.760784 0.188235 / 0.13) 0px, rgba(0, 0, 0, 0) 66%), radial-gradient(72% 200% at 68% 132%, color(srgb 0.937255 0.266667 0.266667 / 0.12) 0px, rgba(0, 0, 0, 0) 70%), radial-gradient(60% 180% at 112% -16%, color(srgb 0.937255 0.266667 0.266667 / 0.11) 0px, rgba(0, 0, 0, 0) 68%), radial-gradient(120% 120%, rgba(0, 0, 0, 0) 38%, rgba(0, 0, 0, 0.333) 100%), linear-gradient(rgba(255, 255, 255, 0.04) 0px, rgba(0, 0, 0, 0) 26%), none` | html:is([data-b3-xbg="mesh"], [data-b3-xbg="ground"]) .drawer:has(.b3-xt) · b3/board.css:4214 |
| box-shadow | `0 40px 90px -20px var(--scrim-90),0 0 0 1px rgba(255,255,255,.04)` | `rgba(0, 0, 0, 0.9) 0px 40px 90px -20px, rgba(255, 255, 255, 0.04) 0px 0px 0px 1px` | .drawer · app.css:1361 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| opacity | `1` | `1` | .drawer.open · app.css:1366 |
| overflow | `hidden` | `` | .drawer · app.css:1361 |
| overflow-x | `hidden` | `hidden` | .drawer · app.css:1361 |
| overflow-y | `hidden` | `hidden` | .drawer · app.css:1361 |
| transform | `translate(-50%, -50%) scale(1)` | `matrix(1, 0, 0, 1, -550, -372.953)` | .drawer.open · app.css:1366 |
| transition | `opacity .18s,transform .18s cubic-bezier(.2,.8,.3,1)` | `` | .drawer · app.css:1361 |
| z-index | `45` | `45` | .drawer · app.css:1361 |
| pointer-events | `auto` | `auto` | .drawer.open · app.css:1366 |


### `b`

inside `.x` · 212 on screen · **3 looks**

#### look 1 of 3

`M3f-65` · rendered **7×13** · 1 instance look like this · text “1”

```html
<b>1</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `inline` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `500 var(--t-micro)/1 var(--data)` | `` | inherited · .b3-xt-wc · b3/board.css:3681 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .b3-xt-wc · b3/board.css:3681 |
| font-size | ↑ `` | `9.5px` | inherited · .b3-xt-wc · b3/board.css:3681 |
| font-weight | `700` | `700` | .b3-xt-wc b · b3/board.css:3682 |
| font-style | ↑ `` | `normal` | inherited · .b3-xt-wc · b3/board.css:3681 |
| font-variant-numeric | ↑ `tabular-nums` | `tabular-nums` | inherited · .b3-xt-wc · b3/board.css:3681 |
| line-height | ↑ `` | `9.5px` | inherited · .b3-xt-wc · b3/board.css:3681 |
| letter-spacing | ↑ `var(--b3-tr)` | `1.045px` | inherited · .b3-xt-wc · b3/board.css:3681 |
| color | `color-mix(in srgb,var(--c) 70%,white)` | `color(srgb 1 0.461961 0.552549)` | .b3-xt-wc b · b3/board.css:3682 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xt-w · b3/board.css:3674 |

#### look 2 of 3

`M3f-68` · rendered **10×13** · 1 instance look like this · text “1”

```html
<b>1</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .b3-xt-c b · b3/board.css:3685 |
| min-width | `10px` | `10px` | .b3-xt-c b · b3/board.css:3685 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `600 var(--t-base)/1 var(--ui)` | `` | .b3-xt-c b · b3/board.css:4196 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-xt-c b · b3/board.css:4196 |
| font-size | `` | `13px` | .b3-xt-c b · b3/board.css:4196 |
| font-weight | `` | `600` | .b3-xt-c b · b3/board.css:4196 |
| font-style | `` | `normal` | .b3-xt-c b · b3/board.css:4196 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .b3-xt-c b · b3/board.css:4196 |
| line-height | `` | `13px` | .b3-xt-c b · b3/board.css:4196 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | .b3-xt-c b · b3/board.css:3685 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .b3-xt-c[aria-pressed="true"] b · b3/board.css:3020 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xt-c · b3/board.css:3011 |

#### look 3 of 3

`M3f-947` · rendered **38×17** · 1 instance look like this · text “AK117”

```html
<b>AK117</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `inline` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `500 12.5px/22px var(--data)` | `` | inherited · .b3-xt-tx · b3/board.css:3084 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .b3-xt-tx · b3/board.css:3084 |
| font-size | ↑ `` | `12.5px` | inherited · .b3-xt-tx · b3/board.css:3084 |
| font-weight | `600` | `600` | .b3-xt-ln.x-hd .b3-xt-tx b · b3/board.css:3085 |
| font-style | ↑ `` | `normal` | inherited · .b3-xt-tx · b3/board.css:3084 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-xt-tx · b3/board.css:3084 |
| line-height | ↑ `` | `22px` | inherited · .b3-xt-tx · b3/board.css:3084 |
| letter-spacing | — | `normal` | initial |
| white-space | ↑ `pre-wrap` | `` | inherited · .b3-xt-tx · b3/board.css:3084 |
| color | `color-mix(in srgb,var(--c) 42%,white)` | `color(srgb 1 0.677176 0.731529)` | .b3-xt-ln.x-hd .b3-xt-tx b · b3/board.css:3085 |


### `button.b3-xt-all.b3-xt-every.chip`

inside `.b3-xt-row` · 1 on screen · **1 look**

#### the one look

`M3f-20` · rendered **103×44** · 1 instance look like this · aria-label="Pick every MP build shown, 1 of 125 pick" aria-pressed="mixed" type="button"

```html
<button type="button" class="chip b3-xt-all b3-xt-every" aria-pressed="mixed" aria-label="Pick every MP build shown, 1 of 125 picked"><span class="wg-cb" aria-hidden="true" aria-checked="mixed"><span class="cb"></span></span><span class="b3-xt-n" aria-hidden="true"><b>1</b> / 125</span><span class="b3-xt-w8" aria-hidden="true">Pick all</span></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .chip.b3-xt-all · b3/board.css:2990 |
| flex | `none` | `` | .b3-xt-every · b3/board.css:3688 |
| align-items | `center` | `center` | .chip.b3-xt-all · b3/board.css:2990 |
| justify-content | `center` | `center` | .chip · app.css:1242 |
| min-height | `32px` | `32px` | .chip.b3-xt-all · b3/board.css:2990 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `0 10px 0 9px` | `` | .chip.b3-xt-all · b3/board.css:2990 |
| padding-top | `0px` | `0px` | .chip.b3-xt-all · b3/board.css:2990 |
| padding-right | `10px` | `10px` | .chip.b3-xt-all · b3/board.css:2990 |
| padding-bottom | `0px` | `0px` | .chip.b3-xt-all · b3/board.css:2990 |
| padding-left | `9px` | `9px` | .chip.b3-xt-all · b3/board.css:2990 |
| margin-left | `auto` | `0px` | .chip.b3-xt-all · b3/board.css:2990 |
| border | `1px solid var(--rule2)` | `` | .chip · app.css:1242 |
| border-color | `color-mix(in srgb,var(--c) 60%,transparent)` | `` | .chip.b3-xt-all[aria-pressed="true"], .chip.b3-xt-all[aria-pressed="mixed"] · b3/board.css:2992 |
| border-radius | `8px` | `` | .chip.b3-xt-all · b3/board.css:2990 |
| background | `var(--sunk)` | `` | .chip.b3-xt-all · b3/board.css:2990 |
| background-color | `` | `rgb(11, 15, 18)` | .chip.b3-xt-all · b3/board.css:2990 |
| background-image | `` | `none` | .chip.b3-xt-all · b3/board.css:2990 |
| font | `inherit` | `` | button · app.css:621 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · app.css:621 |
| font-size | `var(--t-sm)` | `12px` | .chip · app.css:1242 |
| font-weight | `600` | `600` | .chip · app.css:1242 |
| font-style | `inherit` | `normal` | button · app.css:621 |
| font-variant-numeric | `inherit` | `normal` | button · app.css:621 |
| line-height | `inherit` | `18px` | button · app.css:621 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| text-decoration | `none` | `` | .chip · app.css:1242 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .chip · app.css:1242 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · app.css:5549 |
| cursor | `pointer` | `pointer` | button · app.css:621 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| transform | `none` | `matrix(1, 0, 0, 1, 0, 0)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| width | `102.625px` | `106.922px` |
| transform | `none` | `matrix(1, 0, 0, 1, 0, 0)` |


### `span.cb`

inside `.wg-cb` · 8 on screen · **1 look**

#### the one look

`M3f-22` · rendered **18×18** · 2 instances look like this

```html
<span class="cb"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .cb · app.css:1280 |
| position | `relative` | `relative` | .cb · app.css:1280 |
| width | `18px` | `18px` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| height | `18px` | `18px` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border | `0` | `` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| border-color | `var(--patch)` | `` | .wg-cb[aria-checked="mixed"] .cb · app.css:1122 |
| border-radius | `6px` | `` | html[data-b3-p4="b"] .cb · b3/board.css:723 |
| background | `linear-gradient(180deg,#F7D567,var(--patch))` | `` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb · b3/board.css:732 |
| background-color | `` | `rgba(0, 0, 0, 0)` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb · b3/board.css:732 |
| background-image | `` | `linear-gradient(rgb(247, 213, 103), rgb(242, 194, 48))` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb · b3/board.css:732 |
| box-shadow | `0 0 0 3px color-mix(in srgb,var(--patch) 18%,transparent)` | `color(srgb 0.94902 0.760784 0.188235 / 0.18) 0px 0px 0px 3px` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb · b3/board.css:732 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · app.css:621 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .chip · app.css:1242 |
| font-weight | ↑ `600` | `600` | inherited · .chip · app.css:1242 |
| font-style | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `18px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .chip · app.css:1242 |
| transition | `background var(--b3-d1) var(--ease),box-shadow var(--b3-d1) var(--ease)` | `` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| cursor | ↑ `inherit` | `pointer` | inherited · .b3-xt-all .wg-cb · b3/board.css:2991 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| width | `9px` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| height | `2px` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| top | `8px` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| left | `4.5px` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| border | `0` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| border-radius | `1px` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| background | `var(--on-accent)` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| background-color | `` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| background-image | `` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| clip-path | `inset(0px)` | html[data-b3-p4="a"] .wg-cb[aria-checked="mixed"] .cb::after, html[data-b3-p4="b"] .wg-cb[ · b3/board.css:287 |
| mask | `none` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| mask-image | `none` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| transform | `none` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| transition | `clip-path var(--b3-d2) cubic-bezier(.16,1,.3,1),background var(--b3-d1) var(--ease)` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:282 |
| content | `""` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |


### `button.b3-xt-all.chip`

inside `.b3-xt-sech` · 7 on screen · **1 look**

#### the one look

`M3f-53` · rendered **95×32** · 1 instance look like this · aria-label="Pick all Assault builds, 1 of 35 picked" aria-pressed="mixed" type="button"

```html
<button type="button" class="chip b3-xt-all" aria-pressed="mixed" aria-label="Pick all Assault builds, 1 of 35 picked"><span class="wg-cb" aria-hidden="true" aria-checked="mixed"><span class="cb"></span></span><span class="b3-xt-n" aria-hidden="true"><b>1</b> / 35</span><span class="b3-xt-w8" aria-hidden="true">Pick all</span></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .chip.b3-xt-all · b3/board.css:2990 |
| align-items | `center` | `center` | .chip.b3-xt-all · b3/board.css:2990 |
| justify-content | `center` | `center` | .chip · app.css:1242 |
| min-height | `32px` | `32px` | .chip.b3-xt-all · b3/board.css:2990 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `0 10px 0 9px` | `` | .chip.b3-xt-all · b3/board.css:2990 |
| padding-top | `0px` | `0px` | .chip.b3-xt-all · b3/board.css:2990 |
| padding-right | `10px` | `10px` | .chip.b3-xt-all · b3/board.css:2990 |
| padding-bottom | `0px` | `0px` | .chip.b3-xt-all · b3/board.css:2990 |
| padding-left | `9px` | `9px` | .chip.b3-xt-all · b3/board.css:2990 |
| margin-left | `auto` | `382.062px` | .chip.b3-xt-all · b3/board.css:2990 |
| border | `1px solid var(--rule2)` | `` | .chip · app.css:1242 |
| border-color | `color-mix(in srgb,var(--c) 60%,transparent)` | `` | .chip.b3-xt-all[aria-pressed="true"], .chip.b3-xt-all[aria-pressed="mixed"] · b3/board.css:2992 |
| border-radius | `8px` | `` | .chip.b3-xt-all · b3/board.css:2990 |
| background | `var(--sunk)` | `` | .chip.b3-xt-all · b3/board.css:2990 |
| background-color | `` | `rgb(11, 15, 18)` | .chip.b3-xt-all · b3/board.css:2990 |
| background-image | `` | `none` | .chip.b3-xt-all · b3/board.css:2990 |
| font | `inherit` | `` | button · app.css:621 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · app.css:621 |
| font-size | `var(--t-sm)` | `12px` | .chip · app.css:1242 |
| font-weight | `600` | `600` | .chip · app.css:1242 |
| font-style | `inherit` | `normal` | button · app.css:621 |
| font-variant-numeric | `inherit` | `normal` | button · app.css:621 |
| line-height | `inherit` | `18px` | button · app.css:621 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| text-decoration | `none` | `` | .chip · app.css:1242 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .chip · app.css:1242 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · app.css:5549 |
| cursor | `pointer` | `pointer` | button · app.css:621 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| transform | `none` | `matrix(1, 0, 0, 1, 0, 0)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| width | `94.8281px` | `99.125px` |
| margin-left | `382.062px` | `377.766px` |
| transform | `none` | `matrix(1, 0, 0, 1, 0, 0)` |


### `div.all.b3-xt-w`

inside `.b3-xt-tiles` · 1 on screen · **1 look**

#### the one look

`M3f-60` · rendered **181×82** · 1 instance look like this

```html
<div class="b3-xt-w all" style="--c: #ff3b5c;"><div class="b3-xt-wh"><button type="button" class="b3-xt-wn" aria-pressed="true" aria-label="Unpick every AK117 build"><b>AK117</b></button><span class="b3-xt-wc" aria-hidden="true"><b>1</b>/1</span></div><div class="b3-xt-cs" role="group" aria-label="AK117 builds"><button type="button" class="b3-xt-c" aria-pressed="true" aria-label="AK117 build 1"><b>1</b></button></div
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-w · b3/board.css:2999 |
| gap | `10px` | `` | .b3-xt-w · b3/board.css:3674 |
| column-gap | `10px` | `10px` | .b3-xt-w · b3/board.css:3674 |
| row-gap | `10px` | `10px` | .b3-xt-w · b3/board.css:3674 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `11px 12px 12px` | `` | .b3-xt-w · b3/board.css:3674 |
| padding-top | `11px` | `11px` | .b3-xt-w · b3/board.css:3674 |
| padding-right | `12px` | `12px` | .b3-xt-w · b3/board.css:3674 |
| padding-bottom | `12px` | `12px` | .b3-xt-w · b3/board.css:3674 |
| padding-left | `12px` | `12px` | .b3-xt-w · b3/board.css:3674 |
| margin | `0 0 8px` | `` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| margin-top | `0px` | `0px` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| margin-right | `0px` | `0px` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| margin-bottom | `8px` | `8px` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| margin-left | `0px` | `0px` | .b3-xt-tiles > .b3-xt-w · b3/board.css:4399 |
| border | `1px solid var(--rule2)` | `` | .b3-xt-w · b3/board.css:2999 |
| border-color | `color-mix(in srgb,var(--c) 80%,transparent)` | `` | .b3-xt-w.all · b3/board.css:3003 |
| border-radius | `8px` | `` | .b3-xt-w · b3/board.css:2999 |
| background | `color-mix(in srgb,var(--c) 10%,var(--raised))` | `` | .b3-xt-w.all · b3/board.css:3003 |
| background-color | `` | `color(srgb 0.209412 0.160784 0.198431)` | .b3-xt-w.all · b3/board.css:3003 |
| background-image | `` | `none` | .b3-xt-w.all · b3/board.css:3003 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--c) 80%,transparent)` | `color(srgb 1 0.231373 0.360784 / 0.8) 0px 0px 0px 1px inset` | .b3-xt-w.all · b3/board.css:3678 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| transition | `border-color var(--b3-d1),box-shadow var(--b3-d1),background var(--b3-d1)` | `` | .b3-xt-w · b3/board.css:3674 |
| cursor | `pointer` | `pointer` | .b3-xt-w · b3/board.css:3674 |


### `span.b3-xt-wc`

inside `.b3-xt-wh` · 1 on screen · **1 look**

#### the one look

`M3f-64` · rendered **20×10** · 1 instance look like this · aria-hidden="true"

```html
<span class="b3-xt-wc" aria-hidden="true"><b>1</b>/1</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .b3-xt-wc · b3/board.css:3681 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| margin-left | `auto` | `0px` | .b3-xt-wc · b3/board.css:3681 |
| font | `500 var(--t-micro)/1 var(--data)` | `` | .b3-xt-wc · b3/board.css:3681 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .b3-xt-wc · b3/board.css:3681 |
| font-size | `` | `9.5px` | .b3-xt-wc · b3/board.css:3681 |
| font-weight | `` | `500` | .b3-xt-wc · b3/board.css:3681 |
| font-style | `` | `normal` | .b3-xt-wc · b3/board.css:3681 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .b3-xt-wc · b3/board.css:3681 |
| line-height | `` | `9.5px` | .b3-xt-wc · b3/board.css:3681 |
| letter-spacing | `var(--b3-tr)` | `1.045px` | .b3-xt-wc · b3/board.css:3681 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .b3-xt-w.some .b3-xt-wc, .b3-xt-w.all .b3-xt-wc · b3/board.css:3683 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xt-w · b3/board.css:3674 |


### `button.b3-xt-c`

inside `.b3-xt-cs` · 125 on screen · **1 look**

#### the one look

`M3f-67` · rendered **32×30** · 1 instance look like this · aria-label="AK117 build 1" aria-pressed="true" type="button"

```html
<button type="button" class="b3-xt-c" aria-pressed="true" aria-label="AK117 build 1"><b>1</b></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-xt-c · b3/board.css:3011 |
| gap | `5px` | `` | .b3-xt-c · b3/board.css:3011 |
| column-gap | `5px` | `5px` | .b3-xt-c · b3/board.css:3011 |
| row-gap | `5px` | `5px` | .b3-xt-c · b3/board.css:3011 |
| align-items | `center` | `center` | .b3-xt-c · b3/board.css:3011 |
| justify-content | `center` | `center` | .b3-xt-c · b3/board.css:3011 |
| min-width | `32px` | `32px` | .b3-xt-c · b3/board.css:3011 |
| height | `30px` | `30px` | .b3-xt-c · b3/board.css:3011 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · app.css:388 |
| box-sizing | `border-box` | `border-box` | .b3-xt-c · b3/board.css:3011 |
| padding | `0 9px` | `` | .b3-xt-c · b3/board.css:3011 |
| padding-top | `0px` | `0px` | .b3-xt-c · b3/board.css:3011 |
| padding-right | `9px` | `9px` | .b3-xt-c · b3/board.css:3011 |
| padding-bottom | `0px` | `0px` | .b3-xt-c · b3/board.css:3011 |
| padding-left | `9px` | `9px` | .b3-xt-c · b3/board.css:3011 |
| border | `0` | `` | button · app.css:621 |
| border-radius | `6px` | `` | .b3-xt-c · b3/board.css:3011 |
| background | `color-mix(in srgb,var(--c) 34%,var(--sunk))` | `` | .b3-xt-c[aria-pressed="true"] · b3/board.css:3019 |
| background-color | `` | `color(srgb 0.368471 0.11749 0.169255)` | .b3-xt-c[aria-pressed="true"] · b3/board.css:3019 |
| background-image | `` | `none` | .b3-xt-c[aria-pressed="true"] · b3/board.css:3019 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--c) 80%,transparent)` | `color(srgb 1 0.231373 0.360784 / 0.8) 0px 0px 0px 1px inset` | .b3-xt-c[aria-pressed="true"] · b3/board.css:3019 |
| font | `inherit` | `` | button · app.css:621 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · app.css:621 |
| font-size | `inherit` | `13px` | button · app.css:621 |
| font-weight | `inherit` | `400` | button · app.css:621 |
| font-style | `inherit` | `normal` | button · app.css:621 |
| font-variant-numeric | `inherit` | `normal` | button · app.css:621 |
| line-height | `inherit` | `19.5px` | button · app.css:621 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `start` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `inherit` | `rgb(232, 237, 241)` | button · app.css:621 |
| transition | `background 140ms ease-out,box-shadow 140ms ease-out` | `` | .b3-xt-c · b3/board.css:3011 |
| cursor | `pointer` | `pointer` | .b3-xt-c · b3/board.css:3011 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `color(srgb 0.368471 0.11749 0.169255)` | `oklab(0.338361 0.091842 0.0181687)` |
| box-shadow | `color(srgb 1 0.231373 0.360784 / 0.8) 0px 0px 0px 1px inset` | `oklab(0.660024 0.218116 0.0686708 / 0.8) 0px 0px 0px 1px inset` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `1px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `svg.ic`

inside `.—` · 109 on screen · **1 look**

#### the one look

`M3f-982` · rendered **12×12** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic" aria-hidden="true"><use href="#i-x"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · app.css:6457 |
| flex | `none` | `` | .ic · b2.css:4 |
| width | `12px` | `12px` | .b3-xt-rm .ic · b3/board.css:3092 |
| height | `12px` | `12px` | .b3-xt-rm .ic · b3/board.css:3092 |
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
| text-align | ↑ `center` | `start` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink4)` | `rgb(92, 106, 117)` | inherited · .b3-xt-rm · b3/board.css:3089 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xt-rm · b3/board.css:3089 |
| pointer-events | `none` | `none` | button .ic, a .ic · app.css:6464 |


### `section.b3-xf`

inside `.b3-xt-files` · 1 on screen · **1 look**

#### the one look

`M3f-926` · rendered **440×651** · 1 instance look like this · aria-label="dioreo-mp-2026-09-21.txt"

```html
<section class="b3-xf" data-fk="MP-1" aria-label="dioreo-mp-2026-09-21.txt" style="--m: #FF3B5C;"><header class="b3-xf-h"><strong class="b3-xf-t" aria-label="1 MP build"><i class="b3-xf-sq" aria-hidden="true">1</i>MP build</strong><span class="b3-xf-acts"><button type="button" class="b3-xf-ib dang" aria-label="Clear dioreo-mp-2026-09-21.txt">⟨svg.ic⟩<span class="b3-xf-ibl"><span>Clear</span></span></button><span clas
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-xf · b3/board.css:3037 |
| position | `relative` | `relative` | .dk, .exs-i, .exs-pick, .b3-tk, .b3-xf, .pb-enc, .b3-sd · gates.css:868 |
| flex | `0 0 auto` | `` | .b3-xf, .b3-xf.shut · b3/board.css:3815 |
| flex-direction | `column` | `column` | .b3-xf · b3/board.css:3037 |
| min-width | `0px` | `0px` | main .panel, main section · app.css:680 |
| min-height | `0px` | `0px` | .b3-xf:not(.shut) · b3/board.css:4517 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border | `1px solid var(--b3-edge,var(--rule2))` | `` | .dk, .exs-i, .exs-pick, .b3-tk, .b3-xf, .pb-enc, .b3-sd · gates.css:868 |
| border-radius | `12px` | `` | .b3-xf · b3/board.css:3037 |
| outline | `0` | `` | .dk, .exs-i, .exs-pick, .b3-tk, .b3-xf, .pb-enc, .b3-sd · gates.css:868 |
| outline-offset | `-1px` | `-1px` | .b3-tk, .b3-xf, .pb-enc, .b3-sd · b3/board.css:4057 |
| background | `linear-gradient(180deg,color-mix(in srgb,var(--m) 6%,var(--sunk)),var(--sunk) 64px)` | `` | .b3-xf · b3/board.css:3748 |
| background-color | `` | `rgba(0, 0, 0, 0)` | .b3-xf · b3/board.css:3748 |
| background-image | `` | `linear-gradient(color(srgb 0.100549 0.0691765 0.088), rgb(11, 15, 18) 64px)` | .b3-xf · b3/board.css:3748 |
| box-shadow | `inset 0 1px 0 color-mix(in srgb,var(--m) 35%,transparent)` | `color(srgb 1 0.231373 0.360784 / 0.35) 0px 1px 0px 0px inset` | .b3-xf · gates.css:872 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| overflow | `clip` | `` | .b3-xf · b3/board.css:3037 |
| overflow-x | `clip` | `clip` | .b3-xf · b3/board.css:3037 |
| overflow-y | `clip` | `clip` | .b3-xf · b3/board.css:3037 |
| transition | `flex-grow var(--xf-dur) var(--xf-ease)` | `` | .b3-xf, .b3-xf.shut · b3/board.css:4502 |
| animation | `b3xfin 360ms cubic-bezier(.22,1,.36,1) backwards` | `` | .b3-xf · b3/board.css:3111 |


### `header.b3-xf-h`

inside `.b3-xf` · 1 on screen · **1 look**

#### the one look

`M3f-927` · rendered **438×58** · 1 instance look like this

```html
<header class="b3-xf-h"><strong class="b3-xf-t" aria-label="1 MP build"><i class="b3-xf-sq" aria-hidden="true">1</i>MP build</strong><span class="b3-xf-acts"><button type="button" class="b3-xf-ib dang" aria-label="Clear dioreo-mp-2026-09-21.txt">⟨svg.ic⟩<span class="b3-xf-ibl"><span>Clear</span></span></button><span class="b3-xf-div" aria-hidden="true"></span><button type="button" class="b3-xf-ib" aria-expanded="true
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-xf-h · b3/board.css:4451 |
| position | `relative` | `relative` | .b3-xf-h · b3/board.css:3704 |
| grid-template-columns | `var(--xf-nw,53px) minmax(0,1fr) auto` | `53px minmax(0px, 1fr) auto` | .b3-xf-h · b3/board.css:3847 |
| grid-template-rows | `22px 34px` | `22px 34px` | .b3-xf-h · b3/board.css:3850 |
| grid-column | `1/-1` | `` | header · app.css:682 |
| gap | `14px` | `` | .b3-xf-h · b3/board.css:3660 |
| column-gap | `16px` | `16px` | .b3-xf-h · b3/board.css:4451 |
| row-gap | `8px` | `8px` | .b3-xf-h · b3/board.css:3799 |
| flex | `none` | `` | .b3-xf-h · b3/board.css:3041 |
| align-items | `center` | `center` | .b3-xf-h · b3/board.css:4451 |
| justify-content | `space-between` | `space-between` | .b3-xf-h · b3/board.css:4451 |
| min-width | `0px` | `0px` | header · app.css:1427 |
| height | `58px` | `58px` | .b3-xf-h · b3/board.css:4451 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `0 16px` | `` | .b3-xf-h · b3/board.css:4451 |
| padding-top | `0px` | `0px` | .b3-xf-h · b3/board.css:4451 |
| padding-right | `16px` | `16px` | .b3-xf-h · b3/board.css:4451 |
| padding-bottom | `0px` | `0px` | .b3-xf-h · b3/board.css:4451 |
| padding-left | `16px` | `16px` | .b3-xf-h · b3/board.css:4451 |
| top | `0px` | `0px` | header · app.css:682 |
| border-bottom | `0` | `` | .b3-xf-h, .b3-xf.shut .b3-xf-h · b3/board.css:3757 |
| background | `var(--paper)` | `` | header · app.css:682 |
| background-color | `` | `rgb(23, 30, 36)` | header · app.css:682 |
| background-image | `` | `none` | header · app.css:682 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| z-index | `40` | `40` | header · app.css:682 |


### `strong.b3-xf-t`

inside `.b3-xf-h` · 1 on screen · **1 look**

#### the one look

`M3f-928` · rendered **141×40** · 1 instance look like this · aria-label="1 MP build"

```html
<strong class="b3-xf-t" aria-label="1 MP build"><i class="b3-xf-sq" aria-hidden="true">1</i>MP build</strong>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| position | `static` | `static` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| grid-column | `2` | `` | .b3-xf-h > .b3-xf-t · b3/board.css:3802 |
| grid-row | `2` | `` | .b3-xf-h > .b3-xf-t · b3/board.css:3802 |
| gap | `16px` | `` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| column-gap | `16px` | `16px` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| row-gap | `16px` | `16px` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| flex | `0 1 auto` | `` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| align-items | `center` | `center` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| align-self | `center` | `center` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| min-width | `0px` | `0px` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| height | `40px` | `40px` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| margin | `0` | `` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| margin-top | `0px` | `0px` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| margin-right | `0px` | `0px` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| margin-bottom | `0px` | `0px` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| margin-left | `0px` | `0px` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| top | `auto` | `auto` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| font | `600 21px/40px var(--ui)` | `` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| font-size | `` | `21px` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| font-weight | `` | `600` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| font-style | `` | `normal` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| font-variant-numeric | `` | `normal` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| line-height | `` | `40px` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| letter-spacing | `-0.012em` | `-0.252px` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| white-space | `nowrap` | `` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .b3-xf-h > .b3-xf-t · b3/board.css:4454 |


### `span.b3-xf-acts`

inside `.b3-xf-h` · 1 on screen · **1 look**

#### the one look

`M3f-930` · rendered **176×28** · 1 instance look like this

```html
<span class="b3-xf-acts"><button type="button" class="b3-xf-ib dang" aria-label="Clear dioreo-mp-2026-09-21.txt">⟨svg.ic⟩<span class="b3-xf-ibl"><span>Clear</span></span></button><span class="b3-xf-div" aria-hidden="true"></span><button type="button" class="b3-xf-ib" aria-expanded="true" aria-label="Collapse dioreo-mp-2026-09-21.txt">⟨svg.ic.ic-fold⟩<span class="b3-xf-ibl"><span>Collapse</span></span></button></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-xf-acts · b3/board.css:4473 |
| flex | `0 0 auto` | `` | .b3-xf-acts · b3/board.css:4473 |
| align-items | `center` | `center` | .b3-xf-acts · b3/board.css:4473 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `button.b3-xf-ib.dang`

inside `.b3-xf-acts` · 1 on screen · **1 look**

#### the one look

`M3f-931` · rendered **62×28** · 1 instance look like this · aria-label="Clear dioreo-mp-2026-09-21.txt" type="button"

```html
<button type="button" class="b3-xf-ib dang" aria-label="Clear dioreo-mp-2026-09-21.txt">⟨svg.ic⟩<span class="b3-xf-ibl"><span>Clear</span></span></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-xf-ib · b3/board.css:4475 |
| position | `relative` | `relative` | .b3-xf-ib · b3/board.css:4475 |
| align-items | `center` | `center` | .b3-xf-ib · b3/board.css:4475 |
| height | `28px` | `28px` | .b3-xf-ib · b3/board.css:4475 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · app.css:388 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `0 7px` | `` | .b3-xf-ib · b3/board.css:4475 |
| padding-top | `0px` | `0px` | .b3-xf-ib · b3/board.css:4475 |
| padding-right | `7px` | `7px` | .b3-xf-ib · b3/board.css:4475 |
| padding-bottom | `0px` | `0px` | .b3-xf-ib · b3/board.css:4475 |
| padding-left | `7px` | `7px` | .b3-xf-ib · b3/board.css:4475 |
| border | `0` | `` | .b3-xf-ib · b3/board.css:4475 |
| border-radius | `var(--rad-2)` | `` | .b3-xf-ib · b3/board.css:4475 |
| outline | `1px solid var(--rule2)` | `` | .b3-xf-ib · b3/board.css:4475 |
| outline-offset | `-1px` | `-1px` | .b3-xf-ib · b3/board.css:4475 |
| background | `var(--raised)` | `` | .b3-xf-ib · b3/board.css:4475 |
| background-color | `` | `rgb(31, 39, 46)` | .b3-xf-ib · b3/board.css:4475 |
| background-image | `` | `none` | .b3-xf-ib · b3/board.css:4475 |
| font | `inherit` | `` | button · app.css:621 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · app.css:621 |
| font-size | `inherit` | `13px` | button · app.css:621 |
| font-weight | `inherit` | `400` | button · app.css:621 |
| font-style | `inherit` | `normal` | button · app.css:621 |
| font-variant-numeric | `inherit` | `normal` | button · app.css:621 |
| line-height | `inherit` | `19.5px` | button · app.css:621 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .b3-xf-ib · b3/board.css:4475 |
| transition | `background var(--b3-d1),color var(--b3-d1)` | `` | .b3-xf-ib · b3/board.css:4475 |
| cursor | `pointer` | `pointer` | .b3-xf-ib · b3/board.css:4475 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .b3-xf-ib::after · b3/board.css:4482 |
| inset | `-8px -4px` | .b3-xf-ib::after · b3/board.css:4482 |
| top | `-8px` | .b3-xf-ib::after · b3/board.css:4482 |
| right | `-4px` | .b3-xf-ib::after · b3/board.css:4482 |
| bottom | `-8px` | .b3-xf-ib::after · b3/board.css:4482 |
| left | `-4px` | .b3-xf-ib::after · b3/board.css:4482 |
| content | `""` | .b3-xf-ib::after · b3/board.css:4482 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `rgb(31, 39, 46)` | `oklab(0.268059 -0.0073393 -0.0156964)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `span.b3-xf-ibl`

inside `.b3-xf-ib` · 2 on screen · **1 look**

#### the one look

`M3f-933` · rendered **28×12** · 2 instances look like this

```html
<span class="b3-xf-ibl"><span>Clear</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-xf-ibl · b3/board.css:4486 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| margin-left | `6px` | `6px` | .b3-xf-ibl · b3/board.css:4486 |
| font | ↑ `inherit` | `` | inherited · button · app.css:621 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · app.css:621 |
| font-size | ↑ `inherit` | `13px` | inherited · button · app.css:621 |
| font-weight | ↑ `inherit` | `400` | inherited · button · app.css:621 |
| font-style | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · app.css:621 |
| line-height | ↑ `inherit` | `19.5px` | inherited · button · app.css:621 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .b3-xf-ib · b3/board.css:4475 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xf-ib · b3/board.css:4475 |


### `span`

inside `.b3-xf-ibl` · 2 on screen · **1 look**

#### the one look

`M3f-934` · rendered **28×12** · 2 instances look like this · text “Clear”

```html
<span>Clear</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `500 11.5px/1 var(--ui)` | `` | .b3-xf-ibl > span · b3/board.css:4487 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-xf-ibl > span · b3/board.css:4487 |
| font-size | `` | `11.5px` | .b3-xf-ibl > span · b3/board.css:4487 |
| font-weight | `` | `500` | .b3-xf-ibl > span · b3/board.css:4487 |
| font-style | `` | `normal` | .b3-xf-ibl > span · b3/board.css:4487 |
| font-variant-numeric | `` | `normal` | .b3-xf-ibl > span · b3/board.css:4487 |
| line-height | `` | `11.5px` | .b3-xf-ibl > span · b3/board.css:4487 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | `nowrap` | `` | .b3-xf-ibl > span · b3/board.css:4487 |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .b3-xf-ib · b3/board.css:4475 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xf-ib · b3/board.css:4475 |


### `span.b3-xf-div`

inside `.b3-xf-acts` · 1 on screen · **1 look**

#### the one look

`M3f-935` · rendered **1×20** · 1 instance look like this · aria-hidden="true"

```html
<span class="b3-xf-div" aria-hidden="true"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `0 0 auto` | `` | .b3-xf-div · b3/board.css:4474 |
| width | `1px` | `1px` | .b3-xf-div · b3/board.css:4474 |
| height | `20px` | `20px` | .b3-xf-div · b3/board.css:4474 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| margin | `0 16px` | `` | .b3-xf-div · b3/board.css:4474 |
| margin-top | `0px` | `0px` | .b3-xf-div · b3/board.css:4474 |
| margin-right | `16px` | `16px` | .b3-xf-div · b3/board.css:4474 |
| margin-bottom | `0px` | `0px` | .b3-xf-div · b3/board.css:4474 |
| margin-left | `16px` | `16px` | .b3-xf-div · b3/board.css:4474 |
| background | `var(--rule2)` | `` | .b3-xf-div · b3/board.css:4474 |
| background-color | `` | `rgb(58, 71, 82)` | .b3-xf-div · b3/board.css:4474 |
| background-image | `` | `none` | .b3-xf-div · b3/board.css:4474 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `button.b3-xf-ib`

inside `.b3-xf-acts` · 1 on screen · **1 look**

#### the one look

`M3f-936` · rendered **81×28** · 1 instance look like this · aria-label="Collapse dioreo-mp-2026-09-21.txt" aria-expanded="true" type="button"

```html
<button type="button" class="b3-xf-ib" aria-expanded="true" aria-label="Collapse dioreo-mp-2026-09-21.txt">⟨svg.ic.ic-fold⟩<span class="b3-xf-ibl"><span>Collapse</span></span></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-xf-ib · b3/board.css:4475 |
| position | `relative` | `relative` | .b3-xf-ib · b3/board.css:4475 |
| align-items | `center` | `center` | .b3-xf-ib · b3/board.css:4475 |
| height | `28px` | `28px` | .b3-xf-ib · b3/board.css:4475 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · app.css:388 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `0 7px` | `` | .b3-xf-ib · b3/board.css:4475 |
| padding-top | `0px` | `0px` | .b3-xf-ib · b3/board.css:4475 |
| padding-right | `7px` | `7px` | .b3-xf-ib · b3/board.css:4475 |
| padding-bottom | `0px` | `0px` | .b3-xf-ib · b3/board.css:4475 |
| padding-left | `7px` | `7px` | .b3-xf-ib · b3/board.css:4475 |
| border | `0` | `` | .b3-xf-ib · b3/board.css:4475 |
| border-radius | `var(--rad-2)` | `` | .b3-xf-ib · b3/board.css:4475 |
| outline | `1px solid var(--rule2)` | `` | .b3-xf-ib · b3/board.css:4475 |
| outline-offset | `-1px` | `-1px` | .b3-xf-ib · b3/board.css:4475 |
| background | `var(--raised)` | `` | .b3-xf-ib · b3/board.css:4475 |
| background-color | `` | `rgb(31, 39, 46)` | .b3-xf-ib · b3/board.css:4475 |
| background-image | `` | `none` | .b3-xf-ib · b3/board.css:4475 |
| font | `inherit` | `` | button · app.css:621 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · app.css:621 |
| font-size | `inherit` | `13px` | button · app.css:621 |
| font-weight | `inherit` | `400` | button · app.css:621 |
| font-style | `inherit` | `normal` | button · app.css:621 |
| font-variant-numeric | `inherit` | `normal` | button · app.css:621 |
| line-height | `inherit` | `19.5px` | button · app.css:621 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .b3-xf-ib · b3/board.css:4475 |
| transition | `background var(--b3-d1),color var(--b3-d1)` | `` | .b3-xf-ib · b3/board.css:4475 |
| cursor | `pointer` | `pointer` | .b3-xf-ib · b3/board.css:4475 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .b3-xf-ib::after · b3/board.css:4482 |
| inset | `-8px -4px` | .b3-xf-ib::after · b3/board.css:4482 |
| top | `-8px` | .b3-xf-ib::after · b3/board.css:4482 |
| right | `-4px` | .b3-xf-ib::after · b3/board.css:4482 |
| bottom | `-8px` | .b3-xf-ib::after · b3/board.css:4482 |
| left | `-4px` | .b3-xf-ib::after · b3/board.css:4482 |
| content | `""` | .b3-xf-ib::after · b3/board.css:4482 |

**:hover** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `svg.ic.ic-fold`

inside `.b3-xf-ib` · 1 on screen · **1 look**

#### the one look

`M3f-937` · rendered **14×14** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic ic-fold" aria-hidden="true"><use href="#i-b2-fold"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · app.css:6457 |
| flex | `0 0 auto` | `` | .b3-xf-ib .ic · b3/board.css:4480 |
| width | `14px` | `14px` | .b3-xf-ib .ic · b3/board.css:4480 |
| height | `14px` | `14px` | .b3-xf-ib .ic · b3/board.css:4480 |
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
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .b3-xf-ib · b3/board.css:4475 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-xf-ib · b3/board.css:4475 |
| pointer-events | `none` | `none` | button .ic, a .ic · app.css:6464 |


### `div.b3-xf-bw`

inside `.b3-xf` · 1 on screen · **1 look**

#### the one look

`M3f-940` · rendered **438×518** · 1 instance look like this

```html
<div class="b3-xf-bw"><div class="b3-xf-b b3-fady" role="list" style="--fo: 0px; --ft: 0px; --fb: 0px;"><div class="b3-xt-blk fresh" role="listitem" data-id="6a4c692095a4f5a6c337548a" style="--c: #ff3b5c;"><div class="b3-xt-bin"><div class="b3-xt-ln x-hd"><span class="b3-xt-no">1</span><span class="b3-xt-tx"><b>AK117</b><i> | </i>AR</span></div><div class="b3-xt-ln x-kv"><span class="b3-xt-no">2</span><span class="b3
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xf-bw · b3/board.css:3059 |
| grid-template-rows | `minmax(0px, 1fr)` | `517.906px` | .b3-xf-bw, .b3-xf.shut .b3-xf-bw · b3/board.css:3817 |
| flex | `1 1 0` | `` | .b3-xf-bw, .b3-xf.shut .b3-xf-bw · b3/board.css:3817 |
| min-height | `0px` | `0px` | .b3-xf-bw, .b3-xf.shut .b3-xf-bw · b3/board.css:3817 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border-top | `0` | `` | .b3-xf-bw · b3/board.css:3725 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| opacity | `1` | `1` | .b3-xf-bw, .b3-xf.shut .b3-xf-bw · b3/board.css:3817 |
| overflow | `hidden` | `` | .b3-xf-bw · b3/board.css:3059 |
| overflow-x | `hidden` | `hidden` | .b3-xf-bw · b3/board.css:3059 |
| overflow-y | `hidden` | `hidden` | .b3-xf-bw · b3/board.css:3059 |
| transition | `none` | `` | .b3-xf-bw, .b3-xf.shut .b3-xf-bw · b3/board.css:3817 |


### `div.b3-fady.b3-xf-b[role=list]`

inside `.b3-xf-bw` · 1 on screen · **1 look**

#### the one look

`M3f-941` · rendered **438×518** · 1 instance look like this · role="list"

```html
<div class="b3-xf-b b3-fady" role="list" style="--fo: 0px; --ft: 0px; --fb: 0px;"><div class="b3-xt-blk fresh" role="listitem" data-id="6a4c692095a4f5a6c337548a" style="--c: #ff3b5c;"><div class="b3-xt-bin"><div class="b3-xt-ln x-hd"><span class="b3-xt-no">1</span><span class="b3-xt-tx"><b>AK117</b><i> | </i>AR</span></div><div class="b3-xt-ln x-kv"><span class="b3-xt-no">2</span><span class="b3-xt-tx"><em>Build:</em
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| min-height | `0px` | `0px` | .b3-xf-b · b3/board.css:3062 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `12px 0 72px` | `` | .b3-xf-b, .b3-xf.shut .b3-xf-b · b3/board.css:3818 |
| padding-top | `12px` | `12px` | .b3-xf-b, .b3-xf.shut .b3-xf-b · b3/board.css:3818 |
| padding-right | `0px` | `0px` | .b3-xf-b, .b3-xf.shut .b3-xf-b · b3/board.css:3818 |
| padding-bottom | `72px` | `72px` | .b3-xf-b, .b3-xf.shut .b3-xf-b · b3/board.css:3818 |
| padding-left | `0px` | `0px` | .b3-xf-b, .b3-xf.shut .b3-xf-b · b3/board.css:3818 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| overflow-y | `auto` | `auto` | .b3-xf-b · b3/board.css:3062 |
| mask-image | `linear-gradient(to bottom,#000 0,#000 var(--fo,0px),rgb(0 0 0/0) var(--fo,0px),rgb(0 0 0/.3) calc(var(--fo,0px) + var(--ft,0px)*.45),rgb(0 0 0/.78) calc(var(--fo,0px) + var(--ft,0px)*.8),#000 calc(var(--fo,0px) + var(--ft,0px)),#000 calc(100% - var(--fb,0px)),rgb(0 0 0/.78) calc(100% - var(--fb,0px)*.8),rgb(0 0 0/.3) calc(100% - var(--fb,0px)*.45),rgb(0 0 0/0) 100%)` | `linear-gradient(rgb(0, 0, 0) 0px, rgb(0, 0, 0) 0px, rgba(0, 0, 0, 0) 0px, rgba(0, 0, 0, 0.3) 0px, rgba(0, 0, 0, 0.78) 0px, rgb(0, 0, 0) 0px, rgb(0, 0, 0) 100%, rgba(0, 0, 0, 0.78) 100%, rgba(0, 0, 0, 0.3) 100%, rgba(0, 0, 0, 0) 100%)` | .b3-fady, .b3-sd-rows, .b3-cmdl, .b3dock-list, .b3dock-cur, .b3-sd-chips:has(.b3-sc ~ .b3- · b3/board.css:2360 |
| transition | `opacity 240ms ease-out 90ms,transform 380ms var(--xf-ease) 40ms,visibility 0s` | `` | .b3-xf-b · b3/board.css:3819 |


### `div.b3-xt-blk.fresh[role=listitem]`

inside `.b3-xf-b` · 1 on screen · **1 look**

#### the one look

`M3f-942` · rendered **438×198** · 1 instance look like this · role="listitem"

```html
<div class="b3-xt-blk fresh" role="listitem" data-id="6a4c692095a4f5a6c337548a" style="--c: #ff3b5c;"><div class="b3-xt-bin"><div class="b3-xt-ln x-hd"><span class="b3-xt-no">1</span><span class="b3-xt-tx"><b>AK117</b><i> | </i>AR</span></div><div class="b3-xt-ln x-kv"><span class="b3-xt-no">2</span><span class="b3-xt-tx"><em>Build:</em> Build 1</span></div><div class="b3-xt-ln x-kv"><span class="b3-xt-no">3</span><s
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-blk · b3/board.css:3077 |
| grid-template-rows | `1fr` | `198px` | .b3-xt-blk · b3/board.css:3077 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| transition | `grid-template-rows 170ms cubic-bezier(.23,1,.32,1),opacity 150ms ease-out` | `` | .b3-xt-blk · b3/board.css:3077 |
| animation | `b3xtin 240ms cubic-bezier(.23,1,.32,1) backwards` | `` | .b3-xt-blk:not(.out) · b3/board.css:3108 |


### `div.b3-xt-bin`

inside `.b3-xt-blk` · 1 on screen · **1 look**

#### the one look

`M3f-943` · rendered **438×198** · 1 instance look like this

```html
<div class="b3-xt-bin"><div class="b3-xt-ln x-hd"><span class="b3-xt-no">1</span><span class="b3-xt-tx"><b>AK117</b><i> | </i>AR</span></div><div class="b3-xt-ln x-kv"><span class="b3-xt-no">2</span><span class="b3-xt-tx"><em>Build:</em> Build 1</span></div><div class="b3-xt-ln x-kv"><span class="b3-xt-no">3</span><span class="b3-xt-tx"><em>Image:</em> AK117-1.png</span></div><div class="b3-xt-ln x-kv"><span class="b
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .b3-xt-bin · b3/board.css:3079 |
| min-height | `0px` | `0px` | .b3-xt-bin · b3/board.css:3079 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| overflow | `hidden` | `` | .b3-xt-bin · b3/board.css:3079 |
| overflow-x | `hidden` | `hidden` | .b3-xt-bin · b3/board.css:3079 |
| overflow-y | `hidden` | `hidden` | .b3-xt-bin · b3/board.css:3079 |
| transition | `background 200ms ease-out` | `` | .b3-xt-bin · b3/board.css:3079 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .b3-xt-bin::before · b3/board.css:3080 |
| width | `2px` | .b3-xt-bin::before · b3/board.css:3080 |
| top | `3px` | .b3-xt-bin::before · b3/board.css:3080 |
| bottom | `3px` | .b3-xt-bin::before · b3/board.css:3080 |
| left | `46px` | .b3-xt-bin::before · b3/board.css:3080 |
| border-radius | `1px` | .b3-xt-bin::before · b3/board.css:3080 |
| background | `color-mix(in srgb,var(--c) 75%,transparent)` | .b3-xt-bin::before · b3/board.css:3080 |
| background-color | `` | .b3-xt-bin::before · b3/board.css:3080 |
| background-image | `` | .b3-xt-bin::before · b3/board.css:3080 |
| content | `""` | .b3-xt-bin::before · b3/board.css:3080 |


### `button.b3-xt-rm`

inside `.b3-xt-bin` · 1 on screen · **1 look**

#### the one look

`M3f-981` · rendered **26×22** · 1 instance look like this · aria-label="Take AK117 build 1 off the file" type="button"

```html
<button type="button" class="b3-xt-rm" aria-label="Take AK117 build 1 off the file">⟨svg.ic⟩</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-rm · b3/board.css:3089 |
| position | `absolute` | `absolute` | .b3-xt-rm · b3/board.css:3089 |
| align-items | `center` | `center` | .b3-xt-rm · b3/board.css:3089 |
| place-items | `center` | `` | .b3-xt-rm · b3/board.css:3089 |
| width | `26px` | `26px` | .b3-xt-rm · b3/board.css:3089 |
| height | `22px` | `22px` | .b3-xt-rm · b3/board.css:3089 |
| min-height | `var(--ctl-min, 32px)` | `0px` | input, select, textarea, button · app.css:388 |
| box-sizing | `border-box` | `content-box` | input, select, textarea, button · app.css:388 |
| padding | `var(--ctl-pad, 7px 10px)` | `` | input, select, textarea, button · app.css:388 |
| padding-top | `` | `0px` | input, select, textarea, button · app.css:388 |
| padding-right | `` | `0px` | input, select, textarea, button · app.css:388 |
| padding-bottom | `` | `0px` | input, select, textarea, button · app.css:388 |
| padding-left | `` | `0px` | input, select, textarea, button · app.css:388 |
| top | `0px` | `0px` | .b3-xt-rm · b3/board.css:3089 |
| right | `10px` | `10px` | .b3-xt-rm · b3/board.css:3089 |
| border | `0` | `` | button · app.css:621 |
| border-radius | `6px` | `` | .b3-xt-rm · b3/board.css:3089 |
| background | `none` | `` | button · app.css:621 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | button · app.css:621 |
| background-image | `none` | `none` | button · app.css:621 |
| font | `inherit` | `` | button · app.css:621 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · app.css:621 |
| font-size | `inherit` | `13px` | button · app.css:621 |
| font-weight | `inherit` | `400` | button · app.css:621 |
| font-style | `inherit` | `normal` | button · app.css:621 |
| font-variant-numeric | `inherit` | `normal` | button · app.css:621 |
| line-height | `inherit` | `19.5px` | button · app.css:621 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `start` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink4)` | `rgb(92, 106, 117)` | .b3-xt-rm · b3/board.css:3089 |
| opacity | `0` | `0` | .b3-xt-rm · b3/board.css:3089 |
| transition | `opacity 140ms ease-out,color 140ms ease-out,background 140ms ease-out` | `` | .b3-xt-rm · b3/board.css:3089 |
| cursor | `pointer` | `pointer` | .b3-xt-rm · b3/board.css:3089 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `rgba(0, 0, 0, 0)` | `oklab(0 0 0 / 0)` |

**:focus-visible** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `footer.b3-xf-f`

inside `.b3-xf` · 1 on screen · **1 look**

#### the one look

`M3f-983` · rendered **438×73** · 1 instance look like this

```html
<footer class="b3-xf-f"><div class="b3-xf-fid"><button type="button" class="b3-xf-fn" title="Rename the file" aria-label="Rename dioreo-mp-2026-09-21.txt"><span class="b3-xf-nm">dioreo-mp-2026-09-21</span><span class="b3-xf-ext">.txt</span>⟨svg.ic⟩</button><span class="g-fact b3-cc" title="171 of the 4,000 characters one paste can carry">⟨svg.ic⟩171 characters</span></div><span class="b3-xf-fact"><button type="button
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xf-f · b3/board.css:4566 |
| grid-template-columns | `minmax(0px, 1fr) max-content` | `212.75px 181.25px` | .b3-xf-f · b3/board.css:4566 |
| gap | `8px` | `` | .b3-xf-f · b3/board.css:3727 |
| column-gap | `12px` | `12px` | .b3-xf-f · b3/board.css:4566 |
| row-gap | `8px` | `8px` | .b3-xf-f · b3/board.css:3727 |
| flex | `none` | `` | .b3-xf-f · b3/board.css:3065 |
| align-items | `center` | `center` | .b3-xf-f · b3/board.css:4566 |
| height | `auto` | `73px` | .b3-xf-f · b3/board.css:4566 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `10px 16px` | `` | .b3-xf-f · b3/board.css:4566 |
| padding-top | `10px` | `10px` | .b3-xf-f · b3/board.css:4566 |
| padding-right | `16px` | `16px` | .b3-xf-f · b3/board.css:4566 |
| padding-bottom | `10px` | `10px` | .b3-xf-f · b3/board.css:4566 |
| padding-left | `16px` | `16px` | .b3-xf-f · b3/board.css:4566 |
| border-top | `1px dashed var(--rule2)` | `` | .b3-xf-f, .b3-xf.shut .b3-xf-f · b3/board.css:3758 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `div.b3-xf-fid`

inside `.b3-xf-f` · 1 on screen · **1 look**

#### the one look

`M3f-984` · rendered **213×52** · 1 instance look like this

```html
<div class="b3-xf-fid"><button type="button" class="b3-xf-fn" title="Rename the file" aria-label="Rename dioreo-mp-2026-09-21.txt"><span class="b3-xf-nm">dioreo-mp-2026-09-21</span><span class="b3-xf-ext">.txt</span>⟨svg.ic⟩</button><span class="g-fact b3-cc" title="171 of the 4,000 characters one paste can carry">⟨svg.ic⟩171 characters</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-xf-fid · b3/board.css:4568 |
| gap | `8px` | `` | .b3-xf-fid · b3/board.css:4568 |
| column-gap | `8px` | `8px` | .b3-xf-fid · b3/board.css:4568 |
| row-gap | `8px` | `8px` | .b3-xf-fid · b3/board.css:4568 |
| flex-direction | `column` | `column` | .b3-xf-fid · b3/board.css:4568 |
| align-items | `flex-start` | `flex-start` | .b3-xf-fid · b3/board.css:4568 |
| min-width | `0px` | `0px` | .b3-xf-fid · b3/board.css:4568 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `button.b3-xf-fn`

inside `.b3-xf-fid` · 1 on screen · **1 look**

#### the one look

`M3f-985` · rendered **184×22** · 1 instance look like this · aria-label="Rename dioreo-mp-2026-09-21.txt" title="Rename the file" type="button"

```html
<button type="button" class="b3-xf-fn" title="Rename the file" aria-label="Rename dioreo-mp-2026-09-21.txt"><span class="b3-xf-nm">dioreo-mp-2026-09-21</span><span class="b3-xf-ext">.txt</span>⟨svg.ic⟩</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3732 |
| grid-column | `2` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3800 |
| grid-row | `1` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3800 |
| gap | `0` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn · b3/board.css:3662 |
| column-gap | `0px` | `normal` | :is(.b3-xf, .exs-i) .b3-xf-fn · b3/board.css:3662 |
| row-gap | `0px` | `normal` | :is(.b3-xf, .exs-i) .b3-xf-fn · b3/board.css:3662 |
| align-items | `center` | `center` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3732 |
| align-self | `start` | `start` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3838 |
| justify-self | `start` | `start` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3732 |
| min-width | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3823 |
| max-width | `calc(100% + 8px)` | `calc(100% + 8px)` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3852 |
| height | `var(--xf-fh,22px)` | `22px` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3838 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · app.css:388 |
| box-sizing | `border-box` | `border-box` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3732 |
| padding | `0 6px` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3732 |
| padding-top | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3732 |
| padding-right | `6px` | `6px` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3732 |
| padding-bottom | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3732 |
| padding-left | `6px` | `6px` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3732 |
| margin | `0` | `` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn, :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn.editing · b3/board.css:4579 |
| margin-top | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn, :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn.editing · b3/board.css:4579 |
| margin-right | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn, :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn.editing · b3/board.css:4579 |
| margin-bottom | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn, :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn.editing · b3/board.css:4579 |
| margin-left | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn, :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn.editing · b3/board.css:4579 |
| border | `1px solid color-mix(in srgb,var(--ok) 55%,transparent)` | `` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fid .b3 · b3/board.css:4597 |
| border-radius | `6px` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3732 |
| outline | `0` | `` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fid .b3 · b3/board.css:4597 |
| outline-offset | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fid .b3 · b3/board.css:4597 |
| background | `color-mix(in srgb,var(--ok) 11%,var(--sunk))` | `` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fid .b3 · b3/board.css:4597 |
| background-color | `` | `color(srgb 0.091451 0.146824 0.105529)` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fid .b3 · b3/board.css:4597 |
| background-image | `` | `none` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fid .b3 · b3/board.css:4597 |
| box-shadow | `var(--b3-ring)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fid .b3 · b3/board.css:4597 |
| font | `500 var(--t-xs)/1 var(--data)` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3732 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3732 |
| font-size | `` | `10.5px` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3732 |
| font-weight | `` | `500` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3732 |
| font-style | `` | `normal` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3732 |
| font-variant-numeric | `` | `normal` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3732 |
| line-height | `` | `10.5px` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3732 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `start` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| text-overflow | `ellipsis` | `clip` | .b3-xf-fn · b3/board.css:3054 |
| white-space | `nowrap` | `` | .b3-xf-fn · b3/board.css:3054 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3759 |
| overflow | `visible` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3759 |
| overflow-x | `visible` | `visible` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3759 |
| overflow-y | `visible` | `visible` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3759 |
| transition | `background var(--b3-d1),box-shadow var(--b3-d1),color var(--b3-d1)` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3732 |
| cursor | `text` | `text` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing) · b3/board.css:3732 |
| user-select | `none` | `auto` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `color(srgb 0.091451 0.146824 0.105529)` | `oklab(0.249595 -0.0245177 0.0130845)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| box-shadow | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | `rgb(58, 71, 82) 0px 0px 0px 1px inset, oklab(0 0 0 / 0) 0px 0px 0px 0px, oklab(0 0 0 / 0) 0px 0px 0px 0px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| box-shadow | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | `rgb(58, 72, 83) 0px 0px 0px 1px inset, oklab(0.805967 -0.138767 0.117861 / 0.00189906) 0px 0px 0px 0.0219123px, oklab(0.805967 -0.138767 0.117861 / 0.00292164) 0px 0px 0.116865px -0.0146082px` |


### `button.b3-btn2.sm`

inside `.b3-xf-fact` · 1 on screen · **1 look**

#### the one look

`M3f-992` · rendered **73×32** · 1 instance look like this · type="button"

```html
<button type="button" class="b3-btn2 sm">⟨svg.ic⟩Copy</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-btn2 · b3/board.css:801 |
| gap | `7px` | `` | .b3-btn2.sm · b3/board.css:1349 |
| column-gap | `7px` | `7px` | .b3-btn2.sm · b3/board.css:1349 |
| row-gap | `7px` | `7px` | .b3-btn2.sm · b3/board.css:1349 |
| flex | `none` | `` | .b3-btn2 · b3/board.css:801 |
| align-items | `center` | `center` | .b3-btn2 · b3/board.css:801 |
| height | `32px` | `32px` | .b3-btn2.sm · b3/board.css:1349 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · app.css:388 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `0 12px 0 10px` | `` | .b3-btn2.sm · b3/board.css:1349 |
| padding-top | `0px` | `0px` | .b3-btn2.sm · b3/board.css:1349 |
| padding-right | `12px` | `12px` | .b3-btn2.sm · b3/board.css:1349 |
| padding-bottom | `0px` | `0px` | .b3-btn2.sm · b3/board.css:1349 |
| padding-left | `10px` | `10px` | .b3-btn2.sm · b3/board.css:1349 |
| border | `0` | `` | .b3-btn2 · b3/board.css:801 |
| border-radius | `8px` | `` | .b3-xf-f .b3-btn2 · b3/board.css:3067 |
| background | `color-mix(in srgb,var(--sunk) 85%,transparent)` | `` | .b3-btn2 · b3/board.css:801 |
| background-color | `` | `color(srgb 0.0431373 0.0588235 0.0705882 / 0.85)` | .b3-btn2 · b3/board.css:801 |
| background-image | `` | `none` | .b3-btn2 · b3/board.css:801 |
| box-shadow | `var(--b3-ring)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .b3-btn2 · b3/board.css:801 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .b3-btn2 · b3/board.css:801 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-btn2 · b3/board.css:801 |
| font-size | `` | `12px` | .b3-btn2 · b3/board.css:801 |
| font-weight | `` | `600` | .b3-btn2 · b3/board.css:801 |
| font-style | `` | `normal` | .b3-btn2 · b3/board.css:801 |
| font-variant-numeric | `` | `normal` | .b3-btn2 · b3/board.css:801 |
| line-height | `` | `12px` | .b3-btn2 · b3/board.css:801 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | `nowrap` | `` | .b3-btn2 · b3/board.css:801 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .b3-btn2 · b3/board.css:801 |
| transition | `background var(--dur-1) var(--ease),box-shadow var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | .b3-btn2 · b3/board.css:801 |
| cursor | `pointer` | `pointer` | .b3-btn2 · b3/board.css:801 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `color(srgb 0.0431373 0.0588235 0.0705882 / 0.85)` | `oklab(0.165465 -0.0044266 -0.0078463 / 0.85)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### M3 · a file's rename field, open

71 distinct signatures on screen; 3 not already specced above.


### `div.b3-xt-blk[role=listitem]`

inside `.b3-xf-b` · 1 on screen · **1 look**

#### the one look

`M3r-942` · rendered **438×198** · 1 instance look like this · role="listitem"

```html
<div class="b3-xt-blk" role="listitem" data-id="6a4c692095a4f5a6c337548a" style="--c: #ff3b5c;"><div class="b3-xt-bin"><div class="b3-xt-ln x-hd"><span class="b3-xt-no">1</span><span class="b3-xt-tx"><b>AK117</b><i> | </i>AR</span></div><div class="b3-xt-ln x-kv"><span class="b3-xt-no">2</span><span class="b3-xt-tx"><em>Build:</em> Build 1</span></div><div class="b3-xt-ln x-kv"><span class="b3-xt-no">3</span><span cl
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-xt-blk · b3/board.css:3077 |
| grid-template-rows | `1fr` | `198px` | .b3-xt-blk · b3/board.css:3077 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| transition | `grid-template-rows 170ms cubic-bezier(.23,1,.32,1),opacity 150ms ease-out` | `` | .b3-xt-blk · b3/board.css:3077 |
| animation | `b3xtin 240ms cubic-bezier(.23,1,.32,1) backwards` | `` | .b3-xt-blk:not(.out) · b3/board.css:3108 |


### `div.b3-xt-bin`

inside `.b3-xt-blk` · 1 on screen · **1 look**

#### the one look

`M3r-943` · rendered **438×198** · 1 instance look like this

```html
<div class="b3-xt-bin"><div class="b3-xt-ln x-hd"><span class="b3-xt-no">1</span><span class="b3-xt-tx"><b>AK117</b><i> | </i>AR</span></div><div class="b3-xt-ln x-kv"><span class="b3-xt-no">2</span><span class="b3-xt-tx"><em>Build:</em> Build 1</span></div><div class="b3-xt-ln x-kv"><span class="b3-xt-no">3</span><span class="b3-xt-tx"><em>Image:</em> AK117-1.png</span></div><div class="b3-xt-ln x-kv"><span class="b
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .b3-xt-bin · b3/board.css:3079 |
| min-height | `0px` | `0px` | .b3-xt-bin · b3/board.css:3079 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| overflow | `hidden` | `` | .b3-xt-bin · b3/board.css:3079 |
| overflow-x | `hidden` | `hidden` | .b3-xt-bin · b3/board.css:3079 |
| overflow-y | `hidden` | `hidden` | .b3-xt-bin · b3/board.css:3079 |
| transition | `background 200ms ease-out` | `` | .b3-xt-bin · b3/board.css:3079 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .b3-xt-bin::before · b3/board.css:3080 |
| width | `2px` | .b3-xt-bin::before · b3/board.css:3080 |
| top | `3px` | .b3-xt-bin::before · b3/board.css:3080 |
| bottom | `3px` | .b3-xt-bin::before · b3/board.css:3080 |
| left | `46px` | .b3-xt-bin::before · b3/board.css:3080 |
| border-radius | `1px` | .b3-xt-bin::before · b3/board.css:3080 |
| background | `color-mix(in srgb,var(--c) 75%,transparent)` | .b3-xt-bin::before · b3/board.css:3080 |
| background-color | `` | .b3-xt-bin::before · b3/board.css:3080 |
| background-image | `` | .b3-xt-bin::before · b3/board.css:3080 |
| content | `""` | .b3-xt-bin::before · b3/board.css:3080 |


### `label.b3-xf-fn.editing`

inside `.b3-xf-fid` · 1 on screen · **1 look**

#### the one look

`M3r-985` · rendered **170×22** · 1 instance look like this

```html
<label class="b3-xf-fn editing"><input type="text" spellcheck="true" aria-label="File name for dioreo-mp-2026-09-21.txt"><span class="b3-xf-ext" aria-hidden="true">.txt</span></label>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| grid-column | `2` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3800 |
| grid-row | `1` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3800 |
| gap | `0` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn · b3/board.css:3662 |
| column-gap | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fn · b3/board.css:3662 |
| row-gap | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fn · b3/board.css:3662 |
| align-items | `center` | `center` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| align-self | `start` | `start` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3838 |
| justify-self | `stretch` | `stretch` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3764 |
| width | `auto` | `170.203px` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3764 |
| min-width | `0px` | `0px` | .b3-xf-fid .b3-xf-fn · b3/board.css:4580 |
| max-width | `none` | `none` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3764 |
| height | `var(--xf-fh,22px)` | `22px` | :is(.b3-xf, .exs-i) .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3838 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `0 6px` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| padding-top | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| padding-right | `6px` | `6px` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| padding-bottom | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| padding-left | `6px` | `6px` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| margin | `0` | `` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn, :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn.editing · b3/board.css:4579 |
| margin-top | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn, :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn.editing · b3/board.css:4579 |
| margin-right | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn, :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn.editing · b3/board.css:4579 |
| margin-bottom | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn, :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn.editing · b3/board.css:4579 |
| margin-left | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn, :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn.editing · b3/board.css:4579 |
| border | `1px solid color-mix(in srgb,var(--ok) 55%,transparent)` | `` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fid .b3 · b3/board.css:4597 |
| border-radius | `6px` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| outline | `0` | `` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fid .b3 · b3/board.css:4597 |
| outline-offset | `0px` | `0px` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fid .b3 · b3/board.css:4597 |
| background | `color-mix(in srgb,var(--ok) 11%,var(--sunk))` | `` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fid .b3 · b3/board.css:4597 |
| background-color | `` | `color(srgb 0.091451 0.146824 0.105529)` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fid .b3 · b3/board.css:4597 |
| background-image | `` | `none` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn:not(.editing), :is(.b3-xf, .exs-i) .b3-xf-fid .b3 · b3/board.css:4597 |
| box-shadow | `inset 0 0 0 1px var(--focus), 0 0 0 3px color-mix(in srgb, var(--ok) 26%, transparent), 0 0 16px -2px color-mix(in srgb, var(--ok) 40%, transparent)` | `rgb(95, 212, 232) 0px 0px 0px 1px inset, color(srgb 0.482353 0.858824 0.388235 / 0.26) 0px 0px 0px 3px, color(srgb 0.482353 0.858824 0.388235 / 0.4) 0px 0px 16px -2px` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn.editing, :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn · gates.css:600 |
| font | `500 var(--t-xs)/1 var(--data)` | `` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| font-size | `` | `10.5px` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| font-weight | `` | `500` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| font-style | `` | `normal` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| font-variant-numeric | `` | `normal` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| line-height | `` | `10.5px` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| letter-spacing | — | `normal` | initial |
| text-overflow | `ellipsis` | `ellipsis` | .b3-xf-fn · b3/board.css:3054 |
| white-space | `nowrap` | `` | .b3-xf-fn · b3/board.css:3054 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | :is(.b3-xf, .exs-i) .b3-xf-fn.editing · b3/board.css:3737 |
| overflow | `hidden` | `` | .b3-xf-fid .b3-xf-fn · b3/board.css:4580 |
| overflow-x | `hidden` | `hidden` | .b3-xf-fid .b3-xf-fn · b3/board.css:4580 |
| overflow-y | `hidden` | `hidden` | .b3-xf-fid .b3-xf-fn · b3/board.css:4580 |
| transition | `box-shadow var(--b3-d1) var(--ease), background var(--b3-d1) var(--ease)` | `` | :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn.editing, :is(.b3-xf, .exs-i) .b3-xf-fid .b3-xf-fn · gates.css:600 |
| cursor | `text` | `text` | :is(.b3-xf, .exs-i) .b3-xf-fn · b3/board.css:3662 |

**:hover** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)

**:focus-visible** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)

**:active** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)


### M1 · one build selected (the selection bar)

77 distinct signatures on screen; 24 not already specced above.


### `span`

inside `.mlabel` · 10 on screen · **1 look**

#### the one look

`M1s-75` · rendered **58×22** · 1 instance look like this

```html
<span style="animation: 11.61s linear 0s infinite normal none running b3vr2;"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .b3-vrest > span · b3/board.css:3223 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| inset | `0` | `` | .b3-vrest > span · b3/board.css:3223 |
| top | `0px` | `0px` | .b3-vrest > span · b3/board.css:3223 |
| right | `0px` | `0px` | .b3-vrest > span · b3/board.css:3223 |
| bottom | `0px` | `0px` | .b3-vrest > span · b3/board.css:3223 |
| left | `0px` | `0px` | .b3-vrest > span · b3/board.css:3223 |
| font | ↑ `700 var(--t-micro)/1 var(--data)` | `` | inherited · .b3-bdg · b3/board.css:150 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .b3-bdg · b3/board.css:150 |
| font-size | ↑ `` | `9.5px` | inherited · .b3-bdg · b3/board.css:150 |
| font-weight | ↑ `` | `700` | inherited · .b3-bdg · b3/board.css:150 |
| font-style | ↑ `` | `normal` | inherited · .b3-bdg · b3/board.css:150 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-bdg · b3/board.css:150 |
| line-height | ↑ `` | `9.5px` | inherited · .b3-bdg · b3/board.css:150 |
| letter-spacing | ↑ `var(--b3-tr)` | `1.045px` | inherited · .b3-bdg · b3/board.css:150 |
| white-space | ↑ `nowrap` | `` | inherited · .b3-bdg · b3/board.css:150 |
| color | ↑ `color-mix(in srgb,var(--tc) 88%,white)` | `color(srgb 0.313255 0.85851 0.948235)` | inherited · .b3-bdg · b3/board.css:150 |
| animation | `11.61s linear 0s infinite normal none running b3vr2` | `` | style attribute |
| cursor | ↑ `pointer` | `pointer` | inherited · .wg-h · app.css:1117 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .b3-vrest > span::before · b3/board.css:3224 |
| width | `140%` | .b3-vrest > span::before · b3/board.css:3224 |
| top | `50%` | .b3-vrest > span::before · b3/board.css:3224 |
| left | `50%` | .b3-vrest > span::before · b3/board.css:3224 |
| background | `radial-gradient(circle closest-side, color-mix(in srgb,var(--tc) calc(40% + 60%*.06*var(--b3-amb)),white) 0%, color-mix(in srgb,var(--tc) 2%,transparent) 26.04%, transparent 76%)` | .b3-vrest > span::before · b3/board.css:3224 |
| background-color | `` | .b3-vrest > span::before · b3/board.css:3224 |
| background-image | `` | .b3-vrest > span::before · b3/board.css:3224 |
| transform | `translate(-50%, -50%)` | .b3-vrest > span::before · b3/board.css:3224 |
| content | `""` | .b3-vrest > span::before · b3/board.css:3224 |


### `svg.ic`

inside `.pill` · 102 on screen · **2 looks**

#### look 1 of 2

`M1s-747` · rendered **15×15** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic" aria-hidden="true"><use href="#i-trash-2"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · app.css:6457 |
| flex | `none` | `` | .ic · b2.css:4 |
| width | `15px` | `15px` | .b3-btn2 .ic · b3/board.css:803 |
| height | `15px` | `15px` | .b3-btn2 .ic · b3/board.css:803 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `600 var(--t-sm)/1 var(--ui)` | `` | inherited · .b3-btn2 · b3/board.css:801 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .b3-btn2 · b3/board.css:801 |
| font-size | ↑ `` | `12px` | inherited · .b3-btn2 · b3/board.css:801 |
| font-weight | ↑ `` | `600` | inherited · .b3-btn2 · b3/board.css:801 |
| font-style | ↑ `` | `normal` | inherited · .b3-btn2 · b3/board.css:801 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-btn2 · b3/board.css:801 |
| line-height | ↑ `` | `12px` | inherited · .b3-btn2 · b3/board.css:801 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | ↑ `nowrap` | `` | inherited · .b3-btn2 · b3/board.css:801 |
| color | ↑ `var(--danger-ink)` | `rgb(255, 138, 133)` | inherited · .b3-btn2.dang · b3/board.css:807 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-btn2 · b3/board.css:801 |
| pointer-events | `none` | `none` | button .ic, a .ic · app.css:6464 |

#### look 2 of 2

`M1s-749` · rendered **15×15** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic" aria-hidden="true"><use href="#i-x"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · app.css:6457 |
| flex | `none` | `` | .ic · b2.css:4 |
| width | `15px` | `15px` | .b3-btn2 .ic · b3/board.css:803 |
| height | `15px` | `15px` | .b3-btn2 .ic · b3/board.css:803 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `600 var(--t-sm)/1 var(--ui)` | `` | inherited · .b3-btn2 · b3/board.css:801 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .b3-btn2 · b3/board.css:801 |
| font-size | ↑ `` | `12px` | inherited · .b3-btn2 · b3/board.css:801 |
| font-weight | ↑ `` | `600` | inherited · .b3-btn2 · b3/board.css:801 |
| font-style | ↑ `` | `normal` | inherited · .b3-btn2 · b3/board.css:801 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-btn2 · b3/board.css:801 |
| line-height | ↑ `` | `12px` | inherited · .b3-btn2 · b3/board.css:801 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | ↑ `nowrap` | `` | inherited · .b3-btn2 · b3/board.css:801 |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .b3-btn2.quiet · b3/board.css:809 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-btn2 · b3/board.css:801 |
| pointer-events | `none` | `none` | button .ic, a .ic · app.css:6464 |


### `em`

inside `.chip` · 12 on screen · **1 look**

#### the one look

`M1s-735` · rendered **49×11** · 1 instance look like this · text “Build 1”

```html
<em>Build 1</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .b3-sc em · b3/board.css:1785 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `600 var(--t-xs)/1 var(--data)` | `` | .b3-sc em · b3/board.css:2265 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .b3-sc em · b3/board.css:2265 |
| font-size | `` | `10.5px` | .b3-sc em · b3/board.css:2265 |
| font-weight | `` | `600` | .b3-sc em · b3/board.css:2265 |
| font-style | `` | `normal` | .b3-sc em · b3/board.css:2265 |
| font-variant-numeric | `` | `normal` | .b3-sc em · b3/board.css:2265 |
| line-height | `` | `10.5px` | .b3-sc em · b3/board.css:2265 |
| letter-spacing | `var(--b3-tr-tight)` | `0.63px` | .b3-sc em · b3/board.css:2265 |
| white-space | `nowrap` | `` | .b3-sc em · b3/board.css:1785 |
| color | `oklch(from var(--c) max(l, .76) c h)` | `oklch(0.76 0.228671 17.4759)` | .b3-nw > :is(small, em, span, i) · b3/board.css:2661 |
| opacity | `1` | `1` | .b3-sc em · b3/board.css:2265 |


### `i`

inside `.chip` · 16 on screen · **1 look**

#### the one look

`M1s-733` · rendered **7×7** · 1 instance look like this · aria-hidden="true"

```html
<i aria-hidden="true"></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .b3-sc > i · b3/board.css:1786 |
| width | `7px` | `7px` | .b3-sc > i · b3/board.css:789 |
| height | `7px` | `7px` | .b3-sc > i · b3/board.css:789 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border-radius | `50%` | `` | .chip.topic i, .pill .dot, .b3-sc > i, .b3-sd-gh > i · b3/board.css:1236 |
| background | `var(--c)` | `` | .b3-sc > i · b3/board.css:789 |
| background-color | `` | `rgb(255, 59, 92)` | .b3-sc > i · b3/board.css:789 |
| background-image | `` | `none` | .b3-sc > i · b3/board.css:789 |
| font | ↑ `600 var(--t-sm)/1 var(--ui)` | `` | inherited · .b3-sc · b3/board.css:786 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .b3-sc · b3/board.css:786 |
| font-size | ↑ `` | `12px` | inherited · .b3-sc · b3/board.css:786 |
| font-weight | ↑ `` | `600` | inherited · .b3-sc · b3/board.css:786 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-sc · b3/board.css:786 |
| line-height | ↑ `` | `12px` | inherited · .b3-sc · b3/board.css:786 |
| letter-spacing | — | `normal` | initial |
| white-space | ↑ `nowrap` | `` | inherited · .b3-sc · b3/board.css:786 |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · .b3-sc · b3/board.css:786 |


### `span.b3-hint`

inside `.wg-heads` · 2 on screen · **1 look**

#### the one look

`M1s-745` · rendered **136×40** · 1 instance look like this

```html
<span class="b3-hint" data-side="top"><button type="button" class="b3-btn2 dang" aria-describedby="b3-del-hint">⟨svg.ic⟩Stage deletion</button></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-hint · b3/board.css:75 |
| position | `relative` | `relative` | .b3-hint · b3/board.css:75 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `span.cb`

inside `.wg-cb` · 29 on screen · **2 looks**

#### look 1 of 2

`M1s-55` · rendered **18×18** · 1 instance look like this

```html
<span class="cb"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .cb · app.css:1280 |
| position | `relative` | `relative` | .cb · app.css:1280 |
| width | `18px` | `18px` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| height | `18px` | `18px` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border | `0` | `` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| border-color | `var(--patch)` | `` | .wg-cb[aria-checked="mixed"] .cb · app.css:1122 |
| border-radius | `6px` | `` | html[data-b3-p4="b"] .cb · b3/board.css:723 |
| background | `linear-gradient(180deg,#F7D567,var(--patch))` | `` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb · b3/board.css:732 |
| background-color | `` | `rgba(0, 0, 0, 0)` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb · b3/board.css:732 |
| background-image | `` | `linear-gradient(rgb(247, 213, 103), rgb(242, 194, 48))` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb · b3/board.css:732 |
| box-shadow | `0 0 0 3px color-mix(in srgb,var(--patch) 18%,transparent)` | `color(srgb 0.94902 0.760784 0.188235 / 0.18) 0px 0px 0px 3px` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb · b3/board.css:732 |
| font | ↑ `700 var(--t-xs)/1 var(--data)` | `` | inherited · html[data-b3-a1="fixed"] .wg-heads · gates.css:255 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · html[data-b3-a1="fixed"] .wg-heads · gates.css:255 |
| font-size | ↑ `` | `10.5px` | inherited · html[data-b3-a1="fixed"] .wg-heads · gates.css:255 |
| font-weight | ↑ `` | `700` | inherited · html[data-b3-a1="fixed"] .wg-heads · gates.css:255 |
| font-style | ↑ `` | `normal` | inherited · html[data-b3-a1="fixed"] .wg-heads · gates.css:255 |
| font-variant-numeric | ↑ `` | `normal` | inherited · html[data-b3-a1="fixed"] .wg-heads · gates.css:255 |
| line-height | ↑ `` | `10.5px` | inherited · html[data-b3-a1="fixed"] .wg-heads · gates.css:255 |
| letter-spacing | ↑ `0.12em` | `1.26px` | inherited · html[data-b3-a1="fixed"] .wg-heads · gates.css:255 |
| text-transform | ↑ `uppercase` | `uppercase` | inherited · .wg-heads · app.css:1108 |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · html[data-b3-a1="fixed"] .wg-heads · gates.css:255 |
| transition | `background var(--b3-d1) var(--ease),box-shadow var(--b3-d1) var(--ease)` | `` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| cursor | ↑ `pointer` | `pointer` | inherited · .wg-cb · app.css:1120 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| width | `9px` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| height | `2px` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| top | `8px` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| left | `4.5px` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| border | `0` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| border-radius | `1px` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| background | `var(--on-accent)` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| background-color | `` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| background-image | `` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| clip-path | `inset(0px)` | html[data-b3-p4="a"] .wg-cb[aria-checked="mixed"] .cb::after, html[data-b3-p4="b"] .wg-cb[ · b3/board.css:287 |
| mask | `none` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| mask-image | `none` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| transform | `none` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| transition | `clip-path var(--b3-d2) cubic-bezier(.16,1,.3,1),background var(--b3-d1) var(--ease)` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:282 |
| content | `""` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |

#### look 2 of 2

`M1s-64` · rendered **18×18** · 1 instance look like this

```html
<span class="cb"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .cb · app.css:1280 |
| position | `relative` | `relative` | .cb · app.css:1280 |
| width | `18px` | `18px` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| height | `18px` | `18px` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border | `0` | `` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| border-color | `var(--patch)` | `` | .wg-cb[aria-checked="mixed"] .cb · app.css:1122 |
| border-radius | `6px` | `` | html[data-b3-p4="b"] .cb · b3/board.css:723 |
| background | `linear-gradient(180deg,#F7D567,var(--patch))` | `` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb · b3/board.css:732 |
| background-color | `` | `rgba(0, 0, 0, 0)` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb · b3/board.css:732 |
| background-image | `` | `linear-gradient(rgb(247, 213, 103), rgb(242, 194, 48))` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb · b3/board.css:732 |
| box-shadow | `0 0 0 3px color-mix(in srgb,var(--patch) 18%,transparent)` | `color(srgb 0.94902 0.760784 0.188235 / 0.18) 0px 0px 0px 3px` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb · b3/board.css:732 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| transition | `background var(--b3-d1) var(--ease),box-shadow var(--b3-d1) var(--ease)` | `` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| cursor | ↑ `pointer` | `pointer` | inherited · .wg-cb · app.css:1120 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| width | `9px` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| height | `2px` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| top | `8px` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| left | `4.5px` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| border | `0` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| border-radius | `1px` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| background | `var(--on-accent)` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| background-color | `` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| background-image | `` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| clip-path | `inset(0px)` | html[data-b3-p4="a"] .wg-cb[aria-checked="mixed"] .cb::after, html[data-b3-p4="b"] .wg-cb[ · b3/board.css:287 |
| mask | `none` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| mask-image | `none` | html[data-b3-p4="b"] .wg-cb[aria-checked="mixed"] .cb::after · b3/board.css:733 |
| transform | `none` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| transition | `clip-path var(--b3-d2) cubic-bezier(.16,1,.3,1),background var(--b3-d1) var(--ease)` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:282 |
| content | `""` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |


### `svg.ic.ic-fold`

inside `.wg-fold` · 10 on screen · **1 look**

#### the one look

`M1s-738` · rendered **15×15** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic ic-fold" aria-hidden="true"><use href="#i-b2-unfold"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · app.css:6457 |
| flex | `none` | `` | .ic · b2.css:4 |
| width | `15px` | `15px` | .b3-btn2 .ic · b3/board.css:803 |
| height | `15px` | `15px` | .b3-btn2 .ic · b3/board.css:803 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | ↑ `600 var(--t-sm)/1 var(--ui)` | `` | inherited · .b3-btn2 · b3/board.css:801 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .b3-btn2 · b3/board.css:801 |
| font-size | ↑ `` | `12px` | inherited · .b3-btn2 · b3/board.css:801 |
| font-weight | ↑ `` | `600` | inherited · .b3-btn2 · b3/board.css:801 |
| font-style | ↑ `` | `normal` | inherited · .b3-btn2 · b3/board.css:801 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-btn2 · b3/board.css:801 |
| line-height | ↑ `` | `12px` | inherited · .b3-btn2 · b3/board.css:801 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | ↑ `nowrap` | `` | inherited · .b3-btn2 · b3/board.css:801 |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .b3-btn2.ghost · b3/board.css:3321 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-btn2 · b3/board.css:801 |
| pointer-events | `none` | `none` | button .ic, a .ic · app.css:6464 |


### `span.b3-bdgs.in`

inside `.wg-line` · 1 on screen · **1 look**

#### the one look

`M1s-69` · rendered **206×22** · 1 instance look like this

```html
<span class="b3-bdgs in" style="--ph: 0.839;"><span class="b3-bdg" data-k="meta">⟨svg.ic.b3-zap⟩META<span class="b3-volt" data-volt-on="1"><img alt="" aria-hidden="true" src="blob:http://127.0.0.1:8900/bb8ad036-215d-418f-bf61-340dd82baacb"></span><span class="b3-vl" aria-hidden="true"><span class="b3-vrest"><span style="animation: 11.61s linear 0s infinite normal none running b3vr2;"></span></span><span class="b3-vb"
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-bdgs · b3/board.css:148 |
| gap | `6px` | `` | .b3-bdgs · b3/board.css:148 |
| column-gap | `6px` | `6px` | .b3-bdgs · b3/board.css:148 |
| row-gap | `6px` | `6px` | .b3-bdgs · b3/board.css:148 |
| align-items | `center` | `center` | .b3-bdgs · b3/board.css:148 |
| align-self | `center` | `center` | .wg-line > .b3-bdgs, .wg-line > span:not(:has(> b)), .wg-line > i, .wg-line > button · b3/board.css:2020 |
| min-height | `22px` | `22px` | .b3-bdgs · b3/board.css:148 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding-left | `17px` | `17px` | .wg-h .b3-bdgs · b3/board.css:3408 |
| margin-left | `4px` | `4px` | .wg-h .b3-bdgs · b3/board.css:3264 |
| box-shadow | `inset 1px 0 0 var(--rule2)` | `rgb(58, 71, 82) 1px 0px 0px 0px inset` | .b3-bdgs · b3/board.css:148 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| cursor | ↑ `pointer` | `pointer` | inherited · .wg-h · app.css:1117 |


### `span.b3-vrest`

inside `.b3-vl` · 1 on screen · **1 look**

#### the one look

`M1s-74` · rendered **58×22** · 1 instance look like this

```html
<span class="b3-vrest"><span style="animation: 11.61s linear 0s infinite normal none running b3vr2;"></span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .b3-vrest · b3/board.css:3220 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `1px` | `` | .b3-vrest · b3/board.css:3220 |
| padding-top | `1px` | `1px` | .b3-vrest · b3/board.css:3220 |
| padding-right | `1px` | `1px` | .b3-vrest · b3/board.css:3220 |
| padding-bottom | `1px` | `1px` | .b3-vrest · b3/board.css:3220 |
| padding-left | `1px` | `1px` | .b3-vrest · b3/board.css:3220 |
| inset | `0` | `` | .b3-vrest · b3/board.css:3220 |
| top | `0px` | `0px` | .b3-vrest · b3/board.css:3220 |
| right | `0px` | `0px` | .b3-vrest · b3/board.css:3220 |
| bottom | `0px` | `0px` | .b3-vrest · b3/board.css:3220 |
| left | `0px` | `0px` | .b3-vrest · b3/board.css:3220 |
| border-radius | `inherit` | `` | .b3-vrest · b3/board.css:3220 |
| font | ↑ `700 var(--t-micro)/1 var(--data)` | `` | inherited · .b3-bdg · b3/board.css:150 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .b3-bdg · b3/board.css:150 |
| font-size | ↑ `` | `9.5px` | inherited · .b3-bdg · b3/board.css:150 |
| font-weight | ↑ `` | `700` | inherited · .b3-bdg · b3/board.css:150 |
| font-style | ↑ `` | `normal` | inherited · .b3-bdg · b3/board.css:150 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-bdg · b3/board.css:150 |
| line-height | ↑ `` | `9.5px` | inherited · .b3-bdg · b3/board.css:150 |
| letter-spacing | ↑ `var(--b3-tr)` | `1.045px` | inherited · .b3-bdg · b3/board.css:150 |
| white-space | ↑ `nowrap` | `` | inherited · .b3-bdg · b3/board.css:150 |
| color | ↑ `color-mix(in srgb,var(--tc) 88%,white)` | `color(srgb 0.313255 0.85851 0.948235)` | inherited · .b3-bdg · b3/board.css:150 |
| overflow | `clip` | `` | .b3-vrest · b3/board.css:3220 |
| overflow-x | `clip` | `clip` | .b3-vrest · b3/board.css:3220 |
| overflow-y | `clip` | `clip` | .b3-vrest · b3/board.css:3220 |
| mask-image | `linear-gradient(rgb(255, 255, 255) 0px, rgb(255, 255, 255) 0px), linear-gradient(rgb(255, 255, 255) 0px, rgb(255, 255, 255) 0px)` | `linear-gradient(rgb(255, 255, 255) 0px, rgb(255, 255, 255) 0px), linear-gradient(rgb(255, 255, 255) 0px, rgb(255, 255, 255) 0px)` | .b3-vrest · b3/board.css:3220 |
| cursor | ↑ `pointer` | `pointer` | inherited · .wg-h · app.css:1117 |


### `span.b3-vb`

inside `.b3-vl` · 3 on screen · **3 looks**

#### look 1 of 3

`M1s-76` · rendered **58×22** · 1 instance look like this

```html
<span class="b3-vb" style="--pk: 0.3; --ha: 37.6%; --sx: 32.0%; --sy: 60.9%; animation: 11.61s linear 0s infinite normal none running b3vb20;"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .b3-vb · b3/board.css:3204 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| inset | `0` | `` | .b3-vb · b3/board.css:3204 |
| top | `0px` | `0px` | .b3-vb · b3/board.css:3204 |
| right | `0px` | `0px` | .b3-vb · b3/board.css:3204 |
| bottom | `0px` | `0px` | .b3-vb · b3/board.css:3204 |
| left | `0px` | `0px` | .b3-vb · b3/board.css:3204 |
| border-radius | `inherit` | `` | .b3-vb · b3/board.css:3204 |
| box-shadow | `0 0 calc((8px + 30px*var(--pk))*var(--b3-amb)) calc(-6px + 5px*var(--pk)) color-mix(in srgb,var(--tc) calc((22% + 58%*var(--pk))*var(--b3-amb)),transparent)` | `color(srgb 0.219608 0.839216 0.941176 / 0.6304) 0px 0px 27.2px -4.5px` | .b3-vb · b3/board.css:3204 |
| font | ↑ `700 var(--t-micro)/1 var(--data)` | `` | inherited · .b3-bdg · b3/board.css:150 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .b3-bdg · b3/board.css:150 |
| font-size | ↑ `` | `9.5px` | inherited · .b3-bdg · b3/board.css:150 |
| font-weight | ↑ `` | `700` | inherited · .b3-bdg · b3/board.css:150 |
| font-style | ↑ `` | `normal` | inherited · .b3-bdg · b3/board.css:150 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-bdg · b3/board.css:150 |
| line-height | ↑ `` | `9.5px` | inherited · .b3-bdg · b3/board.css:150 |
| letter-spacing | ↑ `var(--b3-tr)` | `1.045px` | inherited · .b3-bdg · b3/board.css:150 |
| white-space | ↑ `nowrap` | `` | inherited · .b3-bdg · b3/board.css:150 |
| color | ↑ `color-mix(in srgb,var(--tc) 88%,white)` | `color(srgb 0.313255 0.85851 0.948235)` | inherited · .b3-bdg · b3/board.css:150 |
| opacity | ⚠️ `0` | `0.351258` | .b3-vb · b3/board.css:3204 · **overridden — see computed** |
| animation | `11.61s linear 0s infinite normal none running b3vb20` | `` | style attribute |
| cursor | ↑ `pointer` | `pointer` | inherited · .wg-h · app.css:1117 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .b3-vb::after · b3/board.css:3207 |
| padding | `1px` | .b3-vb::after · b3/board.css:3207 |
| padding-top | `1px` | .b3-vb::after · b3/board.css:3207 |
| padding-right | `1px` | .b3-vb::after · b3/board.css:3207 |
| padding-bottom | `1px` | .b3-vb::after · b3/board.css:3207 |
| padding-left | `1px` | .b3-vb::after · b3/board.css:3207 |
| inset | `0` | .b3-vb::after · b3/board.css:3207 |
| top | `0px` | .b3-vb::after · b3/board.css:3207 |
| right | `0px` | .b3-vb::after · b3/board.css:3207 |
| bottom | `0px` | .b3-vb::after · b3/board.css:3207 |
| left | `0px` | .b3-vb::after · b3/board.css:3207 |
| border-radius | `inherit` | .b3-vb::after · b3/board.css:3207 |
| background | `radial-gradient(circle at var(--sx) var(--sy), color-mix(in srgb,var(--tc) calc(40% + 60%*var(--pk)*var(--b3-amb)),white) 0%, color-mix(in srgb,var(--tc) calc(33.3%*var(--pk)),transparent) calc(24% + 34%*var(--pk)), transparent 76%)` | .b3-vb::after · b3/board.css:3207 |
| background-color | `` | .b3-vb::after · b3/board.css:3207 |
| background-image | `` | .b3-vb::after · b3/board.css:3207 |
| mask-image | `linear-gradient(rgb(255, 255, 255) 0px, rgb(255, 255, 255) 0px), linear-gradient(rgb(255, 255, 255) 0px, rgb(255, 255, 255) 0px)` | .b3-vb::after · b3/board.css:3207 |
| content | `""` | .b3-vb::after · b3/board.css:3207 |

#### look 2 of 3

`M1s-77` · rendered **58×22** · 1 instance look like this

```html
<span class="b3-vb" style="--pk: 0.22; --ha: 25.1%; --sx: 35.5%; --sy: 73.7%; animation: 11.61s linear 0s infinite normal none running b3vb21;"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .b3-vb · b3/board.css:3204 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| inset | `0` | `` | .b3-vb · b3/board.css:3204 |
| top | `0px` | `0px` | .b3-vb · b3/board.css:3204 |
| right | `0px` | `0px` | .b3-vb · b3/board.css:3204 |
| bottom | `0px` | `0px` | .b3-vb · b3/board.css:3204 |
| left | `0px` | `0px` | .b3-vb · b3/board.css:3204 |
| border-radius | `inherit` | `` | .b3-vb · b3/board.css:3204 |
| box-shadow | `0 0 calc((8px + 30px*var(--pk))*var(--b3-amb)) calc(-6px + 5px*var(--pk)) color-mix(in srgb,var(--tc) calc((22% + 58%*var(--pk))*var(--b3-amb)),transparent)` | `color(srgb 0.219608 0.839216 0.941177 / 0.55616) 0px 0px 23.36px -4.9px` | .b3-vb · b3/board.css:3204 |
| font | ↑ `700 var(--t-micro)/1 var(--data)` | `` | inherited · .b3-bdg · b3/board.css:150 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .b3-bdg · b3/board.css:150 |
| font-size | ↑ `` | `9.5px` | inherited · .b3-bdg · b3/board.css:150 |
| font-weight | ↑ `` | `700` | inherited · .b3-bdg · b3/board.css:150 |
| font-style | ↑ `` | `normal` | inherited · .b3-bdg · b3/board.css:150 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-bdg · b3/board.css:150 |
| line-height | ↑ `` | `9.5px` | inherited · .b3-bdg · b3/board.css:150 |
| letter-spacing | ↑ `var(--b3-tr)` | `1.045px` | inherited · .b3-bdg · b3/board.css:150 |
| white-space | ↑ `nowrap` | `` | inherited · .b3-bdg · b3/board.css:150 |
| color | ↑ `color-mix(in srgb,var(--tc) 88%,white)` | `color(srgb 0.313255 0.85851 0.948235)` | inherited · .b3-bdg · b3/board.css:150 |
| opacity | `0` | `0` | .b3-vb · b3/board.css:3204 |
| animation | `11.61s linear 0s infinite normal none running b3vb21` | `` | style attribute |
| cursor | ↑ `pointer` | `pointer` | inherited · .wg-h · app.css:1117 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .b3-vb::after · b3/board.css:3207 |
| padding | `1px` | .b3-vb::after · b3/board.css:3207 |
| padding-top | `1px` | .b3-vb::after · b3/board.css:3207 |
| padding-right | `1px` | .b3-vb::after · b3/board.css:3207 |
| padding-bottom | `1px` | .b3-vb::after · b3/board.css:3207 |
| padding-left | `1px` | .b3-vb::after · b3/board.css:3207 |
| inset | `0` | .b3-vb::after · b3/board.css:3207 |
| top | `0px` | .b3-vb::after · b3/board.css:3207 |
| right | `0px` | .b3-vb::after · b3/board.css:3207 |
| bottom | `0px` | .b3-vb::after · b3/board.css:3207 |
| left | `0px` | .b3-vb::after · b3/board.css:3207 |
| border-radius | `inherit` | .b3-vb::after · b3/board.css:3207 |
| background | `radial-gradient(circle at var(--sx) var(--sy), color-mix(in srgb,var(--tc) calc(40% + 60%*var(--pk)*var(--b3-amb)),white) 0%, color-mix(in srgb,var(--tc) calc(33.3%*var(--pk)),transparent) calc(24% + 34%*var(--pk)), transparent 76%)` | .b3-vb::after · b3/board.css:3207 |
| background-color | `` | .b3-vb::after · b3/board.css:3207 |
| background-image | `` | .b3-vb::after · b3/board.css:3207 |
| mask-image | `linear-gradient(rgb(255, 255, 255) 0px, rgb(255, 255, 255) 0px), linear-gradient(rgb(255, 255, 255) 0px, rgb(255, 255, 255) 0px)` | .b3-vb::after · b3/board.css:3207 |
| content | `""` | .b3-vb::after · b3/board.css:3207 |

#### look 3 of 3

`M1s-78` · rendered **58×22** · 1 instance look like this

```html
<span class="b3-vb" style="--pk: 0.34; --ha: 43.9%; --sx: 30.6%; --sy: 49.3%; animation: 11.61s linear 0s infinite normal none running b3vb22;"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .b3-vb · b3/board.css:3204 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| inset | `0` | `` | .b3-vb · b3/board.css:3204 |
| top | `0px` | `0px` | .b3-vb · b3/board.css:3204 |
| right | `0px` | `0px` | .b3-vb · b3/board.css:3204 |
| bottom | `0px` | `0px` | .b3-vb · b3/board.css:3204 |
| left | `0px` | `0px` | .b3-vb · b3/board.css:3204 |
| border-radius | `inherit` | `` | .b3-vb · b3/board.css:3204 |
| box-shadow | `0 0 calc((8px + 30px*var(--pk))*var(--b3-amb)) calc(-6px + 5px*var(--pk)) color-mix(in srgb,var(--tc) calc((22% + 58%*var(--pk))*var(--b3-amb)),transparent)` | `color(srgb 0.219608 0.839216 0.941176 / 0.66752) 0px 0px 29.12px -4.3px` | .b3-vb · b3/board.css:3204 |
| font | ↑ `700 var(--t-micro)/1 var(--data)` | `` | inherited · .b3-bdg · b3/board.css:150 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .b3-bdg · b3/board.css:150 |
| font-size | ↑ `` | `9.5px` | inherited · .b3-bdg · b3/board.css:150 |
| font-weight | ↑ `` | `700` | inherited · .b3-bdg · b3/board.css:150 |
| font-style | ↑ `` | `normal` | inherited · .b3-bdg · b3/board.css:150 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-bdg · b3/board.css:150 |
| line-height | ↑ `` | `9.5px` | inherited · .b3-bdg · b3/board.css:150 |
| letter-spacing | ↑ `var(--b3-tr)` | `1.045px` | inherited · .b3-bdg · b3/board.css:150 |
| white-space | ↑ `nowrap` | `` | inherited · .b3-bdg · b3/board.css:150 |
| color | ↑ `color-mix(in srgb,var(--tc) 88%,white)` | `color(srgb 0.313255 0.85851 0.948235)` | inherited · .b3-bdg · b3/board.css:150 |
| opacity | `0` | `0` | .b3-vb · b3/board.css:3204 |
| animation | `11.61s linear 0s infinite normal none running b3vb22` | `` | style attribute |
| cursor | ↑ `pointer` | `pointer` | inherited · .wg-h · app.css:1117 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .b3-vb::after · b3/board.css:3207 |
| padding | `1px` | .b3-vb::after · b3/board.css:3207 |
| padding-top | `1px` | .b3-vb::after · b3/board.css:3207 |
| padding-right | `1px` | .b3-vb::after · b3/board.css:3207 |
| padding-bottom | `1px` | .b3-vb::after · b3/board.css:3207 |
| padding-left | `1px` | .b3-vb::after · b3/board.css:3207 |
| inset | `0` | .b3-vb::after · b3/board.css:3207 |
| top | `0px` | .b3-vb::after · b3/board.css:3207 |
| right | `0px` | .b3-vb::after · b3/board.css:3207 |
| bottom | `0px` | .b3-vb::after · b3/board.css:3207 |
| left | `0px` | .b3-vb::after · b3/board.css:3207 |
| border-radius | `inherit` | .b3-vb::after · b3/board.css:3207 |
| background | `radial-gradient(circle at var(--sx) var(--sy), color-mix(in srgb,var(--tc) calc(40% + 60%*var(--pk)*var(--b3-amb)),white) 0%, color-mix(in srgb,var(--tc) calc(33.3%*var(--pk)),transparent) calc(24% + 34%*var(--pk)), transparent 76%)` | .b3-vb::after · b3/board.css:3207 |
| background-color | `` | .b3-vb::after · b3/board.css:3207 |
| background-image | `` | .b3-vb::after · b3/board.css:3207 |
| mask-image | `linear-gradient(rgb(255, 255, 255) 0px, rgb(255, 255, 255) 0px), linear-gradient(rgb(255, 255, 255) 0px, rgb(255, 255, 255) 0px)` | .b3-vb::after · b3/board.css:3207 |
| content | `""` | .b3-vb::after · b3/board.css:3207 |


### `div.sel.wg-r`

inside `.wg` · 1 on screen · **1 look**

#### the one look

`M1s-86` · rendered **1046×85** · 1 instance look like this

```html
<div class="wg-r sel" tabindex="0"><span class="wg-cb" role="checkbox" tabindex="0" aria-checked="true" aria-label="Select BAL-27 build 1"><span class="cb on"></span></span><span class="wg-ix" title="">1</span><div class="wg-main"><div class="wg-rail" style="--fo: 0px; --ft: 0px; --fb: 0px;"><span class="wg-at" data-slot="Muzzle" title="Muzzle" style="--sl: var(--sl-muzzle, var(--sl-unknown));">Gauge-9 Mono</span><sp
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .wg-r · app.css:1157 |
| position | `relative` | `relative` | .wg-r · app.css:1157 |
| grid-template-columns | `32px 28px minmax(0px, 1fr) 28px 144px 113px` | `32px 28px 605px 28px 144px 113px` | .wg-r · app.css:1157 |
| column-gap | `var(--s3)` | `12px` | .wg-r · app.css:1157 |
| align-items | `center` | `center` | .wg-r · app.css:1157 |
| min-height | `58px` | `58px` | html[data-b3-a1="fixed"] .wg-r · gates.css:257 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `0 var(--s4) 0 20px` | `` | .wg-r · app.css:1157 |
| padding-top | `` | `0px` | .wg-r · app.css:1157 |
| padding-right | `` | `16px` | .wg-r · app.css:1157 |
| padding-bottom | `` | `0px` | .wg-r · app.css:1157 |
| padding-left | `` | `20px` | .wg-r · app.css:1157 |
| border-top | `1px solid var(--rule3)` | `` | .wg-r · app.css:1157 |
| background | `color-mix(in srgb,var(--patch) 6%,transparent)` | `` | .wg-r.sel · app.css:1162 |
| background-color | `` | `color(srgb 0.94902 0.760784 0.188235 / 0.06)` | .wg-r.sel · app.css:1162 |
| background-image | `` | `none` | .wg-r.sel · app.css:1162 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| transition | `background .18s` | `` | .wg-r · app.css:1157 |
| cursor | `pointer` | `pointer` | .wg-r · app.css:1157 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .wg-r::before · app.css:1159 |
| width | `2.5px` | html[data-b3-a1="fixed"] .wg-r::before · gates.css:259 |
| top | `12px` | html[data-b3-a1="fixed"] .wg-r::before · gates.css:259 |
| bottom | `12px` | html[data-b3-a1="fixed"] .wg-r::before · gates.css:259 |
| left | `0px` | .wg-r::before · app.css:1159 |
| border-radius | `0 2px 2px 0` | html[data-b3-a1="fixed"] .wg-r::before · gates.css:259 |
| background | `var(--c)` | .wg-r::before · app.css:1159 |
| background-color | `` | .wg-r::before · app.css:1159 |
| background-image | `` | .wg-r::before · app.css:1159 |
| opacity | `0` | .wg-r::before · app.css:1159 |
| transition | `opacity .18s` | .wg-r::before · app.css:1159 |
| content | `""` | .wg-r::before · app.css:1159 |

**:hover** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `-2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)


### `span.cb.on`

inside `.wg-cb` · 1 on screen · **1 look**

#### the one look

`M1s-88` · rendered **18×18** · 1 instance look like this

```html
<span class="cb on"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .cb · app.css:1280 |
| position | `relative` | `relative` | .cb · app.css:1280 |
| width | `18px` | `18px` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| height | `18px` | `18px` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border | `0` | `` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| border-color | `var(--patch)` | `` | .cb.on · app.css:1281 |
| border-radius | `6px` | `` | html[data-b3-p4="b"] .cb · b3/board.css:723 |
| background | `linear-gradient(180deg,#F7D567,var(--patch))` | `` | html[data-b3-p4="b"] .cb.on · b3/board.css:730 |
| background-color | `` | `rgba(0, 0, 0, 0)` | html[data-b3-p4="b"] .cb.on · b3/board.css:730 |
| background-image | `` | `linear-gradient(rgb(247, 213, 103), rgb(242, 194, 48))` | html[data-b3-p4="b"] .cb.on · b3/board.css:730 |
| box-shadow | `0 0 0 3px color-mix(in srgb,var(--patch) 22%,transparent),inset 0 -1px 0 rgba(0,0,0,.18)` | `color(srgb 0.94902 0.760784 0.188235 / 0.22) 0px 0px 0px 3px, rgba(0, 0, 0, 0.18) 0px -1px 0px 0px inset` | html[data-b3-p4="b"] .cb.on · b3/board.css:730 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| transition | `background var(--b3-d1) var(--ease),box-shadow var(--b3-d1) var(--ease)` | `` | html[data-b3-p4="a"] .cb, html[data-b3-p4="b"] .cb · b3/board.css:711 |
| cursor | ↑ `pointer` | `pointer` | inherited · .wg-cb · app.css:1120 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| width | `100%` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| height | `100%` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| top | `0px` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| left | `0px` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| border | `0` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| border-width | `0 2px 2px 0` | .cb.on::after · app.css:1282 |
| background | `var(--on-accent)` | html[data-b3-p4="b"] .cb.on::after · b3/board.css:731 |
| background-color | `` | html[data-b3-p4="b"] .cb.on::after · b3/board.css:731 |
| background-image | `` | html[data-b3-p4="b"] .cb.on::after · b3/board.css:731 |
| clip-path | `inset(0px)` | html[data-b3-p4="a"] .cb.on::after, html[data-b3-p4="b"] .cb.on::after, html[data-b3-p4="a · b3/board.css:286 |
| mask | `var(--b3-check) center/12px no-repeat` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| mask-image | `` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| transform | `none` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |
| transition | `clip-path var(--b3-d2) cubic-bezier(.16,1,.3,1),background var(--b3-d1) var(--ease)` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:282 |
| content | `""` | html[data-b3-p4="a"] .cb::after, html[data-b3-p4="b"] .cb::after · b3/board.css:712 |


### `div.b3-selbar.on.selbar[role=region]`

inside `.panel` · 1 on screen · **1 look**

#### the one look

`M1s-727` · rendered **1148×66** · 1 instance look like this · aria-label="Actions for the selected builds" role="region"

```html
<div class="selbar on b3-selbar" role="region" aria-label="Actions for the selected builds"><div class="b3-sd mesh" style="--m1: #ff3b5c; --m2: var(--r-armory);"><div class="b3-sd-bar"><span class="b3-sd-count" aria-label="1 selected">1</span><div class="b3-sd-chips" style="--fo: 0px; --ft: 0px; --fb: 5px;"><span class="b3-sc" style="--c: #ff3b5c;"><i aria-hidden="true"></i><span class="b3-nw">BAL-27<em>Build 1</em><
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .selbar · app.css:5141 |
| position | `absolute` | `absolute` | .g-stage .selbar · gates.css:156 |
| justify-content | `center` | `center` | .selbar · app.css:5141 |
| width | `auto` | `1148px` | .g-stage .selbar · gates.css:156 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `0 16px` | `` | .b3-selbar · b3/board.css:742 |
| padding-top | `0px` | `0px` | .b3-selbar · b3/board.css:742 |
| padding-right | `16px` | `16px` | .b3-selbar · b3/board.css:742 |
| padding-bottom | `0px` | `0px` | .b3-selbar · b3/board.css:742 |
| padding-left | `16px` | `16px` | .b3-selbar · b3/board.css:742 |
| top | `auto` | `754px` | .g-stage .selbar · gates.css:156 |
| right | `0px` | `0px` | .g-stage .selbar · gates.css:156 |
| bottom | `0px` | `0px` | .g-stage .selbar · gates.css:156 |
| left | `0px` | `0px` | .g-stage .selbar · gates.css:156 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| transform | `none` | `none` | .selbar.on · app.css:5144 |
| transition | `transform var(--dur-3) var(--ease)` | `` | .selbar · app.css:5141 |
| z-index | `42` | `42` | .selbar · app.css:5141 |
| pointer-events | `none` | `none` | .selbar · app.css:5141 |


### `div.b3-sd.mesh`

inside `.selbar` · 1 on screen · **1 look**

#### the one look

`M1s-728` · rendered **1100×66** · 1 instance look like this

```html
<div class="b3-sd mesh" style="--m1: #ff3b5c; --m2: var(--r-armory);"><div class="b3-sd-bar"><span class="b3-sd-count" aria-label="1 selected">1</span><div class="b3-sd-chips" style="--fo: 0px; --ft: 0px; --fb: 5px;"><span class="b3-sc" style="--c: #ff3b5c;"><i aria-hidden="true"></i><span class="b3-nw">BAL-27<em>Build 1</em></span><button type="button" aria-label="Deselect BAL-27">⟨svg.ic⟩</button></span></div><butt
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .dk, .exs-i, .exs-pick, .b3-tk, .b3-xf, .pb-enc, .b3-sd · gates.css:868 |
| width | ⚠️ `100%` | `1100px` | .b3-sd · b3/board.css:743 · **overridden — see computed** |
| max-width | `1100px` | `1100px` | .b3-sd · b3/board.css:743 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border | `1px solid var(--b3-edge,var(--rule2))` | `` | .dk, .exs-i, .exs-pick, .b3-tk, .b3-xf, .pb-enc, .b3-sd · gates.css:868 |
| border-radius | `16px` | `` | .b3-sd · b3/board.css:743 |
| outline | `0` | `` | .dk, .exs-i, .exs-pick, .b3-tk, .b3-xf, .pb-enc, .b3-sd · gates.css:868 |
| outline-offset | `-1px` | `-1px` | .b3-tk, .b3-xf, .pb-enc, .b3-sd · b3/board.css:4057 |
| background | `radial-gradient(78% 210% at -8% 118%,color-mix(in srgb,var(--m1) 15%,transparent) 0,transparent 68%), radial-gradient(66% 190% at 26% -22%,color-mix(in srgb,var(--m3,var(--patch)) 13%,transparent) 0,transparent 66%), radial-gradient(72% 200% at 68% 132%,color-mix(in srgb,var(--m2) 12%,transparent) 0,transparent 70%), radial-gradient(60% 180% at 112% -16%,color-mix(in srgb,var(--m4,var(--r-armory)) 11%,transparent) 0,transparent 68%), radial-gradient(120% 120% at 50% 50%,transparent 38%,#00000055 100%), linear-gradient(180deg,#ffffff0a 0,transparent 26%), color-mix(in srgb,#0B0F12 42%,var(--raised))` | `` | .b3-sd.mesh · b3/board.css:753 |
| background-color | `` | `color(srgb 0.0886275 0.113412 0.134275)` | .b3-sd.mesh · b3/board.css:753 |
| background-image | `` | `radial-gradient(78% 210% at -8% 118%, color(srgb 1 0.231373 0.360784 / 0.15) 0px, rgba(0, 0, 0, 0) 68%), radial-gradient(66% 190% at 26% -22%, color(srgb 0.94902 0.760784 0.188235 / 0.13) 0px, rgba(0, 0, 0, 0) 66%), radial-gradient(72% 200% at 68% 132%, color(srgb 0.937255 0.266667 0.266667 / 0.12) 0px, rgba(0, 0, 0, 0) 70%), radial-gradient(60% 180% at 112% -16%, color(srgb 0.937255 0.266667 0.266667 / 0.11) 0px, rgba(0, 0, 0, 0) 68%), radial-gradient(120% 120%, rgba(0, 0, 0, 0) 38%, rgba(0, 0, 0, 0.333) 100%), linear-gradient(rgba(255, 255, 255, 0.04) 0px, rgba(0, 0, 0, 0) 26%), none` | .b3-sd.mesh · b3/board.css:753 |
| box-shadow | `rgba(255, 255, 255, 0.03) 0px 1px 0px inset, rgb(0, 0, 0) 0px 26px 52px -18px` | `rgba(255, 255, 255, 0.03) 0px 1px 0px 0px inset, rgb(0, 0, 0) 0px 26px 52px -18px` | .b3-sd · gates.css:870 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| transition | `background-color var(--b3-d3) var(--ease)` | `` | .b3-sd.mesh · b3/board.css:763 |
| pointer-events | `auto` | `auto` | .b3-sd · b3/board.css:743 |


### `div.b3-sd-bar`

inside `.b3-sd` · 1 on screen · **1 look**

#### the one look

`M1s-729` · rendered **1098×64** · 1 instance look like this

```html
<div class="b3-sd-bar"><span class="b3-sd-count" aria-label="1 selected">1</span><div class="b3-sd-chips" style="--fo: 0px; --ft: 0px; --fb: 5px;"><span class="b3-sc" style="--c: #ff3b5c;"><i aria-hidden="true"></i><span class="b3-nw">BAL-27<em>Build 1</em></span><button type="button" aria-label="Deselect BAL-27">⟨svg.ic⟩</button></span></div><button type="button" class="b3-btn2 ghost b3-sd-tog" aria-expanded="false"
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-sd-bar · b3/board.css:764 |
| gap | `10px` | `` | .b3-sd-bar · b3/board.css:764 |
| column-gap | `10px` | `10px` | .b3-sd-bar · b3/board.css:764 |
| row-gap | `10px` | `10px` | .b3-sd-bar · b3/board.css:764 |
| align-items | `center` | `center` | .b3-sd-bar · b3/board.css:764 |
| min-height | `64px` | `64px` | .b3-sd-bar · b3/board.css:764 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `10px 12px` | `` | .b3-sd-bar · b3/board.css:764 |
| padding-top | `10px` | `10px` | .b3-sd-bar · b3/board.css:764 |
| padding-right | `12px` | `12px` | .b3-sd-bar · b3/board.css:764 |
| padding-bottom | `10px` | `10px` | .b3-sd-bar · b3/board.css:764 |
| padding-left | `12px` | `12px` | .b3-sd-bar · b3/board.css:764 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `span.b3-sd-count`

inside `.b3-sd-bar` · 1 on screen · **1 look**

#### the one look

`M1s-730` · rendered **40×40** · 1 instance look like this · text “1” · aria-label="1 selected"

```html
<span class="b3-sd-count" aria-label="1 selected">1</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-sd-count · b3/board.css:765 |
| flex | `none` | `` | .b3-sd-count · b3/board.css:765 |
| align-items | `center` | `center` | .b3-sd-count · b3/board.css:765 |
| place-items | `center` | `` | .b3-sd-count · b3/board.css:765 |
| min-width | `40px` | `40px` | .b3-sd-count · b3/board.css:765 |
| height | `40px` | `40px` | .b3-sd-count · b3/board.css:765 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `0 9px` | `` | .b3-sd-count · b3/board.css:765 |
| padding-top | `0px` | `0px` | .b3-sd-count · b3/board.css:765 |
| padding-right | `9px` | `9px` | .b3-sd-count · b3/board.css:765 |
| padding-bottom | `0px` | `0px` | .b3-sd-count · b3/board.css:765 |
| padding-left | `9px` | `9px` | .b3-sd-count · b3/board.css:765 |
| border-radius | `10px` | `` | .b3-sd-count · b3/board.css:765 |
| background | `var(--patch)` | `` | .b3-sd-count · b3/board.css:765 |
| background-color | `` | `rgb(242, 194, 48)` | .b3-sd-count · b3/board.css:765 |
| background-image | `` | `none` | .b3-sd-count · b3/board.css:765 |
| font | `700 var(--t-lg)/1 var(--data)` | `` | .b3-sd-count · b3/board.css:765 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .b3-sd-count · b3/board.css:765 |
| font-size | `` | `16.5px` | .b3-sd-count · b3/board.css:765 |
| font-weight | `` | `700` | .b3-sd-count · b3/board.css:765 |
| font-style | `` | `normal` | .b3-sd-count · b3/board.css:765 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .b3-sd-count · b3/board.css:765 |
| line-height | `` | `16.5px` | .b3-sd-count · b3/board.css:765 |
| letter-spacing | — | `normal` | initial |
| color | `var(--on-accent)` | `rgb(7, 9, 10)` | .b3-sd-count · b3/board.css:765 |


### `div.b3-sd-chips`

inside `.b3-sd-bar` · 1 on screen · **1 look**

#### the one look

`M1s-731` · rendered **488×32** · 1 instance look like this

```html
<div class="b3-sd-chips" style="--fo: 0px; --ft: 0px; --fb: 5px;"><span class="b3-sc" style="--c: #ff3b5c;"><i aria-hidden="true"></i><span class="b3-nw">BAL-27<em>Build 1</em></span><button type="button" aria-label="Deselect BAL-27">⟨svg.ic⟩</button></span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-sd-chips · b3/board.css:2166 |
| grid-template-rows | `none` | `none` | .b3-sd-chips · b3/board.css:2166 |
| gap | `5px` | `` | .b3-sd-chips · b3/board.css:769 |
| column-gap | `5px` | `5px` | .b3-sd-chips · b3/board.css:769 |
| row-gap | `5px` | `5px` | .b3-sd-chips · b3/board.css:769 |
| flex | `1` | `` | .b3-sd-chips · b3/board.css:769 |
| flex-wrap | `wrap` | `wrap` | .b3-sd-chips · b3/board.css:2166 |
| justify-content | `start` | `start` | .b3-sd-chips · b3/board.css:769 |
| min-width | `0px` | `0px` | .b3-sd-chips · b3/board.css:769 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| overflow-x | `auto` | `auto` | .b3-sd-chips · b3/board.css:769 |
| overflow-y | `hidden` | `hidden` | .b3-sd-chips · b3/board.css:769 |
| mask-image | `linear-gradient(90deg, rgb(0, 0, 0) calc(100% - 48px), transparent)` | `linear-gradient(90deg, rgb(0, 0, 0) calc(100% - 48px), rgba(0, 0, 0, 0))` | .b3-sd-chips · b3/board.css:769 |


### `span.b3-sc`

inside `.b3-sd-chips` · 1 on screen · **1 look**

#### the one look

`M1s-732` · rendered **157×32** · 1 instance look like this

```html
<span class="b3-sc" style="--c: #ff3b5c;"><i aria-hidden="true"></i><span class="b3-nw">BAL-27<em>Build 1</em></span><button type="button" aria-label="Deselect BAL-27">⟨svg.ic⟩</button></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-sc · b3/board.css:786 |
| gap | `7px` | `` | .b3-sc · b3/board.css:786 |
| column-gap | `7px` | `7px` | .b3-sc · b3/board.css:786 |
| row-gap | `7px` | `7px` | .b3-sc · b3/board.css:786 |
| flex | `none` | `` | .b3-sc · b3/board.css:786 |
| align-items | `center` | `center` | .b3-sc · b3/board.css:786 |
| max-width | `none` | `none` | .b3-sc · b3/board.css:1784 |
| height | `32px` | `32px` | .b3-sc · b3/board.css:786 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `0 4px 0 11px` | `` | .b3-sc · b3/board.css:786 |
| padding-top | `0px` | `0px` | .b3-sc · b3/board.css:786 |
| padding-right | `4px` | `4px` | .b3-sc · b3/board.css:786 |
| padding-bottom | `0px` | `0px` | .b3-sc · b3/board.css:786 |
| padding-left | `11px` | `11px` | .b3-sc · b3/board.css:786 |
| border | `0` | `` | .b3-sc · b3/board.css:786 |
| border-radius | `var(--rad-pill)` | `` | .b3-sc · b3/board.css:786 |
| background | `color-mix(in srgb,var(--sunk) 80%,transparent)` | `` | .b3-sc · b3/board.css:786 |
| background-color | `` | `color(srgb 0.0431373 0.0588235 0.0705882 / 0.8)` | .b3-sc · b3/board.css:786 |
| background-image | `` | `none` | .b3-sc · b3/board.css:786 |
| box-shadow | `var(--b3-ring)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .b3-sc · b3/board.css:786 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .b3-sc · b3/board.css:786 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-sc · b3/board.css:786 |
| font-size | `` | `12px` | .b3-sc · b3/board.css:786 |
| font-weight | `` | `600` | .b3-sc · b3/board.css:786 |
| font-style | `` | `normal` | .b3-sc · b3/board.css:786 |
| font-variant-numeric | `` | `normal` | .b3-sc · b3/board.css:786 |
| line-height | `` | `12px` | .b3-sc · b3/board.css:786 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .b3-sc · b3/board.css:786 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .b3-sc · b3/board.css:786 |
| animation | `b3chipin .28s cubic-bezier(.16,1,.3,1) .1s backwards` | `` | .b3-sd-chips > .b3-sc · b3/board.css:2876 |


### `span.b3-nw`

inside `.b3-sc` · 1 on screen · **1 look**

#### the one look

`M1s-734` · rendered **97×12** · 1 instance look like this

```html
<span class="b3-nw">BAL-27<em>Build 1</em></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-nw · b3/board.css:950 |
| gap | `8px` | `` | .b3-sc .b3-nw · b3/board.css:2267 |
| column-gap | `8px` | `8px` | .b3-sc .b3-nw · b3/board.css:2267 |
| row-gap | `8px` | `8px` | .b3-sc .b3-nw · b3/board.css:2267 |
| align-items | `baseline` | `baseline` | .b3-nw · b3/board.css:950 |
| min-width | `0px` | `0px` | .b3-nw · b3/board.css:950 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `inherit` | `` | .b3-nw · b3/board.css:950 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-nw · b3/board.css:950 |
| font-size | `inherit` | `12px` | .b3-nw · b3/board.css:950 |
| font-weight | `inherit` | `600` | .b3-nw · b3/board.css:950 |
| font-style | `inherit` | `normal` | .b3-nw · b3/board.css:950 |
| font-variant-numeric | `inherit` | `normal` | .b3-nw · b3/board.css:950 |
| line-height | `inherit` | `12px` | .b3-nw · b3/board.css:950 |
| letter-spacing | — | `normal` | initial |
| white-space | ↑ `nowrap` | `` | inherited · .b3-sc · b3/board.css:786 |
| color | `inherit` | `rgb(232, 237, 241)` | .b3-nw · b3/board.css:950 |


### `button.b3-btn2.b3-sd-tog.ghost`

inside `.b3-sd-bar` · 1 on screen · **1 look**

#### the one look

`M1s-737` · rendered **68×40** · 1 instance look like this · aria-expanded="false" type="button"

```html
<button type="button" class="b3-btn2 ghost b3-sd-tog" aria-expanded="false">⟨svg.ic.ic-fold⟩List</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-btn2 · b3/board.css:801 |
| gap | `8px` | `` | .b3-btn2 · b3/board.css:801 |
| column-gap | `8px` | `8px` | .b3-btn2 · b3/board.css:801 |
| row-gap | `8px` | `8px` | .b3-btn2 · b3/board.css:801 |
| flex | `none` | `` | .b3-btn2 · b3/board.css:801 |
| align-items | `center` | `center` | .b3-btn2 · b3/board.css:801 |
| height | `40px` | `40px` | .b3-btn2 · b3/board.css:801 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · app.css:388 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `0 12px` | `` | .b3-btn2.ghost · b3/board.css:811 |
| padding-top | `0px` | `0px` | .b3-btn2.ghost · b3/board.css:811 |
| padding-right | `12px` | `12px` | .b3-btn2.ghost · b3/board.css:811 |
| padding-bottom | `0px` | `0px` | .b3-btn2.ghost · b3/board.css:811 |
| padding-left | `12px` | `12px` | .b3-btn2.ghost · b3/board.css:811 |
| border | `0` | `` | .b3-btn2 · b3/board.css:801 |
| border-radius | `var(--rad-box)` | `` | .b3-btn2 · b3/board.css:3320 |
| background | `none` | `` | .b3-btn2.ghost · b3/board.css:811 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .b3-btn2.ghost · b3/board.css:811 |
| background-image | `none` | `none` | .b3-btn2.ghost · b3/board.css:811 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--rule2) 70%,transparent)` | `color(srgb 0.227451 0.278431 0.321569 / 0.7) 0px 0px 0px 1px inset` | .b3-sd .b3-btn2.b3-sd-tog · b3/board.css:540 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .b3-btn2 · b3/board.css:801 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-btn2 · b3/board.css:801 |
| font-size | `` | `12px` | .b3-btn2 · b3/board.css:801 |
| font-weight | `` | `600` | .b3-btn2 · b3/board.css:801 |
| font-style | `` | `normal` | .b3-btn2 · b3/board.css:801 |
| font-variant-numeric | `` | `normal` | .b3-btn2 · b3/board.css:801 |
| line-height | `` | `12px` | .b3-btn2 · b3/board.css:801 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | `nowrap` | `` | .b3-btn2 · b3/board.css:801 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .b3-btn2.ghost · b3/board.css:3321 |
| transition | `background var(--dur-1) var(--ease),box-shadow var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | .b3-btn2 · b3/board.css:801 |
| cursor | `pointer` | `pointer` | .b3-btn2 · b3/board.css:801 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| box-shadow | `color(srgb 0.227451 0.278431 0.321569 / 0.7) 0px 0px 0px 1px inset` | `oklab(0.390863 -0.0110071 -0.0225948 / 0.7) 0px 0px 0px 1px inset` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `i.b3-vr`

inside `.b3-sd-bar` · 1 on screen · **1 look**

#### the one look

`M1s-739` · rendered **1×28** · 1 instance look like this · aria-hidden="true"

```html
<i class="b3-vr" aria-hidden="true"></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .b3-vr · b3/board.css:72 |
| width | `1px` | `1px` | .b3-vr · b3/board.css:72 |
| height | `28px` | `28px` | .b3-vr · b3/board.css:72 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| background | `var(--rule2)` | `` | .b3-vr · b3/board.css:72 |
| background-color | `` | `rgb(58, 71, 82)` | .b3-vr · b3/board.css:72 |
| background-image | `` | `none` | .b3-vr · b3/board.css:72 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `div.b3-sd-acts`

inside `.b3-sd-bar` · 1 on screen · **1 look**

#### the one look

`M1s-740` · rendered **437×40** · 1 instance look like this

```html
<div class="b3-sd-acts"><button type="button" class="b3-btn2">⟨svg.ic⟩Edit build</button><button type="button" class="b3-btn2">⟨svg.ic⟩Export</button><span class="b3-hint" data-side="top"><button type="button" class="b3-btn2 dang" aria-describedby="b3-del-hint">⟨svg.ic⟩Stage deletion</button></span><button type="button" class="b3-btn2 quiet">⟨svg.ic⟩Clear</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .b3-sd-acts · b3/board.css:800 |
| gap | `8px` | `` | .b3-sd-acts · b3/board.css:800 |
| column-gap | `8px` | `8px` | .b3-sd-acts · b3/board.css:800 |
| row-gap | `8px` | `8px` | .b3-sd-acts · b3/board.css:800 |
| flex | `none` | `` | .b3-sd-acts · b3/board.css:800 |
| align-items | `center` | `center` | .b3-sd-acts · b3/board.css:800 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `button.b3-btn2.dang`

inside `.b3-hint` · 1 on screen · **1 look**

#### the one look

`M1s-746` · rendered **136×40** · 1 instance look like this · type="button"

```html
<button type="button" class="b3-btn2 dang" aria-describedby="b3-del-hint">⟨svg.ic⟩Stage deletion</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-btn2 · b3/board.css:801 |
| gap | `8px` | `` | .b3-btn2 · b3/board.css:801 |
| column-gap | `8px` | `8px` | .b3-btn2 · b3/board.css:801 |
| row-gap | `8px` | `8px` | .b3-btn2 · b3/board.css:801 |
| flex | `none` | `` | .b3-btn2 · b3/board.css:801 |
| align-items | `center` | `center` | .b3-btn2 · b3/board.css:801 |
| height | `40px` | `40px` | .b3-btn2 · b3/board.css:801 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · app.css:388 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `0 15px 0 13px` | `` | .b3-btn2 · b3/board.css:801 |
| padding-top | `0px` | `0px` | .b3-btn2 · b3/board.css:801 |
| padding-right | `15px` | `15px` | .b3-btn2 · b3/board.css:801 |
| padding-bottom | `0px` | `0px` | .b3-btn2 · b3/board.css:801 |
| padding-left | `13px` | `13px` | .b3-btn2 · b3/board.css:801 |
| border | `0` | `` | .b3-btn2 · b3/board.css:801 |
| border-radius | `var(--rad-box)` | `` | .b3-btn2 · b3/board.css:3320 |
| background | `color-mix(in srgb,var(--sunk) 85%,transparent)` | `` | .b3-btn2 · b3/board.css:801 |
| background-color | `` | `color(srgb 0.0431373 0.0588235 0.0705882 / 0.85)` | .b3-btn2 · b3/board.css:801 |
| background-image | `` | `none` | .b3-btn2 · b3/board.css:801 |
| box-shadow | `inset 0 0 0 1px var(--danger-edge)` | `rgb(84, 50, 47) 0px 0px 0px 1px inset` | .b3-btn2.dang · b3/board.css:807 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .b3-btn2 · b3/board.css:801 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-btn2 · b3/board.css:801 |
| font-size | `` | `12px` | .b3-btn2 · b3/board.css:801 |
| font-weight | `` | `600` | .b3-btn2 · b3/board.css:801 |
| font-style | `` | `normal` | .b3-btn2 · b3/board.css:801 |
| font-variant-numeric | `` | `normal` | .b3-btn2 · b3/board.css:801 |
| line-height | `` | `12px` | .b3-btn2 · b3/board.css:801 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | `nowrap` | `` | .b3-btn2 · b3/board.css:801 |
| color | `var(--danger-ink)` | `rgb(255, 138, 133)` | .b3-btn2.dang · b3/board.css:807 |
| transition | `background var(--dur-1) var(--ease),box-shadow var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | .b3-btn2 · b3/board.css:801 |
| cursor | `pointer` | `pointer` | .b3-btn2 · b3/board.css:801 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `color(srgb 0.0431373 0.0588235 0.0705882 / 0.85)` | `oklab(0.165465 -0.0044266 -0.0078463 / 0.85)` |
| box-shadow | `rgb(84, 50, 47) 0px 0px 0px 1px inset` | `oklab(0.357981 0.0453127 0.0214469) 0px 0px 0px 1px inset` |
| color | `rgb(255, 138, 133)` | `oklab(0.760405 0.130849 0.0570132)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `button.b3-btn2.quiet`

inside `.b3-sd-acts` · 1 on screen · **1 look**

#### the one look

`M1s-748` · rendered **80×40** · 1 instance look like this · type="button"

```html
<button type="button" class="b3-btn2 quiet">⟨svg.ic⟩Clear</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-btn2 · b3/board.css:801 |
| gap | `8px` | `` | .b3-btn2 · b3/board.css:801 |
| column-gap | `8px` | `8px` | .b3-btn2 · b3/board.css:801 |
| row-gap | `8px` | `8px` | .b3-btn2 · b3/board.css:801 |
| flex | `none` | `` | .b3-btn2 · b3/board.css:801 |
| align-items | `center` | `center` | .b3-btn2 · b3/board.css:801 |
| height | `40px` | `40px` | .b3-btn2 · b3/board.css:801 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · app.css:388 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `0 15px 0 13px` | `` | .b3-btn2 · b3/board.css:801 |
| padding-top | `0px` | `0px` | .b3-btn2 · b3/board.css:801 |
| padding-right | `15px` | `15px` | .b3-btn2 · b3/board.css:801 |
| padding-bottom | `0px` | `0px` | .b3-btn2 · b3/board.css:801 |
| padding-left | `13px` | `13px` | .b3-btn2 · b3/board.css:801 |
| border | `0` | `` | .b3-btn2 · b3/board.css:801 |
| border-radius | `var(--rad-box)` | `` | .b3-btn2 · b3/board.css:3320 |
| background | `none` | `` | .b3-btn2.quiet · b3/board.css:809 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .b3-btn2.quiet · b3/board.css:809 |
| background-image | `none` | `none` | .b3-btn2.quiet · b3/board.css:809 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--rule2) 70%,transparent)` | `color(srgb 0.227451 0.278431 0.321569 / 0.7) 0px 0px 0px 1px inset` | .b3-btn2.quiet · b3/board.css:809 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .b3-btn2 · b3/board.css:801 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-btn2 · b3/board.css:801 |
| font-size | `` | `12px` | .b3-btn2 · b3/board.css:801 |
| font-weight | `` | `600` | .b3-btn2 · b3/board.css:801 |
| font-style | `` | `normal` | .b3-btn2 · b3/board.css:801 |
| font-variant-numeric | `` | `normal` | .b3-btn2 · b3/board.css:801 |
| line-height | `` | `12px` | .b3-btn2 · b3/board.css:801 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | `nowrap` | `` | .b3-btn2 · b3/board.css:801 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .b3-btn2.quiet · b3/board.css:809 |
| transition | `background var(--dur-1) var(--ease),box-shadow var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | .b3-btn2 · b3/board.css:801 |
| cursor | `pointer` | `pointer` | .b3-btn2 · b3/board.css:801 |
| user-select | `none` | `none` | :is(button, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], .b3-fc, .b3- · b3/board.css:4976 |

**:hover** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### H1 · a typed search

43 distinct signatures on screen; 11 not already specced above.


### `section.b3-hi.panel.uk.uw`

inside `.pb-stage` · 1 on screen · **1 look**

#### the one look

`H1q-1` · rendered **1092×764** · 1 instance look like this

```html
<section class="panel b3-hi uk uw" id="history-manifest"><div class="mtools b3-hi-tools"><div class="mt-r1"><span class="mlabel"><span>Events</span></span><span class="srch">⟨svg⟩<label class="sr" for="history-search">Search events</label><input id="history-search" class="has-hits" placeholder="Search what happened, or who"><span class="mhits" aria-live="polite">30 matches</span></span><button type="button" class="b3
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .panel.b3-hi · b3/board.css:5028 |
| flex-direction | `column` | `column` | .panel.b3-hi · b3/board.css:5028 |
| align-self | `start` | `start` | #history-manifest · b3/board.css:4703 |
| justify-self | `stretch` | `stretch` | #history-manifest · gates.css:42 |
| width | ⚠️ `100%` | `1092px` | #history-manifest · gates.css:42 · **overridden — see computed** |
| min-width | `0px` | `0px` | #history-manifest · gates.css:42 |
| max-height | `100%` | `100%` | .g-stage.g-fixed > .panel, .g-stage.g-fixed > section.panel · gates.css:148 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `0` | `` | .b3-hi · b3/board.css:1497 |
| padding-top | `0px` | `0px` | .b3-hi · b3/board.css:1497 |
| padding-right | `0px` | `0px` | .b3-hi · b3/board.css:1497 |
| padding-bottom | `0px` | `0px` | .b3-hi · b3/board.css:1497 |
| padding-left | `0px` | `0px` | .b3-hi · b3/board.css:1497 |
| margin | `0` | `` | #history-manifest · gates.css:42 |
| margin-top | `0px` | `0px` | #history-manifest · gates.css:42 |
| margin-right | `0px` | `0px` | #history-manifest · gates.css:42 |
| margin-bottom | `0px` | `0px` | #history-manifest · gates.css:42 |
| margin-left | `0px` | `0px` | #history-manifest · gates.css:42 |
| border | `1px solid var(--rule2)` | `` | .panel · app.css:2846 |
| border-radius | `var(--rad-2)` | `` | .panel · app.css:723 |
| background | `var(--paper)` | `` | .panel · app.css:723 |
| background-color | `` | `rgb(23, 30, 36)` | .panel · app.css:723 |
| background-image | `` | `none` | .panel · app.css:723 |
| box-shadow | `0 1px 0 rgba(255,255,255,.03) inset,0 18px 42px -30px var(--scrim-90)` | `rgba(255, 255, 255, 0.03) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.9) 0px 18px 42px -30px` | .panel, .identity · app.css:1631 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| overflow | `auto` | `` | .g-stage.g-fixed > .panel, .g-stage.g-fixed > section.panel · gates.css:148 |
| overflow-x | `auto` | `auto` | .g-stage.g-fixed > .panel, .g-stage.g-fixed > section.panel · gates.css:148 |
| overflow-y | `auto` | `auto` | .g-stage.g-fixed > .panel, .g-stage.g-fixed > section.panel · gates.css:148 |


### `input.has-hits`

inside `.srch` · 1 on screen · **1 look**

#### the one look

`H1q-8` · rendered **340×44** · 1 instance look like this

```html
<input id="history-search" class="has-hits" placeholder="Search what happened, or who">
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | input, textarea, select, button · user-agent:? |
| width | ⚠️ `100%` | `340px` | .srch input · app.css:1226 · **overridden — see computed** |
| height | `var(--h1-srchh,44px)` | `44px` | html[data-b3-a1] .b3-hi .mt-r1 > .srch, html[data-b3-a1] .b3-hi .mt-r1 > .srch input · gates.css:1019 |
| min-height | `var(--tap)` | `44px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · app.css:652 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · app.css:388 |
| padding | `8px 10px` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · app.css:652 |
| padding-top | `8px` | `8px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · app.css:652 |
| padding-right | `10px` | `10px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · app.css:652 |
| padding-bottom | `8px` | `8px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · app.css:652 |
| padding-left | `var(--ctl-pl,10px)` | `40px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]) · app.css:654 |
| border | `1px solid var(--rule2)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · app.css:652 |
| border-color | `var(--patch)` | `` | input:focus, select:focus, textarea:focus · app.css:666 |
| border-radius | `var(--rad-2)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · app.css:652 |
| outline | `none` | `` | input:focus, select:focus, textarea:focus · app.css:666 |
| outline-offset | `2px` | `2px` | :where(button, a, input, select, [tabindex]):focus-visible · app.css:2405 |
| background | `var(--sunk)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · app.css:652 |
| background-color | `` | `rgb(11, 15, 18)` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · app.css:652 |
| background-image | `` | `none` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · app.css:652 |
| box-shadow | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` | :focus-visible · app.css:1696 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button, input, select, textarea · app.css:615 |
| font-size | `inherit` | `13px` | button, input, select, textarea · app.css:615 |
| font-weight | `` | `400` | input, textarea, select, button · user-agent:? |
| font-style | `` | `normal` | input, textarea, select, button · user-agent:? |
| font-variant-numeric | `` | `normal` | input, textarea, select, button · user-agent:? |
| line-height | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `start` | `start` | input, textarea, select, button · user-agent:? |
| color | `inherit` | `rgb(232, 237, 241)` | button, input, select, textarea · app.css:615 |
| overflow-x | `clip !important !important` | `clip` | input:not([type="range" i], [type="checkbox" i], [type="radio" i]) · user-agent:? |
| overflow-y | `clip !important !important` | `clip` | input:not([type="range" i], [type="checkbox" i], [type="radio" i]) · user-agent:? |
| cursor | `text` | `text` | input · user-agent:? |
| user-select | `text` | `text` | :is(.b3-xt-code, .b3-src, .b3-ent, .exs-f, .b3-xt-pwf, code, kbd, input, textarea), [data- · b3/board.css:4977 |

**:hover** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)

**:focus-visible** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)

**:active** — changes nothing on the element (its ::before or a parent may still respond; see the rows above)


### `span.mhits`

inside `.srch` · 1 on screen · **1 look**

#### the one look

`H1q-9` · rendered **92×28** · 1 instance look like this · text “30 matches”

```html
<span class="mhits" aria-live="polite">30 matches</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .mhits · app.css:950 |
| position | `absolute` | `absolute` | .mhits · app.css:950 |
| align-items | `center` | `center` | .mhits · app.css:950 |
| height | `28px` | `28px` | .mhits · app.css:950 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `0 10px` | `` | .mhits · app.css:950 |
| padding-top | `0px` | `0px` | .mhits · app.css:950 |
| padding-right | `10px` | `10px` | .mhits · app.css:950 |
| padding-bottom | `0px` | `0px` | .mhits · app.css:950 |
| padding-left | `10px` | `10px` | .mhits · app.css:950 |
| top | ⚠️ `50%` | `22px` | .mhits · app.css:950 · **overridden — see computed** |
| right | `6px` | `6px` | .mhits · app.css:950 |
| border-radius | `var(--rad-2)` | `` | .mhits · app.css:950 |
| background | `color-mix(in srgb,var(--realm-c,var(--ink3)) 14%,transparent)` | `` | .mhits · app.css:950 |
| background-color | `` | `color(srgb 0 0.882353 0.85098 / 0.14)` | .mhits · app.css:950 |
| background-image | `` | `none` | .mhits · app.css:950 |
| font | `600 var(--t-sm)/1 var(--data)` | `` | .mhits · app.css:950 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .mhits · app.css:950 |
| font-size | `` | `12px` | .mhits · app.css:950 |
| font-weight | `` | `600` | .mhits · app.css:950 |
| font-style | `` | `normal` | .mhits · app.css:950 |
| font-variant-numeric | `` | `normal` | .mhits · app.css:950 |
| line-height | `` | `12px` | .mhits · app.css:950 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .mhits · app.css:950 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .mhits · app.css:950 |
| transform | `translateY(-50%)` | `matrix(1, 0, 0, 1, 0, -14)` | .mhits · app.css:950 |
| pointer-events | `none` | `none` | .mhits · app.css:950 |


### `i.on`

inside `.b3-meter` · 40 on screen · **2 looks**

#### look 1 of 2

`H1q-42` · rendered **3×5** · 1 instance look like this

```html
<i class="on"></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| width | `3px` | `3px` | .b3-meter i · b3/board.css:1552 |
| height | `5px` | `5px` | .b3-meter i:nth-child(1) · b3/board.css:1553 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border-radius | `1px` | `` | .b3-meter i · b3/board.css:1552 |
| background | `var(--sv)` | `` | .b3-meter i.on · b3/board.css:1554 |
| background-color | `` | `rgb(240, 180, 71)` | .b3-meter i.on · b3/board.css:1554 |
| background-image | `` | `none` | .b3-meter i.on · b3/board.css:1554 |
| font | ↑ `600 var(--t-sm)/1 var(--ui)` | `` | inherited · .b3-fc · b3/board.css:1225 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .b3-fc · b3/board.css:1225 |
| font-size | ↑ `` | `12px` | inherited · .b3-fc · b3/board.css:1225 |
| font-weight | ↑ `` | `600` | inherited · .b3-fc · b3/board.css:1225 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-fc · b3/board.css:1225 |
| line-height | ↑ `` | `12px` | inherited · .b3-fc · b3/board.css:1225 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | ↑ `nowrap` | `` | inherited · .b3-fc · b3/board.css:1225 |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .b3-fc.none, .b3-fc.none em, .b3-hi-burst > em > b · b3/board.css:4883 |
| cursor | ↑ `default` | `default` | inherited · .b3-fc.none · b3/board.css:4690 |

#### look 2 of 2

`H1q-43` · rendered **3×7** · 1 instance look like this

```html
<i class="on"></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| width | `3px` | `3px` | .b3-meter i · b3/board.css:1552 |
| height | `7px` | `7px` | .b3-meter i:nth-child(2) · b3/board.css:1553 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border-radius | `1px` | `` | .b3-meter i · b3/board.css:1552 |
| background | `var(--sv)` | `` | .b3-meter i.on · b3/board.css:1554 |
| background-color | `` | `rgb(240, 180, 71)` | .b3-meter i.on · b3/board.css:1554 |
| background-image | `` | `none` | .b3-meter i.on · b3/board.css:1554 |
| font | ↑ `600 var(--t-sm)/1 var(--ui)` | `` | inherited · .b3-fc · b3/board.css:1225 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .b3-fc · b3/board.css:1225 |
| font-size | ↑ `` | `12px` | inherited · .b3-fc · b3/board.css:1225 |
| font-weight | ↑ `` | `600` | inherited · .b3-fc · b3/board.css:1225 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-fc · b3/board.css:1225 |
| line-height | ↑ `` | `12px` | inherited · .b3-fc · b3/board.css:1225 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | ↑ `nowrap` | `` | inherited · .b3-fc · b3/board.css:1225 |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .b3-fc.none, .b3-fc.none em, .b3-hi-burst > em > b · b3/board.css:4883 |
| cursor | ↑ `default` | `default` | inherited · .b3-fc.none · b3/board.css:4690 |


### `i`

inside `.b3-meter` · 96 on screen · **1 look**

#### the one look

`H1q-44` · rendered **3×10** · 1 instance look like this

```html
<i class=""></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| width | `3px` | `3px` | .b3-meter i · b3/board.css:1552 |
| height | `10px` | `10px` | .b3-meter i:nth-child(3) · b3/board.css:1553 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border-radius | `1px` | `` | .b3-meter i · b3/board.css:1552 |
| background | `var(--rule2)` | `` | .b3-meter i · b3/board.css:1552 |
| background-color | `` | `rgb(58, 71, 82)` | .b3-meter i · b3/board.css:1552 |
| background-image | `` | `none` | .b3-meter i · b3/board.css:1552 |
| font | ↑ `600 var(--t-sm)/1 var(--ui)` | `` | inherited · .b3-fc · b3/board.css:1225 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .b3-fc · b3/board.css:1225 |
| font-size | ↑ `` | `12px` | inherited · .b3-fc · b3/board.css:1225 |
| font-weight | ↑ `` | `600` | inherited · .b3-fc · b3/board.css:1225 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `` | `normal` | inherited · .b3-fc · b3/board.css:1225 |
| line-height | ↑ `` | `12px` | inherited · .b3-fc · b3/board.css:1225 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | ↑ `nowrap` | `` | inherited · .b3-fc · b3/board.css:1225 |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .b3-fc.none, .b3-fc.none em, .b3-hi-burst > em > b · b3/board.css:4883 |
| cursor | ↑ `default` | `default` | inherited · .b3-fc.none · b3/board.css:4690 |


### `span.b3-av`

inside `.b3-fc` · 1 on screen · **1 look**

#### the one look

`H1q-57` · rendered **16×16** · 1 instance look like this · text “O”

```html
<span class="b3-av">O</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-grid` | `grid` | .b3-fc > .dot, .b3-fc > .b3-av, .b3-fc > .b3-meter, .b3-fc > .ic · b3/board.css:2322 |
| flex | `none` | `` | .b3-fc > .dot, .b3-fc > .b3-av, .b3-fc > .b3-meter, .b3-fc > .ic · b3/board.css:2322 |
| align-items | `center` | `center` | .b3-fc > .dot, .b3-fc > .b3-av, .b3-fc > .b3-meter, .b3-fc > .ic · b3/board.css:2322 |
| place-items | `center` | `` | .b3-fc > .dot, .b3-fc > .b3-av, .b3-fc > .b3-meter, .b3-fc > .ic · b3/board.css:2322 |
| width | `16px` | `16px` | .b3-fc > .dot, .b3-fc > .b3-av, .b3-fc > .b3-meter, .b3-fc > .ic · b3/board.css:2322 |
| height | `16px` | `16px` | .b3-fc > .dot, .b3-fc > .b3-av, .b3-fc > .b3-meter, .b3-fc > .ic · b3/board.css:2322 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| margin | `0` | `` | .b3-fc > .dot, .b3-fc > .b3-av, .b3-fc > .b3-meter, .b3-fc > .ic · b3/board.css:2322 |
| margin-top | `0px` | `0px` | .b3-fc > .dot, .b3-fc > .b3-av, .b3-fc > .b3-meter, .b3-fc > .ic · b3/board.css:2322 |
| margin-right | `0px` | `0px` | .b3-fc > .dot, .b3-fc > .b3-av, .b3-fc > .b3-meter, .b3-fc > .ic · b3/board.css:2322 |
| margin-bottom | `0px` | `0px` | .b3-fc > .dot, .b3-fc > .b3-av, .b3-fc > .b3-meter, .b3-fc > .ic · b3/board.css:2322 |
| margin-left | `0px` | `0px` | .b3-fc > .dot, .b3-fc > .b3-av, .b3-fc > .b3-meter, .b3-fc > .ic · b3/board.css:2322 |
| border-radius | `50%` | `` | .b3-av · b3/board.css:1511 |
| background | `linear-gradient(135deg,#4A6A85,#2C3E4E)` | `` | .b3-av · b3/board.css:1511 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .b3-av · b3/board.css:1511 |
| background-image | `linear-gradient(135deg, rgb(74, 106, 133), rgb(44, 62, 78))` | `linear-gradient(135deg, rgb(74, 106, 133), rgb(44, 62, 78))` | .b3-av · b3/board.css:1511 |
| font | `700 11px/1 var(--ui)` | `` | .b3-av · b3/board.css:1511 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-av · b3/board.css:1511 |
| font-size | `9px` | `9px` | .b3-fc > .b3-av · b3/board.css:2326 |
| font-weight | `` | `700` | .b3-av · b3/board.css:1511 |
| font-style | `` | `normal` | .b3-av · b3/board.css:1511 |
| font-variant-numeric | `` | `normal` | .b3-av · b3/board.css:1511 |
| line-height | `` | `9px` | .b3-av · b3/board.css:1511 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | ↑ `nowrap` | `` | inherited · .b3-fc · b3/board.css:1225 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .b3-av · b3/board.css:1511 |
| opacity | `0.4` | `0.4` | .b3-fc.none > .dot, .b3-fc.none > .b3-meter, .b3-fc.none > .b3-av, .b3-fc.none > .ic · b3/board.css:4692 |
| cursor | ↑ `default` | `default` | inherited · .b3-fc.none · b3/board.css:4690 |


### `span.b3-av.sys`

inside `.b3-fc` · 31 on screen · **1 look**

#### the one look

`H1q-119` · rendered **22×22** · 30 instances look like this

```html
<span class="b3-av sys">⟨svg.ic⟩</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-grid` | `grid` | .b3-av · b3/board.css:1511 |
| flex | `none` | `` | .b3-av · b3/board.css:1511 |
| align-items | `center` | `center` | .b3-av · b3/board.css:1511 |
| place-items | `center` | `` | .b3-av · b3/board.css:1511 |
| width | `22px` | `22px` | .b3-hi-r .b3-who .b3-av · b3/board.css:5069 |
| height | `22px` | `22px` | .b3-hi-r .b3-who .b3-av · b3/board.css:5069 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| border-radius | `50%` | `` | .b3-av · b3/board.css:1511 |
| background | `var(--sunk)` | `` | .b3-av.sys · b3/board.css:1512 |
| background-color | `` | `rgb(11, 15, 18)` | .b3-av.sys · b3/board.css:1512 |
| background-image | `` | `none` | .b3-av.sys · b3/board.css:1512 |
| box-shadow | `var(--b3-ring)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .b3-av.sys · b3/board.css:1512 |
| font | `700 11px/1 var(--ui)` | `` | .b3-av · b3/board.css:1511 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-av · b3/board.css:1511 |
| font-size | `10px` | `10px` | .b3-hi-r .b3-who .b3-av · b3/board.css:5069 |
| font-weight | `` | `700` | .b3-av · b3/board.css:1511 |
| font-style | `` | `normal` | .b3-av · b3/board.css:1511 |
| font-variant-numeric | `` | `normal` | .b3-av · b3/board.css:1511 |
| line-height | `` | `10px` | .b3-av · b3/board.css:1511 |
| letter-spacing | — | `normal` | initial |
| text-overflow | `ellipsis` | `ellipsis` | .b3-who > span:last-child · b3/board.css:1560 |
| white-space | `nowrap` | `` | .b3-who > span:last-child · b3/board.css:1560 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .b3-hi-r .b3-who .b3-av · b3/board.css:5069 |
| opacity | `0.75` | `0.75` | .b3-who.quiet .b3-av · b3/board.css:1535 |
| overflow | `hidden` | `` | .b3-who > span:last-child · b3/board.css:1560 |
| overflow-x | `hidden` | `hidden` | .b3-who > span:last-child · b3/board.css:1560 |
| overflow-y | `hidden` | `hidden` | .b3-who > span:last-child · b3/board.css:1560 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-hi-r · b3/board.css:1523 |


### `section.b3-hi-dg`

inside `.b3-hi-list` · 1 on screen · **1 look**

#### the one look

`H1q-97` · rendered **1090×1372** · 1 instance look like this

```html
<section class="b3-hi-dg" style="--n: 30;"><div class="b3-hi-day"><b class="b3-hi-dd">Thu, Aug 27</b><span class="b3-hi-dm"><span class="b3-hi-dk" style="--c: var(--warn);">⟨svg.ic⟩<em>30</em>alerts</span></span><span class="b3-hi-ds">11:41 AM – 9:42 PM</span></div><div class="b3-hi-r st-a" style="--c: var(--warn);"><span class="when">9:42 PM</span><span><span class="b3-htab quiet" title="Alert" aria-label="Alert">⟨s
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-hi-list > .b3-hi-h, .b3-hi-list > .b3-hi-dg, .b3-hi-dg > .b3-hi-day, .b3-hi-dg > .b3-h · b3/board.css:4716 |
| position | `relative` | `relative` | .b3-hi-dg · b3/board.css:4719 |
| grid-template-columns | `subgrid` | `subgrid [] [] [] [] [] []` | .b3-hi-list > .b3-hi-h, .b3-hi-list > .b3-hi-dg, .b3-hi-dg > .b3-hi-day, .b3-hi-dg > .b3-h · b3/board.css:4716 |
| grid-column | `1 / -1` | `` | .b3-hi-list > .b3-hi-h, .b3-hi-list > .b3-hi-dg, .b3-hi-dg > .b3-hi-day, .b3-hi-dg > .b3-h · b3/board.css:4716 |
| column-gap | `var(--h1-cell,16px)` | `22px` | .b3-hi .b3-hi-list > .b3-hi-h, .b3-hi .b3-hi-list > .b3-hi-dg, .b3-hi .b3-hi-dg > .b3-hi-d · gates.css:1022 |
| min-width | `0px` | `0px` | main .panel, main section · app.css:680 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |


### `div.b3-hi-r.st-a`

inside `.b3-hi-dg` · 1 on screen · **1 look**

#### the one look

`H1q-104` · rendered **1090×44** · 1 instance look like this

```html
<div class="b3-hi-r st-a" style="--c: var(--warn);"><span class="when">9:42 PM</span><span><span class="b3-htab quiet" title="Alert" aria-label="Alert">⟨svg.ic⟩</span></span><button type="button" class="what b3-hi-open"><span class="hlead"><span class="s">Bot online</span></span><span class="b3-lvl"><span class="b3-meter" aria-hidden="true" style="--sv: var(--sv-info);"><i class="on"></i><i class=""></i><i class=""><
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .b3-hi-list > .b3-hi-h, .b3-hi-list > .b3-hi-dg, .b3-hi-dg > .b3-hi-day, .b3-hi-dg > .b3-h · b3/board.css:4716 |
| position | `relative` | `relative` | .b3-hi-r · b3/board.css:1523 |
| grid-template-columns | `84px 28px minmax(0,1fr) 28px var(--h1-undo,92px)` | `84px 28px 728px 28px 90px` | html[data-b3-p9="b"] .b3-hi.uk.uw .b3-hi-h, html[data-b3-p9="b"] .b3-hi.uk.uw .b3-hi-r, ht · gates.css:1031 |
| grid-column | `1 / -1` | `` | .b3-hi-list > .b3-hi-h, .b3-hi-list > .b3-hi-dg, .b3-hi-dg > .b3-hi-day, .b3-hi-dg > .b3-h · b3/board.css:4716 |
| column-gap | `var(--h1-cell,16px)` | `22px` | .b3-hi .b3-hi-list > .b3-hi-h, .b3-hi .b3-hi-list > .b3-hi-dg, .b3-hi .b3-hi-dg > .b3-hi-d · gates.css:1022 |
| align-items | `center` | `center` | .b3-hi-h, .b3-hi-r · b3/board.css:1514 |
| min-height | `var(--h1-rowh,56px)` | `44px` | html[data-b3-p9="b"] .b3-hi-r · gates.css:1033 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `0 var(--h1-r,18px) 0 var(--h1-l,22px)` | `` | .b3-hi .b3-hi-list > .b3-hi-h, .b3-hi .b3-hi-dg > .b3-hi-r, .b3-hi .b3-hi-dg > .b3-hi-day, · gates.css:1023 |
| padding-top | `` | `0px` | .b3-hi .b3-hi-list > .b3-hi-h, .b3-hi .b3-hi-dg > .b3-hi-r, .b3-hi .b3-hi-dg > .b3-hi-day, · gates.css:1023 |
| padding-right | `` | `22px` | .b3-hi .b3-hi-list > .b3-hi-h, .b3-hi .b3-hi-dg > .b3-hi-r, .b3-hi .b3-hi-dg > .b3-hi-day, · gates.css:1023 |
| padding-bottom | `` | `0px` | .b3-hi .b3-hi-list > .b3-hi-h, .b3-hi .b3-hi-dg > .b3-hi-r, .b3-hi .b3-hi-dg > .b3-hi-day, · gates.css:1023 |
| padding-left | `` | `22px` | .b3-hi .b3-hi-list > .b3-hi-h, .b3-hi .b3-hi-dg > .b3-hi-r, .b3-hi .b3-hi-dg > .b3-hi-day, · gates.css:1023 |
| border-top | `0` | `` | .b3-hi-day + .b3-hi-r · b3/board.css:1524 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · app.css:614 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · b2.css:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · app.css:614 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · gates.css:6 |
| transition | `background var(--b3-d1) var(--ease)` | `` | .b3-hi-r · b3/board.css:4917 |
| cursor | `pointer` | `pointer` | .b3-hi-r · b3/board.css:1523 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .b3-hi-r::before · b3/board.css:1525 |
| width | `3px` | html[data-b3-p9="b"] .b3-hi-r::before · gates.css:921 |
| height | `auto` | html[data-b3-p9="b"] .b3-hi-r::before · gates.css:921 |
| margin-top | `0px` | html[data-b3-p9="b"] .b3-hi-r::before · gates.css:921 |
| top | `9px` | html[data-b3-p9="b"] .b3-hi-r::before · gates.css:921 |
| bottom | `0px` | html[data-b3-p9="b"] .b3-hi-r.st-a::before · gates.css:924 |
| left | `0px` | html[data-b3-p9="b"] .b3-hi-r::before · gates.css:921 |
| border-radius | `0 2px 2px 0` | html[data-b3-p9="b"] .b3-hi-r::before · gates.css:921 |
| background | `var(--c)` | html[data-b3-p9="b"] .b3-hi-r::before · gates.css:921 |
| background-color | `` | html[data-b3-p9="b"] .b3-hi-r::before · gates.css:921 |
| background-image | `` | html[data-b3-p9="b"] .b3-hi-r::before · gates.css:921 |
| box-shadow | `none` | html[data-b3-p9="b"] .b3-hi-r::before · gates.css:921 |
| content | `""` | .b3-hi-r::before · b3/board.css:1525 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | html[data-b3-p9="b"] .b3-hi-r::after · gates.css:674 |
| width | `1px` | html[data-b3-p9="b"] .b3-hi-r::after · gates.css:674 |
| top | `0px` | html[data-b3-p9="b"] .b3-hi-r::after · gates.css:674 |
| bottom | `0px` | html[data-b3-p9="b"] .b3-hi-r::after · gates.css:674 |
| left | `26px` | html[data-b3-p9="b"] .b3-hi-r::after · gates.css:674 |
| background | `var(--rule2)` | html[data-b3-p9="b"] .b3-hi-r::after · gates.css:674 |
| background-color | `` | html[data-b3-p9="b"] .b3-hi-r::after · gates.css:674 |
| background-image | `` | html[data-b3-p9="b"] .b3-hi-r::after · gates.css:674 |
| content | `none` | html[data-b3-p9="b"] .b3-hi-r::after · gates.css:927 |
| z-index | `-1` | html[data-b3-p9="b"] .b3-hi-r::after · gates.css:674 |


### `span.b3-htab.quiet`

inside `.—` · 30 on screen · **1 look**

#### the one look

`H1q-107` · rendered **24×24** · 30 instances look like this · aria-label="Alert" title="Alert"

```html
<span class="b3-htab quiet" title="Alert" aria-label="Alert">⟨svg.ic⟩</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `inline-flex` | .b3-htab · b3/board.css:1529 |
| gap | `6px` | `` | .b3-htab · b3/board.css:1529 |
| column-gap | `6px` | `6px` | .b3-htab · b3/board.css:1529 |
| row-gap | `6px` | `6px` | .b3-htab · b3/board.css:1529 |
| align-items | `center` | `center` | .b3-htab · b3/board.css:1529 |
| justify-content | `center` | `center` | .b3-htab.quiet · b3/board.css:1533 |
| width | `24px` | `24px` | .b3-htab.quiet · b3/board.css:1533 |
| height | `24px` | `24px` | .b3-htab · b3/board.css:1529 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| padding | `0` | `` | .b3-htab.quiet · b3/board.css:1533 |
| padding-top | `0px` | `0px` | .b3-htab.quiet · b3/board.css:1533 |
| padding-right | `0px` | `0px` | .b3-htab.quiet · b3/board.css:1533 |
| padding-bottom | `0px` | `0px` | .b3-htab.quiet · b3/board.css:1533 |
| padding-left | `0px` | `0px` | .b3-htab.quiet · b3/board.css:1533 |
| border-radius | `5px` | `` | .b3-htab · b3/board.css:1529 |
| background | `color-mix(in srgb,var(--c) 14%,transparent)` | `` | .b3-htab.quiet · b3/board.css:1533 |
| background-color | `` | `color(srgb 1 0.478431 0.270588 / 0.14)` | .b3-htab.quiet · b3/board.css:1533 |
| background-image | `` | `none` | .b3-htab.quiet · b3/board.css:1533 |
| box-shadow | `none` | `none` | .b3-htab.quiet · b3/board.css:1533 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .b3-htab · b3/board.css:1529 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-htab · b3/board.css:1529 |
| font-size | `` | `12px` | .b3-htab · b3/board.css:1529 |
| font-weight | `` | `600` | .b3-htab · b3/board.css:1529 |
| font-style | `` | `normal` | .b3-htab · b3/board.css:1529 |
| font-variant-numeric | `` | `normal` | .b3-htab · b3/board.css:1529 |
| line-height | `` | `12px` | .b3-htab · b3/board.css:1529 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .b3-htab · b3/board.css:1529 |
| color | `var(--c)` | `rgb(255, 122, 69)` | .b3-htab · b3/board.css:1529 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-hi-r · b3/board.css:1523 |


### `span.b3-who.quiet.sys`

inside `.b3-hi-r` · 30 on screen · **1 look**

#### the one look

`H1q-118` · rendered **22×22** · 30 instances look like this · title="system"

```html
<span class="b3-who sys quiet" title="system"><span class="b3-av sys">⟨svg.ic⟩</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .b3-who · b3/board.css:1559 |
| gap | `8px` | `` | .b3-hi-r .b3-who · b3/board.css:5071 |
| column-gap | `8px` | `8px` | .b3-hi-r .b3-who · b3/board.css:5071 |
| row-gap | `8px` | `8px` | .b3-hi-r .b3-who · b3/board.css:5071 |
| align-items | `center` | `center` | .b3-who · b3/board.css:1559 |
| justify-self | `center` | `center` | .b3-hi.uw .b3-hi-h > :nth-child(4), .b3-hi.uw .b3-hi-r .b3-who.quiet · b3/board.css:4680 |
| min-width | `0px` | `0px` | .b3-who · b3/board.css:1559 |
| box-sizing | `border-box` | `border-box` | * · app.css:612 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .b3-who · b3/board.css:1559 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .b3-who · b3/board.css:1559 |
| font-size | `` | `12px` | .b3-who · b3/board.css:1559 |
| font-weight | `` | `600` | .b3-who · b3/board.css:1559 |
| font-style | `` | `normal` | .b3-who · b3/board.css:1559 |
| font-variant-numeric | `` | `normal` | .b3-who · b3/board.css:1559 |
| line-height | `` | `12px` | .b3-who · b3/board.css:1559 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .b3-who.sys · b3/board.css:1561 |
| cursor | ↑ `pointer` | `pointer` | inherited · .b3-hi-r · b3/board.css:1523 |


