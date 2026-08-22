// portal/ui/analytics.js — ESM. The Analytics realm: Health/Usage/Timing (read-only, reusing the bot's own export functions — nothing re-derived, spec §8.2) over one filterable event river as the Manifest, with revert as its one action.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell, NoAccess } from './shell.js';
import { Manifest } from './manifest.js';
import { fetchJson } from './httpClient.js';

const RIVER_COLUMNS = [
    { key: 'kind', label: 'Kind' },
    { key: 'summary', label: 'What', render: (r) => r.summary || r.title || r.kind },
    { key: 'at', label: 'When', dataKind: 'date', render: (r) => new Date(r.at).toLocaleString() },
];

function MetricsPanel({ title, text }) {
    return html`
        <div class="panel" style="margin-bottom:0">
            <div class="ph"><span class="t">${title}</span></div>
            <pre style="padding:12px 14px;white-space:pre-wrap;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--ink2);margin:0">${text}</pre>
        </div>
    `;
}

export function AnalyticsRealm({ session }) {
    const [data, setData] = useState({ river: [], usage: '', timing: '', alerts: '' });
    useEffect(() => { fetchJson('/api/analytics').then(setData); }, []);

    if (data.signedOut || data.forbidden) return html`<${NoAccess} />`;

    async function revert(changeId) {
        await fetchJson(`/api/revert/${changeId}`, { method: 'POST', headers: { 'x-csrf-token': session.csrfToken } });
        fetchJson('/api/analytics').then(setData);
    }

    const rows = data.river.map(r => ({ ...r, id: r.changeId || r.alertId || r._id }));
    return html`
        <${Shell} realm="analytics" session=${session}
                  viewSlot=${html`
                      <${MetricsPanel} title="Usage" text=${data.usage} />
                      <${MetricsPanel} title="Timing" text=${data.timing} />
                      <${MetricsPanel} title="Alerts" text=${data.alerts} />
                  `}
                  manifestSlot=${html`<${Manifest} rows=${rows} columns=${RIVER_COLUMNS} searchableFields=${['summary', 'title']}
                                                    stateOf=${() => 'live'}
                                                    bulkActions=${[{ label: 'Revert', onClick: (ids) => ids.forEach(revert) }]} />`} />
    `;
}
