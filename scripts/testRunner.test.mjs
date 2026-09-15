// scripts/testRunner.test.mjs — proves the runner can FAIL: every failure reported, a hung entry killed, parallel slots real, a cached pass only for inputs it traced, and no test the old chain ran left behind.
//
// Added 2026-09-14 18:52 EDT with the runner. Each property here is one that, broken, would look exactly like a healthy suite: a runner that stops at the first failure hides the rest, one that never kills leaves CI hanging to its 6-hour limit, one that caches without tracing reports a pass for code it never ran.
import assert from 'node:assert';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const RUNNER = path.join(HERE, 'testRunner.mjs');
const { TESTS } = await import(pathToFileURL(path.join(HERE, 'testManifest.mjs')).href);
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

let passed = 0;
const check = async (label, fn) => { await fn(); passed++; console.log(`  ✓ ${label}`); };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-selftest-'));
// Under the repo on purpose: the tracer ignores the temp directory, so a fixture there could never become an input.
const fixture = path.join(ROOT, 'local', '.test-cache', `runner-selftest-${process.pid}`);
const manifest = (entries) => { const f = path.join(tmp, `m${Math.random().toString(36).slice(2)}.mjs`); fs.writeFileSync(f, `export const TESTS = ${JSON.stringify(entries)};\n`); return f; };
const run = (m, extra = [], env = {}) => {
    const t = Date.now();
    const r = spawnSync(process.execPath, [RUNNER, '--manifest', m, ...extra], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, CI: '', TEST_CACHE: '', GITHUB_STEP_SUMMARY: '', TEST_CACHE_DIR: path.join(tmp, 'store'), ...env } });
    return { status: r.status, ms: Date.now() - t, out: `${r.stdout || ''}${r.stderr || ''}` };
};
const node = (js) => `node -e ${JSON.stringify(js)}`;
const expandCmd = (c, d = 0) => { const m = c.match(/^npm run (\S+)/); return m && d < 6 ? String(pkg.scripts[m[1]] || '').split(/\s*&&\s*/).map((x) => expandCmd(x, d + 1)).join(' ') : c; };

console.log('testRunner self-test\n');
try {
    await check('npm test IS the runner', () => {
        assert.strictEqual(pkg.scripts.test, 'node scripts/testRunner.mjs');
    });

    await check('the manifest still runs every command the pre-rebuild && chain ran', () => {
        const before = JSON.parse(execFileSync('git', ['show', '8c5e8a90:package.json'], { cwd: ROOT, encoding: 'utf8' })).scripts.test.split(' && ');
        // A command deliberately retired from the suite goes here, with the date and the reason. Empty on purpose.
        const RETIRED = [];
        const cmds = new Set(TESTS.map((t) => t.cmd));
        const missing = before.filter((c) => !RETIRED.includes(c) && !cmds.has(c));
        assert.deepStrictEqual(missing, [], `the old chain ran these and the manifest does not: ${missing.join(' · ')}`);
    });

    await check('every `npm run` entry names a script that exists', () => {
        const dead = TESTS.map((t) => (t.cmd.match(/^npm run (\S+)/) || [])[1]).filter((s) => s && !pkg.scripts[s]);
        assert.deepStrictEqual(dead, []);
    });

    await check('every *.test.* file in the tree is reached by some manifest entry', () => {
        const expand = (c, d = 0) => { const m = c.match(/^npm run (\S+)/); return m && d < 6 ? String(pkg.scripts[m[1]] || '').split(/\s*&&\s*/).map((x) => expand(x, d + 1)).join(' ') : c; };
        const text = TESTS.map((t) => expand(t.cmd)).join(' ');
        const walk = (d, out = []) => { for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) { if (e.name === 'node_modules' || e.name.startsWith('.')) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (/\.test\.(c|m)?js$/.test(e.name)) out.push(p); } return out; };
        const UNWIRED_OK = [];
        const files = ['scripts', 'utils', 'portal', 'core', 'handlers', 'commands', 'bot', 'models'].filter((d) => fs.existsSync(path.join(ROOT, d))).flatMap((d) => walk(d));
        assert.ok(files.length > 100, `found only ${files.length} test files — the walk itself is broken`);
        const missing = files.filter((f) => !text.includes(f) && !UNWIRED_OK.includes(f));
        assert.deepStrictEqual(missing, [], `no manifest entry runs: ${missing.join(', ')}`);
    });

    await check('an entry whose own script starts a browser is in the browser lane, and the check can fail', () => {
        // Direct scripts only: portalRealWalk.test imports pure functions from a file that also imports puppeteer, and following imports would misfile it.
        const scriptsOf = (cmd) => [...expandCmd(cmd).matchAll(/[\w./-]+\.(?:c|m)?js\b/g)].map((m) => m[0]).filter((f) => fs.existsSync(path.join(ROOT, f)));
        const launches = (f) => /require\(\s*['"]puppeteer|from\s+['"]puppeteer/.test(fs.readFileSync(path.join(ROOT, f), 'utf8'));
        const offenders = (tests) => tests.filter((t) => t.lane !== 'browser' && scriptsOf(t.cmd).some(launches)).map((t) => t.cmd);
        assert.deepStrictEqual(offenders(TESTS), [], 'these start Chrome and would share the CI tests job\'s 4 vCPUs with everything else — set lane: "browser"');
        const flipped = TESTS.map((t) => (t.cmd === 'node scripts/portalContrastRendered.test.js' ? { ...t, lane: 'unit' } : t));
        assert.deepStrictEqual(offenders(flipped), ['node scripts/portalContrastRendered.test.js'], 'the lane check did not catch a browser test filed as unit — it is a vacuous pass');
    });

    await check('an entry that writes .js into the tree without a tree lock is warned about, and a locked one is not', () => {
        fs.mkdirSync(fixture, { recursive: true });
        const writer = node(`require('fs').writeFileSync(${JSON.stringify(path.join(fixture, 'written.js'))}, '1')`);
        assert.match(run(manifest([{ cmd: writer, lane: 'unit' }]), ['--no-cache']).out, /without lock: 'tree:write'/);
        assert.doesNotMatch(run(manifest([{ cmd: writer, lane: 'unit', lock: 'tree:write' }]), ['--no-cache']).out, /without lock: 'tree:write'/);
    });

    await check('EVERY failure is reported, not only the first, and the exit code is 1', () => {
        const r = run(manifest([{ cmd: node('process.exit(0)'), lane: 'unit' }, { cmd: node("console.log('first-marker');process.exit(3)"), lane: 'unit' }, { cmd: node("console.log('second-marker');process.exit(1)"), lane: 'unit' }]), ['--no-cache']);
        assert.strictEqual(r.status, 1, r.out);
        assert.match(r.out, /first-marker/);
        assert.match(r.out, /second-marker/);
        assert.match(r.out, /passed 1 · failed 2/);
    });

    await check('slots are real: two 1.2 s entries finish together with 2 slots, and one after the other with --serial', () => {
        const m = manifest([{ cmd: node('setTimeout(()=>{},1200)'), lane: 'unit' }, { cmd: node('setTimeout(()=>{},1200)'), lane: 'unit' }]);
        const par = run(m, ['--no-cache', '--jobs', '2']);
        const ser = run(m, ['--no-cache', '--serial']);
        assert.strictEqual(par.status, 0, par.out);
        assert.strictEqual(ser.status, 0, ser.out);
        // Compared with each other, never with a wall-clock constant: on a loaded 4-vCPU CI runner both runs inflate together, while the gap between one-at-a-time and together stays about one 1.2 s entry.
        assert.ok(ser.ms >= 2400, `--serial took ${ser.ms} ms, so it did not run one at a time`);
        assert.ok(ser.ms - par.ms > 700, `2 slots (${par.ms} ms) were not meaningfully faster than --serial (${ser.ms} ms)`);
    });

    await check('a weight above the slot count is clamped, never a deadlock', () => {
        const r = run(manifest([{ cmd: node('0'), lane: 'unit', weight: 99 }]), ['--no-cache', '--jobs', '2']);
        assert.strictEqual(r.status, 0, r.out);
    });

    await check('a tree writer never overlaps a tree reader, while two readers share the slots', () => {
        const nap = node('setTimeout(()=>{},1100)');
        const mixed = run(manifest([{ cmd: nap, lane: 'unit', lock: 'tree:write' }, { cmd: nap, lane: 'unit', lock: 'tree:read' }]), ['--no-cache', '--jobs', '2']);
        const readers = run(manifest([{ cmd: nap, lane: 'unit', lock: 'tree:read' }, { cmd: nap, lane: 'unit', lock: 'tree:read' }]), ['--no-cache', '--jobs', '2']);
        assert.strictEqual(mixed.status, 0, mixed.out);
        assert.ok(mixed.ms >= 2200, `a writer and a reader overlapped: ${mixed.ms} ms`);
        assert.ok(mixed.ms - readers.ms > 700, `two readers (${readers.ms} ms) did not share any better than a writer and a reader (${mixed.ms} ms)`);
    });

    await check('a hung entry is killed at its timeout and reported as timed out', () => {
        const r = run(manifest([{ cmd: node('setTimeout(()=>{},60000)'), lane: 'unit', timeoutMs: 500 }]), ['--no-cache']);
        assert.strictEqual(r.status, 1, r.out);
        assert.match(r.out, /timed out/);
        assert.ok(r.ms < 10000, `took ${r.ms} ms`);
    });

    await check('an empty selection is an error, never a vacuous pass', () => {
        const r = run(manifest([{ cmd: node('0'), lane: 'unit' }]), ['--lane', 'no-such-lane']);
        assert.strictEqual(r.status, 2, r.out);
    });

    await check('a passing entry is cached, and changing what it READ runs it again', () => {
        fs.mkdirSync(fixture, { recursive: true });
        const input = path.join(fixture, 'input.txt');
        const reader = path.join(fixture, 'reader.cjs');
        fs.writeFileSync(input, 'one\n');
        fs.writeFileSync(reader, `require('fs').readFileSync(${JSON.stringify(input)}, 'utf8');\n`);
        const m = manifest([{ cmd: `node ${JSON.stringify(reader)}`, lane: 'unit' }]);
        const first = run(m);
        assert.strictEqual(first.status, 0, first.out);
        assert.doesNotMatch(first.out, /○ cached/, 'a first run cannot come from cache');
        const second = run(m);
        assert.match(second.out, /○ cached/, `an unchanged input must be served from cache:\n${second.out}`);
        fs.writeFileSync(input, 'two\n');
        assert.doesNotMatch(run(m).out, /○ cached/, 'a changed input must run again');
        assert.doesNotMatch(run(m, [], { CI: 'true' }).out, /○ cached/, 'CI never reads the cache');
        assert.doesNotMatch(run(m, [], { TEST_CACHE: '0' }).out, /○ cached/, 'TEST_CACHE=0 never reads the cache');
    });

    await check('a shell-shaped entry with no declared inputs is never cached', () => {
        const input = path.join(fixture, 'input.txt');
        const m = manifest([{ cmd: `cat ${JSON.stringify(input)} > /dev/null && bash -c true`, lane: 'unit' }]);
        run(m);
        const again = run(m);
        assert.strictEqual(again.status, 0, again.out);
        assert.doesNotMatch(again.out, /○ cached/);
    });
} finally {
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.rmSync(fixture, { recursive: true, force: true });
}
console.log(`\n✅ ${passed} cases — the runner is proven able to fail, to run in parallel, to kill, and to refuse a cache it cannot justify.`);
