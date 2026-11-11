// Tests for the rehauled /manage draws panel (handlers/manage/drawsPanel/, 2026-11-07 19:18 EST) and the two bugs found building it. No database: every view and the preview take a season document built here.
//   - Export pastes back: a Cloudinary link's `f_auto,q_auto` comma no longer splits the line (utils/adminParser.js parseBulkDrawList).
//   - Replace Multiple updates the draw with the SAME title, not the first fuzzy match (utils/bulkMerge.js upsertByTitle).
//   - Edit N with nothing changed saves nothing; a changed line, and only it, is kept.
//   - Every view stays inside Discord's limits (40 components, 4,000 characters, 25 options, custom ids of 100).
const assert = require('assert');
const emojis = require('../utils/emojiMap');

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
    // The consistency rules from his round-2 review (2026-11-11 11:02 EST), held on every view this file renders: the way back is first in its row, Search never wears the gunsmith emoji, and no disabled green button stands in for a status line ("All Checked").
    const { isReturn } = require('../utils/returnFirst');
    const gunsmith = emojis.parseEmoji(emojis.gunsmithSearch).id;
    walk(view, c => {
        if (c.type === 1) assert.ok((c.components || []).length <= 5, `${name}: a row of ${(c.components || []).length}, over Discord's five`);
        if (c.type === 1) { const kinds = (c.components || []).map(isReturn); assert.ok(kinds.indexOf(false) === -1 || kinds.lastIndexOf(true) < kinds.indexOf(false), `${name}: a way back after another button in a row`); }
        if (c.emoji) assert.notStrictEqual(String(c.emoji.id), String(gunsmith), `${name}: the gunsmith search emoji`);
        if (c.type === 2 && c.disabled && c.style === 3) assert.fail(`${name}: a disabled green button used as a status (${c.label})`);
    });
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
        for (const label of ['Search Draws', 'Export']) assert.ok(homeIds.find(b => b.label === label)?.disabled, `${label} should be disabled on an empty season`);
        // Round 2 (2026-11-11 11:02 EST): no Purge on the landing, no Needs a Look button at zero, and the draft row is there.
        assert.ok(!homeIds.some(b => /Purge|All Checked/.test(b.label || '')), 'no Purge or All Checked on the landing');
        assert.ok(homeIds.some(b => /Season Draft|Review Drafted Draws/.test(b.label || '')), 'the draft row');
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
    await check('the card names where it came from, carries it through every action, and shows the date the /draws block does not', () => {
        const doc = seasonDoc(3, 5);
        const d = V.allDraws(doc).find(x => x.bits & 8);
        const card = V.cardView(doc, d._key, { back: 'live' });
        assert.match(texts(card), /Draws {2}› {2}Active Now {2}›/);
        for (const v of ['edit', 'end', 'move', 'del']) assert.ok(ids(card).includes(`mng_dr|${v}|${d._key}|live`), v);
        // A running draw: /draws' block gives the end, the card's own line gives the start, and the end stamp is not repeated.
        assert.match(texts(card), /Started <t:\d+:f>/);
        const endStamp = `<t:${Math.floor(d.endMs / 1000)}:f>`;
        assert.strictEqual(texts(card).split(endStamp).length - 1, 1, 'the end date shows once');
        // An upcoming draw: the block gives the start, the card's line gives the end. An ended draw: both, since the block shows neither.
        const up = V.allDraws(doc).find(x => x.bits & 4 && Number.isFinite(x.endMs));
        if (up) assert.match(texts(V.cardView(doc, up._key, { back: 'upcoming' })), /-# Ends <t:\d+:f>/);
        const over = V.allDraws(doc).find(x => x.bits & 32);
        if (over) assert.match(texts(V.cardView(doc, over._key, { back: 'ended' })), /-# Started <t:\d+:f> · ended <t:\d+:f>/);
        const fromSearch = V.cardView(doc, d._key, { back: 't:tok1', sel: { ids: [d._key, V.allDraws(doc)[0]._key] } });
        assert.match(texts(fromSearch), /Results/);
        assert.ok(ids(fromSearch).includes('mng_dr|sres|tok1|0'));
    });
    await check('a single draw reads "This One", and the home counts add up to the total (Leaving Soon sits in brackets inside Active)', async () => {
        const one = seasonDoc(1, 0);
        const k = V.allDraws(one)[0]._key;
        const tok = await V.searchView(one, 'tok1', { ids: [k] }, 0);
        assert.ok(JSON.stringify(tok).includes('"Select It"'), 'search results with one draw');
        assert.ok(!JSON.stringify(tok).includes('These 1'));
        const home = await V.pageView(seasonDoc(3, 5));
        const line = texts(home).split('\n').find(l => / draws · /.test(l)) || '';
        assert.doesNotMatch(line, / active · \*\*\d+ leaving soon/, line);
        const nums = [...line.replace(/\(.*?\)/g, '').matchAll(/(\d+)\*{0,2} (?:active|upcoming|ended)/g)].map(m => Number(m[1]));
        assert.strictEqual(nums.reduce((x, y) => x + y, 0), V.allDraws(seasonDoc(3, 5)).length, line);
    });
    await check('an admin without Calendar access is not offered End Date or "+ Calendar Row" (commitSet would refuse the whole save)', async () => {
        const A = require('../utils/adminAccess');
        const saved = { isOwner: A.isOwner, effectiveTiers: A.effectiveTiers };
        const tiers = (pages) => async () => new Map(pages.map(pg => [require('../core/permissions').manageScope(pg), new Set(['create', 'edit', 'delete', 'destructive'])]));
        A.isOwner = () => false;
        try {
            const doc = seasonDoc(3, 5);
            const d = V.allDraws(doc).find(x => x._row);
            assert.ok(d, 'the fixture has a draw with a /calendar row');
            const del = [{ type: 'calendar.delete', target: { elementId: String(d._row._id) } }];
            A.effectiveTiers = tiers(['draws']);
            assert.strictEqual(await P.calendarAllowed('u1', del), false);
            assert.ok(!JSON.stringify(await P.confirmCard(doc, 'del', d._key, '', 'u1')).includes('Delete + Calendar Row'));
            A.effectiveTiers = tiers(['draws', 'calendar']);
            assert.strictEqual(await P.calendarAllowed('u1', del), true);
            assert.ok(JSON.stringify(await P.confirmCard(doc, 'del', d._key, '', 'u1')).includes('Delete + Calendar Row'));
        } finally { Object.assign(A, saved); }
    });
    await check('a title the other list holds is left out of a paste, and a Move to that list is refused on the question', async () => {
        const doc = seasonDoc(3, 5);
        const d = V.allDraws(doc).find(x => x._sec === 'new');
        const line = `${d.title}, l Grav - Twin Skin, November 7, 2026`;
        const pv = P.previewDraws(doc, '', line);
        assert.strictEqual(pv.keepRet.length, 0, 'the twin line is not saved');
        assert.match(JSON.stringify(pv), /Left out/);
        doc.returningDraws.push({ ...doc.newDraws.find(x => String(x._id) === String(d._id)), _id: 'twin1' });
        const card = await P.confirmCard(doc, 'move', d._key, '', null);
        assert.ok(!JSON.stringify(card).includes('Yes, Move'), 'no Yes on a refused move');
        assert.match(JSON.stringify(card), /already has/);
    });
    await check('the Draw box: title, dates and (new draws only) a season, told apart by what they parse as; a stray line is an error that names it (round 2, 2026-11-11 11:02 EST)', () => {
        const F = require('../utils/drawForm');
        let r = F.readDrawBox('Hollow Flight Mythic Drop\nNov 8 - Nov 21\nSeason 10', { allowSeason: true });
        assert.deepStrictEqual([r.title, r.dates, r.season], ['Hollow Flight Mythic Drop', 'Nov 8 - Nov 21', 10]);
        r = F.readDrawBox('S12\nNov 8\nSapphire Winter Draw', { allowSeason: true });
        assert.deepStrictEqual([r.title, r.dates, r.season], ['Sapphire Winter Draw', 'Nov 8', 12], 'any order');
        assert.match(F.readDrawBox('Only A Title').error, /dates/);
        assert.match(F.readDrawBox('A Draw\nNov 8\nsomething else').error, /extra/);
        r = F.readDrawBox('A Draw\nNov 8\nSeason 10');
        assert.strictEqual(r.season, null, 'a returning draw ignores a season line');
        assert.ok(r.notes.length, 'and says so');
        assert.strictEqual(F.drawBoxValue({ title: 'A', dates: 'Nov 8', season: 10 }), 'A\nNov 8\nSeason 10');
    });
    await check('the Draw Index panel: home counts its gaps, lists page within the limits, an entry card shows the picture first and where its draw is, and Edit Entry is a revertable op (round 2, 2026-11-11 11:02 EST)', async () => {
        const IX = require('../handlers/manage/drawsPanel/drawIndex');
        const doc = seasonDoc(3, 5);
        const live = V.allDraws(doc)[0];
        const entry = (i, extra = {}) => ({ _id: oid(900 + i), title: `Index Draw ${i}`, aliases: [], items: [{ tier: 'legendary', name: `Gun${i} - Skin`, kind: i % 2 ? 'weapon' : undefined }], imageUrl: i % 3 ? LINK(`d${i}`) : '', priceType: i % 4 ? 'legendaryWeapon' : 'unknown', releaseSeason: 9, ...extra });
        const entries = [...Array.from({ length: 30 }, (_, i) => entry(i)), entry(99, { title: live.title, aliases: ['Old Name'], imageUrl: LINK('live') })];
        limits(IX.homeView(entries, doc), 'index home');
        limits(IX.homeView([], doc), 'index home empty');
        for (const [k, g] of Object.entries(IX.GAPS)) {
            const list = entries.filter(g.test);
            for (let p = 0; p <= Math.ceil(list.length / IX.PAGE); p++) limits(IX.listView(list, { title: g.label, origin: `g:${k}`, page: p, pagerParts: ['ixgaps', k] }), `index ${k} p${p}`);
        }
        const card = IX.cardView(entries[30], doc, 'g:all');
        limits(card, 'index card');
        assert.strictEqual(card[0].components[1].type, 12, 'the picture first');
        assert.match(JSON.stringify(card), /On \/draws/);
        assert.ok(!JSON.stringify(card).includes('Quick Add This Draw'), 'no Quick Add for a draw already on /draws');
        assert.ok(JSON.stringify(IX.cardView(entries[3], doc, 'h')).includes('Quick Add This Draw'));
        assert.ok(IX.editModal(entries[3], 'h').components.length <= 5);
        // A card opened from Check Names goes back to those results (2026-11-11 11:40 EST click test).
        const fromCheck = JSON.stringify(IX.cardView(entries[3], doc, 'c:tok123'));
        assert.match(fromCheck, /ixcres\|tok123[^"]*","label":"Check Names"|"label":"Check Names"[^}]*ixcres\|tok123/, 'the way back from a checked card is Check Names');
        assert.deepStrictEqual(IX.searchEntries(entries, 'old name').map(e => e.title), [live.title], 'another name finds it');
        assert.ok(IX.searchEntries(entries, 'gun7').some(e => e.title === 'Index Draw 7'), 'an item finds it');
        const op = require('../core/ops').resolveOp('drawindex.edit');
        assert.ok(!op.validate({ type: 'drawindex.edit', target: { id: 'x' }, payload: { releaseSeason: 'ten' } }).ok, 'a season is a number');
        const ok = op.validate({ type: 'drawindex.edit', target: { id: 'x' }, payload: { aliases: [' A ', 'A', ''] } });
        assert.deepStrictEqual(ok.normalized.payload.aliases, ['A'], 'names trimmed and de-duplicated');
        assert.deepStrictEqual(op.invert({ applied: { id: 'x', prior: { releaseSeason: 7 } } }), { type: 'drawindex.edit', target: { id: 'x' }, payload: { releaseSeason: 7 } });
    });
    await check('every draws pop-up keeps Label descriptions and placeholders inside Discord\'s 100 characters, and holds five fields or fewer (round 2: the Draw box hint was cut on the dev bot)', () => {
        const m = require('../commands/manage');
        const doc = seasonDoc(3, 5);
        const d = V.allDraws(doc)[0];
        const modals = [m.buildAddDrawModal('new'), m.buildAddDrawModal('returning'), m.buildEditDrawModal(d, String(d._id), d._sec), V.checkModal(), V.searchModal(), V.endModal('x', { title: d.title }), require('../handlers/manage/drawsPanel/drawIndex').editModal({ _id: 'e1', title: 'T', aliases: [], priceType: '' }, 'h')];
        for (const raw of modals) {
            const j = raw.toJSON ? raw.toJSON() : raw;
            assert.ok(j.components.length <= 5, `${j.title}: ${j.components.length} fields`);
            for (const c of j.components) {
                if (c.description) assert.ok(c.description.length <= 100, `${j.title} / ${c.label}: description ${c.description.length}`);
                const inner = c.component || {};
                if (inner.placeholder) assert.ok(inner.placeholder.length <= 100, `${j.title} / ${c.label}: placeholder ${inner.placeholder.length}`);
            }
        }
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

    // Two promise checks from the second think pass (2026-11-11 11:55 EST). Every verb the panel handles is reached by some button, menu or pop-up (round 2 took Purge off the landing and left its handler with no way in), and every example a draws pop-up shows parses through the reader its save uses (the Draw box hint promised a countdown the form's reader refused).
    await check('every verb the draws panel handles is reached from somewhere', () => {
        const fs = require('fs');
        const read = (f) => fs.readFileSync(require('path').join(__dirname, '..', f), 'utf8');
        const handled = read('handlers/manage/drawsPanel/index.js') + read('handlers/manage/drawsPanel/drawIndex.js');
        const emitters = ['handlers/manage/drawsPanel/views.js', 'handlers/manage/drawsPanel/index.js', 'handlers/manage/drawsPanel/drawIndex.js', 'handlers/manage/quickAdd.js'].map(read).join('\n');
        const verbs = new Set([...handled.matchAll(/verb === '(\w+)'/g)].map(m => m[1]));
        const reached = new Set([...emitters.matchAll(/(?:btn\(\s*\[?\s*|ID\(\s*|\$\{PREFIX\}|'mng_dr\|)'?(\w+)/g)].map(m => m[1]));
        const orphans = [...verbs].filter(v => !reached.has(v));
        assert.deepStrictEqual(orphans, [], `handled but never reached: ${orphans.join(', ')}`);
    });
    // The search/select redesign (2026-11-11 15:15 EST, his go): one Search, one results screen, one Select menu, and a Selected view.
    await check('one Search: lines widen, lists narrow, both blank is every draw', () => {
        const doc = seasonDoc(3, 5);
        const all = V.allDraws(doc).length;
        assert.strictEqual(P.findKeys(doc, '', []).keys.length, all, 'both blank: every draw');
        assert.strictEqual(P.findKeys(doc, 'fresh draw number 1\nfresh draw number 2', []).keys.length, 2, 'two lines widen');
        assert.strictEqual(P.findKeys(doc, 'draw', ['new']).keys.length, 3, 'a list narrows the words (it used to ADD every New draw to the matches)');
        assert.strictEqual(P.findKeys(doc, 'fresh', ['returning']).keys.length, 0, 'New words in the Returning list: nothing');
        assert.deepStrictEqual(P.findKeys(doc, 'nothing like this', []).unmatched, ['nothing like this']);
        const modal = V.drawSearchModal(doc);
        const lists = modal.components[1].component.options;
        assert.ok(lists.every(o => / · \d+$/.test(o.label)), 'each list shows its count');
    });
    await check('the Selected view: none is the results, one is its card, more is the set with the bulk actions', async () => {
        const doc = seasonDoc(3, 5);
        const keys = V.allDraws(doc).map(d => d._key);
        const none = JSON.stringify(V.selectView(doc, 'tok', { ids: keys, selected: [] }));
        assert.ok(none.includes('|pick|tok|') && none.includes('Select All'), 'no selection shows the results with the Select menu');
        const one = V.selectView(doc, 'tok', { ids: keys, selected: [keys[0]] });
        assert.ok(JSON.stringify(one).includes('|sres|tok|'), 'one selected is its card, whose way back is the results');
        const many = JSON.stringify(V.selectView(doc, 'tok', { ids: keys, selected: keys.slice(0, 3) }));
        for (const want of ['3 selected', 'Edit 3', 'End Date 3', 'Export 3', 'Delete 3', 'Select More', '|unpick|tok']) assert.ok(many.includes(want), `the set shows ${want}`);
        limits(V.selectView(doc, 'tok', { ids: keys, selected: keys }), 'selected all');
        const list = JSON.stringify(V.listView(doc, 'returning'));
        assert.ok(list.includes('|lpick|returning|') && list.includes('|lall|returning'), 'a list has the Select menu and Select All');
        assert.ok(!JSON.stringify(await V.pageView(doc)).includes('Select Draws'), 'the landing has no Select Draws button');
    });
    await check('the Ended list clears its own draws, the way Purge Ended did from the landing', () => {
        const doc = seasonDoc();
        const ended = V.listOf(doc, 'ended');
        assert.ok(ended.length > 0, 'the fixture needs an ended draw');
        const json = JSON.stringify(V.listView(doc, 'ended'));
        assert.ok(json.includes(`Delete All Ended · ${ended.length}`) && json.includes('|purge|ended'), 'Delete All Ended on the Ended list');
        assert.ok(!JSON.stringify(V.listView(doc, 'new')).includes('Delete All Ended'), 'only on the Ended list');
    });
    await check('every example a draws pop-up shows reads through its save\'s own reader', () => {
        const { readDrawBox } = require('../utils/drawForm');
        const manageCommand = require('../commands/manage');
        const { parseDrawDates } = require('../utils/drawDates');
        const { parseItemLine } = require('../utils/adminParser');
        const comps = (m) => (typeof m.toJSON === 'function' ? m.toJSON() : m).components.map(l => l.component || (l.components || [])[0]).filter(Boolean);
        for (const type of ['new', 'returning']) {
            const box = comps(manageCommand.buildAddDrawModal(type)).find(c => c.custom_id === 'draw');
            const read = readDrawBox(box.placeholder, { allowSeason: type === 'new' });
            assert.ok(!read.error && read.dates, `Add ${type}: its own placeholder does not read: ${read.error}`);
            for (const ex of box.placeholder.split('\n').slice(1, 2).concat(['13d 23h'])) assert.ok(parseDrawDates(ex).ok, `"${ex}" from the hint does not read as dates`);
            const items = comps(manageCommand.buildAddDrawModal(type)).find(c => c.custom_id === 'items');
            for (const line of items.placeholder.split('\n').filter(l => !l.startsWith('-#'))) assert.ok(parseItemLine(line).name, `item example "${line}" does not read`);
        }
    });

    console.log(failed ? `\n${failed} check(s) FAILED.` : '\nAll manage draws checks passed.');
    process.exit(failed ? 1 : 0);
})();
