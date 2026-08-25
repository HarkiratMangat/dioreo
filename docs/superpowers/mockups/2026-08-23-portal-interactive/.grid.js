/* ═══════════════════════════════════════════════════════════════════════════════════════
   A TEMPORARY ALIGNMENT GRID. Injected, never shipped — nothing links this file.

     var s=document.createElement('script'); s.src='.grid.js'; document.body.appendChild(s);
     __grid()            draw
     __grid.off()        remove
     __grid.report()     the numbers

   🔴 IT IS DRAWN INSIDE main, NOT THE VIEWPORT. main is the scroll container in this portal
   (window.scrollY reads 0 on every page). A viewport-fixed grid would stay still while the
   content scrolled under it, so every judgement below the fold would compare content at
   scroll 900 against lines drawn for scroll 0 — well-formed, and about nothing.

   🔴 IT EMITS NUMBERS AS WELL AS PIXELS. A 3px misalignment is under one pixel in a
   downscaled screenshot. The picture says whether it LOOKS wrong; the numbers say whether
   it IS wrong. Neither alone can answer the question.
   ═══════════════════════════════════════════════════════════════════════════════════════ */
(function () {
  var UNIT = 8, HEAVY = 4;   // 8px fine, every 4th (32px) heavy

  function main() { return document.querySelector('main'); }

  function blocks() {
    var sel = '.masthead, .mh-id, .mh-stats, .mh-add, .mh-take, .identity, .idsum, ' +
              '.ph, .panel, section > .ph, .viewtrack, .deadrail, .manifest, table, ' +
              '.rail, header, .pcd, .cdown, .board, .bcol, .repcard, .tierboard, .bulkview';
    var out = [], seen = new Set();
    document.querySelectorAll(sel).forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 12) return;
      var key = el.className + '|' + Math.round(r.left) + '|' + Math.round(r.width);
      if (seen.has(key)) return; seen.add(key);
      out.push({ el: el, name: (el.className || el.tagName).toString().split(' ')[0],
                 l: r.left, r: r.right, w: r.width, t: r.top, h: r.height });
    });
    return out;
  }

  function draw() {
    off();
    var m = main(); if (!m) return 'no main';
    if (getComputedStyle(m).position === 'static') m.style.position = 'relative';

    var wrap = document.createElement('div');
    wrap.id = '__gridwrap';
    wrap.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:' + m.scrollHeight +
      'px;pointer-events:none;z-index:9998';

    var g = document.createElement('div');
    g.style.cssText = 'position:absolute;inset:0;' +
      'background-image:' +
        'repeating-linear-gradient(to right,rgba(95,212,232,.16) 0 1px,transparent 1px ' + UNIT + 'px),' +
        'repeating-linear-gradient(to bottom,rgba(95,212,232,.16) 0 1px,transparent 1px ' + UNIT + 'px),' +
        'repeating-linear-gradient(to right,rgba(95,212,232,.34) 0 1px,transparent 1px ' + (UNIT * HEAVY) + 'px),' +
        'repeating-linear-gradient(to bottom,rgba(95,212,232,.34) 0 1px,transparent 1px ' + (UNIT * HEAVY) + 'px)';
    wrap.appendChild(g);

    /* Edge guides come from LIVE bounding boxes, so this measures the page rather than my
       model of it. A guide is GREEN where several blocks agree on an x and RED where one
       block sits alone — a lone edge is what misalignment actually looks like. */
    var mr = m.getBoundingClientRect(), tally = {};
    blocks().forEach(function (b) {
      [Math.round(b.l - mr.left), Math.round(b.r - mr.left)].forEach(function (x) {
        tally[x] = (tally[x] || 0) + 1;
      });
    });
    Object.keys(tally).forEach(function (x) {
      var n = tally[x], line = document.createElement('div');
      line.style.cssText = 'position:absolute;top:0;bottom:0;width:1px;left:' + x + 'px;' +
        'background:' + (n >= 3 ? 'rgba(61,220,151,.55)' : n === 2 ? 'rgba(242,194,48,.5)' : 'rgba(255,52,48,.55)');
      wrap.appendChild(line);
    });

    m.appendChild(wrap);
    return 'grid on · ' + Object.keys(tally).length + ' distinct edges · main ' +
           Math.round(mr.width) + 'x' + m.scrollHeight;
  }

  function off() { var w = document.getElementById('__gridwrap'); if (w) w.remove(); return 'off'; }

  function report() {
    var m = main(), mr = m.getBoundingClientRect(), bs = blocks(), tally = {};
    bs.forEach(function (b) {
      [['L', Math.round(b.l - mr.left)], ['R', Math.round(b.r - mr.left)]].forEach(function (p) {
        (tally[p[1]] = tally[p[1]] || []).push(b.name + ':' + p[0]);
      });
    });
    var lonely = Object.keys(tally).filter(function (x) { return tally[x].length === 1; })
                       .map(function (x) { return x + 'px ' + tally[x][0]; });
    var offGrid = bs.filter(function (b) {
      return Math.round(b.l - mr.left) % UNIT !== 0 || Math.round(b.w) % UNIT !== 0;
    }).map(function (b) {
      return b.name + ' L=' + Math.round(b.l - mr.left) + ' w=' + Math.round(b.w) +
             ' h=' + Math.round(b.h);
    });
    var shared = Object.keys(tally).filter(function (x) { return tally[x].length >= 3; })
                       .map(function (x) { return x + 'px×' + tally[x].length; });
    return { mainW: Math.round(mr.width), blocks: bs.length,
             sharedEdges: shared, lonelyEdges: lonely.slice(0, 14),
             offGrid: offGrid.slice(0, 16), offGridCount: offGrid.length,
             heights: bs.map(function (b) { return b.name + ':' + Math.round(b.h); }).slice(0, 20) };
  }

  window.__grid = draw; window.__grid.off = off; window.__grid.report = report;
})();
