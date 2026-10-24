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

// Cosmetic display-only relabeling (2026-07-18, v2 quick-wins follow-up) -- `SECONDARIES` is the real stored `Loadout.category` enum value, the `/secondaries` command name, and that command's own description ALL stay exactly as-is (Harkirat's explicit call -- nothing about the data model, command registration, or category filtering changes). This ONLY relabels how the category reads in specific SHORT, singular-implying UI spots where the plural form sounds wrong grammatically ("Best SECONDARIES" reads oddly for a single weapon) -- currently just the badge line below. Every other category (AR/SMG/LMG/MARKSMAN/SNIPER/SHOTGUN) passes through unchanged.
function displayCategoryLabel(category) {
    return category === 'SECONDARIES' ? 'SECONDARY' : category;
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
function buildCategoryBrowseRow(categoryBuilds, activeWeaponKey, idPrefix, scopeLabel, customIdOverride = null, { mode = 'MP', classJumps = false } = {}) {
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
        .sort((a, b) => a[1][0].weaponName.localeCompare(b[1][0].weaponName))
        .map(([weaponKey, builds]) => ({ label: builds[0].weaponName, value: weaponKey, description: weaponSummary(builds) }));
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

// A weapon's strongest rank across its builds, as plain words for a dropdown option (no emoji: an option description is plain text). Best, then the lowest Top N, then Capable.
function bestRankLabel(builds) {
    let best = null, score = Infinity;
    for (const b of builds) {
        const raw = b.mode === 'DMZ' ? b.dmzRangeRank : b.categoryRank;
        const m = raw ? /^(best|top(\d+)|capable)/.exec(raw) : null;
        if (!m) continue;
        const s = m[1] === 'best' ? 0 : m[2] ? Number(m[2]) : 99;
        if (s < score) { score = s; best = b; }
    }
    if (!best) return null;
    const raw = best.mode === 'DMZ' ? best.dmzRangeRank : '';
    const label = best.mode === 'DMZ' ? (raw.includes('-close') ? 'Close Range' : raw.includes('-midlong') ? 'Mid-Long Range' : 'DMZ') : displayCategoryLabel(best.category);
    return score === 0 ? `Best ${label}` : score === 99 ? `Capable ${label}` : `Top ${score} ${label}`;
}

// One dropdown option's second line: "Meta · Best AR · 3 builds".
function weaponSummary(builds) {
    const parts = [];
    if (builds.some(b => b.isMeta)) parts.push('Meta');
    const rank = bestRankLabel(builds);
    if (rank) parts.push(rank);
    if (builds.some(b => b.isToxic)) parts.push('Toxic');
    parts.push(countLabel(builds.length));
    return parts.join(' · ').slice(0, 100);
}

function buildLoadoutCardBody(activeBuild, { index = 0, total = 1, hideBadges = false, copyIds = null, footerBuild = true } = {}) {
    const attachmentLines = orderedAttachments(activeBuild).map(att => `• \`${att}\``).join('\n');
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

    if (copyIds) {
        // No icon on Copy Attachments (Harkirat, 2026-10-24 09:45 EDT: "let's leave it out entirely for now"): the weapon-class icons wait for the per-weapon emojis a peer session is drawing, and then go after the weapon name in the title, tilted (docs/db-deferred-list.md). The list rides INSIDE the Section with its title (Harkirat, 2026-10-24 01:10 EDT): on a phone the accessory button drops below the whole Section, so it now lands under the attachments instead of between the title and the list.
        containerComponents.push({ type: 9, components: [{ type: 10, content: `### Attachments\n${attachmentLines}` }], accessory: { type: 2, style: 2, label: 'Copy Attachments', custom_id: copyIds.attachments } });
    } else {
        containerComponents.push({ type: 10, content: `### Attachments\n${attachmentLines}` });
    }

    // Prefers the real in-game Gunsmith code (shareCode) when present, falling back to buildName — see models/Loadout.js for why these are two separate fields. DMZ builds never have a real code (confirmed by Harkirat — the DMZ Gunsmith screen doesn't expose one the way MP's does), so this whole section (and the Copy Code button below) is skipped entirely for DMZ rather than showing the buildName as if it were a real copyable code.
    const codeText = activeBuild.mode !== 'DMZ' && (activeBuild.shareCode || activeBuild.buildName);
    if (codeText) {
        if (copyIds) {
            // Primary (blue), not Success (green), per Harkirat 2026-10-20 22:23 EDT: blue is the bot's call-to-action colour, green means "set / you are here". Copy Attachments stays grey as the secondary courtesy button. The code rides inside its Section too, for the same phone layout (2026-10-24 01:10 EDT).
            containerComponents.push({ type: 9, components: [{ type: 10, content: `### Gunsmith Code\n\`${codeText}\`` }], accessory: { type: 2, style: 1, label: 'Copy Code', custom_id: copyIds.code, emoji: emojis.parseEmoji(emojis.gunsmithCode) } });
        } else {
            containerComponents.push({ type: 10, content: `### Gunsmith Code\n\`${codeText}\`` });
        }
    }

    // NOTE (removed during review, per Harkirat's request): there used to be a divider here between Gunsmith Code and the image -- dropped so the image sits directly under the text above it. 🔴 GUARDED, and NOT defensively -- found live 2026-08-23 12:58 EDT while wiring the change-detail panel. buildImageUrl() calls imageKey.startsWith(), which THROWS on a build with no imageKey. Every stored Loadout has one, so /gunsmith never hit it; a change panel does, because it reconstructs a BEFORE state as {...current, ...inversePayload} and renders delete payloads that may carry only the fields the op touched. renderRecord()'s try/catch would have swallowed the throw and quietly fallen back to a field list -- the budget fallback firing for the wrong reason, which is the "a guard that never fires is decoration" failure inverted. Omitting the gallery is the honest render of a build with no image.
    if (activeBuild.imageKey) {
        // A small divider over the screenshot (Harkirat, 2026-10-24 09:45 EDT: "add a divider:true small above the loadout image").
        containerComponents.push({ type: 14, spacing: 1, divider: true });
        // A build with only the placeholder image says so in one quiet line instead of showing a grey "Coming Soon" rectangle; it stays in every list (his call, same message).
        if (hasRealImage(activeBuild)) containerComponents.push({ type: 12, items: [{ media: { url: buildImageUrl(activeBuild.imageKey) } }] });
        else containerComponents.push({ type: 10, content: '-# No screenshot of this build yet.' });
    }
    // `footerBuild` is false on a single weapon's card, whose pager already reads "Build 2/5"; a browse card's pager counts the class instead, so its footer keeps the build.
    containerComponents.push({ type: 10, content: `-# ${[activeBuild.category, footerBuild ? `Build ${index + 1} of ${total}` : null, `Updated <t:${lastUpdatedUnix}:D>`].filter(Boolean).join(' • ')}` });

    return containerComponents;
}

// Shared Components V2 card builder for /dmz and /gunsmith (mp + dmz, and their scoped browse) -- same layout for both, differing only in accent color and the button custom_id prefix ('dmz' vs 'mp') so handlers/loadouts.js can tell a click apart and query the right mode. The card's CONTENT comes from buildLoadoutCardBody above; everything this function adds is chrome (container, controls, share).
function buildLoadoutCard(builds, index, { color, idPrefix, isEphemeral = false, categoryBuilds = null, hideBadges = false, browse = null }) {
    const activeBuild = builds[index];
    const copyAttCustomId = browse ? `gsb~copyatt~${browse.scopeToken}~${browse.flatIndex}` : `${idPrefix}copyatt_${activeBuild.weaponKey}_${index}`;
    const copyCustomId = browse ? `gsb~copy~${browse.scopeToken}~${browse.flatIndex}` : `${idPrefix}copy_${activeBuild.weaponKey}_${index}`;
    const containerComponents = buildLoadoutCardBody(activeBuild, { index, total: builds.length, hideBadges, copyIds: { attachments: copyAttCustomId, code: copyCustomId }, footerBuild: Boolean(browse) });

    // NOTE (moved during review): buttons live INSIDE the container now (were a separate row outside it), with a divider between them and the image/caption above — per Harkirat's request. Prev/Next also switched from plain "Back"/"Next" text buttons to the same Left/Right-emoji + numbers-only pagination style used everywhere else in the bot (utils/paginationRow.js), for consistency.
    containerComponents.push({ type: 14, spacing: 1, divider: true });

    // (History: until 2026-10-20 12:12 EDT the Copy buttons shared this row.) Pagination + Copy Attachments + Copy Code all share one row -- exactly 5 buttons in the worst case (Left/counter/Right/Copy Attachments/Copy Code), right at Discord's per-row cap. "Copy Attachments" replies with the plain attachment list (one per line, no bullets/backticks/ formatting) as its own ephemeral message, same mechanism as "Copy Code" -- see handlers/loadouts.js's dmz/mp-prefixed button handler's `copyatt` action. Copy Code is skipped for DMZ (see the Gunsmith Code section above) -- no real code to copy, so the row is 4 buttons max there. Loadout cards use the LEGACY prev/next-string form of buildPaginationRow (not makeCustomId): the id encodes a DIRECTION + the current index, and the dmz/mp button handler in handlers/loadouts.js already does the modulo wrap on click ((index ± 1) % builds.length). So looping here needs nothing beyond buildPaginationRow no longer disabling the end buttons (2026-07-21) -- the handler already sends you from the last build to the first and vice-versa. A browse card pages across the whole SCOPE, so its ids carry the scope token + flat index and its indicator counts the scope. A normal card is untouched -- same ids, same totals as before. The pager names where you are, as /calendar's does ("Modes · 3/3", 2026-10-21) -- Harkirat, 2026-10-24 09:45 EDT: "can we improve the pager info in any useful way, such as how we did on the /calendar command?". One weapon's card reads "Build 2/5". A browse (META, All MP, a class) reads the class and the build's place in it, "AR · 5/30", where the bare "5 / 125" said nothing about what the arrows were stepping through; the footer keeps "Build 2 of 5" there.
    let indicatorLabel;
    if (browse && categoryBuilds && categoryBuilds.length) {
        const active = categoryBuilds[Math.min(Math.max(browse.flatIndex, 0), categoryBuilds.length - 1)];
        const inClass = categoryBuilds.filter(b => b.category === active.category);
        const pos = inClass.indexOf(active);
        if (pos !== -1) indicatorLabel = `${displayCategoryLabel(active.category)} · ${pos + 1}/${inClass.length}`;
    } else if (!browse) {
        indicatorLabel = `Build ${index + 1}/${builds.length}`;
    }
    const paginationRow = browse
        ? buildPaginationRow({
            totalChunks: browse.flatTotal,
            currentPage: browse.flatIndex,
            prevCustomId: `gsb~prev~${browse.scopeToken}~${browse.flatIndex}`,
            nextCustomId: `gsb~next~${browse.scopeToken}~${browse.flatIndex}`,
            indicatorCustomId: `gsb~ind~${browse.scopeToken}`,
            indicatorLabel
        })
        : buildPaginationRow({
            totalChunks: builds.length,
            currentPage: index,
            prevCustomId: `${idPrefix}prev_${activeBuild.weaponKey}_${index}`,
            nextCustomId: `${idPrefix}next_${activeBuild.weaponKey}_${index}`,
            indicatorCustomId: `${idPrefix}_page_indicator`,
            indicatorLabel
        });
    const buttonComponents = paginationRow ? [...paginationRow.components] : [];
    // Scope-aware ids for a browse card (v3-pre-release review, finding #1): `index` here is relative to the FILTERED, RE-SORTED scope subset (see utils/loadoutScopes.js's resolveScopeBuilds), not to Loadout.find({weaponKey,mode})'s unfiltered/unsorted result the way a normal card's index is -- these two buttons used the old `${idPrefix}copy(att)_<weaponKey>_<index>` shape regardless, and handlers/loadouts.js resolved that index against the unfiltered query, so Copy Code could hand back a DIFFERENT build's share code than the card actually on screen (matters more once badges become per-BUILD, not per-weapon). A normal (non-browse) card is untouched -- same ids as before. The Copy buttons moved up beside their headings (buildLoadoutCardBody's copyIds, 2026-10-20 12:12 EDT), so this row is the pager alone, and a single-build card has no row at all.
    if (buttonComponents.length) containerComponents.push({ type: 1, components: buttonComponents });
    else containerComponents.pop(); // the divider above it has nothing left to separate

    const containerPayload = { type: 17, accent_color: color, components: containerComponents };

    // "Browse other builds" dropdown -- a SIBLING row below the container, not nested inside it, per Harkirat's explicit request. NOTE: this is NOT because a select menu can't nest inside a Container in general -- /settings and /manage both do exactly that successfully (see settings.js's region/timezone/style/accent-color dropdowns, all pushed into the same containerComponents array as their surrounding Text Displays). The first live attempt at this dropdown (nested inside the container, same as those) failed with "This interaction failed" on click -- root cause not yet confirmed, don't assume it was the nesting itself.
    const scopeLabel = browse ? browse.scopeLabel : (activeBuild.mode === 'DMZ' ? 'DMZ' : activeBuild.category);
    const browseRow = buildCategoryBrowseRow(categoryBuilds, activeBuild.weaponKey, idPrefix, scopeLabel,
        browse ? `gsb~jump~${browse.scopeToken}` : null,
        { mode: activeBuild.mode === 'DMZ' ? 'DMZ' : 'MP', classJumps: Boolean(browse) && browse.scopeToken === 'MP.*.std' });

    const outerComponents = [containerPayload];
    if (browseRow) outerComponents.push(browseRow);
    // A meta browse carries its own MP / DMZ switch, outside the panel at its foot (Harkirat, 2026-10-19 19:38 EDT: "Merge meta into a single list, with a button outside at the foot of the embed to toggle between MP/DMZ metas"). The side on screen is green and disabled, the other grey; a click re-opens the meta browse in that mode from its first build.
    if (browse && browse.scopeToken.endsWith('.*.meta')) {
        const onDmz = browse.scopeToken.startsWith('DMZ');
        outerComponents.push({ type: 1, components: [
            { type: 2, style: onDmz ? 2 : 3, label: 'MP Meta', custom_id: 'gsb~meta~MP.*.meta', disabled: !onDmz },
            { type: 2, style: onDmz ? 3 : 2, label: 'DMZ Meta', custom_id: 'gsb~meta~DMZ.*.meta', disabled: onDmz }
        ] });
    }

    // "Share Publicly" stays its own row OUTSIDE the container too — same convention as every other command in the bot, see utils/shareButton.js.
    const components = withShareButton(outerComponents, isEphemeral);

    return { components, flags: 32768 };
}

// The card for a weapon the game has and Dioreo has no build for yet (Harkirat, 2026-10-24 09:45 EDT: "design the panel in case a weapon is missing?"). Reached from a "Coming Soon" placeholder or a CODM catalogue weapon (utils/loadoutLookup.js resolveWeapon). It says so plainly and points at the same class's builds: a button opens that class's browse, and the dropdown lists its weapons with Search first, so the next step is one tap. No Share: there is nothing to share.
function buildMissingWeaponCard({ weaponName, category, mode = 'MP', isEphemeral = false, categoryBuilds = [] }) {
    const idPrefix = mode === 'DMZ' ? 'dmz' : 'mp';
    const label = mode === 'DMZ' ? 'DMZ' : displayCategoryLabel(category);
    const real = (categoryBuilds || []).filter(b => !isPlaceholderBuild(b));
    const weaponCount = new Set(real.map(b => b.weaponKey)).size;
    const containerComponents = [
        { type: 10, content: `## ${weaponName}` },
        { type: 14, spacing: 1, divider: true },
        { type: 10, content: `### No build yet\nDioreo doesn't have a ${weaponName} build yet.${weaponCount ? ` ${weaponCount} other ${label} weapon${weaponCount === 1 ? ' has' : 's have'} one.` : ''}` },
    ];
    if (real.length) {
        const token = mode === 'DMZ' ? 'DMZ.*.std' : `MP.${category}.std`;
        containerComponents.push({ type: 1, components: [{ type: 2, style: 1, label: `Browse ${mode === 'DMZ' ? 'all DMZ' : `all ${label}`} builds`, custom_id: `gsb~open~${token}` }] });
    }
    containerComponents.push({ type: 10, content: `-# ${mode === 'DMZ' ? 'DMZ' : category}` });
    const components = [{ type: 17, accent_color: getMpCategoryAccent(category), components: containerComponents }];
    const browseRow = buildCategoryBrowseRow(real, null, idPrefix, label, null, { mode });
    if (browseRow) components.push(browseRow);
    return { components, flags: 32768 };
}

module.exports = { buildImageUrl, checkImageExists, buildLoadoutCard, buildLoadoutCardBody, buildMissingWeaponCard, getMpCategoryAccent, displayCategoryLabel, computeWeaponKeyAndBuild, findDuplicateLoadouts, isPlaceholderBuild, hasRealImage, orderedAttachments };
