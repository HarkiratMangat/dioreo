// utils/drawIndexRead.js -- reads a draw poster for the owner's Upload Draws (/bot drawindex, handlers/manage/drawsPanel/drawIndexUpload.js), and decides what it is from the draw index rather than from the model.
//
// Harkirat, 2026-11-16 11:11 EST: "an owner only command where i can upload and check the draws index ... handle most of the work itself such as tagging". And at 12:00 EST: "when we tested original, gemini was pretty in consistent with how it classified and read them, until it did the web searches (which cost a lot)... so what's the 'better' solution". Measured on the 2026-10-31 runs (98 posters, local/project/features/draw-image-index/summary-*.txt): reads flipped on a character's rarity where the poster draws no frame (8 posters), on the draw type (most of 62 "Unsure"), on near-miss weapon names (MG42/MG82, Groza/Grav) and on titles the poster doesn't print (the Herrscher draws); the web-checked pass cost ~9 searches and twice the tokens per picture, with no source links to check.
//
// So the model only TRANSCRIBES (one low-thinking call, no search): the printed title, the printed item names, a tier only where a frame or badge shows, printed condition lines, a few printed words that name the draw's kind, and two flags. Everything else is decided here, in code, from data Harkirat already confirmed: the index's own items (their tier and kind), the gunsmith's weapon names, and fixed rules for the draw type. The one thing a poster can't show (Reactive or Non-Reactive) is left for him to pick. decideDraw and everything under it are PURE (scripts/drawIndexRead.test.js).
const TIERS = ['mythic', 'legendary', 'epic'];
const KINDS = ['weapon', 'character', 'vehicle', 'other'];
const RANK = { mythic: 3, legendary: 2, epic: 1 };
const MAX_ITEMS = 12;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const IMAGE_TIMEOUT_MS = 30 * 1000;

const PROMPT = `This picture should be a Call of Duty Mobile lucky draw poster or screenshot (a Draw, Mythic Drop, Series Armory or "It Goes Two" draw). Copy what is PRINTED on it. Do not guess anything that is not visible, and do not use outside knowledge.
- title: the draw's title as printed, in Title Case, or "" when the picture prints no title (a slogan or tagline is not a title).
- items: every Mythic, Legendary and Epic reward whose name is printed, highest rarity first, as "WEAPON - Skin Name" or "Character - Skin Name" when both are printed, spelled as printed but in Title Case (keep weapon model names the way the game writes them: AK117, M4, Krig 6, Type 25, DL Q33, MG82). tier: "mythic" (red frame or badge), "legendary" (orange or gold), "epic" (purple), or "none" when the picture shows no frame or badge for that reward. kind: "weapon", "character" (an operator), "vehicle", or "other" (an emote, a charm), from what the reward is.
- comments: only a CONDITION line the picture prints about getting the rewards ("Acquire Both ... to Unlock ..."), else []. A slogan or tagline ("Lady Boss Is Here", "Get not one, but two legendary weapons") is not a comment.
- printed: true for each of these words the picture prints: seriesArmory ("Series Armory" or "Armory"), itGoesTwo ("It Goes Two" or "Advanced"), sevenSpins ("7 Spins"), pickYourReward ("Pick Your Reward"), mythicDrop ("Mythic Drop").
- draws: how many different draws the picture shows (1 for a normal poster; more for a calendar or a collage).
- notDraw: true when the picture is not a lucky draw at all.`;

const B = { type: 'BOOLEAN' };
const SCHEMA = {
    type: 'OBJECT',
    properties: {
        title: { type: 'STRING' },
        items: { type: 'ARRAY', items: { type: 'OBJECT', properties: { name: { type: 'STRING' }, tier: { type: 'STRING', enum: [...TIERS, 'none'] }, kind: { type: 'STRING', enum: KINDS } }, required: ['name', 'tier'] } },
        comments: { type: 'ARRAY', items: { type: 'STRING' } },
        printed: { type: 'OBJECT', properties: { seriesArmory: B, itGoesTwo: B, sevenSpins: B, pickYourReward: B, mythicDrop: B } },
        draws: { type: 'INTEGER' },
        notDraw: B,
    },
    required: ['title', 'items', 'comments', 'printed', 'draws', 'notDraw'],
};

const norm = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
// A name read off a poster travels into the index, /draws and Cloudinary context, so markup and mentions are taken out, as news triage does for its names.
const clean = (s, max = 100) => String(s || '').replace(/<[@#][!&]?\d*>|<a?:\w+:\d+>|@(everyone|here)/gi, '').replace(/[`*_~|>]/g, '').replace(/https?:\/\/\S+/gi, '').replace(/\s+/g, ' ').trim().slice(0, max);

// The model's answer, checked field by field: a schema shapes an answer, it does not make it true.
function shapeRead(parsed) {
    const p = parsed && typeof parsed === 'object' ? parsed : {};
    const printed = p.printed && typeof p.printed === 'object' ? p.printed : {};
    const seen = new Set();
    const items = [];
    for (const it of Array.isArray(p.items) ? p.items : []) {
        const name = clean(it?.name);
        if (!name || seen.has(norm(name))) continue;
        seen.add(norm(name));
        items.push({ name, tier: TIERS.includes(it?.tier) ? it.tier : '', kind: KINDS.includes(it?.kind) ? it.kind : '' });
        if (items.length >= MAX_ITEMS) break;
    }
    return {
        title: clean(p.title, 90),
        items,
        // A condition line names a way to get something; a slogan does not (the dev probe, 2026-11-16 12:59 EST: Lethal Pair's "Get not one, but two legendary weapons in one draw!" came back as a comment despite the prompt). Only lines with a condition word are kept.
        comments: (Array.isArray(p.comments) ? p.comments : []).map(c => clean(c, 150)).filter(c => c && /\b(acquire|unlock|obtain|collect|guarantee[ds]?|both|all \d|aka|exclusive|bonus|free)\b/i.test(c)).slice(0, 3),
        printed: Object.fromEntries(['seriesArmory', 'itGoesTwo', 'sevenSpins', 'pickYourReward', 'mythicDrop'].map(k => [k, printed[k] === true])),
        draws: Number.isInteger(p.draws) && p.draws > 0 ? p.draws : 1,
        notDraw: p.notDraw === true,
    };
}

// ---------- names ----------
function editDistance(a, b) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 1) return 2;
    const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let diag = prev[0]; prev[0] = i;
        for (let j = 1; j <= b.length; j++) { const t = prev[j]; prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1)); diag = t; }
    }
    return prev[b.length];
}

// What the index and the gunsmith already know: every indexed item by its normalised name, and every weapon base by its normalised name.
function knownNames(entries, weaponDisplay = new Map()) {
    const items = new Map();
    const bases = new Map(weaponDisplay);
    const { splitItemName } = require('./drawCatalog');
    for (const e of entries || []) for (const i of e.items || []) {
        if (!items.has(norm(i.name))) items.set(norm(i.name), i);
        const base = i.baseName || splitItemName(i.name).baseName;
        if (i.kind === 'weapon' && base && !bases.has(norm(base))) bases.set(norm(base), base);
    }
    return { items, bases };
}

// A read name -> the spelling the index or the gunsmith uses. An indexed item with the same letters takes the index's spelling; otherwise a weapon base one letter off ONE known base (MG42 -> MG82) is snapped, and only then. Returns { name, snapped }.
function snapName(name, known) {
    const had = known.items.get(norm(name));
    if (had) return { name: had.name, snapped: had.name !== name };
    const { splitItemName } = require('./drawCatalog');
    const { baseName, skinName } = splitItemName(name);
    const b = norm(baseName);
    if (!b || known.bases.has(b) || b.length < 3) return { name, snapped: false };
    const close = [...known.bases.entries()].filter(([k]) => editDistance(k, b) === 1);
    if (close.length !== 1) return { name, snapped: false };
    const fixed = skinName ? `${close[0][1]} - ${skinName}` : close[0][1];
    const again = known.items.get(norm(fixed));
    return { name: again ? again.name : fixed, snapped: true };
}

// ---------- the draw type ---------- By rule from the items' tiers and kinds and the words the poster prints. `settled: false` means only Harkirat can say (one legendary weapon: Reactive or Non-Reactive, which no poster shows; the 2026-10-31 runs' 42 guesses were each confirmed or corrected by him).
function typeByRule(items, printed = {}) {
    const real = (items || []).filter(i => TIERS.includes(i.tier));
    const count = (tier, kind) => real.filter(i => i.tier === tier && i.kind === kind).length;
    const mW = count('mythic', 'weapon'), mC = count('mythic', 'character'), lW = count('legendary', 'weapon'), lC = count('legendary', 'character'), eC = count('epic', 'character');
    const r = (type) => ({ type, settled: true });
    if (printed.sevenSpins) return r('sevenSpinLegendaryWeapon');
    if (printed.pickYourReward) return r('pickYourRewardCard');
    if (printed.seriesArmory) {
        if (mW) return r('armoryMythicWeapon');
        if (lC && !lW) return r('armoryLegendaryCharacter');
        if (lW) return r('armoryLegendaryWeapon');
        return { type: '', settled: false };
    }
    if (mC) return r('mythicCharacter');
    if (mW) return r('mythicWeapon');
    if (printed.itGoesTwo) {
        if (lC >= 2 && !lW) return r('advancedCharacter');
        if (lW >= 2) return r('advancedWeapon');
        return { type: '', settled: false };
    }
    if (lC && lW) return r('legendaryCharacterWeapon');
    if (lW >= 2) return r('doubleLegendaryWeapons');
    if (!lW && !lC && eC >= 2) return r('doubleEpicCharacters');
    return { type: '', settled: false };
}

// ---------- the match ---------- sure: the title or another name, or the same items at the same rarities. maybe: the title's words (Quick Add's matcher), or every read item inside one entry. none: a new entry.
function matchEntry(entries, title, items) {
    const C = require('./drawCatalog');
    const named = title ? C.matchByName(entries, title) : null;
    if (named) return { status: 'sure', entry: named.entry, by: named.matchedBy };
    const byItems = items.length ? C.matchByItems(entries, { items }) : null;
    if (byItems) return { status: 'sure', entry: byItems.entry, by: 'items' };
    if (title) {
        const w = require('./quickAdd').findCatalogDraw(entries, title);
        if (w?.entry && w.sure) return { status: 'maybe', entry: w.entry, by: 'words' };
    }
    const names = items.map(i => norm(i.name)).filter(Boolean);
    if (names.length >= 2) {
        const hit = (entries || []).find(e => { const have = new Set((e.items || []).map(i => norm(i.name))); return names.every(n => have.has(n)); });
        if (hit) return { status: 'maybe', entry: hit, by: 'items' };
    }
    return { status: 'none', entry: null, by: null };
}

// An update only ADDS: the entry's items stay as they are (their tier and kind were confirmed), and an item it lacks is appended. A poster often shows the headline items only, so a shorter read must never drop any.
function unionItems(existing, incoming) {
    const have = new Set((existing || []).map(i => norm(i.name)));
    const added = (incoming || []).filter(i => !have.has(norm(i.name)));
    return { items: [...(existing || []), ...added].sort((a, b) => (RANK[b.tier] || 0) - (RANK[a.tier] || 0)), added };
}

// One picture's read -> what the review shows and the save writes. ctx: { entries, weaponNames (Set of normalised names), weaponDisplay (Map normalised -> display), name (his Names line), season, year }.
function decideDraw(read, ctx = {}) {
    const C = require('./drawCatalog');
    const { toTitleCase } = require('./adminParser');
    const entries = ctx.entries || [];
    const known = knownNames(entries, ctx.weaponDisplay);
    const title = toTitleCase(clean(ctx.name || read.title, 90));
    const flags = [];
    if (read.notDraw) flags.push('notDraw');
    if (read.draws > 1) flags.push('manyDraws');
    if (!title) flags.push('noTitle');
    if (!read.items.length) flags.push('noItems');
    // Names first, then tiers: an indexed item's tier wins over the read (confirmed by him), then the frame the read saw, then a Mythic Drop's weapon is mythic, else legendary marked as guessed.
    const snapped = [];
    const staged = read.items.map(it => {
        const s = snapName(it.name, known);
        // Only a real change is listed (MG42 → MG82); a casing or dash difference is applied without a line (the click test: "HBRA3 → HBRA3" read as noise).
        if (s.snapped && norm(s.name) !== norm(it.name)) snapped.push(`${it.name} → ${s.name}`);
        const had = known.items.get(norm(s.name));
        return { name: s.name, tier: had?.tier || it.tier || '', readKind: it.kind || '', fromIndex: Boolean(had) };
    });
    const kinds = C.mergeItems([], staged.map(i => ({ tier: i.tier || 'legendary', name: i.name })), entries, ctx.weaponNames || new Set());
    const items = staged.map((it, n) => {
        // The kind the index or the gunsmith knows wins; the read's own kind (weapon vs operator art is plain on a poster) fills a gap, so Set Item Kinds asks less.
        const k = kinds[n] || {};
        const kind = k.kind || it.readKind || '';
        let tier = it.tier;
        let guessed = false;
        if (!tier) { tier = read.printed.mythicDrop && kind === 'weapon' ? 'mythic' : 'legendary'; guessed = !read.printed.mythicDrop || kind !== 'weapon'; }
        return { tier, kind, name: it.name, baseName: k.baseName || '', skinName: k.skinName || '', guessed, newToIndex: !it.fromIndex };
    }).sort((a, b) => (RANK[b.tier] || 0) - (RANK[a.tier] || 0));
    const match = matchEntry(entries, title, items);
    const target = match.status === 'sure' ? match.entry : null;
    const rule = typeByRule(target ? unionItems(target.items, items).items : items, read.printed);
    const ownType = target && C.isKnownType(target.priceType) ? target.priceType : '';
    return {
        title: target ? target.title : title,
        readTitle: title,
        items,
        comments: read.comments,
        priceType: ownType || rule.type,
        typeSettled: Boolean(ownType) || rule.settled,
        match: { status: match.status, id: match.entry ? String(match.entry._id) : null, title: match.entry?.title || null, by: match.by },
        added: target ? unionItems(target.items, items).added.length : items.length,
        snapped,
        flags,
        season: Number.isInteger(ctx.season) ? ctx.season : null,
        year: Number.isInteger(ctx.year) ? ctx.year : null,
    };
}

// The release year for a typed season: the draft's year when it is the draft's season, the live year when it is the live season, else this calendar year (a December upload of "Season 1" would otherwise carry the wrong year). `doc` is SeasonalData's global doc.
function seasonYearFor(season, doc, now = new Date()) {
    if (!Number.isInteger(season)) return null;
    const { seasonYear } = require('./quickAdd');
    const num = (t) => { const m = String(t || '').match(/season\s*(\d+)/i); return m ? Number(m[1]) : null; };
    if (doc?.draft && num(doc.draft.currentSeasonTitle) === season) return seasonYear(doc.draft) || now.getUTCFullYear();
    if (num(doc?.currentSeasonTitle) === season) return seasonYear(doc) || now.getUTCFullYear();
    return now.getUTCFullYear();
}

// ---------- the call ----------
// Only Discord's own hosts are fetched (an uploaded file is a cdn.discordapp.com link): the same rule as news triage's image fetch.
async function fetchImage(url) {
    const { allowedImageUrl } = require('./newsTriage/model');
    if (!allowedImageUrl(url)) throw new Error('That picture is not a Discord upload.');
    const res = await fetch(url, { signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS), redirect: 'error' });
    if (!res.ok) throw new Error(`Discord answered HTTP ${res.status} for the picture (an upload link lasts about a day).`);
    const type = (res.headers.get('content-type') || '').split(';')[0];
    if (!/^image\//i.test(type)) throw new Error('That file is not a picture.');
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_IMAGE_BYTES) throw new Error('That picture is over 15 MB.');
    return { type, data: buf.toString('base64'), bytes: buf.length, buffer: buf };
}

// One picture -> { read, usage } or throws. One retry after a timeout, a 429 or a 5xx, as news triage does.
async function readPicture(url, { generate } = {}) {
    const vertexGenerate = generate || require('./visionExtract').vertexGenerate;
    const img = await fetchImage(url);
    // The logo bar many posters carry at the bottom (utils/drawPictureBar.js), measured on the same bytes, so Save can crop it off.
    const picture = await require('./drawPictureBar').measure(img.buffer);
    const parts = [{ text: PROMPT }, { inline_data: { mime_type: img.type, data: img.data } }];
    const call = () => vertexGenerate(parts, { taskName: 'draw_index_upload', timeoutMs: 120 * 1000, thinkingLevel: 'low', responseSchema: SCHEMA, withUsage: true });
    let res;
    try { res = await call(); }
    catch (err) {
        if (!/timeout|aborted|fetch failed|ECONNRESET|HTTP 429|HTTP 5\d\d/i.test(String(err?.message || err))) throw err;
        await new Promise(r => setTimeout(r, 3000));
        res = await call();
    }
    return { read: shapeRead(res.parsed), usage: res.usage || {}, location: res.location, picture };
}

// Dollars for the reads, from the token counts (utils/visionExtract.js's own price table). `reads` is [{ usage, location }].
function readCost(reads) {
    const { estimateVisionCostUsd } = require('./visionExtract');
    let total = 0;
    for (const r of reads || []) { try { total += Number(estimateVisionCostUsd(r.location, r.usage)?.estimatedCostUsd) || 0; } catch { /* a missing price is not a reason to fail */ } }
    return total;
}

module.exports = { PROMPT, SCHEMA, shapeRead, snapName, knownNames, typeByRule, matchEntry, unionItems, decideDraw, seasonYearFor, readPicture, fetchImage, readCost, editDistance, MAX_ITEMS };
