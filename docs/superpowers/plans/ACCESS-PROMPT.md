---
kind: plan
status: live
---

# Part 4 — Access. Paste this in.

> Written 2026-09-01 14:45 EDT by the Broadcast session, per §0.0, and **corrected 2026-09-01 15:01 EDT after the §0.5c reader test found fifteen defects in it** — including that its first fenced block would have died on line 2, and that it gave no route at all to the real server its own body calls "the first artifact you open". Every number below now names the command that produces it.

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
| **19 `onX` prop sites · 9 distinct handlers** | `rg -o '\son[A-Z][A-Za-z]*=' portal/ui/access.js` → 19; adding `\| sort -u` → 9. ⚠️ An earlier draft said "17", which reproduces under no counting method — §0.5a R1 |
| **12 distinct `data-*` names / 30 occurrences in `access.html`, 0 in `access.js`** | `rg -o 'data-[a-z-]+' <file>`. **Nothing in `scripts/` prints a per-realm data-attribute count**, so §L row 4's "15" has no producing instrument at all |
| **Never instrumented** | `portal:status`'s close-condition board reads `· never` across all five columns for this realm |
| ⚠️ **The drift counter is not a failure signal** | `portal:status` shows access `🔴 N — RE-MEASURE`; that counts `portal/ui` commits since the fixture, not a mismatch. `node scripts/portalGeometry.mjs --realm access --check` returns `✅ matches its fixture` |

## Two things already settled for you, both measured

1. 🔴 **`mxrole`/`mxrow` are DEAD ON BOTH SIDES — this is done, do not re-investigate it.** Measured 2026-09-01: **8** matches in the mockup's `assets/app.css`, **8** in `portal/ui/app.css`, and **zero emissions** in `access.html`, `assets/shell.js` or `portal/ui/access.js`. Identical disposition to Broadcast's `atbar`/`atrow`/`atruler`/`atnow`/`timax`/`timb`/`timleg`, which PART 4's neighbour recorded the same way and which turned out to be §0.7c bucket 2. **File a ledger row and move on.** ⚠️ **An earlier draft told you to settle it with `portal:reverse-orphans`, which structurally cannot.** That script's own header states its scope: *"Emitters: `portal/ui/*.js` only. Rules: `portal/ui/app.css` and `portal/ui/tokens.css` only."* It never reads `access.html`, so it can only ever answer the portal half of a dead-on-both-sides question. Two `rg` calls settled it.
2. ⚠️ **§0.9: Access's grant inputs "having no label" is NOT a defect** — they are `<label for=…><span>…</span><input id=…>`, and a probe reading only `innerText`/`aria-label` reports them as nameless. Do not "fix" it.

## What Part 3 leaves you that is not in any instrument

1. 🔴 **THE SHARED `Manifest` HAS NOW HAD TWO CLASS-NAME DEFECTS AND BOTH SAT IN ITS RATCHET BASELINE.** Armory's `RANK_KEY` emitted `t-t3` against `.t-top3`; Broadcast found `PILL` emitting `stag`/`sched`/`exp`/`conf` against stylesheets defining only `.stt.saved`/`.stt.staged`/`.stt.conflict`, so every staged and every conflict row on Season had been rendering with no state shape at all. **Access builds `mxcell` state through a class expression too** (`access.js:187-190`). **Read `portal/fixtures/reverse-orphans.json` itself, not just the exit code** — a ratchet's baseline is by construction a list of things already agreed to live with, which is exactly why both survived weeks.
2. 🔴 **BUT `--why` CANNOT RESOLVE THE EXPRESSION THAT BUILDS THOSE CLASSES, AND IT SAYS SO ONLY BY REPORTING THEM AS DEAD.** Measured 2026-09-01: `--why` reports `.pend` (3 rules), `.inherited` (1) and `.locked` (4) as *"emitted by — nothing"*, while `access.js:189-190` demonstrably emits `' pend'`, `' pend off'`, `' inh inherited'` and `' locked'`. The evaluator resolves `'mxcell'` and `' on'` and gives up at the nested parenthesised ternary. **`pend` and `locked` are already in the baseline as accepted debt and they are SCANNER ARTEFACTS, not debt.** A session following instruction 1 literally would delete live rules. Read `access.js:187-190` before believing any `--why` answer about the grid.
3. 🔴 **`.mxgrp th`'s two group headers span four `ADMIN_COMMANDS` and eight `MANAGE_PAGE_SCOPES` while the COLUMNS come from `accessScopes` order** — so appending a command silently mis-groups the grid. Both counts verified. The overlay cannot see it (the fixture happens to line up), which is exactly why the real-server pass above is not optional.
4. 🔴 **The decision ledger has no `## Access` section — create it empty before triage.** The Broadcast section's own preamble is the convention and the reason: *"An empty section is not the same as an unexamined realm — this table exists so a Part 4 finding has somewhere to land and so `ctx_search` against this ledger returns a HEADING rather than nothing."* §0.7c call 2 sends you to `ctx_search` this file first, where an empty return reads as "never decided".

## The rules that were added or earned in the last two days

- **R10** — a claim that no instrument can see something is a claim ABOUT the instruments and needs their output.
- **R11** — before ADDING an instrument, name the existing one that should have caught it and say why it did not. Broadcast's `portalRealWalk` fix came from this: it defaulted to **Season's** view names on every realm, and the instrument that already knew each realm's views was `portal:status`, reading the same fixtures. It reads them now.
- **§0.7c's triage buckets** — CITED / DEAD-ON-BOTH / ALREADY-SETTLED / FIX, sorted from the audit's own output plus the comment beside the code, **before any probe**. Broadcast's `button.chip "All"` looked like a missing control; `--triggers` showed 17 · 17 on both sides. **Check the page before closing a SHAPE finding.**
- 🔴 **A CITED ① CASCADE is CLOSED, not fixed.** Access will report `b.crumb-sep +4 top / −6 height` under every `--open`, exactly as Broadcast did. Work ④ through it.
- 🔴 **A GATE RESULT IS A FACT ABOUT A TREE, AND THE TREE MOVES.** Broadcast wrote "npm test exit 0" into §L from a run that predated its last code edit, and the suite was red on that branch's own hard-wrapped comment for two commits before a falsification pass caught it. **Re-run the machine floor at the commit you are claiming it for.**

## How to decide whether a difference is worth a pop-up

🔴 **Measure both sides FIRST.** Two of §0.8's HITL rows were retired on 2026-09-01 without asking, because measurement showed there was nothing to decide — the mockup renders `Delivery queue` and contains `Now showing` zero times, and both sides draw the severity dot identically. Harkirat's reply to being shown the one real difference was *"why are you being so closed minded and relying on me for tiny things like this when you're literally capable of these judgement calls on your own."*

**The one Access question that is genuinely his**, and it is a scope fork rather than a taste question: §0.8's *"four composition changes he has never seen"* names no Access surface, so if the permission grid turns out to differ from the mockup in KIND rather than in pixels, that earns one batched pop-up at the START. Everything else: decide it, and say what you decided and why.

## Out of scope, do not reopen

Redesigns wait for **all six realms** (`CLAUDE.md`, re-affirmed 2026-08-31 against my own argument — do not re-derive it). 375×812 is a decision, not a gap. `core/ops` and the operation algebra. Refactors. **Never push, open a PR, ask about either, or raise the branch's size.**

## Before you hand this on

🔴 **§L condition ⑥ — run the READER TEST on whatever you write for Part 5, and fix everything it finds.** Two read-only agents with no transcript: one asked to start the next Part and to list every place it cannot, one asked to falsify every checkable claim. **On this document they found fifteen and eight respectively**, including that `npm test` was red while §L said green, and that this file's first fenced block would have failed on line 2. Neither is visible from the inside — the author knows what the words meant.

## Closing

§L's seven conditions, and the seventh is Harkirat looking. Never write "done" (R5). **The deliverable is the servers running and the URLs side by side:**

- mockup — `http://localhost:8900/docs/superpowers/mockups/2026-08-23-portal-interactive/access.html`
- portal — `http://localhost:8901/harness.html?fresh=1&b=<any number>#/access` — **the `b=` cache-buster is not optional**; without it the page can come from bfcache and you review the previous build
- real — `http://localhost:8787/#/access`
