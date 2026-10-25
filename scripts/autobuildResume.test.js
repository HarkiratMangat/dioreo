// scripts/autobuildResume.test.js -- saved, resumable /autobuild batches and the two-admin dispute (Harkirat, 2026-10-25 13:31-14:05 EDT): a batch stored and loaded back puts its reviews and failed uploads where Save and Re-upload look; open vs finished; how two waiting builds clash; Save asking before it takes a build another admin also has waiting; Save All stopping there; one save at a time per weapon; the Add screenshots button. No Discord, no database, no Vertex. Run: `node scripts/autobuildResume.test.js` (also via `npm test`).
const assert = require('assert');
const bulk = require('../utils/autobuildBulk');
const pipe = require('../utils/autobuildPipeline');

let passed = 0, failed = 0;
const pending = [];
const t = (name, fn) => pending.push(async () => {
    try { await fn(); passed++; console.log(`  PASS  ${name}`); } catch (err) { failed++; console.log(`  FAIL  ${name}\n        ${err.message}`); }
});

const mp = (name, code, atts) => ({ weaponName: name, gunsmithCode: code, attachments: atts, attachmentSlots: atts.map(() => ''), category: 'AR', badgesRaw: '', mode: 'MP', modeSource: 'detected', sourceImageUrl: 'https://cdn.example/x.png' });
const item = (data, status = 'pending', extra = {}) => ({ url: 'https://cdn.example/x.png', token: Math.random().toString(16).slice(2), data, status, ...extra });
const FIVE = ['A', 'B', 'C', 'D', 'E'];
const count = (node) => Array.isArray(node) ? node.reduce((n, x) => n + count(x), 0) : (node && typeof node === 'object') ? 1 + count(node.components || []) + (node.accessory ? count(node.accessory) : 0) + count(node.items || []) : 0;

console.log('\n/autobuild — saved batches and the two-admin dispute\n');

t('a stored batch loads back with its reviews and failed uploads where Save and Re-upload look', () => {
    const waiting = item(mp('PKM', '1A2B3C4D5E', FIVE));
    const failedUpload = item(mp('S36', '', FIVE), 'retry', { retryToken: 'r-1' });
    pipe.pendingImageRetries.set('r-1', { weaponName: 'S36', imageKey: 'S36-1' });
    const saved = item(mp('AK117', '', FIVE), 'saved', { doc: { _id: 'abc', weaponName: 'AK117', buildName: 'Build 1', category: 'AR', mode: 'MP', extra: 'dropped' } });
    const stored = bulk.toStored({ items: [waiting, failedUpload, saved], page: 1, skipped: 0, adminId: 'admin-1', source: null, public: false });
    assert.strictEqual(stored.ownerId, 'admin-1');
    assert.deepStrictEqual(stored.items[2].doc, { _id: 'abc', weaponName: 'AK117', buildName: 'Build 1', category: 'AR', mode: 'MP' }, 'a saved build is kept as its summary only');
    assert.deepStrictEqual(stored.items[1].retryData, { weaponName: 'S36', imageKey: 'S36-1' });
    pipe.pendingAutobuilds.delete(waiting.token);
    pipe.pendingImageRetries.delete('r-1');
    const back = bulk.fromStored({ ...stored, key: 'k1' });
    assert.strictEqual(back.adminId, 'admin-1');
    assert.strictEqual(back.page, 1);
    assert.deepStrictEqual(pipe.pendingAutobuilds.get(waiting.token), waiting.data, 'the review is back for Save');
    assert.deepStrictEqual(pipe.pendingImageRetries.get('r-1'), { weaponName: 'S36', imageKey: 'S36-1' }, 'the retry is back for Re-upload');
    pipe.pendingAutobuilds.delete(waiting.token);
    pipe.pendingImageRetries.delete('r-1');
});

t('a batch is open while a build waits for Save or Discard, a failed upload included', () => {
    assert.strictEqual(bulk.isOpen({ items: [item(mp('A', '', FIVE), 'saved'), item(mp('B', '', FIVE), 'cancelled')] }), false);
    assert.strictEqual(bulk.isOpen({ items: [item(mp('A', '', FIVE), 'saved'), item(mp('B', '', FIVE))] }), true);
    assert.strictEqual(bulk.isOpen({ items: [item(mp('A', '', FIVE), 'retry')] }), true);
});

t('two waiting builds clash as the same build (code or attachments) or the same weapon, per mode', () => {
    assert.strictEqual(bulk.clashOf(mp('PKM', '1A2B', FIVE), mp('PKM', '1a2b', ['X'])), 'build', 'same code');
    assert.strictEqual(bulk.clashOf(mp('PKM', '', FIVE), mp('pkm', '', [...FIVE].reverse())), 'build', 'same attachments, any order');
    assert.strictEqual(bulk.clashOf(mp('PKM', '1A2B', FIVE), mp('PKM', '9Z8Y', ['X', 'Y'])), 'weapon');
    assert.strictEqual(bulk.clashOf(mp('PKM', '1A2B', FIVE), { ...mp('PKM', '1A2B', FIVE), mode: 'DMZ' }), null, 'MP and DMZ never clash');
    assert.strictEqual(bulk.clashOf(mp('PKM', '1A2B', FIVE), mp('S36', '1A2B', FIVE)), null);
});

t('Save on a build another admin also has waiting shows the choice instead of Save', () => {
    const it = item({ ...mp('PKM', '1A2B', FIVE), rival: { kind: 'build', name: 'Alex' }, rivalNote: 'Also waiting in Alex\'s batch' }, 'pending', { askRival: true });
    const page = bulk.renderPage({ items: [it], page: 0, skipped: 0 }, 'k', 0);
    const labels = JSON.stringify(page).match(/"label":"[^"]+"/g).join(' ');
    assert.ok(/Save mine/.test(labels) && /Leave it to them/.test(labels), labels);
    assert.ok(!/Save Build 1/.test(labels), 'the plain Save is still there');
    assert.ok(/Also waiting in Alex/.test(JSON.stringify(page)), 'the clash is not explained on the page');
});

t('Save All never saves a build another admin also has waiting: it stops there and asks', async () => {
    const saved = [];
    const batch = { items: [item(mp('AK117', '', FIVE)), item({ ...mp('PKM', '1A2B', FIVE), rival: { kind: 'build', name: 'Alex' } }), item(mp('S36', '', FIVE))] };
    const { stoppedAt, result } = await bulk.confirmAllItems(batch, async (token) => { saved.push(token); return { status: 'saved', doc: { _id: token } }; });
    assert.strictEqual(stoppedAt, 1);
    assert.strictEqual(result.status, 'rival');
    assert.strictEqual(saved.length, 1, 'only the build before it was saved');
    assert.strictEqual(batch.items[1].askRival, true);
});

t('saves of one weapon queue one at a time; different weapons do not wait for each other', async () => {
    const order = [];
    const slow = (tag, ms) => () => new Promise(r => setTimeout(() => { order.push(tag); r(tag); }, ms));
    await Promise.all([pipe.withWeaponQueue('pkm|MP', slow('first', 30)), pipe.withWeaponQueue('pkm|MP', slow('second', 1)), pipe.withWeaponQueue('s36|MP', slow('other', 1))]);
    assert.deepStrictEqual(order, ['other', 'first', 'second']);
});

t('every page carries Add screenshots and stays under the 40-component cap', () => {
    const batch = { items: Array.from({ length: 10 }, (_, i) => item(mp(`W${i}`, '', FIVE))), page: 0, skipped: 0 };
    const page = bulk.renderPage(batch, 'k', 0);
    assert.ok(/autobuild_b\|add\|k/.test(JSON.stringify(page)), 'no Add screenshots button');
    assert.ok(count(page) <= 40, `${count(page)} components`);
});

(async () => {
    for (const run of pending) await run();
    console.log(`\n  ${passed} passed, ${failed} failed\n`);
    process.exit(failed ? 1 : 0);
})();
