---
kind: spec
status: frozen
---

# `/bot analytics` — what live review changed, and the rules that came out of it

**Date:** 2026-08-23 11:34 EDT · **Author:** Claude Opus 5 with Harkirat · **Status:** supersedes the design half of `2026-08-22-bot-analytics-redesign-design.md`

> **Read this before touching `/bot analytics` or the change-detail panel.** The 2026-08-22 spec's §1 (the investigation) and §2 rule 0 (Discord is a glance, the portal is the depth) still stand and are not repeated here. Everything else in its §3–§5 was written before a single page had been seen on a real client, and five rounds of live review on desktop **and iPhone** falsified enough of it that a snapshot amendment is the honest record rather than an edit.

## 0. Why this document exists

The original spec was approved, built exactly as written, shipped — and was then wrong in ways no amount of re-reading it would have surfaced. Every finding below came from **looking at the rendered thing**, most of them from Harkirat looking at it on his phone. That is the single most transferable lesson here and it is deliberately stated before any of the specifics:

> **A design spec for a rendered surface cannot be validated by reading it.** Four of the six rules in §2 below contradict something the earlier spec asserted confidently, and each contradiction cost a shipped release to find.

## 1. The findings, in the order they were found

| # | What shipped | What was actually true | Where it now lives |
|---|---|---|---|
| 1 | Timing showed `-204% headroom · 🔴` for `/colors` | Discord's 3,000 ms limit is the deadline to **acknowledge**; after a defer the window is **15 minutes**. A 9.1 s command was working exactly as designed while the page called it a fault | `ackVerdict()` / `FELT_SPEED` in `commands/bot.js` |
| 2 | `p50` / `p95` / "headroom" | **The page's only reader could not parse any of them.** Every critique round argued about *which threshold* and took the vocabulary for granted | "usually" / "slowest 1 in 20" / the rule plus what it consumes |
| 3 | Health's vitals block | Floating colons (`Gateway :` beside `Restarts:`) — **because a test asserted colon-offset uniformity and the code was changed to satisfy it** | value-column alignment, with the test rewritten |
| 4 | ANSI colour in code fences | **iOS strips it silently.** No escape garbage (the good failure) but no colour, so Timing's colour-only severity was invisible on the primary device | colour is decoration; severity leads with a glyph |
| 5 | `peaksLine` at ~46 columns | Wrapped into four ragged lines on a phone — **and it was the function the earlier spec cited as its own 40-column precedent.** It never met the budget it was offered as evidence for | transposed to ~26; `PHONE_COLS = 32` |
| 6 | "~40 columns of readable width" | Measured near **32**. The estimate was optimistic by a quarter | asserted by test |
| 7 | `CHANGES_PER_PAGE = 5` | The plan said **3**. It shipped at 5 because nothing asserted it, and on iOS a Section accessory stacks **below** its text rather than beside it, so five rows needed scrolling | 3, asserted by test |
| 8 | One-tap Revert on each row | *"what am I even doing by tapping 'revert' or am i just blindly reverting?"* — he was | a detail panel, with Revert behind it |
| 9 | The detail panel, v1 | Printed Section / Action / Record / Affected: the summary restated in schema vocabulary, plus an internal Mongoose model name. **Zero new information** | — |
| 10 | The detail panel, v2 | Dumped the inverse's whole payload for an edit, hiding the one changed field among three unchanged ones | a computed diff |
| 11 | `Items 2 items → 2 items` | The diff **asserted a change and displayed two identical values** — `sameValue` tripped on `_id` keys the stored inverse lacks, and arrays were formatted as counts | name-based comparison + `describeListChange` |
| 12 | `Date · August 13, 2026` | Stored `2026-08-14T00:00Z`. A draw's date is a **day**, stored at UTC midnight; `<t:…:D>` localises it into the previous evening | date-only fields render their UTC day |
| 13 | "Deleted an announcement" showing nothing | The record is gone **by definition**; the inverse payload held it in full and was only read for edits | generic payload view |
| 14 | Field-list descriptions of every record | *"why not literally JUST RENDER the draw?"* — the bot already owns polished renderers for these objects | `RECORD_VIEWS[page].render` |
| 15 | Fixes applied to draws only | The log carries **nine** pages. Every fix was a draws fix wearing a general name | a per-entity registry |
| 16 | `Aug22-28` as a change id | An internal `MMMDD-NN` id that **looks like a date**, rendered inches from "19 hours ago" and disagreeing with it | `#284`, a global sequence |
| 17 | Coverage assumed = `MANAGE_PAGE_SCOPES` | `pageForOp()` also emits **`patchnote` (singular)**, a key in no scope list anywhere | see §4 |

## 2. The rules that came out of it

> **Rule A — Colour is decoration and never meaning.** iOS strips ANSI from a ```ansi fence silently. Anything a reader must tell apart needs a carrier that survives the strip: a glyph, a word, or a number. This is also WCAG 1.4.1, so it is not a mobile-only concession.

> **Rule B — The phone budget is 32 columns, and it was measured.** Not estimated, not inherited. Any monospace block is asserted against it by test. The previous "~40" came from a function that did not meet it.

> **Rule C — Never write vocabulary the reader does not have.** `p50`, `p95` and "headroom" all failed on an audience of one. Translations must stay *true*, not merely simpler — `p95` is **not** "worst case", it is the slow 1-in-20 — and a percentage of an unstated denominator becomes the rule plus what it consumes.

> **Rule D — Render the record with the record's own renderer.** Never re-describe it. Export the canonical builder and reuse it; a copy drifts, and a panel that quietly stops matching the real card is worse than one that never tried. `scripts/botAnalyticsBody.test.js` asserts the draw view is byte-identical to `commands/draws.js`'s output.

> **Rule E — A panel may never assert something a reader can see is false.** `Items 2 items → 2 items` cost more trust than the row was ever worth. Either say what actually moved, or do not claim the field changed.

> **Rule G — Structure carries meaning; prose does not.** Harkirat's own redesign of the diff block, adopted verbatim 2026-08-23 12:31 EDT, and generalised across every panel. A section gets a real `###` heading rather than bold body text wearing an emoji. A label sits on its own line ending in a colon. A value is **code-styled**, so it reads as data and its whitespace and lookalike characters are visible — on `Drop` vs `Draw` that is the difference between reading a change and guessing it. And a before/after **stacks**, one value per line, each led by its own `DiffMinus`/`DiffAdd` glyph: an inline `A → B` puts two long values on one line, which is the same ribbon-wrap failure as the vitals row and the peaks block. The glyphs are the same at both scales — on the field rows and on the BEFORE/AFTER card headings — so they read as one notation rather than two.
>
> ⚠️ The hint under an action is `-#` **subtext sitting directly on the button row, with no divider between them.** At body weight above a divider it reads as the panel's conclusion; as a caption it is what it actually is, and the buttons become the anchor.

> **Rule F — A destructive control states its blast radius first.** Revert writes old values back over anything that came after it, so the panel names later changes to the same record, with who and when, above the red button.

## 3. The record-view contract

One entry per page in `RECORD_VIEWS` (`commands/bot.js`), and pages are **derived from the op registry, never from a scope list**:

```js
{ noun, fetch(target, row) -> record|null, render(record) -> V2 blocks|null, dateOnly: [field] }
```

- `render` is a *fidelity upgrade*, not the path to being useful — a page without one still works through `genericFields()` over the inverse payload. That is what makes coverage a finite job.
- `renderRecord()` takes a **component budget** and falls back when a card will not fit. Components V2 caps at 40 counted recursively and this repo has already taken that as a production crash; a before/after pair of rich cards must prove it fits.
- `fetch` receives the **row** as well as the target, because not every change has an inverse — `/bot access` writes straight through `recordChange()`.

**Deliberately no `fetch`:** `season` and `seasondraft`. Their ops target human labels (`'draft'`, `'season snapshot'`, a season title), not element ids, because the record is the whole global document rather than a row in it. The generic view is the correct and complete answer there.

## 4. The defect this uncovered, which is not this subsystem's to fix

`core/changeset.js`'s `pageForOp()` falls back to `op.type.split('.')[0]` for any op with no registered `/manage` action. Four patch-note ops have none, so **`ChangeLog.page` can hold `patchnote`** — a key `MANAGE_PAGE_SCOPES` does not contain. Every consumer treating that column as a *scope* is then comparing against a string no scope list has, including `handlers/bot.js`'s revert and detail gates via `hasManagePageAccess(userId, row.page)`.

The panel handles both spellings. **The permission consequence is filed, not patched** (`docs/db-deferred-list.md`), because the owner is almost certainly `utils/manageActions.js` and a normalising shim at each call site would recreate the two-hand-synced-copies problem `core/ops/index.js` exists to prevent.

## 5. Audit log

A pass whose stated job was to find where **this** document is wrong.

1. 🔴 **"Frozen specs are superseded, never edited" was nearly violated.** The instinct was to edit the 2026-08-22 spec in place so it would read correctly. That would have destroyed the evidence that the original was confidently wrong — which is the most useful thing either document now contains. The original is marked `superseded_by` and left otherwise untouched.
2. 🟡 **The 32-column budget is a single-device measurement.** It came from one iPhone's wrap behaviour, inferred from which blocks broke and which did not. It is a better number than the 40 it replaced and it is falsifiable by test, but it is not a platform constant and should not be quoted as one.
3. 🟡 **Rule D has an unstated cost.** Reusing a canonical renderer couples this panel to a builder owned by another surface — `buildLoadoutCard` returning a whole Container with live buttons is exactly that coupling biting. The rule stands, but "export and reuse" is not free, and §3's budget guard is what keeps it honest.
4. 🟢 **Cleared:** whether the change-id format change needed a data migration. It does not — every lookup and every `custom_id` treats the id as an opaque string, so old `MMMDD-NN` rows resolve unchanged. Rewriting them would break the `custom_id`s of any panel a user still has open, to correct nothing.
5. 🟢 **Recorded so it is not re-proposed:** collapsing the detail panel back into the row. It was considered — fewer taps — and rejected: a row that carries the full record is no longer a glance, which is the rule the whole redesign rests on.
