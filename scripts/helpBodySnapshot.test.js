// Regression guard for the commands/help.js table-driven rewrite (v3-pre-release review finding #49). scripts/fixtures/helpBodySnapshot.json was captured from the ORIGINAL hand-concatenated builders before the rewrite (scripts/fixtures/captureHelpSnapshot.mjs). This test re-renders every category, for a representative perms matrix, and asserts byte-identical output -- "every /help page renders identically to today except where the review found real drift" (the plan's own Done-when wording). Any INTENTIONAL rendering change must re-run the capture script and explain the diff in the same commit, never silently update the fixture.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let failures = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); }
    catch (error) { failures++; console.error(`  ✗ ${name}\n      ${error.message}`); }
}

const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'helpBodySnapshot.json');
const expected = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));

const fakeClient = { commandIds: new Map() };
const PERM_MATRICES = {
    anonymous: { serverAdmin: false, botAdmin: false, manage: false, bot: false, botAccess: false, autobuild: false },
    serverAdminOnly: { serverAdmin: true, botAdmin: false, manage: false, bot: false, botAccess: false, autobuild: false },
    fullBotAdmin: { serverAdmin: true, botAdmin: true, manage: true, bot: true, botAccess: true, autobuild: true },
    partialBotAdmin: { serverAdmin: false, botAdmin: true, manage: false, bot: true, botAccess: false, autobuild: false }
};

async function run() {
    const helpCommand = require('../commands/help');

    for (const [permsName, perms] of Object.entries(PERM_MATRICES)) {
        await check(`${permsName}: landing page renders byte-identical to the pre-rewrite fixture`, async () => {
            const actual = await helpCommand.buildContainer(null, 16743772, perms, fakeClient);
            assert.deepStrictEqual(actual, expected[permsName].landing);
        });
        for (const cat of helpCommand.CATEGORY_DEFS) {
            await check(`${permsName}: "${cat.key}" detail page renders byte-identical to the pre-rewrite fixture`, async () => {
                const actual = await helpCommand.buildContainer(cat.key, 16743772, perms, fakeClient);
                assert.deepStrictEqual(actual, expected[permsName][cat.key]);
            });
        }
    }

    // OPTION DRIFT (2026-10-17 23:51 EDT). The snapshot above freezes what /help SAYS; this checks it against what each command REGISTERS. /help had gone stale three ways nobody saw: /draw prices' type (then jump_to) missing, /manage still listing the retired Manage Admins and not its `action`, and two "Options" lines promising [visibility] on commands without it. Every registered option except visibility must be named on its command's page as `[name]` or `<name>`, and every such name on a page must belong to a command on it.
    await check('every /help page names exactly the options its commands register', async () => {
        const fs = require('fs');
        const registered = {};
        for (const f of fs.readdirSync(path.join(__dirname, '..', 'commands'))) {
            const m = require(path.join(__dirname, '..', 'commands', f));
            if (m.data) { const j = m.data.toJSON(); registered[j.name] = j; }
        }
        const optionsOf = name => {
            const [base, sub] = name.replace('/', '').split(' ');
            let opts = (registered[base] || {}).options || [];
            if (sub) opts = (opts.find(o => o.name === sub) || {}).options || [];
            return opts.filter(o => o.type !== 1 && o.type !== 2).map(o => o.name);
        };
        const perms = PERM_MATRICES.fullBotAdmin;
        const texts = c => [c.content || '', ...(c.components || []).flatMap(texts)].join('\n');
        for (const cat of helpCommand.CATEGORY_DEFS) {
            const page = texts(await helpCommand.buildContainer(cat.key, 16743772, perms, fakeClient));
            const commands = cat.detailCommands || cat.staticCommands;
            const expected = new Set(commands.flatMap(c => optionsOf(c.name)).filter(n => n !== 'visibility'));
            const named = new Set([...page.matchAll(/🔹 `[<\[]([a-z_]+\d*)[>\]]`/g)].map(m => m[1]).filter(n => n !== 'visibility'));
            // A numbered run is named once as a range, `[screenshot2]` to `[screenshot10]` (bulk /autobuild, 2026-10-20 10:42 EDT), and stands for every name in it.
            for (const m of page.matchAll(/🔹 `\[([a-z_]+)(\d+)\]` to `\[\1(\d+)\]`/g)) {
                for (let n = Number(m[2]); n <= Number(m[3]); n++) named.add(`${m[1]}${n}`);
            }
            for (const n of expected) assert.ok(named.has(n), `${cat.key}: registered option "${n}" is not on the /help page`);
            for (const n of named) assert.ok(expected.has(n), `${cat.key}: /help names "${n}", which no command on the page registers`);
        }
    });

    console.log(failures === 0 ? '\nAll help.js snapshot checks passed.' : `\n${failures} check(s) FAILED.`);
    process.exit(failures === 0 ? 0 : 1);
}

run();
