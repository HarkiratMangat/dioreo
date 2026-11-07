// utils/newsTriage/pipeline.js -- one news post in, at most one card out (news-channel-triage, built 2026-11-04 20:02 EST). Called by bot/newsWatch.js for every post in a watched channel, by handlers/news.js for the skipped list's "Make a card", and by scripts/newsTriageReplay.js on the dev bot.
//
// filter (free) → the AI read (utils/newsTriage/model.js) → resolve (dates, live or draft, new or returning, already there) → a NewsCard record and the card in NEWS_CHANNEL. Every send is from Dioreo Admin, with no mentions. Nothing here writes Dioreo's data: a card only opens /manage's own boxes (handlers/news.js).
//
// ⚠️ A CHANNEL POST OUTSIDE AN INTERACTION, a named exception to CLAUDE.md's "answers only through interactions" (Harkirat, 2026-11-04 19:15 EST: "I'd rather do a new private channel in the server"). It posts only into NEWS_CHANNEL, a private channel of his own server.
const { Routes } = require('discord.js');
const { titleOf, prefilter, cleanText, namesRegion, namesTestServer } = require('./filter');
const { resolveItems, strictName } = require('./resolve');
const { buildCard, buildSkippedList, MAX_ITEMS, buildBriefing, buildPromoteCheck } = require('./card');

const DAY_MS = 24 * 60 * 60 * 1000;
const CARD_DAYS = 30;
const PAUSE_MS = 60 * 60 * 1000;

// Live state, in memory only: the day's skipped posts (titles, never stored), the AI-call count for the cap, and the failure pause. statsSince: the briefing's counts start at the last briefing or at start-up, whichever is later; a deploy restarts them, so the briefing says "since" rather than claiming the last 24 hours (2026-11-05 15:34 EST).
const state = { skipped: [], day: '', calls: 0, failures: 0, pausedUntil: 0, alerted: false, forced: new Map(), queue: Promise.resolve(), stats: { reads: 0, costUsd: 0, carded: 0, drafted: 0, failures: 0 }, statsSince: new Date() };

function config(env = process.env) {
    const watch = new Set(String(env.NEWS_WATCH || '').split(',').map(s => s.trim()).filter(Boolean));
    return {
        // On unless NEWS_AUTODRAFT=0: next-season items are written into the Next Season Draft instead of carded (Harkirat, 2026-11-04 23:59 EST).
        autoDraft: String(env.NEWS_AUTODRAFT ?? '1') !== '0', watch, channel: String(env.NEWS_CHANNEL || '').trim(), cap: Number(env.NEWS_DAILY_MODEL_CAP) > 0 ? Number(env.NEWS_DAILY_MODEL_CAP) : 60 };
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

// Every AI read takes a slot here, whoever starts it (2026-11-05 15:42 EST, commit security review: the edit re-read skipped the cap and the pause): the day's cap, the pause after three failures, and the count.
function takeReadSlot(cfg, { force = false } = {}) {
    rollDay();
    if (Date.now() < state.pausedUntil) return 'paused';
    if (!force && state.calls >= cfg.cap) return 'capped';
    state.calls += 1; persistCalls();
    return null;
}
// The day's count is saved, so a restart (or a crash loop, each boot of which catches up) does not reset the cap (the fresh review R1, 2026-11-05 20:15 EST).
function persistCalls() { if (require('mongoose').connection.readyState !== 1) return; require('../../models/BotControls').updateOne({ _id: 'global' }, { $set: { newsReadDay: state.day, newsReadCalls: state.calls } }, { upsert: true }).catch(() => {}); }
async function loadReadCount() {
    try { const c = await require('../../models/BotControls').findById('global', { newsReadDay: 1, newsReadCalls: 1 }).lean(); rollDay(); if (c && c.newsReadDay === state.day) state.calls = Math.max(state.calls, c.newsReadCalls || 0); } catch { /* the cap starts at zero, as before */ }
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
    const { seasonYear } = require('../quickAdd');
    const SeasonalData = require('../../models/SeasonalData');
    const DrawCatalog = require('../../models/DrawCatalog');
    const [doc, catalogue] = await Promise.all([
        SeasonalData.findOne({ docType: 'global' }).lean(),
        DrawCatalog.find({}, { title: 1, aliases: 1, releaseSeason: 1, releaseYear: 1 }).lean(),
    ]);
    const d = doc || {}; const draft = d.draft || {};
    return {
        postedAt, liveEnd: d.bpEnd || null, liveTitle: d.currentSeasonTitle || '', liveYear: seasonYear(d), draftStart: draft.bpStart || null, draftTitle: draft.currentSeasonTitle || '', draftYear: seasonYear(draft), draftEnd: (!draft.bpEndTBD && draft.bpEnd) || ((draft.bpStart || d.bpEnd) ? new Date(new Date(draft.bpStart || d.bpEnd).getTime() + 75 * DAY_MS) : null), catalogue,
        live: { newDraws: d.newDraws || [], returningDraws: d.returningDraws || [], calendar: d.calendar || [] },
        draft: { newDraws: draft.newDraws || [], returningDraws: draft.returningDraws || [], calendar: draft.calendar || [] },
        draftDoc: draft, liveDoc: d,
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

// ---- Auto-draft (2026-11-04 23:59 EST) ----
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// "Nov 12", as the card's own dates and /calendar write them.
const dayLabel = d => { if (!d) return ''; const x = new Date(d); return `${MONTH_NAMES[x.getUTCMonth()]} ${x.getUTCDate()}`; };
// One line per item, not per row: a draw is a draw-list row and a calendar row.
function draftLines(changes) {
    const seen = new Map();
    for (const c of changes) {
        if (c.type === 'season') { seen.set(`season|${c.name}`, `Season: **${c.name}**${c.set.bpStart ? `, starts ${dayLabel(c.set.bpStart)}` : ''}`); continue; }
        const key = `${c.type}|${String(c.name).toLowerCase()}`;
        const row = c.row || {}; const set = c.set || {};
        const start = row.date || set.date; const end = row.endDate || set.endDate;
        const when = start ? ` (${dayLabel(start)}${end ? ` – ${dayLabel(end)}` : ''})` : '';
        const verb = { add: 'Added', update: 'Updated', remove: 'Removed' }[c.type];
        if (!seen.has(key) || when) seen.set(key, `${verb}: **${c.name}**${when}${c.row?.newsSource?.carried ? ' · still running, carried over' : ''}`);
    }
    return [...seen.values()];
}

// A draft draw row needs an image (see draftMerge.js). The post's own picture is used only when the post names one draw; otherwise only an image already cached under the draw's name (a returning draw's index image).
async function draftImages(items, post) {
    const official = /official/i.test(post.channelName || '');
    const draws = items.filter(it => it.kind === 'draw' && it.change !== 'cancelled');
    for (const it of draws) {
        // Only an OFFICIAL post's picture (2026-11-05 11:06 EST): a #leaks picture carries the leaker's watermark and would sit on /draws for a season.
        const own = official && draws.length === 1 && post.image && !it.catalogueTitle ? post.image : '';
        try {
            const { validDraws } = await require('../bulkMerge').resolveThumbnailsForDraws([{ title: it.catalogueTitle || it.name, thumbnailUrl: own, items: it.rewards || [] }]);
            it.thumbnailUrl = validDraws[0]?.thumbnailUrl || '';
        } catch (err) { console.error('News triage: no draft image for', it.name, err?.message || err); it.thumbnailUrl = ''; }
    }
    return items;
}

// The kinds he chose never to draft (models/BotControls.js newsSkipKinds), or the defaults.
async function skipKinds() {
    try { const c = await require('../../models/BotControls').findById('global', { newsSkipKinds: 1 }).lean(); return Array.isArray(c?.newsSkipKinds) ? c.newsSkipKinds : require('./draftMerge').DEFAULT_SKIP; } catch { return require('./draftMerge').DEFAULT_SKIP; }
}

async function commitDraft(payload, actorId) {
    const { commitSet } = require('../../core/changeset');
    const { ALLOWED_ADMIN_ID } = require('../owner');
    // The watcher's own reads commit as the owner (core/changeset.js checks a person's tier on every write), with source 'news' so History tells them apart from his edits. A read an admin started (the skipped list's Make a card) commits as THAT admin, so their own Next Season Draft tier is checked and a denial falls back to buttons (commit security review, 2026-11-05 00:13 EST: committing it as the owner let any /manage admin write the draft).
    return commitSet([{ type: 'season.newsDraft', payload }], { actorId: actorId || ALLOWED_ADMIN_ID, source: 'news' });
}

async function autoDraft(post, card, ctx, actorId) {
    const { planDraftChanges } = require('./draftMerge');
    const draftItems = card.filter(it => it.where === 'draft' && it.action !== 'patch');
    if (!draftItems.length) return { drafted: null, cardItems: card };
    await draftImages(draftItems, post);
    const src = { id: post.id, channelId: post.channelId, official: /official/i.test(post.channelName || '') };
    const kinds = await skipKinds();
    // This first plan only decides whether there is anything to write. The op plans again inside its transaction against the draft as it is THEN (2026-11-05 15:34 EST): the AI read can take minutes on Flex, and a plan made before it could add a row he typed in the meantime.
    const pre = planDraftChanges(ctx.draftDoc || {}, draftItems, src, { skipKinds: kinds });
    const keepNames = new Set(pre.needsBox.map(i => i.name));
    const notesOf = list => list.map(n => `${n.name}: ${n.why}`);
    if (!pre.changes.length) return { drafted: pre.notes.length ? { changeId: '', lines: [], notes: notesOf(pre.notes) } : null, cardItems: card.filter(it => it.where !== 'draft' || it.action === 'patch' || keepNames.has(it.name)) };
    const res = await commitDraft({ plan: { items: draftItems, post: src, skipKinds: kinds } }, actorId);
    // A failed write falls back to the buttons, so nothing is lost: every item stays on the card.
    if (!res.ok) { console.error('News triage: the draft write failed:', res.error || JSON.stringify(res.failures || res.denied || [])); return { drafted: { changeId: '', lines: [], notes: ['The Next Season Draft could not be written, so every item has a button instead.'] }, cardItems: card }; }
    const applied = res.results?.[0]?.applied || {};
    const boxed = new Set(applied.needsBox || []);
    return { drafted: { changeId: res.changeIds[0], lines: draftLines(applied.changes || []), notes: notesOf(applied.notes || []) }, cardItems: card.filter(it => it.where !== 'draft' || it.action === 'patch' || boxed.has(it.name)) };
}

// Carry-over, every day of the ten before the next season starts (2026-11-05 15:34 EST: it ran once, on the first day, so a live draw added later in the window was never carried). Planned inside the op against the live lists, so a row already carried is skipped; a card posts only on a day that added rows. Live rows with no end date are listed in the briefing's readiness instead of a daily card.
async function carryOver(rest, { env = process.env, appId, now = new Date() } = {}) {
    const cfg = config(env);
    if (!cfg.channel || !cfg.autoDraft) return null;
    try {
        const d = await require('../../models/SeasonalData').findOne({ docType: 'global' }).lean();
        const draft = d?.draft || {};
        if (!draft.bpStart) return null;
        const start = new Date(draft.bpStart);
        if (now < new Date(start - 10 * DAY_MS) || now > start) return null;
        if (!require('./draftMerge').planCarryOver(draft, d).changes.length) return { carried: 0 };
        const res = await commitDraft({ carry: true });
        if (!res.ok) { console.error('News triage: carry-over failed:', res.error); return null; }
        const applied = res.results?.[0]?.applied || {};
        if (!(applied.changes || []).length) return { carried: 0 };
        const key = `carry-${now.toISOString().slice(0, 10)}`;
        const doc = await storeCard({ sourceChannelId: 'carry-over', sourceMessageId: key, sourceName: 'Next Season Draft', jumpUrl: '', postedAt: now, cardChannelId: cfg.channel, items: [], draftChangeId: res.changeIds[0], draftLines: draftLines(applied.changes), draftNotes: [], expireAt: new Date(now.getTime() + CARD_DAYS * DAY_MS) });
        await postCardOrUndo(rest, cfg, doc, appId);
        return { carried: applied.changes.length };
    } catch (err) { console.error('News triage: carry-over failed:', err?.message || err); return null; }
}

// Stores a card record. One that cannot be stored after the draft was written would leave the change with no Undo in sight, so it alerts with the change id, as a refused send does (invariants pass, 2026-11-05 17:07 EST).
async function storeCard(fields) {
    try { return await require('../../models/NewsCard').create(fields); } catch (err) {
        if (fields.draftChangeId) {
            const msg = `A news card could not be stored (${err?.message || err}). It had written draft change ${fields.draftChangeId}: undo it from /bot History if it is wrong.`;
            console.error('News triage:', msg);
            try { require('../alertWebhook').sendAlert('News card not stored', msg, 'warn'); } catch { /* alerting never breaks the read */ }
        }
        throw err;
    }
}

// Sends a card; if Discord refuses it, the card record goes and an alert names the draft change, so a draft write is never left with no Undo in sight (2026-11-05 15:34 EST: a full card measured 6,073 characters, over Discord's 4,000, and the draft had already been written).
async function postCardOrUndo(rest, cfg, doc, appId) {
    const NewsCard = require('../../models/NewsCard');
    try {
        const sent = await sendCard(rest, cfg.channel, doc.toObject(), appId);
        await NewsCard.updateOne({ _id: doc._id }, { $set: { cardMessageId: sent.id } });
        return sent;
    } catch (err) {
        await NewsCard.deleteOne({ _id: doc._id }).catch(() => {});
        const msg = `A news card could not be posted (${err?.message || err}).${doc.draftChangeId ? ` It had written draft change ${doc.draftChangeId}: undo it from /bot History if it is wrong.` : ''}`;
        console.error('News triage:', msg);
        try { require('../alertWebhook').sendAlert('News card not posted', msg, 'warn'); } catch { /* alerting never breaks the read */ }
        throw err;
    }
}

// The one AI read, for a new post and an edited one alike (invariants pass, 2026-11-05 17:07 EST: the edit re-read counted a failure but never paused or alerted, because it had its own copy). The caller has already taken its read slot. onUsage counts each read's cost for the briefing (estimateVisionCostUsd knows the flex and cached-token prices).
async function aiRead(post, ctx, readPost) {
    const onUsage = (u, loc) => { try { state.stats.costUsd += require('../visionExtract').estimateVisionCostUsd(loc, u).estimatedCostUsd; } catch { /* never breaks a read */ } };
    state.stats.reads += 1;
    try {
        const raw = await (readPost || require('./model').readPost)({ text: post.text, imageUrl: post.image, postedAt: post.createdAt, liveSeason: ctx.liveSeason, source: /official/i.test(post.channelName || '') ? 'official' : 'leaks' }, { onUsage, onRetry: () => { state.calls += 1; persistCalls(); } });
        state.failures = 0; state.alerted = false;
        return raw;
    } catch (err) {
        state.failures += 1; state.stats.failures += 1;
        console.error(`News triage: the AI read failed (${state.failures} in a row):`, err?.message || err);
        if (state.failures >= 3) {
            state.pausedUntil = Date.now() + PAUSE_MS;
            if (!state.alerted) { state.alerted = true; try { require('../alertWebhook').sendAlert('News triage paused', `Three AI reads failed in a row; paused for an hour. Last error: ${err?.message || err}`, 'warn'); } catch { /* alerting never breaks the read */ } }
        }
        throw err;
    }
}

// ctx: { rest, selfId, readPost (for tests), env }. Returns { status, ... } and never throws.
async function processPost(post, { rest, selfId, appId, force = false, env = process.env, readPost, actorId = null } = {}) {
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
        // Make a card reads past the cap, so the same post picked again the same day is not read again (the fresh review R1, 2026-11-05 20:15 EST: every pick was a paid read).
        if (force && state.forced.get(post.id) === new Date().toISOString().slice(0, 10)) return { status: 'no card', reason: 'already read today, and the AI found nothing to add' };
        const blocked = takeReadSlot(cfg, { force });
        if (blocked) { noteSkipped(post, blocked === 'paused' ? 'AI reads paused after errors' : 'daily AI limit reached'); return { status: blocked }; }

        const ctx = await loadContext(post.createdAt);
        let raw;
        try { raw = await aiRead(post, ctx, readPost); } catch (err) { noteSkipped(post, 'the AI read failed'); return { status: 'error', error: err?.message || String(err) }; }
        if (force) state.forced.set(post.id, new Date().toISOString().slice(0, 10));

        const { card, skipped } = resolveItems(raw, { ...ctx, namesRegion: namesRegion(post.text), namesTestServer: namesTestServer(post.text), autoDraft: cfg.autoDraft });
        // Next-season items go straight into the Next Season Draft (draftMerge.js); the card then shows what was drafted, with Undo, and keeps a button only for this season's items, patch notes, and a draft draw with no image.
        let drafted = null; let cardItems = card;
        if (cfg.autoDraft) ({ drafted, cardItems } = await autoDraft(post, card, ctx, actorId));
        // The same draw from #official-codm-news and #leaks gets one card: an item another card from the last two weeks already holds is left off.
        const recent = await NewsCard.find({ createdAt: { $gte: new Date(Date.now() - 14 * DAY_MS) } }, { items: 1 }).lean();
        // A duplicate is the same thing on the same day: a later post that moves the date or confirms a leak gets its own card, because the earlier card holds the old date (think-pass, 2026-11-04 22:09 EST).
        const sameStart = (a, b) => (!a && !b) || (a && b && new Date(a).toISOString().slice(0, 10) === new Date(b).toISOString().slice(0, 10));
        const fresh = cardItems.filter(it => !recent.some(c => (c.items || []).some(o => o.action === it.action && o.where === it.where && strictName(o.name, it.name) && sameStart(o.start, it.start))));
        if (!fresh.length && !drafted?.lines?.length) {
            const reason = drafted?.notes?.length ? drafted.notes.slice(0, 3).join('; ') : cardItems.length ? 'already on another card' : (skipped.length ? [...new Set(skipped.map(s => s.reason))].join('; ') : 'nothing to add');
            noteSkipped(post, reason);
            return { status: 'no card', reason, skipped };
        }
        const doc = await storeCard({
            sourceChannelId: post.channelId, sourceMessageId: post.id, sourceName: post.channelName, jumpUrl: post.jumpUrl,
            postedAt: post.createdAt, cardChannelId: cfg.channel, items: fresh.slice(0, MAX_ITEMS),
            notes: fresh.length > MAX_ITEMS ? [`${fresh.length - MAX_ITEMS} more items in the post are not shown.`] : [],
            draftChangeId: drafted?.changeId || '', draftLines: drafted?.lines || [], draftNotes: drafted?.notes || [], draftActorId: actorId || '',
            expireAt: new Date(Date.now() + CARD_DAYS * DAY_MS),
        });
        await postCardOrUndo(rest, cfg, doc, appId);
        state.stats.carded += 1; state.stats.drafted += drafted?.lines?.length || 0;
        return { status: 'carded', id: String(doc._id), items: fresh.length, drafted: drafted?.lines?.length || 0 };
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
        if (!card) {
            // An edit to a post with no card: one still being read, or one skipped, may now say something worth a card (the fresh review R1, 2026-11-05 20:15 EST). Queued behind any read in flight, it reads the post as it is then, through the filter and the cap like any post.
            if (what === 'edited') enqueue(() => recheckEdited(rest, channelId, messageId, appId)).catch(err => console.error('News triage: re-checking an edited post failed:', err?.message || err));
            return false;
        }
        const wrote = card.draftChangeId && !card.draftUndone;
        // A post whose rows are in the draft says so when it goes away or changes (2026-11-05 15:34 EST): before, the rows outlived their source with nothing pointing at them.
        const note = what === 'deleted'
            ? (wrote ? 'The source post was deleted. Its rows are still in the Next Season Draft: Undo below if it was wrong.' : 'The source post was deleted.')
            : `The source post was edited <t:${Math.floor(Date.now() / 1000)}:R>.${wrote ? ' It will be read again, and any draft changes will be on a new card.' : ' Open it before using a box.'}`;
        card.notes = [...(card.notes || []).filter(n => !/source post was (edited|deleted)/.test(n)), note];
        await card.save();
        await redrawCard(rest, card.toObject(), appId);
        // Through the same queue as every other read, so it waits its turn and never runs two at once.
        if (what === 'edited' && wrote) enqueue(() => rereadEdited(rest, channelId, messageId, appId)).catch(err => console.error('News triage: re-reading an edited post failed:', err?.message || err));
        return true;
    } catch (err) { console.error('News triage: could not mark a source change:', err?.message || err); return false; }
}

async function recheckEdited(rest, channelId, messageId, appId) {
    const NewsCard = require('../../models/NewsCard');
    const card = await NewsCard.findOne({ sourceChannelId: channelId, sourceMessageId: messageId }).lean();
    // A card made while this waited: its draft side is re-read as any edit is; a this-season card already says the post was edited.
    if (card) return card.draftChangeId && !card.draftUndone ? rereadEdited(rest, channelId, messageId, appId) : null;
    const raw = await rest.get(Routes.channelMessage(channelId, messageId));
    const ch = await rest.get(Routes.channel(channelId)).catch(() => ({}));
    const post = toPost(raw, { guildId: raw.guild_id || '', channelName: ch.name || '' });
    const res = await processPost(post, { rest, appId });
    if (res.status !== 'skipped') console.log(`📰 News triage: edited #${post.channelName} ${post.id} → ${res.status}${res.reason ? ` (${res.reason})` : ''}`);
    return res;
}

// An edited post that wrote draft rows is read again once per edit, and only its draft side is merged (the same source, so its rows update rather than add). Any change goes on a follow-up card with its own Undo.
async function rereadEdited(rest, channelId, messageId, appId, { env = process.env } = {}) {
    const cfg = config(env);
    if (!cfg.autoDraft) return null;
    const raw = await rest.get(Routes.channelMessage(channelId, messageId));
    const key = `${messageId}:edit:${raw.edited_timestamp || Date.now()}`;
    const NewsCard = require('../../models/NewsCard');
    if (await NewsCard.exists({ sourceChannelId: channelId, sourceMessageId: key })) return null;
    // One atomic claim, checked when the queued job RUNS, not when it was queued (2026-11-05 15:45 EST, commit security review): an Undo pressed in between must stop the re-read, and two edits must not both pass the limit of two.
    const first = await NewsCard.findOneAndUpdate({ sourceChannelId: channelId, sourceMessageId: messageId, draftUndone: { $ne: true }, draftChangeId: { $nin: ['', null] }, rereads: { $lt: 2 } }, { $inc: { rereads: 1 } }, { returnDocument: 'after' }).lean();
    if (!first) return null;
    if (takeReadSlot(cfg)) { await NewsCard.updateOne({ _id: first._id }, { $inc: { rereads: -1 } }).catch(() => {}); return null; }
    const post = toPost(raw, { guildId: raw.guild_id || '', channelName: first?.sourceName || '' });
    const ctx = await loadContext(post.createdAt);
    const items = await aiRead(post, ctx);
    const { card } = resolveItems(items, { ...ctx, namesRegion: namesRegion(post.text), namesTestServer: namesTestServer(post.text), autoDraft: true });
    const { drafted } = await autoDraft(post, card, ctx, first.draftActorId || null);
    if (!drafted?.lines?.length) return null;
    const doc = await storeCard({ sourceChannelId: channelId, sourceMessageId: key, sourceName: post.channelName, jumpUrl: post.jumpUrl, postedAt: post.createdAt, cardChannelId: cfg.channel, items: [], notes: ['From the edited version of the post.'], draftChangeId: drafted.changeId, draftActorId: first.draftActorId || '', draftLines: drafted.lines, draftNotes: drafted.notes, expireAt: new Date(Date.now() + CARD_DAYS * DAY_MS) });
    await postCardOrUndo(rest, cfg, doc, appId);
    return drafted.lines.length;
}

// The once-a-day skipped list. Empty days post nothing. Returns how many it listed. What the briefing reports (see card.js buildBriefing). Every part is best-effort: a failed lookup drops that part, never the briefing.
const snowflakeTime = id => { try { return new Date(Number((BigInt(id) >> 22n) + 1420070400000n)); } catch { return null; } };
// Whether the live bot still disagrees with a fix item: the row is still there and its start or end still differs from the post's. A draw's end lives on its /calendar draw row.
function fixStillWrong(item, d) {
    if (!d) return true;
    const row = (d[item.fixList] || []).find(r => String(r._id) === String(item.fixId));
    if (!row) return false;
    const sameDay = (a, b) => a && b && new Date(a).toISOString().slice(0, 10) === new Date(b).toISOString().slice(0, 10);
    const sq = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const endRow = item.fixList === 'calendar' ? row : (d.calendar || []).find(r => r.category === 'draw' && sq(r.title) === sq(row.title));
    const startOff = item.start && !sameDay(row.date, item.start);
    const endOff = item.end && !sameDay(endRow?.endDate, item.end);
    return Boolean(startOff || endOff);
}

function draftReadiness(d) {
    const draft = d?.draft || {};
    const calendar = draft.calendar || []; const draws = [...(draft.newDraws || []), ...(draft.returningDraws || [])];
    if (!draft.active && !draft.bpStart && !calendar.length && !draws.length) return null;
    const day = x => (x ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][new Date(x).getUTCMonth()]} ${new Date(x).getUTCDate()}` : '');
    const sq = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const part = (title, def, end, tbd) => (title && title !== def ? `${title}${end ? `, ends ${day(end)}` : tbd ? ', end TBD' : ''}` : (end ? `ends ${day(end)}` : ''));
    return {
        title: draft.currentSeasonTitle || '', bpStart: day(draft.bpStart), bpEnd: draft.bpEndTBD ? 'TBD' : day(draft.bpEnd),
        ranked: part(draft.rankTitle, 'Ranked Series', draft.rankEnd, draft.rankEndTBD), dmz: part(draft.dmzTitle, 'DMZ Season', draft.dmzEnd, draft.dmzEndTBD),
        calendar: calendar.length, draws: draws.length, fromNews: [...calendar, ...draws].filter(r => r.newsSource).length,
        noImage: calendar.filter(r => r.category === 'draw' && !draws.some(x => sq(x.title) === sq(r.title))).map(r => r.title),
        noEnd: calendar.filter(r => (!r.endDate && !r.isOngoing) || (r.newsSource && r.newsSource.noEnd)).map(r => r.title),
        // Only rows the AI judged EXPECTED (rank 1). Rank 2 is a confirmed read from #leaks, which reposts CODM's own calendar: 35 of Season 9's 42 drafted rows, so listing it warned about nearly everything (2026-11-05 15:34 EST).
        leakOnly: [...calendar, ...draws].filter(r => r.newsSource && r.newsSource.rank === 1).map(r => r.title),
        stillRunning: draft.bpStart ? (d?.calendar || []).filter(r => !r.endDate && !r.isOngoing && r.date && new Date(r.date) > new Date(new Date(draft.bpStart) - 30 * DAY_MS) && !calendar.some(x => sq(x.title) === sq(r.title))).map(r => r.title) : [],
        // For the promote check (2026-11-05 15:23 EST): rows dated before the season starts that were not carried over (left from an earlier plan), draw rows with no calendar row (no dates on /calendar), the same title twice in one list, and a live season that does not end when this one starts.
        early: draft.bpStart ? calendar.filter(r => r.date && new Date(r.date) < new Date(new Date(draft.bpStart) - DAY_MS) && !(r.newsSource && r.newsSource.carried) && !(r.endDate && new Date(r.endDate) > new Date(draft.bpStart))).map(r => r.title) : [],
        noCalendar: draws.filter(x => !calendar.some(r => r.category === 'draw' && sq(r.title) === sq(x.title))).map(x => x.title),
        twice: [...new Set([...calendar.map(r => `${r.category}|${sq(r.title)}`), ...draws.map(x => `d|${sq(x.title)}`)].filter((k, i, a) => a.indexOf(k) !== i))].length,
        seamGap: draft.bpStart && d?.bpEnd && !d?.bpEndTBD && Math.abs(new Date(draft.bpStart) - new Date(d.bpEnd)) > DAY_MS / 2 ? `this season ends ${day(d.bpEnd)}, next starts ${day(draft.bpStart)}` : '',
        // Consumer audit (2026-11-05 17:18 EST): Promote to Live drops newsSource, so a row still on its placeholder date (a dateless item sits on the season start) reads on /calendar as starting on day one, with nothing left to say no post ever dated it.
        undated: [...calendar, ...draws].filter(r => r.newsSource && r.newsSource.dated === false).map(r => r.title),
        // /manage's draft boxes are Discord text inputs, which hold 4,000 characters, and news triage adds rows without looking at the box (prod's 11 returning draws measured 2,690 characters, with their image links).
        fullBoxes: (() => { try { const ap = require('../adminParser'); const withItems = l => (l || []).map(r => ({ ...r, items: r.items || [] })); return [['calendar', ap.formatCalendarAsBulkText(calendar)], ['new draws', ap.formatDrawsAsBulkText(withItems(draft.newDraws))], ['returning draws', ap.formatDrawsAsBulkText(withItems(draft.returningDraws))]].filter(([, t]) => t.length > 3600).map(([n, t]) => `${n} (${t.length.toLocaleString('en-US')} of 4,000 characters)`); } catch { return []; } })(),
        startsAt: draft.bpStart || null,
    };
}

const promoteDue = (startsAt, now = new Date()) => { const until = new Date(startsAt) - now; return until > 0 && until <= 30 * 60 * 60 * 1000; };

// The promote check (2026-11-05 15:23 EST, his pick 4): once, when the next season starts within two days, a card listing what is ready and what is missing in the Next Season Draft, so a missing end date or image is fixed before Promote to Live puts it in front of players.
async function promoteCheck(rest, { env = process.env, appId, now = new Date() } = {}) {
    const cfg = config(env);
    if (!cfg.channel) return null;
    try {
        const d = await require('../../models/SeasonalData').findOne({ docType: 'global' }).lean();
        const r = draftReadiness(d);
        if (!r || !r.startsAt) return null;
        const until = new Date(r.startsAt) - now;
        // 30 hours, not two days (2026-11-05 15:34 EST): at the 00:05 UTC run that is the day before a 00:00 UTC start (23.9 h), where two days fired on the day before that.
        if (!promoteDue(r.startsAt, now)) return null;
        const NewsCard = require('../../models/NewsCard');
        const key = `promote-${new Date(r.startsAt).toISOString().slice(0, 10)}`;
        if (await NewsCard.exists({ sourceChannelId: 'promote-check', sourceMessageId: key })) return null;
        // Claimed before it posts (invariants pass, 2026-11-05 17:07 EST): the start-up check and the 00:05 UTC one could both pass the exists test and post twice; the unique index lets one claim, and a failed post gives the claim back.
        try { await NewsCard.create({ sourceChannelId: 'promote-check', sourceMessageId: key, sourceName: 'Next Season Draft', jumpUrl: '', postedAt: now, cardChannelId: cfg.channel, items: [], expireAt: new Date(now.getTime() + CARD_DAYS * DAY_MS) }); } catch { return null; }
        try { await rest.post(Routes.channelMessages(cfg.channel), { body: { flags: 32768, components: asApp(appId, () => buildPromoteCheck(r)), allowed_mentions: { parse: [] } } }); }
        catch (err) { await NewsCard.deleteOne({ sourceChannelId: 'promote-check', sourceMessageId: key }).catch(() => {}); throw err; }
        return r;
    } catch (err) { console.error('News triage: the promote check failed:', err?.message || err); return null; }
}
async function gatherBriefing(rest, cfg, now = new Date()) {
    const out = { stats: { ...state.stats }, since: state.statsSince, readiness: null, fixes: [], channels: [] };
    let liveDoc = null;
    try { liveDoc = await require('../../models/SeasonalData').findOne({ docType: 'global' }).lean(); out.readiness = draftReadiness(liveDoc); } catch { /* no database */ }
    try {
        const NewsCard = require('../../models/NewsCard');
        // A dismissed card is left out (2026-11-07): Dismiss is his "not this one", unlike opening the box and cancelling. A wrong fix (the Sapphire Winter Draw card, read a day early) otherwise stayed in every briefing for a week after he dismissed it.
        const recent = await NewsCard.find({ createdAt: { $gte: new Date(now - 7 * DAY_MS) }, 'items.action': 'fix', dismissed: { $ne: true } }, { items: 1 }).lean();
        // Each fix is checked against the live row as it is NOW, not against whether its button was clicked (2026-11-05 15:34 EST): opening the box and cancelling used to hide it, and a fix made by hand in /manage stayed listed.
        for (const c of recent) for (const it of c.items) if (it.action === 'fix' && fixStillWrong(it, liveDoc)) out.fixes.push({ name: it.name, text: (it.warnings || []).find(w => /^On the bot/.test(w)) || 'dates changed' });
    } catch { /* no database */ }
    try {
        const cursors = await require('../../models/NewsCursor').find({}).lean();
        for (const id of cfg.watch) {
            const cur = cursors.find(c => c.channelId === id);
            let name = id; try { name = (await rest.get(Routes.channel(id))).name || id; } catch { /* unreadable */ }
            const lastAt = cur ? snowflakeTime(cur.lastMessageId) : null;
            out.channels.push({ name, lastAt, stale: !lastAt || now - lastAt > 3 * DAY_MS });
        }
    } catch { /* no database */ }
    return out;
}

async function postSkippedList(rest, { env = process.env, appId } = {}) {
    const cfg = config(env);
    if (!cfg.channel) return 0;
    // The stored list, titles re-read from the channel now (nothing stored holds a post's words); the in-memory list only when there is no database.
    let entries = []; let rows = [];
    try {
        const NewsSkip = require('../../models/NewsSkip');
        rows = await NewsSkip.find({}).sort({ createdAt: 1 }).limit(200).lean();
        // Posts the cap or a pause kept from the AI come first: the list shows 12 and the dropdown 25, and on a launch day they were the ones past the end (the fresh review R1, 2026-11-05 20:15 EST).
        rows.sort((a, b) => Number(/limit|paused/.test(b.reason || '')) - Number(/limit|paused/.test(a.reason || '')));
        for (const [i, r] of rows.entries()) {
            let title = '';
            if (i < 25) { try { title = toPost(await rest.get(Routes.channelMessage(r.channelId, r.messageId)), { guildId: r.guildId }).title; } catch { /* deleted or unreadable */ } }
            entries.push({ title: title || 'A post (could not be re-read)', reason: r.reason, jumpUrl: `https://discord.com/channels/${r.guildId}/${r.channelId}/${r.messageId}`, channelId: r.channelId, messageId: r.messageId });
        }
        state.skipped.splice(0);
    } catch {
        entries = state.skipped.splice(0); rows = [];
    }
    // The skipped list now rides in the daily briefing (2026-11-05 11:07 EST), which posts every day, so a quiet day still says the watcher is alive.
    const brief = await gatherBriefing(rest, cfg);
    brief.skipped = entries;
    brief.skipKinds = await skipKinds();
    try {
        await rest.post(Routes.channelMessages(cfg.channel), { body: { flags: 32768, components: asApp(appId, () => buildBriefing(brief)), allowed_mentions: { parse: [] } } });
        state.stats = { reads: 0, costUsd: 0, carded: 0, drafted: 0, failures: 0 }; state.statsSince = new Date();
    } catch (err) { console.error('News triage: the briefing could not be posted:', err?.message || err); return 0; }
    if (rows.length) { try { await require('../../models/NewsSkip').deleteMany({ _id: { $in: rows.map(r => r._id) } }); } catch { /* the TTL removes them */ } }
    return entries.length;
}

// Milliseconds to the next 00:05 UTC, just after the game's daily update (the same moment utils/drawEndReminder.js uses).
function msUntilNextDigest(now = new Date()) {
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 5));
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    return next - now;
}

module.exports = { loadReadCount, recheckEdited, config, enabled, toPost, processPost, enqueue, noteSourceChange, postSkippedList, msUntilNextDigest, redrawCard, loadContext, state, carryOver, draftLines, autoDraft, draftReadiness, gatherBriefing, promoteCheck, skipKinds, promoteDue, fixStillWrong, rereadEdited };
