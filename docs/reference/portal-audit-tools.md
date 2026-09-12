---
kind: reference
status: live
---

# Portal conformance audit tools

*Written 2026-09-08 20:44 EDT, WP6 of the context-carriers plan (`~/.claude/plans/okay-so-i-want-majestic-yao.md`) — moved out of `CLAUDE.md`'s portal nav row so the always-loaded root file carries a pointer instead of the full tool reference.*

The first call on any realm is `npm run portal:audit -- --realm <r> [--view <tab>] [--all]`. It replaced adjudication-by-judgement 2026-08-28 (Part 1 had closed and reopened three times on green gates) — the portal is built to overlay its mockup, pixel for pixel.

## The five sections are the batching contract

① CASCADE (the first vertical offset — fix ALONE and re-run) · ② SHAPE · ③ WORDS · ④ STYLE · ⑤ RULES. **②–⑤ never cascade into one another, so each is ONE batched edit.** Treating them one-at-a-time cost 100+ turns on one view; the audit took Season's Board from 664 differences to 10 in five passes. It pairs by LCS alignment (simpler rules were measured and are worse), groups a repeated pattern as one finding, and reads both stylesheets at-rule aware.

## What the instruments can reach (added 2026-08-30, found by Harkirat, not the tools themselves)

- `--open "<trigger>"` reaches anything behind a click (composer, export drawer, day drawer); `--triggers` lists every openable control on both sides, marking one-sided ones and filtering out data rows.
- `--hover` / `--focus` reach the same DOM under a different pointer/focus condition — ~145 `:hover` and ~75 focus rules a side that had never been compared.
- ④ STYLE samples **47** computed properties, not 27: `boxShadow`, `backgroundImage`, `borderStyle` were missing — COMPANION's law is SHAPE carries state (solid live, dashed staged, hatched conflict), so the audit previously couldn't tell a live bar from a staged one.
- ⑤ RULES also reads the realm page's own `<style>` block (`season.html` carries 31 rules there; no other page has any).
- `npm run portal:probe -- --realm <r> --sel "<css>" [--chain]` answers WHY a box differs — it names the ancestor that first changes an inherited property. Found the composer's container, the trapped scrim, and an inverted stand-down. Has its own `--selftest`.
- A hovered/focused/opened frame is captured at FOLD height — its percentage is comparable only to `--fold`, never the full-page number.
- `--triggers` spells a control differently per side: the mockup draws `+ Grant access` where the portal draws `+ Grant access N` (the portal's keyboard-shortcut chip). `--open` matches text, so open by the side's own wording or it refuses.
- Both tools print the axes they do NOT cover: 1282×888 only, data states never pixel-compared, transitions zeroed, light mode out of scope.

## The older, shallower instruments

`npm run portal:converge -- --realm <r>` prints RHYTHM, WORDS, STYLE from one pair of loads; `node scripts/portalDiff.mjs --realm <r> --portal harness` for pixels; `npm run portal:inventory -- --realm <r>` for what exists on one side only. **Fix the first rhythm mismatch and re-run** — an offset near the top cascades and the diff reports the whole page as one region (Broadcast went 8.4% → 5.5% by matching the masthead alone). Diff against the HARNESS, never the live server: they load byte-identical fixtures, so the comparison is of design; the live-server pass is a separate correctness check. `portalDiff` freezes `Date` on both sides — `--at` must stay at the mockup's own `F.today`, `2026-08-24`, which `fixtures.js` hardcodes and the freeze cannot move.

`npm run portal:sweep` runs the diff for all seven realms in one pass, for a regression check after a shared edit.

## Seeding and fixture-day caveats

- **Home and Review refuse without `--mk-query demo=1`** (all five instruments, 2026-09-03). Their pages carry staged surfaces, the mockup's staged store is `sessionStorage`, and every instrument clears it — unseeded they compare an empty mockup against a populated portal. The seed list is `scripts/lib/portalSeedRealms.mjs`; add a realm there, not in five files.
- **The harness stands on the fixture day now.** `fixtures.js` stamps `dataset.today` only under `?today=`, so the portal harness used to render on the real date while the mockup rendered on `2026-08-24` — invisible under `portalDiff` (it freezes `Date`) and ten days wrong under `portalAudit` (it does not). `portal/ui/harness/index.html` stamps it; the real page does not.

## Coverage caveats

An overlay cannot see keyboard reachability, copy that's wrong in a way that matches the design's own, or anything behind an interaction it never opened. "Behind an interaction" is a whole tier: `portalDiff` shoots the page as it loads and `portalAudit` walks the DOM as it loads, so anything behind a button was never compared until 2026-08-30's `--open`/`--triggers`. Current per-realm overlay coverage: `docs/reference/portal-decision-ledger.md` § Overlay tier (the pre-2026-09-04 seeding numbers there are explicitly superseded).

## The harness

`portal/ui/harness/` builds `portal/public/harness.html` — the real components on fixtures, no Mongo, no OAuth, no `server.js`. Run the `portal-harness` launch config (`:8901`, rooted at `portal/public`) after `node -e "require('./scripts/buildPortal').build()"`. `?today=YYYY-MM-DD` travels the fixture date (does NOT move the season countdown — `countdownParts` reads `Date.now()`; set `data-tier` on `.sclock` to exercise the five tiers). `?realms=` / `?owner=0` narrow the grant. It stubs `fetchJson` through an import map, so no production file carries a harness branch. Design: `docs/superpowers/specs/2026-08-20-web-admin-portal-design.md`; the Preact migration it exists to serve: `docs/superpowers/specs/2026-08-25-portal-preact-migration-design.md`.
