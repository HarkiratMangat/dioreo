// ==========================================
// RIGHT-CLICK → APPS → "Add to Patch Notes" (message context menu)
// ==========================================
// Right-click a patch-notes post (the original, or a forward of it) and its images go into a season's patch notes (Harkirat, 2026-10-19 00:43 EDT: "i kind of want to try this ... if it works well, then im considering expanding it to more things later on"). Built 2026-10-19 10:22 EDT from local/project/features/add-to-patch-notes/spec.md.
//
// The flow: this command answers with a private PANEL (the images found, a season dropdown, Add / Replace / Create). handlers/addToPatchNotes.js answers the panel and opens /manage's own Add New Season or Edit Season box, pre-filled, so the save goes through handlers/manage/patchnotes.js exactly as a /manage edit does (re-hosting to Cloudinary included).
//
// ⚠️ THE IMAGES LIVE IN MEMORY BETWEEN THE RIGHT-CLICK AND THE BUTTON. A forward cannot be re-read later: over REST its snapshot comes back blank without the Message Content intent (measured 2026-10-19 00:38 EDT), so the right-click is the only moment the bot sees them. They are held by key for 30 minutes; a click after a restart or past that answers "right-click it again" instead of hanging.

const { ContextMenuCommandBuilder, ApplicationCommandType, MessageFlags } = require('discord.js');
const { hasManagePageAccess } = require('../utils/adminAccess');
const { extractSource, mergeImages } = require('../utils/patchNoteSource');
const { sendV2Payload } = require('../utils/sendV2Payload');
const emojis = require('../utils/emojiMap');

const COMMAND_NAME = 'Add to Patch Notes';
const ACCENT = 15909424; // Patch Gold, /patch notes' own PRESET_ACCENT (rendering-and-ui.md's colour map)
const SEASONS_LISTED = 24; // + "New season" = Discord's 25-option cap; older seasons stay reachable in /manage
const HOLD_MS = 30 * 60 * 1000;

const held = new Map(); // key -> { images, info, postedAt, userId, at }

function hold(key, value) {
    const now = Date.now();
    for (const [k, v] of held) if (now - v.at > HOLD_MS) held.delete(k);
    held.set(key, { ...value, at: now });
}

function heldFor(key) {
    const v = held.get(key);
    if (!v || Date.now() - v.at > HOLD_MS) { held.delete(key); return null; }
    return v;
}

// The seasons the dropdown offers: newest first, the current season (the last patchNotes[] entry) at the top.
function listedSeasons(seasonalDoc) {
    return (seasonalDoc?.patchNotes || []).slice(-SEASONS_LISTED).reverse();
}

// `selected` is a patch entry id, or 'new'. Defaults to the current season.
function buildPanel(key, source, seasonalDoc, selected) {
    const { displayTitle, seasonEmoji } = require('./patchnotes');
    const seasons = listedSeasons(seasonalDoc);
    const pick = selected || (seasons[0] ? String(seasons[0]._id) : 'new');
    const entry = seasons.find(p => String(p._id) === pick) || null;
    const count = source.images.length;
    const posted = source.postedAt ? ` · posted <t:${Math.floor(source.postedAt.getTime() / 1000)}:f>` : '';

    const components = [
        { type: 10, content: `## Add to Patch Notes\n**${count} image${count === 1 ? '' : 's'}** from ${source.isForward ? 'the forwarded post' : 'this message'}${posted}` },
        { type: 12, items: source.images.slice(0, 10).map(url => ({ media: { url } })) },
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content: '**Season**' },
        { type: 1, components: [{
            type: 3, custom_id: `ptn_season|${key}`, placeholder: 'Pick a season',
            options: [
                { label: 'New season', value: 'new', description: 'Type its title in the editor', default: pick === 'new' },
                ...seasons.map(p => ({
                    label: displayTitle(p).slice(0, 100), value: String(p._id),
                    ...(seasonEmoji(p) ? { emoji: emojis.parseEmoji(seasonEmoji(p)) } : {}),
                    default: String(p._id) === pick,
                })),
            ],
        }] },
    ];

    if (entry) {
        const { dropped } = mergeImages(entry.images, source.images, 'add');
        const have = (entry.images || []).length;
        components.push({ type: 10, content: `-# This season has ${have} image${have === 1 ? '' : 's'}.${dropped ? ` **Add** fits only ${source.images.length - dropped} of the ${source.images.length} (10 is the limit); **Replace** fits them all.` : ''}` });
        components.push({ type: 1, components: [
            { type: 2, style: 1, label: 'Add images', custom_id: `ptn_add|${key}|${pick}` },
            { type: 2, style: 2, label: 'Replace images', custom_id: `ptn_replace|${key}|${pick}` },
        ] });
    } else {
        components.push({ type: 1, components: [{ type: 2, style: 3, label: 'Create season', custom_id: `ptn_new|${key}` }] });
    }
    return [{ type: 17, accent_color: ACCENT, components }];
}

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName(COMMAND_NAME)
        .setType(ApplicationCommandType.Message)
        .setDefaultMemberPermissions(0)
        // ADMIN-ONLY, like /manage: user-install only, and listed in bot/registry.js's ADMIN_COMMAND_NAMES so /admin's server rules never offer it.
        .setIntegrationTypes([1]).setContexts([0, 1, 2]),
    COMMAND_NAME,
    buildPanel,
    heldFor,
    listedSeasons,

    async execute(interaction) {
        if (!(await hasManagePageAccess(interaction.user.id, 'patchnotes'))) {
            return await interaction.reply({ content: "🔒 **This one's admin-only.** It edits Dioreo's patch notes directly.", flags: MessageFlags.Ephemeral });
        }
        const source = extractSource(interaction.targetMessage);
        if (!source.images.length) {
            return await interaction.reply({ content: 'No images found on that message.', flags: MessageFlags.Ephemeral });
        }
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const key = interaction.id;
        hold(key, { ...source, userId: interaction.user.id });
        const { loadSeasonalDoc } = require('../utils/manageActions');
        const seasonalDoc = await loadSeasonalDoc();
        return await sendV2Payload(interaction, buildPanel(key, source, seasonalDoc));
    },
};
