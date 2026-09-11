// models/AdminUser.js
//
// A runtime-editable admin allowlist that SUPPLEMENTS the hardcoded ALLOWED_ADMIN_ID (utils/owner.js as of the portal operation core, 2026-08-21 00:09 EDT -- commands/manage.js re-exports it) -- the owner stays hardcoded/ultimate; this lets Harkirat grant trusted people admin access via /manage's "Manage Admins" page without a code deploy per grant/revoke. One doc per granted admin (not a single doc with an array) -- keeps grant/revoke/list atomic single-doc operations, matching the per-entity style of Loadout.js/AlertLog.js.
//
// ⚠️ SCHEMA-SAVE GOTCHA (root CLAUDE.md, .claude/rules/models.md): Mongoose only persists fields declared here. Adding a new field elsewhere without declaring it works in memory and silently reverts on the next fetch. Declare the field in the SAME change.
const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true, index: true },
    grantedBy: { type: String, required: true }, // discordId of whoever granted it -- always the
    // owner in practice, since only ALLOWED_ADMIN_ID may grant/revoke/edit-permissions (see utils/adminAccess.js).
    grantedAt: { type: Date, default: Date.now },
    // 🔴 TWO FIELDS, NOT ONE, AND `note` USED TO DO BOTH JOBS BADLY. `title` is the OFFICIAL label — it is what the portal's Access grid prints under the avatar and username, so it is public to anyone who can read that grid and it is required at grant time. `note` is private: a reminder to the owner about who this person is, shown only inside the drawer. Split on Harkirat's instruction, 2026-09-11 16:40 EDT. ⚠️ THERE IS NO DATABASE MIGRATION AND THERE DELIBERATELY IS NOT ONE. A row granted before the split carries a `note` and no `title`, so every reader falls back to `title || note` and the Edit drawer seeds its Title field from the old note — the rename happens on the next save, per row, rather than as a one-shot script against live permissions.
    title: { type: String, default: '' },
    note: { type: String, default: '' }, // private; was the grid label until the 2026-09-11 split above
    // Per-command access (added 2026-08-13) -- subset of utils/adminAccess.js's ADMIN_COMMANDS ('manage'/'bot'/'autobuild'/'destructive'), plus 'manage.<page>' scopes. Always non-empty -- an admin with zero permissions should be revoked, not left in a zero-permission limbo state. ⚠️ 'destructive' (2026-08-25) is the odd one: it names no surface, it grants the right to run operations that cannot be undone on ALL of them. `all` deliberately does not expand to it (see NOT_IN_ALL in utils/adminAccess.js), so it can only arrive here by being typed.
    permissions: { type: [String], required: true }
});

module.exports = mongoose.model('AdminUser', adminUserSchema);
