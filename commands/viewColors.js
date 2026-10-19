// ==========================================
// RIGHT-CLICK A USER → APPS → "View Colors" (user context menu, PUBLIC)
// ==========================================
// Someone else's profile colour palette, read-only (Harkirat, 2026-10-19 11:11-11:26 EDT). Built 2026-10-19 11:28 EDT.
//
// ⚠️ TWO KINDS OF PERSON, TWO PLACES THEIR COLOURS GO:
// - A Dioreo user (has a UserPreference): their own record is used and saved exactly as /colors does ("if the other person is a bot user, then save as normal").
// - Anyone else: a throwaway UserPreference that is NEVER saved. What the panel works out is written to the anonymous ColorCache (models/ColorCache.js: keyed by an image fingerprint, no user id, deleted 30 days after first seen), so a second look at the same picture is quick ("just do a 30 day ttl" / "anonymize it if possible").
//
// READ-ONLY: every button and dropdown is taken off the panel. They are locked to the panel's subject, so the viewer could not press them anyway, and Refresh would re-extract a stranger's images on demand.
const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const UserPreference = require('../models/UserPreference');
const { getPalettePanelData } = require('../utils/colorPalette');
const { buildColorPalettePanel } = require('../utils/colorPaletteView');
const { resolveEphemeral } = require('../utils/ephemeral');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { buildSyntheticInteraction } = require('../utils/interactionContext');
const { entriesToCache, candidateKeys } = require('../utils/colorCache');

// Takes every control off a panel: action rows go, and a Section whose accessory is a button becomes its text. Thumbnails stay.
function stripControls(nodes) {
    const out = [];
    for (const n of nodes || []) {
        if (!n || n.type === 1) continue;
        if (n.type === 9 && n.accessory?.type === 2) { out.push(...stripControls(n.components)); continue; }
        out.push(n.components ? { ...n, components: stripControls(n.components) } : n);
    }
    return out;
}

// A UserPreference for someone who is not a user: loaded from the anonymous cache, and whose save() writes only there.
async function throwawayPrefs(target, guildAvatar) {
    const ColorCache = require('../models/ColorCache');
    const prefs = new UserPreference({ discordId: target.id });
    const cached = await ColorCache.find({ key: { $in: candidateKeys({ avatar: target.avatar, guildAvatar }) } }).lean();
    for (const entry of cached) Object.assign(prefs, entry.data || {});
    prefs.save = async () => {
        const entries = entriesToCache(prefs, prefs.modifiedPaths());
        await Promise.all(entries.map(e => ColorCache.updateOne({ key: e.key }, { $set: { data: e.data }, $setOnInsert: { createdAt: new Date() } }, { upsert: true })));
        return prefs;
    };
    return prefs;
}

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('View Colors')
        .setType(ApplicationCommandType.User)
        // PUBLIC, like /colors: guild and user install, every context.
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]),
    stripControls,

    async execute(interaction) {
        const target = interaction.targetUser;
        const member = interaction.targetMember || null;
        const viewerPrefs = await UserPreference.findOne({ discordId: interaction.user.id }).lean();
        const isEphemeral = resolveEphemeral({ argPrivate: null, prefs: viewerPrefs, prefsField: 'colorsVisibility' });
        await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        const own = await UserPreference.findOne({ discordId: target.id });
        const prefs = own || await throwawayPrefs(target, member?.avatar || null);
        // The panel reads whose colours to show off interaction.user and .member, so it is handed the subject's.
        const subject = buildSyntheticInteraction(interaction, { user: target, member });
        const data = await getPalettePanelData(subject, prefs, 'avatar', false, 'server');
        const variant = data.hasServerProfile ? 'server' : 'global';
        const { components, files } = await buildColorPalettePanel({
            source: 'avatar', data, targetUserId: target.id, variant,
            avatarThumbnailUrl: data.avatarThumbnailUrl || target.displayAvatarURL({ extension: 'png', size: 256 }),
        });
        const panel = stripControls(components);
        const name = (member?.nick || target.globalName || target.username || 'this user').replace(/[*_`~|]/g, '');
        if (panel[0]?.components) panel[0].components.unshift({ type: 10, content: `-# Colors from **${name}**'s profile` });
        return await sendV2Payload(interaction, panel, { flags: 32768 | (isEphemeral ? 64 : 0), allowedMentions: { users: [] }, files });
    },
};
