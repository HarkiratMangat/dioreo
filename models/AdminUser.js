// models/AdminUser.js
//
// A runtime-editable admin allowlist that SUPPLEMENTS the hardcoded ALLOWED_ADMIN_ID
// (commands/manage.js) -- the owner stays hardcoded/ultimate; this lets Harkirat grant trusted
// people admin access via /manage's "Manage Admins" page without a code deploy per grant/revoke.
// One doc per granted admin (not a single doc with an array) -- keeps grant/revoke/list atomic
// single-doc operations, matching the per-entity style of Loadout.js/AlertLog.js.
//
// ⚠️ SCHEMA-SAVE GOTCHA (root CLAUDE.md, .claude/rules/models.md): Mongoose only persists fields
// declared here. Adding a new field elsewhere without declaring it works in memory and silently
// reverts on the next fetch. Declare the field in the SAME change.
const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true, index: true },
    grantedBy: { type: String, required: true }, // discordId of whoever granted it -- always the
    // owner in practice, since only ALLOWED_ADMIN_ID may grant/revoke/edit-permissions (see
    // utils/adminAccess.js).
    grantedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' }, // optional label the owner can add when granting (e.g. a name)
    // Per-command access (added 2026-08-13) -- subset of utils/adminAccess.js's ADMIN_COMMANDS
    // ('manage'/'alerts'/'autobuild'). Always non-empty -- an admin with zero permissions should
    // be revoked, not left in a zero-permission limbo state.
    permissions: { type: [String], required: true }
});

module.exports = mongoose.model('AdminUser', adminUserSchema);
