# Deferred list — Dior's Builds (`db-deferred-list.md`)

**Dior's Builds' own deferred work**: confirmed bugs, time/condition reminders, the maintenance /
tech-debt long-tail, and the handful of features big enough to warrant their own dedicated session.
If a session working *only* in this repo would need to know it, it belongs here.

**History:** split out of the cross-project tracker on **2026-07-25 15:56 EDT** (tracked in-repo, so it
gets real `git diff`/`git log` history like the rest of `docs/`), then **renamed and completed
2026-07-25 21:43 EDT** — that first pass moved only the tech-debt list and left this project's bugs,
reminders, and resolved items sitting in the cross-project file, which defeated the point. This pass
pulled all of them in, added the priority legend, and moved resolved entries out to
`docs/archive/resolved-list.md`. `deferred-items.md` → `db-deferred-list.md`; the cross-project file is
now `/Applications/Claude Code/meta-deferred-list.md`.

## What is NOT in this file
- **The feature roadmap** — `docs/ROADMAP.md` is authoritative (v2 remaining · v3 · v4 · v5 ·
  housekeeping). This file is deliberately NOT a copy of it: pointer, not duplicate.
  **⇄ Reality check 2026-07-27 19:45 EDT:** 7 items were found in BOTH files, so "not a copy" was not
  holding on its own. Each now carries a `⇄` cross-reference to its twin. Division of labour:
  **ROADMAP = which version it belongs to; this file = size, decided design, and when it gets a
  session.** Appearing in both is allowed — appearing in both *without* the `⇄` marker is the bug.
- **Resolved / dropped items** — `docs/archive/resolved-list.md` (except standing 🚫 decided-no calls,
  which stay below on purpose so nobody re-raises them).
- **Cross-project work, MarkEdit-extension bugs, Claude/Anthropic product feedback** —
  `/Applications/Claude Code/meta-deferred-list.md`.
- **Design gaps we're knowingly living with** — `docs/reference/known-issues.md`.

## 🏷️ Priority & effort tags
Every OPEN item carries `[Priority · Effort]` (+ optional flags). Two axes: one for *what to focus on*,
one for *what can be bundled cheaply*. Resolved items don't need one.
- **Priority** (urgency + impact + risk + blocking): **P0** now (broken+user-facing / blocking / due) ·
  **P1** soon (clear value, no reason to wait) · **P2** eventually (real, not pressing) · **P3** someday/parked.
- **Effort** (scope; carries model+effort for real builds): **XS** minutes · **S** part of a session ·
  **M** a session · **L** its own big/multi-session job.
- **Flags:** 🔗 bundle-with:\<what\> · 🧩 needs-design · ⛓️ blocked-by/blocks:\<what\>.
- **Combos:** P0/P1+XS/S = quick win (do now / bundle) · P1+L = schedule its own session · P2+XS/S =
  bundle-only · P3 = ignore till relevant.

Full spec: `reference_priority_tier_system` memory. Canonical copy of this legend:
`/Applications/Claude Code/meta-deferred-list.md`.

**Model tags refreshed 2026-07-25 21:43 EDT:** every `Opus4.8-*` tag was rewritten to the equivalent
`Opus5-*` — the tier mapping is direct and Opus 4.8 is superseded, so the old tags were pointing at a
model Harkirat no longer runs. Effort letters (H/M/L) unchanged.

---

## 🐞 Active Bugs — broken behaviour, not yet fixed
*Moved in from the cross-project tracker's 🐞 section 2026-07-25 21:43 EDT. **Rule:** the moment a bot bug
is reported or found, it lands here with a repro + a `[Priority · Effort]` tag (most start P0); it only
leaves when fixed (→ `docs/archive/resolved-list.md`) or proven not-a-bug. A session that touches a
buggy area checks here FIRST — this section exists because the `/manage` Edit bug once sat buried in a
scratchpad for 2 days.*

**None open right now.** The last confirmed bot bug (the `/manage` Edit-loadout timeout) was fixed in
v2.20.0 — see `docs/archive/resolved-list.md`.

*Not bot bugs, so they live in `meta-deferred-list.md` instead: the MarkEdit-extension cluster
(Return-key blank line, confirm-mark space glitch). They're editor tooling outside every repo, even
though the Return-key one only reproduces in this repo's notes file.*

---

## 🔔 Reminders / watch-for
*Time- or condition-based — not "do this now," but things not to forget when the trigger hits. Tagged
with the priority they'll BE at when the trigger fires. Moved in from the cross-project tracker
2026-07-25 21:43 EDT.*

- `[P1 · XS · Harkirat action, not a build]` **Finish the GitHub Projects roadmap board's view setup.**
  Added 2026-07-26 12:12 EDT. The board (https://github.com/users/HarkiratMangat/projects/2) has all 15
  items and every custom field (`Status`/`Priority`/`Effort`/`Model suggestion`/`Flags`) populated via the
  API, but GitHub's GraphQL API has NO view-creation/management mutations at all (confirmed via
  introspection) — so it still only has the one default view GitHub creates automatically (`View 1`,
  Table layout). Two manual steps in the GitHub UI finish the design agreed on earlier:
  1. Open the board → click **View 1**'s dropdown (or the view tab itself) → **Edit layout** → change
     layout from **Table** to **Board** → set **Group by: Status** → rename the view (double-click its
     tab, or the "..." menu → Rename) to something like **"Status board."**
  2. Click the **+** next to the view tabs → **New view** → keep layout **Table** → name it **"By
     Priority"** → set **Group by: Priority**.

  Both are a couple minutes total, no data changes, purely view/display config. Nothing else is pending
  on the board itself.
- `[P2 · XS · passive watch]` **Watch that GCP holds long-term.** Cutover was 2026-07-17; the Discord
  alerting + `scripts/vmstatus.sh` are the watch mechanism. The original "staying green through
  ~2026-07-24" checkpoint has passed with no incident recorded in the alert log or DEVLOG — but that's
  absence-of-record, not a positive health check, so confirm live with `scripts/vmstatus.sh` before
  treating it as the green light for the Render deletion above.
- `[P2 · S · admin-only impact, not urgent]` **Live-test the `/manage` loadout UX overhaul (v2.23.0) +
  `/settings` passive idle-timeout (v2.22.0) in real Discord.** Both deployed live to the GCP VM
  2026-07-19 (confirmed via `scripts/vmstatus.sh`), neither behaviorally click-tested by Harkirat yet.
  For loadouts: run through Add/Edit/Bulk Add on `/manage`, confirm the new "How Images Work" info block
  + field placeholders read right, and confirm `checkImageExists()` actually warns on a
  deliberately-wrong Cloudinary key. For settings: open `/settings`, leave it untouched the full 10
  minutes, confirm the buttons go dead with zero clicks. Explicitly deprioritized by Harkirat himself
  (2026-07-19) — admin-only surface, doesn't affect normal user-facing commands. Remove once he's
  actually run through both. **Bundle candidate:** the `/manage` per-slot-metadata fix shipped
  2026-07-24 18:07 EDT is also awaiting one real click-through, so test them in the same sitting.
- `[P2 · passive watch · Claude's own call, not Harkirat's ask]` **Revisit splitting `docs/CHANGELOG.md`
  / `docs/DEVLOG.md` into an active + archive file.** ⚠️ **Re-measured 2026-07-25 21:43 EDT: CHANGELOG
  is 1,366 lines and DEVLOG 1,792** — the original note said "~730 lines each as of 2026-07-18, not
  there yet," so both have roughly doubled and the "not there yet" judgement is stale. Bumped P3 → P2
  on that basis; still Claude's own call, not something Harkirat asked for. Harkirat explicitly said
  **not** to add a maintained ToC to these (their `## vX.Y.Z` / `## YYYY-MM-DD` headers are already
  uniform and grep-able, so a ToC would duplicate that for no gain — unlike CLAUDE.md's ToC, which
  earned its keep on non-uniform prose headings); the archive-split is the actual lever. He explicitly
  asked to be reminded of this since it's easy to forget. 🔗 Natural bundle with the `.claude/rules/`
  two-tier rework below — same "split always-on bulk into on-demand detail" shape.

---

## 🗂️ Queued — worth its own dedicated session
*Real, self-contained builds; spin each up as its own session at the tagged setup. **Two are P1 now** —
the 2026-07-18 "all P2, none urgent right now" call has been overtaken by items added since.*

- `[P1 · L · Opus5-H · 🧩needs-design]` **Line-by-line audit + restructure of the entire documentation,
  memory, and enforcement surface.** Added 2026-07-27 22:35 EDT (Harkirat's ask). **Goal: everything
  *correct and current*.** These files have grown substantially and a great deal changed in the last
  week — the v2.36.x release-convention overhaul alone touched 8 repo docs, 4 memories, and 3 hooks — so
  they are due a proper inspection rather than another incremental patch.
  **Scope — read every file, line by line, not just grep:** `CLAUDE.md` · all `.claude/rules/*.md` ·
  every `docs/` file incl. `reference/`, `superpowers/specs/`, and the archives · all 58 memory files +
  `MEMORY.md` · `docs/SESSION-START.md` · the hooks and nudges in `.claude/settings.local.json` ·
  `.github/workflows/` · the working agreement and every feedback/reference/preference memory.
  **Check for:** stale content (claims that were true once) · gaps and missing pieces · outright
  mistakes/errors · things not caught up with recent changes · broken or missing cross-links and
  `[[wikilinks]]` · duplicated content that has drifted apart between copies · contradictions *between*
  files and *within* a single file · counts/numbers that rot (the `CLAUDE.md` memory-file count has been
  wrong at least 3 times) · rules stated as prose that should be hooks · and anything else worth flagging
  that isn't listed here.
  **Then restructure/reorganize/reword** where the file has outgrown its shape.
  **Why P1/L:** the same week produced three separate instances of exactly this failure — a self-
  contradictory clause inside one spec that had propagated into five files (v2.36.0), a source-of-truth
  memory still teaching a retired convention while the repo docs were correct (v2.36.3), and a rule
  documented in four places whose *trigger* existed in none (the v3 sync). Each was found by accident.
  **Method note, learned the hard way this week:** grep alone will not find these — the v2.36.3 miss
  survived two grep sweeps because it phrased the same idea differently. Read the files. And **verify
  every check itself before trusting it**: a "every version has a summary line" check reported 23 false
  gaps because it demanded an exact heading the convention doesn't use.
  **Bundle with:** the `[P2 · S]` sweep-script item below — anything mechanically checkable that this
  audit finds should leave as a script/CI check, not as more prose.

- `[P2 · M · Opus5-H · ⚠️touches-prod]` **Rename the production database off Mongoose's `test` default.**
  Added 2026-07-26 13:24 EDT; Harkirat explicitly deferred this to its own session mid-bring-up. The prod
  Atlas `MONGODB_URI` carries no database path, so Mongoose silently defaulted to a db literally named
  **`test`** — that's where all 5 live collections (`loadouts` 133, `alertlogs` 180, `userpreferences` 15,
  `alertcounters` 6, `seasonaldatas` 1) actually sit. Nothing is broken; it's a naming/clarity problem that
  gets riskier to fix the longer it waits. Target `diors-builds` (the local dev clone already uses
  `diors-builds-dev`, so dev is already correct and needs no change). **This is a live-prod migration, not a
  config tweak** — it needs: copy `test` → `diors-builds` on Atlas, update `MONGODB_URI` in the VM's `.env`,
  restart `diors-bot` via systemd, verify with `scripts/vmstatus.sh`, and only then drop the old db after a
  soak period. Do it in a low-traffic window; the bot is briefly down across the restart. Note the same URI
  is read by `scripts/` one-off tools, so check those too before dropping `test`.

- `[P1 · M · Opus5-H · 🧩needs-design]` **`.claude/rules/` two-tier rework (card + detail).** Added
  2026-07-24 23:02 EDT. The 13 rule files total **51.3k tokens — MORE than the 3,272-line CLAUDE.md
  monolith they replaced** (`accent-and-colors.md` alone is 11.9k). Path-scoping only pays off on narrow
  sessions; measured, session `2c62ab02` auto-loaded **11 of 13 rules ≈ 42.8k tokens**, so a broad session
  now costs roughly what the monolith did. **The plan:** split each rule into a ~300-500 token **card**
  (gotchas + invariants only — the bug-preventing content, stays auto-loading via `paths:`) plus a
  `docs/reference/<x>-detail.md` (narrative, history, worked examples — never auto-loads, read on demand).
  Target: **51.3k auto → ~5k auto**, the other ~46k one Read away. Start with `accent-and-colors.md` as the
  proof-of-concept and judge the shape before converting the other 12. **P1 because it's the largest
  remaining always-on context lever** and it partially defeats the point of the 2026-07-22 modularization
  until fixed. Content surgery across 13 files + doc cross-ref updates → wants its own session, Opus 5 High.
  Full cost model + measurements: memory `project_context_token_budget`.
- `[P2 · L · Opus5-H · 🧩needs-design]` **View Colors — wider colour variety.** juul's avatar returned 6
  of 8 requested colours and missed a useful yellow (assume one root cause). Keep the existing
  2-4-on-one-page behaviour for genuinely minimal images (juul's banner correctly returned 4). Real
  algorithm work; **determinism is a hard constraint** (Refresh's change-detection depends on it). Levers:
  over-clustering K=1.5× + the 30-RGB merge. Full subsystem detail: `.claude/rules/accent-and-colors.md`.
  ⇄ Also on `docs/ROADMAP.md`'s **remaining-v2** list (horizon only — the detail above is canonical).
- `[P2 · L · Opus5-H]` **Real "search + multi-select" admin flow.** For `/manage`'s "Delete Multiple" (all
  entities) and Loadouts' "Replace Multiple": search first, then tick which matches to act on. Today they're
  placeholder paste-a-list flows; this is the genuinely-new interaction they're meant to become. Full
  subsystem detail: `.claude/rules/manage-panel.md`.
- `[P2 · S · Sonnet5-M · 🔗bundle-with the CI expansion above]` **Make the records-consistency sweep a
  script (and then a CI job).** Filed 2026-07-27 20:40 EDT. A one-off script run this session caught two
  real defects that reading had missed: 7 items duplicated across `ROADMAP.md` and `db-deferred-list.md`
  while both headers claimed they didn't duplicate each other, and `docs/README.md`'s chore checklist
  telling you to tag the squash commit when every real tag points at the finalize commit. Checks worth
  keeping: newest `package.json` == newest `CHANGELOG.md` == newest `CHANGELOG-SUMMARY.md`; every
  changelog version has a tag and a summary line; every cited SHA resolves; no cross-file duplicate item
  titles without a `⇄` marker; `CLAUDE.md`'s memory-file count matches the store; `MEMORY.md` indexes
  every memory file.
  **Extended 2026-07-27 21:27 EDT** by the lagged-backfill convention (see the resolved "1 commit + 1 tag"
  item in `archive/resolved-list.md`) — three more machine-checkable invariants, and note the script should
  **perform** the backfill, not merely flag it, since it is a mechanical additive edit:
  1. every entry **except the newest** cites a SHA that resolves (the newest legitimately has no hash yet
     — exempt it, don't fail on it). From **v2.36.0 on** the cited SHA must equal the commit its tag points
     at; for **v2.33.0–v2.35.15** it may equal either the tag or the tag's *parent*, since 16 of those 25
     were tagged on a follow-up finalize commit — a check that demands tag-equality flags all 16 as false
     positives;
  2. every entry from **v2.33.0** on cites a PR number (v2.26.0–v2.32.0 predate the PR workflow — hash-only
     is correct there);
  3. the tag's `package.json` version equals the entry's version (`git show vX.Y.Z:package.json`) — this is
     what catches a tag landing on the wrong commit.
  ⚠️ **The "every version has a summary line" check must not demand a `## vX.Y.Z` heading.** Learned
  2026-07-27 22:05 EDT: a naive exact-heading check reported **23 false gaps**, because `CHANGELOG-SUMMARY.md`
  deliberately folds trivial/docs-only releases into a **range heading** (`## v2.18.0–v2.18.3`) or an inline
  one-line mention. Every one of the 23 was in fact represented. The check must accept heading, range, or
  mention — otherwise it cries wolf on two dozen entries and gets ignored, which is worse than no check.
  ⚠️ When mapping PRs, map by **merge-commit hash**, never by parsing squash subjects: a subject can carry
  two `#N` refs (v2.35.11's real PR is the trailing `#28`) and PRs #1/#9/#10 carry none.
  `gh pr list --state merged --limit 60 --json number,mergeCommit -q '.[] | "\(.mergeCommit.oid[0:7]) \(.number)"'` **These are exactly the "checkable rule → make it a hook/CI job, not more prose"
  case** from the `reference_enforcement_hooks` memory — prose already failed at two of them. Natural fit
  alongside the Vitest/Biome work below, since it needs the same `ci.yml` surface.
- `[P2 · M · Sonnet5-M]` **Expand CI beyond syntax-check.** Added 2026-07-25 18:40 EDT (Harkirat's ask).
  **✅ Sequencing precondition MET 2026-07-27 18:25 EDT — PR
  [#11](https://github.com/HarkiratMangat/diors-builds/pull/11) is MERGED, shipped as v2.35.8.**
  `.github/workflows/ci.yml` now exists on `main` and runs `npm ci` → `npm run check` (`node --check`
  across every non-`node_modules` `.js`) → advisory `npm audit`, triggering on **both `main` and
  `v3-pre-release`**. So this entry is now purely the *expansion* work; the "merge #11 first" step below
  is done. (This bullet previously carried a ⚠️ correction stating there was "genuinely no CI at all on
  `main`" — true when written 2026-07-26 19:06 EDT, false as of the merge. Still true: no test framework
  and no lint config.) **Tool choices decided 2026-07-26 19:06 EDT
  (dotenvx-adjacent tooling discussion): Vitest** for the test framework (fast, near-zero-config, ESM-friendly — a good fit
  given there's no build step) **and Biome** for lint+format (single Rust binary covering both, no
  ESLint+Prettier config sprawl to build from scratch since neither exists here yet). Real unit/integration
  coverage for the higher-risk subsystems (loadout search/fuzzy-match, draw-prices math, pagination) would
  catch real bugs before merge instead of only syntax errors — and `scripts/checkEmojiCaptures.js` (the
  require-time emoji-capture check, see `docs/DEVLOG.md`'s 2026-07-26 16:04 EDT entry) is a natural first
  Vitest test since it already exists as a standalone script. **Sequencing: merge PR #11 first** (or
  rebase this work onto it) — no point building the Vitest/Biome expansion on top of a `ci.yml` that isn't
  on `main` yet. Needs its own session: merge #11, add Vitest + Biome, decide what's worth covering first,
  wire both into `ci.yml`.
  **Also consider `commitlint` in the same pass** (noted 2026-07-26 15:41 EDT while adopting the commit
  convention): the repo has **no** `commitlint`, `husky`, `semantic-release`, `standard-version`, or
  `conventional-changelog` installed — verified, not assumed — so `docs/reference/commit-and-branch-naming.md`
  is enforced entirely by hand. A `commitlint` job in `ci.yml` (or a `husky` `commit-msg` hook) would make
  the subject format machine-checked, matching the "a checkable rule becomes a hook, not more prose"
  strategy in the `reference_enforcement_hooks` memory. Worth weighing the two placements: CI catches it at
  PR time (can't be bypassed, but late), a local hook catches it at commit time (instant, but skippable with
  `--no-verify`). Knock-on: once subjects are machine-parseable, `conventional-changelog` could draft
  `docs/CHANGELOG.md` entries instead of them being hand-written every release — though the hand-written
  entries are currently far richer than a generator would produce, so that part is a genuine tradeoff, not
  a free win.

---

## 🧹 Someday / tech-debt
*Full context lives in `.claude/rules/*.md` (subsystem detail), `docs/reference/known-issues.md`
(accepted gaps), and memory. Model tags re-audited 2026-07-18 against the "tier vs. effort" calibration
(`feedback_suggest_model_switch`) — the three Sonnet5-H items below were downgraded from Opus then:
well-specified execution/polish, not novel design.*

- `[P2 · M · 🧩needs-design · ⛓️blocked-by nothing, just deferred]` **Give the dev bot a real Cloudinary
  write namespace instead of the fail-closed block.** Filed 2026-07-27 18:40 EDT alongside the guard in
  `utils/cloudinaryDevGuard.js` (v2.35.9). The guard currently refuses **every** Cloudinary write when
  `NODE_ENV=development`, which is correct and safe but means the dev bot cannot exercise the image
  workflow at all — a real gap for the v3 items that touch images (`/autobuild`, `/admin` loadout images,
  patch notes). The clean version is a parallel dev namespace, and it is **not uniform across the three
  caches**, which is why it wasn't done inline:
  - `temp_draws` and `patch_notes` bake the folder into the `public_id` (`temp_draws/{slug}`,
    `patch_notes/{id}/{index}`), and their prune sweeps scan by `prefix: ${FOLDER}/` — so dev-scoping the
    `FOLDER` const alone namespaces upload, read, and prune end-to-end. Genuinely easy.
  - **`gun-builds` does not.** Loadout `public_id` is the bare `imageKey`, with the folder carried only in
    `asset_folder` (a decoupled dashboard label). Dev-scoping needs the `public_id` itself prefixed, and
    then `buildImageUrl()` in `utils/loadoutRender.js` has to agree — otherwise dev-uploaded images 404 on
    render while prod-existing ones still resolve, which is a confusing half-working state.
  Do this when a v3 feature actually needs dev-side image writes, not preemptively. Alternative worth
  pricing at the same time: a separate free Cloudinary account for `.env.dev`, which is cleaner but makes
  every existing loadout render broken in dev (their URLs live in Mongo pointing at prod).
- `[P3 · XS · Harkirat action, not a build]` **Revoke the now-dead `RENDER_API_KEY`** (and `RAILWAY_TOKEN`,
  confirmed same dead-credential status). Filed 2026-07-27 20:20 EDT, downgraded P1→P3 2026-07-27 23:23 EDT
  (Harkirat: "not concerned about the render/railway keys"). Confirmed 2026-07-27 23:23 EDT: **zero code
  references** to either var anywhere in `commands/`, `utils/`, `models/`, or `index.js` — only `.env`
  itself and historical docs mention them, so revoking carries no code risk whenever it happens. Revoke
  in each dashboard (Render: Account Settings → API Keys; Railway: Account Settings → Tokens), then drop
  both lines from `.env` locally and on the VM. No longer time-sensitive.
- `[P3 · XS · Harkirat action, not a build · ⛓️blocked-by:/help command]` **Update the bot's Discord
  Developer Portal listing** (filed 2026-07-18, notes) — description, name, and banner image. Folded
  into v3 2026-07-27 23:23 EDT (Harkirat's call) — downgraded from a standalone P1 since the description
  rewrite depends on `/help` shipping first. Pure Discord Dev Portal task, not something Claude has UI
  access to do.
  ⇄ Also on `docs/ROADMAP.md`'s v3 list (canonical scope/dependency detail).
- `[P3 · S · Harkirat decision first, then Sonnet5-M]` **Commit attribution: back-catalogue is unclickable**
  *(filed 2026-07-27 11:10 EDT)* — every Diors-Builds commit made before 2026-07-27 11:10 EDT carries
  `Dior <diorswrld@discord.com>`, which is not a verified address on the GitHub account, so GitHub renders
  the author as flat text with no profile link. Verified via
  `gh api repos/HarkiratMangat/Diors-Builds/commits --jq '.[].author.login'` → `null`. **Already fixed
  going forward**: the global git identity is now `dior <21996007+HarkiratMangat@users.noreply.github.com>`
  (see memory `feedback_git_commit_identity`), so all NEW commits link correctly — this item is only about
  the existing history. Fixing it means a `filter-repo`/`filter-branch` rewrite of every pushed commit:
  all SHAs change, the GCP VM pulls from this repo, and the 37 backfilled version tags would need
  re-pointing. Cosmetic benefit vs. real blast radius — decide whether it's worth it at all before
  scoping a session.
- `[P2 · M · Sonnet5-H]` **General housekeeping session** — delete leftover `*.bak-*` config backups, sweep
  stale absolute paths, dead-code / stale-comment / unused-dependency review, decide `/patch notes` carousel
  component-count chunking.
  ⇄ Also on `docs/ROADMAP.md`'s **v5** list (version horizon).
- `[P3 · S]` **Tool-discovery session (filed 2026-07-26 19:32 EDT)** — deferred by Harkirat's own request
  during a dotenvx-adjacent tooling discussion, not yet scoped for a session. Candidates raised: `procs`
  (modern `ps`, ties to the recurring stray-`node`-process hunt in `feedback_multiple_bot_instances`),
  `git-delta` (nicer `git diff`/`show`), `zoxide`, `hyperfine` (ties to the "Pagination perf" item below),
  Knip (automates the unused-file/dependency audits already done by hand at least twice), `act` (run
  `ci.yml` locally once PR #11 merges), and a free-tier uptime/status-page service tying into the deferred
  `/status` command + vmstatus overhaul. Nothing decided — just don't lose the list.
- `[P2 · M · Sonnet5-H]` **Pagination perf hybrid** — single `UPDATE_MESSAGE` for the light string-building
  commands; keep defer-then-patch for heavy/attachment paths. Cross-cutting (touches every paginated
  command) but the design itself is ALREADY decided (see `docs/reference/known-issues.md`) — what's left is
  careful, well-specified execution across call sites, not open design work.
  ⇄ Also on `docs/ROADMAP.md`'s **remaining-v2** list as "Pagination double round-trip perf fix" (horizon only — the design detail above is canonical).
- `[P2 · XS · Sonnet5-L]` **Verify Cloudinary folder organization** — *(new 2026-07-18, notes L59)* read-only
  check that draw thumbnails land in `temp_draws/` and patch-notes images in `patch_notes/{patchId}/` as
  designed; Harkirat noticed assets that look like they're in the main folder. Escalate to a 🐞 bug above
  only if confirmed. Also tracked in `docs/reference/known-issues.md`.
  ⇄ Also on `docs/ROADMAP.md`'s **v5** list (version horizon).
- `[P3 · M · Opus5-M · ⛓️blocked-by:token budget]` **Full DEVLOG backfill from prior chat transcripts** —
  retrieve the old transcripts and merge their reasoning into DEVLOG's Part A/B.
  ⇄ Also on `docs/ROADMAP.md`'s **v5** list (version horizon).
- `[P3 · M · Opus5-M]` **Write a user-friendly bot/ops guide** — *(new 2026-07-18, notes L34)* a rich but
  noob-friendly how-to for operating the bot end-to-end (GCP VM, hosting, deploy flow, status/logs), so
  Harkirat can self-serve. Distinct from `docs/reference/deployment-and-ops.md` and the terse
  `reference_vm_bot_commands` card. ("Not anytime soon.")
  ⇄ Also on `docs/ROADMAP.md`'s **v5** list (version horizon).
- `[P3 · M · Opus5-M]` **Ship the redesigned changelog artifact** — the "Armory Terminal" visual, paused.
  ⇄ Also on `docs/ROADMAP.md`'s **v3** list (version horizon).
- `[P3 · XS · Sonnet5-L · 🔗bundle-with next VM/ops touch]` **Guest disk-usage peaks in `scripts/vmpeaks.sh`**
  — small add mirroring the new `rampeak()` now that the Ops Agent (2026-07-17) provides the metric.
  🔗 Natural bundle with the Render-deletion reminder above, which is also a VM/ops touch.

---

## 🚫 Decided-no — don't re-raise
*Standing calls that stay VISIBLE here (rather than moving to the archive) precisely so a future session
doesn't re-open them as if they were new.*

- **Dependabot vulnerabilities** — tracked, decided not worth acting on. Rationale:
  `project_dependabot_vulnerabilities_deferred` memory.
- **A maintained ToC for `CHANGELOG.md` / `DEVLOG.md`** — Harkirat's explicit call: their headers are
  already uniform and grep-able. The archive-split reminder above is the accepted lever instead.
