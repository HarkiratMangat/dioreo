/* Shared shell: rail, masthead, tray, preview drawer, toast.
 * Staged ops live in sessionStorage so the tray SURVIVES page navigation — that is what makes
 * clicking between realms feel like one app rather than six documents. */
(function () {
  /* ⚠️ THE SIGNED-IN USER, FROM DISCORD'S OWN API — not a placeholder and not a guess.
   * Fetched once via GET /users/{id} with the bot token and recorded here as the public CDN
   * URLs it yields; the token never appears in this package and never needs to. In the wired
   * portal these come straight off the OAuth `identify` scope's user object, which returns the
   * same `avatar` and `banner` hashes — so this is the real shape, pre-resolved.
   * `a_` prefix on a hash means ANIMATED, which is why the banner is a .gif. */
  const USER = {
    id: '1139845545754632283',
    username: 'diorswrld',          // the @handle
    displayName: 'dior',            // global_name — what Discord shows
    avatar: 'https://cdn.discordapp.com/avatars/1139845545754632283/de36d1994e834cd75ac0b7bc3b66a6db.png?size=160',
    banner: 'https://cdn.discordapp.com/banners/1139845545754632283/a_27ab8a4882e601f3e742c54675ad2bf4.gif?size=480'
  };
  window.__USER = USER;
  /* Surfaced to the audit harness — a page can pass every geometric invariant while throwing.
   * Collected here rather than per page so no surface can forget to. */
  window.__errs = window.__errs || [];
  window.addEventListener('error', e => window.__errs.push(String(e.message)));
  window.addEventListener('unhandledrejection', e => window.__errs.push('rejection: ' + String(e.reason)));

  const REALMS = [
    { id:'season',    label:'Season',    href:'season.html',
      icon:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>' },
    { id:'armory',    label:'Armory',    href:'armory.html',
      icon:'<path d="M3 13h11l3-3h4M6 13v4M10 13v3"/><circle cx="19" cy="10" r="1.4"/>' },
    { id:'broadcast', label:'Broadcast', href:'broadcast.html',
      icon:'<path d="M4 9v6h4l6 4V5L8 9H4z"/><path d="M18 8.5a5 5 0 0 1 0 7"/>' },
    { id:'access',    label:'Access',    href:'access.html',
      icon:'<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>' },
    { id:'analytics', label:'Analytics', href:'analytics.html',
      icon:'<path d="M4 19V9M10 19V5M16 19v-6M22 19H2"/>' }
  ];

  const KEY = 'dioreo-portal-staged';
  const Store = {
    all(){ try { return JSON.parse(sessionStorage.getItem(KEY)) || []; } catch { return []; } },
    save(v){ sessionStorage.setItem(KEY, JSON.stringify(v)); Shell.renderTray(); },
    add(op){ const a = Store.all(); if (a.some(o => o.id === op.id)) return false;
      /* ⚠️ CONTRACT, enforced here because this is the ONE choke point every staging path
       * already passes through — the same reason the tray pulse lives here. An op without
       * `rows` renders on the review screen as "(no field-level preview captured)", which
       * is legible but is a hole: the commit screen exists to show what changes, and an op
       * that cannot say so defeats it. Documented in §15.1 and previously enforced by
       * nothing, which is how three ops shipped without it. Warn rather than throw — a
       * missing preview must never block a real edit. */
      if (!op.rows || !op.rows.length)
        console.warn(`[dioreo] staged op "${op.id}" carries no rows[] — Review will have no diff to show.`);
      if (!Store.inverses[op.id])
        console.warn(`[dioreo] staged op "${op.id}" has no registered inverse — discarding it will clear the record without undoing the change.`);
      /* ⚠️ THE TIER IS DERIVED HERE, from core/ops's own registry (FIX.OP_TIERS, exported by
       * .export-fixtures.mjs), and a page that states one is only ever CHECKED against it —
       * never trusted over it. §4.4 says tiers fall out of reversibility, which makes the tier
       * a property of the OP, not of the surface staging it. Before this, three surfaces typed
       * a delete as tier 3 because deleting feels destructive; core/ops says tier 1, since
       * apply() captures the whole document before removing it and the inverse is exact. The
       * export gate is for changes that CANNOT be undone, and a reversible delete is not one. */
      /* ⚠️ AND SAY SO WHEN THERE IS NOTHING TO DERIVE FROM. Ten staging sites passed a hand-typed
       * tier and no `op` at all, so OP_TIERS[undefined] was undefined, the block below was skipped,
       * and §3.9.2's "a page may still pass a tier; it is only ever checked" was false for nearly
       * half the sites in the package — silently, which is the only way it could have survived. */
      if (!op.op) console.warn(`[dioreo] staged op "${op.id}" names no op type — its tier cannot be checked against core/ops, and Review cannot say what it would run.`);
      const real = (window.FIX && window.FIX.OP_TIERS || {})[op.op];
      if (real !== undefined) {
        if (op.tier !== undefined && op.tier !== real)
          console.warn(`[dioreo] staged op "${op.id}" states tier ${op.tier}; core/ops registers "${op.op}" as tier ${real}. Using ${real}.`);
        op.tier = real;
      }
      /* 🔴 THE INTERLOCK HAS TWO HALVES AND ONLY ONE OF THEM EXISTED. Export.mark() stamps
       * `exported` on tier-3 ops that are ALREADY staged — so exporting first and staging
       * second, which is the order the one-way strip literally instructs ("Export first →",
       * then the verb unlocks), produced an op that Store.blocked() counted as blocked with
       * no way left to satisfy it short of exporting the same file twice. Measured end to
       * end: export, purge, and Review still reported "1 tier-3 change needs an export".
       * The gate is "does a copy of this data exist in this session", so it is answered here
       * as well, at staging time, from the same record. */
      if (op.tier === 3 && op.scope && Shell.Export.has(op.scope)) op.exported = true;
      /* 🔴 TWO ROW SHAPES WERE IN THE SAME STORE. Season and Broadcast stage
       * `{ field, was, becomes }`; Armory stages `[field, was, becomes]`. Review reads
       * `r[0] r[1] r[2]`, so every object-shaped op rendered its whole diff as "— — —" —
       * a commit screen showing an empty table for a change it was about to make, which is
       * the one thing that screen exists not to do. Neither shape was wrong; having two was.
       * Normalised HERE, at the one choke point every staging path already passes through,
       * so Review reads exactly one shape and no page has to be migrated to be correct. */
      if (op.rows) op.rows = op.rows.map(r => Array.isArray(r)
        ? { field:r[0], was:r[1], becomes:r[2] }
        : r);
      a.push(op); Store.save(a); Shell.pulseTray(); return true; },
    remove(id){ Store.save(Store.all().filter(o => o.id !== id)); },
    clear(){ Store.save([]); },
    /* Inverses, keyed by op id. Store holds a RECORD of a change; reverting the record does
     * not by itself undo the change — that gap let a discarded item stay on the Track. */
    inverses: {},
    onInvert(id, fn){ Store.inverses[id] = fn; },
    revertAll(){ const ops = Store.all();
      ops.slice().reverse().forEach(o => { const f = Store.inverses[o.id]; if (f) { try { f(); } catch (e) {} } });
      Store.inverses = {}; Store.save([]); return ops; },
    revert(id){ const f = Store.inverses[id]; if (f) { try { f(); } catch (e) {} } delete Store.inverses[id]; Store.remove(id); },
    blocked(){ return Store.all().filter(o => o.tier === 3 && !o.exported).length; }
  };

  const Shell = {
    Store, REALMS,

    mountRail(active){
      const nav = document.querySelector('nav.rail');
      if (!nav) return;
      const n = Store.all().length;
      /* 🔴 REVIEW WAS NOT IN THE RAIL AT ALL. It is the surface every change in the portal
       * lands on — the only place anything is written — and the only ways to reach it were
       * the tray (which requires staged work to exist) and typing the URL. So the commit
       * screen was unreachable from a page with nothing staged, which is exactly when you
       * would want to check that nothing is staged.
       * It sits BELOW A RULE rather than as a sixth realm, because it is not one: five realms
       * are places to work, Review is the way out. The rule says that without a label.
       * 🔴 AND THE STAGED COUNT WAS ON THE WRONG ITEM. It rendered on Season (`r.id ===
       * 'season' && n`) whatever realm staged the work, so an Armory edit put a badge on
       * Season. The count is a property of the CHANGESET, so it belongs on Review. */
      nav.innerHTML = REALMS.map(r => `
        <a class="realm" href="${r.href}" ${r.id === active ? 'aria-current="page"' : ''}>
          <svg viewBox="0 0 24 24" aria-hidden="true">${r.icon}</svg>${r.label}
        </a>`).join('') + `
        <span class="rail-rule" aria-hidden="true"></span>
        <a class="realm out ${n ? 'has' : ''}" href="review.html" ${active === 'review' ? 'aria-current="page"' : ''}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h7"/><path d="M15 17l2.5 2.5L22 15"/></svg>Review
          ${n ? `<span class="cnt" aria-label="${n} staged">${n}</span>` : ''}
        </a>`;
    },

    /* 🔴 The tray is position:fixed bottom-right, so it covers whatever the page ends with —
     * measured: it sat on top of the one-way strip's last row and hid that row's button
     * entirely. A fixed panel that can hide a control is the same defect as an action bar
     * 1,682px below the fold, so it takes the same fix: reserve the space it occupies.
     * Written on `main` rather than `body` because `main` IS the scroll container here. */
    reserveForTray(){
      const m = document.querySelector('main'), t = document.querySelector('.tray');
      if (!m) return;
      const bar = document.getElementById('selbar');
      const need = Math.max(
        t && !t.hidden ? t.getBoundingClientRect().height + 34 : 0,
        bar ? bar.firstChild.getBoundingClientRect().height + 40 : 0);
      if (need > 0) m.style.paddingBottom = need + 'px'; else m.style.removeProperty('padding-bottom');
      /* Observed once, not per render. A one-shot call after renderTray was NOT reliable —
       * the tray's height depends on webfont metrics and on its own collapsed state, both of
       * which settle after the frame that renders it, so a single rAF measured the wrong box
       * often enough to leave the overlap live. An observer measures whenever the truth
       * changes, which is the only schedule that cannot be raced. */
      if (t && !Shell._trayRO && window.ResizeObserver) {
        Shell._trayRO = new ResizeObserver(() => {
          const mm = document.querySelector('main'); if (!mm) return;
          const tt = document.querySelector('.tray'), bb = document.getElementById('selbar');
          const n = Math.max(
            tt && !tt.hidden ? tt.getBoundingClientRect().height + 34 : 0,
            bb ? bb.firstChild.getBoundingClientRect().height + 40 : 0);
          if (n > 0) mm.style.paddingBottom = n + 'px'; else mm.style.removeProperty('padding-bottom');
        });
        Shell._trayRO.observe(t);
      }
    },

    renderTray(){
      const t = document.querySelector('.tray');
      if (!t) return;
      const ops = Store.all();
      t.hidden = ops.length === 0;
      if (!ops.length) return;
      const blocked = Store.blocked();
      t.innerHTML = `
        <div class="tray-h" role="button" tabindex="0" aria-expanded="true">
          <span class="t">Staged</span><span class="n">${ops.length} change${ops.length>1?'s':''}</span>
        </div>
        <div class="rounds">${ops.map(o => `
          <div class="round ${o.tier===3?'t3':''}">
            <span class="tier">T${o.tier}</span><b>${o.name}</b> ${o.verb||'added'}
          </div>`).join('')}</div>
        <div class="tray-f">
          <button class="btn no" data-act="discard">Discard</button>
          <button class="btn go" data-act="review">Review &amp; commit</button>
        </div>
        ${blocked ? `<p class="hint">${blocked} tier-3 change${blocked>1?'s':''} need${blocked>1?'':'s'} an export before it will commit.</p>` : ''}`;
      /* The header has always been marked up `role="button" aria-expanded` and nothing
       * listened to it — an affordance that promises an interaction it does not have,
       * which is the same class of defect audit rule 3 exists to catch. It also left the
       * tray with no way out from on top of the page: it is `position:fixed` bottom-right,
       * so a tall changeset can cover a control (measured on Broadcast: it sat over
       * "+ New announcement") with nothing the reader could do about it. Collapsing is
       * remembered, so it stays out of the way across pages. */
      const th = t.querySelector('.tray-h');
      const setOpen = open => {
        t.classList.toggle('collapsed', !open);
        th.setAttribute('aria-expanded', String(open));
        try { sessionStorage.setItem(KEY + '-open', open ? '1' : '0'); } catch (e) {}
      };
      /* Default CLOSED, not open. The tray is a status object: its job is to say that staged
       * work exists and offer the two verbs, and it does both collapsed. Defaulting to the
       * full list put a 269px floating panel over page content on every realm from the first
       * paint — the reader had to dismiss the portal's own chrome before reading the realm. */
      setOpen(sessionStorage.getItem(KEY + '-open') === '1');
      requestAnimationFrame(() => Shell.reserveForTray());
      th.onclick = () => setOpen(t.classList.contains('collapsed'));
      th.onkeydown = e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); th.click(); }
      };

      t.querySelector('[data-act=discard]').onclick = () => {
        const undone = Store.revertAll();
        Shell.toast(`Discarded ${undone.length} staged change${undone.length>1?'s':''}.`);
        Shell.onAfterRevert && Shell.onAfterRevert();
      };
      t.querySelector('[data-act=review]').onclick = () => { location.href = 'review.html'; };
    },

    toast(msg, actionLabel, onAction){
      document.querySelector('.toast')?.remove();
      const el = document.createElement('div');
      el.className = 'toast'; el.setAttribute('role','status');
      el.innerHTML = `<span>${msg}</span>` + (actionLabel ? `<button type="button">${actionLabel}</button>` : '');
      document.body.appendChild(el);
      if (actionLabel) el.querySelector('button').onclick = () => { onAction && onAction(); el.remove(); };
      setTimeout(() => el.remove(), 6000);
    },

    /* A panel with a real structure — eyebrow + title + close, a scrolling body, and a
     * sticky action footer — behind a scrim. The first version was a 340px slab of the
     * darkest token with 14px of padding and no shell, which read as pasted on. */
    drawer({ eyebrow, title, body, actions, wide, side }){
      let sc = document.querySelector('.scrim');
      if (!sc){ sc = document.createElement('div'); sc.className = 'scrim';
        sc.addEventListener('click', () => Shell.closeDrawer()); document.body.appendChild(sc); }
      let d = document.querySelector('.drawer');
      if (!d){ d = document.createElement('aside'); d.className = 'drawer';
        d.setAttribute('role','dialog'); d.setAttribute('aria-modal','true'); document.body.appendChild(d); }
      d.classList.toggle('wide', !!wide);
      d.classList.toggle('side', !!side);
      d.innerHTML = `
        <header class="dw-h">
          <div class="dw-ttl">
            ${eyebrow ? `<span class="dw-eye">${eyebrow}</span>` : ''}
            <h2>${title}</h2>
          </div>
          <button class="x" aria-label="Close">&#10005;</button>
        </header>
        <div class="dw-b">${body}</div>
        ${actions ? `<footer class="dw-f">${actions}</footer>` : ''}`;
      requestAnimationFrame(() => { sc.classList.add('on'); d.classList.add('open'); });
      sc.classList.add('on'); d.classList.add('open');
      d.querySelector('.x').addEventListener('click', () => Shell.closeDrawer());
      d.querySelector('.dw-b input,.dw-b button,.dw-f button')?.focus();
      return d;
    },
    closeDrawer(){
      document.querySelector('.drawer')?.classList.remove('open');
      document.querySelector('.scrim')?.classList.remove('on');
    },

    /* Tier-3 actions all need the same shape: name the operation, say what it does in
     * plain words, label the button with the ACTION rather than "OK". One place, so the
     * wording cannot drift between the pages that raise them. */
    confirm({ title, body, confirm, danger, op, tier, onConfirm }){
      /* The confirm dialog PRINTS a tier in its eyebrow, so it must be held to the same rule as
       * Store.add — season.html rendered "season.discardDraft · tier 3" for an op core/ops
       * registers as tier 2. A dialog that misstates the weight of what it is about to do is
       * worse than one that says nothing. */
      const realTier = (window.FIX && window.FIX.OP_TIERS || {})[op];
      if (realTier !== undefined) {
        if (tier !== undefined && tier !== realTier)
          console.warn(`[dioreo] confirm for "${op}" states tier ${tier}; core/ops registers ${realTier}. Using ${realTier}.`);
        tier = realTier;
      }
      Shell.drawer({
        eyebrow: op ? `${op} · tier ${tier || 3}` : `tier ${tier || 3}`,
        title, body,
        actions: `<button class="btn" id="dw-cancel">Cancel</button>
                  <button class="btn ${danger ? 'dang' : 'go'}" id="dw-ok">${confirm}</button>`
      });
      document.getElementById('dw-cancel').onclick = () => Shell.closeDrawer();
      const ok = document.getElementById('dw-ok');
      ok.onclick = () => { Shell.closeDrawer(); onConfirm && onConfirm(); };
      ok.focus();
    },

    /* ══════════ THE PAGE OWNS ITS OWN STARTING SCROLL POSITION ══════════
     * 🔴 `main` IS THE SCROLL CONTAINER (app.css: `main{overflow:auto}` inside `.app{height:100vh}`),
     * so `window.scrollY` is ALWAYS 0 here and `document.documentElement.scrollHeight` ALWAYS equals
     * `innerHeight`. A previous investigation read exactly those two numbers, concluded "there was
     * nothing to scroll", and closed a reproduced bug as non-reproducible. Both numbers were healthy
     * and neither could ever have shown the fault — measure the element that scrolls.
     *
     * WHAT IS MEASURED: on a cold load, Season lands at exactly `scrollHeight - clientHeight` — the
     * precise bottom — with ~39 manifest rows inserted after first paint. Five of five cold loads;
     * zero of roughly fifty once the assets were warm. Width is NOT the variable: 900px is clean
     * when warm, so an earlier "narrow viewports only" reading was wrong.
     * WHAT IS NOT: which late mechanism moves it. Scroll anchoring, a restored offset and a stray
     * focus all produce this signature and none has been isolated.
     * So the fix is the one that holds for all three rather than a guess at which: the page ASSERTS
     * its own opening position once the first render is genuinely finished, and never again. It
     * stands down the instant a real user gesture arrives, so it can never fight someone scrolling. */
    holdTop(){
      Shell.installTips();
      /* After layout, and again whenever the layout changes — a placeholder fits or does not fit
       * only relative to a rendered field. */
      const fit = () => { Shell.fitPlaceholders(); Shell.inkFills(); Shell.reserveForTray(); };
      requestAnimationFrame(() => requestAnimationFrame(fit));
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
      let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 120); });
      const m = document.querySelector('main'); if (!m) return;
      let touched = false;
      const release = () => { touched = true; off(); };
      const off = () => ['wheel','keydown','pointerdown','touchstart'].forEach(e =>
        window.removeEventListener(e, release, true));
      ['wheel','keydown','pointerdown','touchstart'].forEach(e =>
        window.addEventListener(e, release, true));
      const settle = () => { if (!touched && m.scrollTop !== 0) m.scrollTop = 0; };
      requestAnimationFrame(() => requestAnimationFrame(settle));
      /* Fonts change every row's height, so the reflow they cause is the last thing that can
       * move the scroller before the page is really at rest. */
      (document.fonts ? document.fonts.ready : Promise.resolve())
        .then(() => requestAnimationFrame(settle)).then(off, off);
      setTimeout(off, 4000);
    },

    /* ══════════ EVERY FILLED SURFACE GETS ITS OWN INK ══════════
     * 🔴 FIXING THIS PER CALL SITE IS HOW IT COMES BACK. `--ci` was added by hand to Season's bars
     * and Season's state badges, and the very next audit run found "SAVED" at **1.19:1 on
     * Broadcast** — the same component, the same defect, a different file. Any element carrying an
     * inline `--c` that renders as a FILLED surface needs the ink that colour can actually carry,
     * so it is computed once, here, for all of them. Runs after layout and after fonts, because a
     * background is only knowable once painted. */
    inkFills(root = document){
      /* ⚠️ NOT EVERY FILLED SURFACE DECLARES AN INLINE `--c`. Broadcast's state badge takes its
       * background from a class, so the first version skipped it entirely and it rendered at
       * 1.19:1 — the same component that had just been fixed on Season, one file over. Read the
       * COMPUTED background for the badge families too, so the rule follows the pixels rather
       * than following how a particular page happened to author them. */
      const rgbHex = c => { const p = (c.match(/[\d.]+/g) || []).slice(0,3).map(Number);
        return p.length === 3 ? '#' + p.map(v => Math.round(v).toString(16).padStart(2,'0')).join('') : null; };
      root.querySelectorAll('.stt,.bdg,.rec-tag,.bc-meta,.pill.on,.att-go').forEach(el => {
        const bg = getComputedStyle(el).backgroundColor;
        if (!bg || bg === 'rgba(0, 0, 0, 0)' || /, 0\)$/.test(bg)) return;
        const hex = rgbHex(bg); if (hex) el.style.setProperty('--ci', Shell.inkOn(hex));
      });
      root.querySelectorAll('[style*="--c"]').forEach(el => {
        const c = el.style.getPropertyValue('--c').trim();
        if (!c || !/^#[0-9a-f]{3,8}$/i.test(c)) return;
        const cs = getComputedStyle(el);
        /* Filled means the element's own background actually resolves to that colour — a bordered
         * or dashed element paints its text ON THE PAGE, not on the accent, and forcing near-black
         * onto it is how an outside label ended up at 1.41:1. */
        const bg = cs.backgroundColor;
        if (!bg || bg === 'rgba(0, 0, 0, 0)' || /, 0\)$/.test(bg)) return;
        el.style.setProperty('--ci', Shell.inkOn(c));
      });
    },

    /* ══════════ A PLACEHOLDER THAT DOES NOT FIT IS A RENDERING FAULT ══════════
     * 🔴 The surface sweep measured every placeholder against its own field and found them cut on
     * SIX OF EIGHT REALMS — "…attachment or Gunsm", "Search this realm, or run ", "Paste an image
     * URL — blank". Harkirat called the first one "that text error in the placeholder", which is
     * exactly right: a sentence chopped mid-word reads as a bug, not as brevity. Fixing them one
     * input at a time is how the category comes back, so this measures and shortens ALL of them,
     * on load and on resize. The full sentence survives on `aria-label`, so nothing is lost to a
     * reader who hears it rather than sees it. */
    fitPlaceholders(root = document){
      const probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;left:-9999px';
      document.body.appendChild(probe);
      root.querySelectorAll('input[placeholder],input[data-ph-full]').forEach(inp => {
        const full = inp.dataset.phFull || inp.dataset.phOrig || inp.placeholder;
        if (!full) return;
        inp.dataset.phOrig = full;
        inp.setAttribute('aria-label', inp.getAttribute('aria-label') || full);
        const cs = getComputedStyle(inp);
        const room = inp.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2;
        probe.style.font = cs.font;
        /* Progressively shorter candidates, longest first — the first that fits wins, and an
         * empty string is a legitimate answer when the field is genuinely tiny. */
        const cands = [full, inp.dataset.phShort, full.split(/\s+[—–-]\s+/)[0],
                       full.split(/,| or /)[0], full.split(/\s+/).slice(0, 2).join(' '), ''];
        for (const c of cands) {
          if (c === undefined) continue;
          probe.textContent = c;
          if (!c || probe.getBoundingClientRect().width <= room) { inp.placeholder = c; break; }
        }
      });
      probe.remove();
    },

    /* ══════════ THE COMMAND BAR ══════════
     * A realm calls this with its own command list. Without it the input still works as a
     * launcher for whatever palette the page already has, so a page that has not been converted
     * degrades to what it had rather than to nothing. */
    commandBar({ items, run, placeholder }){
      const wrap = document.getElementById('cmdBar'), inp = document.getElementById('cbIn');
      if (!wrap || !inp) return;
      /* 🔴 THE PLACEHOLDER DID NOT FIT ITS OWN INPUT below ~900px — the surface sweep measured the
       * string against the field and found it clipped on six of eight realms. A placeholder that
       * is cut mid-word is worse than a short one: it reads as a rendering fault, which is exactly
       * what Harkirat called it when he saw "…attachment or Gunsm". The aria-label keeps the full
       * sentence, so nothing is lost to anyone reading it aloud. */
      if (placeholder) { inp.dataset.phFull = placeholder; inp.setAttribute('aria-label', placeholder); }
      /* 🔴 IDEMPOTENT ON PURPOSE. mountHeader installs a default bar so that EVERY realm has a
       * working one — a page that shows a command input which does nothing is worse than a page
       * with no input at all, and that is exactly what the first version shipped on the seven
       * realms that had no palette of their own. A realm then calls this again with its own
       * richer list; without this guard that second call would stack a duplicate set of
       * listeners and every keystroke would paint twice. */
      Shell._cb = { items, run };
      if (Shell._cbBound) return;
      Shell._cbBound = true;
      items = () => Shell._cb.items();
      run = c => Shell._cb.run(c);
      const drop = document.getElementById('cbDrop'), list = document.getElementById('cbList');
      let sel = 0, hits = [];
      const close = () => { drop.hidden = true; inp.setAttribute('aria-expanded','false'); wrap.classList.remove('on'); };
      const paint = () => {
        const t = inp.value.toLowerCase().trim();
        hits = items().filter(c => !t || c.k.toLowerCase().includes(t));
        sel = Math.min(sel, Math.max(0, hits.length - 1));
        list.innerHTML = hits.length
          ? hits.map((c, i) => `<button class="pitem${i === sel ? ' sel' : ''}" role="option"
              aria-selected="${i === sel}" data-i="${i}"><i style="--c:${c.hex || `var(--${c.c || 'ink3'})`}"></i>${c.k}</button>`).join('')
          : `<p class="pnone">Nothing matches “${inp.value.trim()}”. Try a realm name, or an action like “new draw”.</p>`;
        list.querySelectorAll('.pitem').forEach(b => b.onclick = () => { const c = hits[+b.dataset.i]; close(); inp.value = ''; run(c); });
        list.querySelector('.sel')?.scrollIntoView({ block:'nearest' });
        drop.hidden = false; inp.setAttribute('aria-expanded','true'); wrap.classList.add('on');
      };
      /* 🔴 EVERY PAGE LOADED WITH THE PALETTE ALREADY OPEN, and the cause is one line: the
       * audit's own focus-ring sweep calls `el.focus()` on every input on the page, which fired
       * this `focus` handler and painted the dropdown. The page opened, the audit ran, and the
       * command bar unrolled itself on all eight realms. A dropdown must open on INTENT, not on
       * focus — programmatic focus is not intent, and `preventScroll` does not make it so. */
      inp.addEventListener('pointerdown', paint);
      inp.addEventListener('input', () => { sel = 0; paint(); });
      /* Leaving the field closes it, after a beat so a click on a result still lands. */
      inp.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== inp) close(); }, 130));
      inp.addEventListener('keydown', e => {
        if (e.key === 'Escape') { inp.value = ''; close(); inp.blur(); return; }
        if (drop.hidden && (e.key === 'ArrowDown' || e.key.length === 1)) paint();
        if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, hits.length - 1); e.preventDefault(); paint(); }
        else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); e.preventDefault(); paint(); }
        else if (e.key === 'Enter' && hits[sel]) { const c = hits[sel]; inp.value = ''; close(); inp.blur(); run(c); }
      });
      document.addEventListener('pointerdown', e => { if (!wrap.contains(e.target)) close(); });
      document.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inp.focus(); inp.select(); }
      });
      window.__openPalette = () => { inp.focus(); inp.select(); paint(); };
    },

    /* The floor every realm gets for free: move between realms, review what is staged, sign out.
     * A realm with more to offer calls commandBar again and replaces this list. */
    defaultCommands(){
      return [
        ...REALMS.map(r => ({ k: 'Go to ' + r.label, c: 'ink3', run: () => location.href = r.href })),
        { k: 'Review staged changes', c: 'ok',  run: () => location.href = 'review.html' },
        { k: 'Sign out',              c: 'del', run: () => document.getElementById('hdrOut')?.click() }
      ];
    },

    /* ══════════ THE INK A COLOURED SURFACE CAN CARRY ══════════
     * 🔴 A THRESHOLD IS A GUESS; THE RATIO IS A FACT. The first version picked dark-or-light by
     * comparing the surface's luminance to 0.34, which put white text on Events' blue at 3.08:1
     * when black on the same blue measures 5.97:1. Compute BOTH candidates and take the winner —
     * there are only two, so there is no reason to estimate. Shared here because bars, badges and
     * chips all have the same problem and were each solving it differently, or not at all. */
    inkOn(hex){
      const lum = h => { const v = [1,3,5].map(i => parseInt(h.slice(i, i+2), 16) / 255)
          .map(x => x <= 0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055, 2.4));
        return 0.2126*v[0] + 0.7152*v[1] + 0.0722*v[2]; };
      const L = lum(hex.length === 4 ? '#' + hex.slice(1).replace(/./g, c => c + c) : hex);
      const dark = (L + 0.05) / 0.05, light = 1.05 / (L + 0.05);
      return dark >= light ? '#07090A' : '#FFFFFF';
    },

    /* ══════════ ONE TOOLTIP, AND IT IS OURS ══════════
     * A native `title` is OS chrome: grey, delayed, unstyled, and it renders UNDER the pointer,
     * so it covers the very thing it describes. The cluster readout shipped as one while `.tip`
     * sat defined and unused. Anything a person is meant to READ uses `data-tip`; `title` is
     * reserved for supplementary hints an assistive user can already reach another way.
     * Delegated from the document so it survives every innerHTML rebuild the Track performs. */
    installTips(){
      if (Shell._tipsOn) return; Shell._tipsOn = true;
      let el = null;
      const kill = () => { el && el.remove(); el = null; };
      const show = (t, host) => {
        kill();
        el = document.createElement('div'); el.className = 'tip'; el.setAttribute('role','tooltip');
        el.innerHTML = t.split('\n').map((l, i) => i ? `<span class="sub">${l}</span>` : l).join('');
        document.body.appendChild(el);
        const r = host.getBoundingClientRect(), b = el.getBoundingClientRect();
        /* Beside the mark, never over it: prefer right, flip left at the edge, clamp vertically. */
        let x = r.right + 10, y = r.top + r.height / 2 - b.height / 2;
        if (x + b.width > innerWidth - 8) x = Math.max(8, r.left - b.width - 10);
        el.style.left = Math.round(x) + 'px';
        el.style.top = Math.round(Math.min(Math.max(8, y), innerHeight - b.height - 8)) + 'px';
      };
      const find = e => e.target.closest && e.target.closest('[data-tip]');
      document.addEventListener('pointerover', e => { const h = find(e); if (h) show(h.dataset.tip, h); });
      document.addEventListener('pointerout',  e => { if (find(e)) kill(); });
      document.addEventListener('focusin',  e => { const h = find(e); if (h) show(h.dataset.tip, h); });
      document.addEventListener('focusout', kill);
      document.addEventListener('keydown', e => { if (e.key === 'Escape') kill(); });
      window.addEventListener('scroll', kill, true);
    },

    /* ══════════ THE COMPOSER — the portal's answer to `/manage`'s creation path ══════════
     * `/manage` creates by asking you to type a formatted string into a Discord modal, which is
     * why every one of its seven pages ships a "Guide" action: the format has to be documented
     * because the format is the interface. A patch note there takes FOUR modals (Date/Info,
     * URLs 1, URLs 2, Add New Season) purely because a Discord modal caps at five inputs.
     * A form needs no guide, and it has no cap. That is the whole opportunity, so it lives at
     * Shell level and every realm gets the same one rather than growing its own.
     *
     * 🔴 TYPE FIRST, AND THE FORM IS THE SCHEMA. Picking the type picks the SHAPE, so nothing
     * below it exists until it is chosen — and a type whose record has one date shows one date
     * field. season.html's old add-row offered `start` AND `end` for every type, including
     * draws, which have exactly one field (`date`) and no end at all in models/SeasonalData.js.
     * A creation form that asks for data the record cannot hold is the same defect the Track
     * had when it painted a draw as a band, one layer up. */
    /* 🔴 A MODAL WAS THE WRONG CONTAINER, and it took Harkirat asking "why is this buried in a
     * pop-up" to see it. `/manage`'s creation flow IS a Discord modal — reproducing that shape is
     * reproducing the thing the portal exists to beat. `host` renders the same composer INLINE,
     * in the page, so creation is a place you already are rather than a room you travel to. The
     * drawer path is kept for surfaces that genuinely have nowhere to put a bar. */
    compose({ title = 'New item', eyebrow = 'create', types, initial = {}, preview, onStage, host, onClose }){
      const st = { type: initial.type || null, name: initial.name || '',
                   a: initial.a || '', b: initial.b || '' };
      const typeOf = k => types.find(t => t.key === k) || null;

      const chips = () => types.map(t => `
        <button type="button" class="nw-chip${st.type === t.key ? ' on' : ''}" data-nwtype="${t.key}"
                style="--c:${t.hex}" aria-pressed="${st.type === t.key}">
          <span class="nw-dot"></span>${t.label}
          <em>${t.shape === 'point' ? 'one date' : 'a window'}</em>
        </button>`).join('');

      /* The fields a type actually has — never a union of every type's fields with the
       * irrelevant ones disabled, which is how a form starts lying about the record. */
      const fields = () => {
        const t = typeOf(st.type);
        if (!t) return `<p class="nw-hint">Pick what you are adding. The form follows the record &mdash; a release asks for one date, a window asks for two.</p>`;
        const one = t.shape === 'point';
        /* Each field is its own box so the inline bar can lay them out on ONE row. Before this
         * the labels and inputs were bare siblings, which forced a stacked column — and a
         * stacked composer pushed the Track (the preview) off the bottom of the screen, which
         * defeats the entire reason it is inline. */
        return `
          <div class="nw-f nw-f-name">
            <label class="nw-l" for="nw-name">${t.nameLabel || 'Name'}</label>
            <input class="nw-i" id="nw-name" type="text" autocomplete="off" spellcheck="false"
                   placeholder="${t.placeholder || ''}" value="${st.name.replace(/"/g,'&quot;')}">
          </div>
          <div class="nw-dates${one ? ' one' : ''}">
            <div><label class="nw-l" for="nw-a">${one ? (t.dateLabel || 'Releases') : 'Opens'}</label>
              <input class="nw-i" id="nw-a" type="date" value="${st.a}"></div>
            ${one ? '' : `<div><label class="nw-l" for="nw-b">Closes</label>
              <input class="nw-i" id="nw-b" type="date" value="${st.b}"></div>`}
          </div>
          ${one ? `<p class="nw-note">${t.pointNote || 'A release has no end date &mdash; the record stores one date.'}</p>` : ''}`;
      };

      const valid = () => {
        const t = typeOf(st.type); if (!t) return 'Pick a type to continue.';
        if (!st.name.trim()) return 'Give it a name.';
        if (!st.a) return 'Set a date.';
        if (t.shape === 'span' && st.b && st.b < st.a) return 'Closes is before Opens.';
        return null;
      };

      const shell = `<div class="nw">
             <div class="nw-types" role="group" aria-label="What are you adding">${chips()}</div>
             <div class="nw-form" id="nw-form">${fields()}</div>
             <div class="nw-prev" id="nw-prev"></div>
             <div class="nw-act"><span class="nw-why" id="nw-why"></span>
               <button class="pill" id="nw-cancel">Cancel</button>
               <button class="pill lead" id="nw-go">Stage it</button></div>
           </div>`;
      let d;
      if (host) {
        host.hidden = false; host.innerHTML = shell; host.classList.add('nw-host'); d = host;
      } else {
        Shell.drawer({ eyebrow, title, wide: true,
          body: shell.replace(/<div class="nw-act">[\s\S]*?<\/div>\s*<\/div>$/, '</div>'),
          actions: `<span class="nw-why" id="nw-why"></span>
                    <button class="btn" id="nw-cancel">Cancel</button>
                    <button class="btn go" id="nw-go">Stage it</button>` });
        d = document.querySelector('.drawer');
      }
      const close = () => { if (host) { host.hidden = true; host.innerHTML = ''; } else Shell.closeDrawer(); onClose && onClose(); };
      const paint = () => {
        const t = typeOf(st.type), why = valid();
        d.querySelector('#nw-form').innerHTML = fields();
        d.querySelectorAll('[data-nwtype]').forEach(b => {
          const on = b.dataset.nwtype === st.type;
          b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
        /* 🔴 THE SIGNATURE, and the one thing `/manage` structurally cannot do: it answers
         * "when" with a line of text. Here the item is drawn where it will land, before it is
         * staged. Dashed because it is STAGED — shape carries state, so a preview of a staged
         * thing is dashed for the same reason the staged thing is. */
        d.querySelector('#nw-prev').innerHTML = preview
          ? preview({ ...st, shape: t ? t.shape : null, hex: t ? t.hex : null })
          : '';
        d.querySelector('#nw-why').textContent = why || '';
        onStage && onStage.live && onStage.live({ ...st, shape: t ? t.shape : null, hex: t ? t.hex : null, valid: !why });
        const go = d.querySelector('#nw-go');
        go.disabled = !!why;
        go.textContent = t ? `Stage ${t.single || t.label.toLowerCase()}` : 'Stage it';
        wire();
      };
      const wire = () => {
        d.querySelectorAll('[data-nwtype]').forEach(b => b.onclick = () => {
          st.type = b.dataset.nwtype;
          const t = typeOf(st.type);
          if (t && t.shape === 'point') st.b = '';
          paint();
          d.querySelector('#nw-name')?.focus();
        });
        const n = d.querySelector('#nw-name'), a = d.querySelector('#nw-a'), b = d.querySelector('#nw-b');
        if (n) n.oninput = () => { st.name = n.value; light(); };
        if (a) a.oninput = () => { st.a = a.value; light(); };
        if (b) b.oninput = () => { st.b = b.value; light(); };
        if (n) n.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); a && a.focus(); } };
      };
      /* Repaint the preview and the gate WITHOUT rebuilding the inputs — re-rendering the form
       * on every keystroke is how a field loses focus and the caret jumps to the end. */
      const light = () => {
        const t = typeOf(st.type), why = valid();
        /* The page may draw its own preview — on Season that is a real ghost in the real lane. */
        onStage && onStage.live && onStage.live({ ...st, shape: t ? t.shape : null, hex: t ? t.hex : null, valid: !why });
        d.querySelector('#nw-prev').innerHTML = preview
          ? preview({ ...st, shape: t ? t.shape : null, hex: t ? t.hex : null }) : '';
        d.querySelector('#nw-why').textContent = why || '';
        d.querySelector('#nw-go').disabled = !!why;
      };
      d.querySelector('#nw-cancel').onclick = close;
      d.querySelector('#nw-go').onclick = () => {
        if (valid()) return;
        const t = typeOf(st.type);
        close();
        onStage && onStage({ type: st.type, name: st.name.trim(), a: st.a,
                             b: t.shape === 'point' ? st.a : (st.b || st.a), shape: t.shape });
      };
      paint();
      if (st.type) d.querySelector('#nw-name')?.focus();
      return d;
    },

    /* The preview is the bot's OWN render shape — a truthful preview, not an approximation. */
    discordCard({ accent, title, sub, rows, badges, code }){
      return `<div class="dcard" style="--c:${accent}">
        <h6>${title}</h6><div class="sub">${sub}</div>
        ${(rows||[]).map(r => `<div class="row"><b>${r[0]}</b><span>${r[1]}</span></div>`).join('')}
        ${badges&&badges.length ? `<div class="badges" style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap">${
          badges.map(b=>`<span style="background:#1E1F22;border-radius:4px;padding:2px 7px;font-size:10px;color:#B5BAC1">${b}</span>`).join('')}</div>`:''}
        ${code ? `<div style="margin-top:9px;background:#1E1F22;border-radius:4px;padding:6px 8px;font-family:var(--data);font-size:10.5px;color:#A8B0B8;letter-spacing:.04em">${code}</div>`:''}
      </div>`;
    },

    /* ══════════ SHARED INVARIANT AUDIT ══════════
     * Every rule here was earned by a real defect, and every one is checked across EVERY
     * matching element rather than the one that happened to be on screen — checking the
     * instance just changed is precisely how three separate display:flex bugs shipped.
     * Any page can call this; it reports to window.__selfCheck and the console. */
    /* Every staging path funnels through Store.add, so the acknowledgement lives here once
     * rather than being remembered at each call site. */
    pulseTray(){
      const badge = document.querySelector('.realm[aria-current] .rbadge, .tray-h .n');
      if (badge) { badge.classList.remove('count-bump'); void badge.offsetWidth;
                   badge.classList.add('count-bump'); }
      const tray = document.querySelector('.tray');
      if (tray) { tray.classList.remove('staged-pulse'); void tray.offsetWidth;
                  tray.classList.add('staged-pulse'); }
    },

    /* ⚠️ GEOMETRY IS MEASURED BEFORE WEBFONTS LOAD unless we wait for them.
     * Caught 2026-08-24 on broadcast.html: rule 2 reported five `.nums` cells "short of
     * their row", and a re-run after `document.fonts.status === 'loaded'` was clean — the
     * cells were never short, the fallback font simply produced a different row height at
     * measure time. Every page had been auditing pre-font layout; it only crossed the 1px
     * threshold here. So: run immediately (so a caller still gets a synchronous answer),
     * then re-run once fonts settle and let THAT result be the authoritative one.
     * Deliberately NOT deferred through requestAnimationFrame — rAF never fires in a
     * background tab, which is how ruler masking silently never ran (COMPANION §14).
     * `document.fonts.ready` resolves regardless of tab visibility. */
    audit(opts = {}){
      const first = Shell._audit(opts);
      if (document.fonts && document.fonts.status !== 'loaded') {
        first.pending = true;
        document.fonts.ready.then(() => Shell._audit(opts));
      }
      return first;
    },

    _audit({ states, extra, interactions } = {}){
      /* ⚠️ ORDER, NOT LOGIC. `inkFills()` runs from `holdTop()` inside a requestAnimationFrame, so
       * the audit's first synchronous pass measured the state BEFORE it — and reported Broadcast's
       * state badge at 1.19:1 twice after the fix was already correct. An audit must measure the
       * page as it settles, so it settles the derived parts first. Idempotent, so calling it here
       * costs nothing. */
      Shell.inkFills();
      const problems = [];
      const px = v => parseFloat(v) || 0;
      const clear = 'rgba(0, 0, 0, 0)';

      // 1. A <td> with display:flex stops stretching to the row height — the black bar.
      document.querySelectorAll('td').forEach(td => {
        if (getComputedStyle(td).display === 'flex') problems.push(`td.${td.className} is display:flex`);
      });
      document.querySelectorAll('tbody tr').forEach((tr, i) => {
        const rh = tr.getBoundingClientRect().height;
        if (!rh) return;
        [...tr.children].forEach(td => {
          /* A cell hidden at this breakpoint has height 0 and would ALWAYS read as short.
           * Because of that, this rule could never pass at mobile width on any page — and
           * it never had, because the audit had only ever been run at desktop size.
           * Measured 2026-08-24 at 390px: five false failures per page. */
          if (getComputedStyle(td).display === 'none') return;
          if (rh - td.getBoundingClientRect().height > 1)
            problems.push(`row ${i} cell .${td.className || '?'} is short of its row`);
        });
      });

      // 2. Hover must LIFT, never sink below the surface it sits on.
      // 3. A cursor promises an interaction; decoration must not claim one.
      document.querySelectorAll('[class*="mini"],[class*="masked"],.season-end,.scrub-label')
        .forEach(el => {
          const c = getComputedStyle(el);
          if (/resize|grab|pointer/.test(c.cursor) && c.pointerEvents !== 'none')
            problems.push(`decorative .${el.className} offers cursor:${c.cursor}`);
        });

      // 4. Dashed means STAGED. Anything live must not be dashed.
      document.querySelectorAll('[data-live="1"]').forEach(el => {
        const c = getComputedStyle(el);
        if (c.borderLeftStyle === 'dashed' || c.borderTopStyle === 'dashed')
          problems.push(`.${el.className} is dashed but is live`);
      });

      // 5. Every visible interactive element must show a focus ring.
      const noFocus = [...document.querySelectorAll('button,input,select,[tabindex]:not([tabindex="-1"])')]
        .filter(el => el.offsetParent !== null)
        .filter(el => { try { el.focus({ preventScroll:true }); } catch(e){ return false; }
          const o = getComputedStyle(el);
          return px(o.outlineWidth) === 0 && o.boxShadow === 'none'; });
      if (noFocus.length) problems.push(`${noFocus.length} focusable element(s) show no focus ring`);
      document.activeElement && document.activeElement.blur();

      /* 5b. NOTHING A PERSON MUST READ MAY LIVE IN A NATIVE `title`. Twenty-three of them did,
       *     including the cluster readout, which is content — it names the items and explains why
       *     they are grouped. A native title is grey OS chrome, appears under the pointer, and
       *     cannot be styled or positioned. The threshold is length: a short hint is a hint, a
       *     sentence is content. */
      document.querySelectorAll('[title]').forEach(el => {
        const t = (el.getAttribute('title') || '').trim();
        if (t.length > 24 && !el.hasAttribute('data-tip'))
          problems.push(`native title carries ${t.length} chars of content: "${t.slice(0,40)}…" — use data-tip`);
      });

      /* 5c. A LABEL MAY NOT TRUNCATE WHILE THERE IS ROOM BESIDE IT. "Attack of …", "Safeguar…",
       *     "Nuketown…" — all three had empty track to their right. Truncating inside the bar is
       *     the LAST resort in a timeline, not the first. */
      document.querySelectorAll('.bar .bl').forEach(l => {
        if (l.scrollWidth <= l.clientWidth + 1) return;
        const bar = l.closest('.bar'), tk = bar && bar.closest('.tk'); if (!tk) return;
        const br = bar.getBoundingClientRect(), tr = tk.getBoundingClientRect();
        const room = Math.max(tr.right - br.right, br.left - tr.left);
        if (room > l.scrollWidth + 12 && !bar.classList.contains('lbl-out'))
          problems.push(`"${l.textContent.trim()}" is truncated with ${Math.round(room)}px free beside it`);
      });

      /* 5d. NO TEXT ON AN IMAGE WITHOUT A PLATE. Legibility that depends on which photograph the
       *     user happened to upload is not a design decision, it is a coin toss. */
      document.querySelectorAll('[style*="url("],[style*="--banner"],[style*="--av-src"]').forEach(host => {
        if (getComputedStyle(host).backgroundImage === 'none') return;
        [...host.children].forEach(ch => {
          if (!ch.textContent.trim()) return;
          const ok = ch.closest('.plate') || getComputedStyle(ch).backgroundColor !== 'rgba(0, 0, 0, 0)';
          if (!ok) problems.push(`"${ch.textContent.trim().slice(0,24)}" sits on an image with no plate`);
        });
      });

      /* 5e. A COMMAND BAR THAT THROWS IS INVISIBLE. `defaultCommands()` referenced `RAILS`; the
       *     array is called `REALMS`. It threw inside a focus handler, so seven realms shipped a
       *     search box that silently did nothing while every other check passed. Anything whose
       *     only failure mode is "produces nothing when touched" has to be TOUCHED by the audit,
       *     not looked at. */
      if (document.getElementById('cbIn')) {
        try {
          const n = ((Shell._cb && Shell._cb.items()) || []).length;
          if (!n) problems.push('the command bar has no commands — its input does nothing');
        } catch (e) { problems.push(`the command bar throws on use: ${e.message}`); }
      }

      /* 5f. ACTUAL COMPUTED CONTRAST, on every text node that renders. Harkirat asked how a
       *     "SAVED" he could barely read passed the accessibility review, and the honest answer
       *     is that the review never measured it: the package checked TOKEN pairs by hand and
       *     assumed the elements using them inherited a matching background. An element gets its
       *     colour from one rule and its background from an ancestor three levels up; only the
       *     rendered pair is the truth. WCAG AA is 4.5:1, or 3:1 for text at 18.66px+ or bold
       *     14px+. Reported, never silently rounded. */
      {
        const lum = c => { const p = (c.match(/[\d.]+/g) || []).slice(0,3).map(Number)
            .map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
          return p.length === 3 ? 0.2126*p[0] + 0.7152*p[1] + 0.0722*p[2] : null; };
        /* ⚠️ A SEMI-TRANSPARENT BACKGROUND IS NOT THE COLOUR BEHIND THE TEXT. The first version
         * returned the first non-zero background it met, so `rgba(142,107,166,.18)` — an 18% wash
         * over a dark row — was measured as if it were solid mauve, and a tier chip that actually
         * renders at ~7:1 was reported at 1.96:1. A check that invents failures gets ignored, and
         * an ignored check is worse than none. Composite the stack instead. */
        const parse = c => (c.match(/[\d.]+/g) || []).map(Number);
        /* ⚠️ AN ANCESTOR'S BACKGROUND IS ONLY THE BACKGROUND IF THE ELEMENT SITS ON IT.
         * An outside bar-label is a DOM child of `.bar` but renders BESIDE it, on the lane — so
         * walking the DOM found the bar's blue and reported near-white text at 2.84:1 while the
         * label was actually on the dark lane at ~13:1. Measured the rule as broken THREE times
         * in a row before checking the probe: the page was right and the probe was reading a box
         * the text does not overlap. Skip any ancestor whose border-box does not CONTAIN the
         * element's rect — correct in general, not a special case for this one component. */
        const bgOf = el => {
          let n = el, acc = null;
          const r0 = el.getBoundingClientRect();
          while (n && n !== document.documentElement) {
            const rn = n.getBoundingClientRect();
            const covers = n === el ||
              (r0.left >= rn.left - 1 && r0.right <= rn.right + 1 &&
               r0.top >= rn.top - 1 && r0.bottom <= rn.bottom + 1);
            if (!covers) { n = n.parentElement; continue; }
            const p = parse(getComputedStyle(n).backgroundColor);
            if (p.length) {
              const a = p.length > 3 ? p[3] : 1;
              if (a > 0) {
                /* ⚠️ THE FIRST LAYER MUST BE PREMULTIPLIED TOO. Taking it at full strength made an
                 * 18%-alpha wash read as solid, which reported a lavender chip on a dark row at
                 * 1.59:1 — a number that is not physically possible for that pair, and the tell
                 * that the probe rather than the page was wrong. */
                if (!acc) acc = { r:p[0]*a, g:p[1]*a, b:p[2]*a, a };
                else { const ia = 1 - acc.a;
                  acc = { r:acc.r + p[0]*a*ia, g:acc.g + p[1]*a*ia, b:acc.b + p[2]*a*ia, a:acc.a + a*ia }; }
                if (acc.a >= 0.995) break;
              }
            }
            n = n.parentElement;
          }
          if (!acc) return getComputedStyle(document.body).backgroundColor;
          if (acc.a < 0.995) { const p = parse(getComputedStyle(document.body).backgroundColor), ia = 1 - acc.a;
            acc = { r:acc.r + p[0]*ia, g:acc.g + p[1]*ia, b:acc.b + p[2]*ia }; }
          return `rgb(${Math.round(acc.r)}, ${Math.round(acc.g)}, ${Math.round(acc.b)})`;
        };
        const ratio = (a, b) => { const x = lum(a), y = lum(b); if (x === null || y === null) return 21;
          const [hi, lo] = x > y ? [x, y] : [y, x]; return (hi + 0.05) / (lo + 0.05); };
        const seen = new Set(); let worst = null;
        document.querySelectorAll('main *, header *').forEach(el => {
          if (el.children.length) return;                       // leaf text only
          const t = (el.textContent || '').trim(); if (!t) return;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.1) return;
          const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
          const px = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
          const need = (px >= 18.66 || (bold && px >= 14)) ? 3 : 4.5;
          const got = ratio(cs.color, bgOf(el));
          if (got >= need) return;
          const key = cs.color + '|' + bgOf(el) + '|' + Math.round(px);
          if (seen.has(key)) return; seen.add(key);
          if (!worst || got < worst.got) worst = { got, need, t, px };
          /* ⚠️ NAME THE ELEMENT. The first version reported only the TEXT, and chasing
           * `"COD Point Rush Wee" is 2.84:1` cost three wrong guesses about which of four
           * identical-looking bars it meant — the text is the least identifying thing about a
           * repeated component. A finding that does not say WHERE is a finding you have to
           * re-derive before you can act on it. */
          const where = el.tagName.toLowerCase() +
            (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : '') +
            ' in ' + (el.parentElement ? el.parentElement.tagName.toLowerCase() +
              (typeof el.parentElement.className === 'string' && el.parentElement.className
                ? '.' + el.parentElement.className.trim().split(/\s+/).slice(0,3).join('.') : '') : '?');
          problems.push(`"${t.slice(0,18)}" is ${got.toFixed(2)}:1 at ${px}px — needs ${need}:1  [${where}]`);
        });
      }

      // 6. A legend may only name states that are actually present.
      if (states) {
        const real = new Set(states());
        document.querySelectorAll('[data-key] span, .key span').forEach(x => {
          const k = x.textContent.trim();
          if (k && !real.has(k)) problems.push(`legend claims "${k}" with none on screen`);
        });
      }

      // 7. Nothing may claim a colour that does not resolve.
      document.querySelectorAll('[style*="--c:"]').forEach(el => {
        const v = el.style.getPropertyValue('--c').trim();
        if (v.startsWith('var(--undefined') || v === '' || v === 'undefined')
          problems.push(`.${el.className} has an unresolved --c`);
      });

      /* 8. RENDERED GARBAGE. The static checks above inspect state; none of them can see a
       *    broken API contract behind a click. Shell.drawer() changed from taking an HTML
       *    string to taking an options object, one call site was missed, and the panel
       *    rendered "undefined / undefined" while the audit reported clean — because the
       *    audit had never opened it. Scan every rendered text node for the tells. */
      const GARBAGE = /\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b/;
      const scanText = (root, where) => {
        const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode: n => n.parentElement && n.parentElement.closest('script')
            ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
        let n;
        while ((n = w.nextNode())) {
          if (GARBAGE.test(n.nodeValue)) {
            problems.push(`${where} renders "${n.nodeValue.trim().slice(0, 40)}"`);
            return;
          }
        }
      };
      scanText(document.body, 'page');

      /* 9. INTERACTION SMOKE TEST. Drive every path that opens a panel and assert it
       *    produced a real title and body. This is the check that would have caught the
       *    drawer break on the turn it was introduced. */
      const wantsInteractive = /[?&]audit=1\b/.test(location.search);
      if (interactions && wantsInteractive) {
        const scrollY = window.scrollY;
        interactions().forEach(({ name, run }) => {
          try {
            run();
            const d = document.querySelector('.drawer.open');
            if (!d) { problems.push(`${name} opened no panel`); return; }
            const title = d.querySelector('.dw-h h2');
            if (!title || !title.textContent.trim() || GARBAGE.test(title.textContent))
              problems.push(`${name} panel title is "${title ? title.textContent.trim() : 'missing'}"`);
            const body = d.querySelector('.dw-b');
            if (!body || !body.textContent.trim()) problems.push(`${name} panel body is empty`);
            else scanText(body, `${name} panel`);
            Shell.closeDrawer();
          } catch (e) { problems.push(`${name} threw: ${e.message}`); }
        });
        Shell.closeDrawer();
        window.scrollTo(0, scrollY);          // leave the page exactly as it was found
      }

      /* 10. VISIBILITY. Every check above passes happily on an element that is present,
       *     correctly coloured, and completely invisible. That is not hypothetical: a
       *     staggered entrance animation applied while its parent view was [hidden] never
       *     started, `fill-mode: both` back-filled the FROM state, and all four Board
       *     columns sat at opacity 0 with a clean audit. A degenerate surface returns
       *     well-formed numbers — so assert the numbers are not degenerate. */
      document.querySelectorAll('main [id^="view"]:not([hidden])').forEach(v => {
        [...v.children].forEach(c => {
          const cs = getComputedStyle(c), r = c.getBoundingClientRect();
          if (c.getAnimations && c.getAnimations().some(a => a.playState === 'running')) return;
          if (parseFloat(cs.opacity) < 0.05)
            problems.push(`.${c.className || c.tagName} is rendered but opacity ${cs.opacity}`);
          else if (r.height < 2 && c.children.length)
            problems.push(`.${c.className || c.tagName} has children but zero height`);
        });
        [...v.querySelectorAll('.bcol,.trow,.rcard,.ccard,.lane')].forEach(c => {
          /* An entrance animation legitimately passes through opacity 0. Only a RESTING
           * element that is invisible is a defect — otherwise this fires on every load and
           * gets ignored, which is worse than not checking at all. */
          const running = c.getAnimations && c.getAnimations().some(a => a.playState === 'running');
          if (running) return;
          if (parseFloat(getComputedStyle(c).opacity) < 0.05)
            problems.push(`.${c.className} rests at opacity 0`);
        });
      });

      if (extra) problems.push(...extra());

      window.__selfCheck = { ok: problems.length === 0, problems };
      if (problems.length) console.error(`[dioreo audit] ${problems.length} problem(s):`, problems);
      else console.info('[dioreo audit] clean');
      return window.__selfCheck;
    },

    /* The chrome every realm shares: brand, breadcrumb, palette affordance, account menu.
     * Built here so a new page inherits it instead of copying it. */
    mountHeader(crumb, sub){
      const el = document.getElementById('hdr'); if (!el) return;
      el.innerHTML = `    <button class="mk" id="home" title="Home"><span class="glyph"></span>DIOREO<b>/</b>PORTAL</button>
    <span class="crumb">Season <b>›</b> <span id="crumbView">Track</span></span>
    <span class="sp"></span>
    <!-- 🔴 THE COMMAND BAR IS THE BAR, NOT A LAUNCHER FOR ONE. It used to be a 44px cmd-K chip in
         a header with ~700px of unused space, which is a keyboard shortcut wearing a button's
         clothes: it advertised a feature instead of being one. Now it is the widest thing in the
         header, it says what it does in words, and the results drop straight out of it. -->
    <div class="cmdbar" id="cmdBar">
      <span class="cb-mag" aria-hidden="true"></span>
      <input id="cbIn" class="cb-in" autocomplete="off" spellcheck="false"
             placeholder="Search this realm, or run a command" aria-label="Search this realm, or run a command"
             role="combobox" aria-expanded="false" aria-controls="cbList" aria-autocomplete="list">
      <kbd>⌘K</kbd>
      <div class="cb-drop" id="cbDrop" hidden><div class="plist" id="cbList" role="listbox"></div></div>
    </div>
    <span class="sp"></span>
    <!-- Sign out was three clicks deep in a menu, in a header with room to spare. It still
         confirms — it is the one action that discards staged work — but finding it is not the
         part that should be hard. -->
    <button class="hdr-out" id="hdrOut" data-tip="Sign out of the portal">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/></svg>
      <span>Sign out</span></button>
    <span class="who">
      <button class="whobtn" id="whoBtn" aria-expanded="false" aria-haspopup="menu">
        <span class="av" data-src style="--av-src:url('${USER.avatar}')"></span>${USER.displayName}<span class="cv" aria-hidden="true"></span></button>
      <div class="umenu" id="uMenu" role="menu" hidden>
        <div class="ubanner" style="--banner:url('${USER.banner}')" aria-hidden="true"></div>
        <div class="uhead">
          <span class="uav" style="--av-src:url('${USER.avatar}')"><i class="pres" title="Signed in"></i></span>
          <span class="uinfo">
            <span class="l1"><span class="nm">${USER.displayName}</span><span class="rolebadge">OWNER</span></span>
            <span class="id">@${USER.username}</span>
          </span>
        </div>
        <div class="usec">
          <button class="mi" role="menuitem" data-m="realm">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h12M2 8h12M2 12h12"/></svg>
            Switch realm<kbd>G</kbd></button>
          <button class="mi" role="menuitem" data-m="palette">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h10v10H3z"/><path d="M6 6h4M6 9h4"/></svg>
            Command palette<kbd>&#8984;K</kbd></button>
          <button class="mi" role="menuitem" data-m="copy">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 5h8v8H5z"/><path d="M3 11V3h8"/></svg>
            Copy Discord ID<span class="mnote">${USER.id.slice(0,4)}…${USER.id.slice(-4)}</span></button>
        </div>
        <div class="usec">
          <div class="ustat"><span>Staged changes</span><b id="uStaged">0</b></div>
          <div class="ustat"><span>Session</span><b>this browser only</b></div>
        </div>
        <div class="usec last">
          <button class="mi danger" role="menuitem" data-m="out">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3H4v10h6"/><path d="M8 8h6M12 6l2 2-2 2"/></svg>
            Sign out</button>
        </div>
      </div>
    </span>`;
      el.querySelector('.crumb').innerHTML =
        `${crumb} <b>&rsaquo;</b> <span id="crumbView">${sub || ''}</span>`;
      el.querySelector('#home').onclick = () => location.href = 'index.html';
      Shell.wireAccount();
    },

    /* The account menu's behaviour, shared for the same reason. */
    wireAccount(){
      const m = document.getElementById('uMenu'), b = document.getElementById('whoBtn');
      if (!m || !b) return;
      b.onclick = e => {
        e.stopPropagation();
        const n = Store.all().length, us = document.getElementById('uStaged');
        if (us) { us.textContent = n; us.style.color = n ? 'var(--staged)' : ''; }
        const open = m.hidden; m.hidden = !open; b.setAttribute('aria-expanded', String(open));
      };
      document.addEventListener('click', e => {
        if (!m.hidden && !m.contains(e.target)) { m.hidden = true; b.setAttribute('aria-expanded','false'); }
      });
      /* One handler, two entry points — the header button and the menu item must never be able
       * to disagree about what signing out does. */
      const signOut = () => Shell.confirm({ title:'Sign out of the portal?', tier:1, op:'session.end',
        body:`<p class="dw-p">You have <b>${Store.all().length}</b> staged change(s). Staged work
               lives in this browser session and is <b>lost on sign out</b>.</p>`,
        confirm:'Sign out', danger:true,
        onConfirm(){ Store.clear(); location.href = 'door.html'; } });
      const ho = document.getElementById('hdrOut'); if (ho) ho.onclick = signOut;
      /* Installed here, after the header exists, so no realm can ship a dead command input. */
      Shell.commandBar({ items: Shell.defaultCommands, run: c => c.run() });
      m.querySelectorAll('.mi').forEach(mi => mi.onclick = () => {
        m.hidden = true; b.setAttribute('aria-expanded','false');
        const k = mi.dataset.m;
        if (k === 'out') {
          signOut();
        } else if (k === 'copy') {
          navigator.clipboard?.writeText(USER.id); Shell.toast('Discord ID copied.');
        } else if (k === 'palette') { window.__openPalette && window.__openPalette(); }
        else Shell.toast('The realm switcher is the rail on the left.');
      });
    },

    /* ══════════════════════════════════════════════════════════════════════════════
     * DELETE AND EXPORT — the two verbs the portal exists for, and did not have.
     *
     * MEASURED 2026-08-24 21:4x EDT, across all eight pages, by .verbs.html (which proves
     * it can report PRESENCE on every page before its silence is trusted):
     *   season    delete=0 export=0  checkboxes=40  selection-bar-in-DOM=0
     *   armory    delete=0 export=1  checkboxes=32  selection-bar-in-DOM=0
     *   broadcast/access/review/index/door/analytics — nothing at all
     * against core/ops, which registers THIRTEEN destructive op types (draw.delete,
     * draw.bulkDelete, draw.purge, calendar.delete, calendar.bulkDelete, calendar.purge,
     * loadout.delete, loadout.bulkDelete, patchnote.removeSeason, patchnote.purge,
     * season.startNew, season.discardDraft, announcement.delete) and utils/manageActions,
     * which registers NINE export actions.
     *
     * 🔴 THE ACTUAL DEFECT WAS NOT ABSENCE — IT WAS DISTANCE, and that is why every check
     * missed it. Season DOES build a selection bar with "Export selection" and "Stage
     * deletion" in it. It is rendered into a div that sits in normal flow after a 39-row
     * table, so selecting the FIRST row put every verb it unlocked 1,682px BELOW THE FOLD
     * (measured at 1280x860). The word "delete" was absent from the page text only because
     * the container is [hidden] at rest. A census that counted markup would have called
     * this covered. The user selected two rows, saw two checkmarks and no consequence, and
     * was right to call it missing: an affordance nobody can see does not exist.
     *
     * SO THE RULE THIS LAYER ENCODES: an action unlocked by a selection is shown WHERE THE
     * SELECTION HAPPENED — docked to the viewport, never in document flow.
     *
     * THE SPINE. core/ops grades every op by whether it can be taken back, and the grades
     * are not decorative — they are the interaction:
     *   tier 1  an exact inverse was captured. Undo is real. Deleting one draw is tier 1.
     *   tier 2  same, but wide. Bulk delete is tier 2.
     *   tier 3  ONE-WAY. purge / startNew. Store.blocked() already refuses to let one commit
     *           until it carries `exported`, and review.html already renders that gate.
     * Everything downstream of a delete already existed — the op, the tier, the staging, the
     * inverse, the Review diff, the export interlock. The ONLY missing piece was the
     * affordance, which is why building it is wiring rather than invention.
     *
     * 🔴 SO: EXPORT IS NOT A SIDE FEATURE, IT IS THE SAFETY INTERLOCK FOR PURGE. The portal
     * makes /manage trivial by making the irreversible thing safe, not by adding buttons.
     * ══════════════════════════════════════════════════════════════════════════════ */

    /* ─────────────────────────── EXPORT ─────────────────────────── */
    Export: {
      /* Scope ids that have produced a REAL FILE this session. Session-scoped on purpose:
       * an export taken last week is not evidence that THIS operator has a copy. */
      _done: {},
      has(scope){ return !!Shell.Export._done[scope]; },
      at(scope){ const d = Shell.Export._done[scope]; return d ? d.at : 0; },

      /* Recording an export unblocks staged tier-3 ops that name THIS scope — and only this
       * scope. An earlier draft unblocked ops with no scope too, on the reasoning that a
       * scopeless op could not be matched anyway. That is the shape of a silent wrong result:
       * it would have opened the one-way gate on the strength of an unrelated download. An op
       * that cannot name what would restore it is a hole, so it is REPORTED, never papered over. */
      mark(scope, meta){
        Shell.Export._done[scope] = Object.assign({ at: Date.now() }, meta || {});
        const a = Store.all(); let touched = false;
        a.forEach(o => {
          if (o.tier !== 3) return;
          if (!o.scope) { console.warn('[dioreo] staged tier-3 op "' + o.id + '" names no export scope — no export can ever unblock it.'); return; }
          if (o.scope === scope) { o.exported = true; touched = true; }
        });
        if (touched) Store.save(a);
        document.dispatchEvent(new CustomEvent('dioreo:export', { detail:{ scope } }));
      },

      /* A real file, because a mockup that fakes the download cannot show the one thing that
       * matters about export here: that what comes out is the same pipe format the paste box
       * takes back in. A round trip that is not lossless is not a backup. */
      file(name, text, mime){
        const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = name; a.style.display = 'none';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      },

      /* scopes: [{ id, label, note, count, unit, file, build() -> string }]
       * `focus` opens with one scope pre-highlighted (the one-way strip passes the scope its
       * gate needs, so "Export first" lands on the right row rather than on a menu). */
      panel({ title = 'Export', note, scopes, focus }){
        const rows = scopes.map(sc => {
          const done = Shell.Export.has(sc.id);
          return '<li class="exs-i ' + (done ? 'done' : '') + (focus === sc.id ? ' focus' : '') + '" data-x="' + sc.id + '">' +
            '<div class="exs-t"><b>' + sc.label + '</b><span>' + (sc.note || '') + '</span></div>' +
            '<div class="exs-c">' + sc.count + ' <em>' + (sc.unit || 'records') + '</em></div>' +
            '<button class="pill sm ' + (done ? '' : 'lead') + '" data-x="' + sc.id + '">' +
              (done ? 'Download again' : 'Download') + '</button></li>';
        }).join('');
        const d = Shell.drawer({
          eyebrow: 'export · reversible', title,
          /* The default note used to claim "the same pipe format the paste box accepts" for
           * every scope, which is false for three of Season's five: the calendar is prefixed
           * bullet lines, patch notes have no bulk-add flow at all, and the manifest is TSV.
           * Each scope states its own shape in its own note; this line states only what is
           * true of all of them. */
          body: '<p class="dw-p">' + (note || 'Each of these is the format that entity really takes back — the round trip is checked against the bot\'s own exporter on every build, so what comes out here is what /manage would emit. This is what makes a one-way operation survivable: the copy you take before it is the copy you restore from.') + '</p>' +
                '<ul class="exs">' + rows + '</ul>',
          actions: '<button class="btn" id="dw-cancel">Close</button>'
        });
        d.querySelector('#dw-cancel').onclick = () => Shell.closeDrawer();
        d.querySelectorAll('button[data-x]').forEach(b => b.onclick = () => {
          const sc = scopes.find(x => x.id === b.dataset.x);
          if (!sc) return;
          let text; try { text = sc.build(); } catch (e) { Shell.toast('Export failed: ' + e.message); return; }
          Shell.Export.file(sc.file || (sc.id + '.txt'), text);
          Shell.Export.mark(sc.id, { rows: sc.count });
          Shell.toast(sc.count + ' ' + (sc.unit || 'records') + ' exported. One-way operations on this data are now unlocked.');
          Shell.closeDrawer();
        });
        return d;
      }
    },

    /* The masthead's "take out" line, as ONE implementation rather than a block of markup
     * copied into five pages. Season built it inline first; the moment Access and Broadcast
     * needed the same thing that inline version became the first of five copies that could
     * drift, which is the same mistake as five hand-written selection bars. Mounts next to
     * the create control, states what an export would carry, and reports what has already
     * been taken out this session — the same fact the one-way gate reads.
     *   host      a selector for the element to mount AFTER (usually the create button)
     *   scopes    () => [scope]  — a function, so counts stay live across re-renders
     *   summary   () => string   — what the line says when nothing has been exported yet */
    mastheadExport({ host, scopes, summary, label = 'Take out' }){
      const anchor = typeof host === 'string' ? document.querySelector(host) : host;
      if (!anchor) return;
      let el = document.querySelector('.mh-take');
      if (!el) {
        el = document.createElement('div');
        el.className = 'mh-take'; el.setAttribute('role', 'group');
        el.setAttribute('aria-label', 'Take data out of this realm');
        anchor.insertAdjacentElement('afterend', el);
      }
      const done = scopes().filter(x => Shell.Export.has(x.id)).length;
      el.innerHTML =
        '<span class="mh-add-k">' + label + '</span>' +
        '<button class="pill sm" data-mhx>' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" class="mh-i"><path d="M12 3v12M8 11l4 4 4-4M4 19h16"/></svg>' +
          'Export&hellip;</button>' +
        '<span class="mh-take-n">' + (done
          ? done + ' of ' + scopes().length + ' exported this session'
          : (summary ? summary() : scopes().length + ' formats')) + '</span>';
      el.querySelector('[data-mhx]').onclick = () => Shell.Export.panel({ title:'Export', scopes:scopes() });
      /* Honour Review's deep link (#export=season.calendar). Once only, and the hash is cleared
       * afterwards, or every later re-render would reopen the drawer on top of the reader. */
      if (!Shell._mhxLinked && /^#export/.test(location.hash)) {
        Shell._mhxLinked = true;
        const want = decodeURIComponent(location.hash.split('=')[1] || '');
        history.replaceState(null, '', location.pathname + location.search);
        requestAnimationFrame(() => Shell.Export.panel({
          title: want ? 'Export before you commit' : 'Export', scopes: scopes(), focus: want || undefined }));
      }
      return el;
    },

    /* ────────────────────── THE DOCKED SELECTION BAR ──────────────────────
     * count 0 dismisses it. Everything else is one repaint, so a realm can call this from
     * inside its own render without tracking whether the bar already exists.
     *   summary  what is selected, in the realm's own words ("Jul 6 → Aug 19 · 2 types")
     *   tier     the HIGHEST tier in the selection; it sets the reversibility badge
     *   actions  [{ label, kind:'danger'|'normal', on() }]
     * The badge is the point: it answers "can I take this back?" at the moment of deciding,
     * which is the only moment the answer is worth anything. */
    selection({ count, summary, tier, actions, onClear, noun = 'selected', clearLabel = 'Clear', badge }){
      const main = document.querySelector('main');
      let el = document.getElementById('selbar');
      if (!count) {
        document.body.classList.remove('has-selbar');
        if (el) { el.classList.remove('on'); const dead = el;
          setTimeout(() => { if (dead.isConnected && !dead.classList.contains('on')) dead.remove(); }, 260); }
        requestAnimationFrame(() => Shell.reserveForTray());
        return;
      }
      if (!el) {
        el = document.createElement('div'); el.id = 'selbar'; el.className = 'selbar';
        el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Actions for the current selection');
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('on'));
      } else { el.classList.add('on'); }
      document.body.classList.add('has-selbar');
      const t = tier || 1;
      /* 🔴 THE BADGE IS PER-REALM, and defaulting it was a wrong statement waiting to happen.
       * Access reported "reversible — undo stays in the tray" for permission edits, which do
       * NOT go through the tray at all: portal/api/access.js writes them directly, and that
       * is a documented decision, not an omission. A shared component may carry a default
       * sentence; it may not carry one that is false on a realm that uses it. */
      const badgeHtml = badge
        ? '<span class="selbar-rev ' + (t >= 3 ? 'gate' : 'ok') + '">' + badge + '</span>'
        : t >= 3
          ? '<span class="selbar-rev gate">one-way · export first</span>'
          : '<span class="selbar-rev ok">reversible · undo stays in the tray</span>';
      el.innerHTML =
        '<div class="selbar-in">' +
          '<span class="selbar-n">' + count + '</span>' +
          '<div class="selbar-t"><b>' + count + ' ' + noun + '</b>' +
            (summary ? '<span>' + summary + '</span>' : '') + '</div>' +
          badgeHtml +
          '<div class="selbar-a">' +
            actions.map((a, i) => '<button class="pill sm ' + (a.kind === 'danger' ? 'dang' : '') + '" data-a="' + i + '">' + a.label + '</button>').join('') +
          '</div>' +
          '<button class="selbar-x" data-clear aria-label="' + clearLabel + '">' + clearLabel + '</button>' +
        '</div>';
      el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => actions[+b.dataset.a].on());
      el.querySelector('[data-clear]').onclick = () => onClear && onClear();
      Shell._selClear = onClear;
      /* The bar is fixed, so without this it sits ON TOP of the last rows of the very table
       * the selection was made in — the previous design's failure, moved rather than fixed. */
      Shell.reserveForTray();
    },

    /* ───────────────────────── THE ONE-WAY STRIP ─────────────────────────
     * Where tier-3 lives. It is at the FOOT of a realm on purpose: the end of the page is
     * where a reader has already seen everything the operation would destroy.
     * The button is the interlock made literal — it reads "Export first" and opens the
     * export panel at the scope it needs, and only becomes the verb once a file exists.
     * items: [{ id, title, note, count, unit, scope, op, confirmWord, onRun }] */
    oneWay({ host, title = 'One-way operations', note, items, exportScopes }){
      const el = typeof host === 'string' ? document.querySelector(host) : host;
      if (!el) return;
      const paint = () => {
        el.innerHTML =
          '<section class="ow">' +
            '<div class="ow-h"><span class="ow-k">ONE-WAY</span><h3>' + title + '</h3>' +
              '<p>' + (note || 'These cannot be undone, and the portal will not run one until an export of the same data exists in this browser session. Everything above this line can be taken back from the tray.') + '</p></div>' +
            '<ul class="ow-l">' + items.map((it, i) => {
              const ready = Shell.Export.has(it.scope);
              return '<li class="ow-i"><div class="ow-t"><b>' + it.title + '</b><span>' + (it.note || '') + '</span></div>' +
                '<div class="ow-c">' + it.count + ' <em>' + (it.unit || 'records') + '</em></div>' +
                '<button class="pill sm ' + (ready ? 'dang' : 'ghost') + '" data-o="' + i + '">' +
                  (ready ? it.title.replace(/…$/, '') + '…' : 'Export first →') + '</button></li>';
            }).join('') + '</ul>' +
          '</section>';
        el.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
          const it = items[+b.dataset.o];
          if (!Shell.Export.has(it.scope)) {
            if (exportScopes) Shell.Export.panel({ title: 'Export first, then ' + it.title.toLowerCase(), scopes: exportScopes(), focus: it.scope });
            else Shell.toast('Export ' + it.title.toLowerCase() + ' first.');
            return;
          }
          Shell.typedConfirm({
            title: it.title + '?', op: it.op, tier: 3, word: it.confirmWord || 'PURGE',
            body: '<p class="dw-p">This removes <b>' + it.count + ' ' + (it.unit || 'records') + '</b> and <b>cannot be undone</b> from inside the portal. ' +
                  'Your export from ' + new Date(Shell.Export.at(it.scope)).toLocaleTimeString([], { hour:'numeric', minute:'2-digit' }) +
                  ' is the only way back.</p>',
            onConfirm: () => it.onRun()
          });
        });
      };
      paint();
      document.addEventListener('dioreo:export', paint);
    },

    /* A confirm that will not arm until the operator types the word. Used ONLY for tier 3 —
     * asking someone to type a word for a reversible change teaches them to type it without
     * reading, which is worse than not asking. */
    typedConfirm({ title, body, word, op, tier, onConfirm }){
      const d = Shell.drawer({
        eyebrow: (op ? op + ' · ' : '') + 'tier ' + (tier || 3) + ' · one-way',
        title, body: body + '<label class="tc-l" for="tc-in">Type <b>' + word + '</b> to confirm</label>' +
          '<input class="tc-in" id="tc-in" autocomplete="off" spellcheck="false" placeholder="' + word + '">',
        actions: '<button class="btn" id="dw-cancel">Cancel</button>' +
                 '<button class="btn dang" id="dw-ok" disabled>' + title.replace(/\?$/, '') + '</button>'
      });
      const ok = d.querySelector('#dw-ok'), inp = d.querySelector('#tc-in');
      d.querySelector('#dw-cancel').onclick = () => Shell.closeDrawer();
      inp.addEventListener('input', () => { ok.disabled = inp.value.trim().toUpperCase() !== word.toUpperCase(); });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !ok.disabled) ok.click(); });
      ok.onclick = () => { Shell.closeDrawer(); onConfirm && onConfirm(); };
      inp.focus();
    },

    /* The per-row control. It is a VISIBLE column, not a hover reveal and not a "..." menu:
     * a hover reveal does not exist on touch and cannot be scanned, and a menu buries the
     * verb behind a click for no gain. Rendered at --ink3 rather than --ink4 because at rest
     * it is a graphical control a reader must be able to find (5.35:1, over the 3:1 floor
     * for non-text), and it takes the destructive colour only on hover and focus. */
    removeCell(label){
      return '<td class="ra"><button class="rmv" data-rmv aria-label="Remove ' + label.replace(/"/g, '&quot;') + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg></button></td>';
    },

    init(active){
      Shell.mountRail(active);
      Shell.renderTray();
      document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        /* Escape has to mean one thing at a time. A drawer is modal, so it wins; otherwise
         * the selection is the thing on screen asking to be dismissed. */
        if (document.querySelector('.drawer.open')) { Shell.closeDrawer(); return; }
        if (document.getElementById('selbar') && Shell._selClear) { Shell._selClear(); return; }
        Shell.closeDrawer();
      });
    }
  };
  window.Shell = Shell;
})();
