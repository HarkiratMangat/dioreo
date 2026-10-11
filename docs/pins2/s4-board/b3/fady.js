// b3/fady.js — A RUN THAT OVERFLOWS IS CONTAINED, NOT CUT. Four of his threads, one behaviour.
//
// "the list needs a scroll fade at the BOTTOM and at the TOP, it is a hard cut today" · "tags clip downward instead
// of holding two rows" · "attachment tags contained to two lines, the cell faded and scrollable". A hard edge is a
// statement that there is nothing more, and it is false. A fade says the content continues.
//
// ⚠️ A FADE THAT IS ALWAYS ON IS THE OPPOSITE LIE — it dims the first and last item of a run that fits perfectly
// well. So the depth is read from the container's own scroll position: no overflow, no fade; at the top, no top
// fade; at the end, no bottom fade. Proportional near the ends rather than a step, so nothing snaps on.
//
// 🔴 WHY THIS IS JAVASCRIPT AND NOT `animation-timeline: scroll(self)`, WHICH IS WHAT I BUILT FIRST.
// The CSS version is real and this browser supports it — `CSS.supports` true, the ScrollTimeline objects attach.
// But every measurement of it came back `--ft: 0px` with the animation's `currentTime` NULL, and the reason was not
// the CSS: **the browser pane was `document.hidden`, so no animation of any kind advances in it.** Proved by running
// a plain 200ms opacity animation, which also never moved. So the scroll-driven version may well be correct and I
// CANNOT VERIFY IT HERE — and shipping a fade that silently never fades is precisely the defect a green build gate
// cannot see. This version is verifiable without a single animation frame: set `scrollTop`, read the property back.
// (2026-09-17 18:46 EDT)

const SEL = '.b3-fady,.b3-sd-rows,.b3-cmdl,.b3dock-list,.b3dock-cur,.b3-sd-chips,.wg-r .wg-rail,.b3-sd-atts,.b3-fadx,.drawer.b1 .dw-b';
// v16 (2026-09-23): the post drawer's body is a drawer scroller like the rest (the class sweep found it the one left without the fade)
// `.b3-sd-atts` scrolls SIDEWAYS — its fade is --fl/--fr. Added 2026-09-17 23:19 EDT with the manifest's tag rail (1d832319).
// 2026-09-26 15:38 EDT (his, the Bulk ledger cards: "the attachment chips and the badge chips should only wrap to 2 lines max. if they still overflow, make
// them scroll towards the side behind a fade"): `.b3-fadx` is the same sideways fade as the selection bar's tag rail, for a run that may WRAP first.
// With data-rows="N" its one child wraps freely up to N lines; past that the child is given the narrowest width that holds it in N lines —
// reading order stays row by row (a column-flow grid would read down each column) — and the run scrolls sideways under --fl/--fr.
const INLINE = '.b3-sd-atts,.b3-fadx';
const POPS = '.b3-datepop,.b3-pc,.b3-hc,.b4-layer';
const DEPTH_X = 40;
// 28px, eased in board.css. A small run sets `--fdy` on itself (the tag rail, the chip rows) so the fade cannot eat it.
const DEPTH = 28;
const seen = new WeakSet();

function paint(el, fit = true) {
    if (el.matches && el.matches(INLINE)) {
        // re-fitted on a resize or a content change, never on its own scroll: fitting resets the child's width, which snaps scrollLeft to 0
        if (el.dataset.rows && fit) fitRows(el, +el.dataset.rows);
        const ox = el.scrollWidth - el.clientWidth;
        const l = ox <= 1 ? 0 : Math.max(0, Math.min(DEPTH_X, el.scrollLeft));
        const r = ox <= 1 ? 0 : Math.max(0, Math.min(DEPTH_X, ox - el.scrollLeft));
        el.style.setProperty('--fl', l + 'px');
        el.style.setProperty('--fr', r + 'px');
        return;
    }
    // A sticky head (the one table's column heads) sits INSIDE the scroller, so the top fade starts under it: the rows
    // fade out before they reach the head rather than sliding beneath it.
    const head = el.firstElementChild;
    const hs = head ? getComputedStyle(head) : null;
    el.style.setProperty('--fo', (hs && hs.position === 'sticky' ? head.offsetHeight + (parseFloat(hs.marginBottom) || 0) : 0) + 'px');
    const cs = getComputedStyle(el);
    const depth = parseFloat(cs.getPropertyValue('--fdy')) || DEPTH;
    // 2026-09-23 08:34 EDT: a list with a footer floating over its end (Bulk's results) needs a deeper bottom fade than top; --fdb sets it alone.
    const depthB = parseFloat(cs.getPropertyValue('--fdb')) || depth;
    const over = el.scrollHeight - el.clientHeight;
    if (over <= 1) {                                 // it fits: no fade at either end, and nothing to listen to
        el.style.setProperty('--ft', '0px');
        el.style.setProperty('--fb', '0px');
        return;
    }
    const top = el.scrollTop;
    el.style.setProperty('--ft', Math.max(0, Math.min(depth, top)) + 'px');
    el.style.setProperty('--fb', Math.max(0, Math.min(depthB, over - top)) + 'px');
}

function fitRows(el, rows) {
    const inner = el.firstElementChild; if (!inner) return;
    const keep = el.scrollLeft;
    inner.style.width = '';
    const kids = [...inner.children];
    const lines = () => { let n = 0, last = -1e9; for (const c of kids) { const t = c.getBoundingClientRect().top; if (t > last + 4) { n++; last = t; } } return n; };
    if (lines() <= rows) { el.classList.remove('over'); return; }
    el.classList.add('over');
    const cs = getComputedStyle(el), gap = parseFloat(getComputedStyle(inner).columnGap) || 0;
    let lo = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    let hi = Math.ceil(kids.reduce((w, c) => w + c.getBoundingClientRect().width, 0) + gap * kids.length) + 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; inner.style.width = mid + 'px'; if (lines() <= rows) hi = mid; else lo = mid; }
    inner.style.width = hi + 'px';
    el.scrollLeft = keep;
}

const ro = typeof ResizeObserver === 'function' ? new ResizeObserver((es) => es.forEach((e) => paint(e.target))) : null;

function attach(el) {
    if (seen.has(el)) return;
    seen.add(el);
    el.addEventListener('scroll', () => paint(el, false), { passive: true });
    if (ro) ro.observe(el);
    paint(el);
}

export function scanFady(root = document) {
    if (root.querySelectorAll) root.querySelectorAll(SEL).forEach(attach);
}

// 2026-09-26 16:26 EDT — THE DEAD SPACE BESIDE A SCROLL AREA SCROLLS IT (his, on the Export picker and the build drawers: "when i try to scroll inside the
// pink annotated area or the green annotated area, it does nothing… the pink area allowed scrolling the tiles, and the green area allows scrolling
// the lists (… keeping the actual in-list scroll inside the list)"). A wheel inside a drawer (below its header) that lands OUTSIDE every scroll area
// is handed to the column that owns that space: the area whose width holds the pointer, else the nearest one to its LEFT (a gap belongs to the
// column before it: the gutter between two columns scrolls the first, the drawer's right gutter scrolls the last), else the nearest to its right.
// Within that column the outermost area that can still move wins, so a files column scrolls its files while each file's lines keep their own wheel.
// A wheel that lands inside an area is never touched, even at its end. Vertical wheels only; a pinch (ctrl) is left alone.
function canMove(el, dy) {
    const max = el.scrollHeight - el.clientHeight;
    return max > 1 && (dy > 0 ? el.scrollTop < max - 1 : el.scrollTop > 0);
}
function routeWheel(e) {
    if (e.ctrlKey || e.defaultPrevented || !e.deltaY || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const t = e.target && e.target.nodeType === 1 ? e.target : null;
    const dw = t && t.closest('.drawer');
    if (!dw || t.closest('.dw-h')) return;
    // 2026-09-27 21:57 EDT (his v36 intake: "the announcement drawer still has weird deadspace that does nothing" — measured with a real wheel: 83 of 121 points dead in
    // the post drawer, 0 in the build drawer). Two holes, one cause: 'an area' meant any SEL element that CLIPS, and a clip is not a scroller. The post
    // drawer's body (.drawer.b1 .dw-b) is in SEL and never scrolls, so every gutter counted as 'inside an area' and was handed to nobody; and its text
    // box clips without scrolling, so a wheel over it died there. An area is now only what a person can wheel (overflow auto or scroll); a wheel
    // over a box that clips inside one is handed to that area.
    const wheelable = (el) => { const oy = getComputedStyle(el).overflowY; return oy === 'auto' || oy === 'scroll'; };
    let own = null, clipped = false;
    for (let el = t; el && el !== dw; el = el.parentElement) { if (wheelable(el) && el.scrollHeight > el.clientHeight + 1) { own = el; break; } if ((el.scrollHeight > el.clientHeight + 1 && getComputedStyle(el).overflowY === 'hidden') || (el.tagName === 'TEXTAREA' && !canMove(el, e.deltaY))) clipped = true; }   // a textarea never hands its wheel on (measured: the post text box, open)
    if (own && !clipped) return;                                          // inside a scroll area: its own wheel
    const dy0 = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
    if (own) { if (canMove(own, dy0)) { e.preventDefault(); own.scrollBy({ top: dy0, behavior: 'auto' }); } return; }
    // 2026-09-29 23:45 EDT (the Session 4/5 readiness pass, measured with a real wheel: 22 of 55 points dead in the post drawer): a column is only an area that has
    // somewhere to go. The post drawer's preview is wheelable but shorter than its box, so a wheel over it picked it as "the column under the pointer",
    // found nothing to move and died; now a column that cannot scroll at all is passed over, and the wheel goes to the nearest column to its left.
    const areas = [...dw.querySelectorAll(SEL)].filter((el) => el.clientHeight > 40 && wheelable(el) && el.scrollHeight > el.clientHeight + 1);
    if (!areas.length) return;
    const x = e.clientX, span = (el) => el.getBoundingClientRect();
    let col = areas.filter((el) => { const r = span(el); return x >= r.left && x <= r.right; });
    if (!col.length) {
        const left = areas.filter((el) => span(el).right <= x);
        const pool = left.length ? left : areas;
        const dist = (el) => { const r = span(el); return left.length ? x - r.right : Math.abs(r.left - x); };
        const best = Math.min(...pool.map(dist));
        const edge = pool.find((el) => dist(el) === best);
        const er = span(edge);
        col = areas.filter((el) => { const r = span(el); return r.left < er.right && r.right > er.left; });   // that column, nested areas included
    }
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
    const outer = col.filter((el) => !col.some((o) => o !== el && o.contains(el)));
    const target = outer.find((el) => canMove(el, dy)) || col.find((el) => canMove(el, dy));
    if (!target) return;
    e.preventDefault();
    target.scrollBy({ top: dy, behavior: 'auto' });
}

// The board mounts and re-renders these containers long after load — the selection list appears only once builds are
// picked — so a one-shot scan at startup would cover almost none of them.
export function installFady() {
    scanFady();
    if (typeof MutationObserver !== 'function') return;
    new MutationObserver((recs) => {
        for (const r of recs) {
            // 2026-09-30 18:18 EDT: a pop-up opening (or its layer) is not the column's content — repainting the column for it cost the first frame 27ms (measured)
            const pt = r.target && (r.target.nodeType === 1 ? r.target : r.target.parentElement);
            if (pt && pt.closest && pt.closest(POPS)) continue;
            if (r.addedNodes.length && [...r.addedNodes, ...r.removedNodes].every((n) => n.nodeType !== 1 || (n.matches && n.matches(POPS)))) continue;
            for (const n of r.addedNodes) if (n.nodeType === 1) { if (n.matches && n.matches(SEL)) attach(n); scanFady(n); }
            // a run's chips change inside it (typing in Bulk re-renders the chips, not the run), so the nearest fading container repaints
            const t = r.target && (r.target.nodeType === 1 ? r.target : r.target.parentElement);
            const host = t && t.closest ? t.closest(SEL) : null;
            if (host && seen.has(host)) paint(host);
        }
    }).observe(document.body, { childList: true, characterData: true, subtree: true });
    addEventListener('resize', () => scanFady(), { passive: true });
    addEventListener('wheel', routeWheel, { passive: false });
}
