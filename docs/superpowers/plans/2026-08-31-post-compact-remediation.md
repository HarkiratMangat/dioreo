---
kind: plan
status: live
---

# Post-compact remediation — ten tasks, then the merge

> **For agentic workers:** this plan is the FIRST thing to read after the 2026-08-31 compact. It is tracked in git deliberately — Batch H lived only in gitignored `local/` and a default `rg` could not see it, which is why its four remaining steps had to be re-filed by hand.

**Goal:** close twelve remediation items found by an adversarial audit, then merge a 281-commit branch that has never had a PR.

**Why this plan exists:** Season's conformance pass cost **600–700+ turns across many sessions**. An honest decomposition puts **~500 of those on my own mistakes, drift and false confidence** — not on the plan, the instruments or the mockup. This plan fixes the mechanisms that produced them.

**Spec:** none. This is remediation, derived from `docs/superpowers/plans/2026-08-27-portal-conformance.md` and the audit recorded in `docs/db-deferred-list.md`.

---

## 🔴 THE SHAPE OF THIS PLAN, AND WHY IT IS NOT ONE GOVERNING DOCUMENT

Harkirat asked three questions on 2026-08-31 12:3x EDT — scope, depth, authority — and refused to answer any of them: *"these documents are for you, so you need to figure out these questions."* Attacking them changed all three answers away from what I had proposed.

**The premise I had to break first:** all three of my options assumed the problem is what a document CONTAINS. Test that against what actually failed, and of six failure classes **a document could have prevented exactly one**:

| What failed | Could a document have stopped it? |
|---|---|
| Three sessions dropped §0.1's precedence | **No — it was IN the document they read** |
| Shell quoting, TDZ, backticks, dangling ternaries | No. Hooks. |
| Batching and narration | No. I recited §0.7a while breaking it |
| **Not knowing something was already decided** | **YES** — the clock, the accent tokens, `dateOnly`, each answered three lines from the code |
| Not knowing an instrument's limits | Now printed by the instruments |
| False closes | No — the close condition was written down |

🔴 **And the one it could prevent is a LOOKUP problem, not a reading problem.** *"Has this been decided?"* needs an answer in one `rg` at the moment of doubt, not a section read hours earlier.

**So there are two artifacts of different SHAPES, not one of larger scope:**
- **This plan is a SEQUENCE.** Bounded, ordered, and it **dies when the tasks land**.
- **`docs/reference/portal-decision-ledger.md` is a LOOKUP.** Durable, queried, never read start-to-finish. **It is what a realm session actually needs** — Armory has no task list, it has an audit that produces findings and a need to know which are already answered.

⚠️ **Forcing both into one file makes the sequence bury the lookup** — which is precisely what happened to §0.1 inside 787 lines: a lookup buried in a narrative.

**On depth, three tiers rather than one choice:** reasoning that **changes an action** goes inline at the point of use · reasoning that **prices a rule** goes as ONE CLAUSE beside it (*"three sessions dropped this; each re-opened a closed Part"* — eight words, and un-deletable because it names a cost) · pure history goes to the archive. ⚠️ **The one-clause form is not optional**: this repo's culture is that a rule whose cost is invisible gets optimised away, so a stripped rule gets deleted by a future session as noise.

🔴 **On authority: the conformance plan is NOT superseded, and Task 6 is DROPPED.** Superseding buys "a shorter thing to read" and risks breaking references in `CLAUDE.md`, `.claude/rules/`, COMPANION, six instruments and `~/.config/dior` — which no in-repo search can reach. **But "shorter to read" solves none of the six failures above**; §0.1 failed inside a document that WAS read. **Its length is not the defect — its length is a symptom of being the only place anything gets written.** Stop writing to it and the growth stops, with zero references moved.

⚠️ **THEREFORE, THE STANDING RULE FOR EVERY FUTURE SESSION: new discoveries go to the DECISION LEDGER or into INSTRUMENT OUTPUT. Not into the conformance plan.**

## Global Constraints

- **No push, no PR, no merge without restating the approval** at the moment of the action. `push-approval-gate.sh` demands `Approved by: <who> · to: <what> · when: <the message>`.
- **Base is `v3-pre-release`, never `main`.** `gh pr create` defaults to `main` and a v3 PR merged there fails silently.
- **No tag.** The pre-release line mints none until `v3.0.0`.
- **Never `npm run portal`** — it loads prod's `.env`. The dev portal is `node --env-file=.env.dev portal/server.js`.
- **Never delete `.claude/worktrees/*`** — two live peer sessions: `draw-calculator-breakdown-146641` and `outstanding-v3-items-135f3b`. Run `git worktree list` rather than trusting either name. `docs-audit`'s `nested-worktree` WARNING fires for both and is never actioned.
- **Read a gate's EXIT CODE, never a piped tail.** A pipeline exits with the last command's status and these gates print ERRORs above their summary.

---

## 🔴 THE NUMBER THIS PLAN EXISTS TO CHANGE

Measured on the session of 2026-08-31: **~55 of 120 turns were my own mistakes**, in a session where I was corrected four times and knew I was being measured.

| What | Turns |
|---|---|
| Probed SHAPE findings one at a time — §0.7a says **ONE BATCH** | ~20 |
| Chased `.mini` — a difference I had myself closed as cited an hour earlier | ~6 |
| Ran the triage three times (143 → 92 → 23); run 1 stripped the evidence lines, run 2 used a useless cross-reference | ~4 |
| Dangling `CONFORM` after a rename — broke Broadcast to an empty 984px page, produced a confident **17.7%** | ~4 |
| Two dual-runtime traps (`normalizeTitle`, `getComputedStyle`) — **§0.5a R6 describes both** | ~4 |
| zsh word-splitting on `--view` — **§0.5a R9 describes this exact bug** — then again on a capture loop | ~5 |
| Dangling ternary tails ×2, and a backtick in an HTML comment (§0.10's **first** row) | ~5 |
| My own throwaway script carrying §0.10's pairing defect | ~3 |
| Announced a step then stopped, twice | 2 round-trips |

🔴 **THE PATTERN, AND IT DECIDES EVERY FIX BELOW: I do not fail at JUDGEMENT, I fail at MECHANICS.** No decision was mis-classified that day. Fifty turns went to shell quoting, template-literal syntax, dangling ternaries and stripped evidence lines. **More written rules target judgement, which is not where the failure is.** Only things that reach the moment of writing a command help: a linter, a hook, or a check inside the tool being used.

🔴 **AND THE SECOND PATTERN: prohibitions on SINGLE ACTS hold; instructions about the SHAPE of continuous work do not.** Of the eleven working-contract rules, the four never violated are all single-act prohibitions (never push, never `npm run portal`, never delete a worktree, never say "done"). The three violated repeatedly — mega-batch, zero narration, finish the work — apply to every message and are checkable at none. **That is why items 6–8 are hooks and not prose.**

---

🔴 **EVERY TASK BELOW CARRIES A FALSIFIER, AND THAT IS NOT DECORATION.** §0.7c was written as confident prose about an untested procedure and had to be marked untested the same day. **A remediation plan with no falsifiers is that mistake one level up.** If a task's falsifier cannot be stated, the task is not understood well enough to start.

🔴 **THE ORDER IS THIS, IN FULL — NOT THE DOCUMENT'S TOP-TO-BOTTOM NUMBERING.** A read-only audit on 2026-08-31 flagged that *"the rest"* was unresolved and that a session working the file in order would run 1→2→3→…, which is a different sequence:

**1 → 4 → 5 → 2 → 3 → 7 → 8 → 9 → 10 → 11.**

**Why:** **1** ≈25 turns saved today · **4** is unskippable and carries the ledger annotation · **5** protects the compact boundary · **2** has the highest ceiling and the least certainty · **11 is last because merging over unfinished remediation is what created the compounding risk.**

⚠️ **ONE STATED DEPENDENCY: Task 3 Step 2 moves three rules into Task 2's hook message, so 3 CANNOT precede 2.** Nothing else here is order-dependent.

---

## Task 1: The four mechanical guards

**Files:** Create `.claude/hooks/edit-syntax-guard.sh` + `.test.sh` · Modify `package.json`, `eslint.config.js` (or create)

**Interfaces:** Produces a `PreToolUse` guard on `Edit`/`Write` for `portal/ui/**`. Consumes nothing.

**Why:** these four alone would have prevented **~25 of the 55 wasted turns**. Every one is a failure this repo has already written down and paid for more than once.

- [ ] **Step 1: Write the failing case first.** Create `/tmp/guard-fixtures/` with four files, each containing exactly one defect: a `const` read above its declaration; an orphaned `: null}` after a removed ternary head; a backtick inside an `<!-- -->` comment inside a template literal; a shell loop with unquoted `$v` passed as a flag.

- [ ] **Step 2: Run the guard against them and watch all four fail.** Expected: exit 1, each fixture named. **A guard that has not refused a real defect is not a guard.**

- [ ] **Step 3: `no-use-before-define`.** Filed weeks ago in `docs/db-deferred-list.md`, never built. 🔴 **`node --check` does NOT catch a TDZ** — four shipped in one day, one inside the edit fixing the previous one. The page renders blank in Preact and the syntax check passes.

- [ ] **Step 4: The backtick-in-HTML-comment check must run at EDIT time, not build time.** It already exists in `scripts/portalRender.test.js` and still cost a turn on 2026-08-31, because by the time `npm test` runs the edit is minutes old. §0.10's first row, paid five times project-wide.

- [ ] **Step 5: The orphaned-ternary check.** Pattern: a line matching `^\s*: ` whose enclosing expression has no `?`. Both instances came from removing a ternary head and leaving `: null}`.

- [ ] **Step 6: Wire into `npm test` via `run-all-tests.sh`.** ⚠️ **Every script in `.claude/hooks/` needs a `<name>.test.sh` or the suite fails** — coverage is computed from the scripts on disk, and `UNTESTED_OK` is empty and must stay empty.

- [ ] **Step 7: Verify the guard fires on the REAL tool call, not just a pipe test.** ⚠️ **A pipe test proves the SCRIPT works, never that the HOOK fires** — two hooks were dead this way for weeks while pipe-testing perfectly. Trigger a real `Edit` and look for the refusal.

- [ ] **Step 8: Commit.**

**Falsifier:** each guard refused a real defect in step 2 before it was trusted. ⚠️ **A guard that has never refused anything is not evidence of clean code.**

---

## Task 2: The batching and narration hooks

**Files:** Create `.claude/hooks/turn-shape-guard.sh` + `.test.sh` · Modify `.claude/settings.json`

**Why:** four violations in one session, under correction, with the contract loaded in context and recited verbatim on request. **This repo's own precedent is `push-approval-gate.sh`**, which exists because *"approval never carries over"* failed twice while loaded in context. Same disease, same cure.

- [ ] **Step 1: Decide the signal, and write down what it CANNOT see.** A `Stop` hook can count the turn's tool calls. **One Bash/Read call in a turn, twice consecutively, is the one-at-a-time pattern.** It cannot tell a legitimately serial dependency from avoidance — so it warns, never denies.

- [ ] **Step 2: Non-blocking, and that is Harkirat's standing constraint.** *"a gate is better than advisory but i dont want it denying things."* ⚠️ **A `warn` action reaches HARKIRAT, not Claude** — it emits only `systemMessage`. To reach Claude the hook MUST emit `{"hookSpecificOutput":{"hookEventName":"Stop","additionalContext":"…"}}`. **A `hookSpecificOutput` without `hookEventName` is silently discarded** — it runs, exits 0, prints valid JSON and reaches nobody.

- [ ] **Step 3: The narration check.** Text before the first tool call in a message. **The honest framing, which belongs in the hook's message:** narration is a hedge — pre-registering intent so a surprising result still reads as competent. The test is *delete the prose and see whether anything is lost.* On 2026-08-31, nothing would have been.

- [ ] **Step 4: Self-test, proving it can fire AND that it stays quiet on a legitimately batched turn.** A guard that fires on everything is noise and will be disabled.

- [ ] **Step 5: Register in `.claude/settings.json`** — ⚠️ **tracked**, never `settings.local.json`, or the enforcement layer becomes unrecoverable on a fresh clone.

- [ ] **Step 6: Commit.**

**Falsifier:** it fires on a one-at-a-time turn AND **stays quiet on a correctly batched one**. ⚠️ **A hook that fires on everything becomes furniture** — that is how the `nested-worktree` warning stopped being read.

---

## Task 3: Shrink the working contract

**Files:** Modify `.remember/remember.md`

- [ ] **Step 1: Split the eleven rules by kind.** Single-act prohibitions (**held**): no push/PR · never `npm run portal` · never delete worktrees · never write "done". Shape-of-work rules (**violated**): mega-batch · zero narration · finish the work.
- [ ] **Step 2: Keep the four. Move the three into Task 2's hook message**, where they arrive at the moment they apply.
- [ ] **Step 3: Leave `sequentialthinking pre-emptively`, `fix the CLASS`, `popup not prose`, and the awwwards bar** — each held this session.
- [ ] **Step 4: State plainly at the top that a rule kept here and broken is worse than no rule**, because it manufactures the belief the behaviour is covered.

---

## Task 4: Print the operating rules in `portal:audit`'s own output

**Files:** Modify `scripts/portalAudit.mjs`

**Why:** 🔴 **This is the strongest item in the plan.** The tool must run to get findings, so the rules arrive with them and cannot be skipped. Three sessions dropped §0.1 from a 787-line document; nobody can drop a header printed above their own results.

- [ ] **Step 1: Print above section ①**, in ~12 lines: the four triage buckets (cited / dead-on-both / already-settled / FIX) · **"a FIX row that removes a GATE, a GUARD or a CONDITION is never a triage row"** · §0.7d's rule that the diff finds surfaces and Harkirat closes by looking.
- [ ] **Step 2: Keep it under 15 lines.** A header nobody reads is the problem restated.
- [ ] **Step 2b: 🔴 ANNOTATE EACH FINDING WITH ITS DECISION, IF ONE EXISTS.** Match the finding's selector against `portal-decision-ledger.md` and print *"a decision may cover this — check the ledger"*. **A finding is exactly the moment "has this been decided?" arises**, which is why this belongs here and not in a document somebody must remember to open.
- [ ] **Step 2c: ⚠️ IT ANNOTATES, IT NEVER FILTERS OR SUPPRESSES.** The triage classifier proved the hazard the same day: it could report a false CITED on any `ow-*` row, hiding a real defect on the most-decided surface. **Print a pointer, never a verdict.**
- [ ] **Step 2c-ii: ⚠️ THE AUDIT'S MATCHER IS A KEYWORD MAP AND THAT IS ITS CEILING.** A script cannot call `ctx_search`. **Measured 2026-08-31: `rg`-style literal matching found 1 of 6 real finding selectors; `ctx_search` on the same questions found 5 of 5.** So the audit's annotation is a coarse first pass — **it must say so in its own output** and point the session at `ctx_search` for the real lookup, or it becomes the false-CITED hazard in a new costume.
- [ ] **Step 2c-iii: ⚠️ KNOWN GAP, STATED RATHER THAN HIDDEN.** The audit's annotation is the *only* mechanical nudge toward the ledger. **Consulting it otherwise depends on remembering to** — the same prose-dependent compliance this plan builds hooks to escape everywhere else. That is precisely why Step 2b belongs in the audit and not in a document, and it is **still weaker than a `PreToolUse` gate.** If the ledger goes unconsulted after Task 4 lands, the fix is a gate, not a reminder.
- [ ] **Step 2d: Falsifier** — feed it a finding on a surface with a known decision and one without. It must annotate the first, stay silent on the second, and **suppress neither**.
- [ ] **Step 3: Verify by running the audit and reading its first screen.**
- [ ] **Step 4: Commit.**

---

## Task 5: Provenance on every `local/` artifact

**Files:** Modify `scripts/portalAudit.mjs` (triage writer), and any script writing to `local/`

**Why:** 🔴 **This is the context-fill gap.** `local/season-triage.md` reports **23 FIX** — a successor cannot tell that is regex classification rather than measurement. **A number in a file looks identical whether it was measured, pattern-matched or guessed**, and that is exactly how a false close happens.

- [ ] **Step 1: Every generated `local/` file opens with a provenance line** — what produced it, by what method, and what would falsify it.
- [ ] **Step 2: Retrofit `local/season-triage.md` NOW**, with the specific known weakness: 🔴 **the classifier can report a false CITED on any `ow-*` row**, which is the surface I made the most decisions about. A real defect there is invisible to it.
- [ ] **Step 3: Verify** — open each `local/` artifact and confirm a reader can tell measurement from classification.

---

## Task 6: ⊘ DROPPED — do not split the conformance plan

**Dropped 2026-08-31 12:4x EDT by the reasoning above, and it was the riskiest task on this list.** Splitting a 787-line document referenced by `CLAUDE.md`, `.claude/rules/`, COMPANION, the deferred list, six instruments and `~/.config/dior` is the `no half-measures on reorgs` hazard — and it buys only brevity, which solves none of the measured failures. **Task 4 delivers the real benefit by putting the rules where they fire.**

⚠️ **Do not re-propose this.** Splitting *feels* like progress, which is why I nearly took it.


---

## Task 7: The receiving protocol

**Files:** Modify `docs/reference/session-handoff-guide.md`

**Why:** the guide says how to WRITE a handoff. **Every failure it records is a RECEIVING failure** — a session read the handoff, missed §0.1, and closed a Part wrongly. Three better-written handoffs produced three false closes. Writing better has been tried.

- [ ] **Step 1: Add a receiving section.** The first action produces the realm's own numbers **before touching anything**: `npm run portal:status`, then the realm's audit.
- [ ] **Step 2: State the point** — if those numbers disagree with the handoff, **that disagreement is the most valuable thing in the session** and it surfaces in the first two minutes rather than at the close.
- [ ] **Step 3: ⚠️ The guide is ~15 sections and growing the same way the plan did.** Adding a section is only justified because it is the first one about receiving. **Do not add another without removing one.**

---

## Task 8: Re-measure Broadcast

**Files:** `portal/fixtures/geometry/broadcast.json`

**Why:** its 0.2% was measured **before** the 2026-08-31 CSS edits, which touched `.pill .sub`, `.bar.saved`, `.stt.saved` and `.mark.stack .n` — **all shared surfaces**. §0.5b: *a change to a shared surface re-runs the closed realms' fixtures IN THE SAME COMMIT.* I skipped that rule and then quoted the stale number in a summary.

- [ ] **Step 1: `node scripts/portalDiff.mjs --realm broadcast --portal harness`.**
- [ ] **Step 2: If it moved, find out why before re-recording.** ⚠️ **Re-recording a baseline is not a gate passing** (§0.45) — that rule was met in the wild on 2026-08-31 when a `--write` would have buried the geometry clock bug.
- [ ] **Step 3: Re-record the fixture and commit in the same commit as any fix.**

---

## Task 9: The re-apply list

**Files:** Modify `docs/db-deferred-list.md`

**Why:** the collapse deleted the stood-down redesigns and **the only record is a published artifact. A photograph of deleted code is not a specification to rebuild it** — and I called that artifact "the record" repeatedly.

- [ ] **Step 1: Enumerate each deleted redesign** — the hero clock (attempt 13, COMPANION §16.31a), the context band, the one-line draft state, and any other. **`git log -S` against the collapse commits is the source**, not memory.
- [ ] **Step 2: For each: what it was, where its code lived, what replaced it, and what would have to be true to rebuild it.**
- [ ] **Step 3: 🔴 Record the asymmetry nothing currently states** — **the 13 class-(b) keeps need NO re-apply.** They already won. Only the deleted redesigns do. Two queues, and the docs treat them as one.
- [ ] **Step 4: Link the artifact as evidence, not as the specification.**

---

## Task 10: Realm batch structure in the prompt

**Files:** Create `docs/superpowers/plans/ARMORY-PROMPT.md`

**Why:** Season's Batches 0–H were invented ad hoc, by me, in a gitignored file. Armory should not re-derive that.

- [ ] **Step 1: Write it as a paste-ready first message**, not a record. §0.0 already asks every session to write the next one's prompt.
- [ ] **Step 2: Carry the batch skeleton** — capture · triage · one edit · close — with the budget stated.
- [ ] **Step 3: ⚠️ State §0.7c's untested status and its falsifier** — Armory's resting pass in **≤10 calls**, or the failure gets written into §0.7c the way it was into §0.7a.
- [ ] **Step 4: ⚠️ Warn that Season's 23-of-169 triage ratio will NOT transfer** — 83 of those rows were cited by decisions made minutes earlier in the collapse. Armory has no collapse behind it and its findings will be genuinely open.

---

## Task 11: THE MERGE

**Why now:** `docs:audit` reported the unfilled `(#PR)` on every run for six days and I called it *expected* every time. **A gate pre-classified as noise had stopped being a gate.**

- [ ] **Step 0: `git fetch origin --prune && git rev-list --left-right --count origin/main...origin/v3-pre-release`.** ⚠️ **The target may have moved.** A 281-commit, 53,795-insertion squash is the worst possible operation to discover a drifted base after. `0 0` means identical; anything else means read what landed first.
- [ ] **Step 1: `npm test` · `npm run docs:audit` · `node scripts/portalGeometry.mjs --all --check`.** Read exit codes. Expect `docs:audit` = 1 (the `(#PR)`) plus two worktree warnings.
- [ ] **Step 2: Rewrite the changelog entry's scope line.** ⚠️ **The branch is NOT "Season"** — 281 commits, 198 files, 53,795 insertions, carrying the Preact migration, the instrument suite, the mode collapse, a destructive-surface change and the portal's whole build. Harkirat: *"it does not only contain Season Realm's work, it contains MUCH more."*
- [ ] **Step 3: Push.** ⚠️ **Restate the approval sentence at the gate.**
- [ ] **Step 4: `gh pr create --base v3-pre-release`** — ⚠️ **NOT `main`.**
- [ ] **Step 5: Fill the `(#PR)` citation on the branch and commit** — the pre-merge checkpoint folds into the squash.
- [ ] **Step 6: `gh pr merge --squash --delete-branch`** with an explicit `--body` carrying ONE trailer block. ⚠️ **Never chain `git tag` onto the merge** — `gh pr merge` fails on UNSTABLE checks and a piped chain runs on regardless.
- [ ] **Step 7: No tag.** Pre-release mints none until `v3.0.0`.
- [ ] **Step 8: `git fetch origin v3-pre-release:v3-pre-release`** to refresh local refs without a checkout.

**Verify:** `git rev-list --count origin/v3-pre-release..HEAD` returns 0, and `docs:audit` no longer reports an unfilled `(#PR)`.

---

## Already done before the compact — do NOT redo

- ✅ **The P0 patch-note hole** (`4f4e211`). Three action paths guarded, `manifest.js` survives a refused op, and `scripts/seasonPatchNoteGuard.test.js` was **proved able to fail** by removing the guard.
- ✅ **§0.7d written** — the diff finds surfaces, Harkirat closes by looking.
- ✅ **All-six-first re-affirmed** in `CLAUDE.md`, against my own argument.
- ✅ **Merge cadence filed** in `docs/db-deferred-list.md`.
- ✅ **§0.7c marked untested** with its falsifier.

---

## Audit log

**Falsification pass, 2026-08-31 12:3x EDT.** Ran against this plan before it was saved, asking where it is WRONG rather than reviewing it.

1. 🔴 **"Twelve items" is a number I inherited from my own summary and never re-counted.** Two of the twelve were already done before this plan was written, so it is ten. Fixed by listing the completed ones explicitly rather than silently renumbering — a plan whose scope quietly shrinks is the exact failure the scope-conservation sweep exists to catch.
2. 🔴 **Task 2 could make things worse.** A batching hook that fires on legitimately serial work would train me to ignore it, which is how the `nested-worktree` warning became furniture. Mitigated by requiring a self-test that proves it stays QUIET on a correctly batched turn — not only that it can fire.
3. ⚠️ **Task 6 is the riskiest.** Splitting a 787-line document that six tools and four docs reference is exactly the "no half-measures on reorgs" failure. It could be dropped without losing the plan's value; Task 4 delivers most of the same benefit by putting the rules where they fire. **Kept, but sequenced last among the doc tasks and gated on a full `xref` pass.**
4. ⚠️ **Task 1's guards are written from four defects I hit in one session, which is a sample of one session.** They may not generalise. Accepted: each is cheap, each is independently useful, and the alternative is another written rule.
5. **The order is load-bearing and stated:** hooks (1, 2) before documents (3, 6, 7), because the hooks constrain the work that writes the documents. Task 11 last, because a merge over unfinished remediation is what created the compounding risk in the first place.
