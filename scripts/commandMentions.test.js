// utils/commandMentions.js linkCommandMentions(): typed `/commands` in free text (an announcement) become clickable mentions, and nothing else is touched.
const assert = require('node:assert');
const m = require('../utils/commandMentions');

m.recordCommandIds(new Map([['gunsmith', '1'], ['draws', '2'], ['draw', '3'], ['help', '4'], ['timestamp', '5'], ['season', '7']]));
m.recordCommandPaths(['gunsmith mp', 'gunsmith dmz', 'draws', 'draw prices', 'draw calculator', 'help', 'timestamp', 'season end', 'remind']);

const cases = [
    ['/gunsmith mp · /gunsmith dmz', '</gunsmith mp:1> · </gunsmith dmz:1>'],
    ['/draws\nNew draws', '</draws:2>\nNew draws'],
    ['/draw prices · /draw calculator', '</draw prices:3> · </draw calculator:3>'],
    ['**/season end** now', '**</season end:7>** now'],
    ['/timestamp + Right-click/Tap & hold', '</timestamp:5> + Right-click/Tap & hold'],
    ['Confused? → /help', 'Confused? → </help:4>'],
    // A command with subcommands never links by its bare name: Discord shows `</gunsmith:id>` as plain text.
    ['/gunsmith builds', '/gunsmith builds'],
    ['/draw', '/draw'],
    // Unknown, no id yet, inside a URL or inline code, or already a mention: left exactly as written.
    ['/unknown cmd', '/unknown cmd'],
    ['/remind me', '/remind me'],
    ['https://dioreo.app/draws', 'https://dioreo.app/draws'],
    ['`/draws`', '`/draws`'],
    ['</draws:2>', '</draws:2>'],
];
let failed = 0;
for (const [input, want] of cases) {
    try { assert.strictEqual(m.linkCommandMentions(input), want); console.log(`  ✓ ${JSON.stringify(input)}`); }
    catch (e) { failed++; console.log(`  ✗ ${JSON.stringify(input)}\n    ${e.message.split('\n')[0]}`); }
}
if (failed) { console.log(`\n${failed} check(s) failed.`); process.exit(1); }
console.log('\nAll command-mention checks passed.');
