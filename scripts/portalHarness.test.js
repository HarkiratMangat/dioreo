// scripts/portalHarness.test.js — does the fixture harness tell the truth?
//
// 🔴 THE INSTRUMENT EVERYTHING ELSE WAS VERIFIED THROUGH HAD NOTHING VERIFYING IT. portal/ui/harness/ stubs fetchJson so the real components render with no Mongo and no OAuth, and six realms' design work was checked against it. If a stub's payload drifts from what portal/api/ actually returns, the harness keeps rendering the old shape happily and every judgement made in front of it is made against a lie — the page looks finished and is measuring a fiction. That already happened once today in miniature: /api/analytics was stubbed with fixture arrays under the API's key names, and the dashboard rendered a complete-looking page reading "no boot recorded / 0 alerts / 0 users" on a fixture set holding 303 boots and 998 alerts.
//
// This EXECUTES the stub rather than pattern-matching it. Two regexes agreeing proves the regexes agree; calling the thing and inspecting what comes back proves the shape.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let failures = 0;
const say = console.log.bind(console);
function check(name, fn) {
    try { fn(); say(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

const ROOT = path.join(__dirname, '..');
const API_DIR = path.join(ROOT, 'portal', 'api');

// What each route PROMISES: the top-level keys of its 200 payload. These are written as shorthand object literals throughout portal/api/, so the keys are plain identifiers.
function promisedKeys() {
    const out = {};
    for (const f of fs.readdirSync(API_DIR).filter((n) => n.endsWith('.js'))) {
        const src = fs.readFileSync(path.join(API_DIR, f), 'utf8');
        // Pair each route with the FIRST 200-payload inside it, which is its success shape.
        const routes = [...src.matchAll(/route\(\s*'GET'\s*,\s*\/\^((?:\\.|[^/])+)\$\//g)];
        for (const r of routes) {
            const from = r.index;
            const next = src.indexOf("route('", from + 5);
            const body = src.slice(from, next === -1 ? src.length : next);
            const m = body.match(/sendJson\(res,\s*200,\s*\{([^}]*)\}/);
            if (!m) continue;
            const keys = m[1].split(',').map((k) => k.split(':')[0].trim()).filter((k) => /^[a-zA-Z_$][\w$]*$/.test(k));
            if (keys.length) out[r[1].replace(/\\/g, '')] = keys;
        }
    }
    return out;
}

// Run the stub the way the browser does: window + FIX, then evaluate its module body with the two import lines removed (it imports nothing it uses at module scope).
function loadStub() {
    global.window = global;
    global.document = { documentElement: { dataset: {} } };
    global.location = { search: '' };
    require('../docs/superpowers/mockups/2026-08-23-portal-interactive/assets/fixtures.js');
    // The stub narrates every call for a human at a browser console; in a test run that is noise between the lines that matter.
    const realLog = console.log; console.log = () => {}; console.warn = () => {};
    process.on('exit', () => { console.log = realLog; });
    let src = fs.readFileSync(path.join(ROOT, 'portal', 'ui', 'harness', 'stub.js'), 'utf8');
    src = src.replace(/^export\s+/gm, '');
    const module_ = { exports: {} };
    // eslint-disable-next-line no-new-func
    new Function('module', 'exports', 'window', 'location', src + '\nmodule.exports = { fetchJson, ROUTES };')(
        module_, module_.exports, global.window, global.location,
    );
    return module_.exports;
}

say('portalHarness — does the fixture harness tell the truth?');

const promised = promisedKeys();
const stub = loadStub();

// THE GATE'S OWN FALSIFIER. A payload-key scan that matched nothing would compare {} against {} and pass forever, which is indistinguishable from every route agreeing.
check('the API scan found real routes to check, so the cases below are not vacuous', () => {
    const n = Object.keys(promised).length;
    assert.ok(n >= 5, `expected several GET routes with 200 payloads, found ${n}`);
    assert.ok(promised['/api/season'] && promised['/api/season'].includes('live'), 'season must promise `live`');
});

// 🔴 AWAITED, AND THAT IS NOT A DETAIL. The first version passed an `async` function to a synchronous check(), so every assertion inside became an unhandled rejection that nothing counted — the suite printed a tick for /api/changeset while the stub was actually answering it with {ok:true} and the route promises {changesets}. A vacuous pass that LOOKS like a green line is the worst failure mode a gate has, and this file caught it in itself twice: once on the route scan finding zero routes, once here.
async function checkAsync(name, fn) {
    try { await fn(); say(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

// 🔴 KEY PRESENCE WAS NEVER ENOUGH, AND THIS FILE PROVED IT ON ITSELF. Every check above asks whether a key EXISTS. /api/analytics promised usageStats and timingStats and the stub answered both with fixture ARRAYS while the route returns OBJECTS — so the key was present, the suite was green, and the component read `usageStats.current` off an array and got undefined. That is the same shape as the defect in this file's own header, one level deeper: a value that exists and means something else.
//
// So a second, narrower table: for the payloads whose VALUE a component destructures, what does that value have to look like. Written as a table rather than a wall of asserts because the next drift will be in a realm that is not analytics.
const SHAPES = {
    '/api/analytics': {
        usageStats: { object: ['current', 'previous', 'byCommand', 'byEntry', 'byOutcome'],
            rowsIn: { byCommand: ['_id', 'c', 'ok', 'bg'], byEntry: ['_id', 'c'], byOutcome: ['_id', 'c'] } },
        timingStats: { object: ['overall', 'byCommand', 'byDep', 'ackBuckets'],
            rowsIn: { byCommand: ['_id', 'p', 'n'], byDep: ['_id', 'totalMs', 'calls'], ackBuckets: ['_id', 'n'] } },
        reach: { rows: ['context', 'installType', 'n'] },
        searches: { rows: ['term', 'command', 'field', 'searches', 'zeroResults', 'picked'] },
        outcomeKeys: { rows: null, minLength: 6 },
        entryKeys: { rows: null, minLength: 7 },
    },
};

function assertShape(where, value, spec) {
    if (spec.object) {
        assert.ok(value && typeof value === 'object' && !Array.isArray(value),
            `${where} must be an OBJECT, got ${Array.isArray(value) ? 'an array' : typeof value}`);
        for (const k of spec.object) assert.ok(k in value, `${where}.${k} is missing`);
        for (const [k, fields] of Object.entries(spec.rowsIn || {})) {
            assert.ok(Array.isArray(value[k]), `${where}.${k} must be an array`);
            assert.ok(value[k].length, `${where}.${k} is empty — a fixture set that renders nothing proves nothing`);
            for (const f of fields) assert.ok(f in value[k][0], `${where}.${k}[0].${f} is missing`);
        }
        return;
    }
    assert.ok(Array.isArray(value), `${where} must be an array`);
    assert.ok(value.length >= (spec.minLength || 1), `${where} has ${value.length} rows, expected at least ${spec.minLength || 1}`);
    for (const f of spec.rows || []) assert.ok(f in value[0], `${where}[0].${f} is missing`);
}

async function main() {
    // ⚠️ A ROUTE THAT REQUIRES A SCOPE MUST BE GIVEN ONE, and the map is shared with scripts/portalRoutes.test.js rather than copied — see scripts/lib/portalRouteQuery.js for why a second copy would keep passing while the real contract moved.
    const QUERY = require('./lib/portalRouteQuery');
    for (const [route, keys] of Object.entries(promised)) {
        await checkAsync(`the harness serves every key ${route} promises`, async () => {
            const body = await stub.fetchJson(route.replace('[^/]+', 'x') + (QUERY[route] || ''));
            const missing = keys.filter((k) => !(k in body));
            assert.deepStrictEqual(missing, [], `${route} promises ${keys.join(', ')} — the stub omits ${missing.join(', ')}`);
        });
    }

    for (const [route, spec] of Object.entries(SHAPES)) {
        await checkAsync(`the harness serves the right SHAPE under every key ${route} promises`, async () => {
            const body = await stub.fetchJson(route);
            for (const [key, rule] of Object.entries(spec)) assertShape(`${route}.${key}`, body[key], rule);
        });
    }

    // The shape table's own falsifier. Without this, a typo in SHAPES that made every rule vacuous would read exactly like every payload being correct — which is precisely how the array-under-an-object-key defect survived.
    await checkAsync('THE SHAPE GATE CAN FAIL: an array where an object is promised is caught', () => {
        assert.throws(() => assertShape('x.usageStats', [1, 2, 3], SHAPES['/api/analytics'].usageStats),
            /must be an OBJECT, got an array/);
        assert.throws(() => assertShape('x.reach', [{ context: 'guild' }], SHAPES['/api/analytics'].reach),
            /installType is missing/);
    });

    // Proven the way every other gate here is proven: seed the defect, watch it fail.
    await checkAsync('THE GATE CAN FAIL: a route answered with the wrong shape is caught', async () => {
        const body = await stub.fetchJson('/api/definitely-not-a-route');
        assert.ok(!('changesets' in body), 'the unrouted fallback must NOT satisfy a real promise');
    });

    say(failures ? `\n✗ ${failures} failed` : '\n✅ portalHarness: the stub matches every promise its routes make');
    process.exit(failures ? 1 : 0);
}
main();
