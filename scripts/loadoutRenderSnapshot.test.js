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

// 2. A BROWSE card: the arrows walk WEAPONS and a row of numbers walks the open weapon's builds (Harkirat, 2026-10-25 18:48-19:02 EDT).
const scopeList = [{ ...fixture[0], buildName: 'A' }, { ...fixture[0], buildName: 'B' }, { ...fixture[0], weaponKey: 'bp50', weaponName: 'BP50' }, { ...fixture[0], weaponKey: 'm4', weaponName: 'M4' }];
const browsed = buildLoadoutCard(scopeList.slice(0, 2), 1, { color: 1, idPrefix: 'mp', isEphemeral: false,
    categoryBuilds: scopeList, browse: { scopeToken: 'MP.AR.std', flatIndex: 1, flatTotal: 4, scopeLabel: 'AR' } });
const bs = JSON.stringify(browsed);
assert.ok(bs.includes('gsb~next~MP.AR.std~1'), 'browse card missing scope-paged next id');
assert.ok(bs.includes('"AR · 1/3"'), 'the pager names the class and the WEAPON\'s place in it (3 weapons, not 4 builds)');
{
    const box = browsed.components[0].components;
    const row = box.find(c => c.type === 1 && c.components.some(b => (b.custom_id || '').startsWith('gsb~at~')));
    assert.deepStrictEqual(row.components.map(b => [b.label || b.emoji?.name, b.style, Boolean(b.disabled), b.custom_id]), [['Number1', 2, false, 'gsb~at~MP.AR.std~0'], ['Build 2', 3, true, 'gsb~at~MP.AR.std~1']], 'the build row: his Number icons, the open one green and named in text (2026-10-25 22:46 EDT)');
    const ri = box.indexOf(row);
    assert.ok(box[ri + 1].type === 14 && box[ri + 1].divider && box[ri + 1].spacing === 2 && /prev/.test(box[ri + 2].components[0].custom_id), 'the build row, a large divider, then the arrows');
    assert.ok(/^-# Updated/.test(box[ri - 1].content), 'the footer drops the class (the pager names it) and the build count (the row shows it)');
    assert.deepStrictEqual(browsed.components[1].components.map(b => b.label), ['Search', 'Attachments', 'Code'], 'Search, Attachments and Code sit outside the card, right under it');
    const one = JSON.stringify(buildLoadoutCard([scopeList[3]], 0, { color: 1, idPrefix: 'mp', categoryBuilds: scopeList, browse: { scopeToken: 'MP.AR.std', flatIndex: 3, flatTotal: 4 } }));
    assert.ok(!one.includes('gsb~at~') && one.includes('"AR · 3/3"'), 'a weapon with one build has no build row');
}
// Scope-aware copy ids (v3-pre-release review, finding #1) -- a browse card's `index` is relative to the FILTERED/RE-SORTED scope subset, not to the unscoped Loadout.find handlers/loadouts.js's legacy mp/dmz branch queries. Reusing the weapon-scoped `mpcopy_ak117_0` id on a browse card was the bug itself: the handler resolved that index against a different, unfiltered list, so Copy Code could hand back a DIFFERENT build's share code than the card on screen.
assert.ok(bs.includes('gsb~copy~MP.AR.std~1'), 'browse card missing scope-paged copy id');
// Copy Attachments left the MP card (Harkirat, 2026-10-25 16:25 EDT) and came back as Attachments (23:17 EDT).
assert.ok(bs.includes('gsb~copyatt~'), 'Attachments is back on the MP card (Harkirat, 2026-10-25 23:17 EDT)');
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
assert.ok(card.includes('mpat_ak117_0') && card.includes('"Build 2"') && !card.includes('Build 2 of 2'), 'a card with no class to walk keeps the build row, legacy ids, and no build count');
assert.ok(!card.includes('mpprev_'), 'a card with no class to walk has no arrows');
const single = JSON.stringify(R.buildLoadoutCard([slotted], 0, { color: 1, idPrefix: 'mp' }));
assert.ok(!single.includes('Build 1 of 1') && single.includes('-# AR • Updated'), 'a one-build card: no build count, and the class stays in the footer when no pager names it');
const metaCard = JSON.stringify(R.buildLoadoutCard(two, 0, { color: 1, idPrefix: 'mp', categoryBuilds: [{ ...ar[2], categoryRank: 'top3', isToxic: true }, { ...ar[2], weaponKey: 'ffar', weaponName: 'FFAR 1', categoryRank: null }],
    browse: { scopeToken: 'MP.*.meta', flatIndex: 0, flatTotal: 1, scopeLabel: 'Meta — MP' } }));
assert.ok(metaCard.includes('"AR · Top 3 · Toxic · 1 build"'), 'the META list names the class, drops Meta, and says Toxic (his 2026-10-25 23:32 EDT call: a Toxic-only Meta weapon showed no reason)');
assert.ok(card.indexOf('Muzzle') < card.indexOf('Grip') && card.indexOf('Grip') < card.indexOf('Ammo'), 'the card lists attachments in slot order');
const opts = JSON.parse(card).components.find(c => c.type === 1 && c.components[0].custom_id === 'mpbrowse').components[0].options;
assert.ok(!opts.some(o => o.value === '~search~'), 'no search option: the Search button does that (2026-10-25 23:19 EDT)');
assert.ok(!opts.some(o => o.value === 'pharo'), 'a Coming Soon placeholder is never listed');
assert.ok(opts.some(o => o.value === 'bp50' && o.description === 'Meta · Best AR · 1 build'), 'an option carries its badges and build count');
assert.ok(!opts.some(o => o.default), 'nothing is pre-selected');
const browseAll = JSON.stringify(R.buildLoadoutCard(two, 0, { color: 1, idPrefix: 'mp', categoryBuilds: ar.slice(0, 3),
    browse: { scopeToken: 'MP.*.std', flatIndex: 2, flatTotal: 3, scopeLabel: 'All MP builds' } }));
assert.ok(browseAll.includes('"AR · 2/2"'), 'a browse pager names the class and the weapon\'s place in it');
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
    assert.deepStrictEqual(parsed.components[1].components.map(b => b.label), ['Search', 'Attachments', 'Code'], 'Search, Attachments, Code, outside the card');
    assert.strictEqual(box[box.length - 1].type, 10, 'with no build row and no pager the card ends at the footer, no trailing divider');
    assert.ok(!JSON.stringify(parsed).includes('"Copy Attachments"') && !JSON.stringify(parsed).includes('"Search..."'), 'the old labels are gone');
    const selects = parsed.components.filter(c => c.type === 1 && c.components[0].type === 3).map(c => c.components[0]);
    assert.strictEqual(selects[0].placeholder, 'Switch class...');
    assert.strictEqual(selects[0].options.find(o => o.default).value, 'AR', 'the open class is picked');
    assert.strictEqual(selects[0].options.find(o => o.value === 'AR').description, 'View all AR gunsmiths');
    assert.strictEqual(selects[1].placeholder, 'Browse other Assault Rifles...');
    assert.ok(!selects[1].options.some(o => o.value === '~search~'), 'no search option in the dropdown: the Search button does that (2026-10-25 23:19 EDT)');
    assert.deepStrictEqual(selects[1].options[selects[1].options.length - 1], { label: '1 more with no build yet...', value: '~nobuild~AR', description: 'Show the Assault Rifles Dioreo has no build for' });
    const dmz = { ...fixture[0], mode: 'DMZ', weaponKey: 'fennec', weaponName: 'FENNEC', category: 'SMG' };
    const dmzCard = R.buildLoadoutCard([dmz], 0, { color: 1, idPrefix: 'dmz', categoryBuilds: [dmz, { ...dmz, weaponKey: 'asval', weaponName: 'AS VAL', category: 'AR', isMeta: true }] });
    assert.deepStrictEqual(dmzCard.components[1].components.map(b => b.label), ['Search', 'Attachments'], 'DMZ: Search then Attachments (no code)');
    const dmzSel = dmzCard.components.filter(c => c.type === 1 && c.components[0].type === 3).map(c => c.components[0]);
    assert.strictEqual(dmzSel.length, 1, 'DMZ has one dropdown, no class switch');
    // Grouped by class, each with the MP lists' line (2026-10-25 23:45 EDT, his catch).
    assert.deepStrictEqual(dmzSel[0].options.map(o => [o.label, o.description]), [['AS VAL', 'AR · Meta · 1 build'], ['FENNEC', 'SMG · 1 build']]);
    const metaSel = JSON.parse(metaCard).components.filter(c => c.type === 1 && c.components[0].type === 3);
    assert.ok(metaSel.length === 1 && metaSel[0].components[0].placeholder === 'Jump to another META weapon...', 'META: one jump dropdown, naming the Meta list');
    const nb = JSON.stringify(R.buildMissingWeaponCard({ weaponName: 'AK-47', category: 'AR', categoryBuilds: ar, missing: [{ name: 'AK-47' }, { name: 'ASM10' }], nb: { index: 0, total: 2 } }));
    assert.ok(nb.includes('No build yet · 1/2') && nb.includes('gsb~nb~AR~1') && nb.includes('"Submit a Build"') && nb.includes('gsb~submit~MP~ak47'), 'the no-build card pages and offers Submit a Build');
    const credited = JSON.stringify(R.buildLoadoutCard([{ ...slotted, submittedBy: { discordId: '42', credited: true } }], 0, { color: 1, idPrefix: 'mp' }));
    const anon = JSON.stringify(R.buildLoadoutCard([{ ...slotted, submittedBy: { discordId: '42', credited: false } }], 0, { color: 1, idPrefix: 'mp' }));
    assert.ok(credited.includes('• Submitted by <@42>') && anon.includes('• Submitted by *anonymous*') && !anon.includes('<@42>'), 'the footer credits the submitter, or says anonymous');
}
console.log('✓ loadoutRender snapshot');
