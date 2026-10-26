// Stateful + concurrent behaviour of the split's module-private stores. Added 2026-08-14 10:05 EDT (v3.16.0-pre) after an audit recorded these as "verified only in the weak sense that each store lives in exactly one module" — which proves ONE INSTANCE EXISTS and says nothing about whether the timing works. `scripts/handlerRouting.test.js` covers OWNERSHIP (which module answers for a custom_id); this covers what happens on the SECOND click.
//
// It needs no Discord and no Mongo, and that is a property of the code rather than a mock pile:
//   · `attachGuildPolicy` returns immediately when `interaction.guildId` is null, so a DM-shaped
//     interaction skips the whole guild-policy path.
//   · `resolvePanelActor` returns `interaction.user` immediately when the panel's target IS the
//     clicker, so the admin-override path (the only DB touch) never runs.
//   · Past the cooldown, a handler's first real act is `deferUpdate()`. A mock whose deferUpdate
//     THROWS a sentinel stops execution exactly there — after the store has been written, before
//     any database work. The sentinel is what makes "the cooldown accepted this click" observable
//     without letting the branch run to completion.
//
// ⚠️ NOT covered here, and deliberately: `/manage`'s undo and pending-confirmation Maps. Reaching them requires driving a real mutation through Mongo, so they stay on the live click-test.

const assert = require('assert');

let failures = 0;
const checks = [];
function check(name, fn) { checks.push([name, fn]); }
async function run() {
    for (const [name, fn] of checks) {
        try { await fn(); console.log(`  ✓ ${name}`); }
        catch (error) { failures++; console.error(`  ✗ ${name}\n      ${error.message}`); }
    }
}

const STOP = 'STOP_AFTER_COOLDOWN_ACCEPTED';

// A component interaction shaped like a DM click, which is what keeps the guild-policy path out.
function mockClick(customId, userId, { type = 'button' } = {}) {
    const calls = { replied: [], deferUpdate: 0, deferReply: 0 };
    return {
        calls,
        customId,
        user: { id: userId },
        guildId: null,
        channelId: null,
        client: { commands: new Map(), users: { fetch: async () => ({ id: userId }) } },
        message: { flags: { bitfield: 0 } },
        isButton: () => type === 'button',
        isStringSelectMenu: () => type === 'select',
        isModalSubmit: () => type === 'modal',
        isChannelSelectMenu: () => false,
        isRoleSelectMenu: () => false,
        isAutocomplete: () => false,
        isChatInputCommand: () => false,
        isCommand: () => false,
        async deferUpdate() { calls.deferUpdate++; throw new Error(STOP); },
        async deferReply() { calls.deferReply++; throw new Error(STOP); },
        async reply(payload) { calls.replied.push(payload); },
        async followUp(payload) { calls.replied.push(payload); },
        async editReply(payload) { calls.replied.push(payload); },
    };
}

// Drives a handler and reports which of the two outcomes happened. Anything else rethrows — a test that swallowed an unexpected error would report a cooldown as working when the branch had actually crashed on something unrelated.
async function drive(handler, interaction) {
    try {
        await handler(interaction);
    } catch (error) {
        if (error.message !== STOP) throw error;
        return 'ACCEPTED';   // reached deferUpdate/deferReply => the cooldown let it through
    }
    return interaction.calls.replied.length ? 'REJECTED' : 'FELL_THROUGH';
}

const { handleColorsButton } = require('../handlers/colors');
const { handleInteraction } = require('../handlers/router');

// --- THE 10s "REFRESH COLORS" COOLDOWN (handlers/colors.js, module-private Map) --- It exists because that button does real work — it re-downloads and re-extracts a palette — unlike the generic 600ms guard, whose window would not meaningfully throttle it.
check('colors: a second Refresh inside 10s is rejected, not re-run', async () => {
    const first = mockClick('colors_refresh_avatar_0|u-cool-1', 'u-cool-1');
    assert.strictEqual(await drive(handleColorsButton, first), 'ACCEPTED',
        'the FIRST refresh must be accepted — if this fails the test proves nothing about the second');

    const second = mockClick('colors_refresh_avatar_0|u-cool-1', 'u-cool-1');
    assert.strictEqual(await drive(handleColorsButton, second), 'REJECTED');
    assert.match(JSON.stringify(second.calls.replied), /Slow down/,
        'the rejection must tell the user to wait, not fail silently');
    assert.strictEqual(second.calls.deferUpdate, 0, 'a rejected click must not defer the message');
});

check('colors: the cooldown is keyed PER USER, not global', async () => {
    const other = mockClick('colors_refresh_avatar_0|u-cool-2', 'u-cool-2');
    assert.strictEqual(await drive(handleColorsButton, other), 'ACCEPTED',
        'a different user was blocked by someone else\'s cooldown — the Map key is wrong');
});

// --- CONCURRENCY: the check-then-write must not be interleavable --- Node is single-threaded, so this passes only because the read, the comparison and the write sit in ONE synchronous run — no `await` between them. Insert one (an admin lookup, a DB read, an await'ed log) and two clicks landing in the same tick would BOTH see an empty slot and both proceed. That is the regression this pins.
check('colors: two simultaneous Refresh clicks — exactly one passes', async () => {
    const a = mockClick('colors_refresh_avatar_0|u-race-1', 'u-race-1');
    const b = mockClick('colors_refresh_avatar_0|u-race-1', 'u-race-1');
    const results = await Promise.all([drive(handleColorsButton, a), drive(handleColorsButton, b)]);
    const accepted = results.filter(r => r === 'ACCEPTED').length;
    assert.strictEqual(accepted, 1,
        `expected exactly 1 of 2 concurrent clicks to pass, got ${accepted} (${results.join(', ')}) — ` +
        'an await between the cooldown read and its write would produce 2');
});

// --- THE GENERIC 600ms ANTI-SPAM GUARD (handlers/router.js, module-private Map) --- A click inside the window is swallowed with a bare deferUpdate() so Discord shows no "This interaction failed" toast, and is routed nowhere.
check('router: a second click inside 600ms is swallowed by deferUpdate, not routed', async () => {
    const first = mockClick('totally_unknown_button', 'u-spam-1');
    await handleInteraction(first);   // unowned id: passes the guard, falls through every handler

    const second = mockClick('totally_unknown_button', 'u-spam-1');
    await handleInteraction(second);
    assert.strictEqual(second.calls.deferUpdate, 1,
        'the swallowed click must still be acknowledged — otherwise Discord shows an error toast');
    assert.deepStrictEqual(second.calls.replied, [],
        'a swallowed click must not answer the user');
});

check('router: the 600ms window EXPIRES (the guard throttles, it does not latch)', async () => {
    await new Promise(r => setTimeout(r, 650));
    const third = mockClick('totally_unknown_button', 'u-spam-1');
    await handleInteraction(third);
    assert.strictEqual(third.calls.deferUpdate, 0,
        'still swallowed after the window elapsed — the guard is latching instead of throttling');
});

check('router: the anti-spam guard is keyed PER USER', async () => {
    const mine = mockClick('totally_unknown_button', 'u-spam-A');
    await handleInteraction(mine);
    const theirs = mockClick('totally_unknown_button', 'u-spam-B');
    await handleInteraction(theirs);
    assert.strictEqual(theirs.calls.deferUpdate, 0,
        'one user\'s click blocked another\'s — the guard is keyed globally');
});

check('router: two simultaneous clicks from one user — exactly one is routed', async () => {
    const a = mockClick('totally_unknown_button', 'u-race-2');
    const b = mockClick('totally_unknown_button', 'u-race-2');
    await Promise.all([handleInteraction(a), handleInteraction(b)]);
    const swallowed = [a, b].filter(i => i.calls.deferUpdate === 1).length;
    assert.strictEqual(swallowed, 1,
        `expected exactly 1 of 2 concurrent clicks to be swallowed, got ${swallowed} — ` +
        'an await between the guard read and its write would let both through');
});

console.log('handler state — cooldowns, keying and concurrency\n');
run().then(() => {
    console.log(failures === 0
        ? `\nAll ${checks.length} state checks passed.`
        : `\n${failures} check(s) FAILED.`);
    process.exit(failures === 0 ? 0 : 1);
});
