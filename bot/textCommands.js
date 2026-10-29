// bot/textCommands.js -- the text-command listener: `@Dioreo today`, `d today`, `dior today`, `/today` (text commands, PR 1, 2026-10-28 17:24 EDT).
//
// WHY THIS EXISTS: a server can switch off Use Application Commands, and a server with more than ~50 bots stops listing newer bots' slash commands (「𝐆𝐇𝐎𝐒𝐓」, 54 bots, measured 2026-10-28 15:54 EDT). A text command is an ordinary message, so neither applies. Buttons on the reply still work where app commands are denied (spike, 2026-10-28 16:31 EDT).
//
// ⚠️ THIS IS AN EXCEPTION TO "the bot answers only through interactions" (root CLAUDE.md): a text command is answered with an ordinary channel message, as a reply to the member's own message, and only when they addressed Dioreo. utils/textCommands/parse.js decides that, and when in doubt it stays silent.
//
// ⚠️ Not covered by handlers/router.js's crash net: every listener here catches its own errors.
const { PermissionFlagsBits, IntentsBitField, GatewayIntentBits, Routes } = require('discord.js');
const { parseTextCommand } = require('../utils/textCommands/parse');
const { TEXT_COMMANDS, findTextCommand, toIdPart } = require('../utils/textCommands/commands');
const { createTextInteraction, TextCommandRefused } = require('../utils/textCommands/adapter');
const { textCommandAllowed } = require('../utils/textCommands/permissions');

// His rule (2026-10-28 18:10 EDT): "a 5 second per person limit if it's the same command (with a warning message and countdown within the message, the message then deletes itself) and 1 second for any command that's not the same (no warning needed)". Replaced a 1-second same-command limit, which had replaced a 3-second any-command one after his 18:05 EDT report that a quick second command did nothing.
const SAME_COMMAND_COOLDOWN_MS = 5000;
const ANY_COMMAND_COOLDOWN_MS = 1000;
const CHANNEL_WINDOW_MS = 10_000;
const CHANNEL_MAX_REPLIES = 5;
const EDIT_WINDOW_MS = 60_000;
// Where Dioreo can't post, the member gets one DM per channel per day (Harkirat, 2026-10-28 17:18 EDT: "let's do 1 dm PER channel PER server, once per day"). Held in memory only: a restart forgets it, and nothing is stored.
const CANT_POST_DM_MS = 24 * 60 * 60 * 1000;

const lastByUser = new Map();
const channelHits = new Map();
const answered = new Map();
const cantPostDms = new Map();

// The prefixes come from the environment so the dev bot can use its own: prod and dev are both in Dioreoland and would otherwise both answer `d today` (think-pass, 2026-10-28 16:44 EDT). .env.dev sets TEXT_PREFIXES=dd,diordev.
function configuredPrefixes(env = process.env) {
    const raw = env.TEXT_PREFIXES === undefined ? '/,d,dior' : env.TEXT_PREFIXES;
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

// Returns null (go ahead), 'silent', or { warnUntil } for the same command too soon. `lastByUser` holds the person's last command and when; `warned` remembers one warning per cooldown, so a burst of repeats gets one countdown, not one each.
const warned = new Map();
function rateLimited(message, verdict) {
    const now = Date.now();
    const key = verdict.command || verdict.kind;
    const last = lastByUser.get(message.author.id);
    if (last) {
        if (last.key === key && now - last.at < SAME_COMMAND_COOLDOWN_MS) {
            const until = last.at + SAME_COMMAND_COOLDOWN_MS;
            if (warned.get(message.author.id) === last.at) return 'silent';
            warned.set(message.author.id, last.at);
            return { warnUntil: until, key };
        }
        if (last.key !== key && now - last.at < ANY_COMMAND_COOLDOWN_MS) return 'silent';
    }
    const hits = (channelHits.get(message.channelId) || []).filter(t => now - t < CHANNEL_WINDOW_MS);
    if (hits.length >= CHANNEL_MAX_REPLIES) return 'silent';
    hits.push(now);
    channelHits.set(message.channelId, hits);
    lastByUser.set(message.author.id, { key, at: now });
    return null;
}

// The countdown is Discord's own relative timestamp (`<t:…:R>`, "in 4 seconds"), which every client counts down live; the warning deletes itself when the wait is over. A bot may always delete its own message.
async function warnCooldown(message, { warnUntil, key }) {
    if (!canPost(message)) return;
    const unix = Math.ceil(warnUntil / 1000);
    const created = await message.client.rest.post(Routes.channelMessages(message.channelId), {
        body: {
            content: `⏳ You can run \`${key}\` again <t:${unix}:R>.`,
            allowed_mentions: { parse: [], replied_user: false },
            message_reference: { message_id: message.id, fail_if_not_exists: false },
        },
    }).catch(() => null);
    if (!created?.id) return;
    setTimeout(() => {
        message.client.rest.delete(Routes.channelMessage(message.channelId, created.id)).catch(() => {});
    }, Math.max(1000, warnUntil - Date.now() + 500)).unref?.();
}

async function dmCantPost(message) {
    const key = `${message.author.id}:${message.channelId}`;
    if (Date.now() - (cantPostDms.get(key) || 0) < CANT_POST_DM_MS) return;
    cantPostDms.set(key, Date.now());
    const where = message.guild?.name ? ` in **${message.guild.name}**` : '';
    await message.author.send({
        content: `I can't post in <#${message.channelId}>${where}. Ask a server admin to let me send messages there, or try another channel.`,
        allowedMentions: { parse: [] },
    }).catch(() => { /* their DMs are closed; nothing else can reach them */ });
}

async function reply(message, body) {
    const plain = { allowed_mentions: { parse: [], replied_user: false }, ...body };
    const route = Routes.channelMessages(message.channelId);
    // Without Read Message History a reply is refused (50013); the same text goes out as a plain message instead.
    await message.client.rest.post(route, { body: { ...plain, message_reference: { message_id: message.id, fail_if_not_exists: false } } })
        .catch(err => { if (err?.code !== 50013) throw err; return message.client.rest.post(route, { body: plain }); });
}

function formsFor(client) {
    return client.textMessageContent ? '`@Dioreo today` · `d today` · `dior today` · `/today`' : '`@Dioreo today`';
}

function helpCard(client) {
    const list = TEXT_COMMANDS.filter(c => c.name !== 'help').map(c => `\`${c.name}\``).join(' · ');
    return {
        flags: 32768,
        components: [{ type: 17, components: [
            { type: 10, content: `### Text commands\nStart a message with ${formsFor(client)}, then a command:\n${list}\n-# Slash commands work too, where this server shows them.` },
        ] }],
    };
}

function didYouMeanCard(names) {
    return {
        flags: 32768,
        components: [{ type: 17, components: [
            { type: 10, content: '**Did you mean…**' },
            { type: 1, components: names.slice(0, 5).map(name => ({ type: 2, style: 2, label: name, custom_id: `txtrun_${toIdPart(name)}` })) },
        ] }],
    };
}

// The emoji a chatty mention gets (Harkirat, 2026-10-28 17:04 EDT: "have it just reply to the message with an emoji (i'll upload something to /emojis later)"). Read by name at reply time, so uploading `MentionReply` to the app switches it over with no code change.
function mentionReplyEmoji(client) {
    const emoji = client.application?.emojis?.cache?.find?.(e => e.name === 'MentionReply');
    return emoji ? `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>` : '👋';
}

async function runTextCommand(message, verdict) {
    const textCommand = findTextCommand(verdict.command);
    const command = textCommand && message.client.commands.get(textCommand.slash);
    if (!command) return;
    const t = { start: Date.now() };
    // The server's own Integrations switches for this command (his call, 2026-10-28 17:52 EDT). Denied → silent, the same as the slash command simply not being there for this member.
    if (!(await textCommandAllowed({ client: message.client, guildId: message.guildId, member: message.member, userId: message.author.id, channel: message.channel }, textCommand.slash))) return;
    t.perms = Date.now();
    const via = verdict.fuzzy ? `${verdict.via}+typo` : verdict.via;
    const interaction = createTextInteraction(message, { textCommand, via });
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
            const text = err instanceof TextCommandRefused
                ? `That one opens a form, so it needs the slash command: \`/${textCommand.slash}${textCommand.sub ? ` ${textCommand.sub}` : ''}\`.`
                : 'Something went wrong running that. Try again in a moment.';
            if (!(err instanceof TextCommandRefused)) console.error(`Text command ${textCommand.name} failed:`, err);
            await interaction.editReply({ content: text }).catch(() => {});
        } finally {
            recordInteractionEvent(interaction, ctx, message.author.id);
            logTextTiming(message, textCommand, t, interaction);
        }
    });
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
    const verdict = parseTextCommand(message.content || '', {
        botId: client.user.id,
        botRoleId: message.guild?.roles?.botRoleFor?.(client.user)?.id || null,
        prefixes: client.textMessageContent ? configuredPrefixes() : [],
        commands: TEXT_COMMANDS,
    });
    if (!verdict.kind) return;
    const limited = rateLimited(message, verdict);
    if (limited === 'silent') return;
    if (limited?.warnUntil) return warnCooldown(message, limited);
    answered.set(message.id, Date.now());
    if (!canPost(message)) return dmCantPost(message);
    if (verdict.kind === 'run') return runTextCommand(message, verdict);
    if (verdict.kind === 'help') return reply(message, helpCard(client));
    if (verdict.kind === 'didYouMean') return reply(message, didYouMeanCard(verdict.candidates));
    if (verdict.kind === 'emojiReply') return reply(message, { content: mentionReplyEmoji(client) });
    if (verdict.kind === 'roleHint') return reply(message, { content: `Mention me, not my role: pick **${client.user.username}** with the APP tag from the @ list, or type ${formsFor(client)}.` });
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
        for (const [k, t] of answered) if (now - t > EDIT_WINDOW_MS * 2) answered.delete(k);
        for (const [k, t] of cantPostDms) if (now - t > CANT_POST_DM_MS) cantPostDms.delete(k);
    }, 10 * 60 * 1000).unref();
}

module.exports = { registerTextCommands, enableMessageContentIfGranted, configuredPrefixes, onMessage };
