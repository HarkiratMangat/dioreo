// scripts/lib/traceInputs.cjs — record every file a node process reads, lists and writes, so the test runner can skip a test whose real inputs have not changed.
//
// Added 2026-09-14 18:52 EDT with scripts/testRunner.mjs. Loaded as a preload (NODE_OPTIONS=--require) and inert unless TEST_TRACE_OUT names a file; each process appends one JSON line at exit. Child node processes inherit NODE_OPTIONS, and a child spawned with its own `env` gets the two variables injected, so a test's subprocesses are traced too.
//
// 🔴 WHY TRACE INSTEAD OF A HAND-WRITTEN MAP. A map of "this test depends on these paths" is a second copy of facts the code already states, and it rots silently: portalStates.mjs's own PORTAL_TOUCHED list counted every mockup folder as an input when the build reads exactly one, so a docs PR paid for a 60-second walk it could not affect. A trace is what the test actually opened, this run.
//
// ⚠️ WHAT IT CANNOT SEE, stated so nobody trusts it past its frame: files read by a NON-node process (bash, git, grep, Chrome), the clock, environment variables and the network. The runner answers the first by refusing to cache a shell-shaped entry without declared inputs, and git by keying a git-running entry on HEAD, both base refs and the tag list. The rest is why CI never uses this cache — CI runs everything, every time (Harkirat, 2026-09-14).
'use strict';

const OUT = process.env.TEST_TRACE_OUT;
if (OUT) {
    const fs = require('fs');
    const path = require('path');
    const Module = require('module');
    const cp = require('child_process');
    const { fileURLToPath } = require('url');
    const appendFileSync = fs.appendFileSync;
    const existsSync = fs.existsSync;
    const reads = new Set(), dirs = new Set(), writes = new Set(), gitCwds = new Set();

    const abs = (p) => {
        try {
            if (p == null || typeof p === 'number') return null;
            if (p instanceof URL) return path.resolve(fileURLToPath(p));
            const s = Buffer.isBuffer(p) ? p.toString() : String(p);
            return path.resolve(s.startsWith('file:') ? fileURLToPath(s) : s);
        } catch { return null; }
    };
    const R = (p) => { const a = abs(p); if (a) reads.add(a); };
    const D = (p) => { const a = abs(p); if (a) dirs.add(a); };
    const W = (p) => { const a = abs(p); if (a) writes.add(a); };
    const wrap = (obj, name, note) => {
        const orig = obj && obj[name];
        if (typeof orig !== 'function') return;
        obj[name] = function (...args) { try { note(args); } catch { /* tracing must never break the test */ } return orig.apply(this, args); };
    };
    const writeFlag = (f) => (typeof f === 'string' ? /[wa+]/.test(f) : typeof f === 'number' ? (f & (fs.constants.O_WRONLY | fs.constants.O_RDWR | fs.constants.O_CREAT)) !== 0 : false);

    for (const n of ['readFileSync', 'statSync', 'lstatSync', 'existsSync', 'accessSync', 'realpathSync', 'readlinkSync', 'createReadStream', 'readFile', 'stat', 'lstat', 'access', 'exists', 'realpath']) wrap(fs, n, (a) => R(a[0]));
    for (const n of ['readdirSync', 'readdir', 'opendirSync', 'opendir']) wrap(fs, n, (a) => D(a[0]));
    for (const n of ['openSync', 'open']) wrap(fs, n, (a) => (writeFlag(a[1]) ? W(a[0]) : R(a[0])));
    for (const n of ['writeFileSync', 'appendFileSync', 'mkdirSync', 'rmSync', 'rmdirSync', 'unlinkSync', 'truncateSync', 'utimesSync', 'chmodSync', 'symlinkSync', 'createWriteStream', 'writeFile', 'appendFile', 'mkdir', 'rm', 'rmdir', 'unlink']) wrap(fs, n, (a) => W(a[0]));
    for (const n of ['copyFileSync', 'copyFile', 'cpSync', 'cp']) wrap(fs, n, (a) => { R(a[0]); W(a[1]); });
    for (const n of ['renameSync', 'rename']) wrap(fs, n, (a) => { W(a[0]); W(a[1]); });
    const P = fs.promises;
    for (const n of ['readFile', 'stat', 'lstat', 'access', 'realpath']) wrap(P, n, (a) => R(a[0]));
    for (const n of ['readdir', 'opendir']) wrap(P, n, (a) => D(a[0]));
    wrap(P, 'open', (a) => (writeFlag(a[1]) ? W(a[0]) : R(a[0])));
    for (const n of ['writeFile', 'appendFile', 'mkdir', 'rm', 'rmdir', 'unlink']) wrap(P, n, (a) => W(a[0]));
    for (const n of ['copyFile', 'cp']) wrap(P, n, (a) => { R(a[0]); W(a[1]); });
    wrap(P, 'rename', (a) => { W(a[0]); W(a[1]); });
    // An ESM `import { readFileSync } from 'fs'` binds to a snapshot of the builtin's exports; this refreshes the snapshot with the wrappers above.
    try { Module.syncBuiltinESMExports(); } catch { /* older node */ }

    // Module resolution. `module.registerHooks` sees ESM imports AND require; `_resolveFilename` sees only require, so it is the fallback, never the default.
    if (typeof Module.registerHooks === 'function') {
        Module.registerHooks({ resolve(specifier, context, next) { const r = next(specifier, context); if (r && typeof r.url === 'string' && r.url.startsWith('file:')) R(r.url); return r; } });
    } else {
        const orig = Module._resolveFilename;
        Module._resolveFilename = function (...a) { const r = orig.apply(this, a); if (path.isAbsolute(r)) R(r); return r; };
    }

    // Child processes: note git (its reads are invisible here, so the runner keys on refs instead), note file arguments (a `bash hook.sh` reads hook.sh), and keep tracing alive in a child given its own env.
    const PRELOAD = process.env.NODE_OPTIONS || '';
    const noteChild = (file, argv, options) => {
        const cwd = abs((options && options.cwd) || process.cwd()) || process.cwd();
        const words = [String(file || ''), ...(Array.isArray(argv) ? argv.map(String) : [])];
        if (words.some((w) => path.basename(w) === 'git') || /(^|[;&|(]\s*)git\s/.test(words.join(' '))) gitCwds.add(cwd);
        for (const w of words.slice(1)) {
            if (w && !w.startsWith('-') && w.length < 1024 && !w.includes('\n')) { const a = path.resolve(cwd, w); if (existsSync(a)) reads.add(a); }
        }
        if (options && options.env && !options.env.TEST_TRACE_OUT) {
            options.env = { ...options.env, TEST_TRACE_OUT: OUT, NODE_OPTIONS: `${options.env.NODE_OPTIONS ? `${options.env.NODE_OPTIONS} ` : ''}${PRELOAD}`.trim() };
        }
    };
    const optsAt = (a, i) => (a[i] && typeof a[i] === 'object' && !Array.isArray(a[i]) ? a[i] : null);
    for (const n of ['spawn', 'spawnSync', 'execFile', 'execFileSync', 'fork']) wrap(cp, n, (a) => noteChild(a[0], Array.isArray(a[1]) ? a[1] : [], Array.isArray(a[1]) ? optsAt(a, 2) : optsAt(a, 1)));
    for (const n of ['exec', 'execSync']) wrap(cp, n, (a) => noteChild('sh', ['-c', ...String(a[0]).split(/\s+/)], optsAt(a, 1)));

    process.on('exit', () => {
        try { appendFileSync(OUT, `${JSON.stringify({ pid: process.pid, reads: [...reads], dirs: [...dirs], writes: [...writes], git: [...gitCwds] })}\n`); } catch { /* an unwritable trace makes the entry uncacheable, never failed */ }
    });
}
