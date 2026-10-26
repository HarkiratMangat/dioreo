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
    // 🔴 THE GRANT, since the permission restructure (2026-10-19 19:23 EDT, docs/superpowers/specs/2026-10-19-permission-restructure-design.md). One entry per scope (a command like 'manage', or a page like 'manage.calendar' / 'bot.health'), each holding the tiers granted there: 'create', 'destructive' or both. core/permissions.js is the table that says what a scope carries and what each action needs; this is only what was granted. Written by /bot access (owner-only). Non-empty for every admin -- someone with nothing granted should be revoked, not left in a zero-permission limbo.
    grants: {
        type: [{
            _id: false,
            scope: { type: String, required: true },
            tiers: { type: [String], required: true },
        }],
        default: [],
    },
    // ⚠️ LEGACY, read only when `grants` is empty. The retired flat token list ('manage', 'manage.<page>', 'bot', 'autobuild', 'destructive'). The portal's Access realm still writes it until the pins2 hand-off lands, so core/permissions.js's legacyToGrants() bridges it rather than ignoring it. No longer required: a row granted by /bot access has `grants` and an empty list here. scripts/purgeLegacyAdminGrants.js removes the rows that still depend on it (dry run by default; the prod run waits for Harkirat's word).
    permissions: { type: [String], default: [] }
});

// 🔴 A WRITE OF THE OLD `permissions` LIST CLEARS `grants`, until the portal hand-off lands (2026-10-19 19:36 EDT). The portal's Access realm still saves the old token list and knows nothing of `grants`. core/permissions.js's grantsOf() reads `grants` whenever it is non-empty, so without this an owner editing in the portal an admin who had been granted from /bot access would save, see the grid update, and change nothing at all: the old grants would keep winning. Clearing them makes the portal's write the one that counts, read through the legacy bridge. A write that sets `grants` itself (/bot access) is left alone. Delete this with the bridge.
adminUserSchema.pre(['findOneAndUpdate', 'updateOne'], function clearGrantsOnLegacyWrite() {
    const update = this.getUpdate() || {};
    const set = update.$set || {};
    const touchesPermissions = 'permissions' in update || 'permissions' in set;
    const touchesGrants = 'grants' in update || 'grants' in set;
    if (touchesPermissions && !touchesGrants) this.set('grants', []);
});

module.exports = mongoose.model('AdminUser', adminUserSchema);
