// portal/ui/track.js — ESM. The Track view layer: ruler + lanes + bars + flags + drag handles.
//
// bandClass/laneFor/tierOf/barGeometry/findOverlaps/findGaps/dateFromOffset/editOpFor come from track.logic.js, loaded as a plain CLASSIC <script> before this module (see portal/render.js's script order) -- a classic script's top-level function declarations become globals, which an ESM module can read like any other global without an import statement. This is the actual working resolution of the "Node never loads ESM, browser never loads CJS" split: Node's require() reads the SAME file as CommonJS via module.exports, and the browser reads it as a non-module script that defines globals. A literal `import {...} from './track.logic.js'` would fail in every real browser (no export statement exists), so this file deliberately does not attempt one -- season.js shipped exactly that mistake once; see its own header for the live-verified fix.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState } from '../vendor/preact-hooks.mjs';

const TOPIC_VAR = { draw: '--draw', returning: '--ret', event: '--ev', playlist: '--play', patchnote: '--patch' };
const LANE_LABEL = { draw: 'New draws', returning: 'Returning', event: 'Events', playlist: 'Playlists', patchnote: 'Patch notes' };

// Drag handle on a band's right edge -- reassigns the item's END date only (the mockup's only worked example; the start edge and whole-band move are deliberately out of this pass's scope). Uses `globalThis.addEventListener`, not the bare `window` global, because this component's OWN `window` prop (the visible date range) shadows the real global for its entire body -- `globalThis` resolves unambiguously regardless of that shadow, so the prop keeps its established name across every Track/Lane/Bar call site instead of a renamed-just-here special case.
function Bar({ item, window, season, onDragCommit }) {
    const { left, width } = barGeometry(item, window);
    const state = item.state || (tierOf(item, season) === 'conflict' ? 'conflict' : 'live');
    const cls = bandClass({ state });
    // top offset stacks a bar into its assigned row (assignRows in track.logic.js) so two items overlapping in the same lane get their own row instead of painting on the same pixels. transform:none cancels .bar's CSS translateY(-50%) centering, which assumed a single row.
    const top = (item.row || 0) * 26 + 2;
    const style = `left:${left}%;width:${width}%;top:${top}px;transform:none;--topic-accent:var(${TOPIC_VAR[laneFor(item)] || '--ink2'})`;
    const [dragLabel, setDragLabel] = useState(null);

    function startDrag(e) {
        e.stopPropagation();
        e.preventDefault();
        const track = e.currentTarget.closest('.tk');
        function pctFor(ev) {
            const rect = track.getBoundingClientRect();
            return Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
        }
        function onMove(ev) {
            setDragLabel(dateFromOffset(pctFor(ev), window).toDateString());
        }
        function onUp(ev) {
            globalThis.removeEventListener('pointermove', onMove);
            globalThis.removeEventListener('pointerup', onUp);
            setDragLabel(null);
            onDragCommit(item, dateFromOffset(pctFor(ev), window));
        }
        globalThis.addEventListener('pointermove', onMove);
        globalThis.addEventListener('pointerup', onUp);
    }

    return html`
        <div class=${cls} style=${style} title=${item.title}>
            <span class="bl">${item.title}</span>
            ${onDragCommit ? html`<span class="handle" onPointerDown=${startDrag} title="Drag to change the end date"></span>` : null}
            ${dragLabel ? html`<span class="dragtip">${dragLabel}</span>` : null}
        </div>
    `;
}

function Lane({ name, items, window, season, onDragCommit }) {
    const stacked = assignRows(items);
    const rows = stacked.length ? Math.max(...stacked.map((i) => i.row)) + 1 : 1;
    // Lane height grows with the row count an overlap actually needs, instead of a fixed height that only ever fit one bar per lane.
    const laneStyle = rows > 1 ? `height:${rows * 26 + 4}px` : '';
    return html`
        <div class="lane" style=${laneStyle}>
            <span class="nm">${name}</span>
            <div class="tk">${stacked.map(item => html`<${Bar} item=${item} window=${window} season=${season} onDragCommit=${onDragCommit} />`)}</div>
        </div>
    `;
}

// `data[k]`/`draft[k]` are read directly, with NO re-filtering by laneFor(item) -- a prior version filtered here, but laneFor() reads item.kind, which no caller ever set, so EVERY draw/returning lane silently rendered empty (calendar's 'event' bucket only "worked" by the fallback accidentally equaling its own key). Bucketing by lane is now the caller's job (season.js's toTrackItems), the same contract `draft` already had. The Track's own defect flags. track.logic.js has carried findOverlaps/findGaps/tierOf since the first build, with dedicated tests -- and NOTHING has ever called them. The `flags` prop existed and every caller passed nothing, so the row never rendered. That row is the realm's entire reason for being: spec §8.2 says the Track exists so that three defects which "have no signal at all today" become impossible to miss. Each flag NAMES THE PROBLEM, and where the mockup gives one, offers the fix rather than only reporting (01-season-spine.html's "Clamp to BP end" / "Fill").
function deriveFlags(data, window, season, actions) {
    const items = Object.values(data || {}).flat();
    const out = [];
    for (const item of items) {
        if (tierOf(item, season) === 'conflict') {
            const over = Math.ceil((new Date(item.endDate) - new Date(season.bpEnd)) / 86400000);
            out.push({
                title: item.title, detail: `ends ${over} day${over === 1 ? '' : 's'} after the battle pass — it will outlive the season.`,
                // Mockup's own worked example (01-season-spine.html): a conflict is fixable in one click, not just a fact to go act on elsewhere. Reuses the exact edit path Track's own drag handle already commits through.
                action: actions?.onClamp && season?.bpEnd ? { label: 'Clamp to BP end', onClick: () => actions.onClamp(item, new Date(season.bpEnd)) } : null,
            });
        }
    }
    for (const gap of findGaps(items, window)) {
        const days = Math.round((gap.end - gap.start) / 86400000);
        out.push({
            title: `${gap.start.toDateString().slice(4, 10)}–${gap.end.toDateString().slice(4, 10)}`, detail: `has no draw and no event scheduled (${days} days).`,
            action: actions?.onFill ? { label: 'Fill', onClick: () => actions.onFill(gap) } : null,
        });
    }
    for (const [a, b] of findOverlaps(items)) {
        out.push({ title: `${a.title} and ${b.title}`, detail: 'overlap in the same lane.' });
    }
    return out;
}

// 🔴 THE ROW IS CAPPED, AND THE CAP IS THE DESIGN. Rendered uncapped against the real dev catalogue (23 calendar items) this produced ~50 flags and buried the page under "X and Y overlap in the same lane" — concurrent events and playlists are NORMAL in CODM, so an overlap is information rather than a defect, and fifty pieces of information is none. Ordering is deliberate: a conflict (runs past the battle-pass end) is unambiguously wrong, a gap is probably wrong, an overlap is only maybe. deriveFlags pushes them in that order, so slicing keeps the most severe.
//
// ⚠️ Deliberately NOT filtered by lane. It would be easy to declare "overlaps only matter for draws" and cut the noise at the source, but that asserts a CODM scheduling rule this session cannot verify — and a detector that silently drops a real finding is worse than one that ranks it last.
const MAX_FLAGS = 3;

// <Track view=Season|Month|Week /> -- exported as a named component; Task 5's Shell wraps it as the switchable top half. `data` groups items by lane (spec's live rails) and `draft` mirrors it for the staged second rail below the divider (the existing draft area given a picture for the first time).
export function Track({ data, draft, window, season, flags, onDragCommit, onFillGap }) {
    // A lane with nothing in it, live or draft, is not rendered. Five always-on lanes meant the patch-notes rail (which season.js has never supplied) plus any unused topic sat as empty 38px rows -- structure announcing content that is not there. 🔴 AND `patchnote` MUST STAY UNFILLED — that is now a DESIGN DECISION, not an oversight. `docs/db-deferred-list.md` carried a [P2 · XS] entry prescribing `patchnote: toTrackItems(...)` to "fix" the missing fifth lane; it was closed 2026-08-24 as superseded. A patch note is a PUBLICATION, not a state with a duration -- models/PatchNote.js gives it a releaseDate and no end, and isEventEnded() returns false for it forever -- so it does not belong on an axis whose every other lane answers "when is this ON?". It also stretched the axis for nothing: the live season publishes Jul 6 and Jul 22 while nothing is scheduled before Aug 6. The mockup renders it as the Season Record, a vertical rail beneath the Track. See COMPANION.md §5.9d. The KEY stays in LANE_LABEL/TOPIC_VAR because historical rows and the Manifest still use it; filling it here is what must not happen.
    const lanes = Object.keys(LANE_LABEL).filter(k => (data[k] || []).length || (draft && (draft[k] || []).length));
    const shown = flags || deriveFlags(data, window, season, { onClamp: onDragCommit, onFill: onFillGap });
    return html`
        <div class="panel" id="track">
            <div class="ph">
                <span class="t">Season track</span>
                <span class="rt" style="display:flex;gap:12px;align-items:center">
                    <span class="leg live"><i></i>live</span>
                    <span class="leg stag"><i></i>staged</span>
                    <span class="leg conf"><i></i>conflict</span>
                </span>
            </div>
            <div style="padding:8px 14px 0">
                <div class="ruler">
                    <span style="left:0%">${window.start}</span>
                    <span data-end style="left:100%">${window.end}</span>
                </div>
                <div class="lanes">
                    ${lanes.map(k => html`<${Lane} name=${LANE_LABEL[k]} items=${data[k] || []} window=${window} season=${season} onDragCommit=${onDragCommit} />`)}
                    ${draft ? html`
                        <div class="lane divider">Next season draft — staged, not live</div>
                        ${lanes.map(k => html`<${Lane} name=${'Draft ' + LANE_LABEL[k].toLowerCase()} items=${(draft[k] || []).map(i => ({ ...i, state: 'staged' }))} window=${window} season=${season} />`)}
                    ` : null}
                    <div class="ov">
                        <div class="now" style=${`left:${nowPercent(window)}%`}></div>
                        ${season?.bpEnd ? html`<div class="bpe" style=${`left:${percentOf(season.bpEnd, window)}%`}></div>` : null}
                    </div>
                </div>
            </div>
            ${shown.length ? html`
                <div class="flags">
                    ${shown.slice(0, MAX_FLAGS).map(f => html`<span class="flag"><b>${f.title}</b> ${f.detail} ${f.action ? html`<button onClick=${f.action.onClick}>${f.action.label}</button>` : null}</span>`)}
                    ${shown.length > MAX_FLAGS ? html`<span class="flag" style="border-left-color:var(--rule);color:var(--ink3)">and ${shown.length - MAX_FLAGS} more overlapping or unscheduled stretch${shown.length - MAX_FLAGS === 1 ? '' : 'es'} — concurrent events are normal, so these rank last.</span>` : null}
                </div>
            ` : null}
        </div>
    `;
}

function percentOf(date, window) {
    const w = new Date(window.start).getTime(), e = new Date(window.end).getTime();
    return Math.max(0, Math.min(100, ((new Date(date).getTime() - w) / Math.max(1, e - w)) * 100));
}
function nowPercent(window) { return percentOf(new Date(), window); }
