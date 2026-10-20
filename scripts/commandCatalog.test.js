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
    assert.strictEqual(idFor('/gunsmith mp'), 'gunsmith-mp');
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
            key: 'gunsmith',
            staticCommands: [{ name: '/gunsmith' }],
            detailCommands: [{ name: '/gunsmith mp' }, { name: '/gunsmith secret', requires: 'botAdmin' }],
        },
    ]);
    assert.strictEqual(placement.has('/gunsmith'), false, 'the coarse entry must not be declared once a finer list exists');
    assert.strictEqual(placement.get('/gunsmith mp').gated, false);
    assert.strictEqual(placement.get('/gunsmith secret').gated, true);
});

check('readHelpPlacement: ORDER comes from detailCommands when the two lists disagree', () => {
    // Order drives how the page lists a group. If the lists disagree the site must follow the one /help's detail page follows, or the two disagree on screen.
    const placement = readHelpPlacement([
        {
            key: 'gunsmith',
            staticCommands: [{ name: '/gunsmith' }, { name: '/dmz' }],
            detailCommands: [{ name: '/dmz' }, { name: '/gunsmith mp' }],
        },
    ]);
    assert.ok(placement.get('/dmz').order < placement.get('/gunsmith mp').order);
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
    const gunsmith = catalog.groups.find(g => g.key === 'gunsmith').commands.map(c => c.path);
    // CATEGORY_DEFS declares `/gunsmith` before `/dmz`; the builder declares `mp` before `dmz`. One entry covers both subcommands, so only the builder can order those two.
    assert.deepStrictEqual(gunsmith, ['/gunsmith mp', '/gunsmith dmz', '/dmz']);

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

    const weapon = byPath.get('/gunsmith mp').options.find(o => o.name === 'weapon');
    assert.strictEqual(weapon.autocomplete, true, 'weapon is an autocomplete option');

    // Discord shows a choice's NAME and never its value, so a value on the page would be a string the reader never sees in the client.
    const page = byPath.get('/draws').options.find(o => o.name === 'page');
    assert.ok(page.choices.includes('New Draws'), 'choice NAMES, not values');
    assert.ok(!page.choices.includes('new'), 'a choice VALUE must never reach the page');
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
const { solveText, solveOn, loadAccents, loadCategoryAccents, GROUND_DARK, GROUND_LIGHT, DERIVED, DERIVED_NEUTRAL } = require('./lib/commandsPage');

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

/* ── the fill contract ────────────────────────────────────────────────────────
   The page's colour strategy changed shape: a command's accent is now used ONLY as a FILL,
   and the ink printed on top of it is solved instead. The reason is that solving the accent
   itself into a text colour destroyed it — Patch Gold #F2C230 became #7C5F08 against the
   light ground, a 31-point lightness drop, which is brown, while the raw hex sat in a dot
   beside it. Contrast passed and the recognition the colour existed for was gone.

   The virtue of solving the FOREGROUND is that it cannot fail. The worst possible fill is the
   one where black and white are equally bad, at relative luminance 0.1791 — and even there the
   better of the two measures 4.58:1. So these cases assert a property of the approach, not a
   lucky property of the eight hexes that happen to be in the repo today. */
check('every fill on the page can carry readable ink', () => {
    const fills = { ...loadAccents(), ...loadCategoryAccents(), 'derived neutral': DERIVED_NEUTRAL, 'page accent': '#58D05A' };
    const bad = [];
    for (const [name, hex] of Object.entries(fills)) {
        const r = contrast(solveOn(hex), hex);
        if (r < 4.5) bad.push(`${name} ${hex} + ${solveOn(hex)} = ${r.toFixed(2)}`);
    }
    assert.deepStrictEqual(bad, [], 'a command token is unreadable on its own fill');
});

check('solveOn picks the BETTER of the two inks, so the case above is not vacuous', () => {
    // A near-white fill must take dark ink and a near-black fill must take light ink. A function that always returned one of them would pass the assertion above on roughly half the palette and fail silently on the rest, which is exactly the shape of the bug this replaced.
    assert.strictEqual(solveOn('#FFD23F'), '#000000', 'Electric Gold is a light fill and needs dark ink');
    assert.strictEqual(solveOn('#023047'), '#FFFFFF', 'Deep Ice is a dark fill and needs light ink');
    // The mathematical worst case: the fill where both inks are equally bad. The mathematical crossover sits at relative luminance 0.1791; #767676 is the nearest sRGB grey to it. This is the case that fails the moment anyone "softens" INK_ON_LIGHT back to the site's near-black, which drops the floor from 4.58 to 4.27.
    const worst = '#767676';
    assert.ok(contrast(solveOn(worst), worst) >= 4.5,
        `the worst possible fill measured ${contrast(solveOn(worst), worst).toFixed(2)} — the floor has moved`);
});

check('the seven weapon-category accents are read from the bot, not from a copy', () => {
    const cats = loadCategoryAccents();
    // These six are the class browse rows /gunsmith mp offers (they were /gunsmith list's scope choices until 2026-10-19 19:43 EDT). If the map is ever renamed or moved, this fails loudly rather than the page quietly falling back to a grey dot.
    for (const key of ['AR', 'SMG', 'LMG', 'MARKSMAN', 'SNIPER', 'SHOTGUN']) {
        assert.ok(/^#[0-9A-F]{6}$/.test(cats[key] || ''), `no accent parsed for category ${key}`);
    }
    assert.strictEqual(cats.LMG, '#845EC2', 'LMG is Grape Purple in utils/loadoutRender.js');
});

check('the derived six get a real colour, never an ink token', () => {
    // They used to inherit var(--ink3) as their accent, so a selected chip tinted with it came out grey and read as unselected beside a command whose chips tinted properly.
    assert.ok(/^#[0-9A-F]{6}$/.test(DERIVED_NEUTRAL), 'the derived neutral must be a real hex');
    assert.ok(contrast(solveOn(DERIVED_NEUTRAL), DERIVED_NEUTRAL) >= 4.5);
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

// ── option types: a whole-number option must not read as free text ────────────────────────────── `build` (an integer) used to carry a "text" badge because the catalog dropped Discord's option type and the page fell back to "text" for anything without choices. These cases pin the three halves: the type survives the catalog, every type in use has a label, and an unlisted one throws instead of defaulting.
const { optionKind, badges, bareHint } = require('./lib/commandsPage');
const allOptions = allCommands.flatMap(c => c.options.map(o => ({ command: c.path, option: o })));

check('the catalog keeps Discord\'s option type, and min / max where one is set', () => {
    const missing = allOptions.filter(({ option }) => typeof option.type !== 'number').map(({ command, option }) => command + ' ' + option.name);
    assert.deepStrictEqual(missing, [], 'an option without a type cannot be labelled');
    const build = byPath.get('/dmz').options.find(o => o.name === 'build');
    assert.strictEqual(build.type, 4, '`build` is an integer option');
    assert.strictEqual(build.min, 1, '`build` starts at 1, and the page says so');
});

check('every option type in use on the live bot has a label', () => {
    for (const { option } of allOptions) assert.doesNotThrow(() => optionKind(option), 'option ' + option.name);
});

check('an integer option is badged "whole number", never "text"', () => {
    const integers = allOptions.filter(({ option }) => option.type === 4 && !option.choices.length && !option.autocomplete);
    assert.ok(integers.length >= 3, '`build` on /dmz and both /gunsmith leaves are integers; found ' + integers.length);
    for (const { command, option } of integers) {
        const html = badges(option, false);
        assert.ok(html.includes('whole number'), command + ' ' + option.name + ' should read whole number');
        assert.ok(!html.includes('>text<'), command + ' ' + option.name + ' must not read as text');
    }
});

check('a free-text option still reads "text", and a choice list still wins over the type', () => {
    assert.ok(badges({ name: 'q', type: 3, choices: [], autocomplete: false }, true).includes('>text<'));
    assert.ok(badges({ name: 'v', type: 3, choices: [{ name: 'A', value: 'a' }, { name: 'B', value: 'b' }], autocomplete: false }, false).includes('2 choices'));
});

check('an option type with no label throws instead of falling back to text', () => {
    // 7 is Discord's CHANNEL type: nothing here uses it, so it must fail loudly the day someone does.
    assert.throws(() => optionKind({ name: 'where', type: 7 }), /no badge label/);
});

check('bareHint: a number says its bounds, a search says Discord suggests, anything else keeps its description', () => {
    assert.strictEqual(bareHint({ type: 4, min: 1, autocomplete: false, description: 'x' }), 'A whole number, 1 or higher.');
    assert.strictEqual(bareHint({ type: 4, min: 1, max: 25, autocomplete: false, description: 'x' }), 'A whole number from 1 to 25.');
    assert.strictEqual(bareHint({ type: 10, max: 9, autocomplete: false, description: 'x' }), 'A number, 9 or lower.');
    assert.strictEqual(bareHint({ type: 3, autocomplete: true, description: 'x' }), 'Discord suggests matches as you type.');
    assert.strictEqual(bareHint({ type: 3, autocomplete: false, description: 'Your timezone' }), 'Your timezone');
});

const { assertSearchCoverage } = require('./lib/commandProse');
const { findIndexFor } = require('./lib/commandsPage');

check('the search answers the queries a reader actually types', () => {
    // The oracle lives in commandProse.js beside the keywords it tests, and it fails on an exact set rather than a superset — "loadout" must return the three loadout commands and nothing else. The previous page returned exactly one of them and nothing reported it.
    assert.doesNotThrow(() => assertSearchCoverage({ groups: catalog.groups }, findIndexFor({ groups: catalog.groups })));
});

check('the search gate can fail: an index that has lost /calendar\'s words is caught', () => {
    // Without this the case above could pass because the gate checks nothing. Blanking one command's fields must break the ask that points at it.
    const index = findIndexFor({ groups: catalog.groups });
    const blind = { ...index, cmds: index.cmds.map(c => (c.path === '/calendar' ? { ...c, f: [] } : c)) };
    assert.throws(() => assertSearchCoverage({ groups: catalog.groups }, blind), /\/calendar/);
});

run();
if (failures > 0) {
    console.error(`❌ commandCatalog: ${failures} case(s) failed`);
    process.exit(1);
}
console.log(`✅ commandCatalog: ${checks.length} cases passed`);
