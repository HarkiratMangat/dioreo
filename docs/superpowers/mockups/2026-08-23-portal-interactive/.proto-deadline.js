/* ═══════════════════════════════════════════════════════════════════════════════════════
   PROTOTYPE — THROWAWAY. Three variants of the season deadline COUNTDOWN, mounted on the
   real season.html so they are judged against the real masthead, the real Track and the
   real density. Sub-shape A: a vacuum makes every variant look fine.

     season.html?variant=A     THE BAND      its own block, one clock, above the record
     season.html?variant=B     THE MASTHEAD  the page OPENS as a clock; no new block at all
     season.html?variant=C     THE PERCH     sticky; it never leaves the screen

   Off unless ?variant= or ?proto= is in the URL, so the normal page is untouched.

   🔴 WHY THESE AND NOT THE LAST FOUR. The Horizon / Moments / Board / Sentence were four
   ways to COMPOSE A RENDERED INTEGER, and the rejection was one sentence: "I told you they
   are a countdown." A countdown is a CLOCK — its defining property is that it RUNS, and you
   look at it and it has changed. The seconds place is not a planning unit; nobody schedules
   a battle pass to the second. It is the PROOF OF LIFE. A launch clock shows seconds at
   T-minus 40 days for exactly that reason.

   These three disagree about WHERE A CLOCK LIVES AND WHETHER IT PERSISTS, which is the only
   structural question left once "it runs" is settled.

   🔴 TWO SHARED FACTS, true in all three:
   1. ONE running clock, for the NEXT wall only. Three clocks side by side is a slot machine,
      and a page can hold exactly one moving thing before movement stops meaning anything.
      Everything after the next wall is a DATE AND A DISTANCE — not a smaller countdown.
      Only one thing is ever being counted down to.
   2. The next wall is a MOMENT, not a line. bpEnd and rankEnd are BOTH 2026-09-10, so this
      season has TWO WALLS, not three deadlines. The Track's own notch layer has grouped by
      date since it was rebuilt; every other surface counted three.
   ═══════════════════════════════════════════════════════════════════════════════════════ */
(function () {
  var Q = new URLSearchParams(location.search);
  if (!Q.has('variant') && !Q.has('proto')) return;
  var VARIANTS = [
    ['A', 'The Band — its own block'],
    ['B', 'The Masthead — the page opens as a clock'],
    ['C', 'The Perch — it never leaves the screen']
  ];
  var cur = (Q.get('variant') || 'A').toUpperCase();
  if (!VARIANTS.some(function (v) { return v[0] === cur; })) cur = 'A';

  var S = window.Shell, F = window.FIX;
  var LINES = F.LINES, today = F.today;  /* fixtures.js already applied ?today= to FIX.today */
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmt(iso) { var p = iso.split('-'); return MON[+p[1] - 1] + ' ' + (+p[2]); }
  function days(a, b) { return Math.round((new Date(b) - new Date(a)) / 864e5); }
  function plural(n, w) { return n === 1 ? w.replace(/s$/, '') : w; }

  /* A pinned ?today= must still TICK, or the one mechanism this package has for rendering
     states the fixtures never produce cannot reach the one element whose whole point is that
     it moves. The pinned date becomes an ORIGIN: midnight there, running forward in real
     time from page load. */
  var shift = Date.now() - new Date(today + 'T00:00:00Z').getTime();
  function parts(iso) {
    var ms = new Date(iso + 'T23:59:59Z').getTime() - (Date.now() - shift);
    if (ms <= 0) return { past: true, d: 0, h: 0, m: 0, s: 0 };
    var d = Math.floor(ms / 864e5); ms -= d * 864e5;
    var h = Math.floor(ms / 36e5);  ms -= h * 36e5;
    var m = Math.floor(ms / 6e4);   ms -= m * 6e4;
    return { past: false, d: d, h: h, m: m, s: Math.floor(ms / 1e3) };
  }
  function walls() {
    var o = (window.__protoSeason && window.__protoSeason()) || F.season, by = {}, out = [];
    LINES.forEach(function (L) {
      var iso = o[L.endKey];
      if (o[L.tbdKey] || !iso) return;
      if (!by[iso]) { by[iso] = { iso: iso, lines: [] }; out.push(by[iso]); }
      by[iso].lines.push(L);
    });
    return out.filter(function (w) { return days(today, w.iso) >= 0; })
              .sort(function (a, b) { return a.iso < b.iso ? -1 : 1; });
  }

  /* The clock. Units drop off from the LEFT as it closes, so the composition gets shorter
     and louder on its own — the sharpening IS the motion, nothing has to be animated. */
  function clockHTML(p, opts) {
    opts = opts || {};
    var u = [];
    if (p.d > 0) u.push(['d', p.d, plural(p.d, 'days')]);
    if (p.d > 0 || p.h > 0) u.push(['h', p.h, 'hrs']);
    u.push(['m', p.m, 'min']);
    u.push(['s', p.s, 'sec']);
    return u.map(function (x, i) {
      var sep = i ? '<span class="pcd-sep' + (x[0] === 's' ? ' pre-sec' : '') + '">:</span>' : '';
      var val = x[0] === 'd' ? x[1] : String(x[1]).padStart(2, '0');
      return sep + '<span class="pcd-u' + (x[0] === 's' ? ' sec' : '') + '">' +
             '<b>' + val + '</b><i>' + x[2] + '</i></span>';
    }).join('') + (opts.suffix || '');
  }
  function linesHTML(w, cls) {
    return w.lines.map(function (L) {
      return '<span class="' + cls + '" style="--c:' + L.hex + '"><i></i>' + L.label + '</span>';
    }).join('');
  }
  function thenHTML(rest) {
    if (!rest.length) return '';
    return '<div class="pcd-then"><span class="pcd-then-k">then</span>' + rest.map(function (w) {
      return w.lines.map(function (L) {
        var n = days(today, w.iso);
        return '<span class="pcd-then-i" style="--c:' + L.hex + '"><i></i><b>' + L.label + '</b> ' +
               fmt(w.iso) + ' &middot; ' + n + ' ' + plural(n, 'days') + '</span>';
      }).join('');
    }).join('') + '</div>';
  }

  var host, painters = [];
  function build() {
    var ws = walls();
    var main = document.querySelector('main');
    document.body.setAttribute('data-proto', cur);

    if (!ws.length) return;
    var next = ws[0], rest = ws.slice(1);

    if (cur === 'A') {
      /* THE BAND. Its own block, directly above the record it counts against. The most
         conventional of the three, and the one that costs the page the most vertical space. */
      host = document.createElement('section');
      host.className = 'pcd pcd-band';
      host.style.setProperty('--c', next.lines[0].hex);
      main.insertBefore(host, document.getElementById('identity'));
      painters.push(function () {
        var p = parts(next.iso);
        host.classList.toggle('hot', p.d < 3);
        host.innerHTML =
          '<div class="pcd-clock">' + clockHTML(p) + '</div>' +
          '<div class="pcd-what"><div class="pcd-when">until <b>' + fmt(next.iso) + '</b>' +
            (next.lines.length > 1 ? ' &middot; ' + next.lines.length + ' lines, one wall' : '') +
          '</div><div class="pcd-lines">' + linesHTML(next, 'pcd-line') + '</div></div>' +
          thenHTML(rest);
      });
    }

    if (cur === 'B') {
      /* THE MASTHEAD. No new block: the page's identity region BECOMES the countdown. The
         realm title drops to an eyebrow, the clock takes the figure row, and the realm's
         other numbers move underneath it. Costs zero extra height and makes the deadline the
         first thing on the page rather than the fourth. */
      var mh = document.querySelector('.masthead');
      host = document.createElement('div');
      host.className = 'pcd pcd-mast';
      host.style.setProperty('--c', next.lines[0].hex);
      mh.insertBefore(host, mh.firstChild);
      painters.push(function () {
        var p = parts(next.iso);
        host.classList.toggle('hot', p.d < 3);
        host.innerHTML =
          '<div class="pcd-eyebrow">Season &middot; <b>' + (F.season.currentSeasonTitle || '') + '</b></div>' +
          '<div class="pcd-clock">' + clockHTML(p) + '</div>' +
          '<div class="pcd-what"><div class="pcd-when">until <b>' + fmt(next.iso) + '</b>' +
            (next.lines.length > 1 ? ' &middot; ' + next.lines.length + ' lines, one wall' : '') +
          '</div><div class="pcd-lines">' + linesHTML(next, 'pcd-line') + '</div></div>' +
          thenHTML(rest);
      });
    }

    if (cur === 'C') {
      /* THE PERCH. Sticky — it never leaves the screen. This is "ACTIVE DATES TO BE LOOKING
         AT" taken at its word: on a page 4,000px tall you should not have to scroll back to
         the top to see what you are counting down to. It starts tall and COMPRESSES to a thin
         bar as you scroll, so it costs full height only where there is nothing else to see. */
      host = document.createElement('div');
      host.className = 'pcd pcd-perch';
      host.style.setProperty('--c', next.lines[0].hex);
      main.insertBefore(host, main.firstChild.nextSibling);
      painters.push(function () {
        var p = parts(next.iso);
        host.classList.toggle('hot', p.d < 3);
        host.innerHTML =
          '<div class="pcd-clock">' + clockHTML(p) + '</div>' +
          '<div class="pcd-what"><div class="pcd-when">until <b>' + fmt(next.iso) + '</b>' +
            (next.lines.length > 1 ? ' &middot; ' + next.lines.length + ' lines, one wall' : '') +
          '</div><div class="pcd-lines">' + linesHTML(next, 'pcd-line') + '</div></div>' +
          thenHTML(rest);
      });
      main.addEventListener('scroll', function () {
        host.classList.toggle('squat', main.scrollTop > 120);
      }, { passive: true });
    }

    painters.forEach(function (f) { f(); });
    setInterval(function () { painters.forEach(function (f) { f(); }); }, 1000);
  }

  /* THE SWITCHER. Deliberately loud and unlike the design, so it never reads as part of what
     is being judged. */
  function switcher() {
    var bar = document.createElement('div');
    bar.className = 'pcd-switch';
    function paint() {
      var i = VARIANTS.findIndex(function (v) { return v[0] === cur; });
      bar.innerHTML =
        '<button data-go="-1" aria-label="Previous variant">&#8592;</button>' +
        '<span><b>' + VARIANTS[i][0] + '</b> &mdash; ' + VARIANTS[i][1] + '</span>' +
        '<button data-go="1" aria-label="Next variant">&#8594;</button>';
    }
    function go(step) {
      var i = VARIANTS.findIndex(function (v) { return v[0] === cur; });
      var nx = VARIANTS[(i + step + VARIANTS.length) % VARIANTS.length][0];
      var q = new URLSearchParams(location.search); q.set('variant', nx);
      location.search = q.toString();
    }
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-go]'); if (b) go(+b.dataset.go);
    });
    document.addEventListener('keydown', function (e) {
      if (/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName) ||
          document.activeElement.isContentEditable) return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    });
    paint(); document.body.appendChild(bar);
  }

  function boot() {
    if (!document.querySelector('.masthead') || !window.Shell || !window.FIX) return setTimeout(boot, 60);
    build(); switcher();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(boot, 200); });
  else setTimeout(boot, 200);
})();
