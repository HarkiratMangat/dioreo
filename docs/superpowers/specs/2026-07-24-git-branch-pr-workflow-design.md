# Design — Git branching / PR / versioning workflow overhaul

*Authored 2026-07-24 11:29 EDT (Claude, Opus 4.8). Brainstormed with Harkirat this session; all 5
sections approved with refinements folded in. This is the design/spec; the implementation plan comes
next (writing-plans).*

## 1 · Context & goal

Today everything happens directly on `main`: commit → push → (VM `git pull` + systemd restart) →
document, with the version number minted **per push-that-went-live** and tracked only in git tags +
the changelog. No branches, no PRs, no merge step.

Harkirat wants a real **branch → commit → push → PR (draft optional) → merge → deploy** lifecycle,
where **merge mints the version bump** (decoupled from deploy). Semantic mapping he gave:

- Branch = "working on a feature"
- Commit = "save progress"
- Push = "upload saves to the cloud"
- PR / draft PR = "done, or done pending review/testing"
- Merge = "sync it into `main`" (this is the version-bump moment)
- Deploy = a *separate, optional-per-change* step that actually makes the bot run the new code

Goal of this change: adopt that lifecycle, decide where versioning/tags and documentation land in it,
and sweep every file/doc/hook/memory that encodes the old model so the whole system is coherent.

### Key facts established during brainstorming
- **`gh` CLI is available and authed** (v2.96.0, account `HarkiratMangat`, scopes incl. `repo` +
  `workflow`). Remote is `HarkiratMangat/diors-builds`. So Claude can drive branches/PRs/merges/tags.
- **The version number lives NOWHERE in the running code today.** `package.json` is a stale `1.0.0`;
  the bot reports no version on boot; there is no VERSION constant. Version is purely a label on git
  tags + the changelog. → A "version bump" is currently just *write the number in the changelog +
  `git tag`*. This is why merged-but-not-deployed is coherent (the bot never claimed a version).
- Branching isn't foreign — `fix/colors-cpu-efficiency` already exists locally and on origin.
- A `PostToolUse` hook currently nags on **every `git commit`** that didn't touch `docs/CHANGELOG.md`.

## 2 · The lifecycle & approval gates

| Step | Meaning | Physically | Explicit per-time OK? |
|---|---|---|---|
| **Branch** | starting a feature | `git checkout -b feat/x` off `main` | No |
| **Commit** | save progress (checkpoint) | `git commit` on the branch, freely | **No** (changed from old rule — safe under squash) |
| **Push** | upload saves to cloud | `git push -u origin feat/x` (the *branch*) | **Yes** |
| **PR** | done / done-pending-test | `gh pr create` — `--draft` only if a test/review gap exists, ready otherwise | No (organizes an already-approved push) |
| **Merge** | sync into `main`; mint version | `gh pr merge --squash` + `package.json` bump + tag | **Yes** (this yes *is* the version-number approval) |
| **Deploy** | make the bot run it | `./scripts/deploy.sh` on the VM (pull + restart) | **Yes** |

- **Approval-gated set = push · merge · deploy.** Branch + branch-commits + PR-create are free.
  The old "ask before every commit" non-negotiable is **retired for the normal flow** — we never
  commit directly to `main` anymore (branch → squash-merge), and branch checkpoints carry no version,
  so there's nothing to gate. A rare *direct-to-`main` hotfix commit* would still be gated as an
  exception.
- **Draft is the only optional stage, not the PR.** The PR always happens (review surface + version
  anchor + consistency). Use `--draft` only when there is something to wait on (bot testing, a
  deliberate eyeball). No wait needed → open ready and merge; a docs fix can be `gh pr create` →
  `gh pr merge` back to back.
- When Claude asks "OK to merge?", it states the **proposed version number** in the same breath, so
  the merge-yes bundles the version-number-yes. **MAJOR bumps (→ v3) always need an explicit separate
  ask**, unchanged.

## 3 · Versioning & tags

- **One version number per merged PR** (not per commit, not per push). A PR of N checkpoint commits →
  one number. `vMAJOR.MODERATE.MINOR` semantics unchanged: MODERATE = a significant PR, MINOR = a
  small one, MAJOR only with explicit confirmation. Only the *unit that earns a number* moved:
  "push-that-went-live" → "merged PR" (a cleaner release unit).
- **Merge style = squash.** Each merged PR collapses to **one** commit on `main` = one version = one
  tag. Linear history, one hash per changelog version, and it kills the GitHub-history bloat from
  checkpoint commits (an explicit Harkirat complaint). Branch checkpoints stay visible on the PR page +
  in DEVLOG narrative, just not in `main`.
- **Tag on the squash commit**, on `main`: `git tag -a vX.Y.Z <squash-sha> -m "…"` then push the tag.
- **`package.json` version is now bumped as part of the merge.** The bump is written on the branch as
  the final pre-merge checkpoint (alongside the finalized changelog), so it folds into the squash
  commit and the tag points at it. Node doesn't read the field at runtime — bumping is free/safe.
- **Unreleased redefined:** an open branch/PR *is* the new "Unreleased." Its **proposed** number sits
  in the changelog's Unreleased section and graduates to a real numbered entry + tag at squash-merge.
- **Branch-work reference notation:** unreleased branch commits carry **no** assigned version; they're
  referenced informally as "based on `<last merged version>`, at commit `<sha>`." Concrete numbers are
  only minted at merge (the step Harkirat has a say on).

## 4 · `package.json` as the running-version signal

The reason to bump `package.json` (beyond ending the stale `1.0.0`): it becomes the **deployed/running
version** signal, closing the gap that decoupling merge from deploy opens up.

- **`main` version** = latest tag = `package.json` on `main`.
- **Running version** = `package.json` on the VM's checked-out commit.
- **Wire the "Bot online" boot alert to read `package.json` and report the version** (e.g. `require`
  or read+parse at startup, include in the existing online alert). Then "what's live?" is answered by
  the alert itself, and a pending deploy is obvious: alert says `v2.31.0`, `main` says `v2.32.0`.

This is the one net-new *feature* code change in the committed scope (the optional `deploy.sh`
status line in §6 aside); everything else is process/docs/hooks.

## 5 · Documentation model (where docs land)

Docs stop being a separate "at push time" ritual (the step that kept getting skipped) and become
**part of the PR's diff**, reviewed alongside the code.

- **CHANGELOG / CHANGELOG-SUMMARY:** drafted on the branch (Unreleased, proposed number), **finalized
  at merge** — real number + squash-commit hash + tag. The number only exists at merge.
- **CLAUDE.md / `.claude/rules` / memory / working agreement / ROADMAP / notes file:** updated on the
  branch as the relevant change happens; they ride in the PR. No separate timing.
- **DEVLOG:** a merged PR is a natural narrative unit → entry written at merge.
- **Enforcement hook moves from commit-time to merge-time.** The current `PostToolUse` hook that nags
  on every `git commit` is wrong-grained now (many free checkpoint commits). Rescope it to fire on
  **`gh pr merge`** and verify the merged diff touched `docs/CHANGELOG.md`. One check at the real gate.
- Net win: a missing changelog entry is now **visible in the PR diff during review**, not reliant on
  push-time memory. And because *everything* (incl. docs-only / planning sessions) flows through
  branch → merge, nothing slips past the way planning sessions used to. Docs-only merges get a version
  bump too (with no redeploy) — confirmed desired.

## 6 · Deploy (unchanged operation)

- The VM operation is identical: `./scripts/deploy.sh` (pull + restart), still manual, still owns the
  deliberate-vs-crash restart-reason labeling. Deploy stays a separable step; a merged version may sit
  undeployed indefinitely (docs-only being the obvious case) and that's fine.
- **`main` version vs deployed version can now diverge** — answered by §4 (`package.json` + boot
  alert). *Optional* extra: have `deploy.sh`/`vmstatus.sh` print `VM at <sha> · main at vX.Y.Z`. Add
  only if wanted.

## 7 · Commit-message handling under squash

- **Inline `// why` code comments:** untouched — they live in the files and land on `main` verbatim.
  Keep authoring them per the working agreement.
- **Git commit *messages*:** GitHub squash concatenates every branch commit message into the squash
  commit body by default; Claude curates that into one clean, structured message on `main` (good title
  + real "why" summary). Reasoning is consolidated, not lost. Branch checkpoints can therefore have
  terse messages; the authored message is written once, at squash-merge.
- **Subject format (added 2026-07-26 15:20 EDT):** Conventional Commits v1.0.0 as specified —
  `<type>(<optional scope>): <description>`, colon and one space. Full vocabulary, the six non-standard
  types to avoid, and the branch-naming half: `docs/reference/commit-and-branch-naming.md`.

## 8 · Consistency sweep (files encoding the old model)

1. `CLAUDE.md` — "Deploy = git-based" invariant section: rewrite the flow + the new approval set
   (push · merge · deploy), version = merge, squash, `package.json` bump.
2. `docs/SESSION-START.md` — NON-NEGOTIABLES glossary: add branch/PR/merge steps; commit no longer
   gated; version = merge not went-live.
3. `~/.claude/projects/-Applications-Diors-Builds/memory/user_working_agreement.md` — rule #1
   ("ask before every commit AND push") → "ask before push, merge, deploy"; non-negotiables glossary;
   docs land in the PR.
4. `.claude/settings.local.json` — `PostToolUse` commit-hook → merge-hook (fire on `gh pr merge`,
   check `docs/CHANGELOG.md` touched).
5. `docs/CHANGELOG.md` + `docs/CHANGELOG-SUMMARY.md` — Versioning header: version = merged PR (not
   went-live); Unreleased = open PR/branch; one hash per version under squash.
6. Memory files: `feedback_docs_at_push_time`, `feedback_push_means_full_cycle`,
   `feedback_wait_for_commit_push_confirmation`, `project_dior_builds_changelog_system` — update to the
   new model; add **one new** `project_git_workflow` memory as the canonical description + index it in
   `MEMORY.md`.
7. `docs/DEVLOG.md` — narrative entry for the switch.
8. `docs/ROADMAP.md` — mark this workflow item done; log deploy-on-merge automation as a future option.
9. `docs/README.md` — per-push chore checklist → per-merge.
10. `docs/reference/deployment-and-ops.md` — version-tagging section: tag the squash commit at merge;
    `package.json` bump; running-vs-main version.
11. `scripts/deploy.sh` — mostly comments; optional `main`-vs-VM status line (§6).
12. `index.js` — boot "Bot online" alert reads `package.json` version (§4). *(The only code change.)*
13. `package.json` — bump from stale `1.0.0` to the current real version as part of the first merge
    under the new flow.

## 9 · Out of scope / future

- **Auto-deploy on merge** (GitHub Action/webhook → VM pull+restart). Rejected for now: real new infra
  and it complicates the deliberate-vs-crash restart labeling `deploy.sh` does. Logged as a future
  ROADMAP option. Deploy stays manual + separable.
- The optional `deploy.sh`/`vmstatus.sh` status line (§6) — nice-to-have, include only if wanted.

## 10 · Decisions log (don't re-litigate)

- PRs kept (Option A) — reframed as review/staging surface + version anchor, not an approval gate.
  Draft is the only optional stage. (C rejected: two flows = a per-change tax.)
- Merge = "sync to `main`" only; **deploy is a separate step**; version bump is at merge, decoupled
  from live. Manual deploy stays.
- Squash merge; one commit + one tag per version on `main`.
- Branch commits are free (no approval); approval-gated set = push · merge · deploy.
- `package.json` gets bumped at merge and the boot alert reports it (running-version signal).
