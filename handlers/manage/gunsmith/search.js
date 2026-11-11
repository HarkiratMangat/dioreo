// ==========================================
// /manage gunsmith — search, quick picks, and the build sets they name
// ==========================================
// Part of the /manage gunsmith rehaul (2026-11-07 14:07 EST, local/project/features/manage-rehaul/spec.md, approved "go ahead" 13:58 EST). Shared by Search Builds, Select Builds, Export and the slash options. Reads only.
//
// An ENTRY KEY is a whole build (`<id>`) or one option of a merged build (`<id>~<option>`, option 0 = A), the same `~` form the `build:` autocomplete and the edit_loadout_ ids already use (handlers/manage/loadouts.js splitTarget).

const Loadout = () => require('../../../models/Loadout');
const emojis = require('../../../utils/emojiMap');

const GROUP = { MP: 'loadouts_mp', DMZ: 'loadouts_dmz' };

const splitKey = (key) => { const [id, opt] = String(key).split('~'); return { id, opt: opt === undefined ? null : Number(opt) }; };

// ---------- classes ----------
const classOf = (c) => require('../../../utils/gunsmithLists').CLASSES.find(x => x[0] === c) || [c, null, c];
const classIcon = (c) => emojis[classOf(c)[1]] || '';
const classWord = (c) => classOf(c)[2];

// A typed line that names a class selects or exports the whole class: `smg`, `all smg`, `snipers`.
const CATEGORY_WORDS = { ar: 'AR', ars: 'AR', assault: 'AR', smg: 'SMG', smgs: 'SMG', lmg: 'LMG', lmgs: 'LMG', marksman: 'MARKSMAN', marksmen: 'MARKSMAN', sniper: 'SNIPER', snipers: 'SNIPER', shotgun: 'SHOTGUN', shotguns: 'SHOTGUN', secondary: 'SECONDARIES', secondaries: 'SECONDARIES', pistol: 'SECONDARIES', pistols: 'SECONDARIES' };
const categoryOfLine = (line) => CATEGORY_WORDS[String(line).toLowerCase().trim().replace(/^all\s+/, '')] || null;

// ---------- badges, as words ---------- MP badges: utils/adminParser.js loadoutBadgeTokens. DMZ's rank is a tier plus an optional range (`bestclose`, `top3midlong`; models/Loadout.js dmzRangeRank), read as words here: "Best Close", "Top 3 Mid-Long".
const MP_BADGE = { meta: ['meta', 'Meta'], best: ['best', 'Best'], top3: ['top3', 'Top 3'], top5: ['top5', 'Top 5'], capable: ['hm', 'HM'], toxic: ['toxic', 'Toxic'], ass: ['ass', 'Ass'] };
function badgeWord(token) {
    if (MP_BADGE[token]) return MP_BADGE[token];
    const m = /^(best|top(\d+)|capable)(close|midlong)?$/.exec(token);
    if (!m) return null;
    const tier = m[1] === 'best' ? ['best', 'Best'] : m[1] === 'capable' ? ['hm', 'HM'] : [Number(m[2]) <= 3 ? 'top3' : 'top5', `Top ${m[2]}`];
    const range = m[3] === 'close' ? ' Close' : m[3] === 'midlong' ? ' Mid-Long' : '';
    return [tier[0], `${tier[1]}${range}`];
}
const badgeWords = (l) => require('../../../utils/adminParser').loadoutBadgeTokens(l).map(badgeWord).filter(Boolean).map(([e, w]) => `${emojis[e] || ''} ${w}`.trim());

// ---------- quick picks ---------- One list per mode, every pick a union with the others and with the typed names (Harkirat, 2026-11-07 11:22 EST: "all meta and all ar"). Under Discord's 25 options either way.
const RANK = (l) => String(l.dmzRangeRank || '');
const PICK_TESTS = {
    MP: [
        ['meta', 'All Meta', l => l.isMeta], ['best', 'All Best', l => l.categoryRank === 'best'], ['top3', 'All Top 3', l => l.categoryRank === 'top3'], ['top5', 'All Top 5', l => l.categoryRank === 'top5'],
        ['hm', 'All HM', l => l.categoryRank === 'capable'], ['toxic', 'All Toxic', l => l.isToxic], ['ass', 'All Ass', l => l.isAss],
    ],
    DMZ: [
        ['meta', 'All Meta', l => l.isMeta], ['best', 'All Best', l => RANK(l).startsWith('best')], ['bestclose', 'All Best Close', l => RANK(l) === 'best-close'], ['bestmidlong', 'All Best Mid-Long', l => RANK(l) === 'best-midlong'],
        ['top3', 'All Top 3', l => RANK(l).startsWith('top3')], ['top5', 'All Top 5', l => RANK(l).startsWith('top5')], ['hm', 'All HM', l => RANK(l).startsWith('capable')],
        ['toxic', 'All Toxic', l => l.isToxic], ['ass', 'All Ass', l => l.isAss],
    ],
};
function quickPicks(mode) {
    const { CLASS_ORDER } = require('../../../utils/loadoutRender');
    return [
        ['all', `All ${mode} builds`],
        ...CLASS_ORDER.map(c => [`cat:${c}`, `All ${classWord(c)}`]),
        ...PICK_TESTS[mode].map(([value, label]) => [value, label]),
    ];
}
function pickTest(mode, pick) {
    if (pick === 'all') return () => true;
    if (pick.startsWith('cat:')) return l => l.category === pick.slice(4);
    const row = PICK_TESTS[mode].find(p => p[0] === pick);
    return row ? row[2] : null;
}

// ---------- search ---------- Every typed word must appear, the way `build:` autocomplete works (handlers/manage/loadouts.js buildChoices), plus one rule it lacks: a word shaped like a build tag (`1`, `1b`) must equal the build's own tag, so `fss 1b` finds Option B and not Option A. His click-test, 2026-11-07 12:55 EST: "shouldnt this have found the fss hurricane?". A number that is part of the weapon's own name (KILO 141, AK117) is the name, not a tag.
async function searchBuilds(mode, query) {
    const choices = await require('../loadouts').buildChoices(GROUP[mode], query);
    const tags = String(query || '').toLowerCase().split(/\s+/).filter(w => /^\d+[a-z]?$/.test(w));
    return choices
        .filter(c => !String(c.value).startsWith('new:') && !/\(Delete\)$/.test(c.name))
        .filter(c => {
            const weaponNorm = String(c.name.split(' · ')[0]).toLowerCase().replace(/[^a-z0-9]/g, '');
            const own = tags.filter(tg => !weaponNorm.includes(tg));
            if (!own.length) return true;
            const m = / · (?:Build )?(\d+[a-z]?)(?: · |$)/i.exec(c.name);
            return m && own.includes(m[1].toLowerCase());
        })
        .map(c => { const [id, opt] = String(c.value).split('~'); return { id, option: opt === undefined ? 0 : Number(opt), label: c.name }; });
}

const compare = (a, b) => a.weaponName.localeCompare(b.weaponName) || require('../../../utils/loadoutForm').compareBuilds(a, b);
const nameLines = (raw) => String(raw || '').split(/\n|,/).map(s => s.trim()).filter(Boolean);

// The builds the typed names and the quick picks name together, whole builds only (Export). One read of the mode's builds.
async function resolveSet(mode, namesRaw, picks = []) {
    const all = await Loadout().find({ mode }).lean();
    const byId = new Map(all.map(l => [String(l._id), l]));
    const out = new Map();
    for (const p of picks) { const test = pickTest(mode, p); if (test) all.filter(test).forEach(l => out.set(String(l._id), l)); }
    const unmatched = [];
    for (const line of nameLines(namesRaw)) {
        const cat = categoryOfLine(line);
        if (cat) { all.filter(l => l.category === cat).forEach(l => out.set(String(l._id), l)); continue; }
        const hits = await searchBuilds(mode, line);
        if (!hits.length) { unmatched.push(line); continue; }
        for (const h of hits) { const d = byId.get(h.id); if (d) out.set(h.id, d); }
    }
    return { builds: [...out.values()].sort(compare), unmatched };
}

// Select's entries. A typed line naming a build tag (`fss 1b`) selects that option alone; names without a tag and the quick picks select whole builds (his 13:13 EST: "if i type fss 1b, shouldnt it select 1b specifically?").
async function resolveKeys(mode, namesRaw, picks = []) {
    const all = await Loadout().find({ mode }).lean();
    const byId = new Map(all.map(l => [String(l._id), l]));
    const keys = new Set();
    for (const p of picks) { const test = pickTest(mode, p); if (test) all.filter(test).sort(compare).forEach(l => keys.add(String(l._id))); }
    const unmatched = [];
    for (const line of nameLines(namesRaw)) {
        const cat = categoryOfLine(line);
        if (cat) { all.filter(l => l.category === cat).sort(compare).forEach(l => keys.add(String(l._id))); continue; }
        const tagged = /(^|\s)\d+[a-z]?(\s|$)/i.test(line);
        const hits = await searchBuilds(mode, line);
        if (!hits.length) { unmatched.push(line); continue; }
        for (const h of hits) {
            const d = byId.get(h.id);
            if (!d) continue;
            keys.add(tagged && (d.variants || []).length ? `${h.id}~${h.option}` : h.id);
        }
    }
    // A whole build and one of its own options both selected: the whole build covers it.
    const list = [...keys].filter(k => { const { id, opt } = splitKey(k); return opt === null || !keys.has(id); });
    return { keys: list, unmatched };
}

// The display facts for entry keys, one database read. His 13:26 EST and 13:38 EST: a row is the weapon and its build number (no wrap on a phone), then label · badges · options; no code (meaningless on a merged build) and no attachments.
async function infoFor(keys) {
    const ids = [...new Set(keys.map(k => splitKey(k).id))].filter(id => /^[0-9a-f]{24}$/.test(id));
    const docs = new Map((await Loadout().find({ _id: { $in: ids } }).lean()).map(d => [String(d._id), d]));
    const out = new Map();
    for (const k of keys) { const d = docs.get(splitKey(k).id); if (d) out.set(k, keyInfo(k, d)); }
    return out;
}

function keyInfo(key, d) {
    const { opt } = splitKey(key);
    const lo = require('../../../utils/loadoutOptions');
    const optCount = 1 + (d.variants || []).length;
    const label = opt ? (d.variants[opt - 1]?.label || '') : (d.label || '');
    const n = require('../../../utils/loadoutForm').buildNumberOf(d.buildName);
    const tag = n === null ? d.buildName : (opt !== null && optCount > 1 ? lo.optionTag(n, opt) : String(n));
    const words = badgeWords(d);
    return {
        doc: d,
        icon: classIcon(d.category),
        emojiKey: classOf(d.category)[1],
        title: `**${d.weaponName}** · ${tag}`,
        small: [label, words.join(' '), opt === null && optCount > 1 ? `${optCount} options` : null].filter(Boolean).join(' · '),
        plain: `${d.weaponName} · ${tag}${label ? ` · ${label}` : ''}`,
        plainSmall: [label, words.map(w => w.replace(/<a?:\w+:\d+>\s?/g, '')).join(' '), opt === null && optCount > 1 ? `${optCount} options` : null].filter(Boolean).join(' · '),
    };
}

// A merged build selected whole already holds every option, so its option keys are dropped beside it (2026-11-11 17:09 EST, think-pass click test: selecting FSS 1 and FSS 1b put Option B into Edit 3 twice, and Expand View showed the build twice).
function collapseKeys(keys) {
    const whole = new Set(keys.filter(k => splitKey(k).opt === null).map(k => splitKey(k).id));
    return keys.filter(k => { const { id, opt } = splitKey(k); return opt === null || !whole.has(id); });
}

module.exports = { GROUP, splitKey, collapseKeys, classOf, classIcon, classWord, categoryOfLine, badgeWord, badgeWords, quickPicks, pickTest, searchBuilds, resolveSet, resolveKeys, infoFor, keyInfo, compare };
