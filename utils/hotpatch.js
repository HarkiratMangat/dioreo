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

const { execFileSync } = require('child_process');

const abs = rel => path.join(REPO_ROOT, rel);

// A commands/*.js must satisfy the SAME predicate bot/registry.js's loader uses, or a swapped
// module would register into client.commands in a shape the router cannot dispatch.
const isCommandShape = m => m && typeof m === 'object' && 'data' in m && 'execute' in m;

/**
 * Verify-then-swap, ALL OR NOTHING. On any failure the old module objects are put back into
 * require.cache and client.commands, so the process never runs a half-updated tree -- a bot that
 * LOOKS fine while running mixed code is strictly worse than one that is plainly restarting.
 */
// ONE AT A TIME. Discord and the CLI can both fire; two interleaved delete/re-require passes would
// defeat the snapshot/restore. ✅ Consequence worth keeping: this `let` makes utils/hotpatch.js
// classify as stateful, and bot/lifecycle.js requires it, so hotpatch is REFUSE_STRUCTURAL on its
// OWN engine and can never patch itself. That is correct -- do not work around it.
let inFlight = false;

async function applyHotpatch(plan, { client }) {
    if (plan.verdict !== 'ALLOW') return { ok: false, applied: [], error: `plan verdict is ${plan.verdict}` };
    if (inFlight) return { ok: false, applied: [], error: 'another hotpatch is already running' };
    inFlight = true;
    try { return await applyHotpatchInner(plan, { client }); } finally { inFlight = false; }
}

async function applyHotpatchInner(plan, { client }) {

    // 1. Syntax gate first -- same check `npm run check` runs, and it costs nothing to fail here.
    for (const rel of plan.members) {
        try { execFileSync(process.execPath, ['--check', abs(rel)], { stdio: 'pipe', timeout: 10000 }); }
        catch (err) { return { ok: false, applied: [], error: `${rel} failed node --check: ${err.stderr?.toString().trim() || err.message}` }; }
    }

    // 2. Snapshot everything we are about to disturb.
    const ids = plan.members.map(rel => ({ rel, id: require.resolve(abs(rel)) }));
    const cacheSnapshot = new Map(ids.map(({ id }) => [id, require.cache[id]]));
    const commandSnapshot = new Map();
    if (client?.commands) {
        for (const { rel, id } of ids) {
            if (!rel.startsWith('commands/')) continue;
            const name = require.cache[id]?.exports?.data?.name;
            if (name) commandSnapshot.set(name, client.commands.get(name));
        }
    }

    // 3. Let any module that declares a contract hand its live state forward.
    //    ⚠️ planHotpatch's __hotSwap detection is a SOURCE REGEX, so a comment mentioning the name
    //    would satisfy it. This is the authoritative check: if the plan waved a module through on a
    //    contract it does not actually have, fail here rather than silently dropping its state.
    const retained = new Map();
    for (const { rel, id } of ids) {
        const src = fs.readFileSync(abs(rel), 'utf8');
        const hot = require.cache[id]?.exports?.__hotSwap;
        if (/__hotSwap\s*[:=]/.test(src) && typeof hot?.retain !== 'function') {
            return { ok: false, applied: [], error: `${rel} mentions __hotSwap but does not export a retain() function` };
        }
        if (hot?.retain) { try { retained.set(rel, hot.retain()); } catch (err) { return { ok: false, applied: [], error: `${rel} __hotSwap.retain() threw: ${err.message}` }; } }
    }

    // Discord-facing shapes as they stand RIGHT NOW, for the comparison in step 5.
    const shapeSnapshot = new Map();
    for (const { rel, id } of ids) {
        if (!rel.startsWith('commands/')) continue;
        const d = require.cache[id]?.exports?.data;
        shapeSnapshot.set(rel, d ? JSON.stringify(d.toJSON ? d.toJSON() : d) : null);
    }

    const restore = () => {
        for (const [id, mod] of cacheSnapshot) { if (mod) require.cache[id] = mod; else delete require.cache[id]; }
        for (const [name, cmd] of commandSnapshot) { if (cmd) client.commands.set(name, cmd); }
    };

    try {
        // 4. Swap.
        for (const { id } of ids) delete require.cache[id];
        const fresh = new Map();
        for (const { rel, id } of ids) fresh.set(rel, require(id));

        // 5. Shape validation, before anything is wired.
        for (const [rel, mod] of fresh) {
            if (!rel.startsWith('commands/')) continue;
            if (!isCommandShape(mod)) throw new Error(`${rel} no longer exports data + execute`);
            // 🔴 DISCORD-FACING SHAPE. The command list Discord shows comes from ONE REST PUT at boot.
            // Swapping the module changes what execute() DOES, never what Discord SHOWS -- so a new
            // command would land in client.commands with no way to invoke it, and a changed option or
            // description would leave every user on the old shape, both under a ✅ Applied message.
            // Refuse instead. Re-PUTting from here drags in rate limits, applyGunsmithsScopeChoices's
            // builder mutation and gateableCommandNames -- far more than "minor hot fix" warrants.
            const before = shapeSnapshot.get(rel);
            const now = JSON.stringify(mod.data.toJSON ? mod.data.toJSON() : mod.data);
            if (before !== now) throw new Error(`${rel}: the Discord-facing command shape changed (new command, or an option/description edit). That needs a re-register — use Full restart.`);
        }
        const { HANDLER_BINDINGS } = require('../handlers/router');
        for (const [modName, fnName] of HANDLER_BINDINGS) {
            const rel = fresh.has(`handlers/${modName}.js`) ? `handlers/${modName}.js` : (fresh.has(`handlers/${modName}/index.js`) ? `handlers/${modName}/index.js` : null);
            if (rel && typeof fresh.get(rel)[fnName] !== 'function') throw new Error(`${rel} no longer exports ${fnName}()`);
        }

        // 6. Hand the retained state to the new instances.
        for (const [rel, prev] of retained) {
            const hot = fresh.get(rel)?.__hotSwap;
            if (hot?.adopt) hot.adopt(prev);
        }

        // 7. Re-wire the one boundary that needs it. Handlers need none -- the router resolves them
        //    at call time (Task 2), which is the whole point of that change.
        if (client?.commands) {
            for (const [rel, mod] of fresh) {
                if (rel.startsWith('commands/') && mod.data?.name) client.commands.set(mod.data.name, mod);
            }
        }
        return { ok: true, applied: plan.members };
    } catch (err) {
        restore();
        return { ok: false, applied: [], error: err.message };
    }
}

module.exports = { planHotpatch, applyHotpatch, REPO_ROOT, BOUNDARIES };
