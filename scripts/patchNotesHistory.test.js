// /patch notes keeps every season (2026-10-19 00:29 EDT, Harkirat): the dropdown lists the 12 newest, Search Older Seasons finds the rest, and each season title carries its emoji.
const assert = require('assert');
const pn = require('../commands/patchnotes');
const emojis = require('../utils/emojiMap');

let passed = 0, failed = 0;
function t(name, fn) { try { fn(); passed++; console.log(`  PASS  ${name}`); } catch (e) { failed++; console.log(`  FAIL  ${name}\n        ${e.message}`); } }

const NAMES = { 6: 'Take Your Heart', 7: 'Terminated', 8: 'Against All Fate', 9: 'Vampires vs Werewolves' };
const patch = n => ({ _id: { toString: () => `id${n}` }, title: `Season ${n} — ${NAMES[n] || `Name ${n}`}`, releaseDate: new Date('2026-01-01T00:00:00Z'), images: ['https://example.com/a.png'], description: '' });
const doc = n => ({ patchNotes: Array.from({ length: n }, (_, i) => patch(i + 1)) });
const flat = c => [c, ...((c.components || []).flatMap(flat)), ...(c.accessory ? flat(c.accessory) : [])];
const select = panel => panel.flatMap(flat).find(c => c.type === 3 && c.custom_id === 'select_patch_history');

t('the dropdown lists the 12 newest, newest first, and the newest is open', () => {
    const s = select(pn.buildContainer(doc(20)));
    assert.deepStrictEqual(s.options.map(o => o.value), Array.from({ length: 12 }, (_, i) => `patch_id${20 - i}`));
    assert.ok(s.options[0].default);
});
t('Search Older Seasons shows only past 12', () => {
    const has = n => pn.buildContainer(doc(n)).flatMap(flat).some(c => c.custom_id === 'patch_search_open');
    assert.deepStrictEqual([has(12), has(13)], [false, true]);
});
t('an older season opened from search joins the list, picked', () => {
    const s = select(pn.buildContainer(doc(20), 'id3'));
    assert.strictEqual(s.options.length, 13);
    assert.ok(s.options.find(o => o.value === 'patch_id3').default);
});
t('each season title carries its emoji, in the heading and the dropdown', () => {
    for (const n of [6, 7, 8, 9]) assert.strictEqual(pn.seasonEmoji(patch(n)), emojis[`season${n}`]);
    assert.strictEqual(pn.seasonEmoji(patch(5)), null, 'no emoji, nothing added');
    const panel = pn.buildContainer({ patchNotes: [6, 7, 8, 9].map(patch) });
    // The title row holds only the heading since 2026-10-24 21:38 EDT; the season line is the next Text Display (utils/reminders.js withBell).
    const texts = panel.flatMap(flat).filter(c => c.type === 10).map(c => c.content);
    assert.ok(texts[1].split('\n')[0].startsWith(`${emojis.season9} `), texts.slice(0, 2).join(' | '));
    assert.deepStrictEqual(select(panel).options.map(o => o.emoji && o.emoji.name), ['S9VampiresVsWerewolves', 'S8AgainstAllFate', 'S7Terminated', 'S6TakeYourHeart']);
});
t('search finds by number exactly, by name, newest first, and nothing for no match', () => {
    const list = doc(20).patchNotes;
    assert.strictEqual(pn.findPatchByQuery(list, '1').title, 'Season 1 — Name 1', 'not Season 10-19');
    assert.strictEqual(pn.findPatchByQuery(list, 'season 7').title, 'Season 7 — Terminated');
    assert.strictEqual(pn.findPatchByQuery(list, 'terminat').title, 'Season 7 — Terminated');
    assert.strictEqual(pn.findPatchByQuery(list, 'zzz'), null);
    assert.strictEqual(pn.findPatchByQuery(list, '  '), null);
});
t('the search pop-up is one required text field', () => {
    const m = pn.buildSearchModal();
    assert.strictEqual(m.custom_id, 'patch_search_submit');
    assert.deepStrictEqual(m.components.map(c => [c.type, c.component.type, c.component.custom_id, c.component.required]), [[18, 4, 'q', true]]);
    const { ModalBuilder } = require('discord.js');
    new ModalBuilder(m);
});

t("each season's dates are its description: the newest reads Current Season, an older one runs to the next release (2026-10-25 15:09 EDT)", () => {
    const at = (n, iso) => ({ ...patch(n), releaseDate: new Date(iso) });
    const s = select(pn.buildContainer({ patchNotes: [at(6, '2025-12-10T10:00:00Z'), at(7, '2026-01-14T10:00:00Z'), at(8, '2026-02-18T10:00:00Z')] }));
    assert.deepStrictEqual(s.options.map(o => o.description), ['Current Season', 'Jan 14 – Feb 18, 2026', 'Dec 10, 2025 – Jan 14, 2026']);
    assert.ok(s.options.every(o => o.description.length <= 100), 'within a description\'s 100 characters');
});

t("the live season reads its Battle Pass dates and a newer one reads Upcoming Season (2026-10-28)", () => {
    const at = (n, iso) => ({ ...patch(n), releaseDate: new Date(iso) });
    const notes = [at(8, '2026-08-25T10:00:00Z'), at(9, '2026-09-23T10:00:00Z'), at(10, '2026-10-28T10:00:00Z')];
    const descriptions = extra => select(pn.buildContainer({ patchNotes: notes, currentSeasonTitle: 'Season 9 — Vampires vs Werewolves', ...extra })).options.map(o => o.description);
    // 2026-10-28 18:20 UTC: the live season reads "– Active" even with its end set; only an end already passed closes the range.
    const bp = { bpStart: new Date('2026-09-23T00:00:00Z'), bpEnd: new Date('2099-11-04T00:00:00Z') };
    assert.deepStrictEqual(descriptions(bp), ['Upcoming Season', 'Sep 23, 2026 – Active', 'Aug 25 – Sep 23, 2026']);
    assert.strictEqual(descriptions({ ...bp, bpEndTBD: true })[1], 'Sep 23, 2026 – Active');
    assert.strictEqual(descriptions({ bpStart: new Date('2020-09-23T00:00:00Z'), bpEnd: new Date('2020-11-04T00:00:00Z') })[1], 'Sep 23 – Nov 4, 2020', 'an end already passed');
    assert.strictEqual(descriptions({})[1], 'Current Season', 'no Battle Pass start: no dates to show');
    const staged = { draft: { active: true, bpStart: new Date('2026-11-04T00:00:00Z'), bpEnd: new Date('2027-01-06T00:00:00Z') } };
    assert.strictEqual(descriptions({ ...bp, ...staged })[0], 'Nov 4, 2026 – Jan 6, 2027');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
