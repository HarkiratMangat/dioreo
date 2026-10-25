// scripts/reminders.test.js -- reminders by DM (utils/reminders.js), with no Discord and no database: what is due on a game day, each person's share, the DM's order, the /remind panel, the one-thing follow merge, /remind's set: values and autocomplete, the failed-DM rule, the 00:01 UTC run time and the bell. The design: docs/superpowers/specs/2026-10-23-notifications-design.md.
const assert = require('assert');
const mongoose = require('mongoose');
const R = require('../utils/reminders');
const emojis = require('../utils/emojiMap');

let passed = 0, failed = 0;
function t(name, fn) { try { fn(); passed++; console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name}\n      ${e.message}`); } }

const DAY = 86400000;
const DAY0 = Date.UTC(2026, 9, 25); // the game day under test
const RUN = DAY0 + 60000; // 00:01 UTC
const d = ms => new Date(ms);
function doc(extra = {}) {
    return {
        currentSeasonTitle: 'Season 9 — Test', bpTitle: 'Battle Pass', rankTitle: 'Ranked', dmzTitle: 'DMZ',
        bpStart: d(DAY0), bpEnd: d(DAY0 + 2.5 * DAY), rankEnd: d(DAY0 + 0.5 * DAY), dmzEnd: d(DAY0 + 30 * DAY),
        newDraws: [{ title: 'Black Hole Draw', date: d(DAY0), items: [{ tier: 'legendary', name: 'DL Q33 — Dark Void' }] }],
        returningDraws: [{ title: 'Grim Duo Draw', date: d(DAY0 + 3 * DAY), items: [] }],
        calendar: [
            { title: 'Halloween Sale', category: 'event', date: d(DAY0 - 3 * DAY), endDate: d(DAY0 + 1.5 * DAY) },
            { title: 'Rust 10v10', category: 'playlist', date: d(DAY0 - 5 * DAY), endDate: d(DAY0 + 0.5 * DAY) },
            { title: 'Call of the Dead', category: 'event', date: d(DAY0 + 4 * DAY), endDate: d(DAY0 + 20 * DAY) },
        ],
        patchNotes: [{ _id: mongoose.Types.ObjectId.createFromTime(Math.floor((RUN - 3600000) / 1000)), title: 'Season 9 patch' }, { _id: mongoose.Types.ObjectId.createFromTime(Math.floor((RUN - 3 * DAY) / 1000)), title: 'Old patch' }],
        ...extra,
    };
}
const sub = extra => ({ discordId: 'u1', categories: [], follows: [], ...extra });
const text = list => JSON.stringify(list);
const countComponents = list => { let n = 0; const walk = c => { n++; (c.components || []).forEach(walk); if (c.accessory) walk(c.accessory); }; list.forEach(walk); return n; };

t('what is due at 00:01 UTC: released today, leaving soon (2 days), last chance (1 day), the new season, season ends and new patch notes', () => {
    const due = R.computeDue(doc(), RUN);
    assert.strictEqual(due.day, '2026-10-25');
    assert.deepStrictEqual(due.released.map(e => [e.title, e.category]), [['Black Hole Draw', 'newDraws']]);
    assert.deepStrictEqual(due.leavingSoon.map(e => e.title), ['Halloween Sale']);
    assert.deepStrictEqual(due.lastChance.map(e => e.title), ['Rust 10v10']);
    assert.ok(due.newSeason && due.newSeason.title === 'Season 9 — Test');
    assert.deepStrictEqual(due.seasonEnds.map(s => [s.category, s.last]), [['bpEnding', false], ['rankEnding', true]], 'BP 3 days out, Ranked on its last day, DMZ not yet');
    assert.deepStrictEqual(due.patchNotes, ['Season 9 patch'], 'only patch notes added in the last day');
});

t('each person gets only what they follow; nothing followed means no DM', () => {
    const due = R.computeDue(doc(), RUN);
    assert.strictEqual(R.personalise(sub(), due), null);
    assert.strictEqual(R.personalise(sub({ categories: ['returningDraws'] }), due), null, 'no returning draw released today');
    const p = R.personalise(sub({ categories: ['newDraws', 'bpEnding'] }), due);
    assert.deepStrictEqual(p.released.map(e => e.title), ['Black Hole Draw']);
    assert.deepStrictEqual(p.seasonEnds.map(s => s.category), ['bpEnding']);
    assert.strictEqual(p.lastChance.length + p.leavingSoon.length + p.patchNotes.length, 0);
});

t('one-thing follows fire and are used up: a release once it releases, a leaving follow once its last chance has gone', () => {
    const due = R.computeDue(doc(), RUN);
    const follows = [{ kind: 'release', title: 'Black Hole Draw' }, { kind: 'leaving', title: 'Halloween Sale' }, { kind: 'leaving', title: 'Rust 10v10' }, { kind: 'release', title: 'Grim Duo Draw' }];
    const p = R.personalise(sub({ follows }), due);
    assert.deepStrictEqual(p.released.map(e => [e.title, e.followed]), [['Black Hole Draw', true]]);
    assert.deepStrictEqual(p.leavingSoon.map(e => e.title), ['Halloween Sale'], 'leaving soon fires but the follow stays for its last chance');
    assert.deepStrictEqual(p.lastChance.map(e => e.title), ['Rust 10v10']);
    assert.deepStrictEqual(p.fired.map(f => f.title), ['Black Hole Draw', 'Rust 10v10']);
});

t('the DM: his order (last chance, leaving soon, released, season, patch notes) and a Manage reminders button', () => {
    const due = R.computeDue(doc(), RUN);
    const p = R.personalise(sub({ categories: ['newDraws', 'leaving', 'bpEnding', 'patchNotes', 'newSeason'] }), due);
    const dm = R.buildReminderDM(p, doc(), { nowMs: RUN });
    const s = text(dm);
    const order = ['Heads up, last chance', 'Heads up, leaving soon', 'Released', 'New season', 'Season', 'Patch notes'].map(h => s.indexOf(`### `) >= 0 && s.indexOf(h));
    assert.ok(order.every(i => i > 0), `every section present: ${order}`);
    assert.deepStrictEqual([...order].sort((a, b) => a - b), order, 'in his order');
    assert.ok(s.includes('"custom_id":"remind_open"'), 'Manage reminders');
    assert.ok(countComponents(dm) <= 40);
    assert.strictEqual(R.buildReminderDM(null, doc()), null);
});

t('with the digest on, the DM is the /today brief with followed items marked by the bell', () => {
    const due = R.computeDue(doc(), RUN);
    const p = R.personalise(sub({ categories: ['digest', 'bpEnding'], follows: [{ kind: 'release', title: 'Black Hole Draw' }] }), due);
    const s = text(R.buildReminderDM(p, doc(), { nowMs: RUN }));
    assert.ok(s.includes('Your daily brief'));
    assert.ok(s.includes(`Black Hole Draw ${emojis.reminderEnabled}`), 'the followed draw is marked');
    assert.ok(s.includes('ends in 3 days'), 'season ends ride under the brief');
    assert.ok(!s.includes('Heads up, last chance'), 'the brief replaces the plain lists');
});

t('the panel: a toggle per category, green when on, two dropdowns with follows pre-picked, under 40 components, every id unique and owned', () => {
    const panel = R.buildPanel(sub({ categories: ['newDraws'], follows: [{ kind: 'release', title: 'Grim Duo Draw' }] }), doc(), { ownerId: 'u1', nowMs: RUN });
    const ids = [...text(panel).matchAll(/"custom_id":"([^"]+)"/g)].map(m => m[1]);
    assert.strictEqual(new Set(ids).size, ids.length, 'unique ids');
    assert.ok(ids.every(id => id.endsWith(':u1')), 'every control carries its owner');
    assert.strictEqual(ids.filter(id => id.startsWith('remind_cat:')).length, R.CATEGORIES.filter(c => c.key !== 'leaving').length, 'a button per category, the four leaving kinds included; the older all-kinds key has none');
    const buttons = []; const walk = c => { if (c.type === 2) buttons.push(c); (c.components || []).forEach(walk); }; panel.forEach(walk);
    assert.strictEqual(buttons.find(b => b.custom_id === 'remind_cat:newDraws:u1').style, 3);
    assert.strictEqual(buttons.find(b => b.custom_id === 'remind_cat:events:u1').style, 2);
    const s = text(panel);
    assert.ok(s.includes('"custom_id":"remind_rel:u1"') && s.includes('"custom_id":"remind_lv:u1"'));
    const rel = []; const find = c => { if (c.custom_id === 'remind_rel:u1') rel.push(...c.options); (c.components || []).forEach(find); }; panel.forEach(find);
    assert.strictEqual(rel.find(o => o.value === 'Grim Duo Draw')?.default, true, 'a followed release is pre-picked (Discord\'s own multi-select)');
    assert.ok(!rel.find(o => o.value === 'Call of the Dead')?.default);
    assert.ok(s.includes('When something releases...') && s.includes('When something leaves soon...'), 'each dropdown under its label');
    assert.ok(countComponents(panel) <= 40, `components: ${countComponents(panel)}`);
    assert.ok(s.includes('remind_stop:u1'));
    assert.ok(s.includes('remind_test:u1'), 'Send a test beside the header');
    for (const [, title] of R.PANEL_GROUPS) assert.ok(s.includes(`**${title}**`), `the ${title} group label`);
    assert.deepStrictEqual(R.PANEL_GROUPS.map(([key]) => R.CATEGORIES.filter(c => c.group === key).length), [4, 4, 2], 'every category in a group, at most 5 to a row');
    assert.ok(!R.buildPanel(null, doc(), { ownerId: 'u1', nowMs: RUN }).some(c => text(c).includes('remind_stop:')), 'nothing to stop with no record');
});

t('the one-time timezone tip: a Set timezone button, then a confirmation with none', () => {
    const tip = text(R.buildTimezoneNote('u1'));
    assert.ok(tip.includes('"custom_id":"remind_tzdm:u1"') && tip.includes('UTC'));
    const done = text(R.buildTimezoneNote('u1', { setTo: 'Toronto (America)' }));
    assert.ok(done.includes('Toronto (America)') && !done.includes('remind_tzdm'));
});

t('Leaving soon by kind: the old all-kinds key reads as all four, and one kind covers only its own', () => {
    assert.strictEqual(R.leavingKeys(new Set(['leaving'])).size, 4);
    const panel = R.buildPanel(sub({ categories: ['leavingNewDraws'] }), doc(), { ownerId: 'u1', nowMs: RUN });
    const s = text(panel);
    const btns = []; const wb = c => { if (c.type === 2) btns.push(c); (c.components || []).forEach(wb); }; panel.forEach(wb);
    assert.strictEqual(btns.find(b => b.custom_id === 'remind_cat:leavingNewDraws:u1')?.style, 3, 'New draws leaving is green');
    assert.strictEqual(btns.find(b => b.custom_id === 'remind_cat:leavingEvents:u1')?.style, 2);
    assert.ok(!s.includes('remind_cat:leaving:'), 'no all-kinds button');
    const lv = []; const f = c => { if (c.custom_id === 'remind_lv:u1') lv.push(...c.options); (c.components || []).forEach(f); }; panel.forEach(f);
    const { leaving } = R.followable(doc(), RUN);
    const newDraws = leaving.slice(0, R.MAX_OPTIONS).filter(e => e.kind === 'New draw').length;
    assert.strictEqual(lv.filter(o => o.description === 'Already on through New draws leaving').length, newDraws, 'only new draws are covered');
    const due = R.computeDue(doc(), RUN);
    const p = R.personalise(sub({ categories: ['leavingEvents'] }), due);
    assert.ok([...p.lastChance, ...p.leavingSoon].every(e => e.type === 'event'), 'only events remind before leaving');
});

t('the busiest panel stays within 40: every toggle on, follows, paused, and each of its states', () => {
    const busy = sub({ categories: R.CATEGORIES.map(c => c.key).filter(k => k !== 'leaving'), follows: [{ kind: 'release', title: 'Grim Duo Draw' }], pausedAt: new Date(RUN), failingSince: new Date(RUN) });
    const zones = [{ label: 'Toronto (EDT)', value: 'America/Toronto' }];
    for (const opts of [{}, { confirmStop: true }, { zoneOptions: zones }]) {
        const n = require('../commands/today').countComponents(R.buildPanel(busy, doc(), { ownerId: 'u1', nowMs: RUN, ...opts }));
        assert.ok(n <= 40, `${JSON.stringify(Object.keys(opts))}: ${n} components`);
    }
});

t('a group toggle that is on marks what it covers in the dropdowns', () => {
    const { releases } = R.followable(doc(), RUN);
    const events = releases.slice(0, R.MAX_OPTIONS).filter(e => e.type === 'event');
    assert.ok(events.length, 'the fixture has an upcoming event');
    const panel = R.buildPanel(sub({ categories: ['events', 'leaving'] }), doc(), { ownerId: 'u1', nowMs: RUN });
    const opts = id => { const o = []; const f = c => { if (c.custom_id === id) o.push(...c.options); (c.components || []).forEach(f); }; panel.forEach(f); return o; };
    const rel = opts('remind_rel:u1'), lv = opts('remind_lv:u1');
    assert.strictEqual(rel.filter(o => o.description === 'Already on through Events').length, events.length, 'every upcoming event is marked');
    assert.ok(lv.length && lv.every(o => o.description === 'Already on through Leaving soon'), 'Leaving soon covers every leaving option');
    assert.ok(!rel.slice(0, rel.length - events.length).some(o => o.description.startsWith('Already on')), 'covered ones sit at the bottom');
});

t('a dropdown submit keeps the follows it could not list, and Stop all asks first', () => {
    const merged = R.mergeFollows([{ kind: 'release', title: 'A' }, { kind: 'release', title: 'Z (not listed)' }, { kind: 'leaving', title: 'A' }], 'release', ['A', 'B'], ['B']);
    assert.deepStrictEqual(merged, [{ kind: 'release', title: 'Z (not listed)' }, { kind: 'leaving', title: 'A' }, { kind: 'release', title: 'B' }]);
    const confirm = text(R.buildPanel(sub({ categories: ['events'] }), doc(), { ownerId: 'u1', nowMs: RUN, confirmStop: true }));
    assert.ok(confirm.includes('remind_stopyes:u1') && confirm.includes('remind_stopno:u1'));
});

t("/remind's set: values and autocomplete: categories pinned first, entries twice, free text read as a release or a leaving follow", () => {
    assert.deepStrictEqual(R.resolveSetValue('cat:newDraws', doc(), RUN), { type: 'category', key: 'newDraws', label: 'New draws' });
    assert.deepStrictEqual(R.resolveSetValue('rel:Grim Duo Draw', doc(), RUN), { type: 'follow', kind: 'release', title: 'Grim Duo Draw' });
    assert.deepStrictEqual(R.resolveSetValue('halloween', doc(), RUN), { type: 'follow', kind: 'leaving', title: 'Halloween Sale' }, 'live, so leaving');
    assert.deepStrictEqual(R.resolveSetValue('call of the', doc(), RUN), { type: 'follow', kind: 'release', title: 'Call of the Dead' }, 'not out yet, so release');
    assert.strictEqual(R.resolveSetValue('cat:nope', doc(), RUN), null);
    const all = R.autocompleteChoices('', doc(), RUN);
    assert.deepStrictEqual(all.slice(0, R.CATEGORIES.length).map(c => c.value), R.CATEGORIES.map(c => `cat:${c.key}`));
    assert.ok(all.length <= 25 && all.every(c => c.name.length <= 100 && c.value.length <= 100));
    const grim = R.autocompleteChoices('grim', doc(), RUN);
    assert.deepStrictEqual(grim.map(c => c.value), ['rel:Grim Duo Draw']);
});

t('failed DMs, his rule: a note on the first failure; paused once the note was shown and 3 more days fail', () => {
    const first = R.failureUpdate(sub(), RUN);
    assert.strictEqual(first.noteDue, true);
    assert.ok(!first.pausedAt);
    const again = R.failureUpdate(sub({ failingSince: d(RUN - DAY), noteShownAt: d(RUN - 2 * DAY) }), RUN);
    assert.ok(!again.pausedAt && !again.noteDue, 'two days after the note: not yet');
    const paused = R.failureUpdate(sub({ failingSince: d(RUN - 5 * DAY), noteShownAt: d(RUN - 3 * DAY) }), RUN);
    assert.ok(paused.pausedAt && paused.pauseNoteShown === false);
    assert.deepStrictEqual([paused.categories, paused.follows], [[], []], 'turned off: what they followed is cleared');
    const note = JSON.stringify(R.buildPanel(sub({ pausedAt: d(RUN) }), doc(), { ownerId: 'u1', nowMs: RUN }));
    assert.ok(note.includes('so they were turned off') && !note.includes('remind_resume'), 'a warning line in the header, no Turn back on');
    assert.ok(R.isRefusal({ code: 50278 }) && R.isRefusal({ rawError: { code: 50007 } }) && !R.isRefusal({ code: 500 }));
});

t('the run is at 00:01 UTC', () => {
    assert.strictEqual(R.msUntilNextRun(DAY0), 60000);
    assert.strictEqual(R.msUntilNextRun(RUN), DAY);
    assert.strictEqual(R.msUntilNextRun(DAY0 + 12 * 3600000), 12 * 3600000 + 60000);
});

t('the bell: a grey emoji-only button on a title, and on /today', () => {
    const [wrapped] = R.withBell({ type: 10, content: '## Title' });
    assert.deepStrictEqual([wrapped.type, wrapped.components[0].content, wrapped.accessory.custom_id, wrapped.accessory.style, wrapped.accessory.label], [9, '## Title', 'remind_open', 2, undefined]);
    const media = { type: 12, items: [] };
    assert.deepStrictEqual(R.withBell(media), [media], 'anything but a text display passes through');
    const split = R.withBell({ type: 10, content: '## Title\n***Season 9***\n-# teaser' });
    assert.deepStrictEqual([split.length, split[0].components[0].content, split[1].content], [2, '## Title', '***Season 9***\n-# teaser'], 'only the title sits beside the bell; the subtitle gets its own full-width line');
    const today = require('../commands/today').buildTodayContainer(doc(), { nowMs: RUN });
    assert.strictEqual(today[0].components[0].accessory?.custom_id, 'remind_open');
});

t('Send a test: today\'s real reminder when reminders are on, a "nothing at today\'s update" card when nothing fired, the plain card when nothing is on', () => {
    const before = RUN + 60 * 1000; // a minute after the run, so today's daily update is RUN
    const real = JSON.stringify(R.buildTestDM({ categories: [...R.CATEGORY_KEYS].filter(k => k !== 'digest'), follows: [] }, doc(), { nowMs: before }));
    assert.ok(real.includes("A test: this is your reminder from today's daily update") && real.includes('Your reminders'), 'the real DM under a test note');
    const brief = JSON.stringify(R.buildTestDM({ categories: ['digest'], follows: [] }, doc(), { nowMs: before }));
    assert.ok(brief.includes('Your daily brief'), 'with the digest on, the test is the daily brief');
    const quiet = JSON.stringify(R.buildTestDM({ categories: [], follows: [{ kind: 'release', title: 'No Such Draw' }] }, doc(), { nowMs: before }));
    assert.ok(quiet.includes("Nothing at today's daily update") && quiet.includes('No Such Draw (when it releases)'), 'nothing fires: says so and lists what they follow');
    assert.ok(JSON.stringify(R.buildTestDM(null, doc(), { nowMs: before })).includes('Test reminder'), 'nothing on: the plain test card');
});

t("the dropdowns write each time in the reader's zone, since Discord draws no <t:> codes in option text", () => {
    const opts = JSON.stringify(R.buildPanel(null, doc(), { ownerId: '1', nowMs: RUN, timeZone: 'America/Toronto' }));
    assert.ok(/releases [A-Z][a-z]{2} \d+, \d+(:\d\d)? [AP]M E[DS]T/.test(opts), 'a written-out Toronto time');
    assert.ok(!opts.includes('"description":"') || !/description":"[^"]*<t:/.test(opts), 'no timestamp codes in option text');
    assert.ok(/ UTC"/.test(JSON.stringify(R.buildPanel(null, doc(), { ownerId: '1', nowMs: RUN, timeZone: 'Not/AZone' }))), 'an unknown zone falls back to UTC');
    assert.ok(/releases [A-Z][a-z]{2} \d+ UTC"/.test(JSON.stringify(R.buildPanel(null, doc(), { ownerId: '1', nowMs: RUN }))), 'no zone saved: "Oct 28 UTC"');
});

t('Set timezone: a button on the panel; the picker swaps the foot for the zones, a search option and Cancel', () => {
    const sub = { categories: ['newDraws'], follows: [] };
    const normal = JSON.stringify(R.buildPanel(sub, doc(), { ownerId: '1', nowMs: RUN }));
    assert.ok(normal.includes('remind_tz:1') && normal.includes('Set timezone') && normal.includes('remind_stop:1'), 'Set timezone sits in the foot beside Stop all');
    const btn = (opts) => R.buildPanel(sub, doc(), { ownerId: '1', nowMs: RUN, ...opts })[0].components.flatMap(c => c.components || []).find(c => c.custom_id === 'remind_tz:1');
    assert.deepStrictEqual([btn({}).style, btn({}).label], [1, 'Set timezone'], 'no zone chosen: blue Set timezone');
    assert.deepStrictEqual([btn({ timeZone: 'Asia/Tokyo' }).style, btn({ timeZone: 'Asia/Tokyo' }).label], [2, 'Adjust timezone'], 'a zone chosen: grey Adjust timezone');
    const zones = [{ label: 'Toronto (EDT)', value: 'America/Toronto' }, { label: 'London (GMT)', value: 'Europe/London' }];
    const picking = R.buildPanel(sub, doc(), { ownerId: '1', nowMs: RUN, zoneOptions: zones });
    const ps = JSON.stringify(picking);
    assert.ok(ps.includes('remind_tzset:1') && ps.includes('__search__') && ps.includes('remind_tzcancel:1'), 'the picker, its search option and Cancel');
    assert.ok(!ps.includes('remind_stop:1') && !ps.includes('remind_tz:1'), 'no Stop all or second Set timezone while picking');
    assert.ok(require('../commands/today').countComponents(picking) <= 40, 'under 40 components');
});

t('Stop all asks on its own: a warning heading, "Yes, stop all!" and Keep them with its icon, and no timezone button', () => {
    const conf = R.buildPanel({ categories: ['newDraws'], follows: [{ kind: 'release', title: 'Grim Duo Draw' }] }, doc(), { ownerId: '1', nowMs: RUN, confirmStop: true });
    const cs = JSON.stringify(conf);
    assert.ok(!cs.includes('remind_test:1') && cs.includes('remind_rel:1') && cs.includes('remind_lv:1'), 'no Send a test, both dropdowns kept');
    assert.ok(require('../commands/today').countComponents(conf) <= 40, 'within 40');
    const ps = JSON.stringify(R.buildPanel({ categories: ['newDraws'], follows: [] }, doc(), { ownerId: '1', nowMs: RUN, confirmStop: true }));
    assert.ok(ps.includes("Stop All clears every reminder you've set!") && ps.includes('"Yes, stop all!"') && ps.includes('"Keep them"'), 'the warning and the two choices');
    assert.ok(!ps.includes('remind_tz:1') && !ps.includes('and delete'), 'no Set timezone, no "and delete"');
});

console.log(`\n${failed ? 'FAILED' : 'all passed'}: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
