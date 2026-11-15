---
kind: reference
status: live
---

# Board 4: Final — the custom properties the portal does not have

*Generated 2026-11-15T07:35:23.634Z by `maps.cjs` from `local/pins2/s4/board4-final/` at repo commit `a82c4e6 (Board 4: Final's own local repo, on this Mac only) plus its working tree`. 213 of the 299 custom properties this folder's spec reads are defined nowhere in the portal (`portal/ui/tokens.css`, `app.css`, `v2card.css`). A declaration that reads one ports as `var()` of nothing — silently. **The Portal column is what Session 5 does with each (plan §5c Step 4d, decided by rule in maps.cjs):** a token its own component rule declares ports with that rule; a top-level one takes the portal token of the same value or becomes a new portal token; one a script sets ports with the script; one defined nowhere is a dead read.*

| Token | Defined in the kit | The definition | Portal |
|---|---|---|---|
| `--RL` | `b4/classes.css:880` | `.b4 .acx .acx-s.acx-full{--W:var(--sww,100%);--UW:var(--sww,100%);--RL:0px;--RWb:var(--sww,100%);--ox:0px;--oy:0px;--or:var(--swr);--ir:var(` | local: ports with its rule (`.b4 .acx .acx-s.acx-full`) |
| `--RWb` | `b4/classes.css:880` | `.b4 .acx .acx-s.acx-full{--W:var(--sww,100%);--UW:var(--sww,100%);--RL:0px;--RWb:var(--sww,100%);--ox:0px;--oy:0px;--or:var(--swr);--ir:var(` | local: ports with its rule (`.b4 .acx .acx-s.acx-full`) |
| `--UW` | `b4/classes.css:880` | `.b4 .acx .acx-s.acx-full{--W:var(--sww,100%);--UW:var(--sww,100%);--RL:0px;--RWb:var(--sww,100%);--ox:0px;--oy:0px;--or:var(--swr);--ir:var(` | local: ports with its rule (`.b4 .acx .acx-s.acx-full`) |
| `--atts-l` | `b3/board.css:975` | `--atts-l:0px;--atts-r:34px;` | local: ports with its rule (`.b3-sd-atts`) |
| `--atts-r` | `b3/board.css:975` | `--atts-l:0px;--atts-r:34px;` | local: ports with its rule (`.b3-sd-atts`) |
| `--b3-amb` | `b3/board.css:1876` | `.b3-bdg[data-k=meta]{--lit:.06;--b3-amb:1.6;--b3-glow:1.7;overflow:hidden}` | local: ports with its rule (`.b3-bdg[data-k=meta]`) |
| `--b3-ang` | `b3/board.css:1972` | `@keyframes b3rim{to{--b3-ang:360deg}}` | local: ports with its rule (`to`) |
| `--b3-check` | `b3/board.css:694` | `:root{--b3-check:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpolyline points='2.4 6.3 5 8.9 9` | new portal token: `--b3-check` in `portal/ui/tokens.css` |
| `--b3-d1` | `b3/board.css:18` | `--b3-d1:.15s; --b3-d2:.22s; --b3-d3:.3s;` | new portal token: `--b3-d1` in `portal/ui/tokens.css` |
| `--b3-d2` | `b3/board.css:18` | `--b3-d1:.15s; --b3-d2:.22s; --b3-d3:.3s;` | new portal token: `--b3-d2` in `portal/ui/tokens.css` |
| `--b3-d3` | `b3/board.css:18` | `--b3-d1:.15s; --b3-d2:.22s; --b3-d3:.3s;` | new portal token: `--b3-d3` in `portal/ui/tokens.css` |
| `--b3-edge` | `b3/board.css:4051` | `.b3-tk{--b3-edge:var(--rule2);box-shadow:none}` | local: ports with its rule (`.b3-tk`) |
| `--b3-fill` | `b4/classes.css:240` | `.b4 .b3-btn2.go.dang{--b3-fill:var(--del);color:var(--on-ok);background:var(--b3-fill);box-shadow:none}` | local: ports with its rule (`.b4 .b3-btn2.go.dang`) |
| `--b3-foldw` | `b3/board.css:2201` | `.b3-wh,.b3-wr-main{--b3-foldw:98px}` | local: ports with its rule (`.b3-wh`) |
| `--b3-hatch` | `b3/board.css:57` | `:root{--b3-hatch:repeating-linear-gradient(-45deg,var(--warn) 0 2.5px,transparent 2.5px 5px);--b3-lift:0 24px 48px -16px var(--scrim-80)}` | new portal token: `--b3-hatch` in `portal/ui/tokens.css` |
| `--b3-ring` | `b3/board.css:12` | `--b3-ring:inset 0 0 0 1px var(--rule2);` | new portal token: `--b3-ring` in `portal/ui/tokens.css` |
| `--b3-tr` | `b3/board.css:16` | `--b3-tr-wide:.14em; --b3-tr:.11em; --b3-tr-tight:.06em;` | new portal token: `--b3-tr` in `portal/ui/tokens.css` |
| `--b3-tr-tight` | `b3/board.css:16` | `--b3-tr-wide:.14em; --b3-tr:.11em; --b3-tr-tight:.06em;` | new portal token: `--b3-tr-tight` in `portal/ui/tokens.css` |
| `--b3-tr-wide` | `b3/board.css:16` | `--b3-tr-wide:.14em; --b3-tr:.11em; --b3-tr-tight:.06em;` | new portal token: `--b3-tr-wide` in `portal/ui/tokens.css` |
| `--b3-under` | `b3/board.css:4120` | `.b3-btn2.stage{--b3-fill:var(--staged);--b3-under:var(--sunk);` | local: ports with its rule (`.b3-btn2.stage`) |
| `--bdc-w` | `b4/library.css:646` | `.b4 .wg-r, .b4 .b3-sd { --bdc-w: 80px; }` | ports with its rule |
| `--bgap` | `b4/classes.css:831` | `.b4 .acx{--pad:14px;--pw:200px;--svh:138px;--cg:16px;--rg:16px;--bgap:16px;--hueh:12px;--huet:14px;--huer:44px;--fh:44px;--frad:9px;--lg:10p` | local: ports with its rule (`.b4 .acx`) |
| `--c-k` | `b4/kit.css:5` | `.b4 .wg-r .wg-imx.b3-okx .b3-fchip:not(#_):not(#_) { --c-k: var(--ok); --lk-w: 1px; --lk-bg: color-mix(in srgb, var(--c-k) 14%, transparent)` | ports with its rule |
| `--cc-edge` | `b3/board.css:3641` | `.g-fact.b3-cc{--cc-edge:var(--rule2);border:0;padding-left:10px;padding-right:10px;box-shadow:inset 0 0 0 1px var(--cc-edge);transition:colo` | local: ports with its rule (`.g-fact.b3-cc`) |
| `--cg` | `b4/classes.css:831` | `.b4 .acx{--pad:14px;--pw:200px;--svh:138px;--cg:16px;--rg:16px;--bgap:16px;--hueh:12px;--huet:14px;--huer:44px;--fh:44px;--frad:9px;--lg:10p` | local: ports with its rule (`.b4 .acx`) |
| `--clear` | `b4/classes.css:81` | `.b4 .b4-ghostwrap{position:relative;--band:38px;--clear:linear-gradient(180deg,#000 calc(50% - var(--band) - 24px),transparent calc(50% - va` | local: ports with its rule (`.b4 .b4-ghostwrap`) |
| `--code-js` | `gates/armory.js:1229` (set by script) | `const code = (typeof document !== 'undefined' && getComputedStyle(document.documentElement).getPropertyValue('--code-js').trim()) === 'start` | set by its script: ports with that file |
| `--cols` | `b4/classes.css:831` | `.b4 .acx{--pad:14px;--pw:200px;--svh:138px;--cg:16px;--rg:16px;--bgap:16px;--hueh:12px;--huet:14px;--huer:44px;--fh:44px;--frad:9px;--lg:10p` | local: ports with its rule (`.b4 .acx`) |
| `--cur` | `b3/broadcast.js:357` | `<div class="acx" ref=${root} style=${`--cur:${cur};--on-cur:${onInk(cur)}`}>` | ports with its rule |
| `--d` | `b4/classes.css:384` | `.b3-ass > i:nth-child(1){left:1px;--d:0s}` | local: ports with its rule (`.b3-ass > i:nth-child(1)`) |
| `--d3` | `b4/classes.css:831` | `.b4 .acx{--pad:14px;--pw:200px;--svh:138px;--cg:16px;--rg:16px;--bgap:16px;--hueh:12px;--huet:14px;--huer:44px;--fh:44px;--frad:9px;--lg:10p` | local: ports with its rule (`.b4 .acx`) |
| `--dc` | `b4/classes.css:831` | `.b4 .acx{--pad:14px;--pw:200px;--svh:138px;--cg:16px;--rg:16px;--bgap:16px;--hueh:12px;--huet:14px;--huer:44px;--fh:44px;--frad:9px;--lg:10p` | local: ports with its rule (`.b4 .acx`) |
| `--dlen` | `b3/board.css:293` | `.b3-x:hover .ic,.b3-x:focus-visible .ic,.dw-h .x:hover .ic,.b3-pc-x:hover .ic{animation:b3draw .3s cubic-bezier(.16,1,.3,1) both;--dlen:34}` | local: ports with its rule (`.b3-x:hover .ic`) |
| `--dp-c` | `b3/board.css:1437` (set by script) | `every accent below reads --dp-c, which defaults to the realm's --realm-c — a date field in Season or Access re-colours with no rule of its o` | set by its script: ports with that file |
| `--eio` | `b4/classes.css:831` | `.b4 .acx{--pad:14px;--pw:200px;--svh:138px;--cg:16px;--rg:16px;--bgap:16px;--hueh:12px;--huet:14px;--huer:44px;--fh:44px;--frad:9px;--lg:10p` | local: ports with its rule (`.b4 .acx`) |
| `--f-bg` | `b4/form.css:43` | `.b4 .f-fld{--f-bg:color-mix(in srgb,#04070A 52%,var(--sunk));--f-edge:color-mix(in srgb,var(--ink) 12%,transparent);` | local: ports with its rule (`.b4 .f-fld`) |
| `--f-ch` | `b4/form.js:631` | `<section class=${'f-card' + (multi && i === ci ? ' on' : '')} key=${c.id} data-arm=${c.f.mode} style=${`--f-ch:${hueOfCard(c)}`} onFocusIn=$` | ports with its rule |
| `--f-edge` | `b4/classes.css:128` | `.b4 .f-fld:focus-within, .b4 .f-pick.open .f-fld{--f-edge:var(--staged)!important;box-shadow:inset 0 0 0 1px var(--staged),0 0 0 5px color-m` | local: ports with its rule (`.b4 .f-fld:focus-within`) |
| `--f-hue` | `b4/form.js:433` | `<div class="f-card-b" style=${`--f-hue:${hue}`}>` | ports with its rule |
| `--f-lw` | `b4/classes.css:403` | `.b4 .f-card-b{--f-lw:96px;container:f-card / inline-size}` | local: ports with its rule (`.b4 .f-card-b`) |
| `--f-sidew` | `b4.css:131` | `.b4 .drawer.wide:has(.b3-nb) { width:min(980px, 100vw - 40px); --f-sidew:333px }` | local: ports with its rule (`.b4 .drawer.wide:has(.b3-nb)`) |
| `--fb` | `b3/board.css:2347` | `@keyframes b3fadeB{0%,92%{--fb:var(--fdy,15px)}100%{--fb:0px}}` | local: ports with its rule (`0%`) |
| `--fh` | `b4/classes.css:831` | `.b4 .acx{--pad:14px;--pw:200px;--svh:138px;--cg:16px;--rg:16px;--bgap:16px;--hueh:12px;--huet:14px;--huer:44px;--fh:44px;--frad:9px;--lg:10p` | local: ports with its rule (`.b4 .acx`) |
| `--fl` | `b3/fady.js:22` (set by script) | `// `.b3-sd-atts` scrolls SIDEWAYS — its fade is --fl/--fr. Added 2026-09-17 23:19 EDT with the manifest's tag rail (1d832319).` | set by its script: ports with that file |
| `--fld-rad` | `b4/library.css:387` | `.b4 { --fld-rad: 11px; }` | ports with its rule |
| `--fo` | `b3/board.css:2818` (set by script) | `last third), and it starts BELOW a sticky head — `b3/fady.js` sets `--fo` to the head's height — so in the one` | set by its script: ports with that file |
| `--fr` | `b3/fady.js:22` (set by script) | `// `.b3-sd-atts` scrolls SIDEWAYS — its fade is --fl/--fr. Added 2026-09-17 23:19 EDT with the manifest's tag rail (1d832319).` | set by its script: ports with that file |
| `--frad` | `b4/classes.css:831` | `.b4 .acx{--pad:14px;--pw:200px;--svh:138px;--cg:16px;--rg:16px;--bgap:16px;--hueh:12px;--huet:14px;--huer:44px;--fh:44px;--frad:9px;--lg:10p` | local: ports with its rule (`.b4 .acx`) |
| `--ft` | `b3/board.css:2346` | `@keyframes b3fadeT{0%{--ft:0px}8%,100%{--ft:var(--fdy,15px)}}` | local: ports with its rule (`0%`) |
| `--fx-l` | `b3/board.css:4420` | `.b3-xt-chips[data-sx=start]{--fx-l:0px;--fx-r:28px}` | local: ports with its rule (`.b3-xt-chips[data-sx=start]`) |
| `--fx-r` | `b3/board.css:4420` | `.b3-xt-chips[data-sx=start]{--fx-l:0px;--fx-r:28px}` | local: ports with its rule (`.b3-xt-chips[data-sx=start]`) |
| `--gc` | `b2.css:288` | `.pb-cgi[data-g=in]{--gc:var(--ok)}.pb-cgi[data-g=out]{--gc:var(--ink3)}` | local: ports with its rule (`.pb-cgi[data-g=in]`) |
| `--gh-cat-range` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--gh-name-cat` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--gh-pl` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--glo` | `b4.css:84` | `.b4 :is(.wg-r, .b3-hi-r, .app[data-realm="broadcast"] .mtable tbody tr) { --glo:oklch(from var(--c) max(l,.72) c h) }` | local: ports with its rule (`.b4 :is(.wg-r`) |
| `--h1-cell` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--h1-kind` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--h1-l` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--h1-r` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--h1-rowp` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--h1-undo` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--h1-who` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--hc` | `b3/broadcast.js:367` | `<span class="acx-hint" aria-hidden="true"><span class=${'acx-hc' + (recHc ? ' acx-on' : '')} style=${recHc ? `--hc:${recHc}` : null}><${Icon` | ports with its rule |
| `--hi-head` | `b3/board.css:5019` | `.panel.b3-hi{display:flex;flex-direction:column;overflow:hidden;--hi-head:32px}` | local: ports with its rule (`.panel.b3-hi`) |
| `--hi-l` | `b3/board.css:4857` | `.b3-hi{--hi-l:24px;--hi-r:16px}` | local: ports with its rule (`.b3-hi`) |
| `--hi-r` | `b3/board.css:4857` | `.b3-hi{--hi-l:24px;--hi-r:16px}` | local: ports with its rule (`.b3-hi`) |
| `--hi-rule` | `b3/board.css:1515` | `.b3-hi-r{position:relative;min-height:46px;--hi-rule:var(--rule3);box-shadow:inset 0 1px 0 var(--hi-rule);cursor:pointer;transition:backgrou` | local: ports with its rule (`.b3-hi-r`) |
| `--hueh` | `b4/classes.css:831` | `.b4 .acx{--pad:14px;--pw:200px;--svh:138px;--cg:16px;--rg:16px;--bgap:16px;--hueh:12px;--huet:14px;--huer:44px;--fh:44px;--frad:9px;--lg:10p` | local: ports with its rule (`.b4 .acx`) |
| `--huer` | `b4/classes.css:831` | `.b4 .acx{--pad:14px;--pw:200px;--svh:138px;--cg:16px;--rg:16px;--bgap:16px;--hueh:12px;--huet:14px;--huer:44px;--fh:44px;--frad:9px;--lg:10p` | local: ports with its rule (`.b4 .acx`) |
| `--huet` | `b4/classes.css:831` | `.b4 .acx{--pad:14px;--pw:200px;--svh:138px;--cg:16px;--rg:16px;--bgap:16px;--hueh:12px;--huet:14px;--huer:44px;--fh:44px;--frad:9px;--lg:10p` | local: ports with its rule (`.b4 .acx`) |
| `--ink1` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--ir` | `b4/classes.css:880` | `.b4 .acx .acx-s.acx-full{--W:var(--sww,100%);--UW:var(--sww,100%);--RL:0px;--RWb:var(--sww,100%);--ox:0px;--oy:0px;--or:var(--swr);--ir:var(` | local: ports with its rule (`.b4 .acx .acx-s.acx-full`) |
| `--k` | `b2.css:262` | `[data-k=R]{--k:var(--danger-ink)}[data-k=F]{--k:var(--info)}[data-k=N]{--k:var(--warn-ink)}[data-k=K]{--k:var(--ok)}[data-k=A]{--k:var(--sch` | local: ports with its rule (`[data-k=R]`) |
| `--k-c32` | `b4/components.css:10` | `:root{--k-t9:9px;--k-t11:11px;--k-t13:13px;--k-t15:15px;--k-c32:32px;--k-c44:44px;--k-g6:6px;--k-g10:10px;--k-g14:14px;--k-g20:20px;--k-g26:` | ports with its rule |
| `--k-c44` | `b4/components.css:10` | `:root{--k-t9:9px;--k-t11:11px;--k-t13:13px;--k-t15:15px;--k-c32:32px;--k-c44:44px;--k-g6:6px;--k-g10:10px;--k-g14:14px;--k-g20:20px;--k-g26:` | ports with its rule |
| `--k-cb` | `b4/components.css:10` | `:root{--k-t9:9px;--k-t11:11px;--k-t13:13px;--k-t15:15px;--k-c32:32px;--k-c44:44px;--k-g6:6px;--k-g10:10px;--k-g14:14px;--k-g20:20px;--k-g26:` | ports with its rule |
| `--k-g10` | `b4/components.css:10` | `:root{--k-t9:9px;--k-t11:11px;--k-t13:13px;--k-t15:15px;--k-c32:32px;--k-c44:44px;--k-g6:6px;--k-g10:10px;--k-g14:14px;--k-g20:20px;--k-g26:` | ports with its rule |
| `--k-g14` | `b4/components.css:10` | `:root{--k-t9:9px;--k-t11:11px;--k-t13:13px;--k-t15:15px;--k-c32:32px;--k-c44:44px;--k-g6:6px;--k-g10:10px;--k-g14:14px;--k-g20:20px;--k-g26:` | ports with its rule |
| `--k-g20` | `b4/components.css:10` | `:root{--k-t9:9px;--k-t11:11px;--k-t13:13px;--k-t15:15px;--k-c32:32px;--k-c44:44px;--k-g6:6px;--k-g10:10px;--k-g14:14px;--k-g20:20px;--k-g26:` | ports with its rule |
| `--k-g26` | `b4/components.css:10` | `:root{--k-t9:9px;--k-t11:11px;--k-t13:13px;--k-t15:15px;--k-c32:32px;--k-c44:44px;--k-g6:6px;--k-g10:10px;--k-g14:14px;--k-g20:20px;--k-g26:` | ports with its rule |
| `--k-g32` | `b4/components.css:10` | `:root{--k-t9:9px;--k-t11:11px;--k-t13:13px;--k-t15:15px;--k-c32:32px;--k-c44:44px;--k-g6:6px;--k-g10:10px;--k-g14:14px;--k-g20:20px;--k-g26:` | ports with its rule |
| `--k-g6` | `b4/components.css:10` | `:root{--k-t9:9px;--k-t11:11px;--k-t13:13px;--k-t15:15px;--k-c32:32px;--k-c44:44px;--k-g6:6px;--k-g10:10px;--k-g14:14px;--k-g20:20px;--k-g26:` | ports with its rule |
| `--k-ix` | `b4/components.css:10` | `:root{--k-t9:9px;--k-t11:11px;--k-t13:13px;--k-t15:15px;--k-c32:32px;--k-c44:44px;--k-g6:6px;--k-g10:10px;--k-g14:14px;--k-g20:20px;--k-g26:` | ports with its rule |
| `--k-lab` | `b4/components.css:10` | `:root{--k-t9:9px;--k-t11:11px;--k-t13:13px;--k-t15:15px;--k-c32:32px;--k-c44:44px;--k-g6:6px;--k-g10:10px;--k-g14:14px;--k-g20:20px;--k-g26:` | ports with its rule |
| `--k-r11` | `b4/components.css:10` | `:root{--k-t9:9px;--k-t11:11px;--k-t13:13px;--k-t15:15px;--k-c32:32px;--k-c44:44px;--k-g6:6px;--k-g10:10px;--k-g14:14px;--k-g20:20px;--k-g26:` | ports with its rule |
| `--k-r8` | `b4/components.css:10` | `:root{--k-t9:9px;--k-t11:11px;--k-t13:13px;--k-t15:15px;--k-c32:32px;--k-c44:44px;--k-g6:6px;--k-g10:10px;--k-g14:14px;--k-g20:20px;--k-g26:` | ports with its rule |
| `--k-t11` | `b4/components.css:10` | `:root{--k-t9:9px;--k-t11:11px;--k-t13:13px;--k-t15:15px;--k-c32:32px;--k-c44:44px;--k-g6:6px;--k-g10:10px;--k-g14:14px;--k-g20:20px;--k-g26:` | ports with its rule |
| `--k-t13` | `b4/components.css:10` | `:root{--k-t9:9px;--k-t11:11px;--k-t13:13px;--k-t15:15px;--k-c32:32px;--k-c44:44px;--k-g6:6px;--k-g10:10px;--k-g14:14px;--k-g20:20px;--k-g26:` | ports with its rule |
| `--k-t15` | `b4/components.css:10` | `:root{--k-t9:9px;--k-t11:11px;--k-t13:13px;--k-t15:15px;--k-c32:32px;--k-c44:44px;--k-g6:6px;--k-g10:10px;--k-g14:14px;--k-g20:20px;--k-g26:` | ports with its rule |
| `--k-t9` | `b4/components.css:10` | `:root{--k-t9:9px;--k-t11:11px;--k-t13:13px;--k-t15:15px;--k-c32:32px;--k-c44:44px;--k-g6:6px;--k-g10:10px;--k-g14:14px;--k-g20:20px;--k-g26:` | ports with its rule |
| `--lab-bg` | `b3/board.css:487` | `--lab-bg:color-mix(in srgb,var(--sl) 30%,#080C0F);--lab-ink:color-mix(in srgb,var(--sl) 94%,white);` | local: ports with its rule (`.b3-lab[data-lab=cap]`) |
| `--lab-div` | `b3/board.css:479` | `/* \u26a0\ufe0f THE HAIRLINE IS GONE, AND IT IS GONE BECAUSE IT NEVER DREW. `--lab-div:1px solid color-mix(\u2026)` fed into` | ports with its rule |
| `--lab-fam` | `b3/board.css:477` | `html[data-b3-p2lab=key],.b3-lab[data-lab=key]{--lab-sep:"";--lab-w:700;--lab-size:var(--t-micro);--lab-fam:var(--data);` | local: ports with its rule (`.b3-lab[data-lab=key]`) |
| `--lab-gap` | `b3/board.css:478` | `--lab-tt:uppercase;--lab-tr:var(--b3-tr);--lab-gap:6px}` | local: ports with its rule (`.b3-lab[data-lab=key]`) |
| `--lab-ink` | `b3/board.css:487` | `--lab-bg:color-mix(in srgb,var(--sl) 30%,#080C0F);--lab-ink:color-mix(in srgb,var(--sl) 94%,white);` | local: ports with its rule (`.b3-lab[data-lab=cap]`) |
| `--lab-ml` | `b3/board.css:485` | `--lab-tt:uppercase;--lab-tr:var(--b3-tr);--lab-gap:8px;--lab-pad:0 7px 0 11px;--lab-ml:-11px;` | local: ports with its rule (`.b3-lab[data-lab=cap]`) |
| `--lab-pad` | `b3/board.css:485` | `--lab-tt:uppercase;--lab-tr:var(--b3-tr);--lab-gap:8px;--lab-pad:0 7px 0 11px;--lab-ml:-11px;` | local: ports with its rule (`.b3-lab[data-lab=cap]`) |
| `--lab-rad` | `b3/board.css:486` | `--lab-rad:var(--rad-pill) 3px 3px var(--rad-pill);` | local: ports with its rule (`.b3-lab[data-lab=cap]`) |
| `--lab-ring` | `b3/board.css:488` | `--lab-ring:inset -1px 0 0 color-mix(in srgb,var(--sl) 46%,transparent)}` | local: ports with its rule (`.b3-lab[data-lab=cap]`) |
| `--lab-sep` | `b3/board.css:476` | `html[data-b3-p2lab=colon],.b3-lab[data-lab=colon]{--lab-sep:":";--lab-w:700}` | local: ports with its rule (`.b3-lab[data-lab=colon]`) |
| `--lab-size` | `b3/board.css:477` | `html[data-b3-p2lab=key],.b3-lab[data-lab=key]{--lab-sep:"";--lab-w:700;--lab-size:var(--t-micro);--lab-fam:var(--data);` | local: ports with its rule (`.b3-lab[data-lab=key]`) |
| `--lab-tr` | `b3/board.css:478` | `--lab-tt:uppercase;--lab-tr:var(--b3-tr);--lab-gap:6px}` | local: ports with its rule (`.b3-lab[data-lab=key]`) |
| `--lab-tt` | `b3/board.css:478` | `--lab-tt:uppercase;--lab-tr:var(--b3-tr);--lab-gap:6px}` | local: ports with its rule (`.b3-lab[data-lab=key]`) |
| `--lab-w` | `b3/board.css:476` | `html[data-b3-p2lab=colon],.b3-lab[data-lab=colon]{--lab-sep:":";--lab-w:700}` | local: ports with its rule (`.b3-lab[data-lab=colon]`) |
| `--lc` | `b2.css:199` | `.pb-life{--lc:var(--ok);justify-self:start;display:inline-flex;align-items:center;gap:7px;height:28px;padding:0 11px 0 9px;border-radius:var` | local: ports with its rule (`.pb-life`) |
| `--lg` | `b4/classes.css:831` | `.b4 .acx{--pad:14px;--pw:200px;--svh:138px;--cg:16px;--rg:16px;--bgap:16px;--hueh:12px;--huet:14px;--huer:44px;--fh:44px;--frad:9px;--lg:10p` | local: ports with its rule (`.b4 .acx`) |
| `--lh-1` | `app.css:314` | `--lh-tight:1.15; --lh-ui:1.35; --lh-body:1.5; --lh-1:round(up, 1em, 2px);` | new portal token: `--lh-1` in `portal/ui/tokens.css` |
| `--lh-ic-n` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--lh-n-w` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--lh-pl` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--lh-pr` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--lh-vl-vt` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--lit` | `b3/board.css:1876` | `.b3-bdg[data-k=meta]{--lit:.06;--b3-amb:1.6;--b3-glow:1.7;overflow:hidden}` | local: ports with its rule (`.b3-bdg[data-k=meta]`) |
| `--lk-bg` | `b4/kit.css:5` | `.b4 .wg-r .wg-imx.b3-okx .b3-fchip:not(#_):not(#_) { --c-k: var(--ok); --lk-w: 1px; --lk-bg: color-mix(in srgb, var(--c-k) 14%, transparent)` | ports with its rule |
| `--lk-fg` | `b4/kit.css:5` | `.b4 .wg-r .wg-imx.b3-okx .b3-fchip:not(#_):not(#_) { --c-k: var(--ok); --lk-w: 1px; --lk-bg: color-mix(in srgb, var(--c-k) 14%, transparent)` | ports with its rule |
| `--lk-glow` | `b4/kit.css:5` | `.b4 .wg-r .wg-imx.b3-okx .b3-fchip:not(#_):not(#_) { --c-k: var(--ok); --lk-w: 1px; --lk-bg: color-mix(in srgb, var(--c-k) 14%, transparent)` | ports with its rule |
| `--lk-hbg` | `b4/kit.css:5` | `.b4 .wg-r .wg-imx.b3-okx .b3-fchip:not(#_):not(#_) { --c-k: var(--ok); --lk-w: 1px; --lk-bg: color-mix(in srgb, var(--c-k) 14%, transparent)` | ports with its rule |
| `--lk-hfg` | `b4/kit.css:5` | `.b4 .wg-r .wg-imx.b3-okx .b3-fchip:not(#_):not(#_) { --c-k: var(--ok); --lk-w: 1px; --lk-bg: color-mix(in srgb, var(--c-k) 14%, transparent)` | ports with its rule |
| `--lk-hring` | `b4/kit.css:5` | `.b4 .wg-r .wg-imx.b3-okx .b3-fchip:not(#_):not(#_) { --c-k: var(--ok); --lk-w: 1px; --lk-bg: color-mix(in srgb, var(--c-k) 14%, transparent)` | ports with its rule |
| `--lk-ring` | `b4/kit.css:5` | `.b4 .wg-r .wg-imx.b3-okx .b3-fchip:not(#_):not(#_) { --c-k: var(--ok); --lk-w: 1px; --lk-bg: color-mix(in srgb, var(--c-k) 14%, transparent)` | ports with its rule |
| `--lk-sbg` | `b4/kit.css:5` | `.b4 .wg-r .wg-imx.b3-okx .b3-fchip:not(#_):not(#_) { --c-k: var(--ok); --lk-w: 1px; --lk-bg: color-mix(in srgb, var(--c-k) 14%, transparent)` | ports with its rule |
| `--lk-sfg` | `b4/kit.css:5` | `.b4 .wg-r .wg-imx.b3-okx .b3-fchip:not(#_):not(#_) { --c-k: var(--ok); --lk-w: 1px; --lk-bg: color-mix(in srgb, var(--c-k) 14%, transparent)` | ports with its rule |
| `--lk-sring` | `b4/kit.css:5` | `.b4 .wg-r .wg-imx.b3-okx .b3-fchip:not(#_):not(#_) { --c-k: var(--ok); --lk-w: 1px; --lk-bg: color-mix(in srgb, var(--c-k) 14%, transparent)` | ports with its rule |
| `--lk-w` | `b4/kit.css:5` | `.b4 .wg-r .wg-imx.b3-okx .b3-fchip:not(#_):not(#_) { --c-k: var(--ok); --lk-w: 1px; --lk-bg: color-mix(in srgb, var(--c-k) 14%, transparent)` | ports with its rule |
| `--m` | `b4/compare.js:354` | `<span class="cx-dcf" aria-hidden="true">${chosen.map((b, k) => html`<i key=${String(b._id)} style=${`--c:${optionOf(b.weaponName).accent};--` | ports with its rule |
| `--m1` | `b4.css:34` | `html:is([data-b3-xbg=mesh],[data-b3-xbg=ground]) :is(.drawer:has(.b3-nb), .drawer.b1, .drawer .b4-ask){ --m1:#ff3b5c;--m2:#f6a93b;` | local: ports with its rule (`html:is([data-b3-xbg=mesh]`) |
| `--m2` | `b4.css:34` | `html:is([data-b3-xbg=mesh],[data-b3-xbg=ground]) :is(.drawer:has(.b3-nb), .drawer.b1, .drawer .b4-ask){ --m1:#ff3b5c;--m2:#f6a93b;` | local: ports with its rule (`html:is([data-b3-xbg=mesh]`) |
| `--m3` | `ui/access.js:191` | `style=${tint ? `--m1:${tint[0]};--m2:${tint[1] \|\| tint[0]};--m3:${tint[2] \|\| tint[1] \|\| tint[0]}` : null}>` | ports with its rule |
| `--m4` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--mc` | `b4.css:163` | `.b4 .mh-mode button[data-arm="MP"] { --mc:#FF3B5C }` | local: ports with its rule (`.b4 .mh-mode button[data-arm="MP"]`) |
| `--meshGold` | `app.css:93` | `--meshGold:#F2C230;   /* 2026-09-30 17:27 EDT, his: "use patch gold for the background glow for the drawer, as well as any other drawer/back` | new portal token: `--meshGold` in `portal/ui/tokens.css` (his own name for it) |
| `--mi` | `b3/armory-parts.js:673` | `modesOf(b).forEach((m, i) => groups.push(html`<span class="b3-bdg" data-k="mode" data-m=${m} key=${`md-${m}`} style=${`--mi:${i}`} aria-labe` | ports with its rule |
| `--mk` | `b4/classes.css:607` | `[data-k=capable]{--mk:#5B9BFF}[data-k=ass]:not(.b3-bdg){--mk:#C08A55}` | local: ports with its rule (`[data-k=capable]`) |
| `--mw` | `b4/classes.css:138` (set by script) | `hover and the keyboard's row are the same hue wash and ring. The list may widen to its column (--mw, set as it opens) and a row ellipsizes` | set by its script: ports with that file |
| `--n` | `b3/armory-parts.js:255` | `<span class="b3-fh-cmp" style=${`--n:${of}`}>` | ports with its rule |
| `--oc` | `b4/bulk.css:58` | `.b4 .bk-fl [data-o=new]{--oc:var(--ok)}.b4 .bk-fl [data-o=upd]{--oc:var(--focus)}.b4 .bk-fl :is([data-o=warn],[data-o=dup]){--oc:var(--warn)` | local: ports with its rule (`.b4 .bk-fl [data-o=new]`) |
| `--on-cur` | `b3/broadcast.js:357` | `<div class="acx" ref=${root} style=${`--cur:${cur};--on-cur:${onInk(cur)}`}>` | ports with its rule |
| `--on-sw` | `b3/broadcast.js:375` | `? html`<div key=${i} class=${'acx-s acx-full' + (openI === i ? ' acx-open' : '') + (closing[i] ? ' acx-closing' : '')} data-dir=${i >= NCOL ` | ports with its rule |
| `--or` | `b4/classes.css:880` | `.b4 .acx .acx-s.acx-full{--W:var(--sww,100%);--UW:var(--sww,100%);--RL:0px;--RWb:var(--sww,100%);--ox:0px;--oy:0px;--or:var(--swr);--ir:var(` | local: ports with its rule (`.b4 .acx .acx-s.acx-full`) |
| `--ox` | `b4/classes.css:880` | `.b4 .acx .acx-s.acx-full{--W:var(--sww,100%);--UW:var(--sww,100%);--RL:0px;--RWb:var(--sww,100%);--ox:0px;--oy:0px;--or:var(--swr);--ir:var(` | local: ports with its rule (`.b4 .acx .acx-s.acx-full`) |
| `--oy` | `b4/classes.css:880` | `.b4 .acx .acx-s.acx-full{--W:var(--sww,100%);--UW:var(--sww,100%);--RL:0px;--RWb:var(--sww,100%);--ox:0px;--oy:0px;--or:var(--swr);--ir:var(` | local: ports with its rule (`.b4 .acx .acx-s.acx-full`) |
| `--pad` | `b4/classes.css:831` | `.b4 .acx{--pad:14px;--pw:200px;--svh:138px;--cg:16px;--rg:16px;--bgap:16px;--hueh:12px;--huet:14px;--huer:44px;--fh:44px;--frad:9px;--lg:10p` | local: ports with its rule (`.b4 .acx`) |
| `--pb-inset` | `b3/board.css:4621` | `.g-card .pb-dates .pb-cacts{--pb-inset:0px}` | local: ports with its rule (`.g-card .pb-dates .pb-cacts`) |
| `--pcb` | `b4/classes.css:311` | `.b3-hc.t-warn{--pcbg:color-mix(in srgb,var(--warn) 12%,var(--desk));--pcb:color-mix(in srgb,var(--warn) 45%,var(--desk))}` | local: ports with its rule (`.b3-hc.t-warn`) |
| `--pcbg` | `b4/classes.css:311` | `.b3-hc.t-warn{--pcbg:color-mix(in srgb,var(--warn) 12%,var(--desk));--pcb:color-mix(in srgb,var(--warn) 45%,var(--desk))}` | local: ports with its rule (`.b3-hc.t-warn`) |
| `--pct` | `b4/library.css:125` | `.b4 .b3-pc { --pct: var(--warn); --pcb: color-mix(in srgb, var(--pct) 55%, transparent); filter: drop-shadow(0 10px 14px rgba(0, 0, 0, .55))` | ports with its rule |
| `--ph` | `b3/armory-parts.js:681` | `return html`<span class=${'b3-bdgs' + (seen ? ' in' : '') + (bare ? ' bare' : '')} ref=${wrap} style=${`--ph:${ph}`}>${bare ? groups.map((g,` | ports with its rule |
| `--pk` | `b3/volt.js:212` | `s.style.cssText = `--pk:${PEAK[i]};--ha:${(ha * 100).toFixed(1)}%;--sx:${sx.toFixed(1)}%;--sy:${sy.toFixed(1)}%`;` | ports with its rule |
| `--pop1-arc` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--pop1-fadeIn` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--pop1-fadeOut` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--pop1-grow` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--pop1-shrink` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--pop2-arc` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--pop2-fadeIn` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--pop2-fadeOut` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--pop3-arc` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--pop3-fadeIn` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--pop3-fadeOut` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--pr` | `b4/classes.css:880` | `.b4 .acx .acx-s.acx-full{--W:var(--sww,100%);--UW:var(--sww,100%);--RL:0px;--RWb:var(--sww,100%);--ox:0px;--oy:0px;--or:var(--swr);--ir:var(` | local: ports with its rule (`.b4 .acx .acx-s.acx-full`) |
| `--pu` | `b4/classes.css:880` | `.b4 .acx .acx-s.acx-full{--W:var(--sww,100%);--UW:var(--sww,100%);--RL:0px;--RWb:var(--sww,100%);--ox:0px;--oy:0px;--or:var(--swr);--ir:var(` | local: ports with its rule (`.b4 .acx .acx-s.acx-full`) |
| `--r-att-code` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--r-code-warn` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--r-n-att` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--r-pl` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--r-tag` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--r-warn-img` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--rc` | `b3/board.css:4230` | `#g-export,#g-queue,.g-exs{--rc:var(--r-armory)}` | local: ports with its rule (`#g-export`) |
| `--rc-a` | `b3/board.css:4232` | `--rc-a:var(--rc,var(--r-armory));` | local: ports with its rule (`html:is([data-b3-xbg=mesh]`) |
| `--reach` | `b3/armory-parts.js:526` | `style=${pinToViewport && fix ? `--tx:${tx}px;--reach:${((box && box.w) \|\| 368) - tx - 24}px;left:${fix.left}px;${fix.above ? 'bottom' : 'top` | ports with its rule |
| `--rg` | `b4/classes.css:831` | `.b4 .acx{--pad:14px;--pw:200px;--svh:138px;--cg:16px;--rg:16px;--bgap:16px;--hueh:12px;--huet:14px;--huer:44px;--fh:44px;--frad:9px;--lg:10p` | local: ports with its rule (`.b4 .acx`) |
| `--s` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--sl` | `b2.css:325` | `.pb-rail > span{--sl:var(--ink4);height:24px;padding:0 8px;border-radius:5px;background:color-mix(in srgb,var(--sl) 9%,var(--sunk));box-shad` | local: ports with its rule (`.pb-rail > span`) |
| `--sl-` | `gates/armory.js:133` (set by script) | `const put = (k, v) => { document.documentElement.style.setProperty(`--sl-${k}`, v); setMine((m) => ({ ...m, [k]: v })); };` | set by its script: ports with that file |
| `--sl-am` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--sl-ba` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--sl-bar` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--sl-m` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--sl-re` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--sl-sto` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--sl-unkno` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--sl-unknow` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--sl-unknown` | `b3/board.css:3335` | `:root{--sl-unknown:#94A3B3}` | new portal token: `--sl-unknown` in `portal/ui/tokens.css` |
| `--stage-h` | `gates/lib.js:41` | `style=${tall ? `--stage-h:${tall}px` : null}>` | ports with its rule |
| `--stc` | `b4/library.css:188` | `.b4 .b4-hint[data-tone=warn] { --stc: var(--warn); } .b4 .b4-hint[data-tone=ok] { --stc: var(--ok); } .b4 .b4-hint[data-tone=magic] { --stc:` | ports with its rule |
| `--step-bg` | `b4/classes.css:1061` | `.b4 :is(#_,.pb-step).pb-step{--step-bg:color-mix(in srgb,#04070A 52%,var(--sunk));--step-line:color-mix(in srgb,var(--ink) 22%,var(--step-bg` | local: ports with its rule (`.b4 :is(#_`) |
| `--step-r` | `b4/classes.css:1061` | `.b4 :is(#_,.pb-step).pb-step{--step-bg:color-mix(in srgb,#04070A 52%,var(--sunk));--step-line:color-mix(in srgb,var(--ink) 22%,var(--step-bg` | local: ports with its rule (`.b4 :is(#_`) |
| `--sv` | `b3/history.js:42` | `return html`<span class="b3-meter" style=${`--sv:${L[2]}`} aria-hidden="true">${[1, 2, 3, 4].map((i) => html`<i key=${i} class=${i <= L[1] ?` | ports with its rule |
| `--sv-caution` | `b3/board.css:2323` | `:root{--sv-error:#FF5A4F;--sv-warn:#FF8A3D;--sv-caution:#F0B447;--sv-info:#85939F}` | new portal token: `--sv-caution` in `portal/ui/tokens.css` |
| `--sv-error` | `b3/board.css:2323` | `:root{--sv-error:#FF5A4F;--sv-warn:#FF8A3D;--sv-caution:#F0B447;--sv-info:#85939F}` | new portal token: `--sv-error` in `portal/ui/tokens.css` |
| `--sv-info` | `b3/board.css:2323` | `:root{--sv-error:#FF5A4F;--sv-warn:#FF8A3D;--sv-caution:#F0B447;--sv-info:#85939F}` | = `--ink3` (same value) |
| `--svh` | `b4/classes.css:831` | `.b4 .acx{--pad:14px;--pw:200px;--svh:138px;--cg:16px;--rg:16px;--bgap:16px;--hueh:12px;--huet:14px;--huer:44px;--fh:44px;--frad:9px;--lg:10p` | local: ports with its rule (`.b4 .acx`) |
| `--sw` | `b3/broadcast.js:369` | `? html`<button type="button" key=${i} class="acx-s" style=${`--sw:${c}`} aria-pressed=${c === cur ? 'true' : 'false'} aria-label=${`Use ${c}` | ports with its rule |
| `--swg` | `b4/classes.css:831` | `.b4 .acx{--pad:14px;--pw:200px;--svh:138px;--cg:16px;--rg:16px;--bgap:16px;--hueh:12px;--huet:14px;--huer:44px;--fh:44px;--frad:9px;--lg:10p` | local: ports with its rule (`.b4 .acx`) |
| `--swr` | `b4/classes.css:831` | `.b4 .acx{--pad:14px;--pw:200px;--svh:138px;--cg:16px;--rg:16px;--bgap:16px;--hueh:12px;--huet:14px;--huer:44px;--fh:44px;--frad:9px;--lg:10p` | local: ports with its rule (`.b4 .acx`) |
| `--sx` | `b3/volt.js:151` | `+ steps.map(([t, l, sx, sy]) => `${(t * 100).toFixed(3)}%{--lit:${l.toFixed(3)};--sx:${sx.toFixed(1)}%;--sy:${sy.toFixed(1)}%}`).join('')` | ports with its rule |
| `--sy` | `b3/volt.js:151` | `+ steps.map(([t, l, sx, sy]) => `${(t * 100).toFixed(3)}%{--lit:${l.toFixed(3)};--sx:${sx.toFixed(1)}%;--sy:${sy.toFixed(1)}%}`).join('')` | ports with its rule |
| `--tx` | `b3/armory-parts.js:123` | `style=${geo ? (geo.down ? `left:${geo.left}px;top:${geo.top}px;bottom:auto;--tx:${geo.tx}px` : `left:${geo.left}px;top:auto;bottom:${geo.bot` | ports with its rule |
| `--tx1` | `b3/board.css:1986` | `0%{--tx1:14%;--ty1:38%;--tx2:68%;--ty2:64%;--tx3:44%;--ty3:12%}` | local: ports with its rule (`0%`) |
| `--tx2` | `b3/board.css:1986` | `0%{--tx1:14%;--ty1:38%;--tx2:68%;--ty2:64%;--tx3:44%;--ty3:12%}` | local: ports with its rule (`0%`) |
| `--tx3` | `b3/board.css:1986` | `0%{--tx1:14%;--ty1:38%;--tx2:68%;--ty2:64%;--tx3:44%;--ty3:12%}` | local: ports with its rule (`0%`) |
| `--ty1` | `b3/board.css:1986` | `0%{--tx1:14%;--ty1:38%;--tx2:68%;--ty2:64%;--tx3:44%;--ty3:12%}` | local: ports with its rule (`0%`) |
| `--ty2` | `b3/board.css:1986` | `0%{--tx1:14%;--ty1:38%;--tx2:68%;--ty2:64%;--tx3:44%;--ty3:12%}` | local: ports with its rule (`0%`) |
| `--ty3` | `b3/board.css:1986` | `0%{--tx1:14%;--ty1:38%;--tx2:68%;--ty2:64%;--tx3:44%;--ty3:12%}` | local: ports with its rule (`0%`) |
| `--v-code` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--v-group` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--v-head-h` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--v-head-row` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--v-row-h` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
| `--xf-dur` | `b3/board.css:3807` | `.b3-xt-files{--xf-dur:420ms;--xf-ease:cubic-bezier(.32,.72,0,1)}` | local: ports with its rule (`.b3-xt-files`) |
| `--xf-ease` | `b3/board.css:3807` | `.b3-xt-files{--xf-dur:420ms;--xf-ease:cubic-bezier(.32,.72,0,1)}` | local: ports with its rule (`.b3-xt-files`) |
| `--xf-nw` | — **not defined anywhere in the kit** | `` | dead read: drop it, or keep its var() fallback |
