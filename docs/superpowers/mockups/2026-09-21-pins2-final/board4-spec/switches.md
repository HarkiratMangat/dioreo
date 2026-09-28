---
kind: reference
status: live
---

# Board 4: Collective (the kit Board 3-E shares) — the switches, and which option the board holds

*Generated 2026-09-28T18:21:36.845Z by `switches.cjs` from the kit's `b3/state.js` DEFAULTS, `b3/board.css`, `gates.css`, `b2.css` and every `useB3`/`b3()` call. **224 keyed selectors are live and 292 are dead** under the values below.*

## How to port a switched rule or branch

1. **Live** — the selector's value is the one the board holds. Port the rule **without** its `html[data-b3-…]` qualifier: the portal has one design, not a switchboard.
2. **Dead** — never port. It is a losing option, and it is kept in the kit only so the board can still show it.
3. **A JS branch** `useB3('k') === v ? A : B` collapses to the arm the board holds. The `useB3` call and the `../b3/state.js` import are deleted, never ported.
4. **⏳ OPEN** — the board holds a value, but it is NOT his decision. Session 4 decides it. If Session 4 picks another value: change DEFAULTS in the kit, re-run this script, `extract-spec.cjs` and `measure.cjs`, and commit the regenerated files — the spec is stale until then.
5. **Kept in files at his request** (Outline, Solid ground) — the dead rule is preserved in the PORTAL too, commented as unshipped, never deleted.

| Switch | Board holds | Who ruled it | Live selectors | Dead selectors — do not port | JS branches |
|---|---|---|---|---|---|
| `a1` | `"fixed"` | the fixed section treatment — NO fork record; inferred from the kit, where every gate renders under it | `fixed` ×67 (b3/board.css:1618, b3/board.css:1619, b3/board.css:1620, …)<br>`(present)` ×16 (b3/board.css:3390, b3/board.css:3390, b3/board.css:3391, …) | — | ui/icons.js:168<br>ui/manifest.js:125<br>gates/armory.js:41<br>gates/armory.js:73<br>gates/armory.js:191<br>gates/armory.js:1095 |
| `b1` | `"fixed"` | board chrome | — | — | gates/broadcast.js:148 |
| `e1` | `"now"` | ⏳ OPEN — Session 4 · §5c (E1–E6 withdrawn 2026-09-15) | `(present)` ×9 (b3/board.css:1589, b3/board.css:1599, b3/board.css:1599, …) | `a` ×11 (b3/board.css:1588, b3/board.css:1590, b3/board.css:1591, …)<br>`b` ×12 (b3/board.css:1588, b3/board.css:1595, b3/board.css:1596, …) | — |
| `e2` | `"now"` | ⏳ OPEN — Session 4 | — | `b` ×15 (b3/board.css:1672, b3/board.css:1673, b3/board.css:1674, …)<br>`a` ×5 (b3/board.css:1678, b3/board.css:1679, b3/board.css:1680, …) | — |
| `e2spd` | `"smooth"` | ruled §4 (db) | `smooth` ×1 (gates.css:303) | `quick` ×1 (gates.css:302)<br>`slow` ×1 (gates.css:304) | — |
| `e3` | `"now"` | ⏳ OPEN — Session 4 | — | `a` ×9 (b3/board.css:1687, b3/board.css:1688, b3/board.css:1689, …)<br>`b` ×9 (b3/board.css:1690, b3/board.css:1691, b3/board.css:1692, …) | — |
| `e4` | `"now"` | ⏳ OPEN — Session 4 | — | `a` ×13 (b3/board.css:1696, b3/board.css:1697, b3/board.css:1697, …)<br>`b` ×13 (b3/board.css:1698, b3/board.css:1699, b3/board.css:1703, …) | — |
| `e5` | `"now"` | ⏳ OPEN — Session 4 | `(present)` ×2 (b3/board.css:1713, b3/board.css:1714)<br>`now` ×1 (b3/board.css:1715) | `a` ×4 (b3/board.css:1710, b3/board.css:1710, b3/board.css:1711, …)<br>`b` ×4 (b3/board.css:1710, b3/board.css:1710, b3/board.css:1712, …) | — |
| `e6` | `"now"` | ⏳ OPEN — Session 4 | — | `a` ×10 (b3/board.css:1722, b3/board.css:1727, b3/board.css:1729, …)<br>`b` ×11 (b3/board.css:1723, b3/board.css:1724, b3/board.css:1725, …) | ui/armory.js:304<br>ui/exportPanel.js:96<br>b3/history.js:47 |
| `exp` | `"b"` | ruled §4 | `b` ×2 (gates.css:659, gates.css:659) | `a` ×2 (gates.css:659, gates.css:659) | gates/armory.js:252<br>gates/armory.js:1094 |
| `expl` | `"tiles"` | ruled §4 (db) | — | — | gates/armory.js:253 |
| `g9` | `"board1"` | board 1 · G9 drawer, answered 2026-09-14 01:18 EDT (plan §9 G9) — `board1` renders that answer | — | — | ui/armory.js:1405<br>gates/armory.js:40 |
| `p1` | `"a"` | §4b — the fork DISSOLVED; `a` is the surviving mark, motion unscoped | `a` ×7 (b3/board.css:164, b3/board.css:165, b3/board.css:167, …)<br>`(present)` ×1 (b3/board.css:176) | `b` ×9 (b3/board.css:178, b3/board.css:179, b3/board.css:180, …)<br>`c` ×10 (b3/board.css:188, b3/board.css:189, b3/board.css:190, …) | ui/armory.js:120<br>b3/armory-parts.js:452 |
| `p10` | `"state"` | ⏳ OPEN — Session 4 · G1 (small text). The board value is NOT a decision | `state` ×3 (b3/board.css:862, b3/board.css:864, b3/board.css:866)<br>`(present)` ×3 (b3/board.css:3414, b3/board.css:3587, b3/board.css:3589) | `now` ×2 (b3/board.css:858, b3/board.css:859)<br>`does` ×2 (b3/board.css:868, b3/board.css:869)<br>`off` ×2 (b3/board.css:871, b3/board.css:872) | gates/armory.js:1152 |
| `p2lab` | `"key"` | ruled §4 | `key` ×1 (b3/board.css:487)<br>`(present)` ×5 (b3/board.css:508, b3/board.css:526, b3/board.css:526, …) | `colon` ×9 (b3/board.css:486, b3/board.css:517, b3/board.css:517, …)<br>`cap` ×1 (b3/board.css:494)<br>`off` ×4 (b3/board.css:508, b3/board.css:526, b3/board.css:526, …)<br>`trail` ×1 (b3/board.css:2921) | — |
| `p2pal` | `"final"` | ruled §4 | `final` ×1 (b3/board.css:3373) | `mine` ×2 (b3/board.css:329, b3/board.css:2240)<br>`mineflat` ×1 (b3/board.css:348)<br>`named` ×1 (b3/board.css:358)<br>`parts` ×1 (b3/board.css:359)<br>`calm` ×1 (b3/board.css:367)<br>`now` ×1 (b3/board.css:542) | gates/armory.js:127<br>gates/armory.js:1122 |
| `p2sty` | `"neutralbg"` | ruled §4 (Outline kept in files, unported) | `(present)` ×20 (b3/board.css:405, b3/board.css:405, b3/board.css:405, …)<br>`neutralbg` ×10 (b3/board.css:447, b3/board.css:447, b3/board.css:447, …) | `wash` ×8 (b3/board.css:413, b3/board.css:413, b3/board.css:413, …)<br>`washc` ×9 (b3/board.css:416, b3/board.css:416, b3/board.css:416, …)<br>`bar` ×8 (b3/board.css:419, b3/board.css:419, b3/board.css:419, …)<br>`neutral` ×9 (b3/board.css:430, b3/board.css:430, b3/board.css:430, …)<br>`text` ×9 (b3/board.css:529, b3/board.css:529, b3/board.css:529, …)<br>`outline` ×9 (b3/board.css:2904, b3/board.css:2905, b3/board.css:2905, …)<br>`fade` ×8 (b3/board.css:2908, b3/board.css:2908, b3/board.css:2908, …)<br>`lit` ×8 (b3/board.css:2912, b3/board.css:2912, b3/board.css:2912, …) | — |
| `p3` | `"a"` | ruled §4 | — | — | ui/armory.js:120 |
| `p3tbl` | `"bare"` | ruled §4 | — | `count` ×7 (b3/board.css:2863, b3/board.css:2864, b3/board.css:2865, …) | — |
| `p4` | `"b"` | ruled §4 (db) | `b` ×27 (b3/board.css:282, b3/board.css:284, b3/board.css:285, …)<br>`(present)` ×5 (b3/board.css:3287, b3/board.css:3287, b3/board.css:4173, …) | `a` ×22 (b3/board.css:282, b3/board.css:284, b3/board.css:285, …) | ui/armory.js:120 |
| `p5` | `"new"` | the M1 selection bar as board 3 rebuilt it — `new` is the only value the kit offers besides `now`; NO fork record, inferred from the kit | — | — | ui/armory.js:1405<br>ui/manifest.js:124<br>ui/manifest.js:379 |
| `p5bg` | `"mesh"` | ruled §4 (db; Solid kept in files as a future setting) | — | — | b3/armory-parts.js:542 |
| `p5hint` | `"card"` | ruled §4 (db) | — | — | b3/armory-parts.js:544 |
| `p5list` | `"grouped"` | §4b — both views ship | — | — | b3/armory-parts.js:543 |
| `p6` | `"c"` | ruled §4 (db) | — | — | ui/armory.js:1405<br>b3/repairs.js:68<br>gates/armory.js:189 |
| `p6day` | `"real"` | board data switch — `real` is the portal's own data; chrome | — | — | ui/armory.js:1405<br>b3/repairs.js:67<br>gates/armory.js:190 |
| `p6lay` | `"sections"` | ruled §4 (db) | — | — | b3/repairs.js:69 |
| `p7` | `"new"` | P7 Command search — "Build it properly, and exactly as shown" | — | — | ui/shell.js:365 |
| `p8` | `"a"` | ruled §4 (db) | — | — | ui/broadcast.js:531<br>gates/broadcast.js:101 |
| `p9` | `"b"` | ruled §4 (db) | `b` ×40 (gates.css:667, gates.css:667, gates.css:667, …) | `c` ×6 (b3/board.css:4799, b3/board.css:4800, b3/board.css:4801, …)<br>`d` ×5 (b3/board.css:4806, b3/board.css:4807, b3/board.css:4929, …)<br>`e` ×12 (b3/board.css:4820, b3/board.css:4821, b3/board.css:4821, …) | ui/history.js:162<br>b3/history.js:48<br>gates/history.js:42 |
| `section` | `"a1"` | board chrome — which gate is open | — | — | b3/dock.js:64 |
| `xbg` | `"ground"` | ruled §4 (db) | `ground` ×3 (b3/board.css:4240, b3/board.css:4264, b3/board.css:4353) | `mesh` ×2 (b3/board.css:4240, b3/board.css:4264) | — |
| `xtile` | `undefined` | withdrawn v40–41; rounds 5T/5V dead | — | `index` ×1 (b3/board.css:3950)<br>`cloud` ×1 (b3/board.css:3950)<br>`bands` ×1 (b3/board.css:3950) | — |
