// ==========================================
// DRAW TYPES -- which /draw prices type a stored draw is
// ==========================================
// Added 2026-10-18 11:01 EDT for the Series Armory work. A draw on /draws (SeasonalData's newDraws/returningDraws) now carries `priceType`, the /draw prices type it is priced as, so the calculator can price a season's real draws and an armory's item count can be read off its own item list. Harkirat: "a single dropdown for the collective 'draw type' selection and include the armory types within it", and on the count, "i think it makes sense to auto detect by the item list".
//
// 🔴 THIS FILE REQUIRES NOTHING, ON PURPOSE (2026-10-18 12:24 EDT). It first read its list from commands/drawprices.js, lazily. utils/hotpatch.js reads require() edges statically, so that made /draw prices a dependency of utils/adminParser.js and, through it, of every stateful /manage module: hotpatching /draw prices was refused (scripts/hotpatch.test.js, "a pure command file is ALLOW"). The list below is therefore a copy of /draw prices' quick-jump list, in its page order, and scripts/drawOps.test.js fails the moment a key, name, tier or the order differs from commands/drawprices.js JUMP_KEYS/jumpMeta. Add a draw type there, then here.

// The `type:` tag codes for the bulk and one-line formats (`Title, type: salw, l Item, July 15`). Short on purpose: a season's bulk paste carries one per line.
const DRAW_TYPE_CODES = {
    mythicWeapon: 'mw',
    mythicCharacter: 'mc',
    legendaryGunReactive: 'lwr',
    legendaryGunNonReactive: 'lw',
    legendaryCharacterWeapon: 'lcw',
    doubleLegendaryWeapons: 'dlw',
    sevenSpinLegendaryWeapon: '7s',
    pickYourRewardCard: 'pyr',
    doubleEpicCharacters: 'dec',
    armoryMythicWeapon: 'samw',
    armoryLegendaryWeapon: 'salw',
    armoryLegendaryCharacter: 'salc',
    advancedWeapon: 'adlw',
    advancedCharacter: 'adlc'
};

// UNSURE / UNKNOWN (2026-10-18 11:37 EDT, Harkirat: "make it a required field and add the option for 'unsure/unknown' at the top of the list. This way its easier to parse as a flagged item later on in the portal and quickly update."). A real stored value, distinct from '' (never set): it says someone looked and did not know. It prices nothing, so the calculator never offers it.
const UNKNOWN_TYPE = { key: 'unknown', code: 'unknown', name: 'Unsure / Unknown', tier: null };

// Every draw type in /draw prices' page order: key, name and tier exactly as commands/drawprices.js has them. `armory` marks the Series Armories.
const DRAW_TYPES = [
    { key: 'mythicWeapon', name: 'Mythic Weapon Draw', tier: 'mythic' },
    { key: 'mythicCharacter', name: 'Mythic Character + Legendary Weapon Draw', tier: 'mythic' },
    { key: 'legendaryGunReactive', name: 'Legendary Weapon Draw (Reactive)', tier: 'legendary' },
    { key: 'legendaryGunNonReactive', name: 'Legendary Weapon Draw (Non-Reactive)', tier: 'legendary' },
    { key: 'legendaryCharacterWeapon', name: 'Legendary Character + Legendary Weapon Draw', tier: 'legendary' },
    { key: 'doubleLegendaryWeapons', name: 'Double Legendary Weapons Draw', tier: 'legendary' },
    { key: 'sevenSpinLegendaryWeapon', name: '7 Spins Legendary Weapon Draw', tier: 'legendary' },
    { key: 'pickYourRewardCard', name: 'Pick Your Reward Card Legendary Weapon Draw', tier: 'legendary' },
    { key: 'doubleEpicCharacters', name: 'Double Epic Characters Draw', tier: 'epic' },
    { key: 'armoryMythicWeapon', name: 'Mythic Weapon Series Armory', tier: 'mythic', armory: true },
    { key: 'armoryLegendaryWeapon', name: 'Legendary Weapon Series Armory', tier: 'legendary', armory: true },
    { key: 'armoryLegendaryCharacter', name: 'Legendary Character Series Armory', tier: 'legendary', armory: true },
    { key: 'advancedWeapon', name: 'Advanced Double Legendary Weapon Draw', tier: 'legendary' },
    { key: 'advancedCharacter', name: 'Advanced Double Legendary Character Draw', tier: 'legendary' }
];
function drawTypeOptions() { return DRAW_TYPES.map(t => ({ key: t.key, code: DRAW_TYPE_CODES[t.key] || null, name: t.name, tier: t.tier })); }
const byKey = key => DRAW_TYPES.find(t => t.key === key) || null;

// What a /manage form or the bulk format may store: Unsure / Unknown first, then every priced type.
function drawTypeChoices() { return [UNKNOWN_TYPE, ...drawTypeOptions()]; }

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
// A typed tag to its key: the code, the key itself, or the full name, ignoring case, spaces and punctuation. Exact after that, never fuzzy: "Legendary Weapon Draw (Reactive)" and "(Non-Reactive)" are one word apart and must never be confused.
function resolveDrawType(raw) {
    const n = norm(raw);
    if (!n) return null;
    if (['unknown', 'unsure', 'unk'].includes(n)) return UNKNOWN_TYPE.key;
    const hit = drawTypeOptions().find(o => norm(o.code) === n || norm(o.key) === n || norm(o.name) === n);
    return hit ? hit.key : null;
}

// A storable value (Unsure / Unknown included). isPricedDrawType is the narrower question the calculator asks.
function isPricedDrawType(key) { return Boolean(byKey(key)); }
function isDrawType(key) { return key === UNKNOWN_TYPE.key || isPricedDrawType(key); }
function drawTypeCode(key) { return key === UNKNOWN_TYPE.key ? UNKNOWN_TYPE.code : DRAW_TYPE_CODES[key] || null; }
function drawTypeName(key) { return key === UNKNOWN_TYPE.key ? UNKNOWN_TYPE.name : byKey(key) ? byKey(key).name : null; }
// An armory's item count is its own item list, "-#" note lines excluded (they are free text, never an item).
function armoryItemCount(draw) { return ((draw && draw.items) || []).filter(i => i && i.tier !== 'comment').length; }
// The refusal the op validators show for a tag that names no draw type. utils/adminParser.js marks an unresolved tag with a leading "?" so it reaches the validator instead of being dropped silently. Each code beside its full name (2026-10-18 11:21 EDT, Harkirat: "full form stated beside the list of codes? so its understood what each code belongs to?").
function unknownDrawTypeError(raw) { return `Unknown draw type "${String(raw).replace(/^\?/, '')}". Use one of:\n${drawTypeChoices().map(o => `\`${o.code}\` ${o.name}`).join('\n')}`; }

module.exports = { DRAW_TYPES, DRAW_TYPE_CODES, UNKNOWN_TYPE, drawTypeOptions, drawTypeChoices, resolveDrawType, isDrawType, isPricedDrawType, drawTypeCode, drawTypeName, armoryItemCount, unknownDrawTypeError };
