---
kind: reference
status: live
---

# Board 4: Collective resolved values · Tokens as resolved on `:root`

*Part of the generated spec; read `README.md` in this folder first.*

## Tokens as resolved on `:root`

Every custom property the kit's four stylesheets read. **Scope** says where it is set: `:root` means a global token; `component` means a rule sets it on an element (read its value in that element's table); `JS` means only `b3/state.js` stamps it at runtime, so it does not exist in any stylesheet and must become a real token or a literal when ported.

| token | value on :root | scope |
|---|---|---|
| `--a` | — | fallback only |
| `--atbg` | — | component |
| `--atink` | — | component |
| `--atlit` | — | component |
| `--atlit-hi` | — | component |
| `--atring` | — | component |
| `--atring-hi` | — | component |
| `--atts-l` | `0px` | :root |
| `--atts-r` | `34px` | :root |
| `--atw` | — | component |
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
| `--b3-reveal` | `260ms` | :root |
| `--b3-reveal-ease` | `cubic-bezier(.22, .61, .36, 1)` | :root |
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
| `--bc` | — | component |
| `--box-inset` | `5px` | :root |
| `--c` | — | component |
| `--ci` | — | fallback only |
| `--ci-bg` | — | component |
| `--code-js` | — | fallback only |
| `--code-w` | — | component |
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
| `--dlen` | — | component |
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
| `--f` | — | fallback only |
| `--fb` | `0px` | :root |
| `--fc` | — | component |
| `--fdy` | — | component |
| `--fill` | — | component |
| `--fl` | — | fallback only |
| `--fo` | — | fallback only |
| `--focus` | `#5FD4E8` | :root |
| `--focus-07` | `rgba(95,212,232,.07)` | :root |
| `--focus-13` | `rgba(95,212,232,.13)` | :root |
| `--fr` | — | fallback only |
| `--from` | — | fallback only |
| `--ft` | `0px` | :root |
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
| `--h1-cell` | `22px` | JS · `b3/state.js` stamp() |
| `--h1-chip` | `6px` | JS · `b3/state.js` stamp() |
| `--h1-col` | `36px` | JS · `b3/state.js` stamp() |
| `--h1-day` | `52px` | JS · `b3/state.js` stamp() |
| `--h1-head` | `16px` | JS · `b3/state.js` stamp() |
| `--h1-kind` | `110px` | JS · `b3/state.js` stamp() |
| `--h1-l` | `22px` | JS · `b3/state.js` stamp() |
| `--h1-lab` | `16px` | JS · `b3/state.js` stamp() |
| `--h1-labw` | `56px` | JS · `b3/state.js` stamp() |
| `--h1-r` | `22px` | JS · `b3/state.js` stamp() |
| `--h1-row` | `10px` | JS · `b3/state.js` stamp() |
| `--h1-rowh` | `44px` | JS · `b3/state.js` stamp() |
| `--h1-rowp` | `11px` | JS · `b3/state.js` stamp() |
| `--h1-srchh` | `44px` | JS · `b3/state.js` stamp() |
| `--h1-srchw` | `340px` | JS · `b3/state.js` stamp() |
| `--h1-top` | `16px` | JS · `b3/state.js` stamp() |
| `--h1-undo` | `90px` | JS · `b3/state.js` stamp() |
| `--h1-who` | `100px` | JS · `b3/state.js` stamp() |
| `--hdr-h` | `52px` | :root |
| `--hi` | `#232C34` | :root |
| `--hi-gut` | — | component |
| `--hi-head` | — | component |
| `--hi-l` | — | component |
| `--hi-r` | — | component |
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
| `--kg` | — | component |
| `--lab-bg` | — | component |
| `--lab-div` | — | component |
| `--lab-fam` | `"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace` | :root |
| `--lab-gap` | `1.1ch` | :root |
| `--lab-ink` | — | component |
| `--lab-ml` | — | component |
| `--lab-order` | — | component |
| `--lab-pad` | — | component |
| `--lab-rad` | — | component |
| `--lab-ring` | — | component |
| `--lab-sep` | `""` | :root |
| `--lab-size` | `9.5px` | :root |
| `--lab-tr` | `.11em` | :root |
| `--lab-tt` | `uppercase` | :root |
| `--lab-w` | `700` | :root |
| `--lc` | — | component |
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
| `--m` | — | fallback only |
| `--m1` | — | component |
| `--m2` | — | component |
| `--m3` | — | fallback only |
| `--m4` | — | fallback only |
| `--marks-w` | — | component |
| `--mk` | — | component |
| `--mode-dmz` | `#3DA5F5` | :root |
| `--mode-mp` | `#FF3430` | :root |
| `--mono` | `"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace` | :root |
| `--n` | — | fallback only |
| `--nw` | — | component |
| `--o` | — | component |
| `--ok` | `#7BDB63` | :root |
| `--on-accent` | `#07090A` | :root |
| `--on-ok` | `#07130A` | :root |
| `--on-staged` | `#1A2000` | :root |
| `--overlay-62` | `rgba(6,9,11,.62)` | :root |
| `--overlay-66` | `rgba(6,9,11,.66)` | :root |
| `--ow-c-min` | `88px` | :root |
| `--ow-pill-min` | `126px` | :root |
| `--p` | — | fallback only |
| `--paper` | `#171E24` | :root |
| `--patch` | `#F2C230` | :root |
| `--pb-inset` | `5px` | :root |
| `--pcb` | — | component |
| `--pcbg` | — | component |
| `--ph` | — | fallback only |
| `--pk` | — | fallback only |
| `--plot-l` | `138px` | :root |
| `--pn` | `#F2C230` | :root |
| `--press` | `1px` | :root |
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
| `--stem` | — | component |
| `--sunk` | `#0B0F12` | :root |
| `--sv` | — | fallback only |
| `--sw` | — | fallback only |
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
| `--t-lg` | `16.5px` | :root |
| `--t-md` | `14.5px` | :root |
| `--t-micro` | `9.5px` | :root |
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
| `--t-xs` | `10.5px` | :root |
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
| `--v-tag` | — | fallback only |
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
