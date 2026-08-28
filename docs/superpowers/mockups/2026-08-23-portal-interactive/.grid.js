/* ═══════════════════════════════════════════════════════════════════════════════════════
   ALIGNMENT + SIZE INSTRUMENT — every rendered element, not a whitelist.

     __grid()          draw the field
     __grid.off()
     __grid.near()     NEAR-MISS alignment: edges 1-4px apart that should be equal
     __grid.sizes()    siblings that should match in size and do not
     __grid.all()      both, plus the count of elements actually examined

   🔴 THE FIRST VERSION OF THIS FILE ENUMERATED A SELECTOR WHITELIST — .masthead, .panel,
   .ph, .mtable, .rail — i.e. PAGE FRAMES. It could not see anything inside a panel, it
   never looked at SIZE at all, and it only ever ran on each page's default view. It found
   one 1px masthead offset and that was reported as "a fine grid over every page". Harkirat
   had been silently watching a broken Compare view for several sessions that this could
   never have reached. The ask was EVERY ELEMENT, aligned AND sized.

   🔴 NEAR-MISS IS THE DEFECT CLASS. Two edges at the same x are fine. Two edges 200px apart
   are a layout. Two edges 3px apart are always a mistake — nobody intends 3px. So the
   instrument reports the 1-4px band and stays quiet about everything else.

   🔴 IT DRAWS INSIDE main, which is this portal's scroll container.
   ═══════════════════════════════════════════════════════════════════════════════════════ */
(function () {
  var UNIT = 8, HEAVY = 4, NEAR = 4;
  function main() { return document.querySelector('main'); }

  /* EVERY element that actually renders. No selector list — the whitelist is what failed. */
  function all() {
    var m = main(), mr = m.getBoundingClientRect(), out = [];
    [].forEach.call(m.querySelectorAll('*'), function (el) {
      if (el.closest('#__gridwrap')) return;
      var b = el.getBoundingClientRect();
      if (b.width < 4 || b.height < 4) return;
      var cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return;
      out.push({ el: el,
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.') || el.tagName.toLowerCase(),
        L: +(b.left - mr.left).toFixed(1), R: +(b.right - mr.left).toFixed(1),
        T: +(b.top - mr.top + m.scrollTop).toFixed(1), B: +(b.bottom - mr.top + m.scrollTop).toFixed(1),
        w: +b.width.toFixed(1), h: +b.height.toFixed(1),
        txt: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24) });
    });
    return out;
  }

  /* Two edges 1-4px apart, on elements that overlap vertically (so they are actually seen
     together). Exact matches and wide gaps are both silent. */
  function near() {
    var els = all(), hits = [], seen = {};
    for (var i = 0; i < els.length; i++) for (var j = i + 1; j < els.length; j++) {
      var a = els[i], b = els[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      if (Math.min(a.B, b.B) - Math.max(a.T, b.T) < 6) continue;   // never on screen together
      [['L','L'], ['R','R']].forEach(function (p) {
        var d = Math.abs(a[p[0]] - b[p[1]]);
        if (d >= 0.5 && d <= NEAR) {
          var k = a.cls + '|' + b.cls + '|' + p[0] + '|' + d.toFixed(1);
          if (seen[k]) return; seen[k] = 1;
          hits.push({ gap: +d.toFixed(1), edge: p[0],
            a: a.cls + ' ' + p[0] + '=' + a[p[0]] + ' "' + a.txt + '"',
            b: b.cls + ' ' + p[1] + '=' + b[p[1]] + ' "' + b.txt + '"' });
        }
      });
    }
    return hits.sort(function (x, y) { return x.gap - y.gap; });
  }

  /* Siblings of the same class should be the same size. A 1-6px difference between two
     things meant to be identical is the size half of the same defect. */
  function sizes() {
    var els = all(), byKey = {}, out = [];
    els.forEach(function (e) {
      var k = (e.el.parentElement ? (e.el.parentElement.className || 'root').toString().split(' ')[0] : 'root') + '>' + e.cls;
      (byKey[k] = byKey[k] || []).push(e);
    });
    Object.keys(byKey).forEach(function (k) {
      var g = byKey[k]; if (g.length < 2) return;
      ['w', 'h'].forEach(function (d) {
        var vals = g.map(function (x) { return x[d]; });
        var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
        if (mx - mn >= 0.5 && mx - mn <= 8) out.push({ group: k, dim: d, n: g.length,
          spread: +(mx - mn).toFixed(1), values: vals.slice(0, 6) });
      });
      // vertical pairing: two columns of the same thing that start at different tops
      var tops = {}; g.forEach(function (x) { tops[Math.round(x.T)] = 1; });
      var ts = Object.keys(tops).map(Number).sort(function (a, b) { return a - b; });
      for (var i = 1; i < ts.length; i++) if (ts[i] - ts[i-1] >= 1 && ts[i] - ts[i-1] <= 40)
        out.push({ group: k, dim: 'TOP-OFFSET', n: g.length, spread: ts[i] - ts[i-1], values: ts.slice(0, 6) });
    });
    return out;
  }

  function draw() {
    off(); var m = main(); if (!m) return 'no main';
    if (getComputedStyle(m).position === 'static') m.style.position = 'relative';
    var wrap = document.createElement('div'); wrap.id = '__gridwrap';
    wrap.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:' + m.scrollHeight + 'px;pointer-events:none;z-index:9998';
    var g = document.createElement('div');
    g.style.cssText = 'position:absolute;inset:0;background-image:' +
      'repeating-linear-gradient(to right,rgba(95,212,232,.13) 0 1px,transparent 1px ' + UNIT + 'px),' +
      'repeating-linear-gradient(to bottom,rgba(95,212,232,.13) 0 1px,transparent 1px ' + UNIT + 'px),' +
      'repeating-linear-gradient(to right,rgba(95,212,232,.3) 0 1px,transparent 1px ' + (UNIT*HEAVY) + 'px),' +
      'repeating-linear-gradient(to bottom,rgba(95,212,232,.3) 0 1px,transparent 1px ' + (UNIT*HEAVY) + 'px)';
    wrap.appendChild(g);
    /* Every near-miss gets a RED pair of lines, so the eye is sent straight at the defect
       instead of being asked to scan a field of equal-looking guides. */
    near().slice(0, 60).forEach(function (h) {
      [h.a, h.b].forEach(function (s) {
        var x = parseFloat(s.split('=')[1]);
        var line = document.createElement('div');
        line.style.cssText = 'position:absolute;top:0;bottom:0;width:1px;left:' + x + 'px;background:rgba(255,52,48,.75)';
        wrap.appendChild(line);
      });
    });
    m.appendChild(wrap);
    return 'grid on';
  }
  function off() { var w = document.getElementById('__gridwrap'); if (w) w.remove(); return 'off'; }

  /* 🔴 THE VIEWPORT CONTRACT, BAKED IN RATHER THAN REMEMBERED — 1282x888.
   * Harkirat's window is 1282x920 with 32px of browser chrome, so 888 is the CONTENT height,
   * and two measurements taken at different heights are not comparable: a panel below the
   * fold at 806 is on screen at 888, and "nothing is cut off" is a claim about a height.
   * A page cannot resize its own window, so the instrument does the next best thing and
   * REPORTS what it measured at — every reading carries its own viewport, and an off-contract
   * one says so in the reading itself instead of looking like a clean number.                */
  var CONTRACT = { w: 1282, h: 888 };
  function viewport() {
    var d = document.documentElement;
    var v = { w: d.clientWidth, h: d.clientHeight, contract: CONTRACT.w + 'x' + CONTRACT.h };
    v.onContract = v.w === CONTRACT.w && v.h === CONTRACT.h;
    if (!v.onContract) v.warning = 'measured at ' + v.w + 'x' + v.h + ', not the ' + v.contract + ' contract — resize before recording anything';
    return v;
  }

  window.__grid = draw; window.__grid.off = off; window.__grid.near = near; window.__grid.sizes = sizes;
  window.__grid.viewport = viewport;
  window.__grid.all = function () {
    var n = near(), s = sizes();
    /* ⚠️ near/sizes are TRUNCATED samples and the counts are the measurement. Read nearMisses
     * and sizeIssues as numbers; the arrays are there to start the triage, never to end it.  */
    return { viewport: viewport(), examined: all().length, nearMisses: n.length, sizeIssues: s.length,
             near: n.slice(0, 22), sizes: s.slice(0, 18) };
  };
})();
