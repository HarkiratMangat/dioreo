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

async function fetchChangesets(realm) {
    const res = await fetch(`/api/changeset?realm=${realm}`, { credentials: 'same-origin' });
    const body = await res.json();
    return body.changesets || [];
}

export function SeasonRealm({ session }) {
    const [view, setView] = useState('Track');
    const [state, setState] = useState(null);
    const [changesets, setChangesets] = useState([]);
    const [notices, setNotices] = useState([]);

    useEffect(() => { fetchSeasonState().then(setState); }, []);
    // Board has nothing to show without this — a review pass found the list endpoint and this fetch were both missing entirely, so the Board column stayed permanently empty regardless of what was actually staged.
    useEffect(() => { fetchChangesets('season').then(setChangesets); }, [view]);

    if (!state) return html`<p style="padding:24px">Loading…</p>`;
    if (state.error) return html`<p style="padding:24px">You do not have access to this realm.</p>`;

    const window = { start: new Date().toISOString().slice(0, 10), end: state.live?.bpEnd || new Date().toISOString().slice(0, 10) };

    async function handleExport(changeset) {
        await fetch(`/api/changeset/${changeset._id}/export`, { method: 'POST', headers: { 'x-csrf-token': session.csrfToken } });
        fetchChangesets('season').then(setChangesets);
    }

    async function handleCommit(ready, confirmText) {
        for (const c of ready) {
            const res = await fetch(`/api/changeset/${c._id}/commit`, {
                method: 'POST',
                headers: { 'content-type': 'application/json', 'x-csrf-token': session.csrfToken },
                body: JSON.stringify({ confirmText }),
            });
            const body = await res.json();
            if (!res.ok) {
                setNotices([...notices, { changeId: c._id, summary: `Commit failed: ${body.reason || 'unknown error'}` }]);
            }
        }
        fetchChangesets('season').then(setChangesets);
    }

    const viewSlot = view === 'Track'
        ? html`<${Track} data=${{ draw: state.live?.newDraws || [], returning: state.live?.returningDraws || [], event: state.live?.calendar || [] }}
                          draft=${state.draft} window=${window} season=${state.live} />`
        : html`<${Board} changesets=${changesets} onCommit=${handleCommit} onExport=${handleExport} />`;

    const manifestSlot = html`<${Manifest} rows=${toManifestRows(state.live)} columns=${SEASON_COLUMNS} searchableFields=${['title']} />`;

    return html`
        <${Shell} realm="season" session=${session} view=${view} viewOptions=${['Track', 'Board']} onSetView=${setView}
                  viewSlot=${viewSlot} manifestSlot=${manifestSlot}
                  traySlot=${html`<${Tray} notices=${notices} onUndo=${(id) => setNotices(notices.filter(n => n.changeId !== id))} onDismiss=${(id) => setNotices(notices.filter(n => n.changeId !== id))} />`} />
    `;
}
