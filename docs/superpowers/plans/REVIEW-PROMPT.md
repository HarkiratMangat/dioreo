---
kind: plan
status: superseded
superseded_by: docs/superpowers/plans/2026-08-27-portal-conformance.md
---

> 🔴 **PART 6a IS DONE. THIS FILE IS A RECORD OF HOW IT WAS FRAMED, NOT AN INSTRUCTION — superseded 2026-09-03 09:18 EDT by §L row 6a of the conformance plan, which carries the outcome, the twelve adjudicated regions and what is still open.**
>
> ⚠️ **THE COMMAND BLOCK BELOW NO LONGER RUNS AS WRITTEN, AND THAT IS WHY THIS BANNER EXISTS RATHER THAN A `status:` LINE ALONE.** Three of its five commands now **exit 2**: `portal:audit`, `portal:inventory`, `portal:diff` and `portal:converge` REFUSE on Review without `--mk-query demo=1`, because an unseeded run measures an EMPTY mockup against a POPULATED portal and returns a confident wrong number. A superseded document's code block is still a code block, and someone would have pasted it.
>
> ⚠️ **EVERY FIGURE IN §3 IS THE PRE-SEED READING** — 4.7% / 15 regions, converge 40-of-25, inventory mk 32 · pt 55. They are historically true and currently misleading. The seeded readings are **0.5% in 12 regions**, converge **12 of 28**, and the twelve regions are enumerated with their classes in `docs/reference/portal-decision-ledger.md`.


# Part 6a — Review. Paste this in.

> 🔴 **IF YOU WERE HANDED A SHORT OPENER, IT IS NOT A SUMMARY OF THIS FILE.** It is a pointer with a gate on it. Everything that makes this realm different from the last four is below and none of it fits in an opener: the reason the two sides **cannot be compared at rest by any existing tool**, the metric that told two Parts this realm had zero handlers, and the one figure the plan quotes that is a category error rather than a large value.
>
> **The falsifiable version:** this document names a fork that **belongs to Harkirat and must be raised before the first audit**, and a figure that looks like "nearly done" and is the tell that something is wrong. If your working belief is "Review is small and static, do a light pass", you are holding the framing this document exists to overturn — and it was the plan's own framing until 2026-09-02.

> Rewritten 2026-09-02 09:55 EDT after a reader test. **Every number below names the command that produces it.** ⚠️ **The first version of this file failed its own rule**: it quoted a sentence as `review.html`'s copy that does not exist anywhere in that file, inherited from a stale citation and never checked. That is recorded in §2 rather than quietly repaired, because it is the exact failure the previous Part wrote a section warning about.

## 🔴 §0 — FIRST ACTIONS, IN THIS ORDER

**1 · Verify your own memory loaded.** `MEMORY.md` is larger than the harness's ~25KB loader cap, so `CLAUDE.md` `@`-imports it. **That import sat inside the frontmatter and was inert until 2026-09-02** — every session before that silently lost 52 index lines across four sections. **Search your context for the literal `MEMORY-INDEX-END`.** If it is not there the import is broken again: `Read` the file immediately, say so, and suspect the `~` in the import path. Nothing else will notice.

**2 · Build, then check the servers.** `portal/public/` is gitignored and holds zero tracked files, and `.claude/launch.json`'s `portal-harness` does `os.chdir('portal/public')` before it binds — in a fresh clone or a worktree the directory does not exist, the server dies, and every instrument below fails against a dead port.

```bash
node -e "require('./scripts/buildPortal').build()"
lsof -nP -iTCP:8900 -iTCP:8901 -iTCP:8787 -sTCP:LISTEN
```

If all three answer you need no `preview_start`. If they do not: `preview_start {name:"repo-static"}` (:8900) and `preview_start {name:"portal-harness"}` (:8901) as **MCP calls, not shell**. ⚠️ **Any failure whose text names an already-bound port is benign** — it means a peer session left them up.

**3 · Read §2 before running a single instrument.** It changes what the numbers mean.

**4 · Create the three artifacts NOW, not at the end** — `local/locate-review.md`, `local/review-triage.md`, `local/difference-ledger-review.md`. At hour six writing is the first thing cut, so these are preconditions rather than deliverables. Part 4 produced one of three under a more explicit instruction than this one. §L ③ consumes them and cannot close without them.

```bash
# ⚠️ HISTORICAL — the unseeded forms. Three of these exit 2 now. The seeded forms are:
npm run portal:status
npm run portal:audit -- --realm review --all --mk-query demo=1
npm run portal:audit -- --realm review --triggers --mk-query demo=1
npm run portal:inventory -- --realm review --mk-query demo=1
node scripts/portalDiff.mjs --realm review --portal harness --mk-query demo=1
npm run portal:converge -- --realm review --mk-query demo=1
```

⚠️ **Run `portal:converge` as the named tool.** Reading `portal:audit`'s ① CASCADE section instead and calling ① satisfied was caught on Broadcast, with `portal:status` printing `converge · never` in the same tree.

## 🔴 §1 — "ZERO HANDLERS, NOTHING TO OPEN" WAS A BLIND METRIC, NOT A FACT

`portalStatus` counted only `/addEventListener|onclick=/`. `review.html` has **zero** of those and wires **7 handlers by property assignment** (6 `.onclick =`, 1 `.oninput =`). The tool was fixed 2026-09-02 (`scripts/portalStatus.mjs:27-30`, an explicit event-name list) and now reports **18KB · 7h**.

**Review is the commit screen** — the only place staged work becomes real. `--triggers` gives **mk 11 · pt 15**. ⚠️ **But do not read the portal-only count as eight surfaces.** Four of them are `Discard <name>`, which is **one control repeated per staged row**, and `…2283` is the shell account chip, already adjudicated as a cited privacy row on three realms (`docs/reference/portal-decision-ledger.md`). **Query the ledger before investigating any one-sided row** — the first version of this file did not do that to its own evidence.

## 🔴 §1.5 — THE PRIMARY OBJECTIVE IS THAT REVIEW DEMONSTRABLY WORKS, NOT THAT IT MATCHES

**Scope set by Harkirat, 2026-09-02 10:46 EDT**, on reading that the design page is a stub: *"seems like review needs a proper overhaul to actually be functional… why not just fix it as part of next session's work so it's actually a working review realm?"*

⚠️ **First, the correction that prompted it, because the framing that produced the question was wrong.** The PORTAL's Review is not fake. `review.js:115` calls `/api/review`; `:154` and `:173` call `/api/changeset/<id>/discard` and `/commit`; those routes live in `portal/api/review.js` and are registered in `portal/server.js`; and `core/changeset.js`'s `commitSet` opens a real `mongoose.startSession()`, runs `session.withTransaction()`, and writes its audit row through `recordChangeIn`. It is real code against a real database. **The MOCKUP is the stub, deliberately** — §2.

🔴 **BUT `portal:status`'s receipt board reads `review … realwalk · never`.** The only screen where staged work becomes real, carrying the highest-consequence action in the portal, **has never been exercised by any instrument on either side.** Not one commit, not one discard, not one gate refusal. Part 0 confirmed `/api/review` returns 200 once, in August, and nothing has driven it since.

**So Part 6a's first deliverable is a functional pass, and the pixel work is second:**
1. Stage something real from another realm — Season's identity editor or an Armory edit — and confirm it appears on Review with the right tier, diff and gate.
2. **Commit it, and verify the database actually changed AND a `ChangeLog` row exists.** `commitSet` is transactional; prove the transaction lands and the audit is written inside it.
3. Discard another, and prove nothing moved.
4. Drive a REFUSAL: a tier-3 op with no export, which `gateCommit` must block — and check the screen says why.
5. Only then the conformance comparison in §2 and §3.

⚠️ **This is not scope creep, it is the missing evidence.** A realm can be pixel-perfect against its design and still not commit; Review is the one realm where that distinction is the whole point.

## 🔴 §2 — THE TWO SIDES CANNOT BE COMPARED AT REST, AND NO INSTRUMENT CAN FIX THAT

`review.html:115` reads `if (!list.length) { renderEmpty(); renderFoot(); return; }`, and the staged-ops store is empty on every fresh load. The populated board is **not missing** — it is fully drawn between that guard and `renderEmpty()` at `:235`, seeded from `F.sampleOps` — it is behind `:245`'s `<button class="chip go" id="seed" data-demo-only>Load a sample changeset</button>`. The harness populates four changesets. **So every resting number in §3 measures an empty page against a populated one.**

🔴 **AND NO EXISTING TOOL REACHES THE POPULATED MOCKUP. Verify this before spending a turn on it.** The mockup's store is `sessionStorage` (`assets/shell.js:74-75`), and `portalDiff.mjs:294` / `:433` and `portalAudit.mjs:225` each call `sessionStorage.clear()` on **every** load — deliberately, added 2026-08-30, naming the staged-ops tray in their own comments. `portalAudit.mjs:280` **throws** on an `--open` whose control is missing on one side, which the seed button is.

**So your first decision is a fork, and it is Harkirat's, not the instruments'.** Either (a) the mockup renders `F.sampleOps` behind a query flag the tools can pass, parallel to `?fresh=1`; or (b) `portalDiff`/`portalAudit` gain a `--seed` that repopulates after the storage clear and before the capture; or (c) Review closes on the **empty** state both sides and the populated board is filed as a surface no instrument reaches. **(c) is the honest default and the weakest close** — the only screen that commits would never be compared in the state where it commits. **Put the fork in a pop-up before the first audit.** Do not choose it by drifting into whichever the tools happen to permit.

**Settled, so you do not reopen it:** the seed button and its note **must not ship**. `review.html:253-258` says so as a comment addressed to you — *"NEITHER THIS BUTTON NOR ITS NOTE MAY SHIP… The wiring session removes the button and this comment together, or gates it behind ?demo=1 with no visible copy."*

⚠️ **THE FIRST VERSION OF THIS SECTION QUOTED A SENTENCE THAT DOES NOT EXIST.** It cited `review.html:237,240-241` for *"a mockup that invented staged work would teach the wrong thing about staging"*. `rg 'invented staged work'` over that file returns **nothing**: `:237` is `viewReview.innerHTML = ` and `:240-241` is unrelated copy. The string was the UX-copy audit's own prose and the line numbers were its stale citation, passed through unread. **Cite `:247-250`.** The audit is `local/handoff/2026-08-25-portal-ux-copy-audit.md` §F4 — gitignored, open it by path, and check its citations rather than inheriting them.

**Consequence for §L ③:** `button.chip.go#seed` will report ONLY-IN-MOCKUP on every `portalInventory` run for the life of this project. That is a **permanent CITED row, not a missing affordance** — write it into the decision ledger with today's date. ③ closes on adjudication, never on emptiness.

⚠️ **Part 5 learned the general form of this after the fact**: its harness stub folded a five-row sample and called it a week's distribution, putting the realm's main defect out of reach of every instrument. The lesson is not "check the fixtures" — it is that **an instrument comparing two differently-populated pages returns well-formed numbers and no error.** §3's 4.7% is one of them.

## §3 — THE RESTING NUMBERS, AND TWO WAYS TO MISREAD THEM

🔴 **SUPERSEDED 2026-09-02 23:46 EDT — EVERY FIGURE IN THIS SECTION IS PRE-SEED AND MUST NOT BE QUOTED AS CURRENT.** Part 6a ran: the mockup now seeds behind `?demo=1` and the instruments carry `--mk-query`, so the comparison is of two populated boards. **Current: 0.5% in 12 regions, ① CASCADE clean, ② 10 / ③ 2 / ④ 2, converge 12 mismatches of 28 design nodes, and every region adjudicated into four cited classes with none open.** The live record is §L row 6a of `docs/superpowers/plans/2026-08-27-portal-conformance.md` and `docs/reference/portal-decision-ledger.md`'s Review section. The table below is kept as the BEFORE half of that comparison — it is what an empty-versus-populated reading looks like, which is the section's actual lesson. ⚠️ **`realwalk · never` at §1.5 is also superseded**: `npm run portal:reviewwalk` exists and passes every assertion (the walk prints and pins its own count — quoting one here went stale within a day), recording a `commitwalk` receipt.

Measured 2026-09-02, BEFORE the seed. ⚠️ **Read §2 first: these compare an empty mockup to a populated portal.**

| Reading | Value | ⚠️ |
|---|---|---|
| `npm run portal:converge -- --realm review` | **40 mismatches of 25 design nodes** · WORDS 5 · STYLE 1 · mk 25 nodes (530px) · pt 40 (740px) | 🔴 **40 > 25 is NOT a ratio and not 160% wrong.** EXTRA and ABSENT rows count alongside paired ones — read it as "25 design nodes, 40 findings". ⚠️ **AND `pt 40` IS NOT A NODE COUNT** — it is the mismatch figure reprinted in the node column. `portal:audit` reads the same page as **pt 94 / 760px** against **mk 28 / 531px**. The two tools count different things and neither figure is comparable to the other |
| `npm run portal:inventory -- --realm review` | mk **32** signatures · pt **55** · ONLY-IN-MOCKUP 7 · ONLY-IN-PORTAL **30** | The portal has nearly double the elements — because it is populated and the mockup is not |
| `node scripts/portalDiff.mjs --realm review --portal harness` | **4.7%, 15 regions** · mk 888px · pt 984px | 🔴 **4.7% reads as "nearly done" and is the tell.** §0.7d retired the percentage as a target; it is reported, never driven |
| `npm run portal:audit -- --realm review --all` | ② SHAPE 60 · ③ WORDS 2 · ④ STYLE 8 · ⑤ RULES 2011/41/40 | ⑤ RULES is identical on every realm — cross-realm, not this realm's work |
| `wc -c` / `awk 'END{print NR}'` / `rg -o 'on[A-Z][a-zA-Z]*='` | `portal/ui/review.js` **19.5KB · 284 lines · 12 onX sites** | ⚠️ **Not comparable to the mockup's `7h`** — that is `portalStatus`'s regex over HTML, a different metric. The first version of this file said 283 lines |
| Views | 🔴 **NONE.** `review.html` has zero `data-view`; `review.js` passes no `viewOptions` | `--view` does not apply and Part 5's five-view rhythm does not transfer |

## §4 — WHAT PART 5 FIXED THAT TOUCHES THIS REALM

- **`review.js:148`'s blocker count** carried `tone:'bad'`, which styles nothing in either sheet — the number that says why you cannot commit rendered in ordinary ink. Fixed 2026-09-02; `portalUi.test.js` now conserves every literal tone against the stylesheet, ternaries included.
- **`Manifest` gained `filterSignal`**, the no-match empty state names the action and the total, and rows are keyboard-reachable wherever a realm passes `onRowClick`.

## §5 — THE CONTRACT, RESTATED BECAUSE IT DOES NOT SURVIVE A SESSION BOUNDARY

- 🔴 **SUPERSEDED 2026-09-02 22:28 EDT — THE OPPOSITE INSTRUCTION IS NOW CORRECT.** `feat/analytics-portal-conformance` **merged as #180** (2026-09-02 13:29 EDT) and the context-layer work **merged as #181** (2026-09-02 22:06 EDT). `v3-pre-release` is clean at **`3.74.0-pre`** and carries both. **So branch fresh off `v3-pre-release`** — there is nothing left to orphan. ⚠️ This bullet has now gone stale twice in one day in the same way (it read *"22+ commits … unpushed"*, then *"31 commits … NOT merged"*), which is the point it keeps making about itself: **re-derive branch state with `git log --oneline v3-pre-release..HEAD` and `gh pr view`, never from this line.** ⚠️ This line read *"22+ commits … unpushed"* until the push made it false; a branch-state sentence goes stale the moment the branch moves, so re-derive it with `git log --oneline v3-pre-release..HEAD` rather than trusting it. §L row 5 has all seven conditions: ④ is claimed at `a8c6f6e`, ② is 34% enumerated rather than closed, ⑥ ran, ⑦ is Harkirat's.
- ⛔ **Never push, open a PR, merge, or ask about any of them.** Approval is restated at the moment of the action.
- ⚠️ **Scoped tests only until a push is approved** — Harkirat, 2026-09-01 19:04, and the push has not happened. Run the gates that cover what you touched; the full suite waits. **§L ④ is a CLAIM: if the full suite did not run, do not claim it at all.**
- 🔇 **Silent mode** per `MEMORY.md` — no prose between the first call and the final summary, one structured summary, tables not prose for 4+ items, `sequentialthinking` before any audit or review.
- **N edits are ONE `python3` heredoc** with an `assert` per replacement — and **end it with `&&`**, not a newline, or a heredoc that dies at parse time writes nothing while every gate chained behind it certifies the pre-edit files green.
- 🟢 Commit on the branch freely.

## §6 — POINTERS, NOT PARAPHRASES

- **The method, the five audit sections, the batching contract** — `CLAUDE.md`'s `portal/` row.
- **The seven close conditions and the status vocabulary** — `docs/superpowers/plans/2026-08-27-portal-conformance.md` §L. ⚠️ **① and ② close on the ENUMERATION, never a percentage.**
- **Settled decisions, before re-deriving any of them** — `docs/reference/portal-decision-ledger.md`, via `ctx_search` rather than `rg`.
- **In-file traps** — `.claude/rules/portal-editing.md`. It fires on a Read and the batching contract means you may never trigger one; open it deliberately.
- **Part 5's own record** — `local/difference-ledger-analytics.md`, `local/locate-analytics.md`, `local/analytics-triage.md`.

## §7 — THE TWO THINGS THAT WILL COST YOU TOO

**1 · A gate proven against a fixture you designed is not proven.** Part 5's tone check shipped green and was **vacuous for the defect that motivated it** — every tone that can be wrong is a ternary, and the scanner matched only bare literals. Caught only by reintroducing the real shipped bug. **Feed every new gate the actual broken input.**

**2 · Naming a gap is not closing it.** Part 5 reported "done" twice with its own owed items listed in the same message. Use the list to work, not to license the claim.

## Closing

⚠️ **Part 6b HOME has no prompt and cannot share this one.** Composition against COMPANION is not correctness against a mockup that declines to populate itself.

- mockup — `http://localhost:8900/docs/superpowers/mockups/2026-08-23-portal-interactive/review.html`
- portal — `http://localhost:8901/harness.html?fresh=1&b=<any number>#/review` — the `b=` cache-buster is not optional
- real — `http://localhost:8787/#/review`

**Never write "done" — Harkirat decides that.**
