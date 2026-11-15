---
kind: reference
status: live
---

# Board 4: Final resolved values · Tokens as resolved on `:root`

*Part of the generated spec; read `README.md` in this folder first.*

## Tokens as resolved on `:root`

Every custom property the kit's four stylesheets read. **Scope** says where it is set: `:root` means a global token; `component` means a rule sets it on an element (read its value in that element's table); `JS` means only `b3/state.js` stamps it at runtime, so it does not exist in any stylesheet and must become a real token or a literal when ported.

| token | value on :root | scope |
|---|---|---|
| `--RL` | — | component |
| `--RWb` | — | component |
| `--UW` | — | component |
| `--W` | — | component |
| `--a` | — | fallback only |
| `--ar` | `#FF3B5C` | :root |
| `--atbg` | — | component |
| `--atts-l` | `0px` | :root |
| `--atts-r` | `34px` | :root |
| `--av-src` | — | fallback only |
| `--avatar-a` | `#3A4C5A` | :root |
| `--b` | — | component |
| `--b3-amb` | — | component |
| `--b3-ang` | `0deg` | :root |
| `--b3-cdu` | `url("data:image/svg+xml,%3Csvg xmlns='http:/…")` | :root |
| `--b3-check` | `url("data:image/svg+xml,%3Csvg xmlns='http:/…")` | :root |
| `--b3-clock` | `url("data:image/svg+xml,%3Csvg xmlns='http:/…")` | :root |
| `--b3-cud` | `url("data:image/svg+xml,%3Csvg xmlns='http:/…")` | :root |
| `--b3-d1` | `.15s` | :root |
| `--b3-d2` | `.22s` | :root |
| `--b3-d3` | `.3s` | :root |
| `--b3-edge` | — | component |
| `--b3-fill` | — | component |
| `--b3-foldw` | — | component |
| `--b3-glow` | — | component |
| `--b3-hatch` | `repeating-linear-gradient(-45deg,#FF7A45 0 2.5px,transparent 2.5px 5px)` | :root |
| `--b3-layers` | `url("data:image/svg+xml,%3Csvg xmlns='http:/…")` | :root |
| `--b3-lift` | `0 24px 48px -16px rgba(0,0,0,.8)` | :root |
| `--b3-plus` | `url("data:image/svg+xml,%3Csvg xmlns='http:/…")` | :root |
| `--b3-plusdk` | `url("data:image/svg+xml,%3Csvg xmlns='http:/…")` | :root |
| `--b3-repeat` | `url("data:image/svg+xml,%3Csvg xmlns='http:/…")` | :root |
| `--b3-ring` | `inset 0 0 0 1px #3A4752` | :root |
| `--b3-speck` | — | component |
| `--b3-text` | `url("data:image/svg+xml,%3Csvg xmlns='http:/…")` | :root |
| `--b3-tip-clip` | — | component |
| `--b3-tip-down` | `polygon(0 0,100% 0,50% 100%)` | :root |
| `--b3-tip-fill` | — | component |
| `--b3-tip-h` | `7px` | :root |
| `--b3-tip-ring` | — | component |
| `--b3-tip-up` | `polygon(50% 0,100% 100%,0 100%)` | :root |
| `--b3-tip-w` | `14px` | :root |
| `--b3-tr` | `.11em` | :root |
| `--b3-tr-tight` | `.06em` | :root |
| `--b3-tr-wide` | `.14em` | :root |
| `--b3-under` | — | component |
| `--b4-imgoff` | — | component |
| `--band` | — | component |
| `--bc` | — | component |
| `--bdc-w` | — | component |
| `--bgap` | — | component |
| `--box-inset` | `calc((44px - 32px) / 2)` | :root |
| `--box-size` | `32px` | :root |
| `--c` | — | component |
| `--c-k` | — | component |
| `--cc-edge` | — | component |
| `--cg` | — | component |
| `--ci` | — | fallback only |
| `--ci-bg` | — | component |
| `--clear` | — | component |
| `--code-js` | — | fallback only |
| `--code-w` | — | component |
| `--cols` | — | component |
| `--colsc` | — | component |
| `--ctl-min` | `auto` | :root |
| `--ctl-pad` | `1px 6px` | :root |
| `--ctl-pl` | — | component |
| `--ctl-rad` | `0` | :root |
| `--cur` | — | fallback only |
| `--d` | — | component |
| `--d3` | — | component |
| `--danger-edge` | `#54322F` | :root |
| `--danger-ink` | `#FF8A85` | :root |
| `--data` | `"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace` | :root |
| `--dc` | — | component |
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
| `--dlen` | — | component |
| `--dp-c` | — | fallback only |
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
| `--eio` | — | component |
| `--ev` | `#4A90D9` | :root |
| `--ev-ink` | `#25A570` | :root |
| `--f` | — | fallback only |
| `--f-bg` | — | component |
| `--f-ch` | — | fallback only |
| `--f-edge` | — | component |
| `--f-hue` | — | fallback only |
| `--f-lw` | — | component |
| `--f-sidew` | — | component |
| `--fb` | `0px` | :root |
| `--fc` | — | component |
| `--fdy` | — | component |
| `--fh` | — | component |
| `--fill` | — | component |
| `--fl` | — | fallback only |
| `--fld-rad` | — | component |
| `--fo` | — | fallback only |
| `--focus` | `#5FD4E8` | :root |
| `--focus-07` | `rgba(95,212,232,.07)` | :root |
| `--focus-13` | `rgba(95,212,232,.13)` | :root |
| `--fr` | — | fallback only |
| `--frad` | — | component |
| `--from` | — | fallback only |
| `--ft` | `0px` | :root |
| `--fth` | — | fallback only |
| `--fx-l` | — | component |
| `--fx-r` | — | component |
| `--gap` | `14px` | :root |
| `--gc` | — | component |
| `--gh-cat-range` | — | fallback only |
| `--gh-chip-x` | — | fallback only |
| `--gh-div-badge` | — | fallback only |
| `--gh-name-cat` | — | fallback only |
| `--gh-pl` | — | fallback only |
| `--gh-pr` | — | fallback only |
| `--gh-range-div` | — | fallback only |
| `--glo` | — | component |
| `--gut` | `24px` | :root |
| `--gutter` | `138px` | :root |
| `--gw` | — | component |
| `--h1-cell` | `24px` | JS · `b3/state.js` stamp() |
| `--h1-day` | `52px` | JS · `b3/state.js` stamp() |
| `--h1-kind` | `110px` | JS · `b3/state.js` stamp() |
| `--h1-l` | `24px` | JS · `b3/state.js` stamp() |
| `--h1-r` | `24px` | JS · `b3/state.js` stamp() |
| `--h1-rowh` | `44px` | JS · `b3/state.js` stamp() |
| `--h1-rowp` | `12px` | JS · `b3/state.js` stamp() |
| `--h1-undo` | `90px` | JS · `b3/state.js` stamp() |
| `--h1-who` | `100px` | JS · `b3/state.js` stamp() |
| `--hc` | — | fallback only |
| `--hc-c` | — | component |
| `--hdr-h` | `52px` | :root |
| `--hi` | `#232C34` | :root |
| `--hi-head` | — | component |
| `--hi-l` | — | component |
| `--hi-r` | — | component |
| `--hi-rule` | — | component |
| `--hueh` | — | component |
| `--huer` | — | component |
| `--huet` | — | component |
| `--info` | `#409AD0` | :root |
| `--ink` | `#E8EDF1` | :root |
| `--ink1` | — | fallback only |
| `--ink2` | `#9DAAB4` | :root |
| `--ink3` | `#85939F` | :root |
| `--ink4` | `#5C6A75` | :root |
| `--inset-06` | `rgba(255,255,255,.06)` | :root |
| `--inset-09` | `rgba(255,255,255,.09)` | :root |
| `--inset-14` | `rgba(255,255,255,.14)` | :root |
| `--inset-16` | `rgba(255,255,255,.16)` | :root |
| `--inset-22` | `rgba(255,255,255,.22)` | :root |
| `--inset-35` | `rgba(255,255,255,.35)` | :root |
| `--ir` | — | component |
| `--k` | — | component |
| `--k-c32` | `32px` | :root |
| `--k-c44` | `44px` | :root |
| `--k-cb` | `18px` | :root |
| `--k-g10` | `10px` | :root |
| `--k-g14` | `14px` | :root |
| `--k-g20` | `20px` | :root |
| `--k-g26` | `26px` | :root |
| `--k-g32` | `32px` | :root |
| `--k-g6` | `6px` | :root |
| `--k-hit` | `calc((18px - 44px) / 2)` | :root |
| `--k-ix` | `9px` | :root |
| `--k-lab` | `64px` | :root |
| `--k-r11` | `11px` | :root |
| `--k-r8` | `8px` | :root |
| `--k-ring` | `calc(-1 * calc((44px - 32px) / 2))` | :root |
| `--k-t11` | `11px` | :root |
| `--k-t13` | `13px` | :root |
| `--k-t15` | `15px` | :root |
| `--k-t9` | `9px` | :root |
| `--kg` | — | component |
| `--kw` | — | fallback only |
| `--lab-bg` | — | component |
| `--lab-div` | — | component |
| `--lab-fam` | `"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace` | :root |
| `--lab-gap` | `6px` | :root |
| `--lab-ink` | — | component |
| `--lab-ml` | — | component |
| `--lab-order` | — | component |
| `--lab-pad` | — | component |
| `--lab-rad` | — | component |
| `--lab-ring` | — | component |
| `--lab-sep` | `""` | :root |
| `--lab-size` | `9px` | :root |
| `--lab-tr` | `.11em` | :root |
| `--lab-tt` | `uppercase` | :root |
| `--lab-w` | `700` | :root |
| `--lc` | — | component |
| `--lg` | — | component |
| `--lh-1` | `round(up, 1em, 2px)` | :root |
| `--lh-body` | `1.5` | :root |
| `--lh-ic-n` | — | fallback only |
| `--lh-n-w` | — | fallback only |
| `--lh-pl` | — | fallback only |
| `--lh-pr` | — | fallback only |
| `--lh-ui` | `1.35` | :root |
| `--lh-vl-vt` | — | fallback only |
| `--lift` | `2px` | :root |
| `--lit` | `0.06` | :root |
| `--live` | — | component |
| `--lk-bg` | — | component |
| `--lk-fg` | — | component |
| `--lk-glow` | — | component |
| `--lk-hbg` | — | component |
| `--lk-hfg` | — | component |
| `--lk-hring` | — | component |
| `--lk-ring` | — | component |
| `--lk-sbg` | — | component |
| `--lk-sfg` | — | component |
| `--lk-shbg` | — | component |
| `--lk-shfg` | — | component |
| `--lk-shring` | — | component |
| `--lk-sring` | — | component |
| `--lk-w` | — | component |
| `--m` | — | fallback only |
| `--m1` | — | component |
| `--m2` | — | component |
| `--m3` | — | fallback only |
| `--m4` | — | fallback only |
| `--marks-w` | — | component |
| `--mc` | — | component |
| `--meshGold` | `#F2C230` | :root |
| `--mi` | — | fallback only |
| `--mk` | — | component |
| `--mode-dmz` | `#3DA5F5` | :root |
| `--mode-mp` | `#FF3430` | :root |
| `--mono` | `"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace` | :root |
| `--mt-lab-after` | — | component |
| `--mw` | — | fallback only |
| `--n` | — | fallback only |
| `--nw` | — | component |
| `--o` | — | component |
| `--oc` | — | component |
| `--ok` | `#7BDB63` | :root |
| `--on-accent` | `#07090A` | :root |
| `--on-cur` | — | fallback only |
| `--on-ok` | `#07130A` | :root |
| `--on-staged` | `#1A2000` | :root |
| `--on-sw` | — | fallback only |
| `--or` | — | component |
| `--overlay-62` | `rgba(6,9,11,.62)` | :root |
| `--overlay-66` | `rgba(6,9,11,.66)` | :root |
| `--ow-c-min` | `88px` | :root |
| `--ow-pill-min` | `126px` | :root |
| `--ox` | — | component |
| `--oy` | — | component |
| `--p` | — | fallback only |
| `--pad` | — | component |
| `--paper` | `#171E24` | :root |
| `--pb-inset` | `calc((44px - 32px) / 2)` | :root |
| `--pcb` | — | component |
| `--pcbg` | — | component |
| `--pct` | — | component |
| `--ph` | — | fallback only |
| `--pk` | — | fallback only |
| `--plot-l` | `138px` | :root |
| `--pn` | `#F2C230` | :root |
| `--pop` | — | component |
| `--pop1-arc` | `600ms` | :root |
| `--pop1-fadeIn` | `140ms` | :root |
| `--pop1-fadeOut` | `180ms` | :root |
| `--pop1-grow` | `600ms` | :root |
| `--pop1-shrink` | `220ms` | :root |
| `--pop2-arc` | `600ms` | :root |
| `--pop2-fadeIn` | `220ms` | :root |
| `--pop2-fadeOut` | `180ms` | :root |
| `--pop3-arc` | `600ms` | :root |
| `--pop3-fadeIn` | `200ms` | :root |
| `--pop3-fadeOut` | `180ms` | :root |
| `--pp` | — | component |
| `--pr` | — | component |
| `--press` | `1px` | :root |
| `--pu` | — | component |
| `--pw` | — | component |
| `--r-access` | `#6C8AF7` | :root |
| `--r-analytics` | `#9CC85A` | :root |
| `--r-armory` | `#EF4444` | :root |
| `--r-att-code` | — | fallback only |
| `--r-broadcast` | `#EC4899` | :root |
| `--r-code-warn` | — | fallback only |
| `--r-history` | `#00E1D9` | :root |
| `--r-img-x` | — | fallback only |
| `--r-n-att` | — | fallback only |
| `--r-pl` | — | fallback only |
| `--r-pr` | — | fallback only |
| `--r-review` | `#D8F24A` | :root |
| `--r-season` | `#F59E0C` | :root |
| `--r-tag` | — | fallback only |
| `--r-warn-img` | — | fallback only |
| `--rad-1` | `3px` | :root |
| `--rad-2` | `6px` | :root |
| `--rad-3` | `10px` | :root |
| `--rad-box` | `8px` | :root |
| `--rad-pill` | `999px` | :root |
| `--rad-round` | `50%` | :root |
| `--radius` | `6px` | :root |
| `--rail-w` | `88px` | :root |
| `--raised` | `#1F272E` | :root |
| `--rc` | — | component |
| `--rc-a` | — | component |
| `--reach` | — | fallback only |
| `--realm-c` | — | component |
| `--rec-x` | — | component |
| `--rg` | — | component |
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
| `--sl-unknown` | `#94A3B3` | :root |
| `--slotcols` | — | fallback only |
| `--smg` | `#FFD23F` | :root |
| `--stage-h` | — | fallback only |
| `--staged` | `#D8F24A` | :root |
| `--stc` | — | component |
| `--stem` | — | component |
| `--step-bg` | — | component |
| `--step-c` | — | component |
| `--step-r` | — | component |
| `--sunk` | `#0B0F12` | :root |
| `--sv` | — | fallback only |
| `--svh` | — | component |
| `--sw` | — | fallback only |
| `--swg` | — | component |
| `--swr` | — | component |
| `--sww` | — | fallback only |
| `--sx` | `50%` | :root |
| `--sy` | `50%` | :root |
| `--t` | — | fallback only |
| `--t-att-code` | — | fallback only |
| `--t-base` | `13px` | :root |
| `--t-code-warn` | — | fallback only |
| `--t-display` | `44px` | :root |
| `--t-epic` | `#C0A3D4` | :root |
| `--t-epic-edge` | `rgba(142,107,166,.4)` | :root |
| `--t-epic-wash` | `rgba(142,107,166,.18)` | :root |
| `--t-figure` | `34px` | :root |
| `--t-h1` | `22px` | :root |
| `--t-hero` | `26px` | :root |
| `--t-img-x` | — | fallback only |
| `--t-lg` | `17px` | :root |
| `--t-md` | `14px` | :root |
| `--t-micro` | `9px` | :root |
| `--t-mythic` | `#E254DE` | :root |
| `--t-mythic-edge` | `rgba(226,84,222,.35)` | :root |
| `--t-mythic-wash` | `rgba(226,84,222,.15)` | :root |
| `--t-n-w` | — | fallback only |
| `--t-pl` | — | fallback only |
| `--t-pr` | — | fallback only |
| `--t-rail` | — | fallback only |
| `--t-sm` | `12px` | :root |
| `--t-w-att` | — | fallback only |
| `--t-warn-img` | — | fallback only |
| `--t-xl` | `19px` | :root |
| `--t-xs` | `11px` | :root |
| `--tap` | `44px` | :root |
| `--tc` | — | component |
| `--th-in` | — | fallback only |
| `--tier-best` | `#F2C230` | :root |
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
| `--tx` | — | fallback only |
| `--tx1` | `14%` | :root |
| `--tx2` | `68%` | :root |
| `--tx3` | `44%` | :root |
| `--ty1` | `38%` | :root |
| `--ty2` | `64%` | :root |
| `--ty3` | `12%` | :root |
| `--ui` | `"Space Grotesk",-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif` | :root |
| `--v-code` | — | fallback only |
| `--v-group` | — | fallback only |
| `--v-head-h` | — | fallback only |
| `--v-head-row` | — | fallback only |
| `--v-row-h` | — | fallback only |
| `--v2-accent` | — | fallback only |
| `--warn` | `#FF7A45` | :root |
| `--warn-ink` | `#FF9E72` | :root |
| `--win-06` | `rgba(31,138,94,.06)` | :root |
| `--win-10` | `rgba(31,138,94,.10)` | :root |
| `--win-12` | `rgba(31,138,94,.12)` | :root |
| `--win-18` | `rgba(31,138,94,.18)` | :root |
| `--win-20` | `rgba(31,138,94,.20)` | :root |
| `--win-45` | `rgba(31,138,94,.45)` | :root |
| `--xf-dur` | — | component |
| `--xf-ease` | — | component |
| `--xf-fh` | — | fallback only |
| `--xf-fr` | — | fallback only |
| `--xf-nl` | — | fallback only |
| `--xf-ns` | — | fallback only |
| `--xf-nt` | — | fallback only |
| `--xf-nw` | — | fallback only |
| `--xf-pb` | — | fallback only |
| `--xf-pt` | — | fallback only |
| `--xf-rest` | — | fallback only |
| `--xf-ts` | — | fallback only |
| `--xf-tx` | — | fallback only |
| `--xf-ty` | — | fallback only |
| `--xtop` | — | fallback only |
| `--z` | — | fallback only |
