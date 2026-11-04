// scripts/remindHandler.test.js -- /remind's panel buttons end to end: open, turn a reminder on and off, the leaving-soon group, Stop all, Resume, and someone else's button (code-housekeeping, 2026-11-04 12:21 EST). Runs on scripts/lib/manageHarness.cjs: ReminderSubscription and UserPreference are in-memory collections.
const assert = require('assert');
const h = require('./lib/manageHarness.cjs');
const { handleRemindInteraction } = require('../handlers/remind');
const { ReminderSubscription } = h.collections;

const ME = 'USER_1';
const press = (customId, { user = ME, values = [], select = false } = {}) => Object.assign(h.modal(customId, {}, { user, values }), {
    isButton: () => !select, isStringSelectMenu: () => select, isModalSubmit: () => false
});
const mine = () => ReminderSubscription.rows.find(r => r.discordId === ME) || null;
let failures = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.stack.split('\n').slice(0, 3).join('\n      ')}`); }
}

(async () => {
    await check('the bell opens your own panel privately', async () => {
        h.reset(); ReminderSubscription.seed([]);
        const i = press('remind_open');
        await handleRemindInteraction(i);
        assert.ok(i.deferred && i.sent.length, 'answered');
        assert.ok(i.text().includes(`remind_cat:newDraws:${ME}`), i.text().slice(0, 300));
    });

    await check('a reminder button turns it on, and pressing it again removes the empty record', async () => {
        h.reset(); ReminderSubscription.seed([]);
        await handleRemindInteraction(press(`remind_cat:newDraws:${ME}`));
        assert.deepStrictEqual(mine()?.categories, ['newDraws']);
        await handleRemindInteraction(press(`remind_cat:newDraws:${ME}`));
        assert.strictEqual(mine(), null, 'nothing followed means nothing stored');
    });

    await check('Leaving soon turns the four leaving kinds on together, then off together', async () => {
        h.reset(); ReminderSubscription.seed([]);
        await handleRemindInteraction(press(`remind_cat:leaving:${ME}`));
        assert.deepStrictEqual([...mine().categories].sort(), ['leavingEvents', 'leavingNewDraws', 'leavingPlaylists', 'leavingReturningDraws']);
        await handleRemindInteraction(press(`remind_cat:leaving:${ME}`));
        assert.strictEqual(mine(), null);
    });

    await check('Stop all asks first, and Yes deletes the record', async () => {
        h.reset(); ReminderSubscription.seed([{ discordId: ME, categories: ['newDraws', 'patchNotes'] }]);
        const ask = press(`remind_stop:${ME}`);
        await handleRemindInteraction(ask);
        assert.ok(mine(), 'nothing deleted on the first press');
        assert.ok(ask.text().includes(`remind_stopyes:${ME}`), ask.text().slice(0, 300));
        await handleRemindInteraction(press(`remind_stopyes:${ME}`));
        assert.strictEqual(mine(), null);
    });

    await check('Resume clears a pause', async () => {
        h.reset(); ReminderSubscription.seed([{ discordId: ME, categories: ['newDraws'], pausedAt: new Date('2026-11-01T00:00:00Z'), failingSince: new Date('2026-10-28T00:00:00Z') }]);
        const i = press(`remind_resume:${ME}`);
        await handleRemindInteraction(i);
        assert.strictEqual(mine().pausedAt, null);
        assert.strictEqual(mine().failingSince, null);
        assert.ok(/back on/.test(i.text()), i.text());
    });

    await check("someone else's button changes nothing and points them to their own", async () => {
        h.reset(); ReminderSubscription.seed([]);
        const i = press(`remind_cat:newDraws:${ME}`, { user: 'SOMEONE_ELSE' });
        await handleRemindInteraction(i);
        assert.strictEqual(ReminderSubscription.rows.length, 0);
        assert.ok(i.sent.length, 'they get an answer');
    });

    if (failures) { console.error(`\n${failures} failing`); process.exit(1); }
    console.log('\n/remind panel: all checks pass');
    process.exit(0);
})();
