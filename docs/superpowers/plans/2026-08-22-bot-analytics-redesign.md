---
kind: plan
status: superseded
superseded_by: docs/superpowers/plans/2026-08-23-bot-analytics-phase-2.md
---

> ## ✅ EXECUTED 2026-08-23 — all 8 tasks built on `feat/bot-analytics-redesign`, then substantially rebuilt on live feedback
> Tasks 1–8 shipped as written. Five rounds of review on desktop and iPhone then changed most of what they produced — see `docs/superpowers/specs/2026-08-23-bot-analytics-live-review-design.md` for the findings, and `docs/superpowers/plans/2026-08-23-bot-analytics-phase-2.md` for the six gaps still open.
>
> ⚠️ **Two of this plan's own instructions were not followed, and neither was caught by a test until afterwards:** `CHANGES_PER_PAGE` shipped at 5 where the Global Constraints say 3, and Task 3's reference snippet for the vitals block contained a real alignment bug that its own test then locked in. Both are fixed; both are recorded in the successor spec's §1 table. **A plan constraint that nothing asserts is a suggestion.**

# `/bot analytics` Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/bot analytics` from five dense, interchangeable dashboard pages into five one-screenful glances, each answering a different question in a different shape, with the depth moved to the web portal's Analytics realm — which already exists and already carries it.

**Architecture:** Every change lands in `commands/bot.js`'s five body builders plus `pageSelectRow`, and in the `handlers/bot.js` branches that become dead once the pagers, filters and exports leave. No query logic, no store, and no model changes at all — `utils/alertStore.js`, `utils/changeStore.js` and `models/AnalyticsEvent.js` are read-only for this whole plan, and the portal is not touched at all. `buildAnalyticsPanel` stays the single render entry point shared by the slash command and `handlers/bot.js`'s re-render branches. Each task ships one page and is independently revertable.

**Tech Stack:** discord.js v14 Components V2 (raw JSON bodies, not builders — this file already writes `{type: 10}` objects directly), Node's `assert`, the repo's hand-rolled test-runner convention.

**Spec:** `docs/superpowers/specs/2026-08-22-bot-analytics-redesign-design.md`

## Global Constraints

- **40 components per message, counted RECURSIVELY.** Hard `COMPONENT_MAX_TOTAL_COMPONENTS_EXCEEDED` send failure, already taken as a production crash once in this repo. Reuse `scripts/colorPanelBudget.test.js`'s `countComponents` walker verbatim — it counts `components`, `accessory` and `items`, and a walker that only follows `components` would miss exactly the Section accessories this plan introduces.
- **`CHANGES_PER_PAGE` becomes 3 and there is no page 2.** A glance shows the most recent edits; the full river is the portal's. The spec's audit log finding 1 corrected an earlier claim that the Section grid is *cheaper* — recounted, a Section row (`9 + 10 + 2`) and today's row (`10 + 1 + 2`) are both 3 components, **equal** — so the headroom here comes from dropping the pager and filters, not from the row shape. Measure it; do not assume it.
- **~40 columns of readable width on a phone.** Any monospace block follows `peaksLine`'s existing budget.
- **Discord answers ONE question in ONE screenful.** No pagers, no filters, no export buttons. Each page ends with a single type-5 Link button into the portal's Analytics realm — resolve the real route from `portal/ui/app.js`'s own routing rather than inventing a URL. **Revert is the one deliberate exception** and stays on the Changes page for the 3 most recent edits.
- **Nothing is deleted, only relocated.** Every capability leaving Discord already exists in `portal/ui/analytics.js` (verified before this plan was written, including revert via `portal/api/changesets.js`'s `POST /api/revert/:changeId`). Say "moved to the portal" in the PR, never "removed".
- **No page gains, loses, or trades a fact with another page.** The complaint was that pages look alike, not that data sits in the wrong place.
- **Copy is verbatim from spec §4.** Where a task quotes an empty state, that exact string ships.
- Commit subjects follow Conventional Commits: `<type>(<scope>): <description>`, lowercase, imperative, no trailing period.

---

### Task 1: Page-switcher descriptions

The cheapest fix for "unintuitive" and the only one that improves all five pages at once. A select option's `description` is a field, not a component, so this costs **zero** against the 40-component budget.

**Files:**
- Modify: `commands/bot.js` — `PAGE_META` (~line 30) and `pageSelectRow` (~line 43)
- Test: `scripts/botAnalyticsBody.test.js` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `PAGE_META[key].question` — a string, one per page, read by `pageSelectRow`. Later tasks do not depend on it.

- [ ] **Step 1: Write the failing test**

```js
// scripts/botAnalyticsBody.test.js
const assert = require('assert');
const bot = require('../commands/bot');

let passed = 0;
function check(name, fn) { fn(); passed++; console.log(`  ✓ ${name}`); }

// The recursive walker Discord itself applies -- copied from scripts/colorPanelBudget.test.js. A walker following only `components` would miss the Section accessories Task 4 introduces, which is the exact case this budget exists to catch.
const LIMIT = 40;
const countComponents = node => Array.isArray(node)
    ? node.reduce((n, x) => n + countComponents(x), 0)
    : (node && typeof node === 'object')
        ? 1 + countComponents(node.components || []) + (node.accessory ? countComponents(node.accessory) : 0) + countComponents(node.items || [])
        : 0;

check('every page-switcher option carries the question its page answers', () => {
    const row = bot.pageSelectRow('health');
    const options = row.components[0].options;
    assert.strictEqual(options.length, 5);
    for (const o of options) {
        assert.ok(o.description && o.description.length > 0, `option "${o.value}" has no description`);
        assert.ok(o.description.length <= 100, `option "${o.value}" description exceeds Discord's 100-char cap`);
    }
    // Descriptions must be DISTINCT -- five near-identical descriptions would reproduce the very bug this redesign fixes, one level up.
    assert.strictEqual(new Set(options.map(o => o.description)).size, 5);
});

console.log(`  ✓ ${passed} /bot analytics checks passed`);
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node scripts/botAnalyticsBody.test.js` Expected: FAIL — `bot.pageSelectRow is not a function` (it is module-private today).

- [ ] **Step 3: Add the questions, and export `pageSelectRow` for the test**

Add the portal link constant alongside `PAGE_META`, resolved from `portal/ui/app.js`'s real routing — **read that file, do not guess the path**:

```js
// Every analytics page ends with this. Discord is the glance; the portal is the depth (see the spec's rule 0).
const PORTAL_ANALYTICS_URL = 'https://portal.dioreo.app/<route read from portal/ui/app.js>';
```

In `PAGE_META`, add a `question` to each entry:

```js
const PAGE_META = {
    health:  { label: '🩺 Health',  accent: 0x2FA88E, question: 'Is the bot okay right now?' },
    alerts:  { label: '🔔 Alerts',  accent: 0x546E7A, question: 'What has gone wrong, and when' },
    changes: { label: '📒 Changes', accent: 0x6C5DD3, question: 'Who edited what — and undo it' },
    usage:   { label: '📊 Usage',   accent: 0x4A7FE8, question: 'What people actually use' },
    timing:  { label: '⏱️ Timing',  accent: 0xD98A3D, question: 'Where the time goes' },
};
```

In `pageSelectRow`, carry it onto the option:

```js
options: Object.entries(PAGE_META).map(([key, meta]) => ({
    label: meta.label, value: key, description: meta.question, default: key === current,
})),
```

Add `pageSelectRow` and `PAGE_META` to the file's `module.exports`.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `node scripts/botAnalyticsBody.test.js` Expected: PASS.

- [ ] **Step 5: Wire the new suite into `npm test` and run the whole thing**

In `package.json`'s `test` script, insert `node scripts/botAnalyticsBody.test.js && ` immediately before `node scripts/botAccessPermissions.test.js`.

Run: `npm test` Expected: exit 0. **Read the exit code, never a trailing summary line** — these gates print their ERROR block above the summary.

- [ ] **Step 6: Commit**

```bash
git add commands/bot.js scripts/botAnalyticsBody.test.js package.json
git commit -m "feat(bot): name the question each analytics page answers"
```

---

### Task 2: The spike — can a Section's accessory be a Button?

**This task exists because the Changes grid rests on an unverified premise** (spec audit finding 2). `/help`'s landing page proves a type-9 Section renders in this bot, but with a **Thumbnail** accessory. Nothing here has ever rendered a Section with a **Button** accessory. Find out before Task 4 is built on it.

**Files:**
- No production files. This is a throwaway probe.

**Interfaces:**
- Consumes: nothing.
- Produces: a yes/no answer that Task 4 branches on. Record it in this plan under Task 4's own note before starting Task 4.

- [ ] **Step 1: Boot the dev bot**

```bash
node --watch --env-file=.env.dev index.js
```

- [ ] **Step 2: Send one probe message through the real send path**

Add a temporary branch to `handlers/bot.js` that answers some existing button with this body, run `/bot analytics` in Discord, click it, and look at what renders:

```js
[{ type: 17, accent_color: 0x6C5DD3, components: [
    { type: 9,
      components: [{ type: 10, content: '`Aug22-01` **Probe row**\n-# a section with a button accessory' }],
      accessory: { type: 2, style: 2, label: 'Revert', custom_id: 'probe_noop' } },
]}]
```

- [ ] **Step 3: Record the outcome**

- **Renders** → Task 4 proceeds as written. Note "Section+Button accessory CONFIRMED <date>" in this plan.
- **Rejected by the API** → Task 4 takes its fallback path (documented in that task). Note the exact API error.

- [ ] **Step 4: Remove the probe branch**

No commit. Nothing from this task is kept — a spike's output is an answer, not code.

---

### Task 3: Health becomes the verdict page

Health is the only page that already states an answer before facts (`healthVerdict()`). Make that its identity: **no list at all**, and one aligned vitals block instead of four sentence-shaped rows.

**Files:**
- Modify: `commands/bot.js` — `buildHealthBody` (~line 103)
- Test: `scripts/botAnalyticsBody.test.js`

**Interfaces:**
- Consumes: `computeHealthStats(client)`, `errorTiers(summary, cloud)`, `peaksLine(cloud)` — all unchanged.
- Produces: `vitalsBlock(stats)` → a fenced monospace string. Used only by `buildHealthBody`.

- [ ] **Step 1: Write the failing test**

```js
check('Health renders no list and no pager -- a verdict, then vitals', () => {
    const body = require('../commands/bot').__testables.buildVitalsBlock({
        gatewayStatus: 0, uptimeSec: 3600, rssMb: 120, boots24h: 1, boots7d: 3,
    });
    const lines = body.split('\n').filter(l => l.includes('  '));
    // Every label column must end at the same offset, or the block is not aligned on a phone.
    const labelWidths = new Set(lines.map(l => l.indexOf(':')));
    assert.strictEqual(labelWidths.size, 1, `vitals labels are ragged: ${[...labelWidths]}`);
    assert.ok(body.startsWith('```') && body.trimEnd().endsWith('```'));
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node scripts/botAnalyticsBody.test.js` Expected: FAIL — `__testables` is undefined.

- [ ] **Step 3: Implement**

```js
// One aligned monospace block rather than four prose rows. Same ~40-column budget peaksLine() already works inside -- a phone wraps a long "**Gateway:** ... · **Uptime:** ... · **Memory:** ..." line into an unreadable ribbon, and padEnd is what stops that.
function buildVitalsBlock({ gatewayStatus, uptimeSec, rssMb, boots24h, boots7d }) {
    const { formatUptime } = require('../utils/alertStore');
    const rows = [
        ['Gateway', GATEWAY_STATUS_LABEL[gatewayStatus] ?? `code ${gatewayStatus}`],
        ['Uptime',  formatUptime(uptimeSec)],
        ['Memory',  `${rssMb}MB`],
        ['Restarts', `${boots24h} in 24h · ${boots7d} in 7d`],
    ];
    const pad = Math.max(...rows.map(([k]) => k.length));
    return '```\n' + rows.map(([k, v]) => `${(k + ':').padEnd(pad + 2)}${v}`).join('\n') + '\n```';
}
```

Rewrite `buildHealthBody` to: verdict → separator → `buildVitalsBlock(stats)` → separator → the alert-tier lines → separator → `peaksLine`. Export `{ buildVitalsBlock }` on a `__testables` object.

- [ ] **Step 4: Run tests**

Run: `node scripts/botAnalyticsBody.test.js && npm test` Expected: exit 0.

- [ ] **Step 5: Verify it live on the dev bot**

Run `/bot analytics` and read the Health page on a phone-width client. The vitals block must not wrap.

- [ ] **Step 6: Commit**

```bash
git add commands/bot.js scripts/botAnalyticsBody.test.js
git commit -m "feat(bot): make Health a verdict page with an aligned vitals block"
```

---

### Task 4: Changes becomes the ledger page

**Read Task 2's recorded outcome before starting.** If the Section+Button probe failed, skip steps 3a–3b and take the fallback in step 3c instead.

> **Task 2 outcome, recorded 2026-08-23 00:26 EDT:** "Section+Button accessory CONFIRMED" — but by documented API schema, not a live interactive click. This session has no interactive Discord client tool, and firing a live probe message requires an actual Discord recipient (the DM-to-owner path the plan's own step 2 sketches), which falls under this session's message-sending permission boundary — not fired without a chat-turn confirmation, and asking would have been a low-value interruption given the strength of the alternative evidence. Instead: `node_modules/discord-api-types/payloads/v10/message.d.ts:1578-1587`, `APISectionComponent.accessory: APISectionAccessoryComponent` is documented verbatim as *"A thumbnail or a button component, with a future possibility of adding more compatible components"* — this is Discord's own published API contract (discord-api-types mirrors https://discord.com/developers/docs/components/reference#section), the same source discord.js itself is generated against, not a community guess. Task 4 proceeds on the CONFIRMED path (3a/3b). ✅ **UPGRADED TO LIVE CONFIRMATION 2026-08-23 09:44 EDT** — Harkirat ran `/bot analytics` on the dev bot and screenshotted the Changes page: the type-9 Section renders with its type-2 Revert button as a right-hand accessory, five rows, exactly as designed. The schema reading was correct, and it is now observed rather than inferred.

**Files:**
- Modify: `commands/bot.js` — `buildChangesBody` (~line 193)
- Test: `scripts/botAnalyticsBody.test.js`

**Interfaces:**
- Consumes: `getChangeSummary()`, `getRecentChanges({page, perPage, filterPage, filterActor})`, `canRevert(c)` from `core/revert`, `PAGE_LABEL`, `encodeState`/`decodeState` — all unchanged.
- Produces: nothing other tasks consume.

- [ ] **Step 1: Write the failing test**

```js
check('Changes stays under the component cap at a full glance of rows', () => {
    const rows = Array.from({ length: 3 }, (_, i) => ({
        changeId: `Aug22-0${i}`, summary: 'Edited loadout "BAL-27 (Flex)"', page: 'loadouts_mp',
        actorId: '1139845545754632283', createdAt: new Date(), undone: false, inverse: {},
    }));
    const body = require('../commands/bot').__testables.buildChangesRows(rows);
    // Measured, not estimated -- the 8 -> 5 page-size cut happened because someone measured 45.
    assert.ok(countComponents(body) <= LIMIT - 12,
        `${countComponents(body)} components for 3 rows leaves no room for the intro, the ledger line and the portal link`);
});

check('the Changes empty state names its own cause, not a generic noun', () => {
    const text = require('../commands/bot').__testables.CHANGES_EMPTY;
    assert.ok(/\/manage/.test(text), 'must say what writes a row here');
    assert.ok(/Revert/.test(text), 'must say the rows are actionable -- the property Alerts rows lack');
    assert.ok(!/^_No changes recorded yet/.test(text), 'the old generic sentence is what caused the bug');
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node scripts/botAnalyticsBody.test.js` Expected: FAIL — `buildChangesRows is not a function`.

- [ ] **Step 3a: Implement the row shape (probe CONFIRMED path)**

```js
// One SECTION per change, with Revert as the row's own accessory -- rather than a Text Display followed by a full-width Action Row. Component cost is IDENTICAL (9+10+2 vs 10+1+2 = 3 either way; the first draft of the spec wrongly claimed a saving, see its audit log), so this is bought purely for identity: Changes becomes the only page whose rows carry a control, which is exactly what distinguishes it from Alerts' rows.
function buildChangesRows(items) {
    const { canRevert } = require('../core/revert');
    return items.map(c => {
        const gate = canRevert(c);
        const reason = c.undone ? '' : (gate.ok ? '' : `\n-# _${gate.reason}_`);
        return {
            type: 9,
            components: [{ type: 10, content:
                `\`${c.changeId || '??????'}\` **${truncate(c.summary || `${c.action} on ${c.page}`, 70)}**${c.undone ? ' ↩️' : ''}`
                + `\n-# ${PAGE_LABEL[c.page] || c.page || '?'} · <@${c.actorId}> · <t:${unix(c.createdAt)}:R>${reason}` }],
            accessory: { type: 2, style: 2, label: 'Revert', custom_id: `bot_revert_${c.changeId}`, disabled: !gate.ok },
        };
    });
}
```

- [ ] **Step 3b: Replace the summary line with a ledger shape (probe CONFIRMED path)**

```js
// Alerts and Changes both used to render "**Last 24h:** N" in the same position at the same weight, so the eye read two identical rows even though the nouns differed. A ledger states WHO and WHAT; a severity breakdown (Alerts) states HOW BAD. Different information, therefore different shapes.
const ledgerLine = `**${summary.last24h}** edit(s) today · **${summary.last7d}** this week${summary.undoneCount ? ` · ${summary.undoneCount} reverted` : ''}`;
```

If `getChangeSummary()` does not already return `undoneCount`, **omit that clause entirely** rather than adding a field to the store — this plan does not touch stores.

- [ ] **Step 3c: FALLBACK (probe REJECTED path)**

Keep today's Text Display + Action Row rows verbatim. Take the page's identity from step 3b's ledger summary and the empty state below only, and record in `commands/bot.js` that the Section grid was tried and rejected by the API, with the exact error — so nobody re-attempts it.

- [ ] **Step 4: Replace the empty state (both paths)**

```js
const CHANGES_EMPTY = '**No edits in this window.**\n-# Every `/manage` save writes a row here with who made it and a one-click Revert. Make a change and it appears immediately.';
```

There is no filtered variant any more — filters move to the portal — so the empty state has exactly one cause and says it plainly.

- [ ] **Step 4b: Remove the pager, the page filter and the actor filter**

Delete the `buildPaginationRow` call, the `bot_changes_filterpage` select, the `bot_changes_filteractor` button, the `bot_changes_export` button and the Clear Filters button from `buildChangesBody`. Replace them with one row:

```js
{ type: 1, components: [{ type: 2, style: 5, label: 'Full history in the portal', url: PORTAL_ANALYTICS_URL }] }
```

Then delete the now-unreachable `bot_changes_page_`, `bot_changes_filterpage`, `bot_changes_filteractor`, `bot_changes_clearfilters` and `bot_changes_export` branches from `handlers/bot.js`, and `encodeState`/`decodeState` if nothing else uses them. **Leaving dead branches behind is how a "simplification" becomes a maintenance tax** — grep for each custom_id before deleting it, and delete only what nothing else reaches.

- [ ] **Step 5: Run tests, then measure live**

Run: `node scripts/botAnalyticsBody.test.js && npm test` Expected: exit 0. Then run `/bot analytics` on the dev bot, open Changes with at least 5 real rows and a filter applied, and confirm it sends without `COMPONENT_MAX_TOTAL_COMPONENTS_EXCEEDED`.

- [ ] **Step 6: Commit**

```bash
git add commands/bot.js scripts/botAnalyticsBody.test.js
git commit -m "feat(bot): give Changes a ledger grid with per-row revert accessories"
```

---

### Task 5: Alerts becomes the timeline page

**Files:**
- Modify: `commands/bot.js` — `buildAlertsBody` (~line 130)
- Test: `scripts/botAnalyticsBody.test.js`

**Interfaces:**
- Consumes: `getAlertSummary()`, `getRecentAlerts({page, perPage})`, `LEVEL_ICON`, `displayTitle` — unchanged.
- Produces: nothing other tasks consume.

- [ ] **Step 1: Write the failing test**

```js
check('the Alerts empty state cannot be confused with the Changes one', () => {
    const { ALERTS_EMPTY, CHANGES_EMPTY } = require('../commands/bot').__testables;
    assert.notStrictEqual(ALERTS_EMPTY, CHANGES_EMPTY);
    // The real discriminator is not that the strings differ -- it is that each names its OWN cause.
    assert.ok(/crash|gateway|database/i.test(ALERTS_EMPTY), 'Alerts must say what produces an alert');
    assert.ok(/healthy/i.test(ALERTS_EMPTY), 'an empty alert log is good news and should say so');
    assert.ok(!/recorded yet/.test(ALERTS_EMPTY), 'the old shared phrasing is what made the two pages read alike');
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node scripts/botAnalyticsBody.test.js` Expected: FAIL — `ALERTS_EMPTY` is undefined.

- [ ] **Step 3: Implement**

```js
const ALERTS_EMPTY = '**Nothing has gone wrong.**\n-# Alerts land here when the bot crashes, loses its gateway connection, or hits a database error. An empty list is the healthy state.';
```

Keep the severity ledger line (`🟢 n · 🟡 n · 🟠 n · 🔴 n`) — it is already this page's signature and no other page has one. Keep the existing row shape: `LEVEL_ICON` leading every row is the per-row colour coding that distinguishes Alerts from Changes, so it stays a Text Display list and must NOT gain per-row buttons.

Cut the list to the **3 most recent** alerts (`ALERTS_PER_PAGE` 8 → 3), delete the pager and the Export button, and keep the "What do alerts mean?" explainer — it teaches rather than dumps, which is exactly what a glance is allowed to do. End the page with the portal Link button. Then remove the now-unreachable `bot_alerts_page_` and `bot_alerts_export` branches from `handlers/bot.js`.

- [ ] **Step 4: Run tests**

Run: `node scripts/botAnalyticsBody.test.js && npm test` Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add commands/bot.js scripts/botAnalyticsBody.test.js
git commit -m "feat(bot): rewrite the Alerts empty state to name its own cause"
```

---

### Task 6: Usage becomes the comparison page

**Files:**
- Modify: `commands/bot.js` — `buildUsageBody` (~line 272)
- Test: `scripts/botAnalyticsBody.test.js`

**Interfaces:**
- Consumes: `computeUsageStats()` — unchanged.
- Produces: `buildUsageBars(byCommand)` → a fenced monospace string. Used only by `buildUsageBody`.

- [ ] **Step 1: Write the failing test**

```js
check('usage bars have a FIXED width and truncate the name, never the bar', () => {
    const { buildUsageBars } = require('../commands/bot').__testables;
    const out = buildUsageBars([
        { _id: 'draws', c: 100 },
        { _id: 'a-very-long-command-name-that-would-wrap-on-a-phone', c: 25 },
    ]);
    for (const line of out.split('\n').filter(l => l.includes('█') || l.includes('░'))) {
        assert.ok(line.length <= 40, `"${line}" is ${line.length} cols, over the phone budget`);
        const cells = (line.match(/[█░]/g) || []).length;
        assert.strictEqual(cells, 10, 'every bar is exactly 10 cells, or the comparison is meaningless');
    }
});

check('usage bars are proportional to the top command, not to the total', () => {
    const { buildUsageBars } = require('../commands/bot').__testables;
    const out = buildUsageBars([{ _id: 'a', c: 10 }, { _id: 'b', c: 5 }]);
    const [first, second] = out.split('\n').filter(l => /[█]/.test(l));
    assert.strictEqual((first.match(/█/g) || []).length, 10);
    assert.strictEqual((second.match(/█/g) || []).length, 5);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node scripts/botAnalyticsBody.test.js` Expected: FAIL — `buildUsageBars is not a function`.

- [ ] **Step 3: Implement**

```js
const BAR_CELLS = 10;
// Proportional to the TOP command, not to the total: with 8 commands, share-of-total bars are all
// near-empty and compare nothing. Against the leader, the shape of the distribution is readable.
// The bar is fixed-width and the NAME truncates -- the bar is the only part carrying the comparison,
// so it is the one thing that must never be the part that gives way (spec audit finding 3).
function buildUsageBars(byCommand) {
    if (!byCommand.length) return '';
    const top = byCommand[0].c || 1;
    const nameWidth = 18;
    return '```\n' + byCommand.map(c => {
        const filled = Math.max(1, Math.round((c.c / top) * BAR_CELLS));
        const name = `/${c._id || '?'}`.slice(0, nameWidth).padEnd(nameWidth);
        return `${name}${'█'.repeat(filled)}${'░'.repeat(BAR_CELLS - filled)} ${c.c}`;
    }).join('\n') + '\n```';
}
```

Replace the numbered `cmdLines` list with `buildUsageBars(byCommand.slice(0, 5))` — a glance shows the leaders, and the aggregation's own `$limit: 8` stays untouched so the portal keeps reading the same shape. Drop the Export button and the entry-point/outcome lines (both move to the portal), and end the page with the portal Link button. Replace all three `_no data yet_` strings with the single spec §4 empty state, and **move the admin-exclusion note up beside it** — it currently sits at the bottom, where a confused reader never reaches it.

- [ ] **Step 4: Run tests**

Run: `node scripts/botAnalyticsBody.test.js && npm test` Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add commands/bot.js scripts/botAnalyticsBody.test.js
git commit -m "feat(bot): draw usage as proportion bars instead of a numbered list"
```

---

### Task 7: Timing becomes the threshold page

**Files:**
- Modify: `commands/bot.js` — `buildTimingBody` (~line 344)
- Test: `scripts/botAnalyticsBody.test.js`

**Interfaces:**
- Consumes: `computeTimingStats()`, `fmtMs(ms)` — unchanged.
- Produces: `headroom(ms, budgetMs)` → `{ pct, icon }`. Used only by `buildTimingBody`.

- [ ] **Step 1: Write the failing test**

```js
check('every timing number is stated against its budget, with a verdict icon', () => {
    const { headroom } = require('../commands/bot').__testables;
    assert.deepStrictEqual(headroom(300, 3000), { pct: 90, icon: '🟢' });
    assert.strictEqual(headroom(2400, 3000).icon, '🟠', '20% headroom is not comfortable');
    assert.strictEqual(headroom(2900, 3000).icon, '🔴', 'under 10% headroom is the ack deadline in sight');
    // A missing measurement must not read as a perfect score.
    assert.strictEqual(headroom(null, 3000).icon, '⚪');
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node scripts/botAnalyticsBody.test.js` Expected: FAIL — `headroom is not a function`.

- [ ] **Step 3: Implement**

```js
// Discord closes the interaction window at 3,000ms. A bare "p95 2,400ms" makes a reader do that
// division in their head every time; stating the headroom is the page doing its own job.
// null is ⚪, never 🟢 -- "no data" and "plenty of room" are different answers and must not share a colour.
function headroom(ms, budgetMs) {
    if (ms == null) return { pct: null, icon: '⚪' };
    const pct = Math.round(((budgetMs - ms) / budgetMs) * 100);
    return { pct, icon: pct >= 50 ? '🟢' : pct >= 25 ? '🟡' : pct >= 10 ? '🟠' : '🔴' };
}
```

Render the ack p50/p95 rows through `headroom(x, 3000)`. Sort `byCommand` **worst p95 first** rather than most-frequent first — a threshold page ranks by risk, and `computeTimingStats` already returns the rows, so re-sort in the builder without touching the aggregation. Show the worst **3**, drop the per-dependency block and the Export button (both move to the portal), and end the page with the portal Link button. Replace the two `_no data yet_` strings with the spec §4 empty state.

- [ ] **Step 4: Run tests**

Run: `node scripts/botAnalyticsBody.test.js && npm test` Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add commands/bot.js scripts/botAnalyticsBody.test.js
git commit -m "feat(bot): state every timing number against its budget"
```

---

### Task 8: Close out

- [ ] **Step 1: Verify all five pages live, side by side**

On the dev bot, run `/bot analytics` and click through all five pages in one sitting. **Two tests, both of which must pass.** First: a screenshot of any one page is identifiable without its heading — if two still read alike, that pair's grid did not do its job, so say which pair and stop rather than shipping. Second: every page fits one phone screen without scrolling. A page that still scrolls has not become a glance, whatever else changed about it.

- [ ] **Step 2: Note what could not be verified here**

Usage and Timing query `AnalyticsEvent`, which is near-empty on the dev bot (spec audit finding 4). The empty states are verifiable here; the dense layouts are not. File a follow-up in `docs/db-deferred-list.md` to re-check both against production-shaped data after deploy, and say so plainly in the PR rather than implying full verification.

Also confirm in the PR body that **nothing was deleted, only relocated** — name each capability that left Discord (pagers, page/actor filters, the three exports, the entry-point/outcome breakdowns, per-dependency timings) and where it now lives in the portal. A reader who sees only the diff will otherwise read this as a feature removal.

- [ ] **Step 3: Records**

Add the changelog entry (citing the PR number, no hash), bump `package.json` to the next `v3.x.0-pre`, add the DEVLOG entry via `node scripts/devlog-add.mjs`, and mark the `/bot analytics` item resolved in `docs/db-deferred-list.md`.

Run: `npm run docs:audit` Expected: exit 0.

- [ ] **Step 4: PR**

```bash
gh pr create --base v3-pre-release --title "feat(bot): give each /bot analytics page its own grid and copy"
```

## Audit log

Findings from the falsification pass on the spec this plan implements are recorded in that document's own §6, and two of them shaped this plan directly: the corrected component count is why the Global Constraints forbid raising `CHANGES_PER_PAGE`, and the unverified Section-accessory premise is why **Task 2 is a spike with a documented fallback** rather than an assumption inside Task 4.

Findings from reviewing **this plan**:

1. 🟡 **Task ordering was wrong in the first draft.** Changes was Task 3 and the spike was folded into it — which would have meant discovering the premise was false halfway through a task, with a half-written page. The spike is now its own task with no commit, and Task 4 opens by reading its result.
2. 🟡 **Two tests were vacuous as first written.** "The empty state changed" passes against any edit, including a worse one. Both now assert the discriminating property instead — that each string names *its own cause* — which a generic rewrite would fail.
3. 🔴 **The plan was written against a spec that has since been reframed, and every task needed re-reading, not just the header.** Harkirat's portal direction arrived after the first draft. The tasks that changed are 4, 5, 6 and 7 — all of them shed a pager, a filter or an export. **The trap avoided:** editing the goal line and leaving the tasks as written, which would have produced a plan whose stated purpose and actual steps disagreed, with the steps winning at execution time.
4. 🟡 **Deleting a Discord control is only half the change.** Each removed component has a matching `handlers/bot.js` branch that becomes unreachable, and an unreachable branch is worse than the control it served — it reads as live code. Every removal step now names the branches to delete and says to grep each custom_id first.
5. 🟢 **Task 6's bar-proportion basis was unstated and it matters.** Share-of-total across 8 commands produces eight near-empty bars that compare nothing. Proportional-to-leader is now explicit in the code and pinned by its own test.
