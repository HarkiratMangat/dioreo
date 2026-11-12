// scripts/draftPaste.test.js -- the Next Season Draft's Paste Draws and Paste Calendar add and update, never replace (2026-11-09, the /manage audit's findings 1, 2, 3 and 5): the planner (utils/draftPaste.js), the preview and Stage through the real season panel, the draft calendar editor, one draft draw's card (End Date, Move), the banners pop-up, and every panel under Discord's 40 components with ids under 100. Runs on scripts/lib/manageHarness.cjs: no database, no Discord.
const assert = require('assert');
const h = require('./lib/manageHarness.cjs');
const P = require('../utils/draftPaste');
const E = require('../handlers/manage/seasonPanel/draftEdit');
const { handleSeasonPanelInteraction } = require('../handlers/manage/seasonPanel');

let failures = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.stack.split('\n').slice(0, 3).join('\n      ')}`); }
}
const button = (customId) => Object.assign(h.modal(customId), { isButton: () => true, isModalSubmit: () => false, message: { id: 'panel' } });
const count = c => (Array.isArray(c) ? c.reduce((n, x) => n + count(x), 0) : 1 + (c.components ? count(c.components) : 0) + (c.component ? count(c.component) : 0) + (c.accessory ? 1 : 0));
const ids = c => (JSON.stringify(c).match(/"custom_id":"[^"]+"/g) || []).map(x => x.slice(13, -1));
const fits = (panel) => { assert.ok(count(panel) <= 40, `${count(panel)} components`); for (const id of ids(panel)) assert.ok(id.length <= 100, id); };
const draw = (title, day, extra = {}) => ({ _id: h.id(), title, date: `2026-12-${String(day).padStart(2, '0')}T00:00:00.000Z`, thumbnailUrl: `https://img/${title.replace(/\W/g, '')}`, items: [{ tier: 'legendary', name: 'AK117 - Skin' }], ...extra });
const tokenIn = (i, verb) => (i.text().match(new RegExp(`mng_ss\\|${verb}\\|([0-9a-f]+)`)) || [])[1];

(async () => {
    await check('the planner adds, updates in place and leaves unpasted rows alone; a near name updates the staged row', async () => {
        const draft = { newDraws: [draw('Iron Wolf', 5), draw('Frost Bite', 9)], returningDraws: [], calendar: [] };
        const plan = P.planDraws(draft, 'Iron Wolf, l AK117 - Skin, Dec 7 2026, https://img/IronWolf\nNew One, l M4 - X, Dec 10 2026, https://img/n', '');
        assert.deepStrictEqual(plan.added.map(a => a.p.title), ['New One']);
        assert.deepStrictEqual(plan.changed.map(c => [c.old.title, c.diff.join(',')]), [['Iron Wolf', 'date']]);
        const out = P.applyDraws(draft, plan);
        assert.deepStrictEqual(out.lists.newDraws.map(d => d.title), ['Iron Wolf', 'Frost Bite', 'New One'], 'Frost Bite, not pasted, is kept');
        assert.strictEqual(String(out.lists.newDraws[0]._id), String(draft.newDraws[0]._id), 'the updated row keeps its _id');
    });

    await check('a draw staged in the other list is refused, an unread line is reported, strict never matches a near name', async () => {
        const draft = { newDraws: [draw('Iron Wolf', 5)], returningDraws: [draw("Samurai's Soul", 2)], calendar: [] };
        const plan = P.planDraws(draft, "Samurai's Soul, l X - Y, Dec 3 2026, https://img/s\nnot a draw line", '');
        assert.strictEqual(plan.twins.length, 1); assert.strictEqual(plan.skipped.length, 1); assert.strictEqual(plan.count, 0);
        assert.strictEqual(P.matchIn([draw('Iron Wolf', 1)], 'Iron Maiden', { strict: true }), null);
    });

    await check('a calendar paste updates the matching row, adds the rest, keeps 2X CP, leaves others alone', async () => {
        const cal = [{ _id: 'c1', title: 'Anniversary', date: '2026-12-06T00:00:00.000Z', endDate: '2026-12-07T00:00:00.000Z', category: 'event' }, { _id: 'c2', title: 'Holiday', date: '2026-12-20T00:00:00.000Z', isOngoing: true, category: 'event' }];
        const plan = P.planCalendar({ calendar: cal }, 'e 12/6 - 12/9 | Anniversary\nm 12/8 - 12/12 | Gun Game');
        assert.deepStrictEqual(plan.changed.map(c => c.diff.join(',')), ['end']);
        assert.deepStrictEqual(plan.added.map(a => a.row.title), ['Gun Game']);
        const next = P.applyCalendar({ calendar: cal }, plan);
        assert.deepStrictEqual(next.map(r => r.title), ['Anniversary', 'Gun Game', 'Holiday']);
        assert.strictEqual(next[0]._id, 'c1');
    });

    await check('Paste Draws opens empty, previews, and Stage adds and updates without replacing the staged list', async () => {
        const staged = Array.from({ length: 40 }, (_, i) => draw(`Staged Draw Number ${i} With A Long Title For Length`, 1 + (i % 25)));
        h.reset({ draft: { active: true, currentSeasonTitle: 'Season 10', newDraws: staged, returningDraws: [], calendar: [] } });
        const open = button('mng_ss|dr');
        await handleSeasonPanelInteraction(open);
        const box = open.sent[0].modal;
        assert.ok(box, 'a pop-up opens'); assert.ok(!JSON.stringify(box).includes('Staged Draw Number'), 'it opens empty (a prefilled box threw past 4,000 characters)');
        const submit = h.modal('mng_ss|drm', { new_text: 'Iron Wolf, l AK117 - Skin, Dec 5 2026, https://img/iw', returning_text: '' });
        submit.message = { id: 'panel' };
        await handleSeasonPanelInteraction(submit);
        assert.ok(submit.text().includes('Added'), submit.text().slice(0, 300));
        assert.strictEqual(h.state.doc.draft.newDraws.length, 40, 'nothing is written before Stage');
        const token = tokenIn(submit, 'dps');
        assert.ok(token, 'the preview carries Stage');
        const stage = button(`mng_ss|dps|${token}`);
        await handleSeasonPanelInteraction(stage);
        const d = h.state.doc.draft;
        assert.strictEqual(d.newDraws.length, 41, `every staged row kept: ${stage.text().slice(0, 300)}`);
        assert.ok(d.newDraws.some(x => x.title === 'Iron Wolf'));
        assert.ok(stage.text().includes('mng_ss|revert|') && stage.text().includes('|d"'), 'Revert lands back on the draft');
    });

    await check("someone else's paste token is refused; an expired one says so", async () => {
        h.reset({ draft: { active: true, newDraws: [], returningDraws: [], calendar: [] } });
        const token = E.keepPaste('someone-else', { kind: 'draws', newText: 'x', retText: '' });
        const i = button(`mng_ss|dps|${token}`);
        await handleSeasonPanelInteraction(i);
        assert.ok(i.text().includes("someone else's"), i.text());
        const j = button('mng_ss|dps|deadbeef00');
        await handleSeasonPanelInteraction(j);
        assert.ok(j.text().includes('expired'), j.text());
    });

    await check('Paste Calendar previews and stages by merging; the draft calendar editor adds, edits and removes one row', async () => {
        h.reset({ draft: { active: true, newDraws: [], returningDraws: [], calendar: [{ _id: h.id(), title: 'Anniversary', date: '2026-12-06T00:00:00.000Z', endDate: '2026-12-07T00:00:00.000Z', category: 'event', isOngoing: false }] } });
        const sub = h.modal('mng_ss|calm', { bulk_text: 'm 12/8 - 12/12 | Gun Game' });
        await handleSeasonPanelInteraction(sub);
        await handleSeasonPanelInteraction(button(`mng_ss|cps|${tokenIn(sub, 'cps')}`));
        assert.deepStrictEqual(h.state.doc.draft.calendar.map(r => r.title), ['Anniversary', 'Gun Game']);
        await handleSeasonPanelInteraction(h.modal('mng_ss|dcaddm', { title: 'Holiday Hunt', start_date: 'December 20 2026', end_date: '', category: 'event', double_cp: 'yes' }));
        const hol = h.state.doc.draft.calendar.find(r => r.title === 'Holiday Hunt');
        assert.ok(hol && hol.isOngoing && hol.isDoubleCP, JSON.stringify(h.state.doc.draft.calendar));
        const dup = h.modal('mng_ss|dcaddm', { title: 'Holiday Hunt', start_date: 'December 21 2026', end_date: '', category: 'event', double_cp: '' });
        await handleSeasonPanelInteraction(dup);
        assert.ok(dup.text().includes('already staged'), 'a second copy is refused');
        const key = String(h.state.doc.draft.calendar[0]._id);
        await handleSeasonPanelInteraction(h.modal(`mng_ss|dceditm|${key}`, { title: 'Anniversary', start_date: 'December 6 2026', end_date: 'TBD', category: 'event', double_cp: '' }));
        const ann = h.state.doc.draft.calendar.find(r => r.title === 'Anniversary');
        assert.ok(ann.endDate === null && !ann.isOngoing, 'TBD clears the end and is not All Season');
        await handleSeasonPanelInteraction(h.modal('mng_ss|dcrmm', {}, { selects: { pick: [key] } }));
        assert.deepStrictEqual(h.state.doc.draft.calendar.map(r => r.title), ['Gun Game', 'Holiday Hunt']);
    });

    await check("a draft draw's card sets its end date on the draft calendar and moves it between New and Returning", async () => {
        const iw = draw('Iron Wolf', 5);
        h.reset({ draft: { active: true, newDraws: [iw], returningDraws: [], calendar: [] } });
        const card = button(`mng_ss|ddc|n|${iw._id}`);
        await handleSeasonPanelInteraction(card);
        assert.ok(card.text().includes('Set End Date') && card.text().includes('Move to Returning'), card.text().slice(0, 300));
        await handleSeasonPanelInteraction(h.modal(`mng_ss|ddendm|n|${iw._id}`, { end: 'December 19 2026' }));
        const row = h.state.doc.draft.calendar.find(c => c.category === 'draw');
        assert.ok(row && new Date(row.endDate).getUTCDate() === 20, JSON.stringify(h.state.doc.draft.calendar)); // December 19 runs through Dec 19: ends Dec 20 00:00 UTC
        await handleSeasonPanelInteraction(button(`mng_ss|ddmv|n|${iw._id}`));
        assert.strictEqual(h.state.doc.draft.newDraws.length, 0);
        assert.deepStrictEqual(h.state.doc.draft.returningDraws.map(d => String(d._id)), [String(iw._id)], 'moved with its _id');
    });

    await check('every new panel and pop-up fits Discord', async () => {
        const many = Array.from({ length: 30 }, (_, i) => ({ _id: h.id(), title: `Event ${i}`, date: `2026-12-${String(1 + (i % 28)).padStart(2, '0')}T00:00:00.000Z`, category: i % 3 ? 'event' : 'draw', isOngoing: true }));
        const doc = { draft: { active: true, newDraws: [draw('Iron Wolf', 5)], returningDraws: [], calendar: many } };
        fits(E.draftCalendarView(doc, 0, 'note')); fits(E.draftCalendarView(doc, 4));
        fits(E.drawCardView(doc, 'n', doc.draft.newDraws[0]._id, 'note'));
        const plan = P.planDraws({ newDraws: [], returningDraws: [] }, Array.from({ length: 30 }, (_, i) => `Draw ${i}, l X - Y, Dec 5 2026, https://img/${i}`).join('\n'), '');
        const pv = E.drawsPreview(plan, 'abcdef0123'); fits(pv);
        assert.ok(JSON.stringify(pv).length < 12000);
        for (const m of [E.calendarRemoveModal(doc, 1), E.bannersModal(doc), E.drawEndModal('n', doc.draft.newDraws[0], null)]) {
            assert.ok(m.title.length <= 45 && m.custom_id.length <= 100 && m.components.length <= 5);
        }
        assert.ok(E.calendarRemoveModal(doc, 3).components[0].component.options.length <= 25);
    });

    await check('the slash command reaches the draft editors: Quick Add and Banners open their pop-up first, the rest their view', async () => {
        const { openFromSlash } = require('../handlers/manage/seasonPanel');
        h.reset({ draft: { active: true, newDraws: [draw('Iron Wolf', 5)], returningDraws: [], calendar: [] } });
        const slash = (act) => Object.assign(h.modal(''), { isModalSubmit: () => false, isChatInputCommand: () => true, options: { getString: (k) => ({ do: act, visibility: null }[k] ?? null) } });
        const qa = slash('quickadd'); await openFromSlash(qa, 'draft');
        assert.strictEqual(qa.sent[0].modal.toJSON().custom_id, 'modal_draws_quickadd_draft_n');
        const bn = slash('banners'); await openFromSlash(bn, 'draft');
        assert.ok(bn.sent[0].modal && /mng_ss\|dbnm/.test(JSON.stringify(bn.sent[0].modal)), JSON.stringify(bn.sent[0]).slice(0, 200));
        for (const [act, marker] of [['editdraws', 'mng_ss|ddadd'], ['editcalendar', 'mng_ss|dcadd'], ['look', 'Needs a Look']]) {
            const i = slash(act); await openFromSlash(i, 'draft');
            assert.ok(i.text().includes(marker), `${act}: ${i.text().slice(0, 200)}`);
        }
    });

    console.log(failures ? `\n${failures} failed` : '\ndraftPaste: all checks passed');
    process.exit(failures ? 1 : 0);
})();
