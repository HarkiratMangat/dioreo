// The gunsmith lists page (utils/gunsmithLists.js, Harkirat 2026-11-02 21:01-21:44 EST) and its list scopes (utils/loadoutScopes.js `list`).
const assert = require('assert');
const L = require('../utils/gunsmithLists');
const { parseScopeToken, formatScopeToken } = require('../utils/loadoutScopes');

const b = (weaponName, category, extra = {}) => ({ weaponName, weaponKey: weaponName.toLowerCase().replace(/[^a-z0-9]/g, ''), category, mode: 'MP', buildName: 'Build 1', shareCode: '1A2B3C4D5E', attachments: ['a'], imageKey: 'K', ...extra });
const builds = [
    b('BAL-27', 'AR', { isMeta: true, categoryRank: 'best' }),
    b('ISO HEMLOCK', 'AR', { isMeta: true, categoryRank: 'top3' }),
    b('ISO HEMLOCK', 'AR', { buildName: 'Build 2', isMeta: true, categoryRank: 'top3' }),
    b('ODEN', 'AR', { categoryRank: 'top5' }),
    b('GRAV', 'AR', { categoryRank: 'capable' }),
    b('STATIC-HV', 'SMG', { isMeta: true, categoryRank: 'best' }),
    b('KOSHKA', 'SNIPER', { categoryRank: 'capable' }),
    b('AK117', 'AR'), // no badge: never on the page
];
const page = L.buildListsPage(builds);
const text = JSON.stringify(page.components);
const blocks = L.classBlocks(builds).map(c => c.content);

// One text block per class with a ### label, its lines in order, names once per line, no codes.
assert.strictEqual(blocks.length, 3, 'AR, SMG and Sniper only');
assert.ok(/^### .* AR\n/.test(blocks[0]));
const ar = blocks[0].split('\n').slice(1);
assert.deepStrictEqual(ar.map(l => l.replace(/^.*?\*\*/, '**')), ['**META** BAL-27, ISO HEMLOCK', '**Best** BAL-27', '**Top 3** ISO HEMLOCK', '**Top 5** ODEN', '**HM** GRAV']);
assert.ok(!text.includes('1A2B3C4D5E'), 'no codes on the page');
assert.ok(!text.includes('AK117'), 'a weapon with no badge is not on the page');
console.log('  ✓ one block per class, the bold label first, no codes, unbadged weapons left out');

// The buttons open each list; the dropdowns split by class and describe each weapon by class and badge.
for (const t of ['gsb~open~MP.*.meta', 'gsb~open~MP.*.best', 'gsb~open~MP.*.top', 'gsb~open~MP.*.hm']) assert.ok(text.includes(t), t);
const selects = page.components.filter(c => c.type === 1 && c.components[0].type === 3).map(c => c.components[0]);
assert.deepStrictEqual(selects.map(s => s.custom_id), ['gsb~ljump~A', 'gsb~ljump~B']);
const bal = selects[0].options.find(o => o.label === 'BAL-27');
assert.strictEqual(bal.description, 'AR · META · Best in class');
assert.strictEqual(bal.value, 'MP.*.meta|bal27', 'a Meta weapon opens in the META list');
assert.strictEqual(selects[0].options.find(o => o.label === 'ODEN').value, 'MP.*.top|oden');
assert.strictEqual(selects[1].options.find(o => o.label === 'KOSHKA').description, 'Sniper · Honorable Mention');
const count = comps => comps.reduce((n, c) => n + 1 + count(c.components || []) + (c.accessory ? 1 : 0), 0);
assert.ok(count(page.components) <= 40, `under 40 components (${count(page.components)})`);
console.log('  ✓ list buttons, two class-split dropdowns, class + badge descriptions, under 40 components');

// List scopes: their own tokens, and the old ones unchanged.
assert.deepStrictEqual(parseScopeToken('MP.*.best'), { mode: 'MP', category: null, metaOnly: false, list: 'best' });
assert.strictEqual(formatScopeToken(parseScopeToken('MP.*.top')), 'MP.*.top');
assert.deepStrictEqual(parseScopeToken('MP.AR.std'), { mode: 'MP', category: 'AR', metaOnly: false });
assert.deepStrictEqual(parseScopeToken('MP.*.meta'), { mode: 'MP', category: null, metaOnly: true });
assert.strictEqual(L.strongestList([b('X', 'AR', { categoryRank: 'capable' })]), 'MP.*.hm');
assert.strictEqual(L.strongestList([b('X', 'AR', { categoryRank: 'top5' }), b('X', 'AR', { categoryRank: 'best' })]), 'MP.*.best');
console.log('  ✓ list scope tokens, old tokens unchanged, strongest list');

// An empty set says the lists are pending.
assert.ok(JSON.stringify(L.buildListsPage([]).components).includes('pending an update'));
console.log('\ngunsmithLists: all checks passed.');
