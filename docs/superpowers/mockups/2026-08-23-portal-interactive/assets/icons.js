/* ═══════════════════════════════════════════════════════════════════════════════════════
   ICONS — Lucide (MIT), inlined as an SVG sprite.

   🔴 STANDING RULE, Harkirat 2026-08-25: "NEVER USE TEXT GLYPHS FOR ICONS. ICONS ARE ICONS.
   text is text." The package was using typed characters as controls and status marks -
   &#9650; for a collapse toggle, a black diamond for an avatar, an interrobang for an empty
   state, a biohazard for a toxic build, a star for a rank. Every one of them hands its size,
   weight, baseline, and hinting to whatever font resolves it, so there is no stroke control
   and no alignment control, and at 9px they rasterise to smudges. They are also the reflex
   answer, which is why they turn up on every accordion ever built.

   WHY LUCIDE. 24x24 grid, uniform 2px stroke, round caps and joins, geometric rather than
   decorative - the same discipline as this portal's type. ISC/MIT, so it can be embedded.

   WHY A SPRITE RATHER THAN A DEPENDENCY. The mockup is served from a plain static directory
   with no build step and must work offline; a CDN script or an npm package would add a
   network or a toolchain to a package whose whole point is that you open the file. A sprite
   is the real artwork, embedded once, referenced by <use>.

   USE:  S.icon('check')                -> an <svg> string
         S.icon('check', {cls:'ok'})    -> with an extra class
   Every icon inherits currentColor and is 1em square, so it sits in text without a fight.
   ═══════════════════════════════════════════════════════════════════════════════════════ */
(function () {
  /* Lucide path data, verbatim. Keep the names Lucide uses so a swap or an addition is a
     lookup rather than a guess. */
  var P = {
    'check':        '<path d="M20 6 9 17l-5-5"/>',
    'x':            '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    'plus':         '<path d="M5 12h14"/><path d="M12 5v14"/>',
    'minus':        '<path d="M5 12h14"/>',
    'chevron-down':  '<path d="m6 9 6 6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-up':    '<path d="m18 15-6-6-6 6"/>',
    'star':         '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    'triangle-alert':'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    'arrow-up-right':'<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    'skull':        '<path d="m12.5 17-.5-1-.5 1h1z"/><path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="12" r="1"/>',
    'user':         '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'image':        '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    'image-off':    '<path d="M2 2 22 22"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><path d="M13.5 13.5 6 21"/><path d="M18 12l-1.5-1.5a2 2 0 0 0-2.83 0L12 12.67"/><path d="M21 15V5a2 2 0 0 0-2-2H9"/><path d="M3 7v12a2 2 0 0 0 2 2h12"/>',
    'search-x':     '<path d="m13.5 8.5-5 5"/><path d="m8.5 8.5 5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    'square-pen':   '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>',
    'clock':        '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    'calendar-days':'<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>'
  };

  function sprite() {
    if (document.getElementById('__icons')) return;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = '__icons';
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    svg.innerHTML = Object.keys(P).map(function (k) {
      return '<symbol id="i-' + k + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
             'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + P[k] + '</symbol>';
    }).join('');
    var root = document.body || document.documentElement;
    root.insertBefore(svg, root.firstChild);
  }

  /* Decorative by default - an icon beside a word is not read twice. Pass {label:'…'} only
     when the icon is the ONLY thing carrying the meaning. */
  function icon(name, o) {
    o = o || {};
    if (!P[name]) { console.warn('[dioreo] no icon named "' + name + '"'); return ''; }
    return '<svg class="ic' + (o.cls ? ' ' + o.cls : '') + '"' +
      (o.label ? ' role="img" aria-label="' + o.label + '"' : ' aria-hidden="true"') +
      '><use href="#i-' + name + '"/></svg>';
  }

  /* Inject NOW, into whatever root exists. <use href="#i-…"> resolves against the document,
   * and an element that was in the DOM before its symbol arrived is not guaranteed to
   * re-resolve - so waiting for DOMContentLoaded can leave icons permanently blank on a page
   * whose markup rendered during parsing. documentElement always exists by this point. */
  sprite();
  window.Icons = { icon: icon, names: Object.keys(P), sprite: sprite };
})();

/* ═══════════════════ THE FOLD — a morph, not a swap ═════════════════════════
   Harkirat: "use icons with animation so things dont feel boring. icons that
   genuinely animate into different states, such as collapsed/open in a truly
   unique and seamless transition".

   🔴 A ROTATION IS NOT A MORPH. Spinning a chevron 90 or 180 degrees is what
   every disclosure control on the internet does, and it is the same laziness
   as the typed glyph one level up - the shape never changes, it just points
   somewhere else.

   This animates the PATH ITSELF. The chevron's two strokes travel through a
   FLAT LINE on the way between down and up, so the mark reads as folding
   through the horizon - which is exactly what the panel underneath is doing.
   The metaphor and the motion are the same event.

     closed  M6 9  L12 15 L18 9     the chevron points down
     (mid)   M6 12 L12 12 L18 12    a flat rule - the fold at its hinge
     open    M6 15 L12 9  L18 15    the chevron points up

   Three points throughout, so the interpolation is well-defined. CSS can
   transition the `d` property directly when it is written as path(), which is
   a real geometric interpolation rather than a transform faking one.        */
(function () {
  var CLOSED = 'M6 9 L12 15 L18 9', OPEN = 'M6 15 L12 9 L18 15';
  window.Icons.fold = function (open, o) {
    o = o || {};
    return '<svg class="ic ic-fold' + (open ? ' open' : '') + (o.cls ? ' ' + o.cls : '') +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="' + (open ? OPEN : CLOSED) + '"/></svg>';
  };
})();
