// models/GuildSettings.js
//
// Per-GUILD (server) settings, set by that server's own admins via /admin. Distinct from models/UserPreference.js, which is per-USER and travels with the person across every server.
//
// This model holds a RESPONSE-VISIBILITY POLICY, not an access-control list, and the distinction is deliberate: the bot holds no moderation permission and, by root CLAUDE.md's hard invariant, never posts outside the interaction that triggered it (the guild install has asked for message permissions since 2026-10-20 10:15 EDT, for v4's text commands, but no code uses them), so it cannot delete a message or hide an invocation. The one thing it CAN enforce is whether its own response is public or ephemeral. Since the bot is slash-command-only, an ephemeral answer is a complete experience for the invoker while being invisible to everyone else -- which is why "blocked in this channel" means forced-ephemeral here rather than refused. Design + the rejected alternatives: docs/superpowers/specs/2026-08-10-server-admin-visibility-policy-design.md.
//
// ⚠️ SCHEMA-SAVE GOTCHA (root CLAUDE.md, .claude/rules/models.md): Mongoose only persists fields declared here. Adding `doc.someNewField = x; await doc.save()` without declaring it works in memory and silently reverts on the next fetch. Declare the field in the SAME change.
const mongoose = require('mongoose');

// Both rule kinds carry the same two-value visibility, so they share a validator. 'public' does NOT mean "force public" -- see utils/guildPolicy.js: the policy is a ceiling, not a floor. A 'public' verdict only PERMITS a public response; the user's own /settings preference still decides.
const VISIBILITY = { type: String, enum: ['public', 'ephemeral'], required: true };

const guildSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true, index: true },

    // Server-wide baseline. 'public' by default: a bot that is inert or silent on join looks broken and gets removed before anyone finds /admin. Discord's own "Use Application Commands" and "Use External Apps" permissions already give admins a per-channel and per-role gate on day one, so an open default is not an ungoverned one. (Measured 2026-08-10 18:04 EDT: "Use External Apps" governs a GUILD-installed app too, not only user-installed ones -- so that day-one gate covers the v3 launch configuration as well, which is why an open default here is safe rather than merely convenient.) Reuses VISIBILITY's type/enum instead of hand-writing them a second time (v3-pre-release review, finding #51) -- a third verdict added to VISIBILITY alone used to be silently REJECTED here, and resolveVisibility's `|| 'public'` fallback then papered over the save failure by resolving public, the permissive direction, for exactly the setting meant to be the server-wide ceiling.
    defaultVisibility: { type: VISIBILITY.type, enum: VISIBILITY.enum, default: 'public' },

    // Flips the default inside specific channels. Beats defaultVisibility, loses to any role rule.
    channelRules: [{
        _id: false,
        channelId: { type: String, required: true },
        visibility: VISIBILITY,
    }],

    // Flips the verdict for members holding a role. An EMPTY channelIds means "every channel"; a populated one scopes the rule to just those channels and makes it the most specific tier there is. This is what expresses "@roleB may post publicly, but only in #builds and #general".
    roleRules: [{
        _id: false,
        roleId: { type: String, required: true },
        visibility: VISIBILITY,
        channelIds: { type: [String], default: [] },
    }],

    // Commands forced ephemeral in this server regardless of any channel or role rule, by SlashCommandBuilder name. This is the HIGHEST-precedence tier, and server admins (owner / Administrator / MANAGE_GUILD) bypass it -- the intent is "this command is noisy, keep it out of the channel for members" while the admins who set the rule can still use it publicly.
    //
    // ⚠️ It forces ephemeral; it does NOT hide the command or refuse it, and that is a platform limit rather than a scoping choice (settled 2026-08-10 15:47 EDT). A bot cannot remove a GLOBAL slash command inside one guild: registering guild-scoped commands does not delete the global ones, Discord merges both sets, so omission leaves the command visible. The only native mechanism that removes one command in one server is application command permissions, which require an OAuth2 bearer token from a MANAGE_GUILD user -- the bot cannot set them for itself. Admins already have that lever directly, in Server Settings -> Integrations, and it does not apply to user-installed invocations at all, which is the gap this field covers.
    ephemeralCommands: { type: [String], default: [] },

    // A command's OWN settings (Harkirat 2026-10-22 18:31 EDT, the per-command model). Same shape as the server-wide fields above, scoped to one command path ('calendar', 'draw prices', 'Convert Times'). A command listed here uses only these; every other command follows the server-wide ones. Admins skip a command's own settings, as they skip ephemeralCommands. ephemeralCommands above is the older form of the same thing (a command Hidden everywhere) and is read as an entry here until /admin next saves that command, which moves it in.
    commandSettings: [{
        _id: false,
        command: { type: String, required: true },
        defaultVisibility: { type: VISIBILITY.type, enum: VISIBILITY.enum, default: 'ephemeral' },
        channelRules: [{ _id: false, channelId: { type: String, required: true }, visibility: VISIBILITY }],
        roleRules: [{ _id: false, roleId: { type: String, required: true }, visibility: VISIBILITY, channelIds: { type: [String], default: [] } }],
    }],

    // Last writer only -- enough for "who changed this", not a history. A real audit log is filed in docs/db-deferred-list.md to be built alongside the v3 /admin DB-change log rather than as a second, parallel logging mechanism.
    updatedBy: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('GuildSettings', guildSettingsSchema);
