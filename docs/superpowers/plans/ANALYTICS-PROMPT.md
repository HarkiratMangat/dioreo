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

**5 · What you may do without asking.** 🟢 **Commit on the branch freely** — do not ask, and do not batch a session's work into one commit. 🟢 Run every portal instrument. ⛔ **The §L ⑥ reader agents need his approval and run LAST** — see *Before you hand this on*. ⛔ **Never** push, open a PR, merge, or ask about any of them.

**6 · 🔴 A LIVE CONSTRAINT FROM 2026-09-01 19:04 EDT, AND YOU MUST CONFIRM IT RATHER THAN ASSUME IT.** Harkirat, mid-session: *"stop running full test suites, wait for the full suites until i approve pushing. Either run no tests or run very minimal scoped tests only until then."* He said it while Part 4's branch was unpushed, so **its scope is "until the push is approved", not "forever"** — a `npm test` costs several minutes and he was watching them stack up. **Run the SCOPED gate that covers what you touched** (`node scripts/portalUi.test.js`, `node scripts/portalReverseOrphans.mjs --ci`, `npm run docs:reflow-comments`, `node scripts/portalGeometry.mjs --realm analytics --check`, and 🔴 **this realm's OWN two, which an earlier version of this list omitted** — `node scripts/portalAnalytics.test.js`, which reads `portal/ui/analytics.js`, `portal/api/analytics.js` and `commands/bot.js` as source and asserts the two panels count the same population, and `node scripts/portalExport.test.js`, which reads the five export scopes as source literals. Edit the boot card, the admin toggle or `exportScopes` without them and the four generic gates stay green until the full suite runs) and save the full suite for the moment before the push. ⚠️ **§L condition ④ still requires a full green re-run at the commit you claim it for** — so the full suite is deferred, never dropped, and the claim waits with it.

**7 · What ends Part 5** — copied out of §L so you need not open it: ① `portal:converge` enumerated *(run the named tool — never `portal:audit`'s ① section; that exact substitution was caught on Broadcast while `portal:status` printed `converge · never` in the same tree)* · ② `portalDiff` reports exactly the cited region set on all five views · ③ `portalInventory`'s six lists empty or dated-cited · ④ machine floor green **re-run at the commit you claim it for** · ⑤ a real-server pass · ⑥ the reader test on Part 6's carriers, everything it finds fixed · ⑦ Harkirat has looked.

---

## The two lines §0.0 requires before any task content

- `/rename <YourModel>-High · Analytics conformance · <Mon DD>` — 🔴 **name the model you are ACTUALLY running on, which is in your environment block.** Part 4 opened with `Sonnet5-High`, ran the whole session on Opus 5, and stamped `Co-Authored-By: Claude Sonnet 5` into six commit trailers before Harkirat caught it: *"sir... you are on opus 5, not sonnet 5."* The trailers were rewritten with `git filter-branch` on the unpushed branch. **The rename string and the trailer are statements of fact about the runtime; the grid below is a recommendation about the work. They are different things and only one of them is yours to choose.**
- `Premise Low · Delib High -> Sonnet5-High` — the audit produces the findings, so the facts are given and checkable; the load is breadth across sites.
- ⚠️ **AND THE ESCALATION EVENTS ARE PREDICTABLE ON THIS PASS, so watch for them rather than pre-empting them.** The gate's rule is Sonnet→Opus at the same effort when *a premise turns out false* or *a silent-failure surface appears*. Part 4 fired both and never re-derived: the plan's `.mxgrp` colspan warning did not reproduce, and two silent-failure surfaces showed up (a `python3` batch that printed six successes and wrote nothing; a hook self-test whose harness could not express the difference it was checking). **If either happens here, re-derive in the `Premise <X> · Delib <Y> -> <Cell>` shape and say so — do not just keep going.**

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

Then two **MCP tool calls — not shell**: `preview_start {name:"repo-static"}` (:8900, the mockup, serving the repo ROOT so a bare `:8900` is a directory listing) and `preview_start {name:"portal-harness"}` (:8901, serving `portal/public`). 🔴 **THE PREVIOUS VERSION OF THIS PARAGRAPH WAS A STOP CONDITION WRITTEN AGAINST A STRING THE TOOL NEVER EMITS, AND IT FIRED ON THE NORMAL CASE.** It said the only benign failure is the literal `port in use`. What `preview_start` actually returns when a peer session left the servers up is *"Port 8900 is in use by \"Python\" (PID …) (not a preview server). Ask the user: does this server need port 8900 specifically … set autoPort"* — which under the old rule classified as real, and stopped the run at minute four to ask you to edit `.claude/launch.json`. **Any failure whose text names an already-bound port is benign.** Prove it in one batch and carry on: `lsof` to see what holds the port, `curl -s -o /dev/null -w "%{http_code}"` against all three realm URLs, and `ps -o command= -p <pid>` on 8787 to confirm it carries `--env-file=.env.dev`. If all three answer, **you need no `preview_start` at all** — the servers are already correct.

⚠️ **THE DECISION LEDGER'S ONLY ANALYTICS ROW IS A LIVE WARNING AND NO CARRIER POINTS AT IT.** `docs/reference/portal-decision-ledger.md`'s cross-realm `--ctl-min` / `--ctl-pad` / `--ctl-rad` row says the design's control tokens were adopted app-wide but *"Verified on Season and Broadcast only — Armory, **Analytics** and Review were never opened after it"*, with the falsifier *"a realm shows button metrics that look wrong"*. ④ STYLE will report control height, padding and radius differences across many buttons. **Triage them against that row before filing any of them** — otherwise a whole ALREADY-SETTLED bucket gets worked one row at a time. (`docs/SESSION-START.md` contains the word "analytics" zero times, so nothing else will tell you.)

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

🔴 **BUT INVERT WHICH SECTION YOU TRUST ON THIS REALM.** Access's grid is derived from a fixed registry, so a COUNT mismatch there *is* a defect. Analytics's counts come from fixture folding that differs **by design** — `portal/ui/harness/stub.js`'s `foldByCommand()` groups by command exactly as `computeUsageStats` does, while the mockup's `cmds()` lists command+subcommand rows — so `.ub2`, `.durrow` and every per-command signature carry a permanent, correct DIFFERENT-COUNT divergence, and "fixing" it reintroduces the >100%-share defect that stub's own comment records. **The decisive section here is ONLY-IN-ONE-SIDE**, because `sig()` includes the tag name: `button.tile` vs `div.tile`, `button.lvlb.lv-#` vs `div.lvlb.lv-#`, `button.ub2` vs `div.ub2` are the interaction-tier finding surfacing as signatures.

## 🔴 THREE FILES, AND THE PASS DID NOT HAPPEN WITHOUT THEM

**Create all three BEFORE the first audit, not at the end.** At hour six writing is the first thing cut, so these are preconditions rather than deliverables. ⚠️ **Part 4 produced ONE of the three and an earlier version of this section named only the one it had made**: `ls local/` shows `season-triage.md`, `armory-triage.md`, `broadcast-triage.md` and three difference ledgers — and for Access only `locate-access.md`. Its triage and its band-capture readings died with the session.

**① `local/locate-analytics.md`** — one row per item: item · verdict (mockup only / portal only / both / neither) · citation · what it implies. §0.5b: *"🔴 IT PRODUCES A NAMED ARTIFACT, or it did not happen."* It is the input to ③ and ⑤, and it is what stops a diff becoming a rollback. `local/locate-access.md` is the shape, nineteen rows.

**② `local/analytics-triage.md`** — every ②③④⑤ audit row sorted into CITED / DEAD-ON-BOTH / ALREADY-SETTLED / FIX, each citing an audit line or a code comment. A row citing a *probe* is itself the violation (§0.4b), and in a file it is visible. 🔴 **And two lines in here after EVERY band capture, saying what the band showed.** §0.46 makes the looking the deliverable and nothing else holds its output — cropping three bands, reading them, and writing nothing down is the most expensive work in this method thrown away.

**③ `local/difference-ledger-analytics.md`** — every difference either eliminated or written down with a dated citation for why it stays, plus a UX-copy section with one row per row of `local/handoff/2026-08-25-portal-ux-copy-audit.md` (⚠️ **gitignored, so no `rg` surfaces it; open it by path**; its sections A–G are realm-shaped and its **vocabulary table is cross-realm**, so a word changed here changes everywhere). This file **is** §L condition ②'s cited set. ⚠️ **Access is the exception and deliberately so**: its cited set lives in the TRACKED `docs/reference/portal-decision-ledger.md` § Access, which is strictly better than a gitignored copy — so if you put yours there instead, say so rather than leaving both empty.

**State all three paths in the closing summary.** They are gitignored and invisible to `rg`, so a path nobody states is a file nobody finds.

🔴 **THE AUDIT'S ANALYTICS LINE NUMBERS ARE STALE, AND AN EARLIER VERSION OF THIS PARAGRAPH PASSED THEM ON WHILE CLAIMING TO HAVE PRE-READ THEM. Re-check every citation against today's file before acting on one.** Measured 2026-09-01 19:44 EDT:
- *"the old in-memory undo Map"* at `analytics.html:534` — **the string does not exist.** `rg 'undo Map|in-memory'` over the file exits 1; the word `Map` appears zero times. `:534` is a `rowmeta` span.
- *"a near-bare 'nothing matches' empty state"* at `:498-499` — `:498-499` is `function river() { const rows = [];`. **The real empty state is `:536-539` and it is not bare**: *"**Nothing matches that.** Clear the search or a filter — N alerts, N changes and N deploys are recorded in total."* It names the action; it does not echo the term. Its template is `season.html:2431`, not `:2252`, which is a board card.
- The *"Search the river"* F-row **does not reproduce** — but the audit cites `:56` and the label is at `:61`, reading `Search alerts and changes` and matching its placeholder. Right conclusion, moved line, and an earlier version re-cited it silently rather than saying it had moved. ⚠️ "river" also appears in comments and as the function name `river()`; the audit's objection was only to it reaching a reader.

**The lesson is this document's own opening promise applied to itself:** *where a figure and a tool disagree, the tool wins* — and it was not applied to a row that said the reading had already happened.

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

⚠️ **THE EYE IS LOOKING FOR A DIFFERENT CLASS OF THING HERE, AND CHASING THE WRONG ONE MANUFACTURES FINDINGS.** Access had a field of identical cells, so a mark defect stood out. Analytics has bars whose widths encode **different denominators by documented choice** — `pct(hit.c, outcomeTotal)` in `analytics.js` against `pct(hit.n, F.OBS_TOTALS.events)` in the mockup — so nearly every bar length differs legitimately and eyeballing lengths is noise. **What the bands are for on this realm is a PANEL that exists on one side only**, and there are already two: the portal draws `DailyBars` ("Alerts per day" / "Commands per day", `analytics.js:97`) which the mockup has nowhere, and the mockup draws **"Where the milliseconds go" on Health** (`analytics.html:154`) where the portal draws it on **Timing** (`analytics.js:426`). A Health band will show two panels sharing no content; cropping tighter will not help.

## What is actually true about Analytics

| | The command that produces it |
|---|---|
| 🔴 **"1 handler" IS A FACT ABOUT CODING STYLE, NOT ABOUT INTERACTIVITY — AND THE WHOLE "near-static realm" FRAMING WAS BUILT ON IT** | `scripts/portalStatus.mjs:27` counts `/addEventListener\|onclick=/` **over the MOCKUP page**. `analytics.html` has one `addEventListener` and **twelve** handlers wired by property assignment (`b.onclick = `, which that regex cannot see) — including `tr.onclick = open` at `:548`, **a drawer opened from a table row, the surface `--triggers` structurally cannot list**. So the interaction tier is the LARGEST unmeasured surface here, not a small one. ⚠️ §L rows 5 and 6a state the same conclusion from the same tool run, so do not read them as corroboration — that is one measurement quoted twice |
| **44KB, and the byte count** | `npm run portal:status` prints 44KB; **`wc -c`** gives 46,107 — ⚠️ **not `ls -l`, which is rtk-wrapped here and prints `45.0K`**, so an earlier version of this row named a command that does not produce its own number |
| **Five views: Health · Usage · Timing · Reach · Search** | `npm run portal:status`, and they match `analytics.html:33-37` exactly |
| **9 distinct `data-*` names / 32 occurrences** in `analytics.html` | `rg -o 'data-[a-z-]+' <file>`. ⚠️ **Nothing in `scripts/` prints a per-realm data-attribute count**, so any such figure in §L has no producing instrument and is a hand count — this one included, and it was hand-counted 2026-09-01 19:00 EDT |
| **`portal/ui/analytics.js` is 706 lines with 3 `onX` prop sites, 3 distinct** | `wc -l` and `rg -o '\son[A-Z][A-Za-z]*='`. **A near-static reference, not an interaction realm** — §L's own row says so, and the interaction tier is correspondingly small |
| **Four of five instruments have run** | `portal:status`'s receipt board reads `audit ✅ 09-01 · inventory never · diff never · converge never · realwalk never` — an earlier version of this row said `· never` across all five, which was already false when it was written. ⚠️ Receipts are gitignored, so this is true of THIS tree and not of a fresh clone |
| 🔴 **The resting numbers, measured 2026-09-01 19:44 EDT so you can tell progress from noise** | ② SHAPE by view: **Health 141 · Usage 93 · Timing 106 · Reach 85 · Search 80**. ③ WORDS 17/11/14/8/9. ④ STYLE 135/110/114/99/117. ⑤ RULES is 2011/40/40 on every view — **identical across all five, so it is cross-realm and not this realm's work**. `portalDiff --portal harness` **12.7%, 43 regions, the portal 403px TALLER**; converge **69 mismatches of 62 design nodes**, WORDS 31, STYLE 9. `--triggers` mk 28 · pt 22, with **13 mockup-only** (the four Health tiles and the three level rows among them) |
| ⚠️ **① CASCADE is the same row on all five views** | `span.v top 126→104 (-22) h 22→44 (+22)` at `>div.masthead>div.mh-stats>span.stat>span.v`, with 123–200 offsets below it. **It is the masthead stat block, and it is finding 1 below.** Fix it alone, then re-run |
| ⚠️ **The drift counter is not a failure signal** | `portal:status` shows `🔴 N — RE-MEASURE`; that counts `portal/ui` commits since the fixture was recorded, not a mismatch. `node scripts/portalGeometry.mjs --realm analytics --check` is the real answer |

## 🔴 TWO FINDINGS, MEASURED ON THE RUNNING PAGE AND IN THE DEV DATABASE — and one thing that is NOT a defect

⚠️ **AND READ §0.5b's ORDERING RULE BEFORE STARTING HERE: the LARGEST region is addressed before any smaller one.** A short list of pre-named items at the top of a document is an easy-end incentive — it produces a commit that closes "suspect 1" without touching the finding, which is exactly what a one-token `tone` fix would have done against a four-versus-three stat set. **Finding 1 below is also the ① CASCADE on all five views**, so it happens to be both the largest and the first; that is luck, not a rule. Check the region sizes yourself.

*An earlier version of this section listed three "suspects" from greps. One was mis-framed as a token swap when it is a composition difference, one was offered as a disjunction whose both branches are wrong, and the third is not a defect at all. All three were re-measured 2026-09-01 19:44 EDT by an agent that ran the page; what follows is what it found, verified again here.*

**1 · THE MASTHEAD IS FOUR STATS AGAINST THREE, AND IT IS ALSO THE ① CASCADE.** `analytics.html:17-21` draws **interactions** (lead, accent) · **succeeded** · **errors** · **worst ack**, and its error stat is `class="stat warn"` **unconditionally**. `analytics.js:692-695` draws **uptime** · **errors 24h** (tone conditional) · **commands 24h** (lead). So: a different count, three different labels, a different lead stat — and the `tone:'bad'` token, which styles nothing because `.stat.bad` has no rule in either sheet (only `.stat.warn .v` and `.stat.stg .v` exist, `app.css:120`, `:1729-1730`). **Confirmed by eye:** the mockup's `ERRORS 5` is `--warn` orange `rgb(255,122,69)`; the portal's `ERRORS 24H 23` is plain `--ink` white. ⚠️ **Fixing only the token leaves three of four stats unmatched**, and this block is the ① CASCADE row on all five views, so it moves everything below it. It is a composition row for `local/locate-analytics.md`, not a one-line edit.

**2 · 30.6% OF ALERTS RENDER AS `info`, AND THE PANEL EXPLAINING THREE TIERS DRAWS ONE.** This is a live silent-wrong-render, not a dead rule.
- `models/AlertLog.js:9` documents **four** levels: `info | caution | warn | error`. `LEVEL_ROW` (`analytics.js:127`) covers `error`, `warn`, `info` and **cannot produce `caution`**.
- Measured against `.env.dev`'s Mongo: **`info 678 · caution 306 · error 16`**. **`warn` never occurs at all.** So the map carries a key for a dead value and misses a live one, and `LEVEL_ROW[a.level] || LEVEL_ROW.info` (`:203`) paints **306 of 1000 alerts as the grey no-severity tier**.
- **Both stylesheets already define `.lvlb.lv-caution` and `.lvtag.lv-caution`.** The rule is not dead — the emitter is. `lv-caution` sits in `portal/fixtures/reverse-orphans.json` as accepted debt, exactly where Armory's `RANK_KEY` and Broadcast's `PILL` also hid.
- **Visible on the page:** the mockup draws three level bars — `INFO 717 · CAUTION 258 · ERROR 23` — and the portal draws **one**, under a paragraph the portal itself wrote: *"Three tiers, and they never collapse into one number: info is a record, **caution** is a look-when-convenient, error pings a human."*
- One more, in the same file: `analytics.js:61` is `class=${`lvtag lv-${r.level}`}` — **concatenated**, contradicting the comment eight lines above `LEVEL_ROW` that declares *"THE CLASSES ARE LITERALS, NOT CONCATENATED."* The guard is half-applied.
- ⚠️ **And the two sides disagree about the vocabulary**: the mockup's sheet defines only `lv-caution` and `lv-error`, the portal's defines all four. Design vocabulary is **info · caution · error**; the portal's live one is **info · warn · error**. That is a UX-copy question as well as a rendering one.

🔵 **NOT A DEFECT — CHECKED, CLEARED, DO NOT CHASE IT.** The data-built classes. `class=${'rivk ' + r.kind}` at `:54` looks like an open set and is not: `r.kind` is set from three string literals inside `river()`, and **`.rivk.change` / `.rivk.alert` / `.rivk.boot` all have rules in BOTH stylesheets** (three matches a side). `OUTCOME_LABEL` carries all six schema values, `ENTRY_LABEL` all seven, `ACK_BUCKET_LABEL` is keyed off a closed array three lines above it. The `|| key` fall-through is **documented as deliberate** at `analytics.js:20` — a graceful-degradation net for an enum owned by `models/AnalyticsRollup`, because *"a list retyped in a browser file is how the schema's own copy went stale."* ⚠️ The reverse-orphan scanner's *"dynamic prefixes this scan could not resolve — annotation only, never a certification"* line was quoted at this as evidence FOR it; it is the scanner correctly declining to certify, and the hand check clears it.

## What the instruments cost, and how to not pay it twice

**The five `--all` audits total ~2,640 lines.** Redirect each to its own file in ONE batched call, then pull the section headers rather than reading the dumps: `rg -n '^[①②③④⑤]' /tmp/a-*.txt` gives you the counts, and you open only the sections you intend to work. An earlier version of this document said "read the sections you need" without saying how, and that alone cost five calls.

**⚠️ `portalDiff --realm analytics` (real) OVERWRITES the same two PNGs `--portal harness` writes.** Follow this document's order — crop the bands, then run condition ⑤ — and the real-server run silently replaces the captures you were told to look at. Crop and `Read` before the real pass, or copy them aside.

**⚠️ `portal:probe` returns nothing useful for a selector that exists on one side only** — just `MISSING ON THE MOCKUP · present on the portal`, no computed properties. That is exactly the shape of finding 1, so use `portal:converge`'s STYLE section for it instead.

**⚠️ The dev-Mongo count must be inline `node --env-file=.env.dev -e` from the repo root.** A scratch file under `/tmp` cannot resolve `mongoose` from `node_modules`.

**⚠️ `rg -r` is `--replace`, not recursive**, and `-rn` silently replaces every match with `n`. This document sends you grepping constantly; the standing hook catches it, but it costs a call.

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

🔴 **THE ANSWER IS ALREADY MEASURED — 2026-09-01 19:44 EDT — so do not spend the calls re-deriving it, spend them deciding what it means.** `alertlogs.createdAt` spans **2026-08-11 → 2026-08-27**, `analyticsevents` **2026-08-12 → 2026-08-27**, `changelogs` **2026-08-21 → 2026-08-22**. Every Health, Usage, Timing and Reach figure is a **rolling 24-hour or 7-day aggregate**, so on the real server today they are **all zero** — the real-server diff shows uptime `0h 0m` and the level bars reading `TODAY 0 · −1D 0 · −2D 0` against the harness fixture's `1h 30m` and `TODAY 1`.

**So `portal:realwalk`'s five green ticks certify REACHABILITY, not the correctness of any populated state**, and the real-server pass cannot exercise a single populated aggregate with the data present. ⚠️ **Say that in the summary as a coverage limit of the pass**, exactly as `portalDiff` prints the axes it does not cover. Seeding is out of scope; **naming the gap is not.** Re-measure the spans if the dev database has moved — the shape of the limit will hold, the dates will not.

## How to decide whether a difference is worth a pop-up

🔴 **Measure both sides FIRST.** Two of §0.8's HITL rows were retired without asking once measurement showed there was nothing to decide. Harkirat, when shown the one real difference: *"why are you being so closed minded and relying on me for tiny things like this when you're literally capable of these judgement calls on your own."*

🔴 **AND THE CALIBRATION IS ACCESS'S, NOT THIS REALM'S — ANALYTICS HAS AT LEAST SIX FORKS, NOT TWO**, several of which the portal chose against the design and documented in its own comments: the river is **5 columns with a `Source` column** against the design's 4 (`analytics.js:52` vs `analytics.html:74`, and the geometry fixture already records `cols: ["","When","Kind","Source","What","Who"]`) · Usage's fourth column is **share** where the portal's own comment says the mockup's is duration · the export scope set (five a side, two shared ids) · the masthead stat set (four against three) · the admin switch sits in the **masthead** in the portal and inside the panel header beside the view tabs in the design · and which view owns "Where the milliseconds go". **One pop-up carrying all six, each with the portal's existing citation** — batching two was right for Access and is wrong here.

⚠️ **One of them is a ③ WORDS finding hiding in a label map, not a fork:** `KIND_LABEL = { change:'CHANGE', alert:'ALERT', boot:'BOOT' }` (`analytics.js:16`) against the mockup's `{ alert:'Alert', change:'Change', boot:'`**`Deploy`**`' }` (`analytics.html:521`) — case *and* vocabulary, and the chip row repeats it (mockup **Deploys**, `RIVER_FILTERS` **boots**). Decide that one yourself.

**What is genuinely his** is a difference in **KIND rather than in pixels** — a surface composed differently on the two sides, where reversing the choice later is expensive. Part 4 had two (a view tab versus an always-visible panel; an inline composer versus a drawer), batched them into **one** pop-up at the START with a recommendation on each, and got both recommendations accepted. **That is the pattern: one pop-up, early, every fork in it, each with your recommendation and its cost.** Everything else: decide it, and say what you decided and why.

## 🔴 THE FIVE CONTRADICTIONS BETWEEN THE CARRIERS, ALREADY RESOLVED — do not re-litigate them

*A reader test was forced to choose under each of these and refused "the documents disagree" as an answer. These are its resolutions, and the cost column is why.*

| Conflict | Obey | Because | Cost of the other choice |
|---|---|---|---|
| **Which instrument is first** | The ordering above for build and servers — but **move the crop-and-look AHEAD of the five `--all` audits** | §0.5b's *"a Part opens with those two screenshots, before any tool that returns a number"* is the rule with a measured failure behind it, and this document's own text says *look, early* while placing it fifth | 2,640 lines of audit dump enter context before you know what the page looks like, then get re-read once the crops reframe them. That is Part 4's turn count, and it is how a black bar through every cell survived five audit sections and a green suite |
| **The full suite** | Scoped gates during the pass; the full suite once, at the final commit. **If it does not run, DO NOT CLAIM ④ AT ALL** — write "④ not claimed; scoped gates green at `<sha>`" | His live instruction outranks a plan section, and ④ is a CLAIM. Withholding a claim costs nothing; substituting scoped gates for it is the failure both prior Parts recorded | A §L row reading "machine floor green" that is false, invisible, and has already shipped twice |
| **A redesign spotted mid-pass** | **FILE it** — and the discriminator is what the MOCKUP draws, not how bad it looks. Portal renders something the mockup does not → conformance, fix now. Both sides agree and the result is poor → redesign, file. A shared-surface **defect** → fix now, plus every closed realm's geometry fixture in the same commit | "Close it now" is scoped by *does it render on this surface*; a redesign passes that and fails a taste test, which is a different question. All-six-first was re-affirmed against a plausible counter-argument | Fixing manufactures a diff region on the surface being graded, which you then cite as a permanent difference of your own making |
| **Who closes a realm** | **Harkirat, at the two live URLs.** Your output is `◐` with the sub-state named and the seven conditions' evidence. Never `☑`, never a changelog `(#PR)`, and no A/B artifact unless a still frame settles something the live pages cannot | §0.7d is the latest artifact and it is his own decision — he dropped the A/B artifact for Season, which says the artifact was never the useful part, the looking is | Treating the changelog and the artifact as blockers **deadlocks the Part**; §L records both cold readers naming that pair as their largest uncertainty, at 20–40 turns each |
| **Whether the percentage matters** | §0.7d. Report the **region enumeration** and the two page heights; state the percentage once, unlabelled as progress, only because the tool prints it | The floor makes it meaningless, and Part 4's own row records it going **UP** between two strict improvements because the portal grew taller and the tool compares over the shorter page | Driving a number produced three false closes, a sweep comparing the portal to itself, and an instrument reading 888px of a 4,378px page |

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
| `1 handler` means a near-static page with a small interaction tier | The metric is `/addEventListener\|onclick=/` over the mockup source. `analytics.html` wires **twelve** handlers by property assignment, including a drawer opened from a table row. **The framing was an inference from a tool output, and §L states the same conclusion from the same run** — so it read as two sources and was one |
| Two UX-copy rows had been "pre-read" | One quotes a string absent from the file; the other cites a function declaration as an empty state and a board card as its template. **Written into a paragraph that asserted the reading had happened** |
| The lock fix on Access had landed | `buildPermissionMatrix` never emitted `ownerOnly`, so it rendered only in the harness — and every instrument in the pass reads the harness. The commit was titled after the defect it did not fix |
| Dropping `.on` removed the inherited ring's source-order dependency | Equal specificity (0,2,0) with `.mxcell.inh`; the ring still won on declaration order alone. **The commit message asserted a fix that had not happened** |

🔴 **Four of these were caught by an instrument or a check, not by re-reading my own reasoning. Assume the same of yourself: you will be most wrong where you are most fluent.**

## Before you hand this on

🔴 **§L condition ⑥ — run the READER TEST on Part 6's carriers and fix everything it finds. EXACTLY TWO AGENTS, no transcript** (Harkirat, 2026-09-01 19:26 EDT — the full split and its reasoning are §0.5c):

- **A · THE WORK** — *executes* Part 6's first phase for real and reports where the document failed in practice (commands that did not work as written, calls actually taken against the batched minimum, the first judgement the document does not cover), **and** attacks YOUR diff: the rollback, the opposite case on each fix, the edge cases, two counts you can make disagree, the other side of every judgement call, a ledger falsifier that can never trigger.
- **B · THE DOCUMENT** — false transfer (which of your lessons will mislead on a differently-shaped realm), omissions costed, perverse incentives, **hour six rather than hour zero**, which passages read as fact but are your inference, every contradiction **resolved** with the cost of choosing wrong, and one paragraph rewritten in full.

🔴 **AND THE ⑥ AGENTS ARE NOT YOURS TO DISPATCH. HARKIRAT APPROVES THEM FIRST, EVERY TIME (2026-09-01 19:27 EDT).** They run at the **END** — after every other condition is met, the records are written and the branch is otherwise push-ready — because their whole value is auditing a FINISHED handoff, and an audit of work still in flight measures nothing that will still be true. ⚠️ **This reverses an earlier standing permission.** `plan-drafting.md` and the Part 4 prompt both said to dispatch ⑥ without asking; that licence produced seven agents in one session, dispatched on my own judgement, three of them killed unread. **Ask, wait for a yes, then run exactly two.**

⚠️ **The two failures that made Part 4's attempt worthless.** It handed the falsifier a list of claims it had already verified itself — **choosing the evidence, so the agent could only confirm it** — and it asked "where can you not proceed", which rewards confusion rather than correctness: a document can be perfectly clear and still produce bad work. **Ask what an agent would DO, and where it would be confidently wrong.** ⛔ And when told the questions were too easy, that session added four more agents instead of asking harder questions — seven in flight, each re-deriving the same context. **The fix for a weak question is never another agent.** ⚠️ **The read guard will tell your agents they have already read files they have not** (it inherits your read-state; the harness sends no agent field) — tell them to override with `offset: 0`.

⚠️ **§L's same-commit rule: a commit touching any `portal/ui` file whose diff does not touch this plan is a violation.** Part 4 shipped three such commits before folding its §L row in at the end. Update §L row 5 as you go, not once at the finish.

## Closing

§L's seven conditions, and the seventh is Harkirat looking. **Never write "done" — he decides that.** The deliverable is the servers running and the URLs side by side:

- mockup — `http://localhost:8900/docs/superpowers/mockups/2026-08-23-portal-interactive/analytics.html`
- portal — `http://localhost:8901/harness.html?fresh=1&b=<any number>#/analytics` — **the `b=` cache-buster is not optional**; without it the page can come from bfcache and you review the previous build
- real — `http://localhost:8787/#/analytics`
