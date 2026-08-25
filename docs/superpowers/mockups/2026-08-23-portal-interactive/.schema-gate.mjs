// .schema-gate.mjs — asserts the mockup names nothing the bot does not have.
//
// ⚠️ WHY. Three separate errors in this package were "a name that exists nowhere in the system, written confidently": an `editor` role, a `loadouts.setRank` op, a `views` column, an `is2XCP` flag. Every one of them read as plausible and none of them was checkable by eye across 8 files. This converts "did I invent something?" from a judgement into an exit code.
//
// Run:  node .schema-gate.mjs        (add --self-test to prove each check can actually FAIL)
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const REPO = '/Applications/Claude Code/Diors-Builds';
// ⚠️ Resolve every path from THIS FILE, never from the CWD. The gate read `assets/fixtures.js` relatively and so only worked when run from inside the package directory — it crashed with ENOENT the first time `npm run portal:gate` invoked it from the repo root. Found by wiring it up, which is the whole argument for wiring it up: a verifier that only runs one way has only ever been proven one way.
const HERE = dirname(fileURLToPath(import.meta.url));
const here = (f) => join(HERE, f);

const ops = require(`${REPO}/core/ops`);
const { MANAGE_PAGE_SCOPES, ADMIN_COMMANDS } = require(`${REPO}/utils/adminAccess`);
const OP_TYPES = new Set(ops.listOpTypes());
const PERM_TOKENS = new Set([...ADMIN_COMMANDS, ...MANAGE_PAGE_SCOPES.map((p) => `manage.${p}`)]);

// Access grant/revoke and portal-session end are deliberately NOT ops: portal/api/access.js's own header — "NOT part of the core operation algebra: admin grants/revokes are direct AdminUser writes … and a live PortalSession end is a direct write too." So they are named here, once, rather than the check being loosened to let any unknown string through.
const NON_OP_ACTIONS = new Set([
    // portal/api/access.js — direct AdminUser writes, named from its own routes.
    'access.grant', 'access.revoke', 'session.end',
    // portal/api/changesets.js — changeset LIFECYCLE, one level above the entity ops it carries.
    'changeset.preview', 'changeset.export', 'changeset.discard', 'changeset.commit',
    // core/revert.js — replays a ChangeLog row's stored inverse. Not itself a registered type.
    'changelog.revert',
]);

// 🔴 COMPANION.md IS SCANNED TOO, AND ITS ABSENCE WAS THE MECHANISM. A cold reader found NINE op names in the document that resolve to nothing — `loadouts.edit` in the canonical copy-this template, plus `announcements.reorder`/`.setPinned`/`.edit` across two element tables describing a page that had been rewritten out of existence. Every one of them was invisible here because this list was `*.html` plus two assets, so the gate stayed green while the SPECIFICATION rotted. That is §14's own thesis one level up: a green check on the wrong scope reads exactly like a green check on the right one. The document is the instruction a wiring session follows, so it is the last place an unresolvable op name should be allowed to sit.
const pages = readdirSync(HERE).filter((f) => f.endsWith('.html'));
const sources = Object.fromEntries([...pages, 'assets/fixtures.js', 'assets/shell.js', 'COMPANION.md']
    .map((f) => [f, readFileSync(here(f), 'utf8')]));

const failures = [];
const fail = (check, file, msg) => failures.push({ check, file, msg });

// ── 1. every op name is registered ─────────────────────────────────────────────────────────── Matches `op:'x.y'` and `type:'x.y'` — the two keys a staged-op record and a raw op use.
function checkOps(file, src, allow = NON_OP_ACTIONS) {
    // COMPANION.md deliberately QUOTES wrong names when recording what the gate caught. Those sit inside backticks on a line that also says so; the pattern below only matches the `op:'…'` FORM, which is how the doc writes a name it is instructing you to use.
    for (const m of src.matchAll(/\b(?:op|type)\s*:\s*'([a-z][A-Za-z]*\.[A-Za-z][A-Za-z0-9]*)'/g)) {
        const name = m[1];
        if (!OP_TYPES.has(name) && !allow.has(name)) {
            fail('op-registered', file, `"${name}" is not one of core/ops's ${OP_TYPES.size} registered types`);
        }
    }
}

// ── 2. every permission token is real ──────────────────────────────────────────────────────── Only inspects strings that LOOK like a scope token, so ordinary prose is never dragged in.
function checkScopes(file, src) {
    for (const m of src.matchAll(/'(manage\.[a-z_]+)'/g)) {
        if (!PERM_TOKENS.has(m[1])) fail('scope-real', file, `"${m[1]}" is not in MANAGE_PAGE_SCOPES`);
    }
}

// ── 3. every exported fixture field exists on its model ────────────────────────────────────── The structural check: reads the real Mongoose schema paths rather than a hand-kept blocklist, so a NEWLY invented field is caught too, not only the four already found.
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

// ── 4. a tier stated anywhere matches the registry's own tier for that op ───────────────────── ⚠️ REWRITTEN AFTER A CODE REVIEW PROVED THE FIRST VERSION VACUOUS. It matched with `[^}]*?` between the `tier:` and the `op:` keys — a character class that cannot cross a `}`. Every real staging call has a template literal (`` `${b.weaponName} — ${b.buildName}` ``) between those two keys, so the regex matched only the small confirm dialogs (which were already correct) and missed every Store.add. The gate reported clean with six live disagreements in the tree.
//
// Brace-matching instead: find each call site, walk to its matching close brace, and read the two keys out of the real object literal. A regex cannot balance braces; this is why it is a loop.
function callSites(src) {
    const out = [];
    const re = /(?:S\.Store\.add|Store\.add|S\.confirm|Shell\.confirm)\(\{/g;
    let m;
    while ((m = re.exec(src))) {
        let i = m.index + m[0].length - 1, depth = 0;
        for (; i < src.length; i++) {
            if (src[i] === '{') depth++;
            else if (src[i] === '}') { depth--; if (!depth) break; }
        }
        out.push({ body: src.slice(m.index, i + 1), line: src.slice(0, m.index).split('\n').length });
    }
    return out;
}
function checkTiers(file, src) {
    for (const { body, line } of callSites(src)) {
        const op = (body.match(/\bop\s*:\s*['"]([^'"]+)['"]/) || [])[1];
        const tierRaw = (body.match(/\btier\s*:\s*(\d)\b/) || [])[1];
        if (!op) {
            // A staged op with no type cannot have its tier checked at all, and Review cannot say what it would run. That is a finding in itself, not a reason to skip the check.
            if (tierRaw !== undefined) fail('tier-matches', file, `${file}:${line} states tier ${tierRaw} but names no op type — nothing can check it`);
            continue;
        }
        if (!OP_TYPES.has(op) || tierRaw === undefined) continue;
        const real = ops.resolveOp(op)?.tier;
        if (real !== undefined && Number(tierRaw) !== real) {
            fail('tier-matches', file, `${file}:${line} states tier ${tierRaw} for "${op}"; core/ops registers ${real}`);
        }
    }
}

// In prose an op is written in backticks, never as `op:'…'` — so the code-shaped check above sees none of them. This one reads every `entity.verb` inside backticks and holds it to the same registry, EXCEPT where the surrounding line is explicitly recording a name as wrong.
const RECORDING = /caught|violation|do not exist|does not exist|pluralised|nonexistent|invented|no longer|retired|was wrong|resolve to nothing|deleted/i;
function checkDocOps(file, src) {
    for (const line of src.split('\n')) {
        if (RECORDING.test(line)) continue;
        for (const m of line.matchAll(/`([a-z][A-Za-z]*\.[A-Za-z][A-Za-z0-9]*)`/g)) {
            const name = m[1];
            // ⚠️ TWO SHAPES COLLIDE WITH AN OP NAME and neither is one. `calendar.js` and `season.html` are FILENAMES; `calendar.isDoubleCP` is a FIELD PATH. Both share an op namespace, so the naive check flagged five of them on its first run. Discriminated structurally rather than by a blocklist: a file extension is a closed set, and a field name is derivable from the real Mongoose schemas — so a NEW field added to a model stops being a false positive without anyone editing this file.
            const [ns, verb] = name.split('.');
            if (!DOC_NAMESPACES.has(ns)) continue;
            if (FILE_EXT.has(verb)) continue;
            if (SCHEMA_FIELDS.has(verb)) continue;
            if (!OP_TYPES.has(name) && !NON_OP_ACTIONS.has(name)) {
                fail('op-registered', file, `"${name}" is written as an op in prose but is not one of core/ops's ${OP_TYPES.size} registered types`);
            }
        }
    }
}
// 🔴 THE PLURAL IS THE ERROR MODE, so it has to be in the watch set or the check misses the exact thing it exists for. Every registered namespace is singular (`draw`, `loadout`, `announcement`); every invented name found so far pluralised it (`loadouts.edit`, `announcements.reorder`). A set built only from the real namespaces skips `announcements.*` entirely — which it did on the first run, catching one of the nine bad names instead of four.
const DOC_NAMESPACES = new Set([...OP_TYPES].flatMap((t) => {
    const ns = t.split('.')[0];
    return [ns, ns + 's'];
}));
const FILE_EXT = new Set(['js', 'mjs', 'cjs', 'html', 'css', 'json', 'md', 'py', 'sh', 'txt', 'yml', 'yaml', 'test']);
// Every field name on every model this package touches, so a field path never reads as an op.
const SCHEMA_FIELDS = new Set(
    ['SeasonalData', 'Announcement', 'AdminUser', 'PortalSession', 'Loadout', 'ChangeLog', 'Changeset']
        .flatMap((m) => {
            const M = require(`${REPO}/models/${m}`);
            const walk = (schema) => Object.entries(schema.paths).flatMap(([k, v]) =>
                [k.split('.').pop(), ...(v.schema ? walk(v.schema) : [])]);
            return walk(M.schema);
        }));

for (const [file, src] of Object.entries(sources)) { checkOps(file, src); checkScopes(file, src); checkTiers(file, src); }
checkDocOps('COMPANION.md', sources['COMPANION.md']);

// Evaluate fixtures.js in a bare sandbox to inspect the real exported objects.
const FIX = (() => { const window = {}; new Function('window', sources['assets/fixtures.js'])(window); return window.FIX; })();
checkFixtureShape(FIX);

// ── SELF-TEST: every check must be able to FAIL, or a green run proves nothing ────────────────
if (process.argv.includes('--self-test')) {
    const before = failures.length;
    const probes = [
        ['op-registered', () => checkOps('probe', `{ op:'loadouts.setRank' }`)],
        ['scope-real',    () => checkScopes('probe', `['manage.nosuchpage']`)],
        ['tier-matches',  () => checkTiers('probe',
            // ⚠️ THE PROBE MUST MATCH THE REAL SHAPE. It used to be a bare object literal, which the brace-matching scanner correctly ignores — so the self-test went red the instant the check was rewritten, which is exactly what a self-test is for. Note the template literal between the keys: that is the case the old regex could not cross, and the reason it silently matched nothing.
            "S.Store.add({ id:'x', name:`${a} - ${b}`, op:'draw.add', tier:3, rows:[] });")],
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
