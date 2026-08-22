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

// core/ops/loadouts.js's loadout.add/loadout.edit both run every payload field through validateBuild(), which REQUIRES weaponName + a valid mode and recomputes weaponKey itself -- callers never need to derive it. loadout.edit's real target shape is { id } (confirmed reading core/ops/loadouts.js's 'loadout.edit' entry in full: `Loadout.findById(op.target.id)`), matching loadout.delete/bulkDelete's own `{ id }`/`{ ids }` shapes. shareCode is deliberately never collected here -- the real /manage add-loadout modal has no field for it either (only /autobuild sets it); see core/ops/loadouts.js's own header for why an always-present '' would silently wipe a real gunsmith code on an EDIT (add is unaffected -- there is nothing yet to wipe on a new build).
function buildArmoryAddOp(fields) {
    const badges = parseBadgesToken(fields.badges, fields.mode);
    return {
        type: 'loadout.add', target: null,
        payload: {
            weaponName: fields.weaponName, category: fields.category, mode: fields.mode,
            buildName: fields.buildName || 'Standard Build', imageKey: fields.imageKey || '',
            attachments: fields.attachments || [],
            isMeta: badges.isMeta, isToxic: badges.isToxic,
            categoryRank: badges.categoryRank, dmzRangeRank: badges.dmzRangeRank,
        },
    };
}

// Edits one field of an existing row, preserving the rest -- loadout.edit's validate() needs the full build (weaponName/mode/etc), not a partial patch, same contract as every other entity's edit op in this portal.
function buildArmoryEditOp(row, columnKey, newValue) {
    const payload = { ...row, [columnKey]: newValue };
    delete payload.id; delete payload.coverage; delete payload.accent;
    return { type: 'loadout.edit', target: { id: row.id }, payload };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildArmoryAddOp, buildArmoryEditOp, parseBadgesToken };
}
