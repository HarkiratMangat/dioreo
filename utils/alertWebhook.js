// Discord webhook alerting — pushes critical bot events (crashes, gateway trouble, DB failures,
// uncaught errors) to a private Discord channel via LOG_WEBHOOK_URL, so problems are visible in Discord
// in REAL TIME instead of only in the VM's journald logs. Added 2026-07-17 with the Render→GCP migration,
// per Harkirat's "never be in the blind again" directive. Expanded 2026-07-17 with active @pings + richer
// context (memory, stack frames, health snapshot).
//
// Hard rules (this monitors the bot, so it must never be able to hurt it):
//  - No-op if LOG_WEBHOOK_URL is unset (alerting disabled; bot unaffected).
//  - NEVER throws — every failure path is swallowed.
//  - NEVER blocks — fire-and-forget with an 8s abort timeout.
//  - Throttled per (level+title) to 1/min, so an error loop can't spam the channel or self-DoS.
//  - Persists each SENT alert to Mongo (utils/alertStore, added 2026-07-20) as an INDEPENDENT
//    fire-and-forget — the store write and the webhook POST never await each other, so a DB outage
//    can't block a Discord alert (a DB failure is itself an alert), and a Discord outage can't block the
//    log. Because of that decoupling the store-assigned id is NOT shown on the embed; it lives in /alerts.
// LOG_WEBHOOK_URL is a SECRET (posts to Harkirat's channel) — .env only, never the repo.

const { formatUptime, recordAlert } = require('./alertStore');

// Active-ping target: Harkirat's Discord user id. Notice-worthy alerts (errors, gateway disconnects)
// include a real <@mention> so he gets a phone/desktop notification; routine info alerts do NOT ping.
const PING_USER_ID = '1139845545754632283';

// Four severity levels (2026-07-17, Harkirat's call) — green/yellow/orange/red, so a self-recovering
// blip (yellow) is visually distinct from a real problem (orange/red). Pings fire on orange + red only
// (see shouldPing below): red = something broke, orange = the bot LOST the gateway; yellow = it's
// reconnecting on its own (no action needed), green = healthy/informational.
//   info    🟢 green  — Bot online, Gateway resumed, daily heartbeat
//   caution 🟡 yellow — Gateway reconnecting (transient, self-recovering)
//   warn    🟠 orange — Gateway disconnected (lost, notice-worthy)
//   error   🔴 red    — crash / uncaught / DB failure / shard error
const LEVEL_COLOR = { info: 0x2ecc71, caution: 0xf1c40f, warn: 0xe67e22, error: 0xe74c3c };
const LEVEL_ICON = { info: '🟢', caution: '🟡', warn: '🟠', error: '🔴' };
const THROTTLE_MS = 60 * 1000;
const lastSent = new Map(); // key: `${level}:${title}` -> last-sent epoch ms

// Turn an error/object/value into an actionable description: for Errors, include the message AND the
// first few stack frames (so an alert points at WHERE), fenced for readability.
function describe(v) {
    if (v == null) return '';
    if (v instanceof Error) {
        const frames = (v.stack || '').split('\n').slice(1, 4).map(s => s.trim()).filter(Boolean).join('\n');
        return `**${v.name}:** ${v.message}` + (frames ? `\n\`\`\`\n${frames}\n\`\`\`` : '');
    }
    if (typeof v === 'object') { try { return JSON.stringify(v); } catch { return String(v); } }
    return String(v);
}

// Fire-and-forget — callers do NOT await (and shouldn't, on a hot path).
//   level: 'info' | 'caution' | 'warn' | 'error'  (warn + error ping by default)
//   opts.ping: force-override whether to actively @mention (rarely needed now that warn pings by default)
function sendAlert(title, detail = '', level = 'error', opts = {}) {
    const url = process.env.LOG_WEBHOOK_URL;
    if (!url) return; // alerting disabled

    const key = `${level}:${title}`;
    const now = Date.now();
    if (now - (lastSent.get(key) || 0) < THROTTLE_MS) return; // throttled
    lastSent.set(key, now);

    // Ping on orange (warn — gateway lost) AND red (error) by default; yellow/green never ping on their
    // own. opts.ping can still force it either way.
    const shouldPing = opts.ping ?? (level === 'error' || level === 'warn');
    const host = process.env.NODE_ENV === 'production' ? 'GCP VM' : 'local';
    const rss = Math.round(process.memoryUsage().rss / 1024 / 1024); // MB — surfaces leaks/OOM trends
    const uptimeSec = Math.floor(process.uptime()); // raw seconds; formatUptime() for display, stored raw
    // Proper Discord timestamp (2026-07-17) — `<t:unix:F>` renders as a full, timezone-correct,
    // hover-expandable time in EVERY viewer's own locale, instead of relying only on the small native
    // embed-footer time. Goes in the DESCRIPTION because Discord does NOT parse `<t:>` markdown in an
    // embed footer (footer text is literal), so a `<t:>` there would show as raw text.
    const unixNow = Math.floor(now / 1000);
    const timeLine = `🕐 <t:${unixNow}:F> · <t:${unixNow}:R>`;
    const rawDesc = describe(detail).slice(0, 1800);
    const description = rawDesc ? `${rawDesc}\n\n${timeLine}` : timeLine;

    const body = {
        // Ping puts the mention in `content` AND allow-lists it; non-ping suppresses ALL mentions so an
        // info alert can never accidentally notify (even if a detail string contains a stray <@...>).
        // Include the icon + title in the content itself so the phone/desktop NOTIFICATION PREVIEW says
        // what the ping is about (the embed doesn't show in the notification), not a vague bare @mention.
        content: shouldPing ? `<@${PING_USER_ID}> ${LEVEL_ICON[level] || LEVEL_ICON.error} **${title}**` : undefined,
        allowed_mentions: shouldPing ? { users: [PING_USER_ID] } : { parse: [] },
        embeds: [{
            title: `${LEVEL_ICON[level] || LEVEL_ICON.error} ${title}`.slice(0, 256),
            description: description || undefined,
            color: LEVEL_COLOR[level] ?? LEVEL_COLOR.error,
            footer: { text: `Dior's Builds · ${host} · RSS ${rss}MB · up ${formatUptime(uptimeSec)}` },
            timestamp: new Date().toISOString(),
        }],
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
    })
        .catch(() => { /* alerting failure must never surface */ })
        .finally(() => clearTimeout(timeout));

    // Persist to the alert store — INDEPENDENT of the POST above (see hard rules). Fire-and-forget, never
    // awaited, never throws. Mirrors what was actually sent (this runs only after the throttle passed).
    recordAlert({ level, title, detail: rawDesc, pinged: shouldPing, host, rssMb: rss, uptimeSec });
}

module.exports = { sendAlert };
