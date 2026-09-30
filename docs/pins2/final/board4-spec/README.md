---
kind: reference
status: live
---

# Board 4: Collective — the resolved values

*Generated 2026-09-30T02:48:11.901Z by `extract-spec.cjs` from http://127.0.0.1:8900/docs/pins2/kit/board4.html at 1282×888, fresh profile. 1643 looks specced across 694 signatures. Page errors: 0. Classed signatures rendered in a stage that no pass reached: **15**. Winning declarations the computed value contradicts: **79** (marked ⚠️).*

⚠️ **Not reached** (rendered, classed, never walked — each is a coverage hole):

- `div.pb-head`
- `span.pb-gid`
- `div.b4-try`
- `div.g-tries`
- `div.g-fixed.g-stage.g-sticky.pb-stage`
- `ul.pb-new`
- `li.b4-open`
- `div.pb-ctl`
- `div.b4-stage.g-fixed.g-stage.pb-stage`
- `div.b4-closed`
- `div.b1.b4-cmp.cx-host`
- `div.g-scroll.g-stage.pb-stage`
- `div.b4-exp`
- `div.b4-bare.g-stage.pb-stage`
- `div.b4-vb`

🔴 **Board 4: Collective is every finished surface of boards 1–3 on the kit's portal code, no switches.** Regenerate with `BOARD=4` on both scripts: `BOARD=4 node docs/pins2/final/board4-spec/extract-spec.cjs '' $TMPDIR/b4-spec.md` then `BOARD=4 node docs/pins2/final/board4-spec/split-spec.cjs $TMPDIR/b4-spec.md`. Read [`../FINAL.md`](../FINAL.md) first.

**How to read a table.** *winning declaration* is the text Chrome applied for that property name — or its logical twin, shown as `(as padding-inline-start)` — in cascade order with `!important` honoured; *computed* is what it resolved to; *from* is the selector and `file:line` in the kit. ↑ means nothing on the element declares it and the value is inherited from the named ancestor rule. A percentage beside a pixel value is RESOLUTION: port the percentage. ⚠️ marks the only real conflict — two absolute lengths that disagree — and the computed column is the truth. ⏳ marks a rule keyed on a switch Session 4 still owns (p10, e1–e6): provisional, however it renders. A user-agent row is kept only where it sets something other than a default.

🔴 **Read [`HANDOFF.md`](HANDOFF.md) first — the authored half: per gate what it is, how it behaves and what he ruled. A `from` selector carrying `html[data-b3-…]` is SWITCHED:** read [`switches.md`](switches.md) (port a live one without the qualifier, never a dead one), then [`file-map.md`](file-map.md), [`portal-diff.md`](portal-diff.md), [`class-map.md`](class-map.md), [`token-map.md`](token-map.md) and [`portal-class-rules.md`](portal-class-rules.md) — all generated for Board 4 — before porting a single declaration.

**Regenerate** after ANY change to the kit — including Session 4 changing a switch — with the kit served on :8900 (`.claude/launch.json` → `repo-static`):

```bash
O=docs/pins2/final/board4-spec
node $O/switches.cjs && node $O/overrides.cjs
BOARD=4 node $O/extract-spec.cjs '' $TMPDIR/b4-spec.md && BOARD=4 node $O/split-spec.cjs $TMPDIR/b4-spec.md
node $O/maps.cjs
node $O/structure.cjs && node $O/relations.cjs && node $O/a11y.cjs
```

`relations.cjs` measures his rulings that are relations on the running board ([`relations.md`](relations.md)); `measure.cjs` is Board 3-E's, its selectors board 3's.

| File | Surface | Size |
|---|---|---|
| [`HANDOFF.md`](HANDOFF.md) | the authored port contract, per gate | — |
| [`switches.md`](switches.md) · [`file-map.md`](file-map.md) · [`portal-diff.md`](portal-diff.md) · [`class-map.md`](class-map.md) · [`token-map.md`](token-map.md) · [`portal-class-rules.md`](portal-class-rules.md) | the maps, generated | — |
| [`tokens.md`](tokens.md) | Tokens as resolved on `:root` | 14 KB |
| [`motion.md`](motion.md) | @keyframes the board uses | 9 KB |
| [`C1-armory-manifest.md`](C1-armory-manifest.md) | C1 · The Armory manifest — resting | 332 KB |
| [`C2-new-build.md`](C2-new-build.md) | C2 · New build — resting | 271 KB |
| [`C3-compare.md`](C3-compare.md) | C3 · Compare — resting | 408 KB |
| [`C4-repairs.md`](C4-repairs.md) | C4 · Repairs — resting | 218 KB |
| [`C5-export.md`](C5-export.md) | C5 · Export — resting | 80 KB |
| [`C6-delivery-queue.md`](C6-delivery-queue.md) | C6 · The delivery queue — resting | 173 KB |
| [`C7-broadcast.md`](C7-broadcast.md) | C7 · The Broadcast manifest, and posting — resting | 110 KB |
| [`C8-history.md`](C8-history.md) | C8 · History — resting | 235 KB |
| [`C9-admin-traffic.md`](C9-admin-traffic.md) | C9 · Admin traffic — resting | 11 KB |
| [`states.md`](states.md) | Reachable states | 2265 KB |
