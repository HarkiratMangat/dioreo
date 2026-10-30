// utils/textCommands/server.js -- one server's text-command prefixes (B7, 2026-10-30; Harkirat 2026-10-29 12:40 EDT: "we still need to implement a per server prefix system"). The on/off switch beside them is utils/guildPolicy.js textCommandOnHere; both are saved from /admin's Config Text Commands view.
//
// THE MIDDLE GROUND (his call, 2026-10-30 12:35 EDT: "dior and @dioreo remain but `d` gets replaced"): a server's prefixes take the place of the FIRST default (`d`) only; the rest (`dior`) and `@Dioreo` always work. So a server whose members say "d" in chat, or that runs another bot on it, can swap it out, and a bad prefix can never leave its members without a typed form.

// The bot-wide default, from the environment so the dev bot can use its own: prod and dev are both in Dioreoland and would otherwise both answer `d today` (think-pass, 2026-10-28 16:44 EDT). .env.dev sets TEXT_PREFIXES=dd,diordev. `/` was a prefix until B6 (his call, 2026-10-29): it collides with the slash-command picker.
function configuredPrefixes(env = process.env) {
    const raw = env.TEXT_PREFIXES === undefined ? 'd,dior' : env.TEXT_PREFIXES;
    return raw.split(',').map(p => p.trim()).filter(Boolean);
}

const MAX_PREFIXES = 3;
const MAX_LENGTH = 6;
// `/` is the slash-command picker's (his 2026-10-29 12:40 EDT: "leave it for the real slash commands"); `@ < # :` begin a mention, a channel or an emoji; `` ` * _ ~ | > \ `` are Discord markdown and would change how the message itself renders.
const FORBIDDEN = /[/@<#:`*_~|>\\]/;
// Any word is allowed, everyday ones included (his call, 2026-10-30 15:26 EDT: "if a server wants to use that as their prefix, let them"). With `the` as a prefix "the draws" posts the draws; that is the server's choice.

// What an admin typed, as a list: commas or spaces between prefixes, any case. Blank is the default again. Returns { prefixes } or { error } in words the pop-up shows.
function parsePrefixes(text) {
    const prefixes = [...new Set(String(text || '').split(/[,\s]+/).map(p => p.trim().toLowerCase()).filter(Boolean))];
    if (prefixes.length > MAX_PREFIXES) return { error: `Up to ${MAX_PREFIXES} prefixes.` };
    const long = prefixes.find(p => p.length > MAX_LENGTH);
    if (long) return { error: `\`${long}\` is too long: ${MAX_LENGTH} characters at most.` };
    if (prefixes.some(p => FORBIDDEN.test(p))) return { error: "A prefix can't use / @ < # : or Discord's formatting characters." };
    return { prefixes };
}

// The default split in two: the first word a server's own prefixes replace, and the words that always stay (`dior`; on the dev bot `dd` and `diordev`).
function prefixParts(env = process.env) {
    const [replaceable = null, ...fixed] = configuredPrefixes(env);
    return { replaceable, fixed };
}

// The prefixes that work in one server: its own in place of `d`, then `dior`; or the default. Read through utils/guildPolicy.js's cached settings, so after the first read in five minutes a message costs a Map lookup. A failed read falls back to the default rather than silencing every prefix.
async function prefixesFor(guildId, fallback = configuredPrefixes()) {
    if (!guildId) return fallback;
    try {
        const settings = await require('../guildPolicy').getGuildSettings(guildId);
        if (!settings?.textPrefixes?.length) return fallback;
        const { fixed } = prefixParts();
        return [...new Set([...settings.textPrefixes, ...fixed])];
    } catch {
        return fallback;
    }
}

module.exports = { configuredPrefixes, prefixParts, parsePrefixes, prefixesFor, MAX_PREFIXES, MAX_LENGTH };
