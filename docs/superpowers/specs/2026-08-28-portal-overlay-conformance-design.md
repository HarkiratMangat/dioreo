---
kind: spec
status: frozen
---

# The overlay method — making the portal and its mockup produce the same pixels (2026-08-28)

**Frozen snapshot of a method decision taken 2026-08-28 20:1x EDT.** The live procedure is `docs/superpowers/plans/2026-08-27-portal-conformance.md` §0.6; this file records WHY it exists and what was weighed, because a plan states what to do and a spec states what was decided.

## The problem it replaces

Conformance had been: run element scanners, produce a difference list, adjudicate each row against `COMPANION.md` by judgement. Part 1 of the conformance pass was closed **three times** under that method and reopened three times. The measured failure was not effort — every gate was green each time — it was that **closure depended on my judgement over a long list, and judgement was the unreliable component**: three adjudications that day were wrong, two "done" claims were false, and one instrument had been reading 888px of a 4,378px page for its entire existence.

Harkirat's proposal, 2026-08-28 20:1x EDT: *"why don't you try building the live portal as an EXACT duplicate/clone of the mockup design… sync that up so the mockup is using the same data… this way, when you fix the live portal, you should theoretically be able to overlay the 2 screenshots and see no difference."*

**The property that makes it better is not precision — it is that it removes the author from the verdict.** A region count cannot be talked past.

## The four amendments, and what each one prevents

| Amendment | Prevents |
|---|---|
| **Diff the mockup against the HARNESS, not the live server** | The live server carries a session identity, leftover changesets and a database that moves; none of it can be pixel-stable. The harness runs the REAL components on fixtures with no Mongo and no OAuth. ⚠️ The live-server pass is kept as a SEPARATE check — it catches a different class, and did (a banner op keyed on the storage field, a validator's reason thrown away, a diff truncated at 60 characters) |
| **Freeze the clock on both sides** | COMPANION §16.31a: `?today=` does not travel the countdown, so two captures seconds apart can never overlay. Without it the residual has a floor nobody can explain — **and an unexplained floor is how a threshold gets quietly raised until it stops meaning anything** |
| **A conformance FLAG, not commented-out code** | Commented code rots across a multi-week pass, is invisible to every gate, and loses its provenance. More importantly the flag **becomes the register of deliberate divergences** — the artifact whose absence let Board's changeset pipeline be adjudicated against a spec superseded three days before the mockup was drawn |
| **Zero regions, not ±5%** | 5% of a 1282×4400 page is ~282,000 pixels — a whole panel, and more than the entire defect that opened the thread. `--selftest` returns **0.000%** on identical input, so there is no inherent noise to budget for. A percentage lets many small wrongs average into a pass, and the small ones are what this exists to catch |

## What the falsification pass found before any of it was built

- **The data confound did not exist.** `scripts/buildPortal.js` already copies the mockup's `assets/fixtures.js` into the harness — byte-identical by `shasum`. Every apparent data difference had been the LIVE SERVER compared against a fixture. The generator this design originally called for was never needed.
- **`--at` is a COUPLING, not a setting.** The freeze moves the portal's sense of now; it cannot move the mockup's, which reads `today:'2026-08-24'` as a constant out of `fixtures.js`. Any other instant desynchronises the two sides and the drift reads as a design difference.
- **The bar had to be provable both ways** before it could be believed: the self-test returns 0.000% in 0 regions on identical input, and 23.222% in 12 regions with exit 1 when pointed at a different page.

## The limit, stated so it does not become the next over-trusted number

**Pixel equality is necessary and NOT sufficient.** It cannot see:
- **keyboard reachability** — Board's four column headers were `div`s that rendered exactly like buttons, so an overlay would have passed them forever;
- **copy that is wrong in a way that matches the design's own wrong copy**;
- **anything behind an interaction** — the mockup fakes its operations and the portal commits them, so the entire correctness surface sits behind pixels that already match.

It replaces the **adjudication** burden. It does not replace the states walk, the inventory audit, or the real-server pass.

## The result on the proving ground

Broadcast, chosen by Harkirat as a mid-sized realm: **8.4% across 16 regions with a 274px height gap → 0.3% across 28 regions with both pages at exactly 1258px.** Eleven defects, of which three were instruments measuring their own setup (a height probe taking the outer of two nested `main` elements; an export summary summing nested scopes; a grid span that took an element out of its column's max-content, putting the two masthead columns 80px apart while every individual stat measured identical).

**The single most useful operational rule came out of it:** fix the FIRST rhythm mismatch and re-run. A small vertical offset near the top cascades, and the pixel diff reports it as one page-sized region — Broadcast went 8.4% → 5.5% by matching the masthead alone, before a single visual fix.
