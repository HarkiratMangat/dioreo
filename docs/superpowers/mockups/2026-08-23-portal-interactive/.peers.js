/* ═══════════════════════════════════════════════════════════════════════════════════════
   PEER MISMATCH — every element, alignment AND size.

     __peers()   the findings, ranked
     __peers.n() how many elements were examined

   🔴 WHY NOT THE PREVIOUS DETECTOR. Version one enumerated a selector whitelist of page
   frames and found one 1px masthead offset. Version two examined every element but only
   reported edges 1-4px apart. BOTH MISSED THE REAL BUGS: Armory's Compare had two value
   columns at 447px and 567px (a 120px difference between the two things being compared)
   and two preview cards 12px apart vertically. Neither is a "near miss" — they are PEERS
   THAT SHOULD MATCH AND DO NOT, and that is the class that actually breaks a page.

   A peer group = same tag + same class + same parent. Things the markup itself says are
   equivalent. If the markup says two things are the same kind of thing, they should:
     · be the same SIZE when laid out side by side (unequal = the layout misrepresents them)
     · share a TOP when side by side, or a LEFT when stacked
   Deliberate exceptions exist (a wide first column, a chip sized to its label), so this
   reports and ranks rather than failing — but it reports EVERYTHING, and I look at all of it.
   ═══════════════════════════════════════════════════════════════════════════════════════ */
(function () {
  function main() { return document.querySelector('main'); }
  function visible(el) {
    var cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false;
    var b = el.getBoundingClientRect();
    return b.width >= 4 && b.height >= 4;
  }
  function key(el) {
    var c = (el.className || '').toString().split(' ').filter(Boolean).sort().join('.');
    return el.tagName + '.' + (c || '-');
  }
  function all() {
    var m = main(), out = [];
    [].forEach.call(m.querySelectorAll('*'), function (el) {
      if (el.id === '__gridwrap' || el.closest('#__gridwrap')) return;
      if (!visible(el)) return; out.push(el);
    });
    return out;
  }

  function peers() {
    var m = main(), mr = m.getBoundingClientRect(), sc = m.scrollTop, els = all(), groups = {};
    els.forEach(function (el) {
      var p = el.parentElement; if (!p) return;
      var g = (p.id || key(p)) + ' >> ' + key(el);
      (groups[g] = groups[g] || []).push(el);
    });
    var hits = [];
    Object.keys(groups).forEach(function (g) {
      var list = groups[g]; if (list.length < 2 || list.length > 60) return;
      var bs = list.map(function (el) { var b = el.getBoundingClientRect();
        return { L:+(b.left-mr.left).toFixed(1), R:+(b.right-mr.left).toFixed(1),
                 T:+(b.top-mr.top+sc).toFixed(1), w:+b.width.toFixed(1), h:+b.height.toFixed(1),
                 txt:(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,18) }; });
      /* Side by side = they share a row band. Stacked = they share a column band. */
      var tops = bs.map(function(b){return b.T;}), lefts = bs.map(function(b){return b.L;});
      var sameRow = Math.max.apply(null,tops) - Math.min.apply(null,tops) < 4;
      var sameCol = Math.max.apply(null,lefts) - Math.min.apply(null,lefts) < 4;
      function spread(d){var v=bs.map(function(b){return b[d];});return +(Math.max.apply(null,v)-Math.min.apply(null,v)).toFixed(1);}

      if (sameRow) {                       // a row of peers: widths and heights should match
        ['w','h'].forEach(function(d){ var s=spread(d);
          if (s >= 1) hits.push({ sev: d==='w'? s/2 : s, group:g, kind:'ROW peers differ in '+d,
            spread:s, n:list.length, values:bs.map(function(b){return b[d];}).slice(0,6),
            sample:bs.map(function(b){return b.txt;}).slice(0,3) }); });
      } else if (sameCol) {                // a column of peers: widths should match
        var s=spread('w');
        if (s >= 1) hits.push({ sev:s, group:g, kind:'COLUMN peers differ in w', spread:s,
          n:list.length, values:bs.map(function(b){return b.w;}).slice(0,6),
          sample:bs.map(function(b){return b.txt;}).slice(0,3) });
      } else {                             // neither aligned: are they nearly aligned?
        var sT=spread('T'), sL=spread('L');
        if (sT>=1&&sT<=40) hits.push({ sev:sT, group:g, kind:'peers nearly share a TOP but do not',
          spread:sT, n:list.length, values:tops.slice(0,6), sample:bs.map(function(b){return b.txt;}).slice(0,3) });
        else if (sL>=1&&sL<=40) hits.push({ sev:sL, group:g, kind:'peers nearly share a LEFT but do not',
          spread:sL, n:list.length, values:lefts.slice(0,6), sample:bs.map(function(b){return b.txt;}).slice(0,3) });
      }
    });
    return hits.sort(function(a,b){return b.sev-a.sev;});
  }
  window.__peers = peers; window.__peers.n = function(){ return all().length; };
})();
