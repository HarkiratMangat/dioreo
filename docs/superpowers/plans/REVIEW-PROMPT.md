---
kind: plan
status: live
---

# Part 6a — Review. Paste this in.

> 🔴 **IF YOU WERE HANDED A SHORT OPENER, IT IS NOT A SUMMARY OF THIS FILE.** It is a pointer with a gate on it. Everything that makes this realm different from the last four is below and none of it fits in an opener: the reason a naive conformance pass on Review drives the portal toward an EMPTY BOARD, the metric that told two Parts this realm had zero handlers, and the one number the plan quotes that is a category error rather than a large value.
>
> **The falsifiable version:** this document names **one** thing the design deliberately does NOT draw, and **one** figure that looks catastrophic and is not a ratio at all. If your working belief is "Review is small and static, do a light pass", you are holding the framing this document exists to overturn — and it was the plan's own framing until 2026-09-01.

> Written 2026-09-01 23:13 EDT. **Every number below names the command that produces it**, and every one was re-measured that day. Where a figure and a tool disagree the tool wins — ⚠️ **except where the tool is the thing that was wrong**, which is exactly what happened here and is §1.

## 🔴 §1 — THE PLAN SAID "ZERO HANDLERS, NOTHING TO OPEN". THAT WAS A BLIND METRIC, NOT A FACT.

`portalStatus` counted only `/addEventListener|onclick=/`. `review.html` has **zero** of those and wires **7 handlers by property assignment** (6 `.onclick =`, 1 `.oninput =`). The tool was fixed 2026-09-01 23:13 EDT and now reports **18KB · 7h**; the footer that asserted "static compositions with ZERO handlers" is derived from the rows now.

**This matters beyond the number.** §L row 6a and §0.6a both concluded from it that an interaction tier has nothing to open here and that a percentage chase manufactures precision. The first half is false. The second half may still be right — but it is now an open question rather than a settled one, and it is yours to answer.

🔴 **AND REVIEW IS THE COMMIT SCREEN.** `npm run portal:audit -- --realm review --triggers` gives **mk 11 · pt 15**, with EIGHT portal-only controls: `Discard Season identity` · `Discard The Widow's Bite Draw` · `Discard AK117 — Meta Build` · `Discard Molten Fusion Draw` · `Discard all` · `Export it now` · `Commit 4 changes` · `…2283`. **The realm the plan called static has the highest-consequence interaction tier in the portal** — it is the only screen where staged work becomes real. Nothing behind those controls has ever been opened by an instrument, on either side.

## 🔴 §2 — THE MOCKUP IS A STUB OF AN EMPTY BOARD, SO CONFORMANCE INVERTS HERE

`review.html:245` draws `<button class="chip go" id="seed" data-demo-only>Load a sample changeset</button>` and `:342` reads *"The review screen is empty, so there is nothing to confirm."* **The design page's resting state is an EMPTY review screen plus a button to fake one.** Its own copy at `:237,240-241` says a mockup that invented staged work would teach the wrong thing about staging.

The harness populates four changesets. So:

- **A naive convergence drives the portal toward emptiness.** You cannot converge a populated board onto a page that chose not to populate itself.
- **The UX-copy audit says that button and its neighbouring copy MUST NOT SHIP** (`local/handoff/2026-08-25-portal-ux-copy-audit.md`, section F4 — gitignored, open it by path). So it is mockup-only *and* must stay that way. Do not port it, and do not file it as a missing affordance.
- **Resolve the fixture question BEFORE the first audit.** Part 5 learned this after the fact: its harness stub folded a five-row sample and called it a week's distribution, which made the realm's main defect unreachable by every instrument. Ask first: what does each side draw at rest, and are they comparable at all.

## §3 — THE RESTING NUMBERS, AND ONE OF THEM IS A CATEGORY ERROR

Measured 2026-09-01 23:13 EDT.

| Reading | Value | ⚠️ |
|---|---|---|
| `portal:converge --realm review` | **40 mismatches of 25 design nodes** · WORDS 5 · STYLE 1 · mk 25 nodes (530px) · pt 40 (740px) | 🔴 **40 > 25 is NOT a ratio and not 160% wrong.** EXTRA and ABSENT rows are counted alongside paired ones. Read it as "25 design nodes, 40 findings" |
| `portal:inventory --realm review` | mk **32** signatures · pt **55** · ONLY-IN-MOCKUP 7 · ONLY-IN-PORTAL **30** · WORDS 5 · COUNT 2 · STYLE 3 | The portal has nearly double the elements |
| `portalDiff --realm review --portal harness` | **4.7%, 15 regions** · mk 888px · pt 984px · portal 96px taller | 🔴 **Nearly double the elements at 4.7% is the tell.** Most of the extras are small, or below the fold — the diff sees 888px of a 984px page |
| `portal:audit --realm review --all` | ② SHAPE 59 · ③ WORDS 2 · ④ STYLE 8 · ⑤ RULES 2011/41/40 | ⑤ RULES is identical on every realm — cross-realm, not this realm's work |
| Both sides | `review.html` **18KB · 7h** · `portal/ui/review.js` **19.5KB · 283 lines · 12 onX sites** | |
| Views | 🔴 **NONE.** `review.html` has zero `data-view` and `review.js` passes no `viewOptions` | So `--view` does not apply, `portalRealWalk` has no views to walk, and Part 5's five-view rhythm does not transfer |

## §4 — WHAT PART 5 ALREADY FIXED THAT TOUCHES THIS REALM

Do not re-find these; do check they still hold.

- **`review.js:148`'s blocker count** carried `tone:'bad'`, which styles nothing in either sheet — the one number that says why you cannot commit rendered in ordinary ink. Fixed 2026-09-01, and `portalUi.test.js` now conserves every literal tone against the stylesheet. **Fourth realm with that defect; first one caught by a gate.**
- **`Manifest` rows are keyboard-reachable** (`role=button`, `tabindex`, Enter/Space) wherever a realm passes `onRowClick`. If Review adds a row action it inherits this.
- **The no-match empty state** names the action and the total on every realm.
- **`Manifest`'s `filterSignal`** lets a realm drive the chips from its own surface.

## §5 — POINTERS, NOT PARAPHRASES

The procedure is not restated here on purpose; a paraphrase is what gets trusted and a pointer is what gets followed.

- **The method, the five audit sections and the batching contract** — `CLAUDE.md`'s `portal/` row.
- **The seven close conditions and the status vocabulary** — the conformance plan's §L. ⚠️ **① and ② close on the ENUMERATION, never a percentage.**
- **Settled decisions, before re-deriving any of them** — `docs/reference/portal-decision-ledger.md`, queried with `ctx_search` rather than `rg`.
- **The traps that only matter once you are IN a portal file** — `.claude/rules/portal-editing.md`. ⚠️ It fires on a Read, and the batching contract means you may never trigger one; read it deliberately.
- **What Part 5 measured, decided and left open** — `local/difference-ledger-analytics.md`, `local/locate-analytics.md`, `local/analytics-triage.md` (all gitignored; open by path).

## §6 — THE TWO THINGS PART 5 GOT WRONG THAT WILL COST YOU TOO

**1 · A gate proven against a fixture you designed is not proven.** Part 5 wrote the tone conservation check, gave it a can-fail proof built from a synthetic array, and shipped it green — and it was **vacuous for the exact defect that motivated it**, because every tone that can be wrong is written as a ternary and the scanner matched only bare literals. It was caught only by reintroducing the real shipped bug and watching it stay green. **Feed every new gate the actual broken input.**

**2 · Naming a gap is not closing it.** Part 5 reported "done" twice with a list of owed items in the same message, and both times the reader had to catch it. Use the list to work, not to license the claim.

## Closing

⚠️ **Part 6b HOME has no prompt and cannot share this one.** Its failure mode is composition against COMPANION; 6a's is correctness against a mockup that declines to populate itself. One document covering both would blur the two things the plan separates on purpose.

- mockup — `http://localhost:8900/docs/superpowers/mockups/2026-08-23-portal-interactive/review.html`
- portal — `http://localhost:8901/harness.html?fresh=1&b=<any number>#/review` — the `b=` cache-buster is not optional
- real — `http://localhost:8787/#/review`

**Never write "done" — Harkirat decides that.**
