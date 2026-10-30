// scripts/textCommandParse.test.js -- the text-command trigger rules as a table (utils/textCommands/parse.js). Each row is a message someone could type; the expected verdict is what Harkirat agreed on 2026-10-28 16:21-16:25 EDT and what the think-pass tightened at 16:46 EDT.
const assert = require('assert');
const { parseTextCommand, isTypoOf } = require('../utils/textCommands/parse');

const BOT = '111', ROLE = '222';
const commands = [
    { name: 'today', words: ['today'] },
    { name: 'draws', words: ['draws'] },
    { name: 'calendar', words: ['calendar'] },
    { name: 'help', words: ['help'] },
    { name: 'settings', words: ['settings', 'setting'] },
    { name: 'remind', words: ['remind'] },
    { name: 'season', words: ['season end', 'seasonend'] },
    { name: 'patch', words: ['patch notes', 'patchnotes', 'notes'] },
    { name: 'drawprices', words: ['draw prices', 'drawprices', 'prices'] },
];
const opts = { botId: BOT, botRoleId: ROLE, prefixes: ['d', 'dior'], commands };
const v = (text) => parseTextCommand(text, opts);

const rows = [
    // [message, kind, command]
    [`<@${BOT}> today`, 'run', 'today'],
    [`<@!${BOT}> TODAY`, 'run', 'today'],
    ['d today', 'run', 'today'],
    ['Dtoday', 'run', 'today'],
    ['dior today', 'run', 'today'],
    ['DiorToday', 'run', 'today'],
    ['dior calender', 'run', 'calendar'],           // his typo example
    ['dior draws o', 'run', 'draws'],               // his stray-key example
    ['d todya', 'run', 'today'],                    // a swap
    [`<@${BOT}> draws pls`, 'run', 'draws'],
    ['d draws pls', 'run', 'draws'],              // B6: an exact command and ONE more word still runs after d
    ['d calendar stuff', 'run', 'calendar'],
    [`<@${BOT}> calender stuff`, 'run', 'calendar'], // B6: after @Dioreo a typo with more words runs
    ['d patch notes', 'run', 'patch'],
    ['d patchnotes', 'run', 'patch'],
    ['dior season end', 'run', 'season'],
    ['d draw prices', 'run', 'drawprices'],
    ['d setting', 'run', 'settings'],
    [`<@${BOT}>`, 'help', null],
    [`<@${BOT}> blorp`, 'help', null],
    [`<@&${ROLE}>`, null, null],                    // B6: the role hint was dropped (his call 2026-10-29 15:00 EDT)
    [`<@&${ROLE}> today`, 'run', 'today'],          // once Message Content is granted
    // stays silent
    ['draws', null, null],                          // the plain word, glued d + raws
    ['dinner', null, null],
    ['d today is cold lol', null, null],
    ['dior calendar drop is insane', null, null],
    ['d lol', null, null],
    ['/today', null, null],                         // B6: `/` is no longer a prefix
    ['d calender stuff', null, null],               // B6: a typo with any more words is chat after d
    ['d calendar stuff yo', null, null],            // B6: two or more more words is chat
    ['d mind blown', null, null],                   // mind is not a typo of remind (first letter)
    ['d getting there', null, null],                // nor of settings
    ['d getting', null, null],                      // alone too: distance 2 from settings, first letter differs
    ['dior lesson', null, null],                    // nor of season
    [`<@${BOT}> is the best bot ever`, 'emojiReply', null], // talking TO Dioreo: an emoji reply (his call 2026-10-28 17:04 EDT)
    [`<@${BOT}> you are cool`, 'emojiReply', null],
    [`<@${BOT}> hello there`, 'help', null],         // two words: still a command attempt
    [`<@${BOT}> hi`, 'help', null],
    [`<@${BOT}> thanks`, 'emojiReply', null],         // B6: thanks gets an emoji, not the help card
    [`<@${BOT}> thank you!`, 'emojiReply', null],
    [`<@${BOT}> ty`, 'emojiReply', null],
    [`thanks <@${BOT}>`, null, null],               // mention not at the start (a reply-ping)
    ['hello', null, null],
    ['', null, null],
    [`<@999> today`, null, null],                   // someone else mentioned
    ['d.', null, null],
];

let failed = 0;
for (const [msg, kind, command] of rows) {
    const got = v(msg);
    const ok = got.kind === kind && (command === null || got.command === command);
    if (!ok) { failed++; console.log(`✗ ${JSON.stringify(msg)} -> ${JSON.stringify(got)} (want ${kind}${command ? ' ' + command : ''})`); }
}
// A typo-matched command with trailing text: after @Dioreo it runs with what was understood (B6), after a prefix it is silent.
assert.strictEqual(v(`<@${BOT}> calender stuff`).kind, 'run');
assert.strictEqual(v('dior calender stuff here').kind, null);
// The tolerance table itself.
assert.ok(isTypoOf('calender', 'calendar') && isTypoOf('todya', 'today') && isTypoOf('hlep', 'help'));
assert.ok(!isTypoOf('heap', 'help') && !isTypoOf('mind', 'remind') && !isTypoOf('lesson', 'season'));
assert.ok(!isTypoOf('getting', 'settings') && !isTypoOf('kalendar', 'calendar'));
// His `b` and `bd` aliases (2026-10-30 18:38 EDT), against the REAL word list: the fixture above has no gunsmith.
{
    const { TEXT_COMMANDS } = require('../utils/textCommands/commands');
    const real = { ...opts, commands: TEXT_COMMANDS };
    for (const [m, want] of [['d b ak117', 'gunsmith'], ['d bd ak117', 'gunsmith dmz'], ['dior b', 'gunsmith'], ['d bd', 'gunsmith dmz']]) {
        const r = parseTextCommand(m, real);
        assert.strictEqual(r.kind, 'run', m);
        assert.strictEqual(r.command, want, m);
    }
}
if (failed) { console.error(`${failed} of ${rows.length} rows failed`); process.exit(1); }
console.log(`textCommandParse: ${rows.length} rows + 9 asserts passed`);
