---
kind: spec
status: frozen
---

# v3 development structure — design

**Status:** approved by Harkirat 2026-07-27 17:45 EDT · **Supersedes** the branch/versioning half of the 2026-07-14 v3 directive recorded in memory `project_dior_builds_changelog_system.md`.

## Why this exists

The v3 branch/versioning/test-bot strategy was filed **2026-07-14/15**, and two things have landed since that partly obsolete it:

1. **The git-workflow overhaul (adopted 2026-07-24 12:24 EDT, v2.33.0)** — Branch → Commit → Test → Push → PR → Merge, with the version minted at squash-merge. The original directive's "every v2 change must also be cloned/ported into the v3 branch (cherry-pick or re-apply)" predates it and describes a long-lived divergent branch kept in sync by hand — the exact failure mode the PR workflow was adopted to avoid.
2. **The local dev bot (built 2026-07-26 13:45 EDT)** — `Dio (Dev)` did not exist when the "test-bot strategy" was written. Runtime isolation from the live bot is now solved at the process level, independent of branching.

So the question "how do we work on v3 without conflicting with the live bot or `main`" splits in two: **runtime isolation** (§4, mostly already solved, one real hole) and **repo/branch isolation** (§2–§3, genuinely open). This document settles both.

## Decisions taken

| # | Decision | Chosen |
|---|---|---|
| 1 | Does the v2 parallel track still stand? | **Mostly frozen, case-by-case.** Default is v3; a v2 item may still land on `main` and deploy when Harkirat wants it live. |
| 2 | What must be true of `main` at any moment? | **Always live-safe.** `main` must be deployable to the VM at any time without leaking unfinished v3 behaviour. |
| 3 | Repo structure | **A — a long-lived `v3-pre-release` integration branch**, synced one-way from `main`. |
| 4 | Sync mechanism | **Merge, never cherry-pick.** |
| 5 | Separate worktree for the v3 line? | **No** — single checkout. Revisit only if concurrent same-sitting work on both lines becomes real. |
| 6 | Cloudinary isolation | **Env-aware write guard** (§4). |
| 7 | Launch merge shape (squash vs merge commit) | **Deferred to launch** (§6). |

### Why not the alternatives

- **v3 dormant on `main` behind a launch gate** — best git hygiene, no divergence, no sync tax. Rejected because decision 2 is strict and v3's changes are *renames and removals* of live commands (`/manage`→`/admin`, collapsing the MP loadout commands, detaching `/colors`). A dormant-code gate would have to cover command **deregistration**, which is precisely where a mistake becomes a live outage rather than a cosmetic bug.
- **Separate repo or fork** — total isolation, total loss of shared history; the launch merge becomes a manual reconciliation. Only correct if v3 were a from-scratch rewrite. It isn't.
- **A `git worktree` for the v3 line** — its benefit is avoiding branch switches, and decisions 1 and 4 largely remove those: v2 hotfixes are rare by design, and syncing is `git fetch && git merge origin/main` performed *from* `v3-pre-release` without ever leaving it. Against that: a worktree gets no `.claude/settings.local.json` (gitignored), so **every Claude session started there loses both `SessionStart` hooks**  ⚠️ *[OBSOLETE as of 2026-07-28 13:10 EDT — the hooks moved to tracked `.claude/settings.json` and `settings.local.json` is tracked too, so a worktree now inherits both. The deferral may still be right on the other grounds listed; this reason no longer applies.]* — the `docs/SESSION-START.md` injection and the notes-file open-item count. It also needs its own `node_modules` and a symlinked `.env.dev`. Deferring costs nothing and is a one-command change later.

## §2 — Branch topology

```
main ──●────────●──────────────●─────────────────●  (live-safe at every commit)
       │ v2.35.5│ v2.35.6 fix   │ v2.36.0 fix     │
       └──┐     └──┐            └──┐              │ merge at launch
          ▼        ▼               ▼              │
v3-pre-release ●───●───●───●───●───●───●──────────┘
               ▲       ▲       ▲
               │       │       │  PRs from feat/* branches
```

- **`v3-pre-release`** is cut off `main` and pushed to origin. It is an *integration* branch: work never happens directly on it, exactly as with `main`.
- **v3 features** use the existing convention unchanged — `feat/<kebab>` off `v3-pre-release`, free commits, `gh pr create --base v3-pre-release`, squash-merge. Only the base differs.
- **v2 hotfixes** are entirely unchanged: branch off `main`, PR into `main`, merge, mint `v2.x.y`, deploy if wanted.
- **Nothing flows `v3-pre-release` → `main`** until launch.

### Sync: one-way, `main` → `v3-pre-release`, by merge

After anything merges to `main`, from `v3-pre-release`:

```bash
git fetch origin && git merge origin/main
```

**Cadence — after EVERY merge to `main`, automated 2026-07-27 22:35 EDT.** `.github/workflows/sync-v3-pre-release.yml` merges `main` into `v3-pre-release` and pushes on each push to `main`, skipping cleanly when the branch doesn't exist and **failing loudly on conflict** (a red run is the notification; resolve by hand from the branch). *This section originally specified the mechanism below in full detail and never said when to run it* — the trigger was missing here, in `CLAUDE.md`, in `ROADMAP.md`, and in memory, all four describing only *how*. The result: the branch sat **two releases behind at v2.35.15 until 2026-07-27 22:00 EDT**, lacking the release conventions it is required to follow. A documented mechanism is not a trigger.

**Never cherry-pick.** A cherry-pick copies a commit's *content* without recording that the sync happened, so git's merge base never advances; every subsequent sync re-presents the same conflicts, indefinitely. A merge advances the base, so each sync only ever handles what is genuinely new. This is the single correction to the 2026-07-14 directive's "cherry-pick or re-apply" wording.

### Two silent footguns

1. **`gh pr create` defaults to `--base main`.** A v3 PR created without `--base v3-pre-release` targets the live-safe branch and, if merged, puts v3 code on it. This is the most likely way to break the whole scheme, and it fails quietly.
2. **CI triggers must list `v3-pre-release`.** The CI workflow (PR #11) triggers on `main` only as written. Under this structure that means **no v3 PR would ever run CI** — a repo that looks green because nothing is being checked. §5 makes extending the triggers a precondition of cutting the branch.

## §3 — Versioning and changelog during pre-release

Carried over from the 2026-07-14 directive, with one gap filled:

- **`docs/CHANGELOG.md` only.** Entries titled `Pre-Release v3.MAJOR.MINOR`, using the same 3-part semantics as v2 (middle field = moderate, last = minor). **Nothing enters `CHANGELOG-SUMMARY.md`** during pre-release.
- **`package.json` on `v3-pre-release` carries the matching number with a `-pre` suffix** — changelog `Pre-Release v3.1.0` ↔ `package.json` `3.1.0-pre`. **This starts with the first `Pre-Release` entry, not before.** Until then `v3-pre-release` is only tracking `main` and its `package.json` legitimately carries `main`'s plain version with no suffix (it read `2.36.1` after the 2026-07-27 22:00 EDT sync). A bare version there is not drift while no v3 number has been minted. *(New — the original directive didn't say what `package.json` does during pre-release, and it matters: the bot's boot alert reads it.)* Valid semver, 1:1 with the changelog, and the suffix makes a dev-bot boot alert impossible to mistake for a real release.
- **No git tags during pre-release.** Tags mark released versions on `main`; a merge into an integration branch is not one. Launch mints exactly one tag, `v3.0.0`.
- Version still mints **at merge**, unchanged — just into `v3-pre-release`.
- ~~The existing per-release `chore(release): finalize … + version bump` commit lands on `v3-pre-release` rather than `main`.~~ **Superseded 2026-07-27 21:27 EDT — that commit is retired entirely.** The changelog entry + `package.json` bump are now written on the feature branch as the final pre-merge checkpoint, so each release is **one** squash commit on `v3-pre-release` too; the commit-hash citation is backfilled one release later. The lifecycle is identical on both bases. This matters more here than on `main`: with no tags until `v3.0.0`, the inline hash is the *only* pointer a `v3-pre-release` entry has. See `2026-07-24-git-branch-pr-workflow-design.md` §3.

## §4 — Runtime isolation

**Already isolated** (verified 2026-07-27 17:40 EDT by comparing `.env` and `.env.dev` key-by-key without reading values): `BOT_TOKEN`, `MONGODB_URI` (local Mongo), `LOG_WEBHOOK_URL` all differ from prod.

**Not isolated — `CLOUDINARY_URL` in `.env.dev` is byte-identical to prod's.** The dev bot therefore reads *and writes* the live Cloudinary account, in the same flat `gun-builds` folder (`utils/loadoutImageCache.js:22`, plus `utils/cloudinaryCache.js` and `utils/patchNotesCache.js`). Testing `/manage` image add/edit/delete or `/autobuild` on the dev bot mutates live assets today.

**Fix: an env-aware write guard, not separate credentials.** Reads must keep working — loadout image URLs stored in Mongo point at prod Cloudinary, so a separate dev account would render every loadout broken in dev, gutting the dev bot for exactly the v3 features that touch images. Writes are the problem. In the three cache utils, a single `IS_DEV = process.env.NODE_ENV === 'development'` gate:

- **uploads** → `asset_folder` gets a `-dev` suffix (`gun-builds-dev`, and likewise for the patch-notes folder);
- **destroy/delete** → a loud no-op that logs what it would have deleted, never reaching the API.

This makes the data-losing path structurally unreachable in dev. It ships as **its own PR to `main`** before the branch cut — it is a prod-safety fix, not v3 work.

Also noted while checking: `CLIENT_ID`, `GEMINI_API_KEY`, `RENDER_API_KEY`, `RAILWAY_TOKEN`, `GITHUB_TOKEN`, `PORT`, `ATLAS_CLIENT_SECRET` are absent from `.env.dev` and so inherit prod's values via the `dotenv.config()` backfill at `index.js:38`. **`CLIENT_ID` is referenced nowhere in the codebase** (confirmed by search) and the rest are not load-bearing for v3, so none are blockers — but the pattern is the same one that bit the alert webhook once, and is worth a pass eventually.

## §5 — Pre-flight, in order

Order is load-bearing: CI must be on `main` before the cut, so `v3-pre-release` inherits it at birth.

1. **Prune stale remote-tracking refs** — `git fetch --prune origin`. Three branches that appeared open were already merged: `fix/patch-notes-release-local-time` (#23, merged `f1d23da`, v2.35.4), `feat/dev-command-clear-script` (#22, merged `6d3f919`, v2.35.3), `docs/memory-count-and-attribution-deferral` (#24, merged `3e12737`, v2.35.5). Each was verified content-complete on `main` by a two-dot `git diff origin/main origin/<branch>` showing **zero code-file differences** — they appear "1 ahead" only because squash-merge leaves the original tip without a descendant on `main`.

   **⚠️ This repo has GitHub's auto-delete-on-merge enabled, so the remote refs were already gone** (confirmed 2026-07-27 17:52 EDT — `git push origin --delete` failed with "remote ref does not exist" for all three). A plain `git fetch` does **not** prune, so `git branch -a` will keep listing long-dead branches and misreport them as open work. Always `--prune` before auditing branch state; the authoritative check is `gh pr list --state all`, not `git branch -a`.
2. **PR #15** (`docs/board-view-setup-reminder`) — merge `origin/main` in (21 behind), resolve the likely `docs/db-deferred-list.md` conflict, merge, delete branch. Pure docs: a `[P1 · XS]` reminder for the two manual GitHub Projects view steps that GitHub's GraphQL API cannot automate. Sequenced before the Cloudinary work because both touch `db-deferred-list.md`.
3. **PR #11** (`claude/ci-setup-r4t8`) — merge `origin/main` in (30 behind), **add `v3-pre-release` to both the `push` and `pull_request` trigger lists**, confirm a green Actions run, merge, delete branch.
4. **Cloudinary write guard** (§4) — own branch, own PR to `main`.
5. **Cut `v3-pre-release`** off `main` and push it.

## §6 — Launch

- `v3-pre-release` → `main`; `package.json` `3.0.0-pre` → `3.0.0`; exactly one tag, `v3.0.0`.
- Drop the "Pre-Release" label and continue from `v3.0.0`.
- Introduce the v3 section in `CHANGELOG-SUMMARY.md` as a **collective** summary of what v3 introduces — not a replay of every pre-release entry.
- Delete `v3-pre-release` after the merge.
- MAJOR bumps are always asked separately. Deploy remains a separate, asked step.

**Open, deliberately: squash vs. merge commit.** The "one merged PR = one commit = one version = one tag" rule was written for feature PRs; applying it here collapses the entire v3 history into a single commit and removes any ability to bisect v3 work. A real merge commit preserves that history, and the tag marks exactly one release either way. **Decided at launch, not now** — by then the actual size and shape of the pre-release history will be known, which is the only thing that should drive the call.

## §7 — Documents this change touches

A standing rule is changing, so the "document" step applies even though no feature code ships:

- `docs/ROADMAP.md` — process/tooling section.
- Memory `project_dior_builds_changelog_system.md` — cherry-pick → merge, the `-pre` convention, no pre-release tags.
- Memory `project_git_workflow.md` and `CLAUDE.md`'s workflow invariant — the dual-base rule and the `gh pr create --base` footgun.
- `docs/CHANGELOG.md`, `docs/CHANGELOG-SUMMARY.md`, and a `docs/DEVLOG.md` entry.
- This spec.
