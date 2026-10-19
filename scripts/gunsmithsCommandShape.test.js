const assert = require('assert');
const { data } = require('../commands/gunsmiths');
const json = data.toJSON();

// The constraint that forced this whole design: a command with subcommands may have NO top-level options.
assert.deepStrictEqual([...new Set(json.options.map(o => o.type))], [1],
    'top-level options must be subcommands (type 1) ONLY — Discord rejects a mix');
assert.strictEqual(json.options.length, 2, 'expected exactly 2 subcommands');
assert.deepStrictEqual(json.options.map(o => o.name).sort(), ['list', 'search']);
assert.deepStrictEqual(json.integration_types, [0, 1], 'must be guild + user installable (v3)');

// Discord's own limits, asserted here so a violation is a TEST failure rather than a registration rejection at boot: descriptions cap at 100 chars, choice names at 100.
const allDescs = [json.description, ...json.options.flatMap(o => [o.description, ...(o.options || []).map(x => x.description)])];
allDescs.forEach(dsc => assert.ok(dsc.length <= 100, `description over 100 chars: "${dsc}"`));
const scopeOpt = json.options.find(o => o.name === 'list').options.find(o => o.name === 'scope');
scopeOpt.choices.forEach(c => assert.ok(c.name.length <= 100, `choice name too long: ${c.name}`));
// 10 since 2026-10-19 19:39 EDT: Meta MP and Meta DMZ merged into one "All META builds" choice with an MP / DMZ switch on the panel (Harkirat).
assert.strictEqual(scopeOpt.choices.length, 10, 'expected 10 scope choices (3 fixed + 7 categories)');
assert.deepStrictEqual(scopeOpt.choices.slice(0, 4).map(c => c.name), ['All META builds', 'All DMZ builds', 'All MP builds', 'All AR builds [MP]'], 'his order: META, DMZ, MP, then each class tagged [MP]');
{
    // The meta switch: under a meta browse only, the side on screen disabled and the other one live.
    const { buildLoadoutCard } = require('../utils/loadoutRender');
    const build = { weaponName: 'AK117', weaponKey: 'ak117', category: 'AR', mode: 'MP', attachments: ['a'], lastUpdated: new Date(0) };
    const ids = (token) => JSON.stringify(buildLoadoutCard([build], 0, { color: 0, idPrefix: 'mp', browse: { scopeToken: token, flatIndex: 0, flatTotal: 1, scopeLabel: 'x' } }).components);
    assert.ok(ids('MP.*.meta').includes('"custom_id":"gsb~meta~DMZ.*.meta","disabled":false'), 'an MP meta panel offers DMZ');
    assert.ok(ids('DMZ.*.meta').includes('"custom_id":"gsb~meta~MP.*.meta","disabled":false'), 'a DMZ meta panel offers MP');
    assert.ok(!ids('MP.AR.std').includes('gsb~meta~'), 'no switch outside a meta browse');
}

// The falsifier: a builder that mixes a top-level option MUST trip the first assertion.
const { SlashCommandBuilder } = require('discord.js');
const bad = new SlashCommandBuilder().setName('x').setDescription('x')
    .addSubcommand(s => s.setName('a').setDescription('a')).addStringOption(o => o.setName('b').setDescription('b'));
assert.throws(() => {
    const bj = bad.toJSON();
    assert.deepStrictEqual([...new Set(bj.options.map(o => o.type))], [1]);
}, 'the shape assertion is vacuous — it did not reject a mixed builder');
console.log('✓ gunsmiths command shape');
