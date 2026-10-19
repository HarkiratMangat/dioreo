// scripts/rightClickCommands.test.js
//
// The right-click (message context-menu) commands beside Add to Patch Notes: Autobuild Loadout, Add to Draws, Add to Calendar and Convert Times. What each reads off a post, the boxes it pre-fills, and how it registers. Messages are shaped the way discord.js hands them to a context-menu interaction (a forward's original lives in messageSnapshots).
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { extractSource, titleLine } = require('../utils/patchNoteSource');

let failed = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (err) { failed++; console.log(`  ✗ ${name}\n      ${err.message.split('\n').join('\n      ')}`); }
}

const att = (name, type = 'image/png') => [name, { name, url: `https://cdn.discordapp.com/attachments/1/2/${name}?ex=1`, contentType: type }];
const post = (content, extra = {}) => ({ content, embeds: [], createdTimestamp: Date.parse('2026-10-19T12:00:00Z'), attachments: new Map([att('a.png'), att('b.png')]), ...extra });
const forwardOf = original => ({ content: '', embeds: [], createdTimestamp: Date.parse('2026-10-20T04:00:00Z'), attachments: new Map(), messageSnapshots: { first: () => original } });
const fieldValues = modal => {
    const json = modal.toJSON();
    return Object.fromEntries(json.components.map(c => {
        const input = c.component || c.components?.[0];
        return [input.custom_id, input.value ?? ''];
    }));
};

check('a post\'s title is its heading or bold first line, without the markdown; a plain first line is not a title', () => {
    assert.strictEqual(titleLine('**__2x CP Weekend__**\nmore'), '2x CP Weekend');
    assert.strictEqual(titleLine('### Big Title'), 'Big Title');
    assert.strictEqual(titleLine('just a sentence\n**bold later**'), '');
    assert.strictEqual(extractSource(forwardOf(post('**Void Implosion Draw**'))).title, 'Void Implosion Draw', 'a forward reads its original');
});

// ---- Add to Draws ----
const manage = require('../commands/manage');
const draws = require('../commands/addToDraws');
check('Add to Draws fills the title, the post date and the first image; the blank /manage box is unchanged', () => {
    const prefill = draws.drawPrefill(extractSource(post('**Void Implosion Draw**\nOut now')));
    assert.deepStrictEqual(prefill, { title: 'Void Implosion Draw', date: 'October 19, 2026', url: 'https://cdn.discordapp.com/attachments/1/2/a.png?ex=1' });
    const filled = fieldValues(manage.buildAddDrawModal('new', prefill));
    assert.strictEqual(filled.title, 'Void Implosion Draw');
    assert.strictEqual(filled.date, 'October 19, 2026');
    assert.ok(filled.url.startsWith('https://cdn.discordapp.com/'));
    assert.strictEqual(filled.items, '', 'items stay for him to type');
    const blank = manage.buildAddDrawModal('new').toJSON();
    assert.ok(blank.components.every(c => !('value' in (c.component || c.components?.[0] || {}))), 'no value key on the blank box');
});

// ---- Add to Calendar ----
const calendar = require('../commands/addToCalendar');
check('Add to Calendar fills the title and the first date range in the text; no end date leaves End Date blank', () => {
    const ranged = calendar.calendarPrefill(extractSource(post('**__2x CP Weekend__**\nRuns Oct 24 - Oct 27')));
    assert.deepStrictEqual(ranged, { title: '2x CP Weekend', startDate: 'October 24, 2026', endDate: 'October 27, 2026' });
    const single = calendar.calendarPrefill(extractSource(post('**Ranked Reset**\nStarts November 2')));
    assert.strictEqual(single.startDate, 'November 2, 2026');
    assert.strictEqual(single.endDate, '', 'blank reads as All Season');
    const none = calendar.calendarPrefill(extractSource(post('**Teaser**\nsoon')));
    assert.deepStrictEqual([none.startDate, none.endDate], ['', '']);
    const filled = fieldValues(manage.buildCalendarAddModal(ranged));
    assert.deepStrictEqual([filled.title, filled.start_date, filled.end_date], ['2x CP Weekend', 'October 24, 2026', 'October 27, 2026']);
    const blank = manage.buildCalendarAddModal().toJSON();
    assert.ok(blank.components.every(c => !('value' in c.components[0])), 'no value key on the blank box');
});

// ---- Convert Times ----
const { convertText } = require('../commands/convertTimes');
const REF = new Date('2026-10-19T14:00:00Z');
const unixOf = line => Number(/<t:(\d+):/.exec(line.split('\n')[1])[1]);
check('Convert Times: a time with a zone is exact and is not flagged as a guess', () => {
    const { lines, guessed } = convertText('Maintenance tomorrow 2am UTC', 'America/Toronto', REF);
    assert.strictEqual(unixOf(lines[0]), Date.parse('2026-10-20T02:00:00Z') / 1000);
    assert.strictEqual(guessed, false);
});
check('Convert Times: a time without a zone is read in the reader\'s zone and flagged', () => {
    const toronto = convertText('Event at October 20 8 PM', 'America/Toronto', REF);
    assert.strictEqual(unixOf(toronto.lines[0]), Date.parse('2026-10-21T00:00:00Z') / 1000, '8 PM EDT is 00:00 UTC');
    assert.strictEqual(toronto.guessed, true);
    const tokyo = convertText('Event at October 20 8 PM', 'Asia/Tokyo', REF);
    assert.strictEqual(unixOf(tokyo.lines[0]), Date.parse('2026-10-20T11:00:00Z') / 1000, 'the same words, another reader\'s zone');
});
check('Convert Times: a bare date is that day at midnight, shown as a date; a range shows both ends', () => {
    const date = convertText('Season 9 launches on 10/22', 'America/Toronto', REF);
    assert.ok(/<t:\d+:D>/.test(date.lines[0]) && date.guessed === false, date.lines[0]);
    assert.strictEqual(unixOf(date.lines[0]), Date.parse('2026-10-22T04:00:00Z') / 1000, 'midnight in Toronto');
    const range = convertText('Double XP from Oct 24 to Oct 27', 'America/Toronto', REF);
    assert.ok(/→/.test(range.lines[0]), range.lines[0]);
});
check('Convert Times: nothing to convert gives nothing, and at most 10 are shown', () => {
    assert.deepStrictEqual(convertText('no dates here at all', 'America/Toronto', REF).lines, []);
    const many = Array.from({ length: 14 }, (_, i) => `October ${i + 1}`).join(', ');
    assert.strictEqual(convertText(many, 'America/Toronto', REF).lines.length, 10);
});

// ---- Autobuild Loadout ----
const autobuild = require('../commands/autobuildLoadout');
check('Autobuild Loadout: several images ask which one, with a select the /autobuild lock covers', () => {
    const panel = autobuild.buildPicker('123', ['u1', 'u2', 'u3']);
    const rows = panel[0].components;
    assert.strictEqual(rows.find(c => c.type === 12).items.length, 3);
    const select = rows.find(c => c.type === 1).components[0];
    assert.strictEqual(select.custom_id, 'autobuild_pick|123', 'starts with autobuild_, so handlers/router.js gates it on /autobuild');
    assert.deepStrictEqual(select.options.map(o => o.value), ['0', '1', '2']);
});

// ---- registration ----
check('five message right-clicks, Discord\'s cap; the admin ones are user-install only and kept out of /admin\'s rules', () => {
    const dir = path.join(__dirname, '..', 'commands');
    const messageCommands = fs.readdirSync(dir).filter(f => f.endsWith('.js'))
        .map(f => require(path.join(dir, f))).filter(m => m.data?.toJSON?.().type === 3).map(m => m.data.toJSON());
    assert.ok(messageCommands.length <= 5, `${messageCommands.length} message commands; Discord allows 5`);
    const byName = Object.fromEntries(messageCommands.map(c => [c.name, c]));
    for (const name of ['Add to Patch Notes', 'Autobuild Loadout', 'Add to Draws', 'Add to Calendar']) {
        assert.deepStrictEqual(byName[name].integration_types, [1], `${name} is admin-only`);
    }
    assert.deepStrictEqual(byName['Convert Times'].integration_types, [0, 1], 'Convert Times is public');
    const registry = fs.readFileSync(path.join(__dirname, '..', 'bot', 'registry.js'), 'utf8');
    for (const name of ['Autobuild Loadout', 'Add to Draws', 'Add to Calendar']) assert.ok(registry.includes(`'${name}'`), `${name} is in ADMIN_COMMAND_NAMES`);
    assert.ok(!registry.includes("'Convert Times'"), 'Convert Times stays gateable by a server\'s /admin rules');
});

console.log(failed ? `\n${failed} check(s) FAILED.` : '\nAll right-click command checks passed.');
process.exit(failed ? 1 : 0);
