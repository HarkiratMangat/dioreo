// scripts/portalPayloadShape.test.js — does a component read a field the SERVER never sends?
//
// 🔴 THE CLASS, AND IT HAS BITTEN TWICE. A component reads a field off an API payload; the server
// does not emit it; the HARNESS FIXTURE does. So every rendered instrument — the states walk, the
// overlay diff, the audit, a screenshot — certifies the surface as working, while production draws
// a hole. Recorded instance one is `ownerOnly` (portal/api/access.js's own comment: "the grid's lock
// existed only in the harness … on the real server the legend named a mark the page could not
// draw"). Instance two is `sc.hex`, found 2026-09-09 13:47 EDT by Harkirat looking at a screenshot I had
// already looked at: the permission chips read `sc.hex`, `buildPermissionMatrix` has never emitted
// it, `assets/fixtures.js:1100` does — twelve identical black pills where the design shows the
// realm's colour, with a full green suite over it.
//
// ⚠️ THIS IS THE SIBLING OF scripts/portalHarness.test.js, NOT A DUPLICATE OF IT. That one compares
// the stub's TOP-LEVEL payload keys against the route's, so the two implementations of one contract
// cannot drift. It says nothing about the objects INSIDE a payload, and nothing about what the UI
// reads off them. This one takes the other half: the nested record shapes, checked against their
// actual consumers.
//
// 🔴 IT COVERS **CLOSED** SHAPES ONLY, AND SAYS SO RATHER THAN IMPLYING MORE. A producer that
// spreads a Mongo document (`{ ...b, coverage: … }`) has a key set nobody can read off the source,
// so a scan over it would report every real model field as a violation and get suppressed — the
// failure mode this repo keeps naming. A shape qualifies only when the server builds it from
// literals with no spread, which the SPREAD ASSERTION below enforces: if one of these gains a
// `...`, this file fails and the contract has to be re-declared rather than silently weakening.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let failures = 0;
const say = console.log.bind(console);
function check(name, fn) {
    try { fn(); say(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

say('portalPayloadShape — does a component read a field the server never sends?');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// ⚠️ COMMENTS AND STRINGS ARE BLANKED TO SPACES, NEVER REMOVED, so every index and line number
// still lines up with the real file. Both matter here and each cost a false positive when it was
// missing: a comment saying `sc.hex` is prose, and `op: 'admin.grant'` is an op id — the scanner
// read that string as `admin.grant`, a property access on an admin row, and reported five.
function mask(src) {
    // A STACK, NOT A FLAT LOOP, and the flat version's failure is exactly why. It kept an
    // interpolation's contents verbatim -- correct, they are code -- and then never re-applied the
    // string rule inside them, so eyebrow=${editing ? 'admin.grant . tier 3' : ...} handed the
    // scanner a literal admin.grant and it reported an admin row reading a field called "grant".
    // An interpolation is code, and code contains strings, so the masker has to RECURSE rather
    // than special-case one level.
    let out = '';
    let i = 0;
    const stack = [{ kind: 'code', braces: 0 }];
    const top = () => stack[stack.length - 1];
    const blank = (t) => t.replace(/[^\n]/g, ' ');
    while (i < src.length) {
        const st = top();
        if (st.kind === 'tpl') {
            if (src[i] === '\\') { out += '  '; i += 2; continue; }
            if (src[i] === '`') { out += '`'; i++; stack.pop(); continue; }
            if (src.startsWith('${', i)) { out += '${'; i += 2; stack.push({ kind: 'code', braces: 0 }); continue; }
            out += src[i] === '\n' ? '\n' : ' '; i++; continue;
        }
        if (src.startsWith('//', i)) { const e = src.indexOf('\n', i); const to = e === -1 ? src.length : e; out += blank(src.slice(i, to)); i = to; continue; }
        if (src.startsWith('/*', i)) { const e = src.indexOf('*/', i + 2); const to = e === -1 ? src.length : e + 2; out += blank(src.slice(i, to)); i = to; continue; }
        if (src[i] === "'" || src[i] === '"') {
            const q = src[i]; let j = i + 1;
            while (j < src.length && src[j] !== q) { if (src[j] === '\\') j++; j++; }
            out += q + blank(src.slice(i + 1, j)) + (src[j] === q ? q : '');
            i = Math.min(j + 1, src.length); continue;
        }
        if (src[i] === '`') { out += '`'; i++; stack.push({ kind: 'tpl' }); continue; }
        if (src[i] === '{') { st.braces++; out += '{'; i++; continue; }
        if (src[i] === '}') {
            if (st.braces === 0 && stack.length > 1) { out += '}'; i++; stack.pop(); continue; }
            st.braces--; out += '}'; i++; continue;
        }
        out += src[i]; i++;
    }
    return out;
}

// The object literal that starts at the first `{` after `anchor`, balanced.
function literalAfter(src, anchor) {
    const at = src.indexOf(anchor);
    assert.notStrictEqual(at, -1, `the anchor is gone from the producer: ${anchor}`);
    const open = src.indexOf('{', at);   // from the anchor's START: the anchor may contain its own brace
    let depth = 0;
    for (let i = open; i < src.length; i++) {
        if ('([{'.includes(src[i])) depth++;
        else if (')]}'.includes(src[i])) { if (--depth === 0) return src.slice(open, i + 1); }
    }
    throw new Error(`unbalanced literal after ${anchor}`);
}

function keysOf(literal) {
    const out = new Set();
    for (const m of literal.matchAll(/([A-Za-z_$][\w$]*)\s*:/g)) out.add(m[1]);
    for (const m of literal.matchAll(/[{,]\s*([A-Za-z_$][\w$]*)\s*(?=[,}])/g)) out.add(m[1]);
    return out;
}

// 🔴 EACH ENTRY IS A CLAIM THAT GETS CHECKED, in the shape portalOpsReach.test.js already uses — not
// a list of things to trust. The anchors are TEXT, never line numbers: a line number in a gate rots
// the first time somebody reflows the file above it, which this repo measured on its own deferred
// list the day before this was written.
const CONTRACTS = [
    {
        name: 'access · a scope',
        producer: 'portal/api/access.js',
        anchors: ['ADMIN_COMMANDS.map((key) => (', 'MANAGE_PAGE_SCOPES.map((page) => ('],
        consumers: ['portal/ui/access.js'],
        receivers: ['sc', 'scope'],
    },
    {
        name: 'access · an admin row',
        producer: 'portal/api/access.js',
        anchors: ['return { discordId: admin.discordId'],
        consumers: ['portal/ui/access.js'],
        receivers: ['admin'],
    },
    {
        name: 'access · a Discord lookup',
        producer: 'portal/api/access.js',
        anchors: ['sendJson(res, 200, { id: user.id'],
        consumers: ['portal/ui/access.js'],
        receivers: ['user'],
    },
];

// An allowed read names the property that makes it right, so it fails when that stops being true.
const ALLOW = {
    // (empty on purpose — every read currently resolves. An entry here needs a reason, not a wish.)
};

function violations(contract) {
    const psrc = mask(read(contract.producer));
    const keys = new Set();
    for (const a of contract.anchors) {
        const lit = literalAfter(psrc, a);
        assert.ok(!lit.includes('...'), `${contract.name}: the producer now SPREADS, so its key set is no longer readable from source — re-declare this contract or drop it`);
        for (const k of keysOf(lit)) keys.add(k);
    }
    assert.ok(keys.size, `${contract.name}: the anchor matched but yielded no keys — the scan is looking at the wrong thing`);

    const out = [];
    for (const f of contract.consumers) {
        mask(read(f)).split('\n').forEach((ln, i) => {
            for (const m of ln.matchAll(/\b([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\b/g)) {
                const [, recv, field] = m;
                if (!contract.receivers.includes(recv)) continue;
                if (keys.has(field)) continue;
                if (ALLOW[`${recv}.${field}`]) continue;
                out.push(`${f}:${i + 1}  ${recv}.${field} — the server sends { ${[...keys].sort().join(', ')} }`);
            }
        });
    }
    return out;
}

for (const c of CONTRACTS) {
    check(`${c.name} — every field a component reads is one the server sends`, () => {
        assert.deepStrictEqual(violations(c), [], `a component reads a field this payload does not carry:\n      ` + violations(c).join('\n      '));
    });
}

// 🔴 THE GATE'S OWN FALSIFIER, and it is not decoration: a scan whose receivers never match anything
// compares [] against [] and passes forever, which is indistinguishable from a clean tree. This
// rebuilds the exact defect that was live this morning — a chip reading `sc.hex` against a producer
// that emits key/label/kind/ownerOnly/realm — and asserts the scanner reports it.
check('THE SHAPE GATE CAN FAIL: a chip reading sc.hex against a producer that never emits it', () => {
    const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'shape-'));
    fs.mkdirSync(path.join(dir, 'api'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'ui'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'api', 'x.js'),
        "const scopes = [\n  ...ADMIN_COMMANDS.map((key) => ({ key, label: L[key], kind: 'command', ownerOnly: false, realm: r(key) })),\n];\n");
    fs.writeFileSync(path.join(dir, 'ui', 'x.js'),
        "// a comment mentioning sc.hex must NOT count\nconst a = html`<button style=${sc.hex ? '--c' : null} title=${sc.label}></button>`;\nconst b = 'op: admin.grant';\n");
    const rel = (p) => path.relative(ROOT, path.join(dir, p));
    const found = violations({
        name: 'synthetic', producer: rel('api/x.js'),
        anchors: ['ADMIN_COMMANDS.map((key) => ('],
        consumers: [rel('ui/x.js')], receivers: ['sc'],
    });
    fs.rmSync(dir, { recursive: true, force: true });
    assert.strictEqual(found.length, 1, `expected exactly the sc.hex read, got ${found.length}: ${found.join(' | ')}`);
    assert.ok(found[0].includes('sc.hex'), 'and it must be the hex one');
});

// ⚠️ AND THE MASK ITSELF IS TESTED, because both of its jobs were learned from a false positive.
check('THE MASK CAN FAIL: prose and an op id are not property reads', () => {
    const m = mask("// sc.hex in a comment\nconst x = { op: 'admin.grant' };\nconst y = sc.hex;\n");
    assert.ok(!/\/\/ sc\.hex/.test(m), 'a comment must be blanked');
    assert.ok(!m.includes('admin.grant'), 'a string must be blanked');
    assert.ok(m.includes('sc.hex'), 'and the real read must survive');
    const t = mask('const v = html`<b class="x">prose sc.zzz</b>${sc.hex}`;\n');
    assert.ok(t.includes('sc.hex'), 'an interpolation inside a template is CODE and must survive — this gate passed vacuously until it did');
    assert.ok(!t.includes('sc.zzz'), 'and the literal text around it is not');
    const n = mask("const v = html`<b eyebrow=${x ? 'admin.grant tier3' : 'q'}>${admin.note}</b>`;\n");
    assert.ok(!n.includes('admin.grant'), 'a STRING INSIDE an interpolation is still a string — the flat masker read this as a property access and reported it twice');
    assert.ok(n.includes('admin.note'), 'and the real read beside it must survive');
    assert.strictEqual(m.split('\n').length, 4, 'line count must be preserved so line numbers still resolve');
});

process.exit(failures ? 1 : 0);
