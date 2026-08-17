// Coverage for the 2026-08-14 bot-wide extension of passive idle-timeout auto-disable --
// utils/passiveExpiry.js's hasInteractiveComponents()/cancelPanelExpiry() additions, and
// utils/sendV2Payload.js's new scheduling hook. Was /settings-only before this; see
// .claude/rules/settings-and-expiry.md and sendV2Payload.js's own header comment for the design.
//
// No real timers are ever let run for 10 minutes -- setTimeout/clearTimeout are stubbed so
// scheduling decisions are observable (was a timer armed? for which messageId? was it cancelled?)
// without the suite taking IDLE_TIMEOUT_MS to finish. This tests the DECISION logic (schedule vs.
// not, cancel vs. not), not the eventual disable-PATCH itself -- that recursive walk is already
// exercised by the existing /settings-era tests this mechanism was generalized from.

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

// --- Fake timer plumbing -------------------------------------------------------------------
// Swaps global setTimeout/clearTimeout for counters BEFORE passiveExpiry.js is required, so its
// module-level `pendingTimers` Map is driven by fakes for the whole suite. Real timers are
// restored at the end regardless of pass/fail.
const realSetTimeout = global.setTimeout;
const realClearTimeout = global.clearTimeout;
let nextHandle = 1;
const armed = new Map(); // handle -> { fn, delay }
function fakeSetTimeout(fn, delay) {
    const handle = nextHandle++;
    armed.set(handle, { fn, delay });
    return handle;
}
function fakeClearTimeout(handle) {
    armed.delete(handle);
}
global.setTimeout = fakeSetTimeout;
global.clearTimeout = fakeClearTimeout;

const passiveExpiry = require('../utils/passiveExpiry');
const { hasInteractiveComponents, schedulePanelExpiry, cancelPanelExpiry, IDLE_TIMEOUT_MS } = passiveExpiry;

check('IDLE_TIMEOUT_MS is still the documented 10-minute UX window (unchanged by this extension)', () => {
    assert.strictEqual(IDLE_TIMEOUT_MS, 10 * 60 * 1000);
});

// --- hasInteractiveComponents ----------------------------------------------------------------

check('hasInteractiveComponents: true for a top-level button', () => {
    assert.strictEqual(hasInteractiveComponents([{ type: 1, components: [{ type: 2, custom_id: 'x' }] }]), true);
});

check('hasInteractiveComponents: true for a string/user/role/mentionable/channel select, each type', () => {
    for (const type of [3, 5, 6, 7, 8]) {
        assert.strictEqual(hasInteractiveComponents([{ type: 1, components: [{ type, custom_id: 'x' }] }]), true, `type ${type}`);
    }
});

check('hasInteractiveComponents: false for a text-only container (no buttons/selects at all)', () => {
    const tree = [{ type: 17, components: [{ type: 10, content: 'hi' }, { type: 14, spacing: 2 }] }];
    assert.strictEqual(hasInteractiveComponents(tree), false);
});

check('hasInteractiveComponents: false when every interactive component is already disabled', () => {
    const tree = [{ type: 1, components: [{ type: 2, custom_id: 'x', disabled: true }] }];
    assert.strictEqual(hasInteractiveComponents(tree), false);
});

check('hasInteractiveComponents: true if AT LEAST ONE of several is enabled, even if others are disabled', () => {
    const tree = [{ type: 1, components: [{ type: 2, custom_id: 'a', disabled: true }, { type: 2, custom_id: 'b' }] }];
    assert.strictEqual(hasInteractiveComponents(tree), true);
});

check('hasInteractiveComponents: recurses into a Container -> Section -> action row nesting', () => {
    const tree = [{
        type: 17,
        components: [{ type: 9, components: [{ type: 10, content: 'x' }], accessory: { type: 2, custom_id: 'nested' } }],
    }];
    assert.strictEqual(hasInteractiveComponents(tree), true);
});

check('hasInteractiveComponents: a Section accessory THUMBNAIL (type 11, not a button) does not count', () => {
    const tree = [{ type: 17, components: [{ type: 9, components: [{ type: 10, content: 'x' }], accessory: { type: 11, media: { url: 'https://x' } } }] }];
    assert.strictEqual(hasInteractiveComponents(tree), false);
});

check('hasInteractiveComponents: empty/undefined input is false, not a throw', () => {
    assert.strictEqual(hasInteractiveComponents([]), false);
    assert.strictEqual(hasInteractiveComponents(undefined), false);
});

// --- schedulePanelExpiry / cancelPanelExpiry (fake-timer observable behavior) -----------------

function fakeInteraction(id = 'app1', token = 'tok1') {
    return { client: { rest: { patch: async () => ({}) } }, applicationId: id, token };
}

check('schedulePanelExpiry: arms exactly one fake timer for a fresh messageId', () => {
    const before = armed.size;
    schedulePanelExpiry(fakeInteraction(), 'msg-a', [{ type: 1, components: [{ type: 2, custom_id: 'x' }] }]);
    assert.strictEqual(armed.size, before + 1);
});

check('schedulePanelExpiry: a SECOND call for the SAME messageId cancels the first (net +1, not +2)', () => {
    const before = armed.size;
    schedulePanelExpiry(fakeInteraction(), 'msg-b', []);
    schedulePanelExpiry(fakeInteraction(), 'msg-b', []);
    assert.strictEqual(armed.size, before + 1, 'rescheduling must clear the old handle, not accumulate a second one');
});

check('cancelPanelExpiry: removes a pending timer outright, with nothing left armed for it', () => {
    schedulePanelExpiry(fakeInteraction(), 'msg-c', []);
    const before = armed.size;
    cancelPanelExpiry('msg-c');
    assert.strictEqual(armed.size, before - 1);
    // Cancelling again (already-gone) must be a safe no-op, not a throw.
    cancelPanelExpiry('msg-c');
});

check('cancelPanelExpiry: a messageId that was never scheduled is a safe no-op', () => {
    cancelPanelExpiry('msg-never-scheduled');
});

// --- sendV2Payload's scheduling hook ----------------------------------------------------------
// sendV2Payload requires passiveExpiry itself, so its own copy of schedulePanelExpiry/
// hasInteractiveComponents must observe the SAME fake timers -- confirmed by these tests actually
// asserting on `armed`, not just "did not throw".

const { sendV2Payload } = require('../utils/sendV2Payload');

function mockInteraction({ deferred = true, replied = false, message = undefined, patchResponse = { id: 'patched-id' } } = {}) {
    return {
        id: 'int-1', token: 'tok-1', applicationId: 'app-1',
        deferred, replied, message,
        client: {
            rest: {
                post: async () => undefined, // Discord's real light-path response: 204, no body.
                patch: async () => patchResponse,
            },
        },
    };
}

const WITH_BUTTON = [{ type: 1, components: [{ type: 2, custom_id: 'x' }] }];
const NO_COMPONENTS = [{ type: 17, components: [{ type: 10, content: 'hi' }] }];

check('sendV2Payload (initial command, deferred, PATCH path): schedules using the PATCH response id', async () => {
    const before = armed.size;
    const interaction = mockInteraction({ deferred: true, message: undefined, patchResponse: { id: 'fresh-msg-id' } });
    await sendV2Payload(interaction, WITH_BUTTON);
    assert.strictEqual(armed.size, before + 1, 'no interaction.message on the very first render, so the PATCH response id is the only source');
});

check('sendV2Payload (component re-render, deferred): schedules using interaction.message.id, not a response id', async () => {
    const before = armed.size;
    const interaction = mockInteraction({ deferred: true, message: { id: 'known-msg-id' }, patchResponse: {} });
    await sendV2Payload(interaction, WITH_BUTTON);
    assert.strictEqual(armed.size, before + 1);
});

check('sendV2Payload (component re-render, LIGHT/undeferred path): still schedules from interaction.message.id even though POST returns no body', async () => {
    const before = armed.size;
    const interaction = mockInteraction({ deferred: false, replied: false, message: { id: 'light-path-msg-id' } });
    await sendV2Payload(interaction, WITH_BUTTON);
    assert.strictEqual(armed.size, before + 1, 'the light POST path (pagination single-hop) resolves to no body, so this must come from interaction.message, not the response');
});

check('sendV2Payload: a payload with NO interactive components schedules nothing at all', async () => {
    const before = armed.size;
    const interaction = mockInteraction({ deferred: true, message: { id: 'informational-msg-id' } });
    await sendV2Payload(interaction, NO_COMPONENTS);
    assert.strictEqual(armed.size, before, 'an error/informational reply has nothing to disable -- scheduling a timer for it would just be a no-op that fires forever');
});

check('sendV2Payload: still returns the underlying REST response value unchanged (async conversion is transparent to callers)', async () => {
    const interaction = mockInteraction({ deferred: true, message: undefined, patchResponse: { id: 'return-value-check', ok: true } });
    const result = await sendV2Payload(interaction, WITH_BUTTON);
    assert.deepStrictEqual(result, { id: 'return-value-check', ok: true });
});

// --- link buttons are never disabled, and never arm a timer (added 2026-08-16 21:15 EDT) ---------
// Found while shipping `/invite`, whose public panel is link buttons ONLY: it armed a timer that ten
// minutes later disabled the install buttons on a message whose whole purpose is to be clicked later
// by whoever scrolls past. `/help` had the same defect quietly. A link button carries no custom_id,
// fires no interaction and depends on no token, so it cannot go stale and must never be disabled.
const LINK_BTN = { type: 2, style: 5, label: 'Add to Server', url: 'https://discord.com/oauth2/authorize?client_id=1' };

check('hasInteractiveComponents: FALSE for a panel whose only buttons are links (the /invite shape)', () => {
    const tree = [{ type: 17, components: [{ type: 10, content: 'x' }, { type: 1, components: [LINK_BTN, { ...LINK_BTN, label: 'Website' }] }] }];
    assert.strictEqual(hasInteractiveComponents(tree), false);
});

check('hasInteractiveComponents: still TRUE when a link button sits beside a real one (the /help shape)', () => {
    const tree = [{ type: 17, components: [{ type: 1, components: [LINK_BTN] }, { type: 1, components: [{ type: 3, custom_id: 'help_category' }] }] }];
    assert.strictEqual(hasInteractiveComponents(tree), true);
});

check('disableAllComponents: leaves a link button enabled while disabling its real siblings', () => {
    const { disableAllComponents } = passiveExpiry;
    const tree = [{ type: 17, components: [{ type: 1, components: [LINK_BTN, { type: 2, style: 1, custom_id: 'real' }] }, { type: 1, components: [{ type: 3, custom_id: 'sel' }] }] }];
    const out = disableAllComponents(tree);
    const [link, real] = out[0].components[0].components;
    assert.strictEqual(link.disabled, undefined, 'link button must not be disabled');
    assert.strictEqual(real.disabled, true, 'a real button must still be disabled');
    assert.strictEqual(out[0].components[1].components[0].disabled, true, 'a select must still be disabled');
});

check('a link button is recognised by its url even if style is missing (defensive, not style-only)', () => {
    const { disableAllComponents } = passiveExpiry;
    const styleless = { type: 2, label: 'Website', url: 'https://dioreo.app' };
    assert.strictEqual(hasInteractiveComponents([{ type: 1, components: [styleless] }]), false);
    assert.strictEqual(disableAllComponents([styleless])[0].disabled, undefined);
});

// --- cleanup -----------------------------------------------------------------------------------
run().then(() => {
    global.setTimeout = realSetTimeout;
    global.clearTimeout = realClearTimeout;
    if (failures > 0) {
        console.error(`❌ passiveExpiry (bot-wide extension): ${failures} case(s) failed`);
        process.exit(1);
    }
    console.log(`✅ passiveExpiry (bot-wide extension): ${checks.length} cases passed`);
});
