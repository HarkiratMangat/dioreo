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
      nav.innerHTML = REALMS.map(r => `
        <a class="realm" href="${r.href}" ${r.id === active ? 'aria-current="page"' : ''}>
          <svg viewBox="0 0 24 24" aria-hidden="true">${r.icon}</svg>${r.label}
          ${r.id === 'season' && n ? `<span class="cnt" aria-label="${n} staged">${n}</span>` : ''}
        </a>`).join('');
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
      setOpen(sessionStorage.getItem(KEY + '-open') !== '0');
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
    <button class="pal" id="palBtn" title="Command palette"><kbd>⌘K</kbd></button>
    <span class="who">
      <button class="whobtn" id="whoBtn" aria-expanded="false" aria-haspopup="menu">
        <span class="av" data-src style="--av-src:url('${USER.avatar}')"></span>${USER.displayName}<span class="cv">▾</span></button>
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
      m.querySelectorAll('.mi').forEach(mi => mi.onclick = () => {
        m.hidden = true; b.setAttribute('aria-expanded','false');
        const k = mi.dataset.m;
        if (k === 'out') {
          Shell.confirm({ title:'Sign out of the portal?', tier:1, op:'session.end',
            body:`<p class="dw-p">You have <b>${Store.all().length}</b> staged change(s). Staged work
                   lives in this browser session and is <b>lost on sign out</b>.</p>`,
            confirm:'Sign out', danger:true,
            onConfirm(){ Store.clear(); location.href = 'door.html'; } });
        } else if (k === 'copy') {
          navigator.clipboard?.writeText(USER.id); Shell.toast('Discord ID copied.');
        } else if (k === 'palette') { window.__openPalette && window.__openPalette(); }
        else Shell.toast('The realm switcher is the rail on the left.');
      });
    },

    init(active){
      Shell.mountRail(active);
      Shell.renderTray();
      document.addEventListener('keydown', e => { if (e.key === 'Escape') Shell.closeDrawer(); });
    }
  };
  window.Shell = Shell;
})();
