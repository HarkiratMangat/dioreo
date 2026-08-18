/**
 * The /commands page — the site's FOURTH family.
 *
 * WHY IT IS A FAMILY AND NOT A FOURTH VOICE OF AN EXISTING ONE. `PAGES` is the numbered legal set: instruments, and the numbering is what says "these bind you". `EXTRA_PAGES` is the invitation. `chronicle.js` is the record. This page is none of those — it is a TOOL, read by someone mid-task who wants to leave as fast as possible with a command that works. The three existing families are all things you READ; this is a thing you USE, and the difference shows up in the grid rather than in the palette.
 *
 * ⚠️ THE LESSON THIS IS BUILT ON, and it cost a whole rejected build to learn: the first chronicle attempt was the legal shell in three accent colours and Harkirat rejected it on sight. Colour is the weakest carrier of identity. What separates a family is its STRUCTURE. So this page deliberately reuses the site's own type stacks rather than introducing a typeface, and spends its distinctiveness on one structural idea instead.
 *
 * THE SIGNATURE: THE COMPOSER. A slash command is the one thing this product is literally made of, so the page's spine is a command line you are building. It sticks to the top of the reading column, adopts whichever command you have scrolled to, fills in as you choose option values, and Copy takes exactly what it shows. That is the page's single bold element; everything around it stays quiet, and it earns its place by doing the page's actual job — getting a reader to a working invocation — rather than by decorating it.
 *
 * ⚠️ NO NUMBERED MARKERS ANYWHERE. Commands are a set, not a sequence, and the 01/02/03 device would be borrowed from the legal pages, where the numbering is true (a document series) and load-bearing. Options DO sort required-first, because that order is real information: it is what you must supply.
 *
 * ⚠️ NO BACKTICKS ANYWHERE INSIDE THE CSS AND JS CONSTANTS BELOW. They are template literals, and a backtick — including one inside a comment — ends the string and fails the build with a SyntaxError pointing at prose. Quote with " instead. Same rule the rest of this generator carries, and it has been paid for twice.
 */

const { assertProseCoverage, optionProse, GUIDES, COMMANDS } = require('./commandProse');

const CHROME_KEYS = [
    'esc', 'TOKENS', 'COMPONENT_CSS', 'SWITCHER_CSS', 'THEME_BOOT', 'THEME_JS', 'NAV_JS',
    'GOO_SVG', 'MORPH_JS', 'wordmark', 'repoBtn', 'installBtn', 'themeBtn', 'navSwitcher',
    'mobileNav', 'pageFoot',
];

function requireChrome(C) {
    const missing = CHROME_KEYS.filter(k => C[k] === undefined);
    if (missing.length) {
        throw new Error(
            'commandsPage.js: the chrome bundle is missing ' + missing.join(', ') +
            '. These are passed in from buildLegalPages.js; a page rendered without them would ' +
            'still pass the content gate, so this throws instead.'
        );
    }
    return C;
}

/**
 * The page's accent. 121 degrees, the midpoint of the widest gap on the site's tab hue wheel (citron 62 to teal 180), which leaves 59 degrees of clearance each way — the six document tabs are held to 30. ⚠️ The Changelog's phosphor is 131 degrees, ten away. That is KNOWN AND ACCEPTED, not an oversight: the record group is withdrawn from the nav everywhere except inside /changelog/, so the two are never seen together at tab size. Harkirat chose this hue with that on the table. ⚠️ The bot's own /help command briefly took this green on 2026-08-16 20:38 EDT and Harkirat reversed it the same evening — /help and /invite keep coral. That reversal was about the DISCORD surface only; the website page keeps green.
 */
const SIGNAL = { light: '#1E6B1F', dark: '#58D05A' };

const COMMANDS_CSS = `
/* Page-scoped. Every selector here is prefixed cx- so nothing can collide with
   the shared COMPONENT_CSS the rest of the site is built from — a type-vs-modifier
   clash is exactly how an unrelated block once inherited 155px of padding. */
.cx-wrap{max-width:1180px;margin:0 auto;padding:0 clamp(1rem,4vw,2rem) 5rem}

.cx-head{padding:clamp(1.6rem,4vw,2.6rem) 0 1.4rem}
.cx-kick{font-family:var(--mono);font-size:.66rem;letter-spacing:.18em;text-transform:uppercase;color:var(--sig);margin:0 0 .5rem}
.cx-head h1{font-family:var(--display);font-size:clamp(1.7rem,4vw,2.4rem);line-height:1.08;letter-spacing:-.022em;margin:0 0 .4rem}
.cx-head p{margin:0;color:var(--ink2);max-width:56ch}

.cx-body{display:grid;grid-template-columns:minmax(240px,290px) 1fr;gap:clamp(1.2rem,2.6vw,2.2rem);align-items:start}

/* ── the picker ─────────────────────────────────────────────────────────────
   Rich rows: the command AND what it is for. A bare list of names is an index,
   not a picker, and an index makes a reader open things to find out what they
   are. It jumps within the document rather than driving a detail pane, so deep
   links, printing and the no-JS case all keep working. */
.cx-pick{position:sticky;top:1rem;display:flex;flex-direction:column;max-height:calc(100vh - 2rem);
  background:var(--raised);border:1px solid var(--rule);border-radius:8px;overflow:hidden;min-width:0}
.cx-find{display:flex;align-items:center;gap:.5rem;padding:.65rem .75rem;border-bottom:1px solid var(--rule2);background:var(--sunk)}
.cx-find .cx-sl{font-family:var(--mono);font-size:.9rem;color:var(--sig);line-height:1}
.cx-find input{flex:1;min-width:0;font:inherit;font-family:var(--mono);font-size:.84rem;border:0;background:transparent;color:var(--ink);padding:.1rem 0}
.cx-find input:focus{outline:0}
.cx-find input::placeholder{color:var(--ink3)}
.cx-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;
  clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
.cx-tally{font-size:.68rem;color:var(--ink3);white-space:nowrap;font-variant-numeric:tabular-nums}

.cx-list{overflow-y:auto;padding:.3rem 0;min-height:0}
.cx-grp{font-family:var(--mono);font-size:.58rem;letter-spacing:.16em;text-transform:uppercase;color:var(--ink3);padding:.75rem .8rem .25rem;margin:0}
.cx-grp[hidden]{display:none}
.cx-row{display:block;padding:.4rem .8rem;text-decoration:none;border-left:3px solid transparent}
.cx-row[hidden]{display:none}
.cx-row .cx-n{display:block;font-family:var(--mono);font-size:.83rem;color:var(--ink);line-height:1.35}
.cx-row .cx-d{display:block;font-size:.75rem;color:var(--ink3);line-height:1.3}
.cx-row:hover{background:var(--sig-soft)}
.cx-row:hover .cx-n{color:var(--sig)}
.cx-row[aria-current="true"]{background:var(--sig-soft);border-left-color:var(--sig)}
.cx-row[aria-current="true"] .cx-n{color:var(--sig);font-weight:650}
.cx-row[aria-current="true"] .cx-d{color:var(--ink2)}

.cx-nohit{padding:.85rem .8rem;font-size:.8rem;color:var(--ink2)}
.cx-nohit[hidden]{display:none}
.cx-nohit b{display:block;color:var(--ink);font-size:.82rem;margin-bottom:.45rem}
.cx-sug{display:flex;flex-wrap:wrap;gap:.35rem}
.cx-sug button{font:inherit;font-family:var(--mono);font-size:.76rem;cursor:pointer;padding:.3rem .5rem;
  border:1px solid var(--sig-line);border-radius:5px;background:var(--sig-soft);color:var(--sig)}

/* ── THE COMPOSER — the page's one bold element ───────────────────────────── */
.cx-doc{min-width:0}
.cx-comp{position:sticky;top:1rem;z-index:6;display:flex;align-items:center;gap:.75rem;
  padding:.7rem .85rem;margin-bottom:1rem;border-radius:8px;
  background:var(--raised);border:1px solid var(--sig-line);
  box-shadow:0 6px 18px -12px rgba(0,0,0,.5)}
.cx-line{font-family:var(--mono);font-size:.95rem;line-height:1.45;min-width:0;flex:1}
.cx-c{color:var(--ink);font-weight:650}
.cx-hold{color:var(--ink3);font-weight:400;margin-left:.4rem}
.cx-copy[disabled]{opacity:.45;cursor:default}
.cx-copy[disabled]:hover{border-color:var(--rule);color:var(--ink2)}
.cx-o{color:var(--sig)}
.cx-v{color:var(--ink);background:var(--sig-soft);padding:.08em .38em;border-radius:4px;box-decoration-break:clone}
.cx-copy{font:inherit;font-size:.74rem;font-weight:600;cursor:pointer;flex:none;padding:.42rem .7rem;
  border:1px solid var(--rule);border-radius:5px;background:var(--sunk);color:var(--ink2)}
.cx-copy:hover{border-color:var(--sig);color:var(--sig)}
.cx-copy[data-done="1"]{background:var(--sig);border-color:var(--sig);color:var(--raised)}

/* ── bays ──────────────────────────────────────────────────────────────────── */
.cx-band{font-family:var(--mono);font-size:.62rem;letter-spacing:.16em;text-transform:uppercase;color:var(--ink3);margin:1.8rem 0 .7rem;scroll-margin-top:5.5rem}
.cx-band:first-of-type{margin-top:0}
.cx-band[hidden]{display:none}
.cx-bay{border:1px solid var(--rule);border-radius:8px;background:var(--raised);margin-bottom:.7rem;scroll-margin-top:5.5rem}
.cx-bay[hidden]{display:none}
.cx-bay > h2{font-family:var(--mono);font-size:.95rem;font-weight:650;margin:0;padding:.8rem .9rem .1rem;color:var(--ink)}
.cx-why{margin:0;padding:.25rem .9rem .1rem;color:var(--ink2);font-size:.92rem;max-width:62ch}

.cx-opts{padding:.55rem .9rem .8rem;display:grid;gap:0}
.cx-opt{display:grid;grid-template-columns:minmax(92px,auto) 1fr;gap:.2rem .9rem;align-items:baseline;padding:.42rem 0}
.cx-opt + .cx-opt{border-top:1px solid var(--rule2)}
.cx-on{font-family:var(--mono);font-size:.81rem;color:var(--sig);display:flex;align-items:baseline;gap:.4rem;flex-wrap:wrap}
.cx-req{font-size:.58rem;letter-spacing:.07em;text-transform:uppercase;font-weight:700;
  color:var(--raised);background:var(--sig);padding:.1rem .32rem;border-radius:3px}
.cx-takes{font-size:.86rem;color:var(--ink2);min-width:0;overflow-wrap:anywhere}
.cx-eg{display:block;font-family:var(--mono);font-size:.78rem;color:var(--ink3);margin-top:.15rem}

/* Choices are VISIBLE. Only the overflow hides, and it says how much.
   Harkirat, 2026-08-17 19:57 EDT: burying the timezone list behind a first click is the
   opposite of helping — the reader came here to see what the values ARE. */
.cx-pills{display:flex;flex-wrap:wrap;gap:.3rem;align-items:center;margin-top:.15rem}
.cx-pill{font:inherit;font-family:var(--mono);font-size:.74rem;cursor:pointer;padding:.26rem .5rem;
  border:1px solid var(--rule);border-radius:5px;background:var(--sunk);color:var(--ink2);line-height:1.35}
.cx-pill:hover{border-color:var(--sig);color:var(--sig)}
.cx-pill[aria-pressed="true"]{background:var(--sig);border-color:var(--sig);color:var(--raised);font-weight:600}
.cx-pill[hidden]{display:none}
/* A choice that carries a hint becomes a two-line pill: the name it is actually called,
   and underneath, dimmer and smaller, what that name looks like in practice. */
.cx-pill2{display:inline-flex;flex-direction:column;align-items:flex-start;gap:.05rem;text-align:left;line-height:1.3}
.cx-hint{font-size:.68rem;color:var(--ink3);font-weight:400}
.cx-pill2[aria-pressed="true"] .cx-hint{color:var(--raised);opacity:.85}
.cx-more{font:inherit;font-size:.74rem;font-weight:600;cursor:pointer;color:var(--sig);background:none;
  border:0;padding:.26rem .3rem;text-decoration:underline;text-underline-offset:3px}

/* ── guides: a comparison, never a paragraph ──────────────────────────────── */
.cx-two{display:grid;grid-template-columns:1fr 1fr;gap:.6rem;padding:.5rem .9rem .3rem}
.cx-card{border:1px solid var(--rule);border-radius:6px;padding:.6rem .7rem}
.cx-card b{display:block;font-family:var(--mono);font-size:.8rem;color:var(--sig);margin-bottom:.15rem}
.cx-card span{font-size:.85rem;color:var(--ink2)}
.cx-note{margin:0;padding:.3rem .9rem .85rem;font-size:.8rem;color:var(--ink3);max-width:70ch}

@media (max-width:880px){
  .cx-body{grid-template-columns:1fr}
  .cx-pick{position:static;max-height:none;margin-bottom:1rem}
  .cx-list{max-height:min(44vh,340px)}
  .cx-fold{display:block;width:100%;font:inherit;font-size:.8rem;font-weight:600;cursor:pointer;text-align:left;
    padding:.65rem .8rem;border:0;border-top:1px solid var(--rule2);background:var(--raised);color:var(--ink2)}
  .cx-fold::after{content:" +";color:var(--sig)}
  .cx-pick[data-open="1"] .cx-fold::after{content:" \\2212"}
  .cx-pick[data-open="0"] .cx-list{display:none}
  .cx-two{grid-template-columns:1fr}
  .cx-opt{grid-template-columns:1fr;gap:.1rem}
  .cx-comp{top:.5rem}
  .cx-band,.cx-bay{scroll-margin-top:4.5rem}
}
.cx-fold{display:none}

/* WCAG 2.5.5: a coarse pointer gets real targets. These controls are functional
   — a pill rewrites the Composer — so an undersized one is a broken control,
   not a cramped one. */
@media (pointer:coarse){
  .cx-pill{padding:.46rem .62rem}
  .cx-copy{padding:.6rem .8rem}
  .cx-row{padding:.6rem .8rem}
  .cx-more{padding:.46rem .35rem}
  .cx-find input{padding:.35rem 0}
}
@media (prefers-reduced-motion:reduce){.cx-v{transition:none}}
`;

/* ⚠️ Plain string concatenation rather than one template literal, because this
   is JS being emitted INTO a template literal by the generator — the outer
   backticks would end the string. Same family as the no-regex rule. */
const COMMANDS_JS = [
    '(function(){',
    '  var picker=document.getElementById("cx-pick"); if(!picker) return;',
    '  var q=document.getElementById("cx-q"), tally=document.getElementById("cx-tally");',
    '  var nohit=document.getElementById("cx-nohit"), sug=document.getElementById("cx-sug");',
    '  var list=document.getElementById("cx-list"), fold=document.getElementById("cx-fold");',
    '  var line=document.getElementById("cx-line"), copy=document.getElementById("cx-copy");',
    '  var bays=[].slice.call(document.querySelectorAll(".cx-bay"));',
    '  var rows=[].slice.call(document.querySelectorAll(".cx-row"));',
    '  var byId={}; rows.forEach(function(r){ byId[r.getAttribute("href").slice(1)]=r; });',
    '',
    '  /* THE COMPOSER. One line for the whole page: it adopts whichever command you',
    '     have scrolled to and shows the values you have chosen for it. Per-command',
    '     state lives on the bay, so scrolling away and back does not lose it. */',
    '  var current=null;',
    '  function chosen(bay){ if(!bay.__pick) bay.__pick={}; return bay.__pick; }',
    '  function plain(bay){',
    '    if(!bay) return "/";',
    '    var s=bay.getAttribute("data-cmd"), pick=chosen(bay);',
    '    [].slice.call(bay.querySelectorAll(".cx-opt")).forEach(function(o){',
    '      var n=o.getAttribute("data-opt");',
    '      if(pick[n]!=null) s+=" "+n+" "+pick[n];',
    '    });',
    '    return s;',
    '  }',
    '  function span(cls,text){ var e=document.createElement("span"); e.className=cls; e.textContent=text; return e; }',
    '  function paint(){',
    '    var bay=current;',
    '    line.textContent="";',
    '    if(!bay){',
    '      line.appendChild(span("cx-c","/"));',
    '      line.appendChild(span("cx-hold","pick a command to build one"));',
    '      copy.disabled=true; copy.textContent="Copy"; copy.removeAttribute("data-done");',
    '      copy.setAttribute("aria-label","Copy the command you build here");',
    '      return;',
    '    }',
    '    copy.disabled=false;',
    '    line.appendChild(span("cx-c",bay.getAttribute("data-cmd")));',
    '    var pick=chosen(bay);',
    '    [].slice.call(bay.querySelectorAll(".cx-opt")).forEach(function(o){',
    '      var n=o.getAttribute("data-opt");',
    '      if(pick[n]==null) return;',
    '      line.appendChild(document.createTextNode(" "));',
    '      line.appendChild(span("cx-o",n));',
    '      line.appendChild(document.createTextNode(" "));',
    '      line.appendChild(span("cx-v",pick[n]));',
    '    });',
    '    /* The line itself is not a live region -- it changes on every scroll and',
    '       would talk over the page. The Copy control carries the value instead, so',
    '       a screen-reader user hears exactly what they are about to copy. */',
    '    copy.setAttribute("aria-label","Copy "+plain(bay));',
    '    copy.removeAttribute("data-done"); copy.textContent="Copy";',
    '  }',
    '  function adopt(bay){ if(bay===current) return; current=bay; paint(); }',
    '',
    '  bays.forEach(function(bay){',
    '    [].slice.call(bay.querySelectorAll(".cx-pill")).forEach(function(p){',
    '      p.addEventListener("click",function(){',
    '        var opt=p.closest(".cx-opt"), n=opt.getAttribute("data-opt"), v=p.getAttribute("data-val");',
    '        var pick=chosen(bay), was=pick[n]===v;',
    '        [].slice.call(opt.querySelectorAll(".cx-pill")).forEach(function(x){ x.setAttribute("aria-pressed","false"); });',
    '        if(was){ delete pick[n]; } else { pick[n]=v; p.setAttribute("aria-pressed","true"); }',
    '        adopt(bay); paint();',
    '      });',
    '    });',
    '    [].slice.call(bay.querySelectorAll(".cx-more")).forEach(function(m){',
    '      m.addEventListener("click",function(){',
    '        var box=m.parentNode, open=m.getAttribute("data-open")==="1";',
    '        [].slice.call(box.querySelectorAll(".cx-pill")).forEach(function(x,i){',
    '          if(i>=Number(m.getAttribute("data-visible"))) x.hidden=open;',
    '        });',
    '        m.setAttribute("data-open",open?"0":"1");',
    '        m.textContent=open?m.getAttribute("data-label"):"Show fewer";',
    '      });',
    '    });',
    '  });',
    '',
    '  copy.addEventListener("click",function(){',
    '    var text=plain(current);',
    '    if(navigator.clipboard) navigator.clipboard.writeText(text)["catch"](function(){});',
    '    copy.textContent="Copied"; copy.setAttribute("data-done","1");',
    '  });',
    '',
    '  /* search: matches the command, what it does, its option NAMES and its choice',
    '     LABELS -- so "timezone" finds /timestamp and "Nameplate" finds /colors.',
    '     That is the thing a reference can do that Discord own picker cannot. */',
    '  function score(hay,needle){',
    '    hay=hay.toLowerCase(); needle=needle.toLowerCase();',
    '    var i=0,j=0,s=0,run=0;',
    '    while(i<hay.length&&j<needle.length){',
    '      if(hay.charAt(i)===needle.charAt(j)){ run++; s+=run;',
    '        if(i===0||hay.charAt(i-1)===" "||hay.charAt(i-1)==="/") s+=4; j++;',
    '      } else run=0;',
    '      i++;',
    '    }',
    '    return j===needle.length?s:0;',
    '  }',
    '  function filter(){',
    '    var v=q.value.trim().toLowerCase(), hits=0, live={};',
    '    bays.forEach(function(bay){',
    '      var on=!v||(bay.getAttribute("data-find")||"").toLowerCase().indexOf(v)>-1;',
    '      bay.hidden=!on;',
    '      var row=byId[bay.id]; if(row) row.hidden=!on;',
    '      if(on){ hits++; live[bay.getAttribute("data-group")]=1; }',
    '    });',
    '    [].slice.call(document.querySelectorAll(".cx-band,.cx-grp")).forEach(function(e){',
    '      e.hidden=!live[e.getAttribute("data-group")];',
    '    });',
    '    tally.textContent=v?(hits+" found"):(bays.length-'
        + 'document.querySelectorAll(".cx-bay[data-guide]").length)+" commands";',
    '    if(v&&!hits){',
    '      sug.textContent="";',
    '      bays.map(function(b){ return {b:b,s:score(b.getAttribute("data-cmd")||"",v)}; })',
    '        .filter(function(x){ return x.s>0; }).sort(function(a,b){ return b.s-a.s; }).slice(0,4)',
    '        .forEach(function(x){',
    '          var btn=document.createElement("button"); btn.type="button";',
    '          btn.textContent=x.b.getAttribute("data-cmd");',
    '          btn.addEventListener("click",function(){ q.value=""; filter(); x.b.scrollIntoView({block:"start"}); });',
    '          sug.appendChild(btn);',
    '        });',
    '      if(!sug.children.length){',
    '        var btn=document.createElement("button"); btn.type="button"; btn.textContent="Show everything";',
    '        btn.addEventListener("click",function(){ q.value=""; filter(); });',
    '        sug.appendChild(btn);',
    '      }',
    '      nohit.hidden=false;',
    '    } else nohit.hidden=true;',
    '    if(v&&matchMedia("(max-width:880px)").matches) setOpen(true);',
    '  }',
    '  /* Clicking a row adopts it immediately rather than waiting for the scroll',
    '     observer to notice. Two reasons, and neither is cosmetic: the click is an',
    '     explicit choice and should be answered at once, and it makes adoption work',
    '     even where IntersectionObserver does not run at all -- the observer is an',
    '     enhancement on top, never the only path to the page working. */',
    '  rows.forEach(function(r){',
    '    r.addEventListener("click",function(){',
    '      var t=document.getElementById(r.getAttribute("href").slice(1));',
    '      rows.forEach(function(o){ o.setAttribute("aria-current",String(o===r)); });',
    '      if(t&&!t.hasAttribute("data-guide")) adopt(t);',
    '    });',
    '  });',
    '  q.addEventListener("input",filter);',
    '  q.addEventListener("keydown",function(e){',
    '    if(e.key!=="Enter") return;',
    '    var first=bays.filter(function(b){ return !b.hidden; })[0];',
    '    if(first){ e.preventDefault(); first.scrollIntoView({block:"start"}); }',
    '  });',
    '',
    '  function setOpen(on){ picker.setAttribute("data-open",on?"1":"0"); if(fold) fold.setAttribute("aria-expanded",String(on)); }',
    '  if(fold) fold.addEventListener("click",function(){ setOpen(picker.getAttribute("data-open")!=="1"); });',
    '  setOpen(!matchMedia("(max-width:880px)").matches);',
    '  filter();',
    '',
    '  /* current-command highlight, and the Composer follows it */',
    '  if(window.IntersectionObserver){',
    '    var io=new IntersectionObserver(function(es){',
    '      es.forEach(function(e){',
    '        if(!e.isIntersecting) return;',
    '        rows.forEach(function(r){ r.setAttribute("aria-current",String(byId[e.target.id]===r)); });',
    '        if(!e.target.hasAttribute("data-guide")) adopt(e.target);',
    '        var row=byId[e.target.id];',
    '        if(row&&list.scrollHeight>list.clientHeight){',
    '          var lb=list.getBoundingClientRect(), rb=row.getBoundingClientRect();',
    '          if(rb.top<lb.top||rb.bottom>lb.bottom) list.scrollTop+=rb.top-lb.top-lb.height;',
    '        }',
    '      });',
    '    },{rootMargin:"-88px 0px -66% 0px",threshold:0});',
    '    bays.forEach(function(b){ io.observe(b); });',
    '  }',
    '',
    '  /* Deliberately NOT pre-adopting the first command. The Composer is the boldest',
    '     thing on the page, and opening it with a command the reader has neither chosen',
    '     nor scrolled to answers a question nobody asked -- worse, it reads as state they',
    '     caused. It starts as a prompt and fills in when a command is genuinely in view.',
    '     A deep link is the one exception: arriving at #timestamp IS choosing it. */',
    '  var deep=location.hash&&document.getElementById(location.hash.slice(1));',
    '  current=deep&&!deep.hasAttribute("data-guide")?deep:null;',
    '  paint();',
    '})();',
].join('\n');

/**
 * A few choices carry a HINT as well as a name, packed into one string because Discord has only one field for it. /timestamp's style option is the case: "Full Date, Short Time (F) - e.g., Tuesday, April 20, 2021 at 16:20". The choice is "Full Date, Short Time (F)"; the rest describes what that format looks like. So both halves are shown -- the name as the pill's label, the hint on a second line beneath it where it explains the option rather than competing with it -- and only the name goes into the command line, where the example would read as part of the value.
 */
const splitChoice = choice => {
    const i = choice.indexOf(' \u2014 ');
    return i === -1
        ? { label: choice, hint: '' }
        : { label: choice.slice(0, i).trim(), hint: choice.slice(i + 3).trim() };
};

/** How many choices show before the rest fold away. */
const VISIBLE_CHOICES = 6;

/** Required first — that order is information, not styling. */
const orderOptions = options => options.slice().sort((a, b) => Number(b.required) - Number(a.required));

function renderOptions(command, C) {
    const { esc } = C;
    const entry = COMMANDS[command.path] || {};
    return orderOptions(command.options).map(option => {
        const takes = optionProse(command.path, option.name);
        const examples = (entry.examples || {})[option.name];
        let value;

        if (option.choices.length) {
            const pills = option.choices.map((choice, i) => {
                const hidden = i >= VISIBLE_CHOICES ? ' hidden' : '';
                const { label, hint } = splitChoice(choice);
                const hintEl = hint ? `<span class="cx-hint">${esc(hint)}</span>` : '';
                return `<button type="button" class="cx-pill${hint ? ' cx-pill2' : ''}" aria-pressed="false" ` +
                    `data-val="${esc(label)}"${hidden}>${esc(label)}${hintEl}</button>`;
            }).join('');
            const label = `Show all ${option.choices.length}`;
            const more = option.choices.length > VISIBLE_CHOICES
                ? `<button type="button" class="cx-more" data-open="0" data-visible="${VISIBLE_CHOICES}" data-label="${esc(label)}">${esc(label)}</button>`
                : '';
            value = `<span class="cx-takes">${esc(takes)}<span class="cx-pills">${pills}${more}</span></span>`;
        } else {
            const hint = option.autocomplete ? ' &middot; type to search' : '';
            const eg = examples ? `<span class="cx-eg">${esc(examples.map(e => `"${e}"`).join('  '))}</span>` : '';
            value = `<span class="cx-takes">${esc(takes)}${hint}${eg}</span>`;
        }

        const req = option.required ? '<span class="cx-req">required</span>' : '';
        return `<div class="cx-opt" data-opt="${esc(option.name)}">` +
            `<span class="cx-on">${esc(option.name)}${req}</span>${value}</div>`;
    }).join('');
}

function renderCommand(command, group, C) {
    const { esc } = C;
    const entry = COMMANDS[command.path] || {};
    // Everything the search can match on, in one attribute: the command, what it does, its option names and its choice labels.
    const find = [command.path, entry.purpose || '',
        command.options.map(o => o.name + ' ' + o.choices.join(' ')).join(' ')].join(' ');
    return `<article class="cx-bay" id="${esc(command.id)}" data-group="${esc(group.key)}" ` +
        `data-cmd="${esc(command.path)}" data-find="${esc(find)}">` +
        `<h2>${esc(command.path)}</h2>` +
        `<p class="cx-why">${esc(entry.purpose || command.description)}</p>` +
        `<div class="cx-opts">${renderOptions(command, C)}</div>` +
        `</article>`;
}

function renderGuide(guide, C) {
    const { esc } = C;
    const cards = guide.compare.map(([head, body]) =>
        `<div class="cx-card"><b>${esc(head)}</b><span>${esc(body)}</span></div>`).join('');
    return `<article class="cx-bay" id="${esc(guide.id)}" data-group="${esc(guide.group)}" data-guide="1" ` +
        `data-find="${esc(guide.title + ' ' + guide.sub)}">` +
        `<h2>${esc(guide.title)}</h2>` +
        `<div class="cx-two">${cards}</div>` +
        `<p class="cx-note">${esc(guide.note)}</p></article>`;
}

/**
 * Renders the whole page. `catalog` is scripts/lib/commandCatalog.js's output; `page` is the entry from buildLegalPages.js's page table.
 */
function commandsShell({ page, catalog, C }) {
    requireChrome(C);
    assertProseCoverage(catalog);
    const { esc } = C;

    const guidesByGroup = new Map();
    for (const guide of GUIDES) {
        if (!guidesByGroup.has(guide.group)) guidesByGroup.set(guide.group, []);
        guidesByGroup.get(guide.group).push(guide);
    }

    const bands = [];
    const picker = [];

    for (const group of catalog.groups) {
        const guides = guidesByGroup.get(group.key) || [];
        if (!guides.length && !group.commands.length) continue;

        bands.push(`<p class="cx-band" data-group="${esc(group.key)}">${esc(group.label)}</p>`);
        picker.push(`<p class="cx-grp" data-group="${esc(group.key)}">${esc(group.label)}</p>`);

        for (const guide of guides) {
            bands.push(renderGuide(guide, C));
            picker.push(`<a class="cx-row" href="#${esc(guide.id)}" data-group="${esc(group.key)}">` +
                `<span class="cx-n">${esc(guide.title)}</span><span class="cx-d">${esc(guide.sub)}</span></a>`);
        }
        for (const command of group.commands) {
            const entry = COMMANDS[command.path] || {};
            bands.push(renderCommand(command, group, C));
            picker.push(`<a class="cx-row" href="#${esc(command.id)}" data-group="${esc(group.key)}">` +
                `<span class="cx-n">${esc(command.path)}</span>` +
                `<span class="cx-d">${esc(entry.purpose || command.description)}</span></a>`);
        }
    }

    // ⚠️ THIS SITE IS DARK-FIRST, and getting the polarity backwards is silent. The bare :root block IS the dark theme -- TOKENS declares the dark values there and light arrives as a :root[data-theme="light"] override. Writing it the other way round (light in :root, dark behind a prefers-color-scheme query) renders a dark-on-dark page AND reads as correct in the source. The build's own contrast gate is what caught it: it reported the light green against the DARK desk in both themes, because in both themes that is genuinely what the cascade resolved to.
    const accent = `:root{--sig:${SIGNAL.dark};--sig-soft:${SIGNAL.dark}26;--sig-line:${SIGNAL.dark}5c}` +
        `:root[data-theme="light"]{--sig:${SIGNAL.light};--sig-soft:${SIGNAL.light}1a;--sig-line:${SIGNAL.light}55}`;

    return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(page.title)} — Dioreo</title>
<meta name="description" content="${esc(page.desc)}">
${C.THEME_BOOT}
<style>${C.TOKENS}${C.COMPONENT_CSS}${C.SWITCHER_CSS}${accent}${COMMANDS_CSS}</style>
</head><body>
<a class="skip" href="#main">Skip to content</a>
${C.GOO_SVG}
<header class="bar">
  ${C.wordmark('./', page)}
  ${C.navSwitcher(page)}
  ${C.repoBtn}
  ${C.installBtn()}
  ${C.themeBtn()}
</header>
${C.mobileNav(page)}
<main class="cx-wrap" id="main" tabindex="-1">
  <div class="cx-head">
    <p class="cx-kick">${esc(page.kicker)}</p>
    <h1>${esc(page.title)}</h1>
    <p>${esc(page.lede)}</p>
  </div>

  <div class="cx-body">
    <nav class="cx-pick" id="cx-pick" data-open="1" aria-label="All commands">
      <div class="cx-find">
        <span class="cx-sl" aria-hidden="true">/</span>
        <label class="cx-sr" for="cx-q">Search commands</label>
        <input id="cx-q" type="search" placeholder="search" autocomplete="off" spellcheck="false">
        <span class="cx-tally" id="cx-tally" aria-live="polite"></span>
      </div>
      <div class="cx-list" id="cx-list">${picker.join('')}</div>
      <div class="cx-nohit" id="cx-nohit" hidden>
        <b>No match. Closest commands:</b>
        <div class="cx-sug" id="cx-sug"></div>
      </div>
      <button class="cx-fold" id="cx-fold" type="button" aria-expanded="true">Browse all commands</button>
    </nav>

    <div class="cx-doc">
      <div class="cx-comp">
        <span class="cx-line" id="cx-line"><span class="cx-c">/</span></span>
        <button class="cx-copy" id="cx-copy" type="button">Copy</button>
      </div>
      ${bands.join('')}
    </div>
  </div>
</main>
${C.pageFoot(page)}
<script>${C.THEME_JS}</script>
<script>${C.NAV_JS}</script>
<script>${C.MORPH_JS}</script>
<script>${COMMANDS_JS}</script>
</body></html>`;
}

module.exports = { commandsShell, CHROME_KEYS, SIGNAL, COMMANDS_CSS, COMMANDS_JS, VISIBLE_CHOICES, orderOptions };
