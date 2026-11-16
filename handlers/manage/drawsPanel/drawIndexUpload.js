// handlers/manage/drawsPanel/drawIndexUpload.js -- the owner's side of the Draw Index panel: Upload Draws (read, review, save), Replace Picture, Delete Entry, and Edit Entry's title and items.
//
// Harkirat, 2026-11-16 11:11 EST: "an owner only command where i can upload and check the draws index. adding more draws, editing, etc. I need the process to be seamless and easy for me for it to handle most of the work itself such as tagging, etc." His picks 12:05 EST: `/bot drawindex` opens it (commands/bot.js); news triage only says whether a draw is indexed (utils/newsTriage/indexStatus.js), never using the leak channel's posters; no text command. Spec: Dioreo-Bot local/project/features/owner-draws-index/spec.md.
//
// HOW AN UPLOAD WORKS
//   1. The pop-up takes 1-10 pictures, an optional season and optional names.
//   2. Each picture is read ONCE by Gemini, which only transcribes (utils/drawIndexRead.js); the bot then decides the title, items, tiers, kinds, the entry it matches and the draw type from the index and the gunsmith. The one thing a poster can't show (Reactive vs Non-Reactive) is left for him.
//   3. A review, one draw per screen, keeps the batch in models/DrawIndexUpload.js (a day, like the upload links).
//   4. Save uploads each picture to Cloudinary (utils/drawIndexPicture.js), then commits every entry in ONE set (core/ops/drawIndex.js), so one Revert takes the whole upload back. A replaced picture is not kept (his 2026-10-30 rule), and the review says so.
//
// ⚠️ OWNER ONLY, at every route (utils/adminAccess.js isOwner), not by tier: the buttons are drawn only for the owner, and a click from anyone else (an admin on /manage draws' Draw Index) gets a private refusal and changes nothing.
// Ids: `mng_dr|ixup` / `ixupm` (the pop-up) and `mng_dr|ixv…` (the review), so they reach this module through drawIndex.js's route. Replace Picture (`ixpic`) and Delete Entry (`ixdel`) live in drawIndex.js, owner-checked there.
const emojis = require('../../../utils/emojiMap');
const V = require('./views');
const { row, text, btn, panel, plural, ID } = V;
const BIG = () => ({ type: 14, spacing: 2, divider: true });
const SMALL = () => ({ type: 14, spacing: 1, divider: false });
const MAX_PICTURES = 10;
const TIERS = ['mythic', 'legendary', 'epic'];
const KINDS = ['weapon', 'character', 'vehicle', 'other'];

const isOwner = (id) => require('../../../utils/adminAccess').isOwner(id);
const Upload = () => require('../../../models/DrawIndexUpload');
const R = () => require('../../../utils/drawIndexRead');
const newToken = () => require('crypto').randomBytes(6).toString('base64url');
const typeName = (t) => require('../../../utils/drawTypes').drawTypeName(t) || '';
const loadEntries = () => require('../../../utils/drawCatalog').loadCatalog({ force: true });
const OWNER_ONLY = `${emojis.accessDenied || emojis.cross} Only the bot owner can change the draw index from here.`;

// ---------- items as text (the Edit pop-up) ---------- One item per line: its rarity word, the name exactly as written, and the kind in brackets: "Legendary QQ9 - Moonlight (weapon)". Full rarity words, never a letter: a tier letter is how /manage once saved Legacy as Legendary (docs/claude/2026-11-10-manage-draws-refine-lessons.md).
const cap = (s) => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
function itemsToText(items) {
    return (items || []).map(i => `${cap(i.tier)} ${i.name}${i.kind ? ` (${i.kind})` : ''}`).join('\n');
}
// -> { items, errors }. Names are kept as typed (no title-casing: "HBRa3" and "DL Q33" must survive a round trip).
function parseItemsText(textIn) {
    const items = []; const errors = [];
    for (const raw of String(textIn || '').split('\n').map(s => s.trim()).filter(Boolean)) {
        const m = raw.match(/^(mythic|legendary|epic|m|l|e)\s+(.+?)(?:\s*\((weapon|character|vehicle|other)\))?$/i);
        if (!m) { errors.push(raw.slice(0, 60)); continue; }
        const tier = { m: 'mythic', l: 'legendary', e: 'epic' }[m[1].toLowerCase()] || m[1].toLowerCase();
        const { splitItemName } = require('../../../utils/drawCatalog');
        const split = splitItemName(m[2]);
        items.push({ tier, kind: (m[3] || '').toLowerCase(), name: m[2].trim(), baseName: split.baseName, skinName: split.skinName });
    }
    return { items, errors };
}

// ---------- the pop-ups ----------
function uploadModal({ origin = 'p', card = '', names = '' } = {}) {
    // (label, description, component): the description second, as every call below writes it.
    const label = (lab, description, component) => ({ type: 18, label: lab, ...(description ? { description } : {}), component });
    return {
        custom_id: ID('ixupm', origin, card), title: 'Upload Draws',
        components: [
            label('Pictures', `Up to ${MAX_PICTURES} draw posters or screenshots, one draw each`, { type: 19, custom_id: 'pics', min_values: 1, max_values: MAX_PICTURES, required: true }),
            label('Season', 'Only for draws NEW this season: their release season. Blank leaves it unset.', { type: 4, custom_id: 'season', style: 1, required: false, max_length: 12, placeholder: 'Season 10' }),
            label('Names', 'Optional: titles for posters that print none, one per line, in order. Fix any title on the review.', { type: 4, custom_id: 'names', style: 2, required: false, max_length: 1000, ...(names ? { value: String(names).slice(0, 1000) } : {}), placeholder: 'Herrscher of Thunder Draw' }),
        ],
    };
}
function editModal(p, token, n) {
    // (label, description, component): the description second, as every call below writes it.
    const label = (lab, description, component) => ({ type: 18, label: lab, ...(description ? { description } : {}), component });
    return {
        custom_id: ID('ixvem', token, n), title: `Edit Picture ${n + 1}`,
        components: [
            label('Title', null, { type: 4, custom_id: 'title', style: 1, required: true, max_length: 90, value: String(p.title || '').slice(0, 90) || undefined }),
            // The same words and examples as the card's Edit Entry (handlers/manage/drawsPanel/drawIndex.js editModal), so the two pop-ups read alike.
            label('Items', 'One per line: rarity, name, (kind).', { type: 4, custom_id: 'items', style: 2, required: true, max_length: 2000, value: itemsToText(p.items).slice(0, 2000) || undefined, placeholder: 'Legendary QQ9 - Moonlight (weapon)' }),
            label('Other names', 'One per line: names this draw also ran under. Quick Add and Check Names find it by these.', { type: 4, custom_id: 'aka', style: 2, required: false, max_length: 800, ...(p.aliases?.length ? { value: p.aliases.join('\n') } : {}), placeholder: 'Pop Idol Draw' }),
        ],
    };
}
function replaceModal(id, origin) {
    return {
        custom_id: ID('ixpicm', id, origin), title: 'Replace Picture',
        components: [{ type: 18, label: 'Picture', description: 'The old picture is not kept. Draws using it follow the new one.', component: { type: 19, custom_id: 'pic', min_values: 1, max_values: 1, required: true } }],
    };
}

// ---------- reading ----------
function seasonOf(textIn) {
    const t = String(textIn || '').trim();
    if (!t) return { season: null };
    const m = t.match(/^(?:season\s*|s)?(\d{1,3})$/i);
    return m ? { season: Number(m[1]) } : { error: `"${t.slice(0, 20)}" isn't a season. Type it like "Season 10", or leave it blank.` };
}

// Two pictures of one draw in one upload: the later one is marked as the same draw and skipped unless he switches it on, so one draw never gets two entries or two picture writes. Pure.
function markSameDraws(pictures) {
    const { slugify } = require('../../../utils/cloudinaryCache');
    const keyOf = (p) => (p.matchStatus === 'sure' && p.matchId ? `id:${p.matchId}` : p.title ? `slug:${slugify(p.title)}` : null);
    const seen = new Map();
    pictures.forEach((p, i) => {
        if (p.status !== 'read') return;
        const k = keyOf(p);
        if (!k) return;
        if (seen.has(k)) { p.sameAs = seen.get(k); p.skip = true; } else seen.set(k, i);
    });
    return pictures;
}

async function readAll(files, { names, season, year }) {
    const C = require('../../../utils/drawCatalog');
    const entries = await loadEntries();
    const weaponNames = await C.knownWeaponNames();
    const usages = [];
    const reads = await Promise.all(files.map(async (f) => {
        const base = { url: f.url, filename: String(f.name || '').slice(0, 100) };
        try {
            const { read, usage, location, picture } = await R().readPicture(f.url);
            usages.push({ usage, location });
            return { base, read, picture };
        } catch (err) {
            return { base, error: String(err?.message || err).slice(0, 200) };
        }
    }));
    // The Names box gives titles to the posters that print NONE, in order (the click test, 2026-11-16 13:16 EST: Discord does not hand files back in the order they were picked, and it trims leading blank lines, so "line 7 is picture 7" landed on picture 1). A poster that prints its own title keeps it; a wrong one is fixed with Edit.
    const queue = (names || []).map(n => String(n || '').trim()).filter(Boolean);
    const pictures = reads.map(({ base, read, picture, error }) => {
        if (error) return { ...base, status: 'failed', error };
        const name = !read.title && queue.length ? queue.shift() : '';
        const d = R().decideDraw(read, { entries, weaponNames, name, season, year });
        return { ...toPicture(base, d), barPx: picture?.bar || 0, imgWidth: picture?.width || 0, imgHeight: picture?.height || 0, cropBar: Boolean(picture?.bar) };
    });
    return { pictures: markSameDraws(pictures), costUsd: R().readCost(usages) };
}
function toPicture(base, d) {
    return {
        ...base, status: 'read', error: '',
        title: d.title, items: d.items, comments: d.comments, aliases: [],
        priceType: d.priceType || '', typeSettled: Boolean(d.typeSettled),
        matchStatus: d.match.status, matchId: d.match.id, matchTitle: d.match.title, matchBy: d.match.by,
        readTitle: d.readTitle,
        added: d.added, snapped: d.snapped, flags: d.flags,
        skip: d.flags.includes('notDraw') || d.flags.includes('manyDraws'),
    };
}

// ---------- what a picture still needs before it can be saved ---------- Pure. `doc` (the batch) adds the cross-picture check.
// Two included pictures that land on the same entry or the same new title would write one draw twice in one commit (two adds of one slug fail the whole save), so that blocks until one is skipped (think-pass before the full click test, 2026-11-16 13:11 EST: Include on a skipped duplicate, or a "Same Draw" yes onto an entry another picture updates, reached it).
function targetKey(p) {
    if (p.matchStatus === 'sure' && p.matchId) return `id:${p.matchId}`;
    if (p.matchStatus === 'maybe' && p.sameDraw === true && p.matchId) return `id:${p.matchId}`;
    return p.title ? `slug:${require('../../../utils/cloudinaryCache').slugify(p.title)}` : null;
}
function blockers(p, doc = null) {
    if (p.skip || p.status !== 'read') return [];
    const out = [];
    if (doc) {
        const me = doc.pictures.indexOf(p);
        const key = targetKey(p);
        // The same items on two new pictures are one draw under two titles, so they count too.
        const fp = (x) => (isUpdate(x) ? null : require('../../../utils/cloudinaryCache').drawFingerprint({ items: x.items }));
        const twin = doc.pictures.findIndex((q, j) => j !== me && q.status === 'read' && !q.skip && ((key && targetKey(q) === key) || (fp(p) && fp(q) === fp(p))));
        if (twin !== -1) out.push(`one of it and picture ${twin + 1} skipped (the same draw)`);
    }
    if (!String(p.title || '').trim()) out.push('a title');
    if (!(p.items || []).length) out.push('its items');
    if (p.matchStatus === 'maybe' && p.sameDraw === null) out.push(`an answer to "Same draw as ${p.matchTitle}?"`);
    if (!p.priceType) out.push('a draw type');
    return out;
}
const isUpdate = (p) => p.matchStatus === 'sure' || (p.matchStatus === 'maybe' && p.sameDraw === true);
const included = (doc) => doc.pictures.filter(p => p.status === 'read' && !p.skip);

// ---------- the review ----------
function reviewView(doc, n = 0, note = null) {
    const pics = doc.pictures;
    const total = pics.length;
    const i = Math.min(Math.max(Number(n) || 0, 0), total - 1);
    const p = pics[i];
    const t = doc._id;
    const crumb = `-# Draws  ›  Draw Index  ›  Upload  ›  Picture ${i + 1} of ${total}`;
    const components = [text(crumb)];
    if (note) components.push(text(note), SMALL());
    if (p.status === 'failed') {
        components.push(text(`### ${emojis.cross} Picture ${i + 1} couldn't be read\n-# ${p.filename || 'upload'} · ${p.error || 'unknown error'}`));
        // A file that is not a picture has nothing to show (the click test: Discord drew "Image failed to load").
        // Nor anything to read again: Read Again is only offered where a second read could succeed.
        const notPicture = /not a picture/i.test(p.error || '');
        if (!notPicture) components.push({ type: 12, items: [{ media: { url: p.url } }] });
        components.push(row(...(notPicture ? [] : [btn(['ixvretry', t, i], 'Read Again', emojis.search, 1)]), btn(['ixvskip', t, i], p.skip ? 'Include' : 'Skip', p.skip ? emojis.plus : emojis.diffMinus)));
    } else if (p.status === 'saved') {
        components.push(text(`### ${emojis.checkmark} Saved: ${p.savedTitle || p.title}`));
        components.push({ type: 12, items: [{ media: { url: p.url } }] });
    } else {
        components.push({ type: 12, items: [{ media: { url: p.url } }] });
        const what = p.skip
            ? `Skipped${skipReason(p) ? `: ${skipReason(p)}` : ''}`
            : isUpdate(p) ? `Updates **${p.matchTitle}**${p.added ? ` · +${plural(p.added, 'item')}` : ''}${p.keepOldPicture ? ' · keeps its picture' : ' · replaces its picture (the old one is not kept)'}`
                : p.matchStatus === 'maybe' && p.sameDraw === null ? `${emojis.warn} Maybe the same draw as **${p.matchTitle}**`
                    : 'New entry';
        const itemsTxt = (p.items || []).map(it => `${emojis[it.tier] || ''} ${String(it.name).slice(0, 70)}${it.kind ? ` · ${it.kind}` : ` · ${emojis.warn} no kind`}${it.guessed ? ` · ${emojis.warn} rarity guessed` : ''}${it.newToIndex ? ' · new to the index' : ''}`.trim());
        const season = doc.season && !isUpdate(p) ? `Season ${doc.season}${doc.year ? ` (${doc.year})` : ''}` : null;
        components.push(text([
            `### ${String(p.title || 'No title').slice(0, 100)}`,
            `-# ${what}`,
            ...(p.aliases?.length ? [`-# Also: ${p.aliases.slice(0, 6).join(' · ').slice(0, 300)}`] : []),
            itemsTxt.length ? itemsTxt.join('\n') : `-# ${emojis.warn} No items read.`,
            ...(p.comments?.length ? [p.comments.map(c => `-# ${String(c).slice(0, 150)}`).join('\n')] : []),
            ...((() => { const t = [p.priceType ? typeName(p.priceType) : (p.skip ? null : `${emojis.warn} Pick its draw type`), season].filter(Boolean).join(' · '); return t ? [`-# ${t}`] : []; })()),
            ...(p.snapped?.length ? [`-# Names matched to the index: ${p.snapped.join(', ').slice(0, 200)}`] : []),
            ...(p.barPx && !p.keepOldPicture && !p.skip ? [`-# ${p.cropBar ? `${emojis.checkmark} The logo bar at the bottom (${p.barPx}px) is cropped off on save` : 'The logo bar at the bottom is kept'}`] : []),
            // Which file this is, so a batch can be matched to what was picked (Discord reorders them).
            ...(p.filename ? [`-# ${String(p.filename).slice(0, 80)}`] : []),
        ].join('\n').slice(0, 3800)));
        if (!p.skip) {
            const { DRAW_TYPES } = require('../../../utils/drawTypes');
            components.push({ type: 1, components: [{ type: 3, custom_id: ID('ixvtype', t, i), placeholder: p.priceType ? `Draw type: ${typeName(p.priceType)}` : 'Pick the draw type…', options: DRAW_TYPES.map(dt => ({ value: dt.key, label: dt.name.slice(0, 100), default: dt.key === p.priceType })) }] });
        }
        if (p.matchStatus === 'maybe' && !p.skip) components.push(row(btn(['ixvsame', t, i, 'y'], `Same Draw as ${String(p.matchTitle).slice(0, 50)}`, emojis.checkmark, p.sameDraw === true ? 3 : 2), btn(['ixvsame', t, i, 'n'], 'A Different Draw', emojis.plus, p.sameDraw === false ? 1 : 2)));
        components.push(row(
            btn(['ixvedit', t, i], 'Edit', emojis.edit),
            ...(isUpdate(p) && !p.skip ? [btn(['ixvkeep', t, i], p.keepOldPicture ? 'Use This Picture' : 'Keep Old Picture', emojis.keep)] : []),
            ...(p.barPx && !p.skip && !p.keepOldPicture ? [btn(['ixvbar', t, i], p.cropBar ? 'Keep Bottom Bar' : 'Crop Bottom Bar', p.cropBar ? emojis.expand : emojis.collapse)] : []),
            btn(['ixvskip', t, i], p.skip ? 'Include' : 'Skip', p.skip ? emojis.plus : emojis.diffMinus),
        ));
    }
    if (total > 1) components.push(row(
        { type: 2, style: 2, custom_id: ID('ixvv', t, i - 1), emoji: emojis.parseEmoji(emojis.left), disabled: i === 0 },
        { type: 2, style: 2, custom_id: ID('ixvpg', t), label: `${i + 1} / ${total}`, disabled: true },
        { type: 2, style: 2, custom_id: ID('ixvv', t, i + 1), emoji: emojis.parseEmoji(emojis.right), disabled: i === total - 1 },
    ));
    components.push(BIG(), text(saveLine(doc)));
    const ready = included(doc).filter(x => !blockers(x, doc).length);
    const anyBlocked = included(doc).some(x => blockers(x, doc).length);
    components.push(row(
        btn(['ixvcancel', t], 'Cancel', emojis.returnArrow),
        // A button that can't act yet is not drawn as a disabled green one (2026-11-11 round-2 rule); the line above says what is missing.
        btn(['ixvsave', t], ready.length && !anyBlocked ? `Save ${ready.length}` : 'Save', emojis.checkmark, ready.length && !anyBlocked ? 3 : 2, !ready.length || anyBlocked),
    ));
    return panel(components);
}
function saveLine(doc) {
    const inc = included(doc);
    const fresh = inc.filter(p => !isUpdate(p)).length;
    const upd = inc.length - fresh;
    const skipped = doc.pictures.filter(p => p.status === 'read' && p.skip).length;
    const failed = doc.pictures.filter(p => p.status === 'failed').length;
    const parts = [inc.length ? `${plural(inc.length, 'draw')} to save (${fresh} new, ${upd} updated)` : 'Nothing to save yet', skipped ? `${skipped} skipped` : null, failed ? `${emojis.warn} ${failed} not read` : null, doc.costUsd ? `read for $${doc.costUsd.toFixed(3)}` : null].filter(Boolean);
    const blocked = doc.pictures.map((p, i) => ({ i, b: blockers(p, doc) })).filter(x => x.b.length);
    return `-# ${parts.join(' · ')}${blocked.length ? `\n-# ${emojis.warn} Before saving: ${blocked.map(x => `picture ${x.i + 1} needs ${x.b.join(' and ')}`).join('; ').slice(0, 600)}` : ''}`;
}

// ---------- saving ----------
// The staged or live draws of an entry whose picture should follow a new one: those whose picture is a placeholder, empty, or the entry's old link. Pure over the SeasonalData doc.
function rowsToRepoint(seasonDoc, entry, newUrl) {
    const { isSameDrawTitle } = require('../../../utils/search');
    const { isPlaceholder } = require('../../../utils/placeholders');
    const names = [entry.title, ...(entry.aliases || [])];
    const out = [];
    const lists = { newDraws: seasonDoc?.newDraws, returningDraws: seasonDoc?.returningDraws, 'draft.newDraws': seasonDoc?.draft?.newDraws, 'draft.returningDraws': seasonDoc?.draft?.returningDraws };
    for (const [path, list] of Object.entries(lists)) {
        for (const d of list || []) {
            if (!names.some(nm => isSameDrawTitle(d.title, nm))) continue;
            const cur = d.thumbnailUrl || '';
            if (cur === newUrl) continue;
            if (!cur || isPlaceholder(cur) || cur === entry.imageUrl) out.push({ path, id: String(d._id), from: d.thumbnailUrl ?? null, to: newUrl });
        }
    }
    return out;
}

const cropOf = (p) => (p.cropBar && p.barPx ? { width: p.imgWidth, height: p.imgHeight, bar: p.barPx } : null);

// One picture -> its op (or { error }). Uploads the picture first unless it keeps the old one. Never throws.
async function planPicture(p, doc, entries, seasonDoc) {
    const { slugify } = require('../../../utils/cloudinaryCache');
    const { unionItems } = R();
    const { uploadPicture } = require('../../../utils/drawIndexPicture');
    if (isUpdate(p)) {
        const entry = entries.find(e => String(e._id) === String(p.matchId));
        if (!entry) return { error: 'that entry is no longer in the draw index' };
        const { items, added } = unionItems(entry.items, p.items);
        const set = {};
        if (added.length) set.items = items;
        const C = require('../../../utils/drawCatalog');
        if (p.priceType && p.priceType !== entry.priceType && (!C.isKnownType(entry.priceType) || p.typeChanged)) set.priceType = p.priceType;
        if (doc.season && !entry.releaseSeason) { set.releaseSeason = doc.season; set.releaseYear = doc.year || new Date().getUTCFullYear(); }
        // A poster that names the draw differently ("Pop Idol Draw" for Starry Symphony) adds that name as another name, so a lookup by it lands here next time.
        const otherNames = [...new Set([...(entry.aliases || []), ...(p.aliases || []), ...(p.readTitle && slugify(p.readTitle) !== entry.slug ? [p.readTitle] : [])])];
        if (otherNames.length !== (entry.aliases || []).length) set.aliases = otherNames;
        const comments = [...new Set([...(entry.comments || []), ...(p.comments || [])])];
        if (comments.length !== (entry.comments || []).length) set.comments = comments;
        let rows = [];
        if (!p.keepOldPicture) {
            const merged = { ...entry, ...set, items: set.items || entry.items };
            const up = await uploadPicture({ slug: entry.slug, sourceUrl: p.url, doc: merged, previousTags: entry.tags || [], crop: cropOf(p) });
            if (!up.ok) return { error: `the picture didn't upload (${up.error})` };
            set.imageUrl = up.url; set.publicId = up.publicId;
            rows = rowsToRepoint(seasonDoc, entry, up.url);
        }
        if (!Object.keys(set).length && !rows.length) return { skip: 'nothing new for this entry' };
        return { op: { type: 'drawindex.update', target: { id: String(entry._id) }, payload: { set, rows } }, title: entry.title };
    }
    const slug = slugify(p.title);
    if (entries.some(e => e.slug === slug)) return { error: `the index already has an entry named "${p.title}"; answer Same Draw on it or rename this one` };
    const base = { title: p.title, items: p.items, priceType: p.priceType, comments: p.comments || [], tags: [], ...(doc.season ? { releaseSeason: doc.season, releaseYear: doc.year || new Date().getUTCFullYear() } : {}) };
    const up = await uploadPicture({ slug, sourceUrl: p.url, doc: base, inserted: true, crop: cropOf(p) });
    if (!up.ok) return { error: `the picture didn't upload (${up.error})` };
    return {
        op: { type: 'drawindex.add', payload: { slug, title: p.title, publicId: up.publicId, imageUrl: up.url, items: p.items.map(({ tier, kind, name, baseName, skinName }) => ({ tier, kind, name, baseName, skinName })), comments: p.comments || [], aliases: p.aliases || [], priceType: p.priceType, ...(doc.season ? { releaseSeason: doc.season, releaseYear: doc.year || undefined } : {}) } },
        title: p.title,
    };
}

async function saveUpload(doc, actorId) {
    const entries = await loadEntries();
    const seasonDoc = await require('../../../models/SeasonalData').findOne({ docType: 'global' }).lean();
    const plans = [];
    for (const [i, p] of doc.pictures.entries()) {
        if (p.status !== 'read' || p.skip) continue;
        plans.push({ i, ...(await planPicture(p, doc, entries, seasonDoc)) });
    }
    const ops = plans.filter(x => x.op);
    let result = { ok: true, changeIds: [] };
    if (ops.length) result = await require('../../../core/changeset').commitSet(ops.map(x => x.op), { actorId });
    return { plans, ops, result };
}

// ---------- the panel's routes ----------
// Upload Draws (`ixup`, `ixupm`) and its review (`ixv…`). The card's Replace Picture and Delete Entry stay in drawIndex.js.
const isUploadVerb = (verb) => /^ix(up|v)/.test(String(verb || ''));

async function route(interaction, verb, a, b, c, ctx) {
    const { show, say } = ctx;
    if (!isOwner(interaction.user.id)) return say(interaction, OWNER_ONLY);
    const load = async (token) => (token ? Upload().findById(token).lean() : null);
    const expired = () => say(interaction, `${emojis.cross} That upload expired (uploads last a day). Upload the pictures again.`);
    const save = (token, fields) => Upload().updateOne({ _id: token }, { $set: fields });

    if (verb === 'ixup') return interaction.showModal(uploadModal({ origin: 'p' }));
    if (verb === 'ixupm' && interaction.isModalSubmit?.()) {
        let files = [];
        try { files = [...(interaction.fields.getUploadedFiles('pics')?.values() || [])]; } catch { files = []; }
        const get = (id) => { try { return interaction.fields.getTextInputValue(id) || ''; } catch { return ''; } };
        const s = seasonOf(get('season'));
        if (s.error) return say(interaction, `${emojis.cross} ${s.error} Nothing was read.`);
        if (!files.length) return say(interaction, `${emojis.cross} No pictures came through. Upload at least one.`);
        // From the panel the answer replaces the panel; from a news card it is a new private message, never the card itself. From `/bot drawindex do:Upload Draws` there is no panel: 'P' (visibility Public) answers publicly, 'p' privately.
        if (a === 'P' && !interaction.message) await interaction.deferReply({ flags: 0 });
        else if (a === 'n' || !interaction.message) await interaction.deferReply({ flags: 64 });
        else await interaction.deferUpdate();
        const { sendV2Payload } = require('../../../utils/sendV2Payload');
        await sendV2Payload(interaction, panel([text(`-# Draws  ›  Draw Index  ›  Upload\n### ${emojis.search} Reading ${plural(files.length, 'picture')}…\n-# One read each. The index decides the rest.`)]), { skipExpiry: true });
        const seasonDoc = await require('../../../models/SeasonalData').findOne({ docType: 'global' }).lean();
        const year = R().seasonYearFor(s.season, seasonDoc);
        const names = get('names').split('\n').map(x => x.trim());
        const { pictures, costUsd } = await readAll(files.slice(0, MAX_PICTURES), { names, season: s.season, year });
        const token = newToken();
        await Upload().create({ _id: token, season: s.season, year, origin: a === 'n' ? 'news' : 'panel', newsCard: a === 'n' ? String(b || '') : '', pictures, costUsd });
        return sendV2Payload(interaction, reviewView(await load(token), 0), { skipExpiry: true });
    }

    const doc = await load(a);
    if (/^ixv/.test(verb) && !doc) return expired();
    const n = Number(b) || 0;
    const p = doc?.pictures?.[n];
    const redraw = async (note = null, at = n) => show(interaction, reviewView(await load(a), at, note));

    if (verb === 'ixvv') return redraw(null, n);
    if (verb === 'ixvtype') {
        if (!p) return expired();
        const picked = interaction.values?.[0];
        if (!require('../../../utils/drawTypes').DRAW_TYPES.some(t => t.key === picked)) return say(interaction, `${emojis.cross} That isn't a draw type.`);
        await save(a, { [`pictures.${n}.priceType`]: picked, [`pictures.${n}.typeSettled`]: true, [`pictures.${n}.typeChanged`]: true });
        return redraw();
    }
    if (verb === 'ixvskip') { await save(a, { [`pictures.${n}.skip`]: !p?.skip }); return redraw(); }
    if (verb === 'ixvkeep') { await save(a, { [`pictures.${n}.keepOldPicture`]: !p?.keepOldPicture }); return redraw(); }
    if (verb === 'ixvbar') { await save(a, { [`pictures.${n}.cropBar`]: !p?.cropBar }); return redraw(); }
    if (verb === 'ixvsame') {
        // A yes makes this an update of that entry, so its own draw type comes with it, as for a sure match (the click test, 2026-11-16 13:17 EST: a yes still asked for the type).
        const fields = { [`pictures.${n}.sameDraw`]: c === 'y' };
        if (c === 'y' && p?.matchId) {
            const entry = (await loadEntries()).find(e => String(e._id) === String(p.matchId));
            if (entry && require('../../../utils/drawCatalog').isKnownType(entry.priceType) && !p.typeChanged) Object.assign(fields, { [`pictures.${n}.priceType`]: entry.priceType, [`pictures.${n}.typeSettled`]: true });
        }
        await save(a, fields); return redraw();
    }
    if (verb === 'ixvedit') return p ? interaction.showModal(editModal(p, a, n)) : expired();
    if (verb === 'ixvem' && interaction.isModalSubmit?.()) {
        if (!p) return expired();
        const get = (id) => { try { return interaction.fields.getTextInputValue(id) || ''; } catch { return ''; } };
        const title = require('../../../utils/adminParser').toTitleCase(get('title').trim().slice(0, 90));
        const parsed = parseItemsText(get('items'));
        if (parsed.errors.length) return say(interaction, `${emojis.cross} These lines need a rarity word first (Mythic, Legendary or Epic): ${parsed.errors.slice(0, 3).map(x => `\`${x}\``).join(', ')}. Nothing was changed.`);
        if (!title || !parsed.items.length) return say(interaction, `${emojis.cross} A draw needs a title and at least one item. Nothing was changed.`);
        const aliases = get('aka').split('\n').map(x => x.trim()).filter(Boolean);
        // A new title re-runs the match, so a renamed draw can find (or leave) its entry.
        const entries = await loadEntries();
        const m = R().matchEntry(entries, title, parsed.items);
        // A new title that lands on an entry takes that entry's draw type, unless he picked one himself.
        const typeFields = m.status === 'sure' && require('../../../utils/drawCatalog').isKnownType(m.entry.priceType) && !p.typeChanged ? { [`pictures.${n}.priceType`]: m.entry.priceType, [`pictures.${n}.typeSettled`]: true } : {};
        await save(a, {
            ...typeFields,
            [`pictures.${n}.title`]: title, [`pictures.${n}.readTitle`]: title, [`pictures.${n}.items`]: parsed.items.map(i => ({ ...i, guessed: false, newToIndex: false })), [`pictures.${n}.aliases`]: aliases,
            [`pictures.${n}.matchStatus`]: m.status, [`pictures.${n}.matchId`]: m.entry ? String(m.entry._id) : null, [`pictures.${n}.matchTitle`]: m.entry?.title || null, [`pictures.${n}.sameDraw`]: null,
        });
        return redraw(`${emojis.checkmark} Picture ${n + 1} edited.`);
    }
    if (verb === 'ixvretry') {
        if (!p) return expired();
        await interaction.deferUpdate();
        const { pictures, costUsd } = await readAll([{ url: p.url, name: p.filename }], { names: [p.title || ''], season: doc.season, year: doc.year });
        await save(a, { [`pictures.${n}`]: pictures[0], costUsd: (doc.costUsd || 0) + costUsd });
        return redraw(pictures[0].status === 'failed' ? `${emojis.cross} Still couldn't read it: ${pictures[0].error}` : null);
    }
    if (verb === 'ixvcancel') {
        await Upload().deleteOne({ _id: a });
        const IX = require('./drawIndex');
        return show(interaction, IX.homeView(await loadEntries(), await ctx.getDoc(), `${emojis.info} Upload cancelled. Nothing was saved.`, { owner: true }));
    }
    if (verb === 'ixvsave') {
        const blockedAt = doc.pictures.findIndex(x => blockers(x, doc).length);
        if (blockedAt !== -1) return redraw(`${emojis.warn} Picture ${blockedAt + 1} still needs ${blockers(doc.pictures[blockedAt], doc).join(' and ')}.`, blockedAt);
        await interaction.deferUpdate();
        const { sendV2Payload } = require('../../../utils/sendV2Payload');
        await sendV2Payload(interaction, panel([text(`-# Draws  ›  Draw Index  ›  Upload\n### ${emojis.plus} Saving ${plural(included(doc).length, 'draw')}…\n-# Uploading the pictures, then the index.`)]), { skipExpiry: true });
        const { plans, ops, result } = await saveUpload(doc, interaction.user.id);
        // Opened from a news card: its index lines are worked out again, so it stops saying "not in the draw index".
        if (result.ok && ops.length && doc.newsCard) require('../../../utils/newsTriage/indexStatus').refreshIndexStatus(doc.newsCard, { rest: interaction.client.rest, appId: interaction.applicationId }).catch(() => {});
        return show(interaction, resultView(doc, plans, ops, result));
    }
    if (verb === 'ixvrev') {
        return require('../results').revertChanges(interaction, doc.savedChangeIds || [], {
            doneNote: 'the draw index is back as it was (pictures that were replaced stay replaced)',
            render: async (note) => {
                // An upload started from a news card put that card's lines right when it saved; a Revert must put them back the other way, or the card keeps saying the draw is indexed.
                if (doc.newsCard) await require('../../../utils/newsTriage/indexStatus').refreshIndexStatus(doc.newsCard, { rest: interaction.client.rest, appId: interaction.applicationId });
                return require('./drawIndex').homeView(await loadEntries(), await ctx.getDoc(), note, { owner: true });
            },
        });
    }
    return false;
}

// Why a picture was skipped, shared by its review page and the result screen.
function skipReason(p) {
    if (p.sameAs !== null && p.sameAs !== undefined) return `the same draw as picture ${p.sameAs + 1}`;
    if (p.flags?.includes('notDraw')) return "this doesn't look like a draw";
    if (p.flags?.includes('manyDraws')) return 'this picture shows more than one draw. Upload one draw per picture';
    return '';
}

function resultView(doc, plans, ops, result) {
    // Every picture that did not become a save is named after the list: failed uploads and "nothing new" from the plans, and the pictures the plans never saw (a read that failed, a skip on the review). The click test, 2026-11-16 14:54 EST: the plans alone held only the included pictures, so a batch of seven reported "Saved 3" and said nothing about the other four.
    const failed = [...plans.filter(x => x.error), ...(doc.pictures || []).map((p, i) => ({ i, p })).filter(({ p }) => p.status === 'failed' && !p.skip).map(({ i, p }) => ({ i, error: `couldn't be read (${p.error || 'unknown error'})` }))].sort((x, y) => x.i - y.i);
    const skipped = [...plans.filter(x => x.skip), ...(doc.pictures || []).map((p, i) => ({ i, p })).filter(({ p }) => p.skip).map(({ i, p }) => ({ i, skip: `skipped${skipReason(p) ? `, ${skipReason(p)}` : ''}` }))].sort((x, y) => x.i - y.i);
    const lines = [];
    if (!result.ok) lines.push(`### ${emojis.cross} Nothing was saved\n-# ${require('../shared').extractCommitError(result)}${ops.length ? '\n-# The pictures were already uploaded; a replaced picture stays replaced.' : ''}`);
    else {
        const added = ops.filter(x => x.op.type === 'drawindex.add').length;
        lines.push(`### ${emojis.checkmark} Saved ${plural(ops.length, 'draw')}${ops.length ? ` · ${added} new, ${ops.length - added} updated` : ''}`);
    }
    const after = [];
    if (failed.length) after.push(`${emojis.warn} Not saved:\n${failed.map(x => `-# Picture ${x.i + 1}: ${x.error}`).join('\n')}`);
    if (skipped.length) after.push(skipped.map(x => `-# Picture ${x.i + 1}: ${x.skip}`).join('\n'));
    const changeIds = result.changeIds || [];
    // The batch stays a day so Revert can find its changes; the change ids ride on it, not in the custom_id (ten of them would pass 100 characters).
    require('../../../models/DrawIndexUpload').updateOne({ _id: doc._id }, { $set: { savedChangeIds: changeIds } }).catch(() => {});
    const IX = require('./drawIndex');
    // Each saved draw with Open, which lands on its entry card (the click test, 2026-11-16 13:02 EST: the result named the draws with no way to look at them). The entry id is the add's applied id or the update's target; ten pictures at most is ten sections.
    const ids = result.ok ? ops.map((x, k) => x.op.target?.id || result.results?.[k]?.applied?.id || null) : [];
    const savedRows = result.ok ? ops.map((x, k) => ({ type: 9, components: [text(`${x.op.type === 'drawindex.add' ? emojis.plus : emojis.edit} ${String(x.title).slice(0, 80)}${x.op.payload?.rows?.length ? `\n-# ${plural(x.op.payload.rows.length, 'draw')} now ${x.op.payload.rows.length === 1 ? 'uses' : 'use'} the new picture` : ''}`)], accessory: ids[k] ? btn(['ixopen', ids[k], ''], 'Open', emojis.expand) : { type: 2, style: 2, label: 'Open', custom_id: ID('ixvpg', doc._id, k), disabled: true } })) : [];
    return panel([
        text(`-# Draws  ›  Draw Index  ›  Upload\n${lines.join('\n').slice(0, 3800)}`),
        ...savedRows,
        ...(after.length ? [text(after.join('\n').slice(0, 1500))] : []),
        BIG(),
        row(IX.indexBack(), btn('ixup', 'Upload More', emojis.plus, 1), ...(changeIds.length ? [{ type: 2, style: 4, label: 'Revert', custom_id: ID('ixvrev', doc._id), emoji: emojis.parseEmoji(emojis.keep) }] : [])),
    ]);
}

// `__test`: the read and the save, for the dev probe (local/project/features/owner-draws-index/probes/e2e.js) and nothing else.
module.exports = { __test: { readAll, saveUpload }, route, isUploadVerb, uploadModal, editModal, replaceModal, reviewView, resultView, blockers, markSameDraws, rowsToRepoint, parseItemsText, itemsToText, seasonOf, toPicture, planPicture, isUpdate, OWNER_ONLY, MAX_PICTURES, TIERS, KINDS };
