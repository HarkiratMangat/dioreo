// scripts/calendarOps.test.js
const assert = require('assert');
const ops = require('../core/ops');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('calendar.add defaults an unprefixed entry to category "event"', () => {
    const r = ops.resolveOp('calendar.add').validate({
        type: 'calendar.add', payload: { title: 'Clan wars', startDate: 'Aug 24', endDate: 'Aug 31' }
    });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
    assert.strictEqual(r.normalized.payload.category, 'event',
        'an unprefixed entry must keep rendering in the section it always has');
});

// ⚠️ CORRECTED from the plan's own draft test: the real SeasonalData schema field is `isDoubleCP`, not `is2XCP` -- the plan's test checked a field name that does not exist on the model at all.
check('calendar.add preserves the isDoubleCP flag -- the field draft.calendar once dropped', () => {
    const r = ops.resolveOp('calendar.add').validate({
        type: 'calendar.add', payload: { title: 'Double CP', startDate: 'Aug 11', endDate: 'Aug 15', isDoubleCP: true }
    });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
    assert.strictEqual(r.normalized.payload.isDoubleCP, true,
        'losing this silently made Promote to Live flatten every staged 2X CP event -- see models/SeasonalData.js');
});

check('calendar.add never title-cases the title, unlike draws -- the real handler only trims it', () => {
    const r = ops.resolveOp('calendar.add').validate({
        type: 'calendar.add', payload: { title: 'MP Community Playlist', startDate: 'Aug 24', endDate: 'Aug 31' }
    });
    assert.strictEqual(r.normalized.payload.title, 'MP Community Playlist',
        'toTitleCase would mangle MP/BR/DMZ acronyms into Mp/Br/Dmz -- handlers/manage/calendar.js never calls it');
});

check('a blank end date means the event is Ongoing, not a validation error', () => {
    const r = ops.resolveOp('calendar.add').validate({
        type: 'calendar.add', payload: { title: 'Season Finale', startDate: 'Aug 24', endDate: '' }
    });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
    assert.strictEqual(r.normalized.payload.isOngoing, true);
    assert.strictEqual(r.normalized.payload.endDate, null);
});

// ⚠️ CORRECTED: "Replace Multiple" is a fuzzy-title upsert-merge (utils/bulkMerge.js's upsertByTitle, the SAME function draws.js's bulkReplace uses), never a wholesale array $set -- the plan's own draft implementation did exactly the wholesale-$set thing already found and fixed once for draws.
check('calendar.bulkReplace inverts by carrying the FULL prior set (a merge, not a wholesale overwrite)', () => {
    const prior = [{ title: 'A' }, { title: 'B' }, { title: 'C' }];
    const inv = ops.resolveOp('calendar.bulkReplace').invert({
        action: 'bulkReplace', applied: { replaced: prior, added: [{ title: 'Nightfall' }] }
    });
    assert.strictEqual(inv.type, 'calendar.bulkReplace');
    assert.deepStrictEqual(inv.payload.parsed, prior,
        'the inverse of a replace must restore every event it might have overwritten, not just record a count');
});

// ⚠️ CORRECTED: the real "Delete Multiple" modal (modal_calendar_bulk_remove) collects pasted TITLES, fuzzy-matched (utils/search.js's fuzzyMatch) -- never element ids, which the admin never sees.
check('calendar.bulkDelete accepts pasted titles, not just ids', () => {
    const r = ops.resolveOp('calendar.bulkDelete').validate({
        type: 'calendar.bulkDelete', payload: { titles: ['Clan Wars', 'Krai BR'] }
    });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
});

check('calendar.bulkDelete refuses an empty selection', () => {
    const r = ops.resolveOp('calendar.bulkDelete').validate({ type: 'calendar.bulkDelete', payload: {} });
    assert.strictEqual(r.ok, false);
});

check('calendar.purge is tier 3 and setBanners is tier 1', () => {
    assert.strictEqual(ops.resolveOp('calendar.purge').tier, 3);
    assert.strictEqual(ops.resolveOp('calendar.setBanners').tier, 1);
});

check('calendar.setBanners only validates the 3 real banner keys', () => {
    const bad = ops.resolveOp('calendar.setBanners').validate({ type: 'calendar.setBanners', payload: { drawsBannerUrl: 'x' } });
    assert.strictEqual(bad.ok, false, 'the real payload keys are draws/events/playlists, not drawsBannerUrl');
    const good = ops.resolveOp('calendar.setBanners').validate({ type: 'calendar.setBanners', payload: { draws: 'https://x' } });
    assert.strictEqual(good.ok, true, JSON.stringify(good.errors));
});

check('calendar.edit round-trips an inverse without re-parsing the date string', () => {
    const inv = ops.resolveOp('calendar.edit').invert({
        action: 'edit', applied: { elementId: 'a', prior: { title: 'Old', date: new Date('2026-08-01'), endDate: null, isOngoing: true, category: 'event', isDoubleCP: false } }
    });
    const r = ops.resolveOp('calendar.edit').validate(inv);
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
});

// Bulletless, newline-delimited entries (added 2026-08-22 19:47 EDT, Harkirat's AskUserQuestion pick) -- exercised through the real op validate() path (not parseBulkEvents directly) so this also proves the op's own text-relaying contract still holds.
check('calendar.bulkAdd parses a bulletless, prefix+space entry with no bullet at all', () => {
    const r = ops.resolveOp('calendar.bulkAdd').validate({
        type: 'calendar.bulkAdd', payload: { text: 'p 8/6-8/19 | Krai BR' }
    });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
    assert.strictEqual(r.normalized.payload.parsed.length, 1);
    assert.strictEqual(r.normalized.payload.parsed[0].category, 'playlist');
});

// Regression test for a real bug caught live in this session: running the bulleted regex over the WHOLE multi-line text let a bulleted line with nothing after it on its own line swallow every later bulletless line into its title (a bulleted entry's own end-of-string fallback isn't scoped to just that line). Fixed by processing line-by-line -- this pins that fix so it can't silently regress.
check('calendar.bulkAdd: a bulleted line followed by bulletless lines does not swallow them into the last title', () => {
    const text = [
        'd•7/15 - 8/1 | Jupiter Cannon Draw•p•7/20 - All Season | Krai BR•e•7/18 - 7/25 | Anniversary Celebration',
        'p 8/6-8/19 | Rebirth Rumble',
        '8/9 - 8/10 | No Prefix Bare Line',
    ].join('\n');
    const r = ops.resolveOp('calendar.bulkAdd').validate({ type: 'calendar.bulkAdd', payload: { text } });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
    const titles = r.normalized.payload.parsed.map(e => e.title);
    assert.strictEqual(titles.length, 5, `expected 5 entries, got ${titles.length}: ${JSON.stringify(titles)}`);
    assert.strictEqual(titles[2], 'Anniversary Celebration', 'the bulleted entry must NOT have eaten the later bulletless lines');
    assert.ok(titles.includes('Rebirth Rumble'));
    assert.ok(titles.includes('No Prefix Bare Line'));
});

// Double-CP marker (added 2026-08-22 19:47 EDT, twice corrected live after real CODM event names broke each looser version -- see utils/adminParser.js's own header comment for the two failure classes this pins).
check('calendar.bulkAdd: a trailing Double-CP marker sets the flag and is stripped from the title', () => {
    const r = ops.resolveOp('calendar.bulkAdd').validate({
        type: 'calendar.bulkAdd', payload: { text: '7/1 - 7/2 | Krai BR 2x CP' }
    });
    const e = r.normalized.payload.parsed[0];
    assert.strictEqual(e.isDoubleCP, true);
    assert.strictEqual(e.title, 'Krai BR', 'the trailing marker is metadata, not part of the real event name');
});

check('calendar.bulkAdd: an embedded Double-CP phrase sets the flag WITHOUT touching the title', () => {
    const r = ops.resolveOp('calendar.bulkAdd').validate({
        type: 'calendar.bulkAdd', payload: { text: '7/1 - 7/2 | Double COD Points Sale' }
    });
    const e = r.normalized.payload.parsed[0];
    assert.strictEqual(e.isDoubleCP, true);
    assert.strictEqual(e.title, 'Double COD Points Sale', 'this is plausibly the event\'s real in-game name -- must not be mutilated');
});

check('calendar.bulkAdd: bare CP alone (no doubling indicator) does NOT set the flag', () => {
    const cases = ['CP Rebate Offer', 'COD Points Special Rebate', 'CP Cash Back Bonus', 'CP Summer Sale'];
    for (const title of cases) {
        const r = ops.resolveOp('calendar.bulkAdd').validate({ type: 'calendar.bulkAdd', payload: { text: `7/1 - 7/2 | ${title}` } });
        assert.strictEqual(r.normalized.payload.parsed[0].isDoubleCP, false, `"${title}" is a real non-2x CP promotion, must not be flagged`);
    }
});

check('calendar.bulkAdd: bare "2x" alone (no CP token) does NOT set the flag', () => {
    const cases = ['2x XP Weekend', '2x Weapon XP', 'Double Points Bonanza', 'Krai BR 2x'];
    for (const title of cases) {
        const r = ops.resolveOp('calendar.bulkAdd').validate({ type: 'calendar.bulkAdd', payload: { text: `7/1 - 7/2 | ${title}` } });
        assert.strictEqual(r.normalized.payload.parsed[0].isDoubleCP, false, `"${title}" is a real CODM event unrelated to CP (XP, other points), must not be flagged`);
    }
});

process.exit(failures ? 1 : 0);
