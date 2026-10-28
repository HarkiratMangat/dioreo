// scripts/helpAnnouncement.test.js: `/help cmd:announcement` posts the announcements running now (2026-10-28 16:40 EDT, Harkirat: "if i type /help cmd:announcement visibility:public that it'll send the launch announcement as a public message"). Hidden by default, public on request, and the word is not taken for /manage's alias any more. The permission lookups, the announcement store and the Discord send are stubbed through require.cache so the real commands/help.js runs end to end.
const assert = require('assert');
const path = require('path');
const Module = require('module');

function stub(rel, exports) {
    const file = require.resolve(path.join(__dirname, '..', rel));
    const m = new Module(file, null);
    m.filename = file; m.loaded = true; m.exports = exports;
    require.cache[file] = m;
}

const sent = [];
const CARD = [{ type: 17, components: [{ type: 10, content: 'LAUNCH ANNOUNCEMENT' }] }];
stub('utils/sendV2Payload.js', { sendV2Payload: async (interaction, components) => { sent.push(components); } });
stub('utils/announcement.js', { buildActiveAnnouncementComponents: async () => CARD });
stub('utils/adminAccess.js', { isAdmin: async () => false, hasCommandAccess: async () => false, isOwner: () => false });
stub('utils/guildPolicy.js', { isServerAdmin: () => false });

const help = require('../commands/help');

function fake(cmd, visibility) {
    const defers = [];
    return {
        defers,
        user: { id: '42' },
        isChatInputCommand: () => true,
        options: { getString: n => (n === 'cmd' ? cmd : n === 'visibility' ? visibility : null) },
        deferred: false,
        deferReply: async o => { defers.push(o); },
    };
}

let failed = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name}\n      ${e.message}`); }
}

(async () => {
    await check('visibility:public sends the announcement as a public message', async () => {
        sent.length = 0;
        const i = fake('announcement', 'public');
        await help.execute(i);
        assert.deepStrictEqual(i.defers, [{ flags: 0 }]);
        assert.deepStrictEqual(sent, [CARD]);
    });
    await check('with no visibility it is hidden, like every /help answer', async () => {
        sent.length = 0;
        const i = fake('Announcements', null);
        await help.execute(i);
        assert.deepStrictEqual(i.defers, [{ flags: 64 }]);
        assert.deepStrictEqual(sent, [CARD]);
    });
    await check('a leading slash, the singular and any capitals all count', async () => {
        for (const word of ['/announcement', 'announcements', ' ANNOUNCEMENT ']) {
            sent.length = 0;
            await help.execute(fake(word, 'hidden'));
            assert.deepStrictEqual(sent, [CARD], word);
        }
    });
    await check('the autocomplete offers "announcement" first from two letters', async () => {
        for (const q of ['an', 'ann', 'announ', '/announcement', 'Announcements']) {
            const [first] = await help.helpChoices(q, {});
            assert.strictEqual(first.value, 'announcement', q);
            assert.ok(first.name.length <= 100, q);
        }
    });
    await check('it stays out of unrelated queries and the empty list', async () => {
        for (const q of ['', 'a', 'draw', 'manage']) {
            const values = (await help.helpChoices(q, {})).map(c => c.value);
            assert.ok(!values.includes('announcement'), q);
        }
    });
    if (failed) { console.log(`\n${failed} check(s) failed.`); process.exit(1); }
    console.log('\nAll /help announcement checks passed.');
})();
