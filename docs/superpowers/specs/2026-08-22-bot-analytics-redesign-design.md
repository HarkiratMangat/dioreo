---
kind: spec
status: superseded
superseded_by: docs/superpowers/specs/2026-08-23-bot-analytics-live-review-design.md
---

> ## ⏭️ SUPERSEDED 2026-08-23 11:34 EDT — this design was built exactly as written, shipped, and was then found wrong on a real client
> **Read `docs/superpowers/specs/2026-08-23-bot-analytics-live-review-design.md` first.** It carries the seventeen live-review findings and the six rules that replaced this document's §3–§5, plus the phase-2 plan pointer.
>
> **This file is deliberately left otherwise UNEDITED.** Its §1 investigation and §2 rule 0 still stand. The rest is kept as-is because the most useful thing it now contains is the evidence that a confidently-argued spec for a *rendered* surface cannot be validated by reading it: four of the successor's six rules contradict something asserted here, and each contradiction cost a shipped release to find. Correcting the text in place would destroy exactly that record.

# `/bot analytics` redesign — design

**Date:** 2026-08-22 · **Author:** Claude Opus 5 with Harkirat · **Status:** approved for planning, not yet built

> ## 🔭 REFRAMED 2026-08-22 23:40 EDT — Discord is a GLANCE, the portal is the depth
> Harkirat, mid-drafting: *"i have the new dioreo portal for the indepth analytics now, so turn the discord version into more a snapshot or summary or overview or 'quick glace', rather than dumping ALL info."*
>
> **This changes what the five pages are FOR, and it is the better answer to the original complaint.** The first draft of this spec assumed Discord had to remain a complete analytics dashboard and tried to make five dense pages distinguishable. But a chat message is a bad dashboard, and part of why these pages read as *"ugly and unintuitive"* is that they were built to be one. Now they don't have to be: `portal/api/analytics.js` and `portal/ui/analytics.js` are live, read-only, revert-capable, and reuse the very same export functions `/bot analytics` calls — so nothing is lost by moving depth there, only relocated.
>
> §1 (the investigation) and §4 (the copy pass) are unaffected and still stand — the empty states and the confusable summary lines are wrong at any density. §2, §3, §5 and §6 below are written against the reframe.

Harkirat's words: the pages are *"so ugly and unintuitive"* and need a *"DRASTIC"* redesign, and Alerts and Changes *"show the exact same info."* This document says what the five pages become and why. The implementation plan is `docs/superpowers/plans/2026-08-22-bot-analytics-redesign.md`.

## 1. The reported bug is not a data bug, and the investigation matters

The first thing checked was whether Alerts and Changes really do render the same information, because if they did, this would be a one-line query fix rather than a redesign. **They do not.** `buildAlertsBody` reads `AlertLog` through `utils/alertStore.js` — bot health events, crashes and gateway drops. `buildChangesBody` reads `ChangeLog` through `utils/changeStore.js` — `/manage` database mutations. Two collections, two meanings, no overlap.

What is real is that **the two pages are the same page wearing different numbers.** Read as shapes rather than as content, all five builders are one skeleton:

```
-# intro line          →  bold summary counts  →  {type:14} divider
→  list, or an empty-state italic  →  optional pager  →  action row
```

The only per-page difference in the entire subsystem is `PAGE_META`'s `accent_color`. On a bot with little recent activity, both pages collapse to a heading, a row of zeros, and an italic sentence — and those italic sentences are near-identical English. A reader with no structural cue to separate two pages has only one hypothesis left, and it is the one Harkirat reached: *the data must be the same.* **The confusion was a correct reading of the design.**

## 2. The governing rules

> **Rule 0 — Discord answers ONE question in ONE screenful. Everything past that is the portal's job.**

This is first because it decides how much there is to design. A page earns its place by what a reader can take in without scrolling and without clicking: a verdict, a handful of numbers, the few most recent rows. The moment a page needs a pager, a filter, or a second click to be useful, it has stopped being a glance and the portal already does it better.

**Concretely, this removes from Discord:** the Alerts pager, the Changes pager, the Changes page-filter dropdown and Filter-by-Actor button, and the three Export buttons. Each page instead ends with one Link button into the matching portal view. That is not a capability loss — `portal/ui/analytics.js` carries all of it, including revert (`portal/api/changesets.js`'s `POST /api/revert/:changeId`) — it is a relocation, and it should be described that way to Harkirat rather than presented as a simplification.

**One deliberate exception: Revert stays on Discord, for the most recent changes only.** Undoing the edit you just got wrong is the single most time-critical action in the whole subsystem, and making it a browser round-trip is a real regression at exactly the wrong moment. Everything else about Changes moves.

> **Rule 1 — Each page differs in its component GRID. Colour is a label, never the identity.**

This is not a new opinion. It is the lesson already paid for on the changelog site, recorded in the `project_changelog_redesign` memory: the first build of those three pages was one shell in three accent colours, Harkirat rejected it on sight, and what separates them now is the grid — notice board, ledger, timeline. `/bot analytics` is that same mistake, currently shipping, at five pages instead of three.

Components V2 gives a real structural vocabulary to spend: Text Display (10), Section-with-accessory (9), Separator (14) at two spacings with or without a divider, Action Row (1), and the Container (17) itself. Today every page spends exactly one shape out of that set.

**A second rule, to keep the first honest:** the grid must come from what a page *is*. A difference invented for variety is noise wearing structure's clothes. Every identity below is a property the data already has and the page currently fails to express.

**A third rule, scope:** no page gains, loses, or trades a fact with another page. The complaint is that the pages look alike, not that information sits in the wrong place.

## 3. The five identities

Each row is one screenful. "Depth" names what moves to the portal rather than being deleted.

| Page | It answers, at a glance | Its grid | Its signature | Depth lives in the portal |
|---|---|---|---|---|
| **Health** | Is the bot okay *right now*? | Verdict line, then a fixed vitals block in a monospace fence | **No list at all.** The only page that states an answer before any facts | Historical boot records, the full cloud-metrics window set |
| **Alerts** | What went wrong, and when? | Severity ledger, then the **3 most recent** alerts, led by a severity glyph | **Per-row severity colour.** The only page whose rows are colour-coded | The full alert log, the export, the explainer |
| **Changes** | Who edited what — and undo the last one | Ledger line, then the **3 most recent** edits, each with Revert | **Every row carries a control.** The only page whose rows are actionable | The full change river, page/actor filters, export, revert on anything older |
| **Usage** | What do people actually use? | One headline stat with its delta, then a proportion bar per command (top 5) | **A visual proportion.** The only page that draws rather than lists | Entry-point and outcome breakdowns, longer windows, export |
| **Timing** | Where does the time go? | Ack and duration against their budget, with headroom, then the **worst 3** commands | **Every number carries a verdict against a threshold**, not a bare value | Per-dependency totals, the full command table, export |

Every identity is a property the data already has and the page currently fails to express: Health already opens with `healthVerdict()`, Alerts already has `LEVEL_ICON`, Changes already has a Revert button per row, Usage already computes a percentage delta, Timing already knows the 3,000ms deadline. Nothing here is invented for variety.

**Considered and rejected: collapsing all five into one overview screen.** It is the logical end of rule 0, and it is wrong here for two reasons. The five questions have genuinely different audiences and rhythms — Health is checked when something feels off, Changes right after an edit, Usage weekly — and one screen holding all five would be exactly the undifferentiated dump this redesign exists to remove. Rule 3 also forbids it: no page trades facts with another.

## 4. The copy pass — where the reported bug actually lives

Today's empty states, verbatim:

| Page | Today |
|---|---|
| Health | `_none recorded_ 🟢` |
| Alerts | `_No alerts recorded yet — nothing has needed one._ 🟢` |
| Changes | `_No changes recorded yet._` |
| Usage | `_no data yet_` (three times on one page) |
| Timing | `_no external dependency calls recorded yet_` |

Four of the five are the same sentence with a different noun, and on a quiet bot they *are* most of the page. Replacements follow the empty-state pattern — what this is, why it is empty, how it fills — so that each one names its own cause and cannot be mistaken for another page's:

- **Alerts** — “**Nothing has gone wrong.** Alerts land here when the bot crashes, loses its gateway connection, or hits a database error. An empty list is the healthy state.”
- **Changes** — “**No edits in this window.** Every `/manage` save writes a row here with who made it and a one-click Revert. Make a change and it appears immediately.”
- **Usage** — “**No command usage in the last 7 days.** Only public commands count — your own `/manage` and `/bot` activity is deliberately excluded.”
- **Timing** — “**No timings recorded yet.** Every interaction records how long it took to acknowledge and to finish. This fills in on its own as the bot gets used.”

Usage's clause carries real weight: on the dev bot the admin *is* the only user, so “no data yet” reads as broken until you know admin traffic is filtered out. That footnote exists today, at the bottom of the page, where a reader who is already confused never reaches it.

**The summary lines have the same disease.** Alerts and Changes both render `**Last 24h:** N` in the same position at the same weight, so the eye reads two identical rows even though the nouns differ. Each page's summary takes its own shape instead: Alerts is a severity breakdown (`🟢 2 · 🟡 0 · 🟠 1 · 🔴 0`), Changes is a who-and-what breakdown (`12 edits by 2 admins · 3 reverted`).

**The page switcher teaches the subsystem, for free.** `pageSelectRow` says “Switch page…” and each option is a bare label. A select option's `description` is a field, not a component, so it costs nothing against the 40-component cap. Give each option the question its page answers — Health “Is the bot okay right now?”, Alerts “What has gone wrong, and when”, Changes “Who edited what, and undo it”, Usage “What people actually use”, Timing “Where the time goes”. This is the cheapest available fix for “unintuitive” and it should land first.

## 5. Constraints that bind every choice

- **40 components per message, counted recursively.** Not a style guideline — the Changes page already measured 45 at 8 rows and was cut to 5 (see `commands/bot.js`'s `CHANGES_PER_PAGE` comment). Every grid below must be **measured** before it ships, never estimated. That comment exists because someone measured; do the same.
- **~40 columns of readable width on a phone.** `peaksLine`'s code fence is the working precedent for monospace alignment inside that budget.
- **No pagers, no filters, no exports on Discord** (rule 0). If a page needs one to be useful, that need belongs to the portal. This also buys back a large slice of the component budget, which is what makes the per-row Revert accessory affordable on Changes.
- **Every page ends with exactly one Link button into the portal.** Resolve the real route from `portal/ui/app.js`'s own routing — do not invent a URL.
- **One render path.** `buildAnalyticsPanel` is the single entry point for both the slash command and `handlers/bot.js`'s re-render branches. It stays that way; five pages diverging in grid must not become five divergent render paths.

## 6. Audit log

A pass whose stated job was to find where this design is **wrong**, per `.claude/rules/plan-drafting.md`. Five findings, two of which would have shipped as false statements in an approved spec.

1. 🔴 **A component-count claim was simply wrong.** The first draft argued the Changes page's Section grid was *cheaper* than today's shape and could therefore raise rows-per-page back above 5. Recounted: a Section is `9 + 10 + 2 = 3` components; today's row is `10 + 1 + 2 = 3`. **They are equal.** The Section grid is justified on identity alone. The spec must not promise a row-count increase, and the implementation must re-measure rather than trust either number.
2. 🔴 **“A Section's accessory can be a Button” is UNVERIFIED here.** `/help`'s landing page proves a type-9 Section renders in this bot, but with a **Thumbnail** accessory (type 11), not a button. The Changes grid rests entirely on the button case. The plan therefore opens with a spike that renders one on the dev bot before anything is built on it; if it fails, Changes keeps today's row shape and takes its identity from the ledger summary and per-row attribution instead.
3. 🟡 **The Usage bar chart can lose on mobile.** A `/commandname ████░░ 12` row that wraps is worse than the list it replaces. The bar gets a fixed 10-cell width and the *command name* truncates — never the bar, which is the only part carrying the comparison.
4. 🟡 **Three of five pages can only be seen empty from here.** Usage and Timing query `AnalyticsEvent`, which is near-empty on the dev bot. So the empty-state copy is the part this spec can verify and the dense-state layout is the part that cannot be — it needs a check against production-shaped data before anyone calls it done. Stated as a limitation rather than discovered as a surprise.
5. 🔴 **The whole first draft answered the wrong question, and the reframe caught it.** It assumed Discord must stay a full dashboard and spent its effort making five dense pages distinguishable. The cheaper and better fix was to ask what Discord is FOR now that the portal exists. Worth recording because the premise was never stated out loud and therefore never tested — exactly the failure mode a falsification pass is supposed to catch, and it took Harkirat noticing rather than this pass.
6. 🟡 **"Move it to the portal" must be checked, not assumed.** Before writing rule 0 into this spec, `portal/api/analytics.js` and `portal/ui/analytics.js` were confirmed to exist, to be admin-gated and read-only-except-revert, and to reuse the same export functions — so the depth genuinely is already there. Had it not been, rule 0 would have deleted real capability and called it design.
7. 🟢 **A rejected temptation, recorded so it is not re-proposed:** adding a sixth page, or moving facts between pages. Neither is what was reported. Rule three in §2 exists because of this finding.

## 7. What this spec deliberately does not decide

Whether the redesign ships before or after the v3.0.0 launch. `/bot analytics` is admin-only and invisible to players, so it competes for time with the v3 pre-launch checklist rather than blocking it. That is a scheduling call for Harkirat, made against the plan's task list rather than in advance of it.
