---
kind: reference
status: live
---

# Board 3-E — the resolved values

*Generated 2026-09-21T14:18:12.642Z by `extract-spec.cjs` from http://127.0.0.1:8900/local/pins2-board-3/redo/board3e.html at 1282×888, fresh profile. 596 looks specced across 307 signatures. Page errors: 0. Classed signatures rendered in a stage that no pass reached: **0**. Winning declarations the computed value contradicts: **2** (marked ⚠️).*

**How to read a table.** *winning declaration* is the text Chrome applied for that property name — or its logical twin, shown as `(as padding-inline-start)` — in cascade order with `!important` honoured; *computed* is what it resolved to; *from* is the selector and `file:line` in the kit. ↑ means nothing on the element declares it and the value is inherited from the named ancestor rule. A percentage beside a pixel value is RESOLUTION: port the percentage. ⚠️ marks the only real conflict — two absolute lengths that disagree — and the computed column is the truth. ⏳ marks a rule keyed on a switch Session 4 still owns (p10, e1–e6): provisional, however it renders. A user-agent row is kept only where it sets something other than a default.

🔴 **A `from` selector carrying `html[data-b3-…]` is SWITCHED.** Read [`../switches.md`](../switches.md) first: port a live one without the qualifier, never port a dead one. And read [`../token-map.md`](../token-map.md) and [`../class-map.md`](../class-map.md) before porting a single declaration — the board reads `--b3-*` and `--h1-*` tokens and 204 classes the portal does not have.

**Regenerate** after ANY change to the kit — including Session 4 changing a switch — with the kit served on :8900 (`.claude/launch.json` → `repo-static`):

```bash
node docs/superpowers/mockups/2026-09-15-pins2-board-3/3e/switches.cjs
node docs/superpowers/mockups/2026-09-15-pins2-board-3/3e/extract-spec.cjs
node docs/superpowers/mockups/2026-09-15-pins2-board-3/3e/split-spec.cjs
node docs/superpowers/mockups/2026-09-15-pins2-board-3/3e/measure.cjs
```

| File | Surface | Size |
|---|---|---|
| [`tokens.md`](tokens.md) | Tokens as resolved on `:root` | 14 KB |
| [`motion.md`](motion.md) | @keyframes the board uses | 9 KB |
| [`L1-list-lab.md`](L1-list-lab.md) | L1 · Selection-list spacing lab — resting | 0 KB |
| [`M1-armory-manifest.md`](M1-armory-manifest.md) | M1 · The Armory manifest — resting | 285 KB |
| [`M2-repairs.md`](M2-repairs.md) | M2 · Repairs — resting | 214 KB |
| [`M3-export.md`](M3-export.md) | M3 · Export — resting | 79 KB |
| [`B1-delivery-queue.md`](B1-delivery-queue.md) | B1 · The delivery queue — resting | 98 KB |
| [`H1-history.md`](H1-history.md) | H1 · The history manifest — resting | 232 KB |
| [`states.md`](states.md) | Reachable states | 416 KB |
| [`P7-command-search.md`](P7-command-search.md) | P7 · Command search — settled "as shown", mounted here from `b3/palette.js` | 95 KB |
