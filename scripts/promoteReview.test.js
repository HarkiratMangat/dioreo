// scripts/promoteReview.test.js -- what the review before Promote to Live lists (utils/promoteReview.js, 2026-11-11 21:40 EST). No database: the season document and the draw index are built here.
const assert = require('assert');
const { promoteReview, reviewLines } = require('../utils/promoteReview');
let failures = 0;
const check = (name, fn) => { try { fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.stack.split('\n').slice(0, 3).join('\n      ')}`); } };
const at = (s) => new Date(s);
const id = (() => { let n = 0; return () => String(++n).padStart(24, '0'); })();
const row = (title, start, end, extra = {}) => ({ _id: id(), title, date: at(start), endDate: end ? at(end) : null, category: 'event', isOngoing: false, isDoubleCP: false, ...extra });
const draw = (title, extra = {}) => ({ _id: id(), title, date: at('2026-11-12T00:00:00Z'), thumbnailUrl: 'x', priceType: '', items: [], ...extra });
const doc = (live = {}, draft = {}) => ({ newDraws: [], returningDraws: [], calendar: [], ...live, draft: { active: true, bpStart: at('2026-11-12T00:00:00Z'), bpEnd: at('2026-12-10T00:00:00Z'), newDraws: [], returningDraws: [], calendar: [], ...draft } });

check('lists the live draw Promote will carry over (the Solstice Draw), and not one that ends at the start', () => {
    const r = promoteReview(doc({ returningDraws: [draw('Solstice Draw')], calendar: [row('Solstice Draw', '2026-11-11T00:00:00Z', '2026-11-25T00:00:00Z', { category: 'draw' }), row('Hunger Eternal Draw', '2026-10-30T00:00:00Z', '2026-11-12T00:00:00Z', { category: 'draw' })] }));
    assert.deepStrictEqual([...new Set(r.carried.map(c => c.title))], ['Solstice Draw']);
});
check('finds the Offer/Event look-alike and the same title twice', () => {
    const r = promoteReview(doc({}, { calendar: [row('Ford Table Tactics Offer', '2026-11-13T00:00:00Z', '2026-11-20T00:00:00Z'), row('Ford Table Tactics Event', '2026-11-13T00:00:00Z', '2026-11-20T00:00:00Z'), row('Ranked Reset', '2026-11-12T00:00:00Z', '2026-12-10T00:00:00Z')] }));
    assert.deepStrictEqual(r.twins, [['Ford Table Tactics Offer', 'Ford Table Tactics Event']]);
});
check('flags a row ending a day before the Battle Pass, and a row with no end that is not All Season', () => {
    const r = promoteReview(doc({}, { calendar: [row('Super Attack of the Undead 3.0', '2026-11-12T00:00:00Z', '2026-12-09T00:00:00Z'), row('On Time', '2026-11-12T00:00:00Z', '2026-12-10T00:00:00Z'), row('Whole Season', '2026-11-12T00:00:00Z', null, { isOngoing: true }), row('Mystery Mode', '2026-11-15T00:00:00Z', null)] }));
    assert.deepStrictEqual(r.seam.map(s => [s.title, s.before]), [['Super Attack of the Undead 3.0', true]]);
    assert.deepStrictEqual(r.noEnd, ['Mystery Mode']);
});
check('flags a staged draw whose items or type differ from its draw index entry', () => {
    const catalog = [{ slug: 'world-champs-final-draw', title: 'World Champs Final Draw', priceType: 'legendaryGunReactive', items: [{ tier: 'legendary', name: 'AK - One' }], aliases: [] }];
    const r = promoteReview(doc({}, { newDraws: [draw('World Champs Final Draw', { priceType: 'sevenSpinLegendaryWeapon', items: [{ tier: 'legendary', name: 'AK - One' }, { tier: 'epic', name: 'Two' }] })] }), { catalog });
    assert.deepStrictEqual(r.index, [{ title: 'World Champs Final Draw', what: ['draw type', 'items'] }]);
});
check('a clean draft lists nothing, and no draft is no review', () => {
    assert.deepStrictEqual(reviewLines(promoteReview(doc({}, { calendar: [row('On Time', '2026-11-12T00:00:00Z', '2026-12-10T00:00:00Z')] }))), []);
    assert.strictEqual(promoteReview({ draft: { active: false } }), null);
});
check('every finding becomes one line', () => {
    const lines = reviewLines({ carried: [{ list: 'calendar', title: 'A' }], twins: [['B', 'B Event']], seam: [{ title: 'C', end: 'Dec 9', bpEnd: 'Dec 10', before: true }], noEnd: ['D'], index: [{ title: 'E', what: ['items'] }] });
    assert.strictEqual(lines.length, 5);
});
if (failures) { console.error(`\n${failures} check(s) FAILED.`); process.exit(1); }
console.log('\nAll promote review checks passed.');
