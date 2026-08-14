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
// Every prefix is read off the module itself. It used to carry a hardcoded `['colors_']` for the one
// handler that had no OWNED_PREFIXES export, which meant a NEW colours prefix would have been
// invisible to this check — a blind spot in the very test that protects the dispatch design. Now
// nothing is hardcoded: a handler that fails to declare its prefixes fails the test rather than
// quietly contributing nothing to the collision scan.
const prefixOwners = [];
for (const name of moduleNames) {
    const mod = require(path.join(HANDLERS_DIR, name));
    const prefixes = mod.OWNED_PREFIXES;
    check(`${name}: declares the custom_id prefixes it owns`, () => {
        assert.ok(Array.isArray(prefixes) && prefixes.length > 0,
            'no OWNED_PREFIXES export — this module contributes nothing to the collision scan below, ' +
            'so a prefix it claims could silently overlap another handler');
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

// --- 5. TYPE DISCIPLINE ---
// A REAL BUG this caught on 2026-08-13 18:45 EDT, after the split was already pushed. Pre-split, the
// router separated interaction types structurally: `set_` (a SELECT) lived in the isStringSelectMenu()
// block and `set_page_` (a BUTTON) in the isButton() block. Flattening each subsystem into one
// function removed that separation — and `set_page_2` matches `startsWith('set_')` first, so a page
// click entered the select handler, deferred, then threw on `interaction.values[0]` (buttons have no
// `.values`). The router's crash net swallowed it, so the button simply looked dead.
//
// The fix was to make the type test explicit in each branch. This test is what stops it regressing:
// a handler must DECLINE an id whose prefix it owns when the interaction TYPE is wrong for it.
// 5a. RUNTIME PROBE. `interaction.values` exists only on a select. A button that wrongly enters a
// select branch reads it and throws — which is exactly what happened. The probe makes that read
// distinguishable from every other failure (a missing DB, an unstubbed method), so the assertion is
// about type routing specifically and not about the branch running to completion.
const VALUES_READ = 'SELECT_ONLY_VALUES_READ';
const asButton = (customId) => ({
    customId,
    isButton: () => true,
    isStringSelectMenu: () => false,
    isModalSubmit: () => false,
    get values() { throw new Error(VALUES_READ); },
    deferUpdate: async () => {}, deferReply: async () => {}, reply: async () => {},
    followUp: async () => {}, showModal: async () => {}, editReply: async () => {},
    message: { flags: { bitfield: 0 } },
    user: { id: '1' }, guildId: null,
});

const buttonCases = [
    ['settings', 'set_page_2', '`set_page_` is a button that ALSO matches the `set_` select branch'],
    ['loadouts', 'mpbrowse', '`mpbrowse` is a select id that ALSO matches the `mp` button branch'],
];
for (const [mod, id, why] of buttonCases) {
    check(`${mod}: a button "${id}" never enters a select branch — ${why}`, async () => {
        try {
            await entries[mod](asButton(id));
        } catch (err) {
            assert.notStrictEqual(err.message, VALUES_READ,
                'a BUTTON reached a select-only branch and read interaction.values');
        }
    });
}

// 5b. STRUCTURAL. A module handling more than one interaction type must type-test every branch —
// prefix alone cannot separate them, and relying on branch ORDER to do it is how 5a's bug happened.
check('every branch in a mixed-type handler carries an interaction-type test', () => {
    const offenders = [];
    for (const name of moduleNames) {
        const src = fs.readFileSync(path.join(HANDLERS_DIR, name + '.js'), 'utf8')
            .split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
        const types = ['isButton', 'isStringSelectMenu', 'isModalSubmit'].filter(t => src.includes(t + '()'));
        if (types.length < 2) continue; // single-type module: prefix ownership is sufficient
        // manage.js groups its branches under three type blocks instead of testing per branch.
        if (/if \(interaction\.isStringSelectMenu\(\)\) \{/.test(src) && /if \(interaction\.isButton\(\)\) \{/.test(src)) continue;
        for (const line of src.split('\n')) {
            const m = line.match(/^\s{4,8}if \((.*customId.*)\) \{/);
            if (m && !/\bis(Button|StringSelectMenu|ModalSubmit)\(\)/.test(m[1])) {
                offenders.push(`${name}.js: ${m[1].trim().slice(0, 70)}`);
            }
        }
    }
    assert.deepStrictEqual(offenders, [], `\n      ${offenders.join('\n      ')}`);
});

// --- 6. INTRA-MODULE SHADOWING ---
// Check 2 asks whether two MODULES claim the same id. This asks the same question one level down:
// inside a single module, does an earlier branch swallow a later one? That is precisely the shape of
// the `set_`/`set_page_` bug — the branches were in one module, the earlier prefix matched the later
// id, and only interaction type separated them. A shadowed branch is DEAD CODE that looks live: no
// error, no log, the button simply does nothing.
//
// A pair is fine when any of these hold: they are gated to different interaction types; the earlier
// branch matches by `===` rather than `startsWith`; or it explicitly excludes the later id
// (`&& customId !== 'x'`), which is how the paginator indicators are handled.
check('no branch is shadowed by an earlier branch in the same module', () => {
    const shadowed = [];
    for (const name of moduleNames) {
        const src = fs.readFileSync(path.join(HANDLERS_DIR, name + '.js'), 'utf8')
            .split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n').split('\n');
        const branches = [];
        let blockType = null;
        src.forEach((line, i) => {
            const g = line.match(/if \(interaction\.(isStringSelectMenu|isButton|isModalSubmit)\(\)\) \{/);
            if (g) { blockType = g[1]; return; }
            const m = line.match(/^\s{4,12}if \((.*customId.*)\) \{/);
            if (!m) return;
            const cond = m[1];
            const ids = [...cond.matchAll(/customId(?:\s*===\s*|\.startsWith\()\s*['"]([^'"]+)['"]/g)].map(x => x[1]);
            if (!ids.length) return;
            branches.push({
                line: i + 1,
                ids,
                excl: [...cond.matchAll(/customId\s*!==\s*['"]([^'"]+)['"]/g)].map(x => x[1]),
                exact: /customId\s*===/.test(cond),
                negated: /!\s*(interaction\.)?customId\.startsWith/.test(cond),
                type: (cond.match(/interaction\.(isStringSelectMenu|isButton|isModalSubmit)\(\)/) || [])[1] || blockType,
            });
        });
        for (let i = 0; i < branches.length; i++) {
            for (let j = i + 1; j < branches.length; j++) {
                const a = branches[i], b = branches[j];
                if (a.type && b.type && a.type !== b.type) continue;
                if (a.exact || a.negated) continue;
                for (const bid of b.ids) {
                    const by = a.ids.find(aid => bid.startsWith(aid));
                    if (by && !a.excl.includes(bid)) {
                        shadowed.push(`${name}.js: L${a.line} "${by}" makes L${b.line} "${bid}" unreachable`);
                    }
                }
            }
        }
    }
    assert.deepStrictEqual(shadowed, [], `\n      ${shadowed.join('\n      ')}`);
});

// --- 7. COMMENTS THAT POINT ACROSS A FILE BOUNDARY ---
// The split moved code, and the comments came with it — including their POSITIONAL language. A
// comment saying a handler is "further down" was true in the 4,553-line index.js and is a lie once
// that handler lives in another file. This is invisible to every other check here: the code is
// correct, only the prose is wrong, and prose is what the next person navigates by.
//
// Flags a line ONLY when it combines positional language with a custom_id owned by a DIFFERENT
// module AND does not name that module's file. Naming the file is the fix and the escape hatch:
// "`toggle_` is handled in handlers/settings.js" is fine; "`toggle_` further down" is not.
// Found 4 real cases on 2026-08-13 21:35 EDT, which is why it is here rather than a one-off sweep.
check('no comment uses positional language about a custom_id owned by another module', () => {
    const POSITIONAL = /\b(above|below|further down|further up|up there|earlier in this file|later in this file)\b/i;
    const owners = {};
    for (const name of moduleNames) {
        (require(path.join(HANDLERS_DIR, name)).OWNED_PREFIXES || []).forEach(p => { owners[p] = name; });
    }
    // Longest prefix wins, so `set_page_` resolves to settings rather than any shorter match.
    const ownerOf = (id) => {
        let best = null;
        for (const p of Object.keys(owners)) if (id.startsWith(p) && (!best || p.length > best.length)) best = p;
        return best ? owners[best] : null;
    };

    const offenders = [];
    for (const file of fs.readdirSync(HANDLERS_DIR)) {
        const self = file.replace(/\.js$/, '');
        fs.readFileSync(path.join(HANDLERS_DIR, file), 'utf8').split('\n').forEach((line, i) => {
            if (!/^\s*\/\//.test(line) || !POSITIONAL.test(line)) return;
            for (const m of line.matchAll(/`?\b([a-z]+_[a-z_]*)\b`?/g)) {
                const owner = ownerOf(m[1]);
                if (!owner || owner === self) continue;
                if (line.includes(`${owner}.js`)) continue; // names the file — that is the fix
                offenders.push(`${file}:${i + 1} says "${m[1]}" is ${POSITIONAL.exec(line)[0]}, but it lives in ${owner}.js`);
            }
        });
    }
    assert.deepStrictEqual(offenders, [], `\n      ${offenders.join('\n      ')}`);
});

// --- 8. NO NUMBERED OR LETTERED SECTION HEADERS ---
// Standing convention, Harkirat 2026-08-13 21:36 EDT: *"ditch the numbering/lettering system and
// just do section headers. as code changes, the numbering/lettering go stale."*
//
// A label like `PHASE 4` or `// B.6` encodes POSITION, which is precisely the thing that rots. The
// split proved it three ways at once: `index.js` and `bot/registry.js` both ended up with a `PHASE
// 4` meaning different things; `A.`/`C.`/`F.` each labelled two unrelated sections in two files;
// `colors.js` carried `B.6`–`B.8` while its supposed siblings `B.1`–`B.5` lived in other files; and
// `router.js` kept `STEP 6.1`/`6.2` with 6.3–6.5 deleted, leaving holes a reader has to explain to
// themselves. A descriptive header cannot go stale this way — it says what the code IS, not where
// it sits. 44 labels were removed to establish this; the check exists so they do not come back.
//
// An ordered list INSIDE a paragraph ("1. load the modules, 2. register listeners") is fine and is
// not matched — it describes a real sequence rather than labelling a section.
check('no numbered or lettered section headers (they encode position, which rots)', () => {
    const SCHEMES = [
        [/^\s*\/\/ (?:---\s*)?(?:PHASE|STEP|STAGE) [\d.]+:/, 'PHASE/STEP/STAGE numbering'],
        [/^\s*\/\/ (?:---\s*)?ADMIN ROUTE [A-Z]/, 'ADMIN ROUTE lettering'],
        [/^\s*\/\/ (?:---\s*|=== )?[A-K]\.(?:\d+[a-z]?)? [A-Z"`]/, 'letter-prefixed section label'],
    ];
    const roots = [
        { dir: path.join(__dirname, '..'), files: ['index.js'] },
        { dir: path.join(__dirname, '..', 'bot'), files: null },
        { dir: HANDLERS_DIR, files: null },
    ];
    const offenders = [];
    for (const { dir, files } of roots) {
        for (const file of files || fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
            fs.readFileSync(path.join(dir, file), 'utf8').split('\n').forEach((line, i) => {
                for (const [re, label] of SCHEMES) {
                    if (re.test(line)) offenders.push(`${file}:${i + 1} ${label} — ${line.trim().slice(0, 60)}`);
                }
            });
        }
    }
    assert.deepStrictEqual(offenders, [], `\n      ${offenders.join('\n      ')}`);
});

setTimeout(() => {
    console.log(failures === 0
        ? `\nAll routing-contract checks passed (${moduleNames.length} handlers).`
        : `\n${failures} check(s) FAILED.`);
    process.exit(failures === 0 ? 0 : 1);
}, 100);
