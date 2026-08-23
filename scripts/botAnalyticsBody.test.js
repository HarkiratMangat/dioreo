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

check('the detail panel diffs -- unchanged fields are dropped, not listed', () => {
    const { sameValue, fmtFieldValue } = require('../commands/bot').__testables;
    // The defect this guards shipped and was reported: an edit dumped the inverse's WHOLE payload (title, date, thumbnailUrl, items), so the one field that actually changed was hidden among three that did not, and "what was even edited?" was unanswerable from the panel.
    const prev = { title: 'Deepstar Wraith Mythic Drop', date: '2026-08-14T00:00:00.000Z' };
    const now = { title: 'Deepstar Wraith Mythic Drop', date: new Date('2026-08-22T00:00:00.000Z') };
    const changed = Object.keys(prev).filter(k => !sameValue(now[k], prev[k]));
    assert.deepStrictEqual(changed, ['date'], 'only the field that actually differs may be reported');
    // A Mongo round-trip returns a Date on one side and an ISO string on the other; comparing those naively reports every date field as changed on every edit, which is the same wall of noise wearing a diff's clothes.
    assert.ok(sameValue(new Date('2026-08-14T00:00:00.000Z'), '2026-08-14T00:00:00.000Z'), 'Date vs ISO string must compare equal');
    assert.ok(!/https?:/.test(fmtFieldValue('https://res.cloudinary.com/x/image/upload/f_auto,q_auto/y.png')), 'a raw CDN url is not information to a reader');
});

check('revertSentence talks about the RECORD, never about an op type', () => {
    const { revertSentence } = require('../commands/bot').__testables;
    assert.ok(/deletes this draw/.test(revertSentence({ inverse: { type: 'draw.delete' } }, 'draw')));
    assert.ok(/puts this build back/.test(revertSentence({ inverse: { type: 'loadout.add' } }, 'build')));
    assert.ok(/1 change/.test(revertSentence({ inverse: { type: 'draw.edit' } }, 'draw', 1)));
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

console.log(`  ✓ ${passed} /bot analytics checks passed`);
