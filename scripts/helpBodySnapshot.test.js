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

    // Every page this matrix may open, in each of its views (B6, 2026-10-30 00:15 EDT: the category pages became one page per command, utils/helpPages.js).
    const H = require('../utils/helpPages');
    // /bot is one page with a dropdown (2026-10-30 14:05 EDT); each of its subcommands is rendered as its own page here, so none goes unchecked.
    const pageNames = perms => helpCommand.visiblePageNames(perms).flatMap(n => (n === '/bot' ? helpCommand.visibleBotSubs(perms) : [n]));
    const views = perms => [[null, 'text'], [null, 'slash'], ...pageNames(perms).flatMap(n => (H.hasTextView(n) ? [[n, 'text'], [n, 'slash']] : [[n, 'slash']])), ...(helpCommand.visiblePageNames(perms).includes('/draw prices') ? [['/draw prices', 'detail']] : [])];
    const render = (perms, cmd, view, client = fakeClient) => helpCommand.buildHelpMessage({ perms, client, cmd, view: view === 'detail' ? 'text' : view, detail: view === 'detail' });
    for (const [permsName, perms] of Object.entries(PERM_MATRICES)) {
        await check(`${permsName}: every page renders as the fixture pins it`, async () => {
            const actual = {};
            for (const [cmd, view] of views(perms)) actual[`${cmd || 'home'} ${view}`] = await render(perms, cmd, view);
            assert.deepStrictEqual(actual, expected[permsName]);
        });
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
            // /manage is one subcommand per section (2026-10-28), and its /help block names the options its subcommands share, so a bare name here means all of them.
            const leaves = os => os.flatMap(o => (o.type === 1 || o.type === 2) ? (sub || base !== 'manage' ? [] : leaves(o.options || [])) : [o]);
            return (base === 'manage' && !sub ? leaves(opts) : opts.filter(o => o.type !== 1 && o.type !== 2)).map(o => o.name);
        };
        const perms = PERM_MATRICES.fullBotAdmin;
        const texts = c => [c.content || '', ...(c.components || []).flatMap(texts)].join('\n');
        // Each slash page names its options one box each, `[name]` or `<name>` at the start of the box (B6's layout).
        for (const name of pageNames(perms)) {
            const page = texts({ components: await render(perms, name, 'slash') });
            const expected = new Set(optionsOf(name).filter(n => n !== 'visibility'));
            const named = new Set([...page.matchAll(/(?:^|\n)`[<\[]([a-z_]+\d*)[>\]]`\n/g)].map(m => m[1]).filter(n => n !== 'visibility'));
            for (const n of expected) assert.ok(named.has(n), `${name}: registered option "${n}" is not on its /help page`);
            for (const n of named) assert.ok(expected.has(n), `${name}: /help names "${n}", which the command does not register`);
        }
    });

    // THE 4,000-CHARACTER TOTAL (2026-10-29 00:46 EDT). Discord refuses a Components V2 message whose text displays add up to more than 4,000 characters (COMPONENT_DISPLAYABLE_TEXT_SIZE_EXCEEDED, probed 2026-10-16 01:17 EDT, .claude/rules/draw-prices.md), counted the way utils/announcement.js's measureComponents does. Measured with PROD-LENGTH ids for every command: the fake client above has none, and each `</bot analytics:ID>` mention on prod is ~20 characters longer than its fallback, which is how the owner's Bot Admin page reached 4,038 characters with no test noticing. Every page, every permission level, opened plain and focused on each of its commands (focus adds a "You asked about" line).
    await check('every /help page fits Discord\'s 4,000-character total with prod-length command ids', async () => {
        const PROD_ID = '1561783498770227300';
        const prodClient = { commandIds: new Map(['gunsmith', 'draws', 'draw', 'calendar', 'today', 'remind', 'patch', 'season', 'colors', 'timestamp', 'invite', 'settings', 'admin', 'bot', 'embed', 'manage', 'autobuild', 'help'].map(n => [n, PROD_ID])) };
        const chars = c => (typeof c.content === 'string' ? c.content.length : 0) + (c.components || []).reduce((n, x) => n + chars(x), 0) + (c.accessory ? chars(c.accessory) : 0);
        let worst = { n: 0 };
        for (const [permsName, perms] of Object.entries(PERM_MATRICES)) {
            for (const [cmd, view] of views(perms)) {
                const n = chars({ components: await render(perms, cmd, view, prodClient) });
                if (n > worst.n) worst = { n, where: `${permsName} ${cmd || 'home'} ${view}` };
                assert.ok(n <= 4000, `${permsName} ${cmd || 'home'} ${view}: ${n} characters`);
            }
        }
        console.log(`      longest: ${worst.where}, ${worst.n} of 4,000 characters`);
    });

    console.log(failures === 0 ? '\nAll help.js snapshot checks passed.' : `\n${failures} check(s) FAILED.`);
    process.exit(failures === 0 ? 0 : 1);
}

run();
