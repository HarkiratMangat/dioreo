// utils/ownerInbox.js -- where the owner's notices go (2026-11-14 13:15 EST, Harkirat: "can we also move the DMs and stuff for things like disputes/submissions, etc into 1571205127413698744 channel? (and have them ping me)").
//
// With OWNER_CHANNEL set (prod: #needs-my-eyes in dioreoland), a notice is posted there with one ping for the owner and nobody else. Unset, or when that post fails (the channel was deleted, or this app cannot post there), it is a DM to the owner as before, and the failure is logged, so a notice is never lost. Every owner notice goes through here: Submit a Build, Dispute a Build and Bugs & Suggestions (through utils/buildSubmissions.js dmOwner), the spam ladder's 6 h and 12 h notes, the promote notes, and the draw end-date reminder. Players' DMs are untouched. A named exception in CLAUDE.md's "answers ONLY through interactions" invariant: one private channel of the owner's own server, set by env, never another.
const { Routes } = require('discord.js');
const { ALLOWED_ADMIN_ID } = require('./owner');

const ownerChannel = (env = process.env) => String(env.OWNER_CHANNEL || '').trim();

// The ping: its own text line above a Components V2 card (a V2 message carries no `content`), or in front of plain text.
function withPing(body) {
    const mention = `<@${ALLOWED_ADMIN_ID}>`;
    if (Number(body?.flags || 0) & 32768) return { ...body, components: [{ type: 10, content: mention }, ...(body.components || [])] };
    return { ...body, content: `${mention} ${body?.content || ''}`.trim() };
}

// Returns { channelId, message, client, where }; `where` is 'channel' or 'dm'. Throws only when the DM fails too.
async function postOwnerNotice(client, body, files = [], { env = process.env } = {}) {
    const channelId = ownerChannel(env);
    if (channelId) {
        try {
            const message = await client.rest.post(Routes.channelMessages(channelId), { body: { ...withPing(body), allowed_mentions: { users: [ALLOWED_ADMIN_ID] } }, files });
            return { channelId, message, client, where: 'channel' };
        } catch (err) {
            console.error(`Owner notice: could not post in channel ${channelId}, sending a DM instead:`, err?.message || err);
        }
    }
    const dm = await client.rest.post(Routes.userChannels(), { body: { recipient_id: ALLOWED_ADMIN_ID } });
    const message = await client.rest.post(Routes.channelMessages(dm.id), { body: { ...body, allowed_mentions: { parse: [] } }, files });
    return { channelId: dm.id, message, client, where: 'dm' };
}

module.exports = { postOwnerNotice, withPing, ownerChannel };
