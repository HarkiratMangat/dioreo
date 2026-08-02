# Dior's Builds — CODM Discord Bot

## What this is
A Discord bot for Call of Duty Mobile (CODM) content: lucky draw info, patch notes, seasonal
calendars, CP pricing, weapon loadouts, and countdown timers. Built and maintained by Harkirat
(Discord ID `1139845545754632283`), the sole admin.

**Before doing anything else this session, read `~/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory/user_working_agreement.md`**
(start of `MEMORY.md`'s index) — it's the living summary of how Harkirat works and what this project
expects, with links to every other memory file. This CLAUDE.md **plus the `.claude/rules/*.md` files it
maps to** is the deepest source of truth for architecture/design decisions; the working agreement is the
collaboration layer on top of it.

### 📐 How this repo's context is organized (modularized 2026-07-22)
This root file used to be ~3,300 lines loaded in full every session. It's now **invariants + a
navigation map**. Subsystem detail lives in:
- **`.claude/rules/*.md`** — path-scoped rules that load into context **only when you read a matching
  file** (each has a `paths:` glob). Touch `utils/accentColor.js` → `accent-and-colors.md` loads; you
  don't pay for it otherwise.
- **`docs/` reference files** — read on demand (roadmap, deployment/ops, design history, known issues).
- The **🗺️ Navigation map** below is the index (and a permanent redirect for any older "see CLAUDE.md's
  X section" reference — the topic is findable here).

Full design + the section→destination ledger: `docs/superpowers/specs/2026-07-22-claude-md-modularization-design.md`.
*(Breadcrumb: the separate, INDEFINITELY PARKED cross-project memory-architecture redesign is unrelated to this repo-local
split and does not gate it — see the canonical-memory-path note below.)*

---

## 🔴 Hard invariants — never skip
*These stay physically in this root file on purpose: only project-root `CLAUDE.md` is re-injected after
`/compact`. Path-scoped rules reload only on the next matching file read, so a safety rule must never
live solely in one.*

### Canonical memory path
**⚠️ Canonical memory path — `~/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory/`.**
**Sanity test:** that directory must exist, contain `MEMORY.md`, and hold many `*.md` memory files.
Missing, empty, or no `MEMORY.md` → **you are at the wrong path.** Run `ls` and believe it.
> *No file count is quoted here on purpose.* A count in prose is a copy of state that nothing updates:
> it rots silently and then *becomes* the misinformation it was meant to catch — this file claimed "58"
> while the store held 59, and `docs/README.md` still called this file "~180 lines" at 287. The
> structural test above needs no maintenance and can't go stale. **Don't "helpfully" add a number back.**
Always read AND write memory there. This is the repo's **current** harness slug, so it is also where
Claude Code's native memory feature already looks — the path is correct *by default* now, not because
a session remembered to follow a pointer note.

**Migrated 2026-07-28 01:41 EDT from the old `-Applications-Diors-Builds` slug** (shipped v2.38.0).
Harkirat relocated the repo to `/Applications/Claude Code/Diors-Builds` on 2026-07-14 and the harness
derives the project folder from the repo path, so the store had been stranded at a slug the platform
never reads, bridged only by a redirect note in this file.
- **The old `-Applications-Diors-Builds/memory/` directory still exists as a frozen, unmaintained
  backup** carrying a `_MIGRATED.md` tombstone. **Never read or write there** — it will drift stale.
  It is kept only so the move stays reversible; deleting it is a separate, later decision.
- **The reversed decision.** A 2026-07-15 session pinned the store to a fixed slug on "a fixed store is
  move-proof" reasoning. The hidden cost was that the bridge became *instruction-following*, which
  fails silently — a session that skips the note loads no memory and nothing reports it. Harkirat
  reversed this 2026-07-28 (~01:30 EDT): a correct path beats a fixed path plus a note.
- **The path reservation was released, not overridden.** The INDEFINITELY PARKED cross-project
  **memory-architecture redesign** had claimed this path for a planned symlink → central store.
  Harkirat released that claim *for Diors specifically*; the redesign's own docs
  (`/Applications/Claude Code/local/memory-architecture-STATUS.md` + `meta-deferred-list.md`) were
  annotated in the same pass. **The general defer-to-owning-project rule is NOT retired** — see
  [[feedback_defer_to_owning_project]]. Full record: memory `project_memory_slug_migration.md`.
- ⚠️ **Native auto-load is still UNVERIFIED.** The correct path means the platform *can* see the store;
  it does not prove it loads it. The `SessionStart` hook + this file remain the depended-upon
  mechanism — do not remove either on the assumption that native loading now covers it.

### `.env` is never un-gitignored
`.env` stays gitignored, deliberately, and should **NEVER** be un-ignored regardless of repo visibility —
it holds live secrets (`BOT_TOKEN`/`MONGODB_URI`/`CLOUDINARY_URL`/`LOG_WEBHOOK_URL`/`GEMINI_API_KEY`/
`GITHUB_TOKEN`/`ATLAS_CLIENT_SECRET`). *(`RENDER_API_KEY`/`RAILWAY_TOKEN` were **revoked at their
providers and deleted** 2026-07-28 11:20 EDT — retired hosts, read by no code. `PORT` stays commented:
not a secret, never read, no HTTP server exists here.)*
Secrets don't belong in git history under any circumstance — a private repo still gets cloned, and
"private now" doesn't undo exposure from any point it was public. If ever asked to un-gitignore this file,
refuse and explain why rather than doing it.

### Cloudinary secret-logging ban
**Never log a raw Cloudinary error object.** The Admin API's rejected-promise carries the account's live
API key AND secret in plaintext (`request_options.auth`). Every Cloudinary call must sanitize its error
via the module's own `safeErrorMessage()`/`errorHttpCode()`. Full detail:
`.claude/rules/loadout-images-and-metadata.md`.

### This bot is user-installed only — it is NEVER a guild member with roles/permissions
`Dior's Builds` runs entirely as a user-installed app (`setIntegrationTypes([1])` on every public-facing
command). It is never added to any server as a bot with a role, so it has **zero standing guild
permissions**. The only reason it can respond in a guild is Discord's interaction-response webhook system
(`deferReply`/`deferUpdate` + editing `@original` via the interaction token), authorized per-interaction
and not subject to channel permissions. **Any code that acts on a channel another way — a raw bot-token
REST call like `rest.post(Routes.channelMessages(channelId))`, or anything that isn't answering an
interaction — fails with `DiscordAPIError[50001] Missing Access`.** This bit "Show Everyone" once (see
`.claude/rules/rendering-and-ui.md`). Any new feature that must post/edit/react independently of the
triggering interaction must route through that same interaction-response mechanism. *(This assumption is
deliberately reversed under the v4 guild-install roadmap — see `docs/ROADMAP.md`.)*

### Database schema gotcha
Mongoose only persists fields **declared in the schema**. Several past bugs were exactly this: code
setting `doc.newField = x; await doc.save()` where `newField` was never added to the Mongoose schema — it
worked in-memory but silently reverted on the next fresh fetch. **Whenever you add a new field anywhere,
add it to the corresponding schema in `models/` in the same change.** Full data-model detail:
`.claude/rules/models.md`.

### There is a LOCAL DEV BOT — use it, and never point it at prod (built 2026-07-26 13:45 EDT)
A **separate Discord application**, `Dioreo (Dev)` (`1529636846248919263`, renamed from `Dio (Dev)` — Harkirat plans to rename the
whole bot to "Dioreo" once v3 publicly launches, and started using the new name on the dev app first), exists purely to test changes
locally before they reach prod. Run it from the repo root with **`node --watch --env-file=.env.dev index.js`**
— it auto-restarts on every file save and branch switch, so any branch or PR can be tried live in Discord
in seconds. **Default to testing on it** instead of shipping untested or asking Harkirat to eyeball prod.
- **`.env.dev` is gitignored and is NOT prod's `.env`.** It carries the dev token, a LOCAL Mongo URI
  (`mongodb://localhost:27017/diors-builds-dev`), `NODE_ENV=development`, and its own alert webhook.
  **Never run a local instance with the PROD token** — prod is single-token, and a second connection on
  the same token makes Discord route interactions randomly between them (see `feedback_multiple_bot_instances`).
  Two instances on *different* tokens is fine and is the whole point. Prod's `.env` stays untouched and is
  still what a bare `node index.js` picks up, so always pass `--env-file=.env.dev` explicitly.
- **`dotenv.config()` at `index.js:38` runs AFTER `--env-file` and BACKFILLS anything the env-file omits.**
  So omitting a key from `.env.dev` does NOT unset it — it silently inherits prod's value. To disable
  something in dev you must set it **explicitly blank**, not leave it out. This bit the alert webhook once.
Full setup, the emoji/DB cloning, and the caveats: `docs/reference/deployment-and-ops.md`.

### Git workflow = Branch → Commit → Test (dev bot) → Push → PR → Merge → Deploy (adopted 2026-07-24 12:24 EDT; Test step added 2026-07-26 13:45 EDT)
Never push, merge, or deploy without asking first — approval never carries over (branch commits and
**running the local dev bot** are the exceptions: free, no approval needed). **Version is minted at MERGE (squash), not push.** The bot runs
on a **GCP Compute Engine VM** (`diors-builds-bot`, e2-micro, `us-east1-b`) under **systemd** (unit
`diors-bot`, auto-restart on crash + reboot). Lifecycle: branch off `main` (free) → commit checkpoints on
the branch (free) → push the branch (asked) → `gh pr create` (draft only if a test/review gap exists) →
**final pre-merge checkpoint ON THE BRANCH** (changelog entry citing `(#PR)` with **no hash** + the
`package.json` bump + backfill the *previous* entry's hash — free, no approval) →
`gh pr merge --squash --delete-branch` → `git tag -a vX.Y.Z <squash-sha>` (asked — the merge-yes IS the
version-number-yes; MAJOR always asked separately) → **deploy**, a separate optional step: on the VM, `./scripts/deploy.sh`
(`git pull` → restart) → verify `scripts/vmstatus.sh` (asked). **A merge alone does NOT update the VM** —
a merged version can sit undeployed indefinitely; say plainly which steps happened ("merged v2.x, deploy
held"), never let "merged" imply "live."
**Close out the merge by refreshing the local refs — no checkout required:**
`git fetch origin main:main v3-pre-release:v3-pre-release` writes them directly, and git *refuses* the
refspec if that branch is checked out, so it can never disturb a working tree another session is using.
Leaving them behind was mistaken for real drift once (v2.42.1). **A `behind` marker in `git branch -vv`
is a fact about the local clone, never about the remote** — report actual branch sync from
`git rev-list --left-right --count origin/main...origin/v3-pre-release` (`0 0` = identical).
**⚠️ ONE commit + ONE tag per release — never a follow-up `chore(release): finalize …` commit
(retired 2026-07-27 21:27 EDT, v2.36.0).** The bump and changelog entry go on the BRANCH, before the
merge, so they fold into the squash commit and the tag lands on a commit whose `package.json` already
reads the tagged version. **Bumping after the merge is the exact bug that produced 16 two-commit releases
(v2.33.0–v2.35.15)** — if you find yourself about to commit on `main` after merging, stop. The commit hash
cannot go in its own entry, so it is backfilled one release later, additively, on the next release's
branch — **never by `--amend`, never by force-push.** The newest changelog entry having no hash is correct.
Full lifecycle, versioning, and doc-placement rules:
`docs/superpowers/specs/2026-07-24-git-branch-pr-workflow-design.md` + memory `project_git_workflow.md`.
Full VM/ops setup, alerting, monitoring, version-tagging: `docs/reference/deployment-and-ops.md`.
**Commit subjects and PR titles follow Conventional Commits v1.0.0 as specified** —
`<type>(<optional scope>): <description>`, colon **and one space** (REQUIRED by spec rule 1), imperative,
lowercase, no trailing period; `!` before the colon for breaking. Only the 11 standard types
(`feat` `fix` `docs` `refactor` `perf` `style` `test` `build` `ci` `chore` `revert`) — never `deps`,
`release`, `sec`, `wip`, `types`, `i18n`. **Branch names** are separate (the spec doesn't govern them):
`<type>/<kebab-description>`. **Never rename a branch that has an open PR** — GitHub auto-closes it and it
cannot be reopened. Vocabulary, mappings, and rationale: `docs/reference/commit-and-branch-naming.md`.

**Every commit trailer includes a real second-account co-author (adopted 2026-07-28 18:30 EDT).**
Harkirat's primary account (`dior`, author on every commit) has a second, genuinely separate GitHub
account, `diorswrld` (id `310361322`), created specifically to co-author commits for real. Every
commit should end with:
```
Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Co-Authored-By: diorswrld <310361322+diorswrld@users.noreply.github.com>
```
(swap the Claude line's model name/id for whichever model is actually running that session; the
Claude line is cosmetic for badge purposes — `noreply@anthropic.com` DOES link to a real account
(`github.com/claude`, Anthropic's shared bot, verified via `gh api users/claude`) but empirically
never grants Pair Extraordinaire to the human co-author: dozens of merged Diors-Builds PRs already
carry that exact trailer and `HarkiratMangat`'s profile still shows zero (checked 2026-07-28 18:30
EDT), almost certainly an anti-gaming filter on shared/platform-bot accounts, same principle as Pull
Shark excluding your own repo). **The `diorswrld` line is the one that matters**: it's a real,
distinct *personal* account (verified — different numeric id than `dior`/`HarkiratMangat`), so it satisfies
GitHub's Pair Extraordinaire requirement for real, unlike the earlier same-account attempt (see
`feedback_git_commit_identity` memory for that history — this supersedes it). Badge tiers need
volume (default 1 / bronze 10 / silver 24 / gold 48 co-authored commits merged), so keep this on
every commit going forward, not just one.

**⚠️ Two bases now exist — pick the right one, `gh pr create` will not (added 2026-07-27 18:05 EDT).**
v3 work lives on the long-lived **`v3-pre-release`** integration branch, not `main`. So a v3 feature is
`feat/x` off `v3-pre-release` → **`gh pr create --base v3-pre-release`**. `gh` defaults to `--base main`,
and a v3 PR merged there puts unfinished v3 code on the branch that must stay live-safe — it fails
silently, nothing warns. v2 hotfixes are unchanged: off `main`, into `main`. **Sync is one-way,
`main` → `v3-pre-release`, by `git merge origin/main` — never cherry-pick**
**⚠️ Cadence: after EVERY merge to `main`** — this is now automated by
`.github/workflows/sync-v3-pre-release.yml`, which merges and pushes on each push to `main` and **fails
loudly on conflict** (resolve by hand from the branch; never cherry-pick your way out). The rule used to
document only the *mechanism* and never the *trigger*, in four separate places — so it happened only when
someone noticed, and the branch was found **two releases behind at v2.35.15 on 2026-07-27 22:00 EDT**,
missing the very release conventions it must follow. If that workflow is ever removed, the manual step
returns and belongs in the merge checklist. (a cherry-pick doesn't
advance the merge base, so the same conflicts return on every later sync). During pre-release,
`docs/CHANGELOG.md` only (`Pre-Release v3.MAJOR.MINOR`), `package.json` carries a matching `-pre`
suffix, and **no tags are minted until `v3.0.0`**. Full design:
`docs/superpowers/specs/2026-07-27-v3-development-structure-design.md`.

**`git branch -a` is not a reliable view of open work.** This repo has GitHub's auto-delete-on-merge
enabled and a plain `git fetch` does **not** prune remote-tracking refs, so long-merged branches keep
listing locally as though they were live. Use `gh pr list --state all`, or `git fetch --prune` first.
**Merge with `gh pr merge --squash --delete-branch`** so the branch dies with its PR — the flag removes
the local branch too, which auto-delete-on-merge does not. Without it they silently pile up: **10 merged
branches were found rotting on 2026-07-27 21:50 EDT**, the oldest from PR #11, all long since merged.
A merged branch must never outlive its PR. Two hooks in `.claude/settings.json` (tracked, so they survive a fresh clone) now enforce this —
a `SessionStart` check that fetches with `--prune` and lists any `[gone]` branch, and a `PostToolUse`
check that fires when a `gh pr merge` runs without `--delete-branch`.

**⚠️ Never chain `git tag` onto `gh pr merge` in one `&&` sequence.** `gh pr merge` fails when checks are
`UNSTABLE`, and piping it to `tail`/`head` masks the failure (a pipeline exits with the *last* command's
status), so the chain runs on, `main` never advanced, and the tag lands on the **previous** release —
exactly what happened 2026-07-27 22:10 EDT, producing a pushed `v2.36.2` on a commit reading `2.36.1`.
Merge, **verify `git log -1` shows this release**, then tag. A third `PreToolUse` hook gates
`git tag -a vX.Y.Z <sha>` when the target's `package.json` ≠ the tag. See memory
`feedback_pipe_masks_exit_status`.

✅ **These hooks live in `.claude/settings.json`, which is TRACKED** — they ride in PRs and survive a
fresh clone or a worktree. *(Promoted 2026-07-28 12:45 EDT. They previously sat in the gitignored
`.claude/settings.local.json`, which meant the enforcement layer was unrecoverable and had to be
re-added by hand; that is no longer true.)* `settings.local.json` is now **tracked too** (un-ignored
2026-07-28 13:10 EDT) and holds **only machine-specific permissions**. Note it needed an explicit
`!.claude/settings.local.json` negation in `.gitignore`, because the GLOBAL `~/.config/git/ignore`
ignores that filename in every repo on this machine — removing the repo-level pattern alone did nothing. **Put any new hook in
`settings.json`, never in the local file**, or it silently becomes unrecoverable again.

### Maintaining context comments — please keep doing this
This codebase has inline comments explaining **why** something is written a certain way, not just what it
does — especially around fixed bugs, Discord platform quirks, and non-obvious decisions. When you edit a
file: keep existing context comments accurate (update/remove them if your change makes them stale, don't
leave outdated explanations next to new code); add a comment in the same style when you fix a bug, make a
non-obvious choice, or work around a platform limitation; prefer explaining *reasoning* over narrating
*what* the code does line-by-line.

---

## ⚡ Platform cheat-sheet
*Condensed, high-blast-radius gotchas kept always-on. Full detail + history in the linked rules.*

- **Components V2 (`flags: 32768`)** — (1) selects/buttons still need an Action Row (type 1) wrapper even
  inside a Container; (2) **40 total components per message, counted recursively** (real production crash
  when exceeded — chunk long lists); (3) buttons can't have custom hex (only 5 native styles; Container
  `accent_color` does support hex); (4) a button `label` is plain text — emoji goes through the `emoji:`
  field, not the label string. Full: `.claude/rules/rendering-and-ui.md`.
- **Crash resilience** — `index.js`'s `interactionCreate` is wrapped in one top-level try/catch; a
  `client.on('error', ...)` listener MUST stay registered (discord.js `captureRejections` reroutes async
  rejections to a client `error` event that otherwise crashes the process, bypassing the try/catch); any
  `return interaction.reply/editReply/followUp(...)` in an error branch MUST be awaited. Full:
  `.claude/rules/interaction-router.md`.
- **Synthetic interactions** — a button/select re-invoking a slash command's `execute()` MUST use
  `buildSyntheticInteraction(interaction, overrides)`, never `Object.assign` (it drops the non-enumerable
  `client`/`token`, a real past crash). Full: `.claude/rules/interaction-router.md`.
- **V2 sends** — discord.js's high-level reply/followUp/update don't serialize raw V2 JSON; use
  `sendV2Payload(interaction, components, opts)` (raw `rest.patch(@original)`). Full:
  `.claude/rules/rendering-and-ui.md`.

---

## 🗺️ Navigation map
*Every subsystem's detail, and the redirect target for any older "see CLAUDE.md's X section" reference.*

### `.claude/rules/` — load automatically when you touch matching code
| Rule file | Loads when you touch… | Covers |
|---|---|---|
| `commands-overview.md` | any `commands/*.js` | command list & routing conventions · user-install/DM per-command · `/timestamp` (style dropdown + `view`) · loadout `build`/`private` options |
| `manage-panel.md` | `commands/manage.js` | the `/manage` admin panel (pages, add/bulk/edit/delete, purge, export, patch-notes single-entry) · per-page accent colors · `/manage` admin-only lock |
| `settings-and-expiry.md` | `commands/settings.js`, `utils/passiveExpiry.js` | `/settings` author-lock · passive idle-timeout auto-disable · admin override on per-user panels · region-mode |
| `interaction-router.md` | `index.js` | crash resilience · synthetic-interaction pattern · anti-spam cooldown · `NAV_COMMAND_ALIASES` / command routing |
| `rendering-and-ui.md` | shared render utils (`sendV2Payload`, `titleBlock`, `paginationRow`, `globalNav`, `ephemeral`, `emojiMap`, `shareButton`) | Components V2 lessons · shared UI builders · pagination row (2-page loop-back crash fix) · "Show Everyone" · live nav-order→`PRESET_ACCENT` color map |
| `accent-and-colors.md` | color utils, `commands/colors.js`, `commands/settings.js` | accent-color system (avatar/banner/displayName/dynamicProfile) · "View Colors" k-means panel · Refresh Colors · still-frame extraction |
| `loadouts.md` | `utils/loadoutRender.js`, `utils/search.js`, `commands/dmz.js`, `models/Loadout.js` | MP/DMZ loadout system · per-category accents · badges · autocomplete + category-synonym search · Browse-other-builds dropdown |
| `loadout-images-and-metadata.md` | Cloudinary cache utils (`cloudinaryCache`, `patchNotesCache`, `loadoutImageCache`) | draw-thumbnail + patch-notes image caching · the loadout image workflow · Cloudinary structured metadata · **Cloudinary secret-logging ban** |
| `autobuild.md` | `commands/autobuild.js`, `utils/autobuildPipeline.js`, `utils/visionExtract.js` | `/autobuild` PoC · Gemini→Vertex AI migration · Antigravity handoff history · live-test fixes · open follow-ups |
| `draw-prices.md` | `commands/drawprices.js` | `/draw prices` data model + final layout · Advanced Double Legendary page |
| `design-decisions.md` | parser/timestamp utils, calendar/patchnotes/seasonend/draws commands, `UserPreference` | the "don't re-litigate these" log (visibility Option A, admin-date UTC, chrono noon, bulk formats, title-casing, All-Season calendar, patch-note title sync, `/draw prices` rewrite, color map, emoji sourcing) |
| `models.md` | `models/**` | data models · the schema-save gotcha (full) |
| `scripts-and-migrations.md` | `scripts/**` | pointer map: which subsystem rule documents each script |
| `legal-site.md` | `scripts/buildLegalPages.js`, `scripts/lib/chronicle.js`, `public/**`, `docs/legal/**`, `LICENSE`, `NOTICE`, `CONTRIBUTING.md`, `CONTRIBUTORS.md` | the published site: three page families and their voices · the measured nav staging · the metaball constants · the build's gate roster · sticky headings · a11y + contrast |

### `docs/` — read on demand (planning / ops / history; not code-triggered)
| File | Covers |
|---|---|
| `docs/ROADMAP.md` | **authoritative roadmap** (v2 remaining · v3 · v4 · v5 · housekeeping). The changelog roadmap sections are synced VIEWS of it. The [GitHub Projects board](https://github.com/users/HarkiratMangat/projects/2) (created 2026-07-25 21:35 EDT) is a lightweight visual tracker manually refreshed FROM this file, never the reverse — see docs/README.md's "How they relate" section. |
| `docs/reference/deployment-and-ops.md` | Stack · GCP VM / systemd / alerting / monitoring · version tagging · **the local dev bot** (`Dioreo (Dev)`, `.env.dev`, local Mongo, `--watch`, emoji/data cloning) |
| `docs/reference/known-issues.md` | known open issues (flagged, not silently patched) |
| `docs/reference/design-history.md` | narrative of the 2026-07-12/13 redesign passes · color-repalette story |
| `docs/legal/TERMS.md` · `docs/legal/PRIVACY.md` | the bot's **public-facing** Terms of Service + Privacy Policy (v1.0, 2026-07-28 21:36 EDT). **Discord REQUIRES both to be publicly linked in the Developer Portal.** The privacy policy documents the real `UserPreference` fields — if you add, remove, or repurpose a stored field, update Appendix A and §2 in the SAME change, or the policy becomes a false statement about live data collection. |

### 🌐 `public/` — the built legal site, GENERATED not hand-edited (added 2026-07-29 13:20 EDT)
`public/**/*.html` is **build output**, deployed to Cloudflare Pages so the
Discord Developer Portal has stable public URLs that survive the repo flipping private. The sources are
`docs/legal/*.md`, the four root documents (`LICENSE`, `NOTICE`, `CONTRIBUTING.md`,
`CONTRIBUTORS.md`), **and the three records `docs/CHANGELOG-SUMMARY.md`, `docs/CHANGELOG.md`,
`docs/DEVLOG.md`**; the HTML is produced by `scripts/buildLegalPages.js`.
**Run `dior legal build` after editing ANY of those nine sources** — nothing else regenerates
`public/`, and `dior legal check` compares live bytes against the local build.

⚠️ **PUBLISHING IS AUTOMATIC NOW — do not deploy by hand as a matter of course**
(`.github/workflows/deploy-site.yml`, added 2026-08-02 01:30 EDT). A merge to `main` that touches the
site publishes it to Cloudflare Pages on its own. **It deliberately does NOT fire for
changelog/devlog-only changes**: those three pages are withdrawn from the nav, so republishing the
whole site for a page nobody can reach is waste. The workflow rebuilds and refuses to publish if
`public/` is stale, then asserts the live `<title>` matches what it just uploaded — a 200 alone can be
cache. `dior legal deploy` still exists for a manual push, and `workflow_dispatch` does the same from
CI. This was added because the live site was found serving the previous headline **after v2.47.0 had
merged and been tagged**: `public/` was correct in `main` and nothing ever pushed it anywhere.
- ⚠️ **THERE ARE TWO BUILD ENTRY POINTS AND THAT IS A KNOWN WART, not a design.** `npm run site` was
  added 2026-08-01 22:20 EDT without checking that `dior legal build` already existed and ran the same builder,
  and this section was rewritten to name the new one — demoting a working CLI command. Both call
  `scripts/buildLegalPages.js`, so their **output cannot differ**. The one real difference:
  `npm run site` runs `node --check` on both build scripts first; **`dior legal build`/`deploy` do
  not.** That protection is therefore on the path that does *not* publish. Until consolidated, use
  `dior legal *` as the normal path and `npm run site` when the CLI isn't available (CI, a fresh
  clone, a worktree) or when you specifically want the syntax pre-check. Filed as `[P2 · M]` in
  `/Applications/Claude Code/meta-deferred-list.md` → Cross-project / meta.
- ⚠️ **Before adding any project-local script or npm command, check whether the `dior` CLI already
  does it** (`dior help`, or `~/.config/dior/*.zsh`). The CLI wraps this project's dev/deploy/
  observability workflow and is easy to forget because it lives outside the repo — see memory
  `project_dior_cli_repo`. This wart is exactly what skipping that check produces.
Editing a source and re-running the build is the ENTIRE update path; no HTML is ever touched by hand.
⚠️ The script is still called `buildLegalPages.js` but now builds the whole site, `public/legal/` **and**
`public/changelog/`. The name is kept because `dior legal deploy`/`check` in the CLI repo, the rules
file, and this section all reference it; renaming it is a separate change that has to move all four.
- ⚠️ **Never hand-edit a file in `public/`** — the next build overwrites it. Change the Markdown or
  the generator, re-run the build, commit both. `public/` is committed on purpose: Cloudflare Pages
  serves it directly with an empty build command, so nothing has to run on their side. **This one
  line is repeated in the rule file too, because only the project-root file survives `/compact`.**
- 📄 **Everything else about this subsystem lives in `.claude/rules/legal-site.md`**, which loads
  automatically when you touch the generator, `public/**`, or any of the nine sources — the three
  page families and their voices, the measured nav staging, the metaball constants, the build's
  gate roster, the sticky headings, the a11y and contrast rules, and every trap already paid for.
  It was moved there 2026-08-01 23:40 EDT: it had reached 286 lines here, 43% of a root file that
  is loaded in full on every session, most of which never touch the site.

### ⚖️ Licensing — source-available, NOT open source (added 2026-07-28 21:36 EDT)
`LICENSE` is the custom **Dior's Builds Source-Available License v1.0**: read/study/audit and
**local single-user** running are permitted; deploying anywhere another person can use it,
redistributing, commercial use, competing services, Curated-Data extraction, and AI/ML training are
all prohibited. `package.json` declares `LicenseRef-Diors-Builds-Source-Available-1.0` and
`"private": true` (guards against an accidental `npm publish`).
- **`package.json` said `"license": "ISC"` until 2026-07-28 21:36 EDT** — a permissive licence that contradicted
  every intention here, on a PUBLIC repo, with no LICENSE file present. **Never "helpfully" restore a
  standard OSI licence** (MIT/ISC/Apache) or describe this project as open source.
- **The repo is public, so GitHub ToS §D.5 lets anyone fork it on GitHub and that cannot be revoked**
  while it stays public. That right is confined to reproduction *on GitHub* — it grants no
  derivative-work or off-GitHub redistribution right, which is why `LICENSE` §4.2 carves the fork out
  explicitly rather than pretending to ban it.
- Contributions are governed by the CLA in `LICENSE` §5 + `CONTRIBUTING.md`; credit is a **binding
  obligation** (§5.6) discharged via `CONTRIBUTORS.md` **and** the changelog entry for the shipping
  release. Crediting a merged external contribution is not optional.
- **`NOTICE` is incorporated into `LICENSE` by reference** (§7.1) and carries the dependency
  attributions, trademark acknowledgements, and the **AI-assistance disclosure**. **discord.js and
  xlsx are Apache-2.0**, which obliges anyone redistributing them to reproduce their notices — that
  duty attaches upstream and survives regardless of what `LICENSE` permits. **Re-generate NOTICE §1/§3
  whenever dependencies change**, and re-check that no GPL/AGPL/LGPL/MPL/SSPL package has entered the
  tree — a reciprocal licence anywhere in it could force source publication on terms incompatible with
  the source-available model. (Verified clean 2026-07-28 21:36 EDT: 127 packages, 0 copyleft.)
- **`NOTICE` §6 asserts human authorship**, which matters more than it looks: the licence's force
  depends on copyright subsisting, and purely AI-generated material is not copyrightable (US Copyright
  Office; cert denied 2026-03-02). Never edit that section to downplay the human creative control —
  it is the stated basis for the copyright claim the whole licence rests on.

### Records & workflow (outside the rules system)
- **`LICENSE` / `CONTRIBUTING.md` / `CONTRIBUTORS.md`** (repo root) — licence terms + CLA, the
  contributor guide, and the credit ledger. See the licensing block above.
- **`SECURITY.md`** (repo root, **deliberately NOT published to the site**) — the vulnerability
  reporting route, the §4.11 testing limits restated, scope, and an explicit "no SLA" statement.
  It stays repo-only because GitHub's private "Report a vulnerability" flow reads it from there;
  the route is published to readers via the `/security` redirect, which points at the Contributing
  page's security section. **If you add a stored field, a new host, or a new third-party service,
  re-check its Scope section** — an out-of-scope list that silently goes stale invites reports
  against infrastructure that is not ours to test.
- **`docs/README.md`** — the documentation map (which record file does what, the per-push chore checklist).
- **`npm run docs:audit`** (`scripts/docs-audit.mjs`) — **run this before opening a PR; it is also a CI
  gate.** `--list` prints the current roster; it covers the records: doc map · cross-references · version coverage across all three
  changelogs · changelog hash-chain · DEVLOG TOC · tag integrity · **record structure** (no repeated
  top-level heading — added 2026-08-01 after a commit spliced CHANGELOG's own 183-line header into the
  middle of an entry and every other check passed, because none of them look at a file's SHAPE) · and
  the **conservation rule** (an
  item leaves an active list ONLY by appearing in its archive — a shrink with no matching grow means
  it was *deleted*, not swept). `ERROR` fails, `WARN` never blocks. `npm run docs:audit:test` proves
  each check can actually fail. Added 2026-07-28 21:00 EDT because "not checkable" had twice been
  written down about records that were perfectly checkable — see memory
  `feedback_not_checkable_is_usually_unexamined`.
- **`docs/CHANGELOG.md` / `docs/CHANGELOG-SUMMARY.md` / `docs/DEVLOG.md`** — release log / player-facing
  "what's new" / narrative journey + lessons.
- **`docs/diors-builds notes.md`** — Harkirat's intake scratchpad (mark items in-file the same session).
  Resolved + ℋ-confirmed items sweep out to `docs/archive/graveyard.md`, not to a section inside it.
- **`docs/SESSION-START.md`** — the auto-loaded session-start prompt + NON-NEGOTIABLES glossary.
- **Memory** — `~/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory/` (start at `user_working_agreement.md`).
- **`docs/db-deferred-list.md`** — **this project's own deferred work**: 🐞 Active Bugs · 🔔 Reminders ·
  🗂️ Queued (own-session features) · 🧹 Someday/tech-debt · 🚫 Decided-no. If a session working only in
  this repo would need it, it's here. (Split out of the cross-project tracker 2026-07-25 15:56 EDT;
  renamed + completed 2026-07-25 21:43 EDT, when its bugs/reminders/resolved items finally moved in too.)
- **`docs/archive/`** — dead archive, **don't read by default**: `graveyard.md` (swept intake from the
  notes file — it is no longer a section inside that file) · `resolved-list.md` (closed items from
  `db-deferred-list.md`) · the dated pre-tidy notes snapshot.
- **`/Applications/Claude Code/meta-deferred-list.md`** — cross-project tracker ONLY: cross-project bugs
  (the MarkEdit extensions), Claude/Anthropic product feedback, meta/architecture work, and the canonical
  Priority·Effort legend. Anything Dior's-Builds-specific belongs in `docs/db-deferred-list.md` above.

---

## Local-only files & the `local/` folder vs. `docs/` (tracked)
- **`local/`** (repo root, **gitignored**) — Harkirat's personal scratch folder: the `project plan notes.txt`
  future-planning dump, reference screenshots/PDFs, and anything else he drops in. **his private space file actually lives at `docs/Harkirats-Space.md`** (gitignored there by name — corrected 2026-07-28 22:55 EDT;
  this file and the notes file had both said `local/` since the v2.35.3-era move, while `.gitignore` was
  updated and they were not) (private — off-limits unless
  he grants permission that session), and anything else he drops in. Never pushed, never deployed. When he
  references "the plan notes" / a file he "threw in there," check `local/` first.
- **`docs/`** (repo root, **TRACKED in git**) — the project's own working documents: `CHANGELOG.md`,
  `CHANGELOG-SUMMARY.md`, `DEVLOG.md`, `SESSION-START.md`, `ROADMAP.md`, `README.md`, `reference/`, and the
  central `diors-builds notes.md` (+ `archive/`). Un-gitignored at Harkirat's explicit request so a
  real `git diff`/`git log` covers their history. ⚠️ **Two `SessionStart` hooks in `.claude/settings.json` PARSE these
  files**, so a rename or a structural edit to either is a code change: one reads `docs/SESSION-START.md`
  by path, the other counts open items in `docs/diors-builds notes.md` by scanning from `## Questions` to
  `## 📍`. If either file moves, or the notes file's section headings change, **update the hook in the SAME
  change and dry-run it** (the `# Graveyard` anchor it used before 2026-07-25 21:43 EDT was removed by the
  archive split and would have silently un-bounded the scan). Since 2026-07-28 12:45 EDT these hooks live
  in **tracked** `.claude/settings.json`, so a hook fix DOES ride in the PR — fix it in the same change.

## Stack (summary)
discord.js v14 (`^14.26.4`) · Node.js (v24 on the VM) · MongoDB Atlas via Mongoose · `chrono-node`
(admin date parsing) · `dayjs` (user-facing timestamps) · `jimp` (pure-JS accent-color extraction) ·
`ffmpeg` (system binary on `PATH` — `utils/stillFrame.js` uses it for APNG/animated frames) ·
`color-namer` (hex→name) · `cloudinary` (image caching/upload). `xlsx` is NOT used at runtime anymore
(only `scripts/migrateBuildsToMongo.js`) and now sits in **`devDependencies`** (moved 2026-07-26 19:19 EDT) — a
production-only `npm install --omit=dev` would drop it, which is correct, but that also means that one
migration script needs a full install to run. Full stack notes + why-each + the retired Render/Railway
history: `docs/reference/deployment-and-ops.md`.
