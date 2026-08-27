// portal/ui/season.js — ESM. The Season realm: Track/Board as the switchable view layer, Manifest (never switches) underneath. Covers /manage's draws/calendar/patchnotes/seasondraft/season pages (spec §8.2's join table) — visible if the signed-in admin holds ANY of them.
//
// buildSeasonAddOp/buildSeasonEditOp (season.logic.js) and editOpFor (track.logic.js) are read as bare GLOBALS, not imported -- both are loaded as classic <script> tags before this module (see track.js's own header comment for why). A literal `import {...} from './season.logic.js'` shipped here once and would throw in every real browser (no `export` statement exists in a classic script); found auditing this file for Task 4 and never actually exercised live before, since every prior verification pass used direct authenticated `fetch` calls or the signed-out Door page, neither of which loads this module as real ESM.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell, NoAccess, Masthead } from './shell.js';
import { fetchJson } from './httpClient.js';
import { useAsync, RealmShell } from './async.js';
import { OneWay } from './oneway.js';
import { stageOps, exportChangeset } from './composeClient.js';
import { downloadText } from './download.js';
import { useRef } from '../vendor/preact-hooks.mjs';
import { Board } from './board.js';
import { Manifest } from './manifest.js';
import { Tray } from './tray.js';
import { useOverlay, Drawer } from './overlay.js';
import { Composer } from './composer.js';
import { Track, Zoomer, Repairs } from './track.js';

// LANE_LABELS lives in season.logic.js (a bare global here, same pattern as buildSeasonAddOp/buildSeasonEditOp above) rather than a local const, so scripts/seasonOps.test.js can require() it directly instead of regex-scraping this ESM file's source text. Gap audit §3.4 finding 1: Manifest printed row.lane's raw collection-key value verbatim (e.g. "newDraws") since nothing humanized it for display. 🔴 THE ROW SAID WHAT A THING WAS CALLED AND NOTHING ABOUT WHAT IS IN IT. A draw's whole point is the items it carries and their rarity — the table showed a title, a type and a date, so the one question this list exists to answer needed a click per row. The adopted table styles a detail cell, tier chips, a secondary line and a right-aligned status column; all four were styled and unused.
const SEASON_COLUMNS = [
    { key: 'title', label: 'Item', editable: true },
    // row.typeLabel is stamped by toManifestRows and already resolves Playlist away from Event; LANE_LABELS stays as the fallback so a row built by anything older still reads correctly.
    { key: 'lane', label: 'Type', col: 'c-type', render: (row) => row.typeLabel || LANE_LABELS[row.lane] || row.lane,
      metaClass: 'rowlife',
      meta: (row) => (row.isDraft
          ? html`<span class="nextmark">NEXT SEASON</span>`
          : (LIFE_LABEL[rowLifecycle(row, todayIso())] || '')) },
    { key: 'window', label: 'Window', dataKind: 'nums',
      render: (row) => {
          const start = row.date ? fmtDay(row.date) : null;
          const end = (row.endDate || row.date) ? fmtDay(row.endDate || row.date) : null;
          if (!start) return html`<span class="none">no date</span>`;
          return end && end !== start
              ? html`${start} <span class="arw">→</span> ${end}`
              : html`${start}`;
      },
      meta: (row) => {
          const a = row.date ? new Date(String(row.date).slice(0, 10)) : null;
          const b = (row.endDate || row.date) ? new Date(String(row.endDate || row.date).slice(0, 10)) : null;
          if (!a || !b) return '';
          const days = Math.round((b - a) / 86400000) + 1;
          return `${days} day${days === 1 ? '' : 's'}`;
      } },
    // ⚠️ NO LABEL TEXT IN THE CELL. The window column two along already prints the dates; this one answers a different question — where in the season — and repeating the dates inside it would make the two columns argue about which is the answer.
    { key: 'span', label: 'Season', col: 'c-spark', render: (row) => {
        if (!row.span) return html`<span class="none">—</span>`;
        return html`
            <div class="sparkwrap">
                <span class="spark" style=${`--c:var(${row.topicVar || '--ink4'})`}>
                    <i class=${row.state === 'staged' ? 'staged' : ''} style=${`left:${row.span.left}%;width:${row.span.width}%`}></i>
                    ${row.nowPct === null || row.nowPct === undefined ? null
                        : html`<span class="nowdot" style=${`left:${row.nowPct}%`}></span>`}
                </span>
            </div>`;
    } },
    { key: 'detail', label: 'What it carries', dataKind: 'detail', render: (row) => {
        const tiers = rowTiers(row);
        const detail = rowDetail(row);
        return html`
            <div class="detcell">
                ${tiers.length ? html`<span class="tiers">${tiers.map((t) => html`<b key=${t} class=${TIER_CLASS[t] || ''}>${t.toUpperCase()}</b>`)}</span>` : null}
                ${detail ? html`<span class="dsub">${detail}</span>` : html`<span class="dsub"><span class="none">no detail</span></span>`}
                <!-- A draw's thumbnail is re-hosted on Cloudinary when it is saved; "not cached" is a fact
                     about THIS record, and the only place it was visible before was a Discord card. -->
                ${row.lane === 'calendar' ? null : html`<span class=${'thumb ' + (row.thumbnailUrl ? 'ok' : 'no')}>${row.thumbnailUrl ? 'cached' : 'no image'}</span>`}
            </div>`;
    } },
    // ⚠️ THE WARNING RIDES BESIDE THE STATE, not in a column of its own: "this outlives the battle pass" is a qualification of what the row IS, and a whole column for a mark that is absent on most rows is a column of empty cells.
    { key: 'state', label: 'State', dataKind: 'right',
      render: (row) => html`${row.state}${row.outlivesSeason
          ? html`${' '}<span class="warnmark" data-tip="Ends after the battle pass does">!</span>` : null}` },
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


// Builds the id/lane-carrying items Track's <Bar> and track.logic.js's editOpFor both expect -- deliberately a DIFFERENT shape from toManifestRows' rows (Manifest uses lane values 'newDraws'/ 'returningDraws'/'calendar'; Track uses its own topic vocabulary 'draw'/'returning'/'event', matching track.logic.js's LANE_ORDER and TOPIC_VAR) so each stays a plain shape for its own consumer rather than one row shape trying to serve two different vocabularies. `startDate` is synthetic (draws have no such schema field) -- it exists purely so barGeometry has something to read; editOpFor strips it back out for a draw before it would ever reach core/ops/draws.js.
function toTrackItems(live, path, lane) {
    return (live?.[path] || []).map((item) => ({
        ...item, id: String(item._id), kind: lane, lane,
        startDate: item.startDate || item.date, endDate: item.endDate || item.date,
    }));
}

// The Add composer -- a kind picker revealing only the fields that kind's op actually needs, rather than one form with every field always visible (spec §7: desktop-first, dense, no wasted chrome). ⚠️ `AddComposer` LIVED HERE AND IS GONE. It was a select and three bare inputs in a panel — the form the adopted design replaced with the inline composer above the Track (portal/ui/composer.js). Left in place it would have been a second way to add the same things, with a different vocabulary and no natural-language dates.

// ⚠️ IT READS THE TRACK'S OWN ITEMS, not a second query. `trackData` is what the Track is drawing at this moment, so a day that lists something the Track is not showing — or omits something it is — is impossible by construction rather than by care.
//
// ⚠️ THE DRAFT IS OFF BY DEFAULT AND SAYS SO. A day drawer that silently mixed staged next-season items into today's list would answer a question nobody asked, in the one place a person is checking what players actually see.
const DAY_LANE_LABEL = { draw: 'Draw', returning: 'Returning', event: 'Event', playlist: 'Playlist' };

function dayItems(source, day) {
    const out = [];
    for (const [lane, list] of Object.entries(source || {})) {
        for (const i of list || []) {
            const a = String(i.startDate || i.date || '').slice(0, 10);
            const b = String(i.endDate || i.startDate || i.date || '').slice(0, 10);
            if (a && a <= day && (b || a) >= day) out.push({ lane, title: i.title, a, b });
        }
    }
    return out.sort((x, y) => (x.a < y.a ? -1 : 1));
}

function DayDrawer({ day, live, draft, withDraft, onWithDraft, onClose }) {
    const rows = dayItems(live, day);
    const draftRows = withDraft && draft ? dayItems(draft, day) : [];
    const all = [...rows, ...draftRows.map((r) => ({ ...r, isDraft: true }))];
    return html`
        <${Drawer} eyebrow=${`season · ${day}`} title=${fmtDay(day)} onClose=${onClose}
                   actions=${html`<button class="btn" onClick=${onClose}>Close</button>`}>
            <div class="dwbody">
                ${all.length ? html`
                    <ul class="daylist">
                        ${all.map((i, n) => html`
                            <li key=${n}>
                                <b>${i.title}${i.isDraft ? html`${' '}<span class="nextmark">NEXT SEASON</span>` : null}</b>
                                <span class="dd">${DAY_LANE_LABEL[i.lane] || i.lane}</span>
                                <span class="dd">${i.b && i.b !== i.a ? `${fmtDay(i.a)} → ${fmtDay(i.b)}` : fmtDay(i.a)}</span>
                            </li>`)}
                    </ul>`
                : html`<p class="dw-p">Nothing runs on this day. The season continues — no draw, event or playlist
                    opens, runs or closes.</p>`}
                ${draft ? html`
                    <label class="dwcheck" style="margin-top:12px">
                        <input type="checkbox" checked=${withDraft} onChange=${(e) => onWithDraft(e.target.checked)} />
                        <span>Include the staged next-season draft. Players cannot see these.</span>
                    </label>` : null}
            </div>
        <//>`;
}

// 01-season-spine.html's Staged panel -- the mockup keeps pending changes visible and actionable right beside the Track instead of buried in the flat Manifest table below. describeOp/blockedReason are board.logic.js globals (every *.logic.js file loads on every page -- see track.js's header), the same functions Board's own cards already use, so the two views can never describe a change differently. Reads changesets Season already fetches; asks for nothing new.
function StagedPanel({ changesets, onDiscard, onReview, stagedOnly, onStagedOnly }) {
    const pending = (changesets || []).filter((c) => c.state === 'staged' || c.state === 'blocked');
    if (!pending.length) return null;
    // The staged strip in the adopted vocabulary: one row per change, tier first, and the ONE action that matters — review and commit — as the row of controls rather than a footer. A blocked change says why on its own row; a strip that hides the reason behind a click is a receipt.
    return html`
        <div class="callout stg" style="margin:0 22px 14px">
            <!-- 🔴 THE PANEL NAMED THE CHANGES AND THE TABLE BELOW DID NOT SHOW YOU WHICH ROWS THEY WERE. "3 staged" over 39 rows means finding three dashed borders by eye, and a staged DELETION has no row left to find at all. The chip is dashed for the same reason the staged rows are — the legend in the masthead already teaches that mark, so the control and the thing it selects look alike. -->
            ${onStagedOnly ? html`
                <button type="button" class="chip stagedchip" data-state="staged"
                        aria-pressed=${stagedOnly ? 'true' : 'false'}
                        data-tip="Show only the rows these changes touch"
                        onClick=${() => onStagedOnly(!stagedOnly)}>Staged only</button>` : null}
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
                                onClick=${() => onDiscard(c)}>×</button>
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

// Season is the ONLY realm with more than one kind of thing to add, so it is the only one that reveals its kinds. The others keep a single button, because a single button has nothing to reveal. Built from the lane table, so a kind cannot go missing here while existing on the Track. The composer's own type table: the label, the accent, and — the part the old select could not express — the SHAPE of the record behind it. A draw stores one date; an event stores a window. `hex` is a token rather than a literal because these are the season's own topic accents, which the Track and the Manifest already read from the same place.
const COMPOSE_TYPES = [
    { key: 'draw', label: 'Draw', hex: 'var(--draw)', shape: 'point', nameLabel: 'Draw name',
      placeholder: 'Crimson Moonlight', dateLabel: 'Releases',
      pointNote: 'A draw has no end date — the record stores the day it releases.' },
    { key: 'returning', label: 'Returning draw', hex: 'var(--ret)', shape: 'point', nameLabel: 'Draw name',
      placeholder: 'Havoc rerun', dateLabel: 'Returns',
      pointNote: 'A returning draw stores one date, the same as a new one.' },
    { key: 'event', label: 'Event', hex: 'var(--ev)', shape: 'span', nameLabel: 'Event name',
      placeholder: 'Clan Wars' },
    { key: 'playlist', label: 'Playlist', hex: 'var(--play)', shape: 'span', nameLabel: 'Playlist name',
      placeholder: 'Hardpoint 24/7' },
    { key: 'patchnote', label: 'Patch note', hex: 'var(--pn)', shape: 'point', nameLabel: 'Season title',
      placeholder: 'Season 8 — Codename', dateLabel: 'Releases',
      pointNote: 'The description and the images are written in /manage — this stages the season and its date.' },
];

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


// ── THE SEASON RECORD / IDENTITY STRIP ────────────────────────────────────────────────────────
//
// Harkirat on what the collapsed strip used to be: "Nothing about it suggests that it also encompasses the calendar page banner urls. The dates and titles inside of collapsed strip are not informative or sized correctly considering the level of information they hold. they feel like 3rd tier support information."
//
// Three complaints, one defect: it was written as a CAPTION for a thing that is a RECORD. So it names every kind of thing it holds — including the banners, which it never admitted to — sets the titles and dates at the scale of their content rather than as 10px chips, and says what opening it does instead of a bare "Live season" label.
//
// 🔴 IT DOES NOT SAY "17 DAYS LEFT". That belongs to the clock in the masthead. This shows the dates AS STORED, because this is the record you EDIT — and that split is what stops the two elements repeating each other, which is what made both feel redundant.
const BANNERS = [
    { k: 'drawsBannerUrl', label: 'Draws', hex: 'var(--draw)' },
    { k: 'eventsBannerUrl', label: 'Events', hex: 'var(--ev)' },
    { k: 'playlistsBannerUrl', label: 'Playlists', hex: 'var(--play)' },
];

const IDENTITY_KEY = 'dioreo-identity-open';

function SeasonRecord({ season, editingDraft, draftStaged, today }) {
    const titled = (season?.currentSeasonTitle || '').trim();
    // Silent unless it is genuinely late AND nothing is staged. One line, never repeated, gone the moment a draft exists — "make it smart and suggest things to prep/stage for the next season. but dont make it naggy."
    const near = seasonMoments(season, today)[0];
    const daysOut = near ? Math.ceil((new Date(near.iso + 'T23:59:59Z').getTime() - new Date(today + 'T00:00:00Z').getTime()) / 86400000) : null;
    const nudge = !editingDraft && !draftStaged && daysOut !== null && daysOut <= 7;

    // 🔴 ONE GRID, NOT SIX. Every cell used to arrange itself from its own content, so six titles began at six different x positions and the dates were not even right-aligned to each other. `.srec-c` is display:contents, which dissolves each cell so all eighteen parts land in ONE grid whose label column is sized by the widest label ACROSS ALL SIX.
    return html`
        <div class="srec">
            <div class="srec-top">
                <span class="srec-kind">Titles, dates and calendar banners</span>
                <span class=${'srec-state' + (editingDraft ? ' staged' : '')}>${editingDraft ? 'staged draft' : 'live'}</span>
            </div>
            <p class=${'srec-title' + (titled ? '' : ' untitled')}>${titled || 'No season title set'}</p>
            <div class="srec-grid">
                ${SEASON_LINES.map((L) => {
                    const t = (season?.[L.titleKey] || '').trim();
                    const tbd = season?.[L.tbdKey], iso = season?.[L.endKey];
                    return html`
                        <div class="srec-c" key=${L.key} style=${`--c:${L.hex}`}>
                            <span class="k">${L.label}</span>
                            <span class=${'t' + (t ? '' : ' unset')}>${t || 'no title set'}</span>
                            <span class=${'d' + (tbd || !iso ? ' tbd' : '')}>${tbd ? 'TBD' : (iso ? fmtDay(iso) : 'no date')}</span>
                        </div>`;
                })}
                <!-- 🔴 A DOT, NOT THE WORD "set". A short word at the end of a row reads as a BUTTON —
                     "set", "open", "edit" and "clear" are all things you do. This column holds a DATE
                     in the rows above, so a verb here also broke the peerage the shared treatment
                     establishes. The ABSENT state is the one that matters, so it is the one marked. -->
                ${BANNERS.map((b) => {
                    const on = (season?.[b.k] || '').trim();
                    return html`
                        <div class=${'srec-c' + (on ? '' : ' off')} key=${b.k} style=${`--c:${b.hex}`}>
                            <span class="k">${b.label}</span>
                            <span class=${'t' + (on ? '' : ' unset')}>${on ? 'image cached and serving' : 'no image set'}</span>
                            <span class="d" role="img" aria-label=${on ? 'set' : 'not set'}><em></em></span>
                        </div>`;
                })}
            </div>
            ${nudge ? html`
                <div class="srec-nudge"><b>Next season isn’t staged.</b> A draft lets you build it — titles, dates,
                    draws and calendar — without any of it going live.</div>` : null}
        </div>`;
}

// `editingDraft` is WHICH season you are editing; `draftStaged` is whether one exists at all. They were one flag, and the record read "staged draft" on the live season purely because a draft existed — the chip states the thing you are looking at, not the thing that exists elsewhere. 🔴 `editingDraft` WAS A PROP THE CALLER HARDCODED TO FALSE. It reached SeasonRecord, which styles the summary strip for it, and nothing could ever set it — so the whole draft half of this component was built, styled and unreachable. The switch is what the mockup specifies: one editor, two seasons, and which one you are editing said out loud rather than inferred from what the fields happen to contain.
export function SeasonIdentity({ season, editingDraft, draftStaged, today, onSave, onScope }) {
    const [open, setOpen] = useState(() => { try { return sessionStorage.getItem(IDENTITY_KEY) === '1'; } catch { return false; } });
    const [edits, setEdits] = useState({});
    const value = (k) => (k in edits ? edits[k] : (season?.[k] ?? ''));
    const dirty = Object.keys(edits).length;

    function toggle() {
        setOpen((o) => { try { sessionStorage.setItem(IDENTITY_KEY, o ? '0' : '1'); } catch (e) {} return !o; });
    }
    function set(k, v) { setEdits((e) => ({ ...e, [k]: v })); }

    const titled = (season?.currentSeasonTitle || '').trim();
    return html`
        <section class=${'identity' + (open ? '' : ' collapsed') + (editingDraft ? ' editing-draft' : '')} aria-label="Season identity">
            <!-- The strip IS the button — role, tabindex, cursor, hover and aria-expanded all live on
                 it. A floating "Open to edit" label was an apology for an affordance that already
                 existed, and it sat wherever margin-left:auto dropped it. The words move into the
                 accessible name, where a keyboard user actually needs them. -->
            <div class="idsum" role="button" tabindex="0" aria-expanded=${open}
                 aria-label=${`Season record: ${titled || 'no title set'}. Open to edit titles, dates and calendar banners.`}
                 onClick=${toggle}
                 onKeyDown=${(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}>
                <${SeasonRecord} season=${season} editingDraft=${editingDraft} draftStaged=${draftStaged} today=${today} />
            </div>
            <div class="idbody">
                <div class="ph idhead">
                    <span class="t">Season identity</span>
                    ${onScope ? html`
                        <!-- ⚠️ SWITCHING SCOPE DROPS THE UNSAVED EDITS, and that is the honest behaviour rather than a shortcut. The edits are keyed by field name and both seasons carry the same field names, so carrying them across would apply the live season's half-typed title to the draft with nothing on screen saying it had moved. -->
                        <div class="lnsw" role="group" aria-label="Which season">
                            <button aria-pressed=${!editingDraft} onClick=${() => { setEdits({}); onScope('live'); }}>
                                <span class="pip"></span>Live</button>
                            <button aria-pressed=${editingDraft} onClick=${() => { setEdits({}); onScope('draft'); }}>
                                <span class=${'pip ' + (draftStaged ? 'draft' : 'none')}></span>Next</button>
                        </div>` : null}
                    <span class="sp">${dirty ? `${dirty} unsaved edit${dirty > 1 ? 's' : ''}` : 'no unsaved edits'}</span>
                    <button class="idclose" onClick=${() => { if (dirty) onSave(edits); setEdits({}); toggle(); }}>Done</button>
                </div>
                ${editingDraft ? html`
                    <div class="draftnote">
                        <b>Editing the next season.</b> Nothing here is visible to players. Promoting it is in the
                        one-way strip at the foot of this page.
                    </div>` : null}
                <div class="f-main">
                    <label for="f-title">Season title</label>
                    <input id="f-title" autocomplete="off" spellcheck="false" placeholder="Season title"
                           value=${value('currentSeasonTitle')} onInput=${(e) => set('currentSeasonTitle', e.target.value)} />
                </div>
                <div class="dlines">
                    ${SEASON_LINES.map((L) => {
                        const tbd = Boolean(value(L.tbdKey));
                        return html`
                            <div class=${'dline' + ((L.titleKey in edits || L.endKey in edits || L.tbdKey in edits) ? ' dirty' : '')}
                                 key=${L.key} style=${`--c:${L.hex}`}>
                                <span class="trk">${L.label}</span>
                                <input type="text" aria-label=${`${L.label} title`} spellcheck="false"
                                       value=${value(L.titleKey)} onInput=${(e) => set(L.titleKey, e.target.value)} />
                                <input type="date" aria-label=${`${L.label} end date`} disabled=${tbd}
                                       value=${String(value(L.endKey) || '').slice(0, 10)} onInput=${(e) => set(L.endKey, e.target.value)} />
                                <!-- A date and "TBD" are two different ANSWERS to one question, not a
                                     field and a checkbox — so they are one control with two states. -->
                                <!-- 🔴 A DATE FIELD ANSWERS "WHEN", AND NOBODY OPENS THIS PANEL TO ASK "WHEN". They open it to find out whether there is time — and every reader was subtracting today's date from an ISO string in their head, three times, once per line. TBD says so rather than showing a number it does not have; a date already past says so rather than counting up. -->
                                ${(() => {
                                    const raw = String(value(L.endKey) || '').slice(0, 10);
                                    if (tbd) return html`<span class="dl-left is-tbd">no date yet</span>`;
                                    if (!raw) return html`<span class="dl-left is-tbd">not set</span>`;
                                    const d = Math.round((Date.parse(raw + 'T00:00:00Z') - Date.parse(todayIso() + 'T00:00:00Z')) / 86400000);
                                    if (!Number.isFinite(d)) return html`<span class="dl-left is-tbd">unreadable</span>`;
                                    if (d < 0) return html`<span class="dl-left is-over">${-d}d ago</span>`;
                                    return html`<span class="dl-left">${d === 0 ? 'today' : `${d}d left`}</span>`;
                                })()}
                                <span class="tbdsw" role="group" aria-label=${`${L.label} end is`}>
                                    <button aria-pressed=${!tbd} onClick=${() => set(L.tbdKey, false)}>DATE</button>
                                    <button aria-pressed=${tbd} onClick=${() => set(L.tbdKey, true)}>TBD</button>
                                </span>
                            </div>`;
                    })}
                </div>
                <!-- Three independent banners, one per /calendar page. Blank means "show nothing" —
                     NOT a placeholder — so an empty field is a real, meaningful value and says so.
                     🔴 ABSENT ON THE DRAFT, AND THE SAVE GUARD WAS NOT ENOUGH. calendar.setBanners writes the LIVE
                     document; there is no draft equivalent. Guarding only the save left three inputs on screen that
                     accepted a URL and dropped it — the same class of silent no-op this editor was just fixed for,
                     re-introduced two lines away from the fix. A field that cannot be saved must not be offered. -->
                ${editingDraft ? null : html`
                <div class="bansec">
                    <div class="bansec-h"><span class="bansec-n">Calendar page banners</span></div>
                    <div class="bans">
                        ${BANNERS.map((b) => {
                            const v = String(value(b.k) || '');
                            return html`
                                <div class="ban" key=${b.k} style=${`--c:${b.hex}`}>
                                    <span class="bl">${b.label}</span>
                                    <span class=${'bthumb' + (v ? ' has' : '')}
                                          style=${v ? `background-image:url("${v}")` : null}>${v ? '' : 'none'}</span>
                                    <input type="url" spellcheck="false" aria-label=${`${b.label} page banner URL`}
                                           placeholder="Paste an image URL — blank shows no banner"
                                           value=${v} onInput=${(e) => set(b.k, e.target.value.trim())} />
                                    <span class="bst">${b.k in edits ? 'will re-host on save' : (v ? 'cached' : 'no banner')}</span>
                                </div>`;
                        })}
                    </div>
                </div>`}
            </div>
        </section>`;
}


// `?today=` travels the clock in the harness; in production this is simply today.
const todayIso = () => (typeof document !== 'undefined' && document.documentElement.dataset.today)
    || new Date().toISOString().slice(0, 10);

// ── THE NEXT SEASON, STAGED AND INVISIBLE ─────────────────────────────────────────────────────
//
// A draft is the whole next season — titles, deadlines, draws, calendar — built where players cannot see it. It sits directly under the identity editor because that is what a draft IS: a second copy of those same fields, and putting it anywhere else would make the relationship a thing you have to be told rather than a thing you can see.
//
// ⚠️ PROMOTE IS NOT HERE. It is the one draft operation that cannot be taken back, so it lives in the one-way strip at the foot of the realm with the other six — and this bar says so, because a reader who has staged a draft and cannot find the button will conclude the feature is unfinished rather than that it is somewhere safer. 🔴 PROMOTE IS THE ONE IRREVERSIBLE OPERATION IN THIS REALM AND ITS EFFECT COULD NOT BE INSPECTED. The scope switch let you EDIT the draft; nothing showed the difference between it and what is live. Compare answers the only question worth asking before a one-way replace: what actually changes. It sits in the draft bar rather than in the strip below, because you read it while deciding, not while confirming.
function DraftCompare({ live, draft }) {
    const { rows, identical } = draftDiff(live, draft, (iso) => fmtDay(iso));
    if (identical) return html`<div class="diff"><div class="diff-none">The draft is identical to what is live.</div></div>`;
    return html`
        <div class="diff">
            <div class="diff-h"><span>FIELD</span><span>LIVE NOW</span><span>AFTER PROMOTE</span></div>
            ${rows.map((r) => html`
                <div class="diff-r" key=${r.key}>
                    <span class="dk">${r.key}</span>
                    <span class="dwas">${r.was || '—'}</span>
                    <span class=${'dnow' + (r.add ? ' add' : '')}>${r.now || '—'}</span>
                </div>`)}
        </div>`;
}

function DraftZone({ draft, live, onStart, onDiscard }) {
    const [title, setTitle] = useState('');
    const [comparing, setComparing] = useState(false);
    if (!draft || !draft.active) {
        return html`
            <div class="nodraft">
                <p>No next season staged. A draft lets you build the whole next season — titles, deadlines, draws
                    and calendar — without any of it going live.</p>
                <div style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap">
                    <input class="nw-i" style="flex:0 1 240px;width:auto" type="text" aria-label="Next season title"
                           placeholder="Season 8 — …" value=${title}
                           onInput=${(e) => setTitle(e.target.value)} />
                    <button class="chip" disabled=${!title.trim()} onClick=${() => onStart(title.trim())}>Start a draft</button>
                </div>
            </div>`;
    }
    const n = (draft.newDraws || []).length + (draft.returningDraws || []).length + (draft.calendar || []).length;
    return html`
        <div class="draftbar">
            <span class="dt">Next season staged</span>
            <span class="dsub">${draft.currentSeasonTitle || 'untitled'} · ${n} item${n === 1 ? '' : 's'} ·
                not visible to players</span>
            <span class="sp"></span>
            <span class="dsub">Promote is in the one-way strip below.</span>
            <button class="chip" aria-pressed=${comparing ? 'true' : 'false'} onClick=${() => setComparing(!comparing)}>Compare</button>
            <button class="chip danger" onClick=${onDiscard}>Discard draft</button>
        </div>
        ${comparing ? html`<${DraftCompare} live=${live} draft=${draft} />` : null}`;
}

// ── THE PATCH-NOTE RECORD ─────────────────────────────────────────────────────────────────────
//
// ⚠️ NOT `SeasonRecord` — that name is already taken, by the identity strip's own summary line, and the collision was caught by the build's ES-module parse rather than by `node --check`, which accepts a duplicate top-level declaration in CommonJS. This one lists what has been PUBLISHED; that one summarises what the season IS.
//
// 🔴 THE PORTAL COULD PUBLISH A PATCH NOTE AND PURGE EVERY ONE, AND NOTHING IN BETWEEN. patchnote.setDateInfo, setUrls1, setUrls2 and editSeason are all declared, tiered and permissioned in core/ops, and none of them had an affordance — so a typo in a published season title was fixable only from Discord. Found by counting what the registry declares against what the surface offers, which is the one check shape that can see a thing that is not there.
//
// 🔴 THE PANEL IS A SPINE, NOT A TABLE, and the mockup's own note says why: the record is a sequence, the newest entry is the one Discord is currently serving, and a list that renders them all alike hides which one that is. The marker on the current row is filled; the others are outlines on the same thread.
//
// ⚠️ IT SITS ABOVE THE ONE-WAY STRIP, which is deliberate: the strip's patch-notes purge destroys exactly what this panel lists, so the count you are about to lose is on screen directly above the control that loses it.
function PatchEditor({ entry, onStage, onClose }) {
    const [draft, setDraft] = useState({
        titleOverride: entry.titleOverride, description: entry.description,
        releaseDateText: entry.releaseDateText, urls: entry.images.join('\n'),
    });
    const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
    const urlList = draft.urls.split('\n').map((u) => u.trim()).filter(Boolean);
    const { ops, blocked } = patchEditOps(entry, { ...draft, urls: urlList });
    const over = urlList.length > MAX_PATCH_IMAGES;

    return html`
        <div class="bed-sec" style="margin:12px 4px 0">
            <h5>${entry.current ? 'Editing the current entry' : 'Editing a past season'}${' '}
                <em>${entry.current ? 'date/info and each image slot stage separately, as they do in Discord' : 'one edit, carrying every field'}</em></h5>
            <div class="bed-g2">
                <label class="dwfield"><span>Title override <i>blank keeps the season title it was published under</i></span>
                    <input value=${draft.titleOverride} placeholder=${entry.title}
                           onInput=${(e) => set({ titleOverride: e.target.value })} /></label>
                <label class="dwfield"><span>Release date <i>read by the same parser the bot uses</i></span>
                    <input value=${draft.releaseDateText} spellcheck="false" placeholder="July 22, 2026 7:20 AM"
                           onInput=${(e) => set({ releaseDateText: e.target.value })} /></label>
            </div>
            <label class="dwfield"><span>Additional info <i>rendered under the images; b:, n: and f: become the buff, nerf and fix marks</i></span>
                <textarea rows="4" value=${draft.description} onInput=${(e) => set({ description: e.target.value })}></textarea></label>
            <label class="dwfield">
                <span>Images <i>one URL per line — the first five are slot 1, the next five slot 2</i></span>
                <textarea rows="5" spellcheck="false" value=${draft.urls} onInput=${(e) => set({ urls: e.target.value })}></textarea></label>
            <!-- Each URL is re-hosted through Cloudinary on commit, keyed by this entry's own id, which is
                 why an untouched slot is never restaged: resubmitting five unchanged URLs re-uploads five
                 images to say nothing at all. -->
            <p class="attnote">${urlList.length} of ${MAX_PATCH_IMAGES} used.${' '}
                ${over ? html`<b>Only the first ${MAX_PATCH_IMAGES} would be kept.</b>` : ''}${' '}
                Every URL is re-hosted on Cloudinary when this commits, so a link that dies later does not take the patch note with it.</p>
            <div class="attfoot">
                <!-- ⚠️ A DISABLED BUTTON HAS TO SAY WHICH KIND OF NOTHING IT MEANS. Blanking the release date
                     read as "Nothing changed yet" — the same words as an untouched form — while the real
                     reason was a refusal, and the refusal itself sat in a paragraph below. Measured on the
                     page, not reasoned about: the two states were indistinguishable at the control. -->
                <button class="pill lead" disabled=${!ops.length} onClick=${() => onStage(ops)}>
                    ${ops.length ? `Stage ${ops.length} change${ops.length === 1 ? '' : 's'}`
                        : (blocked ? 'Fix the release date first' : 'Nothing changed yet')}</button>
                <button class="pill" onClick=${onClose}>Close</button>
                ${blocked ? html`<span class="attnote" style="color:var(--warn)">${blocked}</span>` : null}
            </div>
        </div>
    `;
}

function PatchRecord({ live, openId, onOpen, onPublish, onStage }) {
    const rows = patchRecordRows(live);
    const open = rows.find((r) => r.id === openId) || null;
    return html`
        <section class="rec rec-b" aria-label="Season record">
            <header class="rec-h">
                <span class="rec-t">Season record</span>
                <span class="rec-n">${rows.length} published · newest first</span>
                <button type="button" class="rec-cta" onClick=${onPublish}>+ Publish</button>
            </header>
            <ol class="rec-list">
                ${rows.length ? rows.map((n) => html`
                    <li key=${n.id} class=${'rec-row' + (n.current ? ' cur' : '')} tabindex="0" role="button"
                        aria-expanded=${openId === n.id ? 'true' : 'false'}
                        onClick=${() => onOpen(openId === n.id ? null : n.id)}
                        onKeyDown=${(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(openId === n.id ? null : n.id); } }}>
                        <span class="rec-mk"></span>
                        <span class="rec-ttl">${n.title}</span>
                        <span class="rec-d">${n.releaseDateText || '—'}</span>
                        <span class="rec-meta">${n.images.length} img</span>
                        <span class="rec-tag">${n.current ? 'current' : 'history'}</span>
                    </li>`)
                : html`<li class="rec-empty">Nothing published this season yet.</li>`}
            </ol>
            ${open ? html`<${PatchEditor} entry=${open} onStage=${(ops) => onStage(open, ops)} onClose=${() => onOpen(null)} />` : null}
        </section>
    `;
}

export function SeasonRealm({ session }) {
    const [view, setView] = useState('Track');
    // useAsync replaces the useState/useEffect pair AND the two lines that used to stand in for six states. Its `reload` is what a refresh calls, which is also what makes the is-refreshing hairline work without any realm knowing the class exists.
    const load = useAsync(() => fetchSeasonState(), []);
    const state = load.data;
    const [changesets, setChangesets] = useState([]);
    const [notices, setNotices] = useState([]);
    const overlay = useOverlay();
    // 🔴 THE FIVE ADD CHIPS ALL DID THE SAME THING. Each passed its own key to `onAdd` and every call site threw it away with `() => setShowAdd(true)`, so clicking Playlist and clicking Draw opened an identical form defaulted to Draw — five controls, one behaviour, and the only way to notice was to click two of them. The state IS the type now, so the chip you press is the type the composer opens on.
    const [showAdd, setShowAdd] = useState(null);   // the chip's own key, or null
    const [stagedOnly, setStagedOnly] = useState(false);
    // 🔴 THE TRACK ANSWERED "WHAT IS IN THIS SEASON" AND NEVER "WHAT IS ON THIS DAY". Reading a single date off it meant sighting down a vertical from the ruler across five lanes and hoping nothing was clipped — the one question a calendar is for. The crosshair already knows the date under the pointer; this is what clicking it is worth.
    const [dayOpen, setDayOpen] = useState(null);
    const [dayWithDraft, setDayWithDraft] = useState(false);
    const [zoomedWindow, setZoomedWindow] = useState(null);   // null = fitted to the whole season
    const [idScope, setIdScope] = useState('live');
    const [openPatchId, setOpenPatchId] = useState(null);
    const [composeGhost, setComposeGhost] = useState(null);           // which season the identity editor is editing

    // Board has nothing to show without this — a review pass found the list endpoint and this fetch were both missing entirely, so the Board column stayed permanently empty regardless of what was actually staged.
    useEffect(() => { fetchChangesets('season').then(setChangesets); }, [view]);

    if (!state) return html`<${RealmShell} realm="season" session=${session} error=${load.error} slow=${load.slow}
                                           onRetry=${load.reload} skeleton=${{ rows: 9, lines: [26, 34, 16, 12] }} />`;

    // Renamed from `window` (Task 4) -- that name silently SHADOWED the real browser global for the rest of this component's body, including handleExportSelection's `window.open()` call below, which was a live, never-yet-clicked bug (TypeError: window.open is not a function, since that identifier resolved to this {start,end} object instead of the global). Found auditing this file for Track's own drag handles, which genuinely need the real global.
    //
    // seasonWindow (season.logic.js, a bare global) replaces what used to be an inline {start: today, end: live.bpEnd || today}. With bpEnd unset -- the dev database's actual state -- that made start === end, so barGeometry divided by a 1ms window and every bar on the Track collapsed to a sliver at 0%. See that function's own header. 🔴 THE WINDOW IS STATE NOW, AND `null` MEANS FIT. Keeping "fitted" as an absence rather than a copy of the fit window means the plot re-fits when the season's own extent changes — staging a draw three weeks past the battle pass widens the axis instead of leaving the new bar outside a window that was correct when it was captured.
    const fullWindow = seasonWindow(state.live);
    const visibleWindow = zoomedWindow ? clampWindow(zoomedWindow, fullWindow) : fullWindow;

    async function handleExport(changeset) {
        const res = await exportChangeset(changeset._id, session.csrfToken);
        const refused = refusalOf(res);
        if (refused) return overlay.say(`Not exported — ${refused}`);
        overlay.say('Export saved. This change can commit now.');
        fetchChangesets('season').then(setChangesets);
    }

    // Mockup's Staged panel (01-season-spine.html) shows Discard as a first-class action, but no route ever set state:'discarded' anywhere in the portal before this — the only way out of a staged/blocked change was to commit it. Ownership-scoped exactly like export/commit above.
    async function handleDiscard(changesetId) {
        const res = await fetchJson(`/api/changeset/${changesetId}/discard`, { method: 'POST', headers: { 'x-csrf-token': session.csrfToken } });
        const refused = refusalOf(res);
        if (refused) return overlay.say(`Not discarded — ${refused}`);
        fetchChangesets('season').then(setChangesets);
    }

    // ⚠️ `handleCommit` LIVED HERE AND IS GONE. Season stopped being able to commit when board.js's duplicate review panel was removed — the Review realm is the only surface that writes, and a live commit function on a page that no longer has a control for it is the next session's accident.

    // 🔴 ONE CHANGESET FOR THE WHOLE PASTE, not one per line. Eight pasted draws staged as eight changesets would fill the Review screen with eight separate transactions to commit, each individually discardable — which is not what a person who pasted one list means. stageOps already takes an array; this is the caller finally passing one. 🔴 THE DRAFT PATH REPLACES; THE LIVE PATH ADDS. core/ops/season.js's draft bulk ops `$set` the whole array — that is the Discord modal's semantics, where the textarea IS the list — while the live path composes one add per row. Two genuinely different operations behind one paste box, so the confirmation has to say which one is about to happen; a toast afterwards saying "replaced" would be telling somebody what they had already lost.
    async function handleStageDraftMany(kind, rawText) {
        if (kind === 'patchnote') {
            return overlay.say('Patch notes have no draft — they are one history, not a per-season list.');
        }
        const isDraw = kind === 'draw' || kind === 'returning';
        const op = isDraw
            ? { type: 'season.bulkDraftDraws', target: null,
                payload: kind === 'draw' ? { newText: rawText } : { returningText: rawText } }
            : { type: 'season.bulkDraftCalendar', target: null, payload: { text: rawText } };
        const noun = isDraw ? (kind === 'draw' ? 'new draws' : 'returning draws') : 'calendar';
        overlay.confirm({
            op: op.type, tier: 2, confirmLabel: 'Replace the draft list',
            title: `Replace the draft's ${noun}?`,
            body: html`<p class="dw-p">Pasting into the next season <b>replaces</b> that list rather than adding to
                it — the box is the list. Nothing live changes, and nothing is visible to players until the draft is
                promoted. Tier 2, so the previous draft list is captured and can be put back.</p>`,
            onConfirm: async () => {
                const res = await stageOps('season', [op], session.csrfToken);
                const refused = refusalOf(res);
                if (refused) return overlay.say(`Not staged — ${refused}`);
                setShowAdd(null);
                overlay.say(`The draft's ${noun} staged.`, 'Review', () => { location.hash = '#/review'; });
                fetchChangesets('season').then(setChangesets);
            },
        });
    }

    async function handleStageMany(kind, rows, rawText) {
        if (idScope === 'draft') return handleStageDraftMany(kind, rawText);
        const ops = rows.map((r) => buildSeasonAddOp(kind, { title: r.name, startDate: r.start, endDate: r.end || r.start }));
        if (!ops.length) return;
        await stageOps('season', ops, session.csrfToken);
        setShowAdd(null);
        overlay.say(`${ops.length} ${ops.length === 1 ? 'item' : 'items'} staged from what you pasted.`, 'Review', () => { location.hash = '#/review'; });
        fetchChangesets('season').then(setChangesets);
    }

    async function handleAdd(op) {
        await stageOps('season', [op], session.csrfToken);
        setShowAdd(null);
        fetchChangesets('season').then(setChangesets);
    }

    // 🔴 THE PORTAL COULD PROMOTE A DRAFT IT HAD NO WAY TO CREATE. core/ops declares five draft operations and /manage reaches all five; the portal reached none, so the promote row added to the one-way strip was an action on a thing nobody could make. A capability whose only entry point is somewhere else is not a capability this surface has.
    //
    // ⚠️ STARTING A DRAFT IS TIER 1, NOT A DESTRUCTIVE ACT, and the copy has to say so or nobody will press it. season.setDraftTitlesDeadlines sets draft.active and touches nothing live — the whole point of a draft is that it is invisible to players until promoted, which is the one-way step and lives in the strip below.
    async function startDraft(title) {
        const op = { type: 'season.setDraftTitlesDeadlines', target: null, payload: { mainTitle: title } };
        const res = await stageOps('season', [op], session.csrfToken);
        const refused = refusalOf(res);
        if (refused) return overlay.say(`Draft not started — ${refused}`);
        overlay.say('Draft staged. Nothing is public until you promote it.', 'Review', () => { location.hash = '#/review'; });
        fetchChangesets('season').then(setChangesets);
    }

    function confirmDiscardDraft() {
        const d = state.draft || {};
        const n = (d.newDraws || []).length + (d.returningDraws || []).length + (d.calendar || []).length;
        overlay.confirm({
            op: 'season.discardDraft', tier: 2, danger: true, confirmLabel: 'Discard the draft',
            title: 'Discard the staged draft?',
            body: html`<p class="dw-p">This throws away the draft's title, deadlines and its${' '}
                <b>${n} staged item${n === 1 ? '' : 's'}</b>. Nothing live changes — a draft has never been visible
                to players. Tier 2, so it is recorded with its inverse and can be put back.</p>`,
            onConfirm: async () => {
                const res = await stageOps('season', [{ type: 'season.discardDraft', target: null, payload: {} }], session.csrfToken);
                const refused = refusalOf(res);
                if (refused) return overlay.say(`Not discarded — ${refused}`);
                overlay.say('Discard staged.', 'Review', () => { location.hash = '#/review'; });
                fetchChangesets('season').then(setChangesets);
            },
        });
    }

    // A one-way op stages exactly like every other one — that is the point. What makes it different is downstream: it lands as tier 3, and Review will not commit it until the export exists. The toast names the next step because the reader has just pressed something frightening and needs to know what did and did not happen.
    async function handleOneWay(op, item) {
        const res = await stageOps('season', [op], session.csrfToken);
        const refused = refusalOf(res);
        if (refused) return overlay.say(`Not staged — ${refused}`);
        overlay.say(`${item.title} staged — it needs an export before it can commit.`, 'Review', () => { location.hash = '#/review'; });
        fetchChangesets('season').then(setChangesets);
    }

    // "Change type…" and "Shift dates…" from the approved mockup's bulk bar need an inline amount/type input Manifest's bulkActions shape doesn't carry (onClick(ids) takes no extra argument) -- deliberately scoped out of this pass rather than reaching for a native prompt(), which this session already removed from Access's Revoke for the same UX reason. Stage deletion and Export selection need no such input and are built here. toManifestRows/stateForElement now live in season.logic.js (bare global, same pattern as LANE_LABELS above) -- real state derivation needs `changesets` (already fetched for Board), so it moved out of a browser-only local function to become properly testable.
    const allRows = toManifestRows(state.live, changesets, state.draft);
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
        overlay.say(`${ops.length} deletion${ops.length === 1 ? '' : 's'} staged.`, 'Review', () => { location.hash = '#/review'; });
        fetchChangesets('season').then(setChangesets);
    }

    // Season's deletions STAGE, like everything else it composes — so the confirmation's job is to say that, and to name the items, because a draw and a calendar event are the same row shape here and a reader picking three of thirty needs to see which three.
    function confirmBulkDelete(ids) {
        const chosen = rowsById(ids);
        overlay.confirm({
            op: 'season.delete', tier: 2, danger: true, confirmLabel: 'Stage deletion',
            title: `Stage deletion of ${ids.length} item${ids.length === 1 ? '' : 's'}?`,
            body: html`
                <p class="dw-p">Nothing leaves the season yet — this stages the deletion, and the items keep
                    showing in Discord until the changeset is committed on the Review screen.</p>
                <ul class="dw-l">${chosen.slice(0, 6).map((r) => html`<li key=${r.id}>${r.title}</li>`)}
                    ${ids.length > 6 ? html`<li>and ${ids.length - 6} more</li>` : null}</ul>`,
            onConfirm: () => handleBulkDelete(ids),
        });
    }

    // 🔴 THIS BUILT A CAPTION AND CALLED IT AN EXPORT, then handed it to `window.open('data:…')`, which browsers block — measured in this app: the call returns null and nothing happens. So the button ran, said nothing and produced no file, and the text it would have produced (`title — window`) is read back by nothing anyway. A selection now writes the same TSV the Manifest shows, and whole-list backups live in the masthead's Export strip, in the bot's own formats.
    function handleExportSelection(ids) {
        const rows = rowsById(ids);
        const header = ['Title', 'Type', 'Window', 'State'].join('\t');
        const body = rows.map((r) => [r.title, r.type || '', r.window || '', r.state || ''].join('\t')).join('\n');
        downloadText(`dioreo-season-selection-${todayIso()}.tsv`, `${header}\n${body}`, 'text/tab-separated-values;charset=utf-8');
    }

    // ⚠️ EACH SCOPE STATES ITS OWN SHAPE. Three of these four re-import and one does not — `formatPatchNotesAsText` is a read format with no bulk-add flow behind it — and one note claiming "the format the paste box accepts" for all four would tell somebody they hold a backup of their patch notes that nothing can restore.
    const exportScopes = [
        { id: 'season.draws', label: 'New draws', unit: 'draws', count: (state.live?.newDraws || []).length,
          url: '/api/season/export?scope=draws', filename: `dioreo-new-draws-${todayIso()}.txt`,
          note: 'Title, items, date, thumbnail — the exact line format Bulk Add New Draws reads back.' },
        { id: 'season.returning', label: 'Returning draws', unit: 'draws', count: (state.live?.returningDraws || []).length,
          url: '/api/season/export?scope=returning', filename: `dioreo-returning-draws-${todayIso()}.txt`,
          note: 'The same line format, for the returning list.' },
        { id: 'season.calendar', label: 'Calendar', unit: 'entries', count: (state.live?.calendar || []).length,
          url: '/api/season/export?scope=calendar', filename: `dioreo-calendar-${todayIso()}.txt`,
          note: 'Prefixed bullet lines — a different shape from the draws export, and what Add Multiple reads.' },
        { id: 'season.patchnotes', label: 'Patch notes', unit: 'entries', count: (state.live?.patchNotes || []).length,
          url: '/api/season/export?scope=patchnotes', filename: `dioreo-patch-notes-${todayIso()}.txt`,
          note: 'A readable record, NOT a re-importable one — patch notes have no bulk-add flow to read it back.' },
    ];

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

    async function handleIdentitySave(edits) {
        // Two ops, because they are two entities: the season document's own titles and dates, and the calendar's banner urls. Splitting them here rather than server-side keeps each op's payload exactly what its own validate() expects.
        const bannerKeys = BANNERS.map((b) => b.k);
        const seasonEdits = Object.fromEntries(Object.entries(edits).filter(([k]) => !bannerKeys.includes(k)));
        const bannerEdits = Object.fromEntries(Object.entries(edits).filter(([k]) => bannerKeys.includes(k)));
        const ops = [];
        // ⚠️ A DRAFT HAS NO CALENDAR BANNERS. calendar.setBanners writes the live document's banner urls and there is no draft equivalent, so a banner edit made while the Next scope is selected would silently land on LIVE — the one thing a draft is supposed to make impossible. The banner fields are not rendered in that scope for the same reason.
        if (Object.keys(seasonEdits).length) {
            ops.push({ type: idScope === 'draft' ? 'season.setDraftTitlesDeadlines' : 'season.setTitlesDeadlines',
                target: null, payload: seasonEdits });
        }
        if (idScope !== 'draft' && Object.keys(bannerEdits).length) ops.push({ type: 'calendar.setBanners', target: null, payload: bannerEdits });
        if (ops.length) { await stageOps('season', ops, session.csrfToken); fetchSeasonState().then(setState); fetchChangesets('season').then(setChangesets); }
    }

    // 🔴 TWO DISCARD BUTTONS, TWO DIFFERENT CONFIRMATIONS, ONE ACTION. The staged panel opened the shared drawer; the Board's own card called a native confirm() from inside board.js — so the same act asked for permission in two different voices depending on which view you happened to be in, and only one of them could say the tier. Both go through this now, and board.js no longer owns a dialog at all.
    const confirmDiscard = (c) => overlay.confirm({
        op: 'changeset.discard', tier: 1, danger: true, confirmLabel: 'Discard',
        title: 'Discard this staged change?',
        body: html`<p class="dw-p">Nothing live is undone — this change never reached Discord. Only what has not
            committed yet is abandoned.</p>`,
        onConfirm: () => handleDiscard(String(c._id)),
    });

    // ⚠️ THE WHOLE SET GOES IN ONE CHANGESET. Editing the current entry can produce up to three ops — date/info and each image slot — and they are one act; staging them separately would put three rows on Review for one edit and let two of them commit without the third.
    async function handlePatchStage(entry, ops) {
        if (!ops.length) return;
        await stageOps('season', ops, session.csrfToken);
        setOpenPatchId(null);
        fetchSeasonState().then(setState);
        fetchChangesets('season').then(setChangesets);
    }

    const editingDraft = idScope === 'draft';
    const identitySlot = html`<${SeasonIdentity} season=${editingDraft ? (state.draft || {}) : state.live}
                                                 editingDraft=${editingDraft} draftStaged=${Boolean(state.draft?.active)}
                                                 today=${todayIso()} onSave=${handleIdentitySave} onScope=${setIdScope} />`;

    const viewSlot = view === 'Track'
        ? html`${showAdd ? html`<${Composer} types=${COMPOSE_TYPES} initialType=${showAdd === true ? null : showAdd}
                                              onStage=${(kind, fields) => handleAdd(buildSeasonAddOp(kind, fields))}
                                              onStageMany=${handleStageMany}
                                              onLive=${setComposeGhost}
                                              onCancel=${() => { setComposeGhost(null); setShowAdd(null); }} />` : null}
               <${StagedPanel} changesets=${changesets} onReview=${() => setView('Board')} onDiscard=${confirmDiscard}
                               stagedOnly=${stagedOnly} onStagedOnly=${setStagedOnly} />
               ${dayOpen ? html`
                   <${DayDrawer} day=${dayOpen} live=${trackData} draft=${draftData}
                                 withDraft=${dayWithDraft} onWithDraft=${setDayWithDraft}
                                 onClose=${() => setDayOpen(null)} />` : null}
               <${Track} data=${trackData} ghost=${showAdd ? composeGhost : null} onPickDay=${setDayOpen}
                          rail=${deadlineRail(state.live, visibleWindow.start, visibleWindow.end)}
                          draft=${draftData} window=${visibleWindow} full=${fullWindow} onWindow=${setZoomedWindow}
                          season=${state.live} onDragCommit=${handleDragCommit}
                          onFillGap=${() => setShowAdd('event')} />`
        : view === 'Repairs'
            ? html`<${Repairs} data=${trackData} window=${visibleWindow} season=${state.live} onClamp=${handleDragCommit} />`
            : html`<${Board} changesets=${changesets} onExport=${handleExport} onDiscard=${confirmDiscard} />`;

    // ⚠️ IT FILTERS, IT DOES NOT SEARCH. The Manifest's own search box is text; this is a STATE predicate, and running it through the search field would mean typing a word that matches nothing in any cell.
    const shownRows = stagedOnly ? allRows.filter((r) => r.state === 'staged' || r.state === 'blocked') : allRows;
    const manifestSlot = html`<${Manifest} rows=${shownRows} columns=${SEASON_COLUMNS} searchableFields=${['title']}
                                            title="Everything in the season" filterGroups=${SEASON_FILTERS}
                                            headerRight=${`${drawsLive} draws · ${(state.live?.calendar || []).length} calendar items`}
                                            bulkNote="Reversible — a staged deletion is discarded, never undone"
                                            bulkTier=${2} rowNoun=${['item', 'items']}
                                            onRemove=${(row) => (row.isDraft ? null : confirmBulkDelete([row.id]))} removeLabel="Stage deletion"
                                            emptyText="This season has no draws or calendar items yet." 
                                            onAdd=${() => setShowAdd(true)} realm="season" csrfToken=${session.csrfToken}
                                            buildEditOp=${buildSeasonEditOp}
                                            onEditError=${(msg) => setNotices([...notices, { changeId: `edit-${Date.now()}`, summary: msg }])}
                                            bulkActions=${[
                                                { label: 'Export selection', onClick: handleExportSelection },
                                                { label: 'Stage deletion', danger: true, onClick: confirmBulkDelete },
                                            ]} />`;

    return html`
        <${Shell} realm="season" session=${session} view=${view} viewOptions=${['Track', 'Board', 'Repairs']} onSetView=${setView} stateKey
                  badges=${{ review: stagedCount }} exports=${exportScopes} exportLabel="Season" overlayFor=${overlay}
                  tools=${view === 'Track' ? html`<${Zoomer} win=${visibleWindow} full=${fullWindow} onWindow=${setZoomedWindow} />` : null}
                  masthead=${html`<${Masthead} eyebrow=${html`<${Eyebrow} live=${drawsLive} staged=${stagedCount} flags=${flagCount} />`}
                                               title=${state.live?.currentSeasonTitle || 'Season'}
                                               sub=${`${visibleWindow.start} → ${visibleWindow.end}`} stats=${seasonStats}
                                               actions=${html`
                                                   <${SeasonClock} season=${state.live} today=${todayIso()} />
                                                   <${AddChips} onAdd=${(key) => setShowAdd(key)} />`} />`}
                  viewSlot=${html`${identitySlot}
                                  <${DraftZone} draft=${state.draft} live=${state.live} onStart=${startDraft} onDiscard=${confirmDiscardDraft} />
                                  ${viewSlot}
                                  <${PatchRecord} live=${state.live} openId=${openPatchId} onOpen=${setOpenPatchId}
                                                   onPublish=${() => setShowAdd('patchnote')} onStage=${handlePatchStage} />
                                  <${OneWay} live=${state.live} draft=${state.draft} session=${session} overlay=${overlay} onStage=${handleOneWay} />`}
                  overlaySlot=${overlay.render()} manifestSlot=${manifestSlot}
                  traySlot=${html`<${Tray} notices=${notices} onUndo=${(id) => setNotices(notices.filter(n => n.changeId !== id))} onDismiss=${(id) => setNotices(notices.filter(n => n.changeId !== id))} />`} />
    `;
}
