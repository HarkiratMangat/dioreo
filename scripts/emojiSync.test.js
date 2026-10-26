// /emojis (Harkirat, 2026-10-25 20:41 EDT): reading the prod emojis off utils/emojiMap.js's source, the rows and who is missing what, where Sync looks for a file and in what order, the upload's size rule, and the panel. No Discord, no network.
const assert = require('assert');
const S = require('../utils/emojiSync');
const { buildEmojiPanel, PAGE_SIZE } = require('../commands/emojis');

let passed = 0, failed = 0;
const pending = [];
function t(name, fn) { pending.push([name, fn]); }

t('the prod emojis come from the map file: property lines only, never a mention quoted in a comment', () => {
    const fromFile = S.prodEmojisFromSource();
    assert.ok(fromFile.size > 100 && fromFile.has('Remind') && fromFile.get('Remind').animated, 'the real map: over 100, with the animated Remind');
    const m = S.prodEmojisFromSource("    // e.g. `<a:NewDraws:123>` in a label\n    remind: '<a:Remind:111>',\n    plain: '<:Plain:222>',");
    assert.deepStrictEqual([...m.entries()], [['Remind', { id: '111', animated: true }], ['Plain', { id: '222', animated: false }]]);
});

const prod = new Map([['Alpha', { id: '1', animated: false }], ['Beta', { id: '2', animated: true }]]);
const apps = [{ key: 'main', label: 'Dioreo (Dev)', emojis: [{ id: '10', name: 'Alpha', animated: false }, { id: '11', name: 'Beta', animated: true }, { id: '12', name: 'Extra', animated: false }] },
    { key: 'admin', label: 'Dioreo Admin (Dev)', emojis: [{ id: '20', name: 'Alpha', animated: false }] }];

t('on dev: the map names the rows with their prod ids, and each app says whether it has the emoji', () => {
    const rows = S.buildRows(prod, apps, { isProd: false });
    assert.deepStrictEqual(rows.map(r => [r.name, r.prodId, r.has]), [['Alpha', '1', [true, true]], ['Beta', '2', [true, false]]], 'an emoji only on the dev app is not a prod emoji');
    assert.deepStrictEqual(rows[1].knownIds, ['2', '11'], 'Sync can fall back on the prod copy or the other app\'s');
});

t('on prod: the prod app\'s own list adds what the map does not name, with its own id', () => {
    const rows = S.buildRows(prod, apps, { isProd: true });
    assert.deepStrictEqual(rows.map(r => [r.name, r.prodId]), [['Alpha', '10'], ['Beta', '11'], ['Extra', '12']]);
});

t('Sync tries the Cloudinary original first, converted forms next, then the CDN copies; never size=4096', () => {
    process.env.CLOUDINARY_URL = 'cloudinary://k:s@democloud';
    const row = S.buildRows(prod, apps, { isProd: false })[1];
    const labels = S.sourceCandidates(row).map(c => c.label);
    assert.deepStrictEqual(labels.slice(0, 3), ['original', 'original as WebP', 'original as 128px WebP']);
    assert.ok(S.sourceCandidates(row)[0].url === 'https://res.cloudinary.com/democloud/image/upload/emoji-originals/Beta');
    assert.ok(labels.slice(3).every(l => l.startsWith('CDN')) && !S.sourceCandidates(row).some(c => c.url.includes('4096')));
});

t('an upload skips a file over 256 KB and a non-image, and stops at the first that Discord takes', async () => {
    const row = S.buildRows(prod, apps, { isProd: false })[1];
    const big = Buffer.alloc(S.MAX_UPLOAD_BYTES + 1), small = Buffer.alloc(100);
    const answers = [{ ok: true, type: 'image/gif', buf: big }, { ok: true, type: 'text/html', buf: small }, { ok: true, type: 'image/webp', buf: small }];
    const fetchFn = async () => { const a = answers.shift() || { ok: false, status: 404 }; return { ok: a.ok, status: a.status, headers: { get: () => a.type }, arrayBuffer: async () => a.buf }; };
    const posted = [];
    const client = { application: { id: 'APP' }, rest: { post: async (route, { body }) => posted.push([route, body.name, body.image.slice(0, 22)]) } };
    const res = await S.uploadMissing(client, row, { fetchFn });
    assert.deepStrictEqual(res, { ok: true, via: 'original as 128px WebP' });
    assert.deepStrictEqual(posted, [['/applications/APP/emojis', 'Beta', 'data:image/webp;base64']]);
});

t('the panel: counts per app, the Missing only filter, a page of rows, and Sync naming how many', () => {
    const rows = S.buildRows(prod, apps, { isProd: false });
    const withClients = apps.map(a => ({ ...a, client: { application: { id: a.key } } }));
    const panel = buildEmojiPanel({ rows, apps: withClients, senderAppId: 'admin' });
    const s = JSON.stringify(panel);
    assert.ok(s.includes('Dioreo Admin (Dev) missing **1**') && s.includes('Sync 1 missing') && s.includes('emo_sync_all'));
    assert.ok(s.includes('<:Alpha:20>') && s.includes('`:Beta:`'), 'each row draws the sending app\'s copy, or the name when it has none');
    const missing = JSON.stringify(buildEmojiPanel({ rows, apps: withClients, filter: 'missing', senderAppId: 'admin' }));
    assert.ok(missing.includes('**Beta**') && !missing.includes('**Alpha**'), 'Missing only lists only what some app lacks');
    const many = Array.from({ length: PAGE_SIZE * 2 + 1 }, (_, i) => ({ name: `E${i}`, prodId: String(i), animated: false, has: [true, true], copies: [null, null], knownIds: [] }));
    const big = buildEmojiPanel({ rows: many, apps: withClients, page: 2 });
    const count = (c) => 1 + (c.components || []).reduce((n, x) => n + count(x), 0);
    assert.ok(count(big[0]) <= 40 && JSON.stringify(big).includes('emo_page_') && JSON.stringify(big).includes('Nothing to sync'));
});

(async () => {
    for (const [name, fn] of pending) {
        try { await fn(); passed++; console.log(`  PASS  ${name}`); } catch (e) { failed++; console.log(`  FAIL  ${name}\n        ${e.message}`); }
    }
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})();
