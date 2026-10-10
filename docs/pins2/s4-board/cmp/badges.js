// Badge motion, before and after — a comparison page, not part of the board. Every badge here is the board's own
// B3Badges component on the board's own CSS. The BEFORE column restores the retired main-thread loops (the glow's
// custom-property keyframes, the rim's --b3-ang, the leak's six percentages) and hides their compositor replacements.
import { html } from '../vendor/htm-preact.mjs';
import { render } from '../vendor/preact.mjs';
import { B3Badges } from '../b3/armory-parts.js';
import { legacyGlowCss } from '../b3/volt.js';

const BUILDS = [
    ['META', 'A lightning strike through the frame; the light lands where each strike hits', { isMeta: true }],
    ['BEST', 'Light rakes across the face (a transform in both — unchanged)', { categoryRank: 'best', category: 'AR' }],
    ['TOP 3', 'Light travels the rim', { categoryRank: 'top3', category: 'AR' }],
    ['TOP 4', 'Light travels the rim', { categoryRank: 'top4', category: 'AR' }],
    ['TOP 5', 'Light travels the rim', { categoryRank: 'top5', category: 'AR' }],
    ['TOXIC', 'Poison leaks across the plate', { isToxic: true }],
];
const build = (i, extra) => ({ _id: `cmp-${i}`, mode: 'MP', category: 'AR', ...extra });

function Row({ label, note, i, extra }) {
    return html`<div class="cmp-row">
        <div class="cmp-k"><b>${label}</b><span>${note}</span></div>
        <div class="cmp-cell cmp-old"><${B3Badges} b=${build(i, extra)} /></div>
        <div class="cmp-cell cmp-new"><${B3Badges} b=${build(i, extra)} /></div>
    </div>`;
}

function Page() {
    return html`<main class="cmp">
        <div class="cmp-h">
            <h1>Badge motion, before and after</h1>
            <p>The same six badges, live, on the board's own component and CSS. <b>Before</b> animates CSS custom properties, which only the browser's main thread can interpolate, so every frame restyles, repaints and re-layerizes the page. <b>After</b> animates only opacity and transform on pre-drawn layers, which the compositor runs by itself.</p>
            <dl class="cmp-m">
                <div><dt>Board at rest, no badge on screen</dt><dd>14.3% → <b>0%</b> of a CPU core</dd></div>
                <div><dt>One META badge on screen</dt><dd>13.6% → <b>1.2–1.6%</b></dd></div>
                <div><dt>Measured</dt><dd>headless Chrome, 60Hz, no input</dd></div>
            </dl>
        </div>
        <section class="cmp-grid" aria-label="Actual size">
            <div class="cmp-row cmp-head"><div></div><div>Before · main thread</div><div>After · compositor</div></div>
            ${BUILDS.map(([label, note, extra], i) => html`<${Row} key=${label} label=${label} note=${note} i=${i} extra=${extra} />`)}
        </section>
        <section class="cmp-grid cmp-zoom" aria-label="Twice actual size">
            <div class="cmp-row cmp-head"><div>2× for detail</div><div>Before</div><div>After</div></div>
            ${BUILDS.map(([label, note, extra], i) => html`<${Row} key=${label} label=${label} note="" i=${i} extra=${extra} />`)}
        </section>
    </main>`;
}

// The old META glow ran as an inline animation on the badge, started at the instant its art loaded. The new mount
// starts its light layers at that same instant, so the BEFORE badge takes its start from them: same clock, old look.
function driveOldGlow(root) {
    const start = (layer) => {
        const m = /b3vb(\d)\d/.exec(layer.style.animationName || layer.style.animation || '');
        const badge = layer.closest('.b3-bdg');
        if (!m || !badge || badge.dataset.oldGlow) return;
        badge.dataset.oldGlow = '1';
        badge.style.animation = `b3volt${m[1]} ${getComputedStyle(layer).animationDuration} linear infinite`;
    };
    new MutationObserver((ms) => ms.forEach((x) => { if (x.target.classList && x.target.classList.contains('b3-vb')) start(x.target); }))
        .observe(root, { subtree: true, attributes: true, attributeFilter: ['style'] });
}

(async () => {
    const st = document.createElement('style');
    st.textContent = await legacyGlowCss();
    document.head.appendChild(st);
    render(html`<${Page} />`, document.getElementById('cmp'));
    document.querySelectorAll('.cmp-old').forEach(driveOldGlow);
})();
