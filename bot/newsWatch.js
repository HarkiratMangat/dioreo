// bot/newsWatch.js -- wires news-channel triage onto the Dioreo Admin client (built 2026-11-04 20:02 EST). Listeners, the boot catch-up and the daily skipped list; the work itself is utils/newsTriage/pipeline.js.
//
// Off unless NEWS_WATCH (the followed channels' ids) and NEWS_CHANNEL (where cards go) are both set. Prod watches #leaks and #official-codm-news and cards into #news-distill; the dev bot cards into #testing-spam, so the two never post into one channel (Harkirat's setup, 2026-11-04 19:43 EST).
const { Events, Routes, IntentsBitField, GatewayIntentBits } = require('discord.js');
const pipeline = require('../utils/newsTriage/pipeline');

// Message Content only when the app's flags grant it (bit 18 or 19): asking for a privileged intent the app lacks makes login fail. Without it Discord sends a crosspost's text empty and every post is skipped as "no text". Same check as bot/textCommands.js's, for the public app.
async function enableNewsMessageContent(client, token) {
    try {
        client.rest.setToken(token);
        const app = await client.rest.get(Routes.currentApplication());
        const flags = Number(app?.flags || 0);
        const granted = Boolean(flags & (1 << 18)) || Boolean(flags & (1 << 19));
        if (granted) client.options.intents = new IntentsBitField(client.options.intents).add(GatewayIntentBits.MessageContent);
        console.log(`📰 News triage: ${granted ? 'Message Content granted' : 'Message Content NOT granted, posts will read empty'}`);
        return granted;
    } catch (err) {
        console.error('News triage: could not read the admin app flags:', err?.message || err);
        return false;
    }
}

const appIdOf = client => client.application?.id ?? client.user?.id ?? null;

async function updateCursor(channelId, messageId) {
    const NewsCursor = require('../models/NewsCursor');
    const cur = await NewsCursor.findOne({ channelId }).lean();
    if (cur && BigInt(cur.lastMessageId) >= BigInt(messageId)) return;
    await NewsCursor.updateOne({ channelId }, { $set: { lastMessageId: messageId } }, { upsert: true });
}

async function handle(client, message) {
    const post = pipeline.toPost(message);
    const result = await pipeline.processPost(post, { rest: client.rest, selfId: client.user?.id, appId: appIdOf(client) });
    await updateCursor(post.channelId, post.id).catch(err => console.error('News triage: cursor update failed:', err?.message || err));
    // Every outcome is logged, one line each (2026-11-04 22:10 EST): a read that ended in no card used to leave no trace but an in-memory list, which is how CODM's own season post went missing unnoticed.
    if (result.status !== 'not watched' && result.status !== 'own post') console.log(`📰 News triage: #${post.channelName} ${post.id} → ${result.status}${result.reason ? ` (${result.reason})` : ''}${result.error ? ` (${result.error})` : ''}`);
}

// Reads what arrived while the bot was down, oldest first. A channel seen for the first time starts at its newest post, so the first boot never cards a backlog.
async function catchUp(client) {
    const NewsCursor = require('../models/NewsCursor');
    for (const channelId of pipeline.config().watch) {
        try {
            const channel = await client.channels.fetch(channelId);
            const cur = await NewsCursor.findOne({ channelId }).lean();
            if (!cur) {
                const latest = await channel.messages.fetch({ limit: 1 });
                const first = latest.first();
                if (first) await updateCursor(channelId, first.id);
                continue;
            }
            const batch = await channel.messages.fetch({ after: cur.lastMessageId, limit: 100 });
            const ordered = [...batch.values()].sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
            for (const m of ordered) await pipeline.enqueue(() => handle(client, m));
            if (ordered.length) console.log(`📰 News triage: caught up ${ordered.length} post(s) in #${channel.name}`);
        } catch (err) {
            console.error(`News triage: catch-up failed for ${channelId}:`, err?.message || err);
        }
    }
}

function registerNewsWatch(client) {
    if (!pipeline.enabled()) return false;
    const { watch } = pipeline.config();
    client.on('messageCreate', message => {
        if (!watch.has(message.channelId)) return;
        pipeline.enqueue(() => handle(client, message)).catch(err => console.error('News triage listener failed:', err));
    });
    client.on('messageUpdate', (_old, message) => {
        if (!watch.has(message?.channelId)) return;
        // Discord also sends an update when a link's embed loads a moment after posting, and when a crosspost's source is deleted (flag 1 << 3). Only a real edit (editedTimestamp) is an edit, and a deleted source is a deletion.
        const sourceGone = Boolean(Number(message.flags?.bitfield ?? message.flags ?? 0) & (1 << 3));
        if (!sourceGone && !message.editedTimestamp) return;
        pipeline.noteSourceChange(client.rest, message.channelId, message.id, sourceGone ? 'deleted' : 'edited', appIdOf(client)).catch(() => {});
    });
    client.on('messageDelete', message => {
        if (!watch.has(message?.channelId)) return;
        pipeline.noteSourceChange(client.rest, message.channelId, message.id, 'deleted', appIdOf(client)).catch(() => {});
    });
    client.once(Events.ClientReady, () => {
        catchUp(client).catch(err => console.error('News triage catch-up failed:', err));
        setTimeout(() => {
            pipeline.postSkippedList(client.rest, { appId: appIdOf(client) }).catch(() => {});
            setInterval(() => pipeline.postSkippedList(client.rest, { appId: appIdOf(client) }).catch(() => {}), 24 * 60 * 60 * 1000).unref();
        }, pipeline.msUntilNextDigest()).unref();
        console.log(`📰 News triage watching ${watch.size} channel(s), cards to ${pipeline.config().channel}`);
    });
    return true;
}

module.exports = { registerNewsWatch, enableNewsMessageContent, catchUp };
