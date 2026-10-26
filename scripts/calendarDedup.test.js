// scripts/calendarDedup.test.js Regression test for utils/search.js's isSameDrawTitle() -- the calendar Draws-section dedup logic (see commands/calendar.js's getDrawSectionEntries()). Every case here is a REAL title pair pulled from Harkirat's live seasonal data at the time this was built (2026-07-31 13:30 EDT), preserved here on purpose per his explicit request even after that specific stale dev-DB snapshot was refreshed -- these are genuine edge cases the matcher must keep handling correctly, not hypothetical ones. Run: `node scripts/calendarDedup.test.js`.
const { isSameDrawTitle } = require('../utils/search');

const CASES = [
    // [titleA, titleB, expectedMatch, note]
    ['Persona 5 Royal (Operator) Series Armory', 'Persona 5 Operator Series Armory', true,
        'extra "Royal" word + parens'],
    ['Persona 5 Royal (Weapon) Series Armory', 'Persona 5 Weapon Series Armory', true,
        'extra "Royal" word + parens'],
    ['Shadow & Shade Mythic Draw', 'Shadow and Shade Mythic Drop', true,
        '"&" vs "and", "Draw" vs "Drop"'],
    ['Crimson Moonlight Howl Double Draw', 'Crimson Moonlight Howl (It Goes Two Draw)', true,
        'differently-worded double-draw suffix'],
    ['The Chariot Draw', 'Rewired Draw', false,
        'genuinely different draws sharing only the generic word "Draw"'],
    ['Free Legendary Weapon (Secret Cache)', 'Persona 5 Weapon Series Armory', false,
        'genuinely different draws sharing only the generic word "Weapon"'],
    ['Ion Pulse Mythic Drop Redux', 'Fuschian Night Mythic Drop Redux', false,
        'genuinely different draws sharing only generic "Mythic Drop Redux" vocabulary'],
    ['Eternal Divinity Draw', 'Power Supply Draw', false,
        'genuinely different draws sharing only the generic word "Draw"'],
    // Season 9 (2026-10-23 13:31 EDT): one distinctive word, so only the same-words rule can match it; and two different one-word draws must still not merge.
    ['Halloween Series Armory', 'Halloween Series Armory', true, 'identical title with one distinctive word'],
    ['Halloween Armory Series', 'Halloween Series Armory', true, 'same words, different order'],
    ['Halloween Draw', 'Halloween Series Armory', false, 'one shared word is still not enough'],
];

let failures = 0;
for (const [a, b, expected, note] of CASES) {
    const got = isSameDrawTitle(a, b);
    const ok = got === expected;
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  "${a}" <-> "${b}" => ${got} (expected ${expected}) -- ${note}`);
}

if (failures > 0) {
    console.error(`\n${failures}/${CASES.length} case(s) FAILED.`);
    process.exit(1);
}
console.log(`\nAll ${CASES.length} cases passed.`);
