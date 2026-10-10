// b3/volt.js — META's discharge IS Harkirat's own `Lightning VFX.svg`, masked into the badge frame.
//
// THIRTEEN attempts preceded this and twelve were mine. Attempts 1-4 drew an effect crossing the badge, which is the
// right register for a plaque, a medal and a leak and the wrong one for a conductor. Attempts 5-12 hand-drew angular
// zigzags because my first message after he handed the file over ruled it out unrendered — "386x362 full-frame against
// a ~140x22 badge, it will look wrong at icon size" — and that untested sentence governed four hours. His instruction
// ended it: "Try literally masking the asset into the badge frame." His verdict on the result: "the lightning itself
// looks great." So nothing here is drawn; his cel is clipped into the frame and the badge lights from it.
//
// FOUR FACTS THIS FILE IS BUILT ON, each of which cost real time to find:
//  · An SVG used as `mask-image` or `background-image` DOES NOT RUN ITS SMIL. An `<img>` does. That decides everything.
//  · Recolouring means rewriting the file's `fill` and handing back a BLOB URL — the only way to keep SMIL alive.
//  · BLURRING this file produces no glow at all: hair-thin strokes on transparency lose their alpha. Stacked
//    `drop-shadow` works, because it reads the alpha silhouette, and it compounds.
//  · A CSS animation starts when its style applies; SMIL-in-an-`<img>` starts when the IMAGE LOADS. They drift
//    permanently unless the CSS is started inside `img.onload`, which is the last thing `mountVolt` does.
//  · EVERY `<img>` WITH THE SAME URL SHARES ONE SMIL CLOCK — the one started by the FIRST image to load that URL.
//    Measured 2026-09-18 19:35 EDT: an image mounted 1.3s after another on the same blob URL drew the identical frame at every
//    sample, while one on a fresh object URL of the same Blob did not. So restarting the CSS at a later badge's onload
//    set its ambiance 1.3s (or however long) off its strikes — his "the ambiance and the lightning strikes aren't
//    sync'd". Each mount now gets its OWN object URL, so its SMIL starts at its own load, the instant its CSS restarts.
//
// THE AMBIANCE AND THE LIGHTNING COME OFF ONE TABLE. They were generated separately once, and the moment a loop
// changed the light kept firing at the old moments — "they feel like 2 different animations when they're supposed to
// be tied together". `retime()` and `ambCss()` below both read `startsFor()`, so they cannot disagree.

const ORIG = 3.333;                                  // his file's own loop
const BURSTS = [[0, 0.27], [0.31, 0.48], [0.63, 0.83]]; // where its three bursts live inside it
const PEAK = [0.30, 0.22, 0.34];                     // how bright each one gets

// ── His settings, chosen in the badge playground and quoted from his message of 2026-09-17 ──────────────────────────
// "scale the artwork to 2.00x, position it at 50% 60%, rotate it -16deg. for the light, a much heavier bloom (1.70x),
//  ambiance at 1.60x, resting light 0.06. for the timing, a 8.2s loop, strikes 45% of the loop apart, rows staggered
//  1.30x." Bloom, ambiance, resting light, scale, offset and rotation are CSS and live in `board.css`; the three
//  timing numbers are here because they shape the SVG as well as the keyframes.
const LOOP = 8.2, SPREAD = 0.45, STAGGER = 1.30, REST = 0.06, SCALE = 2;

// THREE VARIANTS, not one. 34 builds carry META and a dozen are on screen at once; one shared timeline is his very
// first badge complaint — "currently they all play the animation at the exact same time... that's just odd feeling."
// Each variant is a different loop length taken from his stagger: 8.2s, 9.90s, 11.61s. ⚠️ THREE and not more,
// because his stagger was set against the playground's TWO badges and a fourth step lands at 13.31s — inside the band
// measured dark 87% of the time. Extrapolating his dial past what he tested is how a tuned value arrives looking wrong.
// repeat is four rows away. The build's own `--ph` picks the variant, so a row keeps its variant across every render.
const VARIANTS = 3;
const durOf = (v) => +(LOOP * (1 + v * 0.16 * STAGGER)).toFixed(2);
const offOf = (v) => +(v * 0.03 * STAGGER).toFixed(4);
const startsFor = (off) => [0 + off, SPREAD + off, SPREAD * 2 + off].map((t) => Math.max(0, Math.min(0.9, t)));

let RAW = null, loading = null, styleEl = null, POS = null;
const blobs = new Map();

// Where each burst is DRAWN on the 386x362 canvas, averaged over its frames. The ring's hot spot and the halo both
// read these, which is what makes the light appear where the strike is instead of in the middle of the badge —
// "make it light up the region where the lightning is striking, same with the glow. making it follow the actual strikes?"
function burstPos(raw) {
    const out = [[], [], []];
    const kts = [...raw.matchAll(/keyTimes="([^"]+)"[^>]*\/>/g)].map((x) => x[1].split(';').map(Number));
    const vls = [...raw.matchAll(/values="([^"]+)"/g)].map((x) => x[1].split(';').map((t) => t.trim()));
    const tops = [...raw.matchAll(/<g transform="matrix\(1,0,0,1,0,0\)"[\s\S]*?<g[^>]*transform="matrix\(1,0,0,1,([-\d.]+),([-\d.]+)\)"/g)];
    tops.forEach((t, i) => {
        const kt = kts[i] || [0], vs = vls[i] || ['visible'];
        let t0 = 0;
        for (let j = 0; j < vs.length; j++) if (vs[j] === 'visible') { t0 = kt[j]; break; }
        for (let b = 0; b < 3; b++) if (t0 >= BURSTS[b][0] && t0 <= BURSTS[b][1]) out[b].push([+t[1], +t[2]]);
    });
    return out.map((g) => (g.length
        ? [g.reduce((a, c) => a + c[0], 0) / g.length / 386, g.reduce((a, c) => a + c[1], 0) / g.length / 362]
        : [0.5, 0.5]));
}

// The artwork is scaled 2x and pushed to 60% Y, so a burst's position on the CANVAS is not its position on the BADGE.
// The same transform is applied to the hot spot, flattened on Y because the badge is far wider than it is tall.
function strikeXY(i) {
    const [nx, ny] = POS[i], k = Math.min(SCALE, 2.2);
    return [Math.max(4, Math.min(96, 50 + (nx * 100 - 50) * k)),
            Math.max(8, Math.min(92, 50 + (ny * 100 - 50) * k * 0.55))];
}

// His loop is 3.333s with all three bursts inside the first 0.83, so played straight it is relentless — "add a pause
// or minor elements/phase, right now it's at 100% strength at 100% of the time". Retiming remaps each frame's visible
// window onto a longer loop instead of slowing it down, so the strikes keep their original speed and gain real dark
// between them. Every frame that is not inside a burst is parked at 0.999 and never shows.
function retime(dur, starts, colour) {
    const at = (t) => {
        for (let i = 0; i < 3; i++) {
            const [lo, hi] = BURSTS[i];
            if (t >= lo && t <= hi) return starts[i] + (t - lo) * ORIG / dur;
        }
        return null;
    };
    return RAW.replace(/<animate\b[^>]*\/>/g, (tag) => {
        const kt = /keyTimes="([^"]+)"/.exec(tag)[1].split(';').map(Number);
        const vs = /values="([^"]+)"/.exec(tag)[1].split(';').map((s) => s.trim());
        let t0 = 0;
        for (let j = 0; j < vs.length; j++) if (vs[j] === 'visible') { t0 = kt[j]; break; }
        let nt = at(t0);
        if (nt === null) nt = 0.999;
        const frame = (1 / 100) * ORIG / dur;
        const a = +nt.toFixed(5), b = +Math.min(nt + frame, 0.9995).toFixed(5);
        return `<animate repeatCount="indefinite" begin="0s" calcMode="discrete" dur="${dur}s" `
            + `values="hidden; visible; hidden; hidden" keyTimes="0; ${a}; ${b}; 1" attributeName="visibility" />`;
    }).replace(/fill="#ffffff"/g, `fill="${colour}"`);
}

// 🔴 THE GLOW IS OPACITY ON PRE-BUILT LAYERS NOW (2026-09-18 20:40 EDT). It used to animate three registered custom properties
// (--lit, --sx, --sy) on the badge, and a custom property can only be interpolated on the MAIN thread: every frame the
// browser restyled, repainted and re-layerized to move one glow — measured at ~12% of a core at 60Hz for a single badge
// on screen, 92% of which was this glow (the SMIL art 0.7 points, the BEST shine 0.3). Discord's badges stay cheap for
// the reason this now does: nothing that loops touches anything but opacity and transform, which the compositor runs
// without the main thread. The exact-spot light survives because a burst's hot spot never moved within the burst —
// `strikeXY(i)` is ONE position per burst — so each burst gets its own layer drawn at its own spot and peak, and only
// its opacity animates, off the same strike table. What is lost is the in-between glide from one burst's spot to the
// next, during which the light was at rest anyway.
function burstCss(v, dur, starts) {
    const out = [];
    for (let i = 0; i < 3; i++) {
        const [lo, hi] = BURSTS[i], s0 = starts[i], pk = PEAK[i];
        const len = (hi - lo) * ORIG / dur, o = (l) => Math.max(0, Math.min(1, (l - REST) / (pk - REST)));
        const st = [[0, 0], [Math.max(s0 - 0.004, 0), 0], [s0, 1], [s0 + len * 0.4, o(pk * 0.62)], [s0 + len, o(pk * 0.3)], [Math.min(s0 + len + 0.045, 0.999), 0], [1, 0]];
        out.push(`@keyframes b3vb${v}${i}{` + st.map(([t, a]) => `${(t * 100).toFixed(3)}%{opacity:${a.toFixed(3)}}`).join('') + '}');
    }
    return out.join('\n');
}

// THE RESTING SPOT. Between strikes the old glow never went dark on the border: its --sx/--sy held each strike's spot and
// then drifted linearly to the next one (and to centre at the loop's ends, where the keyframes leave them unset), so a
// faint hot spot always sat on the trim. That drift is a TRANSLATE of one spot under a fixed ring mask — compositor only.
function restCss(v, dur, starts) {
    const st = [[0, 50, 50]];
    for (let i = 0; i < 3; i++) {
        const [lo, hi] = BURSTS[i], s0 = starts[i], len = (hi - lo) * ORIG / dur, [sx, sy] = strikeXY(i);
        st.push([Math.max(s0 - 0.004, 0), sx, sy], [Math.min(s0 + len + 0.045, 0.999), sx, sy]);
    }
    st.sort((a, b) => a[0] - b[0]);
    st.push([1, 50, 50]);
    return `@keyframes b3vr${v}{` + st.map(([t, x, y]) => `${(t * 100).toFixed(3)}%{transform:translate(${(x - 50).toFixed(1)}%,${(y - 50).toFixed(1)}%)}`).join('') + '}';
}

// (retired: ambCss, the custom-property glow — kept only as the record of what the layers reproduce)
function ambCss(name, dur, starts) {
    const steps = [];
    for (let i = 0; i < 3; i++) {
        const [lo, hi] = BURSTS[i], s0 = starts[i], pk = PEAK[i];
        const len = (hi - lo) * ORIG / dur, [sx, sy] = strikeXY(i);
        steps.push([Math.max(s0 - 0.004, 0), REST, sx, sy], [s0, pk, sx, sy],
                   [s0 + len * 0.4, pk * 0.62, sx, sy], [s0 + len, pk * 0.3, sx, sy],
                   [Math.min(s0 + len + 0.045, 0.999), REST, sx, sy]);
    }
    steps.sort((a, b) => a[0] - b[0]);
    return `@keyframes ${name}{0%{--lit:${REST}}`
        + steps.map(([t, l, sx, sy]) => `${(t * 100).toFixed(3)}%{--lit:${l.toFixed(3)};--sx:${sx.toFixed(1)}%;--sy:${sy.toFixed(1)}%}`).join('')
        + `100%{--lit:${REST}}}`;
}

function install() {
    POS = burstPos(RAW);
    const css = [];
    for (let v = 0; v < VARIANTS; v++) {
        const dur = durOf(v), starts = startsFor(offOf(v));
        css.push(burstCss(v, dur, starts), restCss(v, dur, starts));
        blobs.set(v, new Blob([retime(dur, starts, '#9EE9FB')], { type: 'image/svg+xml' }));
    }
    styleEl = document.createElement('style');
    styleEl.id = 'b3-volt-kf';
    styleEl.textContent = css.join('\n');
    document.head.appendChild(styleEl);
}

function load() {
    if (loading) return loading;
    loading = fetch(new URL('bolt-raw.svg', import.meta.url))
        .then((r) => r.text())
        .then((t) => { RAW = t; install(); });
    return loading;
}

// Mounted from the badge's `ref`. `host` is the `.b3-volt` box; the badge is its parent.
export function mountVolt(host, variant) {
    if (!host || host.dataset.voltOn === '1') return;
    // Reduced motion gets the glyph and nothing else — a strike is the one thing here nobody can opt out of in CSS,
    // because the frames live inside the image rather than in a stylesheet.
    if (typeof matchMedia === 'function' && !matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
    host.dataset.voltOn = '1';
    const v = ((variant % VARIANTS) + VARIANTS) % VARIANTS;
    load().then(() => {
        if (!host.isConnected) return;
        const badge = host.parentElement;
        const img = document.createElement('img');
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        // THE TWO CLOCKS ARE GIVEN ONE ORIGIN HERE AND NOWHERE ELSE. The CSS is dropped first so it cannot keep
        // running against the old start, and re-applied inside `onload`, which is the instant the SMIL begins.
        const url = URL.createObjectURL(blobs.get(v));  // this badge's own SMIL clock — never a shared one
        // The three light layers live in their own empty host beside the art (Preact owns the badge's children).
        const lights = badge && badge.querySelector(':scope > .b3-vl');
        let rest = null;
        if (lights) {
            rest = document.createElement('span');
            rest.className = 'b3-vrest';
            rest.appendChild(document.createElement('span'));
            lights.appendChild(rest);
        }
        const layers = lights ? [0, 1, 2].map((i) => {
            const s = document.createElement('span');
            const [sx, sy] = strikeXY(i);
            s.className = 'b3-vb';
            // The layer sits OVER the badge's resting halo, so its alpha is the part the peak adds on top of rest:
            // 1 − (1 − A(peak)) / (1 − A(rest)), where A(l) is the old halo's own alpha formula, (22% + 58%·l)·ambiance.
            // Composited over rest it lands on exactly the old peak alpha instead of stacking past it.
            const A = (l) => Math.min(1, (0.22 + 0.58 * l) * 1.6);
            const ha = Math.max(0, 1 - (1 - A(PEAK[i])) / (1 - A(REST)));
            s.style.cssText = `--pk:${PEAK[i]};--ha:${(ha * 100).toFixed(1)}%;--sx:${sx.toFixed(1)}%;--sy:${sy.toFixed(1)}%`;
            lights.appendChild(s);
            return s;
        }) : [];
        img.onload = () => {
            URL.revokeObjectURL(url);
            if (!badge) return;
            void badge.offsetWidth;                  // one origin for the art and its light, set at the instant the SMIL begins
            layers.forEach((s, i) => { s.style.animation = `b3vb${v}${i} ${durOf(v)}s linear infinite`; });
            if (rest) rest.firstChild.style.animation = `b3vr${v} ${durOf(v)}s linear infinite`;
        };
        img.src = url;
        host.appendChild(img);
    });
}

// 🔴 OFF-SCREEN, A BADGE HAS NO CLOCK AT ALL (2026-09-18 20:25 EDT). "the artifact page seems to be chewing up a lot of CPU." Measured
// idle, top of the page, nothing on screen moving: the renderer's main thread was busy 5.2s of every 15.4s (34% of a core),
// almost all of it per-frame style recalculation, paint and layerize — 7,570 tasks. The only running animations were two
// META badges thousands of pixels below the fold: `mountVolt` sets the badge's glow animation INLINE, so the badge
// group's visibility observer never reached it, and an infinite animation of a registered custom property forces the
// browser to produce a frame, restyle and repaint forever. Pausing it would split the glow from its strikes, whose SMIL
// clock keeps running inside the image, so leaving the viewport TEARS BOTH DOWN and returning mounts them again: a new
// object URL, a new SMIL clock, the CSS restarted at its onload — exactly the pair `mountVolt` already keeps in step.
export function unmountVolt(host) {
    if (!host || host.dataset.voltOn !== '1') return;
    host.dataset.voltOn = '';
    host.replaceChildren();
    const badge = host.parentElement;
    const lights = badge && badge.querySelector(':scope > .b3-vl');
    if (lights) lights.replaceChildren();
}

// For the before/after comparison page only (2026-09-18 20:48 EDT): the RETIRED custom-property glow's keyframes, so the page can
// run the old badge beside the new one. Nothing on the board calls this.
export async function legacyGlowCss() {
    await load();
    return [0, 1, 2].map((v) => ambCss('b3volt' + v, durOf(v), startsFor(offOf(v)))).join('\n');
}
