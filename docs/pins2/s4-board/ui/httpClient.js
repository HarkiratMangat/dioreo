// Board 3 version 2 — BOARD ONLY. This file replaces portal/ui/httpClient.js inside local/pins2-board-3/v2 and nowhere else.
//
// The board runs the portal's own components (copied verbatim from portal/public/ui) so what Harkirat clicks on the board is what the portal does. Every GET answers with what the dev portal returned on 2026-09-15 (data/*.js, written by capture.cjs), so the rows are real dev data. Every write stages into an in-page store instead of a database, so staging, the tray, dashed staged rows and Discard all behave; nothing leaves the page.
// Same contract as the real client: a request always resolves, and it resolves on a later tick.
import CSRF from '../data/csrf.js';
import ARMORY from '../data/armory.js';
import REVIEW from '../data/review.js';
import BROADCAST from '../data/broadcast.js';
import ANALYTICS from '../data/analytics.js';
import ANALYTICS300 from '../data/analytics300.js';
import CHANGESET from '../data/changeset.js';
import PREVIEWS from '../data/previews.js';

const builds = () => ARMORY.builds;
const buildById = (id) => builds().find((b) => String(b._id) === String(id));
const TIER = (type) => (/delete|purge|remove/i.test(type) ? 2 : 1);
const staged = [];
let seq = 0;

function nameOf(op) {
    const id = (op.target && (op.target.id || op.target._id)) || (op.payload && op.payload.id);
    const b = id && buildById(id);
    if (b) return `${b.weaponName} · ${b.buildName || 'Build'}`;
    const ids = op.payload && Array.isArray(op.payload.ids) ? op.payload.ids : [];
    if (ids.length) return ids.length === 1 && buildById(ids[0]) ? `${buildById(ids[0]).weaponName} · ${buildById(ids[0]).buildName}` : `${ids.length} builds`;
    return (op.payload && (op.payload.weaponName || op.payload.title || op.payload.text)) || op.type;
}

function reviewPayload() {
    const ops = staged.flatMap((cs) => cs.ops.map((o, index) => ({
        id: `${cs._id}:${index}`, changesetId: cs._id, index, realm: cs.realm, op: o.type, tier: cs.tier,
        name: nameOf(o), verb: /delete/i.test(o.type) ? 'deleted' : /add|create/i.test(o.type) ? 'added' : 'changed',
        rows: Object.entries(o.payload || {}).filter(([k]) => k !== 'ids' && k !== 'id').slice(0, 6).map(([key, to]) => ({ key, from: null, to: Array.isArray(to) ? to.join(', ') : to })),
        destroys: cs.tier === 3, exported: false, exportedAt: null, stale: false, staleChecked: true, blocked: null,
        confirmText: cs._id.toUpperCase(),
        targetIds: [o.target && (o.target.id || o.target._id), o.payload && o.payload.id, ...((o.payload && Array.isArray(o.payload.ids)) ? o.payload.ids : [])].filter(Boolean).map(String),
    })));
    const changesets = staged.map((cs) => ({ id: cs._id, realm: cs.realm, tier: cs.tier, state: 'staged', exportedAt: null, confirmText: cs._id.toUpperCase(), opCount: cs.ops.length, gate: { ok: cs.tier !== 3, reason: cs.tier === 3 ? 'export required' : null } }));
    return { ops: [...REVIEW.ops, ...ops], changesets: [...REVIEW.changesets, ...changesets] };
}

function exportText(list) {
    return list.map((l) => {
        const badges = [l.isMeta ? 'meta' : null, l.categoryRank, l.dmzRangeRank ? String(l.dmzRangeRank).replace('-', '') : null, l.isToxic ? 'toxic' : null].filter(Boolean).join(', ');
        const lines = [`${l.weaponName} | ${l.category}`];
        if (l.buildName) lines.push(`Build: ${l.buildName}`);
        if (l.imageKey && !String(l.imageKey).startsWith('http')) lines.push(`Image: ${l.imageKey}`);
        if (l.shareCode) lines.push(`Code: ${l.shareCode}`);
        if (badges) lines.push(`Badges: ${badges}`);
        lines.push(...(l.attachments || []).map((a) => `- ${a}`));
        return lines.join('\n');
    }).join('\n\n');
}

// The block grammar the real parser reads (utils/adminParser.js), narrowed the same way the fixture harness narrows it; "existing" is decided against the real dev builds.
function parseBulk(body) {
    const mode = (body && body.mode) === 'DMZ' ? 'DMZ' : 'MP';
    const KEYS = { build: 'buildName', image: 'imageKey', code: 'shareCode', badges: 'badges' };
    const blocks = String((body && body.text) || '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
    const rows = []; const errors = [];
    for (const block of blocks) {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        const head = lines[0];
        const snippet = head.length > 60 ? `${head.slice(0, 60)}...` : head;
        const parts = head.split('|').map((x) => x.trim());
        if (!parts[0] || !parts[1]) { errors.push(`"${snippet}" -- a block's first line must be "Weapon | Category", and both halves are required.`); continue; }
        const fields = {}; const attachments = []; let badKey = null;
        for (const line of lines.slice(1)) {
            if (/^[-*•]\s+/.test(line)) { attachments.push(line.replace(/^[-*•]\s+/, '').trim()); continue; }
            const keyed = /^([A-Za-z ]+):\s*(.*)$/.exec(line);
            if (!keyed) { attachments.push(line); continue; }
            const key = keyed[1].trim().toLowerCase();
            if (!Object.prototype.hasOwnProperty.call(KEYS, key)) { badKey = keyed[1].trim(); break; }
            fields[KEYS[key]] = keyed[2].trim();
        }
        if (badKey) { errors.push(`"${snippet}" -- unrecognized field "${badKey}:". Valid fields are Build, Image, Code and Badges.`); continue; }
        if (!attachments.length) { errors.push(`"${snippet}" -- no attachment lines found under the header`); continue; }
        const weaponKey = parts[0].toLowerCase().replace(/\s+/g, '');
        const buildName = fields.buildName || 'Standard Build';
        rows.push({ weaponName: parts[0], buildName, category: parts[1].toUpperCase(), attachments: attachments.length, imageKey: fields.imageKey || '', shareCode: fields.shareCode || '',
            existing: builds().some((b) => b.mode === mode && String(b.weaponName).toLowerCase().replace(/\s+/g, '') === weaponKey && (b.buildName || 'Standard Build') === buildName) });
    }
    return { mode, blocks: blocks.length, rows, errors };
}

const ROUTES = [
    [/^\/auth\/csrf$/, () => CSRF],
    [/^\/api\/armory$/, () => ARMORY],
    [/^\/api\/review$/, () => reviewPayload()],
    [/^\/api\/broadcast$/, () => BROADCAST],
    [/^\/api\/analytics$/, (q) => (Number(q.get('river')) > 100 ? ANALYTICS300 : ANALYTICS)],
    [/^\/api\/armory\/preview$/, (q) => PREVIEWS[q.get('id')] || { card: null }],
    [/^\/api\/armory\/export$/, (q) => {
        const ids = String(q.get('ids') || '').split(',').filter(Boolean);
        const mode = q.get('mode'); const cat = (q.get('category') || '').toUpperCase();
        const list = ids.length ? builds().filter((b) => ids.includes(String(b._id))) : builds().filter((b) => (!mode || b.mode === mode) && (!cat || String(b.category).toUpperCase() === cat));
        return { text: exportText(list), count: list.length };
    }],
    [/^\/api\/parse-bulk\/loadout$/, (q, body) => parseBulk(body)],
    // The board has no server, so it reads the phrases a board state types — "in 3 days", "tomorrow", "Sep 20" — the way chrono would.
    // Board chrome only: the portal's /api/parse-date is chrono-node on the server and is never replaced by this.
    [/^\/api\/parse-date$/, (q) => {
        const raw = String(q.get('q') || '').trim().toLowerCase(); const d = new Date(); d.setHours(12, 0, 0, 0);
        const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        let m; let ok = true;
        if ((m = raw.match(/^in (\d+) (day|week)s?$/))) d.setDate(d.getDate() + Number(m[1]) * (m[2] === 'week' ? 7 : 1));
        else if (raw === 'tomorrow') d.setDate(d.getDate() + 1);
        else if (raw === 'today') { /* today */ }
        // the board's own hint suggests “Friday”, so the board's stand-in parser must read a weekday (chrono-node on the server does); 2026-09-27
        else if ((m = raw.replace(/^(sun|mon|tue|wed|thu|fri|sat)[a-z]*,? (?=[a-z]{3})/, '').match(/^([a-z]{3})[a-z]* (\d{1,2})$/)) && MON.includes(m[1]) && raw !== `${m[1]} ${m[2]}`) { d.setMonth(MON.indexOf(m[1]), Number(m[2])); if (d < new Date()) d.setFullYear(d.getFullYear() + 1); }
        else if ((m = raw.match(/^(next )?(sun|mon|tue|wed|thu|fri|sat)[a-z]*$/))) { const want = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(m[2]); let n = (want - d.getDay() + 7) % 7 || 7; if (m[1]) n += n < 7 ? 7 : 0; d.setDate(d.getDate() + n); }
        else if ((m = raw.match(/^([a-z]{3})[a-z]* (\d{1,2})$/)) && MON.includes(m[1])) { d.setMonth(MON.indexOf(m[1]), Number(m[2])); if (d < new Date()) d.setFullYear(d.getFullYear() + 1); }
        else ok = false;
        return { q: q.get('q'), iso: ok ? d.toISOString().slice(0, 10) : null };
    }],
    [/^\/api\/changeset$/, (q, body) => {
        if (!body) return { changesets: [...CHANGESET.changesets, ...staged] };
        const ops = body.ops || [];
        const cs = { _id: `b3cs${++seq}`, realm: body.realm, tier: Math.max(1, ...ops.map((o) => o.tier || TIER(o.type))), state: 'staged', ops, exportedAt: null, createdAt: new Date().toISOString() };
        staged.push(cs);
        return { changesetId: cs._id, state: 'staged', tier: cs.tier, failures: [], preview: [] };
    }],
    [/^\/api\/changeset\/[^/]+\/(discard|commit)$/, (q, body, path) => {
        const id = path.split('/')[3];
        const i = staged.findIndex((c) => c._id === id);
        if (i >= 0) staged.splice(i, 1);
        return { ok: true };
    }],
    [/^\/api\/changeset\/[^/]+\/preview$/, () => ({ preview: null })],
    [/^\/api\/revert\//, () => ({ ok: true })],
];

export async function fetchJson(path, opts) {
    const [pathname, query = ''] = String(path).split('?');
    let body = null;
    try { body = opts && opts.body ? JSON.parse(opts.body) : null; } catch (e) { body = null; }
    await new Promise((r) => setTimeout(r, 0));
    for (const [re, make] of ROUTES) if (re.test(pathname)) return make(new URLSearchParams(query), body, pathname);
    return { ok: true };
}

export const __board = { staged, builds };
window.__b3data = __board;
