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

check('readHelpPlacement: detailCommands WINS over staticCommands, so a finer `requires` cannot leak', () => {
    // The failure this guards: #154 gave CATEGORY_DEFS a second, finer list that help.js treats as authoritative. If the catalog read only the coarse list, `gated` would come from the PARENT -- a restricted subcommand would be hidden in /help and PUBLISHED on the website, with every other gate still green. Reading staticCommands only, this assertion fails.
    const placement = readHelpPlacement([
        {
            key: 'gunsmiths',
            staticCommands: [{ name: '/gunsmiths' }],
            detailCommands: [{ name: '/gunsmiths search' }, { name: '/gunsmiths secret', requires: 'botAdmin' }],
        },
    ]);
    assert.strictEqual(placement.has('/gunsmiths'), false, 'the coarse entry must not be declared once a finer list exists');
    assert.strictEqual(placement.get('/gunsmiths search').gated, false);
    assert.strictEqual(placement.get('/gunsmiths secret').gated, true);
});

check('readHelpPlacement: ORDER comes from detailCommands when the two lists disagree', () => {
    // Order drives how the page lists a group. If the lists disagree the site must follow the one /help's detail page follows, or the two disagree on screen.
    const placement = readHelpPlacement([
        {
            key: 'gunsmiths',
            staticCommands: [{ name: '/gunsmiths' }, { name: '/dmz' }],
            detailCommands: [{ name: '/dmz' }, { name: '/gunsmiths search' }],
        },
    ]);
    assert.ok(placement.get('/dmz').order < placement.get('/gunsmiths search').order);
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

/* ── the /commands page's colour contract ─────────────────────────────────────
   Every command name on that page is painted in the bot's OWN accent for that command, and
   those hexes were chosen for a Discord embed rather than for a web page — so each one is
   solved to a text-safe variant per theme. These cases exist because the first version solved
   against --desk alone and three colours then measured 4.00, 4.05 and 4.08 on --raised, which
   is the surface the panel actually paints: it read as passing while failing where it counts.
   ⚠️ Both SURFACES of both themes are asserted, not just the one the solver targets. */
const { solveText, loadAccents, GROUND_DARK, GROUND_LIGHT, DERIVED } = require('./lib/commandsPage');

const SURFACES = { 'dark --desk': '#16131B', 'dark --raised': '#241F30', 'light --desk': '#E7E4EC', 'light --raised': '#EEECF2' };
const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const relLum = h => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const [r, g, b] = hx(h).map(f); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = [relLum(a), relLum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

check('every command colour clears WCAG AA on BOTH surfaces of its own theme', () => {
    const bad = [];
    for (const [path, hex] of Object.entries(loadAccents())) {
        const pairs = [
            [solveText(hex, GROUND_DARK), 'dark --desk'], [solveText(hex, GROUND_DARK), 'dark --raised'],
            [solveText(hex, GROUND_LIGHT), 'light --desk'], [solveText(hex, GROUND_LIGHT), 'light --raised'],
        ];
        for (const [colour, surface] of pairs) {
            const r = contrast(colour, SURFACES[surface]);
            if (r < 4.5) bad.push(`${path} ${colour} on ${surface} = ${r.toFixed(2)}`);
        }
    }
    assert.deepStrictEqual(bad, [], 'a command name below 4.5:1 is unreadable on the surface it is painted on');
});

check('solveText can actually FAIL a colour it cannot fix, so the case above is not vacuous', () => {
    // Black can never clear 4.5:1 against a near-black ground unchanged. If the solver returned it untouched the assertion above would pass on a colour nobody can read.
    const fixed = solveText('#000000', GROUND_DARK);
    assert.notStrictEqual(fixed, '#000000', 'the solver returned an impossible colour unchanged');
    assert.ok(contrast(fixed, GROUND_DARK) >= 4.5, 'the solver returned a colour that still fails');
});

check('no command is both fixed-colour and derive-per-render', () => {
    const fixed = new Set(Object.keys(loadAccents()));
    const both = [...DERIVED].filter(p => fixed.has(p));
    assert.deepStrictEqual(both, [], 'a command cannot both ship a PRESET_ACCENT and derive one per render');
});

check('every live command is accounted for as fixed-colour or derive-per-render', () => {
    const fixed = new Set(Object.keys(loadAccents()));
    const missed = allCommands.map(c => c.path).filter(p => !fixed.has(p) && !DERIVED.has(p));
    assert.deepStrictEqual(missed, [], 'a command in neither set renders a grey dot with nothing saying why');
});

run();
if (failures > 0) {
    console.error(`❌ commandCatalog: ${failures} case(s) failed`);
    process.exit(1);
}
console.log(`✅ commandCatalog: ${checks.length} cases passed`);
