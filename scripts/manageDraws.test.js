// Tests for the rehauled /manage draws panel (handlers/manage/drawsPanel/, 2026-11-07 19:18 EST) and the two bugs found building it. No database: every view and the preview take a season document built here.
//   - Export pastes back: a Cloudinary link's `f_auto,q_auto` comma no longer splits the line (utils/adminParser.js parseBulkDrawList).
//   - Replace Multiple updates the draw with the SAME title, not the first fuzzy match (utils/bulkMerge.js upsertByTitle).
//   - Edit N with nothing changed saves nothing; a changed line, and only it, is kept.
//   - Every view stays inside Discord's limits (40 components, 4,000 characters, 25 options, custom ids of 100).
const assert = require('assert');

let failed = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failed += 1; console.log(`  ✗ ${name}\n      ${e.message}`); }
}
function walk(cs, fn) { for (const c of cs || []) { fn(c); walk(c.components, fn); if (c.accessory) fn(c.accessory); if (c.component) fn(c.component); } }
function limits(view, name) {
    let n = 0, chars = 0; const ids = [];
    walk(view, c => { n += 1; if (c.type === 10) chars += c.content.length; if (c.custom_id) ids.push(c.custom_id); if (c.type === 3) assert.ok(c.options.length <= 25 && (c.max_values || 1) <= c.options.length, `${name}: select over 25`); });
    assert.ok(n <= 40, `${name}: ${n} components`);
    assert.ok(chars <= 4000, `${name}: ${chars} characters`);
    assert.ok(ids.every(i => i.length <= 100), `${name}: an id over 100`);
    assert.strictEqual(new Set(ids).size, ids.length, `${name}: duplicate ids`);
}

const DAY = 86400000;
const now = Date.now();
const oid = (i) => String(i).padStart(24, 'a');
const LINK = (slug) => `https://res.cloudinary.com/x/image/upload/f_auto,q_auto/v1/draws/${slug}.jpg`;
function draw(i, title, startDays, extra = {}) {
    return { _id: oid(i), title, date: new Date(now + startDays * DAY), thumbnailUrl: LINK(`d${i}`), items: [{ tier: 'legendary', name: `Grav - Skin ${i}` }, { tier: 'epic', name: `Samael - Look ${i}` }], priceType: 'mythicWeapon', ...extra };
}
function seasonDoc(nNew = 3, nRet = 30) {
    const newDraws = Array.from({ length: nNew }, (_, i) => draw(i + 1, `Fresh Draw Number ${i + 1}`, -3 + i));
    const returningDraws = Array.from({ length: nRet }, (_, i) => draw(100 + i, `A Returning Draw for a Fairly Long Title ${i + 1}`, -20 + i));
    returningDraws.push(draw(500, "Street Fighter: Champion's Collection Series Armory (Weapons)", -5), draw(501, "Street Fighter: Hero's Collection Series Armory (Operators)", -5));
    const calendar = [...newDraws, ...returningDraws].slice(0, 20).map((d, i) => ({ _id: oid(900 + i), title: d.title, date: d.date, endDate: new Date(d.date.getTime() + 10 * DAY), category: 'draw' }));
    return { docType: 'global', currentSeasonTitle: 'Season 9 — Vampires vs Werewolves', bpStart: new Date(now - 40 * DAY), newDraws, returningDraws, calendar, patchNotes: [] };
}

(async () => {
    console.log('manage draws');
    const { parseBulkDrawList, formatDrawsAsBulkText } = require('../utils/adminParser');
    // The panel reads /draws off the public client's commands (views.js D()), as the running bot does.
    require('../bot/clients').clients.public = { commands: new Map([['draws', require('../commands/draws')]]) };
    const V = require('../handlers/manage/drawsPanel/views');
    const P = require('../handlers/manage/drawsPanel');

    await check('an exported draw with a Cloudinary link pastes back (the comma inside the link is not a field break)', () => {
        const d = draw(1, 'Hunger Eternal Draw', 0);
        const line = formatDrawsAsBulkText([d], () => ({ endDate: new Date(d.date.getTime() + 12 * DAY) }));
        assert.ok(line.includes('f_auto,q_auto'), 'the export has no comma in its link, so this test proves nothing');
        const [p] = parseBulkDrawList(line);
        assert.ok(p, `the line was skipped: ${line}`);
        assert.strictEqual(p.title, 'Hunger Eternal Draw');
        assert.strictEqual(p.thumbnailUrl, d.thumbnailUrl);
        assert.strictEqual(p.items.length, 2);
        assert.ok(p.endDate, 'the end date was lost');
    });
    await check('a line with no link still reads, and a comma after a link still splits', () => {
        assert.strictEqual(parseBulkDrawList('Plain Draw, l AK - Skin, July 15').length, 1);
        const [p] = parseBulkDrawList(`Link First Draw, l AK - Skin, July 15, ${LINK('x')}`);
        assert.strictEqual(p.thumbnailUrl, LINK('x'));
    });

    await check('Replace Multiple updates the draw with the same title, not the first fuzzy match', () => {
        const { upsertByTitle } = require('../utils/bulkMerge');
        const arr = [{ title: "Street Fighter: Champion's Collection Series Armory (Weapons)", tag: 'champion' }, { title: "Street Fighter: Hero's Collection Series Armory (Operators)", tag: 'hero' }];
        const r = upsertByTitle(arr, [{ title: "Street Fighter: Hero's Collection Series Armory (Operators)", tag: 'edited' }]);
        assert.deepStrictEqual(r.finalArray.map(x => x.tag), ['champion', 'edited']);
        assert.strictEqual(r.updatedCount, 1);
        assert.strictEqual(upsertByTitle(arr, [{ title: 'Brand New Draw' }]).insertedCount, 1);
    });

    await check('Edit N with nothing changed saves nothing; one changed line is the only one kept', () => {
        const doc = seasonDoc(3, 5);
        const rf = (x) => require('../utils/drawEndReminder').calendarRowFor(doc, x.title);
        const newText = formatDrawsAsBulkText(doc.newDraws, rf), retText = formatDrawsAsBulkText(doc.returningDraws, rf);
        const same = P.previewDraws(doc, newText, retText);
        assert.strictEqual(same.count, 0, same.parts.join(' / '));
        assert.strictEqual(same.total, doc.newDraws.length + doc.returningDraws.length);
        const lines = newText.split('\n');
        lines[1] = lines[1].replace('Samael - Look 2', 'Samael - New Look');
        const one = P.previewDraws(doc, lines.join('\n'), retText);
        assert.strictEqual(one.count, 1);
        assert.deepStrictEqual(one.keepNew, [lines[1]]);
        assert.deepStrictEqual(one.keepRet, []);
        assert.match(one.parts.join('\n'), /items/);
    });
    await check('a pasted line for the Hero draw is matched to Hero, not Champion', () => {
        const doc = seasonDoc(1, 1);
        const hero = doc.returningDraws.find(d => /Hero/.test(d.title));
        const line = formatDrawsAsBulkText([{ ...hero, date: new Date(hero.date.getTime() + DAY) }]);
        const pv = P.previewDraws(doc, '', line);
        assert.strictEqual(pv.changed.length, 1);
        assert.match(pv.changed[0], /Hero's Collection/);
        assert.match(pv.changed[0], /date/);
    });
    await check('a line that cannot be read is named, never dropped', () => {
        const pv = P.previewDraws(seasonDoc(1, 1), 'just some words', '');
        assert.strictEqual(pv.skipped.length, 1);
        assert.match(pv.parts.join('\n'), /Not read/);
    });

    await check('titles and quick picks select the right draws', () => {
        const doc = seasonDoc(3, 5);
        assert.strictEqual(P.resolveKeys(doc, 'fresh draw number 2', []).keys.length, 1);
        assert.strictEqual(P.resolveKeys(doc, '', ['new']).keys.length, 3);
        assert.deepStrictEqual(P.resolveKeys(doc, 'nothing like this', []).unmatched, ['nothing like this']);
        const both = P.resolveKeys(doc, 'fresh draw number 1', ['returning']).keys;
        assert.strictEqual(both.length, 1 + doc.returningDraws.length);
        assert.ok(both.every(k => /^[nr]:/.test(k)));
    });

    await check('every view stays inside Discord\'s limits with 35 draws', async () => {
        const doc = seasonDoc(3, 30);
        limits(await V.pageView(doc), 'home');
        for (const s of Object.keys(V.STATUS)) for (let p = 0; p < 4; p++) limits(V.listView(doc, s, p), `list ${s} ${p}`);
        const keys = V.allDraws(doc).map(d => d._key);
        limits(V.cardView(doc, keys[0]), 'card');
        limits(V.cardView(doc, keys[keys.length - 1], { header: 'x' }), 'card with header');
        const sel = { ids: keys, selected: keys.slice(0, 7), query: ['All Returning Draws'], unmatched: ['zzz'] };
        for (let p = 0; p < 4; p++) limits(V.selectView(doc, 'tok12345', sel, 'a note', p), `select page ${p}`);
        assert.match(JSON.stringify(V.selectView(doc, 'tok12345', sel)), /Edit 7/);
        assert.strictEqual(V.cardView(doc, 'n:doesnotexist'), null);
    });
    await check('the card walks its list with Prev / Next and links its /calendar row (2026-11-10)', () => {
        const doc = seasonDoc(2, 3);
        const ids = (v) => { const out = []; walk(v, c => c.custom_id && out.push(c.custom_id)); return out; };
        const news = V.allDraws(doc).filter(d => d._sec === 'new').map(d => d._key);
        const two = ids(V.cardView(doc, news[0], { back: 'new' }));
        assert.ok(two.includes(`mng_dr|card|${news[1]}|new|p`) && two.includes(`mng_dr|card|${news[1]}|new|x`), 'in a list of two both arrows go to the other draw, with their own ids');
        limits(V.cardView(doc, news[0], { back: 'new' }), 'card in a list of two');
        const d = V.allDraws(doc)[0];
        doc.calendar = [{ _id: oid(77), title: d.title, date: new Date(now), endDate: new Date(now + 3 * DAY), category: 'draw' }];
        assert.ok(ids(V.cardView(doc, d._key)).includes(`mng_ca|card|c:${oid(77)}`), 'Calendar Entry opens the row in /manage calendar');
        limits(V.cardView(doc, d._key), 'card with its calendar row');
    });
    await check('Active Now lists what ends soonest first', () => {
        const doc = seasonDoc(3, 6);
        doc.calendar = V.allDraws(doc).map((d, i) => ({ _id: oid(950 + i), title: d.title, date: new Date(d.startMs), endDate: new Date(now + (20 - i * 2) * DAY), category: 'draw' }));
        const titles = JSON.stringify(V.listView(doc, 'live', 0)).match(/\*\*[^*]+\*\*/g) || [];
        const ends = V.allDraws(doc).filter(V.STATUS.live.test).sort((a, b) => a.endMs - b.endMs).map(d => `**${d.title}**`);
        assert.ok(ends.length > 2, 'too few live draws to prove an order');
        assert.deepStrictEqual(titles.slice(0, ends.length), ends.slice(0, titles.length));
    });
    await check('Needs a Look lists a running draw with no picture, no items or no draw type, names the gaps, and skips an ended one', () => {
        const doc = seasonDoc(2, 3);
        doc.newDraws[0] = { ...doc.newDraws[0], thumbnailUrl: null, priceType: '' };
        doc.newDraws[1] = { ...doc.newDraws[1], items: [{ tier: 'comment', name: 'a note' }] };
        doc.returningDraws[0] = { ...doc.returningDraws[0], thumbnailUrl: null };   // ended 10 days ago: not listed
        const all = V.allDraws(doc);
        const look = all.filter(V.STATUS.look.test).map(d => d.title);
        assert.ok(look.includes(doc.newDraws[0].title) && look.includes(doc.newDraws[1].title), look.join(' | '));
        assert.ok(!look.includes(doc.returningDraws[0].title), 'an ended draw needs no look');
        const gaps = V.gapsFor(all.find(d => d.title === doc.newDraws[0].title));
        assert.ok(gaps.includes('no picture') && gaps.includes('no draw type'), gaps.join(', '));
        const list = JSON.stringify(V.listView(doc, 'look', 0));
        assert.match(list, /no picture/);
        limits(V.listView(doc, 'look', 0), 'look list');
    });

    await check('a hotpatch to /draws or /draw prices is not refused because of the draws panel', () => {
        const { planHotpatch } = require('../utils/hotpatch');
        for (const f of ['commands/draws.js', 'commands/drawprices.js']) {
            const p = planHotpatch({ files: [f] });
            assert.ok(!p.members.some(m => m.startsWith('handlers/manage/')), `${f}: the closure reaches ${p.members.filter(m => m.startsWith('handlers/manage/')).join(', ')}`);
        }
    });
    await check('custom ids are mng_dr|… and refuse to pass 100 characters', () => {
        assert.strictEqual(V.ID('card', `n:${oid(1)}`), `mng_dr|card|n:${oid(1)}`);
        assert.throws(() => V.ID('x'.repeat(100)), /over 100/);
    });
    await check('the export writes New then Returning, and drops what Include leaves out', () => {
        const doc = seasonDoc(1, 1);
        const keys = V.allDraws(doc).map(d => d._key);
        const full = P.exportText(doc, keys);
        assert.match(full, /^New Draws\n/);
        assert.match(full, /\n\nReturning Draws\n/);
        // The draw's own picture link, compared whole: a host substring check is what CodeQL flags as URL sanitisation.
        const link = doc.newDraws[0].thumbnailUrl;
        assert.ok(full.split('\n').some(l => l.endsWith(`, ${link}`)), 'the export lost the picture link');
        const bare = P.exportText(doc, keys, []);
        assert.ok(!bare.split('\n').some(l => l.endsWith(`, ${link}`)) && !/type:/.test(bare), bare);
    });

    // ---------- the 2026-11-10 11:19 EST refinement (local/project/features/manage-draws-refine/spec.md) ----------
    const ids = (v) => { const out = []; walk(v, c => c.custom_id && out.push(c.custom_id)); return out; };
    const texts = (v) => { const out = []; walk(v, c => c.type === 10 && out.push(c.content)); return out.join('\n'); };
    await check('every view stays inside the limits with 0, 1, 2 and many draws, every list at every page, search results and Needs a Look', async () => {
        for (const [nn, nr] of [[0, 0], [1, 0], [0, 1], [1, 1], [2, 0], [3, 30]]) {
            const doc = seasonDoc(nn, nr);
            if (!nn && !nr) { doc.returningDraws = []; doc.calendar = []; }
            limits(await V.pageView(doc), `home ${nn}/${nr}`);
            for (const s of Object.keys(V.STATUS)) for (let p = 0; p < 6; p++) limits(V.listView(doc, s, p, p === 1 ? { note: 'a note', noteRow: V.row(V.btn(['revert', '#1'], 'Revert')) } : {}), `list ${s} ${p} (${nn}/${nr})`);
            const keys = V.allDraws(doc).map(d => d._key);
            const sel = { ids: keys, selected: keys.slice(0, 2), query: ['grav'] };
            for (let p = 0; p < 5; p++) limits(V.searchView(doc, 'tok12345', sel, p), `search ${p}`);
            for (const k of keys.slice(0, 3)) for (const back of [null, 'live', 'look', 'ended', 't:tok12345']) limits(V.cardView(doc, k, { back, sel, header: '### Saved\n- **Title:** ~~a~~ → b', resultRow: V.row(V.btn(['revert', '#1,#2', k, back || ''], 'Revert')) }), `card ${k} ${back}`);
        }
        // An empty season: Search, Select, Export and Purge are disabled, and Needs a Look is a disabled chip, not a click into an empty list.
        const empty = seasonDoc(0, 0); empty.returningDraws = []; empty.calendar = [];
        const homeIds = []; walk(await V.pageView(empty), c => c.type === 2 && homeIds.push(c));
        for (const label of ['Search Draws', 'Select Draws', 'Export', 'Purge Draws', 'Needs a Look']) assert.ok(homeIds.find(b => b.label === label)?.disabled, `${label} should be disabled on an empty season`);
        assert.match(texts(await V.pageView(empty)), /No draws yet this season/);
    });
    await check('Needs a Look: one Section per draw with its fix (End Date when only the end is missing, else Edit), 8 a page, and a TBD end is no gap', () => {
        const doc = seasonDoc(2, 12);
        doc.calendar = doc.calendar.filter(r => r.title !== doc.newDraws[0].title && r.title !== doc.newDraws[1].title);
        doc.newDraws[0].date = new Date(now - DAY); doc.newDraws[1].date = new Date(now - DAY);
        doc.newDraws[1].thumbnailUrl = null;
        doc.calendar = doc.calendar.filter(r => r.title !== doc.returningDraws[11].title);
        doc.calendar.push({ _id: oid(990), title: doc.returningDraws[11].title, date: doc.returningDraws[11].date, endDate: null, isOngoing: false, category: 'draw' });
        const all = V.allDraws(doc);
        const tbd = all.find(d => d.title === doc.returningDraws[11].title);
        assert.ok(tbd._tbd && V.STATUS.noend.test(tbd) && !V.STATUS.look.test(tbd), 'a TBD end is listed under No End Date, not Needs a Look');
        const v = V.listView(doc, 'look', 0);
        const fix = ids(v).filter(i => /\|(end|edit)\|/.test(i));
        assert.ok(fix.includes(`mng_dr|end|${all.find(d => d.title === doc.newDraws[0].title)._key}|look|L`), fix.join(' '));
        assert.ok(fix.includes(`mng_dr|edit|${all.find(d => d.title === doc.newDraws[1].title)._key}|look|L`), fix.join(' '));
        limits(v, 'look list');
    });
    await check('the card names where it came from, carries it through every action, and shows both dates', () => {
        const doc = seasonDoc(3, 5);
        const d = V.allDraws(doc).find(x => x.bits & 8);
        const card = V.cardView(doc, d._key, { back: 'live' });
        assert.match(texts(card), /Draws {2}› {2}Active Now {2}›/);
        for (const v of ['edit', 'end', 'move', 'del']) assert.ok(ids(card).includes(`mng_dr|${v}|${d._key}|live`), v);
        assert.match(texts(card), /Started <t:\d+:f> · ends <t:\d+:f>/);
        const fromSearch = V.cardView(doc, d._key, { back: 't:tok1', sel: { ids: [d._key, V.allDraws(doc)[0]._key] } });
        assert.match(texts(fromSearch), /Search Results/);
        assert.ok(ids(fromSearch).includes('mng_dr|sres|tok1|0'));
    });
    await check('Select\'s quick picks: within a group they widen, across groups they narrow; titles add on top', () => {
        const doc = seasonDoc(3, 5);
        const all = V.allDraws(doc);
        const endedNew = all.filter(d => d._sec === 'new' && V.STATUS.ended.test(d)).map(d => d._key).sort();
        assert.deepStrictEqual(P.resolveKeys(doc, '', ['new', 'ended']).keys.sort(), endedNew);
        assert.strictEqual(P.resolveKeys(doc, '', ['new', 'returning']).keys.length, all.length);
        assert.strictEqual(P.picksLabel(['new', 'ended', 'leaving']), 'New Draws that are Ended or Leaving Soon');
    });
    await check('Search matches a word in an item, title matches first', () => {
        const doc = seasonDoc(3, 5);
        doc.newDraws[1].items[0].name = 'Kestrel - Blessed Hollow';
        const keys = P.searchKeys(doc, 'kestrel');
        assert.strictEqual(keys.length, 1);
        assert.strictEqual(V.allDraws(doc).find(d => d._key === keys[0]).title, 'Fresh Draw Number 2');
        assert.strictEqual(P.searchKeys(doc, 'fresh').length, 3);
    });
    await check('End Date: edits the row, adds one for a draw with none, says nothing changed when it already reads so, and reads season / TBD', () => {
        const doc = seasonDoc(2, 2);
        const all = V.allDraws(doc);
        const withRow = all.find(d => d._row);
        const end = new Date(now + 30 * DAY);
        const op = P.planEnd(withRow, { choice: 'date', endDate: end });
        assert.strictEqual(op.type, 'calendar.edit'); assert.strictEqual(op.payload.title, withRow._row.title); assert.strictEqual(op.payload.endDate.getTime(), end.getTime()); assert.strictEqual(op.payload.category, 'draw');
        assert.strictEqual(P.planEnd(withRow, { choice: 'date', endDate: new Date(withRow._row.endDate) }), null);
        assert.strictEqual(P.planEnd(withRow, { choice: 'season' }).payload.isOngoing, true);
        const tbd = P.planEnd(withRow, { choice: 'tbd' }).payload; assert.ok(tbd.endDate === null && tbd.isOngoing === false);
        const noRow = { ...withRow, _row: null };
        const add = P.planEnd(noRow, { choice: 'date', endDate: end });
        assert.strictEqual(add.type, 'calendar.add'); assert.strictEqual(add.payload.title, withRow.title);
        const m = V.endModal('mng_dr|endm|x', { title: 'X', row: { ...withRow._row, isOngoing: true, endDate: null } });
        assert.strictEqual(m.components[0].component.options.find(o => o.default).value, 'season');
        assert.ok(m.title.length <= 45);
    });
    await check('a pasted or edited line with no picture link keeps the stored draw\'s picture; a new draw gets none added', () => {
        const doc = seasonDoc(2, 1);
        const d = doc.newDraws[0];
        const [kept, fresh] = P.withStoredLinks(doc, [`${d.title}, l Grav - Skin 1, e Samael - Look 1, July 15`, 'Brand New Draw, l X - Y, July 15'], 'new');
        assert.ok(kept.endsWith(`, ${d.thumbnailUrl}`), kept);
        assert.ok(!/https?:/.test(fresh), fresh);
        assert.strictEqual(P.withStoredLinks(doc, [`${d.title}, l Grav - Skin 1, July 15, https://x.example/p.png`], 'new')[0].endsWith('p.png'), true);
    });
    await check('Revert carries the card it lands on, and is left off past 100 characters', () => {
        const [b] = P.revertButton(['#12', '#13'], `n:${oid(1)}`, 'live');
        assert.strictEqual(b.custom_id, `mng_dr|revert|#12,#13|n:${oid(1)}|live`);
        assert.deepStrictEqual(P.revertButton(Array.from({ length: 30 }, (_, i) => `#${1000 + i}`)), []);
        assert.strictEqual(P.revertButton(['#1'])[0].custom_id, 'mng_dr|revert|#1');
    });
    await check('an export of a draw with no picture has no link field (it exported ", null", which pasted back as the date)', () => {
        const { formatDrawsAsBulkText, parseBulkDrawList } = require('../utils/adminParser');
        const line = formatDrawsAsBulkText([{ ...draw(7, 'No Picture Draw', 1), thumbnailUrl: null }]);
        assert.ok(!/null|, $/.test(line), line);
        assert.strictEqual(parseBulkDrawList(line).length, 1);
    });
    await check('the Edit box writes a Legacy item as lg, so it saves back as Legacy (charAt(0) made it Legendary)', () => {
        const m = require('../commands/manage').buildEditDrawModal({ title: 'T', items: [{ tier: 'legacy', name: 'Old Gun - Skin' }, { tier: 'legendary', name: 'New Gun - Skin' }], date: new Date(), thumbnailUrl: '' }, 'x', 'new').toJSON();
        const items = m.components.find(c => c.component?.custom_id === 'items').component.value;
        assert.strictEqual(items, 'lg Old Gun - Skin\nl New Gun - Skin');
        const { parseItemLine } = require('../utils/adminParser');
        assert.strictEqual(parseItemLine('lg Old Gun - Skin').tier, 'legacy');
    });
    await check('every /manage guide topic fits one message with /draws\' own example drawn live (the draws guide reached 4,245 characters and Discord refused it)', () => {
        const g = require('../utils/manageGuides');
        for (const t of ['draws', 'quickadd', 'calendar', 'loadouts', 'patchnotes', 'seasondraft', 'announcements']) limits(g.buildGuideContainer(t), `guide ${t}`);
        assert.match(JSON.stringify(g.buildGuideContainer('draws')), /Releasing/, 'the example was not drawn by /draws');
    });
    await check('a placeholder picture, or one already this draw\'s own asset, is never uploaded again', async () => {
        const cloud = require('cloudinary').v2;
        const catalog = require('../utils/drawCatalog');
        const realUpload = cloud.uploader.upload, realLoad = catalog.loadCatalog;
        let uploads = 0;
        cloud.uploader.upload = async () => { uploads += 1; return { secure_url: 'https://res.cloudinary.com/x/image/upload/v1/draws/new.jpg' }; };
        catalog.loadCatalog = async () => [];
        try {
            const C = require('../utils/cloudinaryCache');
            const { PLACEHOLDER } = require('../utils/placeholders');
            const ph = await C.resolveThumbnail('Ford Draw', PLACEHOLDER.square);
            assert.strictEqual(ph.url, PLACEHOLDER.square);
            const own = 'https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1793504734/draws/ford-draw.jpg';
            const kept = await C.resolveThumbnail('Ford Draw', own);
            assert.strictEqual(kept.url, own);
            assert.strictEqual(uploads, 0, 'neither may upload');
            assert.ok(C.isOwnAsset('Ford Draw', own) && !C.isOwnAsset('Other Draw', own));
        } finally { cloud.uploader.upload = realUpload; catalog.loadCatalog = realLoad; }
    });

    console.log(failed ? `\n${failed} check(s) FAILED.` : '\nAll manage draws checks passed.');
    process.exit(failed ? 1 : 0);
})();
