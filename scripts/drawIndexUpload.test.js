// scripts/drawIndexUpload.test.js -- the owner's draw index upload (/bot drawindex, 2026-11-16 12:25 EST): the reader's decisions, the review's limits, the save plan, the owner-only routes, and news triage's "is it indexed" lines.
//
// Pure where it can be: no database, no Vertex, no Cloudinary. The known cases are real draws whose truth is in the index (Harkirat's confirmed types from 2026-11-09): Phoenix Mythic Drop is a Mythic Weapon Draw, Lethal Pair two legendary weapons, The Chariot one legendary weapon (Reactive is his call, so it must NOT be preselected).
'use strict';
const assert = require('assert');
const path = require('path');
process.chdir(path.join(__dirname, '..'));

let failed = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); } catch (err) { failed++; console.log(`  ✗ ${name}\n      ${String(err?.message || err).split('\n').join('\n      ')}`); }
}

const R = require('../utils/drawIndexRead');
const U = require('../handlers/manage/drawsPanel/drawIndexUpload');
const IX = require('../handlers/manage/drawsPanel/drawIndex');
const S = require('../utils/newsTriage/indexStatus');

// Each fixture carries its fingerprint, as every real entry does (matchByItems compares `fp`).
const entry = (over) => { const e = { _id: over.slug, slug: over.slug, title: over.title, aliases: [], items: [], priceType: '', tags: [], imageUrl: 'https://res.cloudinary.com/x/image/upload/draws/' + over.slug + '.png', publicId: 'draws/' + over.slug, ...over }; e.fp = require('../utils/cloudinaryCache').drawFingerprint({ items: e.items }); return e; };
const INDEX = [
    entry({ slug: 'lethal-pair-draw', title: 'Lethal Pair Draw', priceType: 'doubleLegendaryWeapons', items: [{ tier: 'legendary', kind: 'weapon', name: 'HBRa3 - Rictus Arc', baseName: 'HBRa3' }, { tier: 'legendary', kind: 'weapon', name: 'QQ9 - Moonlight', baseName: 'QQ9' }] }),
    entry({ slug: 'starry-symphony-draw', title: 'Starry Symphony Draw', aliases: ['Pop Idol Draw'], priceType: 'legendaryCharacterWeapon', items: [{ tier: 'legendary', kind: 'character', name: 'Rosa - Idol', baseName: 'Rosa' }, { tier: 'legendary', kind: 'weapon', name: 'Fennec - Encore', baseName: 'Fennec' }] }),
    entry({ slug: 'undead-legion-series-armory', title: 'Undead Legion Series Armory', items: [{ tier: 'legendary', kind: 'weapon', name: 'MG82 - Revenant Warlords', baseName: 'MG82' }] }),
    entry({ slug: 'ford-mustang-gtd-draw', title: 'Ford Mustang GTD Draw', imageUrl: require('../utils/placeholders').PLACEHOLDER.square, items: [] }),
];
const read = (over = {}) => ({ title: '', items: [], comments: [], printed: { seriesArmory: false, itGoesTwo: false, sevenSpins: false, pickYourReward: false, mythicDrop: false }, draws: 1, notDraw: false, ...over });
const ctx = { entries: INDEX, weaponNames: new Set(['jak12', 'drh', 'qq9', 'mg82']) };

// Every component, at every depth (Discord's 40 counts them all), and every custom_id.
function walk(components, out = { n: 0, ids: [], text: 0 }) {
    for (const c of components || []) {
        out.n++;
        if (c.custom_id) out.ids.push(c.custom_id);
        if (typeof c.content === 'string') out.text += c.content.length;
        if (c.components) walk(c.components, out);
        if (c.accessory) walk([c.accessory], out);
    }
    return out;
}
function limits(view, label) {
    const w = walk(view);
    w.n -= 0;
    assert.ok(w.n <= 40, `${label}: ${w.n} components (max 40)`);
    assert.ok(w.text <= 4000, `${label}: ${w.text} characters (max 4,000)`);
    for (const id of w.ids) assert.ok(id.length <= 100, `${label}: custom_id over 100: ${id}`);
    assert.strictEqual(new Set(w.ids).size, w.ids.length, `${label}: a custom_id repeats`);
}

(async () => {
    console.log('drawIndexUpload');

    await check('the read is shaped field by field: markup and mentions out, a bad tier left blank, duplicates dropped, twelve items at most', () => {
        const r = R.shapeRead({ title: 'Phoenix **Mythic** Drop @everyone', items: [{ name: 'JAK-12 - Rising Ashes', tier: 'mythic', kind: 'weapon' }, { name: 'jak-12 - rising ashes', tier: 'mythic' }, { name: 'Artery - Fire Plume', tier: 'gold', kind: 'character' }, ...Array.from({ length: 20 }, (_, i) => ({ name: `Item ${i}`, tier: 'epic' }))], comments: ['Acquire Both <@123> to Unlock'], printed: { mythicDrop: true }, draws: 1, notDraw: false });
        assert.strictEqual(r.title, 'Phoenix Mythic Drop');
        assert.strictEqual(r.items.length, 12);
        assert.strictEqual(r.items[1].tier, '', 'a tier outside mythic/legendary/epic is blank, never guessed here');
        assert.ok(!r.comments[0].includes('<@'), 'a mention is taken out of a comment');
        assert.strictEqual(r.printed.mythicDrop, true);
    });

    await check('known case: a Mythic Drop poster the index lacks becomes a new Mythic Weapon Draw entry, type settled', () => {
        const d = R.decideDraw(read({ title: 'Phoenix Mythic Drop', items: [{ name: 'JAK-12 - Rising Ashes', tier: 'mythic', kind: 'weapon' }, { name: 'Artery - Fire Plume', tier: 'epic', kind: 'character' }], printed: { mythicDrop: true } }), ctx);
        assert.strictEqual(d.match.status, 'none');
        assert.strictEqual(d.priceType, 'mythicWeapon');
        assert.strictEqual(d.typeSettled, true);
        assert.strictEqual(d.items[0].kind, 'weapon');
    });

    await check('known case: one legendary weapon (The Chariot) is NOT preselected: Reactive or Non-Reactive is his pick', () => {
        const d = R.decideDraw(read({ title: 'The Chariot Draw', items: [{ name: 'DR-H - Charioteer', tier: 'legendary', kind: 'weapon' }, { name: 'Keegan - The Chariot', tier: 'epic', kind: 'character' }] }), ctx);
        assert.strictEqual(d.typeSettled, false);
        assert.strictEqual(d.priceType, '');
    });

    await check('a poster of a draw the index holds updates it (title, another name, or the same items), keeping the entry\'s own type', () => {
        const byTitle = R.decideDraw(read({ title: 'Lethal Pair Draw', items: [{ name: 'QQ9 - Moonlight', tier: 'none' }] }), ctx);
        assert.strictEqual(byTitle.match.status, 'sure');
        assert.strictEqual(byTitle.priceType, 'doubleLegendaryWeapons');
        assert.strictEqual(byTitle.items[0].tier, 'legendary', 'the index\'s tier fills a frame the poster did not draw');
        const byAlias = R.decideDraw(read({ title: 'Pop Idol Draw', items: [] }), ctx);
        assert.strictEqual(byAlias.match.title, 'Starry Symphony Draw');
        const byItems = R.decideDraw(read({ title: '', items: [{ name: 'HBRa3 - Rictus Arc', tier: 'legendary' }, { name: 'QQ9 - Moonlight', tier: 'legendary' }] }), ctx);
        assert.strictEqual(byItems.match.status, 'sure', 'the same items at the same rarities');
    });

    await check('a weapon one letter off ONE known base is snapped (MG42 -> MG82), and an unknown far name is left alone', () => {
        const known = R.knownNames(INDEX);
        assert.deepStrictEqual(R.snapName('MG42 - Revenant Warlords', known), { name: 'MG82 - Revenant Warlords', snapped: true });
        assert.strictEqual(R.snapName('Kilo Bolt-Action - Fresh', known).snapped, false);
    });

    await check('the draw type rules: armory, It Goes Two, character + weapon, two epics', () => {
        const it = (tier, kind) => ({ tier, kind, name: `${tier} ${kind} ${Math.random()}` });
        assert.strictEqual(R.typeByRule([it('mythic', 'weapon')], { seriesArmory: true }).type, 'armoryMythicWeapon');
        assert.strictEqual(R.typeByRule([it('legendary', 'character'), it('legendary', 'character')], { itGoesTwo: true }).type, 'advancedCharacter');
        assert.strictEqual(R.typeByRule([it('legendary', 'character'), it('legendary', 'weapon')], {}).type, 'legendaryCharacterWeapon');
        assert.strictEqual(R.typeByRule([it('epic', 'character'), it('epic', 'character')], {}).type, 'doubleEpicCharacters');
        assert.strictEqual(R.typeByRule([it('legendary', 'weapon')], { sevenSpins: true }).type, 'sevenSpinLegendaryWeapon');
        assert.strictEqual(R.typeByRule([], {}).settled, false);
    });

    await check('an update only ADDS items: a shorter poster never drops what the index holds, and its tiers win', () => {
        const { items, added } = R.unionItems(INDEX[0].items, [{ tier: 'epic', name: 'QQ9 - Moonlight' }, { tier: 'epic', name: 'Rook - Night' }]);
        assert.strictEqual(items.length, 3);
        assert.strictEqual(added.length, 1);
        assert.strictEqual(items.find(i => i.name === 'QQ9 - Moonlight').tier, 'legendary');
    });

    await check('two pictures of one draw in one upload: the second is the same draw, skipped', () => {
        const pics = U.markSameDraws([{ status: 'read', title: 'Phoenix Mythic Drop', matchStatus: 'none' }, { status: 'read', title: 'Phoenix Mythic Drop', matchStatus: 'none' }, { status: 'read', title: 'Other', matchStatus: 'sure', matchId: 'x' }, { status: 'read', title: 'Other 2', matchStatus: 'sure', matchId: 'x' }]);
        assert.strictEqual(pics[1].sameAs, 0); assert.strictEqual(pics[1].skip, true);
        assert.strictEqual(pics[3].sameAs, 2);
        assert.ok(!pics[0].skip && !pics[2].skip);
    });

    await check('what blocks a save: a missing type, an unanswered "Same draw as X?", no title, no items; a skipped picture blocks nothing', () => {
        assert.deepStrictEqual(U.blockers({ status: 'read', title: 'A', items: [{}], priceType: 'mythicWeapon', matchStatus: 'none' }), []);
        assert.ok(U.blockers({ status: 'read', title: 'A', items: [{}], priceType: '', matchStatus: 'none' }).includes('a draw type'));
        assert.ok(U.blockers({ status: 'read', title: 'A', items: [{}], priceType: 'x', matchStatus: 'maybe', matchTitle: 'B', sameDraw: null })[0].startsWith('an answer'));
        assert.deepStrictEqual(U.blockers({ status: 'read', skip: true, title: '', items: [], priceType: '' }), []);
    });

    await check('the Edit box\'s items round-trip exactly: names as typed (HBRa3, DL Q33), full rarity words, kinds in brackets', () => {
        const items = [{ tier: 'mythic', kind: 'weapon', name: 'DL Q33 - Arcane' }, { tier: 'legendary', kind: '', name: 'HBRa3 - Rictus Arc' }, { tier: 'epic', kind: 'character', name: 'Rosa - Idol' }];
        const back = U.parseItemsText(U.itemsToText(items));
        assert.deepStrictEqual(back.errors, []);
        assert.deepStrictEqual(back.items.map(i => [i.tier, i.kind, i.name]), items.map(i => [i.tier, i.kind, i.name]));
        assert.ok(U.itemsToText(items).startsWith('Mythic '), 'a full word, never a tier letter (Legacy once saved as Legendary)');
        assert.deepStrictEqual(U.parseItemsText('QQ9 - Moonlight').errors, ['QQ9 - Moonlight'], 'a line with no rarity is refused, not guessed');
    });

    await check('a season typed in the pop-up: "Season 10", "s10" and "10" read; anything else is refused', () => {
        assert.strictEqual(U.seasonOf('Season 10').season, 10);
        assert.strictEqual(U.seasonOf('s10').season, 10);
        assert.strictEqual(U.seasonOf('').season, null);
        assert.ok(U.seasonOf('next one').error);
        const doc = { currentSeasonTitle: 'Season 10 — Nightfall', bpStart: '2026-11-12T00:00:00Z', draft: { currentSeasonTitle: 'Season 1 — Dawn', bpStart: '2027-01-14T00:00:00Z' } };
        assert.strictEqual(R.seasonYearFor(1, doc), 2027, 'the draft\'s season takes the draft\'s year');
    });

    await check('a replaced picture re-points only staged or live draws of this entry on a placeholder, an empty picture or its old link', () => {
        const ph = require('../utils/placeholders').PLACEHOLDER.square;
        const e = INDEX[3];
        const doc = { newDraws: [{ _id: 'a', title: 'Ford Mustang GTD Draw', thumbnailUrl: ph }, { _id: 'b', title: 'Other Draw', thumbnailUrl: ph }], returningDraws: [], draft: { newDraws: [{ _id: 'c', title: 'Ford Mustang GTD Draw', thumbnailUrl: 'https://cdn.example/own-art.png' }], returningDraws: [] } };
        const rows = U.rowsToRepoint(doc, e, 'https://res.cloudinary.com/x/new.png');
        assert.deepStrictEqual(rows.map(r => [r.path, r.id]), [['newDraws', 'a']], 'another draw, and a row with its own art, are left alone');
    });

    await check('the review stays inside Discord\'s limits at 1, 2 and 10 pictures, long titles, twelve items, a failed read and a maybe', () => {
        const longItem = (i) => ({ tier: ['mythic', 'legendary', 'epic'][i % 3], kind: i % 2 ? 'weapon' : '', name: `Very Long Weapon Name ${i} - An Extremely Long Skin Name That Goes On And On`, guessed: i % 4 === 0, newToIndex: true });
        const pic = (i, over = {}) => ({ url: `https://cdn.discordapp.com/attachments/1/2/p${i}.png`, filename: `p${i}.png`, status: 'read', title: 'A'.repeat(90), items: Array.from({ length: 12 }, (_, k) => longItem(k)), comments: ['Acquire Both To Unlock '.repeat(5)], aliases: ['Other Name'], priceType: '', typeSettled: false, matchStatus: 'none', snapped: ['MG42 → MG82'], flags: [], ...over });
        for (const count of [1, 2, 10]) {
            const pictures = Array.from({ length: count }, (_, i) => pic(i, i === 1 ? { status: 'failed', error: 'timeout' } : i === 2 ? { matchStatus: 'maybe', matchTitle: 'B'.repeat(80), sameDraw: null } : i === 3 ? { matchStatus: 'sure', matchTitle: 'C', priceType: 'mythicWeapon' } : {}));
            const doc = { _id: 'AbCdEfGh', season: 10, year: 2026, pictures, costUsd: 0.02 };
            for (let n = 0; n < count; n++) limits(U.reviewView(doc, n), `${count} pictures, picture ${n + 1}`);
        }
    });

    await check('the Save button is grey and disabled while anything blocks, never a disabled green', () => {
        const doc = { _id: 'tok', pictures: [{ url: 'https://cdn.discordapp.com/x.png', status: 'read', title: 'X', items: [{ tier: 'legendary', name: 'A' }], priceType: '', matchStatus: 'none', flags: [] }] };
        const ids = []; const all = [];
        const find = (cs) => { for (const c of cs || []) { if (c.custom_id) { ids.push(c.custom_id); all.push(c); } if (c.components) find(c.components); } };
        find(U.reviewView(doc, 0));
        const save = all.find(c => /\|ixvsave\|/.test(c.custom_id));
        assert.ok(save.disabled && save.style !== 3, 'blocked: disabled and not green');
        doc.pictures[0].priceType = 'mythicWeapon';
        all.length = 0; find(U.reviewView(doc, 0));
        const ready = all.find(c => /\|ixvsave\|/.test(c.custom_id));
        assert.ok(!ready.disabled && ready.style === 3 && /Save 1/.test(ready.label));
    });

    await check('the owner sees Upload Draws and the card\'s Replace Picture and Delete Entry; an admin sees none of them', () => {
        const ids = (v) => walk(v).ids.join(' ');
        const doc = { newDraws: [], returningDraws: [], draft: {} };
        assert.ok(/ixup/.test(ids(IX.homeView(INDEX, doc, null, { owner: true }))));
        assert.ok(!/ixup/.test(ids(IX.homeView(INDEX, doc, null, { owner: false }))));
        assert.ok(/ixpic/.test(ids(IX.cardView(INDEX[0], doc, '', { owner: true }))) && /ixdel/.test(ids(IX.cardView(INDEX[0], doc, '', { owner: true }))));
        assert.ok(!/ixpic|ixdel/.test(ids(IX.cardView(INDEX[0], doc, '', { owner: false }))));
        limits(IX.homeView(INDEX, doc, 'note', { owner: true }), 'owner home');
        limits(IX.cardView(INDEX[1], doc, 'g:all', { owner: true, header: 'h' }), 'owner card');
        limits(IX.deleteView(INDEX[1], doc, 'g:all'), 'delete confirm');
        const m = IX.editModal(INDEX[0], '', { owner: true });
        assert.ok(m.components.length <= 5, 'a pop-up holds five fields');
        assert.ok(m.components.every(c => !c.description || c.description.length <= 100));
    });

    await check('a non-owner reaches no owner route: every owner verb answers privately and writes nothing', async () => {
        const said = [];
        const ctx2 = { show: async () => { throw new Error('drew a panel'); }, say: async (i, t) => { said.push(t); }, gate: async () => true, getDoc: async () => ({}), createSelection: async () => 't', loadSel: async () => null };
        const interaction = { user: { id: '1' }, showModal: async () => { throw new Error('opened a pop-up'); }, isModalSubmit: () => true, isStringSelectMenu: () => false, fields: { getUploadedFiles: () => new Map(), getTextInputValue: () => '' } };
        for (const verb of ['ixup', 'ixupm', 'ixv', 'ixvsave', 'ixvtype', 'ixvrev', 'ixpic', 'ixpicm', 'ixdel', 'ixdelok']) {
            said.length = 0;
            await IX.route(interaction, verb, 'a', 'b', 'c', ctx2);
            assert.strictEqual(said.length, 1, `${verb}: one private answer`);
            assert.ok(/owner/i.test(said[0]), `${verb}: says it is the owner's`);
        }
    });

    await check('news triage: a draw the index holds, a maybe, and one it lacks, from the read\'s own names and rewards', () => {
        const items = [
            { action: 'draw', name: 'Lethal Pair Draw', rewards: [{ tier: 'legendary', name: 'QQ9 - Moonlight' }, { tier: 'legendary', name: 'Kilo - New' }] },
            { action: 'draw', name: 'Brand New Draw', rewards: [] },
            { action: 'calendar', name: 'Some Event' },
            { kind: 'draw', action: 'info', name: 'Ford Mustang GTD Draw', rewards: [] },
        ];
        const index = S.indexStatusForItems(items, INDEX);
        assert.deepStrictEqual(index.map(x => x.status), ['indexed', 'missing', 'indexed']);
        assert.ok(index[0].needs.some(n => /1 item/.test(n)), 'an item the post lists and the index lacks is named');
        assert.ok(index[2].needs.includes('placeholder picture'));
        const lines = S.indexLines(index, { warn: '!', checkmark: 'v', yellowDotGlow: '?' });
        assert.strictEqual(lines.length, 3);
        assert.strictEqual(S.needsAdding(index).length, 1);
        assert.strictEqual(S.stillMissing([{ index }, { index }], INDEX).length, 1, 'the briefing lists a missing draw once');
    });

    await check('a news card with its draw index lines and Add to Draw Index stays inside Discord\'s limits', () => {
        const card = require('../utils/newsTriage/card');
        const items = Array.from({ length: 8 }, (_, i) => ({ kind: 'draw', action: 'draw', name: `Draw ${i}`, rewards: [{ tier: 'legendary', name: 'X' }], warnings: ['w'], where: 'live', drawType: 'new', start: new Date('2026-11-20T00:00:00Z') }));
        const index = Array.from({ length: 8 }, (_, i) => ({ name: `Draw ${i}`, status: i % 2 ? 'missing' : 'indexed', title: '', needs: ['no draw type'] }));
        const view = card.buildCard({ _id: '0123456789abcdef01234567', sourceName: 'leaks', jumpUrl: 'https://discord.com/channels/1/2/3', postedAt: new Date(), items, index, notes: [], draftChangeId: 'chg', draftLines: ['a'] });
        limits(view, 'news card');
        assert.ok(walk(view).ids.some(id => id.startsWith('news|ixadd|')));
        const brief = card.buildBriefing({ stats: {}, unindexed: Array.from({ length: 12 }, (_, i) => ({ name: `Missing ${i}`, status: 'missing' })), channels: [], fixes: [] });
        assert.ok(JSON.stringify(brief).includes('**Not in the draw index yet** (12)'));
        limits(brief, 'briefing');
    });

    await check('the ops: drawindex.add, update and delete validate and invert into each other', () => {
        require('../core/ops/drawIndex');
        const { resolveOp } = require('../core/ops/index');
        const add = resolveOp('drawindex.add');
        assert.strictEqual(add.validate({ payload: { slug: 's', title: 'T', publicId: 'draws/s', imageUrl: 'u', items: [{ tier: 'legendary', name: 'A' }] } }).ok, true);
        assert.strictEqual(add.validate({ payload: { slug: 's', title: 'T', publicId: 'draws/s', imageUrl: 'u', items: [{ tier: 'legacy', name: 'A' }] } }).ok, false, 'only mythic, legendary and epic');
        assert.deepStrictEqual(add.invert({ applied: { id: 'x' } }), { type: 'drawindex.delete', target: { id: 'x' } });
        const del = resolveOp('drawindex.delete');
        assert.strictEqual(del.invert({ applied: { removed: { _id: 'x', slug: 's' } } }).payload.restore.slug, 's');
        const upd = resolveOp('drawindex.update');
        const v = upd.validate({ target: { id: 'x' }, payload: { set: { title: 'New', bogus: 1 }, rows: [{ path: 'newDraws', id: 'r', from: null, to: 'u' }, { path: 'calendar', id: 'q', to: 'u' }] } });
        assert.ok(v.ok);
        assert.deepStrictEqual(Object.keys(v.normalized.payload.set), ['title'], 'a field outside the list is dropped');
        assert.strictEqual(v.normalized.payload.rows.length, 1, 'only draw lists can be re-pointed');
        const inv = upd.invert({ applied: { id: 'x', prior: { title: 'Old' }, rows: [{ path: 'newDraws', id: 'r', from: 'u', to: '' }] } });
        assert.deepStrictEqual(inv.payload.set, { title: 'Old' });
    });

    await check('add, update and delete refuse anyone but the owner inside apply(), so a Revert by an admin cannot reach them', async () => {
        require('../core/ops/drawIndex');
        const { resolveOp } = require('../core/ops/index');
        for (const type of ['drawindex.add', 'drawindex.update', 'drawindex.delete']) {
            const res = await resolveOp(type).apply({ target: { id: 'x' }, payload: { slug: 's', set: {}, rows: [] } }, { session: null, actorId: '1' });
            assert.strictEqual(res.ok, false, `${type}: refused`);
            assert.ok(/owner/.test(res.reason), `${type}: says why`);
        }
    });

    await check('the logo bar: found and measured on the template, never on dark art or a clean bottom', () => {
        const { bottomBar } = require('../utils/drawPictureBar');
        // A 1080x1350 poster drawn in memory: art (mid grey) everywhere, then optionally an 89-row black bar with a lit strip in its middle where the logos sit.
        const make = ({ bar = 0, logo = true, darkArt = false } = {}) => {
            const width = 1080, height = 1350, data = Buffer.alloc(width * height * 4);
            for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4; const k = height - 1 - y;
                let v = darkArt && k < 200 ? 10 : 90;
                if (k < bar) v = 4;
                if (k < bar && logo && k >= 28 && k <= 56 && x > 420 && x < 660 && (x % 7 === 0)) v = 230;
                data[i] = data[i + 1] = data[i + 2] = v; data[i + 3] = 255;
            }
            return { width, height, data };
        };
        assert.strictEqual(bottomBar(make({ bar: 89 })), 89, 'the bar is found at its real height');
        assert.strictEqual(bottomBar(make({ bar: 89, darkArt: true })), 89, 'dark art above the bar is not cut with it');
        assert.strictEqual(bottomBar(make()), 0, 'a clean bottom has no bar');
        assert.strictEqual(bottomBar(make({ darkArt: true })), 0, 'dark art at the bottom is not a bar');
        assert.strictEqual(bottomBar(make({ bar: 89, logo: false, darkArt: false })), 0, 'a black band with no logos is not the bar');
    });

    await check('the review shows the bar, crops it by default and offers Keep Bottom Bar; the save crops only when on', () => {
        const pic = { url: 'https://cdn.discordapp.com/x.png', status: 'read', title: 'X', items: [{ tier: 'legendary', name: 'A', kind: 'weapon' }], priceType: 'mythicWeapon', matchStatus: 'none', flags: [], barPx: 89, imgWidth: 1080, imgHeight: 1350, cropBar: true };
        const doc = { _id: 'tok', pictures: [pic] };
        const w = walk(U.reviewView(doc, 0));
        assert.ok(w.ids.some(id => /\|ixvbar\|/.test(id)));
        assert.ok(JSON.stringify(U.reviewView(doc, 0)).includes('Logo bar cropped'));
        doc.pictures[0].cropBar = false;
        assert.ok(JSON.stringify(U.reviewView(doc, 0)).includes('Crop Bottom Bar'));
    });

    await check('every pop-up is a shape Discord accepts: each Label holds a component object and a text description of 100 characters at most', () => {
        const pic = { title: 'T', items: [{ tier: 'mythic', kind: 'weapon', name: 'A - B' }], aliases: ['X'] };
        const modals = { upload: U.uploadModal({ origin: 'n', card: 'c'.repeat(24), names: 'A\nB' }), edit: U.editModal(pic, 'tok', 0), replace: U.replaceModal('i'.repeat(24), 'g:all'), entry: IX.editModal(INDEX[0], '', { owner: true }) };
        for (const [name, m] of Object.entries(modals)) {
            assert.ok(m.custom_id.length <= 100, `${name}: custom_id`);
            assert.ok(m.components.length >= 1 && m.components.length <= 5, `${name}: 1-5 fields`);
            for (const c of m.components) {
                assert.strictEqual(c.type, 18, `${name}: a Label`);
                assert.ok(c.component && typeof c.component === 'object' && typeof c.component.type === 'number', `${name}: "${c.label}" holds a component object (Discord refused one holding a string, 2026-11-16 12:58 EST)`);
                assert.ok(c.description === undefined || (typeof c.description === 'string' && c.description.length <= 100), `${name}: "${c.label}" description is text of 100 characters at most`);
            }
        }
    });

    await check('two included pictures of one draw block the save until one is skipped (two adds of one title would fail the whole commit)', () => {
        const pic = (over) => ({ status: 'read', title: 'Augmented Eclipse Draw', items: [{ tier: 'legendary', name: 'A' }], priceType: 'mythicWeapon', matchStatus: 'none', flags: [], ...over });
        const doc = { pictures: [pic({}), pic({ skip: true, sameAs: 0 })] };
        assert.deepStrictEqual(U.blockers(doc.pictures[0], doc), [], 'a skipped duplicate blocks nothing');
        doc.pictures[1].skip = false;
        assert.ok(U.blockers(doc.pictures[1], doc).some(b => b === 'twin:0'), 'Include on the duplicate blocks');
        assert.ok(U.saveLine(doc).includes('pictures 1 and 2 are the same draw: skip one') && !U.saveLine(doc).includes('twin:') && (U.saveLine(doc).match(/same draw/g) || []).length === 1, 'the clash is worded once for the pair');
        const twoTitles = { pictures: [pic({}), pic({ title: 'Pair Lethal Draw' })] };
        assert.ok(U.blockers(twoTitles.pictures[1], twoTitles).length, 'the same items under two new titles are one draw');
        const upd = { pictures: [pic({ matchStatus: 'sure', matchId: 'e1', title: 'Lethal Pair Draw' }), pic({ matchStatus: 'maybe', matchId: 'e1', sameDraw: true, title: 'Pair Lethal Draw' })] };
        assert.ok(U.blockers(upd.pictures[1], upd).length, 'a Same Draw yes onto an entry another picture updates blocks');
    });

    await check('/bot drawindex carries entry (autocomplete), do, show and visibility last, and show: is the panel\'s gap list', () => {
        const sub = require('../commands/bot').data.toJSON().options.find(o => o.name === 'drawindex');
        assert.deepStrictEqual(sub.options.map(o => [o.name, !!o.autocomplete]), [['entry', true], ['do', false], ['show', false], ['visibility', false]]);
        assert.deepStrictEqual(sub.options[1].choices.map(c => c.value), ['upload1', 'upload', 'check']);
        const { GAPS } = require('../handlers/manage/drawsPanel/drawIndex');
        assert.deepStrictEqual(sub.options[2].choices.map(c => [c.value, c.name]), Object.entries(GAPS).map(([v, g]) => [v, g.label]), 'show: must list the GAPS the panel lists');
        assert.deepStrictEqual(sub.options[3].choices.map(c => c.value), ['hidden', 'public']);
        assert.ok(U.uploadModal({ origin: 'P' }).custom_id.includes('|ixupm|P|'), 'a public do:Upload Draws carries P in its pop-up id');
    });

    await check('the result names every picture that was not saved, including the ones the plans never saw', () => {
        const doc = { _id: 't', pictures: [{ status: 'read', title: 'A' }, { status: 'failed', error: 'That file is not a picture.' }, { status: 'read', skip: true, sameAs: 0 }, { status: 'read', skip: true, flags: ['notDraw'] }] };
        const json = JSON.stringify(U.resultView(doc, [{ i: 0, op: { type: 'drawindex.add', payload: {} }, title: 'A' }], [{ op: { type: 'drawindex.add', payload: {} }, title: 'A' }], { ok: true, changeIds: [] }));
        assert.ok(/Picture 2: couldn't be read/.test(json), 'a failed read is named');
        assert.ok(/Picture 3: skipped, the same draw as picture 1/.test(json), 'a duplicate skip is named with its reason');
        assert.ok(/Picture 4: skipped, this doesn't look like a draw/.test(json), 'a not-a-draw skip is named with its reason');
    });

    await check('a replaced picture is held: the update keeps hold and restore through validate, and its inverse restores the held copy', () => {
        const upd = require('../core/ops').resolveOp('drawindex.update');
        const v = upd.validate({ type: 'drawindex.update', target: { id: 'x' }, payload: { set: { imageUrl: 'u2', publicId: 'draws/a' }, rows: [], hold: { id: 'draws_hold/a-1', publicId: 'draws/a' } } });
        assert.ok(v.ok && v.normalized.payload.hold?.id === 'draws_hold/a-1', 'hold survives validate');
        const r = upd.validate({ type: 'drawindex.update', target: { id: 'x' }, payload: { set: { imageUrl: 'u1' }, rows: [], restore: { from: 'draws_hold/a-1', to: 'draws/a' } } });
        assert.ok(r.ok && r.normalized.payload.restore?.from === 'draws_hold/a-1', 'restore survives validate');
        const inv = upd.invert({ applied: { id: 'x', prior: { imageUrl: 'u1' }, rows: [], hold: { id: 'draws_hold/a-1', publicId: 'draws/a' } } });
        assert.deepStrictEqual(inv.payload.restore, { from: 'draws_hold/a-1', to: 'draws/a' });
        assert.ok(!upd.invert({ applied: { id: 'x', prior: { title: 'T' }, rows: [] } }).payload.restore, 'no hold, no restore');
        const H = require('../utils/drawPictureHold');
        assert.ok(/_hold\/a-\d{14}$/.test(H.holdIdFor('draws/a', new Date('2026-11-16T20:00:00Z'))), 'a held copy is <hold folder>/<name>-<stamp>');
        assert.strictEqual(H.HOLD_DAYS, 7);
    });

    await check('Find Draws: a one-name miss is a private note with Upload This Draw; a match is the panel; several lines are the check on the panel', async () => {
        const catalog = require('../utils/drawCatalog');
        const Sel = require('../models/ManageSelection');
        const realLoad = catalog.loadCatalog, realCreate = Sel.create;
        catalog.loadCatalog = async () => [{ _id: 'e1', title: 'Lethal Pair Draw', slug: 'lethal-pair-draw', aliases: [], items: [{ tier: 'legendary', name: 'QQ9 - Moonlight', kind: 'weapon' }], priceType: 'double_legendary', imageUrl: 'https://x/y.jpg' }];
        Sel.create = async () => ({});
        try {
            const IX = require('../handlers/manage/drawsPanel/drawIndex');
            const miss = await IX.findView('augmented', { owner: true });
            assert.ok(miss.note && !miss.view, 'a one-name miss answers privately (his rule, 2026-11-11 11:56 EST)');
            assert.ok(/Upload This Draw/.test(JSON.stringify(miss.note)), 'and carries Upload This Draw');
            assert.ok(!/Upload This Draw/.test(JSON.stringify((await IX.findView('augmented', { owner: false })).note)), 'not for someone who is not the owner');
            assert.ok((await IX.findView('lethal pair', { owner: true })).view, 'a match is the panel');
            const several = await IX.findView('lethal pair draw\nnot a real draw', { owner: true });
            assert.ok(several.view && /Upload This Draw/.test(JSON.stringify(several.view)), 'several lines are the check, on the panel, with Upload for the missing one');
        } finally { catalog.loadCatalog = realLoad; Sel.create = realCreate; }
    });

    await check('/manage draws holds: the first hold per picture wins inside one interaction, takeHolds empties it, and no context records nothing', async () => {
        const H = require('../utils/drawPictureHold');
        const { runWithContext } = require('../utils/requestContext');
        assert.strictEqual(H.noteHold({ id: 'h/a', publicId: 'draws/a' }), false, 'no context, nothing recorded');
        await runWithContext({}, async () => {
            H.noteHold({ id: 'h/a-1', publicId: 'draws/a' });
            H.noteHold({ id: 'h/b-1', publicId: 'draws/b' });
            H.noteHold({ id: 'h/a-2', publicId: 'draws/a' });
            assert.deepStrictEqual(H.takeHolds(), [{ id: 'h/a-1', publicId: 'draws/a' }, { id: 'h/b-1', publicId: 'draws/b' }], 'a retried upload does not replace the first hold');
            assert.deepStrictEqual(H.takeHolds(), [], 'taken once');
        });
    });

    await check('/manage draws holds: a Revert restores each held picture, holding the current one, and names one that is gone', async () => {
        const H = require('../utils/drawPictureHold');
        const real = H.restorePicture;
        const calls = [];
        H.restorePicture = async (a) => { calls.push(a); return a.to === 'draws/gone' ? { ok: false, error: 'kept 7 days and gone now' } : { ok: true }; };
        try {
            const r = await H.restoreHolds([{ id: 'draws_hold/a-1', publicId: 'draws/a' }, { id: 'draws_hold/gone-1', publicId: 'draws/gone' }]);
            assert.strictEqual(calls.length, 2);
            assert.ok(calls[0].holdCurrentAs && calls[0].from === 'draws_hold/a-1' && calls[0].to === 'draws/a', 'the current picture is held before the old one goes back');
            assert.deepStrictEqual(r.holds.map(h => h.publicId), ['draws/a'], 'only the restored one carries a new hold');
            assert.ok(/gone: kept 7 days/.test(r.failed[0]), 'the one past its days is named');
        } finally { H.restorePicture = real; }
    });

    await check('the review shows the picture that will be saved: cropped as an attachment, the entry\'s own for Keep Old Picture, the upload otherwise', async () => {
        const R2 = require('../utils/drawIndexRead');
        const catalog = require('../utils/drawCatalog');
        const realFetch = R2.fetchImage, realLoad = catalog.loadCatalog;
        const { Jimp } = require('jimp');
        const png = await new Jimp({ width: 40, height: 100, color: 0xffffffff }).getBuffer('image/png');
        R2.fetchImage = async () => ({ buffer: png });
        catalog.loadCatalog = async () => [{ _id: 'e1', imageUrl: 'https://res.cloudinary.com/x/image/upload/draws/old.jpg' }];
        try {
            const base = { status: 'read', title: 'A Draw', items: [{ tier: 'legendary', name: 'X', kind: 'weapon' }], priceType: 'mythicWeapon', matchStatus: 'sure', matchId: 'e1', matchTitle: 'A Draw', url: 'https://cdn.discordapp.com/attachments/1/2/a.png', barPx: 30 };
            const doc = (p) => ({ _id: 'tok', pictures: [{ ...base, ...p }] });
            const crop = await U.reviewPanel(doc({ cropBar: true }));
            assert.strictEqual(crop.files.length, 1);
            assert.strictEqual((await Jimp.read(crop.files[0].data)).bitmap.height, 70, 'the bar is cut off');
            assert.ok(JSON.stringify(crop.components).includes('attachment://crop-0.jpg'));
            const keep = await U.reviewPanel(doc({ cropBar: true, keepOldPicture: true }));
            assert.ok(JSON.stringify(keep.components).includes('draws/old.jpg') && !keep.files.length, 'Keep Old Picture shows the entry\'s picture');
            const plain = await U.reviewPanel(doc({ cropBar: false }));
            assert.ok(JSON.stringify(plain.components).includes('a.png') && Array.isArray(plain.files) && !plain.files.length, 'Keep Bottom Bar shows the upload, and clears an earlier crop');
            R2.fetchImage = async () => { throw new Error('expired'); };
            const fell = await U.reviewPanel(doc({ cropBar: true }));
            assert.ok(JSON.stringify(fell.components).includes('a.png') && !fell.files.length, 'a failed preview falls back to the upload');
        } finally { R2.fetchImage = realFetch; catalog.loadCatalog = realLoad; }
    });

    await check('his 2026-11-16 22:27 EST list: two uploads on the home, Needs My Eyes with its filter, one action row on the card, Upload Draw\'s five fields', async () => {
        const walk = (x, out = []) => { if (Array.isArray(x)) x.forEach(y => walk(y, out)); else if (x && typeof x === 'object') { out.push(x); for (const v of Object.values(x)) if (v && typeof v === 'object') walk(v, out); } return out; };
        const ents = [
            { _id: 'a', title: 'A Draw', items: [{ tier: 'legendary', name: 'X', kind: 'weapon' }], priceType: 'mythicWeapon', imageUrl: 'https://res.cloudinary.com/x/image/upload/draws/a.jpg' },
            { _id: 'b', title: 'B Draw', items: [], priceType: '', imageUrl: '' },
            { _id: 'c', title: 'C Draw', items: [{ tier: 'epic', name: 'Y', kind: '' }], priceType: 'mythicWeapon', imageUrl: 'https://res.cloudinary.com/x/image/upload/draws/c.jpg' },
        ];
        const labels = (v) => walk(v).filter(c => c.type === 2 && c.label).map(c => c.label);
        const home = labels(IX.homeView(ents, {}, null, { owner: true }));
        for (const l of ['Upload Draw', 'Bulk Upload', 'View Indexed Draws', 'Search Index', 'Needs My Eyes · 2']) assert.ok(home.includes(l), `home has ${l}`);
        assert.ok(!labels(IX.homeView(ents, {}, null, { owner: false })).includes('Upload Draw'), 'no upload for an admin');
        const eyes = walk(IX.gapView(ents, 'eyes', 0));
        const rows = eyes.filter(c => c.type === 9).map(c => c.components[0].content);
        assert.ok(/B Draw/.test(rows[0]) && /C Draw/.test(rows[1]) && rows.length === 2, 'the most gaps first, only entries with a gap');
        assert.ok(eyes.some(c => c.type === 3 && c.custom_id === 'mng_dr|ixgaps'), 'the filter menu');
        assert.ok(!walk(IX.gapView(ents, 'all', 0)).some(c => c.type === 3), 'Indexed Draws has no filter');
        const card = (e, doc, owner) => walk(IX.cardView(e, doc, '', { owner }));
        const actionRow = (all) => all.filter(c => c.type === 1).map(r => r.components.map(b => b.label)).find(r => r.includes('Edit'));
        assert.deepStrictEqual(actionRow(card(ents[0], {}, true)), ['Draw Index', 'Edit', 'Delete', 'Picture', 'Add'], 'his order, the way back first');
        assert.deepStrictEqual(actionRow(card(ents[0], {}, false)), ['Draw Index', 'Edit', 'Add'], 'an admin has Edit and Add');
        const onLive = { returningDraws: [{ title: 'A Draw' }] };
        assert.ok(!actionRow(card(ents[0], onLive, true)).includes('Add'), 'no Add when on /draws and no draft is open');
        assert.ok(actionRow(card(ents[0], { ...onLive, draft: { currentSeasonTitle: 'Season 11' } }, true)).includes('Add'), 'Add for the draft');
        assert.ok(card(ents[2], {}, true).some(c => c.type === 2 && c.label === 'Set Item Kinds'), 'Set Item Kinds when an item has no kind');
        const adding = walk(IX.cardView(ents[0], { draft: { currentSeasonTitle: 'Season 11' } }, '', { owner: true, adding: true }));
        assert.deepStrictEqual(adding.filter(c => c.type === 2).map(b => b.label), ['Cancel', 'Add to Live', 'Add to Draft']);
        const kinds = IX.kindsModal(ents[2], '');
        assert.strictEqual(kinds.components.length, 1); assert.ok(kinds.custom_id.startsWith('mng_dr|ixkindsm|c'));
        const one = U.uploadOneModal({ origin: 'p', title: 'Something' });
        assert.ok(one.components.length <= 5 && one.components.every(c => !c.description || c.description.length <= 100), 'five fields, descriptions within 100');
        assert.strictEqual(one.components.find(c => c.component?.custom_id === 'title').component.value, 'Something');
        assert.ok(one.custom_id.startsWith('mng_dr|ixup1m|p|'), 'its own submit');
    });

    await check('the saved screen: one draw shows itself with View; several show a row each with the picture and a View menu; no zero counts', async () => {
        const walk = (x, out = []) => { if (Array.isArray(x)) x.forEach(y => walk(y, out)); else if (x && typeof x === 'object') { out.push(x); for (const v of Object.values(x)) if (v && typeof v === 'object') walk(v, out); } return out; };
        const Up = require('../models/DrawIndexUpload'); const realUpd = Up.updateOne; Up.updateOne = () => ({ catch: () => {} });
        try {
            const e1 = { _id: 'e1', title: 'Augmented Eclipse Draw', items: [{ tier: 'legendary', name: 'KN-44 - Augmented Atomizer', kind: 'weapon' }], priceType: 'mythicWeapon', imageUrl: 'https://res.cloudinary.com/x/image/upload/draws/e1.jpg' };
            const e2 = { _id: 'e2', title: 'Lethal Pair Draw', items: [], priceType: 'doubleLegendaryWeapons', imageUrl: 'https://res.cloudinary.com/x/image/upload/draws/e2.jpg' };
            const doc = { _id: 'tok', pictures: [] };
            const single = walk(U.resultView(doc, [], [{ op: { type: 'drawindex.add', payload: { rows: [] } }, title: e1.title }], { ok: true, changeIds: ['#1'], results: [{ applied: { id: 'e1' } }] }, [e1]));
            const head = single.find(c => c.type === 10).content;
            assert.ok(/Saved · new entry/.test(head) && !/0 updated/.test(head));
            assert.ok(single.some(c => c.type === 12), 'its picture');
            assert.ok(single.some(c => c.type === 2 && c.label === 'View') && single.some(c => c.type === 2 && c.label === 'Revert'));
            const many = walk(U.resultView(doc, [], [{ op: { type: 'drawindex.add', payload: { rows: [] } }, title: e1.title }, { op: { type: 'drawindex.update', target: { id: 'e2' }, payload: { rows: [{}] } }, title: e2.title }], { ok: true, changeIds: ['#1', '#2'], results: [{ applied: { id: 'e1' } }, {}] }, [e1, e2]));
            assert.ok(/Saved 2 draws\n-# 1 new · 1 updated/.test(many.find(c => c.type === 10).content));
            assert.strictEqual(many.filter(c => c.type === 9 && c.accessory?.type === 11).length, 2, 'a picture beside each');
            assert.ok(many.some(c => c.type === 3 && c.custom_id === 'mng_dr|ixopen' && c.options.length === 2), 'the View menu');
            assert.ok(many.length <= 40);
        } finally { Up.updateOne = realUpd; }
    });

    console.log(failed ? `\n${failed} check(s) FAILED.` : '\nAll draw index upload checks passed.');
    process.exit(failed ? 1 : 0);
})();
