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
// LOG_WEBHOOK_URL is a SECRET (posts to Harkirat's channel) — .env only, never the repo.

// Active-ping target: Harkirat's Discord user id. Notice-worthy alerts (errors, gateway disconnects)
// include a real <@mention> so he gets a phone/desktop notification; routine info alerts do NOT ping.
const PING_USER_ID = '1139845545754632283';

const LEVEL_COLOR = { info: 0x2ecc71, warn: 0xe67e22, error: 0xe74c3c };
const LEVEL_ICON = { info: '🟢', warn: '🟠', error: '🔴' };
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
//   level: 'info' | 'warn' | 'error'  (error pings by default)
//   opts.ping: force-override whether to actively @mention (e.g. warn-level gateway disconnect → true)
function sendAlert(title, detail = '', level = 'error', opts = {}) {
    const url = process.env.LOG_WEBHOOK_URL;
    if (!url) return; // alerting disabled

    const key = `${level}:${title}`;
    const now = Date.now();
    if (now - (lastSent.get(key) || 0) < THROTTLE_MS) return; // throttled
    lastSent.set(key, now);

    const shouldPing = opts.ping ?? (level === 'error'); // errors are notice-worthy by default
    const host = process.env.NODE_ENV === 'production' ? 'GCP VM' : 'local';
    const rss = Math.round(process.memoryUsage().rss / 1024 / 1024); // MB — surfaces leaks/OOM trends
    const upMin = Math.round(process.uptime() / 60);
    const description = describe(detail).slice(0, 1800);

    const body = {
        // Ping puts the mention in `content` AND allow-lists it; non-ping suppresses ALL mentions so an
        // info alert can never accidentally notify (even if a detail string contains a stray <@...>).
        content: shouldPing ? `<@${PING_USER_ID}>` : undefined,
        allowed_mentions: shouldPing ? { users: [PING_USER_ID] } : { parse: [] },
        embeds: [{
            title: `${LEVEL_ICON[level] || LEVEL_ICON.error} ${title}`.slice(0, 256),
            description: description || undefined,
            color: LEVEL_COLOR[level] ?? LEVEL_COLOR.error,
            footer: { text: `Dior's Builds · ${host} · RSS ${rss}MB · up ${upMin}m` },
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
}

module.exports = { sendAlert };
