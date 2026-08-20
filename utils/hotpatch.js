// ==========================================
// HOTPATCH — reload a pulled file into the running process, or refuse and say why
// ==========================================
// THE INVARIANT: a reload is sound iff its dependent closure terminates at a LATE-BOUND BOUNDARY
// and every member of that closure is either stateless or declares a __hotSwap contract.
//
// A BOUNDARY is a module that resolves its dependency at CALL time, not at require time, so it
// never holds a stale reference and never needs reloading. Two exist:
//   · handlers/router.js -> the handler modules (via the late() accessors added 2026-08-20 11:47 EDT)
//   · handlers/router.js -> commands, via interaction.client.commands (a Collection, per-interaction)
// A boundary is where the closure ENDS. It is never a member, so its own module state is irrelevant
// -- which is exactly why router.js's interactionCooldowns Map does not block all 15 handlers.
//
// ⚠️ The graph is STATIC (read off disk), not built from require.cache. The runtime cache only
// records requires that have actually EXECUTED, so a lazy require() in a cold branch is missing
// from it -- fine for soundness (a lazy dependent re-resolves anyway and needs no invalidation) but
// it makes the answer depend on what the bot happened to run, un-testable offline, and unusable for
// `scripts/hotpatch.mjs --dry-run` with no bot attached. The static graph counts every edge as
// early-bound: closures come out LARGER, so the error is always toward REFUSING. That is the safe
// direction, and it is a deliberate trade, not an oversight.

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const SCANNED_DIRS = ['commands', 'handlers', 'utils', 'bot', 'models'];

// Boundaries: never members, never reloaded.
const BOUNDARIES = new Set(['handlers/router.js']);

// Structural refusals. index.js and bot/* own the process lifecycle (crash handlers, the client,
// the gateway listeners, the instance lock) -- re-requiring them would register a SECOND set.
// models/* is here for a different reason that is just as absolute: models export
// mongoose.model('Name', schema), which THROWS OverwriteModelError on a second call. No __hotSwap
// contract can make either category safe. Verified 2026-08-20 11:39 EDT that no models/*.js
// currently requires a utils/ file, so a model reaching a closure is not possible today -- this
// guard exists so that a future edge cannot make it possible silently.
const structural = f => f === 'index.js' || f.startsWith('bot/') || f.startsWith('models/');

function listModules() {
    const out = ['index.js'];
    for (const dir of SCANNED_DIRS) {
        const walk = (rel) => {
            const abs = path.join(REPO_ROOT, rel);
            if (!fs.existsSync(abs)) return;
            for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
                const child = `${rel}/${entry.name}`;
                if (entry.isDirectory()) walk(child);
                else if (entry.name.endsWith('.js') && !entry.name.endsWith('.test.js')) out.push(child);
            }
        };
        walk(dir);
    }
    return out;
}

// file -> Set(files that require it). Every relative require counts, lazy or not (see the header).
function buildReverseGraph(modules) {
    const known = new Set(modules);
    const rdeps = new Map(modules.map(m => [m, new Set()]));
    for (const mod of modules) {
        const src = fs.readFileSync(path.join(REPO_ROOT, mod), 'utf8');
        for (const match of src.matchAll(/require\((['"])(\.[^'"]+)\1\)/g)) {
            const raw = path.posix.normalize(path.posix.join(path.posix.dirname(mod), match[2]));
            // ⚠️ Resolve a DIRECTORY require too. `require("./manage")` from handlers/router.js means
            // handlers/manage/index.js; a naive `+ ".js"` looks for a handlers/manage.js that does not
            // exist and silently DROPS the edge. `./manage` is the only true directory require in the
            // tree today (verified 2026-08-20 11:47 EDT), which is exactly why it would go unnoticed.
            const target = known.has(raw) ? raw
                : known.has(`${raw}.js`) ? `${raw}.js`
                : known.has(`${raw}/index.js`) ? `${raw}/index.js` : null;
            if (target) rdeps.get(target).add(mod);
        }
    }
    return rdeps;
}

// Module-scope state that MUTATES, plus live timers and process listeners. A `new Set([...])` used
// as a constant lookup table is NOT state -- treating it as such is a false positive that would
// wrongly refuse utils/colorNames.js (DROPPED_NAMES) and utils/search.js (GENERIC_DRAW_WORDS).
// The test asserts exactly that case.
function stateReasons(rel, src) {
    const reasons = [];
    if (/^let\s+\w+/m.test(src)) reasons.push('module-scope `let`');
    for (const m of src.matchAll(/^const\s+(\w+)\s*=\s*new (?:Map|Set|WeakMap)\(/gm)) {
        if (new RegExp(`\\b${m[1]}\\.(set|delete|clear|add)\\s*\\(`).test(src)) reasons.push(`${m[1]} mutated`);
    }
    for (const m of src.matchAll(/^const\s+(\w+)\s*=\s*\[\s*\]/gm)) {
        if (new RegExp(`\\b${m[1]}\\.(push|splice|shift|pop)\\s*\\(`).test(src)) reasons.push(`${m[1]} mutated`);
    }
    if (/setInterval\(/.test(src)) reasons.push('setInterval');
    if (/^\s*process\.on\(/m.test(src)) reasons.push('process.on');
    // An opt-in contract discharges all of the above: the module has said how its state moves across.
    if (/__hotSwap\s*[:=]/.test(src)) return [];
    return [...new Set(reasons)];
}

function planHotpatch({ files }) {
    const modules = listModules();
    const known = new Set(modules);
    const rdeps = buildReverseGraph(modules);

    // `unresolved` = named a path that is not a scanned module at all (deleted by the pull, a
    // non-runtime file, a typo). Kept separate from runHotpatch's `stray` -- both used to be called
    // `unknown` and the panel printed one message for two different situations.
    const unresolved = files.filter(f => !known.has(f));
    const members = new Set();
    const stack = files.filter(f => known.has(f));
    while (stack.length) {
        const cur = stack.pop();
        if (members.has(cur) || BOUNDARIES.has(cur)) continue;
        members.add(cur);
        for (const parent of rdeps.get(cur) || []) {
            if (!members.has(parent) && !BOUNDARIES.has(parent)) stack.push(parent);
        }
    }

    const escaped = [...members].filter(structural).sort();
    if (escaped.length || unresolved.length) {
        return { verdict: 'REFUSE_STRUCTURAL', members: [...members].sort(), blocked: {}, escaped, unresolved, stray: [] };
    }

    const blocked = {};
    for (const m of members) {
        const reasons = stateReasons(m, fs.readFileSync(path.join(REPO_ROOT, m), 'utf8'));
        if (reasons.length) blocked[m] = reasons;
    }
    return {
        verdict: Object.keys(blocked).length ? 'REFUSE_STATE' : 'ALLOW',
        members: [...members].sort(), blocked, escaped: [], unresolved: [], stray: [],
    };
}

module.exports = { planHotpatch, REPO_ROOT, BOUNDARIES };
