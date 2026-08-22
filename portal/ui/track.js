// portal/ui/track.js — ESM. The Track view layer: ruler + lanes + bars + flags + drag handles.
//
// bandClass/laneFor/tierOf/barGeometry/findOverlaps/findGaps/dateFromOffset/editOpFor come from
// track.logic.js, loaded as a plain CLASSIC <script> before this module (see portal/render.js's
// script order) -- a classic script's top-level function declarations become globals, which an ESM
// module can read like any other global without an import statement. This is the actual working
// resolution of the "Node never loads ESM, browser never loads CJS" split: Node's require() reads
// the SAME file as CommonJS via module.exports, and the browser reads it as a non-module script that
// defines globals. A literal `import {...} from './track.logic.js'` would fail in every real browser
// (no export statement exists), so this file deliberately does not attempt one -- season.js shipped
// exactly that mistake once; see its own header for the live-verified fix.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState } from '../vendor/preact-hooks.mjs';

const TOPIC_VAR = { draw: '--draw', returning: '--ret', event: '--ev', playlist: '--play', patchnote: '--patch' };
const LANE_LABEL = { draw: 'New draws', returning: 'Returning', event: 'Events', playlist: 'Playlists', patchnote: 'Patch notes' };

// Drag handle on a band's right edge -- reassigns the item's END date only (the mockup's only worked
// example; the start edge and whole-band move are deliberately out of this pass's scope). Uses
// `globalThis.addEventListener`, not the bare `window` global, because this component's OWN `window`
// prop (the visible date range) shadows the real global for its entire body -- `globalThis` resolves
// unambiguously regardless of that shadow, so the prop keeps its established name across every
// Track/Lane/Bar call site instead of a renamed-just-here special case.
function Bar({ item, window, season, onDragCommit }) {
    const { left, width } = barGeometry(item, window);
    const state = item.state || (tierOf(item, season) === 'conflict' ? 'conflict' : 'live');
    const cls = bandClass({ state });
    const style = `left:${left}%;width:${width}%;--topic-accent:var(${TOPIC_VAR[laneFor(item)] || '--ink2'})`;
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
    return html`
        <div class="lane">
            <span class="nm">${name}</span>
            <div class="tk">${items.map(item => html`<${Bar} item=${item} window=${window} season=${season} onDragCommit=${onDragCommit} />`)}</div>
        </div>
    `;
}

// <Track view=Season|Month|Week /> -- exported as a named component; Task 5's Shell wraps it as the switchable top half. `data` groups items by lane (spec's live rails) and `draft` mirrors it for the staged second rail below the divider (the existing draft area given a picture for the first time).
//
// `data[k]`/`draft[k]` are read directly, with NO re-filtering by laneFor(item) -- a prior version
// filtered here, but laneFor() reads item.kind, which no caller ever set, so EVERY draw/returning
// lane silently rendered empty (calendar's 'event' bucket only "worked" by the fallback accidentally
// equaling its own key). Bucketing by lane is now the caller's job (season.js's toTrackItems), the
// same contract `draft` already had.
export function Track({ data, draft, window, season, flags = [], onDragCommit }) {
    const lanes = Object.keys(LANE_LABEL);
    return html`
        <div class="panel" id="track">
            <div class="ph"><span class="t">Season track</span></div>
            <div style="padding:8px 14px 0">
                <div class="ruler">
                    <span style="left:0%">${window.start}</span>
                    <span style="left:100%">${window.end}</span>
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
            ${flags.length ? html`
                <div class="flags">
                    ${flags.map(f => html`<span class="flag"><b>${f.title}</b> ${f.detail} ${f.action ? html`<button onClick=${f.action.onClick}>${f.action.label}</button>` : null}</span>`)}
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
