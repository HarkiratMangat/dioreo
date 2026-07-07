// utils/loadoutRender.js
const { withShareButton } = require('./shareButton');
const { buildPaginationRow } = require('./paginationRow');

// `Loadout.imageKey` supports EITHER a bare Cloudinary key (prefixed with the Cloudinary base URL
// below, the original design used by admin-added loadouts) OR a full external URL -- needed
// because builds.xlsx's images are hosted on imgur, not Cloudinary, and that data now lives in
// this same collection after the MP migration.
function buildImageUrl(imageKey) {
    return imageKey.startsWith('http') ? imageKey : `https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1/${imageKey}`;
}

// Shared Components V2 card builder for /dmz and the MP category commands (/all, /<category>) --
// same layout for both, differing only in accent color and the button custom_id prefix ('dmz' vs
// 'mp') so index.js's interaction router can tell a click apart and query the right mode.
//
// NOTE (rebuilt during review): this used to be a legacy EmbedBuilder card (title/description/
// image/footer via embed-native fields), which is what every other command in this bot moved away
// from. Recreated here to match that original embed's exact visual identity as closely as
// Components V2 allows -- V2 has no equivalent to an embed's *inline fields* though (the
// side-by-side "Attachments" / "Gunsmith Code" columns), so those stack vertically instead of
// sitting side-by-side; everything else (category overline, bold weapon title, image, "Build N of
// M" + last-updated footer line, Back/Next/Copy Code buttons) matches the original design.
function buildLoadoutCard(builds, index, { color, idPrefix, isEphemeral = false }) {
    const activeBuild = builds[index];
    const attachmentLines = activeBuild.attachments.map(att => `• ${att}`).join('\n');
    const lastUpdatedUnix = Math.floor(new Date(activeBuild.lastUpdated).getTime() / 1000);

    const containerComponents = [
        { type: 10, content: `-# ${activeBuild.category}\n# ${activeBuild.weaponName}` }
    ];

    // Optional flavor text (e.g. "No suppressor build... FMJ allows 1 tap through walls") — omitted
    // entirely when blank, matching the established pattern elsewhere (e.g. patchnotes.js).
    if (activeBuild.description) {
        containerComponents.push({ type: 10, content: `*${activeBuild.description}*` });
    }

    containerComponents.push({ type: 14, spacing: 2, divider: true });
    containerComponents.push({ type: 10, content: `**Attachments**\n${attachmentLines}` });

    // Prefers the real in-game Gunsmith code (shareCode) when present, falling back to buildName —
    // see models/Loadout.js for why these are two separate fields. Omitted entirely if neither is
    // set (shouldn't happen in practice — buildName always defaults to something — but harmless).
    const codeText = activeBuild.shareCode || activeBuild.buildName;
    if (codeText) {
        containerComponents.push({ type: 10, content: `**Gunsmith Code**\n\`${codeText}\`` });
    }

    containerComponents.push({ type: 14, spacing: 2, divider: true });
    containerComponents.push({ type: 12, items: [{ media: { url: buildImageUrl(activeBuild.imageKey) } }] });
    containerComponents.push({ type: 10, content: `-# Build ${index + 1} of ${builds.length} • Last updated <t:${lastUpdatedUnix}:f>` });

    // NOTE (moved during review): buttons live INSIDE the container now (were a separate row
    // outside it), with a divider between them and the image/caption above — per Harkirat's
    // request. Prev/Next also switched from plain "Back"/"Next" text buttons to the same
    // Left/Right-emoji + numbers-only pagination style used everywhere else in the bot
    // (utils/paginationRow.js), for consistency.
    containerComponents.push({ type: 14, spacing: 2, divider: true });

    // DESIGN TWEAK (flagging in case you want it reverted): combined pagination + Copy Code into
    // ONE row instead of two separate ones — still comfortably under the 5-buttons-per-row cap
    // (Left/counter/Right/Copy Code = 4), and reads as a single "actions" row rather than splitting
    // navigation from the copy action for no strong reason.
    const paginationRow = buildPaginationRow({
        totalChunks: builds.length,
        currentPage: index,
        prevCustomId: `${idPrefix}prev_${activeBuild.weaponKey}_${index}`,
        nextCustomId: `${idPrefix}next_${activeBuild.weaponKey}_${index}`,
        indicatorCustomId: `${idPrefix}_page_indicator`
    });
    const buttonComponents = paginationRow ? [...paginationRow.components] : [];
    buttonComponents.push({ type: 2, style: 3, label: 'Copy Code', custom_id: `${idPrefix}copy_${activeBuild.weaponKey}_${index}` });
    containerComponents.push({ type: 1, components: buttonComponents });

    const containerPayload = { type: 17, accent_color: color, components: containerComponents };

    // "Share Publicly" stays its own row OUTSIDE the container (unlike the buttons above) — same
    // convention as every other command in the bot, see utils/shareButton.js.
    const components = withShareButton([containerPayload], isEphemeral);

    return { components, flags: 32768 };
}

module.exports = { buildImageUrl, buildLoadoutCard };
