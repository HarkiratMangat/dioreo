// Credit on a build (utils/loadoutCredit.js, Harkirat 2026-11-02 23:10 EST): @user, a plain username, a hyperlink or "By *anonymous*", prefixed Submitted by / Credit: / Build by. Submit a Build gives only @user, username or anonymous under "Submitted by"; the hyperlink and the other prefixes are set by hand. Saved through core's loadout.credit, so Revert works.
const assert = require('assert');
const C = require('../utils/loadoutCredit');
const { resolveOp } = require('../core/ops');
require('../core/ops/loadouts');
const { buildLoadoutCard } = require('../utils/loadoutRender');
const { savedPanel, changeLines } = require('../utils/loadoutPanels');
const { creditModal } = require('../handlers/manage/loadouts');
const S = require('../utils/buildSubmissions');

const USER = '1139845545754632283';
let n = 0;
const test = (name, fn) => { fn(); n++; };

test('names and links are cleaned, and markup is refused', () => {
    assert.strictEqual(C.cleanCreditName('  x  Ghost '), 'x Ghost');
    for (const bad of ['<@123>', 'a\nb', '', 'x'.repeat(C.CREDIT_MAX + 1), 'a]b']) assert.strictEqual(C.cleanCreditName(bad), null, bad);
    assert.strictEqual(C.cleanCreditUrl('https://youtube.com/@x'), 'https://youtube.com/@x');
    for (const bad of ['http://a.com', 'javascript:alert(1)', 'https://a.com/x)y', 'https://a b.com', 'https://localhost']) assert.strictEqual(C.cleanCreditUrl(bad), null, bad);
});

test('the four styles and three prefixes render as he wrote them', () => {
    const line = (credit) => C.creditLine({ credit });
    assert.strictEqual(line({ show: 'user', prefix: 'submitted', discordId: USER }), `Submitted by <@${USER}>`);
    assert.strictEqual(line({ show: 'name', prefix: 'credit', name: 'x_Ghost' }), 'Credit: **x\\_Ghost**');
    assert.strictEqual(line({ show: 'link', prefix: 'buildby', name: 'xGhost', url: 'https://youtube.com/@x' }), 'Build by [xGhost](https://youtube.com/@x)');
    assert.strictEqual(line({ show: 'anonymous', prefix: 'credit' }), 'By *anonymous*');
    assert.strictEqual(line({ show: 'none' }), null);
});

test('an older submitted build with no credit field falls back to submittedBy', () => {
    assert.strictEqual(C.creditLine({ submittedBy: { discordId: USER, credited: true } }), `Submitted by <@${USER}>`);
    assert.strictEqual(C.creditLine({ submittedBy: { discordId: USER, credited: false } }), 'By *anonymous*');
    assert.strictEqual(C.creditLine({ submittedBy: { discordId: USER, credited: true }, credit: { show: 'none' } }), 'By *anonymous*', 'No credit on a submitted build still says By anonymous');
    assert.strictEqual(C.creditLine({}), null);
});

test('Submit a Build only ever gives Submitted by @user or username, or anonymous', () => {
    assert.deepStrictEqual(C.submissionCredit({ discordId: USER, credited: true, creditAs: 'user' }), { show: 'user', prefix: 'submitted', discordId: USER });
    assert.deepStrictEqual(C.submissionCredit({ discordId: USER, credited: true, creditAs: 'name', username: 'xghost' }), { show: 'name', prefix: 'submitted', name: 'xghost' });
    assert.deepStrictEqual(C.submissionCredit({ discordId: USER, credited: false, creditAs: 'anonymous' }), { show: 'anonymous' });
    assert.deepStrictEqual(C.submissionCredit({ discordId: USER, credited: true }), { show: 'user', prefix: 'submitted', discordId: USER }, 'a submission sent before creditAs');
    const form = JSON.stringify(S.submitModal({ mode: 'MP' }));
    assert.ok(form.includes('"value":"user"') && form.includes('"value":"name"') && form.includes('"value":"no"'));
    assert.ok(!/link|https/i.test(form.match(/"custom_id":"credit".*?\]/)[0]), 'no hyperlink on the form');
});

test('the card carries the credit in its footer', () => {
    const build = { weaponKey: 'ak117', weaponName: 'AK117', category: 'AR', mode: 'MP', buildName: 'Build 1', attachments: ['A'], imageKey: 'AK117-1', shareCode: '1A2B3C4D5E', lastUpdated: new Date('2026-11-02'), credit: { show: 'name', prefix: 'buildby', name: 'xGhost' } };
    assert.ok(JSON.stringify(buildLoadoutCard([build], 0, { idPrefix: 'mp' }).components).includes('Build by **xGhost**'));
});

test('loadout.credit checks each style, and its inverse restores null', () => {
    const op = resolveOp('loadout.credit');
    const v = (credit) => op.validate({ type: 'loadout.credit', target: { id: 'x', mode: 'MP' }, payload: { credit } });
    assert.deepStrictEqual(v({ show: 'user', discordId: USER }).normalized.payload, { credit: { show: 'user', prefix: 'submitted', discordId: USER } });
    assert.deepStrictEqual(v({ show: 'link', prefix: 'credit', name: ' xGhost ', url: 'https://x.com/a' }).normalized.payload, { credit: { show: 'link', prefix: 'credit', name: 'xGhost', url: 'https://x.com/a' } });
    assert.deepStrictEqual(v({ show: 'anonymous', prefix: 'credit', discordId: USER }).normalized.payload, { credit: { show: 'anonymous' } });
    assert.deepStrictEqual(v(null).normalized.payload, { credit: null });
    for (const bad of [{ show: 'user' }, { show: 'name' }, { show: 'link', name: 'x' }, { show: 'link', name: 'x', url: 'http://x.com' }, { show: 'oops' }]) assert.ok(!v(bad).ok, JSON.stringify(bad));
    assert.ok(!op.validate({ type: 'loadout.credit', payload: { credit: null } }).ok, 'a build is named');
    const inv = op.invert({ applied: { id: 'x', mode: 'DMZ', prior: { credit: null } } });
    assert.deepStrictEqual(inv, { type: 'loadout.credit', target: { id: 'x', mode: 'DMZ' }, payload: { credit: null } });
});

test('/manage: the saved panel has Credit, and a credit change is listed', () => {
    const doc = { _id: 'abc', weaponName: 'AK117', buildName: 'Build 1', mode: 'MP', category: 'AR', attachments: ['A'], imageKey: 'AK117-1' };
    assert.ok(JSON.stringify(savedPanel({ doc, before: doc, changeIds: ['#1'] })).includes('"mng_ldcredit_abc"'));
    assert.deepStrictEqual(changeLines(doc, { ...doc, credit: { show: 'name', prefix: 'credit', name: 'xGhost' } }), ['**Credit:** Credit: **xGhost**']);
});

test('the Credit pop-up has five boxes and opens on what the footer shows now', () => {
    const m = creditModal({ _id: 'abc', weaponName: 'AK117', buildName: 'Build 1', submittedBy: { discordId: USER, credited: false } });
    assert.strictEqual(m.custom_id, 'mng_ldcreditm_abc');
    assert.ok(m.title.length <= 45 && m.components.length === 5);
    const [show, prefix, user, name, url] = m.components.map(c => c.component);
    assert.deepStrictEqual(show.options.filter(o => o.default).map(o => o.value), ['anonymous']);
    assert.deepStrictEqual(prefix.options.filter(o => o.default).map(o => o.value), ['submitted']);
    assert.deepStrictEqual(user.default_values, [{ id: USER, type: 'user' }]);
    assert.strictEqual(name.value, undefined);
    const link = creditModal({ _id: 'b', weaponName: 'X', buildName: 'Build 1', credit: { show: 'link', prefix: 'buildby', name: 'xGhost', url: 'https://x.com/a' } }).components.map(c => c.component);
    assert.deepStrictEqual([link[0].options.find(o => o.default).value, link[1].options.find(o => o.default).value, link[3].value, link[4].value], ['link', 'buildby', 'xGhost', 'https://x.com/a']);
    assert.deepStrictEqual(creditModal({ _id: 'c', weaponName: 'X', buildName: 'Build 1' }).components[0].component.options.find(o => o.default).value, 'none');
});

test('/autobuild has credit_user, credit_name and credit_prefix', () => {
    const names = require('../commands/autobuild').data.toJSON().options.map(o => o.name);
    for (const o of ['credit_user', 'credit_name', 'credit_prefix']) assert.ok(names.includes(o), o);
});

console.log(`loadoutCredit: ${n} passed`);
