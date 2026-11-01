#!/usr/bin/env node
// One-off, DRY RUN ONLY: reads a folder of draw images with Gemini on Vertex (the same model, project and keyless gcloud ADC login as utils/visionExtract.js) and writes a review report. It never uploads and never writes to Cloudinary or the database; the upload step is a separate script, written after the report is reviewed.
//
//   node --env-file=.env.dev scripts/indexDrawImages.js --dir "<folder>" [--limit N] [--only text] [--no-cache]
//   node --env-file=.env.dev scripts/indexDrawImages.js --check-index      (list what Cloudinary already holds, no images read)
//
// Output goes to local/project/features/draw-image-index/ (gitignored): report.md, reads.json, and cache/<sha1>.json (one Gemini answer per image, so a re-run costs nothing). Claude never reads the images; only the report text.
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const cloudinary = require('cloudinary').v2;
const { estimateVisionCostUsd, MODEL } = require('../utils/visionExtract');
const { drawFingerprint, itemKeys, drawSimilarity, readDrawContext, slugify, DRAW_TAG, SUGGEST_SIMILARITY } = require('../utils/cloudinaryCache');

const { DRAW_TYPES } = require('../utils/drawTypes');
const OUT_DIR = path.join(__dirname, '..', 'local', 'project', 'features', 'draw-image-index');
const SEASON7_FILE = path.join(OUT_DIR, 'season7-draws.md');
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.heic': 'image/heic', '.heif': 'image/heif' };
const MAX_BYTES = 15 * 1024 * 1024;
const CONCURRENCY = 5;
const LOW_CONFIDENCE = 80;
const TIERS = ['mythic', 'legendary', 'epic', 'comment'];

const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i === -1 ? null : (process.argv[i + 1] ?? true); };
const flag = (name) => process.argv.includes(`--${name}`);
// Banner titles are stylised, so the default is HIGH; --thinking low|medium|high changes it. It is part of the cache name, so levels never reuse each other's answers.
const THINKING = String(arg('thinking') || 'high').toUpperCase();
const errText = (e) => e?.message || e?.error?.message || 'unknown error';
// --verify: a second pass where Gemini sees the image plus every earlier reading and checks names, rarity and draw kind with Google Search. Its files are prefixed so the plain reads are never overwritten.
const VERIFY = flag('verify');
const OUT_PREFIX = VERIFY ? 'verified-' : '';
const PREV_LABEL = VERIFY ? 'the 14-type high-thinking run' : 'the low-thinking run';
// --rows 5,6,7 (with --verify): only these rows (1-based, in the sorted file list) get the web check; every other row keeps its 14-type read, so the report always has all rows with stable row numbers.
const ONLY_ROWS = arg('rows') ? new Set(String(arg('rows')).split(',').map(Number)) : null;

// --- Vertex call (same endpoint rules as utils/visionExtract.js; that module keeps these private) ---
let tokenCache = { value: null, at: 0 };
function accessToken() {
    if (tokenCache.value && Date.now() - tokenCache.at < 30 * 60 * 1000) return tokenCache.value;
    // Homebrew replaces the gcloud binary while it upgrades it, so a lookup can fail for a few seconds; retry before giving up.
    let value = '';
    for (let attempt = 1; attempt <= 4 && !value; attempt++) {
        try { value = execFileSync('gcloud', ['auth', 'application-default', 'print-access-token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000 }).trim(); }
        catch (e) { if (attempt === 4) throw e; Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 3000); }
    }
    if (!value) throw new Error('No gcloud ADC token; run "gcloud auth application-default login"');
    tokenCache = { value, at: Date.now() };
    return value;
}
function vertexTarget() {
    const project = process.env.GCP_PROJECT_ID || 'gen-lang-client-0549308254';
    const location = process.env.GCP_LOCATION || 'us';
    const model = process.env.GCP_MODEL || MODEL;
    const modelPath = model.startsWith('publishers/google/models/') ? model : `publishers/google/models/${model}`;
    const host = location === 'global' ? 'https://aiplatform.googleapis.com' : location === 'us' ? 'https://aiplatform.us.rep.googleapis.com' : location === 'eu' ? 'https://aiplatform.eu.rep.googleapis.com' : `https://${location}-aiplatform.googleapis.com`;
    return { location, model, endpoint: `${host}/v1/projects/${project}/locations/${location}/${modelPath}:generateContent` };
}

// The draw kind IS the bot's price-type key (utils/drawTypes.js), plus "unknown" for Unsure, so the report needs no mapping layer.
const DRAW_KINDS = [...DRAW_TYPES.map(t => t.key), 'unknown'];
const KIND_LABEL = { ...Object.fromEntries(DRAW_TYPES.map(t => [t.key, t.name])), unknown: 'Unsure' };
// Bump when PROMPT or RESPONSE_SCHEMA changes, so cached answers from an older prompt are never reused.
const PROMPT_VERSION = 'v4';
// The earlier reads (six kinds, same title and item wording) that a rerun's title and item changes are measured against.
const PREV_VERSION = 'v3';
// Kept short on purpose: the schema below carries the field names and the allowed values, so the prompt only says what each field means.
const PROMPT = `This is a screenshot of a Call of Duty Mobile lucky draw (a Draw, Mythic Drop, Series Armory or "It Goes Two" draw). Read only what is printed on it and fill every field.
- title: the draw's title as printed but in Title Case, or "" if unreadable.
- items: every Mythic, Legendary and Epic reward, highest rarity first ("WEAPON - Skin Name" or "Character - Skin Name" when both are printed), spelled exactly as printed but in Title Case, because banners print capitals (keep weapon model names the way the game writes them: AK117, M4, Krig 6, Type 25, DL Q33). tier comes from the reward's frame colour or badge if one is visible (mythic red, legendary orange or gold, epic purple); if none is visible, infer it from the item and keep the items confidence at 70 or below. kind is weapon or character. Add a tier "comment" item only for a condition line the screen prints about the draw (for example "Acquire Both ... to Unlock ..." or "aka ..."). Ignore every other reward and all menu text.
- drawKind: the draw's price type, exactly one of: mythicWeapon (a Mythic Weapon draw); mythicCharacter (a Mythic Character + Legendary Weapon draw); legendaryGunReactive (Legendary Weapon draw whose skin has kill reactions); legendaryGunNonReactive (Legendary Weapon draw without them); legendaryCharacterWeapon (Legendary Character + Legendary Weapon draw); doubleLegendaryWeapons (gives two legendary weapons); sevenSpinLegendaryWeapon (a 7 Spins draw); pickYourRewardCard (a Pick Your Reward Card draw); doubleEpicCharacters (two Epic characters); armoryMythicWeapon, armoryLegendaryWeapon or armoryLegendaryCharacter (a Series Armory collection whose top prize is a mythic weapon, a legendary weapon or a legendary character); advancedWeapon or advancedCharacter (an Advanced Double Legendary "It Goes Two" draw of weapons or of characters); unknown (none clearly). If two look alike, pick the likelier and give the drawKind confidence 60 or less.
- confidence: integers 0-100 for the title, the items, and the drawKind.
- observations: one short sentence if something was hard to read or unexpected (several draws on one screen, a pop-up covering rewards, cropped text), else "".
Never invent a reward or a title that is not visible.`;
const STR = { type: 'STRING' }, INT = { type: 'INTEGER' };
const RESPONSE_SCHEMA = {
    type: 'OBJECT',
    properties: {
        title: STR,
        items: { type: 'ARRAY', items: { type: 'OBJECT', properties: { tier: { type: 'STRING', enum: TIERS }, name: STR, kind: { type: 'STRING', enum: ['weapon', 'character'] } }, required: ['tier', 'name'] } },
        drawKind: { type: 'STRING', enum: DRAW_KINDS },
        confidence: { type: 'OBJECT', properties: { title: INT, items: INT, drawKind: INT }, required: ['title', 'items', 'drawKind'] },
        observations: STR,
    },
    required: ['title', 'items', 'drawKind', 'confidence', 'observations'],
};

const VERIFY_VERSION = 'w2';
const DRAW_KIND_HELP = PROMPT.split('\n').find(l => l.startsWith('- drawKind:'));
const VERIFY_PROMPT = `You are fact-checking readings of a Call of Duty Mobile (CODM) lucky draw image. The image is attached. Earlier readings of this same image are listed at the end as JSON; they disagree in places and some are wrong. Decide the correct values by looking at the image yourself and by using Google Search to check names against other sources (CODM news and patch notes, the CODM wiki, the official site and social posts, event write-ups).
Search sparingly: only for what the earlier readings disagree on or are unsure about and the image alone does not settle (the draw's official title, the spelling of a weapon, character or skin name, a reward's rarity, weapon versus character, the price type). Use at most 6 searches in total, putting several names into one query where you can; if the readings agree and the image is clear, do not search at all. Do not change something the image clearly shows because a web page differs; keep what the image shows and say so in observations.
Answer as JSON with these fields, using the same rules as the earlier readings (Title Case, weapon model names as the game writes them, highest rarity first, tier "comment" only for a condition line the screen prints):
- title, items [{tier, name, kind}], confidence {title, items, drawKind}, observations
${DRAW_KIND_HELP}
- changes: one short string for each thing you changed from the earlier readings, as "was -> now (why)"; an empty list if you changed nothing.
- needsHuman: true only if, after checking, you still cannot settle the title, a name, a rarity or the draw kind; say which in observations.
Earlier readings:`;
const VERIFY_SCHEMA = { ...RESPONSE_SCHEMA, properties: { ...RESPONSE_SCHEMA.properties, changes: { type: 'ARRAY', items: STR }, needsHuman: { type: 'BOOLEAN' } }, required: [...RESPONSE_SCHEMA.required, 'changes', 'needsHuman'] };

// The three earlier readings of one image, from the cache, in the shape the verify prompt lists them.
function loadPriors(sha1) {
    const runs = [['low thinking, 6 draw kinds', 'v3-low', false], ['high thinking, 6 draw kinds', 'v3-high', false], ['high thinking, 14 price types', 'v4-high', true]];
    return runs.map(([run, prefix, withKind]) => {
        const f = path.join(OUT_DIR, 'cache', `${prefix}-${sha1}.json`);
        if (!fs.existsSync(f)) return null;
        const p = JSON.parse(fs.readFileSync(f, 'utf8')).parsed;
        return { run, title: p.title, items: (p.items || []).map(i => ({ tier: i.tier, name: i.name, kind: i.kind })), ...(withKind ? { drawKind: p.drawKind } : {}), confidence: p.confidence, observations: p.observations };
    }).filter(Boolean);
}

async function verifyImage(file, bytes, priors) {
    const { location, model, endpoint } = vertexTarget();
    const base = { contents: [{ role: 'user', parts: [{ text: `${VERIFY_PROMPT}\n${JSON.stringify(priors)}` }, { inline_data: { mime_type: MIME[path.extname(file).toLowerCase()], data: bytes.toString('base64') } }] }], tools: [{ googleSearch: {} }] };
    const withSchema = { ...base, generationConfig: { responseMimeType: 'application/json', responseSchema: VERIFY_SCHEMA, thinkingConfig: { thinkingLevel: THINKING } } };
    const noSchema = { ...base, generationConfig: { thinkingConfig: { thinkingLevel: THINKING } } };
    let body = withSchema;
    let noSearch = false;
    for (let attempt = 1; attempt <= 4; attempt++) {
        let res;
        try { res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken()}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(240 * 1000) }); }
        catch (e) { if (attempt < 4 && /timeout|abort/i.test(`${e?.name} ${e?.message}`)) continue; throw e; }
        if (!res.ok) {
            const text = (await res.text().catch(() => '')).slice(0, 400);
            // Some models cannot combine a tool with a response schema; fall back to plain JSON text (the prompt already asks for the fields).
            if (body === withSchema && res.status === 400 && /schema|mime|controlled|tool/i.test(text)) { console.error(`(schema + search not accepted, retrying without the schema: ${text.slice(0, 160)})`); body = noSchema; continue; }
            if (attempt < 4 && (res.status === 429 || res.status >= 500)) { await new Promise(r => setTimeout(r, 2000 * attempt)); continue; }
            throw new Error(`Gemini HTTP ${res.status}: ${text}`);
        }
        const data = await res.json();
        const cand = data?.candidates?.[0];
        const raw = (cand?.content?.parts || []).filter(p => p.text && !p.thought).map(p => p.text).join('');
        let parsed = null;
        try { parsed = JSON.parse(raw); } catch { const m = raw.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); }
        if (!parsed) {
            const why = `finishReason ${cand?.finishReason || '?'}${data?.promptFeedback ? ` promptFeedback ${JSON.stringify(data.promptFeedback).slice(0, 150)}` : ''}`;
            // The model kept searching until the tool-call limit and never answered; asking again repeats that (and the search bill), so answer once without the search tool instead.
            if (/TOO_MANY_TOOL_CALLS/.test(why) && !noSearch) { console.error(`(${file}: ${why}; retrying once without search)`); const { tools, ...rest } = body; body = rest; noSearch = true; continue; }
            if (attempt < 4 && !/TOO_MANY_TOOL_CALLS/.test(why)) { console.error(`(empty answer for ${file}: ${why}; retrying)`); continue; }
            throw new Error(`Gemini returned no JSON (${why}): ${raw.slice(0, 200)}`);
        }
        const gm = cand?.groundingMetadata || {};
        const { searchEntryPoint, ...gmRaw } = gm;
        return { parsed, usage: data.usageMetadata || null, location, model, schemaless: body === noSchema, noSearch, groundingRaw: gmRaw, queries: gm.webSearchQueries || [], sources: (gm.groundingChunks || []).map(c => ({ title: c.web?.title || '', uri: c.web?.uri || '' })).slice(0, 8) };
    }
    throw new Error('Gemini kept timing out');
}

async function readImage(file, bytes) {
    const { location, model, endpoint } = vertexTarget();
    const body = { contents: [{ role: 'user', parts: [{ text: PROMPT }, { inline_data: { mime_type: MIME[path.extname(file).toLowerCase()], data: bytes.toString('base64') } }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA, thinkingConfig: { thinkingLevel: THINKING } } };
    for (let attempt = 1; ; attempt++) {
        let res;
        try { res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken()}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(120 * 1000) }); }
        catch (e) { if (attempt < 3 && /timeout|abort/i.test(`${e?.name} ${e?.message}`)) continue; throw e; }
        if (!res.ok) {
            const text = (await res.text().catch(() => '')).slice(0, 300);
            if (attempt < 3 && (res.status === 429 || res.status >= 500)) { await new Promise(r => setTimeout(r, 2000 * attempt)); continue; }
            throw new Error(`Gemini HTTP ${res.status}: ${text}`);
        }
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!raw) throw new Error('Gemini returned no text');
        return { parsed: JSON.parse(raw), usage: data.usageMetadata || null, location, model };
    }
}

// --- Known draws: the Season 7 list the cloud thread recovered, and what Cloudinary already holds ---
function loadSeason7() {
    if (!fs.existsSync(SEASON7_FILE)) return [];
    return fs.readFileSync(SEASON7_FILE, 'utf8').split('\n').filter(l => /^\|\s*\d+\s*\|/.test(l)).map(l => {
        const c = l.split('|').map(s => s.trim());
        const items = c[7].split('; ').map(s => { const i = s.indexOf(': '); return { tier: s.slice(0, i), name: s.slice(i + 2) }; });
        return { n: Number(c[1]), title: c[3], slug: c[5], fp: c[6], keys: itemKeys(items) };
    });
}
async function loadIndexed() {
    const out = [];
    let cursor;
    do {
        const page = await cloudinary.api.resources_by_tag(DRAW_TAG, { context: true, max_results: 500, next_cursor: cursor });
        for (const r of page.resources || []) out.push({ publicId: r.public_id, ...readDrawContext(r) });
        cursor = page.next_cursor;
    } while (cursor);
    return out;
}

// --- Turn one Gemini answer into a normalised read, then compare it with what is known ---
function shape(parsed) {
    const items = (Array.isArray(parsed?.items) ? parsed.items : []).filter(i => i && typeof i.name === 'string' && i.name.trim()).map(i => ({ tier: String(i.tier || '').toLowerCase().trim(), name: i.name.trim(), kind: i.kind === 'weapon' || i.kind === 'character' ? i.kind : '' }));
    const n = (v) => { const x = Number(v); return Number.isFinite(x) && x >= 0 && x <= 100 ? Math.round(x) : null; };
    return {
        title: typeof parsed?.title === 'string' ? parsed.title.trim() : '',
        items,
        drawKind: DRAW_KINDS.includes(parsed?.drawKind) ? parsed.drawKind : 'unknown',
        confidence: { title: n(parsed?.confidence?.title), items: n(parsed?.confidence?.items), drawKind: n(parsed?.confidence?.drawKind) },
        observations: typeof parsed?.observations === 'string' ? parsed.observations.trim().slice(0, 300) : '',
    };
}
function compare(read, season7, indexed) {
    const fp = drawFingerprint({ items: read.items });
    const keys = itemKeys(read.items);
    const slug = read.title ? slugify(read.title) : '';
    const flags = [];
    if (!read.title) flags.push('no title');
    if (!keys.length) flags.push('no items');
    if (read.items.some(i => !TIERS.includes(i.tier))) flags.push('unknown tier');
    if (keys.length === 1) flags.push('only 1 reward');
    for (const k of ['title', 'items', 'drawKind']) if (read.confidence[k] === null || read.confidence[k] < LOW_CONFIDENCE) flags.push(`low ${k} confidence (${read.confidence[k] ?? '?'})`);
    const real = read.items.filter(i => i.tier !== 'comment');
    const at = (t) => real.filter(i => i.tier === t);
    const all = (list, kind) => list.length > 0 && list.every(i => i.kind === kind);
    const has = (list, kind) => list.some(i => i.kind === kind);
    // Does the picked kind agree with what was read? A disagreement is a flag for him to look at, never a correction.
    const agrees = {
        mythicWeapon: () => all(at('mythic'), 'weapon'),
        mythicCharacter: () => all(at('mythic'), 'character'),
        legendaryGunReactive: () => has(at('legendary'), 'weapon'),
        legendaryGunNonReactive: () => has(at('legendary'), 'weapon'),
        legendaryCharacterWeapon: () => has(at('legendary'), 'weapon') && has(at('legendary'), 'character'),
        doubleLegendaryWeapons: () => at('legendary').filter(i => i.kind === 'weapon').length >= 2,
        doubleEpicCharacters: () => at('epic').filter(i => i.kind === 'character').length >= 2,
        armoryMythicWeapon: () => has(at('mythic'), 'weapon'),
        armoryLegendaryWeapon: () => at('mythic').length === 0 && all(at('legendary'), 'weapon'),
        armoryLegendaryCharacter: () => at('mythic').length === 0 && all(at('legendary'), 'character'),
        advancedWeapon: () => all(at('legendary'), 'weapon'),
        advancedCharacter: () => all(at('legendary'), 'character'),
    };
    if (read.drawKind === 'unknown') flags.push('draw kind unsure');
    else if (agrees[read.drawKind] && !agrees[read.drawKind]()) flags.push(`kind vs items: ${KIND_LABEL[read.drawKind]}`);
    let match = '';
    const s7 = season7.find(k => fp && k.fp === fp);
    if (s7) match = `Season 7 #${s7.n} (${s7.slug})`;
    else {
        const near = season7.map(k => ({ k, ...drawSimilarity(keys, k.keys) })).sort((a, b) => b.score - a.score)[0];
        const sameSlug = season7.find(k => slug && k.slug === slug);
        if (sameSlug) { match = `title = Season 7 #${sameSlug.n} but items differ`; flags.push('Season 7 title, different items'); }
        else if (near && near.score >= SUGGEST_SIMILARITY) { match = `near Season 7 #${near.k.n} (${Math.round(near.score * 100)}%)`; flags.push('near a Season 7 draw'); }
    }
    const idxFp = indexed.find(a => fp && a.fp === fp);
    if (idxFp) { flags.push(`already indexed: ${idxFp.publicId}`); }
    else {
        const idxSlug = indexed.find(a => slug && a.publicId === `draws/${slug}`);
        if (idxSlug) flags.push(`slug taken by different items: ${idxSlug.publicId}`);
    }
    return { fp, slug, match, flags, priceType: read.drawKind === 'unknown' ? '' : read.drawKind };
}

// --- Compare with the earlier LOW-thinking read of the same image, so a level change can be judged by what actually moved ---
function loadPrev(sha1) {
    if (VERIFY) { const f = path.join(OUT_DIR, 'cache', `v4-high-${sha1}.json`); return fs.existsSync(f) ? shape(JSON.parse(fs.readFileSync(f, 'utf8')).parsed) : null; }
    if (THINKING === 'LOW') return null;
    const f = path.join(OUT_DIR, 'cache', `${PREV_VERSION}-low-${sha1}.json`);
    return fs.existsSync(f) ? shape(JSON.parse(fs.readFileSync(f, 'utf8')).parsed) : null;
}
function changeNote(r) {
    const p = r.prevLow;
    if (!p) return '';
    const key = (i) => itemKeys([i])[0];
    const nk = new Set(r.items.map(key)), pk = new Set(p.items.map(key));
    const lost = p.items.filter(i => key(i) && !nk.has(key(i))).map(i => `${i.tier}: ${i.name}`);
    const gained = r.items.filter(i => key(i) && !pk.has(key(i))).map(i => `${i.tier}: ${i.name}`);
    const parts = [];
    if (p.title.toLowerCase() !== r.title.toLowerCase()) parts.push(`title "${p.title}" -> "${r.title}"`);
    if (lost.length || gained.length) parts.push(`items -[${lost.join('; ')}] +[${gained.join('; ')}]`);
    return parts.join(' | ');
}

// --- Main ---
async function main() {
    cloudinary.config(true);
    if (!process.env.CLOUDINARY_URL) throw new Error('CLOUDINARY_URL is not set; run with --env-file=.env.dev');
    fs.mkdirSync(path.join(OUT_DIR, 'cache'), { recursive: true });
    const [season7, indexed] = [loadSeason7(), await loadIndexed()];
    console.error(`Known: ${season7.length} Season 7 draws, ${indexed.length} Cloudinary draw assets (${indexed.filter(a => a.publicId.startsWith('draws/')).length} in draws/)`);
    if (flag('check-index')) { for (const a of indexed) console.log(`${a.publicId} | ${a.title} | ${a.priceType || '-'} | ${a.fp || '-'}`); return; }

    const dir = arg('dir');
    if (!dir || dir === true) throw new Error('Pass --dir "<folder with the draw images>"');
    let files = fs.readdirSync(dir).filter(f => MIME[path.extname(f).toLowerCase()] && !f.startsWith('.')).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    if (arg('files')) files = String(arg('files')).split(',').map(f => f.trim()).filter(Boolean);
    if (arg('only')) files = files.filter(f => f.toLowerCase().includes(String(arg('only')).toLowerCase()));
    if (arg('limit')) files = files.slice(0, Number(arg('limit')));
    console.error(`Reading ${files.length} image(s) from ${dir}`);

    const reads = new Array(files.length);
    let next = 0, done = 0;
    async function worker() {
        while (next < files.length) {
            const i = next++;
            const file = files[i];
            const full = path.join(dir, file);
            try {
                const bytes = fs.readFileSync(full);
                const sha1 = crypto.createHash('sha1').update(bytes).digest('hex');
                const row = { file, sha1, bytes: bytes.length };
                if (bytes.length > MAX_BYTES) throw new Error(`file is ${(bytes.length / 1048576).toFixed(1)} MB, over the ${MAX_BYTES / 1048576} MB limit`);
                const cachePath = path.join(OUT_DIR, 'cache', `${VERIFY ? VERIFY_VERSION : PROMPT_VERSION}-${THINKING.toLowerCase()}-${sha1}.json`);
                let answer;
                if (VERIFY && ONLY_ROWS && !ONLY_ROWS.has(i + 1)) answer = { ...JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'cache', `v4-high-${sha1}.json`), 'utf8')), cached: true, notChecked: true };
                else if (!flag('no-cache') && fs.existsSync(cachePath)) answer = { ...JSON.parse(fs.readFileSync(cachePath, 'utf8')), cached: true };
                else { answer = VERIFY ? await verifyImage(full, bytes, loadPriors(sha1)) : await readImage(full, bytes); fs.writeFileSync(cachePath, JSON.stringify(answer)); }
                const cost = estimateVisionCostUsd(answer.location, answer.usage && { ...answer.usage, promptTokenCount: (answer.usage.promptTokenCount || 0) + (answer.usage.toolUsePromptTokenCount || 0) });
                reads[i] = { ...row, ...shape(answer.parsed), prevLow: loadPrev(sha1), cached: Boolean(answer.cached), costUsd: answer.notChecked ? 0 : cost.estimatedCostUsd, tokens: answer.notChecked ? { input: 0, output: 0, thinking: 0 } : { input: cost.inputTokens, output: cost.outputTokens, thinking: answer.usage?.thoughtsTokenCount || 0 }, ...(VERIFY ? { web: { changes: answer.parsed.changes || [], needsHuman: answer.parsed.needsHuman === true, queries: answer.queries || [], sources: answer.sources || [], checked: !answer.notChecked, schemaless: Boolean(answer.schemaless), noSearch: Boolean(answer.noSearch) } } : {}) };
            } catch (e) {
                reads[i] = { file, error: errText(e) };
            }
            console.error(`[${++done}/${files.length}] ${file} -> ${reads[i].error ? `ERROR ${reads[i].error}` : `${reads[i].title || '(no title)'} (${reads[i].items.length} items)`}`);
        }
    }
    await Promise.all(Array.from({ length: Number(arg('concurrency')) || CONCURRENCY }, worker));

    // Duplicates inside the folder: the same file bytes, or the same item fingerprint.
    const seenFp = new Map(), seenSha = new Map(), seenSlug = new Map();
    for (const r of reads) {
        if (r.error) continue;
        Object.assign(r, compare(r, season7, indexed));
        r.changeNote = changeNote(r);
        if (r.web?.needsHuman) r.flags.push('web check still unsure');
        if (r.web?.noSearch) r.flags.push('web check ran without search (tool limit)');
        if (seenSha.has(r.sha1)) r.flags.push(`same file as ${seenSha.get(r.sha1)}`); else seenSha.set(r.sha1, r.file);
        if (r.fp) { if (seenFp.has(r.fp)) r.flags.push(`same items as ${seenFp.get(r.fp)}`); else seenFp.set(r.fp, r.file); }
        if (r.slug) { if (seenSlug.has(r.slug)) r.flags.push(`same title as ${seenSlug.get(r.slug)}`); else seenSlug.set(r.slug, r.file); }
    }
    fs.writeFileSync(path.join(OUT_DIR, `${OUT_PREFIX}reads.json`), JSON.stringify(reads, null, 2));
    fs.writeFileSync(path.join(OUT_DIR, `${OUT_PREFIX}report.md`), report(reads, season7, indexed));
    const total = reads.reduce((s, r) => s + (r.costUsd || 0), 0);
    console.error(`Done. Estimated Vertex cost this run: $${total.toFixed(4)}. Report: ${path.join(OUT_DIR, `${OUT_PREFIX}report.md`)}`);
    summary(reads);
}

const kindCounts = (ok) => DRAW_KINDS.map(k => [k, ok.filter(r => r.drawKind === k).length]).filter(([, n]) => n).map(([k, n]) => `${KIND_LABEL[k]} ${n}`);

// Short console summary so reading the run costs next to nothing: totals, token use per image, and only the rows that need a look.
function summary(reads) {
    const ok = reads.filter(r => !r.error);
    const base = VERIFY ? ok.filter(r => r.web?.checked) : ok;
    const sum = (f) => base.reduce((t, r) => t + (r.tokens ? r.tokens[f] : 0), 0);
    console.log(`${reads.length} images, ${reads.length - ok.length} failed. Draw kinds: ${kindCounts(ok).join(', ')}`);
    if (base.length) console.log(`Tokens per image (avg): input ${Math.round(sum('input') / base.length)}, output ${Math.round(sum('output') / base.length)} (thinking ${Math.round(sum('thinking') / base.length)})`);
    if (VERIFY) { const q = ok.reduce((t, r) => t + (r.web?.queries?.length || 0), 0); console.log(`Web searches: ${q} (${(q / (base.length || 1)).toFixed(1)} per image); still unsure: ${ok.filter(r => r.web?.needsHuman).length}; schemaless fallback: ${ok.filter(r => r.web?.schemaless).length}`); }
    const ch = reads.map((r, i) => [i + 1, r]).filter(([, r]) => r.changeNote);
    console.log(`Changed vs ${PREV_LABEL}: ${ch.length} of ${ok.length}`);
    for (const [n, r] of ch.slice(0, 20)) console.log(`  row ${n}: ${r.changeNote}`.slice(0, 300));
    const rows = reads.map((r, i) => [i + 1, r]).filter(([, r]) => r.error || r.flags.length);
    for (const [n, r] of rows.slice(0, 10)) console.log(`${n}. ${r.file} | ${r.error ? `ERROR ${r.error}` : `${r.title || '(no title)'} | ${r.flags.join('; ')}`}`.slice(0, 220));
    if (rows.length > 10) console.log(`(+${rows.length - 10} more flagged rows in report.md)`);
}

function report(reads, season7, indexed) {
    const ok = reads.filter(r => !r.error);
    const cell = (s) => String(s ?? '').replace(/\|/g, '/').replace(/\n/g, ' ');
    const flagged = ok.filter(r => r.flags.length);
    const s7hit = new Set(ok.map(r => r.match.match(/^Season 7 #(\d+)/)?.[1]).filter(Boolean));
    const rowsWith = (re) => { const n = reads.map((r, i) => (!r.error && r.flags.some(f => re.test(f)) ? i + 1 : 0)).filter(Boolean); return `${n.length}${n.length ? `: ${n.join(', ')}` : ''}`; };
    const closest = (k) => { const best = ok.map(r => ({ r, s: drawSimilarity(itemKeys(r.items), k.keys).score })).sort((a, b) => b.s - a.s)[0]; return best && best.s >= 0.2 ? `closest is row ${reads.indexOf(best.r) + 1} "${best.r.title || 'no title'}" (${Math.round(best.s * 100)}% of the items)` : 'no image resembles it'; };
    const changedLines = reads.map((r, i) => (r.changeNote ? `- row ${i + 1}: ${r.changeNote}` : '')).filter(Boolean);
    const webLines = reads.map((r, i) => (r.web?.changes?.length ? `- row ${i + 1} (${cell(r.title)}): ${r.web.changes.map(cell).join('; ')}` : '')).filter(Boolean);
    const lines = [
        `# Draw image ${VERIFY ? 'web check' : 'dry run'}`, '',
        `| | |`, `|---|---|`,
        `| Images | ${reads.length} (${reads.length - ok.length} failed) |`,
        `| Flagged | ${flagged.length} |`,
        `| Thinking level | ${THINKING} |`,
        `| Rows changed vs ${PREV_LABEL} | ${changedLines.length} |`,
        ...(VERIFY ? [`| Rows web-checked | ${ok.filter(r => r.web?.checked).length} |`, `| Web searches (total) | ${ok.reduce((t, r) => t + (r.web?.queries?.length || 0), 0)} |`, `| Still unsure after the web check | ${ok.filter(r => r.web?.needsHuman).length} |`] : []),
        `| Draw kinds | ${kindCounts(ok).join(' · ')} |`,
        `| Season 7 draws matched | ${s7hit.size} of ${season7.length} |`,
        `| Cloudinary draw assets already indexed | ${indexed.length} |`,
        `| ${VERIFY ? 'Estimated Vertex token cost of the web check (search fees not included)' : 'Estimated Vertex cost to read them all'} | $${reads.reduce((s, r) => s + (r.costUsd || 0), 0).toFixed(4)} |`, '',
        `Draw kind is the model's read of the screen. The draw kind is the bot price type the model picked from the screen and the items; it is a suggestion, you give the real one. Nothing has been uploaded.`, '',
        `## Rows that need you (row numbers match the table)`, '',
        `- No title: ${rowsWith(/^no title/)}`,
        `- Same title as an earlier image (only one can be draws/<slug>): ${rowsWith(/^same title as/)}`,
        `- Same items as an earlier image: ${rowsWith(/^same items as/)}`,
        `- Already indexed in Cloudinary with these exact items: ${rowsWith(/^already indexed/)}`,
        `- Slug taken by a draw with different items: ${rowsWith(/^slug taken/)}`,
        `- Rarity inferred, not visible (items confidence 70 or less): ${rowsWith(/^low items/)}`,
        `- Draw kind contradicts the items: ${rowsWith(/^kind vs items/)}`,
        ...(VERIFY ? [`- Web check still unsure: ${rowsWith(/^web check still unsure/)}`] : []), '',
        `## Per image`, '',
        `| # | File | Title | Slug | Draw kind | Price type key | Conf T/I/K | Match | Flags |`, `|:-:|---|---|---|---|---|:-:|---|---|`,
        ...reads.map((r, i) => r.error
            ? `| ${i + 1} | ${cell(r.file)} | ERROR | | | | | | ${cell(r.error)} |`
            : `| ${i + 1} | ${cell(r.file)} | ${cell(r.title)} | ${cell(r.slug)} | ${KIND_LABEL[r.drawKind]} | ${r.priceType} | ${r.confidence.title ?? '?'}/${r.confidence.items ?? '?'}/${r.confidence.drawKind ?? '?'} | ${cell(r.match)} | ${cell(r.flags.join('; '))} |`),
        '', `## Changed vs ${PREV_LABEL}`, '',
        ...(changedLines.length ? changedLines : ['none']),
        ...(VERIFY ? ['', `## What the web check says it changed (its own words; the list above is the real diff)`, '', ...(webLines.length ? webLines : ['none'])] : []),
        '', `## Season 7 draws with no matching image`, '',
        ...season7.filter(k => !s7hit.has(String(k.n))).map(k => `- #${k.n} ${k.title} (${k.slug}): ${closest(k)}`), '',
        `## Items per image`, '',
        ...ok.flatMap((r, i) => [`**${i + 1}. ${cell(r.file)}** (${cell(r.title) || 'no title'})`, ...r.items.map(it => `- ${it.tier}: ${cell(it.name)}${it.kind ? ` (${it.kind})` : ''}`), ...(r.observations ? [`- _note: ${cell(r.observations)}_`] : []), ...(r.web?.sources?.length ? [`- _checked: ${cell(r.web.queries.join(' / '))} -> ${[...new Set(r.web.sources.map(x => x.title))].slice(0, 4).join(', ')}_`] : []), '']),
    ];
    return lines.join('\n');
}

main().catch(e => { console.error(`FAILED: ${errText(e)}`); process.exit(1); });
