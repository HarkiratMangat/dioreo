// scripts/newsHandlerAck.test.js -- news triage's card buttons answer inside Discord's 3 seconds (2026-11-14 12:02 EST, news-triage-undo).
//
// Harkirat pressed Undo draft changes and got "The application didn't respond in time". Every button used to read the database (the /manage check, the card) BEFORE its first answer. These checks hold the dependency the access check waits on OPEN and assert the click is already acknowledged: each deferrable button and dropdown acknowledges first and answers through the right call afterwards, a failure after the acknowledgement is answered instead of leaving "thinking...", and the box opener (which cannot defer) and every id that is not ours behave as before. No database, no Discord.
const assert = require('assert');
const { MessageFlags } = require('discord.js');
const adminAccess = require('../utils/adminAccess');
const manageActions = require('../utils/manageActions');
const NewsCard = require('../models/NewsCard');
const revert = require('../core/revert');
const h = require('../handlers/news');

const PRIVATE = MessageFlags.Ephemeral;
function fake(kind, customId, { failAck = false } = {}) {
    const log = [];
    const i = {
        customId, values: ['crates'], user: { id: 'u1' }, applicationId: 'app', client: { rest: {} }, message: {},
        isButton: () => kind === 'button', isStringSelectMenu: () => kind === 'select',
        deferReply: async () => { if (failAck) throw new Error('10062 Unknown interaction'); log.push('deferReply'); },
        deferUpdate: async () => { if (failAck) throw new Error('10062 Unknown interaction'); log.push('deferUpdate'); },
        editReply: async o => { log.push(`editReply: ${o.content}`); },
        followUp: async o => { log.push(`followUp${o.flags === PRIVATE ? ' (private)' : ''}: ${o.content}`); },
        reply: async o => { log.push(`reply${o.flags === PRIVATE ? ' (private)' : ''}: ${o.content}`); },
    };
    return { i, log };
}
const ticks = async () => { for (let k = 0; k < 5; k++) await new Promise(r => setImmediate(r)); };

const saved = { hca: adminAccess.hasCommandAccess, canDo: adminAccess.canDo, ra: manageActions.resolveAction, find: NewsCard.findById, rev: revert.revertChange, err: console.error };
const restore = () => { adminAccess.hasCommandAccess = saved.hca; adminAccess.canDo = saved.canDo; manageActions.resolveAction = saved.ra; NewsCard.findById = saved.find; revert.revertChange = saved.rev; console.error = saved.err; };
let passed = 0; const realLog = console.log;
async function check(name, fn) {
    try { await fn(); passed++; console.log(`  ok ${name}`); } finally { restore(); }
}

(async () => {
    const routes = [
        ['Undo draft changes', 'button', 'news|undo|c1', 'deferReply', m => m.startsWith('editReply: ')],
        ['Dismiss', 'button', 'news|dismiss|c1', 'deferUpdate', m => m.startsWith('followUp (private): ')],
        ['Make a card', 'select', 'news|make', 'deferReply', m => m.startsWith('editReply: ')],
        ['Never drafted', 'select', 'news|kinds', 'deferReply', m => m.startsWith('editReply: ')],
    ];
    for (const [label, kind, id, ack, refusal] of routes) {
        await check(`${label} is acknowledged before the access check can finish, and a refusal answers privately after it`, async () => {
            let release; const gate = new Promise(r => { release = r; });
            adminAccess.hasCommandAccess = () => gate;
            const { i, log } = fake(kind, id);
            const done = h.handleNewsInteraction(i);
            await ticks();
            assert.deepStrictEqual(log, [ack], 'the click must be acknowledged while the database read is still pending');
            release(false);
            assert.strictEqual(await done, true);
            assert.strictEqual(log.length, 2, JSON.stringify(log));
            assert.ok(refusal(log[1]) && /Only Dioreo's admins/.test(log[1]), log[1]);
        });
    }

    await check('Dismiss, past the first check, refuses a non-clicker of the tier with a private follow-up (no reply on a deferred update)', async () => {
        adminAccess.hasCommandAccess = async () => true; adminAccess.canDo = async () => false;
        manageActions.resolveAction = async () => ({ ok: false });
        const { i, log } = fake('button', 'news|dismiss|c1');
        await h.handleNewsInteraction(i);
        assert.deepStrictEqual(log, ['deferUpdate', 'followUp (private): You do not have access to act on these cards.']);
    });

    await check('Never drafted, without the draft tier, answers by editReply and saves nothing', async () => {
        adminAccess.hasCommandAccess = async () => true;
        manageActions.resolveAction = async () => ({ ok: false, message: 'No draft tier.' });
        const { i, log } = fake('select', 'news|kinds');
        await h.handleNewsInteraction(i);
        assert.deepStrictEqual(log, ['deferReply', 'editReply: No draft tier.']);
    });

    await check('a failure after the acknowledgement is answered, never left on "thinking..."', async () => {
        adminAccess.hasCommandAccess = async () => true;
        NewsCard.findById = () => ({ lean: () => Promise.resolve({ draftChangeId: '#9' }) });
        revert.revertChange = async () => { throw new Error('boom'); };
        console.error = () => {};
        const { i, log } = fake('button', 'news|undo|c1');
        assert.strictEqual(await h.handleNewsInteraction(i), true, 'a click this handler owns is consumed even when it fails');
        assert.strictEqual(log.length, 2, JSON.stringify(log));
        assert.ok(log[0] === 'deferReply' && /did not finish/.test(log[1]) && log[1].startsWith('editReply: '), log[1]);
    });

    await check('a click that cannot be acknowledged (expired token) stops there: no access read, no work, no throw', async () => {
        let asked = 0; adminAccess.hasCommandAccess = async () => { asked++; return true; };
        console.error = () => {};
        const { i, log } = fake('button', 'news|undo|c1', { failAck: true });
        assert.strictEqual(await h.handleNewsInteraction(i), true);
        assert.deepStrictEqual(log, []); assert.strictEqual(asked, 0);
    });

    await check('the box opener cannot defer, so a refusal is a plain private reply and nothing is deferred', async () => {
        adminAccess.hasCommandAccess = async () => false;
        const { i, log } = fake('button', 'news|go|c1|0');
        assert.strictEqual(await h.handleNewsInteraction(i), true);
        assert.strictEqual(log.length, 1, JSON.stringify(log));
        assert.ok(log[0].startsWith('reply (private): ') && !log.some(l => /defer/.test(l)), log[0]);
    });

    await check('an id that is not ours, a news action nobody owns, and a branch of the wrong type are left alone and never acknowledged', async () => {
        let asked = 0; adminAccess.hasCommandAccess = async () => { asked++; return true; };
        for (const [kind, id] of [['button', 'mng_act_draws_add'], ['button', 'news|nonsense|c1'], ['select', 'news|undo|c1'], ['button', 'news|make'], ['button', 'news|kinds']]) {
            const { i, log } = fake(kind, id);
            assert.strictEqual(await h.handleNewsInteraction(i), false, `${kind} ${id}`);
            assert.deepStrictEqual(log, [], `${kind} ${id} was answered`);
        }
        assert.strictEqual(asked, 0);
    });

    // ---- where the cards go: checked and said at start-up ----
    const watch = require('../bot/newsWatch');
    const { PermissionFlagsBits } = require('discord.js');
    const alerts = require('../utils/alertWebhook'); const savedAlert = alerts.sendAlert;
    const chan = (has) => ({ name: 'news-distill-dev', guild: { name: 'Dioreoland', members: { fetchMe: async () => ({}) } }, permissionsFor: () => ({ has: bit => has.includes(bit) }) });
    await check('the card channel is named in the log and no alert fires when Dioreo Admin can View and Send', async () => {
        const lines = []; const sent = []; console.log = (...a) => lines.push(a.join(' ')); alerts.sendAlert = (...a) => sent.push(a);
        try { const r = await watch.checkCardChannel({ channels: { fetch: async () => chan([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]) } }, '123'); assert.strictEqual(r.ok, true); }
        finally { console.log = realLog; alerts.sendAlert = savedAlert; }
        assert.ok(lines.some(l => /cards go to #news-distill-dev \(123\) in Dioreoland$/.test(l)), JSON.stringify(lines));
        assert.deepStrictEqual(sent, []);
    });
    await check('a channel Dioreo Admin cannot Send in is named in the log and alerted, with the fix', async () => {
        const lines = []; const sent = []; console.log = (...a) => lines.push(a.join(' ')); alerts.sendAlert = (...a) => sent.push(a);
        try { const r = await watch.checkCardChannel({ channels: { fetch: async () => chan([PermissionFlagsBits.ViewChannel]) } }, '123'); assert.deepStrictEqual([r.ok, r.missing], [false, ['SendMessages']]); }
        finally { console.log = realLog; alerts.sendAlert = savedAlert; }
        assert.ok(lines.some(l => /cannot SendMessages there/.test(l)), JSON.stringify(lines));
        assert.strictEqual(sent.length, 1); assert.ok(/NEWS_CHANNEL/.test(sent[0][1]) && /Send Messages/.test(sent[0][1]), sent[0][1]);
    });
    await check('a channel that cannot be read at all alerts and does not throw', async () => {
        const sent = []; alerts.sendAlert = (...a) => sent.push(a); console.error = () => {};
        try { const r = await watch.checkCardChannel({ channels: { fetch: async () => { throw new Error('Missing Access'); } } }, '123'); assert.strictEqual(r.ok, false); }
        finally { alerts.sendAlert = savedAlert; }
        assert.strictEqual(sent.length, 1); assert.ok(/Missing Access/.test(sent[0][1]), sent[0][1]);
    });

    console.log(`newsHandlerAck: ${passed} checks passed`);
})().catch(err => { restore(); console.error(err); process.exit(1); });
