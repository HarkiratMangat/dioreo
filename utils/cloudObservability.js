// ==========================================
// CLOUD OBSERVABILITY -- Cloud Logging/Monitoring reads via Application Default Credentials
// ==========================================
// Observability layer stage 4: docs/superpowers/specs/2026-08-16-observability-layer-design.md §6. The premise the design closed: docs/ROADMAP.md line 49 had gated an admin `/status` command since 2026-07-20 on "the service account can write logs and not read them back" -- measured FALSE on 2026-08-16 10:18 EDT. VM `diors-builds-bot` runs as the Compute default service account with `roles/editor`, which already includes `logging.logEntries.list`, `logging.logEntries.download`, `logging.logs.list` and `monitoring.timeSeries.list`. No role broadening needed.
//
// ⚠️ THIS PORTS scripts/vmpeaks.sh's QUERIES, NOT ITS TRANSPORT. That script runs from the Mac and authenticates via `gcloud auth print-access-token`; this module runs INSIDE the bot process and authenticates via google-auth-library's Application Default Credentials -- on the VM in prod that resolves to the instance's own service account with no key file anywhere, and on a developer Mac it resolves to whatever `gcloud auth application-default login` last set up (separate from `gcloud auth login`, which only vmpeaks.sh's print-access-token path needs). Same REST endpoints, same filters, same windows as vmpeaks.sh where panel space allows -- see PROJECT/ZONE/VM below, which are the exact constants that script hardcodes.
//
// ⚠️ THIS MODULE MUST NEVER THROW PAST ITS OWN BOUNDARY. A Health page that crashes because Cloud Monitoring was unreachable is strictly worse than one that says so in a line of text -- the whole point of the panel design's plain-language-verdict rule. Every exported function below catches its own failure and returns `{ available: false, error }` rather than rejecting.
//
// Results are cached for CACHE_TTL_MS (60s, matching the design's "the page defers and caches its result -- 60s is ample") so repeated panel opens/switches don't each pay the ~1-3 GCP API round trips this needs. One cache entry, not per-window -- Health renders all windows together or not at all.

const { GoogleAuth } = require('google-auth-library');

const PROJECT = 'gen-lang-client-0549308254';
const ZONE = 'us-east1-b';
const VM = 'diors-builds-bot';
const CACHE_TTL_MS = 60000;
const HTTP_TIMEOUT_MS = 8000;   // Health must never hang the panel waiting on a slow GCP response

// Trimmed from vmpeaks.sh's five windows (12h/24h/72h/7d/30d) to three -- the panel design rule ("dead space beats density") means Health shows the windows that answer "is something wrong right now" (24h) and "is it getting worse" (7d/30d), not every window the CLI script offers for deep investigation. scripts/vmpeaks.sh remains the full-fidelity tool for that.
const WINDOWS = [
    { label: '24h', seconds: 86400 },
    { label: '7d', seconds: 604800 },
    { label: '30d', seconds: 2592000 },
];

let authClient = null;
function getAuth() {
    if (!authClient) authClient = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    return authClient;
}

async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

async function bearerHeaders() {
    // Raced against HTTP_TIMEOUT_MS (v3-pre-release review, finding #33) -- ADC token acquisition previously sat OUTSIDE fetchWithTimeout entirely, so a wedged metadata server or a hung local `gcloud` refresh could hang this indefinitely -- defeating this module's own header rules ("MUST NEVER THROW PAST ITS OWN BOUNDARY", "Health must never hang the panel"). Every caller already expects a bounded call that resolves or rejects.
    const timeout = new Promise((_, reject) => {
        const t = setTimeout(() => reject(new Error(`ADC token acquisition timed out after ${HTTP_TIMEOUT_MS}ms`)), HTTP_TIMEOUT_MS);
        if (typeof t.unref === 'function') t.unref();
    });
    const acquire = (async () => {
        const client = await getAuth().getClient();
        const token = await client.getAccessToken();
        return { Authorization: `Bearer ${token.token || token}` };
    })();
    return Promise.race([acquire, timeout]);
}

// The VM's own numeric instance id -- Cloud Monitoring's `resource.label.instance_id` filter needs this, not the instance NAME. On GCE, the metadata server answers this with no auth and near-zero latency; that path is tried first and is what prod actually uses. The Compute API fallback is for a developer Mac, which has no metadata server, and costs one extra authenticated call the VM never pays.
let cachedInstanceId = null;
async function getInstanceId() {
    if (cachedInstanceId) return cachedInstanceId;
    try {
        const res = await fetchWithTimeout('http://metadata.google.internal/computeMetadata/v1/instance/id', {
            headers: { 'Metadata-Flavor': 'Google' },
        });
        if (res.ok) {
            cachedInstanceId = (await res.text()).trim();
            return cachedInstanceId;
        }
    } catch { /* not running on GCE -- fall through to the Compute API */ }
    const headers = await bearerHeaders();
    const res = await fetchWithTimeout(
        `https://compute.googleapis.com/compute/v1/projects/${PROJECT}/zones/${ZONE}/instances/${VM}`,
        { headers },
    );
    if (!res.ok) throw new Error(`Compute API describe failed: ${res.status}`);
    const body = await res.json();
    cachedInstanceId = String(body.id);
    return cachedInstanceId;
}

// Pure. Exported for scripts/cloudObservability.test.js. Mirrors vmpeaks.sh's peak()/rampeak() value extraction (max doubleValue across all points/series in the window) without the shell/jq layer.
function extractPeak(timeSeriesResponse) {
    const series = timeSeriesResponse?.timeSeries;
    if (!Array.isArray(series) || !series.length) return null;
    let max = null;
    for (const s of series) {
        for (const p of s.points || []) {
            const v = p?.value?.doubleValue;
            if (typeof v === 'number' && (max === null || v > max)) max = v;
        }
    }
    return max;
}

async function queryPeak(metricType, extraFilter, instanceId, windowSeconds) {
    const headers = await bearerHeaders();
    const end = new Date();
    const start = new Date(end.getTime() - windowSeconds * 1000);
    const params = new URLSearchParams({
        filter: `metric.type="${metricType}" AND resource.label.instance_id="${instanceId}"${extraFilter}`,
        'interval.startTime': start.toISOString(),
        'interval.endTime': end.toISOString(),
        'aggregation.alignmentPeriod': `${windowSeconds}s`,
        'aggregation.perSeriesAligner': 'ALIGN_MAX',
    });
    const res = await fetchWithTimeout(
        `https://monitoring.googleapis.com/v3/projects/${PROJECT}/timeSeries?${params}`,
        { headers },
    );
    if (!res.ok) throw new Error(`Cloud Monitoring query failed: ${res.status}`);
    return extractPeak(await res.json());
}

// CPU peaks are always available (GCE hypervisor-level metric, no agent needed). RAM peaks need the guest-level Ops Agent (installed 2026-07-17 per scripts/vmpeaks.sh's own header) -- a null RAM value for a window newer than the agent install is "no data yet," not a failure, same as that script.
async function computeCloudPeaks() {
    const instanceId = await getInstanceId();
    const cpu = {};
    const ram = {};
    for (const w of WINDOWS) {
        const [c, r] = await Promise.all([
            queryPeak('compute.googleapis.com/instance/cpu/utilization', '', instanceId, w.seconds).catch(() => null),
            queryPeak('agent.googleapis.com/memory/percent_used', ' AND metric.label.state="used"', instanceId, w.seconds).catch(() => null),
        ]);
        cpu[w.label] = c === null ? null : Math.round(c * 1000) / 10;   // fraction -> % to 1dp
        ram[w.label] = r === null ? null : Math.round(r * 10) / 10;     // already 0-100
    }
    return { cpu, ram };
}

// Cloud Logging entries at severity>=ERROR in the last 24h -- the "what actually happened" half of the three-tier error model (see buildHealthBody() in commands/bot.js, which combines this with getAlertSummary()'s "what was announced" half). Counted by paging entries.list rather than a log-based metric, since none is configured -- capped at LOG_COUNT_CAP pages so a genuinely bad day can't turn a 60s-cached Health render into an unbounded API crawl.
const LOG_COUNT_CAP = 500;
async function countRecentErrorLogs(sinceMs) {
    const headers = { ...(await bearerHeaders()), 'Content-Type': 'application/json' };
    const since = new Date(Date.now() - sinceMs).toISOString();
    let count = 0;
    let pageToken;
    let truncated = false;
    do {
        const res = await fetchWithTimeout('https://logging.googleapis.com/v2/entries:list', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                resourceNames: [`projects/${PROJECT}`],
                filter: `resource.type="gce_instance" AND resource.labels.instance_id="${await getInstanceId()}" AND severity>=ERROR AND timestamp>="${since}"`,
                orderBy: 'timestamp desc',
                pageSize: 100,
                pageToken,
            }),
        });
        if (!res.ok) throw new Error(`Cloud Logging query failed: ${res.status}`);
        const body = await res.json();
        count += (body.entries || []).length;
        pageToken = body.nextPageToken;
        if (count >= LOG_COUNT_CAP) { truncated = true; break; }
    } while (pageToken);
    return { count, truncated };
}

let cache = null;   // { expiresAt, data }
async function getHealthCloudStats() {
    if (cache && cache.expiresAt > Date.now()) return cache.data;
    try {
        const [peaks, errors24h] = await Promise.all([
            computeCloudPeaks(),
            countRecentErrorLogs(24 * 3600 * 1000),
        ]);
        const data = { available: true, peaks, errors24h: errors24h.count, errors24hTruncated: errors24h.truncated };
        cache = { expiresAt: Date.now() + CACHE_TTL_MS, data };
        return data;
    } catch (err) {
        // Not cached on failure -- a transient auth/network blip should be retried on the very next panel open rather than showing "unavailable" for a full minute after the cause cleared.
        const data = { available: false, error: err?.message || String(err) };
        return data;
    }
}

module.exports = {
    getHealthCloudStats,
    // pure, exported for scripts/cloudObservability.test.js
    extractPeak,
    // constants worth asserting on / overriding in tests
    PROJECT, ZONE, VM, CACHE_TTL_MS, WINDOWS, LOG_COUNT_CAP,
};
