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
    // Needs My Eyes is every entry with any gap above, and Indexed Draws every entry (Harkirat 2026-11-16 22:27 EST: "view indexed draws (changes to a paginated view)" and "a 'needs my eyes' button for the draws such as no items, placeholder image, etc.").
    eyes: { label: 'Needs My Eyes', test: (e) => gapsOf(e).length > 0 },
    all: { label: 'Indexed Draws', test: () => true },
};
// The gaps the Needs My Eyes page filters by, and the lists that page covers.
const EYE_GAPS = ['pic', 'ph', 'type', 'kind', 'items'];
const isEyes = (k) => k === 'eyes' || EYE_GAPS.includes(k);
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
function gapsOf(e) { return EYE_GAPS.filter(k => GAPS[k].test(e)).map(k => GAPS[k].label.toLowerCase()); }
// A draft exists when the next season has been started in it (a title, a start or staged draws).
const hasDraft = (doc) => Boolean(doc?.draft && (doc.draft.currentSeasonTitle || doc.draft.bpStart || (doc.draft.newDraws || []).length || (doc.draft.returningDraws || []).length));
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
    // No breadcrumb and no explaining lines on any Draw Index screen (Harkirat 2026-11-16 15:52 EST, his phone screenshot: "So much prose" and "why tf do you have a 'draws > draw index' eye brow at the top of the panel"). A heading, the facts, the controls.
    const components = [text(`## ${V.indexEmoji()} Draw Index\n-# ${plural(entries.length, 'draw')} indexed${gapLine.length ? ` · ${gapLine.join(' · ')}` : ` · ${emojis.checkmark} nothing missing`}`)];
    if (note) components.push(SMALL(), text(note));
    components.push(
        BIG(),
        // A small label over each group, the way /manage draws' home does it (Harkirat picked this, "a", 2026-11-16 16:24 EST, after the cut-down home read as too bare). The owner's upload sits above the finders, divided from them. Two uploads with their own pop-ups (Harkirat 2026-11-16 22:27 EST: "upload draw (single draw) and a 2nd button 'bulk upload' (with different forms)").
        ...(owner ? [text('-# Add draws…'), row(btn('ixup1', 'Upload Draw', emojis.plus, 1), btn('ixup', 'Bulk Upload', emojis.mngBulkAdd)), BIG()] : []),
        // His three finders (same message): every entry paged, Search Index (one name or many lines; findView decides how to answer), and Needs My Eyes, which replaced the gap dropdown (that is a filter on its page now).
        text('-# Find draws…'),
        row(
            btn(['ixgaps', 'all', 0], 'View Indexed Draws', V.indexEmoji(), 2, !entries.length),
            btn('ixcheck', 'Search Index', emojis.search, 1, !entries.length),
            btn(['ixgaps', 'eyes', 0], n('eyes') ? `Needs My Eyes · ${n('eyes')}` : 'Needs My Eyes', n('eyes') ? emojis.warn : emojis.checkmark, 2, !entries.length),
        ),
        BIG(),
        row(V.homeBtn()),
    );
    return panel(components);
}

// A paged list of entries, each with Open. `origin` is how its cards come back: `g:<gap>` or `t:<token>`.
function listView(entries, { title, origin, page = 0, pagerParts, sub = '', again = null, filterRow = null }) {
    const pages = Math.max(1, Math.ceil(entries.length / PAGE));
    const pg = Math.min(Math.max(Number(page) || 0, 0), pages - 1);
    const shown = entries.slice(pg * PAGE, pg * PAGE + PAGE);
    // A Find Draws result list reads like the check's results: the search emoji and Find Again beside the way back.
    const components = [text(`## ${again ? emojis.search : V.indexEmoji()} ${title}\n-# ${plural(entries.length, 'draw')}${sub}${pages > 1 ? ` · page ${pg + 1} of ${pages}` : ''}`), ...(filterRow ? [filterRow] : []), BIG()];
    if (!shown.length) components.push(text(`${emojis.checkmark} Nothing here.`));
    // "View", his word (2026-11-16 22:27 EST: "reword open to 'view'").
    for (const e of shown) components.push({ type: 9, components: [text(entryLine(e))], accessory: btn(['ixopen', String(e._id), origin], 'View', emojis.expand) });
    if (pages > 1) components.push(row(
        { type: 2, style: 2, custom_id: ID(...pagerParts, pg - 1), emoji: emojis.parseEmoji(emojis.left), disabled: pg === 0 },
        { type: 2, style: 2, custom_id: ID('ixpgn', origin), label: `${pg + 1} / ${pages}`, disabled: true },
        { type: 2, style: 2, custom_id: ID(...pagerParts, pg + 1), emoji: emojis.parseEmoji(emojis.right), disabled: pg === pages - 1 }));
    // One way back on a sub-page (his 16:51 EST screenshot: Draw Index and Home, two ↩ buttons side by side); Home is on the Draw Index home only.
    components.push(BIG(), row(indexBack(), ...(again ? [btn(['check', again], 'Search Again', emojis.search)] : [])));
    return panel(components);
}

// One gap list as a page: Needs My Eyes and its filters sort the entries with the most gaps first and carry the filter menu; Indexed Draws and the rest go by title.
function gapView(entries, k, page = 0) {
    const key = GAPS[k] ? k : 'all';
    const g = GAPS[key];
    const list = entries.filter(g.test).sort((a, b) => (isEyes(key) ? gapsOf(b).length - gapsOf(a).length : 0) || byTitle(a, b));
    const count = (x) => entries.filter(GAPS[x].test).length;
    const filterRow = isEyes(key) ? { type: 1, components: [{ type: 3, custom_id: ID('ixgaps'), placeholder: 'Show one gap…', options: ['eyes', ...EYE_GAPS].map(v => ({ value: v, label: `${v === 'eyes' ? 'Everything that needs a look' : GAPS[v].label} · ${count(v)}`, default: v === key, emoji: emojis.parseEmoji(count(v) ? emojis.warn : emojis.checkmark) })) }] } : null;
    return listView(list, { title: g.label, origin: `g:${key}`, page, pagerParts: ['ixgaps', key], filterRow });
}

function backFor(origin) {
    if (/^g:/.test(origin)) { const k = origin.slice(2); return btn(['ixgaps', k, 0], isEyes(k) ? 'Needs My Eyes' : GAPS[k]?.label || 'Back', emojis.returnArrow); }
    if (/^t:/.test(origin)) return btn(['ixres', origin.slice(2), 0], 'Results', emojis.returnArrow);
    // A card opened from Check Names goes back to those results, not to the Draw Index home (2026-11-11 11:40 EST click test: Open, then the way back lost the check).
    if (/^c:/.test(origin)) return btn(['ixcres', origin.slice(2)], 'Results', emojis.returnArrow);
    return indexBack();
}

// One entry: its picture on top, then everything the index holds for it, and where its draw is.
function cardView(e, doc, origin = '', { header = null, resultRow = null, owner = false, adding = false } = {}) {
    const typeName = require('../../../utils/drawTypes').drawTypeName(e.priceType);
    const place = placeOf(doc, e);
    const gaps = gapsOf(e);
    const items = (e.items || []).map(i => `${emojis[i.tier] || ''} ${String(i.name).slice(0, 80)}${i.kind ? ` · ${i.kind}` : ` · ${emojis.warn} no kind`}`.trim());
    // The way back (backFor) names the page the card was opened from; there is no breadcrumb.
    const components = [];
    if (header) components.push(text(header), ...(resultRow ? [resultRow] : []), SMALL());
    if (e.imageUrl) components.push({ type: 12, items: [{ media: { url: e.imageUrl } }] });
    components.push(text([
        `### ${String(e.title).slice(0, 100)}`,
        ...(e.aliases?.length ? [`-# Also: ${e.aliases.slice(0, 8).map(a => String(a).slice(0, 60)).join(' · ')}`] : []),
        `-# ${[e.releaseSeason ? `First out in Season ${e.releaseSeason}${e.releaseYear ? ` (${e.releaseYear})` : ''}` : 'Release season not set', typeName && e.priceType !== 'unknown' ? typeName : `${emojis.warn} no draw type`].join(' · ')}`,
        items.length ? items.join('\n') : `-# ${emojis.warn} No items yet.`,
        `-# ${[place.live ? `On /draws (${place.live})` : 'Not on /draws', place.draft ? `in the draft (${place.draft})` : null].filter(Boolean).join(' · ')}${gaps.length ? `\n-# ${emojis.warn} Needs: ${gaps.join(', ')}` : ''}`,
    ].join('\n').slice(0, 3600)));
    const id = String(e._id);
    const canLive = !place.live;
    const canDraft = hasDraft(doc) && !place.draft;
    components.push(BIG());
    // Items with no kind get their fix on its own row above the actions; it saves on this card with Revert (handled by `ixkinds`).
    if ((e.items || []).some(i => !i.kind)) components.push(row(btn(['ixkinds', id, origin], 'Set Item Kinds', emojis.edit)));
    // Add asks where, when both are open: the row turns into the two targets (`ixadd`).
    if (adding) components.push(row(btn(['ixopen', id, origin], 'Cancel', emojis.returnArrow), btn(['ixaddl', id, origin], 'Add to Live', emojis.plus, 3), btn(['ixaddd', id, origin], 'Add to Draft', emojis.plus, 3)));
    // One action row, in his order (2026-11-16 22:27 EST: "an action row below to edit, delete, picture, add (to either add to live or to draft)"). Delete and Picture are the owner's; Add only while the draw is missing from /draws or the draft.
    else components.push(row(
        backFor(origin),
        btn(['ixedit', id, origin], 'Edit', emojis.edit, 1),
        ...(owner ? [btn(['ixdel', id, origin], 'Delete', emojis.deleteBin, 4)] : []),
        ...(owner ? [btn(['ixpic', id, origin], 'Picture', emojis.mngBulkReplace)] : []),
        ...(canLive || canDraft ? [btn(['ixadd', id, origin], 'Add', emojis.plus, 3)] : []),
    ));
    return panel(components);
}

// Delete Entry asks first, and names the draws that use this entry: they keep their picture link, only the index's lookup goes.
function deleteView(e, doc, origin) {
    const place = placeOf(doc, e);
    const where = [place.live ? `on /draws (${place.live})` : null, place.draft ? `in the draft (${place.draft})` : null].filter(Boolean);
    return panel([
        text(`### ${emojis.warn} Delete ${String(e.title).slice(0, 80)}?\n-# ${where.length ? `Used ${where.join(' · ')} · those draws keep their picture · ` : ''}Every change can be reverted.`),
        BIG(),
        // The same words and emoji as /manage draws' own delete confirm; row() puts Cancel first, as it puts every way back (utils/returnFirst.js).
        row(btn(['ixdelok', String(e._id), origin], 'Yes, Delete', emojis.deleteBin, 4), btn(['ixopen', String(e._id), origin], 'Cancel', emojis.returnArrow)),
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

// Find Draws, one place for every way of looking a draw up (the finder button, /bot drawindex entry: typed words, /manage draws do: Check Names). Returns { view } for the panel, or { note } for a private message: one name, a single match opens its card and several are a list; one name with no match is a miss, so it answers privately (his rule, 2026-11-11 11:56 EST) with Upload This Draw on the note; several lines are the check, a result on the panel, with Upload for the names not found (his finding 3, 2026-11-16 16:51 EST: "to add that item i now need to navigate to a different page").
async function findView(input, { owner = false, doc = null } = {}) {  // `input`, not `text`: text() builds the note below
    const newSel = async (data) => { const t = require('crypto').randomBytes(6).toString('base64url'); await require('../../../models/ManageSelection').create({ _id: t, mode: 'DRAWS', ...data }); return t; };
    const lines = String(input || '').split('\n').map(x => x.trim()).filter(Boolean);
    if (lines.length === 1) {
        const hits = searchEntries(await loadEntries(), lines[0]);
        if (hits.length === 1) return { view: cardView(hits[0], doc, '', { owner }) };
        if (hits.length > 1) {
            const token = await newSel({ ids: hits.map(e => `x:${e._id}`), selected: [], query: [lines[0].slice(0, 100)] });
            return { view: listView(hits, { title: 'Results', origin: `t:${token}`, pagerParts: ['ixres', token], sub: ` match \`${lines[0].slice(0, 40)}\``, again: token }) };
        }
        const { result } = await runCheck(lines[0], doc);
        const r = result.results[0] || {};
        // One result is its card, never a results page of one (Harkirat 2026-11-16 22:27 EST: "if it's only 1 result then just show me the expanded view of the draw"). A "maybe" stays a page: it is a choice between draws.
        if (r.status === 'found' && r.id) { const e = (await loadEntries()).find(x => String(x._id) === String(r.id)); if (e) return { view: cardView(e, doc, '', { owner }) }; }
        if (r.status === 'none' || !r.id) {
            const token = await newSel({ text: lines[0].slice(0, 200), query: [] });
            const closest = r.closest?.length ? `\n-# Closest: ${r.closest.slice(0, 3).map(t => String(t).slice(0, 40)).join(' · ')}` : '';
            return { note: panel([text(`${emojis.cross} Nothing in the draw index matches \`${lines[0].slice(0, 60)}\`.${closest}`), ...(owner ? [row(btn(['ixup1', token], 'Upload This Draw', emojis.plus, 1))] : [])]) };
        }
    }
    const { result, found } = await runCheck(lines.join('\n'), doc);
    const token = await newSel({ text: lines.join('\n').slice(0, 4000), query: found });
    return { view: V.checkView(result, token, found.length, { owner }) };
}

// ---------- routing ---------- `ctx` carries the panel's own answering helpers (index.js), so this module shares its lock, tiers and private notes.
async function route(interaction, verb, a, b, c, ctx) {
    const { show, say, gate, getDoc, createSelection, loadSel } = ctx;
    const findEntry = async (id) => (await loadEntries()).find(e => String(e._id) === String(id)) || null;
    const owner = isOwner(interaction.user.id);
    // The owner's Upload Draws and its review (handlers/manage/drawsPanel/drawIndexUpload.js), owner-checked there.
    const U = require('./drawIndexUpload');
    // Misses and refusals answer privately and leave the panel as it was; saves and results answer on the panel (his rule, 2026-11-11 11:56 EST, docs/claude/2026-11-10-manage-draws-refine-lessons.md; restored 2026-11-16 18:04 EST after a pass drew them in the panel).
    const gone = () => say(interaction, `${emojis.cross} That entry is no longer in the draw index.`);
    const onCard = (e, note) => say(interaction, note);
    if (U.isUploadVerb(verb)) return U.route(interaction, verb, a, b, c, ctx);
    if (verb === 'ix') return show(interaction, homeView(await loadEntries(), await getDoc(), null, { owner }));
    // Find Draws. `ixfind` is an older panel's Search the Index button (before 2026-11-16 16:51 EST), which now opens the same one finder.
    if (['ixcheck', 'ixfind'].includes(verb)) return (await gate(interaction, 'exportnew')) && interaction.showModal(V.checkModal());
    if (verb === 'ixres') {
        const sel = await loadSel(a);
        if (!sel) return say(interaction, `${emojis.cross} Those search results expired. Search again.`);
        const byId = new Map((await loadEntries()).map(e => [`x:${e._id}`, e]));
        const hits = (sel.ids || []).map(k => byId.get(k)).filter(Boolean);
        return show(interaction, listView(hits, { title: 'Results', origin: `t:${a}`, page: b, pagerParts: ['ixres', a], sub: ` match \`${(sel.query || []).join(' ').slice(0, 40)}\``, again: a }));
    }
    if (verb === 'ixgaps') {
        const k = interaction.isStringSelectMenu?.() ? interaction.values[0] : a;
        return show(interaction, gapView(await loadEntries(), k, interaction.isStringSelectMenu?.() ? 0 : b));
    }
    if (verb === 'ixcres') {
        if (!(await gate(interaction, 'exportnew'))) return;
        const sel = await loadSel(a);
        if (!sel?.text) return say(interaction, `${emojis.cross} That search expired (searches last a day). Search the index again.`);
        const { result, found } = await runCheck(sel.text, await getDoc());
        return show(interaction, V.checkView(result, a, found.length, { owner, page: Number(b) || 0 }));
    }
    if (verb === 'ixopen') {
        // A button carries the entry in its id; the saved screen's View menu carries it in the value.
        const e = await findEntry(interaction.isStringSelectMenu?.() ? interaction.values[0] : a);
        if (!e) return gone();
        // Opened from the saved screen (`v:<upload token>`): the batch's Revert stays on the card, so looking at a save never costs the way to undo it (think-pass, 2026-11-17 00:11 EST).
        if (/^v:/.test(b || '')) {
            const rev = { type: 2, style: 4, label: 'Revert', custom_id: ID('ixvrev', b.slice(2)), emoji: emojis.parseEmoji(emojis.keep) };
            return show(interaction, cardView(e, await getDoc(), '', { owner, header: `-# ${emojis.checkmark} Just saved`, resultRow: row(rev) }));
        }
        return show(interaction, cardView(e, await getDoc(), b || '', { owner }));
    }
    if (verb === 'ixedit') {
        if (!(await gate(interaction, 'edit'))) return;
        const e = await findEntry(a);
        return e ? interaction.showModal(editModal(e, b || '', { owner })) : gone();
    }
    if (verb === 'ixeditm' && interaction.isModalSubmit?.()) {
        if (!(await gate(interaction, 'edit'))) return;
        const e = await findEntry(a);
        if (!e) return gone();
        const get = (id) => { try { return interaction.fields.getTextInputValue(id); } catch { return ''; } };
        const aliases = String(get('aka') || '').split('\n').map(x => x.trim()).filter(Boolean);
        const seasonText = String(get('season') || '').trim();
        const m = seasonText.match(/^(?:season\s*|s)?(\d{1,3})$/i);
        if (seasonText && !m) return onCard(e, `${emojis.cross} "${seasonText.slice(0, 20)}" isn't a season. Type it like "Season 10", or leave it blank. Nothing was saved.`);
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
                if (parsed.errors.length) return onCard(e, `${emojis.cross} These lines need a rarity word first (Mythic, Legendary or Epic): ${parsed.errors.slice(0, 3).map(x => `\`${x}\``).join(', ')}. Nothing was saved.`);
                if (U.itemsToText(parsed.items) !== U.itemsToText(e.items)) { payload.items = parsed.items; opType = 'drawindex.update'; }
            }
        }
        if (!Object.keys(payload).length) return onCard(e, `${emojis.info} Nothing changed, so nothing was saved.`);
        await interaction.deferUpdate();
        const op = opType === 'drawindex.update' ? { type: opType, target: { id: String(e._id) }, payload: { set: payload, rows: [] } } : { type: opType, target: { id: String(e._id) }, payload };
        const result = await require('../../../core/changeset').commitSet([op], { actorId: interaction.user.id });
        if (!result.ok) return onCard(e, `${emojis.cross} Not saved: ${require('../shared').extractCommitError(result)}`);
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
        return e ? interaction.showModal(require('./drawIndexUpload').replaceModal(String(e._id), b || '')) : gone();
    }
    if (verb === 'ixpicm' && interaction.isModalSubmit?.()) {
        const e = await findEntry(a);
        if (!e) return gone();
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
        const hold = up.hold ? { id: up.hold, publicId: up.publicId } : null;
        const result = await require('../../../core/changeset').commitSet([{ type: 'drawindex.update', target: { id: String(e._id) }, payload: { set: { imageUrl: up.url, publicId: up.publicId }, rows, ...(hold ? { hold } : {}) } }], { actorId: interaction.user.id });
        if (!result.ok) {
            // The upload overwrote the old picture before the save failed: put it back from its held copy.
            const back = hold ? (await require('../../../utils/drawPictureHold').restorePicture({ from: hold.id, to: hold.publicId })).ok : true;
            return say(interaction, `${emojis.cross} The index was not updated: ${require('../shared').extractCommitError(result)}${back ? ' The old picture is back.' : ` ${emojis.warn} The old picture could not be put back.`}`);
        }
        const rev = ID('ixrevert', result.changeIds.join(','), a, b || '');
        const resultRow = rev.length <= 100 ? row({ type: 2, style: 4, label: 'Revert', custom_id: rev, emoji: emojis.parseEmoji(emojis.keep) }) : null;
        return show(interaction, cardView(await findEntry(a) || e, await getDoc(), b || '', { header: `### ${emojis.checkmark} Picture replaced${rows.length ? ` · ${plural(rows.length, 'draw')} now ${rows.length === 1 ? 'uses' : 'use'} it` : ''}${crop ? ` · logo bar cropped (${crop.bar}px)` : ''}`, resultRow, owner }));
    }
    if (verb === 'ixdel') {
        const e = await findEntry(a);
        return e ? show(interaction, deleteView(e, await getDoc(), b || '')) : gone();
    }
    if (verb === 'ixdelok') {
        const e = await findEntry(a);
        if (!e) return gone();
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
        // Setting item kinds writes the index, so it takes the draws edit tier, as Edit Entry does (commit security review, 2026-11-11 11:27 EST). From the card it is this card's own pop-up, saved here with Revert: the shared question (handlers/manage/itemKinds.js) answered in a message of its own, his 8:29 PM screenshot (2026-11-16 22:27 EST: "i want a better 'saved' confirmation screen").
        if (!(await gate(interaction, 'edit'))) return;
        const e = await findEntry(a);
        if (!e) return gone();
        if (!(e.items || []).some(i => !i.kind)) return say(interaction, `${emojis.info} Every item in this draw already has a kind.`);
        return interaction.showModal(kindsModal(e, b || ''));
    }
    if (verb === 'ixkindsm' && interaction.isModalSubmit?.()) {
        if (!(await gate(interaction, 'edit'))) return;
        const e = await findEntry(a);
        if (!e) return gone();
        const missing = (e.items || []).map((it, i) => ({ it, i })).filter(x => !x.it.kind).slice(0, 5);
        const kinds = [];
        const set = [];
        missing.forEach(({ it, i }, k) => {
            let kind = null;
            try { kind = require('../../../utils/formChoice').readChoice(interaction, `k${k}`)[0] || null; } catch { kind = null; }
            if (['weapon', 'character', 'vehicle', 'other'].includes(kind)) { kinds.push({ index: i, kind }); set.push(`-# ${String(it.name).slice(0, 70)}: ${kind}`); }
        });
        if (!set.length) return onCard(e, `${emojis.info} No kind was picked, so nothing was saved.`);
        await interaction.deferUpdate();
        const result = await require('../../../core/changeset').commitSet([{ type: 'drawindex.edit', target: { id: String(e._id) }, payload: { kinds } }], { actorId: interaction.user.id });
        if (!result.ok) return onCard(e, `${emojis.cross} Not saved: ${require('../shared').extractCommitError(result)}`);
        const rev = ID('ixrevert', result.changeIds.join(','), a, b || '');
        const resultRow = rev.length <= 100 ? row({ type: 2, style: 4, label: 'Revert', custom_id: rev, emoji: emojis.parseEmoji(emojis.keep) }) : null;
        return show(interaction, cardView(await findEntry(a) || e, await getDoc(), b || '', { header: `### ${emojis.checkmark} Saved ${set.length === 1 ? 'an item kind' : `${set.length} item kinds`}\n${set.join('\n')}`, resultRow, owner }));
    }
    // Add: straight to the one Quick Add box that can take this draw, or a choice when both live and the draft can (`adding`).
    if (['ixadd', 'ixaddl', 'ixaddd'].includes(verb)) {
        const e = await findEntry(a);
        if (!e) return gone();
        const doc = await getDoc();
        const place = placeOf(doc, e);
        const canLive = !place.live;
        const canDraft = hasDraft(doc) && !place.draft;
        const target = verb === 'ixaddl' ? 'live' : verb === 'ixaddd' ? 'draft' : canLive && canDraft ? null : canLive ? 'live' : canDraft ? 'draft' : 'none';
        if (target === 'none') return say(interaction, `${emojis.info} This draw is already on /draws and in the draft.`);
        if (!target) return show(interaction, cardView(e, doc, b || '', { owner, adding: true }));
        if ((target === 'live' && !canLive) || (target === 'draft' && !canDraft)) return say(interaction, `${emojis.info} This draw is already ${target === 'live' ? 'on /draws' : 'in the draft'}.`);
        if (!(await gate(interaction, 'quickadd'))) return;
        // The draft's box gives an unlabelled line the New list when the draw is first out in the draft's season, else Returning; the line can still say `new` or `returning`.
        let draftSection = 'r';
        try { const sn = require('../../../utils/quickAdd').seasonNumber(doc?.draft?.currentSeasonTitle); if (sn && e.releaseSeason === sn) draftSection = 'n'; } catch { draftSection = 'r'; }
        return interaction.showModal(require('../../../commands/manage').buildQuickAddModal({ value: e.title, ...(target === 'draft' ? { draftSection } : {}) }));
    }
    return false;
}

const isIndexVerb = (verb) => /^ix/.test(String(verb || ''));

// The card's Set Item Kinds pop-up: one choice per item with no kind, five at most, with the shared question's own kinds (handlers/manage/itemKinds.js KIND_OPTIONS) drawn as radio buttons by utils/formChoice.js.
function kindsModal(e, origin) {
    const { KIND_OPTIONS } = require('../itemKinds');
    const { choiceField } = require('../../../utils/formChoice');
    const missing = (e.items || []).filter(i => !i.kind).slice(0, 5);
    return {
        custom_id: ID('ixkindsm', String(e._id), origin), title: 'Set Item Kinds',
        components: missing.map((it, k) => choiceField({ id: `k${k}`, label: it.name, description: `In ${e.title}`, options: KIND_OPTIONS, required: false })),
    };
}

// Sends a findView answer: { view } on the panel, { note } as a private message (a miss).
async function answerFind(interaction, found, show) {
    if (found.view) return show(interaction, found.view);
    const body = { flags: 64 | 32768, components: found.note, allowed_mentions: { parse: [] } };
    try { return (interaction.deferred || interaction.replied) ? await interaction.followUp(body) : await interaction.reply(body); }
    catch (e) { console.error('draw index: could not answer the find (interaction likely expired):', e.message); }
}

module.exports = { route, runCheck, findView, answerFind, isIndexVerb, homeView, listView, gapView, cardView, editModal, kindsModal, deleteView, searchEntries, placeOf, hasDraft, gapsOf, indexBack, GAPS, EYE_GAPS, PAGE };
