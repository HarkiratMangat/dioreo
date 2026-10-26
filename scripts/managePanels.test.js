// scripts/managePanels.test.js
//
// The panels /manage's Draws, Calendar and Patch Notes pages answer with (utils/managePanels.js, Harkirat 2026-10-26 12:52 EDT, the loadout treatment for the other pages). Pins what each carries: the item as saved, its picture, what changed, Edit again and Revert with ids the router routes. And that Discord accepts the shape: one container, under 40 components, button ids within 100 characters.
const assert = require('assert');
const p = require('../utils/managePanels');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}
const count = (c) => 1 + [...(c.components || []), ...(c.accessory ? [c.accessory] : [])].reduce((n, x) => n + count(x), 0);
const text = (panel) => JSON.stringify(panel);
const buttons = (panel) => { const out = []; const walk = (c) => { if (c.type === 2) out.push(c); (c.components || []).forEach(walk); }; panel.forEach(walk); return out; };
const shapeOk = (panel) => {
    assert.strictEqual(panel.length, 1);
    assert.strictEqual(panel[0].type, 17);
    assert.ok(count(panel[0]) <= 40, `${count(panel[0])} components`);
    for (const b of buttons(panel)) assert.ok(!b.custom_id || b.custom_id.length <= 100, b.custom_id);
};

const draw = { _id: 'd1', title: 'Wraith Hunter', date: new Date('2026-10-20T00:00:00Z'), thumbnailUrl: 'https://res.cloudinary.com/x/draw.png', priceType: '',
    items: [{ tier: 'legendary', name: 'Amp63 - Wraith' }, { tier: 'epic', name: 'Calling Card' }, { tier: 'comment', name: 'Bundle only' }] };

check('an added draw shows its picture, its items and Edit again on its own id', () => {
    const panel = p.drawPanel({ draw, category: 'new', changeIds: ['#201'] });
    shapeOk(panel);
    const head = panel[0].components[0];
    assert.strictEqual(head.type, 9, 'the picture sits beside the title');
    assert.strictEqual(head.accessory.media.url, draw.thumbnailUrl);
    assert.ok(text(panel).includes('Added · Wraith Hunter') && text(panel).includes('New draw'));
    assert.ok(text(panel).includes('Items (2)'), 'a comment line is not counted as an item');
    const ids = buttons(panel).map(b => b.custom_id);
    assert.deepStrictEqual(ids, ['mng_rsedit|draws|new|d1', 'mng_rsrevert|#201']);
});

check('a draw with no picture says so instead of a broken thumbnail', () => {
    const panel = p.drawPanel({ draw: { ...draw, thumbnailUrl: null }, category: 'returning' });
    assert.strictEqual(panel[0].components[0].type, 10);
    assert.ok(text(panel).includes('No picture') && text(panel).includes('Returning draw'));
    assert.deepStrictEqual(buttons(panel).map(b => b.label), ['Edit again'], 'no Revert without change ids');
});

check('an edited draw lists only what changed', () => {
    const after = { ...draw, title: 'Wraith Hunter II', items: [...draw.items.slice(0, 1), { tier: 'rare', name: 'Charm' }] };
    const lines = p.drawChanges(draw, after);
    assert.ok(lines.includes('**Title:** ~~Wraith Hunter~~ → Wraith Hunter II'), lines.join(' | '));
    assert.ok(lines.some(l => l.startsWith('**Items:**') && l.includes('+ Charm') && l.includes('~~Calling Card~~')));
    assert.ok(!lines.some(l => l.startsWith('**Releases:**')), 'an unchanged date is not listed');
    assert.ok(text(p.drawPanel({ draw: after, category: 'new', before: draw })).includes('What changed'));
});

check('an unchanged edit says nothing changed', () => {
    assert.ok(text(p.drawPanel({ draw, category: 'new', before: { ...draw } })).includes('Nothing changed'));
});

const event = { _id: 'e1', title: 'Halloween Event', category: 'event', date: new Date('2026-10-24T00:00:00Z'), endDate: null, isOngoing: true, isDoubleCP: true };

check('a calendar event shows its dates, All Season and Double CP', () => {
    const panel = p.calendarPanel({ event, changeIds: ['#7'] });
    shapeOk(panel);
    assert.ok(text(panel).includes('All Season') && text(panel).includes('Double CP') && text(panel).includes(`<t:${Math.floor(event.date.getTime() / 1000)}:D>`));
    assert.deepStrictEqual(buttons(panel).map(b => b.custom_id), ['mng_rsedit|calendar|e1', 'mng_rsrevert|#7']);
});

check('an edited event names the end date and Double CP that changed', () => {
    const after = { ...event, isOngoing: false, endDate: new Date('2026-11-01T00:00:00Z'), isDoubleCP: false };
    const lines = p.eventChanges(event, after);
    assert.ok(lines.some(l => l.startsWith('**Ends:** ~~All Season~~ →')), lines.join(' | '));
    assert.ok(lines.includes('**Double CP:** off'));
});

check('a patch-notes save opens its own season again', () => {
    const panel = p.patchPanel({ heading: 'New season added', title: 'Season 10', lines: ['Now the Current Season · 4 image(s)'], entryId: 'pn1', changeIds: ['#9'] });
    shapeOk(panel);
    assert.deepStrictEqual(buttons(panel).map(b => b.custom_id), ['mng_rsedit|patch|pn1', 'mng_rsrevert|#9']);
});

check('a Revert id past 100 characters is left off, never cut', () => {
    const many = Array.from({ length: 30 }, (_, i) => `#${1000 + i}`);
    const ids = buttons(p.resultPanel({ page: 'draws', heading: 'Bulk add done', changeIds: many })).map(b => b.custom_id);
    assert.deepStrictEqual(ids, []);
});

check('a bulk result keeps its sections, drops empty ones, and turns amber on a warning', () => {
    const panel = p.resultPanel({ page: 'calendar', heading: 'Bulk calendar add done', sections: [{ head: 'By type', lines: ['**Events (2):** A, B'] }, { head: 'Empty', lines: [] }], warnings: ['Double CP flag CHANGED (1)'] });
    shapeOk(panel);
    assert.ok(!text(panel).includes('Empty'));
    assert.strictEqual(panel[0].accent_color, p.WARN_ACCENT);
});

check('the delete confirmations show the item and keep the dispatcher ids', () => {
    const one = p.deleteItemPanel({ group: 'draws', match: { type: 'new', id: 'd1', label: 'Wraith Hunter', doc: draw }, token: 'tok1' });
    shapeOk(one);
    assert.strictEqual(one[0].components[0].accessory.media.url, draw.thumbnailUrl);
    assert.deepStrictEqual(buttons(one).map(b => b.custom_id), ['mng_delcancel_tok1', 'mng_delconfirm_tok1']);
    const ev = p.deleteItemPanel({ group: 'calendar', match: { id: 'e1', label: 'Halloween Event', doc: event }, token: 'tok2' });
    assert.ok(text(ev).includes('All Season'));
    const bulk = p.bulkDeletePanel({ description: 'Bulk Delete Draws', summary: ['Removed from New: A'], token: 'tok3' });
    assert.deepStrictEqual(buttons(bulk).map(b => b.custom_id), ['mng_bulkdelcancel_tok3', 'mng_bulkdelconfirm_tok3']);
});

check('every Edit again id is one handlers/manage/index.js routes', () => {
    const src = require('fs').readFileSync(require('path').join(__dirname, '../handlers/manage/index.js'), 'utf8');
    assert.ok(src.includes("'mng_rsedit|', 'mng_rsrevert|'"), 'the dispatcher routes both prefixes');
});

if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nmanagePanels: all checks passed');
