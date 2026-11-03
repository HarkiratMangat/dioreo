// Credit on a build (utils/loadoutCredit.js, Harkirat 2026-11-02 10:44 EST): a Discord user or a plain name in the card's footer, set from /manage's Credit button or /autobuild, through core's loadout.credit so Revert works.
const assert = require('assert');
const { cleanCreditName, creditLine, CREDIT_MAX } = require('../utils/loadoutCredit');
const { resolveOp } = require('../core/ops');
require('../core/ops/loadouts');
const { buildLoadoutCard } = require('../utils/loadoutRender');
const { savedPanel, changeLines } = require('../utils/loadoutPanels');
const { creditModal } = require('../handlers/manage/loadouts');

const USER = '1139845545754632283';
let n = 0;
const test = (name, fn) => { fn(); n++; };

test('names are tidied, and markup or a second line is refused', () => {
    assert.strictEqual(cleanCreditName('  x  Ghost '), 'x Ghost');
    assert.strictEqual(cleanCreditName('<@123>'), null);
    assert.strictEqual(cleanCreditName('a\nb'), null);
    assert.strictEqual(cleanCreditName(''), null);
    assert.strictEqual(cleanCreditName('x'.repeat(CREDIT_MAX + 1)), null);
});

test('the footer says who, and a plain name is escaped, never a mention', () => {
    assert.strictEqual(creditLine({ submittedBy: { discordId: USER, credited: true } }), `Submitted by <@${USER}>`);
    assert.strictEqual(creditLine({ submittedBy: { discordId: USER, credited: false } }), 'Submitted by *anonymous*');
    assert.strictEqual(creditLine({ credit: 'x_Ghost_' }), 'Credit: x\\_Ghost\\_');
    assert.strictEqual(creditLine({}), null);
});

test('the card carries the credit in its footer', () => {
    const build = { weaponKey: 'ak117', weaponName: 'AK117', category: 'AR', mode: 'MP', buildName: 'Build 1', attachments: ['A'], imageKey: 'AK117-1', shareCode: '1A2B3C4D5E', lastUpdated: new Date('2026-11-02 23:01 EST'), credit: 'xGhost' };
    assert.ok(JSON.stringify(buildLoadoutCard([build], 0, { idPrefix: 'mp' }).components).includes('Credit: xGhost'));
});

test('loadout.credit takes a user or a name, not both, and its inverse restores nulls', () => {
    const op = resolveOp('loadout.credit');
    const v = (payload) => op.validate({ type: 'loadout.credit', target: { id: 'x', mode: 'MP' }, payload });
    assert.ok(v({ submittedBy: { discordId: USER }, credit: null }).ok);
    assert.deepStrictEqual(v({ submittedBy: { discordId: USER }, credit: null }).normalized.payload, { submittedBy: { discordId: USER, credited: true }, credit: null });
    assert.deepStrictEqual(v({ submittedBy: null, credit: ' xGhost ' }).normalized.payload, { submittedBy: null, credit: 'xGhost' });
    assert.deepStrictEqual(v({ submittedBy: null, credit: null }).normalized.payload, { submittedBy: null, credit: null }, 'both empty clears');
    assert.ok(!v({ submittedBy: { discordId: USER }, credit: 'xGhost' }).ok, 'not both');
    assert.ok(!v({ submittedBy: { discordId: 'abc' } }).ok, 'a real user id');
    assert.ok(!v({ credit: '<@1>' }).ok, 'no markup');
    assert.ok(!op.validate({ type: 'loadout.credit', payload: {} }).ok, 'a build is named');
    const inv = op.invert({ applied: { id: 'x', mode: 'DMZ', prior: { submittedBy: null, credit: null } } });
    assert.deepStrictEqual(inv, { type: 'loadout.credit', target: { id: 'x', mode: 'DMZ' }, payload: { submittedBy: null, credit: null } });
});

test('/manage: the saved panel has Credit, and a credit change is listed', () => {
    const doc = { _id: 'abc', weaponName: 'AK117', buildName: 'Build 1', mode: 'MP', category: 'AR', attachments: ['A'], imageKey: 'AK117-1' };
    const ids = JSON.stringify(savedPanel({ doc, before: doc, changeIds: ['#1'] }));
    assert.ok(ids.includes('"mng_ldcredit_abc"'));
    assert.deepStrictEqual(changeLines(doc, { ...doc, credit: 'xGhost' }), ['**Credit:** Credit: xGhost']);
});

test('the Credit pop-up keeps an anonymous submitter anonymous', () => {
    const m = creditModal({ _id: 'abc', weaponName: 'AK117', buildName: 'Build 1', submittedBy: { discordId: USER, credited: false } });
    assert.strictEqual(m.custom_id, 'mng_ldcreditm_abc');
    assert.ok(m.title.length <= 45 && m.components.length <= 5);
    const [user, shown, name] = m.components.map(c => c.component);
    assert.deepStrictEqual(user.default_values, [{ id: USER, type: 'user' }]);
    assert.deepStrictEqual(shown.options.filter(o => o.default).map(o => o.value), ['no']);
    assert.strictEqual(name.value, undefined);
    assert.strictEqual(creditModal({ _id: 'b', weaponName: 'X', buildName: 'Build 1', credit: 'xGhost' }).components[2].component.value, 'xGhost');
});

test('/autobuild has submitted_by and credit', () => {
    const names = require('../commands/autobuild').data.toJSON().options.map(o => o.name);
    for (const o of ['submitted_by', 'credit']) assert.ok(names.includes(o), o);
});

console.log(`loadoutCredit: ${n} passed`);
