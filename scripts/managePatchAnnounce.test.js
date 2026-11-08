// Tests for the rehauled /manage patch-notes and announcement panels (handlers/manage/patchnotesPanel/, handlers/manage/announcementsPanel/, 2026-11-07 21:10 EST). No database: every view takes documents built here, and the two models are stubbed where the panel reads them.
//   - Every view stays inside Discord's limits (40 components counting the page-dropdown row, 4,000 characters, 25 options, custom ids of 100).
//   - A past season's card never offers an action the old code cannot do.
//   - The slash command opens a pop-up as its FIRST answer, and gives a target + do its action at once.
//   - A pop-up submit from the panel defers the update, hands the fields to the OLD save under the id it expects, and redraws.
//   - The patch notes display title agrees with commands/patchnotes.js.
const assert = require('assert');

let failed = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failed += 1; console.log(`  ✗ ${name}\n      ${e.message}`); }
}
function walk(cs, fn) { for (const c of cs || []) { fn(c); walk(c.components, fn); if (c.accessory) fn(c.accessory); if (c.component) fn(c.component); } }
function limits(view, name) {
    let n = 0, chars = 0; const ids = [];
    walk(view, c => { n += 1; if (c.type === 10) chars += c.content.length; if (c.custom_id) ids.push(c.custom_id); if (c.type === 3) assert.ok(c.options.length >= 1 && c.options.length <= 25, `${name}: select with ${c.options.length} options`); if (c.type === 3) c.options.forEach(o => assert.ok(o.label.length <= 100 && (o.description || '').length <= 100, `${name}: option text over 100`)); });
    assert.ok(n <= 40, `${name}: ${n} components`);
    assert.ok(chars <= 4000, `${name}: ${chars} characters`);
    assert.ok(ids.every(i => i.length <= 100), `${name}: an id over 100`);
    assert.strictEqual(new Set(ids).size, ids.length, `${name}: duplicate ids`);
}
const idsOf = (view) => { const ids = []; walk(view, c => { if (c.custom_id) ids.push(c.custom_id); }); return ids; };

const DAY = 86400000;
const now = Date.now();
const oid = (i) => String(i).padStart(24, 'b');
const LINK = (i, j) => `https://res.cloudinary.com/x/image/upload/f_auto,q_auto/v1/patch/s${i}-${j}.jpg`;
const entry = (i, extra = {}) => ({ _id: oid(i), title: `Season ${i}: A Fairly Long Season Name Number ${i}`, emoji: '', titleOverride: '', description: `# Weapon ${i}, Attachment\nb: Buffed a thing for season ${i}\n`.repeat(8), releaseDate: new Date(now - (20 - i) * 30 * DAY), images: Array.from({ length: 10 }, (_, j) => LINK(i, j)), ...extra });
const seasonDoc = (n = 10) => ({ docType: 'global', currentSeasonTitle: `Season ${n}: A Fairly Long Season Name Number ${n}`, patchNotes: Array.from({ length: n }, (_, i) => entry(i + 1)) });
const LONG = (i) => `# Announcement number ${i} with a heading that runs fairly long indeed\n${'Body text that goes on and on for a while. '.repeat(90)}`.slice(0, 3900);
const ann = (i, extra = {}) => ({ _id: oid(100 + i), text: LONG(i), createdAt: new Date(now - i * DAY), createdBy: '1139845545754632283', expiresAt: new Date(now + (30 - i) * DAY), color: 0x44aa88, startsAt: null, ...extra });
const PAGE_ROW = { type: 1, components: [{ type: 3, custom_id: 'mng_pagesel', placeholder: 'Switch section', options: Array.from({ length: 10 }, (_, i) => ({ label: `Section ${i}`, value: `s${i}` })) }] };

const OWNER = require('../utils/owner').ALLOWED_ADMIN_ID;
function fake({ customId = '', chat = false, modal = false, select = false, message = false, values = [], opts = {}, focused = '' } = {}) {
    const calls = [];
    const i = {
        calls, customId, values, deferred: false, replied: false, user: { id: OWNER }, client: { commands: new Map() },
        message: message ? { id: 'm1' } : undefined,
        options: { getString: (k) => opts[k] ?? null, getFocused: () => focused },
        isChatInputCommand: () => chat, isModalSubmit: () => modal, isStringSelectMenu: () => select, isButton: () => !chat && !modal && !select,
        fields: { getTextInputValue: () => '' },
        showModal: async (m) => { calls.push(['showModal', (m.toJSON ? m.toJSON() : m).custom_id]); },
        deferUpdate: async () => { calls.push('deferUpdate'); i.deferred = true; },
        deferReply: async () => { calls.push('deferReply'); i.deferred = true; },
        reply: async (x) => { calls.push(['reply', x]); i.replied = true; },
        followUp: async (x) => { calls.push(['followUp', x]); },
        respond: async (x) => { calls.push(['respond', x]); },
    };
    return i;
}

(async () => {
    console.log('manage patch notes + announcement');

    // The panels send through sendV2Payload; record what they would send instead of calling Discord.
    const sent = [];
    const svPath = require.resolve('../utils/sendV2Payload');
    require.cache[svPath] = { id: svPath, filename: svPath, loaded: true, exports: { sendV2Payload: async (_i, components) => { sent.push(components); } } };

    // The two models, stubbed where the panels read them.
    let seasonal = seasonDoc(10);
    let announcements = { live: [], expired: [] };
    const Seasonal = require('../models/SeasonalData');
    Seasonal.findOne = () => ({ lean: async () => seasonal });
    require('../models/UserPreference').findOne = async () => ({ timezone: 'America/Toronto' });
    const AnnouncementModel = require('../models/Announcement');
    const chain = (list) => ({ sort() { return this; }, limit() { return this; }, lean: async () => list });
    AnnouncementModel.find = (q) => chain(q && q.$or ? announcements.live : announcements.expired);
    AnnouncementModel.findById = (id) => ({ lean: async () => [...announcements.live, ...announcements.expired].find(d => String(d._id) === String(id)) || null });

    const PV = require('../handlers/manage/patchnotesPanel/views');
    const PP = require('../handlers/manage/patchnotesPanel');
    const AV = require('../handlers/manage/announcementsPanel/views');
    const AP = require('../handlers/manage/announcementsPanel');

    // ---------- patch notes ----------
    await check('the display title is the one /patch notes shows (override wins, prefix and typed emoji stripped)', () => {
        const { displayTitle } = require('../commands/patchnotes');
        const samples = [{ title: 'Season 9: Vampires' }, { title: 'Season 9: Vampires', titleOverride: 'Season 10: Placeholder' }, { title: 'Balance Changes for Season 4: X' }, { title: '<a:S5:123456789012345678> Season 5: Z' }, { title: 'Season 6', titleOverride: '' }];
        for (const s of samples) assert.strictEqual(PV.displayTitle(s), displayTitle(s), JSON.stringify(s));
    });
    await check('every patch notes view stays inside Discord\'s limits with 10 seasons of 10 images', async () => {
        const doc = seasonDoc(10);
        limits(await PV.pageView(doc, null, { pageRow: PAGE_ROW }), 'home');
        limits(await PV.pageView(doc, `${'x'.repeat(300)}`, { pageRow: PAGE_ROW }), 'home with a note');
        limits(await PV.pageView({ patchNotes: [] }, null, { pageRow: PAGE_ROW }), 'home, nothing yet');
        limits(await PV.pageView(seasonDoc(40), null, { pageRow: PAGE_ROW }), 'home, 40 seasons');
        for (const p of doc.patchNotes) limits(PV.cardView(doc, String(p._id), { header: '-# Saved.' }), `card ${p.title}`);
        limits(PV.resultView({ ok: 'warn', title: 'Purge?', body: ['x'.repeat(500)], extraButtons: [PV.btn('purgeok', 'Yes', null, 4)] }), 'result');
        assert.strictEqual(PV.cardView(doc, oid(999)), null);
    });
    await check('the past-season dropdown lists the other seasons newest first, 25 at most', async () => {
        const home = await PV.pageView(seasonDoc(40), null, {});
        let select; walk(home, c => { if (c.type === 3 && c.custom_id === PV.ID('past')) select = c; });
        assert.strictEqual(select.options.length, 25);
        assert.strictEqual(select.options[0].value, oid(39), 'the newest past season is first');
        assert.ok(!select.options.some(o => o.value === oid(40)), 'the current season is not a past season');
        assert.match(JSON.stringify(home), /older seasons are not listed/);
    });
    await check('a past season\'s card offers only the Edit its old pop-up can do; the current one offers the three it has', () => {
        const doc = seasonDoc(10);
        const past = idsOf(PV.cardView(doc, oid(3)));
        assert.deepStrictEqual(past.sort(), [PV.ID('edit', oid(3)), PV.ID('page')].sort());
        const cur = idsOf(PV.cardView(doc, oid(10)));
        assert.deepStrictEqual(cur.sort(), [PV.ID('dateinfo'), PV.ID('urls', 1), PV.ID('urls', 2), PV.ID('page')].sort());
        assert.match(JSON.stringify(PV.cardView(doc, oid(3))), /one pop-up/);
    });
    await check('the home reads: the current card, its three actions, Add, past seasons, Guide, Purge', async () => {
        const ids = idsOf(await PV.pageView(seasonDoc(3), null, {}));
        for (const v of ['dateinfo', 'add', 'past', 'guide', 'purge']) assert.ok(ids.includes(PV.ID(v)), `${v} missing`);
        assert.ok(ids.includes(PV.ID('urls', 1)) && ids.includes(PV.ID('urls', 2)));
        const dump = JSON.stringify(await PV.pageView(seasonDoc(3), null, {}));
        assert.match(dump, /Season 3: A Fairly Long Season Name Number 3/);
        assert.match(dump, /10\/10 images/);
    });
    await check('patch notes custom ids are mng_pn|… and refuse to pass 100 characters', () => {
        assert.strictEqual(PV.ID('card', oid(1)), `mng_pn|card|${oid(1)}`);
        assert.throws(() => PV.ID('x'.repeat(100)), /over 100/);
        assert.strictEqual(PP.PREFIX, 'mng_pn|');
    });
    await check('patch notes autocomplete lists seasons newest first and matches every word', async () => {
        seasonal = seasonDoc(10);
        const i = fake({ chat: true, focused: '' });
        await PP.autocomplete(i);
        const first = i.calls.find(c => c[0] === 'respond')[1];
        assert.strictEqual(first.length, 10);
        assert.strictEqual(first[0].value, oid(10));
        assert.ok(first.every(c => c.name.length <= 100 && c.name.length > 0));
        const j = fake({ chat: true, focused: 'number 4 season' });
        await PP.autocomplete(j);
        const hit = j.calls.find(c => c[0] === 'respond')[1];
        assert.deepStrictEqual(hit.map(h => h.value), [oid(4)]);
    });
    await check('slash: do:add opens the Add pop-up first, with no defer', async () => {
        const i = fake({ chat: true, opts: { do: 'add' } });
        await PP.openFromSlash(i);
        assert.deepStrictEqual(i.calls, [['showModal', 'mng_pn|addm']]);
    });
    await check('slash: edit and images act on the current season, or on the one given', async () => {
        seasonal = seasonDoc(10);
        const cur = fake({ chat: true, opts: { do: 'edit' } });
        await PP.openFromSlash(cur);
        assert.deepStrictEqual(cur.calls, [['showModal', 'mng_pn|dateinfom']]);
        const img = fake({ chat: true, opts: { do: 'images2' } });
        await PP.openFromSlash(img);
        assert.deepStrictEqual(img.calls, [['showModal', 'mng_pn|urlsm|2']]);
        // A past season has the one Edit pop-up, which holds the images too.
        const past = fake({ chat: true, opts: { do: 'images1', season: oid(3) } });
        await PP.openFromSlash(past);
        assert.deepStrictEqual(past.calls, [['showModal', `mng_pn|editm|${oid(3)}`]]);
        // Nothing saved yet: the first save creates the entry, so the blank pop-up opens.
        seasonal = { patchNotes: [] };
        const none = fake({ chat: true, opts: { do: 'edit' } });
        await PP.openFromSlash(none);
        assert.deepStrictEqual(none.calls, [['showModal', 'mng_pn|dateinfom']]);
        seasonal = seasonDoc(10);
    });
    await check('slash: a season alone opens its card; a season that matches nothing opens the home with a note', async () => {
        sent.length = 0;
        const card = fake({ chat: true, opts: { season: oid(4) } });
        await PP.openFromSlash(card);
        assert.deepStrictEqual(card.calls, ['deferReply']);
        assert.match(JSON.stringify(sent.at(-1)), /Season 4: A Fairly Long/);
        const miss = fake({ chat: true, opts: { season: 'zzzz nothing' } });
        await PP.openFromSlash(miss);
        assert.match(JSON.stringify(sent.at(-1)), /No season matches/);
    });
    await check('a pop-up submit from the panel defers the update, saves through the OLD handler under its own id, and redraws the card', async () => {
        const old = require('../handlers/manage/patchnotes');
        const real = { setUrls: old.setUrls, setDateInfo: old.setDateInfo, editSeason: old.editSeason };
        try {
            const seen = [];
            old.setUrls = async (interaction, opts) => { seen.push(['urls', opts.customId]); opts.onResult?.({ ok: true, elementId: oid(10) }); };
            old.setDateInfo = async (interaction, opts) => { seen.push(['dateinfo', opts.customId]); opts.onResult?.({ ok: false }); };
            old.editSeason = async (interaction, opts) => { seen.push(['edit', opts.customId]); opts.onResult?.({ ok: true, elementId: oid(3) }); };
            sent.length = 0;
            const a = fake({ customId: 'mng_pn|urlsm|2', modal: true, message: true });
            assert.strictEqual(await PP.handlePatchnotesPanelInteraction(a), true);
            assert.deepStrictEqual(a.calls, ['deferUpdate']);
            assert.deepStrictEqual(seen.pop(), ['urls', 'modal_patch_urls_2']);
            assert.match(JSON.stringify(sent.at(-1)), /Saved\. The result, with Revert/);
            const b = fake({ customId: 'mng_pn|dateinfom', modal: true, message: true });
            await PP.handlePatchnotesPanelInteraction(b);
            assert.match(JSON.stringify(sent.at(-1)), /Not saved/, 'a failed save says so on the redrawn card');
            const c = fake({ customId: `mng_pn|editm|${oid(3)}`, modal: true, message: true });
            await PP.handlePatchnotesPanelInteraction(c);
            assert.deepStrictEqual(seen.pop(), ['edit', `modal_patch_editseason_${oid(3)}`]);
            assert.match(JSON.stringify(sent.at(-1)), /Past Seasons/, 'the past season\'s own card is redrawn');
            // From the slash command there is no card: the old save answers alone, with no defer from here.
            const d = fake({ customId: 'mng_pn|urlsm|1', modal: true, message: false });
            await PP.handlePatchnotesPanelInteraction(d);
            assert.deepStrictEqual(d.calls, []);
        } finally { Object.assign(old, real); }
    });
    await check('only this panel\'s own ids are taken; the panel buttons open pop-ups as the first answer', async () => {
        assert.strictEqual(await PP.handlePatchnotesPanelInteraction(fake({ customId: 'mng_dr|page' })), false);
        assert.strictEqual(await PP.handlePatchnotesPanelInteraction(fake({ customId: 'mng_pn_other' })), false);
        for (const [id, modal] of [['mng_pn|dateinfo', 'mng_pn|dateinfom'], ['mng_pn|urls|1', 'mng_pn|urlsm|1'], ['mng_pn|add', 'mng_pn|addm'], [`mng_pn|edit|${oid(2)}`, `mng_pn|editm|${oid(2)}`]]) {
            const i = fake({ customId: id, message: true });
            await PP.handlePatchnotesPanelInteraction(i);
            assert.deepStrictEqual(i.calls, [['showModal', modal]], id);
        }
    });

    // ---------- announcements ----------
    await check('every announcement view stays inside Discord\'s limits with 8 long announcements', async () => {
        const live = Array.from({ length: 8 }, (_, i) => ann(i + 1));
        live[2] = ann(3, { startsAt: new Date(now + 3 * DAY), repeatCount: 3, bannerImageUrl: 'https://example.com/b.png' });
        const expired = Array.from({ length: 5 }, (_, i) => ann(20 + i, { expiresAt: new Date(now - (i + 1) * DAY) }));
        limits(AV.pageView({ live, expired }, null, { pageRow: PAGE_ROW }), 'home');
        limits(AV.pageView({ live, expired }, 'x'.repeat(300), { pageRow: PAGE_ROW }), 'home with a note');
        limits(AV.pageView({ live: [], expired: [] }, null, { pageRow: PAGE_ROW }), 'home, nothing running');
        limits(AV.pageView({ live: Array.from({ length: 40 }, (_, i) => ann(i + 1)), expired }, null, { pageRow: PAGE_ROW }), 'home, 40 running');
        for (const d of live) limits(AV.cardView(d, { header: '-# Saved.' }), `card ${d._id}`);
        limits(AV.cardView(live[0], { header: 'x'.repeat(300), extra: [AV.row(AV.btn('page', 'Back'))] }), 'card with a confirm');
        limits(AV.resultView({ title: 'Deleted', body: ['x'.repeat(500)] }), 'result');
        assert.strictEqual(AV.cardView(null), null);
    });
    await check('the home lists each running announcement with its facts, marks a scheduled one, and caps the rows', () => {
        const live = Array.from({ length: 12 }, (_, i) => ann(i + 1));
        live[1] = ann(2, { startsAt: new Date(now + DAY) });
        const view = AV.pageView({ live, expired: [ann(30, { expiresAt: new Date(now - DAY) })] }, null, {});
        const dump = JSON.stringify(view);
        assert.match(dump, /1 scheduled/);
        assert.match(dump, /starts <t:/);
        assert.match(dump, /1 recently expired/);
        assert.match(dump, /and 4 more in the dropdown/);
        let open; walk(view, c => { if (c.type === 3 && c.custom_id === AV.ID('open')) open = c; });
        assert.strictEqual(open.options.length, 12);
        assert.ok(open.options.every(o => o.label.length <= 100));
        assert.ok(idsOf(view).includes(AV.ID('again')), 'Post Again is offered for the expired ones');
    });
    await check('a one-line preview drops the heading mark and layout marks and stays within its limit', () => {
        assert.strictEqual(AV.preview({ text: '# Big News\nmore' }), 'Big News');
        assert.strictEqual(AV.preview({ text: '----\n\n++\nSecond line' }), 'Second line');
        assert.strictEqual(AV.preview({ text: 'x'.repeat(300) }).length, 100);
        assert.strictEqual(AV.preview({ text: '' }), '(no text)');
    });
    await check('the card shows the text as players get it and offers Edit and Delete only', () => {
        const d = ann(1, { text: 'Hello players' });
        const view = AV.cardView(d);
        const dump = JSON.stringify(view);
        assert.match(dump, /Hello players/);
        assert.match(dump, /Made with/, 'the permanent footer players get is in the card');
        assert.deepStrictEqual(idsOf(view).sort(), [AV.ID('edit', d._id), AV.ID('del', d._id), AV.ID('page')].sort());
    });
    await check('announcement custom ids are mng_an|… and refuse to pass 100 characters', () => {
        assert.strictEqual(AV.ID('card', oid(1)), `mng_an|card|${oid(1)}`);
        assert.throws(() => AV.ID('x'.repeat(100)), /over 100/);
        assert.strictEqual(AP.PREFIX, 'mng_an|');
    });
    await check('announcement autocomplete matches every word of the text and previews it on one line', async () => {
        announcements = { live: [ann(1, { text: '# Maintenance tonight\nThe bot restarts' }), ann(2, { text: 'New season starts Friday' }), ann(3, { text: 'Nerfs\nand maintenance notes' })], expired: [] };
        const i = fake({ chat: true, focused: 'maintenance' });
        await AP.autocomplete(i);
        const hits = i.calls.find(c => c[0] === 'respond')[1];
        assert.deepStrictEqual(hits.map(h => h.name), ['Maintenance tonight', 'Nerfs']);
        assert.ok(hits.every(h => h.value === String(h.value) && h.name.length <= 100));
        const all = fake({ chat: true, focused: '' });
        await AP.autocomplete(all);
        assert.strictEqual(all.calls.find(c => c[0] === 'respond')[1].length, 3);
    });
    await check('slash: post opens the pop-up first; edit opens the filled one; delete opens the confirm card', async () => {
        announcements = { live: [ann(1, { text: 'Keep me' }), ann(2)], expired: [] };
        const post = fake({ chat: true, opts: { do: 'post' } });
        await AP.openFromSlash(post);
        assert.deepStrictEqual(post.calls, [['showModal', 'mng_an|postm']]);
        const edit = fake({ chat: true, opts: { do: 'edit', announcement: String(announcements.live[0]._id) } });
        await AP.openFromSlash(edit);
        assert.deepStrictEqual(edit.calls, [['showModal', `mng_an|editm|${announcements.live[0]._id}`]]);
        sent.length = 0;
        const del = fake({ chat: true, opts: { do: 'delete', announcement: 'keep me' } });
        await AP.openFromSlash(del);
        assert.deepStrictEqual(del.calls, ['deferReply']);
        const dump = JSON.stringify(sent.at(-1));
        assert.match(dump, /Delete this announcement/);
        assert.ok(idsOf(sent.at(-1)).includes(AV.ID('delok', announcements.live[0]._id)));
        const none = fake({ chat: true, opts: { do: 'edit' } });
        await AP.openFromSlash(none);
        assert.match(JSON.stringify(sent.at(-1)), /needs an `announcement:`/);
    });
    await check('Post Again opens Post New with the expired text in the box and the other fields as Post New has them', () => {
        const modal = AP.postAgainModal(ann(5, { text: 'Come back soon' }));
        assert.strictEqual(modal.custom_id, 'mng_an|postm');
        const inputs = modal.components.flatMap(r => r.components);
        assert.strictEqual(inputs.find(c => c.custom_id === 'text').value, 'Come back soon');
        assert.ok(!inputs.find(c => c.custom_id === 'expiry').value, 'the expiry is left blank (the 60-day default)');
        assert.ok(!inputs.find(c => c.custom_id === 'starts_at').value);
    });
    await check('an announcement pop-up submit from the panel defers the update and saves through the OLD handler under its own id', async () => {
        const old = require('../handlers/manage/announcements');
        const real = { postAnnouncement: old.postAnnouncement, editAnnouncement: old.editAnnouncement };
        try {
            announcements = { live: [ann(1)], expired: [] };
            const seen = [];
            old.postAnnouncement = async (interaction, opts) => { seen.push(['post', opts.customId]); opts.onResult({ ok: true }); };
            old.editAnnouncement = async (interaction, opts) => { seen.push(['edit', opts.customId]); opts.onResult({ ok: true }); };
            sent.length = 0;
            const p = fake({ customId: 'mng_an|postm', modal: true, message: true });
            await AP.handleAnnouncementsPanelInteraction(p);
            assert.deepStrictEqual(p.calls, ['deferUpdate']);
            assert.match(JSON.stringify(sent.at(-1)), /Saved/);
            const id = String(announcements.live[0]._id);
            const e = fake({ customId: `mng_an|editm|${id}`, modal: true, message: true });
            await AP.handleAnnouncementsPanelInteraction(e);
            assert.deepStrictEqual(seen.pop(), ['edit', `modal_announce_edit_${id}`]);
            assert.match(JSON.stringify(sent.at(-1)), /Announcements/, 'the announcement\'s own card is redrawn');
        } finally { Object.assign(old, real); }
    });
    await check('the old save handlers take the new opts and stay safe for callers that pass none', () => {
        const src = require('fs').readFileSync(require.resolve('../handlers/manage/announcements.js'), 'utf8') + require('fs').readFileSync(require.resolve('../handlers/manage/patchnotes.js'), 'utf8');
        for (const fn of ['setDateInfo', 'setUrls', 'addSeason', 'editSeason', 'postAnnouncement', 'editAnnouncement']) assert.match(src, new RegExp(`async function ${fn}\\(interaction, opts = \\{\\}\\)`), fn);
        assert.ok(!/^\s*await interaction\.deferReply\(\{ ephemeral: true \}\);/m.test(src), 'an unguarded defer is left in a save the panel calls after deferUpdate');
    });
    await check('the panels never require /patch notes themselves (the draws panel\'s hotpatch rule)', () => {
        const fs = require('fs');
        for (const f of ['patchnotesPanel/index.js', 'patchnotesPanel/views.js', 'announcementsPanel/index.js', 'announcementsPanel/views.js']) {
            const code = fs.readFileSync(require.resolve(`../handlers/manage/${f}`), 'utf8').split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
            assert.ok(!/require\([^)]*commands\/patchnotes/.test(code), `${f} requires commands/patchnotes`);
        }
    });

    console.log(failed ? `\n${failed} check(s) FAILED.` : '\nAll manage patch notes + announcement checks passed.');
    process.exit(failed ? 1 : 0);
})();
