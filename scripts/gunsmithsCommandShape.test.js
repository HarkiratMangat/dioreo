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
assert.strictEqual(scopeOpt.choices.length, 11, 'expected 11 scope choices (7 live categories + 4 fixed)');

// The falsifier: a builder that mixes a top-level option MUST trip the first assertion.
const { SlashCommandBuilder } = require('discord.js');
const bad = new SlashCommandBuilder().setName('x').setDescription('x')
    .addSubcommand(s => s.setName('a').setDescription('a')).addStringOption(o => o.setName('b').setDescription('b'));
assert.throws(() => {
    const bj = bad.toJSON();
    assert.deepStrictEqual([...new Set(bj.options.map(o => o.type))], [1]);
}, 'the shape assertion is vacuous — it did not reject a mixed builder');
console.log('✓ gunsmiths command shape');
