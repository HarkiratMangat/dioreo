// utils/announcementRepost.js -- posting chosen announcements on purpose (Harkirat's "option 3", 2026-10-30 22:15 EDT): a multi-select under `/help cmd:announcement visibility:public` when several are running, and the typed form `d announcement <word>` (also `announce` and `repost`; `news` left out, his 22:22 EDT), whose words are matched against each announcement's first two lines.
//
// Nothing here is a delivery: nothing is marked seen and no repeat is counted (utils/announcement.js maybeSendAnnouncement owns that). The Containers are the ones a delivery builds (buildAnnouncementContainer), so a repost looks exactly like the announcement. Running announcements only: an expired one cannot be reposted (his answer, 2026-10-30 22:18 EDT: "for now, no. maybe as a future scope/feature"; filed in docs/db-deferred-list.md's Someday).
//
// ⚠️ ANOTHER CHANNEL IS AN EXCEPTION TO "the bot answers only through interactions" (root CLAUDE.md), his yes 2026-10-30 22:17 EDT: "for channel posting, yes the suggestion and exception make sense". `d repost <name> <channel id>` posts into the channel named, and only for a member with Manage Server in that server (or the bot owner, his ask 22:21 EDT), only in a channel of the same server, and only where Dioreo can post. Deleting the member's own message afterwards was proposed and left out (same message: "for the delete message, leave that out then").
const { PermissionFlagsBits, Routes } = require('discord.js');
const A = require('./announcement');
const { sendV2Payload } = require('./sendV2Payload');

// `ann_pick~<user id>~<where>`: `s` posts publicly as a follow-up (the picker is the private /help reply), `t` replaces the picker in place (the picker is the public text reply), a channel id posts there.
const PICK_PREFIX = 'ann_pick';
const NO_RUNNING = '-# No announcements right now.';

// What a picker option and a typed word see: the first two written lines, without markdown, emoji or layout marks.
function headline(doc) {
    const marks = new Set(['---', '----', '====', '--', '==', '++']);
    return String(doc?.text || '').split('\n')
        .map(line => line.replace(/<a?:(\w+):\d+>/g, '').replace(/<t:\d+(:\w)?>/g, '').replace(/^\s*-#\s*/, '').replace(/^\s*[-*]\s+/, '').replace(/[*_~`>|#]/g, '').replace(/\s+/g, ' ').trim())
        .filter(line => line && !marks.has(line))
        .slice(0, 2);
}

const norm = s => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

// Every running announcement whose first two lines hold every typed word, in posting order.
function matchAnnouncements(active, words) {
    const want = words.map(norm).filter(Boolean);
    if (!want.length) return [...active];
    return active.filter(doc => {
        const head = ` ${norm(headline(doc).join(' '))} `;
        return want.every(w => head.includes(w));
    });
}

// The Containers for a chosen set, cut to what one message holds (utils/announcement.js fitEmbedBudget).
function containersFor(docs) {
    return A.fitEmbedBudget(docs.slice(0, A.MAX_EMBEDS_PER_MESSAGE)).map(doc => A.buildAnnouncementContainer(doc));
}

const quiet = text => [{ type: 17, components: [{ type: 10, content: text }] }];
const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// The picker: one select over every running announcement (25 at most, Discord's cap), pick one or several. Only the person who asked can pick.
function buildPicker(active, { userId, where }) {
    const docs = active.slice(0, 25);
    const options = docs.map((doc, i) => {
        const [first, second] = headline(doc);
        return { label: clip(first || `Announcement ${i + 1}`, 100), value: String(doc._id), ...(second ? { description: clip(second, 100) } : {}) };
    });
    const target = /^\d+$/.test(where) ? ` in <#${where}>` : '';
    return [{
        type: 17,
        components: [
            { type: 10, content: `### Which announcements should I post${target}?\n-# Pick one or several. Only <@${userId}> can pick.` },
            { type: 1, components: [{ type: 3, custom_id: `${PICK_PREFIX}~${userId}~${where}`, placeholder: 'Pick announcements', min_values: 1, max_values: options.length, options }] },
        ],
    }];
}

// Can this member post into that channel through Dioreo? Returns { channel } or { error } with the line to show.
async function channelTarget(interaction, channelId) {
    const guild = interaction.guild;
    if (!guild) return { error: 'Posting into a channel only works in a server.' };
    const member = interaction.member;
    // The bot owner may too, without Manage Server (his ask, 2026-10-30 22:21 EDT: "what about me? the owner?"); the Dioreo-can-post check below still applies to him.
    const owner = require('./owner').isOwnerId(interaction.user.id);
    if (!owner && !member?.permissions?.has?.(PermissionFlagsBits.ManageGuild)) return { error: 'Posting into another channel needs **Manage Server**.' };
    const channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
    if (!channel || channel.guildId !== guild.id || typeof channel.isTextBased !== 'function' || !channel.isTextBased()) return { error: `I can't find <#${channelId}> in this server.` };
    const me = guild.members.me;
    const perms = me ? channel.permissionsFor(me) : null;
    const send = channel.isThread?.() ? PermissionFlagsBits.SendMessagesInThreads : PermissionFlagsBits.SendMessages;
    if (!perms?.has(PermissionFlagsBits.ViewChannel) || !perms.has(send)) return { error: `I can't post in <#${channelId}>.` };
    return { channel };
}

// One plain V2 message into the named channel, never pinging anyone.
function postToChannel(rest, channelId, components) {
    return rest.post(Routes.channelMessages(channelId), { body: { flags: 32768, components, allowed_mentions: { parse: [] } } });
}

const posted = (n, channelId) => quiet(`${require('./emojiMap').checkmark || ''} Posted ${n === 1 ? 'the announcement' : `${n} announcements`}${channelId ? ` in <#${channelId}>` : ''}.`.trim());

// The last word, when it is a channel id or a #channel mention.
function splitChannel(words) {
    const last = words[words.length - 1] || '';
    const m = /^(?:<#(\d{15,22})>|(\d{15,22}))$/.exec(last);
    return m ? { words: words.slice(0, -1), channelId: m[1] || m[2] } : { words, channelId: null };
}

// The typed form: `d announcement`, `d announce launch`, `d repost launch 123…`. `args` is everything after the command word.
async function executeText(interaction, args = '') {
    const split = splitChannel(String(args || '').trim().split(/\s+/).filter(Boolean));
    let target = null;
    if (split.channelId) {
        const t = await channelTarget(interaction, split.channelId);
        if (t.error) return sendV2Payload(interaction, quiet(t.error), { allowedMentions: { parse: [] } });
        target = t.channel;
    }
    const active = await A.getActiveAnnouncements();
    if (!active.length) return sendV2Payload(interaction, quiet(NO_RUNNING), { allowedMentions: { parse: [] } });
    const chosen = matchAnnouncements(active, split.words);
    if (split.words.length && !chosen.length) {
        const typed = split.words.join(' ').replace(/[`\\]/g, '');
        return sendV2Payload(interaction, quiet(`${require('./emojiMap').cross || ''} No running announcement matches “${clip(typed, 80)}”.`.trim()), { allowedMentions: { parse: [] } });
    }
    // No words and several running: the picker. Words always post what they matched.
    if (!split.words.length && chosen.length > 1) {
        return sendV2Payload(interaction, buildPicker(chosen, { userId: interaction.user.id, where: target ? target.id : 't' }), { allowedMentions: { parse: [] } });
    }
    const containers = containersFor(chosen);
    if (!target) return sendV2Payload(interaction, containers, { allowedMentions: { parse: [] }, skipExpiry: true });
    await postToChannel(interaction.client.rest, target.id, containers);
    return sendV2Payload(interaction, posted(containers.length, target.id), { allowedMentions: { parse: [] } });
}

// `/help cmd:announcement`: hidden shows every running one privately, as before; public posts the one running, or with several opens the picker privately first.
async function executeSlash(interaction, visibility) {
    const isPublic = visibility === 'public';
    const active = isPublic ? await A.getActiveAnnouncements() : null;
    if (isPublic && active.length > 1) {
        await interaction.deferReply({ flags: 64 });
        return sendV2Payload(interaction, buildPicker(active, { userId: interaction.user.id, where: 's' }), { allowedMentions: { parse: [] } });
    }
    await interaction.deferReply({ flags: isPublic ? 0 : 64 });
    return sendV2Payload(interaction, await A.buildActiveAnnouncementComponents(), { allowedMentions: { parse: [] } });
}

// The pick, from either picker. The router's crash net covers this (handlers/announcementControls.js).
async function handlePick(interaction) {
    const [, ownerId, where] = interaction.customId.split('~');
    if (interaction.user.id !== ownerId) {
        return interaction.reply({ flags: 64, content: `Only <@${ownerId}> can pick here.`, allowedMentions: { parse: [] } });
    }
    await interaction.deferUpdate();
    const ids = new Set(interaction.values || []);
    // Re-read, so one that expired while the picker was open is not posted.
    const chosen = (await A.getActiveAnnouncements()).filter(doc => ids.has(String(doc._id)));
    if (!chosen.length) return sendV2Payload(interaction, quiet('-# Those announcements are no longer running.'), { allowedMentions: { parse: [] } });
    const containers = containersFor(chosen);
    if (where === 't') return sendV2Payload(interaction, containers, { allowedMentions: { parse: [] }, skipExpiry: true });
    if (where === 's') {
        await interaction.followUp({ flags: 32768, components: containers, allowedMentions: { parse: [] } });
        return sendV2Payload(interaction, posted(containers.length, null), { allowedMentions: { parse: [] } });
    }
    // A channel: checked again at the pick, since permissions can change while the picker is open.
    const t = await channelTarget(interaction, where);
    if (t.error) return sendV2Payload(interaction, quiet(t.error), { allowedMentions: { parse: [] } });
    await postToChannel(interaction.client.rest, t.channel.id, containers);
    return sendV2Payload(interaction, posted(containers.length, t.channel.id), { allowedMentions: { parse: [] } });
}

module.exports = { executeText, execute: executeText, executeSlash, handlePick, headline, matchAnnouncements, buildPicker, splitChannel, PICK_PREFIX };
