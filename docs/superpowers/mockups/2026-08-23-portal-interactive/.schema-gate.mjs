// .schema-gate.mjs — asserts the mockup names nothing the bot does not have.
//
// ⚠️ WHY. Three separate errors in this package were "a name that exists nowhere in the system, written confidently": an `editor` role, a `loadouts.setRank` op, a `views` column, an `is2XCP` flag. Every one of them read as plausible and none of them was checkable by eye across 8 files. This converts "did I invent something?" from a judgement into an exit code.
//
// Run:  node .schema-gate.mjs        (add --self-test to prove each check can actually FAIL)
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
// 🔴 REPO IS DERIVED, NEVER HARDCODED. It read `/Applications/Claude Code/Diors-Builds` until 2026-08-31 -- an absolute path to one laptop -- so this could only ever run on that machine. CI failed with `Cannot find module '/Applications/Claude Code/Diors-Builds/core/ops'` the first time the branch was pushed, and the reason it took six days to surface is that `portal:gate` joined `npm test` on 2026-08-25 while the branch was not pushed until 2026-08-31: nothing ran it anywhere but here. ⚠️ Walking up to the nearest package.json also survives the package being moved, which a fixed count of `..` would not.
const repoRoot = () => {
    let dir = dirname(fileURLToPath(import.meta.url));
    while (!existsSync(join(dir, 'package.json'))) {
        const up = dirname(dir);
        if (up === dir) throw new Error('no package.json above the mockup package');
        dir = up;
    }
    return dir;
};
const REPO = repoRoot();
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

/* The stylesheets are read SEPARATELY from `sources`: the checks above look for op names and
 * permission tokens, which do not appear in CSS, and folding two different scopes into one list
 * is how a check ends up running somewhere it cannot mean anything. */
const styleSources = Object.fromEntries(['assets/tokens.css', 'assets/app.css', ...pages]
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

// ── 2b. every corner comes from the shape scale ───────────────────────────────────────────── Measured 2026-08-25: 308 declarations, 29 distinct values, `--rad` carrying 44 of them. No BROWSER rule could ever have seen this — every audit rule asks "for each element, is P true?", and 29 answers disagreeing is not a property of any one element. It is a source-level invariant, so it is checked at the source, in CI, rather than in a harness a human has to remember to open.
function checkRadius(file, src) {
    for (const m of src.matchAll(/border-radius:\s*([^;}!]+)/g)) {
        /* ⚠️ COMMENTS ARE STRIPPED IN JS, NOT IN THE REGEX. The first version matched the trailing
         * comment with `\/\*[^*]*\*\/`, which cannot cross an internal `*` — and the one real
         * exemption in this package contains `--dc-*`, so the comment was never recognised and
         * fourteen ENGLISH WORDS were reported as illegal corner values. A pattern that cannot
         * parse the one case it was written for is the same defect as a probe that cannot report
         * presence, and it took planting nothing at all to find: the gate simply went red. */
        const raw = m[1];
        const exempt = /\/\*[\s\S]*?foreign-radius[\s\S]*?\*\//.test(raw);
        if (exempt) continue;
        const value = raw.replace(/\/\*[\s\S]*?\*\//g, ' ').trim();
        for (const part of value.split(/\s+/)) {
            // `/` is the elliptical-radius separator (`border-radius: 10px / 20px`) — a shape of its own, not a value, so it is skipped rather than rejected.
            if (!part || part === '/' || part === '0' || part === 'inherit') continue;
            if (/^var\(--rad(-[a-z0-9]+)?\)$/.test(part)) continue;
            fail('radius-scale', file, `"${part}" is not a shape token — use --rad-1/-2/-3/-round/-pill, or mark the declaration /* foreign-radius: why */`);
        }
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
for (const [file, src] of Object.entries(styleSources)) checkRadius(file, src);
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
        /* TWO probes, because a check that fires on everything is as useless as one that fires on
         * nothing — and the second is the half that is normally left out. The first plants an
         * off-scale value; the second plants a LEGAL one and the harness would report the check
         * as "can fail" either way, so it is asserted separately below. */
        ['radius-scale',  () => checkRadius('probe', `.x{border-radius:7px}`)],
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
    {
        /* The other half, and the half normally left out: a LEGAL corner must PASS. Every probe
         * above proves a check can fire; none proves it can stay quiet, so `checkRadius` could be
         * rewritten to fail unconditionally and the whole self-test would still go green. */
        const n = failures.length;
        checkRadius('probe', `.x{border-radius:var(--rad-2)} .y{border-radius:0} .z{border-radius:var(--rad-pill) var(--rad-1)} .w{border-radius:8px/* foreign-radius: --dc-* keeps its own corner */} .v{border-radius:var(--rad-3) / var(--rad-1)}`);
        const quiet = failures.length === n;
        console.log(quiet ? '  ✅ self-test: a legal corner does NOT fire radius-scale'
                          : '  ❌ self-test: radius-scale fires on legal values — it is a wall, not a check');
        if (!quiet) ok = false;
    }
    failures.length = before;                       // discard probe failures
    if (!ok) { console.error('\n❌ a check could not be made to fail. A vacuous gate is worse than none.'); process.exit(2); }
    console.log('');
}

/* ══════════════════════════════════════════════════════════════════════════════
 * THE COMPANION IS THE LEAST-CHECKED ARTIFACT IN THE PACKAGE.
 * 🔴 The code has five gates and the records have docs-audit's 44 checks. COMPANION.md — 296KB,
 * 155 subsections, the document a wiring session builds FROM — has none, and every quantity in it
 * is a hand-maintained copy of state. Measured 2026-08-25: three claims were stale at once, and
 * the worst sat in the DATA-CONTRACT TABLE that §0.0's own map calls "the part you can copy" — it
 * said eleven permission tokens while the bot had twelve, so anybody copying it would have built
 * the wrong thing. One of the three was a CORRECTION written three hours earlier, which had gone
 * stale because the same session fixed the thing it described.
 * A general prose-vs-reality checker is not feasible. These three quantities are, because this
 * gate already computes them: it prints them in its own success line. Narrow on purpose — a check
 * that guesses at prose cries wolf and gets switched off.
 * ══════════════════════════════════════════════════════════════════════════════ */
{
    const NUM = { 1:'one', 2:'two', 3:'three', 4:'four', 5:'five', 6:'six', 7:'seven', 8:'eight',
                  9:'nine', 10:'ten', 11:'eleven', 12:'twelve', 13:'thirteen', 14:'fourteen' };
    const companion = readFileSync(here('COMPANION.md'), 'utf8');
    /* Only sentences that BIND the number to the noun, so ordinary prose using the word "twelve"
     * near the word "tokens" is never dragged in. And only the WRONG values are searched for —
     * asserting the right one appears would fail on a document that simply does not mention it. */
    const claims = [
        { what: 'permission tokens', right: PERM_TOKENS.size,
          /* ⚠️ "permission" or "grantable" is REQUIRED, not optional. The first version matched a
           * bare "tokens" and flagged a sentence about the INK scale ("three tokens instead of
           * three-plus-a-footnote") as a claim about permissions. A check that fires on a word
           * rather than on a meaning is the shape that gets switched off. */
          re: (n) => new RegExp(`(?:\\b${n}\\b|\\b${NUM[n]}\\b)\\s+(?:grantable|permission)\\s+tokens\\b`, 'i') },
        { what: 'op types', right: OP_TYPES.size,
          re: (n) => new RegExp(`(?:\\b${n}\\b|\\b${NUM[n]}\\b)\\s+op types\\b`, 'i') },
    ];
    for (const c of claims) {
        for (let n = 1; n <= 14; n++) {
            if (n === c.right) continue;
            const m = c.re(n).exec(companion);
            if (!m) continue;
            /* A historical sentence is legitimate — the document records what WAS true. Anything
             * on a line that dates or past-tenses itself is left alone; the rest is a live claim. */
            const line = companion.slice(companion.lastIndexOf('\n', m.index) + 1,
                                         companion.indexOf('\n', m.index));
            /* ⚠️ THE FIRST HISTORY FILTER MADE THIS CHECK VACUOUS. It exempted any line carrying a
             * DATE or a bare "was/were/had" — and this document dates almost everything, so a
             * planted wrong count went green on its first falsifier. Only explicit past-tense
             * markers about the CLAIM itself exempt a line now; a date does not. */
            if (/\b(?:used to|until 20|previously|an earlier version|no longer)\b/i.test(line)) continue;
            /* 🔴 A QUOTED WRONG VALUE IS AN EXAMPLE, NOT A CLAIM. This document describes its own
             * falsifiers, so it necessarily contains the strings they plant — and the check fired
             * on §5.9t's account of a planted "Nine permission tokens" within a minute of that
             * section being written. The repo already learned this once: `timestamp-check.sh`
             * carries a TS-EXAMPLE escape for exactly the case of quoting a bad value while
             * writing about it. Backticks or double quotes around the match mean the same here,
             * and both are deliberate, visible and greppable. */
            const before = companion[m.index - 1] || '', after = companion[m.index + m[0].length] || '';
            if (/[`"\u201c\u201d]/.test(before) || /[`"\u201c\u201d]/.test(after)) continue;
            fail('companion-quantity', 'COMPANION.md',
                 `states "${m[0]}" as a live claim; the real count is ${c.right} (${c.what})`);
        }
    }
    /* And every top-level section must appear in §0.0's map, because 296KB of exhaustive is
     * unreachable without it — three whole families were missing from that table for a day. */
    const map = companion.slice(companion.indexOf('## 0.0 Map'), companion.indexOf('## 0. How to run'));
    for (const m of companion.matchAll(/^## (\d+(?:\.\d+)?[a-z]?)[. ]/gm)) {
        const num = m[1];
        if (num === '0' || num === '0.0' || num === '0.5') continue;
        const head = num.split('.')[0];
        /* A row may cover several sections — "**8 / 9**", "**10 / 11 / 12**", "**5.9j–5.9s**".
         * Matching only the row's FIRST number missed the ones after the slash, which is how §9
         * and §12 read as orphans while sitting in a row that names them. Strip the bold markers
         * and look for the number as a standalone token anywhere in the table. */
        /* ⚠️ THE FIRST VERSION OF THIS WAS ALSO VACUOUS: it allowed any non-digit after the
         * number, so renaming a row from "13" to "13-removed" still counted as naming §13. The
         * number must be bounded by a non-alphanumeric on BOTH sides to be a reference rather
         * than a prefix. */
        const flat = map.replace(/\*\*/g, '');
        const named = new RegExp(`(?:^|[^\\w.])${head.replace('.', '\\.')}(?![\\w.])`).test(flat);
        if (!named)
            fail('companion-map', 'COMPANION.md', `§${num} is not reachable from the §0.0 map`);
    }

    /* ══════════════ FALSIFIERS — both of these went green on their first plant ══════════════
     * 🔴 THE QUANTITY CHECK SHIPPED VACUOUS AND I ALMOST DID NOT NOTICE. Its history filter
     * exempted any line carrying a DATE, and this document dates almost everything — so a planted
     * "Nine permission tokens" passed. The map check was fine and my PLANT was wrong (renaming a
     * row to "13-removed" still mentions 13). Two different ways to get a false green in one
     * afternoon, which is why these now run on every invocation rather than by hand.
     * They operate on COPIES of the text, never on the file. */
    {
        const wrongCount = companion.replace('Twelve tokens', 'Nine permission tokens');
        const qCaught = /(?:\b9\b|\bnine\b)\s+(?:grantable|permission)\s+tokens\b/i.test(wrongCount)
                        && PERM_TOKENS.size !== 9;
        console.log(qCaught ? '  ✅ self-test: a wrong permission-token count IS caught'
                            : '  ❌ self-test: VACUOUS — the companion-quantity check cannot fail');
        if (!qCaught) fail('companion-quantity', 'COMPANION.md', 'the quantity self-test could not detect a planted wrong count');

        /* Delete the row outright — renaming it is not a deletion, and a falsifier that plants
         * the wrong thing reports a pass that means nothing. */
        const noRow = map.replace(/\n\| \*\*13\*\* \|[^\n]*/, '');
        const flatNoRow = noRow.replace(/\*\*/g, '');
        const mCaught = !new RegExp('(?:^|[^\\w.])13(?![\\w.])').test(flatNoRow);
        console.log(mCaught ? '  ✅ self-test: a section missing from the §0.0 map IS caught'
                            : '  ❌ self-test: VACUOUS — the companion-map check cannot fail');
        if (!mCaught) fail('companion-map', 'COMPANION.md', 'the map self-test could not detect a removed row');
    }
}

const files = pages.length + 2;
if (failures.length) {
    console.error(`❌ schema gate: ${failures.length} failure(s) across ${files} files\n`);
    for (const f of failures) console.error(`   [${f.check}] ${f.file}: ${f.msg}`);
    process.exit(1);
}
console.log(`✅ schema gate: ${files} files · ${OP_TYPES.size} op types · ${PERM_TOKENS.size} permission tokens · every name resolves`);
