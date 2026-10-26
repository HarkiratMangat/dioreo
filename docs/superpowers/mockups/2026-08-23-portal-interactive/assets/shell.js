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
  /* 🔴 THE IDENTITY CHIP MUST AGREE WITH THE PERMISSION MODEL. Under `?as=plain` the page
   * correctly refused every one-way operation as owner-only while the header still read
   * "dior · OWNER" — two authorities over one fact, which is the shape of defect that put a
   * ruler 128px off its own lanes. The chip now reads whoever the viewer actually is. */
  (function applyViewer(){
    const v = window.FIX && FIX.VIEWER;
    if (!v || v.isOwner) return;
    USER.id = v.id; USER.displayName = v.label; USER.username = v.label;
    /* No avatar for a stand-in admin: Discord would return one, and inventing a face for a
     * fixture identity is the kind of plausible detail that gets mistaken for real data. */
    USER.avatar = ''; USER.banner = '';
  })();
  window.__USER = USER;
  /* Surfaced to the audit harness — a page can pass every geometric invariant while throwing.
   * Collected here rather than per page so no surface can forget to. */
  window.__errs = window.__errs || [];
  window.addEventListener('error', e => window.__errs.push(String(e.message)));
  window.addEventListener('unhandledrejection', e => window.__errs.push('rejection: ' + String(e.reason)));

  const REALMS = [
    { id:'season',    label:'Season',    href:'season.html',
      icon:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>' },
    /* 🔴 BOTH OF THESE WERE REPLACED 2026-08-24 because neither said what its realm is.
     * The old Armory glyph was an abstract stroke assembly that resolved to nothing at 20px,
     * and the old Broadcast glyph was a VOLUME icon — a speaker with one arc, which reads as
     * "sound settings" in every other interface a person has used. An icon in a five-item
     * rail is read at a glance, beside its own label, so it has one job: be unmistakable for
     * the other four. */
    { id:'armory',    label:'Armory',    href:'armory.html',
      /* A weapon RETICLE: ring, centre dot, four ticks. The realm is loadouts and attachments,
       * and a rifle silhouette is unreadable at this size in stroke — the reticle is the one
       * shooter-game motif that survives 20px, and nothing else in the rail is round. */
      icon:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>' },
    { id:'broadcast', label:'Broadcast', href:'broadcast.html',
      /* A MEGAPHONE: cone, handle, two emission arcs. Announcements are pushed OUT to players,
       * and a megaphone is the one glyph that says "said to everyone" rather than "audio". */
      icon:'<path d="M3 10v4a1 1 0 0 0 1 1h2l6 4V5L6 9H4a1 1 0 0 0-1 1z"/><path d="M7 15v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-3"/><path d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7.5 7.5 0 0 1 0 10"/>' },
    { id:'access',    label:'Access',    href:'access.html',
      icon:'<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>' },
    { id:'analytics', label:'Analytics', href:'analytics.html',
      icon:'<path d="M4 19V9M10 19V5M16 19v-6M22 19H2"/>' }
  ];

  const KEY = 'dioreo-portal-staged';

  /* Which realm is on screen. Used to stamp a staged op with where it was made, so the tray
   * can offer a per-row undo that is HONEST: `Store.inverses` is an in-memory map rebuilt on
   * every page load, so an op staged on Season has no inverse once you walk to Armory. Without
   * the stamp the tray could only say "no", which is the shape of answer this package keeps
   * having to fix — it says "undo it on Season" and links there instead. */
  const hereRealm = () => {
    const f = location.pathname.split('/').pop() || 'index.html';
    return REALMS.find(r => r.href === f) || null;
  };

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
      /* Stamped at the ONE choke point every staging path already passes through, for the same
       * reason the tier is derived here — a per-page stamp would be forgotten by the next page. */
      /* 🔴 TEN STAGING SITES ALREADY PASSED `realm:'season'` AS A STRING, and fixtures.js's
       * sample changeset does too — so the tray's per-row undo, which reads `realm.href`, got
       * undefined on every one of them and drew a disabled button. Normalised here for the same
       * reason the tier is derived here: ten call sites is ten chances to forget. */
      if (typeof op.realm === 'string') {
        const r = REALMS.find(x => x.id === op.realm);
        op.realm = r ? { href:r.href, label:r.label } : null;
      }
      if (!op.realm) { const r = hereRealm(); if (r) op.realm = { href:r.href, label:r.label }; }
      a.push(op); Store.save(a); Shell.pulseTray(); return true; },
    remove(id){ Store.save(Store.all().filter(o => o.id !== id)); },
    clear(){ Store.save([]); },
    /* Inverses, keyed by op id. Store holds a RECORD of a change; reverting the record does
     * not by itself undo the change — that gap let a discarded item stay on the Track. */
    inverses: {},
    /* 🔴 RE-RENDER. Every staging site calls `Store.add()` (which renders the tray) and THEN
     * `onInvert()`, so at the moment a row is first drawn its own inverse does not exist yet —
     * the newest row rendered its undo DISABLED while the ones above it were fine. Measured
     * live on Season: two removals staged, `Store.inverses` held both ids, and the second
     * button still said disabled. A state read one call too early, which is the same defect
     * shape as an audit that measures a half-laid-out page. */
    onInvert(id, fn){ Store.inverses[id] = fn; Shell.renderTray && Shell.renderTray(); },
    revertAll(){ const ops = Store.all();
      ops.slice().reverse().forEach(o => { const f = Store.inverses[o.id]; if (f) { try { f(); } catch (e) {} } });
      Store.inverses = {}; Store.save([]); return ops; },
    revert(id){ const f = Store.inverses[id]; if (f) { try { f(); } catch (e) {} } delete Store.inverses[id]; Store.remove(id); },
    blocked(){ return Store.all().filter(o => o.tier === 3 && !o.exported).length; }
  };

  /* 🔴 THE SEED LIVED IN review.html, SO ONLY REVIEW COULD EVER BE MEASURED WITH STAGED WORK IN IT.
   * The staged store is sessionStorage and every instrument clears it on load, while the portal harness
   * synthesises four changesets — so any page carrying a staged surface was compared EMPTY against
   * POPULATED, and the difference came back as well-formed numbers for a comparison nobody meant to make.
   * Review had `?demo=1` and the other seven pages did not. Measured on Home, 2026-09-03 21:28 EDT: the
   * masthead's staged figure, the whole `.hres` resume strip and the header's commit crumb were all
   * reported ONLY IN PORTAL, which is a data difference wearing a design difference's clothes.
   *
   * ⚠️ It changes the DATA and never the design: no visible copy, no layout, nothing seeded without the
   * flag. COMPANION §15's rule — seeded on request, never automatically — is unchanged; this widens WHO
   * may ask from one page to all of them. `force` is the reader-facing button's way in (review.html),
   * which seeds even when the store already holds something. */
  function seedDemoOps(force){
    const ops = (window.FIX && window.FIX.sampleOps) || [];
    if (!ops.length || (!force && Store.all().length)) return;
    /* ⚠️ THE TIER CANNOT BE FABRICATED HERE, AND TRYING IT IS HOW THAT WAS MEASURED (2026-09-02 23:18 EDT).
     * A `tier: 3` passed in this object is DISCARDED: `Store.add` derives the tier from `FIX.OP_TIERS` —
     * core/ops's own registry — and only ever CHECKS what a surface claims, which is the invariant
     * `.claude/rules/operation-core.md` states and the reason three surfaces once typed a delete as tier 3
     * because deleting feels destructive. `sampleOps` carries no op whose real tier is 3, so THE MOCKUP
     * CANNOT RENDER THE EXPORT GATE AT ALL, and the portal harness can only render it by fabricating a
     * tier the registry contradicts. That divergence is CITED, not fixed here: closing it means changing
     * shared fixture data that four closed realms are measured against.
     * ⚠️ Carried verbatim from review.html when this moved here on 2026-09-03 22:50 EDT — an earlier version of this
     * fold kept the conclusion and dropped the date, the rule file, the worked case and the reason it is
     * cited, which leaves a measured finding reading as an opinion. */
    // `stale: i === 1` is one stale op, to exercise the conflict surface — the comment came across with it.
    ops.forEach((o, i) => { const op = Object.assign({}, o, { stale: i === 1 }); Store.onInvert(op.id, function(){}); Store.add(op); });
  }
  const Shell = {
    /* The session origin. In the wired portal this is the cookie's issued-at; here it is
     * pinned once per page load so the countdown moves and never resets mid-session. */
    _signedInAt: Date.now() - (4 * 3600e3 + 40 * 60e3),
    Store, REALMS, seedDemoOps,

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
        <a class="realm" href="${r.href}" style="--c:var(--r-${r.id})" ${r.id === active ? 'aria-current="page"' : ''}>
          <svg viewBox="0 0 24 24" aria-hidden="true">${r.icon}</svg>${r.label}
        </a>`).join('') + `
        <span class="rail-rule" aria-hidden="true"></span>
        <a class="realm out ${n ? 'has' : ''}" href="review.html" style="--c:var(--r-review)" ${active === 'review' ? 'aria-current="page"' : ''}>
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
      /* Every mutation funnels through Store.save → renderTray, so the header chip is
       * refreshed HERE rather than at each call site: a chip wired per-mutation is the
       * one-quantity-two-authorities shape waiting to happen. */
      Shell.syncCommitChip();
      const t = document.querySelector('.tray');
      if (!t) return;
      const ops = Store.all();
      t.hidden = ops.length === 0;
      if (!ops.length) return;
      const blocked = Store.blocked();
      const here = hereRealm();
      t.innerHTML = `
        <div class="tray-h" role="button" tabindex="0" aria-expanded="true">
          <span class="t">Staged</span><span class="n">${ops.length} change${ops.length>1?'s':''}</span>
        </div>
        <div class="rounds">${ops.map(o => {
          /* 🔴 THE TRAY PROMISED AN UNDO IT DID NOT HAVE. `selbar-rev` has always read
           * "reversible · undo stays in the tray" while the tray offered exactly two verbs,
           * Discard-everything and Review — so the one thing the copy named was the one thing
           * missing, the same class as the tray header that carried role="button" with nothing
           * listening. Harkirat settled the mechanic on 2026-08-25: ⌘Z stays NATIVE (undoing
           * typed edits in a field), and taking back a staged change is a button. Per ROW,
           * because Discard is all-or-nothing and one mistake in a five-op changeset should
           * not cost the other four. */
          const back = Store.inverses[o.id]
            ? `<button type="button" class="round-u" data-undo="${o.id}" aria-label="Undo ${o.name} ${o.verb||'added'}">Undo</button>`
            : (o.realm && o.realm.href && (!here || o.realm.href !== here.href))
              /* Not a refusal — a route. The inverse lives on the page that staged it. */
              ? `<a class="round-u" href="${o.realm.href}" aria-label="Undo ${o.name} ${o.verb||'added'} on ${o.realm.label}">Undo on ${o.realm.label}</a>`
              /* Inline, not a native title: a DISABLED button does not reliably fire hover or take
             * focus, so its title is an explanation the reader cannot reach. Audit rule "native
             * title carries N chars of content" and the copy audit's E5 both said so. */
            : `<span class="round-u none" aria-label="Cannot undo ${o.name} ${o.verb||'added'} — it was staged before the last reload">staged earlier</span>`;
          return `
          <div class="round ${o.tier===3?'t3':''}">
            <span class="tier">T${o.tier}</span><b>${o.name}</b> ${o.verb||'added'}${back}
          </div>`; }).join('')}</div>
        <div class="tray-f">
          <button class="btn no" data-act="discard">Discard all</button>
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
        const undone = Store.revertAll();  /* 06 · "Discard all" is the only all-or-nothing verb */
        Shell.toast(`Discarded ${undone.length} staged change${undone.length>1?'s':''}.`);
        Shell.onAfterRevert && Shell.onAfterRevert();
      };
      t.querySelector('[data-act=review]').onclick = () => { location.href = 'review.html'; };

      /* Read the op BEFORE reverting: Store.revert -> remove -> save -> renderTray, so this
       * very button is detached by the time the handler returns. */
      t.querySelectorAll('button.round-u[data-undo]').forEach(b => {
        b.onclick = () => {
          const o = Store.all().find(x => x.id === b.dataset.undo);
          Store.revert(b.dataset.undo);
          Shell.toast(`Undone — "${o ? o.name : 'that change'}" is no longer staged.`);
          Shell.onAfterRevert && Shell.onAfterRevert();
        };
      });
    },

    /* ⚠️ "toasts settle needs a MUCH smoother animation." The old one played `trayIn .22s`
     * on arrival and then VANISHED — `el.remove()` deleted the node mid-frame, so half of every
     * toast's life had no motion in it at all, and a thing that appears smoothly and disappears
     * instantly reads as broken rather than as fast. Three changes, all in CSS (see the
     * LIVELINESS block): a longer arrival on a curve with no overshoot spike, opacity finishing
     * before the travel does, and a separate faster exit that drifts down instead of reversing.
     * This function's only job is to give the exit somewhere to happen. */
    toast(msg, actionLabel, onAction){
      const old = document.querySelector('.toast');
      if (old) Shell._dismissToast(old);
      const el = document.createElement('div');
      el.className = 'toast'; el.setAttribute('role','status');
      el.innerHTML = `<span>${msg}</span>` + (actionLabel ? `<button type="button">${actionLabel}</button>` : '');
      document.body.appendChild(el);
      if (actionLabel) el.querySelector('button').onclick = () => { onAction && onAction(); Shell._dismissToast(el); };
      el._t = setTimeout(() => Shell._dismissToast(el), 6000);
      return el;
    },

    /* Removal is a state, not a deletion: the node stays for the length of the exit and is
     * dropped on animationend. `transitionend`/`animationend` never fires under
     * prefers-reduced-motion (the global kill sets animation:none), so the timeout is the
     * mechanism there and the listener is the optimisation — not the other way round, which
     * is how an animated dismissal becomes a permanently stuck element for the one group of
     * users who asked for less motion. */
    _dismissToast(el){
      if (!el || el.classList.contains('leaving')) return;
      clearTimeout(el._t);
      el.classList.add('leaving');
      const gone = () => el.remove();
      el.addEventListener('animationend', gone, { once:true });
      setTimeout(gone, 400);
    },

    /* ── 5 · FIGURES ROLL AND SHOW THE DELTA ──────────────────────────────
     * A masthead figure that silently reads 40 instead of 39 tells you the new value and
     * hides the event — which is the one thing you were watching for after staging a change.
     * The delta ghost is therefore the point, and the roll is what makes it legible.
     * Reads the OLD text from the DOM rather than a cached value, so two callers can never
     * disagree about what the previous number was. */
    setFigure(el, n, opts = {}){
      if (!el) return;
      const prev = parseInt(String(el.textContent).replace(/[^\d-]/g, ''), 10);
      const next = Number(n);
      el.textContent = opts.text !== undefined ? opts.text : String(n);
      Shell.markZero(el, next, opts.staged);
      if (!Number.isFinite(prev) || prev === next) return;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      el.classList.remove('rolling'); void el.offsetWidth; el.classList.add('rolling');
      el.addEventListener('animationend', () => el.classList.remove('rolling'), { once:true });
      const d = next - prev, host = el.closest('.stat') || el.parentElement;
      if (!host) return;
      host.querySelector('.fdelta')?.remove();
      const g = document.createElement('span');
      g.className = 'fdelta ' + (d > 0 ? 'up' : 'down');
      g.setAttribute('aria-hidden', 'true');
      g.textContent = (d > 0 ? '+' : '−') + Math.abs(d);
      host.appendChild(g);
      setTimeout(() => g.remove(), 1400);
    },

    /* 🔴 ONE CLASS, ONE MEANING. `.zero` dims a zero to say "nothing here" — correct on
     * NEED REPAIR 0 and exactly backwards on STAGED 0, where a clean slate is the GOOD state
     * and dimming makes it read as absence rather than as "you are up to date". So the staged
     * figure never takes it: it takes the cyan when there is something to act on and plain
     * secondary ink when there is not. `figure-zero` in the audit fails if `.zero` ever lands
     * on a `.stg` stat again. */
    markZero(el, n, isStaged){
      el.classList.toggle('zero', !isStaged && !n);
      el.classList.toggle('stg-clear', !!isStaged && !n);
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
      /* 🔴 THE DRAWER CLAIMED TO BE MODAL AND TAB WALKED STRAIGHT OUT OF IT. Measured 2026-08-25
       * with a typed-confirmation open: 218 focusable elements outside the drawer were still
       * reachable, so somebody could tab past a purge dialog and press something else on the page
       * behind it. A scrim stops the mouse and says nothing to the keyboard — the visual half of
       * modality was built and the behavioural half was not, which is the same shape as an
       * onclick with no tabindex.
       * `inert` is the honest primitive: it removes the rest of the page from the tab order AND
       * from the accessibility tree, so a screen reader stops reading the page behind too, which
       * a hand-rolled TAB-cycling trap never fixes. The manual cycle stays as the fallback for
       * anything that does not support it. Focus returns to whatever opened the drawer, because a
       * modal that drops you at the top of the document loses your place. */
      Shell._opener = document.activeElement;
      const sibs = [...document.body.children].filter(n => n !== d && n !== sc);
      sibs.forEach(n => { if (n.inert !== undefined) { n.__wasInert = n.inert; n.inert = true; } });
      d.__release = () => sibs.forEach(n => { if (n.inert !== undefined) n.inert = !!n.__wasInert; });
      if (sibs.every(n => n.inert === undefined)) {
        d.__trap = e => {
          if (e.key !== 'Tab') return;
          const f = [...d.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])')]
            .filter(el => el.checkVisibility ? el.checkVisibility() : true);
          if (!f.length) return;
          const first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        };
        document.addEventListener('keydown', d.__trap, true);
      }
      d.querySelector('.dw-b input,.dw-b button,.dw-f button')?.focus();
      return d;
    },
    closeDrawer(){
      const d = document.querySelector('.drawer');
      /* Undo modality in the same place that applied it — an `inert` left behind would silently
       * make the whole page unusable, which is a far worse failure than the one it fixes. */
      if (d) {
        d.__release && d.__release(); d.__release = null;
        if (d.__trap) { document.removeEventListener('keydown', d.__trap, true); d.__trap = null; }
        d.classList.remove('open');
      }
      document.querySelector('.scrim')?.classList.remove('on');
      /* Back where you were. A modal that returns you to the top of the document loses your
       * place in a 39-row table, which is most of what this portal is. */
      if (Shell._opener && Shell._opener.isConnected && Shell._opener.focus) {
        try { Shell._opener.focus({ preventScroll: true }); } catch (e) {}
      }
      Shell._opener = null;
    },

    /* ═══════════════════ ASYNC — §15.7, no longer undesigned ═══════════════════
     * The mockup had NO async state at all, which made it the one part of this package a wiring
     * session could not build "to the mockup" — you cannot wire a backend against states nobody
     * drew. Every rule below comes from somewhere already decided in this document rather than
     * from taste, and each is stated with the failure it prevents.
     *
     * 🔴 FOUR RULES, AND THEY DISAGREE WITH EACH OTHER ON PURPOSE:
     *  1. A FIRST load skeletons in the SHAPE OF THE CONTENT (§10.6). Never a spinner: a spinner
     *     says "something is happening" where a skeleton says "a table with six rows is coming",
     *     and the second is the only one that lets the reader start reading the layout.
     *  2. A REFRESH DOES NOT SKELETON. Blanking correct data to say you are re-fetching it is a
     *     regression dressed as feedback — the reader loses what they were looking at. Refresh is
     *     a quiet mark on the surface that owns the data, and the stale rows stay legible.
     *  3. SLOW IS ITS OWN STATE. A request that has not failed and has not returned needs to say
     *     so at a threshold, or the reader concludes the portal is broken and reloads mid-write.
     *  4. A FAILURE NAMES WHAT FAILED, WHAT IT MEANS, AND THE ONE ACTION (§10.6). "Something went
     *     wrong" is the error equivalent of a bare "No results."
     *
     * ⚠️ AND THE ONE THAT COSTS MOST TO GET WRONG: an optimistic write that loses a concurrency
     * check must be VISIBLY ROLLED BACK, never silently reconciled (§15.7). A row that quietly
     * returns to its old value after you changed it is indistinguishable from a portal that
     * ignored you, and the reader's next move is to do it again. */
    async: {
      /* Skeleton geometry is declared by the realm, because only the realm knows its own shape.
       * `lines` is a list of relative widths — a row of 4 cells reads as `[38, 14, 20, 12]` — so
       * the placeholder carries the layout's own rhythm instead of a generic grey slab. */
      skeleton(host, { rows = 6, lines = [40, 16, 22, 12], label = 'Loading' } = {}){
        const el = typeof host === 'string' ? document.querySelector(host) : host;
        if (!el) return;
        el.setAttribute('aria-busy', 'true');
        /* One live region, not one per row: a screen reader must hear "loading" once, not
         * eighteen times. The bars themselves are decorative and are hidden from the tree. */
        el.innerHTML = '<div class="skel" role="status" aria-live="polite">' +
          '<span class="vh">' + label + '&hellip;</span>' +
          Array.from({ length: rows }, (_, r) =>
            '<div class="skel-r" aria-hidden="true" style="--d:' + (r * 60) + 'ms">' +
              lines.map(w => '<i style="width:' + w + '%"></i>').join('') +
            '</div>').join('') +
          '</div>';
      },
      /* Rule 2. The data stays on screen and the surface says it is being re-read. Returns a
       * function that clears it, so a caller cannot forget which class it set. */
      refreshing(host, on = true){
        const el = typeof host === 'string' ? document.querySelector(host) : host;
        if (!el) return () => {};
        el.classList.toggle('is-refreshing', !!on);
        el.setAttribute('aria-busy', on ? 'true' : 'false');
        return () => Shell.async.refreshing(el, false);
      },
      /* Rule 3. `slowAfter` is a THRESHOLD, not a timeout — nothing is cancelled, the page just
       * stops pretending the wait is normal. 2.5s is the point at which a person checks whether
       * they actually clicked. */
      run(promise, { host, slowAfter = 2500, slowNote = 'Still waiting on the server\u2026' } = {}){
        let done = false, t = null;
        const el = host && (typeof host === 'string' ? document.querySelector(host) : host);
        t = setTimeout(() => { if (!done && el) el.classList.add('is-slow'); }, slowAfter);
        if (el) el.dataset.slow = slowNote;
        const clear = () => { done = true; clearTimeout(t); if (el) el.classList.remove('is-slow'); };
        return Promise.resolve(promise).then(v => { clear(); return v; },
                                             e => { clear(); throw e; });
      },
      /* Rule 4. Three fields, all required, because an error missing any one of them is the
       * error that gets screenshotted and sent to somebody else to interpret. */
      failure(host, { what, means, action, onAction, detail }){
        const el = typeof host === 'string' ? document.querySelector(host) : host;
        if (!el) return;
        el.removeAttribute('aria-busy');
        el.innerHTML = '<div class="failbox" role="alert"><div class="fail-h">' +
            '<span class="fail-k">FAILED</span><b>' + what + '</b></div>' +
            '<p>' + means + '</p>' +
            (detail ? '<pre class="fail-d">' + detail + '</pre>' : '') +
            '<div class="fail-a"><button class="pill sm" id="fail-go">' + action + '</button></div></div>';
        const b = el.querySelector('#fail-go');
        if (b && onAction) b.onclick = onAction;
      },
      /* A commit is N ops in one transaction (§15.3) and op 23 of 40 can fail, so progress is
       * per-op and the failed one is NAMED. A percentage bar cannot say which op broke, and
       * "which one" is the only question worth answering at that moment. */
      progress(host, { total, done = 0, current = '', failed = null }){
        const el = typeof host === 'string' ? document.querySelector(host) : host;
        if (!el) return;
        const pct = total ? Math.round((done / total) * 100) : 0;
        el.innerHTML = '<div class="prog' + (failed ? ' bad' : '') + '" role="status" aria-live="polite">' +
          '<div class="prog-b"><i style="width:' + pct + '%"></i></div>' +
          '<div class="prog-t">' + (failed
            ? '<b>Stopped at ' + (done + 1) + ' of ' + total + '</b> &middot; ' + failed
            : '<b>' + done + ' of ' + total + '</b>' + (current ? ' &middot; ' + current : '')) +
          '</div></div>';
      },
      /* THE WHOLE BACKEND IS GONE, or this tab outlived its 12h PortalSession. Both are page-level
       * facts rather than one surface's problem, so they take a banner above everything — and both
       * name the one action, because "you are offline" with nothing to do is a notification, not
       * a design. `kind` also decides whether staged work is safe: it is, and saying so is the
       * point, because the reader's fear is that they lost it. */
      banner(kind, detail){
        let b = document.querySelector('.netbar');
        if (kind === null) { b && b.remove(); return; }
        if (!b) { b = document.createElement('div'); b.className = 'netbar';
                  document.querySelector('.app')?.prepend(b); }
        const copy = {
          offline: { k:'OFFLINE', what:'The portal cannot reach the server.',
                     means:'Nothing you have staged is lost \u2014 it is held here until the connection is back. Nothing has been written.',
                     action:'Retry now' },
          expired: { k:'SIGNED OUT', what:'This session expired.',
                     means:'Portal sessions last 12 hours. Your staged work is still here; signing in again returns you to it.',
                     action:'Sign in again' }
        }[kind] || { k:'PROBLEM',
                     /* This is the fallback for every banner kind that is not offline or expired,
                      * and it used to read "Something is wrong." with an EMPTY `means` — the one
                      * pattern §10.6 names as not good enough, sitting as the default, two lines
                      * below the two cases that do it properly. */
                     what: detail || 'The portal hit an error it does not recognise.',
                     means:'Nothing has been written, and anything you have staged is still here.',
                     action:'Reload' };
        b.className = 'netbar ' + kind;
        b.setAttribute('role', 'alert');
        b.innerHTML = '<span class="net-k">' + copy.k + '</span><b>' + copy.what + '</b>' +
                      '<span class="net-m">' + copy.means + '</span>' +
                      '<button class="pill sm" data-net-go>' + copy.action + '</button>';
        return b;
      },
      /* 🔴 A ROLLBACK IS SHOWN, NOT PERFORMED QUIETLY. §15.7's own warning: an optimistic write
       * that loses a concurrency check has to be visibly taken back. The row returns to its old
       * value WITH a mark and a sentence saying the server refused and why, because a value that
       * silently reverts is indistinguishable from a portal that ignored the click — and the
       * reader's next move is to do it again, which is how one lost edit becomes three. */
      /* 🔴 `?net=` MAKES EVERY ONE OF THESE RENDERABLE, and that is not a convenience. The lesson
       * this package keeps re-learning is that a state nothing can put on screen is a state
       * nobody designs and no check can open: `?audit=1` went unrun for weeks, every `[hidden]`
       * view was audited by nothing, and the owner-only refusal was undesignable until `?as=`
       * existed. Async is the largest such surface in the portal, so it gets the same treatment
       * before it gets built rather than after.
       * A realm opts in with ONE attribute — `data-async-host` on the element that owns its data
       * — and declares its own skeleton shape in `data-skel` ("rows|w,w,w"). No per-realm JS, so
       * a new realm cannot forget to wire it and quietly have no loading state. */
      applyFlag(){
        const m = /[?&]net=([a-z]+)\b/.exec(location.search);
        if (!m) return;
        const kind = m[1];
        const host = document.querySelector('[data-async-host]');
        const shape = (() => {
          const d = (host && host.dataset.skel) || '6|40,16,22,12';
          const [rows, widths] = d.split('|');
          return { rows: +rows || 6, lines: (widths || '').split(',').map(Number).filter(Boolean) };
        })();
        const A = Shell.async;
        if (kind === 'offline' || kind === 'expired') { A.banner(kind); return; }
        if (!host) return;
        if (kind === 'loading') return A.skeleton(host, shape);
        if (kind === 'refresh') return void A.refreshing(host, true);
        if (kind === 'slow') { host.dataset.slow = 'Still waiting on the server\u2026';
                               host.classList.add('is-slow'); host.style.position = 'relative'; return; }
        if (kind === 'fail') return A.failure(host, {
          /* 01 · "realm" is the code's word for one of the eight and stays there; anything a
           * person reads names the page. "Could not load this realm" made the reader translate
           * a word the portal never defines on screen. */
          what: 'Could not load ' + ((hereRealm() || {}).label || 'this page'),
          means: 'The portal reached the server and the server could not read this season. '
               + 'Nothing has been written, and anything you had staged is still here.',
          detail: 'GET /api/season → 500\nMongoServerError: connection <monitor> to 10.0.0.4:27017 timed out',
          action: 'Try again' });
        if (kind === 'commit') return A.progress(host, { total: 40, done: 23, current: 'calendar.bulkReplace' });
        if (kind === 'commitfail') return A.progress(host, { total: 40, done: 23,
          failed: 'calendar.bulkReplace refused: the row it targets was edited 40s ago' });
        if (kind === 'rollback') {
          const row = host.querySelector('tr[data-id], .ow-i, li, .lane');
          A.rolledBack(row || host, 'the server had a newer value for this row');
        }
      },

      rolledBack(el, why){
        if (!el) return;
        el.classList.remove('rb'); void el.offsetWidth; el.classList.add('rb');
        el.setAttribute('data-tip', 'Rolled back \u2014 ' + why);
        Shell.toast('Rolled back: ' + why);
        el.addEventListener('animationend', () => el.classList.remove('rb'), { once: true });
      }
    },

    /* 🔴 ONE DELEGATED LISTENER, because the kept-copies list is re-rendered by whatever realm
     * hosts it and a handler bound per render would either go stale or accumulate. Bound once at
     * the document, so any realm that drops `Shell.Export.panelHtml()` into its markup gets a
     * working button without wiring anything — which is the point: a control that renders and
     * does nothing is worse than no control, and that is exactly what shipping the markup without
     * this would have been. */
    bindExportAgain(){
      if (document.__expAgain) return;
      document.__expAgain = true;
      document.addEventListener('click', e => {
        const b = e.target.closest && e.target.closest('[data-again]');
        if (b) Shell.Export.again(b.dataset.again);
      });
    },

    /* ══════════ WHO MAY DO SOMETHING THAT CANNOT BE UNDONE ══════════
     * Decided 2026-08-25 by Harkirat: tier-3 is OWNER-ONLY by default, with an explicit
     * capability the owner — and only the owner — may hand to one admin.
     * 🔴 ONE FUNCTION, because the alternative is a permission test copied into five realms'
     * one-way strips and into Review's commit path, and six copies of a rule is six chances for
     * one of them to be the lenient one. Every surface that gates on irreversibility calls this.
     * ⚠️ THE CLIENT IS NOT THE AUTHORITY — see §15.5. This decides what the page SHOWS; the
     * server re-checks, and a portal that only hides the button has no security at all. */
    actor(){ return (window.FIX && FIX.VIEWER) || { isOwner: true, destructive: true, label: 'owner' }; },
    canDestroy(){ const a = Shell.actor(); return !!(a.isOwner || a.destructive); },

    /* 🔴 A ZERO IS GOOD NEWS AND MUST NOT BE PAINTED AS AN ALERT — CENTRALLY, because fixing it
     * per realm is how it came back. Season and Armory were corrected by hand on 2026-08-25 and
     * Review still showed "CHANGES 0" in staged-cyan the same morning: the third instance of one
     * defect, and the second time a per-call-site fix left the others wrong.
     * Same shape as `inkFills()` — a fact about every filled surface, computed once, so a new
     * realm inherits it instead of remembering it. A colour that is on whether or not it means
     * anything stops meaning anything. */
    zeroStats(){
      document.querySelectorAll('.mh-stats .stat .v').forEach(v => {
        const z = (v.textContent || '').trim() === '0';
        /* 🔴 `.zero` MEANT TWO OPPOSITE THINGS, and this observer is where both were applied.
         * Dimming a zero to say "nothing here" is right on NEED REPAIR 0 and exactly backwards
         * on STAGED 0, where a clean slate is the GOOD state and dimming reads as absence
         * rather than as "you are up to date". Staged is also the one figure you can act on,
         * so it is the one whose appearance should change when there is something to act on —
         * cyan when it matters, plain secondary ink when it does not, never dimmed.
         * The LEAD keeps its size at zero and drops only its colour: size carries hierarchy,
         * colour carries meaning, and "0 live now" in Broadcast yellow is an alert about
         * nothing. Both rules are in one place so a new realm inherits them. */
        const stat = v.closest('.stat');
        const staged = stat && stat.classList.contains('stg');
        v.classList.toggle('zero', z && !staged);
        v.classList.toggle('stg-clear', z && !!staged);
      });
    },
    /* The REASON, not just the verdict. A disabled control with no explanation is a dead end —
     * the reader cannot tell whether they lack a grant, hold the wrong one, or hit a bug. */
    whyNoDestroy(){
      const a = Shell.actor();
      if (a.isOwner || a.destructive) return '';
      return 'One-way operations are owner-only. The owner can grant the Destructive capability '
           + 'in Access; nothing else unlocks this, and holding manage does not.';
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
      /* Applied here rather than at boot: `?net=` states replace or mark a realm's rendered
       * surface, so they have to land AFTER that surface exists. holdTop() is the one hook every
       * realm already calls at the end of its first render. */
      Shell.async.applyFlag();
      Shell.bindExportAgain();
      /* Stats are rewritten on every stage, every filter and every save, so a one-shot pass at
       * boot would be correct exactly once. Observed rather than called from each render site —
       * the render sites are the thing that keeps forgetting. */
      const sb = document.querySelector('.mh-stats');
      if (sb && !sb.__zeroObs) {
        sb.__zeroObs = true;
        new MutationObserver(() => Shell.zeroStats()).observe(sb, { childList:true, subtree:true, characterData:true });
      }
      Shell.zeroStats();
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


    /* ══════════════════════════════════════════════════════════════════════════════
     * MAGIC — one parser, four capabilities
     *
     * Harkirat's test for magic is not "is it clever", it is: does it make you say
     * "the portal can do that?" or "that made it so easy". Three of the four below are the
     * same engine pointed at three surfaces — paste, a date field, and ⌘K — which is what
     * makes four capabilities affordable at once rather than four features.
     *
     * 🔴 THIS IS A MOCKUP OF THE SURFACE, NOT OF THE PARSING. The bot already ships
     * utils/adminParser.js for the line formats and already depends on chrono-node for the
     * dates — /manage parses admin dates with it today. The portal is the surface that does
     * not use either. What is written here is a deliberately small subset with the same
     * SHAPE, so a wiring session replaces the body and keeps every call site.
     * ⚠️ So do not "improve" this grammar. The real one inherits everything the bot already
     * understands, and a richer mockup grammar would only teach a wiring session to keep it.
     * ══════════════════════════════════════════════════════════════════════════════ */
    Parse: {
      MONTHS: ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'],
      _today(){ return (window.FIX && window.FIX.today) || new Date().toISOString().slice(0,10); },
      _iso(d){ return d.toISOString().slice(0,10); },
      _add(iso, days){ const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return Shell.Parse._iso(d); },

      /* ── 3 · TYPE THE DATE LIKE A PERSON ───────────────────────────────────
       * The bot has understood "in 3 weeks" for a year. The portal made you use a date
       * picker — which is not a smaller feature, it is the SAME feature with the
       * understanding removed. Returns an ISO date, or null, and never guesses silently:
       * every caller shows what it resolved to before anything is stored. */
      date(str, base){
        if (!str) return null;
        const t = String(str).toLowerCase().trim().replace(/[,.]/g, ' ').replace(/\s+/g, ' ');
        const today = base || Shell.Parse._today();
        if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
        if (/^today$|^now$/.test(t)) return today;
        if (/^tomorrow/.test(t)) return Shell.Parse._add(today, 1);
        if (/^yesterday/.test(t)) return Shell.Parse._add(today, -1);
        let m = /^in (\d+) (day|week|month)s?/.exec(t);
        if (m) return Shell.Parse._add(today, +m[1] * (m[2] === 'day' ? 1 : m[2] === 'week' ? 7 : 30));
        m = /^(\d+) (day|week|month)s? (from now|later)/.exec(t);
        if (m) return Shell.Parse._add(today, +m[1] * (m[2] === 'day' ? 1 : m[2] === 'week' ? 7 : 30));
        if (/end of (the )?month/.test(t)) {
          const d = new Date(today + 'T12:00:00Z');
          return Shell.Parse._iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)));
        }
        if (/end of (the )?week/.test(t)) {
          const d = new Date(today + 'T12:00:00Z');
          return Shell.Parse._add(today, (7 - d.getUTCDay()) % 7 || 7);
        }
        const DOW = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
        m = /^(next )?(sun|mon|tues|wednes|thurs|fri|satur)day/.exec(t);
        if (m) {
          const want = DOW.findIndex(d => d.startsWith(m[2]));
          const d = new Date(today + 'T12:00:00Z');
          let delta = (want - d.getUTCDay() + 7) % 7;
          if (delta === 0 || m[1]) delta = delta || 7;
          return Shell.Parse._add(today, delta);
        }
        /* "sep 21", "21 sep", "september 21st" — the year is inferred as the NEXT occurrence,
         * because an admin typing a bare month/day always means the one that has not happened. */
        m = /(^|\s)([a-z]{3,9})\s+(\d{1,2})(st|nd|rd|th)?(\s|$)/.exec(t)
         || /(^|\s)(\d{1,2})(st|nd|rd|th)?\s+([a-z]{3,9})(\s|$)/.exec(t);
        if (m) {
          const word = /^\d/.test(m[2]) ? m[4] : m[2];
          const day  = +(/^\d/.test(m[2]) ? m[2] : m[3]);
          const mi = Shell.Parse.MONTHS.indexOf(word.slice(0,3));
          if (mi >= 0 && day >= 1 && day <= 31) {
            const y = +today.slice(0,4);
            let iso = Shell.Parse._iso(new Date(Date.UTC(y, mi, day)));
            if (iso < today) iso = Shell.Parse._iso(new Date(Date.UTC(y + 1, mi, day)));
            return iso;
          }
        }
        return null;
      },

      /* A range in any of the shapes an admin actually types:
       *   "Sep 8 - Sep 22"  ·  "Sep 13-15"  ·  "Sep 20 through Oct 4"  ·  "Sep 8 to Sep 22" */
      range(str, base){
        const t = String(str || '').replace(/–|—/g, '-');
        const m = /(.+?)\s*(?:-|–|to|through|until|till)\s*(.+)/i.exec(t);
        if (!m) { const d = Shell.Parse.date(t, base); return d ? { start:d, end:null } : null; }
        const a = Shell.Parse.date(m[1], base);
        if (!a) return null;
        /* "Sep 13-15" — the right half has no month, so it borrows the left half's. */
        let b = Shell.Parse.date(m[2], base);
        if (!b && /^\s*\d{1,2}\s*$/.test(m[2])) {
          b = Shell.Parse.date(a.slice(0,7) + '-' + String(+m[2]).padStart(2,'0'), base);
        }
        return { start:a, end: b && b >= a ? b : null };
      },

      /* Which kind of thing a line describes. The vocabulary is the bot's, not invented:
       * these are the six lanes in LANES, and the words are the ones the source lines use. */
      KIND: [
        { key:'patchNotes',     re:/patch\s*(notes?)?\b|^#\s|update\s+notes/i,        label:'Patch notes' },
        /* `ranked` is tested before `series`, because "Ranked Series 12" is a ranked window and
         * "Undead Legion Series Armory" is a draw window, and only one word separates them. */
        { key:'playlist',       re:/\branked\b/i,                                      label:'Ranked' },
        { key:'returningDraws', re:/\breturn(ing)?\b|\bback\b|\brerun\b/i,            label:'Returning draw' },
        { key:'drawWindow',     re:/\barmory\b|\bseries\b|\bwindow\b/i,               label:'Draw window' },
        { key:'newDraws',       re:/\bdraw\b|\blucky\b|\bcrate\b/i,                   label:'New draw' },
        { key:'event',          re:/\bevent\b|\bsiege\b|\bzombies\b|\bweekend\b|\bxp\b|\b2x\b/i, label:'Event' },
        { key:'playlist',       re:/\bplaylist\b|\bmode\b|\branked\b|\bmp\b|\bbr\b/i, label:'Playlist' }
      ],

      /* ── 2 · PASTE ANYTHING. GET ROWS. ─────────────────────────────────────
       * One line in, one row out: kind, name and dates worked out separately so a line that
       * gives up on one still yields the others. A row with `start === null` is reported as
       * needing a date rather than dropped — a parser that silently discards what it could
       * not read is the worst possible version of this feature. */
      /* A date EXPRESSION, written once and reused three ways. Built from the month names
       * rather than from `[a-z]{3,9}`, which is the whole reason this is a constant and not an
       * inline regex: the loose version matched "Series 12" in "Ranked Series 12 ends Sep 10"
       * and dated the row to nothing. A parser that finds a date in a serial number is worse
       * than one that finds none, because the wrong answer is the one you act on. */
      _D: '(?:\\d{4}-\\d{2}-\\d{2}'
        + '|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?'
        + '|\\d{1,2}(?:st|nd|rd|th)?\\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*'
        + '|today|tomorrow|yesterday'
        + '|in\\s+\\d+\\s+(?:day|week|month)s?'
        + '|end\\s+of\\s+(?:the\\s+)?(?:month|week)'
        + '|(?:next\\s+)?(?:sun|mon|tues|wednes|thurs|fri|satur)day)',

      /* ── 2 · PASTE ANYTHING. GET ROWS. ─────────────────────────────────────
       * One line in, one row out: kind, name and dates worked out SEPARATELY, so a line that
       * gives up on one still yields the others. A row with `start === null` is reported as
       * needing a date rather than dropped — a parser that silently discards what it could not
       * read is the worst possible version of this feature, because "it read six lines" and
       * "it read four and threw two away" look identical.
       * 🔴 THE DATE IS EXTRACTED BY MATCHING, NOT BY SPLITTING. The first version split each
       * line on `|` `,` `—` and then rejoined the pieces with spaces, which cut "Sep 8 - Sep 22"
       * in half at the pipe before it and destroyed the hyphen after it: three of the six
       * reference lines came back wrong, and two of those still LOOKED like successes because
       * they carried a plausible single date. Measured against the six known lines before it was
       * pointed at anything unknown. */
      line(raw){
        const src = String(raw || '').trim();
        if (!src) return null;
        const kind = Shell.Parse.KIND.find(k => k.re.test(src))
                  || Shell.Parse.KIND.find(k => k.key === 'newDraws');
        const D = Shell.Parse._D;
        const RANGE = new RegExp('(' + D + ')\\s*(?:-|–|—|to|through|until|till)\\s*(' + D + '|\\d{1,2}(?:st|nd|rd|th)?)', 'i');
        const SINGLE = new RegExp(D, 'i');
        let start = null, end = null, hit = '';
        let m = RANGE.exec(src);
        if (m) {
          hit = m[0];
          start = Shell.Parse.date(m[1]);
          /* "Sep 13-15" — the right half has no month, so it borrows the left half's. */
          end = Shell.Parse.date(m[2])
             || (start && /^\d{1,2}(st|nd|rd|th)?$/.test(m[2].trim())
                  ? start.slice(0, 8) + String(parseInt(m[2], 10)).padStart(2, '0') : null);
          if (end && start && end < start) end = null;
        } else {
          m = SINGLE.exec(src);
          if (m) { hit = m[0]; start = Shell.Parse.date(m[0]); }
        }
        let name = hit ? src.replace(hit, ' ') : src;
        name = name.replace(/^[\s#>*\-–—•]+/, '')
                   /* the connective the date hung off — "…returns Sep 20", "…ends Sep 10" */
                   .replace(/\s*\b(ends?|starts?|opens?|closes?|runs?|returns?|drops?|through|until|till|on|from|is|are)\b\s*$/i, '')
                   .replace(/[\s—–|,;:.\-]+$/, '')
                   .replace(/\s{2,}/g, ' ').trim();
        return { kind: kind.key, kindLabel: kind.label, name,
                 start, end, source: src };
      },
      rows(text){
        return String(text || '').split(/\r?\n/).map(l => Shell.Parse.line(l)).filter(Boolean);
      }
    },

    /* ── THE PASTE PANEL ───────────────────────────────────────────────────
     * ⚠️ "paste-anything needs to be more intuitive." The first shape was a button that
     * opened a drawer that held a textarea — three steps before you could paste, and the
     * feature's whole claim is that there are no steps. It is now a field IN the composer,
     * beside the form it replaces, and it parses AS YOU TYPE with the rows visible: the
     * demonstration and the control are the same object, so nothing has to be explained. */
    pasteRows({ host, types, onStage, sample, collapsed }){
      if (!host) return;
      const id = 'pz' + Math.random().toString(36).slice(2, 7);
      host.innerHTML = `
        <div class="pz${collapsed ? ' shut' : ''}">
          <button type="button" class="pz-open" id="${id}b">Or paste a list instead</button>
          <label class="nw-l" for="${id}">Paste anything &mdash; patch notes, a Discord message, a list</label>
          <textarea class="pz-in" id="${id}" rows="4" spellcheck="false"
                    placeholder="${(sample || '').replace(/"/g,'&quot;')}"></textarea>
          <div class="pz-out" id="${id}o"></div>
        </div>`;
      const ta = document.getElementById(id), out = document.getElementById(id + 'o');
      const paint = () => {
        const rows = Shell.Parse.rows(ta.value);
        const ok = rows.filter(r => r.start);
        if (!ta.value.trim()) { out.innerHTML = ''; return; }
        out.innerHTML = `
          <div class="pz-rows">${rows.map((r, i) => {
            const t = (types || []).find(x => x.key === r.kind);
            return `<div class="pz-r${r.start ? '' : ' bad'}" style="--c:${t ? t.hex : 'var(--ink4)'}">
              <i class="pz-d"></i>
              <span class="pz-k">${r.kindLabel}</span>
              <span class="pz-n">${r.name || '<em>unnamed</em>'}</span>
              <span class="pz-w">${r.start ? (r.end ? r.start + ' → ' + r.end : r.start) : 'no date found'}</span>
            </div>`; }).join('')}</div>
          <div class="pz-act">
            <span class="pz-sum">${ok.length} of ${rows.length} line${rows.length === 1 ? '' : 's'} understood${
              rows.length - ok.length ? ' &middot; the rest need a date' : ''}</span>
            <button type="button" class="chip go" id="${id}s"${ok.length ? '' : ' disabled'}>Stage ${ok.length}</button>
          </div>`;
        const b = document.getElementById(id + 's');
        if (b) b.onclick = () => { onStage(ok); ta.value = ''; paint(); };
      };
      ta.addEventListener('input', paint);
      ta.addEventListener('paste', () => setTimeout(paint, 0));
      const opener = document.getElementById(id + 'b');
      if (opener) opener.onclick = () => {
        opener.closest('.pz').classList.remove('shut'); ta.focus();
      };
    },

    /* ── A DATE FIELD THAT UNDERSTANDS ─────────────────────────────────────
     * Upgrades one text input in place: it accepts anything Parse.date does and shows what
     * it resolved to underneath, in words, before anything is stored. The resolved value is
     * written to a hidden ISO field, so every consumer downstream still reads an ISO date and
     * nothing has to know this exists. Never silently corrects — an unparsed value shows as
     * unparsed rather than falling back to today, which is how a date feature loses trust. */
    dateField(input, onResolve){
      if (!input || input.dataset.smart) return;
      input.dataset.smart = '1';
      const note = document.createElement('span');
      note.className = 'nw-date-echo';
      input.insertAdjacentElement('afterend', note);
      const FMT = { weekday:'short', month:'short', day:'numeric', timeZone:'UTC' };
      const sync = () => {
        const raw = input.value.trim();
        const iso = Shell.Parse.date(raw);
        input.dataset.iso = iso || '';
        input.classList.toggle('unparsed', !!raw && !iso);
        note.textContent = !raw ? ''
          : iso ? new Date(iso + 'T12:00:00Z').toLocaleDateString(undefined, FMT) + '  ·  ' + iso
                : 'not a date yet';
        note.className = 'nw-date-echo' + (raw && !iso ? ' bad' : iso ? ' ok' : '');
        onResolve && onResolve(iso);
      };
      input.addEventListener('input', sync);
      input.addEventListener('blur', sync);
      sync();
    },

    /* ══════════ THE COMMAND BAR ══════════
     * A realm calls this with its own command list. Without it the input still works as a
     * launcher for whatever palette the page already has, so a page that has not been converted
     * degrades to what it had rather than to nothing. */
    commandBar({ items, run, placeholder }){
      const wrap = document.getElementById('cmdBar'), inp = document.getElementById('cbIn');
      /* Named here rather than in the markup because the markup does not know which page it is
       * on. `phFull` is what the shrink logic reads as the longest candidate, so it has to be
       * set before the first measurement rather than after. */
      if (inp && !placeholder) {
        const here = hereRealm();
        const ph = here ? 'Search ' + here.label + ', or run a command' : 'Search, or run a command';
        inp.placeholder = ph; inp.dataset.phFull = ph; inp.setAttribute('aria-label', ph);
        if (here) inp.dataset.phShort = 'Search ' + here.label;
      }
      if (!wrap || !inp) return;
      /* The input opts OUT of the global form reset rather than trying to out-specify it —
       * see the long note on that rule in app.css. Set here rather than in the markup so a
       * page cannot ship the command bar without it. */
      inp.setAttribute('data-bare', '');
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
      /* ── 5 · ⌘K THAT ACTS, NOT JUST GOES PLACES ─────────────────────────
       * The bar existed and only navigated: it could find a page and could not do anything
       * on one. It runs the SAME parser as the paste box, so "Undead Legion Series Armory
       * Sep 8 - Sep 22" stages a draw window from one line without opening a drawer. Every
       * verb in the portal is already a registered op with a tier, which is what makes this
       * checkable rather than clever — the action carries the tier into Store.add exactly as
       * a form would, so Review, the export interlock and the inverse all still apply.
       * ⚠️ It is offered, never auto-run: the top row is a suggestion you press Enter on, and
       * the row SAYS what it will stage. A command bar that acts on a guess is the blind
       * execute this whole staging model exists to prevent. */
      const acted = t => {
        if (!Shell._cbStage || t.trim().length < 6) return [];
        const r = Shell.Parse.line(t);
        if (!r || !r.start || !r.name) return [];
        return [{ k: 'Stage ' + r.kindLabel.toLowerCase() + ' &middot; ' + r.name + '  ' +
                     (r.end ? r.start + ' → ' + r.end : r.start),
                  act: true, c: 'staged', run: () => Shell._cbStage(r) }];
      };
      const paint = () => {
        const t = inp.value.toLowerCase().trim();
        hits = acted(inp.value).concat(items().filter(c => !t || c.k.toLowerCase().includes(t)));
        sel = Math.min(sel, Math.max(0, hits.length - 1));
        list.innerHTML = hits.length
          ? hits.map((c, i) => `<button class="pitem${i === sel ? ' sel' : ''}${c.act ? ' act' : ''}" role="option"
              aria-selected="${i === sel}" data-i="${i}"><i style="--c:${c.hex || `var(--${c.c || 'ink3'})`}"></i>${c.k}</button>`).join('')
          : `<p class="pnone">Nothing matches “${inp.value.trim()}”. Try a page name, or paste a line like
               “Crimson Moonlight Draw &mdash; Sep 3”.</p>`;
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
      /* Exposed so the account menu's "Find a page or an action" can reach the same input the
       * ⌘K handler below focuses. Its predecessor claimed to switch realms and only toasted a
       * sentence about where the rail is — a control has to DO the thing its label names. */
      Shell._cmdInput = inp;
      Shell.commandBarFocus = () => { const i = Shell._cmdInput; if (i) { i.focus(); i.select(); } };
      document.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inp.focus(); inp.select(); }
      });
      window.__openPalette = () => { inp.focus(); inp.select(); paint(); };
    },

    /* ── HOW LONG IS LEFT IN THIS SEASON — one derivation, two surfaces ──────
     * 🔴 Season's masthead read 79 while its own "Live season" strip three lines below read
     * "battle pass Sep 10 · 17 days left", and Home's new figure row made it a third reading.
     * The cause is that `seasonEnd()` in season.html takes the LAST of the three deadlines —
     * which is CORRECT for the conflict predicate it was written for ("an item running past BP
     * but inside Ranked is not a conflict") and wrong for "how long is left", because what a
     * player calls the season ends at the FIRST deadline. Two different questions wearing one
     * function, which is the shape this branch keeps paying for.
     * So: the conflict predicate keeps the last deadline and says why, this returns the first,
     * and it NAMES which deadline it used — an unlabelled "17" beside a strip listing three
     * different dates is the ambiguity that let the two drift in the first place. */
    /* ── HOW LONG IS LEFT, AT THE PRECISION THE DATA ACTUALLY HAS ──────────
     * ⚠️ "Days left 17" was a frozen integer while the account panel counts a session down to
     * the minute and NOW carries a real clock — three approaches to time in one product.
     * 🔴 AND THE REASON IT WAS FROZEN WAS A MISREADING OF HIS OWN CONSTRAINT. §5.9z.2 killed
     * AMBIENT time — draining windows, a creeping NOW — because "a quantity that moves slower
     * than a session cannot be shown as MOTION". That is an argument about animation. It says
     * nothing about PRECISION, and filing a countdown under it was my error.
     * 🔴 The unit is chosen by what the record HOLDS. `bpEnd` is a DATE, not a timestamp, so
     * hours are invented precision for most of the season — until the last stretch, when the
     * question stops being "which week" and becomes "is this landing today". It switches at
     * 3 days, which is the only point where an hour changes a decision. */
    countdown(iso, today){
      if (!iso) return null;
      const end = new Date(iso + 'T23:59:59Z').getTime();
      /* 🔴 `today` WAS DECLARED AND NEVER READ — this used Date.now(). The call site in
       * season.html passes F.today and looked correct, so nothing about it read as wrong;
       * the masthead simply counted from the real wall clock while every other figure on
       * the page counted from the fixture date. Found 2026-08-25 by looking at the Board
       * view: the masthead said "16d BATTLE PASS" 120px above a strip saying "battle pass
       * Sep 10 · 17 days left". One quantity, two authorities, disagreeing on screen.
       * The second, worse half: `?today=YYYY-MM-DD` is how this package renders states the
       * fixtures never produce, and this was the one element that ignored it — so no
       * ?today= check could ever fail here. A check cannot fail on an element it cannot reach. */
      const now = today ? new Date(today + 'T00:00:00Z').getTime() : Date.now();
      const ms = end - now;
      if (ms <= 0) return { text:'ended', hot:true, done:true };
      const days = Math.floor(ms / 86400000), hrs = Math.floor(ms / 3600000);
      if (days >= 3)  return { text: days + 'd', hot:false };
      if (hrs  >= 1)  return { text: hrs + 'h',  hot:true };
      return { text: Math.max(1, Math.floor(ms / 60000)) + 'm', hot:true };
    },

    /* ═══ ICONS ═══
     * 🔴 DELEGATED, NOT BOLTED ON. icons.js originally did `Shell.icon = icon` at the end of
     * its own module, which meant the method existed only if icons.js had already run when a
     * caller reached for it - and a page's own inline script runs during parsing, before any
     * deferred module. The result was "Shell.icon is not a function" and a page that rendered
     * nothing but its chrome, with no error anywhere except one line in the console.
     * Declaring the methods HERE and looking the implementation up at call time removes the
     * ordering question entirely: whenever an icon is actually drawn, icons.js has loaded. */
    icon(name, o){ return window.Icons ? window.Icons.icon(name, o) : ''; },
    fold(open, o){ return window.Icons ? window.Icons.fold(open, o) : ''; },

    /* ═══ THE SEASON CLOCK ═══
     * 🔴 A COUNTDOWN IS A CLOCK. It RUNS - you look at it and it has changed since last time.
     * Four static compositions of a rendered integer were rejected in one sentence ("I told
     * you they are a countdown"), and six paddings of a digital readout were rejected in
     * another. The seconds place is not a planning unit; nobody schedules a battle pass to
     * the second. It is the PROOF OF LIFE - it says this is a live measurement of a real
     * deadline and not a number somebody typed into a config.
     *
     * 🔴 THE NEXT DEADLINE IS A MOMENT, NOT A LINE. bpEnd and rankEnd are both 2026-09-10, so
     * this season has TWO deadline MOMENTS, not three deadlines - one of them ends two lines
     * at once. The Track's own notch layer has grouped by date since it was rebuilt; every
     * other surface counted three, and the page stated both at the same time. */
    countdownParts(iso, today){
      if (!iso) return null;
      const end = new Date(iso + 'T23:59:59Z').getTime();
      /* A pinned ?today= must still TICK, or the one mechanism this package has for rendering
       * states the fixtures never produce cannot reach the one element whose entire point is
       * that it moves. The pinned date becomes an ORIGIN: midnight there, running forward in
       * real time from page load. §16.23 is what getting this backwards costs. */
      let now = Date.now();
      if (today) {
        const k = 'ck:' + today;
        if (!Shell[k]) Shell[k] = Date.now() - new Date(today + 'T00:00:00Z').getTime();
        now = Date.now() - Shell[k];
      }
      let ms = end - now;
      if (ms <= 0) return { past:true, d:0, h:0, m:0, s:0 };
      const d = Math.floor(ms / 86400000); ms -= d * 86400000;
      const h = Math.floor(ms / 3600000);  ms -= h * 3600000;
      const m = Math.floor(ms / 60000);    ms -= m * 60000;
      return { past:false, d, h, m, s: Math.floor(ms / 1000) };
    },

    /* 🔴 FIVE TIERS, NOT ONE ORANGE. The previous version was `hot = d < 3` - a single
     * if-statement on an element whose whole subject is a continuously rising pressure, so
     * 4 days looked like 40 days and 2 days looked like 2 minutes. Harkirat: "are u telling
     * me theres only 1 tier of time warning". Each tier REMOVES something rather than
     * shouting louder, so the composition sharpens by subtraction as the season closes. */
    seasonTier(days){
      if (days === null || days === undefined) return 'none';
      if (days <= 0) return 'today';
      if (days <= 2) return 'final';
      if (days <= 7) return 'closing';
      if (days <= 21) return 'running';
      return 'open';
    },

    /* The deadline MOMENTS ahead, grouped by date, nearest first. Two lines sharing a date
     * are one moment. Used by Season and Home, so they cannot disagree about the count. */
    seasonMoments(season, today){
      const out = [], by = {};
      /* 🔴 READ THE LINES FROM THE FIXTURE, NOT FROM A FIELD I INVENTED. The first version
       * of this said `Shell._LINES || []`, and nothing anywhere ever sets Shell._LINES - so
       * it returned an empty array and the clock rendered "No deadline set for this season"
       * on a season with three of them. It did not throw and it did not look broken; it
       * looked like a season with no dates. A well-formed answer to a question nobody asked. */
      ((window.FIX && window.FIX.LINES) || []).forEach(L => {
        const iso = season[L.endKey];
        if (season[L.tbdKey] || !iso) return;
        if (!by[iso]) { by[iso] = { iso, lines: [] }; out.push(by[iso]); }
        by[iso].lines.push(L);
      });
      const t = new Date(today).getTime();
      return out.filter(m => new Date(m.iso).getTime() >= t)
                .sort((a, b) => a.iso < b.iso ? -1 : 1);
    },

    /* A SECOND shared timer, at one second, for clocks only. tick()'s 60s cadence is right
     * for everything else and waking every callback 60x more often to serve one element is
     * the wrong trade. Same lazy contract: nothing registered, no interval. */
    tickSeconds(fn){
      (Shell._sTicks = Shell._sTicks || []).push(fn); fn();
      if (!Shell._sTimer) Shell._sTimer = setInterval(() =>
        Shell._sTicks.forEach(f => { try { f(); } catch (e) {} }), 1000);
    },

    /* Everything counting down ticks on ONE timer, so a page cannot end up with two clocks
     * disagreeing by a second — and a page with nothing to count starts no interval at all. */
    tick(fn){
      (Shell._ticks = Shell._ticks || []).push(fn); fn();
      if (!Shell._tickTimer) Shell._tickTimer = setInterval(() => Shell._ticks.forEach(f => { try { f(); } catch (e) {} }), 60000);
    },

    seasonDaysLeft(season, today){
      const LINES = [['bpEnd','battle pass'], ['rankEnd','ranked'], ['dmzEnd','dmz']];
      const live = LINES.filter(([k]) => !season[k + 'TBD'] && season[k])
                        .map(([k, label]) => ({ iso: season[k], label }))
                        .sort((a, b) => a.iso < b.iso ? -1 : 1);
      if (!live.length) return { days:null, label:'no deadline set', iso:null };
      const d = Math.max(0, Math.round((new Date(live[0].iso) - new Date(today)) / 86400000));
      return { days:d, label:live[0].label, iso:live[0].iso };
    },

    /* A realm declares what ⌘K may STAGE on it. Absent, the bar only navigates — which is
     * what it did everywhere before this, and is still the correct behaviour on a realm with
     * nothing to create (Analytics, Review, the Door). */
    registerCommandStage(fn){ Shell._cbStage = fn; },

    /* The floor every realm gets for free: move between realms, review what is staged, sign out.
     * A realm with more to offer calls commandBar again and replaces this list. */
    defaultCommands(){
      return [
        ...REALMS.map(r => ({ k: 'Go to ' + r.label, c: 'ink3', run: () => location.href = r.href })),
        { k: 'Review staged changes', c: 'ok',  run: () => location.href = 'review.html' },
        /* ⚠️ This used to click `#hdrOut`, the header sign-out button — which moved into the
         * account panel in the same change that wrote this comment. A command that clicks an
         * element by id is a reference nothing type-checks; it calls the handler now. */
        { k: 'Sign out',              c: 'del', run: () => Shell._signOut && Shell._signOut() }
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
                   a: initial.a || '', b: initial.b || '',
                   aText: initial.a || '', bText: initial.b || '' };
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
          <!-- 🔴 A DATE PICKER, IN A PORTAL FOR A BOT THAT HAS UNDERSTOOD "in 3 weeks" FOR A
               YEAR. chrono-node is already a dependency — it is how /manage parses admin dates
               today — and the portal was the one surface that made you click through a calendar
               instead. These take anything a person would type and show what they resolved to,
               in words, underneath. Nothing is stored until it has resolved, and an unparsed
               value stays unparsed rather than silently becoming today. -->
          <div class="nw-dates${one ? ' one' : ''}">
            <div><label class="nw-l" for="nw-a">${one ? (t.dateLabel || 'Releases') : 'Opens'}</label>
              <input class="nw-i nw-smart" id="nw-a" type="text" autocomplete="off" spellcheck="false"
                     placeholder="sep 21, in 3 weeks, tomorrow" value="${st.aText || st.a}"></div>
            ${one ? '' : `<div><label class="nw-l" for="nw-b">Closes</label>
              <input class="nw-i nw-smart" id="nw-b" type="text" autocomplete="off" spellcheck="false"
                     placeholder="end of the month" value="${st.bText || st.b}"></div>`}
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

      /* ⚠️ "paste anything needs to be more intuitive." The intuitive version is not a better
       * drawer — it is not being a drawer. The field sits inside the composer, beside the form
       * it replaces, and parses as you type: one thing to look at, and the demonstration and
       * the control are the same object. */
      const shell = `<div class="nw">
             <div class="nw-types" role="group" aria-label="What are you adding">${chips()}</div>
             ${onStage && onStage.bulk ? `<div class="nw-paste" id="nw-paste"></div>` : ''}
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
      if (onStage && onStage.bulk) Shell.pasteRows({
        host: d.querySelector('#nw-paste'), types, collapsed: !!initial.type,
        sample: 'Crimson Moonlight Draw - Sep 3\nUndead Legion Series Armory | Sep 8 - Sep 22\n2x Weapon XP Weekend, Sep 13-15',
        onStage: rows => onStage.bulk(rows) });
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
        /* The typed TEXT and the resolved ISO are kept apart on purpose: `st.a` is what every
         * consumer downstream reads and is always an ISO date or empty, `st.aText` is only what
         * the field shows so a repaint does not throw away half-typed words. */
        if (a) Shell.dateField(a, iso => { st.a = iso || ''; st.aText = a.value; light(); });
        if (b) Shell.dateField(b, iso => { st.b = iso || ''; st.bText = b.value; light(); });
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
    /* 🔴 IT RE-RUNS UNCONDITIONALLY, NOT ONLY WHEN FONTS ARE PENDING — and that distinction was
     * hiding wrong measurements behind a green result.
     * The re-run was gated on `document.fonts.status !== 'loaded'`. With WARM fonts that is
     * already 'loaded' on the first call, so no second pass was scheduled at all — and the only
     * pass that ran was the synchronous one, which fires before the Track's own measuring passes
     * (repositionBars, fitLabels, clusterPoints, stackFlags) have run inside their
     * requestAnimationFrame. So the audit measured a half-laid-out page.
     * MEASURED 2026-08-24: rule 13 reported `.tk at 239` while the very same element, queried a
     * second later in the same frame tree, was at 249. The geometry was correct and the audit was
     * looking at it too early. Every geometric rule here has been doing that — which means some
     * of this file's silence has been silence about the wrong pixels.
     * "Fonts loaded" is not "the page has finished measuring itself". Two frames after fonts
     * settle is, and the pass is idempotent, so the extra run costs nothing but honesty. */
    /* 🔴 requestAnimationFrame DOES NOT FIRE IN A PAGE THAT IS NOT BEING RENDERED — a
     * backgrounded tab, a hidden pane, or an iframe parked off-screen. The settled pass was
     * gated on rAF ALONE, so in exactly those situations it never ran and `__selfCheck` kept
     * the FIRST, unsettled measurement forever, with `pending` stuck true and nothing saying so.
     * MEASURED 2026-08-25: the same Broadcast page reported `.ruler at 249 vs .tk at 239` in a
     * hidden pane and one origin at 249 in a visible tab — same bytes, same width, same frame
     * tree. That is where the states sweep's geometry "false positives" came from, and it is
     * why they never reproduced by hand: the reproduction step was "look at it", which makes
     * the tab visible. `.states.html` parks its frames at `left:-4000px`; `.audit-all.html`
     * renders them in flow — the entire difference between the two harnesses' results.
     * A wall-clock fallback guarantees a settled pass whatever the compositor is doing; rAF
     * still wins when it fires, because two frames is the more accurate settle. */
    audit(opts = {}){
      const first = Shell._audit(opts);
      const carried = first.interactionProblems || [];
      first.pending = true;
      let settled = false;
      /* The re-measure runs WITHOUT interactions — see rule 9 — and carries that pass's findings
       * forward, so nothing is lost and nothing is measured while a drawer is on its way out. */
      const run = () => { if (settled) return; settled = true;
        const r = Shell._audit(Object.assign({}, opts, { interactions: null }));
        if (carried.length) { r.problems.push(...carried); r.ok = r.problems.length === 0; }
        r.pending = false; };
      /* 🔴 "SETTLED" MEANS THE LAYOUT STOPPED MOVING — never "some milliseconds passed". Two
       * fixed waits were tried and both were wrong on Season, whose Track measures itself after
       * paint (fitLabels, stripSharedPrefixes) and can gain or lose the page scrollbar doing it;
       * every percentage-positioned element shifts by that scrollbar's 10px, and the audit read
       * the middle of the move. `.audit-all.html` waited ~7s and passed, `.states.html` waited
       * 1400ms and failed, on identical bytes — a race dressed up as a product defect, twice.
       * So watch the geometry the geometry rules care about and go when it repeats. The frame
       * cap and the wall-clock backstop both exist because a page that never stops moving, or
       * one that is never painted at all, must still produce a result rather than hang. */
      let last = '', same = 0, frames = 0;
      const tick = () => {
        if (settled) return;
        const probe = document.querySelector('.tk') || document.querySelector('main') || document.body;
        const r = probe.getBoundingClientRect();
        const k = Math.round(r.left) + 'x' + Math.round(r.width) + 'x' + Math.round(document.body.scrollHeight);
        if (k === last) same++; else { same = 0; last = k; }
        if (same >= 2 || ++frames > 90) { run(); return; }
        requestAnimationFrame(tick);
      };
      /* 🔴 AND "AT REST" INCLUDES "NOTHING IS ANIMATING". MEASURED 2026-08-25, frame by frame:
       * Season's `.tk` sits at 239 on the first frame, 246 at 120ms and 249 from 240ms on, while
       * `.ruler` and `.lanes` never move — the lanes have an entry transition and the plot area
       * slides the last 10px into place. Every "two different origins" report that reproduced in
       * a harness and never in a live tab was that transition, caught mid-flight, and the layout
       * was genuinely STABLE for the first frames because the animation had not started yet —
       * which is why watching for stability alone still went too early.
       * Only animations that actually END are awaited; a looping accent pulse or the NOW dot
       * would otherwise hold this open forever, and the wall-clock backstop below is the net. */
      const finite = () => {
        try {
          return document.getAnimations()
            .filter(a => { const t = a.effect && a.effect.getComputedTiming();
                           return t && Number.isFinite(t.iterations) && Number.isFinite(t.endTime); })
            .map(a => a.finished.catch(() => {}));
        } catch (e) { return []; }
      };
      const start = () => Promise.all(finite()).then(() => requestAnimationFrame(tick),
                                                     () => requestAnimationFrame(tick));
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(start, start);
      setTimeout(run, 2500);
      return first;
    },

    _audit({ states, extra, interactions } = {}){
      /* ⚠️ ORDER, NOT LOGIC. `inkFills()` runs from `holdTop()` inside a requestAnimationFrame, so
       * the audit's first synchronous pass measured the state BEFORE it — and reported Broadcast's
       * state badge at 1.19:1 twice after the fix was already correct. An audit must measure the
       * page as it settles, so it settles the derived parts first. Idempotent, so calling it here
       * costs nothing. */
      Shell.inkFills();
      Shell.zeroStats();
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

      /* 5. Every visible interactive element must show a focus ring.
       * 🔴 `preventScroll:true` IS NOT HONOURED HERE, AND THIS IS WHY THE SEASON PAGE OPENED AT
       * THE BOTTOM. Measured 2026-08-25 with the option explicitly set: ONE `.focus()` on an
       * input moved `main.scrollTop` from 0 to 2785 in a single jump. Disabling the sweep, or
       * stubbing `focus`, put the page at 0 — so this sweep was the cause, and the option that
       * exists to prevent exactly this did nothing.
       * The bug was reported, "fixed" with `Shell.holdTop()`, and came back — because holdTop
       * treats the symptom and releases before the SETTLED audit pass runs the sweep a second
       * time. **A diagnostic must not damage the thing it is diagnosing.** So the sweep saves and
       * restores the scroller itself.
       * ⚠️ AND IT MUST BE `main`, NOT `window`. `main` is the scroll container on every portal
       * page (`.app{height:100vh}` + `main{overflow:auto}`), so `window.scrollY` is permanently 0
       * and `window.scrollTo` is a no-op — which is why rule 9's own restore, written to do this
       * job, had never once worked. */
      const scroller = document.querySelector('main') || document.scrollingElement || document.body;
      const keepTop = scroller.scrollTop, keepLeft = scroller.scrollLeft;
      const noFocus = [...document.querySelectorAll('button,input,select,[tabindex]:not([tabindex="-1"])')]
        .filter(el => el.offsetParent !== null)
        .filter(el => { try { el.focus({ preventScroll:true }); } catch(e){ return false; }
          const o = getComputedStyle(el);
          return px(o.outlineWidth) === 0 && o.boxShadow === 'none'; });
      if (noFocus.length) problems.push(`${noFocus.length} focusable element(s) show no focus ring`);
      document.activeElement && document.activeElement.blur();
      scroller.scrollTop = keepTop; scroller.scrollLeft = keepLeft;

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
        /* 🔴 ROOM MEANS ROOM BEFORE THE NEXT BAR — measured against SIBLINGS, not against the
         * lane's edge. This rule measured to the lane edge and reported four false positives
         * ("928px free beside it") on bars that had 23px before their neighbour: a label moved
         * there would have landed on top of another bar. fitLabels() had already learned this
         * and fixed it for itself; the audit kept the old measurement, so TWO AUTHORITIES
         * computed one quantity and disagreed — the same defect class as the two coordinate
         * origins on this Track, in a different place. A gate that cries wolf trains its reader
         * to skim the real ones, so this now measures exactly what the placer measures.
         * Same row = actual vertical overlap; a string comparison on style.top misses any bar
         * positioned by a class or a variable. */
        const sibs = [...tk.querySelectorAll('.bar')].filter(o => o !== bar).map(o => o.getBoundingClientRect())
                       .filter(r => r.top < br.bottom - 1 && r.bottom > br.top + 1);
        const rightWall = Math.min(tr.right, ...sibs.filter(r => r.left >= br.right - 1).map(r => r.left));
        const leftWall  = Math.max(tr.left,  ...sibs.filter(r => r.right <= br.left + 1).map(r => r.right));
        const room = Math.max(rightWall - br.right, br.left - leftWall);
        if (room > l.scrollWidth + 12 && !bar.classList.contains('lbl-out') && !bar.classList.contains('lbl-out-l'))
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

      /* 6. A legend may only name states that are actually present.
       * 🔴 A LEGEND CARRIES TWO KINDS OF ENTRY AND ONLY ONE OF THEM IS A ROW STATE. Access's key
       * explains the lock on the owner-only COLUMN — a property of a scope, true whether or not
       * any cell shows it — and this rule flagged it as a state with none on screen. The fix is
       * not to add it to states(), which would make states() a lie so a check would pass; it is
       * to mark the annotation as an annotation. `data-note` is the opt-out, and it opts out of
       * MATCHING rather than out-specifying, the same discipline as the form reset. */
      if (states) {
        const real = new Set(states());
        document.querySelectorAll('[data-key] span, .key span').forEach(x => {
          if (x.hasAttribute('data-note') || x.closest('[data-note]')) return;
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

      /* 13. ONE DATE, ONE X — EVERY PERCENTAGE-POSITIONED LAYER SHARES ONE CONTAINING BLOCK.
       *     THE defect that has made the Track feel broken through five attempts, and the first
       *     rule here that is about a RELATIONSHIP rather than about one element.
       *     Every dated thing on the Track is placed by a percentage, so its pixel position is a
       *     function of the box it sits in. MEASURED 2026-08-24: `.ov` sat at left=207 width=1158
       *     and `.deadrail` at left=249 width=1116 — a 42px origin gap — and a deadline's line and
       *     its own flag, both carrying the IDENTICAL inline `left:77.0833%`, landed 8px apart.
       *     Harkirat photographed it as "this disconnect in the line".
       *     Nothing could have caught that: every other rule in this file inspects ONE element,
       *     and each of those two was individually perfect. So this compares the containing
       *     blocks themselves — any future layer that positions by date and forgets the shared
       *     origin is reported the first time it renders, whatever elements it holds. */
      (() => {
        /* Scoped to the VISIBLE Track. A hidden view still has a `.tk-inner` in the DOM with a
         * collapsed or stale geometry, and measuring it compares a rendered axis against one that
         * is not being rendered — the same blind spot as auditing only expanded lanes, inverted.
         * `offsetParent` is null inside a `display:none` subtree, so those elements drop out on
         * their own; this makes the intent explicit rather than relying on that. */
        /* 🔴 GEOMETRY IS ONLY MEASURABLE AT REST, and saying so is the honest fix rather than a
         * dodge. Under `?audit=1` the interaction pass opens and closes a drawer; a scrim that
         * has not finished leaving still suppresses the page's scrollbar, which widens the
         * layout by the scrollbar's width and moves every percentage-positioned element with it.
         * Measured: this rule reported `.tk at 239` while the same element, queried moments
         * later in the same frame tree, was at 249 — and the resting page has one origin at
         * every width tested. The disagreement was real and it was between two MOMENTS, not two
         * containers, which is a false positive of exactly the kind that trains a reader to
         * skim. It reports a NOTE while a dialog is up, so the skip is visible rather than a
         * silent pass, and the assertion still runs on every resting render. */
        /* `.scrim` PERSISTS IN THE DOM — closeDrawer only removes its `.on` class, so testing for
         * the element rather than the open STATE skipped this rule on every page after a single
         * interaction, forever. The open state is what suppresses the scrollbar. */
        if (document.querySelector('.drawer.open,.scrim.on')) {
          problems.push('note: the one-origin check is skipped while a dialog is open — geometry is only measurable at rest');
          return;
        }
        /* 🔴 AND ONLY MEASURABLE WHILE THE PAGE IS BEING RENDERED. A document whose tab is
         * hidden still answers getBoundingClientRect() with well-formed numbers — they are just
         * the numbers from before whatever it stopped painting. This rule produced its own most
         * expensive false positive that way (see Shell.audit above). Reporting the skip is the
         * point: silence here would read as a pass on an axis nobody looked at. */
        if (document.visibilityState !== 'visible') {
          problems.push('note: the one-origin check is skipped — this document is not being rendered ' +
            '(visibilityState=' + document.visibilityState + '), so every pixel it reports is stale');
          return;
        }
        /* 🔴 A PROBE MUST SAY WHAT IT COULD NOT SEE. This used to be `.find(...)` with a bare
         * `if (!host) return;` — so on a page whose Track lives behind a view tab, the rule found
         * no visible host at load and passed in silence. MEASURED 2026-08-24 23:5x: Broadcast's
         * Airtime ran its ruler and its lanes on origins 128px apart while `.audit-all.html`
         * reported that page ALL 8 PASS, because Airtime is not the default view. Only the states
         * sweep, which switches views, ever made it visible. Reporting the unmeasured hosts as a
         * NOTE turns "nothing to check" back into "here is what this pass did not cover", which is
         * the difference between a clean result and an uninspected one.
         * It also checks EVERY visible host rather than the first: a page may hold two tracks, and
         * `.find()` silently made the second one unaudited forever. */
        const allHosts = [...document.querySelectorAll('.tk-inner')];
        const hosts = allHosts.filter(h => h.getBoundingClientRect().width > 0 && !h.closest('[hidden]'));
        if (hosts.length < allHosts.length)
          problems.push(`note: ${allHosts.length - hosts.length} of ${allHosts.length} track host(s) ` +
            'are in a hidden view and were NOT measured for a shared origin — switch the view and re-run');
        if (!hosts.length) return;
        hosts.forEach(host => {
          /* The OVERVIEW strip is excluded, and the exclusion is a real distinction rather than a
           * convenience: it plots the WHOLE season while the lanes plot the current window, so its
           * percentages mean something different and unifying them would be wrong. Anything else
           * that positions by date must share the lanes' origin. */
          const layers = [...host.querySelectorAll('*')]
            .filter(e => /left:\s*[\d.]+%/.test(e.getAttribute('style') || ''))
            .filter(e => !e.closest('.mini,.ovw,.scrub,.overview,.spark'))
            .map(e => e.offsetParent).filter(Boolean);
          /* NAME THE OFFENDER. The first version printed only the boxes ("249x995 · 239x995"),
           * which told a reader that something was wrong and nothing about where — so acting on
           * it meant re-deriving the whole measurement by hand. A check that reports a symptom
           * without an address is a check somebody skips. */
          const boxes = new Map();
          layers.forEach(p => {
            const r = p.getBoundingClientRect();
            const k = Math.round(r.left) + 'x' + Math.round(r.width);
            if (!boxes.has(k)) boxes.set(k, { n: 0, who: '.' + String(p.className || p.tagName).split(' ')[0] });
            boxes.get(k).n++;
        });
        /* 🔴 THE REPORT CARRIES ITS OWN CONTEXT. This gap kept reappearing in one harness and
         * never in a live tab, and each investigation re-derived the same three numbers by hand.
         * A scrollbar arriving or leaving moves every percentage-positioned element by its
         * width, so the line states the scrollbar, the page height and the viewport width beside
         * the boxes: if two runs differ in those, the disagreement was between two MOMENTS
         * rather than two containers, and that is now readable from the line itself. */
        if (boxes.size > 1) {
          const m = document.querySelector('main');
          const ctx = `[w=${window.innerWidth} sbar=${m ? m.offsetWidth - m.clientWidth : '?'} ` +
                      `h=${document.body.scrollHeight} vis=${document.visibilityState}]`;
          problems.push(`the Track positions dates against ${boxes.size} different origins — ` +
            [...boxes.entries()].map(([k, v]) => `${v.who} at ${k} (${v.n})`).join(' vs ') +
            ` — one date will render at ${boxes.size} different x ${ctx}`);
        }
        });
      })();

      /* 15. A MARK THAT FIRES ON ALMOST EVERY ROW CARRIES NO INFORMATION.
       *     🔴 SEVEN INSTANCES OF ONE DEFECT IN THIS PACKAGE, and every one of them passed every
       *     other rule here: Armory's headline read 109 of 125 when 104 were merely stale; three
       *     separate zeros rendered in an accent; Analytics' success-rate tile tested `any error
       *     at all` on a continuous quantity, so in production it would have been orange forever;
       *     the Board painted all 39 relative-time figures in the alarm colour; and the coverage
       *     meter was green on every card because its override selector was dead.
       *     None of those is visible one element at a time — each element was individually
       *     correct. It is a fact about a class across its SIBLING SET, which is the same shape
       *     as the one-origin rule and the reason both exist.
       *     ⚠️ IT REPORTS A NOTE, NEVER A FAILURE. A universally-applied accent is sometimes
       *     right (a brand colour, a single-item list), and a rule that cannot tell those apart
       *     must not block — a check that cries wolf is switched off, which costs more than it
       *     saves. The note names the class and the ratio so a person decides in one glance. */
      (() => {
        const NEUTRAL = /rgba?\(0, 0, 0, 0\)|transparent/;
        const groups = new Map();
        document.querySelectorAll('[class]').forEach(el => {
          const parent = el.parentElement; if (!parent || !el.checkVisibility?.()) return;
          const cls = String(el.className).split(' ').filter(Boolean).join('.');
          if (!cls) return;
          const key = String(parent.className).split(' ')[0] + '>' + el.tagName + '.' + cls;
          if (!groups.has(key)) groups.set(key, { on: 0, total: 0, sample: el });
        });
        /* Compare each element against its OWN siblings of the same tag — the population a
         * reader actually scans — rather than against the page, which would drown every set. */
        const seen = new Set();
        document.querySelectorAll('*').forEach(parent => {
          const kids = [...parent.children];
          if (kids.length < 8) return;                       // too few to say anything
          /* 🔴 COUNT SIBLINGS THAT CARRY THE MARK, NOT MARKS. The first version tallied every
           * marked descendant against the sibling count and reported "25 of 14 siblings (179%)" —
           * a ratio above 100% discredits a check instantly, whatever it found. The question is
           * "how many ROWS are marked", so a row with two marks still counts once. */
          const tally = new Map();
          kids.forEach(k => {
            const names = new Set();
            [...k.querySelectorAll('[class]')].forEach(e => {
              if (NEUTRAL.test(getComputedStyle(e).color)) return;
              const n = String(e.className).split(' ').find(x => /warn|dang|bad|alert|soon/.test(x));
              if (n) names.add(n);
            });
            names.forEach(n => tally.set(n, (tally.get(n) || 0) + 1));
          });
          tally.forEach((n, cls) => {
            const ratio = n / kids.length;
            const key = cls + '@' + kids.length;
            if (ratio >= 0.9 && !seen.has(key)) {
              seen.add(key);
              problems.push(`note: .${cls} marks ${n} of ${kids.length} siblings (${Math.round(ratio * 100)}%) — ` +
                'a mark that fires on almost every row carries no information; check the threshold behind it');
            }
          });
        });
      })();

      /* 14. NO ANIMATION MAY ESCAPE `prefers-reduced-motion`.
       *     🔴 THE FIRST RULE HERE THAT READS THE STYLESHEET RATHER THAN THE PAGE, and it exists
       *     because reading the CSS by eye said this was fine for weeks. MEASURED 2026-08-25:
       *     93 selectors declared motion, 44 had an override, and TEN carrying a real `animation`
       *     did not — one of them an infinite 2.8s pulse, which is the most literal case the
       *     preference exists for. Six reduced-motion blocks existed and the syntax was right;
       *     what was missing was coverage, and nothing could see coverage by looking at a block.
       *     ⚠️ SCOPE IS `animation`, NOT EVERY TRANSITION. A colour or opacity transition is not
       *     movement, and neutralising all of them would flatten the interface for no
       *     accessibility gain — a check that demands the wrong thing gets switched off.
       *     ⚠️ This asserts COVERAGE, not that the preference works. Nothing in this session could
       *     emulate the media feature, so what is proven is that every animating selector has an
       *     override — a necessary condition, and the one that was actually false. */
      (() => {
        const moving = [], covered = new Set();
        const walk = (rules, inRM) => {
          for (const r of rules) {
            if (r.type === CSSRule.MEDIA_RULE) {
              walk(r.cssRules, inRM || /prefers-reduced-motion/.test(r.conditionText || r.media.mediaText));
              continue;
            }
            if (!r.selectorText || !r.style) continue;
            const a = r.style.getPropertyValue('animation') || r.style.getPropertyValue('animation-name');
            if (inRM) { r.selectorText.split(',').forEach(x => covered.add(x.trim())); continue; }
            /* `all: unset` sets every property including `animation`, and the computed value it
             * reports is "unset" rather than "none" — so a button doing a full reset was flagged
             * as an animating selector on all eight pages. The CSS-wide keywords are the absence
             * of an animation, not the presence of one. Found by the rule firing on the sortable
             * button added minutes earlier, which is the rule working: it noticed a new selector
             * declaring animation, and the fix is to teach it what "no animation" looks like. */
            if (a && !/^\s*(none|unset|initial|revert|revert-layer)\b/.test(a))
              r.selectorText.split(',').forEach(x => moving.push(x.trim()));
          }
        };
        for (const sh of document.styleSheets) { try { walk(sh.cssRules, false); } catch (e) { /* cross-origin */ } }
        const gap = [...new Set(moving)].filter(m => !covered.has(m));
        if (gap.length)
          problems.push(`${gap.length} selector(s) animate with no prefers-reduced-motion override: ` +
            gap.slice(0, 6).join(', ') + (gap.length > 6 ? ` (+${gap.length - 6} more)` : ''));
      })();

      /* 12. A CONTROL INSIDE A COMPOSITE MUST NOT PAINT ITS OWN BOX, AND MUST FIT INSIDE IT.
       *     The command bar is a wrapper with an icon, an input and a kbd hint; if the input
       *     paints its own border and background it renders as a second bar inside the first,
       *     and a min-height taller than the wrapper makes it overflow on both edges. Measured:
       *     a 44px input inside a 34px wrapper, bordered, for weeks — reported twice by a human
       *     and never caught here, because every existing rule inspected ONE element and this is
       *     a fact about a child AGAINST ITS PARENT. */
      /* 🔴 IT SELECTS BY ROLE IN THE COMPOSITE, NOT BY THE OPT-OUT MARKER. The first version
       * iterated `[data-bare]` — so removing the marker, which is the exact regression it
       * exists to catch, left it with nothing to iterate and it reported clean. Vacuous by
       * construction, written one minute after documenting that trap, and found only because
       * the falsifier was run. A check must select the thing it is protecting, never the fix
       * that protects it. */
      document.querySelectorAll('.cmdbar input,[data-bare]').forEach(el => {
        const cs = getComputedStyle(el), p = el.parentElement;
        if (parseFloat(cs.borderTopWidth) > 0)
          problems.push(`[data-bare] .${el.className || el.tagName} still paints a ${cs.borderTopWidth} border — it is drawing a second box inside its wrapper`);
        if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent')
          problems.push(`[data-bare] .${el.className || el.tagName} still paints a background (${cs.backgroundColor})`);
        if (p) {
          const r = el.getBoundingClientRect(), pr = p.getBoundingClientRect();
          if (pr.height > 0 && (r.height - pr.height > 1))
            problems.push(`[data-bare] .${el.className || el.tagName} is ${Math.round(r.height)}px tall inside a ${Math.round(pr.height)}px wrapper`);
        }
      });

      /* 11. `[hidden]` MUST ACTUALLY HIDE. The attribute is a UA rule at specificity 0,0,1 and
       *     any class that sets `display` beats it — measured on Armory, where a hidden create
       *     button and its two replacements rendered into the same grid cell and overprinted
       *     each other. Silent, because nothing throws and the markup reads as correct. */
      document.querySelectorAll('[hidden]').forEach(el => {
        if (getComputedStyle(el).display !== 'none')
          problems.push(`[hidden] but display:${getComputedStyle(el).display} — .${el.className || el.tagName}`);
      });

      /* 9. INTERACTION SMOKE TEST. Drive every path that opens a panel and assert it
       *    produced a real title and body. This is the check that would have caught the
       *    drawer break on the turn it was introduced. */
      const wantsInteractive = /[?&]audit=1\b/.test(location.search);
      /* 🔴 THE INTERACTION FINDINGS ARE TAGGED so the settled re-run can CARRY them instead of
       * re-driving them. Opening and closing a drawer toggles the page's scrollbar, every
       * percentage-positioned element moves with it, and the settled pass then measured a Track
       * mid-transition — which is where `.ruler at 249 vs .tk at 239` came from on eight pages
       * that measure one origin at rest. Two jobs were sharing one moment: this pass CHANGES the
       * page, every other rule MEASURES it. Only one of them may run twice. */
      const iMark = problems.length;
      if (interactions && wantsInteractive) {
        interactions().forEach(({ name, run, when }) => {
          try {
            /* 🔴 SKIPPING IS REPORTED, NEVER SILENT. Analytics' interactions index
             * `F.cmdStats[0].command` and click `tr[data-id]`, both of which throw against an
             * empty fixture — so on ?empty=1 the page died before S.audit ever ran and the
             * sweep reported "no __selfCheck" rather than a result. A `when` that returns
             * false records the skip in the problem list as a NOTE, because an interaction
             * check that quietly stops running is exactly the vacuous pass this file exists
             * to prevent: the run still looks clean, and nothing was checked. */
            if (when && !when()) { problems.push(`note: ${name} not applicable (no data)`); return; }
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
        /* `main` is the scroller — `window.scrollTo` here was a no-op from the day it was
         * written, for the same reason `window.scrollY` reads 0 on every portal page. */
        scroller.scrollTop = keepTop; scroller.scrollLeft = keepLeft;
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

      window.__selfCheck = { ok: problems.length === 0, problems,
                             interactionProblems: problems.slice(iMark) };
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
             placeholder="Search, or run a command" aria-label="Search, or run a command"
             role="combobox" aria-expanded="false" aria-controls="cbList" aria-autocomplete="list">
      <kbd>⌘K</kbd>
      <div class="cb-drop" id="cbDrop" hidden><div class="plist" id="cbList" role="listbox"></div></div>
    </div>
    <span class="sp"></span>
    <!-- 🔴 THIS SLOT HELD A PERMANENT SIGN-OUT BUTTON, AND THE ALLOCATION WAS BACKWARDS.
         Who signs out of a single-user admin console kept open in a tab? Almost nobody — so
         the header spent permanent, always-visible space on one of the rarest acts in the
         product, and gave none to the most frequent one: committing staged work, which is
         what the entire portal is built around. Sign-out moved into the account panel, alone,
         in one style (two buttons in two colours is what taught they were two different acts).
         ⚠️ It is ABSENT at zero rather than showing "0 staged" — a chip that is always there
         is a permanent third copy of the tray and the rail badge; one that appears only when
         there is something to act on is the same fact at the moment it becomes actionable. -->
    <a class="hdr-commit" id="hdrCommit" href="review.html" hidden>
      <b id="hdrCommitN">0</b><span>staged &middot; review</span></a>
    <span class="who">
      <button class="whobtn" id="whoBtn" aria-expanded="false" aria-haspopup="menu">
        <span class="av" data-src style="--av-src:url('${USER.avatar}')"></span>${USER.displayName}<span class="cv" aria-hidden="true"></span></button>
      <!-- 🔴 THE PANEL DUPLICATED THE BUTTON THAT OPENS IT. Its header was an avatar, a name
           and a handle — and the trigger you just clicked IS the avatar and the name. That was
           the top third of the panel, and a bigger redundancy than the two ⌘K rows that were
           the visible complaint. The identity block now sits ON the banner, which dissolves the
           duplicated avatar and earns the banner its space: it is the one personal thing in the
           portal, and a Discord bot's console looking like Discord's own account panel is an
           affinity that is true here rather than borrowed.
           🔴 AND THE ONE THING ONLY THIS PANEL CAN SAY, WHICH IT DID NOT: what YOU are allowed
           to do. Twelve permissions, an owner-only tier, and a "destructive" capability only
           the owner may grant — and nowhere in the portal told you which you hold. A delegated
           admin found out by clicking something and being refused.
           ⚠️ The presence dot is gone. "Signed in" is trivially true of anyone looking at it,
           so it was decoration wearing status.
           ⚠️ An earlier pass left a dead data-m="realm" row here as an UNCLOSED button holding only a
           hamburger glyph — the browser auto-closed it at the next <button>, so the panel
           shipped a dead, empty, focusable row that fell through to "focus the command bar".
           A per-call-site fix that leaves its own siblings broken, one more time. -->
      <div class="umenu" id="uMenu" role="menu" hidden>
        <div class="ubanner" style="--banner:url('${USER.banner}')" aria-hidden="true"></div>
        <div class="uid">
          <span class="uav" style="--av-src:url('${USER.avatar}')" aria-hidden="true"></span>
          <span class="un"><b>${USER.displayName}</b><span>@${USER.username}</span></span>
          <span class="rolebadge">${Shell.actor().role || 'OWNER'}</span>
        </div>
        <div class="usec">
          <button class="mi" role="menuitem" data-m="perms">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.6 13.4 4v3.8c0 3-2.2 5.4-5.4 6.6-3.2-1.2-5.4-3.6-5.4-6.6V4z"/></svg>
            What you can do<span class="mnote" id="uPerms">&mdash;</span></button>
          <!-- 🔴 THE ID IS WHOLE. The old 1139…2283 elided the MIDDLE, which is the only part that
               separates it from any other snowflake — so the preview could not confirm it was
               the right id, which is the entire reason anyone looks before pasting it into a
               grant. Nineteen digits fit, and a preview that cannot be checked is worse than
               no preview at all. -->
          <button class="mi" role="menuitem" data-m="copy">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 5h8v8H5z"/><path d="M3 11V3h8"/></svg>
            Copy ID<span class="mid">${USER.id}</span></button>
        </div>
        <!-- ⚠️ "Session · 12 hours" stated the POLICY. What a person wants is a fact about
             themselves — how long THIS session has left. The difference is not wording: one is
             documentation about the system, the other is the reason to look. -->
        <div class="usec">
          <div class="ustat"><span>Session</span><b class="live" id="uSess">&mdash;</b></div>
        </div>
        <div class="usec last">
          <button class="mi danger" role="menuitem" data-m="out">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3H4v10h6"/><path d="M8 8h6M12 6l2 2-2 2"/></svg>
            Sign out</button>
        </div>
      </div>
    </span>`;
      el.querySelector('.crumb').innerHTML =
        `${crumb} <b class="crumb-sep">${Shell.icon('chevron-right', {cls:'sm'})}</b> <span id="crumbView">${sub || ''}</span>`;
      el.querySelector('#home').onclick = () => location.href = 'index.html';
      Shell.wireAccount();
    },

    /* The account menu's behaviour, shared for the same reason. */
    wireAccount(){
      const m = document.getElementById('uMenu'), b = document.getElementById('whoBtn');
      if (!m || !b) return;
      b.onclick = e => {
        e.stopPropagation();
        Shell.refreshAccount();
        const open = m.hidden; m.hidden = !open; b.setAttribute('aria-expanded', String(open));
      };
      document.addEventListener('click', e => {
        if (!m.hidden && !m.contains(e.target)) { m.hidden = true; b.setAttribute('aria-expanded','false'); }
      });
      /* One handler, two entry points — the header button and the menu item must never be able
       * to disagree about what signing out does. */
      /* 🔴 THIS DIALOG AND THE SIGN-IN DOOR SAID OPPOSITE THINGS, ONE CLICK APART. The door
       * promises staged work is held against your account and returns when you sign back in;
       * this said it "lives in this browser session and is lost on sign out" — and then CLEARED
       * THE STORE, so the copy was wrong and the behaviour was wrong with it. §15.11 settled it:
       * staging is server-side. The store survives, and with nothing staged this stops being a
       * data-loss warning about zero items. */
      const signOut = () => { const n = Store.all().length; Shell.confirm({
        title:'Sign out of the portal?', tier:1, op:'session.end',
        body: n
          ? `<p class="dw-p">You have <b>${n} staged change${n === 1 ? '' : 's'}</b>. They stay staged
               against your account and will be here when you sign back in.</p>`
          : `<p class="dw-p">Nothing is staged. Signing out just ends this browser session.</p>`,
        confirm:'Sign out',
        onConfirm(){ location.href = 'door.html'; } }); };
      Shell._signOut = signOut;
      Shell.refreshAccount();
      Shell.syncCommitChip();
      /* One minute is the right cadence for a 12-hour clock: shorter is a spinning number
       * nobody reads, longer and the last minute of a session is a lie. */
      if (!Shell._sessTick) Shell._sessTick = setInterval(() => Shell.refreshAccount(), 60000);
      /* Installed here, after the header exists, so no realm can ship a dead command input. */
      Shell.commandBar({ items: Shell.defaultCommands, run: c => c.run() });
      m.querySelectorAll('.mi').forEach(mi => mi.onclick = () => {
        m.hidden = true; b.setAttribute('aria-expanded','false');
        const k = mi.dataset.m;
        if (k === 'out') {
          signOut();
        } else if (k === 'copy') {
          navigator.clipboard?.writeText(USER.id); Shell.toast('Discord ID copied.');
        } else if (k === 'perms') {
          /* The row DOES something — it opens the matrix on your own row. A panel that is
           * five-sixths label is a card wearing a menu's clothes, and the fix is not fewer
           * labels, it is rows that go somewhere. */
          location.href = 'access.html#me';
        }
      });
    },

    /* ── WHAT YOU CAN DO, AND HOW LONG YOU HAVE ────────────────────────────
     * Both lines are facts about the reader. The permissions line is the only statement of
     * its kind anywhere in the portal; the session line replaces a sentence that stated the
     * POLICY ("Session · 12 hours") with one that states a fact ("expires in 7h 20m"). */
    refreshAccount(){
      const F = window.FIX, a = Shell.actor();
      const pe = document.getElementById('uPerms');
      if (pe && F) {
        const all = (F.PERM_TOKENS || []).length;
        if (a.isOwner) { pe.textContent = 'everything · ' + all; }
        else {
          const row = (F.accessAdmins || []).find(r => r.discordId === a.id);
          const held = row ? Object.values(row.grants).filter(g => g.held).length : 0;
          pe.textContent = held + ' of ' + all + (a.destructive ? ' · destructive' : '');
        }
      }
      const se = document.getElementById('uSess');
      if (se && F) {
        const ttl = (F.SESSION_TTL_HOURS || 12) * 3600e3;
        const left = Math.max(0, (Shell._signedInAt + ttl) - Date.now());
        const h = Math.floor(left / 3600e3), mn = Math.floor((left % 3600e3) / 60000);
        se.textContent = left <= 0 ? 'expired'
          : h ? `expires in ${h}h ${String(mn).padStart(2,'0')}m` : `expires in ${mn}m`;
      }
    },

    /* The header chip is ABSENT at zero — see the markup comment. `hidden` rather than a
     * zero state, so nothing has to decide what "0 staged · review" would mean. */
    syncCommitChip(){
      const c = document.getElementById('hdrCommit'); if (!c) return;
      const n = Store.all().length, b = document.getElementById('hdrCommitN');
      c.hidden = !n;
      if (n && b) Shell.setFigure(b, n, { staged:true });
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

    /* "1 terms" shipped in the first Analytics export panel, because every call site writes
     * its own unit string and none of them looks at the number printed beside it. Units are
     * written plural at the call site (the common case) and lose the 's' here at one. */
    plural(n, unit){ return n === 1 && /s$/.test(unit) ? unit.replace(/s$/, '') : unit; },

    /* ─────────────────────────── EXPORT ─────────────────────────── */
    Export: {
      /* Scope ids that have produced a REAL FILE this session. Session-scoped on purpose:
       * an export taken last week is not evidence that THIS operator has a copy. */
      _done: {},
      has(scope){ return !!Shell.Export._done[scope]; },
      at(scope){ const d = Shell.Export._done[scope]; return d ? d.at : 0; },
      /* 🔴 WHETHER THE COPY IS ACTUALLY KEPT, not merely whether an export happened. The
       * interlock used to record only the FACT of a download, which makes it a ceremony: an
       * admin could export, discard the file, purge, and leave the owner holding a timestamp
       * instead of the data. Harkirat asked for "safeguards like caching/storing the export so
       * the owner is fully aware", and retention is the half that survives the tab closing.
       * A safeguard the copy PROMISES and the code does not provide is worse than none, so the
       * confirm only claims retention when this returns true.
       * ⚠️ In the real portal the kept copy belongs beside the ChangeLog row, server-side —
       * sessionStorage is a mockup shim (§15.11), and an export that dies with the tab is not a
       * safeguard for anybody. */
      retained(scope){ const d = Shell.Export._done[scope]; return !!(d && d.body && String(d.body).length); },
      /* 🔴 A SAFEGUARD NOBODY CAN SEE IS ONE NOBODY TRUSTS. Retention was built and rendered
       * nowhere: the confirm dialog claimed a copy was kept and no surface could show it, which
       * is the same shape as an export that only records a timestamp. This renders every kept
       * copy with its scope, time, size and a way to take it again — so "the owner holds the
       * data" is a thing you can look at rather than a sentence in a dialog. */
      records(){ return Object.entries(Shell.Export._done)
        .filter(([, d]) => d && d.body)
        .map(([scope, d]) => ({ scope, at: d.at, rows: d.rows, bytes: String(d.body).length })); },
      /* Re-download from the KEPT copy, never a re-derivation: a retained export that regenerates
       * itself is a different document wearing the same name, and the whole point is that this is
       * the bytes that were handed over. */
      again(scope){ const d = Shell.Export._done[scope];
        if (!d || !d.body) return Shell.toast('No kept copy for ' + scope + '.');
        Shell.Export.file(scope.replace(/[^a-z0-9]+/gi, '-') + '.txt', d.body); },
      panelHtml(){
        const r = Shell.Export.records();
        if (!r.length) return '<p class="expnone">No export taken this session. One-way operations stay locked until there is one.</p>';
        return '<ul class="explist">' + r.map(x =>
          '<li><span class="exp-s">' + x.scope + '</span>' +
          '<span class="exp-m">' + new Date(x.at).toLocaleTimeString([], { hour:'numeric', minute:'2-digit' }) +
            (x.rows ? ' &middot; ' + x.rows + ' rows' : '') + ' &middot; ' + x.bytes + ' bytes kept</span>' +
          '<button class="pill sm" data-again="' + x.scope + '">Take it again</button></li>').join('') + '</ul>';
      },

      /* Recording an export unblocks staged tier-3 ops that name THIS scope — and only this
       * scope. An earlier draft unblocked ops with no scope too, on the reasoning that a
       * scopeless op could not be matched anyway. That is the shape of a silent wrong result:
       * it would have opened the one-way gate on the strength of an unrelated download. An op
       * that cannot name what would restore it is a hole, so it is REPORTED, never papered over. */
      /* `meta.body` is the exact text the downloaded file carried, so the kept copy and the
       * download cannot diverge — a retained export that is a re-derivation rather than the
       * bytes that were handed over is a different document wearing the same name. */
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
            '<div class="exs-c">' + sc.count + ' <em>' + Shell.plural(sc.count, sc.unit || 'records') + '</em></div>' +
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
          body: '<p class="dw-p">' + (note || 'Each of these is the exact format the bot reads back. Take one before a one-way change — the copy you take is the copy you restore from.') + '</p>' +
                '<ul class="exs">' + rows + '</ul>' +
                /* 🔴 THE KEPT COPIES BELONG WHERE EXPORT LIVES, NOT ON ONE REALM. This surface was
                 * added to Armory's Bulk view first, which would have made retention — the thing
                 * that makes a one-way operation survivable — visible on exactly one of the five
                 * realms that export. Same per-call-site shape as the zero-in-an-alert-colour.
                 * In the shared panel it appears wherever anybody exports, including from the
                 * one-way strip's own "Export first" jump. */
                '<div class="expkept"><h5>Kept this session</h5>' + Shell.Export.panelHtml() + '</div>',
          actions: '<button class="btn" id="dw-cancel">Close</button>'
        });
        d.querySelector('#dw-cancel').onclick = () => Shell.closeDrawer();
        d.querySelectorAll('button[data-x]').forEach(b => b.onclick = () => {
          const sc = scopes.find(x => x.id === b.dataset.x);
          if (!sc) return;
          let text; try { text = sc.build(); } catch (e) { Shell.toast('Export failed: ' + e.message); return; }
          Shell.Export.file(sc.file || (sc.id + '.txt'), text);
          /* 🔴 THE BYTES, NOT A RECEIPT. `retained()` reports false unless the kept copy is
           * actually here, and this is the only place the exported text exists — so passing the
           * row count alone would have left every confirm truthfully saying "no copy is kept"
           * while the safeguard looked implemented. The same `text` that went into the file. */
          Shell.Export.mark(sc.id, { rows: sc.count, body: text });
          Shell.toast(sc.count + ' ' + Shell.plural(sc.count, sc.unit || 'records') + ' exported. One-way operations on this data are now unlocked.');
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
    mastheadExport({ host, scopes, summary, label = 'Export', note }){
      /* A scope that names a .csv file is going to a spreadsheet, not back into the bot, and
       * the panel's default sentence promises a round trip that would be false for it. The
       * note is derived from what the scopes actually are rather than passed by each realm,
       * so a realm that later adds a CSV scope cannot forget to change its own copy. */
      const noteFor = list => note || (list.every(x => /\.csv$/.test(x.file || ''))
        ? 'Nothing re-ingests these — the destination is a spreadsheet, not the bot. RFC-4180 CSV, so a term containing a comma or a quote survives the trip.'
        : undefined);
      const anchor = typeof host === 'string' ? document.querySelector(host) : host;
      if (!anchor) return;
      let el = document.querySelector('.mh-take');
      if (!el) {
        el = document.createElement('div');
        el.className = 'mh-take'; el.setAttribute('role', 'group');
        el.setAttribute('aria-label', 'Export data from ' + ((hereRealm() || {}).label || 'this page'));
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
      el.querySelector('[data-mhx]').onclick = () => Shell.Export.panel({ title:'Export', scopes:scopes(), note:noteFor(scopes()) });
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
              '<p>' + (note || 'These cannot be undone, and the portal will not run one until an export of the same data exists. Everything above this line can be taken back from the tray.') +
                /* The strip states the RULE, not only the interlock. Somebody who cannot run these
                 * still needs to know the rule exists and who holds the exception. */
                (Shell.canDestroy()
                  ? (Shell.actor().isOwner ? ''
                     : ' <b>You hold the Destructive capability</b>, which only the owner can grant. A copy of the export is kept with the record.')
                  : ' <b>' + Shell.whyNoDestroy() + '</b>') + '</p></div>' +
            '<ul class="ow-l">' + items.map((it, i) => {
              const ready = Shell.Export.has(it.scope);
              /* 🔴 DISABLED WITH THE REASON, NEVER HIDDEN. An admin without the capability must
               * still SEE that the operation exists and read what would unlock it — hiding it
               * teaches nothing, produces a support question, and conceals from them that somebody
               * else can do this to their data. Two gates reported separately, because "you may
               * not" and "not until you export" are different answers to different questions. */
              const may = Shell.canDestroy();
              return '<li class="ow-i' + (may ? '' : ' ow-locked') + '"><div class="ow-t"><b>' + it.title + '</b><span>' + (it.note || '') + '</span></div>' +
                '<div class="ow-c">' + it.count + ' <em>' + Shell.plural(it.count, it.unit || 'records') + '</em></div>' +
                (may
                  ? '<button class="pill sm ' + (ready ? 'dang' : 'ghost') + '" data-o="' + i + '">' +
                      (ready ? it.title.replace(/…$/, '') + '…' : 'Export first →') + '</button>'
                  : '<button class="pill sm" disabled data-tip="' + Shell.whyNoDestroy() + '">Owner only</button>') +
                '</li>';
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
            body: '<p class="dw-p">This removes <b>' + it.count + ' ' + Shell.plural(it.count, it.unit || 'records') + '</b> and <b>cannot be undone</b> from inside the portal. ' +
                  'Your export from ' + new Date(Shell.Export.at(it.scope)).toLocaleTimeString([], { hour:'numeric', minute:'2-digit' }) +
                  /* Say WHO is about to do it and whether the data is KEPT. The owner reads this
                   * record afterwards, and "somebody exported at 11:04" is not the same fact as
                   * "here is what was removed". */
                  ' is the only way back' +
                  (Shell.Export.retained(it.scope)
                    ? ', and a copy is kept with this record' + (Shell.actor().isOwner ? '' : ' for the owner') + '.'
                    : '.') +
                  (Shell.actor().isOwner ? '' :
                    ' You are running this under the <b>Destructive</b> capability the owner granted you.') +
                  '</p>',
            onConfirm: () => it.onRun()
          });
        });
      };
      paint();
      /* 🔴 ONE LISTENER, NOT ONE PER RENDER. renderOneWay() is called from renderAll(), which
       * runs on every stage, every remove, every zoom — so an unguarded addEventListener here
       * accumulated a repaint per render, and a single export fired all of them. Idempotent, so
       * it produced no wrong pixels; it is a leak that grows with session length, which is the
       * kind that is never noticed and never goes away. The guard is on the HOST element rather
       * than a Shell flag, because two realms could legitimately mount two strips. */
      if (!el.__owBound) {
        el.__owBound = true;
        document.addEventListener('dioreo:export', () => {
          /* Re-read the host each time: the strip's innerHTML is replaced by paint(), so a
           * closure over its children would go stale, and a detached host must stop painting. */
          if (el.isConnected) paint();
        });
      }
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

    /* A row you just created ARRIVES. Season animates a bar on the Track; a table row carries
     * exactly the same meaning and had none — without it a staged row is indistinguishable from
     * one that was already there, and the reader re-reads the whole list to find what they just
     * added. Called after the render that creates the node, and self-removes on animationend so
     * a later re-render cannot replay it. */
    arrive(sel, root = document){
      requestAnimationFrame(() => {
        const el = root.querySelector(sel);
        if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        /* Two things happen to a row that just arrived: it slides in (where it came FROM) and
         * it tints its own topic colour once (WHAT it was). The tint is the half that answers
         * "which one did I just change?", which the toast at the bottom of the screen cannot —
         * it is 600px from the row you were looking at. */
        el.classList.add('rowin', 'landed');
        el.addEventListener('animationend', () => el.classList.remove('rowin'), { once:true });
        setTimeout(() => el.classList.remove('landed'), 1600);
      });
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

  /* ⚠️ SEEDED HERE, AFTER `Shell` EXISTS, AND THE FIRST ATTEMPT PUT IT BESIDE THE STORE. `Store.add`
   * reaches `Shell` to pulse the tray, so calling it before the `const Shell = {...}` binding is a
   * temporal-dead-zone error — "Cannot access 'Shell' before initialization" — which throws during the
   * shell's own load and blanks EVERY page in the package, not just the seeded one. Measured
   * 2026-09-03 21:29 EDT; `node --check` passes it, because TDZ is a runtime fault. */
  if (new URLSearchParams(location.search).get('demo') === '1') seedDemoOps();

  /* 🔴 THE MEASURING INSTRUMENTS SHIPPED WITH THIS PACKAGE AND NO PAGE HAS EVER LOADED THEM.
   * `.grid.js` and `.peers.js` sit beside these pages and are referenced by the portal's own
   * harness (`/harness/grid.js`, `/harness/peers.js`) — but nothing in any of the eight mockup
   * pages includes them, so `__grid.all()` on the artifact the portal is measured AGAINST has
   * never once run. Every comparison so far has measured the portal with an instrument and the
   * mockup by eye.
   *
   * It lives HERE, in the one file all eight pages already load, rather than as eight
   * <script> tags: one loader, one place to fix, and door.html — which is a separate artifact
   * with its own <main> — gets it for free.
   *
   * Two ways in, because a measuring pass needs both: `?grid` on the URL loads them at boot,
   * and `__instruments()` loads them on demand from a console or an evaluate_script call
   * without a reload (which would discard whatever view state was being measured). It resolves
   * only once `window.__grid` actually exists, so a caller can await it instead of polling —
   * and a load that never lands rejects rather than resolving into a silent absence.
   *
   * ⚠️ NOT `document.fonts.ready` and NOT rAF here: this only has to get two classic scripts in.
   * The pass that CONSUMES it still has to wait for fonts before trusting any geometry.        */
  window.__instruments = function () {
    if (window.__instruments._p) return window.__instruments._p;
    var files = ['.peers.js', '.grid.js'];
    window.__instruments._p = Promise.all(files.map(function (f) {
      return new Promise(function (res, rej) {
        var s = document.createElement('script');
        s.src = f + '?t=' + Date.now();          /* the page is served no-store; the injected script must not be the exception */
        s.onload = res;
        s.onerror = function () { rej(new Error('could not load ' + f + ' — is this page served from its own directory?')); };
        document.head.appendChild(s);
      });
    })).then(function () {
      if (!window.__grid || !window.__peers) throw new Error('scripts loaded but __grid/__peers are missing');
      return '__grid() · __grid.near() · __grid.sizes() · __grid.all() · __peers()';
    });
    return window.__instruments._p;
  };
  if (/[?&]grid(&|=|$)/.test(location.search)) window.__instruments();
})();
