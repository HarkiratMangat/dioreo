// utils/catalogue.js
//
// Reads the CODM catalogue (models/CatalogueItem.js) for the bot: is a weapon or attachment name known, which slot an attachment sits in, and what a seed run would add. The lookups are pure functions over an index so tests need no database; getCatalogueIndex() is the one place that reads Mongo, cached for a minute and dropped after every catalogue op.
//
// ⚠️ The catalogue WARNS, it never refuses (Harkirat, 2026-10-19 16:13 EDT: "warn. but if warn, allow a confirm overwrite or a go back to edit"). The screenshot it was seeded from is the game's general table: measured 2026-10-19 15:53 EDT, it lacked 311 of the 684 attachments the dev builds really use, the whole Perk slot among them, so refusing would have blocked most saves.
const normKey = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// The screenshot's category headings, mapped onto the bot's own Loadout.category keys.
const CATEGORY_KEYS = {
    'Assault Rifles': 'AR', 'Submachine Guns': 'SMG', 'Light Machine Guns': 'LMG', 'Marksman Rifles': 'MARKSMAN',
    'Sniper Rifles': 'SNIPER', 'Shotguns': 'SHOTGUN', 'Pistols': 'SECONDARIES'
};
// Transcription slips in the seed, corrected at seed time so the tracked JSON stays a faithful copy of what was transcribed.
const NAME_FIXES = { AK17: 'AK117' };
// Harkirat's slot rulings for attachments no screenshot or metadata could place (2026-09-16 11:28 EDT). Moved here from scripts/backfillSlotsFromMetadata.js, which now reads them from this one copy, so the catalogue and the slot backfill can never disagree.
const RULED_SLOTS = {
    '270mm VOZ Carbine': 'Barrel',
    'Empress 514mm F01': 'Barrel',
    'Hi-Accuracy Sniper Ammo': 'Ammunition',
    'Fast Reload Reload Case': 'Ammunition',
    'MFT Heavy Smoothbore': 'Smoothbore',
    'Light Bolt': 'Bolt',
    'Classical Lever': 'Trigger Action',
    'Lightweight Single-Action': 'Trigger Action',
    'Rapid Action': 'Trigger Action',
    '2B Bowstring': 'Bowstring',
    'Heavy Limb': 'Limb',
    'OWC Stable': 'Guard',
};
// A placeholder build's attachment line (scripts/createPlaceholderLoadouts.js) is not a game item.
const isPlaceholderName = (name) => /^coming soon/i.test(String(name || '').trim());

function buildIndex(items) {
    const weapons = new Map();
    const attachments = new Map();
    for (const it of items || []) {
        const map = it.kind === 'weapon' ? weapons : attachments;
        const key = it.key || normKey(it.name);
        if (!map.has(key)) map.set(key, it);
    }
    return { weapons, attachments, size: weapons.size + attachments.size };
}

// The names in a build the catalogue does not know. An empty or missing catalogue knows nothing and warns about nothing, so a fresh database never nags.
function unknownNames(index, { weaponName, attachments } = {}) {
    if (!index || !index.size) return { weapon: null, attachments: [], count: 0 };
    const w = String(weaponName || '').trim();
    const weapon = w && !index.weapons.has(normKey(w)) ? w : null;
    const seen = new Set();
    const atts = [];
    for (const a of attachments || []) {
        const name = String(a || '').trim();
        const key = normKey(name);
        if (!name || seen.has(key) || index.attachments.has(key)) continue;
        seen.add(key);
        atts.push(name);
    }
    return { weapon, attachments: atts, count: (weapon ? 1 : 0) + atts.length };
}

// Slot labels aligned to `attachments`, '' where the catalogue has none. [] when it knows none at all, so a caller can tell "nothing learned" from "some blanks".
function slotsFromIndex(index, attachments) {
    if (!index || !index.size) return [];
    const slots = (attachments || []).map(a => index.attachments.get(normKey(a))?.slot || '');
    return slots.some(Boolean) ? slots : [];
}

// The catalogue items an admin's Save anyway adds: the unknown weapon with the category typed beside it, and each unknown attachment with no slot (a modal has no slot field; scripts/seedCatalogue.js --report lists them for a later ruling).
function learnItems(unknown, { category = null } = {}) {
    const items = [];
    if (unknown?.weapon) items.push({ kind: 'weapon', name: unknown.weapon, key: normKey(unknown.weapon), category: category ? String(category).toUpperCase() : null, source: 'confirmed' });
    for (const a of unknown?.attachments || []) items.push({ kind: 'attachment', name: a, key: normKey(a), slot: null, source: 'confirmed' });
    return items;
}

// What /manage shows under a save that met unknown names.
function describeUnknown(unknown) {
    const parts = [];
    if (unknown.weapon) parts.push(`weapon \`${unknown.weapon}\``);
    if (unknown.attachments.length) parts.push(unknown.attachments.map(a => `\`${a}\``).join(', '));
    return parts.join(' · ');
}

// The seed: the screenshot's table first (it carries real slots), then every name already stored on a build, with the slot its attachmentSlots recorded. Pure, so the seed script's dry run and its test agree.
function seedItems(json, loadouts) {
    const items = new Map();
    const put = (it) => { const k = `${it.kind}|${it.key}`; if (!items.has(k)) items.set(k, it); };
    for (const w of json?.weapons || []) {
        const name = NAME_FIXES[w.name] || w.name;
        put({ kind: 'weapon', name, key: normKey(name), category: CATEGORY_KEYS[w.category] || null, dmzOnly: w.mode === 'DMZ', source: 'screenshot' });
    }
    for (const [slot, group] of Object.entries(json?.attachments || {})) {
        for (const a of group.general || []) put({ kind: 'attachment', name: a, key: normKey(a), slot, weapons: [], source: 'screenshot' });
        for (const [weapon, list] of Object.entries(group.byWeapon || {})) {
            for (const a of list) {
                const k = `attachment|${normKey(a)}`;
                if (items.has(k)) { const it = items.get(k); if (it.weapons.length) it.weapons.push(normKey(weapon)); continue; }
                put({ kind: 'attachment', name: a, key: normKey(a), slot, weapons: [normKey(weapon)], source: 'screenshot' });
            }
        }
    }
    for (const l of loadouts || []) {
        if (l.weaponName) put({ kind: 'weapon', name: l.weaponName, key: normKey(l.weaponName), category: l.category || null, dmzOnly: false, source: 'stored' });
        (l.attachments || []).forEach((a, i) => {
            if (!a || isPlaceholderName(a)) return;
            const k = `attachment|${normKey(a)}`;
            const slot = (l.attachmentSlots || [])[i] || null;
            const have = items.get(k);
            if (have) { if (!have.slot && slot) have.slot = slot; return; }
            put({ kind: 'attachment', name: a, key: normKey(a), slot, weapons: [], source: 'stored' });
        });
    }
    const ruled = new Map(Object.entries(RULED_SLOTS).map(([k, v]) => [normKey(k), v]));
    for (const it of items.values()) if (it.kind === 'attachment' && !it.slot && ruled.has(it.key)) it.slot = ruled.get(it.key);
    return [...items.values()];
}

let cache = null;
let loadedAt = 0;
const CACHE_MS = 60_000;

async function getCatalogueIndex() {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) return null;
    if (cache && Date.now() - loadedAt < CACHE_MS) return cache;
    try {
        const items = await require('../models/CatalogueItem').find({}).lean();
        cache = buildIndex(items);
        loadedAt = Date.now();
    } catch (err) {
        console.error('Catalogue could not be read, so no name is checked this time:', err?.message || err);
    }
    return cache;
}
function invalidateCatalogue() { cache = null; }
async function findUnknownNames(build) { return unknownNames(await getCatalogueIndex(), build); }
async function slotsFor(attachments) { return slotsFromIndex(await getCatalogueIndex(), attachments); }

module.exports = { normKey, CATEGORY_KEYS, NAME_FIXES, RULED_SLOTS, buildIndex, unknownNames, slotsFromIndex, learnItems, describeUnknown, seedItems, getCatalogueIndex, invalidateCatalogue, findUnknownNames, slotsFor };
