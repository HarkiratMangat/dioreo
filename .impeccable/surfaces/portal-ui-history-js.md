---
version: 1
slug: "portal-ui-history-js"
primary_target: "portal/ui/history.js"
related_targets: []
---

## Scope and mode

**History** — `portal/ui/history.js`. Mode: **Operate**. One view: the event river.

Every change, alert and restart on one timeline, with revert as its single action. Split whole out of Analytics on 2026-09-13 18:59 EDT (batch-2 spec §4): the river carries undo and revert, a capability, while Analytics is a surface for looking.

## Audience and job

One admin today, a second one shortly. The reader arrives from Analytics' Health tiles or level rows with a filter already applied, or from Review's promise that a committed change can be reversed here.

**The arriving state:** Something changed and he wants to see what, who did it, and put it back.

## The task, and what proves it done

A revert applies a change's recorded inverse immediately — it does not stage — and is itself recorded. The realm's job is to make the right row findable and the wrong-row mistake unlikely: the confirm names the rows.

## What must stay untouched

- The river's decisions moved here verbatim from Analytics: five columns, the kind and level filters, the event drawer, one word (Reverse) for undoing a committed change. They are rows under `## History` in `docs/reference/portal-decision-ledger.md`.
- History has no mockup page, so no overlay instrument can measure it; conformance here is judged against the ledger rows, not a percentage.
- Colour carries topic; shape carries state.

## Memorable moment

The one place a committed mistake can be undone.

## Unresolved

Batch-2 Session 2 owns the When column (UTC today, local time decided), column widths by role, and severity on the level chips.
