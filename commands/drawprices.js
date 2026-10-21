// ==========================================
// COMMAND: LUCKY DRAW PRICE BREAKDOWNS
// ==========================================
// ARCHITECTURE: Subcommand structure (/draw prices). Houses static pricing arrays and an internal dropdown to swap region views.

const { SlashCommandBuilder } = require('discord.js');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { buildTitleBlock } = require('../utils/titleBlock');
const { withShareButton } = require('../utils/shareButton');
const { buildGlobalNavRow } = require('../utils/globalNav');
const { resolveEphemeral } = require('../utils/ephemeral');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { buildPaginationRow } = require('../utils/paginationRow');
const { mentionCommand } = require('../utils/commandMentions');
const { withCaptionEmoji } = require('../utils/seasonEmoji');

// Repalette (2026-07-12, Section 5 of the batch) -- see calendar.js's matching comment for the full nav-row hue-spread reasoning. A deep forest emerald ("CP" = currency) -- chosen over a lighter jade alternative Harkirat considered so it reads as confidently "money green" at a glance rather than blending into Patch Notes' gold two slots over.
const PRESET_ACCENT = 2067038; // CP Emerald (#1F8A5E) — 3rd nav button (Draw Prices)

// RAW PULL-COST DATA (per pull, in CP), keyed by CP-region tier then draw type. Deliberately stores ONLY the raw per-pull numbers, never a hand-typed total or running-total string — this exact data has already had real hand-typed math mistakes once (a total that didn't match its own draws sum, a wrong draw value, a typo'd draw value — see git history). Totals and the "spent per attempt" cumulative sequence are always derived from these arrays at render time (formatCP/ buildDrawEntries below), so a wrong number can only ever exist in one place, and a total can never silently drift from its own draws again.
//
// Refreshed 2026-07-11 from Harkirat's own verified combo-notes re-export (drawprices2.txt). `legendaryGunNonReactive.region_10`'s draws were given with a stated total of 4,540 CP in that source, but they actually sum to 4,550 — matches what was already correctly stored here before this refresh, so 4,550 (the real sum) was kept rather than the source doc's own typo. `doubleEpicCharacters.region_30` has no data yet ("pending data" in the source) — buildDrawEntries renders a placeholder line for it instead of a fabricated number.
//
// `legendaryBRVehicle` was removed entirely 2026-07-12 to match Harkirat's own hand-adjusted drawPrices_ui.json reference (his final redesign of this command's whole layout) — it's the one entry present in the old build that doesn't appear anywhere in that file, and since he built that mockup himself rather than us generating it, its absence is read as deliberate rather than an oversight. Its old `altLast` mechanism (a Reactive/Non-Reactive split on the final pull) went with it — nothing else ever used that field.
//
// `region_20` added 2026-08-07 from Harkirat's own screenshots of the real 10/20/30 CP breakdown — REAL data, not derived. (An earlier pass this same session validated an arithmetic-mean-of- region_10/region_30 model against this exact data before it existed in code: the model matched almost every pull within 0-3%, with the last 1-2 "chase" pulls sometimes running ~9% lower than the model predicted — useful context if a FUTURE draw's 20 CP data is ever missing and needs a stand-in estimate, but every number below is the real sourced value, not that estimate.) `doubleEpicCharacters.region_20` stays `null` — no real data exists for it at any region beyond 10 CP (same "no data yet" convention as `doubleEpicCharacters.region_30` below; a speculative guess was deliberately left out rather than shipped as real pricing). `mythicWeapon`/`mythicCharacter` have NO `upgrade` field at region_20 — the screenshots only gave the per-pull draw totals, not the separate Upgrade cost, so there's no real number to put there yet. buildDrawEntries' `if (entry.upgrade)` check means the Upgrade line simply doesn't render for these two entries in the 20 CP region until real data shows up — not a bug, just unavailable.
const DRAW_DATA = {
    region_10: {
        label: '10 CP Region',
        mythicWeapon: { draws: [10, 30, 50, 120, 200, 320, 520, 960, 1300, 2300], upgrade: { perDraw: 570, count: 10 } },
        mythicCharacter: { draws: [20, 50, 90, 160, 280, 440, 680, 1100, 1700, 2700], upgrade: { perDraw: 855, count: 14 } },
        legendaryGunReactive: { draws: [10, 30, 50, 120, 200, 320, 520, 800, 1100, 1800] },
        legendaryGunNonReactive: { draws: [10, 30, 50, 120, 200, 320, 520, 800, 1100, 1400] },
        doubleLegendaryWeapons: { draws: [10, 30, 50, 120, 200, 320, 520, 1100, 1400, 1600] },
        legendaryCharacterWeapon: { draws: [10, 30, 50, 120, 200, 320, 520, 800, 1500, 2200] },
        sevenSpinLegendaryWeapon: { draws: [10, 50, 140, 300, 600, 1100, 1600] },
        pickYourRewardCard: { draws: [60, 60, 90, 90, 150, 600, 2190] },
        doubleEpicCharacters: { draws: [10, 25, 40, 100, 160, 280, 560, 640, 1000, 1200] }
    },
    region_20: {
        label: '20 CP Region',
        // Upgrades added 2026-10-16 11:14 EDT, Harkirat's figures: "20 region mythic card 1000cp x 10 (mythic wep upgrade)", "20cp region mythic coins 1170cp x 14 spins (mythic character upgrade)".
        mythicWeapon: { draws: [20, 55, 80, 210, 350, 560, 900, 1600, 2300, 4000], upgrade: { perDraw: 1000, count: 10 } },
        mythicCharacter: { draws: [35, 90, 155, 280, 490, 770, 1200, 2000, 2900, 4700], upgrade: { perDraw: 1170, count: 14 } },
        legendaryGunReactive: { draws: [20, 55, 80, 210, 350, 560, 900, 1400, 1900, 3200] },
        legendaryGunNonReactive: { draws: [20, 55, 80, 210, 350, 560, 900, 1400, 1900, 2400] },
        doubleLegendaryWeapons: { draws: [20, 55, 80, 210, 350, 560, 900, 1900, 2400, 2900] },
        legendaryCharacterWeapon: { draws: [20, 55, 80, 210, 350, 560, 900, 1400, 2700, 3800] },
        sevenSpinLegendaryWeapon: { draws: [20, 60, 180, 400, 800, 1500, 2300] },
        pickYourRewardCard: { draws: [90, 120, 120, 180, 240, 1050, 3870] },
        doubleEpicCharacters: null
    },
    region_30: {
        label: '30 CP Region',
        mythicWeapon: { draws: [30, 80, 120, 300, 500, 800, 1300, 2400, 3400, 5800], upgrade: { perDraw: 1440, count: 10 } },
        mythicCharacter: { draws: [50, 130, 220, 400, 700, 1100, 1700, 2800, 4200, 6700], upgrade: { perDraw: 1440, count: 14 } },
        legendaryGunReactive: { draws: [30, 80, 120, 300, 500, 800, 1300, 2000, 2800, 4700] },
        legendaryGunNonReactive: { draws: [30, 80, 120, 300, 500, 800, 1300, 2000, 2800, 3900] },
        doubleLegendaryWeapons: { draws: [30, 80, 120, 300, 500, 800, 1300, 2800, 3900, 4200] },
        legendaryCharacterWeapon: { draws: [30, 80, 120, 300, 500, 800, 1300, 2000, 3900, 5500] },
        sevenSpinLegendaryWeapon: { draws: [30, 120, 350, 800, 1600, 2800, 3900] },
        pickYourRewardCard: { draws: [120, 150, 180, 240, 360, 1500, 5520] },
        doubleEpicCharacters: null
    }
};

// ADVANCED DOUBLE LEGENDARY WEAPON DRAW (added 2026-07-21, from Harkirat's own 10/30 CP breakdown). A distinct, more elaborate draw type than everything in DRAW_DATA above: it offers THREE purchase modes per spin (Regular / Advanced / the "Trap") PLUS a strategy breakdown, so it doesn't fit the single `draws: []` derive-total model every other entry uses -- it gets its own builder (buildAdvancedDoubleLegendaryEntry) on its own dedicated page instead.
//
// Deliberately stores ONLY the Regular and Advanced per-pull arrays -- same "never hand-type a total, always derive it" rule the rest of this file follows (see DRAW_DATA's own comment). From just these two arrays we derive EVERYTHING else shown:
//   • Trap = ALWAYS exactly 2x the Regular per-pull cost (buying Regular to spin, then paying for the 2nd item afterward, costs the same as a Regular Purchase again -> two Regular Purchases).
//   • Reg/Adv/Trap totals = the sum of each array.
//   • The three Strategy costs = cumulative slices of Regular then Advanced (Reg 1-8 + Adv 9-10, etc).
// So a wrong number can only ever exist in one place, and nothing can silently drift from its source. Canonical low-to-high region order, added 2026-08-07 alongside region_20 -- the single place the 3-way region switcher (buildContainer, below) and anything else that needs to enumerate "all regions in order" reads from, so a future 4th region only ever needs to change this one array.
const REGION_ORDER = ['region_10', 'region_20', 'region_30'];

// Maps a REGION_ORDER key to its emojiMap.js key -- the single place the 3-way region-switch button row (buildContainer, below) looks up which per-region icon a button gets. Added 2026-08-07 15:46 EDT alongside the region10Cp/region20Cp/region30Cp emoji themselves.
const REGION_EMOJI_KEY = { region_10: 'region10Cp', region_20: 'region20Cp', region_30: 'region30Cp' };

// `region_20` added 2026-08-07, same source as DRAW_DATA.region_20 above (Harkirat's real screenshot data) — `adv = reg × 1.6` holds exactly here too, with zero deviation, across all three regions now.
const ADVANCED_DOUBLE_LEGENDARY = {
    region_10: {
        reg: [10, 30, 50, 120, 200, 320, 480, 680, 950, 1400],
        adv: [16, 48, 80, 192, 320, 512, 768, 1088, 1520, 2240]
    },
    region_20: {
        reg: [20, 55, 80, 210, 350, 560, 830, 1190, 1630, 2400],
        adv: [32, 88, 128, 336, 560, 896, 1328, 1904, 2608, 3840]
    },
    region_30: {
        reg: [30, 80, 120, 300, 500, 800, 1200, 1700, 2400, 3900],
        adv: [48, 128, 192, 480, 800, 1280, 1920, 2720, 3840, 6240]
    }
};

// ADVANCED DOUBLE LEGENDARY CHARACTER DRAW (added 2026-08-07, same screenshot source as above). The Character counterpart to ADVANCED_DOUBLE_LEGENDARY: same three-purchase-mode shape, but this banner's own headline reward pair is 2 Legendary Characters (not weapons), with 2 Legendary Weapons as the secondary Advanced-purchase reward (unlike the Weapon draw, where the secondary reward is 2 EPIC characters — both this draw's pairs are Legendary tier). Deliberately stores ONLY `adv` — this draw's Regular-purchase array is byte-identical to DRAW_DATA[region].legendaryCharacterWeapon.draws (verified across all three regions), so `reg` is read from there at render time instead of being hand-typed a second time. Same "a wrong number can only ever exist in one place" rule as everything else in this file.
const ADVANCED_DOUBLE_LEGENDARY_CHARACTER = {
    region_10: { adv: [15, 45, 80, 190, 320, 510, 830, 1280, 2400, 3520] },
    region_20: { adv: [30, 85, 130, 340, 560, 900, 1440, 2240, 4320, 6080] },
    region_30: { adv: [45, 130, 190, 480, 800, 1280, 2080, 3200, 6240, 8800] }
};

// Display name + tier (for the emoji prefix) per draw type — same across both regions, so this isn't duplicated inside DRAW_DATA. "Mythic Character + Legendary Weapon Draw" and "Legendary Character + Legendary Weapon Draw" are each a single named in-game banner (not a combo of two separate draws bundled together) — kept exactly as named in Harkirat's source rather than "simplified," since that's the banner's real in-game name. "Pick Your Reward Card" picked up the "Legendary Weapon" suffix in the drawPrices_ui.json pass to match its real in-game banner name.
const DRAW_META = {
    mythicWeapon: { name: 'Mythic Weapon Draw', tier: 'mythic' },
    mythicCharacter: { name: 'Mythic Character + Legendary Weapon Draw', tier: 'mythic' },
    legendaryGunReactive: { name: 'Legendary Weapon Draw (Reactive)', tier: 'legendary' },
    legendaryGunNonReactive: { name: 'Legendary Weapon Draw (Non-Reactive)', tier: 'legendary' },
    doubleLegendaryWeapons: { name: 'Double Legendary Weapons Draw', tier: 'legendary' },
    legendaryCharacterWeapon: { name: 'Legendary Character + Legendary Weapon Draw', tier: 'legendary' },
    sevenSpinLegendaryWeapon: { name: '7 Spins Legendary Weapon Draw', tier: 'legendary' },
    pickYourRewardCard: { name: 'Pick Your Reward Card Legendary Weapon Draw', tier: 'legendary' },
    doubleEpicCharacters: { name: 'Double Epic Characters Draw', tier: 'epic' }
};

// Rendered as one flat divider-separated sequence within each page (drawPrices_ui.json has no group headers at all, unlike the previous Mythic/Legendary-Epic two-group layout) — order matches the reference file. Split across 2 pages (2026-07-12, Harkirat's explicit split) purely to stay under Discord's 40-component cap now that each entry renders as up to 3 separate Text Displays (see buildDrawEntries) rather than one merged block -- not a content-grouping choice. Legendary Character + Legendary Weapon moved to the top of page 2 (2026-10-17 23:32 EDT, Harkirat: "can we also move the 'LEGENDARY CHARACTER + LEGENDARY WEAPON DRAW' section to page 2?"): page 1 had grown tall with the two Mythic upgrade blocks, and it was at 39 of Discord's 40 components.
const PAGE_1_KEYS = ['mythicWeapon', 'mythicCharacter', 'legendaryGunReactive', 'legendaryGunNonReactive'];
const PAGE_2_KEYS = ['legendaryCharacterWeapon', 'doubleLegendaryWeapons', 'sevenSpinLegendaryWeapon', 'pickYourRewardCard', 'doubleEpicCharacters'];
const SUBPAGES = [PAGE_1_KEYS, PAGE_2_KEYS];

// SERIES ARMORY (2026-10-18 10:31 EDT, Harkirat). A different structure from every draw above: one flat price per spin, and each item is guaranteed after a fixed number of spins, so it does not fit the `draws: [...]` ladder. His figures: "50cp for 10cp region for 1 spin/attempt", "80cp for 20cp", "120cp for 30cp"; a Legendary Weapon armory takes 75 spins per item, a Legendary Character one 100, a Mythic Weapon one 120, and "no mythic character series armory"; "3-6 items per armory", and an armory never mixes item types; spins come 1 at a time or 10 at a time, "no discount for 10x at a time". Priced like every other draw here, assuming no luck: each item takes its full spins. Kept OUT of DRAW_DATA and DRAW_META on purpose, because the calculator and utils/drawCost.js iterate those and would price an armory as a ladder.
const ARMORY_SPIN_CP = { region_10: 50, region_20: 80, region_30: 120 };
// Mythic first, the same tier order as page 1.
const SERIES_ARMORY = {
    armoryMythicWeapon: { name: 'Mythic Weapon Series Armory', tier: 'mythic', spins: 120, noun: 'Weapon' },
    armoryLegendaryWeapon: { name: 'Legendary Weapon Series Armory', tier: 'legendary', spins: 75, noun: 'Weapon' },
    armoryLegendaryCharacter: { name: 'Legendary Character Series Armory', tier: 'legendary', spins: 100, noun: 'Character' }
};
// The item counts he has seen in a real armory ("havent seen less or more than that").
const ARMORY_ITEM_COUNTS = [3, 4, 5, 6];
// The 3rd page, his placement: "probably page #3, with page 4 and 5 being the advanced draws".
const ARMORY_PAGE_INDEX = SUBPAGES.length; // = 2 (the 3rd page)

// The Advanced Double Legendary Weapon Draw (2026-07-21) gets its own dedicated page AFTER the two key-driven pages (and, since 2026-10-18 11:06 EDT, after the Series Armory page) -- it doesn't fit the shared `draws: []` model buildDrawEntries renders, so it's built by its own function (buildAdvancedDoubleLegendaryEntry) and is intentionally NOT part of SUBPAGES. TOTAL_PAGES is what the pagination row + page clamp use, so it must include this page.
const ADVANCED_PAGE_INDEX = ARMORY_PAGE_INDEX + 1; // = 3 (the 4th page)
// The Advanced Double Legendary CHARACTER Draw (2026-08-07) gets its own page right after the Weapon Advanced page, same "doesn't fit SUBPAGES' model" reasoning -- built by buildAdvancedDoubleLegendaryCharacterEntry. If you add more key-driven pages, push to SUBPAGES; both ADVANCED_PAGE_INDEX/CHARACTER_ADVANCED_PAGE_INDEX/TOTAL_PAGES re-derive automatically and this page stays last.
const CHARACTER_ADVANCED_PAGE_INDEX = ADVANCED_PAGE_INDEX + 1; // = 4 (the 5th page)
const TOTAL_PAGES = SUBPAGES.length + 3;      // 2 key pages + the Series Armory page + the 2 Advanced pages

// THE MYTHIC UPGRADE LADDERS (2026-10-17 11:50 EDT, Harkirat). The card and coin counts are the same in every region; only the 10x upgrade spin's price differs (`upgrade.perDraw` in DRAW_DATA). `upgrade.count` there is the AVERAGE number of 10x spins that collects the full amount, so one spin averages full ÷ count (about 197.5 cards, about 201 coins). Weapon: the cumulative cards to reach Levels 1–5. Character: three Tech paths of three sub-tiers each, every sub-tier only after the one before it, plus Final Form, which needs at least 7 of the 9 sub-tiers.
const MYTHIC_UPGRADE = {
    mythicWeapon: { currency: 'Cards', heldField: 'mythicCards', levels: [125, 375, 775, 1275, 1975] },
    mythicCharacter: { currency: 'Coins', heldField: 'mythicCoins', paths: ['Battle Tech', 'Arm Tech', 'Color Tech'], tiers: [80, 200, 420], finalForm: { name: 'Final Form', cost: 720, minTiers: 7 } }
};
// The full amount each ladder takes, derived so it can never disagree with the ladder itself.
function upgradeFullAmount(key) {
    const u = MYTHIC_UPGRADE[key];
    if (!u) return null;
    if (u.levels) return u.levels[u.levels.length - 1];
    return u.paths.length * u.tiers.reduce((a, b) => a + b, 0) + u.finalForm.cost;
}
// THE UPGRADE BLOCK, his format (2026-10-17 23:18 EDT, Harkirat: "for the draw prices mythic draws, let's do the upgrades like this format"): the currency icon beside the bold heading, the full amount quoted small, the spin cost, then the ladder in small lines. Weapon: cumulative cards per level. Character: one path's three costs times the number of paths, then Final Form. Every number is derived from MYTHIC_UPGRADE, so the full amount always matches its ladder.
function upgradeBlock(key, upgrade) {
    const u = MYTHIC_UPGRADE[key];
    const spinLine = `\`${formatCP(upgrade.perDraw)} CP\` x ${upgrade.count} Spins ⌇ **\`${formatCP(upgrade.perDraw * upgrade.count)} CP\`**`;
    const lines = [`${upgradeEmoji(key)} **${UPGRADE_LABEL[key]} Upgrade**`, `> -# **\`${formatCP(upgradeFullAmount(key))}\`** Mythic ${u.currency}`, spinLine];
    if (u.levels) {
        lines.push(`-# **Cumulative Mythic ${u.currency} by Upgrade Level:**`, `-# ${u.levels.map((n, i) => `L${i + 1}${i === u.levels.length - 1 ? ' (Max)' : ''} \`${formatCP(n)}\``).join(' › ')}`);
    } else {
        lines.push(`-# **Mythic ${u.currency} per Path:** (${u.tiers.map(n => `\`${formatCP(n)}\``).join(' › ')}) x ${u.paths.length} paths`, `-# **${u.finalForm.name}:** \`${formatCP(u.finalForm.cost)}\` coins after ${u.finalForm.minTiers} of ${u.paths.length * u.tiers.length} slots are unlocked`);
    }
    return lines.join('\n');
}

// Mythic-tier draws are the only ones with a separate Upgrade step, and each needs its own noun ("Weapon"/"Character") in the "### {X} Upgrade" sub-heading per drawPrices_ui.json.
const UPGRADE_LABEL = { mythicWeapon: 'Weapon', mythicCharacter: 'Character' };
// The upgrade's own currency icon, beside the Weapon/Character Upgrade heading only (2026-10-16 18:57 EDT, Harkirat: "remove the mythic card/coin emoji out of the ... line. just leave it beside the ... headings"). First added (2026-10-16 11:14 EDT, Harkirat: "Cards = weapon. Coin=character."). Read at render time, never captured at require time (see checkEmojiCaptures).
function upgradeEmoji(key) { return key === 'mythicWeapon' ? emojis.mythicCard : key === 'mythicCharacter' ? emojis.mythicCoin : ''; }

function formatCP(n) { return n.toLocaleString('en-US'); }

// Per example_reformat.json (2026-07-12): each pull number is now individually bold, joined by " / " (was a plain arrow-joined sequence) -- and the cumulative "spent so far" sequence is joined by "›" (U+203A) instead of an arrow. Both characters copied verbatim from the reference file rather than retyped, since a visually-similar-but-wrong unicode glyph would be an easy typo to introduce here and hard to notice in a code review.
function boldDrawSequence(entry) { return entry.draws.map(n => `**${formatCP(n)}**`).join(' / '); }
function cumulativeSequence(entry) {
    let running = 0;
    return entry.draws.map(n => { running += n; return formatCP(running); }).join(' › ');
}

// Single tier icon per drawPrices_ui.json (the old mythic/legendary headers combined their tier emoji with the Epic emoji as a two-icon prefix; the new reference file uses just the one). Resolved per-render, deliberately NOT a module-level const: refreshEmojiIds() rewrites emojiMap's values at boot, long after this file is require()d, and JS strings copy by value -- so a const here froze the pre-sync PROD ids and rendered as broken text on the dev bot (found 2026-07-26 15:52 EDT: pages 1-2 broken, while page 3's heading -- which reads emojis.* at render time -- was fine).
function tierIcon(tier) {
    return { mythic: emojis.mythic, legendary: emojis.legendary, epic: emojis.epic }[tier];
}

// Returns one ARRAY of block strings per draw type (2 blocks normally, 3 if it has an Upgrade step) -- NOT one joined string. Per example_reformat.json (2026-07-12), each entry splits into separate Text Displays: [heading + total], [pull sequence + cumulative], optionally [upgrade heading + formula] -- kept as 3 real separate Text Displays (not merged) since the gap BETWEEN components is what gives the natural spacing Harkirat wants here; no divider between a given entry's own blocks, only between entries (see withInnerDividers below). This pushes total component count too high for all 9 entries on one page at once (over Discord's 40-cap) -- solved via pagination in buildContainer instead of merging blocks back together, see PAGE_1_KEYS/PAGE_2_KEYS below.
function buildDrawEntries(regionKey, keys) {
    const region = DRAW_DATA[regionKey];
    return keys.map(key => {
        const meta = DRAW_META[key];
        const entry = region[key];
        const icon = tierIcon(meta.tier);
        // Full-caps draw name in every entry heading (2026-07-21, Harkirat's request -- consistency with the Advanced page's own full-caps heading). meta.name stays the canonical mixed-case source of truth; only the rendered heading is uppercased.
        const heading = meta.name.toUpperCase();
        if (!entry) return [`**${icon} ${heading}**\n*Dior is lazy and hasn't done the research **yet** for this draw. More draws and updated info coming soon.*`];

        const total = entry.draws.reduce((a, b) => a + b, 0);
        const blocks = [];

        // Block 1: heading + total (quote-blocked, per Harkirat's request to bring the `> ` back). Upgrade entries bold-wrap each `CP` quantity independently (draw / upgrade / grand total), with the "+"/"=" outside the bold -- non-upgrade entries are just one bold total.
        let totalLine;
        if (entry.upgrade) {
            const upgradeTotal = entry.upgrade.perDraw * entry.upgrade.count;
            totalLine = `> ${emojis.cp2} **\`${formatCP(total)} CP\`** Draw + **\`${formatCP(upgradeTotal)} CP\`** Upgrade ⌇ **\`${formatCP(total + upgradeTotal)} CP\`**`;
        } else {
            totalLine = `> ${emojis.cp2} **\`${formatCP(total)} CP\`**`;
        }
        blocks.push(`**${icon} ${heading}**\n${totalLine}`);

        // Block 2: bold pull sequence + cumulative spend, own Text Display.
        blocks.push(`${boldDrawSequence(entry)} ⌇ **\`${formatCP(total)} CP\`**\n-# **CP Spent:** ${cumulativeSequence(entry)}`);

        // Block 3 (upgrade entries only): its own separate Text Display, matching the reference file.
        if (entry.upgrade) {
            blocks.push(upgradeBlock(key, entry.upgrade));
        }

        return blocks;
    });
}

// Turns an array of entry-groups (each itself an array of block strings, see buildDrawEntries) into a flat component list with a divider BETWEEN groups but never within one group's own blocks, and no leading/trailing divider (the caller is responsible for whatever comes immediately before/after this run). `spacing` defaults to 1 to match drawPrices_ui.json's own dividers; buildContainer currently overrides this to 2 (large) for region_10 only, as a one-off spacing test Harkirat asked for (2026-07-12) -- see its own note.
function withInnerDividers(entryGroups, spacing = 1) {
    const components = [];
    entryGroups.forEach((blocks, i) => {
        if (i > 0) components.push({ type: 14, spacing, divider: true });
        blocks.forEach(content => components.push({ type: 10, content }));
    });
    return components;
}

// Builds the Advanced Double Legendary Weapon Draw's whole page as a ready component list (Text Displays + dividers), so buildContainer can splice it in exactly where withInnerDividers' output would otherwise go. Everything numeric here is DERIVED from ADVANCED_DOUBLE_LEGENDARY's reg/adv arrays (see that object's comment) -- nothing is hand-typed. Uses the same rendering conventions as the other entries: bold ` / `-joined pull sequence, ⌇ before the total, a `-# CP Spent:` cumulative line joined by `›`, and the cp2 icon on the quote-blocked headline (reuses boldDrawSequence/cumulativeSequence via a `{ draws }` shim).
function buildAdvancedDoubleLegendaryEntry(regionKey) {
    const data = ADVANCED_DOUBLE_LEGENDARY[regionKey] || ADVANCED_DOUBLE_LEGENDARY.region_10;
    const reg = data.reg;
    const adv = data.adv;
    // Trap = 2x Regular per pull (see the data object's comment) -- derived, never stored.
    const trap = reg.map(n => n * 2);

    const sum = arr => arr.reduce((a, b) => a + b, 0);
    const sumRange = (arr, n) => arr.slice(0, n).reduce((a, b) => a + b, 0);
    const regTotal = sum(reg);
    const advTotal = sum(adv);
    const trapTotal = sum(trap);

    // Strategy costs, all derived: each strategy spins Regular for the early pulls then switches to Advanced for the last one or two (which unlock the 2nd Legendary + the Epics), assuming no lucky early pull. Reg 1-8 + Adv 9-10 / Reg 1-9 + Adv 10 / Reg 1-10.
    const costAll4 = sumRange(reg, 8) + adv[8] + adv[9];
    const cost2Leg = sumRange(reg, 9) + adv[9];
    const cost1Leg = regTotal;

    // Shim so the existing boldDrawSequence/cumulativeSequence (which read `.draws`) work here.
    const seqTotal = (arr, total) => `${boldDrawSequence({ draws: arr })} ⌇ **\`${formatCP(total)} CP\`**\n-# **CP Spent:** ${cumulativeSequence({ draws: arr })}`;

    // Layout matches Harkirat's own hand-drawn mockup (local/advanced leggy_format.json, 2026-07-21): FULL-CAPS heading, three quote-styled purchase modes, THE TRAP callout (the NOTE callout was removed 2026-07-25 per Harkirat's request), then the Strategy split into THREE separate Text Displays (its own `### ` heading on the first) so each strategy option reads as its own line with an inline cp2 icon on its cost. Every number is still DERIVED above -- only the wording/structure changed from the earlier version, not the math.
    const blocks = [
        // 0: FULL-CAPS heading + both headline totals (quote-blocked, cp2 icon -- matches the mockup)
        `**${emojis.legendary} ADVANCED DOUBLE LEGENDARY WEAPON DRAW**\n> ${emojis.cp2} **\`Reg: ${formatCP(regTotal)} CP\`** / **\`Adv: ${formatCP(advTotal)} CP\`** (See **The Strategy** below)`,
        // 1-3: the three purchase modes (the 3rd is the "trap" pricing -- Regular spin then buying the remaining item separately, i.e. 2x Regular per pull)
        `**'Regular Purchase' Only**\n${seqTotal(reg, regTotal)}`,
        `**'Advanced Purchase' Only**\n${seqTotal(adv, advTotal)}`,
        `**'Regular Purchase' + Remaining Item Separately**\n${seqTotal(trap, trapTotal)}`,
        // 4: THE TRAP callout (the NOTE callout was removed entirely per Harkirat's request 2026-07-25)
        `> **THE TRAP:** Buying 'Regular Purchase', then paying for the 2nd remaining item afterwards costs **25% MORE** than just buying 'Advanced Purchase' upfront. **Commit before spinning!** Otherwise you essentially just did 2 'Regular Purchases' and wasted money.`,
        // 5-7: the Strategy, as three separate Text Displays (heading rides on the first block). Heading is a REAL `### ` heading, "### The Strategy" -- reverses the 2026-07-21 "plain bold line" call per Harkirat's 2026-08-07 12:21 EDT request; "If You Want..." dropped since each strategy line's own bold label ("Both Weapons & Characters" etc.) already states the condition.
        `### The Strategy\n**Both Weapons & Characters**\nReg 1-8 → Adv 9-10 ⌇ ${emojis.cp2} **\`${formatCP(costAll4)} CP\`**`,
        `**Both Weapons + 1 Random Character**\nReg 1-9 → Adv 10 ⌇ ${emojis.cp2} **\`${formatCP(cost2Leg)} CP\`**`,
        `**1 Random Weapon + 1 Random Character**\nReg only 1-10 ⌇ ${emojis.cp2} **\`${formatCP(cost1Leg)} CP\`**\n-# Note: These strategies assume that you didn't get lucky.`
    ];

    // NO internal dividers between the sections. The mockup (local/advanced leggy_format.json) has none, and Harkirat confirmed 2026-07-21 (marked-up screenshot: local/Screenshots/CleanShot 2026-07-21 at 20.16.48@2x.png) that the three dividers an earlier version of this builder added -- after the headline, after the purchase modes, after the callouts -- "shouldn't be here at all." The blocks flow as separate Text Displays relying on Discord's own natural inter-component spacing. The only dividers on this page are the title divider above the headline and the footer divider below, both added by buildContainer, NOT here.
    return blocks.map(content => ({ type: 10, content }));
}

// Builds the Advanced Double Legendary CHARACTER Draw's page (added 2026-08-07), mirroring buildAdvancedDoubleLegendaryEntry above exactly in structure and rendering conventions -- the only real difference is which reward pair each purchase mode/strategy line is working toward. `reg` is read from DRAW_DATA[regionKey].legendaryCharacterWeapon.draws (see ADVANCED_DOUBLE_LEGENDARY_ CHARACTER's comment for why it isn't duplicated here), `adv` from the new data object; `trap` is still always 2x Regular, same reasoning as the Weapon page.
//
// Reward framing (confirmed by Harkirat, 2026-08-07): this draw's two pairs are BOTH Legendary tier -- 2 Legendary Characters (this banner's own headline reward, reliably worked toward by Regular spend, same role "weapons" plays on the Weapon page) and 2 Legendary Weapons (the secondary reward unlocked via Advanced purchase). This is a different reward shape than the Weapon page, whose secondary reward is 2 EPIC characters -- so the strategy wording below is adapted, not just a find/replace of "Weapon"<->"Character" on the Weapon page's lines.
function buildAdvancedDoubleLegendaryCharacterEntry(regionKey) {
    const region = DRAW_DATA[regionKey] || DRAW_DATA.region_10;
    const charData = ADVANCED_DOUBLE_LEGENDARY_CHARACTER[regionKey] || ADVANCED_DOUBLE_LEGENDARY_CHARACTER.region_10;
    const reg = region.legendaryCharacterWeapon.draws;
    const adv = charData.adv;
    // Trap = 2x Regular per pull, same reasoning as the Weapon page's own Trap.
    const trap = reg.map(n => n * 2);

    const sum = arr => arr.reduce((a, b) => a + b, 0);
    const sumRange = (arr, n) => arr.slice(0, n).reduce((a, b) => a + b, 0);
    const regTotal = sum(reg);
    const advTotal = sum(adv);
    const trapTotal = sum(trap);

    // Strategy costs, all derived -- same Reg 1-8 + Adv 9-10 / Reg 1-9 + Adv 10 / Reg 1-10 slicing as the Weapon page, assuming no lucky early pull.
    const costAll4 = sumRange(reg, 8) + adv[8] + adv[9];
    const cost2Leg = sumRange(reg, 9) + adv[9];
    const cost1Leg = regTotal;

    // Shim so the existing boldDrawSequence/cumulativeSequence (which read `.draws`) work here.
    const seqTotal = (arr, total) => `${boldDrawSequence({ draws: arr })} ⌇ **\`${formatCP(total)} CP\`**\n-# **CP Spent:** ${cumulativeSequence({ draws: arr })}`;

    // Same flat run of Text Displays, NO internal dividers, as the Weapon page -- matching its style exactly per Harkirat's request.
    const blocks = [
        // 0: FULL-CAPS heading + both headline totals (quote-blocked, cp2 icon)
        `**${emojis.legendary} ADVANCED DOUBLE LEGENDARY CHARACTER DRAW**\n> ${emojis.cp2} **\`Reg: ${formatCP(regTotal)} CP\`** / **\`Adv: ${formatCP(advTotal)} CP\`** (See **The Strategy** below)`,
        // 1-3: the three purchase modes
        `**'Regular Purchase' Only**\n${seqTotal(reg, regTotal)}`,
        `**'Advanced Purchase' Only**\n${seqTotal(adv, advTotal)}`,
        `**'Regular Purchase' + Remaining Item Separately**\n${seqTotal(trap, trapTotal)}`,
        // 4: THE TRAP callout -- purely about purchase mechanics, not reward tiers, so carries over verbatim
        `> **THE TRAP:** Buying 'Regular Purchase', then paying for the 2nd remaining item afterwards costs **25% MORE** than just buying 'Advanced Purchase' upfront. **Commit before spinning!** Otherwise you essentially just did 2 'Regular Purchases' and wasted money.`,
        // 5-7: the Strategy, three separate Text Displays -- reward pairs swapped per Harkirat's 2026-08-07 clarification (both Legendary tier here, unlike the Weapon page's Legendary+Epic mix). Heading + labels re-worded 2026-08-07 12:21 EDT (real `### ` heading, "Legendary" dropped from the two middle words per Harkirat's exact spec) -- a 4th tier ("1 Random Character + Both Weapons", Reg 1-8 → Adv 9 → Reg 10) was scoped and its math worked out, then deliberately dropped by Harkirat's own follow-up before it shipped; not present here on purpose.
        `### The Strategy\n**Both Legendary Characters & Weapons**\nReg 1-8 → Adv 9-10 ⌇ ${emojis.cp2} **\`${formatCP(costAll4)} CP\`**`,
        `**Both Characters + 1 Random Weapon**\nReg 1-9 → Adv 10 ⌇ ${emojis.cp2} **\`${formatCP(cost2Leg)} CP\`**`,
        `**1 Random Character + 1 Random Weapon**\nReg only 1-10 ⌇ ${emojis.cp2} **\`${formatCP(cost1Leg)} CP\`**\n-# Note: These strategies assume that you didn't get lucky.`
    ];

    return blocks.map(content => ({ type: 10, content }));
}

// SERIES ARMORY ENTRIES, in the same two-block shape as buildDrawEntries (the heading with a quoted total, then the spin line with a small cumulative line), so the page reads like the rest of /draw prices. The quoted total is ONE item; the small line is the whole armory at each item count. No no-luck note (2026-10-18 10:46 EDT, Harkirat: "that's not needed. we dont mention it for the other draws anyway since the draw prices page is the full breakdown anyway.").
function buildArmoryEntries(regionKey, keys) {
    const perSpin = ARMORY_SPIN_CP[regionKey] || ARMORY_SPIN_CP.region_10;
    return keys.map(key => {
        const a = SERIES_ARMORY[key];
        const perItem = perSpin * a.spins;
        return [
            // His wording (2026-10-18 11:21 EDT): the item is named for what the armory holds, "Per Weapon" / "Per Character", and the whole-armory line is its own heading over a bold count per total.
            `**${tierIcon(a.tier)} ${a.name.toUpperCase()}**\n> ${emojis.cp2} **\`${formatCP(perItem)} CP\`** Per ${a.noun}`,
            `\`${formatCP(perSpin)} CP\` x ${a.spins} Spins ⌇ **\`${formatCP(perItem)} CP\`**\n-# **Full Armory by ${a.noun} Count:**\n-# ${ARMORY_ITEM_COUNTS.map(n => `**${n} ${a.noun}s** \`${formatCP(perItem * n)} CP\``).join(' • ')}`
        ];
    });
}

// QUICK JUMP TO ONE DRAW TYPE (2026-10-17 22:02 EDT, Harkirat: "Can we implement a drop down above the region toggle's hint line? A quick jump to a draw type basically. And when in that view, the pagination buttons basically get replaced with a 'back' button to go back to the 'all view'"). A jump target is any DRAW_META key plus the two Advanced pages. The focused view travels as the page value `f<key>` (keys are camelCase, so the `_`-split custom_ids still parse), which is how a region switch keeps the jump.
const ADVANCED_JUMPS = { advancedWeapon: { name: 'Advanced Double Legendary Weapon Draw', tier: 'legendary', page: ADVANCED_PAGE_INDEX }, advancedCharacter: { name: 'Advanced Double Legendary Character Draw', tier: 'legendary', page: CHARACTER_ADVANCED_PAGE_INDEX } };
const JUMP_KEYS = [...SUBPAGES.flat(), ...Object.keys(SERIES_ARMORY), ...Object.keys(ADVANCED_JUMPS)];
function jumpMeta(key) { return DRAW_META[key] || SERIES_ARMORY[key] || ADVANCED_JUMPS[key] || null; }
// The page a draw sits on in the all view, so Back returns to where that draw lives.
function pageOfJump(key) { if (SERIES_ARMORY[key]) return ARMORY_PAGE_INDEX; return ADVANCED_JUMPS[key] ? ADVANCED_JUMPS[key].page : Math.max(0, SUBPAGES.findIndex(keys => keys.includes(key))); }

// FILTER DRAWS TO VIEW (2026-10-21 11:50 EDT, Harkirat: "instead of jump to a draw type, can we make it a \"filter draw to view\" or something? where it's a multi select dropdown, that allows you to pick the draw types you want to filter for and shows those?"). Replaces the single-pick quick jump above as the panel's dropdown; `price_jump_` still answers panels posted before. The picked set travels as `m<hex>`, a bitmask over JUMP_KEYS' order, so all 14 draw types fit in any custom_id; a set that does not fit one message pages on its own as `m<hex>p<n>`. One draw on its first page stays `f<key>`, which is what the slash command's `type:` sends.
function filterToken(keys, page = 0) {
    if (keys.length === 1 && !page) return `f${keys[0]}`;
    const mask = keys.reduce((m, key) => m | (1 << JUMP_KEYS.indexOf(key)), 0);
    return `m${mask.toString(16)}${page ? `p${page}` : ''}`;
}
// The picked draws (in JUMP_KEYS order) and the page, or null in the all view.
function filterOf(subpage) {
    if (typeof subpage !== 'string') return null;
    if (subpage.startsWith('f')) { const key = subpage.slice(1); return jumpMeta(key) ? { keys: [key], page: 0 } : null; }
    const m = /^m([0-9a-f]+)(?:p(\d+))?$/.exec(subpage);
    if (!m) return null;
    const mask = parseInt(m[1], 16);
    const keys = JUMP_KEYS.filter((_, i) => mask & (1 << i));
    return keys.length ? { keys, page: Number(m[2]) || 0 } : null;
}
// One draw's components, whatever builder it needs.
function entryComponentsFor(regionKey, key) {
    if (key === 'advancedWeapon') return buildAdvancedDoubleLegendaryEntry(regionKey);
    if (key === 'advancedCharacter') return buildAdvancedDoubleLegendaryCharacterEntry(regionKey);
    const blocks = SERIES_ARMORY[key] ? buildArmoryEntries(regionKey, [key])[0] : buildDrawEntries(regionKey, [key])[0];
    return blocks.map(content => ({ type: 10, content }));
}
function joinEntries(groups, spacing) {
    return groups.flatMap((group, i) => (i > 0 ? [{ type: 14, spacing, divider: true }, ...group] : group));
}
const countComponents = list => list.reduce((n, c) => n + 1 + countComponents(c.components || []) + (c.accessory ? 1 : 0), 0);
const textLength = list => list.reduce((n, c) => n + (c.type === 10 ? c.content.length : 0) + textLength(c.components || []), 0);
// Discord's caps on one message: 40 components, and about 4,000 characters of text across it (COMPONENT_DISPLAYABLE_TEXT_SIZE_EXCEEDED, probed 2026-10-16 01:17 EDT for the calculator). The text budget keeps some room under that.
const MESSAGE_COMPONENT_CAP = 40;
// THE FILTER IS A LINE AND A BUTTON, NOT A DROPDOWN (2026-10-21 13:02 EDT, Harkirat: "show me G properly then, as a section+accesory"). The multi-select drew every picked draw as a chip in its closed box, which stacked seven deep on desktop ("this kind of looks ridiculous when a lot of draws are selected"); a box with nothing marked showed no ticks ("the dropdown itself doesnt show what's picked"). Discord draws a ticked option only by listing it in the closed box too, so the ticks moved into a pop-up: the panel says what is filtered in one line, and Filter opens the full list already ticked. OwO's weapon panel does the same.
function filterSummary(keys) {
    const { SHORT_NAME } = require('./drawCalculator');
    return `**Draw Filters:** ${keys.length ? keys.map(k => `\`${SHORT_NAME[k] || jumpMeta(k).name}\``).join(' ') : '`None`'}`;
}
// The pop-up Filter opens: every draw type, the picked ones ticked; picking none shows them all again.
function buildFilterModal(regionKey, keys) {
    return {
        title: 'Filter Draws to View',
        custom_id: `price_filtersave_${regionKey}`,
        components: [{
            type: 18,
            label: 'Draws to Show',
            description: 'Pick any draw types, or none to show them all',
            component: {
                type: 3,
                custom_id: 'filter',
                placeholder: 'Pick draw types...',
                min_values: 0,
                max_values: JUMP_KEYS.length,
                required: false,
                options: JUMP_KEYS.map(key => ({ label: jumpMeta(key).name, value: key, emoji: emojis.parseEmoji(tierIcon(jumpMeta(key).tier)), default: keys.includes(key) }))
            }
        }]
    };
}
const MESSAGE_TEXT_BUDGET = 3800;

/**
 * UI BUILDER: Constructs the V2 JSON Payload Separated into its own function so handlers/drawprices.js can call it directly when users swap regions or pages without needing to re-run the entire slash command.
 */
function buildContainer(regionKey, accentColor = PRESET_ACCENT, isEphemeral = false, subpage = 0, client) {
    const region = DRAW_DATA[regionKey] || DRAW_DATA.region_10;
    const filter = filterOf(subpage);
    const innerDividerSpacing = 2;

    // Prev/Next between the entry pages, same region -- shared pagination row helper (see utils/paginationRow.js), same style as /calendar and /draws' sub-page navigation. Placed directly under the entries themselves (own divider on both sides) rather than next to the region-switch footer/button below -- sitting right next to that footer's "Switch between viewing 10 CP or 30 CP region prices" text read as if the page arrows were ALSO part of switching region, which they aren't (Harkirat's explicit fix, 2026-07-12). In a filtered view the pager pages the picked draws and Show All Draws sits at its end, to the all-view page the first picked draw sits on. Not "Back" (it read as a page back), but the arrow stays (Harkirat 2026-10-17 22:47 EDT: "nah keep the back arrow"; 2026-10-17 22:14 EDT, Harkirat: "It kind of feels like back as in a page").
    function filteredView(page, pageCount) {
        const showAll = { type: 2, style: 2, label: 'Show All Draws', emoji: emojis.parseEmoji(emojis.left), custom_id: `price_subpage_${regionKey}_${pageOfJump(filter.keys[0])}` };
        const pager = buildPaginationRow({ totalChunks: pageCount, currentPage: page, makeCustomId: (p) => `price_subpage_${regionKey}_${filterToken(filter.keys, p)}`, indicatorCustomId: 'price_subpage_indicator' });
        return { type: 1, components: [...(pager ? pager.components : []), showAll] };
    }

    let currentPage, entrySections, controlRow, viewToken;
    if (filter) {
        // Pack the picked draws into pages that each fit one message, in the dropdown's order. A draw too big for a page with others still gets a page of its own.
        const groups = filter.keys.map(key => ({ key, components: entryComponentsFor(regionKey, key) }));
        const pages = [];
        for (const group of groups) {
            const last = pages[pages.length - 1];
            const trial = last ? [...last, group] : null;
            const fits = trial && (() => {
                // Measured as the worst case: with the Show Everyone row an ephemeral copy carries, and a full pager.
                const message = withShareButton(assemble(joinEntries(trial.map(g => g.components), innerDividerSpacing), filteredView(0, 3), filter.keys, 'm0p0'), true);
                return countComponents(message) <= MESSAGE_COMPONENT_CAP && textLength(message) <= MESSAGE_TEXT_BUDGET;
            })();
            if (fits) pages[pages.length - 1] = trial; else pages.push([group]);
        }
        currentPage = Math.min(filter.page, pages.length - 1);
        entrySections = joinEntries(pages[currentPage].map(g => g.components), innerDividerSpacing);
        controlRow = filteredView(currentPage, pages.length);
        viewToken = filterToken(filter.keys, currentPage);
    } else {
        // Clamp rather than reject an out-of-range page (matches the "build N of M" clamping convention used elsewhere, e.g. loadout pagination) -- defensive, not expected to trigger in practice since the pagination row's own disabled state already prevents going out of bounds.
        currentPage = Math.min(Math.max(Number(subpage) || 0, 0), TOTAL_PAGES - 1);
        // Flat, divider-separated sequence per drawPrices_ui.json — no group headers at all. Split across pages to stay under Discord's 40-component cap now that each entry can render as up to 3 separate Text Displays. Large divider spacing (2) between draw entries everywhere (2026-07-12, Harkirat's "large spacing across the board"). The two Advanced pages (4th and 5th) and the Series Armory page (3rd) are each rendered by their own builder since neither fits the shared key/`draws: []` model; every other page goes through buildDrawEntries.
        entrySections = currentPage === ARMORY_PAGE_INDEX
            ? withInnerDividers(buildArmoryEntries(regionKey, Object.keys(SERIES_ARMORY)), innerDividerSpacing)
            : currentPage === ADVANCED_PAGE_INDEX
            ? buildAdvancedDoubleLegendaryEntry(regionKey)
            : currentPage === CHARACTER_ADVANCED_PAGE_INDEX
            ? buildAdvancedDoubleLegendaryCharacterEntry(regionKey)
            : withInnerDividers(buildDrawEntries(regionKey, SUBPAGES[currentPage]), innerDividerSpacing);
        controlRow = buildPaginationRow({
            totalChunks: TOTAL_PAGES,
            currentPage,
            // Looping pager: the helper wraps last↔first and builds the id from the wrapped page.
            makeCustomId: (p) => `price_subpage_${regionKey}_${p}`,
            indicatorCustomId: 'price_subpage_indicator'
        });
        // What the region buttons carry so a switch keeps the view: the page number, or the filter.
        viewToken = String(currentPage);
    }
    return withShareButton(assemble(entrySections, controlRow, filter ? filter.keys : [], viewToken), isEphemeral);

    // The whole message around a page's entries. Also used above to measure whether a filtered page fits.
    function assemble(entries, pagerRow, pickedKeys, token) {
        // BUG FIX (found live, 2026-07-13): the global nav row used to be nested INSIDE the container, sitting BEFORE the divider/hint line/region button rather than after them -- crammed directly under the pagination arrows with no separation, and structurally inconsistent with every other seasonal command (/calendar, /draws), which both pass their nav row as a separate top-level sibling into `withShareButton([containerPayload, globalNavigationRow], isEphemeral)` rather than nesting it. Fixed per Harkirat's exact spec: the divider/hint line/region button all STAY inside the container -- only the nav row itself moves OUTSIDE, as its own sibling below the container, matching calendar/draws. Lazy-required (function-scoped, not top-level) to avoid a circular require: drawCalculator.js already requires THIS file's exports at module load.
        //
        // Swaps the disabled-and-useless "Draw Prices" nav slot for an active "Draw Calculator" link (2026-08-26 23:05 EDT, Harkirat's explicit call: "instead of changing the 'draw prices' button to be in disabled state, instead change it to show 'Draw Calculator'"). Every other command's nav row still disables its own slot as usual -- this is the one place `overrides` is used, because /draw prices and /draw calculator are siblings under the same `draw` group and the disabled state was a dead end with no way back to the calculator.
        //
        // ⚠️ UPDATED for the 2026-08-27 saved-basket redesign -- there is no `region` field on the calculator's own state any more (it lives on the basket document, not the customId), so this can no longer carry a target region the way the single-draw panel's cross-link did. It lands on the calculator's plain LANDING state instead (verb 'page', no basketId, no author lock -- landing needs none) via encodeState/defaultState, which is still the exact shape drawCalculator.js's own handler already routes -- zero new handler code.
        const globalNavigationRow = buildGlobalNavRow(null, {
            nav_prices: {
                // NO emoji (2026-08-27, Harkirat): utils/globalNav.js's NAV_ITEMS carries none on any slot, and one decorated button in an otherwise bare five-button row reads as a mistake rather than as emphasis.
                label: 'Draw Calculator',
                custom_id: require('./drawCalculator').encodeState('page', require('./drawCalculator').defaultState())
            }
        });

        // All dividers now spacing 2 (2026-07-12, "large spacing across the board" -- overrides the earlier "title divider stays spacing 1" exception from the same day's prior pass).
        const containerPayload = {
            type: 17, // Section Container
            accent_color: accentColor,
            components: [
                // Two-line title (region label on top, command header below) — shared pattern. See utils/titleBlock.js. headingLevel 2 (`## `) and boldCaption (extra **bold** wrap on the region caption) -- both scoped to this command only per Harkirat's request (2026-07-12); see utils/titleBlock.js's buildTitleBlock. The region's own emoji sits in front of the caption, outside the bold-italic lettering (2026-10-21 11:50 EDT, Harkirat: "put the respective region emoji infront of the subtitle"), the same icon its region button carries.
                withCaptionEmoji(buildTitleBlock(region.label, emojis.drawPrices, 'Breakdown of Draw Prices', 2, true), emojis[REGION_EMOJI_KEY[regionKey] || REGION_EMOJI_KEY.region_10]),
                { type: 14, spacing: 2, divider: true },
                ...entries,
                // NO divider between the last entry and the pagination row (Harkirat's explicit, repeated correction) -- pagination sits directly under the entries with no separator. A small space above the pager, no line (2026-10-18 15:12 EDT, Harkirat: "add a divider:false small spacing ... anywhere else that pagination buttons appear"). This replaces the old "nothing between the last entry and the pager" rule: a space, still no line.
                ...(pagerRow ? [{ type: 14, spacing: 1, divider: false }, pagerRow] : []),
                { type: 14, spacing: 2, divider: true },
                // The filter sits above the region hint line, where the quick jump sat: one line naming what is filtered, and Filter, which opens the pop-up (filterSummary, buildFilterModal).
                {
                    type: 9,
                    components: [{ type: 10, content: filterSummary(pickedKeys) }],
                    accessory: { type: 2, style: 2, label: 'Filter', custom_id: `price_filteropen_${regionKey}_${token}`, emoji: emojis.parseEmoji(emojis.edit) }
                },
                // One-line footer (was two `-#` lines) per example_reformat.json. Updated 2026-08-07 for the 3rd region.
                { type: 10, content: `-# Switch between viewing 10 CP, 20 CP, or 30 CP region prices. (Tip: check out ${mentionCommand(client, '/settings')})` },
                {
                    type: 1,
                    // 3-way region switcher (replaced the old single "switch to the other region" toggle button 2026-08-07, now that a 3rd region exists). Always renders all 3 region buttons, in REGION_ORDER, each `custom_id` encoding the region it JUMPS TO plus the current view (a page number or the filter), so a switch keeps what is open. The CURRENT region is green and disabled (2026-10-14 13:13 EDT, Harkirat: "when the cp region button is selected, make it green-disabled"). Each button carries its own region icon (`REGION_EMOJI_KEY`, 2026-08-07 15:46 EDT).
                    components: REGION_ORDER.map(key => ({
                        type: 2,
                        style: key === regionKey ? 3 : 2,
                        disabled: key === regionKey,
                        custom_id: `price_region_${key.split('_')[1]}_${token}`,
                        label: `${key.split('_')[1]} CP`,
                        emoji: emojis.parseEmoji(emojis[REGION_EMOJI_KEY[key]])
                    }))
                }
            ]
        };

        // Nav row lives OUTSIDE the container, as a separate top-level sibling -- matches /calendar and /draws' own convention (see calendar.js/draws.js), not nested inside like every other element in this command.
        return [containerPayload, globalNavigationRow];
    }
}

// /draw calculator's shortcut options, UNWIRED 2026-10-17 23:38 EDT and kept so they can come back (see the calculator subcommand below). Every option is optional and every one maps onto a control the panel also carries, so the command line and the panel are two doors into the same state rather than two features. Choices are DERIVED from DRAW_META/REGION_ORDER rather than transcribed -- a tenth draw or a fourth region appears here on its own, which is the same rule DRAW_DATA's header sets for every other number in this file.
function addCalculatorShortcutOptions(sub) {
    return sub
        .addStringOption(option => option.setName('draw').setDescription('Which draw you are pulling on').addChoices(...Object.entries(DRAW_META).map(([value, meta]) => ({ name: meta.name, value }))))
        .addIntegerOption(option => option.setName('pulls').setDescription('How many pulls you have already done on it (most draws have 10, two have 7)').setMinValue(0).setMaxValue(10))
        .addIntegerOption(option => option.setName('balance').setDescription('CP you already have, so it can tell you what is left to buy').setMinValue(0))
        .addStringOption(option => option.setName('region').setDescription('Price it in a specific CP region').addChoices(...REGION_ORDER.map(value => ({ name: `${value.split('_')[1]} CP Region`, value }))));
}

module.exports = {
    // Exported so utils/drawCost.js can do remainder math over the same arrays rather than keeping a second copy -- a second copy is exactly the drift DRAW_DATA's own header comment exists to prevent. PRESET_ACCENT is exported so commands/drawCalculator.js inherits the same CP Emerald accent (design decision 1: the calculator "sits beside the pricing data it reads"). buildDrawEntries/UPGRADE_LABEL/formatCP exported 2026-08-26 17:25 EDT so the calculator's own per-draw summary block can reuse THIS command's exact rendering -- Harkirat's own mockup for the redesign was built by pasting a real /draw prices entry in verbatim, so the two must never drift apart into two similar-looking but independently-maintained copies.
    DRAW_DATA, DRAW_META, REGION_ORDER, REGION_EMOJI_KEY, PRESET_ACCENT,
    buildDrawEntries, SERIES_ARMORY, ARMORY_SPIN_CP, JUMP_KEYS, jumpMeta, filterToken, filterOf, buildFilterModal, UPGRADE_LABEL, upgradeEmoji, formatCP, MYTHIC_UPGRADE, upgradeFullAmount,
    // The two Advanced pages' per-pull arrays, for /draw calculator (2026-10-18 21:51 EDT): priced from these same numbers, never a copy.
    ADVANCED_DOUBLE_LEGENDARY, ADVANCED_DOUBLE_LEGENDARY_CHARACTER,

    // COMMAND DEFINITION: Base command 'draw' with subcommand 'prices'
    data: new SlashCommandBuilder()
        .setName('draw')
        .setDescription('Lucky Draw Commands')
        .addSubcommand(sub => sub
            .setName('prices')
            .setDescription('View the CP cost breakdown for Lucky Draws')
            // Optional direct-jump flag The quick jump from the command line, as `type`, listed before `region` (2026-10-17 23:54 EDT, Harkirat: "please arrange 'jump_to' above the 'region' option. let's also reword it to either 'filter' or 'type'"; `type` because the choices ARE draw types). First added (2026-10-17 22:48 EDT, Harkirat: "you also need to implement that jump within the slash command itself as an option"). Same targets as the dropdown, derived from JUMP_KEYS so the two never differ.
            .addStringOption(option => option.setName('type').setDescription('Open one draw type on its own').addChoices(...JUMP_KEYS.map(key => ({ name: jumpMeta(key).name, value: key }))))
            .addStringOption(option => option.setName('region').setDescription('Jump directly to a specific CP region').addChoices({ name: '10 CP Region', value: 'region_10' }, { name: '20 CP Region', value: 'region_20' }, { name: '30 CP Region', value: 'region_30' }))
            .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' })))
        .addSubcommand(sub => sub
            .setName('calculator')
            .setDescription('Calculate costs & CP of draws and upgrades')
            // UNWIRED 2026-10-17 23:38 EDT (Harkirat: "can we also remove the options from the draw calc slash command, except for the visibility option? i honestly dont think they're that useful at the moment. dont delete the code, but unwire it and document it"). `draw`, `pulls`, `balance` and `region` live on in addCalculatorShortcutOptions below, applied nowhere; to wire them back, call it on this subcommand before `visibility`. drawCalculator.js still reads them and gets null, which slashShortcut treats as "no shortcut". Filed in docs/db-deferred-list.md (Someday). Which screen it opens on (2026-10-17 23:51 EDT, Harkirat: "do add view saved into the /draw calculator slash command. im thinking as an optional: page:{Start a Caclculation/View Saved/Help}"). Left blank, it reopens the last calculation as before.
            .addStringOption(option => option.setName('page').setDescription('Open on a specific screen').addChoices({ name: 'Start a Calculation', value: 'start' }, { name: 'View Saved', value: 'saved' }, { name: 'Help', value: 'help' }))
            .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' })))
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]), // Guild + user install, all contexts (v3: usable in a server without a user install)

    buildContainer, // Expose to the root router
    addCalculatorShortcutOptions,

    async execute(interaction, regionOverride = null, subpageOverride = 0) {
        // The `draw` group owns two subcommands. The calculator lives in its own module -- but that module deliberately exports no `data`, because bot/registry.js keys commands by data.name and a second file exporting setName('draw') would register a DUPLICATE command and silently overwrite this one in client.commands. Do NOT "fix" that missing export.
        if (interaction.isChatInputCommand() && interaction.options.getSubcommand() === 'calculator') {
            return require('./drawCalculator').execute(interaction);
        }

        const userId = interaction.user.id;
        const prefs = await UserPreference.findOne({ discordId: userId });

        // NOTE (fixed during review): this previously only accepted `interaction` — but handlers/drawprices.js's price_region_*/price_subpage_* button handlers call execute(interaction, targetRegion, targetSubpage) after already persisting the region pick to prefs.defaultRegion (same persisted-toggle pattern as calendar's active/all filter button) — regionOverride is what that handler passes in so the re-render doesn't have to re-fetch prefs a second time. subpageOverride (added 2026-07-12 for the 2-page entry split) is NOT persisted anywhere -- unlike region, which page of entries you were on isn't a saved preference, just carried along through the button click itself.
        //
        // Priority: explicit slash command option > button click override > pinned defaultRegionMode (2026-07-12, /settings' new 3-option region dropdown -- 'region_10'/'region_30' PIN the opening view regardless of what's last been toggled) > last-viewed defaultRegion > region_10.
        let targetRegion = 'region_10';
        if (REGION_ORDER.includes(prefs?.defaultRegionMode)) {
            targetRegion = prefs.defaultRegionMode;
        } else if (prefs?.defaultRegion) {
            targetRegion = prefs.defaultRegion;
        }
        if (regionOverride) targetRegion = regionOverride;
        let argPrivate = null;

        // PARAMETER INGESTION: Read optional arguments if initiated via Slash Command
        if (interaction.isChatInputCommand()) {
            const visibilityChoice = interaction.options.getString('visibility');
            argPrivate = visibilityChoice === null ? null : visibilityChoice === 'hidden';
            const userChoice = interaction.options.getString('region');
            if (userChoice) targetRegion = userChoice;
            const jumpChoice = interaction.options.getString('type');
            if (jumpChoice) subpageOverride = `f${jumpChoice}`;
        }

        // NOTE: switched from the old per-command `pricesVisibility` field to the shared `seasonalVisibility` field so this respects the single "Seasonal Content" toggle in /settings (Option A).
        const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'seasonalVisibility' });
        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
        const components = buildContainer(targetRegion, accentColor, isEphemeral, subpageOverride, interaction.client);

        return await sendV2Payload(interaction, components);
    }
};