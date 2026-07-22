# 📚 Dior's Builds — Documentation Map

**Read this if you're unsure which doc file does what, when to touch it, or how they relate.** This is
the front door to the project's records. It doesn't hold project content itself — it points at where each
kind of content lives and who's responsible for keeping it current.

> **The one rule that ties them together:** when you "document" a change (see the working-agreement
> non-negotiables), that means updating **every relevant layer in the same turn** — not just one.
> The changelog is the layer that historically keeps getting skipped. A `git commit` in this repo isn't
> finished until `CHANGELOG.md` was touched (a `PostToolUse` hook flags it if you forget).

---

## The records at a glance

| File | What it is | When you touch it | Audience |
|---|---|---|---|
| **`../CLAUDE.md`** (repo root) | **The deepest source of truth** — architecture, design decisions, every "why". ~3,000 lines with its own 🗺️ Table of Contents. | Every time you change how the bot is built or make a non-obvious decision. Keep the ToC in sync when adding/removing a top-level `##`. | Claude (primarily), Harkirat |
| **`CHANGELOG.md`** | **Detailed release log** — one entry per real push, newest-first, incl. internal/housekeeping. Also holds the `🔮 Planned & Upcoming` roadmap (synced from CLAUDE.md) and, at the very bottom, `📋 Unreleased` for committed-but-unpushed work. | Every push (or committed work → Unreleased). Graduate Unreleased → a numbered entry when it ships. | Claude, Harkirat |
| **`CHANGELOG-SUMMARY.md`** | **Plain-language "What's New"** — player-facing. Represents **every version number** (ops/docs-only ones folded into a version range or a one-line note, so none is ever skipped), but only real user-facing changes get a full bullet. Holds the `🔜 Coming soon` roadmap view. | Same push as CHANGELOG.md; add a friendly line for user-facing changes, a range/one-liner otherwise. | Harkirat / end-users |
| **`DEVLOG.md`** | **The narrative journey & lessons** — the reasoning, dead-ends, root causes, and "note to future self." Part A = chronological story; Part B = thematic lessons ledger. Has its own ToC. | When a session produces real reasoning, a discovery, a walk-back, or a notable bug hunt. Not every commit. | Claude + Harkirat (us) |
| **`diors-builds notes.md`** | **Harkirat's intake scratchpad** — where he jots thoughts between sessions. Has its own 🔑 Legend + `HOW THIS FILE WORKS` header. It's a SCRATCHPAD, not a store: items get FILED into their real homes and marked/swept, so it shrinks. | Read at session start / when prompted / during a Document pass. Mark handled items IN-FILE the same session (see below). It is tracked in git and fully tidyable — no private section lives inside it anymore. | Harkirat (author), Claude (tidies) |
| **`SESSION-START.md`** | **The canonical session-start prompt** — auto-loaded every session via a `SessionStart` hook. Holds the NON-NEGOTIABLES glossary (commit/push/deploy/document). | When the session-start expectations change. Edit here directly; it's the single source (not duplicated in memory). | Claude |
| **`README.md`** (this file) | The docs map. | When a doc file is added, removed, or its role changes. | anyone |
| **`notes-archive/`** | Dated pre-tidy snapshots of the notes file (pre-2026-07-18). Now largely superseded by git history since the notes file is tracked. | Rarely — git `diff`/`log` covers this need now. | reference |

**Two authoritative records that live OUTSIDE this folder:**
- **Memory** — `~/.claude/projects/-Applications-Diors-Builds/memory/` (NOT the repo-slug path; see CLAUDE.md's
  canonical-memory-path note). Standing rules for how to work. **Start at `user_working_agreement.md`** — its
  top "🔴 THE RULES THAT GET SKIPPED" checklist is the fastest way to load the non-negotiables. `MEMORY.md`
  is the index.
- **`/Applications/Claude Code/deferred-items.md`** (outside this repo) — the cross-project deferred/bug/tech-debt
  tracker. 🐞 Active Bugs at the top. Check it first when touching a known-buggy area.

---

## How they relate (don't duplicate — sync)

- **`CLAUDE.md` is the source of truth for the roadmap.** Its "Next planned work" is authoritative; the
  `🔮 Planned & Upcoming` (CHANGELOG) and `🔜 Coming soon` (SUMMARY) sections are *synced views* of it — update
  all three together, or they silently drift (that's a real records bug, not cosmetic).
- **The notes file feeds the roadmap, it doesn't hold it.** A feature idea lands in the notes as intake, gets
  FILED into CLAUDE.md + the changelog roadmaps, then LEAVES the notes file. The roadmap is never duplicated in
  the notes file.
- **Memory holds the rules; the docs hold the record.** A workflow lesson → memory. A shipped change → changelog.
  The "why" behind the code → CLAUDE.md. The story of getting there → DEVLOG.

## Responsibilities / chores checklist (per push)
1. Bump the version per `project_dior_builds_changelog_system` (memory) — one number per push, not per commit.
2. `CHANGELOG.md`: a numbered entry (or `Unreleased` if committed-not-pushed).
3. `CHANGELOG-SUMMARY.md`: a friendly line (user-facing) or a range/one-liner (ops/docs-only) — never skip the number.
4. `CLAUDE.md`: update any design/architecture note the change affects; keep the ToC current.
5. `DEVLOG.md`: a narrative entry if the work had real reasoning/discovery.
6. Memory: update any rule the session established or corrected.
7. `diors-builds notes.md`: mark/file/sweep anything the session handled — **in-file, same session**.
8. Tag the push (`git tag vX.Y.Z`) and push the tag.

## Versioning
`vMAJOR.MODERATE.MINOR` (3-part, uniform throughout as of 2026-07-21). Full rules in
`CHANGELOG.md`'s versioning header and the `project_dior_builds_changelog_system` memory (the source of truth
for the scheme). To find the current live version: `git describe --tags` or `scripts/vmstatus.sh`.

## Date/time convention (all records)
Write dates with a **time and timezone** — `YYYY-MM-DD HH:MM TZ` (e.g. `2026-07-21 22:46 EDT`), not a bare
date (Harkirat's standing request, 2026-07-21 ~22:46 EDT). The time is a second factor for exact intra-day
ordering when several things ship the same day; always state the timezone because the VM runs UTC while
Harkirat is ET. Get the real clock time with `date "+%Y-%m-%d %H:%M %Z"`.
