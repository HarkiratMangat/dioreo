---
kind: reference
status: live
---

# Board 3-E — the 204 classes the portal does not have

*Generated 2026-09-21 09:37 EDT. Of 308 distinct classes rendered in the six gates' stages, 104 are already the portal's (defined in its CSS or written in its JS) and **204 exist only on the board**.*

**Why this file exists — the rule an earlier session wrote down and I nearly re-learned.** `docs/superpowers/mockups/2026-09-14-pins2-board/handoff-g9-g8.md`: *"a value spec is enough when the two implementations already agree structurally, and is worth nothing when they do not."* Board 2's manifest ported ~95% because `pb-*` → `wg-*` was close to a 1:1 rename. Board 1's drawers failed because the portal's structure was different. **This table is where 3-E sits on that line, class by class:** a portal-known class means the structure already agrees and the value spec suffices; a board-only class means the portal has no such element yet, and it needs the STRUCTURAL half — `handoff-3e.md` — not only values.

⚠️ **Naming these for the portal is Session 4's decision**, not Session 5's: §5c owns the element system and its names. This table gives the facts it needs — which surfaces render each class and where the kit defines it — so no name is guessed.

| Class | Rendered on | First defined at |
|---|---|---|
| `.b3-allcb` | M1-armory-manifest | `b3/board.css:736` |
| `.b3-av` | H1-history, states | `b3/board.css:1510` |
| `.b3-bdg` | M1-armory-manifest | `b3/board.css:150` |
| `.b3-bdgs` | M1-armory-manifest, states | `b3/board.css:148` |
| `.b3-btn2` | H1-history, M2-repairs, M3-export, states | `b3/board.css:537` |
| `.b3-cc` | B1-delivery-queue | `b3/board.css:3652` |
| `.b3-cmd` | P7-command-search | `b3/board.css:1406` |
| `.b3-cmdbar` | P7-command-search | `b3/board.css:1404` |
| `.b3-cmdf` | P7-command-search | `b3/board.css:1420` |
| `.b3-cmdl` | P7-command-search | `b3/board.css:1408` |
| `.b3-cmdmag` | P7-command-search | `b3/board.css:1404` |
| `.b3-cmdnone` | P7-command-search | `b3/board.css:1422` |
| `.b3-cmdr` | P7-command-search | `b3/board.css:1410` |
| `.b3-cmds` | P7-command-search | `b3/board.css:1409` |
| `.b3-compose` | P7-command-search | `b3/board.css:1424` |
| `.b3-dt` | B1-delivery-queue | `b3/board.css:4261` |
| `.b3-dt-e` | B1-delivery-queue | `b3/board.css:4265` |
| `.b3-endbtn` | B1-delivery-queue | `b3/board.css:1447` |
| `.b3-endwarn` | B1-delivery-queue | `b3/board.css:4275` |
| `.b3-endwrap` | B1-delivery-queue | `b3/board.css:1446` |
| `.b3-ent` | H1-history | `b3/board.css:1549` |
| `.b3-fady` | states | `b3/board.css:2359` |
| `.b3-fc` | H1-history, M2-repairs | `b3/board.css:1225` |
| `.b3-fchip` | M1-armory-manifest | `b3/board.css:568` |
| `.b3-fg` | H1-history | `b3/board.css:1507` |
| `.b3-fgl` | H1-history | `b3/board.css:1508` |
| `.b3-fold2` | M2-repairs | `b3/board.css:2184` |
| `.b3-fx` | M1-armory-manifest | `b3/board.css:567` |
| `.b3-hi` | H1-history, states | `b3/board.css:1497` |
| `.b3-hi-day` | H1-history | `b3/board.css:1516` |
| `.b3-hi-dd` | H1-history | `b3/board.css:4670` |
| `.b3-hi-dg` | H1-history, states | `b3/board.css:4700` |
| `.b3-hi-dk` | H1-history | `b3/board.css:4672` |
| `.b3-hi-dm` | H1-history | `b3/board.css:4671` |
| `.b3-hi-f` | H1-history | `b3/board.css:1506` |
| `.b3-hi-h` | H1-history | `b3/board.css:1514` |
| `.b3-hi-list` | H1-history | `b3/board.css:4715` |
| `.b3-hi-more` | H1-history | `b3/board.css:1568` |
| `.b3-hi-open` | H1-history | `b3/board.css:1536` |
| `.b3-hi-r` | H1-history, states | `b3/board.css:1514` |
| `.b3-hi-tools` | H1-history | `b3/board.css:4870` |
| `.b3-hint` | M1-armory-manifest, states | `b3/board.css:75` |
| `.b3-img` | M2-repairs | `b3/board.css:1032` |
| `.b3-joiner` | P7-command-search | `b3/board.css:1434` |
| `.b3-lvl` | H1-history | `b3/board.css:1555` |
| `.b3-meter` | H1-history | `b3/board.css:1551` |
| `.b3-nw` | B1-delivery-queue, M2-repairs, states | `b3/board.css:46` |
| `.b3-pchip` | M2-repairs | `b3/board.css:1317` |
| `.b3-rp` | M2-repairs | `b3/board.css:1219` |
| `.b3-rp-f` | M2-repairs | `b3/board.css:1224` |
| `.b3-rp-h` | M2-repairs | `b3/board.css:1220` |
| `.b3-rp-t` | M2-repairs | `b3/board.css:1221` |
| `.b3-rv` | M2-repairs | `b3/board.css:1254` |
| `.b3-rv-n` | M2-repairs | `b3/board.css:1261` |
| `.b3-rv-s` | M2-repairs | `b3/board.css:1258` |
| `.b3-rv-w` | M2-repairs | `b3/board.css:1257` |
| `.b3-sc` | states | `b3/board.css:780` |
| `.b3-sd` | states | `b3/board.css:405` |
| `.b3-sd-acts` | states | `b3/board.css:800` |
| `.b3-sd-bar` | states | `b3/board.css:764` |
| `.b3-sd-chips` | states | `b3/board.css:769` |
| `.b3-sd-count` | states | `b3/board.css:765` |
| `.b3-sd-tog` | states | `b3/board.css:540` |
| `.b3-selbar` | states | `b3/board.css:742` |
| `.b3-tk` | M2-repairs | `b3/board.css:3126` |
| `.b3-tk-agec` | M2-repairs | `b3/board.css:3326` |
| `.b3-tk-bar` | M2-repairs | `b3/board.css:3120` |
| `.b3-tk-ck` | M2-repairs | `b3/board.css:3350` |
| `.b3-tk-cks` | M2-repairs | `b3/board.css:3348` |
| `.b3-tk-ev` | M2-repairs | `b3/board.css:3148` |
| `.b3-tk-f` | M2-repairs | `b3/board.css:3140` |
| `.b3-tk-fs` | M2-repairs | `b3/board.css:3139` |
| `.b3-tk-ft` | M2-repairs | `b3/board.css:3159` |
| `.b3-tk-h` | M2-repairs | `b3/board.css:3130` |
| `.b3-tk-ic` | M2-repairs | `b3/board.css:3142` |
| `.b3-tk-id` | M2-repairs | `b3/board.css:3131` |
| `.b3-tk-list` | M2-repairs | `b3/board.css:3125` |
| `.b3-tk-pass` | M2-repairs | `b3/board.css:3345` |
| `.b3-tk-sec` | M2-repairs | `b3/board.css:3340` |
| `.b3-tk-sh` | M2-repairs | `b3/board.css:3641` |
| `.b3-tk-shield` | M2-repairs | `b3/board.css:3636` |
| `.b3-tk-t` | M2-repairs | `b3/board.css:3145` |
| `.b3-tok` | P7-command-search | `b3/board.css:1427` |
| `.b3-undo` | H1-history | `b3/board.css:1563` |
| `.b3-undone` | H1-history | `b3/board.css:1556` |
| `.b3-vb` | states | `b3/board.css:3204` |
| `.b3-vl` | M1-armory-manifest | `b3/board.css:3196` |
| `.b3-volt` | M1-armory-manifest | `b3/board.css:1872` |
| `.b3-vr` | states | `b3/board.css:72` |
| `.b3-vrest` | states | `b3/board.css:3219` |
| `.b3-wg` | M2-repairs | `b3/board.css:1282` |
| `.b3-wg-h` | M2-repairs | `b3/board.css:951` |
| `.b3-wg-p` | M2-repairs | `b3/board.css:1288` |
| `.b3-wh` | M2-repairs | `b3/board.css:1291` |
| `.b3-who` | H1-history, states | `b3/board.css:1534` |
| `.b3-wr` | M2-repairs | `b3/board.css:1290` |
| `.b3-wr-a` | M2-repairs | `b3/board.css:1332` |
| `.b3-wr-b` | M2-repairs | `b3/board.css:1306` |
| `.b3-wr-c` | M2-repairs | `b3/board.css:1328` |
| `.b3-wr-f` | M2-repairs | `b3/board.css:1312` |
| `.b3-wr-main` | M2-repairs | `b3/board.css:1291` |
| `.b3-wr-u` | M2-repairs | `b3/board.css:1327` |
| `.b3-xf` | states | `b3/board.css:3037` |
| `.b3-xf-acts` | states | `b3/board.css:4473` |
| `.b3-xf-b` | states | `b3/board.css:3062` |
| `.b3-xf-bw` | states | `b3/board.css:3059` |
| `.b3-xf-div` | states | `b3/board.css:4474` |
| `.b3-xf-ext` | M3-export, states | `b3/board.css:3665` |
| `.b3-xf-f` | states | `b3/board.css:3065` |
| `.b3-xf-fact` | states | `b3/board.css:4582` |
| `.b3-xf-fid` | M3-export, states | `b3/board.css:4568` |
| `.b3-xf-fn` | M3-export, states | `b3/board.css:3054` |
| `.b3-xf-h` | states | `b3/board.css:3041` |
| `.b3-xf-h0` | states | `b3/board.css:4036` |
| `.b3-xf-ib` | states | `b3/board.css:4475` |
| `.b3-xf-ibl` | states | `b3/board.css:4486` |
| `.b3-xf-nm` | M3-export | `b3/board.css:3734` |
| `.b3-xf-none` | states | `b3/board.css:4013` |
| `.b3-xf-sq` | M3-export, states | `b3/board.css:4460` |
| `.b3-xf-t` | states | `b3/board.css:3043` |
| `.b3-xt` | states | `b3/board.css:2958` |
| `.b3-xt-all` | states | `b3/board.css:2990` |
| `.b3-xt-bin` | states | `b3/board.css:3079` |
| `.b3-xt-blk` | states | `b3/board.css:3077` |
| `.b3-xt-c` | states | `b3/board.css:3011` |
| `.b3-xt-cat` | states | `b3/board.css:2962` |
| `.b3-xt-chips` | states | `b3/board.css:2977` |
| `.b3-xt-cs` | states | `b3/board.css:3010` |
| `.b3-xt-empty` | states | `b3/board.css:3094` |
| `.b3-xt-every` | states | `b3/board.css:3688` |
| `.b3-xt-files` | states | `b3/board.css:3032` |
| `.b3-xt-find` | states | `— (set in JS only)` |
| `.b3-xt-ghost` | states | `b3/board.css:3097` |
| `.b3-xt-list` | states | `b3/board.css:2981` |
| `.b3-xt-ln` | states | `b3/board.css:3082` |
| `.b3-xt-mode` | states | `— (set in JS only)` |
| `.b3-xt-n` | states | `b3/board.css:2993` |
| `.b3-xt-no` | states | `b3/board.css:3083` |
| `.b3-xt-peek` | states | `b3/board.css:3098` |
| `.b3-xt-rm` | states | `b3/board.css:3089` |
| `.b3-xt-row` | states | `b3/board.css:2964` |
| `.b3-xt-sec` | states | `b3/board.css:2984` |
| `.b3-xt-sech` | states | `b3/board.css:2986` |
| `.b3-xt-side` | states | `b3/board.css:3031` |
| `.b3-xt-tiles` | states | `b3/board.css:2998` |
| `.b3-xt-top` | states | `b3/board.css:2963` |
| `.b3-xt-tx` | states | `b3/board.css:3084` |
| `.b3-xt-w` | states | `b3/board.css:2999` |
| `.b3-xt-w8` | states | `b3/board.css:2995` |
| `.b3-xt-wc` | states | `b3/board.css:3681` |
| `.b3-xt-wh` | states | `b3/board.css:3679` |
| `.b3-xt-wn` | states | `b3/board.css:3004` |
| `.b3-zap` | M1-armory-manifest | `— (set in JS only)` |
| `.dw-nav` | M3-export | `gates.css:811` |
| `.exs-fact-w` | M3-export | `gates.css:538` |
| `.exs-facts` | M3-export | `gates.css:533` |
| `.exs-lead` | M3-export | `gates.css:532` |
| `.exs-n` | M3-export | `gates.css:548` |
| `.g-bpanel` | B1-delivery-queue | `b3/board.css:2643` |
| `.g-card` | B1-delivery-queue | `b3/board.css:4625` |
| `.g-edit` | B1-delivery-queue | `gates.css:395` |
| `.g-exs` | M3-export | `b3/board.css:4237` |
| `.g-fact` | B1-delivery-queue | `b3/board.css:3652` |
| `.g-fixedhead` | B1-delivery-queue | `gates.css:408` |
| `.g-never` | B1-delivery-queue | `gates.css:383` |
| `.g-noend` | B1-delivery-queue | `b3/board.css:2485` |
| `.g-pick-open` | M3-export | `— (set in JS only)` |
| `.g-qcards` | B1-delivery-queue | `gates.css:365` |
| `.g-queue` | B1-delivery-queue | `gates.css:364` |
| `.g-run` | B1-delivery-queue | `gates.css:378` |
| `.g-status` | B1-delivery-queue | `b3/board.css:2515` |
| `.has-ent` | H1-history | `— (set in JS only)` |
| `.has-word` | B1-delivery-queue | `b3/board.css:555` |
| `.hlead` | H1-history | `b3/board.css:5087` |
| `.pb-bar` | B1-delivery-queue | `b3/board.css:1064` |
| `.pb-body` | B1-delivery-queue | `b2.css:214` |
| `.pb-cacts` | B1-delivery-queue | `b3/board.css:4353` |
| `.pb-card` | B1-delivery-queue | `b2.css:211` |
| `.pb-cg` | B1-delivery-queue | `b2.css:267` |
| `.pb-cgnone` | B1-delivery-queue | `— (set in JS only)` |
| `.pb-dates` | B1-delivery-queue | `b3/board.css:4355` |
| `.pb-del` | B1-delivery-queue | `b3/board.css:4357` |
| `.pb-enc` | B1-delivery-queue | `b3/board.css:4057` |
| `.pb-encf` | B1-delivery-queue | `b3/board.css:4271` |
| `.pb-end` | B1-delivery-queue | `b3/board.css:2485` |
| `.pb-exp` | B1-delivery-queue | `b3/board.css:4267` |
| `.pb-ib` | B1-delivery-queue | `b3/board.css:547` |
| `.pb-life3` | B1-delivery-queue | `b2.css:222` |
| `.pb-now` | B1-delivery-queue | `b2.css:228` |
| `.pb-numr` | B1-delivery-queue | `gates.css:366` |
| `.pb-pill` | B1-delivery-queue, M2-repairs | `b3/board.css:4332` |
| `.pb-qafter` | B1-delivery-queue | `b3/board.css:4932` |
| `.pb-span` | B1-delivery-queue | `gates.css:378` |
| `.pb-tl` | B1-delivery-queue | `b3/board.css:2484` |
| `.pb-track` | B1-delivery-queue | `gates.css:382` |
| `.pb-vr` | B1-delivery-queue | `b3/board.css:4359` |
| `.st-a` | H1-history, states | `b3/board.css:4896` |
| `.st-m` | H1-history | `b3/board.css:4839` |
| `.st-z` | H1-history | `b3/board.css:4839` |
| `.uk` | states | `b3/board.css:4679` |
| `.uw` | states | `b3/board.css:4680` |
| `.x-at` | states | `b3/board.css:3088` |
| `.x-hd` | states | `b3/board.css:3085` |
| `.x-kv` | states | `— (set in JS only)` |
