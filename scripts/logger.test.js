// scripts/logger.test.js
// Regression test for utils/logger.js's structured sink, specifically the Cloud Error Reporting
// contract added 2026-08-06 15:52 EDT. Run: `node scripts/logger.test.js` (also via `npm test`).
//
// ⚠️ WHY THIS EXISTS. Error Reporting is a SILENT integration: there is no SDK, no client, no call
// that can fail. It reads Cloud Logging and treats an entry as a groupable error event only when the
// entry is severity ERROR **and** carries `serviceContext`. Delete that one object and nothing breaks,
// nothing logs, no test fails, the dashboard simply goes quiet forever — and a quiet error dashboard
// is indistinguishable from a healthy one. That is the exact failure shape this project has already
// paid for twice (six hook self-tests nothing invoked; a `-p err` counter structurally stuck at 0).
// So the contract gets asserted here rather than trusted.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

let pass = 0; const failures = [];
function t(name, fn) {
    try { fn(); pass++; console.log(`  PASS  ${name}`); }
    catch (e) { failures.push([name, e.message]); console.log(`  FAIL  ${name}\n        ${e.message}`); }
}

// The sink only writes under journald (see FILE_SINK_ENABLED), so the harness sets JOURNAL_STREAM and
// points DIORS_LOG_FILE at a temp file, then reads back what was actually written. Asserting on the
// emitted BYTES rather than on the module's internals is the point — Error Reporting sees the bytes.
function emit(lines) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dioreo-log-'));
    const file = path.join(dir, 'app.log');
    const res = require('child_process').spawnSync(process.execPath, ['-e', `
        const { patchConsole } = require(${JSON.stringify(path.join(__dirname, '..', 'utils', 'logger.js'))});
        patchConsole();
        ${lines}
    `], { env: { ...process.env, JOURNAL_STREAM: '1', DIORS_LOG_FILE: file }, encoding: 'utf8' });
    if (res.status !== 0) throw new Error(`child exited ${res.status}: ${res.stderr}`);
    const out = fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
    fs.rmSync(dir, { recursive: true, force: true });
    return out;
}

console.log('logger.js — structured sink + Error Reporting contract');

t('an ERROR entry carries serviceContext', () => {
    const [e] = emit(`console.error(new Error("boom"));`);
    assert.strictEqual(e.severity, 'ERROR');
    assert.ok(e.serviceContext, 'ERROR entries MUST carry serviceContext or Error Reporting ignores them');
    assert.ok(e.serviceContext.service, 'service is the grouping key');
    assert.ok(e.serviceContext.version, 'version drives per-release tracking and regression detection');
});

t('serviceContext.version matches package.json', () => {
    // Not cosmetic: this is what ties an error group to a release, and the release to a git tag.
    const pkg = require('../package.json');
    const [e] = emit(`console.error(new Error("boom"));`);
    assert.strictEqual(e.serviceContext.version, pkg.version);
});

t('an ERROR from an Error object keeps its STACK in message', () => {
    // Error Reporting groups by parsing the stack out of `message`. A message with no stack still
    // reports, but as an ungrouped one-off — so losing the stack silently degrades the whole feature.
    const [e] = emit(`console.error(new Error("boom"));`);
    assert.match(e.message, /Error: boom/);
    assert.ok(e.message.split('\n').length > 1, 'expected multiple stack frames in message');
    assert.match(e.message, /at /, 'expected at least one "at <frame>" line');
});

t('WARNING and INFO do NOT carry serviceContext', () => {
    // Error Reporting acts on severity >= ERROR only, so attaching it lower down would add bytes to
    // every line of the sink and change nothing.
    const out = emit(`console.warn("w"); console.log("i");`);
    const warn = out.find(e => e.severity === 'WARNING');
    const info = out.find(e => e.severity === 'INFO');
    assert.ok(warn && !warn.serviceContext, 'WARNING must not carry serviceContext');
    assert.ok(info && !info.serviceContext, 'INFO must not carry serviceContext');
});

t('every entry still carries version + commit', () => {
    // The pre-existing v2.41.0 contract, asserted here so the Error Reporting change cannot regress it.
    const out = emit(`console.error(new Error("boom")); console.log("i");`);
    for (const e of out) {
        assert.ok(e.version, 'every entry carries the running version');
        assert.ok(e.commit, 'every entry carries the running commit');
        assert.ok(e.timestamp, 'every entry carries a timestamp');
    }
});

t('the sink stays OFF when not under journald', () => {
    // Creating a growing file on a dev machine that nothing tails is litter — and it would also mean
    // local runs quietly shipping entries into the same shape prod uses.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dioreo-log-'));
    const file = path.join(dir, 'app.log');
    const env = { ...process.env, DIORS_LOG_FILE: file };
    delete env.JOURNAL_STREAM;
    require('child_process').spawnSync(process.execPath, ['-e', `
        const { patchConsole } = require(${JSON.stringify(path.join(__dirname, '..', 'utils', 'logger.js'))});
        patchConsole(); console.error(new Error("boom"));
    `], { env, encoding: 'utf8' });
    assert.ok(!fs.existsSync(file), 'no sink file should be created outside journald');
    fs.rmSync(dir, { recursive: true, force: true });
});

console.log(`\n  ${pass} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
