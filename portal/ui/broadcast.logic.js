// portal/ui/broadcast.logic.js — CommonJS, imports nothing. Pure op-builders for the Broadcast
// realm, tested directly by scripts/portalRealms.test.js.
//
// core/ops/announcements.js's validatePost() treats a payload that already carries an `expiresAt`
// key (even null) as ALREADY NORMALIZED and skips its computeExpiresAt() day-count parsing entirely
// -- see that file's own alreadyNormalized() note. Both op-builders below always include expiresAt
// (possibly null) for exactly that reason: a portal-composed op is never the raw "type a day count"
// modal flow, it always carries a real value (or null for "never expires").
function buildBroadcastAddOp(fields) {
    return {
        type: 'announcement.post', target: null,
        payload: { text: fields.text, expiresAt: fields.expiresAt || null, startsAt: fields.startsAt || null, color: fields.color ?? null },
    };
}

// Edits one field of an existing row, preserving the rest -- announcement.edit's validate() rebuilds
// the record the same already-normalized way (see the note above), and its real target shape is
// { id } (core/ops/announcements.js: `Announcement.findById(op.target.id)`).
function buildBroadcastEditOp(row, columnKey, newValue) {
    return {
        type: 'announcement.edit', target: { id: row.id },
        payload: { text: row.text, expiresAt: row.expiresAt || null, startsAt: row.startsAt || null, [columnKey]: newValue },
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildBroadcastAddOp, buildBroadcastEditOp };
}
