// scripts/ownerDelete.test.js -- the owner's delete (utils/ownerDelete.js): `d owner delete …` and `/bot delete`. Runs against a stand-in for Discord's REST, never a real channel.
const assert = require('assert');
const { readOwnerCommand, parseTargets, resolveTargets, runDelete, noteText, runFromMessage, NOTE_TTL_MS, MAX_LAST } = require('../utils/ownerDelete');

const BOT = '100000000000000001', ADMIN = '100000000000000002', USER = '100000000000000003';
const GUILD = '200000000000000001', HERE = '300000000000000001', THERE = '300000000000000002';
const id = n => String(400000000000000000n + BigInt(n));
const msg = (n, author) => ({ id: id(n), author: { id: author } });
const err = (code, status) => Object.assign(new Error(String(code)), { code, status });

// Messages per channel, newest first, as Discord's history endpoint returns them.
function world() {
    return {
        [HERE]: [msg(9, BOT), msg(8, USER), msg(7, BOT), msg(6, ADMIN), msg(5, BOT), msg(4, USER)],
        [THERE]: [msg(19, BOT), msg(18, USER)],
    };
}
function fakeClient(userId, store, calls, { guilds = [] } = {}) {
    return {
        user: { id: userId }, guilds: { cache: new Set(guilds) },
        rest: {
            async get(route, opts) {
                let m;
                if ((m = route.match(/^\/channels\/(\d+)$/))) { if (store[m[1]]) return { id: m[1] }; throw err(10003, 404); }
                if ((m = route.match(/^\/channels\/(\d+)\/messages\/(\d+)$/))) { const found = (store[m[1]] || []).find(x => x.id === m[2]); if (!found) throw err(10008, 404); return found; }
                if ((m = route.match(/^\/channels\/(\d+)\/messages$/))) {
                    const all = store[m[1]] || []; const before = opts?.query?.get('before');
                    const start = before ? all.findIndex(x => x.id === before) + 1 : 0;
                    return all.slice(start, start + Number(opts?.query?.get('limit') || 50));
                }
                throw new Error(`unexpected GET ${route}`);
            },
            async delete(route) {
                const m = route.match(/^\/channels\/(\d+)\/messages\/(\d+)$/);
                const list = store[m[1]]; const i = list.findIndex(x => x.id === m[2]);
                if (i < 0) throw err(10008, 404);
                calls.push(['delete', userId, m[2]]); list.splice(i, 1);
            },
            async post(route, opts) { calls.push(['post', route, opts.body]); return { id: id(999) }; },
        },
    };
}
const setup = (opts) => { const store = world(); const calls = []; return { store, calls, client: fakeClient(BOT, store, calls, opts), admin: fakeClient(ADMIN, store, calls) }; };
const left = (store, ch) => store[ch].map(m => m.id);

const tests = [];
const t = (name, fn) => tests.push([name, fn]);

t('the owner words: owner/override/dev, then delete/d/purge, any case; anything else is not the command', () => {
    assert.deepStrictEqual(readOwnerCommand('owner delete 3'), { kind: 'delete', words: ['3'] });
    assert.deepStrictEqual(readOwnerCommand('DEV purge'), { kind: 'delete', words: [] });
    assert.deepStrictEqual(readOwnerCommand('override d 1 2'), { kind: 'delete', words: ['1', '2'] });
    assert.deepStrictEqual(readOwnerCommand('owner'), { kind: 'unknown' });
    assert.deepStrictEqual(readOwnerCommand('owner remove'), { kind: 'unknown' });
    assert.strictEqual(readOwnerCommand('draws live'), null);
    assert.strictEqual(readOwnerCommand('ownr delete'), null, 'no typo reaches it');
    assert.strictEqual(readOwnerCommand(''), null);
});
t('targets: ids, links, a #mention, a count capped at 100, and words it ignores', () => {
    const p = parseTargets([id(1), `https://discord.com/channels/${GUILD}/${THERE}/${id(2)}`, `<#${THERE}>`, '150', 'pls']);
    assert.deepStrictEqual(p.ids, [id(1)]);
    assert.deepStrictEqual(p.links, [{ channelId: THERE, messageId: id(2) }]);
    assert.deepStrictEqual(p.channelIds, [THERE]);
    assert.strictEqual(p.count, MAX_LAST);
    assert.deepStrictEqual(p.ignored, ['pls']);
    assert.strictEqual(parseTargets(['0']).count, null);
});
t('a leading server id is skipped and a leading channel id picks the channel; the rest are messages', async () => {
    const { client } = setup({ guilds: [GUILD] });
    const plan = await resolveTargets({ client, words: [GUILD, THERE, id(19), id(18)], hereChannelId: HERE });
    assert.strictEqual(plan.channelId, THERE);
    assert.deepStrictEqual(plan.messageIds, [id(19), id(18)]);
    assert.strictEqual(plan.count, null);
});
t('nothing at all means Dioreo\'s last message here', async () => {
    const { client, admin, store } = setup();
    const plan = await resolveTargets({ client, words: [], hereChannelId: HERE });
    assert.strictEqual(plan.count, 1);
    const r = await runDelete({ client, adminClient: admin, plan });
    assert.strictEqual(r.deleted, 1);
    assert.deepStrictEqual(left(store, HERE), [id(8), id(7), id(6), id(5), id(4)]);
});
t('last N counts only Dioreo\'s own messages, newest first, and leaves everyone else\'s', async () => {
    const { client, admin, store } = setup();
    const r = await runDelete({ client, adminClient: admin, plan: await resolveTargets({ client, words: ['2'], hereChannelId: HERE }) });
    assert.strictEqual(r.deleted, 2);
    assert.deepStrictEqual(left(store, HERE), [id(8), id(6), id(5), id(4)]);
});
t('must NOT: a listed message by someone else is never deleted; Dioreo Admin\'s is deleted with its own token', async () => {
    const { client, admin, store, calls } = setup();
    const r = await runDelete({ client, adminClient: admin, plan: await resolveTargets({ client, words: [id(9), id(8), id(6), id(77)], hereChannelId: HERE }) });
    assert.deepStrictEqual([r.deleted, r.notOurs, r.notFound], [2, 1, 1]);
    assert.ok(left(store, HERE).includes(id(8)), 'the user\'s message is still there');
    assert.deepStrictEqual(calls.filter(c => c[0] === 'delete').map(c => [c[1], c[2]]), [[BOT, id(9)], [ADMIN, id(6)]]);
});
t('a message link acts in its own channel', async () => {
    const { client, admin, store } = setup();
    const r = await runDelete({ client, adminClient: admin, plan: await resolveTargets({ client, words: [`https://discord.com/channels/${GUILD}/${THERE}/${id(19)}`], hereChannelId: HERE }) });
    assert.strictEqual(r.deleted, 1);
    assert.deepStrictEqual(left(store, THERE), [id(18)]);
    assert.strictEqual(store[HERE].length, 6, 'here is untouched');
});
t('a count with fewer of Dioreo\'s messages than asked deletes what there is and says so', async () => {
    const { client, admin } = setup();
    const r = await runDelete({ client, adminClient: admin, plan: await resolveTargets({ client, words: ['10'], hereChannelId: HERE }) });
    assert.strictEqual(r.deleted, 3);
    assert.match(noteText(r), /Deleted \*\*3 messages\*\*/);
    assert.match(noteText(r), /only 3 of Dioreo's/);
});
t('the note: the count, then each warning on one small line; nothing found says so', () => {
    assert.match(noteText({ deleted: 1, notFound: 0, notOurs: 0, noAccess: 0, failed: 0, ignored: [] }), /Deleted \*\*1 message\*\*\.$/);
    const many = noteText({ deleted: 0, notFound: 2, notOurs: 1, noAccess: 1, failed: 0, ignored: ['pls'] });
    assert.match(many, /Nothing deleted/);
    assert.match(many, /\n-# .*2 not found · 1 not Dioreo's · 1 where Dioreo can't see · ignored `pls`/);
    assert.match(noteText({ deleted: 0, asked: 1, foundLast: 0, notFound: 0, notOurs: 0, noAccess: 0, failed: 0, ignored: [] }), /No Dioreo message found here/);
});
t('from a message: one note in that channel, a reply that pings no one, gone after 5 seconds', async () => {
    assert.strictEqual(NOTE_TTL_MS, 5000, 'his 5s, not 10s');
    const { client, calls, store } = setup();
    const message = { id: id(500), channelId: HERE, client };
    const r = await runFromMessage(message, ['1']);
    assert.strictEqual(r.deleted, 1);
    const post = calls.find(c => c[0] === 'post');
    assert.strictEqual(post[1], `/channels/${HERE}/messages`);
    assert.deepStrictEqual(post[2].allowed_mentions, { parse: [], replied_user: false });
    assert.strictEqual(post[2].message_reference.message_id, id(500));
    assert.strictEqual(store[HERE][0].id, id(8));
    const quiet = setup();
    await runFromMessage({ id: id(501), channelId: HERE, client: quiet.client }, ['1'], { canPost: false });
    assert.ok(!quiet.calls.some(c => c[0] === 'post'), 'no note where Dioreo cannot post');
});

(async () => {
    let failures = 0;
    for (const [name, fn] of tests) {
        try { await fn(); console.log(`  PASS  ${name}`); } catch (e) { failures++; console.error(`  FAIL  ${name}\n        ${e.message}`); }
    }
    console.log(`\nownerDelete: ${tests.length - failures} passed, ${failures} failed`);
    process.exit(failures ? 1 : 0);
})();
