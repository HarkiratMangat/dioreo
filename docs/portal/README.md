---
kind: record
status: live
---

# `docs/portal/` — portal working records

*Created 2026-09-15 23:55 EDT. Portal-specific tracked files that are not a rule, a plan, a dated design snapshot or a mockup package. Sub-folders are free to create.*

## What is here

| File | What it holds |
|---|---|
| [`portal-sync-notes.md`](portal-sync-notes.md) | **The pin log.** Every pin Harkirat has filed on the live portal, newest last, with its crop. Written by `npm run portal:sync`; a session marks each pin as it is handled. |
| [`portal-pins/`](portal-pins) | The crops those pins point at — 104 files, ~11MB. They live here rather than in `local/` because the log is tracked and a tracked doc must not cite an untracked path. |
| [`archive/`](archive) | Handled pins, swept out of the live log so it stays readable. `kind: archive`, `status: frozen` — never edited after the sweep. |

## What does NOT move here

`docs/reference/portal-decision-ledger.md`, `portal-audit-tools.md` and `portal-launch-checklist.md` stay in `reference/`: they are **lookup docs**, they are cited from `CLAUDE.md`, and they are doing their job. Portal plans stay in `docs/superpowers/plans/`, mockup packages in `docs/superpowers/mockups/`. This folder is for portal records with no other home — moving the working ones would be a reorg for its own sake.

## Why it was created

`local/` held 253 markdown files because nothing else existed, and the pin log — 46KB live plus a 65KB archive, cited by the batch-2 plan by path — was the worst instance: a fresh clone could not resolve it. Created at Harkirat's direction, 2026-09-15 23:55 EDT.
