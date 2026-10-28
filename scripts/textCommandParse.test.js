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
const opts = { botId: BOT, botRoleId: ROLE, prefixes: ['/', 'd', 'dior'], commands };
const v = (text) => parseTextCommand(text, opts);

const rows = [
    // [message, kind, command]
    [`<@${BOT}> today`, 'run', 'today'],
    [`<@!${BOT}> TODAY`, 'run', 'today'],
    ['/today', 'run', 'today'],
    ['d today', 'run', 'today'],
    ['Dtoday', 'run', 'today'],
    ['dior today', 'run', 'today'],
    ['DiorToday', 'run', 'today'],
    ['dior calender', 'run', 'calendar'],           // his typo example
    ['dior draws o', 'run', 'draws'],               // his stray-key example
    ['d todya', 'run', 'today'],                    // a swap
    [`<@${BOT}> draws pls`, 'run', 'draws'],
    ['/draws pls', 'run', 'draws'],
    ['d patch notes', 'run', 'patch'],
    ['d patchnotes', 'run', 'patch'],
    ['dior season end', 'run', 'season'],
    ['d draw prices', 'run', 'drawprices'],
    ['d setting', 'run', 'settings'],
    [`<@${BOT}>`, 'help', null],
    [`<@${BOT}> blorp`, 'help', null],
    [`<@&${ROLE}>`, 'roleHint', null],
    [`<@&${ROLE}> today`, 'run', 'today'],          // once Message Content is granted
    // stays silent
    ['draws', null, null],                          // the plain word, glued d + raws
    ['dinner', null, null],
    ['d today is cold lol', null, null],
    ['dior calendar drop is insane', null, null],
    ['d lol', null, null],
    ['/whatever', null, null],
    ['d mind blown', null, null],                   // mind is not a typo of remind (first letter)
    ['d getting there', null, null],                // nor of settings
    ['d getting', null, null],                      // alone too: distance 2 from settings, first letter differs
    ['dior lesson', null, null],                    // nor of season
    [`<@${BOT}> is the best bot ever`, 'emojiReply', null], // talking TO Dioreo: an emoji reply (his call 2026-10-28 17:04 EDT)
    [`<@${BOT}> you are cool`, 'emojiReply', null],
    [`<@${BOT}> hello there`, 'help', null],         // two words: still a command attempt
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
// A typo-matched command with real trailing text never runs: after @Dioreo it becomes a Did-you-mean, after a prefix it is silent.
assert.strictEqual(v(`<@${BOT}> calender stuff`).kind, 'didYouMean');
assert.strictEqual(v('dior calender stuff here').kind, null);
// The tolerance table itself.
assert.ok(isTypoOf('calender', 'calendar') && isTypoOf('todya', 'today') && isTypoOf('hlep', 'help'));
assert.ok(!isTypoOf('heap', 'help') && !isTypoOf('mind', 'remind') && !isTypoOf('lesson', 'season'));
assert.ok(!isTypoOf('getting', 'settings') && !isTypoOf('kalendar', 'calendar'));
if (failed) { console.error(`${failed} of ${rows.length} rows failed`); process.exit(1); }
console.log(`textCommandParse: ${rows.length} rows + 5 asserts passed`);
