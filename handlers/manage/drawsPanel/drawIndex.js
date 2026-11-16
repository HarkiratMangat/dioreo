// handlers/manage/drawsPanel/drawIndex.js -- the Draw Index panel inside /manage draws (Harkirat, 2026-11-11 11:02 EST: "i want the draw index as it's own dedicated panel/panel/system instead of just a single 'check draw index' button").
//
// The draw index (models/DrawCatalog.js) is what Quick Add, Add Draw and news triage match a draw against: its picture, items, draw type, other names and release season. This panel shows how complete it is, finds an entry (Check Names for a pasted list, Search for words), lists the entries with a gap, and opens one entry on its own card, where it can be edited (core/ops/drawIndex.js, revertable), its item kinds set, or the draw Quick Added.
//
// Since 2026-11-16 12:20 EST the OWNER also gets Upload Draws on the home, and Replace Picture, Delete Entry and Edit Entry's Title and Items on the card (handlers/manage/drawsPanel/drawIndexUpload.js; Harkirat 2026-11-16 11:11 EST: "an owner only command where i can upload and check the draws index"). Those are drawn only for the owner (`owner`) and re-checked with isOwner at their routes, so an admin opening the same panel from /manage draws never sees or reaches them. `/bot drawindex` opens this panel (commands/bot.js).
//
// Ids: `mng_dr|ix…`, behind the same /manage lock and the draws page's own tiers as the rest of the panel. Entries are keyed by their Mongo id; a search keeps its matches in a ManageSelection token (ids `x:<id>`). Errors and misses answer privately and leave the panel as it was.
const emojis = require('../../../utils/emojiMap');
const V = require('./views');
const { row, text, btn, panel, plural, ID } = V;
const BIG = () => ({ type: 14, spacing: 2, divider: true });
const SMALL = () => ({ type: 14, spacing: 1, divider: false });
const PAGE = 8;

const GAPS = {
    pic: { label: 'No Picture', test: (e) => !e.imageUrl },
    ph: { label: 'Placeholder Picture', test: (e) => e.imageUrl && require('../../../utils/placeholders').isPlaceholder(e.imageUrl) },
    type: { label: 'No Draw Type', test: (e) => !e.priceType || e.priceType === 'unknown' },
    kind: { label: 'Items Without a Kind', test: (e) => (e.items || []).some(i => !i.kind) },
    items: { label: 'No Items', test: (e) => !(e.items || []).length },
    all: { label: 'Every Entry', test: () => true },
};
const crumb = (...parts) => `-# ${['Draws', 'Draw Index', ...parts].join('  ›  ')}`;
const indexBack = () => btn('ix', 'Draw Index', emojis.returnArrow);
const isOwner = (id) => require('../../../utils/adminAccess').isOwner(id);
const loadEntries = () => require('../../../utils/drawCatalog').loadCatalog({ force: true });
const byTitle = (a, b) => String(a.title).localeCompare(String(b.title));

// Where an entry's draw is right now: on /draws, in the draft, or neither.
function placeOf(doc, e) {
    const { isSameDrawTitle } = require('../../../utils/search');
    const names = [e.title, ...(e.aliases || [])];
    const hit = (list) => (list || []).find(d => names.some(n => isSameDrawTitle(d.title, n)));
    const live = hit(doc?.newDraws) ? 'New' : hit(doc?.returningDraws) ? 'Returning' : null;
    const draft = hit(doc?.draft?.newDraws) ? 'New' : hit(doc?.draft?.returningDraws) ? 'Returning' : null;
    return { live, draft };
}
const gapsOf = (e) => Object.entries(GAPS).filter(([k, g]) => k !== 'all' && g.test(e)).map(([, g]) => g.label.toLowerCase());
function entryLine(e) {
    const gaps = gapsOf(e);
    const tier = emojis[require('../../../utils/drawCatalog').topTierOf(e.items || [])] || '';
    return `**${String(e.title).slice(0, 80)}**\n-# ${plural((e.items || []).length, 'item')}${e.releaseSeason ? ` · Season ${e.releaseSeason}` : ''}${gaps.length ? ` · ${emojis.warn} ${gaps.join(', ')}` : ''}`.replace(/^/, tier ? `${tier} ` : '');
}

// ---------- views ----------
function homeView(entries, doc, note = null, { owner = false } = {}) {
    const n = (k) => entries.filter(GAPS[k].test).length;
    // Counted words that read right at 1 and at many (2026-11-11 17:20 EST: the home said "1 items without a kind").
    const gapWords = { pic: c => `${c} with no picture`, ph: c => `${c} placeholder picture${c === 1 ? '' : 's'}`, type: c => `${c} with no draw type`, kind: c => `${c} item${c === 1 ? '' : 's'} without a kind` };
    const gapLine = ['pic', 'ph', 'type', 'kind'].filter(k => n(k)).map(k => `${emojis.warn} ${gapWords[k](n(k))}`);
    const components = [text(`${crumb()}\n## ${V.indexEmoji()} Draw Index\n-# ${plural(entries.length, 'draw')} indexed${gapLine.length ? ` · ${gapLine.join(' · ')}` : ` · ${emojis.checkmark} nothing missing`}\n-# What Quick Add, Add Draw and news triage match a draw against: its picture, items, draw type and other names.`)];
    if (note) components.push(SMALL(), text(note));
    components.push(
        BIG(),
        // The owner's upload sits above the finders, under its own line (the click test, 2026-11-16 12:58 EST: below "Find an entry…" it read as one of the finders).
        ...(owner ? [text('-# Add or update draws from their posters. The bot reads each one and tags it; you check it before it saves.'), row(btn('ixup', 'Upload Draws', emojis.plus, 1)), BIG()] : []),
        text('-# Find an entry…'),
        row(btn('ixcheck', 'Check Names', emojis.checkIndex || emojis.pasteImport, 1), btn('ixfind', 'Search the Index', emojis.search, 2, !entries.length)),
        { type: 1, components: [{ type: 3, custom_id: ID('ixgaps'), placeholder: 'Or list the entries with a gap…', options: Object.entries(GAPS).map(([value, g]) => ({ value, label: `${g.label} · ${n(value)}`, emoji: emojis.parseEmoji(value === 'all' ? V.indexEmoji() : emojis.warn) })) }] },
        BIG(),
        row(V.homeBtn()),
    );
    return panel(components);
}

// A paged list of entries, each with Open. `origin` is how its cards come back: `g:<gap>` or `t:<token>`.
function listView(entries, { title, origin, page = 0, pagerParts, sub = '' }) {
    const pages = Math.max(1, Math.ceil(entries.length / PAGE));
    const pg = Math.min(Math.max(Number(page) || 0, 0), pages - 1);
    const shown = entries.slice(pg * PAGE, pg * PAGE + PAGE);
    const components = [text(`${crumb(title)}\n## ${V.indexEmoji()} ${title}\n-# ${plural(entries.length, 'draw')}${sub}${pages > 1 ? ` · page ${pg + 1} of ${pages}` : ''}`), BIG()];
    if (!shown.length) components.push(text(`${emojis.checkmark} Nothing here.`));
    for (const e of shown) components.push({ type: 9, components: [text(entryLine(e))], accessory: btn(['ixopen', String(e._id), origin], 'Open', emojis.expand) });
    if (pages > 1) components.push(row(
        { type: 2, style: 2, custom_id: ID(...pagerParts, pg - 1), emoji: emojis.parseEmoji(emojis.left), disabled: pg === 0 },
        { type: 2, style: 2, custom_id: ID('ixpgn', origin), label: `${pg + 1} / ${pages}`, disabled: true },
        { type: 2, style: 2, custom_id: ID(...pagerParts, pg + 1), emoji: emojis.parseEmoji(emojis.right), disabled: pg === pages - 1 }));
    components.push(BIG(), row(indexBack(), V.homeBtn()));
    return panel(components);
}

function backFor(origin) {
    if (/^g:/.test(origin)) { const k = origin.slice(2); return btn(['ixgaps', k, 0], GAPS[k]?.label || 'Back', emojis.returnArrow); }
    if (/^t:/.test(origin)) return btn(['ixres', origin.slice(2), 0], 'Search Results', emojis.returnArrow);
    // A card opened from Check Names goes back to those results, not to the Draw Index home (2026-11-11 11:40 EST click test: Open, then the way back lost the check).
    if (/^c:/.test(origin)) return btn(['ixcres', origin.slice(2)], 'Check Names', emojis.returnArrow);
    return indexBack();
}

// One entry: its picture on top, then everything the index holds for it, and where its draw is.
function cardView(e, doc, origin = '', { header = null, resultRow = null, owner = false } = {}) {
    const typeName = require('../../../utils/drawTypes').drawTypeName(e.priceType);
    const place = placeOf(doc, e);
    const gaps = gapsOf(e);
    const items = (e.items || []).map(i => `${emojis[i.tier] || ''} ${String(i.name).slice(0, 80)}${i.kind ? ` · ${i.kind}` : ` · ${emojis.warn} no kind`}`.trim());
    // The breadcrumb names the page the card was opened from, the same page its way back returns to.
    const from = /^g:/.test(origin) ? GAPS[origin.slice(2)]?.label : /^t:/.test(origin) ? 'Search Results' : /^c:/.test(origin) ? 'Check Names' : null;
    const components = [text(crumb(...(from ? [from] : []), String(e.title).slice(0, 80)))];
    if (header) components.push(text(header), ...(resultRow ? [resultRow] : []), SMALL());
    if (e.imageUrl) components.push({ type: 12, items: [{ media: { url: e.imageUrl } }] });
    components.push(text([
        `### ${String(e.title).slice(0, 100)}`,
        ...(e.aliases?.length ? [`-# Also: ${e.aliases.slice(0, 8).map(a => String(a).slice(0, 60)).join(' · ')}`] : []),
        `-# ${[e.releaseSeason ? `First out in Season ${e.releaseSeason}${e.releaseYear ? ` (${e.releaseYear})` : ''}` : 'Release season not set', typeName && e.priceType !== 'unknown' ? typeName : `${emojis.warn} no draw type`].join(' · ')}`,
        items.length ? items.join('\n') : `-# ${emojis.warn} No items yet.`,
        `-# ${[place.live ? `On /draws (${place.live})` : 'Not on /draws', place.draft ? `in the draft (${place.draft})` : null].filter(Boolean).join(' · ')}${gaps.length ? `\n-# ${emojis.warn} Needs: ${gaps.join(', ')}` : ''}`,
    ].join('\n').slice(0, 3600)));
    components.push(BIG(), row(
        backFor(origin),
        btn(['ixedit', String(e._id), origin], 'Edit Entry', emojis.edit, 1),
        ...((e.items || []).some(i => !i.kind) ? [btn(['ixkinds', String(e._id)], 'Set Item Kinds', emojis.edit)] : []),
        ...(!place.live && !place.draft ? [btn(['ixqa', String(e._id)], 'Quick Add This Draw', emojis.plus, 3)] : []),
    ));
    if (owner) components.push(row(btn(['ixpic', String(e._id), origin], 'Replace Picture', emojis.edit), btn(['ixdel', String(e._id), origin], 'Delete Entry', emojis.collapse, 4)));
    return panel(components);
}

// Delete Entry asks first, and names the draws that use this entry: they keep their picture link, only the index's lookup goes.
function deleteView(e, doc, origin) {
    const place = placeOf(doc, e);
    const where = [place.live ? `on /draws (${place.live})` : null, place.draft ? `in the draft (${place.draft})` : null].filter(Boolean);
    return panel([
        text(`${crumb(String(e.title).slice(0, 80))}\n### ${emojis.warn} Delete ${String(e.title).slice(0, 80)} from the draw index?\n-# ${where.length ? `It is ${where.join(' and ')}; those draws keep their picture, but Quick Add, Add Draw and news triage will no longer find this entry.` : 'Quick Add, Add Draw and news triage will no longer find it.'} Revert brings it back.`),
        BIG(),
        row(btn(['ixopen', String(e._id), origin], 'Keep It', emojis.returnArrow), btn(['ixdelok', String(e._id), origin], 'Delete Entry', emojis.collapse, 4)),
    ]);
}

function editModal(e, origin, { owner = false } = {}) {
    const label = (lab, component, description) => ({ type: 18, label: lab, ...(description ? { description } : {}), component });
    const typeLabel = require('../../../commands/manage').drawTypeLabel(e.priceType || '').toJSON();
    typeLabel.component.required = false;
    typeLabel.component.min_values = 0;
    return {
        custom_id: ID('ixeditm', String(e._id), origin), title: `Edit ${String(e.title).slice(0, 40)}`,
        components: [
            label('Other names', { type: 4, custom_id: 'aka', style: 2, required: false, max_length: 1500, ...(e.aliases?.length ? { value: e.aliases.join('\n') } : {}), placeholder: 'Pop Idol Draw' }, 'One per line: names this draw also ran under. Quick Add and Check Names find it by these.'),
            label('Release season', { type: 4, custom_id: 'season', style: 1, required: false, max_length: 12, ...(e.releaseSeason ? { value: `Season ${e.releaseSeason}` } : {}), placeholder: 'Season 10' }, 'The season it first came out. Blank clears it.'),
            typeLabel,
            // The owner also edits the title and the items (2026-11-16 12:20 EST). The slug and the Cloudinary picture never move, and the old title becomes another name, so a lookup by it still lands here.
            ...(owner ? [
                label('Title', { type: 4, custom_id: 'title', style: 1, required: true, max_length: 90, value: String(e.title).slice(0, 90) }),
                label('Items', { type: 4, custom_id: 'items', style: 2, required: false, max_length: 2000, ...((e.items || []).length ? { value: require('./drawIndexUpload').itemsToText(e.items).slice(0, 2000) } : {}), placeholder: 'Legendary QQ9 - Moonlight (weapon)' }, 'One per line: rarity, name, (kind). Blank keeps them.'),
            ] : []),
        // The owner's Title and Items lead (the click test, 2026-11-16 13:02 EST: they sat under the other three, so the box opened on the other names).
        ].sort((x, y) => (owner ? ['title', 'items'].includes(y.component.custom_id) - ['title', 'items'].includes(x.component.custom_id) : 0)),
    };
}

// ---------- search ----------
function searchEntries(entries, q) {
    const w = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
    if (!w.length) return [];
    const hay = (e) => [e.title, ...(e.aliases || []), ...(e.items || []).map(i => i.name)].join(' ').toLowerCase();
    const inTitle = (e) => w.every(x => [e.title, ...(e.aliases || [])].join(' ').toLowerCase().includes(x));
    return entries.filter(e => w.every(x => hay(e).includes(x))).sort((a, b) => (inTitle(b) - inTitle(a)) || byTitle(a, b));
}

// Check Names, run on what was pasted. Shared by the pop-up's submit and the way back from a card, so both show the same results. Quick Add These takes only the found draws that are not on /draws or in the draft (2026-11-11 11:07 EST, his screenshot: Quick Add was offered for a draw already live).
async function runCheck(names, doc) {
    const { checkIndex } = require('../../../utils/drawIndexCheck');
    const entries = await require('../../../utils/drawCatalog').loadCatalog({ force: true });
    const result = checkIndex(entries, names, { seasonalDoc: doc, isSameTitle: require('../../../utils/search').isSameDrawTitle });
    const found = result.results.filter(r => (r.status === 'found' || r.status === 'maybe') && !r.onDraws && !r.inDraft).map(r => r.line);
    return { result, found };
}

// ---------- routing ---------- `ctx` carries the panel's own answering helpers (index.js), so this module shares its lock, tiers and private notes.
async function route(interaction, verb, a, b, c, ctx) {
    const { show, say, gate, getDoc, createSelection, loadSel } = ctx;
    const findEntry = async (id) => (await loadEntries()).find(e => String(e._id) === String(id)) || null;
    const owner = isOwner(interaction.user.id);
    // The owner's Upload Draws and its review (handlers/manage/drawsPanel/drawIndexUpload.js), owner-checked there.
    const U = require('./drawIndexUpload');
    if (U.isUploadVerb(verb)) return U.route(interaction, verb, a, b, c, ctx);
    if (verb === 'ix') return show(interaction, homeView(await loadEntries(), await getDoc(), null, { owner }));
    if (verb === 'ixcheck') return (await gate(interaction, 'exportnew')) && interaction.showModal(V.checkModal());
    if (verb === 'ixfind') return interaction.showModal(V.searchModal({ id: ID('ixfindm'), title: 'Search the Draw Index', hint: 'Words in the title, another name or an item, in any order' }));
    if (verb === 'ixfindm' && interaction.isModalSubmit?.()) {
        const q = interaction.fields.getTextInputValue('q');
        const hits = searchEntries(await loadEntries(), q);
        if (!hits.length) return say(interaction, `${emojis.cross} Nothing in the draw index matches \`${String(q).slice(0, 60)}\` (title, other names or items).`);
        if (hits.length === 1) return show(interaction, cardView(hits[0], await getDoc(), '', { owner }));
        const token = await createSelection({ ids: hits.map(e => `x:${e._id}`), selected: [], query: [String(q).slice(0, 100)] });
        return show(interaction, listView(hits, { title: 'Search Results', origin: `t:${token}`, pagerParts: ['ixres', token], sub: ` match \`${String(q).slice(0, 40)}\`` }));
    }
    if (verb === 'ixres') {
        const sel = await loadSel(a);
        if (!sel) return say(interaction, `${emojis.cross} Those search results expired. Search again.`);
        const byId = new Map((await loadEntries()).map(e => [`x:${e._id}`, e]));
        const hits = (sel.ids || []).map(k => byId.get(k)).filter(Boolean);
        return show(interaction, listView(hits, { title: 'Search Results', origin: `t:${a}`, page: b, pagerParts: ['ixres', a], sub: ` match \`${(sel.query || []).join(' ').slice(0, 40)}\`` }));
    }
    if (verb === 'ixgaps') {
        const k = interaction.isStringSelectMenu?.() ? interaction.values[0] : a;
        const g = GAPS[k] || GAPS.all;
        const list = (await loadEntries()).filter(g.test).sort(byTitle);
        return show(interaction, listView(list, { title: g.label, origin: `g:${k}`, page: interaction.isStringSelectMenu?.() ? 0 : b, pagerParts: ['ixgaps', k] }));
    }
    if (verb === 'ixcres') {
        if (!(await gate(interaction, 'exportnew'))) return;
        const sel = await loadSel(a);
        if (!sel?.text) return say(interaction, `${emojis.cross} That check expired (checks last a day). Run Check Names again.`);
        const { result, found } = await runCheck(sel.text, await getDoc());
        return show(interaction, V.checkView(result, a, found.length));
    }
    if (verb === 'ixopen') {
        const e = await findEntry(a);
        return e ? show(interaction, cardView(e, await getDoc(), b || '', { owner })) : say(interaction, `${emojis.cross} That entry is no longer in the draw index.`);
    }
    if (verb === 'ixedit') {
        if (!(await gate(interaction, 'edit'))) return;
        const e = await findEntry(a);
        return e ? interaction.showModal(editModal(e, b || '', { owner })) : say(interaction, `${emojis.cross} That entry is no longer in the draw index.`);
    }
    if (verb === 'ixeditm' && interaction.isModalSubmit?.()) {
        if (!(await gate(interaction, 'edit'))) return;
        const e = await findEntry(a);
        if (!e) return say(interaction, `${emojis.cross} That entry is no longer in the draw index.`);
        const get = (id) => { try { return interaction.fields.getTextInputValue(id); } catch { return ''; } };
        const aliases = String(get('aka') || '').split('\n').map(x => x.trim()).filter(Boolean);
        const seasonText = String(get('season') || '').trim();
        const m = seasonText.match(/^(?:season\s*|s)?(\d{1,3})$/i);
        if (seasonText && !m) return say(interaction, `${emojis.cross} "${seasonText.slice(0, 20)}" isn't a season. Type it like "Season 10", or leave it blank. Nothing was saved.`);
        let picked = null;
        try { picked = require('../../../utils/formChoice').readChoice(interaction, 'price_type')[0] || null; } catch { picked = null; }
        const payload = {};
        const same = (x, y) => JSON.stringify(x || []) === JSON.stringify(y || []);
        if (!same(aliases, e.aliases)) payload.aliases = aliases;
        const season = m ? Number(m[1]) : null;
        if ((e.releaseSeason || null) !== season) payload.releaseSeason = season;
        if (picked && picked !== (e.priceType || '')) payload.priceType = picked;
        // The owner's Title and Items (drawIndexUpload.js parseItemsText keeps names as typed). Either one makes the save a drawindex.update, which also recomputes the fingerprint and tags; the old title is kept as another name.
        let opType = 'drawindex.edit';
        if (owner) {
            const titleIn = String(get('title') || '').trim();
            const itemsIn = String(get('items') || '').trim();
            if (titleIn && titleIn !== e.title) { payload.title = require('../../../utils/adminParser').toTitleCase(titleIn.slice(0, 90)); payload.aliases = [...new Set([...(payload.aliases || e.aliases || []), e.title])]; opType = 'drawindex.update'; }
            if (itemsIn) {
                const U = require('./drawIndexUpload');
                const parsed = U.parseItemsText(itemsIn);
                if (parsed.errors.length) return say(interaction, `${emojis.cross} These lines need a rarity word first (Mythic, Legendary or Epic): ${parsed.errors.slice(0, 3).map(x => `\`${x}\``).join(', ')}. Nothing was saved.`);
                if (U.itemsToText(parsed.items) !== U.itemsToText(e.items)) { payload.items = parsed.items; opType = 'drawindex.update'; }
            }
        }
        if (!Object.keys(payload).length) return say(interaction, `${emojis.info} Nothing changed, so nothing was saved.`);
        await interaction.deferUpdate();
        const op = opType === 'drawindex.update' ? { type: opType, target: { id: String(e._id) }, payload: { set: payload, rows: [] } } : { type: opType, target: { id: String(e._id) }, payload };
        const result = await require('../../../core/changeset').commitSet([op], { actorId: interaction.user.id });
        if (!result.ok) return say(interaction, `${emojis.cross} Not saved: ${require('../shared').extractCommitError(result)}`);
        const after = await findEntry(a);
        const what = Object.keys(payload).map(k => ({ aliases: 'other names', releaseSeason: 'release season', priceType: 'draw type', title: 'title', items: 'items' })[k]).join(', ');
        const rev = ID('ixrevert', result.changeIds.join(','), a, b || '');
        const resultRow = rev.length <= 100 ? row({ type: 2, style: 4, label: 'Revert', custom_id: rev, emoji: emojis.parseEmoji(emojis.keep) }) : null;
        return show(interaction, cardView(after || e, await getDoc(), b || '', { header: `### ${emojis.checkmark} Saved: ${what}`, resultRow, owner }));
    }
    if (verb === 'ixrevert') {
        return require('../results').revertChanges(interaction, String(a || '').split(',').filter(Boolean), {
            doneNote: 'the entry is back as it was',
            render: async (note) => { const e = await findEntry(b); return e ? cardView(e, await getDoc(), c || '', { header: note, owner }) : homeView(await loadEntries(), await getDoc(), note, { owner }); },
        });
    }
    // ---------- the owner's Replace Picture and Delete Entry ----------
    if (['ixpic', 'ixpicm', 'ixdel', 'ixdelok'].includes(verb) && !owner) return say(interaction, require('./drawIndexUpload').OWNER_ONLY);
    if (verb === 'ixpic') {
        const e = await findEntry(a);
        return e ? interaction.showModal(require('./drawIndexUpload').replaceModal(String(e._id), b || '')) : say(interaction, `${emojis.cross} That entry is no longer in the draw index.`);
    }
    if (verb === 'ixpicm' && interaction.isModalSubmit?.()) {
        const e = await findEntry(a);
        if (!e) return say(interaction, `${emojis.cross} That entry is no longer in the draw index.`);
        let file = null;
        try { file = [...(interaction.fields.getUploadedFiles('pic')?.values() || [])][0] || null; } catch { file = null; }
        if (!file?.url) return say(interaction, `${emojis.cross} No picture came through. Nothing was changed.`);
        await interaction.deferUpdate();
        // The logo bar is found and cropped here too (utils/drawPictureBar.js); a picture that cannot be read has none.
        let crop = null;
        try { const img = await require('../../../utils/drawIndexRead').fetchImage(file.url); const m = await require('../../../utils/drawPictureBar').measure(img.buffer); if (m.bar) crop = m; } catch { crop = null; }
        const up = await require('../../../utils/drawIndexPicture').uploadPicture({ slug: e.slug, sourceUrl: file.url, doc: e, previousTags: e.tags || [], crop });
        if (!up.ok) return say(interaction, `${emojis.cross} The picture didn't upload (${up.error}). Nothing was changed.`);
        const rows = require('./drawIndexUpload').rowsToRepoint(await getDoc(), e, up.url);
        const result = await require('../../../core/changeset').commitSet([{ type: 'drawindex.update', target: { id: String(e._id) }, payload: { set: { imageUrl: up.url, publicId: up.publicId }, rows } }], { actorId: interaction.user.id });
        if (!result.ok) return say(interaction, `${emojis.cross} The picture uploaded, but the index was not updated: ${require('../shared').extractCommitError(result)}`);
        const rev = ID('ixrevert', result.changeIds.join(','), a, b || '');
        const resultRow = rev.length <= 100 ? row({ type: 2, style: 4, label: 'Revert', custom_id: rev, emoji: emojis.parseEmoji(emojis.keep) }) : null;
        return show(interaction, cardView(await findEntry(a) || e, await getDoc(), b || '', { header: `### ${emojis.checkmark} Picture replaced${rows.length ? ` · ${plural(rows.length, 'draw')} now use it` : ''}${crop ? ` · logo bar cropped (${crop.bar}px)` : ''}\n-# Revert puts the index back; the old picture itself is not kept.`, resultRow, owner }));
    }
    if (verb === 'ixdel') {
        const e = await findEntry(a);
        return e ? show(interaction, deleteView(e, await getDoc(), b || '')) : say(interaction, `${emojis.cross} That entry is no longer in the draw index.`);
    }
    if (verb === 'ixdelok') {
        const e = await findEntry(a);
        if (!e) return say(interaction, `${emojis.cross} That entry is no longer in the draw index.`);
        await interaction.deferUpdate();
        const result = await require('../../../core/changeset').commitSet([{ type: 'drawindex.delete', target: { id: String(e._id) } }], { actorId: interaction.user.id });
        if (!result.ok) return say(interaction, `${emojis.cross} Not deleted: ${require('../shared').extractCommitError(result)}`);
        const rev = ID('ixrevert', result.changeIds.join(','), '', '');
        const note = `### ${emojis.checkmark} Deleted ${String(e.title).slice(0, 80)} from the draw index`;
        const comps = homeView(await loadEntries(), await getDoc(), note, { owner });
        // Revert goes under the note it reverts (the click test, 2026-11-16 13:03 EST: spliced at 2 it sat above the note).
        const at = comps[0].components.findIndex(c => c.type === 10 && String(c.content || '').includes('Deleted '));
        if (rev.length <= 100) comps[0].components.splice(at === -1 ? 2 : at + 1, 0, row({ type: 2, style: 4, label: 'Revert', custom_id: rev, emoji: emojis.parseEmoji(emojis.keep) }));
        return show(interaction, comps);
    }
    if (verb === 'ixkinds') {
        // Setting item kinds writes the index, so it takes the draws edit tier, as Edit Entry does (commit security review, 2026-11-11 11:27 EST).
        if (!(await gate(interaction, 'edit'))) return;
        const e = await findEntry(a);
        if (!e) return say(interaction, `${emojis.cross} That entry is no longer in the draw index.`);
        await interaction.deferUpdate();
        return require('../itemKinds').askItemKinds(interaction, [e.title]);
    }
    if (verb === 'ixqa') {
        if (!(await gate(interaction, 'quickadd'))) return;
        const e = await findEntry(a);
        if (!e) return say(interaction, `${emojis.cross} That entry is no longer in the draw index.`);
        return interaction.showModal(require('../../../commands/manage').buildQuickAddModal({ value: e.title }));
    }
    return false;
}

const isIndexVerb = (verb) => /^ix/.test(String(verb || ''));

module.exports = { route, runCheck, isIndexVerb, homeView, listView, cardView, editModal, deleteView, searchEntries, placeOf, indexBack, GAPS, PAGE };
