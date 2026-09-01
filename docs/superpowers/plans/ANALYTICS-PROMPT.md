---
kind: plan
status: live
---

# Part 5 — Analytics. Paste this in.

> Written 2026-09-01 19:08 EDT by the Access session (§0.0). **Every number below names the command that produces it; where a figure and a tool disagree, the tool wins.** That sentence is not decoration — Part 4's prompt inherited three wrong figures for its own realm from §L, and the same row had already been corrected once.

## 🔴 ORDER OF OPERATIONS — this block supersedes every competing instruction, and nothing else needs opening to start

**1 · Order.** `git log --oneline -3 v3-pre-release` → **build** → the two `preview_start` calls → `portal:status` → the audits. 🔴 **Several documents each claim to be "the first call of every realm"** — §0.7a says `portal:audit`, §0.5b's ⓪ says `portal:diff`, §0.2 says the real server, `SESSION-START` says a realm audit is not first any more. **Each is first WITHIN ITS PHASE. This list is the ordering. Stop looking.**

**2 · Tool per question, and BATCH — this is the single biggest turn sink.** Prose question (*is this settled? is there a memory about X?*) → **`ctx_search`**, which since 2026-09-01 also reaches the MEMORY STORE, `meta-deferred-list.md`, the 83-step `2026-08-23-workflow-compliance-plan.md` and `~/.claude/TOOLING.md` — four surfaces outside the repo root that no in-repo `rg` can see. A `PreToolUse` hook re-indexes before every search, so results are current by construction. Symbol or callers → `codebase-memory`. A string you already know exists → `rg`. The comment beside the code → `Read` with `offset`/`limit`. ⛔ No browser and no probe during triage. 🔴 **AND WHEN YOU HAVE N INDEPENDENT SHELL QUESTIONS, THEY ARE ONE `ctx_batch_execute` CALL, NOT N `Bash` CALLS.** Part 4 spent five round-trips measuring one realm's file size, handler count, data-attribute count, view names and line count — five facts that depend on nothing but each other's absence. Harkirat caught it: *"why waste all those turns when a single ctx-search or batch_execute would've handled your search in 1 turn?"* Every fact-gathering sweep in this document is a batch.

**3 · Browser.** §0.4's 🔴 *NOT the in-app browser* governs **MEASUREMENT, not servers.** `preview_start` starts a launch-config server and is required here; the portal instruments drive their own headless browser and need neither.

**4 · Turns, and what a "unit" is.** A UNIT is **one independent root-cause group plus its re-audit** — the thing you never stop in the middle of. Part 4 took ~120 turns for a realm the plan called smaller than Season; the honest shape is `3 + (1 per independent root-cause group) + 1 regression + the records`. At a turn-budget warning: finish the current unit *including* its verification, then report. **Cut the report, never the band captures.**

**5 · What you may do without asking.** 🟢 **Commit on the branch freely** — do not ask, and do not batch a session's work into one commit. 🟢 Run every portal instrument. 🟢 Dispatch the §L ⑥ reader agents. ⛔ **Never** push, open a PR, merge, or ask about any of them.

**6 · 🔴 A LIVE CONSTRAINT FROM 2026-09-01 19:04 EDT, AND YOU MUST CONFIRM IT RATHER THAN ASSUME IT.** Harkirat, mid-session: *"stop running full test suites, wait for the full suites until i approve pushing. Either run no tests or run very minimal scoped tests only until then."* He said it while Part 4's branch was unpushed, so **its scope is "until the push is approved", not "forever"** — a `npm test` costs several minutes and he was watching them stack up. **Run the SCOPED gate that covers what you touched** (`node scripts/portalUi.test.js`, `node scripts/portalReverseOrphans.mjs --ci`, `npm run docs:reflow-comments`, `node scripts/portalGeometry.mjs --realm analytics --check`) and save the full suite for the moment before the push. ⚠️ **§L condition ④ still requires a full green re-run at the commit you claim it for** — so the full suite is deferred, never dropped, and the claim waits with it.

**7 · What ends Part 5** — copied out of §L so you need not open it: ① `portal:converge` enumerated *(run the named tool — never `portal:audit`'s ① section; that exact substitution was caught on Broadcast while `portal:status` printed `converge · never` in the same tree)* · ② `portalDiff` reports exactly the cited region set on all five views · ③ `portalInventory`'s six lists empty or dated-cited · ④ machine floor green **re-run at the commit you claim it for** · ⑤ a real-server pass · ⑥ the reader test on Part 6's carriers, everything it finds fixed · ⑦ Harkirat has looked.

---

## The two lines §0.0 requires before any task content

- `/rename Sonnet5-High · Analytics conformance · <Mon DD>`
- `Premise Low · Delib High -> Sonnet5-High` — the audit produces the findings, so the facts are given and checkable; the load is breadth across sites. Escalate on events only.

## Branch state

Part 4 (Access) landed on **`feat/access-portal-conformance`**, unpushed and unmerged as of this writing. **Verify what you inherited by RUNNING `git log --oneline v3-pre-release..HEAD` and `git diff v3-pre-release..HEAD --name-only`, not by trusting a count here** — this paragraph deliberately quotes none, because the commit that writes a count changes it. What is stable: Part 4's commits touch `portal/ui/access.js`, `portal/ui/app.css`, `portal/fixtures/**`, `docs/reference/portal-decision-ledger.md`, `docs/db-deferred-list.md` and the plan; **anything touching `portal/ui/analytics.js` is not from Part 4.**

⚠️ **One worktree is live — `draw-calculator-breakdown-146641`, Harkirat's peer session. Never touch it.** `chore/silent-mode-guards-parked` is pushed, inert, registered in no settings file, and **is not your work.**

## The mode

🔇 **Silent mode**, per `MEMORY.md`'s section — auto-loaded, already in your context. No prose between the first call and the final summary, one structured summary at the end, tables not prose for 4+ items, `sequentialthinking` before any audit or review. **Nothing enforces it.**

🔴 **THE BATCHING TECHNIQUE, WITH THE FAILURE MODE PART 4 ACTUALLY HIT.** N edits across N files is ONE `python3` heredoc with an `assert <anchor> in s` before each replacement and the verification chained onto the same call. **But Part 4's batch printed six successes and wrote nothing.** The shape was:

```python
for each edit:  assert anchor;  s = s.replace(...);  print(label)
io.open(p,'w').write(s)          # ← ONE call, AFTER the loop
```

An assert on the sixth edit raised before the write, so five edits that had already printed "done" were discarded — and the built asset still carried the old markup two instrument runs later, which read as *"the build is not picking up my change"* rather than *"the edit never landed"*. **Write BEFORE you print, or verify by reading the file back.** `rg` the new anchor in **both** the source and `portal/public/ui/<realm>.js`. Never conclude a build is stale until you have grepped the source.

## First calls, in this order

🔴 **BUILD BEFORE STARTING THE HARNESS.** `portal/public/` is gitignored and holds zero tracked files (`git check-ignore -v portal/public` → `.gitignore:84`), and `.claude/launch.json`'s `portal-harness` command does `os.chdir('portal/public')` before it binds. In a fresh clone or a worktree the directory does not exist, the server dies with `FileNotFoundError`, `:8901` never listens, and every audit, inventory and diff below fails against a dead port.

```bash
node -e "require('./scripts/buildPortal').build()"    # CREATES portal/public
lsof -nP -iTCP:8900 -iTCP:8901 -iTCP:8787 -sTCP:LISTEN   # all three may already be up
```

Then two **MCP tool calls — not shell**: `preview_start {name:"repo-static"}` (:8900, the mockup, serving the repo ROOT so a bare `:8900` is a directory listing) and `preview_start {name:"portal-harness"}` (:8901, serving `portal/public`). ⚠️ If a port is already listening, `preview_start` fails with **`port in use`**, which is benign. **Only that message is benign; any other `preview_start` failure is real.** A `curl -s -o /dev/null -w "%{http_code}"` against each URL is the cheap way to prove all three are serving before you measure anything — and it belongs in the same batch as the build.

```bash
npm run portal:status                     # the close-condition receipt board is at the FOOT
npm run portal:audit -- --realm analytics --view "Health"  --all
npm run portal:audit -- --realm analytics --view "Usage"   --all
npm run portal:audit -- --realm analytics --view "Timing"  --all
npm run portal:audit -- --realm analytics --view "Reach"   --all
npm run portal:audit -- --realm analytics --view "Search"  --all
npm run portal:audit -- --realm analytics --triggers
npm run portal:inventory -- --realm analytics
node scripts/portalDiff.mjs --realm analytics --portal harness
npm run portal:converge -- --realm analytics
```

🔴 **`--all` LIFTS THE ROW CAPS ON ONE VIEW. IT DOES NOT WALK VIEWS. Analytics has FIVE** — more than any other realm — and `portal:status` prints them. **Those five audits depend on nothing but the build, so they are ONE batched call**; redirect each to its own file and print the line counts, then read the sections you need. Five audits read one at a time is five turns for one fact-gathering step.

✅ **All five view names are IDENTICAL on both sides** — verified 2026-09-01 19:00 EDT: `analytics.html:33-37` emits `data-view` buttons reading `Health · Usage · Timing · Reach · Search`, and `portal/ui/analytics.js:682` passes the same five strings to `Shell`. **So `portal:audit --view` will work on every one of them.** This is worth stating because it did NOT hold on Access — that realm's second tab was `By scope` in the portal and `By permission` in the design, `portal:audit` **refuses a view name it cannot find on the MOCKUP side**, and the whole view was therefore unreachable to the tooling until the tab was renamed. Nothing here needs renaming; do not go looking.

## 🔴 `portal:inventory` IS THE INSTRUMENT PART 4 UNDER-USED, AND IT FOUND WHAT NOTHING ELSE COULD

It compares the two pages by **element signature** — `tag.class.class` with a count — rather than by geometry or by pixels. On Access it produced the last two real defects of the pass, at a point where converge and the page diff had gone quiet:

- `span.mxcol.mxs.ownly.spof` was ONLY IN MOCKUP → the grid's column header never drew the owner-only 🔒, **while the mark legend added earlier in the same pass named it.** A legend explaining a mark that is not on the page.
- `button.inh.inherited.mxcell` (mk) vs `button.inh.inherited.mxcell.on` (pt) → the portal's inherited cell also wore `.on`. It **rendered correctly**, and that was the finding: `.mxcell.on` fills and `.mxcell.inh` resets the background, so the hollow ring survived only because `.inh` is declared LATER in the stylesheet.

**Run it EARLY and again at the end.** Its two lists are also §L condition ③, and the close test is that every row maps to a cited decision or a data state — an enumeration, never a count.

## The two phases a realm prompt keeps dropping — both have a named artifact

**① LOCATE → `local/locate-analytics.md`.** For every item this surface owns: does the fix live in the mockup only / the portal only / both / neither — **with a citation**. One row per item: item · verdict · citation · what it implies. §0.5b: *"🔴 IT PRODUCES A NAMED ARTIFACT, or it did not happen."* It is what stops a diff becoming a rollback, and it is the input to ③ and ⑤. Part 4's is `local/locate-access.md` — nineteen rows — and it is the shape to copy.

**⑥ UX-COPY → every row applied or answered in the difference ledger.** Work Analytics's rows from `local/handoff/2026-08-25-portal-ux-copy-audit.md` — ⚠️ **gitignored, so no `rg` will surface it; open it by path.** Its sections A–G are realm-shaped and its **vocabulary table is cross-realm**, so a word changed here changes everywhere. §0.5b's audit log entry 25 is this exact step being missed a third time undetectably.

**Analytics's own rows, pre-read 2026-09-01 19:00 EDT so you can go straight to them:** `analytics.html:534` prints an implementation detail to the reader (*"the old in-memory undo Map"*) · `analytics.html:498-499` is a near-bare "nothing matches" empty state that names neither the term nor the action, where `season.html:2252` is the template · the audit's F-row about a screen-reader label reading *"Search the river"* **does not reproduce** — `analytics.html:61` reads `Search alerts and changes`, matching its placeholder, so do not chase it. ⚠️ **The word "river" also appears in the mockup's code comments and as the function name `river()`.** That is fine; the audit's objection was to it reaching a reader.

## The real-server pass — §L condition ⑤

⧗ is unreachable (§L), so a Part that wants to close **must** run one. It needs a third server:

```bash
node --env-file=.env.dev portal/server.js     # :8787
npm run portal:realwalk -- --realm analytics
node scripts/portalDiff.mjs --realm analytics   # --portal real is the DEFAULT here, and the stronger comparison
```

🔴 **NEVER `npm run portal`.** It is a bare `node portal/server.js`, and `portal/server.js:6` calls `dotenv.config()` — which loads **production's `.env`**. The `--env-file` flag is the whole safety margin. If `:8787` is already listening, check it with `ps -o command= -p <pid>` before you trust it; Part 4 found one already up and confirmed it carried `--env-file=.env.dev` before using it.

🔴 **`portalRealWalk` READS ITS VIEW NAMES FROM `portal/fixtures/geometry/<realm>.json`, NOT FROM THE COMPONENT.** So if you rename a view, the walk fails on the OLD names and reports `❌ no control reading "X" — the view was never entered`, which looks like a defect in the realm. The fix is `node scripts/portalGeometry.mjs --realm analytics --write` **in the same commit as the rename** — which §0.5b requires anyway. Part 4 hit this exactly once and it cost a turn.

⚠️ `portalRealWalk` mints a dev session in Mongo, so **a local Mongo and a `.env.dev` carrying a localhost `MONGODB_URI` are prerequisites**; without them it throws *"could not mint a dev session"*.

## Then crop the captures and LOOK, early

```bash
rm -f local/diff-analytics/*.png       # 🔴 NOT OPTIONAL — a stale capture crops into a plausible band
node scripts/portalDiff.mjs --realm analytics --portal harness
Y=0; H=340
magick local/diff-analytics/mk-analytics.png -crop 1282x${H}+0+${Y} +repage -resize 620 /tmp/mk.png
magick local/diff-analytics/pt-analytics.png -crop 1282x${H}+0+${Y} +repage -resize 620 /tmp/pt.png
magick /tmp/mk.png /tmp/pt.png +append -bordercolor '#777' -border 2 /tmp/band.png   # mockup LEFT, portal RIGHT
```

Then `Read /tmp/band.png`, at **at least three bands down the page** — and the three crops are ONE batched call, since none of them depends on another. Of Armory's seventeen closed defects seven came from this and zero from the percentage; Broadcast's single largest did too; **and Part 4's largest — a black bar drawn through every granted cell in the permission grid — was invisible to all five audit sections and to a full-green test suite, and obvious the moment two crops sat side by side.** When a band shows something odd, crop tighter and upscale with `-filter point -resize 500%`; that is what turned "the dots look different" into "there is a stroke hanging out of the bottom of the cell".

## What is actually true about Analytics

| | The command that produces it |
|---|---|
| **44KB · 1 handler** | `npm run portal:status`. ⚠️ **§L row 5 says "46.1KB · 1 handler" and the two are not in conflict about the same thing**: the file is **46,107 bytes** on disk (`ls -l`), which §L rendered as "46.1KB", while the tool prints **44KB**. Two units, one file. **Quote the tool.** |
| **Five views: Health · Usage · Timing · Reach · Search** | `npm run portal:status`, and they match `analytics.html:33-37` exactly |
| **9 distinct `data-*` names / 32 occurrences** in `analytics.html` | `rg -o 'data-[a-z-]+' <file>`. ⚠️ **Nothing in `scripts/` prints a per-realm data-attribute count**, so any such figure in §L has no producing instrument and is a hand count — this one included, and it was hand-counted 2026-09-01 19:00 EDT |
| **`portal/ui/analytics.js` is 706 lines with 3 `onX` prop sites, 3 distinct** | `wc -l` and `rg -o '\son[A-Z][A-Za-z]*='`. **A near-static reference, not an interaction realm** — §L's own row says so, and the interaction tier is correspondingly small |
| **Never instrumented** | `portal:status`'s receipt board reads `· never` across all five columns |
| ⚠️ **The drift counter is not a failure signal** | `portal:status` shows `🔴 N — RE-MEASURE`; that counts `portal/ui` commits since the fixture was recorded, not a mismatch. `node scripts/portalGeometry.mjs --realm analytics --check` is the real answer |

## 🔴 THREE SUSPECTS, NAMED AND PRE-MEASURED — start here

*These are not hunches. Each was found by grep on 2026-09-01 19:00 EDT while writing this prompt, and each is an instance of a defect class that has already shipped on three realms.*

**1 · `analytics.js:694` passes `tone: 'bad'`, and `.stat.bad` HAS NO RULE IN EITHER STYLESHEET.** The only masthead tones defined anywhere are `.stat.warn .v` and `.stat.stg .v` (`app.css:120`, `:1729-1730`). So a 24-hour error count meant to read as a warning paints in ordinary ink. **This is the fourth instance of the same defect**: `home.js:229` carries a comment recording it for a `tone: 'live'` that styled nothing, and Access shipped both `'hot'` and `'bad'` until Part 4. The fix is `tone: 'warn'` — but **check the design first**: on Access the mockup gave the equivalent stat no tone at all, and matching that was the right answer for one of the two.

**2 · `const LEVEL_ROW = { error: 'lvlb lv-error', warn: 'lvlb lv-warn', info: 'lvlb lv-info' }` (`analytics.js:127`) is a class-name lookup table** — the exact shape of Armory's `RANK_KEY` (which emitted `t-t3` against `.t-top3`, so four of five tier rules had never applied) and Broadcast's `PILL` (which emitted `stag`/`sched`/`exp`/`conf` against `.stt.saved`/`.stt.staged`/`.stt.conflict`, so every staged row rendered with no state shape). **Both stylesheets define `.lvlb.lv-caution` and `.lvtag.lv-caution`, and `LEVEL_ROW` cannot produce `lv-caution`.** Either the level vocabulary lost a value or the rule is dead on both sides — `lv-caution` is already sitting in `portal/fixtures/reverse-orphans.json` as accepted debt, **which is exactly where the other two hid for weeks.** ⚠️ Read the baseline file itself, not just the exit code: a ratchet's baseline is by construction a list of things already agreed to live with.

**3 · Several classes are built from DATA rather than from a closed set** — `class=${'rivk ' + r.kind}` at `:54`, and the label maps `KIND_LABEL`/`OUTCOME_LABEL`/`ENTRY_LABEL`/`ACK_BUCKET_LABEL` all fall through to the raw key (`KIND_LABEL[r.kind] || r.kind`). A value the map has never seen renders **the stored enum, verbatim, to a reader** — precisely the Armory Category-column defect, where the same enum came out spelled three different ways across a column and two dropdowns. The reverse-orphan scan cannot resolve these; its own output lists `ackrow… depb… dline… durrow… lv-… lvl… off… oos… s-…` as *"dynamic prefixes this scan could not resolve (annotation only, never a certification)"*, and **most of that list is this realm.**

**Also worth one grep:** `analytics.js` passes only `manifestSlot` to `Shell`. `meta`, `realmKey`, `contextSlot`, `stateKey` and `footSlot` all exist and are unused. On Access, two of those slots existing-and-unused was the whole reason the realm had grown a duplicate panel header — so the question to ask is *does the design draw a meta line or a key here*, not *should I add one*.

## Two rules no document carried until a cold reader was forced to choose

**`portal:states` goes red and it is the known local coin-flip** — roughly 1 in 2 in-suite, 1 in 5 standalone, on a different state each run. Re-run that state **alone, once**. Passes alone but fails in-suite → the documented load-dependent non-determinism; file it with the state name, selector and timeout, and 🔴 **do not claim the machine floor green at that commit.** Fails standalone twice, or names a selector you edited → it is yours, immediately. **Never re-run until green and move on** — a red run with no defect behind it sends the next session hunting a ghost. ⚠️ **The sound test is whether the failing selector belongs to anything you edited**, not whether a standalone run passes.

**A defect in a CLOSED realm, found while working this one.** Renders through a shared surface (`shell.js`, `manifest.js`, `app.css`) → **fix it now**, and re-run that realm's geometry fixture in the same commit. Lives in the closed realm's own file → **file it**; §0.8 froze Season's coverage and a later finding is a §L row 7 sweep item, never a reason to reopen. **Either way, do not ask.**

## The traps that cost Part 4 real turns — all five are mechanical

| Trap | What it looks like | The rule |
|---|---|---|
| **Backticks in an HTML comment inside a template literal** | `SyntaxError: Unexpected token '.'` pointing at a line of prose | **Even a MATCHED pair closes and reopens the literal**, and the text between them is parsed as JavaScript. Cost two turns in one session, twice, after being written down. Put **no** backticks in a comment that sits inside an `html` template |
| **The partial `python3` batch** | Six "done" lines and an unchanged file | Write before you print; verify by reading the file back. See *The mode* above |
| **`</code>` followed by a comma** | `portalUi.test.js` fails on `no inline <code> chip is immediately followed by punctuation` | An inline chip is a BOX with horizontal padding, so a comma after one lands a chip's width from its word. Separate a list of chips with a middot or a word, never a comma |
| **A line ending in a word whose next line opens with a tag** | `portalUi.test.js` fails on `no sentence wraps straight into an inline tag` | htm drops the whitespace-only node across the newline and the two words render as one. End the line with an explicit space expression, or keep the sentence on one line |
| **Hard-wrapped code comments** | `docs:reflow-comments --check` reports `N block(s) reflowed` and the suite is red | `npm run docs:reflow-comments -- --write`. Prose in this repo is **one logical line per paragraph**, and it is a blocking gate for code comments too |

**And one that is not mechanical:** the reverse-orphan baseline moves in **both** directions. A class you START emitting must come OUT of it (`node scripts/portalReverseOrphans.mjs --write`, **in the same commit**), or the suite reports `1 fixed but still in the baseline`. Part 4 hit this twice, on `locked` and on `ownly`.

## Two things already settled — do not re-investigate

1. ⚠️ **A `.panel` rendered above the Shell's view panel makes that panel RECESSIVE.** Both stylesheets carry `.panel + .panel{background:transparent}`. Armory paid for this once with a stray paragraph — every row of a 125-row table painted `--raised` against the design's `--desk` — and Part 4 reintroduced and caught it within one converge pass. The mockups wrap their own leading notes in a **plain** div for exactly this reason. If you add anything above the view panel, wrap it.
2. ⚠️ **`--why` cannot resolve a class built by a nested ternary and says so only by reporting the class as dead.** On Access it reported `.pend`, `.inherited` and `.locked` as *"emitted by — nothing"* while the code demonstrably emitted all three. **Read the emitting line before believing any `--why` answer about a computed class.** ⚠️ **And `.locked` was BOTH**: a scanner artefact AND genuinely unreachable, for two unrelated reasons. *Two causes, one symptom* — do not stop at the first explanation that fits.

## 🔴 BEFORE YOU TRUST A CLEAN REAL-SERVER WALK: can the dev data REACH this realm's states?

Analytics's subject is health, usage, timing, reach and search — **every one of which is a derived aggregate over event data**, and the dev database is not production. `portal:realwalk` mints a session and walks the page; it does not tell you whether any interesting value exists behind it. **If every figure is zero and every chart is empty, the walk reports clean and the clean reading is worth nothing** — §0.10's *identical readings across variants that must differ = never arrived*, one level up.

**So count before you conclude.** Against `.env.dev`'s localhost Mongo: how many `AnalyticsEvent`s, over what date span, with how many distinct outcomes, entry points and error levels. Part 4 did this with a short `node --env-file=.env.dev -e` script against `mongoose` and it took one call. **If a state the realm exists to draw cannot be reached, say so in the summary as a coverage limit of the pass**, exactly as `portalDiff` prints the axes it does not cover. Seeding is out of scope; **naming the gap is not.**

## How to decide whether a difference is worth a pop-up

🔴 **Measure both sides FIRST.** Two of §0.8's HITL rows were retired without asking once measurement showed there was nothing to decide. Harkirat, when shown the one real difference: *"why are you being so closed minded and relying on me for tiny things like this when you're literally capable of these judgement calls on your own."*

**What is genuinely his** is a difference in **KIND rather than in pixels** — a surface composed differently on the two sides, where reversing the choice later is expensive. Part 4 had two (a view tab versus an always-visible panel; an inline composer versus a drawer), batched them into **one** pop-up at the START with a recommendation on each, and got both recommendations accepted. **That is the pattern: one pop-up, early, every fork in it, each with your recommendation and its cost.** Everything else: decide it, and say what you decided and why.

## Out of scope, do not reopen

Redesigns wait for **all six realms** (`CLAUDE.md`, re-affirmed 2026-08-31 against my own argument — do not re-derive it; a rule he set does not lapse because you can no longer see its original reason). 375×812 is a decision, not a gap. `core/ops` and the operation algebra. Refactors. **Never push, open a PR, or ask about either.**

## What Part 4 was CONFIDENT of and wrong about

*Every carrier records what was done and what was decided. None records what the author believed at hour four that turned out false at hour six — which is the only content that tells you which kinds of confidence to distrust.*

| Believed | Actually |
|---|---|
| Part 4's prompt: the grid's `.mxgrp` colspans come from `accessScopes` order, so appending a command mis-groups it, and the overlay cannot see it | **Does not reproduce on either side.** Both derive their spans. Checked on the real server, where the prompt said it would show |
| `.locked` is a `--why` scanner artefact | It was that AND genuinely unreachable, because the owner is not an `AdminUser` and the branch emitting it could never run |
| Six scripted edits had landed, because six lines printed saying so | Nothing was written. The exception fired before the single write call |
| `npm test` exited 0 because the harness reported the background task as "exit code 0" | The harness reported the **wrapper's** exit. `npm test exit=1` was printed in the log above it. **A pipeline exits with its LAST command's status** |
| The realm was near-done once converge and the page diff went quiet | `portal:inventory` then produced two more real defects, one of them a legend naming a mark that was not drawn |

🔴 **Four of these were caught by an instrument or a check, not by re-reading my own reasoning. Assume the same of yourself: you will be most wrong where you are most fluent.**

## Before you hand this on

🔴 **§L condition ⑥ — run the READER TEST on Part 6's carriers and fix everything it finds.** Three agents, no transcript: one starts the next Part and lists every place it cannot · one falsifies every checkable claim · one gets **forced choices under the contradictions, a 15-call execution plan and an adversarial pass**. 🔴 **The third shape finds what the first two cannot** — a reader can quote a document correctly and still do the wrong work, so ask what it would DO, and refuse *"the documents disagree"* as an answer. ⚠️ **The read guard will tell your agents they have already read files they have not** (it inherits your read-state; the harness sends no agent field) — tell them to override with `offset: 0`.

⚠️ **§L's same-commit rule: a commit touching any `portal/ui` file whose diff does not touch this plan is a violation.** Part 4 shipped three such commits before folding its §L row in at the end. Update §L row 5 as you go, not once at the finish.

## Closing

§L's seven conditions, and the seventh is Harkirat looking. **Never write "done" — he decides that.** The deliverable is the servers running and the URLs side by side:

- mockup — `http://localhost:8900/docs/superpowers/mockups/2026-08-23-portal-interactive/analytics.html`
- portal — `http://localhost:8901/harness.html?fresh=1&b=<any number>#/analytics` — **the `b=` cache-buster is not optional**; without it the page can come from bfcache and you review the previous build
- real — `http://localhost:8787/#/analytics`
