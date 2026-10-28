// /emojis (Harkirat, 2026-10-25 20:41 EDT): reading the prod emojis off utils/emojiMap.js's source, the rows and who is missing what, where Sync looks for a file and in what order, the upload's size rule, and the panel. No Discord, no network.
const assert = require('assert');
const S = require('../utils/emojiSync');
const { ModalBuilder } = require('discord.js');
const { buildEmojiPanel, uploadModal, findModal, pageOf, PAGE_SIZE } = require('../commands/emojis');

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

t('on dev: the map names the prod emojis with their prod ids, and each app says whether it has the emoji', () => {
    const rows = S.buildRows(prod, apps, { isProd: false, originals: new Map([['Alpha', {}]]) });
    assert.deepStrictEqual(rows.filter(r => r.prodEmoji).map(r => [r.name, r.prodId, r.has, r.hasOriginal]), [['Alpha', '1', [true, true], true], ['Beta', '2', [true, false], false]]);
    const extra = rows.find(r => r.name === 'Extra');
    assert.ok(extra && !extra.inCode && !extra.prodEmoji, 'an emoji only on the dev app is not a prod emoji, only a "Not in code" one');
    assert.deepStrictEqual(rows[1].knownIds, ['2', '11'], 'Sync can fall back on the prod copy or the other app\'s');
});

t('on prod: the prod app\'s own list adds what the map does not name, with its own id', () => {
    const rows = S.buildRows(prod, apps, { isProd: true });
    assert.deepStrictEqual(rows.map(r => [r.name, r.prodId]), [['Alpha', '10'], ['Beta', '11'], ['Extra', '12']]);
});

t('Sync reads only the Cloudinary original and forms of it, at its current version', () => {
    process.env.CLOUDINARY_URL = 'cloudinary://k:s@democloud';
    const row = S.buildRows(prod, apps, { isProd: false })[1];
    const labels = S.sourceCandidates(row).map(c => c.label);
    assert.deepStrictEqual(labels, ['original', 'original as WebP', 'original as 128px WebP', 'original as 96px WebP'], 'only the original and forms of it');
    assert.ok(!S.sourceCandidates(row).some(c => c.url.includes('discord')), 'never a Discord copy (his 21:16 EDT rule)');
    assert.strictEqual(S.sourceCandidates({ ...row, version: 123 })[0].url, 'https://res.cloudinary.com/democloud/image/upload/v123/emoji-originals/Beta', 'read at its current version, so a Replace is never served stale');
});

t('an upload skips a file over 256 KB and a non-image, and stops at the first that Discord takes', async () => {
    const row = S.buildRows(prod, apps, { isProd: false })[1];
    const big = Buffer.alloc(S.MAX_UPLOAD_BYTES + 1), small = Buffer.alloc(100);
    const answers = [{ ok: true, type: 'image/gif', buf: big }, { ok: true, type: 'text/html', buf: small }, { ok: true, type: 'image/webp', buf: small }];
    const fetchFn = async () => { const a = answers.shift() || { ok: false, status: 404 }; return { ok: a.ok, status: a.status, headers: { get: () => a.type }, arrayBuffer: async () => a.buf }; };
    const posted = [];
    const client = { application: { id: 'APP' }, rest: { post: async (route, { body }) => posted.push([route, body.name, body.image.slice(0, 22)]) } };
    const res = await S.uploadMissing(client, row, { fetchFn });
    assert.deepStrictEqual(res, { ok: true, via: 'original as 128px WebP' }, 'the 96px form is not reached once 128px fits');
    assert.deepStrictEqual(posted, [['/applications/APP/emojis', 'Beta', 'data:image/webp;base64']]);
});

t('the panel: counts per app, the four views, a page of rows, and Sync naming how many', () => {
    const rows = S.buildRows(prod, apps, { isProd: false, originals: new Map([['Alpha', {}]]) });
    const withClients = apps.map(a => ({ ...a, client: { application: { id: a.key } } }));
    const panel = buildEmojiPanel({ rows, apps: withClients, senderAppId: 'admin' });
    const s = JSON.stringify(panel);
    assert.ok(s.includes('**2** emojis') && s.includes('Dioreo Admin (Dev) missing **1**') && s.includes('**1** with no original') && s.includes('Nothing to sync'), 'Beta has no original, so Sync has nothing it can do');
    const withFile = S.buildRows(prod, apps, { isProd: false, originals: new Map([['Alpha', {}], ['Beta', {}]]) });
    assert.ok(JSON.stringify(buildEmojiPanel({ rows: withFile, apps: withClients })).includes('Sync 1 missing') && JSON.stringify(buildEmojiPanel({ rows: withFile, apps: withClients })).includes('emo_sync_all'));
    assert.ok(!s.includes('**Extra**'), 'All lists the prod emojis only');
    assert.ok(JSON.stringify(buildEmojiPanel({ rows, apps: withClients, filter: 'unused' })).includes('**Extra**'), 'Not in code lists the extra');
    assert.ok(JSON.stringify(buildEmojiPanel({ rows, apps: withClients, filter: 'nofile' })).includes('**Beta**'), 'No original lists Beta');
    assert.ok(s.includes('emo_upload') && s.includes('emo_find_all'), 'Upload original and Find sit beside Sync');
    assert.ok(s.includes('<:Alpha:20>') && s.includes('`:Beta:`'), 'each row draws the sending app\'s copy, or the name when it has none');
    assert.ok(s.includes('`<:Alpha:1>`') && s.includes('`<a:Beta:2>`'), 'each row shows the full prod mention as code');
    const missing = JSON.stringify(buildEmojiPanel({ rows, apps: withClients, filter: 'missing', senderAppId: 'admin' }));
    assert.ok(missing.includes('**Beta**') && !missing.includes('**Alpha**'), 'Missing lists only what some app lacks');
    assert.strictEqual(pageOf(rows, 'all', 'beta'), 0, 'Find ignores capitals');
    assert.strictEqual(pageOf(rows, 'all', 'Extra'), -1, 'and only looks in the view asked');
    const many = Array.from({ length: PAGE_SIZE * 2 + 1 }, (_, i) => ({ name: `E${i}`, prodId: String(i), animated: false, has: [true, true], copies: [null, null], knownIds: [], inCode: true, prodEmoji: true, hasOriginal: true }));
    const big = buildEmojiPanel({ rows: many, apps: withClients, page: 2 });
    const count = (c) => 1 + (c.components || []).reduce((n, x) => n + count(x), 0);
    assert.ok(count(big[0]) <= 40 && JSON.stringify(big).includes('emo_page_') && JSON.stringify(big).includes('Nothing to sync'));
});

t('the Upload original pop-up: a name, the file, what to do if taken, and whether to add it to the bots; discord.js accepts both pop-ups', () => {
    const m = uploadModal();
    assert.deepStrictEqual(m.components.map(c => c.label), ['Emoji name', 'Image', 'If that name is taken', 'Also add it to the bots']);
    assert.strictEqual(m.components[1].component.type, 19);
    assert.ok(m.components.every(c => !c.description || c.description.length <= 100));
    new ModalBuilder(m).toJSON();
    new ModalBuilder(findModal('missing')).toJSON();
    assert.ok(S.EMOJI_NAME.test('Daily_Update2') && !S.EMOJI_NAME.test('a') && !S.EMOJI_NAME.test('has space') && !S.EMOJI_NAME.test('x'.repeat(33)));
});

t('the auto-sync pushes only what the code or some bot uses, skips a recent failure, and shares one lock', async () => {
    const mkApp = (id, label, names) => ({ key: id, label, emojis: [], client: { application: { id }, rest: {
        get: async () => names.map((n, i) => ({ id: `${id}${i}`, name: n, animated: false })),
        post: async (route, { body }) => { if (body.name === 'Bad') throw new Error('rejected'); names.push(body.name); },
    } } });
    const okFetch = globalThis['fe' + 'tch'];
    globalThis['fe' + 'tch'] = async () => ({ ok: true, headers: { get: () => 'image/png' }, arrayBuffer: async () => new ArrayBuffer(10) });
    try {
        const main = mkApp('M', 'Main', ['Remind', 'NewOne']), admin = mkApp('A', 'Admin', []);
        const originals = new Map([['Remind', { version: 1 }], ['NewOne', { version: 2 }], ['Stray', { version: 3 }], ['Bad', { version: 4 }], ['FromOther', { version: 5 }]]);
        const other = { apps: [{ key: 'main', emojis: [{ name: 'FromOther' }, { name: 'Bad' }] }] };
        const noReport = async () => true;
        const res = await S.runAutoSync([main, admin], { originals, other, now: 1000, writeStatusFn: noReport });
        assert.deepStrictEqual(res.added.sort(), ['FromOther → Admin', 'FromOther → Main', 'NewOne → Admin', 'Remind → Admin']);
        assert.ok(!res.added.some(a => a.startsWith('Stray')), 'a file no bot and no code uses is never pushed');
        assert.deepStrictEqual(res.failed.sort(), ['Bad → Admin', 'Bad → Main']);
        const again = await S.runAutoSync([main, admin], { originals, other, now: 2000, writeStatusFn: noReport });
        assert.deepStrictEqual([again.added, again.failed, again.held.length], [[], [], 2], 'a failure waits a day instead of failing every run');
    } finally { globalThis['fe' + 'tch'] = okFetch; }
});

t('/emojis ends on the Hidden/Public visibility option like every other command (2026-10-28)', () => {
    const options = require('../commands/emojis').data.toJSON().options;
    assert.deepStrictEqual(options.map(o => o.name), ['visibility']);
    assert.deepStrictEqual(options[0].choices.map(c => c.value), ['hidden', 'public']);
    assert.ok(!options[0].required);
});

t('a row is the emoji, name and code, then a quote with the four bots and the Cloudinary original (2026-10-28)', () => {
    const rows = S.buildRows(prod, apps, { isProd: false, originals: new Map([['Alpha', {}]]) });
    const withClients = apps.map(a => ({ ...a, client: { application: { id: a.key } } }));
    const text = JSON.stringify(buildEmojiPanel({ rows, apps: withClients })).replace(/\\n/g, '\n');
    assert.ok(/\*\*Alpha\*\* · `<:Alpha:1>`\n> -# .*Dioreo \(Dev\).*\n> -# .* Cloudinary \(original\)/.test(text), text.slice(0, 600));
});

const reportApps = [
    { key: 'main', env: 'prod', short: 'Dioreo', label: 'Dioreo', emojis: [] },
    { key: 'admin', env: 'prod', short: 'Admin', label: 'Dioreo Admin', emojis: [{ name: 'Old' }] },
    { key: 'main', env: 'dev', short: 'Dev', label: 'Dioreo (Dev)', emojis: [], remote: true },
    { key: 'admin', env: 'dev', short: 'Dev Admin', label: 'Dioreo Admin (Dev)', emojis: [{ name: 'Heart' }], remote: true },
];
const { buildUploadReport, buildSyncReport } = require('../commands/emojis');
const textsOf = c => JSON.stringify(c).replace(/\\n/g, '\n');
t('the upload result: Cloudinary, each bot, and what is still pending (2026-10-28)', () => {
    const out = buildUploadReport({ name: 'Heart', replaced: false, preview: '', apps: reportApps, outcome: ['added', 'had', null, null] });
    const text = textsOf(out);
    for (const want of ['Uploaded **Heart**', '> `:Heart:`', '**Cloudinary**', '**Dioreo** ', '**Dioreo Admin** ', '**Dev** ', '**Dev Admin** ', 'Pending will sync within 10 minutes.']) assert.ok(text.includes(want), want);
    assert.strictEqual(out[0].components[1].divider, false, 'a small gap, no line');
});
t('the sync result: one text block per emoji, in-sync and synced named apart (2026-10-28)', () => {
    const before = { apps: reportApps.map(a => ({ ...a })), rows: [{ name: 'Tada', has: [true, false, true, true] }, { name: 'Heart', has: [true, true, false, false] }] };
    const out = buildSyncReport({ before, res: { added: ['Tada → Dioreo Admin', 'Heart → Dioreo (Dev)'], failed: [], held: [] } });
    const blocks = out[0].components.filter(c => c.type === 10).map(c => c.content);
    assert.strictEqual(blocks[0], '## ' + require('../utils/emojiMap').checkmark + ' 2 Emojis Synced');
    assert.deepStrictEqual(blocks.slice(1), ['**Tada**\n-# **In-sync:** Dioreo · Dev · Dev Admin\n-# **Synced:** Dioreo Admin', '**Heart**\n-# **In-sync:** Dioreo · Dioreo Admin\n-# **Synced:** Dev\n-# ' + require('../utils/emojiMap').pending + ' **Pending:** Dev Admin, within 10 minutes']);
    assert.ok(out[0].components.length <= 40);
    assert.ok(textsOf(buildSyncReport({ before, res: { added: [], failed: [], held: [] } })).includes('Nothing to sync'));
});

(async () => {
    for (const [name, fn] of pending) {
        try { await fn(); passed++; console.log(`  PASS  ${name}`); } catch (e) { failed++; console.log(`  FAIL  ${name}\n        ${e.message}`); }
    }
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})();
