// scripts/loadoutPanels.test.js
//
// The panels /manage's loadout flow answers with (utils/loadoutPanels.js, Harkirat 2026-10-26 11:46 EDT). Pins what each must carry so a save is never second-guessed: the build as saved, its picture, what changed, and buttons that act on it. And that Discord accepts the shape: one container, under 40 components, button ids within 100 characters.
const assert = require('assert');
const p = require('../utils/loadoutPanels');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}
const count = (c) => 1 + [...(c.components || []), ...(c.accessory ? [c.accessory] : [])].reduce((n, x) => n + count(x), 0);
const text = (panel) => JSON.stringify(panel);
const buttons = (panel) => { const out = []; const walk = (c) => { if (c.type === 2) out.push(c); (c.components || []).forEach(walk); }; panel.forEach(walk); return out; };

const before = { _id: 'abc', weaponName: 'BAL-27', mode: 'MP', category: 'AR', buildName: 'Build 1', label: '', shareCode: '1I2C6B8A9D', imageKey: 'BAL-27-1I2C6B8A9D', attachments: ['Gauge-9 Mono', 'Crown-H3 Barrel', 'Schlager PEQ Box IV'], isMeta: true };
const after = { ...before, buildName: 'Build 2', label: 'Ranked', shareCode: '1I2C6B8A9E', imageKey: 'BAL-27-1I2C6B8A9E', attachments: ['Gauge-9 Mono', 'Crown-H3 Barrel', 'OWC Skeleton Stock'] };

check('an edit lists only what changed, the old value struck through', () => {
    const lines = p.changeLines(before, after);
    assert.ok(lines.some(l => l.startsWith('**Label:**') && l.includes('Ranked')), lines.join(' | '));
    assert.ok(lines.some(l => l === '**Build #:** ~~Build 1~~ → Build 2'));
    assert.ok(lines.some(l => l === '**Code:** ~~1I2C6B8A9D~~ → 1I2C6B8A9E'));
    assert.ok(lines.some(l => l.includes('+ OWC Skeleton Stock') && l.includes('~~Schlager PEQ Box IV~~')));
    assert.ok(!lines.some(l => l.startsWith('**Category:**')), 'an unchanged field is not listed');
    assert.deepStrictEqual(p.changeLines(before, { ...before }), []);
});

check('the saved panel shows the build, its picture, the changes and three buttons', () => {
    const panel = p.savedPanel({ doc: after, before, changeIds: ['#147', '#148'], notes: ['Swapped'], warnings: ['look'] });
    assert.strictEqual(panel.length, 1);
    assert.strictEqual(panel[0].accent_color, p.ACCENT.MP);
    const t = text(panel);
    for (const s of ['Updated · BAL-27 Build 2', 'What changed', 'OWC Skeleton Stock', 'Swapped', 'look', 'BAL-27-1I2C6B8A9E']) assert.ok(t.includes(s), s);
    assert.ok(panel[0].components[0].accessory?.media?.url.includes('BAL-27-1I2C6B8A9E'), 'the picture is beside the title');
    const ids = buttons(panel).map(b => b.custom_id);
    assert.deepStrictEqual(ids, ['mng_ldopen_abc', 'mng_ldedit_abc', 'mng_ldcredit_abc', 'mng_ldrevert|#147,#148']);
    assert.ok(count(panel[0]) < 40);
});

check('an add says Added, has no change list, and a placeholder picture gets no thumbnail', () => {
    const panel = p.savedPanel({ doc: { ...after, imageKey: 'https://placehold.co/x' }, changeIds: ['#1'] });
    const t = text(panel);
    assert.ok(t.includes('Added · BAL-27 Build 2') && !t.includes('What changed'));
    assert.strictEqual(panel[0].components[0].type, 10);
});

check('Revert is left off when there is no change id, or the ids would pass 100 characters', () => {
    assert.ok(!buttons(p.savedPanel({ doc: after })).some(b => b.custom_id.startsWith('mng_ldrevert')));
    const many = Array.from({ length: 40 }, (_, i) => `#${1000 + i}`);
    assert.ok(!buttons(p.savedPanel({ doc: after, changeIds: many })).some(b => b.custom_id.startsWith('mng_ldrevert')));
});

check('the delete panel shows the build and keeps the confirm ids the router expects', () => {
    const panel = p.deletePanel({ doc: before, token: 't1' });
    assert.ok(text(panel).includes('Delete BAL-27 Build 1?') && text(panel).includes('Schlager PEQ Box IV'));
    assert.deepStrictEqual(buttons(panel).map(b => b.custom_id), ['mng_delcancel_t1', 'mng_delconfirm_t1']);
});

check('the bulk panel leads with its counts and lists what was skipped', () => {
    const panel = p.bulkPanel({ mode: 'MP', created: 2, updated: 3, skipped: ['AK117 -- no Code: line'], missingImages: [{ label: 'X', imageKey: 'K' }] });
    const t = text(panel);
    assert.ok(t.includes('**2** added · **3** updated · **1** skipped') && t.includes('AK117') && t.includes('No picture on Cloudinary'));
    assert.strictEqual(panel[0].accent_color, p.WARN_ACCENT);
});

check('the catalogue panel keeps its two ids', () => {
    assert.deepStrictEqual(buttons(p.cataloguePanel({ described: '`X`', token: 't' })).map(b => b.custom_id), ['mng_catedit|t', 'mng_catok|t']);
});

// BAL-27, 2026-11-05: a new picture at the SAME key read "Nothing changed." and kept the old URL, so Discord kept showing the old screenshot.
check('a picture replaced at the same key is listed, and its URL changes with the save', () => {
    const lines = p.changeLines(before, { ...before }, { pictureReplaced: true });
    assert.deepStrictEqual(lines, ['**Picture:** replaced at `BAL-27-1I2C6B8A9D`']);
    const was = new Date('2026-11-03T05:35:48Z'), now = new Date('2026-11-05T14:58:21Z');
    const panel = p.savedPanel({ doc: { ...before, lastUpdated: now }, before: { ...before, lastUpdated: was }, pictureReplaced: true });
    assert.ok(!text(panel).includes('Nothing changed'), 'a replaced picture is a change');
    assert.ok(text(panel).includes(`/v${Math.floor(now / 1000)}/BAL-27-1I2C6B8A9D`), 'a build with no imageVersion uses its lastUpdated');
    const { buildImageUrl, pictureVersion } = require('../utils/loadoutRender');
    // Cloudinary's own upload version wins, so the URL changes only with a new picture; a build without one falls back to its lastUpdated.
    assert.strictEqual(pictureVersion({ imageVersion: 1793890701, lastUpdated: now }), 1793890701);
    assert.strictEqual(pictureVersion({ lastUpdated: now }), Math.floor(now / 1000));
    assert.strictEqual(pictureVersion({}), null);
    const withVersion = p.savedPanel({ doc: { ...before, imageVersion: 1793890701, lastUpdated: now }, before });
    assert.ok(text(withVersion).includes('/v1793890701/BAL-27-1I2C6B8A9D'), 'the picture URL carries Cloudinary\'s version');
    assert.ok(buildImageUrl('BAL-27-1I2C6B8A9D').endsWith('/v1/BAL-27-1I2C6B8A9D'), 'no version keeps v1');
    assert.ok(buildImageUrl('BAL-27-1I2C6B8A9D', 'x').endsWith('/v1/BAL-27-1I2C6B8A9D'), 'a bad version keeps v1');
    assert.strictEqual(buildImageUrl('https://example.com/x.png', 5), 'https://example.com/x.png');
});

if (failures) { console.error(`\n${failures} loadout panel check(s) failed.`); process.exit(1); }
console.log('\nloadoutPanels: all checks passed.');
process.exit(0);
