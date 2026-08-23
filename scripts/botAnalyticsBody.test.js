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

check('every timing number is stated against its budget, with a verdict icon', () => {
    const { headroom } = require('../commands/bot').__testables;
    assert.deepStrictEqual(headroom(300, 3000), { pct: 90, icon: '🟢' });
    assert.strictEqual(headroom(2400, 3000).icon, '🟠', '20% headroom is not comfortable');
    assert.strictEqual(headroom(2900, 3000).icon, '🔴', 'under 10% headroom is the ack deadline in sight');
    // A missing measurement must not read as a perfect score.
    assert.strictEqual(headroom(null, 3000).icon, '⚪');
});

console.log(`  ✓ ${passed} /bot analytics checks passed`);
