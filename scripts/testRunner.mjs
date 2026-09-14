#!/usr/bin/env node
// scripts/testRunner.mjs — `npm test`. Runs scripts/testManifest.mjs in a weighted pool, reports EVERY failure, and on a local machine skips an entry whose traced inputs have not changed since it last passed.
//
// Added 2026-09-14 18:52 EDT, replacing a 132-command `&&` chain in package.json. Measured before it, on 2026-09-14: 258.6 s locally and 215 s on CI, one command at a time, stopping at the FIRST failure — so a branch with seven problems took seven red runs to show them, which happened on 2026-09-11. The chain had been edited 43 times and never redesigned.
//
// 🔴 CI NEVER CACHES AND NEVER SKIPS. Harkirat, 2026-09-14: "Local only, CI runs everything." With CI=true this is a parallel runner and nothing more. The cache is for the local suite runs sessions sit waiting on — 40 of them in the fortnight before this was written.
//
// ⚠️ A CACHED PASS IS A CLAIM ABOUT INPUTS, NOT ABOUT TIME. A test whose result depends on the clock, the network, or a file no node process opened can pass from cache while it would fail if run. That is accepted only because CI runs everything before any merge. When you need the local answer to be a real run, say TEST_CACHE=0.
//
//   node scripts/testRunner.mjs                                   everything; unchanged entries skipped (local)
//   node scripts/testRunner.mjs --lane browser                    one lane: unit · docs · hooks · browser
//   node scripts/testRunner.mjs --exclude-lane browser --exclude "npm run docs:audit:test"
//   node scripts/testRunner.mjs --only portalStates               entries whose command contains the text
//   node scripts/testRunner.mjs --serial --no-cache               one at a time, everything, still reporting every failure
//   node scripts/testRunner.mjs --bail · --list · --jobs N · --manifest <file>
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TRACER = path.join(ROOT, 'scripts', 'lib', 'traceInputs.cjs');
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const value = (n) => { const i = argv.indexOf(n); return i === -1 ? null : argv[i + 1]; };
const values = (n) => argv.flatMap((a, i) => (a === n && argv[i + 1] !== undefined ? [argv[i + 1]] : []));

const ON_CI = process.env.CI === 'true';
const READ_CACHE = !ON_CI && process.env.TEST_CACHE !== '0' && !flag('--no-cache');
const TRACE = !ON_CI;
const CACHE_DIR = process.env.TEST_CACHE_DIR ? path.resolve(process.env.TEST_CACHE_DIR) : path.join(ROOT, 'local', '.test-cache');
const STORE_FILE = path.join(CACHE_DIR, 'runner-store.json');
const DEFAULT_TIMEOUT_MS = 300000;
const OUTPUT_CAP = 4 * 1024 * 1024;

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const { TESTS } = await import(pathToFileURL(path.resolve(ROOT, value('--manifest') || 'scripts/testManifest.mjs')).href);

const lanes = (value('--lane') || '').split(',').filter(Boolean);
const skipLanes = (value('--exclude-lane') || '').split(',').filter(Boolean);
const excludes = values('--exclude');
const onlys = values('--only');
const selected = TESTS.filter((t) => (!lanes.length || lanes.includes(t.lane)) && !skipLanes.includes(t.lane)
    && !excludes.some((x) => t.cmd.includes(x)) && (!onlys.length || onlys.some((x) => t.cmd.includes(x))));

if (flag('--list')) {
    for (const t of selected) console.log(`${String(t.lane).padEnd(8)} w${t.weight || 1}  ${t.cmd}`);
    process.exit(0);
}
// ⚠️ AN EMPTY SELECTION IS AN ERROR. A CI job whose lane filter matched nothing would otherwise report a clean pass having run no test at all.
if (!selected.length) { console.error('npm test — no manifest entry matches the lane / --only / --exclude filters given. That is not a pass.'); process.exit(2); }

const cores = typeof os.availableParallelism === 'function' ? os.availableParallelism() : os.cpus().length;
const capacity = flag('--serial') ? 1 : Math.max(1, Number.parseInt(value('--jobs'), 10) || cores);

// What an entry really runs, expanded through `npm run`, for the shell-shape rule below.
function expand(cmd, depth = 0) {
    const m = cmd.match(/^npm run (\S+)(.*)$/);
    if (!m || depth > 6) return cmd;
    return String(pkg.scripts[m[1]] || '').split(/\s*&&\s*/).map((c) => expand(c, depth + 1)).join(' && ') + m[2];
}
// 🔴 A SHELL-SHAPED ENTRY IS NEVER CACHED ON ITS TRACE ALONE. bash, find and xargs read files the node tracer cannot see, so such an entry is cacheable only with `declared` inputs in the manifest.
const shellShaped = (t) => /(^|[\s;&|(])(bash|sh|zsh|find|xargs)\s/.test(` ${expand(t.cmd)}`);
const cacheable = (t) => t.cache !== false && (!shellShaped(t) || Array.isArray(t.declared));

// ── hashing, memoised per run ─────────────────────────────────────────────
const memo = new Map();
function fileSig(p) {
    if (memo.has(p)) return memo.get(p);
    let v;
    try {
        const st = fs.statSync(p);
        v = st.isDirectory() ? 'dir' : st.size > 4 * 1024 * 1024 ? `big:${st.size}:${Math.round(st.mtimeMs)}` : createHash('sha1').update(fs.readFileSync(p)).digest('hex');
    } catch { v = 'missing'; }
    memo.set(p, v);
    return v;
}
function dirSig(p) {
    const k = `\0dir\0${p}`;
    if (memo.has(k)) return memo.get(k);
    let v;
    try { v = createHash('sha1').update(fs.readdirSync(p).sort().join('\0')).digest('hex'); } catch { v = 'missing'; }
    memo.set(k, v);
    return v;
}
const forget = (p) => { memo.delete(p); memo.delete(`\0dir\0${p}`); };

const declaredMemo = new Map();
function declaredSig(t) {
    if (!Array.isArray(t.declared)) return null;
    if (declaredMemo.has(t.cmd)) return declaredMemo.get(t.cmd);
    const h = createHash('sha1');
    const add = (rel) => {
        const a = path.resolve(ROOT, rel);
        let st;
        try { st = fs.statSync(a); } catch { h.update(`${rel}:missing\0`); return; }
        if (st.isDirectory()) { for (const n of fs.readdirSync(a).sort()) add(path.join(rel, n)); return; }
        h.update(`${rel}:${fileSig(a)}\0`);
    };
    for (const d of t.declared) {
        if (typeof d === 'string') add(d);
        else if (d && d.gitFiles) {
            const out = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '--', d.gitFiles], { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
            for (const f of out.split('\n').filter(Boolean).sort()) add(f);
        }
    }
    const v = h.digest('hex');
    declaredMemo.set(t.cmd, v);
    return v;
}

let gitSigValue = null;
function gitSig() {
    if (gitSigValue) return gitSigValue;
    const g = (a) => { try { return execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }).trim(); } catch { return '?'; } };
    gitSigValue = createHash('sha1').update([g(['rev-parse', 'HEAD']), g(['rev-parse', '--verify', '-q', 'origin/main']), g(['rev-parse', '--verify', '-q', 'origin/v3-pre-release']), g(['tag', '--list']), g(['diff', '--cached', '--name-only'])].join('\0')).digest('hex');
    return gitSigValue;
}

// 🔴 THE KEY INCLUDES THE TOOLS AND TWO VARIABLES — added 2026-09-14 19:56 EDT. The day this runner was written, Xcode's command line tools vanished mid-session and /usr/bin/git became an install prompt: twelve hook tests failed with no file changed. A key of files alone would have kept serving their cached passes. The hook suite shells out to git, rg, jq and bash, and the clock tests read TZ; the rest of the environment is deliberately NOT hashed, because it differs every session and would make the cache never hit.
const toolVersion = (bin, args = ['--version']) => { try { return execFileSync(bin, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }).split('\n')[0]; } catch { return `${bin}:absent`; } };
const ENV_SIG = createHash('sha1').update([process.version, process.platform, process.arch, fileSig(path.join(ROOT, 'package-lock.json')),
    toolVersion('git'), toolVersion('rg'), toolVersion('jq'), toolVersion('bash'), process.env.TZ || '', process.env.TS_TZ || ''].join('|')).digest('hex');
const real = (p) => { try { return fs.realpathSync(p); } catch { return p; } };
const IGNORED_PREFIXES = [...new Set([os.tmpdir(), real(os.tmpdir()), '/tmp', '/private/tmp', '/var/folders', '/private/var/folders', '/dev', '/proc',
    path.resolve(path.dirname(process.execPath), '..'), CACHE_DIR, path.join(ROOT, '.git'), path.join(os.homedir(), '.npm'), path.join(os.homedir(), 'Library', 'Caches')])];
const ignored = (p) => p.split(path.sep).includes('node_modules') || IGNORED_PREFIXES.some((x) => p === x || p.startsWith(x + path.sep));

// ── the store ─────────────────────────────────────────────────────────────
let store = { version: 1, entries: {} };
try { const s = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')); if (s.version === 1 && s.entries) store = s; } catch { /* first run, or a store from another version */ }

function valid(t) {
    const e = store.entries[t.cmd];
    if (!e || e.env !== ENV_SIG || e.declared !== declaredSig(t)) return false;
    if (e.git && e.git !== gitSig()) return false;
    for (const [p, v] of Object.entries(e.inputs)) if (fileSig(p) !== v) return false;
    for (const [p, v] of Object.entries(e.dirs)) if (dirSig(p) !== v) return false;
    return true;
}
function readTrace(file) {
    try { return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; }
}
function record(t, traced) {
    const reads = new Set(), dirs = new Set(), writes = new Set();
    let git = false;
    for (const r of traced) {
        r.reads.forEach((x) => reads.add(x)); r.dirs.forEach((x) => dirs.add(x)); r.writes.forEach((x) => writes.add(x));
        if (r.git.some((c) => c === ROOT || c.startsWith(ROOT + path.sep))) git = true;
    }
    const inputs = {}, listed = {};
    for (const p of reads) if (!writes.has(p) && !ignored(p)) inputs[p] = fileSig(p);
    for (const d of dirs) if (!writes.has(d) && !ignored(d)) listed[d] = dirSig(d);
    if (!Object.keys(inputs).length && !Array.isArray(t.declared)) return false;
    const wrote = [...writes].filter((p) => p.startsWith(ROOT + path.sep) && !ignored(p)).map((p) => path.relative(ROOT, p)).sort().slice(0, 500);
    store.entries[t.cmd] = { env: ENV_SIG, declared: declaredSig(t), git: git ? gitSig() : null, inputs, dirs: listed, wrote, at: new Date().toISOString() };
    return true;
}

// ── running ───────────────────────────────────────────────────────────────
const active = new Set();
const killGroup = (pid) => { try { process.kill(-pid, 'SIGKILL'); } catch { /* already gone */ } };
process.on('SIGINT', () => { for (const pid of active) killGroup(pid); process.exit(130); });
process.on('SIGTERM', () => { for (const pid of active) killGroup(pid); process.exit(143); });

function runOne(t, n) {
    return new Promise((resolve) => {
        const started = Date.now();
        const traceFile = TRACE && cacheable(t) ? path.join(os.tmpdir(), `test-runner-${process.pid}-${n}.jsonl`) : null;
        const env = { ...process.env };
        if (traceFile) {
            fs.rmSync(traceFile, { force: true });
            env.TEST_TRACE_OUT = traceFile;
            env.NODE_OPTIONS = `${env.NODE_OPTIONS ? `${env.NODE_OPTIONS} ` : ''}--require ${JSON.stringify(TRACER)}`;
        }
        // detached: the entry gets its own process group, so a timeout kills the test AND whatever it started (a browser, a server).
        const child = spawn('/bin/sh', ['-c', t.cmd], { cwd: ROOT, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
        const chunks = [];
        let size = 0;
        const take = (b) => { chunks.push(b); size += b.length; while (size > OUTPUT_CAP && chunks.length > 1) size -= chunks.shift().length; };
        child.stdout.on('data', take);
        child.stderr.on('data', take);
        let timedOut = false;
        const limit = t.timeoutMs || DEFAULT_TIMEOUT_MS;
        const timer = setTimeout(() => { timedOut = true; killGroup(child.pid); }, limit);
        active.add(child.pid);
        let settled = false;
        const finish = (code) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            active.delete(child.pid);
            killGroup(child.pid);   // anything the entry left running in its group dies with it
            resolve({ code: timedOut ? 124 : code, ms: Date.now() - started, out: Buffer.concat(chunks).toString('utf8'), timedOut, limit, traceFile });
        };
        child.on('close', (code, signal) => finish(code ?? (signal ? 1 : 0)));
        child.on('error', (err) => { take(Buffer.from(String(err && err.message))); finish(127); });
    });
}

const sec = (ms) => `${(ms / 1000).toFixed(1)}s`;
const t0 = Date.now();
const mode = ON_CI ? 'CI — no cache, everything runs' : READ_CACHE ? 'local — unchanged entries are skipped (TEST_CACHE=0 runs everything)' : 'local — cache bypassed, results still recorded';
console.log(`npm test — ${selected.length} entr${selected.length === 1 ? 'y' : 'ies'} · ${capacity} slot${capacity === 1 ? '' : 's'} · ${mode}\n`);

const results = [];
const queue = [];
for (const [n, t] of selected.entries()) {
    if (READ_CACHE && cacheable(t) && valid(t)) { results.push({ t, status: 'cached', ms: 0 }); console.log(`  ○ cached   ${t.cmd}`); }
    else queue.push({ t, n, w: Math.min(capacity, Math.max(1, t.weight || 1)), waited: 0 });
}

// 🔴 ONE PORTAL BUILD BEFORE THE POOL. Fifteen entries call buildPortal.build(); it is idempotent (an input-hash stamp), but the FIRST build after a portal/ui change would otherwise be raced by several of them at once.
if (queue.some((j) => /portal/i.test(expand(j.t.cmd)))) {
    try { createRequire(import.meta.url)('./buildPortal.js').build(); } catch (e) { console.log(`  ⚠ the portal pre-build failed; the portal entries will report it themselves: ${String(e && e.message).split('\n')[0]}`); }
}

// 🔴 THE TREE LOCK — added 2026-09-14 19:01 EDT, from the concurrency audit this runner's own trace made possible. Three entries write .js files INTO the working tree while they run (hotpatch.test.js, portalRender.test.js, portalHarnessRender.test.js), and `npm run check` finds and syntax-checks every .js file on disk: run together, `node --check` can read a file halfway through being written. An entry declaring `lock: 'tree:write'` never overlaps one declaring `lock: 'tree:read'`; readers share.
const tree = { readers: 0, writer: false };
const lockFree = (t) => (t.lock === 'tree:write' ? !tree.writer && tree.readers === 0 : t.lock === 'tree:read' ? !tree.writer : true);
const lockTake = (t, sign) => { if (t.lock === 'tree:write') tree.writer = sign > 0; else if (t.lock === 'tree:read') tree.readers += sign; };

let bailed = false;
await new Promise((done) => {
    let free = capacity, running = 0;
    function start(job) {
        free -= job.w;
        running++;
        lockTake(job.t, 1);
        runOne(job.t, job.n).then((r) => {
            free += job.w;
            running--;
            lockTake(job.t, -1);
            const traced = r.traceFile ? readTrace(r.traceFile) : [];
            for (const x of traced) x.writes.forEach(forget);
            const status = r.code === 0 ? 'passed' : r.timedOut ? 'timed out' : 'failed';
            if (status === 'passed') {
                console.log(`  ✓ ${sec(r.ms).padStart(6)}  ${job.t.cmd}`);
                if (r.traceFile && cacheable(job.t) && !(traced.length && record(job.t, traced))) delete store.entries[job.t.cmd];
            } else {
                console.log(`  ✗ ${sec(r.ms).padStart(6)}  ${job.t.cmd}  (${r.timedOut ? `timed out after ${sec(r.limit)}` : `exit ${r.code}`})`);
                delete store.entries[job.t.cmd];
                if (flag('--bail')) bailed = true;
            }
            if (r.traceFile) fs.rmSync(r.traceFile, { force: true });
            results.push({ t: job.t, status, ms: r.ms, code: r.code, out: r.out });
            pump();
        });
    }
    function pump() {
        if (bailed) queue.length = 0;
        for (let i = 0; i < queue.length && free > 0;) {
            const job = queue[i];
            if (job.w <= free && lockFree(job.t)) { queue.splice(i, 1); start(job); continue; }
            if (!lockFree(job.t)) { i++; continue; }
            // A heavy entry that keeps being passed over reserves the slots it needs: stop filling behind it.
            if (++job.waited > capacity * 2) break;
            i++;
        }
        if (!queue.length && running === 0) done();
    }
    pump();
});

const failed = results.filter((r) => r.status === 'failed' || r.status === 'timed out');
if (failed.length) {
    console.log(`\n── ${failed.length} failure${failed.length === 1 ? '' : 's'} ─────────────────────────────`);
    for (const f of failed) {
        const lines = String(f.out || '').trimEnd().split('\n');
        console.log(`\n✗ ${f.t.cmd}  (${f.status === 'timed out' ? 'timed out' : `exit ${f.code}`}, ${sec(f.ms)})${lines.length > 200 ? `  — last 200 of ${lines.length} lines` : ''}`);
        console.log(lines.slice(-200).map((l) => `    ${l}`).join('\n'));
    }
}
const ran = results.filter((r) => r.status !== 'cached');
const cachedN = results.length - ran.length;
const notRun = selected.length - results.length;
const wall = Date.now() - t0;
const testTime = ran.reduce((a, r) => a + r.ms, 0);
console.log(`\n── summary ──\nran ${ran.length} · passed ${ran.length - failed.length} · failed ${failed.length} · cached ${cachedN}${notRun ? ` · not run ${notRun} (--bail)` : ''} · wall ${sec(wall)} · test time ${sec(testTime)} · ${capacity} slot${capacity === 1 ? '' : 's'}`);
const slow = [...ran].sort((a, b) => b.ms - a.ms).slice(0, 10);
if (slow.length > 1) { console.log('slowest:'); for (const r of slow) console.log(`  ${sec(r.ms).padStart(6)}  ${r.t.cmd}`); }

try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    if (TRACE) fs.writeFileSync(STORE_FILE, JSON.stringify(store));
    fs.writeFileSync(path.join(CACHE_DIR, 'durations.json'), `${JSON.stringify({ at: new Date().toISOString(), wallMs: wall, testMs: testTime, capacity, ci: ON_CI, entries: results.map((r) => ({ cmd: r.t.cmd, lane: r.t.lane, status: r.status, ms: r.ms })) }, null, 2)}\n`);
} catch { /* a read-only checkout still gets its result */ }

// The CI summary is an INSTRUMENT, never a gate: the slowest entries and every failure, so growth is visible the week it happens rather than the month after (CI went 118 s → 320 s in four weeks and nothing reported it).
if (process.env.GITHUB_STEP_SUMMARY) {
    const rows = slow.map((r) => `| ${sec(r.ms)} | \`${r.t.cmd}\` |`).join('\n');
    const fails = failed.map((f) => `- ❌ \`${f.t.cmd}\` (${f.status})`).join('\n');
    try { fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### npm test — ${failed.length ? `❌ ${failed.length} failed` : '✅ passed'}\n\nran ${ran.length} · failed ${failed.length} · wall ${sec(wall)} · test time ${sec(testTime)} · ${capacity} slots\n\n${fails ? `${fails}\n\n` : ''}| time | slowest entries |\n|---|---|\n${rows}\n`); } catch { /* summary is optional */ }
}
process.exit(failed.length || notRun ? 1 : 0);
