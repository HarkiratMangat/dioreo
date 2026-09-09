// scripts/portalApi.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { gateCommit } = require('../portal/api/policy');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  \u2713 ${name}`); }
    catch (e) { failures++; console.error(`  \u2717 ${name}\n      ${e.message}`); }
}

check('a tier-3 changeset will not commit until it has been exported', () => {
    const r = gateCommit({ tier: 3, exportedAt: null, confirmText: 'Nightfall', expectText: 'Nightfall' });
    assert.strictEqual(r.ok, false);
    assert.match(r.reason, /export/i);
});

check('a tier-3 changeset will not commit on a wrong typed confirmation', () => {
    const r = gateCommit({ tier: 3, exportedAt: new Date(), confirmText: 'nightfal', expectText: 'Nightfall' });
    assert.strictEqual(r.ok, false);
    assert.match(r.reason, /confirm/i);
});

check('a tier-3 changeset with both gates satisfied commits', () => {
    assert.strictEqual(gateCommit({ tier: 3, exportedAt: new Date(), confirmText: 'Nightfall', expectText: 'Nightfall' }).ok, true);
});

check('tier 1 and 2 need neither gate', () => {
    assert.strictEqual(gateCommit({ tier: 1 }).ok, true);
    assert.strictEqual(gateCommit({ tier: 2 }).ok, true);
});

// Source-scan, matching the shape of scripts/botAccessPermissions.test.js: asserts an invariant rather than a unit. Every route registered anywhere in portal/api/ -- GET as well as POST -- must wrap its handler in requireAdmin. Extended to GET here (gap audit plan Task 2.5's own Step 4 flagged that this used to only scan POST): a GET route in this directory always returns admin-scoped data (permission grids, staged changesets, analytics), so an unguarded GET is exactly as real a leak as an unguarded mutation. portal/auth.js's own login/callback GETs are the one legitimate pre-auth exception, and they live outside this directory entirely, so this scan never has to special-case them.
check('every route (GET or POST) in portal/api/ is wrapped in requireAdmin', () => {
    const fs = require('fs'), path = require('path');
    const dir = path.join(__dirname, '..', 'portal', 'api');
    const bad = [];
    for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith('.js')) continue;
        const src = fs.readFileSync(path.join(dir, f), 'utf8');
        for (const m of src.matchAll(/route\(\s*'(?:GET|POST)'\s*,\s*([^,]+),\s*([^)]+)\)/g)) {
            if (!/requireAdmin/.test(m[2])) bad.push(`${f}: ${m[1].trim()}`);
        }
    }
    assert.deepStrictEqual(bad, [], `unguarded routes: ${bad.join(', ')}`);
});

// ── MALFORMED IDS ────────────────────────────────────────────────────────────────────────────
//
// 🔴 A CLIENT MISTAKE WAS REPORTED AS A SERVER ERROR, on six routes across two files, and it took booting the real server to see it: every route that looks a document up by a client-supplied id handed the raw string to Mongoose, which throws a CastError on anything that is not 24 hex characters. `?id=x` produced a 500 with a full stack in the log and "Something went wrong. It has been logged." in the response.
const { isObjectId } = require('../portal/api/httpUtil');

check('a real ObjectId passes and anything Mongoose would refuse does not', () => {
    assert.strictEqual(isObjectId('6a8b8e35493f2fb63caf63d2'), true);
    assert.strictEqual(isObjectId('6A8B8E35493F2FB63CAF63D2'), true, 'hex is case-insensitive');
    assert.strictEqual(isObjectId('x'), false);
    assert.strictEqual(isObjectId('6a8b8e35493f2fb63caf63d'), false, '23 characters is not an id');
    assert.strictEqual(isObjectId('6a8b8e35493f2fb63caf63d22'), false, 'nor is 25');
    assert.strictEqual(isObjectId('zzzzzzzzzzzzzzzzzzzzzzzz'), false, 'right length, not hex');
    assert.strictEqual(isObjectId(''), false);
    assert.strictEqual(isObjectId(null), false);
    assert.strictEqual(isObjectId(undefined), false);
    assert.strictEqual(isObjectId({}), false, 'a non-string must never pass — an object reaching a query is worse than a bad string');
});

// A source scan in the same shape as the requireAdmin one above: every route that takes an id out of the URL must gate it before the query, or the CastError comes back.
check('every changeset route guards its id before querying', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'portal', 'api', 'changesets.js'), 'utf8');
    const takes = (src.match(/const id = segment\(url, 2\);/g) || []).length;
    const guards = (src.match(/if \(!isObjectId\(id\)\) return sendJson\(res, 400/g) || []).length;
    assert.ok(takes > 0, 'the scan found no id-taking routes, which means it is looking at the wrong thing');
    assert.strictEqual(guards, takes, `${takes} routes read an id from the URL and ${guards} guard it`);
});

// ── THE ADMIN NOTE ───────────────────────────────────────────────────────────────────────────
//
// 🔴 THE REGRESSION THESE EXIST FOR, found 2026-09-09 09:49 EDT while building the note editor: the Access grid's row Save called `grant()` with three arguments where four are declared, `JSON.stringify` dropped the missing `note` entirely, and the route's `note: body.note || ''` turned that absence into an empty string — so every permission edit wiped the admin's label. Nothing could see it: the harness stub serves the Access GETs and has no `/api/access/grant` handler at all, so no rendered walk exercises this write path.
const { adminGrantDoc } = require('../portal/api/access');

check('an absent note leaves the stored label alone', () => {
    const doc = adminGrantDoc({ discordId: '1', grantedBy: '2', permissions: ['bot'] });
    assert.ok(!('note' in doc), 'a body with no note must not write one — this is the data-loss case itself');
});

check('a note sent as an empty string still clears the label', () => {
    const doc = adminGrantDoc({ discordId: '1', grantedBy: '2', permissions: ['bot'], note: '' });
    assert.strictEqual(doc.note, '', 'clearing on purpose has to keep working, or the fix has broken a real act');
});

check('a real note is written through', () => {
    assert.strictEqual(adminGrantDoc({ discordId: '1', grantedBy: '2', permissions: ['bot'], note: 'calendar helper' }).note, 'calendar helper');
});

check('THE NOTE GUARD CAN FAIL: the construction that shipped turns absence into an empty label', () => {
    const shipped = (body) => ({ note: body.note || '' });
    assert.strictEqual(shipped({}).note, '', 'the old shape wipes it — if this ever stops being true the case above is vacuous');
    assert.ok(!('note' in adminGrantDoc({ discordId: '1', grantedBy: '2', permissions: ['bot'] })), 'and the new shape does not');
});

// 🔴 THE CHECK THAT WOULD HAVE CAUGHT IT, and no gate here had this shape: a call site passing FEWER arguments than the function declares. It is silent in JavaScript, invisible to every renderer and every linter this repo runs, and the missing one was the field the whole realm identifies people by.
check('every grant() call site in the Access realm passes all four declared arguments', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'portal', 'ui', 'access.js'), 'utf8');
    const decl = src.match(/async function grant\(([^)]*)\)/);
    assert.ok(decl, 'the scan found no grant() declaration, which means it is looking at the wrong thing');
    const arity = decl[1].split(',').length;
    assert.strictEqual(arity, 4, 'the declaration changed — update this check with it');

    let masked;                                 // assigned below; the walker reads it, never the raw source
    const args = (from) => {                    // top-level comma count from the open paren
        let depth = 0, n = 1;
        for (let i = from; i < masked.length; i++) {
            const c = masked[i];
            if ('([{'.includes(c)) depth++;
            else if (')]}'.includes(c)) { if (--depth === 0) return n; }
            else if (c === ',' && depth === 1) n++;
        }
        return -1;
    };
    // ⚠️ PROSE IS NOT CODE, and the first version of this check did not know that: this very file's own comments say `grant()` with empty parens, which the scan counted as a call site passing one argument. Comments are blanked to SPACES rather than removed so every index and line number still lines up with the real source.
    masked = (() => {
        let out = '', i = 0;
        while (i < src.length) {
            if (src.startsWith('//', i)) { const e = src.indexOf('\n', i); const to = e === -1 ? src.length : e; out += ' '.repeat(to - i); i = to; }
            else if (src.startsWith('/*', i)) { const e = src.indexOf('*/', i + 2); const to = e === -1 ? src.length : e + 2; out += src.slice(i, to).replace(/[^\n]/g, ' '); i = to; }
            else { out += src[i]; i++; }
        }
        return out;
    })();

    const sites = [];
    for (const m of masked.matchAll(/(?<![A-Za-z])grant\(/g)) {
        const open = m.index + m[0].length - 1;
        if (/function grant\($/.test(masked.slice(0, open + 1))) continue;   // the declaration itself
        if (masked[open + 1] === ')') continue;                              // grant() with no arguments is prose that survived, or a typo the parser below cannot rate
        sites.push({ line: masked.slice(0, m.index).split('\n').length, n: args(open) });
    }
    assert.ok(sites.length, 'no grant() call sites found — the matcher is wrong, not the code');
    const short = sites.filter((s) => s.n < arity);
    assert.deepStrictEqual(short, [], `grant() takes ${arity} arguments and these call sites pass fewer: ` + short.map((s) => `access.js:${s.line} passes ${s.n}`).join(', '));
});

process.exit(failures ? 1 : 0);
