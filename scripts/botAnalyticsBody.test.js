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
    for (const line of out.split('\n').filter(l => l.includes('█') || l.includes('░'))) {
        // VISIBLE width -- ANSI escapes cost bytes and zero columns, so a raw .length here would pass a row that overflows a phone by 3x. This is the same class of mistake as the colon test above.
        assert.ok(visibleWidth(line) <= 40, `"${line}" is ${visibleWidth(line)} cols, over the phone budget`);
        const cells = (line.match(/[█░]/g) || []).length;
        assert.strictEqual(cells, 10, 'every bar is exactly 10 cells, or the comparison is meaningless');
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

check('every timing number is stated against its budget, with a verdict icon', () => {
    const { headroom } = require('../commands/bot').__testables;
    assert.deepStrictEqual(headroom(300, 3000), { pct: 90, icon: '🟢' });
    assert.strictEqual(headroom(2400, 3000).icon, '🟠', '20% headroom is not comfortable');
    assert.strictEqual(headroom(2900, 3000).icon, '🔴', 'under 10% headroom is the ack deadline in sight');
    // A missing measurement must not read as a perfect score.
    assert.strictEqual(headroom(null, 3000).icon, '⚪');
});

check('duration is banded by FELT SPEED, never against the ack deadline', () => {
    const { feltSpeed, headroom } = require('../commands/bot').__testables;
    assert.strictEqual(feltSpeed(300).word, 'instant');
    assert.strictEqual(feltSpeed(2000).word, 'brisk');
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

console.log(`  ✓ ${passed} /bot analytics checks passed`);
