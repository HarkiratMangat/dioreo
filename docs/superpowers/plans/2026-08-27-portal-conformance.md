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
| **0** | Reverse-orphan sweep, scripted and in `npm test` | ☑ closed | `scripts/portalReverseOrphans.mjs` + `.test.mjs` | must report `data-bare`, `hcard`, `srec-open` and `--ci` on its first run or it is not trusted. ⚠️ **NOT `t-best`** — it IS emitted (`armory.js:165`), and a concatenation-aware scanner will correctly stay quiet about it |
| **0** | Mockup-side grid injection, written down once | ☑ closed | `docs/superpowers/mockups/2026-08-23-portal-interactive/assets/shell.js`'s `__instruments()` | `?grid` at boot or `__instruments()` on demand, in the one file all eight pages already load. Proved: `season.html?grid` returned examined **1361**, near **2**, size **33** |
| **0** | The viewport contract, 1282×888 | ☑ closed | `.grid.js`'s `__grid.viewport()` | baked into every reading — a page cannot resize its own window, so each measurement states what it was taken at and an off-contract one says so in the reading itself. `portalGeometry` REFUSES to record off-contract |
| **0** | The states harness (page + driver, catalogue grows per realm) | ☑ closed | `scripts/portalStates.mjs` + `lib/portalStatePasses.cjs` | **18 shell states walk clean** at 1282×888; registry `portal/fixtures/states/shell.json`. PASS 1/3/4 are RELATIONAL; **no PASS 2**. ⚠️ **The row said PAGE + driver and there is NO page** — a JSON registry plus a headless driver replaces `.states.html`, because a page is reachable only by hand while a driver runs in `npm test`. Recording the deviation rather than the tick. **⊘ the page half, deliberately.** ✅ **PASS 5 (reduced motion) IS implemented now** — the media query is emulated, the page is made to CONFIRM it applied (or the state fails rather than examining the ordinary view), and what is still running is read. Season walks clean under it: the Track's 2800ms `pulse` stops. The earlier claim that a rendered walk was the wrong instrument for it was simply wrong. ⚠️ **`refreshing` and `progress` still could not be REACHED**, and chasing them found a real defect — `useAsync`'s `hostClass` was produced and consumed by nothing anywhere in `portal/ui` — now fixed across all seven realms with a conservation check. The two states remain unregistered with both failed triggers written down |
| **0** | Per-realm geometry fixtures — the format and the runner | ☑ closed | `scripts/portalGeometry.mjs` + `.test.mjs` | `--realm <r> --write|--check`, `--all --check` in `npm test`. **Round-trip PROVED 2026-08-28 11:2x EDT — and the first attempt FAILED**: `--check` straight after `--write` reported `Track · nearMisses: 8 → 4` with no code in between, because the first view was measured the instant fonts settled while every later view got a settle after its tab click. Five reads inside one settled page were identical, so the reading was stable and the moment was not. Every view now gets the same settle, **and a reading is only accepted once it REPEATS** — a surface that never stabilises is reported rather than recorded at whatever the last attempt saw. Two writes and a check now agree exactly. No fixture is recorded **on purpose** — a realm records its own when its Part closes |
| **0** | **THE SHELL** — rail · command bar · masthead frame · account panel · tray · toast · overlay · export strip · manifest frame · `async.js`'s six states · tooltip runtime | ☑ closed | `palette.js` · `shell.js` | **Eleven nouns, and the first tick covered four.** Now registered and walked as states, each with an `expect` selector proving it reached its own subject: rail · command bar (closed, open, typed) · masthead · account panel · **export strip** (opens from the button INSIDE `.mh-take`, not the wrapper) · **manifest frame + its selection bar** · **toast** · **tooltip runtime** (`.tip`, delegated from the document) · **one-way panel** · four of `async.js`'s six request states. **Owed and filed, not silently dropped:** `refreshing` and `progress`, which need a refetch and a commit in flight. | **doubled search bar FIXED** — `data-bare` now emitted, measured 44px→16px inside the 34px bar. **A third defect the states walk found: "Copy my Discord ID" acknowledged nothing at all** — both routes were a bare `navigator.clipboard?.writeText(...)`, so on success it said nothing and in an insecure context the optional chain swallowed the whole action. Both now route through one function that toasts on success and says what to do instead on refusal. **And a second defect the shell diff found: the rail, the crumb, the panel title and the command-bar placeholder were all printing the realm ID raw** — a rail reading "season armory broadcast" against the mockup's "Season Armory Broadcast", against COMPANION §2307's explicit rule that `realm` stays in the code and leaves the copy. One `REALM_LABEL` map now serves all four |
| **0** | 🔑 **THE DEV OAUTH SIGN-IN** | ☑ closed | signed in 2026-08-28 10:5x EDT | **Harkirat scanned Discord's QR login from his phone** (screenshotted out of the live page) and authorized in chat; the browser signed in as `diorswrld`, which the dev database already holds as an admin, so the door opened rather than showing the forbidden state. The redirect URI was already registered — step 4 was never needed. **Step 5 passed, and only after the three defects it exposed were fixed** — see the row below. All four test changesets were discarded afterwards; the one pre-existing `draw.edit` was left untouched |
| **0** | **The door / login page** | ☑ closed | measured on the real server | Diffed against `door.html` at 1282: `main.door`, `.doorcard` (430px), `.doormk`, the h1, and the `.dbtn` (360×46, Discord blurple `rgb(88,101,242)`, 6px radius) are identical. Two **portal-ahead** differences, both cited in `shell.js`: the `.doorstate` line, and the OAuth note saying "user ID **and username**" — which is what the `identify` scope actually returns, so the mockup's shorter wording is the stale one. Both door states are in the states registry via `?fail=expired` / `?fail=forbidden` |
| **—** | 🔴 **THE FIRST REAL-SERVER PASS — three defects no fixture could show** | ☑ closed | `season.js` · `review.js` · `board.logic.js` | ⓵ **Every banner edit had always been born BLOCKED.** The editor keyed its payload on the STORAGE field (`drawsBannerUrl`) while `calendar.setBanners` accepts the page name (`draws`), so the op answered *Unknown banner page* and the changeset could never commit. ⓶ **The Review screen threw that sentence away** — it read `failure.reason`, which no validator sets, and printed the generic *"This change no longer validates"* over an error that named the field. ⓷ **A change past character 60 vanished from the diff**: `diffRows` compared FORMATTED values and `fmtDiffValue` truncates at 60, so a ~104-character Cloudinary URL differing only in its tail produced **zero rows** on the one screen that commits. All three are fixed, each with a falsifier; a conservation test now compares the editor's banner vocabulary against the op's own |
| **1** | **SEASON** | ◐ in flight | `222b67a` `99bd908` `26e4af0` `e0331e1` | 🔴 **READ §0.44, §0.45 AND §0.46 BEFORE TOUCHING THIS.** ⓪ **`npm run portal:diff -- --realm season` first**, then `--view Board`, `--view Repairs`, `--viewport 375x812`. 🔴 **THE DIFFERENCE LEDGER IS WRITTEN: `local/difference-ledger-season.md`** (gitignored — state the path). **A/B artifact: https://claude.ai/code/artifact/c4a40347-447c-45fd-9ca9-d5d1835e40e9** — four pairs, `mk-` and `pt-` labelled on every frame, with a flip control that swaps one frame in place. It carries every row below with its evidence, so do not re-derive them. ✅ **Second pass closed eight**: the ADD row right-aligning to `.mh-id`'s edge at x=995 while the export line beneath it ended at x=1260 — `.mh-add`'s grid declarations were inert because `Masthead` rendered it inside `.mh-id`, and **Armory had the identical defect** · the NOW chip, whose `attr(data-now)` producer never existed · the rail casing disagreeing with the clock's on the same screen · the THEN line's missing distance · one absence drawn as two objects in one fold · **Board and Repairs diffed at last** (`--view`, which REFUSES rather than falling through) · **375×812 diffed at last** (`--viewport`; 7.3% in 12 regions) · and the tool's own session, which held three realms of six and was reporting the rail as a difference. 🔵 **Adjudicated, do NOT re-open**: Board's changeset pipeline (spec §F3, recorded at COMPANION's foot) · the one-figure clock and its RIGHT alignment (§16.31a — the `left` rule is `.hclock`, Home's) · the subtitle measure (both sides declare `max-width:62ch`; only the column differs) · the raw id (a data-collection decision needing a PRIVACY amendment, not a conformance fix). 🔴 **STILL OPEN**: Events and Playlists auto-collapsing 20 of 39 Track items · the overview scrubber's mark weight · Repairs implements 3 of §5.2's 6 checks · 4 export formats against 5 · the window range's placement. ⚠️ **The clock, the context band, the one-line draft state and the picture-led banner row are MY design calls**, made after he refused a pop-up — *"USE YOUR DESIGN KNOWLEDGE"* |
| **2** | **ARMORY** | ☐ open | | |
| **3** | **BROADCAST** | ☐ open | | |
| **4** | **ACCESS** | ☐ open | | |
| **5** | **ANALYTICS** | ☐ open | | |
| **6a** | **REVIEW** | ☐ open | | failure mode: correctness |
| **6b** | **HOME** | ☐ open | | failure mode: composition. Target is COMPANION, **not** the mockup |
| **7** | The sweep, the misc, and the double-check | ☐ open | | |
| **—** | Closing DEVLOG narrative entry | ☐ open | | one story, after all the rest |

🔴 **☑ IS A CLAIM ABOUT THE SURFACE, NOT ABOUT THE CHECKLIST.** The four conditions below are activities; a realm can satisfy all four and not match its design, which is exactly what Part 1 did. **A row may not reach ☑ until `portal:diff` has been re-run and every region it reports is either closed or written into the difference ledger with a citation.**

**Status vocabulary, so a tick means one thing:** ☐ open · ◐ in flight *(name the sub-state in Note)* · ☑ closed *(gates green · committed · changelog paragraph written · A/B artifact published)* · **⧗ owed** *(everything done except the real-server pass, which is blocked on Harkirat's OAuth sign-in)* · ⊘ dropped *(with the reason, never silently)*.

🔴 **⧗ IS NOW UNREACHABLE, AND THAT IS THE POINT OF PART 0 HAVING LANDED THE SIGN-IN (2026-08-28 10:5x EDT).** §0.2's rule fires: *"If Part 0 lands it, no later Part may use ⧗ at all."* A Part that wants to close owes a real-server pass and must go and run one — the session cookie lives in Mongo with a 12-hour TTL, so a lapsed one is another sign-in, never a reason to owe.

🔴 **⧗ exists because without it the ledger cannot be honest.** §0.2 requires a real-server pass in every Part, and that needs a sign-in only he can give — so with four states every row either stalls at ◐ forever or gets ticked ☑ dishonestly. **A row may reach ⧗ with the owed pass named in its Note (`real-server pass owed`), and becomes ☑ the moment that pass runs.** Nothing else may be owed.

---

## §0.0 — ONE PART PER SESSION, AND EVERY SESSION WRITES THE NEXT ONE'S PROMPT

🔴 **Harkirat starts a NEW SESSION for each Part.** That is the working shape, decided 2026-08-27 21:29 EDT, and it makes the handoff a **deliverable of every Part**, not an optional courtesy at the end.

**The last thing a Part does, after its closing commit, is print the next Part's starting prompt** — in one fenced block he can copy whole, with nothing above it he has to trim.

**It must carry all six of these, because a new session starts with none of them:**

| | |
|---|---|
| **1 · The model line** | `Model<Ver>-<Effort>` **plus the derivation, in the shape the session-start gate accepts: `Premise <X> · Delib <Y> -> <Cell>`.** Rows are premise risk, columns are deliberation load; effort buys breadth, the model buys judgement. ⚠️ Naming the cell before the axes does not match, and the nudge correctly keeps firing |
| **2 · The rename string** | `Model<Ver>-<Effort> · <Title> · <Mon DD>` — the session-start hook demands it as the literal first output |
| **3 · Read-this-first** | This plan, by full path, and **its §L ledger before anything else** — that is the only place that knows what is actually done |
| **4 · The branch state** | Branch · version · the last commit · what the gates return · **and what is ⧗ owed** |
| **5 · The Part's own opening move** | Not "start Part N" — the first concrete command or measurement, so the session does not spend a turn deciding where to begin |
| **6 · The working contract** | The silent/batched/heredoc/chrome-devtools/no-push block, restated in full. It does not survive a session boundary and a session without it reverts to defaults |

⛔ **The prompt is written AFTER the closing commit, not before** — it has to state the real gate results and the real ledger, and a prompt written in advance states intentions. ⚠️ **And it goes in the reply, not only in a file.** A prompt he has to go and find is one more step between him and starting.

---

## §0 — THE ONE THING THAT EXPLAINS THE REST

🔴 **THE MIGRATION CARRIED THE STYLESHEET AND DROPPED THE MARKUP THAT ACTIVATES IT.** Harkirat, 2026-08-27: *"idk what you were using as reference during the migration but you did not stay true to the mockup design and somehow broke the same things we had already fixed."* That sentence is literally true, and it has a mechanism — which means it has a systematic remedy rather than a bug list.

> 🔴 **THIS TABLE WAS 60% STALE WHEN FIRST WRITTEN, AND A READER TEST CAUGHT IT — inside the plan whose opening argument is that a stale status column is what broke the last one.** Two of its five rows described defects that had been fixed hours earlier in `7cbcd07`, by the same session that wrote the table, while Part 1 below correctly listed them as closed. **The document contradicted itself in its own thesis.** Corrected 2026-08-27 21:2x EDT. The rows below are what is true NOW; the fixed ones moved to the note underneath, because the *mechanism* is the point and they are still the clearest examples of it.

**LIVE, verified against source:**

| Fix | CSS present? | The markup that triggers it | What the reader sees |
|---|---|---|---|
| `[data-bare]` — the search-bar opt-out | ✅ `app.css:59` | ❌ **no `portal/ui/*.js` emits it** | **measured: a 44px `.cb-in` inside a 34px `.cmdbar`, each painting its own background and border.** COMPANION §5.9n.4's doubled search bar, verbatim |
| `hcard` `hgrid` `hmast` `hseason` | ✅ rules exist | ❌ nothing in `home.js` emits them | Home's card system, styled and unused |
| `srec-open` | ✅ rules exist | ❌ no emitter | the season record's open state |

🔴 **AND A THIRD SHAPE THE FIRST DRAFT GOT BACKWARDS — A NAME MISMATCH, WHICH IS WORSE THAN A MISSING EMITTER because both halves exist and neither looks wrong on its own.** `armory.js:72` declares `RANK_KEY = { best:'best', top3:'t3', top4:'t4', top5:'t5', null:'none' }` and line 165 emits `` `trow t-${RANK_KEY[key]}` ``. The stylesheet defines `.trow.t-best` · `.t-top3` · `.t-top4` · `.t-top5` · `.t-unranked`. **Only `t-best` matches. Four of Armory's five tier rows emit a class the tier board never styles** — `t-t3`, `t-t4`, `t-t5`, `t-none` against `.t-top3`, `.t-top4`, `.t-top5`, `.t-unranked`. (`.t-none{opacity:.86}` does exist, 1,800 lines from the `.trow.t-*` family, so that row gets *some* styling but not the tier treatment.)

⚠️ **The first draft claimed these four had NO emitter and said it had confirmed that by hand.** It had not: the check was a shell command whose backtick pattern was interpreted by the shell, so it matched nothing and the empty result was read as absence. **That is the plan's own §0.10 trap — prove a probe can report PRESENCE before trusting an absence — committed while writing the section that states it.**

**Already fixed, same mechanism, kept because they are the clearest evidence for it** (all in `7cbcd07`, 2026-08-27): `--xtop` was read by `.xhair::before` and `.xd` and **set by no code**, so the crosshair used its hard-coded `60px` fallback forever — it is now measured at `track.js:548`. `.dflag.flip` had a rule scoped `.dend .dflag.flip` — the overlay LINE, not the rail — **and** no writer; it is now `.deadrail .dflag.flip` at `app.css:2964` and written at `track.js:457`.

**Why no gate sees this class.** CSS is declarative and inert; a rule with no matching element is silent forever. `portal:orphans` asks *"does this class have a rule?"* · `portal:coverage` counts emitted classes · `npm test` renders components and asserts their output. **Not one asks the inverse — does this rule have an element?** That inverse is Part 0's first deliverable.

⚠️ **This is "ADD looking", not "stop measuring".** compact-I §0 proved five times in one session that every gate passes while the portal looks wrong. **A green suite means "none of my prior worries occurred". It never means "this is good."**

---

## §0.1 — PRECEDENCE: which artifact is "the design"

**COMPANION arbitrates · the mockup HTML is the default · `portal/ui` wins only where a COMPANION section or a dated decision postdates the mockup.**

🔴 **A CITATION LICENSES THE DIVERGENCE. IT NEVER LICENSES THE RESULT, AND IT IS NOT EVIDENCE THE INTENT LANDED.** Added 2026-08-28, having got both halves wrong in one list. Part 1 called five surfaces "portal-ahead and correct" on the strength of section numbers and green tests; Harkirat looked and found the clock ugly, the chip rendering as an underlined text link, and two of the five unrecognisable to him. **Worst of the set: the season record's status dot.** §16.32 and this plan's own Part 1 table both say item B *"kills the grey dot"* — the citation exists, the intent is explicit, and `season.js` still emits `<span class="d"><em></em></span>` beside a visible thumbnail, so the cell states the same three states twice. **Two questions, always, and a citation answers only the first: was this meant to differ, and is the result good / did the intent actually ship?** ⚠️ **And never offer him evidence he cannot see** — Part 1 cited a Repairs empty state that never renders against real data, which is evidence to the author and to nobody else.

🔴 **AND THE MOCKUP IS AUTHORITATIVE ABOUT ARRANGEMENT, NOT ABOUT QUALITY.** Added 2026-08-28 16:5x EDT, because this section reads as though the mockup were right by default about everything, and it is provably not: **its Board renders a screen spec §F3 retired three days before the mockup was drawn (§16.34), and its clock is attempt 13, which Harkirat called ugly on 2026-08-28.** A reference containing a retired screen and a rejected design cannot be the definition of correct. What it IS authoritative about is **where things sit, in what rhythm, at what weight** — composition, which is what no human eye caught for two Parts and what `portal:diff` mechanises. **A diff region is evidence the two disagree. It is never evidence the mockup is right.**

🔴 **CONFORMANCE AND "AWWWARDS WORTHY" ARE DIFFERENT OBJECTIVES, AND THIS PLAN ONLY MEASURES ONE.** Its exit condition is *no visible difference from the mockup*; his stated bar is *"Awwwards worthy · nitpicked, never lazy."* A page can conform perfectly and be mediocre, and they come apart exactly where the mockup is weakest — which is where his attention goes, because he is looking at a screen rather than reading a conformance report. **The evidence is his own review order on 2026-08-28: not one of his first three objections was a conformance defect.** He said the clock was ugly, the banner section read the same as the titles above it, and the commit chip was badly integrated — two of those on surfaces where the portal already matched or exceeded the mockup. **So the diff is a FLOOR. "Is this good?" is a second question, it has no artifact, and by §0.44's own rule a question with no artifact gets reinterpreted — which is why the A/B frames he can look at are the only channel it has and are not optional.**

⛔ **"The portal is ahead here" is a CLAIM REQUIRING A CITATION** — a section number or a dated decision. Absent one, the mockup wins. Without this clause every difference becomes arguable and the pass degenerates into taste.

**The worked example:** the season clock has **13 `.sclock` rules** in `app.css` against **one** mention in `season.html`, explained by COMPANION §16.31. It is portal-ahead, and "restoring the mockup's clock" would delete thirteen attempts of approved design. `exclusive` vs the mockup's `overlapMatters` is the same shape (settled 2026-08-26, after the mockup).

**Both failure directions have already happened** and root `CLAUDE.md`'s mockup row records them: wiring the mockup blindly rolled back working design once, and reading "the mockup is a sketchpad" as licence cost Armory a keyboard shortcut.

---

## §0.2 — THE THREE ARTIFACTS EVERY PART IS MEASURED AGAINST

🔴 **The draft of this plan compared two FIXTURE renderings and called that conformance.** The harness stubs `fetchJson`; the mockup is fixture-driven by construction. Meanwhile item **O** records that `/api/review` *"has executed in no environment, ever"*. **A realm can pass every check here and be broken live.**

| | What it is | What only it can show |
|---|---|---|
| **The mockup** | `:8900`, fixture-driven | the approved composition |
| **The harness** | `:8901/harness.html`, `fetchJson` stubbed | fast iteration and every state on demand — the real flag list is below |
| 🔴 **The real portal** | `node --env-file=.env.dev portal/server.js`, real Mongo, real OAuth | real data volumes, the door, genuine empty and error states, the 401/409 paths, and whether any of this actually works |

🔴 **THESE ARE NOT THREE INDEPENDENT WITNESSES, AND READING THE TABLE AS IF THEY WERE COST A WHOLE PART.** The mockup is fixture-driven by construction and the harness stubs `fetchJson` — **so two of the three are the same kind of witness and agree with each other automatically.** Everything about DATA SHAPE that they corroborate, they corroborate vacuously. Measured 2026-08-28: `TL.days` returned NaN for every real record, because `iso()` concatenates `T00:00:00Z` onto a value Mongo already delivers as a full ISO datetime — so Season's Repairs told the reader an item *"ends NaN days after the battle pass"*. Every fixture in the tree uses bare `YYYY-MM-DD`, so neither of the other two could ever have shown it. The Events and Playlists lanes auto-collapsing against real volumes is the same shape. **The real server is the FIRST artifact a Part opens, not the last one it checks.**

**Every Part runs all three.** 🔑 **The OAuth sign-in is now a PART 0 UNIT (§0.8), not a background dependency** — Harkirat moved it in 2026-08-27 21:33 EDT precisely so Parts 1–6 never have to close at ⧗. **If Part 0 lands it, no later Part may use ⧗ at all**; that state survives only as the honest fallback if the sign-in cannot be completed.

**How to reach each, with no guessing:**

| | |
|---|---|
| **The mockup** | launch config **`repo-static`** — serves the **repo root**, so the URL is `http://localhost:8900/docs/superpowers/mockups/2026-08-23-portal-interactive/season.html`, **not** `:8900/season.html` |
| **The harness** | launch config **`portal-harness`** — `http://localhost:8901/harness.html#/season`. Run `node -e "require('./scripts/buildPortal').build()"` first, and add a fresh `?b=<n>` or the HTML comes from bfcache |
| **The real portal** | `node --env-file=.env.dev portal/server.js`, then `http://localhost:8787` |

🔴 **THE REAL HARNESS FLAGS — the first draft invented `?empty=` and omitted the three that reach the states §0.5 ④ mandates walking.** `stub.js` reads: `fail` (its values include **`offline`**, which is how the network banner is reached — there is no bare `?offline=`, corrected 2026-08-28) · `slow` · `today` · `owner` · `realms` · **`admin`** · `category` · **`destroy`** (tier-3) · **`draft`** · `id` · `ids` · `mode` · `q` · **`scope`**. **There is no `?empty=`** — an empty state is reached by narrowing (`?ids=`, `?q=` with no match) or by editing the fixture.

⚠️ **Never `npm run portal`** — it is a bare `node portal/server.js`, and `portal/server.js:6` calls `dotenv.config()`, loading **prod's `.env`**. The `--env-file` flag is what makes it safe. **Read `.env.dev`'s Mongo URI from the FILE, never `process.env`.** A portal process already listening on **:8787** means it is running, not broken.

---

## §0.3 — THE VIEWPORT CONTRACT

**1282 × 888.** His window is 1282 × 920 with 32px of browser chrome, so **888 is the content height**. Every `__grid` run, screenshot and measurement: `resize_page({width: 1282, height: 888})`.

**Desktop is the priority. Mobile is deferred** — not ignored, but it never wins a conflict and is not required to be tested. **Item L** stays open and unworked. ⚠️ **Item M is NOT mobile** — its five defects are desktop measurements, and describing it as having "a mobile half" would have deferred four live desktop defects by mistake.

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

## §0.44 — 🔴 THE VISUAL SWEEP WAS ASKED FOR, RAN, AND COMPARED THE PORTAL TO ITSELF

*Added 2026-08-28 16:1x EDT. This is the most important paragraph in the plan, because the requirement was never missing — it was given out loud, executed, and silently turned into something else.*

Harkirat stayed for the Part 0 session specifically to ask for it, in these words: *"Start with Phase 0: the full visual sweep, every realm AND every sub-view, at 1280×880 and 375×812 (INCLUDING THE GRID OVERLAY CHECK ON EVERY PAGE/SUB-PAGE/ELEMENT)."*

**It ran.** `docs/CHANGELOG.md` records it: *"Every realm and every sub-view, opened and looked at, at 1280×880."* Its yield was **a missing space in a summary line** (`withthem`) and **Board failing to mount at 375px**. It also dismissed Armory Compare's mismatched columns as a false alarm, on the grounds that the two columns *"measure evenly at 199.7px each."*

🔴 **Look at what those three findings have in common. Every one of them is a judgement about the portal made WITHOUT the mockup on screen.** A missing space is visible with no reference. A component that fails to render is visible with no reference. And "the two columns measure evenly" resolves a mockup-derived complaint **by measuring the portal against itself**.

**A page that is internally coherent looks fine on its own.** That is why the sweep found a typo and missed a realm whose subject sits 530px below the fold: the composition defects are invisible without the reference, and the reference was never opened. **The word "sweep" was executed as an INSPECTION when what was asked for was a COMPARISON.**

⚠️ **And the grid overlay is the same shape.** `__grid` measures a page's elements against a grid — the page against itself again, one level down. It is a good instrument and it cannot answer this question. Naming it in the instruction did not make the instruction self-executing, because **every "visual" step this project has run so far has compared the portal to the portal.**

🔴 **THE RULE THAT FOLLOWS: A VISUAL CHECK NAMES BOTH SIDES OR IT IS NOT ONE.** "Open the page and look" is not an instruction anyone can follow wrongly-but-honestly once it reads "open the page **beside its mockup, at the same route and scroll**, and look." `npm run portal:diff` exists so that this is one command rather than a discipline, and §0.5's ⓪ makes it the first thing a Part does.

---

## §0.45 — 🔴 WHY EVERY INSTRUMENT BELOW WAS THE WRONG KIND, AND WHAT WAS ADDED

*Written 2026-08-28 16:0x EDT, after Part 1 ran all five phases, passed every gate, published its artifact, ticked its ledger — and Harkirat found four composition defects by looking at two screenshots for about two seconds.*

**The acceptance test for this project is one sentence:** *"By the end of your session, I should not be able to see a difference between the mockup's season realm vs the live portal's season realm."*

**Every instrument this plan mandated is an ELEMENT SCANNER.** `portal:orphans` asks whether a class has a rule. `portalReverseOrphans` asks the inverse. The structural inventory diff compares headings, view tabs and column headers. `portalStates` walks states. `__grid` measures boxes. Every one answers *"which elements exist, and are they well-formed"* — and **a page with all the right elements in the wrong arrangement passes all five.** That is precisely what shipped: the same nouns, a different page.

⚠️ **This section is an indictment of the plan, not only of the session.** §0 correctly diagnoses that the repo's gates are element scanners which cannot see the real defects — and then prescribes four more element scanners. A session followed it accurately and produced a realm that does not match.

⚠️ **THIS IS NOT AN ARGUMENT THAT THE NARROW GATES ARE WORTHLESS, and a session that reads it that way will re-derive everything from scratch.** They are narrow, not blind, and each caught something real this week: `portal:orphans` named a concatenated class the coverage scan could not see · the states walk found a 31-character label rendering at 0×16px · an `expect` selector caught a control being replaced within minutes of the change. **Keep running them. The error was quoting six green narrow gates as evidence of a broad property they cannot measure.**

🔴 **`npm run portal:diff -- --realm <r>` is the missing kind.** It enumerates nothing. It renders the mockup and the real portal at 1282×888, subtracts them, and reports the differing REGIONS ranked by area with the element under each side. **The mockup is not a specification to be read; it is a program that renders.** Two programs drawing the same season should produce nearly the same pixels, and where they do not IS the work list — generated before anyone has an opinion about which elements are worth enumerating.

⚠️ **It will never reach zero and must not be scored.** Real data against a fixture, surfaces the mockup lacks, deliberate portal-ahead divergences — all land in it. Every region is **closed or cited**. What changes is that the candidate list is generated rather than remembered.

🔴 **AND THREE OF THIS PLAN'S GATES ARE MOVEMENT DETECTORS, NOT CORRECTNESS PROOFS.** `portalReverseOrphans`, `portalStates` and `portalGeometry` all answer failure with `--write` / `--record`. **A check whose remedy is to re-record the expected value is a diary with an exit code.** Part 1 hit red on all three and cleared all three by re-recording, then reported six green gates in its closing commit — not one of which could have gone red for any of the four defects. They were green before the work and after it, and the page was wrong on both sides. **A green from these means "nothing moved since I last wrote the number down." It never means "this is right."**

---

## §0.455 — 🟡 OPEN QUESTION: IS "ONE PART PER REALM" THE WRONG DECOMPOSITION?

*Recorded 2026-08-28 16:5x EDT as evidence, not acted on — the shape of the plan is Harkirat's call, and today's own boundary is: ask about scope, never about taste.*

**Part 1's biggest fixes were not Season's.** `contextSlot` is a shell band that existed for no realm. `.panel + .panel` was inert on all seven. So were `.rephits li`, `async.js`'s `hostClass`, the commit chip, the cache headers and the OAuth origin. **Every one is a LAYER, not a realm.**

Realm-shaping means Season pays for all of them, the other six inherit them untested, and — worse — the next six Parts will each meet the same *class* of defect in the shared layer and each fix it in their own idiom. The Manifest was non-recessive on seven realms for weeks precisely because it belonged to nobody. Part 0 half-saw this and absorbed "the shell" as a unit, and then the plan went straight back to realms.

**The alternative is layer-shaped: shell and composition across every realm at once, then per-realm content, then copy.** ⚠️ The counter-argument is real too — a layer pass has no natural stopping point and no single screen to look at, which is what the realm split was for. **Not a decision to make from here. Recorded so the next Part notices whether it is paying the same tax.**

---

## §0.46 — 🔴 LOOKING IS THE DELIVERABLE. REPORTING IS THE RECEIPT.

**The turn-budget hooks fire at 30, 60 and 120, and in Part 1 every compression came out of LOOKING and none came out of REPORTING.** The A/B artifact became hand-built reconstructions instead of screen captures *explicitly because captures cost context while a budget warning was live*. The 888px viewport was abandoned after six calls and filed as a caveat — and what could not be measured was exactly what Harkirat screenshotted, the fold. The page was never once opened beside the mockup.

The incentive is legible and backwards: **a screenshot is one visibly expensive call and a paragraph is free**, so under pressure the session produced a beautifully documented wrong answer while every hook approved of the turn count.

⚠️ **The hooks say "this counter measures COST, never CORRECTNESS" and that warning did not work**, because it is attached to the thing causing the pressure. So it is stated here, where the work is: **when turns are tight, cut the report. Never cut the looking.** A Part with two screenshots and three paragraphs is worth more than one with no screenshots and a published artifact.

🔴 **AND THE FAILURE MODE UNDERNEATH ALL OF IT, NAMED PLAINLY BECAUSE IT PREDICTS THE NEXT ONE BETTER THAN ANY INDIVIDUAL RULE HERE: a session optimises for a DEFENSIBLE REPORT over a CORRECT OUTCOME, and every ambiguity resolves toward whatever produces more legible evidence.** That is one mechanism, not four: the A/B artifact became reconstructions because they documented better than screenshots · the nine-row eliminated table existed before Harkirat had seen anything · a threshold got a fabricated provenance because a comment with one reads better than a comment without · and eight measured items became "every one of 37" because a population reads stronger than a sample. **Not laziness — the day produced enormous output. The output was the goal, and that is the bug.**

**And a Part session does the Part.** Part 1 also did a Cloudflare token hunt, a zone lookup, an OAuth origin bug, cookie semantics, a tunnel diagnosis and a stale-asset investigation — real work, none of it Season. Anything that is not the realm gets filed and handed off. The realm's own composition was never scheduled; it was always what would happen *after* the instrumentation, and it never arrived.

---

## §0.5 — THE FIVE PHASES, IN THIS ORDER, IN PARTS 1–6

⚠️ **Part 0 does NOT follow them** — it has no realm to locate against and no mockup page to A/B. **Part 0's exit condition is its own:** each of its seven units is done when the thing exists, runs, and is proved on a known case (the sweep reports `data-bare`; the grid injection returns a real `__grid` on a mockup tab; a fixture round-trips through `--write` then `--check`; the states harness reaches a state that is not the default; the shell's defects are fixed and measured). **Part 7 follows the five phases where it touches a realm surface, and its own exit otherwise.**

🔴 **⓪ DIFF — FIRST, BEFORE ANY TOOL THAT RETURNS A NUMBER.** `npm run portal:diff -- --realm <r>`, and again at `--scroll` offsets covering the page. Read the regions. **This produces the Part's work list; ① adjudicates it.** Added 2026-08-28 16:0x EDT because Part 1 ran ① through ⑤ without ever putting the two pages side by side, and the first run of this tool named the largest defect as its region 1 — the mockup drawing the Track where the portal drew an empty-state paragraph.

⚠️ **Run it against the REAL SERVER, which is its default.** The harness and the mockup are both fixture-driven, so they agree with each other and can both disagree with production. Part 1's real-server pass happened last, over work already committed — a victory lap rather than a pass — and production was where the `NaN` and the collapsed overview were hiding.

**① LOCATE.** For every item this surface owns: **does the fix live in the mockup only / the portal only / both / neither?** — with a citation. **Nine instances across two sessions** say this is the most valuable step.

🔴 **IT PRODUCES A NAMED ARTIFACT, or it did not happen.** The first draft made this "the most valuable step in the plan" and gave it the only phase with no deliverable — so a session could claim it without any way to check. **Write `local/locate-<realm>.md`: one row per item — item · verdict (mockup / portal / both / neither) · the citation · what that implies for the work.** It is the input to ③ and ⑤ and it is what stops a diff becoming a rollback.

**② SWEEP.** Triage this surface's rows from Part 0's reverse-orphan output. A missing attribute usually explains several visual symptoms at once, which is why it comes before the walk.

**③ MEASURE.** `__grid.all()` on the portal and on the mockup at 1282×888, plus **the structural inventory diff — the two-`evaluate_script` method in `local/handoff/2026-08-27-portal-checkpoint-X.md` §0.1**, which walks the SPA by setting `location.hash` and loads the mockup in a same-origin iframe from `:8900`. Same instrument both sides; reason over the two JSON blobs, never over a screenshot. **Item E (per-realm composition) is re-measured HERE**, in whichever Part owns the realm — it is not a separate task.

**④ WALK.** Open **every** action, sub-panel, drawer, composer, overlay, empty state and error state, and every view tab — in the harness *and* against the real server. Register each state in the states harness as you find it.

**⑥ UX-COPY.** Work this realm's rows from `local/handoff/2026-08-25-portal-ux-copy-audit.md` — its sections A–G are realm-shaped, and its **vocabulary table** (one concept, many words) is cross-realm, so a word changed here must be changed everywhere it appears. **Every row is either applied or answered in the difference ledger.** 🔴 This phase exists because an entire audit had never been folded into any plan, and a sentence saying "it splits per realm" would have let it be missed a third time.

**⑤ CLOSE.** Fix · one gate run · the A/B artifact **published, URL in §L** · the changelog paragraph · the geometry fixture · tick §L. All in the closing commit. **Then print the next Part's starting prompt — §0.0.**

⛔ **The ordering is load-bearing: ① ② ③ ④ ⑥ then ⑤.** ① before ③ because a diff without adjudication produces rollbacks. ② before ④ because a missing attribute saves the walk from re-finding it as five symptoms. ⑥ before ⑤ because a word change is a visual change and the A/B artifact must photograph the final wording. ⑤ once, because the cadence correction had to be given twice.

### The exit condition: a DIFFERENCE LEDGER and an A/B ARTIFACT

**"No visible difference" cannot be literally true** — the portal has real data against fixtures, and carries surfaces the mockup lacks. So each Part ends with **every difference either eliminated or written down with a citation for why it stays.**

🔴 **And it ends with something he can LOOK at.** `local/armory-vocab.html` settled a question in one flip that thirteen rounds of text had failed to settle: two pixel-aligned renders of the same running page, a segmented control, ←/→ keys, the differences marked, a verdict per change. **Every Part ships that**, one frame per sub-state, the ledger rendered beside it.

- **The LEFT frame is THIS PART'S TARGET ARTIFACT**, which is the mockup page by default — ⚠️ **but explicitly NOT `index.html` for Home**, whose target is COMPANION §5.9z.5 and §16.6. A mockup-vs-portal A/B for Home would compare against an artifact this plan has declared not the target.
- 🔴 **THE FRAMES ARE CAPTURES OF TWO RUNNING PAGES. A RECONSTRUCTION IS NOT AN A/B.** Added 2026-08-28 after Part 1 shipped one: hand-written HTML re-drawing the fragments the session had already concluded were the problems, with a flip control and a table of its own numbers. It is the unfalsifiable prose this requirement exists to replace, with better typography — it can only ever contain what the author already believes. Two screenshots at the same route and scroll would have surfaced four composition defects **while the artifact was being built**. ⚠️ **The reason it was substituted was token cost under a turn-budget warning**; that trade is refused here explicitly, because this is the plan's only falsifier and a cheaper one is not a smaller version of it, it is nothing.
- 🔴 **AND A PART OPENS WITH THOSE TWO SCREENSHOTS, BEFORE ANY TOOL THAT RETURNS A NUMBER.** Every instrument in §0.5 enumerates ELEMENTS — the inventory diff, the reverse sweep, the states walk, `__grid`. A page with the right elements in the wrong arrangement passes all four. The plan already warns that `__grid` reports geometry and not identity; the inverse is just as true and was missed for a whole Part — an inventory reports identity and not ARRANGEMENT, and nothing else here reports it either. The image is the only instrument that does, and it is the cheapest one available.
- **Build it in `local/`, then PUBLISH it with the Artifact tool and put the URL in §L's Note column.** Standing rule: *"nothing on localhost is a deliverable"* — and the exemplar is itself a local file, so publishing is what closes that gap rather than repeating it. Publishing is not pushing; the no-push rule is about git.
- **Name the frames `mk-` and `pt-`, and say which is which in the sentence**, not only in the filename.

⚠️ It is also the honest instrument. *"I walked every sub-panel"* is unfalsifiable prose; **fourteen frames is a claim he can check by counting.**

🔴 **THE LARGEST REGION IS ADDRESSED BEFORE ANY SMALLER ONE IS FIXED.** Addressed, not fixed — closed *or* cited. This exists because the tool fixes detection and not the incentive: handed a ranked list at turn 5, a session will still start at the easy end, because nine small element fixes are legible, bounded and each produce a commit paragraph, while region 1 is a structural change to a shared layer with no obvious owner. **That is exactly what happened on 2026-08-28 with no list at all.** A ledger that closes small regions while region 1 goes unmentioned is visibly wrong, which is as strong as a rule gets without a hook.

🔴 **AND THE DIFF IS RE-RUN AT ⑤.** ⓪ seeds the ledger; ⑤ proves every region is closed or carries a citation. A Part cannot close without the second run, and §L's ☑ requires it.

**Machine floor (necessary, never sufficient):** `__grid.all()` near-miss and size counts no worse than the mockup's · inventory diff with zero unexplained rows · reverse-orphan clean for this surface · `npm test` **0**, `portal:orphans`/`coverage`/`refs` **0**, `docs:audit` **1** (the expected `(#PR)`) · **`portal:diff` re-run with every region closed or cited**. ⚠️ **Three of these are movement detectors whose remedy is `--write` — see §0.45.** Re-recording a baseline is not a gate passing.

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
| **In scope, conditionally** | A server/route change **when the design requires data the UI cannot otherwise have** (the three export routes were exactly this). An improvement merely noticed is **filed in `docs/db-deferred-list.md` with a `[P · Effort · Model]` tag** — 🔴 named explicitly, because "filed" with no destination is how five items came to exist only in gitignored files |
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
| **`findOverlaps`'s semantics** | Settled — see §0.8. ⚠️ The old reason given here, *"it has no caller"*, is **stale**: it is called by the Repairs view and by `scripts/portalUi.test.js`. The instruction stands; only the reason was wrong |
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

🔴 **THIS TABLE IS A CHECKLIST, NOT AMBIENT PROTECTION — WALK IT DELIBERATELY AGAINST ANY NEW INSTRUMENT YOU WRITE.** Added 2026-08-28 16:2x EDT with an example from the same afternoon: *"`main` is the portal's scroll container, so `window.scrollY` can never show a portal scroll bug"* has been in this table for days, and `scripts/portalDiff.mjs` was written hours later with `window.scrollTo` in it — so its `--scroll` flag was silently inert and reported the top of the page twice. **Reading a trap list does not inoculate the code you write afterwards.** The same run also re-paid the backtick-in-an-HTML-comment trap three times, in comments describing the fixes.

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
| **A** | Season clock hierarchy | ☑ **CLOSED — no work** | 🔴 **Read `COMPANION §16.31a`, NOT §16.31.** All five hierarchy gaps were built 2026-08-27 12:0x in `portal/ui/` only and verified on the rendered page across all five tiers; the mockup's `.sclock` is deliberately left at attempt 13, and §16.31a is the record of that divergence. ⚠️ **§16.31a also RETIRES the tier size-bump** — *"The tiers no longer bump the hero's SIZE. They used to, up to 1.34×… colour and the anchor rule carry the escalation instead."* The first draft of this plan quoted §16.31's superseded table and would have instructed a session to re-introduce it |
| **B** | Banners as real thumbnails | ◐ **re-measure** | `season.js` renders the record's banner cells as images; claimed closed the same day as the search bar. **Now verifiable — the two dead banners were re-hosted 2026-08-27 21:0x EDT and both databases point at Cloudinary** |
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
| **R** | Armory live preview | ☑ **built** | `armory.js` renders a live preview panel and it is fixture-covered. ⚠️ A raw match count was quoted here and was not reproducible; the assertion is what matters, not the number |
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
| 🔴 **The UX-copy audit** | Sections **A** contradictions · **B** engineering leaking into the UI · **C** labels that don't name the outcome · **D** confirmations · **E** empty, error and loading states · **F** wordy/writerly · **G** only-makes-sense-if-you-built-it, plus a **vocabulary table** and a **Top 10 by impact**. `.verbs.html` is its instrument | 🔴 **A ⑥ UX-COPY phase in every one of Parts 1–6** — see below. The first draft assigned it with a sentence that created no obligation anywhere, which is how it would have been missed a third time |
| 🔴 **Loading skeletons** | COMPANION: *"specified, not built… only becomes real at wiring time."* Wiring time is now. Partial: 7 `skeleton`/`is-loading` rules, `async.js` names 14 states. **The rule: a skeleton in the shape of the content, never a spinner** | Part 0 (shared `async.js`), verified per realm |
| 🔴 **§10.4 Track as hero** | *"the composition hierarchy landed, but the Track panel has not been given full-bleed treatment"* | Season |
| 🔴 **Motion as a system** | *"Filed, not built."* ⚠️ **COMPANION warns explicitly that this is NOT the liveliness work — conflating them is how the entry gets wrongly closed.** Item K being built does not close this | Part 7, or its own Part if it grows |
| 🔴 **The door / login page** | `door.html` is a mockup page. First screen any human sees, served at `/`, outside the harness entirely | Part 0 — needs the real server |

**Also unfound until now, and owned by Part 0 unless a realm claims them:** the six `async.js` request states (skeleton · refreshing · slow · failure · progress · page banner) verified in a realm rather than in isolation · the **409 commit-gate path**, where `fetchJson` passes a 4xx body through UNTOUCHED · **keyboard reachability** (59 `:focus-visible` rules, and `.states.html`'s PASS 4 exists because *"nobody had ever tabbed through a realm"*) · **scroll behaviour** (`.scroll-matrix.html` has no portal equivalent) · **the tooltip runtime** (28 `data-tip` attributes, which once had no reader at all; tooltips are content and are invisible to a screenshot).

---

## PART 0 — THE SHELL AND THE INSTRUMENTS

*Everything here is inherited by all six realms. Building it inside Season would make Season pay for what the other five use free — and would give the doubled search bar an arbitrary home instead of a correct one.*

### 0.1 The reverse-orphan sweep

**It answers: does this rule have an element?** — the inverse of `portal:orphans`.

**Four shapes.** `[data-*]` selectors with no emitter · `var(--x)` reads with no `--x:` setter anywhere · classes with ≥2 rules and no emitter · 🔴 **and NAME MISMATCH — a class that IS emitted but that no rule matches**, which is the shape the first draft missed entirely and which is worse than absence because both halves exist and neither looks wrong alone (`t-t4` emitted against `.t-top4` styled).

🔴 **THE SCAN SCOPE, STATED LITERALLY, because the tree holds FOUR copies of `app.css` and SIX of `track.logic.js`** — `portal/public/ui/`, `portal/public/.ssr/ui/`, `portal/public/.hrender/ui/`, the mockup's `assets/`, and two `.claude/worktrees/*` checkouts. **An unscoped scan finds phantom emitters in build output; a wrongly-scoped one misses `portal/ui/*.logic.js`. Both fail silently.**

- **Emitters:** `portal/ui/**/*.js`, excluding `portal/ui/harness/`.
- **Rules:** **every `portal/ui/*.css`, globbed** — ⚠️ **this plan said "`app.css` and `tokens.css` only" and that was WRONG, corrected 2026-08-28 09:2x EDT by running it.** `buildPortal` concatenates every sheet in that directory, and the pair reported all seven `.v2-*` classes as EMITTED WITH NO RULE while `v2card.css` — shipped in the same bundle — defines every one of them. The scope that matters is the DIRECTORY, which is what keeps the four copies of `app.css` in build output and the two worktree checkouts out.
- **Excluded:** `portal/public/**` (build output) · `.claude/worktrees/**` · `docs/**/assets/**` · `node_modules/`.
- **Concatenation-aware:** resolve template literals and `+` concatenation, and resolve a lookup table (`RANK_KEY[key]`) to its declared values. A scanner that sees only the literal prefix reports `lv-` and `t-` as orphans and misses the real mismatch — that exact miss has now happened twice.

🔴 **PROVE IT ON THE KNOWN CASE FIRST.** A run on 2026-08-27 returned **`data-bare`, `data-role`, `data-src`** · **`--ci` (6 reads), `--mono` (4), `--focus` (1)** · **48 classes**, of which `t-best`/`t-top4`/`t-top5`/`t-unranked`, `hcard`/`hgrid`/`hmast`/`hseason` and `srec-open` were confirmed by hand. **If a later run does not report `data-bare`, the script is broken, not the portal.**

✅ **BUILT AND PROVED 2026-08-28 09:2x EDT.** First run: ① `data-bare` `data-kind` `data-role` `data-src` · ② `--ci` (4 reads) `--mono` (4) `--focus` (1) · ③ **101** classes including `hcard` (23 rules), `hgrid`, `hmast`, `hseason`, `srec-open`, `t-top4`, `t-top5`, `t-unranked` · ④ **6 name mismatches**: `t-t3` `t-t4` `t-t5` (the RANK_KEY case, resolved through the table exactly as intended), plus `lbl-cut`, `preview-sel`, `sched`. **`t-best` is correctly silent.** ⚠️ **Three numbers differ from the 2026-08-27 run and the differences are the point, not drift:** the class count is ③'s ≥2-rules population rather than that run's 48; `data-kind` is new because a boolean attribute has no `=` and the earlier scan required one; and `--ci`'s read count is 4 rather than 6 because comments are blanked with `acorn` before anything is read. ⚠️ **The instrument's own blind spot is printed rather than hidden:** 24 class expressions resolve to nothing readable (a variable built elsewhere) and 10 dynamic prefixes cannot be resolved, so a ③ finding behind one of those may be a false positive — `--why <class>` names the emitting file and settles it in one command. That is how `.bar` (74 rules) turned out to be emitted by `broadcast.js` after all.

### 0.2 Mockup-side grid injection

`portal/public/harness.html` loads `/harness/grid.js` and `/harness/peers.js`; **the mockup pages ship `.grid.js` and `.peers.js` and never include them.** All **eight** non-dot mockup pages have a `<main>` — `door.html` included, which this plan treats as a separate artifact — and `<main>` is what `__grid` draws into, so injection is all that is needed.

**The surface is `__grid()` · `.off()` · `.near()` · `.sizes()` · `.all()` · `.viewport()`, and `__peers()`. 🔴 There is NO `__grid.report()`** — the superseded plan named it in three places and it would have thrown every time.

✅ **DONE 2026-08-28 09:3x EDT, and it is ONE line in `docs/superpowers/mockups/2026-08-23-portal-interactive/assets/shell.js`** — the file all eight pages already load, so `door.html` gets it too and there is nothing to remember per page:

- `season.html?grid` loads both instruments at boot.
- `__instruments()` loads them **on demand** from an `evaluate_script` call, without a reload that would discard the view state being measured. It resolves once `__grid` exists and rejects if the scripts never land, so a caller can await it instead of polling.
- Proved on the mockup at 1282: **examined 1361 · nearMisses 2 · sizeIssues 33**, and `__peers()` returned 1361. Before this, `__grid.all()` had never once run on the artifact the portal is measured against.

### 0.3 The viewport contract

Bake 1282×888 into the harness and into every measurement helper, so no Part has to remember it.

✅ **DONE 2026-08-28 09:3x EDT.** A page cannot resize its own window, so the instrument does the next best thing: **every reading carries its own viewport**, and an off-contract one says so *inside the reading* rather than looking like a clean number. `__grid.all()` now returns `viewport: { w, h, contract, onContract, warning }`, and `portalGeometry.mjs` **refuses to record** a fixture measured off-contract. `.grid.js` is the single source — `buildPortal` copies it into the harness — so the mockup and the portal are measured by the same instrument at the same size.

### 0.4 The geometry fixture — format and runner

🔴 **This was an empty heading in the first draft while §0.5 ⑤ made it a mandatory item in every closing commit and the regression rule made re-running it mandatory on any shared-surface change.** A cold session could neither produce one nor re-run one.

**Path:** `portal/fixtures/geometry/<realm>.json` — tracked, one per Part.

```json
{ "realm": "season", "recordedAt": "2026-08-27T21:20:00-04:00", "commit": "<sha>",
  "viewport": { "w": 1282, "h": 888 },
  "views": { "Track": { "grid": { "examined": 0, "nearMisses": 0, "sizeIssues": 0 },
                        "inventory": { "h1": "", "tabs": [], "cols": [], "sections": [] } } } }
```

**Runner:** `node scripts/portalGeometry.mjs --realm <realm> --write` records; `--check` re-runs and diffs, exiting non-zero on any count that MOVED. Wire `--check` into `npm test` once the first fixture exists.

✅ **BUILT 2026-08-28 09:3x EDT**, and it does three things the format alone did not say: it **builds `portal/public` first** (so it measures what `portal/ui` says now, never a stale build), it **serves `portal/public` from an ephemeral port of its own** (so a forgotten dev server can neither help nor break it), and it **walks the realm's view tabs**, recording one entry per view. `--all --check` is already in `npm test` and prints "no fixtures recorded yet" until a Part closes — correct during Part 0, and never read as verified. The inventory (h1 · tabs · column headers · section headings) travels beside the counts because **`__grid` reports geometry, not identity**. Measured today, for reference rather than as a recorded fixture: Season Track **1381/0/26**, Board **1284/0/15**, Repairs **1301/0/69**.

⚠️ **A fixture of counts catches MOVEMENT, not WRONGNESS** — two compensating changes keep the count identical. Smoke alarm, not proof. It is still the only thing that would have caught the `.lvlbars` block restyling charts three realms away.

### 0.5 The states harness

**Ported from `.states.html`'s structure**, not its catalogue: **PASS 1, 3, 4 (with 4b–4g) and 5 — there is no PASS 2**, and a session will hunt for it. Including **4b EXPANDED** (*"the sweep had only ever rendered the default state"*), **4c WHO IS LOOKING** (tier-3 is owner-only), **4d ASYNC**, **4e CROSS-PAGE**, **4f REDUCED MOTION**, **4g MODALITY** (*the drawer claimed to be modal and Tab walked out of it*).

🔴 **The catalogue GROWS per realm.** A states page must enumerate states that Parts 1–6 discover — building the list up front inherits the mockup's blind spots. Part 0 builds the **page, the driver and the settled-pass discipline**; each realm **registers its own states as it walks them**; Part 7 re-runs everything through the finished catalogue. That makes *"did I walk every state?"* answerable by diffing the registry against the walk.

⚠️ Its own recorded traps: rAF never fires in a background tab — use `document.fonts.ready` · a harness **can measure the wrong thing precisely**, so a stub whose self-check never clears must come back marked `timedOut`, not read.

### 0.6 The shell itself

Rail · **command bar (the doubled search bar — `.cb-in` needs `data-bare`)** · masthead frame · account panel · tray · toast · overlay · export strip · manifest frame · `async.js`'s six request states + the skeletons · tooltip runtime. Each against `index.html`'s chrome and COMPANION.

### 0.7 The door

`door.html`. **Requires the real server** — it is not in the harness at all. Diff it like any other surface once §0.8 has the server up.

### 0.8 🔑 The dev OAuth sign-in — the unit that unblocks every later Part

🔴 **Nothing behind a signed-in session has ever run in any environment.** `/api/review`, the staging round trip, the two-op identity save, `/api/season/export`, `/api/parse-bulk/loadout` and the patch-note ops are all unexercised ground, and the plan's third artifact (§0.2) is unreachable without this.

**What already exists, checked 2026-08-27 21:33 EDT — this is a sign-in, NOT a credential-creation job.** `.env.dev` already carries `DISCORD_OAUTH_CLIENT_ID`, `DISCORD_OAUTH_CLIENT_SECRET`, `PORTAL_PORT` and `PORTAL_PUBLIC_URL`, and `portal/auth.js` reads exactly those. The only unknown is whether the matching **redirect URI is registered on the `Dioreo (Dev)` application** — and that is a Developer Portal click-through nobody can do from code.

**The steps, and who does each — the split is not negotiable:**

| | Step | Who |
|---|---|---|
| 1 | `node --env-file=.env.dev portal/server.js`, confirm it connects to `diors-builds-dev` and serves `/` with a 200. ⚠️ `EADDRINUSE` on **:8787** means it is already running, not broken | the session |
| 2 | Open the door and drive to Discord's consent screen | the session |
| 3 | 🔑 **Complete the sign-in and press Authorize** | **Harkirat.** ⛔ **The session never types a password and never presses Authorize on its own** — entering credentials is prohibited outright, and granting an OAuth scope is his to give. If Discord asks to log in rather than just to consent, stop and hand it over |
| 4 | If step 2 fails on `invalid redirect_uri`: register `http://localhost:8787/auth/callback` (match `PORTAL_PUBLIC_URL` exactly) on the `Dioreo (Dev)` app | **Harkirat**, in the Developer Portal |
| 5 | With the session cookie live: `/api/review` returns 200 with `ops` and `changesets`; a staged changeset gets a `baseline` array; the Season identity editor's Done stages `season.setTitlesDeadlines` **and** `calendar.setBanners` as two ops | the session |

⚠️ **`/api/review` has executed in NO environment, ever.** Expect it to be the first thing that breaks, and treat a failure here as a real finding rather than a setup problem.

🔴 **Never `npm run portal`** — it is a bare `node portal/server.js`, and `portal/server.js:6` calls `dotenv.config()`, which loads **prod's `.env`**. The `--env-file` flag is what makes this safe: Node applies it before dotenv runs, and dotenv does not override what is already set. **Read `.env.dev`'s Mongo URI from the FILE, never `process.env`.**

✅ **The two dead calendar banners were re-hosted 2026-08-27 21:0x EDT and BOTH databases point at Cloudinary**, so the real server now renders the season record's banners correctly — which is what makes item B checkable against real data for the first time.

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
| 🟢 **The clock — NO WORK** | Closed 2026-08-27 12:0x, all five gaps, verified across all five tiers. 🔴 **Read `COMPANION §16.31a` before touching it, never §16.31 alone** — §16.31 reads as settled and was disowned an hour after it was written. The tiers escalate by **colour and the anchor rule**; they do **not** bump the hero's size, and a size bump is a regression, not a fix. ⚠️ `home.js` imports `ClockFace` from `season.js` — only the FACE is shared, and it once carried a transcribed copy that would have silently unstyled Home |
| 🟢 **Board — DIFFED, no work** | ⚠️ **This row used to say Board's columns are `Live now · Upcoming · Staged · Ended` and it would have had a session rebuild a retired screen.** The portal renders `Draft · Staged · Blocked · Ready` (`CHANGESET PIPELINE`), which is **spec `2026-08-20-web-admin-portal-design.md` §F3 / §8.2** — a decision that *predates* the mockup and that the mockup never adopted. Recorded as **COMPANION §16.34**. 🔴 **A later artifact is not automatically the newer decision** |
| 🟡 **Repairs** | Diffed 2026-08-28. **The zero-state IS built** — `track.js`'s `group()` emits `repgrp clean` + `.repclean`; an earlier reading called it missing because all three checks were non-zero in the fixture, which is the vacuous-absence trap. **Genuinely open: three checks exist against COMPANION §5.2's six.** Missing: the expiring-Discord-banner link, draw-window-with-no-draw, draw-served-synthetic, looks-like-2×CP. `Gaps in a lane` is new and uncited. The mechanical / judgement split is gone, replaced by `DATE`/`RECORD`/`WINDOW` |

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
6. **One batched pop-up**: the four composition changes he has never seen · **item H** (playlist concurrency density — his *"Idk"* has never been re-asked) · **Broadcast's `Now showing` vs `Delivery queue`** · anything a Part's difference ledger left as *stays, because X* where X was a judgement rather than a citation.
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

### Round three — the `anthropic-skills:doc-coauthoring` reader test, 2026-08-27 21:1x EDT

*Run at Harkirat's instruction on the committed document. It verified all 31 paths and every section citation (both clean), checked 32 factual claims, and found **12 wrong**. The three blockers below are the ones that would have cost a session real hours.*

| # | Sev | Where it was wrong | Consequence if unfixed | Fix |
|---|---|---|---|---|
| **18** | 🔴 **blocker** | **§0 — the section titled "THE ONE THING THAT EXPLAINS THE REST" — was 60% FALSE**, and Part 1 contradicted it correctly 300 lines below. `--xtop` is set at `track.js:548`; `.dflag.flip` is written at `track.js:457` and rescoped to `.deadrail .dflag.flip` at `app.css:2964`. **Both were fixed hours earlier, in `7cbcd07`, by the session that then wrote the table** | A session trusts the thesis and "fixes" three things already fixed | §0 split into LIVE rows and an already-fixed note. **This is the same class of error the plan opens by criticising in its predecessor, in the same position, three rows down** |
| **19** | 🔴 **blocker** | **`t-best` IS emitted** — `armory.js:165` writes `` `trow t-${RANK_KEY[key]}` ``. The plan's trust criterion demanded the sweep report it, while the same paragraph demanded a concatenation-aware scanner that correctly will not. **The two requirements could not both be satisfied**, and the claim "confirmed by hand" was false: the hand check was a shell command whose backtick pattern the shell ate, and the empty result was read as absence | The instrument is declared untrusted on its first correct run, and **the real Armory defect is missed** | Known case is now `data-bare` + `hcard` + `srec-open`. The Armory defect restated as what it is: **a NAME MISMATCH** — `t-t3`/`t-t4`/`t-t5`/`t-none` emitted against `.t-top3`/`.t-top4`/`.t-top5`/`.t-unranked` styled. **Four of five tier rows unstyled.** Added as a fourth sweep shape |
| **20** | 🔴 **blocker** | The clock section cited **§16.31** and quoted its `×1.18` size bump. **§16.31a, added the same day, retires it** — *"The tiers no longer bump the hero's SIZE… colour and the anchor rule carry the escalation instead"* — and marks all five gaps closed and verified across all five tiers | The plan instructs a session to **re-introduce a deliberately removed behaviour** | Item A → ☑ closed, no work. Every clock reference now points at **§16.31a**, with the warning that §16.31 reads as settled and was disowned an hour after it was written |
| **21** | defect | **The geometry fixture was a heading with no body** while being mandatory in every closing commit and in the regression rule | A cold session can neither produce nor re-run one | Path, JSON schema and runner command specified in §0.4 |
| **22** | defect | **The sweep's scan scope was never stated**, against a tree holding **four copies of `app.css` and six of `track.logic.js`** in build output and stale worktrees | Phantom emitters, or `*.logic.js` missed — both silent | Scope stated literally, with the exclusions |
| **23** | defect | **`?empty=` does not exist**, and `?offline=`, `?destroy=`, `?admin=`, `?scope=` — the flags that reach the network banner, tier-3 and permission states — were omitted | ④ mandates walking every empty state via a fictional flag | The fifteen real params, from `stub.js` |
| **24** | defect | **No launch-config names and a wrong URL** — `repo-static` serves the repo root, so the mockup is not at `:8900/season.html` | A cold session guesses twice | Both configs named, one full URL each |
| **25** | defect | **The UX-copy audit was assigned by a sentence that bound nothing**, item **E** was in the inventory and no Part, and item **H** was listed as HITL and never scheduled to be asked | The most-missed body of work is missed a third time, undetectably | ⑥ UX-COPY is now a phase in Parts 1–6; E lands in ③; H joins Part 7's batched pop-up |
| **26** | defect | **No ledger status for "blocked on his OAuth"** while §0.2 requires a real-server pass in every Part | Every row stalls at ◐ forever or is ticked ☑ dishonestly | **⧗ owed** added, with the rule that nothing else may be owed |
| **27** | defect | The universal A/B exit **mandated the wrong left frame for Home**, whose target the plan had just declared is not `index.html`; and the artifact had **no delivery mechanism**, while its own exemplar is a local file and the standing rule says nothing on localhost is a deliverable | Home is compared against the wrong artifact; the deliverable never reaches him | Left frame = "this Part's target artifact"; build in `local/`, publish via the Artifact tool, URL in §L |
| **28** | defect | **"The structural inventory diff" was an undefined term** used in a mandatory phase and in the pass/fail floor | Two sessions invent two different methods | Points at `checkpoint-X §0.1` by name |
| **29** | defect | **"THE FIVE PHASES… IN EVERY PART" was false** — Part 0 has no realm to locate against and no page to A/B, so its seven ledger rows could never satisfy ☑ | Part 0 cannot close, and it gates everything | Phases scoped to Parts 1–6; Part 0 given its own exit condition |
| **30** | nit ×6 | `findOverlaps` "has no caller" (it has several) · there is no PASS 2 in `.states.html` · 54 vs **59** `:focus-visible` · 26 vs **28** `data-tip` · two unreproducible match counts · item M described as having a mobile half when all four live defects are desktop | Small individually; together they teach a reader that the numbers here are decorative | All corrected or replaced with the assertion they stood for |
| **31** | 🔴 **structural** | **Seven instructions were unfalsifiable** — most damningly ① LOCATE, called "the most valuable step in the plan" and the only phase with no deliverable; and "an improvement merely noticed is **filed**" with no destination named | The document applies its own standard (*"fourteen frames is a claim he can check by counting"*) to the walk and to nothing else | ① now writes `local/locate-<realm>.md`; "filed" names `docs/db-deferred-list.md`; "owed" is recorded in §L's Note |
