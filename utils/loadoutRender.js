// utils/loadoutRender.js
const { withShareButton } = require('./shareButton');
const { buildPaginationRow } = require('./paginationRow');
const emojis = require('./emojiMap');

// MP LOADOUT ACCENT COLORS — one per weapon category, from the "Custom Class" palette (a curated mix Harkirat picked across several palette proposals, see the palette spec sheet). Keyed by the exact uppercase string stored in `Loadout.category` (AR/LMG/MARKSMAN/SHOTGUN/SMG/SNIPER, plus SECONDARIES which has no loadouts yet). `/gunsmith mp` and `/gunsmith dmz` look a weapon's OWN category up here at render time, so its accent color changes per weapon rather than using one fixed color. The `/gunsmith mp` and `/gunsmith dmz` browse rows hit the exact same lookup via the same utils/loadoutScopes.js/renderScopeBrowse path (2026-08-15 consolidation).
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

// Looks up the accent color for a given `Loadout.category` value, case-insensitively (stored values are already uppercase, but this doesn't assume that stays true forever). Falls back to the neutral default rather than throwing if the category is ever missing/unrecognized.
function getMpCategoryAccent(category) {
    if (!category) return DEFAULT_MP_ACCENT;
    return MP_CATEGORY_ACCENT[category.toUpperCase()] ?? DEFAULT_MP_ACCENT;
}

// Cosmetic display-only relabeling (2026-07-18, v2 quick-wins follow-up) -- `SECONDARIES` is the real stored `Loadout.category` enum value, the `/secondaries` command name, and that command's own description ALL stay exactly as-is (Harkirat's explicit call -- nothing about the data model, command registration, or category filtering changes). This ONLY relabels how the category reads in specific SHORT, singular-implying UI spots where the plural form sounds wrong grammatically ("Best SECONDARIES" reads oddly for a single weapon) -- currently just the badge line below. Every other category (AR/SMG/LMG/MARKSMAN/SNIPER/SHOTGUN) passes through unchanged. AR, SMG and LMG stay in capitals because they are abbreviations; every other class reads in normal case, "Shotgun", "Marksman", "Secondary" (Harkirat, 2026-10-25 18:34 EDT: "AR SMG LMG were all caps because they're abbreviations for the full name"). Every place a class name shows (card footers, badges, pagers, the class and weapon dropdowns, autocomplete) goes through here.
const CATEGORY_ABBREVIATIONS = new Set(['AR', 'SMG', 'LMG']);
function displayCategoryLabel(category) {
    const code = String(category || '').toUpperCase();
    if (!code || CATEGORY_ABBREVIATIONS.has(code)) return code;
    const word = code === 'SECONDARIES' ? 'SECONDARY' : code;
    return word.charAt(0) + word.slice(1).toLowerCase();
}

// `Loadout.imageKey` supports EITHER a bare Cloudinary key (prefixed with the Cloudinary base URL below, the original design used by admin-added loadouts) OR a full external URL -- added for builds.xlsx's 2 originally-imgur-hosted LOCUS rows (since re-uploaded to Cloudinary directly, see models/Loadout.js), kept supported in case a future import ever needs it again.
function buildImageUrl(imageKey) {
    return imageKey.startsWith('http') ? imageKey : `https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1/${imageKey}`;
}

// Deterministic weaponKey + next-build-number + Cloudinary-key computation for /autobuild -- no AI involved (per the design spec). weaponKey matches the exact convention every other write site in this codebase already uses (handlers/manage/loadouts.js's add_loadout_/edit_loadout_ handlers: lowercase, spaces stripped). buildName follows a plain "Build N" convention specific to auto-created loadouts (there's no human-typed variant label like "Aggressive Flex" available from a screenshot) -- N is computed from the HIGHEST existing "Build N" number among this weapon's current builds, not a count, so a deleted build in the middle can't produce a colliding buildName. Non-"Build N"-shaped existing names are simply ignored for this max-finding purpose, not treated as errors. imageKey follows the documented convention (.claude/rules/loadout-images-and-metadata.md, "Recommended naming convention"): WeaponKey-BuildNum, all-caps, hyphens preserved from the weapon name's own word breaks (a multi-word name like "Holger 26" becomes "HOLGER-26", a single-word name stays single-word with no hyphen invented that wasn't already implied by a space).
function computeWeaponKeyAndBuild(weaponName, existingBuildNames) {
    const weaponKey = weaponName.toLowerCase().replace(/\s+/g, '');

    let maxBuildNum = 0;
    for (const name of existingBuildNames) {
        const match = /^Build (\d+)$/.exec(name || '');
        if (match) maxBuildNum = Math.max(maxBuildNum, parseInt(match[1], 10));
    }
    const nextBuildNum = maxBuildNum + 1;

    const imageBase = weaponName.trim().toUpperCase().replace(/\s+/g, '-');
    const imageKey = `${imageBase}-${nextBuildNum}`;

    return { weaponKey, buildName: `Build ${nextBuildNum}`, imageKey };
}

// Classic iterative Levenshtein (two-row), used only by findDuplicateLoadouts below for the "code within N character edits" soft rule. Gunsmith codes are ~10 chars, so this is trivially cheap.
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
        const curr = [i];
        for (let j = 1; j <= n; j++) {
            curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        prev = curr;
    }
    return prev[n];
}

const normCode = (c) => (c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const normAtt = (a) => (a || '').toLowerCase().trim().replace(/\s+/g, ' ');

// Duplicate-loadout detection for /autobuild (2026-07-21, from Harkirat's live-test note #14). Real, previously-uncaught failure mode: re-submitting a screenshot of a build already in the database silently created a SECOND identical Loadout doc (test 1 -- the exact-duplicate AK117). ADVISORY only -- surfaced as a review-card warning, never a hard block -- so a genuine new variant can still be Confirmed through, consistent with the whole feature's review-first philosophy.
//
// Two soft rules (Harkirat's own idea, lightly generalized). Checked against MP builds of ANY weapon, not just the same weaponKey: an in-game Gunsmith code encodes the weapon, so a code match already implies the same weapon -- scoping to weaponKey would MISS a duplicate whose weapon name the vision call misread.
//   Rule A: Gunsmith code IDENTICAL  AND  >= 4 of 5 attachments match  -> duplicate
//           (tolerates the vision call misreading ONE attachment name)
//   Rule B: Gunsmith code within 2 character edits  AND  every attachment matches  -> duplicate
//           (tolerates it misreading a character or two of the code while attachments line up)
// Returns [{ weaponName, buildName, overlap, total }] for each existing build that looks like a dupe.
function findDuplicateLoadouts(candidate, existingBuilds) {
    const candCode = normCode(candidate.gunsmithCode);
    const candAtt = (candidate.attachments || []).map(normAtt).filter(Boolean);
    const matches = [];
    for (const build of existingBuilds || []) {
        const buildCode = normCode(build.shareCode);
        const buildAtt = (build.attachments || []).map(normAtt).filter(Boolean);
        const buildSet = new Set(buildAtt);
        const overlap = candAtt.filter(a => buildSet.has(a)).length;

        const codeExact = candCode && buildCode && candCode === buildCode;
        const codeClose = candCode && buildCode && levenshtein(candCode, buildCode) <= 2;
        const allAttachmentsMatch = candAtt.length > 0 && overlap === candAtt.length && overlap === buildSet.size;

        if ((codeExact && overlap >= 4) || (codeClose && allAttachmentsMatch)) {
            // `id` and `code` (2026-10-20 13:22 EDT) let /autobuild's card name the build's /gunsmith position and say whether the code matched exactly or nearly.
            matches.push({ weaponName: build.weaponName, buildName: build.buildName, overlap, total: candAtt.length, id: build._id, code: codeExact ? 'exact' : 'close' });
        }
    }
    return matches;
}

// Real existence check against Cloudinary's CDN (2026-07-18, /manage loadout UX overhaul) -- this bot has never validated an admin-typed Cloudinary key before saving a loadout, and buildImageUrl() above CAN'T validate anything itself (it's pure string interpolation, no network call). This is what actually catches the exact failure mode Harkirat hit with FSS Hurricane: a loadout saves fine with a mismatched key, and the only way to discover it was broken used to be noticing the card render itself. A HEAD request is cheap (no body transfer) and this only ever runs on an admin save, never a hot read path. Advisory only, never blocks a save: a network hiccup here must not produce a false "image missing" warning on a key that's actually fine, so anything other than a clean 404 is treated as "can't confirm either way" and reports as present. An external full-URL imageKey (see the comment above) isn't ours to validate -- always reports present.
async function checkImageExists(imageKey) {
    if (!imageKey || imageKey.startsWith('http')) return true;
    try {
        const res = await fetch(buildImageUrl(imageKey), { method: 'HEAD' });
        return res.status !== 404;
    } catch {
        return true;
    }
}

// An emoji that may not be on the app yet (Ass, Capable, the Rank Mode marks): the live one by name, else the placeholder given, else nothing, so the word still renders alone.
function optionalEmoji(name, placeholder = null) {
    const e = (emojis.byName ? emojis.byName(name) : null) || placeholder;
    return e ? `${e} ` : '';
}

// "Badges" shown under the weapon name (Meta / Best-in-category / Top-N-in-category / Capable, Toxic, Ass) -- only rendered when actually granted (see models/Loadout.js), joined by the `blank` spacer emoji rather than a visible separator character when both are present. `categoryRank` is free-form ('best' or 'top{N}', not a fixed "top3" enum) since not every category tops out at exactly 3 -- see adminParser.js's parseLoadoutBadges(). Returns null (render nothing) if the build has no badges at all.
function buildBadgesLine(build) {
    const badges = [];
    if (build.isMeta) badges.push(`${emojis.meta} Meta`);
    // DMZ builds NEVER use the per-category Best/TopN system (categoryRank) -- /dmz has no per-category commands the way MP does, so a category-name badge ("Best AR") doesn't read as meaningfully there. `dmzRangeRank` covers every DMZ rank badge instead: a bare 'best'/'top{N}' (no range specified) renders as "... DMZ", and a '-close'/'-midlong' suffixed value renders with a combat-range-role label instead. Reuses the same Best/Top emojis either way.
    if (build.mode === 'DMZ') {
        if (build.dmzRangeRank) {
            const rangeLabel = build.dmzRangeRank.includes('-close') ? 'Close Range'
                : build.dmzRangeRank.includes('-midlong') ? 'Mid-Long Range'
                : 'DMZ';
            if (build.dmzRangeRank.startsWith('best')) {
                badges.push(`${emojis.best} Best ${rangeLabel}`);
            } else if (build.dmzRangeRank.startsWith('capable')) {
                badges.push(`${optionalEmoji('Capable', emojis.capable)}Capable ${rangeLabel}`);
            } else {
                const topMatch = build.dmzRangeRank.match(/^top(\d+)/);
                if (topMatch) badges.push(`${emojis.top} Top ${topMatch[1]} ${rangeLabel}`);
            }
        }
    } else if (build.categoryRank === 'best') {
        badges.push(`${emojis.best} Best ${displayCategoryLabel(build.category)}`);
    } else if (build.categoryRank === 'capable') {
        // The tier always names its category in the bot ("Capable AR"); the portal may leave the word off (his ruling, 2026-09-24).
        badges.push(`${optionalEmoji('Capable', emojis.capable)}Capable ${displayCategoryLabel(build.category)}`);
    } else if (build.categoryRank) {
        const topMatch = build.categoryRank.match(/^top(\d+)$/);
        if (topMatch) badges.push(`${emojis.top} Top ${topMatch[1]} ${displayCategoryLabel(build.category)}`);
    }
    // "Toxic" is independent of Meta/Best/TopN (a build can be unbalanced/cheese without being the objectively best in its category, or vice versa) -- see models/Loadout.js's isToxic field.
    if (build.isToxic) badges.push(`${emojis.toxic} Toxic`);
    if (build.isAss) badges.push(`${optionalEmoji('Ass', emojis.ass)}Ass`);
    if (badges.length === 0) return null;
    return `**${badges.join(`${emojis.blank} `)}**`;
}

// "Recommended Rank Mode: HP | S&D" (Harkirat's wording, 2026-09-25 23:28 EDT), each name after its own mark, in utils/rankModes.js's order. MP only: a DMZ build never shows the line, even if old data carried a mode.
function buildRankModeLine(build) {
    if (build.mode === 'DMZ' || !build.rankModes?.length) return null;
    const { RANK_MODES, RANK_MODE_EMOJI } = require('./rankModes');
    const names = RANK_MODES.filter(m => build.rankModes.includes(m)).map(m => `${optionalEmoji(RANK_MODE_EMOJI[m])}${m}`);
    return names.length ? `**Recommended Rank Mode:** ${names.join(' | ')}` : null;
}

// Capitalizes just the first letter (sentence case), leaving everything else untouched -- unlike toTitleCase (adminParser.js), which capitalizes every word. Descriptions come from freeform admin text (originally builds.xlsx's flavor-text column) that isn't always typed starting with a capital, so this is applied at render time rather than trusting the stored casing.
function toSentenceCase(str) {
    return str.replace(/^(\s*)([a-z])/, (_, lead, first) => lead + first.toUpperCase());
}

// Discord blockquote syntax ("> " per line) -- handles a multi-line description, not just a single line, even though every description seen so far has been one line.
function toBlockquote(str) {
    return str.split('\n').map(line => `> ${line}`).join('\n');
}

// "Browse other builds in this category" dropdown (added 2026-07-12, per Harkirat's request) -- lets a user jump straight to a different weapon's card without re-running the slash command, instead of just paging within the current weapon's own builds. `categoryBuilds` is every Loadout doc sharing the current card's scope (same `category`+mode for MP, or every `mode: 'DMZ'` doc for DMZ, since /dmz has no per-category commands the way MP does).
//
// NOTE (simplified during review, per Harkirat's follow-up request): originally listed every INDIVIDUAL build with a "[Build N of M]" suffix on multi-build weapons -- dropped in favor of one entry per WEAPON, since browsing to a specific build variant is already what Prev/Next is for. Selecting a weapon here always opens it at build index 0. `weaponKey` is deduped via a Map (first doc encountered per key wins, which is fine -- every doc for a given weaponKey shares the same weaponName/category), then sorted alphabetically by weapon name.
//
// RESTRUCTURED 2026-10-24 09:45 EDT (Harkirat: "the dropdown menu can be better, and organize/restructure it as well"; "can we make the flow of searching for another weapon or build much more fluid?"). A string select cannot autocomplete, so the first option is **Search all weapons…**, which opens a one-box search (handlers/loadouts.js, `gsb~find~`) that resolves exactly like the slash command. Then one option per weapon with its badges and build count as the second line, and, in the whole-mode browse (`classJumps`), only the current class's weapons followed by a jump to each other class -- 68 MP weapons never fit in 25, and the old "25 of 68" window hid most of them. No option is pre-selected, so the placeholder says what the menu does. Placeholder weapons are never listed.
function buildCategoryBrowseRow(categoryBuilds, activeWeaponKey, idPrefix, scopeLabel, customIdOverride = null, { mode = 'MP', classJumps = false, metaList = false } = {}) {
    if (!categoryBuilds || categoryBuilds.length === 0) return null;
    const real = categoryBuilds.filter(b => !isPlaceholderBuild(b));
    const activeCategory = (real.find(b => b.weaponKey === activeWeaponKey) || real[0] || {}).category;
    const listed = classJumps ? real.filter(b => b.category === activeCategory) : real;

    const weapons = new Map();
    for (const doc of listed) {
        if (!weapons.has(doc.weaponKey)) weapons.set(doc.weaponKey, []);
        weapons.get(doc.weaponKey).push(doc);
    }
    let weaponOptions = Array.from(weapons.entries())
        // By class, then name (Harkirat, 2026-10-24 18:41 EDT: "Correctly organize the dropdown menus as well via category alphabetical"), the same order the browse pager steps through (utils/loadoutScopes.js resolveScopeBuilds).
        .sort((a, b) => a[1][0].category.localeCompare(b[1][0].category) || a[1][0].weaponName.localeCompare(b[1][0].weaponName))
        .map(([weaponKey, builds]) => ({ label: builds[0].weaponName, value: weaponKey, description: weaponSummary(builds, { metaList }) }));
    const jumpOptions = classJumps
        ? [...new Set(real.map(b => b.category))].filter(c => c !== activeCategory).sort()
            .map(c => ({ label: `All ${displayCategoryLabel(c)} builds`, value: `~class~${c}`, description: countLabel(real.filter(b => b.category === c).length) }))
        : [];
    const search = { label: 'Search all weapons…', value: '~search~', description: `Type a name to find any ${mode === 'DMZ' ? 'DMZ' : 'MP'} weapon` };

    // Discord caps a select at 25 options. Never drop weapons silently (commands/admin.js's SELECT_OPTION_CAP sets the house rule): window around the open weapon, and Search still reaches the rest.
    const room = 25 - 1 - jumpOptions.length;
    if (weaponOptions.length > room) {
        const active = Math.max(0, weaponOptions.findIndex(o => o.value === activeWeaponKey));
        const start = Math.min(Math.max(0, active - Math.floor(room / 2)), weaponOptions.length - room);
        weaponOptions = weaponOptions.slice(start, start + room);
    }

    return {
        type: 1,
        components: [{
            type: 3,
            custom_id: customIdOverride || `${idPrefix}browse`,
            placeholder: classJumps ? `Switch weapon or class, or search` : `Switch weapon, or search`,
            options: [search, ...weaponOptions, ...jumpOptions]
        }]
    };
}

// Shared Components V2 card builder for /dmz and /gunsmith (mp + dmz, and their scoped browse) -- same layout for both, differing only in accent color and the button custom_id prefix ('dmz' vs 'mp') so handlers/loadouts.js can tell a click apart and query the right mode.
//
// NOTE (redesigned during review, per Harkirat's loadouts_ui.json reference): weapon name is now the top heading with optional Meta/Best/Top-3 badges directly below it (see buildBadgesLine above), rather than a small category overline -- the category moved down into the footer line instead ("{category} • Build N of M • Last updated..."). The divider between Gunsmith Code and the image was removed. "Attachments"/"Gunsmith Code" are now real H3 headings (### ) rather than bold text, and each attachment line is backtick-wrapped to match the Gunsmith Code code-block styling. V2 still has no equivalent to an embed's *inline fields*, so those two sections stack vertically rather than sitting side-by-side. THE CONTENT HALF, WITHOUT THE CHROME. Split out 2026-08-23 12:55 EDT so a build can be drawn somewhere that is not /gunsmith -- /bot analytics' change-detail panel renders a loadout's before/after through this, per the record-view contract (docs/superpowers/specs/2026-08-23-bot-analytics-live-review-design.md §2 rule D: never RE-DESCRIBE a record, draw it with its own renderer).
//
// ⚠️ WHAT IS DELIBERATELY NOT IN HERE: the Container (type 17) wrapper, the trailing divider, the pagination/Copy row, the browse dropdown and the Share button. Every one of those is a LIVE control whose custom_id routes to handlers/loadouts.js and resolves an index against a query only /gunsmith has made -- embedded in a change panel they would either mislead or misfire, and the Container would nest inside another Container. buildLoadoutCard() below still owns all of it, so its output is byte-identical to before (scripts/loadoutRenderSnapshot.test.js is the proof and must not move). `copyIds` (2026-10-20 12:12 EDT, Harkirat: "move the copy attachment and copy code buttons so they're inline with their respective sections as accessory buttons"): when given, the Attachments and Gunsmith Code headings become Sections with their Copy button as the accessory. Only buildLoadoutCard passes it; a change panel draws the body with no live controls, exactly as before. A "Coming Soon" placeholder (scripts/createPlaceholderLoadouts.js): a weapon whose only attachment line is the coming-soon note has no real build yet. Lists never show it, and opening it draws the missing-weapon card (Harkirat, 2026-10-24 09:45 EDT: "in lists, if a weapon is missing, do not show it in the list. if an image only is missing, that's fine to include").
function isPlaceholderBuild(build) {
    return !(build.attachments || []).some(a => a && !/^coming soon/i.test(String(a).trim()));
}

// A real screenshot, as opposed to the placehold.co "Coming Soon" image a bulk add stores when a block has no image key (utils/adminParser.js PLACEHOLDER_IMAGE).
function hasRealImage(build) {
    return Boolean(build.imageKey) && !/placehold\.co/i.test(build.imageKey);
}

// Attachments in his slot order (utils/adminParser.js CANONICAL_SLOT_ORDER, 2026-07-21: Optic, Muzzle, Barrel, Stock, Laser, Underbarrel, Rear Grip, Ammunition, Perk), read off each build's stored attachmentSlots. Measured 2026-10-24 09:52 EDT on the dev data: 90 of 132 builds were stored in another order (most with Ammunition before Rear Grip), because only /autobuild sorted at save time. Sorting here covers every save path and the Copy Attachments reply alike; a name with no recorded slot keeps its place after the known ones.
function orderedAttachments(build) {
    const { orderAttachmentsBySlot } = require('./adminParser');
    return orderAttachmentsBySlot(build.attachments || [], build.attachmentSlots || []).attachments;
}

function countLabel(n) {
    return `${n} build${n === 1 ? '' : 's'}`;
}

// A weapon's strongest rank across its builds, as plain words for a dropdown option (no emoji: an option description is plain text): Best, then the lowest Top N. Capable is not shown (Harkirat, 2026-10-24 18:25 EDT: "only mention if a weapon is meta or top three or top five or best"). `short` drops the MP class ("Top 3") where the line already names it.
function bestRankLabel(builds, { short = false } = {}) {
    let best = null, score = Infinity;
    for (const b of builds) {
        const raw = b.mode === 'DMZ' ? b.dmzRangeRank : b.categoryRank;
        const m = raw ? /^(best|top(\d+))/.exec(raw) : null;
        if (!m) continue;
        const s = m[1] === 'best' ? 0 : Number(m[2]);
        if (s < score) { score = s; best = b; }
    }
    if (!best) return null;
    const raw = best.mode === 'DMZ' ? best.dmzRangeRank : '';
    const label = best.mode === 'DMZ' ? (raw.includes('-close') ? 'Close Range' : raw.includes('-midlong') ? 'Mid-Long Range' : 'DMZ') : (short ? '' : displayCategoryLabel(best.category));
    return (score === 0 ? `Best ${label}` : `Top ${score} ${label}`).trim();
}

// One dropdown option's second line: "Meta · Best AR · 3 builds". Only Meta and the Best / Top N rank, never Toxic, Ass or Capable (Harkirat, 2026-10-24 18:25 EDT). In the META list every weapon is Meta, so the line names the class instead (same message: "in the dropdown for the meta list, can you also mention the category of that weapon?"): "AR · Top 3 · 2 builds".
function weaponSummary(builds, { metaList = false } = {}) {
    const parts = [];
    if (metaList) parts.push(displayCategoryLabel(builds[0].category));
    else if (builds.some(b => b.isMeta)) parts.push('Meta');
    const rank = bestRankLabel(builds, { short: metaList });
    if (rank) parts.push(rank);
    // Toxic too (Harkirat, 2026-10-25 23:33 EDT: MAN-O-WAR sat in the Meta list with no reason shown; "it's meta because of its toxic ability").
    if (builds.some(b => b.isToxic)) parts.push('Toxic');
    parts.push(countLabel(builds.length));
    return parts.join(' · ').slice(0, 100);
}

function buildLoadoutCardBody(activeBuild, { index = 0, total = 1, hideBadges = false, copyIds = null, footerBuild = true, footerClass = true } = {}) {
    // Numbered, his format (2026-10-25 15:38 EDT). `copyIds` is no longer drawn (the Copy buttons moved to the card's bottom row, 16:25 EDT) and is kept only so old callers still pass.
    void copyIds;
    const attachmentLines = orderedAttachments(activeBuild).map((att, i) => `${i + 1}. \`${att}\``).join('\n');
    const lastUpdatedUnix = Math.floor(new Date(activeBuild.lastUpdated).getTime() / 1000);

    // `##`, not `#` (Harkirat, 2026-10-20 22:23 EDT): every other panel's title is `##`, and on a phone `#` wraps the longer command titles onto two lines.
    let titleContent = `## ${activeBuild.weaponName}`;
    // hideBadges is set for a meta scope browse -- "Meta" is implied by the view itself there, per Harkirat's call to hide the WHOLE badge line rather than just the redundant Meta badge. Category browses keep badges ("Best AR" is still informative in an AR list).
    const badgesLine = hideBadges ? null : buildBadgesLine(activeBuild);
    if (badgesLine) titleContent += `\n${badgesLine}`;
    const rankModeLine = hideBadges ? null : buildRankModeLine(activeBuild);
    if (rankModeLine) titleContent += `\n${rankModeLine}`;

    const containerComponents = [
        { type: 10, content: titleContent }
    ];

    containerComponents.push({ type: 14, spacing: 1, divider: true });

    // Optional flavor text (e.g. "No suppressor build... FMJ allows 1 tap through walls") — omitted entirely when blank, matching the established pattern elsewhere (e.g. patchnotes.js). Moved below the divider (was above it) and switched from italic to a real blockquote (`> `) per Harkirat's request; toSentenceCase() guards against admin-typed descriptions that didn't start with a capital letter.
    if (activeBuild.description) {
        containerComponents.push({ type: 10, content: toBlockquote(toSentenceCase(activeBuild.description)) });
    }

    containerComponents.push({ type: 10, content: `### Attachments\n${attachmentLines}` });

    // Prefers the real in-game Gunsmith code (shareCode) when present, falling back to buildName — see models/Loadout.js for why these are two separate fields. DMZ builds never have a real code (confirmed by Harkirat — the DMZ Gunsmith screen doesn't expose one the way MP's does), so this whole section (and the Copy Code button below) is skipped entirely for DMZ rather than showing the buildName as if it were a real copyable code.
    const codeText = activeBuild.mode !== 'DMZ' && (activeBuild.shareCode || activeBuild.buildName);
    // The code on its heading's line, his format (2026-10-25 15:38 EDT): "### Gunsmith Code: `1C2B4A8B9A`".
    if (codeText) containerComponents.push({ type: 10, content: `### Gunsmith Code: \`${codeText}\`` });

    // NOTE (removed during review, per Harkirat's request): there used to be a divider here between Gunsmith Code and the image -- dropped so the image sits directly under the text above it. 🔴 GUARDED, and NOT defensively -- found live 2026-08-23 12:58 EDT while wiring the change-detail panel. buildImageUrl() calls imageKey.startsWith(), which THROWS on a build with no imageKey. Every stored Loadout has one, so /gunsmith never hit it; a change panel does, because it reconstructs a BEFORE state as {...current, ...inversePayload} and renders delete payloads that may carry only the fields the op touched. renderRecord()'s try/catch would have swallowed the throw and quietly fallen back to a field list -- the budget fallback firing for the wrong reason, which is the "a guard that never fires is decoration" failure inverted. Omitting the gallery is the honest render of a build with no image.
    if (activeBuild.imageKey) {
        // A small space over the screenshot, no line (Harkirat, 2026-10-25 15:38-16:40 EDT: the line moved below the image, where it sets off the footer and the controls; it was a divider:true small since 2026-10-24 09:45 EDT).
        containerComponents.push({ type: 14, spacing: 1, divider: false });
        // A build with only the placeholder image says so in one quiet line instead of showing a grey "Coming Soon" rectangle; it stays in every list (his call, same message).
        if (hasRealImage(activeBuild)) containerComponents.push({ type: 12, items: [{ media: { url: buildImageUrl(activeBuild.imageKey) } }] });
        else containerComponents.push({ type: 10, content: '-# *No screenshot of this build yet.*' });
    }
    // `footerBuild` is false on a single weapon's card with a pager, which already reads "Build 2 of 5"; a browse card's pager counts the class instead, and a one-build card has no pager, so both keep the build in the footer (Harkirat, 2026-10-24 18:25 EDT: with one build "it doesn't mention build one of one for this anymore"). A submitted build names its submitter at the end, or "anonymous" (Harkirat, 2026-10-25 16:53-16:59 EDT); the mention never pings (every send here goes out with no allowed mentions).
    const sub = activeBuild.submittedBy && activeBuild.submittedBy.discordId ? (activeBuild.submittedBy.credited ? `Submitted by <@${activeBuild.submittedBy.discordId}>` : 'Submitted by *anonymous*') : null;
    containerComponents.push({ type: 10, content: `-# ${[footerClass ? displayCategoryLabel(activeBuild.category) : null, footerBuild ? `Build ${index + 1} of ${total}` : null, `Updated <t:${lastUpdatedUnix}:D>`, sub].filter(Boolean).join(' • ')}` });

    return containerComponents;
}

// THE SWITCH ROWS UNDER THE CARD (Harkirat's /gunsmith review, 2026-10-25 15:33-16:40 EDT). MP: two dropdowns, the class ("Switch class...", each "View all AR gunsmiths", the open class picked), then that class's weapons ("Browse other Assault Rifles...", "Or search all weapons..." first, the built weapons, and "N more with no build yet..." last, which opens the class's no-build weapons with a pager, his option 2). The META browse gets one "Jump to a specific weapon..." of its meta weapons, the class in each line. DMZ gets one "Browse other DMZ gunsmiths..." of every DMZ weapon (there are few), class and Meta in each line. No MP / DMZ meta switch any more (his 16:40 EDT call). Every list fits 25: a class's built weapons were 17 at most on 2026-10-25 17:20 EDT, and the day one passes 23 is filed in docs/db-deferred-list.md (a second dropdown).
const CLASS_PLURAL = { AR: 'Assault Rifles', SMG: 'SMGs', LMG: 'LMGs', MARKSMAN: 'Marksman Rifles', SNIPER: 'Sniper Rifles', SHOTGUN: 'Shotguns', SECONDARIES: 'Secondaries' };
function classPlural(category) {
    return CLASS_PLURAL[String(category || '').toUpperCase()] || displayCategoryLabel(category);
}
function weaponGroups(builds) {
    const map = new Map();
    for (const b of (builds || []).filter(x => !isPlaceholderBuild(x))) {
        if (!map.has(b.weaponKey)) map.set(b.weaponKey, []);
        map.get(b.weaponKey).push(b);
    }
    return [...map.values()];
}
// Keeps a list to `room` options, centred on the open weapon, so it is never silently cut at its end.
function windowAround(options, activeKey, room) {
    if (options.length <= room) return options;
    const at = Math.max(0, options.findIndex(o => o.value === activeKey));
    const start = Math.min(Math.max(0, at - Math.floor(room / 2)), options.length - room);
    return options.slice(start, start + room);
}
function mpSwitchRows(category, classBuilds, weaponSelectId, activeKey, missing = []) {
    // Each class carries his weapon-class icon (2026-10-25 23:36 EDT, his ask), read at render time so the dev bot's re-pointed ids apply.
    const CLASS_ICON = { AR: 'wcAR', LMG: 'wcLMG', MARKSMAN: 'wcMarksman', SECONDARIES: 'wcPistol', SHOTGUN: 'wcShotgun', SMG: 'wcSMG', SNIPER: 'wcSniper' };
    const classRow = { type: 1, components: [{ type: 3, custom_id: 'gsb~class~MP', placeholder: 'Switch class...',
        options: Object.keys(CLASS_PLURAL).sort().map(c => ({ label: classPlural(c), value: c, description: `View all ${displayCategoryLabel(c)} gunsmiths`, default: c === category, ...(emojis[CLASS_ICON[c]] ? { emoji: emojis.parseEmoji(emojis[CLASS_ICON[c]]) } : {}) })) }] };
    const groups = weaponGroups((classBuilds || []).filter(b => b.category === category)).sort((a, b) => a[0].weaponName.localeCompare(b[0].weaponName));
    // No "Or search all weapons..." option any more (Harkirat, 2026-10-25 23:20 EDT: "you also dont need this search option in the dropdown, since we have a dedicated 'search' button for it now"); handlers/loadouts.js still answers `~search~` from cards posted before.
    const more = missing.length ? [{ label: `${missing.length} more with no build yet...`, value: `~nobuild~${category}`, description: `Show the ${classPlural(category)} Dioreo has no build for` }] : [];
    const weapons = windowAround(groups.map(list => ({ label: list[0].weaponName, value: list[0].weaponKey, description: weaponSummary(list) })), activeKey, 25 - more.length);
    const weaponRow = { type: 1, components: [{ type: 3, custom_id: weaponSelectId, placeholder: `Browse other ${classPlural(category)}...`, options: [...weapons, ...more] }] };
    return [classRow, weaponRow];
}
function metaJumpRow(metaBuilds, selectId, activeKey) {
    const groups = weaponGroups(metaBuilds).sort((a, b) => a[0].category.localeCompare(b[0].category) || a[0].weaponName.localeCompare(b[0].weaponName));
    if (groups.length < 2) return null;
    const options = windowAround(groups.map(list => ({ label: list[0].weaponName, value: list[0].weaponKey, description: weaponSummary(list, { metaList: true }) })), activeKey, 25);
    return { type: 1, components: [{ type: 3, custom_id: selectId, placeholder: 'Jump to another META weapon...', options }] }; // names the META list (his 2026-10-25 23:32 EDT ask; META in capitals, 23:35 EDT)
}
function dmzBrowseRow(dmzBuilds, selectId, activeKey) {
    const groups = weaponGroups(dmzBuilds).sort((a, b) => a[0].weaponName.localeCompare(b[0].weaponName));
    if (groups.length < 2) return null;
    const options = windowAround(groups.map(list => ({ label: list[0].weaponName, value: list[0].weaponKey, description: `${displayCategoryLabel(list[0].category)}${list.some(b => b.isMeta) ? ' · Meta' : ''}` })), activeKey, 25);
    return { type: 1, components: [{ type: 3, custom_id: selectId, placeholder: 'Browse other DMZ gunsmiths...', options }] };
}

// Shared Components V2 card builder for /dmz and /gunsmith (mp + dmz, and their scoped browse) -- same layout for both, differing only in accent color and the button custom_id prefix ('dmz' vs 'mp') so handlers/loadouts.js can tell a click apart and query the right mode. The card's CONTENT comes from buildLoadoutCardBody above; everything this function adds is chrome (pager, the bottom row, the switch rows, share). `missing` is the open class's weapons with no build (utils/loadoutLookup.js missingWeapons), for the weapon dropdown's last option.
//
// HIS LAYOUT (2026-10-25 18:43-19:02 EDT, mock-ups C to E in #testing-spam; it replaced the 16:40 EDT order): the body ends with the footer under the image; then a row of the weapon's builds, a LARGE divider, and the arrows, which walk WEAPONS. Search... and Copy Code (DMZ: Copy Attachments) sit outside the card, above the dropdowns. The old `copyatt` ids still answer cards posted before.
function buildLoadoutCard(builds, index, { color, idPrefix, isEphemeral = false, categoryBuilds = null, hideBadges = false, browse = null, missing = [] }) {
    const activeBuild = builds[index];
    const mode = activeBuild.mode === 'DMZ' ? 'DMZ' : 'MP';
    const copyAttCustomId = browse ? `gsb~copyatt~${browse.scopeToken}~${browse.flatIndex}` : `${idPrefix}copyatt_${activeBuild.weaponKey}_${index}`;
    const copyCustomId = browse ? `gsb~copy~${browse.scopeToken}~${browse.flatIndex}` : `${idPrefix}copy_${activeBuild.weaponKey}_${index}`;
    // The arrows walk WEAPONS and a row of numbers walks the open weapon's builds (Harkirat, 2026-10-25 18:48 EDT: "arrow switch weapons, build row switches builds"). The open build is green and named, "Build 3"; the others are plain numbers so five fit on one phone row (18:51 EDT). The middle of the pager names the class and the weapon's place in it, "AR · 3/17" (his 18:49 EDT pick over the weapon's name, whose width would move the arrows). A card with no class to walk (the hidden /dmz, /autobuild's saved card, the portal preview) keeps the build row and has no arrows. Every card /gunsmith opens is a browse: a weapon opened by name, Search... or the weapon dropdown is drawn inside its class (commands/gunsmith.js renderScopeBrowse's `weaponKey`).
    let weaponPager = null;
    if (browse && categoryBuilds && categoryBuilds.length) {
        const flat = Math.min(Math.max(Number(browse.flatIndex) || 0, 0), categoryBuilds.length - 1);
        const active = categoryBuilds[flat];
        const weaponOrder = [...new Set(categoryBuilds.map(b => b.weaponKey))];
        const classWeapons = [...new Set(categoryBuilds.filter(b => b.category === active.category).map(b => b.weaponKey))];
        weaponPager = buildPaginationRow({
            totalChunks: weaponOrder.length, currentPage: weaponOrder.indexOf(active.weaponKey),
            prevCustomId: `gsb~prev~${browse.scopeToken}~${flat}`, nextCustomId: `gsb~next~${browse.scopeToken}~${flat}`,
            indicatorCustomId: `gsb~ind~${browse.scopeToken}`, indicatorLabel: `${displayCategoryLabel(active.category)} · ${classWeapons.indexOf(active.weaponKey) + 1}/${classWeapons.length}`,
        });
    }
    // The footer drops the class when the pager names it, and the build count always: the build row shows it (his 18:49 and 19:02 EDT calls).
    const containerComponents = buildLoadoutCardBody(activeBuild, { index, total: builds.length, hideBadges, footerBuild: false, footerClass: !weaponPager });
    // A browse card's build sits at a flat index in the scope, and a weapon's builds are next to each other there (utils/loadoutScopes.js sorts by class, then weapon), so build i is `flatIndex - index + i`. Five per row is Discord's cap; no weapon has more than five today.
    if (builds.length > 1) {
        const firstFlat = browse ? (Number(browse.flatIndex) || 0) - index : 0;
        const buttons = builds.map((b, i) => ({
            type: 2, style: i === index ? 3 : 2, disabled: i === index,
            // The open build reads `Build N` in text; the others are his Number1-Number6 icons with no label (2026-10-25 22:47 EDT), and a plain number past six.
            ...(i === index ? { label: `Build ${i + 1}` } : emojis[`number${i + 1}`] ? { emoji: emojis.parseEmoji(emojis[`number${i + 1}`]) } : { label: `${i + 1}` }),
            custom_id: browse ? `gsb~at~${browse.scopeToken}~${firstFlat + i}` : `${idPrefix}at_${activeBuild.weaponKey}_${i}`,
        }));
        for (let i = 0; i < buttons.length; i += 5) containerComponents.push({ type: 1, components: buttons.slice(i, i + 5) });
    }
    if (weaponPager) containerComponents.push({ type: 14, spacing: 2, divider: true }, weaponPager);

    const containerPayload = { type: 17, accent_color: color, components: containerComponents };
    // Search... and Copy Code sit OUTSIDE the panel, right under it and above the dropdowns (his 18:44 EDT ask). Search... opens the card's one-box search (handlers/loadouts.js `gsb~search~<mode>` -> `gsb~find~<mode>`) and carries his GunsmithSearch icon (2026-10-25 22:32 EDT); Copy Attachments carries CopyAttachments. The switch rows follow, outside too (his earlier call: a dropdown is a sibling row, not nested).
    const outerComponents = [containerPayload, { type: 1, components: [
        // Search · Attachments · Code, in that order, one word each (Harkirat, 2026-10-25 23:18 EDT: "search... -> Search", "copy attachments -> Attachments", "copy code -> Code", and Attachments back on the MP card). DMZ has no Gunsmith code, so it stops at Attachments.
        { type: 2, style: 2, label: 'Search', custom_id: `gsb~search~${mode}`, emoji: emojis.parseEmoji(emojis.gunsmithSearch) },
        { type: 2, style: 2, label: 'Attachments', custom_id: copyAttCustomId, emoji: emojis.parseEmoji(emojis.copyAttachments) },
        ...(mode === 'DMZ' ? [] : [{ type: 2, style: 1, label: 'Code', custom_id: copyCustomId, emoji: emojis.parseEmoji(emojis.gunsmithCode) }]),
    ] }];
    const scope = browse ? require('./loadoutScopes').parseScopeToken(browse.scopeToken) : null;
    const weaponSelectId = browse ? `gsb~jump~${browse.scopeToken}` : `${idPrefix}browse`;
    if (mode === 'DMZ') {
        const row = dmzBrowseRow(categoryBuilds, weaponSelectId, activeBuild.weaponKey);
        if (row) outerComponents.push(row);
    } else if (scope && scope.metaOnly) {
        const row = metaJumpRow(categoryBuilds, weaponSelectId, activeBuild.weaponKey);
        if (row) outerComponents.push(row);
    } else {
        outerComponents.push(...mpSwitchRows(activeBuild.category, categoryBuilds, weaponSelectId, activeBuild.weaponKey, missing));
    }

    // "Share Publicly" stays its own row OUTSIDE the container too — same convention as every other command in the bot, see utils/shareButton.js.
    return { components: withShareButton(outerComponents, isEphemeral), flags: 32768 };
}

// The card for a weapon the game has and Dioreo has no build for yet (Harkirat, 2026-10-24 09:45 EDT: "design the panel in case a weapon is missing?"). His 2026-10-25 16:40 EDT structure: title, divider, the No build yet line, the footer, then (reached through "N more with no build yet...") a pager through the class's no-build weapons, a large divider, and a row of "Browse other AR builds" and "Submit a Build" (`gsb~submit~<mode>~<catalogue key>`, utils/buildSubmissions.js). The class and weapon dropdowns sit under it as under any MP card. No Share: there is nothing to share.
function buildMissingWeaponCard({ weaponName, category, mode = 'MP', isEphemeral = false, categoryBuilds = [], missing = [], nb = null }) {
    void isEphemeral;
    const idPrefix = mode === 'DMZ' ? 'dmz' : 'mp';
    const label = mode === 'DMZ' ? 'DMZ' : displayCategoryLabel(category);
    const real = (categoryBuilds || []).filter(b => !isPlaceholderBuild(b));
    const containerComponents = [
        { type: 10, content: `## ${weaponName}` },
        { type: 14, spacing: 1, divider: true },
        // The missing line in italics (Harkirat, 2026-10-24 18:25 EDT).
        { type: 10, content: `### No build yet\n*Dioreo has no ${weaponName} build yet.*` },
        // "SMG • Build pending" (Harkirat, 2026-10-24 18:36 EDT), the same dot the build cards' footers use.
        { type: 10, content: `-# ${mode === 'DMZ' ? 'DMZ' : displayCategoryLabel(category)} • Build pending` },
    ];
    if (nb && nb.total > 1) {
        containerComponents.push({ type: 14, spacing: 1, divider: false }, buildPaginationRow({ totalChunks: nb.total, currentPage: nb.index, makeCustomId: p => `gsb~nb~${category}~${p}`, indicatorCustomId: 'gsb~nbind', indicatorLabel: `No build yet · ${nb.index + 1}/${nb.total}` }));
    }
    containerComponents.push({ type: 14, spacing: 2, divider: true });
    const row = [];
    // Browse is grey with his GunsmithSearch icon, Submit a Build blue with his Share icon (colours 2026-10-25 23:41 EDT; icons 2026-10-25 23:41 EDT, his ask).
    if (real.length) row.push({ type: 2, style: 2, label: `Browse other ${label} builds`, custom_id: `gsb~open~${mode === 'DMZ' ? 'DMZ.*.std' : `MP.${category}.std`}`, emoji: emojis.parseEmoji(emojis.gunsmithSearch) });
    row.push({ type: 2, style: 1, label: 'Submit a Build', custom_id: `gsb~submit~${mode}~${String(weaponName).toLowerCase().replace(/[^a-z0-9]/g, '')}`.slice(0, 100), emoji: emojis.parseEmoji(emojis.share) });
    containerComponents.push({ type: 1, components: row });
    const components = [{ type: 17, accent_color: getMpCategoryAccent(category), components: containerComponents }];
    if (mode === 'DMZ') {
        const dmzRow = dmzBrowseRow(real, `${idPrefix}browse`, null);
        if (dmzRow) components.push(dmzRow);
    } else {
        components.push(...mpSwitchRows(category, real, `${idPrefix}browse`, null, missing));
    }
    return { components, flags: 32768 };
}

module.exports = { classPlural, buildImageUrl, checkImageExists, buildLoadoutCard, buildLoadoutCardBody, buildMissingWeaponCard, getMpCategoryAccent, displayCategoryLabel, computeWeaponKeyAndBuild, findDuplicateLoadouts, isPlaceholderBuild, hasRealImage, orderedAttachments };
