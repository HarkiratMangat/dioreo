// scripts/draftDraws.test.js -- the Next Season Draft's draws one at a time (2026-11-08 12:27 EST): the list logic, the single bulk line, the Edit pop-up's prefill, and the panel's shape and ids. No database.
const assert = require('assert');
const DD = require('../utils/draftDraws');
const { parseBulkDrawList } = require('../utils/adminParser');
const V = require('../handlers/manage/seasonPanel/views');

let failed = 0;
function t(name, fn) { try { fn(); console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name}\n    ${e.message}`); } }
const D = s => new Date(s);
const draw = (id, title, date, extra = {}) => ({ _id: id, title, date: D(date), thumbnailUrl: 'https://x/y.png', items: [{ tier: 'mythic', name: 'Gun - Skin' }, { tier: 'legendary', name: 'Other - Skin' }], ...extra });

t('add puts a draw in date order; remove drops only the picked ids; edit keeps the id and the news tag', () => {
    const list = [draw('a', 'A Draw', '2026-11-12'), draw('c', 'C Draw', '2026-11-20', { newsSource: { rank: 3, sig: 's' } })];
    assert.deepStrictEqual(DD.addDraw(list, draw('b', 'B Draw', '2026-11-15')).map(d => d._id), ['a', 'b', 'c']);
    assert.deepStrictEqual(DD.removeDraws(list, ['a']).map(d => d._id), ['c']);
    assert.deepStrictEqual(DD.removeDraws(list, ['a', 'c']), [], 'removing every draw leaves an empty list, never a skipped one');
    const edited = DD.editDraw(list, 'c', { title: 'C Draw Renamed', date: D('2026-11-10'), items: [] });
    assert.strictEqual(edited[0]._id, 'c'); assert.deepStrictEqual(edited[0].newsSource, { rank: 3, sig: 's' });
    assert.strictEqual(DD.editDraw(list, 'zz', {}), null);
});
t('the pop-up\'s fields make one line the bulk parser reads, and a stored draw\'s items prefill one per line', () => {
    const line = DD.lineFor({ title: 'Botanist Mythic Drop', type: '', items: 'm Weapon - Bloom\nl Other - Petal\n-# a note', date: 'November 26, 2026', image: 'https://x/b.png' });
    const p = parseBulkDrawList(line);
    assert.strictEqual(p.length, 1);
    assert.strictEqual(p[0].title, 'Botanist Mythic Drop');
    assert.deepStrictEqual(p[0].items.map(i => i.tier), ['mythic', 'legendary', 'comment']);
    assert.strictEqual(DD.itemLines(draw('a', 'A Draw', '2026-11-12')), 'm Gun - Skin\nl Other - Skin');
});
t('the panel lists the section in date order, each draw with its own Open (its card, 2026-11-09), and stays under 40 components', () => {
    const many = Array.from({ length: 9 }, (_, i) => draw(`id${i}`, `Draw ${i}`, `2026-11-${String(20 - i).padStart(2, '0')}`));
    const doc = { draft: { active: true, newDraws: many, returningDraws: [] } };
    const out = V.draftDrawsView(doc, 'n', 0);
    const ids = JSON.stringify(out).match(/"custom_id":"[^"]+"/g);
    assert.ok(ids.every(x => x.includes('mng_ss|')) && new Set(ids).size === ids.length, 'own ids, no duplicates');
    assert.ok(ids.some(x => x.includes('mng_ss|ddc|n|id8')), 'the earliest draw first, with its Open');
    const count = c => Array.isArray(c) ? c.reduce((n, x) => n + count(x), 0) : 1 + (c.components ? count(c.components) : 0) + (c.accessory ? 1 : 0);
    assert.ok(count(out) <= 40 && count(V.draftDrawsView(doc, 'n', 1)) <= 40);
    // Page 2's left arrow points at page 1 (`dd|n|0`): a tab with that same id made Discord refuse the page, so the right arrow did nothing (2026-11-10).
    const ids2 = JSON.stringify(V.draftDrawsView(doc, 'n', 1)).match(/"custom_id":"[^"]+"/g);
    assert.strictEqual(new Set(ids2).size, ids2.length, `page 2 has no duplicate ids: ${ids2.filter((x, i) => ids2.indexOf(x) !== i)}`);
});
t('the Add, Edit and Remove pop-ups fit Discord: labels under 45, ids under 100, at most 25 options', () => {
    const d = draw('652f1c2b9e1a4b0012345678', 'A Draw', '2026-11-12');
    for (const m of [V.draftDrawModal('n'), V.draftDrawModal('r', d)]) {
        assert.ok(m.custom_id.length <= 100 && m.components.length === 5);
        assert.ok(m.components.every(r => r.components[0].label.length <= 45));
    }
    const rm = V.draftRemoveModal({ draft: { newDraws: Array.from({ length: 30 }, (_, i) => draw(`x${i}`, `D ${i}`, '2026-11-12')) } }, 'n');
    assert.ok(rm.components[0].component.options.length === 25 && rm.components[0].label.length <= 45);
});

console.log(failed ? `\n${failed} failed` : '\ndraftDraws: all checks passed');
process.exit(failed ? 1 : 0);
