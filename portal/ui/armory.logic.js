// portal/ui/armory.logic.js — CommonJS, imports nothing. Pure op-builders + the badges-token parser for the Armory realm, tested directly by scripts/portalRealms.test.js.
//
// parseBadgesToken() is a client-side port of utils/adminParser.js's parseLoadoutBadges() -- that function lives in a Node-only module (chrono-node/dayjs deps) the browser bundle never loads, so this reproduces its exact grammar rather than reaching across the server boundary. Any change to the real parser's token vocabulary must be mirrored here.
function parseBadgesToken(badgesStr, mode) {
    const tokens = (badgesStr || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
    let isMeta = false;
    let categoryRank = null;
    let dmzRangeRank = null;
    let isToxic = false;
    const unrecognized = [];

    for (const token of tokens) {
        if (token === 'meta') { isMeta = true; continue; }
        if (token === 'best') { categoryRank = 'best'; continue; }
        if (token === 'toxic') { isToxic = true; continue; }
        const rangeMatch = token.match(/^(best|top\s*\d+)(close|midlong)$/);
        if (rangeMatch) {
            const tier = rangeMatch[1].replace(/\s+/g, '');
            dmzRangeRank = `${tier}-${rangeMatch[2]}`;
            continue;
        }
        const topMatch = token.match(/^top\s*(\d+)$/);
        if (topMatch) { categoryRank = `top${topMatch[1]}`; continue; }
        unrecognized.push(token);
    }
    // DMZ never uses the per-category Best/TopN system -- same swap handlers/manage/loadouts.js applies server-side (a bare "best"/"topN" token doesn't know the mode on its own, so it moves over to dmzRangeRank here instead once the mode is known).
    if (mode === 'DMZ' && categoryRank && !dmzRangeRank) {
        dmzRangeRank = categoryRank;
        categoryRank = null;
    }
    return { isMeta, categoryRank, dmzRangeRank, isToxic, unrecognized };
}

// core/ops/loadouts.js's loadout.add/loadout.edit both run every payload field through validateBuild(), which REQUIRES weaponName + a valid mode and recomputes weaponKey itself -- callers never need to derive it. loadout.edit's real target shape is { id } (confirmed reading core/ops/loadouts.js's 'loadout.edit' entry in full: `Loadout.findById(op.target.id)`), matching loadout.delete/bulkDelete's own `{ id }`/`{ ids }` shapes. ⚠️ shareCode is NOT collected here, and this Armory form is now BEHIND Discord's own /manage on this front (reversed 2026-08-22 20:18 EDT -- this comment used to say "the real /manage add-loadout modal has no field for it either", which was true when written but is no longer true: Discord's Add/Edit Loadout modal now accepts "Build Name | Share Code" as a pipe-delimited convention on its existing `build` field, precisely because Discord modals cap at 5 fields with all 5 already used, so a real 6th field was never possible there -- see commands/manage.js/handlers/manage/loadouts.js. THIS form has no such 5-field constraint (it's a web form), so adding a real, dedicated Share Code input here would be more straightforward than the Discord workaround, not blocked by it. Filed as a follow-up in docs/db-deferred-list.md, not built here. Until then: on EDIT, this form still cannot show or change an existing (possibly /autobuild-set) shareCode at all -- the op-layer contract this comment originally described still holds and is still correct: see core/ops/loadouts.js's own header for why an always-present '' payload key would silently wipe a real gunsmith code on an EDIT (add is unaffected -- there is nothing yet to wipe on a new build). ⚠️ BADGES ARRIVE TWO WAYS NOW, and the token path stays because it is what a paste and a bulk apply speak. The add FORM sets the four fields directly — it has real controls, so making it serialise `meta, top3` into a string for this function to parse back would be a round trip through a grammar that exists for text input. An explicit field wins over the token when both are present.
//
// 🔴 shareCode IS OMITTED WHEN BLANK RATHER THAN SENT EMPTY. core/ops/loadouts.js spreads this payload straight into a Mongo $set, and its own header says an always-present '' would wipe a real code. Nothing exists to wipe on an ADD — but the two op-builders here must speak one contract, or the rule holds in one place and not the other, which is how it stops being a rule.
function buildArmoryAddOp(fields) {
    const token = parseBadgesToken(fields.badges, fields.mode);
    const pick = (explicit, fromToken) => (explicit === undefined ? fromToken : explicit);
    const shareCode = (fields.shareCode || '').trim();
    return {
        type: 'loadout.add', target: null,
        payload: {
            weaponName: fields.weaponName, category: fields.category, mode: fields.mode,
            buildName: fields.buildName || 'Standard Build', imageKey: fields.imageKey || '',
            attachments: fields.attachments || [],
            description: fields.description || '',
            ...(shareCode ? { shareCode } : {}),
            isMeta: Boolean(pick(fields.isMeta, token.isMeta)),
            isToxic: Boolean(pick(fields.isToxic, token.isToxic)),
            categoryRank: pick(fields.categoryRank, token.categoryRank) || null,
            dmzRangeRank: pick(fields.dmzRangeRank, token.dmzRangeRank) || null,
        },
    };
}

// The vocabulary utils/adminParser.js's parseLoadoutBadges accepts, spelled the way core/ops stores it. A DMZ build ranks on a combat RANGE as well as a tier, which is why it is one field of compound values rather than two.
const DMZ_RANGE_TOKENS = ['best-close', 'best-midlong', 'top3-close', 'top3-midlong', 'top5-close', 'top5-midlong'];
const MP_RANK_TOKENS = ['best', 'top3', 'top4', 'top5'];

// Edits one field of an existing row, preserving the rest -- loadout.edit's validate() needs the full build (weaponName/mode/etc), not a partial patch, same contract as every other entity's edit op in this portal.
function buildArmoryEditOp(row, columnKey, newValue) {
    const payload = { ...row, [columnKey]: newValue };
    delete payload.id; delete payload.coverage; delete payload.accent;
    return { type: 'loadout.edit', target: { id: row.id }, payload };
}

// ── THE BULK PASTE ────────────────────────────────────────────────────────────────────────────
//
// 🔴 A PASTE PREVIEW THAT ONLY COUNTS THE ERROR ARRAY LIES IN BOTH DIRECTIONS. utils/adminParser.js's parseBulkLoadoutList pushes an error and drops the block when it cannot read the header, and pushes an error but KEEPS the block when a badge token is unrecognised — so "6 problems" over a paste where four builds saved fine is both alarming and wrong, and "4 understood, 6 errors" reads as arithmetic nobody can follow. The server returns the BLOCK count, which makes the split exact: a block either parsed or it did not.
//
// ⚠️ THE DECOMPOSITION IS DERIVED FROM THAT PARSER'S CONTROL FLOW, not assumed — every rejecting branch there ends in `continue`, and the badge branch is the only one that pushes an error and falls through to `parsed.push`. scripts/portalArmoryBulk.test.js asserts it against the real parser on real text, so a change to the parser fails a test instead of silently re-conflating the two.
function bulkPasteSummary(result) {
    const rows = (result && result.rows) || [];
    const errors = (result && result.errors) || [];
    const blocks = Number.isFinite(result && result.blocks) ? result.blocks : rows.length;
    const rejected = Math.max(0, blocks - rows.length);
    const updates = rows.filter((r) => r.existing).length;
    return {
        blocks, understood: rows.length, rejected,
        warnings: Math.max(0, errors.length - rejected),
        updates, creates: rows.length - updates,
        canStage: rows.length > 0,
    };
}

// ⚠️ SELECTION STAYS FIRST. The Manifest's own "Export selection" has always sent `ids`, and the route still reads that before anything else — the two new scopes are additions, not a replacement, and reordering them here would silently change what an existing button exports.
function armoryExportQuery({ scope, mode, category, ids }) {
    if (scope === 'selection') return `ids=${(ids || []).join(',')}`;
    if (scope === 'category' && category) return `mode=${encodeURIComponent(mode)}&category=${encodeURIComponent(category)}`;
    return `mode=${encodeURIComponent(mode)}`;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildArmoryAddOp, buildArmoryEditOp, parseBadgesToken, bulkPasteSummary, armoryExportQuery, DMZ_RANGE_TOKENS, MP_RANK_TOKENS };
}
