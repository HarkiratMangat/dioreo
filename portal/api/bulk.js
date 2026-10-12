// portal/api/bulk.js
//
// 🔴 THE BOT'S OWN BULK PARSERS, NOT A SECOND SET. `parseBulkDrawList` and `parseBulkEvents` in utils/adminParser.js are what /manage has ingested pasted lists with since it was built — including every trap already paid for there: a date written "July 16, 2026" splits into two comma fields and has to be rejoined, a bulleted paste out of Notes arrives as ONE line and has to be scanned per line or the last entry swallows everything after it. Re-implementing that in the browser would be a second grammar behind one promise, and the portal would preview rows the bot would then parse differently.
//
// ⚠️ IT PARSES AND RETURNS, IT DOES NOT STAGE. The composer shows what it understood and the person presses Stage — that is the whole point of a preview, and it is why this is a parse endpoint rather than a bulk-add one. `npm run portal:roundtrip` already checks these parsers against the exports that feed them; this route adds no third opinion.
const { parseBulkDrawList, parseBulkEvents } = require('../../utils/adminParser');
const { sendJson, readJsonBody } = require('./httpUtil');

const iso = (d) => (d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : null);

function register(route) {
    const { requireAdmin } = require('../auth');

    // POST /api/parse-bulk { kind: 'draw'|'returning'|'event'|'playlist', text } -> { rows: [{ name, start, end, ok }] }
    route('POST', /^\/api\/parse-bulk$/, requireAdmin(async (req, res) => {
        const body = await readJsonBody(req);
        const text = String(body.text || '');
        if (text.length > 20000) return sendJson(res, 400, { error: 'that is more text than a season has' });
        const kind = String(body.kind || 'draw');
        const isDraw = kind === 'draw' || kind === 'returning';
        const rows = isDraw
            ? parseBulkDrawList(text).map((d) => ({ name: d.title, start: iso(d.date), end: iso(d.date), items: d.items || [] }))
            : parseBulkEvents(text).map((e) => ({ name: e.title, start: iso(e.startDate), end: iso(e.endDate || e.startDate) }));
        // A row the parser could not date is REPORTED, never dropped: a paste where three of eight lines fell out silently is the failure a preview exists to prevent.
        sendJson(res, 200, { kind, rows: rows.map((r) => ({ ...r, ok: Boolean(r.name && r.start) })) });
    }));

    // POST /api/parse-bulk/loadout { mode, text } -> { mode, blocks, rows, errors }
    //
    // 🔴 MODE IS A PARAMETER, NEVER A PARSED FIELD, and that is the bot's own behaviour rather than a simplification. core/ops/loadouts.js's upsertBulkBlocks does `{ ...rawEntry, mode }` unconditionally, and the block format dropped its Mode segment on 2026-08-22 — so a block typed DMZ and pasted on the MP page saves as MP. Reading a mode out of the text here would preview one thing and save another.
    //
    // ⚠️ IT PARSES AND LOOKS UP; IT NEVER WRITES. `existing` is the same match key the upsert uses (weaponKey + mode + buildName), read here only so the preview can say update-or-new before anything is staged. A separate route from /api/parse-bulk above because this one reads the Loadout collection and therefore has to check the Armory pages, which a pure text parse does not.
    route('POST', /^\/api\/parse-bulk\/loadout$/, requireAdmin(async (req, res, url, session) => {
        const grantedPages = await grantedPagesFor(session.discordId, ARMORY_PAGES);
        if (grantedPages.length === 0) return forbidden(res, 'forbidden');
        const body = await readJsonBody(req);
        const text = String(body.text || '');
        if (text.length > 60000) return sendJson(res, 400, { error: 'that is more text than the armory holds' });
        const mode = MODES.includes(body.mode) ? body.mode : 'MP';
        const { parsed, errors } = parseBulkLoadoutList(text);
        const keys = parsed.map((p) => ({ weaponKey: p.weaponKey, mode, buildName: p.buildName }));
        const existing = keys.length ? await Loadout.find({ $or: keys }).select('weaponKey mode buildName').lean() : [];
        const seen = new Set(existing.map((e) => `${e.weaponKey}\u0000${e.mode}\u0000${e.buildName}`));
        sendJson(res, 200, {
            mode, blocks: blockCount(text), errors,
            rows: parsed.map((p) => ({
                weaponName: p.weaponName, buildName: p.buildName, category: p.category,
                attachments: p.attachments.length, imageKey: p.imageKey, shareCode: p.shareCode,
                isMeta: p.isMeta, isToxic: p.isToxic, categoryRank: p.categoryRank, dmzRangeRank: p.dmzRangeRank,
                existing: seen.has(`${p.weaponKey}\u0000${mode}\u0000${p.buildName}`),
            })),
        });
    }));
}

module.exports = { register };
