// portal/ui/season.js — ESM. The Season realm: Track/Board as the switchable view layer, Manifest (never switches) underneath. Covers /manage's draws/calendar/patchnotes/seasondraft/season pages (spec §8.2's join table) — visible if the signed-in admin holds ANY of them.
//
// buildSeasonAddOp/buildSeasonEditOp (season.logic.js) and editOpFor (track.logic.js) are read as bare GLOBALS, not imported -- both are loaded as classic <script> tags before this module (see track.js's own header comment for why). A literal `import {...} from './season.logic.js'` shipped here once and would throw in every real browser (no `export` statement exists in a classic script); found auditing this file for Task 4 and never actually exercised live before, since every prior verification pass used direct authenticated `fetch` calls or the signed-out Door page, neither of which loads this module as real ESM.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell, NoAccess } from './shell.js';
import { fetchJson } from './httpClient.js';
import { stageOps } from './composeClient.js';
import { Track } from './track.js';
import { Board } from './board.js';
import { Manifest } from './manifest.js';
import { Tray } from './tray.js';

const SEASON_COLUMNS = [
    { key: 'title', label: 'Item', editable: true },
    { key: 'lane', label: 'Type' },
    { key: 'window', label: 'Window', dataKind: 'date' },
    { key: 'state', label: 'State' },
];

const ADD_KINDS = [
    { value: 'draw', label: 'New draw' },
    { value: 'returning', label: 'Returning draw' },
    { value: 'event', label: 'Event' },
    { value: 'playlist', label: 'Playlist' },
];

function toManifestRows(live) {
    if (!live) return [];
    const rows = [];
    for (const key of ['newDraws', 'returningDraws', 'calendar']) {
        for (const item of live[key] || []) {
            rows.push({
                // The full item ships on the row (not just the display fields below) so buildSeasonEditOp has every field draw.edit/calendar.edit's validate() needs -- an edit op built from a display-only row would silently drop items/startDate/category on every commit.
                ...item,
                id: item._id, title: item.title, lane: key, state: 'live',
                // A draw's real schema field is `date` (no separate start/end); calendar events have both `date`(start) and `endDate`. This pre-existing display line always fell to '—' for every draw before this fix, since item.endDate is never set on a draw record.
                window: (item.endDate || item.date) ? `→ ${new Date(item.endDate || item.date).toDateString()}` : '—',
            });
        }
    }
    return rows;
}

// Builds the id/lane-carrying items Track's <Bar> and track.logic.js's editOpFor both expect -- deliberately a DIFFERENT shape from toManifestRows' rows (Manifest uses lane values 'newDraws'/ 'returningDraws'/'calendar'; Track uses its own topic vocabulary 'draw'/'returning'/'event', matching track.logic.js's LANE_ORDER and TOPIC_VAR) so each stays a plain shape for its own consumer rather than one row shape trying to serve two different vocabularies. `startDate` is synthetic (draws have no such schema field) -- it exists purely so barGeometry has something to read; editOpFor strips it back out for a draw before it would ever reach core/ops/draws.js.
function toTrackItems(live, path, lane) {
    return (live?.[path] || []).map((item) => ({
        ...item, id: String(item._id), kind: lane, lane,
        startDate: item.startDate || item.date, endDate: item.endDate || item.date,
    }));
}

// The Add composer -- a kind picker revealing only the fields that kind's op actually needs, rather than one form with every field always visible (spec §7: desktop-first, dense, no wasted chrome).
function AddComposer({ onSubmit, onCancel }) {
    const [kind, setKind] = useState('draw');
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const isDraw = kind === 'draw' || kind === 'returning';
    const ready = title.trim() && endDate.trim() && (isDraw || startDate.trim());

    return html`
        <div class="panel" style="margin-bottom:14px">
            <div class="ph"><span class="t">Add to Season</span></div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;padding:12px 14px;align-items:center">
                <label class="sr-only" for="add-kind">Kind</label>
                <select id="add-kind" value=${kind} onChange=${(e) => setKind(e.target.value)}>
                    ${ADD_KINDS.map((k) => html`<option value=${k.value}>${k.label}</option>`)}
                </select>
                <label class="sr-only" for="add-title">Title</label>
                <input id="add-title" placeholder="Title" value=${title} onInput=${(e) => setTitle(e.target.value)} />
                ${!isDraw ? html`
                    <label class="sr-only" for="add-start">Start date</label>
                    <input id="add-start" placeholder="Start date (e.g. Aug 25)" value=${startDate} onInput=${(e) => setStartDate(e.target.value)} />
                ` : null}
                <label class="sr-only" for="add-end">End date</label>
                <input id="add-end" placeholder="End date (e.g. Sep 10)" value=${endDate} onInput=${(e) => setEndDate(e.target.value)} />
                <button class="accent-fill" disabled=${!ready}
                        onClick=${() => onSubmit(buildSeasonAddOp(kind, { title, startDate, endDate, items: [] }))}>Stage</button>
                <button onClick=${onCancel}>Cancel</button>
            </div>
        </div>
    `;
}

export async function fetchSeasonState() {
    return fetchJson('/api/season');
}

async function fetchChangesets(realm) {
    const body = await fetchJson(`/api/changeset?realm=${realm}`);
    return body.changesets || [];
}

export function SeasonRealm({ session }) {
    const [view, setView] = useState('Track');
    const [state, setState] = useState(null);
    const [changesets, setChangesets] = useState([]);
    const [notices, setNotices] = useState([]);
    const [showAdd, setShowAdd] = useState(false);

    useEffect(() => { fetchSeasonState().then(setState); }, []);
    // Board has nothing to show without this — a review pass found the list endpoint and this fetch were both missing entirely, so the Board column stayed permanently empty regardless of what was actually staged.
    useEffect(() => { fetchChangesets('season').then(setChangesets); }, [view]);

    if (!state) return html`<p style="padding:24px">Loading…</p>`;
    if (state.signedOut || state.forbidden) return html`<${NoAccess} />`;

    // Renamed from `window` (Task 4) -- that name silently SHADOWED the real browser global for the rest of this component's body, including handleExportSelection's `window.open()` call below, which was a live, never-yet-clicked bug (TypeError: window.open is not a function, since that identifier resolved to this {start,end} object instead of the global). Found auditing this file for Track's own drag handles, which genuinely need the real global.
    const visibleWindow = { start: new Date().toISOString().slice(0, 10), end: state.live?.bpEnd || new Date().toISOString().slice(0, 10) };

    async function handleExport(changeset) {
        await fetchJson(`/api/changeset/${changeset._id}/export`, { method: 'POST', headers: { 'x-csrf-token': session.csrfToken } });
        fetchChangesets('season').then(setChangesets);
    }

    // Each changeset commits independently, so this used to be a needless sequential await-in-a-loop (efficiency review). Parallelizing it the naive way would also have reintroduced a stale-closure bug -- each iteration's setNotices([...notices, ...]) read `notices` from the same closure, so concurrent failures would overwrite each other and only the last one would survive. Collecting into a local array and setting state once avoids both.
    async function handleCommit(ready, confirmText) {
        const results = await Promise.all(ready.map(async (c) => {
            const res = await fetch(`/api/changeset/${c._id}/commit`, {
                method: 'POST',
                headers: { 'content-type': 'application/json', 'x-csrf-token': session.csrfToken },
                body: JSON.stringify({ confirmText }),
            });
            const body = await res.json();
            return res.ok ? null : { changeId: c._id, summary: `Commit failed: ${body.reason || 'unknown error'}` };
        }));
        const failures = results.filter(Boolean);
        if (failures.length) setNotices([...notices, ...failures]);
        fetchChangesets('season').then(setChangesets);
    }

    async function handleAdd(op) {
        await stageOps('season', [op], session.csrfToken);
        setShowAdd(false);
        fetchChangesets('season').then(setChangesets);
    }

    // "Change type…" and "Shift dates…" from the approved mockup's bulk bar need an inline amount/type input Manifest's bulkActions shape doesn't carry (onClick(ids) takes no extra argument) -- deliberately scoped out of this pass rather than reaching for a native prompt(), which this session already removed from Access's Revoke for the same UX reason. Stage deletion and Export selection need no such input and are built here.
    const allRows = toManifestRows(state.live);
    function rowsById(ids) { return allRows.filter((r) => ids.includes(r.id)); }

    async function handleBulkDelete(ids) {
        const rows = rowsById(ids);
        const ops = rows.map((r) => {
            const isDraw = r.lane === 'newDraws' || r.lane === 'returningDraws';
            return isDraw
                ? { type: 'draw.delete', target: { category: r.lane === 'newDraws' ? 'new' : 'returning', elementId: r.id }, payload: {} }
                : { type: 'calendar.delete', target: { elementId: r.id }, payload: {} };
        });
        if (ops.length) await stageOps('season', ops, session.csrfToken);
        fetchChangesets('season').then(setChangesets);
    }

    function handleExportSelection(ids) {
        const rows = rowsById(ids);
        const text = rows.map((r) => `${r.title} — ${r.window}`).join('\n');
        window.open(`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`, '_blank');
    }

    // Task 4 -- Track's drag handles. editOpFor (track.logic.js, a bare global) preserves every field of the dragged item except the edited date; a draw writes to `date`, a calendar item to `endDate` (see that function's own header for the full field-name reasoning).
    async function handleDragCommit(item, newDate) {
        const op = editOpFor(item, newDate);
        await stageOps('season', [op], session.csrfToken);
        fetchChangesets('season').then(setChangesets);
    }

    const trackData = {
        draw: toTrackItems(state.live, 'newDraws', 'draw'),
        returning: toTrackItems(state.live, 'returningDraws', 'returning'),
        event: toTrackItems(state.live, 'calendar', 'event'),
    };
    // The draft rail had the identical bucketing bug as the live rail (state.draft's own keys are newDraws/returningDraws/calendar, not draw/returning/event) -- fixed in the same pass since it's the same reshape, not a second task.
    const draftData = state.draft ? {
        draw: toTrackItems(state.draft, 'newDraws', 'draw'),
        returning: toTrackItems(state.draft, 'returningDraws', 'returning'),
        event: toTrackItems(state.draft, 'calendar', 'event'),
    } : null;

    const viewSlot = view === 'Track'
        ? html`${showAdd ? html`<${AddComposer} onSubmit=${handleAdd} onCancel=${() => setShowAdd(false)} />` : null}
               <${Track} data=${trackData}
                          draft=${draftData} window=${visibleWindow} season=${state.live} onDragCommit=${handleDragCommit} />`
        : html`<${Board} changesets=${changesets} onCommit=${handleCommit} onExport=${handleExport} />`;

    const manifestSlot = html`<${Manifest} rows=${allRows} columns=${SEASON_COLUMNS} searchableFields=${['title']}
                                            onAdd=${() => setShowAdd(true)} realm="season" csrfToken=${session.csrfToken}
                                            buildEditOp=${buildSeasonEditOp}
                                            onEditError=${(msg) => setNotices([...notices, { changeId: `edit-${Date.now()}`, summary: msg }])}
                                            bulkActions=${[
                                                { label: 'Export selection', onClick: handleExportSelection },
                                                { label: 'Stage deletion', danger: true, onClick: handleBulkDelete },
                                            ]} />`;

    return html`
        <${Shell} realm="season" session=${session} view=${view} viewOptions=${['Track', 'Board']} onSetView=${setView}
                  viewSlot=${viewSlot} manifestSlot=${manifestSlot}
                  traySlot=${html`<${Tray} notices=${notices} onUndo=${(id) => setNotices(notices.filter(n => n.changeId !== id))} onDismiss=${(id) => setNotices(notices.filter(n => n.changeId !== id))} />`} />
    `;
}
