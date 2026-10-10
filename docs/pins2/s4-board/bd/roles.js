// Board 4: Builder · roles (Session 4, 2026-10-03 21:16 EDT). Which element a thing IS — a filter chip, a view switch, a key label — read by
// the same rule list Session 5's apply map classifies the portal with (docs/pins2/final/apply-map.cjs), run here over the kit's own
// elements, with the kit's rulings and Harkirat's on top. A role decides identity; the measurements only decide same against family
// inside it (Harkirat, 2026-10-03 21:01 EDT: "you literally have ALL the data available for you … shouldn't you yourself be putting in the
// effort to actually set those similar 'same'/'family' elements"). So the builder and the apply map agree on what is what, and what he
// standardizes here maps one to one onto what Session 5 applies.
(function () {
  // ⟦apply-map rules: start⟧ copied byte for byte from docs/pins2/final/apply-map.cjs by tools/sync-roles; tools/verify.cjs fails if they differ
const HUES = /var\(--(ar|smg|lmg|mm|sn|sg|sec|dmz)\)/;
// One rule list, first match wins, tested against ONE selector's leaf (the element before ‹), never the parent it sits in: a census
// family groups elements by look, so a family can hold a fold button and a delete button that look alike at rest. Each selector is
// classified on its own; the family takes the bucket of its most-used selector and lists the others as mixed roles.
const RULES = [
  ['dev', (f, s) => /pin mode|📍|\.dev-/.test(s), 'EXEMPT', [], 'dev tooling, never ships'],
  ['field', (f) => f.fp.kind.startsWith('field:'), 'Fields', ['Fi', 'M', 'J', 'S', 'T'], 'a form field'],
  ['th', (f, s) => /(^|\s)th\b|wg-heads|-heads\b|sortbtn|wg-sort|\.colh/.test(s), 'Column heads', ['B', 'S'], 'a table or list column head'],
  ['catword', (f) => f.fp.kind === 'text' && f.fp.tt === 'uppercase' && HUES.test(f.fp.col), 'Category word', ['F', 'T'], 'an uppercase word in a category hue'],
  ['keylabel', (f, s) => (f.fp.kind === 'text' || f.fp.kind === 'label') && f.fp.tt === 'uppercase' && f.fp.fs <= 12 && /(\bkl\b|label|mlabel|-k\b|\.k\b|lbl|key|eyebrow|bqhead|incg|-lab|tg-l|kicker|\bk ‹)/.test(s), 'Key labels', ['A', 'T'], 'an uppercase key in front of controls'],
  ['switch', (f, s) => f.fp.kind === 'button' && /(\.seg\b|‹ \.seg|\.sw\b|vsw|view-?sw|\.vb\b|b4-vb|tabsw|\.vt\b)/.test(s), 'View switch', ['Dsw', 'H', 'T'], 'one side of a two- or three-way switch'],
  ['deselect', (f, s) => f.fp.kind === 'button' && /(deselect|\.x\b.*sel|b3-x\b|selbar-x|cx-wx|xt-rm)/.test(s), 'Deselect ×', ['Ex', 'H'], 'removes an item from a selection'],
  ['close', (f, s) => f.fp.kind === 'button' && /(\.x\b|close|dismiss|\.bk\b|b3-pc-x)/.test(s), 'Close and back', ['G', 'H', 'J'], 'closes or goes back: the grey wash'],
  ['delete', (f, s) => f.fp.kind === 'button' && /(del\b|-del|trash|rmv|\.dang|danger|discard)/.test(s), 'Action: delete', ['E', 'H', 'J'], 'a delete or remove action'],
  ['edit', (f, s) => f.fp.kind === 'button' && /edit/.test(s), 'Action: edit', ['E', 'H', 'J'], 'an edit action'],
  ['share', (f, s) => f.fp.kind === 'button' && /(share|copy|\bcp\b|-cp\b|\bexp\b|-exp\b|export|download|\bdl\b)/.test(s), 'Action: share, copy, export', ['E', 'H', 'J'], 'a share, copy or export action'],
  ['chip', (f, s) => f.fp.kind === 'button' && /(chip|\.fc\b|b3-fc|cx-k|xt-c|xt-all|\.rv\b|lvchip|incchip)/.test(s) && !/\.go\b|madd|lead/.test(s), 'Filter chip', ['C', 'D', 'T', 'S'], 'a filter chip'],
  ['go', (f, s) => (f.fp.kind === 'button' || f.fp.kind === 'link') && /(\.go\b|commit|\.stage\b|\.save\b|repair|\.dbtn)/.test(s), 'Go button', ['Go', 'H', 'J'], 'the button that does the thing'],
  ['new', (f, s) => f.fp.kind === 'button' && /(lead|\.new|-new|madd|-add|\.add\b|mh-t\b)/.test(s), 'New button', ['N', 'H', 'J'], 'creates something'],
  ['menuitem', (f, s) => (f.fp.kind === 'button' || f.fp.kind === 'link') && /(\.mi\b|pitem|menu|\.opt\b|-opt\b|plist)/.test(s), 'Menu item', ['Mi', 'T'], 'an item in a dropdown or menu'],
  ['row', (f, s) => (f.fp.kind === 'button' || f.fp.kind === 'box' || f.fp.kind === 'link') && /(wg-r\b|\btr\b|\.tile|att-row|rvop|brow|\.lrow|\.rrow|benc|round-u)/.test(s) && f.states && f.states.hover, 'Row', ['R', 'S'], 'a whole row that opens or selects'],
  ['rail', (f, s) => f.fp.kind === 'link' && /(\.rail|realm|\.mk\b|\.un\b|crumb)/.test(s), 'EXEMPT', [], 'the shell rail and brand: a realm layer, Step 4'],
  ['neutral', (f) => f.fp.kind === 'button', 'Neutral button', ['G', 'H', 'J', 'T'], 'a plain button: the grey wash'],
  ['link', (f) => f.fp.kind === 'link', 'Link', ['T'], 'a text link'],
  ['heading', (f) => f.fp.kind === 'heading', 'Headings', ['L', 'T'], 'a heading'],
  ['grouphead', (f, s) => f.fp.kind === 'text' && /(lnh|sechead|sec-h|grp-h|-gh\b|ghead|hdx|\.sh\b|subhead)/.test(s), 'Group headings', ['L', 'T'], 'the heading over a group'],
  ['smallcaps', (f) => f.fp.kind === 'text' && f.fp.tt === 'uppercase', 'Small text (Step 3)', ['T'], 'small uppercase text: its role is Step 3'],
  ['smalltext', (f) => f.fp.kind === 'text' && f.fp.fs <= 11.5 && /ink3|ink4|ink2/.test(f.fp.col), 'Small text (Step 3)', ['T'], 'small grey text: its role is Step 3'],
  ['text', (f) => f.fp.kind === 'text' || f.fp.kind === 'label', 'Content text', ['T'], 'content: takes the text-size scale only'],
  ['ground', (f, s) => f.fp.kind === 'box' && /(menu|pop|well|tier|dd\b|dropdown|picker|readout|stepper)/.test(s), 'Dark grounds', ['M', 'J'], 'a menu, pop-up or well'],
  ['drawer', (f, s) => f.fp.kind === 'box' && /(\.dw\b|‹ \.dw|drawer|\.dw-)/.test(s), 'Drawer', ['Q', 'J', 'S'], 'a drawer and its columns'],
  ['panel', (f) => f.fp.kind === 'box' && f.fp.rad > 0 && (f.fp.ring !== 'none' || f.fp.bw > 0 || f.fp.bg !== 'none'), 'Panels and cards', ['J', 'S'], 'a surface with corners'],
  ['layout', (f) => f.fp.kind === 'box', 'Layout boxes', ['S'], 'layout only: takes the spacing scale'],
];
// Some roles are named only by the parent (`button ‹ .seg`, `button ‹ .usec`): when the leaf lands in a generic bucket, these rules get
// one more try against the whole selector.
const BY_PARENT = new Set(['switch', 'menuitem', 'th', 'keylabel', 'grouphead', 'deselect', 'close', 'row']);
const GENERIC = new Set(['neutral', 'link', 'text', 'smalltext', 'smallcaps', 'layout', 'panel']);
const classifyOne = (f, w) => {
  const leaf = w.split(' ‹ ')[0]; let hit = null;
  for (const [id, test, bucket, std, why] of RULES) if (test(f, leaf)) { hit = { rule: id, bucket, std, why }; break; }
  if (!hit || GENERIC.has(hit.rule)) for (const [id, test, bucket, std, why] of RULES) if (BY_PARENT.has(id) && test(f, w)) { hit = { rule: id + ' (by parent)', bucket, std, why }; break; }
  return hit || { rule: 'none', bucket: 'UNASSIGNED', std: [], why: '' };
};
  // ⟦apply-map rules: end⟧

  // The census reads each element from the portal: its kind, its type, its colour by token name, whether it answers a hover, and its
  // selector as `tag.classes ‹ .parent`. The same reading, taken from the kit's live page.
  const px = (v) => parseFloat(v) || 0;
  const TOK = ['ar', 'smg', 'lmg', 'mm', 'sn', 'sg', 'sec', 'dmz', 'ink', 'ink2', 'ink3', 'ink4'];
  let probe = null; const tokCache = new WeakMap();
  function rgbOf(raw) {
    if (!probe) { const host = document.getElementById('bd-host'); probe = document.createElement('span'); probe.style.cssText = 'position:absolute;visibility:hidden'; (host && host.shadowRoot ? host.shadowRoot : document.body).appendChild(probe); }
    probe.style.color = ''; probe.style.color = raw; return getComputedStyle(probe).color;
  }
  // token names by the colour they resolve to, where the element sits (a realm sets its own hues)
  function tokensAt(el) {
    const root = el.closest('.b4g') || el.closest('section') || document.body; let m = tokCache.get(root); if (m) return m; m = new Map();
    const c = getComputedStyle(root); for (const t of TOK) { const raw = c.getPropertyValue('--' + t).trim(); if (!raw) continue; const v = rgbOf(raw); if (!m.has(v)) m.set(v, []); m.get(v).push('--' + t); }
    tokCache.set(root, m); return m;
  }
  let hoverCls = null;
  function hovers(el) {
    if (!hoverCls) { hoverCls = new Set(); const R = window.BD_RULES; if (R) for (const r of R.rules) for (const m of r.s.matchAll(/\.([\w-]+)(?:[.\w-]|\[[^\]]*\])*:hover/g)) hoverCls.add(m[1]); }
    return [...el.classList].some((c) => hoverCls.has(c));
  }
  function kindOfFp(el, k) {
    const t = el.tagName.toLowerCase();
    if (k === 'control') { if (t === 'a') return 'link'; if (t === 'input') return 'field:' + (el.type || 'text'); if (t === 'select') return 'field:' + el.type; if (t === 'textarea') return 'field:textarea'; if (el.getAttribute('role') === 'checkbox') return 'field:checkbox'; return 'button'; }
    if (k === 'text') return /^h[1-6]$/.test(t) || el.getAttribute('role') === 'heading' ? 'heading' : t === 'label' ? 'label' : 'text';
    if (k === 'box' || k === 'layout' || k === 'divider') return 'box';
    return null;
  }
  function selectorOf(el) {
    const leaf = el.tagName.toLowerCase() + [...el.classList].map((c) => '.' + c).join(''); const p = el.parentElement; const pc = p && p.classList[0];
    return pc ? `${leaf} ‹ .${pc}` : leaf;
  }
  function recordOf(el, M) {
    const k = M.kindOf(el); const kind = kindOfFp(el, k); if (!kind) return null; const c = getComputedStyle(el);
    const names = kind === 'box' ? null : tokensAt(el).get(c.color);
    const fp = { kind, tt: c.textTransform, fs: px(c.fontSize), fw: c.fontWeight, col: kind === 'box' ? undefined : names ? `var(${names.join('|')})` : c.color, rad: px(c.borderTopLeftRadius), bw: px(c.borderTopWidth), ring: c.boxShadow && c.boxShadow !== 'none' ? c.boxShadow : 'none', bg: /rgba\([^)]*,\s*0\)|transparent/.test(c.backgroundColor) && c.backgroundImage === 'none' ? 'none' : c.backgroundColor };
    return { fp, states: hovers(el) ? { hover: 'yes' } : {}, w: selectorOf(el) };
  }

  // roles that say what a thing is; the rest (a plain button, content text, a layout box) say only what kind it is
  const GENERIC_B = /^(Neutral button|Content text|Layout boxes|Panels and cards|Small text \(Step 3\)|Link|UNASSIGNED|EXEMPT)$/;
  const specific = (b) => !!b && !GENERIC_B.test(b);
  function classify(el, M) {
    // the reviewed table first (bd/identity.js); the apply map's rule list only for what no row names, and its role counts only when it is specific
    for (const [sel, role, bucket, src] of window.BD_IDENTITY || []) { let hit = false; try { hit = el.matches(sel); } catch (e) {} if (hit) return { role, bucket, rule: 'table', src, w: selectorOf(el) }; }
    const f = recordOf(el, M); if (!f) return { role: null, bucket: null, rule: 'none', why: '', w: '' };
    const hit = classifyOne(f, f.w); return { role: specific(hit.bucket) ? hit.bucket : null, bucket: hit.bucket, rule: hit.rule, why: hit.why, src: 'the apply map\'s rule list, not reviewed', w: f.w, fp: f.fp };
  }
  window.BD_ROLES = { classify, specific, classifyOne, recordOf, RULES };
})();
