// portal/ui/season.js — ESM. The Season realm: Track/Board as the switchable view layer, Manifest (never switches) underneath. Covers /manage's draws/calendar/patchnotes/seasondraft/season pages (spec §8.2's join table) — visible if the signed-in admin holds ANY of them.
//
// buildSeasonAddOp/buildSeasonEditOp (season.logic.js) and editOpFor (track.logic.js) are read as bare GLOBALS, not imported -- both are loaded as classic <script> tags before this module (see track.js's own header comment for why). A literal `import {...} from './season.logic.js'` shipped here once and would throw in every real browser (no `export` statement exists in a classic script); found auditing this file for Task 4 and never actually exercised live before, since every prior verification pass used direct authenticated `fetch` calls or the signed-out Door page, neither of which loads this module as real ESM.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell, NoAccess, Masthead } from './shell.js';
import { fetchJson } from './httpClient.js';
import { stageOps } from './composeClient.js';
import { Track } from './track.js';
import { useRef } from '../vendor/preact-hooks.mjs';
import { Board } from './board.js';
import { Manifest } from './manifest.js';
import { Tray } from './tray.js';

// LANE_LABELS lives in season.logic.js (a bare global here, same pattern as buildSeasonAddOp/buildSeasonEditOp above) rather than a local const, so scripts/seasonOps.test.js can require() it directly instead of regex-scraping this ESM file's source text. Gap audit §3.4 finding 1: Manifest printed row.lane's raw collection-key value verbatim (e.g. "newDraws") since nothing humanized it for display.
const SEASON_COLUMNS = [
    { key: 'title', label: 'Item', editable: true },
    // row.typeLabel is stamped by toManifestRows and already resolves Playlist away from Event; LANE_LABELS stays as the fallback so a row built by anything older still reads correctly.
    { key: 'lane', label: 'Type', render: (row) => row.typeLabel || LANE_LABELS[row.lane] || row.lane },
    { key: 'window', label: 'Window', dataKind: 'date' },
    { key: 'state', label: 'State' },
];

// 03-three-surfaces.html's filter row. One chip per GROUP, cycling its own options -- see manifest.js's FilterChips for why that shape rather than one chip per possible value.
const SEASON_FILTERS = [
    { key: 'lane', label: 'Type', options: [
        { value: 'newDraws', label: 'New draw' }, { value: 'returningDraws', label: 'Returning draw' }, { value: 'calendar', label: 'Event' },
    ] },
    { key: 'state', label: 'State', options: [
        { value: 'live', label: 'live' }, { value: 'staged', label: 'staged' }, { value: 'conflict', label: 'conflict' },
    ] },
];

const ADD_KINDS = [
    { value: 'draw', label: 'New draw' },
    { value: 'returning', label: 'Returning draw' },
    { value: 'event', label: 'Event' },
    { value: 'playlist', label: 'Playlist' },
];

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

// 01-season-spine.html's Staged panel -- the mockup keeps pending changes visible and actionable right beside the Track instead of buried in the flat Manifest table below. describeOp/blockedReason are board.logic.js globals (every *.logic.js file loads on every page -- see track.js's header), the same functions Board's own cards already use, so the two views can never describe a change differently. Reads changesets Season already fetches; asks for nothing new.
function StagedPanel({ changesets, onDiscard, onReview }) {
    const pending = (changesets || []).filter((c) => c.state === 'staged' || c.state === 'blocked');
    if (!pending.length) return null;
    // The staged strip in the adopted vocabulary: one row per change, tier first, and the ONE action that matters — review and commit — as the row of controls rather than a footer. A blocked change says why on its own row; a strip that hides the reason behind a click is a receipt.
    return html`
        <div class="callout stg" style="margin:0 22px 14px">
            <div class="rvlist" role="list">
                ${pending.map((c) => html`
                    <div class="rvopwrap" role="listitem" key=${String(c._id)}>
                        <span class=${'rvop' + (c.tier === 3 ? ' t3' : '')}>
                            <span class="rvt">T${c.tier}</span>
                            <span class="rvn">
                                <b>${describeOp((c.ops || [])[0])}</b>
                                <span>${c.realm || 'season'}${(c.ops || []).length > 1 ? ` · +${c.ops.length - 1} more` : ''}</span>
                                ${blockedReason(c) ? html`<span class="rvw">${blockedReason(c)}</span>` : null}
                            </span>
                        </span>
                        <button class="rvdrop" aria-label=${`Discard ${describeOp((c.ops || [])[0])}`}
                                data-tip="Discard this staged change — nothing live is undone"
                                onClick=${() => onDiscard(String(c._id))}>×</button>
                    </div>`)}
            </div>
            <div class="rvfoot">
                <span class="sp"></span>
                <button class="accent-fill" onClick=${onReview}>Review & commit</button>
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

// ── THE SEASON CLOCK ──────────────────────────────────────────────────────────────────────────
//
// The subject is THE TIME AND THE SEASON TITLE. Not a to-do list, not a count of pending work — Harkirat, after thirteen rejected designs: "IM NOT THE ONE CREATING THAT CONTENT, the content already exists… the countdown is an informative insight into when the season ends, what's live in the game, what still needs to release."
//
// 🔴 ONE HERO FIGURE, and the rest subordinate to it. Four equal segments is a digital readout, and a digital readout is what a phone lock screen does — it tells you the time without telling you anything about the time. The days are the number you act on; hours/minutes/seconds are the proof it is running.
//
// 🔴 FIVE PRESSURE TIERS, each REMOVING something. `data-tier` drives it from CSS so the component states the tier and the stylesheet decides what that looks like — a single orange "hot" state means the element says exactly one thing for twenty days and then another.
//
// ⚠️ TWO WALLS, NOT THREE DEADLINES. bpEnd and rankEnd are usually the same day; seasonMoments groups by date so one moment carrying two lines reads as one wall.
function SeasonClock({ season, today }) {
    const [, setTick] = useState(0);
    const moments = seasonMoments(season, today || new Date().toISOString().slice(0, 10));
    // One interval, started only when there is something to count. A clock with no deadline should wake nothing up.
    useEffect(() => {
        if (!moments.length) return undefined;
        const id = setInterval(() => setTick((n) => n + 1), 1000);
        return () => clearInterval(id);
    }, [moments.length]);

    if (!moments.length) {
        return html`<div class="sclock"><span class="sc-none">No deadline set for this season.</span></div>`;
    }
    const next = moments[0];
    const rest = moments.slice(1);
    const p = countdownParts(next.iso, Date.now());
    if (!p || p.past) return html`<div class="sclock" data-tier="today"><span class="sc-none">This season has ended.</span></div>`;

    const units = [];
    if (p.d > 0) units.push(['d', p.d, p.d === 1 ? 'day' : 'days']);
    if (p.d > 0 || p.h > 0) units.push(['h', p.h, 'hrs']);
    units.push(['m', p.m, 'min']);
    units.push(['s', p.s, 'sec']);

    return html`
        <div class="sclock" data-tier=${seasonTier(p.d)}>
            <div class="sc-face">
                ${units.map((u, i) => html`
                    ${i ? html`<span class="sc-sep">:</span>` : null}
                    <span class=${'sc-u' + (u[0] === 's' ? ' sec' : '')}>
                        <b>${u[0] === 'd' ? u[1] : String(u[1]).padStart(2, '0')}</b><i>${u[2]}</i>
                    </span>`)}
            </div>
            <div class="sc-when">
                until <b>${fmtDay(next.iso)}</b> · ${next.lines.map((L) => L.label).join(' & ')}
                ${rest.length ? html`<span class="sc-then"> · then ${rest.map((m) => `${m.lines.map((L) => L.label).join(' & ')} ${fmtDay(m.iso)}`).join(' · ')}</span>` : null}
            </div>
        </div>`;
}

const fmtDay = (iso) => new Date(String(iso).slice(0, 10) + 'T00:00:00Z')
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

// The eyebrow: three counts above the title, each a fact the page can act on. A zero is dimmed rather than hidden — "no flags" is information, and a row that changes length as numbers reach zero makes the reader re-find every other number.
function Eyebrow({ live, staged, flags }) {
    const cell = (n, k, cls) => html`<span><i class=${n === 0 ? 'zero' : (cls || '')}>${n}</i>${k}</span>`;
    return html`<div class="mh-eyebrow">${cell(live, 'live now')}${cell(staged, 'staged', 'stg')}${cell(flags, 'flags', 'warn')}</div>`;
}

// Season is the ONLY realm with more than one kind of thing to add, so it is the only one that reveals its kinds. The others keep a single button, because a single button has nothing to reveal. Built from the lane table, so a kind cannot go missing here while existing on the Track.
const ADD_CHIPS = [
    { key: 'draw', label: 'Draw', accent: 'var(--draw)' },
    { key: 'returning', label: 'Returning draw', accent: 'var(--ret)' },
    { key: 'event', label: 'Event', accent: 'var(--ev)' },
    { key: 'playlist', label: 'Playlist', accent: 'var(--play)' },
    { key: 'patchnote', label: 'Patch note', accent: 'var(--pn)' },
];

function AddChips({ onAdd }) {
    return html`
        <div class="mh-add" role="group" aria-label="Add to this season">
            <span class="mh-add-k">Add</span>
            ${ADD_CHIPS.map((c) => html`
                <button class="pill mh-t" style=${`--c:${c.accent}`} onClick=${() => onAdd(c.key)}>
                    <span class="dot"></span>${c.label}
                </button>`)}
        </div>`;
}


// `?today=` travels the clock in the harness; in production this is simply today.
const todayIso = () => (typeof document !== 'undefined' && document.documentElement.dataset.today)
    || new Date().toISOString().slice(0, 10);

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
    //
    // seasonWindow (season.logic.js, a bare global) replaces what used to be an inline {start: today, end: live.bpEnd || today}. With bpEnd unset -- the dev database's actual state -- that made start === end, so barGeometry divided by a 1ms window and every bar on the Track collapsed to a sliver at 0%. See that function's own header.
    const visibleWindow = seasonWindow(state.live);

    async function handleExport(changeset) {
        await fetchJson(`/api/changeset/${changeset._id}/export`, { method: 'POST', headers: { 'x-csrf-token': session.csrfToken } });
        fetchChangesets('season').then(setChangesets);
    }

    // Mockup's Staged panel (01-season-spine.html) shows Discard as a first-class action, but no route ever set state:'discarded' anywhere in the portal before this — the only way out of a staged/blocked change was to commit it. Ownership-scoped exactly like export/commit above.
    async function handleDiscard(changesetId) {
        await fetchJson(`/api/changeset/${changesetId}/discard`, { method: 'POST', headers: { 'x-csrf-token': session.csrfToken } });
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

    // "Change type…" and "Shift dates…" from the approved mockup's bulk bar need an inline amount/type input Manifest's bulkActions shape doesn't carry (onClick(ids) takes no extra argument) -- deliberately scoped out of this pass rather than reaching for a native prompt(), which this session already removed from Access's Revoke for the same UX reason. Stage deletion and Export selection need no such input and are built here. toManifestRows/stateForElement now live in season.logic.js (bare global, same pattern as LANE_LABELS above) -- real state derivation needs `changesets` (already fetched for Board), so it moved out of a browser-only local function to become properly testable.
    const allRows = toManifestRows(state.live, changesets);
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

    // Playlists are split out of `calendar` into their own lane. Track's LANE_LABEL and TOPIC_VAR have carried a `playlist` entry since the first build and nothing ever filled it, so every playlist-category calendar item rendered in the Events lane in the Events colour -- flagged by Session A's own post-hoc pass as pre-existing and left for this phase.
    const splitCalendar = (src) => {
        const all = (src && src.calendar) || [];
        return { events: { calendar: all.filter((i) => !isPlaylist(i)) }, playlists: { calendar: all.filter(isPlaylist) } };
    };
    const liveCal = splitCalendar(state.live);
    const trackData = {
        draw: toTrackItems(state.live, 'newDraws', 'draw'),
        returning: toTrackItems(state.live, 'returningDraws', 'returning'),
        event: toTrackItems(liveCal.events, 'calendar', 'event'),
        playlist: toTrackItems(liveCal.playlists, 'calendar', 'playlist'),
    };
    // The draft rail had the identical bucketing bug as the live rail (state.draft's own keys are newDraws/returningDraws/calendar, not draw/returning/event) -- fixed in the same pass since it's the same reshape, not a second task.
    const draftCal = splitCalendar(state.draft);
    const draftRails = state.draft ? {
        draw: toTrackItems(state.draft, 'newDraws', 'draw'),
        returning: toTrackItems(state.draft, 'returningDraws', 'returning'),
        event: toTrackItems(draftCal.events, 'calendar', 'event'),
        playlist: toTrackItems(draftCal.playlists, 'calendar', 'playlist'),
    } : null;
    // An EMPTY draft is not a draft. `state.draft` is a truthy object as soon as the season doc has the key at all, so the divider plus five empty lanes rendered ~200px of dead space announcing "Next season draft" for a draft holding nothing.
    const draftData = draftRails && Object.values(draftRails).some((items) => items.length) ? draftRails : null;

    // The masthead's numbers, from real data rather than a caption (01-season-spine.html's "14 DAYS LEFT · 6 DRAWS LIVE · 3 STAGED"). bpEnd is genuinely optional, so "days left" says so rather than printing a number derived from a missing field.
    const drawsLive = (state.live?.newDraws || []).length + (state.live?.returningDraws || []).length;
    const stagedCount = changesets.filter((c) => c.state === 'staged' || c.state === 'blocked').length;
    const daysLeft = state.live?.bpEnd
        ? Math.max(0, Math.ceil((new Date(state.live.bpEnd).getTime() - Date.now()) / 86400000))
        : '—';
    // The Track derives its own findings; the eyebrow counts the same ones rather than a second rule.
    const flagCount = state.live?.bpEnd
        ? Object.values(trackData).flat().filter((i) => i.endDate && i.endDate > state.live.bpEnd).length : 0;
    const seasonStats = [
        { value: daysLeft, label: 'days left' },
        { value: drawsLive, label: 'draws live' },
        { value: stagedCount, label: 'staged', tone: stagedCount ? 'hot' : undefined },
    ];

    const viewSlot = view === 'Track'
        ? html`${showAdd ? html`<${AddComposer} onSubmit=${handleAdd} onCancel=${() => setShowAdd(false)} />` : null}
               <${StagedPanel} changesets=${changesets} onDiscard=${handleDiscard} onReview=${() => setView('Board')} />
               <${Track} data=${trackData}
                          draft=${draftData} window=${visibleWindow} season=${state.live} onDragCommit=${handleDragCommit}
                          onFillGap=${() => setShowAdd(true)} />`
        : html`<${Board} changesets=${changesets} onCommit=${handleCommit} onExport=${handleExport} onDiscard=${handleDiscard} />`;

    const manifestSlot = html`<${Manifest} rows=${allRows} columns=${SEASON_COLUMNS} searchableFields=${['title']}
                                            title="Everything in the season" filterGroups=${SEASON_FILTERS}
                                            headerRight=${`${drawsLive} draws · ${(state.live?.calendar || []).length} calendar items`}
                                            bulkNote="Destructive actions stage — they never fire from here."
                                            emptyText="This season has no draws or calendar items yet." 
                                            onAdd=${() => setShowAdd(true)} realm="season" csrfToken=${session.csrfToken}
                                            buildEditOp=${buildSeasonEditOp}
                                            onEditError=${(msg) => setNotices([...notices, { changeId: `edit-${Date.now()}`, summary: msg }])}
                                            bulkActions=${[
                                                { label: 'Export selection', onClick: handleExportSelection },
                                                { label: 'Stage deletion', danger: true, onClick: handleBulkDelete },
                                            ]} />`;

    return html`
        <${Shell} realm="season" session=${session} view=${view} viewOptions=${['Track', 'Board']} onSetView=${setView}
                  badges=${{ review: stagedCount }}
                  masthead=${html`<${Masthead} eyebrow=${html`<${Eyebrow} live=${drawsLive} staged=${stagedCount} flags=${flagCount} />`}
                                               title=${state.live?.currentSeasonTitle || 'Season'}
                                               sub=${`${visibleWindow.start} → ${visibleWindow.end}`} stats=${seasonStats}
                                               actions=${html`
                                                   <${SeasonClock} season=${state.live} today=${todayIso()} />
                                                   <${AddChips} onAdd=${() => setShowAdd(true)} />`} />`}
                  viewSlot=${viewSlot} manifestSlot=${manifestSlot}
                  traySlot=${html`<${Tray} notices=${notices} onUndo=${(id) => setNotices(notices.filter(n => n.changeId !== id))} onDismiss=${(id) => setNotices(notices.filter(n => n.changeId !== id))} />`} />
    `;
}
