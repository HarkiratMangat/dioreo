// Board 3 version 2 — BOARD ONLY. Which option each section shows, shared by the dock and every component that draws a proposal. A value is also stamped on <html> as data-b3-<key>, so a proposal that is pure CSS (radius, type, pills) needs no component to read it.
import { useEffect, useState } from '../vendor/preact-hooks.mjs';

// 🔴 `p5bg` DEFAULTS TO MESH — his thread bd09c832, 2026-09-17 18:59 EDT: "Mesh ground is the default; KEEP the solid
// styling in the files and document it as a future portal setting." Both halves matter: the default moves, and
// `html[data-b3-p5bg=solid]` stays in board.css rather than being deleted as a losing option, because he has
// asked for it as a SETTING later rather than as a rejection now. Filed in docs/db-deferred-list.md.
const KEY = 'pins2-board-3-redo';
export const DEFAULTS = {
    section: 'a1',
    a1: 'fixed', p1: 'a', p2pal: 'final', p2sty: 'neutralbg', p2lab: 'key', p3: 'a', p3tbl: 'bare', hzf: 'c', p4: 'b', p5: 'new', p5bg: 'mesh', p10: 'state', sdgh: '44',
    p5list: 'grouped', p5hint: 'card',
    p6: 'c', p6lay: 'sections', expl: 'tiles', xbg: 'ground', p6day: 'real', p7: 'new', p8: 'a', p9: 'b', g9: 'board1', exp: 'b', b1: 'fixed', b2: 'fixed', g8: 'board1',
    // Board 4 · v11 (2026-09-22): his options for the large redesigns, shown as forks on the published board (13:01 EDT).
    f2: 'a', f2b: 'a', bkv: 'a', f3: 'a', f3e: 'a', ass: 'a', dw: 'c',
    // The E design proposals are withdrawn (his note, 2026-09-15 22:10 EDT). 'now' matches no rule in board.css,
    // so every element falls back to the portal's own; only the pinned changes, which live under a1, still apply.
    // H1's spacing scale, exposed as the playground knobs he asked for on 2026-09-20 17:41 EDT. Every one
    // names a RELATIONSHIP rather than a pixel, and `stamp()` writes each as a --h1-* custom
    // property on :root, so one slider moves one thing everywhere it is used. Plain px numbers.
    // 18B: `h1Lab` USED TO BE THE LABEL BOX WIDTH (88) while its name promised a distance. Right-aligned
    // labels split it: `h1Labw` is the column, `h1Lab` is the real label-to-chips gap. The migration below
    // drops the stored 88 so it does not arrive as an 88px gap.
    // 🔴 THESE ARE HIS, NOT MINE - read back from the board's own store (`spacing/h1`, written 2026-09-20 23:57 EDT
    // from Save for Claude) rather than transcribed from chat. Eight moved: chips->right edge 18->22,
    // search width 956->340, search->filter rows 12->16, event row 56->44, day row 40->52, between
    // columns 16->22, WHO 150->100, UNDO 92->90. The other ten he left where they were, which is an
    // answer too. The lab still writes to the store; this is the value the board BOOTS at.
    h1L: 24, h1R: 24, h1Labw: 56, h1Lab: 16, h1Chip: 6, h1Row: 10, h1Col: 36,
    h1Top: 16, h1Head: 16, h1Srchh: 44, h1Srchw: 340,
    h1Rowh: 44, h1Rowp: 12, h1Cell: 24, h1Day: 52, h1Kind: 110, h1Who: 100, h1Undo: 90,
    e1: 'now', e2: 'now', e2spd: 'smooth', e3: 'now', e4: 'now', e5: 'now', e6: 'now',
};
let state = { ...DEFAULTS };
// A stored value outlives a changed default, which is how `xbg` stayed Flat on this machine after the default moved
// to Mesh (2026-09-20 11:20 EDT). MIGRATIONS drops the named keys ONCE per id, so a fork whose answer has been
// settled arrives settled, and every other pick he has made is untouched.
// ⚠️ The first version of this list forced `xbg` to Mesh — against a decision he had already recorded as Ground.
// A migration must never carry a value; it only DROPS a stale stored key so the default (which now agrees with the
// Decide panel, and is overwritten by it on load anyway) can win. New id so it runs once more and clears the Mesh.
const MIGRATIONS = [['2026-09-26-mode-marks', ['mds', 'mdv']], ['2026-09-24-ass-dw-picked', ['ass', 'dw']], ['2026-09-24-dw-three', ['dw']], ['2026-09-24-ass-ab', ['ass']], ['2026-09-24-f2-picked', ['f2']], ['2026-09-24-f2b-picked', ['f2b']], ['2026-09-20-xbg-ground', ['xbg']], ['2026-09-20-p9-timerail', ['p9']],
    ['2026-09-20-h1-lab-gap', ['h1Lab']],
    // His tuned values are the defaults now, so any browser still holding MY numbers must drop them -
    // a stored value outlives a changed default, which is the whole reason this list exists.
    ['2026-09-20-h1-his-spacing', ['h1R', 'h1Head', 'h1Srchw', 'h1Rowh', 'h1Day', 'h1Cell', 'h1Who', 'h1Undo']]];
try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    const done = JSON.parse(localStorage.getItem(KEY + ':mig') || '[]');
    let moved = false;
    for (const [id, keys] of MIGRATIONS) if (!done.includes(id)) { for (const k of keys) delete saved[k]; done.push(id); moved = true; }
    // ⚠️ DELETING THE KEY FROM THE PARSED COPY IS NOT DELETING IT. The first cut dropped `xbg` from `saved`, stamped
    // the marker and never wrote `saved` back — so the defaults won for exactly one page load and the stored 'flat'
    // came back on the next one, with the marker now saying the migration was done. Caught by looking at the switch.
    if (moved) localStorage.setItem(KEY, JSON.stringify(saved));
    localStorage.setItem(KEY + ':mig', JSON.stringify(done));
    Object.assign(state, saved);
} catch (e) { /* private window: the defaults stand */ }
const subs = new Set();

function stamp() {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(state)) {
        root.setAttribute(`data-b3-${k}`, String(v));
        // A numeric knob is ALSO a CSS custom property: h1Rowh -> --h1-rowh. A data attribute cannot
        // carry a length, so the stylesheet would need one rule per value; a property needs none.
        if (k.startsWith('h1') && typeof v === 'number') root.style.setProperty(`--${k.replace(/^h1/, 'h1-').toLowerCase()}`, `${v}px`);
    }
}
stamp();

// 🔴 A UTC DATE SLICE IS NOT TODAY - 2026-09-20 20:23 EDT. He screenshotted the export panel at
// 20:22 EDT and its filenames read `2026-09-21`: `new Date().toISOString()` is UTC, so from 20:00
// EDT onward every date this board RENDERS is tomorrow's. Eight sites board-side, thirty-six across
// the kit. A stored instant wants UTC; a date a person reads wants the day they are living in.
export const isoLocal = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export const b3 = (k) => state[k];
export const isNow = (k) => state[k] === 'now';
export function setB3(k, v) {
    state = { ...state, [k]: v };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* not persisted, still applied */ }
    stamp();
    subs.forEach((f) => f());
}
export function resetB3() { state = { ...DEFAULTS }; try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } stamp(); subs.forEach((f) => f()); }
export function useB3(k) {
    const [, tick] = useState(0);
    useEffect(() => { const f = () => tick((n) => n + 1); subs.add(f); return () => subs.delete(f); }, []);
    return state[k];
}

// Try-actions in the dock reach into a realm through these, registered by the realm while it is mounted.
export const hooks = {};
window.__b3 = { get: b3, set: setB3, hooks };
