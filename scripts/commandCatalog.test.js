// scripts/commandCatalog.test.js -- coverage for scripts/lib/commandCatalog.js, the module that tells the website's /commands page what the bot can do. It reads the REAL command builders, so most of what matters here is not "does it transform correctly" but "can it fail" -- a catalog that silently drops a command produces a page that lies about the bot while every other gate stays green. Run: `node scripts/commandCatalog.test.js` (also via `npm test`).
const assert = require('assert');
const {
    buildCatalog, GROUPS, idFor, leavesOf, readHelpPlacement, placementFor, EXTRA_PLACEMENT,
} = require('./lib/commandCatalog');

let failures = 0;
const checks = [];
function check(name, fn) { checks.push([name, fn]); }
function run() {
    for (const [name, fn] of checks) {
        try { fn(); console.log(`  ✓ ${name}`); }
        catch (error) { failures++; console.error(`  ✗ ${name}\n      ${error.message}`); }
    }
}

const catalog = buildCatalog();
const allCommands = catalog.groups.flatMap(g => g.commands);
const byPath = new Map(allCommands.map(c => [c.path, c]));

// ── the leaf derivation ────────────────────────────────────────────────────────────────────────
check('leavesOf: a plain command is its own single leaf', () => {
    const leaves = leavesOf({ name: 'settings', description: 'd', options: [{ name: 'visibility', type: 3 }] });
    assert.deepStrictEqual(leaves.map(l => l.path), ['/settings']);
    assert.strictEqual(leaves[0].options.length, 1, 'a plain command keeps its own options');
});

check('leavesOf: a parent with subcommands yields the SUBCOMMANDS, never the parent', () => {
    const leaves = leavesOf({
        name: 'draw', description: 'd',
        options: [{ name: 'prices', type: 1, description: 'p', options: [] },
            { name: 'calculator', type: 1, description: 'c', options: [] }],
    });
    assert.deepStrictEqual(leaves.map(l => l.path), ['/draw prices', '/draw calculator']);
    // `/draw` alone is not a thing a person can run, so listing it would invite a dead invocation.
    assert.ok(!leaves.some(l => l.path === '/draw'), 'the unusable parent must not become a leaf');
});

check('leavesOf: a subcommand GROUP nests one level deeper', () => {
    const leaves = leavesOf({
        name: 'a', description: 'd',
        options: [{ name: 'grp', type: 2, options: [{ name: 'leaf', type: 1, description: 'x', options: [] }] }],
    });
    assert.deepStrictEqual(leaves.map(l => l.path), ['/a grp leaf']);
});

check('idFor: an anchor is the path, spaces to hyphens', () => {
    assert.strictEqual(idFor('/gunsmiths search'), 'gunsmiths-search');
    assert.strictEqual(idFor('/settings'), 'settings');
});

// ── the gating model, read from /help's own array ──────────────────────────────────────────────
check('readHelpPlacement: a CATEGORY-level requires gates every command under it', () => {
    const placement = readHelpPlacement([
        { key: 'botadmin', requires: 'botAdmin', staticCommands: [{ name: '/manage' }] },
    ]);
    assert.strictEqual(placement.get('/manage').gated, true);
});

check('readHelpPlacement: a COMMAND-level requires gates that one line alone', () => {
    const placement = readHelpPlacement([
        { key: 'preferences', staticCommands: [{ name: '/settings' }, { name: '/admin', requires: 'serverAdmin' }] },
    ]);
    assert.strictEqual(placement.get('/settings').gated, false);
    assert.strictEqual(placement.get('/admin').gated, true);
});

check('placementFor: the LONGEST declared prefix wins', () => {
    const placement = readHelpPlacement([
        { key: 'draws', staticCommands: [{ name: '/draw prices' }, { name: '/draw calculator' }] },
    ]);
    // If a shorter prefix could win, `/draw calculator` would inherit `/draw prices`' entry -- silently filing one command under another's declaration.
    assert.strictEqual(placementFor('/draw calculator', placement).declared, '/draw calculator');
});

// ── the completeness gate: the reason this module exists ───────────────────────────────────────
check('THE GATE CAN FAIL: an unplaced public command throws and names itself', () => {
    // A CATEGORY_DEFS that has forgotten a real, public, registered command. This is not a hypothetical shape -- it is exactly the state the live array is in for /help and /invite.
    const amnesiac = [{ key: 'utilities', staticCommands: [{ name: '/colors' }] }];
    assert.throws(
        () => buildCatalog({ categoryDefs: amnesiac }),
        error => /have nowhere to go/.test(error.message) && /\/timestamp/.test(error.message),
        'an unplaced command must fail the build AND name the command'
    );
});

check('the gate stays SILENT on the real tree', () => {
    // The other half of a falsifier: a check that fires on everything proves nothing.
    assert.doesNotThrow(() => buildCatalog(), 'the live command tree must build clean');
});

// ── what actually reaches the page ─────────────────────────────────────────────────────────────
check('every non-admin command the bot registers reaches the page', () => {
    const excluded = new Set(catalog.excluded.map(e => e.path));
    // Rebuilt from the builders independently of the catalog's own grouping, so this is a real cross-check rather than a restatement of what buildCatalog already decided.
    const registered = buildCatalog().groups.flatMap(g => g.commands.map(c => c.path));
    for (const path of registered) {
        assert.ok(!excluded.has(path), `${path} is both listed and excluded`);
    }
    assert.ok(catalog.commandCount >= 12, `only ${catalog.commandCount} commands reached the page`);
});

check('admin commands are excluded, and by GATING rather than by a hardcoded list', () => {
    const excluded = catalog.excluded.map(e => e.path);
    for (const admin of ['/manage', '/autobuild', '/bot analytics', '/bot access', '/admin']) {
        assert.ok(excluded.includes(admin), `${admin} must not appear on a public page`);
        assert.ok(!byPath.has(admin), `${admin} leaked into the rendered catalog`);
    }
    // If this ever stops being true, an admin command is being excluded by NAME somewhere, and the next admin command added will quietly ship to the public site.
    for (const e of catalog.excluded) {
        assert.strictEqual(e.reason, 'admin-gated in CATEGORY_DEFS', `${e.path} excluded for the wrong reason`);
    }
});

check('/help and /invite are placed despite CATEGORY_DEFS not knowing them', () => {
    assert.ok(byPath.has('/help'), '/help must appear on the page that lists commands');
    assert.ok(byPath.has('/invite'), '/invite must appear -- it is public and undiscoverable in /help');
    for (const path of Object.keys(EXTRA_PLACEMENT)) {
        assert.ok(byPath.has(path), `${path} is declared in EXTRA_PLACEMENT but never rendered`);
    }
});

// ── order, which carries decisions ─────────────────────────────────────────────────────────────
check('within a group, order follows CATEGORY_DEFS then the builder', () => {
    const gunsmiths = catalog.groups.find(g => g.key === 'gunsmiths').commands.map(c => c.path);
    // CATEGORY_DEFS declares `/gunsmiths` before `/dmz`; the builder declares `search` before `list`. One entry covers both subcommands, so only the builder can order those two.
    assert.deepStrictEqual(gunsmiths, ['/gunsmiths search', '/gunsmiths list', '/dmz']);

    const draws = catalog.groups.find(g => g.key === 'draws').commands.map(c => c.path);
    assert.deepStrictEqual(draws, ['/draws', '/draw prices', '/draw calculator']);
});

check('groups render in the declared order, and every group key is unique', () => {
    assert.deepStrictEqual(catalog.groups.map(g => g.key), GROUPS.map(g => g.key));
    assert.strictEqual(new Set(GROUPS.map(g => g.key)).size, GROUPS.length);
});

// ── option fidelity ────────────────────────────────────────────────────────────────────────────
check('options carry required, autocomplete and choice NAMES', () => {
    const timestamp = byPath.get('/timestamp');
    const datetime = timestamp.options.find(o => o.name === 'datetime');
    assert.strictEqual(datetime.required, true, 'datetime is required on /timestamp');

    const weapon = byPath.get('/gunsmiths search').options.find(o => o.name === 'weapon');
    assert.strictEqual(weapon.autocomplete, true, 'weapon is an autocomplete option');

    // Discord shows a choice's NAME and never its value, so a value on the page would be a string the reader never sees in the client.
    const scope = byPath.get('/gunsmiths list').options.find(o => o.name === 'scope');
    assert.ok(scope.choices.includes('All MP builds'), 'choice NAMES, not values');
    assert.ok(!scope.choices.includes('all'), 'a choice VALUE must never reach the page');
});

check('every anchor id is unique across the whole page', () => {
    const ids = allCommands.map(c => c.id);
    assert.strictEqual(new Set(ids).size, ids.length, 'a duplicate id would make one deep link unreachable');
});

run();
if (failures > 0) {
    console.error(`❌ commandCatalog: ${failures} case(s) failed`);
    process.exit(1);
}
console.log(`✅ commandCatalog: ${checks.length} cases passed`);
