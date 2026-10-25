const assert = require('assert');
const { buildLoadoutCard } = require('../utils/loadoutRender');
const fixture = [{ weaponKey: 'ak117', weaponName: 'AK117', category: 'AR', mode: 'MP',
    buildName: 'Standard', attachments: ['A', 'B'], imageKey: 'K', description: '',
    shareCode: 'CODE', isMeta: false, isToxic: false, categoryRank: null, lastUpdated: new Date(0) }];

// 1. A NORMAL card (no `browse`) must keep emitting mp-prefixed, weapon-scoped ids.
const normal = buildLoadoutCard(fixture, 0, { color: 1, idPrefix: 'mp', isEphemeral: false, categoryBuilds: null });
const ids = JSON.stringify(normal).match(/"custom_id":"[^"]+"/g) || [];
assert.ok(ids.some(i => i.includes('mpcopy_ak117_0')), 'normal card lost its mp copy id');
// Only the scope-free gsb~ controls (the bottom row's Search..., the class dropdown) may sit on a normal card; anything scope-paged would resolve against the wrong list.
assert.ok(!/gsb~(?!search~|class~)/.test(JSON.stringify(normal)), 'normal card must never emit a scope-paged gsb~ id');

// 2. A BROWSE card pages across the scope, not within the weapon.
const browsed = buildLoadoutCard(fixture, 0, { color: 1, idPrefix: 'mp', isEphemeral: false,
    categoryBuilds: null, browse: { scopeToken: 'MP.AR.std', flatIndex: 6, flatTotal: 35, scopeLabel: 'AR' } });
const bs = JSON.stringify(browsed);
assert.ok(bs.includes('gsb~next~MP.AR.std~6'), 'browse card missing scope-paged next id');
assert.ok(bs.includes('"7 / 35"'), 'browse card indicator must show FLAT position');
// Scope-aware copy ids (v3-pre-release review, finding #1) -- a browse card's `index` is relative to the FILTERED/RE-SORTED scope subset, not to the unscoped Loadout.find handlers/loadouts.js's legacy mp/dmz branch queries. Reusing the weapon-scoped `mpcopy_ak117_0` id on a browse card was the bug itself: the handler resolved that index against a different, unfiltered list, so Copy Code could hand back a DIFFERENT build's share code than the card on screen.
assert.ok(bs.includes('gsb~copy~MP.AR.std~6'), 'browse card missing scope-paged copy id');
// Copy Attachments left the MP card (Harkirat, 2026-10-25 16:25 EDT); DMZ keeps it (below).
assert.ok(!bs.includes('gsb~copyatt~'), 'an MP card has no Copy Attachments');
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
assert.ok(card.includes('"Build 2 of 2"'), 'one weapon: the pager says Build 2 of 2');
assert.ok(!card.includes('• Build 2 of 2'), 'one weapon: the footer drops the build the pager already shows');
const single = JSON.stringify(R.buildLoadoutCard([slotted], 0, { color: 1, idPrefix: 'mp' }));
assert.ok(single.includes('Build 1 of 1'), 'a one-build card has no pager, so its footer keeps Build 1 of 1');
const metaCard = JSON.stringify(R.buildLoadoutCard(two, 0, { color: 1, idPrefix: 'mp', categoryBuilds: [{ ...ar[2], categoryRank: 'top3', isToxic: true }, { ...ar[2], weaponKey: 'ffar', weaponName: 'FFAR 1', categoryRank: null }],
    browse: { scopeToken: 'MP.*.meta', flatIndex: 0, flatTotal: 1, scopeLabel: 'Meta — MP' } }));
assert.ok(metaCard.includes('"AR · Top 3 · 1 build"'), 'the META list names the class, drops Meta and never says Toxic');
assert.ok(card.indexOf('Muzzle') < card.indexOf('Grip') && card.indexOf('Grip') < card.indexOf('Ammo'), 'the card lists attachments in slot order');
const opts = JSON.parse(card).components.find(c => c.type === 1 && c.components[0].custom_id === 'mpbrowse').components[0].options;
assert.strictEqual(opts[0].value, '~search~', 'Search is the first option');
assert.ok(!opts.some(o => o.value === 'pharo'), 'a Coming Soon placeholder is never listed');
assert.ok(opts.some(o => o.value === 'bp50' && o.description === 'Meta · Best AR · 1 build'), 'an option carries its badges and build count');
assert.ok(!opts.some(o => o.default), 'nothing is pre-selected');
const browseAll = JSON.stringify(R.buildLoadoutCard(two, 0, { color: 1, idPrefix: 'mp', categoryBuilds: ar.slice(0, 3),
    browse: { scopeToken: 'MP.*.std', flatIndex: 2, flatTotal: 3, scopeLabel: 'All MP builds' } }));
assert.ok(browseAll.includes('"AR · 3/3"'), 'a browse pager names the class and the place in it');
assert.ok(R.isPlaceholderBuild(ar[3]) && !R.isPlaceholderBuild(ar[0]), 'placeholder detection');
const noImg = JSON.stringify(R.buildLoadoutCard([{ ...fixture[0], imageKey: 'https://placehold.co/1x1?text=Coming+Soon' }], 0, { color: 1, idPrefix: 'mp' }));
assert.ok(noImg.includes('*No screenshot of this build yet.*') && !noImg.includes('"type":12'), 'a placeholder image is replaced by one line');
const missing = JSON.stringify(R.buildMissingWeaponCard({ weaponName: 'PHARO', category: 'AR', categoryBuilds: ar }));
assert.ok(missing.includes('No build yet') && missing.includes('gsb~open~MP.AR.std'), 'the missing-weapon card says so and opens the class');
// His /gunsmith review (Harkirat, 2026-10-25 15:33-16:40 EDT).
{
    const parsed = R.buildLoadoutCard([slotted], 0, { color: 1, idPrefix: 'mp', categoryBuilds: ar, missing: [{ name: 'AK-47', key: 'ak47', category: 'AR' }] });
    const box = parsed.components[0].components;
    const text = box.filter(c => c.type === 10).map(c => c.content).join('\n');
    assert.ok(text.includes('1. `Muzzle`') && text.includes('3. `Ammo`'), 'attachments are numbered');
    assert.ok(text.includes('### Gunsmith Code: `CODE`'), 'the code sits on its heading line');
    assert.ok(box[1].type === 14 && box[1].divider, 'the divider under the title stays');
    const img = box.findIndex(c => c.type === 12);
    assert.ok(box[img - 1].type === 14 && !box[img - 1].divider, 'a small space, no line, above the image');
    assert.ok(box[img + 1].type === 10 && /^-# AR/.test(box[img + 1].content), 'the footer sits right under the image');
    const last = box[box.length - 1], beforeLast = box[box.length - 2];
    assert.deepStrictEqual(last.components.map(b => b.label), ['Search...', 'Copy Code'], 'the bottom row is Search... then Copy Code');
    assert.ok(beforeLast.type === 14 && beforeLast.divider && beforeLast.spacing === 2, 'a LARGE divider above the bottom row');
    assert.ok(!JSON.stringify(parsed).includes('"Copy Attachments"'), 'no Copy Attachments on MP');
    const selects = parsed.components.filter(c => c.type === 1 && c.components[0].type === 3).map(c => c.components[0]);
    assert.strictEqual(selects[0].placeholder, 'Switch class...');
    assert.strictEqual(selects[0].options.find(o => o.default).value, 'AR', 'the open class is picked');
    assert.strictEqual(selects[0].options.find(o => o.value === 'AR').description, 'View all AR gunsmiths');
    assert.strictEqual(selects[1].placeholder, 'Browse other Assault Rifles...');
    assert.deepStrictEqual([selects[1].options[0].label, selects[1].options[0].description], ['Or search all weapons...', 'Pick this to open a custom search for any weapon']);
    assert.deepStrictEqual(selects[1].options[selects[1].options.length - 1], { label: '1 more with no build yet...', value: '~nobuild~AR', description: 'Show the Assault Rifles Dioreo has no build for' });
    const pagerAt = R.buildLoadoutCard(two, 0, { color: 1, idPrefix: 'mp', categoryBuilds: ar }).components[0].components;
    const pi = pagerAt.findIndex(c => c.type === 1 && /prev/.test(c.components[0].custom_id));
    assert.ok(pagerAt[pi - 1].type === 14 && !pagerAt[pi - 1].divider && pagerAt[pi + 1].spacing === 2, 'a small space, the pager, then the large divider');
    const dmz = { ...fixture[0], mode: 'DMZ', weaponKey: 'fennec', weaponName: 'FENNEC', category: 'SMG' };
    const dmzCard = R.buildLoadoutCard([dmz], 0, { color: 1, idPrefix: 'dmz', categoryBuilds: [dmz, { ...dmz, weaponKey: 'asval', weaponName: 'AS VAL', category: 'AR', isMeta: true }] });
    const dmzBox = dmzCard.components[0].components;
    assert.deepStrictEqual(dmzBox[dmzBox.length - 1].components.map(b => b.label), ['Search...', 'Copy Attachments'], 'DMZ: Search... then Copy Attachments');
    const dmzSel = dmzCard.components.filter(c => c.type === 1 && c.components[0].type === 3).map(c => c.components[0]);
    assert.strictEqual(dmzSel.length, 1, 'DMZ has one dropdown, no class switch');
    assert.deepStrictEqual(dmzSel[0].options.map(o => [o.label, o.description]), [['AS VAL', 'AR · Meta'], ['FENNEC', 'SMG']]);
    const metaSel = JSON.parse(metaCard).components.filter(c => c.type === 1 && c.components[0].type === 3);
    assert.ok(metaSel.length === 1 && metaSel[0].components[0].placeholder === 'Jump to a specific weapon...', 'META: one jump dropdown');
    const nb = JSON.stringify(R.buildMissingWeaponCard({ weaponName: 'AK-47', category: 'AR', categoryBuilds: ar, missing: [{ name: 'AK-47' }, { name: 'ASM10' }], nb: { index: 0, total: 2 } }));
    assert.ok(nb.includes('No build yet · 1/2') && nb.includes('gsb~nb~AR~1') && nb.includes('"Submit a Build"') && nb.includes('gsb~submit~MP~ak47'), 'the no-build card pages and offers Submit a Build');
    const credited = JSON.stringify(R.buildLoadoutCard([{ ...slotted, submittedBy: { discordId: '42', credited: true } }], 0, { color: 1, idPrefix: 'mp' }));
    const anon = JSON.stringify(R.buildLoadoutCard([{ ...slotted, submittedBy: { discordId: '42', credited: false } }], 0, { color: 1, idPrefix: 'mp' }));
    assert.ok(credited.includes('• Submitted by <@42>') && anon.includes('• Submitted by *anonymous*') && !anon.includes('<@42>'), 'the footer credits the submitter, or says anonymous');
}
console.log('✓ loadoutRender snapshot');
