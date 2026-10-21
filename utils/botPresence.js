// The bot's presence: one activity card whose top line AND verb rotate every minute: "Watching" the season countdown, "Competing in" the ranked countdown (2026-10-21 19:41 EDT, Harkirat: "can we change the watching and competing in every minute as well?"), then "Watching" /help. The second line stays the install line. First version (2026-10-21 19:31 EDT, Harkirat: "lets do the season and countdown as the main line and Website: dioreo.app as the second line, make the first line swap between the season countdown and /help").
//
// Why ONE card with a `state` line and not a custom status beside it: tried on the dev bot 2026-10-21 18:49-19:23 EDT. A custom status (type 4) hid the Watching card whichever order the two were listed in, and a bot cannot set `status_display_type` (Discord allows bots only name, state, type and url), so the member list always shows the top line (`name`) and only the profile card shows `state`.
//
// ⚠️ After a restart Discord kept showing the PREVIOUS presence for a few minutes on those runs. A presence that has not changed yet right after a deploy is that lag, not a bug.
const { ActivityType } = require('discord.js');

const HELP_LINE = '/help';
// The second line (2026-10-21 19:40 EDT, Harkirat: "instead of website, let's do Add Dioreo · dioreo.app/install"). Not clickable: a bot cannot set `state_url`.
const INSTALL_LINE = 'Add Dioreo · dioreo.app/install';
// How long each top line stays up. Discord caps presence updates per gateway session (op 3), so this stays at a minute or more.
const ROTATE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// "Season 7 · 21 days left" (whole days left, rounded DOWN, so it never promises a day that is not there; under a day reads "last day"), or null when there is nothing to count down to: no end date, a TBD end, or a season already over. The season end is the Battle Pass end, the same date /season end counts down to. The label is the "Season N" part of the Battle Pass title, the field /manage keeps current with the season dates (currentSeasonTitle is the patch-notes title and can lag a season behind: on the dev data it still read "Season 7" while the Battle Pass read "Season 9 2026"); the season title is only the fallback. Just the "Season N" part, so a long title never crowds the member list.
function seasonCountdownLine(doc, now = Date.now()) {
    if (!doc || doc.bpEndTBD || !doc.bpEnd) return null;
    const msLeft = new Date(doc.bpEnd).getTime() - now;
    if (!(msLeft > 0)) return null;
    const days = Math.floor(msLeft / DAY_MS);
    const label = [doc.bpTitle, doc.currentSeasonTitle].map(t => (t || '').match(/season\s*\d+/i)?.[0]).find(Boolean);
    const season = label ? label.replace(/^season\s*/i, 'Season ') : 'Season';
    if (days === 0) return `${season} · last day`;
    return `${season} · ${days} ${days === 1 ? 'day' : 'days'} left`;
}

// "Ranked Series 3 · 21 days left", the same rules as the season line, from the ranked end date /season end shows. The label is the "Ranked Series N" part of the ranked title.
function rankedCountdownLine(doc, now = Date.now()) {
    if (!doc || doc.rankEndTBD || !doc.rankEnd) return null;
    const msLeft = new Date(doc.rankEnd).getTime() - now;
    if (!(msLeft > 0)) return null;
    const days = Math.floor(msLeft / DAY_MS);
    const label = (doc.rankTitle || '').match(/ranked\s*series\s*\d+/i)?.[0]?.replace(/^ranked\s*series\s*/i, 'Ranked Series ') || 'Ranked';
    if (days === 0) return `${label} · last day`;
    return `${label} · ${days} ${days === 1 ? 'day' : 'days'} left`;
}

// The turns, in order. Each returns { name, type } or null to be skipped this round (no date, TBD, over); /help never skips, so a round always lands somewhere.
const TURNS = [
    doc => { const name = seasonCountdownLine(doc); return name && { name, type: ActivityType.Watching }; },
    doc => { const name = rankedCountdownLine(doc); return name && { name, type: ActivityType.Competing }; },
    () => ({ name: HELP_LINE, type: ActivityType.Watching }),
];

// The presence for one top line and verb. Also passed to the Client at login (index.js), so the very first IDENTIFY already carries it.
function buildPresence(topLine = HELP_LINE, type = ActivityType.Watching) {
    return {
        status: 'online',
        activities: [{ name: topLine, state: INSTALL_LINE, type }],
    };
}

// Moves to the next turn every ROTATE_MS, starting with the season. The season doc is re-read each tick, so a date changed in /manage shows up within a minute. Never throws: a failed read leaves only /help.
function startPresenceRotation(client, { loadSeason, intervalMs = ROTATE_MS } = {}) {
    const load = loadSeason || (() => require('../models/SeasonalData').findOne({ docType: 'global' }, 'currentSeasonTitle bpTitle bpEnd bpEndTBD rankTitle rankEnd rankEndTBD').lean());
    let next = 0;
    const tick = async () => {
        let doc = null;
        try { doc = await load(); } catch (err) { console.error('⚠️ Presence: season read failed:', err.message); }
        let turn = null;
        for (let i = 0; i < TURNS.length && !turn; i++) {
            turn = TURNS[next](doc);
            next = (next + 1) % TURNS.length;
        }
        try { client.user?.setPresence(buildPresence(turn.name, turn.type)); } catch (err) { console.error('⚠️ Presence update failed:', err.message); }
        return turn;
    };
    tick();
    const timer = setInterval(tick, intervalMs);
    timer.unref?.();
    return { tick, stop: () => clearInterval(timer) };
}

module.exports = { seasonCountdownLine, rankedCountdownLine, buildPresence, startPresenceRotation, HELP_LINE, INSTALL_LINE, ROTATE_MS };
