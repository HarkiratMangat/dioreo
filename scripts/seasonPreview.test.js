// scripts/seasonPreview.test.js -- the Next Season Draft's staged lists drawn by /draws and /calendar themselves (2026-11-08 12:21 EST): the draft laid over the live document, the season-start clock, no live buttons, the pager, and the 40-component cap.
const assert = require('assert');
require('../bot/clients').clients.public = { commands: new Map([['draws', require('../commands/draws')], ['calendar', require('../commands/calendar')]]) };
const V = require('../handlers/manage/seasonPanel/views');

let failed = 0;
function t(name, fn) { try { fn(); console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name}\n    ${e.stack.split('\n').slice(0, 3).join(' | ')}`); } }
const NOW = Date.UTC(2026, 10, 8, 17, 0), START = Date.UTC(2026, 10, 12);
const day = n => new Date(START + n * 86400000);
const drawsOf = (n, off) => Array.from({ length: n }, (_, i) => ({ _id: `d${off + i}`, title: `Staged Draw ${off + i}`, date: day(i - 3), thumbnailUrl: 'https://x/y.png', items: [{ tier: 'legendary', name: `Gun - Skin ${i}` }] }));
const doc = () => ({
    currentSeasonTitle: 'Season 9 — Live', newDraws: [{ _id: 'live', title: 'Live Only Draw', date: day(-20), items: [] }], returningDraws: [], calendar: [{ title: 'Live Only Event', category: 'event', date: day(-20), endDate: day(-1) }],
    draft: { active: true, currentSeasonTitle: 'Season 10 — 7th Anniversary', bpStart: new Date(START), bpEndTBD: true, newDraws: drawsOf(14, 0), returningDraws: drawsOf(3, 100), calendar: [{ title: 'Staged Event', category: 'event', date: day(0), endDate: day(10) }] },
});
const texts = c => Array.isArray(c) ? c.flatMap(texts) : [...(c.type === 10 ? [c.content] : []), ...(c.components ? texts(c.components) : []), ...(c.accessory && c.accessory.type === 2 ? ['BUTTON-ACCESSORY'] : [])];
const ids = c => JSON.stringify(c).match(/"custom_id":"[^"]+"/g) || [];

t('the staged New Draws are drawn by /draws, with the draft title and draws, never the live ones', () => {
    const out = V.botLookView(doc(), 'nd', 0, NOW);
    const all = texts(out).join('\n');
    assert.ok(all.includes('Staged Draw 0') && !all.includes('Live Only Draw'));
    assert.ok(all.includes('7th Anniversary') || all.includes('𝟕'), 'the draft season title');
    assert.ok(all.includes('Shown as players will see it on <t:'), 'as of the season start');
});
t('every button on it is this panel\'s own: no live pager, filter or bell', () => {
    for (const v of [V.botLookView(doc(), 'nd', 0, NOW), V.botLookView(doc(), 'rd', 0, NOW), V.botLookView(doc(), 'cal', 0, NOW), V.botLookView(doc(), 'cal', 2, NOW)]) {
        assert.ok(ids(v).every(x => x.includes('mng_ss|')), ids(v).filter(x => !x.includes('mng_ss|')).join(' '));
        assert.ok(!texts(v).includes('BUTTON-ACCESSORY'));
    }
});
t('a long list pages, and every page stays under 40 components', () => {
    const first = V.botLookView(doc(), 'nd', 0, NOW);
    const count = c => Array.isArray(c) ? c.reduce((n, x) => n + count(x), 0) : 1 + (c.components ? count(c.components) : 0) + (c.accessory ? 1 : 0);
    assert.ok(ids(first).some(x => x.includes('mng_ss|lv|nd|1')), 'a next page');
    for (let p = 0; p < 4; p++) assert.ok(count(V.botLookView(doc(), 'nd', p, NOW)) <= 40);
});
t('the staged calendar is drawn by /calendar from the draft rows', () => {
    const all = texts(V.botLookView(doc(), 'cal', 1, NOW)).join('\n');
    assert.ok(all.includes('Staged Event') && !all.includes('Live Only Event'));
});
t('with /draws missing from the client it falls back to the compact list', () => {
    const saved = require('../bot/clients').clients.public;
    require('../bot/clients').clients.public = { commands: new Map() };
    try { assert.ok(texts(V.botLookView(doc(), 'nd', 0, NOW)).join('\n').includes('Staged New Draws')); }
    finally { require('../bot/clients').clients.public = saved; }
});

console.log(failed ? `\n${failed} failed` : '\nseasonPreview: all checks passed');
process.exit(failed ? 1 : 0);
