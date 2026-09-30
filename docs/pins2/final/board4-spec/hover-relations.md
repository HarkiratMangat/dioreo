---
kind: reference
status: live
---

# Board 4: Collective — hover relations

*Generated 2026-09-30T04:06:57.063Z by `hover-relations.cjs` from the kit's stylesheets. 191 rules in which one element's hover, focus or press restyles another element — the relations the value files cannot show, because they force states on each element alone. A port that copies only per-element values loses every one of these. JS-driven hovers (Compare's lighting, the badge pop) are in HANDOFF.md and measured with a real mouse in relations.cjs.*

## `app.css` — 60

| Line | Selector | Declarations |
|---|---|---|
| 780 | `.bar:hover .gr` | opacity:1;background:var(--inset-35) |
| 1145 | `.wg-fwrap:hover .wg-fpop` | display:block |
| 1145 | `.wg-fwrap:focus-within .wg-fpop` | display:block |
| 1168 | `.wg-r:hover .wg-ix` | color:var(--c) |
| 1178 | `.wg-r:hover .wg-at[style]` | box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--sl) 48%,transparent),inset 0 1px 0 color-mix(in srgb,var(--sl) 20%,transparent) |
| 1191 | `.wg-code:hover .wg-ig` | box-shadow:inset 0 0 0 1px var(--ink4) |
| 1192 | `.wg-code:hover .wg-igb` | background:var(--hi);color:var(--ink) |
| 1267 | `th.sortable .sortbtn:hover .sortic` | color:var(--ink2) |
| 1275 | `tbody tr:hover td` | background:#1A222A |
| 1493 | `.bar:hover .gr` | opacity:1 |
| 1493 | `.bar:focus-visible .gr` | opacity:1 |
| 1949 | `.bcol-h:hover .chev` | border-left-color:var(--ink2) |
| 2391 | `.umenu .mi:hover svg` | opacity:1 |
| 2987 | `.mx tbody tr:hover td` | background:var(--hi) |
| 3006 | `.mxcell:hover i` | border-color:var(--ink3);transform:scale(1.08) |
| 3008 | `.mxcell:focus-visible i` | outline:2px solid var(--focus);outline-offset:3px |
| 3023 | `.mxcell[role=img]:hover i` | transform:none;border-color:var(--rule2) |
| 3036 | `.mi-out:hover .mnote` | color:var(--ink2) |
| 3204 | `.ub:hover .ubt i` | filter:brightness(1.15) |
| 3447 | `.evrow:hover .evgo` | color:var(--focus) |
| 3460 | `.mx tbody tr:hover .mxrow` | opacity:1 |
| 3490 | `.rvopwrap:hover .rvdrop` | opacity:1 |
| 4063 | `.mx tbody.grp tr.prow:hover .pname b` | color:var(--ink) |
| 4064 | `.mx tbody.grp tr.prow:hover .pname i` | box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 28%,transparent) |
| 4067 | `.mx tbody.grp tr.prow:hover td.mxc-name` | border-left-color:var(--c) |
| 4074 | `.mx tbody.grp:has(.gh td:hover) .pname b` | color:var(--ink) |
| 4075 | `.mx tbody.grp:has(.gh td:hover) .pname i` | box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 28%,transparent) |
| 4076 | `.mx tbody.grp:has(.gh td:hover) td.mxc-name` | border-left-color:var(--c) |
| 4077 | `.mx tbody.grp:has(.gh td:hover) .gh td:first-child` | border-left-color:var(--ink3) |
| 4279 | `.scope:hover .nm i` | box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 28%,transparent) |
| 4613 | `.lnh:hover .pm` | opacity:1;color:var(--ink2) |
| 4621 | `.lnh:hover .lnh-n` | color:var(--ink3) |
| 4710 | `.cmdbar:focus-within .cb-mag` | border-color:var(--patch);background:var(--patch) |
| 4710 | `.cmdbar:focus-within .cb-mag::after` | border-color:var(--patch);background:var(--patch) |
| 4711 | `.cmdbar:focus-within .cb-mag` | background:none |
| 4719 | `.cmdbar:focus-within kbd` | opacity:0 |
| 4748 | `.whobtn:hover .cv::before` | border-color:var(--ink2) |
| 5359 | `.mx tbody tr:hover .mxcell:not([role=img]) i` | border-color:var(--ink4) |
| 5497 | `.atr:hover .atx` | color:var(--ink3);border-color:var(--rule2) |
| 5514 | `.trow-h:hover .trow-t` | color:var(--ink) |
| 5620 | `.realm:hover svg` | color:var(--c,var(--patch)) |
| 5723 | `a.att-row:hover .att-go` | color:var(--ink2) |
| 5725 | `a.att-row:hover .att-go .arw` | transform:translateX(3px) |
| 6062 | `.flag:hover ~ * .bar.flagged` | outline-color:var(--warn) |
| 6480 | `.lnh:hover .ic-fold path` | d:path("M6 10.5 L12 13.5 L18 10.5") |
| 6480 | `.trow:hover .ic-fold path` | d:path("M6 10.5 L12 13.5 L18 10.5") |
| 6481 | `.lnh:hover .ic-fold.open path` | d:path("M6 13.5 L12 10.5 L18 13.5") |
| 6481 | `.trow:hover .ic-fold.open path` | d:path("M6 13.5 L12 10.5 L18 13.5") |
| 6484 | `.lnh:hover .ic-fold path` | d:path("M6 9 L12 15 L18 9") |
| 6484 | `.trow:hover .ic-fold path` | d:path("M6 9 L12 15 L18 9") |
| 6484 | `.lnh:hover .ic-fold.open path` | d:path("M6 9 L12 15 L18 9") |
| 6484 | `.trow:hover .ic-fold.open path` | d:path("M6 9 L12 15 L18 9") |
| 6486 | `.lnh:hover .ic-fold.open path` | d:path("M6 15 L12 9 L18 15") |
| 6486 | `.trow:hover .ic-fold.open path` | d:path("M6 15 L12 9 L18 15") |
| 6860 | `.dwfield:focus-within .bf-hint` | position:static;width:auto;height:auto;overflow:visible;clip:auto; white-space:normal;display:block;background:var(--hi);border-left:2px solid var(--patch); border-radius:0 var(--r |
| 7296 | `.brow:hover .brow-cp` | color:var(--ink2) |
| 7302 | `.brow:hover .brow-e` | color:var(--ink);border:1px solid var(--rule2);border-radius:var(--rad-1);padding:2px 6px |
| 7302 | `.brow:focus-visible .brow-e` | color:var(--ink);border:1px solid var(--rule2);border-radius:var(--rad-1);padding:2px 6px |
| 7303 | `.brow:hover .brow-e b` | display:inline |
| 7303 | `.brow:focus-visible .brow-e b` | display:inline |

## `gates.css` — 8

| Line | Selector | Declarations |
|---|---|---|
| 290 | `html[data-b3-a1=fixed] .wg-code:hover .wg-igb` | background: var(--raised); color: var(--ink2); box-shadow: none |
| 291 | `html[data-b3-a1=fixed] .wg-code:focus-visible .wg-igb` | background: color-mix(in srgb, var(--c) 16%, var(--raised)); color: color-mix(in srgb, var(--c) 72%, white); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 50%, transparen |
| 327 | `html[data-b3-a1=fixed] .wg-code:hover .wg-ig` | box-shadow: none |
| 328 | `html[data-b3-a1=fixed] .wg-code:hover .wg-ig::after` | box-shadow: var(--b3-ring) |
| 817 | `.dw-h .dw-nav .x:hover > b` | max-width:3.4em;opacity:1;transform:none |
| 817 | `.dw-h .dw-nav .x:focus-visible > b` | max-width:3.4em;opacity:1;transform:none |
| 963 | `.b3-xt-w:hover .b3-xt-wn b` | color:color-mix(in srgb,var(--c) 40%,white) |
| 963 | `.b3-xt-wn:focus-visible b` | color:color-mix(in srgb,var(--c) 40%,white) |

## `b4.css` — 4

| Line | Selector | Declarations |
|---|---|---|
| 79 | `.app[data-realm="broadcast"] .mtable tbody tr:hover td` | background:transparent |
| 237 | `.drawer) .seg:has(> button[aria-pressed="true"]:hover) > .pb-thumb` | background:color-mix(in srgb,var(--realm-c,var(--ink3)) 21%,var(--raised)) !important |
| 541 | `.b4 .drawer.b1 .pb-sw:hover .pb-swt` | box-shadow:inset 0 0 0 1px var(--ink4) |
| 542 | `.b4 .drawer.b1 .pb-sw[aria-checked=true]:hover .pb-swt` | background:color-mix(in srgb,var(--r-broadcast) 82%,#fff) |

## `b2.css` — 21

| Line | Selector | Declarations |
|---|---|---|
| 113 | `.pb-gh:hover .pb-chev` | color:var(--ink) |
| 315 | `.pb-rb:hover .pb-ix` | color:var(--c) |
| 340 | `.pb-well:hover .pb-wi` | background:var(--hi);color:var(--ink);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ink) 20%,transparent) |
| 341 | `.pb-well:hover .pb-wi .ic` | color:var(--ink) |
| 343 | `.pb-well:focus-visible .pb-wi` | outline:2px solid var(--patch);outline-offset:2px |
| 373 | `.pb-enc:hover .pb-exp` | color:var(--ink) |
| 397 | `.pb-gh:hover .pb-fbtn` | color:var(--ink) |
| 403 | `.pb-fwrap:hover .pb-fpop` | display:grid |
| 403 | `.pb-fwrap:focus-within .pb-fpop` | display:grid |
| 408 | `.pb-man:has(.pb-fwrap:hover)` | overflow:visible |
| 413 | `.pb-well:hover .pb-wi` | background:var(--hi);box-shadow:none |
| 440 | `.pb-man:has(.pb-flag:hover)` | overflow:visible |
| 445 | `.pb-well:hover .pb-cs` | box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ink) 26%,transparent) |
| 446 | `.pb-well:hover .pb-cc` | background:var(--hi);color:var(--ink) |
| 496 | `.pb-field:hover .pb-fi` | box-shadow:inset 0 1px 3px rgba(0,0,0,.55),inset 0 0 0 1px color-mix(in srgb,var(--ink) 26%,transparent) |
| 497 | `.pb-field:hover .pb-fi > .ic` | color:var(--ink) |
| 531 | `.pb-igw:hover .pb-ig` | box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ink) 22%,transparent) |
| 532 | `.pb-igw:hover .pb-igb` | background:var(--hi);color:var(--ink);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ink) 22%,transparent) |
| 535 | `.pb-igw:focus-visible .pb-ig` | outline:2px solid var(--patch);outline-offset:2px |
| 566 | `.pb-rb:hover .pb-rail > .pb-at` | box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ink) 16%,transparent),inset 0 1px 0 color-mix(in srgb,var(--ink) 8%,transparent) |
| 587 | `#g4man .pb-rb:hover .pb-rail > .pb-at[style]` | box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--sl) 48%,transparent),inset 0 1px 0 color-mix(in srgb,var(--sl) 20%,transparent) |

## `b3/board.css` — 69

| Line | Selector | Declarations |
|---|---|---|
| 87 | `.b3-hint:hover .b3-hint-card` | opacity:1;visibility:visible;transform:translate(-50%,0);transition-delay:.4s,.4s,0s |
| 88 | `.b3-hint[data-side=top-start]:hover .b3-hint-card` | transform:none |
| 89 | `.b3-hint:has(:focus-visible) .b3-hint-card` | opacity:1;visibility:visible;transform:translate(-50%,0);transition-delay:0s |
| 90 | `.b3-hint[data-side=top-start]:has(:focus-visible) .b3-hint-card` | transform:none |
| 284 | `html[data-b3-p4=a] .wg-cb:hover .cb::after` | clip-path:inset(0 0 0 0) |
| 284 | `html[data-b3-p4=b] .wg-cb:hover .cb::after` | clip-path:inset(0 0 0 0) |
| 293 | `.b3-x:hover .ic` | animation:b3draw .3s cubic-bezier(.16,1,.3,1) both;--dlen:34 |
| 293 | `.b3-x:focus-visible .ic` | animation:b3draw .3s cubic-bezier(.16,1,.3,1) both;--dlen:34 |
| 293 | `.dw-h .x:hover .ic` | animation:b3draw .3s cubic-bezier(.16,1,.3,1) both;--dlen:34 |
| 293 | `.b3-pc-x:hover .ic` | animation:b3draw .3s cubic-bezier(.16,1,.3,1) both;--dlen:34 |
| 382 | `.g-lg label:hover i` | box-shadow:0 0 0 2px color-mix(in srgb,var(--sl) 40%,transparent) |
| 382 | `.g-lg label:focus-within i` | box-shadow:0 0 0 2px color-mix(in srgb,var(--sl) 40%,transparent) |
| 410 | `html[data-b3-p2sty] .wg-r:hover .wg-at[style]` | box-shadow:inset 0 0 0 1px var(--atring-hi,var(--atring)),var(--atlit-hi,var(--atlit,0 0 #0000)) |
| 714 | `html[data-b3-p4=a] .wg-cb:hover .cb` | background:var(--hi);box-shadow:inset 0 0 0 1.5px var(--ink2) |
| 718 | `html[data-b3-p4=a] .wg-cb:hover .cb:not(.on)::after` | background:color-mix(in srgb,var(--patch) 38%,transparent) |
| 728 | `html[data-b3-p4=b] .wg-cb:hover .cb:not(.on)::after` | background:color-mix(in srgb,var(--patch) 40%,transparent) |
| 729 | `html[data-b3-p4=b] .wg-cb:hover .cb` | box-shadow:inset 0 1px 2px rgba(0,0,0,.55),inset 0 0 0 1px color-mix(in srgb,var(--patch) 45%,transparent) |
| 735 | `html[data-b3-p4=a] .wg-cb:focus-visible .cb` | box-shadow:0 0 0 2px var(--raised),0 0 0 4px var(--focus) |
| 735 | `html[data-b3-p4=b] .wg-cb:focus-visible .cb` | box-shadow:0 0 0 2px var(--raised),0 0 0 4px var(--focus) |
| 1020 | `.b3-sd-code.as-btn:hover .ic` | color:var(--ink2) |
| 1024 | `.b3-sd-code.as-btn.ticked:hover .ic` | color:var(--ok) |
| 1409 | `.b3-cmdbar:focus-within .b3-cmdmag` | color:var(--patch) |
| 1486 | `.b3-never:hover b` | background:color-mix(in srgb,var(--warn) 24%,transparent) |
| 2188 | `.b3-wr:hover .b3-wr-chev` | color:var(--ink);background:var(--hi);box-shadow:inset 0 0 0 1px var(--ink4) |
| 2204 | `.b3-wr:hover .b3-fold2` | color:var(--ink);background:var(--hi);box-shadow:inset 0 0 0 1px var(--ink4);gap:7px |
| 2205 | `.b3-wr:hover .b3-fold2 b` | max-width:6em;opacity:1 |
| 2205 | `.b3-wr-main:focus-visible .b3-fold2 b` | max-width:6em;opacity:1 |
| 2257 | `html[data-b3-p4=b] .wg-cb:hover .cb.on` | background:color-mix(in srgb,var(--patch) 24%,var(--desk)); box-shadow:inset 0 1px 2px rgba(0,0,0,.55),inset 0 0 0 1px color-mix(in srgb,var(--patch) 70%,transparent) |
| 2260 | `html[data-b3-p4=b] .wg-cb:hover .cb.on::after` | background:color-mix(in srgb,var(--patch) 82%,transparent) |
| 3011 | `.b3-xt-all:hover .b3-xt-w8` | max-width:7em;opacity:1;margin-left:10px |
| 3011 | `.b3-xt-all:focus-visible .b3-xt-w8` | max-width:7em;opacity:1;margin-left:10px |
| 3038 | `.b3-xt-wn:hover b` | color:color-mix(in srgb,var(--c) 40%,white) |
| 3039 | `.b3-xt-w:has(.b3-xt-wn:hover) .b3-xt-c:not([aria-pressed=true])` | box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 60%,transparent);background:color-mix(in srgb,var(--c) 10%,var(--sunk)) |
| 3104 | `.b3-xt-bin:hover .b3-xt-rm` | opacity:1 |
| 3287 | `html[data-b3-p4] .wg-cb[aria-checked=mixed]:hover .cb:not(.on)::after` | background:var(--on-accent);clip-path:inset(0 0 0 0) |
| 3307 | `.chip.topic:hover i` | box-shadow:0 0 0 2px color-mix(in srgb,var(--c) 35%,transparent) |
| 3431 | `.b3-sd-tr):hover .wg-at[style]` | box-shadow:inset 0 0 0 1px var(--atring-hi,var(--atring)),var(--atlit-hi,var(--atlit,0 0 #0000)) |
| 3700 | `.exs-i) .b3-xf-fn:hover .ic` | opacity:1 |
| 3700 | `.exs-i) .b3-xf-fn:focus-within .ic` | opacity:1 |
| 3719 | `.b3-xt-w:hover:not(:has(.b3-xt-c:hover)) .b3-xt-c:not([aria-pressed=true])` | box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 60%,transparent);background:color-mix(in srgb,var(--c) 10%,var(--sunk)) |
| 3751 | `.b3-xf-h.can-fold:hover > .b3-xf-fold b` | opacity:1 |
| 3751 | `.b3-xf-h > .b3-xf-fold:focus-visible b` | opacity:1 |
| 3752 | `.b3-xf-h.can-fold:hover > .b3-xf-fold` | color:var(--ink) |
| 3794 | `.exs-i) .b3-xf-fn:not(.editing):hover .ic` | color:var(--ink2) |
| 3910 | `.b3-xr-wn:hover b` | color:color-mix(in srgb,var(--c) 40%,white) |
| 3931 | `.b3-xr-r:hover:not(:has(.b3-xr-k:hover)) .b3-xr-k:not([aria-pressed=true])` | background:color-mix(in srgb,var(--c) 10%,var(--sunk));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 60%,transparent) |
| 3965 | `.b3-xi-r:hover .b3-xi-n` | color:color-mix(in srgb,var(--c) 38%,white) |
| 3983 | `.b3-xc-w:hover .b3-xc-n` | color:var(--ink) |
| 4007 | `.b3-xb-k:hover b` | color:var(--ink) |
| 4027 | `.b3-xg-t:hover .b3-xg-n b` | color:color-mix(in srgb,var(--c) 35%,white) |
| 4037 | `.b3-xg-t:hover:not(:has(.b3-xg-k:hover)) .b3-xg-k:not([aria-pressed=true])` | background:color-mix(in srgb,var(--c) 12%,var(--sunk)) |
| 4118 | `.b3-xt-c:hover b` | color:var(--ink) |
| 4179 | `html[data-b3-p4] .b3-xt-all:hover .wg-cb .cb::after` | clip-path:inset(0) |
| 4179 | `html[data-b3-p4] .b3-xt-all:focus-visible .wg-cb .cb::after` | clip-path:inset(0) |
| 4180 | `html[data-b3-p4=a] .b3-xt-all:hover .wg-cb .cb` | background:var(--hi);box-shadow:inset 0 0 0 1.5px var(--ink2) |
| 4181 | `html[data-b3-p4=a] .b3-xt-all:hover .wg-cb .cb:not(.on)::after` | background:color-mix(in srgb,var(--patch) 38%,transparent) |
| 4182 | `html[data-b3-p4=a] .b3-xt-all:hover .wg-cb .cb.on::after` | background:color-mix(in srgb,var(--patch) 55%,transparent) |
| 4183 | `html[data-b3-p4=b] .b3-xt-all:hover .wg-cb .cb` | box-shadow:inset 0 1px 2px rgba(0,0,0,.55),inset 0 0 0 1px color-mix(in srgb,var(--patch) 45%,transparent) |
| 4184 | `html[data-b3-p4=b] .b3-xt-all:hover .wg-cb .cb:not(.on)::after` | background:color-mix(in srgb,var(--patch) 40%,transparent) |
| 4185 | `html[data-b3-p4=b] .b3-xt-all:hover .wg-cb .cb.on` | background:color-mix(in srgb,var(--patch) 24%,var(--desk));box-shadow:inset 0 1px 2px rgba(0,0,0,.55),inset 0 0 0 1px color-mix(in srgb,var(--patch) 70%,transparent) |
| 4186 | `html[data-b3-p4=b] .b3-xt-all:hover .wg-cb .cb.on::after` | background:color-mix(in srgb,var(--patch) 82%,transparent) |
| 4187 | `html[data-b3-p4] .b3-xt-all[aria-pressed=mixed]:hover .wg-cb .cb:not(.on)::after` | background:var(--on-accent) |
| 4212 | `.b3-rv.ok:hover .b3-rv-ok` | background:color-mix(in srgb,var(--ok) 22%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ok) 46%,transparent) |
| 4305 | `.pb-enc:hover .pb-exp::before` | background:var(--hi);box-shadow:inset 0 0 0 1px var(--ink4) |
| 4442 | `.b3-xt-w:hover .b3-xt-wn b` | animation:b3xtname 4.5s cubic-bezier(.4,0,.6,1) infinite alternate |
| 4442 | `.b3-xt-wn:focus-visible b` | animation:b3xtname 4.5s cubic-bezier(.4,0,.6,1) infinite alternate |
| 4641 | `.exs-i) .b3-xf-fid .b3-xf-fn:not(.editing):hover .ic` | color:color-mix(in srgb,var(--ok) 82%,var(--ink)) |
| 5166 | `.b3-hi-r:hover .hlead > .s` | text-decoration:underline;text-underline-offset:3px; text-decoration-thickness:1px;text-decoration-color:color-mix(in srgb,var(--ink) 35%,transparent) |
| 5168 | `.b3-hi-r .b3-hi-open:focus-visible .s` | text-decoration:underline;text-underline-offset:3px; text-decoration-thickness:1px;text-decoration-color:color-mix(in srgb,var(--ink) 35%,transparent) |

## `b4/classes.css` — 10

| Line | Selector | Declarations |
|---|---|---|
| 122 | `.drawer) .seg:has(> button[aria-pressed=true]:hover) > .pb-thumb` | background:color-mix(in srgb,var(--realm-c,var(--ink3)) 32%,var(--sunk))!important |
| 456 | `.f-tier):disabled:hover .b3-bdgs` | opacity:.18;filter:grayscale(.6) |
| 714 | `.g-chipbtn:hover .ic` | color:inherit |
| 729 | `.g-card .pb-enc:not(.g-fits):hover .b4-fold` | background:var(--hi);color:var(--ink) |
| 954 | `.b4 .b3-fadx:not(.over):has(.b3-bw:hover)` | -webkit-mask-image:none;mask-image:none |
| 956 | `.b4 .b3-bdgs.bare .b3-bw:hover .b3-bpop` | visibility:visible;width:max-content;filter:drop-shadow(0 4px 10px rgb(0 0 0 / .5));transition:width .24s var(--ease),filter .24s var(--ease),visibility 0s |
| 963 | `.b4 .b3-bdgs.bare .b3-bw:hover > .b3-bdg` | visibility:hidden;transition-delay:0s |
| 966 | `.b4 .b3-bdgs.bare .b3-bw:hover ~ .b3-bw` | opacity:0 |
| 980 | `.on):not(:has(button:hover)) .f-tick[data-drop] .ic` | color:var(--danger-ink) |
| 981 | `.on):not(:has(button:hover)) .f-tick[data-drop] path` | d:path("M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5") |

## `b4/compare.css` — 15

| Line | Selector | Declarations |
|---|---|---|
| 158 | `.b4 .cx-k:hover .cx-kb` | opacity:1;transform:none |
| 158 | `.b4 .cx-k:focus-visible .cx-kb` | opacity:1;transform:none |
| 165 | `.b4 .cx-wl:has(.cx-wadd:hover)` | background:linear-gradient(180deg,color-mix(in srgb,var(--c) 16%,var(--sunk)),var(--sunk) 52px);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 50%,transparent) |
| 166 | `.b4 .cx-wadd:hover > .ic` | opacity:1;transform:none |
| 166 | `.b4 .cx-wadd:focus-visible > .ic` | opacity:1;transform:none |
| 259 | `.b4 #compare .cx-wl:hover .cx-wplus` | color:color-mix(in srgb,var(--c) 70%,white);background:color-mix(in srgb,var(--c) 14%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 42%,transparent) |
| 260 | `.b4 #compare :is(.cx-wl:hover:not(:has(.cx-k:hover)) .cx-k` | background:color-mix(in srgb,var(--c) 26%,var(--sunk));color:color-mix(in srgb,var(--c) 28%,white);outline-color:transparent;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 7 |
| 379 | `.b4 #compare .cx-code:hover .cx-cpi` | color:var(--ink) |
| 406 | `.b4 #compare .cx-dcb:hover .cx-dcf > i` | margin-left:-12px;transform:rotate(calc((var(--k) - var(--m)) * 3deg)) |
| 407 | `.b4 #compare .cx-dcb:hover .cx-dcf > i:first-child` | margin-left:0 |
| 414 | `.b4 #compare .cx-dcb:hover .cx-dcp` | background:color-mix(in srgb,#5865F2 30%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,#5865F2 80%,transparent);color:#fff |
| 438 | `.on):not(:has(.cx-k:hover)) .cx-k .cx-kb` | opacity:1;transform:none |
| 439 | `.on):not(:has(.cx-k:hover)):has(.cx-mk:not([data-picked])) .cx-k` | background:color-mix(in srgb,var(--c) 26%,var(--sunk));color:color-mix(in srgb,var(--c) 28%,white);outline-color:transparent;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 7 |
| 440 | `.on):not(:has(.cx-k:hover)):has(.cx-mk[data-picked]) .cx-k[aria-pressed=true]` | background:transparent;color:var(--ink3);box-shadow:none;outline:1px dashed color-mix(in srgb,var(--c) 60%,transparent);outline-offset:-1px |
| 475 | `.on):not(:has(.cx-k:hover)):has(.cx-mk[data-picked]) .cx-k[aria-pressed=false] .cx-kb` | opacity:0 |

## `b4/form.css` — 3

| Line | Selector | Declarations |
|---|---|---|
| 74 | `.b4 .f-fld:hover .f-caret` | color:var(--ink2) |
| 133 | `.b4 .f-bt:not([aria-checked=true]):hover .b3-bdgs` | opacity:1 |
| 139 | `.b4 .f-tier:not([aria-checked=true]):hover .b3-bdgs` | opacity:1 |

## `b4/bulk.css` — 1

| Line | Selector | Declarations |
|---|---|---|
| 86 | `.b4 .bk-card:hover .bk-gut` | color:color-mix(in srgb,var(--c) 55%,white) |
