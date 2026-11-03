// The gunsmith lists page (utils/gunsmithLists.js, Harkirat 2026-11-02 21:01-21:44 EST, redesigned on his template 2026-11-03 11:44 EST) and its list scopes (utils/loadoutScopes.js `list`).
const assert = require('assert');
const L = require('../utils/gunsmithLists');
const { parseScopeToken, formatScopeToken } = require('../utils/loadoutScopes');
const { CLASS_ORDER, byClassOrder } = require('../utils/loadoutRender');

const b = (weaponName, category, extra = {}) => ({ weaponName, weaponKey: weaponName.toLowerCase().replace(/[^a-z0-9]/g, ''), category, mode: 'MP', buildName: 'Build 1', shareCode: '1A2B3C4D5E', attachments: ['a'], imageKey: 'K', ...extra });
const builds = [
    b('STATIC-HV', 'SMG', { isMeta: true, categoryRank: 'best' }),
    b('BAL-27', 'AR', { isMeta: true, categoryRank: 'best' }),
    b('ISO HEMLOCK', 'AR', { isMeta: true, categoryRank: 'top3' }),
    b('ISO HEMLOCK', 'AR', { buildName: 'Build 2', isMeta: true, categoryRank: 'top3' }),
    b('HVK-30', 'AR', { categoryRank: 'top3' }),
    b('ODEN', 'AR', { categoryRank: 'top5' }),
    b('GRAV', 'AR', { categoryRank: 'capable' }),
    b('KOSHKA', 'SNIPER', { categoryRank: 'capable' }),
    b('AK117', 'AR'), // no badge: never on the page
];
const season = { title: 'Season 9 — Test', emoji: null };
const page = L.buildListsPage(builds, { season });
const text = JSON.stringify(page.components);
const container = page.components[0];

// His template (2026-11-03 11:44 EST): the title with the season under it, the MP accent, a bold class label, the tiers with names joined by " · ", a divider between classes, the hint above the buttons.
assert.ok(/^## .* Current META Weapons\n/.test(container.components[0].components[0].content), 'the title');
assert.ok(container.components[0].components[0].content.endsWith(`\n${require('../utils/titleBlock').toBoldItalicUnicode(season.title)}`), 'the season line, bold italic');
assert.strictEqual(container.accent_color, require('../utils/loadoutPanels').ACCENT.MP, 'the MP accent');
const blocks = container.components.filter(c => c.type === 10 && c.content.startsWith('**')).map(c => c.content);
assert.strictEqual(blocks.length, 3, 'Assault, Sniper and SMG only');
assert.deepStrictEqual(blocks.map(c => c.split('\n')[0].replace(/<a?:\w+:\d+>\s?/g, '').replace(/^\*\*\s*/, '')), ['Assault**', 'Sniper**', 'SMG**'], 'the in-game class order');
const ar = blocks[0].split('\n').slice(1).map(l => l.replace(/^.*?\*\*/, '**'));
assert.deepStrictEqual(ar, ['**Best**  BAL-27', '**Top 3**  ISO HEMLOCK · HVK-30', '**Top 5**  ODEN', '**HM**  GRAV']);
assert.ok(!blocks.join('\n').includes('**META**'), 'META is on its own sub-page');
const kinds = container.components.map(c => c.type === 14 ? `sep${c.spacing}` : c.type);
assert.deepStrictEqual(kinds, [9, 'sep2', 10, 'sep1', 10, 'sep1', 10, 'sep2', 10, 1], 'title, divider, classes split by small dividers, divider, hint, buttons');
assert.strictEqual(container.components[8].content, '-# View all builds for…');
assert.ok(!text.includes('1A2B3C4D5E'), 'no codes on the page');
assert.ok(!text.includes('AK117'), 'a weapon with no badge is not on the page');
console.log('  ✓ his template: title + season, MP accent, bold class labels in the in-game order, · between names, dividers, the hint');

// The buttons open each list; the title's button opens the META sub-page; the dropdowns split by class and describe each weapon by class and badge.
for (const t of ['gsb~open~MP.*.meta', 'gsb~open~MP.*.best', 'gsb~open~MP.*.top', 'gsb~open~MP.*.hm', 'gsb~lpage~meta']) assert.ok(text.includes(t), t);
const selects = page.components.filter(c => c.type === 1 && c.components[0].type === 3).map(c => c.components[0]);
assert.deepStrictEqual(selects.map(s => s.custom_id), ['gsb~ljump~A', 'gsb~ljump~B']);
assert.deepStrictEqual(selects[0].options.map(o => o.label), ['BAL-27', 'GRAV', 'HVK-30', 'ISO HEMLOCK', 'ODEN', 'KOSHKA'], 'AR, then Sniper, in the first dropdown');
const bal = selects[0].options.find(o => o.label === 'BAL-27');
assert.strictEqual(bal.description, 'AR · META · Best in class');
assert.strictEqual(bal.value, 'MP.*.meta|bal27', 'a Meta weapon opens in the META list');
assert.strictEqual(selects[0].options.find(o => o.label === 'ODEN').value, 'MP.*.top|oden');
assert.strictEqual(selects[0].options.find(o => o.label === 'KOSHKA').description, 'Sniper · Honorable Mention');
assert.deepStrictEqual(selects[1].options.map(o => o.label), ['STATIC-HV']);
const count = comps => comps.reduce((n, c) => n + 1 + count(c.components || []) + (c.accessory ? 1 : 0), 0);
assert.ok(count(page.components) <= 40, `under 40 components (${count(page.components)})`);
console.log('  ✓ list buttons, the META weapons button, two class-split dropdowns in the in-game order, under 40 components');

// The META sub-page: META weapons only, by class, a Back button, only the META list button.
const meta = L.buildListsPage(builds, { season, page: 'meta' });
const mc = meta.components[0];
assert.ok(/^## .* META Weapons\n/.test(mc.components[0].components[0].content));
assert.ok(JSON.stringify(mc.components[0].accessory).includes('gsb~lpage~main'), 'Back');
const metaBlocks = mc.components.filter(c => c.type === 10 && c.content.startsWith('**')).map(c => c.content.split('\n').slice(1).map(l => l.replace(/^.*?\*\*/, '**')));
assert.deepStrictEqual(metaBlocks, [['**META**  BAL-27 · ISO HEMLOCK'], ['**META**  STATIC-HV']]);
assert.deepStrictEqual(mc.components.at(-1).components.map(x => x.custom_id), ['gsb~open~MP.*.meta']);
assert.ok(!JSON.stringify(meta.components).includes('KOSHKA'), 'no unbadged-for-META weapon in its dropdowns');
console.log('  ✓ the META sub-page: META weapons by class, Back, the META list button');

// The in-game class order, everywhere a class list sorts (his 2026-11-03 11:44 EST).
assert.deepStrictEqual(CLASS_ORDER, ['AR', 'SNIPER', 'LMG', 'SMG', 'SHOTGUN', 'MARKSMAN', 'SECONDARIES']);
assert.deepStrictEqual(['SMG', 'SECONDARIES', 'AR', 'MARKSMAN', 'LMG', 'SNIPER', 'SHOTGUN'].sort(byClassOrder), CLASS_ORDER);
const { buildLoadoutCard } = require('../utils/loadoutRender');
const card = JSON.stringify(buildLoadoutCard([b('AK117', 'AR')], 0, { color: 1, idPrefix: 'mp', categoryBuilds: [b('AK117', 'AR')] }).components);
const classOpts = (card.match(/"custom_id":"gsb~class~MP"[^\]]*\]/) || [''])[0].match(/"value":"([A-Z]+)"/g) || [];
if (classOpts.length) assert.deepStrictEqual(classOpts.map(v => v.slice(9, -1)), CLASS_ORDER, 'Switch class… in the in-game order');
assert.deepStrictEqual(require('../commands/autobuild').data.toJSON().options.find(o => o.name === 'category').choices.map(c => c.value), CLASS_ORDER, '/autobuild category choices');
console.log('  ✓ the in-game class order: CLASS_ORDER, Switch class…, /autobuild choices');

// List scopes: their own tokens, and the old ones unchanged.
assert.deepStrictEqual(parseScopeToken('MP.*.best'), { mode: 'MP', category: null, metaOnly: false, list: 'best' });
assert.strictEqual(formatScopeToken(parseScopeToken('MP.*.top')), 'MP.*.top');
assert.deepStrictEqual(parseScopeToken('MP.AR.std'), { mode: 'MP', category: 'AR', metaOnly: false });
assert.deepStrictEqual(parseScopeToken('MP.*.meta'), { mode: 'MP', category: null, metaOnly: true });
assert.strictEqual(L.strongestList([b('X', 'AR', { categoryRank: 'capable' })]), 'MP.*.hm');
assert.strictEqual(L.strongestList([b('X', 'AR', { categoryRank: 'top5' }), b('X', 'AR', { categoryRank: 'best' })]), 'MP.*.best');
console.log('  ✓ list scope tokens, old tokens unchanged, strongest list');

// An empty set says the lists are pending; no season leaves the line out.
const empty = L.buildListsPage([]);
assert.ok(JSON.stringify(empty.components).includes('pending an update'));
assert.ok(!empty.components[0].components[0].components[0].content.includes('\n'), 'no season line without a season');
console.log('\ngunsmithLists: all checks passed.');
