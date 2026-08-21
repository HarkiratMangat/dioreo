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

process.exit(failures ? 1 : 0);
