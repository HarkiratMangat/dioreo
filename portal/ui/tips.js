// portal/ui/tips.js — ESM. One tooltip, delegated from the document.
//
// 🔴 DELEGATED, NOT PER-ELEMENT, because the Track rebuilds its lanes on every zoom, drag and window change. A listener attached to each `[data-tip]` dies with the node it was attached to, and the failure is silent: the tip works until the first repaint and then does not, which is worse than never working because it looks like an intermittent fault rather than a missing feature.
//
// ⚠️ IT LEAVES NO TIP BEHIND. A tooltip whose host is removed mid-hover — which the Track does routinely — would otherwise sit on screen pointing at nothing. `pointerout` and `focusout` both kill it, and so does a scroll, because a fixed-position tip does not travel with the thing it describes.
// ⚠️ NO IMPORT OF THE .logic SIBLING, and the missing line is the point. Every *.logic.js here loads as a CLASSIC script before this module graph evaluates, so its top-level function declarations are GLOBALS — `import { tipPlacement } from './tips.logic.js'` throws "does not provide an export named" in every real browser and takes the whole page down with it. Written that way first, and the page rendered blank; season.js made the same mistake before this, which is why every .logic.js sibling carries the warning in its own header.

let installed = false;

export function installTips() {
    if (installed || typeof document === 'undefined') return;
    installed = true;

    let el = null;
    const kill = () => { if (el) { el.remove(); el = null; } };

    const show = (text, host) => {
        const lines = tipLines(text);
        if (!lines.length) return;
        kill();
        el = document.createElement('div');
        el.className = 'tip';
        el.setAttribute('role', 'tooltip');
        // Built as nodes rather than innerHTML: a tip's text comes from a build name, a season title or a parser's own error message, and none of those is ours to trust as markup.
        el.append(lines[0]);
        for (const line of lines.slice(1)) {
            const sub = document.createElement('span');
            sub.className = 'sub';
            sub.textContent = line;
            el.append(sub);
        }
        document.body.append(el);
        const place = tipPlacement(host.getBoundingClientRect(), el.getBoundingClientRect(),
            { width: window.innerWidth, height: window.innerHeight });
        el.style.left = `${place.x}px`;
        el.style.top = `${place.y}px`;
    };

    const hostOf = (e) => (e.target && e.target.closest ? e.target.closest('[data-tip]') : null);
    document.addEventListener('pointerover', (e) => { const h = hostOf(e); if (h) show(h.dataset.tip, h); });
    document.addEventListener('pointerout', (e) => { if (hostOf(e)) kill(); });
    // Keyboard reaches the same text: every one of these sentences explains a control somebody can tab to.
    document.addEventListener('focusin', (e) => { const h = hostOf(e); if (h) show(h.dataset.tip, h); });
    document.addEventListener('focusout', () => kill());
    document.addEventListener('scroll', kill, true);
    window.addEventListener('resize', kill);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') kill(); });
}
