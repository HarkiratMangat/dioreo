// A merged build's options edited by number (utils/loadoutOptions.js; Harkirat, 2026-11-05: "1, 1b, 1c"): the tags, the list moves, the rules a list must meet, the Edit search's `2b`, the Edit pop-up for one option, where a save sends an option (handlers/manage/loadouts.js planOptionSave), the panels, and the bulk format round trip. The Mongo half (core's loadout.options, Revert, bulk upsert) was run against a local replica set when this was written; nothing here needs a database.
const assert = require('assert');
const lo = require('../utils/loadoutOptions');
const form = require('../utils/loadoutForm');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

const opt = (code, atts) => ({ attachments: atts, attachmentSlots: [], shareCode: code, imageKey: `STATIC-HV-${code}` });
const base = { weaponName: 'STATIC-HV', weaponKey: 'static-hv', category: 'SMG', mode: 'MP' };
const b1 = { ...base, _id: 'b1', buildName: 'Build 1', ...opt('1A1A', ['A1']) };
const b2 = { ...base, _id: 'b2', buildName: 'Build 2', label: 'Alt', isMeta: true, ...opt('2A2A', ['A2']), variants: [opt('2B2B', ['B2']), opt('2C2C', ['C2'])] };
const b3 = { ...base, _id: 'b3', buildName: 'Build 3', ...opt('3A3A', ['A3']) };
const siblings = [b1, b2, b3];

check('tags: 2 and 2a are Option A, 2b Option B; anything else is not a build #', () => {
    assert.deepStrictEqual(lo.parseBuildTag('2'), { number: 2, option: 0, lettered: false });
    assert.deepStrictEqual(lo.parseBuildTag('2a'), { number: 2, option: 0, lettered: true });
    assert.deepStrictEqual(lo.parseBuildTag(' 12C '), { number: 12, option: 2, lettered: true });
    for (const bad of ['', '0', '2bb', 'b2', '2-b', 'two']) assert.strictEqual(lo.parseBuildTag(bad), null, bad);
    assert.strictEqual(lo.optionTag(2, 0), '2');
    assert.strictEqual(lo.optionTag(2, 3), '2d');
});

check('a build reads as a list of options and writes back the same fields', () => {
    const options = lo.optionsOf(b2);
    assert.deepStrictEqual(options.map(o => o.shareCode), ['2A2A', '2B2B', '2C2C']);
    const fields = lo.optionsToFields(lo.move(options, 2, 0));
    assert.strictEqual(fields.shareCode, '2C2C');
    assert.deepStrictEqual(fields.variants.map(v => v.shareCode), ['2B2B', '2A2A']);
    // A missing picture version or hash is null, never undefined, so a moved option never keeps the old one.
    assert.strictEqual(fields.imageVersion, null);
    assert.strictEqual(fields.sourceHash, null);
    assert.ok(!('label' in fields), "Option A's label is the build's own field, not written here");
    assert.deepStrictEqual(lo.optionsToFields(lo.optionsOf(b1)).variants, [], 'one option is [] so a Revert can clear options');
    assert.deepStrictEqual(lo.insertAt(options, opt('X', ['X']), 1).map(o => o.shareCode), ['2A2A', 'X', '2B2B', '2C2C']);
    assert.deepStrictEqual(lo.removeAt(options, 0).map(o => o.shareCode), ['2B2B', '2C2C']);
});

check('a list needs an option, at most six, attachments on each, and no code twice', () => {
    assert.ok(lo.listProblem([]));
    assert.strictEqual(lo.listProblem(lo.optionsOf(b2)), null);
    assert.ok(/up to 6/.test(lo.listProblem(Array.from({ length: 7 }, (_, i) => opt(`C${i}`, ['x'])))));
    assert.ok(/Option B has no attachments/.test(lo.listProblem([opt('A', ['x']), opt('B', [])])));
    assert.ok(/same code/.test(lo.listProblem([opt('1a2b', ['x']), opt('1A2B', ['y'])])));
});

check('the Edit search: STATIC-HV 2b is Build 2 Option B, a plain number names no option, a missing letter matches nothing', () => {
    assert.deepStrictEqual(form.pickBuildOption('STATIC-HV 2b', siblings), { build: b2, option: 1 });
    assert.deepStrictEqual(form.pickBuildOption('static-hv, 2', siblings), { build: b2, option: null });
    assert.deepStrictEqual(form.pickBuildOption('STATIC-HV 2a', siblings), { build: b2, option: 0 });
    assert.strictEqual(form.pickBuildOption('STATIC-HV 2d', siblings), null);
    assert.strictEqual(form.pickBuildOption('STATIC-HV 1b', siblings), null);
    assert.strictEqual(form.pickBuild('STATIC-HV 3', siblings), b3, 'pickBuild still answers with the build');
});

check('the Edit pop-up for one option shows its attachments, its code and its tag', () => {
    const v = form.editValues(b2, siblings, ['meta'], 2);
    assert.strictEqual(v.build, 'SMG, 2c, 2C2C');
    assert.strictEqual(v.attachments, 'C2\nBadges: meta');
    assert.strictEqual(v.weapon, 'STATIC-HV, Alt');
    const manage = require('../commands/manage');
    const modal = manage.buildEditLoadoutModal(b2, 'b2', siblings, 1);
    assert.strictEqual(modal.custom_id, 'edit_loadout_b2~1');
    assert.strictEqual(modal.title, 'Edit Loadout · Option B');
    assert.strictEqual(manage.buildEditLoadoutModal(b1, 'b1', siblings).custom_id, 'edit_loadout_b1', 'a plain build keeps its plain id');
});

check('where a save sends an option: self, join, add, split, or a renumber of the whole build', () => {
    const { planOptionSave, splitTarget } = require('../handlers/manage/loadouts');
    assert.deepStrictEqual(splitTarget('b2~2'), { id: 'b2', option: 2 });
    assert.deepStrictEqual(splitTarget('b2'), { id: 'b2', option: 0 });
    assert.deepStrictEqual(splitTarget('b2~x'), { id: 'b2', option: 0 });
    const ident = (raw) => form.parseIdentity(raw, 'MP');
    const plan = (existing, targetOption, raw) => planOptionSave({ existing, targetId: existing?._id || null, targetOption, ident: ident(raw), weaponKey: 'static-hv', siblings });
    const swap = plan(b2, 2, 'SMG, 2, 2C2C');
    assert.deepStrictEqual([swap.kind, swap.from, swap.to], ['self', 2, 0], 'changing 2c to 2 swaps it to A');
    assert.strictEqual(plan(b2, 1, 'SMG, , 2B2B').to, 1, 'a blank build # keeps the option where it is');
    assert.ok(/isn't one of them/.test(plan(b2, 1, 'SMG, 2d, 2B2B').error));
    const join = plan(b3, 0, 'SMG, 2b, 3A3A');
    assert.deepStrictEqual([join.kind, join.to, String(join.dest._id)], ['join', 1, 'b2'], 'Build 3 typed 2b joins Build 2');
    const add = plan(null, 0, 'SMG, 2d, 4D4D');
    assert.deepStrictEqual([add.kind, add.to], ['add', 3]);
    assert.ok(/next one is `2d`/.test(plan(null, 0, 'SMG, 2e, 4D4D').error));
    assert.ok(/no Build 7/.test(plan(null, 0, 'SMG, 7b, 4D4D').error));
    assert.strictEqual(plan(b2, 1, 'SMG, 4, 2B2B').kind, 'split', 'a plain number on another build makes it its own build');
    // Option A's plain number is the build's own: changing it moves the whole build with its options, as a renumber did before options had tags.
    assert.strictEqual(plan(b2, 0, 'SMG, 4, 2A2A').kind, 'renumber', 'Option A with another plain number renumbers the build');
    assert.strictEqual(plan(b2, 0, 'SMG, 3b, 2A2A').kind, 'join', 'Option A with a letter still joins another build');
    assert.ok(plan(b2, 1, 'SMG, 9, 2B2B').error, 'only a number the weapon can take');
    // A build with options keeps its weapon: a rename would move it into another weapon's numbers.
    assert.ok(/keeps its weapon name/.test(planOptionSave({ existing: b2, targetId: 'b2', targetOption: 0, ident: ident('SMG, 1, 2A2A'), weaponKey: 'other', siblings: [] }).error));
    const fullB2 = { ...b2, variants: Array.from({ length: 5 }, (_, i) => opt(`F${i}`, ['x'])) };
    const noRoom = planOptionSave({ existing: null, targetId: null, targetOption: 0, ident: ident('SMG, 2g, 4D4D'), weaponKey: 'static-hv', siblings: [b1, fullB2, b3] });
    assert.ok(noRoom.error, 'a build with 6 options takes no more');
});

check('the saved panel draws the option it saved, lists every option, and offers Add option', () => {
    const { savedPanel, deletePanel } = require('../utils/loadoutPanels');
    const after = { ...b2, buildName: 'Build 2' };
    const text = JSON.stringify(savedPanel({ doc: after, before: { ...lo.optionsOf(b2)[2], ...b2, ...opt('2C2C', ['C2']) }, option: 1, moveLine: '`2c` → `2b`', changeIds: ['#1'] }));
    assert.ok(text.includes('Updated · STATIC-HV Build 2 · Option B'));
    assert.ok(text.includes('**Option:** `2c` → `2b`'));
    assert.ok(text.includes('**B · `2b` · `2B2B`** ← this one'));
    assert.ok(text.includes('mng_ldedit_b2~1') && text.includes('mng_ldaddopt_b2~1'));
    assert.ok(!JSON.stringify(savedPanel({ doc: b1 })).includes('**Options**'), 'a plain build has no options list');
    const full = { ...b2, variants: Array.from({ length: 5 }, (_, i) => opt(`F${i}`, ['x'])) };
    assert.ok(!JSON.stringify(savedPanel({ doc: full })).includes('mng_ldaddopt_'), 'no Add option on a full build');
    const one = JSON.stringify(deletePanel({ doc: b2, token: 't', option: 1 }));
    assert.ok(one.includes('Delete Option B of STATIC-HV Build 2?') && one.includes('B2'));
    assert.ok(JSON.stringify(deletePanel({ doc: b2, token: 't' })).includes('all 3 options'));
});

check('an export writes each option as Build 2b, and the bulk parser reads it back', () => {
    const { formatLoadoutsAsBulkText, parseBulkLoadoutList } = require('../utils/adminParser');
    const txt = formatLoadoutsAsBulkText([b2]);
    assert.ok(txt.includes('Build: Build 2b\nImage: STATIC-HV-2B2B\nCode: 2B2B\n- B2'));
    assert.ok(txt.includes('Build: Build 2c'));
    const { parsed, errors } = parseBulkLoadoutList(txt);
    assert.deepStrictEqual(errors, []);
    assert.deepStrictEqual(parsed.map(p => p.buildName), ['Build 2', 'Build 2b', 'Build 2c']);
    assert.ok(!formatLoadoutsAsBulkText([b1]).includes('Build 1b'));
});

if (failures) { console.error(`\n${failures} loadout option check(s) failed.`); process.exit(1); }
console.log('\nloadoutOptions: all checks passed.');
