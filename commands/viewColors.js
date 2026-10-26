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
// - /colors' own controls are not used: they are locked to their owner and save into a UserPreference, creating one for a non-user. buildColorPalettePanel's readOnly mode draws this panel's own instead.
// - Its own page, pager and Main/Server Profile buttons (`vc_page|{id}|{page}|{s|g}|{subpage}`, handlers/viewColors.js) carry the subject's id, so any click redraws THAT person's colours; there is no Refresh.
// - Public by default: the reply is not made private here, and a server's /admin rule still makes it private through attachGuildPolicy.
// - No idle timeout (skipExpiry): every button reads the subject from its own custom_id and answers with its own fresh token, so nothing on the panel can go stale.
const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const UserPreference = require('../models/UserPreference');
const { getPalettePanelData } = require('../utils/colorPalette');
const { buildColorPalettePanel, getAvailableSources, buildSwatchEntries } = require('../utils/colorPaletteView');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { buildSyntheticInteraction } = require('../utils/interactionContext');
const { entriesToCache, candidateKeys } = require('../utils/colorCache');

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

// What a person can lack, in the hint's order and wording ("-# **No custom name color, nameplate, or deco detected.**", his; banner added at "similarly with the banner as well"). A page they lack has no button at all, as on /colors (2026-10-19 12:07 EDT: "instead of the red disabled buttons, let's stick to how the /color command does it by just removing the button ... But let's keep the "no banner, etc..." hint line").
const OPTIONAL = [['banner', 'banner'], ['name', 'name color'], ['nameplate', 'nameplate'], ['decoration', 'deco']];

// Whose colours these are, at the bottom just above the missing-pages hint (2026-10-19 13:04 EDT, Harkirat: "move the 'Colors from dior's profile' line to the bottom. above the 'No custom name color detected.' hint").
function footerHint(name, available) {
    return [`-# Colors from **${name}**'s profile`, missingHint(available)].filter(Boolean).join('\n');
}

function missingHint(available) {
    const missing = OPTIONAL.filter(([k]) => !available.includes(k)).map(([, word]) => word);
    if (!missing.length) return null;
    const list = missing.length === 1 ? missing[0] : missing.length === 2 ? `${missing[0]} or ${missing[1]}` : `${missing.slice(0, -1).join(', ')}, or ${missing[missing.length - 1]}`;
    return `-# **No custom ${list} detected.**`;
}

// The panel's accent on every page: the avatar's "First Impression", which is always the palette's first swatch (colorPaletteView.js's assignDynamicLabels claims slot 0 for it). Harkirat, 2026-10-19 12:09 EDT: "accent this panel (all sub-pages included) with the avatar's "First Impression"". Null when no avatar palette has been worked out yet.
function firstImpression(data) {
    const first = buildSwatchEntries(data.avatar, 'avatar')[0];
    if (!first) return null;
    return typeof first.hex === 'number' ? first.hex : parseInt(String(first.hex).replace('#', ''), 16);
}

// The page and pager ids. The person right-clicked rides in every one, so a click by anyone redraws THEIR colours: vc_page|{id}|{page}|{s|g}|{subpage}.
const pageId = (targetId, variantFlag) => (key, sub = 0) => `vc_page|${targetId}|${key}|${variantFlag}|${sub}`;

// Draws one page of `target`'s colours. `member` is their server profile when there is one to read (the right-click's own targetMember, or a REST fetch on a page click). `flag` is the view asked for, `s` (their server profile, the default) or `g` (their main one): the member is read either way, so the Main/Server Profile row (2026-10-25 12:41 EDT) knows a server profile exists while the main one is open.
async function renderPanel(interaction, target, member, page, subpage = 0, flag = 's') {
    const own = await UserPreference.findOne({ discordId: target.id });
    const prefs = own || await throwawayPrefs(target, member?.avatar || null);
    // The panel reads whose colours to show off interaction.user and .member, so it is handed the subject's.
    const subject = buildSyntheticInteraction(interaction, { user: target, member });
    const data = await getPalettePanelData(subject, prefs, page, false, flag === 'g' ? 'global' : 'server');
    const variant = data.hasServerProfile && flag !== 'g' ? 'server' : 'global';
    const ids = pageId(target.id, variant === 'server' ? 's' : 'g');
    const name = (member?.nick || target.globalName || target.username || 'this user').replace(/[*_`~|]/g, '');
    const { components, files } = await buildColorPalettePanel({
        source: page, subpage, data, targetUserId: target.id, variant,
        avatarThumbnailUrl: data.avatarThumbnailUrl || target.displayAvatarURL({ extension: 'png', size: 256 }),
        // A page button ends in `p`, a pager button in its number: the open page's button and the pager's "page 1" arrow both meant `{page}|0` once, and Discord refuses a message with two identical custom_ids (2026-10-19 12:20 EDT, his first right-click on himself). The handler reads `p` as page 1.
        readOnly: true, makePageId: key => ids(key, 'p'), makeSubpageId: (key, sub) => ids(key, sub),
        // The other view's open page: its flag differs from every id above, so it can never duplicate one.
        makeVariantId: (toFlag, key) => pageId(target.id, toFlag)(key, 'p'),
        accentColor: firstImpression(data), extraHint: footerHint(name, getAvailableSources(data)),
    });
    return { panel: components, files };
}

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('View Colors')
        .setType(ApplicationCommandType.User)
        // PUBLIC, like /colors: guild and user install, every context.
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]),
    missingHint,
    footerHint,
    firstImpression,
    pageId,
    renderPanel,

    async execute(interaction) {
        await interaction.deferReply();
        const { panel, files } = await renderPanel(interaction, interaction.targetUser, interaction.targetMember || null, 'avatar');
        return await sendV2Payload(interaction, panel, { flags: 32768, allowedMentions: { users: [] }, files, skipExpiry: true });
    },
};
