// scripts/textCommandServer.test.js -- B7's per-server text-command pieces (2026-10-30): the prefixes an admin may set (utils/textCommands/server.js parsePrefixes), and the spam ladder (utils/textCommands/spamLadder.js) against a stand-in database and a recording REST stub: the score, the rungs and their daily reset, the owner's exemption, the note and its deletion, the owner DM at 6 h and 12 h, a lift, and what a restart reloads. Nothing reaches Discord or Mongo.
const assert = require('assert');
const path = require('path');

const stub = (rel, exports) => {
    const file = require.resolve(path.join('..', rel));
    require.cache[file] = { id: file, filename: file, loaded: true, exports };
};
const records = new Map();
stub('models/TextPenalty', {
    updateOne: async (q, u) => { records.set(q.discordId, { discordId: q.discordId, ...u.$set }); return {}; },
    deleteOne: async q => { records.delete(q.discordId); return {}; },
    find: () => ({ lean: async () => [...records.values()] }),
});
const SERVERS = { own: { textPrefixes: ['!', '?'] }, none: null };
stub('models/GuildSettings', { findOne: q => ({ lean: async () => SERVERS[q.guildId] || null }) });
const ownerDms = [];
stub('utils/buildSubmissions', { dmOwner: async build => { ownerDms.push(typeof build === 'function' ? build() : build); return {}; } });

const { parsePrefixes, configuredPrefixes, prefixParts, prefixesFor } = require('../utils/textCommands/server');
const spam = require('../utils/textCommands/spamLadder');
const { ALLOWED_ADMIN_ID } = require('../utils/owner');

let failures = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ok   ${name}`); } catch (e) { failures++; console.error(`  FAIL ${name}\n       ${e.message}`); }
}

function fakeMessage(userId) {
    const posts = [];
    const deleted = [];
    const client = { rest: { post: async (route, o) => { posts.push({ route, body: o.body }); return { id: `note${posts.length}` }; }, delete: async route => { deleted.push(route); } } };
    return { message: { id: `m-${userId}`, author: { id: userId }, guildId: 'g1', channelId: 'c1', guild: { name: 'Dioreoland' }, client }, posts, deleted, client };
}
const HOUR = 60 * 60 * 1000;

(async () => {
    await check('prefixes: commas or spaces, any case, at most three, blank for the default', async () => {
        assert.deepStrictEqual(parsePrefixes('!, ?').prefixes, ['!', '?']);
        assert.deepStrictEqual(parsePrefixes('COD  dd').prefixes, ['cod', 'dd']);
        for (const word of ['the', 'yo', 'i', 'Hey']) assert.ok(/starts ordinary sentences/.test(parsePrefixes(`!, ${word}`).error || ''), `${word} is refused: "the draws" would post the draws`);
        assert.deepStrictEqual(parsePrefixes('d').prefixes, ['d'], 'the default letter stays allowed');
        assert.deepStrictEqual(parsePrefixes('d, d').prefixes, ['d']);
        assert.deepStrictEqual(parsePrefixes('  ').prefixes, []);
        assert.ok(parsePrefixes('a b c e').error);
        assert.ok(parsePrefixes('toolongg').error);
        for (const bad of ['/', '@d', '<d', '#', ':)', '`d', '*', '_', '~', '|', '>']) assert.ok(parsePrefixes(bad).error, bad);
        assert.deepStrictEqual(configuredPrefixes({ TEXT_PREFIXES: 'dd,diordev' }), ['dd', 'diordev']);
        assert.deepStrictEqual(configuredPrefixes({}), ['d', 'dior']);
    });

    await check('a server\'s prefix takes `d`\'s place; `dior` always stays (his middle ground, 2026-10-30)', async () => {
        assert.deepStrictEqual(prefixParts({}), { replaceable: 'd', fixed: ['dior'] });
        assert.deepStrictEqual(prefixParts({ TEXT_PREFIXES: 'dd,diordev' }), { replaceable: 'dd', fixed: ['diordev'] });
        process.env.TEXT_PREFIXES = 'd,dior';
        assert.deepStrictEqual(await prefixesFor('own'), ['!', '?', 'dior']);
        assert.deepStrictEqual(await prefixesFor('none'), ['d', 'dior']);
        assert.deepStrictEqual(await prefixesFor(null), ['d', 'dior']);
    });

    await check('the score: replies 1, warnings 3, the limit 10, over a rolling 60 s', async () => {
        const t0 = 1_000_000;
        for (let k = 0; k < 9; k++) assert.strictEqual(spam.addPoints('explorer', spam.REPLY_POINTS, t0 + k * 1000), false, `reply ${k + 1}`);
        assert.strictEqual(spam.addPoints('explorer', spam.REPLY_POINTS, t0 + 61_000), false, 'the first replies have left the window');
        assert.strictEqual(spam.addPoints('repeat', spam.REPLY_POINTS, t0), false);
        assert.strictEqual(spam.addPoints('repeat', spam.WARNING_POINTS, t0 + 100), false);
        assert.strictEqual(spam.addPoints('repeat', spam.REPLY_POINTS, t0 + 5000), false);
        assert.strictEqual(spam.addPoints('repeat', spam.WARNING_POINTS, t0 + 5100), false);
        assert.strictEqual(spam.addPoints('repeat', spam.REPLY_POINTS, t0 + 10_000), false);
        assert.strictEqual(spam.addPoints('repeat', spam.WARNING_POINTS, t0 + 10_100), true, 'same-command spam reaches it in about 10-15 s');
        assert.strictEqual(spam.addPoints('repeat', spam.REPLY_POINTS, t0 + 10_200), false, 'the score starts over');
        for (let k = 0; k < 20; k++) assert.strictEqual(spam.addPoints(ALLOWED_ADMIN_ID, spam.WARNING_POINTS, t0 + k), false, 'the owner is exempt');
    });

    await check('a penalty: the rung, the note replying to the message, the record, silence', async () => {
        const { message, posts } = fakeMessage('p1');
        const now = Date.now();
        const p = await spam.startPenalty(message, { now });
        assert.strictEqual(p.step, 1);
        assert.strictEqual(p.until - now, 60 * 1000);
        assert.ok(/^-# .*You're on cooldown for spamming! Try again <t:\d+:R>$/.test(posts[0].body.content), posts[0].body.content);
        assert.strictEqual(posts[0].body.message_reference.message_id, 'm-p1');
        assert.deepStrictEqual(posts[0].body.allowed_mentions, { parse: [], replied_user: false });
        assert.strictEqual(records.get('p1').noteMessageId, 'note1');
        assert.ok(spam.penaltyFor('p1'));
        assert.strictEqual(spam.blocksPresses(p), false, 'the 1-minute rung leaves presses working');
        assert.strictEqual(await spam.startPenalty(message), null, 'no second penalty while one runs');
        assert.strictEqual(spam.listActive().some(x => x.userId === 'p1'), true);
    });

    await check('the end of a penalty: the note deleted first, then the record', async () => {
        const { message, deleted, client } = fakeMessage('p2');
        await spam.startPenalty(message);
        await spam.endPenalty('p2', { client });
        assert.ok(deleted[0].endsWith('/channels/c1/messages/note1'), deleted[0]);
        assert.strictEqual(records.has('p2'), false);
        assert.strictEqual(spam.penaltyFor('p2'), null);
    });

    await check('the rungs climb 1 m, 5 m, 15 m, 1 h, 6 h, 12 h, cap at 12 h, and start over at the daily update', async () => {
        const { message } = fakeMessage('climber');
        const day = Date.UTC(2026, 9, 30, 10);
        const got = [];
        for (let k = 0; k < 7; k++) {
            const p = await spam.startPenalty(message, { now: day + k });
            got.push(spam.RUNGS_MS[p.step - 1] / 60000);
            await spam.endPenalty('climber');
        }
        assert.deepStrictEqual(got, [1, 5, 15, 60, 360, 720, 720]);
        const next = await spam.startPenalty(message, { now: Date.UTC(2026, 9, 31, 0, 0, 1) });
        assert.strictEqual(next.step, 1, 'a new UTC day starts at the first rung');
        await spam.endPenalty('climber');
        assert.strictEqual(spam.blocksPresses({ step: 2 }), true, 'presses get the private line from 5 minutes up');
    });

    await check('the owner is DMed at the 6 h and 12 h rungs, and only then', async () => {
        ownerDms.length = 0;
        const { message } = fakeMessage('dm');
        const day = Date.UTC(2026, 10, 2, 10);
        for (let k = 0; k < 6; k++) { await spam.startPenalty(message, { now: day + k }); await spam.endPenalty('dm'); }
        await new Promise(r => setImmediate(r));
        assert.strictEqual(ownerDms.length, 2, JSON.stringify(ownerDms));
        assert.ok(/Spam penalty: 6 h.*<@dm>.*Dioreoland/.test(ownerDms[0].content) && /Spam penalty: 12 h/.test(ownerDms[1].content), ownerDms[0].content);
    });

    await check('the owner is never penalised', async () => {
        const { message, posts } = fakeMessage(ALLOWED_ADMIN_ID);
        assert.strictEqual(await spam.startPenalty(message), null);
        assert.strictEqual(posts.length, 0);
    });

    await check('a lift is a pardon: the note and record go, and the next penalty starts at 1 m again', async () => {
        const { message, deleted, client } = fakeMessage('lifted');
        await spam.startPenalty(message);
        await spam.endPenalty('lifted');
        await spam.startPenalty(message);
        assert.strictEqual(await spam.liftPenalty('lifted', { client }), true);
        assert.ok(deleted.length >= 1);
        assert.strictEqual((await spam.startPenalty(message)).step, 1);
        assert.strictEqual(await spam.liftAll({ client }) >= 1, true);
        assert.strictEqual(spam.listActive().length, 0);
    });

    await check('a restart reloads a running penalty with its rung, and ends one that ran out while the bot was down', async () => {
        records.clear();
        records.set('still', { discordId: 'still', step: 3, until: new Date(Date.now() + HOUR), channelId: 'c1', noteMessageId: 'n1' });
        records.set('done', { discordId: 'done', step: 2, until: new Date(Date.now() - 1000), channelId: 'c1', noteMessageId: 'n2' });
        const deleted = [];
        await spam.loadPenalties({ rest: { delete: async r => { deleted.push(r); } } });
        assert.strictEqual(spam.penaltyFor('still').step, 3);
        assert.strictEqual(spam.penaltyFor('done'), null);
        assert.ok(deleted.some(r => r.endsWith('/messages/n2')), 'the old note is deleted');
        assert.strictEqual(records.has('done'), false);
        const { message } = fakeMessage('still');
        await spam.endPenalty('still');
        assert.strictEqual((await spam.startPenalty(message)).step, 4, 'the day\'s rung survived the restart');
        await spam.liftAll();
    });

    console.log(failures ? `\n${failures} failing` : '\ntextCommandServer: all passing');
    process.exit(failures ? 1 : 0);
})();
