// Tests for the rehauled /manage season panel (handlers/manage/seasonPanel/, 2026-11-07 21:08 EST). No database and no Discord: every view takes a season document built here, and the routing runs against a fake interaction with the model, the permission store and the sender stubbed.
//   - Both views, every list page and both confirm cards stay inside Discord's limits (40 components counted recursively with the page dropdown, 4,000 characters, 25 options, custom ids of 100).
//   - Deadlines show as Discord timestamps (never a bare date), TBD as TBD, a missing date as "not set".
//   - The confirm cards name what will change; the slash options open a pop-up as the FIRST answer, never after a defer.
//   - Promote and Discard run the existing logic only for someone holding the destructive tier.
const assert = require('assert');

let failed = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failed += 1; console.log(`  ✗ ${name}\n      ${e.message}`); }
}
function walk(cs, fn) { for (const c of cs || []) { fn(c); walk(c.components, fn); if (c.accessory) fn(c.accessory); if (c.component) fn(c.component); } }
function limits(view, name) {
    let n = 0, chars = 0; const ids = [];
    walk(view, c => { n += 1; if (c.type === 10) chars += c.content.length; if (c.custom_id) ids.push(c.custom_id); if (c.type === 3) assert.ok(c.options.length <= 25, `${name}: select over 25`); });
    assert.ok(n <= 40, `${name}: ${n} components`);
    assert.ok(chars <= 4000, `${name}: ${chars} characters`);
    assert.ok(ids.every(i => i.length <= 100), `${name}: an id over 100`);
    assert.strictEqual(new Set(ids).size, ids.length, `${name}: duplicate ids`);
}
const allText = (view) => { const out = []; walk(view, c => { if (c.type === 10) out.push(c.content); }); return out.join('\n'); };

const DAY = 86400000;
const now = Date.now();
const oid = (i) => String(i).padStart(24, 'b');
const items = [{ tier: 'legendary', name: 'Grav - Skin' }, { tier: 'epic', name: 'Samael - Look' }];
const draw = (i, title, extra = {}) => ({ _id: oid(i), title, date: new Date(now + (30 + i) * DAY), items, thumbnailUrl: 'https://example.invalid/x.jpg', ...extra });
const NEWS = (extra = {}) => ({ channelId: '1', messageId: String(Math.random()), rank: 1, dated: true, carried: false, noEnd: false, sig: 's', ...extra });

// A season ending with its Battle Pass at a real instant, Ranked TBD, DMZ not set.
const live = () => ({
    docType: 'global', currentSeasonTitle: 'Season 9 — Vampires vs Werewolves', bpTitle: 'Battle Pass', rankTitle: 'Ranked Series', dmzTitle: 'DMZ Season',
    bpStart: new Date('2026-08-06T00:00:00Z'), bpEnd: new Date('2026-11-17T04:00:00Z'), rankEnd: null, rankEndTBD: true, dmzEnd: null,
    newDraws: [draw(1, 'Live New')], returningDraws: [draw(2, 'Live Returning')], calendar: [{ _id: oid(3), title: 'Live Event', date: new Date(now), endDate: new Date(now + DAY), category: 'event' }],
});
// ~30 staged draws, ~40 calendar entries, five of them from news triage.
const fullDraft = () => ({
    ...live(),
    draft: {
        active: true, currentSeasonTitle: 'Season 10 — 7th Anniversary', bpTitle: 'Battle Pass', rankTitle: 'Ranked Series', dmzTitle: 'DMZ Season',
        bpStart: new Date('2026-11-18T00:00:00Z'), bpEnd: new Date('2027-01-20T05:00:00Z'), rankEnd: new Date('2027-01-20T05:00:00Z'), dmzEnd: null, dmzEndTBD: true,
        newDraws: Array.from({ length: 10 }, (_, i) => draw(10 + i, `Staged New Draw With A Fairly Long Title ${i + 1}`, i < 2 ? { newsSource: NEWS() } : {})),
        returningDraws: Array.from({ length: 20 }, (_, i) => draw(40 + i, `Staged Returning Draw ${i + 1}`, i < 1 ? { newsSource: NEWS({ dated: false }) } : {})),
        calendar: Array.from({ length: 40 }, (_, i) => ({ _id: oid(100 + i), title: `Staged Event Number ${i + 1}`, date: new Date(now + i * DAY), endDate: i % 7 ? new Date(now + (i + 5) * DAY) : null, isOngoing: i % 11 === 0, category: ['event', 'playlist', 'draw'][i % 3], ...(i < 2 ? { newsSource: NEWS({ noEnd: true }) } : {}) })),
        newsSeasonSet: { bpEnd: { rank: 1 }, currentSeasonTitle: { rank: 1 } },
    },
});
const emptyDraft = () => ({ ...live(), draft: { active: false, newDraws: [], returningDraws: [], calendar: [] } });

(async () => {
    console.log('manage season panel');
    // Stubs go in BEFORE the panel loads: index.js takes sendV2Payload at require time.
    let sent = null;
    require('../utils/sendV2Payload').sendV2Payload = async (i, components) => { sent = components; return components; };
    let currentDoc = fullDraft();
    const SeasonalData = require('../models/SeasonalData');
    SeasonalData.findOne = () => ({ lean: async () => currentDoc });
    const AdminUser = require('../models/AdminUser');
    AdminUser.find = () => ({ select: () => ({ lean: async () => [] }) });
    const { OWNER_ID } = { OWNER_ID: require('../utils/owner').ALLOWED_ADMIN_ID };

    const V = require('../handlers/manage/seasonPanel/views');
    const P = require('../handlers/manage/seasonPanel');
    const pageRow = require('../commands/manage').buildPageSelectRow('seasondraft', { showEmojis: true });

    await check('the live view and both draft views stay inside Discord\'s limits, page dropdown included', () => {
        limits(V.pageView(live(), 'live', 'a note', { pageRow }), 'live');
        limits(V.pageView(live(), 'live', null, { pageRow }), 'live no note');
        limits(V.pageView(fullDraft(), 'live', null, { pageRow }), 'live, draft staged');
        limits(V.pageView(fullDraft(), 'draft', `### ✅ Saved\n${'x'.repeat(1700)}`, { pageRow }), 'draft staged, long note');
        limits(V.pageView(emptyDraft(), 'draft', null, { pageRow }), 'draft empty');
        limits(V.pageView({}, 'live', null, { pageRow }), 'live, no document');
        limits(V.pageView({}, 'draft', null, { pageRow }), 'draft, no document');
        assert.ok(pageRow.components[0].options.length <= 25);
    });
    await check('every list page stays inside the limits, ten rows a page, and the pager reaches the last page', () => {
        const doc = fullDraft();
        for (const [kind, total] of [['nd', 10], ['rd', 20], ['cal', 40], ['news', 5]]) {
            const pages = Math.ceil(total / V.PAGE);
            for (let p = 0; p < pages + 1; p++) limits(V.listView(doc, kind, p), `list ${kind} ${p}`);
            const last = V.listView(doc, kind, 99);
            assert.match(allText(last), new RegExp(`page ${pages} of ${pages}|${total} rows`), kind);
        }
        assert.strictEqual(V.counts(doc).news, 5, 'news rows are the ones carrying newsSource');
        const first = allText(V.listView(doc, 'cal', 0)).split('\n').filter(l => l.startsWith('**'));
        assert.strictEqual(first.length, 10);
    });
    await check('deadlines render as Discord timestamps, TBD as TBD, a missing date as "not set"', () => {
        const t = allText(V.pageView(live(), 'live'));
        const bp = Math.floor(new Date('2026-11-17T04:00:00Z').getTime() / 1000);
        assert.ok(t.includes(`<t:${bp}:f>`) && t.includes(`<t:${bp}:R>`), 'Battle Pass end is not a timestamp pair');
        assert.match(t, /Starts <t:\d+:f>/);
        assert.match(t, /Ranked[^\n]*\n-# Ends TBD/);
        assert.match(t, /DMZ[^\n]*\n-# Ends not set/);
        assert.ok(!/\b(Nov|November) 17\b|2026-11-17/.test(t), 'a bare date leaked in');
        const d = allText(V.pageView(fullDraft(), 'draft'));
        assert.match(d, /DMZ[^\n]*\n-# Ends TBD/);
        assert.match(d, /Season 10|𝑺|𝙎|𝘀/u, 'the staged title is missing');
    });
    await check('the live view says what is staged, and the draft view says nothing is staged when it is empty', () => {
        assert.match(allText(V.pageView(live(), 'live')), /Next season: nothing staged/);
        assert.match(allText(V.pageView(fullDraft(), 'live')), /Next season: staged · 10 new · 20 returning · 40 calendar/);
        const e = V.pageView(emptyDraft(), 'draft');
        assert.match(allText(e), /Nothing is staged, and nothing goes live until you press Promote to Live/);
        const labels = []; walk(e, c => { if (c.type === 2) labels.push(c.label); });
        assert.deepStrictEqual(labels.filter(Boolean), ['Edit Titles & Deadlines', 'Draws', 'Calendar', 'Live Season', 'Guide'], 'the way back first in its row (round 2, 2026-11-11 11:02 EST)');
        const f = []; walk(V.pageView(fullDraft(), 'draft'), c => { if (c.type === 2) f.push(c.label); });
        for (const want of ['New Draws · 10', 'Returning · 20', 'Calendar · 40', 'News · 5', 'Promote to Live', 'Discard Draft', 'Guide', 'Live Season']) assert.ok(f.includes(want), `missing button ${want}`);
    });
    await check('the live view has Edit Titles, Start New Season (red) and Next Season Draft', () => {
        const b = []; walk(V.pageView(live(), 'live'), c => { if (c.type === 2) b.push([c.label, c.style]); });
        assert.deepStrictEqual(b, [['Edit Titles & Deadlines', 1], ['Start New Season', 4], ['Next Season Draft', 2]]);
    });
    await check('the Promote card names what changes, the Discard card what is erased', () => {
        const p = allText(V.promoteConfirm(fullDraft()));
        assert.match(p, /Promote the staged draft to live\?/);
        assert.match(p, /~~Season 9 — Vampires vs Werewolves~~ → Season 10 — 7th Anniversary/);
        assert.match(p, /\*\*Battle Pass:\*\* ~~/);
        assert.match(p, /\*\*Draws:\*\* ~~1 New, 1 Returning~~ → 10 New, 20 Returning/);
        assert.match(p, /\*\*Calendar:\*\* ~~1 event~~ → 40 events/);
        const ids = []; walk(V.promoteConfirm(fullDraft()), c => { if (c.type === 2) ids.push(c.custom_id); });
        assert.ok(ids.includes('mng_ss|promoteok') && ids.includes('mng_ss|view|draft'));
        const d = allText(V.discardConfirm(fullDraft()));
        assert.match(d, /Discard the staged draft\?/);
        assert.match(d, /\*\*Draws:\*\* 10 New, 20 Returning/);
        assert.match(d, /\*\*Calendar:\*\* 40 events/);
        assert.match(d, /\*\*News items:\*\* 5/);
        assert.match(d, /What is live is untouched/);
        limits(V.promoteConfirm(fullDraft()), 'promote card');
        limits(V.discardConfirm(fullDraft()), 'discard card');
        limits(V.resultView({ title: 'Done', body: ['x'], crumbs: ['a'] }), 'result');
    });
    await check('carried-over rows are not counted as news, and a calendar draw with no draw is named (2026-11-08 11:30 EST)', () => {
        const doc = fullDraft();
        doc.draft.returningDraws.push(draw(90, 'Carried Draw', { newsSource: NEWS({ carried: true }) }));
        doc.draft.calendar.push({ _id: oid(91), title: 'Carried Draw', date: new Date(now), endDate: new Date(now + DAY), category: 'draw', newsSource: NEWS({ carried: true }) });
        doc.draft.calendar.push({ _id: oid(92), title: 'Orphan Long Title Draw', date: new Date(now), endDate: new Date(now + DAY), category: 'draw' });
        const c = V.counts(doc);
        assert.strictEqual(c.news, 5, 'carried rows stay out of News');
        assert.strictEqual(c.carried, 2);
        const t = allText(V.pageView(doc, 'draft'));
        assert.match(t, /2 rows carried over/);
        const orphans = V.calendarDrawsWithoutDraw(doc.draft);
        assert.ok(orphans.includes('Orphan Long Title Draw') && !orphans.includes('Carried Draw'), JSON.stringify(orphans));
        assert.match(t, /On the calendar, not in the draw lists:\*\* .+ and \d+ more\. \/draws will not show them after Promote/, 'the fixture has more than five, so the line names five and counts the rest');
        assert.match(allText(V.promoteConfirm(doc)), /On the calendar, not in the draw lists/);
        const one = { ...doc, draft: { ...doc.draft, calendar: doc.draft.calendar.filter(r => r.category !== 'draw' || r.title === 'Orphan Long Title Draw') } };
        assert.match(allText(V.pageView(one, 'draft')), /not in the draw lists:\*\* Orphan Long Title Draw\. \/draws will not show it/);
        assert.match(allText(V.discardConfirm(doc)), /Carried over:\*\* 2/);
        limits(V.pageView(doc, 'draft', null, { pageRow }), 'draft with carried and orphan rows');
    });
    await check('custom ids are mng_ss|… and refuse to pass 100 characters', () => {
        assert.strictEqual(V.ID('ls', 'nd', 3), 'mng_ss|ls|nd|3');
        assert.strictEqual(P.PREFIX, 'mng_ss|');
        assert.throws(() => V.ID('x'.repeat(100)), /over 100/);
    });

    // ----- routing against a fake interaction -----
    const fake = (customId, { user = OWNER_ID, options = {}, modal = false, slash = false } = {}) => {
        const calls = [];
        const i = {
            customId, user: { id: user }, calls, deferred: false, replied: false, message: slash ? null : { id: 'm' },
            isModalSubmit: () => modal, isChatInputCommand: () => slash, isStringSelectMenu: () => false,
            options: { getString: (k) => options[k] ?? null },
            deferUpdate: async () => { i.deferred = true; calls.push('deferUpdate'); },
            deferReply: async () => { i.deferred = true; calls.push('deferReply'); },
            showModal: async (m) => { calls.push(['showModal', (m.toJSON ? m.toJSON() : m).custom_id]); i.replied = true; },
            reply: async () => { i.replied = true; calls.push('reply'); },
            followUp: async () => { calls.push('followUp'); },
        };
        return i;
    };
    await check('the slash options open their pop-up as the FIRST answer, with this panel\'s own ids', async () => {
        currentDoc = fullDraft();
        const cases = [['live', 'titles', 'mng_ss|tm|live'], ['live', 'newseason', 'modal_wipe_season'], ['draft', 'titles', 'mng_ss|tm|draft'], ['draft', 'draws', 'mng_ss|drm'], ['draft', 'calendar', 'mng_ss|calm']];
        for (const [view, act, id] of cases) {
            const i = fake('x', { options: { do: act }, slash: true });
            await P.openFromSlash(i, view);
            assert.deepStrictEqual(i.calls, [['showModal', id]], `${view} ${act}: ${JSON.stringify(i.calls)}`);
        }
    });
    await check('a bare slash command opens the view; a button re-ids the draft pop-ups with their fields', async () => {
        const i = fake('x', { slash: true });
        sent = null;
        await P.openFromSlash(i, 'live');
        assert.deepStrictEqual(i.calls, ['deferReply']);
        assert.ok(sent && limits(sent, 'sent live') === undefined);
        const b = fake('mng_ss|tl|draft');
        let shown = null; b.showModal = async (m) => { shown = m; };
        await P.handleSeasonPanelInteraction(b);
        const ids = []; walk(shown.components, c => { if (c.custom_id) ids.push(c.custom_id); });
        assert.strictEqual(shown.custom_id, 'mng_ss|tm|draft');
        assert.deepStrictEqual(ids, ['main_title', 'bp_line', 'rank_line', 'dmz_line', 'season_emoji']);
    });
    await check('only ids starting mng_ss| are handled; others fall through', async () => {
        assert.strictEqual(await P.handleSeasonPanelInteraction(fake('mng_dr|page')), false);
        assert.strictEqual(await P.handleSeasonPanelInteraction({ customId: undefined }), false);
        assert.strictEqual(await P.handleSeasonPanelInteraction(fake('mng_ss|view|live')), true);
    });
    await check('Promote and Discard run the existing logic for the owner, and never for someone without access', async () => {
        const S = require('../handlers/manage/season');
        const ran = [];
        S.runPromoteDraft = async (id) => { ran.push(['promote', id]); return { ok: true, message: '**Draft promoted to live!** "x"' }; };
        S.runDiscardDraft = async (id) => { ran.push(['discard', id]); return { ok: true, message: '**Draft discarded.**' }; };
        currentDoc = fullDraft();
        await P.handleSeasonPanelInteraction(fake('mng_ss|promoteok'));
        await P.handleSeasonPanelInteraction(fake('mng_ss|discardok'));
        assert.deepStrictEqual(ran, [['promote', OWNER_ID], ['discard', OWNER_ID]]);
        const stranger = '999999999999999999';
        for (const v of ['promoteok', 'discardok', 'promote', 'discard']) await P.handleSeasonPanelInteraction(fake(`mng_ss|${v}`, { user: stranger }));
        assert.strictEqual(ran.length, 2, 'a user with no grant reached the write');
    });
    await check('Promote with nothing staged says so instead of opening a confirm', async () => {
        currentDoc = emptyDraft();
        sent = null;
        await P.handleSeasonPanelInteraction(fake('mng_ss|promote'));
        assert.match(allText(sent), /No draft in progress — nothing to promote/);
        assert.ok(!/promoteok/.test(JSON.stringify(sent)));
    });
    await check('the lifted save functions are exported and the old handlers still use them', () => {
        const S = require('../handlers/manage/season');
        for (const f of ['saveTitlesDeadlines', 'saveDraftDraws', 'saveDraftCalendar', 'runPromoteDraft', 'runDiscardDraft', 'readTitleFields', 'setTitlesDeadlines', 'handleDraftButton', 'promptWipeSeason', 'handleWipeButton']) assert.strictEqual(typeof S[f], 'function', f);
    });

    console.log(failed ? `\n${failed} check(s) FAILED.` : '\nAll manage season panel checks passed.');
    process.exit(failed ? 1 : 0);
})();
