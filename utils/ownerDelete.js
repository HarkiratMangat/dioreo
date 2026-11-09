// utils/ownerDelete.js -- the owner deletes Dioreo's own messages: `d owner delete …` typed in a server, or `/bot delete` on Dioreo Admin.
//
// Harkirat, 2026-11-09 10:57 EST (his go 11:59 EST): "owner only command to delete dioreo's own messages `d owner delete [server id] [channel id] [message id(s)|number]`. Aliases: `override`, `dev`. Delete: `d`, `purge`. Command stays completely silent for anyone else attempting to use it. … `d owner delete` alone would just delete the last dioreo message in the current channel … 5s confirmation/warnings timer, not 10s."
//
// What it reads, in any order after the verb:
//   · a message id, or a message link (which carries its own channel);
//   · a small number N (1-100): Dioreo's last N messages in the channel;
//   · a channel id or #mention: the channel to act in (default: where it was typed);
//   · a server id: accepted and ignored, because the channel already names its server. Only LEADING ids are looked up as a server or a channel; from the first id that is neither, every id is a message.
// Nothing at all = Dioreo's last message here.
//
// ⚠️ ONLY DIOREO'S OWN MESSAGES, CHECKED BY AUTHOR BEFORE EVERY DELETE. A bot can delete its own messages anywhere it can see them, with no permission; it can delete ANYONE's where a server granted it Manage Messages. So the author check is what keeps this to Dioreo's messages, not Discord. A message written by Dioreo Admin is deleted with Dioreo Admin's own token.
//
// ⚠️ All REST, no cache: the bot runs with a message cache of 0 (.claude/rules/text-commands.md), and REST is what the tests can stand in for. Deletes go one at a time: bulk delete needs Manage Messages.
const { Routes } = require('discord.js');

const OWNER_WORDS = ['owner', 'override', 'dev'];
const DELETE_WORDS = ['delete', 'd', 'purge'];
const MAX_LAST = 100;
// How far back "last N" looks for Dioreo's messages: 5 pages of 100.
const HISTORY_PAGES = 5;
// His "5s confirmation/warnings timer, not 10s": the note that says what happened is deleted after this.
const NOTE_TTL_MS = 5000;
const ID = /^\d{15,22}$/;
const LINK = /^<?https?:\/\/(?:(?:ptb|canary|www)\.)?discord(?:app)?\.com\/channels\/(?:\d{15,22}|@me)\/(\d{15,22})\/(\d{15,22})>?$/i;

// The words after the prefix. null = not an owner command (the ordinary parser carries on); otherwise who may run it is the caller's check, and anyone else gets silence.
function readOwnerCommand(rest) {
    const tokens = String(rest || '').trim().split(/\s+/).filter(Boolean);
    if (!tokens.length || !OWNER_WORDS.includes(tokens[0].toLowerCase())) return null;
    const verb = (tokens[1] || '').toLowerCase();
    if (!DELETE_WORDS.includes(verb)) return { kind: 'unknown' };
    return { kind: 'delete', words: tokens.slice(2) };
}

function parseTargets(words) {
    const out = { ids: [], links: [], count: null, channelIds: [], ignored: [] };
    for (const raw of words || []) {
        const w = String(raw).replace(/,+$/, '');
        if (!w) continue;
        let m;
        if ((m = w.match(/^<#(\d{15,22})>$/))) out.channelIds.push(m[1]);
        else if ((m = w.match(LINK))) out.links.push({ channelId: m[1], messageId: m[2] });
        else if (ID.test(w)) out.ids.push(w);
        else if (/^\d{1,3}$/.test(w) && out.count === null && Number(w) >= 1) out.count = Math.min(Number(w), MAX_LAST);
        else out.ignored.push(w);
    }
    return out;
}

async function channelExists(client, id) {
    try { return Boolean(await client.rest.get(Routes.channel(id))); } catch { return false; }
}

// Turns the words into one plan: which channel, which message ids, how many of the last ones.
async function resolveTargets({ client, words, hereChannelId, channelId: explicit = null }) {
    const t = parseTargets(words);
    let channelId = explicit || t.channelIds[0] || null;
    const messageIds = [];
    let leading = true;
    for (const id of t.ids) {
        if (leading) {
            if (client.guilds?.cache?.has?.(id)) continue;
            if (!channelId && await channelExists(client, id)) { channelId = id; continue; }
            leading = false;
        }
        if (!messageIds.includes(id)) messageIds.push(id);
    }
    const count = t.count ?? (messageIds.length || t.links.length ? null : 1);
    return { channelId: channelId || hereChannelId, messageIds, links: t.links, count, ignored: t.ignored };
}

const codeOf = e => e?.code ?? e?.rawError?.code;
function classify(e, result) {
    const code = codeOf(e);
    if (code === 10008 || code === 10003 || e?.status === 404) result.notFound++;
    else if (code === 50001 || code === 50013 || e?.status === 403) result.noAccess++;
    else result.failed++;
}

// Dioreo's newest `count` messages in a channel, newest first.
async function lastOwn(client, channelId, authorId, count) {
    const found = [];
    let before = null;
    for (let page = 0; page < HISTORY_PAGES && found.length < count; page++) {
        const query = new URLSearchParams({ limit: '100' });
        if (before) query.set('before', before);
        const batch = await client.rest.get(Routes.channelMessages(channelId), { query });
        if (!Array.isArray(batch) || !batch.length) break;
        for (const m of batch) if (m.author?.id === authorId && found.length < count) found.push(m.id);
        before = batch[batch.length - 1].id;
        if (batch.length < 100) break;
    }
    return found;
}

async function runDelete({ client, adminClient = null, plan }) {
    const result = { deleted: 0, notFound: 0, notOurs: 0, noAccess: 0, failed: 0, asked: plan.count, foundLast: null, ignored: plan.ignored || [] };
    const ours = new Map([[client.user.id, client]]);
    if (adminClient?.user?.id && adminClient.user.id !== client.user.id) ours.set(adminClient.user.id, adminClient);
    const del = async (by, channelId, id) => {
        try { await by.rest.delete(Routes.channelMessage(channelId, id)); result.deleted++; } catch (e) { classify(e, result); }
    };
    const done = new Set();
    if (plan.count) {
        let ids = [];
        try { ids = await lastOwn(client, plan.channelId, client.user.id, plan.count); } catch (e) { classify(e, result); }
        result.foundLast = ids.length;
        for (const id of ids) { done.add(id); await del(client, plan.channelId, id); }
    }
    const jobs = [...plan.messageIds.map(id => ({ channelId: plan.channelId, id })), ...plan.links.map(l => ({ channelId: l.channelId, id: l.messageId }))];
    for (const job of jobs) {
        if (done.has(job.id)) continue;
        done.add(job.id);
        let msg;
        try { msg = await client.rest.get(Routes.channelMessage(job.channelId, job.id)); } catch (e) { classify(e, result); continue; }
        const by = ours.get(msg?.author?.id);
        if (!by) { result.notOurs++; continue; }
        await del(by, job.channelId, job.id);
    }
    return result;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
function noteText(r) {
    const emojis = require('./emojiMap');
    const head = r.deleted
        ? `${emojis.broom || ''} Deleted **${plural(r.deleted, 'message')}**.`
        : (r.asked && r.foundLast === 0 ? `${emojis.warn || ''} No Dioreo message found here.` : `${emojis.warn || ''} Nothing deleted.`);
    const why = [];
    if (r.asked && r.foundLast !== null && r.foundLast > 0 && r.foundLast < r.asked) why.push(`only ${r.foundLast} of Dioreo's in the last ${HISTORY_PAGES * 100}`);
    if (r.notFound) why.push(`${r.notFound} not found`);
    if (r.notOurs) why.push(`${r.notOurs} not Dioreo's`);
    if (r.noAccess) why.push(`${r.noAccess} where Dioreo can't see`);
    if (r.failed) why.push(`${r.failed} failed`);
    if (r.ignored?.length) why.push(`ignored ${r.ignored.slice(0, 3).map(w => `\`${w.replace(/`/g, '').slice(0, 24)}\``).join(', ')}`);
    return [head.trim(), why.length ? `-# ${emojis.warn} ${why.join(' · ')}` : null].filter(Boolean).join('\n');
}

function adminOf(client) {
    const { clients } = require('../bot/clients');
    return clients.admin && clients.admin !== client ? clients.admin : null;
}

// `d owner delete …` from the owner. The note goes in the channel he typed in, as a reply that pings no one, and is deleted after NOTE_TTL_MS; where Dioreo can't post there is no note.
async function runFromMessage(message, words, { canPost = true } = {}) {
    const client = message.client;
    const plan = await resolveTargets({ client, words, hereChannelId: message.channelId });
    const result = await runDelete({ client, adminClient: adminOf(client), plan });
    if (!canPost) return result;
    const note = await client.rest.post(Routes.channelMessages(message.channelId), {
        body: { content: noteText(result), allowed_mentions: { parse: [], replied_user: false }, message_reference: { message_id: message.id, fail_if_not_exists: false } },
    }).catch(() => null);
    if (note?.id) setTimeout(() => { client.rest.delete(Routes.channelMessage(message.channelId, note.id)).catch(() => {}); }, NOTE_TTL_MS).unref?.();
    return result;
}

// `/bot delete` on Dioreo Admin (owner-checked by commands/bot.js). Deletes through the public app; answers privately, so no timer.
async function runFromSlash(interaction) {
    const { publicClient } = require('../bot/clients');
    const client = publicClient(interaction.client);
    const words = String(interaction.options.getString('messages') || '').split(/[\s,]+/).filter(Boolean);
    const channelText = String(interaction.options.getString('channel') || '').trim().replace(/^<#(\d+)>$/, '$1');
    if (channelText && !ID.test(channelText)) return interaction.editReply({ content: `${require('./emojiMap').cross} That is not a channel ID: 17–20 digits.` });
    const plan = await resolveTargets({ client, words, hereChannelId: interaction.channelId, channelId: channelText || null });
    const result = await runDelete({ client, adminClient: adminOf(client) || (interaction.client !== client ? interaction.client : null), plan });
    return interaction.editReply({ content: noteText(result), allowedMentions: { parse: [] } });
}

module.exports = { OWNER_WORDS, DELETE_WORDS, MAX_LAST, NOTE_TTL_MS, readOwnerCommand, parseTargets, resolveTargets, runDelete, noteText, runFromMessage, runFromSlash };
