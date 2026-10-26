/* The date↔pixel engine. Everything the Track does — drag, resize, zoom, pan, snap — resolves to a
 * real ISO date through here, so a dragged bar produces a date the backend could actually store. */
window.TL = (function () {
  const DAY = 86400000;
  const iso = d => new Date(d + 'T00:00:00Z');
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
