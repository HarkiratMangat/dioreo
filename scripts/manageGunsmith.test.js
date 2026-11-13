// Tests for the rehauled /manage gunsmith panel (handlers/manage/gunsmith/, 2026-11-07 14:24 EST). No database: the one search that reads builds gets a stub of handlers/manage/loadouts.js buildChoices. Covers the plan's checks (local/project/features/manage-rehaul/spec.md): the search rules (`fss 1b` finds Option B; a number in a weapon's name is the name), Edit N's pop-up packing, the Select page within Discord's limits (40 components, 4,000 characters, 25 options, custom ids of 100), and the quick picks.
const assert = require('assert');
const path = require('path');

let failed = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failed += 1; console.log(`  ✗ ${name}\n      ${e.message}`); }
}

// Stub buildChoices: the labels the real one gives (`WEAPON · Build N · label`, and an option as `WEAPON · Nb · Option B`).
const CHOICES = [
    { name: 'FSS HURRICANE · Build 1', value: 'a'.repeat(24) },
    { name: 'FSS HURRICANE · 1b · Option B', value: `${'a'.repeat(24)}~1` },
    { name: 'FSS HURRICANE · 1 · Option A', value: `${'a'.repeat(24)}~0` },
    { name: 'KILO 141 · Build 1', value: 'b'.repeat(24) },
    { name: 'KILO 141 · Build 2 · Ranked', value: 'c'.repeat(24) },
    { name: 'FSS HURRICANE · Build 1 (Delete)', value: 'd'.repeat(24) },
    { name: '＋ New build for FSS HURRICANE', value: 'new:fsshurricane' },
];
const loadoutsPath = require.resolve(path.join(__dirname, '../handlers/manage/loadouts'));
require.cache[loadoutsPath] = { id: loadoutsPath, filename: loadoutsPath, loaded: true, exports: {
    buildChoices: async (group, query) => {
        const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
        return CHOICES.filter(c => words.every(w => c.name.toLowerCase().replace(/ · /g, ' ').includes(w)));
    },
} };

const S = require('../handlers/manage/gunsmith/search');
const B = require('../handlers/manage/gunsmith/blocks');
const V = require('../handlers/manage/gunsmith/views');

function walk(components, fn) { for (const c of components || []) { fn(c); walk(c.components, fn); if (c.accessory) fn(c.accessory); if (c.component) fn(c.component); } }

(async () => {
    console.log('manage gunsmith');

    await check('a build tag must equal the build\'s own: `fss 1b` finds Option B only', async () => {
        const hits = await S.searchBuilds('MP', 'fss 1b');
        assert.deepStrictEqual(hits.map(h => [h.id.slice(0, 1), h.option]), [['a', 1]]);
    });
    await check('a number in the weapon\'s own name is the name: `kilo 141` finds both KILO builds', async () => {
        const hits = await S.searchBuilds('MP', 'kilo 141');
        assert.deepStrictEqual(hits.map(h => h.label), ['KILO 141 · Build 1', 'KILO 141 · Build 2 · Ranked']);
    });
    await check('`kilo 141 2` finds Build 2 alone, and delete rows and new-build rows never come back', async () => {
        assert.deepStrictEqual((await S.searchBuilds('MP', 'kilo 141 2')).map(h => h.label), ['KILO 141 · Build 2 · Ranked']);
        const fss = await S.searchBuilds('MP', 'fss');
        assert.ok(fss.every(h => !/Delete|New build/.test(h.label)), fss.map(h => h.label).join(' | '));
    });

    await check('class words read as a class', () => {
        assert.strictEqual(S.categoryOfLine('smg'), 'SMG');
        assert.strictEqual(S.categoryOfLine('All Snipers'), 'SNIPER');
        assert.strictEqual(S.categoryOfLine('pistols'), 'SECONDARIES');
        assert.strictEqual(S.categoryOfLine('fss 1b'), null);
    });

    await check('DMZ ranks read as words: Best Close, Top 3 Mid-Long, HM', () => {
        assert.deepStrictEqual(S.badgeWord('bestclose'), ['best', 'Best Close']);
        assert.deepStrictEqual(S.badgeWord('top3midlong'), ['top3', 'Top 3 Mid-Long']);
        assert.deepStrictEqual(S.badgeWord('capable'), ['hm', 'HM']);
        assert.deepStrictEqual(S.badgeWord('meta'), ['meta', 'Meta']);
        assert.strictEqual(S.badgeWord('nonsense'), null);
    });

    await check('quick picks fit one dropdown, every class has one, and each pick tests builds', () => {
        for (const mode of ['MP', 'DMZ']) {
            const picks = S.quickPicks(mode);
            assert.ok(picks.length <= 25, `${mode}: ${picks.length} picks`);
            assert.strictEqual(new Set(picks.map(p => p[0])).size, picks.length, `${mode}: duplicate pick values`);
            for (const [value] of picks) assert.strictEqual(typeof S.pickTest(mode, value), 'function', `${mode} ${value} has no test`);
        }
        assert.ok(S.pickTest('MP', 'meta')({ isMeta: true }));
        assert.ok(S.pickTest('DMZ', 'bestclose')({ dmzRangeRank: 'best-close' }));
        assert.ok(!S.pickTest('DMZ', 'bestclose')({ dmzRangeRank: 'best-midlong' }));
        assert.ok(S.pickTest('MP', 'cat:AR')({ category: 'AR' }));
    });

    await check('Edit N packs blocks into at most 5 boxes of 4,000 characters, never splitting a build', () => {
        const block = (i) => `WEAPON ${i} | AR\nBuild: Build 1\n${'- attachment name here\n'.repeat(5)}`.trim();
        const blocks = Array.from({ length: 200 }, (_, i) => block(i));
        const fit = B.fitCount(blocks);
        assert.ok(fit > 0 && fit < 200, `fit ${fit}`);
        const modal = B.blocksModal('mng_gs|M|teditm|tok', 'Edit', blocks.slice(0, fit));
        assert.ok(modal, 'the fitting set made no pop-up');
        assert.ok(modal.components.length <= 5);
        for (const c of modal.components) {
            assert.ok(c.component.value.length <= 4000, `box ${c.label} is ${c.component.value.length}`);
            assert.ok(c.component.value.split('\n\n').every(b => /^WEAPON \d+ \| AR\nBuild: Build 1/.test(b)), 'a build was split between boxes');
        }
        assert.strictEqual(B.blocksModal('x', 'x', blocks.slice(0, fit + 1)), null, 'one more than fits still made a pop-up');
        assert.strictEqual(B.blocksModal('x', 'x', []), null);
    });

    await check('capList keeps a result inside one text block', () => {
        const lines = Array.from({ length: 134 }, (_, i) => `- build ${i}`);
        const out = B.capList(lines);
        assert.strictEqual(out.length, 21);
        assert.match(out[20], /and 114 more/);
        assert.deepStrictEqual(B.capList(lines.slice(0, 3)), lines.slice(0, 3));
    });

    await check('custom ids are mng_gs|<M|D>|… and refuse to pass 100 characters', () => {
        assert.strictEqual(V.ID('MP', 'card', 'a'.repeat(24), 1), `mng_gs|M|card|${'a'.repeat(24)}|1`);
        assert.strictEqual(V.ID('DMZ', 'page'), 'mng_gs|D|page');
        assert.throws(() => V.ID('MP', 'x'.repeat(100)), /over 100/);
        assert.deepStrictEqual(V.MODE_OF, { M: 'MP', D: 'DMZ' });
    });

    await check('a Select page at 134 builds stays inside Discord\'s limits, and selection shows', () => {
        const keys = Array.from({ length: 134 }, (_, i) => `${String(i).padStart(24, '0')}${i % 9 === 0 ? '~1' : ''}`);
        const info = new Map(keys.map((k, i) => [k, { icon: '<:wcAR:1234567890123456789>', emojiKey: null, title: `**SOME LONG WEAPON NAME ${i}** · ${i % 9 === 0 ? '2b' : '2'}`, small: 'Ranked · <a:meta:1234567890123456789> Meta <:top3:1234567890123456789> Top 3 · 3 options', plain: `SOME LONG WEAPON NAME ${i} · 2 · Ranked`, plainSmall: 'Ranked · Meta Top 3 · 3 options' }]));
        const sel = { ids: keys, selected: keys.slice(0, 15), query: ['All MP builds', 'fss 1b'], unmatched: ['nothing like this'] };
        const pages = Math.ceil(keys.length / V.SELECT_PAGE);
        for (let p = 0; p < pages; p++) for (const view of [V.resultsView('MP', 'tok12345', sel, info, null, p), V.selectView('MP', 'tok12345', sel, info, null, p)]) {
            let count = 0, chars = 0; const ids = [];
            walk(view, c => { count += 1; if (c.type === 10) chars += c.content.length; if (c.custom_id) ids.push(c.custom_id); if (c.type === 3) assert.ok(c.options.length <= 25 && c.max_values <= c.options.length); });
            assert.ok(count <= 40, `page ${p + 1}: ${count} components`);
            assert.ok(chars <= 4000, `page ${p + 1}: ${chars} characters`);
            assert.ok(ids.every(id => id.length <= 100), `page ${p + 1}: an id over 100`);
            assert.strictEqual(new Set(ids).size, ids.length, `page ${p + 1}: duplicate ids`);
        }
        // The search/select redesign (2026-11-11 15:15 EST): the results tick what is selected and offer View Selected; the Selected view acts on the set.
        const results = JSON.stringify(V.resultsView('MP', 'tok12345', sel, info, null, 0));
        assert.match(results, /134 builds/);
        assert.match(results, /page 1 of 14/);
        assert.match(results, /15 selected/);
        assert.match(results, /Select All 134/);
        assert.match(results, /View Selected · 15/);
        assert.match(results, /\|spick\|tok12345\|0/);
        const set = JSON.stringify(V.selectView('MP', 'tok12345', sel, info, null, 0));
        for (const want of ['15 selected', 'Edit 15', 'Expand View', 'Export 15', 'Delete 15', 'Select More', '|sunpick|tok12345']) assert.ok(set.includes(want), want);
        const none = JSON.stringify(V.selectView('MP', 'tok12345', { ...sel, selected: [] }, info, null, 0));
        assert.ok(none.includes('|spick|') && !none.includes('|tedit|'), 'nothing selected shows the results, with no bulk actions');
    });

    await check('an empty Select list offers Search Again and Home only', () => {
        const view = JSON.stringify(V.selectView('DMZ', 'tok', { ids: [], selected: [], query: ['zzz'], unmatched: ['zzz'] }, new Map()));
        assert.match(view, /No builds found/);
        assert.ok(!/tedit|tdel|texp/.test(view));
    });

    // 2026-11-11 16:52 EST (think-pass): a card opened from one selected build goes back to the results, and keeps that way back through Edit, Move and Delete; opened any other way it goes back to its weapon.
    await check('a build selected whole drops its own options from the set it acts on', () => {
        const { collapseKeys } = require('../handlers/manage/gunsmith/search');
        const id = 'b'.repeat(24), other = 'c'.repeat(24);
        assert.deepStrictEqual(collapseKeys([id, `${id}~1`, `${other}~1`, `${other}~2`]), [id, `${other}~1`, `${other}~2`]);
        assert.deepStrictEqual(collapseKeys([`${id}~1`]), [`${id}~1`]);
    });
    await check('a card opened from a selection goes back to the results, through Edit, Move and Delete', async () => {
        const modelPath = require.resolve('../models/Loadout');
        const saved = require.cache[modelPath];
        const doc = { _id: 'a'.repeat(24), mode: 'MP', weaponKey: 'fss', weaponName: 'FSS Hurricane', category: 'smg', buildName: 'Build 1', attachments: ['Muzzle: X'], shareCode: '1A2B', variants: [] };
        const q = (v) => ({ lean: async () => v, select() { return q(v); } });
        require.cache[modelPath] = { id: modelPath, filename: modelPath, loaded: true, exports: { findById: () => q(doc), find: () => q([doc]) } };
        try {
            const V = require('../handlers/manage/gunsmith/views');
            const ids = async (...args) => JSON.stringify(await V.cardView(...args)).match(/"custom_id":"[^"]+"/g).map(x => x.slice(13, -1));
            const fromSel = await ids('MP', doc._id, 0, null, null, 'tok1');
            assert.ok(fromSel.includes('mng_gs|M|list|tok1|0'), fromSel.join(' '));
            // Credit is on the card (2026-11-12, Harkirat: "where tf is the credit option/button"), carrying the way back like Edit.
            for (const verb of ['edit', 'move', 'credit', 'del']) assert.ok(fromSel.includes(`mng_gs|M|${verb}|${doc._id}|0|tok1`), verb);
            assert.ok(!fromSel.some(x => x.includes('|wback|')));
            const plain = await ids('MP', doc._id, 0);
            assert.ok(plain.includes('mng_gs|M|wback|fss') && !plain.some(x => x.includes('tok1')));
            assert.strictEqual(V.moveModal('MP', doc, 0, 'tok1').custom_id, `mng_gs|M|movem|${doc._id}|0|tok1`);
            const card = JSON.parse(JSON.stringify(await V.cardView('MP', doc._id, 0)));
            const rows = []; const walk = (c) => { if (c?.type === 1) rows.push(c.components.length); (c?.components || []).forEach(walk); }; card.forEach(walk);
            assert.ok(rows.every(n => n <= 5), `a card row holds ${Math.max(...rows)} buttons`);
            // A save drawn in place puts the panel's own Revert above the card's buttons, inside Discord's rules.
            const withRevert = await V.cardView('MP', doc._id, 0, '### Saved\n- **Attachments:** ~~a~~ → b', null, 'tok1', { type: 1, components: [{ type: 2, style: 4, label: 'Revert', custom_id: V.ID('MP', 'rev', '#1,#2', doc._id, 0, 'tok1') }] });
            assert.deepStrictEqual(require('../utils/componentCheck').checkComponents(withRevert), []);
            assert.ok(JSON.stringify(withRevert).includes(`mng_gs|M|rev|#1,#2|${doc._id}|0|tok1`));
        } finally {
            if (saved) require.cache[modelPath] = saved; else delete require.cache[modelPath];
        }
    });
    await check('Export writes the fields Include keeps, and the merged-build choices', () => {
        const build = { weaponName: 'BAL-27', category: 'AR', mode: 'MP', buildName: 'Build 2', shareCode: '1A2B3C4D5E', label: 'Ranked', attachments: ['A1', 'A2'], variants: [{ attachments: ['B1'], shareCode: '1B2C3D4E5F', label: 'Pubs' }] };
        const all = B.exportText('MP', [build], { include: ['code', 'label', 'mode'], merged: 'keep' });
        assert.match(all, /Mode: MP/);
        assert.match(all, /Code: 1A2B3C4D5E/);
        const bare = B.exportText('MP', [build], { include: [], merged: 'first' });
        assert.ok(!/Code:|Label:|Mode:/.test(bare), bare);
        assert.ok(!/B1/.test(bare), 'first option only still wrote Option B');
        const split = B.exportText('MP', [build], { include: ['label'], merged: 'split' });
        assert.strictEqual(split.split('\n\n').length, 2, split);
    });

    console.log(failed ? `\n${failed} check(s) FAILED.` : '\nAll manage gunsmith checks passed.');
    process.exit(failed ? 1 : 0);
})();
