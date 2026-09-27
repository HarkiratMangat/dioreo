---
kind: reference
status: live
---

# Board 4: Collective — the custom properties the portal does not have

*Generated 2026-09-27T06:47:50.131Z by `maps.cjs` from `local/pins2-board-3/redo/` at kit commit `ae52c02`. 138 of the 221 custom properties this folder's spec reads are defined nowhere in the portal (`portal/ui/tokens.css`, `app.css`, `v2card.css`). A declaration that reads one ports as `var()` of nothing — silently. Session 4 maps each onto a portal token or defines it.*

| Token | Defined in the kit | The definition |
|---|---|---|
| `--atbg` | `b3/board.css:414` | `--atbg:color-mix(in srgb,var(--sl) 17%,var(--sunk));--atring:color-mix(in srgb,var(--sl) 44%,transparent);` |
| `--atink` | `b3/board.css:415` | `--atring-hi:color-mix(in srgb,var(--sl) 66%,transparent);--atink:var(--ink)}` |
| `--atlit` | `b3/board.css:421` | `--atlit:inset 3px 0 0 var(--sl);--atink:var(--ink)}` |
| `--atring` | `b3/board.css:414` | `--atbg:color-mix(in srgb,var(--sl) 17%,var(--sunk));--atring:color-mix(in srgb,var(--sl) 44%,transparent);` |
| `--atts-l` | `b3/board.css:996` | `--atts-l:0px;--atts-r:34px;` |
| `--atts-r` | `b3/board.css:996` | `--atts-l:0px;--atts-r:34px;` |
| `--atw` | `b3/board.css:418` | `--atring-hi:color-mix(in srgb,var(--sl) 60%,transparent);--atink:color-mix(in srgb,var(--sl) 82%,white);--atw:600}` |
| `--b3-amb` | `b3/board.css:1890` | `.b3-bdg[data-k=meta]{--lit:.06;--b3-amb:1.6;--b3-glow:1.7;overflow:hidden}` |
| `--b3-check` | `b3/board.css:710` | `:root{--b3-check:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpolyline points='2.4 6.3 5 8.9 9` |
| `--b3-d1` | `b3/board.css:18` | `--b3-d1:.15s; --b3-d2:.22s; --b3-d3:.3s;` |
| `--b3-d2` | `b3/board.css:18` | `--b3-d1:.15s; --b3-d2:.22s; --b3-d3:.3s;` |
| `--b3-d3` | `b3/board.css:18` | `--b3-d1:.15s; --b3-d2:.22s; --b3-d3:.3s;` |
| `--b3-edge` | `b3/board.css:4074` | `.b3-tk{--b3-edge:var(--rule2);box-shadow:none}` |
| `--b3-fill` | `b4/classes.css:242` | `.b4 .b3-btn2.go.dang{--b3-fill:var(--del);color:var(--on-ok);background:var(--b3-fill);box-shadow:none}` |
| `--b3-foldw` | `b3/board.css:2216` | `.b3-wh,.b3-wr-main{--b3-foldw:98px}` |
| `--b3-hatch` | `b3/board.css:57` | `:root{--b3-hatch:repeating-linear-gradient(-45deg,var(--warn) 0 2.5px,transparent 2.5px 5px);--b3-lift:0 24px 48px -16px var(--scrim-80)}` |
| `--b3-reveal` | `gates.css:301` | `:root { --b3-reveal: 260ms; --b3-reveal-ease: cubic-bezier(.22, .61, .36, 1) }` |
| `--b3-reveal-ease` | `gates.css:301` | `:root { --b3-reveal: 260ms; --b3-reveal-ease: cubic-bezier(.22, .61, .36, 1) }` |
| `--b3-ring` | `b3/board.css:12` | `--b3-ring:inset 0 0 0 1px var(--rule2);` |
| `--b3-tr` | `b3/board.css:16` | `--b3-tr-wide:.14em; --b3-tr:.11em; --b3-tr-tight:.06em;` |
| `--b3-tr-tight` | `b3/board.css:16` | `--b3-tr-wide:.14em; --b3-tr:.11em; --b3-tr-tight:.06em;` |
| `--b3-tr-wide` | `b3/board.css:16` | `--b3-tr-wide:.14em; --b3-tr:.11em; --b3-tr-tight:.06em;` |
| `--b3-under` | `b3/board.css:4143` | `.b3-btn2.stage{--b3-fill:var(--staged);--b3-under:var(--sunk);color:var(--ink);` |
| `--cc-edge` | `b3/board.css:3668` | `.g-fact.b3-cc{--cc-edge:var(--rule2);border:0;padding-left:10px;padding-right:10px;box-shadow:inset 0 0 0 1px var(--cc-edge),inset 0 0 0 2px` |
| `--clear` | `b4/classes.css:88` | `.b4 .b4-ghostwrap{position:relative;--band:38px;--clear:linear-gradient(180deg,#000 calc(50% - var(--band) - 24px),transparent calc(50% - va` |
| `--code-js` | — not found | `` |
| `--dlen` | `b3/board.css:293` | `.b3-x:hover .ic,.b3-x:focus-visible .ic,.dw-h .x:hover .ic,.b3-pc-x:hover .ic{animation:b3draw .3s cubic-bezier(.16,1,.3,1) both;--dlen:34}` |
| `--f-bg` | `b4/form.css:44` | `.b4 .f-fld{--f-bg:color-mix(in srgb,#04070A 52%,var(--sunk));--f-edge:color-mix(in srgb,var(--ink) 12%,transparent);` |
| `--f-ch` | `b4/form.js:410` | `<section class=${'f-card' + (multi && i === ci ? ' on' : '')} key=${c.id} data-arm=${c.f.mode} style=${`--f-ch:${hueOfCard(c)}`} onFocusIn=$` |
| `--f-edge` | `b4/classes.css:143` | `.b4 .f-fld:focus-within, .b4 .f-pick.open .f-fld{--f-edge:var(--patch)!important;box-shadow:inset 0 0 0 1px var(--patch),0 0 0 5px color-mix` |
| `--f-foot` | `b4/classes.css:502` | `.b4 .f-side.b3-fady{--f-foot:56px;display:flex;flex-direction:column;padding-bottom:var(--f-foot)}` |
| `--f-hue` | `b4/form.js:250` | `<div class="f-card-b" style=${`--f-hue:${hue}`}>` |
| `--f-lw` | `b4/classes.css:402` | `.b4 .f-card-b{--f-lw:96px;container:f-card / inline-size}` |
| `--f-sidew` | `b4.css:131` | `.b4 .drawer.wide:has(.b3-nb) { width:min(980px, 100vw - 40px); --f-sidew:333px }` |
| `--fb` | `b3/board.css:2362` | `@keyframes b3fadeB{0%,92%{--fb:var(--fdy,15px)}100%{--fb:0px}}` |
| `--fl` | — not found | `` |
| `--fld-rad` | `b4/form.css:43` | `.b4{--fld-rad:9px}` |
| `--fn-edge` | `b3/board.css:4619` | `:is(.b3-xf,.exs-i) .b3-xf-fid .b3-xf-fn:not(.editing){--fn-edge:color-mix(in srgb,var(--ok) 55%,transparent);border:0;padding-left:7px;paddi` |
| `--fo` | — not found | `` |
| `--fr` | — not found | `` |
| `--ft` | `b3/board.css:2361` | `@keyframes b3fadeT{0%{--ft:0px}8%,100%{--ft:var(--fdy,15px)}}` |
| `--fx-l` | `b3/board.css:4443` | `.b3-xt-chips[data-sx=start]{--fx-l:0px;--fx-r:28px}` |
| `--fx-r` | `b3/board.css:4443` | `.b3-xt-chips[data-sx=start]{--fx-l:0px;--fx-r:28px}` |
| `--gh-cat-range` | — not found | `` |
| `--gh-div-badge` | — not found | `` |
| `--gh-name-cat` | — not found | `` |
| `--gh-pl` | — not found | `` |
| `--gh-pr` | — not found | `` |
| `--gh-range-div` | — not found | `` |
| `--h1-cell` | — not found | `` |
| `--h1-chip` | — not found | `` |
| `--h1-col` | — not found | `` |
| `--h1-day` | — not found | `` |
| `--h1-head` | — not found | `` |
| `--h1-kind` | — not found | `` |
| `--h1-l` | — not found | `` |
| `--h1-lab` | — not found | `` |
| `--h1-labw` | — not found | `` |
| `--h1-r` | — not found | `` |
| `--h1-row` | — not found | `` |
| `--h1-rowh` | — not found | `` |
| `--h1-rowp` | — not found | `` |
| `--h1-srchh` | — not found | `` |
| `--h1-top` | — not found | `` |
| `--h1-undo` | — not found | `` |
| `--h1-who` | — not found | `` |
| `--hi-head` | `b3/board.css:5047` | `.panel.b3-hi{display:flex;flex-direction:column;overflow:hidden;--hi-head:32px}` |
| `--hi-l` | `b3/board.css:4885` | `.b3-hi{--hi-l:22px;--hi-r:16px}` |
| `--hi-r` | `b3/board.css:4885` | `.b3-hi{--hi-l:22px;--hi-r:16px}` |
| `--lab-bg` | `b3/board.css:497` | `--lab-bg:color-mix(in srgb,var(--sl) 30%,#080C0F);--lab-ink:color-mix(in srgb,var(--sl) 94%,white);` |
| `--lab-div` | `b3/board.css:489` | `/* \u26a0\ufe0f THE HAIRLINE IS GONE, AND IT IS GONE BECAUSE IT NEVER DREW. `--lab-div:1px solid color-mix(\u2026)` fed into` |
| `--lab-fam` | `b3/board.css:487` | `html[data-b3-p2lab=key],.b3-lab[data-lab=key]{--lab-sep:"";--lab-w:700;--lab-size:var(--t-micro);--lab-fam:var(--data);` |
| `--lab-gap` | `b3/board.css:488` | `--lab-tt:uppercase;--lab-tr:var(--b3-tr);--lab-gap:1.1ch}` |
| `--lab-ink` | `b3/board.css:497` | `--lab-bg:color-mix(in srgb,var(--sl) 30%,#080C0F);--lab-ink:color-mix(in srgb,var(--sl) 94%,white);` |
| `--lab-ml` | `b3/board.css:495` | `--lab-tt:uppercase;--lab-tr:var(--b3-tr);--lab-gap:8px;--lab-pad:0 7px 0 11px;--lab-ml:-11px;` |
| `--lab-pad` | `b3/board.css:495` | `--lab-tt:uppercase;--lab-tr:var(--b3-tr);--lab-gap:8px;--lab-pad:0 7px 0 11px;--lab-ml:-11px;` |
| `--lab-rad` | `b3/board.css:496` | `--lab-rad:var(--rad-pill) 3px 3px var(--rad-pill);` |
| `--lab-ring` | `b3/board.css:498` | `--lab-ring:inset -1px 0 0 color-mix(in srgb,var(--sl) 46%,transparent)}` |
| `--lab-sep` | `b3/board.css:486` | `html[data-b3-p2lab=colon],.b3-lab[data-lab=colon]{--lab-sep:":";--lab-w:700}` |
| `--lab-size` | `b3/board.css:487` | `html[data-b3-p2lab=key],.b3-lab[data-lab=key]{--lab-sep:"";--lab-w:700;--lab-size:var(--t-micro);--lab-fam:var(--data);` |
| `--lab-tr` | `b3/board.css:488` | `--lab-tt:uppercase;--lab-tr:var(--b3-tr);--lab-gap:1.1ch}` |
| `--lab-tt` | `b3/board.css:488` | `--lab-tt:uppercase;--lab-tr:var(--b3-tr);--lab-gap:1.1ch}` |
| `--lab-w` | `b3/board.css:486` | `html[data-b3-p2lab=colon],.b3-lab[data-lab=colon]{--lab-sep:":";--lab-w:700}` |
| `--lc` | `b2.css:199` | `.pb-life{--lc:var(--ok);justify-self:start;display:inline-flex;align-items:center;gap:7px;height:28px;padding:0 11px 0 9px;border-radius:var` |
| `--lh-ic-n` | — not found | `` |
| `--lh-n-w` | — not found | `` |
| `--lh-pl` | — not found | `` |
| `--lh-pr` | — not found | `` |
| `--lh-vl-vt` | — not found | `` |
| `--lit` | `b3/board.css:1890` | `.b3-bdg[data-k=meta]{--lit:.06;--b3-amb:1.6;--b3-glow:1.7;overflow:hidden}` |
| `--m` | — not found | `` |
| `--m1` | `b4.css:34` | `html:is([data-b3-xbg=mesh],[data-b3-xbg=ground]) :is(.drawer:has(.b3-nb), .drawer.b1, .drawer .b4-ask){ --m1:#ff3b5c;--m2:#f6a93b;` |
| `--m2` | `b4.css:34` | `html:is([data-b3-xbg=mesh],[data-b3-xbg=ground]) :is(.drawer:has(.b3-nb), .drawer.b1, .drawer .b4-ask){ --m1:#ff3b5c;--m2:#f6a93b;` |
| `--m3` | — not found | `` |
| `--m4` | — not found | `` |
| `--mc` | `b4.css:166` | `.b4 .mh-mode button[data-arm="MP"] { --mc:#FF3B5C }` |
| `--mi` | `b3/armory-parts.js:503` | `modesOf(b).forEach((m, i) => groups.push(html`<span class="b3-bdg" data-k="mode" data-m=${m} key=${`md-${m}`} style=${`--mi:${i}`} aria-labe` |
| `--mk` | `b4/classes.css:596` | `[data-k=capable]{--mk:#5B9BFF}[data-k=ass]:not(.b3-bdg){--mk:#C08A55}` |
| `--oc` | `b4/bulk.css:58` | `.b4 .bk-fl [data-o=new]{--oc:var(--ok)}.b4 .bk-fl [data-o=upd]{--oc:var(--focus)}.b4 .bk-fl :is([data-o=warn],[data-o=dup]){--oc:var(--warn)` |
| `--pb-inset` | `b3/board.css:4644` | `.g-card .pb-dates .pb-cacts{--pb-inset:0px}` |
| `--pcb` | `b4/classes.css:310` | `.b3-hc.t-warn{--pcbg:color-mix(in srgb,var(--warn) 12%,var(--desk));--pcb:color-mix(in srgb,var(--warn) 45%,var(--desk))}` |
| `--pcbg` | `b4/classes.css:310` | `.b3-hc.t-warn{--pcbg:color-mix(in srgb,var(--warn) 12%,var(--desk));--pcb:color-mix(in srgb,var(--warn) 45%,var(--desk))}` |
| `--ph` | `b3/armory-parts.js:507` | `return html`<span class=${'b3-bdgs' + (seen ? ' in' : '')} ref=${wrap} style=${`--ph:${ph}`}>${groups}</span>`;` |
| `--pk` | — not found | `` |
| `--r-att-code` | — not found | `` |
| `--r-code-warn` | — not found | `` |
| `--r-n-att` | — not found | `` |
| `--r-pl` | — not found | `` |
| `--r-pr` | — not found | `` |
| `--r-tag` | — not found | `` |
| `--r-warn-img` | — not found | `` |
| `--rc-a` | `b3/board.css:4255` | `--rc-a:var(--rc,var(--r-armory));` |
| `--reach` | `b3/armory-parts.js:400` | `style=${pinToViewport && fix ? `--tx:${tx}px;--reach:${((box && box.w) \|\| 368) - tx - 24}px;left:${fix.left}px;${fix.above ? 'bottom' : 'top` |
| `--sl` | `b2.css:325` | `.pb-rail > span{--sl:var(--ink4);height:24px;padding:0 8px;border-radius:5px;background:color-mix(in srgb,var(--sl) 9%,var(--sunk));box-shad` |
| `--sl-` | — not found | `` |
| `--sl-ba` | — not found | `` |
| `--sl-sto` | — not found | `` |
| `--sl-unkn` | — not found | `` |
| `--sl-unknow` | — not found | `` |
| `--sl-unknown` | `b3/board.css:3362` | `:root{--sl-unknown:#94A3B3}` |
| `--stage-h` | — not found | `` |
| `--sv` | — not found | `` |
| `--sv-caution` | `b3/board.css:2338` | `:root{--sv-error:#FF5A4F;--sv-warn:#FF8A3D;--sv-caution:#F0B447;--sv-info:#85939F}` |
| `--sv-error` | `b3/board.css:2338` | `:root{--sv-error:#FF5A4F;--sv-warn:#FF8A3D;--sv-caution:#F0B447;--sv-info:#85939F}` |
| `--sv-info` | `b3/board.css:2338` | `:root{--sv-error:#FF5A4F;--sv-warn:#FF8A3D;--sv-caution:#F0B447;--sv-info:#85939F}` |
| `--sx` | — not found | `` |
| `--sy` | — not found | `` |
| `--tx` | `b3/armory-parts.js:75` | `style=${geo ? `left:${geo.left}px;top:${geo.top}px;--tx:${geo.tx}px` : 'visibility:hidden;left:0;top:0'}>` |
| `--v-code` | — not found | `` |
| `--v-group` | — not found | `` |
| `--v-head-h` | — not found | `` |
| `--v-head-row` | — not found | `` |
| `--v-row-h` | — not found | `` |
| `--v-tag` | — not found | `` |
| `--xf-dur` | `b3/board.css:3830` | `.b3-xt-files{--xf-dur:420ms;--xf-ease:cubic-bezier(.32,.72,0,1)}` |
| `--xf-ease` | `b3/board.css:3830` | `.b3-xt-files{--xf-dur:420ms;--xf-ease:cubic-bezier(.32,.72,0,1)}` |
| `--xf-fh` | — not found | `` |
| `--xf-nw` | — not found | `` |
