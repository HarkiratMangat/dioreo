// portal/ui/analytics.js — ESM. The Analytics realm: Health/Usage/Timing over one filterable event river as the Manifest, with revert as its one action.
//
// 🔴 THIS WAS THE LARGEST MOCKUP-VS-LIVE GAP IN THE PORTAL, and it was never a styling gap. The tab shipped as three <pre> blocks holding the raw /bot analytics TEXT exports — the Discord command's own output pasted into a web page. 06-access-and-analytics.html specs a dashboard: a Health/Usage/ Timing switcher, KPI tiles with sparklines, and a filterable event river with kind and source chips. Session A's Phase 1 addendum named the difference correctly: "a missing-dashboard-FEATURE gap, not a missing-style gap — the two are different programs, not one under-styled version of the other." Built at Harkirat's call, 2026-08-23 15:00 EDT.
//
// The river needed NO API change at all: /api/analytics has always returned it as structured JSON and this component was throwing the structure away into a <pre>. Only the tiles needed new data.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Icon } from './icons.js';
import { Shell, NoAccess, Masthead } from './shell.js';
import { Manifest } from './manifest.js';
import { fetchJson } from './httpClient.js';
import { useOverlay } from './overlay.js';

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
    { key: 'kind', label: 'Kind', render: (r) => html`<span class=${'rivk ' + r.kind}>${KIND_LABEL[r.kind] || r.kind}</span>` },
    // ⚠️ The source is PLAIN TEXT in a monospaced column. It used to carry a `.src` chip class with no rule behind it, and a chip here would compete with the kind chip beside it for the same reading — one of the two has to be quieter, and the kind is the one that classifies.
    { key: 'source', label: 'Source', render: (r) => sourceOf(r) },
    { key: 'summary', label: 'What', render: (r) => summaryOf(r) },
    { key: 'actor', label: 'Who', render: (r) => (r.actorId ? String(r.actorId).slice(-6) : 'system') },
];

const RIVER_FILTERS = [
    { key: 'kind', label: 'Kind', options: [
        { value: 'change', label: 'changes' }, { value: 'alert', label: 'alerts' }, { value: 'boot', label: 'boots' },
    ] },
];

// 🔴 `.spark` EXISTS IN THE ADOPTED STYLESHEET AND MEANS SOMETHING ELSE ENTIRELY. The old component emitted `<i style="height:N%">` for a vertical bar chart; app.css's `.spark` is a 6px horizontal progress track whose children are absolutely positioned by `left`/`width`, so every bar collapsed and the chart rendered as a flat line. Nothing errored, the class WAS defined, and `portal:orphans` cannot see this — its question is whether a class exists, not whether it means what the emitter thought.
//
// The honest fix is not a third bar chart: `.lvlbars` is the adopted design's own labelled series, and it is better than the sparkline it replaces because seven anonymous bars become seven NAMED days. A reader could not previously tell which end was today.
function DailyBars({ series = [], label }) {
    if (!series.length) return null;
    const max = Math.max(1, ...series);
    // Newest first, because the question is almost always "what is happening now" and a series read left-to-right made today the LAST thing you reached.
    const rows = series.map((n, i) => ({ n, ago: series.length - 1 - i })).reverse();
    return html`
        <h5>${label}</h5>
        <div class="lvlbars">
            ${rows.map((r) => html`
                <div class="lvlb" key=${r.ago}>
                    <span class="ln">${r.ago === 0 ? 'today' : `−${r.ago}d`}</span>
                    <span class="lt"><i style=${`width:${Math.round((r.n / max) * 100)}%`}></i></span>
                    <span class="lv2">${r.n}</span>
                </div>`)}
        </div>
    `;
}

// A tile is the adopted design's KPI: a label, a figure with its unit set smaller inside it, and one line of context.
//
// 🔴 THE TONE IS A THRESHOLD, NOT "IS THIS NON-ZERO". The mockup's own note records why: `errors ? 'warn' : 'ok'` painted a 99.0% success rate in alarm orange because five events out of 496 failed — and in production there is always at least one, so the tile would have been orange forever. A colour that is on regardless stops carrying information. Green is reserved for a figure with NOTHING against it; everything else is neutral until it is actually a problem.
function Tile({ label, value, unit, sub, tone }) {
    return html`
        <div class=${'tile' + (tone ? ' ' + tone : '')}>
            <span class="tl-k">${label}</span>
            <span class="tl-v">${value}${unit ? html`<i>${unit}</i>` : null}</span>
            ${sub ? html`<span class="tl-s">${sub}</span>` : null}
        </div>
    `;
}

function fmtUptime(since) {
    if (!since) return '—';
    const secs = Math.max(0, Math.round((Date.now() - new Date(since).getTime()) / 1000));
    const d = Math.floor(secs / 86400), hrs = Math.floor((secs % 86400) / 3600);
    return d ? `${d}d ${hrs}h` : `${hrs}h ${Math.floor((secs % 3600) / 60)}m`;
}

// 🔴 REBUILT ON THE ADOPTED DESIGN, AND THE OLD MARKUP HAD NO STYLING AT ALL. `.kpi`, `.kpis`, `.srcline` and `.metrics` were defined in a portal-authored stylesheet that adopting the mockup's app.css deleted, so the whole Health view had been rendering with no rules — four bare stacks of text where the design specifies a tile grid, a split panel and a banner. Nothing errored and every gate passed; `npm run portal:orphans` is the check that can see it.
function Health({ health }) {
    const h = health || {};
    const errors = h.errors24h ?? 0;
    return html`
        <div class="panel" id="health">
            <div class="ph">
                <span class="t">Health</span>
                <span class="rt">read from the bot's own records</span>
            </div>
            <div class="tiles">
                <${Tile} label="Uptime" value=${fmtUptime(h.uptimeSince)} tone=${h.uptimeSince ? 'ok' : ''}
                         sub=${h.uptimeSince ? `since the last ${h.lastBootKind || 'restart'}${h.lastBootVersion ? ' · ' + h.lastBootVersion : ''}` : 'no boot recorded'} />
                <${Tile} label="Errors 24h" value=${errors} tone=${errors === 0 ? 'ok' : errors > 5 ? 'err' : 'warn'}
                         sub=${`${h.noise24h ?? 0} lower-level ${h.noise24h === 1 ? 'alert' : 'alerts'} not counted`} />
                <${Tile} label="RAM at last alert" value=${h.rssPeakMb || '—'} unit=${h.rssPeakMb ? 'MB' : ''}
                         tone=${h.rssPeakMb > 400 ? 'warn' : ''}
                         sub=${h.rssSampleCount ? `highest of ${h.rssSampleCount} ${h.rssSampleCount === 1 ? 'sample' : 'samples'} in 7d` : 'no alerts fired in 7 days'} />
                <${Tile} label="Commands 24h" value=${(h.commands24h ?? 0).toLocaleString()}
                         sub=${`${h.distinctUsers24h ?? 0} distinct users`} />
            </div>
            <div class="hsplit">
                <section class="hpanel">
                    <h4>Restarts</h4>
                    <p class="hp">${h.restarts24h ?? 0} in the last 24 hours, ${h.restarts7d ?? 0} in the last 7 days.
                        A restart is normal after a deploy and is worth a look when it was not one.</p>
                    <${DailyBars} series=${h.spark?.alerts || []} label="Alerts per day" />
                </section>
                <section class="hpanel">
                    <h4>Where these come from</h4>
                    <p class="hp">Uptime and restarts are read from the <code>BootRecord</code> collection; errors and
                        the memory figure come from the <code>AlertLog</code> collection; command counts come from${' '}
                        <code>AnalyticsEvent</code> records, and the river below adds <code>ChangeLog</code> to those three.</p>
                    <${DailyBars} series=${h.spark?.commands || []} label="Commands per day" />
                </section>
            </div>
            <div class="hbanner">
                <span class="hbi"><${Icon} name="clock" cls="sm" /></span>
                <div>
                    <h4>These are the bot's records, not a live reading.</h4>
                    <p>The portal runs as its own process with no gateway connection, so gateway status and live memory
                        are not readable from here. For a live reading, run the <code>/bot analytics</code> command in Discord.</p>
                </div>
            </div>
        </div>
    `;
}

// ⚠️ The raw text exports keep a <pre>, because that is what they ARE — the Discord command's own output, reproduced. `.metrics` was a class modifier with no rule behind it, so it is gone rather than restyled.
function MetricsPanel({ title, text, stats }) {
    return html`
        <div class="panel">
            <div class="ph"><span class="t">${title}</span>${stats ? html`<span class="rt">${stats}</span>` : null}</div>
            ${text ? html`<pre>${text}</pre>` : html`<p class="empty">Nothing recorded in this window.</p>`}
        </div>
    `;
}

export function AnalyticsRealm({ session }) {
    const [data, setData] = useState({ river: [], usage: '', timing: '', alerts: '', health: null, usageStats: null, timingStats: null });
    const [view, setView] = useState('Health');
    const overlay = useOverlay();
    useEffect(() => { fetchJson('/api/analytics').then(setData); }, []);

    if (data.signedOut || data.forbidden) return html`<${NoAccess} />`;

    async function revert(changeId) {
        await fetchJson(`/api/revert/${changeId}`, { method: 'POST', headers: { 'x-csrf-token': session.csrfToken } });
        fetchJson('/api/analytics').then(setData);
    }

    // 🔴 THE MOST DANGEROUS BUTTON IN THE PORTAL HAD NO CONFIRMATION AT ALL. Everything else here stages; this one fires immediately against live data, once per selected row, and it is the only control that can undo something a person already committed on purpose. It sat in a bulk-action list beside "Export selection".
    //
    // ⚠️ NOT a typed gate, and that is a judgement rather than an omission: a revert applies the change's own recorded INVERSE, so the safe direction is the one this button goes in — the risk is reverting the WRONG row, which naming the rows answers and typing a word does not.
    function confirmRevert(ids) {
        const chosen = rows.filter((r) => ids.includes(r.id));
        const revertable = chosen.filter((r) => r.kind === 'change');
        overlay.confirm({
            op: 'change.revert', tier: 2, danger: true,
            confirmLabel: revertable.length === 1 ? 'Revert it' : `Revert ${revertable.length} changes`,
            title: revertable.length === 1 ? 'Revert this change?' : `Revert ${revertable.length} changes?`,
            body: html`
                <p class="dw-p">This applies each change's recorded inverse <b>immediately</b> — it does not stage, and
                    the Review screen never sees it. The revert is itself recorded here, so it can be reverted in turn.</p>
                ${chosen.length !== revertable.length ? html`
                    <p class="dw-p"><b>${chosen.length - revertable.length}</b> of the selected rows${' '}
                        ${chosen.length - revertable.length === 1 ? 'is an alert or a restart' : 'are alerts or restarts'},
                        not changes — nothing will happen to ${chosen.length - revertable.length === 1 ? 'it' : 'them'}.</p>` : null}
                <ul class="dw-l">${revertable.slice(0, 6).map((r) => html`
                    <li key=${r.id}>${r.summary}</li>`)}
                    ${revertable.length > 6 ? html`<li>…and ${revertable.length - 6} more</li>` : null}</ul>`,
            onConfirm: () => {
                revertable.forEach((r) => revert(r.id));
                overlay.say(`${revertable.length} change${revertable.length === 1 ? '' : 's'} reverted.`);
            },
        });
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
                  overlaySlot=${overlay.render()}
                  masthead=${html`<${Masthead} title="Analytics" sub="What the bot did, what it cost, and what somebody looked for and did not find."
                                               stats=${[
                                                   { value: fmtUptime(h.uptimeSince), label: 'uptime' },
                                                   { value: h.errors24h ?? 0, label: 'errors 24h', tone: h.errors24h ? 'bad' : undefined },
                                                   { value: (h.commands24h ?? 0).toLocaleString(), label: 'commands 24h', lead: true, accent: 'var(--r-analytics)' },
                                               ]} />`}
                  viewSlot=${viewSlot}
                  manifestSlot=${html`<${Manifest} rows=${rows} columns=${RIVER_COLUMNS} searchableFields=${['summary', 'title', 'actor']}
                                                    title="One history, both front doors" filterGroups=${RIVER_FILTERS}
                                                    headerRight="Alerts, changes and boots are all events — filtering one stream beats switching between four lists."
                                                    emptyText="No changes, alerts or restarts have been recorded yet."
                                                    bulkNote="Immediate — a revert applies the inverse now, and is itself recorded"
                                                    bulkTier=${3} rowNoun=${['event', 'events']}
                                                    bulkActions=${[{ label: 'Revert', danger: true, onClick: confirmRevert }]} />`} />
    `;
}
