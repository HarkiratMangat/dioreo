---
kind: reference
status: frozen
---

# Pins-2 design board 2 — resolved values

*Generated 2026-09-14 16:08 EDT by `extract-spec.cjs` from `index.html` beside it (board version 21, closed by Harkirat 2026-09-14 15:22 EDT), at 1282×888. Plan: `docs/superpowers/plans/2026-09-13-portal-pins-batch-2.md` §10.4.*

**Why this file exists.** The board's stylesheet is thirteen review rounds of overrides layered at the end of one `<style>` block, so the first rule a reader finds for a class is usually not the one that renders — the first `.pb-rb` rule reads `44px 116px…`, the rendered row is `32px 28px minmax(0,1fr) 28px 144px 113px`. Each table below is Chrome's own answer (`CSS.getMatchedStylesForNode`, cascade order, `!important` honoured): the **winning declaration** is the expression to port — tokens and `color-mix()` intact — and **computed** is what it rendered to. Hover states are forced with `CSS.forcePseudoState`. A dash means no rule declares the property and the value is inherited.

**Porting, not copying.** `pb-` classes are board-only and never ship. The board's literal radii (5px, 6px, 7px), the nine `--sl-*` slot hues and `--pb-inset` are not portal tokens: plan §10.4 says where each lands. Portal radius tokens as resolved here: `--rad-1` `3px` · `--rad-2` `6px` · `--rad-3` `10px`.

**Re-generate** after any board change: `node docs/superpowers/mockups/2026-09-14-pins2-board-2/extract-spec.cjs docs/superpowers/mockups/2026-09-14-pins2-board-2/index.html <out.md>`, then copy the output below this header.
## Tokens as resolved on the board

| token | value |
|---|---|
| `--tap` | `44px` |
| `--rad-1` | `3px` |
| `--rad-2` | `6px` |
| `--rad-3` | `10px` |
| `--rad-pill` | `999px` |
| `--t-micro` | `9.5px` |
| `--t-xs` | `10.5px` |
| `--t-sm` | `12px` |
| `--t-base` | `13px` |
| `--t-md` | `14.5px` |
| `--ui` | `"Space Grotesk",-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif` |
| `--data` | `"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace` |
| `--display` | `"Big Shoulders Display","Space Grotesk",-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif` |
| `--ink` | `#E8EDF1` |
| `--ink2` | `#9DAAB4` |
| `--ink3` | `#85939F` |
| `--ink4` | `#5C6A75` |
| `--rule` | `#2A343D` |
| `--rule2` | `#3A4752` |
| `--rule3` | `#1C242A` |
| `--desk` | `#0F1418` |
| `--sunk` | `#0B0F12` |
| `--paper` | `#171E24` |
| `--raised` | `#1F272E` |
| `--hi` | `#232C34` |
| `--ok` | `#7BDB63` |
| `--warn` | `#FF7A45` |
| `--warn-ink` | `#FF9E72` |
| `--danger-ink` | `#FF8A85` |
| `--patch` | `#F2C230` |
| `--info` | `#409AD0` |
| `--sched` | `#A680FB` |
| `--r-armory` | `#EF4444` |
| `--r-broadcast` | `#EC4899` |
| `--r-history` | `#00E1D9` |
| `--r-analytics` | `#9CC85A` |
| `--sl-muzzle` | `oklch(76% .055 25)` |
| `--sl-barrel` | `oklch(76% .055 65)` |
| `--sl-optic` | `oklch(76% .055 190)` |
| `--sl-stock` | `oklch(76% .055 105)` |
| `--sl-perk` | `oklch(76% .055 300)` |
| `--sl-laser` | `oklch(76% .055 225)` |
| `--sl-underbarrel` | `oklch(76% .055 150)` |
| `--sl-ammunition` | `oklch(76% .055 340)` |
| `--sl-rear-grip` | `oklch(76% .055 260)` |
| `--pb-inset` | `5px` |


## G4 · Armory manifest — resting state

### Tools bar

`#g4man .pb-tools` · rendered 1148×132

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| gap | `12px` | `` |
| column-gap | `12px` | `12px` |
| row-gap | `12px` | `12px` |
| padding | `14px 16px` | `` |
| padding-left | `16px` | `16px` |
| padding-right | `16px` | `16px` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Toolbar label, first column

`#g4man .pb-t1 > .pb-lab` · rendered 84×10

| property | winning declaration | computed |
|---|---|---|
| min-width | `84px` | `84px` |
| font | `600 var(--t-micro)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `9.5px` |
| font-weight | `` | `600` |
| line-height | `` | `9.5px` |
| letter-spacing | `0.16em` | `1.52px` |
| text-transform | `uppercase` | `uppercase` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |

### Search field

`#g4man .pb-srch input` · rendered 340×44

| property | winning declaration | computed |
|---|---|---|
| display | `inline-block` | `block` |
| width | `100%` | `340px` |
| min-height | `var(--tap)` | `44px` |
| padding | `8px 10px` | `` |
| padding-left | `40px !important !important` | `40px` |
| padding-right | `108px !important !important` | `108px` |
| margin-left | `0em` | `0px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--rad-2)` | `` |
| background | `var(--sunk)` | `` |
| background-color | `` | `rgb(11, 15, 18)` |
| background-image | `` | `none` |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `var(--t-base)` | `13px` |
| font-weight | `` | `400` |
| line-height | `normal` | `normal` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| color | `inherit` | `rgb(157, 170, 180)` |
| cursor | `text` | `text` |

### Add build

`#g4man .pb-add` · rendered 117×44

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `8px` | `` |
| column-gap | `8px` | `8px` |
| row-gap | `8px` | `8px` |
| align-items | `center` | `center` |
| min-height | `var(--tap)` | `44px` |
| padding | `0 18px` | `` |
| padding-left | `18px` | `18px` |
| padding-right | `18px` | `18px` |
| margin-left | `auto` | `551.016px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--rad-pill)` | `` |
| background | `var(--sunk)` | `` |
| background-color | `` | `rgb(11, 15, 18)` |
| background-image | `` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `var(--t-sm)` | `12px` |
| font-weight | `600` | `600` |
| line-height | `inherit` | `18px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| text-decoration | `none` | `` |
| color | `var(--staged)` | `rgb(216, 242, 74)` |
| transition | `background .16s ease,color .16s ease` | `` |
| cursor | `pointer` | `pointer` |

### Chip group

`#g4man .pb-t2 > .pb-grp:first-child` · rendered 774×32

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `8px` | `` |
| column-gap | `8px` | `8px` |
| row-gap | `8px` | `8px` |
| align-items | `center` | `center` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Chip group after a divider

`#g4man .pb-t2 > .pb-grp + .pb-grp` · rendered 235×42

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `8px` | `` |
| column-gap | `8px` | `8px` |
| row-gap | `8px` | `8px` |
| align-items | `center` | `center` |
| padding-left | `16px` | `16px` |
| margin-left | `6px` | `6px` |
| box-shadow | `inset 1px 0 0 var(--rule2)` | `rgb(58, 71, 82) 1px 0px 0px 0px inset` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Label after a divider

`#g4man .pb-t2 > .pb-grp + .pb-grp > .pb-lab` · rendered 79×10

| property | winning declaration | computed |
|---|---|---|
| min-width | `0px` | `0px` |
| margin-right | `4px` | `4px` |
| font | `600 var(--t-micro)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `9.5px` |
| font-weight | `` | `600` |
| line-height | `` | `9.5px` |
| letter-spacing | `0.16em` | `1.52px` |
| text-transform | `uppercase` | `uppercase` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |

### Category chip

`#g4man .pb-t2 .chip.topic` · rendered 100×32

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `7px` | `` |
| column-gap | `7px` | `7px` |
| row-gap | `7px` | `7px` |
| align-items | `center` | `center` |
| flex | `none` | `` |
| min-height | `32px` | `32px` |
| padding | `6px 11px` | `` |
| padding-left | `11px` | `11px` |
| padding-right | `11px` | `11px` |
| margin-left | `0em` | `0px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--rad-pill)` | `` |
| background | `var(--sunk)` | `` |
| background-color | `` | `rgb(11, 15, 18)` |
| background-image | `` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `var(--t-sm)` | `12px` |
| font-weight | `600` | `600` |
| line-height | `inherit` | `18px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| text-decoration | `none` | `` |
| color | `var(--ink2)` | `rgb(157, 170, 180)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |

### List · By slot switch

`#g4man .pb-t2 .pb-seg` · rendered 128×42

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `2px` | `` |
| column-gap | `2px` | `2px` |
| row-gap | `2px` | `2px` |
| padding | `3px` | `` |
| padding-left | `3px` | `3px` |
| padding-right | `3px` | `3px` |
| border-radius | `var(--rad-pill)` | `` |
| background | `var(--sunk)` | `` |
| background-color | `` | `rgb(11, 15, 18)` |
| background-image | `` | `none` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Column heads

`#g4man .pb-heads.pb-ghead` · rendered 1148×45

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| grid-template-columns | `32px minmax(0px, 1fr) auto` | `32px 938.547px 113.453px` |
| column-gap | `16px` | `16px` |
| align-items | `center` | `center` |
| min-height | `44px` | `44px` |
| padding | `0 16px` | `` |
| padding-left | `16px` | `16px` |
| padding-right | `16px` | `16px` |
| background | `var(--sunk)` | `` |
| background-color | `` | `rgb(11, 15, 18)` |
| background-image | `` | `none` |
| font | `600 var(--t-micro)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `9.5px` |
| font-weight | `` | `600` |
| line-height | `` | `9.5px` |
| letter-spacing | `0.14em` | `1.33px` |
| text-transform | `uppercase` | `uppercase` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |

### Weapon sort

`#g4man .pb-sort` · rendered 60×44

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `5px` | `` |
| column-gap | `5px` | `5px` |
| row-gap | `5px` | `5px` |
| align-items | `center` | `center` |
| min-height | `44px` | `44px` |
| padding | `0` | `` |
| padding-left | `0px` | `0px` |
| padding-right | `0px` | `0px` |
| margin-left | `0em` | `0px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--ctl-rad, 5px)` | `` |
| background | `none` | `` |
| background-color | `initial` | `rgba(0, 0, 0, 0)` |
| background-image | `none` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `inherit` | `9.5px` |
| font-weight | `inherit` | `600` |
| line-height | `inherit` | `9.5px` |
| letter-spacing | `inherit` | `1.33px` |
| text-transform | `inherit` | `uppercase` |
| color | `var(--ink)` | `rgb(232, 237, 241)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |

### Collapse all

`#g4man .pb-fold` · rendered 113×44

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `8px` | `` |
| column-gap | `8px` | `8px` |
| row-gap | `8px` | `8px` |
| align-items | `center` | `center` |
| min-height | `var(--tap)` | `44px` |
| padding | `0 12px` | `` |
| padding-left | `12px` | `12px` |
| padding-right | `12px` | `12px` |
| margin-left | `0em` | `0px` |
| margin-right | `0px` | `0px` |
| border-radius | `var(--rad-2)` | `` |
| background | `none!important !important` | `` |
| background-color | `initial !important !important` | `rgba(0, 0, 0, 0)` |
| background-image | `none !important !important` | `none` |
| font | `600 var(--t-sm)/1 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `` | `600` |
| line-height | `` | `12px` |
| letter-spacing | `0px` | `normal` |
| text-transform | `none` | `none` |
| color | `var(--ink2)` | `rgb(157, 170, 180)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |
| isolation | `isolate` | `isolate` |

**::before**

| property | winning declaration |
|---|---|
| inset | `5px 0` |
| top | `5px` |
| right | `0px` |
| bottom | `5px` |
| left | `0px` |
| border-radius | `8px` |
| background | `var(--raised)` |
| background-color | `` |
| background-image | `` |
| box-shadow | `inset 0 0 0 1px var(--rule2)` |
| content | `""` |
| z-index | `-1` |

### Weapon group

`#g4man .pb-g` · rendered 1148×190

| property | winning declaration | computed |
|---|---|---|
| display | `block` | `block` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Weapon header

`#g4man .pb-gh` · rendered 1148×52

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| grid-template-columns | `32px auto minmax(0px, 1fr) auto` | `32px 294.688px 710.312px 39px` |
| column-gap | `12px` | `12px` |
| align-items | `center` | `center` |
| min-height | `52px` | `52px` |
| padding | `0 16px 0 20px` | `` |
| padding-left | `20px` | `20px` |
| padding-right | `16px` | `16px` |
| background | `linear-gradient(90deg,color-mix(in srgb,var(--c) 8%,transparent),transparent 34%),var(--raised)` | `` |
| background-color | `` | `rgb(31, 39, 46)` |
| background-image | `` | `linear-gradient(90deg, color(srgb 0.243137 0.431373 0.556863 / 0.08), rgba(0, 0, 0, 0) 34%), none` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |
| cursor | `pointer` | `pointer` |

**::before**

| property | winning declaration |
|---|---|
| width | `4px` |
| top | `0px` |
| bottom | `0px` |
| left | `0px` |
| background | `var(--c)` |
| background-color | `` |
| background-image | `` |
| content | `""` |

### Weapon name

`#g4man .pb-gline b` · rendered 45×15

| property | winning declaration | computed |
|---|---|---|
| font | `600 var(--t-md)/1 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `14.5px` |
| font-weight | `` | `600` |
| line-height | `` | `14.5px` |
| letter-spacing | `0.005em` | `0.0725px` |
| color | `var(--ink)` | `rgb(232, 237, 241)` |
| white-space | `nowrap` | `` |

### Category word

`#g4man .pb-gline small` · rendered 157×10

| property | winning declaration | computed |
|---|---|---|
| font | `700 var(--t-micro)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `9.5px` |
| font-weight | `` | `700` |
| line-height | `` | `9.5px` |
| letter-spacing | `0.16em` | `1.52px` |
| text-transform | `uppercase` | `uppercase` |
| color | `var(--c)` | `rgb(62, 110, 142)` |

### Build count

`#g4man .pb-nb` · rendered 77×13

| property | winning declaration | computed |
|---|---|---|
| font | `600 var(--t-micro)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `9.5px` |
| font-weight | `` | `600` |
| line-height | `` | `9.5px` |
| letter-spacing | `0.14em` | `1.33px` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |

**::before**

| property | winning declaration |
|---|---|
| display | `inline-block` |
| width | `3px` |
| height | `3px` |
| margin | `0 9px 2px` |
| margin-left | `9px` |
| margin-right | `9px` |
| border-radius | `50%` |
| background | `var(--ink4)` |
| background-color | `` |
| background-image | `` |
| content | `""` |

### Tag group

`#g4man .pb-gtags` · rendered 65×22

| property | winning declaration | computed |
|---|---|---|
| display | `flex` | `flex` |
| gap | `6px` | `` |
| column-gap | `6px` | `6px` |
| row-gap | `6px` | `6px` |
| align-items | `center` | `center` |
| min-height | `22px` | `22px` |
| padding-left | `16px` | `16px` |
| margin-left | `8px` | `8px` |
| box-shadow | `inset 1px 0 0 var(--rule2)` | `rgb(58, 71, 82) 1px 0px 0px 0px inset` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Tier tag

`#g4man .pb-tag` · rendered 49×22

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `5px` | `` |
| column-gap | `5px` | `5px` |
| row-gap | `5px` | `5px` |
| align-items | `center` | `center` |
| height | `22px` | `22px` |
| padding | `0 8px` | `` |
| padding-left | `8px` | `8px` |
| padding-right | `8px` | `8px` |
| border-radius | `var(--rad-1)` | `` |
| background | `color-mix(in srgb,var(--tc) 8%,transparent)` | `` |
| background-color | `` | `color(srgb 0.25098 0.603922 0.815686 / 0.08)` |
| background-image | `` | `none` |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--tc) 50%,transparent)` | `color(srgb 0.25098 0.603922 0.815686 / 0.5) 0px 0px 0px 1px inset` |
| font | `700 var(--t-micro)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `9.5px` |
| font-weight | `` | `700` |
| line-height | `` | `9.5px` |
| letter-spacing | `0.1em` | `0.95px` |
| color | `var(--tc)` | `rgb(64, 154, 208)` |

### Fix chip wrapper

`#g4man .pb-fwrap` · rendered 116×34

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| align-self | `center` | `center` |
| justify-self | `end` | `end` |
| margin-right | `18px` | `18px` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Fix chip

`#g4man .pb-fsum` · rendered 116×34

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `8px` | `` |
| column-gap | `8px` | `8px` |
| row-gap | `8px` | `8px` |
| align-items | `center` | `center` |
| justify-self | `end` | `end` |
| height | `34px` | `34px` |
| min-height | `0px` | `0px` |
| padding | `0 5px 0 10px` | `` |
| padding-block | `0` | `` |
| padding-left | `10px` | `10px` |
| padding-right | `5px` | `5px` |
| margin-left | `0em` | `0px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--rad-2)` | `` |
| background | `color-mix(in srgb,var(--warn) 9%,var(--sunk))` | `` |
| background-color | `` | `color(srgb 0.129255 0.0965882 0.0885882)` |
| background-image | `` | `none` |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--warn) 30%,transparent)` | `color(srgb 1 0.478431 0.270588 / 0.3) 0px 0px 0px 1px inset` |
| font | `600 var(--t-sm)/1 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `var(--t-sm)` | `12px` |
| font-weight | `` | `600` |
| line-height | `1` | `12px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| color | `var(--warn-ink)` | `rgb(255, 158, 114)` |
| white-space | `nowrap` | `` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |

### Fix chip build number

`#g4man .pb-fnos i` · rendered 20×20

| property | winning declaration | computed |
|---|---|---|
| display | `inline-grid` | `grid` |
| align-items | `center` | `center` |
| place-items | `center` | `` |
| min-width | `20px` | `20px` |
| height | `20px` | `20px` |
| padding | `0 4px` | `` |
| padding-left | `4px` | `4px` |
| padding-right | `4px` | `4px` |
| border-radius | `4px` | `` |
| background | `color-mix(in srgb,var(--warn) 18%,transparent)` | `` |
| background-color | `` | `color(srgb 1 0.478431 0.270588 / 0.18)` |
| background-image | `` | `none` |
| font | `700 var(--t-xs)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `10.5px` |
| font-weight | `` | `700` |
| line-height | `` | `10.5px` |
| letter-spacing | — | `normal` |
| color | `var(--warn-ink)` | `rgb(255, 158, 114)` |

### Fault popover

`#g4man .pb-fpop` · rendered 0×0

| property | winning declaration | computed |
|---|---|---|
| display | `none` | `none` |
| min-width | `320px` | `320px` |
| padding | `4px` | `` |
| padding-left | `4px` | `4px` |
| padding-right | `4px` | `4px` |
| top | `calc(100% + 8px)` | `calc(100% + 8px)` |
| right | `0px` | `0px` |
| border-radius | `var(--rad-3)` | `` |
| background | `var(--raised)` | `` |
| background-color | `` | `rgb(31, 39, 46)` |
| background-image | `` | `none` |
| box-shadow | `0 14px 36px rgba(0,0,0,.5),inset 0 0 0 1px color-mix(in srgb,var(--warn) 35%,transparent)` | `rgba(0, 0, 0, 0.5) 0px 14px 36px 0px, color(srgb 1 0.478431 0.270588 / 0.35) 0px 0px 0px 1px inset` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |
| z-index | `6` | `6` |

### Popover row

`#g4man .pb-fpr` · rendered 0×0

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| grid-template-columns | `24px minmax(0px, 1fr)` | `24px minmax(0px, 1fr)` |
| gap | `12px` | `` |
| column-gap | `12px` | `12px` |
| row-gap | `12px` | `12px` |
| align-items | `start` | `start` |
| padding | `10px 12px` | `` |
| padding-left | `12px` | `12px` |
| padding-right | `12px` | `12px` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Popover build number

`#g4man .pb-fpr > i` · rendered 0×0

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| align-items | `center` | `center` |
| place-items | `center` | `` |
| height | `22px` | `22px` |
| border-radius | `4px` | `` |
| background | `color-mix(in srgb,var(--warn) 18%,transparent)` | `` |
| background-color | `` | `color(srgb 1 0.478431 0.270588 / 0.18)` |
| background-image | `` | `none` |
| font | `700 var(--t-xs)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `10.5px` |
| font-weight | `` | `700` |
| line-height | `` | `10.5px` |
| letter-spacing | — | `normal` |
| color | `var(--warn-ink)` | `rgb(255, 158, 114)` |

### Popover text

`#g4man .pb-fpr > span` · rendered 0×0

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| gap | `6px` | `` |
| column-gap | `6px` | `6px` |
| row-gap | `6px` | `6px` |
| font | `500 var(--t-sm)/1.3 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `` | `500` |
| line-height | `` | `15.6px` |
| letter-spacing | — | `normal` |
| color | `var(--ink)` | `rgb(232, 237, 241)` |
| white-space | `nowrap` | `` |

### Weapon collapse button

`#g4man .pb-fbtn` · rendered 44×44

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| align-items | `center` | `center` |
| place-items | `center` | `` |
| width | `var(--tap)` | `44px` |
| height | `var(--tap)` | `44px` |
| min-height | `var(--ctl-min, 32px)` | `auto` |
| padding | `var(--ctl-pad, 7px 10px)` | `` |
| padding-left | `` | `6px` |
| padding-right | `` | `6px` |
| margin-left | `0em` | `0px` |
| margin-right | `calc(-1 * var(--pb-inset))` | `-5px` |
| border-radius | `var(--rad-2)` | `` |
| background | `none!important !important` | `` |
| background-color | `initial !important !important` | `rgba(0, 0, 0, 0)` |
| background-image | `none !important !important` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `inherit` | `13px` |
| font-weight | `inherit` | `400` |
| line-height | `inherit` | `19.5px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |
| isolation | `isolate` | `isolate` |

**::before**

| property | winning declaration |
|---|---|
| inset | `var(--pb-inset)` |
| top | `` |
| right | `` |
| bottom | `` |
| left | `` |
| border-radius | `8px` |
| background | `var(--raised)` |
| background-color | `` |
| background-image | `` |
| box-shadow | `inset 0 0 0 1px var(--rule2)` |
| transition | `background .15s,box-shadow .15s` |
| content | `""` |
| z-index | `-1` |

### Build row

`#g4man .pb-rb` · rendered 1148×52

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| grid-template-columns | `32px 28px minmax(0px, 1fr) 28px 144px 113px` | `32px 28px 707px 28px 144px 113px` |
| column-gap | `12px` | `12px` |
| align-items | `center` | `center` |
| min-height | `52px` | `52px` |
| padding | `0 16px 0 20px` | `` |
| padding-left | `20px` | `20px` |
| padding-right | `16px` | `16px` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |
| transition | `background .18s` | `` |
| cursor | `pointer` | `pointer` |

**::before**

| property | winning declaration |
|---|---|
| width | `3px` |
| top | `0px` |
| bottom | `0px` |
| left | `0px` |
| background | `var(--c)` |
| background-color | `` |
| background-image | `` |
| opacity | `0` |
| transition | `opacity .18s` |
| content | `""` |

### Build row, hovered (demo class)

`#g4man .pb-rb.pb-hov` · rendered 1148×52

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| grid-template-columns | `32px 28px minmax(0px, 1fr) 28px 144px 113px` | `32px 28px 707px 28px 144px 113px` |
| column-gap | `12px` | `12px` |
| align-items | `center` | `center` |
| min-height | `52px` | `52px` |
| padding | `0 16px 0 20px` | `` |
| padding-left | `20px` | `20px` |
| padding-right | `16px` | `16px` |
| background | `radial-gradient(360px 80px at 14% 40%,color-mix(in srgb,var(--c) 16%,transparent),transparent 72%),radial-gradient(420px 100px at 76% 70%,color-mix(in srgb,var(--c) 7%,transparent),transparent 70%),radial-gradient(260px 70px at 46% 0,color-mix(in srgb,var(--realm-c) 6%,transparent),transparent 70%),var(--paper)` | `` |
| background-color | `` | `rgb(23, 30, 36)` |
| background-image | `` | `radial-gradient(360px 80px at 14% 40%, color(srgb 1 0.231373 0.360784 / 0.16), rgba(0, 0, 0, 0) 72%), radial-gradient(420px 100px at 76% 70%, color(srgb 1 0.231373 0.360784 / 0.07), rgba(0, 0, 0, 0) 70%), radial-gradient(260px 70px at 46% 0px, color(srgb 0.937255 0.266667 0.266667 / 0.06), rgba(0, 0, 0, 0) 70%), none` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |
| transition | `background .18s` | `` |
| cursor | `pointer` | `pointer` |

**::before**

| property | winning declaration |
|---|---|
| width | `3px` |
| top | `0px` |
| bottom | `0px` |
| left | `0px` |
| background | `var(--c)` |
| background-color | `` |
| background-image | `` |
| opacity | `1` |
| transition | `opacity .18s` |
| content | `""` |

### Build row needing a fix

`#g4man .pb-rb.pb-bad` · rendered 1148×52

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| grid-template-columns | `32px 28px minmax(0px, 1fr) 28px 144px 113px` | `32px 28px 707px 28px 144px 113px` |
| column-gap | `12px` | `12px` |
| align-items | `center` | `center` |
| min-height | `52px` | `52px` |
| padding | `0 16px 0 20px` | `` |
| padding-left | `20px` | `20px` |
| padding-right | `16px` | `16px` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |
| transition | `background .18s` | `` |
| cursor | `pointer` | `pointer` |

**::after**

| property | winning declaration |
|---|---|
| display | `block` |
| width | `4px` |
| top | `0px` |
| right | `0px` |
| bottom | `0px` |
| left | `auto` |
| background | `repeating-linear-gradient(-45deg,var(--warn) 0 3px,transparent 3px 6px)` |
| background-color | `` |
| background-image | `` |
| content | `""` |

### Row checkbox

`#g4man .pb-rb .pb-cb` · rendered 44×44

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| align-items | `center` | `center` |
| align-self | `center` | `center` |
| place-items | `center` | `` |
| width | `var(--tap)` | `44px` |
| height | `var(--tap)` | `44px` |
| min-height | `var(--ctl-min, 32px)` | `auto` |
| padding | `0` | `` |
| padding-left | `0px` | `0px` |
| padding-right | `0px` | `0px` |
| margin-left | `-12px` | `-12px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--ctl-rad, 5px)` | `` |
| background | `none` | `` |
| background-color | `initial` | `rgba(0, 0, 0, 0)` |
| background-image | `none` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `inherit` | `13px` |
| font-weight | `inherit` | `400` |
| line-height | `inherit` | `19.5px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| color | `inherit` | `rgb(232, 237, 241)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |

### Build number

`#g4man .pb-ix` · rendered 5×32

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| align-items | `center` | `center` |
| align-self | `center` | `center` |
| justify-self | `start` | `start` |
| place-items | `center` | `` |
| width | `auto` | `4.96875px` |
| height | `32px` | `32px` |
| padding | `0` | `` |
| padding-left | `0px` | `0px` |
| padding-right | `0px` | `0px` |
| border-radius | `var(--rad-2)` | `` |
| font | `700 21px/1 var(--display)` | `` |
| font-family | `` | `"Big Shoulders Display", "Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `21px` |
| font-weight | `` | `700` |
| line-height | `` | `21px` |
| letter-spacing | — | `normal` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |
| transition | `color .18s,background .18s` | `` |

### Named content cell

`#g4man .pb-main.pb-named` · rendered 707×84

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| grid-template-columns | `auto minmax(0px, 1fr)` | `108.312px 578.688px` |
| gap | `6px` | `` |
| column-gap | `20px` | `20px` |
| row-gap | `6px` | `6px` |
| align-items | `center` | `center` |
| align-self | `center` | `center` |
| min-width | `0px` | `0px` |
| padding | `11px 0` | `` |
| padding-left | `0px` | `0px` |
| padding-right | `0px` | `0px` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Unnamed content cell

`#g4man .pb-main:not(.pb-named)` · rendered 707×50

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| gap | `6px` | `` |
| column-gap | `6px` | `6px` |
| row-gap | `6px` | `6px` |
| align-self | `center` | `center` |
| min-width | `0px` | `0px` |
| padding | `11px 0` | `` |
| padding-left | `0px` | `0px` |
| padding-right | `0px` | `0px` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Build name plate

`#g4man .pb-plate` · rendered 108×43

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| gap | `3px` | `` |
| column-gap | `3px` | `3px` |
| row-gap | `3px` | `3px` |
| align-items | `center` | `center` |
| align-self | `center` | `center` |
| width | `auto` | `108.312px` |
| max-width | `156px` | `156px` |
| min-height | `0px` | `0px` |
| padding | `7px 12px 8px` | `` |
| padding-left | `12px` | `12px` |
| padding-right | `12px` | `12px` |
| border-radius | `6px` | `` |
| background | `linear-gradient(100deg,color-mix(in srgb,var(--c) 22%,var(--raised)),color-mix(in srgb,var(--c) 7%,var(--raised)))` | `` |
| background-color | `` | `rgba(0, 0, 0, 0)` |
| background-image | `` | `linear-gradient(100deg, color(srgb 0.314824 0.170196 0.220078), color(srgb 0.183059 0.158431 0.19302))` |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--c) 38%,transparent)` | `color(srgb 1 0.231373 0.360784 / 0.38) 0px 0px 0px 1px inset` |
| font | `600 var(--t-sm)/1.2 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `` | `600` |
| line-height | `` | `14.4px` |
| letter-spacing | — | `normal` |
| color | `var(--ink)` | `rgb(232, 237, 241)` |

**::after**

| property | winning declaration |
|---|---|
| width | `1px` |
| top | `0px` |
| right | `-10px` |
| bottom | `0px` |
| background | `var(--rule2)` |
| background-color | `` |
| background-image | `` |
| content | `""` |

### Plate eyebrow

`#g4man .pb-plate > small` · rendered 72×10

| property | winning declaration | computed |
|---|---|---|
| font | `600 9.5px/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `9.5px` |
| font-weight | `` | `600` |
| line-height | `` | `9.5px` |
| letter-spacing | `0.16em` | `1.52px` |
| text-transform | `uppercase` | `uppercase` |
| color | `color-mix(in srgb,var(--c) 70%,var(--ink2))` | `color(srgb 0.884706 0.361961 0.464314)` |

### Plate name

`#g4man .pb-plate > span` · rendered 84×15

| property | winning declaration | computed |
|---|---|---|
| display | `-webkit-box` | `flow-root` |
| font | `600 var(--t-sm)/1.25 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `` | `600` |
| line-height | `` | `15px` |
| letter-spacing | — | `normal` |
| color | `var(--ink)` | `rgb(232, 237, 241)` |
| overflow | `hidden` | `` |

### Attachment list

`#g4man .pb-rail` · rendered 707×28

| property | winning declaration | computed |
|---|---|---|
| display | `flex` | `flex` |
| gap | `6px` | `` |
| column-gap | `6px` | `6px` |
| row-gap | `6px` | `6px` |
| align-items | `center` | `center` |
| flex-wrap | `wrap` | `wrap` |
| min-width | `0px` | `0px` |
| padding | `0` | `` |
| padding-left | `0px` | `0px` |
| padding-right | `0px` | `0px` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Attachment tag, slot known

`#g4man .pb-rail > .pb-at[style]` · rendered 151×28

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `8px` | `` |
| column-gap | `8px` | `8px` |
| row-gap | `8px` | `8px` |
| align-items | `center` | `center` |
| min-width | `0px` | `0px` |
| height | `28px` | `28px` |
| padding | `0 10px` | `` |
| padding-left | `10px` | `10px` |
| padding-right | `10px` | `10px` |
| border-radius | `6px` | `` |
| background | `color-mix(in srgb,var(--sl) 11%,var(--sunk))` | `` |
| background-color | `` | `color(srgb 0.128997 0.123166 0.131665)` |
| background-image | `` | `none` |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--sl) 30%,transparent),inset 0 1px 0 color-mix(in srgb,var(--sl) 14%,transparent)` | `color(srgb 0.823677 0.643756 0.625832 / 0.3) 0px 0px 0px 1px inset, color(srgb 0.823677 0.643756 0.625832 / 0.14) 0px 1px 0px 0px inset` |
| outline | `0` | `` |
| font | `500 var(--t-sm)/1 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `` | `500` |
| line-height | `` | `12px` |
| letter-spacing | — | `normal` |
| text-decoration | `none` | `` |
| color | `var(--ink)` | `rgb(232, 237, 241)` |
| white-space | `nowrap` | `` |
| transition | `box-shadow .18s,background .18s` | `` |

### Attachment tag, slot unknown

`#g4man .pb-rail > .pb-at:not([style]):not(.pb-atgap)` · rendered 151×28

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `8px` | `` |
| column-gap | `8px` | `8px` |
| row-gap | `8px` | `8px` |
| align-items | `center` | `center` |
| min-width | `0px` | `0px` |
| height | `28px` | `28px` |
| padding | `0 10px` | `` |
| padding-left | `10px` | `10px` |
| padding-right | `10px` | `10px` |
| border-radius | `6px` | `` |
| background | `linear-gradient(180deg,color-mix(in srgb,var(--ink) 4%,var(--sunk)),var(--sunk))` | `` |
| background-color | `` | `rgba(0, 0, 0, 0)` |
| background-image | `` | `linear-gradient(color(srgb 0.0778039 0.0936471 0.105569), rgb(11, 15, 18))` |
| box-shadow | `inset 0 0 0 1px var(--rule2),inset 0 1px 0 color-mix(in srgb,var(--ink) 6%,transparent)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset, color(srgb 0.909804 0.929412 0.945098 / 0.06) 0px 1px 0px 0px inset` |
| outline | `0` | `` |
| font | `500 var(--t-sm)/1 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `` | `500` |
| line-height | `` | `12px` |
| letter-spacing | — | `normal` |
| text-decoration | `none` | `` |
| color | `var(--ink)` | `rgb(232, 237, 241)` |
| white-space | `nowrap` | `` |
| transition | `box-shadow .18s,background .18s` | `` |

### Empty slot tag

`#g4man .pb-rail > .pb-atgap` · rendered 57×28

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `8px` | `` |
| column-gap | `8px` | `8px` |
| row-gap | `8px` | `8px` |
| align-items | `center` | `center` |
| min-width | `0px` | `0px` |
| height | `28px` | `28px` |
| padding | `0 10px` | `` |
| padding-left | `10px` | `10px` |
| padding-right | `10px` | `10px` |
| border-radius | `6px` | `` |
| background | `none` | `` |
| background-color | `initial` | `rgba(0, 0, 0, 0)` |
| background-image | `none` | `none` |
| box-shadow | `none` | `none` |
| outline | `1px dashed color-mix(in srgb,var(--warn) 55%,transparent)` | `` |
| outline-offset | `-1px` | `-1px` |
| font | `500 var(--t-sm)/1 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `` | `500` |
| line-height | `` | `12px` |
| letter-spacing | — | `normal` |
| text-decoration | `none` | `` |
| color | `var(--warn-ink)` | `rgb(255, 158, 114)` |
| white-space | `nowrap` | `` |
| transition | `box-shadow .18s,background .18s` | `` |

### Image set

`#g4man .pb-im:not(.no)` · rendered 28×28

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| align-items | `center` | `center` |
| align-self | `center` | `center` |
| place-items | `center` | `` |
| width | `28px` | `28px` |
| height | `28px` | `28px` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | `color-mix(in srgb,var(--ok) 80%,var(--ink3))` | `color(srgb 0.490196 0.802353 0.435294)` |

### Image missing

`#g4man .pb-im.no` · rendered 28×28

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| align-items | `center` | `center` |
| align-self | `center` | `center` |
| place-items | `center` | `` |
| width | `28px` | `28px` |
| height | `28px` | `28px` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | `var(--warn-ink)` | `rgb(255, 158, 114)` |

### Code button

`#g4man button.pb-igw` · rendered 144×44

| property | winning declaration | computed |
|---|---|---|
| display | `flex` | `flex` |
| align-items | `center` | `center` |
| align-self | `center` | `center` |
| width | `100%` | `144px` |
| min-height | `var(--tap)` | `44px` |
| padding | `0` | `` |
| padding-left | `0px` | `0px` |
| padding-right | `0px` | `0px` |
| margin-left | `0em` | `0px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--ctl-rad, 5px)` | `` |
| background | `none!important !important` | `` |
| background-color | `initial !important !important` | `rgba(0, 0, 0, 0)` |
| background-image | `none !important !important` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `inherit` | `13px` |
| font-weight | `inherit` | `400` |
| line-height | `inherit` | `19.5px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| color | `inherit` | `rgb(232, 237, 241)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `copy` | `copy` |

### Code field group

`#g4man .pb-igw .pb-ig` · rendered 144×34

| property | winning declaration | computed |
|---|---|---|
| display | `flex` | `flex` |
| align-items | `stretch` | `stretch` |
| width | `100%` | `144px` |
| height | `34px` | `34px` |
| border-radius | `7px` | `` |
| background | `var(--desk,#0b0f12)` | `` |
| background-color | `` | `rgb(15, 20, 24)` |
| background-image | `` | `none` |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Code field

`#g4man .pb-igw .pb-igf` · rendered 106×34

| property | winning declaration | computed |
|---|---|---|
| display | `flex` | `flex` |
| align-items | `center` | `center` |
| flex | `1` | `` |
| min-width | `0px` | `0px` |
| padding | `0 12px` | `` |
| padding-left | `12px` | `12px` |
| padding-right | `12px` | `12px` |
| border-radius | `7px 0 0 7px` | `` |
| box-shadow | `rgba(0, 0, 0, 0.45) 0px 2px 4px inset` | `rgba(0, 0, 0, 0.45) 0px 2px 4px 0px inset` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Code text

`#g4man .pb-ct:not(.bad)` · rendered 82×12

| property | winning declaration | computed |
|---|---|---|
| font | `600 var(--t-sm)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `12px` |
| font-weight | `` | `600` |
| line-height | `` | `12px` |
| letter-spacing | `0.08em` | `0.96px` |
| color | `var(--ink)` | `rgb(232, 237, 241)` |
| white-space | `nowrap` | `` |

### Code text, faulty

`#g4man .pb-ct.bad` · rendered 82×12

| property | winning declaration | computed |
|---|---|---|
| font | `600 var(--t-sm)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `12px` |
| font-weight | `` | `600` |
| line-height | `` | `12px` |
| letter-spacing | `0.08em` | `0.96px` |
| text-decoration | `underline wavy color-mix(in srgb,var(--warn) 75%,transparent) 1px` | `` |
| text-underline-offset | `5px` | `5px` |
| color | `var(--warn-ink)` | `rgb(255, 158, 114)` |
| white-space | `nowrap` | `` |

### Copy segment

`#g4man .pb-igb` · rendered 38×34

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| align-items | `center` | `center` |
| place-items | `center` | `` |
| flex | `none` | `` |
| width | `38px` | `38px` |
| border-radius | `0 7px 7px 0` | `` |
| background | `var(--raised)` | `` |
| background-color | `` | `rgb(31, 39, 46)` |
| background-image | `` | `none` |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | `var(--ink2)` | `rgb(157, 170, 180)` |
| transition | `background .15s,color .15s` | `` |

### No code field

`#g4man .pb-ig.none` · rendered 144×34

| property | winning declaration | computed |
|---|---|---|
| display | `flex` | `flex` |
| align-items | `stretch` | `stretch` |
| width | `100%` | `144px` |
| height | `34px` | `34px` |
| border-radius | `7px` | `` |
| background | `none` | `` |
| background-color | `initial` | `rgba(0, 0, 0, 0)` |
| background-image | `none` | `none` |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--warn) 35%,transparent)` | `color(srgb 1 0.478431 0.270588 / 0.35) 0px 0px 0px 1px inset` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### No code text

`#g4man .pb-cnone` · rendered 68×14

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `6px` | `` |
| column-gap | `6px` | `6px` |
| row-gap | `6px` | `6px` |
| align-items | `center` | `center` |
| font | `600 var(--t-sm)/1 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `` | `600` |
| line-height | `` | `12px` |
| letter-spacing | — | `normal` |
| color | `var(--warn-ink)` | `rgb(255, 158, 114)` |

### Row actions

`#g4man .pb-rb .pb-acts` · rendered 118×44

| property | winning declaration | computed |
|---|---|---|
| display | `flex` | `flex` |
| gap | `12px` | `` |
| column-gap | `12px` | `12px` |
| row-gap | `12px` | `12px` |
| align-items | `center` | `center` |
| align-self | `center` | `center` |
| margin-right | `calc(-1 * var(--pb-inset))` | `-5px` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Share button

`#g4man .pb-rb .pb-acts > .pb-ib:first-child` · rendered 44×44

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| align-items | `center` | `center` |
| place-items | `center` | `` |
| flex | `none` | `` |
| width | `var(--tap)` | `44px` |
| height | `var(--tap)` | `44px` |
| min-height | `var(--ctl-min, 32px)` | `auto` |
| padding | `var(--ctl-pad, 7px 10px)` | `` |
| padding-left | `` | `6px` |
| padding-right | `` | `6px` |
| margin-left | `0em` | `0px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--rad-2)` | `` |
| background | `none!important !important` | `` |
| background-color | `initial !important !important` | `rgba(0, 0, 0, 0)` |
| background-image | `none !important !important` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `inherit` | `13px` |
| font-weight | `inherit` | `400` |
| line-height | `inherit` | `19.5px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |
| isolation | `isolate` | `isolate` |

**::before**

| property | winning declaration |
|---|---|
| inset | `var(--pb-inset)` |
| top | `` |
| right | `` |
| bottom | `` |
| left | `` |
| border-radius | `8px` |
| background | `var(--raised)` |
| background-color | `` |
| background-image | `` |
| box-shadow | `inset 0 0 0 1px var(--rule2)` |
| transition | `background .15s,box-shadow .15s` |
| content | `""` |
| z-index | `-1` |

### Divider before delete

`#g4man .pb-rb .pb-vr` · rendered 1×24

| property | winning declaration | computed |
|---|---|---|
| align-self | `center` | `center` |
| flex | `none` | `` |
| width | `1px` | `1px` |
| height | `24px` | `24px` |
| background | `var(--rule2)` | `` |
| background-color | `` | `rgb(58, 71, 82)` |
| background-image | `` | `none` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Delete button

`#g4man .pb-rb .pb-del` · rendered 44×44

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| align-items | `center` | `center` |
| place-items | `center` | `` |
| flex | `none` | `` |
| width | `var(--tap)` | `44px` |
| height | `var(--tap)` | `44px` |
| min-height | `var(--ctl-min, 32px)` | `auto` |
| padding | `var(--ctl-pad, 7px 10px)` | `` |
| padding-left | `` | `6px` |
| padding-right | `` | `6px` |
| margin-left | `0em` | `0px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--rad-2)` | `` |
| background | `none!important !important` | `` |
| background-color | `initial !important !important` | `rgba(0, 0, 0, 0)` |
| background-image | `none !important !important` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `inherit` | `13px` |
| font-weight | `inherit` | `400` |
| line-height | `inherit` | `19.5px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |
| isolation | `isolate` | `isolate` |

**::before**

| property | winning declaration |
|---|---|
| inset | `var(--pb-inset)` |
| top | `` |
| right | `` |
| bottom | `` |
| left | `` |
| border-radius | `8px` |
| background | `var(--raised)` |
| background-color | `` |
| background-image | `` |
| box-shadow | `inset 0 0 0 1px var(--rule2)` |
| transition | `background .15s,box-shadow .15s` |
| content | `""` |
| z-index | `-1` |


## G4 · hover states (forced :hover)

### Share button, hovered

`#g4man .pb-rb .pb-acts > .pb-ib:first-child` · rendered 44×44

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| align-items | `center` | `center` |
| place-items | `center` | `` |
| flex | `none` | `` |
| width | `var(--tap)` | `44px` |
| height | `var(--tap)` | `44px` |
| min-height | `var(--ctl-min, 32px)` | `auto` |
| padding | `var(--ctl-pad, 7px 10px)` | `` |
| padding-left | `` | `6px` |
| padding-right | `` | `6px` |
| margin-left | `0em` | `0px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--rad-2)` | `` |
| background | `none!important !important` | `` |
| background-color | `initial !important !important` | `rgba(0, 0, 0, 0)` |
| background-image | `none !important !important` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `inherit` | `13px` |
| font-weight | `inherit` | `400` |
| line-height | `inherit` | `19.5px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| color | `var(--ink3)` | `rgb(137, 151, 163)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |
| isolation | `isolate` | `isolate` |

**::before**

| property | winning declaration |
|---|---|
| inset | `var(--pb-inset)` |
| top | `` |
| right | `` |
| bottom | `` |
| left | `` |
| border-radius | `8px` |
| background | `var(--raised)` |
| background-color | `` |
| background-image | `` |
| box-shadow | `inset 0 0 0 1px var(--rule2)` |
| transition | `background .15s,box-shadow .15s` |
| content | `""` |
| z-index | `-1` |

### Delete button, hovered

`#g4man .pb-rb .pb-del` · rendered 44×44

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| align-items | `center` | `center` |
| place-items | `center` | `` |
| flex | `none` | `` |
| width | `var(--tap)` | `44px` |
| height | `var(--tap)` | `44px` |
| min-height | `var(--ctl-min, 32px)` | `auto` |
| padding | `var(--ctl-pad, 7px 10px)` | `` |
| padding-left | `` | `6px` |
| padding-right | `` | `6px` |
| margin-left | `0em` | `0px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--rad-2)` | `` |
| background | `none!important !important` | `` |
| background-color | `initial !important !important` | `rgba(0, 0, 0, 0)` |
| background-image | `none !important !important` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `inherit` | `13px` |
| font-weight | `inherit` | `400` |
| line-height | `inherit` | `19.5px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |
| isolation | `isolate` | `isolate` |

**::before**

| property | winning declaration |
|---|---|
| inset | `var(--pb-inset)` |
| top | `` |
| right | `` |
| bottom | `` |
| left | `` |
| border-radius | `8px` |
| background | `var(--raised)` |
| background-color | `` |
| background-image | `` |
| box-shadow | `inset 0 0 0 1px var(--rule2)` |
| transition | `background .15s,box-shadow .15s` |
| content | `""` |
| z-index | `-1` |

### Copy button, hovered

`#g4man button.pb-igw` · rendered 144×44

| property | winning declaration | computed |
|---|---|---|
| display | `flex` | `flex` |
| align-items | `center` | `center` |
| align-self | `center` | `center` |
| width | `100%` | `144px` |
| min-height | `var(--tap)` | `44px` |
| padding | `0` | `` |
| padding-left | `0px` | `0px` |
| padding-right | `0px` | `0px` |
| margin-left | `0em` | `0px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--ctl-rad, 5px)` | `` |
| background | `none!important !important` | `` |
| background-color | `initial !important !important` | `rgba(0, 0, 0, 0)` |
| background-image | `none !important !important` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `inherit` | `13px` |
| font-weight | `inherit` | `400` |
| line-height | `inherit` | `19.5px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| color | `inherit` | `rgb(232, 237, 241)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `copy` | `copy` |

### Copy segment, hovered

`#g4man button.pb-igw .pb-igb` · rendered 38×34

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| align-items | `center` | `center` |
| place-items | `center` | `` |
| flex | `none` | `` |
| width | `38px` | `38px` |
| border-radius | `0 7px 7px 0` | `` |
| background | `var(--raised)` | `` |
| background-color | `` | `rgb(31, 39, 46)` |
| background-image | `` | `none` |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | `var(--ink2)` | `rgb(157, 170, 180)` |
| transition | `background .15s,color .15s` | `` |

### Attachment tag, row hovered

`#g4man .pb-rb.pb-hov .pb-rail > .pb-at[style]` · rendered 105×28

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `8px` | `` |
| column-gap | `8px` | `8px` |
| row-gap | `8px` | `8px` |
| align-items | `center` | `center` |
| min-width | `0px` | `0px` |
| height | `28px` | `28px` |
| padding | `0 10px` | `` |
| padding-left | `10px` | `10px` |
| padding-right | `10px` | `10px` |
| border-radius | `6px` | `` |
| background | `color-mix(in srgb,var(--sl) 11%,var(--sunk))` | `` |
| background-color | `` | `color(srgb 0.128997 0.123166 0.131665)` |
| background-image | `` | `none` |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--sl) 48%,transparent),inset 0 1px 0 color-mix(in srgb,var(--sl) 20%,transparent)` | `color(srgb 0.823677 0.643756 0.625832 / 0.48) 0px 0px 0px 1px inset, color(srgb 0.823677 0.643756 0.625832 / 0.2) 0px 1px 0px 0px inset` |
| outline | `0` | `` |
| font | `500 var(--t-sm)/1 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `` | `500` |
| line-height | `` | `12px` |
| letter-spacing | — | `normal` |
| text-decoration | `none` | `` |
| color | `var(--ink)` | `rgb(232, 237, 241)` |
| white-space | `nowrap` | `` |
| transition | `box-shadow .18s,background .18s` | `` |


## G4 · By slot view

Reached with the List · By slot switch.

### Slot strip

`#g4man .pb-strip` · rendered 1148×26

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| grid-template-columns | `var(--rowcols)` | `32px 28px 135.391px 135.406px 135.391px 135.406px 135.391px 28px 144px 113px` |
| column-gap | `10px` | `10px` |
| align-items | `center` | `center` |
| min-height | `26px` | `26px` |
| padding | `0 16px 0 20px` | `` |
| padding-left | `20px` | `20px` |
| padding-right | `16px` | `16px` |
| background | `var(--sunk)` | `` |
| background-color | `` | `rgb(11, 15, 18)` |
| background-image | `` | `none` |
| font | `600 9.5px/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `9.5px` |
| font-weight | `` | `600` |
| line-height | `` | `9.5px` |
| letter-spacing | `0.14em` | `1.33px` |
| text-transform | `uppercase` | `uppercase` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |

### Slot cell

`#g4man .pb-sc` · rendered 132×32

| property | winning declaration | computed |
|---|---|---|
| display | `flex` | `flex` |
| align-items | `center` | `center` |
| align-self | `center` | `center` |
| min-width | `0px` | `0px` |
| min-height | `32px` | `32px` |
| padding | `4px 10px` | `` |
| padding-left | `10px` | `10px` |
| padding-right | `10px` | `10px` |
| border-radius | `var(--rad-2)` | `` |
| background | `color-mix(in srgb,var(--sl,var(--ink4)) 8%,var(--sunk))` | `` |
| background-color | `` | `color(srgb 0.10558 0.105618 0.115008)` |
| background-image | `` | `none` |
| box-shadow | `inset 0 0 0 1px var(--rule),inset 0 -2px 0 color-mix(in srgb,var(--sl,var(--ink4)) 45%,transparent)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset, color(srgb 0.823677 0.643756 0.625832 / 0.45) 0px -2px 0px 0px inset` |
| font | `500 var(--t-sm)/1.2 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `` | `500` |
| line-height | `` | `14.4px` |
| letter-spacing | — | `normal` |
| color | `var(--ink)` | `rgb(232, 237, 241)` |

### Empty slot cell

`#g4man .pb-sc.pb-empty` · rendered 108×32

| property | winning declaration | computed |
|---|---|---|
| display | `flex` | `flex` |
| align-items | `center` | `center` |
| align-self | `center` | `center` |
| min-width | `0px` | `0px` |
| min-height | `32px` | `32px` |
| padding | `4px 10px` | `` |
| padding-left | `10px` | `10px` |
| padding-right | `10px` | `10px` |
| border-radius | `var(--rad-2)` | `` |
| background | `none` | `` |
| background-color | `initial` | `rgba(0, 0, 0, 0)` |
| background-image | `none` | `none` |
| box-shadow | `inset 0 0 0 1px var(--rule3)` | `rgb(28, 36, 42) 0px 0px 0px 1px inset` |
| font | `500 var(--t-sm)/1.2 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `` | `500` |
| line-height | `` | `14.4px` |
| letter-spacing | — | `normal` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |


## G11 · Broadcast manifest and History chips

### Broadcast tools bar

`#g11bc .pb-tools` · rendered 1148×122

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| gap | `12px` | `` |
| column-gap | `12px` | `12px` |
| row-gap | `12px` | `12px` |
| padding | `14px 16px` | `` |
| padding-left | `16px` | `16px` |
| padding-right | `16px` | `16px` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### State chip

`#g11bc .chip.topic` · rendered 107×32

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `7px` | `` |
| column-gap | `7px` | `7px` |
| row-gap | `7px` | `7px` |
| align-items | `center` | `center` |
| flex | `none` | `` |
| min-height | `32px` | `32px` |
| padding | `6px 11px` | `` |
| padding-left | `11px` | `11px` |
| padding-right | `11px` | `11px` |
| margin-left | `0em` | `0px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--rad-pill)` | `` |
| background | `var(--sunk)` | `` |
| background-color | `` | `rgb(11, 15, 18)` |
| background-image | `` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `var(--t-sm)` | `12px` |
| font-weight | `600` | `600` |
| line-height | `inherit` | `18px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| text-decoration | `none` | `` |
| color | `var(--ink2)` | `rgb(157, 170, 180)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |

### Broadcast heads

`#g11bc .pb-heads.pb-bc` · rendered 1148×45

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| grid-template-columns | `var(--colsc)` | `556px 104px 104px 104px 124px 44px` |
| column-gap | `16px` | `16px` |
| align-items | `center` | `center` |
| min-height | `44px` | `44px` |
| padding | `0 16px` | `` |
| padding-left | `16px` | `16px` |
| padding-right | `16px` | `16px` |
| background | `var(--sunk)` | `` |
| background-color | `` | `rgb(11, 15, 18)` |
| background-image | `` | `none` |
| font | `600 var(--t-micro)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `9.5px` |
| font-weight | `` | `600` |
| line-height | `` | `9.5px` |
| letter-spacing | `0.14em` | `1.33px` |
| text-transform | `uppercase` | `uppercase` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |

### Sortable head

`#g11bc .pb-sort` · rendered 102×44

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `5px` | `` |
| column-gap | `5px` | `5px` |
| row-gap | `5px` | `5px` |
| align-items | `center` | `center` |
| min-height | `44px` | `44px` |
| padding | `0` | `` |
| padding-left | `0px` | `0px` |
| padding-right | `0px` | `0px` |
| margin-left | `0em` | `0px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--ctl-rad, 5px)` | `` |
| background | `none` | `` |
| background-color | `initial` | `rgba(0, 0, 0, 0)` |
| background-image | `none` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `inherit` | `9.5px` |
| font-weight | `inherit` | `600` |
| line-height | `inherit` | `9.5px` |
| letter-spacing | `inherit` | `1.33px` |
| text-transform | `inherit` | `uppercase` |
| color | `inherit` | `rgb(133, 147, 159)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |

### Announcement row

`#g11bc .pb-br` · rendered 1148×64

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| grid-template-columns | `var(--colsc)` | `550px 104px 104px 104px 124px 44px` |
| column-gap | `16px` | `16px` |
| align-items | `center` | `center` |
| min-height | `64px` | `64px` |
| padding | `0 16px 0 22px` | `` |
| padding-left | `22px` | `22px` |
| padding-right | `16px` | `16px` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |
| transition | `background .18s` | `` |

**::before**

| property | winning declaration |
|---|---|
| width | `4px` |
| top | `10px` |
| bottom | `10px` |
| left | `0px` |
| border-radius | `0 3px 3px 0` |
| background | `var(--c)` |
| background-color | `` |
| background-image | `` |
| content | `""` |

### Announcement row, hovered (demo class)

`#g11bc .pb-br.pb-hov` · rendered 1148×64

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| grid-template-columns | `var(--colsc)` | `550px 104px 104px 104px 124px 44px` |
| column-gap | `16px` | `16px` |
| align-items | `center` | `center` |
| min-height | `64px` | `64px` |
| padding | `0 16px 0 22px` | `` |
| padding-left | `22px` | `22px` |
| padding-right | `16px` | `16px` |
| background | `radial-gradient(380px 90px at 12% 40%,color-mix(in srgb,var(--c) 16%,transparent),transparent 72%),radial-gradient(420px 110px at 70% 80%,color-mix(in srgb,var(--c) 7%,transparent),transparent 70%),radial-gradient(260px 80px at 40% 0,color-mix(in srgb,var(--realm-c) 6%,transparent),transparent 70%),var(--paper)` | `` |
| background-color | `` | `rgb(23, 30, 36)` |
| background-image | `` | `radial-gradient(380px 90px at 12% 40%, color(srgb 0.94902 0.760784 0.188235 / 0.16), rgba(0, 0, 0, 0) 72%), radial-gradient(420px 110px at 70% 80%, color(srgb 0.94902 0.760784 0.188235 / 0.07), rgba(0, 0, 0, 0) 70%), radial-gradient(260px 80px at 40% 0px, color(srgb 0.92549 0.282353 0.6 / 0.06), rgba(0, 0, 0, 0) 70%), none` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |
| transition | `background .18s` | `` |

### Announcement text

`#g11bc .pb-bt b` · rendered 530×18

| property | winning declaration | computed |
|---|---|---|
| display | `block` | `block` |
| font | `600 var(--t-base)/1.35 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `13px` |
| font-weight | `` | `600` |
| line-height | `` | `17.55px` |
| letter-spacing | — | `normal` |
| color | `var(--ink)` | `rgb(232, 237, 241)` |
| white-space | `nowrap` | `` |
| overflow | `hidden` | `` |

### Date cell

`#g11bc .pb-dt` · rendered 104×27

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| gap | `4px` | `` |
| column-gap | `4px` | `4px` |
| row-gap | `4px` | `4px` |
| font | `500 var(--t-sm)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `12px` |
| font-weight | `` | `500` |
| line-height | `` | `12px` |
| letter-spacing | — | `normal` |
| color | `var(--ink2)` | `rgb(157, 170, 180)` |
| white-space | `nowrap` | `` |

### Date age line

`#g11bc .pb-dt small` · rendered 104×11

| property | winning declaration | computed |
|---|---|---|
| font | `500 var(--t-xs)/1 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `10.5px` |
| font-weight | `` | `500` |
| line-height | `` | `10.5px` |
| letter-spacing | — | `normal` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |

### Starts "On posting"

`#g11bc .pb-dt.pb-dim` · rendered 104×12

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| gap | `4px` | `` |
| column-gap | `4px` | `4px` |
| row-gap | `4px` | `4px` |
| font | `500 var(--t-sm)/1 var(--data)` | `` |
| font-family | `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `` | `500` |
| line-height | `` | `12px` |
| letter-spacing | — | `normal` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |
| white-space | `nowrap` | `` |

### Ends "No end"

`#g11bc .pb-dt.pb-never` · rendered 104×16

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `6px` | `` |
| column-gap | `6px` | `6px` |
| row-gap | `6px` | `6px` |
| align-items | `center` | `center` |
| font | `500 var(--t-sm)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `12px` |
| font-weight | `600` | `600` |
| line-height | `` | `12px` |
| letter-spacing | — | `normal` |
| color | `var(--warn-ink)` | `rgb(255, 158, 114)` |
| white-space | `nowrap` | `` |

### State tab, live

`#g11bc .pb-life[data-l=live]` · rendered 94×28

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `7px` | `` |
| column-gap | `7px` | `7px` |
| row-gap | `7px` | `7px` |
| align-items | `center` | `center` |
| justify-self | `start` | `start` |
| height | `28px` | `28px` |
| padding | `0 11px 0 12px` | `` |
| padding-left | `12px` | `12px` |
| padding-right | `11px` | `11px` |
| border-radius | `4px` | `` |
| background | `color-mix(in srgb,var(--lc) 9%,transparent)` | `` |
| background-color | `` | `color(srgb 0.482353 0.858824 0.388235 / 0.09)` |
| background-image | `` | `none` |
| box-shadow | `inset 3px 0 0 var(--lc),inset 0 0 0 1px color-mix(in srgb,var(--lc) 22%,transparent)` | `rgb(123, 219, 99) 3px 0px 0px 0px inset, color(srgb 0.482353 0.858823 0.388235 / 0.22) 0px 0px 0px 1px inset` |
| font | `600 var(--t-sm)/1 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `` | `600` |
| line-height | `` | `12px` |
| letter-spacing | — | `normal` |
| color | `var(--lc)` | `rgb(123, 219, 99)` |
| white-space | `nowrap` | `` |

### State tab, upcoming

`#g11bc .pb-life[data-l=upcoming]` · rendered 103×28

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `7px` | `` |
| column-gap | `7px` | `7px` |
| row-gap | `7px` | `7px` |
| align-items | `center` | `center` |
| justify-self | `start` | `start` |
| height | `28px` | `28px` |
| padding | `0 11px 0 12px` | `` |
| padding-left | `12px` | `12px` |
| padding-right | `11px` | `11px` |
| border-radius | `4px` | `` |
| background | `color-mix(in srgb,var(--lc) 9%,transparent)` | `` |
| background-color | `` | `color(srgb 0.65098 0.501961 0.984314 / 0.09)` |
| background-image | `` | `none` |
| box-shadow | `inset 3px 0 0 var(--lc),inset 0 0 0 1px color-mix(in srgb,var(--lc) 22%,transparent)` | `rgb(166, 128, 251) 3px 0px 0px 0px inset, color(srgb 0.65098 0.501961 0.984314 / 0.22) 0px 0px 0px 1px inset` |
| font | `600 var(--t-sm)/1 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `` | `600` |
| line-height | `` | `12px` |
| letter-spacing | — | `normal` |
| color | `var(--lc)` | `rgb(166, 128, 251)` |
| white-space | `nowrap` | `` |

### State tab, ended

`#g11bc .pb-life[data-l=ended]` · rendered 80×28

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `7px` | `` |
| column-gap | `7px` | `7px` |
| row-gap | `7px` | `7px` |
| align-items | `center` | `center` |
| justify-self | `start` | `start` |
| height | `28px` | `28px` |
| padding | `0 11px 0 12px` | `` |
| padding-left | `12px` | `12px` |
| padding-right | `11px` | `11px` |
| border-radius | `4px` | `` |
| background | `color-mix(in srgb,var(--lc) 9%,transparent)` | `` |
| background-color | `` | `color(srgb 0.521569 0.576471 0.623529 / 0.09)` |
| background-image | `` | `none` |
| box-shadow | `inset 3px 0 0 var(--lc),inset 0 0 0 1px color-mix(in srgb,var(--lc) 22%,transparent)` | `rgb(133, 147, 159) 3px 0px 0px 0px inset, color(srgb 0.521569 0.576471 0.623529 / 0.22) 0px 0px 0px 1px inset` |
| font | `600 var(--t-sm)/1 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `` | `600` |
| line-height | `` | `12px` |
| letter-spacing | — | `normal` |
| color | `var(--lc)` | `rgb(133, 147, 159)` |
| white-space | `nowrap` | `` |

### Row delete

`#g11bc .pb-br > .pb-ib` · rendered 44×44

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| align-items | `center` | `center` |
| justify-self | `end` | `end` |
| place-items | `center` | `` |
| flex | `none` | `` |
| width | `var(--tap)` | `44px` |
| height | `var(--tap)` | `44px` |
| min-height | `var(--ctl-min, 32px)` | `auto` |
| padding | `var(--ctl-pad, 7px 10px)` | `` |
| padding-left | `` | `6px` |
| padding-right | `` | `6px` |
| margin-left | `0em` | `0px` |
| margin-right | `calc(-1 * var(--pb-inset))` | `-5px` |
| border-radius | `var(--rad-2)` | `` |
| background | `none!important !important` | `` |
| background-color | `initial !important !important` | `rgba(0, 0, 0, 0)` |
| background-image | `none !important !important` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `inherit` | `13px` |
| font-weight | `inherit` | `400` |
| line-height | `inherit` | `19.5px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |
| isolation | `isolate` | `isolate` |

**::before**

| property | winning declaration |
|---|---|
| inset | `var(--pb-inset)` |
| top | `` |
| right | `` |
| bottom | `` |
| left | `` |
| border-radius | `8px` |
| background | `var(--raised)` |
| background-color | `` |
| background-image | `` |
| box-shadow | `inset 0 0 0 1px var(--rule2)` |
| transition | `background .15s,box-shadow .15s` |
| content | `""` |
| z-index | `-1` |

### History search count

`#g11hist .pb-hits` · rendered 85×28

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `6px` | `` |
| column-gap | `6px` | `6px` |
| row-gap | `6px` | `6px` |
| align-items | `center` | `center` |
| height | `28px` | `28px` |
| padding | `0 10px` | `` |
| padding-left | `10px` | `10px` |
| padding-right | `10px` | `10px` |
| right | `6px` | `6px` |
| border-radius | `5px` | `` |
| background | `color-mix(in srgb,var(--realm-c) 14%,transparent)` | `` |
| background-color | `` | `color(srgb 0 0.882353 0.85098 / 0.14)` |
| background-image | `` | `none` |
| font | `600 var(--t-sm)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `12px` |
| font-weight | `` | `600` |
| line-height | `` | `12px` |
| letter-spacing | — | `normal` |
| color | `var(--ink)` | `rgb(232, 237, 241)` |

### Kind chip

`#g11hist .chip.topic` · rendered 89×32

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `7px` | `` |
| column-gap | `7px` | `7px` |
| row-gap | `7px` | `7px` |
| align-items | `center` | `center` |
| flex | `none` | `` |
| min-height | `32px` | `32px` |
| padding | `6px 11px` | `` |
| padding-left | `11px` | `11px` |
| padding-right | `11px` | `11px` |
| margin-left | `0em` | `0px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--rad-pill)` | `` |
| background | `var(--sunk)` | `` |
| background-color | `` | `rgb(11, 15, 18)` |
| background-image | `` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `var(--t-sm)` | `12px` |
| font-weight | `600` | `600` |
| line-height | `inherit` | `18px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| text-decoration | `none` | `` |
| color | `var(--ink2)` | `rgb(157, 170, 180)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |

### Level chip

`#g11hist .chip.pb-lv` · rendered 98×32

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `8px` | `` |
| column-gap | `8px` | `8px` |
| row-gap | `8px` | `8px` |
| align-items | `center` | `center` |
| flex | `none` | `` |
| min-height | `32px` | `32px` |
| padding | `6px 11px` | `` |
| padding-left | `11px` | `11px` |
| padding-right | `11px` | `11px` |
| margin-left | `0em` | `0px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--rad-pill)` | `` |
| background | `var(--sunk)` | `` |
| background-color | `` | `rgb(11, 15, 18)` |
| background-image | `` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `var(--t-sm)` | `12px` |
| font-weight | `600` | `600` |
| line-height | `inherit` | `18px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| text-decoration | `none` | `` |
| color | `var(--ink2)` | `rgb(157, 170, 180)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |

### Severity bars

`#g11hist .pb-sev` · rendered 18×12

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `2px` | `` |
| column-gap | `2px` | `2px` |
| row-gap | `2px` | `2px` |
| align-items | `flex-end` | `flex-end` |
| height | `12px` | `12px` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `12px` |
| font-weight | — | `600` |
| line-height | — | `18px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(157, 170, 180)` |

### Severity bar

`#g11hist .pb-sev i` · rendered 3×4

| property | winning declaration | computed |
|---|---|---|
| width | `3px` | `3px` |
| height | `4px` | `4px` |
| border-radius | `1px` | `` |
| background | `var(--sv)` | `` |
| background-color | `` | `rgb(255, 138, 133)` |
| background-image | `` | `none` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `12px` |
| font-weight | — | `600` |
| line-height | — | `18px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(157, 170, 180)` |

### Load older events

`#g11hist .pb-more .chip` · rendered 245×44

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `8px` | `` |
| column-gap | `8px` | `8px` |
| row-gap | `8px` | `8px` |
| align-items | `center` | `center` |
| min-height | `var(--tap)` | `44px` |
| padding | `0 18px` | `` |
| padding-left | `18px` | `18px` |
| padding-right | `18px` | `18px` |
| margin-left | `0em` | `0px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--rad-pill)` | `` |
| background | `var(--sunk)` | `` |
| background-color | `` | `rgb(11, 15, 18)` |
| background-image | `` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `var(--t-sm)` | `12px` |
| font-weight | `600` | `600` |
| line-height | `inherit` | `18px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| text-decoration | `none` | `` |
| color | `var(--ink2)` | `rgb(157, 170, 180)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |


## G11 · a staged state

Reached with the board's "One staged" switch.

### State tab, staged

`#g11bc .pb-life.pb-staged` · rendered 103×28

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `7px` | `` |
| column-gap | `7px` | `7px` |
| row-gap | `7px` | `7px` |
| align-items | `center` | `center` |
| justify-self | `start` | `start` |
| height | `28px` | `28px` |
| padding | `0 11px 0 12px` | `` |
| padding-left | `12px` | `12px` |
| padding-right | `11px` | `11px` |
| border-radius | `4px` | `` |
| background | `none` | `` |
| background-color | `initial` | `rgba(0, 0, 0, 0)` |
| background-image | `none` | `none` |
| box-shadow | `inset 3px 0 0 color-mix(in srgb,var(--lc) 55%,transparent)` | `color(srgb 0.65098 0.501961 0.984314 / 0.55) 3px 0px 0px 0px inset` |
| outline | `1.5px dashed var(--lc)` | `` |
| outline-offset | `-1.5px` | `-1px` |
| font | `600 var(--t-sm)/1 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `` | `600` |
| line-height | `` | `12px` |
| letter-spacing | — | `normal` |
| color | `var(--lc)` | `rgb(166, 128, 251)` |
| white-space | `nowrap` | `` |


## G3 · Announcement card

### Queue head

`#g3 .pb-qhead` · rendered 820×10

| property | winning declaration | computed |
|---|---|---|
| display | `flex` | `flex` |
| gap | `12px` | `` |
| column-gap | `12px` | `12px` |
| row-gap | `12px` | `12px` |
| align-items | `center` | `center` |
| font | `600 var(--t-micro)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `9.5px` |
| font-weight | `` | `600` |
| line-height | `` | `9.5px` |
| letter-spacing | `0.16em` | `1.52px` |
| text-transform | `uppercase` | `uppercase` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |

### Card

`#g3 .pb-card` · rendered 820×219

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| grid-template-columns | `56px minmax(0px, 1fr) auto` | `56px 698px 0px` |
| gap | `16px` | `` |
| column-gap | `16px` | `16px` |
| row-gap | `16px` | `16px` |
| align-items | `start` | `start` |
| padding | `16px 16px 16px 18px` | `` |
| padding-left | `18px` | `18px` |
| padding-right | `16px` | `16px` |
| border-radius | `var(--rad-3)` | `` |
| background | `var(--raised)` | `` |
| background-color | `` | `rgb(31, 39, 46)` |
| background-image | `` | `none` |
| box-shadow | `inset 0 0 0 1px var(--rule)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

**::before**

| property | winning declaration |
|---|---|
| width | `4px` |
| top | `12px` |
| bottom | `12px` |
| left | `0px` |
| border-radius | `0 3px 3px 0` |
| background | `var(--c)` |
| background-color | `` |
| background-image | `` |
| content | `""` |

### Position number

`#g3 .pb-numr` · rendered 14×50

| property | winning declaration | computed |
|---|---|---|
| justify-self | `center` | `center` |
| font | `700 40px/.8 var(--display)` | `` |
| font-family | `` | `"Big Shoulders Display", "Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `58px` | `58px` |
| font-weight | `` | `700` |
| line-height | `` | `46.4px` |
| letter-spacing | — | `normal` |
| color | `var(--c)` | `rgb(242, 194, 48)` |

### Text enclosure

`#g3 .pb-enc` · rendered 698×105

| property | winning declaration | computed |
|---|---|---|
| display | `block` | `block` |
| grid-template-columns | `minmax(0px, 1fr) 44px` | `minmax(0px, 1fr) 44px` |
| align-items | `start` | `start` |
| padding | `0` | `` |
| padding-left | `0px` | `0px` |
| padding-right | `0px` | `0px` |
| border-radius | `var(--rad-2)` | `` |
| background | `linear-gradient(180deg,color-mix(in srgb,var(--c) 7%,var(--sunk)),var(--sunk) 64%)` | `` |
| background-color | `` | `rgba(0, 0, 0, 0)` |
| background-image | `` | `linear-gradient(color(srgb 0.106549 0.107961 0.0788235), rgb(11, 15, 18) 64%)` |
| box-shadow | `inset 0 0 0 1px var(--rule),inset 0 1px 0 color-mix(in srgb,var(--c) 30%,transparent)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset, color(srgb 0.94902 0.760784 0.188235 / 0.3) 0px 1px 0px 0px inset` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |
| overflow | `hidden` | `` |
| cursor | `pointer` | `pointer` |

### Enclosure text

`#g3 .pb-enc p` · rendered 698×60

| property | winning declaration | computed |
|---|---|---|
| display | `-webkit-box` | `flow-root` |
| padding | `13px 18px 2px` | `` |
| padding-left | `18px` | `18px` |
| padding-right | `18px` | `18px` |
| margin | `0` | `` |
| margin-left | `0px` | `0px` |
| margin-right | `0px` | `0px` |
| font | `500 var(--t-md)/1.55 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `14.5px` |
| font-weight | `` | `500` |
| line-height | `` | `22.475px` |
| letter-spacing | — | `normal` |
| color | `var(--ink)` | `rgb(232, 237, 241)` |
| overflow | `hidden` | `` |

### Enclosure footer

`#g3 .pb-encf` · rendered 698×45

| property | winning declaration | computed |
|---|---|---|
| display | `flex` | `flex` |
| gap | `10px` | `` |
| column-gap | `10px` | `10px` |
| row-gap | `10px` | `10px` |
| align-items | `center` | `center` |
| padding | `0 4px 0 18px` | `` |
| padding-left | `18px` | `18px` |
| padding-right | `4px` | `4px` |
| font | `500 var(--t-xs)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `10.5px` |
| font-weight | `` | `500` |
| line-height | `` | `10.5px` |
| letter-spacing | — | `normal` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |

### Show all

`#g3 .pb-enc .pb-exp` · rendered 96×44

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `8px` | `` |
| column-gap | `8px` | `8px` |
| row-gap | `8px` | `8px` |
| align-items | `center` | `center` |
| place-items | `center` | `` |
| width | `auto` | `95.7031px` |
| height | `var(--tap)` | `44px` |
| min-height | `var(--ctl-min, 32px)` | `auto` |
| padding | `0 12px` | `` |
| padding-left | `12px` | `12px` |
| padding-right | `12px` | `12px` |
| margin | `0 0 0 auto` | `` |
| margin-left | `auto` | `482.094px` |
| margin-right | `0px` | `0px` |
| border-radius | `var(--rad-2)` | `` |
| background | `none` | `` |
| background-color | `initial` | `rgba(0, 0, 0, 0)` |
| background-image | `none` | `none` |
| font | `600 var(--t-sm)/1 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `` | `600` |
| line-height | `` | `12px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| color | `var(--ink2)` | `rgb(157, 170, 180)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |

### Lifespan row

`#g3 .pb-tl` · rendered 698×28

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| grid-template-columns | `100px minmax(0px, 1fr) 100px` | `100px 474px 100px` |
| gap | `12px` | `` |
| column-gap | `12px` | `12px` |
| row-gap | `12px` | `12px` |
| align-items | `center` | `center` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Date box

`#g3 .pb-end:not(.pb-nev)` · rendered 100×28

| property | winning declaration | computed |
|---|---|---|
| display | `flex` | `flex` |
| gap | `6px` | `` |
| column-gap | `6px` | `6px` |
| row-gap | `6px` | `6px` |
| align-items | `center` | `center` |
| height | `28px` | `28px` |
| border-radius | `6px` | `` |
| background | `var(--sunk)` | `` |
| background-color | `` | `rgb(11, 15, 18)` |
| background-image | `` | `none` |
| box-shadow | `inset 0 0 0 1px var(--rule)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset` |
| font | `500 var(--t-sm)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `12px` |
| font-weight | `` | `500` |
| line-height | `` | `12px` |
| letter-spacing | — | `normal` |
| color | `var(--ink2)` | `rgb(157, 170, 180)` |
| white-space | `nowrap` | `` |

### No end box

`#g3 .pb-end.pb-nev` · rendered 100×28

| property | winning declaration | computed |
|---|---|---|
| display | `flex` | `flex` |
| gap | `6px` | `` |
| column-gap | `6px` | `6px` |
| row-gap | `6px` | `6px` |
| align-items | `center` | `center` |
| justify-self | `stretch` | `stretch` |
| height | `28px` | `28px` |
| border-radius | `6px` | `` |
| background | `color-mix(in srgb,var(--warn) 12%,transparent)` | `` |
| background-color | `` | `color(srgb 1 0.478431 0.270588 / 0.12)` |
| background-image | `` | `none` |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--warn) 40%,transparent)` | `color(srgb 1 0.478431 0.270588 / 0.4) 0px 0px 0px 1px inset` |
| font | `500 var(--t-sm)/1 var(--data)` | `` |
| font-family | `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `600` | `600` |
| line-height | `` | `12px` |
| letter-spacing | — | `normal` |
| color | `var(--warn-ink)` | `rgb(255, 158, 114)` |
| white-space | `nowrap` | `` |

### Bar

`#g3 .pb-tl .pb-bar` · rendered 474×20

| property | winning declaration | computed |
|---|---|---|
| display | `block` | `block` |
| height | `20px` | `20px` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Track

`#g3 .pb-tl .pb-track` · rendered 474×6

| property | winning declaration | computed |
|---|---|---|
| height | `6px` | `6px` |
| top | `7px` | `7px` |
| right | `0px` | `0px` |
| left | `0px` | `0px` |
| border-radius | `3px` | `` |
| background | `var(--sunk)` | `` |
| background-color | `` | `rgb(11, 15, 18)` |
| background-image | `` | `none` |
| box-shadow | `inset 0 0 0 1px var(--rule)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Span

`#g3 .pb-span:not(.pb-open)` · rendered 267×6

| property | winning declaration | computed |
|---|---|---|
| width | `calc(73.6842%)` | `266.734px` |
| height | `6px` | `6px` |
| top | `7px` | `7px` |
| left | `17.5439%` | `63.5px` |
| border-radius | `3px` | `` |
| background | `var(--c)` | `` |
| background-color | `` | `rgb(31, 138, 94)` |
| background-image | `` | `none` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Open span

`#g3 .pb-span.pb-open` · rendered 474×6

| property | winning declaration | computed |
|---|---|---|
| height | `6px` | `6px` |
| top | `7px` | `7px` |
| right | `0px` | `0px` |
| left | `0%` | `0px` |
| border-radius | `3px 0 0 3px` | `` |
| background | `linear-gradient(90deg,var(--c) 0,var(--c) calc(100% - 90px),color-mix(in srgb,var(--c) 0%,transparent))` | `` |
| background-color | `` | `rgba(0, 0, 0, 0)` |
| background-image | `` | `linear-gradient(90deg, rgb(242, 194, 48) 0px, rgb(242, 194, 48) calc(100% - 90px), color(srgb 0 0 0 / 0))` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

**::after**

| property | winning declaration |
|---|---|
| width | `14px` |
| height | `14px` |
| top | `-4px` |
| right | `-2px` |
| background | `linear-gradient(90deg,transparent,var(--raised))` |
| background-color | `` |
| background-image | `` |
| content | `""` |

### Today marker

`#g3 .pb-tl .pb-now` · rendered 2×18

| property | winning declaration | computed |
|---|---|---|
| width | `2px` | `2px` |
| top | `1px` | `1px` |
| bottom | `1px` | `1px` |
| left | `70.1754%` | `332.625px` |
| border-radius | `1px` | `` |
| background | `var(--ink)` | `` |
| background-color | `` | `rgb(232, 237, 241)` |
| background-image | `` | `none` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Meta row

`#g3 .pb-dates` · rendered 698×34

| property | winning declaration | computed |
|---|---|---|
| display | `flex` | `flex` |
| gap | `8px` | `` |
| column-gap | `8px` | `8px` |
| row-gap | `8px` | `8px` |
| align-items | `center` | `center` |
| flex-wrap | `nowrap` | `nowrap` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Meta pill

`#g3 .pb-pill` · rendered 81×28

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `6px` | `` |
| column-gap | `6px` | `6px` |
| row-gap | `6px` | `6px` |
| align-items | `center` | `center` |
| height | `28px` | `28px` |
| padding | `0 10px` | `` |
| padding-left | `10px` | `10px` |
| padding-right | `10px` | `10px` |
| border-radius | `6px` | `` |
| background | `var(--sunk)` | `` |
| background-color | `` | `rgb(11, 15, 18)` |
| background-image | `` | `none` |
| box-shadow | `inset 0 0 0 1px var(--rule)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset` |
| font | `500 var(--t-sm)/1 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `` | `500` |
| line-height | `` | `12px` |
| letter-spacing | — | `normal` |
| color | `var(--ink2)` | `rgb(157, 170, 180)` |
| white-space | `nowrap` | `` |

### Card actions

`#g3 .pb-dates .pb-cacts` · rendered 169×44

| property | winning declaration | computed |
|---|---|---|
| display | `flex` | `flex` |
| gap | `12px` | `` |
| column-gap | `12px` | `12px` |
| row-gap | `12px` | `12px` |
| margin | `-5px calc(-1 * var(--pb-inset)) -5px auto` | `` |
| margin-left | `` | `444.875px` |
| margin-right | `` | `-5px` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Card action

`#g3 .pb-cacts > .pb-ib` · rendered 44×44

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| align-items | `center` | `center` |
| place-items | `center` | `` |
| flex | `none` | `` |
| width | `var(--tap)` | `44px` |
| height | `var(--tap)` | `44px` |
| min-height | `var(--ctl-min, 32px)` | `auto` |
| padding | `var(--ctl-pad, 7px 10px)` | `` |
| padding-left | `` | `6px` |
| padding-right | `` | `6px` |
| margin-left | `0em` | `0px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--rad-2)` | `` |
| background | `none!important !important` | `` |
| background-color | `initial !important !important` | `rgba(0, 0, 0, 0)` |
| background-image | `none !important !important` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `inherit` | `13px` |
| font-weight | `inherit` | `400` |
| line-height | `inherit` | `19.5px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |
| isolation | `isolate` | `isolate` |

**::before**

| property | winning declaration |
|---|---|
| inset | `var(--pb-inset)` |
| top | `` |
| right | `` |
| bottom | `` |
| left | `` |
| border-radius | `8px` |
| background | `var(--raised)` |
| background-color | `` |
| background-image | `` |
| box-shadow | `inset 0 0 0 1px var(--rule2)` |
| transition | `background .15s,box-shadow .15s` |
| content | `""` |
| z-index | `-1` |

### Card divider

`#g3 .pb-cacts .pb-vr` · rendered 1×24

| property | winning declaration | computed |
|---|---|---|
| align-self | `center` | `center` |
| flex | `none` | `` |
| width | `1px` | `1px` |
| height | `24px` | `24px` |
| background | `var(--rule2)` | `` |
| background-color | `` | `rgb(58, 71, 82)` |
| background-image | `` | `none` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Banner

`#g3 .pb-ban` · rendered 112×63

| property | winning declaration | computed |
|---|---|---|
| display | `block` | `block` |
| width | `112px` | `112px` |
| height | `63px` | `63px` |
| border-radius | `var(--rad-2)` | `` |
| background | `linear-gradient(115deg,#1b2a12,#2f5a1e 40%,#1f8a5e 70%,#b7e07a)` | `` |
| background-color | `initial` | `rgba(0, 0, 0, 0)` |
| background-image | `linear-gradient(115deg, rgb(27, 42, 18), rgb(47, 90, 30) 40%, rgb(31, 138, 94) 70%, rgb(183, 224, 122))` | `linear-gradient(115deg, rgb(27, 42, 18), rgb(47, 90, 30) 40%, rgb(31, 138, 94) 70%, rgb(183, 224, 122))` |
| box-shadow | `rgba(255, 255, 255, 0.08) 0px 0px 0px 1px inset` | `rgba(255, 255, 255, 0.08) 0px 0px 0px 1px inset` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |


## Broadcast delivery queue

### View bar

`#qafter .pb-vb` · rendered 1148×64

| property | winning declaration | computed |
|---|---|---|
| display | `flex` | `flex` |
| gap | `16px` | `` |
| column-gap | `16px` | `16px` |
| row-gap | `16px` | `16px` |
| align-items | `center` | `center` |
| width | `1148px` | `1148px` |
| max-width | `100%` | `100%` |
| min-height | `64px` | `64px` |
| padding | `10px 20px` | `` |
| padding-left | `20px` | `20px` |
| padding-right | `20px` | `20px` |
| border-radius | `var(--rad-3) var(--rad-3) 0 0` | `` |
| background | `var(--paper)` | `` |
| background-color | `` | `rgb(23, 30, 36)` |
| background-image | `` | `none` |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Slots meter line

`#qafter .pb-qcount` · rendered 238×12

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `10px` | `` |
| column-gap | `10px` | `10px` |
| row-gap | `10px` | `10px` |
| align-items | `center` | `center` |
| margin-left | `auto` | `583.281px` |
| font | `500 var(--t-sm)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `12px` |
| font-weight | `` | `500` |
| line-height | `` | `12px` |
| letter-spacing | — | `normal` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |

### Meter

`#qafter .cmeter` · rendered 96×4

| property | winning declaration | computed |
|---|---|---|
| display | `flex` | `flex` |
| width | `96px` | `96px` |
| height | `4px` | `4px` |
| border-radius | `var(--rad-1)` | `` |
| background | `var(--rule)` | `` |
| background-color | `` | `rgb(42, 52, 61)` |
| background-image | `` | `none` |
| font-family | — | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | — | `12px` |
| font-weight | — | `500` |
| line-height | — | `12px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(133, 147, 159)` |
| overflow | `hidden` | `` |

### Queue body

`#qafter .pb-qafter` · rendered 1148×482

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| grid-template-columns | `minmax(0px, 1fr) 300px` | `798px 300px` |
| gap | `18px` | `` |
| column-gap | `18px` | `18px` |
| row-gap | `18px` | `18px` |
| width | `1148px` | `1148px` |
| max-width | `100%` | `100%` |
| padding | `16px` | `` |
| padding-left | `16px` | `16px` |
| padding-right | `16px` | `16px` |
| border-radius | `0 0 var(--rad-3) var(--rad-3)` | `` |
| background | `var(--paper)` | `` |
| background-color | `` | `rgb(23, 30, 36)` |
| background-image | `` | `none` |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Changes ahead column

`#qafter .pb-cg` · rendered 300×166

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| gap | `8px` | `` |
| column-gap | `8px` | `8px` |
| row-gap | `8px` | `8px` |
| align-self | `start` | `start` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Column heading

`#qafter .pb-cg h5` · rendered 300×10

| property | winning declaration | computed |
|---|---|---|
| display | `block` | `block` |
| margin | `0 0 4px` | `` |
| margin-left | `0px` | `0px` |
| margin-right | `0px` | `0px` |
| font | `600 var(--t-micro)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `9.5px` |
| font-weight | `` | `600` |
| line-height | `` | `9.5px` |
| letter-spacing | `0.16em` | `1.52px` |
| text-transform | `uppercase` | `uppercase` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |

### Change card

`#qafter .pb-cgi` · rendered 300×68

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| grid-template-columns | `52px minmax(0px, 1fr)` | `52px 212px` |
| gap | `12px` | `` |
| column-gap | `12px` | `12px` |
| row-gap | `12px` | `12px` |
| align-items | `center` | `center` |
| padding | `10px 12px` | `` |
| padding-left | `12px` | `12px` |
| padding-right | `12px` | `12px` |
| border-radius | `var(--rad-2)` | `` |
| background | `var(--raised)` | `` |
| background-color | `` | `rgb(31, 39, 46)` |
| background-image | `` | `none` |
| box-shadow | `inset 0 0 0 1px var(--rule)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Change date

`#qafter .pb-cgi time` · rendered 52×27

| property | winning declaration | computed |
|---|---|---|
| display | `grid` | `grid` |
| gap | `3px` | `` |
| column-gap | `3px` | `3px` |
| row-gap | `3px` | `3px` |
| font | `700 var(--t-md)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `14.5px` |
| font-weight | `` | `700` |
| line-height | `` | `14.5px` |
| letter-spacing | — | `normal` |
| color | `var(--ink)` | `rgb(232, 237, 241)` |

### Change text

`#qafter .pb-cgi b` · rendered 212×32

| property | winning declaration | computed |
|---|---|---|
| display | `-webkit-box` | `flow-root` |
| font | `600 var(--t-sm)/1.35 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `12px` |
| font-weight | `` | `600` |
| line-height | `` | `16.2px` |
| letter-spacing | — | `normal` |
| color | `var(--ink)` | `rgb(232, 237, 241)` |
| overflow | `hidden` | `` |

### Change verb

`#qafter .pb-cgi em` · rendered 212×12

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `5px` | `` |
| column-gap | `5px` | `5px` |
| row-gap | `5px` | `5px` |
| align-items | `center` | `center` |
| font | `600 var(--t-xs)/1 var(--ui)` | `` |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `` | `10.5px` |
| font-weight | `` | `600` |
| line-height | `` | `10.5px` |
| letter-spacing | — | `normal` |
| color | `var(--gc)` | `rgb(123, 219, 99)` |


## G2 · Admin traffic

### Analytics view bar

`[data-gate=g2] .pb-vb` · rendered 1148×64

| property | winning declaration | computed |
|---|---|---|
| display | `flex` | `flex` |
| gap | `16px` | `` |
| column-gap | `16px` | `16px` |
| row-gap | `16px` | `16px` |
| align-items | `center` | `center` |
| width | `1148px` | `1148px` |
| min-width | `1148px` | `1148px` |
| max-width | `100%` | `100%` |
| min-height | `64px` | `64px` |
| padding | `10px 20px` | `` |
| padding-left | `20px` | `20px` |
| padding-right | `20px` | `20px` |
| border-radius | `var(--rad-3)` | `` |
| background | `var(--paper)` | `` |
| background-color | `` | `rgb(23, 30, 36)` |
| background-image | `` | `none` |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Include group

`.pb-inc` · rendered 208×44

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `10px` | `` |
| column-gap | `10px` | `10px` |
| row-gap | `10px` | `10px` |
| align-items | `center` | `center` |
| padding-left | `16px` | `16px` |
| box-shadow | `inset 1px 0 0 var(--rule2)` | `rgb(58, 71, 82) 1px 0px 0px 0px inset` |
| font-family | — | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | — | `13px` |
| font-weight | — | `400` |
| line-height | — | `19.5px` |
| letter-spacing | — | `normal` |
| color | — | `rgb(232, 237, 241)` |

### Include label

`.pb-inc > span` · rendered 51×10

| property | winning declaration | computed |
|---|---|---|
| font | `600 var(--t-micro)/1 var(--data)` | `` |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |
| font-size | `` | `9.5px` |
| font-weight | `` | `600` |
| line-height | `` | `9.5px` |
| letter-spacing | `0.16em` | `1.52px` |
| text-transform | `uppercase` | `uppercase` |
| color | `var(--ink3)` | `rgb(133, 147, 159)` |

### Admin traffic chip

`.chip.pb-adm` · rendered 132×44

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `8px` | `` |
| column-gap | `8px` | `8px` |
| row-gap | `8px` | `8px` |
| align-items | `center` | `center` |
| min-height | `var(--tap)` | `44px` |
| padding | `0 16px` | `` |
| padding-left | `16px` | `16px` |
| padding-right | `16px` | `16px` |
| margin-left | `0em` | `0px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--rad-pill)` | `` |
| background | `color-mix(in srgb,var(--r-analytics) 14%,transparent)` | `` |
| background-color | `` | `oklab(0.672375 -0.0751905 0.0952017 / 0.16437)` |
| background-image | `` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `var(--t-sm)` | `12px` |
| font-weight | `600` | `600` |
| line-height | `inherit` | `18px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| text-decoration | `none` | `` |
| color | `var(--ink)` | `rgb(230, 235, 239)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |

### Admin traffic chip, on

`.chip.pb-adm[aria-pressed=true]` · rendered 132×44

| property | winning declaration | computed |
|---|---|---|
| display | `inline-flex` | `flex` |
| gap | `8px` | `` |
| column-gap | `8px` | `8px` |
| row-gap | `8px` | `8px` |
| align-items | `center` | `center` |
| min-height | `var(--tap)` | `44px` |
| padding | `0 16px` | `` |
| padding-left | `16px` | `16px` |
| padding-right | `16px` | `16px` |
| margin-left | `0em` | `0px` |
| margin-right | `0em` | `0px` |
| border-radius | `var(--rad-pill)` | `` |
| background | `color-mix(in srgb,var(--r-analytics) 14%,transparent)` | `` |
| background-color | `` | `oklab(0.738029 -0.0843557 0.108548 / 0.148317)` |
| background-image | `` | `none` |
| font | `inherit` | `` |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` |
| font-size | `var(--t-sm)` | `12px` |
| font-weight | `600` | `600` |
| line-height | `inherit` | `18px` |
| letter-spacing | `normal` | `normal` |
| text-transform | `none` | `none` |
| text-decoration | `none` | `` |
| color | `var(--ink)` | `rgb(231, 236, 240)` |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` |
| cursor | `pointer` | `pointer` |
