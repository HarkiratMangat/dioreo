// ==========================================
// RIGHT-CLICK A USER → APPS → "View Colors" (user context menu, PUBLIC)
// ==========================================
// Someone else's profile colour palette, read-only (Harkirat, 2026-10-19 11:11-11:26 EDT). Built 2026-10-19 11:28 EDT.
//
// ⚠️ TWO KINDS OF PERSON, TWO PLACES THEIR COLOURS GO:
// - A Dioreo user (has a UserPreference): their own record is used and saved exactly as /colors does ("if the other person is a bot user, then save as normal").
// - Anyone else: a throwaway UserPreference that is NEVER saved. What the panel works out is written to the anonymous ColorCache (models/ColorCache.js: keyed by an image fingerprint, no user id, deleted 30 days after first seen), so a second look at the same picture is quick ("just do a 30 day ttl" / "anonymize it if possible").
//
// THE PANEL BELONGS TO THE PERSON RIGHT-CLICKED, NOT TO WHOEVER PRESSES ITS BUTTONS (2026-10-19 11:39 EDT, Harkirat: "linked just for the user it was invoked upon. shows publicly by default, unless channel/server/admin settings restrict the messages. it's publicly clickable, no timeout. and it only keeps showing that invoked user's palette. never changes when someone else clicks it."):
// - /colors' own controls are taken off (`stripControls`): they are locked to their owner and save into a UserPreference, creating one for a non-user.
// - Its own page row (`vc_page|{id}|{page}|{s|g}`, handlers/viewColors.js) carries the subject's id, so any click redraws THAT person's colours; there is no Refresh.
// - Public by default: the reply is not made private here, and a server's /admin rule still makes it private through attachGuildPolicy.
// - No idle timeout (skipExpiry): every button reads the subject from its own custom_id and answers with its own fresh token, so nothing on the panel can go stale.
const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const UserPreference = require('../models/UserPreference');
const { getPalettePanelData } = require('../utils/colorPalette');
const { buildColorPalettePanel } = require('../utils/colorPaletteView');
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

const PAGES = [['avatar', 'Avatar'], ['banner', 'Banner'], ['name', 'Name'], ['nameplate', 'Nameplate'], ['decoration', 'Deco']];

// The page row: the open page green and disabled (the in-panel switcher convention, rendering-and-ui.md), the rest grey. The subject's id rides in every custom_id.
function pageRow(targetId, page, variantFlag) {
    return { type: 1, components: PAGES.map(([key, label]) => ({
        type: 2, style: key === page ? 3 : 2, label, disabled: key === page,
        custom_id: `vc_page|${targetId}|${key}|${variantFlag}`,
    })) };
}

// Draws one page of `target`'s colours. `member` is their server profile when there is one to read (the right-click's own targetMember, or a REST fetch on a page click).
async function renderPanel(interaction, target, member, page) {
    const own = await UserPreference.findOne({ discordId: target.id });
    const prefs = own || await throwawayPrefs(target, member?.avatar || null);
    // The panel reads whose colours to show off interaction.user and .member, so it is handed the subject's.
    const subject = buildSyntheticInteraction(interaction, { user: target, member });
    const data = await getPalettePanelData(subject, prefs, page, false, 'server');
    const variant = data.hasServerProfile ? 'server' : 'global';
    const { components, files } = await buildColorPalettePanel({
        source: page, data, targetUserId: target.id, variant,
        avatarThumbnailUrl: data.avatarThumbnailUrl || target.displayAvatarURL({ extension: 'png', size: 256 }),
    });
    const panel = stripControls(components);
    const name = (member?.nick || target.globalName || target.username || 'this user').replace(/[*_`~|]/g, '');
    if (panel[0]?.components) {
        panel[0].components.unshift({ type: 10, content: `-# Colors from **${name}**'s profile` });
        panel[0].components.push(pageRow(target.id, page, variant === 'server' ? 's' : 'g'));
    }
    return { panel, files };
}

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('View Colors')
        .setType(ApplicationCommandType.User)
        // PUBLIC, like /colors: guild and user install, every context.
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]),
    stripControls,
    pageRow,
    renderPanel,
    PAGES,

    async execute(interaction) {
        await interaction.deferReply();
        const { panel, files } = await renderPanel(interaction, interaction.targetUser, interaction.targetMember || null, 'avatar');
        return await sendV2Payload(interaction, panel, { flags: 32768, allowedMentions: { users: [] }, files, skipExpiry: true });
    },
};
