// scripts/addToPatchNotes.test.js
//
// The right-click "Add to Patch Notes" flow: what it reads off a message, how it merges into a season, the panel it draws and the editor boxes it opens. Messages are shaped the way discord.js hands them to a context-menu interaction (a forward's original lives in messageSnapshots; measured 2026-10-19 10:00 EDT on the dev bot).
const assert = require('assert');
const { extractSource, extraInfo, mergeImages, mergeInfo } = require('../utils/patchNoteSource');

let failed = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (err) { failed++; console.log(`  ✗ ${name}\n      ${err.message.split('\n').join('\n      ')}`); }
}

const POST = '**__Season 8 2026 Balance Changes__**\n\nNote that final patchnotes are subject to change.';
const ORIGINAL_ID = '1541759348299014144'; // tych's post, 2026-08-25 10:41:13 UTC
const att = (name, type = 'image/png') => [name, { name, url: `https://cdn.discordapp.com/attachments/1/2/${name}?ex=1`, contentType: type }];
const original = (extra = {}) => ({
    content: POST, embeds: [], createdTimestamp: Date.UTC(2026, 7, 25, 10, 41, 13, 138),
    attachments: new Map([att('s8-1.png'), att('s8-2.png'), att('clip.mp4', 'video/mp4'), att('s8-3.png'), att('s8-4.png')]), ...extra,
});
const forward = () => ({
    content: '', embeds: [], createdTimestamp: Date.UTC(2026, 9, 19, 4, 37, 17),
    attachments: new Map(), messageSnapshots: { first: () => original() },
});

check('a forward reads its snapshot: 4 images (the video left out), no title, no disclaimer, the ORIGINAL post time', () => {
    const s = extractSource(forward());
    assert.strictEqual(s.images.length, 4);
    assert.ok(s.images.every(u => u.includes('s8-')));
    assert.strictEqual(s.info, '');
    assert.strictEqual(s.postedAt.toISOString(), '2026-08-25T10:41:13.138Z');
    assert.strictEqual(s.isForward, true);
});

check('the original message reads the same as its forward', () => {
    const a = extractSource(original({ messageSnapshots: { first: () => undefined } }));
    const b = extractSource(forward());
    assert.deepStrictEqual(a.images, b.images);
    assert.strictEqual(a.postedAt.getTime(), b.postedAt.getTime());
    assert.strictEqual(a.isForward, false);
});

check('genuine extra text survives; the title line and the disclaimer do not', () => {
    const text = '**__Season 8 2026 Balance Changes__**\n\n# Kilo 141, Barrel, n: range down\nNote that final patchnotes are subject to change.\nExtra line';
    assert.strictEqual(extraInfo(text), '# Kilo 141, Barrel, n: range down\nExtra line');
    // A plain first line is kept: only a heading or bold/underlined line counts as the post's title.
    assert.strictEqual(extraInfo('Hotfix notes below\nMore'), 'Hotfix notes below\nMore');
});

check('Add puts new images after the season\'s own, Replace keeps only the new, both cap at 10 and say how many dropped', () => {
    const own = Array.from({ length: 8 }, (_, i) => `own${i}`);
    const add = mergeImages(own, ['n1', 'n2', 'n3', 'n4'], 'add');
    assert.deepStrictEqual(add.images, [...own, 'n1', 'n2']);
    assert.strictEqual(add.dropped, 2);
    const rep = mergeImages(own, ['n1', 'n2', 'n3', 'n4'], 'replace');
    assert.deepStrictEqual(rep.images, ['n1', 'n2', 'n3', 'n4']);
    assert.strictEqual(rep.dropped, 0);
});

check('the season\'s own Additional Info is never overwritten, and the message\'s text is not appended twice', () => {
    assert.strictEqual(mergeInfo('Mine', ''), 'Mine');
    assert.strictEqual(mergeInfo('Mine', 'New'), 'Mine\nNew');
    assert.strictEqual(mergeInfo('Mine\nNew', 'New'), 'Mine\nNew');
    assert.strictEqual(mergeInfo('', 'New'), 'New');
});

// ---- the editor boxes ----
const manage = require('../commands/manage');
const fieldValues = modal => Object.fromEntries(modal.toJSON().components.map(row => [row.components[0].custom_id, row.components[0].value ?? '']));

check('Add New Season box: blank with no argument (as /manage opens it), pre-filled from the right-click', () => {
    const blank = fieldValues(manage.buildPatchAddSeasonModal());
    assert.deepStrictEqual(Object.values(blank), ['', '', '', '', '']);
    const urls = Array.from({ length: 7 }, (_, i) => `https://x/${i}.png`);
    const filled = fieldValues(manage.buildPatchAddSeasonModal({ releaseDate: 'August 25, 2026 6:41 AM', description: 'Extra', images: urls }));
    assert.strictEqual(filled.season_title, '');
    assert.strictEqual(filled.release_date, 'August 25, 2026 6:41 AM');
    assert.strictEqual(filled.urls1.split('\n').length, 5);
    assert.strictEqual(filled.urls2.split('\n').length, 2);
});

check('Edit Season box keeps the season\'s own date; the post date fills it only when it is blank', () => {
    const dated = { _id: 'abc', titleOverride: '', releaseDate: new Date(Date.UTC(2026, 7, 1)), description: 'Mine', images: [] };
    const kept = fieldValues(manage.buildPatchEditSeasonModal(dated, 'America/Toronto', { releaseDateIfBlank: 'August 25, 2026 6:41 AM', images: ['https://x/1.png'] }));
    assert.strictEqual(kept.release_date, 'August 1, 2026');
    assert.strictEqual(kept.urls1, 'https://x/1.png');
    const undated = { ...dated, releaseDate: null };
    const filled = fieldValues(manage.buildPatchEditSeasonModal(undated, 'America/Toronto', { releaseDateIfBlank: 'August 25, 2026 6:41 AM' }));
    assert.strictEqual(filled.release_date, 'August 25, 2026 6:41 AM');
    // No prefill: exactly what /manage's Past Seasons edit has always opened.
    const plain = fieldValues(manage.buildPatchEditSeasonModal(dated, 'America/Toronto'));
    assert.strictEqual(plain.description, 'Mine');
    assert.strictEqual(manage.buildPatchEditSeasonModal(dated, 'America/Toronto').toJSON().title, 'Edit Past Season');
});

// ---- the panel ----
const command = require('../commands/addToPatchNotes');
const flat = (nodes, out = []) => { for (const n of nodes || []) { out.push(n); flat(n.components, out); if (n.accessory) out.push(n.accessory); } return out; };
const seasons = (n, images = 0) => ({ patchNotes: Array.from({ length: n }, (_, i) => ({ _id: `id${i}`, title: `Season ${i + 1}`, images: Array.from({ length: images }, (__, j) => `img${j}`) })) });
const source = extractSource(forward());
const KEY = '1561600000000000000';

check('panel on the current season: Add + Replace aimed at it, the newest season selected, New season offered first', () => {
    const all = flat(command.buildPanel(KEY, source, seasons(3, 2)));
    const select = all.find(c => c.type === 3);
    assert.strictEqual(select.options[0].value, 'new');
    assert.strictEqual(select.options[1].value, 'id2');
    assert.strictEqual(select.options.find(o => o.default).value, 'id2');
    const ids = all.filter(c => c.type === 2).map(b => b.custom_id);
    assert.deepStrictEqual(ids, [`ptn_add|${KEY}|id2`, `ptn_replace|${KEY}|id2`]);
    assert.ok(all.every(c => !c.custom_id || c.custom_id.length <= 100), 'a custom_id over Discord\'s 100 characters');
    assert.ok(all.length <= 40, `${all.length} components`);
});

check('a season with no images gets only Add images (Add and Replace would open the same box)', () => {
    const all = flat(command.buildPanel(KEY, source, seasons(3, 0)));
    assert.deepStrictEqual(all.filter(c => c.type === 2).map(b => b.custom_id), [`ptn_add|${KEY}|id2`]);
});

check('panel on New season: one Create button; with no seasons at all it starts there', () => {
    const picked = flat(command.buildPanel(KEY, source, seasons(3), 'new'));
    assert.deepStrictEqual(picked.filter(c => c.type === 2).map(b => b.custom_id), [`ptn_new|${KEY}`]);
    const empty = flat(command.buildPanel(KEY, source, { patchNotes: [] }));
    assert.deepStrictEqual(empty.filter(c => c.type === 2).map(b => b.custom_id), [`ptn_new|${KEY}`]);
});

check('panel warns before the click when Add would pass 10, and lists at most 24 seasons + New season', () => {
    const text = flat(command.buildPanel(KEY, source, seasons(30, 8))).filter(c => c.type === 10).map(c => c.content).join('\n');
    assert.ok(/fits only 2 of the 4/.test(text), text);
    const select = flat(command.buildPanel(KEY, source, seasons(30))).find(c => c.type === 3);
    assert.strictEqual(select.options.length, 25);
});

check('it is kept out of /admin\'s server rules and registers as a user-install message command', () => {
    const json = command.data.toJSON();
    assert.strictEqual(json.type, 3);
    assert.deepStrictEqual(json.integration_types, [1]);
    assert.ok(!command.devOnly, 'still dev-only');
    assert.ok(require('fs').readFileSync(require('path').join(__dirname, '..', 'bot', 'registry.js'), 'utf8').includes("'Add to Patch Notes'"));
});

check('on the dev bot a blocked Cloudinary upload keeps the source URL, never null (a null broke /patch notes)', () => {
    const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'utils', 'patchNotesCache.js'), 'utf8');
    const blocked = src.slice(src.indexOf("isCloudinaryWriteBlocked('upload'"), src.indexOf('try {', src.indexOf("isCloudinaryWriteBlocked('upload'")));
    assert.ok(/url:\s*sourceUrl/.test(blocked) && !/url:\s*null/.test(blocked), blocked);
});

console.log(failed ? `\n${failed} check(s) FAILED.` : '\nAll Add to Patch Notes checks passed.');
process.exit(failed ? 1 : 0);
