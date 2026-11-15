---
kind: reference
status: live
---

# Board 4: Final (the kit Board 3-E shares) — the switches, and which option the board holds

*Generated 2026-11-15T07:25:19.391Z by `switches.cjs` from the kit's `b3/state.js` DEFAULTS, `b3/board.css`, `gates.css`, `b2.css` and every `useB3`/`b3()` call. **174 keyed selectors are live and 286 are dead** under the values below.*

## How to port a switched rule or branch

1. **Live** — the selector's value is the one the board holds. Port the rule **without** its `html[data-b3-…]` qualifier: the portal has one design, not a switchboard.
2. **Dead** — never port. It is a losing option, and it is kept in the kit only so the board can still show it.
3. **A JS branch** `useB3('k') === v ? A : B` collapses to the arm the board holds. The `useB3` call and the `../b3/state.js` import are deleted, never ported.
4. **⏳ OPEN** — the board holds a value, but it is NOT his decision. Session 4 decides it. If Session 4 picks another value: change DEFAULTS in the kit, re-run this script, `extract-spec.cjs` and `measure.cjs`, and commit the regenerated files — the spec is stale until then.
5. **Kept in files at his request** (Outline, Solid ground) — the dead rule is preserved in the PORTAL too, commented as unshipped, never deleted.

| Switch | Board holds | Who ruled it | Live selectors | Dead selectors — do not port | JS branches |
|---|---|---|---|---|---|
| `a1` | `"fixed"` | the fixed section treatment — NO fork record; inferred from the kit, where every gate renders under it | `fixed` ×62 (b3/board.css:1598, b3/board.css:1599, b3/board.css:1621, …)<br>`(present)` ×5 (b3/board.css:3352, b3/board.css:3352, b3/board.css:3354, …) | — | ui/icons.js:169<br>ui/manifest.js:150<br>gates/armory.js:42<br>gates/armory.js:73<br>gates/armory.js:195<br>gates/armory.js:1102 |
| `b1` | `"fixed"` | board chrome | — | — | gates/broadcast.js:148 |
| `e1` | `"now"` | ⏳ OPEN — Session 4 · §5c (E1–E6 withdrawn 2026-09-15) | `(present)` ×9 (b3/board.css:1569, b3/board.css:1579, b3/board.css:1579, …) | `a` ×11 (b3/board.css:1568, b3/board.css:1570, b3/board.css:1571, …)<br>`b` ×12 (b3/board.css:1568, b3/board.css:1575, b3/board.css:1576, …) | — |
| `e2` | `"now"` | ⏳ OPEN — Session 4 | — | `b` ×15 (b3/board.css:1648, b3/board.css:1649, b3/board.css:1650, …)<br>`a` ×5 (b3/board.css:1654, b3/board.css:1655, b3/board.css:1656, …) | — |
| `e2spd` | `"smooth"` | ruled §4 (db) | `smooth` ×1 (gates.css:304) | `quick` ×1 (gates.css:303)<br>`slow` ×1 (gates.css:305) | — |
| `e3` | `"now"` | ⏳ OPEN — Session 4 | — | `a` ×9 (b3/board.css:1663, b3/board.css:1664, b3/board.css:1665, …)<br>`b` ×9 (b3/board.css:1666, b3/board.css:1667, b3/board.css:1668, …) | — |
| `e4` | `"now"` | ⏳ OPEN — Session 4 | — | `a` ×13 (b3/board.css:1672, b3/board.css:1673, b3/board.css:1673, …)<br>`b` ×13 (b3/board.css:1674, b3/board.css:1675, b3/board.css:1679, …) | — |
| `e5` | `"now"` | ⏳ OPEN — Session 4 | `(present)` ×2 (b3/board.css:1689, b3/board.css:1690)<br>`now` ×1 (b3/board.css:1691) | `a` ×4 (b3/board.css:1686, b3/board.css:1686, b3/board.css:1687, …)<br>`b` ×4 (b3/board.css:1686, b3/board.css:1686, b3/board.css:1688, …) | — |
| `e6` | `"now"` | ⏳ OPEN — Session 4 | — | `a` ×10 (b3/board.css:1698, b3/board.css:1703, b3/board.css:1705, …)<br>`b` ×11 (b3/board.css:1699, b3/board.css:1700, b3/board.css:1701, …) | ui/armory.js:348<br>ui/exportPanel.js:96<br>b3/history.js:47 |
| `exp` | `"b"` | ruled §4 | `b` ×2 (gates.css:660, gates.css:660) | `a` ×2 (gates.css:660, gates.css:660) | gates/armory.js:256<br>gates/armory.js:1101 |
| `expl` | `"tiles"` | ruled §4 (db) | — | — | gates/armory.js:257 |
| `g9` | `"board1"` | board 1 · G9 drawer, answered 2026-09-14 01:18 EDT (plan §9 G9) — `board1` renders that answer | — | — | ui/armory.js:1463<br>gates/armory.js:41 |
| `p1` | `"a"` | §4b — the fork DISSOLVED; `a` is the surviving mark, motion unscoped | `a` ×7 (b3/board.css:164, b3/board.css:165, b3/board.css:167, …)<br>`(present)` ×1 (b3/board.css:176) | `b` ×9 (b3/board.css:178, b3/board.css:179, b3/board.css:180, …)<br>`c` ×10 (b3/board.css:188, b3/board.css:189, b3/board.css:190, …) | ui/armory.js:150<br>b3/armory-parts.js:614 |
| `p10` | `"state"` | ⏳ OPEN — Session 4 · G1 (small text). The board value is NOT a decision | `state` ×3 (b3/board.css:841, b3/board.css:843, b3/board.css:845)<br>`(present)` ×3 (b3/board.css:3376, b3/board.css:3549, b3/board.css:3551) | `now` ×2 (b3/board.css:837, b3/board.css:838)<br>`does` ×2 (b3/board.css:847, b3/board.css:848)<br>`off` ×2 (b3/board.css:850, b3/board.css:851) | gates/armory.js:1159 |
| `p2lab` | `"key"` | ruled §4 | `key` ×1 (b3/board.css:477)<br>`(present)` ×1 (b3/board.css:498) | `colon` ×9 (b3/board.css:476, b3/board.css:507, b3/board.css:507, …)<br>`cap` ×1 (b3/board.css:484)<br>`off` ×1 (b3/board.css:498)<br>`trail` ×1 (b3/board.css:2895) | — |
| `p2pal` | `"final"` | ruled §4 | `final` ×1 (b3/board.css:3336) | `mine` ×2 (b3/board.css:329, b3/board.css:2215)<br>`mineflat` ×1 (b3/board.css:348)<br>`named` ×1 (b3/board.css:358)<br>`parts` ×1 (b3/board.css:359)<br>`calm` ×1 (b3/board.css:367)<br>`now` ×1 (b3/board.css:528) | gates/armory.js:131<br>gates/armory.js:1129 |
| `p2sty` | `"neutralbg"` | ruled §4 (Outline kept in files, unported) | `(present)` ×1 (b3/board.css:528) | `wash` ×8 (b3/board.css:408, b3/board.css:408, b3/board.css:408, …)<br>`washc` ×8 (b3/board.css:411, b3/board.css:411, b3/board.css:411, …)<br>`bar` ×8 (b3/board.css:414, b3/board.css:414, b3/board.css:414, …)<br>`neutral` ×8 (b3/board.css:425, b3/board.css:425, b3/board.css:425, …)<br>`text` ×8 (b3/board.css:518, b3/board.css:518, b3/board.css:518, …)<br>`outline` ×9 (b3/board.css:2878, b3/board.css:2879, b3/board.css:2879, …)<br>`fade` ×8 (b3/board.css:2882, b3/board.css:2882, b3/board.css:2882, …)<br>`lit` ×8 (b3/board.css:2886, b3/board.css:2886, b3/board.css:2886, …) | — |
| `p3` | `"a"` | ruled §4 | — | — | ui/armory.js:150 |
| `p3tbl` | `"bare"` | ruled §4 | — | `count` ×7 (b3/board.css:2837, b3/board.css:2838, b3/board.css:2839, …) | — |
| `p4` | `"b"` | ruled §4 (db) | `b` ×27 (b3/board.css:282, b3/board.css:284, b3/board.css:285, …)<br>`(present)` ×5 (b3/board.css:3250, b3/board.css:3250, b3/board.css:4140, …) | `a` ×22 (b3/board.css:282, b3/board.css:284, b3/board.css:285, …) | ui/armory.js:150 |
| `p5` | `"new"` | the M1 selection bar as board 3 rebuilt it — `new` is the only value the kit offers besides `now`; NO fork record, inferred from the kit | — | — | ui/armory.js:1463<br>ui/manifest.js:149<br>ui/manifest.js:402 |
| `p5bg` | `"mesh"` | ruled §4 (db; Solid kept in files as a future setting) | — | — | b3/armory-parts.js:738 |
| `p5hint` | `"card"` | ruled §4 (db) | — | — | b3/armory-parts.js:740 |
| `p5list` | `"grouped"` | §4b — both views ship | — | — | b3/armory-parts.js:739 |
| `p6` | `"c"` | ruled §4 (db) | — | — | ui/armory.js:1463<br>b3/repairs.js:56<br>gates/armory.js:193 |
| `p6day` | `"real"` | board data switch — `real` is the portal's own data; chrome | — | — | ui/armory.js:1463<br>b3/repairs.js:55<br>gates/armory.js:194 |
| `p6lay` | `"sections"` | ruled §4 (db) | — | — | b3/repairs.js:57 |
| `p7` | `"new"` | P7 Command search — "Build it properly, and exactly as shown" | — | — | ui/shell.js:365 |
| `p8` | `"a"` | ruled §4 (db) | — | — | ui/broadcast.js:535<br>gates/broadcast.js:101 |
| `p9` | `"b"` | ruled §4 (db) | `b` ×39 (gates.css:668, gates.css:668, gates.css:668, …) | `c` ×6 (b3/board.css:4763, b3/board.css:4764, b3/board.css:4765, …)<br>`d` ×5 (b3/board.css:4770, b3/board.css:4771, b3/board.css:4891, …)<br>`e` ×12 (b3/board.css:4784, b3/board.css:4785, b3/board.css:4785, …) | ui/history.js:162<br>b3/history.js:48<br>gates/history.js:42 |
| `section` | `"a1"` | board chrome — which gate is open | — | — | b3/dock.js:64 |
| `xbg` | `"ground"` | ruled §4 (db) | `ground` ×3 (b3/board.css:4207, b3/board.css:4231, b3/board.css:4320) | `mesh` ×2 (b3/board.css:4207, b3/board.css:4231) | — |
| `xtile` | `undefined` | withdrawn v40–41; rounds 5T/5V dead | — | `index` ×1 (b3/board.css:3917)<br>`cloud` ×1 (b3/board.css:3917)<br>`bands` ×1 (b3/board.css:3917) | — |
