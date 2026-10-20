// scripts/autobuildBulk.test.js
//
// Bulk /autobuild (2026-10-20 10:38 EDT, utils/autobuildBulk.js). No Vertex call and no database: these check the batch around the ordinary review -- the in-batch duplicate warning, where a click moves to next, the page and summary shapes against Discord's limits, the right-click picker taking several picks, and Confirm All's stop rule with a stand-in for confirmCore. Whether a real batch reads and saves is the click-test on the dev bot.
const assert = require('assert');

let failed = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); }
    catch (err) { failed++; console.log(`  ✗ ${name}\n      ${err.message.split('\n').join('\n      ')}`); }
}

const bulk = require('../utils/autobuildBulk');
const { buildPicker } = require('../commands/autobuildLoadout');
const { batchDuplicateNote, nextPendingIndex, renderPage, confirmAllItems } = bulk;

// Discord counts every component, nested ones included, against a 40-per-message cap (root CLAUDE.md's platform cheat-sheet).
function countComponents(list) {
    let n = 0;
    const walk = (c) => { if (c && typeof c.type === 'number') n++; for (const k of ['components', 'accessory']) { const v = c?.[k]; if (Array.isArray(v)) v.forEach(walk); else if (v) walk(v); } };
    list.forEach(walk);
    return n;
}
function ids(list) {
    const out = [];
    const walk = (c) => { if (c?.custom_id) out.push(c.custom_id); (c?.components || []).forEach(walk); };
    list.forEach(walk);
    return out;
}

const mp = (name, code, atts) => ({ weaponName: name, gunsmithCode: code, attachments: atts, attachmentSlots: atts.map(() => ''), category: 'AR', badgesRaw: '', mode: 'MP', modeSource: 'detected', sourceImageUrl: 'https://cdn.example/x.png' });
const item = (data, status = 'pending', extra = {}) => ({ url: 'https://cdn.example/x.png', token: Math.random().toString(16).slice(2), data, status, ...extra });
const FIVE = ['A', 'B', 'C', 'D', 'E'];

(async () => {
    console.log('Bulk /autobuild');

    await check('two screenshots of the same MP build warn on the LATER page only', () => {
        const items = [item(mp('AK117', 'X1', FIVE)), item(mp('AK117', 'X1', FIVE))];
        assert.strictEqual(batchDuplicateNote(items, 0), null);
        assert.match(batchDuplicateNote(items, 1), /Same as Build 1 in this batch/);
    });

    await check('the same attachments in another order still match; another weapon or a cancelled earlier build does not', () => {
        const items = [item(mp('AK117', '', FIVE)), item(mp('AK117', '', [...FIVE].reverse()))];
        assert.match(batchDuplicateNote(items, 1), /Build 1/);
        const other = [item(mp('M4', '', FIVE)), item(mp('AK117', '', FIVE))];
        assert.strictEqual(batchDuplicateNote(other, 1), null);
        const cancelled = [item(mp('AK117', 'X1', FIVE), 'cancelled'), item(mp('AK117', 'X1', FIVE))];
        assert.strictEqual(batchDuplicateNote(cancelled, 1), null);
    });

    await check('after a build is handled, the panel moves to the next one still to review, wrapping round', () => {
        const items = [item(null, 'saved'), item(null, 'pending'), item(null, 'cancelled'), item(null, 'pending')];
        assert.strictEqual(nextPendingIndex(items, 1), 3);
        assert.strictEqual(nextPendingIndex(items, 3), 1);
        assert.strictEqual(nextPendingIndex([item(null, 'saved')], 0), -1);
    });

    await check('a review page stays under 40 components and carries its own Confirm/Edit/Cancel plus the pager', () => {
        const items = Array.from({ length: 10 }, (_, i) => item(mp(`GUN${i}`, '', FIVE)));
        items[0].data.duplicateWarning = 'dup'; items[0].data.catalogueWarning = 'cat'; items[0].data.equipCapWarning = 'cap'; items[0].data.categoryConflict = 'SMG';
        const page = renderPage({ items, page: 0, skipped: 0 }, 'k1', 0);
        assert.ok(countComponents(page) <= 40, `page has ${countComponents(page)} components`);
        const got = ids(page);
        for (const a of ['confirm', 'edit', 'cancel']) assert.ok(got.includes(`autobuild_b|${a}|k1|0`), `missing ${a}`);
        assert.ok(got.includes('autobuild_b|all|k1|') && got.includes('autobuild_b|none|k1|'));
        assert.ok(!got.some(x => x.startsWith('autobuild_confirm_')), 'a batch page must not show the single-review Confirm');
        assert.ok(got.every(x => x.length <= 100));
    });

    await check('a saved build shows its status, and Confirm All disappears once nothing is left to review', () => {
        const doc = { weaponName: 'AK117', buildName: 'Build 3', category: 'AR', mode: 'MP', _id: 'd1' };
        const items = [item(mp('AK117', '', FIVE), 'saved', { doc }), item(mp('M4', '', FIVE), 'cancelled')];
        const page = renderPage({ items, page: 0, skipped: 0 }, 'k2', 0);
        assert.ok(JSON.stringify(page).includes('Saved:** AK117 — Build 3'));
        assert.ok(!ids(page).includes('autobuild_b|all|k2|'));
    });

    await check('a batch with nothing left to review stays on its page, with Open a saved loadout and Undo a discard', () => {
        const doc = { weaponName: 'AK117', buildName: 'Build 3', category: 'AR', mode: 'MP', _id: 'd1' };
        const items = [item(mp('AK117', '', FIVE), 'saved', { doc }), item(mp('M4', '', FIVE), 'cancelled'), item(null, 'failed', { error: 'blurry' })];
        const page = renderPage({ items, page: 1, skipped: 0 }, 'k3', 1);
        const selects = page.flatMap(c => c.components).filter(c => c.type === 1).flatMap(r => r.components).filter(c => c.type === 3);
        const open = selects.find(c => c.custom_id === 'autobuild_b|open|k3|');
        const undo = selects.find(c => c.custom_id === 'autobuild_b|undo|k3|');
        assert.deepStrictEqual(open.options.map(o => o.value), ['d1']);
        assert.deepStrictEqual(undo.options.map(o => [o.value, o.label]), [['1', '#2 M4']], 'only the discarded build, which still has its data');
        assert.ok(JSON.stringify(page).includes('Discarded:'), 'the page shown is the build you were on');
    });

    await check('Confirm All saves in order, carries on past a failed upload, and stops at a build with no category', async () => {
        const items = [item(null), item(null), item(null), item(null)];
        const seen = [];
        const results = [{ status: 'saved', doc: { _id: 1 } }, { status: 'retry', retryToken: 'r', error: 'e' }, { status: 'nocategory' }, { status: 'saved', doc: { _id: 4 } }];
        const out = await confirmAllItems({ items }, async (token) => { seen.push(token); return results[seen.length - 1]; });
        assert.strictEqual(out.stoppedAt, 2);
        assert.deepStrictEqual(seen, items.slice(0, 3).map(i => i.token), 'stopped before the 4th, in order');
        assert.deepStrictEqual(items.map(i => i.status), ['saved', 'retry', 'pending', 'pending']);
    });

    await check('Cancel on one build never reaches confirmCore (Confirm All skips handled builds)', async () => {
        const items = [item(null, 'cancelled'), item(null)];
        const seen = [];
        await confirmAllItems({ items }, async (t) => { seen.push(t); return { status: 'saved', doc: {} }; });
        assert.deepStrictEqual(seen, [items[1].token]);
    });

    await check('the right-click picker takes several picks and offers Read all', () => {
        const images = Array.from({ length: 12 }, (_, i) => `https://cdn.example/${i}.png`);
        const picker = buildPicker('key9', images);
        const select = picker[0].components.find(c => c.type === 1).components[0];
        assert.strictEqual(select.min_values, 1);
        assert.strictEqual(select.max_values, 10);
        assert.ok(ids(picker).includes('autobuild_pickall|key9'));
        assert.ok(JSON.stringify(picker).includes('Only the first 10'));
    });

    await check('the header is ONE subtext line naming each build\'s state (his 12:36 EDT: the list "looks so stupid")', () => {
        const a = mp('PKM', '1A4A', FIVE); a.duplicateWarning = 'dup';
        const b = mp('S36', '1A2A', FIVE);
        const c = mp('CRONEN SQUALL', '1C2B', FIVE); c.catalogueUnknown = { weapon: false, attachments: 2 };
        const text = bulk.overview({ items: [item(a), item(b), item(c)], skipped: 0 }, 2);
        assert.ok(!text.includes('\n'), 'one line');
        assert.match(text, /^-# Build 3 of 3 · #1 .*possible duplicate · #2 .*ready to save · #3 .*2 unknown attachments$/);
    });

    await check('the pager is the shared arrow row, and the buttons say Save / Adjust / Discard with the build number', () => {
        const items = [item(mp('A', '', FIVE)), item(mp('B', '', ['X']))];
        const page = renderPage({ items, page: 1, skipped: 0 }, 'k5', 1);
        const flat = JSON.stringify(page);
        assert.ok(flat.includes('"label":"2 / 2"'), 'indicator from utils/paginationRow.js');
        for (const l of ['Save Build 2', 'Adjust', 'Discard Build 2', 'Save All 2', 'Discard All 2']) assert.ok(flat.includes(`"label":"${l}"`), `missing ${l}`);
        assert.ok(!/"label":"(Confirm|Edit|Cancel)/.test(flat));
    });

    await check('Add more offers only the source message screenshots the batch has not read, and only from the right-click', () => {
        const held = ['u0', 'u1', 'u2', 'u3'];
        const items = [item(mp('A', '', FIVE), 'pending', { sourceIndex: 0 }), item(mp('B', '', ['X']), 'pending', { sourceIndex: 2 })];
        assert.deepStrictEqual(bulk.unreadImages({ items, source: { key: 'h' } }, held), [1, 3]);
        assert.deepStrictEqual(bulk.unreadImages({ items, source: null }, held), [], 'a /autobuild batch has no source message');
        const select = renderPage({ items, page: 0, skipped: 0, source: { key: 'h' } }, 'k6', 0, held).flatMap(c => c.components).filter(c => c.type === 1).flatMap(r => r.components).find(c => c.type === 3);
        assert.deepStrictEqual(select.options.map(o => o.value), ['1', '3']);
        assert.strictEqual(select.custom_id, 'autobuild_b|more|k6|');
    });

    await check('a worst-case page stays under Discord\'s 4000-character text cap and 40 components (measured 3098 / 32 on 2026-10-20 12:40 EDT, with every warning, every flag and all three menus)', () => {
        const nine = Array.from({ length: 9 }, (_, i) => `Monolithic Suppressor Extended Name ${i}`);
        const worst = (n) => Object.assign(mp(`COMPAGNIE WEAPON ${n}`, '1A2A3A5D8A', nine), {
            category: null, mode: null, badgesRaw: 'meta,best,toxic',
            duplicateWarning: '⚠️ **Possible duplicate:** this looks like **AK117 — Build 2**, already in the database (matching Gunsmith code + 5/5 attachments) _(+2 more)_. Only save it if it is genuinely a new build.',
            equipCapWarning: '⚠️ **9 attachments on an MP build:** MP equips at most 5, so one is probably misread -- or this is a DMZ screenshot. Use **Adjust** to fix the list or the mode.',
            catalogueWarning: `⚠️ **Not in the catalogue yet:** ${nine.join(', ')}\n-# A typo, or a new item? **Save Build** saves it and adds these names; **Adjust** lets you fix them first.`,
        });
        const items = Array.from({ length: 10 }, (_, i) => item(worst(i), 'pending', { sourceIndex: i }));
        items[0].status = 'saved'; items[0].doc = { weaponName: 'COMPAGNIE WEAPON 0', buildName: 'Build 12', category: 'AR', mode: 'MP', _id: 'x' };
        items[1].status = 'cancelled';
        items.length = 9; // room left for Add more
        const page = renderPage({ items, page: 8, skipped: 3, source: { key: 'h' } }, 'k7', 8, Array.from({ length: 12 }, () => 'u'));
        let chars = 0;
        const walk = (c) => { if (c.type === 10) chars += c.content.length; (c.components || []).forEach(walk); };
        page.forEach(walk);
        assert.ok(chars < 4000, `${chars} text characters`);
        assert.ok(countComponents(page) <= 40, `${countComponents(page)} components`);
    });

    await check('no Unicode status glyph (⚠️ ❌ ✅) reaches any batch page, whichever state it is in -- the class, not one string', () => {
        const doc = { weaponName: 'AK117', buildName: 'Build 3', category: 'AR', mode: 'MP', _id: 'd1' };
        const warned = mp('PKM', '1A', FIVE); warned.duplicateWarning = '⚠️ dup'; warned.catalogueWarning = '⚠️ cat'; warned.category = null;
        const items = [item(warned), item(mp('M4', '', FIVE), 'saved', { doc }), item(mp('X', '', FIVE), 'cancelled'), item(null, 'failed', { error: 'blurry' }), item(null, 'retry', { retryToken: 'r', error: 'e' })];
        for (let i = 0; i < items.length; i++) {
            const page = bulk.withGlyphs(renderPage({ items, page: i, skipped: 0 }, 'kg', i));
            const text = JSON.stringify(page);
            assert.ok(!/⚠|❌|✅/.test(text), `page ${i + 1} still carries a Unicode status glyph`);
        }
    });

    await check('every batch button that acts carries one of the bot\'s own icons', () => {
        const page = renderPage({ items: [item(mp('A', '', FIVE)), item(mp('B', '', ['X']))], page: 0, skipped: 0 }, 'ki', 0);
        const buttons = page.flatMap(c => c.components).filter(c => c.type === 1).flatMap(r => r.components).filter(c => c.type === 2 && !/\|(page|ind)\|/.test(c.custom_id));
        for (const b of buttons) assert.ok(b.emoji && b.emoji.id, `${b.label} has no icon`);
    });

    if (failed) { console.log(`\n${failed} bulk /autobuild check(s) failed.`); process.exit(1); }
    console.log('\nAll bulk /autobuild checks passed.');
    process.exit(0);
})();
