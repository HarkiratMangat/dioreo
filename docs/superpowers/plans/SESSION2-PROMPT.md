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
| **§L ⑥** — the reader test / two-agent audit. ⚠️ **NOT phase ⑥, which is UX-copy** — the plan numbers two different things ⑥ | Broadcast · Access · **Review**. ⚠️ **Analytics was listed here and is NOT owed** — §L row 5's body records ⑥ run 2026-09-02 with two agents; this table copied that row's stale STATUS line. Corrected 2026-09-04 12:23 EDT |
| **§L ⑤** — the real-server pass | **NONE — **six realms walk `portal:realwalk` clean and Review passes its own `portal:reviewwalk` 37/37** (⚠️ **two instruments, named — `portal:realwalk --realm review` exits 1 BY DESIGN because Review has no views**; an earlier version of this sentence said "all seven realms walk clean" and conflated them, which is the name-the-instrument-beside-the-number rule broken by the session that was enforcing it, 2026-09-04 15:58 EDT), 2026-09-04 12:23 EDT**, against a freshly restarted server. ⚠️ **Access and Analytics were never owed**; rows 4 and 5 both record their walks passing and this table copied two stale status lines. **Home was owed and is now run** — and the blocker was the INSTRUMENT, whose past-the-door probe matched none of Home's row shapes |
| **The overlay tier** ⚠️ **THE FIGURES BELOW ARE PAGE-SIZED, NOT OVERLAY-SIZED — corrected 2026-09-04 14:16 EDT.** `--open` re-walks the WHOLE page, so `access ④304` is that realm's resting ④275 plus the drawer's **29**. True contributions are ② 9 · ③ 17–30 · ④ 20–42, and armory's ② 156 contributes **75 rows that are all verified pairing artifacts**. Every root cause is cited, filed or verified — see the plan's overlay section. ⚠️ **"7 of ~15" is an ACTIVITY COUNT over a denominator §0.6c calls a FLOOR**, which §0.5a R4 forbids as a close condition | armory `Export…` ②80 · **armory create ②156 ④146** · broadcast ×2 ②27 · access `Export…` ②61 **④304** · analytics `Export…` **②137** · season's three. Home's tier is **EMPTY** |
| **Home's own tail** | 375×812 · tab order after the block reorder · the delegated-admin under-report · the tracked 27-region enumeration exists, use it |
| **Re-apply the stood-down redesigns** | Gated on all six matching. The count is NOT 13 any more — read the ledger's per-realm sections |

## 🔴 §3 — THE THING BIGGER THAN THE OVERLAY TIER

**Home's nine defects were every one a DERIVATION defect and not one was styling.** Home is the only realm that reads five others, and it is the first surface where that could show. **The portal has been verified surface by surface and never as a system.**

Two live instances, both of which pass every gate because the design renders the same string:
- **Armory repair count: 13 (design) · 60 (Armory's own masthead, MP-scoped) · 66 (Home, both modes).** One question, three answers.
- **`23 of 496`** — error alerts over **7 days** against commands over **24 hours**, different collections, rendered as a ratio. Fixed on Home; the class is not.

The gate is specified in the plan with its falsifier first. ⚠️ **It is filed `[P1]` from a population of ONE consumer while Home's ⑤ is `[P2]` and measurable today** — the plan's hedge (*"build it only if the overlay tier leaves room"*) is the operative instruction, and that argument is written into the filing itself.

## §4 — THE ORDERING TRAPS THAT EACH COST A ROUND

⚠️ **THIS HEADING SAID "FIVE TRAPS" UNTIL 2026-09-04 20:02 EDT OVER A LIST `.claude/rules/portal-editing.md` NUMBERS 0–6 — SEVEN.** A lossy duplicate of a rule file whose own header forbids duplication, and it had already drifted. **The rule file is the home; what follows is a pointer plus the two that are about ORDER rather than about editing.** ⚠️ Traps 0 and 6 are the two most often dropped when this list is copied.

🔴 **AND THIS DOCUMENT IS THE PART PROMPT.** §0.7a of the conformance plan records that five different things each claim to be "the first call of every realm" and that the tiebreak is the Part's own prompt. This is that prompt for session 2's scope; a later Part's prompt supersedes it for that Part.

1. 🔴 **A backgrounded `npm test > log 2>&1; echo "exit=$?"; tail log` EXITS 0 WHATEVER THE SUITE DID.** The harness reports the WRAPPER. **Read the recorded `exit=` line out of the task's output file.** A commit shipped claiming a green suite that had exited 1.
2. 🔴 **Pipeline order:** `reflow-comments --write` → `portal:bust` → build → `portalGeometry --realm <r> --write` **LAST** → commit. Reversed, each undoes the next.
3. **`reflow-comments` scans TRACKED files**, so a new file is invisible until the commit that adds it — then fails immediately after. Re-run the reflows after any commit that ADDS files.
4. **It also merges a `# shellcheck disable` (or `eslint-disable`, `@ts-expect-error`) into prose and destroys it, on every run.** Need no directive rather than defending one.
5. **Home and Review REFUSE without `--mk-query demo=1`** (`scripts/lib/portalSeedRealms.mjs` is the one list). Exit 2 is the tool working.

## §5 — WHAT THE INSTRUMENTS DO NOT TELL YOU

- **`portalDiff` prints the largest 14 regions.** It used to assert *"Every region is CLOSED or CITED"* unconditionally after truncating — a string literal; it has never read the ledger. It states what it withheld now. **`--json` for all of them.**
- ⚠️ **BOTH HALVES OF THIS BULLET WERE RETIRED 2026-09-04 14:16 EDT AND THE FIRST ONE INVERTED.** It read *"the six untouched realms are the load-bearing half. `access` has no fixture at all."* **All seven fixtures were re-recorded** to carry the new `sizesSample` field, so **zero realms are untouched and `--all --check` is vacuous for every one of them** — worse than when this was written, not better. What answers it is the DIFF rather than the check: across all seven realms the only fields that moved were `recordedAt` and `commit`; **not one measured number changed.** And `access` has a fixture now (By admin 365/0/11 · By permission 224/0/7), so the check covers seven.
- ✅ **CLOSED 2026-09-04 14:16 EDT — `portalGeometry` records the `sizeIssues` SAMPLE now.** `__grid.all()` always returned the offending groups and the tool discarded them. Home's 35 are nameable: SVG width/height spread, the `stat>v`/`stat>k` top-offsets at 22px, the clock's unit widths at 6.3px, the home-card row offsets at 27px.
- **The audit's inline `⚠ ledger may cover this` hint was WRONG 4 of 4 times on Home.** It says so now. Verify with `ctx_search`, never `rg` — measured 5-of-5 against 1-of-6.
- **Do not size this session on Home.** §0.6a: Home's and Review's mockups are static compositions **a tenth** of Season's. Home closed at ② 8; access's export overlay is ④ 304.

## §6 — THE CONTRACT

- **Branch `feat/home-portal-conformance`**, unpushed. ⚠️ **THE COMMIT COUNT, THE VERSION AND THE LAST-GREEN SHA WERE WRITTEN OUT HERE AND WENT STALE THE SAME DAY** (it read "18 commits … `npm test` 0 at `27f4e7d9`" while HEAD was ten commits further on). A present-tense count in prose is duplicated state that rots silently — the structural form is the command: `git rev-list --count v3-pre-release..HEAD` · `node -p "require('./package.json').version"` · and `npm test` read from the FOREGROUND process, never a wrapper.
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
