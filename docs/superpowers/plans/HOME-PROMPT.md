---
kind: plan
status: live
---

# Part 6b — Home. Paste this in.

> 🔴 **IF YOU WERE HANDED A SHORT OPENER, IT IS NOT A SUMMARY OF THIS FILE.** In here and not there: why Home's 6.3% is the one realm figure that UNDERSTATES its gap, the two defining components of the design that the portal does not render at all, the confound that reaches Home through the shell and cannot be seeded away, and the reason the audit loop is the wrong first move here when it was the right one on all five previous realms.
>
> **The falsifiable version:** if your working belief is *"6.3% in 31 regions, run the audit loop, fix ① then batch ②③④"* — the procedure that closed Season, Armory, Broadcast, Access and Analytics — **you are holding the framing this document exists to overturn.** Home is not misaligned. Two of its panels are unbuilt.

*Written 2026-09-03 16:52 EDT, from the first measurements ever taken of this realm. Every number below names the command that produced it.*

## 🔴 §0 — FIRST ACTIONS, IN THIS ORDER

**1 · Verify your own memory loaded.** `MEMORY.md` is larger than the harness's 25,000-byte loader cap, and the project `CLAUDE.md` `@`-imports it to route around that. **Search your context for the literal `MEMORY-INDEX-END`.** It should be there — `hasClaudeMdExternalIncludesApproved` was the cause of three failed attempts and was granted 2026-09-03. If it is missing, the import broke again: `Read` the file, say so, and check that flag in `~/.claude.json` before theorising.

**2 · Build, then check the servers.** `portal/public/` is gitignored and holds zero tracked files, so in a fresh clone the harness server dies on `os.chdir` before it binds.

```bash
node -e "require('./scripts/buildPortal').build()"
lsof -nP -iTCP:8900 -iTCP:8901 -iTCP:8787 -sTCP:LISTEN
```

If all three answer you need no `preview_start`. Otherwise `preview_start {name:"repo-static"}` (:8900) and `{name:"portal-harness"}` (:8901) as **MCP calls, not shell**. A failure naming an already-bound port is benign — a peer session left them up.

**3 · Read §1 before running a single instrument.** It changes what you should do first.

**4 · Create the three artifacts NOW** — `local/locate-home.md`, `local/home-triage.md`, `local/difference-ledger-home.md`. At hour six writing is the first thing cut, so these are preconditions rather than deliverables. Part 4 produced one of three under a more explicit instruction than this one.

## 🔴 §1 — HOME IS NOT MISALIGNED. TWO OF ITS PANELS ARE UNBUILT

Every previous realm's gap was *the same components, drawn differently*. Home's is not, and the instruments say so plainly once you read ② rather than the percentage.

**`npm run portal:audit -- --realm home --all` reports these ONLY IN MOCKUP:**

| Missing from the portal | What it is |
|---|---|
| `span.att-i` ×5 · `span.att-b` ×5 · `span.att-x` ×5 · `span.att-sev` · `span.att-go` ×5 · `a.att-row.s-repair` | **The entire attention list** — the design's answer to the question the page asks. Five numbered severity rows, each naming a destination: *"7 permissions held by exactly one person → Access · the matrix"* |
| `section.hclock` · `div.hc-face.sclock` · `span.sc-u` · `span.sc-sep` | **The season countdown clock** — `17days:23hrs:59min:59sec` |

The portal renders neither. In their place, region 1 of the pixel diff — **1040×912, essentially the whole fold** — pairs the design's `a.att-row.s-repair` against the portal's `span.n "Ground War MP Mode"`. Different content, not different styling.

🔴 **THIS IS WHY THE AUDIT LOOP IS THE WRONG FIRST MOVE.** ① CASCADE will hand you `div.masthead height 129 → 116`, and fixing a 13px masthead offset on a page missing its primary panel is polishing a frame around an empty wall. **Compose first against `COMPANION.md` §5.7 (`### 5.7 Home (index.html) — answers: what needs you`), then run the loop.** COMPANION also carries §5.9r.1, §5.9z.5 and §16.6 on Home — read all four; §16.6 in particular records that *the cards were a second authority and the rail was the missing half*, which is a design decision you must not re-derive.

⚠️ **The plan already told you this and it is easy to read past:** §L row 6b says Home's failure mode is **composition against COMPANION**, not conformance against the mockup. That sentence is the whole Part, and until now nobody had the measurements to see what it meant.

## §2 — THE NUMBERS, AND THREE WAYS TO MISREAD THEM

Measured 2026-09-03 16:52 EDT, the first run of any instrument on this realm — `portal:status` read `· never` in all six columns.

| Reading | Value | ⚠️ |
|---|---|---|
| `node scripts/portalDiff.mjs --realm home --portal harness` | **6.3% · 31 regions** · mk **1165px** · pt **1073px** | 🔴 **The portal is 92px SHORTER, and it is the only realm where that direction holds.** Everywhere else the portal was taller. A shorter page with a higher percentage means missing content, not extra content — and the diff compares over the SHORTER of the two, so **the 6.3% cannot see what is missing below 1073px.** The figure understates the gap |
| `npm run portal:audit -- --realm home --all` | ① `div.masthead` h 129→116 · ② **64** · ③ 7 · ④ **43** | ② at 64 is the second-highest first reading of any realm. Most of it is the attention list and the clock, i.e. ONE decision each, not 64 |
| `npm run portal:converge -- --realm home` | **75 mismatches of 60 design nodes** · mk 60 (994px) · pt 64 (902px) | 75 > 60 is not a ratio — EXTRA and ABSENT rows count beside paired ones |
| `npm run portal:inventory -- --realm home` | mk-only **10** · pt-only **14** · different words **14** · count **10** · style **15** | The portal has FOURTEEN elements the design does not — Home is portal-ahead in places as well as behind |
| Views | 🔴 **NONE** — single view | `--view` does not apply. Season's five-view rhythm does not transfer |

**The masthead stats disagree on their SET, not their values.** mk reads `5 NEEDS YOU · 2 LIVE NOW · 0 S…`; pt reads `3 NEEDS YOU · 17 DAYS LEFT · 2…`. `span.k` is `live now` against `days left`. Deciding which stats Home shows is a composition decision for COMPANION, not a number to reconcile.

**And the copy differs in kind.** `b ×5`: the design emphasises a bare number — `17`, `23`, `59` — where the portal writes a whole sentence: *"2 items outlive the battle pass"*, *"66 builds have something wrong with them"*. `span.hot.lw` ×5: `2 days left` against `ends in 2d`. One of these vocabularies is right and the UX-copy audit has an opinion; `local/handoff/2026-08-25-portal-ux-copy-audit.md` is gitignored — open it by path.

## 🔴 §3 — THE CONFOUND THAT REACHES HOME THROUGH THE SHELL, AND CANNOT BE SEEDED AWAY

Region 2 of the diff: mk `header "… ⌘K dior"` against pt `header "… ⌘K 4 staged · review …2283"`.

The portal harness carries **four staged changesets**; the mockup's staged store is `sessionStorage` and every instrument clears it on load. So the shell's staged crumb renders on one side and not the other — **the same empty-vs-populated confound that made every resting figure for Review meaningless**, arriving on a realm whose own content has nothing to do with staging.

🔴 **AND `?demo=1` DOES NOT HELP YOU HERE.** That flag seeds `review.html` only — `loadSample()` lives in that file. `index.html` has no equivalent, so **Home's mockup cannot be given a staged set**, and the crumb difference is structural until someone decides otherwise. Your options are to cite it, or to lift the seed into `shell.js` so any page can carry it. **The second is a change to the design package that affects every realm — do not make it without raising it.**

⚠️ The account chip (`dior` vs `…2283`) inside that same region is already adjudicated as a cited privacy row on three realms. Check `docs/reference/portal-decision-ledger.md` before investigating any one-sided row — **`ctx_search`, not `rg`**: measured 2026-08-31, `rg` found 1 of 6 real finding selectors and `ctx_search` found 5 of 5, because a ledger row is prose and a finding is a literal.

## §4 — WHAT PART 6a LEFT YOU

- **`portal:diff`, `portal:audit`, `portal:converge`, `portal:inventory` and `portal:probe` REFUSE on `--realm review`** without `--mk-query demo=1`. Home is unaffected, but if you touch Review, exit 2 is the tool working.
- **`npm run portal:reviewwalk`** exists — 37 assertions driving the real commit path. Home has no equivalent and needs none; it commits nothing.
- **The decision ledger now carries Review's twelve regions with their classes and its one measured overlay**, so a realm's close is performable from tracked files. Home should end the same way — the enumeration in the tracked ledger, not only in gitignored `local/`.
- ⚠️ **Season needs a re-measure** (filed `[P1 · S]`): its harness fixture had typed a tier 3 that `core/ops` contradicts. The geometry half is re-recorded; audit/diff/inventory/converge are not.

## §5 — THE CONTRACT, RESTATED BECAUSE IT DOES NOT SURVIVE A SESSION BOUNDARY

- **Branch off `v3-pre-release`** (at `95923c9e`, `3.75.0-pre`). Part 6a merged as #182.
- ⚠️ **`docs/ci-flake-filing` is an UNPUSHED local branch** carrying a P1 filing and this file. Fold it into your branch or push it with your PR — do not leave it stranded.
- 🔴 **Expect CI to be RED and it is not your change.** `portal:states` fails on the runner on Season's *identity · expanded editor* while passing twice locally; it hit `v3-pre-release` after #181 too. Filed `[P1 · M]`. #182 was merged past it with the admin override, on Harkirat's explicit decision.
- ⛔ **Never push, open a PR, merge, or ask about any of them.** Approval is restated at the moment of the action, naming who · to what · when.
- ⚠️ **Scoped tests only until a push is approved.** Run the gates covering what you touched; the full suite waits. **`npm run handoff` at every phase end** — it caught a red gate that had already been committed, and a stale carrier, in a session that thought it was finished.
- 🔇 **Silent mode.** No prose between the first call and the final summary; one structured summary; tables not prose for 4+ items; `sequentialthinking` before any audit or review.
- **N edits are ONE `python3` heredoc** with an `assert` per replacement — and **assert the EFFECT, not just the anchor** (`after != before`, then re-read from disk). An anchor-only assert silently dropped five separate filings on 2026-09-02, each printing a success line. End the heredoc with `&&`, never a newline.
- 🟢 Commit on the branch freely.

## §6 — POINTERS, NOT PARAPHRASES

- **The method, the five audit sections, the batching contract** — `CLAUDE.md`'s `portal/` row.
- **The seven close conditions** — `docs/superpowers/plans/2026-08-27-portal-conformance.md` §L. ⚠️ ① and ② close on the ENUMERATION, never a percentage.
- **Home's own design** — `COMPANION.md` §5.7, §5.9r.1, §5.9z.5, §16.6.
- **Settled decisions** — `docs/reference/portal-decision-ledger.md`, via `ctx_search`.
- **In-file traps** — `.claude/rules/portal-editing.md`, whose globs now include the mockup package. It fires on a Read and the batching contract means you may never trigger one; open it deliberately.

## §7 — THE TWO THINGS THAT WILL COST YOU

**1 · A percentage is not a size.** Home's 6.3% is measured over the shorter page, so everything the portal fails to render below 1073px is invisible to it. **Grade on the enumeration and on what ② SHAPE says is absent** — never on the number going down.

**2 · An authoritative source beats a clever one.** Three times in the previous session a confident cause was published built on a value nobody had printed — once by reading a decompiled binary and inventing the value of the flag it tests, when the published docs settled it in one link. Reading the binary FELT like more rigour and was less. **Before writing "X because Y", ask whether you printed Y.**

## Closing

**Never write "done" — Harkirat decides that.**

- mockup — `http://localhost:8900/docs/superpowers/mockups/2026-08-23-portal-interactive/index.html` ⚠️ **`index.html`, not `home.html`** — `portalDiff`'s `MOCKUP_PAGE` map special-cases it and so must every hand-typed URL
- portal — `http://localhost:8901/harness.html?fresh=1&b=<any number>#/home` — the `b=` cache-buster is not optional
- real — `http://localhost:8787/#/home`
