// portal/ui/broadcast.logic.js — CommonJS, imports nothing. Pure op-builders for the Broadcast realm, tested directly by scripts/portalRealms.test.js.
//
// core/ops/announcements.js's validatePost() treats a payload that already carries an `expiresAt` key (even null) as ALREADY NORMALIZED and skips its computeExpiresAt() day-count parsing entirely -- see that file's own alreadyNormalized() note. Both op-builders below always include expiresAt (possibly null) for exactly that reason: a portal-composed op is never the raw "type a day count" modal flow, it always carries a real value (or null for "never expires").
function buildBroadcastAddOp(fields) {
    return {
        type: 'announcement.post', target: null,
        payload: { text: fields.text, expiresAt: fields.expiresAt || null, startsAt: fields.startsAt || null, color: fields.color ?? null },
    };
}

// Edits one field of an existing row, preserving the rest -- announcement.edit's validate() rebuilds the record the same already-normalized way (see the note above), and its real target shape is { id } (core/ops/announcements.js: `Announcement.findById(op.target.id)`).
function buildBroadcastEditOp(row, columnKey, newValue) {
    return {
        type: 'announcement.edit', target: { id: row.id },
        payload: { text: row.text, expiresAt: row.expiresAt || null, startsAt: row.startsAt || null, bannerImageUrl: row.bannerImageUrl || null, repeatCount: row.repeatCount ?? null, [columnKey]: newValue },
    };
}

// ── THE COMPOSER'S OWN BUILDER — pins batch 2, §10.3 ─────────────────────────────────────────────
//
// 🔴 ROW 1's BUG, FIXED HERE RATHER THAN AT THE CALL SITE, because it is a payload-SHAPE fact and belongs beside the other payload-shape facts in this file. Measured against the real validate(): a portal blank sent `expiresAt: null` (alreadyNormalized -> true -> "never" adopted verbatim), while a /manage blank sends no `expiresAt` key at all (alreadyNormalized -> false -> computeExpiresAt('') -> the server's real 60-day default). Those are different facts and were colliding into the same wrong one. `fields.expiresAt` now carries THREE distinct states rather than two: `undefined` (the field was left blank -- omit the key so the 60-day default applies), `null` (the admin flipped "Never ends" -- send the real never-expires value), or an ISO date string (a resolved date).
function buildBroadcastComposerOp(fields, initial) {
    const payload = {
        text: fields.text,
        startsAt: fields.startsAt || null,
        bannerImageUrl: fields.bannerImageUrl || null,
        // 1 (the floor) means "show once" in the record's own terms -- repeatCount is null there, not 1; see core/ops/announcements.js's own comment on the field. Anything above 1 is a real repeat.
        repeatCount: fields.repeatCount && fields.repeatCount > 1 ? fields.repeatCount : null,
    };
    if (fields.expiresAt !== undefined) payload.expiresAt = fields.expiresAt;
    if (!initial) {
        payload.color = fields.color ?? null;
        return { type: 'announcement.post', target: null, payload };
    }
    return { type: 'announcement.edit', target: { id: initial.id || initial._id }, payload };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildBroadcastAddOp, buildBroadcastEditOp, buildBroadcastComposerOp };
}
