const assert = require('assert');
const { data } = require('../commands/gunsmith');
const json = data.toJSON();

// The constraint that forced this whole design: a command with subcommands may have NO top-level options.
assert.deepStrictEqual([...new Set(json.options.map(o => o.type))], [1],
    'top-level options must be subcommands (type 1) ONLY — Discord rejects a mix');
assert.strictEqual(json.options.length, 2, 'expected exactly 2 subcommands');
// mp and dmz since 2026-10-19 19:43 EDT (Harkirat: search became MP, a new DMZ, list removed). Discord names are lower case.
assert.deepStrictEqual(json.options.map(o => o.name), ['mp', 'dmz']);
assert.deepStrictEqual(json.integration_types, [0, 1], 'must be guild + user installable (v3)');

// Discord's own limits, asserted here so a violation is a TEST failure rather than a registration rejection at boot: descriptions cap at 100 chars.
const allDescs = [json.description, ...json.options.flatMap(o => [o.description, ...(o.options || []).map(x => x.description)])];
allDescs.forEach(dsc => assert.ok(dsc.length <= 100, `description over 100 chars: "${dsc}"`));
for (const sub of json.options) {
    const weapon = sub.options.find(o => o.name === 'weapon');
    assert.ok(weapon && weapon.autocomplete && weapon.required, `${sub.name} takes a required, autocompleted weapon`);
}
{
    // The browse rows that open each one's suggestions, in his order: META first, then the mode's whole set, then each MP class.
    const { browseRows } = require('../utils/loadoutScopes');
    // "All MP builds" dropped (Harkirat, 2026-10-25 16:10 EDT).
    assert.deepStrictEqual(browseRows('MP', ['AR', 'SMG']).map(r => r.label), ['All META builds', 'All AR builds', 'All SMG builds']);
    assert.deepStrictEqual(browseRows('DMZ').map(r => [r.label, r.value]), [['All META builds', 'DMZ.*.meta'], ['All DMZ builds', 'DMZ.*.std']]);
}
{
    // No MP / DMZ meta switch any more (Harkirat, 2026-10-25 16:40 EDT: "let's just remove the MP and DMZ toggle"); the handler still answers panels posted before.
    const { buildLoadoutCard } = require('../utils/loadoutRender');
    const build = { weaponName: 'AK117', weaponKey: 'ak117', category: 'AR', mode: 'MP', attachments: ['a'], lastUpdated: new Date(0) };
    const ids = (token) => JSON.stringify(buildLoadoutCard([build], 0, { color: 0, idPrefix: 'mp', browse: { scopeToken: token, flatIndex: 0, flatTotal: 1, scopeLabel: 'x' } }).components);
    for (const t of ['MP.*.meta', 'DMZ.*.meta', 'MP.AR.std']) assert.ok(!ids(t).includes('gsb~meta~'), `no meta switch on ${t}`);
    // `build:` is gone from both subcommands (Harkirat, 2026-10-25 15:45 EDT).
    for (const sub of json.options) assert.ok(!sub.options.some(o => o.name === 'build'), `${sub.name} has no build option`);
}

// The falsifier: a builder that mixes a top-level option MUST trip the first assertion.
const { SlashCommandBuilder } = require('discord.js');
const bad = new SlashCommandBuilder().setName('x').setDescription('x')
    .addSubcommand(s => s.setName('a').setDescription('a')).addStringOption(o => o.setName('b').setDescription('b'));
assert.throws(() => {
    const bj = bad.toJSON();
    assert.deepStrictEqual([...new Set(bj.options.map(o => o.type))], [1]);
}, 'the shape assertion is vacuous — it did not reject a mixed builder');
console.log('✓ gunsmith command shape');
