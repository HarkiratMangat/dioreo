// portal/ui/analytics.js — ESM. The Analytics realm: Health/Usage/Timing over one filterable event river as the Manifest, with revert as its one action.
//
// 🔴 THIS WAS THE LARGEST MOCKUP-VS-LIVE GAP IN THE PORTAL, and it was never a styling gap. The tab shipped as three <pre> blocks holding the raw /bot analytics TEXT exports — the Discord command's own output pasted into a web page. 06-access-and-analytics.html specs a dashboard: a Health/Usage/ Timing switcher, KPI tiles with sparklines, and a filterable event river with kind and source chips. Session A's Phase 1 addendum named the difference correctly: "a missing-dashboard-FEATURE gap, not a missing-style gap — the two are different programs, not one under-styled version of the other." Built at Harkirat's call, 2026-08-23 15:00 EDT.
//
// The river needed NO API change at all: /api/analytics has always returned it as structured JSON and this component was throwing the structure away into a <pre>. Only the tiles needed new data.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell, NoAccess, Masthead } from './shell.js';
import { Manifest } from './manifest.js';
import { fetchJson } from './httpClient.js';

const KIND_LABEL = { change: 'CHANGE', alert: 'ALERT', boot: 'BOOT' };

// Where the event came from, which is the column that makes "one history, two front doors" true rather than asserted: a ChangeLog row written by the portal and one written by /manage are the same kind of thing from different surfaces, and you can only see that if the surface is a column.
function sourceOf(row) {
    if (row.kind !== 'change') return '—';
    return (row.source || row.via || '').toLowerCase() === 'portal' ? 'PORTAL' : 'DISCORD';
}

function summaryOf(row) {
    if (row.kind === 'alert') return row.title || 'Alert';
    if (row.kind === 'boot') return `restarted — ${row.kind_ || row.bootKind || row.version || 'boot'}`;
    return row.summary || row.target || row.action || 'Change';
}

const RIVER_COLUMNS = [
    { key: 'at', label: 'When', dataKind: 'date', render: (r) => new Date(r.at).toISOString().slice(5, 16).replace('T', ' ') },
    { key: 'kind', label: 'Kind', render: (r) => html`<span class=${'kind ' + r.kind}>${KIND_LABEL[r.kind] || r.kind}</span>` },
    { key: 'source', label: 'Source', render: (r) => html`<span class="src">${sourceOf(r)}</span>` },
    { key: 'summary', label: 'What', render: (r) => summaryOf(r) },
    { key: 'actor', label: 'Who', render: (r) => (r.actorId ? String(r.actorId).slice(-6) : 'system') },
];

const RIVER_FILTERS = [
    { key: 'kind', label: 'Kind', options: [
        { value: 'change', label: 'changes' }, { value: 'alert', label: 'alerts' }, { value: 'boot', label: 'boots' },
    ] },
];

// A sparkline of real daily buckets. Deliberately bars rather than an SVG path: the series is seven points, a bar chart reads the shape just as well at 26px, and it needs no viewBox arithmetic that could silently mis-scale. The last bucket is today and takes the accent, matching the mockup.
function Spark({ series = [] }) {
    const max = Math.max(1, ...series);
    return html`
        <div class="spark" aria-hidden="true">
            ${series.map((n, i) => html`<i class=${i === series.length - 1 ? 'tip' : ''} style=${`height:${Math.round((n / max) * 100)}%`}></i>`)}
        </div>
    `;
}

function Kpi({ label, value, sub, tone, series }) {
    return html`
        <div class=${'kpi' + (tone ? ' ' + tone : '')}>
            <h5>${label}</h5>
            <span class="v">${value}</span>
            ${sub ? html`<span class="sub">${sub}</span>` : null}
            ${series ? html`<${Spark} series=${series} />` : null}
        </div>
    `;
}

function fmtUptime(since) {
    if (!since) return '—';
    const secs = Math.max(0, Math.round((Date.now() - new Date(since).getTime()) / 1000));
    const d = Math.floor(secs / 86400), hrs = Math.floor((secs % 86400) / 3600);
    return d ? `${d}d ${hrs}h` : `${hrs}h ${Math.floor((secs % 3600) / 60)}m`;
}

function Health({ health }) {
    const h = health || {};
    return html`
        <div class="panel" id="health">
            <div class="ph">
                <span class="t">Health</span>
                <span class="rt">read from the bot's own records</span>
            </div>
            <div class="kpis">
                <${Kpi} label="Uptime" value=${fmtUptime(h.uptimeSince)} tone="ok"
                        sub=${h.uptimeSince ? `since the last ${h.lastBootKind || 'restart'}${h.lastBootVersion ? ' · ' + h.lastBootVersion : ''}` : 'no boot recorded'} />
                <${Kpi} label="Errors 24h" value=${h.errors24h ?? '—'} tone=${h.errors24h ? 'bad' : 'ok'}
                        sub=${`${h.noise24h ?? 0} lower-level alert${h.noise24h === 1 ? '' : 's'} not counted`}
                        series=${h.spark?.alerts} />
                <${Kpi} label="RAM at last alert"
                        value=${h.rssPeakMb ? h.rssPeakMb + ' MB' : '—'}
                        sub=${h.rssSampleCount ? `highest of ${h.rssSampleCount} sample${h.rssSampleCount === 1 ? '' : 's'} in 7d` : 'no alerts fired in 7 days'} />
                <${Kpi} label="Commands 24h" value=${(h.commands24h ?? 0).toLocaleString()}
                        sub=${`${h.distinctUsers24h ?? 0} distinct users`} series=${h.spark?.commands} />
            </div>
            <div class="srcline">
                <span>SOURCES</span>
                <span>BootRecord · AlertLog · AnalyticsEvent · ChangeLog</span>
                <span class="rt">${h.restarts24h ?? 0} restart${h.restarts24h === 1 ? '' : 's'} in 24h · ${h.restarts7d ?? 0} in 7d</span>
            </div>
            <div class="callout">
                <b>These are the bot's records, not a live reading.</b>
                The portal runs as its own process with no gateway connection, so gateway status and live memory are not
                readable from here. Uptime and restarts are read from the <code>BootRecord</code> collection; errors and
                the memory figure come from the <code>AlertLog</code> collection. For a live reading, run the
                <code>/bot analytics</code> command in Discord.
            </div>
        </div>
    `;
}

function MetricsPanel({ title, text, stats }) {
    return html`
        <div class="panel metrics">
            <div class="ph"><span class="t">${title}</span>${stats ? html`<span class="rt">${stats}</span>` : null}</div>
            ${text ? html`<pre>${text}</pre>` : html`<p class="empty">Nothing recorded in this window.</p>`}
        </div>
    `;
}

export function AnalyticsRealm({ session }) {
    const [data, setData] = useState({ river: [], usage: '', timing: '', alerts: '', health: null, usageStats: null, timingStats: null });
    const [view, setView] = useState('Health');
    useEffect(() => { fetchJson('/api/analytics').then(setData); }, []);

    if (data.signedOut || data.forbidden) return html`<${NoAccess} />`;

    async function revert(changeId) {
        await fetchJson(`/api/revert/${changeId}`, { method: 'POST', headers: { 'x-csrf-token': session.csrfToken } });
        fetchJson('/api/analytics').then(setData);
    }

    // The row dot carries the event's KIND, matching its chip. Left ungated it rendered 100 identical grey squares, which is a column of noise -- colour has to mean something or it should not be drawn. --patch/--warn/--ret are the same three signals the chips use, so the dot and the chip never disagree.
    const KIND_VAR = { change: '--patch', alert: '--warn', boot: '--ret' };
    const rows = data.river.map(r => ({ ...r, id: r.changeId || r.alertId || r._id, state: 'live', topicVar: KIND_VAR[r.kind], summary: summaryOf(r), source: sourceOf(r), actor: r.actorId || 'system' }));
    const h = data.health || {};
    const usage = data.usageStats || {};

    const viewSlot = view === 'Health'
        ? html`<${Health} health=${data.health} />`
        : view === 'Usage'
            ? html`<${MetricsPanel} title="Usage — last 7 days" text=${data.usage}
                                    stats=${usage.current != null ? `${usage.current.toLocaleString()} this week · ${(usage.previous ?? 0).toLocaleString()} the week before` : null} />`
            : html`<${MetricsPanel} title="Timing — last 7 days" text=${data.timing} />
                   <${MetricsPanel} title="Alerts" text=${data.alerts} />`;

    return html`
        <${Shell} realm="analytics" session=${session} view=${view} viewOptions=${['Health', 'Usage', 'Timing']} onSetView=${setView}
                  masthead=${html`<${Masthead} title="Analytics" sub="read-only — nothing here is re-derived"
                                               stats=${[
                                                   { value: fmtUptime(h.uptimeSince), label: 'uptime' },
                                                   { value: h.errors24h ?? 0, label: 'errors 24h', tone: h.errors24h ? 'bad' : undefined },
                                                   { value: (h.commands24h ?? 0).toLocaleString(), label: 'commands 24h' },
                                               ]} />`}
                  viewSlot=${viewSlot}
                  manifestSlot=${html`<${Manifest} rows=${rows} columns=${RIVER_COLUMNS} searchableFields=${['summary', 'title', 'actor']}
                                                    title="One history, both front doors" filterGroups=${RIVER_FILTERS}
                                                    headerRight="Alerts, changes and boots are all events — filtering one stream beats switching between four lists."
                                                    emptyText="No changes, alerts or restarts have been recorded yet."
                                                    bulkActions=${[{ label: 'Revert', danger: true, onClick: (ids) => ids.forEach(revert) }]} />`} />
    `;
}
