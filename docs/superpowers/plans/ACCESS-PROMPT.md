---
kind: plan
status: live
---

# Part 4 — Access. Paste this in.

> Written 2026-09-01 by the Broadcast session (§0.0), corrected the same day by three cold readers. **Every number below names the command that produces it; where a figure and a tool disagree, the tool wins.**

## 🔴 ORDER OF OPERATIONS — this block supersedes every competing instruction, and nothing else needs opening to start

*Added 2026-09-01 15:50 EDT because two cold readers, given every document, could not resolve five procedural questions without reading 880 lines — and one of them named this block as the single highest-value change available. `SESSION-START.md` defers to the realm prompt explicitly, so this is the authority.*

**1 · Order.** `git log --oneline -3 v3-pre-release` → build → the two `preview_start` calls → `portal:status` → the audits. 🔴 **Five places claim to be "the first call of every realm"** — §0.7a says `portal:audit`, §0.5b's ⓪ says `portal:diff`, §0.5b again says two screenshots, §0.2 says the real server, `SESSION-START` says a realm audit is not first any more. **Each is first WITHIN ITS PHASE. This list is the ordering. Stop looking.**

**2 · Tool per question.** Prose question (is this settled?) → `ctx_search`. Symbol or callers → `codebase-memory`. A string you already know exists → `rg`. The comment beside the code → `Read` with `offset`/`limit`. ⛔ No browser and no probe during triage. §0.4's Reading row said "Grep" until today; ignore any copy of it that still does.

**3 · Browser.** §0.4 says 🔴 *NOT the in-app browser* — **that governs MEASUREMENT, not servers.** `preview_start` starts a launch-config server and is required here; measurement goes through `chrome-devtools-mcp`, and the portal instruments drive their own headless browser and need neither.

**4 · Turns, and what a "unit" is.** Target **≤35 tool calls** for the resting pass — Broadcast's took ~30 with two unanticipated fixes, and §0.7c's honest shape is `3 + (1 per independent root-cause group) + 1 regression + the interaction tier`. **A UNIT is one independent root-cause group plus its re-audit** — that is the thing you never stop in the middle of. At a turn-budget warning: finish the current unit *including* its verification, then report. **Cut the report, never the band captures** — capture at least three bands down the page before you claim you have looked. ⚠️ **A Part may span sessions** (§L: *"Season alone is several sessions"*); §0.0's one-Part-per-session is the intended shape, not a promise you can keep.

**5 · What you may do without asking.** 🟢 **Commit on the branch freely — do not ask, and do not batch a session's work into one commit** (commits are per coherent fix). 🟢 Run every instrument. 🟢 Dispatch the §L ⑥ reader agents. ⛔ **Never** push, open a PR, merge, or ask about any of them.

**6 · What ends Part 4** — copied out of §L so you need not open it: ① `portal:converge` flat *(run the named tool, never `portal:audit`'s ① section)* · ② `portalDiff` reports exactly the cited region set on all three views · ③ `portalInventory`'s six lists empty or dated-cited · ④ machine floor green **re-run at the commit you claim it for** · ⑤ a real-server pass · ⑥ the reader test on Part 5's carriers, everything it finds fixed · ⑦ Harkirat has looked. **The changelog paragraph and the A/B artifact are NOT yours** — see §L's status-vocabulary note.

---

## The two lines §0.0 requires before any task content

- `/rename Sonnet5-High · Access conformance · <Mon DD>`
- `Premise Low · Delib High -> Sonnet5-High` — the audit produces the findings, so the facts are given and checkable; the load is breadth across sites. Escalate on events only: a premise turning out false, or two hypotheses wrong.

## Branch state

`feat/broadcast-portal-conformance`. **HEAD is `fa003c6`** (the commit carrying this prompt); `804fa8b` is its parent and holds the realm work. **Unpushed, no PR** — Harkirat had not approved a push. `package.json` is still `3.70.0-pre`: the changelog paragraph and the bump are the pre-merge checkpoint and cannot be written until the PR number exists, which is why `docs/CHANGELOG.md`'s newest entry is still Armory's `v3.70.0`.

🔴 **Check whether it merged before you start** — `git log --oneline -3 v3-pre-release` — because Broadcast's pass changed `manifest.js` and `app.css`, which Access renders through.

## The mode

🔇 **Silent mode**, per `MEMORY.md`'s section — auto-loaded, already in context. No narration between calls, one summary at the end, batch aggressively, `sequentialthinking` before any audit or review. ⚠️ **Nothing enforces it**, and the Broadcast session was told twice to batch harder. The technique that gets skipped: **N edits across N files is ONE `python3` heredoc** with an `assert <anchor> in s` before each replacement, a `print()` per edit, and `node --check` + the build + the re-audit chained onto the same call.

## First calls, in this order

🔴 **THE ORDER OF THE FIRST TWO IS LOAD-BEARING.** `portal/public/` is **gitignored and holds zero tracked files** (`git check-ignore -v portal/public` → `.gitignore:84`), and `.claude/launch.json`'s `portal-harness` command does `os.chdir('portal/public')` before it binds. In a fresh clone or a `git worktree` that directory does not exist, the server dies with `FileNotFoundError`, :8901 never listens, and every audit, inventory and diff below fails against a dead port. **Build first.**

```bash
node -e "require('./scripts/buildPortal').build()"    # CREATES portal/public — gitignored, absent in a fresh clone
```

Then two **MCP tool calls — not shell**, which is why they sit outside the fence:

- `preview_start {name:"repo-static"}` — :8900, the mockup. Serves the **repo root**, so a bare `:8900` is a directory listing.
- `preview_start {name:"portal-harness"}` — :8901, serving `portal/public`.

⚠️ **`lsof -nP -iTCP:8900 -iTCP:8901 -sTCP:LISTEN` first** — both may already be running, and `preview_start` then fails with **`port in use`**, which is benign. **Only that message is benign; any other `preview_start` failure is real.**

```bash
npm run portal:status                     # the close-condition board is at the FOOT
npm run portal:audit -- --realm access --view "By admin" --all
npm run portal:audit -- --realm access --view "By scope" --all
npm run portal:audit -- --realm access --view "Sessions" --all
npm run portal:audit -- --realm access --triggers
npm run portal:inventory -- --realm access
node scripts/portalDiff.mjs --realm access --portal harness
npm run portal:converge -- --realm access
```

🔴 **`--all` LIFTS THE ROW CAPS ON ONE VIEW. IT DOES NOT WALK VIEWS.** Access has three — `By admin`, `By scope`, `Sessions` — and `portal:status` prints them.

🔴 **RUN `portal:converge`, AND DO NOT SUBSTITUTE `portal:audit`'s ① CASCADE FOR IT.** §L's close condition ① names `portalConverge` by name. The Broadcast session wrote ① into its §L row from the audit's ① section, and `portal:status`'s receipt board read `converge · never` for that realm at the same moment — the reader test caught it. When converge was actually run it reported eight RHYTHM rows and thirteen WORDS rows the audit had not: most were shallow-walk artifacts, one was a real cited row, and none of that was knowable in advance. **The instruments are not interchangeable because their sections have similar names.**

## The two phases a realm prompt keeps dropping — both have a named artifact

🔴 **Neither appeared in this prompt until 2026-09-01, and the plan already records that one of them has been missed TWICE for exactly this reason.** §0.5b's phase order is `① ② ③ ④ ⑥ ⑤` and it calls the ordering load-bearing; a prompt that lists instruments and not phases quietly deletes two of them.

**① LOCATE → `local/locate-access.md`.** For every item this surface owns: does the fix live in the mockup only / the portal only / both / neither — **with a citation**. One row per item: item · verdict · citation · what it implies for the work. §0.5b: *"🔴 IT PRODUCES A NAMED ARTIFACT, or it did not happen"* — it was the plan's self-declared most valuable step and the only one with no deliverable, so a session could claim it with no way to check. **It is what stops a diff becoming a rollback**, and it is the input to ③ and ⑤.

**⑥ UX-COPY → every row applied or answered in the difference ledger.** Work Access's rows from `local/handoff/2026-08-25-portal-ux-copy-audit.md` — ⚠️ **gitignored, so no `rg` will surface it; open it by path.** Its sections A–G are realm-shaped and its **vocabulary table** is cross-realm, so a word changed here must change everywhere it appears. 🔴 **§0.5b's audit log entry 25 is this exact failure**: *"The UX-copy audit was assigned by a sentence that bound nothing"* and was missed a third time undetectably. ⑥ runs **before** ⑤ CLOSE, because a word change is a visual change.

## The real-server pass — §L condition ⑤, and the first draft of this prompt omitted it entirely

⧗ is unreachable (§L), so a Part that wants to close **must** run one. It needs a third server the harness block above does not start:

```bash
node --env-file=.env.dev portal/server.js     # :8787
npm run portal:realwalk -- --realm access
node scripts/portalDiff.mjs --realm access    # --portal real is the DEFAULT here, and the stronger comparison
```

🔴 **NEVER `npm run portal`.** It is a bare `node portal/server.js`, and `portal/server.js:6` calls `dotenv.config()` — which loads **production's `.env`**. The `--env-file` flag is the whole safety margin. ⚠️ `portalRealWalk` mints a dev session in Mongo, so **a local Mongo and a `.env.dev` carrying a localhost `MONGODB_URI` are prerequisites**; without them it throws *"could not mint a dev session"*.

**:8787 is the third URL in the deliverable**, not an afterthought — the mockup and the harness are both fixture-driven and corroborate each other vacuously (§0.2).

## Then crop the captures and LOOK, early

```bash
rm -f local/diff-access/*.png          # 🔴 NOT OPTIONAL — captures from 2026-08-30 are sitting there, and
                                       # magick will happily crop a stale one into a plausible band
node scripts/portalDiff.mjs --realm access --portal harness
Y=0; H=900
magick local/diff-access/mk-access.png -crop 1282x${H}+0+${Y} +repage -resize 660 /tmp/mk.png
magick local/diff-access/pt-access.png -crop 1282x${H}+0+${Y} +repage -resize 660 /tmp/pt.png
magick /tmp/mk.png /tmp/pt.png +append -bordercolor '#777' -border 2 /tmp/band.png   # mockup LEFT, portal RIGHT
```

Then `Read /tmp/band.png`. **Of Armory's seventeen closed defects seven came from this and zero from the percentage; of Broadcast's, the single largest did too** — a `SAVED` badge painting pale grey on a bright green fill at 1.34:1, which every gate passed and which ④ STYLE reported as one row among nine.

## What is actually true about Access

| | The command that produces it |
|---|---|
| **46KB · 8 handlers** | `npm run portal:status`. ⚠️ §L row 4 says *"47.7KB · 7 handlers · 15 data-attrs"* and **all three disagree with a measurement**: the tool prints 46KB/8h, and `rg -o 'addEventListener\|onclick=' access.html \| wc -l` returns **8** |
| **19 `onX` prop sites · 9 distinct handlers** | `rg -o '\son[A-Z][A-Za-z]*=' portal/ui/access.js` → 19; adding `\| sort -u` → 9 |
| **12 distinct `data-*` names / 30 occurrences in `access.html`, 0 in `access.js`** | `rg -o 'data-[a-z-]+' <file>`. **Nothing in `scripts/` prints a per-realm data-attribute count**, so §L row 4's "15" has no producing instrument at all |
| **Never instrumented** | `portal:status`'s close-condition board reads `· never` across all five columns for this realm |
| ⚠️ **The drift counter is not a failure signal** | `portal:status` shows access `🔴 N — RE-MEASURE`; that counts `portal/ui` commits since the fixture, not a mismatch. `node scripts/portalGeometry.mjs --realm access --check` returns `✅ matches its fixture` |

## Two things already settled for you, both measured

1. 🔴 **`mxrole`/`mxrow` are DEAD ON BOTH SIDES — this is done, do not re-investigate it.** Measured 2026-09-01: **8** matches in the mockup's `assets/app.css`, **8** in `portal/ui/app.css`, and **zero emissions** in `access.html`, `assets/shell.js` or `portal/ui/access.js`. Identical disposition to Broadcast's `atbar`/`atrow`/`atruler`/`atnow`/`timax`/`timb`/`timleg`, which PART 4's neighbour recorded the same way and which turned out to be §0.7c bucket 2. **File a ledger row and move on.** ⚠️ **`portal:reverse-orphans` cannot answer a dead-on-both-sides question** — its scope is `portal/ui/*.js` emitters and `portal/ui/*.css` rules and it never reads a mockup page, so it sees only the portal half. `rg -c 'mxrole|mxrow'` over the four files settles it.
2. ⚠️ **§0.9: Access's grant inputs "having no label" is NOT a defect** — they are `<label for=…><span>…</span><input id=…>`, and a probe reading only `innerText`/`aria-label` reports them as nameless. Do not "fix" it.

## What Part 3 leaves you that is not in any instrument

1. 🔴 **THE SHARED `Manifest` HAS NOW HAD TWO CLASS-NAME DEFECTS AND BOTH SAT IN ITS RATCHET BASELINE.** Armory's `RANK_KEY` emitted `t-t3` against `.t-top3`; Broadcast found `PILL` emitting `stag`/`sched`/`exp`/`conf` against stylesheets defining only `.stt.saved`/`.stt.staged`/`.stt.conflict`, so every staged and every conflict row on Season had been rendering with no state shape at all. **Access builds `mxcell` state through a class expression too** (`access.js:187-190`). ⚠️ **READ ITEM 2 BELOW BEFORE ACTING ON THIS ONE — the imperative and its antidote were in the wrong order and a cold reader said the ordering alone would produce the deletion.** Then: **read `portal/fixtures/reverse-orphans.json` itself, not just the exit code** — a ratchet's baseline is by construction a list of things already agreed to live with, which is exactly why both survived weeks. 🔴 **But four of its entries for THIS realm are scanner artefacts, not debt, and deleting their rules would delete live CSS.**
2. 🔴 **BUT `--why` CANNOT RESOLVE THE EXPRESSION THAT BUILDS THOSE CLASSES, AND IT SAYS SO ONLY BY REPORTING THEM AS DEAD.** Measured 2026-09-01: `--why` reports `.pend` (3 rules), `.inherited` (1) and `.locked` (4) as *"emitted by — nothing"*, while `access.js:189-190` demonstrably emits `' pend'`, `' pend off'`, `' inh inherited'` and `' locked'`. The evaluator resolves `'mxcell'` and `' on'` and gives up at the nested parenthesised ternary. **`pend` and `locked` are already in the baseline as accepted debt and they are SCANNER ARTEFACTS, not debt.** A session following instruction 1 literally would delete live rules. Read `access.js:187-190` before believing any `--why` answer about the grid.
3. 🔴 **`.mxgrp th`'s two group headers span four `ADMIN_COMMANDS` and eight `MANAGE_PAGE_SCOPES` while the COLUMNS come from `accessScopes` order** — so appending a command silently mis-groups the grid. Both counts verified. The overlay cannot see it (the fixture happens to line up), which is exactly why the real-server pass above is not optional.
4. 🔴 **The decision ledger has no `## Access` section — create it empty before triage.** The Broadcast section's own preamble is the convention and the reason: *"An empty section is not the same as an unexamined realm — this table exists so a Part 4 finding has somewhere to land and so `ctx_search` against this ledger returns a HEADING rather than nothing."* §0.7c call 2 sends you to `ctx_search` this file first, where an empty return reads as "never decided".

## 🔴 BEFORE YOU TRUST A CLEAN REAL-SERVER WALK: can the dev data REACH this realm's states?

*No document acknowledged this question until 2026-09-01; a cold reader found it by asking what Access is actually FOR.*

Access's subject is grants, scopes, sessions and admins, and its grid draws four states through a class expression — `pend`, `pend off`, `inh inherited`, `locked`. **`portal:realwalk` mints a dev session and walks the page; it does not tell you whether any of those states exists in the dev database.** If none does, the grid renders without them, the walk reports clean, and the clean reading is worth nothing — it is §0.10's *identical readings across variants that must differ = never arrived*, one level up: **a clean walk over an empty state space is not evidence.**

**So count before you conclude.** Against `.env.dev`'s localhost Mongo: how many admins, how many grants, how many with an inherited or pending or locked disposition, how many live sessions. If a state the realm exists to draw cannot be reached, say so in the summary as a **coverage limit of the pass**, exactly as `portalDiff` prints the axes it does not cover — do not let its absence read as its correctness. Seeding is out of scope; **naming the gap is not.**

## The rules that were added or earned in the last two days

- **R1–R11 live in §0.5a — read them there, not here.** The two that fired on Broadcast: **R10** (a claim that no instrument can see something needs their output) and **R11** (before adding an instrument, name the one that should have caught it — which is how `portalRealWalk`'s Season-hardcoded view names were found, since `portal:status` already knew each realm's).
- **§0.7c's triage buckets** — CITED / DEAD-ON-BOTH / ALREADY-SETTLED / FIX, sorted from the audit's own output plus the comment beside the code, **before any probe**. Broadcast's `button.chip "All"` looked like a missing control; `--triggers` showed 17 · 17 on both sides. **Check the page before closing a SHAPE finding.**
- 🔴 **A CITED ① CASCADE is CLOSED, not fixed.** Access will report `b.crumb-sep +4 top / −6 height` under every `--open`, exactly as Broadcast did. Work ④ through it.
- 🔴 **A GATE RESULT IS A FACT ABOUT A TREE, AND THE TREE MOVES.** Broadcast wrote "npm test exit 0" into §L from a run that predated its last code edit, and the suite was red on that branch's own hard-wrapped comment for two commits before a falsification pass caught it. **Re-run the machine floor at the commit you are claiming it for.**

## Two rules no document carried until a cold reader was forced to choose

**`portal:states` goes red and it is the known local coin-flip.** Re-run that state **alone, once**. Passes alone but fails in-suite → the documented load-dependent non-determinism; file it with the state name, selector and timeout, and 🔴 **do not claim the machine floor green at that commit.** Fails standalone twice, or names a selector you edited → it is yours, immediately. **Never re-run until green and move on** — a red run with no defect behind it sends the next session hunting a ghost.

**A defect in a CLOSED realm, found while working this one.** Renders through a shared surface (`shell.js`, `manifest.js`, `app.css`) → **fix it now**, and re-run that realm's geometry fixture in the same commit (§0.5b). Lives in the closed realm's own file → **file it**; §0.8 froze Season's coverage and a later finding is a §L row 7 sweep item, never a reason to reopen. **Either way, do not ask.**

## How to decide whether a difference is worth a pop-up

🔴 **Measure both sides FIRST.** Two of §0.8's HITL rows were retired on 2026-09-01 without asking, because measurement showed there was nothing to decide — the mockup renders `Delivery queue` and contains `Now showing` zero times, and both sides draw the severity dot identically. Harkirat's reply to being shown the one real difference was *"why are you being so closed minded and relying on me for tiny things like this when you're literally capable of these judgement calls on your own."*

**The one Access question that is genuinely his**, and it is a scope fork rather than a taste question: §0.8's *"four composition changes he has never seen"* names no Access surface, so if the permission grid turns out to differ from the mockup in KIND rather than in pixels, that earns one batched pop-up at the START. Everything else: decide it, and say what you decided and why.

## Out of scope, do not reopen

Redesigns wait for **all six realms** (`CLAUDE.md`, re-affirmed 2026-08-31 against my own argument — do not re-derive it). 375×812 is a decision, not a gap. `core/ops` and the operation algebra. Refactors. **Never push, open a PR, ask about either, or raise the branch's size.**

## Before you hand this on

🔴 **§L condition ⑥ — run the READER TEST on Part 5's carriers and fix everything it finds.** Three agents, no transcript: one starts the next Part and lists every place it cannot · one falsifies every checkable claim · one gets **forced choices under the contradictions, a 15-call execution plan and an adversarial pass**. 🔴 **The third shape found what the first two could not** — a reader can quote a document correctly and still do the wrong work, so ask what it would DO, and refuse "the documents disagree" as an answer. On this document the three found 15, 8 and 17. ⚠️ **The read guard will tell your agents they have already read files they have not** (it inherits your read-state; the harness sends no agent field) — tell them to override with `offset: 0`.

## Closing

§L's seven conditions, and the seventh is Harkirat looking. Never write "done" (R5). **The deliverable is the servers running and the URLs side by side:**

- mockup — `http://localhost:8900/docs/superpowers/mockups/2026-08-23-portal-interactive/access.html`
- portal — `http://localhost:8901/harness.html?fresh=1&b=<any number>#/access` — **the `b=` cache-buster is not optional**; without it the page can come from bfcache and you review the previous build
- real — `http://localhost:8787/#/access`
