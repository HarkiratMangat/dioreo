// Board 3 version 2 — BOARD ONLY. P8: an announcement with no end date, shown where the problem is. The card's lifespan bar runs past its end and says it never stops; a quiet Set end control opens a date picker and stages the end; the queue panel's own head counts it beside the slots, and Changes ahead lists it with the quoted announcement, because "never stops" is a change ahead that never comes.
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect, useRef, useLayoutEffect } from '../vendor/preact-hooks.mjs';
import { Icon, Fold } from '../ui/icons.js';
import { stageOps } from '../ui/composeClient.js';
import { isoLocal } from './state.js';
import { pcPath } from './armory-parts.js';
import { Layer, layerHost } from './layer.js';
import { POPT } from './poptime.js';   // pop-up timing, one table (set 3)   // a pop-up opened inside a faded column renders beside it (b3/layer.js)   // the hint and problem cards' outline, for the pop-ups' arc (PopBox)

const DAY = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const addDays = (n) => { const d = new Date(); d.setHours(23, 59, 0, 0); d.setDate(d.getDate() + n); return d; };

// 2026-09-27 18:52 EDT — THE BOARD'S DATE PICKER (his: "add a date picker to the starts/ends fields and anywhere else that chooses/sets a date"). ONE month grid for every
// date the board sets: the post drawer's Starts and Ends (open under the field) and this card's Set end date (in its pop-up, where a native
// <input type=date> sat and drew the browser's own calendar). Sunday first; Left/Right a day, Up/Down a week, PageUp/PageDown a month, Enter picks;
// days before `min` are off; today is ringed and the picked day filled in the realm's colour (--dp-c, else --realm-c). 2026-09-27 19:16 EDT: no quick picks (his call).
const WD = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];   // 2026-09-27 20:01 EDT: Sunday first, his popup answer (his reference picture's order)
export function DateGrid({ value = '', min = '', max = '', onPick }) {
    const today = isoLocal();
    const start = value || (min && min > today ? min : today);
    const [view, setView] = useState(start.slice(0, 7));
    const [focus, setFocus] = useState(start);
    const ref = useRef(null);
    useEffect(() => { const el = ref.current; if (!el || !el.contains(document.activeElement)) return; const b = el.querySelector(`[data-d="${focus}"]`); if (b) b.focus(); }, [focus, view]);
    const [y, m] = view.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const lead = first.getDay();
    // 2026-09-27 19:19 EDT: only the weeks the month needs (his reference shows five rows for September), so the pop-up is no taller than it must be
    const cells = Array.from({ length: Math.ceil((lead + new Date(y, m, 0).getDate()) / 7) * 7 }, (_, i) => new Date(y, m - 1, 1 - lead + i));
    const shift = (s, n) => { const d = new Date(`${s}T12:00:00`); d.setDate(d.getDate() + n); return isoLocal(d); };
    const move = (n) => { const t = shift(focus, n); if ((min && t < min) || (max && t > max)) return; setFocus(t); setView(t.slice(0, 7)); };
    const month = (n) => { const d = new Date(y, m - 1 + n, 1); setView(isoLocal(d).slice(0, 7)); };
    const onKey = (e) => {
        const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, PageUp: -30, PageDown: 30 }[e.key];
        if (step) { e.preventDefault(); e.stopPropagation(); move(step); }
    };
    const canPrev = !min || view > min.slice(0, 7);
    const canNext = !max || view < max.slice(0, 7);
    return html`
        <div class="b3-dp-cal" ref=${ref} onKeyDown=${onKey}>
            <div class="b3-dp-ch">
                <button type="button" class="b3-dp-nav" aria-label="Previous month" disabled=${!canPrev} onClick=${() => month(-1)}><${Icon} name="chevron-left" /></button>
                <b>${first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</b>
                <button type="button" class="b3-dp-nav" aria-label="Next month" disabled=${!canNext} onClick=${() => month(1)}><${Icon} name="chevron-right" /></button></div>
            <div class="b3-dp-grid">
                ${WD.map((w) => html`<span class="b3-dp-wd" key=${w} aria-hidden="true">${w}</span>`)}
                ${cells.map((d) => { const s = isoLocal(d); const off = Boolean((min && s < min) || (max && s > max)); return html`
                    <button type="button" key=${s} data-d=${s} tabindex=${s === focus ? 0 : -1} disabled=${off} aria-pressed=${s === value ? 'true' : 'false'}
                            class=${'b3-dp-d' + (d.getMonth() !== m - 1 ? ' out' : '') + (s === today ? ' today' : '') + (s === value ? ' on' : '')}
                            aria-label=${d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            onClick=${() => onPick(s)}>${d.getDate()}</button>`; })}
            </div></div>`;
}
export const stagedEndOf = (a, stagedOps) => {
    const op = (stagedOps || []).find((o) => o.realm === 'broadcast' && (o.targetIds || []).includes(String(a._id)));
    const row = op && (op.rows || []).find((r) => r.key === 'expiresAt');
    return row && row.to ? new Date(row.to) : null;
};

// ── 2026-09-27 21:40 EDT — THE POP-UP FAMILY (his v36 intake: "the 'never' chip … should be clickable to open the date picker", "a chip … to open a pop-up
// to change the repeat amounts (match the pop-up's style to the date picker/dropdown menu styling)", and the accent picker). Everything a chip
// or a field opens is this one mechanism, never a copy: FIXED to the window from its trigger, because the panels and drawer columns it opens in
// clip (the queue panel is overflow:hidden, a drawer column scrolls) — and a Stage's transform makes the stage the containing block, so the
// placement measures where the pop-up landed and corrects by the difference. It opens DOWN when there is room, else UP, never past the window;
// a click outside, Escape (which hands focus back to the trigger) or a scroll outside it closes it. Its surface is the build drawer's dropdown
// ground (.b3-datepop / .b4-pop, b3/board.css). Focus moves into it on open: the picked day, else its first control.
export function usePop({ w = 270, align = 'start' } = {}) {
    const [open, setOpen] = useState(false);
    // 2026-09-30 16:58 EDT (his: "give them the arc and smooth animation of the pop-up container used elsewhere"): the pop-up stays mounted through its exit, as the
    // problem and hint cards do (`mounted` holds it, `shown` is its state), and reports its box and where its trigger is, so PopBox draws the arc at it
    const [mounted, setMounted] = useState(false), [shown, setShown] = useState(false), [geo, setGeo] = useState(null), [rev, setRev] = useState(0);
    const wrap = useRef(null), pop = useRef(null), btn = useRef(null);
    useEffect(() => {
        if (open) { setMounted(true); return undefined; }
        setShown(false);
        const t = setTimeout(() => { setMounted(false); setGeo(null); }, POPT[3].removed);
        return () => clearTimeout(t);
    }, [open]);
    useLayoutEffect(() => {
        // measured from the trigger's VISIBLE box — the wrapper: a date field's calendar button sits 6px inside its field, so measuring the button
        // put the picker 4px off the field's edge while it looked right from the button (measured 2026-09-28 13:59 EDT: 4.2 vs 10.2)
        const el = pop.current, t = wrap.current || btn.current;
        if (!open || !mounted || !el || !t) return undefined;
        // 2026-09-28 13:53 EDT (his C3 round, class K): the box is measured with its entrance held, then the entrance runs. The arc's tip sits 4px off the
        // trigger, as a hint card's does (the gap the old 10px left is now the arc, drawn inside the box).
        const r = t.getBoundingClientRect(), h = el.offsetHeight, gap = 4, pw = w === 'auto' ? el.offsetWidth : w;
        // the arc can come no nearer a corner than 44px (pcPath: radius + span + 4), so a pop-up aligned to a narrow chip slides the few pixels that keep
        // the arc's tip on the chip's centre (measured 3–7px on the end-date chips), as the hint cards do; then it stays inside the window
        const ab = (btn.current || t).getBoundingClientRect(), acx = ab.left + ab.width / 2;
        let left0 = align === 'end' ? r.right - pw : r.left;
        left0 = Math.min(Math.max(left0, acx - (pw - 44)), acx - 44);
        const left = Math.round(Math.min(Math.max(8, left0), innerWidth - pw - 8));
        const fitsDown = r.bottom + gap + h <= innerHeight - 8, fitsUp = r.top - gap - h >= 8;
        const up = !fitsDown && fitsUp;
        const top = Math.round(fitsDown ? r.bottom + gap : fitsUp ? r.top - gap - h : Math.max(8, innerHeight - h - 8));
        el.dataset.up = up ? 'true' : 'false';
        const tr = el.style.transition, tf = el.style.transform;
        el.style.transition = 'none'; el.style.transform = 'none';
        el.style.left = `${left}px`; el.style.top = `${top}px`;
        const got = el.getBoundingClientRect();
        if (Math.abs(got.left - left) > 0.5 || Math.abs(got.top - top) > 0.5) { el.style.left = `${2 * left - got.left}px`; el.style.top = `${2 * top - got.top}px`; }
        // the arc points at the button that opened it (a date field's calendar button, not the field's middle), measured against where the box landed
        const fin = el.getBoundingClientRect(), a = (btn.current || t).getBoundingClientRect();
        void el.offsetWidth; el.style.transition = tr; el.style.transform = tf;
        // left/top go into the state too: PopBox re-renders its style attribute when the arc arrives, which would otherwise wipe the placement set here
        setGeo({ w: el.offsetWidth, h: el.offsetHeight, tx: Math.round(a.left + a.width / 2 - fin.left), up, left: el.style.left, top: el.style.top });
        // 2026-09-30 18:18 EDT (his: fix the first-frame lag — measured 145–193ms click to first frame): the box's resting style is already resolved (it was just
        // measured), so the fade starts in this frame rather than two frames on; and focus, which forced another style pass (28ms), moves to the frame after
        // one frame with the arc CLOSED, so its morph has a shape to start from (the same commit as the box showed it already open — no morph; measured), then focus
        let raf2 = 0;
        const raf = requestAnimationFrame(() => { setShown(true); if (rev) return; raf2 = requestAnimationFrame(() => { const f = el.querySelector('.b3-dp-d[tabindex="0"], [aria-selected="true"], input, button:not(:disabled)'); if (f) f.focus({ preventScroll: true, focusVisible: false }); }); });
        // a month with six rows, a longer Stage label: the box changes size while open, so it is measured and placed again
        const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { if (Math.abs(el.offsetHeight - h) > 1 || (w === 'auto' && Math.abs(el.offsetWidth - pw) > 1)) setRev((x) => x + 1); }) : null;
        if (ro) ro.observe(el);
        return () => { cancelAnimationFrame(raf); cancelAnimationFrame(raf2); if (ro) ro.disconnect(); };
    }, [open, mounted, rev]);
    useEffect(() => {
        if (!open) return undefined;
        const out = (e) => { if (wrap.current && !wrap.current.contains(e.target) && !(pop.current && pop.current.contains(e.target))) setOpen(false); };
        const key = (e) => { if (e.key !== 'Escape') return; e.stopPropagation(); e.preventDefault(); setOpen(false); if (btn.current) btn.current.focus(); };
        const scroll = (e) => { const t = e.target; if (!(t && t.nodeType === 1 && pop.current && pop.current.contains(t))) setOpen(false); };
        document.addEventListener('pointerdown', out); document.addEventListener('keydown', key, true); addEventListener('scroll', scroll, true);
        return () => { document.removeEventListener('pointerdown', out); document.removeEventListener('keydown', key, true); removeEventListener('scroll', scroll, true); };
    }, [open]);
    return { open, setOpen, mounted, shown, geo, wrap, pop, btn, close: () => setOpen(false) };
}

// The pop-up's box: the hint and problem cards' own container — the arc at its trigger, the outline drawn over its content, the glow — in the colour of
// the chip that opened it (`tone`: 'pink' Broadcast, 'warn', or neutral), on the pop-ups' black. See b4/classes.css ARC.
export function PopBox({ p, tone = null, cls = '', w = 270, aria, children }) {
    const g = p.geo, host = layerHost(p.wrap.current);
    const acc = host && p.wrap.current ? getComputedStyle(p.wrap.current).getPropertyValue('--c').trim() : '';
    const d = g ? pcPath({ w: g.w, h: g.h, tx: g.tx, up: g.up, open: p.shown }) : '';   // the arc morphs out of the edge in every set (2026-09-30 19:25 EDT, his)
    const box = html`<div class=${'b3-datepop b4-pop fixed b4-arc pop-s3' + (tone ? ` t-${tone}` : '') + (p.shown ? ' in' : '') + (cls ? ` ${cls}` : '')} ref=${p.pop}
                     style=${(w === 'auto' ? '' : `width:${w}px;`) + (acc ? `--c:${acc};` : '') + (g ? `left:${g.left};top:${g.top};--tx:${g.tx}px` : '')} role="dialog" aria-label=${aria}>
        ${g ? html`<svg class="b3-pc-edge" key=${`${g.w}x${g.h}`} aria-hidden="true" viewBox=${`0 0 ${g.w} ${g.h}`} width=${g.w} height=${g.h}><path class="glow" style=${`d:path("${d}")`} /><path style=${`d:path("${d}")`} /></svg>` : null}
        ${children}
        ${g ? html`<svg class="b3-pc-edge b3-pc-line" key=${`l${g.w}x${g.h}`} aria-hidden="true" viewBox=${`0 0 ${g.w} ${g.h}`} width=${g.w} height=${g.h}><path style=${`d:path("${d}")`} /></svg>` : null}
    </div>`;
    return host ? html`<${Layer} host=${host}>${box}<//>` : box;
}

// A trigger and the pop-up it opens. `btn` is the trigger's content, `body(close)` the pop-up's.
export function ChipPop({ w = 270, align = 'start', btnCls, btnId = null, btn, aria, cls = '', tone = null, body }) {
    const p = usePop({ w, align });
    return html`
        <span class="b4-popw" ref=${p.wrap}>
            <button type="button" id=${btnId} ref=${p.btn} class=${btnCls} aria-haspopup="dialog" aria-expanded=${p.open ? 'true' : 'false'} aria-label=${aria}
                    onClick=${() => p.setOpen(!p.open)}>${btn}</button>
            ${p.mounted ? html`<${PopBox} p=${p} tone=${tone} cls=${cls} w=${w} aria=${aria}>${body(p.close)}<//>` : null}
        </span>`;
}

// One staged edit of a live or upcoming announcement: every field it has, with `patch` over them (an edit that omits a field wipes it — core/ops/announcements.js).
export function stageEdit(a, patch, csrfToken) {
    const payload = { text: a.text, startsAt: a.startsAt || null, bannerImageUrl: a.bannerImageUrl || null, repeatCount: a.repeatCount ?? null,
        expiresAt: a.expiresAt || null, color: typeof a.color === 'number' ? a.color : null, ...patch };
    return stageOps('broadcast', [{ type: 'announcement.edit', target: { id: String(a._id) }, payload }], csrfToken);
}

// The date a chip changes. It opens on the date it holds, else TOMORROW, highlighted (his 2026-09-27 20:39 EDT: "open it on today + 1 day"); no heading
// ("honestly 'Stop showing it live since Aug 4' line is pretty useless in the picker"). A start can't pass the end; an end can't come before the start.
export function DateStage({ a, field = 'expiresAt', csrfToken, overlay, onStaged, close }) {
    const cur = a[field] ? new Date(a[field]) : null;
    const [when, setWhen] = useState(cur ? isoLocal(cur) : isoLocal(addDays(1)));
    const [busy, setBusy] = useState(false);
    const today = isoLocal();
    const startIso = a.startsAt ? isoLocal(new Date(a.startsAt)) : null;
    const endIso = a.expiresAt ? isoLocal(new Date(a.expiresAt)) : '';
    const min = field === 'expiresAt' && startIso && startIso > today ? startIso : today;
    const max = field === 'startsAt' ? endIso : '';
    const word = field === 'expiresAt' ? 'end' : 'start';
    async function stage() {
        setBusy(true);
        const at = new Date(`${when}T12:00:00`);
        if (cur) at.setHours(cur.getHours(), cur.getMinutes(), 0, 0); else if (field === 'expiresAt') at.setHours(23, 59, 0, 0);
        const res = await stageEdit(a, { [field]: at.toISOString() }, csrfToken);
        setBusy(false);
        if (!res || !res.changesetId) { overlay.say(`The ${word} date could not be staged.`); return; }
        close();
        onStaged(`Staged · it ${field === 'expiresAt' ? 'stops' : 'starts'} showing ${DAY(at)}. Nothing changes for players until you commit it.`);
    }
    const same = Boolean(cur) && isoLocal(cur) === when;
    return html`
        <${DateGrid} value=${when} min=${min} max=${max} onPick=${setWhen} />
        <div class="b3-dp-f"><button type="button" class="b3-btn2 ghost sm" onClick=${close}>Cancel</button>
            <button type="button" class="b3-btn2 go sm" disabled=${busy || !when || same} onClick=${stage}><${Icon} name="check" />${busy ? 'Staging…' : `Stage ${word} · ${DAY(new Date(`${when}T12:00:00`))}`}</button></div>`;
}

// ONE stepper, the post drawer's and the showings pop-up's: − · the count · +, on the field ground (board.css, .pb-step).
export function Stepper({ value, onChange, min = 1, max = Infinity, label = 'showings' }) {   // no top: core asks only for a whole number of 1 or more
    return html`
        <div class="pb-step" role="group" aria-label=${`How many ${label}`}>
            <button type="button" aria-label="Fewer" disabled=${value <= min} onClick=${() => onChange(Math.max(min, value - 1))}><${Icon} name="minus" /></button>
            <output aria-live="polite">${value}</output>
            <button type="button" aria-label="More" disabled=${value >= max} onClick=${() => onChange(Math.min(max, value + 1))}><${Icon} name="plus" /></button></div>`;
}

export const showingsWord = (n) => (n <= 1 ? 'once' : `${n} times`);

export function RepeatStage({ a, csrfToken, overlay, onStaged, close }) {
    const cur = a.repeatCount && a.repeatCount > 1 ? a.repeatCount : 1;
    const [n, setN] = useState(cur);
    const [busy, setBusy] = useState(false);
    async function stage() {
        setBusy(true);
        const res = await stageEdit(a, { repeatCount: n }, csrfToken);
        setBusy(false);
        if (!res || !res.changesetId) { overlay.say('The showings could not be staged.'); return; }
        close();
        onStaged(`Staged · each player sees it ${showingsWord(n)}, once a day at most. Nothing changes for players until you commit it.`);
    }
    return html`
        ${''/* 2026-09-28 13:53 EDT (his C3 round, classes L and M): "per player · 1 a day max" restated the chip and the Stage button — gone. The stepper sits centred,
             its count in the post's accent (the per-showing glyphs, here and in the drawer, were dropped at his word on 2026-09-28). */}
        <div class="b4-reph"><${Stepper} value=${n} onChange=${setN} />
            </div>
        <div class="b3-dp-f"><button type="button" class="b3-btn2 ghost sm" onClick=${close}>Cancel</button>
            <button type="button" class="b3-btn2 go sm" disabled=${busy || n === cur} onClick=${stage}><${Icon} name="check" />${busy ? 'Staging…' : `Stage · ${showingsWord(n)}`}</button></div>`;
}

// ONE fold control — Export's Pick builds button (.b3-xf-ib, b3/board.css), its mark and its word: Collapse / Expand (his: "update the 'show less'
// button to be worded as 'collapse/expand', and … the same sizing/padding/etc of the collapse button … in Export drawer's `pick builds...` lists").
// a fold is never a one-frame swap (his standing rule: every reveal and hide eases): measure the block, let the text change, then ease its height from the
// old size to the new on the board's curve. Run from any fold (the button, or a click on the card's text), so every fold on the board moves the same way.
export function foldEase(el, change) {
    if (!el || (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches)) { change(); return; }
    const h0 = el.getBoundingClientRect().height;
    change();
    requestAnimationFrame(() => {
        const h1 = el.getBoundingClientRect().height;
        if (Math.abs(h1 - h0) < 1) return;
        el.style.overflow = 'hidden';
        const a = el.animate([{ height: `${h0}px` }, { height: `${h1}px` }], { duration: 260, easing: 'cubic-bezier(.2,.8,.3,1)' });
        a.onfinish = a.oncancel = () => { el.style.overflow = ''; };
    });
}
export function FoldBtn({ open, onClick, onMouseDown = null }) {
    return html`<button type="button" class="b3-xf-ib b4-fold" aria-expanded=${open ? 'true' : 'false'} onMouseDown=${onMouseDown} onClick=${(e) => foldEase(e.currentTarget.closest('.pb-enc'), () => onClick(e))}><${Fold} open=${open} /><span class="b3-xf-ibl"><span>${open ? 'Collapse' : 'Expand'}</span></span></button>`;
}

// Does a text box run past `lines` lines at its own line height? Measured on the content (scrollHeight), so the answer is the same folded or open —
// a fold control that only shows when it has something to fold (his: "hide it if not needed").
export function useClamps(ref, deps, lines = 2) {
    const [c, setC] = useState(false);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const m = () => { const cs = getComputedStyle(el); const lh = parseFloat(cs.lineHeight) || 20; setC(el.scrollHeight > lh * lines + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + 2); };
        m();
        const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(m) : null;
        if (ro) ro.observe(el);
        return () => { if (ro) ro.disconnect(); };
    }, deps);
    return c;
}

// The shared 6,000 as segments, one per post in ITS accent (his: "show the specific announcement's accent color to show which announcement is using how much of the total budget").
export function BudgetMeter({ segs, total = 6000 }) {
    return html`<span class="cmeter b4-segs">${segs.filter((x) => x.n > 0).map((x, k) => html`<i key=${k} style=${`width:${Math.min(100, (x.n / total) * 100)}%;background:${x.c}`}></i>`)}</span>`;
}

// V44 AZ (2026-09-29 22:33 EDT, his: "otherwise they should have used the same color system, no?"): ONE readout of what is left of the budget — the numeral in
// ink, its words in the chip's colour, a baseline pair (.b3-nw) — for the queue's chip and the post drawer's, which each spelled it out by hand
export function BudgetReadout({ used, total = 6000 }) {
    return html`<span class="b3-nw"><b>${Math.abs(total - used).toLocaleString()}</b>${used > total ? `over ${total.toLocaleString()}` : `of ${total.toLocaleString()} left`}</span>`;
}

// ── AN ANNOUNCEMENT'S ACCENT. utils/announcement.js mints one at creation (generateAccentColor: any hue, saturation 55–75%, lightness 45–60%) and stores it
// as Announcement.color; the post op already takes `color` (core/ops/announcements.js). The board lets you see it and choose it.
const hsl2num = (h, s, l) => { s /= 100; l /= 100; const a = s * Math.min(l, 1 - l);
    const f = (n) => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
    return (f(0) << 16) | (f(8) << 8) | f(4); };
export const randomAccent = () => hsl2num(Math.floor(Math.random() * 360), 55 + Math.random() * 20, 45 + Math.random() * 15);
export const hexOf = (n) => `#${((Number(n) >>> 0) & 0xffffff).toString(16).padStart(6, '0').toUpperCase()}`;
const luminance = (n) => { const c = [16, 8, 0].map((sh) => ((n >> sh) & 255) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
export const accentTooDark = (n) => luminance(n) < 0.05;   // a number and a wash that sink into the card's dark ground
// ── 2026-09-28 13:57 EDT — THE ACCENT IS A BLOCK IN THE FORM, NOT A POP-UP (his C3 round, class N: "why even make it a pop-up? why not just integrate it
// into the form surface? similar to how we have the image block integrated?"). Designed with him on a tunable mockup (board4-review/intake-v38/
// accent-mock.html) and built from his final values, layout "split": the colour area with its hue bar under it on the left; Recent (two rows, every
// shuffled, typed or dragged colour) and Saved (his nine slots) on the right with the hex field and New colour under them. Its ground is the image
// block's (.f-media: --sunk at 55%, a 9% ink edge), so the two blocks read as one family. Recent and Saved persist in this browser; in the portal
// they are per admin (a Session 5 data note). A saved colour, hovered, floats and splits: its own colour to USE, and past a hairline the current
// colour sliding out from under it to REPLACE it; an empty slot shows the current colour and saves it. Every change eases — his standing rule,
// "never a 1 frame reveal/hide" — judged on a real screencast, 24+ frames of open and close, as the mockup was.
const ACK = 'b4-accent-history';
const NCOL = 9, NREC = 2, NSAV = 9, DC = 240;   // his values: 9 a row, 2 Recent rows, 240ms open and close
const isHexS = (x) => typeof x === 'string' && /^#[0-9A-F]{6}$/.test(x);
const hsv2hex = (h, s, v) => { const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); }; return `#${[f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase()}`; };
const hex2hsv = (x) => { const n = parseInt(x.slice(1), 16); const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0; if (d) { h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, mx ? d / mx : 0, mx]; };
const onInk = (x) => { const L = luminance(parseInt(x.slice(1), 16)); return (L + 0.05) / 0.0548 > 1.05 / (L + 0.05) ? '#0B0F12' : '#FFFFFF'; };   // whichever of black and white contrasts more
const SAMPLE = { recent: ['#2FC8D0', '#4DDF2C', '#D8468F', '#3F7FE0', '#E1A43A', '#9B5EE6', '#DF523B', '#58D2A1', '#C9D23B', '#6A7BE8', '#E7719B'], saved: ['#EC4899', '#2FC8D0', '#E1A43A'] };
function readHist() {
    const blank = { recent: [], saved: Array(NSAV).fill(null) };
    try {
        const raw = localStorage.getItem(ACK);
        // the board opens with a sample history so every state can be seen; the portal starts empty
        const o = raw ? JSON.parse(raw) : (typeof window !== 'undefined' && window.B4_COLLECTIVE ? SAMPLE : {});
        return { recent: (Array.isArray(o.recent) ? o.recent : []).filter(isHexS).slice(0, 42), saved: Array.from({ length: NSAV }, (_, i) => (o.saved && isHexS(o.saved[i]) ? o.saved[i] : null)) };
    } catch (e) { return blank; }
}
export function AccentBlock({ id, value, onChange }) {
    const cur = hexOf(value);
    const [hsv, setHsv] = useState(() => hex2hsv(cur));
    const hsvRef = useRef(hsv); hsvRef.current = hsv;
    useEffect(() => { if (hsv2hex(...hsvRef.current) !== cur) setHsv(hex2hsv(cur)); }, [cur]);   // a colour set from outside (a shuffle, a swatch) moves the knobs; a drag keeps its own hue on a grey
    const [hist, setHist] = useState(readHist);
    const keep = (fn) => setHist((h) => { const n = fn(h); try { localStorage.setItem(ACK, JSON.stringify(n)); } catch (e) { /* private window: this visit only */ } return n; });
    const push = (c) => keep((h) => ({ ...h, recent: [c, ...h.recent.filter((x) => x !== c)].slice(0, 42) }));
    const setSaved = (i, c) => keep((h) => ({ ...h, saved: h.saved.map((x, k) => (k === i ? c : x)) }));
    const pick = (c, record) => { onChange(parseInt(c.slice(1), 16)); if (record) push(c); };
    const setHsvAll = (n) => { hsvRef.current = n; setHsv(n); onChange(parseInt(hsv2hex(...n).slice(1), 16)); };
    // the colour area and the hue bar: drag with the pointer (captured), or step with the arrows; the colour joins Recent when the drag ends
    const svRef = useRef(null), hueRef = useRef(null);
    const cl = (x) => Math.min(1, Math.max(0, x));
    const dragOn = (ref, fn) => (e) => { const el = ref.current; if (!el) return; el.setPointerCapture(e.pointerId); fn(e);
        const mv = (ev) => fn(ev); el.addEventListener('pointermove', mv); el.addEventListener('pointerup', () => { el.removeEventListener('pointermove', mv); push(hsv2hex(...hsvRef.current)); }, { once: true }); };
    const atSv = (e) => { const r = svRef.current.getBoundingClientRect(); setHsvAll([hsvRef.current[0], cl((e.clientX - r.left) / r.width), 1 - cl((e.clientY - r.top) / r.height)]); };
    const atHue = (e) => { const r = hueRef.current.getBoundingClientRect(), k = r.height + 2; setHsvAll([Math.min(359.9, cl((e.clientX - r.left - k / 2) / (r.width - k)) * 360), hsvRef.current[1], hsvRef.current[2]]); };
    const [h, s, v] = hsv;
    const keySv = (e) => { const d = { ArrowLeft: [-0.02, 0], ArrowRight: [0.02, 0], ArrowUp: [0, 0.02], ArrowDown: [0, -0.02] }[e.key]; if (!d) return; e.preventDefault(); setHsvAll([h, cl(s + d[0]), cl(v + d[1])]); };
    const keyHue = (e) => { const d = { ArrowLeft: -3, ArrowRight: 3, ArrowUp: 3, ArrowDown: -3 }[e.key]; if (!d) return; e.preventDefault(); setHsvAll([(h + d + 360) % 360, s, v]); };
    // the hex field: typing or pasting strips a '#', six digits apply and join Recent; the copy button sits inside it
    const [hex, setHex] = useState(cur.slice(1));
    const [typing, setTyping] = useState(false);
    useEffect(() => { if (!typing) setHex(cur.slice(1)); }, [cur, typing]);
    const typed = (t) => { const x = t.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase(); setHex(x); if (x.length === 6) pick(`#${x}`, true); };
    const [copied, setCopied] = useState(false);
    const copy = (e) => { e.preventDefault(); if (navigator.clipboard) navigator.clipboard.writeText(cur).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1100); };
    // hover readouts beside the Recent and Saved labels
    const [recHc, setRecHc] = useState(null);
    // the saved row: one slot open at a time; a slot closing keeps a raised layer for exactly its close, under the one opening
    const [openI, setOpenI] = useState(-1), [closing, setClosing] = useState({}), [hv, setHv] = useState('');
    const timers = useRef({});
    const shut = (i) => { if (i < 0) return; setClosing((c) => ({ ...c, [i]: true })); clearTimeout(timers.current[i]); timers.current[i] = setTimeout(() => setClosing((c) => { const n = { ...c }; delete n[i]; return n; }), DC + 80); };
    const openAt = (i) => { if (i === openI) return; shut(openI); clearTimeout(timers.current[i]); setClosing((c) => { const n = { ...c }; delete n[i]; return n; }); setOpenI(i); };
    const leave = () => { shut(openI); setOpenI(-1); setHv(''); };
    // the slot's width, measured, so the open pair's geometry is in px (a % would resolve against a shrink-to-fit box); no transition while it is set
    const root = useRef(null), sav = useRef(null);
    useLayoutEffect(() => {
        const el = sav.current; if (!el || typeof ResizeObserver !== 'function') return undefined;
        const m = () => { const f = el.firstElementChild; if (!f) return; const w = `${f.getBoundingClientRect().width}px`; if (el.style.getPropertyValue('--sww') === w) return;
            root.current.classList.add('acx-notr'); el.style.setProperty('--sww', w); void el.offsetWidth; requestAnimationFrame(() => requestAnimationFrame(() => root.current && root.current.classList.remove('acx-notr'))); };
        const ro = new ResizeObserver(m); ro.observe(el); m();
        return () => ro.disconnect();
    }, []);
    const recent = hist.recent.slice(0, NCOL * NREC);
    const savedC = openI >= 0 ? hist.saved[openI] : null;
    return html`
        <div class="acx" ref=${root} style=${`--cur:${cur};--on-cur:${onInk(cur)}`}>
            <div class="acx-sv" ref=${svRef} role="slider" tabindex="0" aria-label="Saturation and brightness" aria-valuetext=${cur}
                 style=${`background:linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,${hsv2hex(h, 1, 1)})`}
                 onPointerDown=${dragOn(svRef, atSv)} onKeyDown=${keySv} onBlur=${() => push(cur)}>
                <i style=${`left:${s * 100}%;top:${(1 - v) * 100}%;background:${cur}`}></i></div>
            <div class="acx-huew"><div class="acx-hue" ref=${hueRef} role="slider" tabindex="0" aria-label="Hue" aria-valuemin="0" aria-valuemax="360" aria-valuenow=${Math.round(h)}
                 onPointerDown=${dragOn(hueRef, atHue)} onKeyDown=${keyHue} onBlur=${() => push(cur)}>
                <i style=${`left:calc(var(--huet) / 2 + ${h / 360} * (100% - var(--huet)));background:${hsv2hex(h, 1, 1)}`}></i></div></div>
            <div class="acx-g acx-rg" onMouseLeave=${() => setRecHc(null)}>
                <div class="acx-gl"><${Icon} name="history" /><span>Recent</span>
                    <span class="acx-hint" aria-hidden="true"><span class=${'acx-hc' + (recHc ? ' acx-on' : '')} style=${recHc ? `--hc:${recHc}` : null}><${Icon} name="check" /><b>${recHc || ''}</b></span></span></div>
                <div class="acx-sw acx-rec">${Array.from({ length: NCOL * NREC }, (_, i) => { const c = recent[i]; return c
                    ? html`<button type="button" key=${i} class="acx-s" style=${`--sw:${c}`} aria-pressed=${c === cur ? 'true' : 'false'} aria-label=${`Use ${c}`} onMouseEnter=${() => setRecHc(c)} onFocus=${() => setRecHc(c)} onClick=${() => pick(c, false)}></button>`
                    : html`<span key=${i} class="acx-s acx-none" aria-hidden="true"></span>`; })}</div></div>
            <div class="acx-g" onMouseLeave=${leave}>
                <div class="acx-gl"><${Icon} name="bookmark" /><span>Saved</span>
                    <span class="acx-hint" aria-hidden="true"><span class=${'acx-hc' + (savedC ? ' acx-on' : '')} style=${savedC ? `--hc:${savedC}` : null}><${Icon} name="check" /><b>${savedC || ''}</b></span><span class=${'acx-hc' + (savedC ? ' acx-on' : '')} style=${savedC ? `--hc:${cur}` : null}><${Icon} name="refresh-cw" /><b>${savedC ? cur : ''}</b></span></span></div>
                <div class="acx-sw acx-sav" ref=${sav}>${hist.saved.map((c, i) => (c
                    ? html`<div key=${i} class=${'acx-s acx-full' + (openI === i ? ' acx-open' : '') + (closing[i] ? ' acx-closing' : '')} data-dir=${i >= NCOL / 2 ? 'l' : 'r'} style=${`--sw:${c};--on-sw:${onInk(c)}`} aria-pressed=${c === cur ? 'true' : 'false'}
                               role="group" aria-label=${`Saved ${c}`} onMouseEnter=${() => openAt(i)} onFocusIn=${() => openAt(i)} onFocusOut=${(e) => { if (!e.currentTarget.contains(e.relatedTarget)) leave(); }}>
                        <span class="acx-ov" aria-hidden="false"><b class="acx-sh"></b><b class="acx-pu"></b><b class="acx-pr"></b><b class="acx-dv"></b>
                            <span class="acx-h" data-hv=${openI === i ? hv : ''}>
                                <button type="button" class="acx-hb" aria-label=${`Use ${c}`} onMouseEnter=${() => setHv('use')} onClick=${() => pick(c, false)}><${Icon} name="check" /></button>
                                <button type="button" class="acx-hb" tabindex=${openI === i ? 0 : -1} aria-label=${`Replace ${c} with ${cur}`} onMouseEnter=${() => setHv('rep')} onClick=${() => setSaved(i, cur)}><${Icon} name="refresh-cw" /></button></span></span></div>`
                    : html`<button type="button" key=${i} class="acx-s acx-empty" aria-label=${`Save ${cur} here`} onMouseEnter=${() => { shut(openI); setOpenI(-1); }} onClick=${() => setSaved(i, cur)}><${Icon} name="plus" /></button>`))}</div></div>
            <div class="acx-row1">
                <label class="acx-hex"><s></s><em>#</em><input id=${id} value=${hex} maxlength="7" spellcheck="false" autocomplete="off" aria-label="Hex colour"
                    onFocus=${() => setTyping(true)} onBlur=${() => setTyping(false)} onInput=${(e) => typed(e.target.value)}
                    onPaste=${(e) => { e.preventDefault(); typed((e.clipboardData.getData('text') || '').trim().replace(/^#/, '')); }} />
                    <button type="button" class=${'acx-ib' + (copied ? ' acx-ok' : '')} aria-label=${copied ? 'Copied' : `Copy ${cur}`} data-tip=${copied ? 'Copied' : 'Copy'} onClick=${copy}><${Icon} name=${copied ? 'check' : 'copy'} /></button></label>
                <button type="button" class="acx-new" aria-label="New colour" data-tip="New colour" onClick=${() => pick(hexOf(randomAccent()), true)}><${Icon} name="shuffle" /></button></div>
        </div>`;
}

export function EndPicker({ a, csrfToken, overlay, onStaged, cls = '' }) {
    return html`
        <span class=${'b3-endwrap ' + cls}><${ChipPop} align="end" tone="warn" btnCls="b3-endbtn" aria="Set end date"
            btn=${html`<${Icon} name="calendar-plus" />Set end date`}
            body=${(close) => html`<${DateStage} a=${a} field="expiresAt" csrfToken=${csrfToken} overlay=${overlay} onStaged=${onStaged} close=${close} />`} /></span>`;
}

export function NeverChip({ n }) {
    if (!n) return null;
    return html`<button type="button" class="b3-never" onClick=${() => { const c = document.querySelector('.qcard.b3-forever'); if (c) { c.scrollIntoView({ behavior: 'smooth', block: 'center' }); c.classList.remove('b3-pulse'); void c.offsetWidth; c.classList.add('b3-pulse'); } }}>
        <${Icon} name="infinity" /><span class="b3-nw"><b>${n}</b>never ${n === 1 ? 'ends' : 'end'}</span></button>`;
}

export function ForeverAhead({ list, accentOf, daysBetween, csrfToken, overlay, onStaged }) {
    if (!list.length) return null;
    return html`${list.map((a) => html`
        <div class="b3-chg-forever" key=${a._id} style=${`--c:${accentOf(a)}`}>
            <span class="b3-chg-k"><${Icon} name="infinity" /></span>
            <span class="b3-chg-b">
                ${''/* The key issue is drawn, not written: a bar with a start and no end. 2026-09-16 16:28 EDT */}
                <span class="b3-forever-run" aria-label=${`Live ${daysBetween(a.createdAt, Date.now())} days, with no end set`}>
                    <b>${daysBetween(a.createdAt, Date.now())}</b><span>days live</span>
                    <i class="b3-forever-bar"></i>
                    <em>no end</em>
                </span>
                <span class="b3-quote"><i></i><span>${String(a.text || '').replace(/^#{1,3}\s+/gm, '')}</span></span>
            </span>
            <${EndPicker} a=${a} csrfToken=${csrfToken} overlay=${overlay} onStaged=${onStaged} cls="right" />
        </div>`)}`;
}
