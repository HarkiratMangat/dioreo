// The gunsmith lists page (Harkirat, 2026-11-02 21:01-21:44 EST): one page with every list by class. His idea at 21:01 EST ("a single page that has all meta best top hm"), his template at 21:11 EST, then 21:19 ("put the label infront in bold"), 21:24 ("state in each weapon dropdowns desc, the class and the badge"); approved 21:44 EST ("alright seems good"). Redesigned on his template of 2026-11-03 11:44 EST: titled "Current META Weapons" with the season under it, the MP accent, each class a bold `<icon> Class` label in the in-game order (utils/loadoutRender.js CLASS_ORDER), its Best / Top 3 / Top 5 / HM lines with names joined by " · ", a divider between classes, "-# View all builds for…" above the list buttons. META moved to its own page ("let's separate the meta list to a sub-page"), page 2 of a two-page pager under the same title (his 12:00 EST "no, just do pages", over a button on the title). A build's label shows in brackets after its weapon, `CX-9 (Burst)`. Each list's full view is the ordinary /gunsmith card on a list scope (utils/loadoutScopes.js `list`). MP only.
const emojis = require('./emojiMap');
const { isPlaceholderBuild, CLASS_ORDER, byClassOrder, displayCategoryLabel } = require('./loadoutRender');

// [category, class icon key, the class word on the page]. "Assault" for AR on this page only, from his template; every dropdown keeps AR (utils/loadoutRender.js displayCategoryLabel).
const CLASS_WORD = { AR: ['wcAR', 'Assault'], SNIPER: ['wcSniper', 'Sniper'], LMG: ['wcLMG', 'LMG'], SMG: ['wcSMG', 'SMG'], SHOTGUN: ['wcShotgun', 'Shotgun'], MARKSMAN: ['wcMarksman', 'Marksman'], SECONDARIES: ['wcPistol', 'Secondary'] };
const CLASSES = CLASS_ORDER.map(c => [c, ...CLASS_WORD[c]]);
// A page's lines, in order: [key, emoji key, label, does a build carry it]. The main page carries the tiers; META sits on its own sub-page. The META page has no badge line: the class label, then one line per weapon with one gunsmith code, the bare code without the weapon prefix (his 2026-11-03 13:24-13:27 EST: "list the gunsmith codes as well", "only 1 code per weapon", "just do the code only, remove the prefix"; the weapon's first META build's own code in build order, never an option's). The names-only shape came first (mock B, his 2026-11-03 12:24 EST "mockup 2 doesnt wrap on phone, the others wrap"). A null label is a names-only row.
const META_LINES = [['meta', null, null, b => b.isMeta]];
const TIER_LINES = [
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
// The MP colour, /manage's MP Loadouts page accent (utils/loadoutPanels.js ACCENT.MP, #FF3430): his "utilize the \"mp\" color", 2026-11-03 11:44 EST. The old getMpCategoryAccent(null) fallback was #2b2d31, the colour of Discord's own background, so the page showed none.
const mpAccent = () => require('./loadoutPanels').ACCENT.MP;

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
    return [displayCategoryLabel(weaponBuilds[0].category), weaponBuilds.some(b => b.isMeta) ? 'META' : null, rank ? TIER_WORD[rank] : null].filter(Boolean).join(' · ');
}

// One Text Display per class: `**<icon> Class**`, then `<emoji> **LABEL**  names · …` for each line with a weapon in that class. A weapon is named once per line.
function classBlocks(builds, lines = TIER_LINES) {
    return CLASSES.map(([cat, icon, word]) => {
        const rows = lines.map(([, emo, label, has]) => {
            const names = weaponNames(builds.filter(b => b.category === cat && has(b)), { codes: !label });
            if (!names.length) return null;
            return label ? `${emojis[emo] || ''} **${label}**  ${names.join(' · ')}` : names.join('\n');
        }).filter(Boolean);
        return rows.length ? { type: 10, content: `**${emojis[icon] || ''} ${word}**\n${rows.join('\n')}` } : null;
    }).filter(Boolean);
}
// The weapons on one line, each named once, in build order. A build's label shows in brackets (his template, 2026-11-03 11:44 EST: "CX-9 (Burst) · QQ9 (10mm)") only when he switched it on for that build (`showLabelOnLists`): his 12:13 EST "don't auto pick/use the build names. only if i want them", after the first version showed STATIC-HV (Aggressive / Alt Aggressive / Flex) on its own. Strongest first, then A-Z (his 2026-11-03 12:17 EST "move static hv in front of fss": on the META line STATIC-HV, Best, now leads FSS Hurricane, Top 3). A tier line is one tier, so it stays A-Z.
const tierRank = list => { const i = RANK_ORDER.findIndex(r => list.some(b => b.categoryRank === r)); return i === -1 ? RANK_ORDER.length : i; };
function weaponNames(lineBuilds, { codes = false } = {}) {
    const byWeapon = new Map();
    for (const b of lineBuilds) { if (!byWeapon.has(b.weaponName)) byWeapon.set(b.weaponName, []); byWeapon.get(b.weaponName).push(b); }
    return [...byWeapon.entries()].sort(([, a], [, b]) => tierRank(a) - tierRank(b)).map(([name, list]) => {
        const labels = [...new Set(list.filter(b => b.showLabelOnLists).map(b => String(b.label || '').trim()).filter(Boolean))];
        const named = labels.length ? `${realName(name)} (${labels.join(' / ')})` : realName(name);
        const code = codes && list.find(b => b.shareCode)?.shareCode;
        // On the META page each weapon is a list item: the WhiteDotGlow dot, the name in bold, its code (his 2026-11-03 14:02 EST "make it a list? using our whitedotglow emoji with the weapon name in bold").
        return codes ? `${emojis.whiteDotGlow || '•'} **${named}**${code ? `  \`${code}\`` : ''}` : named;
    });
}
// His notation, the announcements' (2026-11-03 12:00 EST: "==== is divider:true large. -- means divider:false small"): `--` between classes is a small gap with no line; `====` under the title and above the hint is a large divider.
const withDividers = blocks => blocks.flatMap((b, i) => (i ? [{ type: 14, spacing: 1, divider: false }, b] : [b]));

// The two jump dropdowns (Discord caps one at 25; the lists name ~34 weapons): AR, Sniper and LMG, then the rest, in the in-game order. Each option opens the weapon in its strongest list.
const FIRST_GROUP = new Set(CLASS_ORDER.slice(0, 3));
function jumpRows(builds) {
    const byWeapon = new Map();
    for (const b of builds.filter(x => x.isMeta || x.categoryRank)) { if (!byWeapon.has(b.weaponKey)) byWeapon.set(b.weaponKey, []); byWeapon.get(b.weaponKey).push(b); }
    const groups = [...byWeapon.values()].sort((a, b) => byClassOrder(a[0].category, b[0].category) || realName(a[0].weaponName).localeCompare(realName(b[0].weaponName)));
    const option = list => {
        const icon = emojis[classOf(list[0].category)[1]];
        return { label: realName(list[0].weaponName).slice(0, 100), value: `${strongestList(list)}|${list[0].weaponKey}`, description: weaponLine(list).slice(0, 100), ...(icon ? { emoji: emojis.parseEmoji(icon) } : {}) };
    };
    return [
        ['A', 'Jump to an AR, Sniper or LMG…', groups.filter(g => FIRST_GROUP.has(g[0].category))],
        ['B', 'Jump to an SMG, Shotgun, Marksman or Secondary…', groups.filter(g => !FIRST_GROUP.has(g[0].category))],
    ].filter(([, , g]) => g.length).map(([id, placeholder, g]) => ({ type: 1, components: [{ type: 3, custom_id: `gsb~ljump~${id}`, placeholder, options: g.slice(0, 25).map(option) }] }));
}

const listButton = l => ({ type: 2, style: 2, label: l.label, custom_id: `gsb~open~${l.token}`, ...(emojis[l.emoji] ? { emoji: emojis.parseEmoji(emojis[l.emoji]) } : {}) });
// The two pages: 1 META, 2 the tiers (his 2026-11-03 14:13 EST "meta is supposed to be page #1 in the order"). The pager's ids carry the target page (`gsb~lpage~0|1`, handlers/loadouts.js); page 1 is what `d meta`, `/gunsmith list` and All lists open.
const pager = meta => require('./paginationRow').buildPaginationRow({ totalChunks: 2, currentPage: meta ? 0 : 1, makeCustomId: p => `gsb~lpage~${p}`, indicatorCustomId: 'gsb~lpage~at', indicatorLabel: meta ? 'META · 1/2' : 'Tiers · 2/2' });

// `page`: 'meta' (page 1, the default: META) or 'main' (page 2: Best, Top 3, Top 5, HM), both under the Current META Weapons title. `season`: { title, emoji } for the line under the title, as /today shows it.
function buildListsPage(builds, { isEphemeral = false, season = null, page = 'meta' } = {}) {
    const { withShareButton } = require('./shareButton');
    const { toBoldItalicUnicode } = require('./titleBlock');
    const meta = page === 'meta';
    const shown = meta ? builds.filter(b => b.isMeta) : builds;
    const blocks = classBlocks(shown, meta ? META_LINES : TIER_LINES);
    const seasonLine = season?.title ? `\n${season.emoji ? `${season.emoji} ` : ''}${toBoldItalicUnicode(season.title)}` : '';
    const container = { type: 17, accent_color: mpAccent(), components: [
        // The header carries an icon-only Search, the card's own one-box search pop-up (`gsb~search~MP`), as the reminders bell does: a Section holding the title and the season line (Harkirat, 2026-11-06 22:06 EST: "add an icon only button in the header of the lists command with the \"search mp builds\" pop-up").
        { type: 9, components: [{ type: 10, content: `## ${emojis.gunsmithList || ''} Current META Weapons${seasonLine}` }], accessory: { type: 2, style: 2, custom_id: 'gsb~search~MP', ...(emojis.gunsmithSearch ? { emoji: emojis.parseEmoji(emojis.gunsmithSearch) } : { label: 'Search' }) } },
        { type: 14, spacing: 2, divider: true },
        ...(blocks.length ? withDividers(blocks) : [{ type: 10, content: '*The lists are pending an update. Check back soon.*' }]),
        // The /draws order (his pick A, 2026-11-03 13:23 EST): a small gap, the pager under the lists, a large divider, then the hint and every list's button, on both pages.
        { type: 14, spacing: 1, divider: false },
        pager(meta),
        { type: 14, spacing: 2, divider: true },
        { type: 10, content: '-# View all builds for…' },
        { type: 1, components: LISTS.map(listButton) },
    ] };
    // Both weapon dropdowns hold every weapon on any list (META, Best, Top 3, Top 5, HM) on both pages, never only the page's own weapons (Harkirat, 2026-11-06 22:06 EST: "those 2 dropdowns below should be holding the full meta, best, top 3, top 5, and hm weapons").
    return { components: withShareButton([container, ...jumpRows(builds)], isEphemeral), flags: 32768 };
}

// The season line under the title: the current season, with its emoji, as /today and /calendar show it.
async function currentSeason() {
    const doc = await require('../models/SeasonalData').findOne({ docType: 'global' }).select('currentSeasonTitle currentSeasonEmoji').lean();
    if (!doc?.currentSeasonTitle) return null;
    return { title: doc.currentSeasonTitle, emoji: require('./seasonEmoji').seasonEmojiFor(doc.currentSeasonTitle, doc.currentSeasonEmoji) };
}

// Sends the page: a fresh reply (slash or text command), or in place of the card a dropdown or button sat under. THE MP GUNSMITHS LANDING (Harkirat, 2026-11-06: "let's create a new landing page or something so it doesn't just feel like a random jump into a build" at 22:06 EST; Mock B picked at 22:16 EST with Search moved to its own section beside Submit a Build; titled "MP Gunsmiths", no counts line, "Browse a class…", Search blue and Submit grey at 22:21 EST; "yes" to build it at 22:37 EST). What a bare `d gs` (`d gunsmith`, `d build`, `d b`) opens: the title with the season, the classes as buttons in the in-game order (4 then 3), the list buttons, then Search Builds and Submit a Build. A class button is `gsb~cls~<CATEGORY>` (handlers/loadouts.js), that class's browse from its first build. Only classes with a real build get a button.
function buildLandingPage(categories, { isEphemeral = false, season = null } = {}) {
    const { withShareButton } = require('./shareButton');
    const { toBoldItalicUnicode } = require('./titleBlock');
    const seasonLine = season?.title ? `\n${season.emoji ? `${season.emoji} ` : ''}${toBoldItalicUnicode(season.title)}` : '';
    const present = new Set(categories);
    const cls = CLASSES.filter(([c]) => present.has(c));
    const classButton = ([c, icon, word]) => ({ type: 2, style: 2, label: word, custom_id: `gsb~cls~${c}`, ...(emojis[icon] ? { emoji: emojis.parseEmoji(emojis[icon]) } : {}) });
    const classRows = [cls.slice(0, 4), cls.slice(4)].filter(r => r.length).map(r => ({ type: 1, components: r.map(classButton) }));
    const container = { type: 17, accent_color: mpAccent(), components: [
        { type: 10, content: `## ${emojis.gunsmithList || ''} MP Gunsmiths${seasonLine}` },
        { type: 14, spacing: 2, divider: true },
        ...(classRows.length ? [{ type: 10, content: '-# Browse a class…' }, ...classRows, { type: 14, spacing: 1, divider: false }] : []),
        { type: 10, content: '-# Or view all builds for…' },
        { type: 1, components: LISTS.map(listButton) },
        { type: 14, spacing: 2, divider: true },
        { type: 1, components: [
            { type: 2, style: 1, label: 'Search Builds', custom_id: 'gsb~search~MP', ...(emojis.gunsmithSearch ? { emoji: emojis.parseEmoji(emojis.gunsmithSearch) } : {}) },
            { type: 2, style: 2, label: 'Submit a Build', custom_id: 'gsb~submit~MP~-', ...(emojis.share ? { emoji: emojis.parseEmoji(emojis.share) } : {}) },
        ] },
    ] };
    return { components: withShareButton([container], isEphemeral), flags: 32768 };
}

// Every class with at least one real MP build, for the landing's buttons.
async function buildCategories() {
    const builds = await require('../models/Loadout').find({ mode: 'MP' }).select('category attachments noAttachments').lean();
    return [...new Set(builds.filter(b => !isPlaceholderBuild(b)).map(b => b.category))];
}

async function renderLandingPage(interaction, { isUpdate = false, deferred = false, isEphemeral: givenEphemeral = false, visibilityChoice = null } = {}) {
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
    const [categories, season] = await Promise.all([buildCategories(), currentSeason()]);
    const out = buildLandingPage(categories, { isEphemeral, season });
    return sendV2Payload(interaction, out.components, { flags: out.flags });
}

async function renderListsPage(interaction, { isUpdate = false, deferred = false, isEphemeral: givenEphemeral = false, visibilityChoice = null, page = 'meta' } = {}) {
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
    const [builds, season] = await Promise.all([listedBuilds(), currentSeason()]);
    const out = buildListsPage(builds, { isEphemeral, season, page });
    return sendV2Payload(interaction, out.components, { flags: out.flags });
}

module.exports = { LISTS, CLASSES, listedBuilds, strongestList, weaponLine, classBlocks, jumpRows, buildListsPage, renderListsPage, buildLandingPage, renderLandingPage };
