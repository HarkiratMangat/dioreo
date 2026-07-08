// utils/loadoutRender.js
const { withShareButton } = require('./shareButton');
const { buildPaginationRow } = require('./paginationRow');
const emojis = require('./emojiMap');

// MP LOADOUT ACCENT COLORS — one per weapon category, from the "Custom Class" palette (a curated
// mix Harkirat picked across several palette proposals, see the palette spec sheet). Keyed by the
// exact uppercase string stored in `Loadout.category` (AR/LMG/MARKSMAN/SHOTGUN/SMG/SNIPER, plus
// SECONDARIES which has no loadouts yet — see index.js's category-registration merge for why the
// /secondaries command still exists ahead of any data). `/all` looks a weapon's OWN category up in
// here at render time (it isn't locked to one category the way /ar or /smg are), so its accent
// color changes per weapon instead of using one fixed color. `/<category>` commands hit the exact
// same lookup — they just always resolve to the same entry since every result they query shares
// one category.
const MP_CATEGORY_ACCENT = {
    AR: 16726876,          // FF3B5C — Crimson Pop
    SMG: 16765503,         // FFD23F — Electric Gold
    LMG: 8675010,          // 845EC2 — Grape Purple
    MARKSMAN: 4054167,     // 3DDC97 — Tactical Green
    SNIPER: 4415982,       // 4361EE — Electric Blue
    SHOTGUN: 16165179,     // F6A93B — Amber Alert
    SECONDARIES: 143431    // 023047 — Deep Ice
};
const DEFAULT_MP_ACCENT = 2829617; // #2b2d31 — fallback for a category not in the map above

// Looks up the accent color for a given `Loadout.category` value, case-insensitively (stored
// values are already uppercase, but this doesn't assume that stays true forever). Falls back to
// the neutral default rather than throwing if the category is ever missing/unrecognized.
function getMpCategoryAccent(category) {
    if (!category) return DEFAULT_MP_ACCENT;
    return MP_CATEGORY_ACCENT[category.toUpperCase()] ?? DEFAULT_MP_ACCENT;
}

// `Loadout.imageKey` supports EITHER a bare Cloudinary key (prefixed with the Cloudinary base URL
// below, the original design used by admin-added loadouts) OR a full external URL -- needed
// because builds.xlsx's images are hosted on imgur, not Cloudinary, and that data now lives in
// this same collection after the MP migration.
function buildImageUrl(imageKey) {
    return imageKey.startsWith('http') ? imageKey : `https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1/${imageKey}`;
}

// "Badges" shown under the weapon name (Meta / Best-in-category / Top-N-in-category) -- only
// rendered when actually granted (see models/Loadout.js), joined by the `blank` spacer emoji
// rather than a visible separator character when both are present. `categoryRank` is free-form
// ('best' or 'top{N}', not a fixed "top3" enum) since not every category tops out at exactly 3 --
// see adminParser.js's parseLoadoutBadges(). Returns null (render nothing) if the build has no
// badges at all.
function buildBadgesLine(build) {
    const badges = [];
    if (build.isMeta) badges.push(`${emojis.meta} Meta`);
    if (build.categoryRank === 'best') {
        badges.push(`${emojis.best} Best ${build.category}`);
    } else if (build.categoryRank) {
        const topMatch = build.categoryRank.match(/^top(\d+)$/);
        if (topMatch) badges.push(`${emojis.top} Top ${topMatch[1]} ${build.category}`);
    }
    if (badges.length === 0) return null;
    return `**${badges.join(`${emojis.blank} `)}**`;
}

// Capitalizes just the first letter (sentence case), leaving everything else untouched -- unlike
// toTitleCase (adminParser.js), which capitalizes every word. Descriptions come from freeform admin
// text (originally builds.xlsx's flavor-text column) that isn't always typed starting with a
// capital, so this is applied at render time rather than trusting the stored casing.
function toSentenceCase(str) {
    return str.replace(/^(\s*)([a-z])/, (_, lead, first) => lead + first.toUpperCase());
}

// Discord blockquote syntax ("> " per line) -- handles a multi-line description, not just a single
// line, even though every description seen so far has been one line.
function toBlockquote(str) {
    return str.split('\n').map(line => `> ${line}`).join('\n');
}

// Shared Components V2 card builder for /dmz and the MP category commands (/all, /<category>) --
// same layout for both, differing only in accent color and the button custom_id prefix ('dmz' vs
// 'mp') so index.js's interaction router can tell a click apart and query the right mode.
//
// NOTE (redesigned during review, per Harkirat's loadouts_ui.json reference): weapon name is now
// the top heading with optional Meta/Best/Top-3 badges directly below it (see buildBadgesLine
// above), rather than a small category overline -- the category moved down into the footer line
// instead ("{category} • Build N of M • Last updated..."). The divider between Gunsmith Code and
// the image was removed. "Attachments"/"Gunsmith Code" are now real H3 headings (### ) rather than
// bold text, and each attachment line is backtick-wrapped to match the Gunsmith Code code-block
// styling. V2 still has no equivalent to an embed's *inline fields*, so those two sections stack
// vertically rather than sitting side-by-side.
function buildLoadoutCard(builds, index, { color, idPrefix, isEphemeral = false }) {
    const activeBuild = builds[index];
    const attachmentLines = activeBuild.attachments.map(att => `• \`${att}\``).join('\n');
    const lastUpdatedUnix = Math.floor(new Date(activeBuild.lastUpdated).getTime() / 1000);

    let titleContent = `# ${activeBuild.weaponName}`;
    const badgesLine = buildBadgesLine(activeBuild);
    if (badgesLine) titleContent += `\n${badgesLine}`;

    const containerComponents = [
        { type: 10, content: titleContent }
    ];

    containerComponents.push({ type: 14, spacing: 1, divider: true });

    // Optional flavor text (e.g. "No suppressor build... FMJ allows 1 tap through walls") — omitted
    // entirely when blank, matching the established pattern elsewhere (e.g. patchnotes.js). Moved
    // below the divider (was above it) and switched from italic to a real blockquote (`> `) per
    // Harkirat's request; toSentenceCase() guards against admin-typed descriptions that didn't
    // start with a capital letter.
    if (activeBuild.description) {
        containerComponents.push({ type: 10, content: toBlockquote(toSentenceCase(activeBuild.description)) });
    }

    containerComponents.push({ type: 10, content: `### Attachments\n${attachmentLines}` });

    // Prefers the real in-game Gunsmith code (shareCode) when present, falling back to buildName —
    // see models/Loadout.js for why these are two separate fields. Omitted entirely if neither is
    // set (shouldn't happen in practice — buildName always defaults to something — but harmless).
    const codeText = activeBuild.shareCode || activeBuild.buildName;
    if (codeText) {
        containerComponents.push({ type: 10, content: `### Gunsmith Code\n\`${codeText}\`` });
    }

    // NOTE (removed during review, per Harkirat's request): there used to be a divider here between
    // Gunsmith Code and the image -- dropped so the image sits directly under the text above it.
    containerComponents.push({ type: 12, items: [{ media: { url: buildImageUrl(activeBuild.imageKey) } }] });
    containerComponents.push({ type: 10, content: `-# ${activeBuild.category} • Build ${index + 1} of ${builds.length} • Last updated <t:${lastUpdatedUnix}:D>` });

    // NOTE (moved during review): buttons live INSIDE the container now (were a separate row
    // outside it), with a divider between them and the image/caption above — per Harkirat's
    // request. Prev/Next also switched from plain "Back"/"Next" text buttons to the same
    // Left/Right-emoji + numbers-only pagination style used everywhere else in the bot
    // (utils/paginationRow.js), for consistency.
    containerComponents.push({ type: 14, spacing: 1, divider: true });

    // Pagination + Copy Attachments + Copy Code all share one row -- exactly 5 buttons in the
    // worst case (Left/counter/Right/Copy Attachments/Copy Code), right at Discord's per-row cap.
    // "Copy Attachments" replies with the plain attachment list (one per line, no bullets/backticks/
    // formatting) as its own ephemeral message, same mechanism as "Copy Code" -- see index.js's
    // dmz/mp-prefixed button handler's `copyatt` action.
    const paginationRow = buildPaginationRow({
        totalChunks: builds.length,
        currentPage: index,
        prevCustomId: `${idPrefix}prev_${activeBuild.weaponKey}_${index}`,
        nextCustomId: `${idPrefix}next_${activeBuild.weaponKey}_${index}`,
        indicatorCustomId: `${idPrefix}_page_indicator`
    });
    const buttonComponents = paginationRow ? [...paginationRow.components] : [];
    buttonComponents.push({ type: 2, style: 2, label: 'Copy Attachments', custom_id: `${idPrefix}copyatt_${activeBuild.weaponKey}_${index}` });
    buttonComponents.push({ type: 2, style: 3, label: 'Copy Code', custom_id: `${idPrefix}copy_${activeBuild.weaponKey}_${index}` });
    containerComponents.push({ type: 1, components: buttonComponents });

    const containerPayload = { type: 17, accent_color: color, components: containerComponents };

    // "Share Publicly" stays its own row OUTSIDE the container (unlike the buttons above) — same
    // convention as every other command in the bot, see utils/shareButton.js.
    const components = withShareButton([containerPayload], isEphemeral);

    return { components, flags: 32768 };
}

module.exports = { buildImageUrl, buildLoadoutCard, getMpCategoryAccent };
