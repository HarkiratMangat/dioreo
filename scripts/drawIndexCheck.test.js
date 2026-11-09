// scripts/drawIndexCheck.test.js -- /manage draws' Check Draw Index (utils/drawIndexCheck.js + the result panel in handlers/manage/drawsPanel/views.js), over a small made-up index: no database, no Discord.
const assert = require('assert');
const C = require('../utils/drawIndexCheck');
const V = require('../handlers/manage/drawsPanel/views');

const item = (name, kind, tier = 'mythic') => { const [baseName, skinName] = name.split(' - '); return { tier, kind, name, baseName, skinName: skinName || '' }; };
const { slugify } = require('../utils/cloudinaryCache');
const INDEX = [
    { slug: 'hollow', title: 'Lethal Hollow Draw', imageUrl: 'https://x/1.png', priceType: 'mythicWeapon', releaseSeason: 7, releaseYear: 2025, aliases: ['Hollow Point'], items: [item('CX-9 - Lethal Hollow', 'weapon'), item('Reaper - Hollow', 'operator', 'legendary')] },
    { slug: 'reason', title: 'Herrscher of Reason Draw', imageUrl: '', priceType: 'unknown', items: [item('Herrscher of Reason', null), item('Kilo - Reason', null, 'epic')] },
    { slug: 'ember1', title: 'Ember Spark Draw', imageUrl: 'https://x/2.png', priceType: 'legendaryWeapon', items: [item('AK-47 - Ember', 'weapon', 'legendary')] },
    { slug: 'ember2', title: 'Ember Blaze Draw', imageUrl: 'https://x/3.png', priceType: 'legendaryWeapon', items: [item('M4 - Ember', 'weapon', 'legendary')] },
    { slug: 'ember3', title: 'Ember Crown Draw', imageUrl: 'https://x/4.png', priceType: 'legendaryWeapon', items: [item('Fennec - Ember', 'weapon', 'legendary')] },
    { slug: 'empty', title: 'Bare Draw', imageUrl: 'https://x/5.png', priceType: 'legendaryWeapon', items: [] },
].map(e => ({ ...e, slug: slugify(e.title) })); // the index's slug is the title's, which is what a title match reads
const SEASON = { newDraws: [{ title: 'Lethal Hollow' }], returningDraws: [] };
const ctx = { seasonalDoc: SEASON, isSameTitle: require('../utils/search').isSameDrawTitle };

let passed = 0, failed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log(`  PASS  ${name}`); } catch (e) { failed++; console.error(`  FAIL  ${name}\n        ${e.message}`); } };
const walk = (cs, out = []) => { for (const c of cs || []) { out.push(c); walk(c.components, out); if (c.accessory) out.push(c.accessory); } return out; };

t('a title finds its draw, complete, and says it is on /draws', () => {
    const r = C.checkLine(INDEX, 'Lethal Hollow Draw', ctx);
    assert.strictEqual(r.status, 'found'); assert.strictEqual(r.title, 'Lethal Hollow Draw'); assert.strictEqual(r.matchedBy, 'title');
    assert.deepStrictEqual(r.needs, []); assert.strictEqual(r.onDraws, 'New'); assert.strictEqual(r.season, 'Season 7 2025');
    assert.match(C.resultBlock(r, require('../utils/emojiMap')), /^\S+ \*\*Lethal Hollow Draw\*\*\n-# Complete · by its title · 2 items · Mythic Weapon · Season 7 2025 · on \/draws \(New\)$/);
});
t('another name it ran under finds it', () => assert.strictEqual(C.checkLine(INDEX, 'hollow point', ctx).matchedBy, 'alias'));
t('an item name finds its draw and names the item', () => {
    const r = C.checkLine(INDEX, 'cx9 lethal hollow', ctx);
    assert.strictEqual(r.title, 'Lethal Hollow Draw'); assert.strictEqual(r.item, 'CX-9 - Lethal Hollow');
});
t('what a draw lacks: picture, item kinds, draw type', () => {
    const r = C.checkLine(INDEX, 'herrscher of reason', ctx);
    assert.strictEqual(r.title, 'Herrscher of Reason Draw');
    assert.deepStrictEqual(r.needs, ['no picture', '2 items without a kind', 'no draw type']);
    assert.strictEqual(r.onDraws, null);
});
t('a draw with no items says so once, under Needs', () => {
    assert.deepStrictEqual(C.needsOf(INDEX[5]), ['no items']);
    const block = C.resultBlock(C.checkLine(INDEX, 'Bare Draw', ctx), require('../utils/emojiMap'));
    assert.ok(!/0 items/.test(block) && /Needs: no items/.test(block), block);
});
t('a typo match reads as a close match, and the typed line shows beside the title', () => {
    const block = C.resultBlock(C.checkLine(INDEX, 'hersher of reason', ctx), require('../utils/emojiMap'));
    assert.match(block, /\*\*hersher of reason\*\* → \*\*Herrscher of Reason Draw\*\*\n-# close match/);
});
t('a word several draws share is a maybe, with the others named (Quick Add\'s own call)', () => {
    const r = C.checkLine(INDEX, 'ember', ctx);
    assert.strictEqual(r.status, 'maybe'); assert.strictEqual(r.alternates.length, 2);
    assert.match(C.resultBlock(r, require('../utils/emojiMap')), /maybe \*\*Ember .*\n-# .*\n-# Or: Ember/);
});
t('rarity and kind words alone list the draws they fit, never a guess', () => {
    const r = C.checkLine(INDEX, 'legendary weapon', ctx);
    assert.strictEqual(r.status, 'describes'); assert.ok(r.candidates.length >= 3, r.candidates.join(', '));
});
t('a name the index lacks is not indexed', () => assert.strictEqual(C.checkLine(INDEX, 'Moonlit Sorrow Draw', ctx).status, 'none'));
t('blank and repeated lines are checked once; past the limit the rest are counted', () => {
    const lines = ['lethal hollow draw', '', 'Lethal Hollow Draw', ' lethal hollow draw ', ...Array.from({ length: C.MAX_LINES + 3 }, (_, i) => `name ${i}`)];
    const out = C.checkIndex(INDEX, lines.join('\n'), ctx);
    assert.strictEqual(out.results.length, C.MAX_LINES); assert.strictEqual(out.indexSize, INDEX.length);
    assert.strictEqual(out.results.filter(r => r.line.toLowerCase() === 'lethal hollow draw').length, 2, 'case differs, so two lines'); // exact repeats collapse, a different case is a different line
    assert.strictEqual(out.extra, 2 + C.MAX_LINES + 3 - C.MAX_LINES, 'two distinct Lethal lines plus the names, less the limit');
});
t('markdown in a pasted line cannot break the panel', () => {
    const r = C.checkLine(INDEX, '**bold** `x` ~~y~~ > z', ctx);
    assert.ok(!/\*\*bold\*\*|`x`|~~y~~/.test(C.resultBlock(r, require('../utils/emojiMap'))));
});
t('the result panel: counts, one block a line, Check Again / Quick Add / Home', () => {
    const out = C.checkIndex(INDEX, ['Lethal Hollow Draw', 'herrscher of reason', 'legendary weapon', 'Moonlit Sorrow Draw'].join('\n'), ctx);
    const cs = V.checkView(out);
    const all = walk(cs);
    const head = all.find(c => c.type === 10).content;
    assert.match(head, /4 checked · 2 found · 1 too broad · 1 not indexed · .* 1 need updating · 6 draws in the index/);
    assert.deepStrictEqual(all.filter(c => c.type === 2).map(b => b.label), ['Check Again', 'Quick Add', 'Home']);
    assert.strictEqual(all.filter(c => c.type === 10).length, 5);
});
t('a full paste of long titles stays under 4,000 characters and 40 components', () => {
    const long = Array.from({ length: 30 }, (_, i) => ({ slug: `l${i}`, title: `Extraordinarily Long Title Number ${i} Of The Very Long Draw Series Collection`, imageUrl: '', priceType: 'unknown', items: Array.from({ length: 4 }, (_, j) => item(`Weapon${i}x${j} - Skin`, null)) }));
    const text = long.slice(0, 20).map(e => e.title).join('\n');
    const cs = V.checkView(C.checkIndex(long, text, ctx));
    const all = walk(cs);
    const chars = all.filter(c => c.type === 10).reduce((n, c) => n + c.content.length, 0);
    assert.ok(chars <= 4000, `${chars} characters`); assert.ok(all.length <= 40, `${all.length} components`);
    assert.ok(all.some(c => c.type === 10 && /not checked; paste them again/.test(c.content)), 'says what it left out');
});
t('an empty index warns instead of reporting every line not indexed silently', () => {
    const all = walk(V.checkView(C.checkIndex([], 'anything', ctx)));
    assert.ok(all.some(c => c.type === 10 && /draw index is empty/.test(c.content)));
});
t('the pop-up is one paragraph box', () => {
    const m = V.checkModal();
    assert.match(m.custom_id, /checkm/); assert.strictEqual(m.components[0].components[0].style, 2);
});
t('Home carries the Check Draw Index button', () => {
    const src = require('fs').readFileSync(require.resolve('../handlers/manage/drawsPanel/views'), 'utf8');
    assert.match(src, /btn\('check', 'Check Draw Index'/);
});
console.log(`\ndrawIndexCheck: ${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
