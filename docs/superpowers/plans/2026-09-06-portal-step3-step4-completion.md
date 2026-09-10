---
kind: plan
status: live
---

# Portal step 3 and step 4 — completion plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:executing-plans` (inline, batched) rather than `subagent-driven-development`. Subagents are a turn-multiplier here and Harkirat's standing rule is explicit-request-only; a dispatched agent also cannot be corrected mid-flight because `SendMessage` is disabled by this build. Steps use `- [ ]` for tracking.

> 🔴 **START AT §0.1 — it is the only place that says what is open, in order.** Everything else here is a record of what closed, or a trap you need before you start.

> 🔴 **A SHORT OPENER IS NOT A SUMMARY OF THIS FILE.** §0.2 names three retired plans and why each died, and §2.4 carries the ownership column that says which of the nine remaining items are Harkirat's — **neither survives a three-bullet paste, and a session without §0.2 will re-propose the per-realm loop within its first ten turns.** Added 2026-09-06 20:48 EDT.

**Goal:** Close the ~14 remaining bucket-A portal items and then step 4, without re-deriving anything already settled and without re-inventing a per-realm loop. ⚠️ **"Per-realm loop" means the SHAPE — 35 invocations across seven realms — and NOT the impeccable skills, which are still the method for step 3 and are Task 9.**

**Architecture:** The unit of work is the FILED ITEM, never the realm and never the component. Read the item, check the ledger, look at the code, fix, verify in the browser, record a ledger row, commit. Several items span realms by construction.

**Tech Stack:** Preact + htm, buildless. `portal/ui/*.js` compiled by `scripts/buildPortal` into `portal/public/`. Harness at `http://127.0.0.1:8901/harness.html?demo=1#/<realm>` on fixtures, no Mongo, no OAuth. Dev portal at `:8787`.

**Spec:** `docs/db-deferred-list.md` (the item list) + `docs/reference/portal-decision-ledger.md` (what is already settled) + `DESIGN.md` + `PRODUCT.md` + `.impeccable/surfaces/*.md`.

---

## Global Constraints

- **Branch commits are free. Push, PR and merge each need approval restated at the moment of the action.** PR #186 is OPEN and Harkirat said **do not merge**.
- **Never run the portal with prod's `.env`.** Always `node --env-file=.env.dev portal/server.js`. Never `npm run portal`.
- Never print `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` or `BOT_TOKEN`.
- **Never touch the worktrees** `draw-calculator-breakdown-146641` or `outstanding-v3-items-135f3b` — both are live peer sessions.
- **Silent output style.** Zero prose between the first tool call and the final message. Questions go in pop-ups. No mid-run status summaries: Harkirat called these out four times in one session.
- **Mega-batch.** Independent calls go in ONE message. Multi-site edits go in ONE `python3` heredoc with `assert <anchor> in s` before each replacement, a `print()` per edit, the write INSIDE the loop, and the gate chained with `&&`. Sequential single-call turns were the single loudest complaint of the 2026-09-06 session.
- **Compute every timestamp**: `STAMP = datetime.now(ZoneInfo('America/New_York')).strftime('%Y-%m-%d %H:%M %Z')`. Never type one.
- `.claude/settings.json` is **deliberately modified and uncommitted** — the `Stop` hook is renamed `Stop__OFF`. Do not commit it. Restore with `mv .claude/settings.json.impeccable-bak .claude/settings.json` when Harkirat wants the sweeps back.

---

## 0 · Read this before touching anything

### 0.1 The four-step plan, and where we are

| Step | State |
|---|---|
| 1 · Prove the portal actually works | ✅ **CLOSED 2026-09-06 15:48 EDT.** Harkirat staged, committed, landed and reversed a real draw. `newDraws` 4 → 5 → 4, ChangeLog `#26` add / `#27` delete, `baseline: [{count:4}]` — the first changeset ever to receive one |
| 2 · Clean the list | ✅ **CLOSED 2026-09-06 15:48 EDT.** 107 → 69 headings; 38 archived |
| 3 · Fix the portal's look and feel | ⚠️ **ITEMS DONE, METHOD NEVER RUN.** All nine open bucket-A items closed 2026-09-09 15:12 EDT (the record is §2.4). **But the five impeccable runs step 3 was DEFINED by have never happened** — one report exists, for Home, generated before step 3 started. → **Task 9** |
| 4 · Everything else | ⚠️ **FOUR of Task 8's five bullets closed 2026-09-09 19:22 EDT.** The membership of the rest is derived but never written down. → **Task 8** |

🔴 **OPEN, IN ORDER — this list is the whole answer to "what now", and nothing else in this file is.** Every other section is either a record of what closed or a trap you need before you start.

| | What | Where |
|---|---|---|
| **1** | ✅ **Step 3's impeccable pass RAN — all five verbs, 2026-09-09 20:57 EDT.** 32/40 · 4 of 8 findings closed · 4 filed with verify conditions | **Task 9** |
| **2** | **Re-derive step 4's B/C/D membership** against today's list. `[P1 · S]` | **Task 8** |
| **3** | Four `.claude/rules/` files still over 30,000 B — prose judgements, not lifts | `docs/db-deferred-list.md` |
| **4** | The `/commands` page, as ONE collective item for a fresh session | `docs/db-deferred-list.md` |
| — | Everything v3.0.0 needs beyond this plan | `docs/ROADMAP.md` § 🚀 v3.0.0 |

⚠️ **Two things are HARKIRAT'S and are not blocked on work:** a subagent dispatch for the read-only audits (declined 2026-09-09 19:22 EDT — *"skip the reader agents"*), and the catalogue push into prod Mongo.

### 0.2 🔴 THREE RETIRED PLANS — DO NOT RE-PROPOSE ANY OF THEM

| Version | What it was | Why it died |
|---|---|---|
| **V1 · the critique loop** (2026-09-06 16:43–18:23 EDT) | `impeccable critique` with two isolated subagents per realm, then five steps per realm — critique, fix, audit, polish, next realm — across seven realms. Costed at **15–25 turns per realm, 100–175 total**, calibrated on Home | Harkirat: *"this is just a waste of turns, sequencing it to 5 steps for each realm, in a loop."* **Instrument-shaped** — `critique` takes a target, so the tool picked the unit instead of the problem picking it. And Home is the only realm with NO drawers, so the calibration run could not test what he said mattered most |
| **V2 · three sweeps by component** (18:44 EDT) | Shared CSS primitives → `Drawer`/`Confirm`/`Toast`/`OneWay` → realm-local composition. ~75 turns against V1's ~175 | Died inside its own message. A **94-item backlog already existed** and every sweep was already a filed item — sweep 2 as *"Overlays on the five realms other than Season have never been opened"* `P1·L`, sweep 3 as *"The four untouched realms"* `P1·L`, sweep 1 as *"78 literal colours"* `P3`. **Discovery was never the bottleneck; execution was** |
| **V3 · audit the list first** (18:48–19:00 EDT) | Two agents read all 101 items body-first | Not wrong — it **RAN and is FINISHED**: 50 LIVE / 33 DONE / 11 SUPERSEDED / 7 BUNDLED, archived under *The supersession sweep*. **Do not re-run it** |

🔴 **THE LESSON BELOW WAS WRITTEN WRONG AND IT COST STEP 3 ITS ENTIRE METHOD — corrected 2026-09-09 19:22 EDT by Harkirat.** It reads as *the tool was retired*, and three sessions read it that way, including the one that closed step 3. **What he killed was the LOOP'S SHAPE — 5 skills × 7 realms = 35 invocations, each spinning up fresh subagents — not the toolset.** `clarify`, `layout`, `harden` and `polish` are FIX verbs applied to items already in hand and were never in question; the sentence never mentions them and retired them by implication anyway.

**The approved shape is in Task 9 and is not restated here** — two homes for one fact is how this correction got scattered in the first place.

*The original, struck:* ~~The load-bearing lesson: `critique` is DISCOVERY, and discovery is not what this project is short of. The Home critique's report still stands as input; what was retired is running it six more times.~~ — true of `critique` ALONE and of the per-realm repetition; never true of the other four skills.

### 0.3 Who owns a design fork

**Not** "did the design choose this" — that sends everything to Harkirat and produced a full stall on 2026-09-06. The test is: **does the design's own stated law, or an external criterion, already answer it.**

- **Yours:** WCAG failures, a control that cannot be reached, a truncation with no tooltip, a tap target under `--tap`, one class carrying two semantics, a hardcoded number beside a live one, a count that disagrees with another surface's count.
- **His:** which hue, which word, how dense — anything where you cannot cite a rule.
- **Precedent, already in the ledger:** when the design's PROSE and the design's CSS disagreed about the category accents, the portal followed the prose and the package was corrected.

⚠️ **Check the mockup before filing a portal defect.** Two of the three Home P1s turned out to be the portal matching the design byte-for-byte and were filed as portal failures anyway.

### 0.4 🔴 Before any pop-up: query the ledger

```
ctx_search({ source: "project:dioreo-docs", queries: ["has <surface> been decided", "is <X> a decision"] })
```

`ctx_search`, **never `rg`** — measured against the six selectors an audit finding prints, `rg` found **1 of 6** and `ctx_search` **5 of 5**, because a ledger is prose and a finding is a literal.

**A filed item is a CLAIM WITH A VERIFY CONDITION, not a fact.** The deferred list records INTENT; the ledger records DECISIONS; nothing writes a decision back into the list. Four settled items were put to Harkirat as live work in one day.

⚠️ **ADDENDUM 2026-09-07 11:57 EDT, my own inference from a mistake, not Harkirat's instruction — flagged as such per the handoff guide's rule 3.** A decision can also live in a PLAN'S OWN SECTIONS, not only the ledger — §0.7c's own "fifth bucket" rule was re-asked as a live pop-up fork this session because only the ledger got searched, not this document. `ctx_search` both `docs/reference/portal-decision-ledger.md` AND the governing plan file's own decision sections before framing anything as an open fork.

---

## 1 · Tooling — what to use and what it costs

### 1.1 context-mode, correctly

| Rule | Detail |
|---|---|
| **`ctx_execute` CAPTURES, `ctx_search` FILTERS** | Large stdout is auto-indexed rather than returned inline. A `sed -n 'X,Yp'` or a `head` inside the capture **permanently discards the rest from the index for zero context saving**. Run in full; narrow in a later `ctx_search` scoped with `source:` |
| **Under ~20 lines, plain Bash is correct** | `execute` adds a summarisation pass and buys nothing |
| **`summary_prompt`** | A real parameter on `ctx_execute` that steers the summarisation. Be specific: *"report the count of failing tests, list each with its file path"* |
| **`ctx_stats` is a savings report** | Not a source lister. Nothing enumerates labels; find one by running `ctx_search` and reading what comes back |
| **`ctx_purge` is the only delete** | `{confirm:true, sessionId}` for one session, `{confirm:true, scope:"project"}` for the whole store |
| **Always pass `source:`** | `project:dioreo-docs` · `project:dioreo-rules` · `vendor:<name>`. Without it the label defaults to the absolute path |

The plugin ships four `references/` files and one `SKILL.md` per tool that are **never injected**; they live under `~/.claude/plugins/cache/context-mode/context-mode/<version>/`.

### 1.1b linksee — fixed and wired 2026-09-06 18:39 EDT, and it was degraded before

**Two install defects, both fixed:** the installed skill was a month stale (`install-skill` **skips rather than upgrades** — `--force` is required, and only then did `linksee-memory` appear in the session's skill list), and `~/.claude.json` ran the server through `npx -y`, re-resolving the package every session start; it is now the binary.

| Use it for | How |
|---|---|
| **Any read of a file you will not `Edit`** | `mcp__linksee__read_smart` — **first read included.** The first read builds the AST chunk map that makes every later one ~50 tokens, so routing it costs nothing. The old "only for re-reads" framing is why it went unused for a whole session |
| Before touching a surface | `where_am_i` — **the product map now exists.** `map.yaml`, 10 nodes, 10 edges, linked to anchor #7. It answers *touching `admin-portal` implicates 5 nodes*, graded hard/soft/watch |
| Recalling with precision | Three axes filter every `recall`: `altitude` · `mem_type` · `mem_state`. Open questions are `mem_state:open, mem_type:question` |
| Writing a pain lesson | `layer: caveat`, **one sentence, verb-first**, and it is protected forever. A paragraph is the wrong shape |
| Starting significant work | Read the `memory://caveats` resource — the docs' own advice, and it had never been read here |

⚠️ **`/linksee:*` does not route** (`Unknown command`) and the docs never promise it will. Fetch a prompt body with `prompts/get` over stdio and follow it; a prompt is instructions, not a computed result. Recipe in `~/.claude/TOOLING.md`.

⚠️ **`map where <file>` resolves a file only through `reality.path`.** Every node now declares one. But **no node declares a VERIFIER yet**, so `map status` reads *Health 100% · Verified by reality: 0* — and the second number is the honest one. Filed.

### 1.1c The memory store was cleaned 2026-09-06 20:41 EDT — do not re-run this

**76 memories re-homed** out of path-derived junk entities, **7 entities deleted**, **15 raw utterances distilled**. Entities **63 → 55**; `integrity_check` ok; two dated backups kept beside the DB.

🔴 **The re-home only sticks because `source` was set to NULL in the same statement.** An auto-captured row is wiped and reinserted by the Stop-hook sync, which re-derives the entity from the PATH and recreates the junk — the reason every earlier attempt evaporated.

**21 rows are knowingly left** in `Application` / `Application Support` / `Containers`: all `consolidate` summaries with no project word, so nothing in their content can attribute them. **Leave them.**

⚠️ **Do NOT hand-drain the distill queue.** ~580 undistilled auto-captured rows remain and `dream()` returns 8 per call — about 73 calls to rewrite session echo. The 15 that were done were the ones carrying a real lesson.

### 1.2 The instruments

| Command | Use |
|---|---|
| `node -e "require('./scripts/buildPortal').build()"` | After every `portal/ui` edit |
| `npm run portal:audit -- --realm <r> [--view <tab>] [--open "<trigger>"]` | Five sections; ②–⑤ are each ONE batched edit, ① CASCADE alone |
| `node scripts/portalGeometry.mjs --all --check` | 🔴 **Then `--realm <r> --write` on ONLY what moved.** `--all --write` rewrites `recordedAt` and `commit` on all seven, producing six files of metadata churn |
| `npm test` | ~2.5 min. Gate on its own exit: `if npm test > /tmp/t.log 2>&1; then …` |

### 1.3 Verify in the browser, never by assertion

`preview_start {name: "portal-harness"}` then `javascript_tool` reading `getComputedStyle`, `data-*` and text. ⚠️ **The harness caches hard.** A change can be in the built file AND served by the server AND still absent from the page. Force a fresh document: `location.href = '/harness.html?demo=1&cb=' + Date.now() + '#/<realm>'`.

---

## 2 · What is DONE (do not redo)

### 2.1 Shipped on `docs/build-out-handoff` this session

| Commit | What |
|---|---|
| `62a2d92f` | `.chip` renders as a button; Home's clock panel joins the page column |
| `d8dd6f59` | 38 of 107 deferred items archived (v3.79.0-pre) |
| `aca1d8ff` | context-mode's shipped docs recorded across five carriers; the red-suite defect found and fixed |
| `4eb584b1` | Home's five reach-and-legibility fixes |
| `a1d04dcb` | Home geometry re-recorded |
| `676b47ea` | Three design forks derived; four filed defects closed |
| `2f4b698d` | This plan and the exhaustive handoff |
| *(this commit)* | linksee fixed and wired: the stale skill, the `npx` launch, the product map, and the tool/skill docs swept |

**`npm test` is GREEN at `676b47ea`, verified 2026-09-06 18:11 EDT** by running it rather than by reading a log line. `docs:reflow`, `docs:reflow-comments` and `docs:audit` all exit 0.

### 2.2 The nine bucket-A items closed

1. The clock's "N more" reaches the Track (11 items were named and none reachable)
2. Truncated `.lt` carries `data-tip` (announcements were cut at 52% and 55%)
3. Two visually-hidden `h2`s fix `h1 → h3` and name the attention list
4. The identity chip initial: **3.74:1 → 7.54:1**
5. The staged strip names its realms (`across Season, Armory`)
6. The severity RUNG reaches assistive tech and the bar's tip (WCAG 1.4.1)
7. `hot` means proximity in both columns of the live panel
8. Armory's repair figure names its mode (`60 need repair in MP` against Home's 66)
9. Access's permission counts are derived; Analytics' revert is one tier; `1 announcement never ends`

### 2.3 Closed as already-fixed or refuted

- Delegated admin's Home under-report — fixed at `home.js:313`, an em dash reaches the masthead
- `"live now"` one label two questions — renamed to `announcements live` 2026-09-06 01:29 EDT
- The Track's lane collapse — **claim refuted by measurement**, see Task 1
- The category-accent set — **decided 2026-09-04 20:38 EDT**

---

## 2.4 ✅ THE NINE — ALL CLOSED, kept as the record of how (last row closed 2026-09-09 15:12 EDT)

⚠️ **This heading read *"WHAT IS ACTUALLY LEFT IN STEP 3"* until 2026-09-09 19:22 EDT, while every row below it was already closed** — the same heading-outlives-its-body defect this repo keeps paying for. **For what is open, read §0.1 and nothing else.** These rows are kept because each carries how it was closed and what was measured.

| # | Item | His input? | Task |
|---|---|---|---|
| 1 | ✅ **CLOSED 2026-09-08 22:58 EDT — there is no `exportPanel.js` bug.** Deltas re-measured on all four and decomposed member by member: the growth since the recorded figures is the raised type scale reaching into the overlay, and the residue is ~3 rows. See the ledger's Overlay tier | No | 3 |
| 2 | ✅ **CLOSED 2026-09-08 22:58 EDT.** The third shape is a CLOSING inline tag ending a line before a word — found by an adjacency census over `portal/ui/*.js`, not by guessing. **3 live sites, all in `armory.js`'s empty states**, all rendering as *"…armory yet.A build is a weapon"*. Gate added, proven able to fail on the real tree, sites fixed | No | 2 |
| 3 | ✅ **REFUTED 2026-09-08 22:58 EDT — the strip draws 39 of 39.** The filter drops nothing: no fixture item lacks a date, and the publications `.concat()` already added the two the lane-walk missed. **Counted in the browser**, not replicated: 39 `.scrub .mini`, six rows (3+11+3+6+14+2), zero `NaN`. The filed premise *"two items have neither a startDate nor a date"* measures zero | No | 5 |
| 4 | ✅ **CLOSED — and my own row here was wrong for an hour on 2026-09-09 14:31 EDT.** I read the entry's HEADING (*twelve findings*) and reported them open; its BODY has carried eleven ✅ bullets and two struck decisions since 2026-09-07 11:02 EDT. Nothing was owed | No | 6 |
| 5 | ✅ **BUILT 2026-09-09 13:56 EDT.** Both entry points through one gate — the label stages in the row like a permission cell, and the Edit chip opens the grant form in edit mode. Building it found a live data-loss bug on the same path (every permission save erased the label) and a second one Harkirat caught in a screenshot: the chips read `sc.hex`, which the server has never emitted | Answered — he chose the hybrid | 4 |
| 6 | ✅ **FULLY CLOSED 2026-09-09 15:06 EDT.** (2) verified in the harness · (4) not to be chased, by its own filing · (5) and (7) decided 2026-09-08 · (10) built — the previewed row is marked, from three options rendered for him · (11) deleted, the role does not exist · (12) a reasoned keep already recorded in `tokens.css` itself | Answered | 7 |
| 7 | ⏳ **PART DONE.** Colours ✅ 2026-09-07 (76 → 11). Transitions: `.prog-b i` ✅ moved to `transform`, browser-verified · `.ub .ubt i` 🔴 animates nothing (the whole `.ub` set is a dead reverse-orphan) · the Track's two ⏳ filed, Harkirat's call. Split in `docs/db-deferred-list.md`; the *zero `transition: width`* verify condition is amended | No | — |
| 8 | ✅ **ALREADY CLOSED 2026-09-06 21:42 EDT** — before this plan's own handoff called it untouched. Six of the nine resolved, three kept by measurement (`t-best` annotated, `trow-note`/`trow-empty` a cited D5 divergence). `docs/db-deferred-list.md` carries the per-class verdict table | No | — |
| 9 | ✅ **CLOSED 2026-09-07.** Both states registered and walking (the `?slow=N` knob already existed and had never been driven); **PASS 5 is DECIDED-NO** — Harkirat: *"Idc about reduced motion"* | No | — |

⚠️ **Batch the ones that share a file or a verify pass.** The Analytics, Access and Armory fixes shipped as one commit with one suite run on 2026-09-06; nine separate open-fix-verify-commit cycles is the retired per-realm loop wearing a different label.

⚠️ **Then step 4**, ~30 items — and **the player-facing work lives there**, not in step 3. Step 3 is entirely admin-facing.

## 3 · Tasks

### Task 1: Read the refuted Track item so it is not re-opened

**Files:** Read `docs/db-deferred-list.md` § the Track collapse entry.

- [ ] **Step 1: Read the measurement, do not re-measure**

The entry counted ITEMS; `track.js:673` counts ROWS via `assignRows`, which packs non-overlapping spans onto one row. Measured from `data-rows` in the harness at 1282px:

| Lane | rows | collapsed | items |
|---|---|---|---|
| draw | 1 | no | 3 |
| returning | 1 | no | 11 |
| drawwindow | 3 | no | 3 |
| event | **2** | **no** | 6 |
| playlist | **7** | **yes** | — |

Four of five lanes open, 23 items visible. *"Hiding 20 of 39"* is false. **No change. Do not act on it.**

---

### Task 2: The htm-whitespace accessible name

**Files:** Modify `portal/ui/*.js` (the offending sites) · Test: `node scripts/portalUi.test.js`

**Interfaces:** Consumes nothing. Produces no new exports.

- [ ] **Step 1: Find the third shape the gates do not cover**

```bash
rg -n 'portalUi|whitespace|htm drops' scripts/portalUi.test.js | head
```

The filed item says the class has THREE shapes and `portalUi.test.js` gates TWO: a line ending in a word before an inline text tag, and one other. **137 close-tag-to-open-tag adjacencies exist across 14 files and they are NOT 137 defects** — a gate that says so would be suppressed rather than obeyed.

- [ ] **Step 2: Write the failing gate for the third shape**

Add to `scripts/portalUi.test.js`, mirroring the two existing whitespace gates so the shape matches:

```js
// THE GATE CAN FAIL: an accessible name that runs two words together
assert.throws(() => assertNoRunOnAccessibleName('<span>one\n<b>two</b></span>'));
```

- [ ] **Step 3: Run it and confirm it fails**

`node scripts/portalUi.test.js` — expect the new assertion to fail.

- [ ] **Step 4: Fix the real sites, then re-run**

End the line with `${' '}` or keep the prose on one physical line.

- [ ] **Step 5: Commit**

```bash
git add portal/ui scripts/portalUi.test.js && git commit -m "fix(portal): an accessible name stops running two words together"
```

---

### Task 3: The four Export drawers are ONE finding

**Files:** Modify `portal/ui/exportPanel.js` · Verify: `npm run portal:audit -- --realm armory --open "Export"`

- [ ] **Step 1: Read the ledger's Overlay tier table first**

The recorded figures are PAGE-sized, not overlay-sized. **Read the DELTA**: armory Export 26/4/51 · broadcast 28/5/39 · access 22/6/48 · analytics 18/7/61. Broadcast's is triaged member by member; the other three are one shared component.

- [ ] **Step 2: Fix in `exportPanel.js`, not per realm**

Each scope states its OWN shape because only some of them re-import.

- [ ] **Step 3: Re-run the audit on all four and confirm one fix moved four numbers**

- [ ] **Step 4: Ledger row + commit**

---

### Task 4: Access — an admin's NOTE cannot be edited

**Files:** Modify `portal/ui/access.js` · `portal/api/access.js`

- [ ] **Step 1: Confirm the gap is still real**

`access.js` writes `note` only through `grant()`. The design offers an **Edit** chip per row (`access.html:432`) opening a drawer that edits permissions AND the note — the free-text label that is the only thing distinguishing `…000001` from `…000003` on screen.

- [ ] **Step 2: This is a FEATURE, not a conformance fix**

Part 4's scope explicitly excluded new editors. **Ask Harkirat in a pop-up before building it** — and query the ledger first per §0.4.

**Verify:** the portal can change an existing admin's `note` without revoking them, and `portal:audit --realm access --view "By admin"` no longer reports `button.chip` "Edit" as ONLY IN MOCKUP.

---

### Task 5: The season overview strip draws 37 of 39 bars

**Files:** Modify `portal/ui/track.js:644,654`

- [ ] **Step 1: Look at the two dropped items before removing the filter**

`scrubItems` ends with `.filter((i) => i.start && i.end)`; `season.html`'s `st.items.forEach` filters nothing and positions with `full.pct(it.start)`. **Two items have neither a `startDate` nor a `date`.** Establish what the MOCKUP draws for an item with no start — a bar at a real position, or one at `NaN`. If the mockup draws garbage, matching it is wrong and the portal is right.

- [ ] **Step 2: Decide from that evidence, then either fix or file a ledger row saying the portal is deliberately ahead**

---

### Task 6: The remaining §L ⑥ audit findings

**Files:** per finding. Reports: `local/agentA-L6-2026-09-04.md` · `local/agentB-L6-2026-09-04.md` (gitignored — state the paths).

- [ ] **Step 1: The two that are DECISIONS, not work, are both now answered**

The accent set is decided. The second — what to do when a CITED region stops reproducing — is still open and belongs to §0.7c as a fifth bucket or an explicit pruning step.

- [ ] **Step 2: Work the rest as ordinary items**

---

### Task 7: The design queue's UNDONE half

**Files:** per item. Source: `local/handoff/2026-09-05-portal-design-queue.md` §2.

Not done: (2) Season Board's empty column and Broadcast's `.bed` proportions · (4) the RE-APPLY QUEUE, recorded only in artifact `48baf822-3a53-46d0-9fe9-93da8e00d104` — ⚠️ **a photograph of deleted code, not a spec**; "the context band" and "the one-line draft state" were never located and are **not to be chased** · (5) Item H, playlist concurrency density, never re-asked · (7) four mockup composition changes Harkirat has never looked at · (10) mark the Manifest row whose preview drawer is open · (11) `[data-role=editor]` never emitted · (12) four unemitted selectors in `tokens.css`.

- [ ] **One session per numbered item, each closing with a ledger row.**

---

### 🔴 Task 8 IS NOT THE END OF v3 — read the launch checklist first (added 2026-09-09 15:43 EDT)

**`docs/ROADMAP.md` § 🚀 v3.0.0 — THE LAUNCH CHECKLIST** is the enumeration of what the v3.0.0 launch needs. This plan is ONE workstream inside it: section A of that list. Harkirat, 2026-09-09 15:43 EDT: *"id hardly call finishing step 4 the end of v3 pre release… and i've likely missed listing many things here."*

🔴 **CORRECTED 2026-09-09 18:44 EDT — the line below was wrong and is struck.** **Verified in this session against the transcript itself, not taken on the peer's word** — `~/.claude/projects/-Applications-Claude-Code-Diors-Builds/0e478890-6f40-4f6a-be84-06066b7418b8.jsonl`. The bucket table sits at **`2026-09-06T19:10:25.605Z`** and the phrase *"Roughly 30 items"* first appears at **`19:14:33.127Z`** — **four minutes later**, so the table precedes the number rather than being back-fitted to it. It came from the V3 two-agent audit classifying all **101** deferred-list entries, of which **50 were LIVE**:

| Bucket | Count | |
|---|---|---|
| A · Portal UI and UX | ~18 | **this is step 3** |
| B · Instruments and gates | ~10 | ordinary code |
| C · Records, carriers, context | ~8 | docs work |
| D · Infra and non-portal | ~10 | bot, site, OAuth, MongoDB |
| E · Standing, no action | ~4 | caveats and decided-not-now |

**B+C+D+E = 32.** That is the ~30.

🔴 **TWO CORRECTIONS THE DERIVATION ITSELF FORCES, and neither was in the message that brought it.** **(1) Bucket E is not work** — it is caveats and decided-not-now — so the workload is **B+C+D = 28**, and 32 counts entries rather than things to do. **(2) "Player-facing" is not supported by it.** C is docs work and D is bot/site/OAuth/MongoDB; Task 8's actual words are *"Roughly 30 items. **Player-facing first**"*, which is an ORDERING instruction. The phrase *"~30 player-facing items"* that four carriers have been repeating mis-renders it, and the buckets are what make that visible.

**So the real gap is narrower than "no basis": the classification was never written to a tracked file, so it survives as counts and themes rather than a checkable list — and it is now three days stale**, taken before step 3 closed its nine rows and before today's closures. **The filed unit is therefore a RE-DERIVE of B/C/D membership against today's list, not a scope-from-zero.**

*Struck:* ~~Task 8's own "roughly 30 items" is an estimate that names five bullets and enumerates nothing else — filed as `[P1 · S]` in `docs/db-deferred-list.md`. Scoping it is step 4's first unit. The checklist's rows carry their PROVENANCE (checked against the tree · asserted by an entry · not checkable from this machine), so do not read a row as verified unless it says so.~~

### Task 8: Step 4 — everything else

Roughly 30 items. **Player-facing first**, because step 3 is entirely admin-facing and nothing in it reaches a player:

- [x] ~~The landing page's command animation is missing `/help` and `/draw calculator`~~ — **done 2026-09-09 16:52 EDT, and it was THREE not two**: `/invite` was on the `/commands` page and never in the animation. `SPECS` went 11 → 14, matching `public/commands.html` exactly on Harkirat's call. Verified by running the page's own `render()` 20,000 times, not by arithmetic
- [ ] The `/manage` + `/bot analytics` click-test findings
- [ ] The instruments: `portal:states` non-determinism, `portalStatus`'s unproven stale branch, the third read-only audit
- [ ] Context architecture — five rules are still encyclopedias and the tier is ungated (P1)
- [ ] Restore the `Stop` hook

---

### 🔴 Task 9: STEP 3's IMPECCABLE PASS — five invocations, all realms per run, components only (added 2026-09-09 19:19 EDT)

**This task exists because the work had no task.** Tasks 1–7 are step 3's filed items and every one is closed; Task 8 is step 4. **The method step 3 was DEFINED by appears nowhere in this list** — it sat only in §0.2's retired-plans table, which is archaeology a reader consults to avoid re-proposing something, not a worklist. Harkirat, 2026-09-09 19:19 EDT, on being shown the correction: *"i dont even see anything in the plan or the handoff stating the corrected impeccable pass."* He was right, and the content being present in §0.2 is not the same as it being findable.

**Checked on disk 2026-09-09 19:19 EDT:** `.impeccable/surfaces/` holds **seven** briefs; `.impeccable/critique/` holds **one** report — `portal-ui-home-js`, generated 2026-09-06 14:15 EDT, **three days before step 3 ran**. `clarify`, `layout`, `harden` and `polish` have never been invoked on anything.

**The shape, in his words:** *"that literally could have been handled as just 5 total skill invokes… critique over all the realms (only on the specific components, not the entire front facing realm — as i had already described when drafting the plan) together as 1 full run, and then similarly clarify, layout, harden and polish in order."*

| # | Run | Scope |
|---|---|---|
| 1 | `critique` | ONE run, all realms, the specific components — never a whole front-facing realm |
| 2 | `clarify` | the confusing labels it named |
| 3 | `layout` | spacing |
| 4 | `harden` | empty states |
| 5 | `polish` | last |

🔴 **WHAT MUST NOT HAPPEN: seven per-realm runs.** That is V1 — 5 skills × 7 realms = **35 invocations**, each spinning up fresh subagents to re-derive the same context — and it is what he killed. §0.2's summary of that retirement (*"`critique` is DISCOVERY"*) generalised a complaint about SHAPE into one about the TOOL, and three sessions read it as a retirement of the whole toolset, including the one that closed step 3. `clarify`/`layout`/`harden`/`polish` are FIX verbs applied to items already in hand — the ~18 bucket-A items — and were never in question.

⚠️ **Step 3's nine filed rows are genuinely done.** What is missing is the method, not the items.

🔴 **THIS TASK'S OWN VERIFY CONDITION WAS UNSATISFIABLE AS WRITTEN, AND THE PASS THAT FOUND IT WAS THE ONE RUNNING IT (corrected 2026-09-09 20:33 EDT).** It required each fix verb to have *"closed named bucket-A items"* — but §0.1's own row says all nine open bucket-A items closed at 15:12 EDT, four hours BEFORE this task was written at 19:19. There were none left to close. That is the same stale-number defect this session has been chasing all day, sitting inside the task about to be executed.

**Verify:** `.impeccable/critique/` carries ONE run whose target is the component layer and whose evidence spans every realm that mounts it — never seven per-realm reports. Each of `clarify`, `layout`, `harden`, `polish` has produced either a landed change in `portal/ui/` or `app.css`, or a filed row carrying its own verify condition. ⚠️ **`.impeccable/critique/` is GITIGNORED**, so the findings are only real once they are in `docs/db-deferred-list.md`. Filed as `[P1 · M]` there.

**State, 2026-09-09 20:57 EDT:** all five verbs have run. `critique` ✅ 32/40, one run across the component layer, two isolated sub-agents. `clarify` ✅ the expired-session screen (`1fef14c4`). `layout` ✅ drawer chrome, tray, `.mtools` and the rail (`d0f35d94`, `5814deae`); the masthead is deliberately excluded and blocked on the duplicate-selector item. `harden` ✅ the tray's blocking hint, the toast's recovery control, and three `--ink4`-as-text contrast failures. `polish` ✅ the close button's hit area, three duplicate hover declarations collapsed to one, `SelectionBar`'s close tag, and `.drawer.side` annotated as reserved rather than deleted. **Four of the eight filed findings are closed, one is part done, and one NEW `[P1 · S]` came out of it: `portalContrastRendered.test.js` walks a fixture rather than the seven realms, which is why two live contrast failures survived a green gate.**

## 4 · Self-review

**Spec coverage.** Every LIVE bucket-A item in `docs/db-deferred-list.md` maps to Tasks 2–7; step 4 is Task 8. The refuted and already-decided items are Task 1 and §2.3 so they cannot be re-opened.

**Placeholder scan.** Task 4 and Task 5 deliberately stop at a decision point rather than prescribing a fix, because both turn on evidence a future session must gather — that is a stated gate, not a TBD.

**Type consistency.** No new exported symbols are introduced by this plan.

## Audit log

**Falsification pass, 2026-09-06 18:06 EDT.** Where is this plan wrong?

1. **"The unit is the filed item" could itself become a loop.** Nine items in one session went fine, but a session that opens each item, checks the ledger, looks, fixes, verifies and commits SEPARATELY is a five-step loop with a different name. **Mitigation:** batch items that share a file or a verify pass — the Analytics/Access/Armory trio shipped as one commit with one suite run.
2. **The DONE list could go stale the same way the deferred list did.** It is a snapshot at 2026-09-06 18:06 EDT. **Mitigation:** every entry names a commit hash, so `git show` refutes it in one command.
3. **Task 5 assumes the two dropped items are a portal defect.** They may be the portal being right. The task is written to gather evidence first and permits either outcome.
4. **The "who owns a fork" test may still be too crude.** It worked for three forks on 2026-09-06 but each had a citable rule. A fork with no rule on either side goes to Harkirat, and that is the honest boundary.
