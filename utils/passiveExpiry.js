// utils/passiveExpiry.js
const { Routes } = require('discord.js');

// PASSIVE panel auto-disable (2026-07-18) -- replaces the old REACTIVE expiry /settings used to
// have: an `expiresAt` deadline encoded in every custom_id, checked on click, that could only ever
// reply "this panel expired" AFTER a stale click already failed -- the buttons themselves stayed
// visually live forever. This fires with NO click at all: a `setTimeout` scheduled at render time
// silently disables the message's own buttons/selects once it's gone idle, so there's nothing left
// to click that could fail in the first place.
//
// Design (corrected same session after two earlier wrong claims about Discord's token lifetime --
// see CLAUDE.md's "Known open issues" for the full trail): every button click generates its OWN
// fresh ~15-minute interaction token, completely independent of the message's age. So this holds
// each render's own token and uses it directly (bypassing the normal interaction-reply lifecycle,
// same raw-REST pattern sendV2Payload already uses) to PATCH the message once idle. 10 minutes was
// chosen as a plain self-imposed UX window, comfortably inside that ~15-minute token lifetime --
// it is NOT derived from any Discord-side ceiling.
//
// Sliding, not fixed: ANY new interaction on the message re-calls schedulePanelExpiry, which cancels
// whatever timer was pending and reschedules fresh using the NEW interaction's own token -- actively
// using the panel keeps it alive indefinitely; walking away for 10 minutes straight is what goes
// inert. This deliberately replaces the old fixed-15-min-from-creation design, not an addition to it.
//
// In-memory only, keyed by messageId -- a bot restart mid-countdown just loses the pending timer
// (the panel silently stays clickable a bit longer than intended, never shorter). Accepted at this
// scale, per Harkirat's explicit call -- not worth a persistent store for a 10-minute UX nicety.
const pendingTimers = new Map();

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

// Recursively walks a Components V2 tree (containers/sections/action rows all nest via their own
// `components` array) and marks every button (type 2) or select menu (type 3) as disabled. Returns
// a new array -- never mutates the caller's own `components`, since that same array may still be
// in use elsewhere (e.g. re-sent verbatim on the next render before this timer ever fires).
function disableAllComponents(components) {
    return components.map(component => {
        const clone = { ...component };
        if (clone.type === 2 || clone.type === 3) clone.disabled = true;
        if (Array.isArray(clone.components)) clone.components = disableAllComponents(clone.components);
        if (clone.accessory) clone.accessory = disableAllComponents([clone.accessory])[0];
        return clone;
    });
}

// Call once per render of a passively-expiring panel (initial command AND every button/select
// re-render), right after the message is sent/edited. `components` must be the EXACT array just
// sent -- it's what gets cloned-and-disabled if the timer ever actually fires.
function schedulePanelExpiry(interaction, messageId, components) {
    const existing = pendingTimers.get(messageId);
    if (existing) clearTimeout(existing);

    const { client, applicationId, token } = interaction;
    const timeoutHandle = setTimeout(async () => {
        pendingTimers.delete(messageId);
        try {
            await client.rest.patch(Routes.webhookMessage(applicationId, token, '@original'), {
                body: { components: disableAllComponents(components) }
            });
        } catch (err) {
            // Best-effort UX nicety, not a critical path -- the token may already be dead (bot
            // restarted since this render, or the message was deleted), and there's no user to
            // notify either way. Log and move on rather than let this throw into an unhandled
            // rejection from inside a bare setTimeout callback.
            console.error('Passive panel expiry: failed to disable components (token likely expired or message gone):', err?.message || err);
        }
    }, IDLE_TIMEOUT_MS);

    pendingTimers.set(messageId, timeoutHandle);
}

// Cancels a pending timer without scheduling a replacement -- for a caller that knows a message
// just changed (proving it wasn't idle) but can't supply a fresh `components` snapshot to
// reschedule from (see utils/sendV2Payload.js's header comment on why: some render paths, notably
// handlers/manage.js's confirm/cancel/undo micro-prompts, PATCH the message via discord.js's raw
// `interaction.update()` rather than sendV2Payload, so they never flow through schedulePanelExpiry
// on their own). Cancelling outright (rather than leaving the old timer live) prevents it firing
// mid-prompt and overwriting whatever is CURRENTLY on screen with a disabled clone of the PREVIOUS
// render -- a visible, confusing regression, and worse than simply having no countdown running.
function cancelPanelExpiry(messageId) {
    const existing = pendingTimers.get(messageId);
    if (existing) {
        clearTimeout(existing);
        pendingTimers.delete(messageId);
    }
}

// Recursively checks a Components V2 (or plain action-row) tree for at least one button (type 2)
// or select menu (3 = string, 5 = user, 6 = role, 7 = mentionable, 8 = channel) that isn't ALREADY
// disabled. Mirrors disableAllComponents' own tree-walk exactly, so anything one function reaches
// the other reaches too. Used by sendV2Payload to decide whether a render is even worth scheduling
// a timer for -- an informational message with no components (an error reply, a "not an admin"
// bounce) has nothing to disable, and scheduling one anyway would just be a timer that fires and
// no-ops forever.
function hasInteractiveComponents(components) {
    return (components || []).some(component => {
        if (!component) return false;
        const INTERACTIVE_TYPES = new Set([2, 3, 5, 6, 7, 8]);
        if (INTERACTIVE_TYPES.has(component.type) && !component.disabled) return true;
        if (Array.isArray(component.components) && hasInteractiveComponents(component.components)) return true;
        if (component.accessory && hasInteractiveComponents([component.accessory])) return true;
        return false;
    });
}

module.exports = { schedulePanelExpiry, cancelPanelExpiry, hasInteractiveComponents, disableAllComponents, IDLE_TIMEOUT_MS };
