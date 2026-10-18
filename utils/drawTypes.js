// ==========================================
// DRAW TYPES -- which /draw prices type a stored draw is
// ==========================================
// Added 2026-10-18 11:01 EDT for the Series Armory work. A draw on /draws (SeasonalData's newDraws/returningDraws) now carries `priceType`, the /draw prices type it is priced as, so the calculator can price a season's real draws and an armory's item count can be read off its own item list. Harkirat: "a single dropdown for the collective 'draw type' selection and include the armory types within it", and on the count, "i think it makes sense to auto detect by the item list".
//
// The list IS /draw prices' own quick-jump list (JUMP_KEYS, in page order), so a draw type added there reaches /manage, the bulk format and the validator without a second list. Only the short bulk-format codes live here, and scripts/drawOps.test.js fails when a draw type has none.
//
// commands/drawprices.js is required LAZILY: it pulls in discord.js and the models, and utils/adminParser.js (which reads the codes) is required by half the bot at load time.
const prices = () => require('../commands/drawprices');

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

// Every draw type in /draw prices' page order, as { key, code, name, tier }.
function drawTypeOptions() {
    const dp = prices();
    return dp.JUMP_KEYS.map(key => ({ key, code: DRAW_TYPE_CODES[key] || null, name: dp.jumpMeta(key).name, tier: dp.jumpMeta(key).tier }));
}

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
function isPricedDrawType(key) { return prices().JUMP_KEYS.includes(key); }
function isDrawType(key) { return key === UNKNOWN_TYPE.key || isPricedDrawType(key); }
function drawTypeCode(key) { return key === UNKNOWN_TYPE.key ? UNKNOWN_TYPE.code : DRAW_TYPE_CODES[key] || null; }
function drawTypeName(key) { return key === UNKNOWN_TYPE.key ? UNKNOWN_TYPE.name : isPricedDrawType(key) ? prices().jumpMeta(key).name : null; }
function isArmory(key) { return Boolean(prices().SERIES_ARMORY[key]); }
// An armory's item count is its own item list, "-#" note lines excluded (they are free text, never an item).
function armoryItemCount(draw) { return ((draw && draw.items) || []).filter(i => i && i.tier !== 'comment').length; }
// The refusal the op validators show for a tag that names no draw type. utils/adminParser.js marks an unresolved tag with a leading "?" so it reaches the validator instead of being dropped silently.
// Each code beside its full name (2026-10-18 11:21 EDT, Harkirat: "full form stated beside the list of codes? so its understood what each code belongs to?").
function unknownDrawTypeError(raw) { return `Unknown draw type "${String(raw).replace(/^\?/, '')}". Use one of:\n${drawTypeChoices().map(o => `\`${o.code}\` ${o.name}`).join('\n')}`; }

module.exports = { DRAW_TYPE_CODES, UNKNOWN_TYPE, drawTypeOptions, drawTypeChoices, resolveDrawType, isDrawType, isPricedDrawType, drawTypeCode, drawTypeName, isArmory, armoryItemCount, unknownDrawTypeError };
