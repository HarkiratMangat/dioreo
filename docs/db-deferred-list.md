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

- `[P2 · XS · trigger = next deploy]` **The GCP VM's local git history is intentionally behind/diverged
  from `origin/main`, as of 2026-07-27 08:29 EDT.** `main` was force-pushed that session (rewriting a
  v2.36.0→v2.35.4 version-number correction out of history entirely, per Harkirat's explicit request —
  see DEVLOG's 2026-07-27 08:29 EDT entry) after the VM had already pulled and deployed the pre-rewrite
  commits. The deployed FILE CONTENTS are byte-identical either way (verified via diff before the
  force-push), so the bot itself is unaffected and no restart is needed right now — but the VM's `git
  status` will show `ahead/behind` against `origin/main` until someone runs `git fetch && git reset
  --hard origin/main` there (Harkirat asked to hold off on this for now). The next real deploy's `git
  pull` will fail on this non-fast-forward divergence unless that reset happens first — don't let
  `scripts/deploy.sh` run blind into that failure; check for it and reset first if needed.
- `[P0 · S · trigger has FIRED]` **Delete the suspended Render service** (`srv-d850b2og4nts73fhpfog`).
  The condition was "~2026-07-24, once the GCP VM has proven reliable for ~a week" — **that date has
  passed** (as of 2026-07-25 21:43 EDT), so this escalated from P2 to P0 on schedule and is now simply
  due. Suspended today (no cost/risk), kept only as a fallback. **Before deleting:** run
  `scripts/vmstatus.sh` and confirm the VM is actually healthy — the escalation is calendar-driven, and
  no session has verified the "held for a week" half. Then delete via the Render dashboard or REST API,
  and scrub the last Render references from `docs/reference/deployment-and-ops.md` +
  `project_deployment_migration_render_to_gcp` memory.
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

- `[P1 · S · Opus5-H · 🧩needs-design]` **Resolve the "1 commit + 1 tag per merge" promise vs. the 2-commit
  reality.** Added 2026-07-25 16:20 EDT. `docs/superpowers/specs/2026-07-24-git-branch-pr-workflow-design.md`
  §10 states "Squash merge; one commit + one tag per version on `main`," but every merge since the workflow
  launched (`904dec8`→`acc1d8d` for v2.33.0, `8c44f97`→`e5c93d8` for v2.33.1, `6a64e37`→`4b91218` for
  v2.33.2 — verified via `git log`) has actually produced 2 commits: the squash-merge, then a follow-up
  "finalize changelog/DEVLOG with the real hash" commit. Root cause: the changelog convention cites the
  squash commit's own hash inline, but a commit can't contain its own hash, and `gh pr merge --squash`
  merges straight to GitHub's remote — there's no local staging step to fold the two together. Harkirat's
  ask (2026-07-25 16:20 EDT): keep doing the 2-commit pattern for now (don't change process ad hoc), but
  give this to a dedicated Opus session with room to actually reason about a better design (e.g. dropping
  the inline hash citation, a different finalize mechanism, or accepting/documenting the 2-commit reality)
  rather than deciding it inline. See `project_git_workflow` memory for the same open question.
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
- `[P2 · L · Opus5-H]` **Real "search + multi-select" admin flow.** For `/manage`'s "Delete Multiple" (all
  entities) and Loadouts' "Replace Multiple": search first, then tick which matches to act on. Today they're
  placeholder paste-a-list flows; this is the genuinely-new interaction they're meant to become. Full
  subsystem detail: `.claude/rules/manage-panel.md`.
- `[P2 · M · Sonnet5-M]` **Expand CI beyond syntax-check.** Added 2026-07-25 18:40 EDT (Harkirat's ask).
  **⚠️ Correction 2026-07-26 19:06 EDT: `.github/workflows/ci.yml` has NOT actually shipped yet** — PR
  [#11](https://github.com/HarkiratMangat/diors-builds/pull/11) (`ci: add basic CI workflow`, branch
  `claude/ci-setup-r4t8`) is still **open, unmerged**, sitting since 2026-07-25; this entry's original text
  wrongly said it "first shipped in PR #11." Today there is genuinely no CI at all on `main` — no
  `node --check`, no test framework, no lint config. **Tool choices decided 2026-07-26 19:06 EDT
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

- `[P1 · XS · Harkirat action, not a build]` **Update the bot's Discord Developer Portal listing** (filed
  2026-07-18, notes) — description, name, and banner image. Pure Discord Dev Portal task, not something
  Claude can do (no tool access to that UI); flagging so it doesn't get lost.
- `[P2 · M · Sonnet5-H]` **General housekeeping session** — delete leftover `*.bak-*` config backups, sweep
  stale absolute paths, dead-code / stale-comment / unused-dependency review, decide `/patch notes` carousel
  component-count chunking.
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
- `[P2 · XS · Sonnet5-L]` **Verify Cloudinary folder organization** — *(new 2026-07-18, notes L59)* read-only
  check that draw thumbnails land in `temp_draws/` and patch-notes images in `patch_notes/{patchId}/` as
  designed; Harkirat noticed assets that look like they're in the main folder. Escalate to a 🐞 bug above
  only if confirmed. Also tracked in `docs/reference/known-issues.md`.
- `[P3 · M · Opus5-M · ⛓️blocked-by:token budget]` **Full DEVLOG backfill from prior chat transcripts** —
  retrieve the old transcripts and merge their reasoning into DEVLOG's Part A/B.
- `[P3 · M · Opus5-M]` **Write a user-friendly bot/ops guide** — *(new 2026-07-18, notes L34)* a rich but
  noob-friendly how-to for operating the bot end-to-end (GCP VM, hosting, deploy flow, status/logs), so
  Harkirat can self-serve. Distinct from `docs/reference/deployment-and-ops.md` and the terse
  `reference_vm_bot_commands` card. ("Not anytime soon.")
- `[P3 · M · Opus5-M]` **Ship the redesigned changelog artifact** — the "Armory Terminal" visual, paused.
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
