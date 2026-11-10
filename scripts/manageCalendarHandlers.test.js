// scripts/manageCalendarHandlers.test.js -- /manage's calendar handlers end to end: modal submit → op → saved events → the reply (code-housekeeping, 2026-11-04 12:10 EST). Runs on scripts/lib/manageHarness.cjs, so no database and no Discord.
const assert = require('assert');
const h = require('./lib/manageHarness.cjs');
const cal = require('../handlers/manage/calendar');

const titles = arr => arr.map(e => e.title).join(',');
let failures = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.stack.split('\n').slice(0, 3).join('\n      ')}`); }
}
const ev = (id, title, date, extra = {}) => ({ _id: id.repeat(24).slice(0, 24), title, date, category: 'event', ...extra });

(async () => {
    await check('Add Event saves it with its dates and answers', async () => {
        h.reset();
        const i = h.modal('add_calendar', { title: 'Krai BR', start_date: 'Nov 6 2026', end_date: 'Nov 19 2026', category: 'playlist', double_cp: '' });
        await cal.addCalendarEvent(i);
        assert.strictEqual(titles(h.state.doc.calendar), 'Krai BR', i.text());
        assert.ok(h.state.doc.calendar[0].endDate, 'the end date is saved');
        assert.strictEqual(h.state.changes.length, 1);
    });

    // Set End Date on a live draw opens this pop-up, so the game's countdown must work in its end box, and only there (think pass, 2026-11-10).
    await check('Add Event: a countdown end snaps to midnight UTC; a countdown start is refused', async () => {
        h.reset();
        const want = require('../utils/countdown').snapCountdown('13d 23h').toISOString();
        const i = h.modal('add_calendar', { title: 'Countdown Draw', start_date: 'Nov 6 2026', end_date: '13d 23h', category: 'draw', double_cp: '' });
        await cal.addCalendarEvent(i);
        assert.strictEqual(new Date(h.state.doc.calendar[0]?.endDate).toISOString(), want, i.text());
        h.reset();
        const j = h.modal('add_calendar', { title: 'Countdown Draw', start_date: '2h', end_date: 'Nov 19 2026', category: 'draw', double_cp: '' });
        await cal.addCalendarEvent(j);
        assert.strictEqual(h.state.doc.calendar.length, 0, j.text());
    });

    await check('Add Event with no start date saves nothing', async () => {
        h.reset();
        const i = h.modal('add_calendar', { title: 'Krai BR', start_date: '', category: 'event' });
        await cal.addCalendarEvent(i);
        assert.strictEqual(h.state.doc.calendar.length, 0, i.text());
        assert.strictEqual(h.state.changes.length, 0);
    });

    await check('Edit Event changes the stored event, same id', async () => {
        h.reset({ calendar: [ev('a', 'Old Event', '2026-11-01T12:00:00.000Z')] });
        const i = h.modal(`edit_calendar_${'a'.repeat(24)}`, { title: 'New Event', start_date: 'Nov 2 2026', end_date: '', category: 'event', double_cp: 'yes' });
        await cal.editCalendarEvent(i);
        const [e] = h.state.doc.calendar;
        assert.strictEqual(e._id, 'a'.repeat(24));
        assert.strictEqual(e.title, 'New Event', i.text());
        assert.strictEqual(e.isDoubleCP, true);
    });

    await check('Bulk Add reads the pasted lines', async () => {
        h.reset();
        const i = h.modal('modal_calendar_bulk_add', { bulk_text: 'p 11/6-11/19 | Krai BR\n11/8 - 11/9 | Double COD Points Sale' });
        await cal.bulkAddOrReplaceCalendar(i);
        assert.strictEqual(h.state.doc.calendar.length, 2, i.text());
    });

    await check('Bulk Replace adds a new line, and its undo takes it back out', async () => {
        h.reset({ calendar: [ev('b', 'Krai BR', '2026-11-06T12:00:00.000Z', { category: 'playlist' })] });
        const before = JSON.parse(JSON.stringify(h.state.doc.calendar));
        const i = h.modal('modal_calendar_bulk_replace', { bulk_text: 'p 11/6-11/20 | Krai BR\ne 11/8 - 11/9 | Anniversary' });
        await cal.bulkAddOrReplaceCalendar(i);
        assert.strictEqual(h.state.doc.calendar.length, 2, i.text());
        const { commitSet } = require('../core/changeset');
        const undo = await commitSet([h.state.changes[0].inverse], { actorId: h.OWNER, revertOf: { changeId: h.state.changes[0].changeId, page: 'calendar', actorId: h.OWNER } });
        assert.ok(undo.ok, JSON.stringify(undo));
        assert.deepStrictEqual(h.state.doc.calendar, before);
    });

    await check('Bulk Delete asks first, then removes the matched titles on Confirm', async () => {
        h.reset({ calendar: [ev('c', 'Krai BR', '2026-11-06T12:00:00.000Z'), ev('d', 'Anniversary', '2026-11-08T12:00:00.000Z')] });
        const i = h.modal('modal_calendar_bulk_delete', { titles: 'krai br' });
        await cal.bulkDeleteCalendar(i);
        assert.strictEqual(h.state.doc.calendar.length, 2, 'nothing is deleted before the confirm');
        const { pendingBulkDeletes } = require('../handlers/manage/shared');
        const [token, pending] = [...pendingBulkDeletes.entries()].at(-1);
        assert.ok(i.text().includes(`mng_bulkdelconfirm_${token}`), 'the confirm button carries the token');
        await pending.apply();
        assert.strictEqual(titles(h.state.doc.calendar), 'Anniversary');
    });

    await check('Purge empties the calendar; Delete removes one event', async () => {
        h.reset({ calendar: [ev('e', 'One', '2026-11-01T12:00:00.000Z'), ev('f', 'Two', '2026-11-02T12:00:00.000Z')] });
        await cal.deleteItem({ id: 'e'.repeat(24) }, h.OWNER);
        assert.strictEqual(titles(h.state.doc.calendar), 'Two');
        await cal.purge(h.OWNER);
        assert.strictEqual(h.state.doc.calendar.length, 0);
    });

    if (failures) { console.error(`\n${failures} failing`); process.exit(1); }
    console.log('\n/manage calendar handlers: all checks pass');
    process.exit(0);
})();
