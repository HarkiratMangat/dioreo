---
kind: record
status: live
---

# Session-start prompt — Dioreo

## ⚡ First action
The working agreement is already in your context (global `~/.claude/WORKING-AGREEMENT.md`, imported by the global CLAUDE.md — check for the `**WORKING-AGREEMENT-END**` sentinel; say so if it's missing). The `self-check.sh` hook fires on every prompt and carries the rename-string + model-effort gate, the chapter-marking reminder, and the judgment/final-message rules — follow what it prints rather than re-deriving any of it here.

## 🔴 Where to start / how to hand off
`npm run handoff` at the end of a session or before a compact — it checks the carriers (pointer chain, `.remember`'s size, whether records grew, uncommitted work). A pass means the CARRIERS are in order, not that what you wrote is right. Full procedure: `docs/reference/session-handoff-guide.md`.

Session-specific "what to work on next" lives in `.remember/remember.md`'s auto-injected LAST HANDOFF block, not here — that file is rewritten every session; this one deliberately is not, so it can't accumulate stacked "start here" pointers again.

## 🔴 Portal decisions
`docs/reference/portal-decision-ledger.md` — every settled portal decision with a falsifier per row. Query it before re-deriving one.

## 📖 MEMORY.md
Loads in FULL via CLAUDE.md's `@`-import. Check the sentinel: MEMORY.md's penultimate line should read `**MEMORY-INDEX-END**` as visible text. See it → the index is complete. Can't find it → `Read` the file directly and say so.

## ⛔ Worktrees — verify before touching any of them
Never delete or act on a `.claude/worktrees/*` without checking first: run `git worktree list`, then read `docs/db-deferred-list.md`'s worktree-protection entry for which ones are active peer sessions. The count changes while you work — don't trust a cached number, including the one in that entry.

## Non-negotiables — one line each; the linked memory/rule is canonical, not this list
- Never push, merge, or deploy without asking first, every time — `project_git_workflow` memory. Branch commits + running the local dev bot are free.
- Git workflow (Branch→Commit→Test→Push→PR→Merge→Deploy, version minted at merge) — full glossary in `docs/reference/deployment-and-ops.md` § The Branch→Deploy workflow, canonical memory `project_git_workflow`.
- Central scratchpad `docs/ideas/diors-notes.md` — read it, mark items in-file the same session — `project_central_notes_file` memory.
- Canonical Diors memory path is THIS repo's slug — never the old `-Applications-Diors-Builds` backup — `project_memory_slug_migration` memory.
- Before filing a new doc, read the folder taxonomy in CLAUDE.md's 🗺️ nav map or `docs/README.md`.

## Conditional reads
- Touching a version number or changelog → skim `project_dior_builds_changelog_system` memory first.
- About to push/merge/deploy → restate who approved what, to what, when — `feedback_approval_has_a_scope` memory.

If anything here conflicts with what you find in the docs, flag it — don't silently pick one.
