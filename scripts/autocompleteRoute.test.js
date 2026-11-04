// scripts/autocompleteRoute.test.js -- utils/autocomplete.js, the weapon box behind /gunsmith mp, /gunsmith dmz, /gunsmith list and /dmz (code-housekeeping, 2026-11-04 12:28 EST). It ran no line under npm test before. Runs on scripts/lib/manageHarness.cjs: Loadout and CatalogueItem are in-memory collections.
const assert = require('assert');
const h = require('./lib/manageHarness.cjs');
const { runAutocomplete } = require('../utils/autocomplete');
const { Loadout, CatalogueItem } = h.collections;
const { invalidateCatalogue } = require('../utils/catalogue');

function typing(commandName, sub, focused) {
    const answered = [];
    const interaction = {
        commandName, user: { id: h.OWNER }, client: { commands: new Map() },
        options: { getSubcommand: () => sub, getFocused: () => focused, getString: () => null },
        respond: async choices => { answered.push(choices); }
    };
    return { interaction, answered };
}
const build = (weaponName, mode, category, extra = {}) => ({ weaponName, weaponKey: weaponName.toLowerCase().replace(/\s+/g, ''), mode, category, buildNumber: 1, attachments: ['A', 'B', 'C', 'D', 'E'], imageKey: 'x', ...extra });
let failures = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.stack.split('\n').slice(0, 3).join('\n      ')}`); }
}

(async () => {
    Loadout.seed([build('BAL-27', 'MP', 'AR', { isMeta: true }), build('Fennec', 'MP', 'SMG'), build('Krig 6', 'DMZ', 'AR')]);
    CatalogueItem.seed([{ kind: 'weapon', name: 'Kilo 141', key: 'kilo141', category: 'AR', mode: 'MP' }]);
    invalidateCatalogue();

    await check('/gunsmith mp finds an MP weapon by a few letters, labelled with its class', async () => {
        const { interaction, answered } = typing('gunsmith', 'mp', 'bal');
        await runAutocomplete(interaction);
        const names = answered[0].map(c => c.name);
        assert.ok(names.some(n => /BAL-27/.test(n) && /\[/.test(n)), JSON.stringify(names));
        assert.ok(!names.some(n => /Krig/.test(n)), 'no DMZ weapon in the MP box');
        assert.ok(answered[0].length <= 25, 'never past Discord\'s 25');
    });

    await check('a catalogue weapon with no build yet is offered as Build pending', async () => {
        const { interaction, answered } = typing('gunsmith', 'mp', 'kilo');
        await runAutocomplete(interaction);
        assert.ok(answered[0].some(c => /Kilo 141.*Build pending/.test(c.name)), JSON.stringify(answered[0]));
    });

    await check('/gunsmith dmz and /dmz offer only DMZ weapons', async () => {
        for (const [cmd, sub] of [['gunsmith', 'dmz'], ['dmz', null]]) {
            const { interaction, answered } = typing(cmd, sub, 'kri');
            await runAutocomplete(interaction);
            const names = answered[0].map(c => c.name).join(',');
            assert.ok(/Krig 6/.test(names) && !/BAL-27/.test(names), `${cmd}: ${names}`);
        }
    });

    await check('an empty box opens on the browse rows, then the weapons', async () => {
        const { interaction, answered } = typing('gunsmith', 'mp', '');
        await runAutocomplete(interaction);
        assert.ok(answered[0][0].value.startsWith('~scope~'), JSON.stringify(answered[0].slice(0, 3)));
        assert.ok(answered[0].length <= 25);
    });

    await check('a command with no weapon box answers with nothing', async () => {
        const { interaction, answered } = typing('calendar', null, 'x');
        await runAutocomplete(interaction);
        assert.deepStrictEqual(answered[0], []);
    });

    if (failures) { console.error(`\n${failures} failing`); process.exit(1); }
    console.log('\nautocomplete: all checks pass');
    process.exit(0);
})();
