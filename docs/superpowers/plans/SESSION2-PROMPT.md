---
kind: plan
status: live
---

# Session 2 — the rest of portal conformance. Paste the opener in.

> 🔴 **IF YOU WERE HANDED A SHORT OPENER, IT IS NOT A SUMMARY OF THIS FILE.** In here and not there: why the loudest rule from Part 6b is BACKWARDS in the phase you are about to start · which instrument claim is a string literal · the two figures that lie identically on both sides · and why sizing this session on Home under-counts it by roughly an order of magnitude.
>
> **The falsifiable version:** if your working belief is *"six realms are conformed, so this is a short cleanup"* — you are holding the framing this document exists to overturn. **Nothing has ever checked the portal as a SYSTEM**, seven of ~15 overlays have been opened, and four realms owe §L conditions.

*Written 2026-09-03 23:59 EDT at the end of Part 6b, from that Part's own measurements and its two-agent §L ⑥ audit.*

## 🔴 §0 — FIRST ACTIONS, IN THIS ORDER

**1 · Verify your own memory loaded.** Search your context for the literal `MEMORY-INDEX-END`. It is **visible text** now — it was an HTML comment until 2026-09-03 20:13 EDT, which made the test unpassable and produced three sessions of confident wrong diagnosis. If it is missing, `Read` the file and check `hasClaudeMdExternalIncludesApproved` in `~/.claude.json` before theorising.

**2 · Build, then check the servers.** `portal/public/` is gitignored, so a fresh clone has no harness.

```bash
node -e "require('./scripts/buildPortal').build()"
lsof -nP -iTCP:8900 -iTCP:8901 -iTCP:8787 -sTCP:LISTEN
```

Missing ones: `preview_start {name:"repo-static"}` (:8900) and `{name:"portal-harness"}` (:8901) as **MCP calls, not shell**.

**3 · `npm run portal:sweep`** — both instruments, all seven realms, one call. It reproduces every recorded floor; anything that does not match is a regression from a shared edit.

**4 · Read §1 before opening a single overlay.** It inverts the rule you are most likely to be carrying.

## 🔴 §1 — THE LOUDEST RULE FROM PART 6b IS BACKWARDS HERE

Part 6b made this the loudest sentence in three carriers: *"a symmetric ONLY-IN-MOCKUP + ONLY-IN-PORTAL pair is a PAIRING ARTIFACT — both sides have it."* On a **resting page** that is right and it saved a realm.

**In the overlay tier it is backwards.** `--triggers` marks genuinely one-sided controls, and §0.6c says the listing is a **FLOOR on what exists, never a ceiling** — it filters out data rows. `+ Grant access` versus `+ Grant access N` really is two spellings of one control. `dior` versus `…2283` really is one-sided. **A session carrying the resting rule across will dismiss real findings and close the tier having opened nothing.**

⚠️ **And `--open` decides "it opened" by NODE COUNT.** An affordance that **scrolls** rather than mounting reports *"clicking … opened nothing"*, which reads as a dead button and is not — Access's `+ Grant access` is `setView` plus `scrollToGrant` against a design that opens a drawer. **A refusal is not evidence of a defect.** When `--open` refuses, reach for **`--open-sel "<css>"`**, and a **selector LIST** (`.mh-new, #grantBtn`) reaches two sides that share no class.

## §2 — WHAT IS ACTUALLY LEFT

| Owed | Realms |
|---|---|
| **§L ⑥** — the reader test / two-agent audit. ⚠️ **NOT phase ⑥, which is UX-copy** — the plan numbers two different things ⑥ | Broadcast · Access · Analytics · **Review** |
| **§L ⑤** — the real-server pass | Access · Analytics · **Home** (`[P2 · S]`: it now fetches seven endpoints, two expensive, never seen against Mongo) |
| **The overlay tier** — 7 of ~15 measured | armory `Export…` ②80 · **armory create ②156 ④146** · broadcast ×2 ②27 · access `Export…` ②61 **④304** · analytics `Export…` **②137** · season's three. Home's tier is **EMPTY** |
| **Home's own tail** | 375×812 · tab order after the block reorder · the delegated-admin under-report · the tracked 27-region enumeration exists, use it |
| **Re-apply the stood-down redesigns** | Gated on all six matching. The count is NOT 13 any more — read the ledger's per-realm sections |

## 🔴 §3 — THE THING BIGGER THAN THE OVERLAY TIER

**Home's nine defects were every one a DERIVATION defect and not one was styling.** Home is the only realm that reads five others, and it is the first surface where that could show. **The portal has been verified surface by surface and never as a system.**

Two live instances, both of which pass every gate because the design renders the same string:
- **Armory repair count: 13 (design) · 60 (Armory's own masthead, MP-scoped) · 66 (Home, both modes).** One question, three answers.
- **`23 of 496`** — error alerts over **7 days** against commands over **24 hours**, different collections, rendered as a ratio. Fixed on Home; the class is not.

The gate is specified in the plan with its falsifier first. ⚠️ **It is filed `[P1]` from a population of ONE consumer while Home's ⑤ is `[P2]` and measurable today** — the plan's hedge (*"build it only if the overlay tier leaves room"*) is the operative instruction, and that argument is written into the filing itself.

## §4 — FIVE TRAPS THAT EACH COST A ROUND

1. 🔴 **A backgrounded `npm test > log 2>&1; echo "exit=$?"; tail log` EXITS 0 WHATEVER THE SUITE DID.** The harness reports the WRAPPER. **Read the recorded `exit=` line out of the task's output file.** A commit shipped claiming a green suite that had exited 1.
2. 🔴 **Pipeline order:** `reflow-comments --write` → `portal:bust` → build → `portalGeometry --realm <r> --write` **LAST** → commit. Reversed, each undoes the next.
3. **`reflow-comments` scans TRACKED files**, so a new file is invisible until the commit that adds it — then fails immediately after. Re-run the reflows after any commit that ADDS files.
4. **It also merges a `# shellcheck disable` (or `eslint-disable`, `@ts-expect-error`) into prose and destroys it, on every run.** Need no directive rather than defending one.
5. **Home and Review REFUSE without `--mk-query demo=1`** (`scripts/lib/portalSeedRealms.mjs` is the one list). Exit 2 is the tool working.

## §5 — WHAT THE INSTRUMENTS DO NOT TELL YOU

- **`portalDiff` prints the largest 14 regions.** It used to assert *"Every region is CLOSED or CITED"* unconditionally after truncating — a string literal; it has never read the ledger. It states what it withheld now. **`--json` for all of them.**
- **A re-recorded geometry fixture makes its own `--check` vacuous for that realm.** Home's moved four times in Part 6b, so its green says nothing; the six untouched realms are the load-bearing half. **`access` has no fixture at all.**
- **`portalGeometry` reports a `sizeIssues` COUNT and cannot name them** — Home's went 33 → 35 unexamined. Filed.
- **The audit's inline `⚠ ledger may cover this` hint was WRONG 4 of 4 times on Home.** It says so now. Verify with `ctx_search`, never `rg` — measured 5-of-5 against 1-of-6.
- **Do not size this session on Home.** §0.6a: Home's and Review's mockups are static compositions **a tenth** of Season's. Home closed at ② 8; access's export overlay is ④ 304.

## §6 — THE CONTRACT

- **Branch `feat/home-portal-conformance`**, 18 commits, **unpushed**, `3.76.0-pre`, tree clean, `npm test` 0 at `27f4e7d9`.
- ⛔ **Never push, open a PR, merge, or tag** — approval is restated at the moment of the action, naming who · to what · when.
- 🔴 **The merge owes a `(#PR)` on the v3.76.0 entry and the v3.75.0 squash hash backfill.** `docs-audit` passes today because there is no placeholder to catch; **nothing will remind you.**
- **`npm run handoff` at every phase end.** Scoped tests until a push is approved.
- 🔇 **Silent mode.** No prose between the first call and the final summary; forks go in a popup, never prose; `sequentialthinking` before any audit or review — **and a real pass is 15+ thoughts, not 3.**
- **N edits are ONE `python3` heredoc**, `assert` per replacement, write inside the loop, `&&` not a newline at the end.
- 🔴 **Never write "done" — Harkirat decides that.** §L's `☑` is his mark; Part 6b briefly claimed it and the rule sits four lines below the row.

## §7 — POINTERS

- **The route:** `local/handoff/2026-09-03-portal-session2.md` — ⚠️ it is a ROUTE and was once read as an inventory.
- **The inventory:** the plan's §L, and `docs/db-deferred-list.md`.
- **Settled decisions:** `docs/reference/portal-decision-ledger.md`, via `ctx_search`.
- **In-file traps:** `.claude/rules/portal-editing.md` — six ordering traps and five in-file ones.
- mockup `http://localhost:8900/docs/superpowers/mockups/2026-08-23-portal-interactive/<realm>.html` (**`index.html` for home**) · portal `http://localhost:8901/harness.html?fresh=1&b=<n>#/<realm>` · real `http://localhost:8787/#/<realm>`
