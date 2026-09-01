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


> 🔴 **SECTION NUMBERS ARE DISAMBIGUATED BY LETTER — added 2026-08-30 15:5x EDT.** Three numbers were used twice each (`§0.1`, `§0.5`, `§0.6`), so a pointer saying "read §0.5" resolved to two unrelated sections and a session could read the wrong one and believe it had complied. Found by a read-only audit simulating a fresh session. **`§0.5a` is how a Part is CHECKED · `§0.5b` is the five PHASES · `§0.6a` is the OVERLAY METHOD · `§0.6b` is SCOPE · `§0.1a⟷§0.6a` is how closure and capture compose · `§0.1b` is PRECEDENCE.** Any older reference to a bare `§0.1`/`§0.5`/`§0.6` predates this and means whichever of the pair fits its sentence.

## §0.7a THE AUDIT LOOP — the instrument, and the batching rule it enforces (2026-08-29 00:5x EDT)

> 🔴 **"THE FIRST CALL OF EVERY REALM" IS CLAIMED BY FIVE DIFFERENT THINGS IN THIS PLAN, AND THE REALM PROMPT IS THE TIEBREAK.** Found by the §0.5c reader test 2026-09-01: this section says `portal:audit`, §0.5b's ⓪ says `portal:diff`, §0.5b again says two screenshots, §0.2 says the real server, and `SESSION-START.md` says a realm audit is not the first command any more. **All five are true about their own concern and none is an ordering.** The ordering lives in the Part's own prompt (`<REALM>-PROMPT.md`), which is written after the previous Part and knows what the tree actually needs — SESSION-START defers to it explicitly. **Read the prompt's first-calls block; treat every "first call" claim in this plan as "first WITHIN its phase".**

🔴 **`npm run portal:audit -- --realm <r> [--view <tab>] [--all]` IS THE FIRST CALL OF EVERY REALM, AND ITS SECTIONS ARE THE BATCHING CONTRACT.** `portal:converge` asks the same question and answers it too shallowly — four levels deep, thirteen style properties, no stylesheet — so every finding below the fourth level needed its own hand-written probe and every CSS difference its own grep. Measured 2026-08-29 00:2x EDT: that loop cost well over a hundred turns on one realm's one view, at roughly one fix per turn. The findings were real; **the loop was the waste**.

| Section | What it holds | How to work it |
|---|---|---|
| **① CASCADE** | the FIRST vertical offset, alone | **Fix it and re-run.** An offset near the top moves everything under it, so the count beside it is mostly the same defect seen again |
| **② SHAPE** | elements one side has and the other does not, grouped by component piece | **ONE BATCH** |
| **③ WORDS** | same element, different text | **ONE BATCH** |
| **④ STYLE** | same element, different computed box or type, grouped by the property | **ONE BATCH** |
| **⑤ RULES** | the two stylesheets, selector by selector, at-rule aware | **ONE BATCH** — one differing declaration usually explains a whole block of ④ |

🔴 **ONLY ① IS ONE-AT-A-TIME, AND ONLY WHILE IT IS NON-EMPTY.** Sections ②–⑤ do not cascade into one another; treating them as though they did is what produced the measure-one-fix-measure loop. The rule inherited from §0.6 — *fix the FIRST rhythm mismatch and re-run* — is correct for a cascading offset and **wrong for everything else**, and converge could not tell them apart because it could not see far enough down to know.

⚠️ **Pairing is sequence alignment, and the two simpler rules were tried and measured first.** Pairing globally by class signature in document order mispaired 622 of 1608 nodes on Season's Board; pairing strictly by ancestor path plus ordinal was worse at 1610, because one extra wrapper desynchronises every path beneath it. The pages are two renderings of one tree with insertions and deletions between them, which is what an LCS solves.

⚠️ **A repeated pattern is ONE finding.** A seven-element card sub-structure missing from thirty cards is one edit, and listing it thirty times is what made the earlier output unreadable enough to send a reader back to ad-hoc probes.

**Measured on Season's Board:** 664 reported differences → 10, in five batched passes rather than sixty single ones.

🔴 **④ RANKS BY REACH NOW, NOT BY ×COUNT (2026-09-01), and its rows print two numbers.** `reach` is how many rendered elements the difference is drawn THROUGH — the element plus its descendants — so a background on a container outranks the same delta repeated on 125 leaf cells. It changed because ranking by repetition buried the single most consequential row of an Armory run at position ~140 of 149. ⚠️ **Reach is not importance**: a tall wrapper scores high because it CONTAINS a lot. ⚠️ And the section now refuses to claim the ordering it is not doing — if every group's reach equals its own member count, the walk has stopped supplying descendants and the header says so instead.

⚠️ **THE AUDIT AND THE DIFF MEASURE DIFFERENT FRAMES, AND IT IS A SYSTEMATIC 44px ON ARMORY.** `portalAudit` walks the INNERMOST `main`; `portalDiff` takes the largest content height across `main`, the scroll container and `document.body`. Both sides shift by the same amount, so the two are consistent under a transform — but a reader comparing a fresh audit figure against a diff-derived one in a ledger will find 44px that means nothing. **Cite one source per record and say which.** Broadcast holds at 0.3% in both views throughout, which is the shared-surface regression check.

## §0.7d — 🔴 WHAT A REALM PASS IS *FOR* — DECIDED BY HARKIRAT 2026-08-31 12:1x EDT. READ THIS BEFORE §0.6a OR §0.7c.

**The diff finds SURFACES. I read the CODE around each. Harkirat closes the realm BY LOOKING.**

🔴 **THE PERCENTAGE IS NO LONGER THE TARGET.** It is a pointer to code worth reading, and nothing else. This reverses §0.6a's *"closure stops being my opinion and becomes a number"* — that rule solved a real problem (adjudication-by-judgement, three false closes) and created a bigger one.

**The evidence, measured over Season's ~700 turns:**
- **Every real defect came from reading code around a difference, never from the number** — the ruler mask that had never applied once, `dateOnly` making a windowed draw permanently LIVE forever, `oneway.js` promising an export interlock that does not exist, a broken banner asserting *"image cached and serving"*, the patch-note rows reaching a draw's op path.
- **Driving the number is what produced the waste** — three false closes, a sweep that compared the portal to itself, an instrument reading 888px of a 4,378px page, and most of one session's 55 wasted turns.
- **Harkirat's own review order on 2026-08-28: not one of his first three objections was a conformance defect.** His eye is already the test that works; the number never was.

🔴 **WHAT HE IS SHOWN, BECAUSE "HE CLOSES BY LOOKING" IS USELESS WITHOUT A DELIVERABLE.** Found by a reader test on 2026-08-31: §0.7d changed the exit condition and never said what to hand him, so its first use would have produced a percentage — the exact thing it retired. **The deliverable is: both servers running, the two URLs side by side (`:8900` the mockup, `:8901/harness.html?fresh=1#/<realm>` the portal), and the list of decisions I made with their reasons.** Not a report, not a number. **Evidence: on 2026-08-28 he found four composition defects in about two seconds from two screenshots.** ⚠️ He dropped the A/B artifact for Season, which says the ARTIFACT was never the useful part — **the looking is.**

⚠️ **THIS DOES NOT RETIRE THE INSTRUMENTS.** Run the audit, read the sections, triage per §0.7c — then **read the code around what it points at**. What changes is the exit condition: a realm closes when *he* has looked, not when a percentage is small. **Do not drive a number to zero. Do not report a percentage as an achievement.**

⛔ **AND THE FLOOR MAKES IT MOOT ANYWAY** — Season's diff can never reach zero: 13 cited differences are kept on purpose and one of them offsets the whole page by 16px.

---

## §0.7c — HOW TO WORK A REALM WITHOUT SPENDING A SESSION ON IT (written 2026-08-31 after Season cost one)

⚠️ **UNTESTED, AND ITS HEADLINE RATIO DOES NOT TRANSFER.** Written from Season, after Season, and never run on anything. Season's triage collapsed to 23 FIX of 169 because **83 rows were cited by decisions made minutes earlier in the mode collapse** — Armory has no collapse behind it, so its findings will be genuinely open and that ratio will not repeat. It also covers a RESTING pass while being titled *how to work a realm*; Armory earns the interaction tier, which the four-call loop does not include. **Falsifier: Armory's resting pass in ≤10 calls, or the failure gets written in here the way it was into §0.7a.**

🔴 **FALSIFIED 2026-08-31 20:40 EDT.** Armory's resting pass took roughly 27 calls, not ≤10, before ②–⑤ triage even began. The overrun was not from working the sections one-at-a-time (the mistake §0.7c exists to name) — it was two genuinely unanticipated ① CASCADE defects, each requiring its own diagnose-fix-verify cycle before the next could even be seen: `#mhAdd .pill.mh-t{height:35px}` never applied because the portal's masthead div was missing `id="mhAdd"`, and `loadTClosed()` defaulted to an empty Set instead of `['null']`, so the Unranked tier (≈half the catalogue) rendered expanded instead of collapsed. The four-call loop assumes the shell is already cascade-clean going in, the way Season's was by the time this section was written from it. **It is not a safe assumption for a realm nobody has opened yet.**

🔴 **RE-MEASURED 2026-08-31 22:0x EDT, AND THE OVERRUN IS IN CALL 3, NOT IN THE TRIAGE.** A second pass over the same realm — this time reading the plan BEFORE working rather than after — split cleanly: **capture and triage cost 3 calls** (`portal:status`, the default view, then the other three views in one batched call), and **not one browser probe was written during triage** because every question it raised was answered by reading the code and the comment beside it, which is exactly what §0.7c asks for. So the loop's calls 1 and 2 hold. **Call 3 is where the model is wrong.** It budgets ONE scripted edit followed by one re-audit, and a realm with several INDEPENDENT root causes needs one verify round per group: a fix moves ② and ④ in ways only a re-measure can show, and two of this session's fixes (the tier class rename, the duplicate view header) each changed the page enough that the next batch could not honestly be composed from the previous reading. Three verify rounds, plus two regression realms the four-call loop does not budget for at all, plus the interaction tier. **The honest shape is `3 + (1 per independent root-cause group) + 1 regression + the interaction tier`** — and the previous pass's 27 was not a triage failure either, it was two unanticipated ① CASCADE defects each needing their own round. ⚠️ **The four-call figure should be read as the floor for a realm whose shell is already cascade-clean and whose defects share a cause. Armory was neither, twice.**

🔴 **THIS SECTION EXISTS BECAUSE SEASON'S TAIL — five ② SHAPE findings — COST ROUGHLY TWENTY-FIVE TURNS.** Harkirat, 2026-08-31 11:0x EDT: *"I'm afraid you're going to waste multiple sessions and hundreds of turns on armory realm, and then again on analytics."* §0.7a already said ②–⑤ are each ONE BATCH; it was loaded at session start and worked against anyway. **A rule that has been ignored once needs the failure written beside it, not a louder restatement.**

**What actually went wrong, and it is one mistake with three faces:** each finding was probed, root-caused, edited and re-measured on its own. Five findings became five investigations. The audit had already grouped them.

### The loop — 🔴 **NOT four calls; read the two falsification blocks directly above this heading before using the table below**

⚠️ **This heading said "and it is four calls for a realm's resting pass" until 2026-09-01, seven lines under the block that falsified it twice.** A skimmer reads headings and tables, which is exactly how a figure survives its own retraction. **The honest shape is `3 + (1 per independent root-cause group) + 1 regression + the interaction tier`**; four is the floor for a realm whose shell is already cascade-clean and whose defects share a cause, and no realm has met that description yet.

| | Call | Tool — this column is part of the procedure, not a preference | What it does |
|---|---|---|---|
| **1** | **ONE Bash call carrying one `npm run portal:audit -- --realm <r> --view "<tab>"` per view**, each with `--all` for row depth. 🔴 **`--all` DOES NOT WALK VIEWS — it lifts the per-section 25-row caps on ONE view**, and reading it as "every view" is how Armory came to be recorded as closed with three of its four views never looked at. `portal:status` prints each realm's view names | Capture. Nothing else. |
| **2** | **`ctx_search` for the ledger and the plans · `codebase-memory` (`search_graph` / `get_code_snippet`) for a symbol · `Read` with `offset`/`limit` for the comment beside the code.** ⛔ **Not `rg`, and not a browser or a probe** | Sort **every** ③/④/⑤ row into four buckets from the audit's own output plus that comment. Write `local/<realm>-triage.md`. |
| **3** | **ONE `python3` heredoc** — an `assert <anchor> in s` per change — with `node --check`, the build and the re-audit of all views **chained into the same call** | The FIX bucket, applied. |
| **4** | `ctx_search` again to place each new row, then the ordinary editors | Close: ledger · §L · changelog · fixture · gates. |

⚠️ **The tool column is here because leaving it out made routing a general preference instead of a step.** Measured on the ledger 2026-08-31: **`rg` found 1 of 6** real finding selectors and **`ctx_search` found 5 of 5** on the same questions, because a ledger row is prose and a finding is a literal. A rule stated once in a memory index competes with a Bash call that is always one keystroke away; a rule written into the call it belongs to does not.

### 🔴 THE FOUR TRIAGE BUCKETS. Measured on Season: only a handful of rows survive into FIX.

| Bucket | Test | Season's example |
|---|---|---|
| **CITED (b)/(c)** | A difference kept on purpose. **It reports forever and is not work.** | The tier pills, the clock digits, the one-way strip's 7-vs-5, every disabled control |
| **DEAD ON BOTH SIDES** | The design's stylesheet keeps a rule its own page does not emit | `.dend` ×8 and `.pill.ghost` — **0 elements in either page** |
| **ALREADY SETTLED** | The answer is written down somewhere. **Read the comment before probing** | The accent tokens, settled in `tokens.css`'s own comment; `dateOnly`, settled in `rowLifecycleByDate`'s |
| **FIX** | Everything else | |

### Three tests that retire a whole class of finding at once

1. 🔴 **⑤ RULES IS ADVISORY — a rule difference the RENDERED page does not show is not work.** §0.10 already says the rendered value is ground truth. Season's ⑤ listed 44 differing selectors; almost none manifested in ④.
2. 🔴 **A SYMMETRIC DIFFERENCE IS A PAIRING ARTIFACT.** When `A → B` and `B → A` both appear, the instrument matched the wrong pair. Season's overview strip reported ~20 width and colour differences that way. **The test is to compare the elements AS A SET, order-independently** — sorted `left,top,width,colour` tuples. Done for the minis: `left`, `width` and colour matched **exactly**, and the sets differed only by a constant **+15px** of `top`, which is the cited cascade. They were never wrong.
3. **A SUB-PIXEL DIFFERENCE IS NOISE.** `width: 921px → 920.469px` is not a finding.

### ⛔ The rules that keep the loop closed

- **Never investigate during triage.** If a FIX row needs a probe, it goes to a second batch — inline investigation is the loop this section exists to break.
- **Read the neighbouring comment before writing a probe.** Twice on 2026-08-31 the answer sat three lines from the code.
- **Fix the first ① CASCADE offset alone — unless it is CITED**, in which case close it and work ④ through it. A kept difference cannot be driven to zero, and Season's ① will report its +16px forever (Harkirat, 2026-08-31 10:5x EDT).
- **A realm's number has a FLOOR made of its cited rows.** Grade on the enumeration — are the regions exactly the cited set — never on the percentage.

⚠️ **Armory is the second-densest reference (96KB, 14 handlers per `portal:status` — this read 99.6/13, the unlabelled second measurement §0.6a already deleted once) and earns the full treatment including the interaction tier. It must not earn a second discovery of this method.**

---

## §0.4b — 🔴 THE OBSERVABLE FOR EVERY INSTRUCTION THAT PREVIOUSLY HAD NONE (added 2026-09-01)

*A cold reader was asked which requirements in this plan a session could fail while believing it complied, and nothing would catch it. It found eight. An instruction with no observable is a preference wearing a rule's clothes — and `MEMORY.md` already names the shape: **"batch aggressively" is an adverb and cannot be violated; a turn count can.** Each row below gives the artifact a session states in its closing summary, so the next reader can check rather than trust.*

| Instruction | Where it lives | The observable — state it in the closing summary |
|---|---|---|
| "batch aggressively" | §0.4, MEMORY.md, every realm prompt | 🔴 **The TURN COUNT for the resting pass, against the target the realm prompt states.** An adverb cannot be violated; a number can |
| `sequentialthinking` "mandatory when auditing or reviewing" | §0.4, MEMORY.md rule 4 | **The triage file opens with the method that pass set.** If the file does not say what the thinking decided, the thinking is unevidenced |
| "Never investigate during triage" | §0.7c | **`local/<realm>-triage.md` exists, and every row cites an audit line or a code comment — zero rows cite a probe.** A probe citation in a triage row IS the violation, visible in the artifact |
| ① LOCATE | §0.5b | `local/locate-<realm>.md` — already stated as *"or it did not happen"*, and the only phase that got this right |
| ⑥ UX-COPY | §0.5b | **A UX-copy section in the difference ledger with one row per audit row**, each applied or answered |
| "cut the report, never the looking" | §0.46 | 🔴 **The COUNT of band captures read.** Three minimum on a page over 1,000px. "I looked" is unfalsifiable; `Read /tmp/band.png` ×N is not |
| 🔴 **The RESULT of a look — the one thing in this method that survives nothing** | new, 2026-09-01 | **Two lines in the triage file after EVERY capture: what the band showed.** A screenshot does not survive a compact and neither does the sentence nobody wrote. §0.46 makes the looking the deliverable and no carrier holds its output — so the most expensive thing to reproduce is the only one with no home. Found by a cold reader asked what it would lose in a compact |
| R5 — never write "done"/"complete"/"fixed, all N" | §0.5a | **Greppable, and ungrepped.** `rg -i '\bdone\b\|\bcomplete\b\|fixed, all' <the summary>` before sending it |
| §L's same-commit rule | §L's opening line | **A commit touching `portal/ui/**` whose diff does not touch this plan.** ⚠️ It has already failed once — §L row 4 carried three wrong Access figures while the realm prompt documented them as wrong. Filed as a hook candidate in `docs/db-deferred-list.md`; until then it is a pre-commit `git diff --name-only` you run yourself |

⚠️ **This table does not enforce anything either.** What it changes is that a reader can now tell compliance from its absence, which is the precondition for a hook and the thing eight of these lacked.

---

## §L — THE LIVE LEDGER

🔴 **THE ONE RULE THAT KEEPS THIS DOCUMENT TRUE: update this table in the SAME COMMIT that closes a unit.** Not afterwards, not in a handoff. A row whose status is wrong is worse than no row, because the next session trusts it — which is exactly how the doubled search bar came to be recorded as fixed while it was on screen.

⚠️ **If a finding CONTRADICTS this plan, edit the plan in that same commit.** A session that works around a wrong instruction and leaves it standing hands the next session the same wrong instruction plus a workaround it cannot see.

⚠️ **Commits are per coherent fix; a Part's ledger row closes ONCE, at the end.** A Part is continuous — it is not a single commit. Season alone is several sessions, and one commit spanning that is unreviewable and guarantees any stop lands on a dirty tree.

🔴 **THREE THINGS BURIED INSIDE ROW 1'S NOTE THAT COST TURNS IF SKIMMED — hoisted here 2026-09-01 because that cell is ~2,400 unparagraphed words inside a table, and a cold reader named it the passage a fresh session is most likely to skip.** Nothing is deleted from the row; this is the index to it.
- 🔵 **375×812 IS DELIBERATELY NOT RUN — a decision, not a to-do.** *"A session reading 'never run' as a to-do would be the third to spend turns here."*
- 🔴 **`sessionStorage` cross-contaminated earlier readings.** The mockup persists five UI keys and the instruments reused one page across passes; both clear storage now, but any figure recorded before 2026-08-30 may be residue.
- 🔵 **The resting Track's `All` chip and its two `Sep 15` nodes are PAIRING ARTEFACTS**, proven by loading both pages. Do not chase them, and treat any one-sided SHAPE row as a candidate for the same.

| # | Unit | Status | Closed by | Note |
|---|---|---|---|---|
| **0** | Reverse-orphan sweep, scripted and in `npm test` | ☑ closed | `scripts/portalReverseOrphans.mjs` + `.test.mjs` | must report `data-bare`, `hcard`, `srec-open` and `--ci` on its first run or it is not trusted. ⚠️ **NOT `t-best`** — it IS emitted (`armory.js:165`), and a concatenation-aware scanner will correctly stay quiet about it |
| **0** | Mockup-side grid injection, written down once | ☑ closed | `docs/superpowers/mockups/2026-08-23-portal-interactive/assets/shell.js`'s `__instruments()` | `?grid` at boot or `__instruments()` on demand, in the one file all eight pages already load. Proved: `season.html?grid` returned examined **1361**, near **2**, size **33** |
| **0** | The viewport contract, 1282×888 | ☑ closed | `.grid.js`'s `__grid.viewport()` | baked into every reading — a page cannot resize its own window, so each measurement states what it was taken at and an off-contract one says so in the reading itself. `portalGeometry` REFUSES to record off-contract |
| **0** | The states harness (page + driver, catalogue grows per realm) | ☑ closed | `scripts/portalStates.mjs` + `lib/portalStatePasses.cjs` | **18 shell states walk clean** at 1282×888; registry `portal/fixtures/states/shell.json`. PASS 1/3/4 are RELATIONAL; **no PASS 2**. ⚠️ **The row said PAGE + driver and there is NO page** — a JSON registry plus a headless driver replaces `.states.html`, because a page is reachable only by hand while a driver runs in `npm test`. Recording the deviation rather than the tick. **⊘ the page half, deliberately.** ✅ **PASS 5 (reduced motion) IS implemented now** — the media query is emulated, the page is made to CONFIRM it applied (or the state fails rather than examining the ordinary view), and what is still running is read. Season walks clean under it: the Track's 2800ms `pulse` stops. The earlier claim that a rendered walk was the wrong instrument for it was simply wrong. ⚠️ **`refreshing` and `progress` still could not be REACHED**, and chasing them found a real defect — `useAsync`'s `hostClass` was produced and consumed by nothing anywhere in `portal/ui` — now fixed across all seven realms with a conservation check. The two states remain unregistered with both failed triggers written down. 🔴 **AND THE WALK WAS NON-DETERMINISTIC UNTIL 2026-08-30 18:19 EDT** — it failed inside a full `npm test` on *identity · closed again from the header's dead space* and passed five times when run alone, because the step settle was a fixed 700ms sleep. A step may now name `until: <selector>` and the driver polls for it, so a loaded machine waits as long as it must; the failure message names the state, the selector and the timeout, and was proven able to fire by pointing it at an element that does not exist. `stepSettle` is a pure function with its own cases in `portalStates.test.mjs`, including that `waitMs: 0` must NOT fall through to the default — the `slow` state is measured mid-flight and any wait would destroy its subject |
| **0** | Per-realm geometry fixtures — the format and the runner | ☑ closed | `scripts/portalGeometry.mjs` + `.test.mjs` | `--realm <r> --write|--check`, `--all --check` in `npm test`. **Round-trip PROVED 2026-08-28 11:2x EDT — and the first attempt FAILED**: `--check` straight after `--write` reported `Track · nearMisses: 8 → 4` with no code in between, because the first view was measured the instant fonts settled while every later view got a settle after its tab click. Five reads inside one settled page were identical, so the reading was stable and the moment was not. Every view now gets the same settle, **and a reading is only accepted once it REPEATS** — a surface that never stabilises is reported rather than recorded at whatever the last attempt saw. Two writes and a check now agree exactly. No fixture is recorded **on purpose** — a realm records its own when its Part closes |
| **0** | **THE SHELL** — rail · command bar · masthead frame · account panel · tray · toast · overlay · export strip · manifest frame · `async.js`'s six states · tooltip runtime | ☑ closed | `palette.js` · `shell.js` | **Eleven nouns, and the first tick covered four.** Now registered and walked as states, each with an `expect` selector proving it reached its own subject: rail · command bar (closed, open, typed) · masthead · account panel · **export strip** (opens from the button INSIDE `.mh-take`, not the wrapper) · **manifest frame + its selection bar** · **toast** · **tooltip runtime** (`.tip`, delegated from the document) · **one-way panel** · four of `async.js`'s six request states. **Owed and filed, not silently dropped:** `refreshing` and `progress`, which need a refetch and a commit in flight. | **doubled search bar FIXED** — `data-bare` now emitted, measured 44px→16px inside the 34px bar. **A third defect the states walk found: "Copy my Discord ID" acknowledged nothing at all** — both routes were a bare `navigator.clipboard?.writeText(...)`, so on success it said nothing and in an insecure context the optional chain swallowed the whole action. Both now route through one function that toasts on success and says what to do instead on refusal. **And a second defect the shell diff found: the rail, the crumb, the panel title and the command-bar placeholder were all printing the realm ID raw** — a rail reading "season armory broadcast" against the mockup's "Season Armory Broadcast", against COMPANION §2307's explicit rule that `realm` stays in the code and leaves the copy. One `REALM_LABEL` map now serves all four |
| **0** | 🔑 **THE DEV OAUTH SIGN-IN** | ☑ closed | signed in 2026-08-28 10:5x EDT | **Harkirat scanned Discord's QR login from his phone** (screenshotted out of the live page) and authorized in chat; the browser signed in as `diorswrld`, which the dev database already holds as an admin, so the door opened rather than showing the forbidden state. The redirect URI was already registered — step 4 was never needed. **Step 5 passed, and only after the three defects it exposed were fixed** — see the row below. All four test changesets were discarded afterwards; the one pre-existing `draw.edit` was left untouched |
| **0** | **The door / login page** | ☑ closed | measured on the real server | Diffed against `door.html` at 1282: `main.door`, `.doorcard` (430px), `.doormk`, the h1, and the `.dbtn` (360×46, Discord blurple `rgb(88,101,242)`, 6px radius) are identical. Two **portal-ahead** differences, both cited in `shell.js`: the `.doorstate` line, and the OAuth note saying "user ID **and username**" — which is what the `identify` scope actually returns, so the mockup's shorter wording is the stale one. Both door states are in the states registry via `?fail=expired` / `?fail=forbidden` |
| **—** | 🔴 **THE FIRST REAL-SERVER PASS — three defects no fixture could show** | ☑ closed | `season.js` · `review.js` · `board.logic.js` | ⓵ **Every banner edit had always been born BLOCKED.** The editor keyed its payload on the STORAGE field (`drawsBannerUrl`) while `calendar.setBanners` accepts the page name (`draws`), so the op answered *Unknown banner page* and the changeset could never commit. ⓶ **The Review screen threw that sentence away** — it read `failure.reason`, which no validator sets, and printed the generic *"This change no longer validates"* over an error that named the field. ⓷ **A change past character 60 vanished from the diff**: `diffRows` compared FORMATTED values and `fmtDiffValue` truncates at 60, so a ~104-character Cloudinary URL differing only in its tail produced **zero rows** on the one screen that commits. All three are fixed, each with a falsifier; a conservation test now compares the editor's banner vocabulary against the op's own |
| **1** | **SEASON** | ◐ **resting pass closed 2026-08-31** — every audit section worked; the remainder is a CITED floor, not open work. ⚠️ Its ① CASCADE reports a +16px banner-detector offset FOREVER (Harkirat's ruling) and ③ WORDS is 100% cited (b). Real-server walk PASSES: 58/47/61 rows across three views, past the door, one 404 and it is the favicon. **Not closed by me — Harkirat decides.** | `222b67a` `99bd908` `26e4af0` `9602615` `31f7c33` | 🔴 **READ §0.44, §0.45 AND §0.46 BEFORE TOUCHING THIS.** ⓪ **`npm run portal:diff -- --realm season` first**, then `--view Board`, `--view Repairs`, `--viewport 375x812`. 🔴 **THE DIFFERENCE LEDGER IS WRITTEN: `local/difference-ledger-season.md`** (gitignored — state the path). **A/B artifact: https://claude.ai/code/artifact/c4a40347-447c-45fd-9ca9-d5d1835e40e9** — four pairs, superseded for the overlay tier by **https://claude.ai/code/artifact/7943280f-c5ca-48f6-a6a4-ca145fbe3787** (2026-08-30): six surfaces, the three resting views plus the identity editor, the patch-note composer and the record preview, each a capture of two RUNNING pages with the before figure beside the after. Neither is a reconstruction. — four pairs, `mk-` and `pt-` labelled on every frame, with a flip control that swaps one frame in place. It carries every row below with its evidence, so do not re-derive them. ✅ **Second pass closed eight**: the ADD row right-aligning to `.mh-id`'s edge at x=995 while the export line beneath it ended at x=1260 — `.mh-add`'s grid declarations were inert because `Masthead` rendered it inside `.mh-id`, and **Armory had the identical defect** · the NOW chip, whose `attr(data-now)` producer never existed · the rail casing disagreeing with the clock's on the same screen · the THEN line's missing distance · one absence drawn as two objects in one fold · **Board and Repairs diffed at last** (`--view`, which REFUSES rather than falling through) · **375×812 diffed at last** (`--viewport`; 7.3% in 12 regions) · and the tool's own session, which held three realms of six and was reporting the rail as a difference. 🔵 **Adjudicated, do NOT re-open**: Board's changeset pipeline (spec §F3, recorded at COMPANION's foot) · the one-figure clock and its RIGHT alignment (§16.31a — the `left` rule is `.hclock`, Home's) · the subtitle measure (both sides declare `max-width:62ch`; only the column differs) · the raw id (a data-collection decision needing a PRIVACY amendment, not a conformance fix). ✅ **CLOSED 2026-08-29 01:0x EDT, by the audit loop (§0.7a)**: Repairs now runs the design's SIX checks in its two kinds — the three that were absent (draw window with no draw, draw served synthetic, looks like 2× CP) are built, and `gaps in a lane`, which §5.2 does not list, stands down under the flag · the fifth export format (`season.all`, the whole Track as columns) · the window range, which is the view bar's meta line on every view and was in the Zoomer · **and the four other Manifest/Track defects the audit found and this row never knew about**: one lifecycle answer instead of two disagreeing on nine rows, `dateOnly` reaching the Track so "served synthetic" can see its eleven, the spark's state and progress, and the design's checkbox in place of a hidden input. 🔴 **STILL OPEN**: Events and Playlists auto-collapsing 20 of 39 Track items · the overview scrubber's mark weight · Repairs' residual (now **0.1%**, see below) · **and the OVERLAY tier, added 2026-08-30**: `--triggers` lists ~100 controls on the default view and only FOUR overlays were measured (composer Event 0.9% / Draw 1.2%, export drawer 0.3%, day drawer 1.0%) — **the four remaining composer kinds, the expanded identity editor, the one-way typed confirm and the row preview are unmeasured.** ⚠️ **This row listed three items while `.remember` listed seven, so a session trusting the ledger alone under-scoped Season by more than half** — caught 2026-08-30 16:4x EDT by a read-only audit. §L's own rule is that a finding is folded in by the commit that discovers it; the overlay findings were not. ⚠️ **The clock, the context band, the one-line draft state and the picture-led banner row are MY design calls**, made after he refused a pop-up — *"USE YOUR DESIGN KNOWLEDGE"*. 🔴 **SESSION 2026-08-30 19:4x EDT: THE OVERLAY TIER IS NOW SIX COMPOSER KINDS AT 0.8–1.2%, AND THE MEASUREMENTS ARE ISOLATED FOR THE FIRST TIME.** The mockup persists five UI keys in `sessionStorage` and `portalDiff` reused ONE page across the mockup shot, the portal shot and the labelling pass, so any `--open` click on a persisting toggle silently changed what every later run measured. Both instruments now clear storage before page scripts run; the resting figures re-measured identically afterwards, so what was recorded was sound — by luck, and now by construction. ✅ **CLOSED THIS SESSION**: the four unmeasured composer kinds (Returning draw 1.2%, Draw window 0.8%, Playlist 0.9%, **Patch note 8.4% → 0.9%** on two pieces of copy) · `--open-sel <css>`, which reaches the overlays no label can · the expanded identity editor, measured for the first time and taken **12.6% → 10.7%** with its height gap **111px → 35px**, by giving a `conforming() ? null` stand-down the design's version instead of nothing · the crumb separator cascade, `+4/-6px` → `-1/+3px` · **PASS 6**, which makes the fused accessible name a checked property on every realm and state rather than a defect fixed one element at a time. 🔵 **RETIRED, DOES NOT REPRODUCE**: *Events and Playlists auto-collapsing 20 of 39 Track items*. The resting Track audit is height-identical at **+0px** with eight SHAPE pieces and none of them a missing lane item — consistent with that reading having been `sessionStorage` residue from an earlier run, which is exactly the leak found this session. 🔵 **NOT DEFECTS — measured 2026-08-30 21:0x EDT, do not chase them**: the resting Track's `button.chip "All"` and its two `Sep 15` nodes were reported one-sided by ② SHAPE and are **pairing artefacts**. Loaded both pages under the same frozen clock with storage cleared: the chip is `chip` / `aria-pressed=true` on BOTH sides and the `Sep 15` node is a `b` with an empty class on BOTH. The audit's LCS alignment paired them against neighbours. Same class as the four one-sided Board triggers that turned out to be whitespace — **an instrument's pairing is not evidence about the page until something checks the page.** ✅ **`.bar.flagged` CLOSED** (`8b67d14`): the design marks the row a finding is about and the portal marked nothing. The selection now lives in `track.logic.js` as `findingRows()`, shared by Repairs and the Track, and only the MECHANICAL findings mark — the first version marked 13 where the design marks 2. ⚠️ **The first round shipped an inert prop**: `flags` is never passed to `Track` at all, so a tested, threaded `flagged` class rendered on nothing and would have committed clean. ✅ **SESSION 2026-08-30 21:5x EDT — THE OVERLAY TIER IS MEASURED END TO END.** All six composer kinds 0.8–1.2% · the expanded identity editor **10.7% → 0.2%**, 35px gap closed, reached with the new `--open-sel` because it opens from a `div` with no accessible name · the record preview **18.8% → 0.6%**, the design's drawer built after Harkirat chose build over citing the divergence · `.bar.flagged` closed from one shared rule · the resting Track's `All` chip and `Sep 15` nodes proven to be PAIRING ARTEFACTS rather than differences. Resting views unchanged at 0.2/0.1/0.1% and Broadcast at 0.3% throughout. 🔴 **STILL OPEN, and this is the whole list**: the identity editor's residual **10.7% / 35px** · the row preview at **18.7%**, where the design opens a Discord-card preview and the portal opens the identity summary — a SHAPE decision, not a pixel chase · the one-way typed confirm, still unmeasured because the mockup renders it from `shell.js` with classes the portal does not share · and the resting Track's last eight SHAPE pieces: the spark's elapsed fill (`span.done` ×9), two scrubber marks, `.bar.flagged` on rows with a Repairs finding, the ruler's `.masked` tick label, and an `All` chip whose class differs. **The real-server pass is owed.** 🔵 **375×812 IS DELIBERATELY NOT RUN — Harkirat, 2026-08-30 21:51 EDT, answering a popup that laid out the conflict.** His standing direction of 2026-08-27 is *"desktop is the primary layout/device which the portal will be used on. Optimize it for desktop first. Mobile optimization is a future endeavour"*, and `docs/superpowers/plans/2026-08-27-portal-completion.md` records that **a phase had already burned real turns on a 375px pass before he said it**. ⚠️ **The counter-argument was made and rejected**: both stylesheets carry real `max-width:768px` rules, so the narrow layout is DESIGNED on both sides rather than a degradation — but that argument lives in a note I wrote on 2026-08-29, and an instruction he gave outranks a note I filed. **So this is not an outstanding gap. It is a decision.** A session reading "never run" as a to-do would be the third to spend turns here; that is what this paragraph exists to prevent. A mobile defect noticed in passing still gets FILED, never fixed. |
| **2** | **ARMORY** | ◐ **all seven §L conditions run and recorded 2026-09-01 except the seventh, which is Harkirat's.** ⚠️ This read *"all six … except the sixth"* until the completeness sweep caught it: the list gained the §0.5c reader test as ⑥ in the same session, and a renumber that leaves a count behind is the conservation defect the sweep exists for. **⑥ is satisfied** — the reader test ran on this Part's own carriers and its sixteen findings are fixed. ① converge: rhythm is VERTICALLY FLAT — every `top` +0 across the masthead chain; its 68-of-86 count is WIDTH deltas, most of them cited copy, and reading that number as alarm is a mistake the next realm should not repeat. ② diff: **8.7%, 935 regions, +508px** — a cited floor, graded by enumeration. ③ **inventory: 9 / 14 / 13 / 7 / 35** — run for the FIRST time on this realm 2026-09-01, and it surfaced four rows nothing else had, three of which became fixes. ④ machine floor green. ⑤ **real-server walk RE-RUN and passes** — 4 views, 126 rows each, one favicon 404 — the previous row inherited a claim that was ten commits stale. **Not closed by me.** | `140082b`→`d0b10c5` + this session (branch `feat/armory-portal-conformance`, unmerged) | **96KB · 14 handlers.** **Seventeen defects closed across three passes**, and the source distribution is the finding: 3 from an instrument section read correctly, 4 from reading CODE around a difference, **7 from cropping the two captures and LOOKING**, 1 from Harkirat on a phone, 2 from chasing why the previous one was missed. **Zero from the percentage.** 🔴 **The largest was dead CSS** — `RANK_KEY` emitted `t-t3`/`t-t4`/`t-t5`/`t-none` against a stylesheet keyed on `.t-top3`/`.t-top4`/`.t-top5`/`.t-unranked`, so four of five tier rules had never applied once. `portalReverseOrphans` carried it as accepted debt in its baseline, which is why nobody read it: **a ratchet's baseline is by construction a list of things already agreed to live with.** 🔴 **The subtlest was a RELATIONSHIP, not a rule** — both sheets carry `.panel + .panel{background:transparent}` byte for byte; one `p.hint` between the two panels broke the adjacency and every row of a 125-row table painted `--raised` instead of `--desk`. ④ reported it and its ordering buried it, which is why ④ now ranks by reach. ✅ **Also closed:** two view headers where the design draws one · a panel inside a panel costing `.rack` 46px · the export strip offering 2 of `/manage`'s 4 scopes · a Manifest `mode` chip that could only ever empty the table · the count dividing by the rows handed in rather than the catalogue · a fused accessible name · Build and Category in the wrong order · the Category column printing the stored enum · **the same enum spelled three ways across the column and two dropdowns** · a `code` cell kind borrowed from `date` · the Badges column's width class · the stat row ending on the wrong figure · `portalAudit --triggers` naming the wrong realm. 🔵 **CITED FLOOR** — see `docs/reference/portal-decision-ledger.md`'s Armory table, every row with a falsifier. The largest contributors are the `.detcell` + `.thumb` pair (~370px) and Compare's −896px, which is a DATA STATE. 📄 `local/armory-triage.md` · `local/difference-ledger-armory.md` (both gitignored — state the paths). 🖼️ **A/B: https://claude.ai/code/artifact/d2a35dd7-d409-44ea-ba96-4c14a16850fa** |
| **3** | **BROADCAST** | ◐ **five of seven §L conditions run 2026-09-01; ⑥ and ⑦ are owed.** ⚠️ **This row said "all seven except the seventh" while its own text said ⑥ was owed — the same self-contradiction the Armory row above already carries a warning about, committed one row below that warning.** ① 🔴 **`portalConverge` HAD NOT BEEN RUN WHEN THIS ROW WAS FIRST WRITTEN — `portal:audit`'s ① CASCADE section was substituted for it, and `portal:status` said `converge · never` while the row claimed ① was done.** Caught by the §0.5c reader test; that is [[feedback_substituting_the_near_neighbour]] with the receipt board contradicting the claim in the same tree. **Run afterwards, and it saw things the audit did not**: RHYTHM 8 mismatches of 61 design nodes — one is the `colgroup +40px` (CITED), and **six were verified element-by-element as shallow-walk pairing artifacts**, `nstack`/`chint`/`pnote`/`h5`/`nowwrap`/`nprev` all existing on BOTH sides under identical names (§0.7a: converge walks four levels, and one extra wrapper desynchronises every path beneath it); the eighth, `ABSENT mk button.chip` at y=897, is contradicted by `--triggers` reporting `All · live · scheduled · expired` on both sides and is unresolved. WORDS 13 rows are ONE mechanism — htm drops whitespace-only text nodes between siblings, so every ancestor's `textContent` concatenates; all 13 are container `div`s and `section`s, none a control, and PASS 6 covers the controls. STYLE 3 are `min-height`. **① is therefore not clean; it is enumerated.** ① CASCADE in `portal:audit` is empty on the resting page and CITED (`b.crumb-sep`) under every `--open`. ② diff **0.2% · 16 regions · both pages 1258px** — the regions are exactly the cited set. ③ inventory's six lists: 1 · 3 · 1 · 1 · 0 · 4, **every row cited or settled**, none open. ④ machine floor green — `npm test` exit **0** and `portal:reverse-orphans --ci` clean, ⚠️ **both re-run at the final commit**: the first claim of exit 0 was measured BEFORE the `portalRealWalk` edit and the suite was RED on it for two commits, on this branch's own hard-wrapped comment. A gate result is a fact about a tree, and the tree moved. ⑤ **real-server walk PASSES**: past the door, `Delivery queue` 5 rows / `Airtime` 9 rows, distinct readings, one favicon 404. ⑥ owed — the reader test on Part 4's carriers. **Not closed by me.** | *(this branch, unmerged)* | **39KB · 5 handlers.** ② SHAPE **20 → 8** and **22 → 8**, ③ WORDS **1 → 0**, ④ STYLE **9 → 4** on the two views. 🔴 **The largest defect was invisible to every gate and to the percentage: `.stt.saved` painted `--ink2` on `--ok` at 1.34:1** where the design draws near-black at **11.29:1** — found by cropping the two captures into an aligned band and looking, which is where 7 of Armory's 17 also came from. Its cause is a stylesheet-level one: `.stt.saved{background:var(--c,var(--ok))}` at `app.css:3698` guaranteed a fill **17 lines above** the colour fallback at `:3715`, which was still written for the unfilled case — ⚠️ *"three lines up"* is the CSS comment describing its OWN position and does not survive being lifted into prose. And the design's 11.29:1 is a **runtime** fact, not a stylesheet one: `assets/shell.js:783-786` reads each `.stt`'s computed background and writes `--ci` from it, so the two sheets' fallbacks were byte-identical while the pages were not. 🔴 **And the same component's `PILL` map emitted `stag`/`sched`/`exp`/`conf` against stylesheets defining only `.stt.saved`/`.stt.staged`/`.stt.conflict`** — `season.logic.js` returns exactly `live`\|`staged`\|`conflict`, so **every staged and every conflict row on Season had been rendering its state chip with no shape at all**, against COMPANION §0.0's law. Armory's `RANK_KEY` defect, in the same file, carried in the same ratchet baseline. ✅ **The interaction tier: all THREE reachable surfaces, and "in full" was written here when only two had been opened.** 🔴 **That claim went into a commit message and this row before it was true** — the correction came from turning the audit inward at the end of the session, not from any instrument. `--triggers` 17 · 17, `--open` on the Post form and the Export drawer, and **`--open-sel button.rmv` on the delete Confirm — the surface `--triggers` structurally cannot list, because it lives in a data row** (§0.6c says the listing is a FLOOR, never a ceiling; this is the case it warns about). The Confirm measures mk 1800px / pt 1896px with 35 SHAPE · 7 WORDS · 39 STYLE, and **every row is CITED or sub-pixel**: the drawer itself differs by 0.9px and the +96px is the resting page beneath it. Its four copy rows are ONE decision — the mockup's row control is its **tier-1 `Remove`** and the portal stages a **tier-2 deletion** Review commits, which is Armory's `removeLabel` ledger row extended to this realm. 🔴 **And opening it found a real defect nothing else could see: two `bulkActions` verbs that could never be invoked**, because `selectable={false}` is a deliberate conformance decision here and the bulk bar needs a selection. Removed. The Post form was an **inline `div.panel` where the design opens a shell drawer** — 49 SHAPE pieces mockup-only and the view panel 291px taller; ported, **49 → 21**. ✅ Also closed: the Airtime ruler's Track-borrowed `<b>`, the `never` cell's `<b>`, Posted's cell kind (`td.d` `--ink3` → `td.nums` `--ink2`), `.ncell` as a `<span>` (3 of the 4 mockup pages write one; only `season.html` writes a `div`), the inert `.sev.warn` modifier, the export scope label, a comment naming a `portal/ui/rail.css` that does not exist, and **`portalRealWalk` defaulting to Season's view names on every realm** — which made this realm's first walk fail on two views it has never had. 🔵 **CITED FLOOR:** `docs/reference/portal-decision-ledger.md`'s Broadcast table — **nine decisions each with a falsifier, plus a tenth row that is a RECORD of what was fixed and correctly has none.** A falsifier answers *what would reopen this*, and nothing reopens a defect that is gone. 📄 `local/broadcast-triage.md` · `local/difference-ledger-broadcast.md` (both gitignored — state the paths). ⚠️ **Season's own figures in row 1 do NOT reproduce at HEAD** (12.0% / 135 regions / +224px on the default view, measured twice, before and after this branch's changes, with the changes stashed) — filed in `docs/db-deferred-list.md`, not this Part's work |
| **4** | **ACCESS** | ◐ **five of seven §L conditions run 2026-09-01 19:00 EDT; ⑥ is this session's next step and ⑦ is his.** ① converge: **71 mismatches of 73 design nodes → 49**, and the 49 are ENUMERATED into five groups — the inline composer he chose to keep (8 rows + the 170px cascade it causes), the sessions panel as a data state (13 rows, mockup fixture has 0 sessions and the harness has 2), the masthead's 0-vs-1 signed-in figure (3), the cross-realm export take line (2), and the racknote whose closing clause the design repeats verbatim (the 17px and the small offsets under it). ② diff **8.6% → 6.3%**, and the percentage went UP once between two strict improvements because the portal grew TALLER than the mockup and the tool compares over the shorter of the two — **read the region enumeration, never the number.** ③ **inventory: 5 mockup-only / 13 portal-only, and every row maps to a decision or a fixture difference.** It ran twice, and the SECOND run — after converge and the page diff had both gone quiet — produced the last two real defects of the pass. ④ machine floor green, `npm test` and `docs:audit` both exit **0**, ⚠️ **re-run at the commit claimed** — and the first claim of green came from a background-task summary reporting the WRAPPER's exit while `npm test exit=1` sat in the log above it. ⑤ **real-server walk PASSES** on `:8787` under `--env-file=.env.dev` (confirmed by `ps`, not assumed): both views entered, distinct readings 3220/2729 chars, one favicon 404. ⑥ owed. **Not closed by me.** | *(this branch, unmerged)* | **46KB · 8 handlers** per `npm run portal:status`. ⚠️ **THREE VIEWS BECAME TWO**: `Sessions` was a view tab and is now the design's second always-visible panel (his call, batched with the composer fork into one pop-up at the start of the pass), and `By scope` is renamed **`By permission`** — the design's word, and independently the word the UX-copy audit's vocabulary table settles on because *"scope" already means a permission on Access*. 🔴 **SIX DEFECTS, AND THE THREE LARGEST WERE INVISIBLE TO EVERY GATE.** (1) `.mxcell[aria-checked=true]::after` drew its checkmark as a **black bar hanging out of every granted cell** — the tick is centred only by the 26px rule's `place-items:center`, which a LATER 16px `.mxcell` rule replaces with `display:block`; the mockup never trips it because it marks cells `aria-pressed` where the portal marks them `aria-checked`, so **two sides ran different code paths through identical CSS.** Found by cropping the two captures and looking, which is now where the largest defect on three consecutive realms has come from. (2) **The owner row had never rendered once**: `owner = a.discordId === isOwnerId` over `matrix.admins`, but the owner is not an `AdminUser`, so `buildPermissionMatrix` can never return one — the header promised "owner is not editable" about a row it did not draw, and `.ownerrow`/`.locked` had no emitter in either stylesheet. (3) `tone:'hot'` and `tone:'bad'` **styled nothing** — the only tones defined anywhere are `.stat.warn` and `.stat.stg`, so a single-points-of-failure count meant to warn painted in ordinary ink. `home.js:229` already carried a comment recording the identical failure for a `tone:'live'`; **when a file documents a defect class, grep for other instances of it in the same pass.** ✅ Also closed: the missing `permissions` masthead stat · the owner-only callout, which is the one thing a reader cannot work out from the grid · the racknote · the mark legend and the view meta line, moved into `Shell`'s `realmKey` and `meta` slots, **both of which already existed and this realm used neither** · the grant shortcut, `G` → the `n` every mockup and every other realm binds · the By-permission list, which showed twelve raw tokens with grey dots and explained neither flag it drew · `accentOf`, scoped inside `ByAdmin` so the second view painted every dot grey · the owner-only 🔒 the new legend named but the grid did not draw · and an inherited cell also wearing `.on`, which **rendered correctly only because `.inh` is declared later in the stylesheet.** 🔵 **CITED FLOOR:** `docs/reference/portal-decision-ledger.md`'s Access table — **sixteen rows, each with a falsifier, plus the dev-data reachability note.** Two of them retire claims THIS PLAN carried: the `.mxgrp` colspan warning **does not reproduce** (both sides derive their spans, checked on the real server where the prompt said it would show), and `.locked` was a `--why` scanner artefact **and** genuinely unreachable — two causes, one symptom, and only the second was a defect. 📄 `local/locate-access.md` — §0.5b's phase ① artifact, nineteen rows, the step the plan records as most often claimed and never produced (gitignored — state the path). 🔴 **PART 5's PROMPT IS WRITTEN: `docs/superpowers/plans/ANALYTICS-PROMPT.md`** — tracked, and it carries three PRE-MEASURED suspects for that realm rather than generic advice. ⚠️ **This cell read "47.7KB · 7 handlers · 15 data-attrs" until 2026-09-01 and all three were wrong** — the tool prints 46/8, `rg -o 'addEventListener\|onclick=' access.html \| wc -l` returns 8, and **nothing in `scripts/` prints a per-realm data-attribute count at all**, so the third figure had no producing instrument (`access.html` carries 12 distinct `data-*` names / 30 occurrences; `access.js` carries none). Caught by the §0.5c reader test on Part 4's prompt, which documented the disagreement while this row went uncorrected — **§L's own opening rule is that a row whose status is wrong is worse than no row**, and it applies to figures, not only to ticks |
| **5** | **ANALYTICS** | ☐ open | | **🔴 START AT `docs/superpowers/plans/ANALYTICS-PROMPT.md`** — tracked, written 2026-09-01 19:10 EDT by the Access session, and it supersedes this cell for anything operational. `npm run portal:status` prints **44KB · 1 handler**; the 46.1KB here is the file's **46,107 bytes** relabelled, so the two are one file in two units and **the tool wins**. **FIVE views — Health · Usage · Timing · Reach · Search — and the names are identical on both sides**, so `--view` works on every one. Near-static reference: composition, not an interaction tier. Three suspects are already named and grepped: `tone:'bad'` with no rule (the fourth instance of that defect), `LEVEL_ROW` as a class-name lookup table against a `lv-caution` rule it cannot produce, and several classes built from DATA rather than a closed set |
| **6a** | **REVIEW** | ☐ open | | failure mode: correctness. **18.9KB · ZERO handlers** — one tenth of Season's reference and nothing to open. A percentage chase here manufactures precision the source does not contain |
| **6b** | **HOME** | ☐ open | | failure mode: composition. Target is COMPANION, **not** the mockup — and the measurement now supports that row: **22.4KB · ZERO handlers · 1 data-attr** |
| **7** | The sweep, the misc, and the double-check | ☐ open | | |
| **—** | Closing DEVLOG narrative entry | ☐ open | | one story, after all the rest |

🔴 **☑ IS A CLAIM ABOUT THE SURFACE, NOT ABOUT THE CHECKLIST, AND IT IS HARKIRAT'S TO MAKE.** The old four conditions were activities; a realm satisfied all four three times without matching its design. **A row closes when, in this order:** ① `portalConverge` reports a flat rhythm — no mismatch above a few px; ② `portalDiff` reports **exactly the CITED set of regions and no others** — 🔴 **this said "zero regions above the noise floor, on every view and at BOTH WIDTHS" until 2026-09-01 and every clause of that was wrong by then**: §0.7d retired the percentage as a target, §0.6a records that a realm has a permanent cited FLOOR so zero is unreachable, §L's own Season row says 375×812 is **deliberately not run**, and "noise floor" was never given a number because `--selftest` returns 0.000% and there is no inherent noise to budget for. Grade on the ENUMERATION, at 1282×888, on every view the realm has. ⚠️ **`--portal harness` compares DESIGN; the real-server pass in ⑤ is a separate obligation and neither substitutes for the other** — SESSION-START calls a harness-only reading a violation, and it is one only when it is offered as the whole answer; ③ `portalInventory`'s **six** lists are empty or adjudicated with a **dated** citation; ④ the machine floor is green; ⑤ a real-server pass has run, because the overlay is fixture-driven and cannot see correctness; ⑥ **the §0.5c READER TEST has been run on the carriers and everything it found is fixed** — hand `BROADCAST-PROMPT.md`-equivalent, this plan and the handoff to a read-only agent with no transcript, ask it to start the NEXT Part and to report every place it cannot; ⑦ **Harkirat has looked and said so.**

🔴 **⑥ IS A CONDITION NOW, AND IT WAS A PARAGRAPH IN §0.5c THAT NOTHING REQUIRED.** Run on Part 2's carriers 2026-09-01, only because Harkirat asked, it found **sixteen defects in twenty minutes** — including that the next Part's own prompt would have failed on its first three commands (its instruments hardcode two ports and spawn nothing) and would then have closed a two-view realm having audited ONE, because `--all` was described as walking views and does not. **Neither is visible from the inside**: the author knows what the words meant. Every previous Part shipped without it. Never write done — §0.5 R5.

**Status vocabulary, so a tick means one thing:** ☐ open · ◐ in flight *(name the sub-state in Note)* · ☑ closed *(gates green · committed · changelog paragraph written · A/B artifact published)* — 🔴 **BUT TWO OF THOSE FOUR ARE NOT A PART'S TO DO, AND READING THEM AS BLOCKERS DEADLOCKS THE PART.** Found by the §0.5c reader test 2026-09-01. **The changelog paragraph is the PRE-MERGE checkpoint**: it must cite `(#PR)` as a real number, the number does not exist until a PR does, and a Part is forbidden to open one or to ask. So it is written on the branch after Harkirat opens the PR — **not by the Part, and not a condition of the Part's row**. **And the A/B artifact is governed by §0.7d, which supersedes this line**: he dropped it for Season, *"which says the ARTIFACT was never the useful part — the looking is"*, and §L's own seven closing conditions never list it. Build one only if the realm has a surface a still frame settles better than the two live URLs do; otherwise the deliverable is the servers, the URLs and the decision list. ⚠️ **Both agents that read these carriers cold named this pair as their single largest uncertainty**, and each costs 20–40 turns to guess wrong · **⧗ owed** *(everything done except the real-server pass, which is blocked on Harkirat's OAuth sign-in)* · ⊘ dropped *(with the reason, never silently)*.

🔴 **⧗ IS NOW UNREACHABLE, AND THAT IS THE POINT OF PART 0 HAVING LANDED THE SIGN-IN (2026-08-28 10:5x EDT).** §0.2's rule fires: *"If Part 0 lands it, no later Part may use ⧗ at all."* A Part that wants to close owes a real-server pass and must go and run one — the session cookie lives in Mongo with a 12-hour TTL, so a lapsed one is another sign-in, never a reason to owe.

🔴 **⧗ exists because without it the ledger cannot be honest.** §0.2 requires a real-server pass in every Part, and that needs a sign-in only he can give — so with four states every row either stalls at ◐ forever or gets ticked ☑ dishonestly. **A row may reach ⧗ with the owed pass named in its Note (`real-server pass owed`), and becomes ☑ the moment that pass runs.** Nothing else may be owed.

---

## §0.1a ⟷ §0.6a — HOW THE TWO COMPOSE: §0.6 CLOSES, §0.1 CAPTURES (added 2026-08-30 15:2x EDT)

🔴 **§0.1 says a diff region is never evidence the mockup is right. §0.6 says close on a number, not on judgement. Both are true and they do not compete — they answer different questions.**

| | governs | during the pass |
|---|---|---|
| **§0.6** | **CLOSURE** — when is this realm done | a number, mechanical, unchanged. **Not reopenable** |
| **§0.1** | **CAPTURE** — what gets written down while closing | when a region is closed onto something weak, RECORD it. It does not change what you do to the portal |

**There is no direction question during conformance: the portal always moves.** That is what makes closure mechanical. Inventing a per-region verdict would smuggle judgement-over-a-list back into the method that retired it.

🔴 **THE MOCKUP IS NEVER EDITED — Harkirat, 2026-08-30 15:2x EDT.** *"The mockup correction/edits happen after the conformation. That's so we stop having 2 systems/files and instead make the correction or any redesigns directly into the portal once the underlying conformation work is done."* Correcting the design mid-pass creates exactly the two-authority problem the pivot exists to end: a mockup that no longer matches its own package, and a portal converging on a moving target. **After conformance the portal IS the design and the mockup stops mattering.**

**So converging onto a weak design is CORRECT and TEMPORARY, not a failure of the method.** On 2026-08-30 three of the design's weaknesses were reproduced into the portal — the day drawer's list rendering browser-default disc bullets at a 40px indent (`season.html` styles `.daylist` nowhere), the ruler's 3px focusable tick targets, and a doubled ring on a same-day patch cluster. **All three were the method working.** Recorded, kept until the pass ends, fixed in the portal afterwards. ⚠️ **A session reading only §0.1 will mistake this for a defect and try to "fix the mockup". Do not.**

**ONE post-conformance queue, two kinds of entry, already in the same place:**
- **stood-down portal advances** — ⚠️ **RETIRED 2026-08-31: this category no longer exists and both commands now return nothing.** The two rendering modes collapsed, so nothing is switched off any more. What replaced it: 35 decisions took the design's version and **13 kept the portal's**, permanently, each commented at its site with its kind. The reasoning is `local/conform-classification.md`; the durable half is in `docs/db-deferred-list.md`. **Those 13 are the diff's permanent floor** — which is why a realm closes on the enumeration and not on a percentage.
- **converged-onto weaknesses** — something the design did poorly that the portal now reproduces. Filed in `docs/db-deferred-list.md`.

Both resolve the same way: **change the portal, after all six realms match.** Neither ever edits the mockup.

⛔ **AND A SESSION READING §0.1 ALONE WILL TRY TO REVERT §0.6.** That nearly happened on 2026-08-30: the drafted move was *"restore the adjudication step"* — the judgement-over-a-list method §0.6 retired after three false closures. **Adjudication is not coming back. §0.1's job here is a notebook, not a tribunal.**

---

## §0.6c — 🔴 CHEAPEST INSTRUMENT FIRST: `--triggers` BEFORE `--open`, ON EVERY REMAINING REALM (added 2026-08-31 16:0x EDT)

**The overlay tier was being scoped as though every overlay had to be opened. It does not.** `--triggers` lists every openable control on BOTH sides and marks the one-sided ones, in ONE call, with nothing opened — and on Armory that single call produced thirteen real differences (keyboard hints, appended counts, a truncated label, a raw id, seven missing category chips, one fused accessible name). **None of them was an overlay finding.** They are ③ WORDS and inventory findings on the resting page, and they would otherwise have been paid for at overlay prices.

**Then check the imports before budgeting the tier.** A realm that imports `useOverlay` from `overlay.js` and `Shell`/`Masthead` from `shell.js` builds no overlay chrome of its own: its scrim, panel frame, header, button row and type scale are the shell's, already conformed. **Overlay conformance is then mostly a DERIVATIVE of shell conformance**, which is why Season's overlays measured 0.2–1.2% once its shell was right. `rg -n "^import" portal/ui/<realm>.js` settles it in one call, and it is the difference between an open-ended tier and roughly three calls.

⚠️ **The floor/ceiling distinction that keeps this honest:** `--triggers` filters out data rows, so an overlay reachable only from a table row never appears in it. **The listing is a FLOOR on what exists, never a ceiling** — Season needed `--open-sel` for precisely that case. And an overlay mounted inside `main` is a different component from one at the root (the trapped-scrim finding), so the first `--open` of a realm still has to be run: a reading near Season's 0.2% is what confirms the inheritance is real.

---

## §0.6a — 🔴 THE OVERLAY METHOD. THIS IS HOW A REALM IS BUILT AND CLOSED NOW (Harkirat, 2026-08-28 20:1x EDT)

**His proposal, and it is the right one:** stop adjudicating a 220-row difference list by judgement, and make the two pages produce the same pixels. Closure stops being my opinion and becomes a number. **Proved on Broadcast the same evening: 8.4% across 16 regions and a 274px height gap → 0.3% across 28 regions with the two pages at EXACTLY 1258px.**

🔴 **THE REFERENCE IS NOT AT UNIFORM FIDELITY ACROSS THE SEVEN PAGES, AND THE TARGET MUST FOLLOW IT.** Measured 2026-08-30 15:1x EDT: **run `npm run portal:status`** — it prints every mockup's measured size and handler count beside the realm's recorded state. 🔴 **The figures that used to sit here were stated as fact and disagreed with that tool's own output** (192KB vs 186, 99.6 vs 96 — two measurement methods, neither labelled), which is the same defect the handoff was corrected for while this document, the one everything points at, kept them. **A number a tool can print does not belong in prose here either** — ⚠️ **and until 2026-09-01 this sentence was followed by the orphaned tail of the very figure list it deleted** (`…either.**6KB / 13, access 47.7KB / 7, analytics 46.1KB / 1…`), so the paragraph forbidding stale figures ended in a stale figure list, one of whose entries (`access 47.7KB / 7`) was independently wrong. **Run the tool.** Season's mockup is a realised interactive prototype; Review's and Home's are static compositions a tenth its size. **Driving a near-static sketch to 0.1% reproduces its arbitrary choices with the fidelity owed to considered ones** — and the interaction tier (`--open`, `--triggers`) has nothing to find on a page with zero handlers. Armory earns the full treatment; Analytics, Review and Home are composition-and-correctness surfaces where COMPANION and his eye are the authority.

### The four pieces
| | |
|---|---|
| **Same data** | Nothing to build — `scripts/buildPortal.js` already copies the mockup's `assets/fixtures.js` into the harness. **Byte-identical, verified by `shasum`.** The two sides have never disagreed about data; every apparent data difference was the LIVE SERVER being compared against a fixture |
| **Same clock** | `portalDiff` freezes `Date` on both sides at one instant before any page script runs. 🔴 **`--at` MUST STAY AT THE MOCKUP'S OWN `F.today` — `2026-08-24`.** The freeze moves the PORTAL's now; it cannot move the mockup's, which reads `today:'2026-08-24'` out of `assets/fixtures.js`. A different `--at` desynchronises the two sides and the drift reads as a design difference. COMPANION §16.31a: `?today=` does NOT travel the countdown, so two captures seconds apart can never overlay. Without it the residual has a floor nobody can explain, and an unexplained floor is how a threshold gets quietly raised until it means nothing |
| **`?fresh=1`** 🔴 **DONE 2026-08-31 — THE TWO MODES ARE COLLAPSED. This row used to describe a stand-down switch and there is no longer one.** All 57 `conforming()` sites and 52 `data-conform` blocks are gone; `portal/ui/conform.js` is deleted. The portal renders ONE thing, and it is what the instruments measure and what ships. **Do not look for a way to stand a redesign down — there isn't one, and adding one back re-creates the 108 forks this removed.** | What survives is FIXTURES: `?fresh=1` turns off the harness's deliberate demo overrides so the two sides compare design rather than data. 🔴 **THE CLOSE CONDITION CHANGED WITH IT.** 35 decisions took the design's version; **13 kept the portal's** — the day drawer's keyboard path, `oneway.js`'s typed-confirm and its refusal to promise an interlock this console does not have, the banner thumbnail that is the broken-image detector, four `disabled` gates, and two icon rules. Those are **permanent** differences, so the diff has a floor: Season is +56px on Board and Repairs and +112px on Track, all of it one cascade. **Grade on the ENUMERATION — are the regions exactly the cited set — never on the percentage**, which would let thirteen cited differences hide any number of real ones behind them. Reasoning: `local/conform-classification.md`; durable half in `docs/db-deferred-list.md`. |
| **Zero regions, not a percentage** | `--selftest` returns **0.000%** on identical input, so there is no inherent noise to budget for. A percentage lets many small wrongs average into a pass, and the small ones are what this exists to catch |

### The loop, one call per iteration
```
node scripts/portalConverge.mjs --realm <r> [--view <tab>]     # RHYTHM, then WORDS, then STYLE
```
🔴 **FIX THE FIRST RHYTHM MISMATCH AND RE-RUN.** A small vertical offset near the top cascades: everything below it lands at a different y, and the pixel diff reports that as ONE page-sized region. Chasing regions before the rhythm is flat is chasing a shadow. Broadcast went 8.4% → 5.5% purely by matching the masthead, before a single visual fix.

Then `node scripts/portalDiff.mjs --realm <r> --portal harness` for the pixels, and `node scripts/portalInventory.mjs --realm <r>` for what exists on one side and not the other.

### What it cannot see, said here so it does not become the next over-trusted number
Pixel equality is **necessary and not sufficient**. It cannot see keyboard reachability — Board's column headers were `div`s rendering exactly like buttons, and an overlay would pass them forever. It cannot see copy that is wrong in a way that matches the mockup's own wrong copy. And it cannot see behaviour: the mockup fakes its operations and the portal commits them, so the entire correctness surface sits behind pixels that already match. **It replaces the ADJUDICATION burden — not the states walk, and not the real-server pass.**

### The eleven defects the first overlay found, as a list of what this catches
Three were instruments: the harness has **two nested `main` elements** and the height probe took the outer one (every harness capture clipped to 888px, by a different route than the morning's); the export summary **summed nested scopes** — "6 records" over four announcements beside a manifest reading "4 of 4"; and `.mh-take` spanning `1/-1` took the strip out of column 2's max-content, so the two masthead columns sat **80px apart while every stat measured identical**. The rest were the page: a `padding-left` longhand eaten by a later `padding` shorthand (the create button 200px against 202); a swatch rendered INSIDE the text span instead of beside it, which gave titles 17px more room and stopped two of four wrapping where the design wraps them; `Math.round` on hours where the design floors from midnight, putting **every age on the realm one day out**; and five pieces of copy.

---

## §0.5c — THE HANDOFF IS PART OF THE PART, AND IT GETS AUDITED THE SAME WAY (added 2026-08-30 15:5x EDT)

**A Part is not closed when the code is right. It is closed when the NEXT session can continue from what was written.** On 2026-08-30 a read-only Sonnet agent was given only the auto-loaded carriers and asked to continue: it scored **6/10**, could not derive a single next action, and found `npm test` RED while the handoff advertised it green.

🔴 **So the exit condition gains one line: hand the carriers to a read-only agent with no transcript, ask it to continue the work and to report every place it cannot, then fix all of it.** One subagent call, twelve minutes. It found four defects a full day of self-review had missed, and every one of them was the kind that reads as fine from the inside — a stale green, an item fixed but not closed, two numbers from different measurements, an ordering that contradicted this plan's own rule.

⚠️ **The reason self-review cannot substitute:** the author knows what the words meant. The auditor only has the words. **Every defect it found was a place where my intent was clear to me and unrecoverable from the text.**

🔴 **THE PASS IS EXACTLY TWO AGENTS, AND THE SPLIT IS REALITY vs THE DOCUMENT (Harkirat, 2026-09-01 19:26 EDT).** The Part 4 session ran three soft agents, was told the questions were too easy, and answered by adding four more — seven in flight at once. **That is the wrong axis twice over**: the fix for a weak question is a harder question, not another agent, and every extra agent re-reads the same carriers to re-derive the same context. His instruction is that **two agents must encompass everything those seven were asked**, and they do, because the seven collapse cleanly:

| Agent | It covers | Why these belong together |
|---|---|---|
| **A · THE WORK** | ① **Execute** the next Part's first phase for real — run the commands, start the servers, run every instrument on the realm — and report where the document failed IN PRACTICE: a command that did not work as written, a step whose literal execution produced something else, how many calls it actually took against the minimum with perfect batching, and the first judgement the document does not cover. ② **Attack the finished Part's DIFF**: find the rollback, argue the opposite case on each fix, break the new code's edge cases, construct the data that makes two counts disagree, take the other side of every judgement call, and find a ledger falsifier that can never trigger. ③ Verify the realm-specific claims — but by going and looking, never against a list the author supplies | Both halves are *go and check reality*. They share the whole cost of building context: the repo, the servers, the instruments, the realm's code. Splitting them makes two agents pay for one setup |
| **B · THE DOCUMENT** | ① **False transfer** — which lessons are specific to the Part just finished and will point the next session the WRONG way on a realm with different shape. ② **Omissions** — what the next Part actually requires that appears in no carrier, costed. ③ **Perverse incentives** — where following the document rewards work that looks productive and is not. ④ **Hour six, not hour zero** — what fails when the turn budget fires and the summary is being written, which is where this project's real failures happen. ⑤ **Confidently wrong** — which passages read as settled fact but are the previous session's inference. ⑥ **Contradictions RESOLVED** — every conflict between carriers, with the one you would obey and the cost of choosing wrong; *"they disagree"* scores zero. ⑦ **One paragraph rewritten in full**, with what it costs elsewhere | All of it is *attack the text and its blind spots*, and all of it needs the same reading of the same carriers held in one head at once. A contradiction is only visible to a reader who has all the documents; so is a false transfer |

🔴 **AND THE ⑥ AGENTS ARE NOT YOURS TO DISPATCH. HARKIRAT APPROVES THEM FIRST, EVERY TIME (2026-09-01 19:27 EDT).** They run at the **END** — after every other condition is met, the records are written and the branch is otherwise push-ready — because their whole value is auditing a FINISHED handoff, and an audit of work still in flight measures nothing that will still be true. ⚠️ **This reverses an earlier standing permission.** `plan-drafting.md` and the Part 4 prompt both said to dispatch ⑥ without asking; that licence produced seven agents in one session, dispatched on my own judgement, three of them killed unread. **Ask, wait for a yes, then run exactly two.**

⚠️ **Two constraints on the QUESTIONS, which is what actually failed on Part 4.** **Never hand the falsifier a list of claims you have already verified** — you are then choosing the evidence, and it can only confirm you. And **never ask only "where can you not proceed"**: a document can be perfectly clear and still produce bad work, so at least one agent must be asked what it would DO and where it would be confidently wrong. Both agents must produce a named artifact, and *"it all worked"* is a legitimate result only after the work was actually attempted.

---

## §0.5a — HOW A PART IS ACTUALLY CHECKED (written 2026-08-28 after Part 1 was declared finished THREE times and was not)

🔴 **Read this before §0.1. Every rule below is a generalisation of a real failure from 2026-08-28, and each one names it, because a rule whose cost is invisible gets optimised away by the next session.**

### R1 · An instrument states its COVERAGE, in the subject's own units, or its reading is not a reading
`portalDiff.mjs` clipped every capture to `{x:0, y:0, width:1282, height:888}`. Season is **4,378px**. So *"17.1% of pixels differ, in 17 regions"* described the top fifth of the page, was quoted in a ledger, a changelog, a §L row and a published artifact, and was wrong in all four. **The falsifier was free and sitting in every run: not one region in any report ever had `y + h` greater than 888.** If a spatial tool never finds anything outside its frame, the frame is the finding. Every instrument now prints what it examined — `captured mk- 4038px · pt- 4378px` — and says so when it did not cover the whole subject.

### R2 · A citation has TWO tests: does it EXIST, and does it still GOVERN
Board was closed as portal-correct on spec §F3, which exists and says exactly what was quoted. It is dated **2026-08-20**; the mockup package that supersedes it is **2026-08-23**; Harkirat wrote *"the design is the mockup"* on **2026-08-27**. Checking existence feels like verification and is worth almost nothing. **Date every source in the adjudication line. When two conflict, the later artifact wins unless something later still says otherwise.**

### R3 · Never cite your own writing back as corroboration
The §F3 adjudication was written into `COMPANION.md` by the session that reached it, and then read back as though COMPANION were a second witness. §16.31a records this in its own words — *"Two documents downstream of one commit are not two witnesses"* — and one AUTHOR is not two either. **If you wrote it this session, it is your claim. Mark it as yours.**

### R4 · The close condition is an ENUMERATION, not a checklist
A Part closes when `npm run portal:inventory -- --realm <r>` reports its **six** lists — **ONLY IN THE MOCKUP · ONLY IN THE PORTAL · DIFFERENT WORDS · DIFFERENT COUNT · DIFFERENT PAGE · DIFFERENT STYLE** ⚠️ **this said FOUR until 2026-09-01 and the tool has printed six for longer**, so a reader closing on the letter of this rule skipped two lists — Armory's DIFFERENT COUNT alone held seven rows — and every row in each is either closed or adjudicated with a **dated** citation. Gates green, a ledger written and a fixture recorded are ACTIVITIES; they were all true when Part 1 was closed the first time.

### R5 · Never write "done", "complete" or "fixed, all N"
Harkirat decides when a Part is finished. *"Part 1 doesn't end until I'm satisfied."* Report what changed and what was measured; do not report completion. Two of this Part's three false closes were a sentence, not a mistake in the work.

### R6 · A dual-runtime file needs a BROWSER assertion, never a Node one
`board.logic.js` guards its exports with `if (typeof module !== 'undefined')`. Code inserted below that line is defined in Node and absent in the browser: `npm test` imported the new functions and passed while the page threw `groupBoardItems is not a function` and the Board rendered as an empty panel. **A green suite over the Node half of a dual-runtime file proves nothing about the page.**

### R7 · A guard must not swallow the failure it was written for
The first full-page capture printed `captured mk- 888px · pt- 888px` — the old behaviour wearing the new label — because a `page.evaluate` closure referenced a Node-side constant, threw `ReferenceError` in the browser, and a `.catch(() => VH)` written moments earlier fell back to the old value. **No fallback on a measurement.** If it cannot be measured, it must fail loudly.

### R8 · When Harkirat names an example, fix the CLASS
*"Don't narrow your fixes to my mentioned items. There were merely examples. Awwwards worthy websites are not narrow scoped in their audits."* Two named items produced a two-item fix list; the enumeration that should have preceded it found **29 absent · 60 extra · 25 different words · 38 counts · 68 styles**. Enumerate the class before touching the instance.

### R9 · A refusal guards a flag's EFFECT, not its ARRIVAL
`--view` refuses a missing tab and a click that changed nothing — and cannot refuse a flag that never reached the process. In zsh an unquoted `$v` does not word-split, so a loop passing `"--view Board"` sent one argument and three default-view runs printed plausible percentages. **Read the tool's own statement of what it did — the header line and the output filenames — never the result alone.**

### R10 · A claim that NO INSTRUMENT can see something is a claim about the INSTRUMENTS, and it needs their output
Written 2026-09-01, retracting a commit message from the same day. The manifest rows painted the wrong ground and the commit said *"no instrument could have found this."* **④ STYLE had printed it** — `section.panel backgroundColor: rgba(0,0,0,0) → rgb(23,30,36)`, the exact value, in output already read twice. It sorted ~140th of 149 because the section ranked by repetition. **Before writing that nothing could catch a defect, grep the last run's output for the value.** One command. The rule is the sibling of R2 and R3: all three are about the PROVENANCE of a claim, and none of them is enforced by anything except being short and absolute.

### R11 · Before ADDING an instrument, name the existing one that should have caught it — and say why it did not
Same day, same defect. The first response was a fifth browser-backed instrument sweeping every relational selector. It was written, its collector returned zero on its first run, its own test contradicted a comment two lines below it, and its BROKEN bucket would have fired on every conditionally-structural rule — then it was deleted, because ④ had answered the question all along. **Writing the sentence "X should have caught this" is what forces the discovery.** If the answer is *it did, and I misread it*, the fix is the reading. This repo has eight instruments and twenty-odd gates; the reflex to add a ninth is the one to distrust.


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
| `[data-bare]` — the search-bar opt-out | ✅ present in `app.css` (grep `data-bare`) | ❌ **no `portal/ui/*.js` emits it** | **measured: a 44px `.cb-in` inside a 34px `.cmdbar`, each painting its own background and border.** COMPANION §5.9n.4's doubled search bar, verbatim |
| `hcard` `hgrid` `hmast` `hseason` | ✅ rules exist | ❌ nothing in `home.js` emits them | Home's card system, styled and unused |
| `srec-open` | ✅ rules exist | ❌ no emitter | the season record's open state |

🔴 **AND A THIRD SHAPE THE FIRST DRAFT GOT BACKWARDS — A NAME MISMATCH, WHICH IS WORSE THAN A MISSING EMITTER because both halves exist and neither looks wrong on its own.** `armory.js:72` declares `RANK_KEY = { best:'best', top3:'t3', top4:'t4', top5:'t5', null:'none' }` and line 165 emits `` `trow t-${RANK_KEY[key]}` ``. The stylesheet defines `.trow.t-best` · `.t-top3` · `.t-top4` · `.t-top5` · `.t-unranked`. **Only `t-best` matches. Four of Armory's five tier rows emit a class the tier board never styles** — `t-t3`, `t-t4`, `t-t5`, `t-none` against `.t-top3`, `.t-top4`, `.t-top5`, `.t-unranked`. (`.t-none{opacity:.86}` does exist, 1,800 lines from the `.trow.t-*` family, so that row gets *some* styling but not the tier treatment.)

⚠️ **The first draft claimed these four had NO emitter and said it had confirmed that by hand.** It had not: the check was a shell command whose backtick pattern was interpreted by the shell, so it matched nothing and the empty result was read as absence. **That is the plan's own §0.10 trap — prove a probe can report PRESENCE before trusting an absence — committed while writing the section that states it.**

**Already fixed, same mechanism, kept because they are the clearest evidence for it** (all in `7cbcd07`, 2026-08-27): `--xtop` was read by `.xhair::before` and `.xd` and **set by no code**, so the crosshair used its hard-coded `60px` fallback forever — it is now measured at `track.js:548`. `.dflag.flip` had a rule scoped `.dend .dflag.flip` — the overlay LINE, not the rail — **and** no writer; it is now `.deadrail .dflag.flip` in `app.css` and written in `track.js`.

**Why no gate sees this class.** CSS is declarative and inert; a rule with no matching element is silent forever. `portal:orphans` asks *"does this class have a rule?"* · `portal:coverage` counts emitted classes · `npm test` renders components and asserts their output. **Not one asks the inverse — does this rule have an element?** That inverse is Part 0's first deliverable.

⚠️ **This is "ADD looking", not "stop measuring".** compact-I §0 proved five times in one session that every gate passes while the portal looks wrong. **A green suite means "none of my prior worries occurred". It never means "this is good."**

---

## §0.1b — PRECEDENCE: which artifact is "the design"

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
| **Reading** | 🔴 **ROUTE BY THE QUESTION, and this row said "Grep" until 2026-09-01, which §0.7c had already measured as the wrong answer.** A QUESTION about prose (is this settled? what did we decide?) → **`ctx_search`** — measured on the decision ledger: `rg` found **1 of 6** real finding selectors, `ctx_search` **5 of 5**, because a ledger row is prose and a finding is a literal. A SYMBOL or its callers → **`codebase-memory`** (`search_graph`, `get_code_snippet`). A string you ALREADY KNOW exists → `rg`. The comment beside the code → targeted `Read` with `offset`/`limit`. **Never re-read a file already in context**; `git diff -- <path>` for tracked docs |
| **Cadence** | Gates at the END of a unit, never between edits. The only legitimate mid-unit command is `node -e "require('./scripts/buildPortal').build()"` when you need to look |
| **Thinking** | `sequentialthinking` freely and **pre-emptively, to set method** — not afterwards to narrate. Mandatory when auditing or reviewing |
| **Output** | Work silently. One structured summary at the end. Tables, never prose, for ~4+ items. Questions are `AskUserQuestion` pop-ups, batched — 🔴 **at the START of a Part, or at the FIRST MOMENT the question becomes answerable, whichever is later.** Corrected 2026-09-01: a cold reader showed the two rules colliding. A realm's one genuine fork is usually *"does this surface differ in KIND?"*, which cannot be known before the first audit — so "at the START" scheduled the pop-up at a moment its own precondition was unknowable, and the alternative reading (ask blind) is the pop-up-with-no-answerable-content that §0.8's retired rows already cost. **Measure first, then ask once, batched** |
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

## §0.5b — THE FIVE PHASES, IN THIS ORDER, IN PARTS 1–6

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

**Machine floor (necessary, never sufficient):** `__grid.all()` near-miss and size counts no worse than the mockup's · inventory diff with zero unexplained rows · reverse-orphan clean for this surface · `npm test` **0**, `portal:orphans`/`coverage`/`refs` **0**, `docs:audit` **0 ERRORS** — warnings never block, and the count moves; read the exit code, never a remembered number (it read "1 (the expected `(#PR)`)" until 2026-09-01, by which time the real run had 0 errors and 7 unrelated warnings) · **`portal:diff` re-run with every region closed or cited**. ⚠️ **Three of these are movement detectors whose remedy is `--write` — see §0.45.** Re-recording a baseline is not a gate passing.

⚠️ **`__grid.all()` TRUNCATES** to 22 near-misses and 18 size issues. Read `nearMisses`/`sizeIssues` as **the count**; the arrays are a sample. ⚠️ **`__grid` reports geometry, not identity** — two elements can be perfectly on-grid and be the wrong two. That is why the inventory diff sits beside it, not under it.

### Regression: the geometry fixture

Six of seven realms share `shell.js`, `app.css`, `async.js`, `manifest.js`, `exportPanel.js`, `tips.js`, `overlay.js`, `composer.js`. **A fix in Part 5 lands in the stylesheet Part 1 signed off on** — which is how a `.lvlbars` block written 2,400 lines above an existing one restyled charts three realms away while every gate passed.

- When a Part closes, commit its `__grid.all()` counts and structural inventory as a JSON fixture.
- **A change to a shared surface re-runs the closed realms' fixtures IN THE SAME COMMIT.** Not later, not in Part 7.
- ⚠️ **Honest limit: a fixture of counts catches MOVEMENT, not WRONGNESS.** Two compensating changes keep the count identical. It is a smoke alarm, not a proof.

---

## §0.6b — SCOPE: what this pass may change, and what it may not

| | |
|---|---|
| **In scope, always** | Anything that RENDERS on the surface this Part owns — regardless of which file it lives in |
| **In scope, conditionally** | A server/route change **when the design requires data the UI cannot otherwise have** (the three export routes were exactly this). An improvement merely noticed is **filed in `docs/db-deferred-list.md` with a `[P · Effort · Model]` tag** — 🔴 named explicitly, because "filed" with no destination is how five items came to exist only in gitignored files |
| **Out of scope** | `core/ops` and the operation algebra — the bot's shared spine, which `/manage` also drives. File anything found |
| **Out of scope** | Refactors. `season.js` is 83K and it will be tempting. A conformance pass that also restructures the largest realm is two projects wearing one plan |

⚠️ **The reverse hazard, which this project keeps hitting:** "out of scope" must never become the excuse that leaves a defect standing. **A gap you can close now gets closed now; a deferral is a gap with paperwork.** The test is whether it renders on this surface.

---

## §0.7b — SOURCES: assemble the pending list by READING, never by remembering

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
| 🔴 **What CLOSES Season** | **Coverage is FROZEN at the instruments that exist on 2026-08-30, and nothing added later reopens the realm.** Harkirat, 2026-08-30 18:3x EDT, answering a popup that named the alternative of deferring overlays to a cross-realm phase. The closing set is fixed and finite: the **seven named overlays** (Returning draw · Draw window · Playlist · Patch note composers · the expanded identity editor · the one-way typed confirm · the row preview), **`--triggers` enumerated on Board and Repairs** as well as the default view, Events/Playlists auto-collapsing 20 of 39 Track items, the overview scrubber's mark weight, the real-server pass, and his eye. 🔴 **THIS IS THE ROOT CAUSE OF THE FOUR REOPENINGS, NAMED AND CLOSED.** Every prior session answered this question implicitly by chasing whatever the newest instrument could see, so *done* was coupled to coverage and coverage kept growing — four of Season's seven open items exist ONLY because `--open` was invented on 2026-08-30. **A capability added after this date is a finding for the sweep (§L row 7), never a reason to reopen Season.** |
| **Pushing** | Never. Do not ask |

**Still genuinely HITL — ask, never decide:** item **H** (playlist concurrency density — he answered *"Idk"*) · the **four composition changes he has never seen** (Broadcast's severity dot inside the name cell; Season's `Review & commit` restyled to `.commit`; the composer's Discord-shaped preview card; Armory's two MP/DMZ create chips) · ~~Broadcast's **`Now showing` vs the mockup's `Delivery queue`**~~ 🔵 **RETIRED 2026-09-01 — THERE IS NO DIVERGENCE AND THIS ROW HAD IT BACKWARDS.** Measured before asking: `broadcast.html` renders `Delivery queue` at its tab (`:33`), its `S.mountHeader` call (`:90`) and its crumb map (`:587`), and the string `Now showing` appears in it **zero times**; `broadcast.js` renders `Delivery queue` too and keeps `Now showing` only as a function name and two comments. ③ WORDS reports **0** on both views. ⚠️ `BROADCAST-PROMPT.md` inverted this row's two sides and told the next session to ask anyway — a HITL question that costs a pop-up and has no answerable content is worse than no row, because it spends the one thing the pop-up budget is for.

⚠️ **And Broadcast's severity dot, in the four-composition-changes list above, is the same shape.** Both sides draw `span.sev` inside the name cell from the announcement's own stored accent (`broadcast.html:472`, `broadcast.js`'s `ownDot`). Harkirat was shown a 2× crop of both on 2026-09-01 and his answer was that it is *"clearly wrong on the portal"* only for the SAVED chip beside it — the dot itself was never in question. It is a composition he has now seen; it is not an open question.

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
| 🔴 **`portal:bust` BUSTS THE MOCKUP, NOT `portal/ui` — and running it EDITS THE REFERENCE** | Corrected 2026-08-30 18:19 EDT, having followed the old wording and dirtied all eight mockup pages. The script is `docs/superpowers/mockups/2026-08-23-portal-interactive/.bust.mjs`: it rewrites that package's own `?v=` timestamps and touches nothing in `portal/`. **`scripts/buildPortal.js` already busts the harness on every build** (`const bust = Date.now()`, stamped into the import map so the whole module graph moves at once), so a `portal/ui` change needs a BUILD and never this. Since §0.1a's rule is that the mockup is never edited, the correct number of times to run `portal:bust` during this pass is **zero** |
| ⚠️ **`?today=` does NOT travel the season clock** | `countdownParts` reads `Date.now()`. Set `data-tier` on `.sclock` and read computed styles back |
| ⚠️ **`portal/public/` is BUILD OUTPUT** | Sources are `portal/ui/` |
| ⚠️ **A new export route needs THREE registrations** | The API route · the UI scope list as **literals** (a factory is invisible to the scope gate) · `scripts/lib/portalRouteQuery.js` |
| 🔴 **A FIXED SLEEP IN A GATE IS LOAD-DEPENDENT, so the gate itself goes non-deterministic** | Measured 2026-08-30 18:19 EDT: `portalStates.mjs --ci` failed inside a full `npm test` on Season's *identity · closed again from the header's dead space*, then passed five times when run alone. **A red run with no defect behind it is worse than a slow gate** — it sends the next session hunting a ghost, and it cost one here. The earlier remedy was to raise that state's `waitMs` to 700, the highest in the registry, which is the instance fix and does not survive a loaded machine. A step now says `until: <selector>` and the driver POLLS for it; `waitMs` stays only for the effects that are not an element appearing |
| 🔴 **A `conforming() ? null` RENDERS NOTHING, WHICH IS NOT A STAND-DOWN** *(historical — the flag was removed 2026-08-31; kept because the SHAPE of the mistake outlives it: a branch that renders nothing removes a surface from the comparison rather than changing it)* | §0.6a's rule is that a portal-ahead surface renders the MOCKUP'S version. Rendering nothing REMOVES the surface from the comparison, and no styling can close a difference the portal is not drawing. Cost the identity editor 111px. **Mechanically detectable**: for each such site, ask whether ② SHAPE reports a mockup-only node at that position |
| 🔴 **`sessionStorage` MAKES ONE MEASUREMENT CHANGE THE NEXT** | The mockup persists five UI keys and the instruments reused one page across three passes. Both clear storage now. **If a reading disagrees with a separate probe of the same element, suspect state before suspecting the page** |
| 🔴 **IDENTICAL READINGS ACROSS VARIANTS THAT MUST DIFFER = NEVER ARRIVED** | An unauthenticated walk reported the same text length and zero rows on all three views. That reads as a stable measurement and is the signature of measuring the door. `portalRealWalk` now refuses; the rule generalises to any probe |
| 🔴 **AN AMBIGUOUS `--open` LABEL HAD THE TWO SIDES OPENING DIFFERENT PANELS** | and reporting the difference as conformance — 26.7% comparing an export drawer against a staging drawer. Both instruments refuse a multi-match now. ⚠️ A cross-side PANEL comparison was tried twice and removed both times; do not re-propose it without reading why |
| ✅ **`portalGeometry` DID NOT freeze its clock — fixed 2026-08-31** | It does now, at the same instant `portalDiff` pins, and it clears storage too. **The rule survives its fix: a geometry failure naming a COUNT is time, not you** — and the tell is two consecutive checks agreeing with each other while both disagree with the fixture. ⚠️ **Re-recording would have hidden it** |
| ⚠️ **An instrument's PAIRING is not evidence about the page** | ② SHAPE reported an `All` chip and two `Sep 15` nodes as one-sided; loading both pages showed them byte-identical. LCS alignment paired them against neighbours. **Check the page before closing a SHAPE finding** |
| 🔴 **A conform CSS rule must NOT change an element's SIGNATURE** | its class list is what the audit's walk pairs on, so changing it desynchronises every node beneath. Use a data-attribute — `main[data-modal]` — not an added class |
| 🔴 **⑤ RULES is ADVISORY; the RENDERED value is ground truth** | a stand-down written from reading the stylesheet inverted itself for a week. Read the computed value before acting on a declaration |
| 🔴 **0.1% MEANS *MATCHES*, NOT *GOOD*** | two sessions drove a percentage toward zero against a reference with real defects and reproduced them faithfully — browser-default bullets, 3px focusable ticks, a doubled ring. §0.1b is the long form; this is the sentence to remember while looking at a number |
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

🔴 **ACCESS EARNS THE FULL INTERACTION TIER. Decided 2026-09-01 from Harkirat's own precedent, not asked.** §0.6a classifies Season and Armory as earning it and Analytics, Review and Home as composition surfaces with nothing to open — and leaves Access, the realm between them, unclassified. Both cold readers named that gap as a top-two uncertainty worth hours either way. **The precedent settles it without a pop-up: on 2026-09-01 he was offered the cheap derivative shortcut for BROADCAST — 39KB, 5 handlers, no overlay chrome of its own — and chose "full tier, every openable surface". Access is 46KB and 8 handlers with a permission MATRIX, which is more interactive than the realm he already ruled on, so a narrower treatment here would contradict his own answer on lighter evidence.** ⚠️ **Scope it with §0.6c first** — `--triggers` on all three views before opening anything, then `rg -n "^import" portal/ui/access.js` to see how much chrome the realm builds itself; on Armory that one `--triggers` call produced thirteen findings and not one of them was an overlay finding. **Reopens if:** he says a realm this size does not earn it.

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
| **1** | The pending list was assembled **from memory** and missed compact-I §3 entirely | The wrong things rebuilt; items B, C, D skipped | §0.7b names six sources; §A re-verifies A–S against source |
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
| **18** | 🔴 **blocker** | **§0 — the section titled "THE ONE THING THAT EXPLAINS THE REST" — was 60% FALSE**, and Part 1 contradicted it correctly 300 lines below. `--xtop` is set at `track.js:548`; `.dflag.flip` is written in `track.js` and rescoped to `.deadrail .dflag.flip` in `app.css`. **Both were fixed hours earlier, in `7cbcd07`, by the session that then wrote the table** | A session trusts the thesis and "fixes" three things already fixed | §0 split into LIVE rows and an already-fixed note. **This is the same class of error the plan opens by criticising in its predecessor, in the same position, three rows down** |
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
