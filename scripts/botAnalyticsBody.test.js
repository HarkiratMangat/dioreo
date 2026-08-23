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

check('Health vitals align the VALUE column, with no floating colons', () => {
    const { buildVitalsBlock, visibleWidth } = require('../commands/bot').__testables;
    const body = buildVitalsBlock({ gatewayStatus: 0, uptimeSec: 3600, rssMb: 120, boots24h: 1, boots7d: 3 });
    const strip = l => l.replace(/\u001b\[[0-9;]*m/g, '');
    const rows = body.split('\n').map(strip).filter(l => l.includes(':'));
    assert.strictEqual(rows.length, 4);
    // ⚠️ THE INVARIANT THAT MATTERS IS THE VALUE COLUMN, NOT THE COLON. An earlier version of this test asserted every colon sat at the same offset, which the code then satisfied by padding the bare label and appending ': ' -- shipping `Gateway :` beside `Restarts:`. A colon belongs to its word.
    for (const l of rows) {
        assert.ok(/^[A-Za-z]+:/.test(l), `"${l}" has a floating colon -- it must sit flush against its label`);
    }
    const valueStarts = new Set(rows.map(l => {
        const afterColon = l.indexOf(':') + 1;
        return afterColon + (l.slice(afterColon).length - l.slice(afterColon).trimStart().length);
    }));
    assert.strictEqual(valueStarts.size, 1, `vitals values are ragged: ${[...valueStarts]}`);
    assert.ok(body.startsWith('```ansi') && body.trimEnd().endsWith('```'));
    // Escapes cost bytes and zero columns, so the budget must be measured on the VISIBLE row.
    for (const l of body.split('\n')) assert.ok(visibleWidth(l) <= 40, `"${strip(l)}" exceeds the phone budget`);
});

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

check('the Alerts empty state cannot be confused with the Changes one', () => {
    const { ALERTS_EMPTY, CHANGES_EMPTY } = require('../commands/bot').__testables;
    assert.notStrictEqual(ALERTS_EMPTY, CHANGES_EMPTY);
    // The real discriminator is not that the strings differ -- it is that each names its OWN cause.
    assert.ok(/crash|gateway|database/i.test(ALERTS_EMPTY), 'Alerts must say what produces an alert');
    assert.ok(/healthy/i.test(ALERTS_EMPTY), 'an empty alert log is good news and should say so');
    assert.ok(!/recorded yet/.test(ALERTS_EMPTY), 'the old shared phrasing is what made the two pages read alike');
});

check('usage bars have a FIXED width and truncate the name, never the bar', () => {
    const { buildUsageBars, visibleWidth } = require('../commands/bot').__testables;
    const out = buildUsageBars([
        { _id: 'draws', c: 100 },
        { _id: 'a-very-long-command-name-that-would-wrap-on-a-phone', c: 25 },
    ]);
    for (const line of out.split('\n').filter(l => l.includes('█') || l.includes('·'))) {
        // VISIBLE width -- ANSI escapes cost bytes and zero columns, so a raw .length here would pass a row that overflows a phone by 3x. This is the same class of mistake as the colon test above.
        assert.ok(visibleWidth(line) <= 40, `"${line}" is ${visibleWidth(line)} cols, over the phone budget`);
        const cells = (line.match(/[█·]/g) || []).length;
        assert.strictEqual(cells, 10, 'every bar in a block is the same length, or the comparison is meaningless');
    }
});

check('visibleWidth can actually FAIL -- it is not just counting bytes', () => {
    const { visibleWidth } = require('../commands/bot').__testables;
    const coloured = '\u001b[0;32m█████\u001b[0m';
    assert.strictEqual(visibleWidth(coloured), 5);
    assert.ok(coloured.length > 5, 'the raw string must be longer, or this test proves nothing');
});

check('usage bars are proportional to the top command, not to the total', () => {
    const { buildUsageBars } = require('../commands/bot').__testables;
    const out = buildUsageBars([{ _id: 'a', c: 10 }, { _id: 'b', c: 5 }]);
    const [first, second] = out.split('\n').filter(l => /[█]/.test(l));
    assert.strictEqual((first.match(/█/g) || []).length, 10);
    assert.strictEqual((second.match(/█/g) || []).length, 5);
});

check('the ack verdict states the RULE and what it consumes -- never a percentile or "headroom"', () => {
    const { ackVerdict } = require('../commands/bot').__testables;
    const fast = ackVerdict(21);
    assert.strictEqual(fast.icon, '🟢');
    assert.strictEqual(fast.used, 'under 1%', '21ms of 3,000ms must not round to "1%" and must not read as a percentile');
    assert.strictEqual(ackVerdict(2900).icon, '🔴', 'a 2.9s ack is one blip from the interaction dying');
    assert.strictEqual(ackVerdict(null).used, null, 'no data must not read as a perfect score');
    // 🔴 THE VOCABULARY IS THE POINT. Harkirat could not read p50/p95/headroom, so no reader-facing string may reintroduce them -- this asserts the words, not just the numbers, because a future edit that "clarifies" the headline back into percentile jargon would pass every numeric check above.
    for (const v of [ackVerdict(21), ackVerdict(2900), ackVerdict(null)]) {
        assert.ok(!/p50|p95|headroom|percentile/i.test(v.headline), `"${v.headline}" reintroduces the jargon`);
    }
});

check('a list field NEVER renders as "2 items -> 2 items"', () => {
    const { sameValue, describeListChange } = require('../commands/bot').__testables;
    // The exact row that reached a screenshot: the diff ASSERTED a change and then displayed two identical values. Worse than omitting it -- it teaches the reader the diff cannot be trusted.
    const before = [{ tier: 'mythic', name: 'Type 25 – Deepstar Piercer' }, { tier: 'legendary', name: 'Old Skin' }];
    const withIds = before.map((i, n) => ({ ...i, _id: `id${n}` }));
    assert.ok(sameValue(before, withIds), 'the same items must compare EQUAL when one side carries Mongo _ids');
    const swapped = [{ tier: 'mythic', name: 'Type 25 – Deepstar Piercer' }, { tier: 'legendary', name: 'New Skin' }];
    assert.ok(!sameValue(before, swapped));
    const moved = describeListChange(before, swapped);
    assert.ok(/− Old Skin/.test(moved) && /\+ New Skin/.test(moved), `must name what moved, got: ${moved}`);
    assert.strictEqual(describeListChange(before, before.slice().reverse()), '_reordered_');
});

check('a date-ONLY field renders its UTC day, never a localised instant', () => {
    const { fmtFieldValue, fmtUtcDay } = require('../commands/bot').__testables;
    // A draw dated 14 Aug is stored at UTC midnight; rendered as a Discord instant it localises into the evening of the 13th, and the panel told Harkirat "August 13, 2026" for a draw he had dated the 14th.
    assert.strictEqual(fmtUtcDay('2026-08-14T00:00:00.000Z'), 'Aug 14, 2026');
    const out = fmtFieldValue('2026-08-14T00:00:00.000Z', 'date', ['date']);
    assert.ok(/Aug 14, 2026/.test(out), `date-only must show the typed day, got: ${out}`);
    assert.ok(!/<t:/.test(out), 'a date-only field must not use a localising Discord timestamp');
    // A genuine INSTANT keeps <t:> -- for those the reader's own timezone is the right frame.
    assert.ok(/<t:/.test(fmtFieldValue('2026-08-14T00:00:00.000Z', 'startsAt', ['date'])));
});

check('items are named, not counted -- and a raw CDN url is not information', () => {
    const { fmtItems, fmtFieldValue } = require('../commands/bot').__testables;
    assert.ok(/Type 25/.test(fmtItems([{ name: 'Type 25 – Deepstar Piercer' }])), 'a draw IS its items; "1 item" says nothing');
    assert.ok(!/https?:/.test(fmtFieldValue('https://res.cloudinary.com/x/image/upload/f_auto/y.png', 'thumbnailUrl', [])));
});

check('revertSentence talks about the RECORD, never about an op type', () => {
    const { revertSentence } = require('../commands/bot').__testables;
    assert.ok(/deletes this draw/.test(revertSentence({ inverse: { type: 'draw.delete' } }, 'draw')));
    assert.ok(/puts this build back/.test(revertSentence({ inverse: { type: 'loadout.add' } }, 'build')));
    // Grammar is part of the job here: "undoes that 2 changes" shipped and Harkirat read it.
    assert.ok(/undoes that change/.test(revertSentence({ inverse: { type: 'draw.edit' } }, 'draw', 1)));
    assert.ok(/undoes those 2 changes/.test(revertSentence({ inverse: { type: 'draw.edit' } }, 'draw', 2)));
    for (const t of ['draw.delete', 'draw.edit', 'loadout.add']) {
        assert.ok(!new RegExp(t.replace('.', '\\.')).test(revertSentence({ inverse: { type: t } }, 'draw', 1)),
            `"${t}" leaked into a sentence a person has to read`);
    }
});

check('duration is banded by FELT SPEED, never against the ack deadline', () => {
    const { feltSpeed, headroom } = require('../commands/bot').__testables;
    assert.strictEqual(feltSpeed(300).word, 'instant');
    assert.strictEqual(feltSpeed(2000).word, 'quick');
    assert.strictEqual(feltSpeed(9119).icon, '🟠', '9.1s is slow, but it is NOT a fault -- the ack already happened');
    assert.strictEqual(feltSpeed(null).icon, '⚪', 'no data must not read as a perfect score');
    // The regression this guards: applying headroom() to a DURATION produced "-204% headroom" and a red verdict for a heavy command working exactly as designed. Headroom is only meaningful for the ack.
    assert.ok(headroom(9119, 3000).pct < 0, 'the old path really did produce a negative percentage');
    assert.ok(!String(feltSpeed(9119).word).includes('%'), 'a felt-speed band must never quote a percentage');
});

check('the usage delta names the absolute prior figure, not just a percentage', () => {
    const { usageDeltaLine } = require('../commands/bot').__testables;
    const line = usageDeltaLine(40, 316);
    assert.ok(/87% down/.test(line), `expected a down-87% reading, got: ${line}`);
    assert.ok(/316/.test(line), 'a bare percentage is unactionable without the base it fell from');
    assert.strictEqual(usageDeltaLine(0, 0), null, 'a bot with no traffic either week states nothing');
    assert.ok(/First traffic/.test(usageDeltaLine(5, 0)), 'a zero base must not divide');
});

check('fmtDur switches to seconds above 1s', () => {
    const { fmtDur } = require('../commands/bot').__testables;
    assert.strictEqual(fmtDur(345), '345ms');
    assert.strictEqual(fmtDur(9119), '9.1s');
    assert.strictEqual(fmtDur(null), '—');
});

check('every monospace block fits the MEASURED phone budget, not the estimated one', () => {
    const { buildVitalsBlock, buildUsageBars, visibleWidth } = require('../commands/bot').__testables;
    // 32, not 40 -- derived from a real wrap on Harkirat's iPhone (2026-08-23 09:56 EDT), where peaksLine at ~46 columns broke into four ragged lines while a 27-column row did not break at all.
    const COLS = 32;
    const blocks = [
        buildVitalsBlock({ gatewayStatus: 0, uptimeSec: 3600, rssMb: 120, boots24h: 53, boots7d: 268 }),
        buildUsageBars([{ _id: 'gunsmiths', c: 14 }, { _id: 'invite', c: 8 }]),
    ];
    for (const b of blocks) {
        for (const l of b.split('\n')) {
            assert.ok(visibleWidth(l) <= COLS, `"${l.replace(/\u001b\[[0-9;]*m/g, '')}" is ${visibleWidth(l)} cols, over the measured ${COLS}`);
        }
    }
});

check('the Changes glance is 3 rows, as the plan requires', () => {
    // Shipped at 5 because nothing asserted it, and on iOS a Section accessory stacks BELOW its text rather than beside it -- so five rows became ten stacked blocks and the page needed scrolling.
    const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'commands', 'bot.js'), 'utf8');
    assert.ok(/const CHANGES_PER_PAGE = 3;/.test(src), 'CHANGES_PER_PAGE must be 3');
    assert.ok(/const ALERTS_PER_PAGE = 3;/.test(src), 'ALERTS_PER_PAGE must be 3');
});

check('a Changes row opens a DETAIL panel -- it never reverts on one tap', () => {
    const rows = require('../commands/bot').__testables.buildChangesRows([{
        changeId: 'Aug22-28', summary: 'Added new draw "Test Draw"', page: 'draws',
        actorId: '1', createdAt: new Date(), undone: false, inverse: { type: 'draw.delete', target: 'Test Draw' },
    }]);
    const acc = rows[0].accessory;
    assert.ok(acc.custom_id.startsWith('bot_changedetail_'), 'the row control must open the panel, not fire the revert');
    assert.ok(!/^bot_revert_/.test(acc.custom_id), 'a one-tap revert from a one-line summary is the blind-revert bug');
    assert.notStrictEqual(acc.disabled, true, 'an unrevertable row must still be able to say WHY');
});

check('EVERY page the change log can carry has a record view -- not just draws', () => {
    const { RECORD_VIEWS, viewFor } = require('../commands/bot').__testables;
    const { MANAGE_PAGE_SCOPES } = require('../utils/adminAccess');
    // 🔴 DERIVED FROM THE OP REGISTRY, NOT FROM MANAGE_PAGE_SCOPES. Those two sets are NOT the same, and assuming they were is how `patchnote` (singular) went unnoticed: core/changeset.js's pageForOp() falls back to op.type.split('.')[0] for any op with no registered /manage action, so four patchnote ops emit a page key that appears in no scope list anywhere. A test that only walked MANAGE_PAGE_SCOPES passed while a real, reachable page had no view at all.
    const { listOpTypes } = require('../core/ops');
    const { pageForOp } = require('../core/changeset');
    const emitted = [...new Set(listOpTypes().map(t => pageForOp({ type: t })))];
    for (const page of emitted) {
        assert.ok(RECORD_VIEWS[page], `pageForOp emits "${page}" but no record view handles it`);
    }
    assert.ok(emitted.includes('patchnote'), 'the singular key must stay covered by this check, not be quietly dropped');
    // 🔴 THE TEST THAT WOULD HAVE CAUGHT THE REAL COMPLAINT. Four rounds of fixes were all draws fixes wearing a general name, while the log carries nine pages -- "these changes need to be trickled into other edit/add/delete database changes as well, not just applying to draws". A page missing here silently falls back to "the contents weren't recorded", which is a lie: its inverse payload has named fields.
    for (const page of [...MANAGE_PAGE_SCOPES, 'access']) {
        assert.ok(RECORD_VIEWS[page], `page "${page}" has no record view — its change panel will say nothing`);
        assert.ok(RECORD_VIEWS[page].noun && RECORD_VIEWS[page].noun !== 'record', `page "${page}" needs a real noun, not the generic fallback`);
    }
    // And an unknown page must still degrade to something sane rather than throwing.
    assert.strictEqual(viewFor('a-page-that-does-not-exist').noun, 'record');
});

check('the draw view REUSES commands/draws.js, byte for byte -- never a copy', () => {
    const { RECORD_VIEWS, countPanelComponents } = require('../commands/bot').__testables;
    const draw = { _id: 'x', title: 'Test Draw', date: new Date('2026-08-28T00:00:00Z'), items: [{ tier: 'mythic', name: 'Test Item' }], thumbnailUrl: 'https://example.test/a.png' };
    const mine = RECORD_VIEWS.draws.render(draw);
    const theirs = require('../commands/draws').buildDrawSections([draw]);
    // Identical output is the POINT: a copied renderer drifts, and a panel that quietly stops matching the real card is worse than one that never tried to match it.
    assert.deepStrictEqual(mine, theirs);
    assert.strictEqual(mine[0].type, 9, 'a draw with an image renders as a Section with a thumbnail accessory');
    assert.strictEqual(countPanelComponents(mine), 3, 'section + text + accessory');
});

check('a before/after pair is BUDGETED, and the walker can see accessories', () => {
    const { RECORD_VIEWS, renderRecord, countPanelComponents } = require('../commands/bot').__testables;
    const draw = { title: 'A', date: new Date(), items: [], thumbnailUrl: 'https://example.test/a.png' };
    const pair = countPanelComponents(RECORD_VIEWS.draws.render(draw)) * 2;
    assert.ok(pair + 14 <= 40, `two cards plus chrome is ${pair + 14}, over the 40-component cap`);
    // The guard must actually BITE, or it is decoration: a budget of 1 cannot fit a 3-component card, so the renderer has to fall back to the field list rather than shipping something that will fail to send.
    const squeezed = renderRecord('draws', draw, ['date'], 1);
    assert.ok(countPanelComponents(squeezed) <= 2, 'an unaffordable card must degrade, not blow the cap');
    assert.strictEqual(squeezed[0].type, 10);
});

check('a page with no fetcher still shows its contents, generically', () => {
    const { genericFields, viewFor } = require('../commands/bot').__testables;
    // patchnotes/seasondraft/season/access have no bespoke fetcher and must NOT therefore be blank -- the inverse payload carries real named fields for all of them. season/seasondraft target human labels ('draft', a season title), not element ids -- the generic view is the correct and complete answer for them, not a stopgap, so they are the honest example here.
    assert.strictEqual(viewFor('season').fetch, null);
    const out = genericFields({ title: 'Season 6 notes', date: '2026-08-14T00:00:00.000Z', _id: 'zzz' }, ['date']);
    assert.ok(/Title/.test(out) && /Season 6 notes/.test(out));
    assert.ok(/Aug 14, 2026/.test(out), 'a date-only field keeps its UTC day here too');
    assert.ok(!/zzz/.test(out), '_id is plumbing, never shown');
});

check('a change id is not date-shaped any more', () => {
    // `Aug22-28` sat inches from "19 hours ago" and read as a contradicting date.
    const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'utils', 'changeStore.js'), 'utf8');
    assert.ok(/return `#\$\{doc\.seq\}`;/.test(src), 'nextDailyChangeId must mint a #N sequence');
    assert.ok(!/MONTHS\[date\.getUTCMonth/.test(src), 'the MMMDD date-key builder must be gone, not just unused');
});

console.log(`  ✓ ${passed} /bot analytics checks passed`);
