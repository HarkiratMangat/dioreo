---
kind: reference
status: live
---

# Board 3-E — its rules on SHIPPED portal classes

*Generated 2026-09-21T15:11:57.908Z by `overrides.cjs`. **259 live rules** (11 of them ⏳ Session 4's) restyle classes the portal already ships; 94 more are losing options and are not listed.*

**This is where the corrections to boards 1 and 2 live.** Session 2 shipped board 1 and board 2 at ~95%; board 3 ran the portal's own code and corrected the rest with rules like these. Each row is a change to `portal/ui/app.css` (or `tokens.css`): find the portal rule for the same selector, change it to this, and close the element with `portalProbe` against board 3.

⚠️ Board 3 applied these ON TOP of the portal's cascade, so a row can win only because the board stylesheet loads last. When moving it into `app.css`, replace the portal's own declaration rather than appending a second rule, and re-probe.

| Kit source | Selector | Declarations | Switch |
|---|---|---|---|
| `b3/board.css:67` | `.b3-pc,.b3-sd-list,.b3dock-panel,.b3-hint-card` | animation:none!important;transition:none!important | unswitched |
| `b3/board.css:93` | `.b3dock` | position:fixed;left:0;right:0;bottom:16px;z-index:95;display:grid;gap:10px;justify-items:center;padding:0 16px;max-width:100%; font:500 var(--t-sm)/1 var(--ui);color:var(--ink2);transition:bottom var(--dur-2) var(--ease) | unswitched |
| `b3/board.css:95` | `body.has-selbar .b3dock` | bottom:104px | unswitched |
| `b3/board.css:96` | `body:has(.drawer.open) .b3dock` | opacity:.35 | unswitched |
| `b3/board.css:97` | `body:has(.drawer.open) .b3dock:hover` | opacity:1 | unswitched |
| `b3/board.css:98` | `.b3dock-bar` | display:flex;align-items:center;gap:4px;min-height:48px;padding:6px;border-radius:14px;background:color-mix(in srgb,#0B0F12 88%,var(--r-review)); box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--r-review) 26%,var(--rul | unswitched |
| `b3/board.css:100` | `.b3dock-bar > button` | display:inline-flex;align-items:center;gap:8px;flex:none;height:36px;padding:0 10px;border:0;border-radius:9px;background:none;color:var(--ink2);font:600 var(--t-sm)/1 var(--ui);cursor:pointer | unswitched |
| `b3/board.css:101` | `.b3dock-bar > button:hover` | background:var(--hi);color:var(--ink) | unswitched |
| `b3/board.css:102` | `.b3dock-bar > button:focus-visible,.b3dock-seg button:focus-visible` | outline:2px solid var(--focus);outline-offset:1px | unswitched |
| `b3/board.css:103` | `.b3dock-menu,.b3dock-step` | width:36px;justify-content:center;padding:0!important | unswitched |
| `b3/board.css:104` | `.b3dock-menu[aria-expanded=true]` | background:var(--hi)!important;color:var(--ink)!important | unswitched |
| `b3/board.css:105` | `.b3dock-bar .ic` | width:15px;height:15px | unswitched |
| `b3/board.css:106` | `.b3dock-now b` | color:var(--ink);white-space:nowrap | unswitched |
| `b3/board.css:107` | `.b3dock .id` | display:inline-grid;place-items:center;min-width:26px;height:20px;padding:0 5px;border-radius:5px;font:700 var(--t-micro)/1 var(--data);letter-spacing:var(--b3-tr-tight);color:#1A2000;background:var(--r-review) | unswitched |
| `b3/board.css:108` | `.b3dock .id[data-k=e]` | color:var(--ink);background:color-mix(in srgb,var(--r-review) 16%,var(--sunk));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--r-review) 40%,transparent) | unswitched |
| `b3/board.css:109` | `.b3dock .id[data-k=g]` | background:var(--ok);color:var(--on-ok) | unswitched |
| `b3/board.css:110` | `.b3dock-vr` | flex:none;width:1px;height:24px;margin:0 6px;background:var(--rule2) | unswitched |
| `b3/board.css:111` | `.b3dock-seg` | display:inline-flex;flex:none;gap:2px;padding:3px;border-radius:10px;background:var(--sunk);box-shadow:inset 0 0 0 1px var(--rule) | unswitched |
| `b3/board.css:112` | `.b3dock-seg button` | height:28px;padding:0 11px;border:0;border-radius:7px;background:none;color:var(--ink3);font:600 var(--t-sm)/1 var(--ui);white-space:nowrap;cursor:pointer | unswitched |
| `b3/board.css:113` | `.b3dock-seg button:hover` | color:var(--ink) | unswitched |
| `b3/board.css:114` | `.b3dock-seg button[aria-checked=true]` | background:var(--r-review);color:#1A2000 | unswitched |
| `b3/board.css:115` | `.b3dock-panel` | width:min(640px,calc(100vw - var(--rail-w, 88px) - 32px));border-radius:16px;background:#0D1216;box-shadow:var(--b3-ring),var(--b3-lift);overflow:hidden;animation:b3popup .18s var(--ease) both | unswitched |
| `b3/board.css:116` | `.b3dock-panel header` | display:flex;align-items:center;gap:12px;padding:14px 14px 12px 16px;border-bottom:1px solid var(--rule) | unswitched |
| `b3/board.css:117` | `.b3dock-mark` | display:grid;place-items:center;width:34px;height:34px;border-radius:9px;background:var(--r-review);color:#1A2000;font:700 13px/1 var(--display);letter-spacing:var(--b3-tr-tight) | unswitched |
| `b3/board.css:118` | `.b3dock-ttl` | display:grid;gap:4px;flex:1 | unswitched |
| `b3/board.css:119` | `.b3dock-ttl b` | font:600 var(--t-md)/1 var(--ui);color:var(--ink) | unswitched |
| `b3/board.css:120` | `.b3dock-ttl small` | font:500 var(--t-xs)/1 var(--ui);color:var(--ink3) | unswitched |
| `b3/board.css:121` | `.b3dock-body` | display:grid;grid-template-columns:230px minmax(0,1fr);max-height:min(62vh,560px) | unswitched |
| `b3/board.css:122` | `.b3dock-list` | padding:8px;border-right:1px solid var(--rule);overflow:auto | unswitched |
| `b3/board.css:123` | `.b3dock-list h6` | margin:10px 8px 6px;font:600 var(--t-micro)/1 var(--data);letter-spacing:var(--b3-tr-wide);text-transform:uppercase;color:var(--ink3) | unswitched |
| `b3/board.css:124` | `.b3dock-item` | display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:8px;width:100%;min-height:36px;padding:0 8px;border:0;border-radius:8px;background:none;text-align:left;cursor:pointer | unswitched |
| `b3/board.css:125` | `.b3dock-item .t` | font:600 var(--t-sm)/1.2 var(--ui);color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis | unswitched |
| `b3/board.css:126` | `.b3dock-item .r` | font:500 var(--t-micro)/1 var(--data);letter-spacing:var(--b3-tr-tight);text-transform:uppercase;color:var(--ink4) | unswitched |
| `b3/board.css:127` | `.b3dock-item:hover` | background:var(--hi) | unswitched |
| `b3/board.css:128` | `.b3dock-item.on` | background:color-mix(in srgb,var(--r-review) 9%,var(--sunk));box-shadow:inset 2px 0 0 var(--r-review) | unswitched |
| `b3/board.css:129` | `.b3dock-item.on .t` | color:var(--ink) | unswitched |
| `b3/board.css:130` | `.b3dock-cur` | padding:16px 18px;overflow:auto | unswitched |
| `b3/board.css:131` | `.b3dock-eyebrow` | display:flex;align-items:center;gap:8px;margin:0 0 10px;font:600 var(--t-micro)/1 var(--data);letter-spacing:var(--b3-tr-wide);text-transform:uppercase;color:var(--ink3) | unswitched |
| `b3/board.css:132` | `.b3dock-cur h5` | margin:0 0 12px;font:600 var(--t-lg)/1.2 var(--ui);color:var(--ink);text-transform:none;letter-spacing:-.01em | unswitched |
| `b3/board.css:133` | `.b3dock-notes` | display:grid;gap:8px;margin:0 0 16px;padding:0;list-style:none | unswitched |
| `b3/board.css:134` | `.b3dock-notes li` | position:relative;padding-left:16px;font:500 var(--t-sm)/1.45 var(--ui);color:var(--ink2) | unswitched |
| `b3/board.css:135` | `.b3dock-notes li::before` | content:"";position:absolute;left:0;top:.55em;width:6px;height:6px;border-radius:2px;background:var(--r-review) | unswitched |
| `b3/board.css:136` | `.b3dock-tries` | display:flex;flex-wrap:wrap;align-items:center;gap:8px | unswitched |
| `b3/board.css:137` | `.b3dock-tries > span` | font:600 var(--t-micro)/1 var(--data);letter-spacing:var(--b3-tr-wide);text-transform:uppercase;color:var(--ink3);margin-right:4px | unswitched |
| `b3/board.css:138` | `.b3dock-tries button` | display:inline-flex;align-items:center;gap:7px;height:32px;padding:0 12px;border:0;border-radius:var(--rad-pill);background:var(--sunk);box-shadow:var(--b3-ring);color:var(--ink);font:600 var(--t-sm)/1 var(--ui);cursor:p | unswitched |
| `b3/board.css:139` | `.b3dock-tries button .ic` | width:13px;height:13px;color:var(--r-review) | unswitched |
| `b3/board.css:140` | `.b3dock-tries button:hover` | background:var(--hi);box-shadow:inset 0 0 0 1px var(--ink4) | unswitched |
| `b3/board.css:141` | `.b3dock-panel footer` | display:flex;align-items:center;gap:12px;padding:10px 12px 10px 16px;border-top:1px solid var(--rule);font:500 var(--t-xs)/1.3 var(--ui);color:var(--ink3) | unswitched |
| `b3/board.css:142` | `.b3dock-panel footer span` | display:inline-flex;align-items:center;gap:6px;flex:1 | unswitched |
| `b3/board.css:143` | `.b3dock-panel footer .ic` | width:13px;height:13px | unswitched |
| `b3/board.css:144` | `.b3dock-panel footer button` | display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;border:0;border-radius:var(--rad-pill);background:none;box-shadow:var(--b3-ring);color:var(--ink2);font:600 var(--t-xs)/1 var(--ui);cursor:pointer | unswitched |
| `b3/board.css:145` | `.b3dock` | left:10px;bottom:70px | unswitched |
| `b3/board.css:145` | `.b3dock-body` | grid-template-columns:1fr | unswitched |
| `b3/board.css:145` | `.b3dock-list` | border-right:0;border-bottom:1px solid var(--rule);max-height:32vh | unswitched |
| `b3/board.css:276` | `.wg-igb .ic,.b3-sd-code .ic` | stroke-dasharray:64 | unswitched |
| `b3/board.css:277` | `.wg-code .wg-igb .ic,.wg-ib .ic` | stroke-dashoffset:0 | unswitched |
| `b3/board.css:278` | `.wg-ib[aria-label^="Copy"] .ic,.wg-igb .ic` | animation:b3draw .34s cubic-bezier(.16,1,.3,1) both | unswitched |
| `b3/board.css:292` | `.b3-x .ic,.dw-h .x .ic,.b3-pc-x .ic` | stroke-dasharray:34 | unswitched |
| `b3/board.css:293` | `.b3-x:hover .ic,.b3-x:focus-visible .ic,.dw-h .x:hover .ic,.b3-pc-x:hover .ic` | animation:b3draw .3s cubic-bezier(.16,1,.3,1) both;--dlen:34 | unswitched |
| `b3/board.css:295` | `.wg-igb .ic,.b3-x .ic,.dw-h .x .ic,.b3-pc-x .ic` | stroke-dasharray:none;animation:none | unswitched |
| `b3/board.css:405` | `html[data-b3-p2sty] .wg-r .wg-at[style],html[data-b3-p2sty] .b3-sd .wg-at[style],html[data-b3-p2sty] .g-pick .wg-at[style],html[data-b3-p2sty] .b3-wr-rail .wg-a` | background:var(--atbg);box-shadow:inset 0 0 0 1px var(--atring),var(--atlit,0 0 #0000);color:var(--atink);font-weight:var(--atw,500); transition:box-shadow var(--dur-1) var(--ease),background var(--dur-1) var(--ease) | live switch — drop the qualifier |
| `b3/board.css:410` | `html[data-b3-p2sty] .wg-r:hover .wg-at[style],html[data-b3-p2sty] .wg-r.wg-hov .wg-at[style]` | box-shadow:inset 0 0 0 1px var(--atring-hi,var(--atring)),var(--atlit-hi,var(--atlit,0 0 #0000)) | live switch — drop the qualifier |
| `b3/board.css:447` | `html[data-b3-p2sty=neutralbg] .wg-r .wg-at[style],html[data-b3-p2sty=neutralbg] .b3-sd .wg-at[style],html[data-b3-p2sty=neutralbg] .g-pick .wg-at[style],html[da` | --atbg:color-mix(in srgb,var(--ink) 6%,var(--sunk));--atring:color-mix(in srgb,var(--ink) 11%,transparent); --atring-hi:color-mix(in srgb,var(--sl) 40%,transparent); --atlit:0 0 #0000;--atlit-hi:0 0 #0000;--atink:var(--s | live switch — drop the qualifier |
| `b3/board.css:451` | `html[data-b3-p2sty=neutralbg] .wg-sc` | color:var(--sl,var(--ink2)) | live switch — drop the qualifier |
| `b3/board.css:534` | `html[data-b3-p2lab] .wg-at:not([data-slot])` | padding-left:11px | live switch — drop the qualifier |
| `b3/board.css:723` | `html[data-b3-p4=b] .cb` | border-radius:6px;background:var(--desk);box-shadow:inset 0 1px 2px rgba(0,0,0,.55),var(--b3-ring) | live switch — drop the qualifier |
| `b3/board.css:728` | `html[data-b3-p4=b] .wg-cb:hover .cb:not(.on)::after,html[data-b3-p4=b] .cb:hover:not(.on)::after` | background:color-mix(in srgb,var(--patch) 40%,transparent) | live switch — drop the qualifier |
| `b3/board.css:729` | `html[data-b3-p4=b] .wg-cb:hover .cb,html[data-b3-p4=b] .cb:hover` | box-shadow:inset 0 1px 2px rgba(0,0,0,.55),inset 0 0 0 1px color-mix(in srgb,var(--patch) 45%,transparent) | live switch — drop the qualifier |
| `b3/board.css:730` | `html[data-b3-p4=b] .cb.on` | background:linear-gradient(180deg,#F7D567,var(--patch));box-shadow:0 0 0 3px color-mix(in srgb,var(--patch) 22%,transparent),inset 0 -1px 0 rgba(0,0,0,.18) | live switch — drop the qualifier |
| `b3/board.css:731` | `html[data-b3-p4=b] .cb.on::after` | background:var(--on-accent) | live switch — drop the qualifier |
| `b3/board.css:732` | `html[data-b3-p4=b] .wg-cb[aria-checked=mixed] .cb` | background:linear-gradient(180deg,#F7D567,var(--patch));box-shadow:0 0 0 3px color-mix(in srgb,var(--patch) 18%,transparent) | live switch — drop the qualifier |
| `b3/board.css:733` | `html[data-b3-p4=b] .wg-cb[aria-checked=mixed] .cb::after` | -webkit-mask:none;mask:none;left:4.5px;top:8px;width:9px;height:2px;border-radius:1px;background:var(--on-accent) | live switch — drop the qualifier |
| `b3/board.css:1236` | `.chip.topic i,.pill .dot,.b3-sc > i,.b3-sd-gh > i` | border-radius:50% | unswitched |
| `b3/board.css:1575` | `html[data-b3-e1] .pill.lead.mh-new .mh-plus` | display:none | ⏳ Session 4 |
| `b3/board.css:1585` | `html[data-b3-e1] .pill.lead.mh-new:focus-visible,html[data-b3-e1] .mtools .pill.lead.madd:focus-visible` | outline:2px solid var(--focus);outline-offset:2px | ⏳ Session 4 |
| `b3/board.css:1604` | `html[data-b3-a1=fixed] .mtools .pill.lead.madd` | min-height:0;padding:10px 15px;gap:7px;background:color-mix(in srgb,var(--patch) 14%,transparent);color:var(--ink) | live switch — drop the qualifier |
| `b3/board.css:1605` | `html[data-b3-a1=fixed] .mtools .pill.lead.madd:hover` | background:color-mix(in srgb,var(--patch) 24%,transparent) | live switch — drop the qualifier |
| `b3/board.css:1606` | `html[data-b3-a1=fixed] .mtools .pill.lead.madd .ic` | width:12px;height:12px | live switch — drop the qualifier |
| `b3/board.css:1615` | `html[data-b3-e1] .racktools .chip::before` | content:"";width:14px;height:14px;background:currentColor;-webkit-mask:var(--b3-cud) center/14px no-repeat;mask:var(--b3-cud) center/14px no-repeat | ⏳ Session 4 |
| `b3/board.css:1616` | `html[data-b3-e1] .racktools .chip + .chip::before` | -webkit-mask-image:var(--b3-cdu);mask-image:var(--b3-cdu) | ⏳ Session 4 |
| `b3/board.css:1621` | `html[data-b3-e1] .dw-f .btn` | border-radius:var(--rad-pill);min-height:40px | ⏳ Session 4 |
| `b3/board.css:1622` | `html[data-b3-e1] .dw-f .btn.go:hover` | filter:none;background:color-mix(in srgb,var(--ok) 86%,white) | ⏳ Session 4 |
| `b3/board.css:1623` | `html[data-b3-e1] .dw-f .btn.no` | border-color:transparent | ⏳ Session 4 |
| `b3/board.css:1624` | `html[data-b3-e1] .dw-f .btn.no:hover` | background:var(--hi);color:var(--ink) | ⏳ Session 4 |
| `b3/board.css:1627` | `html[data-b3-a1=fixed] .wg-code` | cursor:pointer | live switch — drop the qualifier |
| `b3/board.css:1630` | `html[data-b3-a1=fixed] .wg-ib::after` | content:"";position:absolute;min-width:0;overflow:hidden;font:600 var(--t-sm)/1 var(--ui);white-space:nowrap;text-align:left;color:inherit;opacity:0;pointer-events:none | live switch — drop the qualifier |
| `b3/board.css:1631` | `html[data-b3-a1=fixed] .wg-ib::before` | transition:background var(--dur-1) var(--ease),box-shadow var(--dur-1) var(--ease) | live switch — drop the qualifier |
| `b3/board.css:1632` | `html[data-b3-a1=fixed] .wg-fbtn[aria-expanded=true]::after` | content:"Collapse" | live switch — drop the qualifier |
| `b3/board.css:1633` | `html[data-b3-a1=fixed] .wg-fbtn[aria-expanded=false]::after` | content:"Expand" | live switch — drop the qualifier |
| `b3/board.css:1646` | `html[data-b3-a1=fixed] .wg-ib.wg-fbtn` | display:grid;grid-template-columns:14px 0fr;align-items:center;justify-items:stretch;justify-content:center; column-gap:0;width:auto;min-width:var(--tap);padding:0 var(--s3);justify-self:end;font:600 var(--t-sm)/1 var(-- | live switch — drop the qualifier |
| `b3/board.css:1650` | `html[data-b3-a1=fixed] .wg-ib.wg-fbtn .ic` | width:14px;height:14px | live switch — drop the qualifier |
| `b3/board.css:1651` | `html[data-b3-a1=fixed] .wg-ib.wg-fbtn::after` | position:static;transform:none;max-width:none;transition:opacity calc(var(--b3-reveal) * .55) var(--b3-reveal-ease) | live switch — drop the qualifier |
| `b3/board.css:1653` | `html[data-b3-a1=fixed] .wg-ib.wg-fbtn:hover,html[data-b3-a1=fixed] .wg-ib.wg-fbtn:focus-visible` | grid-template-columns:14px 1fr;column-gap:var(--s2);z-index:4;color:var(--ink) | live switch — drop the qualifier |
| `b3/board.css:1656` | `html[data-b3-a1=fixed] .wg-ib.wg-fbtn:hover::after,html[data-b3-a1=fixed] .wg-ib.wg-fbtn:focus-visible::after` | opacity:1;transition:opacity calc(var(--b3-reveal) * .7) var(--b3-reveal-ease) calc(var(--b3-reveal) * .2) | live switch — drop the qualifier |
| `b3/board.css:1699` | `html[data-b3-e5] .bmeta .bpill::before` | content:"";width:13px;height:13px;background:currentColor;-webkit-mask:var(--b3-clock) center/13px no-repeat;mask:var(--b3-clock) center/13px no-repeat | ⏳ Session 4 |
| `b3/board.css:1700` | `html[data-b3-e5] .bmeta .bpill + .bpill::before` | -webkit-mask-image:var(--b3-repeat);mask-image:var(--b3-repeat) | ⏳ Session 4 |
| `b3/board.css:1701` | `html[data-b3-e5=now] .bmeta .bpill::before` | content:none | ⏳ Session 4 |
| `b3/board.css:1744` | `.mh-take` | flex-wrap:wrap;justify-content:flex-end;max-width:100% | unswitched |
| `b3/board.css:1746` | `.b3dock` | left:8px;right:8px;top:calc(var(--hdr-h, 52px) + 6px);bottom:auto;max-width:none;justify-items:stretch | unswitched |
| `b3/board.css:1747` | `body.has-selbar .b3dock` | bottom:auto | unswitched |
| `b3/board.css:1748` | `.b3dock-bar` | min-height:42px;padding:4px | unswitched |
| `b3/board.css:1749` | `.b3dock-step,.b3dock-now b` | display:none | unswitched |
| `b3/board.css:1750` | `.b3dock-panel` | width:auto;max-height:70vh;overflow:auto | unswitched |
| `b3/board.css:1997` | `12.5%` | --tx1:24%;--ty1:58%;--tx2:58%;--ty2:42%;--tx3:62%;--ty3:26% | unswitched |
| `b3/board.css:1999` | `37.5%` | --tx1:60%;--ty1:66%;--tx2:24%;--ty2:40%;--tx3:70%;--ty3:74% | unswitched |
| `b3/board.css:2001` | `62.5%` | --tx1:70%;--ty1:26%;--tx2:36%;--ty2:82%;--tx3:30%;--ty3:74% | unswitched |
| `b3/board.css:2003` | `87.5%` | --tx1:26%;--ty1:22%;--tx2:76%;--ty2:50%;--tx3:26%;--ty3:22% | unswitched |
| `b3/board.css:2019` | `.wg-line` | align-items:baseline | unswitched |
| `b3/board.css:2020` | `.wg-line > .b3-bdgs,.wg-line > span:not(:has(> b)),.wg-line > i,.wg-line > button` | align-self:center | unswitched |
| `b3/board.css:2243` | `html[data-b3-p4=b] .wg-cb:hover .cb.on,html[data-b3-p4=b] .cb.on:hover` | background:color-mix(in srgb,var(--patch) 24%,var(--desk)); box-shadow:inset 0 1px 2px rgba(0,0,0,.55),inset 0 0 0 1px color-mix(in srgb,var(--patch) 70%,transparent) | live switch — drop the qualifier |
| `b3/board.css:2246` | `html[data-b3-p4=b] .wg-cb:hover .cb.on::after,html[data-b3-p4=b] .cb.on:hover::after` | background:color-mix(in srgb,var(--patch) 82%,transparent) | live switch — drop the qualifier |
| `b3/board.css:2359` | `.b3-fady,.b3-sd-rows,.b3-cmdl,.b3dock-list,.b3dock-cur, .b3-sd-chips:has(.b3-sc ~ .b3-sc ~ .b3-sc ~ .b3-sc)` | overflow-y:auto;scrollbar-width:none;overscroll-behavior:contain; -webkit-mask-image:linear-gradient(to bottom,#000 0,#000 var(--fo,0px),rgb(0 0 0/0) var(--fo,0px),rgb(0 0 0/.3) calc(var(--fo,0px) + var(--ft,0px)*.45),rg | unswitched |
| `b3/board.css:2364` | `.b3-fady::-webkit-scrollbar,.b3-sd-rows::-webkit-scrollbar,.b3-cmdl::-webkit-scrollbar, .b3dock-list::-webkit-scrollbar,.b3dock-cur::-webkit-scrollbar,.b3-sd-ch` | width:0;height:0 | unswitched |
| `b3/board.css:2688` | `:is(.b3-fady,.b3-sd-rows,.b3-cmdl,.b3dock-list,.b3dock-cur,.b3-sd-chips):has(.b3-pc)` | -webkit-mask-image:none;mask-image:none | unswitched |
| `b3/board.css:2723` | `html[data-b3-p2sty] .wg-r .wg-at[style],html[data-b3-p2sty] .b3-sd .wg-at[style],html[data-b3-p2sty] .g-pick .wg-at[style],html[data-b3-p2sty] .b3-wr-rail .wg-a` | --atink:var(--ink);--atw:500 | live switch — drop the qualifier |
| `b3/board.css:2760` | `.wg-r .wg-rail` | max-height:76px;overflow-y:auto;overscroll-behavior:auto;scrollbar-width:none; -webkit-mask-image:linear-gradient(to bottom,#000 0,#000 var(--fo,0px),rgb(0 0 0/0) var(--fo,0px),rgb(0 0 0/.3) calc(var(--fo,0px) + var(--ft | unswitched |
| `b3/board.css:2763` | `.wg-r .wg-rail::-webkit-scrollbar` | width:0;height:0 | unswitched |
| `b3/board.css:2834` | `.wg-r .wg-rail,.b3-sd-chips` | --fdy:15px | unswitched |
| `b3/board.css:3176` | `.wg-r.bad::after` | left:0;right:auto;width:4px;-webkit-mask-image:radial-gradient(ellipse farthest-side at 0 50%,#000 0,#000 90%,transparent 100%),linear-gradient(to bottom,transparent 0,rgb(0 0 0/.14) 10%,rgb(0 0 0/.42) 24%,rgb(0 0 0/.78) | unswitched |
| `b3/board.css:3177` | `.wg-r.bad::before,.wg-r.bad:hover::before,.wg-r.bad.open::before` | display:none | unswitched |
| `b3/board.css:3246` | `12.5%` | transform:translate3d(27.27%,35.37%,0) | unswitched |
| `b3/board.css:3246` | `37.5%` | transform:translate3d(68.18%,40.24%,0) | unswitched |
| `b3/board.css:3246` | `62.5%` | transform:translate3d(79.55%,15.85%,0) | unswitched |
| `b3/board.css:3246` | `87.5%` | transform:translate3d(29.55%,13.41%,0) | unswitched |
| `b3/board.css:3247` | `12.5%` | transform:translate3d(76.32%,30.00%,0) | unswitched |
| `b3/board.css:3247` | `37.5%` | transform:translate3d(31.58%,28.57%,0) | unswitched |
| `b3/board.css:3247` | `62.5%` | transform:translate3d(47.37%,58.57%,0) | unswitched |
| `b3/board.css:3247` | `87.5%` | transform:translate3d(100.00%,35.71%,0) | unswitched |
| `b3/board.css:3248` | `12.5%` | transform:translate3d(96.88%,20.97%,0) | unswitched |
| `b3/board.css:3248` | `37.5%` | transform:translate3d(109.38%,59.68%,0) | unswitched |
| `b3/board.css:3248` | `62.5%` | transform:translate3d(46.88%,59.68%,0) | unswitched |
| `b3/board.css:3248` | `87.5%` | transform:translate3d(40.62%,17.74%,0) | unswitched |
| `b3/board.css:3273` | `html[data-b3-p4] .wg-cb[aria-checked=mixed]:hover .cb:not(.on)::after,html[data-b3-p4] .wg-cb[aria-checked=mixed] .cb:hover:not(.on)::after` | background:var(--on-accent);clip-path:inset(0 0 0 0) | live switch — drop the qualifier |
| `b3/board.css:3288` | `.mt-grp .chip > :is(.cl,em)` | text-box:trim-both cap alphabetic | unswitched |
| `b3/board.css:3289` | `.chip.topic em` | color:oklch(from var(--c) max(l,.76) c h);font-weight:700;opacity:1 | unswitched |
| `b3/board.css:3290` | `.chip.topic[aria-pressed=true] em` | background:none;opacity:1;color:oklch(from var(--c) max(l,.8) c h) | unswitched |
| `b3/board.css:3291` | `.mt-grp .chip:not(.topic) em` | font-style:normal;font-family:var(--data);font-size:var(--t-micro);font-weight:700;color:var(--ink2);margin-left:5px | unswitched |
| `b3/board.css:3292` | `.chip.topic i` | transition:box-shadow var(--b3-d1) var(--ease) | unswitched |
| `b3/board.css:3293` | `.chip.topic:hover i` | box-shadow:0 0 0 2px color-mix(in srgb,var(--c) 35%,transparent) | unswitched |
| `b3/board.css:3296` | `.seg button[aria-pressed=true],.seg button[aria-selected=true]` | box-shadow:inset 0 0 0 1px var(--ink4) | unswitched |
| `b3/board.css:3297` | `.seg button:has(> .ic)` | display:inline-flex;align-items:center;gap:6px | unswitched |
| `b3/board.css:3298` | `.seg button > .ic` | width:13px;height:13px;flex:none | unswitched |
| `b3/board.css:3363` | `html[data-b3-p2sty=neutralbg] :is(.wg-r,.b3-sd,.g-pick,.b3-wr-rail) .wg-at[style]` | --atring:color-mix(in srgb,var(--sl) 46%,transparent);--atring-hi:color-mix(in srgb,var(--sl) 72%,transparent) | live switch — drop the qualifier |
| `b3/board.css:3376` | `html[data-b3-a1] .mtools .mt-r2 > .mt-grp,html[data-b3-a1] .mtools .mt-r2 > .mt-grp:first-child` | gap:3px | live switch — drop the qualifier |
| `b3/board.css:3377` | `html[data-b3-a1] .mtools .mt-r2 .chip` | padding-inline:7px | live switch — drop the qualifier |
| `b3/board.css:3378` | `html[data-b3-a1] .mtools .mt-r2 .seg button` | padding-inline:10px | live switch — drop the qualifier |
| `b3/board.css:3422` | `.wg-h > .wg-line` | align-items:center | unswitched |
| `b3/board.css:3423` | `.wg-h > .wg-line > :is(b,small)` | text-box:trim-both cap alphabetic | unswitched |
| `b3/board.css:3427` | `.wg-h > .wg-line` | transform:translateY(.5px) | unswitched |
| `b3/board.css:3428` | `.wg-h > .wg-line > b` | transform:translateY(-.37px) | unswitched |
| `b3/board.css:3432` | `html[data-b3-a1] .mtools .mt-r2 .chip em` | font-size:var(--t-sm);margin-left:0 | live switch — drop the qualifier |
| `b3/board.css:3433` | `html[data-b3-a1] .mtools .mt-r2 .chip.topic` | gap:5px | live switch — drop the qualifier |
| `b3/board.css:3434` | `html[data-b3-a1] .mtools .mt-r2 .chip:not(.topic)` | display:inline-flex;align-items:center;gap:5px | live switch — drop the qualifier |
| `b3/board.css:3469` | `.lab` | display:grid;grid-template-columns:minmax(0,1fr);gap:16px | unswitched |
| `b3/board.css:3611` | `.wg-at.nocode:not(#_),.wg-sc.nocode:not(#_)` | box-shadow:none;outline:1px dashed color-mix(in srgb,var(--warn) 72%,transparent);outline-offset:-1px; background:repeating-linear-gradient(-45deg,color-mix(in srgb,var(--warn) 11%,transparent) 0 4px,transparent 4px 8px) | unswitched |
| `b3/board.css:3613` | `.wg-at.nocode:not(#_)::before` | color:color-mix(in srgb,var(--warn) 80%,var(--ink3)) | unswitched |
| `b3/board.css:3618` | `.b3-pc .b3-pc-open,.b3dock .b3dock-tries button,.b3dock-panel footer button` | border-radius:var(--rad-box) | unswitched |
| `b3/board.css:3968` | `.band-best` | --bc:#F2C230 | unswitched |
| `b3/board.css:3968` | `.band-top` | --bc:#A99BFF | unswitched |
| `b3/board.css:3968` | `.band-meta` | --bc:#38D6F0 | unswitched |
| `b3/board.css:4137` | `.b3-btn2:is(.go,.stage)` | transition:background var(--b3-d1),box-shadow var(--b3-d1) | unswitched |
| `b3/board.css:4137` | `.b3-btn2:is(.go,.stage):hover` | transform:none | unswitched |
| `b3/board.css:4839` | `.b3-hi-dg > .b3-hi-r:is(.st-m,.st-z)` | border-top-color:transparent | unswitched |
| `b3/board.css:4899` | `.b3-hi-r:is(.st-m,.st-z)` | border-top-color:transparent | unswitched |
| `b3/board.css:4961` | `.chip:hover:not(:disabled)` | background:var(--hi);color:var(--ink) | unswitched |
| `b3/board.css:4962` | `.b3-sd-vt button.on:hover,.seg button[aria-selected=true]:hover` | background:color-mix(in srgb,var(--ink) 12%,var(--raised));color:var(--ink) | unswitched |
| `b3/board.css:4976` | `:is(button,[role=button],[role=tab],[role=checkbox],[role=radio],.b3-fc,.b3-xt-wn,.b3-xt-c,.seg button,.pill,.chip,.b3-btn2,.b3-hi-h,.b3-fgl,.mlabel,.b3-hi-day)` | -webkit-user-select:none;user-select:none | unswitched |
| `b3/board.css:5142` | `.wg-r .wg-ix` | font-weight:700;font-variant-numeric:tabular-nums | unswitched |
| `b3/board.css:5143` | `.wg-line` | gap:10px | unswitched |
| `gates.css:51` | `.pidx` | margin: 0 0 22px; border-radius: var(--rad-3); background: var(--paper); box-shadow: inset 0 0 0 1px var(--rule); overflow: hidden | unswitched |
| `gates.css:52` | `.pidx-h` | display: flex; align-items: baseline; gap: 14px; padding: 18px 20px 12px | unswitched |
| `gates.css:53` | `.pidx-h h2` | margin: 0; font: 600 var(--t-lg)/1 var(--ui); color: var(--ink) | unswitched |
| `gates.css:54` | `.pidx-h p` | margin: 0; font: 500 var(--t-sm)/1 var(--data); color: var(--ink3) | unswitched |
| `gates.css:55` | `.pidx-l` | display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 1px; margin: 0; padding: 0 12px 14px; list-style: none | unswitched |
| `gates.css:63` | `.pidx-l li` | display: flex; align-items: center; gap: 10px; min-height: 40px; padding: 0 8px; border-radius: 8px | unswitched |
| `gates.css:64` | `.pidx-l li:hover` | background: color-mix(in srgb, var(--ink) 4%, transparent) | unswitched |
| `gates.css:65` | `.pidx-l a` | display: flex; align-items: center; gap: 9px; min-width: 0; flex: 1; font: 500 var(--t-sm)/1 var(--ui); color: var(--ink); text-decoration: none | unswitched |
| `gates.css:68` | `.pidx-l a em` | font: 500 var(--t-xs)/1 var(--ui); font-style: normal; color: var(--ink3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis | unswitched |
| `gates.css:69` | `.pidx-l .v` | display: inline-flex; align-items: center; gap: 6px; font: 600 var(--t-xs)/1 var(--data); color: var(--ink4) | unswitched |
| `gates.css:70` | `.pidx-l li.on .v` | color: var(--ok) | unswitched |
| `gates.css:71` | `.pidx-l .v .ic` | width: 13px; height: 13px | unswitched |
| `gates.css:197` | `.pk` | margin: 16px 0 0; padding: 16px 18px 18px; border-radius: var(--rad-3); background: var(--paper); box-shadow: inset 0 0 0 1px var(--rule) | unswitched |
| `gates.css:198` | `.pk-h` | display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px 14px; margin-bottom: 14px | unswitched |
| `gates.css:199` | `.pk-k` | display: inline-grid; place-items: center; height: 22px; padding: 0 9px; border-radius: 5px; background: var(--patch); font: 700 var(--t-micro)/1 var(--data); letter-spacing: .14em; text-transform: uppercase; color: var( | unswitched |
| `gates.css:201` | `.pk-h b` | font: 600 var(--t-md)/1 var(--ui); color: var(--ink) | unswitched |
| `gates.css:202` | `.pk-ask` | flex: 1; min-width: 220px; font: 500 var(--t-sm)/1.45 var(--ui); color: var(--ink3) | unswitched |
| `gates.css:203` | `.pk-st` | display: inline-flex; align-items: center; gap: 7px; height: 28px; padding: 0 11px; border-radius: var(--rad-pill); background: var(--sunk); box-shadow: var(--b3-ring); font: 600 var(--t-xs)/1 var(--data); color: var(--i | unswitched |
| `gates.css:205` | `.pk-st .ic` | width: 13px; height: 13px | unswitched |
| `gates.css:206` | `.pk-st em` | font-style: normal; color: var(--ink4) | unswitched |
| `gates.css:207` | `.pk-st.on` | color: var(--ok); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ok) 45%, transparent) | unswitched |
| `gates.css:208` | `.pk-os` | display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px | unswitched |
| `gates.css:209` | `.pk-o` | display: grid; grid-template-rows: 1fr auto; border-radius: var(--rad-2); background: var(--sunk); box-shadow: var(--b3-ring); overflow: hidden | unswitched |
| `gates.css:210` | `.pk-o.shown` | box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--patch) 55%, transparent) | unswitched |
| `gates.css:211` | `.pk-o.picked` | background: color-mix(in srgb, var(--ok) 7%, var(--sunk)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ok) 45%, transparent) | unswitched |
| `gates.css:212` | `.pk-ob` | display: grid; gap: 7px; padding: 13px 14px 12px; border: 0; background: none; text-align: left; cursor: pointer | unswitched |
| `gates.css:213` | `.pk-ol` | font: 600 var(--t-base)/1.1 var(--ui); color: var(--ink) | unswitched |
| `gates.css:214` | `.pk-ow` | font: 500 var(--t-sm)/1.45 var(--ui); color: var(--ink3) | unswitched |
| `gates.css:215` | `.pk-osee` | font: 600 var(--t-micro)/1 var(--data); letter-spacing: .12em; text-transform: uppercase; color: var(--ink4) | unswitched |
| `gates.css:216` | `.pk-o.shown .pk-osee` | color: var(--patch) | unswitched |
| `gates.css:217` | `.pk-of` | display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 12px 12px | unswitched |
| `gates.css:218` | `.pk-mine` | display: inline-flex; align-items: center; gap: 6px; font: 600 var(--t-xs)/1 var(--data); color: var(--smg) | unswitched |
| `gates.css:219` | `.pk-mine .ic` | width: 12px; height: 12px | unswitched |
| `gates.css:220` | `.pk-take` | display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 14px; border: 0; border-radius: var(--rad-pill); background: var(--raised); box-shadow: var(--b3-ring); font: 600 var(--t-sm)/1 var(--ui); col | unswitched |
| `gates.css:222` | `.pk-take .ic` | width: 13px; height: 13px | unswitched |
| `gates.css:223` | `.pk-take:hover:not(:disabled)` | color: var(--ink); box-shadow: inset 0 0 0 1px var(--ink4) | unswitched |
| `gates.css:224` | `.pk-take:disabled` | opacity: .4; cursor: default | unswitched |
| `gates.css:225` | `.pk-take.on` | background: var(--ok); color: var(--on-ok); box-shadow: none | unswitched |
| `gates.css:226` | `.pk-bad` | display: flex; align-items: center; gap: 8px; margin: 10px 0 0; font: 600 var(--t-sm)/1 var(--ui); color: var(--danger-ink) | unswitched |
| `gates.css:237` | `html[data-b3-a1=fixed] .mtools .mlabel` | min-width: 64px | live switch — drop the qualifier |
| `gates.css:238` | `html[data-b3-a1=fixed] .mt-r2` | display: grid; grid-template-columns: max-content max-content; justify-content: start; align-items: center; column-gap: 16px; row-gap: var(--s2) | live switch — drop the qualifier |
| `gates.css:240` | `html[data-b3-a1=fixed] .mt-r2 > .mt-grp:first-child` | display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-width: 0 | live switch — drop the qualifier |
| `gates.css:243` | `html[data-b3-a1=fixed] .mt-r2 .chip` | padding: 0 8px; gap: 5px | live switch — drop the qualifier |
| `gates.css:244` | `html[data-b3-a1=fixed] .mt-r2 .chip em` | margin-left: 1px | live switch — drop the qualifier |
| `gates.css:245` | `html[data-b3-a1=fixed] .mt-r2 > .mt-grp:first-child` | gap: 5px | live switch — drop the qualifier |
| `gates.css:246` | `html[data-b3-a1=fixed] .mt-r2 > .mt-grp + .mt-grp` | position: relative; display: inline-flex; align-items: center; margin: 0; padding-left: 16px | live switch — drop the qualifier |
| `gates.css:248` | `html[data-b3-a1=fixed] .mt-r2 > .mt-grp + .mt-grp::before` | content: ""; position: absolute; left: 0; top: 50%; width: 1px; height: 26px; margin-top: -13px; background: var(--rule2) | live switch — drop the qualifier |
| `gates.css:250` | `html[data-b3-a1=fixed] .mt-r2 > .mt-grp + .mt-grp .mlabel` | min-width: 0 | live switch — drop the qualifier |
| `gates.css:252` | `html[data-b3-a1=fixed] .mt-r2` | grid-template-columns: minmax(0, 1fr) | live switch — drop the qualifier |
| `gates.css:253` | `html[data-b3-a1=fixed] .mt-r2 > .mt-grp + .mt-grp` | padding-left: 0; box-shadow: none | live switch — drop the qualifier |
| `gates.css:255` | `html[data-b3-a1=fixed] .wg-heads` | min-height: 48px; padding: 0 var(--s4) 0 20px; font: 700 var(--t-xs)/1 var(--data); letter-spacing: .12em; color: var(--ink2) | live switch — drop the qualifier |
| `gates.css:256` | `html[data-b3-a1=fixed] .wg-sort` | min-height: 48px; font: inherit; letter-spacing: inherit | live switch — drop the qualifier |
| `gates.css:257` | `html[data-b3-a1=fixed] .wg-r` | min-height: 58px | live switch — drop the qualifier |
| `gates.css:258` | `html[data-b3-a1=fixed] .wg-h::before` | top: 10px; bottom: 10px; width: 4px; border-radius: 0 3px 3px 0 | live switch — drop the qualifier |
| `gates.css:259` | `html[data-b3-a1=fixed] .wg-r::before` | top: 12px; bottom: 12px; width: 2.5px; border-radius: 0 2px 2px 0 | live switch — drop the qualifier |
| `gates.css:271` | `html[data-b3-a1=fixed] :is(.wg-ib, .wg-fold, .wg-sort, .wg-code, .wg-cb, .wg-igb):hover:not(:disabled), html[data-b3-a1=fixed] :is(.wg-ib, .wg-fold, .wg-sort, .` | background: none | live switch — drop the qualifier |
| `gates.css:278` | `html[data-b3-a1=fixed] :is(.wg-ib, .wg-fold):hover::before, html[data-b3-a1=fixed] :is(.wg-ib, .wg-fold):focus-visible::before` | background: var(--hi); box-shadow: inset 0 0 0 1px var(--ink4) | live switch — drop the qualifier |
| `gates.css:280` | `html[data-b3-a1=fixed] .wg-ib.wg-del:hover::before` | background: color-mix(in srgb, var(--danger-ink) 12%, var(--raised)); box-shadow: inset 0 0 0 1px var(--danger-edge) | live switch — drop the qualifier |
| `gates.css:288` | `html[data-b3-a1=fixed] .wg-code .wg-igb` | transition: background var(--dur-1) var(--ease), box-shadow var(--dur-1) var(--ease), color var(--dur-1) var(--ease) | live switch — drop the qualifier |
| `gates.css:290` | `html[data-b3-a1=fixed] .wg-code:hover .wg-igb` | background: var(--raised); color: var(--ink2); box-shadow: none | live switch — drop the qualifier |
| `gates.css:291` | `html[data-b3-a1=fixed] .wg-code .wg-igb:hover, html[data-b3-a1=fixed] .wg-code:focus-visible .wg-igb` | background: color-mix(in srgb, var(--c) 16%, var(--raised)); color: color-mix(in srgb, var(--c) 72%, white); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 50%, transparent) | live switch — drop the qualifier |
| `gates.css:317` | `html[data-b3-a1=fixed] .wg-line small` | display: inline-flex; align-items: center | live switch — drop the qualifier |
| `gates.css:318` | `html[data-b3-a1=fixed] .wg-nb` | display: inline-flex; align-items: center | live switch — drop the qualifier |
| `gates.css:319` | `html[data-b3-a1=fixed] .wg-nb::before` | margin: 0 9px | live switch — drop the qualifier |
| `gates.css:321` | `html[data-b3-a1=fixed] .wg-ig` | position: relative; box-shadow: none | live switch — drop the qualifier |
| `gates.css:322` | `html[data-b3-a1=fixed] .wg-ig::after` | content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; box-shadow: var(--b3-ring) | live switch — drop the qualifier |
| `gates.css:324` | `html[data-b3-a1=fixed] .wg-igf` | box-shadow: inset 0 3px 4px -2px rgba(0, 0, 0, .45) | live switch — drop the qualifier |
| `gates.css:325` | `html[data-b3-a1=fixed] .wg-igb` | box-shadow: none; border-left: 1px solid var(--rule2) | live switch — drop the qualifier |
| `gates.css:326` | `html[data-b3-a1=fixed] .wg-code` | cursor: pointer | live switch — drop the qualifier |
| `gates.css:327` | `html[data-b3-a1=fixed] .wg-code:hover .wg-ig` | box-shadow: none | live switch — drop the qualifier |
| `gates.css:328` | `html[data-b3-a1=fixed] .wg-code:hover .wg-ig::after` | box-shadow: var(--b3-ring) | live switch — drop the qualifier |
| `gates.css:514` | `.exs` | display: grid; gap: 10px; margin: 0; padding: 0; list-style: none | unswitched |
| `gates.css:684` | `.pk-os` | grid-template-columns: 1fr | unswitched |
| `gates.css:685` | `.pidx-l` | grid-template-columns: 1fr | unswitched |
| `gates.css:697` | `.pb` | gap: 52px | unswitched |
| `gates.css:738` | `.pb input, .pb textarea` | caret-color: var(--patch) | unswitched |
| `gates.css:739` | `.pb, .g-stage, .b3-sd-list, .dk, .pidx-l` | scrollbar-color: var(--rule2) transparent; scrollbar-width: thin | unswitched |
| `gates.css:775` | `.dw-f .btn:has(> .ic)` | display:inline-flex;align-items:center;justify-content:center;gap:6px | unswitched |
| `gates.css:776` | `.dw-f .btn` | padding-inline:18px | unswitched |
| `gates.css:777` | `.dw-f .btn > .ic` | width:14px;height:14px;flex:none | unswitched |
| `gates.css:779` | `.dw-f .btn > .ic:first-child` | margin-left:-4px | unswitched |
| `gates.css:803` | `html:not([data-kbd]) .drawer .x:focus-visible` | outline: none; box-shadow: none | unswitched |
| `gates.css:811` | `.dw-nav` | margin-left:auto;flex:none;display:flex;align-items:center;gap:6px | unswitched |
| `gates.css:812` | `.dw-h .dw-nav .x` | margin-left:0;width:auto;min-width:28px;display:inline-flex;align-items:center;justify-content:center;gap:0;padding:0 6px; transition:gap 360ms cubic-bezier(.4,0,.2,1),padding 360ms cubic-bezier(.4,0,.2,1),color 200ms ea | unswitched |
| `gates.css:814` | `.dw-h .dw-nav .x > b` | display:inline-block;max-width:0;overflow:hidden;opacity:0;white-space:nowrap;font:600 12px/1 var(--ui); transform:translateX(-3px);transition:max-width 360ms cubic-bezier(.4,0,.2,1),opacity 240ms ease 60ms,transform 360 | unswitched |
| `gates.css:816` | `.dw-h .dw-nav .x:hover,.dw-h .dw-nav .x:focus-visible` | gap:6px;padding:0 10px 0 7px | unswitched |
| `gates.css:817` | `.dw-h .dw-nav .x:hover > b,.dw-h .dw-nav .x:focus-visible > b` | max-width:3.4em;opacity:1;transform:none | unswitched |
| `gates.css:818` | `.dw-h .dw-nav .x,.dw-h .dw-nav .x > b` | transition:none | unswitched |
| `b2.css:4` | `.ic` | width:16px;height:16px;flex:none | unswitched |
| `b2.css:5` | `.pb` | max-width:1148px;margin:0 auto;padding:44px 32px 160px;display:grid;gap:96px;position:relative;z-index:1;box-sizing:content-box | unswitched |
