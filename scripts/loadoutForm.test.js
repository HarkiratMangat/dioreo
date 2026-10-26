// scripts/loadoutForm.test.js
//
// The five-field Add/Edit Loadout pop-up and the gunsmith-code picture keys (Harkirat, 2026-10-25 21:48 EDT; built 2026-10-26 01:21 EDT). Pins how the three text boxes are read and written back, how a build # swaps, how builds are ordered, how a key is minted (with the dev bot's DEV- namespace), and the bulk paste's required code. The one thing that must happen: a code change with the same attachments moves the picture to the new key. The one that must not: a new build's picture landing on another build's key, which every rule below exists to stop.
const assert = require('assert');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

const form = require('../utils/loadoutForm');

check('the first box splits the weapon from its label at the first comma or pipe', () => {
    assert.deepStrictEqual(form.parseWeaponLabel('BAL-27, Ranked'), { weaponName: 'BAL-27', label: 'Ranked' });
    assert.deepStrictEqual(form.parseWeaponLabel('BAL-27 | Ranked, S&D'), { weaponName: 'BAL-27', label: 'Ranked, S&D' });
    assert.deepStrictEqual(form.parseWeaponLabel('  HOLGER 26 '), { weaponName: 'HOLGER 26', label: '' });
});

check('the second box reads category, build # and code on MP, and refuses a code on DMZ', () => {
    assert.deepStrictEqual(form.parseIdentity('ar, 2, 1c2b 4a8b9a', 'MP'), { category: 'AR', number: 2, code: '1C2B4A8B9A' });
    assert.deepStrictEqual(form.parseIdentity('AR | | 1C2B4A8B9A', 'MP'), { category: 'AR', number: null, code: '1C2B4A8B9A' });
    assert.deepStrictEqual(form.parseIdentity('SMG, 3', 'DMZ'), { category: 'SMG', number: 3, code: '' });
    assert.ok(form.parseIdentity('SMG, 3, 1A2B', 'DMZ').error, 'DMZ has no code, so a third part is a mistake');
    assert.ok(form.parseIdentity('AR, two, 1A2B', 'MP').error);
    assert.ok(form.parseIdentity('AR, 0, 1A2B', 'MP').error);
    assert.ok(form.parseIdentity('', 'MP').error);
});

check('the attachments box keeps attachments and pulls out the Badges: line', () => {
    const r = form.parseAttachmentsBadges('- Gauge-9 Mono\nCrown-H3 Barrel\n\nBadges: meta, top3');
    assert.deepStrictEqual(r.attachments, ['Gauge-9 Mono', 'Crown-H3 Barrel']);
    assert.strictEqual(r.badgesRaw, 'meta, top3');
    assert.strictEqual(form.parseAttachmentsBadges('A\nbadges:').badgesRaw, '');
});

const b = (id, buildName, extra = {}) => ({ _id: id, buildName, ...extra });

check('builds order by number, so Build 10 comes after Build 2, then anything unnumbered by _id', () => {
    const order = [b('c', 'Build 10'), b('a', 'Ranked'), b('d', 'Build 2'), b('b', 'Build 1')].sort(form.compareBuilds).map(x => x.buildName);
    assert.deepStrictEqual(order, ['Build 1', 'Build 2', 'Build 10', 'Ranked']);
});

check('a taken build # on an edit swaps the two builds', () => {
    const siblings = [b('a', 'Build 1'), b('b', 'Build 2'), b('c', 'Build 3')];
    assert.deepStrictEqual(form.planNumbering({ siblings, targetId: 'c', wanted: 1 }), { number: 1, moves: [{ id: 'a', buildName: 'Build 3' }] });
    assert.deepStrictEqual(form.planNumbering({ siblings, targetId: 'b', wanted: null }), { number: 2, moves: [] });
    assert.deepStrictEqual(form.planNumbering({ siblings, targetId: 'b', wanted: 2 }), { number: 2, moves: [] });
    assert.ok(form.planNumbering({ siblings, targetId: 'b', wanted: 4 }).error, 'an edit cannot leave a gap');
});

check('a new build takes the next number, or a taken one and moves its holder to the end', () => {
    const siblings = [b('a', 'Build 1'), b('b', 'Build 2')];
    assert.deepStrictEqual(form.planNumbering({ siblings, wanted: null }), { number: 3, moves: [] });
    assert.deepStrictEqual(form.planNumbering({ siblings, wanted: 1 }), { number: 1, moves: [{ id: 'a', buildName: 'Build 3' }] });
    assert.ok(form.planNumbering({ siblings, wanted: 5 }).error);
    assert.deepStrictEqual(form.planNumbering({ siblings: [], wanted: null }), { number: 1, moves: [] });
});

check('a legacy build with its label as its name gets the label and its place as its number', () => {
    const doc = b('b', 'Ranked', { weaponName: 'BAL-27', mode: 'MP', category: 'AR', shareCode: '1A2B', attachments: ['X'] });
    const values = form.editValues(doc, [b('a', 'Build 1'), doc], ['meta']);
    assert.deepStrictEqual(values, { weapon: 'BAL-27, Ranked', build: 'AR, 2, 1A2B', attachments: 'X\nBadges: meta' });
});

check('the Edit boxes read back to the same build, so saving unchanged changes nothing', () => {
    const doc = b('a', 'Build 2', { weaponName: 'BAL-27', label: 'Ranked', mode: 'MP', category: 'AR', shareCode: '1C2B4A8B9A', attachments: ['A', 'B'] });
    const v = form.editValues(doc, [b('z', 'Build 1'), doc], ['meta', 'top3']);
    assert.deepStrictEqual(form.parseWeaponLabel(v.weapon), { weaponName: 'BAL-27', label: 'Ranked' });
    assert.deepStrictEqual(form.parseIdentity(v.build, 'MP'), { category: 'AR', number: 2, code: '1C2B4A8B9A' });
    assert.deepStrictEqual(form.parseAttachmentsBadges(v.attachments), { attachments: ['A', 'B'], badgesRaw: 'meta, top3' });
    const dmz = form.editValues({ ...doc, mode: 'DMZ', shareCode: '' }, [doc], []);
    assert.strictEqual(dmz.build, 'AR, 2', 'a DMZ box has no code part');
});

// Keys: read the module fresh under each NODE_ENV, since the dev prefix is decided at call time.
const cache = require('../utils/loadoutImageCache');
function withEnv(env, fn) {
    const before = process.env.NODE_ENV;
    process.env.NODE_ENV = env;
    try { return fn(); } finally { if (before === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = before; }
}

check('an MP picture key is WEAPON-CODE, never a number', () => {
    withEnv('production', () => {
        assert.strictEqual(cache.codeImageKey('BAL-27', '1c2b 4a8b9a'), 'BAL-27-1C2B4A8B9A');
        assert.strictEqual(cache.codeImageKey('Holger 26', '1A2B'), 'HOLGER-26-1A2B');
        assert.strictEqual(cache.codeImageKey('BAL-27', ''), null, 'no code, no key');
        // Separators would let two builds mint one key: AK + 117-X and AK-117 + X (the commit security review, 2026-10-26 01:27 EDT).
        assert.strictEqual(cache.codeImageKey('AK', '117-X1'), null);
        assert.strictEqual(cache.codeImageKey('AK', '1A/2B3C'), null);
        assert.ok(form.parseIdentity('AR, 1, 117-X1', 'MP').error);
        const q = cache.keyHolderQuery('BAL-27-1A2B', 'me');
        assert.ok(q.imageKey.test('BAL-27-1A2B.png') && q.imageKey.test('bal-27-1a2b') && !q.imageKey.test('BAL-27-1A2BX'));
        assert.deepStrictEqual(q._id, { $ne: 'me' });
    });
});

check('the dev bot mints every key under DEV-, and only those pass the dev guard', () => {
    withEnv('development', () => {
        assert.strictEqual(cache.codeImageKey('BAL-27', '1A2B'), 'DEV-BAL-27-1A2B');
        assert.strictEqual(cache.deriveImageKey('AK117', 'DMZ', []), 'DEV-DMZ-AK117-1');
        assert.ok(cache.isDevNamespaceKey('DEV-BAL-27-1A2B'));
        assert.ok(!cache.isDevNamespaceKey('BAL-27-1A2B'));
        assert.ok(cache.takenKeyPattern('AK117').test('DEV-DMZ-AK117-1'), 'a taken dev key is skipped too');
        assert.strictEqual(cache.deriveImageKey('AK117', 'DMZ', ['DEV-DMZ-AK117-1']), 'DEV-DMZ-AK117-2');
    });
});

check('metadata carries the label always and the screenshot hash when there is one', () => {
    const md = cache.buildLoadoutMetadata({ weaponName: 'BAL-27', mode: 'MP', buildName: 'Build 2', shareCode: '1A2B', label: 'Ranked', sourceHash: 'abc' });
    assert.strictEqual(md.Label, 'Ranked');
    assert.strictEqual(md.Source_Hash, 'abc');
    assert.strictEqual(md.Build_Number, 2);
    assert.strictEqual(cache.buildLoadoutMetadata({ weaponName: 'X', mode: 'MP' }).Label, '', 'a cleared label clears in Cloudinary too');
    for (const f of ['Label', 'Source_Hash']) assert.ok(cache.METADATA_FIELDS.some(m => m.external_id === f), `${f} is defined for createCloudinaryMetadataFields.js`);
});

check('a bulk paste skips an MP block without a code and keeps a Coming Soon placeholder', () => {
    const ops = require('../core/ops');
    const r = ops.resolveOp('loadout.bulkAdd').validate({ type: 'loadout.bulkAdd', target: { mode: 'MP' }, payload: {
        text: 'BAL-27 | AR\nCode: 1A2B\n- Gauge-9 Mono\n\nAK117 | AR\n- Gauge-9 Mono\n\nPHARO | SMG\n- Coming Soon' } });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
    assert.deepStrictEqual(r.normalized.payload.parsed.map(p => p.weaponName), ['BAL-27', 'PHARO']);
    assert.ok(r.normalized.payload.parseErrors.some(e => /AK117.*Code:/.test(e)), r.normalized.payload.parseErrors.join(' | '));
    const dmz = ops.resolveOp('loadout.bulkAdd').validate({ type: 'loadout.bulkAdd', target: { mode: 'DMZ' }, payload: { text: 'AK117 | AR\n- Gauge-9 Mono' } });
    assert.strictEqual(dmz.normalized.payload.parsed.length, 1, 'DMZ has no code to require');
});

check('the bulk format round-trips a label', () => {
    const { parseBulkLoadoutList, formatLoadoutsAsBulkText } = require('../utils/adminParser');
    const text = formatLoadoutsAsBulkText([{ weaponName: 'BAL-27', category: 'AR', buildName: 'Build 2', label: 'Ranked', shareCode: '1A2B', imageKey: 'BAL-27-1A2B', attachments: ['A'] }]);
    assert.ok(text.includes('Label: Ranked'), text);
    assert.strictEqual(parseBulkLoadoutList(text).parsed[0].label, 'Ranked');
});

check('a failed submit refills every text box and builds a bulk snippet with the label and code', () => {
    const retry = require('../handlers/manage/retry');
    const values = { weapon: 'BAL-27, Ranked', build: 'AR, 2, 1A2B', attachments: 'A\nBadges: meta', image_url: '' };
    assert.strictEqual(retry.loadoutSnippet(values), 'BAL-27 | AR\nBuild: Build 2\nLabel: Ranked\nCode: 1A2B\nBadges: meta\n- A');
    retry.pendingModalRetries.set('t1', { modalCustomId: 'edit_loadout_abc', values });
    const json = retry.buildRetryModal('t1');
    const got = Object.fromEntries(json.components.map(l => [l.component.custom_id, l.component.value]));
    assert.strictEqual(got.weapon, 'BAL-27, Ranked');
    assert.strictEqual(got.build, 'AR, 2, 1A2B');
    assert.strictEqual(json.components[4].component.type, 19, 'the screenshot field is still the upload');
    retry.pendingModalRetries.delete('t1');
});

check('the pop-up is five Labels with the upload last, and DMZ asks for no code', () => {
    const manage = require('../commands/manage');
    const mp = manage.buildAddLoadoutModal('MP').toJSON();
    assert.strictEqual(mp.components.length, 5, "Discord's cap");
    assert.ok(mp.components.every(c => c.type === 18));
    assert.deepStrictEqual(mp.components.map(c => c.component.custom_id), ['weapon', 'build', 'attachments', 'image_url', 'image_file']);
    assert.ok(/gunsmith code/i.test(mp.components[1].label));
    assert.ok(!/code/i.test(manage.buildAddLoadoutModal('DMZ').toJSON().components[1].label));
    assert.ok(!('toJSON' in JSON.parse(JSON.stringify(mp))), 'the serialized copy carries no function');
    for (const c of mp.components) {
        assert.ok(c.label.length <= 45, `label too long: ${c.label}`);
        assert.ok(!c.description || c.description.length <= 100, `description too long: ${c.description}`);
    }
});

check('the migration plan copies matching pictures, lists a mismatch, and leaves a placeholder alone', () => {
    const { planFor } = require('./migrateLoadoutKeys');
    const builds = [
        { _id: 'a', weaponName: 'BAL-27', weaponKey: 'bal-27', mode: 'MP', buildName: 'Build 1', shareCode: '1A2B', imageKey: 'BAL-27-1.png', attachments: ['X'] },
        { _id: 'b', weaponName: 'BAL-27', weaponKey: 'bal-27', mode: 'MP', buildName: 'Ranked', shareCode: '3C4D', imageKey: 'BAL-27-2', attachments: ['Y'] },
        { _id: 'c', weaponName: 'PHARO', weaponKey: 'pharo', mode: 'MP', buildName: 'Coming Soon', shareCode: '', imageKey: 'https://placehold.co/x', attachments: ['Coming Soon'] },
    ];
    const pictures = new Map([
        ['BAL-27-1', { secure_url: 'https://res/1', metadata: { Gunsmith_Code: '1A2B' } }],
        ['BAL-27-2', { secure_url: 'https://res/2', metadata: { Gunsmith_Code: '9Z9Z' } }],
    ]);
    const rows = withEnv('production', () => planFor(builds, pictures));
    const byId = Object.fromEntries(rows.map(r => [r.id, r]));
    assert.deepStrictEqual(byId.a.copy, { from: 'https://res/1', to: 'BAL-27-1A2B', exists: false });
    assert.strictEqual(byId.b.copy, undefined, 'a picture of another code is never copied');
    assert.ok(byId.b.notes.some(n => /MISMATCH/.test(n)));
    assert.deepStrictEqual({ buildName: byId.b.set.buildName, label: byId.b.set.label }, { buildName: 'Build 2', label: 'Ranked' });
    assert.strictEqual(byId.c, undefined, 'the placeholder is left as it is');
});

check('the no-build list leads with its count and groups by class', () => {
    const { formatMissingWeapons } = require('../utils/loadoutLookup');
    const text = formatMissingWeapons([{ name: 'AK-47', category: 'AR' }, { name: 'ASM10', category: 'AR' }, { name: 'PHARO', category: 'SMG' }]);
    assert.deepStrictEqual(text.split('\n'), ['3 MP weapons in the CODM catalogue with no build in Dioreo', '', 'AR (2)', '- AK-47', '- ASM10', '', 'SMG (1)', '- PHARO']);
    assert.ok(formatMissingWeapons([]).startsWith('0 MP weapons'));
});

if (failures) { console.error(`\n${failures} loadout form check(s) failed.`); process.exit(1); }
console.log('\nloadoutForm: all checks passed.');
process.exit(0);
