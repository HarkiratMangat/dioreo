// scripts/titleCase.test.js
//
// utils/adminParser.js's toTitleCase (2026-10-23 14:04 EDT): short words (of, the, and, a, an, in, on, at, to, for, vs) stay lowercase inside a title, but not as its first or last word or the first word after " - ", ":" or a dash; acronyms, hyphen and slash parts behave as before.
const assert = require('assert');
const { toTitleCase } = require('../utils/adminParser');

const CASES = [
    ['whorl of midnight mythic drop', 'Whorl of Midnight Mythic Drop'],
    ['Whorl Of Midnight Mythic Drop', 'Whorl of Midnight Mythic Drop'],
    ['the widow\'s bite draw', 'The Widow\'s Bite Draw'],
    ['samael - the soul eater', 'Samael - The Soul Eater'],
    ['season 9 — vampires vs werewolves', 'Season 9 — Vampires vs Werewolves'],
    ["street fighter: the champion's collection", "Street Fighter: The Champion's Collection"],
    ['a day in the life', 'A Day in the Life'],
    ['what it comes to', 'What It Comes To'],
    ['FSS Hurricane', 'FSS Hurricane'],
    ['blood-red (operator)', 'Blood-Red (Operator)'],
    ['jupiter cannon/void implosion draw', 'Jupiter Cannon/Void Implosion Draw'],
];
let failed = 0;
for (const [input, want] of CASES) {
    const got = toTitleCase(input);
    const ok = got === want;
    if (!ok) failed++;
    console.log(`  ${ok ? '✓' : '✗'} "${input}" -> "${got}"${ok ? '' : ` (want "${want}")`}`);
}
if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log('\nall passed');
