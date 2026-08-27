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
// ⚠️ `patchnote` IS DELIBERATELY ABSENT and must stay that way. A patch note is a PUBLICATION, not a state with a duration — isEventEnded() returns false for it forever — so it does not belong on an axis whose every other lane answers "when is this ON?". The mockup renders it as the Season Record instead. A [P2] tracker entry once prescribed adding it and was closed as superseded. 🔴 `exclusive` IS WHY OVERLAP DETECTION IS WORTH ANYTHING. Two events running at once is ordinary — a themed event and a CP promotion overlap by design — so reporting every concurrent pair produced **61 findings across 37 items** on the live fixture, which is a list nobody reads. A playlist rotation is the one lane where two things at once IS the defect: the game shows one playlist, so a second one covering the same days means somebody's dates are wrong. Making it a property of the lane rather than an `if` in the finder means adding a lane forces the question to be answered.
const LANES = [
    { key: 'draw',      label: 'New draws', topic: '--draw', kind: 'point' },
    { key: 'returning', label: 'Returning', topic: '--ret',  kind: 'point' },
    { key: 'event',     label: 'Events',    topic: '--ev',   kind: 'span'  },
    { key: 'playlist',  label: 'Playlists', topic: '--play', kind: 'span', exclusive: true },
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

function Lane({ lane, list, isDraft, view, collapsed, onToggle, fits, onDragCommit, ghost }) {
    const spans = list.filter((i) => lane.kind !== 'point');
    const { row, rows } = assignRows(spans);
    const kit = LANE_KIT[lane.key] || { sum: 'runs', ask: 'what is scheduled' };
    const off = list.filter((it) => TL.days(endOf(it), view.from) > 0 || TL.days(view.to, startOf(it)) > 0).length;

    return html`
        <div class=${'lane' + (collapsed ? ' lnc' : '') + (ghost ? ' aim' : '')} data-lane=${lane.key} data-draft=${isDraft ? 1 : 0}
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
                <!-- ⚠️ DASHED BECAUSE IT IS UNSTAGED, which is the same rule every staged thing on this Track
                     follows: shape carries state. A solid preview would read as a record that already exists. A
                     POINT is a diamond rather than a bar, for the same reason a real draw is — a preview drawn in
                     a shape the record cannot have teaches the wrong thing about the record. -->
                ${ghost && !collapsed ? html`
                    <i class=${'tghost cmp' + (ghost.shape === 'point' ? ' pt' : '')}
                       style=${`left:${view.pct(ghost.start)}%` + (ghost.shape === 'point' ? '' : `;width:${view.wpct(ghost.start, ghost.end)}%`)}
                       aria-hidden="true">${ghost.shape === 'point' ? '' : (ghost.name || 'Unnamed')}</i>` : null}
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

// ── REPAIRS ───────────────────────────────────────────────────────────────────────────────────
//
// 🔴 TWO OF THE THREE DEFECT FINDERS HAD NO CALLER ANYWHERE. `findOverlaps` and `findGaps` are exported from track.logic.js, documented as "the third defect the Track exists to surface", and are read by nothing — so the Track has been surfacing exactly one kind of finding (an item outliving the battle pass) while two more were computed, tested and thrown away. This view is where they arrive.
//
// ⚠️ A CLEAN GROUP IS STILL DRAWN, dashed and dimmed rather than omitted. "No overlaps" is a different statement from "we did not look", and a list that shows only problems cannot tell you which is which — the same reason Armory's coverage cards keep a zero card instead of hiding it.
//
// ⚠️ AND IT READS THE VISIBLE WINDOW, not the whole season, because `findGaps` is defined against a window: a gap is a stretch of the axis you are looking at with nothing in it. Zooming therefore changes what Repairs reports, which is honest — the alternative is a gap count that silently means something other than the picture beside it.
const REPAIR_NOTE = {
    dupe: 'The same thing entered twice, over days that overlap. Not a scheduling conflict — two items genuinely running at once is ordinary here, and counting those produced sixty-one findings nobody would read. This is the narrower case: one record, entered by two people or twice by one.',
    overrun: 'The battle pass is what a player calls the end of the season. Anything still running past it is either a deliberate carry-over or a date nobody updated, and the record cannot tell you which — that is why this is a finding rather than a fix.',
    gap: 'A stretch of the visible window with nothing in this lane at all. A gap is only a defect if the lane is meant to be continuous — playlists usually are, draws are not.',
};

export function Repairs({ data, window: visible, season, onClamp }) {
    const all = Object.values(data).flat();
    const overruns = season?.bpEnd ? all.filter((i) => i.endDate && i.endDate > season.bpEnd) : [];
    // The same thing entered twice — Harkirat's own definition of the flaggable case, after two measured definitions of "conflict" both turned out to describe ordinary scheduling. See findDuplicateTitles for what those measurements were.
    const dupes = findDuplicateTitles(all);
    const gapLanes = LANES.map((l) => ({ lane: l, gaps: findGaps(data[l.key] || [], visible) })).filter((g) => g.gaps.length);
    const total = overruns.length + dupes.length + gapLanes.reduce((n, g) => n + g.gaps.length, 0);

    const group = (key, label, count, kind, rows) => html`
        <div class=${'repgrp' + (count ? '' : ' clean')} key=${key}>
            <div class="reph">
                <span class="rt-n">${count}</span>
                <span class="rt-l">${label}</span>
                <span class="rt-k">${kind}</span>
            </div>
            <p class="repnote">${REPAIR_NOTE[key]}</p>
            ${count ? html`<div class="rephits">${rows}</div>` : html`<p class="repclean">Nothing to look at here.</p>`}
        </div>`;

    return html`
        <div class="panel" id="repairs">
            <div class="ph">
                <span class="t">Repairs</span>
                <span class="rt">${TL.fmt(visible.start)} → ${TL.fmt(visible.end)}</span>
            </div>
            <div class="repwrap">
                <div class="rephead">
                    <b>${total} ${total === 1 ? 'finding' : 'findings'}</b> in the window you are looking at.
                    None of these is an error the bot would refuse — they are the shapes a season takes when a date
                    moved and something else did not.
                </div>

                <p class="reps">Outliving the season</p>
                ${group('overrun', 'End after the battle pass', overruns.length, 'date', overruns.map((it) => html`
                    <button key=${it.id} onClick=${() => onClamp && onClamp(it, new Date(season.bpEnd + 'T00:00:00Z'))}>
                        <b>${it.title}</b>
                        <span>ends ${TL.days(season.bpEnd, it.endDate)} days late — clamp it to the battle pass</span>
                    </button>`))}

                <!-- 🔴 THIS GROUP REPORTED "OVERLAP" TWICE AND WAS WRONG BOTH TIMES. Any two items sharing
                     days: 61 findings across 37 items, nearly all events meant to run together. Only within
                     a lane where concurrency should be impossible: 47, every one a pair of playlists, and
                     CODM plainly runs many playlists at once. Both premises sounded right and neither
                     survived being run. Harkirat settled the real case on 2026-08-26 — the same thing
                     entered TWICE — which is a mistake rather than a schedule, and is what this reports
                     now. findOverlaps stays in track.logic.js, now correct and tested, with no caller and
                     a comment saying why. -->
                <p class="reps">Entered twice</p>
                ${group('dupe', 'The same item, twice', dupes.length, 'record', dupes.map(([a, b, how], n) => html`
                    <button key=${n} disabled>
                        <b>${a.title}</b>
                        <span>${how === 'same' ? 'appears again as' : 'is also inside'} <b>${b.title}</b>, over the same days</span>
                    </button>`))}

                <p class="reps">Empty stretches</p>
                ${group('gap', 'Gaps in a lane', gapLanes.reduce((n, g) => n + g.gaps.length, 0), 'window',
                    gapLanes.flatMap((g) => g.gaps.map((gap, n) => html`
                        <button key=${g.lane.key + n} disabled>
                            <b>${g.lane.label}</b>
                            <span>nothing from ${TL.fmt(gap.start.toISOString().slice(0, 10))} to ${TL.fmt(gap.end.toISOString().slice(0, 10))}</span>
                        </button>`)))}
            </div>
        </div>
    `;
}

// ── THE ZOOM CONTROL ──────────────────────────────────────────────────────────────────────────
//
// 🔴 A FIXED WINDOW CANNOT BE WRONG, ONLY USELESS. `seasonWindow()` spans everything the season holds — six to ten weeks for a real CODM season — so fourteen draws and twenty calendar items shared one axis, and the single-day ones (eleven of the fourteen) computed to under two pixels each. The plot was complete and unreadable.
//
// ⚠️ FIT IS DISABLED WHEN IT WOULD DO NOTHING, and the readout says the SPAN rather than a zoom level: "42 days shown" is a fact about the picture; "1.4×" is a fact about the control.
export function Zoomer({ win, full, onWindow }) {
    const days = windowDays(win);
    const fitted = days >= windowDays(full);
    return html`
        <div class="zoomer" role="group" aria-label="Zoom">
            <button title="Zoom out" aria-label="Zoom out" disabled=${fitted}
                    onClick=${() => onWindow(zoomWindow(win, 1.6, full))}>−</button>
            <button title="Zoom in" aria-label="Zoom in" disabled=${days <= 3}
                    onClick=${() => onWindow(zoomWindow(win, 0.625, full))}>+</button>
            <button class="wide" title="Fit everything" disabled=${fitted}
                    onClick=${() => onWindow(null)}>FIT</button>
            <span class="rd"><b>${days}</b> ${days === 1 ? 'day' : 'days'} shown</span>
        </div>
    `;
}

// ── THE OVERVIEW SCRUBBER ─────────────────────────────────────────────────────────────────────
//
// Every item in the season at once, with the visible window drawn over it: drag the middle to pan, drag either end to resize. It is the only control that shows what is OUTSIDE the current view, which is the question zooming immediately creates.
//
// 🔴 A MINIMUM WIDTH ON EVERY MINI BAR, because a single-day draw at season scale computes to under a pixel and simply vanishes — and eleven of this season's fourteen draws are single-day. An overview that silently omits most of what it is overviewing is worse than no overview. The adopted stylesheet sets that floor (`.scrub .mini{min-width:3px}`); this only has to not fight it.
function Scrub({ items, win, full, seasonEnd, onWindow }) {
    const ref = useRef(null);
    const drag = useRef(null);
    const fullLo = Date.parse(full.start), fullHi = Date.parse(full.end);
    const span = Math.max(1, fullHi - fullLo);
    const pct = (iso) => ((Date.parse(iso) - fullLo) / span) * 100;
    const left = pct(win.start), right = pct(win.end);

    // 🔴 POINTER CAPTURE, NOT A DOCUMENT LISTENER. A drag that leaves the strip — which every drag to the edge does — stops firing move events on the element, so a hand-rolled version silently drops the gesture halfway. setPointerCapture keeps them coming to the node that started it, and the matching release is what stops the window following the pointer forever.
    function begin(mode, e) {
        e.preventDefault(); e.stopPropagation();
        const rect = ref.current.getBoundingClientRect();
        drag.current = { mode, rect, startX: e.clientX, win };
        e.currentTarget.setPointerCapture(e.pointerId);
    }
    function move(e) {
        const d = drag.current;
        if (!d) return;
        const perPx = span / Math.max(1, d.rect.width);
        const shifted = (e.clientX - d.startX) * perPx;
        const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
        const lo = Date.parse(d.win.start), hi = Date.parse(d.win.end);
        const next = d.mode === 'pan' ? { start: iso(lo + shifted), end: iso(hi + shifted) }
            : d.mode === 'l' ? { start: iso(lo + shifted), end: d.win.end }
            : { start: d.win.start, end: iso(hi + shifted) };
        onWindow(clampWindow(next, full));
    }
    const end = (e) => { drag.current = null; try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {} };

    return html`
        <div class="scrub">
            <span class="scrub-label">overview</span>
            <div class="scrub-track" ref=${ref} title="Drag the ends to zoom, the middle to pan">
                ${items.map((i, n) => html`
                    <span class="mini" key=${n}
                          style=${`left:${pct(i.start)}%;width:${Math.max(0, pct(i.end) - pct(i.start))}%;top:${8 + i.row * 8}px;background:${i.accent}`}></span>`)}
                ${seasonEnd ? html`<span class="season-end" style=${`left:${pct(seasonEnd)}%`}></span>` : null}
                <!-- ⚠️ winbox IS NOT A MISNAMED win, AND RENAMING IT BREAKS THE DRAG. Tried, measured,
                     reverted: the adopted sheet declares .win FOUR TIMES for four different components,
                     and one of them sets pointer-events:none — on a control whose entire job is to be
                     dragged. winbox has its own rules here (cursor:grab, the active state) and its
                     handles are positioned by the scrub rules rather than by a .win descendant selector. Two names, two
                     components, and the coverage number that wanted them merged was wrong. -->
                <!-- 🔴 THE OVERVIEW SHOWED THE WHOLE SEASON AT FULL STRENGTH AND MARKED THE WINDOW WITH A
                     BORDER. Which half is "in view" was carried by a 1px edge, so on a wide season the
                     zoomed window read as one more item rather than as the frame. The masks dim what is
                     OUTSIDE it, which is the same figure/ground move the Track's own out-of-season shade
                     makes — and it is the mockup's, not an invention here. -->
                <span class="smask l" style=${`width:${Math.max(0, left)}%`} aria-hidden="true"></span>
                <span class="smask r" style=${`left:${Math.min(100, right)}%;right:0`} aria-hidden="true"></span>
                <div class="winbox" style=${`left:${left}%;width:${Math.max(1, right - left)}%`}
                     onPointerDown=${(e) => begin('pan', e)} onPointerMove=${move} onPointerUp=${end} onPointerCancel=${end}>
                    <span class="wh l" onPointerDown=${(e) => begin('l', e)} onPointerMove=${move} onPointerUp=${end} onPointerCancel=${end}></span>
                    <span class="wh r" onPointerDown=${(e) => begin('r', e)} onPointerMove=${move} onPointerUp=${end} onPointerCancel=${end}></span>
                </div>
            </div>
        </div>
    `;
}

// ── THE DEADLINE RAIL ─────────────────────────────────────────────────────────────────────────
//
// 🔴 THE TRACK DREW THREE DEADLINE LINES AND NAMED NONE OF THEM. `.dend` is a coloured hairline crossing every lane, and which colour meant which deadline was something you had to remember — while in the live season TWO of the three fall on the same day, so even the count was ambiguous. The rail is the flag row those lines were always missing, in flow above the lanes so it takes its own height rather than sitting over them.
//
// ⚠️ THE CHIPS DO NOT DRAG. The adopted sheet gives them an `ew-resize` cursor because the page it was drawn for had no other way to move a deadline; this portal has the identity editor directly above, where the date is typed and read by the bot's own parser. A season deadline must land on an exact day, and a coarse gesture across a 44-day axis is the wrong instrument for that — so the cursor is overridden rather than left promising a gesture that is not there. 🔴 TWO DEADLINES ON ONE DAY READ AS TWO SEPARATE DATES. The rail stacks them so neither label is hidden, which solves the collision and hides the FACT — that Battle Pass and Ranked end together is a thing about the season, and the reader had to compare two date strings to notice it.
//
// ⚠️ AND THE RAIL SAID *WHEN* WITHOUT SAYING *HOW LONG*. The span runs from now to the next deadline only: drawing all three turns the rail into three overlapping bars saying the same thing at three lengths.
function DeadRail({ rail, view, todayIso }) {
    if (!rail || (!rail.flags.length && !rail.pins.length)) return null;
    const byDate = new Map();
    for (const d of rail.flags) {
        const day = String(d.date).slice(0, 10);
        if (!byDate.has(day)) byDate.set(day, []);
        byDate.get(day).push(d);
    }
    const notches = [...byDate.entries()].filter(([, list]) => list.length > 1);
    const ahead = rail.flags.filter((d) => String(d.date).slice(0, 10) >= todayIso)
        .sort((a, b) => (String(a.date) < String(b.date) ? -1 : 1));
    const next = ahead[0] || null;
    const nowP = view.pct(todayIso), nextP = next ? view.pct(next.date) : null;
    const spanOk = next && nowP >= 0 && nextP > nowP && nextP <= 100;
    return html`
        <div class="deadrail" aria-label="Season deadlines">
            ${spanOk ? html`
                <button type="button" class="dspan" style=${`--c:${next.hex};left:${nowP}%;width:${Math.max(3, nextP - nowP)}%`}
                        data-tip=${`${next.title || next.label} is the next deadline.\nThis is the time left before it.`}
                        onClick=${() => {}} aria-label=${`Time remaining before ${next.label}`}></button>` : null}
            <!-- 🔴 A PATCH NOTE IS A DATED SEASON EVENT AND THE TRACK DID NOT DRAW ONE. The record panel
                 below lists them newest-first, which answers "what shipped"; it cannot answer "what else was
                 happening that week", which is the only question this axis exists for. Stacked because two
                 notes in one week is normal and two markers at one x is not readable. -->
            ${(rail.patches || []).map((p) => html`
                <button type="button" class=${'ptc mark stack' + (p.staged ? ' staged' : '')} key=${p.id}
                        style=${`--c:var(--patch);left:${view.pct(p.date)}%`}
                        data-tip=${`${p.title}\nPublished ${TL.fmt(p.date)}`}
                        aria-label=${`Patch note: ${p.title}, ${TL.fmt(p.date)}`}></button>`)}
            ${notches.map(([day, list]) => html`
                <div class="dnotch" key=${day} style=${`left:${view.pct(day)}%`}
                     data-tip=${`${list.length} deadlines land on ${TL.fmt(day)}: ${list.map((d) => d.label).join(', ')}`}>
                    ${list.map((d) => html`<i key=${d.key} style=${`--c:${d.hex}`}></i>`)}
                </div>`)}
            ${rail.flags.map((d) => html`
                <span key=${d.key} class=${'dflag' + (d.level ? ` lvl${d.level}` : '')}
                      style=${`--c:${d.hex};left:${view.pct(d.date)}%;cursor:default`}
                      data-tip=${`${d.title || d.label} ends ${TL.fmt(d.date)}\nChange it in the panel above, where the date is typed and read by the same parser the bot uses.`}>
                    <i class="dfk"></i><b class="dfl">${d.label}</b><span class="dfd">${TL.fmt(d.date)}</span>
                </span>`)}
            <!-- A deadline outside the window is WELDED TO THE EDGE it is beyond, not floated at a
                 position it does not have. "Beyond this view" is a statement about the boundary, so
                 it belongs on the boundary. -->
            ${rail.pins.map((d) => html`
                <span key=${'pin:' + d.key} class=${`dpin edge ${d.side}`} style=${`--c:${d.hex}`}
                      data-tip="Outside the current window.\nPress FIT, or drag the scrubber, to bring it back in.">
                    ${d.label} ${TL.fmt(d.date)} <em>${d.away}d ${d.side === 'r' ? 'beyond' : 'before'} this view</em>
                </span>`)}
        </div>
    `;
}

export function Track({ data, draft, window: visible, full, season, flags, onDragCommit, onFillGap, onWindow, ghost, rail, onPickDay }) {
    const rootRef = useRef(null);
    const [laneCol, setLaneCol] = useState(loadLaneCol);
    const view = TL.make(visible.start, visible.end);

    const lanes = LANES.filter((l) => (data[l.key] || []).length || (draft && (draft[l.key] || []).length));

    // Everything the season holds, flattened to {start, end, accent} for the overview strip. Draft items are included and wear their own lane's colour: the scrubber's job is to show what EXISTS, and a staged item exists — the plot above is where the difference between live and staged is drawn. 🔴 ONE ROW PER LANE, NOT ONE PILE. `.scrub .mini` is absolutely positioned with no `top`, so every bar in the season stacked at the same y and thirty-seven items rendered as one continuous stripe — an overview that shows the season has things in it and nothing else. The adopted stylesheet's own comment calls this strip a filmstrip; a filmstrip has frames. The row is the lane's index, which is also why the colours line up with the plot below.
    const scrubItems = LANES.flatMap((l, row) => [...(data[l.key] || []), ...((draft && draft[l.key]) || [])]
        .map((i) => ({ start: i.startDate || i.date, end: i.endDate || i.startDate || i.date, accent: `var(${l.topic})`, row }))
        .filter((i) => i.start && i.end));
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
    const [hover, setHover] = useState(null);
    // The inverse of view.pct, from the same window the view was built from — deriving the date any other way would put the readout and the bars on two different axes.
    const winA = visible && visible.start ? Date.parse(visible.start + 'T00:00:00Z') : NaN;
    const winB = visible && visible.end ? Date.parse(visible.end + 'T00:00:00Z') : NaN;
    const hoverDate = (hover === null || !Number.isFinite(winA) || !Number.isFinite(winB) || winB <= winA)
        ? null : TL.toISO(winA + (hover / 100) * (winB - winA));
    // The LAST of the three deadlines, skipping any marked TBD — a TBD date is a placeholder, and shading from a placeholder would grey out a month of real season.
    const ends = ['bpEnd', 'rankEnd', 'dmzEnd']
        .filter((k) => season && season[k] && !season[`${k}TBD`]).map((k) => String(season[k]).slice(0, 10)).sort();
    const oosPct = ends.length ? (() => { const p = view.pct(ends[ends.length - 1]); return p >= 0 && p < 100 ? p : null; })() : null;

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
            <div class="tk-wrap" ref=${rootRef}
                 onMouseMove=${(e) => {
                     const box = e.currentTarget.getBoundingClientRect();
                     if (!box.width) return;
                     setHover(Math.max(0, Math.min(100, ((e.clientX - box.left) / box.width) * 100)));
                 }}
                 onMouseLeave=${() => setHover(null)}
                 onClick=${(e) => {
                     // Only the empty axis opens a day — a click that started on a bar is that bar's own.
                     if (!onPickDay || !hoverDate || e.target.closest('.bar, .pt, .dflag, .dpin, .dspan, .nm, button')) return;
                     onPickDay(hoverDate);
                 }}><div class="tk-inner">
                ${onWindow && full ? html`
                    <${Scrub} items=${scrubItems} win=${visible} full=${full} seasonEnd=${season?.bpEnd || null}
                              onWindow=${onWindow} />` : null}
                <!-- ⚠️ THE READOUT IS THE POINT, NOT THE LINE. A bare vertical rule tells you where the pointer is, which you already knew; the date under it is the thing the ruler's five tick labels cannot give you between ticks. Pointer-driven and aria-hidden — it says nothing a keyboard user is missing, because the same dates are in the table below. -->
                ${hover === null || !hoverDate ? null : html`
                    <div class="xhair on" style=${'left:' + hover + '%'} aria-hidden="true">
                        <span class="xd"><b>${TL.fmt(hoverDate)}</b></span>
                    </div>`}
                <${Ruler} view=${view} />
                <${DeadRail} rail=${rail} view=${view} todayIso=${TL.toISO(Date.now())} />
                <div class="lanes">
                    ${lanes.map((l) => html`
                        <${Lane} key=${l.key} lane=${l} list=${data[l.key] || []} isDraft=${false} view=${view}
                                 collapsed=${collapsedFor(l, false)} onToggle=${(e) => toggle(l, false, e.altKey)}
                                 fits=${fits} onDragCommit=${onDragCommit}
                                 ghost=${ghost && ghost.lane === l.key ? ghost : null} />`)}
                    ${draft && lanes.some((l) => (draft[l.key] || []).length) ? html`
                        <div class="divider">Next season draft — staged, not live</div>
                        ${lanes.filter((l) => (draft[l.key] || []).length).map((l) => html`
                            <${Lane} key=${'d:' + l.key} lane=${l}
                                     list=${(draft[l.key] || []).map((i) => ({ ...i, state: 'staged' }))}
                                     isDraft=${true} view=${view} collapsed=${collapsedFor(l, true)}
                                     onToggle=${(e) => toggle(l, true, e.altKey)} fits=${fits} />`)}
                    ` : null}
                    <div class="ov">
                        <!-- 🔴 THE TRACK RAN TO ITS RIGHT EDGE WITH NOTHING SAYING THE SEASON HAD STOPPED. Everything past the last real deadline is time no player is playing this season in, and a bar drawn there looks exactly like a bar drawn inside it. Shaded from the LAST deadline, not the battle pass: only a span can outlive the season, and the battle pass is rarely the latest of the three. -->
                        ${oosPct === null ? null : html`
                            <div class=${'oos' + (100 - oosPct >= 14 ? ' wide' : '')}
                                 style=${'left:' + oosPct + '%'} aria-hidden="true"></div>`}
                        <!-- 🔴 A DOUBLE-CP WINDOW CHANGES WHAT EVERY DRAW IN IT COSTS, and the Track drew it as
                             an ordinary event bar. isDoubleCP is a real stored flag — models/SeasonalData.js
                             carries it precisely so /draw calculator can quote the right price without anybody
                             remembering an event is on — and the one screen showing the season's shape gave the
                             reader no way to see the window that pricing depends on. -->
                        ${(data.calendar || []).filter((c) => c.isDoubleCP && c.date).map((c) => {
                            const a = view.pct(String(c.date).slice(0, 10));
                            const b = view.pct(String(c.endDate || c.date).slice(0, 10));
                            if (b <= 0 || a >= 100) return null;
                            return html`
                                <div class="win" key=${c._id || c.title}
                                     style=${`left:${Math.max(0, a)}%;width:${Math.min(100, b) - Math.max(0, a)}%`}
                                     data-tip=${`Double CP — every draw in this window is priced differently\n${c.title}`}>
                                    <span class="lbl">2X CP</span>
                                </div>`;
                        })}
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
