// Routing-contract tests for handlers/*.js — the per-subsystem split of index.js
// (2026-08-13 17:50 EDT, v3.16.0-pre). See .claude/rules/interaction-router.md.
//
// WHAT THIS COVERS, and what it deliberately does not. The branch BODIES need a live Discord
// interaction plus Mongo, so their behaviour is verified by the live click-test, not here. What is
// checkable cheaply — and is exactly what this refactor could break silently — is OWNERSHIP:
//
//   1. PREFIX EXCLUSIVITY. The whole design rests on no two handlers claiming the same custom_id.
//      That was verified mechanically when the branches were extracted, but nothing would stop a
//      later edit from adding, say, `set_` to a second module. Two owners means the first in the
//      chain silently swallows the other's interactions — no error, the button just stops working.
//   2. FALL-THROUGH. A handler must answer FALSE for an id it does not own, or the dispatch chain
//      stops early and every subsystem below it goes dead.
//
// Runs with no network and no DB: an unowned id returns before any branch body executes.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const HANDLERS_DIR = path.join(__dirname, '..', 'handlers');

let failures = 0;
function check(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
    } catch (error) {
        failures++;
        console.error(`  ✗ ${name}\n      ${error.message}`);
    }
}

// Every module in handlers/ except the router itself is a subsystem handler.
const moduleNames = fs.readdirSync(HANDLERS_DIR)
    .filter(f => f.endsWith('.js') && f !== 'router.js')
    .map(f => f.replace(/\.js$/, ''))
    .sort();

console.log('handlers/*.js — routing contract\n');

// --- 1. Shape: every handler exports exactly one async entry point ---
const entries = {};
for (const name of moduleNames) {
    check(`${name}: exports a single async handler`, () => {
        const mod = require(path.join(HANDLERS_DIR, name));
        const fns = Object.entries(mod).filter(([, v]) => typeof v === 'function');
        assert.strictEqual(fns.length, 1, `expected 1 exported function, got ${fns.length}: ${fns.map(f => f[0]).join(', ')}`);
        assert.strictEqual(fns[0][1].constructor.name, 'AsyncFunction', `${fns[0][0]} must be async — the router awaits it`);
        entries[name] = fns[0][1];
    });
}

// --- 2. Prefix exclusivity ---
// colors.js predates the OWNED_PREFIXES convention and decides ownership branch-by-branch instead,
// so its prefixes are declared here rather than read off the module. Kept in this test (not silently
// skipped) because it is exactly as capable of colliding with another handler as the rest.
const COLORS_PREFIXES = ['colors_'];

const prefixOwners = [];
for (const name of moduleNames) {
    const mod = require(path.join(HANDLERS_DIR, name));
    const prefixes = mod.OWNED_PREFIXES || mod.MANAGE_PREFIXES || (name === 'colors' ? COLORS_PREFIXES : null);
    check(`${name}: declares the custom_id prefixes it owns`, () => {
        assert.ok(Array.isArray(prefixes) && prefixes.length > 0,
            'no OWNED_PREFIXES export — the router cannot reason about what this module claims');
    });
    (prefixes || []).forEach(p => prefixOwners.push({ name, prefix: p }));
}

check('no two handlers claim overlapping custom_id prefixes', () => {
    const collisions = [];
    for (const a of prefixOwners) {
        for (const b of prefixOwners) {
            if (a.name === b.name) continue;
            // A collision is one prefix being a prefix OF another: `set_` would swallow `set_page_`.
            if (b.prefix.startsWith(a.prefix)) {
                collisions.push(`${a.name} "${a.prefix}" swallows ${b.name} "${b.prefix}"`);
            }
        }
    }
    assert.deepStrictEqual(collisions, [], `\n      ${collisions.join('\n      ')}`);
});

// --- 3. Fall-through ---
// One id per handler, plus ids that belong to no handler at all. Each must be declined by every
// handler that does not own it.
const FOREIGN_IDS = [
    'server_visibility_menu',   // owned by commands/server.js, dispatched before the chain
    'totally_unknown_button',
    '',
];

for (const name of moduleNames) {
    check(`${name}: declines ids it does not own`, () => {
        const handler = entries[name];
        if (!handler) throw new Error('handler did not load');
        for (const id of FOREIGN_IDS) {
            const result = handler({ customId: id });
            assert.ok(result instanceof Promise, 'handler must return a promise');
            result.then(v => {
                assert.strictEqual(v, false, `claimed foreign id ${JSON.stringify(id)}`);
            }).catch(err => {
                failures++;
                console.error(`  ✗ ${name} threw on foreign id ${JSON.stringify(id)}: ${err.message}`);
            });
        }
    });
}

// --- 4. The indicator-button trap ---
// Disabled "1 / 2" page indicators are prefixed like their own subsystem's real buttons. They must
// never be consumed as if they were a real click. colors_subpage_indicator is the documented case;
// set_page_indicator is its /settings twin.
check('colors_subpage_indicator is not consumed by handlers/colors.js', async () => {
    const { handleColorsButton } = require(path.join(HANDLERS_DIR, 'colors'));
    assert.strictEqual(await handleColorsButton({ customId: 'colors_subpage_indicator' }), false);
});

setTimeout(() => {
    console.log(failures === 0
        ? `\nAll routing-contract checks passed (${moduleNames.length} handlers).`
        : `\n${failures} check(s) FAILED.`);
    process.exit(failures === 0 ? 0 : 1);
}, 100);
