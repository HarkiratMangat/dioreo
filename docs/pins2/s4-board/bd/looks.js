// Board 4: Builder-2 · looks.js — quick select, stage A (Session 4, 2026-10-05 23:28 EDT). Harkirat, 2026-10-05 19:21 EDT: standardize an element
// on a gate, save it, then on another gate pick it for an element "and have it all quickly group up/merged into the same group. The behavior,
// animation, style, hovers, etc are all part of the core group, and then things like a different color tint ... is what would be a 'flag'".
// Plan: local/pins2/s4/quick-select-plan.md.
//
// A LOOK is captured from the kit's own rules for one reference element (bd/rules.js, the source rules), never from computed values: the kit
// draws tints through custom properties (--tc, --sl, --realm-c, --c), so copying declarations that READ those variables, and never copying the
// variables themselves, leaves every member its own tint. Captured per part (the element, its ::before and ::after, its icon) and per state
// (rest, :hover, :focus-visible, :active, :disabled, [aria-pressed] and the like), each property resolved to the value that wins on the
// reference by specificity and order. Sizes and spaces are not part of a look: the group's knobs own them.
(function () {
  const BD = (window.BD = window.BD || {});
  const RULES = () => (window.BD_RULES && window.BD_RULES.rules) || [];
  // what a look carries on the element itself and on its icon; a pseudo-element that draws is carried whole (it IS the drawing)
  const LOOK = /^(background(-(color|image|position|size|repeat|clip|origin))?|border(-(top|right|bottom|left))?(-(color|style|width))?|border-(top|bottom)-(left|right)-radius|border-radius|border-(color|style|width)|box-shadow|outline(-(color|style|width|offset))?|color|opacity|filter|backdrop-filter|transform|translate|scale|rotate|transition(-[a-z-]+)?|animation(-[a-z-]+)?|cursor|text-decoration(-[a-z-]+)?|fill|stroke|stroke-width|stroke-opacity|fill-opacity|mix-blend-mode|isolation|z-index)$/;
  const SIZE = /^(width|height|min-|max-|padding|margin|gap|row-gap|column-gap|flex|grid|font-size|line-height|letter-spacing|font-weight|text-transform|inset|top|right|bottom|left)/;
  const STATE = /:(hover|focus-visible|focus-within|focus|active|disabled|checked)(?![\w-])|\[aria-(pressed|checked|selected|expanded|current)(=(["']?)[^\]]*?\4)?\]/g;
  const splitTop = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(' || ch === '[') d++; else if (ch === ')' || ch === ']') d--; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
  const lastCompound = (s) => { let d = 0; for (let i = s.length - 1; i >= 0; i--) { const ch = s[i]; if (ch === ')' || ch === ']') d++; else if (ch === '(' || ch === '[') d--; else if (d === 0 && /[\s>+~]/.test(ch)) return [s.slice(0, i + 1), s.slice(i + 1)]; } return ['', s]; };
  // the state tokens of one compound, outside :not()/:is()/:where()/:has() (a ":not(:disabled)" is a guard, not a state)
  const stripStates = (comp) => { const keep = []; const t = comp.replace(/:(not|is|where|has)\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)/g, (m) => { keep.push(m); return `\u0000${keep.length - 1}\u0000`; }); const states = []; const rest = t.replace(STATE, (m) => { states.push(m); return ''; }); return { comp: rest.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[+i]), states: states.join('') }; };
  const spec = (s) => { const t = s.replace(/:(not|is|has)\(([^()]*)\)/g, ' $2 ').replace(/:where\([^()]*\)/g, ''); return [(t.match(/#[\w-]+/g) || []).length, (t.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) || []).length, (t.match(/(^|[\s>+~(])[a-z][\w-]*/gi) || []).length]; };
  const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  const media = (r) => { if (!r.m || !r.m.length) return true; try { return r.m.every((q) => (/^\(|^screen|^all|^print|^not|^only/.test(q) ? matchMedia(q).matches : true)); } catch (e) { return true; } };
  const safeMatch = (el, sel) => { try { return el.matches(sel || '*'); } catch (e) { return false; } };

  // every kit declaration that reaches one part of `ref`, keyed part|state|prop, the winner kept. part: 'self' | '::before' | '::after' | 'svg'
  function capture(ref) {
    const out = new Map(); const ctxSkipped = new Set(); const svg = ref.querySelector('svg');
    for (const r of RULES()) {
      if (!media(r)) continue;
      for (const alt of splitTop(r.s)) {
        const pm = alt.match(/::?(before|after)\s*$/); const pseudo = pm ? '::' + pm[1] : ''; const base = pm ? alt.slice(0, pm.index) : alt;
        const [ctx, last] = lastCompound(base); const L = stripStates(last);
        let part = null, state = '', target = null;
        if (safeMatch(ref, ctx + L.comp)) { part = pseudo || 'self'; state = L.states; target = ref; }
        else if (!pseudo && svg && safeMatch(svg, ctx + L.comp) && svg !== ref) {
          // the icon: a state written on the ref's own compound ("button:hover .ic") is the ref's state
          const c2 = ctx.replace(/[\s>+~]+$/, ''); const [ctx2, refComp] = lastCompound(c2); const R2 = stripStates(refComp);
          if (R2.states && safeMatch(ref, ctx2 + R2.comp) && safeMatch(svg, ctx2 + R2.comp + ' ' + L.comp)) { part = 'svg'; state = R2.states + L.states; target = svg; }
          else if (!R2.states) { part = 'svg'; state = L.states; target = svg; }
        }
        if (!part) continue;
        if (/:(hover|focus|active)/.test(ctx) && part !== 'svg') { ctxSkipped.add(alt); continue; } // a state of an ancestor (a row's hover) belongs to the ancestor, not this look
        const sp = spec(alt);
        for (const [prop, val, imp] of r.d) {
          if (prop.startsWith('--')) continue; // the variables are the flags: never copied
          if (part !== '::before' && part !== '::after' && !LOOK.test(prop)) continue;
          if ((part === '::before' || part === '::after') && SIZE.test(prop) && !/^(inset|top|right|bottom|left|width|height)/.test(prop)) continue;
          const k = `${part}|${state}|${prop}`; const prev = out.get(k);
          if (!prev || (imp && !prev.imp) || ((!!imp === !!prev.imp) && (cmp(sp, prev.sp) > 0 || (cmp(sp, prev.sp) === 0 && r.o >= prev.o)))) out.set(k, { part, state, prop, val, imp: !!imp, sp, o: r.o, src: `${(window.BD_RULES.files || [])[r.f] || r.f}:${r.l}` });
        }
      }
    }
    return { entries: [...out.values()], skipped: [...ctxSkipped].slice(0, 12), position: getComputedStyle(ref).position, draws: [...out.values()].some((e) => e.part === '::before' && e.prop === 'position') ? '::before' : [...out.values()].some((e) => e.part === '::after' && e.prop === 'position') ? '::after' : 'self' };
  }

  // the CSS that gives `memberSel` the look; `own` is the member's own capture, whose look properties the look does not set are reset, so no
  // hover or ring of its own survives the join (a property the look sets only at rest gets that rest value in the member's other states)
  const BOOST = ':not(#bd-l0):not(#bd-l1):not(#bd-l2)';
  function emit(look, memberSel, own) {
    const by = new Map(); for (const e of look.entries) { const k = `${e.part}|${e.state}`; if (!by.has(k)) by.set(k, []); by.get(k).push(e); }
    const rest = new Map(look.entries.filter((e) => !e.state).map((e) => [`${e.part}|${e.prop}`, e.val]));
    const has = new Set(look.entries.map((e) => `${e.part}|${e.state}|${e.prop}`));
    for (const e of (own && own.entries) || []) {
      if (has.has(`${e.part}|${e.state}|${e.prop}`)) continue; if (e.part !== 'self' && e.part !== 'svg' && !LOOK.test(e.prop)) continue;
      const k = `${e.part}|${e.state}`; if (!by.has(k)) by.set(k, []); by.get(k).push({ part: e.part, state: e.state, prop: e.prop, val: rest.get(`${e.part}|${e.prop}`) || 'unset', reset: true });
    }
    const sel = (part, state) => `:is(${memberSel})${state}${BOOST}${part === 'self' ? '' : part === 'svg' ? ' svg' : part}`;
    // a drawing on a pseudo-element is placed against its element: a member that is not positioned would let it escape to an ancestor (the
    // minimise button's ring spread over its whole card, 2026-10-05 23:32 EDT), so the member is made the pseudo's containing block
    const pseudoDraws = look.entries.some((e) => (e.part === '::before' || e.part === '::after') && e.prop === 'position' && /absolute/.test(e.val));
    if (pseudoDraws && (!own || own.position === 'static' || own.position == null)) { const k = 'self|'; if (!by.has(k)) by.set(k, []); by.get(k).push({ part: 'self', state: '', prop: 'position', val: 'relative' }); }
    const order = [...by.keys()].sort((a, b) => a.split('|')[1].length - b.split('|')[1].length);
    return order.map((k) => { const [part, state] = k.split('|'); const ds = by.get(k).map((e) => `${e.prop}:${e.val} !important`).join(';'); return `${sel(part, state)}{${ds}}`; }).join('\n');
  }

  BD.looks = { capture, emit, LOOK, splitTop, stripStates };
})();
