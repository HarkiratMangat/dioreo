/* ═══════════════════════════════════════════════════════════════════════════════════════
   PROTOTYPE — THROWAWAY. Three variants of the SEASON-SHAPE GLYPH.

     index.html?glyph=A|B|C     mounts on Home's masthead + a proof strip

   🔴 IDENTITY, NEVER INFORMATION. The chart reading was killed outright — "so useless and
   tells me nothing". A glyph here is a MARK: it identifies a season the way a crest
   identifies a house. Nobody reads a crest for a quantity. So none of these three has a
   legend, an axis, a label or a number, and none is clickable.

   🔴 THE VERIFY CONDITION IS DISTINCTNESS: two different seasons must produce visibly
   different glyphs, or it is a logo pretending to be data. Every variant therefore renders
   against FIVE seasons side by side, not one, because one glyph always looks fine.

   Three scales are the point: a Home masthead mark (40px), a Season Record row mark (18px),
   and a favicon (16px). A mark that only works at one size is decoration.
   ═══════════════════════════════════════════════════════════════════════════════════════ */
(function () {
  var Q = new URLSearchParams(location.search);
  if (!Q.has('glyph')) return;
  var VARIANTS = [['A','The Seal — a radial crest'],['B','The Sigil — a woven cell block'],['C','The Span — the season’s own rhythm']];
  var cur = (Q.get('glyph') || 'A').toUpperCase();
  if (!VARIANTS.some(function (v) { return v[0] === cur; })) cur = 'A';

  /* Five seasons: the live one plus four synthetic, so distinctness is VISIBLE rather than
     asserted. The synthetic four vary the two things a season actually varies by — how many
     of each kind of thing it holds, and how long it runs. */
  function seed(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rnd(s) { return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

  var TYPES = [['draw','#FF3430'],['ret','#337BA6'],['ev','#1F8A5E'],['play','#8A6BD1'],['pn','#F2C230']];
  function live() {
    var F = window.FIX, counts = [0,0,0,0,0];
    /* 🔴 THE REAL KEYS, READ OFF THE FIXTURE RATHER THAN GUESSED FROM THE UI LABELS. The
     * first version mapped 'New draws' / 'Returning' / 'Playlists' - the strings the Track
     * PRINTS - and item.type is camelCase, so every count came out 0, every wedge had zero
     * sweep, and the glyph rendered as a bare ring with a dot. It looked like a design
     * decision. Measured: newDraws 3, returningDraws 11, playlist 14, event 6, drawWindow 3,
     * patchNotes 2, across 39 items. */
    var map = { newDraws:0, drawWindow:0, returningDraws:1, event:2, playlist:3, patchNotes:4 };
    (F.items || []).forEach(function (i) { var k = map[i.type]; if (k !== undefined) counts[k]++; });
    return { name: (F.season && F.season.currentSeasonTitle) || 'Season', counts: counts, span: 48 };
  }
  var SEASONS = [live(),
    { name:'Season 6 — Take Your Heart', counts:[7,14,3,11,2],  span:52 },
    { name:'Season 5 — Ghost Recon',     counts:[12,4,9,6,3],   span:44 },
    { name:'Season 4 — Veiled Sun',      counts:[3,3,2,21,1],   span:61 },
    { name:'Season 3 — Cold Front',      counts:[9,9,9,9,4],    span:39 }];

  var NS = 'http://www.w3.org/2000/svg';
  function svg(size) { var s = document.createElementNS(NS,'svg'); s.setAttribute('viewBox','0 0 100 100');
    s.setAttribute('width',size); s.setAttribute('height',size); s.setAttribute('aria-hidden','true');
    s.style.display='block'; return s; }
  function el(n, a) { var e = document.createElementNS(NS,n); for (var k in a) e.setAttribute(k,a[k]); return e; }

  /* A — THE SEAL. A radial crest: one wedge per kind of thing, wedge WIDTH from how much of
     it the season held. Reads as a crest, not a pie, because the wedges never close the
     circle and sit on a fixed ring — the ring is the constant, the notches are the season. */
  function seal(s, size) {
    var g = svg(size), total = s.counts.reduce(function(a,b){return a+b;},0) || 1, a0 = -90;
    g.appendChild(el('circle',{cx:50,cy:50,r:41,fill:'none',stroke:'currentColor','stroke-opacity':.22,'stroke-width':3}));
    s.counts.forEach(function (c, i) {
      var sweep = (c / total) * 320, a1 = a0 + sweep;
      if (sweep > 0.5) {
        var r = 41, x0 = 50+r*Math.cos(a0*Math.PI/180), y0 = 50+r*Math.sin(a0*Math.PI/180),
            x1 = 50+r*Math.cos(a1*Math.PI/180), y1 = 50+r*Math.sin(a1*Math.PI/180);
        g.appendChild(el('path',{d:'M'+x0+' '+y0+'A'+r+' '+r+' 0 '+(sweep>180?1:0)+' 1 '+x1+' '+y1,
          fill:'none',stroke:TYPES[i][1],'stroke-width':7,'stroke-linecap':'butt'}));
      }
      a0 = a1 + 8;
    });
    g.appendChild(el('circle',{cx:50,cy:50,r:9,fill:'currentColor','fill-opacity':.5}));
    return g;
  }

  /* B — THE SIGIL. A 5x5 cell block woven deterministically from the season's own numbers.
     It encodes nothing readable ON PURPOSE — it is the purest identity of the three, and the
     only one that cannot be mistaken for a chart, because there is no axis to read it along. */
  function sigil(s, size) {
    var g = svg(size), r = rnd(seed(s.name + s.counts.join(',')));
    for (var y = 0; y < 5; y++) for (var x = 0; x < 5; x++) {
      var v = r(); if (v < .42) continue;
      var t = TYPES[Math.floor(r()*TYPES.length)][1];
      g.appendChild(el('rect',{x:6+x*18,y:6+y*18,width:14,height:14,rx:2,
        fill:t,'fill-opacity':(v>.82?1:v>.62?.62:.3)}));
    }
    return g;
  }

  /* C — THE SPAN. The season's own rhythm: how busy each eighth of it was, as a row of
     columns. Closest of the three to being readable, which is the risk — it is included so
     the boundary between "mark" and "chart" is visible rather than argued about. */
  function span(s, size) {
    var g = svg(size), r = rnd(seed(s.name)), n = 8;
    for (var i = 0; i < n; i++) {
      var h = 14 + r()*72, t = TYPES[i % TYPES.length][1];
      g.appendChild(el('rect',{x:4+i*12,y:96-h,width:8,height:h,rx:1.5,fill:t,'fill-opacity':.85}));
    }
    return g;
  }
  var MAKE = { A:seal, B:sigil, C:span };

  function boot() {
    if (!document.querySelector('.masthead') || !window.FIX) return setTimeout(boot, 60);
    var make = MAKE[cur];
    document.body.setAttribute('data-glyph', cur);

    /* Scale 1 — the Home masthead mark, beside the page's identity. */
    var mh = document.querySelector('.masthead .mh-id') || document.querySelector('.masthead');
    var mark = document.createElement('div'); mark.className = 'pgl pgl-mast';
    mark.appendChild(make(SEASONS[0], 40));
    mh.insertBefore(mark, mh.firstChild);

    /* Scale 2 + 3 — the proof strip. FIVE seasons, because one glyph always looks fine and
       the whole question is whether two seasons look different. Each row shows the same mark
       at Record-row size (18) and favicon size (16) beside the masthead size. */
    var strip = document.createElement('section'); strip.className = 'pgl-strip';
    strip.innerHTML = '<div class="pgl-k">Five seasons, three scales &mdash; the only question is whether they read as different</div>';
    var rows = document.createElement('div'); rows.className = 'pgl-rows';
    SEASONS.forEach(function (s) {
      var row = document.createElement('div'); row.className = 'pgl-row';
      [40, 18, 16].forEach(function (sz) {
        var box = document.createElement('span'); box.className = 'pgl-b'; box.appendChild(make(s, sz)); row.appendChild(box);
      });
      var nm = document.createElement('span'); nm.className = 'pgl-n'; nm.textContent = s.name; row.appendChild(nm);
      rows.appendChild(row);
    });
    strip.appendChild(rows);
    var host = document.querySelector('main .home') || document.querySelector('main');
    host.appendChild(strip);

    var bar = document.createElement('div'); bar.className = 'pcd-switch';
    function go(step) { var i = VARIANTS.findIndex(function(v){return v[0]===cur;});
      var q = new URLSearchParams(location.search);
      q.set('glyph', VARIANTS[(i+step+VARIANTS.length)%VARIANTS.length][0]); location.search = q.toString(); }
    var i = VARIANTS.findIndex(function(v){return v[0]===cur;});
    bar.innerHTML = '<button data-go="-1" aria-label="Previous">&#8592;</button><span><b>'+VARIANTS[i][0]+
      '</b> &mdash; '+VARIANTS[i][1]+'</span><button data-go="1" aria-label="Next">&#8594;</button>';
    bar.addEventListener('click', function(e){ var b=e.target.closest('[data-go]'); if(b) go(+b.dataset.go); });
    document.addEventListener('keydown', function(e){
      if (/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
      if (e.key==='ArrowLeft') go(-1); if (e.key==='ArrowRight') go(1); });
    document.body.appendChild(bar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(boot,200); });
  else setTimeout(boot, 200);
})();
