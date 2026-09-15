// Board 3 version 2 — BOARD ONLY. Which option each section shows, shared by the dock and every component that draws a proposal. A value is also stamped on <html> as data-b3-<key>, so a proposal that is pure CSS (radius, type, pills) needs no component to read it.
import { useEffect, useState } from '../vendor/preact-hooks.mjs';

const KEY = 'pins2-board-3-v2';
export const DEFAULTS = {
    section: 'p3',
    p1: 'a', p2pal: 'named', p2sty: 'wash', p3: 'new', p4: 'a', p5: 'new', p5bg: 'solid',
    p6: 'new', p6day: 'real', p7: 'new', p8: 'new', p9: 'new', g9: 'new',
    e1: 'a', e2: 'a', e3: 'a', e4: 'a', e5: 'a', e6: 'a',
};
let state = { ...DEFAULTS };
try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* private window: the defaults stand */ }
const subs = new Set();

function stamp() {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(state)) root.setAttribute(`data-b3-${k}`, String(v));
}
stamp();

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
