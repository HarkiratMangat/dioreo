---
kind: reference
status: live
---

# The apply map — every portal element, and the Board 4 standard it takes

*Generated 2026-10-02 09:47 EDT by `apply-map.cjs` from the element census (`local/census/census.json`, 127 passes, 881 families). Plan §5c Step 2. Session 5 builds from it; regenerate it after any census run or once Harkirat's settings are read into `local/pins2/s4/picks.json`.*

**How to read a row.** One row per census family. **Sites** is every rule in `portal/ui/*.css` that names one of the family's own classes, so an `rg` for the class finds nothing the row leaves out. **Takes** lists the standards on the tuner that set its look; the **rule** column says which line of the classifier put it there, so a wrong row points at the rule to fix.

## The standards and their settings

| Code | Standard | Harkirat's setting |
|---|---|---|
| A | Key labels | not set |
| B | Column heads | not set |
| F | Category word | not set |
| L | Group headings | not set |
| C | Chip shape | not set |
| D | Chip hover and pressed | not set |
| Dsw | View switch | not set |
| E | Action hover | not set |
| Ex | Deselect × | not set |
| H | Button heights | not set |
| N | New button hover | not set |
| Go | Go button hover | not set |
| R | Row hover | not set |
| Fi | Field hover | not set |
| Mi | Menu item hover | not set |
| J | Corners | not set |
| M | Dark grounds | not set |
| Q | Drawer side column | not set |
| P | Icon line weight | not set |
| S | Spacing scale | not set |
| T | Text sizes | not set |
| Tm | Animation speeds | not set |
| G | Your rulings (grey wash, disabled has no hover) | ruled |

## Coverage

| Bucket | Families | Uses |
|---|--:|--:|
| Key labels | 10 | 1137 |
| Column heads | 24 | 914 |
| Category word | 7 | 1571 |
| Group headings | 6 | 388 |
| Headings | 19 | 329 |
| Filter chip | 21 | 818 |
| View switch | 4 | 324 |
| Action: delete | 6 | 1760 |
| Action: share, copy, export | 1 | 2249 |
| Deselect × | 1 | 6 |
| Close and back | 3 | 34 |
| New button | 4 | 229 |
| Go button | 9 | 247 |
| Neutral button | 66 | 11764 |
| Row | 15 | 5386 |
| Fields | 33 | 2020 |
| Menu item | 4 | 18 |
| Link | 4 | 10 |
| Panels and cards | 194 | 28096 |
| Dark grounds | 1 | 1 |
| Drawer | 3 | 102 |
| Small text (Step 3) | 94 | 10644 |
| Content text | 281 | 44547 |
| Layout boxes | 68 | 17485 |
| EXEMPT | 3 | 777 |
| **All** | **881** | **130856** |

Families whose selectors take different roles (listed under **Also holds**; Session 5 splits them): **8**.

Families with no stylesheet site (built only from inline styles, element defaults or a class no rule names): **35**. Families in a drift group (near-identical families the census flagged): **180** in 49 groups.

## Key labels · 10

Takes: T Text sizes · A Key labels.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| Fa5656c9 ·d9 | `span.arw ‹ .att-go`<br>`span.lw ‹ .lrow`<br>`span ‹ .mh-eyebrow` +3 | 489 | home, season | h - · 9.5/400 caps ls 0.95px · var(--ink3) |  | `app.css:1551` `app.css:2020` `app.css:5129` `app.css:5130` `app.css:5180` `app.css:5182` `app.css:5648` `app.css:5685` +14 | T A | keylabel | Small text (Step 3) |
| F6abddea | `span ‹ .mlabel`<br>`div.bqhead ‹ .bqcol`<br>`span ‹ .incg` | 217 | season, armory, broadcast, analytics, history | h - · 9.5/600 caps ls 1.52px · var(--ink3) |  | `app.css:399` `app.css:455` | A T | keylabel (by parent) |  |
| F9ea89f1 | `span.k ‹ .stat` | 210 | home, armory, broadcast, access, analytics, history, review | h - · 9.5/700 caps ls 0.95px · var(--ink3) |  | `app.css:131` `app.css:465` `app.css:466` `app.css:2105` `app.css:2255` `app.css:3286` `app.css:3570` `app.css:3571` +4 | A T | keylabel |  |
| Fad934ef | `span.k ‹ .stat` | 71 | home, armory, broadcast, access, analytics, history, review | h - · 9.5/700 caps ls 0.95px · var(--ink2\|--r-home) |  | `app.css:131` `app.css:465` `app.css:466` `app.css:2105` `app.css:2255` `app.css:3286` `app.css:3570` `app.css:3571` +4 | A T | keylabel |  |
| Fcf5b260 | `span.mh-add-k ‹ .mh-add` | 40 | season | h - · 10.5/600 caps ls 1.47px · var(--ink3) |  | `app.css:4442` | A T | keylabel |  |
| Fb126287 ·d21 | `span.scrub-label ‹ .scrub` | 36 | season | h - · pad 0 2 0 0 · 9.5/400 caps ls 1.33px · var(--ink3) |  | `app.css:1604` `app.css:1621` | A T | keylabel |  |
| Fa3017ad | `span.k ‹ .lrow` | 32 | access | h - · 9.5/600 caps ls 0.95px · var(--ink2\|--r-home) |  | `app.css:131` `app.css:465` `app.css:466` `app.css:2105` `app.css:2255` `app.css:3286` `app.css:3570` `app.css:3571` +4 | A T | keylabel |  |
| Fed66f21 | `label.nw-l ‹ .nw-f`<br>`label.nw-l` | 29 | season | h - · 12/600 caps ls 1.44px · var(--ink3) |  | `app.css:3914` `app.css:5488` `app.css:6315` | A T | keylabel |  |
| Fe65b285 | `span.rt-k ‹ .reph` | 12 | season | h - · r 999 · pad 3 7 3 7 · 9.5/600 caps ls 0.855px · var(--ink3) |  | `app.css:3774` | A T | keylabel |  |
| Fd4a9238 | `label ‹ .f-main` | 1 | season | h - · 10.5/600 caps ls 0.945px · var(--ink3) |  | `app.css:1218` | A T | keylabel |  |

## Column heads · 24

Takes: B Column heads · S Spacing scale.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| Fc4e4d3f | `th.sortable`<br>`th.sortable.sorted-asc`<br>`div.pz-r ‹ .pz-rows` | 161 | season, analytics, history | h - · pad 8 12 8 12 · undefined/undefined |  | `app.css:664` `app.css:665` `app.css:667` `app.css:677` `app.css:679` `app.css:684` `app.css:5342` `app.css:5344` +8 | B S | th | Layout boxes |
| F0710c71 | `button.sortbtn ‹ .sortable` | 160 | season, analytics, history | h 31.5 · pad 8 12 8 12 · 9.5/700 caps ls 1.14px · var(--ink3) | yes | `app.css:665` `app.css:667` `app.css:677` `app.css:679` | B S | th |  |
| Fe28edb9 | `th.drop-sm`<br>`th`<br>`th.ta-r` | 125 | season, analytics | h - · pad 8 12 8 12 · 9.5/700 caps ls 1.14px · var(--ink3) |  | `app.css:867` `app.css:1553` `app.css:4335` | B S | th |  |
| F6035780 | `th` | 48 | season, analytics, history | h - · pad 8 0 8 12 · undefined/undefined |  | — | B S | th |  |
| F77cc9b4 | `th.ra` | 40 | season | h - · pad 8 16 8 0 · undefined/undefined |  | `app.css:384` `app.css:4594` `app.css:4595` `app.css:4596` | B S | th |  |
| F417dcb2 | `th.sortable`<br>`th.sortable.sorted-asc` | 40 | broadcast | h - · pad 8 8 8 8 · undefined/undefined |  | `app.css:664` `app.css:665` `app.css:667` `app.css:677` `app.css:679` `app.css:684` | B S | th |  |
| Fbf9bd7c | `button.sortbtn ‹ .sortable` | 40 | broadcast | h 31.5 · pad 8 8 8 8 · 9.5/700 caps ls 1.14px · var(--ink3) | yes | `app.css:665` `app.css:667` `app.css:677` `app.css:679` | B S | th |  |
| F8efaed4 | `span.mxav.has ‹ .colh`<br>`div.donut ‹ .dcell` | 34 | access, analytics | h - · r 50 · undefined/undefined |  | `app.css:2401` `app.css:3545` `app.css:3547` `app.css:3590` `app.css:1473` `app.css:2515` `app.css:2518` `app.css:3702` +5 | B S | th (by parent) | Layout boxes |
| Fee194d8 | `th.owncol`<br>`th` | 32 | access | h - · undefined/undefined |  | `app.css:2432` `app.css:2433` `app.css:2434` | B S | th |  |
| F16527ee | `button.colh ‹ .owncol`<br>`button.colh` | 32 | access | h 80.5 · pad 10 12 9 12 · 9.5/700 · var(--ink3) | yes | `app.css:2433` `app.css:3529` `app.css:3537` `app.css:3540` `app.css:3542` `app.css:3544` `app.css:3545` `app.css:3547` +1 | B S | th |  |
| Fe83216e ·d31 | `b ‹ .colh` | 32 | access | h - · 12/600 · var(--ink) |  | `app.css:3540` `app.css:3551` | B S | th (by parent) |  |
| Fe1bd43e ·d1 | `span.clbl ‹ .colh` | 32 | access | h - · 9.5/400 · var(--ink3) |  | `app.css:3542` | B S | th (by parent) |  |
| F3f73489 | `div.wg-heads ‹ .wg-wrap` | 25 | armory | h - · pad 0 16 0 16 · undefined/undefined |  | `app.css:520` `app.css:620` | B S | th |  |
| F2622202 | `button.wg-sort` | 25 | armory | h 44 · 9.5/600 caps ls 1.33px · var(--ink) | yes | `app.css:521` `app.css:522` `app.css:523` | B S | th |  |
| F528a55b | `button.wg-fold ‹ .wg-heads` | 25 | armory | h 44 · pad 0 12 0 12 · 12/600 · var(--ink2\|--r-home) | yes | `app.css:524` `app.css:525` `app.css:526` `app.css:527` | B S | th (by parent) |  |
| F4a64573 | `th.mxc-name`<br>`th.mxc-held` | 16 | access | h - · pad 0 0 9 0 · undefined/undefined |  | `app.css:3396` `app.css:3400` `app.css:3402` `app.css:3403` `app.css:3449` `app.css:3458` `app.css:3461` `app.css:3462` +7 | B S | th |  |
| F09973b2 | `th.sortable` | 10 | broadcast | h - · pad 8 20 8 22 · undefined/undefined |  | `app.css:664` `app.css:665` `app.css:667` `app.css:677` `app.css:679` | B S | th |  |
| Faa41bcf | `button.sortbtn ‹ .sortable` | 10 | broadcast | h 31.5 · pad 8 20 8 22 · 9.5/700 caps ls 1.14px · var(--ink3) | yes | `app.css:665` `app.css:667` `app.css:677` `app.css:679` | B S | th |  |
| Fc16b799 | `th.ra` | 10 | broadcast | h - · pad 8 16 8 8 · undefined/undefined |  | `app.css:384` `app.css:4594` `app.css:4595` `app.css:4596` | B S | th |  |
| Fe14eb6b | `th.k` | 9 | armory | h - · pad 0 4 0 0 · 12/500 · var(--ink3) |  | `app.css:131` `app.css:465` `app.css:466` `app.css:2105` `app.css:2255` `app.css:3286` `app.css:3570` `app.css:3571` +4 | B S | th |  |
| F8121996 | `th` | 5 | armory | h - · pad 10 12 8 12 · 13/600 · var(--ink) |  | — | B S | th |  |
| Fb18c3c5 | `th.base` | 1 | armory | h - · r 6 · pad 10 12 8 12 · 13/600 · var(--ink) |  | `app.css:467` `app.css:468` `app.css:471` | B S | th |  |
| Fa423f30 | `th ‹ .gap` | 1 | armory | h - · pad 14 0 2 0 · 12/600 · var(--ink2\|--r-home) |  | `app.css:472` | B S | th |  |
| F34cb8ce | `th` | 1 | analytics | h - · pad 8 0 8 12 · 9.5/700 caps ls 1.14px · var(--ink3) |  | — | B S | th |  |

## Category word · 7

Takes: F Category word · T Text sizes.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| F4d6ff27 | `small ‹ .wg-line` | 394 | armory | h - · 9.5/600 caps ls 1.52px · var(--ar) |  | `app.css:537` | F T | catword |  |
| F3024753 | `small ‹ .wg-line` | 346 | armory | h - · 9.5/600 caps ls 1.52px · var(--smg) |  | `app.css:537` | F T | catword |  |
| F401fcf2 | `small ‹ .wg-line` | 231 | armory | h - · 9.5/600 caps ls 1.52px · var(--sn) |  | `app.css:537` | F T | catword |  |
| Fbab3be6 | `small ‹ .wg-line` | 184 | armory | h - · 9.5/600 caps ls 1.52px · var(--lmg) |  | `app.css:537` | F T | catword |  |
| Fc804a89 | `small ‹ .wg-line` | 161 | armory | h - · 9.5/600 caps ls 1.52px · var(--sg) |  | `app.css:537` | F T | catword |  |
| Fa062a2a | `small ‹ .wg-line` | 139 | armory | h - · 9.5/600 caps ls 1.52px · var(--sec) |  | `app.css:537` | F T | catword |  |
| F07902bc | `small ‹ .wg-line` | 116 | armory | h - · 9.5/600 caps ls 1.52px · var(--mm) |  | `app.css:537` | F T | catword |  |

## Group headings · 6

Takes: L Group headings · T Text sizes.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| F791cc91 | `span.lnh-n ‹ .lnh` | 185 | season | h - · 9.5/500 caps ls 0.38px · var(--ink3) |  | `app.css:4031` `app.css:4033` `app.css:4035` `app.css:4107` `app.css:4282` `app.css:4393` | L T | grouphead |  |
| F7ad77d4 | `span.lnh-t ‹ .lnh` | 183 | season | h - · 10.5/700 caps ls 1.05px · var(--ink3) |  | `app.css:4030` | L T | grouphead |  |
| F734b478 | `span.fig ‹ .ghead` | 16 | access | h - · 16.5/500 · var(--ink3) |  | `app.css:3429` | L T | grouphead (by parent) |  |
| F017467a | `span.lnh-t ‹ .lnh` | 2 | season | h - · 10.5/700 caps ls 1.05px · var(--patch\|--pn) |  | `app.css:4030` | L T | grouphead |  |
| F84735f9 | `span ‹ .bansec-h` | 1 | season | h - · 10.5/600 caps ls 1.155px · var(--ink3) |  | `app.css:1463` | L T | grouphead (by parent) |  |
| Faa8f446 ·d4 | `span.bansec-n ‹ .bansec-h` | 1 | season | h - · 9.5/400 · var(--ink3) |  | `app.css:1464` | L T | grouphead (by parent) |  |

## Headings · 19

Takes: L Group headings · T Text sizes.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| F5341929 | `h1 ‹ .mh-id` | 111 | home, season, armory, broadcast, access, analytics, history, review | h - · 34/700 caps ls 1.87px · var(--ink) |  | — | L T | heading |  |
| F4c0522c ·d29 | `h3 ‹ .ow-h` | 40 | season | h - · 16.5/600 · var(--ink) |  | `app.css:4638` | L T | heading |  |
| Fdc23934 | `h6.reps ‹ .repwrap`<br>`h5 ‹ .expkept`<br>`h5 ‹ .bed-sec` +5 | 38 | season, armory, broadcast, access, analytics, history | h - · 9.5/600 caps ls 0.95px · var(--ink3) |  | `app.css:3766` `app.css:1900` `app.css:2980` `app.css:2982` `app.css:3094` `app.css:6228` `app.css:6230` `app.css:6231` +3 | L T | heading |  |
| Fb3aa911 | `h2 ‹ .dw-ttl` | 33 | season, armory, broadcast, access, analytics, history, review | h - · 22/600 ls -0.33px · var(--ink) |  | — | L T | heading |  |
| F1b3dd5a | `h4 ‹ .hpanel`<br>`h4` | 26 | analytics | h - · 16.5/600 ls -0.2475px · var(--ink) |  | `app.css:3116` | L T | heading |  |
| F17c26a5 | `h4.bf-h ‹ .bf-sec` | 20 | armory | h - · 12/600 · var(--ink) |  | `app.css:4871` `app.css:6729` | L T | heading |  |
| Fb9f4005 | `h5 ‹ .bchg` | 9 | broadcast | h - · 9.5/600 caps ls 1.52px · var(--ink3) |  | `app.css:433` | L T | heading |  |
| F7b40b32 | `h4 ‹ .ghead` | 8 | access | h - · 15/700 caps ls 0.9px · var(--ink) |  | `app.css:3418` `app.css:3425` `app.css:3426` `app.css:3437` `app.css:3501` | L T | heading |  |
| F08b22ce | `h4 ‹ .ghead` | 8 | access | h - · 13.5/700 caps ls 0.81px · var(--ink2\|--r-home) |  | `app.css:3418` `app.css:3425` `app.css:3426` `app.css:3437` `app.css:3501` | L T | heading |  |
| F4d098c9 | `h4 ‹ .rvdet` | 8 | review | h - · 19/600 ls -0.285px · var(--ink) |  | `app.css:2709` | L T | heading |  |
| F0505fa0 | `h2 ‹ .lp` | 6 | home | h - · 12/600 caps ls 1.2px · var(--ink3) |  | `app.css:516` `app.css:517` | L T | heading |  |
| Ff7b91a3 | `h5 ‹ .tokgroup` | 6 | access | h - · 9.5/600 caps ls 0.95px · var(--ink2\|--r-home) |  | `app.css:6228` `app.css:6230` `app.css:6231` `app.css:6233` | L T | heading |  |
| F947f370 ·d29 | `h4` | 4 | analytics | h - · 14.5/600 · var(--ink) |  | — | L T | heading |  |
| F3e95340 | `h2.sr ‹ .home` | 3 | home | h - · 25/700 · var(--ink) |  | `app.css:40` | L T | heading |  |
| F771e075 | `h3 ‹ .v2-text` | 3 | armory | h - · 12/700 · var(--dc-ink) |  | `v2card.css:31` | L T | heading |  |
| F4f066d4 | `h1 ‹ .doorcard` | 2 | home | h - · 26/700 ls -0.39px · var(--ink) |  | `app.css:2768` | L T | heading |  |
| F5ca02fe ·d48 | `h6 ‹ .dcard` | 2 | season, armory | h - · 14/700 · var(--dc-ink) |  | `app.css:812` `app.css:1011` `app.css:4382` | L T | heading |  |
| F0f30fc2 | `h6 ‹ .dwissues` | 1 | armory | h - · 9.5/700 caps ls 1.14px · var(--warn) |  | `app.css:1948` | L T | heading |  |
| F36c95d1 ·d48 | `h1 ‹ .v2-text` | 1 | armory | h - · 15/700 · var(--dc-ink) |  | `v2card.css:30` | L T | heading |  |

## Filter chip · 21

Takes: C Chip shape · D Chip hover and pressed · T Text sizes · S Spacing scale.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| F9e48812 ·d8 | `button.chip.topic ‹ .mt-grp`<br>`button.chip.stagedchip ‹ .mt-grp`<br>`button.chip ‹ .nodraft` +8 | 587 | season, armory, broadcast, analytics, history, review | h 32 · r 999 · pad 6 11 6 11 · 12/600 · var(--ink2\|--r-home) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +40 | C D T S | chip |  |
| Faf02e4a | `button.chip ‹ .mt-grp`<br>`button.chip ‹ .cmpbrow`<br>`button.chip.lvchip ‹ .mt-grp` | 96 | season, armory, broadcast, history, analytics | h 32 · r 999 · pad 6 11 6 11 · 12/600 · var(--ink) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +40 | C D T S | chip |  |
| F15823a1 ·d8 | `button.chip.topic ‹ .tokgrid` | 67 | access | h 33 · r 999 · pad 6 11 6 11 · 12/600 · var(--ink2\|--r-home) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +40 | C D T S | chip |  |
| Fc31d947 ·d35 | `button.nw-chip ‹ .nw-types` | 21 | season | h 31 · r 999 · pad 8 12 8 12 · 13/500 · var(--ink2\|--r-home) | yes | `app.css:3906` `app.css:3909` `app.css:3910` `app.css:3911` `app.css:3912` `app.css:3913` `app.css:5403` | C D T S | chip |  |
| Faffcd75 ·d8 | `button.chip ‹ .callout` | 10 | broadcast | h 32.5 · r 999 · pad 6 11 6 11 · 12/600 · var(--ink2\|--r-home) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +40 | C D T S | chip |  |
| F85bedd2 ·d38 | `button.chip.incchip ‹ .incg` | 8 | analytics | h 44 · r 999 · pad 0 16 0 16 · 12/600 · var(--ink2\|--r-home) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +40 | C D T S | chip |  |
| F0a5beb2 ·d38 | `button.chip ‹ .mmore` | 8 | analytics, history | h 44 · r 999 · pad 0 18 0 18 · 12/600 · var(--ink2\|--r-home) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +40 | C D T S | chip |  |
| Fe69ec7e | `button.chip ‹ .dwfield` | 3 | armory | h 44 · pad 6 11 6 11 · 12/600 · var(--ink2\|--r-home) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +40 | C D T S | chip |  |
| Ff291d6e | `button.nw-chip.on ‹ .nw-types` | 2 | season | h 31 · r 999 · pad 8 12 8 12 · 13/500 · var(--ink) | yes | `app.css:3906` `app.css:3909` `app.css:3910` `app.css:3911` `app.css:3912` `app.css:3913` `app.css:5403` `app.css:689` +24 | C D T S | chip |  |
| Fb6534f5 ·d22 | `button.chip.on ‹ .cmppick` | 2 | armory | h 32 · r 999 · pad 6 11 6 11 · 12/600 · var(--ink) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +63 | C D T S | chip |  |
| Fe9033f2 | `button.chip.cut ‹ .cmpbrow` | 2 | armory | h 32 · r 999 · pad 6 11 6 11 · 12/600 · var(--ink3) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +40 | C D T S | chip |  |
| Ff7017fd | `button.chip.topic.on ‹ .tokgrid` | 2 | access | h 33 · r 999 · pad 6 11 6 11 · 12/600 · var(--ink) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +63 | C D T S | chip |  |
| Ff85f933 | `button.chip.topic.on ‹ .tokgrid` | 2 | access | h 33 · r 999 · pad 6 11 6 11 · 12/600 · var(--ink) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +63 | C D T S | chip |  |
| F80359e4 | `button.nw-chip.on ‹ .nw-types` | 1 | season | h 31 · r 999 · pad 8 12 8 12 · 13/500 · var(--ink) | yes | `app.css:3906` `app.css:3909` `app.css:3910` `app.css:3911` `app.css:3912` `app.css:3913` `app.css:5403` `app.css:689` +24 | C D T S | chip |  |
| F53499be | `button.nw-chip.on ‹ .nw-types` | 1 | season | h 31 · r 999 · pad 8 12 8 12 · 13/500 · var(--ink) | yes | `app.css:3906` `app.css:3909` `app.css:3910` `app.css:3911` `app.css:3912` `app.css:3913` `app.css:5403` `app.css:689` +24 | C D T S | chip |  |
| F13f0e51 | `button.nw-chip.on ‹ .nw-types` | 1 | season | h 31 · r 999 · pad 8 12 8 12 · 13/500 · var(--ink) | yes | `app.css:3906` `app.css:3909` `app.css:3910` `app.css:3911` `app.css:3912` `app.css:3913` `app.css:5403` `app.css:689` +24 | C D T S | chip |  |
| Ff31a75e | `button.chip.stagedchip ‹ .mt-grp` | 1 | season | h 32 · r 999 · pad 6 11 6 11 · 12/600 · var(--staged\|--r-review) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +40 | C D T S | chip |  |
| F6d04c5b | `button.chip ‹ .bed-code` | 1 | armory | h 44 · r 999 · pad 6 11 6 11 · 12/600 · var(--ink2\|--r-home) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +40 | C D T S | chip |  |
| Fd28dceb | `button.chip.topic.on ‹ .tokgrid` | 1 | access | h 33 · r 999 · pad 6 11 6 11 · 12/600 · var(--ink) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +63 | C D T S | chip |  |
| Fd7a9b96 | `button.chip.topic ‹ .mt-grp` | 1 | analytics | h 32 · r 999 · pad 6 11 6 11 · 12/600 · var(--ink) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +40 | C D T S | chip |  |
| F6496afc | `button.chip.incchip ‹ .incg` | 1 | analytics | h 44 · r 999 · pad 0 16 0 16 · 12/600 · var(--ink) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +40 | C D T S | chip |  |

## View switch · 4

Takes: Dsw View switch · H Button heights · T Text sizes.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| F8aed270 | `button ‹ .seg` | 201 | season, armory, broadcast, analytics | h 32 · r 999 · pad 6 13 6 13 · 12/600 · var(--ink3) | yes | `app.css:144` `app.css:152` `app.css:153` `app.css:2846` `app.css:4174` `app.css:4176` `app.css:4177` `app.css:4178` +1 | Dsw H T | switch (by parent) |  |
| F10b61d4 ·d22 | `button ‹ .seg` | 109 | season, armory, broadcast, analytics | h 32 · r 999 · pad 6 13 6 13 · 12/600 · var(--ink) | yes | `app.css:144` `app.css:152` `app.css:153` `app.css:2846` `app.css:4174` `app.css:4176` `app.css:4177` `app.css:4178` +1 | Dsw H T | switch (by parent) |  |
| F1704a2e | `button ‹ .segsw` | 7 | armory | h 44 · pad 0 14 0 14 · 12/600 · var(--ink) | yes | `app.css:6721` `app.css:6723` `app.css:6724` `app.css:6725` | Dsw H T | switch (by parent) |  |
| F76b5e35 | `button ‹ .segsw` | 7 | armory | h 44 · pad 0 14 0 14 · 12/600 · var(--ink3) | yes | `app.css:6721` `app.css:6723` `app.css:6724` `app.css:6725` | Dsw H T | switch (by parent) |  |

## Action: delete · 6

Takes: E Action hover · H Button heights · J Corners.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| F11b4ff1 | `button.rmv ‹ .ra` | 1538 | season, broadcast | h 44 · 14.5/400 · var(--ink3) | yes | `app.css:4603` `app.css:4604` `app.css:4605` `app.css:4606` `app.css:4607` `app.css:4608` | E H J | delete |  |
| F47841c7 | `button.pill.sm.dang ‹ .ow-i`<br>`button.pill.sm.dang ‹ .selbar-a` | 197 | season, armory, history | h 44 · r 999 · pad 5 12 5 12 · 12/500 · var(--danger-ink) | yes | `app.css:480` `app.css:481` `app.css:714` `app.css:2125` `app.css:3939` `app.css:3943` `app.css:3944` `app.css:3945` +30 | E H J | delete |  |
| F9fb5700 | `button.chip.danger ‹ .imgact`<br>`button.chip.danger ‹ .sess` | 17 | armory, access | h 32 · r 999 · pad 6 11 6 11 · 12/600 · var(--danger-ink) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +51 | E H J | delete |  |
| Fa6e5d56 | `button.btn.dang ‹ .dw-f` | 5 | season, armory, broadcast, review | h 44 · r 6 · pad 9 9 9 9 · 13/600 · var(--on-accent) | yes | `app.css:754` `app.css:758` `app.css:759` `app.css:760` `app.css:761` `app.css:762` `app.css:804` `app.css:992` +11 | E H J | delete |  |
| F454c134 | `button.btn.danger ‹ .dw-f` | 2 | access | h 44 · r 6 · pad 9 9 9 9 · 13/700 · var(--danger-ink) | yes | `app.css:754` `app.css:758` `app.css:759` `app.css:760` `app.css:761` `app.css:762` `app.css:804` `app.css:992` +20 | E H J | delete |  |
| Fea56029 | `button.mi.danger ‹ .usec` | 1 | home | h 35 · r 6 · pad 10 14 10 14 · 13/500 · var(--danger-ink) | yes | `app.css:1391` `app.css:1393` `app.css:1798` `app.css:1800` `app.css:1802` `app.css:1803` `app.css:1804` `app.css:1806` +18 | E H J | delete |  |

## Action: share, copy, export · 1

Takes: E Action hover · H Button heights · J Corners.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| F152a5a9 | `button.brow-cp ‹ .brow` | 2249 | armory | h 14 · 16.5/400 · var(--ink3) | yes | `app.css:6700` `app.css:6701` | E H J | share |  |

## Deselect × · 1

Takes: Ex Deselect × · H Button heights.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| F71b2e08 | `button.selbar-x ‹ .selbar-in` | 6 | season, armory, history | h 44 · pad 8 6 8 6 · 12/600 · var(--ink3) | yes | `app.css:4574` `app.css:4576` `app.css:4577` | Ex H | deselect |  |

## Close and back · 3

Takes: G Your rulings (grey wash, disabled has no hover) · H Button heights · J Corners.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| Fc6df779 | `button.x ‹ .dw-h` | 30 | season, armory, broadcast, access, analytics, history, review | h 28 · r 6 · pad 1 6 1 6 · 12/400 · var(--ink3) | yes | `app.css:476` `app.css:795` `app.css:797` `app.css:798` `app.css:810` `app.css:1967` | G H J | close |  |
| F5af47c6 | `button.x ‹ .dw-h` | 3 | season, armory, access | h 28 · r 6 · pad 1 6 1 6 · 12/400 · var(--ink3) | yes | `app.css:476` `app.css:795` `app.css:797` `app.css:798` `app.css:810` `app.css:1967` | G H J | close |  |
| F39f9be1 | `button.idclose ‹ .ph` | 1 | season | h 26.5 · r 6 · pad 7 11 7 11 · 10.5/600 ls 0.945px · var(--ink3) | yes | `app.css:1494` `app.css:1497` `app.css:1498` | G H J | close |  |

## New button · 4

Takes: N New button hover · H Button heights · J Corners.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| Fd9b387e | `button.pill.mh-t ‹ .mh-add` | 160 | season | h 35 · r 10 · pad 10 15 10 15 · 13/600 · var(--ink) | yes | `app.css:480` `app.css:481` `app.css:714` `app.css:2125` `app.css:3939` `app.css:3943` `app.css:3944` `app.css:3945` +24 | N H J | new |  |
| F4672a20 | `button.pill.lead.mh-new ‹ .masthead` | 43 | armory, broadcast, access | h 40.5 · r 10 · pad 10 15 10 15 · 13/600 · var(--ink) | yes | `app.css:480` `app.css:481` `app.css:714` `app.css:2125` `app.css:3939` `app.css:3943` `app.css:3944` `app.css:3945` +31 | N H J | new |  |
| Fbd28b74 | `button.pill.sm.lead ‹ .exs-i` | 24 | season, armory, broadcast, access, analytics, history | h 44 · r 10 · pad 5 12 5 12 · 12/600 · var(--ink) | yes | `app.css:480` `app.css:481` `app.css:714` `app.css:2125` `app.css:3939` `app.css:3943` `app.css:3944` `app.css:3945` +32 | N H J | new |  |
| F5615a8f | `button.pill.lead ‹ .racktools` | 2 | armory | h 35 · r 10 · pad 10 15 10 15 · 13/600 · var(--ink) | yes | `app.css:480` `app.css:481` `app.css:714` `app.css:2125` `app.css:3939` `app.css:3943` `app.css:3944` `app.css:3945` +29 | N H J | new |  |

## Go button · 9

Takes: Go Go button hover · H Button heights · J Corners · R Row hover · S Spacing scale.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| F70f9f91 | `a.hdr-commit` | 71 | home, armory, broadcast, access, analytics, history, review | h 30 · r 999 · 13/400 · var(--ink) | yes | `app.css:846` `app.css:5276` `app.css:5280` `app.css:5284` `app.css:5289` `app.css:5290` `app.css:5291` | Go H J | go |  |
| F03f4966 | `a.btn.go ‹ .tray-f` | 60 | armory, broadcast, access, analytics, history | h 44 · r 6 · pad 9 9 9 9 · 13/700 · var(--on-ok) | yes | `app.css:754` `app.css:758` `app.css:759` `app.css:760` `app.css:761` `app.css:762` `app.css:804` `app.css:992` +18 | Go H J | go |  |
| F3d24804 | `button.go ‹ .addrow` | 40 | season | h 41 · r 6 · pad 8 14 8 14 · 16.5/700 · var(--on-accent) | yes | `app.css:759` `app.css:760` `app.css:982` `app.css:992` `app.css:994` `app.css:1012` `app.css:1188` `app.css:1189` +5 | Go H J | go |  |
| Ff1d3e24 | `button.chip.go.madd ‹ .mt-r1` | 35 | armory, broadcast | h 44 · r 999 · pad 0 18 0 18 · 12/600 · var(--staged\|--r-review) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +51 | Go H J | go |  |
| F644884f | `button.btn.go ‹ .dw-f`<br>`button.btn.go ‹ .rvfoot` | 26 | season, armory, broadcast, access, review | h 44 · r 6 · pad 9 9 9 9 · 13/700 · var(--on-ok) | yes | `app.css:754` `app.css:758` `app.css:759` `app.css:760` `app.css:761` `app.css:762` `app.css:804` `app.css:992` +18 | Go H J | go |  |
| Fdd4932a | `a.att-row.s-error ‹ .att-list`<br>`a.att-row.s-repair ‹ .att-list` | 9 | home | h 72 · r 6 · pad 16 20 16 20 · 16.5/400 · var(--ink) | yes | `app.css:4189` `app.css:4192` `app.css:4193` `app.css:4194` `app.css:4195` `app.css:4196` `app.css:4205` `app.css:4206` +22 | R S Go H J | go | Row |
| F9124ce4 | `a.chip.go ‹ .hres` | 3 | home | h 32 · r 999 · pad 6 11 6 11 · 12/600 · var(--staged\|--r-review) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +49 | Go H J | go |  |
| F78a79ad | `a.dbtn ‹ .doorcard` | 2 | home | h 46 · r 6 · pad 0 18 0 18 · 14.5/600 · rgb(255, 255, 255) | yes | `app.css:2770` `app.css:2773` `app.css:2774` `app.css:2775` | Go H J | go |  |
| F4e88b88 | `button.chip.go ‹ .rvcx` | 1 | review | h 32 · r 999 · pad 6 11 6 11 · 12/600 · var(--staged\|--r-review) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +49 | Go H J | go |  |

## Neutral button · 66

Takes: G Your rulings (grey wash, disabled has no hover) · H Button heights · J Corners · T Text sizes · E Action hover.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| Ffb67843 | `button.wg-ib.wg-fbtn ‹ .wg-h`<br>`button.wg-ib ‹ .wg-acts`<br>`button.wg-ib.wg-del ‹ .wg-acts` +2 | 7391 | armory, broadcast | h 44 · 16.5/400 · var(--ink3) | yes | `app.css:560` `app.css:561` `app.css:562` `app.css:563` `app.css:564` `app.css:565` `app.css:566` `app.css:567` +2 | G H J T E | neutral | Action: delete |
| F8a55dc5 | `button.bgrp-w ‹ .bgrp-h` | 1119 | armory | h 32.5 · 16.5/400 · var(--ink) | yes | `app.css:4257` `app.css:4262` `app.css:4265` `app.css:6416` `app.css:6621` `app.css:6622` | G H J T | neutral |  |
| Fbb1136a | `button.mxcell ‹ .mxc`<br>`button.mxcell.on ‹ .mxc`<br>`button.mxcell.inh.inherited ‹ .mxc` | 288 | access | h 37 · 14.5/400 · var(--ink2\|--r-home) | yes | `tokens.css:424` `app.css:2415` `app.css:2418` `app.css:2419` `app.css:2420` `app.css:2422` `app.css:2423` `app.css:2425` +47 | G H J T | neutral |  |
| F4821187 | `span ‹ .ruler` | 286 | season | h 26 · pad 0 0 0 6 · 10.5/400 · var(--ink3) | yes | `app.css:228` `app.css:1118` `app.css:5459` `app.css:6146` `app.css:6147` | G H J T | neutral |  |
| F1028c8b | `button.wg-fsum ‹ .wg-fwrap` | 230 | armory | h 34 · r 6 · pad 0 5 0 10 · 12/600 · var(--warn-ink) | yes | `app.css:550` `app.css:551` `app.css:552` `app.css:557` | G H J T | neutral |  |
| Fe9f1617 | `span.pt.saved ‹ .tk` | 219 | season | h 18.5 · r 3 · 16.5/400 · var(--ink) | yes | `app.css:194` `app.css:196` `app.css:206` `app.css:208` `app.css:1081` `app.css:1082` `app.css:1819` `app.css:1838` +23 | G H J T | neutral |  |
| Fc5b6d42 | `div.bar.saved.stemmed ‹ .tk`<br>`div.bar.saved ‹ .tk`<br>`div.bar.saved.lbl-out.stemmed ‹ .tk` | 216 | season | h 21 · r 3 · pad 0 8 0 8 · 12/600 · var(--on-accent) | yes | `tokens.css:481` `tokens.css:485` `tokens.css:498` `tokens.css:503` `tokens.css:508` `app.css:182` `app.css:185` `app.css:186` +56 | G H J T | neutral |  |
| F6fa2208 | `button.trow-h ‹ .trow` | 145 | armory | h 44 · pad 10 13 10 13 · 16.5/400 · var(--ink) | yes | `app.css:1984` `app.css:3314` `app.css:3316` `app.css:3321` `app.css:4307` `app.css:4918` `app.css:4919` `app.css:4920` +6 | G H J T | neutral |  |
| F2b3b731 | `button.bgrp-w ‹ .bgrp-h` | 129 | armory | h 36.5 · 16.5/400 · var(--ink) | yes | `app.css:4257` `app.css:4262` `app.css:4265` `app.css:6416` `app.css:6621` `app.css:6622` | G H J T | neutral |  |
| F4d083c5 | `button.mk` | 111 | home, season, armory, broadcast, access, analytics, history, review | h 34 · r 6 · pad 5 8 5 8 · 12/600 ls 1.92px · var(--ink) | yes | `app.css:96` `app.css:97` `app.css:847` `app.css:875` `app.css:876` `app.css:877` | G H J T | neutral |  |
| F1919cf8 | `button.hdr-out` | 111 | home, season, armory, broadcast, access, analytics, history, review | h 32 · r 6 · 12/500 · var(--ink3) | yes | `app.css:4144` `app.css:4147` `app.css:4149` `app.css:4150` `app.css:4163` `app.css:4164` `app.css:4169` | G H J T | neutral |  |
| F82c1c99 | `button.whobtn ‹ .who` | 110 | home, season, armory, broadcast, access, analytics, history, review | h 34 · r 6 · pad 4 8 4 5 · 12/500 · var(--ink2\|--r-home) | yes | `app.css:1385` `app.css:1388` `app.css:1389` `app.css:4156` `app.css:4157` `app.css:4159` `app.css:4160` | G H J T | neutral |  |
| F47aba2c | `div.bar.saved ‹ .tk`<br>`div.bar.saved.flagged ‹ .tk` | 108 | season | h 21 · r 3 · pad 0 8 0 8 · 12/600 · rgb(255, 255, 255) | yes | `tokens.css:481` `tokens.css:485` `tokens.css:498` `tokens.css:503` `tokens.css:508` `app.css:182` `app.css:185` `app.css:186` +56 | G H J T | neutral |  |
| F6e986fd | `button.pill.sm ‹ .mh-take` | 100 | season, armory, broadcast, access, analytics, history | h 26 · r 999 · pad 5 12 5 12 · 12/500 · var(--ink2\|--r-home) | yes | `app.css:480` `app.css:481` `app.css:714` `app.css:2125` `app.css:3939` `app.css:3943` `app.css:3944` `app.css:3945` +27 | G H J T | neutral |  |
| F9258415 | `button.pill.sm ‹ .netbar`<br>`button.pill.sm ‹ .fail-a`<br>`button.pill.sm ‹ .ow-i` +1 | 97 | home, season, broadcast, armory | h 44 · r 999 · pad 5 12 5 12 · 12/500 · var(--ink2\|--r-home) | yes | `app.css:480` `app.css:481` `app.css:714` `app.css:2125` `app.css:3939` `app.css:3943` `app.css:3944` `app.css:3945` +27 | G H J T | neutral |  |
| Fad8fbee | `button ‹ .zoomer` | 72 | season | h 26 · r 3 · 12/600 · var(--ink2\|--r-home) | yes | `app.css:1325` `app.css:1328` `app.css:1329` `app.css:1330` `app.css:6349` `app.css:6350` | G H J T | neutral |  |
| F0477169 | `button.wide ‹ .zoomer`<br>`button.wide.today ‹ .zoomer` | 72 | season | h 26 · r 3 · pad 0 10 0 10 · 10.5/600 ls 0.42px · var(--ink2\|--r-home) | yes | `app.css:779` `app.css:1328` `app.css:5454` `app.css:6485` `app.css:6486` `app.css:6349` `app.css:6350` | G H J T | neutral |  |
| Fc4f3df8 | `button ‹ .flag` | 72 | season | h 26 · r 6 · pad 3 8 3 8 · 12/600 · var(--ink2\|--r-home) | yes | `app.css:322` `app.css:324` `app.css:992` `app.css:5463` | G H J T | neutral |  |
| F6723a12 | `button.ptc.mark.stack ‹ .tk` | 71 | season | h 21 · r 3 · 16.5/400 · var(--ink) | yes | `app.css:3854` `app.css:3855` `app.css:4057` `app.css:4061` `app.css:4063` `app.css:4065` `app.css:4067` `app.css:6181` +7 | G H J T | neutral |  |
| F3d0e9a9 | `button.lnh ‹ .lane` | 68 | season | h 28 · pad 0 11 0 9 · 10.5/700 caps ls 1.05px · var(--ink3) | yes | `app.css:4014` `app.css:4021` `app.css:4022` `app.css:4024` `app.css:4025` `app.css:4033` `app.css:4034` `app.css:4102` +8 | G H J T | neutral |  |
| F750e288 | `button.btn.no ‹ .tray-f`<br>`button.btn.no ‹ .rvfoot` | 68 | armory, broadcast, access, analytics, history, review | h 44 · r 6 · pad 9 9 9 9 · 13/700 · var(--ink3) | yes | `app.css:754` `app.css:758` `app.css:759` `app.css:760` `app.css:761` `app.css:762` `app.css:804` `app.css:992` +13 | G H J T | neutral |  |
| Fed4a505 | `div.tray-h ‹ .tray` | 60 | armory, broadcast, access, analytics, history | h 35 · pad 8 22 8 12 · 16.5/400 · var(--ink) | yes | `app.css:720` `app.css:721` `app.css:722` `app.css:2815` `app.css:2816` `app.css:2819` `app.css:2820` `app.css:2821` | G H J T | neutral |  |
| Fbd0e38d | `div.bcard ‹ .bcol-body` | 46 | season | h 94 · r 6 · pad 9 10 9 10 · 16.5/400 · var(--ink) | yes | `app.css:941` `app.css:943` `app.css:944` `app.css:945` `app.css:946` `app.css:947` `app.css:948` `app.css:956` +15 | G H J T | neutral |  |
| F09dfef9 | `button.lnh ‹ .lane` | 42 | season | h 36 · pad 0 11 0 9 · 10.5/700 caps ls 1.05px · var(--ink3) | yes | `app.css:4014` `app.css:4021` `app.css:4022` `app.css:4024` `app.css:4025` `app.css:4033` `app.css:4034` `app.css:4102` +8 | G H J T | neutral |  |
| F481ddff | `div.idsum ‹ .identity` | 38 | season | h 327.5 · pad 15 17 15 17 · 16.5/400 · var(--ink) | yes | `app.css:1444` `app.css:1445` `app.css:1453` `app.css:3340` `app.css:3352` `app.css:3354` | G H J T | neutral |  |
| F8a7e2d5 | `button.lnh ‹ .lane` | 37 | season | h 60 · pad 0 11 0 9 · 10.5/700 caps ls 1.05px · var(--ink3) | yes | `app.css:4014` `app.css:4021` `app.css:4022` `app.css:4024` `app.css:4025` `app.css:4033` `app.css:4034` `app.css:4102` +8 | G H J T | neutral |  |
| Fccbbcd8 | `button.dflag ‹ .deadrail` | 36 | season | h 21.5 · r 6 · pad 3 7 3 7 · 9.5/400 ls 0.76px · rgb(242, 153, 74) | yes | `app.css:1647` `app.css:1652` `app.css:1653` `app.css:1659` `app.css:1660` `app.css:1661` `app.css:1662` `app.css:1698` +6 | G H J T | neutral |  |
| Fa4930fb | `button.lnh ‹ .lane` | 36 | season | h 86 · pad 0 11 0 9 · 10.5/700 caps ls 1.05px · var(--ink3) | yes | `app.css:4014` `app.css:4021` `app.css:4022` `app.css:4024` `app.css:4025` `app.css:4033` `app.css:4034` `app.css:4102` +8 | G H J T | neutral |  |
| Fa6f1ff8 | `button.rec-cta ‹ .rec-h` | 36 | season | h 30 · r 6 · pad 0 12 0 12 · 12/500 · var(--ink3) | yes | `app.css:5952` `app.css:5954` | G H J T | neutral |  |
| F9fa4815 ·d25 | `li.rec-row.cur ‹ .rec-list` | 36 | season | h 38 · pad 9 4 9 4 · 16.5/400 · var(--ink) | yes | `app.css:5968` `app.css:5970` `app.css:5971` `app.css:5976` `app.css:5978` `app.css:5979` `app.css:5983` `app.css:5984` | G H J T | neutral |  |
| F16c7fd3 ·d25 | `li.rec-row ‹ .rec-list` | 36 | season | h 37 · pad 9 4 9 4 · 16.5/400 · var(--ink) | yes | `app.css:5968` `app.css:5970` `app.css:5971` `app.css:5976` `app.css:5978` `app.css:5979` `app.css:5983` `app.css:5984` | G H J T | neutral |  |
| F2487fd1 | `button.btn ‹ .dw-f` | 35 | season, armory, broadcast, access, analytics, history, review | h 44 · r 6 · pad 9 9 9 9 · 13/700 · var(--ink2\|--r-home) | yes | `app.css:754` `app.css:758` `app.css:759` `app.css:760` `app.css:761` `app.css:762` `app.css:804` `app.css:992` +9 | G H J T | neutral |  |
| Faee2531 | `div.bcard ‹ .bcol-body` | 32 | season | h 80 · r 6 · pad 9 10 9 10 · 16.5/400 · var(--ink) | yes | `app.css:941` `app.css:943` `app.css:944` `app.css:945` `app.css:946` `app.css:947` `app.css:948` `app.css:956` +15 | G H J T | neutral |  |
| Fd460882 | `button` | 32 | season | h 18 · 16.5/400 · var(--ink) | yes | — | G H J T | neutral |  |
| Fa542efe | `button ‹ .mh-mode` | 25 | armory | h 44 · r 6 · pad 0 24 0 24 · 16.5/700 ls 1.98px · var(--ink3) | yes | `app.css:2475` `app.css:2484` `app.css:2486` `app.css:2488` `app.css:2489` | G H J T | neutral |  |
| F27244dd | `button ‹ .mh-mode` | 24 | armory | h 44 · r 6 · pad 0 24 0 24 · 16.5/700 ls 1.98px · var(--ink) | yes | `app.css:2475` `app.css:2484` `app.css:2486` `app.css:2488` `app.css:2489` | G H J T | neutral |  |
| F2efe611 | `span.pt.saved ‹ .tk` | 15 | season | h 18.5 · r 3 · 16.5/400 · var(--ink) | yes | `app.css:194` `app.css:196` `app.css:206` `app.css:208` `app.css:1081` `app.css:1082` `app.css:1819` `app.css:1838` +23 | G H J T | neutral |  |
| Fd641ac6 | `button.atx ‹ .atr` | 15 | armory | h 28 · r 6 · pad 1 6 1 6 · 12/400 · var(--ink3) | yes | `app.css:4900` `app.css:4902` `app.css:4903` `app.css:6505` | G H J T | neutral |  |
| F33d326a | `button.pill.sm ‹ .ow-i` | 14 | season | h 44 · r 999 · pad 5 12 5 12 · 12/500 · var(--ink3) | yes | `app.css:480` `app.css:481` `app.css:714` `app.css:2125` `app.css:3939` `app.css:3943` `app.css:3944` `app.css:3945` +27 | G H J T | neutral |  |
| F48d602a | `button.lvlb.lv-error ‹ .lvlbars`<br>`button.lvlb.lv-caution ‹ .lvlbars`<br>`button.lvlb.lv-info ‹ .lvlbars` | 12 | analytics | h 43.5 · r 6 · pad 5 6 5 6 · 16.5/400 · var(--ink) | yes | `app.css:3145` `app.css:3148` `app.css:3149` `app.css:3150` `app.css:3155` `app.css:3156` `app.css:3157` `app.css:3158` +9 | G H J T | neutral |  |
| F70d07c7 | `button.bcol-h ‹ .bcol` | 8 | season | h 40 · r 6 · pad 9 11 9 11 · 16.5/400 · var(--ink) | yes | `app.css:1353` `app.css:1356` `app.css:1357` `app.css:1360` `app.css:1361` `app.css:1370` | G H J T | neutral |  |
| F3a12a6a | `button ‹ .modesw` | 7 | armory | h 34 · pad 8 15 8 15 · 12/700 ls 0.96px · var(--on-accent) | yes | `app.css:178` `app.css:3364` `app.css:3366` `app.css:3367` `app.css:3374` `app.css:3375` `app.css:3376` | G H J T | neutral |  |
| Fd41cc01 | `button ‹ .modesw` | 7 | armory | h 34 · pad 8 15 8 15 · 12/700 ls 0.96px · var(--ink3) | yes | `app.css:178` `app.css:3364` `app.css:3366` `app.css:3367` `app.css:3374` `app.css:3375` `app.css:3376` | G H J T | neutral |  |
| F438767f | `button.ccard.clean ‹ .cols`<br>`button.ccard ‹ .cols` | 6 | armory | h 173.5 · r 6 · pad 13 14 13 14 · 16.5/400 · var(--ink) | yes | `app.css:1873` `app.css:1876` `app.css:1877` `app.css:1878` `app.css:1918` `app.css:3303` `app.css:3304` `app.css:5409` +4 | G H J T | neutral |  |
| F1d01fb4 | `button.pz-open ‹ .pz` | 4 | season | h 19 · 12/400 · var(--ink3) | yes | `app.css:5484` `app.css:5486` `app.css:5487` | G H J T | neutral |  |
| Fe490596 | `button ‹ .app` | 4 | season, armory, broadcast | h 42 · r 50 · pad 1 6 1 6 · 16.5/400 · var(--ink2\|--r-home) | yes | — | G H J T | neutral |  |
| F08c90ec | `span.pt.staged ‹ .tk` | 4 | season | h 18.5 · r 3 · 16.5/400 · var(--ink) | yes | `app.css:194` `app.css:196` `app.css:206` `app.css:208` `app.css:1081` `app.css:1082` `app.css:1819` `app.css:1838` +24 | G H J T | neutral |  |
| F9fc9272 | `button.attx ‹ .attrow` | 4 | armory | h 26 · r 6 · pad 1 6 1 6 · 12/400 · var(--ink3) | yes | `app.css:2998` `app.css:3000` `app.css:3001` `app.css:6505` | G H J T | neutral |  |
| Fb68ae96 | `button ‹ .tbdsw` | 3 | season | h 34 · r 999 · pad 10 14 10 14 · 9.5/600 ls 0.665px · var(--ink) | yes | `app.css:1246` `app.css:1261` `app.css:1262` `app.css:1263` `app.css:1264` `app.css:4174` `app.css:4178` `app.css:4183` | G H J T | neutral |  |
| F45fae65 | `button ‹ .tbdsw` | 3 | season | h 34 · r 999 · pad 10 14 10 14 · 9.5/600 ls 0.665px · var(--ink3) | yes | `app.css:1246` `app.css:1261` `app.css:1262` `app.css:1263` `app.css:1264` `app.css:4174` `app.css:4178` `app.css:4183` | G H J T | neutral |  |
| Fa1287c3 | `span.pt.staged ‹ .tk` | 2 | season | h 18.5 · r 3 · 16.5/400 · var(--ink) | yes | `app.css:194` `app.css:196` `app.css:206` `app.css:208` `app.css:1081` `app.css:1082` `app.css:1819` `app.css:1838` +24 | G H J T | neutral |  |
| F5b950bb | `div.bar.staged ‹ .tk`<br>`div.bar.staged.flagged ‹ .tk` | 2 | season | h 21 · r 3 · pad 0 8 0 8 · 12/600 · var(--dw) | yes | `tokens.css:481` `tokens.css:485` `tokens.css:498` `tokens.css:503` `tokens.css:508` `app.css:182` `app.css:185` `app.css:186` +64 | G H J T | neutral |  |
| Fd2576ce | `div.bar.staged.lbl-out ‹ .tk`<br>`div.bar.staged ‹ .tk` | 2 | season | h 21 · r 3 · pad 0 8 0 8 · 12/600 · var(--ev) | yes | `tokens.css:481` `tokens.css:485` `tokens.css:498` `tokens.css:503` `tokens.css:508` `app.css:182` `app.css:185` `app.css:186` +64 | G H J T | neutral |  |
| F1f430bd ·d35 | `button.pill ‹ .racktools` | 2 | armory | h 31 · r 999 · pad 8 13 8 13 · 13/500 · var(--ink2\|--r-home) | yes | `app.css:480` `app.css:481` `app.css:714` `app.css:2125` `app.css:3939` `app.css:3943` `app.css:3944` `app.css:3945` +24 | G H J T | neutral |  |
| Fb074ed5 | `button.bgt ‹ .badgerow`<br>`button.bgt.tox ‹ .badgerow` | 2 | armory | h 32 · r 6 · pad 7 11 7 11 · 9.5/600 caps ls 0.95px · var(--ink3) | yes | `app.css:3008` `app.css:3011` `app.css:3012` `app.css:3013` `app.css:3014` `app.css:3015` | G H J T | neutral |  |
| F070f5b1 | `button ‹ .v2-row` | 2 | armory | h 28.5 · r 6 · pad 8 12 8 12 · 10.5/600 · var(--dc-mute) | yes | `v2card.css:46` | G H J T | neutral |  |
| Fa07c1a2 | `button.step-btn ‹ .stepper` | 2 | broadcast | h 44 · pad 1 6 1 6 · 14.5/700 · var(--ink3) | yes | `app.css:6832` `app.css:6834` `app.css:6835` | G H J T | neutral |  |
| F01bec74 | `button.step-btn ‹ .stepper` | 2 | broadcast | h 44 · pad 1 6 1 6 · 14.5/700 · var(--ink2\|--r-home) | yes | `app.css:6832` `app.css:6834` `app.css:6835` | G H J T | neutral |  |
| F0068487 | `button.whobtn ‹ .who` | 1 | home | h 34 · r 6 · pad 4 8 4 5 · 12/500 · var(--ink2\|--r-home) | yes | `app.css:1385` `app.css:1388` `app.css:1389` `app.css:4156` `app.css:4157` `app.css:4159` `app.css:4160` | G H J T | neutral |  |
| Fa5cecea | `button ‹ .lnsw` | 1 | season | h 22.5 · r 3 · pad 6 12 6 12 · 10.5/600 ls 0.42px · var(--ink) | yes | `app.css:1275` `app.css:1277` `app.css:1278` | G H J T | neutral |  |
| F45e6647 | `button ‹ .lnsw` | 1 | season | h 22.5 · r 3 · pad 6 12 6 12 · 10.5/600 ls 0.42px · var(--ink3) | yes | `app.css:1275` `app.css:1277` `app.css:1278` | G H J T | neutral |  |
| F4497828 | `div.idsum ‹ .identity` | 1 | season | h 289.5 · pad 15 17 15 17 · 16.5/400 · var(--ink) | yes | `app.css:1444` `app.css:1445` `app.css:1453` `app.css:3340` `app.css:3352` `app.css:3354` | G H J T | neutral |  |
| Fbef17c7 | `button.lnh ‹ .lane` | 1 | season | h 60 · pad 0 11 0 9 · 10.5/700 caps ls 1.05px · var(--patch\|--pn) | yes | `app.css:4014` `app.css:4021` `app.css:4022` `app.css:4024` `app.css:4025` `app.css:4033` `app.css:4034` `app.css:4102` +8 | G H J T | neutral |  |
| Ff7d1de1 | `button.ptc.mark.stack.same ‹ .tk` | 1 | season | h 21 · r 3 · 16.5/400 · var(--ink) | yes | `app.css:3854` `app.css:3855` `app.css:4057` `app.css:4061` `app.css:4063` `app.css:4065` `app.css:4067` `app.css:6181` +7 | G H J T | neutral |  |
| Febfcebf | `button.lnh ‹ .lane` | 1 | season | h 36 · pad 0 11 0 9 · 10.5/700 caps ls 1.05px · var(--patch\|--pn) | yes | `app.css:4014` `app.css:4021` `app.css:4022` `app.css:4024` `app.css:4025` `app.css:4033` `app.css:4034` `app.css:4102` +8 | G H J T | neutral |  |
| F082eeba | `button ‹ .mh-mode` | 1 | armory | h 44 · r 6 · pad 0 24 0 24 · 16.5/700 ls 1.98px · var(--ink) | yes | `app.css:2475` `app.css:2484` `app.css:2486` `app.css:2488` `app.css:2489` | G H J T | neutral |  |

## Row · 15

Takes: R Row hover · S Spacing scale.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| Ff3dfdf6 | `button.wg-code ‹ .wg-r` | 2829 | armory | h 44 · 16.5/400 · var(--ink) | yes | `app.css:595` `app.css:596` `app.css:603` `app.css:604` `app.css:631` | R S | row (by parent) |  |
| F0fce030 ·d5 | `div.brow ‹ .bgrp`<br>`div.brow.aged ‹ .bgrp` | 2101 | armory | h 29 · pad 7 8 7 10 · 16.5/400 · var(--ink) | yes | `app.css:6685` `app.css:6687` `app.css:6688` `app.css:6696` `app.css:6697` `app.css:6698` `app.css:6699` `app.css:6701` +2 | R S | row |  |
| Fb543ebb | `a.round-u ‹ .round` | 160 | armory, broadcast, access, analytics, history | h 19.5 · r 3 · pad 4 6 4 6 · 9.5/600 caps ls 0.76px · var(--ink3) | yes | `app.css:734` `app.css:738` `app.css:739` `app.css:740` `app.css:741` `app.css:744` `app.css:746` | R S | row |  |
| Fc219709 ·d15 | `div.brow.bad.aged ‹ .bgrp`<br>`div.brow.bad ‹ .bgrp` | 148 | armory | h 29 · pad 7 8 7 10 · 16.5/400 · var(--ink) | yes | `app.css:6685` `app.css:6687` `app.css:6688` `app.css:6696` `app.css:6697` `app.css:6698` `app.css:6699` `app.css:6701` +32 | R S | row |  |
| F911fc4a ·d15 | `div.brow.bad.nocode ‹ .bgrp` | 36 | armory | h 29.5 · pad 7 8 7 10 · 16.5/400 · var(--ink) | yes | `app.css:6685` `app.css:6687` `app.css:6688` `app.css:6696` `app.css:6697` `app.css:6698` `app.css:6699` `app.css:6701` +32 | R S | row |  |
| F99dd6c0 | `button.rvdrop ‹ .rvopwrap` | 32 | review | h 22 · r 6 · pad 1 6 1 6 · 12/400 · var(--ink3) | yes | `app.css:2898` `app.css:2902` `app.css:2903` `app.css:2904` | R S | row (by parent) |  |
| F55d0bfb | `button.bexp ‹ .bencf` | 18 | broadcast | h 44 · r 6 · pad 0 12 0 12 · 12/600 · var(--ink2\|--r-home) | yes | `app.css:416` `app.css:417` `app.css:418` | R S | row (by parent) |  |
| F2a8a4a4 | `button.rvop ‹ .rvopwrap` | 17 | review | h 60.5 · r 6 · pad 11 12 11 12 · 16.5/400 · var(--ink) | yes | `app.css:2691` `app.css:2694` `app.css:2695` `app.css:2696` `app.css:2698` `app.css:2700` `app.css:2701` `app.css:2702` +4 | R S | row |  |
| F7c3c814 | `button.tile ‹ .tiles`<br>`button.tile.warn ‹ .tiles` | 16 | analytics | h 120.5 · r 6 · pad 15 16 15 16 · 16.5/400 · var(--ink) | yes | `app.css:2595` `app.css:2596` `app.css:2598` `app.css:2600` `app.css:2601` `app.css:2602` `app.css:2786` `app.css:2787` +20 | R S | row |  |
| Fb1913ec ·d5 | `div.brow ‹ .bgrp` | 8 | armory | h 29.5 · pad 7 8 7 10 · 16.5/400 · var(--ink) | yes | `app.css:6685` `app.css:6687` `app.css:6688` `app.css:6696` `app.css:6697` `app.css:6698` `app.css:6699` `app.css:6701` +2 | R S | row |  |
| Fd0de322 | `button.rvop ‹ .rvopwrap` | 7 | review | h 60.5 · r 6 · pad 11 12 11 12 · 16.5/400 · var(--ink) | yes | `app.css:2691` `app.css:2694` `app.css:2695` `app.css:2696` `app.css:2698` `app.css:2700` `app.css:2701` `app.css:2702` +4 | R S | row |  |
| Fd5cd9b3 | `button.rvop ‹ .rvopwrap` | 7 | review | h 78.5 · r 6 · pad 11 12 11 12 · 16.5/400 · var(--ink) | yes | `app.css:2691` `app.css:2694` `app.css:2695` `app.css:2696` `app.css:2698` `app.css:2700` `app.css:2701` `app.css:2702` +4 | R S | row |  |
| F95f923c | `a.att-row.s-spof ‹ .att-list` | 3 | home | h 73 · r 10 · pad 16 20 16 20 · 16.5/400 · var(--ink) | yes | `app.css:4189` `app.css:4192` `app.css:4193` `app.css:4194` `app.css:4195` `app.css:4196` `app.css:4205` `app.css:4206` +22 | R S | row |  |
| Fdb409aa | `a.att-row.s-forever ‹ .att-list` | 3 | home | h 72 · r 3 · pad 16 20 16 20 · 16.5/400 · var(--ink) | yes | `app.css:4189` `app.css:4192` `app.css:4193` `app.css:4194` `app.css:4195` `app.css:4196` `app.css:4205` `app.css:4206` +22 | R S | row |  |
| F219bc37 | `button.rvop ‹ .rvopwrap` | 1 | review | h 78.5 · r 6 · pad 11 12 11 12 · 16.5/400 · var(--ink) | yes | `app.css:2691` `app.css:2694` `app.css:2695` `app.css:2696` `app.css:2698` `app.css:2700` `app.css:2701` `app.css:2702` +4 | R S | row |  |

## Fields · 33

Takes: Fi Field hover · M Dark grounds · J Corners · S Spacing scale · T Text sizes.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| F0939dad ·d7 | `input.edit ‹ .ncell` | 1502 | season | h 44 · r 6 · pad 8 10 8 10 · 14.5/500 · var(--ink) | yes | `app.css:1169` `app.css:1171` `app.css:1172` `app.css:1720` | Fi M J S T | field |  |
| Fa099d01 | `input.cb-in ‹ .cmdbar` | 111 | home, season, armory, broadcast, access, analytics, history, review | h 17 · 13/400 · var(--ink) | yes | `app.css:4124` `app.css:4125` `app.css:4126` `app.css:4291` `app.css:4292` | Fi M J S T | field |  |
| Ff089f21 | `input ‹ .addrow` | 80 | season | h 44 · r 6 · pad 8 10 8 10 · 16.5/400 · var(--ink) | yes | `app.css:981` | Fi M J S T | field |  |
| F6184bf3 | `input ‹ .srch` | 79 | season, armory, broadcast, analytics, history | h 44 · r 6 · pad 8 10 8 40 · 16.5/400 · var(--ink) | yes | `app.css:363` `app.css:638` | Fi M J S T | field |  |
| Ff1fa867 ·d7 | `input.nw-i ‹ .ow-i`<br>`input.nw-i ‹ .nw-f` | 49 | season | h 44 · r 6 · pad 8 10 8 10 · 14.5/400 · var(--ink) | yes | `app.css:1302` `app.css:3916` `app.css:3918` `app.css:5362` `app.css:5363` | Fi M J S T | field |  |
| Fbe5c4d0 | `input ‹ .dwfield`<br>`input.ati ‹ .atr`<br>`input ‹ .banner-row` +1 | 47 | armory, access, broadcast | h 44 · r 6 · pad 8 10 8 10 · 13/500 · var(--ink) | yes | `app.css:4897` `app.css:4899` `app.css:5362` `app.css:1957` `app.css:1959` `app.css:6808` | Fi M J S T | field |  |
| F23db770 ·d28 | `input ‹ .addrow` | 40 | season | h 44 · r 6 · pad 8 10 8 10 · 16.5/400 · var(--ink) | yes | `app.css:981` | Fi M J S T | field |  |
| Fb6ba385 | `select ‹ .addrow` | 40 | season | h 41 · r 6 · pad 8 10 8 10 · 16.5/400 · var(--ink) | yes | `app.css:981` | Fi M J S T | field |  |
| F03314ef | `input.nw-i.nw-smart` | 9 | season | h 44 · r 6 · pad 8 10 8 10 · 14.5/400 · var(--ink) | yes | `app.css:1302` `app.css:3916` `app.css:3918` `app.css:5362` `app.css:5363` | Fi M J S T | field |  |
| F877f089 | `select ‹ .dwfield` | 8 | armory | h 37 · r 6 · pad 8 10 8 10 · 13/500 · var(--ink) | yes | `app.css:6217` `app.css:6220` | Fi M J S T | field |  |
| F812f763 | `input ‹ .bf-tog` | 6 | armory | h 15 · 13/500 · var(--ink) | yes | `app.css:4910` `app.css:4911` | Fi M J S T | field |  |
| F3bd010f | `input.has-hits ‹ .srch` | 4 | season, armory, broadcast, history | h 44 · r 6 · pad 8 10 8 40 · 16.5/400 · var(--ink) | yes | `app.css:363` | Fi M J S T | field |  |
| F31620ff ·d28 | `input.atti ‹ .attrow` | 4 | armory | h 44 · r 6 · pad 8 10 8 10 · 16.5/500 · var(--ink) | yes | `app.css:2996` | Fi M J S T | field |  |
| Fbdc4352 | `input.atts ‹ .attrow` | 4 | armory | h 44 · r 6 · pad 8 10 8 10 · 10.5/500 · var(--ink) | yes | `app.css:2997` `app.css:4338` | Fi M J S T | field |  |
| Fed91885 ·d7 | `input ‹ .dline` | 3 | season | h 44 · r 6 · pad 8 10 8 10 · 14.5/500 · var(--ink) | yes | `app.css:1232` `app.css:1234` `app.css:1235` `app.css:1236` `app.css:1238` `app.css:1239` | Fi M J S T | field |  |
| Fb19e281 | `input ‹ .dline` | 3 | season | h 44 · r 6 · pad 8 10 8 10 · 12/500 · var(--ink) | yes | `app.css:1232` `app.css:1234` `app.css:1235` `app.css:1236` `app.css:1238` `app.css:1239` | Fi M J S T | field |  |
| Fc2653e3 | `input ‹ .ban` | 3 | season | h 44 · r 6 · pad 8 10 8 10 · 12/400 · var(--ink2\|--r-home) | yes | `app.css:1475` `app.css:1477` `app.css:1478` `app.css:1479` | Fi M J S T | field |  |
| Fa8f7399 | `input ‹ .bf-buildno-wrap` | 3 | armory | h 44 · r 6 · pad 8 10 8 76 · 13/500 · var(--ink) | yes | — | Fi M J S T | field |  |
| F0396553 | `input ‹ .dwfield` | 3 | armory | h 44 · r 6 · pad 8 10 8 10 · 12/600 ls 0.72px · var(--ink) | yes | `app.css:1957` `app.css:1959` | Fi M J S T | field |  |
| Fb453ec4 ·d47 | `textarea ‹ .dwfield` | 3 | armory | h 88 · r 6 · pad 8 10 8 10 · 12/500 · var(--ink) | yes | `app.css:6217` `app.css:6219` `app.css:6220` | Fi M J S T | field |  |
| F6b0a15b | `textarea.nw-i.nw-ta ‹ .nw-f` | 2 | season | h 166.5 · r 6 · pad 8 10 8 10 · 16.5/400 · var(--ink) | yes | `app.css:1302` `app.css:3916` `app.css:3918` `app.css:5362` `app.css:5363` `app.css:6321` `app.css:6322` | Fi M J S T | field |  |
| Ff7afdde | `textarea.nw-i.nw-ta ‹ .nw-f` | 2 | season | h 117 · r 6 · pad 8 10 8 10 · 16.5/400 · var(--ink) | yes | `app.css:1302` `app.css:3916` `app.css:3918` `app.css:5362` `app.css:5363` `app.css:6321` `app.css:6322` | Fi M J S T | field |  |
| F08d21ab | `input ‹ .dwfield` | 2 | armory, access | h 44 · r 6 · pad 8 10 8 10 · 13/500 · var(--ink) | yes | `app.css:1957` `app.css:1959` | Fi M J S T | field |  |
| Ff544853 | `input ‹ .dwfield` | 2 | armory | h 44 · r 6 · pad 8 10 8 10 · 13/500 · var(--ink) | yes | `app.css:1957` `app.css:1959` | Fi M J S T | field |  |
| F1761e9b ·d47 | `textarea ‹ .dwfield` | 2 | broadcast | h 90 · r 6 · pad 8 10 8 10 · 12/500 · var(--ink) | yes | `app.css:6217` `app.css:6219` `app.css:6220` | Fi M J S T | field |  |
| Fe20b7d0 | `input ‹ .seg-sw-inline` | 2 | broadcast | h 13 · 13/500 · var(--ink) | yes | `app.css:6822` | Fi M J S T | field |  |
| Fbd6e43f | `input ‹ .f-main` | 1 | season | h 44 · r 6 · pad 8 10 8 10 · 17/600 ls -0.17px · var(--ink) | yes | `app.css:1220` `app.css:1222` `app.css:1508` `app.css:1509` | Fi M J S T | field |  |
| F2ab2443 | `textarea.nw-i.nw-ta ‹ .nw-f` | 1 | season | h 166.5 · r 6 · pad 8 10 8 10 · 16.5/400 · var(--ink) | yes | `app.css:1302` `app.css:3916` `app.css:3918` `app.css:5362` `app.css:5363` `app.css:6321` `app.css:6322` | Fi M J S T | field |  |
| Fb408e5c | `input.tc-in ‹ .dw-b` | 1 | season | h 44 · r 6 · pad 8 10 8 10 · 14.5/500 ls 1.45px · var(--ink) | yes | `app.css:4681` `app.css:4683` | Fi M J S T | field |  |
| Ff63137f | `input ‹ .dwfield` | 1 | armory | h 44 · r 6 · pad 8 10 8 10 · 13/500 · var(--ink) | yes | `app.css:1957` `app.css:1959` | Fi M J S T | field |  |
| F81fdc70 | `input ‹ .bed-code` | 1 | armory | h 44 · r 6 · pad 8 10 8 10 · 13/500 ls 1.04px · var(--ink) | yes | `app.css:2989` | Fi M J S T | field |  |
| Fd38ebf4 | `textarea.builds-ta ‹ .bf-sec` | 1 | armory | h 234 · r 6 · pad 8 10 8 10 · 12/500 · var(--ink) | yes | `app.css:6773` `app.css:6775` | Fi M J S T | field |  |
| Fbbac7ba | `input.edit` | 1 | broadcast | h 44 · r 6 · pad 8 10 8 10 · 14.5/400 · var(--ink2\|--r-home) | yes | `app.css:1169` `app.css:1171` `app.css:1172` `app.css:1720` | Fi M J S T | field |  |

## Menu item · 4

Takes: Mi Menu item hover · T Text sizes.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| Fd4439f0 | `button.pitem ‹ .plist` | 12 | season | h 33.5 · r 6 · pad 9 10 9 10 · 13/500 · var(--ink2\|--r-home) | yes | `app.css:1433` `app.css:1435` `app.css:1436` `app.css:1438` `app.css:4137` `app.css:4139` `app.css:4140` `app.css:5370` +3 | Mi T | menuitem |  |
| F049cda4 | `a.mi.mi-out ‹ .usec` | 3 | home | h 33 · r 6 · pad 10 14 10 14 · 13/500 · var(--ink2\|--r-home) | yes | `app.css:1391` `app.css:1393` `app.css:1798` `app.css:1800` `app.css:1802` `app.css:1803` `app.css:1804` `app.css:1806` +12 | Mi T | menuitem |  |
| Fc7808e7 | `button.mi ‹ .usec` | 2 | home | h 35 · r 6 · pad 10 14 10 14 · 13/500 · var(--ink2\|--r-home) | yes | `app.css:1391` `app.css:1393` `app.css:1798` `app.css:1800` `app.css:1802` `app.css:1803` `app.css:1804` `app.css:1806` +9 | Mi T | menuitem |  |
| Fb20fd77 | `li.wsrch-opt.on ‹ .wsrch-list` | 1 | armory | h 32 · r 3 · pad 7 9 7 9 · 16.5/400 · var(--ink) | yes | `app.css:6444` `app.css:6445` `app.css:6446` `app.css:6447` `app.css:6448` `app.css:689` `app.css:693` `app.css:694` +23 | Mi T | menuitem |  |

## Link · 4

Takes: T Text sizes.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| Fc84d96e | `a ‹ .sc-none` | 3 | home | h 16 · 12/400 · var(--ink) | yes | — | T | link |  |
| F1793c85 | `a.chip.lmorechip ‹ .lp` | 3 | home | h 32 · r 999 · pad 6 11 6 11 · 12/600 · var(--ink2\|--r-home) | yes | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +40 | T | link |  |
| Fdb80f2a | `a.hlink` | 3 | home | h 16 · 12/600 caps ls 1.2px · var(--ink3) | yes | `app.css:516` `app.css:517` | T | link |  |
| F404bb9c | `a ‹ .un` | 1 | home | h 17 · 13/400 · var(--ink) | yes | `app.css:5232` `app.css:5233` | T | link |  |

## Panels and cards · 194

Takes: J Corners · S Spacing scale · M Dark grounds.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| F4d9b595 | `span.cb`<br>`span.cb ‹ .wg-cb` | 6048 | season, analytics, history, armory | h - · r 3 · undefined/undefined |  | `app.css:534` `app.css:692` `app.css:693` `app.css:694` `app.css:5419` `app.css:6044` | J S | panel |  |
| F03dfddb | `span.wg-ig ‹ .wg-code` | 2829 | armory | h - · r 6 · undefined/undefined |  | `app.css:597` `app.css:603` `app.css:605` `app.css:631` | J S | panel |  |
| F1de7e8d | `span.wg-igf ‹ .wg-ig` | 2829 | armory | h - · r 6 · pad 0 12 0 12 · undefined/undefined |  | `app.css:598` | J S | panel |  |
| F2b545a7 | `i.ld ‹ .lrow`<br>`span.dot ‹ .pill`<br>`span.mini ‹ .scrub-track` +4 | 1706 | home, season | h - · r 3 · undefined/undefined |  | `app.css:5177` `app.css:695` `app.css:1719` `app.css:3946` `app.css:4476` `app.css:890` `app.css:1604` `app.css:4026` +15 | J S | panel |  |
| F94d0caf | `span.rec-mk ‹ .rec-row`<br>`span.spark ‹ .drop-sm`<br>`span.spark ‹ .sparkwrap` +4 | 1640 | season, broadcast, analytics | h - · r 3 · undefined/undefined |  | `app.css:5974` `app.css:5976` `app.css:1150` `app.css:1152` `app.css:1153` `app.css:1154` `app.css:1156` `app.css:1158` +18 | J S | panel |  |
| F5c6596e | `span.rec-mk ‹ .rec-row`<br>`i ‹ .chip`<br>`span.nowdot ‹ .spark` | 1624 | season | h - · r 3 · undefined/undefined |  | `app.css:5974` `app.css:5976` `app.css:1156` `app.css:1755` `app.css:1760` | J S | panel |  |
| F05f8c28 | `span.dot ‹ .pill`<br>`span.mini ‹ .scrub-track`<br>`span.lnh-d ‹ .lnh` +3 | 1326 | season | h - · r 3 · undefined/undefined |  | `app.css:695` `app.css:1719` `app.css:3946` `app.css:4476` `app.css:890` `app.css:1604` `app.css:4026` `app.css:186` +14 | J S | panel |  |
| Fd127d0e | `div.bgrp.t-top3 ‹ .trow-body`<br>`div.bgrp.t-top4 ‹ .trow-body`<br>`div.bgrp.t-top5 ‹ .trow-body` +1 | 1119 | armory | h - · r 6 · undefined/undefined |  | `app.css:4244` `app.css:4247` `app.css:4324` `app.css:4327` `app.css:6409` `app.css:6416` `app.css:6425` `app.css:6426` +1 | J S | panel |  |
| F2991e56 | `i.ld0 ‹ .lsum` | 1029 | season | h - · r 3 · undefined/undefined |  | `app.css:5495` | J S | panel |  |
| F76244b8 | `span.done ‹ .saved`<br>`span.done ‹ .staged` | 796 | season | h - · r 3 · undefined/undefined |  | `app.css:1158` `app.css:2707` `app.css:2727` `app.css:2728` `app.css:4669` `app.css:4670` | J S | panel |  |
| F1bafc82 | `i.ld ‹ .lrow`<br>`span.dot ‹ .pill`<br>`span.mini ‹ .scrub-track` +5 | 794 | home, season, analytics | h - · r 3 · undefined/undefined |  | `app.css:5177` `app.css:695` `app.css:1719` `app.css:3946` `app.css:4476` `app.css:890` `app.css:1604` `app.css:4026` +17 | J S | panel |  |
| F4bd7fe4 | `span.dot ‹ .pill`<br>`span.mini ‹ .scrub-track`<br>`span.lnh-d ‹ .lnh` +4 | 515 | season | h - · r 3 · undefined/undefined |  | `app.css:695` `app.css:1719` `app.css:3946` `app.css:4476` `app.css:890` `app.css:1604` `app.css:4026` `app.css:186` +16 | J S | panel |  |
| Ff38aff5 | `span.mini ‹ .scrub-track`<br>`span.lnh-d ‹ .lnh`<br>`span.dot ‹ .ncell` +1 | 383 | season | h - · r 3 · undefined/undefined |  | `app.css:890` `app.css:1604` `app.css:4026` `app.css:695` `app.css:1719` `app.css:3946` `app.css:4476` `app.css:186` +13 | J S | panel |  |
| Fd88f249 | `i.catdot ‹ .trow-k`<br>`i ‹ .bgrp-w` | 347 | armory | h - · r 3 · undefined/undefined |  | `app.css:6385` `app.css:4265` | J S | panel |  |
| F9f6f176 | `span.att-b ‹ .att-row`<br>`i.ld ‹ .lrow`<br>`span.mini ‹ .scrub-track` +5 | 297 | home, season, analytics | h - · r 3 · undefined/undefined |  | `app.css:4199` `app.css:5125` `app.css:5177` `app.css:890` `app.css:1604` `app.css:893` `app.css:894` `app.css:895` +34 | J S | panel |  |
| Ff3d62c0 | `i.catdot ‹ .trow-k`<br>`i ‹ .bgrp-w` | 292 | armory | h - · r 3 · undefined/undefined |  | `app.css:6385` `app.css:4265` | J S | panel |  |
| Fb8e9458 | `section.panel`<br>`section.panel.rise`<br>`div.tray.collapsed ‹ .app` +4 | 209 | home, season, armory, broadcast, access, analytics, history, review | h - · r 6 · undefined/undefined |  | `app.css:92` `app.css:135` `app.css:137` `app.css:856` `app.css:1043` `app.css:2258` `app.css:2268` `app.css:2269` +26 | J S | panel |  |
| Fc353e09 | `i.catdot ‹ .trow-k`<br>`i ‹ .bgrp-w` | 202 | armory | h - · r 3 · undefined/undefined |  | `app.css:6385` `app.css:4265` | J S | panel |  |
| F994e249 | `div.lane ‹ .lanes`<br>`div.lane.lnc ‹ .lanes` | 184 | season, broadcast | h - · r 6 · pad 0 0 0 138 · undefined/undefined |  | `app.css:251` `app.css:256` `app.css:257` `app.css:267` `app.css:906` `app.css:907` `app.css:1015` `app.css:1092` +17 | J S | panel |  |
| Fe79d96f ·d17 | `i ‹ .mxcell` | 168 | access | h - · r 4 · undefined/undefined |  | `app.css:2418` `app.css:2420` `app.css:2422` `app.css:2425` `app.css:2432` `app.css:2435` `app.css:3620` `app.css:3622` +5 | J S | panel |  |
| F7b42c0b | `i.catdot ‹ .trow-k`<br>`i ‹ .bgrp-w` | 164 | armory | h - · r 3 · undefined/undefined |  | `app.css:6385` `app.css:4265` | J S | panel |  |
| Fd070eda ·d16 | `div.trow.tcat.tclosed ‹ .rack`<br>`div.trow.tcat ‹ .rack`<br>`div.imgbox ‹ .bed-sec` | 146 | armory | h - · r 6 · undefined/undefined |  | `app.css:1983` `app.css:2243` `app.css:2291` `app.css:2292` `app.css:2293` `app.css:2294` `app.css:2313` `app.css:3313` +21 | J S | panel |  |
| F8826183 | `i.catdot ‹ .trow-k`<br>`i ‹ .bgrp-w` | 146 | armory | h - · r 3 · undefined/undefined |  | `app.css:6385` `app.css:4265` | J S | panel |  |
| Fd58c5ff | `i.catdot ‹ .trow-k`<br>`i ‹ .bgrp-w` | 130 | armory | h - · r 3 · undefined/undefined |  | `app.css:6385` `app.css:4265` | J S | panel |  |
| F25f76cc | `div.bgrp.t-best ‹ .trow-body` | 129 | armory | h - · r 6 · undefined/undefined |  | `app.css:4244` `app.css:4247` `app.css:4324` `app.css:4327` `app.css:6409` `app.css:6416` `app.css:6425` `app.css:6426` +1 | J S | panel |  |
| Fcc5e8c1 | `div.srec-c.srec-tile.dead ‹ .srec-tiles`<br>`div.srec-c.srec-tile.has-img ‹ .srec-tiles`<br>`div.srec-c.srec-tile.off ‹ .srec-tiles` | 117 | season | h - · r 6 · pad 9 10 9 10 · undefined/undefined |  | `app.css:5697` `app.css:5699` `app.css:5700` `app.css:5701` `app.css:5703` `app.css:5706` `app.css:5708` `app.css:5710` +14 | J S | panel |  |
| F789f9f3 | `i.catdot ‹ .trow-k`<br>`i ‹ .bgrp-w` | 112 | armory | h - · r 3 · undefined/undefined |  | `app.css:6385` `app.css:4265` | J S | panel |  |
| F59a9ddb | `div.cmdbar` | 109 | home, season, armory, broadcast, access, analytics, history, review | h - · r 10 · pad 0 11 0 11 · undefined/undefined |  | `app.css:4112` `app.css:4115` `app.css:4117` `app.css:4118` `app.css:4122` `app.css:4123` `app.css:4129` `app.css:4131` +5 | J S | panel |  |
| F53c5ac5 | `span.cb-mag ‹ .cmdbar` | 109 | home, season, armory, broadcast, access, analytics, history, review | h - · r 50 · undefined/undefined |  | `app.css:4119` `app.css:4120` `app.css:4122` `app.css:4123` | J S | panel |  |
| Ffaa8762 | `div.seg ‹ .ph`<br>`span.seg ‹ .mt-grp` | 109 | season, armory, broadcast, analytics | h - · r 999 · pad 3 3 3 3 · undefined/undefined |  | `app.css:143` `app.css:144` `app.css:152` `app.css:153` `app.css:2846` `app.css:4174` `app.css:4176` `app.css:4177` +3 | J S | panel |  |
| F9d67097 | `section.panel.rise`<br>`section.panel` | 83 | season, armory, broadcast, access | h - · r 6 · undefined/undefined |  | `app.css:92` `app.css:135` `app.css:137` `app.css:856` `app.css:1043` `app.css:2258` `app.css:2268` `app.css:2269` +1 | J S | panel |  |
| Fe08ac7c | `em ‹ .d` | 79 | season | h - · r 50 · undefined/undefined |  | `app.css:5718` `app.css:5720` `app.css:5743` `app.css:5747` | J S | panel |  |
| F13e9b78 | `i.dfk ‹ .dflag`<br>`i ‹ .dnotch` | 72 | season | h - · r 3 · undefined/undefined |  | `app.css:4079` `app.css:6142` `app.css:6144` `app.css:6145` | J S | panel |  |
| F9ccaadf | `i.dfk ‹ .dflag`<br>`i ‹ .dnotch` | 72 | season | h - · r 3 · undefined/undefined |  | `app.css:4079` `app.css:6142` `app.css:6144` `app.css:6145` | J S | panel |  |
| F1749471 | `div.cmeter.bcast ‹ .dwfield`<br>`span.dt ‹ .depb`<br>`span.lt ‹ .lvlb` | 66 | broadcast, analytics | h - · r 3 · undefined/undefined |  | `app.css:1884` `app.css:1892` `app.css:1894` `app.css:1895` `app.css:1896` `app.css:1918` `app.css:6800` `app.css:6801` +14 | J S | panel |  |
| Fcd726c3 | `i ‹ .mxcell` | 64 | access | h - · r 4 · undefined/undefined |  | `app.css:2418` `app.css:2420` `app.css:2422` `app.css:2425` `app.css:2432` `app.css:2435` `app.css:3620` `app.css:3622` +5 | J S | panel |  |
| Fe62b186 | `i ‹ .lt`<br>`span.dot ‹ .ncell` | 58 | analytics, history | h - · r 3 · undefined/undefined |  | `app.css:695` `app.css:1719` `app.css:3946` `app.css:4476` `app.css:3156` `app.css:3158` `app.css:3159` `app.css:3161` +2 | J S | panel |  |
| F0bc61cc | `span.sev.info` | 55 | history | h - · r 50 · undefined/undefined |  | `app.css:2638` `app.css:2639` `app.css:320` | J S | panel |  |
| F71619bd ·d26 | `i ‹ .l` | 50 | season, broadcast | h - · r 3 · undefined/undefined |  | `app.css:156` | J S | panel |  |
| F52faff4 | `i ‹ .msev` | 48 | analytics, history | h - · r 1 · undefined/undefined |  | `app.css:366` `app.css:367` `app.css:368` `app.css:369` `app.css:370` | J S | panel |  |
| Fa4a79bc | `span.wg-ig.none ‹ .wg-r` | 46 | armory | h - · r 6 · undefined/undefined |  | `app.css:597` `app.css:603` `app.css:605` `app.css:631` `app.css:744` `app.css:1281` `app.css:1745` `app.css:1939` +4 | J S | panel |  |
| F17ec0a0 | `i.staged ‹ .spark`<br>`i ‹ .rk-clean` | 45 | season, armory | h - · r 3 · undefined/undefined |  | `app.css:187` `app.css:196` `app.css:393` `app.css:578` `app.css:698` `app.css:943` `app.css:1078` `app.css:1153` +8 | J S | panel |  |
| F764ce70 | `img.srec-thumb ‹ .t`<br>`div.dwfield.code-field ‹ .bf-sec`<br>`div.stepper ‹ .repeat-row` +1 | 44 | season, armory, broadcast | h - · r 6 · undefined/undefined |  | `app.css:5737` `app.css:494` `app.css:496` `app.css:1953` `app.css:1956` `app.css:1957` `app.css:1959` `app.css:2987` +14 | J S M | panel | Dark grounds |
| F08dc502 ·d30 | `div.srec-grid ‹ .srec`<br>`div.covfacts` | 40 | season, armory | h - · r 6 · pad 14 16 14 16 · undefined/undefined |  | `app.css:5640` `app.css:5787` `app.css:3092` `app.css:3094` | J S | panel |  |
| F46e659e | `i ‹ .chip` | 40 | season | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| Fa919176 | `i ‹ .chip` | 40 | season | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| Ff8d19ef | `i ‹ .chip` | 40 | season | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| F556218e | `i ‹ .chip` | 40 | season | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| F3b218ab | `i ‹ .chip` | 40 | season | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| Ff97f6ba | `section.ow` | 40 | season | h - · r 10 · pad 0 0 0 9 · undefined/undefined |  | `app.css:4622` `app.css:4625` `app.css:4631` | J S | panel |  |
| F5020f98 | `section.identity.collapsed.rise`<br>`section.identity`<br>`section.identity.collapsed` | 39 | season | h - · r 6 · undefined/undefined |  | `app.css:880` `app.css:1043` `app.css:1452` `app.css:1453` `app.css:1456` `app.css:1498` `app.css:1506` `app.css:1507` +14 | J S | panel |  |
| F6e4feca ·d18 | `i ‹ .cmeter`<br>`i ‹ .dt`<br>`i ‹ .lt` +2 | 38 | armory, analytics, history | h - · r 3 · undefined/undefined |  | `app.css:695` `app.css:1719` `app.css:3946` `app.css:4476` `app.css:1892` `app.css:1895` `app.css:1896` `app.css:1918` +12 | J S | panel |  |
| F46aec84 ·d16 | `div.zoomer ‹ .ph`<br>`div.lnsw ‹ .ph` | 37 | season | h - · r 6 · pad 2 2 2 2 · undefined/undefined |  | `app.css:1323` `app.css:1325` `app.css:1328` `app.css:1329` `app.css:1330` `app.css:1331` `app.css:1333` `app.css:1825` +9 | J S | panel |  |
| Ffe21506 | `div.scrub ‹ .tk-inner` | 36 | season | h - · r 6 · pad 5 7 5 7 · undefined/undefined |  | `app.css:890` `app.css:891` `app.css:892` `app.css:893` `app.css:894` `app.css:895` `app.css:1604` `app.css:1619` | J S | panel |  |
| F8cb94db | `div.scrub-track ‹ .scrub` | 36 | season | h - · r 3 · undefined/undefined |  | `app.css:1623` | J S | panel |  |
| F98257f8 | `div.winbox ‹ .scrub-track` | 36 | season | h - · r 3 · undefined/undefined |  | `app.css:892` `app.css:1589` `app.css:1593` `app.css:1595` `app.css:1597` `app.css:1599` `app.css:1600` `app.css:1601` | J S | panel |  |
| Fe15a246 | `span.xd ‹ .xhair` | 36 | season | h - · r 6 · pad 3 9 3 9 · undefined/undefined |  | `app.css:1774` `app.css:1777` `app.css:1778` `app.css:1780` `app.css:1825` | J S | panel |  |
| Fdeb6dc8 | `section.rec.rec-b` | 36 | season | h - · r 6 · pad 24 22 22 22 · undefined/undefined |  | `app.css:5939` | J S | panel |  |
| Ffc3076d | `i ‹ .rk-bad`<br>`i ‹ .chip` | 32 | armory, analytics, history | h - · r 3 · undefined/undefined |  | `app.css:168` `app.css:1755` `app.css:1760` | J S | panel |  |
| Fc0f0df6 | `i ‹ .msev` | 32 | analytics, history | h - · r 1 · undefined/undefined |  | `app.css:366` `app.css:367` `app.css:368` `app.css:369` `app.css:370` | J S | panel |  |
| F53048c1 | `i ‹ .chip` | 25 | armory | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| Fb80a152 | `i ‹ .chip` | 25 | armory | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| Fdae2299 | `i ‹ .chip` | 25 | armory | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| F9abe22b | `i ‹ .chip` | 25 | armory | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| F46ff8c0 | `i ‹ .chip` | 25 | armory | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| F787ebb6 | `li.exs-i ‹ .exs` | 24 | season, armory, broadcast, access, analytics, history | h - · r 6 · pad 12 13 12 13 · undefined/undefined |  | `app.css:4666` `app.css:4668` `app.css:4669` `app.css:4670` | J S | panel |  |
| F6bf9d39 | `i ‹ .rk-age` | 24 | armory | h - · r 3 · undefined/undefined |  | `app.css:169` | J S | panel |  |
| Fef281d0 | `i ‹ .chip` | 24 | armory | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| F88bc0a4 | `i ‹ .chip` | 24 | armory | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| F9991235 | `i ‹ .msev` | 24 | analytics, history | h - · r 1 · undefined/undefined |  | `app.css:366` `app.css:367` `app.css:368` `app.css:369` `app.css:370` | J S | panel |  |
| Ffddada2 | `span.wg-plate ‹ .wg-main` | 23 | armory | h - · r 6 · pad 7 12 8 12 · undefined/undefined |  | `app.css:583` `app.css:584` `app.css:585` `app.css:586` `app.css:634` | J S | panel |  |
| F984bd8d ·d27 | `section.bf-sec.bulkedit ‹ .bulkgrid`<br>`section.hpanel ‹ .hsplit`<br>`section.hpanel ‹ .tim2` +1 | 23 | armory, analytics | h - · r 6 · pad 16 17 16 17 · undefined/undefined |  | `app.css:4869` `app.css:4870` `app.css:6771` `app.css:3113` `app.css:3116` `app.css:3117` | J S | panel |  |
| Fac9a90a | `div.qcard ‹ .bqlist` | 18 | broadcast | h - · r 10 · pad 16 16 16 18 · undefined/undefined |  | `app.css:405` `app.css:406` `app.css:407` `app.css:444` `app.css:446` | J S | panel |  |
| F6646a1f | `div.benc ‹ .bbody` | 18 | broadcast | h - · r 6 · undefined/undefined |  | `app.css:411` `app.css:412` `app.css:413` | J S | panel |  |
| Fe026e20 | `span.bnow ‹ .qbar` | 18 | broadcast | h - · r 1 · undefined/undefined |  | `app.css:427` | J S | panel |  |
| F030619c | `i ‹ .chip` | 18 | broadcast, analytics, history | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| F67f3b57 | `i ‹ .pname`<br>`span.mxlegend.sw ‹ .k` | 16 | access | h - · r 3 · undefined/undefined |  | `app.css:2890` `app.css:3569` `app.css:3575` `app.css:3650` `app.css:3652` `app.css:3653` `app.css:3654` `app.css:3471` +4 | J S | panel |  |
| F1ad90df | `i ‹ .mxcell` | 16 | access | h - · r 4 · undefined/undefined |  | `app.css:2418` `app.css:2420` `app.css:2422` `app.css:2425` `app.css:2432` `app.css:2435` `app.css:3620` `app.css:3622` +5 | J S | panel |  |
| F0287412 | `i ‹ .pname`<br>`span.mxlegend.sw ‹ .k` | 16 | access | h - · r 3 · undefined/undefined |  | `app.css:2890` `app.css:3569` `app.css:3575` `app.css:3650` `app.css:3652` `app.css:3653` `app.css:3654` `app.css:3471` +4 | J S | panel |  |
| F23defb0 | `i ‹ .pname`<br>`span.mxlegend.sw ‹ .k` | 16 | access | h - · r 3 · undefined/undefined |  | `app.css:2890` `app.css:3569` `app.css:3575` `app.css:3650` `app.css:3652` `app.css:3653` `app.css:3654` `app.css:3471` +4 | J S | panel |  |
| F87bc0cb | `i ‹ .mxcell` | 16 | access | h - · r 4 · undefined/undefined |  | `app.css:2418` `app.css:2420` `app.css:2422` `app.css:2425` `app.css:2432` `app.css:2435` `app.css:3620` `app.css:3622` +5 | J S | panel |  |
| F7110b7e | `i ‹ .mxcell` | 16 | access | h - · r 4 · undefined/undefined |  | `app.css:2418` `app.css:2420` `app.css:2422` `app.css:2425` `app.css:2432` `app.css:2435` `app.css:3620` `app.css:3622` +5 | J S | panel |  |
| Faa98e03 | `i ‹ .mxcell` | 16 | access | h - · r 4 · undefined/undefined |  | `app.css:2418` `app.css:2420` `app.css:2422` `app.css:2425` `app.css:2432` `app.css:2435` `app.css:3620` `app.css:3622` +5 | J S | panel |  |
| F1333045 | `i ‹ .mxcell` | 16 | access | h - · r 4 · undefined/undefined |  | `app.css:2418` `app.css:2420` `app.css:2422` `app.css:2425` `app.css:2432` `app.css:2435` `app.css:3620` `app.css:3622` +5 | J S | panel |  |
| F75c6fb5 | `i ‹ .mxcell` | 16 | access | h - · r 4 · undefined/undefined |  | `app.css:2418` `app.css:2420` `app.css:2422` `app.css:2425` `app.css:2432` `app.css:2435` `app.css:3620` `app.css:3622` +5 | J S | panel |  |
| F792abb7 | `i ‹ .mxcell` | 16 | access | h - · r 4 · undefined/undefined |  | `app.css:2418` `app.css:2420` `app.css:2422` `app.css:2425` `app.css:2432` `app.css:2435` `app.css:3620` `app.css:3622` +5 | J S | panel |  |
| Fb0faf98 ·d27 | `div.mxlegend-box`<br>`div.hbanner.warn ‹ .hpanel`<br>`div.hbanner ‹ .panel` | 16 | access, analytics | h - · r 6 · pad 14 16 14 16 · undefined/undefined |  | `app.css:3564` `app.css:3566` `app.css:3569` `app.css:3570` `app.css:3571` `app.css:3572` `app.css:3573` `app.css:3575` +14 | J S | panel |  |
| Fc6476b7 ·d18 | `i ‹ .msev` | 16 | analytics, history | h - · r 1 · undefined/undefined |  | `app.css:366` `app.css:367` `app.css:368` `app.css:369` `app.css:370` | J S | panel |  |
| F1486d57 ·d17 | `div.modesw ‹ .nb-toolbar`<br>`div.segsw ‹ .nb-toolbar`<br>`div.modesw ‹ .bf-sec` +1 | 14 | armory | h - · r 6 · undefined/undefined |  | `app.css:178` `app.css:3363` `app.css:3364` `app.css:3366` `app.css:3367` `app.css:3374` `app.css:3375` `app.css:3376` +5 | J S | panel |  |
| Ff1d473d | `span.cmeter.bad ‹ .ccard`<br>`span.cmeter.age ‹ .ccard`<br>`span.bqm ‹ .bqcount` | 14 | armory, broadcast | h - · r 3 · undefined/undefined |  | `app.css:1884` `app.css:1892` `app.css:1894` `app.css:1895` `app.css:1896` `app.css:1918` `app.css:6800` `app.css:6801` +33 | J S | panel |  |
| F5397dad | `span.at ‹ .ackrow` | 14 | analytics | h - · r 3 · pad 16 16 16 16 · undefined/undefined |  | `app.css:2358` `app.css:3212` `app.css:3213` `app.css:3214` `app.css:5315` `app.css:5318` `app.css:5320` `app.css:5323` +1 | J S | panel |  |
| F24a1525 | `div.repgrp ‹ .repwrap`<br>`div.repgrp.clean ‹ .repwrap` | 12 | season | h - · r 6 · pad 11 13 11 13 · undefined/undefined |  | `app.css:3768` `app.css:3769` `app.css:3772` `app.css:1878` `app.css:1894` | J S | panel |  |
| F6805f64 | `div.pz-rows ‹ .nw-f`<br>`div.diff ‹ .panel`<br>`div.diff ‹ .dwbody` +1 | 11 | season, analytics, history, review | h - · r 6 · undefined/undefined |  | `app.css:5341` `app.css:6331` `app.css:1306` `app.css:2711` | J S | panel |  |
| F1c485e8 | `i ‹ .s` | 11 | season, broadcast | h - · r 3 · undefined/undefined |  | `app.css:157` | J S | panel |  |
| F8454e7a | `span.att-b ‹ .att-row`<br>`i ‹ .lt` | 10 | home, analytics | h - · r 3 · undefined/undefined |  | `app.css:4199` `app.css:5125` `app.css:3156` `app.css:3158` `app.css:3159` `app.css:3161` `app.css:3162` `app.css:3163` | J S | panel |  |
| F0f679a5 | `i ‹ .chip` | 10 | broadcast | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| F12e14a3 | `i ‹ .chip` | 10 | broadcast | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| F81ecdb5 | `span.cb.on`<br>`span.cb.on ‹ .wg-cb` | 9 | season, history, armory | h - · r 3 · undefined/undefined |  | `app.css:534` `app.css:692` `app.css:693` `app.css:694` `app.css:5419` `app.css:6044` `app.css:689` `app.css:768` +23 | J S | panel |  |
| Fb5b1aae | `span.bspan ‹ .qbar` | 9 | broadcast | h - · r 3 · undefined/undefined |  | `app.css:425` `app.css:426` | J S | panel |  |
| Ff03e05b | `span.att-b ‹ .att-row`<br>`i ‹ .cmeter`<br>`i ‹ .lt` | 8 | home, armory, analytics | h - · r 3 · undefined/undefined |  | `app.css:4199` `app.css:5125` `app.css:1892` `app.css:1895` `app.css:1896` `app.css:1918` `app.css:6801` `app.css:6802` +6 | J S | panel |  |
| Fa98492d ·d27 | `div.mxwrap` | 8 | access | h - · r 6 · pad 14 16 16 16 · undefined/undefined |  | `app.css:2389` | J S | panel |  |
| F9dd27fa | `i ‹ .mxcell` | 8 | access | h - · r 4 · undefined/undefined |  | `app.css:2418` `app.css:2420` `app.css:2422` `app.css:2425` `app.css:2432` `app.css:2435` `app.css:3620` `app.css:3622` +5 | J S | panel |  |
| F1f41140 | `i ‹ .pname` | 8 | access | h - · r 3 · undefined/undefined |  | `app.css:3471` `app.css:3476` `app.css:3487` `app.css:3489` `app.css:3504` | J S | panel |  |
| Fd97b028 | `i ‹ .pname` | 8 | access | h - · r 3 · undefined/undefined |  | `app.css:3471` `app.css:3476` `app.css:3487` `app.css:3489` `app.css:3504` | J S | panel |  |
| Fccffdc8 | `i ‹ .mxcell` | 8 | access | h - · r 4 · undefined/undefined |  | `app.css:2418` `app.css:2420` `app.css:2422` `app.css:2425` `app.css:2432` `app.css:2435` `app.css:3620` `app.css:3622` +5 | J S | panel |  |
| F2799325 | `i ‹ .pname` | 8 | access | h - · r 3 · undefined/undefined |  | `app.css:3471` `app.css:3476` `app.css:3487` `app.css:3489` `app.css:3504` | J S | panel |  |
| F58bc3ef ·d36 | `i ‹ .pname` | 8 | access | h - · r 3 · undefined/undefined |  | `app.css:3471` `app.css:3476` `app.css:3487` `app.css:3489` `app.css:3504` | J S | panel |  |
| F27ae56c | `i ‹ .pname` | 8 | access | h - · r 3 · undefined/undefined |  | `app.css:3471` `app.css:3476` `app.css:3487` `app.css:3489` `app.css:3504` | J S | panel |  |
| Fbf3a60b | `i ‹ .pname` | 8 | access | h - · r 3 · undefined/undefined |  | `app.css:3471` `app.css:3476` `app.css:3487` `app.css:3489` `app.css:3504` | J S | panel |  |
| F31a6612 | `i ‹ .mxcell` | 8 | access | h - · r 4 · undefined/undefined |  | `app.css:2418` `app.css:2420` `app.css:2422` `app.css:2425` `app.css:2432` `app.css:2435` `app.css:3620` `app.css:3622` +5 | J S | panel |  |
| F1d0dcb1 | `i ‹ .pname` | 8 | access | h - · r 3 · undefined/undefined |  | `app.css:3471` `app.css:3476` `app.css:3487` `app.css:3489` `app.css:3504` | J S | panel |  |
| F98430e4 | `i ‹ .mxcell` | 8 | access | h - · r 4 · undefined/undefined |  | `app.css:2418` `app.css:2420` `app.css:2422` `app.css:2425` `app.css:2432` `app.css:2435` `app.css:3620` `app.css:3622` +5 | J S | panel |  |
| F0434d10 | `i ‹ .pname` | 8 | access | h - · r 3 · undefined/undefined |  | `app.css:3471` `app.css:3476` `app.css:3487` `app.css:3489` `app.css:3504` | J S | panel |  |
| F46acf79 | `i ‹ .mxcell` | 8 | access | h - · r 4 · undefined/undefined |  | `app.css:2418` `app.css:2420` `app.css:2422` `app.css:2425` `app.css:2432` `app.css:2435` `app.css:3620` `app.css:3622` +5 | J S | panel |  |
| Fdc0e126 | `i ‹ .pname` | 8 | access | h - · r 3 · undefined/undefined |  | `app.css:3471` `app.css:3476` `app.css:3487` `app.css:3489` `app.css:3504` | J S | panel |  |
| F076b29f | `span.mxlegend.on ‹ .k` | 8 | access | h - · r 3 · undefined/undefined |  | `app.css:2890` `app.css:3569` `app.css:3575` `app.css:3650` `app.css:3652` `app.css:3653` `app.css:3654` `app.css:689` +26 | J S | panel |  |
| Ff823e27 | `span.mxlegend.inh ‹ .k` | 8 | access | h - · r 3 · undefined/undefined |  | `app.css:2890` `app.css:3569` `app.css:3575` `app.css:3650` `app.css:3652` `app.css:3653` `app.css:3654` `app.css:2422` +1 | J S | panel |  |
| F8f1e8bf | `div.sess ‹ .sesslist` | 8 | access | h - · r 6 · pad 11 14 11 14 · undefined/undefined |  | `app.css:2503` `app.css:2511` `app.css:2512` `app.css:2515` `app.css:2516` `app.css:2518` `app.css:2519` `app.css:2543` +10 | J S | panel |  |
| Fc9f226b | `span.savatar.has ‹ .sess` | 8 | access | h - · r 6 · undefined/undefined |  | `app.css:2512` `app.css:2515` `app.css:2516` `app.css:2518` `app.css:1473` `app.css:3547` `app.css:3702` `app.css:4785` +1 | J S | panel |  |
| Fe1b124f | `div.sess.stale ‹ .sesslist` | 8 | access | h - · r 6 · pad 11 14 11 14 · undefined/undefined |  | `app.css:2503` `app.css:2511` `app.css:2512` `app.css:2515` `app.css:2516` `app.css:2518` `app.css:2519` `app.css:2543` +10 | J S | panel |  |
| F6fc2826 | `span.savatar.has ‹ .sess` | 8 | access | h - · r 6 · undefined/undefined |  | `app.css:2512` `app.css:2515` `app.css:2516` `app.css:2518` `app.css:1473` `app.css:3547` `app.css:3702` `app.css:4785` +1 | J S | panel |  |
| F98aa9f0 | `span.sdot ‹ .sess` | 8 | access | h - · r 50 · undefined/undefined |  | `app.css:2543` `app.css:2546` `app.css:2549` `app.css:2567` `app.css:2570` `app.css:2571` `app.css:2575` `app.css:2576` | J S | panel |  |
| Fdd1034a | `i ‹ .chip` | 8 | analytics, history | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| F2ca57a7 ·d26 | `i ‹ .msev` | 8 | analytics, history | h - · r 1 · undefined/undefined |  | `app.css:366` `app.css:367` `app.css:368` `app.css:369` `app.css:370` | J S | panel |  |
| F2a2afad | `div.failbox ‹ .panel` | 7 | home, season, broadcast | h - · r 6 · pad 14 16 14 16 · undefined/undefined |  | `app.css:2169` `app.css:2175` | J S | panel |  |
| Fc4fe1b5 ·d42 | `div.lp ‹ .hlive` | 6 | home | h - · r 6 · pad 16 18 16 18 · undefined/undefined |  | `app.css:516` `app.css:517` `app.css:3155` `app.css:3157` `app.css:3166` `app.css:5170` `app.css:5409` | J S | panel |  |
| Faee1ed5 | `div.selbar-in ‹ .selbar` | 6 | season, armory, history | h - · r 10 · pad 11 12 11 14 · undefined/undefined |  | `app.css:4557` `app.css:4690` | J S | panel |  |
| F6d9fdf5 | `i ‹ .chip` | 6 | access | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| Fe038e01 | `i ‹ .chip` | 6 | access | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| F4496360 | `i ‹ .chip` | 6 | access | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| Fa4aeca1 | `i ‹ .chip` | 6 | access | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| Fbd5a42d | `i ‹ .chip` | 6 | access | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| Fde27f21 | `i ‹ .chip` | 6 | access | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| F996ea43 | `i ‹ .chip` | 6 | access | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| Fc9e4673 | `i ‹ .chip` | 6 | access | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| F450cec4 | `i ‹ .chip` | 6 | access | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| F6a1a20d | `i ‹ .chip` | 6 | access | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| F2b04d81 | `i ‹ .chip` | 6 | access | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| F02ec92c | `i ‹ .chip` | 6 | access | h - · r 3 · undefined/undefined |  | `app.css:1755` `app.css:1760` | J S | panel |  |
| Ff43d177 | `span.ubt2 ‹ .ub2` | 6 | analytics | h - · r 6 · undefined/undefined |  | `app.css:3186` `app.css:3187` `app.css:3188` | J S | panel |  |
| F38ef270 ·d27 | `div.uside ‹ .usplit`<br>`div.tile ‹ .tiles`<br>`div.tile.warn ‹ .tiles` | 5 | analytics | h - · r 6 · pad 15 16 15 16 · undefined/undefined |  | `app.css:3195` `app.css:3196` `app.css:2595` `app.css:2596` `app.css:2598` `app.css:2600` `app.css:2601` `app.css:2602` +22 | J S | panel |  |
| Fb32ade2 | `div.lane.lnc.aim ‹ .lanes`<br>`div.lane.aim ‹ .lanes` | 4 | season | h - · r 6 · pad 0 0 0 138 · undefined/undefined |  | `app.css:251` `app.css:256` `app.css:257` `app.css:267` `app.css:906` `app.css:907` `app.css:1015` `app.css:1092` +17 | J S | panel |  |
| F93bd19f | `span.hbi ‹ .hbanner` | 4 | analytics | h - · r 50 · undefined/undefined |  | `app.css:2918` `app.css:2920` | J S | panel |  |
| F8b940c8 | `span.hbi ‹ .hbanner` | 4 | analytics | h - · r 50 · undefined/undefined |  | `app.css:2918` `app.css:2920` | J S | panel |  |
| Fd5afe96 ·d42 | `div.hres ‹ .home` | 3 | home | h - · r 6 · pad 14 17 14 17 · undefined/undefined |  | `app.css:2678` `app.css:2680` `app.css:2681` `app.css:2682` `app.css:5191` | J S | panel |  |
| F885739c | `section.hclock ‹ .home` | 3 | home | h - · r 10 · pad 22 24 22 24 · undefined/undefined |  | `app.css:5800` `app.css:5802` `app.css:5821` | J S | panel |  |
| F058e0b8 ·d46 | `div.dline ‹ .dlines` | 3 | season | h - · r 6 · pad 9 12 9 11 · undefined/undefined |  | `app.css:1225` `app.css:1228` `app.css:1229` `app.css:1231` `app.css:1232` `app.css:1234` `app.css:1235` `app.css:1236` +7 | J S | panel |  |
| Ff7f3d86 | `span.tbdsw ‹ .dline` | 3 | season | h - · r 999 · undefined/undefined |  | `app.css:1240` `app.css:1245` `app.css:1246` `app.css:1261` `app.css:1262` `app.css:1263` `app.css:1264` `app.css:4174` +3 | J S | panel |  |
| F178a882 ·d46 | `div.ban ‹ .bans` | 3 | season | h - · r 6 · pad 7 12 7 11 · undefined/undefined |  | `app.css:1466` `app.css:1469` `app.css:1470` `app.css:1471` `app.css:1473` `app.css:1475` `app.css:1477` `app.css:1478` +2 | J S | panel |  |
| Fe989861 | `div.dcard ‹ .dw-b`<br>`div.dcard.lc ‹ .bed-sec`<br>`div.v2-card ‹ .bed-sec` | 3 | season, armory | h - · r 8 · pad 11 13 11 13 · undefined/undefined |  | `app.css:488` `app.css:811` `app.css:812` `app.css:813` `app.css:814` `app.css:815` `app.css:816` `app.css:817` +14 | J S | panel |  |
| Fe8274f7 | `span.cmpstat ‹ .cmpstats` | 3 | armory | h - · r 999 · pad 7 13 7 13 · undefined/undefined |  | `app.css:485` `app.css:6470` `app.css:6472` `app.css:6474` | J S | panel |  |
| F869b851 | `span.gp-av ‹ .idbar` | 3 | access | h - · r 50 · undefined/undefined |  | `app.css:6526` | J S | panel |  |
| Fd97173c | `div.doorcard ‹ .door` | 2 | home | h - · r 10 · pad 36 34 30 34 · undefined/undefined |  | `app.css:2762` `app.css:2768` `app.css:2769` | J S | panel |  |
| Fa27924c | `span.glyph ‹ .doormk` | 2 | home | h - · r 6 · undefined/undefined |  | `app.css:877` `app.css:2766` | J S | panel |  |
| Fa5fd166 | `div.cmdbar.on` | 2 | season | h - · r 10 · pad 0 11 0 11 · undefined/undefined |  | `app.css:4112` `app.css:4115` `app.css:4117` `app.css:4118` `app.css:4122` `app.css:4123` `app.css:4129` `app.css:4131` +32 | J S | panel |  |
| F2a0208a | `span.cb-mag ‹ .cmdbar` | 2 | season | h - · r 50 · undefined/undefined |  | `app.css:4119` `app.css:4120` `app.css:4122` `app.css:4123` | J S | panel |  |
| F06667dd | `span.cmppick ‹ .cmpbar` | 2 | armory | h - · r 999 · pad 4 6 4 4 · undefined/undefined |  | `app.css:6460` `app.css:6462` | J S | panel |  |
| F6f3db7e | `span.cb ‹ .wg-cb` | 2 | armory | h - · r 3 · undefined/undefined |  | `app.css:534` `app.css:692` `app.css:693` `app.css:694` `app.css:5419` `app.css:6044` | J S | panel |  |
| F381a3cc | `span.cmeter.clean ‹ .ccard`<br>`i ‹ .it` | 2 | armory, analytics | h - · r 3 · undefined/undefined |  | `app.css:1884` `app.css:1892` `app.css:1894` `app.css:1895` `app.css:1896` `app.css:1918` `app.css:6800` `app.css:6801` +7 | J S | panel |  |
| F147b90d ·d36 | `i.rp-glyph ‹ .rp-glyphs` | 2 | broadcast | h - · r 2 · undefined/undefined |  | `app.css:6838` | J S | panel |  |
| Fca7627b ·d30 | `div.idbar ‹ .dwbody` | 2 | access | h - · r 6 · pad 12 16 12 16 · undefined/undefined |  | `app.css:6523` `app.css:6526` `app.css:6529` `app.css:6530` `app.css:6533` `app.css:6535` `app.css:6536` `app.css:6539` +5 | J S | panel |  |
| Ffb16e88 | `span.uav ‹ .uid` | 1 | home | h - · r 50 · undefined/undefined |  | `app.css:1791` `app.css:3809` `app.css:3810` `app.css:5244` `app.css:6598` | J S | panel |  |
| F302112f | `div.dfail ‹ .doorcard` | 1 | home | h - · r 6 · pad 12 14 12 14 · undefined/undefined |  | `app.css:2781` | J S | panel |  |
| F17c45dd | `span.pip` | 1 | season | h - · r 50 · undefined/undefined |  | `app.css:1279` `app.css:1280` `app.css:1281` | J S | panel |  |
| Ff0ca65c | `span.pip.none` | 1 | season | h - · r 50 · undefined/undefined |  | `app.css:1279` `app.css:1280` `app.css:1281` `app.css:605` `app.css:631` `app.css:744` `app.css:1745` `app.css:1939` +4 | J S | panel |  |
| F6f7efbf | `span.bthumb.has ‹ .ban` | 1 | season | h - · r 3 · undefined/undefined |  | `app.css:1471` `app.css:1473` `app.css:2515` `app.css:2518` `app.css:3547` `app.css:3702` `app.css:4785` `app.css:4786` | J S | panel |  |
| Fd00c2fb | `span.bthumb.has ‹ .ban` | 1 | season | h - · r 3 · undefined/undefined |  | `app.css:1471` `app.css:1473` `app.css:2515` `app.css:2518` `app.css:3547` `app.css:3702` `app.css:4785` `app.css:4786` | J S | panel |  |
| F6a45752 | `span.bthumb.has ‹ .ban` | 1 | season | h - · r 3 · undefined/undefined |  | `app.css:1471` `app.css:1473` `app.css:2515` `app.css:2518` `app.css:3547` `app.css:3702` `app.css:4785` `app.css:4786` | J S | panel |  |
| F70cb085 | `div.nodraft ‹ .idbody` | 1 | season | h - · r 6 · pad 16 14 16 14 · undefined/undefined |  | `app.css:1299` `app.css:1301` `app.css:1302` `app.css:5770` `app.css:5779` `app.css:5781` | J S | panel |  |
| F0921431 | `section.identity.collapsed.editing-draft` | 1 | season | h - · r 6 · undefined/undefined |  | `app.css:880` `app.css:1043` `app.css:1452` `app.css:1453` `app.css:1456` `app.css:1498` `app.css:1506` `app.css:1507` +13 | J S | panel |  |
| Ffdd5d01 | `div.lane ‹ .lanes` | 1 | season | h - · r 6 · pad 0 0 0 138 · undefined/undefined |  | `app.css:251` `app.css:256` `app.css:257` `app.css:267` `app.css:906` `app.css:907` `app.css:1015` `app.css:1092` +17 | J S | panel |  |
| Ff08ffd3 | `div.tghost.cmp.pt ‹ .tk` | 1 | season | h - · r 3 · undefined/undefined |  | `app.css:920` `app.css:4096` `app.css:4099` `app.css:2030` `app.css:194` `app.css:196` `app.css:206` `app.css:208` +13 | J S | panel |  |
| F67e4a21 | `div.toast ‹ .app` | 1 | season | h - · r 6 · pad 10 16 10 16 · undefined/undefined |  | `app.css:820` `app.css:822` `app.css:1096` `app.css:5044` `app.css:5045` `app.css:5478` | J S | panel |  |
| F80800be | `ul.wsrch-list ‹ .wsrch` | 1 | armory | h - · r 6 · pad 4 4 4 4 · undefined/undefined |  | `app.css:6439` | J S | panel |  |
| Fe518f4d | `span.cmpstat.over ‹ .cmpstats` | 1 | armory | h - · r 999 · pad 7 13 7 13 · undefined/undefined |  | `app.css:485` `app.css:6470` `app.css:6472` `app.css:6474` `app.css:329` `app.css:407` `app.css:497` `app.css:1996` | J S | panel |  |
| F508d26b | `div.dwissue ‹ .dwissues` | 1 | armory | h - · r 6 · pad 8 10 8 10 · undefined/undefined |  | `app.css:1949` `app.css:1951` `app.css:1952` `app.css:3034` `app.css:3035` | J S | panel |  |
| F1e332a3 | `aside.bf-sec.bulktally ‹ .bulkgrid` | 1 | armory | h - · r 6 · pad 16 17 0 17 · undefined/undefined |  | `app.css:4869` `app.css:4870` `app.css:6771` | J S | panel |  |
| F909d97b ·d27 | `div.repbar` | 1 | armory | h - · r 6 · pad 13 16 13 16 · undefined/undefined |  | `app.css:3087` `app.css:3089` `app.css:3090` `app.css:3091` `app.css:3302` | J S | panel |  |
| Fd6b53c6 | `div.never-ends-field ‹ .dwfield` | 1 | broadcast | h - · r 6 · pad 0 12 0 12 · undefined/undefined |  | `app.css:6823` | J S | panel |  |
| Ff729499 | `div.bar.ended ‹ .tk` | 1 | broadcast | h - · r 3 · pad 0 8 0 8 · undefined/undefined |  | `tokens.css:481` `tokens.css:485` `tokens.css:498` `tokens.css:503` `tokens.css:508` `app.css:182` `app.css:185` `app.css:186` +54 | J S | panel |  |
| F290139f | `div.bar.saved.forever ‹ .tk` | 1 | broadcast | h - · r 3 · pad 0 8 0 8 · undefined/undefined |  | `tokens.css:481` `tokens.css:485` `tokens.css:498` `tokens.css:503` `tokens.css:508` `app.css:182` `app.css:185` `app.css:186` +56 | J S | panel |  |
| F8f4237e | `div.bar.saved ‹ .tk` | 1 | broadcast | h - · r 3 · pad 0 8 0 8 · undefined/undefined |  | `tokens.css:481` `tokens.css:485` `tokens.css:498` `tokens.css:503` `tokens.css:508` `app.css:182` `app.css:185` `app.css:186` +56 | J S | panel |  |
| F4322d4b | `div.bar.staged ‹ .tk` | 1 | broadcast | h - · r 3 · pad 0 8 0 8 · undefined/undefined |  | `tokens.css:481` `tokens.css:485` `tokens.css:498` `tokens.css:503` `tokens.css:508` `app.css:182` `app.css:185` `app.css:186` +64 | J S | panel |  |
| Ff58ff07 | `span.sdot ‹ .sess` | 1 | access | h - · r 50 · undefined/undefined |  | `app.css:2543` `app.css:2546` `app.css:2549` `app.css:2567` `app.css:2570` `app.css:2571` `app.css:2575` `app.css:2576` | J S | panel |  |
| F50afd57 | `span.sdot ‹ .sess` | 1 | access | h - · r 50 · undefined/undefined |  | `app.css:2543` `app.css:2546` `app.css:2549` `app.css:2567` `app.css:2570` `app.css:2571` `app.css:2575` `app.css:2576` | J S | panel |  |
| F210e80b | `span.sdot ‹ .sess` | 1 | access | h - · r 50 · undefined/undefined |  | `app.css:2543` `app.css:2546` `app.css:2549` `app.css:2567` `app.css:2570` `app.css:2571` `app.css:2575` `app.css:2576` | J S | panel |  |
| F0d43c0e | `span.sdot ‹ .sess` | 1 | access | h - · r 50 · undefined/undefined |  | `app.css:2543` `app.css:2546` `app.css:2549` `app.css:2567` `app.css:2570` `app.css:2571` `app.css:2575` `app.css:2576` | J S | panel |  |
| F5b31b1a | `div.idbar ‹ .dwbody` | 1 | access | h - · r 6 · pad 12 16 12 16 · undefined/undefined |  | `app.css:6523` `app.css:6526` `app.css:6529` `app.css:6530` `app.css:6533` `app.css:6535` `app.css:6536` `app.css:6539` +5 | J S | panel |  |
| F0ed9f9e | `span.sdot ‹ .sess` | 1 | access | h - · r 50 · undefined/undefined |  | `app.css:2543` `app.css:2546` `app.css:2549` `app.css:2567` `app.css:2570` `app.css:2571` `app.css:2575` `app.css:2576` | J S | panel |  |
| Fc0ac66d | `span.sdot ‹ .sess` | 1 | access | h - · r 50 · undefined/undefined |  | `app.css:2543` `app.css:2546` `app.css:2549` `app.css:2567` `app.css:2570` `app.css:2571` `app.css:2575` `app.css:2576` | J S | panel |  |
| Fde0c4bb | `span.sdot ‹ .sess` | 1 | access | h - · r 50 · undefined/undefined |  | `app.css:2543` `app.css:2546` `app.css:2549` `app.css:2567` `app.css:2570` `app.css:2571` `app.css:2575` `app.css:2576` | J S | panel |  |
| Fc553c4b | `span.sdot ‹ .sess` | 1 | access | h - · r 50 · undefined/undefined |  | `app.css:2543` `app.css:2546` `app.css:2549` `app.css:2567` `app.css:2570` `app.css:2571` `app.css:2575` `app.css:2576` | J S | panel |  |
| Fad500c8 | `i ‹ .et` | 1 | analytics | h - · r 3 · undefined/undefined |  | `app.css:3201` `app.css:5315` | J S | panel |  |
| Fec22bda | `div.rvcon ‹ .rvdet` | 1 | review | h - · r 6 · pad 12 14 12 14 · undefined/undefined |  | `app.css:2750` `app.css:2753` `app.css:2754` `app.css:2755` | J S | panel |  |

## Dark grounds · 1

Takes: M Dark grounds · J Corners.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| F508a45e | `span.wg-fpop ‹ .wg-fwrap` | 1 | armory | h - · r 10 · pad 4 4 4 4 · undefined/undefined |  | `app.css:556` `app.css:557` `app.css:626` | M J | ground |  |

## Drawer · 3

Takes: M Dark grounds · J Corners · Q Drawer side column · S Spacing scale.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| Fbbe2ee2 | `div.umenu ‹ .who`<br>`aside.drawer.open.wide ‹ .app`<br>`aside.drawer.open ‹ .app` +1 | 36 | home, season, armory, broadcast, access, analytics, history, review | h - · r 10 · undefined/undefined |  | `app.css:1390` `app.css:1391` `app.css:1393` `app.css:1787` `app.css:1790` `app.css:1798` `app.css:1800` `app.css:1802` +49 | M J Q S | drawer | Dark grounds, Panels and cards |
| Fe5e2e2d | `header.dw-h ‹ .drawer` | 33 | season, armory, broadcast, access, analytics, history, review | h - · pad 16 24 12 24 · undefined/undefined |  | `app.css:787` `app.css:792` `app.css:795` `app.css:797` `app.css:798` `app.css:2273` | Q J S | drawer |  |
| F9bde0a1 | `footer.dw-f ‹ .drawer` | 33 | season, armory, broadcast, access, analytics, history, review | h - · pad 12 24 12 24 · undefined/undefined |  | `app.css:804` `app.css:805` `app.css:6271` `app.css:6272` `app.css:6273` | Q J S | drawer |  |

## Small text (Step 3) · 94

Takes: T Text sizes · A Key labels.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| Fc03f8c2 | `div.rowmeta.rowlife`<br>`div.rowmeta ‹ .nums` | 2984 | season | h - · 9.5/400 ls 0.57px · var(--ink3) |  | `app.css:1173` `app.css:1559` `app.css:1825` | T | smalltext |  |
| Ffc24327 | `em.wg-nb`<br>`span ‹ .wg-slots` | 2287 | armory | h - · 9.5/600 caps ls 1.33px · var(--ink3) |  | `app.css:538` `app.css:539` | T | smallcaps |  |
| Fd6b9d87 ·d3 | `span.brow-a ‹ .brow` | 2109 | armory | h - · 9.5/400 · var(--ink3) |  | `app.css:6699` `app.css:6702` | T | smalltext |  |
| F85b5712 ·d11 | `em ‹ .ow-c`<br>`em ‹ .exs-c` | 304 | season, armory, broadcast, access, analytics, history | h - · 10.5/500 caps ls 0.84px · var(--ink3) |  | `app.css:4648` `app.css:4675` | T | smallcaps |  |
| F37cc7ac | `b` | 286 | season | h - · 10.5/400 · var(--ink3) |  | — | T | smalltext |  |
| F6ce7721 ·d4 | `span.l ‹ .key`<br>`span.dl-left ‹ .dline`<br>`span.bd ‹ .bcard` +5 | 225 | season, broadcast, armory, analytics, review | h - · 10.5/400 · var(--ink3) |  | `app.css:156` `app.css:491` `app.css:895` `app.css:929` `app.css:1588` `app.css:1600` `app.css:3877` `app.css:4090` +18 | T | smalltext |  |
| Fa660ea1 ·d4 | `em ‹ .chip` | 203 | armory, broadcast | h - · 9.5/600 · var(--ink3) |  | `app.css:376` `app.css:3377` `app.css:3379` | T | smalltext |  |
| F9d669fc | `span.tier ‹ .round` | 160 | armory, broadcast, access, analytics, history | h - · r 3 · pad 0 4 0 4 · 9.5/400 ls 0.76px · var(--ink3) |  | `app.css:728` `app.css:730` | T | smalltext |  |
| Fc16fde4 | `span.t ‹ .ph` | 126 | season, armory, broadcast, access, analytics, history, review | h - · 9.5/700 caps ls 0.95px · var(--ink2\|--r-home) |  | `app.css:139` `app.css:721` `app.css:2272` `app.css:5699` `app.css:5708` `app.css:5710` `app.css:5721` `app.css:5746` | T | smallcaps |  |
| F27134f6 | `span.av ‹ .whobtn` | 111 | home, season, armory, broadcast, access, analytics, history, review | h - · r 50 · 10.5/600 caps · var(--ink) |  | `app.css:100` `app.css:105` `app.css:1016` `app.css:1417` `app.css:3211` `app.css:3218` `app.css:6595` | T | smallcaps |  |
| Fcd237c9 ·d1 | `div.bmeta ‹ .bcard`<br>`div.bmeta.soon ‹ .bcard`<br>`span.attnote ‹ .attfoot` +1 | 81 | season, armory, analytics | h - · 10.5/400 · var(--ink3) |  | `app.css:428` `app.css:449` `app.css:948` `app.css:956` `app.css:957` `app.css:1825` `app.css:3003` `app.css:3004` +6 | T | smalltext |  |
| F0d8dfe6 ·d21 | `span.mh-add-g ‹ .mh-add` | 80 | season | h - · 9.5/400 caps ls 1.33px · var(--ink3) |  | `app.css:2442` `app.css:2444` | T | smallcaps |  |
| Ffe1de27 ·d4 | `span.dot2 ‹ .bd` | 78 | season | h - · pad 0 2 0 2 · 10.5/400 · var(--ink3) |  | `app.css:1381` | T | smalltext |  |
| F8768698 | `em ‹ .seen`<br>`em ‹ .gp-by`<br>`span.tl-k ‹ .tile` +1 | 73 | access, analytics | h - · 9.5/600 caps ls 0.95px · var(--ink3) |  | `app.css:2596` `app.css:3150` `app.css:3155` `app.css:3157` `app.css:2584` `app.css:6541` | T A | smallcaps | Key labels |
| Fbf63d95 | `i.rend.l ‹ .ruler`<br>`i.rend.r ‹ .ruler` | 72 | season | h - · 9.5/600 ls 0.76px · var(--ink3) |  | `app.css:490` `app.css:491` `app.css:492` `app.css:156` `app.css:895` `app.css:929` `app.css:1588` `app.css:1600` +8 | T | smalltext |  |
| Fa481ee0 | `span.cnt ‹ .realm` | 71 | home, armory, broadcast, access, analytics, history, review | h - · 9.5/700 caps ls 1.26px · var(--staged\|--r-review) |  | `app.css:114` | T | smallcaps |  |
| F5525e52 | `span.t ‹ .tray-h` | 60 | armory, broadcast, access, analytics, history | h - · 10.5/700 caps ls 1.47px · var(--ink2\|--r-home) |  | `app.css:139` `app.css:721` `app.css:2272` `app.css:5699` `app.css:5708` `app.css:5710` `app.css:5721` `app.css:5746` | T | smallcaps |  |
| F8c97bdc | `span.sr ‹ .ra` | 50 | season, broadcast | h - · 9.5/700 caps ls 1.14px · var(--ink3) |  | `app.css:40` | T | smallcaps |  |
| F460a95f ·d4 | `em.segn` | 50 | armory | h - · 10.5/600 · var(--ink3) |  | `app.css:498` | T | smalltext |  |
| F88a8d79 | `kbd ‹ .pill` | 43 | armory, broadcast, access | h - · r 6 · pad 3 6 3 6 · 10.5/500 ls 0.42px · var(--ink3) |  | `app.css:3951` | T | smalltext |  |
| F0dde64d | `i` | 40 | season | h - · 9.5/500 caps ls 0.95px · var(--ink) |  | — | T | smallcaps |  |
| Ffa07df6 ·d9 | `i.zero` | 40 | season | h - · 9.5/500 caps ls 0.95px · var(--ink3) |  | `app.css:2114` `app.css:3211` `app.css:3247` `app.css:5091` `app.css:5323` `app.css:5532` | T | smallcaps |  |
| F57cc3c3 | `i.warn` | 40 | season | h - · 9.5/500 caps ls 0.95px · var(--warn-ink) |  | `app.css:132` `app.css:1930` `app.css:1931` `app.css:2113` `app.css:2601` `app.css:2639` `app.css:2917` `app.css:2920` +1 | T | smallcaps |  |
| Ff36b678 | `kbd.mh-k ‹ .mh-add` | 40 | season | h - · r 6 · pad 4 6 4 6 · 10.5/500 · var(--ink3) |  | `app.css:4477` `app.css:4484` | T | smalltext |  |
| Faaa4320 ·d1 | `span ‹ .addrow` | 40 | season | h - · 11.5/400 · var(--ink3) |  | — | T | smalltext |  |
| F688ad30 ·d1 | `span.lp ‹ .lvlb`<br>`span.inote ‹ .inrow` | 39 | analytics | h - · 9.5/400 · var(--ink3) |  | `app.css:516` `app.css:517` `app.css:3155` `app.css:3157` `app.css:3166` `app.css:5170` `app.css:5409` `app.css:3240` | T | smalltext |  |
| F9d00d59 | `span.srec-state ‹ .srec-top` | 38 | season | h - · 10.5/400 ls 0.63px · var(--ink3) |  | `app.css:5650` `app.css:5652` | T | smalltext |  |
| Fb02f0b5 | `b ‹ .lsum` | 37 | season | h - · 9.5/600 ls 0.57px · var(--ink3) |  | `app.css:4047` | T | smalltext |  |
| Fce39c75 | `span.rd ‹ .zoomer` | 36 | season | h - · pad 0 9 0 9 · 10.5/400 · var(--ink3) |  | `app.css:1331` `app.css:1333` `app.css:1825` | T | smalltext |  |
| F2358599 ·d10 | `b ‹ .rd` | 36 | season | h - · 10.5/600 · var(--ink2\|--r-home) |  | `app.css:1333` `app.css:1825` | T | smalltext |  |
| Fcc4d1fe | `span.dfd ‹ .dflag` | 36 | season | h - · 9.5/500 ls 0.76px · var(--ink2\|--r-home) |  | `app.css:1660` `app.css:1825` | T | smalltext |  |
| Ffb94de9 | `span.dpin.edge.r.lvl2 ‹ .deadrail` | 36 | season | h - · r 999 · pad 3 7 3 7 · 9.5/600 caps ls 0.57px · var(--ink) |  | `app.css:3869` `app.css:3877` `app.css:3876` `app.css:3878` `app.css:4080` `app.css:4087` `app.css:4088` `app.css:4089` +7 | T | smallcaps |  |
| F17be7f2 ·d3 | `em ‹ .dpin` | 36 | season | h - · 9.5/600 · var(--ink3) |  | `app.css:3878` | T | smalltext |  |
| Fbc17e12 | `span.rec-t ‹ .rec-h` | 36 | season | h - · 10.5/600 caps ls 1.47px · var(--ink2\|--r-home) |  | `app.css:5950` | T | smallcaps |  |
| Feb7d517 | `span.rec-tag ‹ .rec-row` | 36 | season | h - · r 6 · pad 4 8 4 8 · 9.5/600 caps ls 1.14px · var(--patch\|--pn) |  | `app.css:5981` `app.css:5983` | T | smallcaps |  |
| F27cc9f8 | `span.rec-tag ‹ .rec-row` | 36 | season | h - · r 6 · pad 4 8 4 8 · 9.5/600 caps ls 1.14px · var(--ink3) |  | `app.css:5981` `app.css:5983` | T | smallcaps |  |
| F4ee7c7c ·d1 | `small ‹ .bcdt` | 36 | broadcast | h - · 10.5/500 · var(--ink3) |  | `app.css:389` | T | smalltext |  |
| F01c6388 | `span.dw-eye ‹ .dw-ttl` | 33 | season, armory, broadcast, access, analytics, history, review | h - · 9.5/400 caps ls 0.855px · var(--ink3) |  | `app.css:790` | T | smallcaps |  |
| F541413b | `span.rvt ‹ .rvop` | 32 | review | h - · r 3 · pad 3 5 3 5 · 9.5/600 ls 0.38px · var(--ink3) |  | `app.css:2698` `app.css:2700` | T | smalltext |  |
| F2f3b3ab ·d3 | `span ‹ .bencf`<br>`span.fcount ‹ .dwfield`<br>`span.ubt3 ‹ .ub2` | 30 | broadcast, access, analytics | h - · 10.5/500 · var(--ink3) |  | `app.css:495` `app.css:496` `app.css:497` `app.css:3192` | T | smalltext |  |
| F1165b6f | `span.rivk.change` | 30 | history | h - · r 3 · pad 3 7 3 7 · 9.5/600 caps ls 0.95px · var(--info) |  | `app.css:2633` `app.css:2635` `app.css:2636` `app.css:2637` | T | smallcaps |  |
| F81514ac | `span.rivk.alert` | 25 | history | h - · r 3 · pad 3 7 3 7 · 9.5/600 caps ls 0.95px · var(--warn) |  | `app.css:2633` `app.css:2635` `app.css:2636` `app.css:2637` | T | smallcaps |  |
| F7057c98 | `span.lvtag.lv-info` | 25 | history | h - · r 3 · pad 2 5 2 5 · 9.5/600 caps ls 0.95px · var(--ink3) |  | `app.css:3167` `app.css:3170` `app.css:3171` `app.css:3159` | T | smallcaps |  |
| F36a0c30 | `span.dc ‹ .depb` | 24 | analytics | h - · 9.5/400 ls 0.38px · var(--ink3) |  | `app.css:3133` | T | smalltext |  |
| F56448d1 ·d10 | `b ‹ .bootgrid` | 24 | analytics | h - · 10.5/700 · var(--ink2\|--r-home) |  | `app.css:3176` `app.css:3177` | T | smalltext |  |
| F284c4fd | `span ‹ .rvhead` | 24 | review | h - · pad 9 12 9 12 · 9.5/600 caps ls 0.95px · var(--ink3) |  | `app.css:2714` | T | smallcaps |  |
| F1ddfeda | `small ‹ .wg-plate` | 23 | armory | h - · 9.5/600 caps ls 1.52px · color(srgb 0.884706 0.776471 0.384706) |  | `app.css:585` | T | smallcaps |  |
| F230dcaa ·d1 | `span.dot2 ‹ .bmeta` | 22 | season | h - · pad 0 2 0 2 · 10.5/400 · var(--ink3) |  | `app.css:1381` | T | smalltext |  |
| F75fbf40 ·d11 | `em ‹ .nw-chip` | 21 | season | h - · 10.5/400 caps ls 0.84px · var(--ink3) |  | `app.css:3909` `app.css:3913` | T | smallcaps |  |
| F45a9298 | `span.lw.hot ‹ .lrow` | 18 | home | h - · 9.5/400 caps ls 0.95px · var(--warn) |  | `app.css:5180` `app.css:5182` `app.css:5502` | T | smallcaps |  |
| F84dd272 ·d4 | `span ‹ .sessb` | 16 | access | h - · 10.5/400 · var(--ink3) |  | `app.css:2579` | T | smalltext |  |
| Fba5dea0 ·d34 | `em ‹ .att-x` | 15 | home | h - · 9.5/500 caps ls 0.95px · var(--ink3) |  | `app.css:4202` `app.css:5136` | T | smallcaps |  |
| F61a9505 | `span.att-sev ‹ .att-go` | 15 | home | h - · 12/400 caps ls 0.95px · var(--ink2\|--r-home) |  | `app.css:5133` | T | smallcaps |  |
| F95c97cf | `span.pk ‹ .pitem` | 12 | season | h - · r 3 · pad 2 6 2 6 · 9.5/500 ls 0.665px · var(--ink3) |  | `app.css:1436` | T | smalltext |  |
| F439e192 ·d34 | `em` | 12 | access | h - · 10.5/500 caps ls 0.95px · var(--ink3) |  | — | T | smallcaps |  |
| Fde562ee ·d4 | `b ‹ .dl-left`<br>`b ‹ .sp` | 11 | season, review | h - · 10.5/700 · var(--ink3) |  | `app.css:1825` | T | smalltext |  |
| F3d5e0e5 | `span.bcol-t ‹ .bcol-h` | 8 | season | h - · 10.5/600 ls 0.945px · var(--ink2\|--r-home) |  | `app.css:1362` `app.css:1372` | T | smalltext |  |
| Ffccb866 | `span.bcol-n ‹ .bcol-h` | 8 | season | h - · r 10 · pad 1 7 1 7 · 10.5/400 · var(--ink3) |  | `app.css:1363` `app.css:1373` `app.css:1825` | T | smalltext |  |
| F7929a84 | `span.mxs ‹ .mxc-name` | 8 | access | h - · pad 0 4 0 4 · 9.5/600 caps ls 0.95px · var(--ink3) |  | `app.css:2395` `app.css:3402` `app.css:3408` | T | smallcaps |  |
| F5690d8a | `span.mxs ‹ .mxc-held` | 8 | access | h - · 9.5/600 caps ls 0.95px · var(--ink3) |  | `app.css:2395` `app.css:3402` `app.css:3408` | T | smallcaps |  |
| F37db76d | `span.rvw ‹ .rvn` | 8 | review | h - · 12/400 caps ls 1.2px · var(--ink3) |  | `app.css:2705` `app.css:2707` | T | smallcaps |  |
| F57bd412 | `span.net-k ‹ .netbar` | 7 | home, season, broadcast | h - · r 3 · pad 4 6 4 6 · 9.5/700 ls 1.52px · var(--ink2\|--r-home) |  | `app.css:2206` | T | smalltext |  |
| F5ec259d | `kbd ‹ .bbar-t` | 6 | season | h - · r 3 · pad 1 5 1 5 · 9.5/400 ls 0.525px · var(--ink2\|--r-home) |  | `app.css:2927` | T | smalltext |  |
| F46f8c7f | `span.bcol-sum ‹ .bcol-h` | 6 | season | h - · pad 0 0 0 6 · 10.5/400 · var(--ink3) |  | `app.css:1365` `app.css:1374` | T | smalltext |  |
| F2ba4f72 | `span.selbar-rev.ok ‹ .selbar-in` | 6 | season, armory, history | h - · r 999 · pad 6 10 6 10 · 9.5/600 caps ls 1.235px · var(--ok) |  | `app.css:4567` `app.css:4569` `app.css:4571` `app.css:4691` `app.css:1748` `app.css:1881` `app.css:1944` `app.css:2602` +7 | T | smallcaps |  |
| F33b4bda | `em ‹ .nw-chip` | 5 | season | h - · 10.5/400 caps ls 0.84px · var(--ink2\|--r-home) |  | `app.css:3909` `app.css:3913` | T | smallcaps |  |
| Fb13a536 ·d44 | `span.mnote ‹ .mi` | 4 | home | h - · 9.5/500 ls 0.95px · var(--ink3) |  | `app.css:1806` `app.css:2447` `app.css:2448` `app.css:5255` | T | smalltext |  |
| F67e8d40 | `p.doorstate ‹ .doorcard`<br>`span.none ‹ .doorstate` | 4 | home | h - · 14.5/400 caps ls 1.16px · var(--ink3) |  | `app.css:6047` `app.css:605` `app.css:631` `app.css:744` `app.css:1281` `app.css:1745` `app.css:1939` `app.css:2954` +3 | T | smallcaps |  |
| Ff041685 | `span.offwin ‹ .tk` | 4 | season | h - · r 999 · pad 2 8 2 8 · 9.5/400 ls 0.76px · var(--ink3) |  | `app.css:1201` | T | smalltext |  |
| Fc5ea120 ·d44 | `span.fdelta.down ‹ .stat` | 4 | armory | h - · 9.5/600 ls 0.95px · var(--ink3) |  | `app.css:5008` `app.css:5010` `app.css:5009` `app.css:5014` `app.css:5016` `app.css:5477` | T | smalltext |  |
| F330eb7a ·d3 | `span.attn ‹ .attrow` | 4 | armory | h - · 10.5/600 · var(--ink3) |  | `app.css:2994` | T | smalltext |  |
| F32b30e2 ·d1 | `span.meter-note ‹ .dwfield`<br>`span.clock-tag ‹ .repeat-row` | 4 | broadcast | h - · 10.5/600 · var(--ink3) |  | `app.css:6803` `app.css:6804` `app.css:6840` | T | smalltext |  |
| F88ddb21 | `span.nm ‹ .lane` | 4 | broadcast | h - · pad 0 11 0 9 · 10.5/700 caps ls 1.05px · var(--ink3) |  | `app.css:267` `app.css:3679` `app.css:3681` `app.css:3683` `app.css:3685` `app.css:3687` `app.css:3690` `app.css:3691` +2 | T | smallcaps |  |
| Faf63a89 | `span.ln ‹ .lvlb` | 4 | analytics | h - · 9.5/600 caps ls 0.95px · var(--danger-ink) |  | `app.css:3150` `app.css:3155` `app.css:3157` | T | smallcaps |  |
| Fe5f16b2 | `em.dlname ‹ .al`<br>`b.dlname ‹ .dt2` | 4 | analytics | h - · 9.5/600 caps ls 0.76px · var(--danger-ink) |  | `app.css:505` `app.css:508` | T | smallcaps |  |
| F8e4a954 | `span.trk ‹ .dline` | 3 | season | h - · 9.5/600 ls 0.95px · var(--ink2\|--r-home) |  | `app.css:1231` | T | smalltext |  |
| F303669e | `span.bst ‹ .ban` | 3 | season | h - · 9.5/400 ls 0.38px · var(--ink3) |  | `app.css:1480` | T | smalltext |  |
| Fa7b5f16 | `p.psec ‹ .plist` | 3 | season | h - · pad 0 9 0 9 · 9.5/400 caps ls 1.33px · var(--ink3) |  | `app.css:2450` `app.css:2452` | T | smallcaps |  |
| Fabb03cd ·d1 | `span ‹ .gp-n` | 3 | access | h - · 10.5/400 · var(--ink3) |  | `app.css:6533` `app.css:6535` | T | smalltext |  |
| Ff3c71d0 | `code` | 3 | access | h - · 10.5/400 ls 0.21px · var(--ink2\|--r-home) |  | — | T | smalltext |  |
| F6b85714 | `span.doormk ‹ .doorcard` | 2 | home | h - · 14.5/700 caps ls 1.885px · var(--ink2\|--r-home) |  | `app.css:2764` `app.css:2766` `app.css:2767` | T | smallcaps |  |
| F945c122 | `b ‹ .doormk` | 2 | home | h - · 14.5/400 caps ls 1.885px · var(--ink3) |  | `app.css:2767` | T | smallcaps |  |
| Ff7c3c16 | `span.bbar-t ‹ .bbar` | 2 | season | h - · 10.5/400 ls 0.525px · var(--ink3) |  | `app.css:1345` `app.css:2927` | T | smalltext |  |
| F73f7c3f ·d10 | `code ‹ .imgnote` | 2 | armory | h - · 10.5/400 · var(--ink2\|--r-home) |  | `app.css:3033` | T | smalltext |  |
| Feed67a5 | `span ‹ .ruler` | 2 | broadcast | h - · pad 0 0 0 6 · 10.5/400 · var(--ink3) |  | `app.css:228` `app.css:1118` `app.css:5459` `app.css:6146` `app.css:6147` | T | smalltext |  |
| F979c49c ·d10 | `b ‹ .gp-by` | 2 | access | h - · 10.5/500 · var(--ink2\|--r-home) |  | `app.css:6543` | T | smalltext |  |
| Fcdff6bf | `span.mid ‹ .mi` | 1 | home | h - · 10.5/500 ls 0.21px · var(--ink3) |  | `app.css:5260` | T | smalltext |  |
| F5ca69b9 | `div.divider ‹ .lanes` | 1 | season | h - · pad 9 0 5 96 · 9.5/400 caps ls 1.52px · var(--ink3) |  | `app.css:280` | T | smallcaps |  |
| F2bc9946 | `p.psec.psec-cut ‹ .plist` | 1 | season | h - · pad 12 9 0 9 · 9.5/400 caps ls 1.33px · var(--ink3) |  | `app.css:2450` `app.css:2452` `app.css:2453` | T | smallcaps |  |
| Ffd8d0e9 | `em` | 1 | armory | h - · r 3 · pad 2 6 2 6 · 10.5/600 caps ls 0.95px · var(--ink2\|--r-home) |  | — | T | smallcaps |  |
| F0e11bdb ·d10 | `code ‹ .attnote` | 1 | armory | h - · 10.5/400 · var(--ink2\|--r-home) |  | `app.css:3004` | T | smalltext |  |
| Fe484c7b ·d1 | `p.imgnote ‹ .bed-sec` | 1 | armory | h - · 10.5/400 · var(--ink3) |  | `app.css:3032` `app.css:3033` | T | smalltext |  |
| F92dff67 | `i.mechtag ‹ .cname` | 1 | armory | h - · r 3 · pad 2 5 2 5 · 9.5/600 caps ls 0.95px · var(--ok) |  | `app.css:3036` | T | smallcaps |  |
| F3f441b2 | `span.post-prev-when ‹ .post-prev` | 1 | broadcast | h - · pad 0 14 12 14 · 10.5/600 · var(--ink3) |  | `app.css:6847` | T | smalltext |  |

## Content text · 281

Takes: T Text sizes.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| Fd93058d | `span.wg-ix ‹ .wg-r` | 2883 | armory | h - · 21/500 · var(--ink3) |  | `app.css:579` `app.css:580` | T | text |  |
| F73e3813 | `span.wg-ct ‹ .wg-igf` | 2783 | armory | h - · 12/600 ls 0.96px · var(--ink) |  | `app.css:599` `app.css:600` | T | text |  |
| F495e282 | `code.brow-c ‹ .brow` | 2249 | armory | h - · 12/400 ls 0.24px · var(--ink2\|--r-home) |  | `app.css:6689` `app.css:6691` `app.css:6697` | T | text |  |
| F99ad942 | `span.wg-at ‹ .wg-rail` | 2171 | armory | h - · r 6 · pad 0 10 0 10 · 12/500 · var(--ink) |  | `app.css:588` `app.css:589` `app.css:590` `app.css:591` | T | text |  |
| F964e2b3 | `span.wg-at ‹ .wg-rail` | 2107 | armory | h - · r 6 · pad 0 10 0 10 · 12/500 · var(--ink) |  | `app.css:588` `app.css:589` `app.css:590` `app.css:591` | T | text |  |
| F1017f14 | `span.wg-at ‹ .wg-rail` | 2021 | armory | h - · r 6 · pad 0 10 0 10 · 12/500 · var(--ink) |  | `app.css:588` `app.css:589` `app.css:590` `app.css:591` | T | text |  |
| Fed696b7 | `span.wg-at ‹ .wg-rail` | 1896 | armory | h - · r 6 · pad 0 10 0 10 · 12/500 · var(--ink) |  | `app.css:588` `app.css:589` `app.css:590` `app.css:591` | T | text |  |
| Fee24353 | `span.wg-at ‹ .wg-rail` | 1877 | armory | h - · r 6 · pad 0 10 0 10 · 12/500 · var(--ink) |  | `app.css:588` `app.css:589` `app.css:590` `app.css:591` | T | text |  |
| F3729465 ·d6 | `td`<br>`td ‹ .preview-sel` | 1606 | season, history | h - · pad 6 12 6 12 · 14.5/400 · var(--ink2\|--r-home) |  | `app.css:2887` | T | text |  |
| F5b42956 | `b ‹ .wg-line` | 1571 | armory | h - · 14.5/600 ls 0.0725px · var(--ink) |  | `app.css:536` | T | text |  |
| F2367594 ·d1 | `span.dsub ‹ .detcell`<br>`span.none ‹ .dsub`<br>`span.why ‹ .dw-f` +2 | 1541 | season, armory, broadcast, access, review | h - · 12/400 · var(--ink3) |  | `app.css:1286` `app.css:1744` `app.css:3232` `app.css:3331` `app.css:5932` `app.css:5933` `app.css:605` `app.css:631` +15 | T | text |  |
| Fe536d04 ·d4 | `span.arw ‹ .nums` | 1502 | season | h - · pad 0 1 0 1 · 12/400 · var(--ink3) |  | `app.css:1551` `app.css:2020` `app.css:5129` `app.css:5130` | T | text |  |
| F80776eb | `td.nums` | 1500 | season | h - · pad 6 12 6 12 · 12/400 · var(--ink2\|--r-home) |  | `app.css:1550` `app.css:1551` `app.css:1825` | T | text |  |
| F2adc498 | `span.bgrp-n ‹ .bgrp-m` | 1248 | armory | h - · 12/500 ls 0.96px · var(--ink3) |  | `app.css:4268` `app.css:4498` `app.css:6496` | T | text |  |
| F12dd69c ·d2 | `b ‹ .bgrp-w` | 1119 | armory | h - · 13/600 · var(--ink) |  | `app.css:4262` `app.css:6416` | T | text |  |
| Fe89dbd2 | `span.wg-at ‹ .wg-rail` | 1077 | armory | h - · r 6 · pad 0 10 0 10 · 12/500 · var(--ink) |  | `app.css:588` `app.css:589` `app.css:590` `app.css:591` | T | text |  |
| F9d23bf5 | `span.wg-at ‹ .wg-rail` | 699 | armory | h - · r 6 · pad 0 10 0 10 · 12/500 · var(--ink) |  | `app.css:588` `app.css:589` `app.css:590` `app.css:591` | T | text |  |
| Fac5c30f ·d1 | `span ‹ .hres`<br>`span.rec-n ‹ .rec-h`<br>`p ‹ .ow-h` +21 | 677 | home, season, armory, history, broadcast, access, analytics | h - · 12/400 · var(--ink3) |  | `app.css:5951` `app.css:3776` `app.css:3923` `app.css:1902` `app.css:6393` `app.css:6395` `app.css:4874` `app.css:4875` +20 | T | text |  |
| F4df7e98 | `span.wg-at ‹ .wg-rail` | 638 | armory | h - · r 6 · pad 0 10 0 10 · 12/500 · var(--ink) |  | `app.css:588` `app.css:589` `app.css:590` `app.css:591` | T | text |  |
| Fbd258ad | `b.bdg.rank ‹ .bgrp-m` | 586 | armory | h - · r 3 · pad 2 5 2 5 · 9.5/700 ls 0.57px · var(--info) |  | `app.css:3046` `app.css:3049` `app.css:3050` `app.css:3051` `app.css:3052` `app.css:4425` `app.css:6428` `app.css:3015` | T | text |  |
| F5100e40 | `span.wg-at ‹ .wg-rail` | 554 | armory | h - · r 6 · pad 0 10 0 10 · 12/500 · var(--ink) |  | `app.css:588` `app.css:589` `app.css:590` `app.css:591` | T | text |  |
| F02c5ee7 | `span.stt.saved ‹ .ta-r` | 532 | season | h - · r 3 · pad 2 7 2 7 · 9.5/600 ls 0.76px · var(--on-accent) |  | `app.css:696` `app.css:697` `app.css:698` `app.css:699` `app.css:1013` `app.css:1825` `app.css:4425` `app.css:4518` +10 | T | text |  |
| F91bb646 | `b.t-legendary ‹ .tiers` | 463 | season | h - · r 3 · pad 2 5 2 5 · 9.5/700 ls 0.57px · var(--patch\|--pn) |  | `app.css:1741` | T | text |  |
| F39c73d6 | `b.t-epic ‹ .tiers` | 463 | season | h - · r 3 · pad 2 5 2 5 · 9.5/700 ls 0.57px · var(--t-epic) |  | `app.css:1743` | T | text |  |
| F02aca52 ·d10 | `div.ow-c ‹ .ow-i`<br>`div.exs-c ‹ .exs-i`<br>`span.bcdt ‹ .nums` +1 | 431 | season, armory, broadcast, access, analytics, history | h - · 12/500 · var(--ink2\|--r-home) |  | `app.css:4646` `app.css:4648` `app.css:4654` `app.css:4674` `app.css:4675` `app.css:388` `app.css:389` `app.css:390` +2 | T | text |  |
| F473bb94 | `span.stt.saved ‹ .ta-r` | 418 | season | h - · r 3 · pad 2 7 2 7 · 9.5/600 ls 0.76px · var(--on-accent) |  | `app.css:696` `app.css:697` `app.css:698` `app.css:699` `app.css:1013` `app.css:1825` `app.css:4425` `app.css:4518` +10 | T | text |  |
| Fe6ffe59 | `span.wg-tag ‹ .wg-tags` | 417 | armory | h - · r 3 · pad 0 8 0 8 · 9.5/600 ls 0.95px · var(--patch\|--pn) |  | `app.css:541` `app.css:542` `app.css:543` `app.css:544` `app.css:545` `app.css:546` `app.css:547` `app.css:548` | T | text |  |
| F03f36e2 ·d2 | `b ‹ .ow-t`<br>`b ‹ .exs-t`<br>`b` | 339 | season, armory, broadcast, access, analytics, history | h - · 13/600 · var(--ink) |  | `app.css:4644` `app.css:4670` `app.css:4672` | T | text |  |
| Fef4a38c | `span.wg-tag ‹ .wg-tags` | 322 | armory | h - · r 3 · pad 0 8 0 8 · 9.5/600 ls 0.95px · var(--info) |  | `app.css:541` `app.css:542` `app.css:543` `app.css:544` `app.css:545` `app.css:546` `app.css:547` `app.css:548` | T | text |  |
| Fb00971d ·d12 | `label.sr ‹ .srch`<br>`label.sr ‹ .addrow`<br>`label.tc-l ‹ .dw-b` +6 | 271 | season, armory, broadcast, analytics, history | h - · 12/600 · var(--ink2\|--r-home) |  | `app.css:40` `app.css:4679` `app.css:4680` `app.css:494` `app.css:496` `app.css:1953` `app.css:1956` `app.css:1957` +9 | T | text |  |
| Fc0cf576 | `i ‹ .wg-fnos`<br>`i ‹ .wg-fpr` | 231 | armory | h - · r 3 · pad 0 4 0 4 · 10.5/600 · var(--warn-ink) |  | `app.css:554` `app.css:555` | T | text |  |
| F0154854 | `span.wg-tag ‹ .wg-tags` | 230 | armory | h - · r 3 · pad 0 8 0 8 · 9.5/600 ls 0.95px · color(srgb 0.415098 0.632157 0.766275) |  | `app.css:541` `app.css:542` `app.css:543` `app.css:544` `app.css:545` `app.css:546` `app.css:547` `app.css:548` | T | text |  |
| Fa45e13b | `span.stt.saved ‹ .ta-r` | 228 | season | h - · r 3 · pad 2 7 2 7 · 9.5/600 ls 0.76px · var(--on-accent) |  | `app.css:696` `app.css:697` `app.css:698` `app.css:699` `app.css:1013` `app.css:1825` `app.css:4425` `app.css:4518` +10 | T | text |  |
| F83b5897 | `span.bl ‹ .bar` | 215 | season, broadcast | h - · 10.5/600 · var(--on-accent) |  | `app.css:1470` `app.css:1612` `app.css:3836` `app.css:3843` `app.css:4072` `app.css:4074` `app.css:4075` `app.css:4076` +7 | T | text |  |
| F4bb2c23 | `span.wg-sc ‹ .wg-slots` | 206 | armory | h - · r 6 · pad 4 10 4 10 · 12/500 · var(--ink) |  | `app.css:613` `app.css:614` | T | text |  |
| F3a442e1 | `span.bc-meta ‹ .bgrp-m` | 205 | armory | h - · r 3 · pad 2 4 2 4 · 9.5/700 ls 0.855px · var(--patch\|--pn) |  | `app.css:2000` `app.css:6494` | T | text |  |
| Fe20343c | `span.wg-sc ‹ .wg-slots` | 200 | armory | h - · r 6 · pad 4 10 4 10 · 12/500 · var(--ink) |  | `app.css:613` `app.css:614` | T | text |  |
| F0266699 | `span.wg-sc ‹ .wg-slots` | 192 | armory | h - · r 6 · pad 4 10 4 10 · 12/500 · var(--ink) |  | `app.css:613` `app.css:614` | T | text |  |
| F7374bfa | `span.wg-sc.empty ‹ .wg-slots` | 190 | armory | h - · r 6 · pad 34 16 34 16 · 14.5/500 · var(--ink3) |  | `app.css:613` `app.css:614` `app.css:711` `app.css:712` `app.css:714` `app.css:1850` `app.css:6637` `app.css:6638` | T | text |  |
| F5f08f25 ·d14 | `b ‹ .tcat-top`<br>`span ‹ .dwfield`<br>`span.sr ‹ .dwfield` +1 | 187 | armory, analytics, history | h - · 12/600 · var(--ink2\|--r-home) |  | `app.css:40` `app.css:6395` `app.css:2987` `app.css:376` `app.css:3377` `app.css:3379` | T | text |  |
| F1bf2c91 | `span.brow-a ‹ .brow` | 184 | armory | h - · 9.5/400 · var(--del) |  | `app.css:6699` `app.css:6702` | T | text |  |
| Fc16a625 | `span.wg-sc ‹ .wg-slots` | 180 | armory | h - · r 6 · pad 4 10 4 10 · 12/500 · var(--ink) |  | `app.css:613` `app.css:614` | T | text |  |
| Ff823e0c | `span.wg-sc ‹ .wg-slots` | 178 | armory | h - · r 6 · pad 4 10 4 10 · 12/500 · var(--ink) |  | `app.css:613` `app.css:614` | T | text |  |
| Fd1d9ad5 ·d2 | `b ‹ .bgrp-w`<br>`b ‹ .rvn` | 161 | armory, review | h - · 14.5/600 · var(--ink) |  | `app.css:4262` `app.css:6416` `app.css:2702` | T | text |  |
| F003abb5 ·d6 | `div.round ‹ .rounds` | 160 | armory, broadcast, access, analytics, history | h - · pad 7 12 7 12 · 13/400 · var(--ink2\|--r-home) |  | `app.css:724` `app.css:726` `app.css:727` `app.css:728` `app.css:730` `app.css:739` | T | text |  |
| F078a9f4 ·d2 | `b ‹ .round` | 160 | armory, broadcast, access, analytics, history | h - · 13/500 · var(--ink) |  | `app.css:727` | T | text |  |
| F0e85d08 ·d2 | `span.rt-l ‹ .reph`<br>`span.trow-t ‹ .trow-h` | 157 | season, armory | h - · 13/600 · var(--ink) |  | `app.css:3773` `app.css:4312` `app.css:4919` | T | text |  |
| Fa2bb949 ·d2 | `b ‹ .flag`<br>`b ‹ .dwissue`<br>`em ‹ .chip` | 147 | season, armory, analytics, history | h - · 12/600 · var(--ink) |  | `app.css:321` `app.css:1951` `app.css:3035` `app.css:376` `app.css:3377` `app.css:3379` | T | text |  |
| Fb02ed4c | `span.trow-n ‹ .trow-h` | 145 | armory | h - · r 999 · pad 3 8 3 8 · 12/400 · var(--ink3) |  | `app.css:1986` `app.css:4313` `app.css:4923` `app.css:6494` | T | text |  |
| Fc97a715 | `span.rec-d ‹ .rec-row`<br>`span.rec-meta ‹ .rec-row` | 144 | season | h - · 12/500 ls 0.84px · var(--ink3) |  | `app.css:5980` `app.css:5984` | T | text |  |
| F137074d ·d2 | `span.lt ‹ .lrow`<br>`span.t ‹ .srec-c`<br>`span.pz-n ‹ .pz-r` +1 | 140 | home, season | h - · 13/400 · var(--ink) |  | `app.css:3156` `app.css:3158` `app.css:3159` `app.css:3160` `app.css:3161` `app.css:3162` `app.css:3163` `app.css:5179` +10 | T | text |  |
| F0331c23 | `span.wg-tag ‹ .wg-tags` | 139 | armory | h - · r 3 · pad 0 8 0 8 · 9.5/600 ls 0.95px · var(--danger-ink) |  | `app.css:541` `app.css:542` `app.css:543` `app.css:544` `app.css:545` `app.css:546` `app.css:547` `app.css:548` | T | text |  |
| F80737e7 | `span.v ‹ .stat`<br>`span.v.rolling ‹ .stat` | 116 | home, armory, broadcast, access, analytics, history, review | h - · 22/700 ls -0.33px · var(--ink) |  | `app.css:130` `app.css:132` `app.css:131` `app.css:1039` `app.css:1825` `app.css:2103` `app.css:2112` `app.css:2113` +9 | T | text |  |
| F2bc913c | `b.t-mythic ‹ .tiers` | 116 | season | h - · r 3 · pad 2 5 2 5 · 9.5/700 ls 0.57px · var(--t-mythic) |  | `app.css:1742` | T | text |  |
| Fa081e65 | `span.d ‹ .srec-c` | 114 | season | h - · 12/400 ls 0.48px · var(--ink2\|--r-home) |  | `app.css:474` `app.css:691` `app.css:5700` `app.css:5711` `app.css:5713` `app.css:5718` `app.css:5720` `app.css:5743` +1 | T | text |  |
| Fde2e6bc | `span.stt.saved ‹ .ta-r` | 114 | season | h - · r 3 · pad 2 7 2 7 · 9.5/600 ls 0.76px · var(--on-accent) |  | `app.css:696` `app.css:697` `app.css:698` `app.css:699` `app.css:1013` `app.css:1825` `app.css:4425` `app.css:4518` +10 | T | text |  |
| F0fe9093 | `span.stt.saved ‹ .ta-r` | 114 | season | h - · r 3 · pad 2 7 2 7 · 9.5/600 ls 0.76px · rgb(255, 255, 255) |  | `app.css:696` `app.css:697` `app.css:698` `app.css:699` `app.css:1013` `app.css:1825` `app.css:4425` `app.css:4518` +10 | T | text |  |
| F1471b74 | `b ‹ .mk` | 111 | home, season, armory, broadcast, access, analytics, history, review | h - · 12/600 ls 1.92px · var(--patch\|--pn) |  | `app.css:97` | T | text |  |
| F1b4153e | `kbd ‹ .cmdbar` | 111 | home, season, armory, broadcast, access, analytics, history, review | h - · r 6 · pad 4 6 4 6 · 12/500 ls 0.48px · var(--ink3) |  | `app.css:4129` `app.css:4131` `app.css:4168` `app.css:4391` | T | text |  |
| Fa2279f1 ·d19 | `span.id ‹ .whobtn` | 111 | home, season, armory, broadcast, access, analytics, history, review | h - · 12/500 · var(--ink2\|--r-home) |  | `app.css:1825` | T | text |  |
| F36686b1 ·d13 | `span.job ‹ .mh-id` | 111 | home, season, armory, broadcast, access, analytics, history, review | h - · 14.5/400 · var(--ink2\|--r-home) |  | `app.css:126` `app.css:1038` `app.css:2071` `app.css:2644` `app.css:3279` | T | text |  |
| F892f3dc | `span.bl ‹ .bar` | 108 | season | h - · 10.5/600 · rgb(255, 255, 255) |  | `app.css:1470` `app.css:1612` `app.css:3836` `app.css:3843` `app.css:4072` `app.css:4074` `app.css:4075` `app.css:4076` +7 | T | text |  |
| F000cec3 | `span.wg-sc ‹ .wg-slots` | 102 | armory | h - · r 6 · pad 4 10 4 10 · 12/500 · var(--ink) |  | `app.css:613` `app.css:614` | T | text |  |
| F8390c3c | `span.mh-take-n ‹ .mh-take` | 100 | season, armory, broadcast, access, analytics, history | h - · 12/400 ls 0.6px · var(--ink3) |  | `app.css:4732` | T | text |  |
| Fb2d4c02 | `b ‹ .pname` | 96 | access | h - · 12/600 ls 0.12px · var(--ink) |  | `app.css:3471` `app.css:3475` `app.css:3486` `app.css:3489` `app.css:3505` | T | text |  |
| Ff988791 | `span.wg-at.gap ‹ .wg-rail` | 92 | armory | h - · r 6 · pad 0 10 0 10 · 12/500 · var(--warn-ink) |  | `app.css:588` `app.css:589` `app.css:590` `app.css:591` `app.css:472` | T | text |  |
| F3c2638d | `span.t ‹ .srec-c`<br>`span.t.unset ‹ .srec-c` | 79 | season | h - · 13/400 · var(--warn-ink) |  | `app.css:139` `app.css:721` `app.css:2272` `app.css:5699` `app.css:5708` `app.css:5710` `app.css:5721` `app.css:5746` | T | text |  |
| F1eddc3d ·d2 | `span.bn ‹ .bcard` | 78 | season | h - · 13/600 · var(--ink) |  | `app.css:946` | T | text |  |
| Fb86b3e2 | `span.stt.saved ‹ .ta-r` | 76 | season | h - · r 3 · pad 2 7 2 7 · 9.5/600 ls 0.76px · var(--on-accent) |  | `app.css:696` `app.css:697` `app.css:698` `app.css:699` `app.css:1013` `app.css:1825` `app.css:4425` `app.css:4518` +10 | T | text |  |
| F43870ee | `span.n ‹ .ptc` | 72 | season | h - · 9.5/700 · var(--on-accent) |  | `app.css:690` `app.css:722` `app.css:1169` `app.css:1171` `app.css:1172` `app.css:4000` `app.css:4063` `app.css:5816` | T | text |  |
| F7ffca2b | `span.flag ‹ .flags` | 72 | season | h - · r 3 · pad 5 9 5 9 · 12/400 · var(--ink2\|--r-home) |  | `app.css:318` `app.css:320` `app.css:321` `app.css:322` `app.css:324` `app.css:992` `app.css:1097` `app.css:3710` +4 | T | text |  |
| Fbaad1b3 ·d2 | `b ‹ .bmeta`<br>`span.bl ‹ .bar` | 72 | season, broadcast | h - · 10.5/600 · var(--ink) |  | `app.css:1470` `app.css:1612` `app.css:3836` `app.css:3843` `app.css:4072` `app.css:4074` `app.css:4075` `app.css:4076` +10 | T | text |  |
| Ff6fc99f | `b ‹ .hdr-commit` | 71 | home, armory, broadcast, access, analytics, history, review | h - · pad 0 10 0 10 · 13/700 ls 0.052px · var(--staged\|--r-review) |  | `app.css:5280` `app.css:5290` | T | text |  |
| Fa5a252c | `span ‹ .hdr-commit` | 71 | home, armory, broadcast, access, analytics, history, review | h - · pad 0 12 0 12 · 13/400 ls 0.26px · var(--ink) |  | `app.css:5284` | T | text |  |
| F8746ba2 | `b ‹ .bqcount`<br>`span.dv ‹ .depb`<br>`span.av ‹ .ackrow` +3 | 67 | broadcast, analytics | h - · 12/600 · var(--ink) |  | `app.css:3131` `app.css:100` `app.css:105` `app.css:1016` `app.css:1417` `app.css:3211` `app.css:3218` `app.css:6595` +5 | T | text |  |
| F1f243f4 | `span.wg-sc ‹ .wg-slots` | 66 | armory | h - · r 6 · pad 4 10 4 10 · 12/500 · var(--ink) |  | `app.css:613` `app.css:614` | T | text |  |
| Fe17f7e0 ·d4 | `span.sc-none ‹ .hclock`<br>`span.sc-none ‹ .sclock`<br>`span.rkt-n ‹ .racktools` | 64 | home, season, armory | h - · 12/400 · var(--ink3) |  | `app.css:5597` `app.css:6400` | T | text |  |
| F7f00faf | `span.vh ‹ .skel`<br>`span.dn`<br>`span.dt` +4 | 64 | home, season, broadcast, analytics, review, armory, access, history | h - · 16.5/400 · var(--ink) |  | `app.css:2142` `app.css:2614` `app.css:3127` `app.css:6169` `app.css:1285` `app.css:3128` `app.css:3129` `app.css:3130` +5 | T | text |  |
| Fb50defd | `span.n ‹ .tray-h` | 60 | armory, broadcast, access, analytics, history | h - · 12/400 · var(--staged\|--r-review) |  | `app.css:690` `app.css:722` `app.css:1169` `app.css:1171` `app.css:1172` `app.css:4000` `app.css:4063` `app.css:5816` | T | text |  |
| F0234ad9 | `span.wg-sc ‹ .wg-slots` | 60 | armory | h - · r 6 · pad 4 10 4 10 · 12/500 · var(--ink) |  | `app.css:613` `app.css:614` | T | text |  |
| Fc2f6b15 | `span.v ‹ .stat` | 59 | armory, broadcast, access, analytics, review | h - · 22/700 ls -0.33px · var(--warn) |  | `app.css:130` `app.css:132` `app.css:131` `app.css:1039` `app.css:1825` `app.css:2103` `app.css:2112` `app.css:2113` +9 | T | text |  |
| Fa668bfc ·d1 | `span.none` | 55 | history | h - · 14.5/400 · var(--ink3) |  | `app.css:605` `app.css:631` `app.css:744` `app.css:1281` `app.css:1745` `app.css:1939` `app.css:2954` `app.css:3029` +2 | T | text |  |
| F78e3f16 ·d2 | `span.rec-ttl ‹ .rec-row`<br>`b ‹ .sessb` | 52 | season, access | h - · 14.5/600 · var(--ink) |  | `app.css:5977` `app.css:5978` `app.css:5979` `app.css:2578` | T | text |  |
| F386ad45 | `label ‹ .dwfield`<br>`label.seg-sw-inline` | 50 | armory, broadcast, access | h - · 12/600 · var(--ink3) |  | `app.css:6820` `app.css:6822` `app.css:1956` | T | text |  |
| Fd2564dd ·d2 | `b ‹ .selbar-t`<br>`span.mh-plus ‹ .pill` | 49 | season, armory, history, broadcast, access | h - · 13/600 · var(--ink) |  | `app.css:5925` `app.css:4564` | T | text |  |
| F01f8df2 | `span.wg-ct.bad ‹ .wg-igf` | 46 | armory | h - · 12/600 ls 0.96px · var(--warn-ink) |  | `app.css:599` `app.css:600` `app.css:333` `app.css:576` `app.css:1860` `app.css:1882` `app.css:1895` `app.css:1945` +25 | T | text |  |
| F38c1a19 | `span.wg-cnone ‹ .wg-ig` | 46 | armory | h - · 12/600 · var(--warn-ink) |  | `app.css:606` `app.css:607` | T | text |  |
| F9d2f19e | `span.wg-at ‹ .wg-rail` | 46 | armory | h - · r 6 · pad 0 10 0 10 · 12/500 · var(--ink) |  | `app.css:588` `app.css:589` `app.css:590` `app.css:591` | T | text |  |
| F16978a5 | `span.lv2 ‹ .lvlb`<br>`span.ubv ‹ .ub2` | 46 | analytics | h - · 14.5/600 · var(--ink) |  | `app.css:3164` `app.css:2612` `app.css:2614` `app.css:2615` `app.css:3189` `app.css:3191` | T | text |  |
| Fa1d8dfd ·d2 | `b ‹ .callout`<br>`b` | 45 | armory, access, broadcast | h - · 13/700 · var(--ink) |  | `app.css:2131` `app.css:3733` | T | text |  |
| F2d0ebb8 | `span.ow-k ‹ .ow-h` | 40 | season | h - · r 6 · pad 5 8 5 8 · 9.5/700 ls 1.615px · var(--danger-ink) |  | `app.css:4634` | T | text |  |
| F0d8ed32 | `p.srec-title ‹ .srec` | 38 | season | h - · 22/400 · var(--ink) |  | `app.css:5654` `app.css:5656` | T | text |  |
| F8942cc2 | `span.dfl ‹ .dflag` | 36 | season | h - · 9.5/700 ls 0.76px · var(--ink) |  | `app.css:1659` | T | text |  |
| Ff94decc ·d13 | `span.rec-ttl ‹ .rec-row` | 36 | season | h - · 14.5/600 · var(--ink2\|--r-home) |  | `app.css:5977` `app.css:5978` `app.css:5979` | T | text |  |
| Fe1ec054 | `span.brow-none ‹ .brow` | 36 | armory | h - · 12/400 · var(--warn) |  | `app.css:6695` | T | text |  |
| F555a9d8 ·d1 | `span.brow-n.sec ‹ .brow` | 36 | armory | h - · 12/400 · var(--ink3) |  | `app.css:6692` `app.css:6693` `app.css:6697` `app.css:5611` `app.css:6107` `app.css:6126` | T | text |  |
| Fff4d676 | `span.bpill ‹ .bmeta` | 36 | broadcast | h - · r 6 · pad 0 10 0 10 · 12/500 · var(--ink2\|--r-home) |  | `app.css:429` | T | text |  |
| Fde8bf1a ·d13 | `span.al ‹ .ackrow`<br>`span.dl ‹ .durrow`<br>`span.ek ‹ .erow` +1 | 34 | analytics | h - · 12/400 · var(--ink2\|--r-home) |  | `app.css:3209` `app.css:3210` `app.css:3211` `app.css:3199` `app.css:3204` `app.css:3235` `app.css:3241` | T | text |  |
| F562a18d | `span.rvk ‹ .rvr`<br>`span.rvwas ‹ .rvr` | 34 | review | h - · pad 11 12 11 12 · 14.5/400 · var(--ink3) |  | `app.css:2719` `app.css:2720` | T | text |  |
| F80b1a47 ·d2 | `b` | 32 | season | h - · 12/600 · var(--ink) |  | — | T | text |  |
| Fe8d3f17 ·d1 | `span ‹ .lrow` | 32 | access | h - · 12/400 · var(--ink3) |  | — | T | text |  |
| F14238ed ·d2 | `b` | 32 | access | h - · 12/600 · var(--ink) |  | — | T | text |  |
| F172a66a ·d3 | `span.atn ‹ .atr`<br>`span.av ‹ .ackrow`<br>`span.ev ‹ .erow` +1 | 31 | armory, analytics | h - · 12/600 · var(--ink3) |  | `app.css:4896` `app.css:6504` `app.css:6751` `app.css:100` `app.css:105` `app.css:1016` `app.css:1417` `app.css:3211` +6 | T | text |  |
| Ff2b26f1 ·d1 | `span`<br>`span ‹ .seg-sw-inline`<br>`i` | 30 | armory, broadcast, access | h - · 12/600 · var(--ink3) |  | — | T | text |  |
| F55b8646 ·d10 | `span.dn ‹ .depb`<br>`span.atlas-tile` | 28 | analytics | h - · 12/500 · var(--ink2\|--r-home) |  | `app.css:2614` `app.css:3127` `app.css:6169` `app.css:501` `app.css:502` | T | text |  |
| F191d162 | `span.bend ‹ .btl` | 27 | broadcast | h - · r 6 · 12/500 · var(--ink2\|--r-home) |  | `app.css:420` `app.css:421` `app.css:422` `app.css:448` | T | text |  |
| F30a5650 ·d1 | `span.bcdt.dim ‹ .nums` | 27 | broadcast | h - · 12/500 · var(--ink3) |  | `app.css:388` `app.css:389` `app.css:390` `app.css:391` | T | text |  |
| Fd135cd7 | `span.v ‹ .stat`<br>`span.v.rolling ‹ .stat` | 25 | armory | h - · 44/700 ls -1.232px · var(--r-armory) |  | `app.css:130` `app.css:132` `app.css:131` `app.css:1039` `app.css:1825` `app.css:2103` `app.css:2112` `app.css:2113` +9 | T | text |  |
| Ff731057 | `span.v ‹ .stat` | 25 | armory | h - · 22/700 ls -0.33px · var(--staged\|--r-review) |  | `app.css:130` `app.css:132` `app.css:131` `app.css:1039` `app.css:1825` `app.css:2103` `app.css:2112` `app.css:2113` +9 | T | text |  |
| Ffd7a3ce | `span.wg-tag ‹ .wg-tags` | 23 | armory | h - · r 3 · pad 0 8 0 8 · 9.5/600 ls 0.95px · color(srgb 0.331216 0.617725 0.791529) |  | `app.css:541` `app.css:542` `app.css:543` `app.css:544` `app.css:545` `app.css:546` `app.css:547` `app.css:548` | T | text |  |
| F79c0c1b ·d2 | `span ‹ .wg-plate` | 23 | armory | h - · 12/600 · var(--ink) |  | `app.css:586` | T | text |  |
| Fb74a204 ·d33 | `b ‹ .nw-note` | 22 | season | h - · 13/700 · var(--ink3) |  | — | T | text |  |
| F110f7a1 | `span.cv.d` | 21 | armory | h - · r 3 · pad 0 10 0 10 · 12/600 · var(--ink) |  | `app.css:473` `app.css:474` `app.css:475` `app.css:476` `app.css:477` `app.css:1389` `app.css:4156` `app.css:4157` +10 | T | text |  |
| F70c2611 ·d2 | `span.sr ‹ .cv` | 21 | armory | h - · 12/600 · var(--ink) |  | `app.css:40` | T | text |  |
| F2823507 | `span.nextmark ‹ .rowmeta` | 20 | season | h - · r 3 · pad 1 5 1 5 · 9.5/400 ls 0.665px · var(--staged\|--r-review) |  | `app.css:1580` | T | text |  |
| Fe4a6bf7 ·d1 | `span ‹ .dnote`<br>`span.why ‹ .ccard`<br>`span ‹ .covfact` | 19 | home, armory | h - · 12/400 · var(--ink3) |  | `app.css:345` `app.css:346` `app.css:3303` `app.css:6271` `app.css:6272` `app.css:6569` `app.css:3099` | T | text |  |
| F4a12d31 ·d1 | `span.tl-s ‹ .tile` | 19 | analytics | h - · 12/400 · var(--ink3) |  | `app.css:2601` | T | text |  |
| Fea32a0d ·d1 | `p.nw-note ‹ .nw-form`<br>`p.nw-note ‹ .nw-f` | 18 | season | h - · 13/400 · var(--ink3) |  | `app.css:3921` `app.css:6318` | T | text |  |
| Ff40828b | `span.cv ‹ .base`<br>`span.cv` | 18 | armory | h - · r 3 · pad 0 10 0 10 · 12/500 · var(--ink2\|--r-home) |  | `app.css:473` `app.css:474` `app.css:475` `app.css:476` `app.css:477` `app.css:1389` `app.css:4156` `app.css:4157` +2 | T | text |  |
| Fd648c65 | `p ‹ .benc` | 18 | broadcast | h - · pad 13 18 2 18 · 14.5/500 · var(--ink) |  | `app.css:412` `app.css:413` | T | text |  |
| F7c74611 | `span.btab` | 18 | broadcast | h - · r 3 · pad 0 11 0 12 · 12/600 · var(--ok) |  | `app.css:392` `app.css:393` `app.css:394` | T | text |  |
| F7254a54 ·d3 | `span.bqcount ‹ .sp`<br>`span.rvop-name ‹ .rvdet` | 17 | broadcast, review | h - · 12/500 · var(--ink3) |  | `app.css:401` `app.css:402` `app.css:2710` | T | text |  |
| F1baf116 | `span.rvnow ‹ .rvr` | 17 | review | h - · pad 11 12 11 12 · 14.5/600 · var(--ok) |  | `app.css:2721` `app.css:2722` | T | text |  |
| Faeb7c25 | `span.att-i ‹ .att-row` | 15 | home | h - · 12/600 ls 0.72px · var(--ink3) |  | `app.css:4197` `app.css:4210` `app.css:4213` `app.css:4392` `app.css:5138` | T | text |  |
| Fed424f6 ·d2 | `b ‹ .att-x` | 15 | home | h - · 16.5/600 · var(--ink) |  | `app.css:4201` `app.css:5135` | T | text |  |
| F283248a ·d13 | `span.net-m ‹ .netbar`<br>`p ‹ .failbox` | 14 | home, season, broadcast | h - · 13/400 · var(--ink2\|--r-home) |  | `app.css:2209` `app.css:2175` | T | text |  |
| Fce6f645 | `b ‹ .bmeta` | 12 | season | h - · 10.5/600 · var(--warn) |  | `app.css:956` `app.css:957` `app.css:1825` | T | text |  |
| F01ec779 | `span.cv.x ‹ .base`<br>`span.cv.x` | 12 | armory | h - · r 3 · pad 0 10 0 10 · 12/500 · var(--ink3) |  | `app.css:473` `app.css:474` `app.css:475` `app.css:476` `app.css:477` `app.css:1389` `app.css:4156` `app.css:4157` +7 | T | text |  |
| F09f4e16 ·d2 | `b ‹ .fail-h`<br>`b ‹ .gp-n` | 10 | home, season, broadcast, access | h - · 14.5/600 · var(--ink) |  | `app.css:2174` `app.css:6530` | T | text |  |
| F21612d3 ·d33 | `b` | 10 | season, access | h - · 12/700 · var(--ink3) |  | — | T | text |  |
| F34b41e8 ·d13 | `p.dw-p ‹ .dwbody`<br>`li ‹ .dw-l` | 10 | season, armory, broadcast, history, review | h - · 13/400 · var(--ink2\|--r-home) |  | `app.css:1400` `app.css:1401` `app.css:2905` | T | text |  |
| Fb2e066a | `span.v ‹ .stat` | 10 | broadcast | h - · 44/700 ls -1.232px · var(--r-broadcast) |  | `app.css:130` `app.css:132` `app.css:131` `app.css:1039` `app.css:1825` `app.css:2103` `app.css:2112` `app.css:2113` +9 | T | text |  |
| F23b0ae9 | `span.v.stg-clear ‹ .stat` | 10 | broadcast | h - · 22/700 ls -0.33px · var(--ink2\|--r-home) |  | `app.css:130` `app.css:132` `app.css:131` `app.css:1039` `app.css:1825` `app.css:2103` `app.css:2112` `app.css:2113` +9 | T | text |  |
| F751bafd ·d13 | `span ‹ .callout` | 10 | broadcast | h - · 13/400 · var(--ink2\|--r-home) |  | — | T | text |  |
| Fb8f311b | `span.tl-v ‹ .tile` | 10 | analytics | h - · 34/700 ls 0.136px · var(--ink) |  | `app.css:2598` `app.css:2600` `app.css:2602` `app.css:2601` | T | text |  |
| Fdda3e28 ·d41 | `p.empty ‹ .panel`<br>`p.empty ‹ .bed-sec` | 9 | season, armory, broadcast, analytics, history | h - · pad 34 16 34 16 · 14.5/400 · var(--ink3) |  | `app.css:614` `app.css:711` `app.css:712` `app.css:714` `app.css:1850` `app.css:6637` `app.css:6638` | T | text |  |
| Fc6ce2d1 | `div.callout`<br>`div.callout ‹ .panel` | 9 | armory, access | h - · pad 12 16 12 16 · 13/400 · var(--ink2\|--r-home) |  | `app.css:2129` `app.css:2131` `app.css:3731` `app.css:3733` | T | text |  |
| F946f688 | `span.bnum ‹ .qcard` | 9 | broadcast | h - · 58/700 · oklab(0.883231 -0.00000779025 0.0841211) |  | `app.css:409` `app.css:445` | T | text |  |
| Fad24628 | `span.bend.nev ‹ .btl` | 9 | broadcast | h - · r 6 · 12/500 · var(--warn-ink) |  | `app.css:420` `app.css:421` `app.css:422` `app.css:448` | T | text |  |
| Fd352380 | `span.bnum ‹ .qcard` | 9 | broadcast | h - · 58/700 · oklab(0.73458 -0.0619035 0.0183663) |  | `app.css:409` `app.css:445` | T | text |  |
| F3488f4c | `span.btab` | 9 | broadcast | h - · r 3 · pad 0 11 0 12 · 12/600 · var(--ink3) |  | `app.css:392` `app.css:393` `app.css:394` | T | text |  |
| F3db511e | `span.bcdt.never ‹ .nums` | 9 | broadcast | h - · 12/600 · var(--warn-ink) |  | `app.css:388` `app.css:389` `app.css:390` `app.css:391` `app.css:3204` `app.css:5323` | T | text |  |
| F457df81 | `span.btab` | 9 | broadcast | h - · r 3 · pad 0 11 0 12 · 12/600 · var(--sched) |  | `app.css:392` `app.css:393` `app.css:394` | T | text |  |
| Fb64ddce | `span.v ‹ .stat`<br>`span.v.rolling ‹ .stat` | 9 | analytics | h - · 44/700 ls -1.232px · var(--r-analytics) |  | `app.css:130` `app.css:132` `app.css:131` `app.css:1039` `app.css:1825` `app.css:2103` `app.css:2112` `app.css:2113` +9 | T | text |  |
| Fb474294 | `span.tl-v ‹ .tile` | 9 | analytics | h - · 34/700 ls 0.136px · var(--warn) |  | `app.css:2598` `app.css:2600` `app.css:2602` `app.css:2601` | T | text |  |
| Fe7a63b2 | `span.rt-n ‹ .reph` | 8 | season | h - · 17/700 · var(--warn) |  | `app.css:3771` `app.css:3772` | T | text |  |
| F4b42e74 | `b ‹ .empty` | 8 | season, armory, broadcast, analytics, history | h - · 16.5/700 · var(--ink2\|--r-home) |  | `app.css:712` | T | text |  |
| F1b85ec9 | `span.stt.staged ‹ .ta-r` | 8 | season | h - · r 3 · pad 2 7 2 7 · 9.5/600 ls 0.76px · var(--play) |  | `app.css:696` `app.css:697` `app.css:698` `app.css:699` `app.css:1013` `app.css:1825` `app.css:4425` `app.css:4518` +16 | T | text |  |
| F46d36b3 ·d2 | `span.brow-n ‹ .brow` | 8 | armory | h - · 12/400 · var(--ink) |  | `app.css:6692` `app.css:6693` `app.css:6697` | T | text |  |
| F06b0ed4 | `span.v ‹ .stat` | 8 | access | h - · 44/700 ls -1.232px · var(--r-access) |  | `app.css:130` `app.css:132` `app.css:131` `app.css:1039` `app.css:1825` `app.css:2103` `app.css:2112` `app.css:2113` +9 | T | text |  |
| F3798928 | `code ‹ .callout` | 8 | access | h - · 13/400 · var(--ink2\|--r-home) |  | `app.css:2131` | T | text |  |
| Ff6e207d | `td.mxc-held.held.spof ‹ .prow` | 8 | access | h - · 16.5/500 · color(srgb 0.709216 0.616667 0.955882) |  | `app.css:3398` `app.css:3407` `app.css:3408` `app.css:3501` `app.css:3517` `app.css:3712` | T | text |  |
| F417b8e2 | `td.mxc-held.held.zero ‹ .prow` | 8 | access | h - · 16.5/500 · color(srgb 0.422353 0.810784 0.882549) |  | `app.css:3398` `app.css:3407` `app.css:3408` `app.css:3501` `app.css:3517` `app.css:2114` `app.css:3211` `app.css:3247` +3 | T | text |  |
| F41af08b | `td.mxc-held.held.spof ‹ .prow` | 8 | access | h - · 16.5/500 · color(srgb 0.914118 0.804314 0.442549) |  | `app.css:3398` `app.css:3407` `app.css:3408` `app.css:3501` `app.css:3517` `app.css:3712` | T | text |  |
| Ff01dbb1 | `td.mxc-held.held.spof ‹ .prow` | 8 | access | h - · 16.5/500 · color(srgb 0.924902 0.564902 0.571961) |  | `app.css:3398` `app.css:3407` `app.css:3408` `app.css:3501` `app.css:3517` `app.css:3712` | T | text |  |
| F176d913 | `td.mxc-held.held.spof ‹ .prow` | 8 | access | h - · 16.5/500 · color(srgb 0.946471 0.666274 0.472745) |  | `app.css:3398` `app.css:3407` `app.css:3408` `app.css:3501` `app.css:3517` `app.css:3712` | T | text |  |
| F701b2d3 | `td.mxc-held.held ‹ .prow` | 8 | access | h - · 16.5/500 · color(srgb 0.452549 0.815098 0.783333) |  | `app.css:3398` `app.css:3407` `app.css:3408` `app.css:3501` `app.css:3517` | T | text |  |
| Feb1d3ce | `td.mxc-held.held ‹ .prow` | 8 | access | h - · 16.5/500 · color(srgb 0.918431 0.573529 0.755294) |  | `app.css:3398` `app.css:3407` `app.css:3408` `app.css:3501` `app.css:3517` | T | text |  |
| Fb5fbe5b | `td.mxc-held.held ‹ .prow` | 8 | access | h - · 16.5/500 · color(srgb 0.482745 0.843137 0.628039) |  | `app.css:3398` `app.css:3407` `app.css:3408` `app.css:3501` `app.css:3517` | T | text |  |
| F0cbb476 | `td.mxc-held.held.spof ‹ .prow` | 8 | access | h - · 16.5/500 · color(srgb 0.76098 0.914314 0.539608) |  | `app.css:3398` `app.css:3407` `app.css:3408` `app.css:3501` `app.css:3517` `app.css:3712` | T | text |  |
| F1455dd6 | `td.mxc-held.held.spof ‹ .prow` | 8 | access | h - · 16.5/500 · color(srgb 0.536667 0.698627 0.955882) |  | `app.css:3398` `app.css:3407` `app.css:3408` `app.css:3501` `app.css:3517` `app.css:3712` | T | text |  |
| F73fbff1 | `td.mxc-held.held.spof ‹ .prow` | 8 | access | h - · 16.5/500 · color(srgb 0.937843 0.75902 0.44902) |  | `app.css:3398` `app.css:3407` `app.css:3408` `app.css:3501` `app.css:3517` `app.css:3712` | T | text |  |
| Fad0ef28 | `td.mxc-held.held ‹ .prow` | 8 | access | h - · 16.5/500 · color(srgb 0.877451 0.569216 0.940784) |  | `app.css:3398` `app.css:3407` `app.css:3408` `app.css:3501` `app.css:3517` | T | text |  |
| F4c0fcac | `code` | 8 | access | h - · 12/400 · var(--ink3) |  | — | T | text |  |
| Fa9ab81f ·d37 | `b ‹ .seen` | 8 | access | h - · 12/600 · var(--ok) |  | `app.css:2586` | T | text |  |
| F793ec4c | `b ‹ .seen` | 8 | access | h - · 12/600 · var(--del) |  | `app.css:2586` | T | text |  |
| F247b9e3 | `i ‹ .tl-v` | 8 | analytics | h - · 16.5/700 ls 0.136px · var(--ink3) |  | `app.css:2600` | T | text |  |
| Fc4e761e ·d37 | `b.ok ‹ .bootgrid` | 8 | analytics | h - · 10.5/700 · var(--ok) |  | `app.css:1748` `app.css:1881` `app.css:1944` `app.css:2602` `app.css:2736` `app.css:3034` `app.css:3035` `app.css:3177` +4 | T | text |  |
| Faa86263 | `span.v ‹ .stat` | 8 | analytics, history | h - · 44/700 ls -1.232px · var(--r-history) |  | `app.css:130` `app.css:132` `app.css:131` `app.css:1039` `app.css:1825` `app.css:2103` `app.css:2112` `app.css:2113` +9 | T | text |  |
| F84925e3 ·d4 | `em ‹ .chip` | 8 | analytics, history | h - · 12/600 · var(--ink3) |  | `app.css:376` `app.css:3377` `app.css:3379` | T | text |  |
| F25cd150 | `span.v ‹ .stat` | 8 | review | h - · 44/700 ls -1.232px · var(--staged\|--r-review) |  | `app.css:130` `app.css:132` `app.css:131` `app.css:1039` `app.css:1825` `app.css:2103` `app.css:2112` `app.css:2113` +9 | T | text |  |
| Fc798210 | `span.rvbadge ‹ .rvop-name` | 8 | review | h - · r 3 · pad 0 6 0 6 · 12/500 · var(--ink2\|--r-home) |  | `app.css:509` `app.css:510` | T | text |  |
| F2abe632 ·d40 | `span.rvgate ‹ .rvgates` | 8 | review | h - · 12/400 · var(--warn) |  | `app.css:2735` `app.css:2736` `app.css:2743` | T | text |  |
| Fc641864 ·d2 | `b ‹ .netbar` | 7 | home, season, broadcast | h - · 13/700 · var(--ink) |  | `app.css:2208` | T | text |  |
| Fd64fc54 | `span.fail-k ‹ .fail-h` | 7 | home, season, broadcast | h - · r 3 · pad 4 6 4 6 · 9.5/700 ls 1.52px · var(--danger-ink) |  | `app.css:2172` | T | text |  |
| F2e8ff49 | `pre.fail-d ‹ .failbox` | 7 | home, season, broadcast | h - · r 6 · pad 8 10 8 10 · 12/400 · var(--ink3) |  | `app.css:2176` | T | text |  |
| F707ef87 | `span.bf-n`<br>`span.bf-n ‹ .bf-h` | 7 | armory | h - · r 999 · pad 4 8 4 8 · 12/500 ls 0.96px · var(--ink3) |  | `app.css:4872` `app.css:6495` | T | text |  |
| F8e191d6 | `p ‹ .v2-text` | 7 | armory | h - · 12/400 · var(--dc-body) |  | `v2card.css:32` `v2card.css:33` | T | text |  |
| F2582753 ·d39 | `b ‹ .covfact` | 7 | armory | h - · 14.5/600 · var(--ink2\|--r-home) |  | `app.css:3097` | T | text |  |
| F40e95e2 | `td ‹ .sel` | 6 | season, history | h - · pad 6 12 6 12 · 14.5/400 · var(--ink2\|--r-home) |  | `app.css:688` | T | text |  |
| F064cd58 | `span.selbar-n ‹ .selbar-in` | 6 | season, armory, history | h - · 19/600 ls -0.38px · var(--staged\|--r-review) |  | `app.css:4561` | T | text |  |
| F51a44a3 | `span.stt.staged ‹ .ta-r` | 6 | season | h - · r 3 · pad 2 7 2 7 · 9.5/600 ls 0.76px · var(--ret) |  | `app.css:696` `app.css:697` `app.css:698` `app.css:699` `app.css:1013` `app.css:1825` `app.css:4425` `app.css:4518` +16 | T | text |  |
| F5a97a72 ·d45 | `span.req` | 6 | armory | h - · 12/700 · var(--patch\|--pn) |  | `app.css:4868` | T | text |  |
| F6ea2238 | `label.bf-tog ‹ .bf-badges` | 6 | armory | h - · r 10 · pad 10 13 10 13 · 13/600 · var(--ink2\|--r-home) |  | `app.css:4906` `app.css:4909` `app.css:4910` `app.css:4911` | T | text |  |
| Fb4a42ac ·d19 | `span ‹ .bf-tog` | 6 | armory | h - · 13/600 · var(--ink2\|--r-home) |  | — | T | text |  |
| Fd8d0416 ·d2 | `span.cname ‹ .ccard` | 6 | armory | h - · 13/600 · var(--ink) |  | `app.css:1880` | T | text |  |
| Fde804fb ·d39 | `span.ubk ‹ .ub2` | 6 | analytics | h - · 14.5/500 · var(--ink2\|--r-home) |  | `app.css:2607` `app.css:3184` | T | text |  |
| Fa35033e ·d43 | `span.dk ‹ .diff-r` | 6 | history | h - · pad 9 12 9 12 · 12/400 ls 0.6px · var(--ink3) |  | `app.css:1512` `app.css:6499` | T | text |  |
| F3aac332 ·d6 | `span ‹ .diff-r` | 6 | history | h - · pad 9 12 9 12 · 13/400 · var(--ink2\|--r-home) |  | `app.css:1313` `app.css:1314` | T | text |  |
| Ff446e87 | `span.nw-date-echo.ok` | 5 | season | h - · 9.5/400 ls 0.95px · var(--ok) |  | `app.css:5364` `app.css:5366` `app.css:5367` `app.css:1748` `app.css:1881` `app.css:1944` `app.css:2602` `app.css:2736` +6 | T | text |  |
| Fad7eea6 | `span.cv.m.d` | 5 | armory | h - · r 3 · pad 0 10 0 10 · 12/600 ls 0.48px · var(--ink) |  | `app.css:473` `app.css:474` `app.css:475` `app.css:476` `app.css:477` `app.css:1389` `app.css:4156` `app.css:4157` +10 | T | text |  |
| F17f02d7 | `span.sr ‹ .cv` | 5 | armory | h - · 12/600 ls 0.48px · var(--ink) |  | `app.css:40` | T | text |  |
| F0209dd9 ·d1 | `span ‹ .ustat`<br>`p ‹ .nodraft`<br>`p.gread ‹ .hpanel` | 4 | home, season, analytics | h - · 13/400 · var(--ink3) |  | `app.css:5326` `app.css:5327` `app.css:5328` `app.css:5781` | T | text |  |
| F8e33d98 | `span.rt-n ‹ .reph` | 4 | season | h - · 17/700 · var(--ink3) |  | `app.css:3771` `app.css:3772` | T | text |  |
| F9350156 | `b ‹ .row` | 4 | season | h - · 11.5/500 · var(--dc-ink) |  | `app.css:816` `app.css:1011` | T | text |  |
| F75132e0 | `span ‹ .row` | 4 | season | h - · 10.5/400 · var(--dc-dim) |  | `app.css:817` `app.css:1011` | T | text |  |
| F268a2fa ·d40 | `span.why.blocked ‹ .dw-f` | 4 | armory, broadcast | h - · 12/400 · var(--warn) |  | `app.css:345` `app.css:346` `app.css:3303` `app.css:6271` `app.css:6272` `app.css:6569` `app.css:344` | T | text |  |
| Fe5ae6ad | `b ‹ .cmpstat` | 4 | armory | h - · 13/600 · var(--ink) |  | `app.css:6472` | T | text |  |
| F390e6f5 | `span.wg-tag ‹ .wg-tags` | 4 | armory | h - · r 3 · pad 0 8 0 8 · 9.5/600 ls 0.95px · var(--mode-dmz) |  | `app.css:541` `app.css:542` `app.css:543` `app.css:544` `app.css:545` `app.css:546` `app.css:547` `app.css:548` | T | text |  |
| F7dbdeeb | `span.wg-sc ‹ .wg-slots` | 4 | armory | h - · r 6 · pad 4 10 4 10 · 12/500 · var(--ink) |  | `app.css:613` `app.css:614` | T | text |  |
| F6686bb2 | `span.cn.bad ‹ .ccard` | 4 | armory | h - · 16.5/600 · var(--warn) |  | `app.css:342` `app.css:1881` `app.css:1882` `app.css:333` `app.css:576` `app.css:600` `app.css:1860` `app.css:1895` +26 | T | text |  |
| F4851b6b ·d2 | `b ‹ .atlas-tile` | 4 | analytics | h - · 12/700 · var(--ink) |  | `app.css:502` | T | text |  |
| F6093ac9 ·d13 | `p` | 4 | analytics | h - · 12/400 · var(--ink2\|--r-home) |  | — | T | text |  |
| F9fd8940 | `span.lp ‹ .lvlb` | 4 | analytics | h - · 9.5/400 · var(--danger-ink) |  | `app.css:516` `app.css:517` `app.css:3155` `app.css:3157` `app.css:3166` `app.css:5170` `app.css:5409` | T | text |  |
| Fca8738a | `span.v ‹ .stat` | 3 | home | h - · 44/700 ls -1.232px · var(--warn) |  | `app.css:130` `app.css:132` `app.css:131` `app.css:1039` `app.css:1825` `app.css:2103` `app.css:2112` `app.css:2113` +9 | T | text |  |
| F014b95f ·d2 | `b ‹ .hres` | 3 | home | h - · 14.5/600 · var(--ink) |  | `app.css:2680` | T | text |  |
| F4f0eb65 | `span.d.tbd ‹ .srec-c` | 3 | season | h - · 12/400 ls 0.48px · var(--ink3) |  | `app.css:474` `app.css:691` `app.css:5700` `app.css:5711` `app.css:5713` `app.css:5718` `app.css:5720` `app.css:5743` +1 | T | text |  |
| Fb50968f | `span.bf-buildno ‹ .bf-buildno-wrap` | 3 | armory | h - · 12/700 ls 0.72px · var(--r-armory) |  | `app.css:6734` | T | text |  |
| F19c5341 | `label.chip.filedrop ‹ .imgdrop` | 3 | armory | h - · r 999 · pad 6 11 6 11 · 12/600 · var(--ink2\|--r-home) |  | `app.css:371` `app.css:375` `app.css:376` `app.css:456` `app.css:457` `app.css:458` `app.css:483` `app.css:486` +41 | T | text |  |
| F0b88623 | `span.cv.rm` | 3 | armory | h - · r 3 · pad 0 10 0 10 · 12/500 · var(--warn) |  | `app.css:473` `app.css:474` `app.css:475` `app.css:476` `app.css:477` `app.css:1389` `app.css:4156` `app.css:4157` +2 | T | text |  |
| Ffd5573f ·d19 | `span ‹ .never-ends-field`<br>`span.dlab ‹ .dcell` | 3 | broadcast, analytics | h - · 12/600 · var(--ink2\|--r-home) |  | `app.css:3231` | T | text |  |
| F3b8234a ·d43 | `span.dk ‹ .diff-r` | 3 | analytics | h - · pad 9 12 9 12 · 12/400 ls 0.6px · var(--ink3) |  | `app.css:1512` `app.css:6499` | T | text |  |
| F70f5427 | `span ‹ .diff-r` | 3 | analytics | h - · pad 9 12 9 12 · 13/400 · var(--ink) |  | `app.css:1313` `app.css:1314` | T | text |  |
| Ff170689 | `p ‹ .doorcard` | 2 | home | h - · 14.5/400 · var(--ink3) |  | `app.css:2769` | T | text |  |
| F1076e47 ·d33 | `b` | 2 | home | h - · 12/700 · var(--ink3) |  | — | T | text |  |
| F5bdb990 | `p.bempty ‹ .bcol-body` | 2 | season | h - · r 6 · pad 18 10 18 10 · 12/400 · var(--ink3) |  | `app.css:1379` | T | text |  |
| F5fc4cb4 | `div.rephead ‹ .repwrap` | 2 | season | h - · pad 0 0 12 0 · 13/400 · var(--ink2\|--r-home) |  | `app.css:3764` `app.css:3765` | T | text |  |
| F807f37b | `b ‹ .rephead` | 2 | season | h - · 16.5/700 · var(--ink) |  | `app.css:3765` | T | text |  |
| Ffaa6b3a | `td.nums ‹ .sel` | 2 | season | h - · pad 6 12 6 12 · 12/400 · var(--ink2\|--r-home) |  | `app.css:1550` `app.css:1551` `app.css:1825` | T | text |  |
| F2d304d4 | `span.stt.staged ‹ .ta-r` | 2 | season | h - · r 3 · pad 2 7 2 7 · 9.5/600 ls 0.76px · var(--ev) |  | `app.css:696` `app.css:697` `app.css:698` `app.css:699` `app.css:1013` `app.css:1825` `app.css:4425` `app.css:4518` +16 | T | text |  |
| Fb47001b | `span.stt.staged ‹ .ta-r` | 2 | season | h - · r 3 · pad 2 7 2 7 · 9.5/600 ls 0.76px · var(--draw) |  | `app.css:696` `app.css:697` `app.css:698` `app.css:699` `app.css:1013` `app.css:1825` `app.css:4425` `app.css:4518` +16 | T | text |  |
| Fc41b8a9 | `span.stt.staged ‹ .ta-r` | 2 | season | h - · r 3 · pad 2 7 2 7 · 9.5/600 ls 0.76px · var(--dw) |  | `app.css:696` `app.css:697` `app.css:698` `app.css:699` `app.css:1013` `app.css:1825` `app.css:4425` `app.css:4518` +16 | T | text |  |
| F133d150 ·d2 | `b ‹ .dw-p` | 2 | season | h - · 13/600 · var(--ink) |  | `app.css:1401` | T | text |  |
| F563f423 | `div.lc-h ‹ .dcard` | 2 | armory | h - · 12/700 · var(--dc-ink) |  | `app.css:2946` | T | text |  |
| Feb2ec08 | `p.empty ‹ .cmp` | 2 | armory | h - · pad 24 16 12 16 · 13/400 · var(--ink3) |  | `app.css:614` `app.css:711` `app.css:712` `app.css:714` `app.css:1850` `app.css:6637` `app.css:6638` | T | text |  |
| Fdfdd422 ·d1 | `span.sr ‹ .k` | 2 | armory | h - · 12/500 · var(--ink3) |  | `app.css:40` | T | text |  |
| F09c789c | `span.pill ‹ .cmpsame` | 2 | armory | h - · r 999 · pad 6 12 6 12 · 12/500 · var(--ink3) |  | `app.css:480` `app.css:481` `app.css:714` `app.css:2125` `app.css:3939` `app.css:3943` `app.css:3944` `app.css:3945` +24 | T | text |  |
| Fa987f73 ·d2 | `b ‹ .pill` | 2 | armory | h - · 12/600 · var(--ink) |  | `app.css:481` | T | text |  |
| F1b84ef2 ·d31 | `code ‹ .bgnote` | 2 | armory | h - · 10.5/400 · var(--ink) |  | `app.css:3019` | T | text |  |
| F109f077 | `p.v2-small ‹ .v2-text` | 2 | armory | h - · 9.5/400 · var(--dc-dim) |  | `v2card.css:35` | T | text |  |
| Fbdf810e | `span.step-val ‹ .stepper` | 2 | broadcast | h - · 12/700 · var(--ink2\|--r-home) |  | `app.css:6836` | T | text |  |
| Fd8b2df7 | `b ‹ .gread` | 2 | analytics | h - · 13/600 · var(--ok) |  | `app.css:5327` | T | text |  |
| Ff5c213f ·d49 | `em ‹ .gread` | 2 | analytics | h - · 13/600 · var(--warn) |  | `app.css:5328` | T | text |  |
| F47b672f | `b ‹ .donut` | 2 | analytics | h - · r 50 · 19/600 ls -0.285px · var(--ink) |  | `app.css:3228` `app.css:3230` | T | text |  |
| F2512195 | `i` | 2 | analytics | h - · 12/600 ls -0.285px · var(--ink3) |  | — | T | text |  |
| F96c346e | `td ‹ .zero` | 2 | analytics | h - · pad 6 12 6 12 · 14.5/400 · var(--ink2\|--r-home) |  | `app.css:3247` | T | text |  |
| Fc7471da | `td.nums.ta-r ‹ .zero` | 2 | analytics | h - · pad 6 12 6 12 · 12/400 · var(--ink2\|--r-home) |  | `app.css:1550` `app.css:1551` `app.css:1825` `app.css:1553` `app.css:4335` | T | text |  |
| F4a3eb51 | `b.uinit ‹ .uav` | 1 | home | h - · 17/600 · var(--ink) |  | `app.css:6598` | T | text |  |
| F0b3053a ·d2 | `b ‹ .un` | 1 | home | h - · 16.5/700 · var(--ink) |  | `app.css:5247` | T | text |  |
| F601dd38 | `span.rolebadge ‹ .uid` | 1 | home | h - · r 3 · pad 2.5 5 2.5 5 · 9.5/700 ls 0.95px · var(--patch\|--pn) |  | `app.css:1794` `app.css:5250` | T | text |  |
| F225a5b6 ·d31 | `b.live ‹ .ustat` | 1 | home | h - · 10.5/500 · var(--ink) |  | `tokens.css:485` `app.css:5266` | T | text |  |
| F28e9b3d | `span ‹ .dfail` | 1 | home | h - · 12/400 · var(--danger-ink) |  | — | T | text |  |
| Fbfb029b | `b` | 1 | home | h - · 12/700 · var(--danger-ink) |  | — | T | text |  |
| Fa60d89a | `span.bl ‹ .ban` | 1 | season | h - · 9.5/600 ls 0.855px · var(--draw) |  | `app.css:1470` `app.css:1612` `app.css:3836` `app.css:3843` `app.css:4072` `app.css:4074` `app.css:4075` `app.css:4076` +7 | T | text |  |
| F06a4d46 | `span.bl ‹ .ban` | 1 | season | h - · 9.5/600 ls 0.855px · var(--ev) |  | `app.css:1470` `app.css:1612` `app.css:3836` `app.css:3843` `app.css:4072` `app.css:4074` `app.css:4075` `app.css:4076` +7 | T | text |  |
| Ff33a6dd | `span.bl ‹ .ban` | 1 | season | h - · 9.5/600 ls 0.855px · var(--play) |  | `app.css:1470` `app.css:1612` `app.css:3836` `app.css:3843` `app.css:4072` `app.css:4074` `app.css:4075` `app.css:4076` +7 | T | text |  |
| F53c0cfb | `span.srec-state.staged ‹ .srec-top` | 1 | season | h - · 10.5/400 ls 0.63px · var(--staged\|--r-review) |  | `app.css:5650` `app.css:5652` `app.css:187` `app.css:196` `app.css:393` `app.css:578` `app.css:698` `app.css:943` +8 | T | text |  |
| Fc87d6fc ·d1 | `p.srec-title.untitled ‹ .srec` | 1 | season | h - · 13/400 · var(--ink3) |  | `app.css:5654` `app.css:5656` | T | text |  |
| F6693c8a | `b ‹ .xd` | 1 | season | h - · 10.5/600 ls 0.315px · var(--ink) |  | `app.css:1777` `app.css:1825` | T | text |  |
| F763aac4 | `div.tghost.cmp ‹ .tk` | 1 | season | h - · r 6 · pad 0 8 0 8 · 12/600 · var(--patch\|--pn) |  | `app.css:920` `app.css:4096` `app.css:4099` `app.css:2030` | T | text |  |
| F2cea0b1 | `span.mhits ‹ .srch` | 1 | season | h - · r 6 · pad 0 10 0 10 · 12/600 · var(--ink) |  | `app.css:362` | T | text |  |
| F69e94a1 | `div.sub ‹ .dcard` | 1 | season | h - · 11/400 · var(--dc-mute) |  | `app.css:813` `app.css:938` `app.css:1010` `app.css:3950` `app.css:3954` | T | text |  |
| F43ad697 | `b ‹ .tc-l` | 1 | season | h - · 12/900 ls 0.72px · var(--danger-ink) |  | `app.css:4680` | T | text |  |
| Ff6eae35 | `p.pnone ‹ .plist` | 1 | season | h - · pad 14 12 14 12 · 13/400 · var(--ink3) |  | `app.css:1439` `app.css:4141` | T | text |  |
| F61e62f2 | `li.none ‹ .lc-att` | 1 | armory | h - · 12/400 · var(--dc-dim) |  | `app.css:605` `app.css:631` `app.css:744` `app.css:1281` `app.css:1745` `app.css:1939` `app.css:2954` `app.css:3029` +2 | T | text |  |
| F259a9d2 | `div.lc-code ‹ .dcard` | 1 | armory | h - · r 6 · pad 7 9 7 9 · 12/400 ls 0.72px · var(--dc-body) |  | `app.css:2955` | T | text |  |
| F33b5741 | `div.lc-noimg ‹ .dcard` | 1 | armory | h - · r 6 · pad 12 12 12 12 · 12/400 · var(--dc-dim) |  | `app.css:2963` | T | text |  |
| F4892004 | `div.lc-foot ‹ .dcard` | 1 | armory | h - · 9.5/400 ls 0.38px · var(--dc-dim) |  | `app.css:2965` | T | text |  |
| Fc81c3a1 ·d45 | `b ‹ .wsrch-opt` | 1 | armory | h - · 13/600 · var(--patch\|--pn) |  | `app.css:6445` `app.css:6448` | T | text |  |
| Fdbc1e9b | `caption.sr ‹ .cmpt` | 1 | armory | h - · 14.5/400 · var(--ink) |  | `app.css:40` | T | text |  |
| Fc860729 ·d4 | `small ‹ .base` | 1 | armory | h - · 12/500 · var(--ink3) |  | — | T | text |  |
| F206efd3 | `span.cv.m ‹ .base` | 1 | armory | h - · r 3 · pad 0 10 0 10 · 12/600 ls 0.48px · var(--ink2\|--r-home) |  | `app.css:473` `app.css:474` `app.css:475` `app.css:476` `app.css:477` `app.css:1389` `app.css:4156` `app.css:4157` +2 | T | text |  |
| F2b13775 ·d2 | `span` | 1 | armory | h - · 12/500 · var(--ink) |  | — | T | text |  |
| F18a8d28 | `span.mhits ‹ .srch` | 1 | armory | h - · r 6 · pad 0 10 0 10 · 12/600 · var(--ink) |  | `app.css:362` | T | text |  |
| F0545357 | `p.bgnote ‹ .bed-sec` | 1 | armory | h - · r 6 · pad 11 13 11 13 · 12/400 · var(--ink2\|--r-home) |  | `app.css:3016` `app.css:3019` | T | text |  |
| Fce02f8b ·d14 | `b ‹ .bgnote` | 1 | armory | h - · 12/700 · var(--ink2\|--r-home) |  | — | T | text |  |
| Fb15a15a ·d2 | `b ‹ .repbar` | 1 | armory | h - · 14.5/700 · var(--ink) |  | `app.css:3089` | T | text |  |
| F9b2219d | `span.cn.ok ‹ .ccard` | 1 | armory | h - · 16.5/600 · var(--ok) |  | `app.css:342` `app.css:1881` `app.css:1882` `app.css:1748` `app.css:1944` `app.css:2602` `app.css:2736` `app.css:3034` +6 | T | text |  |
| Ff0722a1 | `span.cn ‹ .ccard` | 1 | armory | h - · 16.5/600 · var(--ink) |  | `app.css:342` `app.css:1881` `app.css:1882` | T | text |  |
| F13aa90d ·d41 | `p.empty ‹ .bed-sec` | 1 | broadcast | h - · pad 34 16 34 16 · 14.5/400 · var(--ink3) |  | `app.css:614` `app.css:711` `app.css:712` `app.css:714` `app.css:1850` `app.css:6637` `app.css:6638` | T | text |  |
| Fccea61c | `span.mhits ‹ .srch` | 1 | broadcast | h - · r 6 · pad 0 10 0 10 · 12/600 · var(--ink) |  | `app.css:362` | T | text |  |
| Fcfb3e05 | `p.post-prev-text ‹ .post-prev` | 1 | broadcast | h - · pad 12 14 4 14 · 12/400 · var(--ink) |  | `app.css:6845` | T | text |  |
| Fcb9bf15 ·d12 | `label.sr` | 1 | broadcast | h - · 12/600 · var(--ink2\|--r-home) |  | `app.css:40` | T | text |  |
| Fa7724f8 | `span.fdelta.up ‹ .stat` | 1 | analytics | h - · 9.5/600 ls 0.95px · var(--staged\|--r-review) |  | `app.css:5008` `app.css:5010` `app.css:5009` `app.css:5014` `app.css:5016` `app.css:5477` `app.css:2615` | T | text |  |
| Fae6b1d7 | `span.wchip ‹ .uside` | 1 | analytics | h - · r 6 · pad 0 10 0 10 · 12/600 · var(--warn-ink) |  | `app.css:499` `app.css:500` | T | text |  |
| F4815b08 ·d13 | `p.rhead ‹ .hpanel` | 1 | analytics | h - · 14.5/500 · var(--ink2\|--r-home) |  | `app.css:503` `app.css:504` | T | text |  |
| Fcec4ae9 | `b ‹ .rhead` | 1 | analytics | h - · 19/700 · var(--ink) |  | `app.css:504` | T | text |  |
| Fe9575c9 ·d2 | `b ‹ .n` | 1 | analytics | h - · 14.5/700 · var(--ink) |  | — | T | text |  |
| F47111c6 | `td.nums.ta-r.bad ‹ .zero` | 1 | analytics | h - · pad 6 12 6 12 · 12/400 · var(--warn) |  | `app.css:1550` `app.css:1551` `app.css:1825` `app.css:1553` `app.css:4335` `app.css:333` `app.css:576` `app.css:600` +29 | T | text |  |
| F1d046ac | `span.mhits ‹ .srch` | 1 | history | h - · r 6 · pad 0 10 0 10 · 12/600 · var(--ink) |  | `app.css:362` | T | text |  |
| Fc52b112 ·d49 | `b` | 1 | review | h - · 14.5/600 · var(--warn) |  | — | T | text |  |

## Layout boxes · 68

Takes: S Spacing scale.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| F3db274b | `i.wg-vr ‹ .wg-acts`<br>`span.nb-rule ‹ .nb-toolbar`<br>`i.wg-vr ‹ .bacts` +1 | 2908 | armory, broadcast, access | h - · undefined/undefined |  | `app.css:609` `app.css:6715` | S | layout |  |
| Fbd60418 | `div.wg-r.bad ‹ .wg`<br>`div.wg-r ‹ .wg`<br>`div.wg-r.dmz ‹ .wg` | 2878 | armory | h - · pad 0 16 0 20 · undefined/undefined |  | `app.css:531` `app.css:569` `app.css:570` `app.css:571` `app.css:572` `app.css:573` `app.css:574` `app.css:575` +42 | S | layout |  |
| Fde7336d | `span.wg-igb ‹ .wg-ig` | 2829 | armory | h - · undefined/undefined |  | `app.css:601` `app.css:602` `app.css:604` | S | layout |  |
| Feb16b0e | `span.glyph ‹ .mk`<br>`i ‹ .skel-r`<br>`i ‹ .lsum` +4 | 1571 | home, season, armory, broadcast, access, analytics, history, review | h - · r 3 · undefined/undefined |  | `app.css:877` `app.css:2766` `app.css:425` `app.css:426` `app.css:413` `app.css:573` `app.css:575` `app.css:778` +17 | S | layout |  |
| Febaa920 | `div.wg ‹ .wg-wrap` | 1571 | armory | h - · undefined/undefined |  | `app.css:528` | S | layout |  |
| Fff0e4f5 | `div.wg-h ‹ .wg` | 1571 | armory | h - · pad 0 16 0 20 · undefined/undefined |  | `app.css:529` `app.css:530` `app.css:531` `app.css:621` `app.css:622` `app.css:623` `app.css:624` | S | layout |  |
| F51ad13a | `span.mt-grp ‹ .mt-r2`<br>`span.wg-tags ‹ .wg-line`<br>`span.incg ‹ .ph` | 915 | season, armory, analytics, history | h - · pad 0 0 0 16 · undefined/undefined |  | `app.css:357` `app.css:358` `app.css:359` `app.css:360` `app.css:540` `app.css:625` `app.css:454` `app.css:455` | S | layout |  |
| F19fd96e | `div.bgrp-h ‹ .bgrp` | 326 | armory | h - · pad 8 11 8 11 · undefined/undefined |  | `app.css:4255` | S | layout |  |
| F43e4aea | `div.bgrp-h ‹ .bgrp` | 271 | armory | h - · pad 8 11 8 11 · undefined/undefined |  | `app.css:4255` | S | layout |  |
| F771b8ee | `li.ow-i ‹ .ow-l`<br>`li.ow-i.ow-locked ‹ .ow-l` | 240 | season | h - · pad 12 16 12 16 · undefined/undefined |  | `app.css:2124` `app.css:2125` `app.css:4641` `app.css:4642` `app.css:4654` `app.css:4655` | S | layout |  |
| F2b6a51d | `div.tk ‹ .lane` | 189 | season, broadcast | h - · pad 5 0 5 0 · undefined/undefined |  | `app.css:277` `app.css:906` `app.css:907` `app.css:3830` `app.css:3831` `app.css:3841` `app.css:3842` `app.css:3843` +1 | S | layout |  |
| F833be93 | `div.bgrp-h ‹ .bgrp` | 181 | armory | h - · pad 8 11 8 11 · undefined/undefined |  | `app.css:4255` | S | layout |  |
| Fae09ede | `div.bgrp-h ‹ .bgrp` | 144 | armory | h - · pad 8 11 8 11 · undefined/undefined |  | `app.css:4255` | S | layout |  |
| F32cb333 | `div.wg-strip ‹ .wg` | 134 | armory | h - · pad 0 16 0 20 · undefined/undefined |  | `app.css:610` `app.css:611` `app.css:635` | S | layout |  |
| F3b9591c | `span.rail-rule ‹ .rail`<br>`span.bf-rule ‹ .bf-h` | 129 | home, season, armory, broadcast, access, analytics, history, review | h - · undefined/undefined |  | `app.css:4783` `app.css:4786` `app.css:6730` | S | layout |  |
| Fbb509b1 | `div.bgrp-h ‹ .bgrp` | 126 | armory | h - · pad 8 11 8 11 · undefined/undefined |  | `app.css:4255` | S | layout |  |
| Fb11cbd9 ·d20 | `div.ph ‹ .panel` | 117 | season, armory, broadcast, access, analytics, history, review | h - · pad 10 14 10 14 · undefined/undefined |  | `app.css:138` `app.css:139` `app.css:142` `app.css:178` `app.css:1456` `app.css:2269` `app.css:2272` | S | layout |  |
| Ff760777 | `header ‹ .app` | 111 | home, season, armory, broadcast, access, analytics, history, review | h - · pad 0 16 0 16 · undefined/undefined |  | `app.css:91` | S | layout |  |
| Fedfea79 | `span.cv ‹ .whobtn` | 111 | home, season, armory, broadcast, access, analytics, history, review | h - · r 3 · pad 0 10 0 10 · undefined/undefined |  | `app.css:473` `app.css:474` `app.css:475` `app.css:476` `app.css:477` `app.css:1389` `app.css:4156` `app.css:4157` +2 | S | layout |  |
| Fbf371a3 | `nav.rail ‹ .app` | 111 | home, season, armory, broadcast, access, analytics, history, review | h - · pad 8 0 0 0 · undefined/undefined |  | `app.css:107` `app.css:851` `app.css:6208` `app.css:6209` `app.css:6210` `app.css:6211` | S | layout |  |
| F18c384a | `div.bgrp-h ‹ .bgrp` | 109 | armory | h - · pad 8 11 8 11 · undefined/undefined |  | `app.css:4255` | S | layout |  |
| Fd79712e ·d23 | `div.masthead.rise`<br>`div.masthead` | 108 | season, armory, broadcast, access, analytics, history, review | h - · pad 30 23 20 23 · undefined/undefined |  | `app.css:124` `app.css:125` `app.css:126` `app.css:127` `app.css:128` `app.css:857` `app.css:1037` `app.css:1038` +26 | S | layout |  |
| F36a61af ·d18 | `span.season-end ‹ .scrub-track` | 108 | season | h - · undefined/undefined |  | `app.css:891` `app.css:1604` | S | layout |  |
| F0f3c731 | `div.bgrp-h ‹ .bgrp` | 91 | armory | h - · pad 8 11 8 11 · undefined/undefined |  | `app.css:4255` | S | layout |  |
| F2030e4f | `span.wh.r ‹ .winbox`<br>`div.now ‹ .ov`<br>`span.bcbar ‹ .ncell` | 82 | season, broadcast | h - · undefined/undefined |  | `app.css:893` `app.css:894` `app.css:895` `app.css:928` `app.css:929` `app.css:1595` `app.css:1597` `app.css:1599` +21 | S | layout |  |
| Fce289f9 ·d24 | `div.tray-f ‹ .tray` | 60 | armory, broadcast, access, analytics, history | h - · pad 8 12 8 12 · undefined/undefined |  | `app.css:753` | S | layout |  |
| F0da5c85 | `div.addrow ‹ .panel` | 40 | season | h - · pad 10 12 10 12 · undefined/undefined |  | `app.css:980` `app.css:981` `app.css:982` `app.css:1012` | S | layout |  |
| F827e87c | `div.lrow ‹ .lp`<br>`div.lrow ‹ .mxlegend-box` | 39 | home, access | h - · pad 8 0 8 0 · undefined/undefined |  | `app.css:3566` `app.css:3572` `app.css:5174` `app.css:5176` `app.css:5177` `app.css:5179` `app.css:5180` `app.css:5182` | S | layout |  |
| F2c06817 | `span.lsum.load ‹ .tk` | 37 | season | h - · undefined/undefined |  | `app.css:4039` `app.css:4045` `app.css:4046` `app.css:4047` `app.css:5494` `app.css:5495` `app.css:5496` | S | layout |  |
| F1f88846 ·d24 | `div.flags.tight` | 36 | season | h - · pad 9 12 9 12 · undefined/undefined |  | `app.css:317` `app.css:5461` `app.css:5462` `app.css:5463` | S | layout |  |
| F7b59f14 | `header.rec-h ‹ .rec` | 36 | season | h - · pad 0 16 12 16 · undefined/undefined |  | `app.css:5945` | S | layout |  |
| Fabe8348 | `div.scrim.on ‹ .app` | 33 | season, armory, broadcast, access, analytics, history, review | h - · undefined/undefined |  | `app.css:766` `app.css:768` `app.css:689` `app.css:693` `app.css:694` `app.css:1167` `app.css:1771` `app.css:1978` +21 | S | layout |  |
| Ffa21bce | `li ‹ .rephits` | 32 | season | h - · pad 6 9 6 9 · undefined/undefined |  | `app.css:966` `app.css:968` `app.css:969` `app.css:970` | S | layout |  |
| F88702b5 ·d32 | `div.lvlb ‹ .lvlbars` | 28 | analytics | h - · r 6 · pad 5 6 5 6 · undefined/undefined |  | `app.css:3145` `app.css:3148` `app.css:3149` `app.css:3150` `app.css:3155` `app.css:3156` `app.css:3157` `app.css:3158` +7 | S | layout |  |
| F005236e | `div.diff-r ‹ .diff`<br>`div.rvr ‹ .rvgrid` | 24 | analytics, history, review | h - · undefined/undefined |  | `app.css:1311` `app.css:1312` `app.css:1313` `app.css:1314` `app.css:1512` `app.css:1513` `app.css:1514` `app.css:1515` +9 | S | layout |  |
| Faf33a4e | `div.bencf ‹ .benc` | 18 | broadcast | h - · pad 0 4 0 18 · undefined/undefined |  | `app.css:414` `app.css:451` | S | layout |  |
| F8de5f02 | `td.n ‹ .sel`<br>`td.drop-sm ‹ .sel`<br>`td.det ‹ .sel` +2 | 14 | season, history | h - · pad 6 12 6 12 · undefined/undefined |  | `app.css:690` `app.css:722` `app.css:1169` `app.css:1171` `app.css:1172` `app.css:4000` `app.css:4063` `app.css:5816` +12 | S | layout |  |
| Ff8f7dd0 ·d36 | `i ‹ .bqm`<br>`i ‹ .cmeter` | 12 | broadcast | h - · undefined/undefined |  | `app.css:404` `app.css:1892` `app.css:1895` `app.css:1896` `app.css:1918` `app.css:6801` `app.css:6802` | S | layout |  |
| F60d42e4 | `td.base` | 10 | armory | h - · pad 3 4 3 4 · undefined/undefined |  | `app.css:467` `app.css:468` `app.css:471` | S | layout |  |
| F1c60492 | `div.callout.hucall ‹ .panel` | 10 | broadcast | h - · pad 12 16 12 16 · undefined/undefined |  | `app.css:2129` `app.css:2131` `app.css:3731` `app.css:3733` `app.css:512` `app.css:513` `app.css:514` `app.css:515` | S | layout |  |
| F72bea6c | `div.bansec ‹ .idbody`<br>`div.expkept ‹ .dw-b`<br>`div.dwissues ‹ .bed-side` | 9 | season, armory, broadcast, access, analytics, history | h - · pad 13 0 0 0 · undefined/undefined |  | `app.css:1461` `app.css:1899` `app.css:1900` `app.css:1947` `app.css:1948` | S | layout |  |
| Ff04b55f | `span.bcbar ‹ .ncell` | 9 | broadcast | h - · undefined/undefined |  | `app.css:386` | S | layout |  |
| F4876f78 | `span.bcbar ‹ .ncell` | 9 | broadcast | h - · undefined/undefined |  | `app.css:386` | S | layout |  |
| F7ecc7d0 | `span.chev ‹ .bcol-h` | 8 | season | h - · undefined/undefined |  | `app.css:1358` `app.css:1360` `app.css:1361` `app.css:1371` | S | layout |  |
| Fe279981 | `span.bcbar ‹ .ncell` | 8 | broadcast | h - · undefined/undefined |  | `app.css:386` | S | layout |  |
| Fdfd606c | `div.mxfoot ‹ .panel` | 8 | access | h - · pad 12 16 12 16 · undefined/undefined |  | `app.css:2492` | S | layout |  |
| Fe2cf171 | `div.rvhead ‹ .rvgrid` | 8 | review | h - · undefined/undefined |  | `app.css:2712` `app.css:2714` | S | layout |  |
| F71a17dc | `div.rvfoot ‹ .panel` | 8 | review | h - · pad 14 18 14 18 · undefined/undefined |  | `app.css:2729` `app.css:2731` | S | layout |  |
| F4311498 ·d32 | `div.ub2 ‹ .ubars` | 6 | analytics | h - · r 6 · pad 5 7 5 7 · undefined/undefined |  | `app.css:3180` `app.css:3182` `app.css:3183` `app.css:3184` `app.css:3189` `app.css:3191` `app.css:3192` | S | layout |  |
| Fc7a7ec0 | `i.ok ‹ .ubt2` | 6 | analytics | h - · undefined/undefined |  | `app.css:1748` `app.css:1881` `app.css:1944` `app.css:2602` `app.css:2736` `app.css:3034` `app.css:3035` `app.css:3177` +4 | S | layout |  |
| F9ae9153 | `div.netbar.server`<br>`div.netbar.bad-response` | 5 | home, season, broadcast | h - · pad 10 22 10 22 · undefined/undefined |  | `app.css:2202` `app.css:2204` `app.css:2205` `app.css:2208` | S | layout |  |
| F3625ddf | `div.cmpfold ‹ .cmp`<br>`div.bootcard ‹ .hpanel` | 5 | armory, analytics | h - · pad 14 0 0 0 · undefined/undefined |  | `app.css:482` `app.css:483` `app.css:484` `app.css:3173` | S | layout |  |
| F86b2876 | `tr.sel` | 4 | season, history | h - · undefined/undefined |  | `app.css:190` `app.css:574` `app.css:688` `app.css:4140` `app.css:5051` `app.css:5053` | S | layout |  |
| F29e9a7f | `td ‹ .sel` | 4 | season, history | h - · pad 6 0 6 12 · undefined/undefined |  | `app.css:688` | S | layout |  |
| Fc3351df | `div.wg-r.bad.sel ‹ .wg`<br>`div.wg-r.sel ‹ .wg` | 4 | armory | h - · pad 0 16 0 20 · undefined/undefined |  | `app.css:531` `app.css:569` `app.css:570` `app.css:571` `app.css:572` `app.css:573` `app.css:574` `app.css:575` +45 | S | layout |  |
| F3d653aa ·d23 | `div.masthead ‹ .home` | 3 | home | h - · pad 30 24 18 24 · undefined/undefined |  | `app.css:124` `app.css:125` `app.css:126` `app.css:127` `app.css:128` `app.css:857` `app.css:1037` `app.css:1038` +25 | S | layout |  |
| F251c76c | `div.usec ‹ .umenu` | 3 | home | h - · pad 5 5 5 5 · undefined/undefined |  | `app.css:1796` `app.css:1797` | S | layout |  |
| Faf8b2a3 | `div.lc-rule ‹ .dcard`<br>`hr.v2-sep ‹ .v2-card` | 3 | armory | h - · undefined/undefined |  | `app.css:2943` `v2card.css:40` | S | layout |  |
| Faf0048a | `div.dnote ‹ .doorcard` | 2 | home | h - · pad 20 0 0 0 · undefined/undefined |  | `app.css:2776` `app.css:2778` `app.css:2779` | S | layout |  |
| F9f8d413 | `td.ra ‹ .sel` | 2 | season | h - · pad 0 16 0 0 · undefined/undefined |  | `app.css:384` `app.css:4594` `app.css:4595` `app.css:4596` | S | layout |  |
| F0a30b1f | `div.netbar.offline` | 2 | season | h - · pad 10 22 10 22 · undefined/undefined |  | `app.css:2202` `app.css:2204` `app.css:2205` `app.css:2208` | S | layout |  |
| F554f73a | `div.smask.l ‹ .scrub-track`<br>`div.smask.r ‹ .scrub-track` | 2 | season | h - · undefined/undefined |  | `app.css:1587` `app.css:1588` `app.css:156` `app.css:491` `app.css:895` `app.css:929` `app.css:1600` `app.css:3877` +8 | S | layout |  |
| Fa14d7d6 | `td ‹ .preview-sel` | 2 | history | h - · pad 6 0 6 12 · undefined/undefined |  | `app.css:2887` | S | layout |  |
| F3f633d3 | `div.usec.last ‹ .umenu` | 1 | home | h - · pad 5 5 5 5 · undefined/undefined |  | `app.css:1796` `app.css:1797` | S | layout |  |
| Fa13d84a ·d20 | `div.ph.idhead ‹ .idbody` | 1 | season | h - · pad 12 16 12 16 · undefined/undefined |  | `app.css:138` `app.css:139` `app.css:142` `app.css:178` `app.css:1456` `app.css:2269` `app.css:2272` `app.css:1212` +3 | S | layout |  |
| Fc3cdced | `i.pz-d ‹ .pz-r` | 1 | season | h - · r 3 · undefined/undefined |  | `app.css:5345` | S | layout |  |
| Ff9a2ea4 | `div.wg-r.bad.open ‹ .wg` | 1 | armory | h - · pad 0 16 0 20 · undefined/undefined |  | `app.css:531` `app.css:569` `app.css:570` `app.css:571` `app.css:572` `app.css:573` `app.css:574` `app.css:575` +48 | S | layout |  |
| F4fffd64 | `td.n ‹ .zero` | 1 | analytics | h - · pad 6 0 6 12 · undefined/undefined |  | `app.css:690` `app.css:722` `app.css:1169` `app.css:1171` `app.css:1172` `app.css:4000` `app.css:4063` `app.css:5816` | S | layout |  |

## EXEMPT · 3

Kept out of the standard; Step 4 records the reason and what would reopen each.

| Family | Element | Uses | Realms | Today | Hover | Sites | Takes | Rule | Also holds |
|---|---|--:|---|---|---|---|---|---|---|
| F3ea72d7 | `a.realm ‹ .rail`<br>`a.realm.out ‹ .rail` | 606 | home, season, armory, broadcast, access, analytics, history, review | h 63 · pad 12 4 12 4 · 10.5/700 caps ls 1.26px · var(--ink3) | yes | `app.css:108` `app.css:110` `app.css:111` `app.css:112` `app.css:113` `app.css:114` `app.css:853` `app.css:854` +14 |  | rail |  |
| F7150569 | `a.realm ‹ .rail` | 100 | season, armory, broadcast, access, analytics, history | h 63 · pad 12 4 12 4 · 10.5/700 caps ls 1.26px · var(--ink) | yes | `app.css:108` `app.css:110` `app.css:111` `app.css:112` `app.css:113` `app.css:114` `app.css:853` `app.css:854` +14 |  | rail |  |
| F63fa87f | `a.realm.out.has ‹ .rail` | 71 | home, armory, broadcast, access, analytics, history, review | h 63 · pad 12 4 12 4 · 10.5/700 caps ls 1.26px · var(--ink2\|--r-home) | yes | `app.css:108` `app.css:110` `app.css:111` `app.css:112` `app.css:113` `app.css:114` `app.css:853` `app.css:854` +19 |  | rail |  |
