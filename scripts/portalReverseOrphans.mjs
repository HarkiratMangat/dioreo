// scripts/portalReverseOrphans.mjs — every RULE in the portal's stylesheet must have an ELEMENT that triggers it.
//
// 🔴 THE INVERSE OF `portal:orphans`, AND IT IS THE ONE DIRECTION NO GATE HAS EVER ASKED. `portal:orphans` asks "does this emitted class have a rule?"; `portal:coverage` counts emitted classes; `npm test` renders components and asserts their output. Not one asks "does this rule have an element?" — and CSS is declarative and inert, so a rule with no matching element is silent forever. That silence is what the Preact migration left behind: it carried the stylesheet whole and dropped the markup that activates it. `[data-bare]` opts an input out of the global form reset and NOTHING emits it, so the command bar renders a 44px input inside a 34px wrapper, each painting its own background and border — COMPANION §5.9n.4's doubled search bar, live, while every gate in the suite passed.
//
// FOUR SHAPES, because the defect has four faces and only the first is obvious:
//   ① [data-*]   a selector with no emitter          — `data-bare`
//   ② var(--x)   a read with no setter anywhere      — `--ci`
//   ③ .class     ≥2 rules and no emitter             — `hcard`, `srec-open`
//   ④ MISMATCH   emitted, but no rule matches it     — `t-t4` emitted against `.t-top4` styled
//
// 🔴 SHAPE ④ IS WHY THIS SCRIPT PARSES EXPRESSIONS INSTEAD OF GREPPING. `armory.js` declares `RANK_KEY = { best:'best', top3:'t3', … }` and emits `trow t-${RANK_KEY[key]}`. A scanner that sees only the literal prefix reports `t-` as an orphan, stays silent about the four broken rows, and reports `.t-best` as unemitted — three wrong answers from one missing capability. So the emitter side runs a small recursive-descent evaluator over the subset of JS that appears in a class position (string and template literals, `+`, ternaries, `&&`/`||`, parenthesised groups, and member/index reads resolved against the file's own const lookup tables). An expression it cannot resolve becomes a DYNAMIC PREFIX, reported separately for triage — never a class, and never a licence to assume the classes behind it are emitted.
//
// ⚠️ SCAN SCOPE IS LITERAL, because the tree holds FOUR copies of app.css and SIX of track.logic.js. Emitters: `portal/ui/*.js` only. Rules: `portal/ui/app.css` and `portal/ui/tokens.css` only. Excluded: `portal/public/**` (build output — a phantom emitter for every real one), `portal/ui/harness/**` (fixtures, not the product), `.claude/worktrees/**`, `docs/**/assets/**`. An unscoped scan finds phantom emitters; a wrongly-scoped one misses `portal/ui/*.logic.js`. Both fail silently.
//
// ⚠️ A RATCHET, LIKE `portal:orphans`. `--ci` compares against `portal/fixtures/reverse-orphans.json` and fails on anything NEW **and** on a baseline entry that has been fixed without the baseline being updated — a list that rots into names nothing renders proves nothing. `--write` re-records it.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const { designClasses } = createRequire(import.meta.url)('./lib/designClasses.cjs');
// Empty when the package cannot be read; the report says so rather than certifying every finding as the design's.
const DESIGN_CLASSES = designClasses();
import { parse } from 'acorn';
import { CLASS_PROPS } from './portalClassProps.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// ⚠️ `PORTAL_REVERSE_ROOT` repoints the whole scan at a fixture tree — the only way the self-test can prove each shape CAN fire, which is the half that stops a matcher from silently matching nothing. Same technique as `DOCS_AUDIT_ROOT`.
const UI = process.env.PORTAL_REVERSE_ROOT ? path.resolve(process.env.PORTAL_REVERSE_ROOT) : path.join(ROOT, 'portal', 'ui');
const BASELINE = process.env.PORTAL_REVERSE_ROOT ? path.join(UI, 'reverse-orphans.json') : path.join(ROOT, 'portal', 'fixtures', 'reverse-orphans.json');
const UNKNOWN = '\u0000';   // ⚠️ WRITTEN AS AN ESCAPE, NEVER AS A RAW BYTE. A literal NUL in the source makes ripgrep treat this whole file as BINARY and show no matches in it — a gate nobody can search is a gate nobody can maintain. docs-audit's `binary-in-text` check caught exactly that here.

const jsFiles = () => fs.readdirSync(UI).filter((f) => f.endsWith('.js')).sort();      // readdir, not a walk: harness/ is a directory and stays out by construction
// ⚠️ EVERY STYLESHEET IN portal/ui, GLOBBED — never a listed pair. `buildPortal` concatenates every `portal/ui/*.css` (tokens first), so a hardcoded list reports a class as unstyled the moment its rules live in a sheet the list does not know about: measured 2026-08-28, an app.css+tokens.css pair reported all seven `.v2-*` classes as EMITTED WITH NO RULE while `v2card.css` — which ships in the same bundle — defines every one of them. Same correction `portal:orphans` already carries. The scope that matters is the DIRECTORY, which is what keeps the four copies of app.css in build output and the two worktree checkouts out.
const cssFiles = () => fs.readdirSync(UI).filter((f) => f.endsWith('.css')).sort();

// ───────────────────────────────────────────────────────────────────────────── The expression evaluator. Returns a Set of possible strings; UNKNOWN marks a hole it could not resolve. ─────────────────────────────────────────────────────────────────────────────
function evaluate(src, tables, vars = {}) {
    let i = 0;
    const ws = () => { while (i < src.length && /\s/.test(src[i])) i++; };
    const at = (s) => src.startsWith(s, i);
    const CAP = 64;                                                                    // a cross-product ceiling; a class expression needing more than this is a dynamic prefix by any honest reading
    const cross = (a, b) => {
        const out = new Set();
        for (const x of a) for (const y of b) { out.add(x + y); if (out.size >= CAP) return out; }
        return out;
    };

    function stringLiteral() {
        const q = src[i]; i++;
        let out = '';
        while (i < src.length && src[i] !== q) { if (src[i] === '\\') { out += src[i + 1]; i += 2; } else out += src[i++]; }
        i++;
        return new Set([out]);
    }

    // ⚠️ A TEMPLATE IS A CONCATENATION, NOT A BAG OF LITERALS. `t-${RANK_KEY[k]}` must produce t-best/t-t3/…, never {'t-', 'best', …} — the second reading is exactly the miss that has now happened twice.
    function templateLiteral() {
        i++;                                                                           // opening backtick
        let acc = new Set(['']);
        let quasi = '';
        while (i < src.length && src[i] !== '`') {
            if (src[i] === '\\') { quasi += src[i + 1]; i += 2; continue; }
            if (at('${')) {
                acc = cross(acc, new Set([quasi])); quasi = '';
                i += 2;
                const inner = expression();
                ws();
                if (src[i] === '}') i++;
                acc = cross(acc, inner);
                continue;
            }
            quasi += src[i++];
        }
        i++;
        return cross(acc, new Set([quasi]));
    }

    function primary() {
        ws();
        if (i >= src.length) return new Set([UNKNOWN]);
        if (src[i] === "'" || src[i] === '"') return stringLiteral();
        if (src[i] === '`') return templateLiteral();
        if (src[i] === '(') { i++; const v = expression(); ws(); if (src[i] === ')') i++; return memberTail(v, null); }
        // `[ 'bar', x && 'lbl-out' ].filter(Boolean).join(' ')` — the other way a class string gets built here. The elements are UNIONED, not concatenated, because they end up space-separated and `record()` splits on whitespace anyway.
        if (src[i] === '[') {
            i++;
            const parts = new Set();
            for (;;) {
                ws();
                if (i >= src.length || src[i] === ']') { i++; break; }
                if (src[i] === ',') { i++; continue; }
                const before = i;
                for (const v of expression()) parts.add(v);
                if (i === before) i++;                                                  // never spin on a token this grammar cannot model
            }
            return memberTail(parts.size ? parts : new Set([UNKNOWN]), null);
        }
        const m = /^[A-Za-z_$][\w$]*/.exec(src.slice(i));
        if (m) { i += m[0].length; return memberTail(null, m[0]); }
        i++;                                                                            // a number, or an operator this grammar does not model
        return new Set([UNKNOWN]);
    }

    // A member/index/call chain. Only ONE shape resolves: a known const lookup table read by `.key` or `[expr]`. Everything else — a call, a chained property, an unknown identifier — is UNKNOWN, which is the honest answer and keeps the dynamic-prefix list truthful.
    function memberTail(value, ident) {
        let v = value === null ? (ident && vars[ident] ? vars[ident] : new Set([UNKNOWN])) : value;
        let table = ident && tables[ident] ? tables[ident] : null;
        let lastKey = null;
        for (;;) {
            ws();
            if (src[i] === '.') {
                i++; ws();
                const k = /^[A-Za-z_$][\w$]*/.exec(src.slice(i));
                if (!k) return new Set([UNKNOWN]);
                i += k[0].length;
                lastKey = k[0];
                if (table && Object.prototype.hasOwnProperty.call(table, k[0])) { v = new Set([table[k[0]]]); table = null; continue; }
                if (['join', 'filter', 'trim', 'concat', 'flat'].includes(k[0])) { table = null; continue; }   // the property read of a list-shaping call; the set survives until the call itself decides
                v = new Set([UNKNOWN]); table = null;
                continue;
            }
            if (src[i] === '[') {
                i++; const key = expression(); ws(); if (src[i] === ']') i++;
                if (table) {
                    const known = [...key].filter((s) => !s.includes(UNKNOWN) && Object.prototype.hasOwnProperty.call(table, s));
                    v = known.length ? new Set(known.map((s) => table[s])) : new Set(Object.values(table));   // an index this scan cannot pin down means ANY declared value is possible — the union is what makes t-t3/t-t4/t-t5 visible
                } else v = new Set([UNKNOWN]);
                table = null;
                continue;
            }
            if (src[i] === '(') {
                let d = 0;
                do { if (src[i] === '(') d++; else if (src[i] === ')') d--; i++; } while (i < src.length && d > 0);
                // ⚠️ `.filter(Boolean).join(' ')` and `.trim()` RESHAPE a class list; they do not change which class names can appear. Erasing the set on those three would report every array-built class string as unreadable — which is most of them — so the tokens survive the call and only a genuinely unknown call returns UNKNOWN.
                if (!['join', 'filter', 'trim', 'concat', 'flat'].includes(lastKey)) { v = new Set([UNKNOWN]); table = null; }
                lastKey = null;
                continue;
            }
            return v;
        }
    }

    function additive() {
        let v = primary();
        for (;;) {
            ws();
            if (src[i] === '+' && src[i + 1] !== '+') { i++; v = cross(v, primary()); continue; }
            return v;
        }
    }

    // Equality sits ABOVE additive so a comparison's operands never reach the class list. `sort.direction === 'asc'` must not certify `.asc` — four false positives out of 56 is enough to get a gate suppressed instead of obeyed.
    function comparison() {
        const left = additive();
        ws();
        for (const op of ['===', '!==', '==', '!=', '>=', '<=', '>', '<']) {
            if (at(op)) { i += op.length; additive(); return new Set([UNKNOWN]); }
        }
        return left;
    }

    function logical() {
        let v = comparison();
        for (;;) {
            ws();
            if (at('&&')) { i += 2; const r = comparison(); v = new Set([...r, '']); continue; }   // `cond && 'cls'` renders the class or nothing
            if (at('||') || at('??')) { i += 2; const r = comparison(); v = new Set([...v, ...r]); continue; }
            return v;
        }
    }

    function expression() {
        const cond = logical();
        ws();
        if (src[i] === '?' && src[i + 1] !== '.') {
            i++;
            const a = expression(); ws();
            if (src[i] === ':') i++;
            const b = expression();
            return new Set([...a, ...b]);
        }
        return cond;
    }

    const out = expression();
    return out.size ? out : new Set([UNKNOWN]);
}

// Module-level `const NAME = { k: 'v', … }` lookup tables, so `RANK_KEY[key]` resolves to its declared values.
function lookupTables(src) {
    const tables = {};
    for (const m of src.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\{/g)) {
        let i = m.index + m[0].length - 1, d = 0, end = -1;
        for (; i < src.length; i++) {
            if (src[i] === '{') d++;
            else if (src[i] === '}') { d--; if (!d) { end = i; break; } }
        }
        if (end < 0) continue;
        const body = src.slice(m.index + m[0].length, end);
        if (body.includes('{') || body.includes('(')) continue;                          // only flat literal tables; a nested or computed one is not something this scan can claim to know
        const t = {};
        for (const e of body.matchAll(/(?:^|,)\s*\[?['"]?([\w-]+)['"]?\]?\s*:\s*'([^']*)'/g)) t[e[1]] = e[2];
        if (Object.keys(t).length) tables[m[1]] = t;
    }
    return tables;
}

// 🔴 `class=${cls}` WHERE `cls` WAS BUILT TWO LINES EARLIER IS THE COMMONEST SHAPE IN THIS TREE, and to a scanner that reads only the attribute it is a total blank — which would turn every class in that component into a shape-③ false positive. So a single-assignment `const/let x = <expr>` whose initializer ends on its own line is evaluated once and remembered. A name assigned MORE THAN ONCE is dropped rather than guessed at: two assignments mean the scan cannot say which one reaches the attribute, and a confident wrong answer is worse here than an admitted blank.
function localVars(src, tables) {
    const seen = new Map();
    for (const m of src.matchAll(/(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*([^\n;]+);?\s*$/gm)) {
        const name = m[1], init = m[2].trim();
        if (!/['"`[]/.test(init)) continue;                                             // no literal anywhere in it: nothing to learn
        seen.set(name, (seen.get(name) || 0) + 1);
    }
    const vars = {};
    for (const m of src.matchAll(/(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*([^\n;]+);?\s*$/gm)) {
        const name = m[1], init = m[2].trim();
        if (!/['"`[]/.test(init) || seen.get(name) !== 1) continue;
        const v = evaluate(init, tables);
        if (v.size && [...v].some((x) => x && !x.includes(UNKNOWN))) vars[name] = v;
    }
    return vars;
}

// Balanced `${ … }` extraction for `class=${…}`; a regex cannot do this, and a nested object literal in a class expression is ordinary here.
function classExpressions(src) {
    const out = [];
    for (const m of src.matchAll(/class=\$\{/g)) {
        let i = m.index + m[0].length, d = 1;
        const start = i;
        for (; i < src.length && d > 0; i++) {
            if (src[i] === '{') d++;
            else if (src[i] === '}') d--;
            else if (src[i] === '`' || src[i] === "'" || src[i] === '"') {               // skip strings so a brace inside one does not unbalance the scan
                const q = src[i++];
                while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
            }
        }
        out.push(src.slice(start, i - 1));
    }
    return out;
}

// 🔴 A COMMENT IS NOT AN EMITTER, AND THIS TREE'S COMMENTS NAME CLASSES AND ATTRIBUTES CONSTANTLY — every trap in `portal/ui` is written down beside the code that pays for it, `data-bare` and `.t-top4` included. Counting those would certify exactly the defects this sweep exists to find, so comments are blanked before anything is read. ⚠️ Via `acorn`, not a regex: a hand-rolled scanner has to re-derive JS's string/template/regex rules to avoid mistaking `http://` inside a template literal for a comment — `reflow-comments.mjs` added the dependency for this same reason. A file acorn cannot parse is scanned raw rather than skipped: an unreadable file must never read as a clean one.
function stripComments(src) {
    const blanks = [];
    try {
        parse(src, { ecmaVersion: 'latest', sourceType: 'module', allowHashBang: true, onComment: (block, text, start, end) => blanks.push([start, end]) });
    } catch {
        return src;
    }
    let out = src;
    for (const [start, end] of blanks) out = out.slice(0, start) + ' '.repeat(end - start) + out.slice(end);
    return out;
}

function emitters() {
    const classes = new Map();          // class -> Set(file)
    const dynamic = new Map();          // literal prefix left dangling by an unresolved hole -> Set(file)
    const dataAttrs = new Map();
    const varSets = new Set();
    const opaque = new Map();           // a class expression that resolved to NOTHING readable — the instrument's own blind spot, counted rather than dropped
    const record = (candidates, file) => {
        for (const cand of candidates) {
            for (const tok of cand.split(/\s+/)) {
                if (!tok) continue;
                if (tok.includes(UNKNOWN)) {
                    const pre = tok.split(UNKNOWN)[0];
                    // 🔴 AN EXPRESSION WITH NO LITERAL AT ALL — `class=${cls}` where cls was built earlier — CERTIFIES NOTHING AND HIDES NOTHING, but it does mean a shape-③ finding behind it could be a false positive. Dropping it silently would make the blind spot invisible, which is the failure this whole script exists to name, so it is counted and printed.
                    if (!pre) { opaque.set(file, (opaque.get(file) || 0) + 1); continue; }
                    if (!dynamic.has(pre)) dynamic.set(pre, new Set());
                    dynamic.get(pre).add(file);
                    continue;
                }
                if (!/^-?[A-Za-z_][\w-]*$/.test(tok)) continue;
                if (!classes.has(tok)) classes.set(tok, new Set());
                classes.get(tok).add(file);
            }
        }
    };
    for (const f of jsFiles()) {
        const src = stripComments(fs.readFileSync(path.join(UI, f), 'utf8'));
        const tables = lookupTables(src);
        const vars = localVars(src, tables);
        for (const m of src.matchAll(/class="([^"]*)"/g)) {
            if (m[1].includes('${')) record(evaluate('`' + m[1] + '`', tables, vars), f);
            else record([m[1]], f);
        }
        for (const expr of classExpressions(src)) record(evaluate(expr, tables, vars), f);
        for (const m of src.matchAll(new RegExp(`\\b(?:${CLASS_PROPS.join('|')}):\\s*'([^']+)'`, 'g'))) record([m[1]], f);
        for (const m of src.matchAll(/classList\.(?:add|remove|toggle)\(([^)]*)\)/g)) for (const s of m[1].matchAll(/'([^']+)'/g)) record([s[1]], f);
        for (const m of src.matchAll(/className\s*=\s*'([^']+)'/g)) record([m[1]], f);
        // ⚠️ A BOOLEAN ATTRIBUTE HAS NO `=`, and the fix for the doubled search bar is exactly that shape — `<input data-bare …>`. Requiring `=` here would have left the sweep reporting `data-bare` forever after it was fixed, which is the ratchet rotting in the other direction.
        for (const m of src.matchAll(/\bdata-([a-z][a-z0-9-]*)(?=\s*=|[\s/>}])/g)) {
            if (!dataAttrs.has(m[1])) dataAttrs.set(m[1], new Set());
            dataAttrs.get(m[1]).add(f);
        }
        for (const m of src.matchAll(/\bdataset\.([A-Za-z][\w]*)/g)) {                   // dataset.foo IS data-foo; dataset.someThing is data-some-thing
            const kebab = m[1].replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
            if (!dataAttrs.has(kebab)) dataAttrs.set(kebab, new Set());
            dataAttrs.get(kebab).add(f);
        }
        for (const m of src.matchAll(/setAttribute\(\s*'data-([a-z0-9-]+)'/g)) {
            if (!dataAttrs.has(m[1])) dataAttrs.set(m[1], new Set());
            dataAttrs.get(m[1]).add(f);
        }
        for (const m of src.matchAll(/(--[a-z][\w-]*)\s*:/g)) varSets.add(m[1]);          // inline style strings: style=${`--xtop:${…}px`}
        for (const m of src.matchAll(/setProperty\(\s*['"`](--[\w-]+)/g)) varSets.add(m[1]);
    }
    return { classes, dynamic, dataAttrs, varSets, opaque };
}

// ───────────────────────────────────────────────────────────────────────────── The stylesheet side: rules, not text. A class named in a COMMENT is not a definition — counting those made `portal:orphans` under-report, and the same trap is live here. ─────────────────────────────────────────────────────────────────────────────
function stylesheet() {
    const classRules = new Map();       // class -> rule count
    const dataSel = new Map();          // data attribute -> rule count
    const varReads = new Map();         // --x -> read count
    const varSets = new Set();
    for (const f of cssFiles()) {
        const raw = fs.readFileSync(path.join(UI, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');
        let i = 0, selStart = 0;
        while (i < raw.length) {
            const c = raw[i];
            if (c === '{') {
                const sel = raw.slice(selStart, i).trim();
                if (!sel.startsWith('@')) {
                    for (const m of sel.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) classRules.set(m[1], (classRules.get(m[1]) || 0) + 1);
                    for (const m of sel.matchAll(/\[\s*data-([a-z0-9-]+)/g)) dataSel.set(m[1], (dataSel.get(m[1]) || 0) + 1);
                }
                selStart = i + 1;
            } else if (c === '}' || c === ';') selStart = i + 1;
            i++;
        }
        for (const m of raw.matchAll(/var\(\s*(--[\w-]+)/g)) varReads.set(m[1], (varReads.get(m[1]) || 0) + 1);
        for (const m of raw.matchAll(/(--[\w-]+)\s*:/g)) varSets.add(m[1]);
    }
    return { classRules, dataSel, varReads, varSets };
}

const emit = emitters();
const css = stylesheet();

// The dynamic prefixes an unresolved expression left behind. They never certify a class — they annotate one, so triage can tell "styled and dead" from "styled and reached by an expression this scan cannot read".
const dynPrefixes = [...emit.dynamic.keys()].filter((p) => p.length >= 2);
const shadowed = (cls) => dynPrefixes.filter((p) => cls.startsWith(p));

const findings = {
    data: [...css.dataSel.entries()]
        .filter(([a]) => !emit.dataAttrs.has(a))
        .map(([a, n]) => ({ name: a, rules: n }))
        .sort((x, y) => y.rules - x.rules || x.name.localeCompare(y.name)),
    vars: [...css.varReads.entries()]
        .filter(([v]) => !css.varSets.has(v) && !emit.varSets.has(v))
        .map(([v, n]) => ({ name: v, reads: n }))
        .sort((x, y) => y.reads - x.reads || x.name.localeCompare(y.name)),
    classes: [...css.classRules.entries()]
        .filter(([c, n]) => n >= 2 && !emit.classes.has(c))
        .map(([c, n]) => ({ name: c, rules: n, maybe: shadowed(c) }))
        .sort((x, y) => y.rules - x.rules || x.name.localeCompare(y.name)),
    // 🔴 A CLASS THE DESIGN ITSELF EMITS UNSTYLED IS NOT AN "ELEMENT NOTHING STYLES" — it is the
    //    conformance pass working. `.rowlife` reached this list on 2026-08-31 when the mode collapse removed
    //    the portal-only rule behind it, and the mockup's own season.html emits the same class on every row
    //    with no rule for it either. Removing it would change the element's class list, which is what the
    //    audit pairs on. It is reported below and does not fail; it never goes in the baseline, whose own
    //    rule is that it only ever shrinks — growing it to absorb a correct match makes the ratchet a diary.
    mismatch: [...emit.classes.entries()]
        .filter(([c]) => !css.classRules.has(c) && !DESIGN_CLASSES.has(c))
        .map(([c, files]) => ({ name: c, files: [...files].sort() }))
        .sort((x, y) => x.name.localeCompare(y.name)),
    inherited: [...emit.classes.entries()]
        .filter(([c]) => !css.classRules.has(c) && DESIGN_CLASSES.has(c))
        .map(([c, files]) => ({ name: c, files: [...files].sort() }))
        .sort((x, y) => x.name.localeCompare(y.name)),
};

const args = process.argv.slice(2);

// `--why <name>` — triage, and the answer to "is this finding real?" without re-deriving the scan by hand. Every later Part needs it: a class with 23 rules and no emitter is either a dead panel or a scanner blind spot, and only the emitting FILE tells them apart.
if (args.includes('--why')) {
    const name = args[args.indexOf('--why') + 1] || '';
    const cls = name.replace(/^\./, '');
    console.log(`.${cls}`);
    console.log(`  rules in the stylesheet : ${css.classRules.get(cls) || 0}`);
    console.log(`  emitted by              : ${emit.classes.has(cls) ? [...emit.classes.get(cls)].sort().join(', ') : '— nothing'}`);
    const near = [...emit.dynamic.entries()].filter(([pre]) => cls.startsWith(pre));
    console.log(`  dynamic prefixes it could hide behind : ${near.length ? near.map(([pre, f]) => `${pre}… (${[...f].sort().join(', ')})`).join('  ') : '— none'}`);
    process.exit(0);
}

if (args.includes('--json')) {
    console.log(JSON.stringify(findings, null, 2));
    process.exit(0);
}

const names = (k) => findings[k].map((x) => x.name).sort();
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
console.log('portal:reverse-orphans — rules with no element\n');
console.log(`  ① ${plural(findings.data.length, '[data-*] selector', '[data-*] selectors')} with no emitter`);
for (const d of findings.data) console.log(`       [data-${d.name}]`.padEnd(30) + plural(d.rules, 'rule', 'rules'));
console.log(`\n  ② ${plural(findings.vars.length, 'var() read', 'var() reads')} with no setter anywhere`);
for (const v of findings.vars) console.log(`       ${v.name}`.padEnd(30) + plural(v.reads, 'read', 'reads'));
console.log(`\n  ③ ${plural(findings.classes.length, 'class', 'classes')} with ≥2 rules and no emitter`);
for (const c of findings.classes) console.log(`       .${c.name}`.padEnd(30) + `${c.rules} rules` + (c.maybe.length ? `   ⚠ may be reached by a dynamic expression: ${c.maybe.map((p) => p + '…').join(', ')}` : ''));
console.log(`\n  ④ ${plural(findings.mismatch.length, 'class', 'classes')} EMITTED with no rule that matches`);
for (const m of findings.mismatch) console.log(`       .${m.name}`.padEnd(30) + m.files.join(', '));
if (!DESIGN_CLASSES.size) {
    console.log('\n  ⚠️  the mockup package could not be read, so a class the DESIGN emits unstyled cannot be');
    console.log('      told apart from one the portal renders into nothing. Every ④ above is treated as ours.');
} else if (findings.inherited.length) {
    console.log(`\n  📐 ${plural(findings.inherited.length, 'class', 'classes')} INHERITED from the design — emitted there too, and unstyled there too.`);
    console.log('     Matching them is the pass working, so they do not fail. They still render into nothing:');
    for (const m of findings.inherited) console.log(`       .${m.name}`.padEnd(30) + m.files.join(', '));
}
const opaqueTotal = [...emit.opaque.values()].reduce((a, b) => a + b, 0);
console.log(`\n  · ${plural(opaqueTotal, 'class expression', 'class expressions')} resolved to nothing readable (a variable built elsewhere) — a ③ finding in ${[...emit.opaque.keys()].sort().join(', ') || '—'} may be a false positive and is checked by hand`);
console.log(`  · ${plural(dynPrefixes.length, 'dynamic prefix', 'dynamic prefixes')} this scan could not resolve (annotation only, never a certification): ${dynPrefixes.sort().map((p) => p + '…').join(' ')}`);

if (args.includes('--write')) {
    fs.mkdirSync(path.dirname(BASELINE), { recursive: true });
    fs.writeFileSync(BASELINE, JSON.stringify({
        recordedAt: new Date().toISOString(),
        note: 'The debt as measured. It only ever shrinks — --ci fails on a NEW entry and on a baseline entry that has been fixed without this file being updated.',
        data: names('data'), vars: names('vars'), classes: names('classes'), mismatch: names('mismatch'),
    }, null, 2) + '\n');
    console.log('\n✅ baseline written to portal/fixtures/reverse-orphans.json');
    process.exit(0);
}

if (args.includes('--ci')) {
    if (!fs.existsSync(BASELINE)) { console.log('\n❌ no baseline — run `node scripts/portalReverseOrphans.mjs --write` once and commit it.'); process.exit(1); }
    const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
    let bad = false;
    for (const k of ['data', 'vars', 'classes', 'mismatch']) {
        const now = names(k), was = new Set(base[k] || []);
        const fresh = now.filter((n) => !was.has(n));
        const gone = [...was].filter((n) => !now.includes(n));
        if (fresh.length) { bad = true; console.log(`\n❌ ${k}: ${fresh.length} NEW — a rule that nothing triggers, or an element nothing styles: ${fresh.join(', ')}`); }
        if (gone.length) { bad = true; console.log(`\n❌ ${k}: ${gone.length} fixed but still in the baseline — re-record with --write in the same commit: ${gone.join(', ')}`); }
    }
    if (bad) process.exit(1);
    console.log('\n✅ matches the baseline. The list only ever shrinks.');
}
