---
kind: plan
status: frozen
---

# Portal Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the Dioreo web admin portal from "wired, rendering, and passing every gate" to "visually finished, design-complete, and reachable in production."

**Architecture:** The portal is Preact + htm ESM in `portal/ui/`, driving the operation algebra in `core/`, served by `portal/server.js` behind Discord OAuth. The design was migrated onto it from the interactive mockup package on 2026-08-26. This plan does not add subsystems — it closes the gap between what shipped and what was designed, and establishes ground truth first because **the tracker was measurably not a reliable index of that gap** (see §0).

**Tech Stack:** Preact + htm (no bundler, ESM + import maps) · `portal/ui/app.css` (the mockup's stylesheet, adopted whole) · the fixture harness at `portal/public/harness.html` · Node test scripts wired into `npm test`.

**Spec:** `docs/superpowers/specs/2026-08-20-web-admin-portal-design.md` (the portal itself) and `docs/superpowers/specs/2026-08-25-portal-preact-migration-design.md` (the migration that produced the current code). ⚠️ Both are `status: frozen` dated snapshots. The **maintained** design record is `docs/superpowers/mockups/2026-08-23-portal-interactive/COMPANION.md`, and §16.31a of it was found stale on 2026-08-27 — see §0.

---

## Global Constraints

- **The design IS the mockup.** Harkirat, 2026-08-27: *"the old design is essentially retired at this point. the design is the mockup (plus any pieces you want to cherry pick out of the old design)."* Port it; keep what `portal/ui` already does better; when the portal genuinely advances past the package, **update COMPANION** — it is `kind: reference`, maintained, not frozen.
- **A green suite never means "this is good."** Every portal gate is a source scanner. `npm test` exit 0 has coexisted with a crash-looping realm, a dead branch, and five simultaneous composition defects. **Open the page and look.**
- **Design forks are HITL.** Thirteen rejected attempts vs four pop-up questions is where that rule came from. Ask as `AskUserQuestion` with measurements attached, never buried in prose. **"Try it" is not "approved"; nothing on localhost is a deliverable.**
- **Do not push, PR, or ask about either.** Standing instruction, stated repeatedly. The branch's size is a consequence of that decision, not a finding.
- **`npm test`'s exit code gates every commit** (`&&`, never `;`). A `portal/ui/` module change needs `npm run portal:bust`. A backtick inside an HTML comment inside a template literal kills the page.
- 🔴 **DESKTOP IS THE PRIMARY LAYOUT — verify at 1280×880 and do NOT spend the session on mobile.** Harkirat, 2026-08-27 mid-session: *"desktop is the primary layout/device which the portal will be used on. Optimize it for desktop first. Mobile optimization is a future endeavour."* ⚠️ **This line previously read "Verify at both widths — 1280×880 and 390×844", and Phase 0 burned real turns on a 375px pass before he said so.** A mobile defect found in passing still gets FILED; it does not get fixed. ⚠️ **And 1280 is not his real viewport** — he runs Arc with a persistent left tab bar, so the page gets roughly 1700px. Check anything width-sensitive there too.
- Commit trailers: `Co-Authored-By: Claude <model> <noreply@anthropic.com>` and `Co-Authored-By: diorswrld <310361322+diorswrld@users.noreply.github.com>`.

---

## §0 — WHY THIS PLAN EXISTS, AND WHY PHASE 0 COMES FIRST

**On 2026-08-27 the portal was opened in a browser for the first time by anyone.** Within minutes it produced three findings that no gate, no tracker entry and no handoff had:

1. **The Armory realm was dead** — `ReferenceError: data is not defined` on every load, since 2026-08-26, through two self-audits that were specifically hunting that bug class. Fixed (`8a21f32`).
2. **The header's staged-review pill has no responsive handling** and renders as a broken blob below 900px. Never caught because every prior check ran at desktop width.
3. **Five design items existed in NO tracked file** — only in gitignored `local/handoff/` notes that no `rg`, no gate, and no documented workflow can reach.

And the tracker itself carried a **wrong** verdict twice in one morning, because two records that agreed with each other turned out to be the same commit twice:

> `COMPANION.md` §16.31 documents the season clock as settled, and `portal/ui/app.css` matches it exactly — but **both ship in `8e94a2e` (2026-08-25 21:10 EDT)**, so their agreement carries zero independent information. `local/handoff/2026-08-25-portal-compact-I.md` was written at **22:11 EDT, one hour later**, critiquing that exact design and making its rebuild FIRST ACTION.

🔴 **The rule this produces, and Phase 0 exists to enforce it: a record cannot know about events after it was written. Order records by timestamp before believing any claim assembled from them, and check `git log -S"<thing>"` before accepting "this is done."**

---

## §0.05 — SOURCE KEY, AND WHERE YOU ARE

**Branch: `feat/portal-redesign-session-b`.** Nothing on it is pushed and there is no PR; that is deliberate and is not yours to change.

🟡 **Every handoff below is GITIGNORED — a DEFAULT `rg` and `--hidden` miss them, but `rg -uu` FINDS them.** They are cited by nickname throughout this plan; these are the real paths.

> 🔴 **CORRECTED 2026-08-27 13:5x EDT. This line said "no `rg`, no glob and no gate in this repo reaches them", and that was FALSE — measured both directions.** `rg -l 'THIRTEEN REJECTED DESIGNS'` returns **0**; `rg -uu -l` on the same phrase returns **1**. `local/` is *gitignored*, not *hidden*, so `--hidden` alone genuinely fails and the claim generalised from the flag that does not work.
>
> **This false claim is the single biggest reason "what remains for the portal" kept coming back wrong** — including the failure that produced this plan. Told the exhaustive records were unsearchable, sessions did not search them, so every residual list was assembled from the tracked subset and was confidently incomplete. Use this before concluding anything is untracked:
>
> ```bash
> rg -uu -n '<phrase>' local/handoff/
> ```

| Nickname in this plan | Actual path |
|---|---|
| compact-H | `local/handoff/2026-08-25-portal-compact-H.md` |
| compact-I | `local/handoff/2026-08-25-portal-compact-I.md` |
| session-G | `local/handoff/2026-08-25-portal-session-G.md` |
| migration-II | `local/handoff/2026-08-26-portal-migration-II.md` |
| compact-III … compact-VII | `local/handoff/2026-08-26-portal-compact-{III,IV,V,VI,VII}.md` |
| checkpoint-VIII | `local/handoff/2026-08-27-portal-checkpoint-VIII.md` |
| PORTAL-MAP | `local/handoff/PORTAL-MAP.md` ⚠️ **in `local/handoff/`, despite the repo-root-sounding name** |
| COMPANION | `docs/superpowers/mockups/2026-08-23-portal-interactive/COMPANION.md` (tracked) |

**The two servers, and which is which — they are not interchangeable:**

| Config | Port | Rooted at | Use it for |
|---|---|---|---|
| `portal-harness` | 8901 | `portal/public` | **The portal.** `http://localhost:8901/harness.html#/<realm>` |
| `repo-static` | 8900 | repo root | **The mockup package**, which the harness server cannot reach |

**The seven realm URLs, literally:** `http://localhost:8901/harness.html` + `#/home` · `#/season` · `#/armory` · `#/broadcast` · `#/access` · `#/analytics` · `#/review`. (`#/home` is the default route in `portal/ui/app.js`; the wordmark is a click target, not something you can type.)

**Harness flags:** `?today=YYYY-MM-DD` · `?realms=a,b` · `?owner=0` · `?empty=1` · `?fail=500|/api/x|offline|garbage|expired` · `?slow=4000` · `?destroy=1` · `?draft=1`. ⚠️ When re-verifying after an edit, navigate with a fresh query (`?b=$(date +%s)`) — the HTML itself can come from bfcache even with `no-store`.

**`__peers()` and `__grid()` are ALREADY LOADED on the harness page** (`portal/ui/harness/index.html` pulls `/harness/peers.js` and `/harness/grid.js`). Just call them in the console — no injection needed. ⚠️ The surface is `__grid()`, `.off()`, `.near()`, `.sizes()`, `.all()`. **There is no `.report()`** — that name appears in COMPANION and the tracker and has never existed in the code.

---

## §0.1 — THE INVENTORY, AND HOW RELIABLE EACH ROW IS

Assembled 2026-08-27 by cross-referencing the **twenty-three `local/handoff/*portal*.md` files** (the directory holds 78 in total), `COMPANION.md`, `docs/db-deferred-list.md` and `PORTAL-MAP.md` against each other and against source. **Tracked?** answers whether the item existed anywhere a repo search could find it before this plan.

> ✅ **STATUS AS OF 2026-08-27 EOD — read this before the table below, which is frozen at the plan's writing.** Closed this session: **G** (horizontal systems — his answer was KEEP AS-IS) · **A** (clock, all five gaps) · **B** (banners are thumbnails) · **C** (one control — header empty space closes it) · **D** (panel measured; it is fine) · **E** (per-realm composition, all three realms, blur test 6/6 distinct) · **H** (density plot — was ALREADY BUILT) · **I** (Home) · **K** (`.count-bump`/`.staged-pulse` built; `.lift`/`.tint` were ALREADY APPLIED by selector) · **N** (render gate in `npm test`) · **R** (Armory preview — rendered, and it was showing the same card for every build) · **S** (coverage number). **Still open: F** (glyph Artifact — he has never seen it) · **J** (account panel) · **L/M** (mobile — DEPRIORITISED, see §0.06) · **O** (first real boot) · **P** (production) · **Q** (analytics payload).
>
> ⚠️ **Four of the items above turned out ALREADY BUILT when checked on the page** (H, K's lift/tint half, S, and most of I). That is the failure mode this plan's own §0 exists to name — **open the page before building anything this table lists as open.**

| # | Item | Source | Tracked? | Status |
|---|---|---|---|---|
| **A** | Season clock — hierarchy critique (hero ~4× · quiet ticking · chips · left align · accent anchor) | compact-I §1 | ⚠️ partial | 🔴 critique never addressed; `.sclock` unmodified in both codebases |
| **B** | Banners as real thumbnails | compact-I §3 | ❌ **no** | 🔴 designed, not built |
| **C** | One persistent open/close control | compact-I §3 | ❌ **no** | 🔴 designed, not built |
| **D** | The expanded editor panel — alignment/spacing/structure | compact-I §3 | ❌ **no** | 🔴 untouched, never measured |
| **E** | Per-realm composition (Armory, Analytics; Review never looked at) | compact-I §3 | ✅ | 🔴 approved, unbuilt |
| **F** | Season-shape glyph as identity | compact-I §3 | ✅ | 🔴 never published as an Artifact; he has never seen it |
| **G** | Home vs realms horizontal systems (63px shift, 126px width) | compact-I §3 | ✅ | 🟡 filed, his call |
| **H** | Playlist concurrency density | compact-I §3 | ✅ | 🟡 he answered *"Idk"* — unresolved |
| **I** | Reorganise Home | session-G #11 | ❌ **no** | 🔴 critique + plan in COMPANION §5.9z.5 |
| **J** | Account panel — start from what it is FOR | session-G #12 | ❌ **no** | 🔴 critique in COMPANION §5.9z.6 |
| **K** | Four liveliness interactions (`.lift`/`.tint`/`.count-bump`/`.staged-pulse`) | checkpoint-VIII | ✅ | 🔴 rules exist, no markup emits them |
| **L** | Header pill breaks below 900px | this session | ❌ **no** | 🔴 confirmed live |
| **M** | compact-I §0's five "gates green while broken" defects | compact-I §0 | ❌ **no** | ⚪ **unknown** — icons confirmed fixed, other four unverified |
| **N** | Harness never opened by `npm test` | checkpoint-VIII | ✅ | 🔴 structural gap; caused the Armory outage to ship green |
| **O** | Nothing has run against Mongo or OAuth; `/api/review` executed in no environment | compact-V §3 | ✅ | 🔴 first real boot is unexercised ground |
| **P** | Prod unreachable — deploy, OAuth creds, systemd, Tunnel | launch checklist | ✅ | 🔴 4 items, none done |
| **Q** | `/api/analytics` returns 495KB per load | tracker | ✅ | 🟡 not a bug; a cost that grows |
| **R** | Armory LIVE PREVIEW panel never rendered against its fixture | tracker | ✅ | 🟡 half-proven |
| **S** | Coverage's 51%/"still open" line is 8 days stale | tracker | ✅ | ⚪ needs re-measure, not trust |

**Five of nineteen (B, C, D, I, J) existed only in gitignored files.** That is the index failure Phase 0 addresses; it is not safe to assume this table is complete either, which is why Task 0.1 re-derives it rather than trusting it.

---

## Phase 0 — GROUND TRUTH

*Nothing in Phases 1–4 is trustworthy until this phase runs. Both tasks produce documents, not code.*

### Task 0.1: The full visual sweep, at both widths, every realm

**Files:**
- Create: `local/handoff/2026-08-27-portal-visual-sweep.md` (gitignored — state the path when citing it)
- Modify: `docs/db-deferred-list.md` (file every defect found)

**Interfaces:**
- Consumes: nothing.
- Produces: a per-realm defect inventory that Phases 1–3 draw their real task list from. Every later phase may be re-scoped by what this finds.

- [ ] **Step 1: Build and serve the harness**

```bash
node -e "require('./scripts/buildPortal').build()"
lsof -nP -iTCP:8901 -sTCP:LISTEN   # confirm nothing is already bound
```
Then start the `portal-harness` launch config (`:8901`, rooted at `portal/public`). ⚠️ **Do not use `python3 -m http.server` directly** — the launch config sets no-cache headers the harness needs.

- [ ] **Step 2: Sweep every realm at 1280×880**

Open each of `#/season`, `#/armory`, `#/broadcast`, `#/access`, `#/analytics`, `#/review`, and Home (the wordmark). For each: screenshot, read the console for errors, and record every composition defect — misaligned peers, unequal columns, elements out of vertical step, anything that reads as broken.

⚠️ **Open the SUB-VIEWS explicitly** — a default view is a quarter of the surface. Season's Board and Repairs; Armory's Coverage, Compare and Bulk; Broadcast's Airtime; Analytics' Usage, Timing, Reach and Search. **compact-H §2E names the first five of those** (*"Season Board/Repairs, Armory Coverage/Compare/Bulk & export"*) as driven only programmatically by the audit harness, "which measures contrast and geometry and cannot see that something looks wrong"; the Broadcast and Analytics sub-views are added here by the same reasoning. **Armory's Compare is the highest-suspicion surface** — compact-I §0 measured its two "identical" columns at 447px and 567px.

- [ ] **Step 3: Sweep every realm again at 375×812**

```
resize_window preset mobile   # 375x812 — then reload so load-time gates re-run
```

⚠️ **Use 375, not 390.** The tool's `mobile` preset is 375×812 and the known `.hdr-commit` defect was measured at 375; a check at 390 may not reproduce the three-line wrap. Where this plan and older documents say "390×844", read 375×812. Item **L** (the header pill) is already confirmed here; the question is what else is. **A defect at one width is a defect.**

- [ ] **Step 4: Run the measurement instruments on each page**

`.peers.js` → `__peers()` reports peers the markup says are equivalent that do not match in size or share an edge — compact-I §2 calls this "the class that actually breaks pages." `__grid.all()` for the horizontal system. ⚠️ `__grid`'s first version enumerated a whitelist of page frames, never looked at size, and only ran on default views — **open sub-views explicitly before running it**.

- [ ] **Step 5: Resolve the four remaining unknowns from item M**

Check each of compact-I §0's named defects and record fixed/still-broken with evidence: Armory Compare's column widths · the two preview cards' 12px vertical step · the season record's six cells and their internal layouts · the 1px-clipped component (a class-name collision with `.sr`) · icons rendering as empty strings (**confirmed fixed** — real Lucide icons render in the rail).

- [ ] **Step 6: Write the sweep document and file every defect**

Write `local/handoff/2026-08-27-portal-visual-sweep.md` with one row per defect: realm · view · width · what is wrong · a measurement, not an adjective. Then file each into `docs/db-deferred-list.md` with a `[P · Effort · Model]` tag. 🔴 **`local/handoff/` is gitignored — a defect that lives only there is a defect nobody will find. That is exactly how items B, C, D, I and J were lost.**

- [ ] **Step 7: Commit**

```bash
npm test && git add docs/db-deferred-list.md && git commit -m "docs(portal): the visual sweep, and every defect it found"
```

### Task 0.2: Re-measure the migration's own coverage number

**Files:**
- Modify: `docs/db-deferred-list.md` (the 51%/"still open" line, item **S**)

**Interfaces:**
- Consumes: nothing.
- Produces: a current per-realm composition number, or an explicit statement that the instrument no longer exists.

- [ ] **Step 1: Establish whether the instrument still exists**

The 7–25% → 51% numbers came from an ad-hoc class-vocabulary comparison, **not** from `npm run portal:coverage` (which measures something else — class slots, currently 1493/1495). Search for it:

```bash
rg -l --hidden --no-ignore "class-vocabulary|mockup.*class.*emit" scripts/ docs/superpowers/
```

⚠️ **`--hidden --no-ignore` is required, not optional.** Every portal instrument in that tree is a dotfile (`.bust.mjs`, `.undeclared.mjs`, `.schema-gate.mjs`, `.roundtrip.mjs`) and a default `rg` cannot see any of them. ⚠️ **The expected outcome is that it does not exist** — `docs/db-deferred-list.md:471` already records "no such script was found under that name." Retiring the number is the likely answer, not the fallback.

- [ ] **Step 2: Re-run it, or state plainly that it is gone**

If it exists, run it and record the current per-realm numbers. If it does not, **say so in the tracker entry** rather than leaving an eight-day-old number reading as current. ⚠️ Already known to be stale in at least two places: Season's `Zoomer` and `Repairs` view are listed as missing and both are real wired components (`portal/ui/season.js:19,900-901,922`).

- [ ] **Step 3: Commit**

```bash
npm test && git add docs/db-deferred-list.md && git commit -m "docs(portal): re-measure composition coverage, or retire the number"
```

---

## Phase 1 — THE PAUSED DESIGN ITEMS

*Items A–J. All ten were paused for the Preact migration on 2026-08-25 ~22:5x and never resumed. **Every one is HITL.** The failure mode here is producing options instead of asking questions — thirteen rejected attempts vs four pop-ups.*

🔴 **DO NOT EXECUTE THIS PHASE IN ORDER, AND DO NOT BLOCK ON IT.** Five of its six tasks stop on a question only Harkirat can answer. A session that works top-to-bottom stalls at Task 1.1 Step 2 with three-quarters of the executable work untouched behind it. **Instead:**

1. **Batch every Phase-1 fork into ONE round of `AskUserQuestion` pop-ups at the start of the session** — the clock's hierarchy (1.1), the glyph (1.3), per-realm composition (1.4), Home and the account panel (1.5), and G and H (1.6). Attach the renders.
2. **Then work Phases 2 and 3 while those are outstanding.** Neither has any dependency on Phase 1, and every task in them is machine-verifiable.
3. **Come back to Phase 1 as answers arrive.**

⚠️ **One real cross-phase dependency, in the other direction:** Task 2.2's verify condition needs all six realms to render, which is what Task **3.1**'s gate proves. Do 3.1 before 2.2.

🔴 **Before starting ANY task in this phase, read `local/handoff/2026-08-25-portal-compact-I.md` §4 and §5 in full** (gitignored). They carry the thirteen rejected attempts, what each taught, and the standing design rules. A session that has not read them will re-propose something already killed.

### Task 1.1: Close the season clock's hierarchy critique (item A)

**Files:**
- Modify: `portal/ui/app.css` (the `.sclock` block, ~line 4438)
- Modify: `portal/ui/season.js` (`SeasonClock`, ~line 205) only if the markup blocks the hierarchy
- Modify: `docs/superpowers/mockups/2026-08-23-portal-interactive/COMPANION.md` §16.31a

**Interfaces:**
- Consumes: nothing.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Read the critique and the settled rules together**

COMPANION §16.31 (the four settled questions and the five-tier table — **keep all of it**) and §16.31a (the five hierarchy gaps — **close all of it**).

⚠️ **Do NOT re-target "the Burndown."** It was attempt **12**; attempt 13 superseded it deliberately. A correction on 2026-08-27 that re-aimed this at the Burndown was itself wrong. The target is **attempt 13's content rules kept, the five gaps closed.**

- [ ] **Step 2: Ask Harkirat, with the render attached**

The critique names *what* is wrong (four near-equal segments; seconds competing; run-on lines; right alignment; no anchor). It does not fully specify the replacement. Screenshot the current clock at both widths, state the five gaps, and ask as an `AskUserQuestion` pop-up. 🔴 **This is a design fork. Do not resolve it by producing four options.**

- [ ] **Step 3: Implement what he chooses**

The five tiers are `data-tier`-driven from CSS. Hero scaling that is *always on* rather than tier-gated changes `.sc-u b` and the `closing`/`final`/`today` multipliers — **check the dangling-separator rule still holds** (`> :nth-last-child(2)` hides the separator before the last child; `:last-of-type` matches by tag and silently does nothing).

- [ ] **Step 4: Verify on the rendered page at both widths**

🔴 **`?today=` DOES NOT TRAVEL THIS CLOCK — measured 2026-08-27, and this paragraph asserted otherwise.** `countdownParts(next.iso, Date.now())` reads the real clock, so date-travel changes which *moment* is selected and never the countdown or the tier. **Set `data-tier` on `.sclock` directly and read the computed styles back**, which is how all five tiers were actually verified. The fixture's next wall is `bpEnd`/`rankEnd` = 2026-09-10 (`portal/public/harness/fixtures.js`); the URLs below still select the right MOMENT and are kept for that. The five literal URLs, on `http://localhost:8901/harness.html`:

| Tier | Days out | URL suffix |
|---|---|---|
| `open` | 40 | `?today=2026-08-01#/season` |
| `running` | 16 | `?today=2026-08-25#/season` |
| `closing` | 5 | `?today=2026-09-05#/season` |
| `final` | 1 | `?today=2026-09-09#/season` |
| `today` | 0 | `?today=2026-09-10#/season` |

The boundaries are `seasonTier()` in `portal/ui/season.logic.js:261`. **A tier that never renders cannot be checked.**

- [ ] **Step 5: Update COMPANION and commit**

Record what shipped in §16.31a. It is the maintained record; a divergence it does not carry is a defect in it.

```bash
npm run portal:bust && npm test && git add -A && git commit -m "feat(portal): the season clock's hierarchy, two days after it was critiqued"
```

### Task 1.2: The season record region — items B, C and D together

**Files:**
- Modify: `portal/ui/season.js` (the season record / identity strip)
- Modify: `portal/ui/app.css` (`.srec-*` and the record's rules)
- Modify: `docs/superpowers/mockups/2026-08-23-portal-interactive/COMPANION.md` §16.32

**Interfaces:**
- Consumes: nothing.
- Produces: nothing other tasks depend on.

*These three are one region and one sitting. Splitting them means measuring the same panel three times.*

- [ ] **Step 1: MEASURE the expanded editor panel before looking at it (item D)**

⚠️ compact-I's own confession: *"I called it 'fine' three times and never measured it once."* Run `__peers()` and `__grid.all()` against the **open** panel. Record numbers before forming an opinion.

- [ ] **Step 2: Build banners as real thumbnails (item B)**

The record's banner URLs currently render as a grey dot plus a fake gradient. Real thumbnails kill both **and** distinguish a banner from a deadline by KIND — that is the design argument, not the aesthetics. The URLs are live in the fixture (`res.cloudinary.com` and `media.discordapp.net`).

- [ ] **Step 3: Unify the open/close control (item C)**

Today the collapsed strip is click-anywhere and the open panel is one small button. Target: **same position, click-anywhere, both states.** ⚠️ **Disclosure marks MORPH, never rotate** — a rotating chevron is a standing rejection.

- [ ] **Step 4: Fix what Step 1 measured**

- [ ] **Step 5: Verify at both widths, update COMPANION §16.32, commit**

```bash
npm run portal:bust && npm test && git add -A && git commit -m "feat(portal): the season record — real thumbnails, one control, and a panel that was never measured"
```

### Task 1.3: Publish the season glyph as an Artifact (item F)

**Files:**
- Read: `docs/superpowers/mockups/2026-08-23-portal-interactive/index.html` (the variants live in its `.proto-glyph.js`)
- Create: an Artifact (publish; do not leave on localhost)

**Interfaces:**
- Consumes: nothing.
- Produces: a decision from Harkirat. Nothing else depends on it.

- [ ] **Step 1: Recover the three variants and publish them**

⚠️ **TWO `index.html` FILES EXIST AND THE OBVIOUS ONE IS WRONG.** The glyph variants are in the **mockup package's** copy, which the `portal-harness` server (rooted at `portal/public`) **cannot serve**. Start the **`repo-static`** config instead and open:

```
http://localhost:8900/docs/superpowers/mockups/2026-08-23-portal-interactive/index.html?glyph=A
```
…then `?glyph=B` and `?glyph=C`.

🔴 **Nothing on localhost is a deliverable** — *"what do u mean waiting on me? you haven't given me anything."* It reaches him as an Artifact or it does not exist.

- [ ] **Step 2: Frame it correctly, or it is a regression**

🔴 **NOT as information** — that reading was killed (*"so useless and tells me nothing"*). As **identity**, at three scales: the Home masthead mark, the favicon, and each Season Record row. It does real work at the third — the Record shows two near-identical rows distinguished only by a date.

- [ ] **Step 3: Ask, and record his answer**

He has never seen it. **"Try the glyph" was permission to explore, not approval.** Verify condition: two different seasons must produce visibly different glyphs, or it is a logo pretending to be data.

### Task 1.4: Per-realm composition — Armory, Analytics, Review (item E)

**Files:**
- Modify: `portal/ui/armory.js`, `portal/ui/analytics.js`, `portal/ui/review.js`

- [ ] **Step 1: Confirm the scope is still what the tracker says**

⚠️ Narrower than "all six": **Season** (the Track), **Access** (the matrix) and **Broadcast** (queue + player preview) already have distinct compositions. The gaps are **Armory** (its tier board is a *panel on the page* rather than *the page*) and **Analytics** (a generic dashboard: four tiles above two panels). **Review has never been looked at at all.** Re-check against Phase 0's sweep before building.

- [ ] **Step 2: Ask before composing**

This is the item PORTAL-MAP listed as blocked behind the clock's design vocabulary. That blocker is cleared, but the composition itself is a design fork.

- [ ] **Step 3: Verify by the item's own test**

**Blur the text on any two realms; if they are the same image, it is not done.**

### Task 1.5: Home and the account panel (items I and J)

**Files:**
- Modify: `portal/ui/home.js`, `portal/ui/shell.js` (the account panel)
- Read: COMPANION §5.9z.5 (Home) and §5.9z.6 (the account panel)

- [ ] **Step 1: Read both COMPANION sections first**

*"Do not start without reading it"* — §5.9z.5 carries five ranked reasons and a three-question structure for Home. §5.9z.6 was **rewritten** after Harkirat called out a version that listed tidy fixes instead of design decisions.

- [ ] **Step 2: Home — start from his complaint**

*"its all over the place… i feel like i'd never utilize it."*

- [ ] **Step 3: The account panel — start from what it is FOR**

The real findings: the panel's **header duplicates the button that opens it** (a third of the panel) · **nothing in the portal tells you what permissions YOU hold**, and this is the only place that could · the header spends permanent space on the rarest act (sign out) and none on the most frequent (commit) · it is **five-sixths label** · `Session · 12 hours` states the policy, not a fact about you · the presence dot is decoration wearing status — **but keep the banner**, it is the one personal thing in the portal.

- [ ] **Step 4: Ask, build what he chooses, verify at both widths, commit**

### Task 1.6: Resolve items G and H

- [ ] **Step 1: Item G — Home vs realms horizontal systems**

Home's content column is `86 → 1118` (1032 wide, centred `max-width:1080`); every realm's is `23 → 1181` (1158 wide). Navigating shifts content **63px left and 126px wider**, every time. ⚠️ **This is a decision, not a defect.** Three real options: keep it · realms adopt Home's measure (calmer, costs the Track 126px) · Home adopts the realms' (one system, Home gets wider than it wants). Verify with `__grid.all()`, not by eye.

- [ ] **Step 2: Item H — playlist concurrency density**

He answered *"Idk"*, which is unresolved, not no. The Track's Playlists strip is 14 bare 1px ticks and an asserted *"7 at peak"*. ⚠️ **Not a restyle** — ticks are one-per-item; density plots concurrency per day, a quantity nothing currently derives. §5.9c.8's rule holds: **concurrency is not a defect** — it describes the season's shape, it does not flag it.

- [ ] **Step 3: Record the decision, and commit if anything changed**

```bash
npm run portal:bust && npm test && git add -A && git commit -m "feat(portal): resolve the horizontal-system and concurrency-density questions"
```
⚠️ **`portal:bust` is required** if a `portal/ui/` module changed — the browser will otherwise serve the old `?v=`. **Read `npm test`'s exit code**, never pipe it to `tail`. If both resolved to "keep it", commit the recorded decision to `docs/db-deferred-list.md` instead.

---

## Phase 2 — VISUAL AND LIVELINESS DEFECTS

### Task 2.1: The header pill below 900px (item L)

**Files:**
- Modify: `portal/ui/app.css` (`.hdr-commit`, ~line 4181)

- [ ] **Step 1: Reproduce**

At 375px the pill's text wraps to three lines and its pill-radius renders it as a circular blob overlapping the wordmark; on realms other than Season it collapses to an empty box.

- [ ] **Step 2: Fix, probably by hiding it**

`.hdr-commit` has **no responsive handling at all** — no media query in the sheet touches it. The bottom tab bar already carries a Review badge with the same staged count, so the pill is likely redundant below the breakpoint. The sheet's established breakpoint is `@media (max-width:900px)`.

- [ ] **Step 3: Verify the staged count is still reachable at mobile width, and commit**

⚠️ If you hide it, confirm the tab-bar badge actually renders the count — otherwise the information is gone, not relocated.

### Task 2.2: The four liveliness interactions (item K)

**Files:**
- Modify: `portal/ui/shell.js` (a `pulseTray` equivalent), plus the realms that stage

- [ ] **Step 1: Understand why this is one task and not four**

`.lift` and `.tint` are hover/focus classes you put on markup (`app.css:3912`, `:3899`). `.count-bump` (`:1791`) and `.staged-pulse` (`:1790`) are applied by the mockup's `Shell.pulseTray()` via `classList.add`. 🔴 **`pulseTray` is the interesting half** — every staging path funnels through one place so the acknowledgement is written once. **The portal stages from six realms and has no equivalent; the only acknowledgement is a toast.**

- [ ] **Step 2: Build the funnel, then the four classes**

**The reference implementation is `docs/superpowers/mockups/2026-08-23-portal-interactive/assets/shell.js:1572`** (`pulseTray`). Port it into `portal/ui/shell.js` and route every staging path through it. **The six modules that stage** — these are the call sites to convert: `portal/ui/season.js` · `portal/ui/armory.js` · `portal/ui/broadcast.js` · `portal/ui/composer.js` · `portal/ui/composeClient.js` · `portal/ui/oneway.js`. Then apply `.lift` and `.tint` to the hover/focus targets they render.

- [ ] **Step 3: Verify by staging in each realm and watching**

**Verify condition: stage something in each realm and see the rail badge bump and the tray pulse; hover a card and see it lift.** ⚠️ **Not "the classes appear in source"** — that is what already reads as done. `portalCoverage` deliberately does not read `classList.toggle`, so this will not move the number.

### Task 2.3: The Armory live preview panel (item R)

- [ ] **Step 1: Open `:8901/harness.html#/armory`, scroll to the Manifest, click a row**

- [ ] **Step 2: Confirm the panel renders the card**

**Verify:** `document.querySelectorAll('.v2-card').length` is non-zero with the panel open. ⚠️ Worth doing precisely because a `null` card previously rendered as nothing and looked identical to a panel that simply had no selection.

---

## Phase 3 — STRUCTURAL GATES

### Task 3.1: Wire the harness into `npm test` (item N)

**Files:**
- Create: `scripts/portalHarnessRender.test.js`
- Modify: `package.json` (the `test` script)

**Interfaces:**
- Produces: a gate that **executes** components rather than scanning source.

- [ ] **Step 1: Understand what this must catch, and what it must not be**

⚠️ **`scripts/portalHarness.test.js` ALREADY EXISTS and is already in `npm test` — this task is not it.** That file executes the harness **stub** and validates payload shape; it renders no component. This task adds the **render** gate, hence a separate file. A reader who greps and finds the existing file will otherwise conclude the work is done.

🔴 **Do not close this with another source scan.** Two proofs it is needed: the double-CP window read `data.calendar` (a key that does not exist) and rendered nothing forever while every gate stayed green; and **the entire Armory realm threw on every load for a day** while `coverage`/`orphans`/`refs` all read it as fine.

- [ ] **Step 2: Write a failing test that renders each realm and asserts no throw**

Model it on `scripts/portalRender.test.js`, which already renders the real `Track` against a fixture. The shape that works: render the realm component against the harness fixture, assert the tree is non-empty and no error was thrown.

- [ ] **Step 3: Prove it can fail**

Reinstate the Armory `data` bug (`load.data` → `data`), run the test, watch it fail, revert. **A gate that has never failed is not known to work.**

- [ ] **Step 4: Wire into `npm test` and commit**

### Task 3.2: First real boot — Mongo and OAuth (item O)

- [ ] **Step 1: Boot against local dev Mongo**

```bash
node --env-file=.env.dev portal/server.js
```

🔴 **DO NOT run `npm run portal`** — it is a bare `node portal/server.js`, and `portal/server.js:6` calls `dotenv.config()`, which loads **prod's `.env`**. The `--env-file` flag is what makes this safe, because Node applies it before `dotenv` runs and dotenv does not override what is already set. `portal/server.js:17-23` refuses to start on a mismatched `NODE_ENV`/URI pair — that is a safety net, not the mechanism. 🔴 **Never prod's token or URI.** ⚠️ **Read `.env.dev`'s Mongo URI from the FILE, never `process.env`** — requiring `portal/server.js` loads prod's `.env` first and dotenv does not override. `scripts/portalRoutes.test.js` does this and explains why.

- [ ] **Step 2: Check the three zero-contact surfaces, in this order**

1. `/api/review` returns 200 with `ops` and `changesets` — **it has executed in no environment, ever.**
2. A staged changeset gets a `baseline` array (`models/Changeset.js`). Existing rows have `null` and correctly report `staleChecked:false` forever — that is honest, not a bug; it ages out.
3. The Season identity editor's Done button stages `season.setTitlesDeadlines` **and** `calendar.setBanners` as two ops.

- [ ] **Step 3: Also exercise what only real data reaches**

`/api/season/export`, `/api/parse-bulk/loadout`, and the patch-note ops.

### Task 3.3: The Analytics payload (item Q)

- [ ] **Step 1: Measure it**

With the server booted per Task 3.2:

```bash
curl -s -b "$COOKIE" http://localhost:8787/api/analytics | wc -c
```
(or read the transfer column in DevTools on a cold Analytics load). Record the number before changing anything.

- [ ] **Step 2: Move the three text exports behind their own route**

**Do this one, not the pagination alternative** — the river feeds the Manifest so it has to arrive whole, while the pre-rendered `usage`/`timing`/`alerts` text exports are only ever read when their own tab is open. Add a route that returns one export by name, fetched on tab open.

**Verify:** a cold Analytics load transfers under 100KB, and the Usage and Timing tabs still render their text.

---

## Phase 4 — PRODUCTION

### Task 4.1: Make the portal reachable (item P)

**Files:**
- Read: `docs/reference/portal-launch-checklist.md`

- [ ] **Step 1: Deploy to the VM**
- [ ] **Step 2: Register real prod OAuth credentials** — 🔴 **Harkirat's own step. Claude does not handle the credential.**
- [ ] **Step 3: First-time install of `dioreo-portal.service` and `cloudflared.service`**
- [ ] **Step 4: Confirm the Tunnel routes `portal.dioreo.app`**

🔴 **Read `docs/reference/portal-launch-checklist.md` in full first — it opens with a blocking banner naming what must be true before this checklist is worked at all.** Confirm that condition is met before Step 1, and say so.

**The actual systemd/`journalctl`/Tunnel commands are NOT in the checklist** — they are in `docs/reference/deployment-and-ops.md`'s "Web admin portal" section. This task is four verbs; that file is the procedure.

⚠️ **A merge does not deploy.** Say plainly which steps happened; never let "merged" imply "live."

---

## §5 — THINGS THAT WOULD BE WRONG TO "FIX"

| | Why |
|---|---|
| **`addrow` unbuilt** | Season replaced the mockup's inline add row with the composer above the Track. Restoring it is a second way to add the same things, with a different vocabulary and no natural-language dates |
| **`fxc` unbuilt** | A per-row opt-out in Armory's bulk diff would map a rendered row back to raw text, and that parser is the bot's `utils/adminParser.js`, never reimplemented in a browser. The textarea beside it is the exact opt-out |
| **`findOverlaps` has no caller** | Settled by Harkirat — a scheduling conflict is **the same thing entered twice**, not two items sharing days (61 findings) or two playlists at once (47; CODM runs seven concurrently). Wiring it up would undo his decision |
| **`portalCoverage` skips `classList.toggle`** | Identity (`.className =`) is read; transient state is not. Deliberate, and the header explains it |
| **`.winbox` is not a misnamed `.win`** | Tried, measured, reverted |
| **`zero`/`stg-clear` absent** | The portal deliberately reversed that rule: a chip is ABSENT at zero rather than dimmed |
| **`OutcomeSplit` inside the Usage panel** | His call — *"keep but move it"* — after it was twice proposed for cutting |
| **`public/` lagging the changelog** | Correct by design. Do not rebuild the site for a changelog edit |
| **The branch's size** | His decision, stated repeatedly. Not a finding |
| **The SelectionBar/one-way asymmetry in coverage** | Do not "fix" it by adding them to `SHARED_UI` — that inflates exactly the two realms the correction exists to measure honestly |

---

## Audit log

*Falsification pass run 2026-08-27 11:16 EDT via `mcp__sequential-thinking`, framed as "where is this plan wrong?" rather than "review this plan." The pass ran against the inventory before the plan was written, which is why several findings are corrections to the inventory itself rather than to task text.*

| Finding | Severity | Where fixed |
|---|---|---|
| The plan was about to inherit a **wrong "CLOSED" verdict** on the season clock, asserted from a commit message plus a COMPANION section that agree only because they ship in the same commit | 🔴 **critical** — would have dropped a real design item from the plan entirely | §0, §0.1 item A, Task 1.1 |
| A first correction re-aimed the clock at **"the Burndown"** — also wrong; the Burndown was attempt 12, superseded by attempt 13, which was then critiqued | 🔴 high — would have rebuilt a rejected design | Task 1.1 Step 1's explicit warning |
| The inventory was assembled from **compact-I only**, treating one handoff as the boundary | 🟡 medium — Harkirat called this out directly | Swept session-G, compact-H, III–VII; found items I and J |
| **Five items (B, C, D, I, J) exist in no tracked file** | 🔴 high — invisible to every search and gate | Filed in `docs/db-deferred-list.md`; §0.1 marks the Tracked? column |
| COMPANION §16.31 is pointed at by compact-I for "the full critique" and **contained none** | 🔴 high — it certified a disowned design for two days | §16.31a written |
| The tracker's **51% coverage line is 8 days stale** and names two components as missing that exist | 🟡 medium | Item S; Task 0.2 |
| Item M's five defects were about to be listed as **"fixed"** on the reasoning that later handoffs stop mentioning them | 🟡 medium — absence from a summary is not resolution | Marked ⚪ **unknown**; Task 0.1 Step 5 resolves them |

**Cleared, not fixed** — checked and found to be non-issues:
- **Is the live clock really attempt 13, or something later?** `git log -S".sclock"` returns one commit for the mockup's `assets/app.css` and one for `portal/ui/app.css`, and the blocks are byte-identical. It is attempt 13, unmodified.
- **Could the critique have been addressed without touching `.sclock`?** `SeasonClock`'s JSX emits `.sc-u b` identically for every unit with `.sec` as the only modifier, and §16.31's tier table matches the CSS. A hierarchy fix would have had to change one of those two; neither changed.
- **Are B/C/D tracked under different wording?** Loose greps (`thumbnail`, `collapsed strip|open/close|disclosure|srec`, `identity editor|expanded panel`) return nothing matching. Safe to file without duplicating.
- **Icons rendering as empty strings** (one of item M's five) — confirmed fixed; real Lucide icons render in the rail.

**Alternatives re-examined and still rejected:**
- **Fixing the clock first, before Phase 0.** Rejected: the index that would tell you what else to fix is the thing proven unreliable. One component fixed against a broken map is a second visit to the same page.
- **Doing the visual sweep as part of each realm's design task.** Rejected: the sweep's value is that it is *systematic and comparative* — defects like "these two peers disagree" and "Home sits on a different measure" are only visible across realms, not within one.
- **Closing item N with a better source scanner.** Rejected explicitly and recorded in the task: four scanner blind spots were closed in one session and the Armory outage was invisible to all four by construction.

**Assumptions converted to measurements:**
- "The critique was probably never addressed" → `git log -S".sclock"` on both files, plus a byte diff of the block.
- "B/C/D are probably untracked" → three loose greps rather than three exact ones.
- "The header pill is probably a missing media query" → `rg -n "hdr-commit" portal/ui/app.css` returns three rules, none responsive, and no media query in the sheet touches it.
- "COMPANION §16.31 is stale" → compared its commit timestamp (21:10) against compact-I's (22:11).

### Reader test — `anthropic-skills:doc-coauthoring`, run 2026-08-27 11:24 EDT

*Dispatched at Harkirat's explicit instruction, against the question "can a fresh session actually FOLLOW this?" rather than "is it good?". It verified every pointer against the filesystem. **Most checked out** — all six COMPANION sections, all six `app.css` line numbers, `season.js:19`, `pulseTray` at `assets/shell.js:1572`, the launch checklist's four items, and the claim that no media query touches `.hdr-commit`. The failures below are what it found, and four were blockers.*

| Finding | Severity | Fixed |
|---|---|---|
| **`__grid.report()` does not exist** — the surface is `__grid()`/`.off()`/`.near()`/`.sizes()`/`.all()`. The plan told the reader to call it in **three** places; it would `TypeError` every time. 🔴 **This is §0's own lesson happening inside the plan: a name two documents agreed on because one copied the other, and nobody ran it.** COMPANION and `db-deferred-list.md` carry the same wrong name | **blocker** | All three → `__grid.all()`; §0.05 states the real surface; source copies corrected |
| **`index.html?glyph=A\|B\|C` had no path, and the guessable one is wrong** — two `index.html` exist, the variants are in the mockup package's, and the `portal-harness` server (rooted at `portal/public`) **cannot serve it** | **blocker** | Task 1.3 now names the file and the `repo-static` server on :8900 |
| **The riskiest step in the plan had no command.** Task 3.2 said "`node portal/server.js` with `.env.dev`" — but `server.js:6` runs `dotenv.config()`, which loads **prod's `.env`**, and `npm run portal` is exactly that bare command | **blocker** | `node --env-file=.env.dev portal/server.js`, with why the flag is what makes it safe |
| **Four of five gitignored sources cited by nickname with no path**, while the plan itself states the rule that they must carry paths. `PORTAL-MAP.md` is in `local/handoff/`, which nobody would guess | **blocker** | §0.05 source-key table |
| **The sweep never gave the URL it sweeps.** The base appeared once, 240 lines later, and "Home (the wordmark)" is a click target, not a route | major | §0.05 lists all seven literally; `#/home` named |
| "all twelve `local/handoff/*.md`" — the directory holds **78**; the set was unresolvable | major | "the twenty-three `*portal*` files" |
| **Phase 1 cannot be executed alone and the plan didn't say so** — five of six tasks halt on a pop-up, and the header tells the reader to run it task-by-task with a subagent | major | Phase-1 preamble: batch the forks, work Phases 2–3 meanwhile |
| **Tasks 1.3–1.6 had no commit step**, and 1.4/1.5 modify `portal/ui/*.js` without mentioning `portal:bust` — both violating the plan's own Global Constraints | major | All four now carry the same closing block; 1.4/1.5/1.6 gained Files/Interfaces headers |
| Task 2.2 Step 2 was a heading, not a step — no reference implementation, no call sites | major | Cites `assets/shell.js:1572` and names the six staging modules |
| **Task 3.1 collides with the existing `scripts/portalHarness.test.js`**, already in `npm test`. A reader who greps concludes it is done | major | One sentence distinguishing stub-shape from render |
| Task 3.3 had no measurement method and offered two designs without picking one | major | `curl \| wc -c`, and the route-split chosen |
| Task 1.1 Step 4 said "travel the clock" without the dates | major | Five literal `?today=` URLs, derived from the fixture's `bpEnd` |
| Task 0.2's search omitted `--hidden`, and **every portal instrument in that tree is a dotfile** | major | Flags added; expected outcome reframed |
| Three viewport widths in play (1280/390/375) treated as one | minor | 375×812 everywhere, with a note that older docs say 390 |
| "Resolve the five unknowns" resolved four — the fifth is marked confirmed-fixed in the same sentence | minor | "four remaining" |
| The instruments are already loaded on the harness page; the plan implied manual injection | minor | §0.05 |
| compact-H §2E cited for nine sub-views; it names five | minor | Citation split from the added ones |
| Task 4.1 dropped the checklist's blocking banner and its pointer to the real commands | minor | Both restored |

**The reader test's verdict on the pre-fix draft:** *"a competent stranger gets roughly to Task 0.1 Step 4 before the first hard stop."* Every blocker and major above is fixed; the minors are fixed too.

⚠️ **The largest residual risk in this plan is that §0.1 is still not complete.** It was assembled by the same method that has now failed twice — reading records rather than measuring. Task 0.1 exists to replace it with observation, and **its output should be treated as authoritative over this table wherever the two disagree.**
