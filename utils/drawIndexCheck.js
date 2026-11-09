// utils/drawIndexCheck.js -- /manage draws' Check Draw Index: paste draw or item names, one per line, and see what the draw index (models/DrawCatalog.js) has for each, and what it still lacks.
//
// Harkirat, 2026-11-09 13:53 EST: "an admin command that checks the database catalogue if we currently have a draw indexed? probably as part of /manage draws. where i can bulk paste draw names or item names and check if we have a draw for that search, if the draw/catalogue contains all the info/needs updating, etc".
//
// Read only: it never writes the index. Each line is matched by Quick Add's own matcher (utils/quickAdd.js findCatalogDraw: the title, another name, then the words of the title and the items, typos forgiven), so a line that finds a draw here finds the same draw in Quick Add. Pure over a list of catalog documents, so scripts/drawIndexCheck.test.js needs no database.
const { findCatalogDraw, words } = require('./quickAdd');

const MAX_LINES = 20;          // checked per paste; checkView shows as many as fit in Discord's 4,000 characters and names the rest
const MAX_SHOWN_DESCRIBED = 5;

const clean = (s, max = 80) => String(s || '').replace(/[*_`~|>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
// "mythicWeapon" -> "Mythic Weapon": the draw type as a reader would say it.
const typeLabel = (t) => String(t || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());

// What a document still lacks for the bot to use it fully: a picture for /draws, items for prices and fingerprints, every item's kind (the Set item kinds box asks for these), and a draw type for /draw prices.
function needsOf(entry) {
    const out = [];
    if (!entry.imageUrl) out.push('no picture');
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

// Whether /draws lists it now, and in which section.
function onDraws(seasonalDoc, title, isSameTitle) {
    const list = [['New', seasonalDoc?.newDraws || []], ['Returning', seasonalDoc?.returningDraws || []]].flatMap(([section, draws]) => draws.map(draw => ({ section, draw })));
    const hit = require('./search').bestDrawMatch(list, title, x => x.draw.title, isSameTitle);
    return hit ? hit.section : null;
}

function checkLine(entries, line, { seasonalDoc = null, isSameTitle } = {}) {
    const found = findCatalogDraw(entries, line);
    if (!found) return { line, status: 'none' };
    if (!found.entry) return { line, status: 'describes', candidates: found.candidates.map(e => e.title) };
    const e = found.entry;
    const item = itemHit(e, line);
    return {
        line,
        status: found.sure ? 'found' : 'maybe',
        title: e.title,
        matchedBy: found.matchedBy === 'words' && item ? 'item' : found.matchedBy,
        item: item?.name || null,
        items: (e.items || []).length,
        priceType: e.priceType && e.priceType !== 'unknown' ? e.priceType : null,
        season: e.releaseSeason ? `Season ${e.releaseSeason}${e.releaseYear ? ` ${e.releaseYear}` : ''}` : null,
        needs: needsOf(e),
        alternates: found.alternates || [],
        onDraws: onDraws(seasonalDoc, e.title, isSameTitle),
    };
}

// The pasted text -> { results, extra, indexSize }. Repeated lines are checked once; past MAX_LINES the rest are counted in `extra`.
function checkIndex(entries, text, ctx = {}) {
    const lines = [...new Set(String(text || '').split('\n').map(s => s.trim()).filter(Boolean))];
    return { results: lines.slice(0, MAX_LINES).map(l => checkLine(entries, l, ctx)), extra: Math.max(0, lines.length - MAX_LINES), indexSize: entries.length };
}

// How the line found it. `words` is Quick Add's word match, typos forgiven ("hersher of reason"), so it reads as a close match.
const MATCHED_BY = { title: 'by its title', alias: 'by another name it ran under', item: 'by an item', words: 'close match' };

// One result as the panel's text block. `E` is the emoji map.
function resultBlock(r, E) {
    const typed = clean(r.line);
    if (r.status === 'none') return `${E.cross} **${typed}** → not in the index\n-# Saving the draw with a picture (Add Draw or Quick Add) indexes it`;
    if (r.status === 'describes') {
        const shown = r.candidates.slice(0, MAX_SHOWN_DESCRIBED).map(t => clean(t, 40)).join(' · ');
        return `${E.search} **${typed}** → fits ${r.candidates.length} draws, not one\n-# ${shown}${r.candidates.length > MAX_SHOWN_DESCRIBED ? ' · …' : ''}`;
    }
    const facts = [
        `${MATCHED_BY[r.matchedBy] || MATCHED_BY.words}${r.item ? ` (${clean(r.item, 50)})` : ''}`,
        r.items ? `${r.items} item${r.items === 1 ? '' : 's'}` : null, // none is said once, under Needs
        r.priceType ? typeLabel(r.priceType) : null,
        r.season,
        r.onDraws ? `on /draws (${r.onDraws})` : 'not on /draws',
    ].filter(Boolean);
    // The typed line is shown only when it differs from the title it found ("Lethal Hollow Draw → Lethal Hollow Draw" said nothing twice).
    const same = typed.toLowerCase() === clean(r.title, 70).toLowerCase();
    const head = r.status === 'found' ? `${E.checkmark} ${same ? '' : `**${typed}** → `}**${clean(r.title, 70)}**` : `${E.yellowDotGlow || E.warn} **${typed}** → maybe **${clean(r.title, 70)}**`;
    const or = r.status === 'maybe' && r.alternates.length ? `\n-# Or: ${r.alternates.map(t => clean(t, 40)).join(' · ')}` : '';
    // A complete draw is one fact line shorter, so a long paste fits more of them.
    const needs = r.needs.length ? `\n-# ${E.warn} Needs: ${r.needs.join(' · ')}` : '';
    return `${head}\n-# ${r.needs.length ? '' : 'Complete · '}${facts.join(' · ')}${or}${needs}`;
}

module.exports = { MAX_LINES, needsOf, itemHit, checkLine, checkIndex, resultBlock, typeLabel };
