// BOARD 4 · v11 — the bulk format, his items 26–28 (2026-09-22 13:55 EDT), ruled at 13:01 EDT to replace the bot's own block format too, so
// Session 5 ports THIS file to the bot's parser. Pure: no DOM, no globals, no imports, so node can prove the writer and the reader agree.
//
// THE COMPACT FORMAT — what Export writes and what a paste usually is:
//     Weapon | Category | Mode
//     Label | Code | Key_or_URL          (any of the three may be empty; a DMZ build has no code)
//     meta, best                          (optional: read as badges only when EVERY token is a badge, or it is a comma list holding one)
//     Attachment                          (one per line, to the blank line that starts the next build)
//
// THE DISPLAY FORM — what the editor holds once a paste lands: the same build with its chrome written in (Label:, Code:, Image:, Badges:,
// "- " before each attachment), so every line says what it is and stays editable. The reader accepts both, and the old "Build:" key.

// 2026-09-25 23:19 EDT (his 23:12 EDT, the Modes family): MODES, a third badge family beside the grades and the tiers — the ranked modes a build is recommended for. MP only (ranked
// modes are MP modes), any number of them, written on the Badges line in this order. RANK_MODES is the one list every board surface reads.
export const RANK_MODES = ['HP', 'S&D', 'DOM', 'TDM', 'FTL', 'Control'];
const MODE_OF = Object.fromEntries(RANK_MODES.map((m) => [m.toLowerCase(), m]));
const ALIAS = { snd: 's&d', sd: 's&d', ctrl: 'control' };
export const modeToken = (t) => MODE_OF[ALIAS[t] || t] || null;
export const modesOf = (b) => (b.mode === 'DMZ' ? [] : RANK_MODES.filter((m) => (b.rankModes || []).includes(m)));
export const TOKENS = {
    // v19 (his item 7, 2026-09-24): Top 4 is retired and Capable is the fourth tier; ASS is a grade beside META and TOXIC.
    MP: ['meta', 'toxic', 'ass', 'best', 'top3', 'top5', 'capable', ...RANK_MODES.map((m) => m.toLowerCase())],
    // The bot's own DMZ vocabulary (utils/loadoutRender.js buildBadgesLine): a tier, optionally a combat range; bare 'top5' is "Top 5 DMZ".
    DMZ: ['meta', 'toxic', 'ass', 'best', 'top3', 'top5', 'capable', 'best-close', 'best-midlong', 'top3-close', 'top3-midlong', 'top5-close', 'top5-midlong', 'capable-close', 'capable-midlong'],
};
// A file exported before v19 still says top4. A top-4 build is inside the top five, so it reads as top5 (never a demotion to Capable) and says so.
const RETIRED = { top4: 'top5' };
const ALL = new Set([...TOKENS.MP, ...TOKENS.DMZ, ...Object.keys(RETIRED), ...Object.keys(ALIAS)]);
const MODES = ['MP', 'DMZ'];
export const keyOf = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');
// The dev data stores literal "Build 2" labels (on build #1, too). A label that only restates a build number is NO label: writing it would
// print a second, wrong number beside the real one, which is how a card titled "Build 1" came to read "Build: Build 2".
export const isAutoLabel = (s) => /^build\s*\d+$/i.test(String(s || '').trim());
export const labelOf = (b) => (isAutoLabel(b.buildName) ? '' : String(b.buildName || '').trim());
export const badgesOf = (b) => [b.isMeta && 'meta', b.mode === 'DMZ' ? b.dmzRangeRank : b.categoryRank, b.isToxic && 'toxic', b.isAss && 'ass', ...modesOf(b).map((m) => m.toLowerCase())].filter(Boolean);
export const normKey = (k) => String(k || '').trim().replace(/\.png$/i, '');
export const imageOf = (b) => (b.imageKey ? normKey(b.imageKey) : b.imageUrl || '');
const isUrl = (s) => /^https?:\/\/\S+$/i.test(String(s || '').trim());
const KEYLINE = /^\s*([A-Za-z ]+):\s*(.*)$/;
const ATTLINE = /^\s*[-*•]\s+/;

function isBadgeLine(s) {
    const t = String(s || '').toLowerCase().split(/[,\s]+/).filter(Boolean);
    if (!t.length) return false;
    return t.every((x) => ALL.has(x)) || (s.includes(',') && t.some((x) => ALL.has(x)));
}

export function writeCompact(list) {
    return list.map((b) => {
        const mode = b.mode === 'DMZ' ? 'DMZ' : 'MP';
        const out = [`${b.weaponName} | ${b.category} | ${mode}`, [labelOf(b), mode === 'DMZ' ? '' : (b.shareCode || ''), imageOf(b)].join(' | ').trim()];
        const bd = badgesOf(b);
        if (bd.length) out.push(bd.join(', '));
        out.push(...(b.attachments || []));
        return out.join('\n');
    }).join('\n\n');
}

export function splitBlocks(text) {
    const blocks = []; let cur = null;
    String(text || '').split('\n').forEach((raw, i) => {
        if (!raw.trim()) { if (cur) { blocks.push(cur); cur = null; } return; }
        if (!cur) cur = { start: i + 1, lines: [] };
        cur.lines.push({ n: i + 1, raw }); cur.end = i + 1;
    });
    if (cur) blocks.push(cur);
    return blocks;
}
// A block is compact when its second line is the Label | Code | Image line rather than a keyed line or an attachment.
const isCompact = (lines) => lines.length > 1 && lines[1].raw.includes('|') && !KEYLINE.test(lines[1].raw) && !ATTLINE.test(lines[1].raw);

// Compact → display, block by block; a block already in display form is kept byte for byte.
export function toDisplay(text) {
    return splitBlocks(text).map((blk) => {
        const L = blk.lines.map((l) => l.raw);
        if (!isCompact(blk.lines)) return L.join('\n');
        const [label = '', code = '', img = ''] = L[1].split('|').map((x) => x.trim());
        const out = [L[0].trim()];
        if (label) out.push(`Label: ${label}`);
        if (code) out.push(`Code: ${code}`);
        if (img) out.push(`Image: ${img}`);
        let rest = L.slice(2);
        if (rest[0] && isBadgeLine(rest[0])) { out.push(`Badges: ${rest[0].trim()}`); rest = rest.slice(1); }
        out.push(...rest.map((a) => `- ${a.trim().replace(ATTLINE, '')}`));
        return out.join('\n');
    }).join('\n\n');
}
export const looksCompact = (text) => splitBlocks(text).some((b) => isCompact(b.lines));

// ctx: { builds, mode (the drawer's default), catalogueFor(mode) → { name: slot }, numberOf(build) → n, nextKey(weapon, mode), unused: [keys], editing }
export function readDisplay(text, ctx) {
    const { builds = [], mode: dflt = 'MP', catalogueFor = () => ({}), numberOf = () => 1, nextKey = () => '', unused = [], editing = false } = ctx || {};
    const seen = new Map();  // signature → first block, for the duplicate flag
    const unlabeledSeen = new Map();  // weapon → how many unlabeled blocks so far, to pair them with the edited builds in order
    return splitBlocks(text).map((blk, bi) => {
        const b = { ...blk, index: bi + 1, hits: new Set(), diffs: [], atts: [], err: null, msg: null };
        const head = blk.lines[0].raw.split('|').map((x) => x.trim());
        b.weapon = head[0] || '';
        b.category = (head[1] || '').toUpperCase();
        const m = (head[2] || '').toUpperCase();
        b.modeGiven = Boolean(head[2]);
        b.mode = MODES.includes(m) ? m : dflt;
        if (!b.weapon || !b.category) { b.outcome = 'bad'; b.err = blk.lines[0].n; b.msg = { t: 'The first line needs a category', eg: `${b.weapon || 'Weapon'} | AR | ${b.mode}` }; return b; }
        if (head[2] && !MODES.includes(m)) { b.outcome = 'bad'; b.err = blk.lines[0].n; b.msg = { t: `“${head[2]}” isn’t a mode — MP or DMZ`, eg: `${b.weapon} | ${b.category} | MP` }; return b; }
        const catalogue = catalogueFor(b.mode) || {};
        const f = {}; let badKey = null; let rest = blk.lines.slice(1);
        if (isCompact(blk.lines)) {
            const [label = '', code = '', img = ''] = rest[0].raw.split('|').map((x) => x.trim());
            if (label) f.label = { v: label, n: rest[0].n };
            if (code) f.code = { v: code, n: rest[0].n };
            if (img) f.image = { v: img, n: rest[0].n };
            rest = rest.slice(1);
            if (rest[0] && isBadgeLine(rest[0].raw)) { f.badges = { v: rest[0].raw.trim(), n: rest[0].n }; rest = rest.slice(1); }
        }
        for (const l of rest) {
            const t = l.raw.trim();
            if (ATTLINE.test(t)) { b.atts.push({ name: t.replace(ATTLINE, '').trim(), n: l.n }); continue; }
            const k = KEYLINE.exec(t);
            if (!k) { b.atts.push({ name: t, n: l.n }); continue; }
            const key = k[1].trim().toLowerCase();
            const as = { label: 'label', build: 'label', code: 'code', image: 'image', key: 'image', url: 'image', badges: 'badges' }[key];
            if (!as) { badKey = badKey || { k: k[1].trim(), n: l.n }; continue; }
            f[as] = { v: k[2].trim(), n: l.n };
        }
        b.label = f.label && !isAutoLabel(f.label.v) ? f.label.v : '';
        b.code = f.code ? f.code.v.toUpperCase() : '';
        b.image = f.image ? f.image.v : '';
        b.fields = f;
        if (badKey) { b.outcome = 'bad'; b.err = badKey.n; b.msg = { t: `“${badKey.k}:” isn’t a line this reads`, eg: 'Label, Code, Image or Badges' }; return b; }
        b.atts.forEach((a) => { a.slot = catalogue[a.name] || null; });
        if (!b.atts.length) { b.outcome = 'bad'; b.err = blk.end; b.msg = { t: 'No attachments under this build yet', eg: '- one attachment per line' }; return b; }
        const said = f.badges ? f.badges.v.toLowerCase().split(/[,\s]+/).filter(Boolean) : [];
        const retired = said.filter((x) => RETIRED[x]);
        const tokens = said.map((x) => RETIRED[x] || ALIAS[x] || x);
        const valid = tokens.filter((x) => TOKENS[b.mode].includes(x));
        const unknown = tokens.filter((x) => !TOKENS[b.mode].includes(x));
        const rank = valid.find((x) => x !== 'meta' && x !== 'toxic' && x !== 'ass' && !modeToken(x)) || null;
        // v20 (his item 37): ASS cannot sit with META or a tier; the positive claim stands and ASS is left off, with a warning. TOXIC + ASS is fine.
        const clash = valid.includes('ass') && (valid.includes('meta') || rank) ? (valid.includes('meta') ? 'meta' : rank) : null;
        if (clash) valid.splice(valid.indexOf('ass'), 1);
        b.badges = { isMeta: valid.includes('meta'), isToxic: valid.includes('toxic'), isAss: valid.includes('ass'), categoryRank: b.mode === 'MP' ? rank : null, dmzRangeRank: b.mode === 'DMZ' ? rank : null, rankModes: RANK_MODES.filter((m) => valid.includes(m.toLowerCase())), mode: b.mode, category: b.category };
        b.tokens = valid;
        // THE IMAGE LINE SAYS WHAT IT RESOLVED TO (his item 27): a link, a key another build already uses, an upload no build uses, or new.
        const own = (bb) => bb.mode === b.mode && keyOf(bb.weaponName) === keyOf(b.weapon);
        if (!b.image) b.imageState = { s: 'none', t: 'No image' };
        else if (isUrl(b.image)) b.imageState = { s: 'url', t: 'Link' };
        else {
            const k = normKey(b.image);
            const owner = builds.find((x) => normKey(x.imageKey) === k);
            if (owner) b.imageState = { s: 'used', t: owner, k };
            else if (unused.includes(k)) b.imageState = { s: 'unused', t: 'Unused upload', k };
            else b.imageState = { s: 'new', t: k === nextKey(b.weapon, b.mode) ? 'New image · next free key' : 'New image', k };
        }
        // Which live build this block edits: by its own label; unlabeled ones pair with the edited builds in order (Edit only).
        const mine = builds.filter(own);
        if (b.label) b.before = mine.find((x) => labelOf(x) === b.label) || null;
        else if (editing) { const k = unlabeledSeen.get(keyOf(b.weapon)) || 0; unlabeledSeen.set(keyOf(b.weapon), k + 1); b.before = mine.filter((x) => !labelOf(x))[k] || null; }
        else b.before = null;
        b.n = b.before ? numberOf(b.before) : mine.length + 1;
        if (b.before && b.imageState.s === 'used' && b.imageState.t === b.before) b.imageState = { s: 'kept', t: 'This build’s image', k: b.imageState.k };
        // THE DUPLICATE FLAG: the same build twice in one paste stages once. His 6-block Edit screenshot was exactly this.
        const sig = JSON.stringify([b.mode, keyOf(b.weapon), b.category, b.label, b.code, normKey(b.image), [...valid].sort(), b.atts.map((a) => a.name)]);
        const lab = b.label ? `${b.mode}|${keyOf(b.weapon)}|${b.label.toLowerCase()}` : null;
        const first = seen.get(sig) || (lab && seen.get(lab));
        if (first) { b.outcome = 'dup'; b.dupOf = first; b.msg = { t: `Same build as lines ${first.start}–${first.end}`, eg: 'Staged once' }; return b; }
        seen.set(sig, b); if (lab) seen.set(lab, b);
        if (b.before) {
            const was = b.before;
            if (was.category !== b.category) { b.diffs.push({ k: 'Category', was: was.category, now: b.category }); b.hits.add(blk.lines[0].n); }
            if (b.mode === 'MP' && (was.shareCode || '') !== b.code) { b.diffs.push({ k: 'Code', was: was.shareCode || null, now: b.code || null }); if (f.code) b.hits.add(f.code.n); }
            if (normKey(imageOf(was)) !== normKey(b.image)) { b.diffs.push({ k: 'Image', was: imageOf(was) || null, now: b.image || null }); if (f.image) b.hits.add(f.image.n); }
            const bw = badgesOf(was).sort().join(', '), bn = [...valid].sort().join(', ');
            if (bw !== bn) { b.diffs.push({ k: 'Badges', was: bw || null, now: bn || null }); if (f.badges) b.hits.add(f.badges.n); }
            const wa = was.attachments || [];
            b.atts.forEach((a) => { if (!wa.includes(a.name)) { b.diffs.push({ k: a.slot || 'Adds', was: null, now: a.name }); b.hits.add(a.n); } });
            wa.forEach((name) => { if (!b.atts.some((a) => a.name === name)) b.diffs.push({ k: 'Drops', was: name, now: null }); });
        }
        const notes = [];
        if (retired.length) notes.push(`“${retired[0]}” is retired — read as ${RETIRED[retired[0]]}`);
        if (unknown.length) notes.push(b.mode === 'DMZ' && modeToken(unknown[0]) ? `“${unknown[0]}” is a rank mode — DMZ builds carry none, saved without it` : `“${unknown[0]}” isn’t ${b.mode === 'MP' ? 'an MP' : 'a DMZ'} badge — saved without it`);
        if (clash) notes.push(`“ass” can’t sit with ${clash} — saved without it`);
        if (b.mode === 'DMZ' && f.code) notes.push('DMZ builds carry no gunsmith code — the code is left out');
        if (notes.length) { b.outcome = 'warn'; b.msg = { t: notes[0] }; if (f.badges && (unknown.length || retired.length || clash)) b.hits.add(f.badges.n); if (b.mode === 'DMZ' && f.code) b.hits.add(f.code.n); }
        else b.outcome = b.before ? (b.diffs.length ? 'upd' : 'same') : 'new';
        return b;
    });
}
