// Structured logging + severity tagging.
//
// WHY THIS EXISTS (2026-07-28 15:34 EDT): before this module, `scripts/vmstatus.sh` could not produce a trustworthy error count, and the reason was structural rather than a bug in the script. The bot wrote everything to stdout, so journald tagged EVERY line priority 6 (info) -- measured on the VM, p0-p5 were all zero across 24h while p6 held all 30 entries. `journalctl -p err` therefore read 0 during a healthy hour AND would have read 0 during a crash. The script compensated by grepping the TEXT of every line for /error|10062|unhandled|disconnect|reconnecting/, which then counted routine `🔌 Shard 0 reconnecting...` gateway churn as errors -- that is exactly the "script says errors(1h)=1 but journalctl -p err says 0" discrepancy that had been noticed and never explained.
//
// Two sinks, deliberately:
//   1. journald (human) -- console output, unchanged in shape, but error/warn lines now carry a systemd severity prefix so `journalctl -p err` becomes meaningful.
//   2. a newline-delimited JSON file (machine) -- tailed by the Google Cloud Ops Agent, which is ALREADY installed and running on the VM (~127MB RSS) and was shipping unparsed text nobody queried. Structured entries give Cloud Logging real severity plus the running version/commit on every single line, which is what makes `vmstatus.sh logs <window>` able to answer "when did this happen and what code produced it".
//
// Both sinks are best-effort and fully guarded: a logging failure must never affect the bot. That is the same principle alertStore.recordAlert() follows -- observability is never allowed to become an outage.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { getContext } = require('./requestContext');

// systemd sets JOURNAL_STREAM on a service whose stdout/stderr go to the journal. It is the precise "am I running under systemd" test -- better than NODE_ENV, which the dev bot also sets and which says nothing about where output actually lands. Locally (dev bot, `node index.js` in a terminal) this is unset, so no prefixes are emitted and the terminal stays clean.
const UNDER_JOURNALD = Boolean(process.env.JOURNAL_STREAM);

// systemd's SyslogLevelPrefix (default `yes`, confirmed active on the diors-bot unit) reads a leading `<N>` on each line and strips it, recording that syslog priority. VERIFIED LIVE on the VM 2026-07-28 15:20 EDT via a throwaway systemd-run unit: `<3>` -> PRIORITY 3, `<4>` -> PRIORITY 4, unprefixed -> PRIORITY 6. The marker never appears in journalctl output. `log` is deliberately absent from this map: info is journald's default, so it needs no prefix.
const PRIO = { error: '<3>', warn: '<4>' };

const REPO_ROOT = path.join(__dirname, '..');
const LOG_FILE = process.env.DIORS_LOG_FILE || path.join(REPO_ROOT, 'logs', 'app.log');

// Only write the JSON sink in the environment that has something tailing it. Creating a growing file on a dev machine that nothing reads is pure litter.
const FILE_SINK_ENABLED = UNDER_JOURNALD && process.env.DIORS_LOG_FILE !== 'off';

const { version: VERSION } = require('../package.json');

// The commit the running process was actually deployed from. Resolved once at require time from the git call -- the fallback for a plain `node index.js` on the VM. DIORS_COMMIT is checked first but is NOT currently set by anything (verified 2026-08-20 11:47 EDT: not deploy.sh, not the systemd unit, nowhere in the tree) -- it is read defensively in case that changes, not because it does today. ⚠️ It is `let`, not `const`, ONLY because of hotpatch (2026-08-20 11:47 EDT): a swapped module means the process is no longer running the commit it booted from, and this file can never reload itself to notice (index.js requires it, so utils/hotpatch.js classifies it REFUSE_STRUCTURAL forever). utils/hotpatch.js calls noteHotpatch() so the journal, the boot banner's successors and Cloud Error Reporting's serviceContext keep naming the code that is ACTUALLY running. Nothing else may write to it.
let COMMIT = (() => {
    if (process.env.DIORS_COMMIT) return process.env.DIORS_COMMIT.slice(0, 7);
    try {
        return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
            cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000,
        }).trim();
    } catch {
        return 'unknown'; // never fatal — a missing commit degrades the display, nothing more
    }
})();

function noteHotpatch(commit) {
    if (typeof commit === 'string' && commit.trim()) COMMIT = commit.trim().slice(0, 7);
}
// A GETTER, deliberately. `module.exports.COMMIT` froze the boot value at require time, so every caller reading that property would keep seeing it after a hotpatch. utils/hotpatch.js reads this.
function currentCommit() { return COMMIT; }

let fileStream = null;
if (FILE_SINK_ENABLED) {
    try {
        fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
        // 'a' + no explicit flush: Node's WriteStream buffers, which is fine — the Ops Agent tails the file continuously, and losing the last few buffered lines on a hard kill is an acceptable trade for not doing a synchronous disk write on every log call in the interaction hot path.
        fileStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
        // A stream error (disk full, permissions) must not raise an unhandled 'error' event, which would hit index.js's uncaughtException net and alert-spam for a purely cosmetic failure.
        fileStream.on('error', () => { fileStream = null; });
    } catch {
        fileStream = null;
    }
}

// console.error/.warn accept printf-style varargs and arbitrary objects. util.format is what console itself uses, so formatting through it keeps the JSON sink's text byte-identical to the journal's.
const { format } = require('util');

// Google Cloud Error Reporting (enabled 2026-08-06 15:52 EDT) reads Cloud Logging directly — there is no SDK in this process and no extra network call. It treats a log entry as an error event when the entry is severity ERROR **and** carries a `serviceContext`, and it GROUPS those events by parsing the stack trace out of `message`. Without `serviceContext` the entries are ordinary logs and Error Reporting ignores them entirely, so this object is the whole integration.
//
// `service` is the grouping key across restarts and deploys; `version` is what turns the dashboard's "resolved / regressed" and per-release breakdown into something real — it is the package version, which matches the git tag, so an error can be pinned to a release without correlating timestamps.
//
// ⚠️ ERROR ONLY, deliberately. Error Reporting acts on severity >= ERROR, so attaching this to INFO and WARNING entries would add bytes to every line of the sink and change nothing. WARNING stays a log. ⚠️ Grouping quality depends on `message` containing a real stack trace. `console.error(err)` gives one (util.format renders an Error as its stack); `console.error('some string')` does not, and those arrive as an un-grouped single-frame event. That is acceptable and expected — it is not a reason to start stringifying errors differently at the ~60 call sites.
const SERVICE_CONTEXT = { service: 'dioreo-bot', version: VERSION };

// Attribution (stage 1 of the observability layer, 2026-08-16 — see docs/superpowers/specs/2026-08-16-observability-layer-design.md §4). Every structured entry gets a stack-derived `component` (which FILE actually logged, regardless of who called it) plus either the interaction context (what the user was doing, from utils/requestContext.js) or a `lifecycle` tag for the boot/heartbeat/gateway/Cloudinary-cleanup paths that run with no interaction in scope.
//
// ⚠️ Error.stackTraceLimit is CLAMPED during capture, deliberately. V8's stack-capture cost scales with the limit, and this fires on every single console call once patched — a hot loop (scripts/ bulkCacheCollectibles.js's 925-item run) must not pay for more frames than are actually needed to skip past this module's own call sites and land on the real caller. 5 is enough: writeStructured's own frame, the console[method] wrapper's frame, and 1-2 to spare for an intermediate wrapper.
function captureComponent() {
    const prevLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = 5;
    let stack;
    try {
        stack = new Error().stack;
    } finally {
        Error.stackTraceLimit = prevLimit;
    }
    if (!stack) return null;
    for (const rawLine of stack.split('\n').slice(1)) {
        // V8 frame shapes: "at foo (/path/to/file.js:10:5)" or bare "at /path/to/file.js:10:5". The repo lives under a path containing a space ("Claude Code"), so the file-path portion cannot be isolated with a character-class exclusion (an earlier version tried `[^():\s]+` and matched nothing, ever, in this checkout) -- anchoring on the LAST "(" (or "at " when there is none) is what correctly separates the function-name prefix from the path itself.
        const line = rawLine.trim();
        const paren = line.lastIndexOf('(');
        const inner = paren !== -1 ? line.slice(paren + 1).replace(/\)\s*$/, '') : line.replace(/^at\s+/, '');
        const match = inner.match(/^(.+):(\d+):(\d+)$/);
        if (!match) continue;
        const filePath = match[1];
        if (!filePath.endsWith('.js')) continue; // node:internal frames, eval wrappers, etc.
        // Skip this module's own frames (writeStructured + the console[method] wrapper below) so the reported component is the real caller, not the logger patching console in the first place.
        if (filePath === __filename) continue;
        if (!filePath.startsWith(REPO_ROOT)) continue; // node_modules / outside-repo frames
        return path.basename(filePath, '.js');
    }
    return null;
}

function writeStructured(severity, text) {
    if (!fileStream) return;
    try {
        const ctx = getContext();
        const component = captureComponent();
        // Cloud Logging's LogEntry shape: `severity` and `timestamp` are lifted into real LogEntry fields by the Ops Agent's modify_fields processor; everything else stays in jsonPayload. `version`/`commit` on EVERY entry is the point — it means a log line from six weeks ago still says which code produced it, without correlating against restart boundaries.
        fileStream.write(JSON.stringify({
            timestamp: new Date().toISOString(),
            severity,
            message: text,
            ...(component ? { component } : {}),
            // No live interaction context (heartbeat, boot, gateway diagnostics, Cloudinary cleanup) — these are exactly the lines that matter most when the bot is unhealthy, so a `lifecycle` tag is the deliberate default rather than leaving the record unlabelled.
            ...(ctx ? { interactionId: ctx.interactionId, command: ctx.command, handler: ctx.handler, userHash: ctx.userHash } : { context: 'lifecycle' }),
            version: VERSION,
            commit: COMMIT,
            ...(severity === 'ERROR' ? { serviceContext: SERVICE_CONTEXT } : {}),
        }) + '\n');
    } catch { /* best-effort: never let a log write surface */ }
}

// Patch console rather than rewriting ~60 call sites across the tree. Two reasons this is the right call and not laziness: (1) it cannot MISS a site, including ones added later and ones in third-party code paths that log through console; (2) the alternative is a sprawling mechanical diff across the whole codebase whose only content is an import change, which is far harder to review for an actual behavioural regression. The patch is additive — original console behaviour is preserved exactly, we only prepend a marker journald strips, and tee a copy to the JSON sink.
function patchConsole() {
    for (const [method, severity] of [['error', 'ERROR'], ['warn', 'WARNING'], ['log', 'INFO']]) {
        const original = console[method];
        console[method] = (...args) => {
            let text;
            try { text = format(...args); } catch { text = String(args[0]); }
            writeStructured(severity, text);

            const prefix = UNDER_JOURNALD ? PRIO[method] : undefined;
            if (!prefix) return original(...args); // console.log, or running locally — untouched

            // Prefix EVERY line, not just the first. journald applies SyslogLevelPrefix per line, so a multi-line Error stack would otherwise land with only its first line at priority 3 and every stack frame at 6 — which would leave `-p err` showing a headless error.
            return original(text.split('\n').map(l => prefix + l).join('\n'));
        };
    }
}

// One line at startup, and the anchor for per-line attribution in vmstatus.sh: every journal line after this marker (and before the next one) was produced by this version/commit. The JSON sink carries version/commit inline so it doesn't need the marker, but journald — the fallback source — does, and this is what makes the fallback path able to answer the same question.
function logBootBanner() {
    console.log(`🏷️ diors-builds v${VERSION} · ${COMMIT} · node ${process.version} · pid ${process.pid}`);
}

module.exports = { patchConsole, logBootBanner, VERSION, COMMIT, LOG_FILE, noteHotpatch, currentCommit };
