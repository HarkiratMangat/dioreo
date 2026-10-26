// alertExplain.js — turns an alert into PLAIN LANGUAGE, for a reader who is not debugging.
//
// WHY THIS EXISTS (2026-08-06 14:54 EDT): a live `🔴 Gateway shard error` alert read, in full:
//     **Error:** Unexpected server response: 503
//     ```
//     at ClientRequest.<anonymous> (node_modules/ws/lib/websocket.js:930:7)
//     ```
// Harkirat, on receiving it: *"absolutely no clue what it meant"*. That alert is technically perfect and practically useless — it says WHERE in the websocket library the failure surfaced, and nothing about whether the bot is down, whether users are affected, or whether he needs to get up and do something. An alert exists to drive a DECISION; one that can't be read can't drive one.
//
// So every alert now carries three plain-sentence answers, and the stack trace moves BELOW them:
//   what     — what actually happened, in words, no jargon
//   selfFix  — does this resolve on its own?  ← the single most valuable line; it is the difference
//              between "ignore this" and "get up"
//   action   — what (if anything) Harkirat should do
//
// ⚠️ THE TECHNICAL DETAIL IS NEVER REMOVED, only demoted. The stack frames are what make an alert debuggable later; the failure was that they came FIRST and alone. Plain language on top, evidence underneath — both readers served, neither at the other's expense.
//
// ⚠️ Keep the wording free of jargon that only makes sense if you already know the answer. "The websocket dropped" explains nothing to someone asking what a websocket is. "Discord's connection blipped" does. If a line needs a term of art, define it inline in the same sentence.

// Discord gateway close codes that are NOT self-healing — the connection will never come back on its own, because the problem is the credentials or the app's configuration, not the network. Separating these out is the whole point of the selfFix line: 4004 and 4014 look identical to a transient blip in the raw alert (both are just "disconnected, close code NNNN"), but one clears itself in seconds and the other means the bot is DOWN until someone changes something. Source: Discord Gateway docs.
const FATAL_CLOSE_CODES = {
    4004: 'the bot token was rejected as invalid',
    4010: 'the shard configuration sent to Discord was invalid',
    4011: 'the bot has grown large enough that Discord requires it to be split across multiple shards',
    4012: 'the gateway version the bot asked for is no longer supported',
    4013: 'the bot asked for an intent that does not exist',
    4014: 'the bot asked for a privileged intent it has not been granted in the Developer Portal',
};

// Network-level causes worth naming, keyed by a fragment that appears in the error text. These are the ordinary ways the internet fails, and every one of them is transient — which is exactly the fact the raw message fails to convey. `503` was the live case that prompted this whole module.
const NETWORK_CAUSES = [
    [/\b503\b|Service Unavailable/i, "Discord's servers briefly refused the connection (a 503 — their side was overloaded or restarting)"],
    [/\b502\b|Bad Gateway/i, "Discord's servers returned an error while the connection was being set up (a 502 — a problem on their side)"],
    [/\b429\b|rate limit/i, 'Discord asked the bot to slow down (a rate limit)'],
    [/ECONNRESET/i, 'the connection was cut off mid-conversation'],
    [/ETIMEDOUT|ESOCKETTIMEDOUT|timed? ?out/i, 'the connection took too long and gave up'],
    [/ENOTFOUND|EAI_AGAIN|getaddrinfo/i, "the VM briefly could not look up Discord's address (a DNS hiccup)"],
    [/ECONNREFUSED/i, 'the connection was refused outright'],
];

// The bot survives everything in here — it stays running and keeps answering commands. Stated explicitly because "🔴 error" reads as "the bot is down" when usually it is not.
const STILL_RUNNING = 'The bot itself never stopped running — it kept answering commands throughout.';

function networkCause(detail) {
    for (const [re, phrase] of NETWORK_CAUSES) if (re.test(detail)) return phrase;
    return null;
}

// Pull the close code out of a shardDisconnect detail string ("... close code 4004)"). Returns a number or null. Deliberately tolerant of the surrounding wording so a future rephrase of the detail line does not silently turn every disconnect back into "probably transient".
function closeCode(detail) {
    const m = /close code (\d{4})/i.exec(detail || '');
    return m ? Number(m[1]) : null;
}

// DISPLAY NAMES — presentation only. The canonical `title` stays exactly as the call sites pass it, because it is a KEY: sendAlert throttles on `${level}:${title}`, AlertLog stores it, and `/alerts` reads it back. Renaming the key would fragment the stored history and silently reset every throttle. So the human label is applied to the embed title and the notification line ONLY.
//
// This matters more than it looks: the notification content line is `<@user> 🔴 **<title>**`, which on a phone at 03:00 is the ENTIRE message — the embed is not shown in a push notification. "Gateway shard error" is the jargon that started this; "Discord connection error" is the same fact in words.
const DISPLAY_TITLE = {
    'Gateway shard error': 'Discord connection error',
    'Gateway disconnected': 'Discord connection lost',
    'Gateway resumed': 'Discord connection restored',
    'MongoDB connection failure': 'Database unreachable',
    'Uncaught exception': 'Bot crashed and restarted itself',
    'Unhandled promise rejection': 'A background task failed',
    'Discord client error': 'Discord library error',
    'Startup refused: instance already running': 'Second copy blocked from starting',
    // 'Bot online', 'Back online', 'Reconnecting to Discord' and 'Daily health check' are already plain English — an entry mapping them to themselves would just be a line to keep in sync.
};

function displayTitle(title) { return DISPLAY_TITLE[title] || title; }

// explain(title, detail) -> { what, selfFix, action } | null
//
// Returns null for titles with nothing useful to add (a plain-language explanation of "Bot online" is just the title again). null means "render this alert exactly as before" — the layer is additive and an unknown title must never lose its technical detail.
function explain(title, detail = '') {
    const d = String(detail || '');

    switch (title) {
        case 'Gateway shard error': {
            const cause = networkCause(d);
            return {
                what: `Something went wrong on the bot's live connection to Discord${cause ? ` — ${cause}` : ''}. ${STILL_RUNNING}`,
                selfFix: 'Almost always yes, within a few seconds — the connection re-establishes itself automatically.',
                // ⚠️ Every alert name quoted in this file must be a DISPLAY_TITLE, i.e. what he will actually see. An earlier draft pointed at "Discord connection lost" while the alert still displayed as "Gateway disconnected" — sending someone to look for a message that does not exist under that name is the same failure this module exists to fix.
                action: 'Nothing, unless a "Discord connection lost" alert follows and no "Back online" arrives after it.',
            };
        }

        case 'Gateway disconnected': {
            const code = closeCode(d);
            const fatal = code && FATAL_CLOSE_CODES[code];
            if (fatal) {
                return {
                    what: `The bot's connection to Discord was closed because ${fatal}. This will NOT come back on its own.`,
                    selfFix: 'No. The bot will keep retrying and keep failing until the underlying setting is fixed.',
                    action: code === 4004
                        ? 'The bot token in the VM\'s .env is wrong or has been reset. Regenerate it in the Discord Developer Portal and redeploy.'
                        : 'Fix the app configuration in the Discord Developer Portal, then restart the bot on the VM.',
                };
            }
            const cause = networkCause(d);
            return {
                what: `The bot lost its live connection to Discord${cause ? ` — ${cause}` : ''}, so it is not receiving commands right now.`,
                selfFix: 'Usually yes — it reconnects on its own, normally within seconds.',
                action: 'Wait for the "Back online" alert. If it does not arrive within a few minutes, check the VM.',
            };
        }

        case 'Reconnecting to Discord':
            return {
                what: `The connection to Discord dropped and is being re-established. ${STILL_RUNNING}`,
                selfFix: 'Yes — this is the bot fixing itself, and it is the normal, expected response to a blip.',
                action: 'Nothing.',
            };

        // 'Gateway resumed' shares this branch. It is normally `silent` (logged, never posted), so it renders only if that ever changes — but the two tables in this file must not drift apart: a title with a display name and no explanation would print a polished heading above a bare stack trace, which is half of the original problem. The unit test asserts they stay in step.
        case 'Back online':
        case 'Gateway resumed':
            return {
                what: 'The connection to Discord is working again, and the bot is receiving commands normally.',
                selfFix: 'Already resolved — this alert exists to close out the problem alert above it.',
                action: 'Nothing.',
            };

        case 'MongoDB connection failure':
            return {
                what: 'The bot cannot reach its database. It is still online and will still respond, but any command that '
                    + 'looks something up or saves something (loadouts, draws, the calendar, settings) will fail until this clears.',
                selfFix: 'Sometimes — a brief network problem clears on its own. An Atlas outage or an expired access rule does not.',
                action: 'If it does not clear within a few minutes, check MongoDB Atlas: is the cluster up, and is the VM\'s IP still allow-listed?',
            };

        case 'Uncaught exception':
            return {
                what: 'A bug crashed the bot process — this is a real fault in the code, not a network problem.',
                selfFix: 'The process is restarted automatically by systemd, so the bot comes back within seconds. The BUG does not fix itself.',
                action: 'The bot is fine to leave running. The error below needs a real fix — worth filing.',
            };

        case 'Unhandled promise rejection':
            return {
                what: 'A background operation failed and nothing was set up to handle the failure. This is a bug in the code, '
                    + `not a problem with Discord or the network. ${STILL_RUNNING}`,
                selfFix: 'The bot keeps running, but the specific thing that failed did not complete, and it will fail again the same way.',
                action: 'Nothing urgent. The error below needs a real fix — worth filing.',
            };

        case 'Discord client error': {
            const cause = networkCause(d);
            return {
                what: `The Discord library reported an error${cause ? ` — ${cause}` : ''}. ${STILL_RUNNING}`,
                selfFix: 'Usually yes, if it is a network problem. A repeating one is not.',
                action: 'Nothing for a one-off. If this repeats within minutes, it is worth investigating.',
            };
        }

        case 'Startup refused: instance already running':
            return {
                what: 'A second copy of the bot tried to start while one was already running, and it stopped itself on purpose. '
                    + 'Two copies on the same token make Discord send commands to whichever one it feels like, so this guard exists to prevent that.',
                selfFix: 'No — but nothing is broken. The original copy is still running and serving commands normally.',
                action: 'Check whether an old process is still alive on the VM (scripts/vmstatus.sh). Usually this means a deploy '
                    + 'started a new copy before the old one had fully exited.',
            };

        // Deliberately no entry: 'Bot online' and 'Daily health check' already say exactly what they mean in their own titles and bodies. Adding an explanation block to them would be noise, and noise is what trains someone to stop reading alerts.
        default:
            return null;
    }
}

module.exports = { explain, displayTitle, DISPLAY_TITLE, FATAL_CLOSE_CODES };
