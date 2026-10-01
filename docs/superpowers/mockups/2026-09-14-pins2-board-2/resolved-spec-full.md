---
kind: reference
status: live
---

> 🔴 **THIS SUPERSEDES `resolved-spec.md` FOR VALUES — generated 2026-09-21 10:34 EDT** by board 3's enumerating extractor (`BOARD=2 node ../2026-09-15-pins2-board-3/3e/extract-spec.cjs '' <this file>`, kit server on :8900). `resolved-spec.md` came from a CURATED selector list: first match only, no `:focus-visible`/`:active`, no markup, no inherited provenance, logical properties (`padding-inline`) invisible. This walks every element in every gate and every reachable state. `resolved-spec.md` is kept because plan §10.4 and the port sheets cite it by line number. The board renders on the stylesheet he APPROVED it on (`../2026-09-14-pins2-board/app.css`, from the published artifact), not the live portal build.

# Pins-2 design board 2 (G4 · G6 · G11 · G3 · G1) — resolved values

*Generated 2026-09-21T14:34:22.876Z by `extract-spec.cjs` from http://127.0.0.1:8900/docs/superpowers/mockups/2026-09-14-pins2-board-2/index.html at 1282×888, fresh profile. 289 looks specced across 138 signatures. Page errors: 0. Classed signatures rendered in a stage that no pass reached: **0**. Winning declarations the computed value contradicts: **8** (marked ⚠️).*

**How to read a table.** *winning declaration* is the text Chrome applied for that property name, in cascade order with `!important` honoured; *computed* is what it resolved to; *from* is the selector and `file:line` in the kit. ↑ means nothing on the element declares it and the value is inherited from the named ancestor rule. ⚠️ means a DIFFERENT property name overrode it later — a shorthand beaten by a longhand or the reverse (`padding` against `padding-inline`) — and **the computed column is the truth**. A user-agent row is kept only where it sets something other than a default.

## Tokens as resolved on `:root`

Every custom property the kit's four stylesheets read. **Scope** says where it is set: `:root` means a global token; `component` means a rule sets it on an element (read its value in that element's table); `JS` means only `b3/state.js` stamps it at runtime, so it does not exist in any stylesheet and must become a real token or a literal when ported.

| token | value on :root | scope |
|---|---|---|
| `--av-src` | — | fallback only |
| `--avatar-a` | `#3A4C5A` | :root |
| `--c` | — | component |
| `--ci` | — | fallback only |
| `--ci-bg` | — | component |
| `--colsc` | — | component |
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
| `--gc` | — | component |
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
| `--k` | — | component |
| `--lc` | — | component |
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
| `--pb-inset` | `5px` | :root |
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
| `--rowcols` | — | component |
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
| `--sl` | — | component |
| `--sl-` | — | fallback only |
| `--slotcols` | — | component |
| `--staged` | `#D8F24A` | :root |
| `--stem` | — | component |
| `--sunk` | `#0B0F12` | :root |
| `--sv` | — | component |
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


## G4 · Armory manifest — resting


### G4 stage

68 distinct signatures on screen; 68 not already specced above.


### `div.pb-head`

inside `.pb-gate` · 1 on screen · **1 look**

#### the one look

`G4-1` · rendered **1148×53** · 1 instance look like this

```html
<div class="pb-head"><span class="pb-gid">G4</span><div><h2>Armory manifest</h2><p>Weapon groups. Hover a build, tick one, …</p></div> <div class="pb-ctl"> <div class="seg pb-seg pb-mode" data-seg="mode" data-v="MP"><span class="pb-thumb" style="width: 50px; transform: translateX(3px);"></span><button data-v="MP" aria-pressed="true">MP</button><button data-v="DMZ" aria-pressed="false">DMZ</button></div> </div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-head · 2026-09-14-pins2-board-2/index.html:12 |
| grid-template-columns | `auto minmax(0px, 1fr) auto` | `52.1562px 942.625px 117.219px` | .pb-head · 2026-09-14-pins2-board-2/index.html:12 |
| column-gap | `18px` | `18px` | .pb-head · 2026-09-14-pins2-board-2/index.html:12 |
| align-items | `end` | `end` | .pb-head · 2026-09-14-pins2-board-2/index.html:12 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-bottom | `4px` | `4px` | .pb-head · 2026-09-14-pins2-board-2/index.html:12 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-gid`

inside `.pb-head` · 1 on screen · **1 look**

#### the one look

`G4-2` · rendered **52×48** · 1 instance look like this · text “G4”

```html
<span class="pb-gid">G4</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 60px/.8 var(--display)` | `` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-family | `` | `"Big Shoulders Display", "Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-size | `` | `60px` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-weight | `` | `700` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-style | `` | `normal` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-variant-numeric | `` | `normal` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| line-height | `` | `48px` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| letter-spacing | — | `normal` | initial |
| color | `var(--realm-c)` | `rgb(239, 68, 68)` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |


### `div`

inside `.pb-head` · 1 on screen · **1 look**

#### the one look

`G4-3` · rendered **943×49** · 1 instance look like this

```html
<div><h2>Armory manifest</h2><p>Weapon groups. Hover a build, tick one, …</p></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `p`

inside `.—` · 1 on screen · **1 look**

#### the one look

`G4-4` · rendered **943×19** · 1 instance look like this · text “Weapon groups. Hover a build, tick one, copy a c”

```html
<p>Weapon groups. Hover a build, tick one, …</p>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | p · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0` | `` | .pb-head p · 2026-09-14-pins2-board-2/index.html:15 |
| margin-top | `0px` | `0px` | .pb-head p · 2026-09-14-pins2-board-2/index.html:15 |
| margin-right | `0px` | `0px` | .pb-head p · 2026-09-14-pins2-board-2/index.html:15 |
| margin-bottom | `0px` | `0px` | .pb-head p · 2026-09-14-pins2-board-2/index.html:15 |
| margin-left | `0px` | `0px` | .pb-head p · 2026-09-14-pins2-board-2/index.html:15 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-base)` | `13px` | .pb-head p · 2026-09-14-pins2-board-2/index.html:15 |
| font-weight | — | `400` | initial |
| line-height | ⚠️ `1.45` | `18.85px` | .pb-head p · 2026-09-14-pins2-board-2/index.html:15 · **a later rule wins — port the computed value and find that rule** |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-head p · 2026-09-14-pins2-board-2/index.html:15 |


### `div.pb-ctl`

inside `.pb-head` · 1 on screen · **1 look**

#### the one look

`G4-5` · rendered **117×42** · 1 instance look like this

```html
<div class="pb-ctl"> <div class="seg pb-seg pb-mode" data-seg="mode" data-v="MP"><span class="pb-thumb" style="width: 50px; transform: translateX(3px);"></span><button data-v="MP" aria-pressed="true">MP</button><button data-v="DMZ" aria-pressed="false">DMZ</button></div> </div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-ctl · 2026-09-14-pins2-board-2/index.html:16 |
| gap | `8px` | `` | .pb-ctl · 2026-09-14-pins2-board-2/index.html:16 |
| column-gap | `8px` | `8px` | .pb-ctl · 2026-09-14-pins2-board-2/index.html:16 |
| row-gap | `8px` | `8px` | .pb-ctl · 2026-09-14-pins2-board-2/index.html:16 |
| align-items | `center` | `center` | .pb-ctl · 2026-09-14-pins2-board-2/index.html:16 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-mode.pb-seg.seg`

inside `.pb-ctl` · 1 on screen · **1 look**

#### the one look

`G4-6` · rendered **117×42** · 1 instance look like this

```html
<div class="seg pb-seg pb-mode" data-seg="mode" data-v="MP"><span class="pb-thumb" style="width: 50px; transform: translateX(3px);"></span><button data-v="MP" aria-pressed="true">MP</button><button data-v="DMZ" aria-pressed="false">DMZ</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-seg.seg · 2026-09-14-pins2-board-2/index.html:17 |
| position | `relative` | `relative` | .pb-seg.seg · 2026-09-14-pins2-board-2/index.html:17 |
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
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-thumb`

inside `.seg` · 2 on screen · **2 looks**

#### look 1 of 2

`G4-7` · rendered **50×34** · 1 instance look like this

```html
<span class="pb-thumb" style="width: 50px; transform: translateX(3px);"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| width | `50px` | `50px` | style attribute |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| bottom | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| left | `0px` | `0px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| border-radius | `var(--rad-pill)` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| background | `var(--mode-mp)` | `` | .pb-seg.pb-mode .pb-thumb · 2026-09-14-pins2-board-2/index.html:23 |
| background-color | `` | `rgb(255, 52, 48)` | .pb-seg.pb-mode .pb-thumb · 2026-09-14-pins2-board-2/index.html:23 |
| background-image | `` | `none` | .pb-seg.pb-mode .pb-thumb · 2026-09-14-pins2-board-2/index.html:23 |
| box-shadow | `none` | `none` | .pb-seg.pb-mode .pb-thumb · 2026-09-14-pins2-board-2/index.html:23 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| transform | `translateX(3px)` | `matrix(1, 0, 0, 1, 3, 0)` | style attribute |
| transition | `transform .26s cubic-bezier(.3,.7,.2,1),width .26s cubic-bezier(.3,.7,.2,1)` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |

#### look 2 of 2

`G4-41` · rendered **49×34** · 1 instance look like this

```html
<span class="pb-thumb" style="width: 49px; transform: translateX(3px);"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| width | `49px` | `49px` | style attribute |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| bottom | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| left | `0px` | `0px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| border-radius | `var(--rad-pill)` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| background | `var(--hi)` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| background-color | `` | `rgb(35, 44, 52)` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| background-image | `` | `none` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| transform | `translateX(3px)` | `matrix(1, 0, 0, 1, 3, 0)` | style attribute |
| transition | `transform .26s cubic-bezier(.3,.7,.2,1),width .26s cubic-bezier(.3,.7,.2,1)` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |


### `div.pb-man`

inside `.pb-gate` · 1 on screen · **1 look**

#### the one look

`G4-8` · rendered **1148×1770** · 1 instance look like this

```html
<div class="pb-man" id="g4man" data-fm="edge" data-av="tag"><div class="pb-tools"><div class="pb-t1"><span class="pb-lab">Manifest</span><label class="pb-srch">⟨svg.ic.⟩<input placeholder="Search builds" aria-label="Search builds"></label><button class="chip go pb-add">⟨svg.ic.⟩Add build</button></div><div class="pb-t2"><span class="pb-grp"><span class="pb-lab">Category</span><button class="chip" data-cat="ALL" aria-
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| width | `1148px` | `1148px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| min-width | `1148px` | `1148px` | .pb-gate > .pb-man, .pb-gate > .pb-vb, .pb-gate > .pb-g1, .pb-gate > .pb-g6, .pb-gate > .p · 2026-09-14-pins2-board-2/index.html:464 |
| max-width | `100%` | `100%` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| box-sizing | `border-box` | `border-box` | .pb-gate > .pb-man, .pb-gate > .pb-vb, .pb-gate > .pb-g1, .pb-gate > .pb-g6, .pb-gate > .p · 2026-09-14-pins2-board-2/index.html:464 |
| margin | `0 auto` | `` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| margin-top | `0px` | `0px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| margin-right | `auto` | `0px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| margin-bottom | `0px` | `0px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| margin-left | `auto` | `0px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| border-radius | `var(--rad-3)` | `` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| background | `var(--paper)` | `` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| background-color | `` | `rgb(23, 30, 36)` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| background-image | `` | `none` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| overflow-x | `hidden` | `hidden` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| overflow-y | `hidden` | `hidden` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |


### `div.pb-tools`

inside `.pb-man` · 1 on screen · **1 look**

#### the one look

`G4-9` · rendered **1148×132** · 1 instance look like this

```html
<div class="pb-tools"><div class="pb-t1"><span class="pb-lab">Manifest</span><label class="pb-srch">⟨svg.ic.⟩<input placeholder="Search builds" aria-label="Search builds"></label><button class="chip go pb-add">⟨svg.ic.⟩Add build</button></div><div class="pb-t2"><span class="pb-grp"><span class="pb-lab">Category</span><button class="chip" data-cat="ALL" aria-pressed="true">All</button><button class="chip topic" data-c
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| gap | `12px` | `` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| column-gap | `12px` | `12px` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| row-gap | `12px` | `12px` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `14px 16px` | `` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| padding-top | `14px` | `14px` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| padding-right | `16px` | `16px` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| padding-bottom | `14px` | `14px` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| padding-left | `16px` | `16px` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| border-bottom | `1px solid var(--rule)` | `` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-t1`

inside `.pb-tools` · 1 on screen · **1 look**

#### the one look

`G4-10` · rendered **1116×49** · 1 instance look like this

```html
<div class="pb-t1"><span class="pb-lab">Manifest</span><label class="pb-srch">⟨svg.ic.⟩<input placeholder="Search builds" aria-label="Search builds"></label><button class="chip go pb-add">⟨svg.ic.⟩Add build</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-t1, .pb-t2 · 2026-09-14-pins2-board-2/index.html:37 |
| gap | `12px` | `` | .pb-t1 · 2026-09-14-pins2-board-2/index.html:512 |
| column-gap | `12px` | `12px` | .pb-t1 · 2026-09-14-pins2-board-2/index.html:512 |
| row-gap | `12px` | `12px` | .pb-t1 · 2026-09-14-pins2-board-2/index.html:512 |
| align-items | `center` | `center` | .pb-t1, .pb-t2 · 2026-09-14-pins2-board-2/index.html:37 |
| min-width | `0px` | `0px` | .pb-t1, .pb-t2 · 2026-09-14-pins2-board-2/index.html:37 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-lab`

inside `.pb-t1` · 3 on screen · **1 look**

#### the one look

`G4-11` · rendered **84×10** · 3 instances look like this · text “Manifest”

```html
<span class="pb-lab">Manifest</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| min-width | `84px` | `84px` | .pb-t1 > .pb-lab, .pb-t2 > .pb-grp:first-child > .pb-lab · 2026-09-14-pins2-board-2/index.html:515 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-micro)/1 var(--data)` | `` | .pb-lab · 2026-09-14-pins2-board-2/index.html:41 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-lab · 2026-09-14-pins2-board-2/index.html:41 |
| font-size | `` | `9.5px` | .pb-lab · 2026-09-14-pins2-board-2/index.html:41 |
| font-weight | `` | `600` | .pb-lab · 2026-09-14-pins2-board-2/index.html:41 |
| font-style | `` | `normal` | .pb-lab · 2026-09-14-pins2-board-2/index.html:41 |
| font-variant-numeric | `` | `normal` | .pb-lab · 2026-09-14-pins2-board-2/index.html:41 |
| line-height | `` | `9.5px` | .pb-lab · 2026-09-14-pins2-board-2/index.html:41 |
| letter-spacing | `0.16em` | `1.52px` | .pb-lab · 2026-09-14-pins2-board-2/index.html:41 |
| text-transform | `uppercase` | `uppercase` | .pb-lab · 2026-09-14-pins2-board-2/index.html:41 |
| text-align | `right` | `right` | .pb-t1 > .pb-lab, .pb-t2 > .pb-grp:first-child > .pb-lab · 2026-09-14-pins2-board-2/index.html:515 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-lab · 2026-09-14-pins2-board-2/index.html:41 |


### `label.pb-srch`

inside `.pb-t1` · 1 on screen · **1 look**

#### the one look

`G4-12` · rendered **340×44** · 1 instance look like this

```html
<label class="pb-srch">⟨svg.ic.⟩<input placeholder="Search builds" aria-label="Search builds"></label>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-srch · 2026-09-14-pins2-board-2/index.html:43 |
| position | `relative` | `relative` | .pb-srch · 2026-09-14-pins2-board-2/index.html:43 |
| align-items | `center` | `center` | .pb-srch · 2026-09-14-pins2-board-2/index.html:43 |
| width | `340px` | `340px` | .pb-srch · 2026-09-14-pins2-board-2/index.html:43 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-bottom | `5px` | `5px` | label · 2026-09-14-pins2-board/app.css:648 |
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


### `svg.ic`

inside `.pb-srch` · 87 on screen · **9 looks**

#### look 1 of 9

`G4-13` · rendered **16×16** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-search"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| position | `absolute` | `absolute` | .pb-srch .ic · 2026-09-14-pins2-board-2/index.html:45 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `16px` | `16px` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| height | `16px` | `16px` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| left | `14px` | `14px` | .pb-srch .ic · 2026-09-14-pins2-board-2/index.html:45 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · label · 2026-09-14-pins2-board/app.css:648 |
| font-weight | ↑ `600` | `600` | inherited · label · 2026-09-14-pins2-board/app.css:648 |
| line-height | ↑ `1.5` | `18px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-srch .ic · 2026-09-14-pins2-board-2/index.html:45 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `default` | `default` | inherited · label · user-agent:? |

#### look 2 of 9

`G4-15` · rendered **16×16** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-plus"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `16px` | `16px` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| height | `16px` | `16px` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
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
| color | ↑ `var(--staged)` | `rgb(216, 242, 74)` | inherited · .chip.go · 2026-09-14-pins2-board/app.css:2295 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| pointer-events | `none` | `none` | button .ic, a .ic · 2026-09-14-pins2-board/app.css:6172 |

#### look 3 of 9

`G4-46` · rendered **13×13** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-up"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `13px` | `13px` | .pb-sort .ic · 2026-09-14-pins2-board-2/index.html:58 |
| height | `13px` | `13px` | .pb-sort .ic · 2026-09-14-pins2-board-2/index.html:58 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `inherit` | `` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-family | ↑ `inherit` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-size | ↑ `inherit` | `9.5px` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-weight | ↑ `inherit` | `600` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-style | ↑ `inherit` | `normal` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| line-height | ↑ `inherit` | `9.5px` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| letter-spacing | ↑ `inherit` | `1.33px` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| text-transform | ↑ `inherit` | `uppercase` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · .pb-sort:hover, .pb-sort[aria-sort="ascending"], .pb-sort[aria-sort="descending"] · 2026-09-14-pins2-board-2/index.html:57 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| pointer-events | `none` | `none` | button .ic, a .ic · 2026-09-14-pins2-board/app.css:6172 |

#### look 4 of 9

`G4-48` · rendered **16×16** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-fold"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `16px` | `16px` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| height | `16px` | `16px` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `600 var(--t-sm)/1 var(--ui)` | `` | inherited · .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| font-size | ↑ `` | `12px` | inherited · .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| font-weight | ↑ `` | `600` | inherited · .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| font-style | ↑ `` | `normal` | inherited · .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| line-height | ↑ `` | `12px` | inherited · .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| letter-spacing | ↑ `0px` | `normal` | inherited · .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| text-transform | ↑ `none` | `none` | inherited · .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| pointer-events | `none` | `none` | button .ic, a .ic · 2026-09-14-pins2-board/app.css:6172 |

#### look 5 of 9

`G4-62` · rendered **14×14** · 7 instances look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-alert"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `14px` | `14px` | .pb-fsum > .ic · 2026-09-14-pins2-board-2/index.html:297 |
| height | `14px` | `14px` | .pb-fsum > .ic · 2026-09-14-pins2-board-2/index.html:297 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `600 var(--t-sm)/1 var(--ui)` | `` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:496 |
| font-weight | ↑ `` | `600` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| font-style | ↑ `` | `normal` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| line-height | ↑ `1` | `12px` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:496 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | ↑ `nowrap` | `` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| color | ↑ `var(--warn-ink)` | `rgb(255, 158, 114)` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:394 |
| pointer-events | `none` | `none` | button .ic, a .ic · 2026-09-14-pins2-board/app.css:6172 |

#### look 6 of 9

`G4-70` · rendered **16×16** · 44 instances look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-fold"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `16px` | `16px` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| height | `16px` | `16px` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
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
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .pb-fbtn · 2026-09-14-pins2-board-2/index.html:390 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-fbtn · 2026-09-14-pins2-board-2/index.html:390 |
| pointer-events | `none` | `none` | button .ic, a .ic · 2026-09-14-pins2-board/app.css:6172 |

*3 further looks are the same component in other data hues (a per-row `--c` / `--m` / `--sl`); they differ in colour only.*


### `button.chip.go.pb-add`

inside `.pb-t1` · 1 on screen · **1 look**

#### the one look

`G4-14` · rendered **117×44** · 1 instance look like this

```html
<button class="chip go pb-add">⟨svg.ic.⟩Add build</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-add.chip · 2026-09-14-pins2-board-2/index.html:47 |
| gap | `8px` | `` | .pb-add.chip · 2026-09-14-pins2-board-2/index.html:47 |
| column-gap | `8px` | `8px` | .pb-add.chip · 2026-09-14-pins2-board-2/index.html:47 |
| row-gap | `8px` | `8px` | .pb-add.chip · 2026-09-14-pins2-board-2/index.html:47 |
| align-items | `center` | `center` | .pb-add.chip · 2026-09-14-pins2-board-2/index.html:47 |
| justify-content | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| min-height | `var(--tap)` | `44px` | .pb-add.chip · 2026-09-14-pins2-board-2/index.html:47 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `0 18px` | `` | .pb-add.chip · 2026-09-14-pins2-board-2/index.html:47 |
| padding-top | `0px` | `0px` | .pb-add.chip · 2026-09-14-pins2-board-2/index.html:47 |
| padding-right | `18px` | `18px` | .pb-add.chip · 2026-09-14-pins2-board-2/index.html:47 |
| padding-bottom | `0px` | `0px` | .pb-add.chip · 2026-09-14-pins2-board-2/index.html:47 |
| padding-left | `18px` | `18px` | .pb-add.chip · 2026-09-14-pins2-board-2/index.html:47 |
| margin-left | `auto` | `551.016px` | .pb-add.chip · 2026-09-14-pins2-board-2/index.html:47 |
| border | `1px solid var(--rule2)` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| border-color | `var(--staged)` | `` | .chip.go · 2026-09-14-pins2-board/app.css:2295 |
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
| color | `var(--staged)` | `rgb(216, 242, 74)` | .chip.go · 2026-09-14-pins2-board/app.css:2295 |
| transition | `background .16s ease,color .16s ease` | `` | .chip.go · 2026-09-14-pins2-board/app.css:2295 |
| cursor | `pointer` | `pointer` | button · 2026-09-14-pins2-board/app.css:600 |

**:hover** — changes; parts inside it respond (table below)

| property | at rest | hover |
|---|---|---|
| background-color | `rgb(11, 15, 18)` | `rgb(216, 242, 74)` |
| color | `rgb(216, 242, 74)` | `rgb(7, 9, 10)` |
| transform | `none` | `matrix(1, 0, 0, 1, 0, -1)` |

| part inside | property | at rest | hover |
|---|---|---|---|
| ::before | color | `rgb(216, 242, 74)` | `rgb(7, 9, 10)` |
| ::before | border-color | `rgb(216, 242, 74)` | `rgb(7, 9, 10)` |
| ::before | outline-color | `rgb(216, 242, 74)` | `rgb(7, 9, 10)` |
| ::after | color | `rgb(216, 242, 74)` | `rgb(7, 9, 10)` |
| ::after | border-color | `rgb(216, 242, 74)` | `rgb(7, 9, 10)` |
| ::after | outline-color | `rgb(216, 242, 74)` | `rgb(7, 9, 10)` |
| svg.ic | color | `rgb(216, 242, 74)` | `rgb(7, 9, 10)` |
| svg.ic | border-color | `rgb(216, 242, 74)` | `rgb(7, 9, 10)` |
| svg.ic | outline-color | `rgb(216, 242, 74)` | `rgb(7, 9, 10)` |
| svg.ic | stroke | `rgb(216, 242, 74)` | `rgb(7, 9, 10)` |
| use | color | `rgb(216, 242, 74)` | `rgb(7, 9, 10)` |
| use | border-color | `rgb(216, 242, 74)` | `rgb(7, 9, 10)` |
| use | outline-color | `rgb(216, 242, 74)` | `rgb(7, 9, 10)` |
| use | stroke | `rgb(216, 242, 74)` | `rgb(7, 9, 10)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `div.pb-t2`

inside `.pb-tools` · 1 on screen · **1 look**

#### the one look

`G4-16` · rendered **1116×42** · 1 instance look like this

```html
<div class="pb-t2"><span class="pb-grp"><span class="pb-lab">Category</span><button class="chip" data-cat="ALL" aria-pressed="true">All</button><button class="chip topic" data-cat="AR" style="--c:var(--ar)" aria-pressed="false"><i></i>Assault <em>7</em></button><button class="chip topic" data-cat="SMG" style="--c:var(--smg)" aria-pressed="false"><i></i>SMG <em>2</em></button><button class="chip topic" data-cat="LMG" 
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-t1, .pb-t2 · 2026-09-14-pins2-board-2/index.html:37 |
| gap | `10px` | `` | .pb-t1, .pb-t2 · 2026-09-14-pins2-board-2/index.html:37 |
| column-gap | `10px` | `10px` | .pb-t1, .pb-t2 · 2026-09-14-pins2-board-2/index.html:37 |
| row-gap | `10px` | `10px` | .pb-t2 · 2026-09-14-pins2-board-2/index.html:38 |
| flex-wrap | `wrap` | `wrap` | .pb-t2 · 2026-09-14-pins2-board-2/index.html:38 |
| align-items | `center` | `center` | .pb-t1, .pb-t2 · 2026-09-14-pins2-board-2/index.html:37 |
| min-width | `0px` | `0px` | .pb-t1, .pb-t2 · 2026-09-14-pins2-board-2/index.html:37 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-grp`

inside `.pb-t2` · 2 on screen · **2 looks**

#### look 1 of 2

`G4-17` · rendered **774×32** · 1 instance look like this

```html
<span class="pb-grp"><span class="pb-lab">Category</span><button class="chip" data-cat="ALL" aria-pressed="true">All</button><button class="chip topic" data-cat="AR" style="--c:var(--ar)" aria-pressed="false"><i></i>Assault <em>7</em></button><button class="chip topic" data-cat="SMG" style="--c:var(--smg)" aria-pressed="false"><i></i>SMG <em>2</em></button><button class="chip topic" data-cat="LMG" style="--c:var(--lm
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-grp · 2026-09-14-pins2-board-2/index.html:39 |
| gap | `8px` | `` | .pb-grp · 2026-09-14-pins2-board-2/index.html:513 |
| column-gap | `8px` | `8px` | .pb-grp · 2026-09-14-pins2-board-2/index.html:513 |
| row-gap | `8px` | `8px` | .pb-grp · 2026-09-14-pins2-board-2/index.html:513 |
| align-items | `center` | `center` | .pb-grp · 2026-09-14-pins2-board-2/index.html:39 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G4-38` · rendered **235×42** · 1 instance look like this

```html
<span class="pb-grp"><span class="pb-lab">Attachments</span><span class="seg pb-seg" data-seg="att"><span class="pb-thumb" style="width: 49px; transform: translateX(3px);"></span><button data-v="list" aria-pressed="true">List</button><button data-v="slots" aria-pressed="false">By slot</button></span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-grp · 2026-09-14-pins2-board-2/index.html:39 |
| gap | `8px` | `` | .pb-grp · 2026-09-14-pins2-board-2/index.html:513 |
| column-gap | `8px` | `8px` | .pb-grp · 2026-09-14-pins2-board-2/index.html:513 |
| row-gap | `8px` | `8px` | .pb-grp · 2026-09-14-pins2-board-2/index.html:513 |
| align-items | `center` | `center` | .pb-grp · 2026-09-14-pins2-board-2/index.html:39 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-left | `16px` | `16px` | .pb-grp + .pb-grp · 2026-09-14-pins2-board-2/index.html:517 |
| margin-left | `6px` | `6px` | .pb-grp + .pb-grp · 2026-09-14-pins2-board-2/index.html:549 |
| box-shadow | `inset 1px 0 0 var(--rule2)` | `rgb(58, 71, 82) 1px 0px 0px 0px inset` | .pb-grp + .pb-grp · 2026-09-14-pins2-board-2/index.html:40 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `button.chip`

inside `.pb-grp` · 1 on screen · **1 look**

#### the one look

`G4-19` · rendered **38×32** · 1 instance look like this · text “All” · aria-pressed="true"

```html
<button class="chip" data-cat="ALL" aria-pressed="true">All</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .chip · 2026-09-14-pins2-board/app.css:938 |
| flex | `none` | `` | .pb-t2 .chip · 2026-09-14-pins2-board-2/index.html:48 |
| align-items | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| justify-content | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| min-height | `32px` | `32px` | .pb-t2 .chip · 2026-09-14-pins2-board-2/index.html:48 |
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


### `button.chip.topic`

inside `.pb-grp` · 6 on screen · **1 look**

#### the one look

`G4-20` · rendered **100×32** · 6 instances look like this · aria-pressed="false"

```html
<button class="chip topic" data-cat="AR" style="--c:var(--ar)" aria-pressed="false"><i></i>Assault <em>7</em></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .chip.topic · 2026-09-14-pins2-board/app.css:2040 |
| gap | `7px` | `` | .chip.topic · 2026-09-14-pins2-board/app.css:2040 |
| column-gap | `7px` | `7px` | .chip.topic · 2026-09-14-pins2-board/app.css:2040 |
| row-gap | `7px` | `7px` | .chip.topic · 2026-09-14-pins2-board/app.css:2040 |
| flex | `none` | `` | .pb-t2 .chip · 2026-09-14-pins2-board-2/index.html:48 |
| align-items | `center` | `center` | .chip.topic · 2026-09-14-pins2-board/app.css:2040 |
| justify-content | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| min-height | `32px` | `32px` | .pb-t2 .chip · 2026-09-14-pins2-board-2/index.html:48 |
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
| background-color | `rgb(11, 15, 18)` | `color(srgb 1 0.231373 0.360784 / 0.09)` |
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
| i | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| i | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| i | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `i`

inside `.chip` · 16 on screen · **8 looks**

#### look 1 of 8

`G4-21` · rendered **8×8** · 1 instance look like this

```html
<i></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| width | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| height | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background | `var(--c)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-color | `` | `rgb(255, 59, 92)` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-image | `` | `none` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-shadow | `0 0 0 1px var(--scrim-40)` | `rgba(0, 0, 0, 0.4) 0px 0px 0px 1px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | ↑ `600` | `600` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `18px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · 2026-09-14-pins2-board/app.css:600 |

#### look 2 of 8

`G4-24` · rendered **8×8** · 1 instance look like this

```html
<i></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| width | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| height | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background | `var(--c)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-color | `` | `rgb(255, 210, 63)` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-image | `` | `none` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-shadow | `0 0 0 1px var(--scrim-40)` | `rgba(0, 0, 0, 0.4) 0px 0px 0px 1px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | ↑ `600` | `600` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `18px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · 2026-09-14-pins2-board/app.css:600 |

#### look 3 of 8

`G4-27` · rendered **8×8** · 1 instance look like this

```html
<i></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| width | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| height | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background | `var(--c)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-color | `` | `rgb(132, 94, 194)` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-image | `` | `none` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-shadow | `0 0 0 1px var(--scrim-40)` | `rgba(0, 0, 0, 0.4) 0px 0px 0px 1px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | ↑ `600` | `600` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `18px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · 2026-09-14-pins2-board/app.css:600 |

#### look 4 of 8

`G4-30` · rendered **8×8** · 1 instance look like this

```html
<i></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| width | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| height | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background | `var(--c)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-color | `` | `rgb(67, 97, 238)` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-image | `` | `none` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-shadow | `0 0 0 1px var(--scrim-40)` | `rgba(0, 0, 0, 0.4) 0px 0px 0px 1px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | ↑ `600` | `600` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `18px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · 2026-09-14-pins2-board/app.css:600 |

#### look 5 of 8

`G4-33` · rendered **8×8** · 1 instance look like this

```html
<i></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| width | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| height | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background | `var(--c)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-color | `` | `rgb(246, 169, 59)` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-image | `` | `none` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-shadow | `0 0 0 1px var(--scrim-40)` | `rgba(0, 0, 0, 0.4) 0px 0px 0px 1px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | ↑ `600` | `600` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `18px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · 2026-09-14-pins2-board/app.css:600 |

#### look 6 of 8

`G4-36` · rendered **8×8** · 1 instance look like this

```html
<i></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| width | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| height | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background | `var(--c)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-color | `` | `rgb(62, 110, 142)` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-image | `` | `none` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-shadow | `0 0 0 1px var(--scrim-40)` | `rgba(0, 0, 0, 0.4) 0px 0px 0px 1px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | ↑ `600` | `600` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `18px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · 2026-09-14-pins2-board/app.css:600 |

*2 further looks are the same component in other data hues (a per-row `--c` / `--m` / `--sl`); they differ in colour only.*


### `em`

inside `.chip` · 6 on screen · **1 look**

#### the one look

`G4-22` · rendered **6×14** · 6 instances look like this · text “7”

```html
<em>7</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-left | `5px` | `5px` | .chip.topic em · 2026-09-14-pins2-board/app.css:3681 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `var(--data)` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .chip.topic em · 2026-09-14-pins2-board/app.css:3681 |
| font-size | `var(--t-micro)` | `9.5px` | .chip.topic em · 2026-09-14-pins2-board/app.css:3681 |
| font-weight | ↑ `600` | `600` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `normal` | `normal` | .chip.topic em · 2026-09-14-pins2-board/app.css:3681 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `14.25px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .chip.topic em · 2026-09-14-pins2-board/app.css:3681 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · 2026-09-14-pins2-board/app.css:600 |


### `span.pb-seg.seg`

inside `.pb-grp` · 1 on screen · **1 look**

#### the one look

`G4-40` · rendered **128×42** · 1 instance look like this

```html
<span class="seg pb-seg" data-seg="att"><span class="pb-thumb" style="width: 49px; transform: translateX(3px);"></span><button data-v="list" aria-pressed="true">List</button><button data-v="slots" aria-pressed="false">By slot</button></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-seg.seg · 2026-09-14-pins2-board-2/index.html:17 |
| position | `relative` | `relative` | .pb-seg.seg · 2026-09-14-pins2-board-2/index.html:17 |
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
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-ghead.pb-heads`

inside `.pb-man` · 1 on screen · **1 look**

#### the one look

`G4-42` · rendered **1148×45** · 1 instance look like this

```html
<div class="pb-heads pb-ghead"><span></span><span><button class="pb-sort" data-sort="" aria-sort="ascending">Weapon⟨svg.ic.⟩</button></span><button class="pb-fold" data-collapse-all="shut">⟨svg.ic.⟩Collapse all</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| grid-template-columns | `32px minmax(0px, 1fr) auto` | `32px 938.547px 113.453px` | .pb-heads.pb-ghead · 2026-09-14-pins2-board-2/index.html:570 |
| column-gap | `16px` | `16px` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| align-items | `center` | `center` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| min-height | `44px` | `44px` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px` | `` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| padding-top | `0px` | `0px` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| padding-right | `16px` | `16px` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| padding-bottom | `0px` | `0px` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| padding-left | `16px` | `16px` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| border-bottom | `1px solid var(--rule)` | `` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| background | `var(--sunk)` | `` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| background-image | `` | `none` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font | `600 var(--t-micro)/1 var(--data)` | `` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-size | `` | `9.5px` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-weight | `` | `600` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-style | `` | `normal` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-variant-numeric | `` | `normal` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| line-height | `` | `9.5px` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| letter-spacing | `0.14em` | `1.33px` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| text-transform | `uppercase` | `uppercase` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |


### `span`

inside `.pb-heads` · 105 on screen · **8 looks**

#### look 1 of 8

`G4-43` · rendered **32×0** · 1 instance look like this

```html
<span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-heads > span · 2026-09-14-pins2-board-2/index.html:55 |
| gap | `16px` | `` | .pb-heads > span · 2026-09-14-pins2-board-2/index.html:55 |
| column-gap | `16px` | `16px` | .pb-heads > span · 2026-09-14-pins2-board-2/index.html:55 |
| row-gap | `16px` | `16px` | .pb-heads > span · 2026-09-14-pins2-board-2/index.html:55 |
| align-items | `center` | `center` | .pb-heads > span · 2026-09-14-pins2-board-2/index.html:55 |
| min-width | `0px` | `0px` | .pb-heads > span · 2026-09-14-pins2-board-2/index.html:55 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `600 var(--t-micro)/1 var(--data)` | `` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-size | ↑ `` | `9.5px` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-weight | ↑ `` | `600` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-style | ↑ `` | `normal` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| line-height | ↑ `` | `9.5px` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| letter-spacing | ↑ `0.14em` | `1.33px` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| text-transform | ↑ `uppercase` | `uppercase` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |

#### look 2 of 8

`G4-44` · rendered **939×44** · 1 instance look like this

```html
<span><button class="pb-sort" data-sort="" aria-sort="ascending">Weapon⟨svg.ic.⟩</button></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-heads > span · 2026-09-14-pins2-board-2/index.html:55 |
| gap | `16px` | `` | .pb-heads > span · 2026-09-14-pins2-board-2/index.html:55 |
| column-gap | `16px` | `16px` | .pb-heads > span · 2026-09-14-pins2-board-2/index.html:55 |
| row-gap | `16px` | `16px` | .pb-heads > span · 2026-09-14-pins2-board-2/index.html:55 |
| align-items | `center` | `center` | .pb-heads > span · 2026-09-14-pins2-board-2/index.html:55 |
| min-width | `0px` | `0px` | .pb-heads > span · 2026-09-14-pins2-board-2/index.html:55 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `600 var(--t-micro)/1 var(--data)` | `` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-size | ↑ `` | `9.5px` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-weight | ↑ `` | `600` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-style | ↑ `` | `normal` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| line-height | ↑ `` | `9.5px` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| letter-spacing | ↑ `0.14em` | `1.33px` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| text-transform | ↑ `uppercase` | `uppercase` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |

#### look 3 of 8

`G4-67` · rendered **0×0** · 5 instances look like this

```html
<span><span>Code lists 5 attachments, build has 4</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| gap | `6px` | `` | .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| column-gap | `6px` | `6px` | .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| row-gap | `6px` | `6px` | .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-top | `3px` | `3px` | .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| font | `500 var(--t-sm)/1.3 var(--ui)` | `` | .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| font-size | `` | `12px` | .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| font-weight | `` | `500` | .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| font-style | `` | `normal` | .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| font-variant-numeric | `` | `normal` | .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| line-height | `` | `15.6px` | .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

#### look 4 of 8

`G4-68` · rendered **0×0** · 6 instances look like this · text “Code lists 5 attachments, build has 4”

```html
<span>Code lists 5 attachments, build has 4</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 var(--t-sm)/1.3 var(--ui)` | `` | inherited · .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| font-size | ↑ `` | `12px` | inherited · .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| font-weight | ↑ `` | `500` | inherited · .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| font-style | ↑ `` | `normal` | inherited · .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| line-height | ↑ `` | `15.6px` | inherited · .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| letter-spacing | — | `normal` | initial |
| white-space | ↑ `nowrap` | `` | inherited · .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · .pb-fpr > span · 2026-09-14-pins2-board-2/index.html:401 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

#### look 5 of 8

`G4-78` · rendered **131×12** · 80 instances look like this · text “Monolithic Suppressor”

```html
<span>Monolithic Suppressor</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline` | `block` | #g4man[data-av] .pb-rail > .pb-at > span · 2026-09-14-pins2-board-2/index.html:559 |
| min-width | `0px` | `0px` | .pb-at > span · 2026-09-14-pins2-board-2/index.html:535 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 var(--t-sm)/1 var(--ui)` | `` | inherited · #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-size | ↑ `` | `12px` | inherited · #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-weight | ↑ `` | `500` | inherited · #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-style | ↑ `` | `normal` | inherited · #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-variant-numeric | ↑ `` | `normal` | inherited · #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| line-height | ↑ `` | `12px` | inherited · #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| letter-spacing | — | `normal` | initial |
| text-overflow | `ellipsis` | `ellipsis` | .pb-at > span · 2026-09-14-pins2-board-2/index.html:535 |
| white-space | `nowrap` | `` | #g4man[data-av] .pb-rail > .pb-at > span · 2026-09-14-pins2-board-2/index.html:559 |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| overflow | `visible` | `` | #g4man[data-av] .pb-rail > .pb-at > span · 2026-09-14-pins2-board-2/index.html:559 |
| overflow-x | `visible` | `visible` | #g4man[data-av] .pb-rail > .pb-at > span · 2026-09-14-pins2-board-2/index.html:559 |
| overflow-y | `visible` | `visible` | #g4man[data-av] .pb-rail > .pb-at > span · 2026-09-14-pins2-board-2/index.html:559 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

#### look 6 of 8

`G4-186` · rendered **820×0** · 5 instances look like this

```html
<span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

*2 further looks are the same component in other data hues (a per-row `--c` / `--m` / `--sl`); they differ in colour only.*


### `button.pb-sort`

inside `.—` · 1 on screen · **1 look**

#### the one look

`G4-45` · rendered **60×44** · 1 instance look like this

```html
<button class="pb-sort" data-sort="" aria-sort="ascending">Weapon⟨svg.ic.⟩</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| gap | `5px` | `` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| column-gap | `5px` | `5px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| row-gap | `5px` | `5px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| align-items | `center` | `center` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| min-height | `44px` | `44px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `0` | `` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| padding-top | `0px` | `0px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| padding-right | `0px` | `0px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| padding-bottom | `0px` | `0px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| padding-left | `0px` | `0px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| border | `0` | `` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| border-radius | `var(--ctl-rad, 5px)` | `` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| background | `none` | `` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| background-image | `none` | `none` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font | `inherit` | `` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-family | `inherit` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-size | `inherit` | `9.5px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-weight | `inherit` | `600` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-style | `inherit` | `normal` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-variant-numeric | `inherit` | `normal` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| line-height | `inherit` | `9.5px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| letter-spacing | `inherit` | `1.33px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| text-transform | `inherit` | `uppercase` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-sort:hover, .pb-sort[aria-sort="ascending"], .pb-sort[aria-sort="descending"] · 2026-09-14-pins2-board-2/index.html:57 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `rgba(0, 0, 0, 0)` | `rgb(42, 52, 61)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `button.pb-fold`

inside `.pb-heads` · 1 on screen · **1 look**

#### the one look

`G4-47` · rendered **113×44** · 1 instance look like this

```html
<button class="pb-fold" data-collapse-all="shut">⟨svg.ic.⟩Collapse all</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| position | `relative` | `relative` | .pb-fold · 2026-09-14-pins2-board-2/index.html:460 |
| gap | `8px` | `` | .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| column-gap | `8px` | `8px` | .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| row-gap | `8px` | `8px` | .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| align-items | `center` | `center` | .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| min-height | `var(--tap)` | `44px` | .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `0 12px` | `` | .pb-fold · 2026-09-14-pins2-board-2/index.html:460 |
| padding-top | `0px` | `0px` | .pb-fold · 2026-09-14-pins2-board-2/index.html:460 |
| padding-right | `12px` | `12px` | .pb-fold · 2026-09-14-pins2-board-2/index.html:460 |
| padding-bottom | `0px` | `0px` | .pb-fold · 2026-09-14-pins2-board-2/index.html:460 |
| padding-left | `12px` | `12px` | .pb-fold · 2026-09-14-pins2-board-2/index.html:460 |
| margin-right | `0px` | `0px` | .pb-fold · 2026-09-14-pins2-board-2/index.html:460 |
| border | `0` | `` | .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| border-radius | `var(--rad-2)` | `` | .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| background | `none!important !important` | `` | .pb-fold · 2026-09-14-pins2-board-2/index.html:460 |
| background-color | `initial !important !important` | `rgba(0, 0, 0, 0)` | .pb-fold · 2026-09-14-pins2-board-2/index.html:460 |
| background-image | `none !important !important` | `none` | .pb-fold · 2026-09-14-pins2-board-2/index.html:460 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| font-size | `` | `12px` | .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| font-weight | `` | `600` | .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| font-style | `` | `normal` | .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| font-variant-numeric | `` | `normal` | .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| line-height | `` | `12px` | .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| letter-spacing | `0px` | `normal` | .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| text-transform | `none` | `none` | .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | .pb-fold · 2026-09-14-pins2-board-2/index.html:293 |
| isolation | `isolate` | `isolate` | .pb-fold · 2026-09-14-pins2-board-2/index.html:460 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-fold::before · 2026-09-14-pins2-board-2/index.html:461 |
| inset | `5px 0` | .pb-fold::before · 2026-09-14-pins2-board-2/index.html:461 |
| top | `5px` | .pb-fold::before · 2026-09-14-pins2-board-2/index.html:461 |
| right | `0px` | .pb-fold::before · 2026-09-14-pins2-board-2/index.html:461 |
| bottom | `5px` | .pb-fold::before · 2026-09-14-pins2-board-2/index.html:461 |
| left | `0px` | .pb-fold::before · 2026-09-14-pins2-board-2/index.html:461 |
| border-radius | `8px` | .pb-fold::before · 2026-09-14-pins2-board-2/index.html:461 |
| background | `var(--raised)` | .pb-fold::before · 2026-09-14-pins2-board-2/index.html:461 |
| background-color | `` | .pb-fold::before · 2026-09-14-pins2-board-2/index.html:461 |
| background-image | `` | .pb-fold::before · 2026-09-14-pins2-board-2/index.html:461 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | .pb-fold::before · 2026-09-14-pins2-board-2/index.html:461 |
| content | `""` | .pb-fold::before · 2026-09-14-pins2-board-2/index.html:461 |
| z-index | `-1` | .pb-fold::before · 2026-09-14-pins2-board-2/index.html:461 |

**:hover** — changes; parts inside it respond (table below)

| property | at rest | hover |
|---|---|---|
| color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |

| part inside | property | at rest | hover |
|---|---|---|---|
| ::before | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| ::before | background-color | `rgb(31, 39, 46)` | `rgb(35, 44, 52)` |
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


### `div.pb-scroll`

inside `.pb-man` · 1 on screen · **1 look**

#### the one look

`G4-49` · rendered **1148×1593** · 1 instance look like this

```html
<div class="pb-scroll"><div class="pb-g" data-w=".50 GS" data-collapsed="false" data-mode="MP" data-att="list" style="--c:var(--sec)"> <div class="pb-gh" data-toggle=""><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select every .50 GS build"><span class="cb"></span></button><div class="pb-gline"><b>.50 GS</b><small>Secondaries<em class="pb-nb">2 builds</em></small><span class="pb-g
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `visible` | `` | .pb-scroll · 2026-09-14-pins2-board-2/index.html:59 |
| overflow-x | `visible` | `visible` | .pb-scroll · 2026-09-14-pins2-board-2/index.html:59 |
| overflow-y | `visible` | `visible` | .pb-scroll · 2026-09-14-pins2-board-2/index.html:59 |


### `div.pb-g`

inside `.pb-scroll` · 10 on screen · **7 looks**

#### look 1 of 7

`G4-50` · rendered **1148×190** · 1 instance look like this

```html
<div class="pb-g" data-w=".50 GS" data-collapsed="false" data-mode="MP" data-att="list" style="--c:var(--sec)"> <div class="pb-gh" data-toggle=""><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select every .50 GS build"><span class="cb"></span></button><div class="pb-gline"><b>.50 GS</b><small>Secondaries<em class="pb-nb">2 builds</em></small><span class="pb-gtags"><span class="pb-t
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-bottom | `1px solid var(--rule)` | `` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 7

`G4-129` · rendered **1148×105** · 4 instances look like this

```html
<div class="pb-g" data-w="ARGUS" data-collapsed="false" data-mode="MP" data-att="list" style="--c:var(--sg)"> <div class="pb-gh" data-toggle=""><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select every ARGUS build"><span class="cb"></span></button><div class="pb-gline"><b>ARGUS</b><small>Shotgun<em class="pb-nb">1 build</em></small></div><span class="pb-fwrap"><button class="pb-fs
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-bottom | `1px solid var(--rule)` | `` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 3 of 7

`G4-178` · rendered **1148×223** · 1 instance look like this

```html
<div class="pb-g" data-w="AS VAL" data-collapsed="false" data-mode="MP" data-att="list" style="--c:var(--ar)"> <div class="pb-gh" data-toggle=""><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select every AS VAL build"><span class="cb"></span></button><div class="pb-gline"><b>AS VAL</b><small>Assault<em class="pb-nb">2 builds</em></small></div><span></span><button class="pb-fbtn" da
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-bottom | `1px solid var(--rule)` | `` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 4 of 7

`G4-252` · rendered **1148×346** · 1 instance look like this

```html
<div class="pb-g" data-w="BAL-27" data-collapsed="false" data-mode="MP" data-att="list" style="--c:var(--ar)"> <div class="pb-gh" data-toggle=""><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select every BAL-27 build"><span class="cb"></span></button><div class="pb-gline"><b>BAL-27</b><small>Assault<em class="pb-nb">5 builds</em></small><span class="pb-gtags"><span class="pb-tag" d
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-bottom | `1px solid var(--rule)` | `` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 5 of 7

`G4-462` · rendered **1148×157** · 1 instance look like this

```html
<div class="pb-g" data-w="CROSSBOW" data-collapsed="false" data-mode="MP" data-att="list" style="--c:var(--sec)"> <div class="pb-gh" data-toggle=""><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select every CROSSBOW build"><span class="cb"></span></button><div class="pb-gline"><b>CROSSBOW</b><small>Secondaries<em class="pb-nb">2 builds</em></small><span class="pb-gtags"><span class
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-bottom | `1px solid var(--rule)` | `` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 6 of 7

`G4-626` · rendered **1148×138** · 1 instance look like this

```html
<div class="pb-g" data-w="JAK-12" data-collapsed="false" data-mode="MP" data-att="list" style="--c:var(--sg)"> <div class="pb-gh" data-toggle=""><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select every JAK-12 build"><span class="cb"></span></button><div class="pb-gline"><b>JAK-12</b><small>Shotgun<em class="pb-nb">1 build</em></small><span class="pb-gtags"><span class="pb-tag" da
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-bottom | `1px solid var(--rule)` | `` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

*1 further looks are the same component in other data hues (a per-row `--c` / `--m` / `--sl`); they differ in colour only.*


### `div.pb-gh`

inside `.pb-g` · 10 on screen · **6 looks**

#### look 1 of 6

`G4-51` · rendered **1148×52** · 2 instances look like this

```html
<div class="pb-gh" data-toggle=""><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select every .50 GS build"><span class="cb"></span></button><div class="pb-gline"><b>.50 GS</b><small>Secondaries<em class="pb-nb">2 builds</em></small><span class="pb-gtags"><span class="pb-tag" data-t="top3">TOP 3</span></span></div><span class="pb-fwrap"><button class="pb-fsum" data-fault="" aria-exp
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| position | `relative` | `relative` | .pb-gh · 2026-09-14-pins2-board-2/index.html:85 |
| grid-template-columns | `32px auto minmax(0px, 1fr) auto` | `32px 294.688px 710.312px 39px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:569 |
| column-gap | `12px` | `12px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| align-items | `center` | `center` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| min-height | `52px` | `52px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:295 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px 0 20px` | `` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-top | `0px` | `0px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-right | `16px` | `16px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-bottom | `0px` | `0px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-left | `20px` | `20px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| background | `linear-gradient(90deg,color-mix(in srgb,var(--c) 8%,transparent),transparent 34%),var(--raised)` | `` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| background-image | `` | `linear-gradient(90deg, color(srgb 0.243137 0.431373 0.556863 / 0.08), rgba(0, 0, 0, 0) 34%), none` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | `pointer` | `pointer` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| width | `4px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| top | `0px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| bottom | `0px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| left | `0px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| background | `var(--c)` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| background-color | `` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| background-image | `` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| content | `""` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |

#### look 2 of 6

`G4-130` · rendered **1148×52** · 2 instances look like this

```html
<div class="pb-gh" data-toggle=""><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select every ARGUS build"><span class="cb"></span></button><div class="pb-gline"><b>ARGUS</b><small>Shotgun<em class="pb-nb">1 build</em></small></div><span class="pb-fwrap"><button class="pb-fsum" data-fault="" aria-expanded="false">⟨svg.ic.⟩Fix build<span class="pb-fnos"><i>1</i></span></button><span 
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| position | `relative` | `relative` | .pb-gh · 2026-09-14-pins2-board-2/index.html:85 |
| grid-template-columns | `32px auto minmax(0px, 1fr) auto` | `32px 177.609px 827.391px 39px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:569 |
| column-gap | `12px` | `12px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| align-items | `center` | `center` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| min-height | `52px` | `52px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:295 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px 0 20px` | `` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-top | `0px` | `0px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-right | `16px` | `16px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-bottom | `0px` | `0px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-left | `20px` | `20px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| background | `linear-gradient(90deg,color-mix(in srgb,var(--c) 8%,transparent),transparent 34%),var(--raised)` | `` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| background-image | `` | `linear-gradient(90deg, color(srgb 0.964706 0.662745 0.231373 / 0.08), rgba(0, 0, 0, 0) 34%), none` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | `pointer` | `pointer` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| width | `4px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| top | `0px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| bottom | `0px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| left | `0px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| background | `var(--c)` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| background-color | `` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| background-image | `` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| content | `""` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |

#### look 3 of 6

`G4-179` · rendered **1148×52** · 2 instances look like this

```html
<div class="pb-gh" data-toggle=""><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select every AS VAL build"><span class="cb"></span></button><div class="pb-gline"><b>AS VAL</b><small>Assault<em class="pb-nb">2 builds</em></small></div><span></span><button class="pb-fbtn" data-collapse="" aria-expanded="true" aria-label="Collapse AS VAL">⟨svg.ic.⟩</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| position | `relative` | `relative` | .pb-gh · 2026-09-14-pins2-board-2/index.html:85 |
| grid-template-columns | `32px auto minmax(0px, 1fr) auto` | `32px 185.062px 819.938px 39px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:569 |
| column-gap | `12px` | `12px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| align-items | `center` | `center` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| min-height | `52px` | `52px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:295 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px 0 20px` | `` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-top | `0px` | `0px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-right | `16px` | `16px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-bottom | `0px` | `0px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-left | `20px` | `20px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| background | `linear-gradient(90deg,color-mix(in srgb,var(--c) 8%,transparent),transparent 34%),var(--raised)` | `` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| background-image | `` | `linear-gradient(90deg, color(srgb 1 0.231373 0.360784 / 0.08), rgba(0, 0, 0, 0) 34%), none` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | `pointer` | `pointer` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| width | `4px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| top | `0px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| bottom | `0px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| left | `0px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| background | `var(--c)` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| background-color | `` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| background-image | `` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| content | `""` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |

#### look 4 of 6

`G4-420` · rendered **1148×52** · 1 instance look like this

```html
<div class="pb-gh" data-toggle=""><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select every CHOPPER build"><span class="cb"></span></button><div class="pb-gline"><b>CHOPPER</b><small>LMG<em class="pb-nb">1 build</em></small><span class="pb-gtags"><span class="pb-tag" data-t="top3">TOP 3</span></span></div><span></span><button class="pb-fbtn" data-collapse="" aria-expanded="true" a
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| position | `relative` | `relative` | .pb-gh · 2026-09-14-pins2-board-2/index.html:85 |
| grid-template-columns | `32px auto minmax(0px, 1fr) auto` | `32px 249px 756px 39px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:569 |
| column-gap | `12px` | `12px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| align-items | `center` | `center` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| min-height | `52px` | `52px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:295 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px 0 20px` | `` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-top | `0px` | `0px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-right | `16px` | `16px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-bottom | `0px` | `0px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-left | `20px` | `20px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| background | `linear-gradient(90deg,color-mix(in srgb,var(--c) 8%,transparent),transparent 34%),var(--raised)` | `` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| background-image | `` | `linear-gradient(90deg, color(srgb 0.517647 0.368627 0.760784 / 0.08), rgba(0, 0, 0, 0) 34%), none` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | `pointer` | `pointer` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| width | `4px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| top | `0px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| bottom | `0px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| left | `0px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| background | `var(--c)` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| background-color | `` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| background-image | `` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| content | `""` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |

#### look 5 of 6

`G4-536` · rendered **1148×52** · 1 instance look like this

```html
<div class="pb-gh" data-toggle=""><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select every DL Q33 build"><span class="cb"></span></button><div class="pb-gline"><b>DL Q33</b><small>Sniper<em class="pb-nb">1 build</em></small><span class="pb-gtags"><span class="pb-tag" data-t="top5">TOP 5</span></span></div><span></span><button class="pb-fbtn" data-collapse="" aria-expanded="true" 
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| position | `relative` | `relative` | .pb-gh · 2026-09-14-pins2-board-2/index.html:85 |
| grid-template-columns | `32px auto minmax(0px, 1fr) auto` | `32px 255.422px 749.578px 39px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:569 |
| column-gap | `12px` | `12px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| align-items | `center` | `center` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| min-height | `52px` | `52px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:295 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px 0 20px` | `` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-top | `0px` | `0px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-right | `16px` | `16px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-bottom | `0px` | `0px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-left | `20px` | `20px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| background | `linear-gradient(90deg,color-mix(in srgb,var(--c) 8%,transparent),transparent 34%),var(--raised)` | `` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| background-image | `` | `linear-gradient(90deg, color(srgb 0.262745 0.380392 0.933333 / 0.08), rgba(0, 0, 0, 0) 34%), none` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | `pointer` | `pointer` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| width | `4px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| top | `0px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| bottom | `0px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| left | `0px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| background | `var(--c)` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| background-color | `` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| background-image | `` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| content | `""` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |

#### look 6 of 6

`G4-579` · rendered **1148×52** · 2 instances look like this

```html
<div class="pb-gh" data-toggle=""><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select every FSS Hurricane build"><span class="cb"></span></button><div class="pb-gline"><b>FSS Hurricane</b><small>SMG<em class="pb-nb">1 build</em></small></div><span class="pb-fwrap"><button class="pb-fsum" data-fault="" aria-expanded="false">⟨svg.ic.⟩Fix build<span class="pb-fnos"><i>1</i></span></b
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| position | `relative` | `relative` | .pb-gh · 2026-09-14-pins2-board-2/index.html:85 |
| grid-template-columns | `32px auto minmax(0px, 1fr) auto` | `32px 199.734px 805.266px 39px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:569 |
| column-gap | `12px` | `12px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| align-items | `center` | `center` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| min-height | `52px` | `52px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:295 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px 0 20px` | `` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-top | `0px` | `0px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-right | `16px` | `16px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-bottom | `0px` | `0px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| padding-left | `20px` | `20px` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| background | `linear-gradient(90deg,color-mix(in srgb,var(--c) 8%,transparent),transparent 34%),var(--raised)` | `` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| background-image | `` | `linear-gradient(90deg, color(srgb 1 0.823529 0.247059 / 0.08), rgba(0, 0, 0, 0) 34%), none` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | `pointer` | `pointer` | .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| width | `4px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| top | `0px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| bottom | `0px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| left | `0px` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| background | `var(--c)` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| background-color | `` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| background-image | `` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |
| content | `""` | .pb-gh::before · 2026-09-14-pins2-board-2/index.html:86 |


### `button.pb-cb[role=checkbox]`

inside `.pb-gh` · 27 on screen · **1 look**

#### the one look

`G4-52` · rendered **44×44** · 27 instances look like this · aria-label="Select every .50 GS build" role="checkbox"

```html
<button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select every .50 GS build"><span class="cb"></span></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-cb · 2026-09-14-pins2-board-2/index.html:65 |
| align-items | `center` | `center` | .pb-cb · 2026-09-14-pins2-board-2/index.html:65 |
| place-items | `center` | `` | .pb-cb · 2026-09-14-pins2-board-2/index.html:65 |
| width | `var(--tap)` | `44px` | .pb-cb · 2026-09-14-pins2-board-2/index.html:65 |
| height | `var(--tap)` | `44px` | .pb-cb · 2026-09-14-pins2-board-2/index.html:65 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `0` | `` | .pb-cb · 2026-09-14-pins2-board-2/index.html:65 |
| padding-top | `0px` | `0px` | .pb-cb · 2026-09-14-pins2-board-2/index.html:65 |
| padding-right | `0px` | `0px` | .pb-cb · 2026-09-14-pins2-board-2/index.html:65 |
| padding-bottom | `0px` | `0px` | .pb-cb · 2026-09-14-pins2-board-2/index.html:65 |
| padding-left | `0px` | `0px` | .pb-cb · 2026-09-14-pins2-board-2/index.html:65 |
| margin-left | `-12px` | `-12px` | .pb-cb · 2026-09-14-pins2-board-2/index.html:65 |
| border | `0` | `` | .pb-cb · 2026-09-14-pins2-board-2/index.html:65 |
| border-radius | `var(--ctl-rad, 5px)` | `` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| background | `none` | `` | .pb-cb · 2026-09-14-pins2-board-2/index.html:65 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-cb · 2026-09-14-pins2-board-2/index.html:65 |
| background-image | `none` | `none` | .pb-cb · 2026-09-14-pins2-board-2/index.html:65 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `inherit` | `13px` | button · 2026-09-14-pins2-board/app.css:600 |
| font-weight | `inherit` | `400` | button · 2026-09-14-pins2-board/app.css:600 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `19.5px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `inherit` | `rgb(232, 237, 241)` | button · 2026-09-14-pins2-board/app.css:600 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | .pb-cb · 2026-09-14-pins2-board-2/index.html:65 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `rgba(0, 0, 0, 0)` | `rgb(42, 52, 61)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `span.cb`

inside `.pb-cb` · 27 on screen · **1 look**

#### the one look

`G4-53` · rendered **16×16** · 27 instances look like this

```html
<span class="cb"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .cb · 2026-09-14-pins2-board/app.css:977 |
| position | `relative` | `relative` | .cb · 2026-09-14-pins2-board/app.css:977 |
| width | `16px` | `16px` | .cb · 2026-09-14-pins2-board/app.css:977 |
| height | `16px` | `16px` | .cb · 2026-09-14-pins2-board/app.css:977 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border | `1.5px solid var(--rule2)` | `` | .cb · 2026-09-14-pins2-board/app.css:977 |
| border-radius | `var(--rad-1)` | `` | .cb · 2026-09-14-pins2-board/app.css:977 |
| background | `var(--sunk)` | `` | .cb · 2026-09-14-pins2-board/app.css:977 |
| background-color | `` | `rgb(11, 15, 18)` | .cb · 2026-09-14-pins2-board/app.css:977 |
| background-image | `` | `none` | .cb · 2026-09-14-pins2-board/app.css:977 |
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
| color | ↑ `inherit` | `rgb(232, 237, 241)` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-cb · 2026-09-14-pins2-board-2/index.html:65 |


### `div.pb-gline`

inside `.pb-gh` · 10 on screen · **2 looks**

#### look 1 of 2

`G4-54` · rendered **295×22** · 7 instances look like this

```html
<div class="pb-gline"><b>.50 GS</b><small>Secondaries<em class="pb-nb">2 builds</em></small><span class="pb-gtags"><span class="pb-tag" data-t="top3">TOP 3</span></span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-gline · 2026-09-14-pins2-board-2/index.html:90 |
| gap | `10px` | `` | .pb-gline · 2026-09-14-pins2-board-2/index.html:90 |
| column-gap | `10px` | `10px` | .pb-gline · 2026-09-14-pins2-board-2/index.html:90 |
| row-gap | `10px` | `10px` | .pb-gline · 2026-09-14-pins2-board-2/index.html:90 |
| align-items | `center` | `center` | .pb-gline · 2026-09-14-pins2-board-2/index.html:90 |
| min-width | `0px` | `0px` | .pb-gline · 2026-09-14-pins2-board-2/index.html:90 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

#### look 2 of 2

`G4-133` · rendered **178×15** · 3 instances look like this

```html
<div class="pb-gline"><b>ARGUS</b><small>Shotgun<em class="pb-nb">1 build</em></small></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-gline · 2026-09-14-pins2-board-2/index.html:90 |
| gap | `10px` | `` | .pb-gline · 2026-09-14-pins2-board-2/index.html:90 |
| column-gap | `10px` | `10px` | .pb-gline · 2026-09-14-pins2-board-2/index.html:90 |
| row-gap | `10px` | `10px` | .pb-gline · 2026-09-14-pins2-board-2/index.html:90 |
| align-items | `center` | `center` | .pb-gline · 2026-09-14-pins2-board-2/index.html:90 |
| min-width | `0px` | `0px` | .pb-gline · 2026-09-14-pins2-board-2/index.html:90 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |


### `b`

inside `.pb-gline` · 16 on screen · **3 looks**

#### look 1 of 3

`G4-55` · rendered **45×15** · 10 instances look like this · text “.50 GS”

```html
<b>.50 GS</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-md)/1 var(--ui)` | `` | .pb-gline b · 2026-09-14-pins2-board-2/index.html:91 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-gline b · 2026-09-14-pins2-board-2/index.html:91 |
| font-size | `` | `14.5px` | .pb-gline b · 2026-09-14-pins2-board-2/index.html:91 |
| font-weight | `` | `600` | .pb-gline b · 2026-09-14-pins2-board-2/index.html:91 |
| font-style | `` | `normal` | .pb-gline b · 2026-09-14-pins2-board-2/index.html:91 |
| font-variant-numeric | `` | `normal` | .pb-gline b · 2026-09-14-pins2-board-2/index.html:91 |
| line-height | `` | `14.5px` | .pb-gline b · 2026-09-14-pins2-board-2/index.html:91 |
| letter-spacing | `0.005em` | `0.0725px` | .pb-gline b · 2026-09-14-pins2-board-2/index.html:91 |
| white-space | `nowrap` | `` | .pb-gline b · 2026-09-14-pins2-board-2/index.html:91 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-gline b · 2026-09-14-pins2-board-2/index.html:91 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

#### look 2 of 3

`G4-734` · rendered **54×52** · 2 instances look like this · text “Set name”

```html
<b>Set name</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| font-weight | `600` | `600` | .pb-new li b · 2026-09-14-pins2-board-2/index.html:28 |
| line-height | ↑ `1.45` | `17.4px` | inherited · .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-new li b · 2026-09-14-pins2-board-2/index.html:28 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-new li b · 2026-09-14-pins2-board-2/index.html:28 |

#### look 3 of 3

`G4-738` · rendered **30×35** · 4 instances look like this · text “Code”

```html
<b>Code</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| font-weight | `600` | `600` | .pb-new li b · 2026-09-14-pins2-board-2/index.html:28 |
| line-height | ↑ `1.45` | `17.4px` | inherited · .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-new li b · 2026-09-14-pins2-board-2/index.html:28 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-new li b · 2026-09-14-pins2-board-2/index.html:28 |


### `small`

inside `.pb-gline` · 13 on screen · **8 looks**

#### look 1 of 8

`G4-56` · rendered **157×10** · 2 instances look like this

```html
<small>Secondaries<em class="pb-nb">2 builds</em></small>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 var(--t-micro)/1 var(--data)` | `` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-size | `` | `9.5px` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-weight | `` | `700` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-style | `` | `normal` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-variant-numeric | `` | `normal` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| line-height | `` | `9.5px` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| letter-spacing | `0.16em` | `1.52px` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| text-transform | `uppercase` | `uppercase` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| color | `var(--c)` | `rgb(62, 110, 142)` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

#### look 2 of 8

`G4-135` · rendered **121×10** · 2 instances look like this

```html
<small>Shotgun<em class="pb-nb">1 build</em></small>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 var(--t-micro)/1 var(--data)` | `` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-size | `` | `9.5px` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-weight | `` | `700` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-style | `` | `normal` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-variant-numeric | `` | `normal` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| line-height | `` | `9.5px` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| letter-spacing | `0.16em` | `1.52px` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| text-transform | `uppercase` | `uppercase` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| color | `var(--c)` | `rgb(246, 169, 59)` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

#### look 3 of 8

`G4-184` · rendered **128×10** · 2 instances look like this

```html
<small>Assault<em class="pb-nb">2 builds</em></small>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 var(--t-micro)/1 var(--data)` | `` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-size | `` | `9.5px` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-weight | `` | `700` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-style | `` | `normal` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-variant-numeric | `` | `normal` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| line-height | `` | `9.5px` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| letter-spacing | `0.16em` | `1.52px` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| text-transform | `uppercase` | `uppercase` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| color | `var(--c)` | `rgb(255, 59, 92)` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

#### look 4 of 8

`G4-225` · rendered **72×10** · 2 instances look like this · text “Build name”

```html
<small>Build name</small>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 9.5px/1 var(--data)` | `` | .pb-plate > small · 2026-09-14-pins2-board-2/index.html:424 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-plate > small · 2026-09-14-pins2-board-2/index.html:424 |
| font-size | `` | `9.5px` | .pb-plate > small · 2026-09-14-pins2-board-2/index.html:424 |
| font-weight | `` | `600` | .pb-plate > small · 2026-09-14-pins2-board-2/index.html:424 |
| font-style | `` | `normal` | .pb-plate > small · 2026-09-14-pins2-board-2/index.html:424 |
| font-variant-numeric | `` | `normal` | .pb-plate > small · 2026-09-14-pins2-board-2/index.html:424 |
| line-height | `` | `9.5px` | .pb-plate > small · 2026-09-14-pins2-board-2/index.html:424 |
| letter-spacing | `0.16em` | `1.52px` | .pb-plate > small · 2026-09-14-pins2-board-2/index.html:424 |
| text-transform | `uppercase` | `uppercase` | .pb-plate > small · 2026-09-14-pins2-board-2/index.html:424 |
| text-align | ↑ `left` | `left` | inherited · .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| color | `color-mix(in srgb,var(--c) 70%,var(--ink2))` | `color(srgb 0.884706 0.361961 0.464314)` | .pb-plate > small · 2026-09-14-pins2-board-2/index.html:424 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

#### look 5 of 8

`G4-425` · rendered **92×10** · 1 instance look like this

```html
<small>LMG<em class="pb-nb">1 build</em></small>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 var(--t-micro)/1 var(--data)` | `` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-size | `` | `9.5px` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-weight | `` | `700` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-style | `` | `normal` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-variant-numeric | `` | `normal` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| line-height | `` | `9.5px` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| letter-spacing | `0.16em` | `1.52px` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| text-transform | `uppercase` | `uppercase` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| color | `var(--c)` | `rgb(132, 94, 194)` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

#### look 6 of 8

`G4-541` · rendered **114×10** · 1 instance look like this

```html
<small>Sniper<em class="pb-nb">1 build</em></small>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 var(--t-micro)/1 var(--data)` | `` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-size | `` | `9.5px` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-weight | `` | `700` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-style | `` | `normal` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| font-variant-numeric | `` | `normal` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| line-height | `` | `9.5px` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| letter-spacing | `0.16em` | `1.52px` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| text-transform | `uppercase` | `uppercase` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| color | `var(--c)` | `rgb(67, 97, 238)` | .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

*2 further looks are the same component in other data hues (a per-row `--c` / `--m` / `--sl`); they differ in colour only.*


### `em.pb-nb`

inside `.—` · 10 on screen · **1 look**

#### the one look

`G4-57` · rendered **77×13** · 10 instances look like this · text “2 builds”

```html
<em class="pb-nb">2 builds</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `inline` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-micro)/1 var(--data)` | `` | .pb-nb · 2026-09-14-pins2-board-2/index.html:388 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-nb · 2026-09-14-pins2-board-2/index.html:388 |
| font-size | `` | `9.5px` | .pb-nb · 2026-09-14-pins2-board-2/index.html:388 |
| font-weight | `` | `600` | .pb-nb · 2026-09-14-pins2-board-2/index.html:388 |
| font-style | `normal` | `normal` | .pb-nb · 2026-09-14-pins2-board-2/index.html:388 |
| font-variant-numeric | `` | `normal` | .pb-nb · 2026-09-14-pins2-board-2/index.html:388 |
| line-height | `` | `9.5px` | .pb-nb · 2026-09-14-pins2-board-2/index.html:388 |
| letter-spacing | `0.14em` | `1.33px` | .pb-nb · 2026-09-14-pins2-board-2/index.html:388 |
| text-transform | ↑ `uppercase` | `uppercase` | inherited · .pb-gline small · 2026-09-14-pins2-board-2/index.html:92 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-nb · 2026-09-14-pins2-board-2/index.html:388 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

**::before**

| property | winning declaration | from |
|---|---|---|
| display | `inline-block` | .pb-nb::before · 2026-09-14-pins2-board-2/index.html:389 |
| width | `3px` | .pb-nb::before · 2026-09-14-pins2-board-2/index.html:389 |
| height | `3px` | .pb-nb::before · 2026-09-14-pins2-board-2/index.html:389 |
| margin | `0 9px 2px` | .pb-nb::before · 2026-09-14-pins2-board-2/index.html:389 |
| margin-top | `0px` | .pb-nb::before · 2026-09-14-pins2-board-2/index.html:389 |
| margin-right | `9px` | .pb-nb::before · 2026-09-14-pins2-board-2/index.html:389 |
| margin-bottom | `2px` | .pb-nb::before · 2026-09-14-pins2-board-2/index.html:389 |
| margin-left | `9px` | .pb-nb::before · 2026-09-14-pins2-board-2/index.html:389 |
| border-radius | `50%` | .pb-nb::before · 2026-09-14-pins2-board-2/index.html:389 |
| background | `var(--ink4)` | .pb-nb::before · 2026-09-14-pins2-board-2/index.html:389 |
| background-color | `` | .pb-nb::before · 2026-09-14-pins2-board-2/index.html:389 |
| background-image | `` | .pb-nb::before · 2026-09-14-pins2-board-2/index.html:389 |
| content | `""` | .pb-nb::before · 2026-09-14-pins2-board-2/index.html:389 |


### `span.pb-gtags`

inside `.pb-gline` · 7 on screen · **1 look**

#### the one look

`G4-58` · rendered **65×22** · 7 instances look like this

```html
<span class="pb-gtags"><span class="pb-tag" data-t="top3">TOP 3</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-gtags · 2026-09-14-pins2-board-2/index.html:93 |
| gap | `6px` | `` | .pb-gtags · 2026-09-14-pins2-board-2/index.html:93 |
| column-gap | `6px` | `6px` | .pb-gtags · 2026-09-14-pins2-board-2/index.html:93 |
| row-gap | `6px` | `6px` | .pb-gtags · 2026-09-14-pins2-board-2/index.html:93 |
| align-items | `center` | `center` | .pb-gtags · 2026-09-14-pins2-board-2/index.html:93 |
| min-height | `22px` | `22px` | .pb-gtags · 2026-09-14-pins2-board-2/index.html:93 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-left | `16px` | `16px` | .pb-gtags · 2026-09-14-pins2-board-2/index.html:93 |
| margin-left | `8px` | `8px` | .pb-gtags · 2026-09-14-pins2-board-2/index.html:93 |
| box-shadow | `inset 1px 0 0 var(--rule2)` | `rgb(58, 71, 82) 1px 0px 0px 0px inset` | .pb-gtags · 2026-09-14-pins2-board-2/index.html:93 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |


### `span.pb-tag`

inside `.pb-gtags` · 9 on screen · **4 looks**

#### look 1 of 4

`G4-59` · rendered **49×22** · 2 instances look like this · text “TOP 3”

```html
<span class="pb-tag" data-t="top3">TOP 3</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| gap | `5px` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| column-gap | `5px` | `5px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| row-gap | `5px` | `5px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| align-items | `center` | `center` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| height | `22px` | `22px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 8px` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| padding-top | `0px` | `0px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| padding-right | `8px` | `8px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| padding-bottom | `0px` | `0px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| padding-left | `8px` | `8px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| border-radius | `var(--rad-1)` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| background | `color-mix(in srgb,var(--tc) 8%,transparent)` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| background-color | `` | `color(srgb 0.25098 0.603922 0.815686 / 0.08)` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| background-image | `` | `none` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--tc) 50%,transparent)` | `color(srgb 0.25098 0.603922 0.815686 / 0.5) 0px 0px 0px 1px inset` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font | `700 var(--t-micro)/1 var(--data)` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-size | `` | `9.5px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-weight | `` | `700` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-style | `` | `normal` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-variant-numeric | `` | `normal` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| line-height | `` | `9.5px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| letter-spacing | `0.1em` | `0.95px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| color | `var(--tc)` | `rgb(64, 154, 208)` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

#### look 2 of 4

`G4-261` · rendered **43×22** · 2 instances look like this · text “BEST”

```html
<span class="pb-tag" data-t="best">BEST</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| gap | `5px` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| column-gap | `5px` | `5px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| row-gap | `5px` | `5px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| align-items | `center` | `center` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| height | `22px` | `22px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 8px` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| padding-top | `0px` | `0px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| padding-right | `8px` | `8px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| padding-bottom | `0px` | `0px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| padding-left | `8px` | `8px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| border-radius | `var(--rad-1)` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| background | `color-mix(in srgb,var(--tc) 8%,transparent)` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| background-color | `` | `color(srgb 0.94902 0.760784 0.188235 / 0.08)` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| background-image | `` | `none` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--tc) 50%,transparent)` | `color(srgb 0.94902 0.760784 0.188235 / 0.5) 0px 0px 0px 1px inset` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font | `700 var(--t-micro)/1 var(--data)` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-size | `` | `9.5px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-weight | `` | `700` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-style | `` | `normal` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-variant-numeric | `` | `normal` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| line-height | `` | `9.5px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| letter-spacing | `0.1em` | `0.95px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| color | `var(--tc)` | `rgb(242, 194, 48)` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

#### look 3 of 4

`G4-471` · rendered **49×22** · 3 instances look like this · text “TOXIC”

```html
<span class="pb-tag" data-t="toxic">TOXIC</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| gap | `5px` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| column-gap | `5px` | `5px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| row-gap | `5px` | `5px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| align-items | `center` | `center` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| height | `22px` | `22px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 8px` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| padding-top | `0px` | `0px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| padding-right | `8px` | `8px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| padding-bottom | `0px` | `0px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| padding-left | `8px` | `8px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| border-radius | `var(--rad-1)` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| background | `color-mix(in srgb,var(--tc) 8%,transparent)` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| background-color | `` | `color(srgb 1 0.541176 0.521569 / 0.08)` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| background-image | `` | `none` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--tc) 50%,transparent)` | `color(srgb 1 0.541176 0.521569 / 0.5) 0px 0px 0px 1px inset` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font | `700 var(--t-micro)/1 var(--data)` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-size | `` | `9.5px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-weight | `` | `700` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-style | `` | `normal` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-variant-numeric | `` | `normal` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| line-height | `` | `9.5px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| letter-spacing | `0.1em` | `0.95px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| color | `var(--tc)` | `rgb(255, 138, 133)` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |

#### look 4 of 4

`G4-544` · rendered **49×22** · 2 instances look like this · text “TOP 5”

```html
<span class="pb-tag" data-t="top5">TOP 5</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| gap | `5px` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| column-gap | `5px` | `5px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| row-gap | `5px` | `5px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| align-items | `center` | `center` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| height | `22px` | `22px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 8px` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| padding-top | `0px` | `0px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| padding-right | `8px` | `8px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| padding-bottom | `0px` | `0px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| padding-left | `8px` | `8px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| border-radius | `var(--rad-1)` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| background | `color-mix(in srgb,var(--tc) 8%,transparent)` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| background-color | `` | `color(srgb 0.415098 0.632157 0.766275 / 0.08)` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| background-image | `` | `none` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--tc) 50%,transparent)` | `color(srgb 0.415098 0.632157 0.766275 / 0.5) 0px 0px 0px 1px inset` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font | `700 var(--t-micro)/1 var(--data)` | `` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-size | `` | `9.5px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-weight | `` | `700` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-style | `` | `normal` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| font-variant-numeric | `` | `normal` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| line-height | `` | `9.5px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| letter-spacing | `0.1em` | `0.95px` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| color | `var(--tc)` | `color(srgb 0.415098 0.632157 0.766275)` | .pb-tag · 2026-09-14-pins2-board-2/index.html:70 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |


### `span.pb-fwrap`

inside `.pb-gh` · 5 on screen · **1 look**

#### the one look

`G4-60` · rendered **116×34** · 5 instances look like this

```html
<span class="pb-fwrap"><button class="pb-fsum" data-fault="" aria-expanded="false">⟨svg.ic.⟩Fix build<span class="pb-fnos"><i>1</i></span></button><span class="pb-fpop" role="tooltip"><span class="pb-fpr"><i>1</i><span><span>Code lists 5 attachments, build has 4</span></span></span></span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-fwrap · 2026-09-14-pins2-board-2/index.html:393 |
| position | `relative` | `relative` | .pb-fwrap · 2026-09-14-pins2-board-2/index.html:393 |
| align-self | `center` | `center` | .pb-fwrap · 2026-09-14-pins2-board-2/index.html:497 |
| justify-self | `end` | `end` | .pb-fwrap · 2026-09-14-pins2-board-2/index.html:393 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-right | `18px` | `18px` | .pb-fwrap · 2026-09-14-pins2-board-2/index.html:578 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |


### `button.pb-fsum`

inside `.pb-fwrap` · 5 on screen · **1 look**

#### the one look

`G4-61` · rendered **116×34** · 5 instances look like this · aria-expanded="false"

```html
<button class="pb-fsum" data-fault="" aria-expanded="false">⟨svg.ic.⟩Fix build<span class="pb-fnos"><i>1</i></span></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| gap | `8px` | `` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| column-gap | `8px` | `8px` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| row-gap | `8px` | `8px` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| align-items | `center` | `center` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| justify-self | `end` | `end` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| height | `34px` | `34px` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:496 |
| min-height | `0px` | `0px` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:496 |
| box-sizing | `border-box` | `border-box` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:496 |
| padding | `0 5px 0 10px` | `` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| padding-top | `0px (as padding-block-start)` | `0px` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:496 |
| padding-right | `5px` | `5px` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| padding-bottom | `0px (as padding-block-end)` | `0px` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:496 |
| padding-left | `10px` | `10px` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| padding-block | `0` | `` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:496 |
| border | `0` | `` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:394 |
| border-radius | `var(--rad-2)` | `` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| background | `color-mix(in srgb,var(--warn) 9%,var(--sunk))` | `` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| background-color | `` | `color(srgb 0.129255 0.0965882 0.0885882)` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| background-image | `` | `none` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--warn) 30%,transparent)` | `color(srgb 1 0.478431 0.270588 / 0.3) 0px 0px 0px 1px inset` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| font-size | `var(--t-sm)` | `12px` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:496 |
| font-weight | `` | `600` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| font-style | `` | `normal` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| font-variant-numeric | `` | `normal` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| line-height | ⚠️ `1` | `12px` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:496 · **a later rule wins — port the computed value and find that rule** |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | `nowrap` | `` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| color | `var(--warn-ink)` | `rgb(255, 158, 114)` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | .pb-fsum · 2026-09-14-pins2-board-2/index.html:394 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `color(srgb 0.129255 0.0965882 0.0885882)` | `rgb(42, 52, 61)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `span.pb-fnos`

inside `.pb-fsum` · 5 on screen · **1 look**

#### the one look

`G4-63` · rendered **20×20** · 5 instances look like this

```html
<span class="pb-fnos"><i>1</i></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-fnos · 2026-09-14-pins2-board-2/index.html:298 |
| gap | `3px` | `` | .pb-fnos · 2026-09-14-pins2-board-2/index.html:298 |
| column-gap | `3px` | `3px` | .pb-fnos · 2026-09-14-pins2-board-2/index.html:298 |
| row-gap | `3px` | `3px` | .pb-fnos · 2026-09-14-pins2-board-2/index.html:298 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-left | `2px` | `2px` | .pb-fnos · 2026-09-14-pins2-board-2/index.html:298 |
| font | ↑ `600 var(--t-sm)/1 var(--ui)` | `` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:496 |
| font-weight | ↑ `` | `600` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| font-style | ↑ `` | `normal` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| line-height | ↑ `1` | `12px` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:496 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | ↑ `nowrap` | `` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| color | ↑ `var(--warn-ink)` | `rgb(255, 158, 114)` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:296 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-fsum · 2026-09-14-pins2-board-2/index.html:394 |


### `span.pb-fpr`

inside `.pb-fpop` · 5 on screen · **1 look**

#### the one look

`G4-65` · rendered **0×0** · 5 instances look like this

```html
<span class="pb-fpr"><i>1</i><span><span>Code lists 5 attachments, build has 4</span></span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-fpr · 2026-09-14-pins2-board-2/index.html:398 |
| grid-template-columns | `24px minmax(0px, 1fr)` | `24px minmax(0px, 1fr)` | .pb-fpr · 2026-09-14-pins2-board-2/index.html:398 |
| gap | `12px` | `` | .pb-fpr · 2026-09-14-pins2-board-2/index.html:398 |
| column-gap | `12px` | `12px` | .pb-fpr · 2026-09-14-pins2-board-2/index.html:398 |
| row-gap | `12px` | `12px` | .pb-fpr · 2026-09-14-pins2-board-2/index.html:398 |
| align-items | `start` | `start` | .pb-fpr · 2026-09-14-pins2-board-2/index.html:398 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `10px 12px` | `` | .pb-fpr · 2026-09-14-pins2-board-2/index.html:398 |
| padding-top | `10px` | `10px` | .pb-fpr · 2026-09-14-pins2-board-2/index.html:398 |
| padding-right | `12px` | `12px` | .pb-fpr · 2026-09-14-pins2-board-2/index.html:398 |
| padding-bottom | `10px` | `10px` | .pb-fpr · 2026-09-14-pins2-board-2/index.html:398 |
| padding-left | `12px` | `12px` | .pb-fpr · 2026-09-14-pins2-board-2/index.html:398 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-gh · 2026-09-14-pins2-board-2/index.html:89 |


### `button.pb-fbtn`

inside `.pb-gh` · 10 on screen · **1 look**

#### the one look

`G4-69` · rendered **44×44** · 10 instances look like this · aria-label="Collapse .50 GS" aria-expanded="true"

```html
<button class="pb-fbtn" data-collapse="" aria-expanded="true" aria-label="Collapse .50 GS">⟨svg.ic.⟩</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-fbtn · 2026-09-14-pins2-board-2/index.html:390 |
| position | `relative` | `relative` | .pb-ib, .pb-fbtn · 2026-09-14-pins2-board-2/index.html:456 |
| align-items | `center` | `center` | .pb-fbtn · 2026-09-14-pins2-board-2/index.html:390 |
| place-items | `center` | `` | .pb-fbtn · 2026-09-14-pins2-board-2/index.html:390 |
| width | `var(--tap)` | `44px` | .pb-fbtn · 2026-09-14-pins2-board-2/index.html:390 |
| height | `var(--tap)` | `44px` | .pb-fbtn · 2026-09-14-pins2-board-2/index.html:390 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `var(--ctl-pad, 7px 10px)` | `` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-top | `` | `1px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-right | `` | `6px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-bottom | `` | `1px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-left | `` | `6px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| margin-right | `calc(-1 * var(--pb-inset))` | `-5px` | .pb-fbtn · 2026-09-14-pins2-board-2/index.html:502 |
| border | `0` | `` | .pb-fbtn · 2026-09-14-pins2-board-2/index.html:390 |
| border-radius | `var(--rad-2)` | `` | .pb-fbtn · 2026-09-14-pins2-board-2/index.html:390 |
| background | `none!important !important` | `` | .pb-ib, .pb-fbtn · 2026-09-14-pins2-board-2/index.html:456 |
| background-color | `initial !important !important` | `rgba(0, 0, 0, 0)` | .pb-ib, .pb-fbtn · 2026-09-14-pins2-board-2/index.html:456 |
| background-image | `none !important !important` | `none` | .pb-ib, .pb-fbtn · 2026-09-14-pins2-board-2/index.html:456 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `inherit` | `13px` | button · 2026-09-14-pins2-board/app.css:600 |
| font-weight | `inherit` | `400` | button · 2026-09-14-pins2-board/app.css:600 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `19.5px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-fbtn · 2026-09-14-pins2-board-2/index.html:390 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | .pb-fbtn · 2026-09-14-pins2-board-2/index.html:390 |
| isolation | `isolate` | `isolate` | .pb-ib, .pb-fbtn · 2026-09-14-pins2-board-2/index.html:456 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| inset | `var(--pb-inset)` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:501 |
| top | `` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:501 |
| right | `` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:501 |
| bottom | `` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:501 |
| left | `` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:501 |
| border-radius | `8px` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| background | `var(--raised)` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| background-color | `` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| background-image | `` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| transition | `background .15s,box-shadow .15s` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| content | `""` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| z-index | `-1` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |

**:hover** — changes; parts inside it respond (table below)

| property | at rest | hover |
|---|---|---|
| color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |

| part inside | property | at rest | hover |
|---|---|---|---|
| ::before | color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| ::before | background-color | `rgb(31, 39, 46)` | `rgb(35, 44, 52)` |
| ::before | border-color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| ::before | box-shadow | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | `color(srgb 0.909804 0.929412 0.945098 / 0.24) 0px 0px 0px 1px inset` |
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


### `div.pb-bad.pb-rb`

inside `.pb-g` · 5 on screen · **3 looks**

#### look 1 of 3

`G4-71` · rendered **1148×52** · 3 instances look like this

```html
<div class="pb-rb pb-bad" data-row="6a4f2db36628dd173431326c"><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select .50 GS build 1"><span class="cb"></span></button><span class="pb-ix" data-why="Almost the same as another build">1</span><div class="pb-main"><div class="pb-rail"><span class="pb-at"><span>Monolithic Suppressor</span></span><span class="pb-at"><span>OWC Laser - Tactica
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| position | `relative` | `relative` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| grid-template-columns | `32px 28px minmax(0px, 1fr) 28px 144px 113px` | `32px 28px 707px 28px 144px 113px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:565 |
| column-gap | `12px` | `12px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:304 |
| align-items | `center` | `center` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| min-height | `52px` | `52px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:304 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px 0 20px` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-top | `0px` | `0px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-right | `16px` | `16px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-bottom | `0px` | `0px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-left | `20px` | `20px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| border-top | `1px solid var(--rule3)` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| transition | `background .18s` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| cursor | `pointer` | `pointer` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| width | `3px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| top | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| bottom | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| left | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background | `var(--c)` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background-color | `` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background-image | `` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| opacity | `0` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| transition | `opacity .18s` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| content | `""` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |

**::after**

| property | winning declaration | from |
|---|---|---|
| display | `block` | #g4man[data-fm="edge"] .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:311 |
| position | `absolute` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |
| width | `4px` | #g4man[data-fm="edge"] .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:311 |
| top | `0px` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |
| right | `0px` | #g4man[data-fm="edge"] .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:311 |
| bottom | `0px` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |
| left | `auto` | #g4man[data-fm="edge"] .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:311 |
| background | `repeating-linear-gradient(-45deg,var(--warn) 0 3px,transparent 3px 6px)` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |
| background-color | `` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |
| background-image | `` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |
| content | `""` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |

#### look 2 of 3

`G4-648` · rendered **1148×85** · 1 instance look like this

```html
<div class="pb-rb pb-bad" data-row="6a4c692095a4f5a6c33754e3"><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select JAK-12 build 1"><span class="cb"></span></button><span class="pb-ix" data-why="Almost the same as another build">1</span><div class="pb-main"><div class="pb-rail"><span class="pb-at"><span>Marauder Suppressor</span></span><span class="pb-at"><span>MIP Extended Light Ba
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| position | `relative` | `relative` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| grid-template-columns | `32px 28px minmax(0px, 1fr) 28px 144px 113px` | `32px 28px 707px 28px 144px 113px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:565 |
| column-gap | `12px` | `12px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:304 |
| align-items | `center` | `center` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| min-height | `52px` | `52px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:304 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px 0 20px` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-top | `0px` | `0px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-right | `16px` | `16px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-bottom | `0px` | `0px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-left | `20px` | `20px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| border-top | `1px solid var(--rule3)` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| transition | `background .18s` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| cursor | `pointer` | `pointer` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| width | `3px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| top | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| bottom | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| left | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background | `var(--c)` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background-color | `` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background-image | `` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| opacity | `0` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| transition | `opacity .18s` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| content | `""` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |

**::after**

| property | winning declaration | from |
|---|---|---|
| display | `block` | #g4man[data-fm="edge"] .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:311 |
| position | `absolute` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |
| width | `4px` | #g4man[data-fm="edge"] .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:311 |
| top | `0px` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |
| right | `0px` | #g4man[data-fm="edge"] .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:311 |
| bottom | `0px` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |
| left | `auto` | #g4man[data-fm="edge"] .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:311 |
| background | `repeating-linear-gradient(-45deg,var(--warn) 0 3px,transparent 3px 6px)` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |
| background-color | `` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |
| background-image | `` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |
| content | `""` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |

#### look 3 of 3

`G4-700` · rendered **1148×66** · 1 instance look like this

```html
<div class="pb-rb pb-bad" data-row="6a4ecc7e2b715e5e00e0a124"><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select PHARO build 1"><span class="cb"></span></button><span class="pb-ix" data-why="Almost the same as another build">1</span><div class="pb-main pb-named"><span class="pb-plate"><small>Build name</small><span title="Up to 32 characters">Coming Soon</span></span><div class="
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| position | `relative` | `relative` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| grid-template-columns | `32px 28px minmax(0px, 1fr) 28px 144px 113px` | `32px 28px 707px 28px 144px 113px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:565 |
| column-gap | `12px` | `12px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:304 |
| align-items | `center` | `center` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| min-height | `52px` | `52px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:304 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px 0 20px` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-top | `0px` | `0px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-right | `16px` | `16px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-bottom | `0px` | `0px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-left | `20px` | `20px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| border-top | `1px solid var(--rule3)` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| transition | `background .18s` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| cursor | `pointer` | `pointer` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| width | `3px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| top | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| bottom | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| left | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background | `var(--c)` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background-color | `` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background-image | `` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| opacity | `0` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| transition | `opacity .18s` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| content | `""` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |

**::after**

| property | winning declaration | from |
|---|---|---|
| display | `block` | #g4man[data-fm="edge"] .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:311 |
| position | `absolute` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |
| width | `4px` | #g4man[data-fm="edge"] .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:311 |
| top | `0px` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |
| right | `0px` | #g4man[data-fm="edge"] .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:311 |
| bottom | `0px` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |
| left | `auto` | #g4man[data-fm="edge"] .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:311 |
| background | `repeating-linear-gradient(-45deg,var(--warn) 0 3px,transparent 3px 6px)` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |
| background-color | `` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |
| background-image | `` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |
| content | `""` | .pb-rb.pb-bad::after · 2026-09-14-pins2-board-2/index.html:120 |


### `span.pb-ix`

inside `.pb-rb` · 17 on screen · **2 looks**

#### look 1 of 2

`G4-74` · rendered **5×32** · 16 instances look like this · text “1”

```html
<span class="pb-ix" data-why="Almost the same as another build">1</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| align-items | `center` | `center` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| align-self | `center` | `center` | .pb-rb > * · 2026-09-14-pins2-board-2/index.html:471 |
| justify-self | `start` | `start` | .pb-ix · 2026-09-14-pins2-board-2/index.html:571 |
| place-items | `center` | `` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| width | `auto` | `4.96875px` | .pb-ix · 2026-09-14-pins2-board-2/index.html:571 |
| height | `32px` | `32px` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| box-sizing | `border-box` | `border-box` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| padding | `0` | `` | .pb-ix · 2026-09-14-pins2-board-2/index.html:571 |
| padding-top | `0px` | `0px` | .pb-ix · 2026-09-14-pins2-board-2/index.html:571 |
| padding-right | `0px` | `0px` | .pb-ix · 2026-09-14-pins2-board-2/index.html:571 |
| padding-bottom | `0px` | `0px` | .pb-ix · 2026-09-14-pins2-board-2/index.html:571 |
| padding-left | `0px` | `0px` | .pb-ix · 2026-09-14-pins2-board-2/index.html:571 |
| border-radius | `var(--rad-2)` | `` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| font | `700 21px/1 var(--display)` | `` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| font-family | `` | `"Big Shoulders Display", "Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| font-size | `` | `21px` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| font-weight | `` | `700` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| font-style | `` | `normal` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| line-height | `` | `21px` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| transition | `color .18s,background .18s` | `` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

#### look 2 of 2

`G4-269` · rendered **5×32** · 1 instance look like this · text “1”

```html
<span class="pb-ix" data-why="Almost the same as another build">1</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| align-items | `center` | `center` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| align-self | `center` | `center` | .pb-rb > * · 2026-09-14-pins2-board-2/index.html:471 |
| justify-self | `start` | `start` | .pb-ix · 2026-09-14-pins2-board-2/index.html:571 |
| place-items | `center` | `` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| width | `auto` | `4.96875px` | .pb-ix · 2026-09-14-pins2-board-2/index.html:571 |
| height | `32px` | `32px` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| box-sizing | `border-box` | `border-box` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| padding | `0` | `` | .pb-ix · 2026-09-14-pins2-board-2/index.html:571 |
| padding-top | `0px` | `0px` | .pb-ix · 2026-09-14-pins2-board-2/index.html:571 |
| padding-right | `0px` | `0px` | .pb-ix · 2026-09-14-pins2-board-2/index.html:571 |
| padding-bottom | `0px` | `0px` | .pb-ix · 2026-09-14-pins2-board-2/index.html:571 |
| padding-left | `0px` | `0px` | .pb-ix · 2026-09-14-pins2-board-2/index.html:571 |
| border-radius | `var(--rad-2)` | `` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| font | `700 21px/1 var(--display)` | `` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| font-family | `` | `"Big Shoulders Display", "Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| font-size | `` | `21px` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| font-weight | `` | `700` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| font-style | `` | `normal` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| line-height | `` | `21px` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| letter-spacing | — | `normal` | initial |
| color | `var(--c)` | `rgb(255, 59, 92)` | .pb-rb:hover .pb-ix, .pb-rb.pb-hov .pb-ix · 2026-09-14-pins2-board-2/index.html:309 |
| transition | `color .18s,background .18s` | `` | .pb-ix · 2026-09-14-pins2-board-2/index.html:308 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |


### `div.pb-main`

inside `.pb-rb` · 14 on screen · **2 looks**

#### look 1 of 2

`G4-75` · rendered **707×50** · 11 instances look like this

```html
<div class="pb-main"><div class="pb-rail"><span class="pb-at"><span>Monolithic Suppressor</span></span><span class="pb-at"><span>OWC Laser - Tactical</span></span><span class="pb-at"><span>Extended Mag A</span></span><span class="pb-at"><span>Granulated Grip Tape</span></span></div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-main · 2026-09-14-pins2-board-2/index.html:314 |
| gap | `6px` | `` | .pb-main · 2026-09-14-pins2-board-2/index.html:314 |
| column-gap | `6px` | `6px` | .pb-main · 2026-09-14-pins2-board-2/index.html:314 |
| row-gap | `6px` | `6px` | .pb-main · 2026-09-14-pins2-board-2/index.html:314 |
| align-self | `center` | `center` | .pb-rb > * · 2026-09-14-pins2-board-2/index.html:471 |
| min-width | `0px` | `0px` | .pb-main · 2026-09-14-pins2-board-2/index.html:314 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `11px 0` | `` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| padding-top | `11px` | `11px` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| padding-right | `0px` | `0px` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| padding-bottom | `11px` | `11px` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| padding-left | `0px` | `0px` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

#### look 2 of 2

`G4-103` · rendered **707×84** · 3 instances look like this

```html
<div class="pb-main"><div class="pb-rail"><span class="pb-at" title="Muzzle" style="--sl:var(--sl-muzzle)"><span>Monolithic Suppressor</span></span><span class="pb-at" title="Barrel" style="--sl:var(--sl-barrel)"><span>MIP Extended Light Barrel</span></span><span class="pb-at" title="Underbarrel" style="--sl:var(--sl-underbarrel)"><span>Lightweight Trigger</span></span><span class="pb-at" title="Rear Grip" style="--s
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-main · 2026-09-14-pins2-board-2/index.html:314 |
| gap | `6px` | `` | .pb-main · 2026-09-14-pins2-board-2/index.html:314 |
| column-gap | `6px` | `6px` | .pb-main · 2026-09-14-pins2-board-2/index.html:314 |
| row-gap | `6px` | `6px` | .pb-main · 2026-09-14-pins2-board-2/index.html:314 |
| align-self | `center` | `center` | .pb-rb > * · 2026-09-14-pins2-board-2/index.html:471 |
| min-width | `0px` | `0px` | .pb-main · 2026-09-14-pins2-board-2/index.html:314 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `11px 0` | `` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| padding-top | `11px` | `11px` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| padding-right | `0px` | `0px` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| padding-bottom | `11px` | `11px` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| padding-left | `0px` | `0px` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |


### `div.pb-rail`

inside `.pb-main` · 17 on screen · **2 looks**

#### look 1 of 2

`G4-76` · rendered **707×28** · 12 instances look like this

```html
<div class="pb-rail"><span class="pb-at"><span>Monolithic Suppressor</span></span><span class="pb-at"><span>OWC Laser - Tactical</span></span><span class="pb-at"><span>Extended Mag A</span></span><span class="pb-at"><span>Granulated Grip Tape</span></span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| gap | `6px` | `` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| column-gap | `6px` | `6px` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| row-gap | `6px` | `6px` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| flex-wrap | `wrap` | `wrap` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| align-items | `center` | `center` | .pb-rail · 2026-09-14-pins2-board-2/index.html:132 |
| min-width | `0px` | `0px` | .pb-rail · 2026-09-14-pins2-board-2/index.html:132 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0` | `` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| padding-top | `0px` | `0px` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| padding-right | `0px` | `0px` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| padding-bottom | `0px` | `0px` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| padding-left | `0px` | `0px` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

#### look 2 of 2

`G4-104` · rendered **707×62** · 5 instances look like this

```html
<div class="pb-rail"><span class="pb-at" title="Muzzle" style="--sl:var(--sl-muzzle)"><span>Monolithic Suppressor</span></span><span class="pb-at" title="Barrel" style="--sl:var(--sl-barrel)"><span>MIP Extended Light Barrel</span></span><span class="pb-at" title="Underbarrel" style="--sl:var(--sl-underbarrel)"><span>Lightweight Trigger</span></span><span class="pb-at" title="Rear Grip" style="--sl:var(--sl-rear-grip)
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| gap | `6px` | `` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| column-gap | `6px` | `6px` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| row-gap | `6px` | `6px` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| flex-wrap | `wrap` | `wrap` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| align-items | `center` | `center` | .pb-rail · 2026-09-14-pins2-board-2/index.html:132 |
| min-width | `0px` | `0px` | .pb-rail · 2026-09-14-pins2-board-2/index.html:132 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0` | `` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| padding-top | `0px` | `0px` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| padding-right | `0px` | `0px` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| padding-bottom | `0px` | `0px` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| padding-left | `0px` | `0px` | #g4man .pb-rail · 2026-09-14-pins2-board-2/index.html:557 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |


### `span.pb-at`

inside `.pb-rail` · 80 on screen · **14 looks**

#### look 1 of 14

`G4-77` · rendered **151×28** · 15 instances look like this

```html
<span class="pb-at"><span>Monolithic Suppressor</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| gap | `8px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| column-gap | `8px` | `8px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| row-gap | `8px` | `8px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| align-items | `center` | `center` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| min-width | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| height | `28px` | `28px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| box-sizing | `border-box` | `border-box` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding | `0 10px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-top | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-right | `10px` | `10px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-bottom | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-left | `10px` | `10px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| border-radius | `6px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| outline | `0` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| background | `linear-gradient(180deg,color-mix(in srgb,var(--ink) 4%,var(--sunk)),var(--sunk))` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| background-color | `` | `rgba(0, 0, 0, 0)` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| background-image | `` | `linear-gradient(color(srgb 0.0778039 0.0936471 0.105569), rgb(11, 15, 18))` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| box-shadow | `inset 0 0 0 1px var(--rule2),inset 0 1px 0 color-mix(in srgb,var(--ink) 6%,transparent)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset, color(srgb 0.909804 0.929412 0.945098 / 0.06) 0px 1px 0px 0px inset` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font | `500 var(--t-sm)/1 var(--ui)` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-size | `` | `12px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-weight | `` | `500` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-style | `` | `normal` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-variant-numeric | `` | `normal` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| line-height | `` | `12px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| letter-spacing | — | `normal` | initial |
| text-decoration | `none` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| white-space | `nowrap` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| transition | `box-shadow .18s,background .18s` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

#### look 2 of 14

`G4-105` · rendered **151×28** · 10 instances look like this · title="Muzzle"

```html
<span class="pb-at" title="Muzzle" style="--sl:var(--sl-muzzle)"><span>Monolithic Suppressor</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| gap | `8px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| column-gap | `8px` | `8px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| row-gap | `8px` | `8px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| align-items | `center` | `center` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| min-width | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| height | `28px` | `28px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| box-sizing | `border-box` | `border-box` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding | `0 10px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-top | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-right | `10px` | `10px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-bottom | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-left | `10px` | `10px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| border-radius | `6px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| outline | `0` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| background | `color-mix(in srgb,var(--sl) 11%,var(--sunk))` | `` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| background-color | `` | `color(srgb 0.128997 0.123166 0.131665)` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| background-image | `` | `none` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--sl) 30%,transparent),inset 0 1px 0 color-mix(in srgb,var(--sl) 14%,transparent)` | `color(srgb 0.823677 0.643756 0.625832 / 0.3) 0px 0px 0px 1px inset, color(srgb 0.823677 0.643756 0.625832 / 0.14) 0px 1px 0px 0px inset` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| font | `500 var(--t-sm)/1 var(--ui)` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-size | `` | `12px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-weight | `` | `500` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-style | `` | `normal` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-variant-numeric | `` | `normal` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| line-height | `` | `12px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| letter-spacing | — | `normal` | initial |
| text-decoration | `none` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| white-space | `nowrap` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| transition | `box-shadow .18s,background .18s` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

#### look 3 of 14

`G4-107` · rendered **170×28** · 12 instances look like this · title="Barrel"

```html
<span class="pb-at" title="Barrel" style="--sl:var(--sl-barrel)"><span>MIP Extended Light Barrel</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| gap | `8px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| column-gap | `8px` | `8px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| row-gap | `8px` | `8px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| align-items | `center` | `center` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| min-width | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| height | `28px` | `28px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| box-sizing | `border-box` | `border-box` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding | `0 10px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-top | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-right | `10px` | `10px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-bottom | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-left | `10px` | `10px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| border-radius | `6px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| outline | `0` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| background | `color-mix(in srgb,var(--sl) 11%,var(--sunk))` | `` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| background-color | `` | `color(srgb 0.125579 0.125905 0.123583)` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| background-image | `` | `none` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--sl) 30%,transparent),inset 0 1px 0 color-mix(in srgb,var(--sl) 14%,transparent)` | `color(srgb 0.792607 0.668653 0.552362 / 0.3) 0px 0px 0px 1px inset, color(srgb 0.792607 0.668653 0.552362 / 0.14) 0px 1px 0px 0px inset` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| font | `500 var(--t-sm)/1 var(--ui)` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-size | `` | `12px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-weight | `` | `500` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-style | `` | `normal` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-variant-numeric | `` | `normal` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| line-height | `` | `12px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| letter-spacing | — | `normal` | initial |
| text-decoration | `none` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| white-space | `nowrap` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| transition | `box-shadow .18s,background .18s` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

#### look 4 of 14

`G4-109` · rendered **134×28** · 4 instances look like this · title="Underbarrel"

```html
<span class="pb-at" title="Underbarrel" style="--sl:var(--sl-underbarrel)"><span>Lightweight Trigger</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| gap | `8px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| column-gap | `8px` | `8px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| row-gap | `8px` | `8px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| align-items | `center` | `center` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| min-width | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| height | `28px` | `28px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| box-sizing | `border-box` | `border-box` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding | `0 10px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-top | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-right | `10px` | `10px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-bottom | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-left | `10px` | `10px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| border-radius | `6px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| outline | `0` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| background | `color-mix(in srgb,var(--sl) 11%,var(--sunk))` | `` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| background-color | `` | `color(srgb 0.104352 0.133213 0.131384)` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| background-image | `` | `none` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--sl) 30%,transparent),inset 0 1px 0 color-mix(in srgb,var(--sl) 14%,transparent)` | `color(srgb 0.599638 0.73509 0.623276 / 0.3) 0px 0px 0px 1px inset, color(srgb 0.599638 0.73509 0.623276 / 0.14) 0px 1px 0px 0px inset` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| font | `500 var(--t-sm)/1 var(--ui)` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-size | `` | `12px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-weight | `` | `500` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-style | `` | `normal` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-variant-numeric | `` | `normal` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| line-height | `` | `12px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| letter-spacing | — | `normal` | initial |
| text-decoration | `none` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| white-space | `nowrap` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| transition | `box-shadow .18s,background .18s` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

#### look 5 of 14

`G4-111` · rendered **140×28** · 6 instances look like this · title="Rear Grip"

```html
<span class="pb-at" title="Rear Grip" style="--sl:var(--sl-rear-grip)"><span>Granulated Grip Tape</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| gap | `8px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| column-gap | `8px` | `8px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| row-gap | `8px` | `8px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| align-items | `center` | `center` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| min-width | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| height | `28px` | `28px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| box-sizing | `border-box` | `border-box` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding | `0 10px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-top | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-right | `10px` | `10px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-bottom | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-left | `10px` | `10px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| border-radius | `6px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| outline | `0` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| background | `color-mix(in srgb,var(--sl) 11%,var(--sunk))` | `` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| background-color | `` | `color(srgb 0.106109 0.129259 0.154581)` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| background-image | `` | `none` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--sl) 30%,transparent),inset 0 1px 0 color-mix(in srgb,var(--sl) 14%,transparent)` | `color(srgb 0.615604 0.699144 0.834157 / 0.3) 0px 0px 0px 1px inset, color(srgb 0.615604 0.699144 0.834157 / 0.14) 0px 1px 0px 0px inset` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| font | `500 var(--t-sm)/1 var(--ui)` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-size | `` | `12px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-weight | `` | `500` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-style | `` | `normal` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-variant-numeric | `` | `normal` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| line-height | `` | `12px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| letter-spacing | — | `normal` | initial |
| text-decoration | `none` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| white-space | `nowrap` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| transition | `box-shadow .18s,background .18s` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

#### look 6 of 14

`G4-113` · rendered **114×28** · 9 instances look like this · title="Ammunition"

```html
<span class="pb-at" title="Ammunition" style="--sl:var(--sl-ammunition)"><span>Extended Mag A</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| gap | `8px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| column-gap | `8px` | `8px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| row-gap | `8px` | `8px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| align-items | `center` | `center` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| min-width | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| height | `28px` | `28px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| box-sizing | `border-box` | `border-box` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding | `0 10px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-top | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-right | `10px` | `10px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-bottom | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-left | `10px` | `10px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| border-radius | `6px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| outline | `0` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| background | `color-mix(in srgb,var(--sl) 11%,var(--sunk))` | `` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| background-color | `` | `color(srgb 0.12547 0.123084 0.143988)` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| background-image | `` | `none` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--sl) 30%,transparent),inset 0 1px 0 color-mix(in srgb,var(--sl) 14%,transparent)` | `color(srgb 0.79162 0.643006 0.737861 / 0.3) 0px 0px 0px 1px inset, color(srgb 0.79162 0.643006 0.737861 / 0.14) 0px 1px 0px 0px inset` | #g4man[data-av] .pb-rail > .pb-at[style] · 2026-09-14-pins2-board-2/index.html:580 |
| font | `500 var(--t-sm)/1 var(--ui)` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-size | `` | `12px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-weight | `` | `500` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-style | `` | `normal` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-variant-numeric | `` | `normal` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| line-height | `` | `12px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| letter-spacing | — | `normal` | initial |
| text-decoration | `none` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| white-space | `nowrap` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| transition | `box-shadow .18s,background .18s` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

*8 further looks are the same component in other data hues (a per-row `--c` / `--m` / `--sl`); they differ in colour only.*


### `span.pb-im[role=img]`

inside `.pb-rb` · 16 on screen · **1 look**

#### the one look

`G4-85` · rendered **28×28** · 16 instances look like this · aria-label="Image uploaded" role="img" title="Image uploaded"

```html
<span class="pb-im" data-why="No image uploaded" role="img" aria-label="Image uploaded" title="Image uploaded">⟨svg.ic.⟩</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-im · 2026-09-14-pins2-board-2/index.html:327 |
| align-items | `center` | `center` | .pb-im · 2026-09-14-pins2-board-2/index.html:327 |
| align-self | `center` | `center` | .pb-rb > * · 2026-09-14-pins2-board-2/index.html:471 |
| place-items | `center` | `` | .pb-im · 2026-09-14-pins2-board-2/index.html:327 |
| width | `28px` | `28px` | .pb-im · 2026-09-14-pins2-board-2/index.html:327 |
| height | `28px` | `28px` | .pb-im · 2026-09-14-pins2-board-2/index.html:327 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `color-mix(in srgb,var(--ok) 80%,var(--ink3))` | `color(srgb 0.490196 0.802353 0.435294)` | .pb-im · 2026-09-14-pins2-board-2/index.html:327 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |


### `button.pb-igw`

inside `.pb-rb` · 15 on screen · **1 look**

#### the one look

`G4-87` · rendered **144×44** · 15 instances look like this · aria-label="Copy gunsmith code 1C6C7A8A9A"

```html
<button class="pb-igw" data-copy="1C6C7A8A9A" aria-label="Copy gunsmith code 1C6C7A8A9A"><span class="pb-ig"><span class="pb-igf"><span class="pb-ct bad" title="Code lists 5 attachments, build has 4">1C6C7A8A9A</span></span><span class="pb-igb">⟨svg.ic.⟩</span></span></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| align-items | `center` | `center` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| align-self | `center` | `center` | .pb-rb > * · 2026-09-14-pins2-board-2/index.html:471 |
| width | `100%` | `144px` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| min-height | `var(--tap)` | `44px` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `0` | `` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| padding-top | `0px` | `0px` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| padding-right | `0px` | `0px` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| padding-bottom | `0px` | `0px` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| padding-left | `0px` | `0px` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| border | `0` | `` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| border-radius | `var(--ctl-rad, 5px)` | `` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| background | `none!important !important` | `` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| background-color | `initial !important !important` | `rgba(0, 0, 0, 0)` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| background-image | `none !important !important` | `none` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font | `inherit` | `` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-size | `inherit` | `13px` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-weight | `inherit` | `400` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-style | `inherit` | `normal` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-variant-numeric | `inherit` | `normal` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| line-height | `inherit` | `19.5px` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `inherit` | `rgb(232, 237, 241)` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `copy` | `copy` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |

**:hover** — changes nothing on the element itself; parts inside it respond (table below)

| part inside | property | at rest | hover |
|---|---|---|---|
| span.pb-ig | box-shadow | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | `color(srgb 0.909804 0.929412 0.945098 / 0.22) 0px 0px 0px 1px inset` |
| span.pb-igb | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| span.pb-igb | background-color | `rgb(31, 39, 46)` | `rgb(35, 44, 52)` |
| span.pb-igb | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| span.pb-igb | box-shadow | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | `color(srgb 0.909804 0.929412 0.945098 / 0.22) 0px 0px 0px 1px inset` |
| span.pb-igb | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| svg.ic | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| svg.ic | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| svg.ic | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| svg.ic | stroke | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| use | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| use | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| use | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| use | stroke | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |

**:focus-visible** — changes; parts inside it respond (table below)

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

| part inside | property | at rest | focus-visible |
|---|---|---|---|
| span.pb-ig | outline-color | `rgb(232, 237, 241)` | `rgb(242, 194, 48)` |
| span.pb-ig | outline-width | `3px` | `2px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `span.pb-ig`

inside `.pb-igw` · 15 on screen · **1 look**

#### the one look

`G4-88` · rendered **144×34** · 15 instances look like this

```html
<span class="pb-ig"><span class="pb-igf"><span class="pb-ct bad" title="Code lists 5 attachments, build has 4">1C6C7A8A9A</span></span><span class="pb-igb">⟨svg.ic.⟩</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-ig · 2026-09-14-pins2-board-2/index.html:521 |
| align-items | `stretch` | `stretch` | .pb-ig · 2026-09-14-pins2-board-2/index.html:521 |
| width | `100%` | `144px` | .pb-ig · 2026-09-14-pins2-board-2/index.html:521 |
| height | `34px` | `34px` | .pb-ig · 2026-09-14-pins2-board-2/index.html:521 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `7px` | `` | .pb-ig · 2026-09-14-pins2-board-2/index.html:521 |
| background | `var(--desk,#0b0f12)` | `` | .pb-ig · 2026-09-14-pins2-board-2/index.html:521 |
| background-color | `` | `rgb(15, 20, 24)` | .pb-ig · 2026-09-14-pins2-board-2/index.html:521 |
| background-image | `` | `none` | .pb-ig · 2026-09-14-pins2-board-2/index.html:521 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-ig · 2026-09-14-pins2-board-2/index.html:521 |
| font | ↑ `inherit` | `` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-size | ↑ `inherit` | `13px` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-weight | ↑ `inherit` | `400` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-style | ↑ `inherit` | `normal` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| line-height | ↑ `inherit` | `19.5px` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `inherit` | `rgb(232, 237, 241)` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| cursor | ↑ `copy` | `copy` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |


### `span.pb-igf`

inside `.pb-ig` · 17 on screen · **2 looks**

#### look 1 of 2

`G4-89` · rendered **106×34** · 15 instances look like this

```html
<span class="pb-igf"><span class="pb-ct bad" title="Code lists 5 attachments, build has 4">1C6C7A8A9A</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| flex | `1` | `` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| align-items | `center` | `center` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| min-width | `0px` | `0px` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 12px` | `` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| padding-top | `0px` | `0px` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| padding-right | `12px` | `12px` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| padding-bottom | `0px` | `0px` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| padding-left | `12px` | `12px` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| border-radius | `7px 0 0 7px` | `` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| box-shadow | `rgba(0, 0, 0, 0.45) 0px 2px 4px inset` | `rgba(0, 0, 0, 0.45) 0px 2px 4px 0px inset` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| font | ↑ `inherit` | `` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-size | ↑ `inherit` | `13px` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-weight | ↑ `inherit` | `400` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-style | ↑ `inherit` | `normal` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| line-height | ↑ `inherit` | `19.5px` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `inherit` | `rgb(232, 237, 241)` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| cursor | ↑ `copy` | `copy` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |

#### look 2 of 2

`G4-617` · rendered **144×34** · 2 instances look like this

```html
<span class="pb-igf"><span class="pb-cnone">⟨svg.ic.⟩No code</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| flex | `1` | `` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| align-items | `center` | `center` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| justify-content | `center` | `center` | .pb-ig.none .pb-igf · 2026-09-14-pins2-board-2/index.html:555 |
| min-width | `0px` | `0px` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 12px` | `` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| padding-top | `0px` | `0px` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| padding-right | `12px` | `12px` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| padding-bottom | `0px` | `0px` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| padding-left | `12px` | `12px` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| border-radius | `7px 0 0 7px` | `` | .pb-igf · 2026-09-14-pins2-board-2/index.html:522 |
| box-shadow | `none` | `none` | .pb-ig.none .pb-igf · 2026-09-14-pins2-board-2/index.html:531 |
| font | ↑ `inherit` | `` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-size | ↑ `inherit` | `13px` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-weight | ↑ `inherit` | `400` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-style | ↑ `inherit` | `normal` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| line-height | ↑ `inherit` | `19.5px` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `inherit` | `rgb(232, 237, 241)` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| cursor | ↑ `default` | `default` | inherited · div.pb-igw · 2026-09-14-pins2-board-2/index.html:520 |


### `span.bad.pb-ct`

inside `.pb-igf` · 2 on screen · **1 look**

#### the one look

`G4-90` · rendered **82×12** · 2 instances look like this · text “1C6C7A8A9A” · title="Code lists 5 attachments, build has 4"

```html
<span class="pb-ct bad" title="Code lists 5 attachments, build has 4">1C6C7A8A9A</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-sm)/1 var(--data)` | `` | .pb-ct · 2026-09-14-pins2-board-2/index.html:484 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-ct · 2026-09-14-pins2-board-2/index.html:484 |
| font-size | `` | `12px` | .pb-ct · 2026-09-14-pins2-board-2/index.html:484 |
| font-weight | `` | `600` | .pb-ct · 2026-09-14-pins2-board-2/index.html:484 |
| font-style | `` | `normal` | .pb-ct · 2026-09-14-pins2-board-2/index.html:484 |
| font-variant-numeric | `` | `normal` | .pb-ct · 2026-09-14-pins2-board-2/index.html:484 |
| line-height | `` | `12px` | .pb-ct · 2026-09-14-pins2-board-2/index.html:484 |
| letter-spacing | `0.08em` | `0.96px` | .pb-ct · 2026-09-14-pins2-board-2/index.html:484 |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| text-decoration | `underline wavy color-mix(in srgb,var(--warn) 75%,transparent) 1px` | `` | .pb-ct.bad · 2026-09-14-pins2-board-2/index.html:485 |
| white-space | `nowrap` | `` | .pb-ct · 2026-09-14-pins2-board-2/index.html:484 |
| color | `var(--warn-ink)` | `rgb(255, 158, 114)` | .pb-ct.bad · 2026-09-14-pins2-board-2/index.html:485 |
| cursor | ↑ `copy` | `copy` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |


### `span.pb-igb`

inside `.pb-ig` · 15 on screen · **1 look**

#### the one look

`G4-91` · rendered **38×34** · 15 instances look like this

```html
<span class="pb-igb">⟨svg.ic.⟩</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-igb · 2026-09-14-pins2-board-2/index.html:523 |
| flex | `none` | `` | .pb-igb · 2026-09-14-pins2-board-2/index.html:523 |
| align-items | `center` | `center` | .pb-igb · 2026-09-14-pins2-board-2/index.html:523 |
| justify-content | `center` | `center` | .pb-igb · 2026-09-14-pins2-board-2/index.html:523 |
| place-items | `center` | `` | .pb-igb · 2026-09-14-pins2-board-2/index.html:523 |
| width | `38px` | `38px` | .pb-igb · 2026-09-14-pins2-board-2/index.html:523 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `0 7px 7px 0` | `` | .pb-igb · 2026-09-14-pins2-board-2/index.html:523 |
| background | `var(--raised)` | `` | .pb-igb · 2026-09-14-pins2-board-2/index.html:523 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-igb · 2026-09-14-pins2-board-2/index.html:523 |
| background-image | `` | `none` | .pb-igb · 2026-09-14-pins2-board-2/index.html:523 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-igb · 2026-09-14-pins2-board-2/index.html:523 |
| font | ↑ `inherit` | `` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-size | ↑ `inherit` | `13px` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-weight | ↑ `inherit` | `400` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-style | ↑ `inherit` | `normal` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| line-height | ↑ `inherit` | `19.5px` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-igb · 2026-09-14-pins2-board-2/index.html:523 |
| transition | `background .15s,color .15s` | `` | .pb-igb · 2026-09-14-pins2-board-2/index.html:523 |
| cursor | ↑ `copy` | `copy` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |


### `div.pb-acts`

inside `.pb-rb` · 17 on screen · **1 look**

#### the one look

`G4-93` · rendered **118×44** · 17 instances look like this

```html
<div class="pb-acts"><button class="pb-ib" data-copy="/gunsmiths search weapon:.50 GS build:1 visibility:Public" aria-label="Copy share command">⟨svg.ic.⟩</button><i class="pb-vr" aria-hidden="true"></i><button class="pb-ib pb-del" aria-label="Stage deletion of .50 GS build 1">⟨svg.ic.⟩</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-acts · 2026-09-14-pins2-board-2/index.html:114 |
| gap | `12px` | `` | .pb-acts · 2026-09-14-pins2-board-2/index.html:577 |
| column-gap | `12px` | `12px` | .pb-acts · 2026-09-14-pins2-board-2/index.html:577 |
| row-gap | `12px` | `12px` | .pb-acts · 2026-09-14-pins2-board-2/index.html:577 |
| align-items | `center` | `center` | .pb-acts · 2026-09-14-pins2-board-2/index.html:470 |
| align-self | `center` | `center` | .pb-rb > * · 2026-09-14-pins2-board-2/index.html:471 |
| justify-content | `flex-end` | `flex-end` | .pb-acts · 2026-09-14-pins2-board-2/index.html:114 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-right | `calc(-1 * var(--pb-inset))` | `-5px` | .pb-acts · 2026-09-14-pins2-board-2/index.html:503 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |


### `button.pb-ib`

inside `.pb-acts` · 17 on screen · **1 look**

#### the one look

`G4-94` · rendered **44×44** · 17 instances look like this · aria-label="Copy share command"

```html
<button class="pb-ib" data-copy="/gunsmiths search weapon:.50 GS build:1 visibility:Public" aria-label="Copy share command">⟨svg.ic.⟩</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| position | `relative` | `relative` | .pb-ib, .pb-fbtn · 2026-09-14-pins2-board-2/index.html:456 |
| flex | `none` | `` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| align-items | `center` | `center` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| place-items | `center` | `` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| width | `var(--tap)` | `44px` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| height | `var(--tap)` | `44px` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `var(--ctl-pad, 7px 10px)` | `` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-top | `` | `1px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-right | `` | `6px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-bottom | `` | `1px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-left | `` | `6px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| border | `0` | `` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| border-radius | `var(--rad-2)` | `` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| background | `none!important !important` | `` | .pb-ib, .pb-fbtn · 2026-09-14-pins2-board-2/index.html:456 |
| background-color | `initial !important !important` | `rgba(0, 0, 0, 0)` | .pb-ib, .pb-fbtn · 2026-09-14-pins2-board-2/index.html:456 |
| background-image | `none !important !important` | `none` | .pb-ib, .pb-fbtn · 2026-09-14-pins2-board-2/index.html:456 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `inherit` | `13px` | button · 2026-09-14-pins2-board/app.css:600 |
| font-weight | `inherit` | `400` | button · 2026-09-14-pins2-board/app.css:600 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `19.5px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| isolation | `isolate` | `isolate` | .pb-ib, .pb-fbtn · 2026-09-14-pins2-board-2/index.html:456 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| inset | `var(--pb-inset)` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:501 |
| top | `` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:501 |
| right | `` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:501 |
| bottom | `` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:501 |
| left | `` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:501 |
| border-radius | `8px` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| background | `var(--raised)` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| background-color | `` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| background-image | `` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| transition | `background .15s,box-shadow .15s` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| content | `""` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| z-index | `-1` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |

**:hover** — changes; parts inside it respond (table below)

| property | at rest | hover |
|---|---|---|
| color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |

| part inside | property | at rest | hover |
|---|---|---|---|
| ::before | color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| ::before | background-color | `rgb(31, 39, 46)` | `rgb(35, 44, 52)` |
| ::before | border-color | `rgb(133, 147, 159)` | `rgb(232, 237, 241)` |
| ::before | box-shadow | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | `color(srgb 0.909804 0.929412 0.945098 / 0.24) 0px 0px 0px 1px inset` |
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


### `i.pb-vr`

inside `.pb-acts` · 17 on screen · **1 look**

#### the one look

`G4-96` · rendered **1×24** · 17 instances look like this · aria-hidden="true"

```html
<i class="pb-vr" aria-hidden="true"></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .pb-vr · 2026-09-14-pins2-board-2/index.html:576 |
| align-self | `center` | `center` | .pb-vr · 2026-09-14-pins2-board-2/index.html:576 |
| width | `1px` | `1px` | .pb-vr · 2026-09-14-pins2-board-2/index.html:576 |
| height | `24px` | `24px` | .pb-vr · 2026-09-14-pins2-board-2/index.html:576 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| background | `var(--rule2)` | `` | .pb-vr · 2026-09-14-pins2-board-2/index.html:576 |
| background-color | `` | `rgb(58, 71, 82)` | .pb-vr · 2026-09-14-pins2-board-2/index.html:576 |
| background-image | `` | `none` | .pb-vr · 2026-09-14-pins2-board-2/index.html:576 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |


### `button.pb-del.pb-ib`

inside `.pb-acts` · 17 on screen · **1 look**

#### the one look

`G4-97` · rendered **44×44** · 17 instances look like this · aria-label="Stage deletion of .50 GS build 1"

```html
<button class="pb-ib pb-del" aria-label="Stage deletion of .50 GS build 1">⟨svg.ic.⟩</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| position | `relative` | `relative` | .pb-ib, .pb-fbtn · 2026-09-14-pins2-board-2/index.html:456 |
| flex | `none` | `` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| align-items | `center` | `center` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| place-items | `center` | `` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| width | `var(--tap)` | `44px` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| height | `var(--tap)` | `44px` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `var(--ctl-pad, 7px 10px)` | `` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-top | `` | `1px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-right | `` | `6px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-bottom | `` | `1px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding-left | `` | `6px` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| border | `0` | `` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| border-radius | `var(--rad-2)` | `` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| background | `none!important !important` | `` | .pb-ib, .pb-fbtn · 2026-09-14-pins2-board-2/index.html:456 |
| background-color | `initial !important !important` | `rgba(0, 0, 0, 0)` | .pb-ib, .pb-fbtn · 2026-09-14-pins2-board-2/index.html:456 |
| background-image | `none !important !important` | `none` | .pb-ib, .pb-fbtn · 2026-09-14-pins2-board-2/index.html:456 |
| font | `inherit` | `` | button · 2026-09-14-pins2-board/app.css:600 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `inherit` | `13px` | button · 2026-09-14-pins2-board/app.css:600 |
| font-weight | `inherit` | `400` | button · 2026-09-14-pins2-board/app.css:600 |
| font-style | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | `inherit` | `normal` | button · 2026-09-14-pins2-board/app.css:600 |
| line-height | `inherit` | `19.5px` | button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | .pb-ib · 2026-09-14-pins2-board-2/index.html:66 |
| isolation | `isolate` | `isolate` | .pb-ib, .pb-fbtn · 2026-09-14-pins2-board-2/index.html:456 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| inset | `var(--pb-inset)` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:501 |
| top | `` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:501 |
| right | `` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:501 |
| bottom | `` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:501 |
| left | `` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:501 |
| border-radius | `8px` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| background | `var(--raised)` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| background-color | `` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| background-image | `` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| transition | `background .15s,box-shadow .15s` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| content | `""` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |
| z-index | `-1` | .pb-ib::before, .pb-fbtn::before · 2026-09-14-pins2-board-2/index.html:457 |

**:hover** — changes; parts inside it respond (table below)

| property | at rest | hover |
|---|---|---|
| color | `rgb(133, 147, 159)` | `rgb(255, 138, 133)` |

| part inside | property | at rest | hover |
|---|---|---|---|
| ::before | color | `rgb(133, 147, 159)` | `rgb(255, 138, 133)` |
| ::before | background-color | `rgb(31, 39, 46)` | `color(srgb 0.244549 0.207294 0.228157)` |
| ::before | border-color | `rgb(133, 147, 159)` | `rgb(255, 138, 133)` |
| ::before | box-shadow | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | `color(srgb 1 0.541176 0.521569 / 0.45) 0px 0px 0px 1px inset` |
| ::before | outline-color | `rgb(133, 147, 159)` | `rgb(255, 138, 133)` |
| ::after | color | `rgb(133, 147, 159)` | `rgb(255, 138, 133)` |
| ::after | border-color | `rgb(133, 147, 159)` | `rgb(255, 138, 133)` |
| ::after | outline-color | `rgb(133, 147, 159)` | `rgb(255, 138, 133)` |
| svg.ic | color | `rgb(133, 147, 159)` | `rgb(255, 138, 133)` |
| svg.ic | border-color | `rgb(133, 147, 159)` | `rgb(255, 138, 133)` |
| svg.ic | outline-color | `rgb(133, 147, 159)` | `rgb(255, 138, 133)` |
| svg.ic | stroke | `rgb(133, 147, 159)` | `rgb(255, 138, 133)` |
| use | color | `rgb(133, 147, 159)` | `rgb(255, 138, 133)` |
| use | border-color | `rgb(133, 147, 159)` | `rgb(255, 138, 133)` |
| use | outline-color | `rgb(133, 147, 159)` | `rgb(255, 138, 133)` |
| use | stroke | `rgb(133, 147, 159)` | `rgb(255, 138, 133)` |

**:focus-visible** — changes

| property | at rest | focus-visible |
|---|---|---|
| outline-offset | `0px` | `2px` |
| box-shadow | `none` | `rgba(242, 194, 48, 0.16) 0px 0px 0px 5px` |

**:active** — changes

| property | at rest | active |
|---|---|---|
| transform | `none` | `matrix(0.985, 0, 0, 0.985, 0, 1)` |


### `div.pb-rb`

inside `.pb-g` · 11 on screen · **2 looks**

#### look 1 of 2

`G4-99` · rendered **1148×85** · 4 instances look like this

```html
<div class="pb-rb" data-row="6a4f2db36628dd173431326d"><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select .50 GS build 2"><span class="cb"></span></button><span class="pb-ix" data-why="Almost the same as another build">2</span><div class="pb-main"><div class="pb-rail"><span class="pb-at" title="Muzzle" style="--sl:var(--sl-muzzle)"><span>Monolithic Suppressor</span></span><span c
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| position | `relative` | `relative` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| grid-template-columns | `32px 28px minmax(0px, 1fr) 28px 144px 113px` | `32px 28px 707px 28px 144px 113px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:565 |
| column-gap | `12px` | `12px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:304 |
| align-items | `center` | `center` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| min-height | `52px` | `52px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:304 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px 0 20px` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-top | `0px` | `0px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-right | `16px` | `16px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-bottom | `0px` | `0px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-left | `20px` | `20px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| border-top | `1px solid var(--rule3)` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| transition | `background .18s` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| cursor | `pointer` | `pointer` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| width | `3px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| top | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| bottom | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| left | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background | `var(--c)` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background-color | `` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background-image | `` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| opacity | `0` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| transition | `opacity .18s` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| content | `""` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |

#### look 2 of 2

`G4-296` · rendered **1148×52** · 7 instances look like this

```html
<div class="pb-rb" data-row="6a4f1d9bc8a976469f4666ab"><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select BAL-27 build 2"><span class="cb"></span></button><span class="pb-ix" data-why="Almost the same as another build">2</span><div class="pb-main"><div class="pb-rail"><span class="pb-at" title="Muzzle" style="--sl:var(--sl-muzzle)"><span>Polarfire-S</span></span><span class="pb-a
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| position | `relative` | `relative` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| grid-template-columns | `32px 28px minmax(0px, 1fr) 28px 144px 113px` | `32px 28px 707px 28px 144px 113px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:565 |
| column-gap | `12px` | `12px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:304 |
| align-items | `center` | `center` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| min-height | `52px` | `52px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:304 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px 0 20px` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-top | `0px` | `0px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-right | `16px` | `16px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-bottom | `0px` | `0px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-left | `20px` | `20px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| border-top | `1px solid var(--rule3)` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| transition | `background .18s` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| cursor | `pointer` | `pointer` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| width | `3px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| top | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| bottom | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| left | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background | `var(--c)` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background-color | `` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background-image | `` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| opacity | `0` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| transition | `opacity .18s` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| content | `""` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |


### `span.pb-ct`

inside `.pb-igf` · 13 on screen · **1 look**

#### the one look

`G4-120` · rendered **82×12** · 13 instances look like this · text “1C2A7A8A9A”

```html
<span class="pb-ct">1C2A7A8A9A</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-sm)/1 var(--data)` | `` | .pb-ct · 2026-09-14-pins2-board-2/index.html:484 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-ct · 2026-09-14-pins2-board-2/index.html:484 |
| font-size | `` | `12px` | .pb-ct · 2026-09-14-pins2-board-2/index.html:484 |
| font-weight | `` | `600` | .pb-ct · 2026-09-14-pins2-board-2/index.html:484 |
| font-style | `` | `normal` | .pb-ct · 2026-09-14-pins2-board-2/index.html:484 |
| font-variant-numeric | `` | `normal` | .pb-ct · 2026-09-14-pins2-board-2/index.html:484 |
| line-height | `` | `12px` | .pb-ct · 2026-09-14-pins2-board-2/index.html:484 |
| letter-spacing | `0.08em` | `0.96px` | .pb-ct · 2026-09-14-pins2-board-2/index.html:484 |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| white-space | `nowrap` | `` | .pb-ct · 2026-09-14-pins2-board-2/index.html:484 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-ct · 2026-09-14-pins2-board-2/index.html:484 |
| cursor | ↑ `copy` | `copy` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |


### `span.no.pb-im[role=img]`

inside `.pb-rb` · 1 on screen · **1 look**

#### the one look

`G4-164` · rendered **28×28** · 1 instance look like this · aria-label="No image" role="img" title="No image"

```html
<span class="pb-im no" data-why="No image uploaded" role="img" aria-label="No image" title="No image">⟨svg.ic.⟩</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-im · 2026-09-14-pins2-board-2/index.html:327 |
| align-items | `center` | `center` | .pb-im · 2026-09-14-pins2-board-2/index.html:327 |
| align-self | `center` | `center` | .pb-rb > * · 2026-09-14-pins2-board-2/index.html:471 |
| place-items | `center` | `` | .pb-im · 2026-09-14-pins2-board-2/index.html:327 |
| width | `28px` | `28px` | .pb-im · 2026-09-14-pins2-board-2/index.html:327 |
| height | `28px` | `28px` | .pb-im · 2026-09-14-pins2-board-2/index.html:327 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | `var(--warn-ink)` | `rgb(255, 158, 114)` | .pb-im.no · 2026-09-14-pins2-board-2/index.html:498 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |


### `div.pb-main.pb-named`

inside `.pb-rb` · 3 on screen · **2 looks**

#### look 1 of 2

`G4-223` · rendered **707×84** · 2 instances look like this

```html
<div class="pb-main pb-named"><span class="pb-plate"><small>Build name</small><span title="Up to 32 characters">Close quarters</span></span><div class="pb-rail"><span class="pb-at" title="Barrel" style="--sl:var(--sl-barrel)"><span>MIP Quick Response Barrel</span></span><span class="pb-at" title="Stock" style="--sl:var(--sl-stock)"><span>OWC Skeleton Stock</span></span><span class="pb-at" title="Rear Grip" style="--s
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-main · 2026-09-14-pins2-board-2/index.html:314 |
| grid-template-columns | `auto minmax(0px, 1fr)` | `108.312px 578.688px` | .pb-main.pb-named · 2026-09-14-pins2-board-2/index.html:378 |
| gap | `6px` | `` | .pb-main · 2026-09-14-pins2-board-2/index.html:314 |
| column-gap | `20px` | `20px` | .pb-main.pb-named · 2026-09-14-pins2-board-2/index.html:573 |
| row-gap | `6px` | `6px` | .pb-main · 2026-09-14-pins2-board-2/index.html:314 |
| align-items | `center` | `center` | .pb-main.pb-named · 2026-09-14-pins2-board-2/index.html:378 |
| align-self | `center` | `center` | .pb-rb > * · 2026-09-14-pins2-board-2/index.html:471 |
| min-width | `0px` | `0px` | .pb-main · 2026-09-14-pins2-board-2/index.html:314 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `11px 0` | `` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| padding-top | `11px` | `11px` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| padding-right | `0px` | `0px` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| padding-bottom | `11px` | `11px` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| padding-left | `0px` | `0px` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

#### look 2 of 2

`G4-704` · rendered **707×65** · 1 instance look like this

```html
<div class="pb-main pb-named"><span class="pb-plate"><small>Build name</small><span title="Up to 32 characters">Coming Soon</span></span><div class="pb-rail"><span class="pb-at"><span>Coming soon — check back later!</span></span><span class="pb-at pb-atgap"><span>Empty</span></span><span class="pb-at pb-atgap"><span>Empty</span></span><span class="pb-at pb-atgap"><span>Empty</span></span><span class="pb-at pb-atgap">
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-main · 2026-09-14-pins2-board-2/index.html:314 |
| grid-template-columns | `auto minmax(0px, 1fr)` | `99.9844px 587.016px` | .pb-main.pb-named · 2026-09-14-pins2-board-2/index.html:378 |
| gap | `6px` | `` | .pb-main · 2026-09-14-pins2-board-2/index.html:314 |
| column-gap | `20px` | `20px` | .pb-main.pb-named · 2026-09-14-pins2-board-2/index.html:573 |
| row-gap | `6px` | `6px` | .pb-main · 2026-09-14-pins2-board-2/index.html:314 |
| align-items | `center` | `center` | .pb-main.pb-named · 2026-09-14-pins2-board-2/index.html:378 |
| align-self | `center` | `center` | .pb-rb > * · 2026-09-14-pins2-board-2/index.html:471 |
| min-width | `0px` | `0px` | .pb-main · 2026-09-14-pins2-board-2/index.html:314 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `11px 0` | `` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| padding-top | `11px` | `11px` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| padding-right | `0px` | `0px` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| padding-bottom | `11px` | `11px` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| padding-left | `0px` | `0px` | .pb-main · 2026-09-14-pins2-board-2/index.html:562 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |


### `span.pb-plate`

inside `.pb-main` · 3 on screen · **2 looks**

#### look 1 of 2

`G4-224` · rendered **108×43** · 2 instances look like this

```html
<span class="pb-plate"><small>Build name</small><span title="Up to 32 characters">Close quarters</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| position | `relative` | `relative` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| gap | `3px` | `` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| column-gap | `3px` | `3px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| row-gap | `3px` | `3px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| align-items | `center` | `center` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| align-self | `center` | `center` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| width | `auto` | `108.312px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:554 |
| max-width | `156px` | `156px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:554 |
| min-height | `0px` | `0px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| box-sizing | `border-box` | `border-box` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| padding | `7px 12px 8px` | `` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| padding-top | `7px` | `7px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| padding-right | `12px` | `12px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| padding-bottom | `8px` | `8px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| padding-left | `12px` | `12px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| border-radius | `6px` | `` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| background | `linear-gradient(100deg,color-mix(in srgb,var(--c) 22%,var(--raised)),color-mix(in srgb,var(--c) 7%,var(--raised)))` | `` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| background-color | `` | `rgba(0, 0, 0, 0)` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| background-image | `` | `linear-gradient(100deg, color(srgb 0.314824 0.170196 0.220078), color(srgb 0.183059 0.158431 0.19302))` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--c) 38%,transparent)` | `color(srgb 1 0.231373 0.360784 / 0.38) 0px 0px 0px 1px inset` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| font | `600 var(--t-sm)/1.2 var(--ui)` | `` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| font-size | `` | `12px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| font-weight | `` | `600` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| font-style | `` | `normal` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| font-variant-numeric | `` | `normal` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| line-height | `` | `14.4px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| letter-spacing | — | `normal` | initial |
| text-align | `left` | `left` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-plate::after · 2026-09-14-pins2-board-2/index.html:383 |
| width | `1px` | .pb-plate::after · 2026-09-14-pins2-board-2/index.html:383 |
| top | `0px` | .pb-plate::after · 2026-09-14-pins2-board-2/index.html:426 |
| right | `-10px` | .pb-plate::after · 2026-09-14-pins2-board-2/index.html:574 |
| bottom | `0px` | .pb-plate::after · 2026-09-14-pins2-board-2/index.html:426 |
| background | `var(--rule2)` | .pb-plate::after · 2026-09-14-pins2-board-2/index.html:383 |
| background-color | `` | .pb-plate::after · 2026-09-14-pins2-board-2/index.html:383 |
| background-image | `` | .pb-plate::after · 2026-09-14-pins2-board-2/index.html:383 |
| content | `""` | .pb-plate::after · 2026-09-14-pins2-board-2/index.html:383 |

#### look 2 of 2

`G4-705` · rendered **100×43** · 1 instance look like this

```html
<span class="pb-plate"><small>Build name</small><span title="Up to 32 characters">Coming Soon</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| position | `relative` | `relative` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| gap | `3px` | `` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| column-gap | `3px` | `3px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| row-gap | `3px` | `3px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| align-items | `center` | `center` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| align-self | `center` | `center` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| width | `auto` | `99.9844px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:554 |
| max-width | `156px` | `156px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:554 |
| min-height | `0px` | `0px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| box-sizing | `border-box` | `border-box` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| padding | `7px 12px 8px` | `` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| padding-top | `7px` | `7px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| padding-right | `12px` | `12px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| padding-bottom | `8px` | `8px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| padding-left | `12px` | `12px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| border-radius | `6px` | `` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| background | `linear-gradient(100deg,color-mix(in srgb,var(--c) 22%,var(--raised)),color-mix(in srgb,var(--c) 7%,var(--raised)))` | `` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| background-color | `` | `rgba(0, 0, 0, 0)` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| background-image | `` | `linear-gradient(100deg, color(srgb 0.314824 0.300471 0.195059), color(srgb 0.183059 0.199882 0.185059))` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--c) 38%,transparent)` | `color(srgb 1 0.823529 0.247059 / 0.38) 0px 0px 0px 1px inset` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| font | `600 var(--t-sm)/1.2 var(--ui)` | `` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| font-size | `` | `12px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| font-weight | `` | `600` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| font-style | `` | `normal` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| font-variant-numeric | `` | `normal` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| line-height | `` | `14.4px` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| letter-spacing | — | `normal` | initial |
| text-align | `left` | `left` | .pb-plate · 2026-09-14-pins2-board-2/index.html:423 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-plate · 2026-09-14-pins2-board-2/index.html:380 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-plate::after · 2026-09-14-pins2-board-2/index.html:383 |
| width | `1px` | .pb-plate::after · 2026-09-14-pins2-board-2/index.html:383 |
| top | `0px` | .pb-plate::after · 2026-09-14-pins2-board-2/index.html:426 |
| right | `-10px` | .pb-plate::after · 2026-09-14-pins2-board-2/index.html:574 |
| bottom | `0px` | .pb-plate::after · 2026-09-14-pins2-board-2/index.html:426 |
| background | `var(--rule2)` | .pb-plate::after · 2026-09-14-pins2-board-2/index.html:383 |
| background-color | `` | .pb-plate::after · 2026-09-14-pins2-board-2/index.html:383 |
| background-image | `` | .pb-plate::after · 2026-09-14-pins2-board-2/index.html:383 |
| content | `""` | .pb-plate::after · 2026-09-14-pins2-board-2/index.html:383 |


### `div.pb-hov.pb-rb`

inside `.pb-g` · 1 on screen · **1 look**

#### the one look

`G4-266` · rendered **1148×52** · 1 instance look like this

```html
<div class="pb-rb pb-hov" data-row="6a4f1d9bc8a976469f4666aa"><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select BAL-27 build 1"><span class="cb"></span></button><span class="pb-ix" data-why="Almost the same as another build">1</span><div class="pb-main"><div class="pb-rail"><span class="pb-at" title="Muzzle" style="--sl:var(--sl-muzzle)"><span>Gauge-9 Mono</span></span><span cla
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| position | `relative` | `relative` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| grid-template-columns | `32px 28px minmax(0px, 1fr) 28px 144px 113px` | `32px 28px 707px 28px 144px 113px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:565 |
| column-gap | `12px` | `12px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:304 |
| align-items | `center` | `center` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| min-height | `52px` | `52px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:304 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px 0 20px` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-top | `0px` | `0px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-right | `16px` | `16px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-bottom | `0px` | `0px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-left | `20px` | `20px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| border-top | `1px solid var(--rule3)` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| background | `radial-gradient(360px 80px at 14% 40%,color-mix(in srgb,var(--c) 16%,transparent),transparent 72%),radial-gradient(420px 100px at 76% 70%,color-mix(in srgb,var(--c) 7%,transparent),transparent 70%),radial-gradient(260px 70px at 46% 0,color-mix(in srgb,var(--realm-c) 6%,transparent),transparent 70%),var(--paper)` | `` | .pb-rb:hover, .pb-rb.pb-hov · 2026-09-14-pins2-board-2/index.html:117 |
| background-color | `` | `rgb(23, 30, 36)` | .pb-rb:hover, .pb-rb.pb-hov · 2026-09-14-pins2-board-2/index.html:117 |
| background-image | `` | `radial-gradient(360px 80px at 14% 40%, color(srgb 1 0.231373 0.360784 / 0.16), rgba(0, 0, 0, 0) 72%), radial-gradient(420px 100px at 76% 70%, color(srgb 1 0.231373 0.360784 / 0.07), rgba(0, 0, 0, 0) 70%), radial-gradient(260px 70px at 46% 0px, color(srgb 0.937255 0.266667 0.266667 / 0.06), rgba(0, 0, 0, 0) 70%), none` | .pb-rb:hover, .pb-rb.pb-hov · 2026-09-14-pins2-board-2/index.html:117 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| transition | `background .18s` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| cursor | `pointer` | `pointer` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| width | `3px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| top | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| bottom | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| left | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background | `var(--c)` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background-color | `` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background-image | `` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| opacity | `1` | .pb-rb:hover::before, .pb-rb.pb-hov::before · 2026-09-14-pins2-board-2/index.html:88 |
| transition | `opacity .18s` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| content | `""` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |


### `div.pb-igw`

inside `.pb-rb` · 2 on screen · **1 look**

#### the one look

`G4-615` · rendered **144×44** · 2 instances look like this

```html
<div class="pb-igw"><span class="pb-ig none"><span class="pb-igf"><span class="pb-cnone">⟨svg.ic.⟩No code</span></span></span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| align-items | `center` | `center` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| align-self | `center` | `center` | .pb-rb > * · 2026-09-14-pins2-board-2/index.html:471 |
| width | `100%` | `144px` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| min-height | `var(--tap)` | `44px` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0` | `` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| padding-top | `0px` | `0px` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| padding-right | `0px` | `0px` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| padding-bottom | `0px` | `0px` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| padding-left | `0px` | `0px` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| border | `0` | `` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| background | `none!important !important` | `` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| background-color | `initial !important !important` | `rgba(0, 0, 0, 0)` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| background-image | `none !important !important` | `none` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font | `inherit` | `` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-family | `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-size | `inherit` | `13px` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-weight | `inherit` | `400` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-style | `inherit` | `normal` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-variant-numeric | `inherit` | `normal` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| line-height | `inherit` | `19.5px` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| letter-spacing | — | `normal` | initial |
| color | `inherit` | `rgb(232, 237, 241)` | .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| cursor | `default` | `default` | div.pb-igw · 2026-09-14-pins2-board-2/index.html:520 |


### `span.none.pb-ig`

inside `.pb-igw` · 2 on screen · **1 look**

#### the one look

`G4-616` · rendered **144×34** · 2 instances look like this

```html
<span class="pb-ig none"><span class="pb-igf"><span class="pb-cnone">⟨svg.ic.⟩No code</span></span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-ig · 2026-09-14-pins2-board-2/index.html:521 |
| align-items | `stretch` | `stretch` | .pb-ig · 2026-09-14-pins2-board-2/index.html:521 |
| width | `100%` | `144px` | .pb-ig · 2026-09-14-pins2-board-2/index.html:521 |
| height | `34px` | `34px` | .pb-ig · 2026-09-14-pins2-board-2/index.html:521 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `7px` | `` | .pb-ig · 2026-09-14-pins2-board-2/index.html:521 |
| background | `none` | `` | .pb-ig.none · 2026-09-14-pins2-board-2/index.html:530 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-ig.none · 2026-09-14-pins2-board-2/index.html:530 |
| background-image | `none` | `none` | .pb-ig.none · 2026-09-14-pins2-board-2/index.html:530 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--warn) 35%,transparent)` | `color(srgb 1 0.478431 0.270588 / 0.35) 0px 0px 0px 1px inset` | .pb-ig.none · 2026-09-14-pins2-board-2/index.html:530 |
| font | ↑ `inherit` | `` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-size | ↑ `inherit` | `13px` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-weight | ↑ `inherit` | `400` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-style | ↑ `inherit` | `normal` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| line-height | ↑ `inherit` | `19.5px` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `inherit` | `rgb(232, 237, 241)` | inherited · .pb-igw · 2026-09-14-pins2-board-2/index.html:519 |
| cursor | ↑ `default` | `default` | inherited · div.pb-igw · 2026-09-14-pins2-board-2/index.html:520 |


### `span.pb-cnone`

inside `.pb-igf` · 2 on screen · **1 look**

#### the one look

`G4-618` · rendered **68×14** · 2 instances look like this

```html
<span class="pb-cnone">⟨svg.ic.⟩No code</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-cnone · 2026-09-14-pins2-board-2/index.html:492 |
| gap | `6px` | `` | .pb-cnone · 2026-09-14-pins2-board-2/index.html:492 |
| column-gap | `6px` | `6px` | .pb-cnone · 2026-09-14-pins2-board-2/index.html:492 |
| row-gap | `6px` | `6px` | .pb-cnone · 2026-09-14-pins2-board-2/index.html:492 |
| align-items | `center` | `center` | .pb-cnone · 2026-09-14-pins2-board-2/index.html:492 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .pb-cnone · 2026-09-14-pins2-board-2/index.html:492 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-cnone · 2026-09-14-pins2-board-2/index.html:492 |
| font-size | `` | `12px` | .pb-cnone · 2026-09-14-pins2-board-2/index.html:492 |
| font-weight | `` | `600` | .pb-cnone · 2026-09-14-pins2-board-2/index.html:492 |
| font-style | `` | `normal` | .pb-cnone · 2026-09-14-pins2-board-2/index.html:492 |
| font-variant-numeric | `` | `normal` | .pb-cnone · 2026-09-14-pins2-board-2/index.html:492 |
| line-height | `` | `12px` | .pb-cnone · 2026-09-14-pins2-board-2/index.html:492 |
| letter-spacing | — | `normal` | initial |
| color | `var(--warn-ink)` | `rgb(255, 158, 114)` | .pb-cnone · 2026-09-14-pins2-board-2/index.html:492 |
| cursor | ↑ `default` | `default` | inherited · div.pb-igw · 2026-09-14-pins2-board-2/index.html:520 |


### `span.pb-at.pb-atgap`

inside `.pb-rail` · 4 on screen · **1 look**

#### the one look

`G4-711` · rendered **57×28** · 4 instances look like this

```html
<span class="pb-at pb-atgap"><span>Empty</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| gap | `8px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| column-gap | `8px` | `8px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| row-gap | `8px` | `8px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| align-items | `center` | `center` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| min-width | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| height | `28px` | `28px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| box-sizing | `border-box` | `border-box` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding | `0 10px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-top | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-right | `10px` | `10px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-bottom | `0px` | `0px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| padding-left | `10px` | `10px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| border-radius | `6px` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| outline | `1px dashed color-mix(in srgb,var(--warn) 55%,transparent)` | `` | #g4man[data-av] .pb-rail > .pb-atgap · 2026-09-14-pins2-board-2/index.html:561 |
| outline-offset | `-1px` | `-1px` | #g4man[data-av] .pb-rail > .pb-atgap · 2026-09-14-pins2-board-2/index.html:561 |
| background | `none` | `` | #g4man[data-av] .pb-rail > .pb-atgap · 2026-09-14-pins2-board-2/index.html:561 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | #g4man[data-av] .pb-rail > .pb-atgap · 2026-09-14-pins2-board-2/index.html:561 |
| background-image | `none` | `none` | #g4man[data-av] .pb-rail > .pb-atgap · 2026-09-14-pins2-board-2/index.html:561 |
| box-shadow | `none` | `none` | #g4man[data-av] .pb-rail > .pb-atgap · 2026-09-14-pins2-board-2/index.html:561 |
| font | `500 var(--t-sm)/1 var(--ui)` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-size | `` | `12px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-weight | `` | `500` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-style | `` | `normal` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| font-variant-numeric | `` | `normal` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| line-height | `` | `12px` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| letter-spacing | — | `normal` | initial |
| text-decoration | `none` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:533 |
| white-space | `nowrap` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| color | `var(--warn-ink)` | `rgb(255, 158, 114)` | #g4man[data-av] .pb-rail > .pb-atgap · 2026-09-14-pins2-board-2/index.html:561 |
| transition | `box-shadow .18s,background .18s` | `` | #g4man[data-av] .pb-rail > .pb-at · 2026-09-14-pins2-board-2/index.html:558 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |


### `ul.pb-new`

inside `.pb-gate` · 1 on screen · **1 look**

#### the one look

`G4-732` · rendered **1148×179** · 1 instance look like this

```html
<ul class="pb-new"> <li><b>Set name</b> a plate with a “Build name” eyebrow, tw…</li> <li><b>Faults</b> the weapon lists the builds to fix; hov…</li> <li><b>Code</b> one field with the copy button joined t…</li> <li><b>Attachments</b> one quiet tag per name, wrapping freely…</li> <li><b>Examples</b> ARGUS’s missing image; the names “Close…</li> <li><b>Board only</b> ten MP weapons picked for variety; the …</li> </ul>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| grid-template-columns | `1fr 1fr` | `554px 554px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| column-gap | `40px` | `40px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0` | `` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| padding-top | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| padding-right | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| padding-bottom | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| padding-left | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| margin | `4px 0 0` | `` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| margin-top | `4px` | `4px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| margin-right | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| margin-bottom | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| margin-left | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `li`

inside `.pb-new` · 6 on screen · **2 looks**

#### look 1 of 2

`G4-733` · rendered **554×71** · 2 instances look like this

```html
<li><b>Set name</b> a plate with a “Build name” eyebrow, tw…</li>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| gap | `10px` | `` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| column-gap | `10px` | `10px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| row-gap | `10px` | `10px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `9px 0` | `` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| padding-top | `9px` | `9px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| padding-right | `0px` | `0px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| padding-bottom | `9px` | `9px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| padding-left | `0px` | `0px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| border-top | `1px solid var(--rule3)` | `` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| font-weight | — | `400` | initial |
| line-height | ⚠️ `1.45` | `17.4px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 · **a later rule wins — port the computed value and find that rule** |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |

#### look 2 of 2

`G4-737` · rendered **554×54** · 4 instances look like this

```html
<li><b>Code</b> one field with the copy button joined t…</li>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| gap | `10px` | `` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| column-gap | `10px` | `10px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| row-gap | `10px` | `10px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `9px 0` | `` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| padding-top | `9px` | `9px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| padding-right | `0px` | `0px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| padding-bottom | `9px` | `9px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| padding-left | `0px` | `0px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| border-top | `1px solid var(--rule3)` | `` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| font-weight | — | `400` | initial |
| line-height | ⚠️ `1.45` | `17.4px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 · **a later rule wins — port the computed value and find that rule** |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |


## G6 · Build name — resting


### G6 stage

16 distinct signatures on screen; 14 not already specced above.


### `div`

inside `.pb-head` · 8 on screen · **3 looks**

#### look 1 of 3

`G6-5` · rendered **0×0** · 1 instance look like this

```html
<div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 3

`G6-16` · rendered **132×72** · 1 instance look like this

```html
<div><span class="pb-w">BAL-27</span><small>stored → shown</small></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-bal > div · 2026-09-14-pins2-board-2/index.html:164 |
| gap | `6px` | `` | .pb-bal > div · 2026-09-14-pins2-board-2/index.html:164 |
| column-gap | `6px` | `6px` | .pb-bal > div · 2026-09-14-pins2-board-2/index.html:164 |
| row-gap | `6px` | `6px` | .pb-bal > div · 2026-09-14-pins2-board-2/index.html:164 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `12px 14px` | `` | .pb-bal > div · 2026-09-14-pins2-board-2/index.html:164 |
| padding-top | `12px` | `12px` | .pb-bal > div · 2026-09-14-pins2-board-2/index.html:164 |
| padding-right | `14px` | `14px` | .pb-bal > div · 2026-09-14-pins2-board-2/index.html:164 |
| padding-bottom | `12px` | `12px` | .pb-bal > div · 2026-09-14-pins2-board-2/index.html:164 |
| padding-left | `14px` | `14px` | .pb-bal > div · 2026-09-14-pins2-board-2/index.html:164 |
| background | `var(--raised)` | `` | .pb-bal > div:first-child · 2026-09-14-pins2-board-2/index.html:165 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-bal > div:first-child · 2026-09-14-pins2-board-2/index.html:165 |
| background-image | `` | `none` | .pb-bal > div:first-child · 2026-09-14-pins2-board-2/index.html:165 |
| box-shadow | `none` | `none` | .pb-bal > div:first-child · 2026-09-14-pins2-board-2/index.html:165 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 3 of 3

`G6-19` · rendered **203×72** · 5 instances look like this

```html
<div><small>1I2C4A8A9D</small><s>Build 2</s><b>1 / 5</b></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-bal > div · 2026-09-14-pins2-board-2/index.html:164 |
| gap | `6px` | `` | .pb-bal > div · 2026-09-14-pins2-board-2/index.html:164 |
| column-gap | `6px` | `6px` | .pb-bal > div · 2026-09-14-pins2-board-2/index.html:164 |
| row-gap | `6px` | `6px` | .pb-bal > div · 2026-09-14-pins2-board-2/index.html:164 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `12px 14px` | `` | .pb-bal > div · 2026-09-14-pins2-board-2/index.html:164 |
| padding-top | `12px` | `12px` | .pb-bal > div · 2026-09-14-pins2-board-2/index.html:164 |
| padding-right | `14px` | `14px` | .pb-bal > div · 2026-09-14-pins2-board-2/index.html:164 |
| padding-bottom | `12px` | `12px` | .pb-bal > div · 2026-09-14-pins2-board-2/index.html:164 |
| padding-left | `14px` | `14px` | .pb-bal > div · 2026-09-14-pins2-board-2/index.html:164 |
| box-shadow | `inset 1px 0 0 var(--rule3)` | `rgb(28, 36, 42) 1px 0px 0px 0px inset` | .pb-bal > div · 2026-09-14-pins2-board-2/index.html:164 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `p`

inside `.—` · 4 on screen · **2 looks**

#### look 1 of 2

`G6-10` · rendered **530×38** · 2 instances look like this · text “The row shows the derived number, and a name onl”

```html
<p>The row shows the derived number, and a …</p>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | p · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0` | `` | .pb-opt p · 2026-09-14-pins2-board-2/index.html:161 |
| margin-top | `0px` | `0px` | .pb-opt p · 2026-09-14-pins2-board-2/index.html:161 |
| margin-right | `0px` | `0px` | .pb-opt p · 2026-09-14-pins2-board-2/index.html:161 |
| margin-bottom | `0px` | `0px` | .pb-opt p · 2026-09-14-pins2-board-2/index.html:161 |
| margin-left | `0px` | `0px` | .pb-opt p · 2026-09-14-pins2-board-2/index.html:161 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-base)` | `13px` | .pb-opt p · 2026-09-14-pins2-board-2/index.html:161 |
| font-weight | — | `400` | initial |
| line-height | ⚠️ `1.45` | `18.85px` | .pb-opt p · 2026-09-14-pins2-board-2/index.html:161 · **a later rule wins — port the computed value and find that rule** |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-opt p · 2026-09-14-pins2-board-2/index.html:161 |

#### look 2 of 2

`G6-11` · rendered **530×19** · 1 instance look like this

```html
<p>One write on your yes: <code>1C2B5B6D7O</code> leaves FSS Hurricane’s name for its cod…</p>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | p · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0` | `` | .pb-opt p · 2026-09-14-pins2-board-2/index.html:161 |
| margin-top | `0px` | `0px` | .pb-opt p · 2026-09-14-pins2-board-2/index.html:161 |
| margin-right | `0px` | `0px` | .pb-opt p · 2026-09-14-pins2-board-2/index.html:161 |
| margin-bottom | `0px` | `0px` | .pb-opt p · 2026-09-14-pins2-board-2/index.html:161 |
| margin-left | `0px` | `0px` | .pb-opt p · 2026-09-14-pins2-board-2/index.html:161 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-base)` | `13px` | .pb-opt p · 2026-09-14-pins2-board-2/index.html:161 |
| font-weight | — | `400` | initial |
| line-height | ⚠️ `1.45` | `18.85px` | .pb-opt p · 2026-09-14-pins2-board-2/index.html:161 · **a later rule wins — port the computed value and find that rule** |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-opt p · 2026-09-14-pins2-board-2/index.html:161 |


### `div.pb-g6`

inside `.pb-gate` · 1 on screen · **1 look**

#### the one look

`G6-6` · rendered **1148×270** · 1 instance look like this

```html
<div class="pb-g6" id="g6"><div class="pb-opts"> <div class="pb-opt"><h4>Display-only labels <small>NOW</small></h4><p>The row shows the derived number, and a …</p><p>One write on your yes: <code>1C2B5B6D7O</code> leaves FSS Hurricane’s name for its cod…</p></div> <div class="pb-opt"><h4>Identity refactor <small>FILED [P1]</small></h4><p>Builds match on id and number, so the na…</p></div> </div> <div class="pb-bal"><
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-g6 · 2026-09-14-pins2-board-2/index.html:155 |
| gap | `14px` | `` | .pb-g6 · 2026-09-14-pins2-board-2/index.html:155 |
| column-gap | `14px` | `14px` | .pb-g6 · 2026-09-14-pins2-board-2/index.html:155 |
| row-gap | `14px` | `14px` | .pb-g6 · 2026-09-14-pins2-board-2/index.html:155 |
| width | `1148px` | `1148px` | .pb-g6 · 2026-09-14-pins2-board-2/index.html:155 |
| min-width | `1148px` | `1148px` | .pb-gate > .pb-man, .pb-gate > .pb-vb, .pb-gate > .pb-g1, .pb-gate > .pb-g6, .pb-gate > .p · 2026-09-14-pins2-board-2/index.html:464 |
| max-width | `100%` | `100%` | .pb-g6 · 2026-09-14-pins2-board-2/index.html:155 |
| box-sizing | `border-box` | `border-box` | .pb-gate > .pb-man, .pb-gate > .pb-vb, .pb-gate > .pb-g1, .pb-gate > .pb-g6, .pb-gate > .p · 2026-09-14-pins2-board-2/index.html:464 |
| margin | `0 auto` | `` | .pb-g6 · 2026-09-14-pins2-board-2/index.html:155 |
| margin-top | `0px` | `0px` | .pb-g6 · 2026-09-14-pins2-board-2/index.html:155 |
| margin-right | `auto` | `0px` | .pb-g6 · 2026-09-14-pins2-board-2/index.html:155 |
| margin-bottom | `0px` | `0px` | .pb-g6 · 2026-09-14-pins2-board-2/index.html:155 |
| margin-left | `auto` | `0px` | .pb-g6 · 2026-09-14-pins2-board-2/index.html:155 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-opts`

inside `.pb-g6` · 1 on screen · **1 look**

#### the one look

`G6-7` · rendered **1148×126** · 1 instance look like this

```html
<div class="pb-opts"> <div class="pb-opt"><h4>Display-only labels <small>NOW</small></h4><p>The row shows the derived number, and a …</p><p>One write on your yes: <code>1C2B5B6D7O</code> leaves FSS Hurricane’s name for its cod…</p></div> <div class="pb-opt"><h4>Identity refactor <small>FILED [P1]</small></h4><p>Builds match on id and number, so the na…</p></div> </div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-opts · 2026-09-14-pins2-board-2/index.html:156 |
| grid-template-columns | `1fr 1fr` | `574px 574px` | .pb-opts · 2026-09-14-pins2-board-2/index.html:156 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-3)` | `` | .pb-opts · 2026-09-14-pins2-board-2/index.html:156 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-opts · 2026-09-14-pins2-board-2/index.html:156 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-opts · 2026-09-14-pins2-board-2/index.html:156 |
| overflow-x | `hidden` | `hidden` | .pb-opts · 2026-09-14-pins2-board-2/index.html:156 |
| overflow-y | `hidden` | `hidden` | .pb-opts · 2026-09-14-pins2-board-2/index.html:156 |


### `div.pb-opt`

inside `.pb-opts` · 2 on screen · **2 looks**

#### look 1 of 2

`G6-8` · rendered **574×126** · 1 instance look like this

```html
<div class="pb-opt"><h4>Display-only labels <small>NOW</small></h4><p>The row shows the derived number, and a …</p><p>One write on your yes: <code>1C2B5B6D7O</code> leaves FSS Hurricane’s name for its cod…</p></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| gap | `8px` | `` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| column-gap | `8px` | `8px` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| row-gap | `8px` | `8px` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `18px 22px` | `` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| padding-top | `18px` | `18px` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| padding-right | `22px` | `22px` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| padding-bottom | `18px` | `18px` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| padding-left | `22px` | `22px` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| background | `var(--paper)` | `` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| background-color | `` | `rgb(23, 30, 36)` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| background-image | `` | `none` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G6-12` · rendered **574×126** · 1 instance look like this

```html
<div class="pb-opt"><h4>Identity refactor <small>FILED [P1]</small></h4><p>Builds match on id and number, so the na…</p></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| gap | `8px` | `` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| column-gap | `8px` | `8px` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| row-gap | `8px` | `8px` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `18px 22px` | `` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| padding-top | `18px` | `18px` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| padding-right | `22px` | `22px` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| padding-bottom | `18px` | `18px` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| padding-left | `22px` | `22px` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| background | `var(--paper)` | `` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| background-color | `` | `rgb(23, 30, 36)` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| background-image | `` | `none` | .pb-opt · 2026-09-14-pins2-board-2/index.html:157 |
| box-shadow | `inset 1px 0 0 var(--rule2)` | `rgb(58, 71, 82) 1px 0px 0px 0px inset` | .pb-opt + .pb-opt · 2026-09-14-pins2-board-2/index.html:158 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `small`

inside `.—` · 8 on screen · **2 looks**

#### look 1 of 2

`G6-9` · rendered **21×10** · 2 instances look like this · text “NOW”

```html
<small>NOW</small>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-micro)/1 var(--data)` | `` | .pb-opt h4 small · 2026-09-14-pins2-board-2/index.html:160 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-opt h4 small · 2026-09-14-pins2-board-2/index.html:160 |
| font-size | `` | `9.5px` | .pb-opt h4 small · 2026-09-14-pins2-board-2/index.html:160 |
| font-weight | `` | `600` | .pb-opt h4 small · 2026-09-14-pins2-board-2/index.html:160 |
| font-style | `` | `normal` | .pb-opt h4 small · 2026-09-14-pins2-board-2/index.html:160 |
| font-variant-numeric | `` | `normal` | .pb-opt h4 small · 2026-09-14-pins2-board-2/index.html:160 |
| line-height | `` | `9.5px` | .pb-opt h4 small · 2026-09-14-pins2-board-2/index.html:160 |
| letter-spacing | `0.14em` | `1.33px` | .pb-opt h4 small · 2026-09-14-pins2-board-2/index.html:160 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-opt h4 small · 2026-09-14-pins2-board-2/index.html:160 |

#### look 2 of 2

`G6-18` · rendered **104×12** · 6 instances look like this · text “stored → shown”

```html
<small>stored → shown</small>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `500 var(--t-sm)/1 var(--data)` | `` | .pb-bal small · 2026-09-14-pins2-board-2/index.html:167 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-bal small · 2026-09-14-pins2-board-2/index.html:167 |
| font-size | `` | `12px` | .pb-bal small · 2026-09-14-pins2-board-2/index.html:167 |
| font-weight | `` | `500` | .pb-bal small · 2026-09-14-pins2-board-2/index.html:167 |
| font-style | `` | `normal` | .pb-bal small · 2026-09-14-pins2-board-2/index.html:167 |
| font-variant-numeric | `` | `normal` | .pb-bal small · 2026-09-14-pins2-board-2/index.html:167 |
| line-height | `` | `12px` | .pb-bal small · 2026-09-14-pins2-board-2/index.html:167 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-bal small · 2026-09-14-pins2-board-2/index.html:167 |


### `div.pb-bal`

inside `.pb-g6` · 1 on screen · **1 look**

#### the one look

`G6-15` · rendered **1148×72** · 1 instance look like this

```html
<div class="pb-bal"><div><span class="pb-w">BAL-27</span><small>stored → shown</small></div><div><small>1I2C4A8A9D</small><s>Build 2</s><b>1 / 5</b></div><div><small>1C2C4A6A8A</small><s>Build 3</s><b>2 / 5</b></div><div><small>1M2C4A8A9D</small><s>Build 4</s><b>3 / 5</b></div><div><small>1C2B4A8A9C</small><s>Build 5</s><b>4 / 5</b></div><div><small>1I2C6B8A9D</small><s>Build 1</s><b>5 / 5</b></div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-bal · 2026-09-14-pins2-board-2/index.html:163 |
| grid-template-columns | `132px repeat(5, 1fr)` | `132px 203.188px 203.203px 203.203px 203.203px 203.188px` | .pb-bal · 2026-09-14-pins2-board-2/index.html:163 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-3)` | `` | .pb-bal · 2026-09-14-pins2-board-2/index.html:163 |
| background | `var(--paper)` | `` | .pb-bal · 2026-09-14-pins2-board-2/index.html:163 |
| background-color | `` | `rgb(23, 30, 36)` | .pb-bal · 2026-09-14-pins2-board-2/index.html:163 |
| background-image | `` | `none` | .pb-bal · 2026-09-14-pins2-board-2/index.html:163 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-bal · 2026-09-14-pins2-board-2/index.html:163 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-bal · 2026-09-14-pins2-board-2/index.html:163 |
| overflow-x | `hidden` | `hidden` | .pb-bal · 2026-09-14-pins2-board-2/index.html:163 |
| overflow-y | `hidden` | `hidden` | .pb-bal · 2026-09-14-pins2-board-2/index.html:163 |


### `span.pb-w`

inside `.—` · 1 on screen · **1 look**

#### the one look

`G6-17` · rendered **104×16** · 1 instance look like this · text “BAL-27”

```html
<span class="pb-w">BAL-27</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-base)/1.2 var(--ui)` | `` | .pb-bal .pb-w · 2026-09-14-pins2-board-2/index.html:166 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-bal .pb-w · 2026-09-14-pins2-board-2/index.html:166 |
| font-size | `` | `13px` | .pb-bal .pb-w · 2026-09-14-pins2-board-2/index.html:166 |
| font-weight | `` | `600` | .pb-bal .pb-w · 2026-09-14-pins2-board-2/index.html:166 |
| font-style | `` | `normal` | .pb-bal .pb-w · 2026-09-14-pins2-board-2/index.html:166 |
| font-variant-numeric | `` | `normal` | .pb-bal .pb-w · 2026-09-14-pins2-board-2/index.html:166 |
| line-height | `` | `15.6px` | .pb-bal .pb-w · 2026-09-14-pins2-board-2/index.html:166 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-bal .pb-w · 2026-09-14-pins2-board-2/index.html:166 |


### `b`

inside `.—` · 5 on screen · **1 look**

#### the one look

`G6-21` · rendered **175×12** · 5 instances look like this · text “1 / 5”

```html
<b>1 / 5</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 var(--t-sm)/1 var(--data)` | `` | .pb-bal b · 2026-09-14-pins2-board-2/index.html:169 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-bal b · 2026-09-14-pins2-board-2/index.html:169 |
| font-size | `` | `12px` | .pb-bal b · 2026-09-14-pins2-board-2/index.html:169 |
| font-weight | `` | `700` | .pb-bal b · 2026-09-14-pins2-board-2/index.html:169 |
| font-style | `` | `normal` | .pb-bal b · 2026-09-14-pins2-board-2/index.html:169 |
| font-variant-numeric | `` | `normal` | .pb-bal b · 2026-09-14-pins2-board-2/index.html:169 |
| line-height | `` | `12px` | .pb-bal b · 2026-09-14-pins2-board-2/index.html:169 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-bal b · 2026-09-14-pins2-board-2/index.html:169 |


### `details.pb-disc`

inside `.pb-g6` · 1 on screen · **1 look**

#### the one look

`G6-34` · rendered **1148×44** · 1 instance look like this

```html
<details class="pb-disc"><summary>⟨svg.ic.⟩16 places read buildName · 12 m…</summary> <table class="pb-tbl"><thead><tr><th>Use</th><th>File</th><th>What it does</th></tr></thead><tbody> <tr><td><span class="pb-use id">IDENTITY</span></td><td><code>core/ops/loadouts.js</code></td><td>add/edit/bulk-upsert match existing docs…</td></tr><tr><td><span class="pb-use id">IDENTITY</span></td><td><code>portal/api/bulk.js</cod
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | details · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-3)` | `` | .pb-disc · 2026-09-14-pins2-board-2/index.html:170 |
| background | `var(--paper)` | `` | .pb-disc · 2026-09-14-pins2-board-2/index.html:170 |
| background-color | `` | `rgb(23, 30, 36)` | .pb-disc · 2026-09-14-pins2-board-2/index.html:170 |
| background-image | `` | `none` | .pb-disc · 2026-09-14-pins2-board-2/index.html:170 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-disc · 2026-09-14-pins2-board-2/index.html:170 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `svg.ic`

inside `.—` · 1 on screen · **1 look**

#### the one look

`G6-35` · rendered **16×16** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-down"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `16px` | `16px` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| height | `16px` | `16px` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `600 var(--t-base)/1 var(--ui)` | `` | inherited · .pb-disc summary · 2026-09-14-pins2-board-2/index.html:171 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-disc summary · 2026-09-14-pins2-board-2/index.html:171 |
| font-size | ↑ `` | `13px` | inherited · .pb-disc summary · 2026-09-14-pins2-board-2/index.html:171 |
| font-weight | ↑ `` | `600` | inherited · .pb-disc summary · 2026-09-14-pins2-board-2/index.html:171 |
| font-style | ↑ `` | `normal` | inherited · .pb-disc summary · 2026-09-14-pins2-board-2/index.html:171 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-disc summary · 2026-09-14-pins2-board-2/index.html:171 |
| line-height | ↑ `` | `13px` | inherited · .pb-disc summary · 2026-09-14-pins2-board-2/index.html:171 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-disc summary · 2026-09-14-pins2-board-2/index.html:171 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| transition | `transform .2s` | `` | .pb-disc summary .ic · 2026-09-14-pins2-board-2/index.html:173 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-disc summary · 2026-09-14-pins2-board-2/index.html:171 |


### `table.pb-tbl`

inside `.pb-disc` · 1 on screen · **1 look**

#### the one look

`G6-36` · rendered **1148×752** · 1 instance look like this

```html
<table class="pb-tbl"><thead><tr><th>Use</th><th>File</th><th>What it does</th></tr></thead><tbody> <tr><td><span class="pb-use id">IDENTITY</span></td><td><code>core/ops/loadouts.js</code></td><td>add/edit/bulk-upsert match existing docs…</td></tr><tr><td><span class="pb-use id">IDENTITY</span></td><td><code>portal/api/bulk.js</code></td><td>the bulk-paste preview decides update-vs…</td></tr><tr><td><span class="pb-
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `table` | `table` | table · user-agent:? |
| width | `100%` | `1148px` | .pb-tbl · 2026-09-14-pins2-board-2/index.html:175 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | .pb-tbl · 2026-09-14-pins2-board-2/index.html:175 |
| font-weight | `normal` | `400` | table · user-agent:? |
| line-height | `normal` | `normal` | table · user-agent:? |
| letter-spacing | — | `normal` | initial |
| text-align | `start` | `start` | table · user-agent:? |
| color | `-internal-quirk-inherit` | `rgb(232, 237, 241)` | table · user-agent:? |


### `span.id.pb-use`

inside `.—` · 12 on screen · **1 look**

#### the one look

`G6-37` · rendered **52×13** · 12 instances look like this · text “IDENTITY”

```html
<span class="pb-use id">IDENTITY</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `inline` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 var(--t-micro)/1 var(--data)` | `` | .pb-use · 2026-09-14-pins2-board-2/index.html:179 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-use · 2026-09-14-pins2-board-2/index.html:179 |
| font-size | `` | `9.5px` | .pb-use · 2026-09-14-pins2-board-2/index.html:179 |
| font-weight | `` | `700` | .pb-use · 2026-09-14-pins2-board-2/index.html:179 |
| font-style | `` | `normal` | .pb-use · 2026-09-14-pins2-board-2/index.html:179 |
| font-variant-numeric | `` | `normal` | .pb-use · 2026-09-14-pins2-board-2/index.html:179 |
| line-height | `` | `9.5px` | .pb-use · 2026-09-14-pins2-board-2/index.html:179 |
| letter-spacing | `0.08em` | `0.76px` | .pb-use · 2026-09-14-pins2-board-2/index.html:179 |
| text-align | ↑ `start` | `start` | inherited · table · user-agent:? |
| color | `var(--warn-ink)` | `rgb(255, 158, 114)` | .pb-use.id · 2026-09-14-pins2-board-2/index.html:180 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |


### `span.dp.pb-use`

inside `.—` · 8 on screen · **1 look**

#### the one look

`G6-40` · rendered **45×13** · 8 instances look like this · text “DISPLAY”

```html
<span class="pb-use dp">DISPLAY</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `inline` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 var(--t-micro)/1 var(--data)` | `` | .pb-use · 2026-09-14-pins2-board-2/index.html:179 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-use · 2026-09-14-pins2-board-2/index.html:179 |
| font-size | `` | `9.5px` | .pb-use · 2026-09-14-pins2-board-2/index.html:179 |
| font-weight | `` | `700` | .pb-use · 2026-09-14-pins2-board-2/index.html:179 |
| font-style | `` | `normal` | .pb-use · 2026-09-14-pins2-board-2/index.html:179 |
| font-variant-numeric | `` | `normal` | .pb-use · 2026-09-14-pins2-board-2/index.html:179 |
| line-height | `` | `9.5px` | .pb-use · 2026-09-14-pins2-board-2/index.html:179 |
| letter-spacing | `0.08em` | `0.76px` | .pb-use · 2026-09-14-pins2-board-2/index.html:179 |
| text-align | ↑ `start` | `start` | inherited · table · user-agent:? |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-use.dp · 2026-09-14-pins2-board-2/index.html:180 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |


## G11 · Broadcast and History manifests — resting


### G11 stage

39 distinct signatures on screen; 27 not already specced above.


### `span.pb-gid`

inside `.pb-head` · 1 on screen · **1 look**

#### the one look

`G11-2` · rendered **54×48** · 1 instance look like this · text “G11”

```html
<span class="pb-gid">G11</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 60px/.8 var(--display)` | `` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-family | `` | `"Big Shoulders Display", "Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-size | `` | `60px` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-weight | `` | `700` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-style | `` | `normal` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-variant-numeric | `` | `normal` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| line-height | `` | `48px` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| letter-spacing | — | `normal` | initial |
| color | `var(--realm-c)` | `rgb(236, 72, 153)` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |


### `div.pb-seg.seg`

inside `.pb-ctl` · 1 on screen · **1 look**

#### the one look

`G11-6` · rendered **167×42** · 1 instance look like this

```html
<div class="seg pb-seg" data-seg="bstaged"><span class="pb-thumb" style="width: 63px; transform: translateX(3px);"></span><button data-v="off" aria-pressed="true">Saved</button><button data-v="on" aria-pressed="false">One staged</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-seg.seg · 2026-09-14-pins2-board-2/index.html:17 |
| position | `relative` | `relative` | .pb-seg.seg · 2026-09-14-pins2-board-2/index.html:17 |
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
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-man`

inside `.pb-gate` · 2 on screen · **2 looks**

#### look 1 of 2

`G11-8` · rendered **1148×423** · 1 instance look like this

```html
<div class="pb-man" id="g11bc" data-ss="tab"><div class="pb-tools"><div class="pb-t1"><span class="pb-lab">Manifest</span><label class="pb-srch">⟨svg.ic.⟩<input placeholder="Search the text" aria-label="Search the text"></label><button class="chip go pb-add">⟨svg.ic.⟩Post announcement</button></div><div class="pb-t2"><span class="pb-grp"><span class="pb-lab">State</span><button class="chip" data-bs="ALL" aria-pressed
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| width | `1148px` | `1148px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| min-width | `1148px` | `1148px` | .pb-gate > .pb-man, .pb-gate > .pb-vb, .pb-gate > .pb-g1, .pb-gate > .pb-g6, .pb-gate > .p · 2026-09-14-pins2-board-2/index.html:464 |
| max-width | `100%` | `100%` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| box-sizing | `border-box` | `border-box` | .pb-gate > .pb-man, .pb-gate > .pb-vb, .pb-gate > .pb-g1, .pb-gate > .pb-g6, .pb-gate > .p · 2026-09-14-pins2-board-2/index.html:464 |
| margin | `0 auto` | `` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| margin-top | `0px` | `0px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| margin-right | `auto` | `0px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| margin-bottom | `0px` | `0px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| margin-left | `auto` | `0px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| border-radius | `var(--rad-3)` | `` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| background | `var(--paper)` | `` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| background-color | `` | `rgb(23, 30, 36)` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| background-image | `` | `none` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| overflow-x | `hidden` | `hidden` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| overflow-y | `hidden` | `hidden` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |

#### look 2 of 2

`G11-91` · rendered **1148×191** · 1 instance look like this

```html
<div class="pb-man" id="g11hist" style="--realm-c:var(--r-history)" data-ss="tab"><div class="pb-tools"><div class="pb-t1"><span class="pb-lab">Events</span><label class="pb-srch">⟨svg.ic.⟩<input value="online" aria-label="Search events"><span class="pb-hits">5 matches</span></label></div><div class="pb-t2"><span class="pb-grp"><span class="pb-lab">Kind</span><button class="chip" aria-pressed="true">All</button><butt
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| width | `1148px` | `1148px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| min-width | `1148px` | `1148px` | .pb-gate > .pb-man, .pb-gate > .pb-vb, .pb-gate > .pb-g1, .pb-gate > .pb-g6, .pb-gate > .p · 2026-09-14-pins2-board-2/index.html:464 |
| max-width | `100%` | `100%` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| box-sizing | `border-box` | `border-box` | .pb-gate > .pb-man, .pb-gate > .pb-vb, .pb-gate > .pb-g1, .pb-gate > .pb-g6, .pb-gate > .p · 2026-09-14-pins2-board-2/index.html:464 |
| margin | `0 auto` | `` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| margin-top | `0px` | `0px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| margin-right | `auto` | `0px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| margin-bottom | `0px` | `0px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| margin-left | `auto` | `0px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| border-radius | `var(--rad-3)` | `` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| background | `var(--paper)` | `` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| background-color | `` | `rgb(23, 30, 36)` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| background-image | `` | `none` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| overflow-x | `hidden` | `hidden` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| overflow-y | `hidden` | `hidden` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |


### `div.pb-tools`

inside `.pb-man` · 2 on screen · **1 look**

#### the one look

`G11-9` · rendered **1148×122** · 2 instances look like this

```html
<div class="pb-tools"><div class="pb-t1"><span class="pb-lab">Manifest</span><label class="pb-srch">⟨svg.ic.⟩<input placeholder="Search the text" aria-label="Search the text"></label><button class="chip go pb-add">⟨svg.ic.⟩Post announcement</button></div><div class="pb-t2"><span class="pb-grp"><span class="pb-lab">State</span><button class="chip" data-bs="ALL" aria-pressed="true">All</button><button class="chip topic
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| gap | `12px` | `` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| column-gap | `12px` | `12px` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| row-gap | `12px` | `12px` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `14px 16px` | `` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| padding-top | `14px` | `14px` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| padding-right | `16px` | `16px` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| padding-bottom | `14px` | `14px` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| padding-left | `16px` | `16px` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| border-bottom | `1px solid var(--rule)` | `` | .pb-tools · 2026-09-14-pins2-board-2/index.html:36 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `svg.ic`

inside `.pb-srch` · 18 on screen · **6 looks**

#### look 1 of 6

`G11-32` · rendered **13×13** · 4 instances look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-sort"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `13px` | `13px` | .pb-sort .ic · 2026-09-14-pins2-board-2/index.html:58 |
| height | `13px` | `13px` | .pb-sort .ic · 2026-09-14-pins2-board-2/index.html:58 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `inherit` | `` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-family | ↑ `inherit` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-size | ↑ `inherit` | `9.5px` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-weight | ↑ `inherit` | `600` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-style | ↑ `inherit` | `normal` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| line-height | ↑ `inherit` | `9.5px` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| letter-spacing | ↑ `inherit` | `1.33px` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| text-transform | ↑ `inherit` | `uppercase` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `inherit` | `rgb(133, 147, 159)` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| pointer-events | `none` | `none` | button .ic, a .ic · 2026-09-14-pins2-board/app.css:6172 |

#### look 2 of 6

`G11-54` · rendered **14×14** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-done"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `14px` | `14px` | .pb-life .ic · 2026-09-14-pins2-board-2/index.html:194 |
| height | `14px` | `14px` | .pb-life .ic · 2026-09-14-pins2-board-2/index.html:194 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `600 var(--t-sm)/1 var(--ui)` | `` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-size | ↑ `` | `12px` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-weight | ↑ `` | `600` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-style | ↑ `` | `normal` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| line-height | ↑ `` | `12px` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| letter-spacing | — | `normal` | initial |
| white-space | ↑ `nowrap` | `` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| color | ↑ `var(--lc)` | `rgb(133, 147, 159)` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |

#### look 3 of 6

`G11-64` · rendered **16×16** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-infinity"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `16px` | `16px` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| height | `16px` | `16px` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 var(--t-sm)/1 var(--data)` | `` | inherited · .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-size | ↑ `` | `12px` | inherited · .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-weight | ↑ `600` | `600` | inherited · .pb-dt.pb-never · 2026-09-14-pins2-board-2/index.html:192 |
| font-style | ↑ `` | `normal` | inherited · .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| line-height | ↑ `` | `12px` | inherited · .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| letter-spacing | — | `normal` | initial |
| white-space | ↑ `nowrap` | `` | inherited · .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| color | ↑ `var(--warn-ink)` | `rgb(255, 158, 114)` | inherited · .pb-dt.pb-never · 2026-09-14-pins2-board-2/index.html:192 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |

#### look 4 of 6

`G11-66` · rendered **14×14** · 2 instances look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-radio"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `14px` | `14px` | .pb-life .ic · 2026-09-14-pins2-board-2/index.html:194 |
| height | `14px` | `14px` | .pb-life .ic · 2026-09-14-pins2-board-2/index.html:194 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `600 var(--t-sm)/1 var(--ui)` | `` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-size | ↑ `` | `12px` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-weight | ↑ `` | `600` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-style | ↑ `` | `normal` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| line-height | ↑ `` | `12px` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| letter-spacing | — | `normal` | initial |
| white-space | ↑ `nowrap` | `` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| color | ↑ `var(--lc)` | `rgb(123, 219, 99)` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |

#### look 5 of 6

`G11-88` · rendered **14×14** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-calendar"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `14px` | `14px` | .pb-life .ic · 2026-09-14-pins2-board-2/index.html:194 |
| height | `14px` | `14px` | .pb-life .ic · 2026-09-14-pins2-board-2/index.html:194 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `600 var(--t-sm)/1 var(--ui)` | `` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-size | ↑ `` | `12px` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-weight | ↑ `` | `600` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-style | ↑ `` | `normal` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| line-height | ↑ `` | `12px` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| letter-spacing | — | `normal` | initial |
| white-space | ↑ `nowrap` | `` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| color | ↑ `var(--lc)` | `rgb(166, 128, 251)` | inherited · .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |

#### look 6 of 6

`G11-141` · rendered **16×16** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-older"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `16px` | `16px` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| height | `16px` | `16px` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
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


### `div.pb-t2`

inside `.pb-tools` · 2 on screen · **1 look**

#### the one look

`G11-16` · rendered **1116×32** · 2 instances look like this

```html
<div class="pb-t2"><span class="pb-grp"><span class="pb-lab">State</span><button class="chip" data-bs="ALL" aria-pressed="true">All</button><button class="chip topic" data-bs="live" style="--c:var(--ok)" aria-pressed="false"><i></i>Live now <em>2</em></button><button class="chip topic" data-bs="upcoming" style="--c:var(--sched)" aria-pressed="false"><i></i>Upcoming <em>1</em></button><button class="chip topic" data-b
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-t1, .pb-t2 · 2026-09-14-pins2-board-2/index.html:37 |
| gap | `10px` | `` | .pb-t1, .pb-t2 · 2026-09-14-pins2-board-2/index.html:37 |
| column-gap | `10px` | `10px` | .pb-t1, .pb-t2 · 2026-09-14-pins2-board-2/index.html:37 |
| row-gap | `10px` | `10px` | .pb-t2 · 2026-09-14-pins2-board-2/index.html:38 |
| flex-wrap | `wrap` | `wrap` | .pb-t2 · 2026-09-14-pins2-board-2/index.html:38 |
| align-items | `center` | `center` | .pb-t1, .pb-t2 · 2026-09-14-pins2-board-2/index.html:37 |
| min-width | `0px` | `0px` | .pb-t1, .pb-t2 · 2026-09-14-pins2-board-2/index.html:37 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-grp`

inside `.pb-t2` · 3 on screen · **1 look**

#### the one look

`G11-108` · rendered **541×32** · 1 instance look like this

```html
<span class="pb-grp"><span class="pb-lab">Level</span><button class="chip" data-lv="ALL" aria-pressed="true">All</button><button class="chip pb-lv" data-lv="error" style="--sv:var(--danger-ink)" aria-pressed="false"><span class="pb-sev" data-n="4"><i></i><i></i><i></i><i></i></span>error <em>16</em></button><button class="chip pb-lv" data-lv="warn" style="--sv:var(--warn-ink)" aria-pressed="false" disabled=""><span c
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-grp · 2026-09-14-pins2-board-2/index.html:39 |
| gap | `8px` | `` | .pb-grp · 2026-09-14-pins2-board-2/index.html:513 |
| column-gap | `8px` | `8px` | .pb-grp · 2026-09-14-pins2-board-2/index.html:513 |
| row-gap | `8px` | `8px` | .pb-grp · 2026-09-14-pins2-board-2/index.html:513 |
| align-items | `center` | `center` | .pb-grp · 2026-09-14-pins2-board-2/index.html:39 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-left | `16px` | `16px` | .pb-grp + .pb-grp · 2026-09-14-pins2-board-2/index.html:517 |
| margin-left | `6px` | `6px` | .pb-grp + .pb-grp · 2026-09-14-pins2-board-2/index.html:549 |
| box-shadow | `inset 1px 0 0 var(--rule2)` | `rgb(58, 71, 82) 1px 0px 0px 0px inset` | .pb-grp + .pb-grp · 2026-09-14-pins2-board-2/index.html:40 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `button.chip`

inside `.pb-grp` · 4 on screen · **1 look**

#### the one look

`G11-140` · rendered **245×44** · 1 instance look like this

```html
<button class="chip">⟨svg.ic.⟩Load older events <em>1,312 more</em></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-more .chip · 2026-09-14-pins2-board-2/index.html:61 |
| gap | `8px` | `` | .pb-more .chip · 2026-09-14-pins2-board-2/index.html:61 |
| column-gap | `8px` | `8px` | .pb-more .chip · 2026-09-14-pins2-board-2/index.html:61 |
| row-gap | `8px` | `8px` | .pb-more .chip · 2026-09-14-pins2-board-2/index.html:61 |
| align-items | `center` | `center` | .pb-more .chip · 2026-09-14-pins2-board-2/index.html:61 |
| justify-content | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| min-height | `var(--tap)` | `44px` | .pb-more .chip · 2026-09-14-pins2-board-2/index.html:61 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `0 18px` | `` | .pb-more .chip · 2026-09-14-pins2-board-2/index.html:61 |
| padding-top | `0px` | `0px` | .pb-more .chip · 2026-09-14-pins2-board-2/index.html:61 |
| padding-right | `18px` | `18px` | .pb-more .chip · 2026-09-14-pins2-board-2/index.html:61 |
| padding-bottom | `0px` | `0px` | .pb-more .chip · 2026-09-14-pins2-board-2/index.html:61 |
| padding-left | `18px` | `18px` | .pb-more .chip · 2026-09-14-pins2-board-2/index.html:61 |
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


### `i`

inside `.chip` · 22 on screen · **18 looks**

#### look 1 of 18

`G11-21` · rendered **8×8** · 1 instance look like this

```html
<i></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| width | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| height | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background | `var(--c)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-color | `` | `rgb(123, 219, 99)` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-image | `` | `none` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-shadow | `0 0 0 1px var(--scrim-40)` | `rgba(0, 0, 0, 0.4) 0px 0px 0px 1px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | ↑ `600` | `600` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `18px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · 2026-09-14-pins2-board/app.css:600 |

#### look 2 of 18

`G11-24` · rendered **8×8** · 2 instances look like this

```html
<i></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| width | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| height | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background | `var(--c)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-color | `` | `rgb(166, 128, 251)` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-image | `` | `none` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-shadow | `0 0 0 1px var(--scrim-40)` | `rgba(0, 0, 0, 0.4) 0px 0px 0px 1px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | ↑ `600` | `600` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `18px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · 2026-09-14-pins2-board/app.css:600 |

#### look 3 of 18

`G11-27` · rendered **8×8** · 1 instance look like this

```html
<i></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| width | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| height | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background | `var(--c)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-color | `` | `rgb(133, 147, 159)` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-image | `` | `none` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-shadow | `0 0 0 1px var(--scrim-40)` | `rgba(0, 0, 0, 0.4) 0px 0px 0px 1px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | ↑ `600` | `600` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `18px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · 2026-09-14-pins2-board/app.css:600 |

#### look 4 of 18

`G11-103` · rendered **8×8** · 1 instance look like this

```html
<i></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| width | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| height | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background | `var(--c)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-color | `` | `rgb(64, 154, 208)` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-image | `` | `none` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-shadow | `0 0 0 1px var(--scrim-40)` | `rgba(0, 0, 0, 0.4) 0px 0px 0px 1px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | ↑ `600` | `600` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `18px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · 2026-09-14-pins2-board/app.css:600 |

#### look 5 of 18

`G11-105` · rendered **8×8** · 1 instance look like this

```html
<i></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| flex | `none` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| width | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| height | `8px` | `8px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background | `var(--c)` | `` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-color | `` | `rgb(255, 122, 69)` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| background-image | `` | `none` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| box-shadow | `0 0 0 1px var(--scrim-40)` | `rgba(0, 0, 0, 0.4) 0px 0px 0px 1px` | .chip.topic i · 2026-09-14-pins2-board/app.css:2041 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | ↑ `600` | `600` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `18px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · 2026-09-14-pins2-board/app.css:600 |

#### look 6 of 18

`G11-113` · rendered **3×4** · 1 instance look like this

```html
<i></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| width | `3px` | `3px` | .pb-sev i · 2026-09-14-pins2-board-2/index.html:199 |
| height | `4px` | `4px` | .pb-sev i:nth-child(1) · 2026-09-14-pins2-board-2/index.html:200 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `1px` | `` | .pb-sev i · 2026-09-14-pins2-board-2/index.html:199 |
| background | `var(--sv)` | `` | .pb-sev[data-n="1"] i:nth-child(-n+1), .pb-sev[data-n="2"] i:nth-child(-n+2), .pb-sev[data · 2026-09-14-pins2-board-2/index.html:201 |
| background-color | `` | `rgb(255, 138, 133)` | .pb-sev[data-n="1"] i:nth-child(-n+1), .pb-sev[data-n="2"] i:nth-child(-n+2), .pb-sev[data · 2026-09-14-pins2-board-2/index.html:201 |
| background-image | `` | `none` | .pb-sev[data-n="1"] i:nth-child(-n+1), .pb-sev[data-n="2"] i:nth-child(-n+2), .pb-sev[data · 2026-09-14-pins2-board-2/index.html:201 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-weight | ↑ `600` | `600` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `18px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .chip · 2026-09-14-pins2-board/app.css:938 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · 2026-09-14-pins2-board/app.css:600 |

*12 further looks are the same component in other data hues (a per-row `--c` / `--m` / `--sl`); they differ in colour only.*


### `em`

inside `.chip` · 8 on screen · **2 looks**

#### look 1 of 2

`G11-117` · rendered **11×10** · 4 instances look like this · text “16”

```html
<em>16</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `500 var(--t-micro)/1 var(--data)` | `` | .chip.pb-lv em · 2026-09-14-pins2-board-2/index.html:203 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .chip.pb-lv em · 2026-09-14-pins2-board-2/index.html:203 |
| font-size | `` | `9.5px` | .chip.pb-lv em · 2026-09-14-pins2-board-2/index.html:203 |
| font-weight | `` | `500` | .chip.pb-lv em · 2026-09-14-pins2-board-2/index.html:203 |
| font-style | `normal` | `normal` | .chip.pb-lv em · 2026-09-14-pins2-board-2/index.html:203 |
| font-variant-numeric | `` | `normal` | .chip.pb-lv em · 2026-09-14-pins2-board-2/index.html:203 |
| line-height | `` | `9.5px` | .chip.pb-lv em · 2026-09-14-pins2-board-2/index.html:203 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .chip.pb-lv em · 2026-09-14-pins2-board-2/index.html:203 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · 2026-09-14-pins2-board/app.css:600 |

#### look 2 of 2

`G11-142` · rendered **72×12** · 1 instance look like this · text “1,312 more”

```html
<em>1,312 more</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `500 var(--t-sm)/1 var(--data)` | `` | .pb-more .chip em · 2026-09-14-pins2-board-2/index.html:62 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-more .chip em · 2026-09-14-pins2-board-2/index.html:62 |
| font-size | `` | `12px` | .pb-more .chip em · 2026-09-14-pins2-board-2/index.html:62 |
| font-weight | `` | `500` | .pb-more .chip em · 2026-09-14-pins2-board-2/index.html:62 |
| font-style | `normal` | `normal` | .pb-more .chip em · 2026-09-14-pins2-board-2/index.html:62 |
| font-variant-numeric | `` | `normal` | .pb-more .chip em · 2026-09-14-pins2-board-2/index.html:62 |
| line-height | `` | `12px` | .pb-more .chip em · 2026-09-14-pins2-board-2/index.html:62 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `center` | `center` | inherited · input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-more .chip em · 2026-09-14-pins2-board-2/index.html:62 |
| cursor | ↑ `pointer` | `pointer` | inherited · button · 2026-09-14-pins2-board/app.css:600 |


### `div.pb-bc.pb-heads`

inside `.pb-man` · 1 on screen · **1 look**

#### the one look

`G11-29` · rendered **1148×45** · 1 instance look like this

```html
<div class="pb-heads pb-bc"><span><button class="pb-sort" data-bsort="text" aria-sort="none">Announcement⟨svg.ic.⟩</button></span><span><button class="pb-sort" data-bsort="posted" aria-sort="descending">Posted⟨svg.ic.⟩</button></span><span><button class="pb-sort" data-bsort="starts" aria-sort="none">Starts⟨svg.ic.⟩</button></span><span><button class="pb-sort" data-bsort="ends" aria-sort="none">Ends⟨svg.ic.⟩</button><
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| grid-template-columns | `var(--colsc)` | `556px 104px 104px 104px 124px 44px` | .pb-bc.pb-heads · 2026-09-14-pins2-board-2/index.html:184 |
| column-gap | `16px` | `16px` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| align-items | `center` | `center` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| min-height | `44px` | `44px` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px` | `` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| padding-top | `0px` | `0px` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| padding-right | `16px` | `16px` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| padding-bottom | `0px` | `0px` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| padding-left | `16px` | `16px` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| border-bottom | `1px solid var(--rule)` | `` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| background | `var(--sunk)` | `` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| background-image | `` | `none` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font | `600 var(--t-micro)/1 var(--data)` | `` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-size | `` | `9.5px` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-weight | `` | `600` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-style | `` | `normal` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| font-variant-numeric | `` | `normal` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| line-height | `` | `9.5px` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| letter-spacing | `0.14em` | `1.33px` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| text-transform | `uppercase` | `uppercase` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-heads · 2026-09-14-pins2-board-2/index.html:54 |


### `button.pb-sort`

inside `.—` · 5 on screen · **1 look**

#### the one look

`G11-31` · rendered **102×44** · 4 instances look like this

```html
<button class="pb-sort" data-bsort="text" aria-sort="none">Announcement⟨svg.ic.⟩</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| gap | `5px` | `` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| column-gap | `5px` | `5px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| row-gap | `5px` | `5px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| align-items | `center` | `center` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| min-height | `44px` | `44px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `0` | `` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| padding-top | `0px` | `0px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| padding-right | `0px` | `0px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| padding-bottom | `0px` | `0px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| padding-left | `0px` | `0px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| border | `0` | `` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| border-radius | `var(--ctl-rad, 5px)` | `` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| background | `none` | `` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| background-image | `none` | `none` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font | `inherit` | `` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-family | `inherit` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-size | `inherit` | `9.5px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-weight | `inherit` | `600` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-style | `inherit` | `normal` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| font-variant-numeric | `inherit` | `normal` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| line-height | `inherit` | `9.5px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| letter-spacing | `inherit` | `1.33px` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| text-transform | `inherit` | `uppercase` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `inherit` | `rgb(133, 147, 159)` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | .pb-sort · 2026-09-14-pins2-board-2/index.html:56 |

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


### `div.pb-br`

inside `.pb-man` · 3 on screen · **1 look**

#### the one look

`G11-46` · rendered **1148×64** · 3 instances look like this

```html
<div class="pb-br" style="--c:#337BA6"><div class="pb-bt"><b>S6 wrap-up — thanks for playing season 6…</b></div> <span class="pb-dt">Jul 14<small>61 days ago</small></span><span class="pb-dt pb-dim">On posting</span> <span class="pb-dt">Aug 11</span> <span class="pb-life" data-l="ended">⟨svg.ic.⟩Ended</span> <button class="pb-ib pb-del" aria-label="Remove">⟨svg.ic.⟩</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| position | `relative` | `relative` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| grid-template-columns | `var(--colsc)` | `550px 104px 104px 104px 124px 44px` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| column-gap | `16px` | `16px` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| align-items | `center` | `center` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| min-height | `64px` | `64px` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px 0 22px` | `` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| padding-top | `0px` | `0px` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| padding-right | `16px` | `16px` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| padding-bottom | `0px` | `0px` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| padding-left | `22px` | `22px` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| border-bottom | `1px solid var(--rule3)` | `` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| transition | `background .18s` | `` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |
| width | `4px` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |
| top | `10px` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |
| bottom | `10px` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |
| left | `0px` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |
| border-radius | `0 3px 3px 0` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |
| background | `var(--c)` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |
| background-color | `` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |
| background-image | `` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |
| content | `""` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |


### `div.pb-bt`

inside `.pb-br` · 4 on screen · **1 look**

#### the one look

`G11-47` · rendered **550×18** · 4 instances look like this

```html
<div class="pb-bt"><b>S6 wrap-up — thanks for playing season 6…</b></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| min-width | `0px` | `0px` | .pb-bt · 2026-09-14-pins2-board-2/index.html:347 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-right | `20px` | `20px` | .pb-bt · 2026-09-14-pins2-board-2/index.html:347 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `b`

inside `.pb-bt` · 9 on screen · **2 looks**

#### look 1 of 2

`G11-48` · rendered **530×18** · 4 instances look like this · text “S6 wrap-up — thanks for playing season 6.”

```html
<b>S6 wrap-up — thanks for playing season 6…</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .pb-bt b · 2026-09-14-pins2-board-2/index.html:188 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-base)/1.35 var(--ui)` | `` | .pb-bt b · 2026-09-14-pins2-board-2/index.html:188 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-bt b · 2026-09-14-pins2-board-2/index.html:188 |
| font-size | `` | `13px` | .pb-bt b · 2026-09-14-pins2-board-2/index.html:188 |
| font-weight | `` | `600` | .pb-bt b · 2026-09-14-pins2-board-2/index.html:188 |
| font-style | `` | `normal` | .pb-bt b · 2026-09-14-pins2-board-2/index.html:188 |
| font-variant-numeric | `` | `normal` | .pb-bt b · 2026-09-14-pins2-board-2/index.html:188 |
| line-height | `` | `17.55px` | .pb-bt b · 2026-09-14-pins2-board-2/index.html:188 |
| letter-spacing | — | `normal` | initial |
| text-overflow | `ellipsis` | `ellipsis` | .pb-bt b · 2026-09-14-pins2-board-2/index.html:188 |
| white-space | `nowrap` | `` | .pb-bt b · 2026-09-14-pins2-board-2/index.html:188 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-bt b · 2026-09-14-pins2-board-2/index.html:188 |
| overflow | `hidden` | `` | .pb-bt b · 2026-09-14-pins2-board-2/index.html:188 |
| overflow-x | `hidden` | `hidden` | .pb-bt b · 2026-09-14-pins2-board-2/index.html:188 |
| overflow-y | `hidden` | `hidden` | .pb-bt b · 2026-09-14-pins2-board-2/index.html:188 |

#### look 2 of 2

`G11-145` · rendered **41×17** · 5 instances look like this · text “Counts”

```html
<b>Counts</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| font-weight | `600` | `600` | .pb-new li b · 2026-09-14-pins2-board-2/index.html:28 |
| line-height | ↑ `1.45` | `17.4px` | inherited · .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-new li b · 2026-09-14-pins2-board-2/index.html:28 |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-new li b · 2026-09-14-pins2-board-2/index.html:28 |


### `span.pb-dt`

inside `.pb-br` · 8 on screen · **2 looks**

#### look 1 of 2

`G11-49` · rendered **104×27** · 4 instances look like this

```html
<span class="pb-dt">Jul 14<small>61 days ago</small></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| gap | `4px` | `` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| column-gap | `4px` | `4px` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| row-gap | `4px` | `4px` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `500 var(--t-sm)/1 var(--data)` | `` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-size | `` | `12px` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-weight | `` | `500` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-style | `` | `normal` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-variant-numeric | `` | `normal` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| line-height | `` | `12px` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |

#### look 2 of 2

`G11-52` · rendered **104×12** · 4 instances look like this · text “Aug 11”

```html
<span class="pb-dt">Aug 11</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| gap | `4px` | `` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| column-gap | `4px` | `4px` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| row-gap | `4px` | `4px` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `500 var(--t-sm)/1 var(--data)` | `` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-size | `` | `12px` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-weight | `` | `500` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-style | `` | `normal` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-variant-numeric | `` | `normal` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| line-height | `` | `12px` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |


### `small`

inside `.pb-dt` · 4 on screen · **1 look**

#### the one look

`G11-50` · rendered **104×11** · 4 instances look like this · text “61 days ago”

```html
<small>61 days ago</small>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `500 var(--t-xs)/1 var(--ui)` | `` | .pb-dt small · 2026-09-14-pins2-board-2/index.html:190 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-dt small · 2026-09-14-pins2-board-2/index.html:190 |
| font-size | `` | `10.5px` | .pb-dt small · 2026-09-14-pins2-board-2/index.html:190 |
| font-weight | `` | `500` | .pb-dt small · 2026-09-14-pins2-board-2/index.html:190 |
| font-style | `` | `normal` | .pb-dt small · 2026-09-14-pins2-board-2/index.html:190 |
| font-variant-numeric | `` | `normal` | .pb-dt small · 2026-09-14-pins2-board-2/index.html:190 |
| line-height | `` | `10.5px` | .pb-dt small · 2026-09-14-pins2-board-2/index.html:190 |
| letter-spacing | — | `normal` | initial |
| white-space | ↑ `nowrap` | `` | inherited · .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-dt small · 2026-09-14-pins2-board-2/index.html:190 |


### `span.pb-dim.pb-dt`

inside `.pb-br` · 3 on screen · **1 look**

#### the one look

`G11-51` · rendered **104×12** · 3 instances look like this · text “On posting”

```html
<span class="pb-dt pb-dim">On posting</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| gap | `4px` | `` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| column-gap | `4px` | `4px` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| row-gap | `4px` | `4px` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `500 var(--t-sm)/1 var(--data)` | `` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-family | `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-dt.pb-dim · 2026-09-14-pins2-board-2/index.html:191 |
| font-size | `` | `12px` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-weight | `` | `500` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-style | `normal` | `normal` | .pb-dt.pb-dim · 2026-09-14-pins2-board-2/index.html:348 |
| font-variant-numeric | `` | `normal` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| line-height | `` | `12px` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-dt.pb-dim · 2026-09-14-pins2-board-2/index.html:191 |


### `span.pb-life`

inside `.pb-br` · 4 on screen · **3 looks**

#### look 1 of 3

`G11-53` · rendered **80×28** · 1 instance look like this

```html
<span class="pb-life" data-l="ended">⟨svg.ic.⟩Ended</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| gap | `7px` | `` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| column-gap | `7px` | `7px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| row-gap | `7px` | `7px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| align-items | `center` | `center` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| justify-self | `start` | `start` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| height | `28px` | `28px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 11px 0 12px` | `` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| padding-top | `0px` | `0px` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| padding-right | `11px` | `11px` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| padding-bottom | `0px` | `0px` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| padding-left | `12px` | `12px` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| border-radius | `4px` | `` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| background | `color-mix(in srgb,var(--lc) 9%,transparent)` | `` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| background-color | `` | `color(srgb 0.521569 0.576471 0.623529 / 0.09)` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| background-image | `` | `none` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| box-shadow | `inset 3px 0 0 var(--lc),inset 0 0 0 1px color-mix(in srgb,var(--lc) 22%,transparent)` | `rgb(133, 147, 159) 3px 0px 0px 0px inset, color(srgb 0.521569 0.576471 0.623529 / 0.22) 0px 0px 0px 1px inset` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-size | `` | `12px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-weight | `` | `600` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-style | `` | `normal` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-variant-numeric | `` | `normal` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| line-height | `` | `12px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| color | `var(--lc)` | `rgb(133, 147, 159)` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |

#### look 2 of 3

`G11-65` · rendered **94×28** · 2 instances look like this

```html
<span class="pb-life" data-l="live">⟨svg.ic.⟩Live now</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| gap | `7px` | `` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| column-gap | `7px` | `7px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| row-gap | `7px` | `7px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| align-items | `center` | `center` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| justify-self | `start` | `start` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| height | `28px` | `28px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 11px 0 12px` | `` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| padding-top | `0px` | `0px` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| padding-right | `11px` | `11px` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| padding-bottom | `0px` | `0px` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| padding-left | `12px` | `12px` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| border-radius | `4px` | `` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| background | `color-mix(in srgb,var(--lc) 9%,transparent)` | `` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| background-color | `` | `color(srgb 0.482353 0.858824 0.388235 / 0.09)` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| background-image | `` | `none` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| box-shadow | `inset 3px 0 0 var(--lc),inset 0 0 0 1px color-mix(in srgb,var(--lc) 22%,transparent)` | `rgb(123, 219, 99) 3px 0px 0px 0px inset, color(srgb 0.482353 0.858823 0.388235 / 0.22) 0px 0px 0px 1px inset` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-size | `` | `12px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-weight | `` | `600` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-style | `` | `normal` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-variant-numeric | `` | `normal` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| line-height | `` | `12px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| color | `var(--lc)` | `rgb(123, 219, 99)` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |

#### look 3 of 3

`G11-87` · rendered **103×28** · 1 instance look like this

```html
<span class="pb-life" data-l="upcoming">⟨svg.ic.⟩Upcoming</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| gap | `7px` | `` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| column-gap | `7px` | `7px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| row-gap | `7px` | `7px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| align-items | `center` | `center` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| justify-self | `start` | `start` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| height | `28px` | `28px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 11px 0 12px` | `` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| padding-top | `0px` | `0px` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| padding-right | `11px` | `11px` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| padding-bottom | `0px` | `0px` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| padding-left | `12px` | `12px` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| border-radius | `4px` | `` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| background | `color-mix(in srgb,var(--lc) 9%,transparent)` | `` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| background-color | `` | `color(srgb 0.65098 0.501961 0.984314 / 0.09)` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| background-image | `` | `none` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| box-shadow | `inset 3px 0 0 var(--lc),inset 0 0 0 1px color-mix(in srgb,var(--lc) 22%,transparent)` | `rgb(166, 128, 251) 3px 0px 0px 0px inset, color(srgb 0.65098 0.501961 0.984314 / 0.22) 0px 0px 0px 1px inset` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-size | `` | `12px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-weight | `` | `600` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-style | `` | `normal` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-variant-numeric | `` | `normal` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| line-height | `` | `12px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| color | `var(--lc)` | `rgb(166, 128, 251)` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |


### `div.pb-br.pb-hov`

inside `.pb-man` · 1 on screen · **1 look**

#### the one look

`G11-57` · rendered **1148×64** · 1 instance look like this

```html
<div class="pb-br pb-hov" style="--c:#F2C230"><div class="pb-bt"><b>Season 7 is live — Reckoning drops today…</b></div> <span class="pb-dt">Aug 4<small>40 days ago</small></span><span class="pb-dt pb-dim">On posting</span> <span class="pb-dt pb-never">⟨svg.ic.⟩No end</span> <span class="pb-life" data-l="live">⟨svg.ic.⟩Live now</span> <button class="pb-ib pb-del" aria-label="Remove">⟨svg.ic.⟩</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| position | `relative` | `relative` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| grid-template-columns | `var(--colsc)` | `550px 104px 104px 104px 124px 44px` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| column-gap | `16px` | `16px` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| align-items | `center` | `center` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| min-height | `64px` | `64px` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px 0 22px` | `` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| padding-top | `0px` | `0px` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| padding-right | `16px` | `16px` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| padding-bottom | `0px` | `0px` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| padding-left | `22px` | `22px` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| border-bottom | `1px solid var(--rule3)` | `` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |
| background | `radial-gradient(380px 90px at 12% 40%,color-mix(in srgb,var(--c) 16%,transparent),transparent 72%),radial-gradient(420px 110px at 70% 80%,color-mix(in srgb,var(--c) 7%,transparent),transparent 70%),radial-gradient(260px 80px at 40% 0,color-mix(in srgb,var(--realm-c) 6%,transparent),transparent 70%),var(--paper)` | `` | .pb-br:hover, .pb-br.pb-hov · 2026-09-14-pins2-board-2/index.html:187 |
| background-color | `` | `rgb(23, 30, 36)` | .pb-br:hover, .pb-br.pb-hov · 2026-09-14-pins2-board-2/index.html:187 |
| background-image | `` | `radial-gradient(380px 90px at 12% 40%, color(srgb 0.94902 0.760784 0.188235 / 0.16), rgba(0, 0, 0, 0) 72%), radial-gradient(420px 110px at 70% 80%, color(srgb 0.94902 0.760784 0.188235 / 0.07), rgba(0, 0, 0, 0) 70%), radial-gradient(260px 80px at 40% 0px, color(srgb 0.92549 0.282353 0.6 / 0.06), rgba(0, 0, 0, 0) 70%), none` | .pb-br:hover, .pb-br.pb-hov · 2026-09-14-pins2-board-2/index.html:187 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| transition | `background .18s` | `` | .pb-br · 2026-09-14-pins2-board-2/index.html:185 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |
| width | `4px` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |
| top | `10px` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |
| bottom | `10px` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |
| left | `0px` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |
| border-radius | `0 3px 3px 0` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |
| background | `var(--c)` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |
| background-color | `` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |
| background-image | `` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |
| content | `""` | .pb-br::before · 2026-09-14-pins2-board-2/index.html:186 |


### `span.pb-dt.pb-never`

inside `.pb-br` · 1 on screen · **1 look**

#### the one look

`G11-63` · rendered **104×16** · 1 instance look like this

```html
<span class="pb-dt pb-never">⟨svg.ic.⟩No end</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-dt.pb-never · 2026-09-14-pins2-board-2/index.html:192 |
| gap | `6px` | `` | .pb-dt.pb-never · 2026-09-14-pins2-board-2/index.html:192 |
| column-gap | `6px` | `6px` | .pb-dt.pb-never · 2026-09-14-pins2-board-2/index.html:192 |
| row-gap | `6px` | `6px` | .pb-dt.pb-never · 2026-09-14-pins2-board-2/index.html:192 |
| align-items | `center` | `center` | .pb-dt.pb-never · 2026-09-14-pins2-board-2/index.html:192 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `500 var(--t-sm)/1 var(--data)` | `` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-size | `` | `12px` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-weight | `600` | `600` | .pb-dt.pb-never · 2026-09-14-pins2-board-2/index.html:192 |
| font-style | `` | `normal` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| font-variant-numeric | `` | `normal` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| line-height | `` | `12px` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-dt · 2026-09-14-pins2-board-2/index.html:189 |
| color | `var(--warn-ink)` | `rgb(255, 158, 114)` | .pb-dt.pb-never · 2026-09-14-pins2-board-2/index.html:192 |


### `span.pb-hits`

inside `.pb-srch` · 1 on screen · **1 look**

#### the one look

`G11-97` · rendered **85×28** · 1 instance look like this · text “5 matches”

```html
<span class="pb-hits">5 matches</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| position | `absolute` | `absolute` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| gap | `6px` | `` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| column-gap | `6px` | `6px` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| row-gap | `6px` | `6px` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| align-items | `center` | `center` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| height | `28px` | `28px` | .pb-hits · 2026-09-14-pins2-board-2/index.html:344 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 10px` | `` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| padding-top | `0px` | `0px` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| padding-right | `10px` | `10px` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| padding-bottom | `0px` | `0px` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| padding-left | `10px` | `10px` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| right | `6px` | `6px` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| border-radius | `5px` | `` | .pb-hits · 2026-09-14-pins2-board-2/index.html:344 |
| background | `color-mix(in srgb,var(--realm-c) 14%,transparent)` | `` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| background-color | `` | `color(srgb 0 0.882353 0.85098 / 0.14)` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| background-image | `` | `none` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| font | `600 var(--t-sm)/1 var(--data)` | `` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| font-size | `` | `12px` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| font-weight | `` | `600` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| font-style | `` | `normal` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| font-variant-numeric | `` | `normal` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| line-height | `` | `12px` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-hits · 2026-09-14-pins2-board-2/index.html:46 |
| cursor | ↑ `default` | `default` | inherited · label · user-agent:? |


### `button.chip.pb-lv`

inside `.pb-grp` · 4 on screen · **2 looks**

#### look 1 of 2

`G11-111` · rendered **98×32** · 3 instances look like this · aria-pressed="false"

```html
<button class="chip pb-lv" data-lv="error" style="--sv:var(--danger-ink)" aria-pressed="false"><span class="pb-sev" data-n="4"><i></i><i></i><i></i><i></i></span>error <em>16</em></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .chip.pb-lv · 2026-09-14-pins2-board-2/index.html:202 |
| gap | `8px` | `` | .chip.pb-lv · 2026-09-14-pins2-board-2/index.html:202 |
| column-gap | `8px` | `8px` | .chip.pb-lv · 2026-09-14-pins2-board-2/index.html:202 |
| row-gap | `8px` | `8px` | .chip.pb-lv · 2026-09-14-pins2-board-2/index.html:202 |
| flex | `none` | `` | .pb-t2 .chip · 2026-09-14-pins2-board-2/index.html:48 |
| align-items | `center` | `center` | .chip.pb-lv · 2026-09-14-pins2-board-2/index.html:202 |
| justify-content | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| min-height | `32px` | `32px` | .chip.pb-lv · 2026-09-14-pins2-board-2/index.html:202 |
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
| span.pb-sev | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| span.pb-sev | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| span.pb-sev | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| i | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| i | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| i | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| i | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| i | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| i | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| i | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| i | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| i | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| i | color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| i | border-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |
| i | outline-color | `rgb(157, 170, 180)` | `rgb(232, 237, 241)` |

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

`G11-118` · rendered **92×32** · 1 instance look like this · aria-pressed="false"

```html
<button class="chip pb-lv" data-lv="warn" style="--sv:var(--warn-ink)" aria-pressed="false" disabled=""><span class="pb-sev" data-n="3"><i></i><i></i><i></i><i></i></span>warn <em>0</em></button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .chip.pb-lv · 2026-09-14-pins2-board-2/index.html:202 |
| gap | `8px` | `` | .chip.pb-lv · 2026-09-14-pins2-board-2/index.html:202 |
| column-gap | `8px` | `8px` | .chip.pb-lv · 2026-09-14-pins2-board-2/index.html:202 |
| row-gap | `8px` | `8px` | .chip.pb-lv · 2026-09-14-pins2-board-2/index.html:202 |
| flex | `none` | `` | .pb-t2 .chip · 2026-09-14-pins2-board-2/index.html:48 |
| align-items | `center` | `center` | .chip.pb-lv · 2026-09-14-pins2-board-2/index.html:202 |
| justify-content | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| min-height | `32px` | `32px` | .chip.pb-lv · 2026-09-14-pins2-board-2/index.html:202 |
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
| opacity | `0.5` | `0.5` | .chip.pb-lv:disabled · 2026-09-14-pins2-board-2/index.html:205 |
| filter | `grayscale(0.4)` | `grayscale(0.4)` | .chip:disabled, .btn:disabled, .go:disabled, .bulk button:disabled, .flag button:disabled · 2026-09-14-pins2-board/app.css:1278 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `not-allowed` | `not-allowed` | .chip:disabled, .btn:disabled, .go:disabled, .bulk button:disabled, .flag button:disabled · 2026-09-14-pins2-board/app.css:1278 |

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


### `span.pb-sev`

inside `.chip` · 4 on screen · **1 look**

#### the one look

`G11-112` · rendered **18×12** · 4 instances look like this

```html
<span class="pb-sev" data-n="4"><i></i><i></i><i></i><i></i></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-sev · 2026-09-14-pins2-board-2/index.html:198 |
| gap | `2px` | `` | .pb-sev · 2026-09-14-pins2-board-2/index.html:198 |
| column-gap | `2px` | `2px` | .pb-sev · 2026-09-14-pins2-board-2/index.html:198 |
| row-gap | `2px` | `2px` | .pb-sev · 2026-09-14-pins2-board-2/index.html:198 |
| align-items | `flex-end` | `flex-end` | .pb-sev · 2026-09-14-pins2-board-2/index.html:198 |
| height | `12px` | `12px` | .pb-sev · 2026-09-14-pins2-board-2/index.html:198 |
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
| cursor | ↑ `pointer` | `pointer` | inherited · button · 2026-09-14-pins2-board/app.css:600 |


### `div.pb-more`

inside `.pb-man` · 1 on screen · **1 look**

#### the one look

`G11-139` · rendered **1148×69** · 1 instance look like this

```html
<div class="pb-more"><button class="chip">⟨svg.ic.⟩Load older events <em>1,312 more</em></button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-more · 2026-09-14-pins2-board-2/index.html:60 |
| justify-content | `center` | `center` | .pb-more · 2026-09-14-pins2-board-2/index.html:60 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `10px 16px 14px` | `` | .pb-more · 2026-09-14-pins2-board-2/index.html:60 |
| padding-top | `10px` | `10px` | .pb-more · 2026-09-14-pins2-board-2/index.html:60 |
| padding-right | `16px` | `16px` | .pb-more · 2026-09-14-pins2-board-2/index.html:60 |
| padding-bottom | `14px` | `14px` | .pb-more · 2026-09-14-pins2-board-2/index.html:60 |
| padding-left | `16px` | `16px` | .pb-more · 2026-09-14-pins2-board-2/index.html:60 |
| border-top | `1px solid var(--rule)` | `` | .pb-more · 2026-09-14-pins2-board-2/index.html:60 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `ul.pb-new`

inside `.pb-gate` · 1 on screen · **1 look**

#### the one look

`G11-143` · rendered **1148×109** · 1 instance look like this

```html
<ul class="pb-new"> <li><b>Counts</b> on the chips; a typed search shows its …</li> <li><b>Sort</b> every column; the last sort is already …<code>manifest.js</code></li> <li><b>Posted</b> carries its age under the date</li> <li><b>History</b> the newest-11 cap becomes a Load older …</li> <li><b>State</b> a tab with a colour bar in the rows; th…</li> </ul>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| grid-template-columns | `1fr 1fr` | `554px 554px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| column-gap | `40px` | `40px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0` | `` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| padding-top | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| padding-right | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| padding-bottom | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| padding-left | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| margin | `4px 0 0` | `` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| margin-top | `4px` | `4px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| margin-right | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| margin-bottom | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| margin-left | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `li`

inside `.pb-new` · 5 on screen · **1 look**

#### the one look

`G11-144` · rendered **554×36** · 5 instances look like this

```html
<li><b>Counts</b> on the chips; a typed search shows its …</li>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| gap | `10px` | `` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| column-gap | `10px` | `10px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| row-gap | `10px` | `10px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `9px 0` | `` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| padding-top | `9px` | `9px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| padding-right | `0px` | `0px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| padding-bottom | `9px` | `9px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| padding-left | `0px` | `0px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| border-top | `1px solid var(--rule3)` | `` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |
| font-weight | — | `400` | initial |
| line-height | ⚠️ `1.45` | `17.4px` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 · **a later rule wins — port the computed value and find that rule** |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-new li · 2026-09-14-pins2-board-2/index.html:27 |


## G3 · Announcement card — resting


### G3 stage

35 distinct signatures on screen; 26 not already specced above.


### `p`

inside `.—` · 3 on screen · **1 look**

#### the one look

`G3-17` · rendered **698×60** · 2 instances look like this · text “Season 7 is live — Reckoning drops today: new dr”

```html
<p>Season 7 is live — Reckoning drops today…</p>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `-webkit-box` | `flow-root` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:216 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `13px 18px 2px` | `` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:363 |
| padding-top | `13px` | `13px` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:363 |
| padding-right | `18px` | `18px` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:363 |
| padding-bottom | `2px` | `2px` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:363 |
| padding-left | `18px` | `18px` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:363 |
| margin | `0` | `` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:216 |
| margin-top | `0px` | `0px` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:216 |
| margin-right | `0px` | `0px` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:216 |
| margin-bottom | `0px` | `0px` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:216 |
| margin-left | `0px` | `0px` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:216 |
| font | `500 var(--t-md)/1.55 var(--ui)` | `` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:363 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:363 |
| font-size | `` | `14.5px` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:363 |
| font-weight | `` | `500` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:363 |
| font-style | `` | `normal` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:363 |
| font-variant-numeric | `` | `normal` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:363 |
| line-height | `` | `22.475px` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:363 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:216 |
| overflow | `hidden` | `` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:216 |
| overflow-x | `hidden` | `hidden` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:216 |
| overflow-y | `hidden` | `hidden` | .pb-enc p · 2026-09-14-pins2-board-2/index.html:216 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |


### `div.pb-stage`

inside `.pb-gate` · 1 on screen · **1 look**

#### the one look

`G3-6` · rendered **1148×527** · 1 instance look like this

```html
<div class="pb-stage"><div class="pb-q" id="g3"><div class="pb-qhead">Delivery order<span class="pb-axis"><span>Aug 4</span><span>→</span><span>Sep 30</span></span></div><div class="pb-card" style="--c:#F2C230"><span class="pb-numr">1</span> <div class="pb-body"> <div class="pb-enc" data-open="false" data-exp="1"><p>Season 7 is live — Reckoning drops today…</p><div class="pb-encf"><span>112 characters</span><button c
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-stage · 2026-09-14-pins2-board-2/index.html:32 |
| min-width | `1148px` | `1148px` | .pb-gate > .pb-man, .pb-gate > .pb-vb, .pb-gate > .pb-g1, .pb-gate > .pb-g6, .pb-gate > .p · 2026-09-14-pins2-board-2/index.html:464 |
| box-sizing | `border-box` | `border-box` | .pb-gate > .pb-man, .pb-gate > .pb-vb, .pb-gate > .pb-g1, .pb-gate > .pb-g6, .pb-gate > .p · 2026-09-14-pins2-board-2/index.html:464 |
| padding | `28px` | `` | .pb-stage · 2026-09-14-pins2-board-2/index.html:32 |
| padding-top | `28px` | `28px` | .pb-stage · 2026-09-14-pins2-board-2/index.html:32 |
| padding-right | `28px` | `28px` | .pb-stage · 2026-09-14-pins2-board-2/index.html:32 |
| padding-bottom | `28px` | `28px` | .pb-stage · 2026-09-14-pins2-board-2/index.html:32 |
| padding-left | `28px` | `28px` | .pb-stage · 2026-09-14-pins2-board-2/index.html:32 |
| border-radius | `var(--rad-3)` | `` | .pb-stage · 2026-09-14-pins2-board-2/index.html:32 |
| background | `radial-gradient(900px 320px at 30% 0,color-mix(in srgb,var(--realm-c) 7%,transparent),transparent 70%),var(--sunk)` | `` | .pb-stage · 2026-09-14-pins2-board-2/index.html:32 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-stage · 2026-09-14-pins2-board-2/index.html:32 |
| background-image | `` | `radial-gradient(900px 320px at 30% 0px, color(srgb 0.92549 0.282353 0.6 / 0.07), rgba(0, 0, 0, 0) 70%), none` | .pb-stage · 2026-09-14-pins2-board-2/index.html:32 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-q`

inside `.pb-stage` · 1 on screen · **1 look**

#### the one look

`G3-7` · rendered **820×471** · 1 instance look like this

```html
<div class="pb-q" id="g3"><div class="pb-qhead">Delivery order<span class="pb-axis"><span>Aug 4</span><span>→</span><span>Sep 30</span></span></div><div class="pb-card" style="--c:#F2C230"><span class="pb-numr">1</span> <div class="pb-body"> <div class="pb-enc" data-open="false" data-exp="1"><p>Season 7 is live — Reckoning drops today…</p><div class="pb-encf"><span>112 characters</span><button class="pb-exp" data-exp
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-q · 2026-09-14-pins2-board-2/index.html:208 |
| gap | `12px` | `` | .pb-q · 2026-09-14-pins2-board-2/index.html:208 |
| column-gap | `12px` | `12px` | .pb-q · 2026-09-14-pins2-board-2/index.html:208 |
| row-gap | `12px` | `12px` | .pb-q · 2026-09-14-pins2-board-2/index.html:208 |
| width | `820px` | `820px` | .pb-q · 2026-09-14-pins2-board-2/index.html:208 |
| max-width | `100%` | `100%` | .pb-q · 2026-09-14-pins2-board-2/index.html:208 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-qhead`

inside `.pb-q` · 1 on screen · **1 look**

#### the one look

`G3-8` · rendered **820×10** · 1 instance look like this

```html
<div class="pb-qhead">Delivery order<span class="pb-axis"><span>Aug 4</span><span>→</span><span>Sep 30</span></span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| gap | `12px` | `` | .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| column-gap | `12px` | `12px` | .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| row-gap | `12px` | `12px` | .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| align-items | `center` | `center` | .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-micro)/1 var(--data)` | `` | .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| font-size | `` | `9.5px` | .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| font-weight | `` | `600` | .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| font-style | `` | `normal` | .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| font-variant-numeric | `` | `normal` | .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| line-height | `` | `9.5px` | .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| letter-spacing | `0.16em` | `1.52px` | .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| text-transform | `uppercase` | `uppercase` | .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |


### `span.pb-axis`

inside `.pb-qhead` · 1 on screen · **1 look**

#### the one look

`G3-9` · rendered **123×10** · 1 instance look like this

```html
<span class="pb-axis"><span>Aug 4</span><span>→</span><span>Sep 30</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-qhead .pb-axis · 2026-09-14-pins2-board-2/index.html:210 |
| gap | `18px` | `` | .pb-qhead .pb-axis · 2026-09-14-pins2-board-2/index.html:210 |
| column-gap | `18px` | `18px` | .pb-qhead .pb-axis · 2026-09-14-pins2-board-2/index.html:210 |
| row-gap | `18px` | `18px` | .pb-qhead .pb-axis · 2026-09-14-pins2-board-2/index.html:210 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-left | `auto` | `584.219px` | .pb-qhead .pb-axis · 2026-09-14-pins2-board-2/index.html:210 |
| font | ↑ `600 var(--t-micro)/1 var(--data)` | `` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| font-size | ↑ `` | `9.5px` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| font-weight | ↑ `` | `600` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| font-style | ↑ `` | `normal` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| line-height | ↑ `` | `9.5px` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| letter-spacing | ↑ `0.16em` | `1.52px` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| text-transform | ↑ `uppercase` | `uppercase` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |


### `span`

inside `.pb-axis` · 6 on screen · **2 looks**

#### look 1 of 2

`G3-10` · rendered **36×10** · 3 instances look like this · text “Aug 4”

```html
<span>Aug 4</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `600 var(--t-micro)/1 var(--data)` | `` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| font-size | ↑ `` | `9.5px` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| font-weight | ↑ `` | `600` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| font-style | ↑ `` | `normal` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| line-height | ↑ `` | `9.5px` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| letter-spacing | ↑ `0.16em` | `1.52px` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| text-transform | ↑ `uppercase` | `uppercase` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .pb-qhead · 2026-09-14-pins2-board-2/index.html:209 |

#### look 2 of 2

`G3-19` · rendered **88×11** · 2 instances look like this · text “112 characters”

```html
<span>112 characters</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 var(--t-xs)/1 var(--data)` | `` | inherited · .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| font-size | ↑ `` | `10.5px` | inherited · .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| font-weight | ↑ `` | `500` | inherited · .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| font-style | ↑ `` | `normal` | inherited · .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| line-height | ↑ `` | `10.5px` | inherited · .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |


### `div.pb-card`

inside `.pb-q` · 2 on screen · **1 look**

#### the one look

`G3-13` · rendered **820×219** · 2 instances look like this

```html
<div class="pb-card" style="--c:#F2C230"><span class="pb-numr">1</span> <div class="pb-body"> <div class="pb-enc" data-open="false" data-exp="1"><p>Season 7 is live — Reckoning drops today…</p><div class="pb-encf"><span>112 characters</span><button class="pb-exp" data-exp="1" aria-expanded="false">Show all⟨svg.ic.⟩</button></div></div> <div class="pb-life3"><div class="pb-tl"><span class="pb-end">⟨svg.ic.⟩Aug 4</span
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-card · 2026-09-14-pins2-board-2/index.html:211 |
| position | `relative` | `relative` | .pb-card · 2026-09-14-pins2-board-2/index.html:211 |
| grid-template-columns | `56px minmax(0px, 1fr) auto` | `56px 698px 0px` | .pb-card · 2026-09-14-pins2-board-2/index.html:360 |
| gap | `16px` | `` | .pb-card · 2026-09-14-pins2-board-2/index.html:211 |
| column-gap | `16px` | `16px` | .pb-card · 2026-09-14-pins2-board-2/index.html:211 |
| row-gap | `16px` | `16px` | .pb-card · 2026-09-14-pins2-board-2/index.html:211 |
| align-items | `start` | `start` | .pb-card · 2026-09-14-pins2-board-2/index.html:211 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `16px 16px 16px 18px` | `` | .pb-card · 2026-09-14-pins2-board-2/index.html:211 |
| padding-top | `16px` | `16px` | .pb-card · 2026-09-14-pins2-board-2/index.html:211 |
| padding-right | `16px` | `16px` | .pb-card · 2026-09-14-pins2-board-2/index.html:211 |
| padding-bottom | `16px` | `16px` | .pb-card · 2026-09-14-pins2-board-2/index.html:211 |
| padding-left | `18px` | `18px` | .pb-card · 2026-09-14-pins2-board-2/index.html:211 |
| border-radius | `var(--rad-3)` | `` | .pb-card · 2026-09-14-pins2-board-2/index.html:211 |
| background | `var(--raised)` | `` | .pb-card · 2026-09-14-pins2-board-2/index.html:211 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-card · 2026-09-14-pins2-board-2/index.html:211 |
| background-image | `` | `none` | .pb-card · 2026-09-14-pins2-board-2/index.html:211 |
| box-shadow | `inset 0 0 0 1px var(--rule)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset` | .pb-card · 2026-09-14-pins2-board-2/index.html:211 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-card::before · 2026-09-14-pins2-board-2/index.html:212 |
| width | `4px` | .pb-card::before · 2026-09-14-pins2-board-2/index.html:212 |
| top | `12px` | .pb-card::before · 2026-09-14-pins2-board-2/index.html:212 |
| bottom | `12px` | .pb-card::before · 2026-09-14-pins2-board-2/index.html:212 |
| left | `0px` | .pb-card::before · 2026-09-14-pins2-board-2/index.html:212 |
| border-radius | `0 3px 3px 0` | .pb-card::before · 2026-09-14-pins2-board-2/index.html:212 |
| background | `var(--c)` | .pb-card::before · 2026-09-14-pins2-board-2/index.html:212 |
| background-color | `` | .pb-card::before · 2026-09-14-pins2-board-2/index.html:212 |
| background-image | `` | .pb-card::before · 2026-09-14-pins2-board-2/index.html:212 |
| content | `""` | .pb-card::before · 2026-09-14-pins2-board-2/index.html:212 |


### `span.pb-numr`

inside `.pb-card` · 2 on screen · **2 looks**

#### look 1 of 2

`G3-14` · rendered **14×50** · 1 instance look like this · text “1”

```html
<span class="pb-numr">1</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| justify-self | `center` | `center` | .pb-numr · 2026-09-14-pins2-board-2/index.html:213 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-top | `4px` | `4px` | .pb-numr · 2026-09-14-pins2-board-2/index.html:361 |
| font | `700 40px/.8 var(--display)` | `` | .pb-numr · 2026-09-14-pins2-board-2/index.html:213 |
| font-family | `` | `"Big Shoulders Display", "Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-numr · 2026-09-14-pins2-board-2/index.html:213 |
| font-size | `58px` | `58px` | .pb-numr · 2026-09-14-pins2-board-2/index.html:361 |
| font-weight | `` | `700` | .pb-numr · 2026-09-14-pins2-board-2/index.html:213 |
| font-style | `` | `normal` | .pb-numr · 2026-09-14-pins2-board-2/index.html:213 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .pb-numr · 2026-09-14-pins2-board-2/index.html:213 |
| line-height | `` | `46.4px` | .pb-numr · 2026-09-14-pins2-board-2/index.html:213 |
| letter-spacing | — | `normal` | initial |
| color | `var(--c)` | `rgb(242, 194, 48)` | .pb-numr · 2026-09-14-pins2-board-2/index.html:213 |

#### look 2 of 2

`G3-45` · rendered **25×50** · 1 instance look like this · text “2”

```html
<span class="pb-numr">2</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| justify-self | `center` | `center` | .pb-numr · 2026-09-14-pins2-board-2/index.html:213 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-top | `4px` | `4px` | .pb-numr · 2026-09-14-pins2-board-2/index.html:361 |
| font | `700 40px/.8 var(--display)` | `` | .pb-numr · 2026-09-14-pins2-board-2/index.html:213 |
| font-family | `` | `"Big Shoulders Display", "Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-numr · 2026-09-14-pins2-board-2/index.html:213 |
| font-size | `58px` | `58px` | .pb-numr · 2026-09-14-pins2-board-2/index.html:361 |
| font-weight | `` | `700` | .pb-numr · 2026-09-14-pins2-board-2/index.html:213 |
| font-style | `` | `normal` | .pb-numr · 2026-09-14-pins2-board-2/index.html:213 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .pb-numr · 2026-09-14-pins2-board-2/index.html:213 |
| line-height | `` | `46.4px` | .pb-numr · 2026-09-14-pins2-board-2/index.html:213 |
| letter-spacing | — | `normal` | initial |
| color | `var(--c)` | `rgb(31, 138, 94)` | .pb-numr · 2026-09-14-pins2-board-2/index.html:213 |


### `div.pb-body`

inside `.pb-card` · 2 on screen · **1 look**

#### the one look

`G3-15` · rendered **698×187** · 2 instances look like this

```html
<div class="pb-body"> <div class="pb-enc" data-open="false" data-exp="1"><p>Season 7 is live — Reckoning drops today…</p><div class="pb-encf"><span>112 characters</span><button class="pb-exp" data-exp="1" aria-expanded="false">Show all⟨svg.ic.⟩</button></div></div> <div class="pb-life3"><div class="pb-tl"><span class="pb-end">⟨svg.ic.⟩Aug 4</span><div class="pb-bar"><span class="pb-track"></span><span class="pb-span 
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-body · 2026-09-14-pins2-board-2/index.html:214 |
| gap | `12px` | `` | .pb-body · 2026-09-14-pins2-board-2/index.html:214 |
| column-gap | `12px` | `12px` | .pb-body · 2026-09-14-pins2-board-2/index.html:214 |
| row-gap | `12px` | `12px` | .pb-body · 2026-09-14-pins2-board-2/index.html:214 |
| min-width | `0px` | `0px` | .pb-body · 2026-09-14-pins2-board-2/index.html:214 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-enc`

inside `.pb-body` · 2 on screen · **2 looks**

#### look 1 of 2

`G3-16` · rendered **698×105** · 1 instance look like this

```html
<div class="pb-enc" data-open="false" data-exp="1"><p>Season 7 is live — Reckoning drops today…</p><div class="pb-encf"><span>112 characters</span><button class="pb-exp" data-exp="1" aria-expanded="false">Show all⟨svg.ic.⟩</button></div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| position | `relative` | `relative` | .pb-enc · 2026-09-14-pins2-board-2/index.html:215 |
| grid-template-columns | `minmax(0px, 1fr) 44px` | `minmax(0px, 1fr) 44px` | .pb-enc · 2026-09-14-pins2-board-2/index.html:215 |
| align-items | `start` | `start` | .pb-enc · 2026-09-14-pins2-board-2/index.html:215 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0` | `` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| padding-top | `0px` | `0px` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| padding-right | `0px` | `0px` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| padding-bottom | `0px` | `0px` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| padding-left | `0px` | `0px` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| border-radius | `var(--rad-2)` | `` | .pb-enc · 2026-09-14-pins2-board-2/index.html:215 |
| background | `linear-gradient(180deg,color-mix(in srgb,var(--c) 7%,var(--sunk)),var(--sunk) 64%)` | `` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| background-color | `` | `rgba(0, 0, 0, 0)` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| background-image | `` | `linear-gradient(color(srgb 0.106549 0.107961 0.0788235), rgb(11, 15, 18) 64%)` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| box-shadow | `inset 0 0 0 1px var(--rule),inset 0 1px 0 color-mix(in srgb,var(--c) 30%,transparent)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset, color(srgb 0.94902 0.760784 0.188235 / 0.3) 0px 1px 0px 0px inset` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| overflow-x | `hidden` | `hidden` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| overflow-y | `hidden` | `hidden` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| cursor | `pointer` | `pointer` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |

#### look 2 of 2

`G3-47` · rendered **586×105** · 1 instance look like this

```html
<div class="pb-enc" data-open="false" data-exp="2"><p>Double CP this weekend — 2x CP on every …</p><div class="pb-encf"><span>115 characters</span><button class="pb-exp" data-exp="2" aria-expanded="false">Show all⟨svg.ic.⟩</button></div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| position | `relative` | `relative` | .pb-enc · 2026-09-14-pins2-board-2/index.html:215 |
| grid-template-columns | `minmax(0px, 1fr) 44px` | `minmax(0px, 1fr) 44px` | .pb-enc · 2026-09-14-pins2-board-2/index.html:215 |
| align-items | `start` | `start` | .pb-enc · 2026-09-14-pins2-board-2/index.html:215 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0` | `` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| padding-top | `0px` | `0px` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| padding-right | `0px` | `0px` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| padding-bottom | `0px` | `0px` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| padding-left | `0px` | `0px` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| border-radius | `var(--rad-2)` | `` | .pb-enc · 2026-09-14-pins2-board-2/index.html:215 |
| background | `linear-gradient(180deg,color-mix(in srgb,var(--c) 7%,var(--sunk)),var(--sunk) 64%)` | `` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| background-color | `` | `rgba(0, 0, 0, 0)` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| background-image | `` | `linear-gradient(color(srgb 0.0486275 0.0925882 0.091451), rgb(11, 15, 18) 64%)` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| box-shadow | `inset 0 0 0 1px var(--rule),inset 0 1px 0 color-mix(in srgb,var(--c) 30%,transparent)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset, color(srgb 0.121569 0.541176 0.368627 / 0.3) 0px 1px 0px 0px inset` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| overflow-x | `hidden` | `hidden` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| overflow-y | `hidden` | `hidden` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |
| cursor | `pointer` | `pointer` | .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |


### `div.pb-encf`

inside `.pb-enc` · 2 on screen · **1 look**

#### the one look

`G3-18` · rendered **698×45** · 2 instances look like this

```html
<div class="pb-encf"><span>112 characters</span><button class="pb-exp" data-exp="1" aria-expanded="false">Show all⟨svg.ic.⟩</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| gap | `10px` | `` | .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| column-gap | `10px` | `10px` | .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| row-gap | `10px` | `10px` | .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| align-items | `center` | `center` | .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 4px 0 18px` | `` | .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| padding-top | `0px` | `0px` | .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| padding-right | `4px` | `4px` | .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| padding-bottom | `0px` | `0px` | .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| padding-left | `18px` | `18px` | .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| border-top | `1px solid color-mix(in srgb,var(--rule) 60%,transparent)` | `` | .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| font | `500 var(--t-xs)/1 var(--data)` | `` | .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| font-size | `` | `10.5px` | .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| font-weight | `` | `500` | .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| font-style | `` | `normal` | .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| font-variant-numeric | `` | `normal` | .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| line-height | `` | `10.5px` | .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-encf · 2026-09-14-pins2-board-2/index.html:364 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-enc · 2026-09-14-pins2-board-2/index.html:362 |


### `button.pb-exp`

inside `.pb-encf` · 2 on screen · **1 look**

#### the one look

`G3-20` · rendered **96×44** · 2 instances look like this · aria-expanded="false"

```html
<button class="pb-exp" data-exp="1" aria-expanded="false">Show all⟨svg.ic.⟩</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| gap | `8px` | `` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| column-gap | `8px` | `8px` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| row-gap | `8px` | `8px` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| align-items | `center` | `center` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| place-items | `center` | `` | .pb-exp · 2026-09-14-pins2-board-2/index.html:218 |
| width | `auto` | `95.7031px` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| height | `var(--tap)` | `44px` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| min-height | `var(--ctl-min, 32px)` | `auto` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `0 12px` | `` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| padding-top | `0px` | `0px` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| padding-right | `12px` | `12px` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| padding-bottom | `0px` | `0px` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| padding-left | `12px` | `12px` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| margin | `0 0 0 auto` | `` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| margin-top | `0px` | `0px` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| margin-right | `0px` | `0px` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| margin-bottom | `0px` | `0px` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| margin-left | `auto` | `482.094px` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| border | `0` | `` | .pb-exp · 2026-09-14-pins2-board-2/index.html:218 |
| border-radius | `var(--rad-2)` | `` | .pb-exp · 2026-09-14-pins2-board-2/index.html:218 |
| background | `none` | `` | .pb-exp · 2026-09-14-pins2-board-2/index.html:218 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-exp · 2026-09-14-pins2-board-2/index.html:218 |
| background-image | `none` | `none` | .pb-exp · 2026-09-14-pins2-board-2/index.html:218 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| font-size | `` | `12px` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| font-weight | `` | `600` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| font-style | `` | `normal` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| font-variant-numeric | `` | `normal` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| line-height | `` | `12px` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| letter-spacing | `normal` | `normal` | input, textarea, select, button · user-agent:? |
| text-align | `center` | `center` | input[type="button" i], input[type="submit" i], input[type="reset" i], input[type="file" i · user-agent:? |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-enc .pb-exp · 2026-09-14-pins2-board-2/index.html:365 |
| transition | `transform var(--dur-1) var(--ease), background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease)` | `` | button, .pill, .chip, .btn, .mi, .realm, .hcard, .att-row · 2026-09-14-pins2-board/app.css:5257 |
| cursor | `pointer` | `pointer` | .pb-exp · 2026-09-14-pins2-board-2/index.html:218 |

**:hover** — changes

| property | at rest | hover |
|---|---|---|
| background-color | `rgba(0, 0, 0, 0)` | `rgb(42, 52, 61)` |

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

inside `.pb-exp` · 15 on screen · **3 looks**

#### look 1 of 3

`G3-25` · rendered **13×13** · 3 instances look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-calendar"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `13px` | `13px` | .pb-end .ic · 2026-09-14-pins2-board-2/index.html:544 |
| height | `13px` | `13px` | .pb-end .ic · 2026-09-14-pins2-board-2/index.html:544 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 var(--t-sm)/1 var(--data)` | `` | inherited · .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| font-size | ↑ `` | `12px` | inherited · .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| font-weight | ↑ `` | `500` | inherited · .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| font-style | ↑ `` | `normal` | inherited · .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| line-height | ↑ `` | `12px` | inherited · .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| letter-spacing | — | `normal` | initial |
| white-space | ↑ `nowrap` | `` | inherited · .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-end .ic · 2026-09-14-pins2-board-2/index.html:544 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |

#### look 2 of 3

`G3-31` · rendered **13×13** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-infinity"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `13px` | `13px` | .pb-end .ic · 2026-09-14-pins2-board-2/index.html:544 |
| height | `13px` | `13px` | .pb-end .ic · 2026-09-14-pins2-board-2/index.html:544 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 var(--t-sm)/1 var(--data)` | `` | inherited · .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-end.pb-nev · 2026-09-14-pins2-board-2/index.html:545 |
| font-size | ↑ `` | `12px` | inherited · .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| font-weight | ↑ `600` | `600` | inherited · .pb-end.pb-nev · 2026-09-14-pins2-board-2/index.html:545 |
| font-style | ↑ `` | `normal` | inherited · .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| line-height | ↑ `` | `12px` | inherited · .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| letter-spacing | — | `normal` | initial |
| white-space | ↑ `nowrap` | `` | inherited · .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| color | `var(--warn-ink)` | `rgb(255, 158, 114)` | .pb-end.pb-nev .ic · 2026-09-14-pins2-board-2/index.html:546 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |

#### look 3 of 3

`G3-34` · rendered **14×14** · 3 instances look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-clock"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `14px` | `14px` | .pb-pill .ic · 2026-09-14-pins2-board-2/index.html:232 |
| height | `14px` | `14px` | .pb-pill .ic · 2026-09-14-pins2-board-2/index.html:232 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 var(--t-sm)/1 var(--ui)` | `` | inherited · .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| font-size | ↑ `` | `12px` | inherited · .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| font-weight | ↑ `` | `500` | inherited · .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| font-style | ↑ `` | `normal` | inherited · .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| line-height | ↑ `` | `12px` | inherited · .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| letter-spacing | — | `normal` | initial |
| white-space | ↑ `nowrap` | `` | inherited · .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-pill .ic · 2026-09-14-pins2-board-2/index.html:232 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |


### `div.pb-life3`

inside `.pb-body` · 2 on screen · **1 look**

#### the one look

`G3-22` · rendered **698×70** · 2 instances look like this

```html
<div class="pb-life3"><div class="pb-tl"><span class="pb-end">⟨svg.ic.⟩Aug 4</span><div class="pb-bar"><span class="pb-track"></span><span class="pb-span pb-open" style="left:0%;right:0"></span><span class="pb-now" style="left:70.17543859649122%" title="Up 40 days"></span></div><span class="pb-end pb-nev">⟨svg.ic.⟩No end</span></div> <div class="pb-dates"><span class="pb-pill">⟨svg.ic.⟩up 40d</span><div class="pb-cac
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-life3 · 2026-09-14-pins2-board-2/index.html:222 |
| gap | `8px` | `` | .pb-life3 · 2026-09-14-pins2-board-2/index.html:222 |
| column-gap | `8px` | `8px` | .pb-life3 · 2026-09-14-pins2-board-2/index.html:222 |
| row-gap | `8px` | `8px` | .pb-life3 · 2026-09-14-pins2-board-2/index.html:222 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-tl`

inside `.pb-life3` · 2 on screen · **1 look**

#### the one look

`G3-23` · rendered **698×28** · 2 instances look like this

```html
<div class="pb-tl"><span class="pb-end">⟨svg.ic.⟩Aug 4</span><div class="pb-bar"><span class="pb-track"></span><span class="pb-span pb-open" style="left:0%;right:0"></span><span class="pb-now" style="left:70.17543859649122%" title="Up 40 days"></span></div><span class="pb-end pb-nev">⟨svg.ic.⟩No end</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-tl · 2026-09-14-pins2-board-2/index.html:368 |
| grid-template-columns | `100px minmax(0px, 1fr) 100px` | `100px 474px 100px` | .pb-tl · 2026-09-14-pins2-board-2/index.html:541 |
| gap | `12px` | `` | .pb-tl · 2026-09-14-pins2-board-2/index.html:368 |
| column-gap | `12px` | `12px` | .pb-tl · 2026-09-14-pins2-board-2/index.html:368 |
| row-gap | `12px` | `12px` | .pb-tl · 2026-09-14-pins2-board-2/index.html:368 |
| align-items | `center` | `center` | .pb-tl · 2026-09-14-pins2-board-2/index.html:368 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-end`

inside `.pb-tl` · 3 on screen · **1 look**

#### the one look

`G3-24` · rendered **100×28** · 3 instances look like this

```html
<span class="pb-end">⟨svg.ic.⟩Aug 4</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| gap | `6px` | `` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| column-gap | `6px` | `6px` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| row-gap | `6px` | `6px` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| align-items | `center` | `center` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| justify-content | `center` | `center` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| height | `28px` | `28px` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| box-sizing | `border-box` | `border-box` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| border-radius | `6px` | `` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| background | `var(--sunk)` | `` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| background-image | `` | `none` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| box-shadow | `inset 0 0 0 1px var(--rule)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| font | `500 var(--t-sm)/1 var(--data)` | `` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| font-size | `` | `12px` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| font-weight | `` | `500` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| font-style | `` | `normal` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| font-variant-numeric | `` | `normal` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| line-height | `` | `12px` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |


### `div.pb-bar`

inside `.pb-tl` · 2 on screen · **1 look**

#### the one look

`G3-26` · rendered **474×20** · 2 instances look like this

```html
<div class="pb-bar"><span class="pb-track"></span><span class="pb-span pb-open" style="left:0%;right:0"></span><span class="pb-now" style="left:70.17543859649122%" title="Up 40 days"></span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .pb-bar · 2026-09-14-pins2-board-2/index.html:223 |
| height | `20px` | `20px` | .pb-tl .pb-bar · 2026-09-14-pins2-board-2/index.html:369 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-track`

inside `.pb-bar` · 2 on screen · **1 look**

#### the one look

`G3-27` · rendered **474×6** · 2 instances look like this

```html
<span class="pb-track"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .pb-track · 2026-09-14-pins2-board-2/index.html:224 |
| height | `6px` | `6px` | .pb-track · 2026-09-14-pins2-board-2/index.html:224 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `7px` | `7px` | .pb-tl .pb-track · 2026-09-14-pins2-board-2/index.html:370 |
| right | `0px` | `0px` | .pb-track · 2026-09-14-pins2-board-2/index.html:224 |
| left | `0px` | `0px` | .pb-track · 2026-09-14-pins2-board-2/index.html:224 |
| border-radius | `3px` | `` | .pb-track · 2026-09-14-pins2-board-2/index.html:224 |
| background | `var(--sunk)` | `` | .pb-tl .pb-track · 2026-09-14-pins2-board-2/index.html:370 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-tl .pb-track · 2026-09-14-pins2-board-2/index.html:370 |
| background-image | `` | `none` | .pb-tl .pb-track · 2026-09-14-pins2-board-2/index.html:370 |
| box-shadow | `inset 0 0 0 1px var(--rule)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset` | .pb-track · 2026-09-14-pins2-board-2/index.html:224 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-open.pb-span`

inside `.pb-bar` · 1 on screen · **1 look**

#### the one look

`G3-28` · rendered **474×6** · 1 instance look like this

```html
<span class="pb-span pb-open" style="left:0%;right:0"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .pb-span · 2026-09-14-pins2-board-2/index.html:225 |
| height | `6px` | `6px` | .pb-span · 2026-09-14-pins2-board-2/index.html:225 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `7px` | `7px` | .pb-tl .pb-span · 2026-09-14-pins2-board-2/index.html:371 |
| right | `0px` | `0px` | style attribute |
| left | `0%` | `0px` | style attribute |
| border-radius | `3px 0 0 3px` | `` | .pb-span.pb-open · 2026-09-14-pins2-board-2/index.html:226 |
| background | `linear-gradient(90deg,var(--c) 0,var(--c) calc(100% - 90px),color-mix(in srgb,var(--c) 0%,transparent))` | `` | .pb-span.pb-open · 2026-09-14-pins2-board-2/index.html:226 |
| background-color | `` | `rgba(0, 0, 0, 0)` | .pb-span.pb-open · 2026-09-14-pins2-board-2/index.html:226 |
| background-image | `` | `linear-gradient(90deg, rgb(242, 194, 48) 0px, rgb(242, 194, 48) calc(100% - 90px), color(srgb 0 0 0 / 0))` | .pb-span.pb-open · 2026-09-14-pins2-board-2/index.html:226 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

**::after**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-span.pb-open::after · 2026-09-14-pins2-board-2/index.html:227 |
| width | `14px` | .pb-span.pb-open::after · 2026-09-14-pins2-board-2/index.html:227 |
| height | `14px` | .pb-span.pb-open::after · 2026-09-14-pins2-board-2/index.html:227 |
| top | `-4px` | .pb-span.pb-open::after · 2026-09-14-pins2-board-2/index.html:227 |
| right | `-2px` | .pb-span.pb-open::after · 2026-09-14-pins2-board-2/index.html:227 |
| background | `linear-gradient(90deg,transparent,var(--raised))` | .pb-span.pb-open::after · 2026-09-14-pins2-board-2/index.html:227 |
| background-color | `` | .pb-span.pb-open::after · 2026-09-14-pins2-board-2/index.html:227 |
| background-image | `` | .pb-span.pb-open::after · 2026-09-14-pins2-board-2/index.html:227 |
| content | `""` | .pb-span.pb-open::after · 2026-09-14-pins2-board-2/index.html:227 |


### `span.pb-now`

inside `.pb-bar` · 2 on screen · **1 look**

#### the one look

`G3-29` · rendered **2×18** · 2 instances look like this · title="Up 40 days"

```html
<span class="pb-now" style="left:70.17543859649122%" title="Up 40 days"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .pb-now · 2026-09-14-pins2-board-2/index.html:228 |
| width | `2px` | `2px` | .pb-now · 2026-09-14-pins2-board-2/index.html:228 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `1px` | `1px` | .pb-tl .pb-now · 2026-09-14-pins2-board-2/index.html:372 |
| bottom | `1px` | `1px` | .pb-tl .pb-now · 2026-09-14-pins2-board-2/index.html:372 |
| left | `70.1754%` | `332.625px` | style attribute |
| border-radius | `1px` | `` | .pb-now · 2026-09-14-pins2-board-2/index.html:228 |
| background | `var(--ink)` | `` | .pb-now · 2026-09-14-pins2-board-2/index.html:228 |
| background-color | `` | `rgb(232, 237, 241)` | .pb-now · 2026-09-14-pins2-board-2/index.html:228 |
| background-image | `` | `none` | .pb-now · 2026-09-14-pins2-board-2/index.html:228 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-end.pb-nev`

inside `.pb-tl` · 1 on screen · **1 look**

#### the one look

`G3-30` · rendered **100×28** · 1 instance look like this

```html
<span class="pb-end pb-nev">⟨svg.ic.⟩No end</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| gap | `6px` | `` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| column-gap | `6px` | `6px` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| row-gap | `6px` | `6px` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| align-items | `center` | `center` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| justify-content | `center` | `center` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| justify-self | `stretch` | `stretch` | .pb-tl > :last-child · 2026-09-14-pins2-board-2/index.html:542 |
| height | `28px` | `28px` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| box-sizing | `border-box` | `border-box` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| border-radius | `6px` | `` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| background | `color-mix(in srgb,var(--warn) 12%,transparent)` | `` | .pb-end.pb-nev · 2026-09-14-pins2-board-2/index.html:545 |
| background-color | `` | `color(srgb 1 0.478431 0.270588 / 0.12)` | .pb-end.pb-nev · 2026-09-14-pins2-board-2/index.html:545 |
| background-image | `` | `none` | .pb-end.pb-nev · 2026-09-14-pins2-board-2/index.html:545 |
| box-shadow | `inset 0 0 0 1px color-mix(in srgb,var(--warn) 40%,transparent)` | `color(srgb 1 0.478431 0.270588 / 0.4) 0px 0px 0px 1px inset` | .pb-end.pb-nev · 2026-09-14-pins2-board-2/index.html:545 |
| font | `500 var(--t-sm)/1 var(--data)` | `` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| font-family | `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-end.pb-nev · 2026-09-14-pins2-board-2/index.html:545 |
| font-size | `` | `12px` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| font-weight | `600` | `600` | .pb-end.pb-nev · 2026-09-14-pins2-board-2/index.html:545 |
| font-style | `` | `normal` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| font-variant-numeric | `` | `normal` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| line-height | `` | `12px` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-end · 2026-09-14-pins2-board-2/index.html:543 |
| color | `var(--warn-ink)` | `rgb(255, 158, 114)` | .pb-end.pb-nev · 2026-09-14-pins2-board-2/index.html:545 |


### `div.pb-dates`

inside `.pb-life3` · 2 on screen · **1 look**

#### the one look

`G3-32` · rendered **698×34** · 2 instances look like this

```html
<div class="pb-dates"><span class="pb-pill">⟨svg.ic.⟩up 40d</span><div class="pb-cacts"><button class="pb-ib" aria-label="Edit the text">⟨svg.ic.⟩</button><button class="pb-ib" aria-label="Change dates and repeats">⟨svg.ic.⟩</button><i class="pb-vr" aria-hidden="true"></i><button class="pb-ib pb-del" aria-label="Remove the announcement">⟨svg.ic.⟩</button></div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-dates · 2026-09-14-pins2-board-2/index.html:230 |
| gap | `8px` | `` | .pb-dates · 2026-09-14-pins2-board-2/index.html:230 |
| column-gap | `8px` | `8px` | .pb-dates · 2026-09-14-pins2-board-2/index.html:230 |
| row-gap | `8px` | `8px` | .pb-dates · 2026-09-14-pins2-board-2/index.html:230 |
| flex-wrap | `nowrap` | `nowrap` | .pb-dates · 2026-09-14-pins2-board-2/index.html:419 |
| align-items | `center` | `center` | .pb-dates · 2026-09-14-pins2-board-2/index.html:230 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-pill`

inside `.pb-dates` · 3 on screen · **1 look**

#### the one look

`G3-33` · rendered **81×28** · 3 instances look like this

```html
<span class="pb-pill">⟨svg.ic.⟩up 40d</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| gap | `6px` | `` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| column-gap | `6px` | `6px` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| row-gap | `6px` | `6px` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| align-items | `center` | `center` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| height | `28px` | `28px` | .pb-pill · 2026-09-14-pins2-board-2/index.html:547 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 10px` | `` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| padding-top | `0px` | `0px` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| padding-right | `10px` | `10px` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| padding-bottom | `0px` | `0px` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| padding-left | `10px` | `10px` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| border-radius | `6px` | `` | .pb-pill · 2026-09-14-pins2-board-2/index.html:547 |
| background | `var(--sunk)` | `` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| background-image | `` | `none` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| box-shadow | `inset 0 0 0 1px var(--rule)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| font | `500 var(--t-sm)/1 var(--ui)` | `` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| font-size | `` | `12px` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| font-weight | `` | `500` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| font-style | `` | `normal` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| font-variant-numeric | `` | `normal` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| line-height | `` | `12px` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-pill · 2026-09-14-pins2-board-2/index.html:231 |


### `div.pb-cacts`

inside `.pb-dates` · 2 on screen · **1 look**

#### the one look

`G3-35` · rendered **169×44** · 2 instances look like this

```html
<div class="pb-cacts"><button class="pb-ib" aria-label="Edit the text">⟨svg.ic.⟩</button><button class="pb-ib" aria-label="Change dates and repeats">⟨svg.ic.⟩</button><i class="pb-vr" aria-hidden="true"></i><button class="pb-ib pb-del" aria-label="Remove the announcement">⟨svg.ic.⟩</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-dates .pb-cacts · 2026-09-14-pins2-board-2/index.html:418 |
| gap | `12px` | `` | .pb-dates .pb-cacts · 2026-09-14-pins2-board-2/index.html:505 |
| column-gap | `12px` | `12px` | .pb-dates .pb-cacts · 2026-09-14-pins2-board-2/index.html:505 |
| row-gap | `12px` | `12px` | .pb-dates .pb-cacts · 2026-09-14-pins2-board-2/index.html:505 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `-5px calc(-1 * var(--pb-inset)) -5px auto` | `` | .pb-dates .pb-cacts · 2026-09-14-pins2-board-2/index.html:505 |
| margin-top | `` | `-5px` | .pb-dates .pb-cacts · 2026-09-14-pins2-board-2/index.html:505 |
| margin-right | `` | `-5px` | .pb-dates .pb-cacts · 2026-09-14-pins2-board-2/index.html:505 |
| margin-bottom | `` | `-5px` | .pb-dates .pb-cacts · 2026-09-14-pins2-board-2/index.html:505 |
| margin-left | `` | `444.875px` | .pb-dates .pb-cacts · 2026-09-14-pins2-board-2/index.html:505 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-span`

inside `.pb-bar` · 1 on screen · **1 look**

#### the one look

`G3-59` · rendered **267×6** · 1 instance look like this

```html
<span class="pb-span" style="left:17.543859649122805%;width:calc(91.22807017543859% - 17.543859649122805%)"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .pb-span · 2026-09-14-pins2-board-2/index.html:225 |
| width | `calc(73.6842%)` | `266.734px` | style attribute |
| height | `6px` | `6px` | .pb-span · 2026-09-14-pins2-board-2/index.html:225 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `7px` | `7px` | .pb-tl .pb-span · 2026-09-14-pins2-board-2/index.html:371 |
| left | `17.5439%` | `63.5px` | style attribute |
| border-radius | `3px` | `` | .pb-span · 2026-09-14-pins2-board-2/index.html:225 |
| background | `var(--c)` | `` | .pb-span · 2026-09-14-pins2-board-2/index.html:225 |
| background-color | `` | `rgb(31, 138, 94)` | .pb-span · 2026-09-14-pins2-board-2/index.html:225 |
| background-image | `` | `none` | .pb-span · 2026-09-14-pins2-board-2/index.html:225 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-ban`

inside `.pb-card` · 1 on screen · **1 look**

#### the one look

`G3-76` · rendered **112×63** · 1 instance look like this

```html
<div class="pb-ban"></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| width | `112px` | `112px` | .pb-ban · 2026-09-14-pins2-board-2/index.html:236 |
| height | `63px` | `63px` | .pb-ban · 2026-09-14-pins2-board-2/index.html:236 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-2)` | `` | .pb-ban · 2026-09-14-pins2-board-2/index.html:236 |
| background | `linear-gradient(115deg,#1b2a12,#2f5a1e 40%,#1f8a5e 70%,#b7e07a)` | `` | .pb-ban · 2026-09-14-pins2-board-2/index.html:236 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-ban · 2026-09-14-pins2-board-2/index.html:236 |
| background-image | `linear-gradient(115deg, rgb(27, 42, 18), rgb(47, 90, 30) 40%, rgb(31, 138, 94) 70%, rgb(183, 224, 122))` | `linear-gradient(115deg, rgb(27, 42, 18), rgb(47, 90, 30) 40%, rgb(31, 138, 94) 70%, rgb(183, 224, 122))` | .pb-ban · 2026-09-14-pins2-board-2/index.html:236 |
| box-shadow | `rgba(255, 255, 255, 0.08) 0px 0px 0px 1px inset` | `rgba(255, 255, 255, 0.08) 0px 0px 0px 1px inset` | .pb-ban · 2026-09-14-pins2-board-2/index.html:236 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


## G2 · Admin traffic — resting


### G2 stage

11 distinct signatures on screen; 7 not already specced above.


### `span.pb-gid`

inside `.pb-head` · 1 on screen · **1 look**

#### the one look

`G2-2` · rendered **51×48** · 1 instance look like this · text “G2”

```html
<span class="pb-gid">G2</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 60px/.8 var(--display)` | `` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-family | `` | `"Big Shoulders Display", "Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-size | `` | `60px` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-weight | `` | `700` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-style | `` | `normal` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-variant-numeric | `` | `normal` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| line-height | `` | `48px` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| letter-spacing | — | `normal` | initial |
| color | `var(--realm-c)` | `rgb(156, 200, 90)` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |


### `div.pb-vb`

inside `.pb-gate` · 1 on screen · **1 look**

#### the one look

`G2-6` · rendered **1148×64** · 1 instance look like this

```html
<div class="pb-vb"><span class="pb-realmt">ANALYTICS</span><div class="seg"><button aria-pressed="false">Health</button><button aria-pressed="false">Usage</button><button aria-pressed="true">Timing</button><button aria-pressed="false">Reach</button><button aria-pressed="false">Search</button></div><span class="pb-inc"><span>Include</span><button class="chip pb-adm" aria-pressed="false">⟨svg.ic.⟩Admin traffic</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| gap | `16px` | `` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| column-gap | `16px` | `16px` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| row-gap | `16px` | `16px` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| align-items | `center` | `center` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| width | `1148px` | `1148px` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| min-width | `1148px` | `1148px` | .pb-gate > .pb-man, .pb-gate > .pb-vb, .pb-gate > .pb-g1, .pb-gate > .pb-g6, .pb-gate > .p · 2026-09-14-pins2-board-2/index.html:464 |
| max-width | `100%` | `100%` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| min-height | `64px` | `64px` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| box-sizing | `border-box` | `border-box` | .pb-gate > .pb-man, .pb-gate > .pb-vb, .pb-gate > .pb-g1, .pb-gate > .pb-g6, .pb-gate > .p · 2026-09-14-pins2-board-2/index.html:464 |
| padding | `10px 20px` | `` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| padding-top | `10px` | `10px` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| padding-right | `20px` | `20px` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| padding-bottom | `10px` | `10px` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| padding-left | `20px` | `20px` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| border-radius | `var(--rad-3)` | `` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| background | `var(--paper)` | `` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| background-color | `` | `rgb(23, 30, 36)` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| background-image | `` | `none` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-realmt`

inside `.pb-vb` · 1 on screen · **1 look**

#### the one look

`G2-7` · rendered **65×10** · 1 instance look like this · text “ANALYTICS”

```html
<span class="pb-realmt">ANALYTICS</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-micro)/1 var(--data)` | `` | .pb-vb .pb-realmt · 2026-09-14-pins2-board-2/index.html:240 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-vb .pb-realmt · 2026-09-14-pins2-board-2/index.html:240 |
| font-size | `` | `9.5px` | .pb-vb .pb-realmt · 2026-09-14-pins2-board-2/index.html:240 |
| font-weight | `` | `600` | .pb-vb .pb-realmt · 2026-09-14-pins2-board-2/index.html:240 |
| font-style | `` | `normal` | .pb-vb .pb-realmt · 2026-09-14-pins2-board-2/index.html:240 |
| font-variant-numeric | `` | `normal` | .pb-vb .pb-realmt · 2026-09-14-pins2-board-2/index.html:240 |
| line-height | `` | `9.5px` | .pb-vb .pb-realmt · 2026-09-14-pins2-board-2/index.html:240 |
| letter-spacing | `0.16em` | `1.52px` | .pb-vb .pb-realmt · 2026-09-14-pins2-board-2/index.html:240 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-vb .pb-realmt · 2026-09-14-pins2-board-2/index.html:240 |


### `div.seg`

inside `.pb-vb` · 1 on screen · **1 look**

#### the one look

`G2-8` · rendered **334×42** · 1 instance look like this

```html
<div class="seg"><button aria-pressed="false">Health</button><button aria-pressed="false">Usage</button><button aria-pressed="true">Timing</button><button aria-pressed="false">Reach</button><button aria-pressed="false">Search</button></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .seg · 2026-09-14-pins2-board/app.css:710 |
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
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-inc`

inside `.pb-vb` · 1 on screen · **1 look**

#### the one look

`G2-9` · rendered **208×44** · 1 instance look like this

```html
<span class="pb-inc"><span>Include</span><button class="chip pb-adm" aria-pressed="false">⟨svg.ic.⟩Admin traffic</button></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-inc · 2026-09-14-pins2-board-2/index.html:242 |
| gap | `10px` | `` | .pb-inc · 2026-09-14-pins2-board-2/index.html:242 |
| column-gap | `10px` | `10px` | .pb-inc · 2026-09-14-pins2-board-2/index.html:242 |
| row-gap | `10px` | `10px` | .pb-inc · 2026-09-14-pins2-board-2/index.html:242 |
| align-items | `center` | `center` | .pb-inc · 2026-09-14-pins2-board-2/index.html:242 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-left | `16px` | `16px` | .pb-inc · 2026-09-14-pins2-board-2/index.html:242 |
| box-shadow | `inset 1px 0 0 var(--rule2)` | `rgb(58, 71, 82) 1px 0px 0px 0px inset` | .pb-inc · 2026-09-14-pins2-board-2/index.html:242 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `button.chip.pb-adm`

inside `.pb-inc` · 1 on screen · **1 look**

#### the one look

`G2-11` · rendered **132×44** · 1 instance look like this · aria-pressed="false"

```html
<button class="chip pb-adm" aria-pressed="false">⟨svg.ic.⟩Admin traffic</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| gap | `8px` | `` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| column-gap | `8px` | `8px` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| row-gap | `8px` | `8px` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| align-items | `center` | `center` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| justify-content | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| min-height | `var(--tap)` | `44px` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `0 16px` | `` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| padding-top | `0px` | `0px` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| padding-right | `16px` | `16px` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| padding-bottom | `0px` | `0px` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| padding-left | `16px` | `16px` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
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


### `svg.ic`

inside `.chip` · 1 on screen · **1 look**

#### the one look

`G2-12` · rendered **15×15** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-shield"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `15px` | `15px` | .chip.pb-adm .ic · 2026-09-14-pins2-board-2/index.html:245 |
| height | `15px` | `15px` | .chip.pb-adm .ic · 2026-09-14-pins2-board-2/index.html:245 |
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


## G1 · Small text — resting


### G1 stage

54 distinct signatures on screen; 26 not already specced above.


### `span.pb-gid`

inside `.pb-head` · 1 on screen · **1 look**

#### the one look

`G1-2` · rendered **39×48** · 1 instance look like this · text “G1”

```html
<span class="pb-gid">G1</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 60px/.8 var(--display)` | `` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-family | `` | `"Big Shoulders Display", "Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-size | `` | `60px` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-weight | `` | `700` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-style | `` | `normal` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| font-variant-numeric | `` | `normal` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| line-height | `` | `48px` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |
| letter-spacing | — | `normal` | initial |
| color | `var(--realm-c)` | `rgb(108, 138, 247)` | .pb-gid · 2026-09-14-pins2-board-2/index.html:13 |


### `div`

inside `.pb-head` · 5 on screen · **2 looks**

#### look 1 of 2

`G1-216` · rendered **798×450** · 1 instance look like this

```html
<div style="display:grid;gap:12px"><div class="pb-card" style="--c:#F2C230"><span class="pb-numr">1</span> <div class="pb-body"> <div class="pb-enc" data-open="false" data-exp="1"><p>Season 7 is live — Reckoning drops today…</p><div class="pb-encf"><span>112 characters</span><button class="pb-exp" data-exp="1" aria-expanded="false">Show all⟨svg.ic.⟩</button></div></div> <div class="pb-life3"><div class="pb-tl"><span 
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | style attribute |
| gap | `12px` | `` | style attribute |
| column-gap | `12px` | `12px` | style attribute |
| row-gap | `12px` | `12px` | style attribute |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 2

`G1-285` · rendered **212×48** · 2 instances look like this

```html
<div><b>Clan wars sign-ups open Aug 24 and close…</b><em>⟨svg.ic.⟩Starts showing</em></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-cgi div · 2026-09-14-pins2-board-2/index.html:278 |
| gap | `4px` | `` | .pb-cgi div · 2026-09-14-pins2-board-2/index.html:278 |
| column-gap | `4px` | `4px` | .pb-cgi div · 2026-09-14-pins2-board-2/index.html:278 |
| row-gap | `4px` | `4px` | .pb-cgi div · 2026-09-14-pins2-board-2/index.html:278 |
| min-width | `0px` | `0px` | .pb-cgi div · 2026-09-14-pins2-board-2/index.html:278 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-g1`

inside `.pb-gate` · 1 on screen · **1 look**

#### the one look

`G1-6` · rendered **1148×626** · 1 instance look like this

```html
<div class="pb-g1" id="g1"><div class="pb-tally"><button data-k="R" data-g1k="R" aria-pressed="true"><b>21</b><span>Repeats something · remove</span></button><button data-k="F" data-g1k="F" aria-pressed="true"><b>14</b><span>Belongs on a control</span></button><button data-k="N" data-g1k="N" aria-pressed="true"><b>12</b><span>A problem · chip or warning</span></button><button data-k="K" data-g1k="K" aria-pressed="tru
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-g1 · 2026-09-14-pins2-board-2/index.html:250 |
| gap | `14px` | `` | .pb-g1 · 2026-09-14-pins2-board-2/index.html:250 |
| column-gap | `14px` | `14px` | .pb-g1 · 2026-09-14-pins2-board-2/index.html:250 |
| row-gap | `14px` | `14px` | .pb-g1 · 2026-09-14-pins2-board-2/index.html:250 |
| width | `1148px` | `1148px` | .pb-g1 · 2026-09-14-pins2-board-2/index.html:250 |
| min-width | `1148px` | `1148px` | .pb-gate > .pb-man, .pb-gate > .pb-vb, .pb-gate > .pb-g1, .pb-gate > .pb-g6, .pb-gate > .p · 2026-09-14-pins2-board-2/index.html:464 |
| max-width | `100%` | `100%` | .pb-g1 · 2026-09-14-pins2-board-2/index.html:250 |
| box-sizing | `border-box` | `border-box` | .pb-gate > .pb-man, .pb-gate > .pb-vb, .pb-gate > .pb-g1, .pb-gate > .pb-g6, .pb-gate > .p · 2026-09-14-pins2-board-2/index.html:464 |
| margin | `0 auto` | `` | .pb-g1 · 2026-09-14-pins2-board-2/index.html:250 |
| margin-top | `0px` | `0px` | .pb-g1 · 2026-09-14-pins2-board-2/index.html:250 |
| margin-right | `auto` | `0px` | .pb-g1 · 2026-09-14-pins2-board-2/index.html:250 |
| margin-bottom | `0px` | `0px` | .pb-g1 · 2026-09-14-pins2-board-2/index.html:250 |
| margin-left | `auto` | `0px` | .pb-g1 · 2026-09-14-pins2-board-2/index.html:250 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-tally`

inside `.pb-g1` · 1 on screen · **1 look**

#### the one look

`G1-7` · rendered **1148×92** · 1 instance look like this

```html
<div class="pb-tally"><button data-k="R" data-g1k="R" aria-pressed="true"><b>21</b><span>Repeats something · remove</span></button><button data-k="F" data-g1k="F" aria-pressed="true"><b>14</b><span>Belongs on a control</span></button><button data-k="N" data-g1k="N" aria-pressed="true"><b>12</b><span>A problem · chip or warning</span></button><button data-k="K" data-g1k="K" aria-pressed="true"><b>12</b><span>Stays · r
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-tally · 2026-09-14-pins2-board-2/index.html:251 |
| grid-template-columns | `repeat(6, 1fr)` | `190.5px 190.5px 190.5px 190.5px 190.5px 190.5px` | .pb-tally · 2026-09-14-pins2-board-2/index.html:251 |
| gap | `1px` | `` | .pb-tally · 2026-09-14-pins2-board-2/index.html:251 |
| column-gap | `1px` | `1px` | .pb-tally · 2026-09-14-pins2-board-2/index.html:251 |
| row-gap | `1px` | `1px` | .pb-tally · 2026-09-14-pins2-board-2/index.html:251 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-3)` | `` | .pb-tally · 2026-09-14-pins2-board-2/index.html:251 |
| background | `var(--rule2)` | `` | .pb-tally · 2026-09-14-pins2-board-2/index.html:251 |
| background-color | `` | `rgb(58, 71, 82)` | .pb-tally · 2026-09-14-pins2-board-2/index.html:251 |
| background-image | `` | `none` | .pb-tally · 2026-09-14-pins2-board-2/index.html:251 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-tally · 2026-09-14-pins2-board-2/index.html:251 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-tally · 2026-09-14-pins2-board-2/index.html:251 |
| overflow-x | `hidden` | `hidden` | .pb-tally · 2026-09-14-pins2-board-2/index.html:251 |
| overflow-y | `hidden` | `hidden` | .pb-tally · 2026-09-14-pins2-board-2/index.html:251 |


### `b`

inside `.—` · 11 on screen · **7 looks**

#### look 1 of 7

`G1-8` · rendered **159×26** · 1 instance look like this · text “21”

```html
<b>21</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 26px/1 var(--data)` | `` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-size | `` | `26px` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-weight | `` | `700` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-style | `` | `normal` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| line-height | `` | `26px` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .pb-tally button · 2026-09-14-pins2-board-2/index.html:252 |
| color | `var(--k,var(--ink))` | `rgb(255, 138, 133)` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-tally button · 2026-09-14-pins2-board-2/index.html:252 |

#### look 2 of 7

`G1-10` · rendered **159×35** · 1 instance look like this · text “14”

```html
<b>14</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 26px/1 var(--data)` | `` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-size | `` | `26px` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-weight | `` | `700` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-style | `` | `normal` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| line-height | `` | `26px` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .pb-tally button · 2026-09-14-pins2-board-2/index.html:252 |
| color | `var(--k,var(--ink))` | `rgb(64, 154, 208)` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-tally button · 2026-09-14-pins2-board-2/index.html:252 |

#### look 3 of 7

`G1-12` · rendered **159×35** · 1 instance look like this · text “12”

```html
<b>12</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 26px/1 var(--data)` | `` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-size | `` | `26px` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-weight | `` | `700` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-style | `` | `normal` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| line-height | `` | `26px` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .pb-tally button · 2026-09-14-pins2-board-2/index.html:252 |
| color | `var(--k,var(--ink))` | `rgb(255, 158, 114)` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-tally button · 2026-09-14-pins2-board-2/index.html:252 |

#### look 4 of 7

`G1-14` · rendered **159×35** · 1 instance look like this · text “12”

```html
<b>12</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 26px/1 var(--data)` | `` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-size | `` | `26px` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-weight | `` | `700` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-style | `` | `normal` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| line-height | `` | `26px` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .pb-tally button · 2026-09-14-pins2-board-2/index.html:252 |
| color | `var(--k,var(--ink))` | `rgb(123, 219, 99)` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-tally button · 2026-09-14-pins2-board-2/index.html:252 |

#### look 5 of 7

`G1-16` · rendered **159×35** · 1 instance look like this · text “16”

```html
<b>16</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 26px/1 var(--data)` | `` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-size | `` | `26px` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-weight | `` | `700` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-style | `` | `normal` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| line-height | `` | `26px` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .pb-tally button · 2026-09-14-pins2-board-2/index.html:252 |
| color | `var(--k,var(--ink))` | `rgb(166, 128, 251)` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-tally button · 2026-09-14-pins2-board-2/index.html:252 |

#### look 6 of 7

`G1-18` · rendered **159×35** · 1 instance look like this · text “38”

```html
<b>38</b>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 26px/1 var(--data)` | `` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-size | `` | `26px` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-weight | `` | `700` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-style | `` | `normal` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| font-variant-numeric | `tabular-nums` | `tabular-nums` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| line-height | `` | `26px` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .pb-tally button · 2026-09-14-pins2-board-2/index.html:252 |
| color | `var(--k,var(--ink))` | `rgb(133, 147, 159)` | .pb-tally b · 2026-09-14-pins2-board-2/index.html:254 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-tally button · 2026-09-14-pins2-board-2/index.html:252 |

*1 further looks are the same component in other data hues (a per-row `--c` / `--m` / `--sl`); they differ in colour only.*


### `span`

inside `.—` · 127 on screen · **6 looks**

#### look 1 of 6

`G1-9` · rendered **159×36** · 1 instance look like this · text “Repeats something · remove”

```html
<span>Repeats something · remove</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `var(--t-sm)` | `12px` | .pb-tally span · 2026-09-14-pins2-board-2/index.html:255 |
| font-weight | ↑ `inherit` | `400` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-style | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `18px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .pb-tally button · 2026-09-14-pins2-board-2/index.html:252 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-tally span · 2026-09-14-pins2-board-2/index.html:255 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-tally button · 2026-09-14-pins2-board-2/index.html:252 |

#### look 2 of 6

`G1-11` · rendered **159×27** · 5 instances look like this · text “Belongs on a control”

```html
<span>Belongs on a control</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `inherit` | `` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-family | ↑ `inherit` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-size | `var(--t-sm)` | `12px` | .pb-tally span · 2026-09-14-pins2-board-2/index.html:255 |
| font-weight | ↑ `inherit` | `400` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-style | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| font-variant-numeric | ↑ `inherit` | `normal` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| line-height | ↑ `inherit` | `18px` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| letter-spacing | ↑ `normal` | `normal` | inherited · input, textarea, select, button · user-agent:? |
| text-transform | ↑ `none` | `none` | inherited · input, textarea, select, button · user-agent:? |
| text-align | ↑ `left` | `left` | inherited · .pb-tally button · 2026-09-14-pins2-board-2/index.html:252 |
| color | `var(--ink2)` | `rgb(157, 170, 180)` | .pb-tally span · 2026-09-14-pins2-board-2/index.html:255 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-tally button · 2026-09-14-pins2-board-2/index.html:252 |

#### look 3 of 6

`G1-23` · rendered **453×34** · 35 instances look like this · text “By admin: “1 admin × 12 permissions” · By permis” · title="By admin: “1 admin × 12 permissions” · B"

```html
<span title="By admin: “1 admin × 12 permissions” · By permission: “N single points · M held by nobody but you”">By admin: “1 admin × 12 permissions” · B…</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `-webkit-box` | `flow-root` | .pb-g1t td:nth-child(3) span, .pb-g1t td:nth-child(6) span · 2026-09-14-pins2-board-2/index.html:260 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .pb-tbl · 2026-09-14-pins2-board-2/index.html:175 |
| font-weight | ↑ `normal` | `400` | inherited · table · user-agent:? |
| font-style | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| font-variant-numeric | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| line-height | ↑ `1.4` | `16.8px` | inherited · .pb-tbl td · 2026-09-14-pins2-board-2/index.html:177 |
| letter-spacing | — | `normal` | initial |
| text-align | ↑ `start` | `start` | inherited · table · user-agent:? |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-g1t td:nth-child(3) span · 2026-09-14-pins2-board-2/index.html:261 |
| overflow | `hidden` | `` | .pb-g1t td:nth-child(3) span, .pb-g1t td:nth-child(6) span · 2026-09-14-pins2-board-2/index.html:260 |
| overflow-x | `hidden` | `hidden` | .pb-g1t td:nth-child(3) span, .pb-g1t td:nth-child(6) span · 2026-09-14-pins2-board-2/index.html:260 |
| overflow-y | `hidden` | `hidden` | .pb-g1t td:nth-child(3) span, .pb-g1t td:nth-child(6) span · 2026-09-14-pins2-board-2/index.html:260 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |

#### look 4 of 6

`G1-25` · rendered **265×34** · 21 instances look like this · text “By admin: remove “1 admin × 12 permissions”, the”

```html
<span>By admin: remove “1 admin × 12 permissio…</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `-webkit-box` | `flow-root` | .pb-g1t td:nth-child(3) span, .pb-g1t td:nth-child(6) span · 2026-09-14-pins2-board-2/index.html:260 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .pb-tbl · 2026-09-14-pins2-board-2/index.html:175 |
| font-weight | ↑ `normal` | `400` | inherited · table · user-agent:? |
| font-style | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| font-variant-numeric | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| line-height | ↑ `1.4` | `16.8px` | inherited · .pb-tbl td · 2026-09-14-pins2-board-2/index.html:177 |
| letter-spacing | — | `normal` | initial |
| text-align | ↑ `start` | `start` | inherited · table · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-tbl td · 2026-09-14-pins2-board-2/index.html:177 |
| overflow | `hidden` | `` | .pb-g1t td:nth-child(3) span, .pb-g1t td:nth-child(6) span · 2026-09-14-pins2-board-2/index.html:260 |
| overflow-x | `hidden` | `hidden` | .pb-g1t td:nth-child(3) span, .pb-g1t td:nth-child(6) span · 2026-09-14-pins2-board-2/index.html:260 |
| overflow-y | `hidden` | `hidden` | .pb-g1t td:nth-child(3) span, .pb-g1t td:nth-child(6) span · 2026-09-14-pins2-board-2/index.html:260 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |

#### look 5 of 6

`G1-30` · rendered **453×17** · 24 instances look like this · text “Only ever visible here.” · title="Only ever visible here."

```html
<span title="Only ever visible here.">Only ever visible here.</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `-webkit-box` | `flow-root` | .pb-g1t td:nth-child(3) span, .pb-g1t td:nth-child(6) span · 2026-09-14-pins2-board-2/index.html:260 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .pb-tbl · 2026-09-14-pins2-board-2/index.html:175 |
| font-weight | ↑ `normal` | `400` | inherited · table · user-agent:? |
| font-style | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| font-variant-numeric | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| line-height | ↑ `1.4` | `16.8px` | inherited · .pb-tbl td · 2026-09-14-pins2-board-2/index.html:177 |
| letter-spacing | — | `normal` | initial |
| text-align | ↑ `start` | `start` | inherited · table · user-agent:? |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-g1t td:nth-child(3) span · 2026-09-14-pins2-board-2/index.html:261 |
| overflow | `hidden` | `` | .pb-g1t td:nth-child(3) span, .pb-g1t td:nth-child(6) span · 2026-09-14-pins2-board-2/index.html:260 |
| overflow-x | `hidden` | `hidden` | .pb-g1t td:nth-child(3) span, .pb-g1t td:nth-child(6) span · 2026-09-14-pins2-board-2/index.html:260 |
| overflow-y | `hidden` | `hidden` | .pb-g1t td:nth-child(3) span, .pb-g1t td:nth-child(6) span · 2026-09-14-pins2-board-2/index.html:260 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |

#### look 6 of 6

`G1-32` · rendered **265×17** · 38 instances look like this · text “Remove”

```html
<span>Remove</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `-webkit-box` | `flow-root` | .pb-g1t td:nth-child(3) span, .pb-g1t td:nth-child(6) span · 2026-09-14-pins2-board-2/index.html:260 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .pb-tbl · 2026-09-14-pins2-board-2/index.html:175 |
| font-weight | ↑ `normal` | `400` | inherited · table · user-agent:? |
| font-style | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| font-variant-numeric | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| line-height | ↑ `1.4` | `16.8px` | inherited · .pb-tbl td · 2026-09-14-pins2-board-2/index.html:177 |
| letter-spacing | — | `normal` | initial |
| text-align | ↑ `start` | `start` | inherited · table · user-agent:? |
| color | ↑ `var(--ink2)` | `rgb(157, 170, 180)` | inherited · .pb-tbl td · 2026-09-14-pins2-board-2/index.html:177 |
| overflow | `hidden` | `` | .pb-g1t td:nth-child(3) span, .pb-g1t td:nth-child(6) span · 2026-09-14-pins2-board-2/index.html:260 |
| overflow-x | `hidden` | `hidden` | .pb-g1t td:nth-child(3) span, .pb-g1t td:nth-child(6) span · 2026-09-14-pins2-board-2/index.html:260 |
| overflow-y | `hidden` | `hidden` | .pb-g1t td:nth-child(3) span, .pb-g1t td:nth-child(6) span · 2026-09-14-pins2-board-2/index.html:260 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |


### `div.pb-g1wrap`

inside `.pb-g1` · 1 on screen · **1 look**

#### the one look

`G1-20` · rendered **1148×520** · 1 instance look like this

```html
<div class="pb-g1wrap"><table class="pb-tbl pb-g1t"><thead><tr><th>Realm</th><th>Where</th><th>Text</th><th>Kind</th><th>Ledger</th><th>Treatment</th></tr></thead><tbody> <tr class="pb-pin"><td>Access</td><td><code>access.js:871</code></td><td><span title="By admin: “1 admin × 12 permissions” · By permission: “N single points · M held by nobody but you”">By admin: “1 admin × 12 permissions” · B…</span></td><td><span 
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| max-height | `520px` | `520px` | .pb-g1wrap · 2026-09-14-pins2-board-2/index.html:258 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-3)` | `` | .pb-g1wrap · 2026-09-14-pins2-board-2/index.html:258 |
| background | `var(--paper)` | `` | .pb-g1wrap · 2026-09-14-pins2-board-2/index.html:258 |
| background-color | `` | `rgb(23, 30, 36)` | .pb-g1wrap · 2026-09-14-pins2-board-2/index.html:258 |
| background-image | `` | `none` | .pb-g1wrap · 2026-09-14-pins2-board-2/index.html:258 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-g1wrap · 2026-09-14-pins2-board-2/index.html:258 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `auto` | `` | .pb-g1wrap · 2026-09-14-pins2-board-2/index.html:258 |
| overflow-x | `auto` | `auto` | .pb-g1wrap · 2026-09-14-pins2-board-2/index.html:258 |
| overflow-y | `auto` | `auto` | .pb-g1wrap · 2026-09-14-pins2-board-2/index.html:258 |


### `table.pb-g1t.pb-tbl`

inside `.pb-g1wrap` · 1 on screen · **1 look**

#### the one look

`G1-21` · rendered **1148×2793** · 1 instance look like this

```html
<table class="pb-tbl pb-g1t"><thead><tr><th>Realm</th><th>Where</th><th>Text</th><th>Kind</th><th>Ledger</th><th>Treatment</th></tr></thead><tbody> <tr class="pb-pin"><td>Access</td><td><code>access.js:871</code></td><td><span title="By admin: “1 admin × 12 permissions” · By permission: “N single points · M held by nobody but you”">By admin: “1 admin × 12 permissions” · B…</span></td><td><span class="pb-k" data-k="R"
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `table` | `table` | table · user-agent:? |
| width | `100%` | `1148px` | .pb-tbl · 2026-09-14-pins2-board-2/index.html:175 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | `var(--t-sm)` | `12px` | .pb-tbl · 2026-09-14-pins2-board-2/index.html:175 |
| font-weight | `normal` | `400` | table · user-agent:? |
| line-height | `normal` | `normal` | table · user-agent:? |
| letter-spacing | — | `normal` | initial |
| text-align | `start` | `start` | table · user-agent:? |
| color | `-internal-quirk-inherit` | `rgb(232, 237, 241)` | table · user-agent:? |


### `tr.pb-pin`

inside `.—` · 4 on screen · **2 looks**

#### look 1 of 2

`G1-22` · rendered **1148×67** · 1 instance look like this

```html
<tr class="pb-pin"><td>Access</td><td><code>access.js:871</code></td><td><span title="By admin: “1 admin × 12 permissions” · By permission: “N single points · M held by nobody but you”">By admin: “1 admin × 12 permissions” · B…</span></td><td><span class="pb-k" data-k="R">R</span></td><td>2026-09-06 derived counts</td><td><span>By admin: remove “1 admin × 12 permissio…</span></td></tr>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `table-row` | `table-row` | tr · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .pb-tbl · 2026-09-14-pins2-board-2/index.html:175 |
| font-weight | ↑ `normal` | `400` | inherited · table · user-agent:? |
| font-style | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| font-variant-numeric | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| line-height | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| letter-spacing | — | `normal` | initial |
| text-align | ↑ `start` | `start` | inherited · table · user-agent:? |
| color | ↑ `-internal-quirk-inherit` | `rgb(232, 237, 241)` | inherited · table · user-agent:? |
| transition | `transform var(--dur-1) var(--ease),box-shadow var(--dur-1) var(--ease), background var(--dur-1) var(--ease)` | `` | tbody tr · 2026-09-14-pins2-board/app.css:5724 |
| cursor | `pointer` | `pointer` | tbody tr · 2026-09-14-pins2-board/app.css:971 |

#### look 2 of 2

`G1-26` · rendered **1148×51** · 3 instances look like this

```html
<tr class="pb-pin"><td>Broadcast</td><td><code>broadcast.js:99</code></td><td><span title="Delivered as an ephemeral follow-up after any top-level slash command, every unseen announcement as its own embed in ONE message. Each carries its own">Delivered as an ephemeral follow-up afte…</span></td><td><span class="pb-k" data-k="R">R</span></td><td>—</td><td><span>Remove — the composer’s preview shows wh…</span></td></tr
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `table-row` | `table-row` | tr · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-sm)` | `12px` | inherited · .pb-tbl · 2026-09-14-pins2-board-2/index.html:175 |
| font-weight | ↑ `normal` | `400` | inherited · table · user-agent:? |
| font-style | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| font-variant-numeric | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| line-height | ↑ `normal` | `normal` | inherited · table · user-agent:? |
| letter-spacing | — | `normal` | initial |
| text-align | ↑ `start` | `start` | inherited · table · user-agent:? |
| color | ↑ `-internal-quirk-inherit` | `rgb(232, 237, 241)` | inherited · table · user-agent:? |
| transition | `transform var(--dur-1) var(--ease),box-shadow var(--dur-1) var(--ease), background var(--dur-1) var(--ease)` | `` | tbody tr · 2026-09-14-pins2-board/app.css:5724 |
| cursor | `pointer` | `pointer` | tbody tr · 2026-09-14-pins2-board/app.css:971 |


### `span.pb-k`

inside `.—` · 59 on screen · **4 looks**

#### look 1 of 4

`G1-24` · rendered **6×13** · 21 instances look like this · text “R”

```html
<span class="pb-k" data-k="R">R</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `inline` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 var(--t-micro)/1 var(--data)` | `` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-size | `` | `9.5px` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-weight | `` | `700` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-style | `` | `normal` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-variant-numeric | `` | `normal` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| line-height | `` | `9.5px` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| letter-spacing | `0.08em` | `0.76px` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| text-align | ↑ `start` | `start` | inherited · table · user-agent:? |
| color | `var(--k)` | `rgb(255, 138, 133)` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |

#### look 2 of 4

`G1-89` · rendered **6×13** · 14 instances look like this · text “F”

```html
<span class="pb-k" data-k="F">F</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `inline` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 var(--t-micro)/1 var(--data)` | `` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-size | `` | `9.5px` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-weight | `` | `700` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-style | `` | `normal` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-variant-numeric | `` | `normal` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| line-height | `` | `9.5px` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| letter-spacing | `0.08em` | `0.76px` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| text-align | ↑ `start` | `start` | inherited · table · user-agent:? |
| color | `var(--k)` | `rgb(64, 154, 208)` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |

#### look 3 of 4

`G1-132` · rendered **6×13** · 12 instances look like this · text “N”

```html
<span class="pb-k" data-k="N">N</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `inline` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 var(--t-micro)/1 var(--data)` | `` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-size | `` | `9.5px` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-weight | `` | `700` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-style | `` | `normal` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-variant-numeric | `` | `normal` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| line-height | `` | `9.5px` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| letter-spacing | `0.08em` | `0.76px` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| text-align | ↑ `start` | `start` | inherited · table · user-agent:? |
| color | `var(--k)` | `rgb(255, 158, 114)` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |

#### look 4 of 4

`G1-168` · rendered **6×13** · 12 instances look like this · text “K”

```html
<span class="pb-k" data-k="K">K</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `inline` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 var(--t-micro)/1 var(--data)` | `` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-size | `` | `9.5px` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-weight | `` | `700` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-style | `` | `normal` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| font-variant-numeric | `` | `normal` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| line-height | `` | `9.5px` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| letter-spacing | `0.08em` | `0.76px` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| text-align | ↑ `start` | `start` | inherited · table · user-agent:? |
| color | `var(--k)` | `rgb(123, 219, 99)` | .pb-k · 2026-09-14-pins2-board-2/index.html:257 |
| cursor | ↑ `pointer` | `pointer` | inherited · tbody tr · 2026-09-14-pins2-board/app.css:971 |


### `h3.pb-sub`

inside `.pb-gate` · 1 on screen · **1 look**

#### the one look

`G1-203` · rendered **1148×42** · 1 instance look like this

```html
<h3 class="pb-sub" style="--realm-c:var(--r-broadcast)">After · the delivery queue <span class="pb-ctl" style="margin-left:auto"><span class="seg pb-seg" data-seg="qcol"><span class="pb-thumb" style="width: 117px; transform: translateX(3px);"></span><button data-v="on" aria-pressed="true">Changes ahead</button><button data-v="off" aria-pressed="false">No side column</button></span></span></h3>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| gap | `12px` | `` | .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| column-gap | `12px` | `12px` | .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| row-gap | `12px` | `12px` | .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| align-items | `center` | `center` | .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin | `0` | `` | .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| margin-top | `0px` | `0px` | .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| margin-right | `0px` | `0px` | .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| margin-bottom | `0px` | `0px` | .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| margin-left | `0px` | `0px` | .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font | `600 var(--t-md)/1.2 var(--ui)` | `` | .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-size | `` | `14.5px` | .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-weight | `` | `600` | .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-style | `` | `normal` | .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-variant-numeric | `` | `normal` | .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| line-height | `` | `17.4px` | .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |

**::after**

| property | winning declaration | from |
|---|---|---|
| flex | `1` | .pb-sub::after · 2026-09-14-pins2-board-2/index.html:31 |
| height | `1px` | .pb-sub::after · 2026-09-14-pins2-board-2/index.html:31 |
| background | `var(--rule2)` | .pb-sub::after · 2026-09-14-pins2-board-2/index.html:31 |
| background-color | `` | .pb-sub::after · 2026-09-14-pins2-board-2/index.html:31 |
| background-image | `` | .pb-sub::after · 2026-09-14-pins2-board-2/index.html:31 |
| content | `""` | .pb-sub::after · 2026-09-14-pins2-board-2/index.html:31 |


### `span.pb-ctl`

inside `.pb-sub` · 1 on screen · **1 look**

#### the one look

`G1-204` · rendered **243×42** · 1 instance look like this

```html
<span class="pb-ctl" style="margin-left:auto"><span class="seg pb-seg" data-seg="qcol"><span class="pb-thumb" style="width: 117px; transform: translateX(3px);"></span><button data-v="on" aria-pressed="true">Changes ahead</button><button data-v="off" aria-pressed="false">No side column</button></span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-ctl · 2026-09-14-pins2-board-2/index.html:16 |
| gap | `8px` | `` | .pb-ctl · 2026-09-14-pins2-board-2/index.html:16 |
| column-gap | `8px` | `8px` | .pb-ctl · 2026-09-14-pins2-board-2/index.html:16 |
| row-gap | `8px` | `8px` | .pb-ctl · 2026-09-14-pins2-board-2/index.html:16 |
| align-items | `center` | `center` | .pb-ctl · 2026-09-14-pins2-board-2/index.html:16 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-left | `auto` | `0px` | style attribute |
| font | ↑ `600 var(--t-md)/1.2 var(--ui)` | `` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-size | ↑ `` | `14.5px` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-weight | ↑ `` | `600` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-style | ↑ `` | `normal` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| line-height | ↑ `` | `17.4px` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |


### `span.pb-seg.seg`

inside `.pb-ctl` · 1 on screen · **1 look**

#### the one look

`G1-205` · rendered **243×42** · 1 instance look like this

```html
<span class="seg pb-seg" data-seg="qcol"><span class="pb-thumb" style="width: 117px; transform: translateX(3px);"></span><button data-v="on" aria-pressed="true">Changes ahead</button><button data-v="off" aria-pressed="false">No side column</button></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-seg.seg · 2026-09-14-pins2-board-2/index.html:17 |
| position | `relative` | `relative` | .pb-seg.seg · 2026-09-14-pins2-board-2/index.html:17 |
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
| font | ↑ `600 var(--t-md)/1.2 var(--ui)` | `` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-size | ↑ `` | `14.5px` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-weight | ↑ `` | `600` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-style | ↑ `` | `normal` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| line-height | ↑ `` | `17.4px` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |


### `span.pb-thumb`

inside `.seg` · 1 on screen · **1 look**

#### the one look

`G1-206` · rendered **117×34** · 1 instance look like this

```html
<span class="pb-thumb" style="width: 117px; transform: translateX(3px);"></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| position | `absolute` | `absolute` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| width | `117px` | `117px` | style attribute |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| top | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| bottom | `3px` | `3px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| left | `0px` | `0px` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| border-radius | `var(--rad-pill)` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| background | `var(--hi)` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| background-color | `` | `rgb(35, 44, 52)` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| background-image | `` | `none` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |
| font | ↑ `600 var(--t-md)/1.2 var(--ui)` | `` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-size | ↑ `` | `14.5px` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-weight | ↑ `` | `600` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-style | ↑ `` | `normal` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| line-height | ↑ `` | `17.4px` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · .pb-sub · 2026-09-14-pins2-board-2/index.html:30 |
| transform | `translateX(3px)` | `matrix(1, 0, 0, 1, 3, 0)` | style attribute |
| transition | `transform .26s cubic-bezier(.3,.7,.2,1),width .26s cubic-bezier(.3,.7,.2,1)` | `` | .pb-seg .pb-thumb · 2026-09-14-pins2-board-2/index.html:20 |


### `div.app.pb-after.pb-realm`

inside `.pb-gate` · 1 on screen · **1 look**

#### the one look

`G1-207` · rendered **1148×546** · 1 instance look like this

```html
<div class="pb-after pb-realm app" data-realm="broadcast" id="qafter"><div class="pb-vb"><span class="pb-realmt">BROADCAST</span><div class="seg"><button aria-pressed="true">Delivery queue</button><button aria-pressed="false">Airtime</button></div><span class="pb-qcount"><span class="cmeter"><i style="width:20%"></i></span><b>2</b> of 10 slots used</span></div> <div class="pb-qafter" data-col="on"><div style="display
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .pb-realm.app · 2026-09-14-pins2-board-2/index.html:6 |
| grid-template-columns | `none` | `none` | .pb-realm.app · 2026-09-14-pins2-board-2/index.html:6 |
| grid-template-rows | `none` | `none` | .pb-realm.app · 2026-09-14-pins2-board-2/index.html:6 |
| min-width | `1148px` | `1148px` | .pb-gate > .pb-man, .pb-gate > .pb-vb, .pb-gate > .pb-g1, .pb-gate > .pb-g6, .pb-gate > .p · 2026-09-14-pins2-board-2/index.html:464 |
| height | `auto` | `545.875px` | .pb-realm.app · 2026-09-14-pins2-board-2/index.html:6 |
| box-sizing | `border-box` | `border-box` | .pb-gate > .pb-man, .pb-gate > .pb-vb, .pb-gate > .pb-g1, .pb-gate > .pb-g6, .pb-gate > .p · 2026-09-14-pins2-board-2/index.html:464 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-vb`

inside `.pb-after` · 1 on screen · **1 look**

#### the one look

`G1-208` · rendered **1148×64** · 1 instance look like this

```html
<div class="pb-vb"><span class="pb-realmt">BROADCAST</span><div class="seg"><button aria-pressed="true">Delivery queue</button><button aria-pressed="false">Airtime</button></div><span class="pb-qcount"><span class="cmeter"><i style="width:20%"></i></span><b>2</b> of 10 slots used</span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| gap | `16px` | `` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| column-gap | `16px` | `16px` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| row-gap | `16px` | `16px` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| align-items | `center` | `center` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| width | `1148px` | `1148px` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| max-width | `100%` | `100%` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| min-height | `64px` | `64px` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| box-sizing | `border-box` | `border-box` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| padding | `10px 20px` | `` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| padding-top | `10px` | `10px` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| padding-right | `20px` | `20px` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| padding-bottom | `10px` | `10px` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| padding-left | `20px` | `20px` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| border-radius | `var(--rad-3) var(--rad-3) 0 0` | `` | .pb-after .pb-vb · 2026-09-14-pins2-board-2/index.html:268 |
| background | `var(--paper)` | `` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| background-color | `` | `rgb(23, 30, 36)` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| background-image | `` | `none` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-vb · 2026-09-14-pins2-board-2/index.html:239 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `span.pb-qcount`

inside `.pb-vb` · 1 on screen · **1 look**

#### the one look

`G1-211` · rendered **238×12** · 1 instance look like this

```html
<span class="pb-qcount"><span class="cmeter"><i style="width:20%"></i></span><b>2</b> of 10 slots used</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| gap | `10px` | `` | .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| column-gap | `10px` | `10px` | .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| row-gap | `10px` | `10px` | .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| align-items | `center` | `center` | .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| margin-left | `auto` | `583.281px` | .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| font | `500 var(--t-sm)/1 var(--data)` | `` | .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| font-size | `` | `12px` | .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| font-weight | `` | `500` | .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| font-style | `` | `normal` | .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| font-variant-numeric | `` | `normal` | .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| line-height | `` | `12px` | .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |


### `span.cmeter`

inside `.pb-qcount` · 1 on screen · **1 look**

#### the one look

`G1-212` · rendered **96×4** · 1 instance look like this

```html
<span class="cmeter"><i style="width:20%"></i></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-qcount .cmeter · 2026-09-14-pins2-board-2/index.html:271 |
| width | `96px` | `96px` | .pb-qcount .cmeter · 2026-09-14-pins2-board-2/index.html:271 |
| height | `4px` | `4px` | .cmeter · 2026-09-14-pins2-board/app.css:2170 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1)` | `` | .cmeter · 2026-09-14-pins2-board/app.css:2170 |
| background | `var(--rule)` | `` | .cmeter · 2026-09-14-pins2-board/app.css:2170 |
| background-color | `` | `rgb(42, 52, 61)` | .cmeter · 2026-09-14-pins2-board/app.css:2170 |
| background-image | `` | `none` | .cmeter · 2026-09-14-pins2-board/app.css:2170 |
| font | ↑ `500 var(--t-sm)/1 var(--data)` | `` | inherited · .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| font-size | ↑ `` | `12px` | inherited · .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| font-weight | ↑ `` | `500` | inherited · .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| font-style | ↑ `` | `normal` | inherited · .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| line-height | ↑ `` | `12px` | inherited · .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| overflow | `hidden` | `` | .cmeter · 2026-09-14-pins2-board/app.css:2170 |
| overflow-x | `hidden` | `hidden` | .cmeter · 2026-09-14-pins2-board/app.css:2170 |
| overflow-y | `hidden` | `hidden` | .cmeter · 2026-09-14-pins2-board/app.css:2170 |


### `i`

inside `.cmeter` · 1 on screen · **1 look**

#### the one look

`G1-213` · rendered **19×4** · 1 instance look like this

```html
<i style="width:20%"></i>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | .cmeter i · 2026-09-14-pins2-board/app.css:2178 |
| width | `20%` | `19.1875px` | style attribute |
| height | `100%` | `4px` | .cmeter i · 2026-09-14-pins2-board/app.css:2178 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-radius | `var(--rad-1)` | `` | .cmeter i · 2026-09-14-pins2-board/app.css:2178 |
| background | `var(--r-broadcast)` | `` | .pb-qcount .cmeter i · 2026-09-14-pins2-board-2/index.html:272 |
| background-color | `` | `rgb(236, 72, 153)` | .pb-qcount .cmeter i · 2026-09-14-pins2-board-2/index.html:272 |
| background-image | `` | `none` | .pb-qcount .cmeter i · 2026-09-14-pins2-board-2/index.html:272 |
| font | ↑ `500 var(--t-sm)/1 var(--data)` | `` | inherited · .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| font-size | ↑ `` | `12px` | inherited · .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| font-weight | ↑ `` | `500` | inherited · .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| font-style | `italic` | `italic` | i, cite, em, var, address, dfn · user-agent:? |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| line-height | ↑ `` | `12px` | inherited · .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .pb-qcount · 2026-09-14-pins2-board-2/index.html:269 |


### `div.pb-qafter`

inside `.pb-after` · 1 on screen · **1 look**

#### the one look

`G1-215` · rendered **1148×482** · 1 instance look like this

```html
<div class="pb-qafter" data-col="on"><div style="display:grid;gap:12px"><div class="pb-card" style="--c:#F2C230"><span class="pb-numr">1</span> <div class="pb-body"> <div class="pb-enc" data-open="false" data-exp="1"><p>Season 7 is live — Reckoning drops today…</p><div class="pb-encf"><span>112 characters</span><button class="pb-exp" data-exp="1" aria-expanded="false">Show all⟨svg.ic.⟩</button></div></div> <div class
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-qafter · 2026-09-14-pins2-board-2/index.html:265 |
| grid-template-columns | `minmax(0px, 1fr) 300px` | `798px 300px` | .pb-qafter · 2026-09-14-pins2-board-2/index.html:265 |
| gap | `18px` | `` | .pb-qafter · 2026-09-14-pins2-board-2/index.html:265 |
| column-gap | `18px` | `18px` | .pb-qafter · 2026-09-14-pins2-board-2/index.html:265 |
| row-gap | `18px` | `18px` | .pb-qafter · 2026-09-14-pins2-board-2/index.html:265 |
| width | `1148px` | `1148px` | .pb-qafter · 2026-09-14-pins2-board-2/index.html:265 |
| max-width | `100%` | `100%` | .pb-qafter · 2026-09-14-pins2-board-2/index.html:265 |
| box-sizing | `border-box` | `border-box` | .pb-qafter · 2026-09-14-pins2-board-2/index.html:265 |
| padding | `16px` | `` | .pb-qafter · 2026-09-14-pins2-board-2/index.html:265 |
| padding-top | `16px` | `16px` | .pb-qafter · 2026-09-14-pins2-board-2/index.html:265 |
| padding-right | `16px` | `16px` | .pb-qafter · 2026-09-14-pins2-board-2/index.html:265 |
| padding-bottom | `16px` | `16px` | .pb-qafter · 2026-09-14-pins2-board-2/index.html:265 |
| padding-left | `16px` | `16px` | .pb-qafter · 2026-09-14-pins2-board-2/index.html:265 |
| border-radius | `0 0 var(--rad-3) var(--rad-3)` | `` | .pb-qafter · 2026-09-14-pins2-board-2/index.html:265 |
| background | `var(--paper)` | `` | .pb-qafter · 2026-09-14-pins2-board-2/index.html:265 |
| background-color | `` | `rgb(23, 30, 36)` | .pb-qafter · 2026-09-14-pins2-board-2/index.html:265 |
| background-image | `` | `none` | .pb-qafter · 2026-09-14-pins2-board-2/index.html:265 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-qafter · 2026-09-14-pins2-board-2/index.html:265 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `svg.ic`

inside `.pb-exp` · 17 on screen · **2 looks**

#### look 1 of 2

`G1-288` · rendered **12×12** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-in"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `12px` | `12px` | .pb-cgi em .ic · 2026-09-14-pins2-board-2/index.html:281 |
| height | `12px` | `12px` | .pb-cgi em .ic · 2026-09-14-pins2-board-2/index.html:281 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `600 var(--t-xs)/1 var(--ui)` | `` | inherited · .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-size | ↑ `` | `10.5px` | inherited · .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-weight | ↑ `` | `600` | inherited · .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-style | ↑ `normal` | `normal` | inherited · .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| line-height | ↑ `` | `10.5px` | inherited · .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--gc)` | `rgb(123, 219, 99)` | inherited · .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |

#### look 2 of 2

`G1-295` · rendered **12×12** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-out"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `12px` | `12px` | .pb-cgi em .ic · 2026-09-14-pins2-board-2/index.html:281 |
| height | `12px` | `12px` | .pb-cgi em .ic · 2026-09-14-pins2-board-2/index.html:281 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `600 var(--t-xs)/1 var(--ui)` | `` | inherited · .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-size | ↑ `` | `10.5px` | inherited · .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-weight | ↑ `` | `600` | inherited · .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-style | ↑ `normal` | `normal` | inherited · .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| line-height | ↑ `` | `10.5px` | inherited · .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--gc)` | `rgb(133, 147, 159)` | inherited · .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |


### `div.pb-cg`

inside `.pb-qafter` · 1 on screen · **1 look**

#### the one look

`G1-281` · rendered **300×166** · 1 instance look like this

```html
<div class="pb-cg"><h5>Changes ahead</h5> <div class="pb-cgi" data-g="in"><time><small>AUG</small>26</time><div><b>Clan wars sign-ups open Aug 24 and close…</b><em>⟨svg.ic.⟩Starts showing</em></div></div> <div class="pb-cgi" data-g="out"><time><small>SEP</small>25</time><div><b>Double CP this weekend — 2x CP on every …</b><em>⟨svg.ic.⟩Stops showing</em></div></div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-cg · 2026-09-14-pins2-board-2/index.html:273 |
| gap | `8px` | `` | .pb-cg · 2026-09-14-pins2-board-2/index.html:273 |
| column-gap | `8px` | `8px` | .pb-cg · 2026-09-14-pins2-board-2/index.html:273 |
| row-gap | `8px` | `8px` | .pb-cg · 2026-09-14-pins2-board-2/index.html:273 |
| align-self | `start` | `start` | .pb-cg · 2026-09-14-pins2-board-2/index.html:550 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-cgi`

inside `.pb-cg` · 2 on screen · **1 look**

#### the one look

`G1-282` · rendered **300×68** · 2 instances look like this

```html
<div class="pb-cgi" data-g="in"><time><small>AUG</small>26</time><div><b>Clan wars sign-ups open Aug 24 and close…</b><em>⟨svg.ic.⟩Starts showing</em></div></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-cgi · 2026-09-14-pins2-board-2/index.html:275 |
| position | `relative` | `relative` | .pb-cgi · 2026-09-14-pins2-board-2/index.html:275 |
| grid-template-columns | `52px minmax(0px, 1fr)` | `52px 212px` | .pb-cgi · 2026-09-14-pins2-board-2/index.html:275 |
| gap | `12px` | `` | .pb-cgi · 2026-09-14-pins2-board-2/index.html:275 |
| column-gap | `12px` | `12px` | .pb-cgi · 2026-09-14-pins2-board-2/index.html:275 |
| row-gap | `12px` | `12px` | .pb-cgi · 2026-09-14-pins2-board-2/index.html:275 |
| align-items | `center` | `center` | .pb-cgi · 2026-09-14-pins2-board-2/index.html:275 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `10px 12px` | `` | .pb-cgi · 2026-09-14-pins2-board-2/index.html:275 |
| padding-top | `10px` | `10px` | .pb-cgi · 2026-09-14-pins2-board-2/index.html:275 |
| padding-right | `12px` | `12px` | .pb-cgi · 2026-09-14-pins2-board-2/index.html:275 |
| padding-bottom | `10px` | `10px` | .pb-cgi · 2026-09-14-pins2-board-2/index.html:275 |
| padding-left | `12px` | `12px` | .pb-cgi · 2026-09-14-pins2-board-2/index.html:275 |
| border-radius | `var(--rad-2)` | `` | .pb-cgi · 2026-09-14-pins2-board-2/index.html:275 |
| background | `var(--raised)` | `` | .pb-cgi · 2026-09-14-pins2-board-2/index.html:275 |
| background-color | `` | `rgb(31, 39, 46)` | .pb-cgi · 2026-09-14-pins2-board-2/index.html:275 |
| background-image | `` | `none` | .pb-cgi · 2026-09-14-pins2-board-2/index.html:275 |
| box-shadow | `inset 0 0 0 1px var(--rule)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset` | .pb-cgi · 2026-09-14-pins2-board-2/index.html:275 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `time`

inside `.pb-cgi` · 2 on screen · **1 look**

#### the one look

`G1-283` · rendered **52×27** · 2 instances look like this

```html
<time><small>AUG</small>26</time>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-cgi time · 2026-09-14-pins2-board-2/index.html:276 |
| gap | `3px` | `` | .pb-cgi time · 2026-09-14-pins2-board-2/index.html:276 |
| column-gap | `3px` | `3px` | .pb-cgi time · 2026-09-14-pins2-board-2/index.html:276 |
| row-gap | `3px` | `3px` | .pb-cgi time · 2026-09-14-pins2-board-2/index.html:276 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `700 var(--t-md)/1 var(--data)` | `` | .pb-cgi time · 2026-09-14-pins2-board-2/index.html:276 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-cgi time · 2026-09-14-pins2-board-2/index.html:276 |
| font-size | `` | `14.5px` | .pb-cgi time · 2026-09-14-pins2-board-2/index.html:276 |
| font-weight | `` | `700` | .pb-cgi time · 2026-09-14-pins2-board-2/index.html:276 |
| font-style | `` | `normal` | .pb-cgi time · 2026-09-14-pins2-board-2/index.html:276 |
| font-variant-numeric | `` | `normal` | .pb-cgi time · 2026-09-14-pins2-board-2/index.html:276 |
| line-height | `` | `14.5px` | .pb-cgi time · 2026-09-14-pins2-board-2/index.html:276 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-cgi time · 2026-09-14-pins2-board-2/index.html:276 |


### `em`

inside `.—` · 2 on screen · **2 looks**

#### look 1 of 2

`G1-287` · rendered **212×12** · 1 instance look like this

```html
<em>⟨svg.ic.⟩Starts showing</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| gap | `5px` | `` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| column-gap | `5px` | `5px` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| row-gap | `5px` | `5px` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| align-items | `center` | `center` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-xs)/1 var(--ui)` | `` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-size | `` | `10.5px` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-weight | `` | `600` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-style | `normal` | `normal` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-variant-numeric | `` | `normal` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| line-height | `` | `10.5px` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| letter-spacing | — | `normal` | initial |
| color | `var(--gc)` | `rgb(123, 219, 99)` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |

#### look 2 of 2

`G1-294` · rendered **212×12** · 1 instance look like this

```html
<em>⟨svg.ic.⟩Stops showing</em>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| gap | `5px` | `` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| column-gap | `5px` | `5px` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| row-gap | `5px` | `5px` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| align-items | `center` | `center` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | `600 var(--t-xs)/1 var(--ui)` | `` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-size | `` | `10.5px` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-weight | `` | `600` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-style | `normal` | `normal` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| font-variant-numeric | `` | `normal` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| line-height | `` | `10.5px` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |
| letter-spacing | — | `normal` | initial |
| color | `var(--gc)` | `rgb(133, 147, 159)` | .pb-cgi em · 2026-09-14-pins2-board-2/index.html:280 |


### `ul.pb-new`

inside `.pb-gate` · 1 on screen · **1 look**

#### the one look

`G1-296` · rendered **1148×36** · 1 instance look like this

```html
<ul class="pb-new"> <li><b>Side column</b> the Discord cards repeated the queue; t…</li> <li><b>Changes ahead</b> the next card to start showing, and the…</li> </ul>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| grid-template-columns | `1fr 1fr` | `554px 554px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| column-gap | `40px` | `40px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0` | `` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| padding-top | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| padding-right | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| padding-bottom | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| padding-left | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| margin | `4px 0 0` | `` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| margin-top | `4px` | `4px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| margin-right | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| margin-bottom | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| margin-left | `0px` | `0px` | .pb-new · 2026-09-14-pins2-board-2/index.html:26 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


## Reachable states

Each state is reached by the interaction named, then the stage is walked again; only signatures or looks not seen above are specced.


### G4 · By slot view

72 distinct signatures on screen; 9 not already specced above.


### `div.pb-man`

inside `.pb-gate` · 1 on screen · **1 look**

#### the one look

`G4s-8` · rendered **1148×1918** · 1 instance look like this

```html
<div class="pb-man" id="g4man" data-fm="edge" data-av="tag"><div class="pb-tools"><div class="pb-t1"><span class="pb-lab">Manifest</span><label class="pb-srch">⟨svg.ic.⟩<input placeholder="Search builds" aria-label="Search builds"></label><button class="chip go pb-add">⟨svg.ic.⟩Add build</button></div><div class="pb-t2"><span class="pb-grp"><span class="pb-lab">Category</span><button class="chip" data-cat="ALL" aria-
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| width | `1148px` | `1148px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| min-width | `1148px` | `1148px` | .pb-gate > .pb-man, .pb-gate > .pb-vb, .pb-gate > .pb-g1, .pb-gate > .pb-g6, .pb-gate > .p · 2026-09-14-pins2-board-2/index.html:464 |
| max-width | `100%` | `100%` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| box-sizing | `border-box` | `border-box` | .pb-gate > .pb-man, .pb-gate > .pb-vb, .pb-gate > .pb-g1, .pb-gate > .pb-g6, .pb-gate > .p · 2026-09-14-pins2-board-2/index.html:464 |
| margin | `0 auto` | `` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| margin-top | `0px` | `0px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| margin-right | `auto` | `0px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| margin-bottom | `0px` | `0px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| margin-left | `auto` | `0px` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| border-radius | `var(--rad-3)` | `` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| background | `var(--paper)` | `` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| background-color | `` | `rgb(23, 30, 36)` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| background-image | `` | `none` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| box-shadow | `inset 0 0 0 1px var(--rule2)` | `rgb(58, 71, 82) 0px 0px 0px 1px inset` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `hidden` | `` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| overflow-x | `hidden` | `hidden` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |
| overflow-y | `hidden` | `hidden` | .pb-man · 2026-09-14-pins2-board-2/index.html:35 |


### `span`

inside `.pb-heads` · 168 on screen · **5 looks**

#### look 1 of 5

`G4s-149` · rendered **44×0** · 6 instances look like this

```html
<span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-left | `0px` | `0px` | .pb-strip span:first-child · 2026-09-14-pins2-board-2/index.html:137 |
| margin-left | `-12px` | `-12px` | .pb-strip span:first-child · 2026-09-14-pins2-board-2/index.html:137 |
| font | ↑ `600 9.5px/1 var(--data)` | `` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-size | ↑ `` | `9.5px` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-weight | ↑ `` | `600` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-style | ↑ `` | `normal` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| line-height | ↑ `` | `9.5px` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| letter-spacing | ↑ `0.14em` | `1.33px` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| text-transform | ↑ `uppercase` | `uppercase` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |

#### look 2 of 5

`G4s-150` · rendered **28×10** · 45 instances look like this · text “#”

```html
<span>#</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-left | `10px` | `10px` | .pb-strip span · 2026-09-14-pins2-board-2/index.html:136 |
| font | ↑ `600 9.5px/1 var(--data)` | `` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-size | ↑ `` | `9.5px` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-weight | ↑ `` | `600` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-style | ↑ `` | `normal` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| line-height | ↑ `` | `9.5px` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| letter-spacing | ↑ `0.14em` | `1.33px` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| text-transform | ↑ `uppercase` | `uppercase` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |

#### look 3 of 5

`G4s-156` · rendered **28×0** · 12 instances look like this

```html
<span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | — | `block` | initial |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding-left | `10px` | `10px` | .pb-strip span · 2026-09-14-pins2-board-2/index.html:136 |
| font | ↑ `600 9.5px/1 var(--data)` | `` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-family | ↑ `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-size | ↑ `` | `9.5px` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-weight | ↑ `` | `600` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-style | ↑ `` | `normal` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| line-height | ↑ `` | `9.5px` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| letter-spacing | ↑ `0.14em` | `1.33px` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| text-transform | ↑ `uppercase` | `uppercase` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| color | ↑ `var(--ink3)` | `rgb(133, 147, 159)` | inherited · .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |

#### look 4 of 5

`G4s-164` · rendered **36×14** · 26 instances look like this · text “Choke”

```html
<span>Choke</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `-webkit-box` | `flow-root` | .pb-sc span · 2026-09-14-pins2-board-2/index.html:139 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 var(--t-sm)/1.2 var(--ui)` | `` | inherited · .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-size | ↑ `` | `12px` | inherited · .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-weight | ↑ `` | `500` | inherited · .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-style | ↑ `` | `normal` | inherited · .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| line-height | ↑ `` | `14.4px` | inherited · .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| overflow | `hidden` | `` | .pb-sc span · 2026-09-14-pins2-board-2/index.html:139 |
| overflow-x | `hidden` | `hidden` | .pb-sc span · 2026-09-14-pins2-board-2/index.html:139 |
| overflow-y | `hidden` | `hidden` | .pb-sc span · 2026-09-14-pins2-board-2/index.html:139 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

#### look 5 of 5

`G4s-215` · rendered **88×29** · 34 instances look like this · text “MIP 200mm Mid-Range Barrel”

```html
<span>MIP 200mm Mid-Range Barrel</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `-webkit-box` | `flow-root` | .pb-sc span · 2026-09-14-pins2-board-2/index.html:139 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font | ↑ `500 var(--t-sm)/1.2 var(--ui)` | `` | inherited · .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-family | ↑ `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-size | ↑ `` | `12px` | inherited · .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-weight | ↑ `` | `500` | inherited · .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-style | ↑ `` | `normal` | inherited · .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-variant-numeric | ↑ `` | `normal` | inherited · .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| line-height | ↑ `` | `14.4px` | inherited · .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| overflow | `hidden` | `` | .pb-sc span · 2026-09-14-pins2-board-2/index.html:139 |
| overflow-x | `hidden` | `hidden` | .pb-sc span · 2026-09-14-pins2-board-2/index.html:139 |
| overflow-y | `hidden` | `hidden` | .pb-sc span · 2026-09-14-pins2-board-2/index.html:139 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |


### `div.pb-scroll`

inside `.pb-man` · 1 on screen · **1 look**

#### the one look

`G4s-49` · rendered **1148×1741** · 1 instance look like this

```html
<div class="pb-scroll"><div class="pb-g" data-w=".50 GS" data-collapsed="false" data-mode="MP" data-att="list" style="--c:var(--sec)"> <div class="pb-gh" data-toggle=""><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select every .50 GS build"><span class="cb"></span></button><div class="pb-gline"><b>.50 GS</b><small>Secondaries<em class="pb-nb">2 builds</em></small><span class="pb-g
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| overflow | `visible` | `` | .pb-scroll · 2026-09-14-pins2-board-2/index.html:59 |
| overflow-x | `visible` | `visible` | .pb-scroll · 2026-09-14-pins2-board-2/index.html:59 |
| overflow-y | `visible` | `visible` | .pb-scroll · 2026-09-14-pins2-board-2/index.html:59 |


### `div.pb-g`

inside `.pb-scroll` · 10 on screen · **4 looks**

#### look 1 of 4

`G4s-129` · rendered **1148×131** · 3 instances look like this

```html
<div class="pb-g" data-w="ARGUS" data-collapsed="false" data-mode="MP" data-att="slots" style="--c:var(--sg);--slotcols:repeat(5,minmax(0,1fr))"> <div class="pb-gh" data-toggle=""><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select every ARGUS build"><span class="cb"></span></button><div class="pb-gline"><b>ARGUS</b><small>Shotgun<em class="pb-nb">1 build</em></small></div><span c
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-bottom | `1px solid var(--rule)` | `` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 2 of 4

`G4s-187` · rendered **1148×229** · 1 instance look like this

```html
<div class="pb-g" data-w="AS VAL" data-collapsed="false" data-mode="MP" data-att="slots" style="--c:var(--ar);--slotcols:repeat(6,minmax(0,1fr))"> <div class="pb-gh" data-toggle=""><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select every AS VAL build"><span class="cb"></span></button><div class="pb-gline"><b>AS VAL</b><small>Assault<em class="pb-nb">2 builds</em></small></div><sp
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-bottom | `1px solid var(--rule)` | `` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 3 of 4

`G4s-272` · rendered **1148×385** · 1 instance look like this

```html
<div class="pb-g" data-w="BAL-27" data-collapsed="false" data-mode="MP" data-att="slots" style="--c:var(--ar);--slotcols:repeat(6,minmax(0,1fr))"> <div class="pb-gh" data-toggle=""><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select every BAL-27 build"><span class="cb"></span></button><div class="pb-gline"><b>BAL-27</b><small>Assault<em class="pb-nb">5 builds</em></small><span cla
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-bottom | `1px solid var(--rule)` | `` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |

#### look 4 of 4

`G4s-499` · rendered **1148×183** · 1 instance look like this

```html
<div class="pb-g" data-w="CROSSBOW" data-collapsed="false" data-mode="MP" data-att="slots" style="--c:var(--sec);--slotcols:repeat(6,minmax(0,1fr))"> <div class="pb-gh" data-toggle=""><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select every CROSSBOW build"><span class="cb"></span></button><div class="pb-gline"><b>CROSSBOW</b><small>Secondaries<em class="pb-nb">2 builds</em></smal
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `block` | `block` | div · user-agent:? |
| position | `relative` | `relative` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| border-bottom | `1px solid var(--rule)` | `` | .pb-g · 2026-09-14-pins2-board-2/index.html:84 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |


### `div.pb-rb`

inside `.pb-g` · 11 on screen · **1 look**

#### the one look

`G4s-239` · rendered **1148×98** · 2 instances look like this

```html
<div class="pb-rb" data-row="6a4c692095a4f5a6c3375496"><button class="pb-cb" data-cb="" role="checkbox" aria-checked="false" aria-label="Select AS VAL build 2"><span class="cb"></span></button><span class="pb-ix" data-why="Almost the same as another build">2</span><span class="pb-sc" title="Barrel" style="--sl:var(--sl-barrel)"><span>MIP Quick Response Barrel</span></span><span class="pb-sc" title="Stock" style="--sl
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| position | `relative` | `relative` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| grid-template-columns | `var(--rowcols)` | `32px 28px 107.828px 107.828px 107.844px 107.828px 107.828px 107.844px 28px 144px 113px` | .pb-g[data-att="slots"] .pb-rb, .pb-strip · 2026-09-14-pins2-board-2/index.html:116 |
| column-gap | `12px` | `12px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:304 |
| align-items | `center` | `center` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| min-height | `52px` | `52px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:304 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px 0 20px` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-top | `0px` | `0px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-right | `16px` | `16px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-bottom | `0px` | `0px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| padding-left | `20px` | `20px` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| border-top | `1px solid var(--rule3)` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| transition | `background .18s` | `` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |
| cursor | `pointer` | `pointer` | .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

**::before**

| property | winning declaration | from |
|---|---|---|
| position | `absolute` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| width | `3px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| top | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| bottom | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| left | `0px` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background | `var(--c)` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background-color | `` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| background-image | `` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| opacity | `0` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| transition | `opacity .18s` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |
| content | `""` | .pb-rb::before · 2026-09-14-pins2-board-2/index.html:87 |


### `div.pb-strip`

inside `.pb-g` · 6 on screen · **1 look**

#### the one look

`G4s-148` · rendered **1148×26** · 6 instances look like this

```html
<div class="pb-strip"><span></span><span>#</span><span>Muzzle</span><span>Barrel</span><span>Stock</span><span>Underbarrel</span><span>Ammunition</span><span></span><span>Gunsmith code</span><span></span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `grid` | `grid` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| grid-template-columns | `var(--rowcols)` | `32px 28px 135.391px 135.406px 135.391px 135.406px 135.391px 28px 144px 113px` | .pb-g[data-att="slots"] .pb-rb, .pb-strip · 2026-09-14-pins2-board-2/index.html:116 |
| column-gap | `10px` | `10px` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| align-items | `center` | `center` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| min-height | `26px` | `26px` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 16px 0 20px` | `` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| padding-top | `0px` | `0px` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| padding-right | `16px` | `16px` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| padding-bottom | `0px` | `0px` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| padding-left | `20px` | `20px` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| border-top | `1px solid var(--rule3)` | `` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| background | `var(--sunk)` | `` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| background-color | `` | `rgb(11, 15, 18)` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| background-image | `` | `none` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font | `600 9.5px/1 var(--data)` | `` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-family | `` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-size | `` | `9.5px` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-weight | `` | `600` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-style | `` | `normal` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| font-variant-numeric | `` | `normal` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| line-height | `` | `9.5px` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| letter-spacing | `0.14em` | `1.33px` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| text-transform | `uppercase` | `uppercase` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-strip · 2026-09-14-pins2-board-2/index.html:135 |


### `span.pb-sc`

inside `.pb-rb` · 60 on screen · **15 looks**

#### look 1 of 15

`G4s-163` · rendered **132×32** · 7 instances look like this · title="Muzzle"

```html
<span class="pb-sc" title="Muzzle" style="--sl:var(--sl-muzzle)"><span>Choke</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| align-items | `center` | `center` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| align-self | `center` | `center` | .pb-rb > * · 2026-09-14-pins2-board-2/index.html:471 |
| min-width | `0px` | `0px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| min-height | `32px` | `32px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `4px 10px` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-top | `4px` | `4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-right | `10px` | `10px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-bottom | `4px` | `4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-left | `10px` | `10px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| border-radius | `var(--rad-2)` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| background | `color-mix(in srgb,var(--sl,var(--ink4)) 8%,var(--sunk))` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| background-color | `` | `color(srgb 0.10558 0.105618 0.115008)` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| background-image | `` | `none` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| box-shadow | `inset 0 0 0 1px var(--rule),inset 0 -2px 0 color-mix(in srgb,var(--sl,var(--ink4)) 45%,transparent)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset, color(srgb 0.823677 0.643756 0.625832 / 0.45) 0px -2px 0px 0px inset` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| font | `500 var(--t-sm)/1.2 var(--ui)` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-size | `` | `12px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-weight | `` | `500` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-style | `` | `normal` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-variant-numeric | `` | `normal` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| line-height | `` | `14.4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

#### look 2 of 15

`G4s-165` · rendered **132×32** · 5 instances look like this · title="Barrel"

```html
<span class="pb-sc" title="Barrel" style="--sl:var(--sl-barrel)"><span>BO Barrel</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| align-items | `center` | `center` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| align-self | `center` | `center` | .pb-rb > * · 2026-09-14-pins2-board-2/index.html:471 |
| min-width | `0px` | `0px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| min-height | `32px` | `32px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `4px 10px` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-top | `4px` | `4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-right | `10px` | `10px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-bottom | `4px` | `4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-left | `10px` | `10px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| border-radius | `var(--rad-2)` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| background | `color-mix(in srgb,var(--sl,var(--ink4)) 8%,var(--sunk))` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| background-color | `` | `color(srgb 0.103095 0.10761 0.10913)` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| background-image | `` | `none` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| box-shadow | `inset 0 0 0 1px var(--rule),inset 0 -2px 0 color-mix(in srgb,var(--sl,var(--ink4)) 45%,transparent)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset, color(srgb 0.792607 0.668653 0.552362 / 0.45) 0px -2px 0px 0px inset` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| font | `500 var(--t-sm)/1.2 var(--ui)` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-size | `` | `12px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-weight | `` | `500` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-style | `` | `normal` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-variant-numeric | `` | `normal` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| line-height | `` | `14.4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

#### look 3 of 15

`G4s-167` · rendered **132×32** · 4 instances look like this · title="Stock"

```html
<span class="pb-sc" title="Stock" style="--sl:var(--sl-stock)"><span>Steady Stock</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| align-items | `center` | `center` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| align-self | `center` | `center` | .pb-rb > * · 2026-09-14-pins2-board-2/index.html:471 |
| min-width | `0px` | `0px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| min-height | `32px` | `32px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `4px 10px` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-top | `4px` | `4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-right | `10px` | `10px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-bottom | `4px` | `4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-left | `10px` | `10px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| border-radius | `var(--rad-2)` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| background | `color-mix(in srgb,var(--sl,var(--ink4)) 8%,var(--sunk))` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| background-color | `` | `color(srgb 0.0967118 0.110455 0.108625)` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| background-image | `` | `none` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| box-shadow | `inset 0 0 0 1px var(--rule),inset 0 -2px 0 color-mix(in srgb,var(--sl,var(--ink4)) 45%,transparent)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset, color(srgb 0.712819 0.704212 0.546045 / 0.45) 0px -2px 0px 0px inset` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| font | `500 var(--t-sm)/1.2 var(--ui)` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-size | `` | `12px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-weight | `` | `500` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-style | `` | `normal` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-variant-numeric | `` | `normal` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| line-height | `` | `14.4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

#### look 4 of 15

`G4s-169` · rendered **132×32** · 3 instances look like this · title="Underbarrel"

```html
<span class="pb-sc" title="Underbarrel" style="--sl:var(--sl-underbarrel)"><span>Classical Lever</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| align-items | `center` | `center` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| align-self | `center` | `center` | .pb-rb > * · 2026-09-14-pins2-board-2/index.html:471 |
| min-width | `0px` | `0px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| min-height | `32px` | `32px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `4px 10px` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-top | `4px` | `4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-right | `10px` | `10px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-bottom | `4px` | `4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-left | `10px` | `10px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| border-radius | `var(--rad-2)` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| background | `color-mix(in srgb,var(--sl,var(--ink4)) 8%,var(--sunk))` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| background-color | `` | `color(srgb 0.0876573 0.112925 0.114803)` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| background-image | `` | `none` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| box-shadow | `inset 0 0 0 1px var(--rule),inset 0 -2px 0 color-mix(in srgb,var(--sl,var(--ink4)) 45%,transparent)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset, color(srgb 0.599638 0.73509 0.623276 / 0.45) 0px -2px 0px 0px inset` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| font | `500 var(--t-sm)/1.2 var(--ui)` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-size | `` | `12px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-weight | `` | `500` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-style | `` | `normal` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-variant-numeric | `` | `normal` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| line-height | `` | `14.4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

#### look 5 of 15

`G4s-171` · rendered **132×32** · 2 instances look like this · title="Ammunition"

```html
<span class="pb-sc" title="Ammunition" style="--sl:var(--sl-ammunition)"><span>Outlaw Mag</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| align-items | `center` | `center` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| align-self | `center` | `center` | .pb-rb > * · 2026-09-14-pins2-board-2/index.html:471 |
| min-width | `0px` | `0px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| min-height | `32px` | `32px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `4px 10px` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-top | `4px` | `4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-right | `10px` | `10px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-bottom | `4px` | `4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-left | `10px` | `10px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| border-radius | `var(--rad-2)` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| background | `color-mix(in srgb,var(--sl,var(--ink4)) 8%,var(--sunk))` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| background-color | `` | `color(srgb 0.103016 0.105558 0.12397)` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| background-image | `` | `none` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| box-shadow | `inset 0 0 0 1px var(--rule),inset 0 -2px 0 color-mix(in srgb,var(--sl,var(--ink4)) 45%,transparent)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset, color(srgb 0.79162 0.643006 0.737861 / 0.45) 0px -2px 0px 0px inset` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| font | `500 var(--t-sm)/1.2 var(--ui)` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-size | `` | `12px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-weight | `` | `500` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-style | `` | `normal` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-variant-numeric | `` | `normal` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| line-height | `` | `14.4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

#### look 6 of 15

`G4s-214` · rendered **108×37** · 7 instances look like this · title="Barrel"

```html
<span class="pb-sc" title="Barrel" style="--sl:var(--sl-barrel)"><span>MIP 200mm Mid-Range Barrel</span></span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| align-items | `center` | `center` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| align-self | `center` | `center` | .pb-rb > * · 2026-09-14-pins2-board-2/index.html:471 |
| min-width | `0px` | `0px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| min-height | `32px` | `32px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `4px 10px` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-top | `4px` | `4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-right | `10px` | `10px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-bottom | `4px` | `4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-left | `10px` | `10px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| border-radius | `var(--rad-2)` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| background | `color-mix(in srgb,var(--sl,var(--ink4)) 8%,var(--sunk))` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| background-color | `` | `color(srgb 0.103095 0.10761 0.10913)` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| background-image | `` | `none` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| box-shadow | `inset 0 0 0 1px var(--rule),inset 0 -2px 0 color-mix(in srgb,var(--sl,var(--ink4)) 45%,transparent)` | `rgb(42, 52, 61) 0px 0px 0px 1px inset, color(srgb 0.792607 0.668653 0.552362 / 0.45) 0px -2px 0px 0px inset` | .pb-sc · 2026-09-14-pins2-board-2/index.html:323 |
| font | `500 var(--t-sm)/1.2 var(--ui)` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-size | `` | `12px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-weight | `` | `500` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-style | `` | `normal` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-variant-numeric | `` | `normal` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| line-height | `` | `14.4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink)` | `rgb(232, 237, 241)` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |

*9 further looks are the same component in other data hues (a per-row `--c` / `--m` / `--sl`); they differ in colour only.*


### `span.pb-empty.pb-sc`

inside `.pb-rb` · 9 on screen · **1 look**

#### the one look

`G4s-224` · rendered **108×32** · 9 instances look like this · text “—”

```html
<span class="pb-sc pb-empty">—</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| align-items | `center` | `center` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| align-self | `center` | `center` | .pb-rb > * · 2026-09-14-pins2-board-2/index.html:471 |
| justify-content | `center` | `center` | .pb-sc.pb-empty · 2026-09-14-pins2-board-2/index.html:140 |
| min-width | `0px` | `0px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| min-height | `32px` | `32px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `4px 10px` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-top | `4px` | `4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-right | `10px` | `10px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-bottom | `4px` | `4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| padding-left | `10px` | `10px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| border-radius | `var(--rad-2)` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| background | `none` | `` | .pb-sc.pb-empty · 2026-09-14-pins2-board-2/index.html:140 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-sc.pb-empty · 2026-09-14-pins2-board-2/index.html:140 |
| background-image | `none` | `none` | .pb-sc.pb-empty · 2026-09-14-pins2-board-2/index.html:140 |
| box-shadow | `inset 0 0 0 1px var(--rule3)` | `rgb(28, 36, 42) 0px 0px 0px 1px inset` | .pb-sc.pb-empty · 2026-09-14-pins2-board-2/index.html:140 |
| font | `500 var(--t-sm)/1.2 var(--ui)` | `` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-size | `` | `12px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-weight | `` | `500` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-style | `` | `normal` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| font-variant-numeric | `` | `normal` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| line-height | `` | `14.4px` | .pb-sc · 2026-09-14-pins2-board-2/index.html:138 |
| letter-spacing | — | `normal` | initial |
| color | `var(--ink3)` | `rgb(133, 147, 159)` | .pb-sc.pb-empty · 2026-09-14-pins2-board-2/index.html:140 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |


### `div.pb-sline`

inside `.pb-rb` · 2 on screen · **1 look**

#### the one look

`G4s-268` · rendered **1028×53** · 2 instances look like this

```html
<div class="pb-sline"><span class="pb-plate"><small>Build name</small><span title="Up to 32 characters">Close quarters</span></span></div>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `flex` | `flex` | .pb-sline · 2026-09-14-pins2-board-2/index.html:317 |
| grid-column | `3/-1` | `` | .pb-sline · 2026-09-14-pins2-board-2/index.html:317 |
| gap | `6px 16px` | `` | .pb-sline · 2026-09-14-pins2-board-2/index.html:317 |
| column-gap | `16px` | `16px` | .pb-sline · 2026-09-14-pins2-board-2/index.html:317 |
| row-gap | `6px` | `6px` | .pb-sline · 2026-09-14-pins2-board-2/index.html:317 |
| flex-wrap | `wrap` | `wrap` | .pb-sline · 2026-09-14-pins2-board-2/index.html:317 |
| align-items | `center` | `center` | .pb-sline · 2026-09-14-pins2-board-2/index.html:317 |
| align-self | `center` | `center` | .pb-rb > * · 2026-09-14-pins2-board-2/index.html:471 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 0 10px` | `` | .pb-sline · 2026-09-14-pins2-board-2/index.html:317 |
| padding-top | `0px` | `0px` | .pb-sline · 2026-09-14-pins2-board-2/index.html:317 |
| padding-right | `0px` | `0px` | .pb-sline · 2026-09-14-pins2-board-2/index.html:317 |
| padding-bottom | `10px` | `10px` | .pb-sline · 2026-09-14-pins2-board-2/index.html:317 |
| padding-left | `0px` | `0px` | .pb-sline · 2026-09-14-pins2-board-2/index.html:317 |
| font-family | ↑ `var(--ui)` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| font-size | ↑ `var(--t-base)` | `13px` | inherited · body · 2026-09-14-pins2-board-2/index.html:3 |
| font-weight | — | `400` | initial |
| line-height | ↑ `1.5` | `19.5px` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| letter-spacing | — | `normal` | initial |
| color | ↑ `var(--ink)` | `rgb(232, 237, 241)` | inherited · body · 2026-09-14-pins2-board/app.css:593 |
| cursor | ↑ `pointer` | `pointer` | inherited · .pb-rb · 2026-09-14-pins2-board-2/index.html:112 |


### G11 · a staged state

40 distinct signatures on screen; 1 not already specced above.


### `span.pb-life.pb-staged`

inside `.pb-br` · 1 on screen · **1 look**

#### the one look

`G11s-87` · rendered **103×28** · 1 instance look like this

```html
<span class="pb-life pb-staged" data-l="upcoming">⟨svg.ic.⟩Upcoming</span>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| gap | `7px` | `` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| column-gap | `7px` | `7px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| row-gap | `7px` | `7px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| align-items | `center` | `center` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| justify-self | `start` | `start` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| height | `28px` | `28px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| box-sizing | `border-box` | `border-box` | * · 2026-09-14-pins2-board/app.css:591 |
| padding | `0 11px 0 12px` | `` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| padding-top | `0px` | `0px` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| padding-right | `11px` | `11px` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| padding-bottom | `0px` | `0px` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| padding-left | `12px` | `12px` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| border-radius | `4px` | `` | .pb-man[data-ss="tab"] .pb-life · 2026-09-14-pins2-board-2/index.html:351 |
| outline | `1.5px dashed var(--lc)` | `` | .pb-man[data-ss="tab"] .pb-life.pb-staged · 2026-09-14-pins2-board-2/index.html:352 |
| outline-offset | ⚠️ `-1.5px` | `-1px` | .pb-man[data-ss="tab"] .pb-life.pb-staged · 2026-09-14-pins2-board-2/index.html:352 · **a later rule wins — port the computed value and find that rule** |
| background | `none` | `` | .pb-man[data-ss="tab"] .pb-life.pb-staged · 2026-09-14-pins2-board-2/index.html:352 |
| background-color | `initial` | `rgba(0, 0, 0, 0)` | .pb-man[data-ss="tab"] .pb-life.pb-staged · 2026-09-14-pins2-board-2/index.html:352 |
| background-image | `none` | `none` | .pb-man[data-ss="tab"] .pb-life.pb-staged · 2026-09-14-pins2-board-2/index.html:352 |
| box-shadow | `inset 3px 0 0 color-mix(in srgb,var(--lc) 55%,transparent)` | `color(srgb 0.65098 0.501961 0.984314 / 0.55) 3px 0px 0px 0px inset` | .pb-man[data-ss="tab"] .pb-life.pb-staged · 2026-09-14-pins2-board-2/index.html:352 |
| font | `600 var(--t-sm)/1 var(--ui)` | `` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-family | `` | `"Space Grotesk", -apple-system, "system-ui", "Segoe UI", system-ui, sans-serif` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-size | `` | `12px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-weight | `` | `600` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-style | `` | `normal` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| font-variant-numeric | `` | `normal` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| line-height | `` | `12px` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| letter-spacing | — | `normal` | initial |
| white-space | `nowrap` | `` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |
| color | `var(--lc)` | `rgb(166, 128, 251)` | .pb-life · 2026-09-14-pins2-board-2/index.html:193 |


### G2 · Admin traffic, toggled

11 distinct signatures on screen; 2 not already specced above.


### `button.chip.pb-adm`

inside `.pb-inc` · 1 on screen · **1 look**

#### the one look

`G2a-11` · rendered **132×44** · 1 instance look like this · aria-pressed="true"

```html
<button class="chip pb-adm" aria-pressed="true">⟨svg.ic.⟩Admin traffic</button>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-flex` | `flex` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| gap | `8px` | `` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| column-gap | `8px` | `8px` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| row-gap | `8px` | `8px` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| align-items | `center` | `center` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| justify-content | `center` | `center` | .chip · 2026-09-14-pins2-board/app.css:938 |
| min-height | `var(--tap)` | `44px` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| box-sizing | `border-box` | `border-box` | input, select, textarea, button · 2026-09-14-pins2-board/app.css:378 |
| padding | `0 16px` | `` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| padding-top | `0px` | `0px` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| padding-right | `16px` | `16px` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| padding-bottom | `0px` | `0px` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| padding-left | `16px` | `16px` | .chip.pb-adm · 2026-09-14-pins2-board-2/index.html:244 |
| border | `1px solid var(--rule2)` | `` | .chip · 2026-09-14-pins2-board/app.css:938 |
| border-color | `color-mix(in srgb,var(--r-analytics) 55%,transparent)` | `` | .chip.pb-adm[aria-pressed="true"] · 2026-09-14-pins2-board-2/index.html:246 |
| border-radius | `var(--rad-pill)` | `` | .chip, .seg button, .tbdsw button · 2026-09-14-pins2-board/app.css:4478 |
| background | `color-mix(in srgb,var(--r-analytics) 14%,transparent)` | `` | .chip.pb-adm[aria-pressed="true"] · 2026-09-14-pins2-board-2/index.html:246 |
| background-color | `` | `color(srgb 0.611765 0.784314 0.352941 / 0.14)` | .chip.pb-adm[aria-pressed="true"] · 2026-09-14-pins2-board-2/index.html:246 |
| background-image | `` | `none` | .chip.pb-adm[aria-pressed="true"] · 2026-09-14-pins2-board-2/index.html:246 |
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
| color | `var(--ink)` | `rgb(232, 237, 241)` | .chip.pb-adm[aria-pressed="true"] · 2026-09-14-pins2-board-2/index.html:246 |
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


### `svg.ic`

inside `.chip` · 1 on screen · **1 look**

#### the one look

`G2a-12` · rendered **15×15** · 1 instance look like this · aria-hidden="true"

```html
<svg class="ic " aria-hidden="true"><use href="#i-shield"></use></svg>
```

| property | winning declaration | computed | from |
|---|---|---|---|
| display | `inline-block` | `block` | .ic · 2026-09-14-pins2-board/app.css:6165 |
| flex | `none` | `` | .ic · 2026-09-14-pins2-board-2/index.html:4 |
| width | `15px` | `15px` | .chip.pb-adm .ic · 2026-09-14-pins2-board-2/index.html:245 |
| height | `15px` | `15px` | .chip.pb-adm .ic · 2026-09-14-pins2-board-2/index.html:245 |
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
| color | `var(--r-analytics)` | `rgb(156, 200, 90)` | .chip.pb-adm[aria-pressed="true"] .ic · 2026-09-14-pins2-board-2/index.html:247 |
| overflow-x | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| overflow-y | `hidden` | `hidden` | svg:not(:root), symbol, image, marker, pattern, foreignObject · user-agent:? |
| cursor | ↑ `pointer` | `pointer` | inherited · button · 2026-09-14-pins2-board/app.css:600 |
| pointer-events | `none` | `none` | button .ic, a .ic · 2026-09-14-pins2-board/app.css:6172 |
