// scripts/buildPortalInputs.test.mjs — proves the portal build's input hash covers every file the build actually reads.
//
// Added 2026-09-14 21:00 EDT. build() skips when inputsHash() is unchanged, so a file the build reads that BUILD_INPUTS does not list would let a local run test a stale portal while every gate reports a fresh one. CI always builds from nothing, so only local runs would lie — which is exactly where nobody would look. This forces a real build into a temp directory under the file-read tracer and fails on any repo file it opened outside the list.
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const { BUILD_INPUTS } = createRequire(import.meta.url)('./buildPortal.js');

// A node_modules package is covered by its package.json: the version pins every file inside it.
const roots = BUILD_INPUTS.map((p) => (p.split(path.sep).includes('node_modules') ? path.dirname(p) : p));
export const uncovered = (reads) => reads.filter((p) => !roots.some((r) => p === r || p.startsWith(r + path.sep)));

let passed = 0;
const check = (label, fn) => { fn(); passed++; console.log(`  ✓ ${label}`); };
console.log('buildPortal input coverage\n');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'build-inputs-'));
try {
    const trace = path.join(tmp, 'trace.jsonl');
    execFileSync(process.execPath, ['-e', "require('./scripts/buildPortal.js').build()"], {
        cwd: ROOT, stdio: 'pipe',
        env: { ...process.env, TEST_TRACE_OUT: trace, NODE_OPTIONS: `--require ${JSON.stringify(path.join(HERE, 'lib', 'traceInputs.cjs'))}`, PORTAL_BUILD_OUT: path.join(tmp, 'out'), PORTAL_BUILD_FORCE: '1' },
    });
    const text = fs.readFileSync(trace, 'utf8');
    // When the test runner is tracing THIS entry, hand it the child's reads too, so the entry re-runs when a build input changes.
    if (process.env.TEST_TRACE_OUT) fs.appendFileSync(process.env.TEST_TRACE_OUT, text);
    const lines = text.trim().split('\n').map((l) => JSON.parse(l));
    const writes = new Set(lines.flatMap((x) => x.writes));
    const reads = [...new Set(lines.flatMap((x) => [...x.reads, ...x.dirs]))].filter((p) => p.startsWith(ROOT + path.sep) && !writes.has(p));

    check('the forced build really read the portal sources — the trace is not empty', () => {
        assert.ok(reads.some((p) => p.includes(`${path.sep}portal${path.sep}ui${path.sep}`)), `no portal/ui read in ${reads.length} traced reads — the build or the tracer did not run`);
        assert.ok(fs.existsSync(path.join(tmp, 'out', 'harness.html')), 'the build wrote no harness.html into the temp directory');
    });
    check('every repo file the build read is covered by BUILD_INPUTS', () => {
        assert.deepStrictEqual(uncovered(reads).map((p) => path.relative(ROOT, p)), [], 'add these to BUILD_INPUTS in scripts/buildPortal.js, or local runs will test a stale build');
    });
    check('a read outside BUILD_INPUTS is reported — the check can fail', () => {
        const invented = path.join(ROOT, 'portal', 'assets-added-later', 'logo.svg');
        assert.deepStrictEqual(uncovered([...reads, invented]), [invented]);
    });
} finally {
    fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(`\n✅ ${passed} cases — the build's cache key is proven to cover what the build reads.`);
