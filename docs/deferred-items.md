# Deferred items — Dior's Builds

**Split out of the cross-project `/Applications/Claude Code/deferred-items.md` tracker into this repo on
2026-07-25 15:56 EDT** (tracked in-repo, so it gets real `git diff`/`git log` history like the rest of
`docs/`). The cross-project file still exists for anything that spans projects, concerns the Claude/
Anthropic product itself, or has no obvious single-project home (🐞 Active Bugs, 🔔 Reminders, priority/
effort tag spec, and Cross-project/meta all stay there) — this file is Dior's Builds' own slice of it.

The AUTHORITATIVE full list is `docs/ROADMAP.md` (the whole feature roadmap incl. v2/v3/v4/v5) — this file
is deliberately NOT a copy of it. It holds only the deferred *maintenance / tech-debt* long-tail plus the
handful of features big enough to warrant their own dedicated session. Pointer, not duplicate.

Items carry the `[Priority · Effort]` tag system — full spec + legend: `reference_priority_tier_system`
memory (also documented atop the cross-project `deferred-items.md`).

---

## Queued — worth its own dedicated session
*Real, self-contained builds; spin each up as its own session at the tagged setup. All P2 (Harkirat's call
2026-07-18: keep deferred, none urgent right now).*
- `[P2 · L · Opus4.8-H · 🧩needs-design]` **View Colors — wider colour variety.** juul's avatar returned 6
  of 8 requested colours and missed a useful yellow (assume one root cause). Keep the existing
  2-4-on-one-page behaviour for genuinely minimal images (juul's banner correctly returned 4). Real
  algorithm work; **determinism is a hard constraint** (Refresh's change-detection depends on it). Levers:
  over-clustering K=1.5× + the 30-RGB merge.
- `[P2 · L · Opus4.8-H]` **Real "search + multi-select" admin flow.** For `/manage`'s "Delete Multiple" (all
  entities) and Loadouts' "Replace Multiple": search first, then tick which matches to act on. Today they're
  placeholder paste-a-list flows; this is the genuinely-new interaction they're meant to become.
- `[P2 · M · Sonnet5-M]` **Expand CI beyond syntax-check.** Added 2026-07-25 18:40 EDT (Harkirat's ask, right after
  `.github/workflows/ci.yml` first shipped in PR #11). Today CI only runs `node --check` (no test
  framework, no lint config exist yet in this repo). Real testing capability — a test framework (Jest?),
  actual unit/integration tests for the higher-risk subsystems (loadout search/fuzzy-match, draw-prices
  math, pagination), and possibly ESLint — would catch real bugs before merge instead of only syntax
  errors, reducing the "did I break something" burden currently resting entirely on manual review. Needs
  its own session: pick a test framework, decide what's worth covering first, wire it into `ci.yml`.
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

## Someday / tech-debt (full context in CLAUDE.md + memory)
*Model tags re-audited 2026-07-18 against the "tier vs. effort" calibration (feedback_suggest_model_switch)
— these 4 downgraded from Opus4.8 to Sonnet5-H: well-specified execution/polish, not novel design.*
- `[P1 · XS · Harkirat action, not a build]` **Update the bot's Discord Developer Portal listing** (filed
  2026-07-18, notes) — description, name, and banner image. Pure Discord Dev Portal task, not something
  Claude can do (no tool access to that UI); flagging so it doesn't get lost.
- `[P2 · M · Sonnet5-H]` **General housekeeping session** — delete leftover `*.bak-*` config backups, sweep
  stale absolute paths, dead-code / stale-comment / unused-dependency review, decide `/patch notes` carousel
  component-count chunking.
- `[P2 · M · Sonnet5-H]` **Pagination perf hybrid** — single `UPDATE_MESSAGE` for the light string-building
  commands; keep defer-then-patch for heavy/attachment paths. Cross-cutting (touches every paginated
  command) but the design itself is ALREADY decided (see Diors CLAUDE.md's "Known open issues") — what's
  left is careful, well-specified execution across call sites, not open design work.
- `[P2 · M · Sonnet5-H]` **Single-instance guard (startup lock)** — less critical now the bot lives on the
  VM, but still wanted so a stray local `node index.js` can't race it. A well-defined mechanism
  (refuse-to-start-if-already-connected), not a design question.
- ~~`/secondary` rename + `/pistols` alias~~ → **DROPPED, replaced 2026-07-18 (v2.21.0).** `/secondaries`
  stays exactly as-is; built a category-level search-synonym feature instead (`utils/search.js`'s
  `resolveCategorySynonym`) so typing "pistol" surfaces every Secondaries weapon directly — no second
  command needed (Discord has no real alias mechanism anyway). See Diors-Builds CLAUDE.md.
- `[P2 · XS · Sonnet5-L]` **Verify Cloudinary folder organization** — *(new 2026-07-18, notes L59)* read-only
  check that draw thumbnails land in `temp_draws/` and patch-notes images in `patch_notes/{patchId}/` as
  designed; Harkirat noticed assets that look like they're in the main folder. Escalate to a bug only if confirmed.
- `[P3 · M · Opus4.8-M · ⛓️blocked-by:token budget]` **Full DEVLOG backfill from prior chat transcripts** —
  retrieve the old transcripts and merge their reasoning into DEVLOG's Part A/B.
- `[P3 · M · Opus4.8-M]` **Write a user-friendly bot/ops guide** — *(new 2026-07-18, notes L34)* a rich but
  noob-friendly how-to for operating the bot end-to-end (GCP VM, hosting, deploy flow, status/logs), so
  Harkirat can self-serve. Distinct from CLAUDE.md and the terse `reference_vm_bot_commands` card. ("Not anytime soon.")
- `[P3 · M · Opus4.8-M]` **Ship the redesigned changelog artifact** — the "Armory Terminal" visual, paused.
- `[P3 · XS · Sonnet5-L · 🔗bundle-with next VM/ops touch]` **Guest disk-usage peaks in `scripts/vmpeaks.sh`**
  — small add mirroring the new `rampeak()` now that the Ops Agent (2026-07-17) provides the metric.
- `[P3 · — · decided-no]` **Dependabot vulnerabilities** — tracked, decided not worth acting on
  (`project_dependabot_vulnerabilities_deferred`).

---

**Not here — check the cross-project tracker instead:** confirmed bugs (🐞 Active Bugs), time/condition
reminders (🔔 Reminders / watch-for), and anything spanning multiple projects all still live in
`/Applications/Claude Code/deferred-items.md`. This file is maintenance/tech-debt + big-enough-for-its-
own-session features for Dior's Builds specifically.
