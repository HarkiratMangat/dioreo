---
version: 1
slug: "portal-ui-analytics-js"
primary_target: "portal/ui/analytics.js"
related_targets: []
---

## Scope and mode

**Analytics** — `portal/ui/analytics.js`. Mode: **Operate**. Views: Health · Usage · Timing · Reach · Search.

Read what the bot actually did — health, usage, timing, reach, search. The event river and its revert moved to History on 2026-09-13 18:59 EDT (batch-2 spec §4); Health's tiles and level rows open History pre-filtered.

## Audience and job

One admin today, a second one shortly: `models/AdminUser.js` and the per-page scopes already exist, so the realm is designed for a reader who did NOT specify it. Density is chosen, never maximal.

**The arriving state:** Something feels slow, broken, or unused, and he wants the record rather than an impression.

## The task, and what proves it done

Nothing here is authored. The realm succeeds when a reader understands a number without translating it: no p50, p95 or headroom reaches the page.

## What must stay untouched

- **Conformance is measured, not judged.** The design authority is `docs/superpowers/mockups/2026-08-23-portal-interactive/`, and this realm closes on the ENUMERATION of cited differences, never on a percentage.
- Colour carries topic; shape carries state. A new state gets a new shape, never a new hue.
- The dev database carries synthetic traffic from `scripts/seedAnalyticsTraffic.js` since 2026-09-13 18:59 EDT; judge populated layouts on it, never real usage.

## Memorable moment

The one realm that is READ shaped inside an Operate product: its success is comprehension, not completion.

## Unresolved

Batch-2 Session 2 owns the admin-traffic control (gate G2) and the small-text sort (gate G1).
