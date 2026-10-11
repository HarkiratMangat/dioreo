// Board 3 version 2 — BOARD ONLY. The Armory proposals, built as working components that the copied armory.js mounts. Session 5 ports these into portal/ui; every class here is b3- prefixed so a port is a rename, never a guess. Globals from armory.logic.js (loaded as a classic script): CATEGORY_CHIP_LABEL, buildNumberOf, displayBuildLabel.
import { POPT } from './poptime.js';   // pop-up timing, one table
import THUMBS from '../data/thumbs.js';   // the seven named builds' images, bundled so the published board shows them
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect, useRef, useLayoutEffect } from '../vendor/preact-hooks.mjs';
import { Icon, Fold } from '../ui/icons.js';
import { useB3, setB3 } from './state.js';
import { mountVolt, unmountVolt } from './volt.js';
import { modesOf } from '../b4/bulkformat.js';

/* global CATEGORY_CHIP_LABEL, buildNumberOf, displayBuildLabel */

const SLOT_ORDER = ['Optic', 'Muzzle', 'Barrel', 'Stock', 'Laser', 'Underbarrel', 'Rear Grip', 'Ammunition', 'Perk'];

// The code IS the button - his note, 2026-09-16 13:56 EDT: "the gunsmith code should copy when it's click, no separate button."
// A separate copy button costs a column and says nothing the code itself could not say by being clickable.
// 2026-09-26 15:38 EDT (his, on the Bulk ledger: "instead of the whole 'copied' chip. just make the copy button turn into a --ok checkmark and then revert
// back after a little delay"), and 2026-09-26 15:43 EDT for every CodeCell (his popup: "Yes, both tick"): the code stays, only the copy mark turns into the check.
export function CodeCell({ b }) {
    const [took, setTook] = useState(false);
    if (b.mode === 'DMZ') return html`<span class="b3-sd-code dim">DMZ</span>`;
    if (!b.shareCode) return html`<span class="b3-sd-code none"><${Icon} name="triangle-alert" />No code</span>`;
    const take = () => { try { navigator.clipboard.writeText(b.shareCode); } catch (e) { /* board only */ }
        setTook(true); setTimeout(() => setTook(false), 1100); };
    return html`
        <button type="button" class=${'b3-sd-code as-btn' + (took ? ' ticked' : '')} title=${`Copy ${b.shareCode}`}
                aria-label=${`Copy gunsmith code ${b.shareCode}`} onClick=${take}>
            ${b.shareCode}<${Icon} name=${took ? 'check' : 'copy'} /></button>`;
}
const slotVar = (slot) => (slot ? `var(--sl-${String(slot).toLowerCase().replace(/\s+/g, '-')}, var(--sl-unknown))` : 'var(--sl-unknown)');
export const catLabel = (c) => (typeof CATEGORY_CHIP_LABEL !== 'undefined' && CATEGORY_CHIP_LABEL[c]) || c;

// ── A hint: the portal's tooltips are off until they are redesigned, so this is that redesign ────────────── Shown on hover after a short wait and at once on keyboard focus; the card names the action, the line under it says the consequence.
// 🔴 REBUILT ON THE PROBLEM CARD'S OUTLINE (thread 2aed701d, 2026-09-18 23:35 EDT): "use the same smooth reveal/hide animation and the smooth
// pointer arc and overall shape/container as the Problem pop-up container". Same generator (`pcPath`), same two-way transition,
// same `.b3-pc-edge` path; only the colours are neutral, because a hint is not a problem. It is mounted while shown so the
// hide can run, placed `fixed` over its anchor, and its type is its own — the old card inherited the column head's capitals.
export function Hint({ title, sub, children, side = 'top', id, steps = null, tone = null, media = null, set = 2, pin = false, cls = '' }) {   // set: the pop-up timing set (b3/poptime.js) — 2, or 1 for a card that informs   // cls: a class for the wrapper, where the anchor is a grid item of its row   // pin (his 12:35 EDT): a click holds it open; a click outside or on its anchor again lets it go  // media (V47 BJ): a picture the card leads with — the build's image  // tone: the same container in another colour (v17: 'warn', the Stage blocker)
    const T = POPT[set] || POPT[2];
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [shown, setShown] = useState(false);
    const [geo, setGeo] = useState(null);
    const wrap = useRef(null);
    const wait = useRef(null);
    const [rev, setRev] = useState(0);   // V48: a card whose content changes size once open (an image decoding) is measured again
    const [cut, setCut] = useState(false);
    const cutMe = useRef(null);
    const [pinned, setPinned] = useState(false);
    cutMe.current = () => { clearTimeout(wait.current); setCut(true); setPinned(false); setOpen(false); };
    cutMe.soft = () => { clearTimeout(wait.current); setPinned(false); setOpen(false); };   // the handoff: leave with the fade, no close wait
    cutMe.held = pinned;   // his 13:07 EDT: a pinned card holds the board — hovering another mark opens nothing (popHeld)
    useEffect(() => {
        if (!pinned) return undefined;
        const out = (e) => { if (wrap.current && !wrap.current.contains(e.target)) { setPinned(false); setOpen(false); } };
        document.addEventListener('pointerdown', out);
        return () => document.removeEventListener('pointerdown', out);
    }, [pinned]);
    useEffect(() => { if (!open) return undefined; takePop(cutMe); return () => dropPop(cutMe); }, [open]);
    useEffect(() => {
        if (open) { setCut(false); setMounted(true); return undefined; }
        setShown(false);
        const t = setTimeout(() => { setMounted(false); setGeo(null); setCut(false); }, T.removed);
        return () => clearTimeout(t);
    }, [open]);
    useLayoutEffect(() => {
        if (!open || !mounted || !wrap.current) return undefined;
        const card = wrap.current.querySelector('.b3-hc');
        const anchor = wrap.current.firstElementChild;
        if (!card || !anchor || card === anchor) return undefined;
        // his 12:18 EDT (the image card's opening "is shit, unrefined, and wrong"): a picture card was measured and SHOWN before its image had a size, so the card
        // opened at one size and its outline then sprang to another while the picture sat still. Nothing is measured or shown until every image in it is settled.
        const pending = [...card.querySelectorAll('img')].filter((i) => !i.complete);
        if (pending.length) { const go = () => setRev((x) => x + 1); pending.forEach((i) => { i.addEventListener('load', go, { once: true }); i.addEventListener('error', go, { once: true }); }); return undefined; }
        const a = anchor.getBoundingClientRect();
        const w = Math.max(card.offsetWidth, 120), h = card.offsetHeight;
        const cx = a.left + a.width / 2, M = 10;
        // CENTRED over its anchor (his note: the Stage deletion hint "appears off to the side instead of centered above it"),
        // clamped into the viewport; the pointer still lands on the anchor's centre after a clamp.
        // his 12:35 EDT (the right-most column's card "accidentally open[s] out of bounds"): clamped inside the surface it belongs to (the gate's panel), not only the window
        const bd = (wrap.current.closest('.pb-panel, .pb-gate, .drawer') || document.documentElement).getBoundingClientRect();
        // his 12:42 EDT: the clamp moved the card and the pointer stayed where the outline allows it — pcPath keeps the lip 44px (radius + span + 4) from each
        // corner — so near an edge the pointer sat beside the mark instead of on it. The card may slide only as far as keeps the pointer ON its anchor.
        const EDGE = 44;
        let left = Math.min(Math.max(Math.max(M, bd.left + M), cx - w / 2), Math.min(window.innerWidth, bd.right) - w - M);
        left = Math.round(Math.min(Math.max(left, cx - (w - EDGE)), cx - EDGE));
        // v17 (2026-09-24 10:50 EDT): `fixed` is relative to the viewport only when no ancestor makes a containing block (a transform, a filter, contain:paint);
        // inside a drawer one does, and the card landed 73px low and 280px aside. Place it in that block's coordinates.
        let cb = card.parentElement, ox = 0, oy = 0;
        while (cb && cb !== document.documentElement) { const c = getComputedStyle(cb); if (c.transform !== 'none' || c.filter !== 'none' || c.perspective !== 'none' || /paint|layout|strict|content/.test(c.contain) || /transform|filter/.test(c.willChange)) { const r0 = cb.getBoundingClientRect(); ox = r0.left; oy = r0.top; break; } cb = cb.parentElement; }
        // V48 (his: the image pop-up "doesn't open downward at all"): above by default, below only when the card would leave the top of the window
        const down = a.top - h - 4 < M;
        // his 12:11 EDT (the image card "animates incorrectly when it opens upward"): an up-card is anchored by its BOTTOM (the pointer side), so a late change of
        // height (an image that decodes or fails) grows it upward instead of sliding the whole card; a down-card is anchored by its top, as before
        const cbBottom = oy ? (cb && cb !== document.documentElement ? cb.getBoundingClientRect().bottom : vpH()) : vpH();
        setGeo({ w, h, left: left - ox, top: Math.round(down ? a.bottom + 4 : a.top - h - 4) - oy, bottom: Math.round(cbBottom - (a.top - 4)), tx: Math.round(cx - left), down });
        const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
        const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { if (Math.abs(card.offsetWidth - w) > 1 || Math.abs(card.offsetHeight - h) > 1) setRev((x) => x + 1); }) : null;
        if (ro) ro.observe(card);
        // his 13:07 EDT (the image pop-up "doesn't anchor to the button… we literally fixed this with the all-pass mark and problem chip SO long ago"): a
        // `fixed` card follows its anchor only if it is placed again whenever anything scrolls — ProblemChip learned that on 2026-09-18 and Hint never did,
        // so a pinned card stayed where it opened while the table scrolled away under it. Any scroll re-places it (one per frame); an anchor scrolled out of
        // its scroller or the window closes it, as ProblemChip's does; Escape lets a pinned card go.
        let sc = null;
        for (let n = anchor.parentElement; n && n !== document.body; n = n.parentElement) { const cs = getComputedStyle(n); if (n.scrollHeight > n.clientHeight + 1 && /auto|scroll/.test(cs.overflowY)) { sc = n; break; } }
        let q = 0;
        const onScroll = () => { if (q) return; q = requestAnimationFrame(() => { q = 0; const r2 = anchor.getBoundingClientRect(); const s2 = sc ? sc.getBoundingClientRect() : { top: 0, bottom: window.innerHeight }; if (r2.bottom < Math.max(0, s2.top) || r2.top > Math.min(window.innerHeight, s2.bottom)) { setPinned(false); setOpen(false); return; } setRev((x) => x + 1); }); };
        const onKey = (e) => { if (e.key === 'Escape') { setPinned(false); setOpen(false); } };
        document.addEventListener('scroll', onScroll, { passive: true, capture: true }); window.addEventListener('resize', onScroll); document.addEventListener('keydown', onKey);
        return () => { cancelAnimationFrame(r); cancelAnimationFrame(q); if (ro) ro.disconnect(); document.removeEventListener('scroll', onScroll, { capture: true }); window.removeEventListener('resize', onScroll); document.removeEventListener('keydown', onKey); };
    }, [open, mounted, rev]);
    // 2026-09-30 18:18 EDT (his timing sets): the waits are the mouse's; a card already open hands over at once (popWarm), and focus leaving closes at once
    const enter = () => { if (popHeld(cutMe)) return; clearTimeout(wait.current); if (open || popWarm(cutMe)) setOpen(true); else wait.current = setTimeout(() => setOpen(true), T.openWait); };
    const leave = () => { clearTimeout(wait.current); if (!pinned) wait.current = setTimeout(() => setOpen(false), T.closeWait); };
    const blur = () => { clearTimeout(wait.current); if (!pinned) setOpen(false); };
    const click = pin ? (e) => { if (e) e.stopPropagation(); if (e && e.target && e.target.closest && e.target.closest('.b3-hc')) return; clearTimeout(wait.current);   // a click on the open card is not a click on its mark
 if (pinned) { setPinned(false); setOpen(false); } else { setPinned(true); setOpen(true); } } : null;
    return html`
        <span class=${'b3-hint' + (cls ? ' ' + cls : '') + (pinned ? ' pinned' : '')} data-side=${side} ref=${wrap} onMouseEnter=${enter} onMouseLeave=${leave} onClick=${click}
              onFocusIn=${(e) => { if (!popHeld(cutMe) && e.target.matches && e.target.matches(':focus-visible')) { clearTimeout(wait.current); setOpen(true); } }} onFocusOut=${blur}>
            ${children}
            ${mounted ? html`<span class=${'b3-hc pop-s' + set + (shown ? ' in' : '') + (steps ? ' has-steps' : '') + (media ? ' has-media' : '') + (tone ? ` t-${tone}` : '') + (geo && geo.down ? ' down' : '') + (cut ? ' cut' : '')} role="tooltip" id=${id || null}
                  style=${geo ? (geo.down ? `left:${geo.left}px;top:${geo.top}px;bottom:auto;--tx:${geo.tx}px` : `left:${geo.left}px;top:auto;bottom:${geo.bottom}px;--tx:${geo.tx}px`) : 'visibility:hidden;left:0;top:0'}>
                ${geo ? html`<svg class="b3-pc-edge" key=${`${geo.w}x${geo.h}`} aria-hidden="true" viewBox=${`0 0 ${geo.w} ${geo.h}`} width=${geo.w} height=${geo.h}>
                    <path class="glow" style=${`d:path("${pcPath({ w: geo.w, h: geo.h, tx: geo.tx, up: !geo.down, open: shown })}")`} />
                    <path style=${`d:path("${pcPath({ w: geo.w, h: geo.h, tx: geo.tx, up: !geo.down, open: shown })}")`} /></svg>` : null}
                ${''/* the border itself, over the content — see LINE in b3/board.css */}${geo ? html`<svg class="b3-pc-edge b3-pc-line" key=${`l${geo.w}x${geo.h}`} aria-hidden="true" viewBox=${`0 0 ${geo.w} ${geo.h}`} width=${geo.w} height=${geo.h}><path style=${`d:path("${pcPath({ w: geo.w, h: geo.h, tx: geo.tx, up: !geo.down, open: shown })}")`} /></svg>` : null}
                ${media ? html`<span class="b3-hc-media">${media}</span>` : null}
                ${title ? html`<b>${title}</b>` : null}
                ${''/* 2026-09-19 10:23 EDT: A HINT WITH STEPS IS A DIAGRAM, NOT A PARAGRAPH. His words: "fix the spacing, alignment, and actual design within
                     this pop-up… not once have i looked at it and thought, hmm let me read what it says." The track was three small pills
                     under two lines of text, so the words led and the picture trailed. The track leads now: a node per stage with its icon,
                     its name and when it happens, joined by a line that is solid where the build has been and dashed where it has not.
                     The one line of text sits under it. */}
                ${steps ? html`
                    <span class="b3-hs" aria-hidden="true">
                        ${steps.map(([word, state, icon, when], i) => html`
                            ${i ? html`<i class=${'b3-hs-l ' + state} key=${'l' + word}></i>` : null}
                            <span class=${'b3-hs-n ' + state} key=${word}><i class="b3-hs-d">${icon ? html`<${Icon} name=${icon} />` : null}</i><em>${word}</em>${when ? html`<small>${when}</small>` : null}</span>`)}
                    </span>` : null}
                ${sub ? html`<span class="b3-hc-sub">${sub}</span>` : null}
            </span>` : null}
        </span>`;
}

// ── Build numbers as a range: "Build 2", "Builds 1–3", "Builds 1, 3" ───────────────────────────────────────
export function buildsWord(ns) {
    const s = [...ns].sort((a, b) => a - b);
    if (s.length === 1) return `Build ${s[0]}`;
    const contiguous = s.every((n, i) => i === 0 || n === s[i - 1] + 1);
    if (contiguous && s.length > 2) return `Builds ${s[0]}–${s[s.length - 1]}`;
    return `Builds ${s.join(', ')}`;
}

// ── What is wrong with a build, drawn rather than written ────────────────────────────────────────────────────
// 🔴 SEVERITY, added 2026-09-17 10:07 EDT by the design critique he asked for on the Repairs panel. Every one of these five wore
// the identical orange chip, so the panel had ONE VOICE for five very different facts: a build with three attachments
// still works, and a build with no gunsmith code cannot be imported or shared by anyone at all. Making the reader rank
// five identical chips themselves, on every row, forever, is what turns a worklist into an inventory.
//   BLOCKS · the build cannot be handed to another player, or the code it hands them is wrong.
//   THIN   · the build works; it is below the standard of the rest of the armory.
// Blocking faults sort first inside a row and decide the order of the rows, which is what "worst first" should have
// meant all along — it used to mean "most faults first", so three cosmetic nits outranked one unshareable build.
export const FAULT_SEVERITY = { 'no-code': 'blocks', 'code-length-mismatch': 'blocks', 'few-attachments': 'thin', 'near-duplicate': 'thin', 'missing-image': 'thin' };
export const blocksOf = (b) => faultsFor(b).filter((f) => FAULT_SEVERITY[f] === 'blocks').length;
const FAULT_ORDER = ['no-code', 'code-length-mismatch', 'few-attachments', 'near-duplicate', 'missing-image'];
export const faultsFor = (b) => FAULT_ORDER.filter((f) => (b.coverage || []).includes(f));

// What passing each check MEANS, in the words the Repairs pass card uses — one list, so the card over a clean build's mark
// and the pass card cannot drift apart. A pass shows the thing present, so the image check wears the image, not image-off.
export const PASS_LINES = [
    ['missing-image', 'image', 'Has an image'],
    ['few-attachments', 'layers', '3 or more attachments'],
    ['near-duplicate', 'copy', 'A code of its own'],
    ['no-code', 'code', 'Has a gunsmith code'],
    ['code-length-mismatch', 'list-checks', 'Code matches the build'],
];
// ⚠️ A DMZ build carries no gunsmith code, so the two code checks say nothing true about it and are left off its card
// (my reading, 2026-09-19 09:27 EDT, unconfirmed by him).
const passLines = (b) => PASS_LINES.filter(([k]) => !(b.mode === 'DMZ' && !b.shareCode && (k === 'no-code' || k === 'code-length-mismatch')));

// The build a near-duplicate is nearly the same as: a sibling of the same weapon and mode whose attachments differ by at most one.
// 2026-09-18 11:10 EDT: a near-duplicate whose twin was another WEAPON read "Same attachments as another build", which names nothing —
// the defect he quoted in capitals on 2026-09-17. A sibling within two attachments still wins; failing that, another weapon
// counts when its attachments are identical, and the line names that weapon.
export function twinOf(b, builds) {
    const mine = new Set(b.attachments || []);
    let best = null;
    for (const o of builds) {
        if (String(o._id) === String(b._id) || o.mode !== b.mode) continue;
        // The API flags a near-duplicate first on an identical gunsmith CODE, any weapon (findDuplicateLoadouts), so that wins.
        if (b.shareCode && o.shareCode === b.shareCode) return o;
        const theirs = o.attachments || [];
        const diff = theirs.filter((a) => !mine.has(a)).length + [...mine].filter((a) => !theirs.includes(a)).length;
        const sibling = o.weaponKey === b.weaponKey;
        if (sibling ? diff > 2 : diff > 0) continue;
        const score = diff + (sibling ? 0 : 0.5);
        if (!best || score < best.score) best = { o, score };
    }
    return best ? best.o : null;
}

// 🔴 EVERY LABEL HERE WAS WRITTEN FROM THE CHECK'S POINT OF VIEW, NOT THE READER'S — rewritten 2026-09-17 09:38 EDT.
// His words, and all three are one defect: "these problem/warn labels are so unintuitive and uninformative. like
// '4 missing'... 4 OF WHAT??? 'same as build 1'... WHAT'S SAME AS BUILD 1??? 'Code ≠ build | code 4 ≠ build 5'...
// HUH, WHAT THAT MEAN???" A check is named `few-attachments`, so the chip said what the CHECK found — a bare count,
// a comparison operator, a subjectless "same as". Not one of them names the noun, and the noun IS the message.
//   ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
//   │  A PROBLEM CHIP NAMES THE THING THAT IS WRONG, IN THE READER'S NOUNS — never in the check's.            │
//   └────────────────────────────────────────────────────────────────────────────────────────────────────────┘
// `short` is the chip, `text` the heading in the opened row, `cost` what it costs you. The code chip also stopped
// carrying a separate `≠` visual: two renderings of one comparison is what made it read as an equation to solve.
// 🔴 AND I FIXED ONE OF THE THREE — 2026-09-17 11:06 EDT. Every fault returns THREE strings and I rewrote only `short`, so the
// line he actually quoted — "'same as build 1'... WHAT'S SAME AS BUILD 1???" — survived verbatim in `text`, which is
// what the By-problem shape prints on its cards and what the opened worklist row prints as its heading. I found it by
// opening `p6=b`, a shape I had never rendered. Same defect as the chip, one field along: fix the CLASS of string,
// not the one the screenshot happened to show.
export function faultLine(f, b, builds) {
    const n = (b.attachments || []).length;
    if (f === 'few-attachments') return { icon: 'layers', text: 'Attachments missing', short: `${5 - n} empty slot${5 - n === 1 ? '' : 's'}`, cost: `${n} of 5 slots filled — the card renders ${5 - n} empty row${5 - n === 1 ? '' : 's'}`, visual: html`<span class="b3-pips" aria-label=${`${n} of 5 attachments`}>${[0, 1, 2, 3, 4].map((i) => html`<i class=${i < n ? 'on' : ''} key=${i}></i>`)}<b>${n}<em>/5</em></b></span>` };
    // The value slot held `— — — — —`, five em dashes mimicking the meter beside it: decoration SHAPED like data, which
    // reads as a reading at a glance and is worse than an empty cell. A missing code has no quantity, so the slot
    // carries what its absence COSTS instead — the one thing the chip above cannot say. (2026-09-16 17:56 EDT)
    if (f === 'no-code') return { icon: 'code', text: 'No gunsmith code', short: 'No gunsmith code', cost: 'Nobody can import it, and it cannot be shared', visual: html`<span class="b3-nocode">can't be shared or imported</span>` };
    if (f === 'code-length-mismatch') {
        const c = Math.floor(String(b.shareCode || '').length / 2);
        return { icon: 'list-checks', text: 'Code disagrees with the build', short: `Code fills ${c} slots, build lists ${n}`, cost: `Importing the code fills ${c} slots, not the ${n} listed here`, visual: null };
    }
    if (f === 'near-duplicate') {
        const t = twinOf(b, builds);
        const tn = t ? buildNumberOf(builds, t).n : null;
        const tw = t && t.weaponName !== b.weaponName ? `${t.weaponName} ` : '';
        const what = t && b.shareCode && t.shareCode === b.shareCode ? 'code' : 'attachments';
        return { icon: 'copy', text: tn ? `Same ${what} as ${tw}Build ${tn}` : 'Same attachments as another build', short: tn ? `Same ${what} as ${tw}Build ${tn}` : 'Same attachments as another build', cost: 'One of the two is doing no work', visual: null };
    }
    if (f === 'missing-image') return { icon: 'image-off', text: 'No Image or Key', short: 'No Image or Key', cost: 'The build renders on the card with no thumbnail', visual: null };
    return { icon: 'triangle-alert', text: f, short: f, cost: '', visual: null };
}

// V47 BF (his, 2026-09-30 09:58 EDT): "while both of these have a 'Code disagrees with the build', the reason the code disagrees is different between them yet
// it's the same warning with no additional info … i DONT want a long line of prose". The fault's title stays its name across the board; under it, the fault
// DRAWN: the code's slots against the build's (a hatched pip is a slot one side has and the other lacks), the slots filled out of five, the twin as a build
// chip — and a tag of two or three words naming the gap. Repairs' ticket and the problem pop-up render this one component, so they cannot drift.
const hintPips = (own, other, of) => html`<span class="b3-fh-p" aria-hidden="true">${Array.from({ length: of }, (_, i) => html`<i key=${i} class=${i < own ? 'on' : i < other ? 'gap' : ''}></i>`)}</span>`;
export function FaultHint({ k, b, builds }) {
    const n = (b.attachments || []).length;
    const tag = (t, tone) => html`<span class=${'b3-fh-tag ' + tone}>${t}</span>`;
    if (k === 'code-length-mismatch') {
        // V47 BF, his correction 10:14 EDT ("they currently read as the same text wrapped into 2 line"): the two rows are two different THINGS. The code row
        // is the code itself, pair by pair; the build row is its attachments, each in its slot's colour; column i of one is column i of the other, and the
        // column one side lacks is the hatched hole.
        const pairs = String(b.shareCode || '').match(/.{1,2}/g) || []; const atts = b.attachments || []; const slots = b.attachmentSlots || [];
        const c = pairs.length; const of = Math.max(c, n, 1); const d = Math.abs(c - n);
        return html`<span class="b3-fh" role="img" aria-label=${`The code fills ${c} slots; the build lists ${n}`}>
            <span class="b3-fh-cmp" style=${`--n:${of}`}>
                <em>Code</em><span class="b3-fh-cells">${Array.from({ length: of }, (_, x) => html`<i key=${'c' + x} class=${'b3-fh-pr' + (x < c ? '' : ' gap')} style=${x < c && x < n ? `--sl:${slotVar(slots[x])}` : null}>${pairs[x] || ''}</i>`)}</span>
                <em>Build</em><span class="b3-fh-cells">${Array.from({ length: of }, (_, x) => html`<i key=${'b' + x} class=${'b3-fh-at' + (x < n ? '' : ' gap')} style=${x < n ? `--sl:${slotVar(slots[x])}` : null} title=${x < n ? `${slots[x] ? slots[x] + ' · ' : ''}${atts[x]}` : null}></i>`)}</span>
            </span>
            ${''/* his 10:30 EDT: the tag says which row is short, in the row's own word, beside the rows and as tall as both */}
            <span class="b3-fh-tag warn two"><b>${d} missing</b><span>from the ${c > n ? 'build' : 'code'}</span></span></span>`;
    }
    // V48 (his: "Improve 'attachments missing' design"): the comparison's own cells — each attachment in its slot's colour, each empty slot the hatched hole
    if (k === 'few-attachments') { const sl = b.attachmentSlots || []; return html`<span class="b3-fh" role="img" aria-label=${`${n} of 5 slots filled`}><span class="b3-fh-cmp" style="--n:5"><em>Slots</em><span class="b3-fh-cells">${[0, 1, 2, 3, 4].map((x) => html`<i key=${x} class=${'b3-fh-pr' + (x < n ? '' : ' gap')} style=${x < n ? `--sl:${slotVar(sl[x])}` : null}></i>`)}</span></span><span class="b3-fh-tag thin two"><b>${5 - n} of 5 empty</b><span>on the card</span></span></span>`; }
    if (k === 'no-code') return html`<span class="b3-fh">${tag('Can’t be shared or imported', 'warn')}</span>`;
    if (k === 'near-duplicate') {
        const t = twinOf(b, builds); if (!t) return null;
        const same = b.shareCode && t.shareCode === b.shareCode;
        // the title already names the twin ("Same code as AK117 Build 1"), so the hint shows WHAT is shared and what it costs, never the twin again
        return html`<span class="b3-fh">${same ? html`<span class="b3-fh-twin" style="--t:var(--warn)"><code>${b.shareCode}</code></span>` : html`<span class="b3-fh-twin" style=${`--t:${t.accent || 'var(--ink3)'}`}><b>${n}</b>of the same attachments</span>`}${tag('One of the two is redundant', 'thin')}</span>`;
    }
    if (k === 'missing-image') return html`<span class="b3-fh">${tag('Cloudinary hosted image not found', 'warn')}</span>`;   // his 12:41 EDT
    return null;
}

// ── THE CARD'S BORDER IS ONE PATH, AND THE POINTER IS A BULGE IN IT — 2026-09-17 19:02 EDT ───────────────
// His thread: "take Gemini's fluid reveal + pointer-as-part-of-the-border from hk-shots/perfected_liquid_tension.html",
// and that file answers the question five rejected pointers could not. EVERY ONE OF THEM WAS A SECOND ELEMENT — a
// triangle that has to reproduce the card's ring, radius, ground and shadow and then meet it along a seam, which is
// where each of them died. Gemini's card has no second element: its outline is a single SVG path, the pointer is
// two bezier control points ON that path, and at rest those handles lie flat in the top edge. Opening pulls them
// up. There is no join to get wrong because there is no join.
// ⚠️ THE DEMO IS A FIXED 344x172 AND THIS CARD IS NOT — its height follows how many problems the build has. So the
// path is GENERATED from the card's own measured box rather than hard-coded, and both states emit the identical
// command sequence, which is what lets `d` interpolate at all.
// ✅ AND IT CLOSES A SECOND THREAD FOR FREE: "the reveal animates; the hide is still an abrupt disappear." That was
// never a missing exit animation — it is that a @keyframes bound to the OPEN state has nothing to say on the way
// out. A transition belongs to the ELEMENT, so it runs in both directions by construction.
const PC_R = 14;                                   // the card's corner radius
const PC_LIP = 10;                                 // how far the pointer reaches out of the edge when open
const PC_SPAN = 26;                                // half the width of the stretched section of edge
export function pcPath({ w, h, tx, up, open }) {
    const r = PC_R, lip = PC_LIP;
    const t = up ? h - lip : lip;                  // the edge the pointer lives on
    const b = up ? 0 : h;                          // the opposite edge — ⚠️ was `up ? h : 0`, which put an upward card's
                                                   // far edge on its pointer edge: the outline came out a 10px sliver at
                                                   // the bottom and the body had no fill at all (2026-09-17 22:33 EDT). Never drawn right.
    const x = Math.max(r + PC_SPAN + 4, Math.min(w - r - PC_SPAN - 4, tx));
    const peak = open ? (up ? t + lip : t - lip) : t;
    const s = PC_SPAN;
    if (up) {
        return `M ${r},${b} L ${w - r},${b} A ${r},${r} 0 0 1 ${w},${b + r} L ${w},${t - r}`
            + ` A ${r},${r} 0 0 1 ${w - r},${t} L ${x + s},${t}`
            + ` C ${x + s * 0.42},${t} ${x + s * 0.30},${peak} ${x},${peak}`
            + ` C ${x - s * 0.30},${peak} ${x - s * 0.42},${t} ${x - s},${t}`
            + ` L ${r},${t} A ${r},${r} 0 0 1 0,${t - r} L 0,${b + r} A ${r},${r} 0 0 1 ${r},${b} Z`;
    }
    return `M ${r},${t} L ${x - s},${t}`
        + ` C ${x - s * 0.42},${t} ${x - s * 0.30},${peak} ${x},${peak}`
        + ` C ${x + s * 0.30},${peak} ${x + s * 0.42},${t} ${x + s},${t}`
        + ` L ${w - r},${t} A ${r},${r} 0 0 1 ${w},${t + r} L ${w},${h - r}`
        + ` A ${r},${r} 0 0 1 ${w - r},${h} L ${r},${h} A ${r},${r} 0 0 1 0,${h - r} L 0,${t + r}`
        + ` A ${r},${r} 0 0 1 ${r},${t} Z`;
}

// ── P3 · the problem chip and its card ──────────────────────────────────────────────────────────────────────
// `compact` is for a narrow cell — the Marks column of the selection list, where the full chip is wider than its
// column and lays itself over the code beside it. Compact is the mark alone; the card it opens is identical.
// V48 BM (his, 2026-09-30 11:14 EDT: "The container skeletons when hovering off of it and hovering onto the build column beside it"): two cards were on screen
// at once, one fading out over the table while the next faded in, each half-transparent — the "skeleton". One pop-up at a time across the board: the card
// that opens cuts the one before it instantly (its `cut` class drops the fade). Shared by ProblemChip and Hint.
// The build's image for an image mark's card (Compare heads, the manifest rows). Moved here from b4/compare.js 2026-09-30 13:19 EDT so both marks use one.
export function BuildImage({ b, n = null }) {
    const [bad, setBad] = useState(false);
    // his 11:44 EDT: a set image that failed is not a missing image — a plain black well, no hatch, no edge, the words, and the key it is set to
    if (b.imageKey && (bad || !b.imageUrl)) return html`<span class="cx-noimg fail"><${Icon} name="image-off" /><b>Image is set but failed to load</b><code class="cx-imkey">${b.imageKey}</code></span>`;
    // his 12:50 EDT: the fault's own words (No Image or Key) and its hint chip, on the warn chip's dark ground, no hatch, no inner edge
    if (!b.imageKey) return html`<span class="cx-noimg"><${Icon} name="image-off" /><b>No Image or Key</b><span class="b3-fh-tag warn">Cloudinary hosted image not found</span></span>`;
    return html`<img src=${THUMBS[String(b._id)] || b.imageUrl} alt=${n ? `${b.weaponName} build ${n}` : `${b.weaponName}’s build image`} onError=${() => setBad(true)} />`;
}
// The ± on a build key (Compare's .cx-kb, Pick builds' tiles): a minus takes an included build out, a plus puts one in.
export const toggleMark = (on) => html`<svg class="ic cx-kg" viewBox="0 0 16 16" aria-hidden="true"><path d=${on ? 'M4.5 8h7' : 'M4.5 8h7M8 4.5v7'} /></svg>`;

const POP = { cur: null };
// 2026-09-30 19:13 EDT (his: "the animations seem broken"; filmed): the handoff CUT the open card in one frame, and the next card only reached the screen ~100ms
// later, so moving between marks blinked. The open card now leaves with its own fade (soft), over which the next one fades in.
function takePop(me) { if (POP.cur && POP.cur !== me) { if (POP.cur.soft) POP.cur.soft(); else if (POP.cur.current) POP.cur.current(); } POP.cur = me; }
function dropPop(me) { if (POP.cur === me) POP.cur = null; }
// his 13:07 EDT ("when the pop-ups are frozen in open state, they instantly hide when hovering over a different mark"): a pinned card is a decision, a hover
// is not. While one is pinned no hover or focus opens another; a click elsewhere still lets it go first (its outside pointerdown), so a click moves the pin.
// A fixed box's `bottom` counts from the layout viewport, which a classic scrollbar shortens. documentElement.clientHeight is that height only in standards
// mode: the board page renders in quirks mode, where it is the whole document's height (~9,800px) and threw every up-card 8,800px off screen (2026-09-30 13:23 EDT, measured).
const vpH = () => (document.compatMode === 'CSS1Compat' ? document.documentElement.clientHeight : window.innerHeight);
function popHeld(me) { return Boolean(POP.cur && POP.cur !== me && POP.cur.held); }
// the handoff: another card is up (or in its close wait), so the next one hovered opens without its wait — takePop then lets the old one go at once
function popWarm(me) { return Boolean(POP.cur && POP.cur !== me && !POP.cur.held); }
// the nearest ancestor that scrolls or fades — the problem card pins to the viewport inside one. Read on the hover, during the open wait: on a board this
// size the read forces a layout (measured 57ms), which the first frame no longer pays (2026-09-30 18:18 EDT, his: fix the first-frame lag)
function findScroller(from) {
    for (let n = from && from.parentElement; n && n !== document.body; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (n.scrollHeight > n.clientHeight + 1 && (cs.overflowY === 'auto' || cs.overflowY === 'scroll' || cs.maskImage !== 'none')) return n;
    }
    return null;
}
export function ProblemChip({ weapon, faulty, builds, onOpen, compact = false, tone = 'warn', prefer = 'down' }) {   // prefer (V48): 'up' opens above unless there is no room
    const [open, setOpen] = useState(false);
    const [pinned, setPinned] = useState(false);
    const hoverOff = useRef(null);
    const scRef = useRef(undefined);   // the scroller, read on the hover (findScroller)
    const [up, setUp] = useState(false);
    const [tx, setTx] = useState(60);
    const [fix, setFix] = useState(null);
    const [box, setBox] = useState(null);
    // 🔴 THE CARD'S POSITIONING STRATEGY BELONGS TO ITS SURROUNDINGS, NOT TO THE CHIP'S SIZE — 2026-09-17 20:51 EDT.
    // `compact` was doing two unrelated jobs: it shrank the CHIP, and it switched the CARD from `absolute` to a
    // viewport-pinned `fixed`. That conflation broke the moment the full chip was moved into the weapon header,
    // which is `position:sticky` inside `.b3-sd-rows` — an `overflow:auto` scroller, now masked as well. Measured:
    // a 117px card inside a 94px scroller, `clippedVertically: true`, which is the exact configuration this file's
    // own `place()` comment warns about after three earlier failures. The strategy is DETECTED now.
    const [pinToViewport, setPinToViewport] = useState(compact);   // the card's own measured w/h — the border path is generated from it
    // 🔴 THE REAL REASON THE HIDE WAS ABRUPT, and it is not a missing exit animation: the card was CONDITIONALLY
    // RENDERED, so on close it left the DOM in the same frame and there was nothing left to transition. `open` is
    // the mount and `shown` is the state; closing drops `shown` first and unmounts one transition later.
    const [shown, setShown] = useState(false);   // the card's own measured w/h — the border path is generated from it
    // 🔴 THE NOTE ABOVE DESCRIBED THIS AND THE CODE NEVER DID IT (2026-09-18 10:23 EDT): the card rendered on `open`, so it left the DOM in
    // the frame it closed — measured, present before the × and gone one frame after. `mounted` holds it for its exit.
    const [mounted, setMounted] = useState(false);
    const wrap = useRef(null);
    const total = faulty.reduce((a, x) => a + faultsFor(x.b).length, 0);
    // 🟢 THE SAME CARD FOR A BUILD THAT PASSES (2026-09-19 09:27 EDT). His ask: the list's image mark becomes "something that implies
    // everything is good", its hover "a --ok themed container that states what's okay and good with the build", and a build
    // with a problem shows the triangle instead — "there's only ever 1 mark". One component with two tones rather than a
    // third popover, so both marks open, point, flip, pin and hide identically; only the hue and the lines differ.
    const ok = tone === 'ok';
    const [cut, setCut] = useState(false);
    const cutMe = useRef(null);
    cutMe.current = () => { setCut(true); setPinned(false); setOpen(false); };
    cutMe.soft = () => { clearTimeout(hoverOff.current); setPinned(false); setOpen(false); };   // the handoff: leave with the fade, no close wait
    cutMe.held = pinned;
    useEffect(() => { if (!open) return undefined; takePop(cutMe); return () => dropPop(cutMe); }, [open]);

    useEffect(() => {
        if (open) { setCut(false); setMounted(true); const r = requestAnimationFrame(() => setShown(true)); return () => cancelAnimationFrame(r); }
        setShown(false);
        const t = setTimeout(() => { setMounted(false); setFix(null); setCut(false); }, POPT[1].removed);
        return () => clearTimeout(t);
    }, [open]);

    useLayoutEffect(() => {
        if (!open || !wrap.current) return undefined;
        // ⚠️ DETECTED FROM THE CHIP, NOT FROM THE CARD, and that is the whole of why the first attempt failed.
        // `place()` returns early until the card has painted — this file's own comment records that as the root
        // cause of two earlier "fixes" that refined a placement which was never running. A decision made inside
        // that guard is therefore made too late: measured at 2026-09-17 20:52 EDT, the card came out `position:fixed`
        // with no `fix` set, so its base rule's `top:100%` resolved against the VIEWPORT and put it at y=777 in a
        // 768px window. The chip's ancestors are in the DOM before anything is hovered, so ask them.
        // read once per open: this effect runs twice (open, then mounted), and the second read cost 29ms of the first frames (profiled)
        const scroller = scRef.current !== undefined ? scRef.current : (scRef.current = findScroller(wrap.current));
        const pin = compact || !!scroller;
        setPinToViewport(pin);
        const place = () => {
            const chip = wrap.current && wrap.current.querySelector('.b3-fchip');
            const card = wrap.current && wrap.current.querySelector('.b3-pc');
            if (!chip || !card) return;
            const r = chip.getBoundingClientRect();
            // A chip scrolled out of its own scroller takes its card with it, rather than leaving a pinned card
            // hanging over rows it no longer belongs to (2026-09-18 20:02 EDT).
            if (scroller) {
                const sr = scroller.getBoundingClientRect();
                if (r.bottom < sr.top || r.top > sr.bottom) { setOpen(false); setPinned(false); return; }
            }
            // ⚠️ THE CARD'S NATURAL HEIGHT, NOT ITS BOX (2026-09-17 22:30 EDT). The second pass of `place()` runs the frame after the card
            // turns `position:fixed` and before its measured `top` is applied, so it sits below the viewport and its box
            // measured 10px — padding only. That pass then decided "no room needed above", overwrote the first pass's
            // correct answer, and a card opened near the bottom of the screen hung off it instead of flipping upward.
            const h = Math.max(card.offsetHeight, card.scrollHeight);
            setBox({ w: Math.round(card.offsetWidth), h: Math.round(h) });
            // V48 (his: "the all pass-mark and the image mark should default to openning upwards unless constrained by the scroll/page position"): Compare asks for up
            const above = prefer === 'up' ? r.top - h - 28 > 64 : r.bottom + h + 28 > window.innerHeight && r.top - h - 28 > 64;
            setUp(above);
            setTx(Math.round(r.width / 2));
            // IN THE LIST THE CARD IS CLIPPED. `.b3-sd-rows` is an `overflow:auto` scroller, so an absolutely
            // positioned card inside it is cut off and scrolls away from its own chip -- which is the "problem mark
            // in the list is bugged... look where it showed up" of 2026-09-16 15:53 EDT. A compact chip pins its card to
            // the VIEWPORT instead, measured off the chip, so nothing can clip it.
            // ⚠️ THIS SET `left` TO THE CHIP'S CENTRE, and the card is 368px wide with `right:0` in its base rule —
            // over-constrained, so `right` was dropped and the card hung 368px to the RIGHT of the chip, off the
            // screen. That is the "look where it's showing up" note: the earlier fix moved the card out of the
            // scroller correctly and then placed it wrongly, so from the outside the bug looked untouched.
            // The card's RIGHT edge tracks the chip now, clamped into the viewport, and --tx is re-measured from that
            // right edge so the hazard plume still lands on the chip after the clamp has moved the card.
            // ⚠️ REPRODUCED AND STILL WRONG, 2026-09-16 18:28 EDT — I reported this fix unverified and it was
            // half a fix twice over. The clamp was HORIZONTAL only, so with the chip off-screen the card was placed
            // at top -5472: correct x, 5,472px above the viewport. A `position:fixed` card must be clamped on BOTH
            // axes or it is only ever accidentally visible. Measured by selecting a build that actually carries a
            // fault — the manifest's chips sit on the weapon HEADER, so selecting any row at random never renders one
            // in the list, which is why "cannot reproduce" was itself the bug in my check.
            if (pin) {
                const W = 368, M = 12;
                const H = h || 160;
                // The card's RIGHT edge lines up with the chip's right edge, so the card sits over the chip and the pointer
                // lands on the chip's centre — his reference. It used to end 24px past the chip's CENTRE, which hung the
                // card half a chip to the left with the pointer near the chip's left end (2026-09-17 22:42 EDT).
                // 🔴 THE POINTER COULD NOT REACH A SMALL MARK (2026-09-19 09:48 EDT): "the pop-up container isn't even pointed at the mark". The
                // card's right edge sat on the chip's right edge, and the arc can come no nearer a corner than its radius plus its span
                // (44px) — so over a 22px mark it stopped ~30px short. The edge now sits at least 44px past the chip's centre, which
                // is where the arc can land on it; a wide chip keeps its own right edge. --tx and --reach follow, so the strip's fade does.
                const want = Math.max(r.right, r.left + r.width / 2 + PC_R + PC_SPAN + 4);
                const left = Math.round(Math.min(Math.max(M, want - W), window.innerWidth - W - M));
                const rawTop = above ? r.top - 6 - H : r.bottom + 6;
                const top = Math.round(Math.min(Math.max(M, rawTop), window.innerHeight - H - M));
                setTx(Math.round(Math.max(18, Math.min(W - 18, left + W - (r.left + r.width / 2)))));
                setFix({ left, top, above: false });
            }
        };
        // 🔴 THE ACTUAL ROOT CAUSE, found by reproducing rather than reasoning (2026-09-16 18:29 EDT).
        // `place()` bails on `if (!chip || !card) return` — and on the FIRST open the card has not been painted yet,
        // so it bails every time and `fix` is never set at all. The compact card then falls back to its base rule's
        // `top: 100%` while `position: fixed`, which resolves against the viewport and throws it thousands of pixels
        // off screen. Two "fixes" before this one refined a placement that was never running.
        place();
        const raf = requestAnimationFrame(() => place());
        // 🔴 EVERY SCROLLER, NOT ONLY <main> (2026-09-18 20:02 EDT). "your scrolling fix seems to have messed up the problem container
        // pop-up's anchoring to the button. it doesn't move attached to the button anymore." A pinned card is
        // `position:fixed`, so it only follows its chip when `place()` runs on scroll — and it listened to <main> alone.
        // The manifest is its own `.panel` scroller; once the wheel over the attachment tags started reaching that panel
        // (3-E v2), the panel moved and the card did not. A capturing listener on the document hears a scroll from any
        // element, and one frame of rAF keeps it to a single placement per painted frame.
        let queued = 0;
        const onScroll = () => { if (!queued) queued = requestAnimationFrame(() => { queued = 0; place(); }); };
        const onDoc = (e) => { if (wrap.current && !wrap.current.contains(e.target)) { setOpen(false); setPinned(false); } }; // unpinned too: closed by an outside click, the next hover opened it pinned with its × (Harkirat 2026-10-06 21:32 EDT)
        const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); setPinned(false); const c = wrap.current && wrap.current.querySelector('.b3-fchip'); if (c) c.focus(); } };
        document.addEventListener('scroll', onScroll, { passive: true, capture: true });
        window.addEventListener('resize', place);
        document.addEventListener('pointerdown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            cancelAnimationFrame(raf);
            cancelAnimationFrame(queued);
            document.removeEventListener('scroll', onScroll, { capture: true });
            window.removeEventListener('resize', place);
            document.removeEventListener('pointerdown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    // 🔴 [open, mounted], NOT [open] (2026-09-18 20:14 EDT): "when it opens, it opens based on wherever the button's position was
    // before, then snaps onto it after scrolling." The card mounts one render AFTER `open` flips, so on the [open] run
    // `place()` found no card and bailed, its rAF retry could still land before the mount, and the card painted at the
    // PREVIOUS open's `fix` until a scroll event called `place()` again. Re-running when the card mounts places it
    // before its first paint; `fix` is also cleared on close, and a pinned card with no `fix` is hidden, so a stale
    // position can never be painted.
    }, [open, mounted]);

    return html`
        <span class=${'wg-fwrap b3-fx' + (compact ? ' b3-fx-sm' : '') + (ok ? ' b3-okx' : '')} ref=${wrap} onClick=${(e) => e.stopPropagation()}
              onMouseEnter=${() => { clearTimeout(hoverOff.current); if (popHeld(cutMe)) return; if (open || popWarm(cutMe)) { setOpen(true); return; } scRef.current = findScroller(wrap.current); hoverOff.current = setTimeout(() => setOpen(true), POPT[1].openWait); }}
              onMouseLeave=${() => { clearTimeout(hoverOff.current); if (!pinned && open) hoverOff.current = setTimeout(() => setOpen(false), POPT[1].closeWait); }}>
            <button type="button" class="b3-fchip" aria-expanded=${open ? 'true' : 'false'} aria-haspopup="dialog"
                    aria-label=${ok ? `${weapon} build ${faulty[0] ? faulty[0].n : ''} passes every check — open the card` : compact ? `${total} problem${total === 1 ? '' : 's'} — open the card` : null}
                    onClick=${() => { if (pinned) { setPinned(false); setOpen(false); } else { setPinned(true); setOpen(true); } }}>
                ${''/* 2026-09-19 09:48 EDT: a shield, not a circled tick — his words: a circled checkmark implied "item selected". */}
                <${Icon} name=${ok ? 'shield-check' : 'triangle-alert'} />${ok ? null : compact ? html`<b>${total}</b>` : html`<b>${faulty.length > 2 ? `${faulty.length} builds` : buildsWord(faulty.map((x) => x.n))}</b><i aria-hidden="true"></i>${total} problem${total === 1 ? '' : 's'}`}
            </button>
            ${mounted ? html`
                <div class=${'b3-pc pop-s1' + (ok ? ' ok' : '') + (cut ? ' cut' : '') + (shown ? ' in' : '') + (pinned ? ' pinned' : '') + (pinToViewport ? ' b3-pc-fixed' : '')} data-up=${up ? 'true' : 'false'} role="dialog"
                     aria-label=${ok ? `What is good about ${weapon}` : `Problems with ${weapon}`}
                     ${''/* ⚠️ THIS WAS GATED ON THE OLD FLAG AND THAT IS WHY TWO ATTEMPTS AT THIS LOOKED IDENTICAL —
                         2026-09-17 20:53 EDT. The class switched to `b3-pc-fixed` and `place()` computed the placement
                         correctly, and then the STYLE that applies it still tested `compact`, so a `position:fixed`
                         card fell back to its base rule's `top:100%` — which resolves against the VIEWPORT and put
                         it at y=777 in a 768px window, twice, measured. THREE places decide this card's position —
                         the class, the placement branch and this style — and all three must read the same flag. */}
                     ${''/* ⚠️ AND IT CLEARS THE OTHER EDGE (2026-09-17 22:31 EDT). An upward card carries `[data-up=true]`, whose rule sets
                         `bottom:calc(100% + 9px)` for the absolute case. Pinned, that resolved against the VIEWPORT while this style
                         set `top` — both edges at once, so the card's box collapsed to its 10px padding: the hazard strip, placed
                         from the bottom, landed ABOVE the card, and the hit area was a 10px sliver. */}
                     style=${pinToViewport && fix ? `--tx:${tx}px;--reach:${((box && box.w) || 368) - tx - 24}px;left:${fix.left}px;${fix.above ? 'bottom' : 'top'}:${fix.above ? window.innerHeight - fix.top : fix.top}px;${fix.above ? 'top' : 'bottom'}:auto` : `${pinToViewport ? 'visibility:hidden;' : ''}--tx:${tx}px;--reach:${((box && box.w) || 368) - tx - 24}px`}>
                    ${''/* The pointer is its OWN element, not a pseudo on the card. Under P3 option B — the one he
                         starred — `html[data-b3-p3=b] .b3-pc::before` is a hatch spine and `::after` is display:none,
                         both later and more specific than the pointer's rules, so a pointer built on those pseudos
                         simply does not exist in the option he picked. I shot it under option A and called it done.
                         An element of its own cannot lose that argument. (2026-09-17 10:28 EDT) */}
                    ${''/* THE OUTLINE. One path: the card's fill, its ring, and the pointer, with nothing to seam.
                         `--tx` is measured from the card's RIGHT edge by `place()`, so the bulge keeps tracking the
                         chip after the clamp has moved the card. */}
                    ${''/* 🔴 DRAWN ONLY ONCE THE CARD HAS BEEN MEASURED (2026-09-17 22:17 EDT). It used to draw a 368×160 placeholder
                         first; `place()` then read `offsetHeight`, which forced a style pass with that shape, so the `d`
                         transition ran from the placeholder to the real 117px card — for ~0.6s every open card wore a
                         second, taller outline 12px above its own body. Sampled frame by frame: path 129px against a
                         110px card at 400ms. Only the pointer is meant to move. */}
                    ${box ? html`<svg class="b3-pc-edge" aria-hidden="true" viewBox=${`0 0 ${box.w} ${box.h}`} width=${box.w} height=${box.h}>
                        <path class="glow" style=${`d:path("${pcPath({ w: box.w, h: box.h, tx: box.w - tx, up, open: shown })}")`} />
                        <path style=${`d:path("${pcPath({ w: box.w, h: box.h, tx: box.w - tx, up, open: shown })}")`} />
                    </svg>` : null}${box ? html`<svg class="b3-pc-edge b3-pc-line" aria-hidden="true" viewBox=${`0 0 ${box.w} ${box.h}`} width=${box.w} height=${box.h}><path style=${`d:path("${pcPath({ w: box.w, h: box.h, tx: box.w - tx, up, open: shown })}")`} /></svg>` : null}
                    ${''/* 🔴 THE HAZARD STRIP IS BACK ON THE CONTAINER TOP, AND MY OWN NOTE SAID NOT TO PUT IT THERE.
                         `board.css` carries "Do not reintroduce a hatch on this card: the hatch is this board's mark
                         for DANGER and the card is the thing that EXPLAINS the danger." He asked for it anyway —
                         "the hazard strip is missing from the container top" — and he is the one deciding. Recorded
                         as a reversal rather than quietly done, because this is the second time a note of mine has
                         closed something he had not closed. It plumes from the pointer and thins away from it. */}
                    ${ok ? null : html`<i class="b3-pc-tape" aria-hidden="true"></i>`}
                    ${faulty.map(({ b, n }, i) => html`
                        <section class="b3-pc-b" key=${b.id || b._id}>
                            <header class="b3-pc-h">
                                <span class="b3-pc-w"><small>${ok ? `${weapon} · passes every check` : weapon}</small><b>Build ${n}</b></span>
                                <button type="button" class="b3-pc-open" onClick=${() => { setOpen(false); onOpen(b); }}>Open build<${Icon} name="arrow-up-right" /></button>
                                ${''/* The close button lives IN the header, not as an absolutely-positioned sibling of it.
                                     As a sibling it was invisible: `.b3-pc-h` is position:relative and comes after it in
                                     the DOM, so at the same stacking level the header simply painted over it (2026-09-16 16:18 EDT). */}
                                ${pinned && i === 0 ? html`<button type="button" class="b3-pc-x" aria-label="Close" onClick=${() => { setPinned(false); setOpen(false); }}><${Icon} name="x" /></button>` : null}
                            </header>
                            <ul class="b3-pc-l">
                                ${ok ? passLines(b).map(([k, icon, word]) => html`
                                    <li key=${k}><i class="b3-pc-ic"><${Icon} name=${icon} /></i><span class="b3-pc-t">${word}</span><span></span></li>`) : faultsFor(b).map((f) => { const l = faultLine(f, b, builds); return html`
                                    <li key=${f}><i class="b3-pc-ic"><${Icon} name=${l.icon} /></i><span class="b3-pc-t"><span>${l.text}</span><${FaultHint} k=${f} b=${b} builds=${builds} /></span><span></span></li>`; })}
                            </ul>
                        </section>`)}
                </div>` : null}
        </span>`;
}

// ── P1 · badges with a hierarchy: Meta · Tier · Tag ──────────────────────────────────────────────────────────
// each mode's mark — his own SVGs since 2026-09-25 23:53 EDT (ui/icons.js, m-*); HP is Hardpoint, FTL is Frontline
export const MODE_ICON = { HP: 'm-hp', 'S&D': 'm-snd', DOM: 'm-dom', TDM: 'm-tdm', FTL: 'm-ftl', Control: 'm-ctrl' };
export const TIER_OF_DMZ = (r) => (!r ? null : r.startsWith('best') ? 'best' : r.startsWith('top3') ? 'top3' : r.startsWith('capable') ? 'capable' : 'top5');
// 2026-09-28 14:09 EDT (his C3 round, class Z: "make variant of each badge chip where it's just the animation/plate/colors/icon/etc, no text"): `bare` keeps every
// layer of a badge — its plate, its material and motion, its colours, its mark — and drops only the word, which moves to the tooltip and the accessible
// name. Nothing about the motion changes (docs/reference/badge-motion.md: the parts never move; only the material crosses the plate).
// his 11:48 EDT ("make the badge pop reveal based on the position of the badge/required room needed by the pop"): on hover, the pop measures its full badge
// against the room the badge has to its right and to its left inside its column (and inside the run's visible box when the run scrolls), and opens toward
// the side that holds it; the badges on that side step back. Right when both hold it, so a left badge still reads left to right.
function badgeDir(e) {
    const w = e.currentTarget; const pb = w.querySelector('.b3-bpop .b3-bdg'); if (!pb) return;
    // a badge half under the run's fade is brought fully into the run first (its pop would otherwise open from a clipped badge)
    const sc0 = w.closest('.b3-fadx.over'); if (sc0) { const q = sc0.getBoundingClientRect(), r0 = w.getBoundingClientRect(); if (r0.right > q.right) sc0.scrollLeft += Math.ceil(r0.right - q.right); else if (r0.left < q.left) sc0.scrollLeft -= Math.ceil(q.left - r0.left); }
    const full = pb.scrollWidth; const r = w.getBoundingClientRect();
    const col = (w.closest('th, .wg-h, .b3-sd-r') || w.parentElement).getBoundingClientRect(); let L = col.left + 6, R = col.right - 6;
    const sc = w.closest('.b3-fadx.over'); if (sc) { const q = sc.getBoundingClientRect(); L = Math.max(L, q.left); R = Math.min(R, q.right); }
    // his 14:32 EDT ("control's badge is clipping on the right side"): the column and the run were the only bounds read; any ancestor that clips (a scroller,
    // a mask, the panel) bounds the pop too.
    for (let n = w.parentElement; n && n !== document.body; n = n.parentElement) { const s = getComputedStyle(n); if (s.overflowX !== 'visible' || s.maskImage !== 'none' || s.clipPath !== 'none') { const q = n.getBoundingClientRect(); L = Math.max(L, q.left + 2); R = Math.min(R, q.right - 2); } }
    const toR = R - r.left, toL = r.right - L;
    w.dataset.dir = full <= toR ? 'r' : full <= toL ? 'l' : (toL > toR ? 'l' : 'r');
}
export function B3Badges({ b, bare = false }) {
    const p1 = useB3('p1');
    const tier = b.mode === 'DMZ' ? TIER_OF_DMZ(b.dmzRangeRank) : b.categoryRank;
    const wrap = useRef(null);
    const [seen, setSeen] = useState(false);
    // \U0001F534 THE MOTION PLAYED BEFORE HE COULD SEE IT. This board mounts every surface at once, so an animation
    // declared on mount finishes while the manifest is still four thousand pixels below the fold \u2014 which is how
    // "the badges aren't animated" gets said three times about badges that carry a live animation-name. It fires on
    // ARRIVAL now, once, and again whenever the badge option changes, because comparing the options is the moment he
    // is actually looking at them. (2026-09-16 21:16 EDT)
    useEffect(() => { setSeen(false); }, [p1]);
    useEffect(() => {
        const el = wrap.current;
        if (!el) return undefined;
        if (typeof IntersectionObserver !== 'function') { setSeen(true); return undefined; }
        // "the animation only happens on page load. it should play on a loop as long as the element is visible on the
        // screen." The flag TRACKS visibility now instead of latching on first sight, so the loop runs while the badge
        // is on screen and stops the moment it leaves — the one thing a loop in a data table must do.
        const io = new IntersectionObserver((es) => { es.forEach((e) => setSeen(e.isIntersecting)); }, { threshold: 0.4 });
        io.observe(el);
        return () => io.disconnect();
    }, [p1]);
    // 🔴 HIS FIRST COMPLAINT, AND IT IS THE DEEPEST OF THE SIX — 2026-09-17 11:46 EDT. "currently they all play the animation at
    // the exact same time... that's just odd feeling." Two causes: every group starts when its own
    // IntersectionObserver fires and rows arrive together, and all four shared one 5.2s period, so even a nudge
    // re-converged. Four badges beating in lockstep tell the eye they are ONE system with one heartbeat — which
    // contradicts the whole rule below, that they are four different KINDS of claim. A shared pulse makes them four
    // skins on one animation however different the gradients are. So the phase is a stable fraction derived from the
    // build's own id — same badge, same offset, every render — and the four periods are deliberately unequal.
    const ph = ((String(b._id || b.id || '').split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7)) / 9973).toFixed(3);
    // 2026-09-29 13:23 EDT (his V40 class M: "the badges need hover states that pop-up the full badge when hovering over the compact variant"): the badges are made by one
    // function, twice when bare — the compact run, and the full badge each one opens into on hover (in place, over it: the run scrolls sideways, so
    // anything outside its box would be cut). The word left the tooltip for the pop-up, so a hover shows it once.
    const make = (bare) => {
        const groups = [];
        // 🔴 ONE <use>, AND THE WORD IS PLAIN TEXT AGAIN — 2026-09-17 12:41 EDT. The second <use> carried a dash chasing the
        // bolt's outline and the <b> carried a gradient sweeping the word; both were rejected animations, and leaving
        // their markup behind is how a badge ends up with three dead layers nobody dares delete. META's discharge
        // needs neither: it is one pseudo-element on the badge, masked by an authored cel (see b3/build-volt.cjs).
        // META's discharge is HIS `Lightning VFX.svg`, clipped into the frame — `b3/volt.js` holds the whole model and
        // the four facts it is built on. The variant comes off the same `--ph` hash the other badges use, so a build
        // keeps its loop length across every render and neighbouring rows never beat together.
        const say = (w) => (bare ? { role: 'img', 'aria-label': w, 'aria-description': w } : {});
        if (b.isMeta) groups.push(html`<span class="b3-bdg" data-k="meta" key="m" ...${say('Meta')}>
            <svg class="ic b3-zap" aria-hidden="true"><use href="#i-zap" /></svg>${bare ? null : 'META'}
            <span class="b3-volt" ref=${(el) => (seen ? mountVolt(el, Math.floor(+ph * 3)) : unmountVolt(el))} /><span class="b3-vl" aria-hidden="true" /></span>`);
        if (tier) {
            groups.push(html`
                <span class="b3-bdg" data-k="tier" data-t=${tier} key="t" ...${bare ? { role: 'img', 'aria-description': tier === 'best' ? `Best ${b.mode === 'DMZ' ? String(b.dmzRangeRank).replace(/^best-?/, '').replace('midlong', 'mid–long') : catLabel(b.category)}` : tier === 'capable' ? 'Capable' : `Top ${tier.slice(3)}` } : {}} aria-label=${tier === 'best' ? `Best in ${catLabel(b.category)}` : tier === 'capable' ? `Capable in ${catLabel(b.category)}` : `Top ${tier.slice(3)} in ${catLabel(b.category)}`}>
                    <${Icon} name=${tier === 'best' ? 'crown' : tier === 'capable' ? 'thumbs-up' : 'award'} />
                    ${bare ? null : tier === 'best' ? html`BEST<em>${b.mode === 'DMZ' ? String(b.dmzRangeRank).replace(/^best-?/, '').replace('midlong', 'MID–LONG').toUpperCase() : catLabel(b.category).toUpperCase()}</em>`
                        : tier === 'capable' ? 'CAPABLE' : html`TOP ${tier.slice(3)}`}
                    ${tier !== 'best' ? html`<i class="b3-rim" aria-hidden="true"><i></i></i>` : null}
                </span>`);
        }
        if (b.isToxic) groups.push(html`<span class="b3-bdg" data-k="toxic" key="x" ...${say('Toxic')}><${Icon} name="skull" />${bare ? null : 'TOXIC'}<i class="b3-tox" aria-hidden="true"><i></i><i></i><i></i></i></span>`);
        // v19 (his item 9): ASS, the third grade. Its motion is a board fork (html[data-b3-ass], classes.css) until he picks one of the three.
        if (b.isAss) groups.push(html`<span class="b3-bdg" data-k="ass" key="a" ...${say('Ass')}><${Icon} name="poop" />${bare ? null : 'ASS'}<i class="b3-ass" aria-hidden="true"><i></i><i></i><i></i></i></span>`);
        // 2026-09-25 23:19 EDT (his 23:12 EDT, the Modes family): MODES, the third family — one white plate for all six, only the mark differs. Each chip takes its own place in the loop (--mi) so six
        // on one build never hum in step (his first complaint about these badges, 2026-09-17). A family chip sits 4px further from the one before it.
        modesOf(b).forEach((m, i) => groups.push(html`<span class="b3-bdg" data-k="mode" data-m=${m} key=${`md-${m}`} style=${`--mi:${i}`} aria-label=${`Rank mode ${m}`} ...${bare ? { role: 'img', 'aria-description': `Rank mode · ${m}` } : {}}><i class="b3-mdi" aria-hidden="true"><${Icon} name=${MODE_ICON[m]} /></i>${bare ? null : html`<span class="b3-mdw">${m}</span>`}</span>`));
        return groups;
    };
    const groups = make(bare);
    const fulls = bare ? make(false) : null;
    if (!groups.length) return null;
    // v19 (his item 5): no dot between badges. Each badge is its own coloured object, so the gap separates them; a run that meets its box's
    // edge wraps whole badges onto a second line (item 6), never a dot left hanging at a line's end.
    return html`<span class=${'b3-bdgs' + (seen ? ' in' : '') + (bare ? ' bare' : '')} ref=${wrap} style=${`--ph:${ph}`}>${bare ? groups.map((g, i) => html`<span class="b3-bw" key=${i} onMouseEnter=${badgeDir}>${g}<span class="b3-bpop b3-bdgs in" aria-hidden="true">${fulls[i]}</span></span>`) : groups}</span>`;
}

// ── P4 · select all, in the column head ─────────────────────────────────────────────────────────────────────
export function SelectAllBox({ ids, selected, setMany }) {
    const n = ids.filter((id) => selected.has(id)).length;
    const all = ids.length > 0 && n === ids.length;
    const some = n > 0 && !all;
    // Mixed CLEARS the shown builds (thread 2aed701d) — it used to select all while its own hint said "Click to clear".
    const act = () => setMany(ids, n === 0);
    const say = all ? `Clear all ${ids.length}` : some ? `Clear ${n} of ${ids.length}` : `Select all ${ids.length}`;
    return html`
        <${Hint} side="top-start" title=${say}>
            <span class="wg-cb b3-allcb" role="checkbox" tabIndex="0" aria-checked=${all ? 'true' : some ? 'mixed' : 'false'}
                  aria-label=${say}
                  onClick=${act} onKeyDown=${(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); act(); } }}>
                <span class=${'cb' + (all ? ' on' : '')}></span></span>
        <//>`;
}

// ── P5 · the selection bar: chips when collapsed, the list when opened, one object ──────────────────────────
// ── the selection bar's buttons as their own components (Harkirat 2026-10-06 21:32 EDT: "you didn't mention C1's selection list's various
// buttons"). SelectionDock draws these exact components and the C1 buttons container draws each alone; the markup is what it wrote inline.
export function ViewToggleButton({ label, icon, on, onPick }) {
    return html`<button type="button" class=${on ? 'on' : ''} aria-pressed=${on ? 'true' : 'false'} title=${label} onClick=${onPick}><${Icon} name=${icon} />${label}</button>`;
}
export function DeselectButton({ label, onDeselect }) {
    return html`<button type="button" class="b3-x" aria-label=${label} onClick=${onDeselect}><${Icon} name="x" /></button>`;
}
export function ChipDeselectButton({ label, onDeselect }) {
    return html`<button type="button" aria-label=${label} onClick=${onDeselect}><${Icon} name="x" /></button>`;
}
export function ListToggleButton({ open, onToggle }) {
    return html`<button type="button" class="b3-btn2 ghost b3-sd-tog" aria-expanded=${open ? 'true' : 'false'} onClick=${onToggle}><${Fold} open=${open} />${open ? 'Hide list' : 'List'}</button>`;
}
export function EditBuildsButton({ count, onEdit }) {
    return html`<button type="button" class="b3-btn2 b3-sd-edit" onClick=${onEdit}><${Icon} name="square-pen" />${count === 1 ? 'Edit build' : 'Edit builds'}</button>`;
}
export function ExportButton({ onExport }) {
    return html`<button type="button" class="b3-btn2 b3-sd-exp" onClick=${onExport}><${Icon} name="download" />Export</button>`;
}
export function StageDeletionButton({ onDelete }) {
    return html`<button type="button" class="b3-btn2 dang" aria-describedby="b3-del-hint" onClick=${onDelete}><${Icon} name="trash-2" />Stage deletion</button>`;
}
export function ClearButton({ onClear }) {
    return html`<button type="button" class="b3-btn2 quiet" onClick=${onClear}><${Icon} name="x" />Clear</button>`;
}
export function SelectionDock({ ids, rows, builds, onClear, onDeselect, onEdit, onExport, onDelete }) {
    const [open, setOpen] = useState(false);
    // c9604d47 — the list stays mounted for its exit, so "Hide list" folds instead of vanishing.
    const [closing, setClosing] = useState(false);
    const toggleList = () => { if (open) { setOpen(false); setClosing(true); setTimeout(() => setClosing(false), 240); } else { setClosing(false); setOpen(true); } };
    // 2026-09-21 19:21 EDT — BOARD 4: "refine the reveal/hide animation of the selection bar's list view, its so choppy. I want it as smooth
    // and refined as Export drawer's Pick builds export list." The list mounted on open and unmounted 240ms after a clip-path
    // exit, so every open re-laid-out the whole list in the frame it appeared. On Board 4 it stays mounted inside a grid track that
    // folds 0fr ↔ 1fr on the Export file's own curve (420ms cubic-bezier(.32,.72,0,1)), so only one property animates.
    const fold = typeof window !== 'undefined' && window.B4_COLLECTIVE;
    const bg = useB3('p5bg');
    const shape = useB3('p5list');
    const hintStyle = useB3('p5hint');
    const [note, setNote] = useState(false);
    const chosen = rows.filter((r) => ids.includes(r.id));
    const byWeapon = new Map();
    for (const r of chosen) {
        if (!byWeapon.has(r.weaponName)) byWeapon.set(r.weaponName, []);
        byWeapon.get(r.weaponName).push({ b: r, n: buildNumberOf(builds, r).n });
    }
    const groups = [...byWeapon.entries()].map(([name, list]) => ({ name, list: list.sort((x, y) => x.n - y.n), accent: list[0].b.accent || 'var(--ink3)', category: list[0].b.category }))
        .sort((x, y) => x.name.localeCompare(y.name, undefined, { numeric: true, sensitivity: 'base' }));
    const MAX = groups.length > 3 ? 2 : 3;
    // Every weapon gets a chip, 2026-09-16 12:42 EDT: "if there's still a lot more, then that 2 line list would continue
    // towards the right, into the fade. But i need it to be movable/scrollable, so i can actually see the full list."
    // A "+8 weapons" button is the opposite of that -- it HIDES the eight he asked to be able to reach.
    const shown = groups;
    const rest = 0;
    const count = chosen.length;
    // A column that holds the same value on every row carries no information, so the mode only appears when the
    // selection actually spans more than one. See the note on the name cell below.
    const mixedModes = new Set(chosen.map((x) => x.b && x.b.mode).filter(Boolean)).size > 1;
    // The grouped list is ONE grid now (rows are subgrids), so a row may not drop a cell: the name column exists for every row or none.
    const namedG = mixedModes || chosen.some((x) => displayBuildLabel(x.b || x));
    // The triangle's track is reserved only when some listed build has a problem; with none it cost ~32px between code and image.
    const anyWarn = chosen.some((x) => faultsFor(x.b || x).length);
    // In a TABLE a column is present for every row or for none — unlike the card view, where each row decides. So the
    // Build column survives only if at least one selected build actually carries a name.
    const anyNamed = chosen.some((x) => displayBuildLabel(x.b));
    const m1 = groups[0] ? groups[0].accent : 'var(--staged)';
    const m2 = groups[1] ? groups[1].accent : 'var(--r-armory)';
    useEffect(() => {
        document.body.classList.add('has-selbar');
        return () => document.body.classList.remove('has-selbar');
    }, []);

    return html`
        <div class="selbar on b3-selbar" role="region" aria-label="Actions for the selected builds">
            <div class=${'b3-sd' + (open ? ' open' : '') + (bg === 'mesh' ? ' mesh' : '')} style=${`--m1:${m1};--m2:${m2}`}>
                ${fold || open || closing ? html`<div class=${fold ? 'b3-sd-fold' + (open ? ' open' : '') : 'b3-sd-nofold'} aria-hidden=${fold && !open ? 'true' : null} inert=${fold && !open ? true : null}>
                    <div class=${'b3-sd-list' + (!fold && closing && !open ? ' out' : '')}>
                        <div class="b3-sd-lh">
                            ${''/* The icon came back: I removed it while "refining" this line and he noticed. */}
                            <${Icon} name="list-checks" cls="b3-sd-lh-ic" />
                            ${''/* This line counted what the list below already shows, which is the definition of a caption you
                                 skip. It states the SCOPE of the action bar instead: what Export, Edit and Stage deletion are
                                 about to act on, which is the one thing here the reader cannot see. Treatment only — the
                                 board's other hint copy is Session 4's rewrite, not this session's. */}
                            <span class="b3-nw"><b>${count}</b><span>${count === 1 ? 'build' : 'builds'}</span></span>
                            ${''/* The view belongs WITH the list, not in a panel below it - his note, 2026-09-16 13:56 EDT:
                                 "add a toggle at the top right of the list container to toggle between the views." It writes the
                                 same p5list key the Decide panel reads, so switching here IS the pick. */}
                            ${''/* "why no outside label stating 'View'?" — the control was unlabelled, so you had to infer what
                                 it switched from the option names. */}
                            <span class="b3-sd-vl" aria-hidden="true">View</span>
                            <div class="b3-sd-vt" role="group" aria-label="List view">
                                ${[['grouped', 'By weapon', 'layers'], ['table', 'One table', 'table']].map(([v, label, icon]) => html`<${ViewToggleButton} key=${v} label=${label} icon=${icon} on=${shape === v} onPick=${() => setB3('p5list', v)} />`)}
                            </div>
                        </div>
                        <div class=${'b3-sd-rows' + (shape === 'table' ? ' b3-sd-tbl' : namedG ? ' named' : '') + (anyWarn ? ' warn' : '')} role="list">
                            ${shape === 'table' ? html`
                                ${''/* 2026-09-19 10:18 EDT: "reword … from \"# Weapon\" to a combined \"Weapon & Build\"", left-aligned with the build numeral; "Mark" becomes "Status". Seven cells still, so every column rule that counts them holds. */}
                                <div class="b3-sd-th" aria-hidden="true"><span>Weapon & Build</span><span></span><span>Build</span><span>Attachments</span><span>Code</span><span>Status</span><span></span></div>
                                ${groups.flatMap((g) => g.list.map(({ b, n }) => {
                                    const label = displayBuildLabel(b);
                                    const faults = faultsFor(b);
                                        // a code-length mismatch: the attachments past the code's last pair are the ones the code does not carry
                                        const pairs = faults.includes('code-length-mismatch') ? Math.floor(String(b.shareCode || '').length / 2) : Infinity;
                                    return html`
                                    <div class=${'b3-sd-tr' + (faults.includes('near-duplicate') ? ' dup' : '') + (faults.includes('code-length-mismatch') ? ' codeoff' : '') + (anyNamed ? '' : ' noname')} role="listitem" key=${b.id} style=${`--c:${g.accent}`}>
                                        <span class="b3-sd-n">${n}</span>
                                        ${''/* Same two findings as the card view, carried across so the two read as one system: the
                                             square accent chip goes (the row's own left edge carries the weapon colour), and the
                                             Build column only appears when the build has a name of its own — the numeral in the
                                             first column already says which build this is. */}
                                        <span class="b3-sd-w"><b>${g.name}</b><small>${catLabel(g.category)}</small></span>
                                        <span class="b3-sd-name">${label ? html`<b>${label}</b>` : null}</span>
                                        <span class="b3-sd-atts">${(b.attachments || []).map((a, i) => { const s = (b.attachmentSlots || [])[i]; return html`<span class=${'wg-at' + (i >= pairs ? ' nocode' : '')} key=${i} data-slot=${s || null} title=${i >= pairs ? `${s ? s + ' — ' : ''}not in the gunsmith code` : s || null} style=${`--sl:${slotVar(s)}`}><span class="wg-an">${a}</span></span>`; })}</span>
                                        <${CodeCell} b=${b} />
                                        <span class="b3-sd-flags">
                                            ${b.state === 'staged' ? html`<span class="b3-staged">staged</span>` : null}
                                            ${faults.length
                                                ? html`<${ProblemChip} weapon=${g.name} faulty=${[{ b, n }]} builds=${builds} onOpen=${() => {}} compact=${true} />`
                                                : html`<${ProblemChip} weapon=${g.name} faulty=${[{ b, n }]} builds=${builds} onOpen=${() => {}} compact=${true} tone="ok" />`}
                                        </span>
                                        <${DeselectButton} label=${`Deselect ${g.name} build ${n}`} onDeselect=${() => onDeselect([b.id])} />
                                    </div>`;
                                }))}` : groups.map((g) => html`
                                <div class="b3-sd-g" key=${g.name} style=${`--c:${g.accent}`}>
                                    <div class="b3-sd-gh">
                                        ${''/* The square accent chip went: the row already carried this weapon's colour on its left
                                             edge AND in the build numeral, so one fact was drawn three times. */}
                                        <span class="b3-nw"><b>${g.name}</b><small>${catLabel(g.category)}</small></span>
                                        ${''/* The range names the build rows underneath, so it sits WITH the name it qualifies, not across
                                             the bar — his thread 3300d186. The problem chip goes to the right, where the manifest's own
                                             weapon row carries it. */}
                                        <span class="b3-sd-gn">${buildsWord(g.list.map((x) => x.n))}</span>
                                        <${B3Badges} b=${g.list[0].b} />
                                        <span class="sp"></span>
                                        ${''/* 2026-09-19 10:03 EDT: the problem chip is gone from this header — his words: "remove the problem chip since the triangle mark serves
                                             the purpose." Each faulty build row carries the triangle, and its hover opens the same problem card. */}
                                        <${DeselectButton} label=${`Deselect every ${g.name} build`} onDeselect=${() => onDeselect(g.list.map((x) => x.b.id))} />
                                    </div>
                                    ${g.list.map(({ b, n }) => {
                                        const label = displayBuildLabel(b);
                                        const faults = faultsFor(b);
                                        // a code-length mismatch: the attachments past the code's last pair are the ones the code does not carry
                                        const pairs = faults.includes('code-length-mismatch') ? Math.floor(String(b.shareCode || '').length / 2) : Infinity;
                                        return html`
                                        <div class=${'b3-sd-r' + (faults.includes('near-duplicate') ? ' dup' : '') + (faults.includes('code-length-mismatch') ? ' codeoff' : '') + (namedG ? '' : ' noname')} role="listitem" key=${b.id}>
                                            <span class="b3-sd-n">${n}</span>
                                            ${''/* "why does the 'Build 1 MP' even exist? The build number is already stated and the 'MP' is
                                                 just useless." Both true: the numeral is already in the gutter four columns left, and
                                                 every row in a single-mode selection carries the same mode, so that column holds no
                                                 information. A constant column is not a column — the mode shows only when the selection
                                                 actually MIXES modes, and an unnamed build gives its width back to the attachments. */}
                                            ${namedG ? html`<span class="b3-sd-name">${label ? html`<b>${label}</b>${mixedModes ? html`<small>${b.mode}</small>` : null}` : mixedModes ? html`<b>${b.mode}</b>` : null}</span>` : null}
                                            <span class="b3-sd-atts">${(b.attachments || []).map((a, i) => { const s = (b.attachmentSlots || [])[i]; return html`<span class=${'wg-at' + (i >= pairs ? ' nocode' : '')} key=${i} data-slot=${s || null} title=${i >= pairs ? `${s ? s + ' — ' : ''}not in the gunsmith code` : s || null} style=${`--sl:${slotVar(s)}`}><span class="wg-an">${a}</span></span>`; })}</span>
                                            <${CodeCell} b=${b} />
                                            <span class="b3-sd-flags">
                                                ${b.state === 'staged' ? html`<span class="b3-staged">staged</span>` : null}
                                                ${''/* ONE MARK PER ROW (2026-09-19 09:27 EDT, his ask): the triangle when the build has a problem, a check when it passes.
                                                     Each opens its card on hover — the triangle the problem card, the check the --ok card of what passes. */}
                                                ${faults.length
                                                    ? html`<${ProblemChip} weapon=${g.name} faulty=${[{ b, n }]} builds=${builds} onOpen=${() => {}} compact=${true} />`
                                                    : html`<${ProblemChip} weapon=${g.name} faulty=${[{ b, n }]} builds=${builds} onOpen=${() => {}} compact=${true} tone="ok" />`}
                                            </span>
                                            <${DeselectButton} label=${`Deselect ${b.weaponName} build ${n}`} onDeselect=${() => onDeselect([b.id])} />
                                        </div>`; })}
                                </div>`)}
                        </div>
                    </div></div>` : null}
                <div class="b3-sd-bar">
                    <span class="b3-sd-count" aria-label=${`${count} selected`}>${count}</span>
                    <div class=${'b3-sd-chips' + (note ? ' noted' : '')}>
                        ${note ? html`<span class="b3-sd-note" role="note" aria-label="Staged now, committed on Review, removed only then — nothing is removed yet">
                            <span class="b3-steps" aria-hidden="true">
                                <span class="b3-step on"><em>Staged</em></span><i class="b3-step-a"></i><span class="b3-step next"><em>Review</em></span><i class="b3-step-a"></i><span class="b3-step end"><em>Removed</em></span>
                            </span>
                            <b aria-hidden="true"><${Icon} name="undo-2" />Nothing is removed yet</b>
                        </span>` : null}
                        ${(open ? [] : shown).map((g) => html`
                            <span class="b3-sc" key=${g.name} style=${`--c:${g.accent}`}>
                                <i aria-hidden="true"></i><span class="b3-nw">${g.name}<em>${buildsWord(g.list.map((x) => x.n))}</em></span>
                                <${ChipDeselectButton} label=${`Deselect ${g.name}`} onDeselect=${() => onDeselect(g.list.map((x) => x.b.id))} />
                            </span>`)}
                        ${open ? html`<span class="b3-sd-sum">${groups.map((g) => g.name).join(' · ')}</span>` : null}
                    </div>
                    <${ListToggleButton} open=${open} onToggle=${toggleList} />
                    <i class="b3-vr" aria-hidden="true"></i>
                    <div class="b3-sd-acts">
                        <${EditBuildsButton} count=${count} onEdit=${() => onEdit(ids)} />
                        <${ExportButton} onExport=${() => onExport(ids)} />
                        ${hintStyle === 'inline'
                            ? html`<button type="button" class="b3-btn2 dang" onClick=${() => onDelete(ids)}
                                           onMouseEnter=${() => setNote(true)} onMouseLeave=${() => setNote(false)}
                                           onFocus=${() => setNote(true)} onBlur=${() => setNote(false)}><${Icon} name="trash-2" />Stage deletion</button>`
                            : html`${''/* 2026-09-16 13:59 EDT: "the pop-up hint text for this button is just prose heavy that no one will read." Two
                                 sentences of reassurance is the useless-hint-text problem in a popover. The thing he needs to
                                 know is WHERE the change is and where it goes next, and that is three words and an arrow. */}
                            <${Hint} set=${1} title="Nothing is deleted yet" sub="Discard on Review and every build comes back."
                                     steps=${[['Staged', 'on', 'trash-2', 'now'], ['Review', 'next', 'eye', 'you commit'], ['Removed', 'end', 'x', 'only then']]} id="b3-del-hint" tone="del">
                                <${StageDeletionButton} onDelete=${() => onDelete(ids)} />
                            <//>`}
                        <${ClearButton} onClear=${onClear} />
                    </div>
                </div>
            </div>
        </div>`;
}
