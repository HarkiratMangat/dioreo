// portal/ui/track.js — ESM. The Track view layer: ruler + lanes + bars + flags.
//
// bandClass/laneFor/tierOf/barGeometry/findOverlaps/findGaps come from track.logic.js, loaded as a plain CLASSIC <script> before this module (see portal/render.js's script order) -- a classic script's top-level function declarations become globals, which an ESM module can read like any other global without an import statement. This is the actual working resolution of the "Node never loads ESM, browser never loads CJS" split: Node's require() reads the SAME file as CommonJS via module.exports, and the browser reads it as a non-module script that defines globals. A literal `import {...} from './track.logic.js'` would fail in every real browser (no export statement exists), so this file deliberately does not attempt one.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';

const TOPIC_VAR = { draw: '--draw', returning: '--ret', event: '--ev', playlist: '--play', patchnote: '--patch' };
const LANE_LABEL = { draw: 'New draws', returning: 'Returning', event: 'Events', playlist: 'Playlists', patchnote: 'Patch notes' };

function Bar({ item, window, season }) {
    const { left, width } = barGeometry(item, window);
    const state = item.state || (tierOf(item, season) === 'conflict' ? 'conflict' : 'live');
    const cls = bandClass({ state });
    const style = `left:${left}%;width:${width}%;--topic-accent:var(${TOPIC_VAR[laneFor(item)] || '--ink2'})`;
    return html`<div class=${cls} style=${style} title=${item.title}>${item.title}</div>`;
}

function Lane({ name, items, window, season }) {
    return html`
        <div class="lane">
            <span class="nm">${name}</span>
            <div class="tk">${items.map(item => html`<${Bar} item=${item} window=${window} season=${season} />`)}</div>
        </div>
    `;
}

// <Track view=Season|Month|Week /> -- exported as a named component; Task 5's Shell wraps it as the switchable top half. `data` groups items by lane (spec's live rails) and `draft` mirrors it for the staged second rail below the divider (the existing draft area given a picture for the first time).
export function Track({ data, draft, window, season, flags = [] }) {
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
                    ${lanes.map(k => html`<${Lane} name=${LANE_LABEL[k]} items=${(data[k] || []).filter(i => laneFor(i) === k)} window=${window} season=${season} />`)}
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
