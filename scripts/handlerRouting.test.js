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
    'admin_visibility_menu',   // owned by commands/admin.js, dispatched before the chain
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

// --- 9. DECLARED PREFIXES vs THE BRANCHES THAT ACTUALLY EXIST ---
// Check 2 trusts OWNED_PREFIXES. This is what makes that trust earned. A declaration and the
// branches beneath it are two separate pieces of state, and nothing kept them in step: every check
// here reads the declaration, while Discord routes on the branches.
//
// It matters most for handlers/colors.js, which is deliberately DECLARATIVE-ONLY — it does not gate
// on OWNED_PREFIXES at all (an unrecognised `colors_*` id must fall through, see the comment on the
// declaration there), so its list exists solely to feed check 2. That comment ends "Keep this list
// in step with the branches", which was an obligation on whoever edits the file and is now an
// assertion. Add a `colorsx_` branch without declaring it and the collision scan silently stops
// covering it — no error, and the one check protecting the dispatch design quietly narrows.
//
// Two directions, because each fails differently:
//   declared ⊇ actual — an undeclared branch is invisible to check 2 (a real collision can hide).
//   every declared prefix has ≥1 branch — a stale entry claims a namespace nothing serves, which
//   can block a LATER module from legitimately taking it.
//
// Comments are stripped before matching. handlers/drawprices.js documents, in prose, the `toggle_`
// prefix it deliberately avoided; read as code that reads as a collision, and an audit chased it as
// a real bug on 2026-08-13. A checker that treats comments as code manufactures findings out of the
// very comments written to prevent them.
const stripComments = (src) => src.split('\n').map(line => {
    let out = '', quote = null, i = 0;
    while (i < line.length) {
        const c = line[i], next = line[i + 1];
        if (quote) {
            if (c === '\\') { out += c + (next || ''); i += 2; continue; }
            if (c === quote) quote = null;
            out += c; i++; continue;
        }
        if (c === '"' || c === "'" || c === '`') { quote = c; out += c; i++; continue; }
        if (c === '/' && next === '/') break;
        out += c; i++;
    }
    return out;
}).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');

// Every literal this module branches on. `typeof customId === 'string'` is excluded explicitly —
// it matches the shape of a branch test and is not one, and it produced 66 phantom collisions in
// the audit that led to this check.
const branchLiterals = (src) => {
    const found = new Set();
    for (const m of src.matchAll(/(?:interaction\.)?customId\.startsWith\(\s*(['"`])([^'"`]+)\1/g)) found.add(m[2]);
    for (const m of src.matchAll(/(typeof\s+)?(?:interaction\.)?customId\s*===?\s*(['"`])([^'"`]+)\2/g)) {
        if (!m[1]) found.add(m[3]);
    }
    for (const m of src.matchAll(/(?:interaction\.)?customId\.match\(\s*\/\^([A-Za-z0-9_|-]+)/g)) found.add(m[1]);
    return [...found];
};

check('every branch literal is covered by its own module\'s OWNED_PREFIXES', () => {
    const offenders = [];
    for (const name of moduleNames) {
        const declared = require(path.join(HANDLERS_DIR, name)).OWNED_PREFIXES || [];
        const src = stripComments(fs.readFileSync(path.join(HANDLERS_DIR, name + '.js'), 'utf8'));
        for (const literal of branchLiterals(src)) {
            if (!declared.some(p => literal.startsWith(p))) {
                offenders.push(`${name}.js branches on "${literal}" but declares [${declared.join(', ')}] — check 2 cannot see it`);
            }
        }
    }
    assert.deepStrictEqual(offenders, [], `\n      ${offenders.join('\n      ')}`);
});

check('every declared prefix has at least one branch behind it', () => {
    const offenders = [];
    for (const name of moduleNames) {
        const declared = require(path.join(HANDLERS_DIR, name)).OWNED_PREFIXES || [];
        const src = stripComments(fs.readFileSync(path.join(HANDLERS_DIR, name + '.js'), 'utf8'));
        const literals = branchLiterals(src);
        for (const prefix of declared) {
            if (!literals.some(l => l.startsWith(prefix))) {
                offenders.push(`${name}.js declares "${prefix}" but no branch matches it — a namespace claimed and unserved`);
            }
        }
    }
    assert.deepStrictEqual(offenders, [], `\n      ${offenders.join('\n      ')}`);
});

// --- 10. THE ADMIN GATE'S PREFIX LIST MUST EQUAL THE MODULES' OWN ---
// handlers/router.js's MANAGE_PREFIX_COMMAND is the choke point that decides who may click a
// /manage, /autobuild or /alerts component. It carries its own copy of those three modules'
// prefixes — it has to, because it maps each prefix to a COMMAND NAME for the per-command
// permission lookup, which OWNED_PREFIXES does not encode.
//
// The split created the duplication: OWNED_PREFIXES became the obvious place a module states what
// it owns, while the guard's list stayed behind in the router. They are byte-identical today and
// nothing checked that they stay so. Add `mng_newthing` to handlers/manage.js and forget the map,
// and the new branch ships with NO admin check — anyone who can see the panel can click it, while
// check 2, check 9 and every other test here stay green. That is a permission hole opened by an
// omission, which is the failure mode this whole file exists to make impossible.
check('the admin guard covers exactly the prefixes its modules declare', () => {
    const routerSrc = stripComments(fs.readFileSync(path.join(HANDLERS_DIR, 'router.js'), 'utf8'));
    const block = /MANAGE_PREFIX_COMMAND\s*=\s*\{([\s\S]*?)\}/.exec(routerSrc);
    assert.ok(block, 'MANAGE_PREFIX_COMMAND not found in handlers/router.js — the admin gate moved or was renamed');

    const guarded = {};
    for (const m of block[1].matchAll(/['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g)) {
        (guarded[m[2]] = guarded[m[2]] || []).push(m[1]);
    }
    assert.ok(Object.keys(guarded).length > 0, 'parsed no prefixes out of MANAGE_PREFIX_COMMAND');

    const offenders = [];
    for (const [command, prefixes] of Object.entries(guarded)) {
        if (!moduleNames.includes(command)) {
            offenders.push(`guard maps ${prefixes.length} prefix(es) to "${command}", which is not a handler module`);
            continue;
        }
        const declared = require(path.join(HANDLERS_DIR, command)).OWNED_PREFIXES || [];
        for (const p of prefixes) {
            if (!declared.includes(p)) offenders.push(`guard gates "${p}" but ${command}.js no longer declares it — a dead gate`);
        }
        for (const p of declared) {
            if (!prefixes.includes(p)) offenders.push(`${command}.js declares "${p}" but the admin guard does not gate it — UNGATED ADMIN SURFACE`);
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
