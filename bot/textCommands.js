// bot/textCommands.js -- the text-command listener: `@Dioreo today`, `d today`, `dior today`, `/today` (text commands, PR 1, 2026-10-28 17:24 EDT).
//
// WHY THIS EXISTS: a server can switch off Use Application Commands, and a server with more than ~50 bots stops listing newer bots' slash commands (「𝐆𝐇𝐎𝐒𝐓」, 54 bots, measured 2026-10-28 15:54 EDT). A text command is an ordinary message, so neither applies. Buttons on the reply still work where app commands are denied (spike, 2026-10-28 16:31 EDT).
//
// ⚠️ THIS IS AN EXCEPTION TO "the bot answers only through interactions" (root CLAUDE.md): a text command is answered with an ordinary channel message, as a reply to the member's own message, and only when they addressed Dioreo. utils/textCommands/parse.js decides that, and when in doubt it stays silent.
//
// ⚠️ Not covered by handlers/router.js's crash net: every listener here catches its own errors.
const { PermissionFlagsBits, IntentsBitField, GatewayIntentBits, Routes } = require('discord.js');
const { parseTextCommand, readTrigger } = require('../utils/textCommands/parse');
const { TEXT_COMMANDS, findTextCommand, toIdPart, moduleFor } = require('../utils/textCommands/commands');
const { createTextInteraction, TextCommandRefused, runCustomId, encodePayload } = require('../utils/textCommands/adapter');
const { textCommandAllowed } = require('../utils/textCommands/permissions');

// His rule (2026-10-28 18:10 EDT): "a 5 second per person limit if it's the same command (with a warning message and countdown within the message, the message then deletes itself) and 1 second for any command that's not the same (no warning needed)". Replaced a 1-second same-command limit, which had replaced a 3-second any-command one after his 18:05 EDT report that a quick second command did nothing.
const SAME_COMMAND_COOLDOWN_MS = 5000;
const ANY_COMMAND_COOLDOWN_MS = 1000;
const CHANNEL_WINDOW_MS = 10_000;
const CHANNEL_MAX_REPLIES = 5;
// A whole server's replies (his call, B6, 2026-10-29 23:51 EDT: "okay" to 30): only a flood reaches it, and then Dioreo goes quiet. Same 10 s window as a channel's.
const SERVER_MAX_REPLIES = 30;
// The listener's own cards and lines that delete themselves (B6, his yes 2026-10-29 14:54-14:55 EDT; utils/textCommands/cardTimers.js).
const CARD_TTL_MS = 10_000;
const POPUP_TTL_MS = 5 * 60_000;
const EDIT_WINDOW_MS = 60_000;
// Where Dioreo can't post, the member gets one DM per SERVER per day, and three a day in all (B6, his layout and limits 2026-10-29 15:45-15:49 EDT; it was one per channel per day, his 2026-10-28 17:18 EDT call). Held in memory only: a restart forgets it, and nothing is stored.
const CANT_POST_DM_MS = 24 * 60 * 60 * 1000;
const CANT_POST_DMS_PER_DAY = 3;

const lastByUser = new Map();
const channelHits = new Map();
const serverHits = new Map();
const answered = new Map();
const cantPostDms = new Map();

// The prefixes come from the environment so the dev bot can use its own: prod and dev are both in Dioreoland and would otherwise both answer `d today` (think-pass, 2026-10-28 16:44 EDT). .env.dev sets TEXT_PREFIXES=dd,diordev.
function configuredPrefixes(env = process.env) {
    // `/` was a prefix until B6 (his call, 2026-10-29): it collides with the slash-command picker.
    const raw = env.TEXT_PREFIXES === undefined ? 'd,dior' : env.TEXT_PREFIXES;
    return raw.split(',').map(p => p.trim()).filter(Boolean);
}

// Asks for Message Content only when the app's flags say Discord granted it (bit 18) or allowed it below 100 servers (bit 19). Asking for a privileged intent the app doesn't have makes login fail with "disallowed intents", so this is read before login, never assumed. Without it, only `@Dioreo …` works: Discord sends a message's text to a bot only when the message mentions it.
async function enableMessageContentIfGranted(client, token) {
    try {
        client.rest.setToken(token);
        const app = await client.rest.get(Routes.currentApplication());
        const flags = Number(app?.flags || 0);
        const granted = Boolean(flags & (1 << 18)) || Boolean(flags & (1 << 19));
        if (granted) {
            client.options.intents = new IntentsBitField(client.options.intents).add(GatewayIntentBits.MessageContent);
        }
        client.textMessageContent = granted;
        console.log(`💬 Text commands: ${granted ? `@mention and prefixes ${configuredPrefixes().join(' ')}` : '@mention only (Message Content not granted)'}`);
    } catch (err) {
        client.textMessageContent = false;
        console.error('Text commands: could not read the app flags; @mention only:', err?.message || err);
    }
}

function canPost(message) {
    const me = message.guild?.members?.me;
    if (!me) return false;
    const perms = message.channel.permissionsFor(me);
    if (!perms?.has(PermissionFlagsBits.ViewChannel)) return false;
    return message.channel.isThread?.() ? perms.has(PermissionFlagsBits.SendMessagesInThreads) : perms.has(PermissionFlagsBits.SendMessages);
}

// Returns null (go ahead), 'silent', or { warnUntil } for the same command too soon. `lastByUser` holds the person's last command and when; `warned` remembers one warning per cooldown, so a burst of repeats gets one countdown, not one each. Only a real command earns the countdown (B6, his call 2026-10-29 15:06 EDT): a second help card, emoji or Did you mean within 5 s is silent.
const warned = new Map();
function rateLimited(message, verdict) {
    const now = Date.now();
    const key = verdict.command || verdict.kind;
    const real = verdict.kind === 'run' || verdict.kind === 'needsInput';
    const last = lastByUser.get(message.author.id);
    if (last) {
        if (last.key === key && now - last.at < SAME_COMMAND_COOLDOWN_MS) {
            const until = last.at + SAME_COMMAND_COOLDOWN_MS;
            if (!real || warned.get(message.author.id) === last.at) return 'silent';
            warned.set(message.author.id, last.at);
            return { warnUntil: until, key };
        }
        if (last.key !== key && now - last.at < ANY_COMMAND_COOLDOWN_MS) return 'silent';
    }
    const hits = (channelHits.get(message.channelId) || []).filter(t => now - t < CHANNEL_WINDOW_MS);
    if (hits.length >= CHANNEL_MAX_REPLIES) return 'silent';
    const inServer = (serverHits.get(message.guildId) || []).filter(t => now - t < CHANNEL_WINDOW_MS);
    if (inServer.length >= SERVER_MAX_REPLIES) return 'silent';
    hits.push(now);
    inServer.push(now);
    channelHits.set(message.channelId, hits);
    serverHits.set(message.guildId, inServer);
    lastByUser.set(message.author.id, { key, at: now });
    return null;
}

// How a person reached Dioreo, as they would type it again: `d`, `dior`, or `@Dioreo` (B6: every card's examples use the prefix the person used).
const prefixShown = via => (via === 'mention' || via === 'role' ? '@Dioreo' : via);
// What they typed after the prefix, cleaned for a code span and kept short.
const shownText = text => String(text || '').replace(/[`*_~|]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
const typedAs = (via, rest) => `${prefixShown(via)} ${shownText(rest)}`.trim();

// Deletes a message of Dioreo's own, quietly (a bot may always delete its own message).
const deleteLater = (client, channelId, messageId) => () => client.rest.delete(Routes.channelMessage(channelId, messageId)).catch(() => {});

// The countdown is Discord's own relative timestamp (`<t:…:R>`, "in 4 seconds"), which every client counts down live; the note deletes itself when the wait is over. His wording (B6, 2026-10-29 15:06 EDT): the command as the person typed it, in small text.
async function warnCooldown(message, { warnUntil }, typed) {
    if (!canPost(message)) return;
    const unix = Math.ceil(warnUntil / 1000);
    const created = await message.client.rest.post(Routes.channelMessages(message.channelId), {
        body: {
            content: `-# ${require('../utils/emojiMap').cooldown} Slow down! Try \`${typed}\` again <t:${unix}:R>`,
            allowed_mentions: { parse: [], replied_user: false },
            message_reference: { message_id: message.id, fail_if_not_exists: false },
        },
    }).catch(() => null);
    if (!created?.id) return;
    setTimeout(deleteLater(message.client, message.channelId, created.id), Math.max(1000, warnUntil - Date.now() + 500)).unref?.();
}

// Text channels where BOTH Dioreo and this member can view and send (so no hidden channel is ever named), in the server's own order, the current one left out.
function postableChannels(message) {
    const me = message.guild?.members?.me;
    const member = message.member;
    if (!me || !member) return [];
    const can = (channel, who) => {
        const perms = channel.permissionsFor?.(who);
        return Boolean(perms?.has(PermissionFlagsBits.ViewChannel) && perms.has(PermissionFlagsBits.SendMessages));
    };
    return [...(message.guild.channels?.cache?.values?.() || [])]
        .filter(c => c.type === 0 && c.id !== message.channelId && can(c, me) && can(c, member))
        .sort((a, b) => (a.rawPosition ?? a.position ?? 0) - (b.rawPosition ?? b.position ?? 0));
}

// #9, his layout take 3 (B6, 2026-10-29 15:49 EDT): what failed and where, what they typed and the fix in one line, then up to 10 channels that would work (then +N more).
function cantPostCard(message, typed) {
    const emojis = require('../utils/emojiMap');
    const server = message.guild?.name ? ` · ${message.guild.name.replace(/[`*_~|]/g, '')}` : '';
    const components = [{ type: 10, content: `### ${emojis.cross} I can't post in <#${message.channelId}>${server}\n-# **You typed \`${typed}\`** · Ask a server admin to let me send messages there.` }];
    const channels = postableChannels(message);
    if (channels.length) {
        const shown = channels.slice(0, 10).map(c => `<#${c.id}>`).join(' · ');
        const more = channels.length > 10 ? ` · +${channels.length - 10} more` : '';
        components.push({ type: 14, spacing: 1, divider: true }, { type: 10, content: `Or try again in these channels:\n-# ${shown}${more}` });
    }
    return { flags: 32768, components: [{ type: 17, accent_color: HELP_ACCENT, components }] };
}

async function dmCantPost(message, typed) {
    const now = Date.now();
    const key = `${message.author.id}:${message.guildId}`;
    if (now - (cantPostDms.get(key) || 0) < CANT_POST_DM_MS) return;
    const today = [...cantPostDms].filter(([k, t]) => k.startsWith(`${message.author.id}:`) && now - t < CANT_POST_DM_MS).length;
    if (today >= CANT_POST_DMS_PER_DAY) return;
    cantPostDms.set(key, now);
    await message.author.send({ ...cantPostCard(message, typed), allowedMentions: { parse: [] } })
        .catch(() => { /* their DMs are closed; nothing else can reach them */ });
}

// Returns the message Dioreo posted (null if it could not); `ttl` makes it delete itself unless someone presses it first.
async function reply(message, body, { ttl = 0 } = {}) {
    const plain = { allowed_mentions: { parse: [], replied_user: false }, ...body };
    const route = Routes.channelMessages(message.channelId);
    // Without Read Message History a reply is refused (50013); the same text goes out as a plain message instead.
    const created = await message.client.rest.post(route, { body: { ...plain, message_reference: { message_id: message.id, fail_if_not_exists: false } } })
        .catch(err => { if (err?.code !== 50013) throw err; return message.client.rest.post(route, { body: plain }); });
    if (ttl && created?.id) require('../utils/textCommands/cardTimers').schedule(created.id, ttl, deleteLater(message.client, message.channelId, created.id));
    return created || null;
}

// THE LISTENER'S OWN CARDS look like the bot's other panels (Harkirat, 2026-10-29 11:20 EDT, on the plain `d timestamp` card: "why does this panel look so barebone?? ... i hope they're not all barebone like this"), and since B6 each is his layout (approved 2026-10-29 13:40-16:07 EDT): a title with a `-#` line, the command's own icon on its buttons, the command's accent (.claude/rules/rendering-and-ui.md's colour table: /help's coral for the help and Did you mean cards, /timestamp's teal for its cards). Emojis are read here, at send time (the emoji-capture rule).
const HELP_ACCENT = 16743772;      // /help and /invite's coral, #FF7D5C
const TIMESTAMP_ACCENT = 1548962;  // /timestamp's Cyber Teal, #17A2A2
const card = (accent, components) => ({ flags: 32768, components: [{ type: 17, accent_color: accent, components }] });
// A title beside one button, or a title over a row of them.
const titled = (content, buttons) => (buttons.length === 1
    ? [{ type: 9, components: [{ type: 10, content }], accessory: buttons[0] }]
    : [{ type: 10, content }, { type: 1, components: buttons.slice(0, 5) }]);
const code = list => list.map(w => `\`${w}\``).join(' · ');
// `a`, `b` or `c`
const orList = names => names.map(n => `\`${n}\``).reduce((out, n, i, all) => (i === 0 ? n : i === all.length - 1 ? `${out} or ${n}` : `${out}, ${n}`), '');

// #1, the help card (his layout, take 3, approved 2026-10-29 13:40 EDT): the prefixes under the title, the four groups in short words, examples and the slash /help underneath. The icon beside the title opens /help privately for whoever taps it (his "private is fine", 2026-10-29 23:51 EDT); the card never deletes itself. Without Message Content only `@Dioreo` works, so only it is shown.
const HELP_GROUPS = [['gunsmithSearch', 'Gunsmith', ['gunsmith', 'dmz']], ['newDraws', 'Draws', ['draws', 'prices', 'calculator']], ['calendar', 'Season', ['today', 'calendar', 'remind', 'patch notes', 'end']], ['eyedropper', 'Utilities', ['timestamp', 'colors', 'settings', 'invite', 'help']]];
function helpCard(client) {
    const emojis = require('../utils/emojiMap');
    const words = client.textMessageContent ? ['@Dioreo', ...configuredPrefixes()] : ['@Dioreo'];
    const ex = client.textMessageContent ? configuredPrefixes()[0] || '@Dioreo' : '@Dioreo';
    const bold = words.map(w => `**\`${w}\`**`);
    const prefixLine = bold.length > 1 ? `${bold.slice(0, -1).join(', ')} or ${bold[bold.length - 1]}` : bold[0];
    const icon = emojis.parseEmoji(emojis.helpHint);
    // An emoji-only button needs its emoji on the booted app; without it, a label.
    const open = { type: 2, style: 2, custom_id: runCustomId('txtpriv_', findTextCommand('help')), ...(icon ? { emoji: icon } : { label: 'Help' }) };
    const helpId = client.commandIds?.get?.('help');
    return card(HELP_ACCENT, [
        { type: 9, components: [{ type: 10, content: `## ${emojis.dioreowrld} Need help?\n-# Prefix: ${prefixLine}` }], accessory: open },
        { type: 14, spacing: 1, divider: true },
        ...HELP_GROUPS.map(([key, label, list]) => ({ type: 10, content: `${emojis[key]} **${label}:** ${code(list)}` })),
        { type: 10, content: `-# e.g. ${code([`${ex} draws`, `${ex} gs ak117`, `${ex} help calc`])}\n-# Or use **slash commands** ${helpId ? `</help:${helpId}>` : '`/help`'}` },
    ]);
}

// A grey pick button with the command's (or the weapon's) icon, where the booted app has it.
function pickButton(label, customId, iconKey) {
    const emojis = require('../utils/emojiMap');
    const emoji = iconKey ? emojis.parseEmoji(emojis[iconKey]) : undefined;
    return { type: 2, style: 2, label: String(label).slice(0, 80), custom_id: customId, ...(emoji ? { emoji } : {}) };
}

// #2, Did you mean for commands (his wording, B6, 2026-10-29 13:52 EDT): `Did you mean \`a\` or \`b\`?` over what they typed; one match sits beside its button, several get a row. Deletes itself 10 s after it is posted unless pressed.
function didYouMeanCard(names, typed) {
    const emojis = require('../utils/emojiMap');
    const list = names.slice(0, 5);
    const buttons = list.map(name => pickButton(name, `txtrun_${toIdPart(name)}`, findTextCommand(name)?.icon));
    return card(HELP_ACCENT, titled(`### ${emojis.search} Did you mean ${orList(list)}?\n-# You typed \`${shownText(typed)}\``, buttons));
}

// The emoji a chatty mention gets (Harkirat, 2026-10-28 17:04 EDT: "have it just reply to the message with an emoji"). Since 2026-10-29 10:12 EDT it is one of his 24 brand emojis, picked at random ("adjust the randomness so it actually showcases a variety of emojis instead of showing the same ones again and again"): a shuffled deck, dealt without repeats until every emoji has shown once, then reshuffled so the new deck never opens with the one just shown. Read by name from the app at reply time, so a name the app lacks is skipped; with none, 👋. The deck lives in memory: a restart starts a new one.
const MENTION_REPLY_EMOJIS = ['DioreoWordmarkTeal', 'DioreoWordmarkPeriwinkle', 'DioreoWordmarkRose', 'DioreoWordmarkOrange', 'DioreoWordmarkPurple', 'DioreoWordmarkYellow', 'DioreoWordmarkGreen', 'DioreoWordmarkCoral', 'DioreoComboTeal', 'DioreoComboGreen', 'DioreoComboYellow', 'DioreoComboCoral', 'DioreoComboPurple', 'DioreoComboRose', 'DioreoComboPeriwinkle', 'DioreoComboOrange', 'DioreoStandingStillBlink', 'DioreoSeatedStillBlink', 'DioreoHeartFlyPink', 'DioreoHeartPopPink', 'DioreoHeartPopRed', 'DioreoHeartFlyRed', 'DioreoSparkles', 'Dioreowrld'];
let mentionDeck = [];
let lastMentionEmoji = null;
function mentionReplyEmoji(client) {
    const cache = client.application?.emojis?.cache;
    const available = MENTION_REPLY_EMOJIS.map(name => cache?.find?.(e => e.name === name)).filter(Boolean);
    if (!available.length) return '👋';
    mentionDeck = mentionDeck.filter(name => available.some(e => e.name === name));
    if (!mentionDeck.length) {
        mentionDeck = available.map(e => e.name);
        for (let i = mentionDeck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [mentionDeck[i], mentionDeck[j]] = [mentionDeck[j], mentionDeck[i]]; }
        if (mentionDeck.length > 1 && mentionDeck[mentionDeck.length - 1] === lastMentionEmoji) [mentionDeck[0], mentionDeck[mentionDeck.length - 1]] = [mentionDeck[mentionDeck.length - 1], mentionDeck[0]];
    }
    const name = mentionDeck.pop();
    lastMentionEmoji = name;
    const emoji = available.find(e => e.name === name);
    return `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`;
}

// /timestamp's own reading of a date: its shorthand expansion, then utils/timestampHelper.js (B2). The command module is read through client.commands, the same late-bound door handlers/router.js uses, never require()d: this file is structural to the hotpatch planner, so a require edge into commands/timestamp.js would make /timestamp un-hot-patchable.
function datetimeChecker(client) {
    return text => {
        const timestamp = client.commands?.get?.('timestamp');
        const expanded = typeof timestamp?.expandShorthand === 'function' ? timestamp.expandShorthand(text) : text;
        return Boolean(require('../utils/timestampHelper').generateTimestamps(expanded)?.unix);
    };
}

// A reply to another message (a forward is not one): `d timestamp` then means Convert Times on it, `d colors` that person's colours (B2, the spec's reply forms).
const isReplyTo = message => Boolean(message.reference?.messageId) && (message.reference.type ?? 0) === 0;

// OPTIONS THAT NEED A LOOKUP (B2, 2026-10-29): a weapon or a patch-notes season is resolved through the slash command's OWN suggestion list, utils/autocomplete.js, with an interaction whose respond() keeps the list. Deliberately NOT through instrumentAutocomplete: a text command is not someone typing into a search box, so it records no search session. A suggestion's name without the class tag and the no-build note /gunsmith mp adds (`[AR] AK117 — Build pending`), for comparing with what was typed.
const choiceName = name => String(name || '').replace(/^\[[^\]]*\]\s*/, '').replace(/\s+—\s+Build pending$/, '');
const squash = s => String(s || '').toLowerCase().replace(/[\s\-_.]/g, '');

// Held a minute per command, option and text: the lookups run BEFORE the rate limits (so a message that turns out silent does not count against anyone), and this keeps a burst of the same `@Dioreo gs ak` from costing a database read each. Neither list is per person.
const SUGGEST_MS = 60_000;
const suggestions = new Map();
async function suggest(message, textCommand, option, text) {
    const key = `${textCommand.slash}|${textCommand.sub || ''}|${option}|${squash(text)}`;
    const hit = suggestions.get(key);
    if (hit && Date.now() - hit.at < SUGGEST_MS) return hit.list;
    const list = await lookUp(message, textCommand, option, text);
    if (list) suggestions.set(key, { list, at: Date.now() });
    return list || [];
}

// null when the lookup failed, so a failure is never cached as "no match".
async function lookUp(message, textCommand, option, text) {
    let list = [];
    const fake = {
        commandName: textCommand.slash, client: message.client, user: message.author, member: message.member,
        guild: message.guild, guildId: message.guildId, channel: message.channel, channelId: message.channelId,
        isAutocomplete: () => true,
        options: { getFocused: full => (full ? { name: option, value: text } : text), getSubcommand: () => textCommand.sub ?? null, getString: () => null },
        respond: async choices => { list = Array.isArray(choices) ? choices : []; },
    };
    try {
        await require('../utils/autocomplete').runAutocomplete(fake);
    } catch (err) {
        console.error(`Text command ${textCommand.name}: could not look up "${text}":`, err?.message || err);
        return null;
    }
    return list;
}


// One confident hit, or the candidates. The browse rows and "Type a name to search…" (values starting `~`) are never a hit: they are not the weapon asked for. A suggestion whose name IS what was typed wins over the others (`m4` beside XM4); `first` takes the top one (patch notes' `latest`: the list is newest first).
function pickChoice(choices, text, first) {
    const usable = choices.filter(c => !String(c.value).startsWith('~'));
    if (first) return { hit: usable[0] || null, several: [] };
    if (usable.length === 1) return { hit: usable[0], several: [] };
    const exact = usable.filter(c => squash(choiceName(c.name)) === squash(text) || squash(c.value) === squash(text));
    if (exact.length === 1) return { hit: exact[0], several: [] };
    return { hit: null, several: usable };
}

// `d ak117`: a first word naming no command runs gunsmith MP only when it is EXACTLY a weapon's name. The lookup is held a minute (suggest above), since `d <word>` chat would otherwise cost one each time.
async function guessWeapon(message, text) {
    const key = squash(text);
    const choices = (await suggest(message, findTextCommand('gunsmith'), 'weapon', text)).filter(c => !String(c.value).startsWith('~'));
    const exact = choices.filter(c => squash(choiceName(c.name)) === key || squash(c.value) === key);
    return exact.length === 1 ? String(exact[0].value) : null;
}

// A weapon named after gunsmith (`d gs kilo ar`): /gunsmith's own textWeapon (commands/gunsmith.js), read through client.commands. Held a minute like the suggestions above; null when the lookup failed.
async function weaponFor(message, textCommand, text) {
    const key = `${textCommand.slash}|${textCommand.sub || ''}|weapon*|${squash(text)}`;
    const hit = suggestions.get(key);
    if (hit && Date.now() - hit.at < SUGGEST_MS) return hit.list;
    try {
        const found = await message.client.commands.get('gunsmith').textWeapon(textCommand.sub === 'dmz' ? 'DMZ' : 'MP', text);
        suggestions.set(key, { list: found, at: Date.now() });
        return found;
    } catch (err) {
        console.error(`Text command ${textCommand.name}: could not look up "${text}":`, err?.message || err);
        return null;
    }
}

// A run's lookups. Returns { kind: 'run', verdict } with every value filled, { kind: 'pick', … } (several candidates: Did you mean, up to 5), { kind: 'noMatch', text }, or null (silent). A weapon goes through weaponFor above; a patch-notes season through the slash command's suggestions, where after `d`/`dior` anything but one confident hit is silent; only `@Dioreo` or `/` gets the card or the line.
async function resolveRun(message, verdict) {
    const textCommand = findTextCommand(verdict.command);
    if (!textCommand) return null;
    const values = { ...(verdict.values || {}) };
    for (const ac of verdict.autocomplete || []) {
        if (ac.option === 'weapon') {
            const found = await weaponFor(message, textCommand, ac.text);
            if (!found) return null;
            if (found.hit) { values.weapon = found.hit.value; continue; }
            // Every typed word named a weapon, but more than one fits (`d build kilo`: KILO 141 and KILO BOLT-ACTION). That is a weapon request whichever prefix it came with, so it gets Did you mean after `d` too (Harkirat, 2026-10-29 11:05 EDT: "how do we handle when multiple weapons fit the search? such as if someone typed 'd build kilo'"). A LOOSE match (no typed word is a weapon word: `d gs lol`) is offered only after @Dioreo, and never run.
            const list = found.several.length ? found.several : (verdict.addressed ? found.loose : []);
            if (list.length) return { kind: 'pick', textCommand, choices: list.slice(0, 5).map(c => ({ label: c.label, values: { ...values, weapon: c.value } })) };
            if (!verdict.addressed) return null;
            return { kind: 'noMatch', text: ac.text };
        }
        const { hit, several } = pickChoice(await suggest(message, textCommand, ac.option, ac.text), ac.text, ac.first);
        if (hit) { values[ac.option] = String(hit.value); continue; }
        if (!verdict.addressed) return null;
        if (several.length) return { kind: 'pick', textCommand, choices: several.slice(0, 5).map(c => ({ label: String(c.name), values: { ...values, [ac.option]: String(c.value) } })) };
        return { kind: 'noMatch', text: ac.text };
    }
    return { kind: 'run', verdict: { ...verdict, values } };
}

// What a reply form acts on: the replied message (Convert Times), or the person mentioned or replied to (View Colors). Null when it cannot be read; the command then stays silent.
async function formTargets(message, form, values) {
    if (form === 'convertTimes') {
        const targetMessage = await message.fetchReference().catch(() => null);
        return targetMessage ? { targetMessage } : null;
    }
    if (form === 'viewColors') {
        const id = values.someone || (await message.fetchReference().catch(() => null))?.author?.id;
        if (!id) return null;
        const targetUser = message.mentions?.users?.get?.(id) || await message.client.users.fetch(id).catch(() => null);
        if (!targetUser) return null;
        const targetMember = message.mentions?.members?.get?.(id) || (message.guild?.members?.fetch ? await message.guild.members.fetch(id).catch(() => null) : null);
        return { targetUser, targetMember };
    }
    return {};
}

async function runTextCommand(message, verdict) {
    const textCommand = findTextCommand(verdict.command);
    if (!textCommand) return;
    const { name: moduleName, command } = moduleFor(message.client, textCommand, verdict.form);
    if (!command) return;
    const t = { start: Date.now() };
    // The server's own Integrations switches for this command (his call, 2026-10-28 17:52 EDT). Denied → silent, the same as the slash command simply not being there for this member. A reply form is checked as the right-click it runs.
    if (!(await textCommandAllowed({ client: message.client, guildId: message.guildId, member: message.member, userId: message.author.id, channel: message.channel }, moduleName))) return;
    t.perms = Date.now();
    const targets = await formTargets(message, verdict.form, verdict.values || {});
    if (!targets) return;
    // `+typo` when a near-miss word ran, `+args` when options were given (B2).
    const via = `${verdict.via}${verdict.fuzzy ? '+typo' : ''}${verdict.hasArgs ? '+args' : ''}`;
    const interaction = createTextInteraction(message, { textCommand: { ...textCommand, slash: moduleName, sub: verdict.form ? null : textCommand.sub }, via, values: verdict.values || {}, ...targets });
    const { buildInteractionContext } = require('../handlers/router');
    const { runWithContext } = require('../utils/requestContext');
    const { recordInteractionEvent } = require('../utils/eventStore');
    const ctx = buildInteractionContext(interaction);
    ctx.handler = 'textCommands';
    await runWithContext(ctx, async () => {
        try {
            await require('../utils/guildPolicy').attachGuildPolicy(interaction);
            t.policy = Date.now();
            await command.execute(interaction);
            // "Dioreo User Since" and Your Stats count a text command as the person's own command, after it has run and never when it threw, the same as handlers/router.js's slash route (Harkirat, 2026-10-28 22:19 EDT: text commands should count).
            require('../utils/userStats').noteOwnCommandSafely(interaction);
        } catch (err) {
            ctx.outcome = 'error';
            // A command that opens a form first cannot from a message: unreachable today (every such path has a text form), kept as a guard. The crash line is his #12 (B6, 2026-10-29 16:05 EDT): the Warn sign, the command as typed, gone after 10 s.
            const text = err instanceof TextCommandRefused
                ? `That one opens a form, so it needs the slash command: \`/${textCommand.slash}${textCommand.sub ? ` ${textCommand.sub}` : ''}\`.`
                : `${require('../utils/emojiMap').warn} Something went wrong running \`${verdict.typed || textCommand.name}\`. Try again in a moment.`;
            if (!(err instanceof TextCommandRefused)) console.error(`Text command ${textCommand.name} failed:`, err);
            const sent = await interaction.editReply({ content: text }).catch(() => null);
            if (sent && !(err instanceof TextCommandRefused)) setTimeout(() => { interaction.deleteReply().catch(() => {}); }, CARD_TTL_MS).unref?.();
        } finally {
            recordInteractionEvent(interaction, ctx, message.author.id);
            logTextTiming(message, textCommand, t, interaction);
        }
    });
}

// The plain No match line (his pick, B6, 2026-10-29 14:31 EDT); it deletes itself after 10 s.
function noMatchLine(text) {
    const { cross } = require('../utils/emojiMap');
    return { content: `${cross} No match for “${shownText(text)}”.` };
}

// #4, the timestamp cards (his text, B6, 2026-10-29 14:49 EDT), in /timestamp's teal, the blurple button beside the title opening the pop-up. Case 1: no date at all (`d time`). Case 2: a date that did not read (`@Dioreo time to sleep`). Both delete themselves after 10 s unless pressed.
function timestampCard(textCommand, title, label) {
    const emojis = require('../utils/emojiMap');
    const icon = emojis.parseEmoji(emojis.timestamp);
    return card(TIMESTAMP_ACCENT, [{ type: 9, components: [{ type: 10, content: title }], accessory: { type: 2, style: 1, label, custom_id: runCustomId('txtrun_', textCommand, 'open'), ...(icon ? { emoji: icon } : {}) } }]);
}
function needsInputCard(textCommand, via) {
    const { timestamp } = require('../utils/emojiMap');
    const p = prefixShown(via);
    return timestampCard(textCommand, `### ${timestamp} What date or time?\n-# e.g: \`${p} time in 2 days\` · \`${p} time fri 6pm\`\n-# Confused? \`${p} help timestamp\``, 'Pick date & time');
}
function couldntReadCard(textCommand, via, text) {
    const { cross } = require('../utils/emojiMap');
    const p = prefixShown(via);
    return timestampCard(textCommand, `### ${cross} Couldn't read \`${shownText(text)}\`\n-# Try a date or time: \`${p} time 6 month 7day\` · \`${p} ts fri 6pm\``, 'Try again');
}

// #3, Did you mean for weapons and seasons: #2's card, each button carrying the value it runs, with the command's icon.
function pickCard(textCommand, choices, typed) {
    const emojis = require('../utils/emojiMap');
    const list = choices.slice(0, 5);
    const buttons = list.map(c => pickButton(c.label, runCustomId('txtrun_', textCommand, encodePayload({ values: c.values })), textCommand.icon));
    return card(HELP_ACCENT, titled(`### ${emojis.search} Did you mean ${orList(list.map(c => String(c.label).slice(0, 60)))}?\n-# You typed \`${shownText(typed)}\``, buttons));
}

// DEV BOT ONLY, like handlers/router.js's click log (2026-10-28 18:01 EDT, his question: "why does dioreo take like a second to send a reply"): where a text command's time goes. Nothing is stored; production prints nothing.
function logTextTiming(message, textCommand, t, interaction) {
    try {
        if (process.env.NODE_ENV !== 'development') return;
        const ms = (a, b) => (a && b ? `${b - a} ms` : '—');
        const at = new Date(t.start).toLocaleTimeString('en-US', { hour12: false });
        console.log(`⌨️ ${at} ${textCommand.name} · arrived ${ms(message.createdTimestamp, t.start)} after sending · permissions ${ms(t.start, t.perms)} · server rules ${ms(t.perms, t.policy)} · reply built +${ms(t.start, interaction.__firstSendAt)} · Discord took ${ms(interaction.__firstSendAt, interaction.__firstSentAt)} · done +${ms(t.start, Date.now())}`);
    } catch { /* a diagnostic never breaks a command */ }
}

async function onMessage(message, { edited = false } = {}) {
    if (!message?.guildId || !message.author || message.author.bot || message.webhookId || message.system) return;
    if (edited && answered.has(message.id)) return;
    const client = message.client;
    let verdict = parseTextCommand(message.content || '', {
        botId: client.user.id,
        botRoleId: message.guild?.roles?.botRoleFor?.(client.user)?.id || null,
        prefixes: client.textMessageContent ? configuredPrefixes() : [],
        commands: TEXT_COMMANDS,
        isReply: isReplyTo(message),
        checkDatetime: datetimeChecker(client),
    });
    if (verdict.weaponGuess) {
        const weapon = await guessWeapon(message, verdict.weaponGuess);
        if (weapon) verdict = { kind: 'run', via: verdict.via, command: 'gunsmith', addressed: verdict.addressed, values: { weapon }, autocomplete: [], hasArgs: true };
    }
    if (!verdict.kind) return;
    // Lookups happen BEFORE the limits and the edit-window record, so a message that turns out silent (`d gs skins are cool`) neither counts against the person nor stops an edit from answering.
    let resolved = null;
    if (verdict.kind === 'run') {
        resolved = await resolveRun(message, verdict);
        if (!resolved) return;
    }
    // What they typed after the prefix, for the cards that quote it back.
    const rest = readTrigger(message.content || '', { botId: client.user.id, botRoleId: message.guild?.roles?.botRoleFor?.(client.user)?.id || null, prefixes: client.textMessageContent ? configuredPrefixes() : [] })?.rest || '';
    const typed = typedAs(verdict.via, rest);
    const limited = rateLimited(message, verdict);
    if (limited === 'silent') return;
    if (limited?.warnUntil) return warnCooldown(message, limited, typed);
    answered.set(message.id, Date.now());
    if (!canPost(message)) return dmCantPost(message, typed);
    if (resolved?.kind === 'pick') return reply(message, pickCard(resolved.textCommand, resolved.choices, rest), { ttl: CARD_TTL_MS });
    if (resolved?.kind === 'noMatch') return reply(message, noMatchLine(resolved.text), { ttl: CARD_TTL_MS });
    if (resolved?.kind === 'run') return runTextCommand(message, { ...resolved.verdict, typed });
    if (verdict.kind === 'needsInput') return reply(message, needsInputCard(findTextCommand(verdict.command), verdict.via), { ttl: CARD_TTL_MS });
    if (verdict.kind === 'noMatch' && verdict.option === 'datetime') return reply(message, couldntReadCard(findTextCommand(verdict.command), verdict.via, verdict.text), { ttl: CARD_TTL_MS });
    if (verdict.kind === 'noMatch') return reply(message, noMatchLine(verdict.text), { ttl: CARD_TTL_MS });
    if (verdict.kind === 'help') return reply(message, helpCard(client));
    if (verdict.kind === 'didYouMean') return reply(message, didYouMeanCard(verdict.candidates, rest), { ttl: CARD_TTL_MS });
    if (verdict.kind === 'emojiReply') return reply(message, { content: mentionReplyEmoji(client) });
}

// Wired from index.js on the PUBLIC client only. Dioreo Admin is never in a server.
function registerTextCommands(client) {
    client.on('messageCreate', message => {
        onMessage(message).catch(err => console.error('Text command listener failed:', err));
    });
    // A member who fixes a typo by editing gets an answer, within a minute and only if the first try got none (think-pass, 2026-10-28 16:46 EDT).
    client.on('messageUpdate', (_old, message) => {
        if (!message?.createdTimestamp || Date.now() - message.createdTimestamp > EDIT_WINDOW_MS) return;
        onMessage(message, { edited: true }).catch(err => console.error('Text command listener (edit) failed:', err));
    });
    // An admin's switch takes effect on the very next message (utils/textCommands/permissions.js caches a minute otherwise).
    client.on('applicationCommandPermissionsUpdate', data => {
        if (data?.guildId) require('../utils/textCommands/permissions').invalidateGuildOverrides(data.guildId);
    });
    // Keeps the in-memory maps small. unref'd so it never holds the process open.
    setInterval(() => {
        const now = Date.now();
        for (const [k, last] of lastByUser) if (now - last.at > SAME_COMMAND_COOLDOWN_MS) { lastByUser.delete(k); warned.delete(k); }
        for (const [k, hits] of channelHits) if (!hits.some(t => now - t < CHANNEL_WINDOW_MS)) channelHits.delete(k);
        for (const [k, hits] of serverHits) if (!hits.some(t => now - t < CHANNEL_WINDOW_MS)) serverHits.delete(k);
        for (const [k, t] of answered) if (now - t > EDIT_WINDOW_MS * 2) answered.delete(k);
        for (const [k, t] of cantPostDms) if (now - t > CANT_POST_DM_MS) cantPostDms.delete(k);
        for (const [k, s] of suggestions) if (now - s.at > SUGGEST_MS) suggestions.delete(k);
    }, 10 * 60 * 1000).unref();
}

module.exports = { mentionReplyEmoji, registerTextCommands, enableMessageContentIfGranted, configuredPrefixes, onMessage, helpCard, didYouMeanCard, pickCard, cantPostCard, POPUP_TTL_MS };
