// utils/restGuard.js Keeps one bad Discord answer from silently switching the bot off, and says so when Discord itself is unreachable.
//
// WHY (2026-11-21 12:12 EST, after that morning's outage; Harkirat: "what should we change/add/implement/modify so we're not in the dark next time and so we can prevent it from happening again"). At 09:52 EST an idle panel's expiry edit got a 401 from Discord. @discordjs/rest reads any 401 on a call that carried the bot token as "the bot token is bad" and calls setToken(null) on the client's REST, and nothing ever sets it back: every reply failed for two hours, no alert fired, and only a restart brought it back. The direct cause is fixed (raw interaction-webhook calls send auth: false, scripts/webhookAuth.test.js). This file is the net for any other way the same wipe can happen.
//
// 1. guardRestToken(client, label): wraps the client's own rest.setToken. A wipe while the client still holds its token (client.destroy() clears client.token FIRST, so a real shutdown passes straight through) asks Discord whether the token still works, with a plain fetch that carries it, never through the wiped REST. 200: the token goes back and an error alert says what happened. 401: the token really was revoked, so it stays off (re-arming a revoked token is what Discord's invalid-request limit punishes, which is why the library wipes it) and an error alert says to reset it in the Developer Portal. No answer: tried again in 30 s, up to 5 times, then alerted.
// 2. startRestProbe(client, label): one cheap authenticated read every 5 minutes. Two failures in a row alert; the next success after that alert says it recovered. It catches what is not an error in our code at all: a Discord or network outage, or a token wiped some way the guard above does not see.
const { sendAlert } = require('./alertWebhook');

const VERIFY_URL = 'https://discord.com/api/v10/users/@me';
const RETRY_MS = 30 * 1000;
const MAX_TRIES = 5;
const PROBE_MS = 5 * 60 * 1000;
const MAX_RESTORES_PER_HOUR = 5;

// Set while a wipe is being checked or the probe is failing, read by utils/commandError.js so a failed command says "having trouble reaching Discord" rather than suggesting a retry. Clears 15 minutes after the last trouble.
const TROUBLE_MS = 15 * 60 * 1000;
let lastTroubleAt = 0;
const noteTrouble = (now = Date.now()) => { lastTroubleAt = now; };
const inTrouble = (now = Date.now()) => lastTroubleAt > 0 && now - lastTroubleAt < TROUBLE_MS;

// The token check, separate so the test can stand in for Discord. Resolves 'valid' | 'revoked' | 'unknown'.
async function checkToken(token, fetchImpl = globalThis.fetch) {
    try {
        const res = await fetchImpl(VERIFY_URL, { headers: { Authorization: `Bot ${token}` } });
        if (res.status === 200) return 'valid';
        if (res.status === 401) return 'revoked';
        return 'unknown';
    } catch {
        return 'unknown';
    }
}

function guardRestToken(client, label, { fetchImpl, retryMs = RETRY_MS, alert = sendAlert } = {}) {
    const rest = client?.rest;
    if (!rest || rest.__dioreoGuarded) return;
    const original = rest.setToken.bind(rest);
    let checking = false;
    // Restores in the last hour. More than MAX_RESTORES_PER_HOUR means something keeps provoking 401s: restoring again would keep feeding Discord invalid requests (10,000 in 10 minutes gets the bot's IP blocked), so it stops and says so.
    const restores = [];

    async function recover(tries = 1) {
        const token = client.token;
        if (!token) { checking = false; return; } // shut down meanwhile
        const verdict = await checkToken(token, fetchImpl);
        if (verdict === 'valid') {
            const now = Date.now();
            while (restores.length && now - restores[0] > 60 * 60 * 1000) restores.shift();
            if (restores.length >= MAX_RESTORES_PER_HOUR) {
                checking = false;
                console.error(`🔑 ${label}: token wiped ${restores.length + 1} times in an hour; not restoring again.`);
                alert(`${label}: bot token keeps getting wiped`, `Wiped and restored ${restores.length} times in the last hour. Something keeps getting a 401; it was left off this time so Discord is not flooded with invalid requests. Find the 401 in the log, then restart.`, 'error');
                return;
            }
            restores.push(now);
            original(token);
            checking = false;
            console.error(`🔑 ${label}: the REST token was wiped and Discord still accepts it, so it is back.`);
            alert(`${label}: bot token restored`, 'A Discord 401 made the library wipe the bot token. Discord still accepts it, so it was put back and replies work again. The 401 itself is in the log just before this line.', 'error');
            return;
        }
        if (verdict === 'revoked') {
            checking = false;
            console.error(`🔑 ${label}: Discord rejects the bot token. Replies will fail until it is reset.`);
            alert(`${label}: bot token REJECTED`, 'Discord answered 401 to the bot token itself. Every reply fails until a new token is set in the Developer Portal, put in .env and the bot restarted.', 'error');
            return;
        }
        if (tries >= MAX_TRIES) {
            checking = false;
            alert(`${label}: bot token wiped, could not check it`, `Discord did not answer ${MAX_TRIES} checks ${retryMs / 1000}s apart. Replies fail until a restart.`, 'error');
            return;
        }
        setTimeout(() => recover(tries + 1), retryMs).unref?.();
    }

    rest.setToken = (token) => {
        const result = original(token);
        if (token == null && client.token && !checking) {
            checking = true;
            noteTrouble();
            recover();
        }
        return result;
    };
    Object.defineProperty(rest, '__dioreoGuarded', { value: true });
}

function startRestProbe(client, label, { everyMs = PROBE_MS, alert = sendAlert, read } = {}) {
    let failures = 0;
    let alerted = false;
    const probe = read || (() => client.rest.get('/users/@me'));
    async function tick() {
        // Not logged in yet, or the gateway is down: the shard alerts in bot/lifecycle.js already cover that, and a REST read before login has no token to send.
        if (client.isReady && !client.isReady()) return;
        try {
            await probe();
            if (alerted) alert(`${label}: Discord reachable again`, 'The 5-minute check succeeded after failing.', 'info');
            failures = 0;
            alerted = false;
        } catch (err) {
            failures += 1;
            if (failures >= 2) noteTrouble();
            if (failures >= 2 && !alerted) {
                alerted = true;
                alert(`${label}: Discord calls failing`, `The 5-minute check failed ${failures} times in a row: ${err?.message || err}`, 'error');
            }
        }
    }
    const timer = setInterval(tick, everyMs);
    timer.unref?.();
    return { tick, stop: () => clearInterval(timer) };
}

module.exports = { guardRestToken, startRestProbe, checkToken, inTrouble, noteTrouble, _resetTrouble: () => { lastTroubleAt = 0; } };
