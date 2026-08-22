// portal/ui/season.js — ESM. The Season realm: Track/Board as the switchable view layer, Manifest (never switches) underneath. Covers /manage's draws/calendar/patchnotes/seasondraft/season pages (spec §8.2's join table) — visible if the signed-in admin holds ANY of them.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell } from './shell.js';
import { Track } from './track.js';
import { Board } from './board.js';
import { Manifest } from './manifest.js';
import { Tray } from './tray.js';

const SEASON_COLUMNS = [
    { key: 'title', label: 'Item' },
    { key: 'lane', label: 'Type' },
    { key: 'window', label: 'Window', dataKind: 'date' },
    { key: 'state', label: 'State' },
];

function toManifestRows(live) {
    if (!live) return [];
    const rows = [];
    for (const key of ['newDraws', 'returningDraws', 'calendar']) {
        for (const item of live[key] || []) {
            rows.push({
                id: item._id, title: item.title, lane: key, state: 'live',
                window: item.endDate ? `→ ${new Date(item.endDate).toDateString()}` : '—',
            });
        }
    }
    return rows;
}

export async function fetchSeasonState() {
    const res = await fetch('/api/season', { credentials: 'same-origin' });
    return res.json();
}

export function SeasonRealm({ session }) {
    const [view, setView] = useState('Track');
    const [state, setState] = useState(null);
    const [changesets, setChangesets] = useState([]);
    const [notices, setNotices] = useState([]);

    useEffect(() => { fetchSeasonState().then(setState); }, []);

    if (!state) return html`<p style="padding:24px">Loading…</p>`;
    if (state.error) return html`<p style="padding:24px">You do not have access to this realm.</p>`;

    const window = { start: new Date().toISOString().slice(0, 10), end: state.live?.bpEnd || new Date().toISOString().slice(0, 10) };

    const viewSlot = view === 'Track'
        ? html`<${Track} data=${{ draw: state.live?.newDraws || [], returning: state.live?.returningDraws || [], event: state.live?.calendar || [] }}
                          draft=${state.draft} window=${window} season=${state.live} />`
        : html`<${Board} changesets=${changesets}
                          onCommit=${async (ready) => { for (const c of ready) await fetch(`/api/changeset/${c._id}/commit`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': session.csrfToken }, body: JSON.stringify({}) }); }}
                          onExport=${async (c) => { await fetch(`/api/changeset/${c._id}/export`, { method: 'POST', headers: { 'x-csrf-token': session.csrfToken } }); }} />`;

    const manifestSlot = html`<${Manifest} rows=${toManifestRows(state.live)} columns=${SEASON_COLUMNS} searchableFields=${['title']} />`;

    return html`
        <${Shell} realm="season" session=${session} view=${view} viewOptions=${['Track', 'Board']} onSetView=${setView}
                  viewSlot=${viewSlot} manifestSlot=${manifestSlot}
                  traySlot=${html`<${Tray} notices=${notices} onUndo=${(id) => setNotices(notices.filter(n => n.changeId !== id))} onDismiss=${(id) => setNotices(notices.filter(n => n.changeId !== id))} />`} />
    `;
}
