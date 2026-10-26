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
console.log('✓ loadoutRender snapshot');
