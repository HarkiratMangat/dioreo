---
kind: record
status: live
---

# `docs/claude/` — Claude's tracked scratchpad

*Created 2026-09-15 23:55 EDT. Harkirat: "it would be better for you to have a tracked scratchpad style folder for you to save into… with `local/` still being available whenever you need, if the content isn't supposed to/worth being tracked."*

## What goes here

The one-off write-ups a session produces and a later session would want to find: **lessons, audits, critiques, post-mortems, measured baselines, inventories.** Create sub-folders freely when a topic earns one.

**The test for tracked-vs-`local/`, both halves required:** losing it would cost real work to re-derive, **and** someone outside the session that wrote it would need it. Short-lived working notes, agent stdout, probe dumps and captures stay in `local/`.

⚠️ **Being CITED by a tracked doc is not automatically a reason to promote.** A `docs-audit` `xref` warning has two valid fixes — promote the file, or delete the citation. Choose by the test above, not by the warning.

## Conventions

- **Name with the date AND the topic**: `2026-09-15-spec-vs-structure-drift.md`, never `session-3-audit.md`. A date alone is browsable; a topic makes it searchable, which is the whole point.
- **Front matter is required** (`kind:` / `status:`) — `docs-audit`'s `doc-frontmatter` exempts only `hookify` and `.impeccable/`.
- **Add a row below when you add a file.** `readme-map` only checks that the directory is named in `docs/README.md`, so this index is discipline rather than a gate — and an index nobody maintains is worse than none.
- **`archive/` is not optional.** A lesson that has since become a hook, a rule or a gate MOVES there. Without that this folder only grows, and a list that only grows stops being read.

## Index

| File | What it holds |
|---|---|
| [`2026-09-15-spec-vs-structure-drift.md`](2026-09-15-spec-vs-structure-drift.md) | Why board 2's manifest ported at ~95% and board 1's drawers did not, and the three failures behind a session that produced specs instead of the board it was asked for. **A value spec is enough only when the two implementations already agree structurally.** |
