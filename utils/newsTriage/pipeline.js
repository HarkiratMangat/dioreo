// utils/newsTriage/pipeline.js -- one news post in, at most one card out (news-channel-triage, built 2026-11-04 20:02 EST). Called by bot/newsWatch.js for every post in a watched channel, by handlers/news.js for the skipped list's "Make a card", and by scripts/newsTriageReplay.js on the dev bot.
//
// filter (free) → the AI read (utils/newsTriage/model.js) → resolve (dates, live or draft, new or returning, already there) → a NewsCard record and the card in NEWS_CHANNEL. Every send is from Dioreo Admin, with no mentions. Nothing here writes Dioreo's data: a card only opens /manage's own boxes (handlers/news.js).
//
// ⚠️ A CHANNEL POST OUTSIDE AN INTERACTION, a named exception to CLAUDE.md's "answers only through interactions" (Harkirat, 2026-11-04 19:15 EST: "I'd rather do a new private channel in the server"). It posts only into NEWS_CHANNEL, a private channel of his own server.
const { Routes } = require('discord.js');
const { titleOf, prefilter, cleanText, namesRegion, namesTestServer } = require('./filter');
const { resolveItems, sameName } = require('./resolve');
const { buildCard, buildSkippedList, MAX_ITEMS } = require('./card');

const DAY_MS = 24 * 60 * 60 * 1000;
const CARD_DAYS = 30;
const PAUSE_MS = 60 * 60 * 1000;

// Live state, in memory only: the day's skipped posts (titles, never stored), the AI-call count for the cap, and the failure pause.
const state = { skipped: [], day: '', calls: 0, failures: 0, pausedUntil: 0, alerted: false, queue: Promise.resolve() };

function config(env = process.env) {
    const watch = new Set(String(env.NEWS_WATCH || '').split(',').map(s => s.trim()).filter(Boolean));
    return { watch, channel: String(env.NEWS_CHANNEL || '').trim(), cap: Number(env.NEWS_DAILY_MODEL_CAP) > 0 ? Number(env.NEWS_DAILY_MODEL_CAP) : 60 };
}
const enabled = (env = process.env) => { const c = config(env); return c.watch.size > 0 && Boolean(c.channel); };

// A post as one plain shape, from a discord.js Message or from the REST API's JSON (the replay script).
function toPost(m, { guildId, channelName } = {}) {
    const isRaw = typeof m.timestamp === 'string';
    const snap = isRaw ? m.message_snapshots?.[0]?.message : m.messageSnapshots?.first?.();
    const src = snap || m;
    const attachments = isRaw ? (src.attachments || []) : [...(src.attachments?.values?.() || [])];
    const images = attachments.filter(a => /^image\//i.test(a.content_type || a.contentType || '') || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(a.url || '')).map(a => a.url);
    const embeds = (src.embeds || []).map(e => ({ title: e.title || '', description: e.description || '', image: e.image?.proxy_url || e.image?.proxyURL || e.thumbnail?.proxy_url || e.thumbnail?.proxyURL || e.image?.url || e.thumbnail?.url || '' }));
    for (const e of embeds) if (e.image) images.push(e.image);
    const text = cleanText([src.content || '', ...embeds.flatMap(e => [e.title, e.description])].filter(Boolean).join('\n'));
    const channelId = isRaw ? m.channel_id : m.channelId;
    const gid = guildId || (isRaw ? m.guild_id : m.guildId);
    return {
        id: m.id, channelId, guildId: gid, channelName: channelName || m.channel?.name || 'news',
        createdAt: isRaw ? new Date(m.timestamp) : m.createdAt, authorId: isRaw ? m.author?.id : m.author?.id,
        text, title: titleOf(text), image: images[0] || '',
        jumpUrl: `https://discord.com/channels/${gid}/${channelId}/${m.id}`,
    };
}

function rollDay(now = new Date()) {
    const day = now.toISOString().slice(0, 10);
    if (state.day !== day) { state.day = day; state.calls = 0; }
}
function noteSkipped(post, reason) {
    if (state.skipped.some(s => s.messageId === post.id)) return;
    state.skipped.push({ title: post.title, reason, jumpUrl: post.jumpUrl, channelId: post.channelId, messageId: post.id });
    if (state.skipped.length > 200) state.skipped.shift();
    // Also stored (ids and reason only), so a restart before 00:05 UTC does not lose the day's list. Never awaited and never throws: a failed write leaves the in-memory entry.
    try {
        const NewsSkip = require('../../models/NewsSkip');
        NewsSkip.updateOne({ channelId: post.channelId, messageId: post.id }, { $set: { guildId: post.guildId || '', reason, expireAt: new Date(Date.now() + 3 * DAY_MS) } }, { upsert: true }).catch(() => {});
    } catch { /* no database: memory only */ }
}
// Posts are handled one at a time, so a burst of fifty on a season's launch day never becomes fifty AI calls at once.
function enqueue(fn) {
    const run = state.queue.then(fn, fn);
    state.queue = run.catch(() => {});
    return run;
}

async function loadContext(postedAt) {
    const SeasonalData = require('../../models/SeasonalData');
    const DrawCatalog = require('../../models/DrawCatalog');
    const [doc, catalogue] = await Promise.all([
        SeasonalData.findOne({ docType: 'global' }).lean(),
        DrawCatalog.find({}, { title: 1, aliases: 1 }).lean(),
    ]);
    const d = doc || {}; const draft = d.draft || {};
    return {
        postedAt, liveEnd: d.bpEnd || null, draftStart: draft.bpStart || null, draftTitle: draft.currentSeasonTitle || '', catalogue,
        live: { newDraws: d.newDraws || [], returningDraws: d.returningDraws || [], calendar: d.calendar || [] },
        draft: { newDraws: draft.newDraws || [], returningDraws: draft.returningDraws || [], calendar: draft.calendar || [] },
        liveSeason: { title: d.currentSeasonTitle || '', end: d.bpEnd || null, nextTitle: draft.currentSeasonTitle || '' },
    };
}

// Application emojis render only for the app that owns them, and utils/emojiMap.js picks the app from the request context's appId. A card is posted outside any interaction, so it is composed under Dioreo Admin's id here; without it the card read ":DB_Info:" (seen on the dev bot, 2026-11-04 20:14 EST), the same trap utils/buildSubmissions.js's composeAs closes for its DMs.
function asApp(appId, build) {
    if (!appId) return build();
    const { runWithContext, getContext } = require('../requestContext');
    return runWithContext({ ...(getContext() || {}), appId }, build);
}
async function sendCard(rest, channelId, card, appId) {
    return rest.post(Routes.channelMessages(channelId), { body: { flags: 32768, components: asApp(appId, () => buildCard(card)), allowed_mentions: { parse: [] } } });
}
async function redrawCard(rest, card, appId) {
    if (!card.cardChannelId || !card.cardMessageId) return;
    await rest.patch(Routes.channelMessage(card.cardChannelId, card.cardMessageId), { body: { flags: 32768, components: asApp(appId, () => buildCard(card)), allowed_mentions: { parse: [] } } })
        .catch(err => console.error('News card redraw failed:', err?.message || err));
}

// ctx: { rest, selfId, readPost (for tests), env }. Returns { status, ... } and never throws.
async function processPost(post, { rest, selfId, appId, force = false, env = process.env, readPost } = {}) {
    try {
        const cfg = config(env);
        if (!force && !cfg.watch.has(post.channelId)) return { status: 'not watched' };
        if (selfId && post.authorId === selfId) return { status: 'own post' };
        const NewsCard = require('../../models/NewsCard');
        if (await NewsCard.exists({ sourceChannelId: post.channelId, sourceMessageId: post.id })) return { status: 'already carded' };

        if (!force) {
            const pre = prefilter(post.text, { hasImage: Boolean(post.image) });
            if (!pre.read) { noteSkipped(post, pre.reason); return { status: 'skipped', reason: pre.reason }; }
        }
        rollDay();
        if (Date.now() < state.pausedUntil) { noteSkipped(post, 'AI reads paused after errors'); return { status: 'paused' }; }
        if (!force && state.calls >= cfg.cap) { noteSkipped(post, 'daily AI limit reached'); return { status: 'capped' }; }

        const ctx = await loadContext(post.createdAt);
        let raw;
        state.calls += 1;
        try {
            raw = await (readPost || require('./model').readPost)({ text: post.text, imageUrl: post.image, postedAt: post.createdAt, liveSeason: ctx.liveSeason, source: /official/i.test(post.channelName || '') ? 'official' : 'leaks' });
            state.failures = 0; state.alerted = false;
        } catch (err) {
            state.failures += 1;
            console.error(`News triage: the AI read failed (${state.failures} in a row):`, err?.message || err);
            if (state.failures >= 3) {
                state.pausedUntil = Date.now() + PAUSE_MS;
                if (!state.alerted) { state.alerted = true; try { require('../alertWebhook').sendAlert('News triage paused', `Three AI reads failed in a row; paused for an hour. Last error: ${err?.message || err}`, 'warn'); } catch { /* alerting never breaks the read */ } }
            }
            noteSkipped(post, 'the AI read failed');
            return { status: 'error', error: err?.message || String(err) };
        }

        const { card, skipped } = resolveItems(raw, { ...ctx, namesRegion: namesRegion(post.text), namesTestServer: namesTestServer(post.text) });
        // The same draw from #official-codm-news and #leaks gets one card: an item another card from the last two weeks already holds is left off.
        const recent = await NewsCard.find({ createdAt: { $gte: new Date(Date.now() - 14 * DAY_MS) } }, { items: 1 }).lean();
        // A duplicate is the same thing on the same day: a later post that moves the date or confirms a leak gets its own card, because the earlier card holds the old date (think-pass, 2026-11-04 22:09 EST).
        const sameStart = (a, b) => (!a && !b) || (a && b && new Date(a).toISOString().slice(0, 10) === new Date(b).toISOString().slice(0, 10));
        const fresh = card.filter(it => !recent.some(c => (c.items || []).some(o => o.action === it.action && o.where === it.where && sameName(o.name, it.name) && sameStart(o.start, it.start))));
        if (!fresh.length) {
            const reason = card.length ? 'already on another card' : (skipped.length ? [...new Set(skipped.map(s => s.reason))].join('; ') : 'nothing to add');
            noteSkipped(post, reason);
            return { status: 'no card', reason, skipped };
        }
        const doc = await NewsCard.create({
            sourceChannelId: post.channelId, sourceMessageId: post.id, sourceName: post.channelName, jumpUrl: post.jumpUrl,
            postedAt: post.createdAt, cardChannelId: cfg.channel, items: fresh.slice(0, MAX_ITEMS),
            notes: fresh.length > MAX_ITEMS ? [`${fresh.length - MAX_ITEMS} more items in the post are not shown.`] : [],
            expireAt: new Date(Date.now() + CARD_DAYS * DAY_MS),
        });
        const sent = await sendCard(rest, cfg.channel, doc.toObject(), appId);
        await NewsCard.updateOne({ _id: doc._id }, { $set: { cardMessageId: sent.id } });
        return { status: 'carded', id: String(doc._id), items: fresh.length };
    } catch (err) {
        console.error('News triage failed on a post:', err?.message || err);
        return { status: 'error', error: err?.message || String(err) };
    }
}

// A watched post was edited or deleted: an existing card says so. Never re-reads the post.
async function noteSourceChange(rest, channelId, messageId, what, appId) {
    try {
        const NewsCard = require('../../models/NewsCard');
        const card = await NewsCard.findOne({ sourceChannelId: channelId, sourceMessageId: messageId });
        if (!card) return false;
        const note = what === 'deleted' ? 'The source post was deleted.' : `The source post was edited <t:${Math.floor(Date.now() / 1000)}:R>. Open it before using a box.`;
        card.notes = [...(card.notes || []).filter(n => !/source post was (edited|deleted)/.test(n)), note];
        await card.save();
        await redrawCard(rest, card.toObject(), appId);
        return true;
    } catch (err) { console.error('News triage: could not mark a source change:', err?.message || err); return false; }
}

// The once-a-day skipped list. Empty days post nothing. Returns how many it listed.
async function postSkippedList(rest, { env = process.env, appId } = {}) {
    const cfg = config(env);
    if (!cfg.channel) return 0;
    // The stored list, titles re-read from the channel now (nothing stored holds a post's words); the in-memory list only when there is no database.
    let entries = []; let rows = [];
    try {
        const NewsSkip = require('../../models/NewsSkip');
        rows = await NewsSkip.find({}).sort({ createdAt: 1 }).limit(200).lean();
        for (const [i, r] of rows.entries()) {
            let title = '';
            if (i < 25) { try { title = toPost(await rest.get(Routes.channelMessage(r.channelId, r.messageId)), { guildId: r.guildId }).title; } catch { /* deleted or unreadable */ } }
            entries.push({ title: title || 'A post (could not be re-read)', reason: r.reason, jumpUrl: `https://discord.com/channels/${r.guildId}/${r.channelId}/${r.messageId}`, channelId: r.channelId, messageId: r.messageId });
        }
        state.skipped.splice(0);
    } catch {
        entries = state.skipped.splice(0); rows = [];
    }
    if (!entries.length) return 0;
    try {
        await rest.post(Routes.channelMessages(cfg.channel), { body: { flags: 32768, components: asApp(appId, () => buildSkippedList(entries)), allowed_mentions: { parse: [] } } });
    } catch (err) { console.error('News triage: the skipped list could not be posted:', err?.message || err); return 0; }
    if (rows.length) { try { await require('../../models/NewsSkip').deleteMany({ _id: { $in: rows.map(r => r._id) } }); } catch { /* the TTL removes them */ } }
    return entries.length;
}

// Milliseconds to the next 00:05 UTC, just after the game's daily update (the same moment utils/drawEndReminder.js uses).
function msUntilNextDigest(now = new Date()) {
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 5));
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    return next - now;
}

module.exports = { config, enabled, toPost, processPost, enqueue, noteSourceChange, postSkippedList, msUntilNextDigest, redrawCard, loadContext, state };
