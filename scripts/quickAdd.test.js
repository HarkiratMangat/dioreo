// scripts/quickAdd.test.js -- /manage draws' Quick Add, the pure half (utils/quickAdd.js): reading a line's name and dates, finding the draw in the draw index, and the draft draw that comes out. The catalog is a list handed in, shaped like the prod documents, so no database is needed. The phrases are Harkirat's own examples from the ask (2026-11-01).
const assert = require('assert');
const qa = require('../utils/quickAdd');
const { parseItemLine } = require('../utils/adminParser');
const { isSameDrawTitle } = require('../utils/search');

// 11:00 Toronto on Sunday 1 Nov 2026, the day daylight time ends (EST, UTC-5, from 02:00).
const NOW = new Date('2026-11-01T16:00:00Z');
const ZONE = 'America/Toronto';
const opts = { zone: ZONE, now: NOW };
const iso = d => d && new Date(d).toISOString();

const item = (tier, name, kind = 'weapon') => { const [baseName, skinName = ''] = name.split(' - '); return { tier, kind, name, baseName, skinName }; };
const entry = (slug, title, items, extra = {}) => ({ slug, title, imageUrl: `https://img/${slug}.jpg`, priceType: '', items, aliases: [], comments: [], groupSlug: slug, ...extra });
const SF = [item('legendary', 'MG42 - Gouki'), item('legendary', 'USS 9 - Chun-Li')];
const ENTRIES = [
    entry('hollow-flight-mythic-drop', 'Hollow Flight Mythic Drop', [item('mythic', 'CX-9 - Lethal Hollow'), item('epic', 'Kestrel - Blessed Hollow', 'character')], { priceType: 'mythicDrop' }),
    entry('flatline-draw', 'Flatline Draw', [item('legendary', 'CX-9 - Vital Circuit'), item('epic', 'Scylla - Heartbreaker', 'character')]),
    entry('herrscher-s-armory', "Herrscher's Armory", [item('mythic', 'Static-HV - Core of Fire'), item('mythic', 'BAL-27 - Core of Reason'), item('mythic', 'ISO Hemlock - Core of Thunder')], { releaseSeason: 8 }),
    entry('herrscher-of-reason-draw', 'Herrscher of Reason Draw', [item('legendary', 'Kestrel - Herrscher of Reason', 'character'), item('legendary', 'FHJ - Domain of Revelation')], { releaseSeason: 8 }),
    entry('herrscher-of-thunder-draw', 'Herrscher of Thunder Draw', [item('legendary', 'Rin Yoshida - Herrscher Of Thunder', 'character')], { releaseSeason: 8 }),
    entry('hunger-eternal-draw', 'Hunger Eternal Draw', [item('legendary', 'Grav - Vitae Devourer')], { releaseSeason: 9, comments: ['Seven spins'] }),
    entry('dawnbringer-mythic-drop', 'Dawnbringer Mythic Drop', [item('mythic', 'AK-47 - Dawnbringer')]),
    entry('wisterian-visage-draw', 'Wisterian Visage Draw', [item('legendary', 'ICR-1 - Wisterian Visage')], { aliases: ['Midnight Crescendo Draw'] }),
    // The Street Fighter pair: the same items on two images, sharing a group.
    entry('street-fighter-champion-s-collection-series-armory-weapons', "Street Fighter: Champion's Collection Series Armory (Weapons)", SF, { groupSlug: 'street-fighter-champion-s-collection-series-armory' }),
    entry('street-fighter-champion-s-collection-series-armory', "Street Fighter: Champion's Collection Series Armory", SF),
];
const DOC = {
    currentSeasonTitle: 'Season 9 — Hunger Eternal',
    newDraws: [],
    returningDraws: [{ _id: 'f1', title: 'Flatline Draw', date: new Date('2026-10-20T00:00:00Z'), items: [{ tier: 'legendary', name: 'CX-9 - Vital Circuit' }], thumbnailUrl: 'https://img/live.jpg' }],
    calendar: []
};
const draft = line => qa.draftFromLine(qa.parseQuickLine(line, opts), { entries: ENTRIES, seasonalDoc: DOC, isSameTitle: isSameDrawTitle, ...opts });

let failed = 0;
function t(name, fn) {
    try { fn(); console.log(`  ok   ${name}`); } catch (err) { failed++; console.log(`  FAIL ${name}\n       ${String(err.message).split('\n').join('\n       ')}`); }
}

t('a line splits into its name and its dates, with or without commas', () => {
    assert.deepStrictEqual(qa.splitLine('cx9 mythic draw, starts in 2 days, ends Nov 5'), ['cx9 mythic draw', 'starts in 2 days', 'ends Nov 5']);
    assert.deepStrictEqual(qa.splitLine('herrscher armory ends in 28 days'), ['herrscher armory', 'ends in 28 days']);
    // The comma inside a date stays with its date.
    assert.deepStrictEqual(qa.splitLine('brand new, starts Nov 3, ends Nov 17, 2026'), ['brand new', 'starts Nov 3', 'ends Nov 17 2026']);
    assert.deepStrictEqual(qa.splitLine('x, ends Nov 12, 7pm edt'), ['x', 'ends Nov 12 7pm edt']);
});

t('his three examples read the dates he meant', () => {
    const a = qa.parseQuickLine('cx9 mythic draw, starts in 2 days, ends Nov 5', opts);
    assert.strictEqual(a.query, 'cx9 mythic draw');
    assert.strictEqual(iso(a.start.date), '2026-11-03T00:00:00.000Z');
    assert.strictEqual(iso(a.end.date), '2026-11-05T00:00:00.000Z');
    assert.strictEqual(a.start.timed, false);
    const b = qa.parseQuickLine('Herrscher armory, ends in 28 days', opts);
    assert.strictEqual(b.start, null);
    assert.strictEqual(iso(b.end.date), '2026-11-29T00:00:00.000Z');
    const c = qa.parseQuickLine('Herrscher of reason, ends Nov 12 7pm edt', opts);
    // EDT was typed, but Toronto is on EST by Nov 12: his "use the correct one, even if the wrong one is typed". 7pm EST is midnight UTC.
    assert.strictEqual(iso(c.end.date), '2026-11-13T00:00:00.000Z');
    assert.strictEqual(c.end.timed, true);
});

t('a time with no zone is Toronto time; a date with none is 00:00 UTC; a typed zone is that region’s clock', () => {
    assert.strictEqual(qa.TIME_ZONE, 'America/Toronto');
    const end = (text, o = { now: NOW }) => iso(qa.parseQuickLine(`x, ends ${text}`, o).end.date);
    // 7pm EST (the clocks went back today) is midnight UTC.
    assert.strictEqual(end('Nov 12 7pm'), '2026-11-13T00:00:00.000Z');
    assert.strictEqual(end('Nov 12 7pm est'), '2026-11-13T00:00:00.000Z');
    assert.strictEqual(end('Nov 12 7pm et'), '2026-11-13T00:00:00.000Z');
    // The other way round: EST typed in summer is still Toronto's own clock (EDT, UTC-4).
    assert.strictEqual(end('Jul 12 2027 7pm est'), '2027-07-12T23:00:00.000Z');
    assert.strictEqual(end('Nov 12 7pm pdt'), '2026-11-13T03:00:00.000Z');
    assert.strictEqual(end('Nov 12 7pm gmt'), '2026-11-12T19:00:00.000Z', 'GMT is UTC, never London summer time');
    assert.strictEqual(end('Nov 12 7pm tokyo'), '2026-11-12T10:00:00.000Z');
    assert.strictEqual(end('Nov 12'), '2026-11-12T00:00:00.000Z');
    const untimed = qa.parseQuickLine('x, until Nov 12', opts).end;
    assert.strictEqual(untimed.timed, false);
});

t('an unlabelled date is the start and a second one the end; nonsense is reported, not guessed', () => {
    const a = qa.parseQuickLine('x, Nov 3, Nov 10', opts);
    assert.strictEqual(iso(a.start.date), '2026-11-03T00:00:00.000Z');
    assert.strictEqual(iso(a.end.date), '2026-11-10T00:00:00.000Z');
    const b = qa.parseQuickLine('x, ends whenever', opts);
    assert.strictEqual(b.end, null);
    assert.match(b.problems[0], /Couldn't read "ends whenever"/);
    assert.match(qa.parseQuickLine('x, starts Nov 10, ends Nov 3', opts).problems.join(' '), /not after the start/);
});

t('the draw index finds the draw his words name', () => {
    assert.strictEqual(qa.findCatalogDraw(ENTRIES, 'cx9 mythic draw').entry.slug, 'hollow-flight-mythic-drop');
    assert.strictEqual(qa.findCatalogDraw(ENTRIES, 'Herrscher armory').entry.slug, 'herrscher-s-armory');
    // "reason" is also in the armory's item; the draw with that title wins.
    assert.strictEqual(qa.findCatalogDraw(ENTRIES, 'Herrscher of reason').entry.slug, 'herrscher-of-reason-draw');
    // A typo of one letter still finds it.
    assert.strictEqual(qa.findCatalogDraw(ENTRIES, 'herscher of thunder').entry.slug, 'herrscher-of-thunder-draw');
    // An exact title or another name is certain.
    const alias = qa.findCatalogDraw(ENTRIES, 'Midnight Crescendo');
    assert.strictEqual(alias.entry.slug, 'wisterian-visage-draw');
    assert.strictEqual(alias.matchedBy, 'alias');
});

t('words the index has never seen name no draw', () => {
    assert.strictEqual(qa.findCatalogDraw(ENTRIES, 'totally unknown thing'), null);
    assert.strictEqual(qa.findCatalogDraw(ENTRIES, 'legendary vehicle'), null, 'nothing in the index is one');
});

t('a rarity or kind alone guesses nothing and lists every draw that fits, for Pick', () => {
    // No draw here has a mythic character (Hollow Flight's character is epic), so nothing fits.
    assert.strictEqual(qa.findCatalogDraw(ENTRIES, 'mythic character'), null);
    const m = qa.findCatalogDraw(ENTRIES, 'mythic draw');
    assert.deepStrictEqual(m.candidates.map(e => e.slug), ['herrscher-s-armory', 'dawnbringer-mythic-drop', 'hollow-flight-mythic-drop'], 'newest season first, then by title');
    assert.strictEqual(m.entry, null);
    assert.strictEqual(m.sure, false);
    const c = qa.findCatalogDraw(ENTRIES, 'legendary character');
    assert.ok(c.candidates.every(e => e.items.some(i => i.tier === 'legendary' && i.kind === 'character')));
    assert.ok(c.candidates.length >= 2);
    const d = draft('legendary characters, ends Nov 20');
    assert.strictEqual(d.needsPick, true);
    assert.strictEqual(d.candidates.length, c.candidates.length);
});

t('typos and split words still find the draw', () => {
    const slug = q => qa.findCatalogDraw(ENTRIES, q)?.entry?.slug;
    assert.strictEqual(slug('hersher armory'), 'herrscher-s-armory', 'two slips in a long word');
    assert.strictEqual(slug('herrscher armroy'), 'herrscher-s-armory', 'a swapped pair is one slip');
    assert.strictEqual(slug('wisterian visge'), 'wisterian-visage-draw');
    assert.strictEqual(slug('cx9 mythic drop'), slug('cx9 mythic draw'), 'draw and drop are the same word here');
    assert.strictEqual(slug('hunger eter nal'), 'hunger-eternal-draw', 'two typed-apart words are tried joined');
    // A short word must be exact: one slip from a four-letter word is too loose.
    assert.strictEqual(qa.near('here', 'hero'), false);
    assert.strictEqual(qa.near('hersher', 'herrscher'), true);
});

t('Pick: the draw he chooses replaces the guess, with the line’s own dates; keep-as-typed drops the match', () => {
    const parsed = qa.parseQuickLine('cx9, ends Nov 20', opts);
    const guess = qa.draftFromLine(parsed, { entries: ENTRIES, seasonalDoc: DOC, isSameTitle: isSameDrawTitle, ...opts });
    assert.ok(guess.candidates.length >= 2, 'a guess offers Pick');
    const flat = ENTRIES.find(e => e.slug === 'hollow-flight-mythic-drop');
    const picked = qa.draftFromLine(parsed, { entries: ENTRIES, seasonalDoc: DOC, isSameTitle: isSameDrawTitle, ...opts, pick: flat });
    assert.strictEqual(picked.title, 'Hollow Flight Mythic Drop');
    assert.strictEqual(picked.sure, true);
    assert.deepStrictEqual(picked.candidates, []);
    assert.strictEqual(iso(picked.end), '2026-11-20T00:00:00.000Z');
    const typed = qa.draftFromLine(parsed, { entries: ENTRIES, seasonalDoc: DOC, isSameTitle: isSameDrawTitle, ...opts, pick: qa.TYPED });
    assert.strictEqual(typed.title, 'Cx9');
    assert.strictEqual(typed.matchedBy, null);
    assert.strictEqual(typed.needsPick, false);
});

t('the Street Fighter pair: the group’s own document, not a coin toss', () => {
    const r = qa.findCatalogDraw(ENTRIES, 'street fighter champions collection');
    assert.strictEqual(r.entry.slug, 'street-fighter-champion-s-collection-series-armory');
    assert.deepStrictEqual(r.alternates, []);
});

t('a guess the words fit two draws about equally is marked unsure', () => {
    const r = qa.findCatalogDraw(ENTRIES, 'cx9');
    assert.strictEqual(r.sure, false);
    assert.ok(r.alternates.length >= 1);
});

t('the draft: Returning unless the line says new, wherever the word sits', () => {
    // His rule, 2026-11-01 12:41 EDT: "All new draws must state new in the quick add line ... otherwise just assume returning". Even a draw the index dates to this season.
    const he = draft('hunger eternal, ends Nov 20');
    assert.strictEqual(he.category, 'returning');
    assert.strictEqual(draft('hunger eternal, new, ends Nov 20').category, 'new');
    assert.strictEqual(draft('new, hunger eternal, ends Nov 20').category, 'new');
    assert.strictEqual(draft('NEW, totally unknown thing').title, 'Totally Unknown Thing', 'the section word is never the name');
    assert.strictEqual(draft('hunger eternal, returning').category, 'returning');
    // The Edit box's When text carries it the same way.
    assert.strictEqual(qa.parseQuickLine('x, new, starts Nov 3', opts).category, 'new');
    assert.strictEqual(iso(qa.parseQuickLine('x, new, starts Nov 3', opts).start.date), '2026-11-03T00:00:00.000Z');
    assert.strictEqual(he.title, 'Hunger Eternal Draw');
    assert.deepStrictEqual(he.items.map(i => i.tier), ['legendary', 'comment'], 'its notes come along as -# lines');
    assert.strictEqual(iso(he.start), '2026-11-01T00:00:00.000Z', 'no start means today');
    assert.strictEqual(draft('Herrscher armory').category, 'returning');
    const unknown = draft('totally unknown thing, starts Nov 3');
    assert.strictEqual(unknown.category, 'returning');
    assert.strictEqual(unknown.title, 'Totally Unknown Thing');
    assert.strictEqual(unknown.matchedBy, null);
    assert.deepStrictEqual(unknown.items, []);
});

t('a draw already on /draws is updated, not added twice, and keeps its own start', () => {
    const d = draft('flatline, ends Nov 20');
    assert.ok(d.existing);
    assert.strictEqual(d.existing.elementId, 'f1');
    assert.strictEqual(d.category, 'returning');
    assert.strictEqual(iso(d.start), '2026-10-20T00:00:00.000Z');
    assert.strictEqual(d.startGiven, false);
    assert.strictEqual(d.imageUrl, 'https://img/live.jpg');
});

t('the season number comes from the season title', () => {
    assert.strictEqual(qa.seasonNumber('Season 9 — Hunger Eternal'), 9);
    assert.strictEqual(qa.seasonNumber('Season 10: X'), 10);
    assert.strictEqual(qa.seasonNumber('Nameless'), null);
});

t('the Edit box’s items read back as the same items', () => {
    const items = [{ tier: 'mythic', name: 'CX-9 - Lethal Hollow' }, { tier: 'legendary', name: 'Kestrel - Blessed Hollow' }, { tier: 'comment', name: 'Seven spins' }];
    const back = qa.itemsToText(items).split('\n').map(parseItemLine);
    assert.deepStrictEqual(back, items);
});

t('a draft knows the live season and the season the index already keeps', () => {
    const known = draft('herrscher armory, new, ends Nov 12');
    assert.strictEqual(known.category, 'new');
    assert.strictEqual(known.seasonNow, 9);
    assert.strictEqual(known.indexSeason, 8, '`new` never moves a draw the index already has');
    const unknown = draft('starfall echo draw, new');
    assert.strictEqual(unknown.matchedBy, null);
    assert.strictEqual(unknown.indexSeason, null);
    assert.strictEqual(unknown.seasonNow, 9);
});
t('a box of lines keeps the first ten', () => {
    const r = qa.parseQuickText(Array.from({ length: 13 }, (_, i) => `draw ${i}`).join('\n') + '\n\n');
    assert.strictEqual(r.lines.length, 10);
    assert.strictEqual(r.extra, 3);
});

t('a month and day already passed stays this year, even after the UTC date rolls over (2026-11-09, his Broken Tides screenshot)', () => {
    const evening = new Date('2026-11-10T00:18:00Z');   // 7:18 PM Toronto on Nov 9
    const day = (line, slot) => qa.parseQuickLine(line, { now: evening, zone: 'America/Toronto' })[slot]?.date.toISOString().slice(0, 10);
    assert.strictEqual(day('tide, starts nov 9', 'start'), '2026-11-09', 'was 2027-11-09');
    assert.strictEqual(day('tide, starts oct 30, ends nov 23', 'start'), '2026-10-30');
    assert.strictEqual(day('tide, ends nov 3', 'end'), '2026-11-03');
    assert.strictEqual(day('tide, starts jan 5', 'start'), '2027-01-05', 'a date months away still moves ahead');
    assert.strictEqual(day('tide, nov 5 - nov 20', 'start'), '2026-11-05', 'a range fills the start');
    assert.strictEqual(day('tide, nov 5 - nov 20', 'end'), '2026-11-20', 'and the end, in the same year');
    assert.strictEqual(day('tide, dec 20 - jan 3', 'end'), '2027-01-03', 'a range over New Year ends next year');
});
t('Add to Calendar reads the post\'s dates, skips a bare "now", and keeps a passed date this year', () => {
    const { calendarPrefill } = require('../commands/addToCalendar');
    const at = new Date('2026-11-09T20:00:00Z');
    assert.deepStrictEqual(calendarPrefill({ title: 'X', content: 'live now, 11/5 - 11/19', postedAt: at }), { title: 'X', startDate: 'November 5, 2026', endDate: 'November 19, 2026' });
    assert.strictEqual(calendarPrefill({ title: 'X', content: 'Event Oct 20 - Nov 2', postedAt: at }).startDate, 'October 20, 2026');
});

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
