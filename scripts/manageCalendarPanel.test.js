// Tests for the rehauled /manage calendar panel (handlers/manage/calendarPanel/, 2026-11-07 21:08 EST). No database: every view and the preview take a season document built here.
//   - Every view stays inside Discord's limits (40 components, 4,000 characters, 25 options, custom ids of 100) on a season with 45 calendar rows.
//   - The paste preview says what is Added, Changed, Unchanged and Not read; Edit N with nothing changed saves nothing.
//   - Autocomplete matches every typed word against titles, newest first.
//   - The panel reaches /calendar through the public client, so a hotpatch to /calendar is not refused.
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
const oid = (i) => String(i).padStart(24, 'c');
// A season: live, ending soon, upcoming, ended, all-season and undated rows across the three types, 45 in all.
function seasonDoc() {
    const rows = [];
    const cats = ['event', 'playlist', 'draw'];
    for (let i = 0; i < 45; i++) {
        const category = cats[i % 3];
        const kind = i % 5; // 0 live, 1 ending soon, 2 upcoming, 3 ended, 4 all season
        const base = { _id: oid(i + 1), title: `Calendar Entry Number ${i + 1} With a Fairly Long Title`, category, isDoubleCP: i % 11 === 0 };
        if (kind === 0) rows.push({ ...base, date: new Date(now - 5 * DAY), endDate: new Date(now + 12 * DAY), isOngoing: false });
        else if (kind === 1) rows.push({ ...base, date: new Date(now - 9 * DAY), endDate: new Date(now + 1 * DAY), isOngoing: false });
        else if (kind === 2) rows.push({ ...base, date: new Date(now + (3 + i) * DAY), endDate: new Date(now + (15 + i) * DAY), isOngoing: false });
        else if (kind === 3) rows.push({ ...base, date: new Date(now - 30 * DAY), endDate: new Date(now - (2 + i) * DAY), isOngoing: false });
        else rows.push({ ...base, date: new Date(now - 2 * DAY), endDate: null, isOngoing: true });
    }
    rows.push({ _id: oid(900), title: 'A Row With No End Date', category: 'event', date: new Date(now - DAY), endDate: null, isOngoing: false });
    return { docType: 'global', currentSeasonTitle: 'Season 9 — Vampires vs Werewolves', bpStart: new Date(now - 40 * DAY), bpEnd: new Date(now + 40 * DAY), newDraws: [], returningDraws: [], calendar: rows, patchNotes: [] };
}

(async () => {
    console.log('manage calendar panel');
    // The panel reads /calendar off the public client's commands (views.js C()), as the running bot does.
    require('../bot/clients').clients.public = { commands: new Map([['calendar', require('../commands/calendar')]]) };
    const V = require('../handlers/manage/calendarPanel/views');
    const P = require('../handlers/manage/calendarPanel');
    const { formatCalendarAsBulkText } = require('../utils/adminParser');

    await check('every view stays inside Discord\'s limits with 46 calendar rows', async () => {
        const doc = seasonDoc();
        limits(await V.pageView(doc, 'a note', { pageRow: { type: 1, components: [{ type: 3, custom_id: 'mng_pagesel', options: [{ label: 'x', value: 'x' }] }] } }), 'home');
        for (const s of Object.keys(V.STATUS)) for (let p = 0; p < 5; p++) limits(V.listView(doc, s, p), `list ${s} ${p}`);
        const keys = V.allEntries(doc).map(e => e._key);
        for (const k of [keys[0], keys[1], keys[2], keys[3], keys[4], keys[keys.length - 1]]) { limits(V.cardView(doc, k), `card ${k}`); limits(V.cardView(doc, k, { header: 'x' }), `card header ${k}`); }
        const sel = { ids: keys, selected: keys.slice(0, 7), query: ['All Events'], unmatched: ['zzz'] };
        for (let p = 0; p < 5; p++) limits(V.selectView(doc, 'tok12345', sel, 'a note', p), `select page ${p}`);
        assert.match(JSON.stringify(V.selectView(doc, 'tok12345', sel)), /Edit 7/);
        limits(V.selectView(doc, 'tok12345', { ids: [], selected: [] }), 'select empty');
        assert.strictEqual(V.cardView(doc, 'c:doesnotexist'), null);
        for (const modal of [V.searchModal(), V.selectModal(), V.exportModal()]) assert.ok(modal.components.length <= 5);
    });

    await check('the lists sort and filter: Active Now ends soonest first, Ended latest first, the no-end row needs a look', () => {
        const doc = seasonDoc();
        const all = V.allEntries(doc);
        const live = all.filter(V.STATUS.live.test).sort((a, b) => (Number.isFinite(a.endMs) ? a.endMs : Infinity) - (Number.isFinite(b.endMs) ? b.endMs : Infinity));
        assert.ok(live.length > 4, 'too few live rows to prove an order');
        const text = JSON.stringify(V.listView(doc, 'live', 0));
        const titles = (text.match(/\*\*Calendar Entry Number \d+ With a Fairly Long Title\*\*/g) || []).map(t => t.replace(/\*/g, ''));
        assert.deepStrictEqual(titles.slice(0, 10), live.slice(0, 10).map(e => e.title));
        assert.ok(all.filter(V.STATUS.warn.test).some(e => e.title === 'A Row With No End Date'));
        assert.ok(all.filter(V.STATUS.leaving.test).length > 0, 'no row ending within 3 days');
        assert.ok(all.every(e => e._key.startsWith('c:')));
    });

    await check('the card for a draw row says the draw itself lives in /manage draws', () => {
        const doc = seasonDoc();
        const draw = V.allEntries(doc).find(e => e._cat === 'draw');
        assert.match(JSON.stringify(V.cardView(doc, draw._key)), /\/manage draws/);
        const ev = V.allEntries(doc).find(e => e._cat === 'event');
        assert.ok(!/\/manage draws/.test(JSON.stringify(V.cardView(doc, ev._key))));
    });

    await check('custom ids are mng_ca|… and refuse to pass 100 characters', () => {
        assert.strictEqual(V.ID('card', `c:${oid(1)}`), `mng_ca|card|c:${oid(1)}`);
        assert.throws(() => V.ID('x'.repeat(100)), /over 100/);
    });

    await check('Edit N with nothing changed saves nothing; an exported line pastes back unchanged', () => {
        const doc = seasonDoc();
        // A row with no end that is not All Season is the one row the paste format cannot say (it writes All Season), so it is left out of the round trip.
        doc.calendar = doc.calendar.filter(r => r.isOngoing || r.endDate);
        const text = formatCalendarAsBulkText(doc.calendar);
        const same = P.previewCalendar(doc, text);
        assert.strictEqual(same.count, 0, same.parts.join(' / '));
        assert.strictEqual(same.total, doc.calendar.length);
        assert.deepStrictEqual(same.keep, []);
    });

    await check('the preview names Added, Changed (with what), Unchanged and Not read on a crafted paste', () => {
        const doc = seasonDoc();
        doc.calendar = [
            { _id: oid(1), title: 'Throwable Frenzy MP Mode', category: 'playlist', date: new Date(Date.UTC(2026, 6, 2)), endDate: new Date(Date.UTC(2026, 7, 5)), isOngoing: false },
            { _id: oid(2), title: 'Nuketown Playlist', category: 'playlist', date: new Date(Date.UTC(2026, 6, 6)), endDate: new Date(Date.UTC(2026, 6, 19)), isOngoing: false },
        ];
        const paste = [
            'p• 7/2 - 8/5 | Throwable Frenzy MP Mode',          // unchanged
            'p• 7/6 - 7/26 | Nuketown Playlist',                 // end moved
            'e• 8/6 - 8/19 | Brand New Event',                   // added
            'this line is nothing',                              // not read
        ].join('\n');
        const pv = P.previewCalendar(doc, paste);
        assert.strictEqual(pv.added.length, 1);
        assert.strictEqual(pv.changed.length, 1);
        assert.match(pv.changed[0], /Nuketown Playlist/);
        assert.match(pv.changed[0], /end/);
        assert.deepStrictEqual(pv.same, ['Throwable Frenzy MP Mode']);
        assert.strictEqual(pv.skipped.length, 1);
        assert.strictEqual(pv.count, 2);
        // Save sends only the two lines that do something.
        assert.deepStrictEqual(pv.keep, ['p• 7/6 - 7/26 | Nuketown Playlist', 'e• 8/6 - 8/19 | Brand New Event']);
        const text = pv.parts.join('\n');
        assert.match(text, /Added · 1/); assert.match(text, /Changed · 1/); assert.match(text, /Unchanged · 1/); assert.match(text, /Not read · 1/);
    });

    await check('a changed type or 2x CP flag is a change; a same-title line is never matched to a different row', () => {
        const doc = seasonDoc();
        doc.calendar = [
            { _id: oid(1), title: 'Weekend Event', category: 'event', date: new Date(Date.UTC(2026, 6, 2)), endDate: new Date(Date.UTC(2026, 6, 5)), isOngoing: false },
            { _id: oid(2), title: 'Weekend Event Extra', category: 'event', date: new Date(Date.UTC(2026, 6, 2)), endDate: new Date(Date.UTC(2026, 6, 5)), isOngoing: false },
        ];
        const pv = P.previewCalendar(doc, 'p• 7/2 - 7/5 | Weekend Event 2x CP');
        assert.strictEqual(pv.changed.length, 1);
        assert.match(pv.changed[0], /type/);
        assert.match(pv.changed[0], /2x CP/);
        assert.match(pv.changed[0], /Weekend Event/);
        assert.ok(!/Extra/.test(pv.changed[0]));
    });

    await check('titles and quick picks select the right entries', () => {
        const doc = seasonDoc();
        assert.strictEqual(P.resolveKeys(doc, 'entry number 12 with', []).keys.length, 1);
        assert.ok(P.resolveKeys(doc, '', ['playlists']).keys.length >= 14);
        assert.deepStrictEqual(P.resolveKeys(doc, 'nothing like this', []).unmatched, ['nothing like this']);
        const both = P.resolveKeys(doc, 'entry number 1 ', ['draws']).keys;
        assert.ok(both.length > 15 && both.every(k => /^c:/.test(k)));
    });

    await check('autocomplete matches every typed word against titles, newest first, named Title · Type', async () => {
        const doc = seasonDoc();
        const model = require('../models/SeasonalData');
        const original = model.findOne;
        model.findOne = () => ({ lean: async () => doc });
        try {
            let got = null;
            await P.autocomplete({ options: { getFocused: () => 'number fairly 1' }, respond: async (x) => { got = x; } });
            assert.ok(got.length > 0 && got.length <= 25);
            assert.ok(got.every(x => /Number \d*1\d* With a Fairly/.test(x.name) || /Number 1\d? With a Fairly/.test(x.name) || /1/.test(x.name)));
            assert.ok(got.every(x => x.name.length <= 100 && /· (Event|Playlist|Draw)$/.test(x.name) && x.value.startsWith('c:')));
            const starts = got.map(x => V.allEntries(doc).find(e => e._key === x.value).startMs);
            assert.deepStrictEqual(starts, [...starts].sort((a, b) => b - a));
            await P.autocomplete({ options: { getFocused: () => 'zzzz nothing' }, respond: async (x) => { got = x; } });
            assert.deepStrictEqual(got, []);
        } finally { model.findOne = original; }
    });

    await check('the export writes start-ordered paste text that reads back', () => {
        const doc = seasonDoc();
        const keys = V.allEntries(doc).map(e => e._key);
        const text = P.exportText(doc, keys);
        assert.strictEqual(text.split('\n').length, doc.calendar.length);
        assert.match(text, /^[dpe]• \d+\/\d+ - /);
        assert.ok(P.exportText(doc, []) === '');
    });

    await check('the panel never requires /calendar itself (it reaches it through the public client, so it adds no hotpatch edge)', () => {
        const fs = require('fs'), path = require('path');
        for (const f of ['index.js', 'views.js']) {
            const src = fs.readFileSync(path.join(__dirname, '..', 'handlers/manage/calendarPanel', f), 'utf8').replace(/\/\/.*$/gm, '');
            assert.ok(!/require\(['"][./]+\/commands\/(calendar|today)['"]\)/.test(src), `${f} requires /calendar directly`);
        }
    });

    console.log(failed ? `\n${failed} check(s) FAILED.` : '\nAll manage calendar panel checks passed.');
    process.exit(failed ? 1 : 0);
})();
