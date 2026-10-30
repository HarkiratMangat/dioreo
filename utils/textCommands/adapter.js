// utils/textCommands/adapter.js -- makes a plain channel message look enough like a slash-command interaction that a command's own execute() answers it (text commands, PR 1, 2026-10-28 17:24 EDT).
//
// WHY AN ADAPTER AND NOT A SECOND RENDERER PER COMMAND: every command already builds its panel, reads /settings, applies the server's /admin rules and arms the idle grey-out. A second renderer per command would duplicate all of that and drift. The adapter answers the handful of methods the commands actually call (the full list was read off the tree with `rg -o 'interaction\??\.(\w+)'` on 2026-10-28) and turns every send into a normal message that REPLIES to the member's own message.
//
// Three rules it enforces, each Harkirat's:
//   - Public by default. A text command ignores the member's /settings "Hidden" (2026-10-28 17:14 EDT: "why dont we just default to public for @mention or prefix commands"), because typing in a channel is already public. So the ephemeral flag a command passes is dropped...
//   - ...and the server's slash-command visibility rules do not apply either (B7, 2026-10-30; his 2026-10-29 15:54 EDT: "text commands aren't private, so they're either a 'turn off here or allow here' sort of system"). A message can never be private, so the Open privately card this adapter used to post there is gone; where a server's /admin turns text commands off, bot/textCommands.js stays silent and nothing reaches here.
//   - Never pings: replied_user is always false and allowed_mentions defaults to none.
const { Routes } = require('discord.js');
const { toIdPart, fromIdPart, findTextCommand } = require('./commands');

const EPHEMERAL = 64;

// A command that opens a pop-up first cannot do that from a message (Discord only opens a modal in answer to an interaction). bot/textCommands.js turns this into a "use the slash command" line.
class TextCommandRefused extends Error {}

// Every getter a command might call. `values` are the options utils/textCommands/args.js read from the message ({ page: 'events' }, { datetime: 'tomorrow 8pm' }); anything not in them answers null, `visibility` included, so a text reply never carries one. getSubcommand answers the text command's own subcommand, so /draw prices and /draw calculator route as they do from Discord.
function buildOptions({ sub = null, values = {} } = {}) {
    const nil = () => null;
    const has = name => values[name] !== undefined && values[name] !== null && values[name] !== '';
    const num = name => (has(name) && Number.isFinite(Number(values[name])) ? Number(values[name]) : null);
    return {
        getString: name => (has(name) ? String(values[name]) : null),
        getInteger: name => (num(name) === null ? null : Math.trunc(num(name))),
        getNumber: num,
        getBoolean: name => (has(name) ? ['true', '1', 'yes'].includes(String(values[name]).toLowerCase()) : null),
        getUser: nil, getMember: nil, getChannel: nil, getRole: nil, getAttachment: nil, getMentionable: nil,
        get: name => (has(name) ? { name, value: values[name] } : null),
        getFocused: () => '',
        getSubcommandGroup: () => null,
        getSubcommand: (required = true) => {
            if (sub) return sub;
            if (required) throw new Error('This text command has no subcommand');
            return null;
        },
        data: Object.keys(values).filter(has).map(name => ({ name, value: values[name] })),
    };
}

// WHAT A TEXT-COMMAND BUTTON CARRIES (B2, 2026-10-29). `txtrun_<command>` and `txtpriv_<command>` gain `~<payload>`: the options as `name=value&…` (values URI-encoded), `@m=<id>` / `@u=<id>` for a reply form's message or person, or the literal `open` (the timestamp pop-up) / `submit` (its answer). A payload that would push the id past Discord's 100 characters is held in memory for 15 minutes as `txtrun_~<id>`; after that the click says to run it again. Ids from before (no `~`) still answer.
const RUN_STORE_MS = 15 * 60 * 1000;
const runStore = new Map();

function encodePayload({ values = {}, targetMessageId = null, targetUserId = null } = {}) {
    const pairs = Object.entries(values).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
    if (targetMessageId) pairs.push(`@m=${targetMessageId}`);
    if (targetUserId) pairs.push(`@u=${targetUserId}`);
    return pairs.join('&');
}

function runCustomId(prefix, textCommand, payload = '') {
    const base = `${prefix}${toIdPart(textCommand.name)}`;
    if (!payload) return base;
    if (base.length + 1 + payload.length <= 100) return `${base}~${payload}`;
    const now = Date.now();
    for (const [key, hit] of runStore) if (now - hit.at > RUN_STORE_MS) runStore.delete(key);
    const id = `${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    runStore.set(id, { name: textCommand.name, payload, at: now });
    // Dropped by its own timer when it expires, not at the next long id: the payload can hold words from the member's message (a typed date), and PRIVACY §2.3 says these are cleared within a quarter of an hour (B4, 2026-10-29 10:32 EDT).
    setTimeout(() => runStore.delete(id), RUN_STORE_MS).unref?.();
    return `${prefix}~${id}`;
}

// `rest` is the custom_id after its prefix. Returns { textCommand, values, targetMessageId, targetUserId, open, submit } or { expired: true }.
function readRunCustomId(rest) {
    let name, payload;
    if (rest.startsWith('~')) {
        const hit = runStore.get(rest.slice(1));
        if (!hit || Date.now() - hit.at > RUN_STORE_MS) return { expired: true };
        ({ name, payload } = hit);
    } else {
        const cut = rest.indexOf('~');
        name = fromIdPart(cut < 0 ? rest : rest.slice(0, cut));
        payload = cut < 0 ? '' : rest.slice(cut + 1);
    }
    const out = { textCommand: findTextCommand(name), values: {}, targetMessageId: null, targetUserId: null, open: payload === 'open', submit: payload === 'submit' };
    if (out.open || out.submit) return out;
    for (const pair of payload.split('&').filter(Boolean)) {
        const eq = pair.indexOf('=');
        if (eq < 1) continue;
        const key = pair.slice(0, eq), value = decodeURIComponent(pair.slice(eq + 1));
        if (key === '@m') out.targetMessageId = value;
        else if (key === '@u') out.targetUserId = value;
        else out.values[key] = value;
    }
    return out;
}

// discord.js reply options -> a raw REST message body. Builders are flattened with toJSON().
function toBody(opts) {
    const o = typeof opts === 'string' ? { content: opts } : { ...(opts || {}) };
    const body = {};
    if (o.content !== undefined) body.content = o.content;
    if (o.components !== undefined) body.components = o.components.map(c => (typeof c?.toJSON === 'function' ? c.toJSON() : c));
    if (o.embeds !== undefined) body.embeds = o.embeds.map(e => (typeof e?.toJSON === 'function' ? e.toJSON() : e));
    if (typeof o.flags === 'number') body.flags = o.flags;
    if (o.allowedMentions) body.allowed_mentions = o.allowedMentions;
    if (o.allowed_mentions) body.allowed_mentions = o.allowed_mentions;
    return { body, files: o.files };
}

// values: the options read from the message. targetUser / targetMember / targetMessage: what a reply form acts on (View Colors' person, Convert Times' message), read by those modules exactly as from a right-click.
function createTextInteraction(message, { textCommand, via, values = {}, targetUser = null, targetMember = null, targetMessage = null }) {
    const client = message.client;
    const channel = message.channel;
    const rest = client.rest;
    const me = message.guild?.members?.me || null;
    let replyId = null;
    let deferred = false;
    let replied = false;
    let typingTimer = null;


    // The one place a message is written. The first send REPLIES to the member's message (and falls back to a plain send if they deleted it); every later send edits that same reply, the way a slash command edits @original.
    async function send(rawBody, files, { newMessage = false } = {}) {
        const body = { ...rawBody };
        if (typeof body.flags === 'number') body.flags &= ~EPHEMERAL;
        body.allowed_mentions = { ...(body.allowed_mentions || { parse: [] }), replied_user: false };
        const opts = files ? { body, files } : { body };
        if (!interaction.__firstSendAt) interaction.__firstSendAt = Date.now();
        clearTimeout(typingTimer);
        if (!replyId || newMessage) {
            opts.body = { ...body, message_reference: { message_id: message.id, fail_if_not_exists: false } };
            // Replying to a message needs Read Message History; a channel that denies Dioreo only that refuses the reply with 50013 (think-pass, 2026-10-28 17:58 EDT). Sent once more as a plain message then.
            const created = await rest.post(Routes.channelMessages(channel.id), opts).catch(err => {
                if (err?.code !== 50013) throw err;
                return rest.post(Routes.channelMessages(channel.id), { ...opts, body });
            });
            if (!interaction.__firstSentAt) interaction.__firstSentAt = Date.now();
            if (!replyId) replyId = created.id;
            return created;
        }
        return rest.patch(Routes.channelMessage(channel.id, replyId), opts);
    }

    const interaction = {
        __dioreoText: true,
        __dioreoVia: via,
        id: message.id,
        applicationId: client.application?.id || client.user?.id,
        token: null,
        client,
        user: message.author,
        member: message.member,
        guild: message.guild,
        guildId: message.guildId,
        channel,
        channelId: message.channelId,
        commandName: textCommand.slash,
        commandType: 1,
        createdTimestamp: message.createdTimestamp,
        locale: 'en-US',
        guildLocale: message.guild?.preferredLocale || null,
        context: 0,
        authorizingIntegrationOwners: { 0: message.guildId },
        memberPermissions: message.member ? channel.permissionsFor(message.member) : null,
        appPermissions: me ? channel.permissionsFor(me) : null,
        options: buildOptions({ sub: textCommand.sub, values }),
        targetUser,
        targetMember,
        targetMessage,
        targetId: targetMessage?.id || targetUser?.id || null,
        ephemeral: false,
        get deferred() { return deferred; },
        get replied() { return replied; },
        isChatInputCommand: () => true,
        isCommand: () => true,
        isRepliable: () => true,
        inGuild: () => true,
        inCachedGuild: () => Boolean(message.guild),
        isButton: () => false,
        isStringSelectMenu: () => false,
        isAnySelectMenu: () => false,
        isUserSelectMenu: () => false,
        isRoleSelectMenu: () => false,
        isChannelSelectMenu: () => false,
        isModalSubmit: () => false,
        isAutocomplete: () => false,
        isContextMenuCommand: () => false,
        isMessageComponent: () => false,
        isUserContextMenuCommand: () => false,
        isMessageContextMenuCommand: () => false,
        async deferReply() {
            deferred = true;
            // "Dioreo is typing…" only if the answer is slow (2026-10-28 18:06 EDT, his "takes like a second"): sent at once it is one more request racing the reply itself, for a panel that is usually ready in well under half a second.
            typingTimer = setTimeout(() => { channel.sendTyping?.().catch(() => {}); }, 600);
            typingTimer.unref?.();
        },
        async reply(opts) {
            replied = true;
            const { body, files } = toBody(opts);
            return send(body, files);
        },
        async editReply(opts) {
            replied = true;
            const { body, files } = toBody(opts);
            return send(body, files);
        },
        // A follow-up is a NEW message (utils/ephemeral.js's privateNotice uses it for a short notice after deleting the panel).
        async followUp(opts) {
            const { body, files } = toBody(opts);
            return send(body, files, { newMessage: true });
        },
        async fetchReply() {
            return replyId ? rest.get(Routes.channelMessage(channel.id, replyId)) : null;
        },
        async deleteReply() {
            if (!replyId) return;
            const id = replyId;
            replyId = null;
            await rest.delete(Routes.channelMessage(channel.id, id)).catch(() => {});
        },
        async deferUpdate() {},
        async update(opts) { return interaction.editReply(opts); },
        async showModal() { throw new TextCommandRefused('modal'); },
        // utils/sendV2Payload.js's text branch writes through here, so the Show Everyone strip and the idle grey-out stay in one place.
        __textSend(body, options = {}) {
            return send(body, options.files);
        },
    };
    return interaction;
}

module.exports = { createTextInteraction, buildOptions, TextCommandRefused, encodePayload, runCustomId, readRunCustomId };
