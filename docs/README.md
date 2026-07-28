# 📚 Dior's Builds — Documentation Map

**Read this if you're unsure which doc file does what, when to touch it, or how they relate.** This is
the front door to the project's records. It doesn't hold project content itself — it points at where each
kind of content lives and who's responsible for keeping it current.

> **The one rule that ties them together:** when you "document" a change (see the working-agreement
> non-negotiables), that means updating **every relevant layer in the same turn** — not just one.
> The changelog is the layer that historically keeps getting skipped. Under the Branch → Commit → Push →
> PR → Merge → Deploy workflow (adopted 2026-07-24 12:24 EDT, see `project_git_workflow` memory), docs
> ride IN the PR's diff — drafted on the branch as the change happens, finalized on the branch in the
> final pre-merge checkpoint (so they fold into the squash commit — see step 8). A merged PR
> in this repo isn't finished until `CHANGELOG.md` was touched (the doc-check hook now fires on
> `gh pr merge`, not on every branch checkpoint commit).

---

## The records at a glance

| File | What it is | When you touch it | Audience |
|---|---|---|---|
| **`../CLAUDE.md`** (repo root) | **Invariants + navigation map** (~180 lines, modularized 2026-07-22). The hard safety/architecture rules that must load every session, a platform cheat-sheet, and the 🗺️ nav map pointing to where each subsystem's detail lives. | When an invariant changes, or a subsystem's home moves. Keep the nav-map table in sync when you add/remove a rule file. | Claude (primarily), Harkirat |
| **`../.claude/rules/*.md`** | **Path-scoped subsystem detail** — the deep "why" for each subsystem, loaded into context ONLY when you read a matching file (`paths:` frontmatter glob). 13 files (commands-overview, manage-panel, settings-and-expiry, interaction-router, rendering-and-ui, accent-and-colors, loadouts, loadout-images-and-metadata, autobuild, draw-prices, design-decisions, models, scripts-and-migrations). | When you change how that subsystem is built. Update the matching rule (the old "update CLAUDE.md" habit now splits by area). | Claude |
| **`ROADMAP.md`** | **The authoritative roadmap** (v2 remaining · v3 · v4 · v5 · housekeeping) — detailed source of truth, full history/rationale. Moved out of CLAUDE.md 2026-07-22. The `🔮 Planned & Upcoming` (CHANGELOG) and `🔜 Coming soon` (SUMMARY) sections are synced VIEWS of it. The [GitHub Projects board](https://github.com/users/HarkiratMangat/projects/2) is a lightweight visual tracker manually refreshed FROM this file — not the other way around. | Every roadmap/planning change — sync all three (+ refresh the board when convenient). | Claude, Harkirat |
| **`db-deferred-list.md`** | **This project's own deferred work** — 🐞 Active Bugs · 🔔 Reminders · 🗂️ Queued (own-session features) · 🧹 Someday/tech-debt · 🚫 Decided-no. NOT a copy of `ROADMAP.md`. Split out of the cross-project tracker 2026-07-25 15:56 EDT so it's tracked in-repo; renamed from `deferred-items.md` + completed 2026-07-25 21:43 EDT (that first pass left this project's bugs/reminders/resolved items behind in the cross-project file). | When something's deferred, found broken, or ships/drops. | Claude, Harkirat |
| **`reference/`** | On-demand reference docs: `deployment-and-ops.md` (stack, GCP VM/systemd/alerting, version tagging, **the local dev bot** — `Dio (Dev)`, `.env.dev`, local Mongo, `--watch`, emoji/data cloning; added 2026-07-26 13:45 EDT), `known-issues.md`, `design-history.md`, `commit-and-branch-naming.md` (the Conventional Commits subject format + branch/PR-title convention). Read when ops/history detail is needed, or before writing any commit subject or branch name. | When ops setup or a flagged issue changes. | Claude |
| **`CHANGELOG.md`** | **Detailed release log** — one entry per merged PR, newest-first, incl. internal/housekeeping. Also holds the `🔮 Planned & Upcoming` roadmap (synced from CLAUDE.md) and, at the very bottom, `📋 Unreleased` for the open branch/PR awaiting merge. | Every merge (draft the entry on the branch as work happens, finalize — real number + squash hash + tag — at merge). Graduate Unreleased → a numbered entry when it merges. | Claude, Harkirat |
| **`CHANGELOG-SUMMARY.md`** | **Plain-language "What's New"** — player-facing. Represents **every version number** (ops/docs-only ones folded into a version range or a one-line note, so none is ever skipped), but only real user-facing changes get a full bullet. Holds the `🔜 Coming soon` roadmap view. | Same merge as CHANGELOG.md; add a friendly line for user-facing changes, a range/one-liner otherwise. | Harkirat / end-users |
| **`DEVLOG.md`** | **The narrative journey & lessons** — the reasoning, dead-ends, root causes, and "note to future self." Part A = chronological story; Part B = thematic lessons ledger. Has its own ToC. | When a session produces real reasoning, a discovery, a walk-back, or a notable bug hunt. Not every commit. | Claude + Harkirat (us) |
| **`diors-builds notes.md`** | **Harkirat's intake scratchpad** — where he jots thoughts between sessions. Has its own 🔑 Legend + `HOW THIS FILE WORKS` header. It's a SCRATCHPAD, not a store: items get FILED into their real homes and marked/swept, so it shrinks. Its Graveyard is no longer a section inside it — resolved + ℋ-confirmed items sweep out to `archive/graveyard.md` (split 2026-07-25 21:43 EDT). | Read at session start / when prompted / during a Document pass. Mark handled items IN-FILE the same session (see below). It is tracked in git and fully tidyable — no private section lives inside it anymore. | Harkirat (author), Claude (tidies) |
| **`SESSION-START.md`** | **The canonical session-start prompt** — auto-loaded every session via a `SessionStart` hook. Holds the NON-NEGOTIABLES glossary (commit/push/deploy/document). | When the session-start expectations change. Edit here directly; it's the single source (not duplicated in memory). | Claude |
| **`README.md`** (this file) | The docs map. | When a doc file is added, removed, or its role changes. | anyone |
| **`archive/`** | **Dead archive — don't read by default.** `graveyard.md` (resolved + ℋ-confirmed intake swept out of the notes file), `resolved-list.md` (closed entries from `db-deferred-list.md`), and the dated pre-tidy notes snapshot (pre-2026-07-18, largely superseded by git history). Renamed from `notes-archive/` and given its two archive files 2026-07-25 21:43 EDT. | Only when running a sweep, or looking something specific up. | reference |

**Two authoritative records that live OUTSIDE this folder:**
- **Memory** — `~/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory/` (the repo-slug path; it
  MOVED here 2026-07-28 01:41 EDT — see CLAUDE.md's canonical-memory-path note). Standing rules for how to work. **Start at `user_working_agreement.md`** — its
  top "🔴 THE RULES THAT GET SKIPPED" checklist is the fastest way to load the non-negotiables. `MEMORY.md`
  is the index.
- **`/Applications/Claude Code/meta-deferred-list.md`** (outside this repo) — the **cross-project** tracker,
  and only that: cross-project bugs (the MarkEdit extensions, which live outside every repo),
  Claude/Anthropic product feedback, meta/architecture work, and the canonical Priority·Effort legend.
  **Everything Dior's-Builds-specific — bugs, reminders, tech-debt — now lives in `db-deferred-list.md`
  above instead** (2026-07-25 21:43 EDT). Renamed from `deferred-items.md` in the same pass.

---

## How they relate (don't duplicate — sync)

- **`docs/ROADMAP.md` is the source of truth for the roadmap** (moved out of CLAUDE.md 2026-07-22). Its
  v2–v5 lists are authoritative; the `🔮 Planned & Upcoming` (CHANGELOG) and `🔜 Coming soon` (SUMMARY)
  sections are *synced views* of it — update all three together, or they silently drift (a real records bug).
- **The notes file feeds the roadmap, it doesn't hold it.** A feature idea lands in the notes as intake, gets
  FILED into `docs/ROADMAP.md` + the changelog roadmaps, then LEAVES the notes file. The roadmap is never
  duplicated in the notes file.
- **Memory holds the rules; the docs hold the record.** A workflow lesson → memory. A shipped change → changelog.
  The "why" behind the code → CLAUDE.md's invariants + the matching **`.claude/rules/*.md`**. The story of
  getting there → DEVLOG.
- **`ROADMAP.md` / `db-deferred-list.md` are the record; the [GitHub Projects board](https://github.com/users/HarkiratMangat/projects/2) is a view.** ⚠️ **The board's 15 draft items were sourced 2026-07-25 21:35 EDT, minutes before the 21:43 EDT deferred-list restructure** — so its items predate the rename, the bugs/reminders moving in-repo, and the resolved items moving to `archive/`. Re-sync it manually before trusting it. The board (Status/Priority/Effort/Model/Flags fields) exists for an at-a-glance visual snapshot — a Status kanban + a Priority table. It is refreshed manually and periodically from the docs, never the other way around: if the board and the docs ever disagree, the docs win. Don't let it silently drift into a second source of truth the way the notes-file/CLAUDE.md roadmap once did.

## Responsibilities / chores checklist (per merge — moved from per-push 2026-07-24 12:24 EDT)
Docs are drafted on the branch as the work happens (they ride in the PR's diff, reviewed alongside the
code) and finalized on the branch in the final pre-merge checkpoint:
1. Bump the version per `project_dior_builds_changelog_system` (memory) — one number per MERGED PR, not per commit or push.
2. `CHANGELOG.md`: a numbered entry (draft it in `Unreleased` on the branch; finalize it with the real
   number + timestamp + **PR number, no hash** in the final pre-merge checkpoint — the hash is backfilled
   one release later, per step 8).
3. `CHANGELOG-SUMMARY.md`: a friendly line (user-facing) or a range/one-liner (ops/docs-only) — never skip the number.
4. `CLAUDE.md` **or the matching `.claude/rules/*.md`**: update the design/architecture note the change
   affects (subsystem detail lives in the rule file now; invariants + the nav map live in root CLAUDE.md).
   Keep the root nav-map table current if you add/remove a rule file.
5. `DEVLOG.md`: a narrative entry if the work had real reasoning/discovery.
6. Memory: update any rule the session established or corrected.
7. `diors-builds notes.md`: mark/file/sweep anything the session handled — **in-file, same session**. Sweeps go to `archive/graveyard.md`, not to a section inside the notes file.
8. **One commit + one tag per release — the 4-step lifecycle** (adopted 2026-07-27 21:27 EDT):
   1. On the branch, as the **final pre-merge checkpoint**: write the changelog entry with the PR
      number and no hash — `## v2.36.0 — 2026-07-27 21:30 EDT (#33) — <title>` — bump `package.json`,
      finalize `CHANGELOG-SUMMARY.md` + `DEVLOG.md`.
   2. In that **same** checkpoint, backfill the *previous* entry's hash: `(#32)` → ``(#32 · `f913975`)``.
      Additive-only — insert `` · `sha` `` and touch nothing else on the line; never edit the timestamp
      afterwards; **never `--amend`, never force-push** (this is an ordinary edit in a later commit).
   3. `gh pr merge --squash` → **one** commit on `main`. No `chore(release)` commit — it is retired.
   4. `git pull`, then `git tag -a vX.Y.Z <that sha>`, then `git push origin main --follow-tags`. The
      tagged commit's `package.json` already reads `X.Y.Z` because of step 1.
   5. **Prune the branch — it dies with its PR.** Use `--delete-branch` on the merge (step 3) so this is
      automatic; otherwise `git branch -D <branch>` + `git fetch --prune` now, not later. GitHub's
      auto-delete-on-merge only removes the *remote*, and a plain `git fetch` doesn't prune
      remote-tracking refs, so merged branches accumulate invisibly — **10 were found rotting
      2026-07-27 21:50 EDT.** Before deleting, confirm the PR really merged
      (`gh pr list --head <branch> --state all --json number,state`); don't trust `git branch --merged`,
      which never reports a squash-merged branch as merged. Enforced by two hooks in
      `.claude/settings.local.json` (a `SessionStart` stale-branch report + a `PostToolUse` nudge when a
      merge omits `--delete-branch`) — **gitignored, so local-only and not part of any PR.**
   ⚠️ **Rewritten 2026-07-27 21:27 EDT.** This step previously prescribed a **second**
   `chore(release): finalize …` commit on `main`, tagged instead of the squash commit — the real shape
   of v2.33.0–v2.35.15, forced by citing the squash commit's own hash inline (a commit cannot contain
   its own hash). Lagging the hash by one release removes the need for that commit, so the "one commit +
   one tag per version" promise is now true rather than aspirational. Full design + the rejected
   alternatives: `docs/superpowers/specs/2026-07-24-git-branch-pr-workflow-design.md` §3, §5, §10.
9. **Sanity-check the records before calling the merge done.** Cheap, and it has caught real drift twice:
   newest `package.json` version == newest `CHANGELOG.md` entry == newest `CHANGELOG-SUMMARY.md` entry;
   every changelog version has a git tag and a summary line (no number skipped); every SHA cited in a
   changelog entry actually resolves (`git cat-file -e <sha>^{commit}`) — **exempting the newest entry,
   whose hash is backfilled by the next release**; every entry from **v2.33.0** on cites a PR number
   (the 9 older entries, v2.26.0–v2.32.0, predate the PR workflow and are correctly hash-only); and
   `git fetch --prune` before trusting `git branch -a`, which lists long-merged branches otherwise.

## Versioning
`vMAJOR.MODERATE.MINOR` (3-part, uniform throughout as of 2026-07-21). Full rules in
`CHANGELOG.md`'s versioning header and the `project_dior_builds_changelog_system` memory (the source of truth
for the scheme). To find the current live version: `git describe --tags` or `scripts/vmstatus.sh`.

## Date/time convention (all records)
Write dates with a **time and timezone** — `YYYY-MM-DD HH:MM TZ` (e.g. `2026-07-21 22:46 EDT`), not a bare
date (Harkirat's standing request, 2026-07-21 ~22:46 EDT). The time is a second factor for exact intra-day
ordering when several things ship the same day; always state the timezone because the VM runs UTC while
Harkirat is ET. **Get the real clock time proactively, ONCE, before drafting any dated content** —
`date "+%Y-%m-%d %H:%M %Z"` — and reuse that value for every date written the rest of the turn. A
`PostToolUse` hook flags a bare today-date after the fact, but it's a safety net for the rare miss, not
license to fetch the time reactively every time (caught doing exactly that 2026-07-26 11:35 EDT — see
`feedback_docs_at_push_time` / `feedback_be_usage_conscious` memory).
