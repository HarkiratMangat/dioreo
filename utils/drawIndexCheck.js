// utils/drawIndexCheck.js -- /manage draws' Check Draw Index: paste draw or item names, one per line, and see what the draw index (models/DrawCatalog.js) has for each, and what it still lacks.
//
// Harkirat, 2026-11-09 13:53 EST: "an admin command that checks the database catalogue if we currently have a draw indexed? probably as part of /manage draws. where i can bulk paste draw names or item names and check if we have a draw for that search, if the draw/catalogue contains all the info/needs updating, etc".
//
// Read only: it never writes the index. Each line is matched by Quick Add's own matcher (utils/quickAdd.js findCatalogDraw: the title, another name, then the words of the title and the items, typos forgiven), so a line that finds a draw here finds the same draw in Quick Add. Pure over a list of catalog documents, so scripts/drawIndexCheck.test.js needs no database.
const { findCatalogDraw, words, scoreEntry } = require('./quickAdd');

const MAX_LINES = 20;          // checked per paste; checkView shows as many as fit in Discord's 4,000 characters and names the rest
const MAX_SHOWN_DESCRIBED = 5;

const clean = (s, max = 80) => String(s || '').replace(/[*_`~|>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
// The draw type by the name the rest of the bot gives it (utils/drawTypes.js, as Quick Add's draft shows it: "7 Spins Legendary Weapon Draw"); it was a camel-case split of the key until 2026-11-09 15:17 EST.
const typeLabel = (t) => require('./drawTypes').drawTypeName(t) || String(t || '');

// What a document still lacks for the bot to use it fully: a picture for /draws, items for prices and fingerprints, every item's kind (the Set item kinds box asks for these), and a draw type for /draw prices.
function needsOf(entry) {
    const out = [];
    if (!entry.imageUrl) out.push('no picture');
    else if (require('./placeholders').isPlaceholder(entry.imageUrl)) out.push('placeholder picture');
    const items = entry.items || [];
    if (!items.length) out.push('no items');
    const noKind = items.filter(i => !i.kind).length;
    if (noKind) out.push(`${noKind} item${noKind === 1 ? '' : 's'} without a kind`);
    if (!entry.priceType || entry.priceType === 'unknown') out.push('no draw type');
    return out;
}

// The item a line names, when every word of the line is in one item's name ("cx9 lethal hollow" -> "CX-9 - Lethal Hollow") and not all of them are in the title ("lethal hollow" names the draw, even when an item shares the words).
function itemHit(entry, line) {
    const q = words(line);
    if (!q.length) return null;
    const title = new Set([entry.title, ...(entry.aliases || [])].flatMap(words));
    if (q.every(x => title.has(x))) return null;
    return (entry.items || []).find(i => {
        const w = new Set(words(`${i.baseName || ''} ${i.skinName || ''} ${i.name || ''}`));
        return q.every(x => w.has(x));
    }) || null;
}

// Whether /draws lists it now, and in which section. `fromDraft` reads the Next Season Draft's lists instead (2026-11-09 15:16 EST): while he plans a season, "not on /draws" says nothing about whether he already staged it.
function onDraws(seasonalDoc, title, isSameTitle, fromDraft = false) {
    const src = fromDraft ? seasonalDoc?.draft : seasonalDoc;
    const list = [['New', src?.newDraws || []], ['Returning', src?.returningDraws || []]].flatMap(([section, draws]) => draws.map(draw => ({ section, draw })));
    const hit = require('./search').bestDrawMatch(list, title, x => x.draw.title, isSameTitle);
    return hit ? hit.section : null;
}

function checkLine(entries, line, { seasonalDoc = null, isSameTitle } = {}) {
    const found = findCatalogDraw(entries, line);
    if (!found) return { line, status: 'none' };
    if (!found.entry) return { line, status: 'describes', candidates: found.candidates.map(e => e.title) };
    const e = found.entry;
    // A guess that misses a word of the line is not this draw: Quick Add lets it through (half the words may miss) so its Pick box has something to offer, but "Cold Claws Series Armory" landing on "Halloween Series Armory" only shares the generic words. Here that is not indexed, with the closest draws named (2026-11-09 14:09 EST, his first real paste).
    if (!found.sure && scoreEntry(e, words(line)).misses > 0) return { line, status: 'none', closest: [e.title, ...(found.alternates || [])].slice(0, 3) };
    const item = itemHit(e, line);
    return {
        line,
        status: found.sure ? 'found' : 'maybe',
        id: e._id ? String(e._id) : null,
        title: e.title,
        matchedBy: found.matchedBy === 'words' && item ? 'item' : found.matchedBy,
        item: item?.name || null,
        items: (e.items || []).length,
        priceType: e.priceType && e.priceType !== 'unknown' ? e.priceType : null,
        season: e.releaseSeason ? `Season ${e.releaseSeason}${e.releaseYear ? ` (${e.releaseYear})` : ''}` : null, // the entry card's own wording
        needs: needsOf(e),
        alternates: found.alternates || [],
        // A draw can run under another of its names ("Pop Idol Draw" is Starry Symphony's), so the lists are searched by the title, each other name, and the line as typed (2026-11-09 15:17 EST).
        onDraws: [e.title, ...(e.aliases || []), line].reduce((hit, t) => hit || onDraws(seasonalDoc, t, isSameTitle), null),
        inDraft: [e.title, ...(e.aliases || []), line].reduce((hit, t) => hit || onDraws(seasonalDoc, t, isSameTitle, true), null),
    };
}

// The pasted text -> { results, extra, indexSize }. Repeated lines are checked once; past MAX_LINES the rest are counted in `extra`.
function checkIndex(entries, text, ctx = {}) {
    const lines = [...new Set(String(text || '').split('\n').map(s => s.trim()).filter(Boolean))];
    return { results: lines.slice(0, MAX_LINES).map(l => checkLine(entries, l, ctx)), extra: Math.max(0, lines.length - MAX_LINES), indexSize: entries.length };
}

// How the line found it. `words` is Quick Add's word match, typos forgiven ("hersher of reason"), so it reads as a close match. How the line found it, said only when it is not simply the title (2026-11-11 11:07 EST, his screenshot: "by its title" told an admin nothing).
const MATCHED_BY = { title: null, alias: 'by another name it ran under', item: 'by an item', words: 'close match' };

// One result as the panel's text block. `E` is the emoji map.
function resultBlock(r, E) {
    const typed = clean(r.line);
    if (r.status === 'none') return `${E.cross} **${typed}** → not in the index\n-# ${r.closest?.length ? `Closest: ${r.closest.map(t => clean(t, 40)).join(' · ')}` : 'Saving the draw with a picture (Add Draw or Quick Add) indexes it'}`;
    if (r.status === 'describes') {
        const shown = r.candidates.slice(0, MAX_SHOWN_DESCRIBED).map(t => clean(t, 40)).join(' · ');
        return `${E.search} **${typed}** → fits ${r.candidates.length} draws, not one\n-# ${shown}${r.candidates.length > MAX_SHOWN_DESCRIBED ? ' · …' : ''}`;
    }
    const facts = [
        r.matchedBy === 'title' ? null : `${MATCHED_BY[r.matchedBy] || MATCHED_BY.words}${r.item ? ` (${clean(r.item, 50)})` : ''}`,
        r.items ? `${r.items} item${r.items === 1 ? '' : 's'}` : null, // none is said once, under Needs
        r.priceType ? typeLabel(r.priceType) : null,
        r.season,
        r.onDraws ? `on /draws (${r.onDraws})` : 'not on /draws',
        r.inDraft ? `staged in the draft (${r.inDraft})` : null,
    ].filter(Boolean);
    // The typed line is shown only when it differs from the title it found ("Lethal Hollow Draw → Lethal Hollow Draw" said nothing twice).
    const same = typed.toLowerCase() === clean(r.title, 70).toLowerCase();
    const head = r.status === 'found' ? `${E.checkmark} ${same ? '' : `**${typed}** → `}**${clean(r.title, 70)}**` : `${E.yellowDotGlow || E.warn} **${typed}** → maybe **${clean(r.title, 70)}**`;
    const or = r.status === 'maybe' && r.alternates.length ? `\n-# Or: ${r.alternates.map(t => clean(t, 40)).join(' · ')}` : '';
    // A complete draw is one fact line shorter, so a long paste fits more of them.
    const needs = r.needs.length ? `\n-# ${E.warn} Needs: ${r.needs.join(' · ')}` : '';
    // The fact line starts with a capital whichever fact leads it ("close match" led one line and "Complete" the next, 2026-11-11 11:40 EST click test).
    const line = `${r.needs.length ? '' : 'Complete · '}${facts.join(' · ')}`;
    return `${head}\n-# ${line.charAt(0).toUpperCase()}${line.slice(1)}${or}${needs}`;
}

module.exports = { MAX_LINES, needsOf, itemHit, checkLine, checkIndex, resultBlock, typeLabel };
