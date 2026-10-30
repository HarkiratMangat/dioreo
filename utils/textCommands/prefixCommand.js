// utils/textCommands/prefixCommand.js -- the `prefix` / `pre` text command: anyone can ask which prefix a server uses, and a server admin can set or reset it from the message (Harkirat, 2026-10-30 16:02 EDT: "there's no way for a regular user to check what the server prefix is so implement a `prefix` command ... with `dior prefix [new prefix|remove]` the server admins can directly set or reset the prefix via the text command").
//
// TEXT ONLY: there is no /prefix slash command (commands.js `textOnly`), so bot/textCommands.js runs this through the same text interaction every other text command gets and nothing is registered with Discord. The /admin panel's Edit Prefix stays the other way in; both save through utils/guildPolicy.js updateGuildSettings and check words with utils/textCommands/server.js parsePrefixes, so they cannot disagree.
//
// A NON-ADMIN's argument is ignored in silence: they get the same reply as asking with no argument (his words: "remain silent if a non-admin attempts to use the argument, instead dioreo just replies with the current server prefix").
const emojis = require('../emojiMap');
const { configuredPrefixes, prefixParts, parsePrefixes, REMOVE_WORDS } = require('./server');

const code = w => `\`${w}\``;
// A server's name sits in bold-free text, but it is still the server's to choose: keep its own markdown out of the line.
const plainName = name => String(name || 'This server').replace(/[\\*_~|`>]/g, '\\$&');
const longestFirst = list => [...list].sort((a, b) => b.length - a.length);

// The prefixes that always work, as the line under a server prefix: `<@bot> · `dior``.
function alsoWorks(client, fixed) {
    const words = [`<@${client.user.id}>`, ...fixed.map(code)];
    return `-# **${words.join(' · ')}** also work${words.length === 1 ? 's' : ''}!`;
}

// His two formats (2026-10-30 16:02 EDT). A server with its own prefix: its prefix first and what also works under it. Without one: every prefix, and the server's line saying Not set.
function showPrefixes({ client, guildName, own }) {
    const { fixed } = prefixParts();
    const lead = emojis.command || '';
    if (own?.length) {
        return `${lead} ${plainName(guildName)}'s server ${own.length === 1 ? 'prefix' : 'prefixes'}: **${own.map(code).join(' · ')}**\n${alsoWorks(client, fixed)}`;
    }
    const all = [`<@${client.user.id}>`, ...longestFirst(configuredPrefixes()).map(code)];
    return `${lead} Dioreo's prefixes: **${all.join(' · ')}**\n-# ${plainName(guildName)}'s server prefix: *Not set*`;
}

// What an admin's word asks for: put the prefix back, or set this one. Returns { reset: true } | { prefixes } | { error }.
function readAction(arg) {
    const word = String(arg).trim().toLowerCase();
    if (REMOVE_WORDS.includes(word)) return { reset: true };
    const read = parsePrefixes(word);
    if (read.error) return { error: read.error };
    // Setting the very word the default already uses is the default.
    if (read.prefixes.length === 1 && read.prefixes[0] === prefixParts().replaceable) return { reset: true };
    return { prefixes: read.prefixes };
}

// `args` is everything typed after the command word.
async function execute(interaction, args = '') {
    const policy = require('../guildPolicy');
    const guildId = interaction.guildId;
    const guildName = interaction.guild?.name;
    const client = interaction.client;
    const words = String(args || '').trim().split(/\s+/).filter(Boolean);
    // One word is an attempt to set or reset; more than that is not (`d prefix is what`), and neither is an argument from a non-admin.
    if (words.length === 1 && policy.isServerAdmin(interaction)) {
        const action = readAction(words[0]);
        if (action.error) return interaction.reply({ content: `${emojis.warn || ''} ${action.error} Nothing was saved.`.trim() });
        const settings = await policy.updateGuildSettings(guildId, interaction.user.id, doc => { doc.textPrefixes = action.reset ? undefined : action.prefixes; });
        const own = settings?.textPrefixes || [];
        const shown = showPrefixes({ client, guildName, own });
        // The same two-line reply as asking, with one lead line saying what just happened.
        const done = action.reset ? `${emojis.command || ''} ${plainName(guildName)}'s server prefix was reset.` : `${emojis.command || ''} ${plainName(guildName)}'s server prefix is now set.`;
        return interaction.reply({ content: `${done}\n${shown}`.trim() });
    }
    const settings = await policy.getGuildSettings(guildId);
    return interaction.reply({ content: showPrefixes({ client, guildName, own: settings?.textPrefixes || [] }) });
}

module.exports = { execute, showPrefixes, readAction };
