// The gunsmith lists page (Harkirat, 2026-11-02 21:01-21:44 EST): one page with every list, META, Best, Top 3, Top 5 and HM, by class. His idea at 21:01 EST ("a single page that has all meta best top hm"), his template at 21:11 EST, then 21:19 ("put the label infront in bold"), 21:21 ("make the class label ### and remove the empty lines, make each class in it's own text") and 21:24 ("state in each weapon dropdowns desc, the class and the badge"); approved 21:44 EST ("alright seems good"). Each list's full view is the ordinary /gunsmith card on a list scope (utils/loadoutScopes.js `list`). MP only.
const emojis = require('./emojiMap');
const { isPlaceholderBuild } = require('./loadoutRender');

const CLASSES = [['AR', 'wcAR', 'AR'], ['SMG', 'wcSMG', 'SMG'], ['LMG', 'wcLMG', 'LMG'], ['MARKSMAN', 'wcMarksman', 'Marksman'], ['SHOTGUN', 'wcShotgun', 'Shotgun'], ['SNIPER', 'wcSniper', 'Sniper'], ['SECONDARIES', 'wcPistol', 'Secondary']];
// The page's lines, in order: [key, emoji key, label, does a build carry it].
const LINES = [
    ['meta', 'meta', 'META', b => b.isMeta],
    ['best', 'best', 'Best', b => b.categoryRank === 'best'],
    ['top3', 'top3', 'Top 3', b => b.categoryRank === 'top3'],
    ['top5', 'top5', 'Top 5', b => b.categoryRank === 'top5' || b.categoryRank === 'top4'],
    ['hm', 'hm', 'HM', b => b.categoryRank === 'capable'],
];
// A weapon's strongest tier, in his badge words (2026-11-02 20:35 EST), for its dropdown line.
const TIER_WORD = { best: 'Best in class', top3: 'Top 3 in class', top5: 'Top 5 in class', top4: 'Top 5 in class', capable: 'Honorable Mention' };
const RANK_ORDER = ['best', 'top3', 'top5', 'top4', 'capable'];
// The lists the buttons and the View other lists… dropdown open, as scope tokens (utils/loadoutScopes.js).
const LISTS = [
    { token: 'MP.*.meta', label: 'META', emoji: 'meta' },
    { token: 'MP.*.best', label: 'Best', emoji: 'best' },
    { token: 'MP.*.top', label: 'Top 3 & 5', emoji: 'top3' },
    { token: 'MP.*.hm', label: 'HM', emoji: 'hm' },
];

const realName = name => require('./catalogue').catalogueWeaponName(name);
const classOf = c => CLASSES.find(x => x[0] === c) || [c, null, c];

// Every MP build with a badge, real ones only, in build order so a weapon's first line follows its first build.
async function listedBuilds() {
    const Loadout = require('../models/Loadout');
    const { compareBuilds } = require('./loadoutForm');
    return (await Loadout.find({ mode: 'MP' }).lean())
        .filter(b => !isPlaceholderBuild(b) && (b.isMeta || b.categoryRank))
        .sort((a, b) => a.weaponName.localeCompare(b.weaponName) || compareBuilds(a, b));
}

// The list a weapon opens in from the page: META when one of its builds is Meta, else its strongest tier.
function strongestList(weaponBuilds) {
    if (weaponBuilds.some(b => b.isMeta)) return 'MP.*.meta';
    const rank = RANK_ORDER.find(r => weaponBuilds.some(b => b.categoryRank === r));
    return rank === 'best' ? 'MP.*.best' : rank === 'capable' ? 'MP.*.hm' : 'MP.*.top';
}
function weaponLine(weaponBuilds) {
    const rank = RANK_ORDER.find(r => weaponBuilds.some(b => b.categoryRank === r));
    return [classOf(weaponBuilds[0].category)[2], weaponBuilds.some(b => b.isMeta) ? 'META' : null, rank ? TIER_WORD[rank] : null].filter(Boolean).join(' · ');
}

// One Text Display per class: `### <icon> Class`, then `<emoji> **LABEL** names, …` for each list with a weapon in that class. A weapon is named once per line.
function classBlocks(builds) {
    return CLASSES.map(([cat, icon, word]) => {
        const lines = LINES.map(([, emo, label, has]) => {
            const names = [...new Set(builds.filter(b => b.category === cat && has(b)).map(b => b.weaponName))].map(realName);
            return names.length ? `${emojis[emo] || ''} **${label}** ${names.join(', ')}` : null;
        }).filter(Boolean);
        return lines.length ? { type: 10, content: `### ${emojis[icon] || ''} ${word}\n${lines.join('\n')}` } : null;
    }).filter(Boolean);
}

// The two jump dropdowns (Discord caps one at 25; the lists name ~34 weapons): AR, SMG and LMG, then the rest. Each option opens the weapon in its strongest list.
function jumpRows(builds) {
    const byWeapon = new Map();
    for (const b of builds.filter(x => x.isMeta || x.categoryRank)) { if (!byWeapon.has(b.weaponKey)) byWeapon.set(b.weaponKey, []); byWeapon.get(b.weaponKey).push(b); }
    const groups = [...byWeapon.values()].sort((a, b) => CLASSES.findIndex(c => c[0] === a[0].category) - CLASSES.findIndex(c => c[0] === b[0].category) || realName(a[0].weaponName).localeCompare(realName(b[0].weaponName)));
    const first = new Set(['AR', 'SMG', 'LMG']);
    const option = list => {
        const icon = emojis[classOf(list[0].category)[1]];
        return { label: realName(list[0].weaponName).slice(0, 100), value: `${strongestList(list)}|${list[0].weaponKey}`, description: weaponLine(list).slice(0, 100), ...(icon ? { emoji: emojis.parseEmoji(icon) } : {}) };
    };
    return [
        ['A', 'Jump to an AR, SMG or LMG…', groups.filter(g => first.has(g[0].category))],
        ['B', 'Jump to a Marksman, Shotgun, Sniper or Secondary…', groups.filter(g => !first.has(g[0].category))],
    ].filter(([, , g]) => g.length).map(([id, placeholder, g]) => ({ type: 1, components: [{ type: 3, custom_id: `gsb~ljump~${id}`, placeholder, options: g.slice(0, 25).map(option) }] }));
}

function buildListsPage(builds, { isEphemeral = false } = {}) {
    const { getMpCategoryAccent } = require('./loadoutRender');
    const { withShareButton } = require('./shareButton');
    const blocks = classBlocks(builds);
    const container = { type: 17, accent_color: getMpCategoryAccent(null), components: [
        { type: 10, content: `## ${emojis.gunsmithList} Gunsmith Lists\n-# MP · META, Best, Top 3, Top 5 and Honorable Mention, by class` },
        { type: 14, spacing: 1, divider: true },
        ...(blocks.length ? blocks : [{ type: 10, content: '*The lists are pending an update. Check back soon.*' }]),
        { type: 14, spacing: 2, divider: true },
        { type: 1, components: LISTS.map(l => ({ type: 2, style: 2, label: l.label, custom_id: `gsb~open~${l.token}`, ...(emojis[l.emoji] ? { emoji: emojis.parseEmoji(emojis[l.emoji]) } : {}) })) },
    ] };
    return { components: withShareButton([container, ...jumpRows(builds)], isEphemeral), flags: 32768 };
}

// Sends the page: a fresh reply (slash or text command), or in place of the card a dropdown or button sat under.
async function renderListsPage(interaction, { isUpdate = false, deferred = false, isEphemeral: givenEphemeral = false, visibilityChoice = null } = {}) {
    const { sendV2Payload } = require('./sendV2Payload');
    let isEphemeral = givenEphemeral;
    if (isUpdate) {
        isEphemeral = Boolean(interaction.message?.flags?.bitfield & 64);
        await interaction.deferUpdate();
    } else if (!deferred) {
        const prefs = await require('../models/UserPreference').findOne({ discordId: interaction.user.id });
        const argPrivate = visibilityChoice === null || visibilityChoice === undefined ? null : visibilityChoice === 'hidden';
        isEphemeral = require('./ephemeral').resolveEphemeral({ argPrivate, prefs, prefsField: 'loadoutVisibility' });
        await interaction.deferReply({ ephemeral: isEphemeral });
    }
    await require('./catalogue').getCatalogueIndex(); // real weapon names
    const page = buildListsPage(await listedBuilds(), { isEphemeral });
    return sendV2Payload(interaction, page.components, { flags: page.flags });
}

module.exports = { LISTS, CLASSES, listedBuilds, strongestList, weaponLine, classBlocks, jumpRows, buildListsPage, renderListsPage };
