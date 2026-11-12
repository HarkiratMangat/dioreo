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

    await check("Titles & Deadlines never renames next season's patch notes entry (2026-11-09, the audit's item 14)", async () => {
        const pn = (t, o = '') => ({ _id: h.id(), title: t, titleOverride: o, emoji: '', images: [] });
        h.reset({ currentSeasonTitle: 'Season 9: Old', patchNotes: [pn('Season 9: Old'), pn('Season 9: Old', 'Season 10: New')] });
        await season.setTitlesDeadlines(h.modal('modal_season_titles', { main_title: 'Season 9: Renamed', bp_line: '', rank_line: '', dmz_line: '' }));
        assert.strictEqual(h.state.doc.currentSeasonTitle, 'Season 9: Renamed');
        assert.deepStrictEqual(h.state.doc.patchNotes.map(p => p.title), ['Season 9: Old', 'Season 9: Old'], "next season's entry is left alone");
        h.reset({ currentSeasonTitle: 'Season 9: Old', patchNotes: [pn('Season 8: Older'), pn('Season 9: Old')] });
        await season.setTitlesDeadlines(h.modal('modal_season_titles', { main_title: 'Season 9: Renamed', bp_line: '', rank_line: '', dmz_line: '' }));
        assert.deepStrictEqual(h.state.doc.patchNotes.map(p => p.title), ['Season 8: Older', 'Season 9: Renamed'], "this season's own entry still follows the title");
    });

    await check("Add New Season keeps a typed title as the entry's own title; blank still means the current season (2026-11-09, the audit's item 14)", async () => {
        const pn = require('../handlers/manage/patchnotes');
        h.reset({ currentSeasonTitle: 'Season 9: Old', patchNotes: [] });
        await pn.addSeason(h.modal('modal_add_season', { season_title: 'Season 10: New', description: '', release_date: '', urls_1: '', urls_2: '' }));
        await pn.addSeason(h.modal('modal_add_season', { season_title: '', description: '', release_date: '', urls_1: '', urls_2: '' }));
        assert.deepStrictEqual(h.state.doc.patchNotes.map(p => [p.title, p.titleOverride]), [['Season 10: New', 'Season 10: New'], ['Season 9: Old', '']]);
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

    // The Solstice Draw case (prod, 2026-11-11 19:35 EST): a live draw still running at the season start, added after the last daily carry-over, vanished at Promote. Promote now carries it itself, inside its own transaction.
    const solsticeDoc = (draftExtra = {}) => {
        const at = (s) => new Date(s);
        const sol = { _id: 'a1'.padEnd(24, '0'), title: 'Solstice Draw', date: at('2026-11-11T00:00:00Z'), thumbnailUrl: 'https://res.cloudinary.com/x/image/upload/draws/solstice.jpg', priceType: 'legendaryGunReactive', items: [{ tier: 'legendary', name: 'Gun - Sun' }] };
        const hunger = { _id: 'a2'.padEnd(24, '0'), title: 'Hunger Eternal Draw', date: at('2026-10-30T00:00:00Z'), thumbnailUrl: '', priceType: '', items: [{ tier: 'legendary', name: 'Grav - Vitae' }] };
        const other = { _id: 'a3'.padEnd(24, '0'), title: 'Next Season Draw', date: at('2026-11-12T00:00:00Z'), thumbnailUrl: '', priceType: '', items: [] };
        return {
            currentSeasonTitle: 'Season 9', newDraws: [hunger], returningDraws: [sol],
            calendar: [
                { _id: 'b1'.padEnd(24, '0'), title: 'Solstice Draw', date: at('2026-11-11T00:00:00Z'), endDate: at('2026-11-25T00:00:00Z'), category: 'draw', isOngoing: false, isDoubleCP: false },
                { _id: 'b2'.padEnd(24, '0'), title: 'Hunger Eternal Draw', date: at('2026-10-30T00:00:00Z'), endDate: at('2026-11-12T00:00:00Z'), category: 'draw', isOngoing: false, isDoubleCP: false },
                { _id: 'b3'.padEnd(24, '0'), title: 'Old Event', date: at('2026-10-01T00:00:00Z'), endDate: at('2099-01-01T00:00:00Z'), category: 'event', isOngoing: false, isDoubleCP: false },
            ],
            draft: { active: true, currentSeasonTitle: 'Season 10', bpStart: at('2026-11-12T00:00:00Z'), newDraws: [other], returningDraws: [], calendar: [{ _id: 'b4'.padEnd(24, '0'), title: 'Next Season Draw', date: at('2026-11-12T00:00:00Z'), endDate: at('2026-11-26T00:00:00Z'), category: 'draw', isOngoing: false, isDoubleCP: false }], ...draftExtra },
        };
    };

    await check('Promote carries a live draw and its row that are still running at the season start (the Solstice Draw)', async () => {
        h.reset(solsticeDoc());
        const p = button('mng_draftpromoteconfirm');
        await season.handleDraftButton(p);
        const s = h.state.doc;
        assert.deepStrictEqual(s.returningDraws.map(x => x.title), ['Solstice Draw'], p.text());
        assert.strictEqual(String(s.returningDraws[0]._id), 'a1'.padEnd(24, '0'), 'the carried draw keeps its live id');
        assert.ok(s.calendar.some(r => r.title === 'Solstice Draw' && r.category === 'draw'), 'its calendar row too');
        assert.ok(s.calendar.some(r => r.title === 'Old Event'), 'a running event too');
        assert.ok(!s.calendar.some(r => r.title === 'Hunger Eternal Draw') && !s.newDraws.some(r => r.title === 'Hunger Eternal Draw'), 'a row ending exactly at the start is not carried');
        assert.deepStrictEqual(s.newDraws.map(x => x.title), ['Next Season Draw']);
        assert.ok(/Solstice Draw/.test(p.text()) && /carried/i.test(p.text()), `the result names what was carried: ${p.text()}`);
    });

    await check('Promote with no Battle Pass start still carries what is running now', async () => {
        h.reset(solsticeDoc({ bpStart: null }));
        await season.handleDraftButton(button('mng_draftpromoteconfirm'));
        assert.ok(h.state.doc.calendar.some(r => r.title === 'Old Event'), JSON.stringify(h.state.doc.calendar.map(r => r.title)));
    });

    await check('Promote then Revert puts the live season and the draft back exactly', async () => {
        h.reset(solsticeDoc());
        const before = JSON.parse(JSON.stringify(h.state.doc));
        await season.handleDraftButton(button('mng_draftpromoteconfirm'));
        const promote = h.state.changes.find(c => c.action === 'promote' || /promote/i.test(c.summary || ''));
        assert.ok(promote && promote.inverse, 'the promote recorded an inverse');
        const { commitSet } = require('../core/changeset');
        const undo = await commitSet([promote.inverse], { actorId: h.OWNER, revertOf: { changeId: promote.changeId, page: 'season', actorId: h.OWNER } });
        assert.ok(undo.ok, JSON.stringify(undo.failedAt || undo));
        const after = JSON.parse(JSON.stringify(h.state.doc));
        for (const k of ['currentSeasonTitle', 'newDraws', 'returningDraws', 'calendar', 'draft']) assert.deepStrictEqual(after[k], before[k], k);
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

    await check('the draft draws panel removes one draw, adds one, and keeps the rest exactly (2026-11-08 12:28 EST)', async () => {
        const panel = require('../handlers/manage/seasonPanel');
        const d = (t, day, extra = {}) => ({ _id: h.id(), title: t, date: new Date(`2026-11-${String(day).padStart(2, '0')}T00:00:00.000Z`), items: [{ tier: 'legendary', name: 'Gun - Skin' }], thumbnailUrl: 'https://res.cloudinary.com/x/image/upload/draws/a.jpg', ...extra });
        const keep = d('Keep Me', 12, { newsSource: { channelId: '1', messageId: '2', rank: 3, sig: 'x' } }), gone = d('Remove Me', 14);
        h.reset({ draft: { active: true, currentSeasonTitle: 'Season 10', bpStart: new Date('2026-11-12T00:00:00Z'), newDraws: [keep, gone], returningDraws: [], calendar: [] } });
        const rm = h.modal('mng_ss|ddrmm|n', {}, { selects: { pick: [String(gone._id)] } });
        await (panel.handleSeasonPanelInteraction || panel)(rm);
        assert.deepStrictEqual(h.state.doc.draft.newDraws.map(x => x.title), ['Keep Me'], rm.text());
        assert.deepStrictEqual(h.state.doc.draft.newDraws[0].newsSource, keep.newsSource, 'the untouched row keeps its news tag');
        const add = h.modal('mng_ss|ddaddm|n', { title: 'Botanist Mythic Drop', items: 'm Weapon - Bloom\nl Other - Petal', date: 'November 26, 2026', image: 'https://res.cloudinary.com/x/image/upload/draws/b.jpg', type: '' });
        await (panel.handleSeasonPanelInteraction || panel)(add);
        assert.deepStrictEqual(h.state.doc.draft.newDraws.map(x => x.title), ['Keep Me', 'Botanist Mythic Drop'], add.text());
        assert.ok(add.text().includes('Added Botanist Mythic Drop'));
    });

    await check('auto-promote records the admin who commits it, whatever name the payload carries (2026-11-08 12:37 EST)', async () => {
        h.reset({ draft: { active: true, currentSeasonTitle: 'Season 10', bpStart: new Date('2026-11-12T00:00:00Z'), newDraws: [], returningDraws: [], calendar: [] } });
        const r = await require('../core/changeset').commitSet([{ type: 'season.setAutoPromote', payload: { on: true, by: 'someone-else' } }], { actorId: h.OWNER });
        assert.ok(r.ok, JSON.stringify(r.failedAt || r));
        assert.strictEqual(h.state.doc.draft.autoPromote, true);
        assert.strictEqual(h.state.doc.draft.autoPromoteBy, h.OWNER);
    });

    await check("Promote never renames the outgoing season's patch notes; it renames the new season's own entry (2026-11-09, the audit's finding 6)", async () => {
        const pn = (t) => ({ _id: h.id(), title: t, emoji: '', images: [] });
        h.reset({ currentSeasonTitle: 'Season 9: Old', patchNotes: [pn('Season 8: Older'), pn('Season 9: Old')], draft: { active: true, currentSeasonTitle: 'Season 10: New', newDraws: [], returningDraws: [], calendar: [] } });
        await season.handleDraftButton(button('mng_draftpromoteconfirm'));
        assert.deepStrictEqual(h.state.doc.patchNotes.map(p => p.title), ['Season 8: Older', 'Season 9: Old'], 'the old season keeps its title');
        assert.strictEqual(h.state.doc.currentSeasonTitle, 'Season 10: New');
        h.reset({ currentSeasonTitle: 'Season 9: Old', patchNotes: [pn('Season 9: Old'), pn('Season 10')], draft: { active: true, currentSeasonTitle: 'Season 10: New', newDraws: [], returningDraws: [], calendar: [] } });
        await season.handleDraftButton(button('mng_draftpromoteconfirm'));
        assert.deepStrictEqual(h.state.doc.patchNotes.map(p => p.title), ['Season 9: Old', 'Season 10: New'], "the new season's entry follows the title");
    });

    if (failures) { console.error(`\n${failures} failing`); process.exit(1); }
    console.log('\n/manage season handlers: all checks pass');
    process.exit(0);
})();
