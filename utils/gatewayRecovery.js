// gatewayRecovery.js — pairs a gateway RECOVERY alert to the gateway PROBLEM alert that announced it.
//
// WHY (2026-08-06 15:00 EDT). Harkirat: there is no signal at all when the bot recovers — "I learn it broke and never that it healed." A disconnect pings his phone; the reconnect that follows 4 seconds later is `silent`, so the last thing he ever hears about an outage is that it started.
//
// ⚠️ THE OBVIOUS FIX IS THE WRONG ONE. Making 'Gateway resumed' loud would undo a correct 2026-07-20 decision: the reconnect→resume pair fires every 1-3h as routine churn, and posting it would refill the channel with exactly the noise that decision removed. Noise is not the lesser failure — it is how someone learns to stop reading the channel, and then the loud alerts stop working too.
//
// So the rule is SYMMETRY: a problem that was announced gets a recovery that is announced; a problem that was never announced stays silent. Routine churn remains invisible; the 03:00 disconnect that pinged his phone now gets an explicit "Back online" telling him how long it was actually down.
//
// Extracted from index.js so it can be TESTED. Inline, the state machine was three lines wrapped around a module-scope variable inside the old monolithic index.js (the shard listeners live in bot/lifecycle.js since 2026-08-13 17:20 EDT), reachable only by a real Discord outage — and it had already shipped one latent hole (see the shardReady note in bot/lifecycle.js). `sendAlert` and `now` are injected for exactly that reason; nothing else in here touches the network or the clock.

// ⚠️ NOT formatUptime() from alertStore — that floors to MINUTES (its smallest unit is `m`), so the common case here, a few-second blip, renders as the meaningless "restored after 0m". Downtime is the one duration in this project where seconds are the interesting part: "4s" and "25m" call for completely different reactions, and drawing that distinction is the entire point of the alert.
function formatDowntime(sec) {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
    const h = Math.floor(m / 60);
    return (m % 60) ? `${h}h ${m % 60}m` : `${h}h`;
}

// createGatewayRecovery({ sendAlert, now }) -> { noteTrouble, noteRecovered, isTroubled }
function createGatewayRecovery({ sendAlert, now = Date.now } = {}) {
    let troubleAt = null; // epoch ms of the FIRST loud problem in the current outage, or null when well

    // Called by the shardDisconnect / shardError handlers BEFORE their sendAlert, deliberately: sendAlert throttles to 1/min per (level+title), so keying the pairing off "did a webhook POST actually happen" would drop the recovery for every problem that landed inside a throttle window. The outage happened either way, and he was told about it at least once.
    //
    // Keeps the FIRST timestamp, not the latest: a flapping connection fires disconnect→error→ disconnect repeatedly, and the number worth reporting is how long the whole episode lasted, not how long since its most recent twitch.
    function noteTrouble() { if (troubleAt === null) troubleAt = now(); }

    // Returns true if it announced a recovery (so the caller can skip its routine silent alert and not log the same event twice), false if there was nothing to recover from.
    function noteRecovered(how) {
        if (troubleAt === null) return false; // routine churn — nothing was announced, stay silent
        const downSec = Math.max(1, Math.round((now() - troubleAt) / 1000));
        troubleAt = null;
        sendAlert(
            'Back online',
            `Discord connection restored after ${formatDowntime(downSec)} (${how}).`,
            'info',
            // Pings on purpose — the only 'info' alert that does. The alert this closes out pinged his phone; a resolution he has to go and look for does not answer the question the first alert made him ask.
            { ping: true },
        );
        return true;
    }

    function isTroubled() { return troubleAt !== null; }

    return { noteTrouble, noteRecovered, isTroubled };
}

module.exports = { createGatewayRecovery, formatDowntime };
