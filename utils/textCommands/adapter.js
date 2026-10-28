// utils/textCommands/adapter.js -- makes a plain channel message look enough like a slash-command interaction that a command's own execute() answers it (text commands, PR 1, 2026-10-28 17:24 EDT).
//
// WHY AN ADAPTER AND NOT A SECOND RENDERER PER COMMAND: every command already builds its panel, reads /settings, applies the server's /admin rules and arms the idle grey-out. A second renderer per command would duplicate all of that and drift. The adapter answers the handful of methods the commands actually call (the full list was read off the tree with `rg -o 'interaction\??\.(\w+)'` on 2026-10-28) and turns every send into a normal message that REPLIES to the member's own message.
//
// Three rules it enforces, each Harkirat's:
//   - Public by default. A text command ignores the member's /settings "Hidden" (2026-10-28 17:14 EDT: "why dont we just default to public for @mention or prefix commands"), because typing in a channel is already public. So the ephemeral flag a command passes is dropped...
//   - ...EXCEPT when the SERVER's /admin rule forces hidden (attachGuildPolicy sets dioreoPolicy.visibility). A normal message can never be private, so the answer becomes the Open privately card instead, and every later send is swallowed: nothing private is ever posted publicly.
//   - Never pings: replied_user is always false and allowed_mentions defaults to none.
const { Routes } = require('discord.js');
const { toIdPart } = require('./commands');

const EPHEMERAL = 64;

// A command that opens a pop-up first cannot do that from a message (Discord only opens a modal in answer to an interaction). bot/textCommands.js turns this into a "use the slash command" line.
class TextCommandRefused extends Error {}

// Every getter a command might call on a command with no options. getSubcommand answers the text command's own subcommand, so /draw prices and /draw calculator route as they do from Discord.
function buildOptions({ sub = null } = {}) {
    const nil = () => null;
    return {
        getString: nil, getInteger: nil, getNumber: nil, getBoolean: nil, getUser: nil, getMember: nil,
        getChannel: nil, getRole: nil, getAttachment: nil, getMentionable: nil, get: nil,
        getFocused: () => '',
        getSubcommandGroup: () => null,
        getSubcommand: (required = true) => {
            if (sub) return sub;
            if (required) throw new Error('This text command has no subcommand');
            return null;
        },
        data: [],
    };
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

// The card shown where the server's /admin rule says answers are private (his mock-up A, 2026-10-28 17:09 EDT). Anyone may click: it opens THEIR OWN view, privately (think-pass, 2026-10-28 16:46 EDT), so there is nothing to lock.
function privateCardBody(textCommand) {
    return {
        flags: 32768,
        allowed_mentions: { parse: [], replied_user: false },
        components: [{
            type: 17,
            components: [
                { type: 10, content: `-# This server shows Dioreo's answers privately here.` },
                { type: 1, components: [{ type: 2, style: 2, label: 'Open privately', custom_id: `txtpriv_${toIdPart(textCommand.name)}` }] },
            ],
        }],
    };
}

function createTextInteraction(message, { textCommand, via }) {
    const client = message.client;
    const channel = message.channel;
    const rest = client.rest;
    const me = message.guild?.members?.me || null;
    let replyId = null;
    let deferred = false;
    let replied = false;
    let privateCard = false;
    let typingTimer = null;

    const forcedPrivate = () => interaction.dioreoPolicy?.visibility === 'ephemeral';

    // The one place a message is written. The first send REPLIES to the member's message (and falls back to a plain send if they deleted it); every later send edits that same reply, the way a slash command edits @original.
    async function send(rawBody, files, { newMessage = false } = {}) {
        if (privateCard) return null;
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

    async function openPrivately() {
        if (privateCard) return;
        await send(privateCardBody(textCommand));
        privateCard = true;
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
        options: buildOptions({ sub: textCommand.sub }),
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
            if (forcedPrivate()) return openPrivately();
            // "Dioreo is typing…" only if the answer is slow (2026-10-28 18:06 EDT, his "takes like a second"): sent at once it is one more request racing the reply itself, for a panel that is usually ready in well under half a second.
            typingTimer = setTimeout(() => { channel.sendTyping?.().catch(() => {}); }, 600);
            typingTimer.unref?.();
        },
        async reply(opts) {
            replied = true;
            if (forcedPrivate()) return openPrivately();
            const { body, files } = toBody(opts);
            return send(body, files);
        },
        async editReply(opts) {
            replied = true;
            if (forcedPrivate()) return openPrivately();
            const { body, files } = toBody(opts);
            return send(body, files);
        },
        // A follow-up is a NEW message (utils/ephemeral.js's privateNotice uses it for a short notice after deleting the panel).
        async followUp(opts) {
            if (privateCard) return null;
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
        __textSend(body, options = {}) { return send(body, options.files); },
    };
    return interaction;
}

module.exports = { createTextInteraction, buildOptions, TextCommandRefused, privateCardBody };
