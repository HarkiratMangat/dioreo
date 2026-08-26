// portal/ui/track.js — ESM. The Track: ruler + lanes + bars + points + flags.
//
// 🔴 REWRITTEN 2026-08-25 to render the INTERACTIVE MOCKUP'S markup and class vocabulary. This is the first realm component migrated under docs/superpowers/specs/2026-08-25-portal-preact-migration-design.md: the design moves onto the code, not the other way round. The two implementations shared only 62 class names out of the mockup's 890, so "converging" the other way meant re-authoring the design. The props contract is UNCHANGED — season.js was not touched — because a migration that also changes its own interface makes every resulting defect unattributable.
//
// What comes from elsewhere, unchanged:
//   TL                        timeline.logic.js — the date<->pixel engine (classic script global)
//   bandClass, barGeometry,   track.logic.js — pure, Node-tested, paradigm-agnostic
//   dateFromOffset
//   <Icon>, <Fold>            icons.js — never a text glyph, and the fold MORPHS
//   useMeasured               useMeasured.js — the only safe shape for a post-layout pass
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useCallback, useRef } from '../vendor/preact-hooks.mjs';
import { Fold } from './icons.js';
import { useMeasured } from './useMeasured.js';

// 🔴 SHAPE carries state, COLOUR carries topic (spec §9). The lane's own accent is a CSS custom property the rule reads; it never appears in a class name. `point` vs `span` is the lane's KIND — models/SeasonalData.js gives a draw ONE field (`date`) and no end at all, so a draw is a RELEASE and renders as a point. Only a calendar row has both dates and can be a band.
//
// ⚠️ `patchnote` IS DELIBERATELY ABSENT and must stay that way. A patch note is a PUBLICATION, not a state with a duration — isEventEnded() returns false for it forever — so it does not belong on an axis whose every other lane answers "when is this ON?". The mockup renders it as the Season Record instead. A [P2] tracker entry once prescribed adding it and was closed as superseded.
const LANES = [
    { key: 'draw',      label: 'New draws', topic: '--draw', kind: 'point' },
    { key: 'returning', label: 'Returning', topic: '--ret',  kind: 'point' },
    { key: 'event',     label: 'Events',    topic: '--ev',   kind: 'span'  },
    { key: 'playlist',  label: 'Playlists', topic: '--play', kind: 'span'  },
];

// A collapsed lane must still ANSWER something — a row that only says "5 hidden" is a worse version of nothing. Each lane's summary answers that lane's own question.
const LANE_KIT = {
    draw:      { sum: 'pips', ask: 'what released, and how rare' },
    returning: { sum: 'pips', ask: 'what came back' },
    event:     { sum: 'runs', ask: 'what was running' },
    playlist:  { sum: 'load', ask: 'how many modes at once' },
};

const ROW_H = 26, ROW_PAD = 10, LABEL_MIN_PX = 44, TRUNC_MIN_PX = 44, MAX_FLAGS = 3;
const LANE_COL_KEY = 'dioreo-lane-col';

function loadLaneCol() { try { return JSON.parse(sessionStorage.getItem(LANE_COL_KEY)) || {}; } catch { return {}; } }
function saveLaneCol(v) { try { sessionStorage.setItem(LANE_COL_KEY, JSON.stringify(v)); } catch (e) {} }

const startOf = (it) => it.startDate || it.endDate;
const endOf = (it) => it.endDate || it.startDate;

// Greedy interval row assignment, so two items overlapping in one lane get their own row instead of painting on the same pixels.
//
// ⚠️ THIS IS THE MOCKUP'S VERSION, NOT track.logic.js's, AND THE DIFFERENCE IS REAL. The portal's assignRows tests `rowEnds[r] <= start`, which puts two merely-TOUCHING bars on separate rows; the mockup requires a full day of clearance, so consecutive bars share a row separated by the gutter `.bar`'s inset already provides. Two implementations of one idea existed and disagreed — the migration is where the better one gets chosen deliberately rather than inherited by whichever file happened to be open.
function assignRows(list) {
    const sorted = [...list].sort((a, b) => startOf(a).localeCompare(startOf(b)));
    const ends = [];
    const row = new Map();
    for (const it of sorted) {
        let r = ends.findIndex((e) => TL.days(e, startOf(it)) >= 0);
        if (r === -1) { r = ends.length; ends.push(endOf(it)); } else { ends[r] = endOf(it); }
        row.set(it.id, r);
    }
    return { row, rows: Math.max(1, ends.length) };
}

// Merge overlapping intervals into the runs a reader actually perceives.
function mergeRuns(list) {
    const xs = list.map((i) => ({ a: startOf(i), b: endOf(i) })).sort((x, y) => (x.a < y.a ? -1 : 1));
    const out = [];
    for (const r of xs) {
        const last = out[out.length - 1];
        if (last && TL.days(r.a, last.b) >= -1) { if (TL.days(last.b, r.b) > 0) last.b = r.b; last.n++; }
        else out.push({ ...r, n: 1 });
    }
    return out;
}

// Concurrency sampled across the visible window — the playlists lane's real question.
function loadCurve(list, view, steps = 64) {
    const out = [];
    for (let i = 0; i < steps; i++) {
        const d = view.dateAt((i / (steps - 1)) * 100);
        out.push(list.filter((it) => TL.days(startOf(it), d) >= 0 && TL.days(d, endOf(it)) >= 0).length);
    }
    return out;
}

// Pixels decide the spacing, not days — a rule that holds at any span.
function tickStep(span, widthPx) {
    const want = Math.max(1, Math.floor(widthPx / 92));
    const raw = span / want;
    return [1, 2, 3, 7, 14, 28, 56, 91, 182, 364].find((c) => c >= raw) || 364;
}

function Ruler({ view }) {
    const ref = useRef(null);
    const [w, setW] = useState(1100);
    // Was an imperative renderRuler() re-run after every innerHTML rebuild, re-querying and re-binding as it went. Only the width needs measuring now, and a ResizeObserver reports it without a render loop.
    useMeasured('ruler:' + view.from + view.to, ref, (root) => {
        const px = root.getBoundingClientRect().width || 1100;
        if (px !== w) setW(px);
        return {};
    });
    return html`
        <div class="ruler" ref=${ref}>
            ${TL.ticks(view, tickStep(view.span(), w)).map((t) => html`
                <span key=${t.iso} style=${'left:' + t.x + '%'}><b>${t.label}</b></span>`)}
        </div>`;
}

function LaneSummary({ lane, list, kit, view }) {
    if (kit.sum === 'pips') {
        return html`<span class="lsum">${list.map((it) => html`
            <i key=${it.id} class=${'lpip' + (it.tier === 'mythic' ? ' myth' : '')}
               style=${`--c:var(${lane.topic});left:${view.pct(startOf(it))}%`}
               data-tip=${`${it.title} · ${TL.fmt(startOf(it))}`}></i>`)}</span>`;
    }
    if (kit.sum === 'load') {
        const c = loadCurve(list, view);
        const max = Math.max(1, ...c);
        const empties = c.filter((n) => !n).length;
        // 🔴 THE PEAK IS SHOWN, NOT ASSERTED, and a ZERO IS DRAWN. A linear height on a curve whose peak is 7 and whose typical value is 1 renders six bars out of seven as a 14% stub, so the only thing carrying "7 at peak" is the text beside it. Gamma 0.6 lifts the low end enough that the SHAPE is the reading. And `opacity:0` used to erase every empty day — the one thing a person scanning this lane would act on, indistinguishable from the lane ending.
        return html`<span class="lsum load" data-tip=${'How many run at once — peak ' + max
                + (empties ? `, and ${empties} day${empties === 1 ? '' : 's'} with nothing running` : '')}>
            ${c.map((n, i) => {
                const x = (i / (c.length - 1)) * 100;
                return n
                    ? html`<i key=${i} style=${`--c:var(${lane.topic});left:${x}%;height:${Math.round(Math.pow(n / max, 0.6) * 100)}%`}></i>`
                    : html`<i key=${i} class="ld0" style=${'left:' + x + '%'}></i>`;
            })}<b>${max} at peak</b></span>`;
    }
    return html`<span class="lsum">${mergeRuns(list).map((r, i) => html`
        <i key=${i} class="lrun" style=${`--c:var(${lane.topic});left:${view.pct(r.a)}%;width:${view.wpct(r.a, r.b)}%`}
           data-tip=${`${r.n} item${r.n === 1 ? '' : 's'} · ${TL.fmt(r.a)} → ${TL.fmt(r.b)}`}></i>`)}</span>`;
}

function Bar({ it, lane, view, top, fit, onDragCommit }) {
    const ref = useRef(null);
    const [ghost, setGhost] = useState(null);

    // WAS bound imperatively in wireTrack() after every innerHTML rebuild, under a comment reading "a listener bound to the old node would silently stop working after the first interaction". That failure mode is structurally gone: the handler is part of the tree, so it is re-attached to whatever node the render produces.
    const startDrag = useCallback((e) => {
        if (e.button !== 0 || !onDragCommit) return;
        e.preventDefault(); e.stopPropagation();
        const tk = ref.current && ref.current.closest('.tk');
        if (!tk) return;
        const pctAt = (ev) => {
            const r = tk.getBoundingClientRect();
            return Math.max(0, Math.min(100, ((ev.clientX - r.left) / r.width) * 100));
        };
        const move = (ev) => setGhost(view.dateAt(pctAt(ev)));
        const up = (ev) => {
            globalThis.removeEventListener('pointermove', move);
            globalThis.removeEventListener('pointerup', up);
            setGhost(null);
            // 🔴 CONVERT AT THE SEAM. TL.dateAt returns an ISO STRING; editOpFor (track.logic.js) calls newEndDate.toISOString() and needs a DATE. The mismatch throws only into the console, so the drag LOOKS like it worked and never commits — measured, not imagined.
            onDragCommit(it, new Date(view.dateAt(pctAt(ev)) + 'T00:00:00Z'));
        };
        globalThis.addEventListener('pointermove', move);
        globalThis.addEventListener('pointerup', up);
    }, [it, view, onDragCommit]);

    const end = ghost || endOf(it);
    const geo = barGeometry({ startDate: startOf(it), endDate: end }, { start: view.from, end: view.to });
    const cls = [bandClass({ state: it.state || 'live' }), it.openEnded ? 'forever' : '', fit || '', ghost ? 'dragging' : '']
        .filter(Boolean).join(' ');
    return html`
        <div class=${cls} ref=${ref} data-id=${it.id} tabindex="0" role="button"
             style=${`--c:var(${lane.topic});left:${geo.left}%;width:${geo.width}%${top ? ';' + top : ''}`}
             aria-label=${`${it.title}, ${TL.fmt(startOf(it))} ${it.openEnded ? 'onward, with no end date' : 'to ' + TL.fmt(end)}${it.isOngoing ? ', runs all season' : ''}`}
             data-tip=${ghost ? 'Ends ' + TL.fmt(ghost) : null}>
            <span class="gr a" data-edge="start"></span>
            <span class="bl">${it.title}</span>
            <span class="gr b" data-edge="end" onPointerDown=${startDrag}></span>
        </div>`;
}

function Point({ it, lane, view }) {
    return html`
        <span class=${'pt ' + (it.state || 'live')} data-id=${it.id} tabindex="0" role="button"
              data-tier=${it.tier || ''} data-lanekind=${lane.key}
              style=${`--c:var(${lane.topic});left:${view.pct(startOf(it))}%`}
              aria-label=${`${it.title}, releases ${TL.fmt(startOf(it))}`}
              data-tip=${`${it.title} · releases ${TL.fmt(startOf(it))}`}></span>`;
}

function Lane({ lane, list, isDraft, view, collapsed, onToggle, fits, onDragCommit }) {
    const spans = list.filter((i) => lane.kind !== 'point');
    const { row, rows } = assignRows(spans);
    const kit = LANE_KIT[lane.key] || { sum: 'runs', ask: 'what is scheduled' };
    const off = list.filter((it) => TL.days(endOf(it), view.from) > 0 || TL.days(view.to, startOf(it)) > 0).length;

    return html`
        <div class=${'lane' + (collapsed ? ' lnc' : '')} data-lane=${lane.key} data-draft=${isDraft ? 1 : 0}
             data-rows=${rows} style=${`--c:var(${lane.topic});height:${collapsed ? 30 : Math.max(38, rows * ROW_H + ROW_PAD)}px`}>
            <button class="lnh" data-lanebtn=${lane.key} data-draft=${isDraft ? 1 : 0}
                    aria-expanded=${!collapsed} onClick=${onToggle}
                    data-tip=${`${collapsed ? 'Expand' : 'Collapse'} this lane — ${kit.ask}. Alt-click to solo it.`}>
                <${Fold} open=${!collapsed} cls="sm lnh-i" />
                <span class="lnh-d" style=${`--c:var(${lane.topic})`}></span>
                <span class="lnh-t">${isDraft ? 'Draft ' + lane.label.toLowerCase() : lane.label}</span>
                <span class="lnh-n">${list.length}</span>
            </button>
            <div class="tk">
                ${collapsed ? html`<${LaneSummary} lane=${lane} list=${list} kit=${kit} view=${view} />` : null}
                ${off ? html`<span class="offwin" data-tip="Outside the current window — zoom out or drag the scrubber">${off} beyond this window</span>` : null}
                ${collapsed ? null : list.map((it) => {
                    if (lane.kind === 'point') return html`<${Point} key=${it.id} it=${it} lane=${lane} view=${view} />`;
                    const r = row.has(it.id) ? row.get(it.id) : 0;
                    const top = rows === 1 ? null : `top:${ROW_PAD / 2 + r * ROW_H}px;transform:none;height:${ROW_H - 5}px`;
                    return html`<${Bar} key=${it.id} it=${it} lane=${lane} view=${view} top=${top}
                                        fit=${fits[it.id]} onDragCommit=${onDragCommit} />`;
                })}
            </div>
        </div>`;
}

// Kept from the previous implementation, unchanged: the flags a Track exists to surface. Only their PRESENTATION moves to the mockup's one-line-per-finding strip.
function deriveFlags(data, window, season, actions) {
    const all = Object.values(data).flat();
    const out = [];
    if (season?.bpEnd) {
        for (const it of all) {
            if (!it.endDate || it.endDate <= season.bpEnd) continue;
            const over = TL.days(season.bpEnd, it.endDate);
            out.push({
                id: 'past-bp-' + it.id, sev: 'warn', text: html`<b>${it.title}</b> ends ${over} day${over === 1 ? '' : 's'} after the battle pass — it will outlive the season.`,
                fix: 'Clamp to BP end',
                onFix: actions?.onClamp ? () => actions.onClamp(it, new Date(season.bpEnd + 'T00:00:00Z')) : null,
            });
        }
    }
    return out;
}

export function Track({ data, draft, window: visible, season, flags, onDragCommit, onFillGap }) {
    const rootRef = useRef(null);
    const [laneCol, setLaneCol] = useState(loadLaneCol);
    const view = TL.make(visible.start, visible.end);

    const lanes = LANES.filter((l) => (data[l.key] || []).length || (draft && (draft[l.key] || []).length));
    const shown = flags || deriveFlags(data, visible, season, { onClamp: onDragCommit, onFill: onFillGap });

    const toggle = useCallback((lane, isDraft, alt) => {
        setLaneCol((prev) => {
            const k = (isDraft ? 'd:' : '') + lane.key;
            // Alt-click solos: everything else folds, which is the gesture you want when one lane is the reason you opened the page. A mode is what you build when you cannot decide.
            const next = alt
                ? Object.fromEntries(LANES.flatMap((l) => [[l.key, l.key !== k], ['d:' + l.key, 'd:' + l.key !== k]]))
                : { ...prev, [k]: !prev[k] };
            saveLaneCol(next);
            return next;
        });
    }, []);

    const collapsedFor = (l, isDraft) => {
        const k = (isDraft ? 'd:' : '') + l.key;
        if (k in laneCol) return laneCol[k];
        // A lane needing more than three rows opens COLLAPSED — you should not land on a wall with the lane you came for off-screen. An explicit choice always wins, and it persists.
        return l.kind !== 'point' && assignRows((isDraft ? draft : data)[l.key] || []).rows > 3;
    };

    // fitLabels, through the one safe shape. See useMeasured.js for why the generation key is not optional: measuring an already-truncated label reads a different width and the two states alternate forever.
    const fits = useMeasured(
        `${visible.start}|${visible.end}|${JSON.stringify(laneCol)}|${Object.values(data).flat().map((i) => i.id + ':' + i.endDate).join(',')}`,
        rootRef,
        (root) => {
            const out = {};
            root.querySelectorAll('.bar').forEach((b) => {
                const bl = b.querySelector('.bl');
                if (!bl) return;
                const w = b.getBoundingClientRect().width;
                const ratio = bl.scrollWidth ? w / bl.scrollWidth : 1;
                const clipped = bl.scrollWidth > bl.clientWidth + 1;
                if (w >= LABEL_MIN_PX && ratio >= 0.55 && !clipped) { out[b.dataset.id] = ''; return; }
                const tk = b.closest('.tk');
                if (!tk) { out[b.dataset.id] = 'nolabel'; return; }
                const br = b.getBoundingClientRect(), tr = tk.getBoundingClientRect();
                const need = bl.scrollWidth + 10;
                // 🔴 ROOM MEANS ROOM BEFORE THE NEXT BAR, and "same row" is VERTICAL OVERLAP, never a matching style string — the string test groups every bar whose top came from a class into one pseudo-row and reports "no room" beside 900px of empty track.
                const sibs = [...tk.querySelectorAll('.bar')].filter((o) => o !== b).map((o) => o.getBoundingClientRect())
                    .filter((r) => r.top < br.bottom - 1 && r.bottom > br.top + 1);
                const rightWall = Math.min(tr.right, ...sibs.filter((r) => r.left >= br.right - 1).map((r) => r.left));
                const leftWall = Math.max(tr.left, ...sibs.filter((r) => r.right <= br.left + 1).map((r) => r.right));
                // OUTSIDE BEFORE TRUNCATED, and truncated before hidden. A bar with no label is not a bar, it is a rectangle.
                if (rightWall - br.right > need) out[b.dataset.id] = 'lbl-out';
                else if (br.left - leftWall > need) out[b.dataset.id] = 'lbl-out-l';
                else if (w >= TRUNC_MIN_PX) out[b.dataset.id] = 'lbl-cut';
                else out[b.dataset.id] = 'nolabel';
            });
            return out;
        },
        (root) => root.querySelectorAll('.bar').forEach((b) => b.classList.remove('lbl-out', 'lbl-out-l', 'lbl-cut', 'nolabel')),
    );

    const nowPct = view.pct(TL.toISO(Date.now()));

    return html`
        <div class="panel" id="track">
            <div class="ph">
                <span class="t">Season track</span>
                <!-- 🔴 A KEY DRAWN IN A LANGUAGE THE THING IT KEYS DOES NOT SPEAK. The leg class had no rule
                     left after app.css was adopted, so this rendered as three bare words each with an empty i
                     beside it. The Manifest's own state pills ARE these three shapes, so the legend is made
                     of the marks it explains rather than of a second set that has to agree with them. -->
                <span class="rt" style="display:flex;gap:8px;align-items:center">
                    <span class="stt live">LIVE</span>
                    <span class="stt stag">STAGED</span>
                    <span class="stt conf">CONFLICT</span>
                </span>
            </div>
            <div class="tk-wrap" ref=${rootRef}><div class="tk-inner">
                <${Ruler} view=${view} />
                <div class="lanes">
                    ${lanes.map((l) => html`
                        <${Lane} key=${l.key} lane=${l} list=${data[l.key] || []} isDraft=${false} view=${view}
                                 collapsed=${collapsedFor(l, false)} onToggle=${(e) => toggle(l, false, e.altKey)}
                                 fits=${fits} onDragCommit=${onDragCommit} />`)}
                    ${draft && lanes.some((l) => (draft[l.key] || []).length) ? html`
                        <div class="divider">Next season draft — staged, not live</div>
                        ${lanes.filter((l) => (draft[l.key] || []).length).map((l) => html`
                            <${Lane} key=${'d:' + l.key} lane=${l}
                                     list=${(draft[l.key] || []).map((i) => ({ ...i, state: 'staged' }))}
                                     isDraft=${true} view=${view} collapsed=${collapsedFor(l, true)}
                                     onToggle=${(e) => toggle(l, true, e.altKey)} fits=${fits} />`)}
                    ` : null}
                    <div class="ov">
                        <div class="now" style=${'left:' + nowPct + '%'}></div>
                        ${season?.bpEnd ? html`<div class="dend" data-lbl="battle pass" style=${'left:' + view.pct(season.bpEnd) + '%;--c:var(--warn)'}></div>` : null}
                    </div>
                </div>
            </div></div>
            <div class="flags tight">
                ${shown.length ? shown.slice(0, MAX_FLAGS).map((f) => html`
                    <span key=${f.id} class=${'flag' + (f.sev === 'info' ? ' info' : '')} data-flagid=${f.id}>${f.text}
                        ${f.onFix ? html`<button onClick=${f.onFix}>${f.fix}</button>` : null}</span>`)
                : html`<span class="flag info" style="border-left-color:var(--ok)">No conflicts, overlaps or gaps in the current window.</span>`}
                ${shown.length > MAX_FLAGS ? html`
                    <span class="flag info">and ${shown.length - MAX_FLAGS} more — concurrent events are normal, so these rank last.</span>` : null}
            </div>
        </div>`;
}
