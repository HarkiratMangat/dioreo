---
kind: reference
status: live
---

# Board 3-E — the resolved values

*Generated 2026-09-21T13:33:46.568Z by `extract-spec.cjs` from http://127.0.0.1:8900/local/pins2-board-3/redo/board3e.html at 1282×888, fresh profile. 596 looks specced across 307 signatures. Page errors: 0. Classed signatures rendered in a stage that no pass reached: **0**. Winning declarations the computed value contradicts: **30** (marked ⚠️).*

**How to read a table.** *winning declaration* is the text Chrome applied for that property name, in cascade order with `!important` honoured; *computed* is what it resolved to; *from* is the selector and `file:line` in the kit. ↑ means nothing on the element declares it and the value is inherited from the named ancestor rule. ⚠️ means a DIFFERENT property name overrode it later — a shorthand beaten by a longhand or the reverse (`padding` against `padding-inline`) — and **the computed column is the truth**. A user-agent row is kept only where it sets something other than a default.

**Regenerate** after any board change, with the kit's dev server up: `node docs/superpowers/mockups/2026-09-15-pins2-board-3/3e/extract-spec.cjs` (writes to the OS temp dir), then re-split. Generated 2026-09-21 09:36 EDT against artifact **v77**.

🔴 **READ `../token-map.md` AND `../class-map.md` BEFORE PORTING A SINGLE DECLARATION.** Board 2's spec could say *"port the winning expression, tokens intact"* because board 2 used portal tokens and put `pb-` only on its classes. Board 3-E's winning declarations read **35 `--b3-*` tokens and 18 `--h1-*` ones that do not exist in the portal**, and 204 of its classes are board-only. A verbatim port ships `var(--b3-fill)` into a stylesheet where it resolves to nothing.

| File | Surface | Size |
|---|---|---|
| [`tokens.md`](tokens.md) | Tokens as resolved on `:root` | 13 KB |
| [`motion.md`](motion.md) | @keyframes the board uses | 8 KB |
| [`L1-list-lab.md`](L1-list-lab.md) | L1 · Selection-list spacing lab — resting | 0 KB |
| [`M1-armory-manifest.md`](M1-armory-manifest.md) | M1 · The Armory manifest — resting | 268 KB |
| [`M2-repairs.md`](M2-repairs.md) | M2 · Repairs — resting | 207 KB |
| [`M3-export.md`](M3-export.md) | M3 · Export — resting | 75 KB |
| [`B1-delivery-queue.md`](B1-delivery-queue.md) | B1 · The delivery queue — resting | 91 KB |
| [`H1-history.md`](H1-history.md) | H1 · The history manifest — resting | 222 KB |
| [`states.md`](states.md) | Reachable states | 384 KB |
| [`P7-command-search.md`](P7-command-search.md) | P7 · Command search — settled "as shown", mounted here from `b3/palette.js` | 92 KB |
