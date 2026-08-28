---
kind: plan
status: live
---

# PLAN — THE PORTAL CONFORMANCE PASS (written 2026-08-27 21:0x EDT)

**Bring the live portal up to the approved design, one surface at a time, finishing each before starting the next.** Harkirat's bar: *"By the end of your session, I should not be able to see a difference between the mockup's season realm vs the live portal's season realm (except for the obvious requested redesigns)."*

> ⚠️ **`status: live`, deliberately — every other plan in this folder is `frozen`.** He asked for a plan that never silently goes out of sync: *"i just want it to at least mark off things that were done, or update the plan/spec if anything changes midway."* A frozen plan cannot do that.
>
> **Supersedes `docs/superpowers/plans/2026-08-27-portal-completion.md`**, whose A–S inventory is folded into §A here — **re-verified against source and the running page, not copied.** Its status column claimed `[data-bare]` fixed on the same day the search bar was measurably doubled.

---

## §L — THE LIVE LEDGER

🔴 **THE ONE RULE THAT KEEPS THIS DOCUMENT TRUE: update this table in the SAME COMMIT that closes a unit.** Not afterwards, not in a handoff. A row whose status is wrong is worse than no row, because the next session trusts it — which is exactly how the doubled search bar came to be recorded as fixed while it was on screen.

⚠️ **If a finding CONTRADICTS this plan, edit the plan in that same commit.** A session that works around a wrong instruction and leaves it standing hands the next session the same wrong instruction plus a workaround it cannot see.

⚠️ **Commits are per coherent fix; a Part's ledger row closes ONCE, at the end.** A Part is continuous — it is not a single commit. Season alone is several sessions, and one commit spanning that is unreviewable and guarantees any stop lands on a dirty tree.

| # | Unit | Status | Closed by | Note |
|---|---|---|---|---|
| **0** | Reverse-orphan sweep, scripted and in `npm test` | ☐ open | | must report `data-bare`, `--ci`, `t-best` on its first run or it is not trusted |
| **0** | Mockup-side grid injection, written down once | ☐ open | | `.grid.js` is a file the mockup pages never load |
| **0** | The viewport contract, 1282×888 | ☐ open | | |
| **0** | The states harness (page + driver, catalogue grows per realm) | ☐ open | | |
| **0** | Per-realm geometry fixtures — the format and the runner | ☐ open | | |
| **0** | **THE SHELL** — rail · command bar · masthead frame · account panel · tray · toast · overlay · export strip · manifest frame · `async.js`'s six states · tooltip runtime | ☐ open | | includes the doubled search bar |
| **0** | **The door / login page** | ☐ open | | needs the real server; outside the harness entirely |
| **1** | **SEASON** | ☐ open | | |
| **2** | **ARMORY** | ☐ open | | |
| **3** | **BROADCAST** | ☐ open | | |
| **4** | **ACCESS** | ☐ open | | |
| **5** | **ANALYTICS** | ☐ open | | |
| **6a** | **REVIEW** | ☐ open | | failure mode: correctness |
| **6b** | **HOME** | ☐ open | | failure mode: composition. Target is COMPANION, **not** the mockup |
| **7** | The sweep, the misc, and the double-check | ☐ open | | |
| **—** | Closing DEVLOG narrative entry | ☐ open | | one story, after all the rest |

**Status vocabulary, so a tick means one thing:** ☐ open · ◐ in flight *(name the sub-state in Note)* · ☑ closed *(gates green · committed · changelog paragraph written · A/B artifact published)* · ⊘ dropped *(with the reason, never silently)*.

---

## §0 — THE ONE THING THAT EXPLAINS THE REST

🔴 **THE MIGRATION CARRIED THE STYLESHEET AND DROPPED THE MARKUP THAT ACTIVATES IT.** Harkirat, 2026-08-27: *"idk what you were using as reference during the migration but you did not stay true to the mockup design and somehow broke the same things we had already fixed."* That sentence is literally true, and it has a mechanism — which means it has a systematic remedy rather than a bug list.

| Fix | CSS present? | The markup that triggers it | What the reader saw |
|---|---|---|---|
| `[data-bare]` — the search-bar opt-out | ✅ `app.css:59` | ❌ **no `portal/ui/*.js` emits it** | **measured: a 44px `.cb-in` inside a 34px `.cmdbar`, each painting its own background and border.** COMPANION §5.9n.4's doubled search bar, verbatim |
| `--xtop` — the crosshair offset | ✅ read by `.xhair::before` and `.xd` | ❌ set by nothing | the hard-coded `60px` fallback, forever |
| `.dflag.flip` — the edge flip | ✅ rule exists | ❌ scoped `.dend .dflag.flip` (the overlay LINE, not the rail) **and** no writer | a merged chip running past the plot edge into `overflow-x:clip` |
| `t-best` `t-top4` `t-top5` `t-unranked` | ✅ rules exist | ❌ nothing in `armory.js` emits them | Armory's tier board may be styling tiers it never applies |
| `hcard` `hgrid` `hmast` `hseason` | ✅ rules exist | ❌ nothing in `home.js` emits them | Home's card system, styled and unused |

**Why no gate sees this class.** CSS is declarative and inert; a rule with no matching element is silent forever. `portal:orphans` asks *"does this class have a rule?"* · `portal:coverage` counts emitted classes · `npm test` renders components and asserts their output. **Not one asks the inverse — does this rule have an element?** That inverse is Part 0's first deliverable.

⚠️ **This is "ADD looking", not "stop measuring".** compact-I §0 proved five times in one session that every gate passes while the portal looks wrong. **A green suite means "none of my prior worries occurred". It never means "this is good."**

---

## §0.1 — PRECEDENCE: which artifact is "the design"

**COMPANION arbitrates · the mockup HTML is the default · `portal/ui` wins only where a COMPANION section or a dated decision postdates the mockup.**

⛔ **"The portal is ahead here" is a CLAIM REQUIRING A CITATION** — a section number or a dated decision. Absent one, the mockup wins. Without this clause every difference becomes arguable and the pass degenerates into taste.

**The worked example:** the season clock has **13 `.sclock` rules** in `app.css` against **one** mention in `season.html`, explained by COMPANION §16.31. It is portal-ahead, and "restoring the mockup's clock" would delete thirteen attempts of approved design. `exclusive` vs the mockup's `overlapMatters` is the same shape (settled 2026-08-26, after the mockup).

**Both failure directions have already happened** and root `CLAUDE.md`'s mockup row records them: wiring the mockup blindly rolled back working design once, and reading "the mockup is a sketchpad" as licence cost Armory a keyboard shortcut.

---

## §0.2 — THE THREE ARTIFACTS EVERY PART IS MEASURED AGAINST

🔴 **The draft of this plan compared two FIXTURE renderings and called that conformance.** The harness stubs `fetchJson`; the mockup is fixture-driven by construction. Meanwhile item **O** records that `/api/review` *"has executed in no environment, ever"*. **A realm can pass every check here and be broken live.**

| | What it is | What only it can show |
|---|---|---|
| **The mockup** | `:8900`, fixture-driven | the approved composition |
| **The harness** | `:8901/harness.html`, `fetchJson` stubbed | fast iteration, `?fail=` `?slow=` `?empty=` `?today=` `?owner=0` flags, every state on demand |
| 🔴 **The real portal** | `node --env-file=.env.dev portal/server.js`, real Mongo, real OAuth | real data volumes, the door, genuine empty and error states, the 401/409 paths, and whether any of this actually works |

**Every Part runs all three.** The OAuth sign-in is Harkirat's one-time step and it unblocks all of them — until it happens, each Part's real-server pass is recorded as **owed**, never as passed.

⚠️ **Never `npm run portal`** — it is a bare `node portal/server.js`, and `portal/server.js:6` calls `dotenv.config()`, loading **prod's `.env`**. The `--env-file` flag is what makes it safe. **Read `.env.dev`'s Mongo URI from the FILE, never `process.env`.** A portal process already listening on **:8787** means it is running, not broken.

---

## §0.3 — THE VIEWPORT CONTRACT

**1282 × 888.** His window is 1282 × 920 with 32px of browser chrome, so **888 is the content height**. Every `__grid` run, screenshot and measurement: `resize_page({width: 1282, height: 888})`.

**Desktop is the priority. Mobile is deferred** — not ignored, but it never wins a conflict and is not required to be tested. Items **L** and **M**'s mobile half stay open and unworked.

**Light mode: there is none, and that is now a DECISION rather than an omission.** Measured 2026-08-27: `prefers-color-scheme` and `data-theme` appear zero times in `tokens.css` and `app.css`. Harkirat: **dark-only is deliberate.** The tracker's *"light mode never checked at desktop width"* row is retired in the same change as this plan. **Do not build a light mode; do not re-raise it.**

---

## §0.4 — THE TOOLING CONTRACT

| | |
|---|---|
| **Browser** | `mcp__plugin_chrome-devtools-mcp_chrome-devtools__*`. 🔴 **NOT the in-app browser** — corrected twice on 2026-08-27. It has **no batch tool**, so batching means: ONE `evaluate_script` per multi-step measurement, and multiple independent tool calls in ONE message |
| **Editing** | A python heredoc for anything touching >1 file or making >1 edit in a file. `assert <anchor> in s` before every replacement, a `print()` per edit, the verifier chained into the same call |
| **Reading** | Grep for the lines needed. **Never re-read a file already in context.** `git diff -- <path>` for tracked docs. Targeted `offset`/`limit` before an `Edit` |
| **Cadence** | Gates at the END of a unit, never between edits. The only legitimate mid-unit command is `node -e "require('./scripts/buildPortal').build()"` when you need to look |
| **Thinking** | `sequentialthinking` freely and **pre-emptively, to set method** — not afterwards to narrate. Mandatory when auditing or reviewing |
| **Output** | Work silently. One structured summary at the end. Tables, never prose, for ~4+ items. Questions are `AskUserQuestion` pop-ups, batched, at the START of a Part |
| **Records** | Changelog paragraph before the Part's closing commit. Timestamps from the `[clock]` value **verbatim** |
| **Never** | Push, open a PR, ask about either, or raise the branch's size |

---

## §0.5 — THE FIVE PHASES, IN THIS ORDER, IN EVERY PART

**① LOCATE.** For every item this surface owns: **does the fix live in the mockup only / the portal only / both / neither?** — with a citation. **Nine instances across two sessions** say this is the most valuable step in the plan. Never skip it because a tracker says "open".

**② SWEEP.** Triage this surface's rows from Part 0's reverse-orphan output. A missing attribute usually explains several visual symptoms at once, which is why it comes before the walk.

**③ MEASURE.** `__grid.all()` on the portal and on the mockup at 1282×888, plus the structural inventory diff. Same instrument both sides.

**④ WALK.** Open **every** action, sub-panel, drawer, composer, overlay, empty state and error state, and every view tab — in the harness *and* against the real server. Register each state in the states harness as you find it.

**⑤ CLOSE.** Fix · one gate run · the A/B artifact · the changelog paragraph · the geometry fixture · tick §L. All in the closing commit.

⛔ **The ordering is load-bearing.** ① before ③ because a diff without adjudication produces rollbacks. ② before ④ because a missing attribute saves the walk from re-finding it as five symptoms. ⑤ once, because the cadence correction had to be given twice.

### The exit condition: a DIFFERENCE LEDGER and an A/B ARTIFACT

**"No visible difference" cannot be literally true** — the portal has real data against fixtures, and carries surfaces the mockup lacks. So each Part ends with **every difference either eliminated or written down with a citation for why it stays.**

🔴 **And it ends with something he can LOOK at.** `local/armory-vocab.html` settled a question in one flip that thirteen rounds of text had failed to settle: two pixel-aligned renders of the same running page, a segmented control, ←/→ keys, the differences marked, a verdict per change. **Every Part ships that** — mockup vs portal, one frame per sub-state, the ledger rendered beside it. Standing rule: **nothing on localhost is a deliverable.**

⚠️ It is also the honest instrument. *"I walked every sub-panel"* is unfalsifiable prose; **fourteen frames is a claim he can check by counting.**

**Machine floor (necessary, never sufficient):** `__grid.all()` near-miss and size counts no worse than the mockup's · inventory diff with zero unexplained rows · reverse-orphan clean for this surface · `npm test` **0**, `portal:orphans`/`coverage`/`refs` **0**, `docs:audit` **1** (the expected `(#PR)`).

⚠️ **`__grid.all()` TRUNCATES** to 22 near-misses and 18 size issues. Read `nearMisses`/`sizeIssues` as **the count**; the arrays are a sample. ⚠️ **`__grid` reports geometry, not identity** — two elements can be perfectly on-grid and be the wrong two. That is why the inventory diff sits beside it, not under it.

### Regression: the geometry fixture

Six of seven realms share `shell.js`, `app.css`, `async.js`, `manifest.js`, `exportPanel.js`, `tips.js`, `overlay.js`, `composer.js`. **A fix in Part 5 lands in the stylesheet Part 1 signed off on** — which is how a `.lvlbars` block written 2,400 lines above an existing one restyled charts three realms away while every gate passed.

- When a Part closes, commit its `__grid.all()` counts and structural inventory as a JSON fixture.
- **A change to a shared surface re-runs the closed realms' fixtures IN THE SAME COMMIT.** Not later, not in Part 7.
- ⚠️ **Honest limit: a fixture of counts catches MOVEMENT, not WRONGNESS.** Two compensating changes keep the count identical. It is a smoke alarm, not a proof.

---

## §0.6 — SCOPE: what this pass may change, and what it may not

| | |
|---|---|
| **In scope, always** | Anything that RENDERS on the surface this Part owns — regardless of which file it lives in |
| **In scope, conditionally** | A server/route change **when the design requires data the UI cannot otherwise have** (the three export routes were exactly this). An improvement merely noticed is filed, not built |
| **Out of scope** | `core/ops` and the operation algebra — the bot's shared spine, which `/manage` also drives. File anything found |
| **Out of scope** | Refactors. `season.js` is 83K and it will be tempting. A conformance pass that also restructures the largest realm is two projects wearing one plan |

⚠️ **The reverse hazard, which this project keeps hitting:** "out of scope" must never become the excuse that leaves a defect standing. **A gap you can close now gets closed now; a deferral is a gap with paperwork.** The test is whether it renders on this surface.

---

## §0.7 — SOURCES: assemble the pending list by READING, never by remembering

🔴 **The single most-repeated failure on this project.** Twice now: *"you forgetting ALL the stuff that's still originally pending??"* and *"your mentioned list is clearly false and missing items from before the migration started."* Both times the list came from recent memory instead of these files.

| Source | What only it holds |
|---|---|
| `local/handoff/2026-08-25-portal-compact-I.md` **§3** | 🔴 **THE PRE-MIGRATION DESIGN LIST** — items A–H as originally written. Gitignored: a default `rg` cannot see it, `rg -uu` can |
| `local/handoff/2026-08-25-portal-ux-copy-audit.md` | 🔴 **THE UX-COPY AUDIT** — sections A–G, the vocabulary table, the Top 10 by impact. **In no plan until this one** |
| `docs/superpowers/plans/2026-08-27-portal-completion.md` §0.1 | The A–S inventory. **Superseded — read for provenance, never for status** |
| `docs/superpowers/mockups/2026-08-23-portal-interactive/COMPANION.md` | The design, and **why**. §16.x is the post-mockup decision record |
| `docs/db-deferred-list.md` | Everything tracked in-repo: `rg -n '^- .\[P' docs/db-deferred-list.md` |
| `local/handoff/2026-08-27-portal-checkpoint-X.md` | Which realms have been compared, and the two-call inventory method |

---

## §0.8 — SETTLED: do not re-ask

| | His answer |
|---|---|
| **Season glyph (F)** | ❌ *"none for now, might revisit this in the future some day."* **The prototype stays — do not delete it.** Not a permanent no |
| **Armory vocabulary** | ✅ *"the mockup's version is better."* All three changes built |
| **Home vs realms horizontal systems (G)** | **KEEP AS-IS.** The 63px shift and 126px width change on navigation are accepted |
| **`findOverlaps` semantics** | A conflict is **the same thing entered twice** — not two items sharing days (61 findings), not two playlists at once (47; CODM runs seven concurrently) |
| **Light mode** | **Dark-only is deliberate.** Retire the tracker row; do not build one |
| **Part 0 scope** | Full, **including the shared shell and the states harness** |
| **Part shape** | One continuous Part per realm, run until the realm is done |
| **Records** | Per-Part changelog paragraph + one closing DEVLOG narrative |
| **Pushing** | Never. Do not ask |

**Still genuinely HITL — ask, never decide:** item **H** (playlist concurrency density — he answered *"Idk"*) · the **four composition changes he has never seen** (Broadcast's severity dot inside the name cell; Season's `Review & commit` restyled to `.commit`; the composer's Discord-shaped preview card; Armory's two MP/DMZ create chips) · Broadcast's **`Now showing` vs the mockup's `Delivery queue`**.

---

## §0.9 — DO NOT "FIX" THESE

| | Why |
|---|---|
| **`addrow` unbuilt** | Season replaced the mockup's inline add row with the composer. Restoring it is a second way to add the same things, with no natural-language dates |
| **`fxc` unbuilt** | A per-row opt-out in Armory's bulk diff would map a rendered row back to raw text, and that parser is the bot's `utils/adminParser.js` |
| **`findOverlaps` having no caller** | Settled — see §0.8 |
| **`portalCoverage` skipping `classList.toggle`** | Identity is read; transient state is not. Deliberate |
| **`.winbox` as a misnamed `.win`** | Tried, measured, reverted |
| **`zero`/`stg-clear` absent** | The portal deliberately reversed that rule: a chip is ABSENT at zero rather than dimmed |
| **`OutcomeSplit` in the Usage panel** | His call — *"keep but move it"* |
| **`public/` lagging the changelog** | Correct by design |
| **The branch's size** | His decision, stated repeatedly. Not a finding |
| **Home's stats being ahead of the mockup** | Deliberate. **Home's target is COMPANION §5.9z.5 and §16.6, NOT `index.html`** |
| **Season's point lanes** | COMPANION still describes the shipped code as painting a 1% band; the portal renders real points. Portal-ahead |
| **Access's grant inputs "having no label"** | They are `<label for=…><span>…</span><input id=…>`. A probe reading only `innerText`/`aria-label` reports them as nameless. **Not a defect** |
| **Analytics health reading from Mongo** | `BootRecord` + `AlertLog`, not a live gateway reading. `computeHealthStats(client)` would report the *portal's* uptime while looking like the bot's |

---

## §0.10 — TRAPS ALREADY PAID FOR

| | |
|---|---|
| 🔴 **A backtick inside an HTML comment inside a template literal kills the build** | Nine occurrences. `buildPortal` names the file and line. Say the name in plain words |
| 🔴 **htm eats a space at a line ending before an inline tag** | End the line with `${' '}`. A test names the offending lines |
| 🔴 **A duplicate CSS selector is invisible to every gate** | Grep `app.css` for a class **before** writing a rule for it |
| 🔴 **Never pipe a gate to `tail`** | A pipeline exits with the LAST command's status, and these gates print ERRORs ABOVE the summary |
| 🔴 **A probe returning all zeroes may be measuring an empty page** | The SPA had not routed. **Prove every probe can report PRESENCE before trusting an absence** |
| 🔴 **`requestAnimationFrame` never fires in a background tab or an off-screen iframe** | A pass gated on rAF reports `pending` forever. Use `document.fonts.ready`, which resolves regardless of visibility |
| ⚠️ **Bounding boxes of WRAPPED INLINE elements legitimately overlap** | A naive pairwise text-overlap check reports false positives. Use `getClientRects()` per line box |
| ⚠️ **`npm run <script> --write` swallows the flag** | Use `node scripts/reflow-comments.mjs --write` |
| ⚠️ **`portal:bust` after a `portal/ui` module changes** | Or the browser serves the old `?v=` |
| ⚠️ **`?today=` does NOT travel the season clock** | `countdownParts` reads `Date.now()`. Set `data-tier` on `.sclock` and read computed styles back |
| ⚠️ **`portal/public/` is BUILD OUTPUT** | Sources are `portal/ui/` |
| ⚠️ **A new export route needs THREE registrations** | The API route · the UI scope list as **literals** (a factory is invisible to the scope gate) · `scripts/lib/portalRouteQuery.js` |
| ⚠️ **`main` is the portal's scroll container** | `window.scrollY` can never show a portal scroll bug |

---

## §A — THE FOLDED INVENTORY (A–S), RE-VERIFIED 2026-08-27

| # | Item | Verdict now | Evidence |
|---|---|---|---|
| **A** | Season clock hierarchy | ☑ **built, portal-ahead** | 13 `.sclock` rules vs 1 mockup mention. **Remaining work is CONFORMANCE to §16.31's five tiers**, not a rebuild |
| **B** | Banners as real thumbnails | ◐ **re-measure** | 6 `thumb`/`img` hits in `season.js`; claimed closed the same day as the search bar. **Now verifiable — the two dead banners were re-hosted 2026-08-27 21:0x EDT and both databases point at Cloudinary** |
| **C** | One persistent open/close control | ☐ **OPEN — confirmed** | `#idClose` exists **nowhere**; measured live, `doneBtn: false` |
| **D** | Expanded editor panel — alignment, spacing, structure | ◐ **re-measure** | His own note: *"I called it 'fine' three times and never measured it once"* |
| **E** | Per-realm composition | ◐ **re-measure** | Claimed closed with a 6/6 blur test |
| **F** | Season glyph | ⊘ **his no** | §0.8 |
| **G** | Home vs realms horizontal systems | ⊘ **his keep-as-is** | §0.8 |
| **H** | Playlist concurrency density | ☐ **HITL** | *"Idk"* |
| **I** | Reorganise Home | ☐ **OPEN — evidence found** | `hcard`/`hgrid`/`hmast`/`hseason` styled, **no emitter in `home.js`** |
| **J** | Account panel | ☑ **already built** | All seven of §16.8's points are in `shell.js` |
| **K** | Four liveliness interactions | ☑ **built** | All four have a rule and an emitter. ⚠️ **NOT the same as motion-as-a-system — see §B** |
| **L** | Header pill below 900px | ⊘ **deferred** | Mobile |
| **M** | The five gates-green defects | ☐ **1 of 5 confirmed BROKEN, 3 unverified** | see below |
| **N** | Harness in `npm test` | ☑ **built** | `portalHarness.test.js` + `portalHarnessRender.test.js` |
| **O** | First real boot | ◐ **partly** | Boot, Mongo and the 401 gate exercised. Everything behind a signed-in session needs **his** OAuth |
| **P** | Production | ☐ **his** | 4 launch-checklist items |
| **Q** | Analytics payload | ☑ **42.1 KB** | The row was stale, not open |
| **R** | Armory live preview | ☑ **built** | 23 references in `armory.js` |
| **S** | Coverage number | ☑ **re-measured** | |

### Item M in full

| # | As compact-I §0 recorded it | Now |
|---|---|---|
| 1 | Armory's Compare showing two "identical" columns at **447px and 567px** | ⚪ unverified — **Armory** |
| 2 | Its two preview cards **12px** out of vertical step | ⚪ unverified — **Armory** |
| 3 | The season record's six cells with **six different internal layouts** | ⚪ unverified — **Season**. §16.32's answer: six peers, three abreast, one line each, 153px |
| 4 | A component **clipped to 1px** by a class-name collision, rendering for screen readers only | ⚪ unverified — **Part 7** |
| 5 | Every icon rendering as an empty string | ☑ fixed |
| **+** | **The doubled search bar** | 🔴 **MEASURED BROKEN** — 44px input in a 34px wrapper, `data-bare` absent → **Part 0, the shell** |

---

## §B — FIVE BODIES OF WORK THE FIRST DRAFT OF THIS PLAN MISSED

*Found by reading rather than remembering, which is §0.7's whole point.*

| | | Where it goes |
|---|---|---|
| 🔴 **The UX-copy audit** | Sections **A** contradictions · **B** engineering leaking into the UI · **C** labels that don't name the outcome · **D** confirmations · **E** empty, error and loading states · **F** wordy/writerly · **G** only-makes-sense-if-you-built-it, plus a **vocabulary table** and a **Top 10 by impact**. `.verbs.html` is its instrument | Splits per realm — each Part works its own rows |
| 🔴 **Loading skeletons** | COMPANION: *"specified, not built… only becomes real at wiring time."* Wiring time is now. Partial: 7 `skeleton`/`is-loading` rules, `async.js` names 14 states. **The rule: a skeleton in the shape of the content, never a spinner** | Part 0 (shared `async.js`), verified per realm |
| 🔴 **§10.4 Track as hero** | *"the composition hierarchy landed, but the Track panel has not been given full-bleed treatment"* | Season |
| 🔴 **Motion as a system** | *"Filed, not built."* ⚠️ **COMPANION warns explicitly that this is NOT the liveliness work — conflating them is how the entry gets wrongly closed.** Item K being built does not close this | Part 7, or its own Part if it grows |
| 🔴 **The door / login page** | `door.html` is a mockup page. First screen any human sees, served at `/`, outside the harness entirely | Part 0 — needs the real server |

**Also unfound until now, and owned by Part 0 unless a realm claims them:** the six `async.js` request states (skeleton · refreshing · slow · failure · progress · page banner) verified in a realm rather than in isolation · the **409 commit-gate path**, where `fetchJson` passes a 4xx body through UNTOUCHED · **keyboard reachability** (54 `:focus-visible` rules, and `.states.html`'s PASS 4 exists because *"nobody had ever tabbed through a realm"*) · **scroll behaviour** (`.scroll-matrix.html` has no portal equivalent) · **the tooltip runtime** (26 `data-tip` attributes once had no reader at all; tooltips are content and are invisible to a screenshot).

---

## PART 0 — THE SHELL AND THE INSTRUMENTS

*Everything here is inherited by all six realms. Building it inside Season would make Season pay for what the other five use free — and would give the doubled search bar an arbitrary home instead of a correct one.*

### 0.1 The reverse-orphan sweep

**It answers: does this rule have an element?** — the inverse of `portal:orphans`.

**Three shapes, because all confirmed defects took one of them:** `[data-*]` selectors with no emitter · `var(--x)` reads with no `--x:` setter anywhere · classes with ≥2 rules and no emitter, **with a concatenation-aware second pass** (a scanner sees only `lv-` in `'lvlb lv-' + a.level`, and that exact miss has already happened).

🔴 **PROVE IT ON THE KNOWN CASE FIRST.** A run on 2026-08-27 returned **`data-bare`, `data-role`, `data-src`** · **`--ci` (6 reads), `--mono` (4), `--focus` (1)** · **48 classes**, of which `t-best`/`t-top4`/`t-top5`/`t-unranked`, `hcard`/`hgrid`/`hmast`/`hseason` and `srec-open` were confirmed by hand. **If a later run does not report `data-bare`, the script is broken, not the portal.**

### 0.2 Mockup-side grid injection

`portal/public/harness.html` loads `/harness/grid.js` and `/harness/peers.js`; **the mockup pages ship `.grid.js` and `.peers.js` and never include them.** All seven mockup pages have a `<main>`, which is what `__grid` draws into, so injection is all that is needed.

**The surface is `__grid()` · `.off()` · `.near()` · `.sizes()` · `.all()`, and `__peers()`. 🔴 There is NO `__grid.report()`** — the superseded plan named it in three places and it would have thrown every time.

### 0.3 The viewport contract · 0.4 the geometry-fixture format and runner

### 0.5 The states harness

**Ported from `.states.html`'s structure**, not its catalogue: PASS 1–5 including **4b EXPANDED** (*"the sweep had only ever rendered the default state"*), **4c WHO IS LOOKING** (tier-3 is owner-only), **4d ASYNC**, **4e CROSS-PAGE**, **4f REDUCED MOTION**, **4g MODALITY** (*the drawer claimed to be modal and Tab walked out of it*).

🔴 **The catalogue GROWS per realm.** A states page must enumerate states that Parts 1–6 discover — building the list up front inherits the mockup's blind spots. Part 0 builds the **page, the driver and the settled-pass discipline**; each realm **registers its own states as it walks them**; Part 7 re-runs everything through the finished catalogue. That makes *"did I walk every state?"* answerable by diffing the registry against the walk.

⚠️ Its own recorded traps: rAF never fires in a background tab — use `document.fonts.ready` · a harness **can measure the wrong thing precisely**, so a stub whose self-check never clears must come back marked `timedOut`, not read.

### 0.6 The shell itself

Rail · **command bar (the doubled search bar — `.cb-in` needs `data-bare`)** · masthead frame · account panel · tray · toast · overlay · export strip · manifest frame · `async.js`'s six request states + the skeletons · tooltip runtime. Each against `index.html`'s chrome and COMPANION.

### 0.7 The door

`door.html`. **Requires the real server** — it is not in the harness at all.

---

## PART 1 — SEASON

**Surfaces:** masthead · identity strip (collapsed **and** expanded) · the season record · Track · Board · Repairs · manifest · composer and its preview · day drawer · one-way panel · every overlay, empty and error state.

| | |
|---|---|
| 🔴 **Item C** | No `#idClose`. The collapsed strip is click-anywhere; the open panel is one small button. The design is **one persistent control, same position in both states, click-anywhere in both** |
| 🔴 **Item B** | Banners as real thumbnails — kills the grey dot **and** the fake gradient, distinguishing banners from deadlines **by KIND**. Now checkable against real images |
| 🔴 **Item D** | The expanded editor panel: alignment, spacing, structure. Never measured |
| 🔴 **Item M#3** | §16.32: **six peers, three abreast, one line each, 153px.** The banners row uses the SAME cell as the deadlines — the only thing that stops it reading as a footnote |
| 🔴 **`srec-open`** | Styled, emitted nowhere |
| 🔴 **§10.4 Track as hero** | Full-bleed treatment, never given |
| 🟡 **The clock** | Built and ahead. **Conformance only**: the five tiers, each of which SUBTRACTS — `open` 22+ · `running` 8–21 · `closing` 3–7 (lead ×1.18) · `final` 1–2 (**the "then" line goes**) · `today` 0 (**the seconds go**, hours lead) |
| 🟡 **Board and Repairs** | Never diffed. Board's columns are `Live now · Upcoming · Staged · Ended`, and **`Staged` is a documented, deliberate, single exception — do not "fix" it.** Repairs is six checks, and **a check reporting zero stays on screen with its reason** |

**Already closed on this branch, do not redo** — the Track's internals (`7cbcd07`): the Track was the 6th block on its own tab (ruler y=1266→761) · two deadlines on one date asserted three times · no point clustering · `--xtop` and `.dflag.flip` had no producer · the pin took no row · the time-remaining span was an unlabelled 302px box.

---

## PART 2 — ARMORY

**Surfaces:** MP/DMZ mode · Tier board · Repairs · Compare · Bulk & export · the build form · the live preview · manifest.

🔴 **`t-best`/`t-top4`/`t-top5`/`t-unranked` styled, emitted nowhere** — `categoryRank` is `best`/`top3`/`top4`/`top5`/`null`, so the tier board may be styling tiers it never applies · 🔴 **Item M#1** Compare's two "identical" columns at **447px and 567px** · 🔴 **Item M#2** the two preview cards **12px** out of vertical step · 🟡 Compare and Bulk never diffed · ❓ the two MP/DMZ create chips are one of the four he has never seen.

🟢 Settled: the vocabulary, the realm-level MP/DMZ switch, the realm key, the column names, the subtitles.

---

## PART 3 — BROADCAST

**Surfaces:** Now showing · Airtime · delivery preview · manifest.

🔴 `atbar`/`atrow`/`atruler`/`atnow`/`timax`/`timb`/`timleg` styled with no emitter found — verify before treating as defects · ❓ **`Now showing` vs the mockup's `Delivery queue`**, never adjudicated · ❓ the severity dot inside the Announcement name cell.

🟢 Closed: the realm key, the export strip, the rewritten subtitle, `"at most 1 announcement"`.

---

## PART 4 — ACCESS

**Surfaces:** By admin (the permission grid) · By scope · Sessions · the grant form.

🔴 `mxrole`/`mxrow` styled with no emitter found · 🟡 By scope and Sessions never diffed · ⚠️ `.mxgrp th`'s two group headers span **four `ADMIN_COMMANDS` and eight `MANAGE_PAGE_SCOPES`** — the colspans come from the lists' lengths while the columns come from `accessScopes` order, so appending a command at the end silently mis-groups.

---

## PART 5 — ANALYTICS

**Surfaces:** Health · Usage · Timing · Reach · Search · the event river.

🟡 Usage, Timing, Reach and Search never diffed; only Health has been compared · ⚠️ `ackMs` and `durationMs` are **two clocks** — ack has a hard 3-second Discord deadline, and averaging them into one "latency" hides which is at risk.

🟢 Closed: alerts-by-level as a distribution, the export strip, the rewritten subtitle, the 42.1 KB payload.

---

## PART 6a — REVIEW  ·  PART 6b — HOME

🔴 **Two surfaces with opposite failure modes, paired only because the numbering pairs them.** Separate exits, separate A/B artifacts.

**6a Review — failure mode: CORRECTNESS.** The only screen that commits, and the only place staged work from any realm becomes real. **Tier-3 is owner-only** — `.states.html`'s PASS 4c exists for exactly this. Never diffed against `review.html`. The commit gate returns 409 with `{ok:false, reason}` and `fetchJson` passes 4xx bodies through **untouched** — verify that path renders.

**6b Home — failure mode: COMPOSITION.** 🔴 **Home's target is COMPANION §5.9z.5 and §16.6, NOT `index.html`** — its stats are deliberately ahead. Item **G** is settled KEEP AS-IS. 🔴 `hcard`/`hgrid`/`hmast`/`hseason` styled with no emitter in `home.js` — item I was marked closed and this is evidence it was not.

---

## PART 7 — THE SWEEP, THE MISC, AND THE DOUBLE-CHECK

1. **Item M#4** — a component clipped to 1px by a class-name collision, rendering for screen readers only. Never identified. (`.lnc` inheriting `.col{min-height:220px}` was a previous instance of the same shape.)
2. **The remaining reverse-orphan rows** not claimed by any Part, plus `--ci`, `--mono`, `--focus`.
3. **Motion as a system** — filed, not built, and explicitly not the liveliness work.
4. **Re-run every Part's geometry fixture and states catalogue** now that both are complete.
5. **The difference ledgers**, read end to end; anything "stays, because X" re-read against X.
6. **The four composition changes he has never seen**, put to him together.
7. **The closing DEVLOG narrative entry.**

---

## Audit log

*The falsification pass `.claude/rules/plan-drafting.md` requires — asked "where is this WRONG?", not "does it look done?". Two rounds: 20 thoughts before the first draft, 10 more against that draft at Harkirat's explicit instruction to "provoke the unasked, the unconsidered, the out-of-scope, the missed, the unfound."*

| # | Where it was wrong | Consequence if unfixed | Fix |
|---|---|---|---|
| **1** | The pending list was assembled **from memory** and missed compact-I §3 entirely | The wrong things rebuilt; items B, C, D skipped | §0.7 names six sources; §A re-verifies A–S against source |
| **2** | I was about to plan a countdown **REBUILD**; the clock is portal-ahead | Thirteen attempts of approved design deleted | §0.1's precedence rule; item A reclassified as conformance |
| **3** | The reverse-orphan sweep read `app.css` without `tokens.css` and reported **80 false "never set" properties** | A real signal of 3 drowns in 80; the instrument gets abandoned | Scoped to three shapes; proved on `data-bare` first |
| **4** | The `[data-bare]` diagnosis was **inferred from a grep**, not measured | The plan opens with a confident wrong claim | Measured: 44px input, 34px wrapper, both painting a box |
| **5** | A pairwise text-overlap probe reported three "defects" that were **wrapped inline elements** | Three non-defects filed in Armory and Broadcast | §0.10; use `getClientRects()` |
| **6** | "No visible difference" is **unreachable by construction** | Every Part ends in an argument about whether it is done | A written difference ledger with citations |
| **7** | `__grid.all()` **truncates** to 22/18 and the counts are separate | A session fixes 22 and calls a realm of 60 clean | Stated in §0.5 |
| **8** | `.grid.js` is **not loaded** by the mockup pages | `__grid is not a function`; the core method looks broken | Part 0.2 |
| **9** | 🔴 **THE WHOLE PLAN MEASURED TWO FIXTURE RENDERINGS AND CALLED IT CONFORMANCE** | A realm passes everything and is broken live; the door and the real error paths are never seen | §0.2's three artifacts; every Part owes a real-server pass |
| **10** | 🔴 **No deliverable he can LOOK at** — his acceptance test is visual and every Part ended in a commit | He is handed work instead of a review surface; "I walked every state" stays unfalsifiable | An A/B artifact per Part, one frame per sub-state |
| **11** | 🔴 **Five bodies of work missing**: the UX-copy audit, loading skeletons, §10.4 Track-as-hero, motion-as-a-system, the door page | An entire audit never worked; item K's "built" silently closes motion | §B |
| **12** | **"One commit per Part" is wrong for a multi-session Season** | Unreviewable, unbisectable, every stop lands on a dirty tree | Commits per coherent fix; the ledger row closes once |
| **13** | **The states page had a chicken-and-egg** — it enumerates states that Parts 1–6 discover | It inherits the mockup's blind spots, or it is not Part 0 | Part 0 builds the harness; the catalogue grows per realm |
| **14** | **Nothing caught a regression across Parts**, in a codebase whose recent history is exactly that | Part 1's sign-off silently expires when Part 5 edits the shared stylesheet | Geometry fixtures + the shared-surface rule; limit stated honestly |
| **15** | **No scope boundary** on an instruction that reads as "fix everything" | `core/ops` edited, or `season.js` refactored mid-pass | §0.6, with the reverse hazard named |
| **16** | **The seven-part split assigns shared-shell work by coin-flip** — the worst defect found lives in the shell | Six realms each re-fix the same chrome, or one arbitrarily owns it | Part 0 absorbs the shell; re-confirmed with him |
| **17** | **Light mode was never decided** — zero theme rules, and a tracker row assuming one exists | A stale row invites a future session to build one uninvited | Settled: dark-only is deliberate; the row is retired |
