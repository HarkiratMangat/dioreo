const assert = require('assert');
const { buildLoadoutCard } = require('../utils/loadoutRender');
const fixture = [{ weaponKey: 'ak117', weaponName: 'AK117', category: 'AR', mode: 'MP',
    buildName: 'Standard', attachments: ['A', 'B'], imageKey: 'K', description: '',
    shareCode: 'CODE', isMeta: false, isToxic: false, categoryRank: null, lastUpdated: new Date(0) }];

// 1. A NORMAL card (no `browse`) must keep emitting mp-prefixed, weapon-scoped ids.
const normal = buildLoadoutCard(fixture, 0, { color: 1, idPrefix: 'mp', isEphemeral: false, categoryBuilds: null });
const ids = JSON.stringify(normal).match(/"custom_id":"[^"]+"/g) || [];
assert.ok(ids.some(i => i.includes('mpcopy_ak117_0')), 'normal card lost its mp copy id');
assert.ok(!JSON.stringify(normal).includes('gsb~'), 'normal card must never emit a gsb~ id');

// 2. A BROWSE card pages across the scope, not within the weapon.
const browsed = buildLoadoutCard(fixture, 0, { color: 1, idPrefix: 'mp', isEphemeral: false,
    categoryBuilds: null, browse: { scopeToken: 'MP.AR.std', flatIndex: 6, flatTotal: 35, scopeLabel: 'AR' } });
const bs = JSON.stringify(browsed);
assert.ok(bs.includes('gsb~next~MP.AR.std~6'), 'browse card missing scope-paged next id');
assert.ok(bs.includes('"7 / 35"'), 'browse card indicator must show FLAT position');
// Scope-aware copy ids (v3-pre-release review, finding #1) -- a browse card's `index` is relative to the FILTERED/RE-SORTED scope subset, not to the unscoped Loadout.find handlers/loadouts.js's legacy mp/dmz branch queries. Reusing the weapon-scoped `mpcopy_ak117_0` id on a browse card was the bug itself: the handler resolved that index against a different, unfiltered list, so Copy Code could hand back a DIFFERENT build's share code than the card on screen.
assert.ok(bs.includes('gsb~copy~MP.AR.std~6'), 'browse card missing scope-paged copy id');
assert.ok(bs.includes('gsb~copyatt~MP.AR.std~6'), 'browse card missing scope-paged copyatt id');
assert.ok(!bs.includes('mpcopy_ak117_0'), 'browse card must NOT emit the weapon-scoped copy id -- handlers/loadouts.js resolves it against the wrong list');

// 3. hideBadges suppresses the badge line without touching anything else.
const meta = [{ ...fixture[0], isMeta: true }];
assert.ok(JSON.stringify(buildLoadoutCard(meta, 0, { color: 1, idPrefix: 'mp' })).includes('Meta'));
assert.ok(!JSON.stringify(buildLoadoutCard(meta, 0, { color: 1, idPrefix: 'mp', hideBadges: true })).includes('Meta'));

// 4. His /gunsmith list (Harkirat, 2026-10-24 09:45 EDT).
const R = require('../utils/loadoutRender');
const slotted = { ...fixture[0], attachments: ['Grip', 'Ammo', 'Muzzle'], attachmentSlots: ['Rear Grip', 'Ammunition', 'Muzzle'] };
assert.deepStrictEqual(R.orderedAttachments(slotted), ['Muzzle', 'Grip', 'Ammo'], 'attachments follow his slot order: Muzzle, then Rear Grip before Ammunition');
const two = [slotted, { ...slotted, buildName: 'Second' }];
const ar = [...two, { ...fixture[0], weaponKey: 'bp50', weaponName: 'BP50', isMeta: true, categoryRank: 'best' },
    { ...fixture[0], weaponKey: 'pharo', weaponName: 'PHARO', attachments: ['Coming soon — check back later!'] }];
const card = JSON.stringify(R.buildLoadoutCard(two, 1, { color: 1, idPrefix: 'mp', categoryBuilds: ar }));
assert.ok(card.includes('"Build 2/2"'), 'one weapon: the pager says Build 2/2');
assert.ok(!card.includes('Build 2 of 2'), 'one weapon: the footer drops the build the pager already shows');
assert.ok(card.indexOf('Muzzle') < card.indexOf('Grip') && card.indexOf('Grip') < card.indexOf('Ammo'), 'the card lists attachments in slot order');
const opts = JSON.parse(card).components.find(c => c.type === 1 && c.components[0].type === 3).components[0].options;
assert.strictEqual(opts[0].value, '~search~', 'Search is the first option');
assert.ok(!opts.some(o => o.value === 'pharo'), 'a Coming Soon placeholder is never listed');
assert.ok(opts.some(o => o.value === 'bp50' && o.description === 'Meta · Best AR · 1 build'), 'an option carries its badges and build count');
assert.ok(!opts.some(o => o.default), 'nothing is pre-selected');
const browseAll = JSON.stringify(R.buildLoadoutCard(two, 0, { color: 1, idPrefix: 'mp', categoryBuilds: ar.slice(0, 3),
    browse: { scopeToken: 'MP.*.std', flatIndex: 2, flatTotal: 3, scopeLabel: 'All MP builds' } }));
assert.ok(browseAll.includes('"AR · 3/3"'), 'a browse pager names the class and the place in it');
assert.ok(R.isPlaceholderBuild(ar[3]) && !R.isPlaceholderBuild(ar[0]), 'placeholder detection');
const noImg = JSON.stringify(R.buildLoadoutCard([{ ...fixture[0], imageKey: 'https://placehold.co/1x1?text=Coming+Soon' }], 0, { color: 1, idPrefix: 'mp' }));
assert.ok(noImg.includes('No screenshot of this build yet.') && !noImg.includes('"type":12'), 'a placeholder image is replaced by one line');
const missing = JSON.stringify(R.buildMissingWeaponCard({ weaponName: 'PHARO', category: 'AR', categoryBuilds: ar }));
assert.ok(missing.includes('No build yet') && missing.includes('gsb~open~MP.AR.std'), 'the missing-weapon card says so and opens the class');
console.log('✓ loadoutRender snapshot');
