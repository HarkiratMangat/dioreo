---
kind: reference
status: live
---

> 🔴 **Superseded 2026-09-28 23:59 EDT:** the kit moved into `docs/pins2/kit/`, tracked, on Harkirat's call of 2026-09-28 23:27 EDT — see `docs/pins2/kit/README.md`. This is the record of the local-only arrangement it replaced.

# This kit has its own local git repo — and it never leaves this machine

*Set up 2026-09-20 21:33 EDT, at Harkirat's instruction: "set up a local git for the kit, i dont want it in the online github for the dioreo repo."*

## Why it exists

`local/` is gitignored by the Dioreo repo (`.gitignore:25`), so nothing in this kit has ever had a history — a 494 KB stylesheet and a 107 KB gate file, edited dozens of times a day, with no way back. On 2026-09-20 he asked for the export landing to be reverted to an earlier version and there was nothing to revert TO: the artifact service holds published versions but exposes no way to name one, the app's version picker had been removed, and codebase-memory keeps only a current graph. The state was eventually recovered out of the session transcript, because this repo's editing contract puts the previous text in every `assert` anchor. That worked once. It is not a backup.

## The rule

**No remote. Ever.** The Dioreo repo's `.gitignore` already makes this directory invisible to it, so nothing here can reach GitHub through the parent — and `.git/hooks/pre-push` refuses a push outright, so it cannot reach GitHub through this repo either. If a remote is ever genuinely wanted, that is Harkirat's call and the hook comes out in the same change that adds it.

## What is tracked

Everything but `shots/`, which is 277 MB of the kit's 281 MB and is entirely reproducible — `sweep-screens.cjs` renders the board's sixteen screens, `shot-el.cjs` photographs one element across a fork's values, and `verify.cjs` re-shoots on demand.

## Using it

Commit at the end of a round, the way the board is published: one commit per round, named for the round. Then "revert the landing to v2" is `git show <sha>:gates/armory.js`, not an hour of archaeology.

## Re-rooted 2026-09-21 19:10 EDT

The repo's `.git` moved from `local/pins2-board-3/redo/` to `local/pins2-board-3/`, at Harkirat's direction, so his screenshots (`hk-shots/`, `refs/`, `board4-review/intake/`), the pre-redo boards (`v1-*`, `v2/`, `board.html`) and the Board 4 review renders share one local history with the kit. The kit's files now sit under `redo/`; `git -C local/pins2-board-3/redo …` still works from the subfolder. Still local only, never pushed.
