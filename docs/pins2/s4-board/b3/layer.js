// 2026-09-30 17:13 EDT — A LAYER OUTSIDE THE FADED COLUMN (his: "why does openning the dropdown menu remove the top/bottom scroll fade??" → "yes" to drawing menus outside the
// column). A scrolling column fades its top and bottom with a mask (b3/fady.js), and a mask fades everything inside it — so an open list or pop-up, which
// is a fixed layer placed from its field, was faded too, and the board switched the fade OFF while one was open. Now an open list or pop-up that lives
// in a faded column is rendered into a layer beside the column (its parent, which carries no mask); the column keeps its fade.
import { render } from '../vendor/preact.mjs';
import { useLayoutEffect, useRef } from '../vendor/preact-hooks.mjs';

// the faded column an element sits in, and the place outside it its layer goes (null: not in a faded column, render in place)
export const layerHost = (el) => { const col = el && el.closest && el.closest('.f-form.b3-fady, .pb-col.b3-fady, .drawer.b1 .dw-b, .b3-fady'); return col ? col.parentElement : null; };

// `cls` / `style` stand in for the ancestors the content's own styles expect (the menu's `.f-pick.up`, its `--c`)
export function Layer({ host, cls = '', style = '', children }) {
    const box = useRef(null);
    useLayoutEffect(() => { const d = document.createElement('div'); host.appendChild(d); box.current = d; return () => { render(null, d); d.remove(); box.current = null; }; }, [host]);
    useLayoutEffect(() => { const d = box.current; if (!d) return; d.className = 'b4-layer' + (cls ? ` ${cls}` : ''); d.style.cssText = style || ''; render(children, d); });
    return null;
}
