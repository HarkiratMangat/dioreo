// scripts/manageSeasonHandlers.test.js -- /manage's season handlers end to end: titles and deadlines, the draft, Promote, Discard and Start New Season (code-housekeeping, 2026-11-04 12:12 EST). Runs on scripts/lib/manageHarness.cjs, so no database and no Discord.
const assert = require('assert');
const h = require('./lib/manageHarness.cjs');
const season = require('../handlers/manage/season');

let failures = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.stack.split('\n').slice(0, 3).join('\n      ')}`); }
}
const button = (customId) => Object.assign(h.modal(customId), { isButton: () => true, isModalSubmit: () => false });

(async () => {
    await check('Titles & Deadlines saves the season title and each end date', async () => {
        h.reset();
        const i = h.modal('modal_season_titles', { main_title: 'Season 10: Frostbite', bp_line: 'Frostbite Battle Pass, Nov 5 2026 - Dec 17 2026', rank_line: 'Ranked Season 10, Nov 5 2026 - Dec 17 2026', dmz_line: '' });
        await season.setTitlesDeadlines(i);
        const d = h.state.doc;
        assert.strictEqual(d.currentSeasonTitle, 'Season 10: Frostbite', i.text());
        assert.ok(d.bpEnd && d.rankEnd, `both ends saved: ${JSON.stringify({ bpEnd: d.bpEnd, rankEnd: d.rankEnd })}`);
        assert.strictEqual(h.state.changes.length, 1);
    });

    await check('Promote puts the draws and calendar live in date order (2026-11-08 11:30 EST)', async () => {
        const d = (t, day) => ({ _id: h.id(), title: t, date: `2026-11-${String(day).padStart(2, '0')}T00:00:00.000Z`, items: [] });
        h.reset({ draft: { active: true, currentSeasonTitle: 'Season 10', newDraws: [d('Late', 20), d('Early', 2)], returningDraws: [d('Ultra Violet', 6), d("Samurai's Soul", 1)], calendar: [{ ...d('B', 9), category: 'event' }, { ...d('A', 3), category: 'event' }] } });
        await season.handleDraftButton(button('mng_draftpromoteconfirm'));
        const s = h.state.doc;
        assert.deepStrictEqual(s.newDraws.map(x => x.title), ['Early', 'Late']);
        assert.deepStrictEqual(s.returningDraws.map(x => x.title), ["Samurai's Soul", 'Ultra Violet']);
        assert.deepStrictEqual(s.calendar.map(x => x.title), ['A', 'B']);
    });

    await check('the draft takes pasted draws and events without touching the live season', async () => {
        h.reset({ newDraws: [{ _id: 'a'.repeat(24), title: 'Live Draw', date: '2026-11-01T12:00:00.000Z' }] });
        await season.bulkDraftDraws(h.modal('modal_draft_draws', { new_text: 'Iron Wolf, l AK117, Dec 5 2026, https://img/iw', returning_text: '' }));
        await season.bulkDraftCalendar(h.modal('modal_draft_calendar', { bulk_text: 'e 12/6 - 12/7 | Anniversary' }));
        const d = h.state.doc;
        assert.strictEqual(d.newDraws.map(x => x.title).join(','), 'Live Draw', 'the live list is untouched');
        assert.strictEqual((d.draft?.newDraws || []).map(x => x.title).join(','), 'Iron Wolf', JSON.stringify(d.draft));
        assert.strictEqual((d.draft?.calendar || []).length, 1);
    });

    await check('Promote to Live swaps the draft in; Discard throws it away', async () => {
        h.reset({ newDraws: [{ _id: 'b'.repeat(24), title: 'Old Draw', date: '2026-11-01T12:00:00.000Z' }],
                  draft: { active: true, currentSeasonTitle: 'Season 11: Next', newDraws: [{ _id: 'c'.repeat(24), title: 'Next Draw', date: '2026-12-20T12:00:00.000Z' }], returningDraws: [], calendar: [] } });
        const p = button('mng_draftpromoteconfirm');
        await season.handleDraftButton(p);
        assert.strictEqual(h.state.doc.currentSeasonTitle, 'Season 11: Next', p.text());
        assert.strictEqual(h.state.doc.newDraws.map(x => x.title).join(','), 'Next Draw');
        assert.strictEqual(h.state.doc.draft.active, false);

        h.reset({ draft: { active: true, currentSeasonTitle: 'Season 11: Next', newDraws: [{ _id: 'd'.repeat(24), title: 'Next Draw' }], returningDraws: [], calendar: [] } });
        await season.handleDraftButton(button('mng_draftdiscardconfirm'));
        assert.ok(!h.state.doc.draft?.active && !(h.state.doc.draft?.newDraws || []).length, JSON.stringify(h.state.doc.draft));
    });

    await check('Promote with an end left blank clears the old season\'s end instead of keeping it', async () => {
        h.reset({ bpEnd: '2026-12-17T00:00:00.000Z', rankEnd: '2026-12-17T00:00:00.000Z', bpEndTBD: false,
                  draft: { active: true, currentSeasonTitle: 'Season 11: Next', bpStart: '2026-12-18T00:00:00.000Z', rankEnd: '2027-02-01T00:00:00.000Z', newDraws: [], returningDraws: [], calendar: [] } });
        await season.handleDraftButton(button('mng_draftpromoteconfirm'));
        assert.strictEqual(h.state.doc.bpEnd, null, 'the old Battle Pass end is gone');
        assert.strictEqual(h.state.doc.bpEndTBD, false);
        assert.strictEqual(h.state.doc.rankEnd, '2027-02-01T00:00:00.000Z', 'an end the draft gives still goes live');
    });

    await check('Start New Season asks first, then clears the season on Confirm', async () => {
        h.reset({ currentSeasonTitle: 'Season 9: Old', newDraws: [{ _id: 'e'.repeat(24), title: 'Old Draw', date: '2026-11-01T12:00:00.000Z' }], calendar: [{ _id: 'f'.repeat(24), title: 'Old Event', date: '2026-11-01T12:00:00.000Z' }] });
        const ask = h.modal('modal_season_wipe', { season_title: 'Season 10: New' });
        await season.promptWipeSeason(ask);
        assert.strictEqual(h.state.doc.newDraws.length, 1, 'nothing changes before the confirm');
        const token = (ask.text().match(/mng_wipeconfirm_([A-Za-z0-9-]+)/) || [])[1];
        assert.ok(token, ask.text());
        const yes = button(`mng_wipeconfirm_${token}`);
        await season.handleWipeButton(yes);
        assert.strictEqual(h.state.doc.currentSeasonTitle, 'Season 10: New', yes.text());
        assert.strictEqual(h.state.doc.newDraws.length + h.state.doc.calendar.length, 0);
    });

    if (failures) { console.error(`\n${failures} failing`); process.exit(1); }
    console.log('\n/manage season handlers: all checks pass');
    process.exit(0);
})();
