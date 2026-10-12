---
kind: reference
status: live
---

> 🔴 **THIS SUPERSEDES `resolved-spec.md` FOR VALUES — generated 2026-09-21 10:34 EDT** by board 3's enumerating extractor (`BOARD=1 node ../2026-09-15-pins2-board-3/3e/extract-spec.cjs '' <this file>`, kit server on :8900). `resolved-spec.md` came from a CURATED selector list: first match only, no `:focus-visible`/`:active`, no markup, no inherited provenance, logical properties (`padding-inline`) invisible, and no G10 Compare at all. This walks every element in every gate and every reachable state. `resolved-spec.md` is kept because plan §10.4 and the port sheets cite it by line number. The board renders on the stylesheet he APPROVED it on (`../2026-09-14-pins2-board/app.css`, from the published artifact), not the live portal build.

# Pins-2 design board 1 (G9 · G10 · G8) — resolved values

*Generated 2026-09-21T14:30:58.756Z by `extract-spec.cjs` from http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/index.html at 1282×888, fresh profile. 392 looks specced across 158 signatures. Page errors: 0. Classed signatures rendered in a stage that no pass reached: **0**. Winning declarations the computed value contradicts: **5** (marked ⚠️).*

**How to read a table.** *winning declaration* is the text Chrome applied for that property name, in cascade order with `!important` honoured; *computed* is what it resolved to; *from* is the selector and `file:line` in the kit. ↑ means nothing on the element declares it and the value is inherited from the named ancestor rule. ⚠️ means a DIFFERENT property name overrode it later — a shorthand beaten by a longhand or the reverse (`padding` against `padding-inline`) — and **the computed column is the truth**. A user-agent row is kept only where it sets something other than a default.

## Tokens as resolved on `:root`

Every custom property the kit's four stylesheets read. **Scope** says where it is set: `:root` means a global token; `component` means a rule sets it on an element (read its value in that element's table); `JS` means only `b3/state.js` stamps it at runtime, so it does not exist in any stylesheet and must become a real token or a literal when ported.

| token | value on :root | scope |
|---|---|---|
| `--av-src` | — | fallback only |
| `--avatar-a` | `#3A4C5A` | :root |
| `--b` | — | component |
| `--c` | — | component |
| `--ci` | — | fallback only |
| `--ci-bg` | — | component |
| `--ctl-min` | `auto` | :root |
| `--ctl-pad` | `1px 6px` | :root |
| `--ctl-pl` | — | component |
| `--ctl-rad` | `0` | :root |
| `--d` | — | fallback only |
| `--danger-edge` | `#54322F` | :root |
| `--danger-ink` | `#FF8A85` | :root |
| `--data` | `"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace` | :root |
| `--dc-bg` | `#2B2D31` | :root |
| `--dc-body` | `#DBDEE1` | :root |
| `--dc-code` | `#A8B0B8` | :root |
| `--dc-dim` | `#949BA4` | :root |
| `--dc-ink` | `#F2F3F5` | :root |
| `--dc-mute` | `#B5BAC1` | :root |
| `--dc-rule` | `#3A3C41` | :root |
| `--dc-sunk` | `#1E1F22` | :root |
| `--del` | `#FF6B6B` | :root |
| `--desk` | `#0F1418` | :root |
| `--display` | `"Big Shoulders Display","Space Grotesk",-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif` | :root |
| `--dsc` | `#5865F2` | :root |
| `--dsc-hover` | `#4752C4` | :root |
| `--dur-1` | `130ms` | :root |
| `--dur-2` | `180ms` | :root |
| `--dur-3` | `320ms` | :root |
| `--dur-toast-in` | `460ms` | :root |
| `--dur-toast-out` | `260ms` | :root |
| `--ease` | `cubic-bezier(.2,.8,.3,1)` | :root |
| `--ease-soft` | `cubic-bezier(.22,1,.36,1)` | :root |
| `--ed` | — | fallback only |
| `--edge` | `22px` | :root |
| `--ev` | `#4A90D9` | :root |
| `--ev-ink` | `#25A570` | :root |
| `--fill` | — | component |
| `--focus` | `#5FD4E8` | :root |
| `--focus-07` | `rgba(95,212,232,.07)` | :root |
| `--focus-13` | `rgba(95,212,232,.13)` | :root |
| `--from` | — | fallback only |
| `--gap` | `14px` | :root |
| `--gut` | `24px` | :root |
| `--gutter` | `138px` | :root |
| `--hdr-h` | `52px` | :root |
| `--hi` | `#232C34` | :root |
| `--info` | `#409AD0` | :root |
| `--ink` | `#E8EDF1` | :root |
| `--ink2` | `#9DAAB4` | :root |
| `--ink3` | `#85939F` | :root |
| `--ink4` | `#5C6A75` | :root |
| `--inset-06` | `rgba(255,255,255,.06)` | :root |
| `--inset-09` | `rgba(255,255,255,.09)` | :root |
| `--inset-14` | `rgba(255,255,255,.14)` | :root |
| `--inset-16` | `rgba(255,255,255,.16)` | :root |
| `--inset-22` | `rgba(255,255,255,.22)` | :root |
| `--inset-35` | `rgba(255,255,255,.35)` | :root |
| `--lh-body` | `1.5` | :root |
| `--lh-ui` | `1.35` | :root |
| `--lift` | `2px` | :root |
| `--live` | — | component |
| `--m1` | — | fallback only |
| `--m2` | — | fallback only |
| `--m3` | — | fallback only |
| `--mode-dmz` | `#3DA5F5` | :root |
| `--mode-mp` | `#FF3430` | :root |
| `--mono` | `"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace` | :root |
| `--o` | — | component |
| `--ok` | `#7BDB63` | :root |
| `--on-accent` | `#07090A` | :root |
| `--on-ok` | `#07130A` | :root |
| `--overlay-62` | `rgba(6,9,11,.62)` | :root |
| `--overlay-66` | `rgba(6,9,11,.66)` | :root |
| `--ow-c-min` | `88px` | :root |
| `--ow-pill-min` | `126px` | :root |
| `--p` | — | fallback only |
| `--paper` | `#171E24` | :root |
| `--patch` | `#F2C230` | :root |
| `--plot-l` | `138px` | :root |
| `--pn` | `#F2C230` | :root |
| `--press` | `1px` | :root |
| `--r-access` | `#6C8AF7` | :root |
| `--r-analytics` | `#9CC85A` | :root |
| `--r-armory` | `#EF4444` | :root |
| `--r-broadcast` | `#EC4899` | :root |
| `--r-history` | `#00E1D9` | :root |
| `--r-review` | `#D8F24A` | :root |
| `--r-season` | `#F59E0C` | :root |
| `--rad-1` | `3px` | :root |
| `--rad-2` | `6px` | :root |
| `--rad-3` | `10px` | :root |
| `--rad-pill` | `999px` | :root |
| `--rad-round` | `50%` | :root |
| `--radius` | `6px` | :root |
| `--rail-w` | `88px` | :root |
| `--raised` | `#1F272E` | :root |
| `--realm-c` | — | component |
| `--rec-x` | — | component |
| `--row-selected` | `#20303B` | :root |
| `--rule` | `#2A343D` | :root |
| `--rule2` | `#3A4752` | :root |
| `--rule3` | `#1C242A` | :root |
| `--s1` | `4px` | :root |
| `--s2` | `8px` | :root |
| `--s3` | `12px` | :root |
| `--s4` | `16px` | :root |
| `--s5` | `24px` | :root |
| `--s6` | `32px` | :root |
| `--sched` | `#A680FB` | :root |
| `--scrim-28` | `rgba(0,0,0,.28)` | :root |
| `--scrim-40` | `rgba(0,0,0,.4)` | :root |
| `--scrim-45` | `rgba(0,0,0,.45)` | :root |
| `--scrim-50` | `rgba(0,0,0,.5)` | :root |
| `--scrim-70` | `rgba(0,0,0,.7)` | :root |
| `--scrim-80` | `rgba(0,0,0,.8)` | :root |
| `--scrim-85` | `rgba(0,0,0,.85)` | :root |
| `--scrim-90` | `rgba(0,0,0,.9)` | :root |
| `--scrim-95` | `rgba(0,0,0,.95)` | :root |
| `--sev` | — | component |
| `--staged` | `#D8F24A` | :root |
| `--stem` | — | component |
| `--sunk` | `#0B0F12` | :root |
| `--t-base` | `13px` | :root |
| `--t-display` | `44px` | :root |
| `--t-epic` | `#C0A3D4` | :root |
| `--t-epic-edge` | `rgba(142,107,166,.4)` | :root |
| `--t-epic-wash` | `rgba(142,107,166,.18)` | :root |
| `--t-figure` | `34px` | :root |
| `--t-h1` | `22px` | :root |
| `--t-hero` | `26px` | :root |
| `--t-lg` | `16.5px` | :root |
| `--t-md` | `14.5px` | :root |
| `--t-micro` | `9.5px` | :root |
| `--t-mythic` | `#E254DE` | :root |
| `--t-mythic-edge` | `rgba(226,84,222,.35)` | :root |
| `--t-mythic-wash` | `rgba(226,84,222,.15)` | :root |
| `--t-sm` | `12px` | :root |
| `--t-xl` | `19px` | :root |
| `--t-xs` | `10.5px` | :root |
| `--tap` | `44px` | :root |
| `--tc` | — | component |
| `--tink` | — | component |
| `--tint-hover` | `9%` | :root |
| `--tint-lift` | `14%` | :root |
| `--title` | `"Instrument Serif",Georgia,"Times New Roman",serif` | :root |
| `--topic-accent` | — | fallback only |
| `--tr-display` | `-.028em` | :root |
| `--tr-fig` | `.004em` | :root |
| `--tr-figure` | `-.02em` | :root |
| `--tr-h1` | `-.015em` | :root |
| `--tr-micro` | `.1em` | :root |
| `--tr-title` | `-.006em` | :root |
| `--ui` | `"Space Grotesk",-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif` | :root |
| `--v2-accent` | — | fallback only |
| `--warn` | `#FF7A45` | :root |
| `--warn-ink` | `#FF9E72` | :root |
| `--win-06` | `rgba(31,138,94,.06)` | :root |
| `--win-10` | `rgba(31,138,94,.10)` | :root |
| `--win-12` | `rgba(31,138,94,.12)` | :root |
| `--win-18` | `rgba(31,138,94,.18)` | :root |
| `--win-20` | `rgba(31,138,94,.20)` | :root |
| `--win-45` | `rgba(31,138,94,.45)` | :root |
| `--xtop` | — | fallback only |


## @keyframes the board uses

**`portal-spin`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes portal-spin { 100% { transform: rotate(360deg); } }
```

**`spin`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes spin { 100% { transform: rotate(360deg); } }
```

**`pulse`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.55); opacity: 0.55; } }
```

**`conflictIn`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes conflictIn { 0% { box-shadow: rgba(255, 122, 69, 0.55) 0px 0px 0px 0px; } 100% { box-shadow: rgba(255, 122, 69, 0) 0px 0px 0px 14px; } }
```

**`skel`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes skel { 100% { background-position: -220% 0px; } }
```

**`refl`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes refl { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
```

**`rb`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes rb { 0% { background: color-mix(in srgb,var(--danger-ink) 26%,transparent); } 35% { background: color-mix(in srgb,var(--danger-ink) 26%,transparent); } 100% { background: transparent; } }
```

**`viewIn`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes viewIn { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: none; } }
```

**`stagePulse`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes stagePulse { 0% { box-shadow: 0 0 0 0 color-mix(in srgb,var(--staged) 55%,transparent); } 100% { box-shadow: 0 0 0 14px color-mix(in srgb,var(--staged) 0%,transparent); } }
```

**`countBump`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes countBump { 0% { transform: scale(1); } 40% { transform: scale(1.32); } 100% { transform: scale(1); } }
```

**`sess-ping`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes sess-ping { 0% { border-color: color-mix(in srgb,var(--live) 32%,transparent); box-shadow: 0 0 8px 0 color-mix(in srgb,var(--live) 16%,transparent),0 0 0 0 color-mix(in srgb,var(--live) 46%,transparent); } 55% { border-color: color-mix(in srgb,var(--live) 54%,transparent); box-shadow: 0 0 14px 2px color-mix(in srgb,var(--live) 30%,transparent),0 0 0 6px color-mix(in srgb,var(--live) 6%,transparent); } 100% { border-color: color-mix(in srgb,var(--live) 32%,transparent); box-shadow: 0 0 8px 0 color-mix(in srgb,var(--live) 16%,transparent),0 0 0 9px transparent; } }
```

**`sess-bloom`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes sess-bloom { 0%, 100% { opacity: 0.58; transform: scale(1.18); filter: blur(2.3px); } 50% { opacity: 1; transform: scale(0.6); filter: blur(0.5px); } }
```

**`arrive`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes arrive { 0% { opacity: 0; transform: translateY(-50%) scaleX(0.72); } 100% { opacity: 1; transform: translateY(-50%) scaleX(1); } }
```

**`arrive-pt`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes arrive-pt { 0% { opacity: 0; transform: rotate(45deg) scale(0.4); } 100% { opacity: 1; transform: rotate(45deg) scale(1); } }
```

**`rowin`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes rowin { 0% { opacity: 0; transform: translateX(-10px); } 100% { opacity: 1; transform: none; } }
```

**`landed`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes landed { 0% { background: color-mix(in srgb,var(--c,var(--staged)) 26%,transparent); } 55% { background: color-mix(in srgb,var(--c,var(--staged)) 16%,transparent); } 100% { background: transparent; } }
```

**`figRoll`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes figRoll { 0% { transform: translateY(0px); opacity: 1; } 45% { transform: translateY(-42%); opacity: 0; } 55% { transform: translateY(42%); opacity: 0; } 100% { transform: translateY(0px); opacity: 1; } }
```

**`fdrift`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes fdrift { 0% { opacity: 0; transform: translateY(6px); } 25% { opacity: 1; transform: translateY(0px); } 100% { opacity: 0; transform: translateY(-9px); } }
```

**`toastIn`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes toastIn { 0% { opacity: 0; transform: translateX(-50%) translateY(26px) scale(0.97); } 35% { opacity: 1; } 100% { opacity: 1; transform: translateX(-50%) translateY(0px) scale(1); } }
```

**`toastOut`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes toastOut { 0% { opacity: 1; transform: translateX(-50%) translateY(0px) scale(1); } 100% { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.985); } }
```

**`d-just-granted`** · http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board/app.css

```css
@keyframes d-just-granted { 0% { background: color-mix(in srgb, var(--ok) 22%, transparent); } 100% { background: transparent; } }
```

**`pb-in`** · inline

```css
@keyframes pb-in { 0% { opacity: 0; } 100% { opacity: 1; } }
```


## G9 · New build drawer — resting


### G9 stage

94 distinct signatures on screen; 94 not already specced above.


### `aside.drawer.wide[role=dialog]`

inside `.pb-stage` · 1 on screen · **1 look**

#### the one look

`G9-1` · rendered **880×1254** · 1 instance look like this · aria-label="New build" role="dialog"

```html
<aside class="drawer wide" role="dialog" aria-label="New build" data-nb="" data-arm="MP" data-many="0"> <header class="dw-h"> <div class="dw-ttl"><span class="dw-eye" data-eye="">loadout.add · MP · tier 1</span><h2 data-title="">New MP build</h2></div> <button class="x" aria-label="Close">⟨svg.ic⟩</button> </header> <div class="pb-bar"> <div class="seg pb-seg pb-mode" data-seg="arm" data-arm="MP"> <span class="pb-thu
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| position | `relative` | `relative` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| flex-direction | `column` | `column` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| width | `880px` | `880px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| max-height | `none` | `none` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0 auto` | `` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-top | `0px` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-right | `auto` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-bottom | `0px` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-left | `auto` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| top | `auto` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| left | `auto` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| border | `1px solid var(--rule2)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| border-radius | `var(--rad-3)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| background | `var(--raised)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| background-color | `` | `rgb(31, 39, 46)` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| background-image | `` | `none` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| box-shadow | `rgba(0, 0, 0, 0.75) 0px 40px 80px -24px` | `rgba(0, 0, 0, 0.75) 0px 40px 80px -24px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| opacity | `1` | `1` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| overflow | `hidden` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| overflow-x | `hidden` | `hidden` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| overflow-y | `hidden` | `hidden` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| transform | `none` | `none` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| transition | `opacity .18s,transform .18s cubic-bezier(.2,.8,.3,1)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| z-index | `auto` | `auto` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| pointer-events | `auto` | `auto` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |


### `header.dw-h`

inside `.drawer` · 1 on screen · **1 look**

#### the one look

`G9-2` · rendered **878×77** · 1 instance look like this

```html
<header class="dw-h"> <div class="dw-ttl"><span class="dw-eye" data-eye="">loadout.add · MP · tier 1</span><h2 data-title="">New MP build</h2></div> <button class="x" aria-label="Close">⟨svg.ic⟩</button> </header>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .dw-h · 2026-09-14-pins2-board/app.css:1073 |
| position | `sticky` | `sticky` | header · 2026-09-14-pins2-board/app.css:661 |
| grid-column | `1/-1` | `` | header · 2026-09-14-pins2-board/app.css:661 |
| gap | `14px` | `` | .dw-h · 2026-09-14-pins2-board/app.css:1073 |
| column-gap | `14px` | `14px` | .dw-h · 2026-09-14-pins2-board/app.css:1073 |
| row-gap | `14px` | `14px` | .dw-h · 2026-09-14-pins2-board/app.css:1073 |
| flex | `none` | `` | .dw-h · 2026-09-14-pins2-board/app.css:1073 |
| align-items | `flex-start` | `flex-start` | .dw-h · 2026-09-14-pins2-board/app.css:1073 |
| min-width | `0px` | `0px` | header · 2026-09-14-pins2-board/app.css:1125 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `var(--s4) var(--s5) var(--s3)` | `` | .dw-h · 2026-09-14-pins2-board/app.css:1073 |
| padding-top | `` | `16px` | .dw-h · 2026-09-14-pins2-board/app.css:1073 |
| padding-right | `` | `24px` | .dw-h · 2026-09-14-pins2-board/app.css:1073 |
| padding-bottom | `` | `12px` | .dw-h · 2026-09-14-pins2-board/app.css:1073 |
| padding-left | `` | `24px` | .dw-h · 2026-09-14-pins2-board/app.css:1073 |
| top | `0px` | `0px` | header · 2026-09-14-pins2-board/app.css:661 |
| border-bottom | `1px solid var(--rule)` | `` | .dw-h · 2026-09-14-pins2-board/app.css:1073 |
| background | `linear-gradient(180deg,rgba(255,255,255,.03),transparent)` | `` | .dw-h · 2026-09-14-pins2-board/app.css:1073 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .dw-h · 2026-09-14-pins2-board/app.css:1073 |
| background-image | `linear-gradient(rgba(255, 255, 255, 0.03), transparent)` | `linear-gradient(rgba(255, 255, 255, 0.03), rgba(0, 0, 0, 0))` | .dw-h · 2026-09-14-pins2-board/app.css:1073 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| z-index | `40` | `40` | header · 2026-09-14-pins2-board/app.css:661 |


### `div.dw-ttl`

inside `.dw-h` · 1 on screen · **1 look**

#### the one look

`G9-3` · rendered **164×48** · 1 instance look like this

```html
<div class="dw-ttl"><span class="dw-eye" data-eye="">loadout.add · MP · tier 1</span><h2 data-title="">New MP build</h2></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .dw-ttl · 2026-09-14-pins2-board/app.css:1075 |
| gap | `6px` | `` | .dw-ttl · 2026-09-14-pins2-board/app.css:1075 |
| column-gap | `6px` | `6px` | .dw-ttl · 2026-09-14-pins2-board/app.css:1075 |
| row-gap | `6px` | `6px` | .dw-ttl · 2026-09-14-pins2-board/app.css:1075 |
| flex-direction | `column` | `column` | .dw-ttl · 2026-09-14-pins2-board/app.css:1075 |
| min-width | `0px` | `0px` | .dw-ttl · 2026-09-14-pins2-board/app.css:1075 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.dw-eye`

inside `.dw-ttl` · 1 on screen · **1 look**

#### the one look

`G9-4` · rendered **164×14** · 1 instance look like this · text “loadout.add · MP · tier 1”

```html
<span class="dw-eye" data-eye="">loadout.add · MP · tier 1</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | `var(--data)` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .dw-eye · 2026-09-14-pins2-board/app.css:1076 |
| font-size | `var(--t-micro)` | `9.5px` | .dw-eye · 2026-09-14-pins2-board/app.css:1076 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `14.25px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | `0.09em` | `0.855px` | .dw-eye · 2026-09-14-pins2-board/app.css:1076 |
| text-transform | `uppercase` | `uppercase` | .dw-eye · 2026-09-14-pins2-board/app.css:1076 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .dw-eye · 2026-09-14-pins2-board/app.css:1076 |


### `button.x`

inside `.dw-h` · 1 on screen · **1 look**

#### the one look

`G9-5` · rendered **28×28** · 1 instance look like this · aria-label="Close"

```html
<button class="x" aria-label="Close">⟨svg.ic⟩</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | input, textarea, select, button · user-agent:? |
| position | `relative` | `relative` | .dw-h .x · 2026-09-14-pins2-board/app.css:1081 |
| flex | `none` | `` | .dw-h .x · 2026-09-14-pins2-board/app.css:1081 |
| width | `28px` | `28px` | .drawer .x · 2026-09-14-pins2-board/app.css:1096 |
| height | `28px` | `28px` | .drawer .x · 2026-09-14-pins2-board/app.css:1096 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `var(--ctl-pad, 7px 10px)` | `` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-top | `` | `1px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-right | `` | `6px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-bottom | `` | `1px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-left | `` | `6px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| margin-left | `auto` | `624.125px` | .dw-h .x · 2026-09-14-pins2-board/app.css:1081 |
| border | `1px solid var(--rule2)` | `` | .drawer .x · 2026-09-14-pins2-board/app.css:1096 |
| border-radius | `var(--rad-2)` | `` | .drawer .x · 2026-09-14-pins2-board/app.css:1096 |
| background | `none` | `` | .drawer .x · 2026-09-14-pins2-board/app.css:1096 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .drawer .x · 2026-09-14-pins2-board/app.css:1096 |
| background-image | `none` | `none` | .drawer .x · 2026-09-14-pins2-board/app.css:1096 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `var(--t-sm)` | `12px` | .dw-h .x · 2026-09-14-pins2-board/app.css:1081 |
| font-weight | `inherit` | `400` | button · 2026-09-14-pins2-board/app.css:600 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `18px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .drawer .x · 2026-09-14-pins2-board/app.css:1096 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | .dw-h .x · 2026-09-14-pins2-board/app.css:1081 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .dw-h .x::after · 2026-09-14-pins2-board/app.css:1083 |
| inset | `-8px` | .dw-h .x::after · 2026-09-14-pins2-board/app.css:1083 |
| top | `-8px` | .dw-h .x::after · 2026-09-14-pins2-board/app.css:1083 |
| right | `-8px` | .dw-h .x::after · 2026-09-14-pins2-board/app.css:1083 |
| bottom | `-8px` | .dw-h .x::after · 2026-09-14-pins2-board/app.css:1083 |
| left | `-8px` | .dw-h .x::after · 2026-09-14-pins2-board/app.css:1083 |
| border-radius | `inherit` | .dw-h .x::after · 2026-09-14-pins2-board/app.css:1083 |
| content | `""` | .dw-h .x::after · 2026-09-14-pins2-board/app.css:1083 |

**:hover** — changes; parts inside it respond (table below)

| property | at rest | hover |
|---|---|---|
| background-color | `rgba(0, 0, 0, 0)` | `rgb(35, 44, 52)` |
| color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |

| part inside | property | at rest | hover |
|---|---|---|---|
| ::before | color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| ::before | border-color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| ::before | outline-color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| ::after | color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| ::after | border-color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| ::after | outline-color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| svg.ic | color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| svg.ic | border-color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| svg.ic | outline-color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| svg.ic | stroke | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| use | color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| use | border-color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| use | outline-color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| use | stroke | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `svg.ic`

inside `.x` · 24 on screen · **11 looks**

#### look 1 of 11

`G9-6` · rendered **12×12** · 1 instance look like this

```html
<svg class="ic"><use href="#i-x"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `inline-block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| width | `1em` | `12px` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| height | `1em` | `12px` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .dw-h .x · 2026-09-14-pins2-board/app.css:1081 |
| font-weight | ↑ `inherit` | `400` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-style | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `18px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .drawer .x · 2026-09-14-pins2-board/app.css:1096 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .dw-h .x · 2026-09-14-pins2-board/app.css:1081 |
| pointer-events | `none` | `none` | button .ic, a .ic · 2026-09-14-pins2-board/app.css:6172 |

#### look 2 of 11

`G9-13` · rendered **14×14** · 1 instance look like this

```html
<svg class="ic"><use href="#i-one"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| width | `14px` | `14px` | .pb-seg .ic · 2026-09-14-pins2-board/index.html:43 |
| height | `14px` | `14px` | .pb-seg .ic · 2026-09-14-pins2-board/index.html:43 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .seg button · 2026-09-14-pins2-board/app.css:711 |
| font-weight | ↑ `600` | `600` | inherited · .seg button · 2026-09-14-pins2-board/app.css:711 |
| font-style | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `18px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · .pb-seg.seg button[aria-pressed="true"] · 2026-09-14-pins2-board/index.html:40 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-seg.seg button · 2026-09-14-pins2-board/index.html:39 |
| pointer-events | `none` | `none` | button .ic, a .ic · 2026-09-14-pins2-board/app.css:6172 |

#### look 3 of 11

`G9-14` · rendered **14×14** · 1 instance look like this

```html
<svg class="ic"><use href="#i-layers"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| width | `14px` | `14px` | .pb-seg .ic · 2026-09-14-pins2-board/index.html:43 |
| height | `14px` | `14px` | .pb-seg .ic · 2026-09-14-pins2-board/index.html:43 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .seg button · 2026-09-14-pins2-board/app.css:711 |
| font-weight | ↑ `600` | `600` | inherited · .seg button · 2026-09-14-pins2-board/app.css:711 |
| font-style | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `18px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .seg button · 2026-09-14-pins2-board/app.css:711 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-seg.seg button · 2026-09-14-pins2-board/index.html:39 |
| pointer-events | `none` | `none` | button .ic, a .ic · 2026-09-14-pins2-board/app.css:6172 |

#### look 4 of 11

`G9-25` · rendered **13×13** · 14 instances look like this

```html
<svg class="ic"><use href="#i-chevron-down"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| position | `absolute` | `absolute` | .pb-combo > .ic · 2026-09-14-pins2-board/index.html:155 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| width | `1em` | `13px` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| height | `1em` | `13px` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `50%` | `22px` | .pb-combo > .ic · 2026-09-14-pins2-board/index.html:155 |
| right | `14px` | `14px` | .pb-combo > .ic · 2026-09-14-pins2-board/index.html:155 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-combo > .ic · 2026-09-14-pins2-board/index.html:155 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| transform | `translateY(-50%)` | `matrix(1, 0, 0, 1, 0, -6.5)` | .pb-combo > .ic · 2026-09-14-pins2-board/index.html:155 |
| pointer-events | `none` | `none` | .pb-combo > .ic · 2026-09-14-pins2-board/index.html:155 |

#### look 5 of 11

`G9-39` · rendered **13×13** · 1 instance look like this

```html
<svg class="ic"><use href="#i-copy"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| width | `1em` | `13px` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| height | `1em` | `13px` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-size | ↑ `inherit` | `13px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-weight | ↑ `inherit` | `400` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-style | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `19.5px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-copy · 2026-09-14-pins2-board/index.html:56 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-codefield .pb-copy · 2026-09-14-pins2-board/index.html:80 |
| pointer-events | `none` | `none` | button .ic, a .ic · 2026-09-14-pins2-board/app.css:6172 |

#### look 6 of 11

`G9-43` · rendered **13×13** · 1 instance look like this

```html
<svg class="ic"><use href="#i-wand"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `inline-block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| width | `13px` | `13px` | .pb-hfill .ic · 2026-09-14-pins2-board/index.html:271 |
| height | `13px` | `13px` | .pb-hfill .ic · 2026-09-14-pins2-board/index.html:271 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-right | `4px` | `4px` | .pb-hfill .ic · 2026-09-14-pins2-board/index.html:271 |
| font | ↑ `500 var(--t-sm)/1 var(--ui)` | `` | inherited · .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| font-size | ↑ `` | `12px` | inherited · .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| font-weight | ↑ `` | `500` | inherited · .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| font-style | ↑ `` | `normal` | inherited · .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| line-height | ↑ `` | `12px` | inherited · .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| letter-spacing | ↑ `0px` | `normal` | inherited · .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| color | `var(--patch)` | `rgb(242, 194, 48)` | .pb-hfill .ic · 2026-09-14-pins2-board/index.html:271 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |

*5 further looks are the same component in other data hues (a per-row `--c` / `--m` / `--sl`); they differ in colour only.*


### `div.pb-bar`

inside `.drawer` · 1 on screen · **1 look**

#### the one look

`G9-7` · rendered **878×63** · 1 instance look like this

```html
<div class="pb-bar"> <div class="seg pb-seg pb-mode" data-seg="arm" data-arm="MP"> <span class="pb-thumb" style="width: 52px; transform: translateX(3px);"></span> <button aria-pressed="true" data-v="MP">MP</button><button aria-pressed="false" data-v="DMZ">DMZ</button> </div> <span class="pb-div" aria-hidden="true"></span> <div class="seg pb-seg" data-seg="many"> <span class="pb-thumb" style="width: 105px; transform: 
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-bar · 2026-09-14-pins2-board/index.html:50 |
| gap | `12px` | `` | .pb-bar · 2026-09-14-pins2-board/index.html:50 |
| column-gap | `12px` | `12px` | .pb-bar · 2026-09-14-pins2-board/index.html:50 |
| row-gap | `12px` | `12px` | .pb-bar · 2026-09-14-pins2-board/index.html:50 |
| align-items | `center` | `center` | .pb-bar · 2026-09-14-pins2-board/index.html:50 |
| justify-content | `flex-start` | `flex-start` | .pb-bar · 2026-09-14-pins2-board/index.html:150 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `10px var(--s5)` | `` | .pb-bar · 2026-09-14-pins2-board/index.html:50 |
| padding-top | `` | `10px` | .pb-bar · 2026-09-14-pins2-board/index.html:50 |
| padding-right | `` | `24px` | .pb-bar · 2026-09-14-pins2-board/index.html:50 |
| padding-bottom | `` | `10px` | .pb-bar · 2026-09-14-pins2-board/index.html:50 |
| padding-left | `` | `24px` | .pb-bar · 2026-09-14-pins2-board/index.html:50 |
| border-bottom | `1px solid var(--rule)` | `` | .pb-bar · 2026-09-14-pins2-board/index.html:50 |
| background | `var(--sunk)` | `` | .pb-bar · 2026-09-14-pins2-board/index.html:50 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-bar · 2026-09-14-pins2-board/index.html:50 |
| background-image | `` | `none` | .pb-bar · 2026-09-14-pins2-board/index.html:50 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-mode.pb-seg.seg`

inside `.pb-bar` · 1 on screen · **1 look**

#### the one look

`G9-8` · rendered **123×42** · 1 instance look like this

```html
<div class="seg pb-seg pb-mode" data-seg="arm" data-arm="MP"> <span class="pb-thumb" style="width: 52px; transform: translateX(3px);"></span> <button aria-pressed="true" data-v="MP">MP</button><button aria-pressed="false" data-v="DMZ">DMZ</button> </div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-seg.seg · 2026-09-14-pins2-board/index.html:38 |
| position | `relative` | `relative` | .pb-seg.seg · 2026-09-14-pins2-board/index.html:38 |
| gap | `2px` | `` | .seg · 2026-09-14-pins2-board/app.css:710 |
| column-gap | `2px` | `2px` | .seg · 2026-09-14-pins2-board/app.css:710 |
| row-gap | `2px` | `2px` | .seg · 2026-09-14-pins2-board/app.css:710 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `3px` | `` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-top | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-right | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-bottom | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-left | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| border | `1px solid var(--rule)` | `` | .seg · 2026-09-14-pins2-board/app.css:710 |
| border-radius | `var(--rad-pill)` | `` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| background | `var(--sunk)` | `` | .seg · 2026-09-14-pins2-board/app.css:710 |
| background-color | `` | `rgb(11, 15, 18)` | .seg · 2026-09-14-pins2-board/app.css:710 |
| background-image | `` | `none` | .seg · 2026-09-14-pins2-board/app.css:710 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-thumb`

inside `.seg` · 5 on screen · **5 looks**

#### look 1 of 5

`G9-9` · rendered **52×34** · 1 instance look like this

```html
<span class="pb-thumb" style="width: 52px; transform: translateX(3px);"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| width | `52px` | `52px` | style attribute |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| bottom | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| left | `0px` | `0px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| border-radius | `var(--rad-pill)` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| background | `var(--mode-mp)` | `` | .pb-seg.pb-mode .pb-thumb · 2026-09-14-pins2-board/index.html:45 |
| background-color | `` | `rgb(255, 52, 48)` | .pb-seg.pb-mode .pb-thumb · 2026-09-14-pins2-board/index.html:45 |
| background-image | `` | `none` | .pb-seg.pb-mode .pb-thumb · 2026-09-14-pins2-board/index.html:45 |
| box-shadow | `none` | `none` | .pb-seg.pb-mode .pb-thumb · 2026-09-14-pins2-board/index.html:45 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| transform | `translateX(3px)` | `matrix(1, 0, 0, 1, 3, 0)` | style attribute |
| transition | `transform .26s cubic-bezier(.3,.7,.2,1),width .26s cubic-bezier(.3,.7,.2,1),background .2s` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |

#### look 2 of 5

`G9-12` · rendered **105×34** · 1 instance look like this

```html
<span class="pb-thumb" style="width: 105px; transform: translateX(3px);"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| width | `105px` | `105px` | style attribute |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| bottom | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| left | `0px` | `0px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| border-radius | `var(--rad-pill)` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| background | `var(--hi)` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| background-color | `` | `rgb(35, 44, 52)` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| background-image | `` | `none` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| transform | `translateX(3px)` | `matrix(1, 0, 0, 1, 3, 0)` | style attribute |
| transition | `transform .26s cubic-bezier(.3,.7,.2,1),width .26s cubic-bezier(.3,.7,.2,1),background .2s` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |

#### look 3 of 5

`G9-144` · rendered **55×34** · 1 instance look like this

```html
<span class="pb-thumb" style="width: 55px; transform: translateX(63px);"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| width | `55px` | `55px` | style attribute |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| bottom | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| left | `0px` | `0px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| border-radius | `var(--rad-pill)` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| background | `var(--tc,var(--hi))` | `` | .pb-seg[data-tier] .pb-thumb · 2026-09-14-pins2-board/index.html:274 |
| background-color | `` | `rgb(242, 194, 48)` | .pb-seg[data-tier] .pb-thumb · 2026-09-14-pins2-board/index.html:274 |
| background-image | `` | `none` | .pb-seg[data-tier] .pb-thumb · 2026-09-14-pins2-board/index.html:274 |
| box-shadow | `none` | `none` | .pb-seg[data-tier] .pb-thumb · 2026-09-14-pins2-board/index.html:274 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| transform | `translateX(63px)` | `matrix(1, 0, 0, 1, 63, 0)` | style attribute |
| transition | `transform .26s cubic-bezier(.3,.7,.2,1),width .26s cubic-bezier(.3,.7,.2,1),background .2s` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |

#### look 4 of 5

`G9-147` · rendered **0×0** · 1 instance look like this

```html
<span class="pb-thumb"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| width | `0px` | `0px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| bottom | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| left | `0px` | `0px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| border-radius | `var(--rad-pill)` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| background | `var(--tc,var(--hi))` | `` | .pb-seg[data-tier] .pb-thumb · 2026-09-14-pins2-board/index.html:274 |
| background-color | `` | `rgb(242, 194, 48)` | .pb-seg[data-tier] .pb-thumb · 2026-09-14-pins2-board/index.html:274 |
| background-image | `` | `none` | .pb-seg[data-tier] .pb-thumb · 2026-09-14-pins2-board/index.html:274 |
| box-shadow | `none` | `none` | .pb-seg[data-tier] .pb-thumb · 2026-09-14-pins2-board/index.html:274 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| transition | `transform .26s cubic-bezier(.3,.7,.2,1),width .26s cubic-bezier(.3,.7,.2,1),background .2s` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |

#### look 5 of 5

`G9-152` · rendered **103×28** · 1 instance look like this

```html
<span class="pb-thumb" style="width: 103px; transform: translateX(3px);"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| width | `103px` | `103px` | style attribute |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| bottom | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| left | `0px` | `0px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| border-radius | `var(--rad-pill)` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| background | `var(--hi)` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| background-color | `` | `rgb(35, 44, 52)` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| background-image | `` | `none` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| transform | `translateX(3px)` | `matrix(1, 0, 0, 1, 3, 0)` | style attribute |
| transition | `transform .26s cubic-bezier(.3,.7,.2,1),width .26s cubic-bezier(.3,.7,.2,1),background .2s` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |


### `span.pb-div`

inside `.pb-bar` · 1 on screen · **1 look**

#### the one look

`G9-10` · rendered **1×28** · 1 instance look like this · aria-hidden="true"

```html
<span class="pb-div" aria-hidden="true"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| width | `1px` | `1px` | .pb-div · 2026-09-14-pins2-board/index.html:151 |
| height | `28px` | `28px` | .pb-div · 2026-09-14-pins2-board/index.html:151 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0 6px` | `` | .pb-div · 2026-09-14-pins2-board/index.html:151 |
| margin-top | `0px` | `0px` | .pb-div · 2026-09-14-pins2-board/index.html:151 |
| margin-right | `6px` | `6px` | .pb-div · 2026-09-14-pins2-board/index.html:151 |
| margin-bottom | `0px` | `0px` | .pb-div · 2026-09-14-pins2-board/index.html:151 |
| margin-left | `6px` | `6px` | .pb-div · 2026-09-14-pins2-board/index.html:151 |
| background | `var(--rule2)` | `` | .pb-div · 2026-09-14-pins2-board/index.html:151 |
| background-color | `` | `rgb(58, 71, 82)` | .pb-div · 2026-09-14-pins2-board/index.html:151 |
| background-image | `` | `none` | .pb-div · 2026-09-14-pins2-board/index.html:151 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-seg.seg`

inside `.pb-bar` · 3 on screen · **2 looks**

#### look 1 of 2

`G9-11` · rendered **230×42** · 2 instances look like this

```html
<div class="seg pb-seg" data-seg="many"> <span class="pb-thumb" style="width: 105px; transform: translateX(3px);"></span> <button aria-pressed="true" data-v="0">⟨svg.ic⟩Add build</button> <button aria-pressed="false" data-v="1">⟨svg.ic⟩Bulk create</button> </div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-seg.seg · 2026-09-14-pins2-board/index.html:38 |
| position | `relative` | `relative` | .pb-seg.seg · 2026-09-14-pins2-board/index.html:38 |
| gap | `2px` | `` | .seg · 2026-09-14-pins2-board/app.css:710 |
| column-gap | `2px` | `2px` | .seg · 2026-09-14-pins2-board/app.css:710 |
| row-gap | `2px` | `2px` | .seg · 2026-09-14-pins2-board/app.css:710 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `3px` | `` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-top | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-right | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-bottom | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-left | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| border | `1px solid var(--rule)` | `` | .seg · 2026-09-14-pins2-board/app.css:710 |
| border-radius | `var(--rad-pill)` | `` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| background | `var(--sunk)` | `` | .seg · 2026-09-14-pins2-board/app.css:710 |
| background-color | `` | `rgb(11, 15, 18)` | .seg · 2026-09-14-pins2-board/app.css:710 |
| background-image | `` | `none` | .seg · 2026-09-14-pins2-board/app.css:710 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G9-146` · rendered **0×0** · 1 instance look like this

```html
<div class="seg pb-seg" data-seg="rank" data-tier="best"><span class="pb-thumb"></span><button aria-pressed="false" data-t="none">None</button><button aria-pressed="true" data-t="best">Best close</button><button aria-pressed="false" data-t="best">Best mid–long</button><button aria-pressed="false" data-t="top3">Top 3</button><button aria-pressed="false" data-t="top5">Top 5</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `inline-flex` | .pb-seg.seg · 2026-09-14-pins2-board/index.html:38 |
| position | `relative` | `relative` | .pb-seg.seg · 2026-09-14-pins2-board/index.html:38 |
| gap | `2px` | `` | .seg · 2026-09-14-pins2-board/app.css:710 |
| column-gap | `2px` | `2px` | .seg · 2026-09-14-pins2-board/app.css:710 |
| row-gap | `2px` | `2px` | .seg · 2026-09-14-pins2-board/app.css:710 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `3px` | `` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-top | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-right | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-bottom | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-left | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| border | `1px solid var(--rule)` | `` | .seg · 2026-09-14-pins2-board/app.css:710 |
| border-radius | `var(--rad-pill)` | `` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| background | `var(--sunk)` | `` | .seg · 2026-09-14-pins2-board/app.css:710 |
| background-color | `` | `rgb(11, 15, 18)` | .seg · 2026-09-14-pins2-board/app.css:710 |
| background-image | `` | `none` | .seg · 2026-09-14-pins2-board/app.css:710 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-view`

inside `.drawer` · 1 on screen · **1 look**

#### the one look

`G9-15` · rendered **878×1113** · 1 instance look like this

```html
<div class="pb-view" data-view="0"> <div class="dw-b"><div class="bed bform"> <div class="bed-main"> <section class="bf-sec"> <h4 class="bf-h">Build</h4> <div class="bed-g2"> <div class="dwfield"><label for="nb-w">Weapon</label><div class="pb-combo"><input id="nb-w" value="BAL-27" role="combobox" aria-expanded="false" autocomplete="off">⟨svg.ic⟩</div></div> <div class="dwfield"><label>Category</label><select><option>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.dw-b`

inside `.pb-view` · 2 on screen · **2 looks**

#### look 1 of 2

`G9-16` · rendered **878×1044** · 1 instance look like this

```html
<div class="dw-b"><div class="bed bform"> <div class="bed-main"> <section class="bf-sec"> <h4 class="bf-h">Build</h4> <div class="bed-g2"> <div class="dwfield"><label for="nb-w">Weapon</label><div class="pb-combo"><input id="nb-w" value="BAL-27" role="combobox" aria-expanded="false" autocomplete="off">⟨svg.ic⟩</div></div> <div class="dwfield"><label>Category</label><select><option>AR — Assault Rifle</option></select>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| flex | `1 1 auto` | `` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `var(--s4) var(--s5)` | `` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-top | `` | `16px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-right | `` | `24px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-bottom | `` | `16px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-left | `` | `24px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `auto` | `` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| overflow-x | `auto` | `auto` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| overflow-y | `auto` | `auto` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |

#### look 2 of 2

`G9-210` · rendered **0×0** · 1 instance look like this

```html
<div class="dw-b"><div class="pb-bulk"> <div> <div class="pb-edhead"><label for="pm">Builds</label><span>4 builds · 32 lines</span></div> <div class="pb-ed" id="pm" role="textbox" aria-multiline="true" aria-label="Builds" contenteditable="true" spellcheck="false"> <div class="pb-blk" data-o="upd"><span></span><div><span class="pb-l pb-hd">BAL-27 <i>|</i> AR</span><span class="pb-l"><em>Build:</em> Build 2</span><span
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| flex | `1 1 auto` | `` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `var(--s4) var(--s5)` | `` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-top | `` | `16px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-right | `` | `24px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-bottom | `` | `16px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-left | `` | `24px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `auto` | `` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| overflow-x | `auto` | `auto` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| overflow-y | `auto` | `auto` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |


### `div.bed.bform`

inside `.dw-b` · 1 on screen · **1 look**

#### the one look

`G9-17` · rendered **830×1012** · 1 instance look like this

```html
<div class="bed bform"> <div class="bed-main"> <section class="bf-sec"> <h4 class="bf-h">Build</h4> <div class="bed-g2"> <div class="dwfield"><label for="nb-w">Weapon</label><div class="pb-combo"><input id="nb-w" value="BAL-27" role="combobox" aria-expanded="false" autocomplete="off">⟨svg.ic⟩</div></div> <div class="dwfield"><label>Category</label><select><option>AR — Assault Rifle</option></select></div> </div> <div
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .bed · 2026-09-14-pins2-board/app.css:3272 |
| grid-template-columns | `1fr 320px` | `492px 320px` | .pb-stage .dw-b .bed · 2026-09-14-pins2-board/index.html:145 |
| gap | `18px` | `` | .drawer.wide .bed · 2026-09-14-pins2-board/app.css:6788 |
| column-gap | `18px` | `18px` | .drawer.wide .bed · 2026-09-14-pins2-board/app.css:6788 |
| row-gap | `18px` | `18px` | .drawer.wide .bed · 2026-09-14-pins2-board/app.css:6788 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.bed-main`

inside `.bed` · 1 on screen · **1 look**

#### the one look

`G9-18` · rendered **492×1012** · 1 instance look like this

```html
<div class="bed-main"> <section class="bf-sec"> <h4 class="bf-h">Build</h4> <div class="bed-g2"> <div class="dwfield"><label for="nb-w">Weapon</label><div class="pb-combo"><input id="nb-w" value="BAL-27" role="combobox" aria-expanded="false" autocomplete="off">⟨svg.ic⟩</div></div> <div class="dwfield"><label>Category</label><select><option>AR — Assault Rifle</option></select></div> </div> <div class="dwfield" style="
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| min-width | `0px` | `0px` | .bed-main · 2026-09-14-pins2-board/app.css:6311 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `section.bf-sec`

inside `.bed-main` · 5 on screen · **5 looks**

#### look 1 of 5

`G9-19` · rendered **492×190** · 1 instance look like this

```html
<section class="bf-sec"> <h4 class="bf-h">Build</h4> <div class="bed-g2"> <div class="dwfield"><label for="nb-w">Weapon</label><div class="pb-combo"><input id="nb-w" value="BAL-27" role="combobox" aria-expanded="false" autocomplete="off">⟨svg.ic⟩</div></div> <div class="dwfield"><label>Category</label><select><option>AR — Assault Rifle</option></select></div> </div> <div class="dwfield" style="margin-top:16px"><label
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | article, aside, footer, header, hgroup, main, nav, search, section · user-agent:? |
| min-width | `0px` | `0px` | main .panel, main section · 2026-09-14-pins2-board/app.css:659 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-bottom | `0px` | `0px` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| margin-bottom | `26px` | `26px` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| border-bottom | `0` | `` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 5

`G9-34` · rendered **492×71** · 1 instance look like this

```html
<section class="bf-sec" data-only="MP"> <div class="dwfield"><label for="nb-code">Gunsmith code</label> <div class="pb-codefield"><input id="nb-code" value="1C2C4A8A9B" spellcheck="false" autocomplete="off"><button class="pb-copy" aria-label="Copy code">⟨svg.ic⟩</button></div> </div> </section>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | article, aside, footer, header, hgroup, main, nav, search, section · user-agent:? |
| min-width | `0px` | `0px` | main .panel, main section · 2026-09-14-pins2-board/app.css:659 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-bottom | `0px` | `0px` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| margin-bottom | `26px` | `26px` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| border-bottom | `0` | `` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 3 of 5

`G9-40` · rendered **492×283** · 1 instance look like this

```html
<section class="bf-sec" data-only="MP"> <h4 class="bf-h">Attachments <span class="pb-hfill">⟨svg.ic⟩4 of 5 filled from the code</span></h4> <div class="pb-atts"> <div class="pb-att pb-auto"><span class="pb-slot">Muzzle</span><input class="ati" value="Polarfire-S"><button class="pb-rmv" aria-label="Remove Polarfire-S">⟨svg.ic⟩</button></div> <div class="pb-att pb-auto"><span class="pb-slot">Barrel</span><input class="
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | article, aside, footer, header, hgroup, main, nav, search, section · user-agent:? |
| min-width | `0px` | `0px` | main .panel, main section · 2026-09-14-pins2-board/app.css:659 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-bottom | `0px` | `0px` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| margin-bottom | `26px` | `26px` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| border-bottom | `0` | `` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 4 of 5

`G9-131` · rendered **492×134** · 1 instance look like this

```html
<section class="bf-sec"> <h4 class="bf-h">Badges <span class="bf-n" data-chip="">all 6 BAL-27 builds</span></h4> <div class="pb-badges"> <button class="pb-tog" aria-pressed="true"><i>⟨svg.ic⟩</i>META</button> <button class="pb-tog pb-tox" aria-pressed="false"><i>⟨svg.ic⟩</i>TOXIC</button> </div> <div class="pb-rank" data-rank="MP"><span>Tier in AR</span> <div class="seg pb-seg" data-seg="rank" data-tier="best"><span 
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | article, aside, footer, header, hgroup, main, nav, search, section · user-agent:? |
| min-width | `0px` | `0px` | main .panel, main section · 2026-09-14-pins2-board/app.css:659 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-bottom | `0px` | `0px` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| margin-bottom | `26px` | `26px` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| border-bottom | `0` | `` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 5 of 5

`G9-148` · rendered **492×203** · 1 instance look like this

```html
<section class="bf-sec"> <div class="pb-imghead"><h4 class="bf-h">Image</h4> <div class="seg pb-seg pb-small" data-seg="img" data-imgseg=""><span class="pb-thumb" style="width: 103px; transform: translateX(3px);"></span><button aria-pressed="true" data-v="up">Upload or link</button><button aria-pressed="false" data-v="key">Existing key</button></div></div> <div class="pb-imgview" data-imgview="up"> <div class="pb-dro
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | article, aside, footer, header, hgroup, main, nav, search, section · user-agent:? |
| min-width | `0px` | `0px` | main .panel, main section · 2026-09-14-pins2-board/app.css:659 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-bottom | `0px` | `0px` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| margin-bottom | `26px` | `26px` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| border-bottom | `0` | `` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `h4.bf-h`

inside `.bf-sec` · 5 on screen · **3 looks**

#### look 1 of 3

`G9-20` · rendered **492×17** · 3 instances look like this · text “Build”

```html
<h4 class="bf-h">Build</h4>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .bf-h · 2026-09-14-pins2-board/app.css:5174 |
| gap | `10px` | `` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| column-gap | `10px` | `10px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| row-gap | `10px` | `10px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| align-items | `center` | `center` | .bf-h · 2026-09-14-pins2-board/app.css:5174 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0 0 14px` | `` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| margin-top | `0px` | `0px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| margin-right | `0px` | `0px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| margin-bottom | `14px` | `14px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| margin-left | `0px` | `0px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| font | `600 var(--t-md)/1.2 var(--ui)` | `` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| font-size | `` | `14.5px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| font-weight | `` | `600` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| font-style | `` | `normal` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| font-variant-numeric | `` | `normal` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| line-height | `` | `17.4px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| letter-spacing | `-0.005em` | `-0.0725px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |

**::after**

| property | winning declaration | from |
|---|---|---|
| flex | `1` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |
| height | `1px` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |
| margin-left | `6px` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |
| background | `var(--rule2)` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |
| background-color | `` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |
| background-image | `` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |
| content | `""` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |

#### look 2 of 3

`G9-83` · rendered **0×0** · 1 instance look like this

```html
<h4 class="bf-h">Attachments <span class="bf-n">9 of 9</span></h4>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .bf-h · 2026-09-14-pins2-board/app.css:5174 |
| gap | `10px` | `` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| column-gap | `10px` | `10px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| row-gap | `10px` | `10px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| align-items | `center` | `center` | .bf-h · 2026-09-14-pins2-board/app.css:5174 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0 0 14px` | `` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| margin-top | `0px` | `0px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| margin-right | `0px` | `0px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| margin-bottom | `14px` | `14px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| margin-left | `0px` | `0px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| font | `600 var(--t-md)/1.2 var(--ui)` | `` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| font-size | `` | `14.5px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| font-weight | `` | `600` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| font-style | `` | `normal` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| font-variant-numeric | `` | `normal` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| line-height | `` | `17.4px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| letter-spacing | `-0.005em` | `-0.0725px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |

**::after**

| property | winning declaration | from |
|---|---|---|
| flex | `1` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |
| height | `1px` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |
| margin-left | `6px` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |
| background | `var(--rule2)` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |
| background-color | `` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |
| background-image | `` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |
| content | `""` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |

#### look 3 of 3

`G9-132` · rendered **492×22** · 1 instance look like this

```html
<h4 class="bf-h">Badges <span class="bf-n" data-chip="">all 6 BAL-27 builds</span></h4>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .bf-h · 2026-09-14-pins2-board/app.css:5174 |
| gap | `10px` | `` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| column-gap | `10px` | `10px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| row-gap | `10px` | `10px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| align-items | `center` | `center` | .bf-h · 2026-09-14-pins2-board/app.css:5174 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0 0 14px` | `` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| margin-top | `0px` | `0px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| margin-right | `0px` | `0px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| margin-bottom | `14px` | `14px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| margin-left | `0px` | `0px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| font | `600 var(--t-md)/1.2 var(--ui)` | `` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| font-size | `` | `14.5px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| font-weight | `` | `600` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| font-style | `` | `normal` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| font-variant-numeric | `` | `normal` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| line-height | `` | `17.4px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| letter-spacing | `-0.005em` | `-0.0725px` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-stage .bf-h · 2026-09-14-pins2-board/index.html:260 |

**::after**

| property | winning declaration | from |
|---|---|---|
| flex | `1` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |
| height | `1px` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |
| margin-left | `6px` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |
| background | `var(--rule2)` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |
| background-color | `` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |
| background-image | `` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |
| content | `""` | .pb-stage .bf-h::after · 2026-09-14-pins2-board/index.html:261 |


### `div.bed-g2`

inside `.bf-sec` · 1 on screen · **1 look**

#### the one look

`G9-21` · rendered **492×71** · 1 instance look like this

```html
<div class="bed-g2"> <div class="dwfield"><label for="nb-w">Weapon</label><div class="pb-combo"><input id="nb-w" value="BAL-27" role="combobox" aria-expanded="false" autocomplete="off">⟨svg.ic⟩</div></div> <div class="dwfield"><label>Category</label><select><option>AR — Assault Rifle</option></select></div> </div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .bed-g2 · 2026-09-14-pins2-board/app.css:3287 |
| grid-template-columns | `1fr 1fr` | `240px 240px` | .bed-g2 · 2026-09-14-pins2-board/app.css:3287 |
| gap | `12px` | `` | .bed-g2 · 2026-09-14-pins2-board/app.css:3287 |
| column-gap | `12px` | `12px` | .bed-g2 · 2026-09-14-pins2-board/app.css:3287 |
| row-gap | `12px` | `12px` | .bed-g2 · 2026-09-14-pins2-board/app.css:3287 |
| align-items | `end` | `end` | .pb-stage .bed-g2 · 2026-09-14-pins2-board/index.html:35 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.dwfield`

inside `.bed-g2` · 7 on screen · **2 looks**

#### look 1 of 2

`G9-22` · rendered **240×71** · 6 instances look like this

```html
<div class="dwfield"><label for="nb-w">Weapon</label><div class="pb-combo"><input id="nb-w" value="BAL-27" role="combobox" aria-expanded="false" autocomplete="off">⟨svg.ic⟩</div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| gap | `var(--s2)` | `` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| column-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| row-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| flex-direction | `column` | `column` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `0px` | `0px` | .pb-stage .dwfield · 2026-09-14-pins2-board/index.html:34 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G9-171` · rendered **0×0** · 1 instance look like this

```html
<div class="dwfield"><label for="nb-key2">Key</label><input id="nb-key2" value="BAL-27-1"></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| gap | `var(--s2)` | `` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| column-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| row-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| flex-direction | `column` | `column` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `0px` | `0px` | .pb-stage .dwfield · 2026-09-14-pins2-board/index.html:34 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `label`

inside `.dwfield` · 8 on screen · **3 looks**

#### look 1 of 3

`G9-23` · rendered **240×14** · 6 instances look like this · text “Weapon”

```html
<label for="nb-w">Weapon</label>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | label · 2026-09-14-pins2-board/app.css:648 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `5px` | `5px` | label · 2026-09-14-pins2-board/app.css:648 |
| font | `600 var(--t-sm)/1.2 var(--ui)` | `` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| font-size | `` | `12px` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| font-weight | `` | `600` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| font-style | `` | `normal` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| font-variant-numeric | `` | `normal` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| line-height | `` | `14.4px` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| letter-spacing | `0px` | `normal` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| text-transform | `none` | `none` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| cursor | `default` | `default` | label · user-agent:? |

**:hover** — changes nothing on the element itself

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself

#### look 2 of 3

`G9-172` · rendered **0×0** · 1 instance look like this · text “Key”

```html
<label for="nb-key2">Key</label>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | label · 2026-09-14-pins2-board/app.css:648 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `5px` | `5px` | label · 2026-09-14-pins2-board/app.css:648 |
| font | `600 var(--t-sm)/1.2 var(--ui)` | `` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| font-size | `` | `12px` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| font-weight | `` | `600` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| font-style | `` | `normal` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| font-variant-numeric | `` | `normal` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| line-height | `` | `14.4px` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| letter-spacing | `0px` | `normal` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| text-transform | `none` | `none` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .dwfield label · 2026-09-14-pins2-board/app.css:2242 |
| cursor | `default` | `default` | label · user-agent:? |

**:hover** — changes nothing on the element itself

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself

#### look 3 of 3

`G9-214` · rendered **0×0** · 1 instance look like this · text “Builds”

```html
<label for="pm">Builds</label>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | label · 2026-09-14-pins2-board/app.css:648 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `5px` | `5px` | label · 2026-09-14-pins2-board/app.css:648 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .pb-edhead label · 2026-09-14-pins2-board/index.html:186 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-edhead label · 2026-09-14-pins2-board/index.html:186 |
| font-size | `` | `12px` | .pb-edhead label · 2026-09-14-pins2-board/index.html:186 |
| font-weight | `` | `600` | .pb-edhead label · 2026-09-14-pins2-board/index.html:186 |
| font-style | `` | `normal` | .pb-edhead label · 2026-09-14-pins2-board/index.html:186 |
| font-variant-numeric | `` | `normal` | .pb-edhead label · 2026-09-14-pins2-board/index.html:186 |
| line-height | `` | `12px` | .pb-edhead label · 2026-09-14-pins2-board/index.html:186 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-edhead label · 2026-09-14-pins2-board/index.html:186 |
| cursor | `default` | `default` | label · user-agent:? |

**:hover** — changes nothing on the element itself

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself


### `div.pb-combo`

inside `.dwfield` · 1 on screen · **1 look**

#### the one look

`G9-24` · rendered **240×44** · 1 instance look like this

```html
<div class="pb-combo"><input id="nb-w" value="BAL-27" role="combobox" aria-expanded="false" autocomplete="off">⟨svg.ic⟩</div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-combo · 2026-09-14-pins2-board/index.html:153 |
| position | `relative` | `relative` | .pb-combo · 2026-09-14-pins2-board/index.html:153 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-labelf`

inside `.dwfield` · 1 on screen · **1 look**

#### the one look

`G9-30` · rendered **492×44** · 1 instance look like this

```html
<div class="pb-labelf"><span class="pb-bno"><small>BUILD</small><b class="pb-num">6</b></span><input id="nb-label" placeholder="Build 6"></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| grid-template-columns | `auto 1fr` | `85.9688px 406.031px` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| align-items | `stretch` | `stretch` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| min-height | `var(--tap)` | `44px` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-2)` | `` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| background | `var(--sunk)` | `` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| background-image | `` | `none` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| overflow-x | `hidden` | `hidden` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| overflow-y | `hidden` | `hidden` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |


### `span.pb-bno`

inside `.pb-labelf` · 1 on screen · **1 look**

#### the one look

`G9-31` · rendered **86×44** · 1 instance look like this

```html
<span class="pb-bno"><small>BUILD</small><b class="pb-num">6</b></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| gap | `10px` | `` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| column-gap | `10px` | `10px` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| row-gap | `10px` | `10px` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| align-items | `center` | `center` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px 0 14px` | `` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| padding-top | `0px` | `0px` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| padding-right | `16px` | `16px` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| padding-bottom | `0px` | `0px` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| padding-left | `14px` | `14px` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| background | `color-mix(in srgb,var(--realm-c) 12%,var(--raised))` | `` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| background-color | `` | `color(srgb 0.219451 0.166588 0.190745)` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| background-image | `` | `none` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| box-shadow | `inset -1px 0 0 var(--rule2)` | `rgb(58, 71, 82) -1px 0px 0px 0px inset` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `small`

inside `.pb-bno` · 1 on screen · **1 look**

#### the one look

`G9-32` · rendered **34×10** · 1 instance look like this · text “BUILD”

```html
<small>BUILD</small>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-micro)/1 var(--data)` | `` | .pb-bno small · 2026-09-14-pins2-board/index.html:267 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-bno small · 2026-09-14-pins2-board/index.html:267 |
| font-size | `` | `9.5px` | .pb-bno small · 2026-09-14-pins2-board/index.html:267 |
| font-weight | `` | `600` | .pb-bno small · 2026-09-14-pins2-board/index.html:267 |
| font-style | `` | `normal` | .pb-bno small · 2026-09-14-pins2-board/index.html:267 |
| font-variant-numeric | `` | `normal` | .pb-bno small · 2026-09-14-pins2-board/index.html:267 |
| line-height | `` | `9.5px` | .pb-bno small · 2026-09-14-pins2-board/index.html:267 |
| letter-spacing | `0.12em` | `1.14px` | .pb-bno small · 2026-09-14-pins2-board/index.html:267 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-bno small · 2026-09-14-pins2-board/index.html:267 |


### `b.pb-num`

inside `.pb-bno` · 1 on screen · **1 look**

#### the one look

`G9-33` · rendered **12×26** · 1 instance look like this · text “6”

```html
<b class="pb-num">6</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline` | `block` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| align-items | `center` | `center` | .pb-num · 2026-09-14-pins2-board/index.html:157 |
| justify-content | `center` | `center` | .pb-num · 2026-09-14-pins2-board/index.html:157 |
| height | `auto` | `26px` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `0` | `` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| background | `none` | `` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| background-image | `none` | `none` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| box-shadow | `none` | `none` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| font | `700 26px/1 var(--display)` | `` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| font-family | `` | `"Big Shoulders Display", "Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| font-size | `` | `26px` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| font-weight | `` | `700` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| font-style | `` | `normal` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| font-variant-numeric | `` | `normal` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| line-height | `` | `26px` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| letter-spacing | `0.02em` | `0.52px` | .pb-bno b · 2026-09-14-pins2-board/index.html:268 |
| color | `var(--realm-c)` | `rgb(239, 68, 68)` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |

**::before**

| property | winning declaration | from |
|---|---|---|
| margin-right | `3px` | .pb-num::before · 2026-09-14-pins2-board/index.html:158 |
| font-weight | `600` | .pb-num::before · 2026-09-14-pins2-board/index.html:158 |
| color | `var(--ink4)` | .pb-num::before · 2026-09-14-pins2-board/index.html:158 |
| content | `none` | .pb-bno .pb-num::before · 2026-09-14-pins2-board/index.html:305 |


### `div.pb-codefield`

inside `.dwfield` · 1 on screen · **1 look**

#### the one look

`G9-37` · rendered **492×44** · 1 instance look like this

```html
<div class="pb-codefield"><input id="nb-code" value="1C2C4A8A9B" spellcheck="false" autocomplete="off"><button class="pb-copy" aria-label="Copy code">⟨svg.ic⟩</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-codefield · 2026-09-14-pins2-board/index.html:77 |
| position | `relative` | `relative` | .pb-codefield · 2026-09-14-pins2-board/index.html:77 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `button.pb-copy`

inside `.pb-codefield` · 1 on screen · **1 look**

#### the one look

`G9-38` · rendered **36×36** · 1 instance look like this · aria-label="Copy code"

```html
<button class="pb-copy" aria-label="Copy code">⟨svg.ic⟩</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-copy · 2026-09-14-pins2-board/index.html:56 |
| position | `absolute` | `absolute` | .pb-codefield .pb-copy · 2026-09-14-pins2-board/index.html:80 |
| align-items | `center` | `center` | .pb-copy · 2026-09-14-pins2-board/index.html:56 |
| place-items | `center` | `` | .pb-copy · 2026-09-14-pins2-board/index.html:56 |
| width | `36px` | `36px` | .pb-codefield .pb-copy · 2026-09-14-pins2-board/index.html:80 |
| height | `36px` | `36px` | .pb-codefield .pb-copy · 2026-09-14-pins2-board/index.html:80 |
| min-height | `var(--ctl-min, 32px)` | `0px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `var(--ctl-pad, 7px 10px)` | `` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-top | `` | `1px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-right | `` | `6px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-bottom | `` | `1px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-left | `` | `6px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| margin | `0` | `` | .pb-codefield .pb-copy · 2026-09-14-pins2-board/index.html:80 |
| margin-top | `0px` | `0px` | .pb-codefield .pb-copy · 2026-09-14-pins2-board/index.html:80 |
| margin-right | `0px` | `0px` | .pb-codefield .pb-copy · 2026-09-14-pins2-board/index.html:80 |
| margin-bottom | `0px` | `0px` | .pb-codefield .pb-copy · 2026-09-14-pins2-board/index.html:80 |
| margin-left | `0px` | `0px` | .pb-codefield .pb-copy · 2026-09-14-pins2-board/index.html:80 |
| top | `4px` | `4px` | .pb-codefield .pb-copy · 2026-09-14-pins2-board/index.html:80 |
| right | `4px` | `4px` | .pb-codefield .pb-copy · 2026-09-14-pins2-board/index.html:80 |
| border | `0` | `` | .pb-codefield .pb-copy · 2026-09-14-pins2-board/index.html:80 |
| border-radius | `var(--rad-2)` | `` | .pb-copy · 2026-09-14-pins2-board/index.html:56 |
| background | `var(--raised)` | `` | .pb-copy · 2026-09-14-pins2-board/index.html:56 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-copy · 2026-09-14-pins2-board/index.html:56 |
| background-image | `` | `none` | .pb-copy · 2026-09-14-pins2-board/index.html:56 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-copy · 2026-09-14-pins2-board/index.html:56 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `inherit` | `13px` | button · 2026-09-14-pins2-board/app.css:600 |
| font-weight | `inherit` | `400` | button · 2026-09-14-pins2-board/app.css:600 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `19.5px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-copy · 2026-09-14-pins2-board/index.html:56 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | .pb-codefield .pb-copy · 2026-09-14-pins2-board/index.html:80 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `rgb(31, 39, 46)` | `rgb(42, 52, 61)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `span.pb-hfill`

inside `.bf-h` · 1 on screen · **1 look**

#### the one look

`G9-42` · rendered **168×13** · 1 instance look like this

```html
<span class="pb-hfill">⟨svg.ic⟩4 of 5 filled from the code</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `500 var(--t-sm)/1 var(--ui)` | `` | .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| font-size | `` | `12px` | .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| font-weight | `` | `500` | .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| font-style | `` | `normal` | .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| font-variant-numeric | `` | `normal` | .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| line-height | `` | `12px` | .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| letter-spacing | `0px` | `normal` | .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-hfill · 2026-09-14-pins2-board/index.html:270 |


### `div.pb-atts`

inside `.bf-sec` · 2 on screen · **2 looks**

#### look 1 of 2

`G9-44` · rendered **492×252** · 1 instance look like this

```html
<div class="pb-atts"> <div class="pb-att pb-auto"><span class="pb-slot">Muzzle</span><input class="ati" value="Polarfire-S"><button class="pb-rmv" aria-label="Remove Polarfire-S">⟨svg.ic⟩</button></div> <div class="pb-att pb-auto"><span class="pb-slot">Barrel</span><input class="ati" value="Crown-H3 Barrel"><button class="pb-rmv" aria-label="Remove Crown-H3 Barrel">⟨svg.ic⟩</button></div> <div class="pb-att pb-auto">
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-atts · 2026-09-14-pins2-board/index.html:160 |
| gap | `8px` | `` | .pb-atts · 2026-09-14-pins2-board/index.html:160 |
| column-gap | `8px` | `8px` | .pb-atts · 2026-09-14-pins2-board/index.html:160 |
| row-gap | `8px` | `8px` | .pb-atts · 2026-09-14-pins2-board/index.html:160 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `12px` | `12px` | .pb-atts · 2026-09-14-pins2-board/index.html:160 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G9-85` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-atts"> <div class="pb-att"><span class="pb-slot">Optic</span><input class="ati" value="Classic Red Dot Sight"><button class="pb-rmv" aria-label="Remove Classic Red Dot Sight">⟨svg.ic⟩</button></div> <div class="pb-att"><span class="pb-slot">Muzzle</span><input class="ati" value="Monolithic Suppressor"><button class="pb-rmv" aria-label="Remove Monolithic Suppressor">⟨svg.ic⟩</button></div> <div class="p
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-atts · 2026-09-14-pins2-board/index.html:160 |
| gap | `8px` | `` | .pb-atts · 2026-09-14-pins2-board/index.html:160 |
| column-gap | `8px` | `8px` | .pb-atts · 2026-09-14-pins2-board/index.html:160 |
| row-gap | `8px` | `8px` | .pb-atts · 2026-09-14-pins2-board/index.html:160 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `12px` | `12px` | .pb-atts · 2026-09-14-pins2-board/index.html:160 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-att.pb-auto`

inside `.pb-atts` · 4 on screen · **1 look**

#### the one look

`G9-45` · rendered **492×44** · 4 instances look like this

```html
<div class="pb-att pb-auto"><span class="pb-slot">Muzzle</span><input class="ati" value="Polarfire-S"><button class="pb-rmv" aria-label="Remove Polarfire-S">⟨svg.ic⟩</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| grid-template-columns | `96px 1fr 44px` | `96px 336px 44px` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| gap | `8px` | `` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| column-gap | `8px` | `8px` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| row-gap | `8px` | `8px` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| align-items | `center` | `center` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-slot`

inside `.pb-att` · 14 on screen · **1 look**

#### the one look

`G9-46` · rendered **96×44** · 14 instances look like this · text “Muzzle”

```html
<span class="pb-slot">Muzzle</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-slot · 2026-09-14-pins2-board/index.html:162 |
| align-items | `center` | `center` | .pb-slot · 2026-09-14-pins2-board/index.html:162 |
| height | `var(--tap)` | `44px` | .pb-slot · 2026-09-14-pins2-board/index.html:162 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 2px` | `` | .pb-slot · 2026-09-14-pins2-board/index.html:162 |
| padding-top | `0px` | `0px` | .pb-slot · 2026-09-14-pins2-board/index.html:162 |
| padding-right | `2px` | `2px` | .pb-slot · 2026-09-14-pins2-board/index.html:162 |
| padding-bottom | `0px` | `0px` | .pb-slot · 2026-09-14-pins2-board/index.html:162 |
| padding-left | `2px` | `2px` | .pb-slot · 2026-09-14-pins2-board/index.html:162 |
| font | `500 var(--t-sm)/1 var(--ui)` | `` | .pb-slot · 2026-09-14-pins2-board/index.html:162 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-slot · 2026-09-14-pins2-board/index.html:162 |
| font-size | `` | `12px` | .pb-slot · 2026-09-14-pins2-board/index.html:162 |
| font-weight | `` | `500` | .pb-slot · 2026-09-14-pins2-board/index.html:162 |
| font-style | `` | `normal` | .pb-slot · 2026-09-14-pins2-board/index.html:162 |
| font-variant-numeric | `` | `normal` | .pb-slot · 2026-09-14-pins2-board/index.html:162 |
| line-height | `` | `12px` | .pb-slot · 2026-09-14-pins2-board/index.html:162 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-slot · 2026-09-14-pins2-board/index.html:162 |

**::before**

| property | winning declaration | from |
|---|---|---|
| flex | `none` | .pb-att.pb-auto .pb-slot::before · 2026-09-14-pins2-board/index.html:272 |
| width | `6px` | .pb-att.pb-auto .pb-slot::before · 2026-09-14-pins2-board/index.html:272 |
| height | `6px` | .pb-att.pb-auto .pb-slot::before · 2026-09-14-pins2-board/index.html:272 |
| margin-right | `8px` | .pb-att.pb-auto .pb-slot::before · 2026-09-14-pins2-board/index.html:272 |
| border-radius | `var(--rad-round)` | .pb-att.pb-auto .pb-slot::before · 2026-09-14-pins2-board/index.html:272 |
| background | `var(--patch)` | .pb-att.pb-auto .pb-slot::before · 2026-09-14-pins2-board/index.html:272 |
| background-color | `` | .pb-att.pb-auto .pb-slot::before · 2026-09-14-pins2-board/index.html:272 |
| background-image | `` | .pb-att.pb-auto .pb-slot::before · 2026-09-14-pins2-board/index.html:272 |
| content | `""` | .pb-att.pb-auto .pb-slot::before · 2026-09-14-pins2-board/index.html:272 |


### `input.ati`

inside `.pb-att` · 13 on screen · **2 looks**

#### look 1 of 2

`G9-47` · rendered **336×44** · 4 instances look like this

```html
<input class="ati" value="Polarfire-S">
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | input, textarea, select, button · user-agent:? |
| flex | `1` | `` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| width | `100%` | `336px` | .pb-att .ati · 2026-09-14-pins2-board/index.html:164 |
| min-width | `0px` | `0px` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| min-height | `var(--tap)` | `44px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `8px 10px` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-top | `8px` | `8px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-right | `10px` | `10px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-bottom | `8px` | `8px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-left | `var(--ctl-pl,10px)` | `10px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]) · 2026-09-14-pins2-board/app.css:633 |
| border | `1px solid var(--rule2)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| border-radius | `var(--rad-2)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| background | `var(--sunk)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| background-color | `` | `rgb(11, 15, 18)` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| background-image | `` | `none` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| font | `500 var(--t-base)/1 var(--ui)` | `` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| font-size | `` | `13px` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| font-weight | `500` | `500` | .bform input, .bform textarea, .bform select · 2026-09-14-pins2-board/app.css:5192 |
| font-style | `` | `normal` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| font-variant-numeric | `` | `normal` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| line-height | `` | `13px` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `start` | `start` | input, textarea, select, button · user-agent:? |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .bform input, .bform textarea, .bform select · 2026-09-14-pins2-board/app.css:5192 |
| overflow-x | `clip !important !important` | `clip` | input:not([type="range" i], [type="checkbox" i], [type="radio" i]) · user-agent:? |
| overflow-y | `clip !important !important` | `clip` | input:not([type="range" i], [type="checkbox" i], [type="radio" i]) · user-agent:? |
| cursor | `text` | `text` | input · user-agent:? |

**:hover** — changes nothing on the element itself

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself

#### look 2 of 2

`G9-88` · rendered **0×0** · 9 instances look like this

```html
<input class="ati" value="Classic Red Dot Sight">
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | input, textarea, select, button · user-agent:? |
| flex | `1` | `` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| width | `100%` | `100%` | .pb-att .ati · 2026-09-14-pins2-board/index.html:164 |
| min-width | `0px` | `0px` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| min-height | `var(--tap)` | `44px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `8px 10px` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-top | `8px` | `8px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-right | `10px` | `10px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-bottom | `8px` | `8px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-left | `var(--ctl-pl,10px)` | `10px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]) · 2026-09-14-pins2-board/app.css:633 |
| border | `1px solid var(--rule2)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| border-radius | `var(--rad-2)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| background | `var(--sunk)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| background-color | `` | `rgb(11, 15, 18)` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| background-image | `` | `none` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| font | `500 var(--t-base)/1 var(--ui)` | `` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| font-size | `` | `13px` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| font-weight | `500` | `500` | .bform input, .bform textarea, .bform select · 2026-09-14-pins2-board/app.css:5192 |
| font-style | `` | `normal` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| font-variant-numeric | `` | `normal` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| line-height | `` | `13px` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `start` | `start` | input, textarea, select, button · user-agent:? |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .bform input, .bform textarea, .bform select · 2026-09-14-pins2-board/app.css:5192 |
| overflow-x | `clip !important !important` | `clip` | input:not([type="range" i], [type="checkbox" i], [type="radio" i]) · user-agent:? |
| overflow-y | `clip !important !important` | `clip` | input:not([type="range" i], [type="checkbox" i], [type="radio" i]) · user-agent:? |
| cursor | `text` | `text` | input · user-agent:? |

**:hover** — changes nothing on the element itself

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself


### `button.pb-rmv`

inside `.pb-att` · 13 on screen · **1 look**

#### the one look

`G9-48` · rendered **44×44** · 13 instances look like this · aria-label="Remove Polarfire-S"

```html
<button class="pb-rmv" aria-label="Remove Polarfire-S">⟨svg.ic⟩</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-rmv · 2026-09-14-pins2-board/index.html:165 |
| align-items | `center` | `center` | .pb-rmv · 2026-09-14-pins2-board/index.html:165 |
| place-items | `center` | `` | .pb-rmv · 2026-09-14-pins2-board/index.html:165 |
| width | `var(--tap)` | `44px` | .pb-rmv · 2026-09-14-pins2-board/index.html:165 |
| height | `var(--tap)` | `44px` | .pb-rmv · 2026-09-14-pins2-board/index.html:165 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `var(--ctl-pad, 7px 10px)` | `` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-top | `` | `1px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-right | `` | `6px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-bottom | `` | `1px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-left | `` | `6px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| border | `0` | `` | .pb-rmv · 2026-09-14-pins2-board/index.html:165 |
| border-radius | `var(--rad-2)` | `` | .pb-rmv · 2026-09-14-pins2-board/index.html:165 |
| background | `none` | `` | .pb-rmv · 2026-09-14-pins2-board/index.html:165 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-rmv · 2026-09-14-pins2-board/index.html:165 |
| background-image | `none` | `none` | .pb-rmv · 2026-09-14-pins2-board/index.html:165 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `inherit` | `13px` | button · 2026-09-14-pins2-board/app.css:600 |
| font-weight | `inherit` | `400` | button · 2026-09-14-pins2-board/app.css:600 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `19.5px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-rmv · 2026-09-14-pins2-board/index.html:165 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | .pb-rmv · 2026-09-14-pins2-board/index.html:165 |

**:hover** — changes; parts inside it respond (table below)

| property | at rest | hover |
|---|---|---|
| background-color | `rgba(0, 0, 0, 0)` | `rgb(42, 52, 61)` |
| color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |

| part inside | property | at rest | hover |
|---|---|---|---|
| ::before | color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| ::before | border-color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| ::before | outline-color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| ::after | color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| ::after | border-color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| ::after | outline-color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| svg.ic | color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| svg.ic | border-color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| svg.ic | outline-color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| svg.ic | stroke | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| use | color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| use | border-color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| use | outline-color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| use | stroke | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `div.pb-att`

inside `.pb-atts` · 10 on screen · **2 looks**

#### look 1 of 2

`G9-60` · rendered **492×44** · 1 instance look like this

```html
<div class="pb-att"><span class="pb-slot">Rear grip</span> <div class="pb-ac"><input class="ati" value="grip" role="combobox" aria-expanded="true" aria-controls="nb-menu" autocomplete="off"> <ul class="pb-menu" id="nb-menu" role="listbox"> <li role="option" aria-selected="true">⟨svg.ic⟩<span>Highground <mark>Grip</mark></span></li> <li role="option"><span></span><span>Tidal Tac <mark>Grip</mark></span></li> <li role=
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| grid-template-columns | `96px 1fr 44px` | `96px 336px 44px` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| gap | `8px` | `` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| column-gap | `8px` | `8px` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| row-gap | `8px` | `8px` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| align-items | `center` | `center` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G9-86` · rendered **0×0** · 9 instances look like this

```html
<div class="pb-att"><span class="pb-slot">Optic</span><input class="ati" value="Classic Red Dot Sight"><button class="pb-rmv" aria-label="Remove Classic Red Dot Sight">⟨svg.ic⟩</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| grid-template-columns | `96px 1fr 44px` | `96px 1fr 44px` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| gap | `8px` | `` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| column-gap | `8px` | `8px` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| row-gap | `8px` | `8px` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| align-items | `center` | `center` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-ac`

inside `.pb-att` · 1 on screen · **1 look**

#### the one look

`G9-62` · rendered **336×44** · 1 instance look like this

```html
<div class="pb-ac"><input class="ati" value="grip" role="combobox" aria-expanded="true" aria-controls="nb-menu" autocomplete="off"> <ul class="pb-menu" id="nb-menu" role="listbox"> <li role="option" aria-selected="true">⟨svg.ic⟩<span>Highground <mark>Grip</mark></span></li> <li role="option"><span></span><span>Tidal Tac <mark>Grip</mark></span></li> <li role="option"><span></span><span>Granulated <mark>Grip</mark> Ta
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .pb-ac · 2026-09-14-pins2-board/index.html:167 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| z-index | `4` | `4` | .pb-ac · 2026-09-14-pins2-board/index.html:167 |


### `input.ati[role=combobox]`

inside `.pb-ac` · 1 on screen · **1 look**

#### the one look

`G9-63` · rendered **336×44** · 1 instance look like this · aria-expanded="true" role="combobox"

```html
<input class="ati" value="grip" role="combobox" aria-expanded="true" aria-controls="nb-menu" autocomplete="off">
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `inline-block` | input, textarea, select, button · user-agent:? |
| flex | `1` | `` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| width | `100%` | `336px` | .pb-att .ati · 2026-09-14-pins2-board/index.html:164 |
| min-width | `0px` | `0px` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| min-height | `var(--tap)` | `44px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `8px 10px` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-top | `8px` | `8px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-right | `10px` | `10px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-bottom | `8px` | `8px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-left | `var(--ctl-pl,10px)` | `10px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]) · 2026-09-14-pins2-board/app.css:633 |
| border | `1px solid var(--rule2)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| border-radius | `var(--rad-2)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| outline | `2px solid var(--patch)` | `` | .pb-ac .ati · 2026-09-14-pins2-board/index.html:168 |
| outline-offset | `1px` | `1px` | .pb-ac .ati · 2026-09-14-pins2-board/index.html:168 |
| background | `var(--sunk)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| background-color | `` | `rgb(11, 15, 18)` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| background-image | `` | `none` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| font | `500 var(--t-base)/1 var(--ui)` | `` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| font-size | `` | `13px` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| font-weight | `500` | `500` | .bform input, .bform textarea, .bform select · 2026-09-14-pins2-board/app.css:5192 |
| font-style | `` | `normal` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| font-variant-numeric | `` | `normal` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| line-height | `` | `13px` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `start` | `start` | input, textarea, select, button · user-agent:? |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .bform input, .bform textarea, .bform select · 2026-09-14-pins2-board/app.css:5192 |
| overflow-x | `clip !important !important` | `clip` | input:not([type="range" i], [type="checkbox" i], [type="radio" i]) · user-agent:? |
| overflow-y | `clip !important !important` | `clip` | input:not([type="range" i], [type="checkbox" i], [type="radio" i]) · user-agent:? |
| cursor | `text` | `text` | input · user-agent:? |

**:hover** — changes nothing on the element itself

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself


### `ul.pb-menu[role=listbox]`

inside `.pb-ac` · 1 on screen · **1 look**

#### the one look

`G9-64` · rendered **388×144** · 1 instance look like this · role="listbox"

```html
<ul class="pb-menu" id="nb-menu" role="listbox"> <li role="option" aria-selected="true">⟨svg.ic⟩<span>Highground <mark>Grip</mark></span></li> <li role="option"><span></span><span>Tidal Tac <mark>Grip</mark></span></li> <li role="option"><span></span><span>Granulated <mark>Grip</mark> Tape</span></li> </ul>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | ul, menu, dir · user-agent:? |
| position | `absolute` | `absolute` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `6px` | `` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| padding-top | `6px` | `6px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| padding-right | `6px` | `6px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| padding-bottom | `6px` | `6px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| padding-left | `6px` | `6px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| margin | `0` | `` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| margin-top | `0px` | `0px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| margin-right | `0px` | `0px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| margin-bottom | `0px` | `0px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| margin-left | `0px` | `0px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| top | `calc(100% + 6px)` | `50px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| right | `-52px` | `-52px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| left | `0px` | `0px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| border-radius | `var(--rad-2)` | `` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| background | `var(--raised)` | `` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| background-image | `` | `none` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| box-shadow | `inset 0 0 0 1px var(--rule2),0 24px 48px -12px rgba(0,0,0,.8)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.8) 0px 24px 48px -12px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `li[role=option]`

inside `.pb-menu` · 3 on screen · **2 looks**

#### look 1 of 2

`G9-65` · rendered **376×44** · 1 instance look like this · aria-selected="true" role="option"

```html
<li role="option" aria-selected="true">⟨svg.ic⟩<span>Highground <mark>Grip</mark></span></li>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| grid-template-columns | `18px 1fr` | `18px 328px` | .pb-menu li · 2026-09-14-pins2-board/index.html:273 |
| gap | `10px` | `` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| column-gap | `10px` | `10px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| row-gap | `10px` | `10px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| align-items | `center` | `center` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| min-height | `var(--tap)` | `44px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 12px 0 8px` | `` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| padding-top | `0px` | `0px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| padding-right | `12px` | `12px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| padding-bottom | `0px` | `0px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| padding-left | `8px` | `8px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| border-radius | `var(--rad-1)` | `` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| background | `var(--hi)` | `` | .pb-menu li[aria-selected="true"] · 2026-09-14-pins2-board/index.html:171 |
| background-color | `` | `rgb(35, 44, 52)` | .pb-menu li[aria-selected="true"] · 2026-09-14-pins2-board/index.html:171 |
| background-image | `` | `none` | .pb-menu li[aria-selected="true"] · 2026-09-14-pins2-board/index.html:171 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-base)` | `13px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |

**:hover** — changes nothing on the element itself

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself

#### look 2 of 2

`G9-69` · rendered **376×44** · 2 instances look like this · role="option"

```html
<li role="option"><span></span><span>Tidal Tac <mark>Grip</mark></span></li>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| grid-template-columns | `18px 1fr` | `18px 328px` | .pb-menu li · 2026-09-14-pins2-board/index.html:273 |
| gap | `10px` | `` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| column-gap | `10px` | `10px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| row-gap | `10px` | `10px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| align-items | `center` | `center` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| min-height | `var(--tap)` | `44px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 12px 0 8px` | `` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| padding-top | `0px` | `0px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| padding-right | `12px` | `12px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| padding-bottom | `0px` | `0px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| padding-left | `8px` | `8px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| border-radius | `var(--rad-1)` | `` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-base)` | `13px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |

**:hover** — changes nothing on the element itself

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself


### `span`

inside `.—` · 31 on screen · **11 looks**

#### look 1 of 11

`G9-67` · rendered **328×20** · 4 instances look like this

```html
<span>Highground <mark>Grip</mark></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · .pb-menu li · 2026-09-14-pins2-board/index.html:170 |

#### look 2 of 11

`G9-70` · rendered **18×0** · 3 instances look like this

```html
<span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · .pb-menu li · 2026-09-14-pins2-board/index.html:170 |

#### look 3 of 11

`G9-142` · rendered **84×18** · 1 instance look like this · text “Tier in AR”

```html
<span>Tier in AR</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| min-width | `84px` | `84px` | .pb-rank > span · 2026-09-14-pins2-board/index.html:181 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | .pb-rank > span · 2026-09-14-pins2-board/index.html:181 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-rank > span · 2026-09-14-pins2-board/index.html:181 |

#### look 4 of 11

`G9-145` · rendered **0×0** · 1 instance look like this · text “Range tier”

```html
<span>Range tier</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `inline` | initial |
| min-width | `84px` | `84px` | .pb-rank > span · 2026-09-14-pins2-board/index.html:181 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | .pb-rank > span · 2026-09-14-pins2-board/index.html:181 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-rank > span · 2026-09-14-pins2-board/index.html:181 |

#### look 5 of 11

`G9-179` · rendered **38×16** · 2 instances look like this · text “META”

```html
<span>META</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `3px 6px` | `` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| padding-top | `3px` | `3px` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| padding-right | `6px` | `6px` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| padding-bottom | `3px` | `3px` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| padding-left | `6px` | `6px` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| border-radius | `var(--rad-1)` | `` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| background | `var(--dc-sunk)` | `` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| background-color | `` | `rgb(30, 31, 34)` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| background-image | `` | `none` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| font | `700 var(--t-micro)/1 var(--data)` | `` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| font-size | `` | `9.5px` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| font-weight | `` | `700` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| font-style | `` | `normal` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| font-variant-numeric | `` | `normal` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| line-height | `` | `9.5px` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| letter-spacing | `0.08em` | `0.76px` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| color | `var(--dc-mute)` | `rgb(181, 186, 193)` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |

#### look 6 of 11

`G9-192` · rendered **0×0** · 1 instance look like this · text “META”

```html
<span>META</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `3px 6px` | `` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| padding-top | `3px` | `3px` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| padding-right | `6px` | `6px` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| padding-bottom | `3px` | `3px` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| padding-left | `6px` | `6px` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| border-radius | `var(--rad-1)` | `` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| background | `var(--dc-sunk)` | `` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| background-color | `` | `rgb(30, 31, 34)` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| background-image | `` | `none` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| font | `700 var(--t-micro)/1 var(--data)` | `` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| font-size | `` | `9.5px` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| font-weight | `` | `700` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| font-style | `` | `normal` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| font-variant-numeric | `` | `normal` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| line-height | `` | `9.5px` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| letter-spacing | `0.08em` | `0.76px` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |
| color | `var(--dc-mute)` | `rgb(181, 186, 193)` | .lc-badges span · 2026-09-14-pins2-board/app.css:3244 |

*5 further looks are the same component in other data hues (a per-row `--c` / `--m` / `--sl`); they differ in colour only.*


### `mark`

inside `.—` · 3 on screen · **1 look**

#### the one look

`G9-68` · rendered **25×17** · 3 instances look like this · text “Grip”

```html
<mark>Grip</mark>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `inline` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| background | `none` | `` | .pb-menu mark · 2026-09-14-pins2-board/index.html:173 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-menu mark · 2026-09-14-pins2-board/index.html:173 |
| background-image | `none` | `none` | .pb-menu mark · 2026-09-14-pins2-board/index.html:173 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| font-weight | `600` | `600` | .pb-menu mark · 2026-09-14-pins2-board/index.html:173 |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--patch)` | `rgb(242, 194, 48)` | .pb-menu mark · 2026-09-14-pins2-board/index.html:173 |


### `span.bf-n`

inside `.bf-h` · 2 on screen · **2 looks**

#### look 1 of 2

`G9-84` · rendered **0×0** · 1 instance look like this · text “9 of 9”

```html
<span class="bf-n">9 of 9</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `4px 8px` | `` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| padding-top | `4px` | `4px` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| padding-right | `8px` | `8px` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| padding-bottom | `4px` | `4px` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| padding-left | `8px` | `8px` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| border | `1px solid var(--rule2)` | `` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| border-radius | `var(--rad-pill)` | `` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| font | `500 var(--t-xs)/1 var(--data)` | `` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| font-size | `var(--t-sm)` | `12px` | .bf-n · 2026-09-14-pins2-board/app.css:6799 |
| font-weight | `` | `500` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| font-style | `` | `normal` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| font-variant-numeric | `` | `normal` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| line-height | `` | `12px` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| letter-spacing | `0.08em` | `0.96px` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |

#### look 2 of 2

`G9-133` · rendered **173×22** · 1 instance look like this · text “all 6 BAL-27 builds”

```html
<span class="bf-n" data-chip="">all 6 BAL-27 builds</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `4px 8px` | `` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| padding-top | `4px` | `4px` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| padding-right | `8px` | `8px` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| padding-bottom | `4px` | `4px` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| padding-left | `8px` | `8px` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| border | `1px solid var(--rule2)` | `` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| border-radius | `var(--rad-pill)` | `` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| font | `500 var(--t-xs)/1 var(--data)` | `` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| font-size | `var(--t-sm)` | `12px` | .bf-n · 2026-09-14-pins2-board/app.css:6799 |
| font-weight | `` | `500` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| font-style | `` | `normal` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| font-variant-numeric | `` | `normal` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| line-height | `` | `12px` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| letter-spacing | `0.08em` | `0.96px` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .bf-n · 2026-09-14-pins2-board/app.css:5175 |


### `div.pb-badges`

inside `.bf-sec` · 1 on screen · **1 look**

#### the one look

`G9-134` · rendered **492×44** · 1 instance look like this

```html
<div class="pb-badges"> <button class="pb-tog" aria-pressed="true"><i>⟨svg.ic⟩</i>META</button> <button class="pb-tog pb-tox" aria-pressed="false"><i>⟨svg.ic⟩</i>TOXIC</button> </div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-badges · 2026-09-14-pins2-board/index.html:59 |
| gap | `8px` | `` | .pb-badges · 2026-09-14-pins2-board/index.html:59 |
| column-gap | `8px` | `8px` | .pb-badges · 2026-09-14-pins2-board/index.html:59 |
| row-gap | `8px` | `8px` | .pb-badges · 2026-09-14-pins2-board/index.html:59 |
| align-items | `center` | `center` | .pb-badges · 2026-09-14-pins2-board/index.html:59 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `12px` | `12px` | .pb-badges · 2026-09-14-pins2-board/index.html:59 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `button.pb-tog`

inside `.pb-badges` · 1 on screen · **1 look**

#### the one look

`G9-135` · rendered **87×44** · 1 instance look like this · aria-pressed="true"

```html
<button class="pb-tog" aria-pressed="true"><i>⟨svg.ic⟩</i>META</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| gap | `10px` | `` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| column-gap | `10px` | `10px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| row-gap | `10px` | `10px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| align-items | `center` | `center` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| height | `var(--tap)` | `44px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `0 16px 0 12px` | `` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| padding-top | `0px` | `0px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| padding-right | `16px` | `16px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| padding-bottom | `0px` | `0px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| padding-left | `12px` | `12px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| border | `0` | `` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| border-radius | `var(--rad-2)` | `` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| background | `color-mix(in srgb,var(--b) 11%,var(--sunk))` | `` | .pb-tog[aria-pressed="true"] · 2026-09-14-pins2-board/index.html:64 |
| background-color | `` | `color(srgb 0.142784 0.136039 0.0835294)` | .pb-tog[aria-pressed="true"] · 2026-09-14-pins2-board/index.html:64 |
| background-image | `` | `none` | .pb-tog[aria-pressed="true"] · 2026-09-14-pins2-board/index.html:64 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--b) 50%,transparent)` | `color(srgb 0.94902 0.760784 0.188235 / 0.5) 0px 0px 0px 1px inset` | .pb-tog[aria-pressed="true"] · 2026-09-14-pins2-board/index.html:64 |
| font | `700 var(--t-sm)/1 var(--data)` | `` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| font-size | `` | `12px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| font-weight | `` | `700` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| font-style | `` | `normal` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| font-variant-numeric | `` | `normal` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| line-height | `` | `12px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| letter-spacing | `0.08em` | `0.96px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--b)` | `rgb(242, 194, 48)` | .pb-tog[aria-pressed="true"] · 2026-09-14-pins2-board/index.html:64 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `color(srgb 0.142784 0.136039 0.0835294)` | `rgb(42, 52, 61)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `i`

inside `.pb-tog` · 5 on screen · **3 looks**

#### look 1 of 3

`G9-136` · rendered **16×16** · 1 instance look like this

```html
<i>⟨svg.ic⟩</i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-tog i · 2026-09-14-pins2-board/index.html:62 |
| align-items | `center` | `center` | .pb-tog i · 2026-09-14-pins2-board/index.html:62 |
| place-items | `center` | `` | .pb-tog i · 2026-09-14-pins2-board/index.html:62 |
| width | `16px` | `16px` | .pb-tog i · 2026-09-14-pins2-board/index.html:62 |
| height | `16px` | `16px` | .pb-tog i · 2026-09-14-pins2-board/index.html:62 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1)` | `` | .pb-tog i · 2026-09-14-pins2-board/index.html:62 |
| background | `var(--b)` | `` | .pb-tog[aria-pressed="true"] i · 2026-09-14-pins2-board/index.html:65 |
| background-color | `` | `rgb(242, 194, 48)` | .pb-tog[aria-pressed="true"] i · 2026-09-14-pins2-board/index.html:65 |
| background-image | `` | `none` | .pb-tog[aria-pressed="true"] i · 2026-09-14-pins2-board/index.html:65 |
| box-shadow | `none` | `none` | .pb-tog[aria-pressed="true"] i · 2026-09-14-pins2-board/index.html:65 |
| font | ↑ `700 var(--t-sm)/1 var(--data)` | `` | inherited · .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| font-size | ↑ `` | `12px` | inherited · .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| font-weight | ↑ `` | `700` | inherited · .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| line-height | ↑ `` | `12px` | inherited · .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| letter-spacing | ↑ `0.08em` | `0.96px` | inherited · .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--on-accent)` | `rgb(7, 9, 10)` | .pb-tog[aria-pressed="true"] i · 2026-09-14-pins2-board/index.html:65 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-tog · 2026-09-14-pins2-board/index.html:60 |

#### look 2 of 3

`G9-139` · rendered **16×16** · 1 instance look like this

```html
<i>⟨svg.ic⟩</i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-tog i · 2026-09-14-pins2-board/index.html:62 |
| align-items | `center` | `center` | .pb-tog i · 2026-09-14-pins2-board/index.html:62 |
| place-items | `center` | `` | .pb-tog i · 2026-09-14-pins2-board/index.html:62 |
| width | `16px` | `16px` | .pb-tog i · 2026-09-14-pins2-board/index.html:62 |
| height | `16px` | `16px` | .pb-tog i · 2026-09-14-pins2-board/index.html:62 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1)` | `` | .pb-tog i · 2026-09-14-pins2-board/index.html:62 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-tog i · 2026-09-14-pins2-board/index.html:62 |
| font | ↑ `700 var(--t-sm)/1 var(--data)` | `` | inherited · .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| font-size | ↑ `` | `12px` | inherited · .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| font-weight | ↑ `` | `700` | inherited · .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| line-height | ↑ `` | `12px` | inherited · .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| letter-spacing | ↑ `0.08em` | `0.96px` | inherited · .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-tog · 2026-09-14-pins2-board/index.html:60 |

#### look 3 of 3

`G9-221` · rendered **0×0** · 3 instances look like this · text “\|”

```html
<i>|</i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `inline` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `700` | `700` | inherited · .pb-l.pb-hd · 2026-09-14-pins2-board/index.html:196 |
| font-style | `normal` | `normal` | .pb-l i · 2026-09-14-pins2-board/index.html:197 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| white-space | ↑ `pre` | `` | inherited · .pb-l · 2026-09-14-pins2-board/index.html:194 |
| color | `var(--ink4)` | `rgb(92, 106, 117)` | .pb-l i · 2026-09-14-pins2-board/index.html:197 |


### `button.pb-tog.pb-tox`

inside `.pb-badges` · 1 on screen · **1 look**

#### the one look

`G9-138` · rendered **95×44** · 1 instance look like this · aria-pressed="false"

```html
<button class="pb-tog pb-tox" aria-pressed="false"><i>⟨svg.ic⟩</i>TOXIC</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| gap | `10px` | `` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| column-gap | `10px` | `10px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| row-gap | `10px` | `10px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| align-items | `center` | `center` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| height | `var(--tap)` | `44px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `0 16px 0 12px` | `` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| padding-top | `0px` | `0px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| padding-right | `16px` | `16px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| padding-bottom | `0px` | `0px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| padding-left | `12px` | `12px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| border | `0` | `` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| border-radius | `var(--rad-2)` | `` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| background | `var(--sunk)` | `` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| background-image | `` | `none` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| font | `700 var(--t-sm)/1 var(--data)` | `` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| font-size | `` | `12px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| font-weight | `` | `700` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| font-style | `` | `normal` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| font-variant-numeric | `` | `normal` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| line-height | `` | `12px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| letter-spacing | `0.08em` | `0.96px` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | .pb-tog · 2026-09-14-pins2-board/index.html:60 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `rgb(11, 15, 18)` | `rgb(42, 52, 61)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `div.pb-rank`

inside `.bf-sec` · 1 on screen · **1 look**

#### the one look

`G9-141` · rendered **492×42** · 1 instance look like this

```html
<div class="pb-rank" data-rank="MP"><span>Tier in AR</span> <div class="seg pb-seg" data-seg="rank" data-tier="best"><span class="pb-thumb" style="width: 55px; transform: translateX(63px);"></span><button aria-pressed="false" data-t="none">None</button><button aria-pressed="true" data-t="best">Best</button><button aria-pressed="false" data-t="top3">Top 3</button><button aria-pressed="false" data-t="top4">Top 4</butto
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-rank · 2026-09-14-pins2-board/index.html:180 |
| gap | `14px` | `` | .pb-rank · 2026-09-14-pins2-board/index.html:180 |
| column-gap | `14px` | `14px` | .pb-rank · 2026-09-14-pins2-board/index.html:180 |
| row-gap | `14px` | `14px` | .pb-rank · 2026-09-14-pins2-board/index.html:180 |
| align-items | `center` | `center` | .pb-rank · 2026-09-14-pins2-board/index.html:180 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `12px` | `12px` | .pb-rank · 2026-09-14-pins2-board/index.html:180 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-imghead`

inside `.bf-sec` · 1 on screen · **1 look**

#### the one look

`G9-149` · rendered **492×36** · 1 instance look like this

```html
<div class="pb-imghead"><h4 class="bf-h">Image</h4> <div class="seg pb-seg pb-small" data-seg="img" data-imgseg=""><span class="pb-thumb" style="width: 103px; transform: translateX(3px);"></span><button aria-pressed="true" data-v="up">Upload or link</button><button aria-pressed="false" data-v="key">Existing key</button></div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-imghead · 2026-09-14-pins2-board/index.html:82 |
| align-items | `center` | `center` | .pb-imghead · 2026-09-14-pins2-board/index.html:82 |
| justify-content | `space-between` | `space-between` | .pb-imghead · 2026-09-14-pins2-board/index.html:82 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `12px` | `12px` | .pb-imghead · 2026-09-14-pins2-board/index.html:82 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-seg.pb-small.seg`

inside `.pb-imghead` · 1 on screen · **1 look**

#### the one look

`G9-151` · rendered **208×36** · 1 instance look like this

```html
<div class="seg pb-seg pb-small" data-seg="img" data-imgseg=""><span class="pb-thumb" style="width: 103px; transform: translateX(3px);"></span><button aria-pressed="true" data-v="up">Upload or link</button><button aria-pressed="false" data-v="key">Existing key</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-seg.seg · 2026-09-14-pins2-board/index.html:38 |
| position | `relative` | `relative` | .pb-seg.seg · 2026-09-14-pins2-board/index.html:38 |
| gap | `2px` | `` | .seg · 2026-09-14-pins2-board/app.css:710 |
| column-gap | `2px` | `2px` | .seg · 2026-09-14-pins2-board/app.css:710 |
| row-gap | `2px` | `2px` | .seg · 2026-09-14-pins2-board/app.css:710 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `3px` | `` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-top | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-right | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-bottom | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-left | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| border | `1px solid var(--rule)` | `` | .seg · 2026-09-14-pins2-board/app.css:710 |
| border-radius | `var(--rad-pill)` | `` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| background | `var(--sunk)` | `` | .seg · 2026-09-14-pins2-board/app.css:710 |
| background-color | `` | `rgb(11, 15, 18)` | .seg · 2026-09-14-pins2-board/app.css:710 |
| background-image | `` | `none` | .seg · 2026-09-14-pins2-board/app.css:710 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-imgview`

inside `.bf-sec` · 1 on screen · **1 look**

#### the one look

`G9-153` · rendered **492×155** · 1 instance look like this

```html
<div class="pb-imgview" data-imgview="up"> <div class="pb-drop"> <div class="pb-shot" role="img" aria-label="Dropped screenshot"><span class="pb-shot-ui"></span></div> <div class="pb-dropcol"> <div class="dwfield"><label for="nb-src">Screenshot or link</label><div class="pb-file">⟨svg.ic⟩<span>IMG_5630.png</span><em>1.2 MB</em><button class="chip">Replace</button></div></div> <div class="dwfield"><label for="nb-key">
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-drop`

inside `.pb-imgview` · 2 on screen · **2 looks**

#### look 1 of 2

`G9-154` · rendered **492×155** · 1 instance look like this

```html
<div class="pb-drop"> <div class="pb-shot" role="img" aria-label="Dropped screenshot"><span class="pb-shot-ui"></span></div> <div class="pb-dropcol"> <div class="dwfield"><label for="nb-src">Screenshot or link</label><div class="pb-file">⟨svg.ic⟩<span>IMG_5630.png</span><em>1.2 MB</em><button class="chip">Replace</button></div></div> <div class="dwfield"><label for="nb-key">Key</label><input id="nb-key" value="BAL-27
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-drop · 2026-09-14-pins2-board/index.html:85 |
| grid-template-columns | `200px 1fr` | `200px 276px` | .pb-drop · 2026-09-14-pins2-board/index.html:85 |
| gap | `16px` | `` | .pb-drop · 2026-09-14-pins2-board/index.html:85 |
| column-gap | `16px` | `16px` | .pb-drop · 2026-09-14-pins2-board/index.html:85 |
| row-gap | `16px` | `16px` | .pb-drop · 2026-09-14-pins2-board/index.html:85 |
| align-items | `stretch` | `stretch` | .pb-drop · 2026-09-14-pins2-board/index.html:85 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G9-167` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-drop"> <div class="pb-shot" role="img" aria-label="Image found for this key"><span class="pb-shot-ui"></span></div> <div class="pb-dropcol"> <div class="dwfield"><label for="nb-key2">Key</label><input id="nb-key2" value="BAL-27-1"></div> <span class="pb-echo">⟨svg.ic.sm⟩Found in gun-builds</span> </div> </div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-drop · 2026-09-14-pins2-board/index.html:85 |
| grid-template-columns | `200px 1fr` | `200px 1fr` | .pb-drop · 2026-09-14-pins2-board/index.html:85 |
| gap | `16px` | `` | .pb-drop · 2026-09-14-pins2-board/index.html:85 |
| column-gap | `16px` | `16px` | .pb-drop · 2026-09-14-pins2-board/index.html:85 |
| row-gap | `16px` | `16px` | .pb-drop · 2026-09-14-pins2-board/index.html:85 |
| align-items | `stretch` | `stretch` | .pb-drop · 2026-09-14-pins2-board/index.html:85 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-shot[role=img]`

inside `.pb-drop` · 2 on screen · **2 looks**

#### look 1 of 2

`G9-155` · rendered **200×155** · 1 instance look like this · aria-label="Dropped screenshot" role="img"

```html
<div class="pb-shot" role="img" aria-label="Dropped screenshot"><span class="pb-shot-ui"></span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |
| min-height | `112px` | `112px` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-2)` | `` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |
| background | `linear-gradient(160deg,#1a2328 0%,#22313a 45%,#2c2320 100%)` | `` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |
| background-image | `linear-gradient(160deg, rgb(26, 35, 40) 0%, rgb(34, 49, 58) 45%, rgb(44, 35, 32) 100%)` | `linear-gradient(160deg, rgb(26, 35, 40) 0%, rgb(34, 49, 58) 45%, rgb(44, 35, 32) 100%)` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |
| overflow-x | `hidden` | `hidden` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |
| overflow-y | `hidden` | `hidden` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |

#### look 2 of 2

`G9-168` · rendered **0×0** · 1 instance look like this · aria-label="Image found for this key" role="img"

```html
<div class="pb-shot" role="img" aria-label="Image found for this key"><span class="pb-shot-ui"></span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |
| min-height | `112px` | `112px` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-2)` | `` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |
| background | `linear-gradient(160deg,#1a2328 0%,#22313a 45%,#2c2320 100%)` | `` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |
| background-image | `linear-gradient(160deg, rgb(26, 35, 40) 0%, rgb(34, 49, 58) 45%, rgb(44, 35, 32) 100%)` | `linear-gradient(160deg, rgb(26, 35, 40) 0%, rgb(34, 49, 58) 45%, rgb(44, 35, 32) 100%)` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |
| overflow-x | `hidden` | `hidden` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |
| overflow-y | `hidden` | `hidden` | .pb-shot · 2026-09-14-pins2-board/index.html:86 |


### `span.pb-shot-ui`

inside `.pb-shot` · 2 on screen · **2 looks**

#### look 1 of 2

`G9-156` · rendered **168×127** · 1 instance look like this

```html
<span class="pb-shot-ui"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| inset | `14px 16px` | `` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| top | `14px` | `14px` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| right | `16px` | `16px` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| bottom | `14px` | `14px` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| left | `16px` | `16px` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| border-radius | `var(--rad-1)` | `` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| background | `linear-gradient(90deg,rgba(232,237,241,.10) 0 38%,transparent 38%),linear-gradient(rgba(232,237,241,.06),rgba(232,237,241,.06)) 0 70%/60% 6px no-repeat` | `` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| background-image | `linear-gradient(90deg, rgba(232, 237, 241, 0.1) 0px, rgba(232, 237, 241, 0.1) 38%, transparent 38%), linear-gradient(rgba(232, 237, 241, 0.06), rgba(232, 237, 241, 0.06))` | `linear-gradient(90deg, rgba(232, 237, 241, 0.1) 0px, rgba(232, 237, 241, 0.1) 38%, rgba(0, 0, 0, 0) 38%), linear-gradient(rgba(232, 237, 241, 0.06), rgba(232, 237, 241, 0.06))` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| box-shadow | `rgba(232, 237, 241, 0.08) 0px 0px 0px 1px inset` | `rgba(232, 237, 241, 0.08) 0px 0px 0px 1px inset` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G9-169` · rendered **0×0** · 1 instance look like this

```html
<span class="pb-shot-ui"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| inset | `14px 16px` | `` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| top | `14px` | `14px` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| right | `16px` | `16px` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| bottom | `14px` | `14px` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| left | `16px` | `16px` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| border-radius | `var(--rad-1)` | `` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| background | `linear-gradient(90deg,rgba(232,237,241,.10) 0 38%,transparent 38%),linear-gradient(rgba(232,237,241,.06),rgba(232,237,241,.06)) 0 70%/60% 6px no-repeat` | `` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| background-image | `linear-gradient(90deg, rgba(232, 237, 241, 0.1) 0px, rgba(232, 237, 241, 0.1) 38%, transparent 38%), linear-gradient(rgba(232, 237, 241, 0.06), rgba(232, 237, 241, 0.06))` | `linear-gradient(90deg, rgba(232, 237, 241, 0.1) 0px, rgba(232, 237, 241, 0.1) 38%, rgba(0, 0, 0, 0) 38%), linear-gradient(rgba(232, 237, 241, 0.06), rgba(232, 237, 241, 0.06))` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| box-shadow | `rgba(232, 237, 241, 0.08) 0px 0px 0px 1px inset` | `rgba(232, 237, 241, 0.08) 0px 0px 0px 1px inset` | .pb-shot-ui · 2026-09-14-pins2-board/index.html:88 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-dropcol`

inside `.pb-drop` · 2 on screen · **2 looks**

#### look 1 of 2

`G9-157` · rendered **276×155** · 1 instance look like this

```html
<div class="pb-dropcol"> <div class="dwfield"><label for="nb-src">Screenshot or link</label><div class="pb-file">⟨svg.ic⟩<span>IMG_5630.png</span><em>1.2 MB</em><button class="chip">Replace</button></div></div> <div class="dwfield"><label for="nb-key">Key</label><input id="nb-key" value="BAL-27-6"></div> </div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-dropcol · 2026-09-14-pins2-board/index.html:90 |
| gap | `12px` | `` | .pb-dropcol · 2026-09-14-pins2-board/index.html:90 |
| column-gap | `12px` | `12px` | .pb-dropcol · 2026-09-14-pins2-board/index.html:90 |
| row-gap | `12px` | `12px` | .pb-dropcol · 2026-09-14-pins2-board/index.html:90 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G9-170` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-dropcol"> <div class="dwfield"><label for="nb-key2">Key</label><input id="nb-key2" value="BAL-27-1"></div> <span class="pb-echo">⟨svg.ic.sm⟩Found in gun-builds</span> </div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-dropcol · 2026-09-14-pins2-board/index.html:90 |
| gap | `12px` | `` | .pb-dropcol · 2026-09-14-pins2-board/index.html:90 |
| column-gap | `12px` | `12px` | .pb-dropcol · 2026-09-14-pins2-board/index.html:90 |
| row-gap | `12px` | `12px` | .pb-dropcol · 2026-09-14-pins2-board/index.html:90 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-file`

inside `.dwfield` · 1 on screen · **1 look**

#### the one look

`G9-160` · rendered **276×44** · 1 instance look like this

```html
<div class="pb-file">⟨svg.ic⟩<span>IMG_5630.png</span><em>1.2 MB</em><button class="chip">Replace</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| gap | `10px` | `` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| column-gap | `10px` | `10px` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| row-gap | `10px` | `10px` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| align-items | `center` | `center` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| min-height | `var(--tap)` | `44px` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 6px 0 12px` | `` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| padding-top | `0px` | `0px` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| padding-right | `6px` | `6px` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| padding-bottom | `0px` | `0px` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| padding-left | `12px` | `12px` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| border-radius | `var(--rad-2)` | `` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| background | `var(--sunk)` | `` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| background-image | `` | `none` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| box-shadow | `inset 0 0 0 1px var(--rule)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `em`

inside `.pb-file` · 11 on screen · **2 looks**

#### look 1 of 2

`G9-163` · rendered **43×12** · 1 instance look like this · text “1.2 MB”

```html
<em>1.2 MB</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `500 var(--t-sm)/1 var(--data)` | `` | .pb-file em · 2026-09-14-pins2-board/index.html:93 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-file em · 2026-09-14-pins2-board/index.html:93 |
| font-size | `` | `12px` | .pb-file em · 2026-09-14-pins2-board/index.html:93 |
| font-weight | `` | `500` | .pb-file em · 2026-09-14-pins2-board/index.html:93 |
| font-style | `` | `normal` | .pb-file em · 2026-09-14-pins2-board/index.html:93 |
| font-variant-numeric | `` | `normal` | .pb-file em · 2026-09-14-pins2-board/index.html:93 |
| line-height | `` | `12px` | .pb-file em · 2026-09-14-pins2-board/index.html:93 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-file em · 2026-09-14-pins2-board/index.html:93 |

#### look 2 of 2

`G9-223` · rendered **0×0** · 10 instances look like this · text “Build:”

```html
<em>Build:</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `inline` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `` | `500` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | `normal` | `normal` | .pb-l em · 2026-09-14-pins2-board/index.html:198 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| white-space | ↑ `pre` | `` | inherited · .pb-l · 2026-09-14-pins2-board/index.html:194 |
| color | `var(--realm-c)` | `rgb(239, 68, 68)` | .pb-l em · 2026-09-14-pins2-board/index.html:198 |


### `button.chip`

inside `.pb-file` · 1 on screen · **1 look**

#### the one look

`G9-164` · rendered **70×32** · 1 instance look like this · text “Replace”

```html
<button class="chip">Replace</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .chip · 2026-09-14-pins2-board/app.css:938 |
| align-items | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| justify-content | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| min-height | `32px` | `32px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `6px 11px` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-top | `6px` | `6px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-right | `11px` | `11px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-bottom | `6px` | `6px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-left | `11px` | `11px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| margin-left | `auto` | `10.8438px` | .pb-file .chip · 2026-09-14-pins2-board/index.html:94 |
| border | `1px solid var(--rule2)` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| border-radius | `var(--rad-pill)` | `` | .chip, .seg button, .tbdsw button · 2026-09-14-pins2-board/app.css:4478 |
| background | `var(--sunk)` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| background-color | `` | `rgb(11, 15, 18)` | .chip · 2026-09-14-pins2-board/app.css:938 |
| background-image | `` | `none` | .chip · 2026-09-14-pins2-board/app.css:938 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `var(--t-sm)` | `12px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | `600` | `600` | .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `18px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| text-decoration | `none` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .chip · 2026-09-14-pins2-board/app.css:938 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | button · 2026-09-14-pins2-board/app.css:600 |

**:hover** — changes; parts inside it respond (table below)

| property | at rest | hover |
|---|---|---|
| background-color | `rgb(11, 15, 18)` | `rgb(42, 52, 61)` |
| color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| transform | `none` | `matrix(1, 0, 0, 1, 0, -1)` |

| part inside | property | at rest | hover |
|---|---|---|---|
| ::before | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::before | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::before | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::after | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::after | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::after | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `span.pb-echo`

inside `.pb-dropcol` · 1 on screen · **1 look**

#### the one look

`G9-173` · rendered **0×0** · 1 instance look like this

```html
<span class="pb-echo">⟨svg.ic.sm⟩Found in gun-builds</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| gap | `6px` | `` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| column-gap | `6px` | `6px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| row-gap | `6px` | `6px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| align-items | `center` | `center` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `6px` | `6px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font | `600 var(--t-sm)/1 var(--data)` | `` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-size | `` | `12px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-weight | `` | `600` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-style | `` | `normal` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-variant-numeric | `` | `normal` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| line-height | `` | `12px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ok)` | `rgb(123, 219, 99)` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |


### `svg.ic.sm`

inside `.pb-echo` · 1 on screen · **1 look**

#### the one look

`G9-174` · rendered **0×0** · 1 instance look like this

```html
<svg class="ic sm"><use href="#i-check"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| width | `0.85em` | `10.2px` | .ic.sm · 2026-09-14-pins2-board/app.css:6169 |
| height | `0.85em` | `10.2px` | .ic.sm · 2026-09-14-pins2-board/app.css:6169 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `600 var(--t-sm)/1 var(--data)` | `` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-size | ↑ `` | `12px` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-weight | ↑ `` | `600` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-style | ↑ `` | `normal` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| line-height | ↑ `` | `12px` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ok)` | `rgb(123, 219, 99)` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |


### `aside.bed-side`

inside `.bed` · 1 on screen · **1 look**

#### the one look

`G9-175` · rendered **320×316** · 1 instance look like this

```html
<aside class="bed-side"><div class="bed-sec"><h5>In Discord</h5> <div class="dcard lc" data-only="MP" style="--c:#FF3B5C"> <h6>BAL-27</h6><div class="lc-badges"><span>META</span><span>BEST</span></div><div class="lc-rule"></div> <div class="lc-h">Attachments</div> <ul class="lc-att"><li><code>Polarfire-S</code></li><li><code>Crown-H3 Barrel</code></li><li><code>Clarent Light Stock</code></li><li><code>60 Round Reload
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | article, aside, footer, header, hgroup, main, nav, search, section · user-agent:? |
| position | `sticky` | `sticky` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| align-self | `start` | `start` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| min-width | `0px` | `0px` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `14px` | `14px` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.bed-sec`

inside `.bed-side` · 1 on screen · **1 look**

#### the one look

`G9-176` · rendered **320×296** · 1 instance look like this

```html
<div class="bed-sec"><h5>In Discord</h5> <div class="dcard lc" data-only="MP" style="--c:#FF3B5C"> <h6>BAL-27</h6><div class="lc-badges"><span>META</span><span>BEST</span></div><div class="lc-rule"></div> <div class="lc-h">Attachments</div> <ul class="lc-att"><li><code>Polarfire-S</code></li><li><code>Crown-H3 Barrel</code></li><li><code>Clarent Light Stock</code></li><li><code>60 Round Reload</code></li></ul> <div c
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `20px` | `20px` | .bed-sec · 2026-09-14-pins2-board/app.css:3282 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.dcard.lc`

inside `.bed-sec` · 1 on screen · **1 look**

#### the one look

`G9-177` · rendered **320×276** · 1 instance look like this

```html
<div class="dcard lc" data-only="MP" style="--c:#FF3B5C"> <h6>BAL-27</h6><div class="lc-badges"><span>META</span><span>BEST</span></div><div class="lc-rule"></div> <div class="lc-h">Attachments</div> <ul class="lc-att"><li><code>Polarfire-S</code></li><li><code>Crown-H3 Barrel</code></li><li><code>Clarent Light Stock</code></li><li><code>60 Round Reload</code></li></ul> <div class="lc-h">Gunsmith Code</div><div class
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| width | `100%` | `320px` | .drawer.wide .bed-side .dcard.lc · 2026-09-14-pins2-board/app.css:6789 |
| max-width | `none` | `none` | .dcard.lc · 2026-09-14-pins2-board/app.css:3242 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `11px 13px` | `` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-top | `11px` | `11px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-right | `13px` | `13px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-bottom | `11px` | `11px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-left | `13px` | `13px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| border-left | `4px solid var(--c)` | `` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| border-radius | `8px/* foreign-radius: Discord's own corner, like --dc-*. The preview must look like Discord, not like the portal. */` | `` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| background | `var(--dc-bg)` | `` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| background-color | `` | `rgb(43, 45, 49)` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| background-image | `` | `none` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `12.5px` | `12.5px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18.75px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--dc-body)` | `rgb(219, 222, 225)` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| transition | `transform var(--dur-2) var(--ease), background var(--dur-2) var(--ease),box-shadow var(--dur-2) var(--ease),border-color var(--dur-2) var(--ease)` | `` | .wcard, .ccard, .tile, .hlive .lp, .dcard · 2026-09-14-pins2-board/app.css:5712 |


### `div.lc-badges`

inside `.dcard` · 2 on screen · **2 looks**

#### look 1 of 2

`G9-178` · rendered **290×16** · 1 instance look like this

```html
<div class="lc-badges"><span>META</span><span>BEST</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| gap | `5px` | `` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| column-gap | `5px` | `5px` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| row-gap | `5px` | `5px` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| flex-wrap | `wrap` | `wrap` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `6px 0 0` | `` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| margin-top | `6px` | `6px` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| margin-right | `0px` | `0px` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| margin-bottom | `0px` | `0px` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| margin-left | `0px` | `0px` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `12.5px` | `12.5px` | inherited · .dcard · 2026-09-14-pins2-board/app.css:1097 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18.75px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--dc-body)` | `rgb(219, 222, 225)` | inherited · .dcard · 2026-09-14-pins2-board/app.css:1296 |

#### look 2 of 2

`G9-191` · rendered **0×0** · 1 instance look like this

```html
<div class="lc-badges"><span>META</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| gap | `5px` | `` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| column-gap | `5px` | `5px` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| row-gap | `5px` | `5px` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| flex-wrap | `wrap` | `wrap` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `6px 0 0` | `` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| margin-top | `6px` | `6px` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| margin-right | `0px` | `0px` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| margin-bottom | `0px` | `0px` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| margin-left | `0px` | `0px` | .lc-badges · 2026-09-14-pins2-board/app.css:3243 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `12.5px` | `12.5px` | inherited · .dcard · 2026-09-14-pins2-board/app.css:1097 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18.75px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--dc-body)` | `rgb(219, 222, 225)` | inherited · .dcard · 2026-09-14-pins2-board/app.css:1296 |


### `div.lc-rule`

inside `.dcard` · 2 on screen · **1 look**

#### the one look

`G9-181` · rendered **290×1** · 2 instances look like this

```html
<div class="lc-rule"></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| height | `1px` | `1px` | .lc-rule · 2026-09-14-pins2-board/app.css:3246 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `10px 0` | `` | .lc-rule · 2026-09-14-pins2-board/app.css:3246 |
| margin-top | `10px` | `10px` | .lc-rule · 2026-09-14-pins2-board/app.css:3246 |
| margin-right | `0px` | `0px` | .lc-rule · 2026-09-14-pins2-board/app.css:3246 |
| margin-bottom | `10px` | `10px` | .lc-rule · 2026-09-14-pins2-board/app.css:3246 |
| margin-left | `0px` | `0px` | .lc-rule · 2026-09-14-pins2-board/app.css:3246 |
| background | `var(--dc-rule)` | `` | .lc-rule · 2026-09-14-pins2-board/app.css:3246 |
| background-color | `` | `rgb(58, 60, 65)` | .lc-rule · 2026-09-14-pins2-board/app.css:3246 |
| background-image | `` | `none` | .lc-rule · 2026-09-14-pins2-board/app.css:3246 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `12.5px` | `12.5px` | inherited · .dcard · 2026-09-14-pins2-board/app.css:1097 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18.75px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--dc-body)` | `rgb(219, 222, 225)` | inherited · .dcard · 2026-09-14-pins2-board/app.css:1296 |


### `div.lc-h`

inside `.dcard` · 3 on screen · **2 looks**

#### look 1 of 2

`G9-182` · rendered **290×12** · 2 instances look like this · text “Attachments”

```html
<div class="lc-h">Attachments</div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `10px 0 6px` | `` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| margin-top | `10px` | `10px` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| margin-right | `0px` | `0px` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| margin-bottom | `6px` | `6px` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| margin-left | `0px` | `0px` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| font | `700 var(--t-sm)/1 var(--ui)` | `` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| font-size | `` | `12px` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| font-weight | `` | `700` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| font-style | `` | `normal` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| font-variant-numeric | `` | `normal` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| line-height | `` | `12px` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| letter-spacing | — | `normal` | initial |
| color | `var(--dc-ink)` | `rgb(242, 243, 245)` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |

#### look 2 of 2

`G9-194` · rendered **0×0** · 1 instance look like this · text “Attachments”

```html
<div class="lc-h">Attachments</div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `10px 0 6px` | `` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| margin-top | `10px` | `10px` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| margin-right | `0px` | `0px` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| margin-bottom | `6px` | `6px` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| margin-left | `0px` | `0px` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| font | `700 var(--t-sm)/1 var(--ui)` | `` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| font-size | `` | `12px` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| font-weight | `` | `700` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| font-style | `` | `normal` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| font-variant-numeric | `` | `normal` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| line-height | `` | `12px` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |
| letter-spacing | — | `normal` | initial |
| color | `var(--dc-ink)` | `rgb(242, 243, 245)` | .lc-h · 2026-09-14-pins2-board/app.css:3249 |


### `ul.lc-att`

inside `.dcard` · 2 on screen · **2 looks**

#### look 1 of 2

`G9-183` · rendered **290×88** · 1 instance look like this

```html
<ul class="lc-att"><li><code>Polarfire-S</code></li><li><code>Crown-H3 Barrel</code></li><li><code>Clarent Light Stock</code></li><li><code>60 Round Reload</code></li></ul>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| gap | `3px` | `` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| column-gap | `3px` | `3px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| row-gap | `3px` | `3px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| flex-direction | `column` | `column` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0` | `` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| padding-top | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| padding-right | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| padding-bottom | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| padding-left | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| margin | `0` | `` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| margin-top | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| margin-right | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| margin-bottom | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| margin-left | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `12.5px` | `12.5px` | inherited · .dcard · 2026-09-14-pins2-board/app.css:1097 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18.75px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--dc-body)` | `rgb(219, 222, 225)` | inherited · .dcard · 2026-09-14-pins2-board/app.css:1296 |

#### look 2 of 2

`G9-195` · rendered **0×0** · 1 instance look like this

```html
<ul class="lc-att"><li><code>Classic Red Dot Sight</code></li><li><code>Monolithic Suppressor</code></li><li><code>OWC Marksman</code></li><li><code>No Stock</code></li><li><code>OWC Laser - Tactical</code></li><li><code>Operator Foregrip</code></li><li><code>Granulated Grip Tape</code></li><li><code>48 Round Extended Mag</code></li><li><code>Long Shot</code></li></ul>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| gap | `3px` | `` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| column-gap | `3px` | `3px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| row-gap | `3px` | `3px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| flex-direction | `column` | `column` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0` | `` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| padding-top | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| padding-right | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| padding-bottom | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| padding-left | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| margin | `0` | `` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| margin-top | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| margin-right | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| margin-bottom | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| margin-left | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `12.5px` | `12.5px` | inherited · .dcard · 2026-09-14-pins2-board/app.css:1097 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18.75px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--dc-body)` | `rgb(219, 222, 225)` | inherited · .dcard · 2026-09-14-pins2-board/app.css:1296 |


### `li`

inside `.lc-att` · 13 on screen · **2 looks**

#### look 1 of 2

`G9-184` · rendered **290×20** · 4 instances look like this

```html
<li><code>Polarfire-S</code></li>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .lc-att li · 2026-09-14-pins2-board/app.css:3251 |
| gap | `8px` | `` | .lc-att li · 2026-09-14-pins2-board/app.css:3251 |
| column-gap | `8px` | `8px` | .lc-att li · 2026-09-14-pins2-board/app.css:3251 |
| row-gap | `8px` | `8px` | .lc-att li · 2026-09-14-pins2-board/app.css:3251 |
| align-items | `baseline` | `baseline` | .lc-att li · 2026-09-14-pins2-board/app.css:3251 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | .lc-att li · 2026-09-14-pins2-board/app.css:3251 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--dc-body)` | `rgb(219, 222, 225)` | .lc-att li · 2026-09-14-pins2-board/app.css:3251 |

**::before**

| property | winning declaration | from |
|---|---|---|
| color | `var(--dc-dim)` | .lc-att li::before · 2026-09-14-pins2-board/app.css:3252 |
| content | `"•"` | .lc-att li::before · 2026-09-14-pins2-board/app.css:3252 |

#### look 2 of 2

`G9-196` · rendered **0×0** · 9 instances look like this

```html
<li><code>Classic Red Dot Sight</code></li>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .lc-att li · 2026-09-14-pins2-board/app.css:3251 |
| gap | `8px` | `` | .lc-att li · 2026-09-14-pins2-board/app.css:3251 |
| column-gap | `8px` | `8px` | .lc-att li · 2026-09-14-pins2-board/app.css:3251 |
| row-gap | `8px` | `8px` | .lc-att li · 2026-09-14-pins2-board/app.css:3251 |
| align-items | `baseline` | `baseline` | .lc-att li · 2026-09-14-pins2-board/app.css:3251 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | .lc-att li · 2026-09-14-pins2-board/app.css:3251 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--dc-body)` | `rgb(219, 222, 225)` | .lc-att li · 2026-09-14-pins2-board/app.css:3251 |

**::before**

| property | winning declaration | from |
|---|---|---|
| color | `var(--dc-dim)` | .lc-att li::before · 2026-09-14-pins2-board/app.css:3252 |
| content | `"•"` | .lc-att li::before · 2026-09-14-pins2-board/app.css:3252 |


### `div.lc-code`

inside `.dcard` · 1 on screen · **1 look**

#### the one look

`G9-189` · rendered **290×32** · 1 instance look like this · text “1C2C4A8A9C”

```html
<div class="lc-code">1C2C4A8A9C</div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `7px 9px` | `` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| padding-top | `7px` | `7px` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| padding-right | `9px` | `9px` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| padding-bottom | `7px` | `7px` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| padding-left | `9px` | `9px` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| border-radius | `var(--rad-2)` | `` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| background | `var(--dc-sunk)` | `` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| background-color | `` | `rgb(30, 31, 34)` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| background-image | `` | `none` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| font-family | `var(--data)` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| font-size | `var(--t-sm)` | `12px` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | `0.06em` | `0.72px` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| color | `var(--dc-body)` | `rgb(219, 222, 225)` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |


### `div.lc-foot`

inside `.dcard` · 2 on screen · **2 looks**

#### look 1 of 2

`G9-190` · rendered **290×14** · 1 instance look like this · text “AR • Build 6 of 6”

```html
<div class="lc-foot" data-foot="">AR • Build 6 of 6</div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `10px` | `10px` | .lc-foot · 2026-09-14-pins2-board/app.css:3268 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-micro)` | `9.5px` | .lc-foot · 2026-09-14-pins2-board/app.css:3268 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `14.25px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | `0.04em` | `0.38px` | .lc-foot · 2026-09-14-pins2-board/app.css:3268 |
| color | `var(--dc-dim)` | `rgb(148, 155, 164)` | .lc-foot · 2026-09-14-pins2-board/app.css:3268 |

#### look 2 of 2

`G9-205` · rendered **0×0** · 1 instance look like this · text “DMZ • Build 2 of 2”

```html
<div class="lc-foot">DMZ • Build 2 of 2</div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `10px` | `10px` | .lc-foot · 2026-09-14-pins2-board/app.css:3268 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-micro)` | `9.5px` | .lc-foot · 2026-09-14-pins2-board/app.css:3268 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `14.25px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | `0.04em` | `0.38px` | .lc-foot · 2026-09-14-pins2-board/app.css:3268 |
| color | `var(--dc-dim)` | `rgb(148, 155, 164)` | .lc-foot · 2026-09-14-pins2-board/app.css:3268 |


### `footer.dw-f`

inside `.pb-view` · 2 on screen · **2 looks**

#### look 1 of 2

`G9-206` · rendered **878×69** · 1 instance look like this

```html
<footer class="dw-f"><button class="btn no">Cancel</button><button class="btn">Stage and add another</button><button class="btn go" data-stage="">Stage this MP build</button></footer>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| gap | `var(--s2)` | `` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| column-gap | `` | `8px` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| row-gap | `` | `8px` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| flex | `none` | `` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| justify-content | `flex-end` | `flex-end` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `var(--s3) var(--s5)` | `` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| padding-top | `` | `12px` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| padding-right | `` | `24px` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| padding-bottom | `` | `12px` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| padding-left | `` | `24px` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| border-top | `1px solid var(--rule)` | `` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| background | `var(--sunk)` | `` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| background-color | `` | `rgb(11, 15, 18)` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| background-image | `` | `none` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G9-326` · rendered **0×0** · 1 instance look like this

```html
<footer class="dw-f"><span class="why">Block 4 is skipped</span><button class="btn no">Cancel</button><button class="btn go" data-stage-many="">Stage 3 MP builds</button></footer>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| gap | `var(--s2)` | `` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| column-gap | `` | `8px` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| row-gap | `` | `8px` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| flex | `none` | `` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| justify-content | `flex-end` | `flex-end` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `var(--s3) var(--s5)` | `` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| padding-top | `` | `12px` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| padding-right | `` | `24px` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| padding-bottom | `` | `12px` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| padding-left | `` | `24px` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| border-top | `1px solid var(--rule)` | `` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| background | `var(--sunk)` | `` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| background-color | `` | `rgb(11, 15, 18)` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| background-image | `` | `none` | .dw-f · 2026-09-14-pins2-board/app.css:1091 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `button.btn.no`

inside `.dw-f` · 2 on screen · **2 looks**

#### look 1 of 2

`G9-207` · rendered **132×44** · 1 instance look like this · text “Cancel”

```html
<button class="btn no">Cancel</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | input, textarea, select, button · user-agent:? |
| flex | `0 0 auto` | `` | .dw-f .btn · 2026-09-14-pins2-board/app.css:1090 |
| min-width | `132px` | `132px` | .dw-f .btn · 2026-09-14-pins2-board/app.css:1090 |
| min-height | `var(--tap)` | `44px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `9px` | `` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-top | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-right | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-bottom | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-left | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| border | `1px solid var(--rule2)` | `` | .btn.no · 2026-09-14-pins2-board/app.css:1047 |
| border-radius | `var(--rad-2)` | `` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| background | `none` | `` | .btn.no · 2026-09-14-pins2-board/app.css:1047 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .btn.no · 2026-09-14-pins2-board/app.css:1047 |
| background-image | `none` | `none` | .btn.no · 2026-09-14-pins2-board/app.css:1047 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `var(--t-base)` | `13px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| font-weight | `700` | `700` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `19.5px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .btn.no · 2026-09-14-pins2-board/app.css:1047 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | button · 2026-09-14-pins2-board/app.css:600 |

**:hover** — changes; parts inside it respond (table below)

| property | at rest | hover |
|---|---|---|
| background-color | `rgba(0, 0, 0, 0)` | `rgb(42, 52, 61)` |
| color | `rgb(133, 147, 159)` | `rgb(157, 170, 180)` |

| part inside | property | at rest | hover |
|---|---|---|---|
| ::before | color | `rgb(133, 147, 159)` | `rgb(157, 170, 180)` |
| ::before | border-color | `rgb(133, 147, 159)` | `rgb(157, 170, 180)` |
| ::before | outline-color | `rgb(133, 147, 159)` | `rgb(157, 170, 180)` |
| ::after | color | `rgb(133, 147, 159)` | `rgb(157, 170, 180)` |
| ::after | border-color | `rgb(133, 147, 159)` | `rgb(157, 170, 180)` |
| ::after | outline-color | `rgb(133, 147, 159)` | `rgb(157, 170, 180)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |

#### look 2 of 2

`G9-328` · rendered **0×0** · 1 instance look like this · text “Cancel”

```html
<button class="btn no">Cancel</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | input, textarea, select, button · user-agent:? |
| flex | `0 0 auto` | `` | .dw-f .btn · 2026-09-14-pins2-board/app.css:1090 |
| min-width | `132px` | `132px` | .dw-f .btn · 2026-09-14-pins2-board/app.css:1090 |
| min-height | `var(--tap)` | `44px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `9px` | `` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-top | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-right | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-bottom | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-left | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| border | `1px solid var(--rule2)` | `` | .btn.no · 2026-09-14-pins2-board/app.css:1047 |
| border-radius | `var(--rad-2)` | `` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| background | `none` | `` | .btn.no · 2026-09-14-pins2-board/app.css:1047 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .btn.no · 2026-09-14-pins2-board/app.css:1047 |
| background-image | `none` | `none` | .btn.no · 2026-09-14-pins2-board/app.css:1047 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `var(--t-base)` | `13px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| font-weight | `700` | `700` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `19.5px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .btn.no · 2026-09-14-pins2-board/app.css:1047 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | button · 2026-09-14-pins2-board/app.css:600 |

**:hover** — changes; parts inside it respond (table below)

| property | at rest | hover |
|---|---|---|
| background-color | `rgba(0, 0, 0, 0)` | `rgb(42, 52, 61)` |
| color | `rgb(133, 147, 159)` | `rgb(157, 170, 180)` |

| part inside | property | at rest | hover |
|---|---|---|---|
| ::before | color | `rgb(133, 147, 159)` | `rgb(157, 170, 180)` |
| ::before | border-color | `rgb(133, 147, 159)` | `rgb(157, 170, 180)` |
| ::before | outline-color | `rgb(133, 147, 159)` | `rgb(157, 170, 180)` |
| ::after | color | `rgb(133, 147, 159)` | `rgb(157, 170, 180)` |
| ::after | border-color | `rgb(133, 147, 159)` | `rgb(157, 170, 180)` |
| ::after | outline-color | `rgb(133, 147, 159)` | `rgb(157, 170, 180)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself


### `button.btn`

inside `.dw-f` · 1 on screen · **1 look**

#### the one look

`G9-208` · rendered **165×44** · 1 instance look like this · text “Stage and add another”

```html
<button class="btn">Stage and add another</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | input, textarea, select, button · user-agent:? |
| flex | `0 0 auto` | `` | .dw-f .btn · 2026-09-14-pins2-board/app.css:1090 |
| min-width | `132px` | `132px` | .dw-f .btn · 2026-09-14-pins2-board/app.css:1090 |
| min-height | `var(--tap)` | `44px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `9px` | `` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-top | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-right | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-bottom | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-left | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| border | `1px solid var(--rule2)` | `` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| border-radius | `var(--rad-2)` | `` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| background | `var(--raised)` | `` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| background-color | `` | `rgb(31, 39, 46)` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| background-image | `` | `none` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `var(--t-base)` | `13px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| font-weight | `700` | `700` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `19.5px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | button · 2026-09-14-pins2-board/app.css:600 |

**:hover** — changes; parts inside it respond (table below)

| property | at rest | hover |
|---|---|---|
| background-color | `rgb(31, 39, 46)` | `rgb(42, 52, 61)` |
| color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |

| part inside | property | at rest | hover |
|---|---|---|---|
| ::before | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::before | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::before | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::after | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::after | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::after | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `button.btn.go`

inside `.dw-f` · 2 on screen · **2 looks**

#### look 1 of 2

`G9-209` · rendered **142×44** · 1 instance look like this · text “Stage this MP build”

```html
<button class="btn go" data-stage="">Stage this MP build</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | input, textarea, select, button · user-agent:? |
| flex | `0 0 auto` | `` | .dw-f .btn · 2026-09-14-pins2-board/app.css:1090 |
| min-width | `132px` | `132px` | .dw-f .btn · 2026-09-14-pins2-board/app.css:1090 |
| min-height | `var(--tap)` | `44px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `9px` | `` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-top | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-right | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-bottom | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-left | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| border | `1px solid var(--ok)` | `` | .btn.go · 2026-09-14-pins2-board/app.css:1045 |
| border-radius | `var(--rad-2)` | `` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| background | `var(--ok)` | `` | .btn.go · 2026-09-14-pins2-board/app.css:1045 |
| background-color | `` | `rgb(123, 219, 99)` | .btn.go · 2026-09-14-pins2-board/app.css:1045 |
| background-image | `` | `none` | .btn.go · 2026-09-14-pins2-board/app.css:1045 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `var(--t-base)` | `13px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| font-weight | `700` | `700` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `19.5px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--on-ok)` | `rgb(7, 19, 10)` | .btn.go · 2026-09-14-pins2-board/app.css:1045 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | button · 2026-09-14-pins2-board/app.css:600 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `rgb(123, 219, 99)` | `rgb(42, 52, 61)` |
| filter | `none` | `brightness(1.09)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |

#### look 2 of 2

`G9-329` · rendered **0×0** · 1 instance look like this · text “Stage 3 MP builds”

```html
<button class="btn go" data-stage-many="">Stage 3 MP builds</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | input, textarea, select, button · user-agent:? |
| flex | `0 0 auto` | `` | .dw-f .btn · 2026-09-14-pins2-board/app.css:1090 |
| min-width | `132px` | `132px` | .dw-f .btn · 2026-09-14-pins2-board/app.css:1090 |
| min-height | `var(--tap)` | `44px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `9px` | `` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-top | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-right | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-bottom | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-left | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| border | `1px solid var(--ok)` | `` | .btn.go · 2026-09-14-pins2-board/app.css:1045 |
| border-radius | `var(--rad-2)` | `` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| background | `var(--ok)` | `` | .btn.go · 2026-09-14-pins2-board/app.css:1045 |
| background-color | `` | `rgb(123, 219, 99)` | .btn.go · 2026-09-14-pins2-board/app.css:1045 |
| background-image | `` | `none` | .btn.go · 2026-09-14-pins2-board/app.css:1045 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `var(--t-base)` | `13px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| font-weight | `700` | `700` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `19.5px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--on-ok)` | `rgb(7, 19, 10)` | .btn.go · 2026-09-14-pins2-board/app.css:1045 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | button · 2026-09-14-pins2-board/app.css:600 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `rgb(123, 219, 99)` | `rgb(42, 52, 61)` |
| filter | `none` | `brightness(1.09)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself


### `div.pb-bulk`

inside `.dw-b` · 1 on screen · **1 look**

#### the one look

`G9-211` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-bulk"> <div> <div class="pb-edhead"><label for="pm">Builds</label><span>4 builds · 32 lines</span></div> <div class="pb-ed" id="pm" role="textbox" aria-multiline="true" aria-label="Builds" contenteditable="true" spellcheck="false"> <div class="pb-blk" data-o="upd"><span></span><div><span class="pb-l pb-hd">BAL-27 <i>|</i> AR</span><span class="pb-l"><em>Build:</em> Build 2</span><span class="pb-l"><em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-bulk · 2026-09-14-pins2-board/index.html:184 |
| grid-template-columns | `minmax(0px, 1fr) minmax(0px, 1fr)` | `minmax(0px, 1fr) minmax(0px, 1fr)` | .pb-bulk · 2026-09-14-pins2-board/index.html:184 |
| gap | `20px` | `` | .pb-bulk · 2026-09-14-pins2-board/index.html:184 |
| column-gap | `20px` | `20px` | .pb-bulk · 2026-09-14-pins2-board/index.html:184 |
| row-gap | `20px` | `20px` | .pb-bulk · 2026-09-14-pins2-board/index.html:184 |
| align-items | `start` | `start` | .pb-bulk · 2026-09-14-pins2-board/index.html:184 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div`

inside `.pb-bulk` · 10 on screen · **3 looks**

#### look 1 of 3

`G9-212` · rendered **0×0** · 2 instances look like this

```html
<div> <div class="pb-edhead"><label for="pm">Builds</label><span>4 builds · 32 lines</span></div> <div class="pb-ed" id="pm" role="textbox" aria-multiline="true" aria-label="Builds" contenteditable="true" spellcheck="false"> <div class="pb-blk" data-o="upd"><span></span><div><span class="pb-l pb-hd">BAL-27 <i>|</i> AR</span><span class="pb-l"><em>Build:</em> Build 2</span><span class="pb-l"><em>Image:</em> BAL-27-2</
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 3

`G9-219` · rendered **0×0** · 4 instances look like this

```html
<div><span class="pb-l pb-hd">BAL-27 <i>|</i> AR</span><span class="pb-l"><em>Build:</em> Build 2</span><span class="pb-l"><em>Image:</em> BAL-27-2</span><span class="pb-l pb-hit"><em>Code:</em> 1I2B4A8A9D</span><span class="pb-l"><em>Badges:</em> meta, best</span><span class="pb-l">- Gauge-9 Mono</span><span class="pb-l pb-hit">- Noctkill Long Barrel</span><span class="pb-l">- Clarent Light Stock</span><span class="
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `` | `500` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |

#### look 3 of 3

`G9-275` · rendered **0×0** · 4 instances look like this

```html
<div data-o="new"><b>1</b><span>new</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-tally div · 2026-09-14-pins2-board/index.html:207 |
| gap | `6px` | `` | .pb-tally div · 2026-09-14-pins2-board/index.html:207 |
| column-gap | `6px` | `6px` | .pb-tally div · 2026-09-14-pins2-board/index.html:207 |
| row-gap | `6px` | `6px` | .pb-tally div · 2026-09-14-pins2-board/index.html:207 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `12px 12px 11px` | `` | .pb-tally div · 2026-09-14-pins2-board/index.html:207 |
| padding-top | `12px` | `12px` | .pb-tally div · 2026-09-14-pins2-board/index.html:207 |
| padding-right | `12px` | `12px` | .pb-tally div · 2026-09-14-pins2-board/index.html:207 |
| padding-bottom | `11px` | `11px` | .pb-tally div · 2026-09-14-pins2-board/index.html:207 |
| padding-left | `12px` | `12px` | .pb-tally div · 2026-09-14-pins2-board/index.html:207 |
| background | `var(--sunk)` | `` | .pb-tally div · 2026-09-14-pins2-board/index.html:207 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-tally div · 2026-09-14-pins2-board/index.html:207 |
| background-image | `` | `none` | .pb-tally div · 2026-09-14-pins2-board/index.html:207 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-edhead`

inside `.—` · 1 on screen · **1 look**

#### the one look

`G9-213` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-edhead"><label for="pm">Builds</label><span>4 builds · 32 lines</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-edhead · 2026-09-14-pins2-board/index.html:185 |
| align-items | `baseline` | `baseline` | .pb-edhead · 2026-09-14-pins2-board/index.html:185 |
| justify-content | `space-between` | `space-between` | .pb-edhead · 2026-09-14-pins2-board/index.html:185 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `8px` | `8px` | .pb-edhead · 2026-09-14-pins2-board/index.html:185 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-ed[role=textbox]`

inside `.—` · 1 on screen · **1 look**

#### the one look

`G9-216` · rendered **0×0** · 1 instance look like this · aria-label="Builds" role="textbox"

```html
<div class="pb-ed" id="pm" role="textbox" aria-multiline="true" aria-label="Builds" contenteditable="true" spellcheck="false"> <div class="pb-blk" data-o="upd"><span></span><div><span class="pb-l pb-hd">BAL-27 <i>|</i> AR</span><span class="pb-l"><em>Build:</em> Build 2</span><span class="pb-l"><em>Image:</em> BAL-27-2</span><span class="pb-l pb-hit"><em>Code:</em> 1I2B4A8A9D</span><span class="pb-l"><em>Badges:</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `10px 0` | `` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| padding-top | `10px` | `10px` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| padding-right | `0px` | `0px` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| padding-bottom | `10px` | `10px` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| padding-left | `0px` | `0px` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| border-radius | `var(--rad-2)` | `` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| outline | `0` | `` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| background | `var(--desk,#0b0f12)` | `` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| background-color | `` | `rgb(15, 20, 24)` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| background-image | `` | `none` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font | `500 13px/22px var(--data)` | `` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | `` | `13px` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | `` | `500` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | `` | `normal` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | `` | `normal` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | `` | `22px` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |


### `div.pb-blk`

inside `.pb-ed` · 4 on screen · **1 look**

#### the one look

`G9-217` · rendered **0×0** · 4 instances look like this

```html
<div class="pb-blk" data-o="upd"><span></span><div><span class="pb-l pb-hd">BAL-27 <i>|</i> AR</span><span class="pb-l"><em>Build:</em> Build 2</span><span class="pb-l"><em>Image:</em> BAL-27-2</span><span class="pb-l pb-hit"><em>Code:</em> 1I2B4A8A9D</span><span class="pb-l"><em>Badges:</em> meta, best</span><span class="pb-l">- Gauge-9 Mono</span><span class="pb-l pb-hit">- Noctkill Long Barrel</span><span class="p
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| position | `relative` | `relative` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| grid-template-columns | `14px 1fr` | `14px 1fr` | .pb-ed .pb-blk · 2026-09-14-pins2-board/index.html:281 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `2px 0` | `` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-top | `2px` | `2px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-right | `0px` | `0px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-bottom | `2px` | `2px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-left | `0px` | `0px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `` | `500` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| width | `3px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| top | `2px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| bottom | `2px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| left | `0px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| border-radius | `0 2px 2px 0` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| background | `var(--o)` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| background-color | `` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| background-image | `` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| content | `""` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |


### `span.pb-hd.pb-l`

inside `.—` · 3 on screen · **1 look**

#### the one look

`G9-220` · rendered **0×0** · 3 instances look like this

```html
<span class="pb-l pb-hd">BAL-27 <i>|</i> AR</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| position | `relative` | `relative` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-left | `30px` | `30px` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | `700` | `700` | .pb-l.pb-hd · 2026-09-14-pins2-board/index.html:196 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| white-space | `pre` | `` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-l.pb-hd · 2026-09-14-pins2-board/index.html:196 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| width | `20px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| left | `0px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| font-size | `11px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| text-align | `right` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| color | `var(--ink4)` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| content | `counter(ln)` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |


### `span.pb-l`

inside `.—` · 24 on screen · **1 look**

#### the one look

`G9-222` · rendered **0×0** · 24 instances look like this

```html
<span class="pb-l"><em>Build:</em> Build 2</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| position | `relative` | `relative` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-left | `30px` | `30px` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `` | `500` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| white-space | `pre` | `` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| width | `20px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| left | `0px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| font-size | `11px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| text-align | `right` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| color | `var(--ink4)` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| content | `counter(ln)` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |


### `span.pb-hit.pb-l`

inside `.—` · 3 on screen · **1 look**

#### the one look

`G9-226` · rendered **0×0** · 3 instances look like this

```html
<span class="pb-l pb-hit"><em>Code:</em> 1I2B4A8A9D</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| position | `relative` | `relative` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-left | `30px` | `30px` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| background | `color-mix(in srgb,var(--patch) 12%,transparent)` | `` | .pb-l.pb-hit · 2026-09-14-pins2-board/index.html:199 |
| background-color | `` | `color(srgb 0.94902 0.760784 0.188235 / 0.12)` | .pb-l.pb-hit · 2026-09-14-pins2-board/index.html:199 |
| background-image | `` | `none` | .pb-l.pb-hit · 2026-09-14-pins2-board/index.html:199 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `` | `500` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| white-space | `pre` | `` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-l.pb-hit · 2026-09-14-pins2-board/index.html:199 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| width | `20px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| left | `0px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| font-size | `11px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| text-align | `right` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| color | `var(--ink4)` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| content | `counter(ln)` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |


### `span.pb-err.pb-hd.pb-l`

inside `.—` · 1 on screen · **1 look**

#### the one look

`G9-268` · rendered **0×0** · 1 instance look like this · text “AK117”

```html
<span class="pb-l pb-hd pb-err">AK117</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| position | `relative` | `relative` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-left | `30px` | `30px` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | `700` | `700` | .pb-l.pb-hd · 2026-09-14-pins2-board/index.html:196 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| text-decoration | `underline wavy var(--danger-ink) 1px` | `` | .pb-l.pb-err · 2026-09-14-pins2-board/index.html:200 |
| white-space | `pre` | `` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-l.pb-err · 2026-09-14-pins2-board/index.html:200 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| width | `20px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| left | `0px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| font-size | `11px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| text-align | `right` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| color | `var(--ink4)` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| content | `counter(ln)` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |


### `div.pb-tally`

inside `.—` · 1 on screen · **1 look**

#### the one look

`G9-274` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-tally"> <div data-o="new"><b>1</b><span>new</span></div> <div data-o="upd"><b>1</b><span>updated</span></div> <div data-o="warn"><b>1</b><span>saved with a warning</span></div> <div data-o="bad"><b>1</b><span>can’t be read</span></div> </div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| grid-template-columns | `repeat(4, 1fr)` | `repeat(4, 1fr)` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| gap | `1px` | `` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| column-gap | `1px` | `1px` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| row-gap | `1px` | `1px` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-2)` | `` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| background | `var(--rule)` | `` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| background-color | `` | `rgb(42, 52, 61)` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| background-image | `` | `none` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| box-shadow | `inset 0 0 0 1px var(--rule)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| overflow-x | `hidden` | `hidden` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| overflow-y | `hidden` | `hidden` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |


### `b`

inside `.—` · 5 on screen · **5 looks**

#### look 1 of 5

`G9-276` · rendered **0×0** · 1 instance look like this · text “1”

```html
<b>1</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 30px/1 var(--data)` | `` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-size | `` | `30px` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-weight | `` | `700` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-style | `` | `normal` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| line-height | `` | `30px` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| letter-spacing | — | `normal` | initial |
| color | `var(--o,var(--ink))` | `rgb(123, 219, 99)` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |

#### look 2 of 5

`G9-279` · rendered **0×0** · 1 instance look like this · text “1”

```html
<b>1</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 30px/1 var(--data)` | `` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-size | `` | `30px` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-weight | `` | `700` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-style | `` | `normal` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| line-height | `` | `30px` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| letter-spacing | — | `normal` | initial |
| color | `var(--o,var(--ink))` | `rgb(242, 194, 48)` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |

#### look 3 of 5

`G9-282` · rendered **0×0** · 1 instance look like this · text “1”

```html
<b>1</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 30px/1 var(--data)` | `` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-size | `` | `30px` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-weight | `` | `700` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-style | `` | `normal` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| line-height | `` | `30px` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| letter-spacing | — | `normal` | initial |
| color | `var(--o,var(--ink))` | `rgb(255, 122, 69)` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |

#### look 4 of 5

`G9-285` · rendered **0×0** · 1 instance look like this · text “1”

```html
<b>1</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 30px/1 var(--data)` | `` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-size | `` | `30px` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-weight | `` | `700` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-style | `` | `normal` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| line-height | `` | `30px` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| letter-spacing | — | `normal` | initial |
| color | `var(--o,var(--ink))` | `rgb(255, 138, 133)` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |

#### look 5 of 5

`G9-297` · rendered **0×0** · 1 instance look like this · text “Noctkill Long Barrel”

```html
<b>Noctkill Long Barrel</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| font-weight | `600` | `600` | .pb-rd b · 2026-09-14-pins2-board/index.html:221 |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-rd b · 2026-09-14-pins2-board/index.html:221 |


### `ol.pb-rows`

inside `.—` · 1 on screen · **1 look**

#### the one look

`G9-287` · rendered **0×0** · 1 instance look like this

```html
<ol class="pb-rows"> <li class="pb-row" data-o="upd"><div class="pb-rt"><strong>BAL-27</strong><span>Build 2</span><span class="pb-ln">lines 1–10</span></div><span class="pb-oc">Update</span> <div class="pb-rd"><span class="pb-k2">Barrel</span><s>Crown-H3 Barrel</s>⟨svg.ic⟩<b>Noctkill Long Barrel</b></div></li> <li class="pb-row" data-o="new"><div class="pb-rt"><strong>FFAR 1</strong><span>Build 4</span><span class="
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| gap | `8px` | `` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| column-gap | `8px` | `8px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| row-gap | `8px` | `8px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0` | `` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| padding-top | `0px` | `0px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| padding-right | `0px` | `0px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| padding-bottom | `0px` | `0px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| padding-left | `0px` | `0px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| margin | `12px 0 0` | `` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| margin-top | `12px` | `12px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| margin-right | `0px` | `0px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| margin-bottom | `0px` | `0px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| margin-left | `0px` | `0px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `li.pb-row`

inside `.pb-rows` · 4 on screen · **2 looks**

#### look 1 of 2

`G9-288` · rendered **0×0** · 3 instances look like this

```html
<li class="pb-row" data-o="upd"><div class="pb-rt"><strong>BAL-27</strong><span>Build 2</span><span class="pb-ln">lines 1–10</span></div><span class="pb-oc">Update</span> <div class="pb-rd"><span class="pb-k2">Barrel</span><s>Crown-H3 Barrel</s>⟨svg.ic⟩<b>Noctkill Long Barrel</b></div></li>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| position | `relative` | `relative` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| grid-template-columns | `1fr auto` | `1fr auto` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| gap | `4px 12px` | `` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| column-gap | `12px` | `12px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| row-gap | `4px` | `4px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| align-items | `center` | `center` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `12px 14px` | `` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| padding-top | `12px` | `12px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| padding-right | `14px` | `14px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| padding-bottom | `12px` | `12px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| padding-left | `18px` | `18px` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| border-radius | `var(--rad-2)` | `` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| background | `var(--raised)` | `` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| background-image | `` | `none` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| box-shadow | `inset 0 0 0 1px var(--rule)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| overflow-x | `hidden` | `hidden` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| overflow-y | `hidden` | `hidden` | .pb-row · 2026-09-14-pins2-board/index.html:282 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| width | `3px` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| top | `0px` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| bottom | `0px` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| left | `0px` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| background | `var(--o)` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| background-color | `` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| background-image | `` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| content | `""` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |

#### look 2 of 2

`G9-319` · rendered **0×0** · 1 instance look like this

```html
<li class="pb-row" data-o="bad"><div class="pb-rt"><strong>AK117</strong><span class="pb-ln">line 28</span></div><span class="pb-oc">Can’t read</span> <div class="pb-rd pb-msg"><span>First line needs a category: <code>AK117 | AR</code></span></div></li>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| position | `relative` | `relative` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| grid-template-columns | `1fr auto` | `1fr auto` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| gap | `4px 12px` | `` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| column-gap | `12px` | `12px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| row-gap | `4px` | `4px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| align-items | `center` | `center` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `12px 14px` | `` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| padding-top | `12px` | `12px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| padding-right | `14px` | `14px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| padding-bottom | `12px` | `12px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| padding-left | `18px` | `18px` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| border-radius | `var(--rad-2)` | `` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| background | `repeating-linear-gradient(-45deg,color-mix(in srgb,var(--danger-ink) 7%,transparent) 0 6px,transparent 6px 12px),var(--raised)` | `` | .pb-row[data-o="bad"] · 2026-09-14-pins2-board/index.html:212 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-row[data-o="bad"] · 2026-09-14-pins2-board/index.html:212 |
| background-image | `` | `repeating-linear-gradient(-45deg, color(srgb 1 0.541176 0.521569 / 0.07) 0px, color(srgb 1 0.541176 0.521569 / 0.07) 6px, rgba(0, 0, 0, 0) 6px, rgba(0, 0, 0, 0) 12px), none` | .pb-row[data-o="bad"] · 2026-09-14-pins2-board/index.html:212 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--danger-ink) 35%,transparent)` | `color(srgb 1 0.541176 0.521569 / 0.35) 0px 0px 0px 1px inset` | .pb-row[data-o="bad"] · 2026-09-14-pins2-board/index.html:212 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| overflow-x | `hidden` | `hidden` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| overflow-y | `hidden` | `hidden` | .pb-row · 2026-09-14-pins2-board/index.html:282 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| width | `3px` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| top | `0px` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| bottom | `0px` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| left | `0px` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| background | `repeating-linear-gradient(-45deg,var(--o) 0 3px,transparent 3px 6px)` | .pb-row[data-o="bad"]::before · 2026-09-14-pins2-board/index.html:284 |
| background-color | `` | .pb-row[data-o="bad"]::before · 2026-09-14-pins2-board/index.html:284 |
| background-image | `` | .pb-row[data-o="bad"]::before · 2026-09-14-pins2-board/index.html:284 |
| content | `""` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |


### `div.pb-rt`

inside `.pb-row` · 4 on screen · **1 look**

#### the one look

`G9-289` · rendered **0×0** · 4 instances look like this

```html
<div class="pb-rt"><strong>BAL-27</strong><span>Build 2</span><span class="pb-ln">lines 1–10</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-rt · 2026-09-14-pins2-board/index.html:213 |
| gap | `8px` | `` | .pb-rt · 2026-09-14-pins2-board/index.html:213 |
| column-gap | `8px` | `8px` | .pb-rt · 2026-09-14-pins2-board/index.html:213 |
| row-gap | `8px` | `8px` | .pb-rt · 2026-09-14-pins2-board/index.html:213 |
| align-items | `baseline` | `baseline` | .pb-rt · 2026-09-14-pins2-board/index.html:213 |
| min-width | `0px` | `0px` | .pb-rt · 2026-09-14-pins2-board/index.html:213 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `strong`

inside `.pb-rt` · 4 on screen · **1 look**

#### the one look

`G9-290` · rendered **0×0** · 4 instances look like this · text “BAL-27”

```html
<strong>BAL-27</strong>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-base)/1.2 var(--ui)` | `` | .pb-rt strong · 2026-09-14-pins2-board/index.html:214 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-rt strong · 2026-09-14-pins2-board/index.html:214 |
| font-size | `` | `13px` | .pb-rt strong · 2026-09-14-pins2-board/index.html:214 |
| font-weight | `` | `600` | .pb-rt strong · 2026-09-14-pins2-board/index.html:214 |
| font-style | `` | `normal` | .pb-rt strong · 2026-09-14-pins2-board/index.html:214 |
| font-variant-numeric | `` | `normal` | .pb-rt strong · 2026-09-14-pins2-board/index.html:214 |
| line-height | `` | `15.6px` | .pb-rt strong · 2026-09-14-pins2-board/index.html:214 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-rt strong · 2026-09-14-pins2-board/index.html:214 |


### `span.pb-ln`

inside `.pb-rt` · 4 on screen · **1 look**

#### the one look

`G9-292` · rendered **0×0** · 4 instances look like this · text “lines 1–10”

```html
<span class="pb-ln">lines 1–10</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-left | `4px` | `4px` | .pb-ln · 2026-09-14-pins2-board/index.html:286 |
| font | `500 var(--t-sm)/1 var(--data)` | `` | .pb-ln · 2026-09-14-pins2-board/index.html:286 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-ln · 2026-09-14-pins2-board/index.html:286 |
| font-size | `var(--t-sm)` | `12px` | .pb-rt span · 2026-09-14-pins2-board/index.html:215 |
| font-weight | `` | `500` | .pb-ln · 2026-09-14-pins2-board/index.html:286 |
| font-style | `` | `normal` | .pb-ln · 2026-09-14-pins2-board/index.html:286 |
| font-variant-numeric | `` | `normal` | .pb-ln · 2026-09-14-pins2-board/index.html:286 |
| line-height | `` | `12px` | .pb-ln · 2026-09-14-pins2-board/index.html:286 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-rt span · 2026-09-14-pins2-board/index.html:215 |


### `span.pb-oc`

inside `.pb-row` · 4 on screen · **4 looks**

#### look 1 of 4

`G9-293` · rendered **0×0** · 1 instance look like this · text “Update”

```html
<span class="pb-oc">Update</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-size | `` | `12px` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-weight | `` | `600` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-style | `` | `normal` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-variant-numeric | `` | `normal` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| line-height | `` | `12px` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| letter-spacing | — | `normal` | initial |
| color | `var(--o)` | `rgb(242, 194, 48)` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |

#### look 2 of 4

`G9-303` · rendered **0×0** · 1 instance look like this · text “New”

```html
<span class="pb-oc">New</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-size | `` | `12px` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-weight | `` | `600` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-style | `` | `normal` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-variant-numeric | `` | `normal` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| line-height | `` | `12px` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| letter-spacing | — | `normal` | initial |
| color | `var(--o)` | `rgb(123, 219, 99)` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |

#### look 3 of 4

`G9-316` · rendered **0×0** · 1 instance look like this · text “Warning”

```html
<span class="pb-oc">Warning</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-size | `` | `12px` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-weight | `` | `600` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-style | `` | `normal` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-variant-numeric | `` | `normal` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| line-height | `` | `12px` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| letter-spacing | — | `normal` | initial |
| color | `var(--o)` | `rgb(255, 122, 69)` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |

#### look 4 of 4

`G9-323` · rendered **0×0** · 1 instance look like this · text “Can’t read”

```html
<span class="pb-oc">Can’t read</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-size | `` | `12px` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-weight | `` | `600` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-style | `` | `normal` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-variant-numeric | `` | `normal` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| line-height | `` | `12px` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| letter-spacing | — | `normal` | initial |
| color | `var(--o)` | `rgb(255, 138, 133)` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |


### `div.pb-rd`

inside `.pb-row` · 2 on screen · **1 look**

#### the one look

`G9-294` · rendered **0×0** · 2 instances look like this

```html
<div class="pb-rd"><span class="pb-k2">Barrel</span><s>Crown-H3 Barrel</s>⟨svg.ic⟩<b>Noctkill Long Barrel</b></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| grid-column | `1 / -1` | `` | .pb-rd · 2026-09-14-pins2-board/index.html:285 |
| gap | `6px 8px` | `` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| column-gap | `8px` | `8px` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| row-gap | `6px` | `6px` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| flex-wrap | `wrap` | `wrap` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| align-items | `center` | `center` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |


### `span.pb-k2`

inside `.pb-rd` · 1 on screen · **1 look**

#### the one look

`G9-295` · rendered **0×0** · 1 instance look like this · text “Barrel”

```html
<span class="pb-k2">Barrel</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| min-width | `56px` | `56px` | .pb-rd .pb-k2 · 2026-09-14-pins2-board/index.html:223 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-rd .pb-k2 · 2026-09-14-pins2-board/index.html:223 |


### `span.pb-sl`

inside `.pb-rd` · 1 on screen · **1 look**

#### the one look

`G9-305` · rendered **0×0** · 1 instance look like this

```html
<span class="pb-sl"><span>Muzzle</span><span>Barrel</span><span>Stock</span><span>Rear grip</span><span>Ammunition</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-rd .pb-sl · 2026-09-14-pins2-board/index.html:218 |
| gap | `0` | `` | .pb-rd .pb-sl · 2026-09-14-pins2-board/index.html:218 |
| column-gap | `0px` | `0px` | .pb-rd .pb-sl · 2026-09-14-pins2-board/index.html:218 |
| row-gap | `0px` | `0px` | .pb-rd .pb-sl · 2026-09-14-pins2-board/index.html:218 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .pb-rd · 2026-09-14-pins2-board/index.html:217 |


### `div.pb-msg.pb-rd`

inside `.pb-row` · 2 on screen · **1 look**

#### the one look

`G9-317` · rendered **0×0** · 2 instances look like this

```html
<div class="pb-rd pb-msg"><span><code>wobble</code> isn’t a badge — saved with Meta only</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| grid-column | `1 / -1` | `` | .pb-rd · 2026-09-14-pins2-board/index.html:285 |
| gap | `6px 8px` | `` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| column-gap | `8px` | `8px` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| row-gap | `6px` | `6px` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| flex-wrap | `wrap` | `wrap` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| align-items | `center` | `center` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-rd.pb-msg · 2026-09-14-pins2-board/index.html:224 |


### `span.why`

inside `.dw-f` · 1 on screen · **1 look**

#### the one look

`G9-327` · rendered **0×0** · 1 instance look like this · text “Block 4 is skipped”

```html
<span class="why">Block 4 is skipped</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| align-self | `center` | `center` | .dw-f .why · 2026-09-14-pins2-board/app.css:6574 |
| max-width | `52%` | `52%` | .dw-f .why · 2026-09-14-pins2-board/app.css:6574 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-right | `auto` | `auto` | .dw-f .why · 2026-09-14-pins2-board/app.css:6574 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | .dw-f .why · 2026-09-14-pins2-board/app.css:6574 |
| font-weight | — | `400` | initial |
| line-height | `var(--lh-ui)` | `16.2px` | .dw-f .why · 2026-09-14-pins2-board/app.css:6574 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .dw-f .why · 2026-09-14-pins2-board/app.css:6574 |


## G10 · Compare — resting


### G10 stage

39 distinct signatures on screen; 37 not already specced above.


### `div.pb-states`

inside `.pb-stage` · 1 on screen · **1 look**

#### the one look

`G10-1` · rendered **854×42** · 1 instance look like this

```html
<div class="pb-states" style="width:auto;max-width:1040px"><span>State</span> <div class="seg pb-seg" data-seg="views"> <span class="pb-thumb" style="width: 99px; transform: translateX(3px);"></span> <button aria-pressed="true" data-v="0">One weapon</button><button aria-pressed="false" data-v="1">Two weapons</button><button aria-pressed="false" data-v="2">One build</button><button aria-pressed="false" data-v="3">Empt
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-states · 2026-09-14-pins2-board/index.html:25 |
| gap | `12px` | `` | .pb-states · 2026-09-14-pins2-board/index.html:25 |
| column-gap | `12px` | `12px` | .pb-states · 2026-09-14-pins2-board/index.html:25 |
| row-gap | `12px` | `12px` | .pb-states · 2026-09-14-pins2-board/index.html:25 |
| align-items | `center` | `center` | .pb-states · 2026-09-14-pins2-board/index.html:25 |
| width | `auto` | `854px` | style attribute |
| max-width | `1040px` | `1040px` | style attribute |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0 auto 20px` | `` | .pb-states · 2026-09-14-pins2-board/index.html:25 |
| margin-top | `0px` | `0px` | .pb-states · 2026-09-14-pins2-board/index.html:25 |
| margin-right | `auto` | `0px` | .pb-states · 2026-09-14-pins2-board/index.html:25 |
| margin-bottom | `20px` | `20px` | .pb-states · 2026-09-14-pins2-board/index.html:25 |
| margin-left | `auto` | `0px` | .pb-states · 2026-09-14-pins2-board/index.html:25 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span`

inside `.pb-states` · 9 on screen · **2 looks**

#### look 1 of 2

`G10-2` · rendered **32×18** · 5 instances look like this · text “State”

```html
<span>State</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | .pb-states > span · 2026-09-14-pins2-board/index.html:26 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-states > span · 2026-09-14-pins2-board/index.html:26 |

#### look 2 of 2

`G10-112` · rendered **0×0** · 1 instance look like this · text “not shown”

```html
<span>not shown</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | .cmpstat span · 2026-09-14-pins2-board/app.css:6777 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--warn)` | `rgb(255, 122, 69)` | .cmpstat.pb-over b, .cmpstat.pb-over span · 2026-09-14-pins2-board/index.html:125 |


### `section.pb-panel`

inside `.pb-stage` · 1 on screen · **1 look**

#### the one look

`G10-5` · rendered **854×630** · 1 instance look like this

```html
<section class="pb-panel"> <div class="pb-view" data-view="0"> <div class="cmpbar"> <div class="wsrch" style="flex:1;max-width:340px"><label class="dwfield"><input placeholder="Add a weapon" aria-label="Add a weapon"></label></div> <span class="cmppick"><button class="chip on">BAL-27</button><span class="cmpbrow"><button class="chip" aria-pressed="true">1</button><button class="chip" aria-pressed="true">2</button><bu
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | article, aside, footer, header, hgroup, main, nav, search, section · user-agent:? |
| width | `100%` | `854px` | .pb-panel · 2026-09-14-pins2-board/index.html:100 |
| min-width | `0px` | `0px` | main .panel, main section · 2026-09-14-pins2-board/app.css:659 |
| max-width | `1040px` | `1040px` | .pb-panel · 2026-09-14-pins2-board/index.html:100 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0 auto` | `` | .pb-panel · 2026-09-14-pins2-board/index.html:100 |
| margin-top | `0px` | `0px` | .pb-panel · 2026-09-14-pins2-board/index.html:100 |
| margin-right | `auto` | `0px` | .pb-panel · 2026-09-14-pins2-board/index.html:100 |
| margin-bottom | `0px` | `0px` | .pb-panel · 2026-09-14-pins2-board/index.html:100 |
| margin-left | `auto` | `0px` | .pb-panel · 2026-09-14-pins2-board/index.html:100 |
| border-radius | `var(--rad-3)` | `` | .pb-panel · 2026-09-14-pins2-board/index.html:100 |
| background | `var(--paper)` | `` | .pb-panel · 2026-09-14-pins2-board/index.html:100 |
| background-color | `` | `rgb(23, 30, 36)` | .pb-panel · 2026-09-14-pins2-board/index.html:100 |
| background-image | `` | `none` | .pb-panel · 2026-09-14-pins2-board/index.html:100 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-panel · 2026-09-14-pins2-board/index.html:100 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-panel · 2026-09-14-pins2-board/index.html:100 |
| overflow-x | `hidden` | `hidden` | .pb-panel · 2026-09-14-pins2-board/index.html:100 |
| overflow-y | `hidden` | `hidden` | .pb-panel · 2026-09-14-pins2-board/index.html:100 |


### `div.pb-view`

inside `.pb-panel` · 1 on screen · **1 look**

#### the one look

`G10-6` · rendered **854×630** · 1 instance look like this

```html
<div class="pb-view" data-view="0"> <div class="cmpbar"> <div class="wsrch" style="flex:1;max-width:340px"><label class="dwfield"><input placeholder="Add a weapon" aria-label="Add a weapon"></label></div> <span class="cmppick"><button class="chip on">BAL-27</button><span class="cmpbrow"><button class="chip" aria-pressed="true">1</button><button class="chip" aria-pressed="true">2</button><button class="chip" aria-pres
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.cmpbar`

inside `.pb-view` · 4 on screen · **2 looks**

#### look 1 of 2

`G10-7` · rendered **854×57** · 1 instance look like this

```html
<div class="cmpbar"> <div class="wsrch" style="flex:1;max-width:340px"><label class="dwfield"><input placeholder="Add a weapon" aria-label="Add a weapon"></label></div> <span class="cmppick"><button class="chip on">BAL-27</button><span class="cmpbrow"><button class="chip" aria-pressed="true">1</button><button class="chip" aria-pressed="true">2</button><button class="chip" aria-pressed="true">3</button><button class="
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .cmpbar · 2026-09-14-pins2-board/app.css:2313 |
| gap | `9px` | `` | .cmpbar · 2026-09-14-pins2-board/app.css:6755 |
| column-gap | `9px` | `9px` | .cmpbar · 2026-09-14-pins2-board/app.css:6755 |
| row-gap | `9px` | `9px` | .cmpbar · 2026-09-14-pins2-board/app.css:6755 |
| flex-wrap | `wrap` | `wrap` | .cmpbar · 2026-09-14-pins2-board/app.css:2313 |
| align-items | `flex-end` | `flex-end` | .cmpbar · 2026-09-14-pins2-board/app.css:6755 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `13px 16px 0` | `` | .cmpbar · 2026-09-14-pins2-board/app.css:2313 |
| padding-top | `13px` | `13px` | .cmpbar · 2026-09-14-pins2-board/app.css:2313 |
| padding-right | `16px` | `16px` | .cmpbar · 2026-09-14-pins2-board/app.css:2313 |
| padding-bottom | `0px` | `0px` | .cmpbar · 2026-09-14-pins2-board/app.css:2313 |
| padding-left | `16px` | `16px` | .cmpbar · 2026-09-14-pins2-board/app.css:2313 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G10-86` · rendered **0×0** · 3 instances look like this

```html
<div class="cmpbar"> <div class="wsrch" style="flex:1;max-width:260px"><label class="dwfield"><input placeholder="6 of 6 columns" disabled="" aria-label="Add a weapon"></label></div> <span class="cmppick"><button class="chip on">BAL-27</button><span class="cmpbrow"><button class="chip" aria-pressed="true">1</button><button class="chip" aria-pressed="true">2</button><button class="chip" aria-pressed="true">3</button><
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .cmpbar · 2026-09-14-pins2-board/app.css:2313 |
| gap | `9px` | `` | .cmpbar · 2026-09-14-pins2-board/app.css:6755 |
| column-gap | `9px` | `9px` | .cmpbar · 2026-09-14-pins2-board/app.css:6755 |
| row-gap | `9px` | `9px` | .cmpbar · 2026-09-14-pins2-board/app.css:6755 |
| flex-wrap | `wrap` | `wrap` | .cmpbar · 2026-09-14-pins2-board/app.css:2313 |
| align-items | `flex-end` | `flex-end` | .cmpbar · 2026-09-14-pins2-board/app.css:6755 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `13px 16px 0` | `` | .cmpbar · 2026-09-14-pins2-board/app.css:2313 |
| padding-top | `13px` | `13px` | .cmpbar · 2026-09-14-pins2-board/app.css:2313 |
| padding-right | `16px` | `16px` | .cmpbar · 2026-09-14-pins2-board/app.css:2313 |
| padding-bottom | `0px` | `0px` | .cmpbar · 2026-09-14-pins2-board/app.css:2313 |
| padding-left | `16px` | `16px` | .cmpbar · 2026-09-14-pins2-board/app.css:2313 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.wsrch`

inside `.cmpbar` · 4 on screen · **2 looks**

#### look 1 of 2

`G10-8` · rendered **340×44** · 1 instance look like this

```html
<div class="wsrch" style="flex:1;max-width:340px"><label class="dwfield"><input placeholder="Add a weapon" aria-label="Add a weapon"></label></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .wsrch · 2026-09-14-pins2-board/app.css:6739 |
| flex | `1` | `` | style attribute |
| max-width | `340px` | `340px` | style attribute |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G10-87` · rendered **0×0** · 3 instances look like this

```html
<div class="wsrch" style="flex:1;max-width:260px"><label class="dwfield"><input placeholder="6 of 6 columns" disabled="" aria-label="Add a weapon"></label></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .wsrch · 2026-09-14-pins2-board/app.css:6739 |
| flex | `1` | `` | style attribute |
| max-width | `260px` | `260px` | style attribute |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `label.dwfield`

inside `.wsrch` · 4 on screen · **2 looks**

#### look 1 of 2

`G10-9` · rendered **340×44** · 1 instance look like this

```html
<label class="dwfield"><input placeholder="Add a weapon" aria-label="Add a weapon"></label>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| gap | `var(--s2)` | `` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| column-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| row-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| flex-direction | `column` | `column` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `0px` | `0px` | .pb-stage .dwfield · 2026-09-14-pins2-board/index.html:34 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | label · 2026-09-14-pins2-board/app.css:648 |
| font-weight | `600` | `600` | label · 2026-09-14-pins2-board/app.css:648 |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | label · 2026-09-14-pins2-board/app.css:648 |
| cursor | `default` | `default` | label · user-agent:? |

**:hover** — changes nothing on the element itself

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself

#### look 2 of 2

`G10-88` · rendered **0×0** · 3 instances look like this

```html
<label class="dwfield"><input placeholder="6 of 6 columns" disabled="" aria-label="Add a weapon"></label>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| gap | `var(--s2)` | `` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| column-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| row-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| flex-direction | `column` | `column` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `0px` | `0px` | .pb-stage .dwfield · 2026-09-14-pins2-board/index.html:34 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | label · 2026-09-14-pins2-board/app.css:648 |
| font-weight | `600` | `600` | label · 2026-09-14-pins2-board/app.css:648 |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | label · 2026-09-14-pins2-board/app.css:648 |
| cursor | `default` | `default` | label · user-agent:? |

**:hover** — changes nothing on the element itself

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself


### `span.cmppick`

inside `.cmpbar` · 4 on screen · **2 looks**

#### look 1 of 2

`G10-10` · rendered **257×42** · 1 instance look like this

```html
<span class="cmppick"><button class="chip on">BAL-27</button><span class="cmpbrow"><button class="chip" aria-pressed="true">1</button><button class="chip" aria-pressed="true">2</button><button class="chip" aria-pressed="true">3</button><button class="chip" aria-pressed="true">4</button><button class="chip" aria-pressed="true">5</button></span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| gap | `6px` | `` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| column-gap | `6px` | `6px` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| row-gap | `6px` | `6px` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| flex-wrap | `wrap` | `wrap` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| align-items | `center` | `center` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `4px 6px 4px 4px` | `` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| padding-top | `4px` | `4px` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| padding-right | `6px` | `6px` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| padding-bottom | `4px` | `4px` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| padding-left | `4px` | `4px` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| border | `1px solid var(--rule2)` | `` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| border-radius | `var(--rad-pill)` | `` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G10-89` · rendered **0×0** · 3 instances look like this

```html
<span class="cmppick"><button class="chip on">BAL-27</button><span class="cmpbrow"><button class="chip" aria-pressed="true">1</button><button class="chip" aria-pressed="true">2</button><button class="chip" aria-pressed="true">3</button><button class="chip pb-cut">4</button><button class="chip pb-cut">5</button></span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| gap | `6px` | `` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| column-gap | `6px` | `6px` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| row-gap | `6px` | `6px` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| flex-wrap | `wrap` | `wrap` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| align-items | `center` | `center` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `4px 6px 4px 4px` | `` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| padding-top | `4px` | `4px` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| padding-right | `6px` | `6px` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| padding-bottom | `4px` | `4px` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| padding-left | `4px` | `4px` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| border | `1px solid var(--rule2)` | `` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| border-radius | `var(--rad-pill)` | `` | .cmppick · 2026-09-14-pins2-board/app.css:6763 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `button.chip.on`

inside `.cmppick` · 4 on screen · **2 looks**

#### look 1 of 2

`G10-11` · rendered **65×32** · 1 instance look like this · text “BAL-27”

```html
<button class="chip on">BAL-27</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .cmpbar .chip.on · 2026-09-14-pins2-board/app.css:6778 |
| gap | `6px` | `` | .cmpbar .chip.on · 2026-09-14-pins2-board/app.css:6778 |
| column-gap | `6px` | `6px` | .cmpbar .chip.on · 2026-09-14-pins2-board/app.css:6778 |
| row-gap | `6px` | `6px` | .cmpbar .chip.on · 2026-09-14-pins2-board/app.css:6778 |
| align-items | `center` | `center` | .cmpbar .chip.on · 2026-09-14-pins2-board/app.css:6778 |
| justify-content | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| min-height | `32px` | `32px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `6px 11px` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-top | `6px` | `6px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-right | `11px` | `11px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-bottom | `6px` | `6px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-left | `11px` | `11px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| border | `1px solid var(--rule2)` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| border-color | `transparent` | `` | .cmppick .chip.on · 2026-09-14-pins2-board/app.css:6765 |
| border-radius | `var(--rad-pill)` | `` | .chip, .seg button, .tbdsw button · 2026-09-14-pins2-board/app.css:4478 |
| background | `var(--hi)` | `` | .cmpbar .chip.on · 2026-09-14-pins2-board/app.css:2315 |
| background-color | `` | `rgb(35, 44, 52)` | .cmpbar .chip.on · 2026-09-14-pins2-board/app.css:2315 |
| background-image | `` | `none` | .cmpbar .chip.on · 2026-09-14-pins2-board/app.css:2315 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `var(--t-sm)` | `12px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | `600` | `600` | .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `18px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| text-decoration | `none` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .cmpbar .chip.on · 2026-09-14-pins2-board/app.css:2315 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | button · 2026-09-14-pins2-board/app.css:600 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| transform | `none` | `matrix(1, 0, 0, 1, 0, -1)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |

#### look 2 of 2

`G10-90` · rendered **0×0** · 3 instances look like this · text “BAL-27”

```html
<button class="chip on">BAL-27</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .cmpbar .chip.on · 2026-09-14-pins2-board/app.css:6778 |
| gap | `6px` | `` | .cmpbar .chip.on · 2026-09-14-pins2-board/app.css:6778 |
| column-gap | `6px` | `6px` | .cmpbar .chip.on · 2026-09-14-pins2-board/app.css:6778 |
| row-gap | `6px` | `6px` | .cmpbar .chip.on · 2026-09-14-pins2-board/app.css:6778 |
| align-items | `center` | `center` | .cmpbar .chip.on · 2026-09-14-pins2-board/app.css:6778 |
| justify-content | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| min-height | `32px` | `32px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `6px 11px` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-top | `6px` | `6px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-right | `11px` | `11px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-bottom | `6px` | `6px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-left | `11px` | `11px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| border | `1px solid var(--rule2)` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| border-color | `transparent` | `` | .cmppick .chip.on · 2026-09-14-pins2-board/app.css:6765 |
| border-radius | `var(--rad-pill)` | `` | .chip, .seg button, .tbdsw button · 2026-09-14-pins2-board/app.css:4478 |
| background | `var(--hi)` | `` | .cmpbar .chip.on · 2026-09-14-pins2-board/app.css:2315 |
| background-color | `` | `rgb(35, 44, 52)` | .cmpbar .chip.on · 2026-09-14-pins2-board/app.css:2315 |
| background-image | `` | `none` | .cmpbar .chip.on · 2026-09-14-pins2-board/app.css:2315 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `var(--t-sm)` | `12px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | `600` | `600` | .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `18px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| text-decoration | `none` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .cmpbar .chip.on · 2026-09-14-pins2-board/app.css:2315 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | button · 2026-09-14-pins2-board/app.css:600 |

**:hover** — changes nothing on the element itself

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself


### `span.cmpbrow`

inside `.cmppick` · 4 on screen · **2 looks**

#### look 1 of 2

`G10-12` · rendered **175×32** · 1 instance look like this

```html
<span class="cmpbrow"><button class="chip" aria-pressed="true">1</button><button class="chip" aria-pressed="true">2</button><button class="chip" aria-pressed="true">3</button><button class="chip" aria-pressed="true">4</button><button class="chip" aria-pressed="true">5</button></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .cmpbrow · 2026-09-14-pins2-board/app.css:6766 |
| gap | `5px` | `` | .cmpbrow · 2026-09-14-pins2-board/app.css:6766 |
| column-gap | `5px` | `5px` | .cmpbrow · 2026-09-14-pins2-board/app.css:6766 |
| row-gap | `5px` | `5px` | .cmpbrow · 2026-09-14-pins2-board/app.css:6766 |
| flex-wrap | `wrap` | `wrap` | .cmpbrow · 2026-09-14-pins2-board/app.css:6766 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G10-91` · rendered **0×0** · 3 instances look like this

```html
<span class="cmpbrow"><button class="chip" aria-pressed="true">1</button><button class="chip" aria-pressed="true">2</button><button class="chip" aria-pressed="true">3</button><button class="chip pb-cut">4</button><button class="chip pb-cut">5</button></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .cmpbrow · 2026-09-14-pins2-board/app.css:6766 |
| gap | `5px` | `` | .cmpbrow · 2026-09-14-pins2-board/app.css:6766 |
| column-gap | `5px` | `5px` | .cmpbrow · 2026-09-14-pins2-board/app.css:6766 |
| row-gap | `5px` | `5px` | .cmpbrow · 2026-09-14-pins2-board/app.css:6766 |
| flex-wrap | `wrap` | `wrap` | .cmpbrow · 2026-09-14-pins2-board/app.css:6766 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `button.chip`

inside `.cmpbrow` · 13 on screen · **3 looks**

#### look 1 of 3

`G10-13` · rendered **29×32** · 5 instances look like this · text “1” · aria-pressed="true"

```html
<button class="chip" aria-pressed="true">1</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .chip · 2026-09-14-pins2-board/app.css:938 |
| align-items | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| justify-content | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| min-height | `32px` | `32px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `6px 11px` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-top | `6px` | `6px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-right | `11px` | `11px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-bottom | `6px` | `6px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-left | `11px` | `11px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| border | `1px solid var(--rule2)` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| border-color | `var(--ink4)` | `` | .chip[aria-pressed="true"] · 2026-09-14-pins2-board/app.css:941 |
| border-radius | `var(--rad-pill)` | `` | .chip, .seg button, .tbdsw button · 2026-09-14-pins2-board/app.css:4478 |
| background | `var(--hi)` | `` | .chip[aria-pressed="true"] · 2026-09-14-pins2-board/app.css:941 |
| background-color | `` | `rgb(35, 44, 52)` | .chip[aria-pressed="true"] · 2026-09-14-pins2-board/app.css:941 |
| background-image | `` | `none` | .chip[aria-pressed="true"] · 2026-09-14-pins2-board/app.css:941 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `var(--t-sm)` | `12px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | `600` | `600` | .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `18px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| text-decoration | `none` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .chip[aria-pressed="true"] · 2026-09-14-pins2-board/app.css:941 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | button · 2026-09-14-pins2-board/app.css:600 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `rgb(35, 44, 52)` | `rgb(42, 52, 61)` |
| transform | `none` | `matrix(1, 0, 0, 1, 0, -1)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |

#### look 2 of 3

`G10-84` · rendered **111×32** · 1 instance look like this

```html
<button class="chip">⟨svg.ic⟩Show cards</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `inline-flex` | .chip · 2026-09-14-pins2-board/app.css:938 |
| gap | `8px` | `` | .pb-fold .chip · 2026-09-14-pins2-board/index.html:122 |
| column-gap | `8px` | `8px` | .pb-fold .chip · 2026-09-14-pins2-board/index.html:122 |
| row-gap | `8px` | `8px` | .pb-fold .chip · 2026-09-14-pins2-board/index.html:122 |
| align-items | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| justify-content | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| min-height | `32px` | `32px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `6px 11px` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-top | `6px` | `6px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-right | `11px` | `11px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-bottom | `6px` | `6px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-left | `11px` | `11px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| border | `1px solid var(--rule2)` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| border-radius | `var(--rad-pill)` | `` | .chip, .seg button, .tbdsw button · 2026-09-14-pins2-board/app.css:4478 |
| background | `var(--sunk)` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| background-color | `` | `rgb(11, 15, 18)` | .chip · 2026-09-14-pins2-board/app.css:938 |
| background-image | `` | `none` | .chip · 2026-09-14-pins2-board/app.css:938 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `var(--t-sm)` | `12px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | `600` | `600` | .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `18px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| text-decoration | `none` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .chip · 2026-09-14-pins2-board/app.css:938 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | button · 2026-09-14-pins2-board/app.css:600 |

**:hover** — changes; parts inside it respond (table below)

| property | at rest | hover |
|---|---|---|
| background-color | `rgb(11, 15, 18)` | `rgb(42, 52, 61)` |
| color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| transform | `none` | `matrix(1, 0, 0, 1, 0, -1)` |

| part inside | property | at rest | hover |
|---|---|---|---|
| ::before | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::before | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::before | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::after | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::after | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::after | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| svg.ic | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| svg.ic | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| svg.ic | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| svg.ic | stroke | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| use | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| use | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| use | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| use | stroke | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |

#### look 3 of 3

`G10-92` · rendered **0×0** · 7 instances look like this · text “1” · aria-pressed="true"

```html
<button class="chip" aria-pressed="true">1</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .chip · 2026-09-14-pins2-board/app.css:938 |
| align-items | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| justify-content | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| min-height | `32px` | `32px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `6px 11px` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-top | `6px` | `6px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-right | `11px` | `11px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-bottom | `6px` | `6px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-left | `11px` | `11px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| border | `1px solid var(--rule2)` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| border-color | `var(--ink4)` | `` | .chip[aria-pressed="true"] · 2026-09-14-pins2-board/app.css:941 |
| border-radius | `var(--rad-pill)` | `` | .chip, .seg button, .tbdsw button · 2026-09-14-pins2-board/app.css:4478 |
| background | `var(--hi)` | `` | .chip[aria-pressed="true"] · 2026-09-14-pins2-board/app.css:941 |
| background-color | `` | `rgb(35, 44, 52)` | .chip[aria-pressed="true"] · 2026-09-14-pins2-board/app.css:941 |
| background-image | `` | `none` | .chip[aria-pressed="true"] · 2026-09-14-pins2-board/app.css:941 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `var(--t-sm)` | `12px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | `600` | `600` | .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `18px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| text-decoration | `none` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .chip[aria-pressed="true"] · 2026-09-14-pins2-board/app.css:941 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | button · 2026-09-14-pins2-board/app.css:600 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `rgb(35, 44, 52)` | `rgb(42, 52, 61)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself


### `div.cmpstats`

inside `.pb-view` · 2 on screen · **2 looks**

#### look 1 of 2

`G10-18` · rendered **822×36** · 1 instance look like this

```html
<div class="cmpstats"><span class="cmpstat"><b>5</b><span>builds</span></span><span class="cmpstat"><b>6</b><span>slots used</span></span><span class="cmpstat"><b>5</b><span>differ</span></span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| gap | `8px` | `` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| column-gap | `8px` | `8px` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| row-gap | `8px` | `8px` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| flex-wrap | `wrap` | `wrap` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `12px 16px 16px` | `` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| margin-top | `12px` | `12px` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| margin-right | `16px` | `16px` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| margin-bottom | `16px` | `16px` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| margin-left | `16px` | `16px` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G10-103` · rendered **0×0** · 1 instance look like this

```html
<div class="cmpstats"><span class="cmpstat"><b>6</b><span>builds</span></span><span class="cmpstat"><b>7</b><span>slots used</span></span><span class="cmpstat pb-over"><b>2</b><span>not shown</span></span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| gap | `8px` | `` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| column-gap | `8px` | `8px` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| row-gap | `8px` | `8px` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| flex-wrap | `wrap` | `wrap` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `12px 16px 16px` | `` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| margin-top | `12px` | `12px` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| margin-right | `16px` | `16px` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| margin-bottom | `16px` | `16px` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| margin-left | `16px` | `16px` | .cmpstats · 2026-09-14-pins2-board/app.css:6772 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.cmpstat`

inside `.cmpstats` · 5 on screen · **2 looks**

#### look 1 of 2

`G10-19` · rendered **77×36** · 3 instances look like this

```html
<span class="cmpstat"><b>5</b><span>builds</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| gap | `6px` | `` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| column-gap | `6px` | `6px` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| row-gap | `6px` | `6px` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| align-items | `baseline` | `baseline` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `7px 13px` | `` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| padding-top | `7px` | `7px` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| padding-right | `13px` | `13px` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| padding-bottom | `7px` | `7px` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| padding-left | `13px` | `13px` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| border | `1px solid var(--rule)` | `` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| border-radius | `var(--rad-pill)` | `` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| background | `var(--sunk)` | `` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| background-color | `` | `rgb(11, 15, 18)` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| background-image | `` | `none` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G10-104` · rendered **0×0** · 2 instances look like this

```html
<span class="cmpstat"><b>6</b><span>builds</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| gap | `6px` | `` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| column-gap | `6px` | `6px` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| row-gap | `6px` | `6px` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| align-items | `baseline` | `baseline` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `7px 13px` | `` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| padding-top | `7px` | `7px` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| padding-right | `13px` | `13px` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| padding-bottom | `7px` | `7px` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| padding-left | `13px` | `13px` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| border | `1px solid var(--rule)` | `` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| border-radius | `var(--rad-pill)` | `` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| background | `var(--sunk)` | `` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| background-color | `` | `rgb(11, 15, 18)` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| background-image | `` | `none` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `b`

inside `.cmpstat` · 11 on screen · **6 looks**

#### look 1 of 6

`G10-20` · rendered **8×20** · 3 instances look like this · text “5”

```html
<b>5</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | `var(--data)` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .cmpstat b · 2026-09-14-pins2-board/app.css:6775 |
| font-size | `var(--t-base)` | `13px` | .cmpstat b · 2026-09-14-pins2-board/app.css:6775 |
| font-weight | `600` | `600` | .cmpstat b · 2026-09-14-pins2-board/app.css:6775 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .cmpstat b · 2026-09-14-pins2-board/app.css:6775 |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .cmpstat b · 2026-09-14-pins2-board/app.css:6775 |

#### look 2 of 6

`G10-80` · rendered **98×12** · 2 instances look like this · text “60 Round Reload”

```html
<b>60 Round Reload</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-left | `6px` | `6px` | .pb-same .pill b · 2026-09-14-pins2-board/index.html:120 |
| font | ↑ `500 var(--t-base)/1 var(--ui)` | `` | inherited · .pill · 2026-09-14-pins2-board/app.css:4243 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pill · 2026-09-14-pins2-board/app.css:4243 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .pb-same .pill · 2026-09-14-pins2-board/index.html:119 |
| font-weight | `600` | `600` | .pb-same .pill b · 2026-09-14-pins2-board/index.html:120 |
| font-style | ↑ `` | `normal` | inherited · .pill · 2026-09-14-pins2-board/app.css:4243 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pill · 2026-09-14-pins2-board/app.css:4243 |
| line-height | ↑ `` | `12px` | inherited · .pill · 2026-09-14-pins2-board/app.css:4243 |
| letter-spacing | — | `normal` | initial |
| white-space | ↑ `nowrap` | `` | inherited · .pill · 2026-09-14-pins2-board/app.css:4243 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-same .pill b · 2026-09-14-pins2-board/index.html:120 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pill · 2026-09-14-pins2-board/app.css:4243 |

#### look 3 of 6

`G10-105` · rendered **0×0** · 2 instances look like this · text “6”

```html
<b>6</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | `var(--data)` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .cmpstat b · 2026-09-14-pins2-board/app.css:6775 |
| font-size | `var(--t-base)` | `13px` | .cmpstat b · 2026-09-14-pins2-board/app.css:6775 |
| font-weight | `600` | `600` | .cmpstat b · 2026-09-14-pins2-board/app.css:6775 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .cmpstat b · 2026-09-14-pins2-board/app.css:6775 |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .cmpstat b · 2026-09-14-pins2-board/app.css:6775 |

#### look 4 of 6

`G10-111` · rendered **0×0** · 1 instance look like this · text “2”

```html
<b>2</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | `var(--data)` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .cmpstat b · 2026-09-14-pins2-board/app.css:6775 |
| font-size | `var(--t-base)` | `13px` | .cmpstat b · 2026-09-14-pins2-board/app.css:6775 |
| font-weight | `600` | `600` | .cmpstat b · 2026-09-14-pins2-board/app.css:6775 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .cmpstat b · 2026-09-14-pins2-board/app.css:6775 |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--warn)` | `rgb(255, 122, 69)` | .cmpstat.pb-over b, .cmpstat.pb-over span · 2026-09-14-pins2-board/index.html:125 |

#### look 5 of 6

`G10-178` · rendered **0×0** · 1 instance look like this · text “AR”

```html
<b>AR</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-left | `6px` | `6px` | .pb-same .pill b · 2026-09-14-pins2-board/index.html:120 |
| font | ↑ `500 var(--t-base)/1 var(--ui)` | `` | inherited · .pill · 2026-09-14-pins2-board/app.css:4243 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pill · 2026-09-14-pins2-board/app.css:4243 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .pb-same .pill · 2026-09-14-pins2-board/index.html:119 |
| font-weight | `600` | `600` | .pb-same .pill b · 2026-09-14-pins2-board/index.html:120 |
| font-style | ↑ `` | `normal` | inherited · .pill · 2026-09-14-pins2-board/app.css:4243 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pill · 2026-09-14-pins2-board/app.css:4243 |
| line-height | ↑ `` | `12px` | inherited · .pill · 2026-09-14-pins2-board/app.css:4243 |
| letter-spacing | — | `normal` | initial |
| white-space | ↑ `nowrap` | `` | inherited · .pill · 2026-09-14-pins2-board/app.css:4243 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-same .pill b · 2026-09-14-pins2-board/index.html:120 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pill · 2026-09-14-pins2-board/app.css:4243 |

#### look 6 of 6

`G10-187` · rendered **0×0** · 2 instances look like this · text “DL Q33 has one build”

```html
<b>DL Q33 has one build</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .empty b · 2026-09-14-pins2-board/app.css:997 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `6px` | `6px` | .empty b · 2026-09-14-pins2-board/app.css:997 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-lg)` | `16.5px` | .empty b · 2026-09-14-pins2-board/app.css:997 |
| font-weight | `bolder` | `700` | strong, b · user-agent:? |
| line-height | ↑ `1.5` | `24.75px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| text-align | ↑ `center` | `center` | inherited · .empty · 2026-09-14-pins2-board/app.css:996 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .empty b · 2026-09-14-pins2-board/app.css:997 |


### `div.pb-cmp`

inside `.pb-view` · 2 on screen · **2 looks**

#### look 1 of 2

`G10-28` · rendered **854×510** · 1 instance look like this

```html
<div class="pb-cmp"> <div class="pb-scroll"><table class="pb-tbl"> <thead><tr><th class="pb-k"></th><th class="pb-base">Build 1<small>baseline</small></th><th>Build 2</th><th>Build 3</th><th>Build 4</th><th>Build 5</th></tr></thead> <tbody> <tr><th class="pb-k" scope="row">Muzzle</th><td class="pb-base"><span class="pb-v">Gauge-9 Mono</span></td><td><span class="pb-v">Gauge-9 Mono</span></td><td><span class="pb-v pb-
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-cmp · 2026-09-14-pins2-board/index.html:101 |
| gap | `16px` | `` | .pb-cmp · 2026-09-14-pins2-board/index.html:101 |
| column-gap | `16px` | `16px` | .pb-cmp · 2026-09-14-pins2-board/index.html:101 |
| row-gap | `16px` | `16px` | .pb-cmp · 2026-09-14-pins2-board/index.html:101 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `4px 16px 16px` | `` | .pb-cmp · 2026-09-14-pins2-board/index.html:101 |
| padding-top | `4px` | `4px` | .pb-cmp · 2026-09-14-pins2-board/index.html:101 |
| padding-right | `16px` | `16px` | .pb-cmp · 2026-09-14-pins2-board/index.html:101 |
| padding-bottom | `16px` | `16px` | .pb-cmp · 2026-09-14-pins2-board/index.html:101 |
| padding-left | `16px` | `16px` | .pb-cmp · 2026-09-14-pins2-board/index.html:101 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G10-113` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-cmp"><div class="pb-scroll"><table class="pb-tbl"> <thead><tr><th class="pb-k"></th><th class="pb-base">BAL-27 · 1<small>baseline</small></th><th>BAL-27 · 2</th><th>BAL-27 · 3</th><th>FFAR 1 · 1</th><th>FFAR 1 · 2</th><th>FFAR 1 · 3</th></tr></thead> <tbody> <tr><th class="pb-k" scope="row">Muzzle</th><td class="pb-base"><span class="pb-v">Gauge-9 Mono</span></td><td><span class="pb-v">Gauge-9 Mono</sp
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-cmp · 2026-09-14-pins2-board/index.html:101 |
| gap | `16px` | `` | .pb-cmp · 2026-09-14-pins2-board/index.html:101 |
| column-gap | `16px` | `16px` | .pb-cmp · 2026-09-14-pins2-board/index.html:101 |
| row-gap | `16px` | `16px` | .pb-cmp · 2026-09-14-pins2-board/index.html:101 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `4px 16px 16px` | `` | .pb-cmp · 2026-09-14-pins2-board/index.html:101 |
| padding-top | `4px` | `4px` | .pb-cmp · 2026-09-14-pins2-board/index.html:101 |
| padding-right | `16px` | `16px` | .pb-cmp · 2026-09-14-pins2-board/index.html:101 |
| padding-bottom | `16px` | `16px` | .pb-cmp · 2026-09-14-pins2-board/index.html:101 |
| padding-left | `16px` | `16px` | .pb-cmp · 2026-09-14-pins2-board/index.html:101 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-scroll`

inside `.pb-cmp` · 2 on screen · **2 looks**

#### look 1 of 2

`G10-29` · rendered **822×385** · 1 instance look like this

```html
<div class="pb-scroll"><table class="pb-tbl"> <thead><tr><th class="pb-k"></th><th class="pb-base">Build 1<small>baseline</small></th><th>Build 2</th><th>Build 3</th><th>Build 4</th><th>Build 5</th></tr></thead> <tbody> <tr><th class="pb-k" scope="row">Muzzle</th><td class="pb-base"><span class="pb-v">Gauge-9 Mono</span></td><td><span class="pb-v">Gauge-9 Mono</span></td><td><span class="pb-v pb-d">Polarfire-S</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow-x | `auto` | `auto` | .pb-scroll · 2026-09-14-pins2-board/index.html:126 |

#### look 2 of 2

`G10-114` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-scroll"><table class="pb-tbl"> <thead><tr><th class="pb-k"></th><th class="pb-base">BAL-27 · 1<small>baseline</small></th><th>BAL-27 · 2</th><th>BAL-27 · 3</th><th>FFAR 1 · 1</th><th>FFAR 1 · 2</th><th>FFAR 1 · 3</th></tr></thead> <tbody> <tr><th class="pb-k" scope="row">Muzzle</th><td class="pb-base"><span class="pb-v">Gauge-9 Mono</span></td><td><span class="pb-v">Gauge-9 Mono</span></td><td><span cl
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow-x | `auto` | `auto` | .pb-scroll · 2026-09-14-pins2-board/index.html:126 |


### `table.pb-tbl`

inside `.pb-scroll` · 2 on screen · **2 looks**

#### look 1 of 2

`G10-30` · rendered **822×385** · 1 instance look like this

```html
<table class="pb-tbl"> <thead><tr><th class="pb-k"></th><th class="pb-base">Build 1<small>baseline</small></th><th>Build 2</th><th>Build 3</th><th>Build 4</th><th>Build 5</th></tr></thead> <tbody> <tr><th class="pb-k" scope="row">Muzzle</th><td class="pb-base"><span class="pb-v">Gauge-9 Mono</span></td><td><span class="pb-v">Gauge-9 Mono</span></td><td><span class="pb-v pb-d">Polarfire-S</span></td><td><span class="p
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `table` | `table` | table · user-agent:? |
| width | `100%` | `822px` | .pb-tbl · 2026-09-14-pins2-board/index.html:102 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-md)` | `14.5px` | table · 2026-09-14-pins2-board/app.css:944 |
| font-weight | `normal` | `400` | table · user-agent:? |
| line-height | `normal` | `normal` | table · user-agent:? |
| letter-spacing | — | `normal` | initial |
| text-align | `start` | `start` | table · user-agent:? |
| color | `-internal-quirk-inherit` | `rgb(232, 237, 241)` | table · user-agent:? |

#### look 2 of 2

`G10-115` · rendered **0×0** · 1 instance look like this

```html
<table class="pb-tbl"> <thead><tr><th class="pb-k"></th><th class="pb-base">BAL-27 · 1<small>baseline</small></th><th>BAL-27 · 2</th><th>BAL-27 · 3</th><th>FFAR 1 · 1</th><th>FFAR 1 · 2</th><th>FFAR 1 · 3</th></tr></thead> <tbody> <tr><th class="pb-k" scope="row">Muzzle</th><td class="pb-base"><span class="pb-v">Gauge-9 Mono</span></td><td><span class="pb-v">Gauge-9 Mono</span></td><td><span class="pb-v pb-d">Polarfi
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `table` | `table` | table · user-agent:? |
| width | `100%` | `100%` | .pb-tbl · 2026-09-14-pins2-board/index.html:102 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-md)` | `14.5px` | table · 2026-09-14-pins2-board/app.css:944 |
| font-weight | `normal` | `400` | table · user-agent:? |
| line-height | `normal` | `normal` | table · user-agent:? |
| letter-spacing | — | `normal` | initial |
| text-align | `start` | `start` | table · user-agent:? |
| color | `-internal-quirk-inherit` | `rgb(232, 237, 241)` | table · user-agent:? |


### `th.pb-k`

inside `.—` · 15 on screen · **4 looks**

#### look 1 of 4

`G10-31` · rendered **104×51** · 1 instance look like this

```html
<th class="pb-k"></th>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `table-cell` | `table-cell` | td, th · user-agent:? |
| position | `sticky` | `sticky` | th · 2026-09-14-pins2-board/app.css:945 |
| width | `104px` | `104px` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `10px 12px 8px` | `` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| padding-top | `10px` | `10px` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| padding-right | `12px` | `12px` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| padding-bottom | `8px` | `8px` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| padding-left | `0px` | `0px` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| top | `0px` | `0px` | th · 2026-09-14-pins2-board/app.css:945 |
| border | `0` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| border-bottom | `1px solid var(--rule)` | `` | th · 2026-09-14-pins2-board/app.css:945 |
| background | `none` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| background-image | `none` | `none` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| font | `500 var(--t-sm)/1.2 var(--ui)` | `` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-size | `` | `12px` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-weight | `` | `500` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-style | `` | `normal` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-variant-numeric | `` | `normal` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| line-height | `` | `14.4px` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| letter-spacing | `0px` | `normal` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-transform | `none` | `none` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-align | `left` | `left` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| white-space | `nowrap` | `` | th · 2026-09-14-pins2-board/app.css:945 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |

#### look 2 of 4

`G10-34` · rendered **104×42** · 6 instances look like this · text “Muzzle”

```html
<th class="pb-k" scope="row">Muzzle</th>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `table-cell` | `table-cell` | td, th · user-agent:? |
| position | `sticky` | `sticky` | th · 2026-09-14-pins2-board/app.css:945 |
| width | `104px` | `104px` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 4px` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-top | `0px` | `0px` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-right | `4px` | `4px` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-bottom | `0px` | `0px` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-left | `0px` | `0px` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| top | `0px` | `0px` | th · 2026-09-14-pins2-board/app.css:945 |
| border | `0` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| border-bottom | `1px solid var(--rule)` | `` | th · 2026-09-14-pins2-board/app.css:945 |
| background | `none` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| background-image | `none` | `none` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| font | `500 var(--t-sm)/1.2 var(--ui)` | `` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-size | `` | `12px` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-weight | `` | `500` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-style | `` | `normal` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-variant-numeric | `` | `normal` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| line-height | `` | `14.4px` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| letter-spacing | `0px` | `normal` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-transform | `none` | `none` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-align | `left` | `left` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| white-space | `nowrap` | `` | th · 2026-09-14-pins2-board/app.css:945 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |

#### look 3 of 4

`G10-116` · rendered **0×0** · 1 instance look like this

```html
<th class="pb-k"></th>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `table-cell` | `table-cell` | td, th · user-agent:? |
| position | `sticky` | `sticky` | th · 2026-09-14-pins2-board/app.css:945 |
| width | `104px` | `104px` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `10px 12px 8px` | `` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| padding-top | `10px` | `10px` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| padding-right | `12px` | `12px` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| padding-bottom | `8px` | `8px` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| padding-left | `0px` | `0px` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| top | `0px` | `0px` | th · 2026-09-14-pins2-board/app.css:945 |
| border | `0` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| border-bottom | `1px solid var(--rule)` | `` | th · 2026-09-14-pins2-board/app.css:945 |
| background | `none` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| background-image | `none` | `none` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| font | `500 var(--t-sm)/1.2 var(--ui)` | `` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-size | `` | `12px` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-weight | `` | `500` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-style | `` | `normal` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-variant-numeric | `` | `normal` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| line-height | `` | `14.4px` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| letter-spacing | `0px` | `normal` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-transform | `none` | `none` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-align | `left` | `left` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| white-space | `nowrap` | `` | th · 2026-09-14-pins2-board/app.css:945 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |

#### look 4 of 4

`G10-119` · rendered **0×0** · 7 instances look like this · text “Muzzle”

```html
<th class="pb-k" scope="row">Muzzle</th>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `table-cell` | `table-cell` | td, th · user-agent:? |
| position | `sticky` | `sticky` | th · 2026-09-14-pins2-board/app.css:945 |
| width | `104px` | `104px` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 4px` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-top | `0px` | `0px` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-right | `4px` | `4px` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-bottom | `0px` | `0px` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-left | `0px` | `0px` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| top | `0px` | `0px` | th · 2026-09-14-pins2-board/app.css:945 |
| border | `0` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| border-bottom | `1px solid var(--rule)` | `` | th · 2026-09-14-pins2-board/app.css:945 |
| background | `none` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| background-image | `none` | `none` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| font | `500 var(--t-sm)/1.2 var(--ui)` | `` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-size | `` | `12px` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-weight | `` | `500` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-style | `` | `normal` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| font-variant-numeric | `` | `normal` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| line-height | `` | `14.4px` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| letter-spacing | `0px` | `normal` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-transform | `none` | `none` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-align | `left` | `left` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| white-space | `nowrap` | `` | th · 2026-09-14-pins2-board/app.css:945 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-tbl .pb-k · 2026-09-14-pins2-board/index.html:106 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |


### `th.pb-base`

inside `.—` · 2 on screen · **2 looks**

#### look 1 of 2

`G10-32` · rendered **144×51** · 1 instance look like this

```html
<th class="pb-base">Build 1<small>baseline</small></th>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `table-cell` | `table-cell` | td, th · user-agent:? |
| position | `sticky` | `sticky` | th · 2026-09-14-pins2-board/app.css:945 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `10px 12px 8px` | `` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| padding-top | `10px` | `10px` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| padding-right | `12px` | `12px` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| padding-bottom | `8px` | `8px` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| padding-left | `12px` | `12px` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| top | `0px` | `0px` | th · 2026-09-14-pins2-board/app.css:945 |
| border | `0` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| border-bottom | `1px solid var(--rule)` | `` | th · 2026-09-14-pins2-board/app.css:945 |
| border-radius | `var(--rad-2) var(--rad-2) 0 0` | `` | .pb-tbl thead .pb-base · 2026-09-14-pins2-board/index.html:108 |
| background | `var(--sunk)` | `` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| background-image | `` | `none` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| box-shadow | `inset 1px 0 0 var(--rule),inset -1px 0 0 var(--rule)` | `rgb(42, 52, 61) 1px 0px 0px 0px inset, rgb(42, 52, 61) -1px 0px 0px 0px inset` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| font | `600 var(--t-base)/1.2 var(--ui)` | `` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| font-size | `` | `13px` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| font-weight | `` | `600` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| font-style | `` | `normal` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| font-variant-numeric | `` | `normal` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| line-height | `` | `15.6px` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| letter-spacing | `0px` | `normal` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-transform | `none` | `none` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-align | `left` | `left` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| white-space | `nowrap` | `` | th · 2026-09-14-pins2-board/app.css:945 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |

#### look 2 of 2

`G10-117` · rendered **0×0** · 1 instance look like this

```html
<th class="pb-base">BAL-27 · 1<small>baseline</small></th>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `table-cell` | `table-cell` | td, th · user-agent:? |
| position | `sticky` | `sticky` | th · 2026-09-14-pins2-board/app.css:945 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `10px 12px 8px` | `` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| padding-top | `10px` | `10px` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| padding-right | `12px` | `12px` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| padding-bottom | `8px` | `8px` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| padding-left | `12px` | `12px` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| top | `0px` | `0px` | th · 2026-09-14-pins2-board/app.css:945 |
| border | `0` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| border-bottom | `1px solid var(--rule)` | `` | th · 2026-09-14-pins2-board/app.css:945 |
| border-radius | `var(--rad-2) var(--rad-2) 0 0` | `` | .pb-tbl thead .pb-base · 2026-09-14-pins2-board/index.html:108 |
| background | `var(--sunk)` | `` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| background-image | `` | `none` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| box-shadow | `inset 1px 0 0 var(--rule),inset -1px 0 0 var(--rule)` | `rgb(42, 52, 61) 1px 0px 0px 0px inset, rgb(42, 52, 61) -1px 0px 0px 0px inset` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| font | `600 var(--t-base)/1.2 var(--ui)` | `` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| font-size | `` | `13px` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| font-weight | `` | `600` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| font-style | `` | `normal` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| font-variant-numeric | `` | `normal` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| line-height | `` | `15.6px` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |
| letter-spacing | `0px` | `normal` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-transform | `none` | `none` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-align | `left` | `left` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| white-space | `nowrap` | `` | th · 2026-09-14-pins2-board/app.css:945 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-tbl thead th · 2026-09-14-pins2-board/index.html:104 |


### `small`

inside `.pb-base` · 2 on screen · **2 looks**

#### look 1 of 2

`G10-33` · rendered **120×14** · 1 instance look like this · text “baseline”

```html
<small>baseline</small>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `3px` | `3px` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |
| font | `500 var(--t-sm)/1.2 var(--data)` | `` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |
| font-size | `` | `12px` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |
| font-weight | `` | `500` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |
| font-style | `` | `normal` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |
| font-variant-numeric | `` | `normal` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |
| line-height | `` | `14.4px` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |
| letter-spacing | ↑ `0px` | `normal` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-transform | ↑ `none` | `none` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-align | ↑ `left` | `left` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| white-space | ↑ `nowrap` | `` | inherited · th · 2026-09-14-pins2-board/app.css:945 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |

#### look 2 of 2

`G10-118` · rendered **0×0** · 1 instance look like this · text “baseline”

```html
<small>baseline</small>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `3px` | `3px` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |
| font | `500 var(--t-sm)/1.2 var(--data)` | `` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |
| font-size | `` | `12px` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |
| font-weight | `` | `500` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |
| font-style | `` | `normal` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |
| font-variant-numeric | `` | `normal` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |
| line-height | `` | `14.4px` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |
| letter-spacing | ↑ `0px` | `normal` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-transform | ↑ `none` | `none` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-align | ↑ `left` | `left` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| white-space | ↑ `nowrap` | `` | inherited · th · 2026-09-14-pins2-board/app.css:945 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-tbl thead th small · 2026-09-14-pins2-board/index.html:105 |


### `td.pb-base`

inside `.—` · 13 on screen · **4 looks**

#### look 1 of 4

`G10-35` · rendered **144×42** · 5 instances look like this

```html
<td class="pb-base"><span class="pb-v">Gauge-9 Mono</span></td>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `table-cell` | `table-cell` | td, th · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 4px` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-top | `3px (as padding-block-start)` | `3px` | .pb-tbl tbody td.pb-base · 2026-09-14-pins2-board/index.html:110 |
| padding-right | `4px` | `4px` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-bottom | `3px (as padding-block-end)` | `3px` | .pb-tbl tbody td.pb-base · 2026-09-14-pins2-board/index.html:110 |
| padding-left | `4px` | `4px` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-block | `3px` | `` | .pb-tbl tbody td.pb-base · 2026-09-14-pins2-board/index.html:110 |
| border | `0` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| border-bottom | `1px solid var(--rule3)` | `` | td · 2026-09-14-pins2-board/app.css:970 |
| background | `var(--sunk)` | `` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| background-image | `` | `none` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| box-shadow | `inset 1px 0 0 var(--rule),inset -1px 0 0 var(--rule)` | `rgb(42, 52, 61) 1px 0px 0px 0px inset, rgb(42, 52, 61) -1px 0px 0px 0px inset` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-md)` | `14.5px` | inherited · table · 2026-09-14-pins2-board/app.css:944 |
| font-weight | ↑ `normal` | `400` | inherited · table · user-agent:? |
| font-style | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| font-variant-numeric | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| line-height | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| letter-spacing | `0px` | `normal` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-transform | `none` | `none` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-align | `left` | `left` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | td · 2026-09-14-pins2-board/app.css:970 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |

#### look 2 of 4

`G10-71` · rendered **144×42** · 1 instance look like this

```html
<td class="pb-base"><span class="pb-v pb-m">1I2C6B8A9D</span></td>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `table-cell` | `table-cell` | td, th · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 4px` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-top | `3px (as padding-block-start)` | `3px` | .pb-tbl tbody td.pb-base · 2026-09-14-pins2-board/index.html:110 |
| padding-right | `4px` | `4px` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-bottom | `3px (as padding-block-end)` | `3px` | .pb-tbl tbody td.pb-base · 2026-09-14-pins2-board/index.html:110 |
| padding-left | `4px` | `4px` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-block | `3px` | `` | .pb-tbl tbody td.pb-base · 2026-09-14-pins2-board/index.html:110 |
| border | `0` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| border-bottom | `1px solid var(--rule3)` | `` | td · 2026-09-14-pins2-board/app.css:970 |
| border-radius | `0 0 var(--rad-2) var(--rad-2)` | `` | .pb-tbl tbody tr:last-child .pb-base · 2026-09-14-pins2-board/index.html:109 |
| background | `var(--sunk)` | `` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| background-image | `` | `none` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| box-shadow | `inset 1px 0 0 var(--rule),inset -1px 0 0 var(--rule)` | `rgb(42, 52, 61) 1px 0px 0px 0px inset, rgb(42, 52, 61) -1px 0px 0px 0px inset` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-md)` | `14.5px` | inherited · table · 2026-09-14-pins2-board/app.css:944 |
| font-weight | ↑ `normal` | `400` | inherited · table · user-agent:? |
| font-style | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| font-variant-numeric | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| line-height | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| letter-spacing | `0px` | `normal` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-transform | `none` | `none` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-align | `left` | `left` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | td · 2026-09-14-pins2-board/app.css:970 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |

#### look 3 of 4

`G10-120` · rendered **0×0** · 6 instances look like this

```html
<td class="pb-base"><span class="pb-v">Gauge-9 Mono</span></td>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `table-cell` | `table-cell` | td, th · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 4px` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-top | `3px (as padding-block-start)` | `3px` | .pb-tbl tbody td.pb-base · 2026-09-14-pins2-board/index.html:110 |
| padding-right | `4px` | `4px` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-bottom | `3px (as padding-block-end)` | `3px` | .pb-tbl tbody td.pb-base · 2026-09-14-pins2-board/index.html:110 |
| padding-left | `4px` | `4px` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-block | `3px` | `` | .pb-tbl tbody td.pb-base · 2026-09-14-pins2-board/index.html:110 |
| border | `0` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| border-bottom | `1px solid var(--rule3)` | `` | td · 2026-09-14-pins2-board/app.css:970 |
| background | `var(--sunk)` | `` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| background-image | `` | `none` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| box-shadow | `inset 1px 0 0 var(--rule),inset -1px 0 0 var(--rule)` | `rgb(42, 52, 61) 1px 0px 0px 0px inset, rgb(42, 52, 61) -1px 0px 0px 0px inset` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-md)` | `14.5px` | inherited · table · 2026-09-14-pins2-board/app.css:944 |
| font-weight | ↑ `normal` | `400` | inherited · table · user-agent:? |
| font-style | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| font-variant-numeric | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| line-height | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| letter-spacing | `0px` | `normal` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-transform | `none` | `none` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-align | `left` | `left` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | td · 2026-09-14-pins2-board/app.css:970 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |

#### look 4 of 4

`G10-168` · rendered **0×0** · 1 instance look like this

```html
<td class="pb-base"><span class="pb-v">60 Round Reload</span></td>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `table-cell` | `table-cell` | td, th · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 4px` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-top | `3px (as padding-block-start)` | `3px` | .pb-tbl tbody td.pb-base · 2026-09-14-pins2-board/index.html:110 |
| padding-right | `4px` | `4px` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-bottom | `3px (as padding-block-end)` | `3px` | .pb-tbl tbody td.pb-base · 2026-09-14-pins2-board/index.html:110 |
| padding-left | `4px` | `4px` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| padding-block | `3px` | `` | .pb-tbl tbody td.pb-base · 2026-09-14-pins2-board/index.html:110 |
| border | `0` | `` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| border-bottom | `1px solid var(--rule3)` | `` | td · 2026-09-14-pins2-board/app.css:970 |
| border-radius | `0 0 var(--rad-2) var(--rad-2)` | `` | .pb-tbl tbody tr:last-child .pb-base · 2026-09-14-pins2-board/index.html:109 |
| background | `var(--sunk)` | `` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| background-image | `` | `none` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| box-shadow | `inset 1px 0 0 var(--rule),inset -1px 0 0 var(--rule)` | `rgb(42, 52, 61) 1px 0px 0px 0px inset, rgb(42, 52, 61) -1px 0px 0px 0px inset` | .pb-tbl .pb-base · 2026-09-14-pins2-board/index.html:107 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-md)` | `14.5px` | inherited · table · 2026-09-14-pins2-board/app.css:944 |
| font-weight | ↑ `normal` | `400` | inherited · table · user-agent:? |
| font-style | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| font-variant-numeric | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| line-height | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| letter-spacing | `0px` | `normal` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-transform | `none` | `none` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-align | `left` | `left` | .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | td · 2026-09-14-pins2-board/app.css:970 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |


### `span.pb-v`

inside `.pb-base` · 21 on screen · **1 look**

#### the one look

`G10-36` · rendered **136×36** · 21 instances look like this · text “Gauge-9 Mono”

```html
<span class="pb-v">Gauge-9 Mono</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| align-items | `center` | `center` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| height | `36px` | `36px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 10px` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-top | `0px` | `0px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-right | `10px` | `10px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-bottom | `0px` | `0px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-left | `10px` | `10px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| border-radius | `var(--rad-1)` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font | `500 var(--t-sm)/1.2 var(--ui)` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font-size | `` | `12px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font-weight | `` | `500` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font-style | `` | `normal` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font-variant-numeric | `` | `normal` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| line-height | `` | `14.4px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| letter-spacing | ↑ `0px` | `normal` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-transform | ↑ `none` | `none` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-align | ↑ `left` | `left` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-overflow | `ellipsis` | `ellipsis` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| white-space | `nowrap` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| overflow | `hidden` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| overflow-x | `hidden` | `hidden` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| overflow-y | `hidden` | `hidden` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |


### `span.pb-d.pb-v`

inside `.—` · 29 on screen · **1 look**

#### the one look

`G10-38` · rendered **136×36** · 29 instances look like this · text “Polarfire-S”

```html
<span class="pb-v pb-d">Polarfire-S</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| align-items | `center` | `center` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| height | `36px` | `36px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 10px` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-top | `0px` | `0px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-right | `10px` | `10px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-bottom | `0px` | `0px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-left | `10px` | `10px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| border-radius | `var(--rad-1)` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| background | `var(--raised)` | `` | .pb-v.pb-d · 2026-09-14-pins2-board/index.html:113 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-v.pb-d · 2026-09-14-pins2-board/index.html:113 |
| background-image | `` | `none` | .pb-v.pb-d · 2026-09-14-pins2-board/index.html:113 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--patch) 65%,transparent)` | `color(srgb 0.94902 0.760784 0.188235 / 0.65) 0px 0px 0px 1px inset` | .pb-v.pb-d · 2026-09-14-pins2-board/index.html:113 |
| font | `500 var(--t-sm)/1.2 var(--ui)` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font-size | `` | `12px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font-weight | `600` | `600` | .pb-v.pb-d · 2026-09-14-pins2-board/index.html:113 |
| font-style | `` | `normal` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font-variant-numeric | `` | `normal` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| line-height | `` | `14.4px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| letter-spacing | ↑ `0px` | `normal` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-transform | ↑ `none` | `none` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-align | ↑ `left` | `left` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-overflow | `ellipsis` | `ellipsis` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| white-space | `nowrap` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-v.pb-d · 2026-09-14-pins2-board/index.html:113 |
| overflow | `hidden` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| overflow-x | `hidden` | `hidden` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| overflow-y | `hidden` | `hidden` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |


### `span.pb-v.pb-x`

inside `.pb-base` · 7 on screen · **1 look**

#### the one look

`G10-50` · rendered **136×36** · 7 instances look like this · text “—”

```html
<span class="pb-v pb-x">—</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| align-items | `center` | `center` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| height | `36px` | `36px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 10px` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-top | `0px` | `0px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-right | `10px` | `10px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-bottom | `0px` | `0px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-left | `10px` | `10px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| border-radius | `var(--rad-1)` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font | `500 var(--t-sm)/1.2 var(--ui)` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font-size | `` | `12px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font-weight | `` | `500` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font-style | `` | `normal` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font-variant-numeric | `` | `normal` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| line-height | `` | `14.4px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| letter-spacing | ↑ `0px` | `normal` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-transform | ↑ `none` | `none` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-align | ↑ `left` | `left` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-overflow | `ellipsis` | `ellipsis` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| white-space | `nowrap` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| color | `var(--ink4)` | `rgb(92, 106, 117)` | .pb-v.pb-x · 2026-09-14-pins2-board/index.html:114 |
| overflow | `hidden` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| overflow-x | `hidden` | `hidden` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| overflow-y | `hidden` | `hidden` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |


### `span.pb-rm.pb-v`

inside `.—` · 10 on screen · **1 look**

#### the one look

`G10-58` · rendered **136×36** · 10 instances look like this · text “Not equipped”

```html
<span class="pb-v pb-rm">Not equipped</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| align-items | `center` | `center` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| height | `36px` | `36px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 10px` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-top | `0px` | `0px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-right | `10px` | `10px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-bottom | `0px` | `0px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-left | `10px` | `10px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| border-radius | `var(--rad-1)` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| outline | `1px dashed color-mix(in srgb,var(--warn) 60%,transparent)` | `` | .pb-v.pb-rm · 2026-09-14-pins2-board/index.html:227 |
| outline-offset | `-1px` | `-1px` | .pb-v.pb-rm · 2026-09-14-pins2-board/index.html:227 |
| background | `none` | `` | .pb-v.pb-rm · 2026-09-14-pins2-board/index.html:227 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-v.pb-rm · 2026-09-14-pins2-board/index.html:227 |
| background-image | `none` | `none` | .pb-v.pb-rm · 2026-09-14-pins2-board/index.html:227 |
| box-shadow | `none` | `none` | .pb-v.pb-rm · 2026-09-14-pins2-board/index.html:227 |
| font | `500 var(--t-sm)/1.2 var(--ui)` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font-size | `` | `12px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font-weight | `` | `500` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font-style | `normal` | `normal` | .pb-v.pb-rm · 2026-09-14-pins2-board/index.html:227 |
| font-variant-numeric | `` | `normal` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| line-height | `` | `14.4px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| letter-spacing | ↑ `0px` | `normal` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-transform | ↑ `none` | `none` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-align | ↑ `left` | `left` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-decoration | `none` | `` | .pb-v.pb-rm · 2026-09-14-pins2-board/index.html:227 |
| text-overflow | `ellipsis` | `ellipsis` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| white-space | `nowrap` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| color | `var(--warn)` | `rgb(255, 122, 69)` | .pb-v.pb-rm · 2026-09-14-pins2-board/index.html:227 |
| overflow | `hidden` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| overflow-x | `hidden` | `hidden` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| overflow-y | `hidden` | `hidden` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |


### `tr.pb-gap`

inside `.—` · 1 on screen · **1 look**

#### the one look

`G10-69` · rendered **822×28** · 1 instance look like this

```html
<tr class="pb-gap"><th colspan="6">Code</th></tr>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `table-row` | `table-row` | tr · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-md)` | `14.5px` | inherited · table · 2026-09-14-pins2-board/app.css:944 |
| font-weight | ↑ `normal` | `400` | inherited · table · user-agent:? |
| font-style | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| font-variant-numeric | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| line-height | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| letter-spacing | — | `normal` | initial |
| text-align | ↑ `start` | `start` | inherited · table · user-agent:? |
| color | ↑ `-internal-quirk-inherit` | `rgb(232, 237, 241)` | inherited · table · user-agent:? |
| transition | `transform var(--dur-1) var(--ease),box-shadow var(--dur-1) var(--ease), background var(--dur-1) var(--ease)` | `` | tbody tr · 2026-09-14-pins2-board/app.css:5724 |
| cursor | `pointer` | `pointer` | tbody tr · 2026-09-14-pins2-board/app.css:971 |


### `span.pb-m.pb-v`

inside `.pb-base` · 1 on screen · **1 look**

#### the one look

`G10-72` · rendered **136×36** · 1 instance look like this · text “1I2C6B8A9D”

```html
<span class="pb-v pb-m">1I2C6B8A9D</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| align-items | `center` | `center` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| height | `36px` | `36px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 10px` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-top | `0px` | `0px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-right | `10px` | `10px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-bottom | `0px` | `0px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-left | `10px` | `10px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| border-radius | `var(--rad-1)` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| font | `600 var(--t-sm)/1 var(--data)` | `` | .pb-v.pb-m · 2026-09-14-pins2-board/index.html:116 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-v.pb-m · 2026-09-14-pins2-board/index.html:116 |
| font-size | `` | `12px` | .pb-v.pb-m · 2026-09-14-pins2-board/index.html:116 |
| font-weight | `` | `600` | .pb-v.pb-m · 2026-09-14-pins2-board/index.html:116 |
| font-style | `` | `normal` | .pb-v.pb-m · 2026-09-14-pins2-board/index.html:116 |
| font-variant-numeric | `` | `normal` | .pb-v.pb-m · 2026-09-14-pins2-board/index.html:116 |
| line-height | `` | `12px` | .pb-v.pb-m · 2026-09-14-pins2-board/index.html:116 |
| letter-spacing | `0.04em` | `0.48px` | .pb-v.pb-m · 2026-09-14-pins2-board/index.html:116 |
| text-transform | ↑ `none` | `none` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-align | ↑ `left` | `left` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-overflow | `ellipsis` | `ellipsis` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| white-space | `nowrap` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| overflow | `hidden` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| overflow-x | `hidden` | `hidden` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| overflow-y | `hidden` | `hidden` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |


### `span.pb-d.pb-m.pb-v`

inside `.—` · 4 on screen · **1 look**

#### the one look

`G10-73` · rendered **136×36** · 4 instances look like this · text “1I2C4A8A9D”

```html
<span class="pb-v pb-m pb-d">1I2C4A8A9D</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| align-items | `center` | `center` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| height | `36px` | `36px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 10px` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-top | `0px` | `0px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-right | `10px` | `10px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-bottom | `0px` | `0px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| padding-left | `10px` | `10px` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| border-radius | `var(--rad-1)` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| background | `var(--raised)` | `` | .pb-v.pb-d · 2026-09-14-pins2-board/index.html:113 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-v.pb-d · 2026-09-14-pins2-board/index.html:113 |
| background-image | `` | `none` | .pb-v.pb-d · 2026-09-14-pins2-board/index.html:113 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--patch) 65%,transparent)` | `color(srgb 0.94902 0.760784 0.188235 / 0.65) 0px 0px 0px 1px inset` | .pb-v.pb-d · 2026-09-14-pins2-board/index.html:113 |
| font | `600 var(--t-sm)/1 var(--data)` | `` | .pb-v.pb-m · 2026-09-14-pins2-board/index.html:116 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-v.pb-m · 2026-09-14-pins2-board/index.html:116 |
| font-size | `` | `12px` | .pb-v.pb-m · 2026-09-14-pins2-board/index.html:116 |
| font-weight | `` | `600` | .pb-v.pb-m · 2026-09-14-pins2-board/index.html:116 |
| font-style | `` | `normal` | .pb-v.pb-m · 2026-09-14-pins2-board/index.html:116 |
| font-variant-numeric | `` | `normal` | .pb-v.pb-m · 2026-09-14-pins2-board/index.html:116 |
| line-height | `` | `12px` | .pb-v.pb-m · 2026-09-14-pins2-board/index.html:116 |
| letter-spacing | `0.04em` | `0.48px` | .pb-v.pb-m · 2026-09-14-pins2-board/index.html:116 |
| text-transform | ↑ `none` | `none` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-align | ↑ `left` | `left` | inherited · .pb-tbl th, .pb-tbl td · 2026-09-14-pins2-board/index.html:103 |
| text-overflow | `ellipsis` | `ellipsis` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| white-space | `nowrap` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-v.pb-d · 2026-09-14-pins2-board/index.html:113 |
| overflow | `hidden` | `` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| overflow-x | `hidden` | `hidden` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| overflow-y | `hidden` | `hidden` | .pb-v · 2026-09-14-pins2-board/index.html:112 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |


### `div.pb-same`

inside `.pb-cmp` · 2 on screen · **2 looks**

#### look 1 of 2

`G10-77` · rendered **822×26** · 1 instance look like this

```html
<div class="pb-same"><span>Same on all 5</span><span class="pill">Ammunition<b>60 Round Reload</b></span><span class="pill">Rank<b>Best</b></span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-same · 2026-09-14-pins2-board/index.html:117 |
| gap | `8px` | `` | .pb-same · 2026-09-14-pins2-board/index.html:117 |
| column-gap | `8px` | `8px` | .pb-same · 2026-09-14-pins2-board/index.html:117 |
| row-gap | `8px` | `8px` | .pb-same · 2026-09-14-pins2-board/index.html:117 |
| flex-wrap | `wrap` | `wrap` | .pb-same · 2026-09-14-pins2-board/index.html:117 |
| align-items | `center` | `center` | .pb-same · 2026-09-14-pins2-board/index.html:117 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G10-175` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-same"><span>Same on all 6</span><span class="pill">Category<b>AR</b></span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-same · 2026-09-14-pins2-board/index.html:117 |
| gap | `8px` | `` | .pb-same · 2026-09-14-pins2-board/index.html:117 |
| column-gap | `8px` | `8px` | .pb-same · 2026-09-14-pins2-board/index.html:117 |
| row-gap | `8px` | `8px` | .pb-same · 2026-09-14-pins2-board/index.html:117 |
| flex-wrap | `wrap` | `wrap` | .pb-same · 2026-09-14-pins2-board/index.html:117 |
| align-items | `center` | `center` | .pb-same · 2026-09-14-pins2-board/index.html:117 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pill`

inside `.pb-same` · 3 on screen · **2 looks**

#### look 1 of 2

`G10-79` · rendered **206×26** · 2 instances look like this

```html
<span class="pill">Ammunition<b>60 Round Reload</b></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| gap | `7px` | `` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| column-gap | `7px` | `7px` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| row-gap | `7px` | `7px` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| align-items | `center` | `center` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `6px 12px` | `` | .pb-same .pill · 2026-09-14-pins2-board/index.html:119 |
| padding-top | `6px` | `6px` | .pb-same .pill · 2026-09-14-pins2-board/index.html:119 |
| padding-right | `12px` | `12px` | .pb-same .pill · 2026-09-14-pins2-board/index.html:119 |
| padding-bottom | `6px` | `6px` | .pb-same .pill · 2026-09-14-pins2-board/index.html:119 |
| padding-left | `12px` | `12px` | .pb-same .pill · 2026-09-14-pins2-board/index.html:119 |
| margin-right | `4px` | `4px` | .pb-same > span · 2026-09-14-pins2-board/index.html:118 |
| border | `1px solid var(--rule)` | `` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| border-radius | `var(--rad-pill)` | `` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| background | `var(--sunk)` | `` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| background-color | `` | `rgb(11, 15, 18)` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| background-image | `` | `none` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| font | `500 var(--t-base)/1 var(--ui)` | `` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| font-size | `var(--t-sm)` | `12px` | .pb-same .pill · 2026-09-14-pins2-board/index.html:119 |
| font-weight | `` | `500` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| font-style | `` | `normal` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| font-variant-numeric | `` | `normal` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| line-height | `` | `12px` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-same > span · 2026-09-14-pins2-board/index.html:118 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | .pill · 2026-09-14-pins2-board/app.css:4243 |

#### look 2 of 2

`G10-177` · rendered **0×0** · 1 instance look like this

```html
<span class="pill">Category<b>AR</b></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| gap | `7px` | `` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| column-gap | `7px` | `7px` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| row-gap | `7px` | `7px` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| align-items | `center` | `center` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `6px 12px` | `` | .pb-same .pill · 2026-09-14-pins2-board/index.html:119 |
| padding-top | `6px` | `6px` | .pb-same .pill · 2026-09-14-pins2-board/index.html:119 |
| padding-right | `12px` | `12px` | .pb-same .pill · 2026-09-14-pins2-board/index.html:119 |
| padding-bottom | `6px` | `6px` | .pb-same .pill · 2026-09-14-pins2-board/index.html:119 |
| padding-left | `12px` | `12px` | .pb-same .pill · 2026-09-14-pins2-board/index.html:119 |
| margin-right | `4px` | `4px` | .pb-same > span · 2026-09-14-pins2-board/index.html:118 |
| border | `1px solid var(--rule)` | `` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| border-radius | `var(--rad-pill)` | `` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| background | `var(--sunk)` | `` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| background-color | `` | `rgb(11, 15, 18)` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| background-image | `` | `none` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| font | `500 var(--t-base)/1 var(--ui)` | `` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| font-size | `var(--t-sm)` | `12px` | .pb-same .pill · 2026-09-14-pins2-board/index.html:119 |
| font-weight | `` | `500` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| font-style | `` | `normal` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| font-variant-numeric | `` | `normal` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| line-height | `` | `12px` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-same > span · 2026-09-14-pins2-board/index.html:118 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | .pill · 2026-09-14-pins2-board/app.css:4243 |


### `div.pb-fold`

inside `.pb-cmp` · 1 on screen · **1 look**

#### the one look

`G10-83` · rendered **822×47** · 1 instance look like this

```html
<div class="pb-fold"><button class="chip">⟨svg.ic⟩Show cards</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-top | `14px` | `14px` | .pb-fold · 2026-09-14-pins2-board/index.html:121 |
| border-top | `1px solid var(--rule3)` | `` | .pb-fold · 2026-09-14-pins2-board/index.html:121 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `svg.ic`

inside `.chip` · 1 on screen · **1 look**

#### the one look

`G10-85` · rendered **12×12** · 1 instance look like this

```html
<svg class="ic"><use href="#i-chevron-down"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| width | `1em` | `12px` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| height | `1em` | `12px` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | ↑ `600` | `600` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `18px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| pointer-events | `none` | `none` | button .ic, a .ic · 2026-09-14-pins2-board/app.css:6172 |


### `button.chip.pb-cut`

inside `.cmpbrow` · 2 on screen · **1 look**

#### the one look

`G10-95` · rendered **0×0** · 2 instances look like this · text “4”

```html
<button class="chip pb-cut">4</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .chip · 2026-09-14-pins2-board/app.css:938 |
| position | `relative` | `relative` | .pb-cut · 2026-09-14-pins2-board/index.html:255 |
| flex | `none` | `` | .pb-cut · 2026-09-14-pins2-board/index.html:255 |
| align-items | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| align-self | `stretch` | `stretch` | .pb-cut · 2026-09-14-pins2-board/index.html:255 |
| justify-content | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| width | `18px` | `18px` | .pb-cut · 2026-09-14-pins2-board/index.html:255 |
| min-height | `32px` | `32px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `6px 11px` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-top | `6px` | `6px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-right | `11px` | `11px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-bottom | `6px` | `6px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-left | `11px` | `11px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| border | `1px solid var(--rule2)` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| border-radius | `var(--rad-pill)` | `` | .chip, .seg button, .tbdsw button · 2026-09-14-pins2-board/app.css:4478 |
| background | `none` | `` | .chip.pb-cut · 2026-09-14-pins2-board/index.html:123 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .chip.pb-cut · 2026-09-14-pins2-board/index.html:123 |
| background-image | `none` | `none` | .chip.pb-cut · 2026-09-14-pins2-board/index.html:123 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `var(--t-sm)` | `12px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | `600` | `600` | .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `18px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| text-decoration | `line-through` | `` | .chip.pb-cut · 2026-09-14-pins2-board/index.html:123 |
| color | `var(--ink4)` | `rgb(92, 106, 117)` | .chip.pb-cut · 2026-09-14-pins2-board/index.html:123 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | button · 2026-09-14-pins2-board/app.css:600 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-cut::before · 2026-09-14-pins2-board/index.html:256 |
| top | `4px` | .pb-cut::before · 2026-09-14-pins2-board/index.html:256 |
| bottom | `4px` | .pb-cut::before · 2026-09-14-pins2-board/index.html:256 |
| left | `8px` | .pb-cut::before · 2026-09-14-pins2-board/index.html:256 |
| border-left | `2px solid var(--warn)` | .pb-cut::before · 2026-09-14-pins2-board/index.html:256 |
| content | `""` | .pb-cut::before · 2026-09-14-pins2-board/index.html:256 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `rgba(0, 0, 0, 0)` | `rgb(42, 52, 61)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself


### `span.cmpstat.pb-over`

inside `.cmpstats` · 1 on screen · **1 look**

#### the one look

`G10-110` · rendered **0×0** · 1 instance look like this

```html
<span class="cmpstat pb-over"><b>2</b><span>not shown</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| gap | `6px` | `` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| column-gap | `6px` | `6px` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| row-gap | `6px` | `6px` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| align-items | `baseline` | `baseline` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `7px 13px` | `` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| padding-top | `7px` | `7px` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| padding-right | `13px` | `13px` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| padding-bottom | `7px` | `7px` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| padding-left | `13px` | `13px` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| border | `1px solid var(--rule)` | `` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| border-color | `color-mix(in srgb,var(--warn) 45%,transparent)` | `` | .cmpstat.pb-over · 2026-09-14-pins2-board/index.html:124 |
| border-radius | `var(--rad-pill)` | `` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| background | `var(--sunk)` | `` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| background-color | `` | `rgb(11, 15, 18)` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| background-image | `` | `none` | .cmpstat · 2026-09-14-pins2-board/app.css:6773 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.empty`

inside `.pb-view` · 2 on screen · **1 look**

#### the one look

`G10-186` · rendered **0×0** · 2 instances look like this

```html
<div class="empty"><b>DL Q33 has one build</b>Add another sniper to line them up <div style="display:flex;gap:8px;justify-content:center;margin-top:16px"><button class="pill">+ Arctic .50</button><button class="pill">+ XPR-50</button><button class="pill">+ Locus</button></div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `34px 16px` | `` | .empty · 2026-09-14-pins2-board/app.css:996 |
| padding-top | `34px` | `34px` | .empty · 2026-09-14-pins2-board/app.css:996 |
| padding-right | `16px` | `16px` | .empty · 2026-09-14-pins2-board/app.css:996 |
| padding-bottom | `34px` | `34px` | .empty · 2026-09-14-pins2-board/app.css:996 |
| padding-left | `16px` | `16px` | .empty · 2026-09-14-pins2-board/app.css:996 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-md)` | `14.5px` | .empty · 2026-09-14-pins2-board/app.css:996 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `21.75px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| text-align | `center` | `center` | .empty · 2026-09-14-pins2-board/app.css:996 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .empty · 2026-09-14-pins2-board/app.css:996 |


### `div`

inside `.empty` · 2 on screen · **1 look**

#### the one look

`G10-188` · rendered **0×0** · 2 instances look like this

```html
<div style="display:flex;gap:8px;justify-content:center;margin-top:16px"><button class="pill">+ Arctic .50</button><button class="pill">+ XPR-50</button><button class="pill">+ Locus</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | style attribute |
| gap | `8px` | `` | style attribute |
| column-gap | `8px` | `8px` | style attribute |
| row-gap | `8px` | `8px` | style attribute |
| justify-content | `center` | `center` | style attribute |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `16px` | `16px` | style attribute |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-md)` | `14.5px` | inherited · .empty · 2026-09-14-pins2-board/app.css:996 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `21.75px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| text-align | ↑ `center` | `center` | inherited · .empty · 2026-09-14-pins2-board/app.css:996 |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .empty · 2026-09-14-pins2-board/app.css:996 |


### `button.pill`

inside `.—` · 5 on screen · **1 look**

#### the one look

`G10-189` · rendered **0×0** · 5 instances look like this · text “+ Arctic .50”

```html
<button class="pill">+ Arctic .50</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| gap | `7px` | `` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| column-gap | `7px` | `7px` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| row-gap | `7px` | `7px` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| align-items | `center` | `center` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| min-height | `var(--ctl-min, 32px)` | `0px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `8px 13px` | `` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| padding-top | `8px` | `8px` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| padding-right | `13px` | `13px` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| padding-bottom | `8px` | `8px` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| padding-left | `13px` | `13px` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| margin-top | `var(--s3)` | `12px` | .empty .pill · 2026-09-14-pins2-board/app.css:999 |
| border | `1px solid var(--rule)` | `` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| border-radius | `var(--rad-pill)` | `` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| background | `var(--sunk)` | `` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| background-color | `` | `rgb(11, 15, 18)` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| background-image | `` | `none` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| font | `500 var(--t-base)/1 var(--ui)` | `` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| font-size | `` | `13px` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| font-weight | `` | `500` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| font-style | `` | `normal` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| font-variant-numeric | `` | `normal` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| line-height | `` | `13px` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | `nowrap` | `` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pill · 2026-09-14-pins2-board/app.css:4243 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | .pill · 2026-09-14-pins2-board/app.css:4243 |

**:hover** — changes; parts inside it respond (table below)

| property | at rest | hover |
|---|---|---|
| background-color | `rgb(11, 15, 18)` | `rgb(42, 52, 61)` |
| color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |

| part inside | property | at rest | hover |
|---|---|---|---|
| ::before | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::before | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::before | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::after | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::after | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::after | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself


## G8 · Post an announcement — resting


### G8 stage

55 distinct signatures on screen; 44 not already specced above.


### `span`

inside `.pb-states` · 3 on screen · **1 look**

#### the one look

`G8-21` · rendered **137×12** · 1 instance look like this

```html
<span><b>3,180</b> of 6,000 left</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `500 var(--t-sm)/1 var(--data)` | `` | .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-size | `` | `12px` | .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-weight | `` | `500` | .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-style | `` | `normal` | .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-variant-numeric | `` | `normal` | .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| line-height | `` | `12px` | .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |


### `aside.drawer.wide[role=dialog]`

inside `.pb-stage` · 1 on screen · **1 look**

#### the one look

`G8-5` · rendered **880×666** · 1 instance look like this · aria-label="Post an announcement" role="dialog"

```html
<aside class="drawer wide" role="dialog" aria-label="Post an announcement"> <header class="dw-h"><div class="dw-ttl"><span class="dw-eye">announcement.post · tier 1</span><h2>Post an announcement</h2></div> <button class="x" aria-label="Close">⟨svg.ic⟩</button></header> <div class="pb-view" data-view="0"> <div class="dw-b"><div class="bed"> <div class="pb-col"> <div class="dwfield"><label>Text</label> <textarea rows=
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| position | `relative` | `relative` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| flex-direction | `column` | `column` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| width | `880px` | `880px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| max-height | `none` | `none` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0 auto` | `` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-top | `0px` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-right | `auto` | `-26px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-bottom | `0px` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-left | `auto` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| top | `auto` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| left | `auto` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| border | `1px solid var(--rule2)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| border-radius | `var(--rad-3)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| background | `var(--raised)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| background-color | `` | `rgb(31, 39, 46)` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| background-image | `` | `none` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| box-shadow | `rgba(0, 0, 0, 0.75) 0px 40px 80px -24px` | `rgba(0, 0, 0, 0.75) 0px 40px 80px -24px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| opacity | `1` | `1` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| overflow | `hidden` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| overflow-x | `hidden` | `hidden` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| overflow-y | `hidden` | `hidden` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| transform | `none` | `none` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| transition | `opacity .18s,transform .18s cubic-bezier(.2,.8,.3,1)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| z-index | `auto` | `auto` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| pointer-events | `auto` | `auto` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |


### `svg.ic`

inside `.x` · 8 on screen · **2 looks**

#### look 1 of 2

`G8-41` · rendered **0×0** · 2 instances look like this

```html
<svg class="ic"><use href="#i-infinity"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `inline-block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| width | `1em` | `13px` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| height | `1em` | `13px` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · .pb-neverval · 2026-09-14-pins2-board/index.html:241 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--r-broadcast)` | `rgb(236, 72, 153)` | .pb-neverval .ic · 2026-09-14-pins2-board/index.html:242 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |

#### look 2 of 2

`G8-55` · rendered **14×14** · 1 instance look like this

```html
<svg class="ic"><use href="#i-clock"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| width | `14px` | `14px` | .pb-gapday .ic · 2026-09-14-pins2-board/index.html:302 |
| height | `14px` | `14px` | .pb-gapday .ic · 2026-09-14-pins2-board/index.html:302 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `600 var(--t-sm)/1 var(--data)` | `` | inherited · .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| font-size | ↑ `` | `12px` | inherited · .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| font-weight | ↑ `` | `600` | inherited · .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| font-style | ↑ `` | `normal` | inherited · .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| line-height | ↑ `` | `12px` | inherited · .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| letter-spacing | — | `normal` | initial |
| white-space | ↑ `nowrap` | `` | inherited · .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-gapday .ic · 2026-09-14-pins2-board/index.html:302 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |


### `div.pb-view`

inside `.drawer` · 1 on screen · **1 look**

#### the one look

`G8-11` · rendered **878×587** · 1 instance look like this

```html
<div class="pb-view" data-view="0"> <div class="dw-b"><div class="bed"> <div class="pb-col"> <div class="dwfield"><label>Text</label> <textarea rows="4"># New Legendary draw is live The Kilo Bo…</textarea> <div class="pb-meter2" aria-label="Delivery budget"><span class="cmeter"><i style="width:45.4%"></i><i style="width:1.6%"></i></span><span><b>3,180</b> of 6,000 left</span></div></div> <div class="dwfield"><label>B
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.dw-b`

inside `.pb-view` · 2 on screen · **1 look**

#### the one look

`G8-12` · rendered **878×518** · 1 instance look like this

```html
<div class="dw-b"><div class="bed"> <div class="pb-col"> <div class="dwfield"><label>Text</label> <textarea rows="4"># New Legendary draw is live The Kilo Bo…</textarea> <div class="pb-meter2" aria-label="Delivery budget"><span class="cmeter"><i style="width:45.4%"></i><i style="width:1.6%"></i></span><span><b>3,180</b> of 6,000 left</span></div></div> <div class="dwfield"><label>Banner</label> <div class="pb-banner"
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| flex | `1 1 auto` | `` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `var(--s4) var(--s5)` | `` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-top | `` | `16px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-right | `` | `24px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-bottom | `` | `16px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-left | `` | `24px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `auto` | `` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| overflow-x | `auto` | `auto` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| overflow-y | `auto` | `auto` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |


### `div.bed`

inside `.dw-b` · 2 on screen · **2 looks**

#### look 1 of 2

`G8-13` · rendered **830×486** · 1 instance look like this

```html
<div class="bed"> <div class="pb-col"> <div class="dwfield"><label>Text</label> <textarea rows="4"># New Legendary draw is live The Kilo Bo…</textarea> <div class="pb-meter2" aria-label="Delivery budget"><span class="cmeter"><i style="width:45.4%"></i><i style="width:1.6%"></i></span><span><b>3,180</b> of 6,000 left</span></div></div> <div class="dwfield"><label>Banner</label> <div class="pb-banner"><span class="pb-t
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .bed · 2026-09-14-pins2-board/app.css:3272 |
| grid-template-columns | `1fr 320px` | `492px 320px` | .pb-stage .dw-b .bed · 2026-09-14-pins2-board/index.html:145 |
| gap | `18px` | `` | .drawer.wide .bed · 2026-09-14-pins2-board/app.css:6788 |
| column-gap | `18px` | `18px` | .drawer.wide .bed · 2026-09-14-pins2-board/app.css:6788 |
| row-gap | `18px` | `18px` | .drawer.wide .bed · 2026-09-14-pins2-board/app.css:6788 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G8-67` · rendered **0×0** · 1 instance look like this

```html
<div class="bed"> <div class="pb-col"> <div class="dwfield"><label>Text</label> <textarea rows="3"># New Legendary draw is live The Kilo Bo…</textarea> <div class="pb-meter2" aria-label="Delivery budget"><span class="cmeter"><i style="width:45.4%"></i><i style="width:1.1%"></i></span><span><b>3,212</b> of 6,000 left</span></div></div> <div class="dwfield"><label>Banner</label> <div class="pb-banner"><span class="pb-t
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .bed · 2026-09-14-pins2-board/app.css:3272 |
| grid-template-columns | `1fr 320px` | `1fr 320px` | .pb-stage .dw-b .bed · 2026-09-14-pins2-board/index.html:145 |
| gap | `18px` | `` | .drawer.wide .bed · 2026-09-14-pins2-board/app.css:6788 |
| column-gap | `18px` | `18px` | .drawer.wide .bed · 2026-09-14-pins2-board/app.css:6788 |
| row-gap | `18px` | `18px` | .drawer.wide .bed · 2026-09-14-pins2-board/app.css:6788 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-col`

inside `.bed` · 2 on screen · **2 looks**

#### look 1 of 2

`G8-14` · rendered **492×486** · 1 instance look like this

```html
<div class="pb-col"> <div class="dwfield"><label>Text</label> <textarea rows="4"># New Legendary draw is live The Kilo Bo…</textarea> <div class="pb-meter2" aria-label="Delivery budget"><span class="cmeter"><i style="width:45.4%"></i><i style="width:1.6%"></i></span><span><b>3,180</b> of 6,000 left</span></div></div> <div class="dwfield"><label>Banner</label> <div class="pb-banner"><span class="pb-th"></span><input v
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-col · 2026-09-14-pins2-board/index.html:146 |
| gap | `18px` | `` | .pb-col · 2026-09-14-pins2-board/index.html:146 |
| column-gap | `18px` | `18px` | .pb-col · 2026-09-14-pins2-board/index.html:146 |
| row-gap | `18px` | `18px` | .pb-col · 2026-09-14-pins2-board/index.html:146 |
| min-width | `0px` | `0px` | .pb-col · 2026-09-14-pins2-board/index.html:306 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G8-68` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-col"> <div class="dwfield"><label>Text</label> <textarea rows="3"># New Legendary draw is live The Kilo Bo…</textarea> <div class="pb-meter2" aria-label="Delivery budget"><span class="cmeter"><i style="width:45.4%"></i><i style="width:1.1%"></i></span><span><b>3,212</b> of 6,000 left</span></div></div> <div class="dwfield"><label>Banner</label> <div class="pb-banner"><span class="pb-th pb-bad">⟨svg.ic.
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-col · 2026-09-14-pins2-board/index.html:146 |
| gap | `18px` | `` | .pb-col · 2026-09-14-pins2-board/index.html:146 |
| column-gap | `18px` | `18px` | .pb-col · 2026-09-14-pins2-board/index.html:146 |
| row-gap | `18px` | `18px` | .pb-col · 2026-09-14-pins2-board/index.html:146 |
| min-width | `0px` | `0px` | .pb-col · 2026-09-14-pins2-board/index.html:306 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.dwfield`

inside `.pb-col` · 8 on screen · **3 looks**

#### look 1 of 3

`G8-15` · rendered **492×147** · 1 instance look like this

```html
<div class="dwfield"><label>Text</label> <textarea rows="4"># New Legendary draw is live The Kilo Bo…</textarea> <div class="pb-meter2" aria-label="Delivery budget"><span class="cmeter"><i style="width:45.4%"></i><i style="width:1.6%"></i></span><span><b>3,180</b> of 6,000 left</span></div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| gap | `var(--s2)` | `` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| column-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| row-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| flex-direction | `column` | `column` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `0px` | `0px` | .pb-stage .dwfield · 2026-09-14-pins2-board/index.html:34 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 3

`G8-23` · rendered **492×97** · 1 instance look like this

```html
<div class="dwfield"><label>Banner</label> <div class="pb-banner"><span class="pb-th"></span><input value="https://example.com/kilo-draw.png"></div> <span class="pb-echo" style="margin-left:92px">⟨svg.ic.sm⟩1600 × 900</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| gap | `var(--s2)` | `` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| column-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| row-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| flex-direction | `column` | `column` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `0px` | `0px` | .pb-stage .dwfield · 2026-09-14-pins2-board/index.html:34 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 3 of 3

`G8-30` · rendered **238×116** · 1 instance look like this

```html
<div class="dwfield"><div class="pb-lrow"><label>Starts</label></div><input value="in 3 days"><span class="pb-echo">⟨svg.ic.sm⟩Wed Sep 16</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| gap | `var(--s2)` | `` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| column-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| row-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| flex-direction | `column` | `column` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `0px` | `0px` | .pb-stage .dwfield · 2026-09-14-pins2-board/index.html:34 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-meter2`

inside `.dwfield` · 2 on screen · **2 looks**

#### look 1 of 2

`G8-17` · rendered **492×12** · 1 instance look like this · aria-label="Delivery budget"

```html
<div class="pb-meter2" aria-label="Delivery budget"><span class="cmeter"><i style="width:45.4%"></i><i style="width:1.6%"></i></span><span><b>3,180</b> of 6,000 left</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-meter2 · 2026-09-14-pins2-board/index.html:287 |
| gap | `14px` | `` | .pb-meter2 · 2026-09-14-pins2-board/index.html:287 |
| column-gap | `14px` | `14px` | .pb-meter2 · 2026-09-14-pins2-board/index.html:287 |
| row-gap | `14px` | `14px` | .pb-meter2 · 2026-09-14-pins2-board/index.html:287 |
| align-items | `center` | `center` | .pb-meter2 · 2026-09-14-pins2-board/index.html:287 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `10px` | `10px` | .pb-meter2 · 2026-09-14-pins2-board/index.html:287 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G8-71` · rendered **0×0** · 1 instance look like this · aria-label="Delivery budget"

```html
<div class="pb-meter2" aria-label="Delivery budget"><span class="cmeter"><i style="width:45.4%"></i><i style="width:1.1%"></i></span><span><b>3,212</b> of 6,000 left</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-meter2 · 2026-09-14-pins2-board/index.html:287 |
| gap | `14px` | `` | .pb-meter2 · 2026-09-14-pins2-board/index.html:287 |
| column-gap | `14px` | `14px` | .pb-meter2 · 2026-09-14-pins2-board/index.html:287 |
| row-gap | `14px` | `14px` | .pb-meter2 · 2026-09-14-pins2-board/index.html:287 |
| align-items | `center` | `center` | .pb-meter2 · 2026-09-14-pins2-board/index.html:287 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `10px` | `10px` | .pb-meter2 · 2026-09-14-pins2-board/index.html:287 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.cmeter`

inside `.pb-meter2` · 2 on screen · **1 look**

#### the one look

`G8-18` · rendered **341×4** · 2 instances look like this

```html
<span class="cmeter"><i style="width:45.4%"></i><i style="width:1.6%"></i></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-meter2 .cmeter · 2026-09-14-pins2-board/index.html:288 |
| flex | `1` | `` | .pb-meter2 .cmeter · 2026-09-14-pins2-board/index.html:288 |
| height | `4px` | `4px` | .pb-meter2 .cmeter · 2026-09-14-pins2-board/index.html:288 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1)` | `` | .cmeter · 2026-09-14-pins2-board/app.css:2170 |
| background | `var(--rule)` | `` | .cmeter · 2026-09-14-pins2-board/app.css:2170 |
| background-color | `` | `rgb(42, 52, 61)` | .cmeter · 2026-09-14-pins2-board/app.css:2170 |
| background-image | `` | `none` | .cmeter · 2026-09-14-pins2-board/app.css:2170 |
| font | `500 var(--t-sm)/1 var(--data)` | `` | .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-size | `` | `12px` | .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-weight | `` | `500` | .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-style | `` | `normal` | .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-variant-numeric | `` | `normal` | .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| line-height | `` | `12px` | .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| overflow | `hidden` | `` | .cmeter · 2026-09-14-pins2-board/app.css:2170 |
| overflow-x | `hidden` | `hidden` | .cmeter · 2026-09-14-pins2-board/app.css:2170 |
| overflow-y | `hidden` | `hidden` | .cmeter · 2026-09-14-pins2-board/app.css:2170 |


### `i`

inside `.cmeter` · 6 on screen · **5 looks**

#### look 1 of 5

`G8-19` · rendered **155×4** · 1 instance look like this

```html
<i style="width:45.4%"></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .cmeter i · 2026-09-14-pins2-board/app.css:2178 |
| width | `45.4%` | `154.891px` | style attribute |
| height | `100%` | `4px` | .cmeter i · 2026-09-14-pins2-board/app.css:2178 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1) 0 0 var(--rad-1)` | `` | .pb-meter2 .cmeter i:first-child · 2026-09-14-pins2-board/index.html:290 |
| background | `color-mix(in srgb,var(--r-broadcast) 38%,var(--raised))` | `` | .pb-meter2 .cmeter i:first-child · 2026-09-14-pins2-board/index.html:290 |
| background-color | `` | `color(srgb 0.427059 0.202118 0.339843)` | .pb-meter2 .cmeter i:first-child · 2026-09-14-pins2-board/index.html:290 |
| background-image | `` | `none` | .pb-meter2 .cmeter i:first-child · 2026-09-14-pins2-board/index.html:290 |
| font | ↑ `500 var(--t-sm)/1 var(--data)` | `` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-size | ↑ `` | `12px` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-weight | `400` | `400` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| font-style | `normal` | `normal` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| line-height | ↑ `` | `12px` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| letter-spacing | `0px` | `normal` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| text-transform | `none` | `none` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| white-space | ↑ `nowrap` | `` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |

#### look 2 of 5

`G8-20` · rendered **5×4** · 1 instance look like this

```html
<i style="width:1.6%"></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .cmeter i · 2026-09-14-pins2-board/app.css:2178 |
| width | `1.6%` | `5.45312px` | style attribute |
| height | `100%` | `4px` | .cmeter i · 2026-09-14-pins2-board/app.css:2178 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `0 var(--rad-1) var(--rad-1) 0` | `` | .pb-meter2 .cmeter i + i · 2026-09-14-pins2-board/index.html:291 |
| background | `var(--r-broadcast)` | `` | .pb-meter2 .cmeter i + i · 2026-09-14-pins2-board/index.html:291 |
| background-color | `` | `rgb(236, 72, 153)` | .pb-meter2 .cmeter i + i · 2026-09-14-pins2-board/index.html:291 |
| background-image | `` | `none` | .pb-meter2 .cmeter i + i · 2026-09-14-pins2-board/index.html:291 |
| font | ↑ `500 var(--t-sm)/1 var(--data)` | `` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-size | ↑ `` | `12px` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-weight | `400` | `400` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| font-style | `normal` | `normal` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| line-height | ↑ `` | `12px` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| letter-spacing | `0px` | `normal` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| text-transform | `none` | `none` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| white-space | ↑ `nowrap` | `` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |

#### look 3 of 5

`G8-40` · rendered **16×16** · 2 instances look like this

```html
<i></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .pb-swt i · 2026-09-14-pins2-board/index.html:236 |
| width | `16px` | `16px` | .pb-swt i · 2026-09-14-pins2-board/index.html:236 |
| height | `16px` | `16px` | .pb-swt i · 2026-09-14-pins2-board/index.html:236 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `3px` | `3px` | .pb-swt i · 2026-09-14-pins2-board/index.html:236 |
| left | `3px` | `3px` | .pb-swt i · 2026-09-14-pins2-board/index.html:236 |
| border-radius | `var(--rad-round)` | `` | .pb-swt i · 2026-09-14-pins2-board/index.html:236 |
| background | `var(--ink3)` | `` | .pb-swt i · 2026-09-14-pins2-board/index.html:236 |
| background-color | `` | `rgb(133, 147, 159)` | .pb-swt i · 2026-09-14-pins2-board/index.html:236 |
| background-image | `` | `none` | .pb-swt i · 2026-09-14-pins2-board/index.html:236 |
| font | ↑ `500 var(--t-sm)/1 var(--ui)` | `` | inherited · .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font-size | ↑ `` | `12px` | inherited · .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font-weight | `400` | `400` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| font-style | `normal` | `normal` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| line-height | ↑ `` | `12px` | inherited · .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| letter-spacing | `0px` | `normal` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| text-transform | `none` | `none` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| transition | `transform .24s cubic-bezier(.3,.7,.2,1),background .2s` | `` | .pb-swt i · 2026-09-14-pins2-board/index.html:236 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-sw · 2026-09-14-pins2-board/index.html:234 |

#### look 4 of 5

`G8-73` · rendered **0×0** · 1 instance look like this

```html
<i style="width:45.4%"></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .cmeter i · 2026-09-14-pins2-board/app.css:2178 |
| width | `45.4%` | `45.4%` | style attribute |
| height | `100%` | `100%` | .cmeter i · 2026-09-14-pins2-board/app.css:2178 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1) 0 0 var(--rad-1)` | `` | .pb-meter2 .cmeter i:first-child · 2026-09-14-pins2-board/index.html:290 |
| background | `color-mix(in srgb,var(--r-broadcast) 38%,var(--raised))` | `` | .pb-meter2 .cmeter i:first-child · 2026-09-14-pins2-board/index.html:290 |
| background-color | `` | `color(srgb 0.427059 0.202118 0.339843)` | .pb-meter2 .cmeter i:first-child · 2026-09-14-pins2-board/index.html:290 |
| background-image | `` | `none` | .pb-meter2 .cmeter i:first-child · 2026-09-14-pins2-board/index.html:290 |
| font | ↑ `500 var(--t-sm)/1 var(--data)` | `` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-size | ↑ `` | `12px` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-weight | `400` | `400` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| font-style | `normal` | `normal` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| line-height | ↑ `` | `12px` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| letter-spacing | `0px` | `normal` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| text-transform | `none` | `none` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| white-space | ↑ `nowrap` | `` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |

#### look 5 of 5

`G8-74` · rendered **0×0** · 1 instance look like this

```html
<i style="width:1.1%"></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .cmeter i · 2026-09-14-pins2-board/app.css:2178 |
| width | `1.1%` | `1.1%` | style attribute |
| height | `100%` | `100%` | .cmeter i · 2026-09-14-pins2-board/app.css:2178 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `0 var(--rad-1) var(--rad-1) 0` | `` | .pb-meter2 .cmeter i + i · 2026-09-14-pins2-board/index.html:291 |
| background | `var(--r-broadcast)` | `` | .pb-meter2 .cmeter i + i · 2026-09-14-pins2-board/index.html:291 |
| background-color | `` | `rgb(236, 72, 153)` | .pb-meter2 .cmeter i + i · 2026-09-14-pins2-board/index.html:291 |
| background-image | `` | `none` | .pb-meter2 .cmeter i + i · 2026-09-14-pins2-board/index.html:291 |
| font | ↑ `500 var(--t-sm)/1 var(--data)` | `` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-size | ↑ `` | `12px` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-weight | `400` | `400` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| font-style | `normal` | `normal` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| line-height | ↑ `` | `12px` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| letter-spacing | `0px` | `normal` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| text-transform | `none` | `none` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |
| white-space | ↑ `nowrap` | `` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .dwfield span i · 2026-09-14-pins2-board/app.css:3290 |


### `b`

inside `.—` · 3 on screen · **2 looks**

#### look 1 of 2

`G8-22` · rendered **36×16** · 2 instances look like this · text “3,180”

```html
<b>3,180</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `inline` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 var(--t-sm)/1 var(--data)` | `` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-size | ↑ `` | `12px` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-weight | `600` | `600` | .pb-meter2 span b · 2026-09-14-pins2-board/index.html:293 |
| font-style | ↑ `` | `normal` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| line-height | ↑ `` | `12px` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| letter-spacing | — | `normal` | initial |
| white-space | ↑ `nowrap` | `` | inherited · .pb-meter2 span · 2026-09-14-pins2-board/index.html:292 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-meter2 span b · 2026-09-14-pins2-board/index.html:293 |

#### look 2 of 2

`G8-43` · rendered **72×12** · 1 instance look like this · text “Sun Nov 15”

```html
<b>Sun Nov 15</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `600 var(--t-sm)/1 var(--data)` | `` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-size | ↑ `` | `12px` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-weight | `600` | `600` | .pb-echo.pb-dim b · 2026-09-14-pins2-board/index.html:73 |
| font-style | ↑ `` | `normal` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| line-height | ↑ `` | `12px` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-echo.pb-dim b · 2026-09-14-pins2-board/index.html:73 |


### `div.pb-banner`

inside `.dwfield` · 2 on screen · **2 looks**

#### look 1 of 2

`G8-25` · rendered **492×44** · 1 instance look like this

```html
<div class="pb-banner"><span class="pb-th"></span><input value="https://example.com/kilo-draw.png"></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-banner · 2026-09-14-pins2-board/index.html:129 |
| grid-template-columns | `80px 1fr` | `80px 400px` | .pb-banner · 2026-09-14-pins2-board/index.html:129 |
| gap | `12px` | `` | .pb-banner · 2026-09-14-pins2-board/index.html:129 |
| column-gap | `12px` | `12px` | .pb-banner · 2026-09-14-pins2-board/index.html:129 |
| row-gap | `12px` | `12px` | .pb-banner · 2026-09-14-pins2-board/index.html:129 |
| align-items | `end` | `end` | .pb-banner · 2026-09-14-pins2-board/index.html:129 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G8-79` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-banner"><span class="pb-th pb-bad">⟨svg.ic.lg⟩</span><input class="pb-bad" value="https://cdn.example.net/old/banner.png"></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-banner · 2026-09-14-pins2-board/index.html:129 |
| grid-template-columns | `80px 1fr` | `80px 1fr` | .pb-banner · 2026-09-14-pins2-board/index.html:129 |
| gap | `12px` | `` | .pb-banner · 2026-09-14-pins2-board/index.html:129 |
| column-gap | `12px` | `12px` | .pb-banner · 2026-09-14-pins2-board/index.html:129 |
| row-gap | `12px` | `12px` | .pb-banner · 2026-09-14-pins2-board/index.html:129 |
| align-items | `end` | `end` | .pb-banner · 2026-09-14-pins2-board/index.html:129 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-th`

inside `.pb-banner` · 1 on screen · **1 look**

#### the one look

`G8-26` · rendered **80×44** · 1 instance look like this

```html
<span class="pb-th"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| height | `var(--tap)` | `44px` | .pb-banner .pb-th · 2026-09-14-pins2-board/index.html:130 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-2)` | `` | .pb-banner .pb-th · 2026-09-14-pins2-board/index.html:130 |
| background | `linear-gradient(115deg,#3b0d24,#7a1846 40%,#ec4899 70%,#ffc36b)` | `` | .pb-banner .pb-th · 2026-09-14-pins2-board/index.html:130 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-banner .pb-th · 2026-09-14-pins2-board/index.html:130 |
| background-image | `linear-gradient(115deg, rgb(59, 13, 36), rgb(122, 24, 70) 40%, rgb(236, 72, 153) 70%, rgb(255, 195, 107))` | `linear-gradient(115deg, rgb(59, 13, 36), rgb(122, 24, 70) 40%, rgb(236, 72, 153) 70%, rgb(255, 195, 107))` | .pb-banner .pb-th · 2026-09-14-pins2-board/index.html:130 |
| box-shadow | `rgba(255, 255, 255, 0.08) 0px 0px 0px 1px inset` | `rgba(255, 255, 255, 0.08) 0px 0px 0px 1px inset` | .pb-banner .pb-th · 2026-09-14-pins2-board/index.html:130 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-echo`

inside `.dwfield` · 4 on screen · **1 look**

#### the one look

`G8-27` · rendered **400×12** · 2 instances look like this

```html
<span class="pb-echo" style="margin-left:92px">⟨svg.ic.sm⟩1600 × 900</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| gap | `6px` | `` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| column-gap | `6px` | `6px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| row-gap | `6px` | `6px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| align-items | `center` | `center` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `6px` | `6px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| margin-left | `92px` | `92px` | style attribute |
| font | `600 var(--t-sm)/1 var(--data)` | `` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-size | `` | `12px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-weight | `` | `600` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-style | `` | `normal` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-variant-numeric | `` | `normal` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| line-height | `` | `12px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ok)` | `rgb(123, 219, 99)` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |


### `svg.ic.sm`

inside `.pb-echo` · 4 on screen · **1 look**

#### the one look

`G8-28` · rendered **10×10** · 2 instances look like this

```html
<svg class="ic sm"><use href="#i-check"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| width | `0.85em` | `10.1875px` | .ic.sm · 2026-09-14-pins2-board/app.css:6169 |
| height | `0.85em` | `10.1875px` | .ic.sm · 2026-09-14-pins2-board/app.css:6169 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `600 var(--t-sm)/1 var(--data)` | `` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-size | ↑ `` | `12px` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-weight | ↑ `` | `600` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-style | ↑ `` | `normal` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| line-height | ↑ `` | `12px` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ok)` | `rgb(123, 219, 99)` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |


### `div.dw-grid2`

inside `.pb-col` · 2 on screen · **2 looks**

#### look 1 of 2

`G8-29` · rendered **492×116** · 1 instance look like this

```html
<div class="dw-grid2" style="gap:0 16px"> <div class="dwfield"><div class="pb-lrow"><label>Starts</label></div><input value="in 3 days"><span class="pb-echo">⟨svg.ic.sm⟩Wed Sep 16</span></div> <div class="dwfield pb-endf" data-never="false"><div class="pb-lrow"><label>Ends</label><button class="pb-sw" role="switch" aria-checked="false"><span class="pb-swt"><i></i></span>Never ends</button></div><input placeholder="Bl
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .dw-grid2 · 2026-09-14-pins2-board/app.css:6572 |
| grid-template-columns | `1fr 1fr` | `238px 238px` | .dw-grid2 · 2026-09-14-pins2-board/app.css:6572 |
| gap | `0 16px` | `` | style attribute |
| column-gap | `16px` | `16px` | style attribute |
| row-gap | `0px` | `0px` | style attribute |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G8-84` · rendered **0×0** · 1 instance look like this

```html
<div class="dw-grid2" style="gap:0 16px"> <div class="dwfield"><div class="pb-lrow"><label>Starts</label></div><input value="Sep 16"><span class="pb-echo">⟨svg.ic.sm⟩Wed Sep 16</span></div> <div class="dwfield pb-endf" data-never="false"><div class="pb-lrow"><label>Ends</label><button class="pb-sw" role="switch" aria-checked="false"><span class="pb-swt"><i></i></span>Never ends</button></div><input value="Sep 20"><di
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .dw-grid2 · 2026-09-14-pins2-board/app.css:6572 |
| grid-template-columns | `1fr 1fr` | `1fr 1fr` | .dw-grid2 · 2026-09-14-pins2-board/app.css:6572 |
| gap | `0 16px` | `` | style attribute |
| column-gap | `16px` | `16px` | style attribute |
| row-gap | `0px` | `0px` | style attribute |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-lrow`

inside `.dwfield` · 4 on screen · **2 looks**

#### look 1 of 2

`G8-31` · rendered **238×32** · 2 instances look like this

```html
<div class="pb-lrow"><label>Starts</label></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-lrow · 2026-09-14-pins2-board/index.html:232 |
| align-items | `center` | `center` | .pb-lrow · 2026-09-14-pins2-board/index.html:232 |
| justify-content | `space-between` | `space-between` | .pb-lrow · 2026-09-14-pins2-board/index.html:232 |
| min-height | `32px` | `32px` | .pb-lrow · 2026-09-14-pins2-board/index.html:232 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `6px` | `6px` | .pb-lrow · 2026-09-14-pins2-board/index.html:232 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G8-86` · rendered **0×0** · 2 instances look like this

```html
<div class="pb-lrow"><label>Starts</label></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-lrow · 2026-09-14-pins2-board/index.html:232 |
| align-items | `center` | `center` | .pb-lrow · 2026-09-14-pins2-board/index.html:232 |
| justify-content | `space-between` | `space-between` | .pb-lrow · 2026-09-14-pins2-board/index.html:232 |
| min-height | `32px` | `32px` | .pb-lrow · 2026-09-14-pins2-board/index.html:232 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `6px` | `6px` | .pb-lrow · 2026-09-14-pins2-board/index.html:232 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.dwfield.pb-endf`

inside `.dw-grid2` · 2 on screen · **2 looks**

#### look 1 of 2

`G8-35` · rendered **238×116** · 1 instance look like this

```html
<div class="dwfield pb-endf" data-never="false"><div class="pb-lrow"><label>Ends</label><button class="pb-sw" role="switch" aria-checked="false"><span class="pb-swt"><i></i></span>Never ends</button></div><input placeholder="Blank"><div class="pb-neverval">⟨svg.ic⟩Stays up until you remove it</div><span class="pb-echo pb-dim">default · <b>Sun Nov 15</b></span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| gap | `var(--s2)` | `` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| column-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| row-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| flex-direction | `column` | `column` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `0px` | `0px` | .pb-stage .dwfield · 2026-09-14-pins2-board/index.html:34 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G8-90` · rendered **0×0** · 1 instance look like this

```html
<div class="dwfield pb-endf" data-never="false"><div class="pb-lrow"><label>Ends</label><button class="pb-sw" role="switch" aria-checked="false"><span class="pb-swt"><i></i></span>Never ends</button></div><input value="Sep 20"><div class="pb-neverval">⟨svg.ic⟩Stays up until you remove it</div><span class="pb-echo">⟨svg.ic.sm⟩Sun Sep 20</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| gap | `var(--s2)` | `` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| column-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| row-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| flex-direction | `column` | `column` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `0px` | `0px` | .pb-stage .dwfield · 2026-09-14-pins2-board/index.html:34 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `button.pb-sw[role=switch]`

inside `.pb-lrow` · 2 on screen · **2 looks**

#### look 1 of 2

`G8-38` · rendered **116×32** · 1 instance look like this · role="switch"

```html
<button class="pb-sw" role="switch" aria-checked="false"><span class="pb-swt"><i></i></span>Never ends</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| gap | `10px` | `` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| column-gap | `10px` | `10px` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| row-gap | `10px` | `10px` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| align-items | `center` | `center` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| min-height | `32px` | `32px` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `0 2px` | `` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| padding-top | `0px` | `0px` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| padding-right | `2px` | `2px` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| padding-bottom | `0px` | `0px` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| padding-left | `2px` | `2px` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| border | `0` | `` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| border-radius | `var(--ctl-rad, 5px)` | `` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| background | `none` | `` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| background-image | `none` | `none` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font | `500 var(--t-sm)/1 var(--ui)` | `` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font-size | `` | `12px` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font-weight | `` | `500` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font-style | `` | `normal` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font-variant-numeric | `` | `normal` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| line-height | `` | `12px` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `rgba(0, 0, 0, 0)` | `rgb(42, 52, 61)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `3px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |

#### look 2 of 2

`G8-93` · rendered **0×0** · 1 instance look like this · role="switch"

```html
<button class="pb-sw" role="switch" aria-checked="false"><span class="pb-swt"><i></i></span>Never ends</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| gap | `10px` | `` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| column-gap | `10px` | `10px` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| row-gap | `10px` | `10px` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| align-items | `center` | `center` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| min-height | `32px` | `32px` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `0 2px` | `` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| padding-top | `0px` | `0px` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| padding-right | `2px` | `2px` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| padding-bottom | `0px` | `0px` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| padding-left | `2px` | `2px` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| border | `0` | `` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| border-radius | `var(--ctl-rad, 5px)` | `` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| background | `none` | `` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| background-image | `none` | `none` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font | `500 var(--t-sm)/1 var(--ui)` | `` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font-size | `` | `12px` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font-weight | `` | `500` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font-style | `` | `normal` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font-variant-numeric | `` | `normal` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| line-height | `` | `12px` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | .pb-sw · 2026-09-14-pins2-board/index.html:234 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `rgba(0, 0, 0, 0)` | `rgb(42, 52, 61)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `3px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself


### `span.pb-swt`

inside `.pb-sw` · 2 on screen · **1 look**

#### the one look

`G8-39` · rendered **38×22** · 2 instances look like this

```html
<span class="pb-swt"><i></i></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `relative` | `relative` | .pb-swt · 2026-09-14-pins2-board/index.html:235 |
| width | `38px` | `38px` | .pb-swt · 2026-09-14-pins2-board/index.html:235 |
| height | `22px` | `22px` | .pb-swt · 2026-09-14-pins2-board/index.html:235 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-pill)` | `` | .pb-swt · 2026-09-14-pins2-board/index.html:235 |
| background | `var(--sunk)` | `` | .pb-swt · 2026-09-14-pins2-board/index.html:235 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-swt · 2026-09-14-pins2-board/index.html:235 |
| background-image | `` | `none` | .pb-swt · 2026-09-14-pins2-board/index.html:235 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-swt · 2026-09-14-pins2-board/index.html:235 |
| font | ↑ `500 var(--t-sm)/1 var(--ui)` | `` | inherited · .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font-size | ↑ `` | `12px` | inherited · .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font-weight | ↑ `` | `500` | inherited · .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font-style | ↑ `` | `normal` | inherited · .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| line-height | ↑ `` | `12px` | inherited · .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-sw · 2026-09-14-pins2-board/index.html:234 |
| transition | `background .2s,box-shadow .2s` | `` | .pb-swt · 2026-09-14-pins2-board/index.html:235 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-sw · 2026-09-14-pins2-board/index.html:234 |


### `span.pb-dim.pb-echo`

inside `.dwfield` · 1 on screen · **1 look**

#### the one look

`G8-42` · rendered **238×12** · 1 instance look like this

```html
<span class="pb-echo pb-dim">default · <b>Sun Nov 15</b></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| gap | `6px` | `` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| column-gap | `6px` | `6px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| row-gap | `6px` | `6px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| align-items | `center` | `center` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `6px` | `6px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font | `600 var(--t-sm)/1 var(--data)` | `` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-size | `` | `12px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-weight | `` | `600` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-style | `` | `normal` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-variant-numeric | `` | `normal` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| line-height | `` | `12px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-echo.pb-dim · 2026-09-14-pins2-board/index.html:72 |


### `div.pb-rep`

inside `.dwfield` · 2 on screen · **2 looks**

#### look 1 of 2

`G8-46` · rendered **492×44** · 1 instance look like this

```html
<div class="pb-rep"> <div class="pb-step"><button aria-label="Fewer">⟨svg.ic⟩</button><output>3</output><button aria-label="More">⟨svg.ic⟩</button></div> <div class="pb-cards" role="img" aria-label="Shown to each player up to 3 times, at most once a day"><span class="pb-mini"></span><span class="pb-mini"></span><span class="pb-mini"></span><span class="pb-gapday">⟨svg.ic⟩1 a day max</span></div> </div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-rep · 2026-09-14-pins2-board/index.html:245 |
| grid-template-columns | `auto 1fr` | `auto 1fr` | .pb-rep · 2026-09-14-pins2-board/index.html:133 |
| gap | `20px` | `` | .pb-rep · 2026-09-14-pins2-board/index.html:245 |
| column-gap | `20px` | `20px` | .pb-rep · 2026-09-14-pins2-board/index.html:245 |
| row-gap | `20px` | `20px` | .pb-rep · 2026-09-14-pins2-board/index.html:245 |
| align-items | `center` | `center` | .pb-rep · 2026-09-14-pins2-board/index.html:245 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G8-101` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-rep"> <div class="pb-step"><button aria-label="Fewer">⟨svg.ic⟩</button><output>7</output><button aria-label="More">⟨svg.ic⟩</button></div> <div class="pb-cards pb-tight" role="img" aria-label="Only 5 of 7 showings fit before it ends Sep 20"><span class="pb-mini"></span><span class="pb-mini"></span><span class="pb-mini"></span><span class="pb-mini"></span><span class="pb-mini"></span><span class="pb-cut
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-rep · 2026-09-14-pins2-board/index.html:245 |
| grid-template-columns | `auto 1fr` | `auto 1fr` | .pb-rep · 2026-09-14-pins2-board/index.html:133 |
| gap | `20px` | `` | .pb-rep · 2026-09-14-pins2-board/index.html:245 |
| column-gap | `20px` | `20px` | .pb-rep · 2026-09-14-pins2-board/index.html:245 |
| row-gap | `20px` | `20px` | .pb-rep · 2026-09-14-pins2-board/index.html:245 |
| align-items | `center` | `center` | .pb-rep · 2026-09-14-pins2-board/index.html:245 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-step`

inside `.pb-rep` · 2 on screen · **1 look**

#### the one look

`G8-47` · rendered **132×44** · 2 instances look like this

```html
<div class="pb-step"><button aria-label="Fewer">⟨svg.ic⟩</button><output>3</output><button aria-label="More">⟨svg.ic⟩</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-step · 2026-09-14-pins2-board/index.html:134 |
| align-items | `center` | `center` | .pb-step · 2026-09-14-pins2-board/index.html:134 |
| height | `var(--tap)` | `44px` | .pb-step · 2026-09-14-pins2-board/index.html:134 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-2)` | `` | .pb-step · 2026-09-14-pins2-board/index.html:134 |
| background | `var(--sunk)` | `` | .pb-step · 2026-09-14-pins2-board/index.html:134 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-step · 2026-09-14-pins2-board/index.html:134 |
| background-image | `` | `none` | .pb-step · 2026-09-14-pins2-board/index.html:134 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-step · 2026-09-14-pins2-board/index.html:134 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-step · 2026-09-14-pins2-board/index.html:134 |
| overflow-x | `hidden` | `hidden` | .pb-step · 2026-09-14-pins2-board/index.html:134 |
| overflow-y | `hidden` | `hidden` | .pb-step · 2026-09-14-pins2-board/index.html:134 |


### `div.pb-cards[role=img]`

inside `.pb-rep` · 1 on screen · **1 look**

#### the one look

`G8-50` · rendered **253×44** · 1 instance look like this · aria-label="Shown to each player up to 3 times, at m" role="img"

```html
<div class="pb-cards" role="img" aria-label="Shown to each player up to 3 times, at most once a day"><span class="pb-mini"></span><span class="pb-mini"></span><span class="pb-mini"></span><span class="pb-gapday">⟨svg.ic⟩1 a day max</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-cards · 2026-09-14-pins2-board/index.html:294 |
| gap | `8px` | `` | .pb-cards · 2026-09-14-pins2-board/index.html:294 |
| column-gap | `8px` | `8px` | .pb-cards · 2026-09-14-pins2-board/index.html:294 |
| row-gap | `8px` | `8px` | .pb-cards · 2026-09-14-pins2-board/index.html:294 |
| align-items | `center` | `center` | .pb-cards · 2026-09-14-pins2-board/index.html:294 |
| height | `var(--tap)` | `44px` | .pb-cards · 2026-09-14-pins2-board/index.html:294 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-mini`

inside `.pb-cards` · 8 on screen · **2 looks**

#### look 1 of 2

`G8-51` · rendered **34×26** · 3 instances look like this

```html
<span class="pb-mini"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `relative` | `relative` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| flex | `none` | `` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| width | `34px` | `34px` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| height | `26px` | `26px` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1)` | `` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| background | `var(--raised)` | `` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| background-image | `` | `none` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| overflow-x | `hidden` | `hidden` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| overflow-y | `hidden` | `hidden` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| width | `3px` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| top | `0px` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| bottom | `0px` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| left | `0px` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| background | `var(--r-broadcast)` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| background-color | `` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| background-image | `` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| content | `""` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| height | `3px` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| top | `8px` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| right | `7px` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| left | `8px` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| border-radius | `2px` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| background | `var(--ink3)` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| background-color | `` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| background-image | `` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| box-shadow | `0 6px 0 0 color-mix(in srgb,var(--ink3) 55%,transparent)` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| content | `""` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |

#### look 2 of 2

`G8-106` · rendered **0×0** · 5 instances look like this

```html
<span class="pb-mini"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `relative` | `relative` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| flex | `none` | `` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| width | `26px` | `26px` | .pb-cards.pb-tight .pb-mini · 2026-09-14-pins2-board/index.html:308 |
| height | `22px` | `22px` | .pb-cards.pb-tight .pb-mini · 2026-09-14-pins2-board/index.html:308 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1)` | `` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| background | `var(--raised)` | `` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| background-image | `` | `none` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| overflow-x | `hidden` | `hidden` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| overflow-y | `hidden` | `hidden` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| width | `3px` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| top | `0px` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| bottom | `0px` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| left | `0px` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| background | `var(--r-broadcast)` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| background-color | `` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| background-image | `` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| content | `""` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| height | `3px` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| top | `7px` | .pb-cards.pb-tight .pb-mini::after · 2026-09-14-pins2-board/index.html:309 |
| right | `5px` | .pb-cards.pb-tight .pb-mini::after · 2026-09-14-pins2-board/index.html:309 |
| left | `7px` | .pb-cards.pb-tight .pb-mini::after · 2026-09-14-pins2-board/index.html:309 |
| border-radius | `2px` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| background | `var(--ink3)` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| background-color | `` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| background-image | `` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| box-shadow | `0 6px 0 0 color-mix(in srgb,var(--ink3) 55%,transparent)` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| content | `""` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |


### `span.pb-gapday`

inside `.pb-cards` · 1 on screen · **1 look**

#### the one look

`G8-54` · rendered **119×28** · 1 instance look like this

```html
<span class="pb-gapday">⟨svg.ic⟩1 a day max</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| gap | `6px` | `` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| column-gap | `6px` | `6px` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| row-gap | `6px` | `6px` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| align-items | `center` | `center` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| height | `28px` | `28px` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 10px` | `` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| padding-top | `0px` | `0px` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| padding-right | `10px` | `10px` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| padding-bottom | `0px` | `0px` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| padding-left | `10px` | `10px` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| margin-left | `8px` | `8px` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| border-radius | `var(--rad-pill)` | `` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| background | `var(--sunk)` | `` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| background-image | `` | `none` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| box-shadow | `inset 0 0 0 1px var(--rule)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| font | `600 var(--t-sm)/1 var(--data)` | `` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| font-size | `` | `12px` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| font-weight | `` | `600` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| font-style | `` | `normal` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| font-variant-numeric | `` | `normal` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| line-height | `` | `12px` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-gapday · 2026-09-14-pins2-board/index.html:301 |


### `aside.bed-side.pb-card`

inside `.bed` · 2 on screen · **2 looks**

#### look 1 of 2

`G8-56` · rendered **320×308** · 1 instance look like this

```html
<aside class="bed-side pb-card"><div class="bed-sec"><h5>In Discord</h5> <div class="dcard"><div class="pb-h">New Legendary draw is live</div> <p>The Kilo Bolt-Action draw opens today. C…<code>/draw prices</code> before you spin.</p> <div class="pb-ts">Posted in 3 days</div><div class="pb-img2"></div></div></div></aside>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | article, aside, footer, header, hgroup, main, nav, search, section · user-agent:? |
| position | `sticky` | `sticky` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| align-self | `start` | `start` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| min-width | `0px` | `0px` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `14px` | `14px` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G8-115` · rendered **0×0** · 1 instance look like this

```html
<aside class="bed-side pb-card"><div class="bed-sec"><h5>In Discord</h5> <div class="dcard"><div class="pb-h">New Legendary draw is live</div><p>The Kilo Bolt-Action draw opens today.</p><div class="pb-ts">Posted Sep 16</div> <div class="pb-img2 pb-bad">⟨svg.ic.xl⟩</div></div></div></aside>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | article, aside, footer, header, hgroup, main, nav, search, section · user-agent:? |
| position | `sticky` | `sticky` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| align-self | `start` | `start` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| min-width | `0px` | `0px` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `14px` | `14px` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.bed-sec`

inside `.bed-side` · 2 on screen · **2 looks**

#### look 1 of 2

`G8-57` · rendered **320×288** · 1 instance look like this

```html
<div class="bed-sec"><h5>In Discord</h5> <div class="dcard"><div class="pb-h">New Legendary draw is live</div> <p>The Kilo Bolt-Action draw opens today. C…<code>/draw prices</code> before you spin.</p> <div class="pb-ts">Posted in 3 days</div><div class="pb-img2"></div></div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `20px` | `20px` | .bed-sec · 2026-09-14-pins2-board/app.css:3282 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G8-116` · rendered **0×0** · 1 instance look like this

```html
<div class="bed-sec"><h5>In Discord</h5> <div class="dcard"><div class="pb-h">New Legendary draw is live</div><p>The Kilo Bolt-Action draw opens today.</p><div class="pb-ts">Posted Sep 16</div> <div class="pb-img2 pb-bad">⟨svg.ic.xl⟩</div></div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `20px` | `20px` | .bed-sec · 2026-09-14-pins2-board/app.css:3282 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.dcard`

inside `.bed-sec` · 2 on screen · **2 looks**

#### look 1 of 2

`G8-58` · rendered **320×268** · 1 instance look like this

```html
<div class="dcard"><div class="pb-h">New Legendary draw is live</div> <p>The Kilo Bolt-Action draw opens today. C…<code>/draw prices</code> before you spin.</p> <div class="pb-ts">Posted in 3 days</div><div class="pb-img2"></div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `11px 13px` | `` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-top | `11px` | `11px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-right | `13px` | `13px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-bottom | `11px` | `11px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-left | `13px` | `13px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| border-left | `4px solid var(--c)` | `` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| border-radius | `8px/* foreign-radius: Discord's own corner, like --dc-*. The preview must look like Discord, not like the portal. */` | `` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| background | `var(--dc-bg)` | `` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| background-color | `` | `rgb(43, 45, 49)` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| background-image | `` | `none` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `12.5px` | `12.5px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18.75px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--dc-body)` | `rgb(219, 222, 225)` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| transition | `transform var(--dur-2) var(--ease), background var(--dur-2) var(--ease),box-shadow var(--dur-2) var(--ease),border-color var(--dur-2) var(--ease)` | `` | .wcard, .ccard, .tile, .hlive .lp, .dcard · 2026-09-14-pins2-board/app.css:5712 |

#### look 2 of 2

`G8-117` · rendered **0×0** · 1 instance look like this

```html
<div class="dcard"><div class="pb-h">New Legendary draw is live</div><p>The Kilo Bolt-Action draw opens today.</p><div class="pb-ts">Posted Sep 16</div> <div class="pb-img2 pb-bad">⟨svg.ic.xl⟩</div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `11px 13px` | `` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-top | `11px` | `11px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-right | `13px` | `13px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-bottom | `11px` | `11px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-left | `13px` | `13px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| border-left | `4px solid var(--c)` | `` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| border-radius | `8px/* foreign-radius: Discord's own corner, like --dc-*. The preview must look like Discord, not like the portal. */` | `` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| background | `var(--dc-bg)` | `` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| background-color | `` | `rgb(43, 45, 49)` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| background-image | `` | `none` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `12.5px` | `12.5px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18.75px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--dc-body)` | `rgb(219, 222, 225)` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| transition | `transform var(--dur-2) var(--ease), background var(--dur-2) var(--ease),box-shadow var(--dur-2) var(--ease),border-color var(--dur-2) var(--ease)` | `` | .wcard, .ccard, .tile, .hlive .lp, .dcard · 2026-09-14-pins2-board/app.css:5712 |


### `div.pb-h`

inside `.dcard` · 2 on screen · **2 looks**

#### look 1 of 2

`G8-59` · rendered **290×20** · 1 instance look like this · text “New Legendary draw is live”

```html
<div class="pb-h">New Legendary draw is live</div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0 0 6px` | `` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| margin-top | `0px` | `0px` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| margin-right | `0px` | `0px` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| margin-bottom | `6px` | `6px` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| margin-left | `0px` | `0px` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| font | `700 16px/1.25 var(--ui)` | `` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| font-size | `` | `16px` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| font-weight | `` | `700` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| font-style | `` | `normal` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| font-variant-numeric | `` | `normal` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| line-height | `` | `20px` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| letter-spacing | — | `normal` | initial |
| color | `var(--dc-ink)` | `rgb(242, 243, 245)` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |

#### look 2 of 2

`G8-118` · rendered **0×0** · 1 instance look like this · text “New Legendary draw is live”

```html
<div class="pb-h">New Legendary draw is live</div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0 0 6px` | `` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| margin-top | `0px` | `0px` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| margin-right | `0px` | `0px` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| margin-bottom | `6px` | `6px` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| margin-left | `0px` | `0px` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| font | `700 16px/1.25 var(--ui)` | `` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| font-size | `` | `16px` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| font-weight | `` | `700` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| font-style | `` | `normal` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| font-variant-numeric | `` | `normal` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| line-height | `` | `20px` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |
| letter-spacing | — | `normal` | initial |
| color | `var(--dc-ink)` | `rgb(242, 243, 245)` | .pb-card .dcard .pb-h · 2026-09-14-pins2-board/index.html:139 |


### `p`

inside `.dcard` · 2 on screen · **2 looks**

#### look 1 of 2

`G8-60` · rendered **290×39** · 1 instance look like this

```html
<p>The Kilo Bolt-Action draw opens today. C…<code>/draw prices</code> before you spin.</p>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | p · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0 0 6px` | `` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 |
| margin-top | `0px` | `0px` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 |
| margin-right | `0px` | `0px` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 |
| margin-bottom | `6px` | `6px` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 |
| margin-left | `0px` | `0px` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `13.5px` | `13.5px` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 |
| font-weight | — | `400` | initial |
| line-height | ⚠️ `1.45` | `19.575px` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 · **a later rule wins — port the computed value and find that rule** |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--dc-body)` | `rgb(219, 222, 225)` | inherited · .dcard · 2026-09-14-pins2-board/app.css:1296 |

#### look 2 of 2

`G8-119` · rendered **0×0** · 1 instance look like this · text “The Kilo Bolt-Action draw opens today.”

```html
<p>The Kilo Bolt-Action draw opens today.</p>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | p · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0 0 6px` | `` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 |
| margin-top | `0px` | `0px` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 |
| margin-right | `0px` | `0px` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 |
| margin-bottom | `6px` | `6px` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 |
| margin-left | `0px` | `0px` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `13.5px` | `13.5px` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 |
| font-weight | — | `400` | initial |
| line-height | ⚠️ `1.45` | `19.575px` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 · **a later rule wins — port the computed value and find that rule** |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--dc-body)` | `rgb(219, 222, 225)` | inherited · .dcard · 2026-09-14-pins2-board/app.css:1296 |


### `div.pb-ts`

inside `.dcard` · 2 on screen · **2 looks**

#### look 1 of 2

`G8-61` · rendered **290×17** · 1 instance look like this · text “Posted in 3 days”

```html
<div class="pb-ts">Posted in 3 days</div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `11px` | `11px` | .pb-card .dcard .pb-ts · 2026-09-14-pins2-board/index.html:144 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `16.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--dc-dim)` | `rgb(148, 155, 164)` | .pb-card .dcard .pb-ts · 2026-09-14-pins2-board/index.html:144 |

#### look 2 of 2

`G8-120` · rendered **0×0** · 1 instance look like this · text “Posted Sep 16”

```html
<div class="pb-ts">Posted Sep 16</div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `11px` | `11px` | .pb-card .dcard .pb-ts · 2026-09-14-pins2-board/index.html:144 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `16.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--dc-dim)` | `rgb(148, 155, 164)` | .pb-card .dcard .pb-ts · 2026-09-14-pins2-board/index.html:144 |


### `div.pb-img2`

inside `.dcard` · 1 on screen · **1 look**

#### the one look

`G8-62` · rendered **290×148** · 1 instance look like this

```html
<div class="pb-img2"></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| height | `148px` | `148px` | .pb-card .dcard .pb-img2 · 2026-09-14-pins2-board/index.html:142 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `10px` | `10px` | .pb-card .dcard .pb-img2 · 2026-09-14-pins2-board/index.html:142 |
| border-radius | `var(--rad-2)` | `` | .pb-card .dcard .pb-img2 · 2026-09-14-pins2-board/index.html:142 |
| background | `linear-gradient(115deg,#3b0d24,#7a1846 40%,#ec4899 70%,#ffc36b)` | `` | .pb-card .dcard .pb-img2 · 2026-09-14-pins2-board/index.html:142 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-card .dcard .pb-img2 · 2026-09-14-pins2-board/index.html:142 |
| background-image | `linear-gradient(115deg, rgb(59, 13, 36), rgb(122, 24, 70) 40%, rgb(236, 72, 153) 70%, rgb(255, 195, 107))` | `linear-gradient(115deg, rgb(59, 13, 36), rgb(122, 24, 70) 40%, rgb(236, 72, 153) 70%, rgb(255, 195, 107))` | .pb-card .dcard .pb-img2 · 2026-09-14-pins2-board/index.html:142 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `12.5px` | `12.5px` | inherited · .dcard · 2026-09-14-pins2-board/app.css:1097 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18.75px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--dc-body)` | `rgb(219, 222, 225)` | inherited · .dcard · 2026-09-14-pins2-board/app.css:1296 |


### `span.pb-bad.pb-th`

inside `.pb-banner` · 1 on screen · **1 look**

#### the one look

`G8-80` · rendered **0×0** · 1 instance look like this

```html
<span class="pb-th pb-bad">⟨svg.ic.lg⟩</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-banner .pb-th.pb-bad · 2026-09-14-pins2-board/index.html:131 |
| align-items | `center` | `center` | .pb-banner .pb-th.pb-bad · 2026-09-14-pins2-board/index.html:131 |
| place-items | `center` | `` | .pb-banner .pb-th.pb-bad · 2026-09-14-pins2-board/index.html:131 |
| height | `var(--tap)` | `44px` | .pb-banner .pb-th · 2026-09-14-pins2-board/index.html:130 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-2)` | `` | .pb-banner .pb-th · 2026-09-14-pins2-board/index.html:130 |
| background | `var(--sunk)` | `` | .pb-banner .pb-th.pb-bad · 2026-09-14-pins2-board/index.html:131 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-banner .pb-th.pb-bad · 2026-09-14-pins2-board/index.html:131 |
| background-image | `` | `none` | .pb-banner .pb-th.pb-bad · 2026-09-14-pins2-board/index.html:131 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--warn) 55%,transparent)` | `color(srgb 1 0.478431 0.270588 / 0.55) 0px 0px 0px 1px inset` | .pb-banner .pb-th.pb-bad · 2026-09-14-pins2-board/index.html:131 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--warn)` | `rgb(255, 122, 69)` | .pb-banner .pb-th.pb-bad · 2026-09-14-pins2-board/index.html:131 |


### `svg.ic.lg`

inside `.pb-th` · 1 on screen · **1 look**

#### the one look

`G8-81` · rendered **0×0** · 1 instance look like this

```html
<svg class="ic lg"><use href="#i-triangle-alert"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| width | `1.35em` | `17.55px` | .ic.lg · 2026-09-14-pins2-board/app.css:6170 |
| height | `1.35em` | `17.55px` | .ic.lg · 2026-09-14-pins2-board/app.css:6170 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--warn)` | `rgb(255, 122, 69)` | inherited · .pb-banner .pb-th.pb-bad · 2026-09-14-pins2-board/index.html:131 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |


### `input.pb-bad`

inside `.pb-banner` · 1 on screen · **1 look**

#### the one look

`G8-82` · rendered **0×0** · 1 instance look like this

```html
<input class="pb-bad" value="https://cdn.example.net/old/banner.png">
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | input, textarea, select, button · user-agent:? |
| min-height | `var(--tap)` | `44px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `8px 10px` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-top | `8px` | `8px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-right | `10px` | `10px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-bottom | `8px` | `8px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-left | `var(--ctl-pl,10px)` | `10px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]) · 2026-09-14-pins2-board/app.css:633 |
| border | `1px solid var(--rule2)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| border-color | `var(--warn)` | `` | .pb-banner input.pb-bad · 2026-09-14-pins2-board/index.html:132 |
| border-radius | `var(--rad-2)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| background | `var(--sunk)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| background-color | `` | `rgb(11, 15, 18)` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| background-image | `` | `none` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| font | `500 var(--t-base)/1 var(--ui)` | `` | .dwfield input · 2026-09-14-pins2-board/app.css:2243 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .dwfield input · 2026-09-14-pins2-board/app.css:2243 |
| font-size | `var(--t-base)` | `13px` | .pb-stage .dwfield input, .pb-stage .dwfield select · 2026-09-14-pins2-board/index.html:33 |
| font-weight | `` | `500` | .dwfield input · 2026-09-14-pins2-board/app.css:2243 |
| font-style | `` | `normal` | .dwfield input · 2026-09-14-pins2-board/app.css:2243 |
| font-variant-numeric | `` | `normal` | .dwfield input · 2026-09-14-pins2-board/app.css:2243 |
| line-height | `` | `13px` | .dwfield input · 2026-09-14-pins2-board/app.css:2243 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `start` | `start` | input, textarea, select, button · user-agent:? |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .dwfield input · 2026-09-14-pins2-board/app.css:2243 |
| overflow-x | `clip !important !important` | `clip` | input:not([type="range" i], [type="checkbox" i], [type="radio" i]) · user-agent:? |
| overflow-y | `clip !important !important` | `clip` | input:not([type="range" i], [type="checkbox" i], [type="radio" i]) · user-agent:? |
| cursor | `text` | `text` | input · user-agent:? |

**:hover** — changes nothing on the element itself

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself


### `span.pb-echo.pb-warn`

inside `.dwfield` · 1 on screen · **1 look**

#### the one look

`G8-83` · rendered **0×0** · 1 instance look like this · text “didn’t load”

```html
<span class="pb-echo pb-warn" style="margin-left:92px">didn’t load</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| gap | `6px` | `` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| column-gap | `6px` | `6px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| row-gap | `6px` | `6px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| align-items | `center` | `center` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `6px` | `6px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| margin-left | `92px` | `92px` | style attribute |
| font | `600 var(--t-sm)/1 var(--data)` | `` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-size | `` | `12px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-weight | `` | `600` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-style | `` | `normal` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-variant-numeric | `` | `normal` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| line-height | `` | `12px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| letter-spacing | — | `normal` | initial |
| color | `var(--warn)` | `rgb(255, 122, 69)` | .pb-echo.pb-warn · 2026-09-14-pins2-board/index.html:74 |


### `div.pb-cards.pb-tight[role=img]`

inside `.pb-rep` · 1 on screen · **1 look**

#### the one look

`G8-105` · rendered **0×0** · 1 instance look like this · aria-label="Only 5 of 7 showings fit before it ends " role="img"

```html
<div class="pb-cards pb-tight" role="img" aria-label="Only 5 of 7 showings fit before it ends Sep 20"><span class="pb-mini"></span><span class="pb-mini"></span><span class="pb-mini"></span><span class="pb-mini"></span><span class="pb-mini"></span><span class="pb-cutbar"></span><span class="pb-mini pb-over"></span><span class="pb-mini pb-over"></span><span class="pb-fit">5 fit by Sep 20</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-cards · 2026-09-14-pins2-board/index.html:294 |
| gap | `6px` | `` | .pb-cards.pb-tight · 2026-09-14-pins2-board/index.html:307 |
| column-gap | `6px` | `6px` | .pb-cards.pb-tight · 2026-09-14-pins2-board/index.html:307 |
| row-gap | `6px` | `6px` | .pb-cards.pb-tight · 2026-09-14-pins2-board/index.html:307 |
| align-items | `center` | `center` | .pb-cards · 2026-09-14-pins2-board/index.html:294 |
| height | `var(--tap)` | `44px` | .pb-cards · 2026-09-14-pins2-board/index.html:294 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-cutbar`

inside `.pb-cards` · 1 on screen · **1 look**

#### the one look

`G8-111` · rendered **0×0** · 1 instance look like this

```html
<span class="pb-cutbar"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .pb-cutbar · 2026-09-14-pins2-board/index.html:303 |
| width | `2px` | `2px` | .pb-cutbar · 2026-09-14-pins2-board/index.html:303 |
| height | `30px` | `30px` | .pb-cutbar · 2026-09-14-pins2-board/index.html:303 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0 2px` | `` | .pb-cutbar · 2026-09-14-pins2-board/index.html:303 |
| margin-top | `0px` | `0px` | .pb-cutbar · 2026-09-14-pins2-board/index.html:303 |
| margin-right | `2px` | `2px` | .pb-cutbar · 2026-09-14-pins2-board/index.html:303 |
| margin-bottom | `0px` | `0px` | .pb-cutbar · 2026-09-14-pins2-board/index.html:303 |
| margin-left | `2px` | `2px` | .pb-cutbar · 2026-09-14-pins2-board/index.html:303 |
| border-radius | `1px` | `` | .pb-cutbar · 2026-09-14-pins2-board/index.html:303 |
| background | `var(--warn)` | `` | .pb-cutbar · 2026-09-14-pins2-board/index.html:303 |
| background-color | `` | `rgb(255, 122, 69)` | .pb-cutbar · 2026-09-14-pins2-board/index.html:303 |
| background-image | `` | `none` | .pb-cutbar · 2026-09-14-pins2-board/index.html:303 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-mini.pb-over`

inside `.pb-cards` · 2 on screen · **1 look**

#### the one look

`G8-112` · rendered **0×0** · 2 instances look like this

```html
<span class="pb-mini pb-over"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `relative` | `relative` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| flex | `none` | `` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| width | `26px` | `26px` | .pb-cards.pb-tight .pb-mini · 2026-09-14-pins2-board/index.html:308 |
| height | `22px` | `22px` | .pb-cards.pb-tight .pb-mini · 2026-09-14-pins2-board/index.html:308 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1)` | `` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| background | `none` | `` | .pb-mini.pb-over · 2026-09-14-pins2-board/index.html:298 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-mini.pb-over · 2026-09-14-pins2-board/index.html:298 |
| background-image | `none` | `none` | .pb-mini.pb-over · 2026-09-14-pins2-board/index.html:298 |
| box-shadow | `inset 0 0 0 1.5px var(--warn)` | `rgb(255, 122, 69) 0px 0px 0px 1.5px inset` | .pb-mini.pb-over · 2026-09-14-pins2-board/index.html:298 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| opacity | `0.8` | `0.8` | .pb-mini.pb-over · 2026-09-14-pins2-board/index.html:298 |
| overflow | `hidden` | `` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| overflow-x | `hidden` | `hidden` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |
| overflow-y | `hidden` | `hidden` | .pb-mini · 2026-09-14-pins2-board/index.html:295 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| width | `3px` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| top | `0px` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| bottom | `0px` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| left | `0px` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |
| background | `var(--warn)` | .pb-mini.pb-over::before · 2026-09-14-pins2-board/index.html:299 |
| background-color | `` | .pb-mini.pb-over::before · 2026-09-14-pins2-board/index.html:299 |
| background-image | `` | .pb-mini.pb-over::before · 2026-09-14-pins2-board/index.html:299 |
| content | `""` | .pb-mini::before · 2026-09-14-pins2-board/index.html:296 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| height | `3px` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| top | `7px` | .pb-cards.pb-tight .pb-mini::after · 2026-09-14-pins2-board/index.html:309 |
| right | `5px` | .pb-cards.pb-tight .pb-mini::after · 2026-09-14-pins2-board/index.html:309 |
| left | `7px` | .pb-cards.pb-tight .pb-mini::after · 2026-09-14-pins2-board/index.html:309 |
| border-radius | `2px` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |
| background | `color-mix(in srgb,var(--warn) 60%,transparent)` | .pb-mini.pb-over::after · 2026-09-14-pins2-board/index.html:300 |
| background-color | `` | .pb-mini.pb-over::after · 2026-09-14-pins2-board/index.html:300 |
| background-image | `` | .pb-mini.pb-over::after · 2026-09-14-pins2-board/index.html:300 |
| box-shadow | `0 6px 0 0 color-mix(in srgb,var(--warn) 30%,transparent)` | .pb-mini.pb-over::after · 2026-09-14-pins2-board/index.html:300 |
| content | `""` | .pb-mini::after · 2026-09-14-pins2-board/index.html:297 |


### `span.pb-fit`

inside `.pb-cards` · 1 on screen · **1 look**

#### the one look

`G8-114` · rendered **0×0** · 1 instance look like this · text “5 fit by Sep 20”

```html
<span class="pb-fit">5 fit by Sep 20</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-left | `8px` | `8px` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |
| font | `600 var(--t-sm)/1 var(--data)` | `` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |
| font-size | `` | `12px` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |
| font-weight | `` | `600` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |
| font-style | `` | `normal` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |
| font-variant-numeric | `` | `normal` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |
| line-height | `` | `12px` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |
| color | `var(--warn)` | `rgb(255, 122, 69)` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |


### `div.pb-bad.pb-img2`

inside `.dcard` · 1 on screen · **1 look**

#### the one look

`G8-121` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-img2 pb-bad">⟨svg.ic.xl⟩</div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-card .dcard .pb-img2.pb-bad · 2026-09-14-pins2-board/index.html:143 |
| align-items | `center` | `center` | .pb-card .dcard .pb-img2.pb-bad · 2026-09-14-pins2-board/index.html:143 |
| place-items | `center` | `` | .pb-card .dcard .pb-img2.pb-bad · 2026-09-14-pins2-board/index.html:143 |
| height | `148px` | `148px` | .pb-card .dcard .pb-img2 · 2026-09-14-pins2-board/index.html:142 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `10px` | `10px` | .pb-card .dcard .pb-img2 · 2026-09-14-pins2-board/index.html:142 |
| border-radius | `var(--rad-2)` | `` | .pb-card .dcard .pb-img2 · 2026-09-14-pins2-board/index.html:142 |
| background | `var(--dc-sunk)` | `` | .pb-card .dcard .pb-img2.pb-bad · 2026-09-14-pins2-board/index.html:143 |
| background-color | `` | `rgb(30, 31, 34)` | .pb-card .dcard .pb-img2.pb-bad · 2026-09-14-pins2-board/index.html:143 |
| background-image | `` | `none` | .pb-card .dcard .pb-img2.pb-bad · 2026-09-14-pins2-board/index.html:143 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `12.5px` | `12.5px` | inherited · .dcard · 2026-09-14-pins2-board/app.css:1097 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18.75px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--dc-dim)` | `rgb(148, 155, 164)` | .pb-card .dcard .pb-img2.pb-bad · 2026-09-14-pins2-board/index.html:143 |


### `svg.ic.xl`

inside `.pb-img2` · 1 on screen · **1 look**

#### the one look

`G8-122` · rendered **0×0** · 1 instance look like this

```html
<svg class="ic xl"><use href="#i-image"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| width | `2.2em` | `27.5px` | .ic.xl · 2026-09-14-pins2-board/app.css:6171 |
| height | `2.2em` | `27.5px` | .ic.xl · 2026-09-14-pins2-board/app.css:6171 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `12.5px` | `12.5px` | inherited · .dcard · 2026-09-14-pins2-board/app.css:1097 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18.75px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--dc-dim)` | `rgb(148, 155, 164)` | inherited · .pb-card .dcard .pb-img2.pb-bad · 2026-09-14-pins2-board/index.html:143 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |


## Reachable states

Each state is reached by the interaction named, then the stage is walked again; only signatures or looks not seen above are specced.


### G9 · DMZ

94 distinct signatures on screen; 21 not already specced above.


### `aside.drawer.wide[role=dialog]`

inside `.pb-stage` · 1 on screen · **1 look**

#### the one look

`G9arm-1` · rendered **880×1370** · 1 instance look like this · aria-label="New build" role="dialog"

```html
<aside class="drawer wide" role="dialog" aria-label="New build" data-nb="" data-arm="DMZ" data-many="0"> <header class="dw-h"> <div class="dw-ttl"><span class="dw-eye" data-eye="">loadout.add · DMZ · tier 1</span><h2 data-title="">New DMZ build</h2></div> <button class="x" aria-label="Close">⟨svg.ic⟩</button> </header> <div class="pb-bar"> <div class="seg pb-seg pb-mode" data-seg="arm" data-arm="DMZ"> <span class="pb
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| position | `relative` | `relative` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| flex-direction | `column` | `column` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| width | `880px` | `880px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| max-height | `none` | `none` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0 auto` | `` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-top | `0px` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-right | `auto` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-bottom | `0px` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-left | `auto` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| top | `auto` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| left | `auto` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| border | `1px solid var(--rule2)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| border-radius | `var(--rad-3)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| background | `var(--raised)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| background-color | `` | `rgb(31, 39, 46)` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| background-image | `` | `none` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| box-shadow | `rgba(0, 0, 0, 0.75) 0px 40px 80px -24px` | `rgba(0, 0, 0, 0.75) 0px 40px 80px -24px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| opacity | `1` | `1` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| overflow | `hidden` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| overflow-x | `hidden` | `hidden` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| overflow-y | `hidden` | `hidden` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| transform | `none` | `none` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| transition | `opacity .18s,transform .18s cubic-bezier(.2,.8,.3,1)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| z-index | `auto` | `auto` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| pointer-events | `auto` | `auto` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |


### `span.pb-thumb`

inside `.seg` · 5 on screen · **1 look**

#### the one look

`G9arm-9` · rendered **60×34** · 1 instance look like this

```html
<span class="pb-thumb" style="width: 60px; transform: translateX(57px);"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| width | `60px` | `60px` | style attribute |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| bottom | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| left | `0px` | `0px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| border-radius | `var(--rad-pill)` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| background | `var(--mode-dmz)` | `` | .pb-seg.pb-mode[data-arm="DMZ"] .pb-thumb · 2026-09-14-pins2-board/index.html:46 |
| background-color | `` | `rgb(61, 165, 245)` | .pb-seg.pb-mode[data-arm="DMZ"] .pb-thumb · 2026-09-14-pins2-board/index.html:46 |
| background-image | `` | `none` | .pb-seg.pb-mode[data-arm="DMZ"] .pb-thumb · 2026-09-14-pins2-board/index.html:46 |
| box-shadow | `none` | `none` | .pb-seg.pb-mode .pb-thumb · 2026-09-14-pins2-board/index.html:45 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| transform | `translateX(57px)` | `matrix(1, 0, 0, 1, 57, 0)` | style attribute |
| transition | `transform .26s cubic-bezier(.3,.7,.2,1),width .26s cubic-bezier(.3,.7,.2,1),background .2s` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |


### `div.pb-view`

inside `.drawer` · 1 on screen · **1 look**

#### the one look

`G9arm-15` · rendered **878×1228** · 1 instance look like this

```html
<div class="pb-view" data-view="0"> <div class="dw-b"><div class="bed bform"> <div class="bed-main"> <section class="bf-sec"> <h4 class="bf-h">Build</h4> <div class="bed-g2"> <div class="dwfield"><label for="nb-w">Weapon</label><div class="pb-combo"><input id="nb-w" value="BAL-27" role="combobox" aria-expanded="false" autocomplete="off">⟨svg.ic⟩</div></div> <div class="dwfield"><label>Category</label><select><option>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.dw-b`

inside `.pb-view` · 2 on screen · **1 look**

#### the one look

`G9arm-16` · rendered **878×1159** · 1 instance look like this

```html
<div class="dw-b"><div class="bed bform"> <div class="bed-main"> <section class="bf-sec"> <h4 class="bf-h">Build</h4> <div class="bed-g2"> <div class="dwfield"><label for="nb-w">Weapon</label><div class="pb-combo"><input id="nb-w" value="BAL-27" role="combobox" aria-expanded="false" autocomplete="off">⟨svg.ic⟩</div></div> <div class="dwfield"><label>Category</label><select><option>AR — Assault Rifle</option></select>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| flex | `1 1 auto` | `` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `var(--s4) var(--s5)` | `` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-top | `` | `16px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-right | `` | `24px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-bottom | `` | `16px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-left | `` | `24px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `auto` | `` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| overflow-x | `auto` | `auto` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| overflow-y | `auto` | `auto` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |


### `div.bed.bform`

inside `.dw-b` · 1 on screen · **1 look**

#### the one look

`G9arm-17` · rendered **830×1127** · 1 instance look like this

```html
<div class="bed bform"> <div class="bed-main"> <section class="bf-sec"> <h4 class="bf-h">Build</h4> <div class="bed-g2"> <div class="dwfield"><label for="nb-w">Weapon</label><div class="pb-combo"><input id="nb-w" value="BAL-27" role="combobox" aria-expanded="false" autocomplete="off">⟨svg.ic⟩</div></div> <div class="dwfield"><label>Category</label><select><option>AR — Assault Rifle</option></select></div> </div> <div
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .bed · 2026-09-14-pins2-board/app.css:3272 |
| grid-template-columns | `1fr 320px` | `492px 320px` | .pb-stage .dw-b .bed · 2026-09-14-pins2-board/index.html:145 |
| gap | `18px` | `` | .drawer.wide .bed · 2026-09-14-pins2-board/app.css:6788 |
| column-gap | `18px` | `18px` | .drawer.wide .bed · 2026-09-14-pins2-board/app.css:6788 |
| row-gap | `18px` | `18px` | .drawer.wide .bed · 2026-09-14-pins2-board/app.css:6788 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.bed-main`

inside `.bed` · 1 on screen · **1 look**

#### the one look

`G9arm-18` · rendered **492×1127** · 1 instance look like this

```html
<div class="bed-main"> <section class="bf-sec"> <h4 class="bf-h">Build</h4> <div class="bed-g2"> <div class="dwfield"><label for="nb-w">Weapon</label><div class="pb-combo"><input id="nb-w" value="BAL-27" role="combobox" aria-expanded="false" autocomplete="off">⟨svg.ic⟩</div></div> <div class="dwfield"><label>Category</label><select><option>AR — Assault Rifle</option></select></div> </div> <div class="dwfield" style="
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| min-width | `0px` | `0px` | .bed-main · 2026-09-14-pins2-board/app.css:6311 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `section.bf-sec`

inside `.bed-main` · 4 on screen · **1 look**

#### the one look

`G9arm-81` · rendered **492×496** · 1 instance look like this

```html
<section class="bf-sec" data-only="DMZ"> <h4 class="bf-h">Attachments <span class="bf-n">9 of 9</span></h4> <div class="pb-atts"> <div class="pb-att"><span class="pb-slot">Optic</span><input class="ati" value="Classic Red Dot Sight"><button class="pb-rmv" aria-label="Remove Classic Red Dot Sight">⟨svg.ic⟩</button></div> <div class="pb-att"><span class="pb-slot">Muzzle</span><input class="ati" value="Monolithic Suppre
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | article, aside, footer, header, hgroup, main, nav, search, section · user-agent:? |
| min-width | `0px` | `0px` | main .panel, main section · 2026-09-14-pins2-board/app.css:659 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-bottom | `0px` | `0px` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| margin-bottom | `26px` | `26px` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| border-bottom | `0` | `` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-codefield`

inside `.dwfield` · 1 on screen · **1 look**

#### the one look

`G9arm-36` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-codefield"><input id="nb-code" value="1C2C4A8A9B" spellcheck="false" autocomplete="off"><button class="pb-copy" aria-label="Copy code">⟨svg.ic⟩</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-codefield · 2026-09-14-pins2-board/index.html:77 |
| position | `relative` | `relative` | .pb-codefield · 2026-09-14-pins2-board/index.html:77 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-hfill`

inside `.bf-h` · 1 on screen · **1 look**

#### the one look

`G9arm-40` · rendered **0×0** · 1 instance look like this

```html
<span class="pb-hfill">⟨svg.ic⟩4 of 5 filled from the code</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `500 var(--t-sm)/1 var(--ui)` | `` | .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| font-size | `` | `12px` | .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| font-weight | `` | `500` | .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| font-style | `` | `normal` | .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| font-variant-numeric | `` | `normal` | .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| line-height | `` | `12px` | .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| letter-spacing | `0px` | `normal` | .pb-hfill · 2026-09-14-pins2-board/index.html:270 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-hfill · 2026-09-14-pins2-board/index.html:270 |


### `div.pb-atts`

inside `.bf-sec` · 2 on screen · **1 look**

#### the one look

`G9arm-84` · rendered **492×460** · 1 instance look like this

```html
<div class="pb-atts"> <div class="pb-att"><span class="pb-slot">Optic</span><input class="ati" value="Classic Red Dot Sight"><button class="pb-rmv" aria-label="Remove Classic Red Dot Sight">⟨svg.ic⟩</button></div> <div class="pb-att"><span class="pb-slot">Muzzle</span><input class="ati" value="Monolithic Suppressor"><button class="pb-rmv" aria-label="Remove Monolithic Suppressor">⟨svg.ic⟩</button></div> <div class="p
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-atts · 2026-09-14-pins2-board/index.html:160 |
| gap | `8px` | `` | .pb-atts · 2026-09-14-pins2-board/index.html:160 |
| column-gap | `8px` | `8px` | .pb-atts · 2026-09-14-pins2-board/index.html:160 |
| row-gap | `8px` | `8px` | .pb-atts · 2026-09-14-pins2-board/index.html:160 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `12px` | `12px` | .pb-atts · 2026-09-14-pins2-board/index.html:160 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-att.pb-auto`

inside `.pb-atts` · 4 on screen · **1 look**

#### the one look

`G9arm-43` · rendered **0×0** · 4 instances look like this

```html
<div class="pb-att pb-auto"><span class="pb-slot">Muzzle</span><input class="ati" value="Polarfire-S"><button class="pb-rmv" aria-label="Remove Polarfire-S">⟨svg.ic⟩</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| grid-template-columns | `96px 1fr 44px` | `96px 1fr 44px` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| gap | `8px` | `` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| column-gap | `8px` | `8px` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| row-gap | `8px` | `8px` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| align-items | `center` | `center` | .pb-att · 2026-09-14-pins2-board/index.html:161 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-ac`

inside `.pb-att` · 1 on screen · **1 look**

#### the one look

`G9arm-60` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-ac"><input class="ati" value="grip" role="combobox" aria-expanded="true" aria-controls="nb-menu" autocomplete="off"> <ul class="pb-menu" id="nb-menu" role="listbox"> <li role="option" aria-selected="true">⟨svg.ic⟩<span>Highground <mark>Grip</mark></span></li> <li role="option"><span></span><span>Tidal Tac <mark>Grip</mark></span></li> <li role="option"><span></span><span>Granulated <mark>Grip</mark> Ta
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .pb-ac · 2026-09-14-pins2-board/index.html:167 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| z-index | `4` | `4` | .pb-ac · 2026-09-14-pins2-board/index.html:167 |


### `input.ati[role=combobox]`

inside `.pb-ac` · 1 on screen · **1 look**

#### the one look

`G9arm-61` · rendered **0×0** · 1 instance look like this · aria-expanded="true" role="combobox"

```html
<input class="ati" value="grip" role="combobox" aria-expanded="true" aria-controls="nb-menu" autocomplete="off">
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `inline-block` | input, textarea, select, button · user-agent:? |
| flex | `1` | `` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| width | `100%` | `100%` | .pb-att .ati · 2026-09-14-pins2-board/index.html:164 |
| min-width | `0px` | `0px` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| min-height | `var(--tap)` | `44px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `8px 10px` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-top | `8px` | `8px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-right | `10px` | `10px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-bottom | `8px` | `8px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-left | `var(--ctl-pl,10px)` | `10px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]) · 2026-09-14-pins2-board/app.css:633 |
| border | `1px solid var(--rule2)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| border-radius | `var(--rad-2)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| outline | `2px solid var(--patch)` | `` | .pb-ac .ati · 2026-09-14-pins2-board/index.html:168 |
| outline-offset | `1px` | `1px` | .pb-ac .ati · 2026-09-14-pins2-board/index.html:168 |
| background | `var(--sunk)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| background-color | `` | `rgb(11, 15, 18)` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| background-image | `` | `none` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| font | `500 var(--t-base)/1 var(--ui)` | `` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| font-size | `` | `13px` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| font-weight | `500` | `500` | .bform input, .bform textarea, .bform select · 2026-09-14-pins2-board/app.css:5192 |
| font-style | `` | `normal` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| font-variant-numeric | `` | `normal` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| line-height | `` | `13px` | .ati · 2026-09-14-pins2-board/app.css:5200 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `start` | `start` | input, textarea, select, button · user-agent:? |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .bform input, .bform textarea, .bform select · 2026-09-14-pins2-board/app.css:5192 |
| overflow-x | `clip !important !important` | `clip` | input:not([type="range" i], [type="checkbox" i], [type="radio" i]) · user-agent:? |
| overflow-y | `clip !important !important` | `clip` | input:not([type="range" i], [type="checkbox" i], [type="radio" i]) · user-agent:? |
| cursor | `text` | `text` | input · user-agent:? |

**:hover** — changes nothing on the element itself

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself


### `ul.pb-menu[role=listbox]`

inside `.pb-ac` · 1 on screen · **1 look**

#### the one look

`G9arm-62` · rendered **0×0** · 1 instance look like this · role="listbox"

```html
<ul class="pb-menu" id="nb-menu" role="listbox"> <li role="option" aria-selected="true">⟨svg.ic⟩<span>Highground <mark>Grip</mark></span></li> <li role="option"><span></span><span>Tidal Tac <mark>Grip</mark></span></li> <li role="option"><span></span><span>Granulated <mark>Grip</mark> Tape</span></li> </ul>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | ul, menu, dir · user-agent:? |
| position | `absolute` | `absolute` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `6px` | `` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| padding-top | `6px` | `6px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| padding-right | `6px` | `6px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| padding-bottom | `6px` | `6px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| padding-left | `6px` | `6px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| margin | `0` | `` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| margin-top | `0px` | `0px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| margin-right | `0px` | `0px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| margin-bottom | `0px` | `0px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| margin-left | `0px` | `0px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| top | `calc(100% + 6px)` | `calc(100% + 6px)` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| right | `-52px` | `-52px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| left | `0px` | `0px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| border-radius | `var(--rad-2)` | `` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| background | `var(--raised)` | `` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| background-image | `` | `none` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| box-shadow | `inset 0 0 0 1px var(--rule2),0 24px 48px -12px rgba(0,0,0,.8)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.8) 0px 24px 48px -12px` | .pb-menu · 2026-09-14-pins2-board/index.html:169 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `li[role=option]`

inside `.pb-menu` · 3 on screen · **2 looks**

#### look 1 of 2

`G9arm-63` · rendered **0×0** · 1 instance look like this · aria-selected="true" role="option"

```html
<li role="option" aria-selected="true">⟨svg.ic⟩<span>Highground <mark>Grip</mark></span></li>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| grid-template-columns | `18px 1fr` | `18px 1fr` | .pb-menu li · 2026-09-14-pins2-board/index.html:273 |
| gap | `10px` | `` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| column-gap | `10px` | `10px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| row-gap | `10px` | `10px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| align-items | `center` | `center` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| min-height | `var(--tap)` | `44px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 12px 0 8px` | `` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| padding-top | `0px` | `0px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| padding-right | `12px` | `12px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| padding-bottom | `0px` | `0px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| padding-left | `8px` | `8px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| border-radius | `var(--rad-1)` | `` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| background | `var(--hi)` | `` | .pb-menu li[aria-selected="true"] · 2026-09-14-pins2-board/index.html:171 |
| background-color | `` | `rgb(35, 44, 52)` | .pb-menu li[aria-selected="true"] · 2026-09-14-pins2-board/index.html:171 |
| background-image | `` | `none` | .pb-menu li[aria-selected="true"] · 2026-09-14-pins2-board/index.html:171 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-base)` | `13px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |

**:hover** — changes nothing on the element itself

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself

#### look 2 of 2

`G9arm-67` · rendered **0×0** · 2 instances look like this · role="option"

```html
<li role="option"><span></span><span>Tidal Tac <mark>Grip</mark></span></li>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| grid-template-columns | `18px 1fr` | `18px 1fr` | .pb-menu li · 2026-09-14-pins2-board/index.html:273 |
| gap | `10px` | `` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| column-gap | `10px` | `10px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| row-gap | `10px` | `10px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| align-items | `center` | `center` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| min-height | `var(--tap)` | `44px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 12px 0 8px` | `` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| padding-top | `0px` | `0px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| padding-right | `12px` | `12px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| padding-bottom | `0px` | `0px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| padding-left | `8px` | `8px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| border-radius | `var(--rad-1)` | `` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-base)` | `13px` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-menu li · 2026-09-14-pins2-board/index.html:170 |

**:hover** — changes nothing on the element itself

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself


### `span`

inside `.—` · 31 on screen · **1 look**

#### the one look

`G9arm-65` · rendered **0×0** · 6 instances look like this

```html
<span>Highground <mark>Grip</mark></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · .pb-menu li · 2026-09-14-pins2-board/index.html:170 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · .pb-menu li · 2026-09-14-pins2-board/index.html:170 |


### `aside.bed-side`

inside `.bed` · 1 on screen · **1 look**

#### the one look

`G9arm-174` · rendered **320×371** · 1 instance look like this

```html
<aside class="bed-side"><div class="bed-sec"><h5>In Discord</h5> <div class="dcard lc" data-only="MP" style="--c:#FF3B5C"> <h6>BAL-27</h6><div class="lc-badges"><span>META</span><span>BEST</span></div><div class="lc-rule"></div> <div class="lc-h">Attachments</div> <ul class="lc-att"><li><code>Polarfire-S</code></li><li><code>Crown-H3 Barrel</code></li><li><code>Clarent Light Stock</code></li><li><code>60 Round Reload
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | article, aside, footer, header, hgroup, main, nav, search, section · user-agent:? |
| position | `sticky` | `sticky` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| align-self | `start` | `start` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| min-width | `0px` | `0px` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `14px` | `14px` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.bed-sec`

inside `.bed-side` · 1 on screen · **1 look**

#### the one look

`G9arm-175` · rendered **320×351** · 1 instance look like this

```html
<div class="bed-sec"><h5>In Discord</h5> <div class="dcard lc" data-only="MP" style="--c:#FF3B5C"> <h6>BAL-27</h6><div class="lc-badges"><span>META</span><span>BEST</span></div><div class="lc-rule"></div> <div class="lc-h">Attachments</div> <ul class="lc-att"><li><code>Polarfire-S</code></li><li><code>Crown-H3 Barrel</code></li><li><code>Clarent Light Stock</code></li><li><code>60 Round Reload</code></li></ul> <div c
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `20px` | `20px` | .bed-sec · 2026-09-14-pins2-board/app.css:3282 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `ul.lc-att`

inside `.dcard` · 2 on screen · **1 look**

#### the one look

`G9arm-194` · rendered **290×202** · 1 instance look like this

```html
<ul class="lc-att"><li><code>Classic Red Dot Sight</code></li><li><code>Monolithic Suppressor</code></li><li><code>OWC Marksman</code></li><li><code>No Stock</code></li><li><code>OWC Laser - Tactical</code></li><li><code>Operator Foregrip</code></li><li><code>Granulated Grip Tape</code></li><li><code>48 Round Extended Mag</code></li><li><code>Long Shot</code></li></ul>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| gap | `3px` | `` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| column-gap | `3px` | `3px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| row-gap | `3px` | `3px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| flex-direction | `column` | `column` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0` | `` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| padding-top | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| padding-right | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| padding-bottom | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| padding-left | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| margin | `0` | `` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| margin-top | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| margin-right | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| margin-bottom | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| margin-left | `0px` | `0px` | .lc-att · 2026-09-14-pins2-board/app.css:3250 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `12.5px` | `12.5px` | inherited · .dcard · 2026-09-14-pins2-board/app.css:1097 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18.75px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--dc-body)` | `rgb(219, 222, 225)` | inherited · .dcard · 2026-09-14-pins2-board/app.css:1296 |


### `div.lc-code`

inside `.dcard` · 1 on screen · **1 look**

#### the one look

`G9arm-187` · rendered **0×0** · 1 instance look like this · text “1C2C4A8A9C”

```html
<div class="lc-code">1C2C4A8A9C</div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `7px 9px` | `` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| padding-top | `7px` | `7px` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| padding-right | `9px` | `9px` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| padding-bottom | `7px` | `7px` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| padding-left | `9px` | `9px` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| border-radius | `var(--rad-2)` | `` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| background | `var(--dc-sunk)` | `` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| background-color | `` | `rgb(30, 31, 34)` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| background-image | `` | `none` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| font-family | `var(--data)` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| font-size | `var(--t-sm)` | `12px` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | `0.06em` | `0.72px` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |
| color | `var(--dc-body)` | `rgb(219, 222, 225)` | .lc-code · 2026-09-14-pins2-board/app.css:3258 |


### `div.dcard.lc`

inside `.bed-sec` · 1 on screen · **1 look**

#### the one look

`G9arm-189` · rendered **320×330** · 1 instance look like this

```html
<div class="dcard lc" data-only="DMZ" style="--c:var(--mode-dmz)"> <h6>AK117</h6><div class="lc-badges"><span>META</span></div><div class="lc-rule"></div> <div class="lc-h">Attachments</div> <ul class="lc-att"><li><code>Classic Red Dot Sight</code></li><li><code>Monolithic Suppressor</code></li><li><code>OWC Marksman</code></li><li><code>No Stock</code></li><li><code>OWC Laser - Tactical</code></li><li><code>Operator
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| width | `100%` | `320px` | .drawer.wide .bed-side .dcard.lc · 2026-09-14-pins2-board/app.css:6789 |
| max-width | `none` | `none` | .dcard.lc · 2026-09-14-pins2-board/app.css:3242 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `11px 13px` | `` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-top | `11px` | `11px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-right | `13px` | `13px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-bottom | `11px` | `11px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-left | `13px` | `13px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| margin-top | `12px` | `12px` | .dcard + .dcard · 2026-09-14-pins2-board/app.css:4685 |
| border-left | `4px solid var(--c)` | `` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| border-radius | `8px/* foreign-radius: Discord's own corner, like --dc-*. The preview must look like Discord, not like the portal. */` | `` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| background | `var(--dc-bg)` | `` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| background-color | `` | `rgb(43, 45, 49)` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| background-image | `` | `none` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `12.5px` | `12.5px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18.75px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--dc-body)` | `rgb(219, 222, 225)` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| transition | `transform var(--dur-2) var(--ease), background var(--dur-2) var(--ease),box-shadow var(--dur-2) var(--ease),border-color var(--dur-2) var(--ease)` | `` | .wcard, .ccard, .tile, .hlive .lp, .dcard · 2026-09-14-pins2-board/app.css:5712 |


### G9 · Bulk create

94 distinct signatures on screen; 49 not already specced above.


### `aside.drawer.wide[role=dialog]`

inside `.pb-stage` · 1 on screen · **1 look**

#### the one look

`G9many-1` · rendered **880×1052** · 1 instance look like this · aria-label="New build" role="dialog"

```html
<aside class="drawer wide" role="dialog" aria-label="New build" data-nb="" data-arm="DMZ" data-many="1"> <header class="dw-h"> <div class="dw-ttl"><span class="dw-eye" data-eye="">loadout.bulkAdd · DMZ · tier 1</span><h2 data-title="">New DMZ builds</h2></div> <button class="x" aria-label="Close">⟨svg.ic⟩</button> </header> <div class="pb-bar"> <div class="seg pb-seg pb-mode" data-seg="arm" data-arm="DMZ"> <span clas
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| position | `relative` | `relative` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| flex-direction | `column` | `column` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| width | `880px` | `880px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| max-height | `none` | `none` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0 auto` | `` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-top | `0px` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-right | `auto` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-bottom | `0px` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-left | `auto` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| top | `auto` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| left | `auto` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| border | `1px solid var(--rule2)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| border-radius | `var(--rad-3)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| background | `var(--raised)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| background-color | `` | `rgb(31, 39, 46)` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| background-image | `` | `none` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| box-shadow | `rgba(0, 0, 0, 0.75) 0px 40px 80px -24px` | `rgba(0, 0, 0, 0.75) 0px 40px 80px -24px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| opacity | `1` | `1` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| overflow | `hidden` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| overflow-x | `hidden` | `hidden` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| overflow-y | `hidden` | `hidden` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| transform | `none` | `none` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| transition | `opacity .18s,transform .18s cubic-bezier(.2,.8,.3,1)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| z-index | `auto` | `auto` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| pointer-events | `auto` | `auto` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |


### `span.pb-thumb`

inside `.seg` · 5 on screen · **1 look**

#### the one look

`G9many-150` · rendered **0×0** · 1 instance look like this

```html
<span class="pb-thumb" style="width: 103px; transform: translateX(3px);"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| width | `103px` | `103px` | style attribute |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| bottom | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| left | `0px` | `0px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| border-radius | `var(--rad-pill)` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| background | `var(--hi)` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| background-color | `` | `rgb(35, 44, 52)` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| background-image | `` | `none` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| transform | `translateX(3px)` | `none` | style attribute |
| transition | `transform .26s cubic-bezier(.3,.7,.2,1),width .26s cubic-bezier(.3,.7,.2,1),background .2s` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board/index.html:41 |


### `div.pb-seg.seg`

inside `.pb-bar` · 3 on screen · **1 look**

#### the one look

`G9many-144` · rendered **0×0** · 1 instance look like this

```html
<div class="seg pb-seg" data-seg="rank" data-tier="best"><span class="pb-thumb" style="width: 88px; transform: translateX(63px);"></span><button aria-pressed="false" data-t="none">None</button><button aria-pressed="true" data-t="best">Best close</button><button aria-pressed="false" data-t="best">Best mid–long</button><button aria-pressed="false" data-t="top3">Top 3</button><button aria-pressed="false" data-t="top5">T
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-seg.seg · 2026-09-14-pins2-board/index.html:38 |
| position | `relative` | `relative` | .pb-seg.seg · 2026-09-14-pins2-board/index.html:38 |
| gap | `2px` | `` | .seg · 2026-09-14-pins2-board/app.css:710 |
| column-gap | `2px` | `2px` | .seg · 2026-09-14-pins2-board/app.css:710 |
| row-gap | `2px` | `2px` | .seg · 2026-09-14-pins2-board/app.css:710 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `3px` | `` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-top | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-right | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-bottom | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-left | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| border | `1px solid var(--rule)` | `` | .seg · 2026-09-14-pins2-board/app.css:710 |
| border-radius | `var(--rad-pill)` | `` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| background | `var(--sunk)` | `` | .seg · 2026-09-14-pins2-board/app.css:710 |
| background-color | `` | `rgb(11, 15, 18)` | .seg · 2026-09-14-pins2-board/app.css:710 |
| background-image | `` | `none` | .seg · 2026-09-14-pins2-board/app.css:710 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.dw-b`

inside `.pb-view` · 2 on screen · **1 look**

#### the one look

`G9many-209` · rendered **878×841** · 1 instance look like this

```html
<div class="dw-b"><div class="pb-bulk"> <div> <div class="pb-edhead"><label for="pm">Builds</label><span>4 builds · 32 lines</span></div> <div class="pb-ed" id="pm" role="textbox" aria-multiline="true" aria-label="Builds" contenteditable="true" spellcheck="false"> <div class="pb-blk" data-o="upd"><span></span><div><span class="pb-l pb-hd">BAL-27 <i>|</i> AR</span><span class="pb-l"><em>Build:</em> Build 2</span><span
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| flex | `1 1 auto` | `` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `var(--s4) var(--s5)` | `` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-top | `` | `16px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-right | `` | `24px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-bottom | `` | `16px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-left | `` | `24px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `auto` | `` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| overflow-x | `auto` | `auto` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| overflow-y | `auto` | `auto` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |


### `div.bed.bform`

inside `.dw-b` · 1 on screen · **1 look**

#### the one look

`G9many-16` · rendered **0×0** · 1 instance look like this

```html
<div class="bed bform"> <div class="bed-main"> <section class="bf-sec"> <h4 class="bf-h">Build</h4> <div class="bed-g2"> <div class="dwfield"><label for="nb-w">Weapon</label><div class="pb-combo"><input id="nb-w" value="BAL-27" role="combobox" aria-expanded="false" autocomplete="off">⟨svg.ic⟩</div></div> <div class="dwfield"><label>Category</label><select><option>AR — Assault Rifle</option></select></div> </div> <div
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .bed · 2026-09-14-pins2-board/app.css:3272 |
| grid-template-columns | `1fr 320px` | `1fr 320px` | .pb-stage .dw-b .bed · 2026-09-14-pins2-board/index.html:145 |
| gap | `18px` | `` | .drawer.wide .bed · 2026-09-14-pins2-board/app.css:6788 |
| column-gap | `18px` | `18px` | .drawer.wide .bed · 2026-09-14-pins2-board/app.css:6788 |
| row-gap | `18px` | `18px` | .drawer.wide .bed · 2026-09-14-pins2-board/app.css:6788 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.bed-main`

inside `.bed` · 1 on screen · **1 look**

#### the one look

`G9many-17` · rendered **0×0** · 1 instance look like this

```html
<div class="bed-main"> <section class="bf-sec"> <h4 class="bf-h">Build</h4> <div class="bed-g2"> <div class="dwfield"><label for="nb-w">Weapon</label><div class="pb-combo"><input id="nb-w" value="BAL-27" role="combobox" aria-expanded="false" autocomplete="off">⟨svg.ic⟩</div></div> <div class="dwfield"><label>Category</label><select><option>AR — Assault Rifle</option></select></div> </div> <div class="dwfield" style="
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| min-width | `0px` | `0px` | .bed-main · 2026-09-14-pins2-board/app.css:6311 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `section.bf-sec`

inside `.bed-main` · 4 on screen · **1 look**

#### the one look

`G9many-18` · rendered **0×0** · 4 instances look like this

```html
<section class="bf-sec"> <h4 class="bf-h">Build</h4> <div class="bed-g2"> <div class="dwfield"><label for="nb-w">Weapon</label><div class="pb-combo"><input id="nb-w" value="BAL-27" role="combobox" aria-expanded="false" autocomplete="off">⟨svg.ic⟩</div></div> <div class="dwfield"><label>Category</label><select><option>AR — Assault Rifle</option></select></div> </div> <div class="dwfield" style="margin-top:16px"><label
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | article, aside, footer, header, hgroup, main, nav, search, section · user-agent:? |
| min-width | `0px` | `0px` | main .panel, main section · 2026-09-14-pins2-board/app.css:659 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-bottom | `0px` | `0px` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| margin-bottom | `26px` | `26px` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| border-bottom | `0` | `` | .pb-stage .bf-sec · 2026-09-14-pins2-board/index.html:262 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.bed-g2`

inside `.bf-sec` · 1 on screen · **1 look**

#### the one look

`G9many-20` · rendered **0×0** · 1 instance look like this

```html
<div class="bed-g2"> <div class="dwfield"><label for="nb-w">Weapon</label><div class="pb-combo"><input id="nb-w" value="BAL-27" role="combobox" aria-expanded="false" autocomplete="off">⟨svg.ic⟩</div></div> <div class="dwfield"><label>Category</label><select><option>AR — Assault Rifle</option></select></div> </div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .bed-g2 · 2026-09-14-pins2-board/app.css:3287 |
| grid-template-columns | `1fr 1fr` | `1fr 1fr` | .bed-g2 · 2026-09-14-pins2-board/app.css:3287 |
| gap | `12px` | `` | .bed-g2 · 2026-09-14-pins2-board/app.css:3287 |
| column-gap | `12px` | `12px` | .bed-g2 · 2026-09-14-pins2-board/app.css:3287 |
| row-gap | `12px` | `12px` | .bed-g2 · 2026-09-14-pins2-board/app.css:3287 |
| align-items | `end` | `end` | .pb-stage .bed-g2 · 2026-09-14-pins2-board/index.html:35 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `label`

inside `.dwfield` · 8 on screen · **1 look**

#### the one look

`G9many-213` · rendered **36×12** · 1 instance look like this · text “Builds”

```html
<label for="pm">Builds</label>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | label · 2026-09-14-pins2-board/app.css:648 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `5px` | `5px` | label · 2026-09-14-pins2-board/app.css:648 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .pb-edhead label · 2026-09-14-pins2-board/index.html:186 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-edhead label · 2026-09-14-pins2-board/index.html:186 |
| font-size | `` | `12px` | .pb-edhead label · 2026-09-14-pins2-board/index.html:186 |
| font-weight | `` | `600` | .pb-edhead label · 2026-09-14-pins2-board/index.html:186 |
| font-style | `` | `normal` | .pb-edhead label · 2026-09-14-pins2-board/index.html:186 |
| font-variant-numeric | `` | `normal` | .pb-edhead label · 2026-09-14-pins2-board/index.html:186 |
| line-height | `` | `12px` | .pb-edhead label · 2026-09-14-pins2-board/index.html:186 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-edhead label · 2026-09-14-pins2-board/index.html:186 |
| cursor | `default` | `default` | label · user-agent:? |

**:hover** — changes nothing on the element itself

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself


### `div.pb-combo`

inside `.dwfield` · 1 on screen · **1 look**

#### the one look

`G9many-23` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-combo"><input id="nb-w" value="BAL-27" role="combobox" aria-expanded="false" autocomplete="off">⟨svg.ic⟩</div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-combo · 2026-09-14-pins2-board/index.html:153 |
| position | `relative` | `relative` | .pb-combo · 2026-09-14-pins2-board/index.html:153 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-labelf`

inside `.dwfield` · 1 on screen · **1 look**

#### the one look

`G9many-29` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-labelf"><span class="pb-bno"><small>BUILD</small><b class="pb-num">2</b></span><input id="nb-label" placeholder="Build 2"></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| grid-template-columns | `auto 1fr` | `auto 1fr` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| align-items | `stretch` | `stretch` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| min-height | `var(--tap)` | `44px` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-2)` | `` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| background | `var(--sunk)` | `` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| background-image | `` | `none` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| overflow-x | `hidden` | `hidden` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |
| overflow-y | `hidden` | `hidden` | .pb-labelf · 2026-09-14-pins2-board/index.html:264 |


### `span.pb-bno`

inside `.pb-labelf` · 1 on screen · **1 look**

#### the one look

`G9many-30` · rendered **0×0** · 1 instance look like this

```html
<span class="pb-bno"><small>BUILD</small><b class="pb-num">2</b></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| gap | `10px` | `` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| column-gap | `10px` | `10px` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| row-gap | `10px` | `10px` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| align-items | `center` | `center` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px 0 14px` | `` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| padding-top | `0px` | `0px` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| padding-right | `16px` | `16px` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| padding-bottom | `0px` | `0px` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| padding-left | `14px` | `14px` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| background | `color-mix(in srgb,var(--realm-c) 12%,var(--raised))` | `` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| background-color | `` | `color(srgb 0.219451 0.166588 0.190745)` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| background-image | `` | `none` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| box-shadow | `inset -1px 0 0 var(--rule2)` | `rgb(58, 71, 82) -1px 0px 0px 0px inset` | .pb-bno · 2026-09-14-pins2-board/index.html:266 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `small`

inside `.pb-bno` · 1 on screen · **1 look**

#### the one look

`G9many-31` · rendered **0×0** · 1 instance look like this · text “BUILD”

```html
<small>BUILD</small>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-micro)/1 var(--data)` | `` | .pb-bno small · 2026-09-14-pins2-board/index.html:267 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-bno small · 2026-09-14-pins2-board/index.html:267 |
| font-size | `` | `9.5px` | .pb-bno small · 2026-09-14-pins2-board/index.html:267 |
| font-weight | `` | `600` | .pb-bno small · 2026-09-14-pins2-board/index.html:267 |
| font-style | `` | `normal` | .pb-bno small · 2026-09-14-pins2-board/index.html:267 |
| font-variant-numeric | `` | `normal` | .pb-bno small · 2026-09-14-pins2-board/index.html:267 |
| line-height | `` | `9.5px` | .pb-bno small · 2026-09-14-pins2-board/index.html:267 |
| letter-spacing | `0.12em` | `1.14px` | .pb-bno small · 2026-09-14-pins2-board/index.html:267 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-bno small · 2026-09-14-pins2-board/index.html:267 |


### `b.pb-num`

inside `.pb-bno` · 1 on screen · **1 look**

#### the one look

`G9many-32` · rendered **0×0** · 1 instance look like this · text “2”

```html
<b class="pb-num">2</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline` | `block` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| align-items | `center` | `center` | .pb-num · 2026-09-14-pins2-board/index.html:157 |
| justify-content | `center` | `center` | .pb-num · 2026-09-14-pins2-board/index.html:157 |
| height | `auto` | `auto` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `0` | `` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| background | `none` | `` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| background-image | `none` | `none` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| box-shadow | `none` | `none` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| font | `700 26px/1 var(--display)` | `` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| font-family | `` | `"Big Shoulders Display", "Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| font-size | `` | `26px` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| font-weight | `` | `700` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| font-style | `` | `normal` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| font-variant-numeric | `` | `normal` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| line-height | `` | `26px` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |
| letter-spacing | `0.02em` | `0.52px` | .pb-bno b · 2026-09-14-pins2-board/index.html:268 |
| color | `var(--realm-c)` | `rgb(239, 68, 68)` | .pb-bno .pb-num · 2026-09-14-pins2-board/index.html:304 |

**::before**

| property | winning declaration | from |
|---|---|---|
| margin-right | `3px` | .pb-num::before · 2026-09-14-pins2-board/index.html:158 |
| font-weight | `600` | .pb-num::before · 2026-09-14-pins2-board/index.html:158 |
| color | `var(--ink4)` | .pb-num::before · 2026-09-14-pins2-board/index.html:158 |
| content | `none` | .pb-bno .pb-num::before · 2026-09-14-pins2-board/index.html:305 |


### `span`

inside `.—` · 31 on screen · **6 looks**

#### look 1 of 6

`G9many-217` · rendered **14×220** · 1 instance look like this

```html
<span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `` | `500` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |

#### look 2 of 6

`G9many-235` · rendered **14×198** · 1 instance look like this

```html
<span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `` | `500` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |

#### look 3 of 6

`G9many-251` · rendered **14×176** · 1 instance look like this

```html
<span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `` | `500` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |

#### look 4 of 6

`G9many-265` · rendered **14×88** · 1 instance look like this

```html
<span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `` | `500` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |

#### look 5 of 6

`G9many-276` · rendered **77×22** · 2 instances look like this · text “new”

```html
<span>new</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | .pb-tally span · 2026-09-14-pins2-board/index.html:209 |
| font-weight | — | `400` | initial |
| line-height | ⚠️ `1.2` | `14.4px` | .pb-tally span · 2026-09-14-pins2-board/index.html:209 · **a later rule wins — port the computed value and find that rule** |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-tally span · 2026-09-14-pins2-board/index.html:209 |

#### look 6 of 6

`G9many-282` · rendered **77×29** · 2 instances look like this · text “saved with a warning”

```html
<span>saved with a warning</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | .pb-tally span · 2026-09-14-pins2-board/index.html:209 |
| font-weight | — | `400` | initial |
| line-height | ⚠️ `1.2` | `14.4px` | .pb-tally span · 2026-09-14-pins2-board/index.html:209 · **a later rule wins — port the computed value and find that rule** |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-tally span · 2026-09-14-pins2-board/index.html:209 |


### `div.pb-badges`

inside `.bf-sec` · 1 on screen · **1 look**

#### the one look

`G9many-132` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-badges"> <button class="pb-tog" aria-pressed="true"><i>⟨svg.ic⟩</i>META</button> <button class="pb-tog pb-tox" aria-pressed="false"><i>⟨svg.ic⟩</i>TOXIC</button> </div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-badges · 2026-09-14-pins2-board/index.html:59 |
| gap | `8px` | `` | .pb-badges · 2026-09-14-pins2-board/index.html:59 |
| column-gap | `8px` | `8px` | .pb-badges · 2026-09-14-pins2-board/index.html:59 |
| row-gap | `8px` | `8px` | .pb-badges · 2026-09-14-pins2-board/index.html:59 |
| align-items | `center` | `center` | .pb-badges · 2026-09-14-pins2-board/index.html:59 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `12px` | `12px` | .pb-badges · 2026-09-14-pins2-board/index.html:59 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-rank`

inside `.bf-sec` · 1 on screen · **1 look**

#### the one look

`G9many-142` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-rank" data-rank="DMZ"><span>Range tier</span> <div class="seg pb-seg" data-seg="rank" data-tier="best"><span class="pb-thumb" style="width: 88px; transform: translateX(63px);"></span><button aria-pressed="false" data-t="none">None</button><button aria-pressed="true" data-t="best">Best close</button><button aria-pressed="false" data-t="best">Best mid–long</button><button aria-pressed="false" data-t="top
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-rank · 2026-09-14-pins2-board/index.html:180 |
| gap | `14px` | `` | .pb-rank · 2026-09-14-pins2-board/index.html:180 |
| column-gap | `14px` | `14px` | .pb-rank · 2026-09-14-pins2-board/index.html:180 |
| row-gap | `14px` | `14px` | .pb-rank · 2026-09-14-pins2-board/index.html:180 |
| align-items | `center` | `center` | .pb-rank · 2026-09-14-pins2-board/index.html:180 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `12px` | `12px` | .pb-rank · 2026-09-14-pins2-board/index.html:180 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-imghead`

inside `.bf-sec` · 1 on screen · **1 look**

#### the one look

`G9many-147` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-imghead"><h4 class="bf-h">Image</h4> <div class="seg pb-seg pb-small" data-seg="img" data-imgseg=""><span class="pb-thumb" style="width: 103px; transform: translateX(3px);"></span><button aria-pressed="true" data-v="up">Upload or link</button><button aria-pressed="false" data-v="key">Existing key</button></div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-imghead · 2026-09-14-pins2-board/index.html:82 |
| align-items | `center` | `center` | .pb-imghead · 2026-09-14-pins2-board/index.html:82 |
| justify-content | `space-between` | `space-between` | .pb-imghead · 2026-09-14-pins2-board/index.html:82 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `12px` | `12px` | .pb-imghead · 2026-09-14-pins2-board/index.html:82 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-seg.pb-small.seg`

inside `.pb-imghead` · 1 on screen · **1 look**

#### the one look

`G9many-149` · rendered **0×0** · 1 instance look like this

```html
<div class="seg pb-seg pb-small" data-seg="img" data-imgseg=""><span class="pb-thumb" style="width: 103px; transform: translateX(3px);"></span><button aria-pressed="true" data-v="up">Upload or link</button><button aria-pressed="false" data-v="key">Existing key</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-seg.seg · 2026-09-14-pins2-board/index.html:38 |
| position | `relative` | `relative` | .pb-seg.seg · 2026-09-14-pins2-board/index.html:38 |
| gap | `2px` | `` | .seg · 2026-09-14-pins2-board/app.css:710 |
| column-gap | `2px` | `2px` | .seg · 2026-09-14-pins2-board/app.css:710 |
| row-gap | `2px` | `2px` | .seg · 2026-09-14-pins2-board/app.css:710 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `3px` | `` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-top | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-right | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-bottom | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| padding-left | `3px` | `3px` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| border | `1px solid var(--rule)` | `` | .seg · 2026-09-14-pins2-board/app.css:710 |
| border-radius | `var(--rad-pill)` | `` | .seg · 2026-09-14-pins2-board/app.css:4484 |
| background | `var(--sunk)` | `` | .seg · 2026-09-14-pins2-board/app.css:710 |
| background-color | `` | `rgb(11, 15, 18)` | .seg · 2026-09-14-pins2-board/app.css:710 |
| background-image | `` | `none` | .seg · 2026-09-14-pins2-board/app.css:710 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-imgview`

inside `.bf-sec` · 1 on screen · **1 look**

#### the one look

`G9many-151` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-imgview" data-imgview="up"> <div class="pb-drop"> <div class="pb-shot" role="img" aria-label="Dropped screenshot"><span class="pb-shot-ui"></span></div> <div class="pb-dropcol"> <div class="dwfield"><label for="nb-src">Screenshot or link</label><div class="pb-file">⟨svg.ic⟩<span>IMG_5630.png</span><em>1.2 MB</em><button class="chip">Replace</button></div></div> <div class="dwfield"><label for="nb-key">
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-file`

inside `.dwfield` · 1 on screen · **1 look**

#### the one look

`G9many-158` · rendered **0×0** · 1 instance look like this

```html
<div class="pb-file">⟨svg.ic⟩<span>IMG_5630.png</span><em>1.2 MB</em><button class="chip">Replace</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| gap | `10px` | `` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| column-gap | `10px` | `10px` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| row-gap | `10px` | `10px` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| align-items | `center` | `center` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| min-height | `var(--tap)` | `44px` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 6px 0 12px` | `` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| padding-top | `0px` | `0px` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| padding-right | `6px` | `6px` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| padding-bottom | `0px` | `0px` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| padding-left | `12px` | `12px` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| border-radius | `var(--rad-2)` | `` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| background | `var(--sunk)` | `` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| background-image | `` | `none` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| box-shadow | `inset 0 0 0 1px var(--rule)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset` | .pb-file · 2026-09-14-pins2-board/index.html:91 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `em`

inside `.pb-file` · 11 on screen · **1 look**

#### the one look

`G9many-161` · rendered **0×0** · 1 instance look like this · text “1.2 MB”

```html
<em>1.2 MB</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `500 var(--t-sm)/1 var(--data)` | `` | .pb-file em · 2026-09-14-pins2-board/index.html:93 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-file em · 2026-09-14-pins2-board/index.html:93 |
| font-size | `` | `12px` | .pb-file em · 2026-09-14-pins2-board/index.html:93 |
| font-weight | `` | `500` | .pb-file em · 2026-09-14-pins2-board/index.html:93 |
| font-style | `` | `normal` | .pb-file em · 2026-09-14-pins2-board/index.html:93 |
| font-variant-numeric | `` | `normal` | .pb-file em · 2026-09-14-pins2-board/index.html:93 |
| line-height | `` | `12px` | .pb-file em · 2026-09-14-pins2-board/index.html:93 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-file em · 2026-09-14-pins2-board/index.html:93 |


### `button.chip`

inside `.pb-file` · 1 on screen · **1 look**

#### the one look

`G9many-162` · rendered **0×0** · 1 instance look like this · text “Replace”

```html
<button class="chip">Replace</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .chip · 2026-09-14-pins2-board/app.css:938 |
| align-items | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| justify-content | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| min-height | `32px` | `32px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `6px 11px` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-top | `6px` | `6px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-right | `11px` | `11px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-bottom | `6px` | `6px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| padding-left | `11px` | `11px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| margin-left | `auto` | `auto` | .pb-file .chip · 2026-09-14-pins2-board/index.html:94 |
| border | `1px solid var(--rule2)` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| border-radius | `var(--rad-pill)` | `` | .chip, .seg button, .tbdsw button · 2026-09-14-pins2-board/app.css:4478 |
| background | `var(--sunk)` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| background-color | `` | `rgb(11, 15, 18)` | .chip · 2026-09-14-pins2-board/app.css:938 |
| background-image | `` | `none` | .chip · 2026-09-14-pins2-board/app.css:938 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `var(--t-sm)` | `12px` | .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | `600` | `600` | .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `18px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| text-decoration | `none` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .chip · 2026-09-14-pins2-board/app.css:938 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | button · 2026-09-14-pins2-board/app.css:600 |

**:hover** — changes; parts inside it respond (table below)

| property | at rest | hover |
|---|---|---|
| background-color | `rgb(11, 15, 18)` | `rgb(42, 52, 61)` |
| color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |

| part inside | property | at rest | hover |
|---|---|---|---|
| ::before | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::before | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::before | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::after | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::after | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::after | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself


### `aside.bed-side`

inside `.bed` · 1 on screen · **1 look**

#### the one look

`G9many-173` · rendered **0×0** · 1 instance look like this

```html
<aside class="bed-side"><div class="bed-sec"><h5>In Discord</h5> <div class="dcard lc" data-only="MP" style="--c:#FF3B5C"> <h6>BAL-27</h6><div class="lc-badges"><span>META</span><span>BEST</span></div><div class="lc-rule"></div> <div class="lc-h">Attachments</div> <ul class="lc-att"><li><code>Polarfire-S</code></li><li><code>Crown-H3 Barrel</code></li><li><code>Clarent Light Stock</code></li><li><code>60 Round Reload
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | article, aside, footer, header, hgroup, main, nav, search, section · user-agent:? |
| position | `sticky` | `sticky` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| align-self | `start` | `start` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| min-width | `0px` | `0px` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `14px` | `14px` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.dcard.lc`

inside `.bed-sec` · 1 on screen · **1 look**

#### the one look

`G9many-188` · rendered **0×0** · 1 instance look like this

```html
<div class="dcard lc" data-only="DMZ" style="--c:var(--mode-dmz)"> <h6>AK117</h6><div class="lc-badges"><span>META</span></div><div class="lc-rule"></div> <div class="lc-h">Attachments</div> <ul class="lc-att"><li><code>Classic Red Dot Sight</code></li><li><code>Monolithic Suppressor</code></li><li><code>OWC Marksman</code></li><li><code>No Stock</code></li><li><code>OWC Laser - Tactical</code></li><li><code>Operator
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| width | `100%` | `100%` | .drawer.wide .bed-side .dcard.lc · 2026-09-14-pins2-board/app.css:6789 |
| max-width | `none` | `none` | .dcard.lc · 2026-09-14-pins2-board/app.css:3242 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `11px 13px` | `` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-top | `11px` | `11px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-right | `13px` | `13px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-bottom | `11px` | `11px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-left | `13px` | `13px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| margin-top | `12px` | `12px` | .dcard + .dcard · 2026-09-14-pins2-board/app.css:4685 |
| border-left | `4px solid var(--c)` | `` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| border-radius | `8px/* foreign-radius: Discord's own corner, like --dc-*. The preview must look like Discord, not like the portal. */` | `` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| background | `var(--dc-bg)` | `` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| background-color | `` | `rgb(43, 45, 49)` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| background-image | `` | `none` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `12.5px` | `12.5px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18.75px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--dc-body)` | `rgb(219, 222, 225)` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| transition | `transform var(--dur-2) var(--ease), background var(--dur-2) var(--ease),box-shadow var(--dur-2) var(--ease),border-color var(--dur-2) var(--ease)` | `` | .wcard, .ccard, .tile, .hlive .lp, .dcard · 2026-09-14-pins2-board/app.css:5712 |


### `button.btn`

inside `.dw-f` · 1 on screen · **1 look**

#### the one look

`G9many-206` · rendered **0×0** · 1 instance look like this · text “Stage and add another”

```html
<button class="btn">Stage and add another</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | input, textarea, select, button · user-agent:? |
| flex | `0 0 auto` | `` | .dw-f .btn · 2026-09-14-pins2-board/app.css:1090 |
| min-width | `132px` | `132px` | .dw-f .btn · 2026-09-14-pins2-board/app.css:1090 |
| min-height | `var(--tap)` | `44px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `9px` | `` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-top | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-right | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-bottom | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| padding-left | `9px` | `9px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| border | `1px solid var(--rule2)` | `` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| border-radius | `var(--rad-2)` | `` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| background | `var(--raised)` | `` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| background-color | `` | `rgb(31, 39, 46)` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| background-image | `` | `none` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `var(--t-base)` | `13px` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| font-weight | `700` | `700` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `19.5px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .btn · 2026-09-14-pins2-board/app.css:1040 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | button · 2026-09-14-pins2-board/app.css:600 |

**:hover** — changes; parts inside it respond (table below)

| property | at rest | hover |
|---|---|---|
| background-color | `rgb(31, 39, 46)` | `rgb(42, 52, 61)` |
| color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |

| part inside | property | at rest | hover |
|---|---|---|---|
| ::before | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::before | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::before | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::after | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::after | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::after | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself


### `div.pb-view`

inside `.drawer` · 1 on screen · **1 look**

#### the one look

`G9many-208` · rendered **878×910** · 1 instance look like this

```html
<div class="pb-view" data-view="1"> <div class="dw-b"><div class="pb-bulk"> <div> <div class="pb-edhead"><label for="pm">Builds</label><span>4 builds · 32 lines</span></div> <div class="pb-ed" id="pm" role="textbox" aria-multiline="true" aria-label="Builds" contenteditable="true" spellcheck="false"> <div class="pb-blk" data-o="upd"><span></span><div><span class="pb-l pb-hd">BAL-27 <i>|</i> AR</span><span class="pb-l"
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-bulk`

inside `.dw-b` · 1 on screen · **1 look**

#### the one look

`G9many-210` · rendered **830×809** · 1 instance look like this

```html
<div class="pb-bulk"> <div> <div class="pb-edhead"><label for="pm">Builds</label><span>4 builds · 32 lines</span></div> <div class="pb-ed" id="pm" role="textbox" aria-multiline="true" aria-label="Builds" contenteditable="true" spellcheck="false"> <div class="pb-blk" data-o="upd"><span></span><div><span class="pb-l pb-hd">BAL-27 <i>|</i> AR</span><span class="pb-l"><em>Build:</em> Build 2</span><span class="pb-l"><em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-bulk · 2026-09-14-pins2-board/index.html:184 |
| grid-template-columns | `minmax(0px, 1fr) minmax(0px, 1fr)` | `405px 405px` | .pb-bulk · 2026-09-14-pins2-board/index.html:184 |
| gap | `20px` | `` | .pb-bulk · 2026-09-14-pins2-board/index.html:184 |
| column-gap | `20px` | `20px` | .pb-bulk · 2026-09-14-pins2-board/index.html:184 |
| row-gap | `20px` | `20px` | .pb-bulk · 2026-09-14-pins2-board/index.html:184 |
| align-items | `start` | `start` | .pb-bulk · 2026-09-14-pins2-board/index.html:184 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div`

inside `.pb-bulk` · 10 on screen · **7 looks**

#### look 1 of 7

`G9many-211` · rendered **405×809** · 1 instance look like this

```html
<div> <div class="pb-edhead"><label for="pm">Builds</label><span>4 builds · 32 lines</span></div> <div class="pb-ed" id="pm" role="textbox" aria-multiline="true" aria-label="Builds" contenteditable="true" spellcheck="false"> <div class="pb-blk" data-o="upd"><span></span><div><span class="pb-l pb-hd">BAL-27 <i>|</i> AR</span><span class="pb-l"><em>Build:</em> Build 2</span><span class="pb-l"><em>Image:</em> BAL-27-2</
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 7

`G9many-218` · rendered **391×220** · 1 instance look like this

```html
<div><span class="pb-l pb-hd">BAL-27 <i>|</i> AR</span><span class="pb-l"><em>Build:</em> Build 2</span><span class="pb-l"><em>Image:</em> BAL-27-2</span><span class="pb-l pb-hit"><em>Code:</em> 1I2B4A8A9D</span><span class="pb-l"><em>Badges:</em> meta, best</span><span class="pb-l">- Gauge-9 Mono</span><span class="pb-l pb-hit">- Noctkill Long Barrel</span><span class="pb-l">- Clarent Light Stock</span><span class="
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `` | `500` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |

#### look 3 of 7

`G9many-236` · rendered **391×198** · 1 instance look like this

```html
<div><span class="pb-l pb-hd">FFAR 1 <i>|</i> AR</span><span class="pb-l"><em>Build:</em> Build 4</span><span class="pb-l"><em>Image:</em> FFAR-1-4</span><span class="pb-l"><em>Code:</em> 1B2E4F8E9E</span><span class="pb-l">- Agency Suppressor</span><span class="pb-l">- 20.3" Takedown</span><span class="pb-l">- SAS Combat Stock</span><span class="pb-l">- Salvo 44 Rnd Fast Mag</span><span class="pb-l">- Serpent Wrap</
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `` | `500` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |

#### look 4 of 7

`G9many-252` · rendered **391×176** · 1 instance look like this

```html
<div><span class="pb-l pb-hd">ICR-1 <i>|</i> AR</span><span class="pb-l"><em>Build:</em> Build 1</span><span class="pb-l pb-hit"><em>Badges:</em> meta, wobble</span><span class="pb-l">- YKM Integral Suppressor Light</span><span class="pb-l">- No Stock</span><span class="pb-l">- MacroMag IFS</span><span class="pb-l">- Granulated Grip Tape</span><span class="pb-l">- FMJ</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `` | `500` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |

#### look 5 of 7

`G9many-266` · rendered **391×88** · 1 instance look like this

```html
<div><span class="pb-l pb-hd pb-err">AK117</span><span class="pb-l"><em>Build:</em> Build 2</span><span class="pb-l">- Monolithic Suppressor</span><span class="pb-l">- No Stock</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `` | `500` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |

#### look 6 of 7

`G9many-272` · rendered **405×377** · 1 instance look like this

```html
<div> <div class="pb-tally"> <div data-o="new"><b>1</b><span>new</span></div> <div data-o="upd"><b>1</b><span>updated</span></div> <div data-o="warn"><b>1</b><span>saved with a warning</span></div> <div data-o="bad"><b>1</b><span>can’t be read</span></div> </div> <ol class="pb-rows"> <li class="pb-row" data-o="upd"><div class="pb-rt"><strong>BAL-27</strong><span>Build 2</span><span class="pb-ln">lines 1–10</span></di
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

*1 further looks are the same component in other data hues (a per-row `--c` / `--m` / `--sl`); they differ in colour only.*


### `div.pb-edhead`

inside `.—` · 1 on screen · **1 look**

#### the one look

`G9many-212` · rendered **405×17** · 1 instance look like this

```html
<div class="pb-edhead"><label for="pm">Builds</label><span>4 builds · 32 lines</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-edhead · 2026-09-14-pins2-board/index.html:185 |
| align-items | `baseline` | `baseline` | .pb-edhead · 2026-09-14-pins2-board/index.html:185 |
| justify-content | `space-between` | `space-between` | .pb-edhead · 2026-09-14-pins2-board/index.html:185 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `8px` | `8px` | .pb-edhead · 2026-09-14-pins2-board/index.html:185 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-ed[role=textbox]`

inside `.—` · 1 on screen · **1 look**

#### the one look

`G9many-215` · rendered **405×784** · 1 instance look like this · aria-label="Builds" role="textbox"

```html
<div class="pb-ed" id="pm" role="textbox" aria-multiline="true" aria-label="Builds" contenteditable="true" spellcheck="false"> <div class="pb-blk" data-o="upd"><span></span><div><span class="pb-l pb-hd">BAL-27 <i>|</i> AR</span><span class="pb-l"><em>Build:</em> Build 2</span><span class="pb-l"><em>Image:</em> BAL-27-2</span><span class="pb-l pb-hit"><em>Code:</em> 1I2B4A8A9D</span><span class="pb-l"><em>Badges:</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `10px 0` | `` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| padding-top | `10px` | `10px` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| padding-right | `0px` | `0px` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| padding-bottom | `10px` | `10px` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| padding-left | `0px` | `0px` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| border-radius | `var(--rad-2)` | `` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| outline | `0` | `` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| background | `var(--desk,#0b0f12)` | `` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| background-color | `` | `rgb(15, 20, 24)` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| background-image | `` | `none` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font | `500 13px/22px var(--data)` | `` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | `` | `13px` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | `` | `500` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | `` | `normal` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | `` | `normal` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | `` | `22px` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-ed · 2026-09-14-pins2-board/index.html:188 |


### `div.pb-blk`

inside `.pb-ed` · 4 on screen · **4 looks**

#### look 1 of 4

`G9many-216` · rendered **405×224** · 1 instance look like this

```html
<div class="pb-blk" data-o="upd"><span></span><div><span class="pb-l pb-hd">BAL-27 <i>|</i> AR</span><span class="pb-l"><em>Build:</em> Build 2</span><span class="pb-l"><em>Image:</em> BAL-27-2</span><span class="pb-l pb-hit"><em>Code:</em> 1I2B4A8A9D</span><span class="pb-l"><em>Badges:</em> meta, best</span><span class="pb-l">- Gauge-9 Mono</span><span class="pb-l pb-hit">- Noctkill Long Barrel</span><span class="p
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| position | `relative` | `relative` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| grid-template-columns | `14px 1fr` | `14px 391px` | .pb-ed .pb-blk · 2026-09-14-pins2-board/index.html:281 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `2px 0` | `` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-top | `2px` | `2px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-right | `0px` | `0px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-bottom | `2px` | `2px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-left | `0px` | `0px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `` | `500` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| width | `3px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| top | `2px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| bottom | `2px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| left | `0px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| border-radius | `0 2px 2px 0` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| background | `var(--o)` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| background-color | `` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| background-image | `` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| content | `""` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |

#### look 2 of 4

`G9many-234` · rendered **405×202** · 1 instance look like this

```html
<div class="pb-blk" data-o="new"><span></span><div><span class="pb-l pb-hd">FFAR 1 <i>|</i> AR</span><span class="pb-l"><em>Build:</em> Build 4</span><span class="pb-l"><em>Image:</em> FFAR-1-4</span><span class="pb-l"><em>Code:</em> 1B2E4F8E9E</span><span class="pb-l">- Agency Suppressor</span><span class="pb-l">- 20.3" Takedown</span><span class="pb-l">- SAS Combat Stock</span><span class="pb-l">- Salvo 44 Rnd Fast
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| position | `relative` | `relative` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| grid-template-columns | `14px 1fr` | `14px 391px` | .pb-ed .pb-blk · 2026-09-14-pins2-board/index.html:281 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `2px 0` | `` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-top | `2px` | `2px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-right | `0px` | `0px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-bottom | `2px` | `2px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-left | `0px` | `0px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| margin-top | `22px` | `22px` | .pb-blk + .pb-blk · 2026-09-14-pins2-board/index.html:190 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `` | `500` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| width | `3px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| top | `2px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| bottom | `2px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| left | `0px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| border-radius | `0 2px 2px 0` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| background | `var(--o)` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| background-color | `` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| background-image | `` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| content | `""` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |

#### look 3 of 4

`G9many-250` · rendered **405×180** · 1 instance look like this

```html
<div class="pb-blk" data-o="warn"><span></span><div><span class="pb-l pb-hd">ICR-1 <i>|</i> AR</span><span class="pb-l"><em>Build:</em> Build 1</span><span class="pb-l pb-hit"><em>Badges:</em> meta, wobble</span><span class="pb-l">- YKM Integral Suppressor Light</span><span class="pb-l">- No Stock</span><span class="pb-l">- MacroMag IFS</span><span class="pb-l">- Granulated Grip Tape</span><span class="pb-l">- FMJ</s
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| position | `relative` | `relative` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| grid-template-columns | `14px 1fr` | `14px 391px` | .pb-ed .pb-blk · 2026-09-14-pins2-board/index.html:281 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `2px 0` | `` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-top | `2px` | `2px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-right | `0px` | `0px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-bottom | `2px` | `2px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-left | `0px` | `0px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| margin-top | `22px` | `22px` | .pb-blk + .pb-blk · 2026-09-14-pins2-board/index.html:190 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `` | `500` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| width | `3px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| top | `2px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| bottom | `2px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| left | `0px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| border-radius | `0 2px 2px 0` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| background | `var(--o)` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| background-color | `` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| background-image | `` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| content | `""` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |

#### look 4 of 4

`G9many-264` · rendered **405×92** · 1 instance look like this

```html
<div class="pb-blk" data-o="bad"><span></span><div><span class="pb-l pb-hd pb-err">AK117</span><span class="pb-l"><em>Build:</em> Build 2</span><span class="pb-l">- Monolithic Suppressor</span><span class="pb-l">- No Stock</span></div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| position | `relative` | `relative` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| grid-template-columns | `14px 1fr` | `14px 391px` | .pb-ed .pb-blk · 2026-09-14-pins2-board/index.html:281 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `2px 0` | `` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-top | `2px` | `2px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-right | `0px` | `0px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-bottom | `2px` | `2px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| padding-left | `0px` | `0px` | .pb-blk · 2026-09-14-pins2-board/index.html:189 |
| margin-top | `22px` | `22px` | .pb-blk + .pb-blk · 2026-09-14-pins2-board/index.html:190 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `` | `500` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| width | `3px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| top | `2px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| bottom | `2px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| left | `0px` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| border-radius | `0 2px 2px 0` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |
| background | `repeating-linear-gradient(-45deg,var(--o) 0 3px,transparent 3px 6px)` | .pb-blk[data-o="bad"]::before · 2026-09-14-pins2-board/index.html:192 |
| background-color | `` | .pb-blk[data-o="bad"]::before · 2026-09-14-pins2-board/index.html:192 |
| background-image | `` | .pb-blk[data-o="bad"]::before · 2026-09-14-pins2-board/index.html:192 |
| content | `""` | .pb-blk::before · 2026-09-14-pins2-board/index.html:191 |


### `span.pb-hd.pb-l`

inside `.—` · 3 on screen · **1 look**

#### the one look

`G9many-219` · rendered **391×22** · 3 instances look like this

```html
<span class="pb-l pb-hd">BAL-27 <i>|</i> AR</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| position | `relative` | `relative` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-left | `30px` | `30px` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | `700` | `700` | .pb-l.pb-hd · 2026-09-14-pins2-board/index.html:196 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| white-space | `pre` | `` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-l.pb-hd · 2026-09-14-pins2-board/index.html:196 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| width | `20px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| left | `0px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| font-size | `11px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| text-align | `right` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| color | `var(--ink4)` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| content | `counter(ln)` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |


### `span.pb-l`

inside `.—` · 24 on screen · **1 look**

#### the one look

`G9many-221` · rendered **391×22** · 24 instances look like this

```html
<span class="pb-l"><em>Build:</em> Build 2</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| position | `relative` | `relative` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-left | `30px` | `30px` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `` | `500` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| white-space | `pre` | `` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| width | `20px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| left | `0px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| font-size | `11px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| text-align | `right` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| color | `var(--ink4)` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| content | `counter(ln)` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |


### `span.pb-hit.pb-l`

inside `.—` · 3 on screen · **1 look**

#### the one look

`G9many-225` · rendered **391×22** · 3 instances look like this

```html
<span class="pb-l pb-hit"><em>Code:</em> 1I2B4A8A9D</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| position | `relative` | `relative` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-left | `30px` | `30px` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| background | `color-mix(in srgb,var(--patch) 12%,transparent)` | `` | .pb-l.pb-hit · 2026-09-14-pins2-board/index.html:199 |
| background-color | `` | `color(srgb 0.94902 0.760784 0.188235 / 0.12)` | .pb-l.pb-hit · 2026-09-14-pins2-board/index.html:199 |
| background-image | `` | `none` | .pb-l.pb-hit · 2026-09-14-pins2-board/index.html:199 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | ↑ `` | `500` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| white-space | `pre` | `` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-l.pb-hit · 2026-09-14-pins2-board/index.html:199 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| width | `20px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| left | `0px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| font-size | `11px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| text-align | `right` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| color | `var(--ink4)` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| content | `counter(ln)` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |


### `span.pb-err.pb-hd.pb-l`

inside `.—` · 1 on screen · **1 look**

#### the one look

`G9many-267` · rendered **391×22** · 1 instance look like this · text “AK117”

```html
<span class="pb-l pb-hd pb-err">AK117</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| position | `relative` | `relative` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-left | `30px` | `30px` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| font | ↑ `500 13px/22px var(--data)` | `` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-size | ↑ `` | `13px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-weight | `700` | `700` | .pb-l.pb-hd · 2026-09-14-pins2-board/index.html:196 |
| font-style | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| line-height | ↑ `` | `22px` | inherited · .pb-ed · 2026-09-14-pins2-board/index.html:188 |
| letter-spacing | — | `normal` | initial |
| text-decoration | `underline wavy var(--danger-ink) 1px` | `` | .pb-l.pb-err · 2026-09-14-pins2-board/index.html:200 |
| white-space | `pre` | `` | .pb-l · 2026-09-14-pins2-board/index.html:194 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-l.pb-err · 2026-09-14-pins2-board/index.html:200 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| width | `20px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| left | `0px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| font-size | `11px` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| text-align | `right` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| color | `var(--ink4)` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |
| content | `counter(ln)` | .pb-l::before · 2026-09-14-pins2-board/index.html:195 |


### `div.pb-tally`

inside `.—` · 1 on screen · **1 look**

#### the one look

`G9many-273` · rendered **405×88** · 1 instance look like this

```html
<div class="pb-tally"> <div data-o="new"><b>1</b><span>new</span></div> <div data-o="upd"><b>1</b><span>updated</span></div> <div data-o="warn"><b>1</b><span>saved with a warning</span></div> <div data-o="bad"><b>1</b><span>can’t be read</span></div> </div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| grid-template-columns | `repeat(4, 1fr)` | `100.5px 100.5px 100.5px 100.5px` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| gap | `1px` | `` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| column-gap | `1px` | `1px` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| row-gap | `1px` | `1px` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-2)` | `` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| background | `var(--rule)` | `` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| background-color | `` | `rgb(42, 52, 61)` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| background-image | `` | `none` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| box-shadow | `inset 0 0 0 1px var(--rule)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| overflow-x | `hidden` | `hidden` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |
| overflow-y | `hidden` | `hidden` | .pb-tally · 2026-09-14-pins2-board/index.html:206 |


### `b`

inside `.—` · 5 on screen · **5 looks**

#### look 1 of 5

`G9many-275` · rendered **77×37** · 1 instance look like this · text “1”

```html
<b>1</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 30px/1 var(--data)` | `` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-size | `` | `30px` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-weight | `` | `700` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-style | `` | `normal` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| line-height | `` | `30px` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| letter-spacing | — | `normal` | initial |
| color | `var(--o,var(--ink))` | `rgb(123, 219, 99)` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |

#### look 2 of 5

`G9many-278` · rendered **77×37** · 1 instance look like this · text “1”

```html
<b>1</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 30px/1 var(--data)` | `` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-size | `` | `30px` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-weight | `` | `700` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-style | `` | `normal` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| line-height | `` | `30px` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| letter-spacing | — | `normal` | initial |
| color | `var(--o,var(--ink))` | `rgb(242, 194, 48)` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |

#### look 3 of 5

`G9many-281` · rendered **77×30** · 1 instance look like this · text “1”

```html
<b>1</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 30px/1 var(--data)` | `` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-size | `` | `30px` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-weight | `` | `700` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-style | `` | `normal` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| line-height | `` | `30px` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| letter-spacing | — | `normal` | initial |
| color | `var(--o,var(--ink))` | `rgb(255, 122, 69)` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |

#### look 4 of 5

`G9many-284` · rendered **77×30** · 1 instance look like this · text “1”

```html
<b>1</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 30px/1 var(--data)` | `` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-size | `` | `30px` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-weight | `` | `700` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-style | `` | `normal` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| line-height | `` | `30px` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |
| letter-spacing | — | `normal` | initial |
| color | `var(--o,var(--ink))` | `rgb(255, 138, 133)` | .pb-tally b · 2026-09-14-pins2-board/index.html:208 |

#### look 5 of 5

`G9many-296` · rendered **113×18** · 1 instance look like this · text “Noctkill Long Barrel”

```html
<b>Noctkill Long Barrel</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| font-weight | `600` | `600` | .pb-rd b · 2026-09-14-pins2-board/index.html:221 |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-rd b · 2026-09-14-pins2-board/index.html:221 |


### `ol.pb-rows`

inside `.—` · 1 on screen · **1 look**

#### the one look

`G9many-286` · rendered **405×278** · 1 instance look like this

```html
<ol class="pb-rows"> <li class="pb-row" data-o="upd"><div class="pb-rt"><strong>BAL-27</strong><span>Build 2</span><span class="pb-ln">lines 1–10</span></div><span class="pb-oc">Update</span> <div class="pb-rd"><span class="pb-k2">Barrel</span><s>Crown-H3 Barrel</s>⟨svg.ic⟩<b>Noctkill Long Barrel</b></div></li> <li class="pb-row" data-o="new"><div class="pb-rt"><strong>FFAR 1</strong><span>Build 4</span><span class="
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| gap | `8px` | `` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| column-gap | `8px` | `8px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| row-gap | `8px` | `8px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0` | `` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| padding-top | `0px` | `0px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| padding-right | `0px` | `0px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| padding-bottom | `0px` | `0px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| padding-left | `0px` | `0px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| margin | `12px 0 0` | `` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| margin-top | `12px` | `12px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| margin-right | `0px` | `0px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| margin-bottom | `0px` | `0px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| margin-left | `0px` | `0px` | .pb-rows · 2026-09-14-pins2-board/index.html:210 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `li.pb-row`

inside `.pb-rows` · 4 on screen · **2 looks**

#### look 1 of 2

`G9many-287` · rendered **405×64** · 3 instances look like this

```html
<li class="pb-row" data-o="upd"><div class="pb-rt"><strong>BAL-27</strong><span>Build 2</span><span class="pb-ln">lines 1–10</span></div><span class="pb-oc">Update</span> <div class="pb-rd"><span class="pb-k2">Barrel</span><s>Crown-H3 Barrel</s>⟨svg.ic⟩<b>Noctkill Long Barrel</b></div></li>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| position | `relative` | `relative` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| grid-template-columns | `1fr auto` | `318.859px 42.1406px` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| gap | `4px 12px` | `` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| column-gap | `12px` | `12px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| row-gap | `4px` | `4px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| align-items | `center` | `center` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `12px 14px` | `` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| padding-top | `12px` | `12px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| padding-right | `14px` | `14px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| padding-bottom | `12px` | `12px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| padding-left | `18px` | `18px` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| border-radius | `var(--rad-2)` | `` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| background | `var(--raised)` | `` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| background-image | `` | `none` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| box-shadow | `inset 0 0 0 1px var(--rule)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| overflow-x | `hidden` | `hidden` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| overflow-y | `hidden` | `hidden` | .pb-row · 2026-09-14-pins2-board/index.html:282 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| width | `3px` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| top | `0px` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| bottom | `0px` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| left | `0px` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| background | `var(--o)` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| background-color | `` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| background-image | `` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| content | `""` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |

#### look 2 of 2

`G9many-318` · rendered **405×62** · 1 instance look like this

```html
<li class="pb-row" data-o="bad"><div class="pb-rt"><strong>AK117</strong><span class="pb-ln">line 28</span></div><span class="pb-oc">Can’t read</span> <div class="pb-rd pb-msg"><span>First line needs a category: <code>AK117 | AR</code></span></div></li>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| position | `relative` | `relative` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| grid-template-columns | `1fr auto` | `301.25px 59.75px` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| gap | `4px 12px` | `` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| column-gap | `12px` | `12px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| row-gap | `4px` | `4px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| align-items | `center` | `center` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `12px 14px` | `` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| padding-top | `12px` | `12px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| padding-right | `14px` | `14px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| padding-bottom | `12px` | `12px` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| padding-left | `18px` | `18px` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| border-radius | `var(--rad-2)` | `` | .pb-row · 2026-09-14-pins2-board/index.html:211 |
| background | `repeating-linear-gradient(-45deg,color-mix(in srgb,var(--danger-ink) 7%,transparent) 0 6px,transparent 6px 12px),var(--raised)` | `` | .pb-row[data-o="bad"] · 2026-09-14-pins2-board/index.html:212 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-row[data-o="bad"] · 2026-09-14-pins2-board/index.html:212 |
| background-image | `` | `repeating-linear-gradient(-45deg, color(srgb 1 0.541176 0.521569 / 0.07) 0px, color(srgb 1 0.541176 0.521569 / 0.07) 6px, rgba(0, 0, 0, 0) 6px, rgba(0, 0, 0, 0) 12px), none` | .pb-row[data-o="bad"] · 2026-09-14-pins2-board/index.html:212 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--danger-ink) 35%,transparent)` | `color(srgb 1 0.541176 0.521569 / 0.35) 0px 0px 0px 1px inset` | .pb-row[data-o="bad"] · 2026-09-14-pins2-board/index.html:212 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| overflow-x | `hidden` | `hidden` | .pb-row · 2026-09-14-pins2-board/index.html:282 |
| overflow-y | `hidden` | `hidden` | .pb-row · 2026-09-14-pins2-board/index.html:282 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| width | `3px` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| top | `0px` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| bottom | `0px` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| left | `0px` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |
| background | `repeating-linear-gradient(-45deg,var(--o) 0 3px,transparent 3px 6px)` | .pb-row[data-o="bad"]::before · 2026-09-14-pins2-board/index.html:284 |
| background-color | `` | .pb-row[data-o="bad"]::before · 2026-09-14-pins2-board/index.html:284 |
| background-image | `` | .pb-row[data-o="bad"]::before · 2026-09-14-pins2-board/index.html:284 |
| content | `""` | .pb-row::before · 2026-09-14-pins2-board/index.html:283 |


### `div.pb-rt`

inside `.pb-row` · 4 on screen · **2 looks**

#### look 1 of 2

`G9many-288` · rendered **319×18** · 3 instances look like this

```html
<div class="pb-rt"><strong>BAL-27</strong><span>Build 2</span><span class="pb-ln">lines 1–10</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-rt · 2026-09-14-pins2-board/index.html:213 |
| gap | `8px` | `` | .pb-rt · 2026-09-14-pins2-board/index.html:213 |
| column-gap | `8px` | `8px` | .pb-rt · 2026-09-14-pins2-board/index.html:213 |
| row-gap | `8px` | `8px` | .pb-rt · 2026-09-14-pins2-board/index.html:213 |
| align-items | `baseline` | `baseline` | .pb-rt · 2026-09-14-pins2-board/index.html:213 |
| min-width | `0px` | `0px` | .pb-rt · 2026-09-14-pins2-board/index.html:213 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G9many-319` · rendered **301×16** · 1 instance look like this

```html
<div class="pb-rt"><strong>AK117</strong><span class="pb-ln">line 28</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-rt · 2026-09-14-pins2-board/index.html:213 |
| gap | `8px` | `` | .pb-rt · 2026-09-14-pins2-board/index.html:213 |
| column-gap | `8px` | `8px` | .pb-rt · 2026-09-14-pins2-board/index.html:213 |
| row-gap | `8px` | `8px` | .pb-rt · 2026-09-14-pins2-board/index.html:213 |
| align-items | `baseline` | `baseline` | .pb-rt · 2026-09-14-pins2-board/index.html:213 |
| min-width | `0px` | `0px` | .pb-rt · 2026-09-14-pins2-board/index.html:213 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `strong`

inside `.pb-rt` · 4 on screen · **1 look**

#### the one look

`G9many-289` · rendered **44×16** · 4 instances look like this · text “BAL-27”

```html
<strong>BAL-27</strong>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-base)/1.2 var(--ui)` | `` | .pb-rt strong · 2026-09-14-pins2-board/index.html:214 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-rt strong · 2026-09-14-pins2-board/index.html:214 |
| font-size | `` | `13px` | .pb-rt strong · 2026-09-14-pins2-board/index.html:214 |
| font-weight | `` | `600` | .pb-rt strong · 2026-09-14-pins2-board/index.html:214 |
| font-style | `` | `normal` | .pb-rt strong · 2026-09-14-pins2-board/index.html:214 |
| font-variant-numeric | `` | `normal` | .pb-rt strong · 2026-09-14-pins2-board/index.html:214 |
| line-height | `` | `15.6px` | .pb-rt strong · 2026-09-14-pins2-board/index.html:214 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-rt strong · 2026-09-14-pins2-board/index.html:214 |


### `span.pb-ln`

inside `.pb-rt` · 4 on screen · **1 look**

#### the one look

`G9many-291` · rendered **72×12** · 4 instances look like this · text “lines 1–10”

```html
<span class="pb-ln">lines 1–10</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-left | `4px` | `4px` | .pb-ln · 2026-09-14-pins2-board/index.html:286 |
| font | `500 var(--t-sm)/1 var(--data)` | `` | .pb-ln · 2026-09-14-pins2-board/index.html:286 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-ln · 2026-09-14-pins2-board/index.html:286 |
| font-size | `var(--t-sm)` | `12px` | .pb-rt span · 2026-09-14-pins2-board/index.html:215 |
| font-weight | `` | `500` | .pb-ln · 2026-09-14-pins2-board/index.html:286 |
| font-style | `` | `normal` | .pb-ln · 2026-09-14-pins2-board/index.html:286 |
| font-variant-numeric | `` | `normal` | .pb-ln · 2026-09-14-pins2-board/index.html:286 |
| line-height | `` | `12px` | .pb-ln · 2026-09-14-pins2-board/index.html:286 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-rt span · 2026-09-14-pins2-board/index.html:215 |


### `span.pb-oc`

inside `.pb-row` · 4 on screen · **4 looks**

#### look 1 of 4

`G9many-292` · rendered **42×12** · 1 instance look like this · text “Update”

```html
<span class="pb-oc">Update</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-size | `` | `12px` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-weight | `` | `600` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-style | `` | `normal` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-variant-numeric | `` | `normal` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| line-height | `` | `12px` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| letter-spacing | — | `normal` | initial |
| color | `var(--o)` | `rgb(242, 194, 48)` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |

#### look 2 of 4

`G9many-302` · rendered **24×12** · 1 instance look like this · text “New”

```html
<span class="pb-oc">New</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-size | `` | `12px` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-weight | `` | `600` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-style | `` | `normal` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-variant-numeric | `` | `normal` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| line-height | `` | `12px` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| letter-spacing | — | `normal` | initial |
| color | `var(--o)` | `rgb(123, 219, 99)` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |

#### look 3 of 4

`G9many-315` · rendered **48×12** · 1 instance look like this · text “Warning”

```html
<span class="pb-oc">Warning</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-size | `` | `12px` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-weight | `` | `600` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-style | `` | `normal` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-variant-numeric | `` | `normal` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| line-height | `` | `12px` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| letter-spacing | — | `normal` | initial |
| color | `var(--o)` | `rgb(255, 122, 69)` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |

#### look 4 of 4

`G9many-322` · rendered **60×12** · 1 instance look like this · text “Can’t read”

```html
<span class="pb-oc">Can’t read</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-size | `` | `12px` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-weight | `` | `600` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-style | `` | `normal` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| font-variant-numeric | `` | `normal` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| line-height | `` | `12px` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |
| letter-spacing | — | `normal` | initial |
| color | `var(--o)` | `rgb(255, 138, 133)` | .pb-oc · 2026-09-14-pins2-board/index.html:216 |


### `div.pb-rd`

inside `.pb-row` · 2 on screen · **1 look**

#### the one look

`G9many-293` · rendered **373×18** · 2 instances look like this

```html
<div class="pb-rd"><span class="pb-k2">Barrel</span><s>Crown-H3 Barrel</s>⟨svg.ic⟩<b>Noctkill Long Barrel</b></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| grid-column | `1 / -1` | `` | .pb-rd · 2026-09-14-pins2-board/index.html:285 |
| gap | `6px 8px` | `` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| column-gap | `8px` | `8px` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| row-gap | `6px` | `6px` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| flex-wrap | `wrap` | `wrap` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| align-items | `center` | `center` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |


### `span.pb-k2`

inside `.pb-rd` · 1 on screen · **1 look**

#### the one look

`G9many-294` · rendered **56×18** · 1 instance look like this · text “Barrel”

```html
<span class="pb-k2">Barrel</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| min-width | `56px` | `56px` | .pb-rd .pb-k2 · 2026-09-14-pins2-board/index.html:223 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-rd .pb-k2 · 2026-09-14-pins2-board/index.html:223 |


### `span.pb-sl`

inside `.pb-rd` · 1 on screen · **1 look**

#### the one look

`G9many-304` · rendered **286×18** · 1 instance look like this

```html
<span class="pb-sl"><span>Muzzle</span><span>Barrel</span><span>Stock</span><span>Rear grip</span><span>Ammunition</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-rd .pb-sl · 2026-09-14-pins2-board/index.html:218 |
| gap | `0` | `` | .pb-rd .pb-sl · 2026-09-14-pins2-board/index.html:218 |
| column-gap | `0px` | `0px` | .pb-rd .pb-sl · 2026-09-14-pins2-board/index.html:218 |
| row-gap | `0px` | `0px` | .pb-rd .pb-sl · 2026-09-14-pins2-board/index.html:218 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .pb-rd · 2026-09-14-pins2-board/index.html:217 |


### `div.pb-msg.pb-rd`

inside `.pb-row` · 2 on screen · **1 look**

#### the one look

`G9many-316` · rendered **373×18** · 2 instances look like this

```html
<div class="pb-rd pb-msg"><span><code>wobble</code> isn’t a badge — saved with Meta only</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| grid-column | `1 / -1` | `` | .pb-rd · 2026-09-14-pins2-board/index.html:285 |
| gap | `6px 8px` | `` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| column-gap | `8px` | `8px` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| row-gap | `6px` | `6px` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| flex-wrap | `wrap` | `wrap` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| align-items | `center` | `center` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | .pb-rd · 2026-09-14-pins2-board/index.html:217 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-rd.pb-msg · 2026-09-14-pins2-board/index.html:224 |


### `span.why`

inside `.dw-f` · 1 on screen · **1 look**

#### the one look

`G9many-326` · rendered **104×16** · 1 instance look like this · text “Block 4 is skipped”

```html
<span class="why">Block 4 is skipped</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| align-self | `center` | `center` | .dw-f .why · 2026-09-14-pins2-board/app.css:6574 |
| max-width | `52%` | `52%` | .dw-f .why · 2026-09-14-pins2-board/app.css:6574 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-right | `auto` | `437.359px` | .dw-f .why · 2026-09-14-pins2-board/app.css:6574 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | .dw-f .why · 2026-09-14-pins2-board/app.css:6574 |
| font-weight | — | `400` | initial |
| line-height | `var(--lh-ui)` | `16.2px` | .dw-f .why · 2026-09-14-pins2-board/app.css:6574 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .dw-f .why · 2026-09-14-pins2-board/app.css:6574 |


### G9 · Existing image key

94 distinct signatures on screen; 0 not already specced above.


### G8 · Bad link, short window

55 distinct signatures on screen; 16 not already specced above.


### `aside.drawer.wide[role=dialog]`

inside `.pb-stage` · 1 on screen · **1 look**

#### the one look

`G8bad-5` · rendered **880×664** · 1 instance look like this · aria-label="Post an announcement" role="dialog"

```html
<aside class="drawer wide" role="dialog" aria-label="Post an announcement"> <header class="dw-h"><div class="dw-ttl"><span class="dw-eye">announcement.post · tier 1</span><h2>Post an announcement</h2></div> <button class="x" aria-label="Close">⟨svg.ic⟩</button></header> <div class="pb-view" data-view="0" hidden=""> <div class="dw-b"><div class="bed"> <div class="pb-col"> <div class="dwfield"><label>Text</label> <text
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| position | `relative` | `relative` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| flex-direction | `column` | `column` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| width | `880px` | `880px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| max-height | `none` | `none` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0 auto` | `` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-top | `0px` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-right | `auto` | `-26px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-bottom | `0px` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| margin-left | `auto` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| top | `auto` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| left | `auto` | `0px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| border | `1px solid var(--rule2)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| border-radius | `var(--rad-3)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| background | `var(--raised)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| background-color | `` | `rgb(31, 39, 46)` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| background-image | `` | `none` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| box-shadow | `rgba(0, 0, 0, 0.75) 0px 40px 80px -24px` | `rgba(0, 0, 0, 0.75) 0px 40px 80px -24px` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| opacity | `1` | `1` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| overflow | `hidden` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| overflow-x | `hidden` | `hidden` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| overflow-y | `hidden` | `hidden` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| transform | `none` | `none` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| transition | `opacity .18s,transform .18s cubic-bezier(.2,.8,.3,1)` | `` | .drawer · 2026-09-14-pins2-board/app.css:1059 |
| z-index | `auto` | `auto` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |
| pointer-events | `auto` | `auto` | .pb-stage .drawer · 2026-09-14-pins2-board/index.html:8 |


### `div.dw-b`

inside `.pb-view` · 2 on screen · **1 look**

#### the one look

`G8bad-66` · rendered **878×516** · 1 instance look like this

```html
<div class="dw-b"><div class="bed"> <div class="pb-col"> <div class="dwfield"><label>Text</label> <textarea rows="3"># New Legendary draw is live The Kilo Bo…</textarea> <div class="pb-meter2" aria-label="Delivery budget"><span class="cmeter"><i style="width:45.4%"></i><i style="width:1.1%"></i></span><span><b>3,212</b> of 6,000 left</span></div></div> <div class="dwfield"><label>Banner</label> <div class="pb-banner"
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| flex | `1 1 auto` | `` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `var(--s4) var(--s5)` | `` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-top | `` | `16px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-right | `` | `24px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-bottom | `` | `16px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| padding-left | `` | `24px` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `auto` | `` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| overflow-x | `auto` | `auto` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |
| overflow-y | `auto` | `auto` | .dw-b · 2026-09-14-pins2-board/app.css:1085 |


### `div.bed`

inside `.dw-b` · 2 on screen · **1 look**

#### the one look

`G8bad-67` · rendered **830×484** · 1 instance look like this

```html
<div class="bed"> <div class="pb-col"> <div class="dwfield"><label>Text</label> <textarea rows="3"># New Legendary draw is live The Kilo Bo…</textarea> <div class="pb-meter2" aria-label="Delivery budget"><span class="cmeter"><i style="width:45.4%"></i><i style="width:1.1%"></i></span><span><b>3,212</b> of 6,000 left</span></div></div> <div class="dwfield"><label>Banner</label> <div class="pb-banner"><span class="pb-t
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .bed · 2026-09-14-pins2-board/app.css:3272 |
| grid-template-columns | `1fr 320px` | `492px 320px` | .pb-stage .dw-b .bed · 2026-09-14-pins2-board/index.html:145 |
| gap | `18px` | `` | .drawer.wide .bed · 2026-09-14-pins2-board/app.css:6788 |
| column-gap | `18px` | `18px` | .drawer.wide .bed · 2026-09-14-pins2-board/app.css:6788 |
| row-gap | `18px` | `18px` | .drawer.wide .bed · 2026-09-14-pins2-board/app.css:6788 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-col`

inside `.bed` · 2 on screen · **1 look**

#### the one look

`G8bad-68` · rendered **492×484** · 1 instance look like this

```html
<div class="pb-col"> <div class="dwfield"><label>Text</label> <textarea rows="3"># New Legendary draw is live The Kilo Bo…</textarea> <div class="pb-meter2" aria-label="Delivery budget"><span class="cmeter"><i style="width:45.4%"></i><i style="width:1.1%"></i></span><span><b>3,212</b> of 6,000 left</span></div></div> <div class="dwfield"><label>Banner</label> <div class="pb-banner"><span class="pb-th pb-bad">⟨svg.ic.
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-col · 2026-09-14-pins2-board/index.html:146 |
| gap | `18px` | `` | .pb-col · 2026-09-14-pins2-board/index.html:146 |
| column-gap | `18px` | `18px` | .pb-col · 2026-09-14-pins2-board/index.html:146 |
| row-gap | `18px` | `18px` | .pb-col · 2026-09-14-pins2-board/index.html:146 |
| min-width | `0px` | `0px` | .pb-col · 2026-09-14-pins2-board/index.html:306 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.dwfield`

inside `.pb-col` · 8 on screen · **1 look**

#### the one look

`G8bad-69` · rendered **504×145** · 1 instance look like this

```html
<div class="dwfield"><label>Text</label> <textarea rows="3"># New Legendary draw is live The Kilo Bo…</textarea> <div class="pb-meter2" aria-label="Delivery budget"><span class="cmeter"><i style="width:45.4%"></i><i style="width:1.1%"></i></span><span><b>3,212</b> of 6,000 left</span></div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| gap | `var(--s2)` | `` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| column-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| row-gap | `` | `8px` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| flex-direction | `column` | `column` | .dwfield · 2026-09-14-pins2-board/app.css:2239 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `0px` | `0px` | .pb-stage .dwfield · 2026-09-14-pins2-board/index.html:34 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `b`

inside `.—` · 3 on screen · **1 look**

#### the one look

`G8bad-42` · rendered **0×0** · 1 instance look like this · text “Sun Nov 15”

```html
<b>Sun Nov 15</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `600 var(--t-sm)/1 var(--data)` | `` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-size | ↑ `` | `12px` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-weight | `600` | `600` | .pb-echo.pb-dim b · 2026-09-14-pins2-board/index.html:73 |
| font-style | ↑ `` | `normal` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| line-height | ↑ `` | `12px` | inherited · .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-echo.pb-dim b · 2026-09-14-pins2-board/index.html:73 |


### `span.pb-dim.pb-echo`

inside `.dwfield` · 1 on screen · **1 look**

#### the one look

`G8bad-41` · rendered **0×0** · 1 instance look like this

```html
<span class="pb-echo pb-dim">default · <b>Sun Nov 15</b></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| gap | `6px` | `` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| column-gap | `6px` | `6px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| row-gap | `6px` | `6px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| align-items | `center` | `center` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `6px` | `6px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font | `600 var(--t-sm)/1 var(--data)` | `` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-size | `` | `12px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-weight | `` | `600` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-style | `` | `normal` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-variant-numeric | `` | `normal` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| line-height | `` | `12px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-echo.pb-dim · 2026-09-14-pins2-board/index.html:72 |


### `aside.bed-side.pb-card`

inside `.bed` · 2 on screen · **1 look**

#### the one look

`G8bad-115` · rendered **320×289** · 1 instance look like this

```html
<aside class="bed-side pb-card"><div class="bed-sec"><h5>In Discord</h5> <div class="dcard"><div class="pb-h">New Legendary draw is live</div><p>The Kilo Bolt-Action draw opens today.</p><div class="pb-ts">Posted Sep 16</div> <div class="pb-img2 pb-bad">⟨svg.ic.xl⟩</div></div></div></aside>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | article, aside, footer, header, hgroup, main, nav, search, section · user-agent:? |
| position | `sticky` | `sticky` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| align-self | `start` | `start` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| min-width | `0px` | `0px` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `14px` | `14px` | .bed-side · 2026-09-14-pins2-board/app.css:6312 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.bed-sec`

inside `.bed-side` · 2 on screen · **1 look**

#### the one look

`G8bad-116` · rendered **320×269** · 1 instance look like this

```html
<div class="bed-sec"><h5>In Discord</h5> <div class="dcard"><div class="pb-h">New Legendary draw is live</div><p>The Kilo Bolt-Action draw opens today.</p><div class="pb-ts">Posted Sep 16</div> <div class="pb-img2 pb-bad">⟨svg.ic.xl⟩</div></div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `20px` | `20px` | .bed-sec · 2026-09-14-pins2-board/app.css:3282 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.dcard`

inside `.bed-sec` · 2 on screen · **1 look**

#### the one look

`G8bad-117` · rendered **320×248** · 1 instance look like this

```html
<div class="dcard"><div class="pb-h">New Legendary draw is live</div><p>The Kilo Bolt-Action draw opens today.</p><div class="pb-ts">Posted Sep 16</div> <div class="pb-img2 pb-bad">⟨svg.ic.xl⟩</div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `11px 13px` | `` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-top | `11px` | `11px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-right | `13px` | `13px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-bottom | `11px` | `11px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| padding-left | `13px` | `13px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| border-left | `4px solid var(--c)` | `` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| border-radius | `8px/* foreign-radius: Discord's own corner, like --dc-*. The preview must look like Discord, not like the portal. */` | `` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| background | `var(--dc-bg)` | `` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| background-color | `` | `rgb(43, 45, 49)` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| background-image | `` | `none` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `12.5px` | `12.5px` | .dcard · 2026-09-14-pins2-board/app.css:1097 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `18.75px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--dc-body)` | `rgb(219, 222, 225)` | .dcard · 2026-09-14-pins2-board/app.css:1296 |
| transition | `transform var(--dur-2) var(--ease), background var(--dur-2) var(--ease),box-shadow var(--dur-2) var(--ease),border-color var(--dur-2) var(--ease)` | `` | .wcard, .ccard, .tile, .hlive .lp, .dcard · 2026-09-14-pins2-board/app.css:5712 |


### `p`

inside `.dcard` · 2 on screen · **1 look**

#### the one look

`G8bad-119` · rendered **290×20** · 1 instance look like this · text “The Kilo Bolt-Action draw opens today.”

```html
<p>The Kilo Bolt-Action draw opens today.</p>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | p · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0 0 6px` | `` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 |
| margin-top | `0px` | `0px` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 |
| margin-right | `0px` | `0px` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 |
| margin-bottom | `6px` | `6px` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 |
| margin-left | `0px` | `0px` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `13.5px` | `13.5px` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 |
| font-weight | — | `400` | initial |
| line-height | ⚠️ `1.45` | `19.575px` | .pb-card .dcard p · 2026-09-14-pins2-board/index.html:140 · **a later rule wins — port the computed value and find that rule** |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--dc-body)` | `rgb(219, 222, 225)` | inherited · .dcard · 2026-09-14-pins2-board/app.css:1296 |


### `div.pb-in.pb-view`

inside `.drawer` · 1 on screen · **1 look**

#### the one look

`G8bad-65` · rendered **878×585** · 1 instance look like this

```html
<div class="pb-view pb-in" data-view="1"> <div class="dw-b"><div class="bed"> <div class="pb-col"> <div class="dwfield"><label>Text</label> <textarea rows="3"># New Legendary draw is live The Kilo Bo…</textarea> <div class="pb-meter2" aria-label="Delivery budget"><span class="cmeter"><i style="width:45.4%"></i><i style="width:1.1%"></i></span><span><b>3,212</b> of 6,000 left</span></div></div> <div class="dwfield"><l
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| animation | `pb-in .2s ease both` | `` | .pb-in · 2026-09-14-pins2-board/index.html:28 |


### `svg.ic.lg`

inside `.pb-th` · 1 on screen · **1 look**

#### the one look

`G8bad-81` · rendered **18×18** · 1 instance look like this

```html
<svg class="ic lg"><use href="#i-triangle-alert"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| width | `1.35em` | `17.5469px` | .ic.lg · 2026-09-14-pins2-board/app.css:6170 |
| height | `1.35em` | `17.5469px` | .ic.lg · 2026-09-14-pins2-board/app.css:6170 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board/index.html:4 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--warn)` | `rgb(255, 122, 69)` | inherited · .pb-banner .pb-th.pb-bad · 2026-09-14-pins2-board/index.html:131 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |


### `input.pb-bad`

inside `.pb-banner` · 1 on screen · **1 look**

#### the one look

`G8bad-82` · rendered **412×44** · 1 instance look like this

```html
<input class="pb-bad" value="https://cdn.example.net/old/banner.png">
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | input, textarea, select, button · user-agent:? |
| min-height | `var(--tap)` | `44px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `8px 10px` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-top | `8px` | `8px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-right | `10px` | `10px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-bottom | `8px` | `8px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| padding-left | `var(--ctl-pl,10px)` | `10px` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]) · 2026-09-14-pins2-board/app.css:633 |
| border | `1px solid var(--rule2)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| border-color | `var(--warn)` | `` | .pb-banner input.pb-bad · 2026-09-14-pins2-board/index.html:132 |
| border-radius | `var(--rad-2)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| background | `var(--sunk)` | `` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| background-color | `` | `rgb(11, 15, 18)` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| background-image | `` | `none` | input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([data-bare]), sel · 2026-09-14-pins2-board/app.css:631 |
| font | `500 var(--t-base)/1 var(--ui)` | `` | .dwfield input · 2026-09-14-pins2-board/app.css:2243 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .dwfield input · 2026-09-14-pins2-board/app.css:2243 |
| font-size | `var(--t-base)` | `13px` | .pb-stage .dwfield input, .pb-stage .dwfield select · 2026-09-14-pins2-board/index.html:33 |
| font-weight | `` | `500` | .dwfield input · 2026-09-14-pins2-board/app.css:2243 |
| font-style | `` | `normal` | .dwfield input · 2026-09-14-pins2-board/app.css:2243 |
| font-variant-numeric | `` | `normal` | .dwfield input · 2026-09-14-pins2-board/app.css:2243 |
| line-height | `` | `13px` | .dwfield input · 2026-09-14-pins2-board/app.css:2243 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `start` | `start` | input, textarea, select, button · user-agent:? |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .dwfield input · 2026-09-14-pins2-board/app.css:2243 |
| overflow-x | `clip !important !important` | `clip` | input:not([type="range" i], [type="checkbox" i], [type="radio" i]) · user-agent:? |
| overflow-y | `clip !important !important` | `clip` | input:not([type="range" i], [type="checkbox" i], [type="radio" i]) · user-agent:? |
| cursor | `text` | `text` | input · user-agent:? |

**:hover** — changes nothing on the element itself

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes nothing on the element itself


### `span.pb-echo.pb-warn`

inside `.dwfield` · 1 on screen · **1 look**

#### the one look

`G8bad-83` · rendered **412×12** · 1 instance look like this · text “didn’t load”

```html
<span class="pb-echo pb-warn" style="margin-left:92px">didn’t load</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| gap | `6px` | `` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| column-gap | `6px` | `6px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| row-gap | `6px` | `6px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| align-items | `center` | `center` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-top | `6px` | `6px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| margin-left | `92px` | `92px` | style attribute |
| font | `600 var(--t-sm)/1 var(--data)` | `` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-size | `` | `12px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-weight | `` | `600` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-style | `` | `normal` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| font-variant-numeric | `` | `normal` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| line-height | `` | `12px` | .pb-echo · 2026-09-14-pins2-board/index.html:71 |
| letter-spacing | — | `normal` | initial |
| color | `var(--warn)` | `rgb(255, 122, 69)` | .pb-echo.pb-warn · 2026-09-14-pins2-board/index.html:74 |


### `span.pb-fit`

inside `.pb-cards` · 1 on screen · **1 look**

#### the one look

`G8bad-114` · rendered **108×12** · 1 instance look like this · text “5 fit by Sep 20”

```html
<span class="pb-fit">5 fit by Sep 20</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-left | `8px` | `8px` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |
| font | `600 var(--t-sm)/1 var(--data)` | `` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |
| font-size | `` | `12px` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |
| font-weight | `` | `600` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |
| font-style | `` | `normal` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |
| font-variant-numeric | `` | `normal` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |
| line-height | `` | `12px` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |
| color | `var(--warn)` | `rgb(255, 122, 69)` | .pb-fit · 2026-09-14-pins2-board/index.html:310 |
