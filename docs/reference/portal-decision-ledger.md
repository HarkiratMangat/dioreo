---
kind: reference
status: live
---

# Portal decision ledger — what is already settled

> 🔴 **THIS FILE IS QUERIED, NOT READ — AND `rg` IS THE WRONG TOOL FOR IT.**
>
> ```
> ctx_search(queries: ["has <the surface> been decided", "is <X> a decision"],
>            source: "/Applications/Claude Code/Diors-Builds/docs/reference/portal-decision-ledger.md")
> ```
>
> ⚠️ **MEASURED 2026-08-31 12:5x EDT, because the first draft of this header said "rg it" and that was wrong.** Against the six selectors an audit finding actually prints — `sclock` · `span.done` · `b.t-legendary` · `countdownParts` · `mh-take` · `ow-i` — **`rg` found 1 of 6.** The same five questions asked in prose through `ctx_search` returned **5 of 5**, each landing on the right row. `b.t-legendary` misses on `rg` because this file writes `.t-legendary` and the finding prints the `b` prefix: **a ledger is prose, a finding is a literal, and `rg` cannot bridge them.**
>
> 🔴 **`feedback_token_conscious_tool_routing` already said this and I did not apply it: a QUESTION about prose → `ctx_search`; a known STRING → `rg`.** The memory records `rg` finding 0/4 on exactly this shape.
>
> ⚠️ **PRECONDITION, AND IT FAILS SILENTLY: `ctx_search` returns nothing for a file that was never indexed.** Run `ctx_index(path: "…/portal-decision-ledger.md")` once per session before trusting an empty result — **an unindexed ledger and a ledger with no matching row look identical.** Same failure shape as an untracked doc being invisible to `docs:audit`.
>
> **Batch it with the audit** — `ctx_batch_execute` runs the realm's audit and queries this file in one round trip, which is the moment both are needed.
>
> It exists because on 2026-08-31 I probed the season clock, the accent tokens and `dateOnly` — **three decisions whose answers were already written three lines from the code** — and re-derived all three. It exists because on 2026-08-31 I probed the season clock, the accent tokens and `dateOnly` — **three decisions whose answers were already written three lines from the code** — and re-derived all three.
>
> ⚠️ **IT ANNOTATES, IT NEVER FILTERS.** A row here means *a decision may cover this — go check it*. It never means *ignore the finding*. The triage classifier built the same day proved the hazard: it could report a false CITED on any `ow-*` row, hiding a real defect on the surface I had made the most decisions about. **A matcher that silently claims "decided" is worse than no matcher.**
>
> **Add a row when a decision is made, not at handoff time.** A decision that lives only in a commit message is invisible to every search over docs. ⚠️ **Write the row in PROSE, not only as a selector** — `ctx_search` matches meaning, so *"the countdown's time source"* is findable where a bare `.sclock` is not.

## How to read a row

**Surface** — what a finding would name (a selector, a file, a component). **Decision** — what was settled. **Reopens if** — the falsifier: what would have to be true for this to be worth revisiting. A row with no falsifier is dogma, not a decision.

---

## Cross-realm — these bind every realm, including ones nobody has opened

| Surface | Decision | Date | Why | Reopens if |
|---|---|---|---|---|
| `.t-legendary` `.t-mythic` — **Armory's tier board** | **Portal keeps its colour.** Class (b) | 2026-08-31 | The mockup's `season.html` emits `t-legendary` while its own stylesheet defines only `.t-leg`, so **all 45 of its tier words render unstyled**. A typo in the package, not a design decision — same class as the `"Releases <date>"` parse artifact | The mockup package is regenerated and defines the classes it emits |
| `shell.js` crumb separator · `overlay.js` drawer close | **Portal keeps the inlined SVG.** Class (c) | 2026-08-31 | `reference_never_text_glyphs_for_icons` — a text glyph inherits font metrics nothing here controls. ⚠️ **These two must always resolve together**; an SVG chevron beside a text-glyph close is two habits, not one rule | The standing rule is retired |
| `tokens.css` `--ctl-min` `--ctl-pad` `--ctl-rad` | **Design's values, adopted app-wide** | 2026-08-31 | Every button in every realm. Verified on Season and Broadcast only — **Armory, Access, Analytics and Review were never opened after it** | A realm shows button metrics that look wrong |
| `--draw` `--ret` `--ev` `--play` accent tokens | **Portal keeps its values.** Settled, not a conformance question | before 2026-08-31 | `tokens.css`'s own comment: **the design's stylesheet values never painted anything** — its Track renders from `lane.bar` in the fixtures, which is exactly what the portal's tokens carry. Both sides were internally consistent, which is why nothing caught it until they were rendered side by side | Someone re-measures and finds the fixtures disagree with the tokens |
| `.mh-stats .stat .v.zero` and the `--ink4` group | **Design's `--ink4`** | 2026-08-31 | The masthead all six realms inherit | — |
| **Redesigns** | **Wait for ALL SIX realms.** Re-affirmed against my own argument | 2026-08-31 | I reasoned the rule existed only because a flag switched redesigns off, and that the collapse deleted the flag. **Harkirat kept it.** ⚠️ **A rule he set does not lapse because I can no longer see its reason** | He says so |
| **What a realm pass is FOR** | **The diff finds SURFACES · I read the CODE · HE closes by looking.** The percentage is a pointer, never a target | 2026-08-31 | Every real defect this pass found came from reading code around a difference; **none came from the number**. Driving the number produced three false closes, a self-comparison sweep and an 888px lie | — |
| **Merge cadence** | **Merge this branch, then one PR per realm** | 2026-08-31 | 281 commits, 53,795 insertions, no PR for six days ⚠️ **The branch is NOT "Season"** — it carries the Preact migration, the instrument suite and the mode collapse | — |
| `?conform=1` | **Gone.** Renamed `?fresh=1`, which does FIXTURES ONLY | 2026-08-31 | The two rendering modes collapsed. **There is no stand-down switch — do not look for one, and do not add a `conforming()` site** | — |
| **375×812** | **Dropped** | 2026-08-30 | His call | He asks for it |

## Season — closed as a cited floor, not as a clean sheet

| Surface | Decision | Date | Why | Reopens if |
|---|---|---|---|---|
| `section.collapsed.identity.rise` **+16px** | **① CASCADE closed as CITED.** Reports forever | 2026-08-31 | The banner thumbnail is the **broken-image detector** — `brokenBanner` is written by its `onError`. Adopting the design's no-image version lets a broken banner assert *"image cached and serving"*. ⚠️ **A future session WILL see this finding on every Season audit. It is not unfinished work** | The banner surface is redesigned to occupy the design's height |
| `.sclock` — the season clock | **Design's readout. The hero clock was DELETED** | 2026-08-31 | Attempt 13, COMPANION §16.31a, its own critique never addressed. **Queued for redesign in the deferred list — what comes back is not that code.** Photographed before deletion: `https://claude.ai/code/artifact/48baf822-3a53-46d0-9fe9-93da8e00d104` | The redesign phase begins |
| `SeasonClock`'s time source | **Portal keeps `Date.now()`.** Class (b) | 2026-08-31 | The design reads from the start of its fixture day — that is what made two captures comparable, and **it is not a clock for a running console** | — |
| `oneway.js` — **SEVEN operations, not five** | **Portal keeps all seven and refuses the design's wording.** Class (b) ×4 | 2026-08-31 | Conforming would delete two real destructive ops, promise an **export interlock this console does not have** (`portalExport.test.js:147` forbids exactly that claim), and **remove the typed-confirm field in front of seven irreversible operations** | The changeset-export interlock moves to this screen |
| Day drawer's prev/next buttons + *Open a day…* | **Portal keeps them.** Class (b) | 2026-08-31 | The entire keyboard path into that surface. 🔴 **§0.6a's own coverage note says the overlay method cannot see keyboard reachability** — nothing downstream would ever have reported this | — |
| Calendar-banner status line | **Portal keeps its wording and its `<img>`.** Class (b) | 2026-08-31 | The `<img>` **is the detector**; without it nothing fires `onError` and a broken banner asserts its own health | — |
| Patch notes in the Manifest | **Included** — and the action paths are **guarded** | 2026-08-31 | The design lists them, and excluding them made the portal contradict its own export (*"37 of 37"* beside a strip saying 39). ⚠️ **Removing that gate also opened edit and remove on publications** — guarded in `4f4e211`, with `scripts/seasonPatchNoteGuard.test.js` proved able to fail | — |
| `.rowlife` | **Emitted with no rule, on purpose** | 2026-08-31 | The mockup emits it on every row and defines no rule either. **Removing it would change the class list the audit pairs on.** `portalOrphans` and `portalReverseOrphans` both know this via `scripts/lib/designClasses.cjs` | — |
| `.dend` · `.pill.ghost` | **Deleted** | 2026-08-31 | **Zero elements in either page.** Dead in the design too | — |
| The A/B artifact | **Dropped for Season** | 2026-08-31 | His call. §0.5b's published-frames exit condition is waived for this realm | — |

## Instruments — what they can and cannot do

| Instrument | State | Reopens if |
|---|---|---|
| `portalGeometry` | **Clock frozen 2026-08-31**, storage cleared. It was the last one that was not | — |
| `portalInventory` · `portalStates` | Clocks frozen the same day | — |
| `portalAudit` · `portalDiff` · `portalProbe` · `portalConverge` | Freeze and clear storage. ⚠️ **`--at` must stay at the mockup's own `F.today`, `2026-08-24`** | — |
| `portalCaptureModes` | **Historical.** No conform-OFF rendering left to photograph; its arrival assertion now refuses every run, which is correct | — |
| **The triage classifier** | ⚠️ **Regex classification, NOT measurement.** Can report a **false CITED on any `ow-*` row** | — |
