// portal/ui/icons.js — ESM. Lucide (MIT) as an inlined SVG sprite, plus the morphing fold.
//
// 🔴 STANDING RULE, Harkirat 2026-08-25: "NEVER USE TEXT GLYPHS FOR ICONS. ICONS ARE ICONS. text is text." A typed character hands its size, weight, baseline and hinting to whatever font resolves it — no stroke control, no alignment control, and at 9px it rasterises to a smudge. It is also the reflex answer, which is why it turns up on every accordion ever built.
//
// WHY A COMPONENT AND NOT A STRING HELPER. The mockup's Icons.icon() returns an HTML STRING, which under Preact means dangerouslySetInnerHTML at all sixteen call sites — each one an escape hatch out of the very rendering model the migration exists to adopt, and each one a place a future value could be interpolated unescaped. <Icon name="check" /> is one component, no innerHTML, and the name is checkable. The sprite itself is still real embedded artwork referenced by <use>: a CDN script would add a network dependency to a portal that must work behind Cloudflare Tunnel, and re-inlining every path per instance would repeat ~200 bytes of geometry per icon per render.
//
// Every icon inherits currentColor and is 1em square (see .ic in shell.css), so it sits in text without a fight. Decorative by default — an icon beside a word is not read twice; pass `label` only when the icon is the ONLY thing carrying the meaning.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';

// Lucide path data, verbatim. Keep Lucide's own names so a swap or an addition is a lookup rather than a guess.
const PATHS = {
    'check':        '<path d="M20 6 9 17l-5-5"/>',
    'x':            '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    'plus':         '<path d="M5 12h14"/><path d="M12 5v14"/>',
    'minus':        '<path d="M5 12h14"/>',
    'chevron-down':  '<path d="m6 9 6 6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-up':    '<path d="m18 15-6-6-6 6"/>',
    'star':         '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    'triangle-alert':'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    'arrow-up-right':'<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    'skull':        '<path d="m12.5 17-.5-1-.5 1h1z"/><path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="12" r="1"/>',
    'user':         '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'image':        '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    'image-off':    '<path d="M2 2 22 22"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><path d="M13.5 13.5 6 21"/><path d="M18 12l-1.5-1.5a2 2 0 0 0-2.83 0L12 12.67"/><path d="M21 15V5a2 2 0 0 0-2-2H9"/><path d="M3 7v12a2 2 0 0 0 2 2h12"/>',
    'search-x':     '<path d="m13.5 8.5-5 5"/><path d="m8.5 8.5 5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    'trash-2':      '<path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    'square-pen':   '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>',
    'clock':        '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    'calendar-days':'<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>'};

export const ICON_NAMES = Object.keys(PATHS);

// 🔴 THE SPRITE IS INJECTED AT MODULE EVALUATION, not on DOMContentLoaded. `<use href="#i-…">` resolves against the document, and an element already in the DOM when its symbol arrives is not guaranteed to re-resolve — so waiting can leave icons permanently blank on a page whose markup rendered during parsing. documentElement always exists by the time a module body runs.
export function installSprite() {
    if (typeof document === 'undefined' || document.getElementById('__icons')) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = '__icons';
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    svg.innerHTML = Object.keys(PATHS).map((k) =>
        `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" `
        + `stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${PATHS[k]}</symbol>`).join('');
    const root = document.body || document.documentElement;
    root.insertBefore(svg, root.firstChild);
}
installSprite();

export function Icon({ name, cls, label }) {
    // A missing name renders NOTHING rather than an empty box, and says so once in the console. The mockup's string version returned '' on a miss, which is how every icon on every page rendered as an empty string for a whole session without one visible symptom — see the migration spec's trap table. A component at least keeps the failure to the one icon that is wrong.
    if (!PATHS[name]) { console.warn(`[dioreo] no icon named "${name}"`); return null; }
    const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' };
    return html`<svg class=${'ic' + (cls ? ' ' + cls : '')} ...${a11y}><use href=${'#i-' + name} /></svg>`;
}

// ═══════════════════ THE FOLD — a morph, not a swap ═════════════════════════ Harkirat: "use icons with animation so things dont feel boring. icons that genuinely animate into different states, such as collapsed/open in a truly unique and seamless transition".
//
// 🔴 A ROTATION IS NOT A MORPH. Spinning a chevron 90 or 180 degrees is what every disclosure control on the internet does, and it is the same laziness as the typed glyph one level up — the shape never changes, it just points somewhere else.
//
// This animates the PATH ITSELF. The chevron's two strokes travel through a FLAT LINE on the way between down and up, so the mark reads as folding through the horizon — which is exactly what the panel underneath is doing. The metaphor and the motion are the same event.
//
//   closed  M6 9  L12 15 L18 9     the chevron points down
//   (mid)   M6 12 L12 12 L18 12    a flat rule — the fold at its hinge
//   open    M6 15 L12 9  L18 15    the chevron points up
//
// Three points throughout, so the interpolation is well-defined. The transition itself lives in CSS (.ic-fold path { d: path(...) }), which interpolates `d` geometrically rather than faking it with a transform. ⚠️ The CSS `d` property BEATS this inline attribute, so both must agree — the attribute is what a non-supporting engine and any server render fall back to.
const FOLD_CLOSED = 'M6 9 L12 15 L18 9';
const FOLD_OPEN = 'M6 15 L12 9 L18 15';

export function Fold({ open, cls }) {
    return html`
        <svg class=${'ic ic-fold' + (open ? ' open' : '') + (cls ? ' ' + cls : '')}
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d=${open ? FOLD_OPEN : FOLD_CLOSED} />
        </svg>`;
}
