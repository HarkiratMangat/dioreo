// utils/newsTriage/indexStatus.js -- whether each draw a news post names is already in the draw index, so the card and the daily briefing say which still need adding.
//
// Harkirat, 2026-11-16 12:05 EST: "i dont want to use the leaks channel's own posters. Instead, a better idea is just detecting the draw name/title/items (if its cheap) and checking if that draw is already indexed or if i need to go and add the index for it." It is free: news triage's one read already returns each draw's name and rewards (utils/newsTriage/model.js), so this only matches them against the index, with the owner's Upload Draws matcher (utils/drawIndexRead.js matchEntry: title, other names, the same items, then the title's words or every reward inside one entry). It never fetches, stores or forwards a post's picture.
//
// Covers every draw item of the post, drafted into the Next Season Draft or not (the card itself only lists this season's items), and is stored on the card (models/NewsCard.js `index`). The briefing re-checks the last week's against the index as it is NOW, so a draw added since drops off. Pure except refreshIndexStatus.
const isDrawItem = (it) => it && (it.action === 'draw' || it.kind === 'draw') && String(it.name || '').trim();

// One draw item -> { name, status: 'indexed'|'maybe'|'missing', title, needs, rewards }.
function indexStatusFor(item, entries) {
    const { matchEntry } = require('../drawIndexRead');
    const rewards = (item.rewards || []).filter(r => r && r.name).map(r => ({ tier: r.tier || 'legendary', name: String(r.name) }));
    const m = matchEntry(entries || [], String(item.name), rewards);
    const base = { name: String(item.name).slice(0, 120), rewards: rewards.slice(0, 12) };
    if (m.status === 'none') return { ...base, status: 'missing', title: '', needs: [] };
    const needs = m.status === 'sure' ? require('../drawIndexCheck').needsOf(m.entry) : [];
    if (m.status === 'sure') {
        const norm = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
        const have = new Set((m.entry.items || []).map(i => norm(i.name)));
        const lacking = rewards.filter(r => !have.has(norm(r.name))).length;
        if (lacking) needs.push(`${lacking} item${lacking === 1 ? '' : 's'} the post lists`);
    }
    return { ...base, status: m.status === 'sure' ? 'indexed' : 'maybe', title: m.entry.title, needs };
}

// Every draw item of a post, once per name.
function indexStatusForItems(items, entries) {
    const seen = new Set();
    const out = [];
    for (const it of items || []) {
        if (!isDrawItem(it)) continue;
        const key = String(it.name).toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(indexStatusFor(it, entries));
    }
    return out;
}

// The card's lines (card.js buildCard), and whether it gets the Add to Draw Index button.
function indexLines(index, E) {
    const lines = [];
    for (const x of index || []) {
        if (x.status === 'missing') lines.push(`-# ${E.warn} **${x.name}** is not in the draw index`);
        else if (x.status === 'maybe') lines.push(`-# ${E.yellowDotGlow || E.warn} **${x.name}** may be **${x.title}** in the draw index`);
        else lines.push(`-# ${E.checkmark} **${x.name}** is in the draw index${x.needs.length ? ` · needs ${x.needs.join(', ')}` : ''}`);
    }
    return lines;
}
const needsAdding = (index) => (index || []).filter(x => x.status !== 'indexed');

// After the owner saves from a card's Add to Draw Index: the card's index lines are worked out again and the card redrawn. `rest`/`appId` come from the interaction that saved. Never throws.
async function refreshIndexStatus(cardId, { rest, appId } = {}) {
    try {
        const NewsCard = require('../../models/NewsCard');
        const card = await NewsCard.findById(cardId).lean();
        if (!card || !(card.index || []).length) return false;
        const entries = await require('../drawCatalog').loadCatalog({ force: true });
        const index = card.index.map(x => indexStatusFor(x, entries));
        await NewsCard.updateOne({ _id: card._id }, { $set: { index } });
        if (rest) await require('./pipeline').redrawCard(rest, { ...card, index }, appId);
        return true;
    } catch (err) {
        console.error('News card index refresh failed:', err?.message || err);
        return false;
    }
}

// The briefing's list: draws from the last week's cards that are still not in the index (or only maybe), checked against the index now.
function stillMissing(cards, entries) {
    const seen = new Map();
    for (const c of cards || []) for (const x of c.index || []) {
        const key = String(x.name).toLowerCase();
        if (seen.has(key)) continue;
        const now = indexStatusFor(x, entries);
        if (now.status !== 'indexed') seen.set(key, now);
    }
    return [...seen.values()];
}

module.exports = { indexStatusFor, indexStatusForItems, indexLines, needsAdding, refreshIndexStatus, stillMissing, isDrawItem };
