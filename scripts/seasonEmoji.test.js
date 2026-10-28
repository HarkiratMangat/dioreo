// The season's emoji in front of every caption that states the season title (2026-10-19 09:26 EDT, Harkirat), and /manage's season title box taking one typed in front (2026-10-19 09:30 EDT, his pick "Add it").
const assert = require('assert');
const emojis = require('../utils/emojiMap');
const { splitSeasonEmoji, seasonEmojiFor } = require('../utils/seasonEmoji');
const { readSeasonTitle } = require('../core/ops/season');
const draws = require('../commands/draws');
const calendar = require('../commands/calendar');
const pn = require('../commands/patchnotes');

let passed = 0, failed = 0;
function t(name, fn) { try { fn(); passed++; console.log(`  PASS  ${name}`); } catch (e) { failed++; console.log(`  FAIL  ${name}\n        ${e.message}`); } }

const S10 = '<a:S10Test:1234567890>';
// A title may sit inside a Section since the reminders bell rides on it (2026-10-23 21:38 EDT, utils/reminders.js withBell). Since 2026-10-24 21:38 EDT the bell's Section holds only the title line; the season caption is the first line of the Text Display after it (utils/reminders.js withBell). `comps` is the container's components.
const caption = comps => { const i = comps.findIndex(c => c.type === 9); return i === -1 ? comps[0].content.split('\n')[1] : comps[i + 1].content.split('\n')[0]; };

t('a custom emoji typed in front of the title splits off; the title stays plain', () => {
    assert.deepStrictEqual(splitSeasonEmoji(`${S10} Season 10 — Test`), { emoji: S10, title: 'Season 10 — Test' });
    assert.deepStrictEqual(splitSeasonEmoji(`  ${S10}Season 10`), { emoji: S10, title: 'Season 10' }, 'no space after it is fine');
    assert.deepStrictEqual(splitSeasonEmoji('<:S10Still:42> Season 10'), { emoji: '<:S10Still:42>', title: 'Season 10' }, 'a still emoji too');
    assert.deepStrictEqual(splitSeasonEmoji(`Season 10 ${S10}`), { emoji: '', title: `Season 10 ${S10}` }, 'only one in FRONT is taken');
    assert.deepStrictEqual(splitSeasonEmoji(''), { emoji: '', title: '' });
});

t('the stored emoji wins, then the season{N} map, then none', () => {
    assert.strictEqual(seasonEmojiFor('Season 7 — Terminated', S10), S10);
    assert.strictEqual(seasonEmojiFor('Season 7 — Terminated', ''), emojis.season7);
    assert.strictEqual(seasonEmojiFor('Season 10 — 7th Anniversary', ''), emojis.season10, 'Season 10 has its map entry (2026-10-28)');
    assert.strictEqual(seasonEmojiFor('Season 11 — Test', ''), null, 'no map entry, nothing added');
    assert.strictEqual(seasonEmojiFor('Halloween', ''), null);
});

t('the modal keeps, sets or clears the emoji; the portal never clears it by omission', () => {
    assert.deepStrictEqual(readSeasonTitle({ mainTitle: `${S10} Season 10` }, ''), { title: 'Season 10', emoji: S10 }, 'typed: set');
    assert.deepStrictEqual(readSeasonTitle({ mainTitle: 'Season 10' }, S10), { title: 'Season 10', emoji: '' }, 'deleted from the pre-filled box: cleared');
    assert.deepStrictEqual(readSeasonTitle({ currentSeasonTitle: 'Season 10' }, S10), { title: 'Season 10', emoji: S10 }, 'the portal has no emoji box: kept');
    assert.deepStrictEqual(readSeasonTitle({ currentSeasonTitle: 'Season 10', currentSeasonEmoji: '' }, S10), { title: 'Season 10', emoji: '' }, 'an explicit blank clears');
    assert.deepStrictEqual(readSeasonTitle({}, S10), { title: '', emoji: S10 }, 'no title submitted: nothing changes');
});

const seasonDoc = extra => ({ currentSeasonTitle: 'Season 7 — Terminated', newDraws: [], returningDraws: [], calendar: [], ...extra });

t('/draws puts the season emoji in front of the season title, outside the bold-italic lettering', () => {
    for (const page of ['new', 'returning']) {
        const title = draws.buildContainer(seasonDoc(), page)[0].components;
        assert.ok(caption(title).startsWith(`${emojis.season7} `), caption(title));
    }
    const stored = draws.buildContainer(seasonDoc({ currentSeasonTitle: 'Season 10 — Test', currentSeasonEmoji: S10 }))[0].components;
    assert.ok(caption(stored).startsWith(`${S10} `), 'the stored emoji survives intact');
});

t('/calendar does the same', () => {
    const panel = calendar.buildContainer(seasonDoc(), 0);
    const title = panel[0].components;
    assert.ok(caption(title).startsWith(`${emojis.season7} `), caption(title));
});

t('/patch notes prefers the synced emoji, takes one typed in an entry\'s own title, and keeps labels plain', () => {
    const entry = extra => ({ _id: { toString: () => 'p1' }, title: 'Season 10 — Test', releaseDate: new Date('2026-10-01T00:00:00Z'), images: ['https://example.com/a.png'], description: '', ...extra });
    assert.strictEqual(pn.seasonEmoji(entry({ emoji: S10 })), S10);
    const typed = entry({ titleOverride: `${S10} Season 10 — Test` });
    assert.strictEqual(pn.seasonEmoji(typed), S10);
    assert.strictEqual(pn.displayTitle(typed), 'Season 10 — Test', 'a select label is plain text and would show the raw mention');
    const text = pn.buildContainer({ patchNotes: [entry({ emoji: S10 })] })[0].components.flatMap(c => (c.type === 9 ? c.components : [c])).filter(c => c.type === 10).map(c => c.content).join('\n');
    assert.ok(text.includes(`\n${S10} `), 'heading');
    assert.ok(text.includes('-# Source: [Leakers on Duty](https://discord.gg/nicecat)'), 'the credit line (2026-10-19 09:39 EDT)');
});

t('a stored emoji is re-pointed by NAME at the booted app, as the map\'s own ids are', () => {
    const before = emojis.repoint(S10);
    assert.strictEqual(before, S10, 'before any sync it comes back unchanged');
});

(async () => {
    // refreshEmojiIds against a fake app whose S10Test has another id, the way the dev app's copies do.
    const client = { application: { id: 'app' }, rest: { get: async () => ({ items: [{ name: 'S10Test', id: '999', animated: true }, { name: 'S107thAnniversary', id: '1000', animated: true }, { name: 'DiorswrldHeart', id: '2000', animated: true }] }) } };
    const orig = { ...emojis };
    await emojis.refreshEmojiIds(client);
    t('after the sync the dev copy\'s id is used, and an unknown name is left alone', () => {
        assert.strictEqual(emojis.repoint(S10), '<a:S10Test:999>');
        assert.strictEqual(emojis.repoint('<a:Nope:1>'), '<a:Nope:1>');
    });
    t('the footer heart is the DiorswrldHeart, re-pointed to the app\'s own copy (2026-10-28)', () => {
        assert.strictEqual(emojis.diorHeart, '<a:DiorswrldHeart:2000>');
    });
    t('an emoji the map has no key for is found by its exact name (2026-10-28)', () => {
        assert.strictEqual(emojis.S107thAnniversary, '<a:S107thAnniversary:1000>', 'the name finds it');
        assert.strictEqual(emojis.s107thanniversary, undefined, 'the name is exact, case included');
        assert.strictEqual(emojis.NopeNotAnEmoji, undefined);
        assert.strictEqual(emojis.season9, orig.season9, 'a mapped key is untouched');
    });
    Object.assign(emojis, orig);
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})();
