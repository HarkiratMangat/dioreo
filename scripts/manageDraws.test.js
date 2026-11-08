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
    await check('Active Now lists what ends soonest first', () => {
        const doc = seasonDoc(3, 6);
        doc.calendar = V.allDraws(doc).map((d, i) => ({ _id: oid(950 + i), title: d.title, date: new Date(d.startMs), endDate: new Date(now + (20 - i * 2) * DAY), category: 'draw' }));
        const titles = JSON.stringify(V.listView(doc, 'live', 0)).match(/\*\*[^*]+\*\*/g) || [];
        const ends = V.allDraws(doc).filter(V.STATUS.live.test).sort((a, b) => a.endMs - b.endMs).map(d => `**${d.title}**`);
        assert.ok(ends.length > 2, 'too few live draws to prove an order');
        assert.deepStrictEqual(titles.slice(0, ends.length), ends.slice(0, titles.length));
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

    console.log(failed ? `\n${failed} check(s) FAILED.` : '\nAll manage draws checks passed.');
    process.exit(failed ? 1 : 0);
})();
