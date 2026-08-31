// scripts/portalPatchNotes.test.js — the season record, and the one field that could silently move a published date.
//
// 🔴 FOUR PATCH-NOTE OPS WERE DECLARED AND HAD NO AFFORDANCE — setDateInfo, setUrls1, setUrls2, editSeason. The portal could publish a patch note season and purge every one of them, and nothing in between; a typo in a published title was fixable only from Discord. scripts/portalOpsReach.test.js is the gate that found it. This file checks what the surface built for it actually sends.
//
// 🔴 THE SHARP EDGE IS THE RELEASE DATE, and it is sharp in two directions at once. core/ops/patchnotes.js sets releaseDate from parseReleaseDateTime(payload.releaseDate) on EVERY setDateInfo — so editing only a description rewrites the date too. And that parser returns `new Date()` for input it cannot read, INCLUDING an empty string, so a blank field does not clear a date, it moves the record to now. Both behaviours are asserted below against the real functions rather than described, because the whole design of patchEditOps rests on them.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let failures = 0;
const say = console.log.bind(console);
function check(name, fn) {
    try { fn(); say(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

say('portalPatchNotes — does the record editor send what it says, and never move a date nobody touched?');

const { patchRecordRows, patchEditOps, MAX_PATCH_IMAGES } = require('../portal/ui/season.logic');
const { parseReleaseDateTime, formatReleaseDateTime } = require('../utils/adminParser');

const EXACT_ISO = '2026-07-06T16:27:56.919Z';

// ── THE TWO MEASUREMENTS THE DESIGN RESTS ON ──────────────────────────────────────────────────
check('the human rendering of a date is LOSSY below a minute — which is why an untouched field never sends it', () => {
    const text = formatReleaseDateTime(new Date(EXACT_ISO));
    const back = parseReleaseDateTime(text).toISOString();
    assert.notStrictEqual(back, EXACT_ISO, 'if this ever round-trips exactly, the ISO path below is no longer necessary — but do not assume it, measure it');
    assert.strictEqual(back, '2026-07-06T16:27:00.000Z', 'the loss is the seconds and milliseconds, not something larger');
});

check('a raw ISO string round-trips through the bot\'s own parser EXACTLY', () => {
    for (const iso of [EXACT_ISO, '2026-07-22T11:20:00.000Z', '2026-07-15T00:00:00.000Z']) {
        assert.strictEqual(parseReleaseDateTime(iso).toISOString(), iso, `${iso} did not survive the parser`);
    }
});

check('an EMPTY date does not clear a release date — it sets it to now, which is why it is refused', () => {
    const parsed = parseReleaseDateTime('');
    assert.ok(parsed instanceof Date && !Number.isNaN(parsed.getTime()), 'an empty string yields a real date, not null');
    assert.ok(Math.abs(Date.now() - parsed.getTime()) < 60000, 'and that date is right now');
});

// ── THE ROWS ──────────────────────────────────────────────────────────────────────────────────
const LIVE = {
    patchNotes: [
        { _id: 'a', title: 'Season 6 — Take Your Heart', titleOverride: '', description: '', images: ['u1', 'u2'],
          releaseDate: '2026-07-06T16:27:56.919Z', releaseDateText: 'July 6, 2026 12:27 PM' },
        { _id: 'b', title: 'Season 7 — Terminated', titleOverride: '', description: 'notes', images: ['v1'],
          releaseDate: '2026-07-22T11:20:00.000Z', releaseDateText: 'July 22, 2026 7:20 AM' },
    ],
};

check('the record is newest first, and only the newest is current', () => {
    const rows = patchRecordRows(LIVE);
    assert.deepStrictEqual(rows.map((r) => r.id), ['b', 'a'], 'the newest release date sorts first regardless of array order');
    assert.deepStrictEqual(rows.map((r) => r.current), [true, false]);
    assert.strictEqual(rows[0].title, 'Season 7 — Terminated');
});

check('a title override is what the row shows, because it is what Discord shows', () => {
    const rows = patchRecordRows({ patchNotes: [{ _id: 'a', title: 'Season 6', titleOverride: 'The Heist', releaseDate: '2026-07-06T00:00:00.000Z' }] });
    assert.strictEqual(rows[0].title, 'The Heist');
});

// ── WHAT IT STAGES ────────────────────────────────────────────────────────────────────────────
const rows = patchRecordRows(LIVE);
const CURRENT = rows[0];
const PAST = rows[1];
const untouched = (e) => ({ titleOverride: e.titleOverride, description: e.description, releaseDateText: e.releaseDateText, urls: e.images });

check('an untouched editor stages nothing at all', () => {
    const { ops, blocked } = patchEditOps(CURRENT, untouched(CURRENT));
    assert.deepStrictEqual(ops, [], 'opening a record and closing it must not be a change');
    assert.strictEqual(blocked, '');
});

// 🔴 THE DEFECT THIS PREVENTS IS THE SEASON IDENTITY EDITOR'S, ONE ENTITY OVER: a payload the op reads differently from how the form meant it, committing green and writing something nobody asked for. Here the wrong answer is not "nothing happens" — it is a published release date quietly losing its seconds.
check('editing only the description carries the STORED ISO, not the re-rendered text', () => {
    const { ops } = patchEditOps(CURRENT, { ...untouched(CURRENT), description: 'a real change' });
    assert.deepStrictEqual(ops.map((o) => o.type), ['patchnote.setDateInfo']);
    assert.strictEqual(ops[0].payload.releaseDate, '2026-07-22T11:20:00.000Z',
        'the date must go back as the exact instant it already was');
    assert.strictEqual(parseReleaseDateTime(ops[0].payload.releaseDate).toISOString(), '2026-07-22T11:20:00.000Z',
        'and the server must read it back to that same instant');
});

check('a date somebody actually typed is sent as the words they typed', () => {
    const { ops } = patchEditOps(CURRENT, { ...untouched(CURRENT), releaseDateText: 'August 1, 2026' });
    assert.strictEqual(ops[0].payload.releaseDate, 'August 1, 2026');
    assert.strictEqual(parseReleaseDateTime('August 1, 2026').toISOString().slice(0, 10), '2026-08-01');
});

check('THE UNTOUCHED-DATE RULE CAN FAIL: sending the rendered text instead loses the seconds', () => {
    assert.throws(() => {
        const naive = formatReleaseDateTime(new Date(EXACT_ISO));
        assert.strictEqual(parseReleaseDateTime(naive).toISOString(), EXACT_ISO, 'date drifted');
    }, /date drifted/);
});

check('each image slot is its own op, and a slot nobody touched is not restaged', () => {
    const five = ['1', '2', '3', '4', '5'];
    const entry = { ...CURRENT, images: [...five, 'six'] };
    const { ops } = patchEditOps(entry, { ...untouched(entry), urls: [...five, 'SIX-CHANGED'] });
    assert.deepStrictEqual(ops.map((o) => o.type), ['patchnote.setUrls2'],
        'slot 1 was identical, so re-uploading its five images would say nothing');
    assert.deepStrictEqual(ops[0].payload.urls, ['SIX-CHANGED']);
});

check('a past season takes ONE editSeason carrying every field, the way /manage sends it', () => {
    const { ops } = patchEditOps(PAST, { ...untouched(PAST), description: 'fixed a typo' });
    assert.deepStrictEqual(ops.map((o) => o.type), ['patchnote.editSeason']);
    assert.deepStrictEqual(Object.keys(ops[0].payload).sort(), ['description', 'releaseDate', 'titleOverride', 'urls1', 'urls2']);
    assert.deepStrictEqual(ops[0].payload.urls1, ['u1', 'u2'], 'the first five images ride in slot 1');
    assert.deepStrictEqual(ops[0].payload.urls2, []);
});

check('a blank date is refused with the reason, and stages nothing', () => {
    const { ops, blocked } = patchEditOps(CURRENT, { ...untouched(CURRENT), releaseDateText: '   ' });
    assert.deepStrictEqual(ops, []);
    assert.match(blocked, /right now/, 'the refusal must say what a blank field would actually do, not just that it is required');
});

check('more images than the entry can hold are cut where the op cuts them', () => {
    const many = Array.from({ length: 14 }, (_, i) => `img${i}`);
    const { ops } = patchEditOps(PAST, { ...untouched(PAST), urls: many });
    const sent = [...ops[0].payload.urls1, ...ops[0].payload.urls2];
    assert.strictEqual(sent.length, MAX_PATCH_IMAGES, 'core/ops slices at ten, so offering eleven would drop one after the fact');
});

// ⚠️ THE PREFILL IS THE SERVER'S, NOT A SECOND FORMATTER. If the route stops stamping releaseDateText the field starts empty, the blank-date guard fires on every entry, and the editor refuses every edit — a working surface turned into a permanent refusal by a change one file away.
check('the season route stamps the text the editor prefills from', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'portal', 'api', 'season.js'), 'utf8');
    assert.match(src, /releaseDateText: formatReleaseDateTime\(/, 'portal/api/season.js no longer stamps releaseDateText');
    const stub = fs.readFileSync(path.join(__dirname, '..', 'portal', 'ui', 'harness', 'stub.js'), 'utf8');
    assert.match(stub, /releaseDateText: harnessReleaseText\(/, 'the harness no longer stamps it, so the record editor cannot be reviewed there');
});

say(failures ? `\n✗ ${failures} failed` : '\n✅ portalPatchNotes: the record editor reaches all four ops and never moves a date nobody touched');
process.exit(failures ? 1 : 0);
