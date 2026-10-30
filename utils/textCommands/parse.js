// utils/textCommands/parse.js -- reads a plain channel message and decides whether it is a text command for Dioreo (text commands, 2026-10-28 16:47 EDT). Pure: no discord.js, no I/O, so every rule below is testable as a table (scripts/textCommandParse.test.js, and scripts/textCommandArgs.test.js for the options).
//
// OPTIONS (B2, 2026-10-29): the words after a command fill its options through utils/textCommands/args.js. After `d`/`dior` every word must be understood and a date must parse, or Dioreo stays silent; after `@Dioreo` or `/` a word it did not understand is ignored and the command runs with the words it did understand (the spec's rules table, his 16:25 EDT call, confirmed 2026-10-28 23:29 EDT over B2's usage hint; B4 removed the hint 2026-10-29 10:32 EDT), a date that does not parse gets a "No match" line, and a missing date a one-button card (`needsInput`). A command with no text options keeps the PR 1 rule below: clearly addressed, trailing text is ignored.
const { parseArgs, sameWord } = require('./args');
const { BARE_CLASS_WORDS, THANKS } = require('./commands');
//
// THE PRINCIPLE (think-pass, 2026-10-28 16:46 EDT): a channel is shared space, unlike a slash command, which is explicit. When it is unclear whether a message is meant for Dioreo, stay silent. The one loud path is a message that STARTS with a mention of the bot itself.
//
// Triggers, his calls on 2026-10-28: `@Dioreo` (mention), and the prefixes `d`, `dior` (16:21 EDT, "all 3 but d! is a bit difficult ... on mobile"; `/` was the third until B6 removed it, his call 2026-10-29), any case, space optional. Forgiving on typos (16:24 EDT, "assume someone typod a command such as `dior calender` or `dior draws o`"), within the limits his 16:25 EDT "makes sense" accepted.

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
        index.push({ cmd, parts, joined: parts.join(''), word: w.toLowerCase() });
    }
    // Longer spellings first, so `draw prices` wins over `draw`.
    return index.sort((a, b) => b.parts.length - a.parts.length || b.joined.length - a.joined.length);
}

function matchCommand(tokens, index, { allowTypos }) {
    const lower = tokens.map(t => t.toLowerCase());
    // Singular and plural both match (spec, B2): `d draw`, `d event`, `d setting`. `word` says which spelling matched, so a calendar shortcut word (`d modes`) can open its page.
    for (const entry of index) {
        const n = entry.parts.length;
        if (lower.length >= n && entry.parts.every((p, i) => (i === n - 1 ? sameWord(lower[i], p) : lower[i] === p))) return { cmd: entry.cmd, used: n, fuzzy: false, word: entry.word };
        if (n > 1 && sameWord(lower[0], entry.joined)) return { cmd: entry.cmd, used: 1, fuzzy: false, word: entry.word };
    }
    if (!allowTypos || !lower.length) return { candidates: [] };
    const hits = new Map();
    for (const entry of index) {
        const n = entry.parts.length;
        const spaced = lower.slice(0, n).join(' ');
        if (lower.length >= n && n > 1 && entry.parts.every((p, i) => p === lower[i] || isTypoOf(lower[i], p))) hits.set(entry.cmd.name, { cmd: entry.cmd, used: n, word: entry.word });
        else if (isTypoOf(lower[0], entry.joined) || (n === 1 && isTypoOf(spaced, entry.joined))) { if (!hits.has(entry.cmd.name)) hits.set(entry.cmd.name, { cmd: entry.cmd, used: 1, word: entry.word }); }
    }
    const list = [...hits.values()];
    if (list.length === 1) return { ...list[0], fuzzy: true };
    return { candidates: list.map(h => h.cmd) };
}

// The verdict. kind: 'run' | 'didYouMean' | 'help' | 'roleHint' | 'emojiReply' | 'needsInput' | 'noMatch' | null (stay silent). A run carries `values` (the options), `autocomplete` (option text still to look up), `form` ('convertTimes' / 'viewColors' for the reply forms) and `addressed`. `weaponGuess` rides on a verdict whose first word named no command: bot/textCommands.js runs gunsmith when it is an exact weapon name (`d ak117`), and otherwise acts on the verdict as it is. isReply: the message replies to another one (`d timestamp` then means Convert Times on it). checkDatetime: tests may pass their own; args.js defaults to /timestamp's parser.
function parseTextCommand(content, { botId, botRoleId = null, prefixes = [], commands = [], isReply = false, checkDatetime } = {}) {
    const trigger = readTrigger(content, { botId, botRoleId, prefixes });
    if (!trigger) return { kind: null };
    const { via, rest, spaced } = trigger;
    // Without Message Content a role mention arrives with no text at all (spike 2b, 2026-10-28 16:37 EDT), so the caller sees an empty rest.
    // The role hint was dropped (his call, B6, 2026-10-29 15:00 EDT): the role is not pingable unless an admin makes it so, so a bare role mention is silent.
    if (via === 'role' && !rest) return { kind: null, via };
    const addressed = via === 'mention' || via === 'role';
    const tokens = rest.split(/\s+/).filter(Boolean);
    if (!tokens.length) return addressed ? { kind: 'help', via } : { kind: null };
    // `@Dioreo thanks` gets an emoji, not a help card (his ask, B6, 2026-10-29).
    const said = rest.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
    if (via === 'mention' && THANKS.includes(said)) return { kind: 'emojiReply', via, addressed };
    // Typos are forgiven only when the message clearly addresses Dioreo, or the prefix is followed by a space (`d todya`). Glued forms must be exact, or `d` + `raws` would fire on the plain word "draws".
    const result = matchCommand(tokens, buildWordIndex(commands), { allowTypos: addressed || spaced });
    if (result.cmd) {
        const cmd = result.cmd;
        const base = { via, command: cmd.name, fuzzy: result.fuzzy, addressed };
        if (!cmd.options?.length) {
            const trailingWords = tokens.slice(result.used);
            const trailing = trailingWords.join(' ');
            // `dior draws o`: a stray key or two after the command is forgiven. After `d`/`dior` an exact command with ONE more word still runs (`d today pls`); a typo with any more words, or two or more words, is chat (`d today is cold lol`). After `@Dioreo` it runs either way (his rules, B6, 2026-10-29 14:29 EDT).
            const strayOnly = trailing.length <= 2;
            if (!trailing || addressed || strayOnly || (!result.fuzzy && trailingWords.length === 1)) return { kind: 'run', ...base, args: '', values: {}, autocomplete: [], hasArgs: false };
            return { kind: null };
        }
        const parsed = parseArgs(tokens.slice(result.used), cmd, null, { allowTypos: addressed || spaced, prefill: (cmd.presets || {})[result.word] || {}, checkDatetime });
        // The same stray-key forgiveness: one or two characters nothing understood are ignored (`dior draws o`).
        const leftover = parsed.leftover.join(' ').length <= 2 ? [] : parsed.leftover;
        if (leftover.length && !addressed) {
            // After `d`/`dior`: an exact command with ONE word nothing understood still runs (`d calendar stuff`); a typo with any such word (`d calender stuff`), or two or more (`d calendar is wild today`), is chat (his rule, B6, 2026-10-29 14:29 EDT). After `@Dioreo` the words nothing understood are ignored and the command runs with the rest, typo or not (`@Dioreo calendar purple`, `@Dioreo calender stuff`; the spec's rules table, and his B6 call that a typo plus extra words runs).
            if (result.fuzzy || leftover.length > 1) return { kind: null };
        }
        // `d timestamp is wrong lol` is chat; after `@Dioreo` it gets a line saying the date was not understood.
        if (parsed.unresolved) return addressed ? { kind: 'noMatch', ...base, option: parsed.unresolved.option, text: parsed.unresolved.text } : { kind: null };
        const values = parsed.options;
        let form = null;
        if (cmd.replyForm === 'convertTimes' && isReply && !values.datetime) form = 'convertTimes';
        else if (parsed.missing.length) return { kind: 'needsInput', ...base, missing: parsed.missing };
        if (cmd.replyForm === 'viewColors' && (values.someone || isReply)) form = 'viewColors';
        return { kind: 'run', ...base, args: '', values, autocomplete: parsed.autocomplete, hasArgs: parsed.hasArgs, form };
    }
    // A bare main class word (`d smg`) opens that class's first build (his ask, B6, 2026-10-29 20:07 EDT): one word only, spaced or addressed.
    const bareClass = tokens.length === 1 && (addressed || spaced) ? Object.entries(BARE_CLASS_WORDS).find(([w]) => sameWord(tokens[0].toLowerCase(), w)) : null;
    if (bareClass && commands.some(c => c.name === 'gunsmith')) return { kind: 'run', via, command: 'gunsmith', fuzzy: false, addressed, args: '', values: { weapon: `~first~${bareClass[1]}` }, autocomplete: [], hasArgs: true };
    // A first word that names no command may be a weapon (`d ak117`, his "also bare as `d ak117`"). Only spaced or clearly addressed, and short: a glued `dak117` must be exact like every glued form, and the guess costs bot/textCommands.js one lookup.
    const weaponGuess = (addressed || spaced) && commands.some(c => c.name === 'gunsmith') && tokens.length <= 3 && rest.length <= 24 ? tokens.join(' ') : null;
    // Only a leading bot mention earns a reply to something unrecognised. One or two words read as a command attempt (help card, or Did you mean); three or more are someone talking TO Dioreo (`@Dioreo is the best bot`), which gets a one-emoji reply. His call 2026-10-28 17:04 EDT: "with @ mention and 3 or more words, have it just reply to the message with an emoji".
    if (via !== 'mention') return { kind: null, via, addressed, weaponGuess };
    if (tokens.length >= 3) return { kind: 'emojiReply', via, addressed, weaponGuess };
    return result.candidates.length ? { kind: 'didYouMean', via, addressed, weaponGuess, candidates: result.candidates.map(c => c.name) } : { kind: 'help', via, addressed, weaponGuess };
}

module.exports = { parseTextCommand, typoDistance, isTypoOf, readTrigger };
