---
kind: plan
status: live
---

# Post-compact remediation — the twelve items, then the merge

> **For agentic workers:** this plan is the FIRST thing to read after the 2026-08-31 compact. It is tracked in git deliberately — Batch H lived only in gitignored `local/` and a default `rg` could not see it, which is why its four remaining steps had to be re-filed by hand.

**Goal:** close twelve remediation items found by an adversarial audit, then merge a 281-commit branch that has never had a PR.

**Why this plan exists:** Season's conformance pass cost **600–700+ turns across many sessions**. An honest decomposition puts **~500 of those on my own mistakes, drift and false confidence** — not on the plan, the instruments or the mockup. This plan fixes the mechanisms that produced them.

**Spec:** none. This is remediation, derived from `docs/superpowers/plans/2026-08-27-portal-conformance.md` and the audit recorded in `docs/db-deferred-list.md`.

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

## Task 6: Split the conformance plan

**Files:** Create `docs/superpowers/plans/2026-08-27-portal-conformance-OPERATING.md` · Modify the 787-line original

**Why:** it grows ~50 lines per session and **three sessions still dropped its most important section.** Adding is anti-correlated with compliance.

- [ ] **Step 1: Extract the ~80 operating lines** — the loop, §0.7a's batching contract, §0.7c's buckets, §0.7d's purpose, the close condition, §0.3's viewport. **Nothing explanatory.**
- [ ] **Step 2: The original stays as the archive.** ⚠️ **Do NOT delete the reasoning** — this repo's culture is that *a rule whose cost is invisible gets optimised away*, and every §0.x section names what it cost.
- [ ] **Step 3: ⚠️ A split means every cross-reference moves.** `no half-measures on reorgs` is a standing memory. Sweep `CLAUDE.md`, `.claude/rules/`, the deferred list, COMPANION, and `~/.config/dior/` — **that last one is invisible to every in-repo search, including `rg -uu --hidden`, because it is a different repository.**
- [ ] **Step 4: `npm run docs:audit`** — `xref` catches a moved path that nothing updated.
- [ ] **Step 5: Commit both files in one commit.**

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
