/**
 * THREE SPATIAL DIRECTIONS FOR THE /commands PAGE, BUILT FROM THE REAL CATALOG.
 *
 * Harkirat, 2026-08-18 15:52 EDT: "you fixed a bunch of things but the design itself still needs work honestly." He is right, and the diagnosis is that the page had no spatial idea. Every other family on this site has one -- the legal set is a document plate with a numbered margin index, the warm pages are rounded with a radial wash and no numbers anywhere, the chronicle is three grids (notice board / ledger / timeline). The /commands page was a sidebar and a stack of cards, which is the absence of a choice rather than a choice, and no amount of accent work changes that. `local/site-redesign/reference-research.md` records the lesson in Harkirat's own crawl: the GRID carries identity, colour is the weakest carrier.
 *
 * Each renderer below is a different grid over the SAME data and the SAME chrome -- the bar, the Composer, the footer and every colour are held constant on purpose, so what is being compared is the layout and nothing else.
 *
 * ⚠️ THIS MODULE IS A COMPARISON, NOT A FEATURE. When one is chosen, its renderer moves into commandsPage.js and this file is deleted along with the two that lost. It writes to `public/_v-*.html`, which .gitignore excludes, so a variant can never be published or committed by accident.
 */

/** Shared by all three: an option's values as pills, reusing the page's own classes. */
function optionLine(command, C, renderOptions) {
    return renderOptions(command, C);
}

/* ── 1. THE LEDGER ─────────────────────────────────────────────────────────────
   septiembre's project index, from the crawl: "a two-column ledger -- serif project name (large, red) with the year in tiny mono directly beneath, location in small sans in the second column... reads as a beautifully quiet list of ~16 items and never feels like a table." This page has exactly 16 entries, which is what makes it worth trying: no cards at all, hairlines instead of borders, the invocation set large in mono with its purpose beneath, and the options resolving in the right column. The nearest thing to the chronicle's ledger voice without reusing its grid. */
function renderLedger({ groups, C, renderOptions, COMMANDS, esc }) {
    const rows = [];
    for (const group of groups) {
        if (!group.commands.length && !group.guides.length) continue;
        rows.push(`<p class="lg-band" id="g-${esc(group.key)}">${esc(group.label)}` +
            `<span class="cx-ct">${group.guides.length + group.commands.length}</span></p>`);
        for (const guide of group.guides) rows.push(guide.html);
        for (const command of group.commands) {
            const entry = COMMANDS[command.path] || {};
            const find = [command.path, entry.purpose || '',
                command.options.map(o => o.name + ' ' + o.choices.join(' ')).join(' ')].join(' ');
            rows.push(`<article class="lg-row cx-bay" id="${esc(command.id)}" data-group="${esc(group.key)}" ` +
                `data-cmd="${esc(command.path)}" data-find="${esc(find)}">` +
                `<div class="lg-l"><h2><span class="cx-sl2">/</span>${esc(command.path.slice(1))}</h2>` +
                `<p class="cx-why">${esc(entry.purpose || command.description)}</p></div>` +
                `<div class="lg-r cx-opts">${renderOptions(command, C)}</div></article>`);
        }
    }
    return rows.join('');
}

const LEDGER_CSS = `
.cx-body{grid-template-columns:1fr}
.cx-pick{display:none}
.lg-band{display:flex;align-items:center;gap:.7rem;font-family:var(--mono);font-size:.6rem;letter-spacing:.2em;
  text-transform:uppercase;color:var(--sig);margin:3.2rem 0 0;padding-bottom:.5rem;
  border-bottom:1px solid var(--sig-line);scroll-margin-top:calc(var(--cxbar) + 1rem)}
.lg-band:first-of-type{margin-top:.4rem}
.lg-row{display:grid;grid-template-columns:minmax(0,42%) minmax(0,58%);gap:0 clamp(1.2rem,4vw,3rem);
  align-items:start;border:0;border-radius:0;background:none;overflow:visible;margin:0;
  padding:1.5rem 0;border-bottom:1px solid var(--rule)}
.lg-l{padding:0}
.lg-row h2{font-family:var(--mono);font-size:clamp(1.05rem,2.1vw,1.3rem);font-weight:650;margin:0;
  letter-spacing:-.02em;color:var(--ink)}
.lg-row .cx-why{margin:.3rem 0 0;font-size:.95rem;max-width:34ch}
.lg-r{background:none;border:0;padding:0}
.lg-r::before{left:132px;top:0;bottom:0}
.lg-r .cx-opt{grid-template-columns:132px 1fr;padding:.3rem 0}
.lg-r .cx-opt:first-child{padding-top:.15rem}
.lg-r .cx-opt+.cx-opt{border-top:1px solid var(--rule2)}
.lg-row .cx-two{padding:0;grid-template-columns:1fr 1fr}
.lg-row .cx-note{padding:.6rem 0 0}
.lg-row .cx-top{padding:0}
@media (max-width:880px){
  .lg-row{grid-template-columns:1fr;gap:.7rem}
  .lg-r::before{display:none}
  .cx-pick{display:flex}
}`;

/* ── 2. THE CROSS-REFERENCE ───────────────────────────────────────────────────
   snp.agency's index, which the crawl calls the strongest structural idea in the set after the column grid, and which is already parked in docs/ideas/design-ideas.md for the Contributors page. The relational data it needs does not exist there yet -- one contributor, one release -- but it DOES exist here: command <-> option <-> value is a real three-way relation the bot already records. Hover an option and every command that takes it lights while the rest grey out. It is the only one of the three that lets the page do something a printed reference cannot. */
function renderXref({ groups, C, renderOptions, renderCommand, COMMANDS, esc }) {
    const commands = [];
    const optionNames = new Map();
    for (const group of groups) {
        for (const command of group.commands) {
            const opts = command.options.map(o => o.name);
            commands.push({ command, group, opts });
            for (const o of command.options) {
                if (!optionNames.has(o.name)) optionNames.set(o.name, new Set());
                optionNames.get(o.name).add(command.path);
            }
        }
    }
    const cmdCol = commands.map(({ command, group, opts }) =>
        `<a class="xr-i" href="#${esc(command.id)}" data-id="c:${esc(command.path)}" ` +
        `data-rel="${esc(opts.map(o => 'o:' + o).join(' '))}" data-group="${esc(group.key)}">` +
        `<span class="xr-n">${esc(command.path)}</span>` +
        `<span class="xr-d">${esc((COMMANDS[command.path] || {}).purpose || command.description)}</span></a>`).join('');
    const optCol = [...optionNames.entries()].sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))
        .map(([name, set]) =>
            `<button type="button" class="xr-i" data-id="o:${esc(name)}" ` +
            `data-rel="${esc([...set].map(c => 'c:' + c).join(' '))}">` +
            `<span class="xr-n">${esc(name)}</span>` +
            `<span class="xr-d">${set.size} command${set.size === 1 ? '' : 's'}</span></button>`).join('');
    const bays = [];
    for (const group of groups) {
        if (!group.commands.length && !group.guides.length) continue;
        bays.push(`<p class="cx-band" id="g-${esc(group.key)}" data-group="${esc(group.key)}">${esc(group.label)}` +
            `<span class="cx-ct">${group.guides.length + group.commands.length}</span></p>`);
        for (const guide of group.guides) bays.push(guide.html);
        // Calls the REAL renderer. A hand-copied bay would let the comparison render a different page than the one being compared, which is the one thing a comparison must not do. The ledger below is the deliberate exception — its row IS the change.
        for (const command of group.commands) bays.push(renderCommand(command, group, C));
    }
    return `<div class="xr" id="xr">
  <div class="xr-c"><p class="xr-h">Commands<span class="cx-ct">${commands.length}</span></p><div class="xr-l">${cmdCol}</div></div>
  <div class="xr-c"><p class="xr-h">Options<span class="cx-ct">${optionNames.size}</span></p><div class="xr-l">${optCol}</div></div>
</div>
<p class="xr-hint">Point at an option to see which commands take it.</p>
${bays.join('')}`;
}

const XREF_CSS = `
.cx-body{grid-template-columns:1fr}
.cx-pick{display:none}
.xr{display:grid;grid-template-columns:1fr 1fr;gap:clamp(1rem,3vw,2.4rem);
  padding-bottom:1.1rem;border-bottom:1px solid var(--rule);margin-bottom:.5rem}
.xr-h{display:flex;align-items:center;gap:.7rem;font-family:var(--mono);font-size:.6rem;letter-spacing:.2em;
  text-transform:uppercase;color:var(--sig);margin:0 0 .5rem;padding-bottom:.4rem;border-bottom:1px solid var(--sig-line)}
.xr-h .cx-ct{margin-left:auto}
.xr-l{display:flex;flex-direction:column}
.xr-i{display:block;width:100%;text-align:left;font:inherit;background:none;border:0;cursor:pointer;
  padding:.34rem .4rem;text-decoration:none;border-left:2px solid transparent;transition:opacity .14s ease}
.xr-n{display:block;font-family:var(--mono);font-size:.85rem;color:var(--ink);line-height:1.4}
.xr-d{display:block;font-size:.76rem;color:var(--ink3);line-height:1.3}
.xr-i:hover{background:var(--sig-soft);border-left-color:var(--sig)}
.xr-i:hover .xr-n{color:var(--sig)}
.xr[data-lit="1"] .xr-i{opacity:.28}
.xr[data-lit="1"] .xr-i.on{opacity:1;background:var(--sig-soft);border-left-color:var(--sig)}
.xr[data-lit="1"] .xr-i.on .xr-n{color:var(--sig)}
.xr[data-lit="1"] .xr-i.src{opacity:1}
.xr[data-lit="1"] .xr-i.src .xr-n::after{content:" \\2192";color:var(--sig)}
.xr-hint{font-size:.78rem;color:var(--ink3);margin:0 0 1.6rem}
/* ⚠️ ON A PHONE THIS IS A DIFFERENT CONTROL, NOT A NARROWER ONE. Collapsed to one
   column it read identically to the sticky variant — Harkirat, 2026-08-18 17:16 EDT:
   "option two and three basically look exactly the same on mobile." Two stacked lists
   is not a cross-reference; the whole idea is seeing one set light up another, and a
   phone cannot show two columns at once. So the Options column becomes a horizontal
   chip rail above the command list and the relation is expressed by FILTERING instead
   of dimming: tap "timezone" and the list becomes the commands that take it. Same
   data, same idea, a form a thumb can actually operate. */
@media (max-width:880px){
  .xr{grid-template-columns:1fr;gap:.9rem;min-width:0}
  /* A grid/flex child is min-width:auto by default, so the rail's content sets the
     column's floor and the whole page grows wider than the phone rather than the rail
     scrolling inside it. Measured as document overflow, not guessed at. */
  .xr-c{min-width:0}
  .xr-c .xr-l{max-width:100%}
  .xr-c:nth-child(2){order:-1}
  .xr-c:nth-child(2) .xr-l{flex-direction:row;flex-wrap:nowrap;overflow-x:auto;gap:.4rem;
    padding-bottom:.4rem;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .xr-c:nth-child(2) .xr-l::-webkit-scrollbar{width:0;height:0}
  .xr-c:nth-child(2) .xr-i{flex:none;border:1px solid var(--rule);border-radius:999px;
    border-left-width:1px;padding:.5rem .8rem;background:var(--raised)}
  .xr-c:nth-child(2) .xr-d{display:none}
  .xr-c:nth-child(2) .xr-i[aria-pressed="true"]{background:var(--sig);border-color:var(--sig)}
  .xr-c:nth-child(2) .xr-i[aria-pressed="true"] .xr-n{color:var(--raised);font-weight:650}
  .xr[data-lit="1"] .xr-c:nth-child(1) .xr-i:not(.on){display:none}
  .xr[data-lit="1"] .xr-c:nth-child(1) .xr-i.on{opacity:1}
}`;

const XREF_JS = [
    '(function(){',
    '  var xr=document.getElementById("xr"); if(!xr) return;',
    '  var items=[].slice.call(xr.querySelectorAll(".xr-i"));',
    '  function clear(){ xr.removeAttribute("data-lit");',
    '    items.forEach(function(i){ i.classList.remove("on"); i.classList.remove("src"); }); }',
    '  function light(el){',
    '    var rel=(el.getAttribute("data-rel")||"").split(" ").filter(Boolean);',
    '    if(!rel.length) return;',
    '    xr.setAttribute("data-lit","1");',
    '    el.classList.add("src");',
    '    items.forEach(function(i){',
    '      if(rel.indexOf(i.getAttribute("data-id"))>-1) i.classList.add("on");',
    '    });',
    '  }',
    '  items.forEach(function(i){',
    '    i.addEventListener("pointerenter",function(e){ if(e.pointerType==="mouse"){ clear(); light(i); } });',
    '    i.addEventListener("focus",function(){ clear(); light(i); });',
    /* Touch has no hover, so a tap has to LATCH — and tapping the lit chip again
       clears it. Without this the rail lit for one frame and released, which on a
       phone is indistinguishable from the control not working at all. */
    '    i.addEventListener("click",function(e){',
    '      if(i.tagName!=="BUTTON") return;',
    '      e.preventDefault();',
    '      var was=i.getAttribute("aria-pressed")==="true";',
    '      items.forEach(function(x){ x.removeAttribute("aria-pressed"); });',
    '      clear();',
    '      if(!was){ i.setAttribute("aria-pressed","true"); light(i); }',
    '    });',
    '  });',
    '  xr.addEventListener("pointerleave",function(){',
    '    if(!xr.querySelector(\'[aria-pressed="true"]\')) clear();',
    '  });',
    '})();',
].join('\n');

/* ── 3. STICKY LEFT / SCROLLING RIGHT ─────────────────────────────────────────
   allgoodstudio's split, from the crawl: "left column pins a huge Didone 01 OF 06 + -- SELECTED WORKS + headline, while project cards scroll past on the right." Here the pinned half is the GROUP -- a counter, the group name at display size, and that group's commands -- and it swaps as you cross into the next one. The smallest departure from what exists, since a left column is already there, but it turns that column from a flat index into a sense of place. */
function renderSticky({ groups, C, renderCommand, esc }) {
    const live = groups.filter(g => g.commands.length || g.guides.length);
    const panels = live.map((group, i) =>
        `<div class="st-p" data-group="${esc(group.key)}"${i ? ' hidden' : ''}>` +
        `<p class="st-n"><b>${String(i + 1).padStart(2, '0')}</b><i>/ ${String(live.length).padStart(2, '0')}</i></p>` +
        `<h2 class="st-t">${esc(group.label)}</h2>` +
        `<div class="st-l">` +
        group.guides.map(g => `<a href="#${esc(g.id)}">${esc(g.title)}</a>`).join('') +
        group.commands.map(c => `<a href="#${esc(c.id)}">${esc(c.path)}</a>`).join('') +
        `</div></div>`).join('');
    const bays = [];
    for (const group of live) {
        bays.push(`<p class="cx-band" id="g-${esc(group.key)}" data-group="${esc(group.key)}">${esc(group.label)}` +
            `<span class="cx-ct">${group.guides.length + group.commands.length}</span></p>`);
        for (const guide of group.guides) bays.push(guide.html);
        // Calls the REAL renderer. A hand-copied bay would let the comparison render a different page than the one being compared, which is the one thing a comparison must not do. The ledger below is the deliberate exception — its row IS the change.
        for (const command of group.commands) bays.push(renderCommand(command, group, C));
    }
    return { panels, bays: bays.join('') };
}

const STICKY_CSS = `
.cx-body{grid-template-columns:minmax(240px,320px) 1fr}
.cx-pick{background:none;border:0;overflow:visible}
.cx-find,.cx-list,.cx-nohit,.cx-fold{display:none!important}
.st{position:sticky;top:calc(var(--cxbar) + 1.5rem)}
.st-n{display:flex;align-items:baseline;gap:.4rem;margin:0 0 .5rem;font-family:var(--mono)}
.st-n b{font-size:clamp(2.4rem,5vw,3.4rem);line-height:.9;font-weight:650;color:var(--sig);
  font-variant-numeric:tabular-nums;letter-spacing:-.04em}
.st-n i{font-style:normal;font-size:.8rem;color:var(--ink3);letter-spacing:.06em}
.st-t{font-family:var(--display);font-size:clamp(1.3rem,2.4vw,1.75rem);line-height:1.02;
  letter-spacing:-.028em;margin:0 0 .9rem;color:var(--ink)}
.st-l{display:flex;flex-direction:column;gap:.1rem;border-top:1px solid var(--rule);padding-top:.6rem}
.st-l a{font-family:var(--mono);font-size:.82rem;color:var(--ink2);text-decoration:none;padding:.24rem 0}
.st-l a:hover{color:var(--sig)}
.st-l a[aria-current="true"]{color:var(--sig);font-weight:650}
/* ⚠️ A PHONE GETS THE PINNED HEADER, NOT A BLOCK AT THE TOP. Static, this variant
   was a paragraph you scrolled past once and then had no sense of place at all —
   which is what made it read the same as the cross-reference. Here the panel
   collapses to ONE line that pins under the bar and swaps as you cross into the next
   group: the counter, the group name, and nothing else. It is the only part of this
   direction a small screen can carry, and it is the part that does the work. */
@media (max-width:880px){
  .cx-body{grid-template-columns:1fr}
  .st{position:sticky;top:calc(54px + 2.6rem);z-index:30;margin:0 0 1rem;
    background:var(--desk);padding:.5rem 0;border-bottom:1px solid var(--sig-line)}
  .st-p{display:flex;align-items:baseline;gap:.6rem}
  /* ⚠️ MUST COME AFTER .st-p. The browser's own rule for the hidden ATTRIBUTE sits at
     the bottom of the cascade, so the explicit display above un-hid every panel and
     all six groups rendered at once — the pinned header became a full index. An author
     rule is required to put it back. (Written in prose, not syntax: hoverGuardAudit
     rejects a brace inside a comment, and it just caught this.) */
  .st-p[hidden]{display:none}
  .st-n{margin:0;gap:.25rem}
  .st-n b{font-size:1.35rem;line-height:1}
  .st-n i{font-size:.66rem}
  .st-t{font-size:1.05rem;margin:0;letter-spacing:-.02em}
  .st-l{display:none}
}`;

const STICKY_JS = [
    '(function(){',
    '  var panels=[].slice.call(document.querySelectorAll(".st-p"));',
    '  if(!panels.length) return;',
    '  var bays=[].slice.call(document.querySelectorAll(".cx-bay,.cx-band"));',
    '  function show(key){',
    '    panels.forEach(function(p){ p.hidden = p.getAttribute("data-group")!==key; });',
    '    var live=panels.filter(function(p){ return !p.hidden; })[0];',
    '    if(!live) return;',
    '    [].slice.call(live.querySelectorAll("a")).forEach(function(a){ a.removeAttribute("aria-current"); });',
    '  }',
    '  if(window.IntersectionObserver){',
    '    var io=new IntersectionObserver(function(es){',
    '      es.forEach(function(e){ if(e.isIntersecting) show(e.target.getAttribute("data-group")); });',
    '    },{rootMargin:"-30% 0px -60% 0px"});',
    '    bays.forEach(function(b){ if(b.getAttribute("data-group")) io.observe(b); });',
    '  }',
    '})();',
].join('\n');

module.exports = {
    renderLedger, LEDGER_CSS,
    renderXref, XREF_CSS, XREF_JS,
    renderSticky, STICKY_CSS, STICKY_JS,
    optionLine,
};
