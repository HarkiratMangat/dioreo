// utils/textCommands/cardTimers.js -- the self-deleting text-command cards (B6, his yes 2026-10-29 14:54-14:55 EDT): a Did you mean card, a weapon or season pick and the timestamp card delete themselves 10 s after they are posted unless someone presses them; any press cancels that; opening the timestamp pop-up gives the card 5 minutes, since Discord sends nothing when a pop-up is closed unsent. In memory only, keyed by message id: a restart forgets the timers, and the cards then stay, which is the safe way to fail.
const timers = new Map();

function cancel(messageId) {
    const t = timers.get(messageId);
    if (!t) return false;
    clearTimeout(t);
    timers.delete(messageId);
    return true;
}

// `remove` deletes the message; it is the caller's (it holds the REST client and the channel).
function schedule(messageId, ms, remove) {
    if (!messageId) return;
    cancel(messageId);
    const t = setTimeout(() => {
        timers.delete(messageId);
        Promise.resolve().then(remove).catch(() => {});
    }, ms);
    t.unref?.();
    timers.set(messageId, t);
}

const pending = messageId => timers.has(messageId);

module.exports = { schedule, cancel, pending };
