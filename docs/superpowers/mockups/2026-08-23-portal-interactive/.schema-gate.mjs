// .schema-gate.mjs — asserts the mockup names nothing the bot does not have.
//
// ⚠️ WHY. Three separate errors in this package were "a name that exists nowhere in the system,
// written confidently": an `editor` role, a `loadouts.setRank` op, a `views` column, an `is2XCP`
// flag. Every one of them read as plausible and none of them was checkable by eye across 8 files.
// This converts "did I invent something?" from a judgement into an exit code.
//
// Run:  node .schema-gate.mjs        (add --self-test to prove each check can actually FAIL)
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const REPO = '/Applications/Claude Code/Diors-Builds';
// ⚠️ Resolve every path from THIS FILE, never from the CWD. The gate read `assets/fixtures.js`
// relatively and so only worked when run from inside the package directory — it crashed with
// ENOENT the first time `npm run portal:gate` invoked it from the repo root. Found by wiring it
// up, which is the whole argument for wiring it up: a verifier that only runs one way has only
// ever been proven one way.
const HERE = dirname(fileURLToPath(import.meta.url));
const here = (f) => join(HERE, f);

const ops = require(`${REPO}/core/ops`);
const { MANAGE_PAGE_SCOPES, ADMIN_COMMANDS } = require(`${REPO}/utils/adminAccess`);
const OP_TYPES = new Set(ops.listOpTypes());
const PERM_TOKENS = new Set([...ADMIN_COMMANDS, ...MANAGE_PAGE_SCOPES.map((p) => `manage.${p}`)]);

// Access grant/revoke and portal-session end are deliberately NOT ops: portal/api/access.js's own
// header — "NOT part of the core operation algebra: admin grants/revokes are direct AdminUser
// writes … and a live PortalSession end is a direct write too." So they are named here, once,
// rather than the check being loosened to let any unknown string through.
const NON_OP_ACTIONS = new Set([
    // portal/api/access.js — direct AdminUser writes, named from its own routes.
    'access.grant', 'access.revoke', 'session.end',
    // portal/api/changesets.js — changeset LIFECYCLE, one level above the entity ops it carries.
    'changeset.preview', 'changeset.export', 'changeset.discard', 'changeset.commit',
    // core/revert.js — replays a ChangeLog row's stored inverse. Not itself a registered type.
    'changelog.revert',
]);

const pages = readdirSync(HERE).filter((f) => f.endsWith('.html'));
const sources = Object.fromEntries([...pages, 'assets/fixtures.js', 'assets/shell.js']
    .map((f) => [f, readFileSync(here(f), 'utf8')]));

const failures = [];
const fail = (check, file, msg) => failures.push({ check, file, msg });

// ── 1. every op name is registered ───────────────────────────────────────────────────────────
// Matches `op:'x.y'` and `type:'x.y'` — the two keys a staged-op record and a raw op use.
function checkOps(file, src, allow = NON_OP_ACTIONS) {
    for (const m of src.matchAll(/\b(?:op|type)\s*:\s*'([a-z][A-Za-z]*\.[A-Za-z][A-Za-z0-9]*)'/g)) {
        const name = m[1];
        if (!OP_TYPES.has(name) && !allow.has(name)) {
            fail('op-registered', file, `"${name}" is not one of core/ops's ${OP_TYPES.size} registered types`);
        }
    }
}

// ── 2. every permission token is real ────────────────────────────────────────────────────────
// Only inspects strings that LOOK like a scope token, so ordinary prose is never dragged in.
function checkScopes(file, src) {
    for (const m of src.matchAll(/'(manage\.[a-z_]+)'/g)) {
        if (!PERM_TOKENS.has(m[1])) fail('scope-real', file, `"${m[1]}" is not in MANAGE_PAGE_SCOPES`);
    }
}

// ── 3. every exported fixture field exists on its model ──────────────────────────────────────
// The structural check: reads the real Mongoose schema paths rather than a hand-kept blocklist,
// so a NEWLY invented field is caught too, not only the four already found.
function schemaKeys(Model, sub) {
    const schema = sub ? Model.schema.path(sub)?.schema : Model.schema;
    if (!schema) throw new Error(`no schema at ${sub}`);
    return new Set(Object.keys(schema.paths).map((p) => p.split('.')[0]));
}
function checkFixtureShape(FIX) {
    const SeasonalData = require(`${REPO}/models/SeasonalData`);
    const Announcement = require(`${REPO}/models/Announcement`);
    const PortalSession = require(`${REPO}/models/PortalSession`);
    const cases = [
        ['season',         FIX.season,            schemaKeys(SeasonalData)],
        ['newDraws[]',     FIX.newDraws?.[0],     schemaKeys(SeasonalData, 'newDraws')],
        ['returningDraws[]', FIX.returningDraws?.[0], schemaKeys(SeasonalData, 'returningDraws')],
        ['calendar[]',     FIX.calendar?.[0],     schemaKeys(SeasonalData, 'calendar')],
        ['patchNotes[]',   FIX.patchNotes?.[0],   schemaKeys(SeasonalData, 'patchNotes')],
        ['announcements[]', FIX.announcements?.[0], schemaKeys(Announcement)],
        ['sessions[]',     FIX.sessions?.[0],     schemaKeys(PortalSession)],
    ];
    // Keys the PORTAL legitimately adds on top of a stored document, each with its origin.
    const DERIVED_OK = new Set([
        'state',   // portal/api/broadcast.js's announcementState
        'reach',   // counted from UserPreference.seenAnnouncementIds
        'draft',   // SeasonalData.draft is split out of `season` by portal/api/season.js
    ]);
    for (const [label, sample, allowed] of cases) {
        if (!sample) continue;
        for (const key of Object.keys(sample)) {
            if (key === '__v') continue;
            if (!allowed.has(key) && !DERIVED_OK.has(key)) {
                fail('field-on-model', 'assets/fixtures.js', `${label}.${key} is on no schema path`);
            }
        }
    }
}

// ── 4. a tier stated anywhere matches the registry's own tier for that op ─────────────────────
function checkTiers(file, src) {
    for (const m of src.matchAll(/\bop\s*:\s*'([a-z][A-Za-z]*\.[A-Za-z][A-Za-z0-9]*)'[^}]*?\btier\s*:\s*(\d)/gs)) {
        const [, name, tier] = m;
        if (!OP_TYPES.has(name)) continue;
        const real = ops.resolveOp(name)?.tier;
        if (real !== undefined && Number(tier) !== real) {
            fail('tier-matches', file, `"${name}" is tier ${real} in core/ops, stated as ${tier}`);
        }
    }
    for (const m of src.matchAll(/\btier\s*:\s*(\d)[^}]*?\bop\s*:\s*'([a-z][A-Za-z]*\.[A-Za-z][A-Za-z0-9]*)'/gs)) {
        const [, tier, name] = m;
        if (!OP_TYPES.has(name)) continue;
        const real = ops.resolveOp(name)?.tier;
        if (real !== undefined && Number(tier) !== real) {
            fail('tier-matches', file, `"${name}" is tier ${real} in core/ops, stated as ${tier}`);
        }
    }
}

for (const [file, src] of Object.entries(sources)) { checkOps(file, src); checkScopes(file, src); checkTiers(file, src); }

// Evaluate fixtures.js in a bare sandbox to inspect the real exported objects.
const FIX = (() => { const window = {}; new Function('window', sources['assets/fixtures.js'])(window); return window.FIX; })();
checkFixtureShape(FIX);

// ── SELF-TEST: every check must be able to FAIL, or a green run proves nothing ────────────────
if (process.argv.includes('--self-test')) {
    const before = failures.length;
    const probes = [
        ['op-registered', () => checkOps('probe', `{ op:'loadouts.setRank' }`)],
        ['scope-real',    () => checkScopes('probe', `['manage.nosuchpage']`)],
        ['tier-matches',  () => checkTiers('probe', `{ op:'draw.add', tier:3 }`)],
        ['field-on-model',() => checkFixtureShape({ announcements: [{ text: 'x', views: 1, pinned: true }] })],
    ];
    let ok = true;
    for (const [name, run] of probes) {
        const n = failures.length; run();
        const caught = failures.slice(n).some((f) => f.check === name);
        console.log(`${caught ? '  ✅' : '  ❌'} self-test: ${name} ${caught ? 'can fail' : 'DID NOT FIRE — the check is vacuous'}`);
        if (!caught) ok = false;
    }
    failures.length = before;                       // discard probe failures
    if (!ok) { console.error('\n❌ a check could not be made to fail. A vacuous gate is worse than none.'); process.exit(2); }
    console.log('');
}

const files = pages.length + 2;
if (failures.length) {
    console.error(`❌ schema gate: ${failures.length} failure(s) across ${files} files\n`);
    for (const f of failures) console.error(`   [${f.check}] ${f.file}: ${f.msg}`);
    process.exit(1);
}
console.log(`✅ schema gate: ${files} files · ${OP_TYPES.size} op types · ${PERM_TOKENS.size} permission tokens · every name resolves`);
