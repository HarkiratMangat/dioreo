// spec-board: Your calls. His 15:56 EDT ask: "add the /artifact-capabilities db into the spec-board so i can just choose inside of it instead of having to write it up
// in chat"; his 19:29 EDT: "why do i have to scroll and find the 'your call' sections in the actual board? why wouldn't you just put them beside their
// sections? or at the very least provide a way to jump to them?" (2026-10-09 19:37 EDT). Each call is drawn where it is decided: at the head of the section it decides
// (spec.js SECCALLS, drawn by Sec) or inside the one card it decides (an engine section's C.calls). The section at the top is only an index: every call, its
// pick, and a jump that lands on the card. One subscription feeds every card. Each choice is the document calls/<id> ({ choice, note, at }) in the
// artifact's own store (only the owner writes); Claude reads it with ArtifactData. Off claude.ai there is no store: the cards show, their buttons disabled.
export function makeCalls(L) {
  const { html, useState, useEffect, Sec } = L;
  const CALLS = [
    ['defs', 'Styles', 'styles', 'The four styles as defined (no token and with one, rest and hover); they also paint every corrected copy', [['yes', 'approve'], ['no', 'not yet (say what in the note)']], 'yes'],   /* 2026-10-10 22:10 EDT: his 21:02 EDT "clear up the definition of each style" */
    ['defaults', 'Styles', 'styles', 'A tint, wash or fill with no colour token takes', [['ink', 'ink, neutral (the -realm token stays explicit)'], ['realm', 'the realm it sits in']], 'ink'],
    ['ratio', 'Colours', 'colours', 'One ratio for every colour’s lighter variant (the words on hover)', [['86', '86% on white'], ['80', '80% on white'], ['74', '74% on white'], ['68', '68% on white']], '80'],
    ['warnink', 'Colours', 'colours', 'warn-ink: derive it from warn, or keep it fixed', [['derived', 'warn 80% on white (#FF956A)'], ['fixed', 'keep #FF9E72']], 'derived'],
    ['filled', 'Set end date and Never', 'filled', 'Weapon required (an informative chip, no hover) takes', [['chip', 'the chips’ own look, as Ready and Filled'], ['tint', 'tint, without hover'], ['wash', 'wash, without hover']], 'chip'],   /* 2026-10-10 21:27 EDT: Set end date and Never decided tint in chat (his 21:02 EDT); Weapon required is still his */
    ['twins', 'On the board', 'onboard', 'The corrected copies, drawn to C0–C13 beside today’s', [['yes', 'approve'], ['no', 'not yet']], 'yes'],
    ['reveal', 'Flags', 'flags', 'The refined reveal (icon held, words fade inside the box)', [['yes', 'approve'], ['no', 'not yet']], 'yes'],
    ['q8', 'Chips and tags', 'chips', 'Q8 tags and chips that are not controls follow the control size rows', [['yes', 'yes'], ['no', 'no'], ['later', 'after my tag redesign']], null],
    ['q6', 'Chips and tags · the count box', 'chips', 'Q6 the count box stays an M 32 chip in the field', [['yes', 'yes'], ['no', 'no']], 'yes'],
    ['q7', 'The badge box', 'badge', 'Q7 one badge box: today 24 on the Manifest and a 24 square in Compare (measured)', [['20', 'XS 20 for both'], ['24', 'keep 24']], '20'],
    ['q9', 'Inputs · the colour picker', 'inputs', 'Q9 the colour picker: swatch S 24 (corner 6), panel corner 12', [['yes', 'yes'], ['no', 'no, keep today’s']], 'yes'],
    ['q10', 'Inputs · the date picker', 'inputs', 'Q10 the date picker’s day', [['32', 'M 32'], ['36', 'today 36'], ['44', 'L 44']], '32'],
    ['q11', 'Overlays', 'overlays', 'Q11 every floating surface (the drawers, the problem pop-up): corner 12, padding 20', [['yes', 'yes'], ['no', 'no']], 'yes'],
    ['q12', 'Data display', 'data', 'Q12 History’s row L 44, card corners 12, one bar thickness 4', [['yes', 'yes'], ['no', 'no']], 'yes'],
    ['q4', 'Names', null, 'Q4 the type words (switch, stepper, date-picker, colour-picker, pop-up, drawer, toast, table, card, tag, meter, tabs, segmented)', [['yes', 'use these'], ['no', 'change some (say which in the note)']], 'yes'],
  ];
  const BY = Object.fromEntries(CALLS.map((c) => [c[0], c]));
  /* one store: one subscription, every card and the index listen to it */
  const S = { db: undefined, can: false, docs: {}, busy: {}, err: '', subs: new Set() };
  const emit = () => S.subs.forEach((f) => f());
  let started = false;
  function start() { if (started) return; started = true; const C = window.claude; if (!C || typeof C.use !== 'function') { S.db = null; emit(); return; }
    (async () => { const d = await C.use('db'); S.db = d; emit(); if (!d) return; const u = await C.use('user'); S.can = u ? await u.isOwner() : true; emit();
      d.collection('calls').onSnapshot((snap) => { const m = {}; for (const x of snap.docs) m[x.id] = x.data(); S.docs = m; emit(); }, (e) => { S.err = e.code; emit(); }); })(); }
  function useStore() { const [, set] = useState(0); useEffect(() => { start(); const f = () => set((n) => n + 1); S.subs.add(f); return () => S.subs.delete(f); }, []); return S; }
  async function save(id, patch) { if (!S.db || S.busy[id]) return; const cur = S.docs[id] || {}; const next = { choice: cur.choice || null, note: cur.note || '', ...patch, at: new Date().toISOString() };
    if (next.choice === (cur.choice || null) && next.note === (cur.note || '')) return; S.busy[id] = true; emit();
    try { await S.db.doc('calls/' + id).set(next); } catch (e) { S.err = e.code || 'unavailable'; } finally { S.busy[id] = false; emit(); } }
  const labelOf = (id, v) => ((BY[id][4].find(([k]) => k === v) || [])[1]) || '';
  /* the card itself, drawn where the call is decided */
  function CallCard({ id }) {
    const st = useStore(); const [cid, where, , q, opts, rec] = BY[id] || []; if (!cid) return null; const d = st.docs[id] || {}; const ro = st.db === null || !st.can;
    return html`<div class=${'callc' + (d.choice ? ' chosen' : '')} id=${'call-' + id}>
      <div class="call-h"><span class="call-y">your call</span>${d.at ? html`<span class="call-at">chosen ${new Date(d.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>` : null}</div>
      <p class="call-q">${q}</p>
      <div class="call-o" role="group" aria-label=${q}>${opts.map(([v, t]) => html`<button type="button" class=${'call-b' + (d.choice === v ? ' on' : '')} aria-pressed=${d.choice === v ? 'true' : 'false'} disabled=${ro || st.busy[id]} onClick=${() => save(id, { choice: v })}>${t}${rec === v ? html`<em>my pick</em>` : null}</button>`)}</div>
      <textarea class="call-n" rows="1" placeholder="note (optional)" disabled=${ro} value=${d.note || ''} onBlur=${(e) => save(id, { note: e.target.value.trim() })}></textarea></div>`;
  }
  /* a jump that lands on the card: a card in a hidden board-copy section asks the toggle to show copies first, then flashes once it is in view */
  function jumpToCall(id) { const go = () => { const el = document.getElementById('call-' + id); if (!el) return; el.scrollIntoView({ block: 'start' }); [250, 700].forEach((t) => setTimeout(() => { const q = el.getBoundingClientRect().top; if (Math.abs(q - 84) > 40) el.scrollIntoView({ block: 'start' }); }, t));   /* a straight jump, then held: sections above can still grow as their drawings measure, and a long smooth scroll missed its card (measured) */ el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1800); };
    const el = document.getElementById('call-' + id); if (el && !el.offsetHeight) { dispatchEvent(new Event('spec-show-copies')); requestAnimationFrame(() => requestAnimationFrame(go)); } else go(); }
  function useCallsLeft() { const st = useStore(); return CALLS.filter(([id]) => !(st.docs[id] && st.docs[id].choice)).length; }
  /* the index: every call, where it lives, its pick, a jump; Q4 has no drawing, so its card is here */
  function Calls() {
    const st = useStore(); const off = st.db === null; const done = CALLS.length - useCallsLeft();
    return html`<${Sec} id="calls" title="Your calls" tag=${`${done} of ${CALLS.length} chosen`} kind="diff" hint=${off ? 'choosing works on the published board (claude.ai); here the cards only show' : 'each call sits beside the drawing it decides; jump to it from here'}>
      ${st.err ? html`<p class="cl-err">The store refused a save (${st.err}).</p>` : null}
      <ol class="callx">${CALLS.filter(([, , sec]) => sec).map(([id, where, , q]) => { const d = st.docs[id] || {}; return html`<li class=${d.choice ? 'chosen' : ''}><span class="cx-w">${where}</span><span class="cx-q">${q}</span><span class="cx-p">${d.choice ? labelOf(id, d.choice) : 'not chosen'}</span><button type="button" class="cx-j" onClick=${() => jumpToCall(id)}>jump</button></li>`; })}</ol>
      <div class="callx-own"><${CallCard} id="q4" /></div><//>`;
  }
  return { Calls, CallCard, useCallsLeft, jumpToCall, CALLS };
}
