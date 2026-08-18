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

    console.log(failures === 0 ? '\nAll help.js snapshot checks passed.' : `\n${failures} check(s) FAILED.`);
    process.exit(failures === 0 ? 0 : 1);
}

run();
