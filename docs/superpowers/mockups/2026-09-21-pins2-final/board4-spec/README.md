---
kind: reference
status: live
---

# Board 4: Collective — the resolved values

*Generated 2026-09-27T06:25:47.835Z by `extract-spec.cjs` from http://127.0.0.1:8900/local/pins2-board-3/redo/board4.html at 1282×888, fresh profile. 1181 looks specced across 517 signatures. Page errors: 0. Classed signatures rendered in a stage that no pass reached: **27**. Winning declarations the computed value contradicts: **58** (marked ⚠️).*

🔴 **Board 4: Collective is every finished surface of boards 1–3 on the kit's portal code, no switches.** Regenerate with `BOARD=4` on both scripts: `BOARD=4 node docs/superpowers/mockups/2026-09-15-pins2-board-3/3e/extract-spec.cjs '' $TMPDIR/b4-spec.md` then `BOARD=4 node docs/superpowers/mockups/2026-09-15-pins2-board-3/3e/split-spec.cjs $TMPDIR/b4-spec.md`. Read [`../FINAL.md`](../FINAL.md) first.

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
| [`C1-armory-manifest.md`](C1-armory-manifest.md) | C1 · The Armory manifest — resting | 309 KB |
| [`C2-new-build.md`](C2-new-build.md) | C2 · New build — resting | 263 KB |
| [`C3-compare.md`](C3-compare.md) | C3 · Compare — resting | 6 KB |
| [`C4-repairs.md`](C4-repairs.md) | C4 · Repairs — resting | 218 KB |
| [`C5-export.md`](C5-export.md) | C5 · Export — resting | 80 KB |
| [`C6-delivery-queue.md`](C6-delivery-queue.md) | C6 · The delivery queue — resting | 101 KB |
| [`C7-broadcast.md`](C7-broadcast.md) | C7 · The Broadcast manifest, and posting — resting | 104 KB |
| [`C8-history.md`](C8-history.md) | C8 · History — resting | 235 KB |
| [`C9-admin-traffic.md`](C9-admin-traffic.md) | C9 · Admin traffic — resting | 11 KB |
| [`states.md`](states.md) | Reachable states | 1538 KB |
