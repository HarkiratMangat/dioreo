// utils/textCommands/parse.js -- reads a plain channel message and decides whether it is a text command for Dioreo (text commands, 2026-10-28 16:47 EDT). Pure: no discord.js, no I/O, so every rule below is testable as a table (scripts/textCommandParse.test.js).
//
// THE PRINCIPLE (think-pass, 2026-10-28 16:46 EDT): a channel is shared space, unlike a slash command, which is explicit. When it is unclear whether a message is meant for Dioreo, stay silent. The one loud path is a message that STARTS with a mention of the bot itself.
//
// Triggers, his calls on 2026-10-28: `@Dioreo` (mention), and the prefixes `/`, `d`, `dior` (16:21 EDT, "all 3 but d! is a bit difficult ... on mobile"), any case, space optional. Forgiving on typos (16:24 EDT, "assume someone typod a command such as `dior calender` or `dior draws o`"), within the limits his 16:25 EDT "makes sense" accepted.

// Damerau-Levenshtein (optimal string alignment): a swapped pair of letters costs 1, the commonest phone typo.
function typoDistance(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
    }
    return d[a.length][b.length];
}

// How far a typed word may be from a command word. Measured 2026-10-28 16:44 EDT against /usr/share/dict/words: distance 2 on six-letter words matched real chat words (remind/mind, season/lesson, settings/getting, invite/ignite), so 2 is kept for 8+ letters and the FIRST letter must match, which removed every one of those.
function isTypoOf(typed, word) {
    if (!typed || typed[0] !== word[0]) return false;
    const dist = typoDistance(typed, word);
    if (word.length <= 4) return dist === 1 && typed.length === word.length && [...typed].sort().join('') === [...word].sort().join('');
    if (word.length <= 7) return dist <= 1;
    return dist <= 2;
}

// Longest first, so `dior` is never read as `d` + `ior`.
function normalisePrefixes(prefixes) {
    return [...new Set((prefixes || []).map(p => String(p).trim().toLowerCase()).filter(Boolean))].sort((a, b) => b.length - a.length);
}

// What, if anything, the message addresses. Returns { via, rest, spaced } or null.
function readTrigger(content, { botId, botRoleId, prefixes }) {
    const text = String(content || '').trim();
    const mention = text.match(/^<@!?(\d+)>/);
    // Only a LEADING mention counts (think-pass): a reply to a Dioreo message pings the bot too, and "thanks" under a panel must not summon a help card.
    if (mention && mention[1] === String(botId)) return { via: 'mention', rest: text.slice(mention[0].length).trim(), spaced: true };
    const role = text.match(/^<@&(\d+)>/);
    if (role && botRoleId && role[1] === String(botRoleId)) return { via: 'role', rest: text.slice(role[0].length).trim(), spaced: true };
    const lower = text.toLowerCase();
    for (const prefix of normalisePrefixes(prefixes)) {
        if (!lower.startsWith(prefix)) continue;
        const after = text.slice(prefix.length);
        const spaced = /^\s/.test(after);
        // A word prefix glued to the command (`dtoday`) must be followed by a letter; `d.` or `d123` is chat.
        if (!spaced && /^[a-z]/i.test(prefix) && !/^[a-z]/i.test(after)) continue;
        return { via: prefix, rest: after.trim(), spaced };
    }
    return null;
}

// Every way to spell each command, multi-word names included (`patch notes`, `patchnotes`). commands: [{ name, words: [...] }].
function buildWordIndex(commands) {
    const index = [];
    for (const cmd of commands) for (const w of cmd.words) {
        const parts = w.toLowerCase().split(/\s+/);
        index.push({ cmd, parts, joined: parts.join('') });
    }
    // Longer spellings first, so `draw prices` wins over `draw`.
    return index.sort((a, b) => b.parts.length - a.parts.length || b.joined.length - a.joined.length);
}

function matchCommand(tokens, index, { allowTypos }) {
    const lower = tokens.map(t => t.toLowerCase());
    for (const entry of index) {
        const n = entry.parts.length;
        if (lower.slice(0, n).join(' ') === entry.parts.join(' ')) return { cmd: entry.cmd, used: n, fuzzy: false };
        if (n > 1 && lower[0] === entry.joined) return { cmd: entry.cmd, used: 1, fuzzy: false };
    }
    if (!allowTypos || !lower.length) return { candidates: [] };
    const hits = new Map();
    for (const entry of index) {
        const n = entry.parts.length;
        const spaced = lower.slice(0, n).join(' ');
        if (lower.length >= n && n > 1 && entry.parts.every((p, i) => p === lower[i] || isTypoOf(lower[i], p))) hits.set(entry.cmd.name, { cmd: entry.cmd, used: n });
        else if (isTypoOf(lower[0], entry.joined) || (n === 1 && isTypoOf(spaced, entry.joined))) { if (!hits.has(entry.cmd.name)) hits.set(entry.cmd.name, { cmd: entry.cmd, used: 1 }); }
    }
    const list = [...hits.values()];
    if (list.length === 1) return { ...list[0], fuzzy: true };
    return { candidates: list.map(h => h.cmd) };
}

// The verdict. kind: 'run' | 'didYouMean' | 'help' | 'roleHint' | 'emojiReply' | null (stay silent).
function parseTextCommand(content, { botId, botRoleId = null, prefixes = [], commands = [] } = {}) {
    const trigger = readTrigger(content, { botId, botRoleId, prefixes });
    if (!trigger) return { kind: null };
    const { via, rest, spaced } = trigger;
    // Without Message Content a role mention arrives with no text at all (spike 2b, 2026-10-28 16:37 EDT), so the caller sees an empty rest.
    if (via === 'role' && !rest) return { kind: 'roleHint', via };
    const addressed = via === 'mention' || via === 'role' || via === '/';
    const tokens = rest.split(/\s+/).filter(Boolean);
    if (!tokens.length) return addressed ? { kind: 'help', via } : { kind: null };
    // Typos are forgiven only when the message clearly addresses Dioreo, or the prefix is followed by a space (`d todya`). Glued forms must be exact, or `d` + `raws` would fire on the plain word "draws".
    const result = matchCommand(tokens, buildWordIndex(commands), { allowTypos: addressed || spaced });
    if (result.cmd) {
        const trailing = tokens.slice(result.used).join(' ');
        // `dior draws o`: a stray key or two after the command is forgiven. Longer trailing text after `d`/`dior` is chat (`d today is cold lol`).
        const strayOnly = trailing.length <= 2;
        if (!trailing || (result.fuzzy ? strayOnly : (addressed || strayOnly))) return { kind: 'run', via, command: result.cmd.name, args: '', fuzzy: result.fuzzy };
        if (addressed) return { kind: 'didYouMean', via, candidates: [result.cmd.name] };
        return { kind: null };
    }
    // Only a leading bot mention earns a reply to something unrecognised. One or two words read as a command attempt (help card, or Did you mean); three or more are someone talking TO Dioreo (`@Dioreo is the best bot`), which gets a one-emoji reply. His call 2026-10-28 17:04 EDT: "with @ mention and 3 or more words, have it just reply to the message with an emoji".
    if (via !== 'mention') return { kind: null };
    if (tokens.length >= 3) return { kind: 'emojiReply', via };
    return result.candidates.length ? { kind: 'didYouMean', via, candidates: result.candidates.map(c => c.name) } : { kind: 'help', via };
}

module.exports = { parseTextCommand, typoDistance, isTypoOf, readTrigger };
