// utils/helpSearch.js -- /help's `cmd:` search for the words a confused person actually types (Harkirat, 2026-10-25 23:05 EDT: "/help is where someone goes when they're confused so it's very likely they'll ... search layman terms they're more familiar with, rather than jargon from the bot. so we need to provide that assistance to them by improving our search system." His examples: "weapon" should find /autobuild too, "create" /colors and /timestamp, "profile" /settings and /colors).
//
// HOW IT RANKS. Every entry (a slash command, or a right-click app) carries four bags of words, each with a weight: its name (10), a hand-written list of everyday words for it (WORDS, 6), its aliases from commands/help.js (5), and the description and option descriptions it is registered with (2, read from the real builders so they cannot drift). Each typed word scores its best match in each entry: exact, the start of a word (3+ letters, 60%), one or two letters off (utils/search.js typoDistance, 50%), or the same with look-alikes folded (0/o, 1/l/i, 5/s, 50%). Common words ("how", "my", "see"...) are dropped first. Entries score the sum over the typed words; ties keep the directory's order.
//
// WHY A HAND LIST AND NOT SOMETHING CLEVERER: autocomplete must answer inside Discord's three seconds, the whole index is about thirty entries, and the failure he hit was vocabulary, not ranking. A list a person wrote, checked by tests against his own examples (scripts/helpSearch.test.js), is the part that fixes vocabulary.
const fs = require('fs');
const path = require('path');
const { normalizeForSearch, typoDistance, foldLookalikes } = require('./search');

const STOP = new Set(['a', 'an', 'the', 'i', 'me', 'my', 'mine', 'to', 'for', 'of', 'in', 'on', 'at', 'and', 'or', 'is', 'are', 'can', 'do', 'does', 'how', 'what', 'where', 'which', 'who', 'why', 'want', 'need', 'see', 'show', 'get', 'view', 'look', 'find', 'use', 'it', 'this', 'that', 'with', 'about', 'some', 'any', 'please', 'command', 'commands', 'bot', 'dioreo']);

// Everyday words per entry. Write the words a player would use, not the bot's own terms; the name and description cover those.
const WORDS = {
    '/gunsmith mp': ['weapon', 'gun', 'loadout', 'build', 'class', 'attachment', 'meta', 'best', 'setup', 'multiplayer', 'mp', 'gunsmith', 'code', 'ranked', 'strongest'],
    '/gunsmith dmz': ['weapon', 'gun', 'loadout', 'build', 'attachment', 'dmz', 'extraction', 'gunsmith', 'meta', 'setup'],
    '/draws': ['draw', 'lucky', 'gacha', 'crate', 'spin', 'banner', 'reward', 'skin', 'new', 'returning', 'store'],
    '/draw prices': ['price', 'cost', 'cp', 'spend', 'money', 'expensive', 'much', 'region', 'spin', 'draw'],
    '/draw calculator': ['calculate', 'calculator', 'cost', 'cp', 'budget', 'much', 'save', 'plan', 'bundle', 'money', 'spend', 'afford'],
    '/calendar': ['calendar', 'event', 'schedule', 'timeline', 'upcoming', 'mode', 'playlist', 'date', 'week', 'season'],
    '/today': ['today', 'now', 'daily', 'live', 'new', 'leaving', 'reset', 'happening', 'current'],
    '/remind': ['remind', 'reminder', 'notify', 'notification', 'alert', 'dm', 'ping', 'message', 'tell', 'forget'],
    '/patch notes': ['patch', 'update', 'nerf', 'buff', 'balance', 'change', 'notes', 'fix'],
    '/season end': ['season', 'end', 'battle', 'pass', 'bp', 'ranked', 'deadline', 'expire', 'finish', 'left', 'countdown'],
    '/colors': ['color', 'colour', 'accent', 'theme', 'profile', 'avatar', 'banner', 'nameplate', 'deco', 'palette', 'hex', 'create', 'pfp'],
    '/timestamp': ['time', 'date', 'timestamp', 'clock', 'timezone', 'convert', 'countdown', 'when', 'create', 'make', 'schedule'],
    '/invite': ['invite', 'add', 'install', 'server', 'share', 'link', 'app', 'friend'],
    '/settings': ['settings', 'preferences', 'profile', 'change', 'set', 'timezone', 'private', 'public', 'hide', 'default', 'visibility', 'account', 'currency', 'region'],
    '/admin': ['server', 'admin', 'moderator', 'mod', 'permission', 'channel', 'role', 'private', 'public', 'hide', 'owner'],
    '/bot analytics': ['stats', 'usage', 'health', 'uptime', 'errors', 'logs', 'analytics', 'alerts', 'changes'],
    '/bot access': ['admin', 'access', 'permission', 'grant', 'allowlist'],
    '/bot servers': ['server', 'reset', 'rules'],
    '/bot hotpatch': ['update', 'reload', 'deploy', 'restart', 'code'],
    '/embed': ['embed', 'json', 'render', 'preview', 'design', 'components', 'test'],
    '/manage emojis': ['emoji', 'icon', 'sync', 'upload'],
    '/autobuild': ['weapon', 'gun', 'loadout', 'build', 'screenshot', 'image', 'picture', 'scan', 'read', 'create', 'add', 'import'],
    '/manage': ['manage', 'edit', 'add', 'data', 'database', 'announcement', 'update', 'create', 'delete'],
    'View Colors': ['right', 'click', 'app', 'apps', 'menu', 'hold', 'profile', 'color', 'colour', 'member', 'user', 'avatar', 'someone'],
    'Convert Times': ['right', 'click', 'app', 'apps', 'menu', 'hold', 'time', 'date', 'convert', 'message', 'timezone'],
    'Add to Calendar': ['right', 'click', 'app', 'apps', 'menu', 'message', 'add', 'event'],
    'Add to Draws': ['right', 'click', 'app', 'apps', 'menu', 'message', 'add', 'draw'],
    'Add to Patch Notes': ['right', 'click', 'app', 'apps', 'menu', 'message', 'add', 'patch'],
    'Autobuild Gunsmith': ['right', 'click', 'app', 'apps', 'menu', 'message', 'screenshot', 'weapon', 'build'],
};

// Plural/verb endings off, so "weapons", "reminders", "creating" meet "weapon", "reminder", "create".
function stem(word) {
    let w = word;
    if (w.length > 4 && w.endsWith('ies')) w = `${w.slice(0, -3)}y`;
    else if (w.length > 4 && w.endsWith('ing')) w = w.slice(0, -3);
    else if (w.length > 3 && w.endsWith('ed')) w = w.slice(0, -2);
    else if (w.length > 3 && /(ch|sh|x|z)es$/.test(w)) w = w.slice(0, -2);
    else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
    return w;
}
const words = (text) => String(text || '').toLowerCase().replace(/[^a-z0-9&\s]/g, ' ').split(/\s+/).filter(w => w && !STOP.has(w)).map(stem);

// Every registered command's description and option descriptions, by '/name', '/name sub' or right-click name, read once from the real builders.
let described = null;
function descriptions() {
    if (described) return described;
    described = new Map();
    const dir = path.join(__dirname, '..', 'commands');
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
        let json;
        try { json = require(path.join(dir, f)).data?.toJSON?.(); } catch { continue; }
        if (!json) continue;
        if (json.type && json.type !== 1) { described.set(json.name, ''); continue; }
        const subs = (json.options || []).filter(o => o.type === 1);
        // `visibility` is on nearly every command with the same words, so it would make "hide my responses" match everything.
        const optText = (opts) => (opts || []).filter(o => o.name !== 'visibility').map(o => `${o.name} ${o.description || ''}`).join(' ');
        if (subs.length) for (const s of subs) described.set(`/${json.name} ${s.name}`, `${s.description || ''} ${optText(s.options)}`);
        else described.set(`/${json.name}`, `${json.description || ''} ${optText(json.options)}`);
    }
    return described;
}

function bagsFor(entry) {
    return [
        [10, words(entry.name.replace(/^\//, ''))],
        [6, (WORDS[entry.name] || []).map(stem)],
        [5, (entry.aliases || []).flatMap(words)],
        [2, words(descriptions().get(entry.name))],
    ];
}

function wordScore(q, w) {
    if (q === w) return 1;
    if (q.length >= 3 && w.startsWith(q)) return 0.6;
    if (Number.isFinite(typoDistance(q, w)) && w.length >= 4) return 0.5;
    if (foldLookalikes(q) === foldLookalikes(w)) return 0.5;
    return 0;
}

// The entries a query names, best first. `entries`: [{ name, category, aliases, app }] in directory order. An empty query returns them all, in that order.
function rank(query, entries) {
    const q = words(query);
    const whole = normalizeForSearch(String(query || '').replace(/^\//, ''));
    if (!whole) return entries.slice();
    const scored = entries.map((e, i) => {
        let score = normalizeForSearch(e.name.replace(/^\//, '')).includes(whole) ? 12 : 0;
        // An alias typed whole is what that command is called ("server" -> /admin), so it outranks a name that merely contains the word.
        if ((e.aliases || []).some(a => normalizeForSearch(a) === whole)) score += 8;
        for (const qw of q) {
            let best = 0;
            for (const [weight, bag] of bagsFor(e)) for (const w of bag) best = Math.max(best, weight * wordScore(qw, w));
            score += best;
        }
        return { e, i, score };
    }).filter(s => s.score > 0);
    scored.sort((a, b) => b.score - a.score || a.i - b.i);
    return scored.map(s => s.e);
}

// What a suggestion shows: the name alone. A short line after each was tried and dropped the same night (Harkirat, 2026-10-25 23:19 EDT: "overwhelming... leave it as just the /commands").
const choiceLabel = (e) => e.name.slice(0, 100);

module.exports = { rank, choiceLabel, words, WORDS };
