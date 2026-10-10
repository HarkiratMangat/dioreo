// portal/ui/timeline.logic.js — CLASSIC script + CommonJS. The date<->pixel engine, adopted from the interactive mockup's assets/timeline.js.
//
// Everything the Track does -- drag, resize, zoom, pan, snap -- resolves to a real ISO date through here, so a dragged bar produces a date the backend could actually store.
//
// WHY IT IS A .logic.js. Same contract as track.logic.js and season.logic.js: buildPortal emits a classic <script> for every *.logic.js BEFORE app.js, so its top-level declarations become globals an ESM module can read without an import; Node's require() reads the SAME file as CommonJS. That is the working resolution of "Node never loads ESM, the browser never loads CJS".
//
// 🔴 THIS FILE SPEAKS ISO STRINGS. Every function here takes and returns 'YYYY-MM-DD', never a Date. track.logic.js's editOpFor takes a DATE. That mismatch is a real seam and it fails SILENTLY: the Track spike's drag looked like it worked -- the ghost state applied and cleared -- and simply never committed, throwing `newEndDate.toISOString is not a function` only into the console. Convert explicitly at the boundary; never assume which vocabulary a value is in.

// `var` at classic-script top level becomes a real global the ESM modules read as a bare `TL`, exactly as track.logic.js's function declarations do. `window.TL = ...` was the mockup's form and it throws ReferenceError the moment Node requires this file, which is half its job.
var TL = (function () {

  const DAY = 86400000;
  // 🔴 NORMALISE BEFORE CONCATENATING, because the two data sources disagree about shape and only one of them was ever tested. This read `new Date(d + 'T00:00:00Z')`, which is correct for the bare `YYYY-MM-DD` the fixtures use and produces `2026-09-19T00:00:00.000ZT00:00:00Z` — an Invalid Date — for the full ISO datetime Mongo returns. Every arithmetic result downstream became NaN, and NaN renders: measured on the real server 2026-08-28, Season's Repairs told the reader an item "ends NaN days after the battle pass" beside a button offering to clamp it. The harness could never show this, because the harness is fixture-driven and agrees with the mockup — which is the whole argument for running the real server BEFORE the work rather than as a victory lap after it. A Date instance is accepted too; it arrives from the Track's own drag handler.
  const iso = (d) => new Date((d instanceof Date ? d.toISOString() : String(d)).slice(0, 10) + 'T00:00:00Z');
  const toISO = d => new Date(d).toISOString().slice(0, 10);
  const days = (a, b) => Math.round((iso(b) - iso(a)) / DAY);
  const addDays = (d, n) => toISO(iso(d).getTime() + n * DAY);
  const fmt = d => iso(d).toLocaleDateString('en-US', { month:'short', day:'numeric', timeZone:'UTC' });
  const fmtLong = d => iso(d).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', timeZone:'UTC' });

  /* A view is a window [from,to] over the timeline. pct() maps a date into it. */
  function make(from, to) {
    return {
      from, to,
      span(){ return Math.max(1, days(this.from, this.to)); },
      pct(d){ return (days(this.from, d) / this.span()) * 100; },
      /* width of a range, floored so a single-day item is still grabbable */
      wpct(a, b){ return Math.max(0.9, (Math.max(0, days(a, b)) / this.span()) * 100); },
      dateAt(p){ return addDays(this.from, Math.round((p / 100) * this.span())); },
      clamp(min, max){
        if (days(min, this.from) < 0) { const d = -days(min, this.from); this.from = addDays(this.from, d); this.to = addDays(this.to, d); }
        if (days(this.to, max) < 0)   { const d =  days(this.to, max);    this.from = addDays(this.from, d); this.to = addDays(this.to, d); }
        return this;
      }
    };
  }

  /* Tick marks whose spacing adapts to the zoom — the same axis, read closer. */
  /* `step` may be supplied by the caller, which is how the ruler keeps labels from
   * colliding: spacing that follows available PIXELS holds at any span, whereas the day
   * thresholds below cap out at 14 and crammed ~28 labels into a wide view. */
  function ticks(view, step) {
    const span = view.span();
    if (!step) step = span > 120 ? 14 : span > 60 ? 7 : span > 21 ? 3 : 1;
    const out = [];
    for (let i = 0; i <= span; i += step) {
      const d = addDays(view.from, i);
      out.push({ d, iso: toISO(d), x: view.pct(d), label: span <= 14 ? fmtLong(d).split(',')[0] : fmt(d) });
    }
    return out;
  }

  /* Drag helper: converts pointer movement into whole days and reports live. */
  function drag(el, { onMove, onEnd, pxPerDay }) {
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      const x0 = e.clientX;
      let last = 0;
      const move = ev => {
        const d = Math.round((ev.clientX - x0) / pxPerDay());
        if (d !== last) { last = d; onMove(d, ev); }
      };
      const up = ev => {
        el.releasePointerCapture(e.pointerId);
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        onEnd && onEnd(last, ev);
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
    });
  }

  return { DAY, days, addDays, toISO, fmt, fmtLong, make, ticks, drag };
})();

// Guarded, exactly as track.logic.js is: a classic script in a real browser has no `module` global, and an unguarded assignment throws ReferenceError mid-parse.
if (typeof window !== 'undefined') window.TL = TL;
if (typeof module !== 'undefined' && module.exports) module.exports = TL;
