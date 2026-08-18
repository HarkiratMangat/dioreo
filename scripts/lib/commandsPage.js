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

const { assertProseCoverage, optionProse, GUIDES, COMMANDS, SHARED_OPTIONS } = require('./commandProse');

const CHROME_KEYS = [
    'esc', 'TOKENS', 'COMPONENT_CSS', 'SWITCHER_CSS', 'THEME_BOOT', 'THEME_JS', 'NAV_JS',
    'GOO_SVG', 'MORPH_JS', 'wordmark', 'repoBtn', 'installBtn', 'themeBtn', 'navSwitcher',
    'mobileNav', 'pageFoot', 'BAR_CSS', 'PAGE_CSS', 'TOTOP_HTML', 'TOTOP_TRACK_JS', 'cmdRoleCss',
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
/* `dark` MIRRORS buildLegalPages.js's BRAND.signal and exists to be asserted against it,
   never to be used as the value — see the accent block. `light` is the hand-tuned
   --accent-t for light theme (the Accent Lab's own value for 121 degrees, measured
   against the light desk rather than mixed toward black by TOKENS' 38% formula). */
const SIGNAL = { light: '#1E6B1F', dark: '#58D05A' };

/* 🔴 THE SITE HAS EXACTLY TWO SURFACES — --desk (the page) and --raised (a card).
   There is no third, and `--sunk` — which this file used five times — is declared
   NOWHERE in the repo. Every one of those was an invalid background that painted
   nothing: the option block, the picker's search bed, the guide cards and the
   disabled Copy button were all transparent, so the two-zone bay the design is built
   on did not visually exist. contrastAudit() reads `--name: #hex` declarations only,
   so a rule painting its own surface is invisible to it and the build stayed green.
   The site's own idiom for a recessed bed is an INK TINT over whatever surface it
   lands on — that is exactly what the landing page's command pill does
   (`color-mix(in srgb,var(--ink) 10%,transparent)`). It inverts correctly per theme
   with no second declaration, because --ink is near-white on the dark page and
   near-black on the light one. ⚠️ A color-mix() surface is invisible to the contrast
   gate; these percentages are hand-checked, not gate-covered. */
const BED = 'color-mix(in srgb,var(--ink) 6%,transparent)';
const BED_SOFT = 'color-mix(in srgb,var(--ink) 4%,transparent)';

const COMMANDS_CSS = `
/* Page-scoped. Every selector here is prefixed cx- so nothing can collide with
   the shared COMPONENT_CSS the rest of the site is built from — a type-vs-modifier
   clash is exactly how an unrelated block once inherited 155px of padding.

   THE ONE STRUCTURAL IDEA: a slash command is a line you type, so the page is built
   around a line you type. The Composer is the instrument — full width, docked under
   the bar, the only element allowed to be loud — and everything else is quiet
   reference laid out on a strict two-zone grid: what a command IS, then what it
   TAKES. Identity comes from that grid, not from colour. (The changelog pages
   learned this the expensive way: three accent colours read as one template in three
   shades, and what finally separated them was the grid — see
   project_changelog_redesign.) */

/* No wrapper of its own. This page sits in the site's .page (CHROME.PAGE_CSS),
   the same column every other family uses — rolling a private one is what put the
   content 40px narrower than the chrome above it and started it underneath the
   fixed bar. Only the floor is local: .page ends at 0 so the last bay would
   otherwise touch the footer. */
.cx-floor{padding-bottom:4.5rem}

/* The docked instrument's height, so the picker and every anchor can clear it in
   one place instead of four hand-tuned numbers that drift apart. */
.cx-doc,.cx-pick,.cx-band,.cx-bay{--cxbar:calc(54px + 3.55rem)}

/* ── masthead ─────────────────────────────────────────────────────────────── */
.cx-head{padding:clamp(2.2rem,6vw,3.6rem) 0 1.7rem;max-width:44ch}
.cx-kick{display:flex;align-items:center;gap:.6rem;font-family:var(--mono);font-size:.66rem;
  letter-spacing:.2em;text-transform:uppercase;color:var(--sig);margin:0 0 .9rem}
.cx-kick::after{content:"";flex:1;height:1px;background:var(--sig-line)}
.cx-head h1{font-family:var(--display);font-size:clamp(2.3rem,6.5vw,3.5rem);line-height:.98;
  letter-spacing:-.035em;font-weight:680;margin:0 0 .55rem}
.cx-head p{margin:0;color:var(--ink2);font-size:1.02rem;line-height:1.5}

/* ── THE COMPOSER — the page's one bold element ─────────────────────────────
   Docked flush under the bar rather than floating a gap below it, so the chrome
   reads as one block instead of two things that happen to be sticky. It spans the
   whole column, above BOTH the picker and the bays, because it is the page's
   instrument and not a feature of the right-hand column. */
.cx-comp{position:sticky;top:54px;z-index:20;display:flex;align-items:center;gap:.9rem;
  padding:.62rem .5rem .62rem .95rem;margin:0 0 1.5rem;border-radius:9px;overflow:hidden;
  background:var(--raised);border:1px solid var(--sig-line);
  box-shadow:0 14px 26px -20px rgba(0,0,0,.75)}
/* The same 3px accent→glow rule .doc::before puts across the top of a legal
   document's plate. The Composer is this family's plate, so it wears the site's
   mark in the site's own place rather than inventing a second one. */
.cx-comp::before{content:"";position:absolute;inset:0 0 auto;height:3px;
  background:linear-gradient(90deg,var(--accent),var(--glow) 70%,transparent)}
.cx-line{font-family:var(--mono);font-size:1.02rem;line-height:1.5;min-width:0;flex:1;
  letter-spacing:-.01em;overflow-wrap:anywhere}
/* 🔴 THE THREE ROLES AND THE CARET COME FROM CHROME.cmdRoleCss('.cx-line') — this
   page does NOT get to invent its own rendering of a slash command. It had one:
   accent-coloured option text, a rounded chip for the value, a space between the
   two, and a hand-rolled blinking block. The landing page, two clicks away, already
   drew the same object the way Discord actually draws it — bold accent command, a
   grey ink-tint bed for the option NAME, an accent-tint bed for the VALUE, one
   continuous pill with no colon and a deliberate -1px overlap — checked against a
   screenshot of a real used command and carrying four separately-measured
   constants. Two renderings of one object on one site is the exact failure the
   shared BAR_CSS fixed one layer up. */
.cx-hold{color:var(--ink3);font-weight:400;margin-left:.45rem}
.cx-comp[data-built="1"] .cx-line::after{display:none}
.cx-copy{font:inherit;font-size:.74rem;font-weight:650;cursor:pointer;flex:none;padding:.5rem .85rem;
  letter-spacing:.02em;border:1px solid var(--sig-line);border-radius:6px;background:var(--sig-soft);color:var(--sig)}
.cx-copy:hover{background:var(--sig);border-color:var(--sig);color:var(--raised)}
.cx-copy[disabled]{opacity:.4;cursor:default;background:${BED};border-color:var(--rule);color:var(--ink3)}
.cx-copy[disabled]:hover{background:${BED};border-color:var(--rule);color:var(--ink3)}
.cx-copy[data-done="1"]{background:var(--sig);border-color:var(--sig);color:var(--raised)}

.cx-body{display:grid;grid-template-columns:minmax(232px,278px) 1fr;gap:clamp(1.2rem,2.6vw,2.4rem);align-items:start}

/* ── the picker ─────────────────────────────────────────────────────────────
   Rich rows: the command AND what it is for. A bare list of names is an index,
   not a picker, and an index makes a reader open things to find out what they
   are. It jumps within the document rather than driving a detail pane, so deep
   links, printing and the no-JS case all keep working. */
.cx-pick{position:sticky;top:calc(var(--cxbar) + 1.5rem);display:flex;flex-direction:column;
  max-height:calc(100vh - var(--cxbar) - 2.5rem);
  background:var(--raised);border:1px solid var(--rule);border-radius:9px;overflow:hidden;min-width:0}
.cx-find{display:flex;align-items:center;gap:.5rem;padding:.7rem .8rem;border-bottom:1px solid var(--rule2);background:${BED}}
.cx-find:focus-within{border-bottom-color:var(--sig-line);box-shadow:inset 0 -1px 0 var(--sig-line)}
.cx-find .cx-sl{font-family:var(--mono);font-size:.95rem;color:var(--sig);line-height:1}
.cx-find input{flex:1;min-width:0;font:inherit;font-family:var(--mono);font-size:.85rem;border:0;background:transparent;color:var(--ink);padding:.1rem 0}
.cx-find input:focus{outline:0}
.cx-find input::placeholder{color:var(--ink3)}
.cx-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;
  clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
.cx-tally{font-size:.67rem;color:var(--ink3);white-space:nowrap;font-variant-numeric:tabular-nums;
  font-family:var(--mono);letter-spacing:.04em}

.cx-list{overflow-y:auto;padding:.35rem 0 .5rem;min-height:0}
.cx-grp{display:flex;align-items:center;gap:.5rem;font-family:var(--mono);font-size:.57rem;letter-spacing:.18em;
  text-transform:uppercase;color:var(--sig);padding:.9rem .85rem .3rem;margin:0}
.cx-grp::after{content:"";flex:1;height:1px;background:var(--rule2)}
.cx-grp[hidden]{display:none}
.cx-row{display:block;padding:.42rem .85rem;text-decoration:none;border-left:3px solid transparent}
.cx-row[hidden]{display:none}
.cx-row .cx-n{display:block;font-family:var(--mono);font-size:.83rem;color:var(--ink);line-height:1.4}
.cx-row .cx-d{display:block;font-size:.75rem;color:var(--ink3);line-height:1.32}
.cx-row:hover{background:var(--sig-soft)}
.cx-row:hover .cx-n{color:var(--sig)}
.cx-row[aria-current="true"]{background:var(--sig-soft);border-left-color:var(--sig)}
.cx-row[aria-current="true"] .cx-n{color:var(--sig);font-weight:650}
.cx-row[aria-current="true"] .cx-d{color:var(--ink2)}

/* ⚠️ ORDER IS LOAD-BEARING: the @media rule that SHOWS this is (0,1,0), exactly as
   specific as this one, so it can only win by coming later in the source. This
   declaration used to sit after it and silently suppressed the button at every width
   — with setOpen() collapsing the picker below 880px, that made the command list
   unreachable on a phone. Never move this below the media block. */
.cx-fold{display:none}

.cx-nohit{padding:.85rem .8rem;font-size:.8rem;color:var(--ink2)}
.cx-nohit[hidden]{display:none}
.cx-nohit b{display:block;color:var(--ink);font-size:.82rem;margin-bottom:.45rem}
.cx-sug{display:flex;flex-wrap:wrap;gap:.35rem}
.cx-sug button{font:inherit;font-family:var(--mono);font-size:.76rem;cursor:pointer;padding:.3rem .5rem;
  border:1px solid var(--sig-line);border-radius:5px;background:var(--sig-soft);color:var(--sig)}

/* ── bays ───────────────────────────────────────────────────────────────────
   Two zones, and the split is the whole point: .cx-top says what the command IS
   in prose, .cx-opts says what it TAKES as data. One card with fourteen identical
   siblings is a list of boxes; a card that visibly changes material halfway down
   tells a reader where to stop reading and start scanning. */
.cx-doc{min-width:0}
.cx-band{display:flex;align-items:center;gap:.7rem;font-family:var(--mono);font-size:.6rem;
  letter-spacing:.2em;text-transform:uppercase;color:var(--sig);margin:2.4rem 0 .85rem;
  scroll-margin-top:calc(var(--cxbar) + 1rem)}
.cx-band::after{content:"";order:1;flex:1;height:1px;background:var(--sig-line)}
.cx-ct{order:2;font-variant-numeric:tabular-nums;color:var(--ink2);letter-spacing:.1em;padding-left:.15rem}
.cx-band:first-of-type{margin-top:0}
.cx-band[hidden]{display:none}
.cx-bay{border:1px solid var(--rule);border-radius:9px;background:var(--raised);overflow:hidden;
  margin-bottom:.85rem;scroll-margin-top:calc(var(--cxbar) + 1rem)}
.cx-bay[hidden]{display:none}
.cx-top{padding:.9rem 1rem .85rem}
.cx-bay h2{font-family:var(--mono);font-size:1.02rem;font-weight:650;margin:0;color:var(--ink);letter-spacing:-.015em}
/* Mono is reserved for things you type. A guide is a thing you understand, so it
   takes the display face — otherwise a concept and a command read as the same kind
   of object and the reader has to work out which is which. */
.cx-bay[data-guide] h2{font-family:var(--display);font-size:1.12rem;font-weight:650;letter-spacing:-.02em}
.cx-sl2{color:var(--sig)}
.cx-why{margin:.22rem 0 0;color:var(--ink2);font-size:.93rem;line-height:1.45;max-width:60ch}

/* The continuous hairline down the option block is the grid made visible: every
   option name stops at the same x, so a reader scanning for one runs their eye
   down a rule rather than a ragged edge. Drawn on the container, not per row —
   a per-row border breaks at every gap. */
.cx-opts{position:relative;padding:.55rem 1rem .75rem;display:grid;gap:0;
  background:${BED_SOFT};border-top:1px solid var(--rule)}
.cx-opts::before{content:"";position:absolute;left:calc(1rem + 148px);top:.55rem;bottom:.75rem;
  width:1px;background:var(--rule2)}
.cx-opts:empty{display:none}
.cx-opt{display:grid;grid-template-columns:148px 1fr;gap:.2rem 1.1rem;align-items:baseline;padding:.44rem 0}
.cx-opt + .cx-opt{border-top:1px solid var(--rule2)}
.cx-on{font-family:var(--mono);font-size:.81rem;color:var(--sig);display:flex;align-items:baseline;
  gap:.4rem;flex-wrap:wrap;text-decoration:none}
a.cx-on{color:var(--ink3)}
a.cx-on:hover{color:var(--sig);text-decoration:underline;text-underline-offset:3px}
.cx-req{font-size:.57rem;letter-spacing:.08em;text-transform:uppercase;font-weight:700;
  color:var(--raised);background:var(--sig);padding:.1rem .32rem;border-radius:3px}
.cx-takes{font-size:.86rem;color:var(--ink2);min-width:0;overflow-wrap:anywhere}
.cx-eg{display:block;font-family:var(--mono);font-size:.77rem;color:var(--ink3);margin-top:.2rem}
/* The one option every command carries. Dimmed to the weight of a footnote so the
   options that actually differ between commands are the ones that read first. */
.cx-bare{grid-column:1/-1;margin:0 0 .1rem;font-size:.86rem;color:var(--ink2)}
.cx-sh{opacity:.72}
.cx-sh:hover{opacity:1}

/* Choices are VISIBLE. Only the overflow hides, and it says how much.
   Harkirat, 2026-08-17 19:57 EDT: burying the timezone list behind a first click is the
   opposite of helping — the reader came here to see what the values ARE. */
.cx-pills{display:flex;flex-wrap:wrap;gap:.32rem;align-items:center;margin-top:.2rem}
.cx-takes:not(:empty) > .cx-pills{margin-top:.28rem}
.cx-pill{font:inherit;font-family:var(--mono);font-size:.74rem;cursor:pointer;padding:.28rem .52rem;
  border:1px solid var(--rule);border-radius:5px;background:var(--raised);color:var(--ink2);line-height:1.35}
.cx-pill:hover{border-color:var(--sig);color:var(--sig)}
.cx-pill[aria-pressed="true"]{background:var(--sig);border-color:var(--sig);color:var(--raised);font-weight:600}
.cx-pill[hidden]{display:none}
/* A choice that carries a hint becomes a two-line pill: the name it is actually called,
   and underneath, dimmer and smaller, what that name looks like in practice. */
.cx-pill2{display:inline-flex;flex-direction:column;align-items:flex-start;gap:.05rem;text-align:left;line-height:1.3}
.cx-hint{font-size:.68rem;color:var(--ink3);font-weight:400}
.cx-pill2[aria-pressed="true"] .cx-hint{color:var(--raised);opacity:.85}
.cx-more{font:inherit;font-size:.74rem;font-weight:600;cursor:pointer;color:var(--sig);background:none;
  border:0;padding:.28rem .3rem;text-decoration:underline;text-underline-offset:3px}

/* ── guides: a comparison, never a paragraph ──────────────────────────────── */
.cx-two{display:grid;grid-template-columns:1fr 1fr;gap:.65rem;padding:0 1rem .2rem}
.cx-card{border:1px solid var(--rule);border-left:2px solid var(--sig-line);border-radius:6px;padding:.65rem .75rem;background:${BED}}
.cx-card b{display:block;font-family:var(--mono);font-size:.8rem;color:var(--sig);margin-bottom:.2rem}
.cx-card span{font-size:.86rem;color:var(--ink2);line-height:1.45}
.cx-note{margin:0;padding:.65rem 1rem .95rem;font-size:.81rem;color:var(--ink3);max-width:70ch;line-height:1.5}

@media (max-width:880px){
  .cx-doc,.cx-pick,.cx-band,.cx-bay{--cxbar:calc(54px + 3.3rem)}
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
  .cx-opts::before{display:none}
  .cx-head{padding-top:1.8rem}
  .cx-line{font-size:.95rem}
}

/* WCAG 2.5.5: a coarse pointer gets real targets. These controls are functional
   — a pill rewrites the Composer — so an undersized one is a broken control,
   not a cramped one. */
@media (pointer:coarse){
  .cx-pill{padding:.46rem .62rem}
  .cx-copy{padding:.6rem .85rem}
  .cx-row{padding:.6rem .85rem}
  .cx-more{padding:.52rem .4rem}
  /* Measured on a 390px touch viewport: these two came out at 31px and 27px, just
     under the 32px minimum, and "nearly" is not a size an AA check accepts. */
  .cx-find input{padding:.55rem 0}
  /* The shared option's name is a real link (it jumps to the guide), so it is a real
     target. Padded with a matching negative margin so the hit area reaches 32px
     without moving anything around it. */
  a.cx-on{display:inline-flex;padding:.56rem 0;margin:-.56rem 0}
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
    '  var comp=document.getElementById("cx-comp");',
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
    '      line.appendChild(span("cmd-c","/"));',
    '      line.appendChild(span("cx-hold","pick a command to build one"));',
    '      copy.disabled=true; copy.textContent="Copy"; copy.removeAttribute("data-done");',
    '      copy.setAttribute("aria-label","Copy the command you build here");',
    '      if(comp)comp.removeAttribute("data-built");',
    '      return;',
    '    }',
    '    copy.disabled=false;',
    '    if(comp)comp.setAttribute("data-built","1");',
    '    line.appendChild(span("cmd-c",bay.getAttribute("data-cmd")));',
    '    var pick=chosen(bay);',
    '    [].slice.call(bay.querySelectorAll(".cx-opt")).forEach(function(o){',
    '      var n=o.getAttribute("data-opt");',
    '      if(pick[n]==null) return;',
    '      line.appendChild(document.createTextNode(" "));',
    '      line.appendChild(span("cmd-o",n));',
    /* NO separator between the two beds: Discord draws them as one continuous pill,
       and cmdRoleCss's -1px overlap depends on them abutting — a text node here would
       open the very hairline that overlap exists to close. */
    '      line.appendChild(span("cmd-v",pick[n]));',
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
const orderOptions = (options, command) => options.slice().sort((a, b) =>
    Number(isShared(command, a)) - Number(isShared(command, b))
    || Number(b.required) - Number(a.required));

/* `visibility` is on every single command, so spelling out "Who sees the answer"
   under all fourteen of them printed the same sentence fourteen times and buried the
   options that actually differ. Harkirat made exactly this call on the bot side
   (2026-08-10 19:28 EDT: "visibility is shared in all the commands so having it
   individually under each of them makes no sense") — /help states it once at the end
   of a page rather than under each command. Here it renders last, dimmed, with its
   name linking to the guide that explains it, and no repeated blurb: the values are
   the only part a reader needs at the point of use. It stays a real .cx-opt with its
   data-opt, so the Composer still assembles it. */
function isShared(command, option) {
    return Object.prototype.hasOwnProperty.call(SHARED_OPTIONS, option.name)
        && !((COMMANDS[command.path] || {}).options || {})[option.name];
}

function renderOptions(command, C) {
    const { esc } = C;
    const entry = COMMANDS[command.path] || {};
    return orderOptions(command.options, command).map(option => {
        const shared = isShared(command, option);
        const takes = shared ? '' : optionProse(command.path, option.name);
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
            value = `<span class="cx-takes">${takes ? esc(takes) : ''}<span class="cx-pills">${pills}${more}</span></span>`;
        } else {
            const hint = option.autocomplete ? ' &middot; type to search' : '';
            const eg = examples ? `<span class="cx-eg">${esc(examples.map(e => `"${e}"`).join('  '))}</span>` : '';
            value = `<span class="cx-takes">${esc(takes)}${hint}${eg}</span>`;
        }

        const req = option.required ? '<span class="cx-req">required</span>' : '';
        const name = shared
            ? `<a class="cx-on" href="#guide-visibility">${esc(option.name)}</a>`
            : `<span class="cx-on">${esc(option.name)}${req}</span>`;
        return `<div class="cx-opt${shared ? ' cx-sh' : ''}" data-opt="${esc(option.name)}">` +
            `${name}${value}</div>`;
    }).join('');
}

/** True when every option the command takes is one every command takes. */
const bare = command => command.options.every(option => isShared(command, option));

function renderCommand(command, group, C) {
    const { esc } = C;
    const entry = COMMANDS[command.path] || {};
    // Everything the search can match on, in one attribute: the command, what it does, its option names and its choice labels.
    const find = [command.path, entry.purpose || '',
        command.options.map(o => o.name + ' ' + o.choices.join(' ')).join(' ')].join(' ');
    return `<article class="cx-bay" id="${esc(command.id)}" data-group="${esc(group.key)}" ` +
        `data-cmd="${esc(command.path)}" data-find="${esc(find)}">` +
        `<div class="cx-top"><h2><span class="cx-sl2">/</span>${esc(command.path.slice(1))}</h2>` +
        `<p class="cx-why">${esc(entry.purpose || command.description)}</p></div>` +
        `<div class="cx-opts">${bare(command) ? '<p class="cx-bare">Takes nothing else — just run it.</p>' : ''}${renderOptions(command, C)}</div>` +
        `</article>`;
}

function renderGuide(guide, C) {
    const { esc } = C;
    const cards = guide.compare.map(([head, body]) =>
        `<div class="cx-card"><b>${esc(head)}</b><span>${esc(body)}</span></div>`).join('');
    return `<article class="cx-bay" id="${esc(guide.id)}" data-group="${esc(guide.group)}" data-guide="1" ` +
        `data-find="${esc(guide.title + ' ' + guide.sub)}">` +
        `<div class="cx-top"><h2>${esc(guide.title)}</h2></div>` +
        `<div class="cx-two">${cards}</div>` +
        `<p class="cx-note">${esc(guide.note)}</p></article>`;
}

/**
 * Renders the whole page. `catalog` is scripts/lib/commandCatalog.js's output; `page` is the entry from buildLegalPages.js's page table.
 */
function commandsShell({ page, catalog, C, variant = null }) {
    requireChrome(C);
    assertProseCoverage(catalog);
    // The page table's accent and this module's own idea of the hue are two reads of one colour. They disagreed for a day and it showed on the bar; a build is the right place to find that out, not a colour picker.
    if (page.accent.toUpperCase() !== SIGNAL.dark.toUpperCase()) {
        throw new Error(`commandsPage.js: TOOL_PAGES declares accent ${page.accent} but SIGNAL.dark is ` +
            `${SIGNAL.dark}. These feed the SAME colour by two routes — :root{--accent} and the tab's ` +
            `data-accent, which the nav paints its indicator from — so a mismatch renders a pill and an ` +
            `Install button in two different shades. Change BRAND.signal, not this constant.`);
    }
    const { esc } = C;

    const guidesByGroup = new Map();
    for (const guide of GUIDES) {
        if (!guidesByGroup.has(guide.group)) guidesByGroup.set(guide.group, []);
        guidesByGroup.get(guide.group).push(guide);
    }

    const bands = [];
    const picker = [];
    // Variant comparison only — see scripts/lib/commandsVariants.js. Collected unconditionally because it is a handful of references, and a second traversal guarded by a flag is a second place for the two to disagree.
    const groupData = [];
    // mobileNav(cur, slots) — the second argument is the phone's section menu, and passing nothing left it empty on every phone. The groups ARE this page's sections.
    const slots = [];

    for (const group of catalog.groups) {
        const guides = guidesByGroup.get(group.key) || [];
        if (!guides.length && !group.commands.length) continue;

        // The band is the page's section heading, so it needs an id: mobileNav()'s section menu links to these the way the legal rail links to numbered clauses. allgood's section-header device — mono caps label, a hairline running to the right edge, and a figure riding it. Theirs is an ordinal; a count is the honest version here, because these groups are a set and not a sequence.
        const tally = guides.length + group.commands.length;
        bands.push(`<p class="cx-band" id="g-${esc(group.key)}" data-group="${esc(group.key)}">` +
            `${esc(group.label)}<span class="cx-ct">${tally}</span></p>`);
        slots.push(`<a href="#g-${esc(group.key)}" class="slot"><i>—</i><span>${esc(group.label)}</span></a>`);
        picker.push(`<p class="cx-grp" data-group="${esc(group.key)}">${esc(group.label)}</p>`);

        groupData.push({ key: group.key, label: group.label, commands: group.commands,
            guides: guides.map(g => ({ ...g, html: renderGuide(g, C) })) });
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
    /* 🔴 EVERY OTHER PAGE DECLARES `:root{--accent:<hex>}` AND THIS ONE DID NOT.
       Measured on the built file: terms #F2994A, contributing #8B9BFF, the landing
       page #FF7D5C, the chronicle #FF9E3D — and commands.html, nothing. The page
       invented a private --sig namespace and never joined the site's own. So
       `--accent-t` (which TOKENS defines as var(--accent)) resolved to nothing, and
       with it every shared component keyed to the accent: the Install button had NO
       background at all, the current page's own nav tab lost its --rest tint, and the
       focus rings, selection colour and skip link all fell back to their initial
       values. None of that is visible in the generator and no gate reads it, because
       an undefined custom property is not an error — it just paints nothing.
       ⚠️ --accent stays the BRIGHT hue in both themes (it is a FILL: buttons, the nav
       plate); only --accent-t, the text-safe value, darkens for light.
       ⚠️ AND IT IS HAND-TUNED, NEVER INHERITED. TOKENS derives light --accent-t as
       38% accent over #120E1C, and this rule file records what that does to a
       saturated hue: it desaturates toward mud. #1E6B1F is the Accent Lab's own light
       value for 121°, measured against the light desk rather than mixed toward black.
       ⚠️ THREE BLOCKS, NOT TWO, mirroring TOKENS exactly. Light arrives two ways — an
       explicit toggle (`[data-theme=light]`) and a system preference with no toggle
       (`:root:not([data-theme=dark])` inside a prefers-color-scheme query) — and CSS
       cannot share a declaration list between them. With only the toggle branch, a
       reader whose OS is light and who has never pressed the switch got the DARK
       green on light paper: #58D05A on #EEECF2 is 1.69:1. contrastAudit() cannot see
       that path either, because it matches [data-theme=light] and not the query. */
    /* --glow was declared in TOOL_PAGES and read by NOTHING. On the legal set it
       draws `.doc::before`, the 3px accent→glow rule across the top of the document
       plate; on the warm pages it is half the radial wash. ⚠️ This family takes the
       RULE and refuses the WASH, and that is a boundary rather than a preference: the
       generator's own comment calls the wash "the single strongest signal that you
       have left the legal set", so wearing it here would say invitation when this
       page is an instrument. The rule goes on the Composer, which is this family's
       equivalent of the document plate — its one owned surface. */
    const lightVars = `--accent-t:${SIGNAL.light};--sig:${SIGNAL.light};` +
        `--sig-soft:${SIGNAL.light}1a;--sig-line:${SIGNAL.light}55`;
    /* ⚠️ THE DARK VALUE COMES FROM `page.accent`, NOT FROM SIGNAL.dark. Those are the two
       reads that must agree — the tab's `data-accent` (which the nav paints its indicator
       plate from) comes from the page table, so a second constant here is a second source
       of truth and it split once already. SIGNAL.dark is kept only as the assertion below
       that the two are the same value; SIGNAL.light has no counterpart in the table and
       stays a real constant. */
    const accent = `:root{--accent:${esc(page.accent)};--glow:${esc(page.glow)};--sig:${esc(page.accent)};` +
        `--sig-soft:${esc(page.accent)}26;--sig-line:${esc(page.accent)}5c}` +
        `:root[data-theme=light]{${lightVars}}` +
        `@media (prefers-color-scheme:light){:root:not([data-theme=dark]){${lightVars}}}`;

    /* ── THE THREE COMPARISON GRIDS ──────────────────────────────────────────
       Same chrome, same data, same colours — only the doc column changes, so what is
       being judged is the layout and nothing else. Null on the real page. */
    let docHtml = bands.join('');
    let pickInner = null;
    let variantCss = '';
    let variantJs = '';
    if (variant) {
        const V = require('./commandsVariants');
        const args = { groups: groupData, C, renderOptions, renderCommand, COMMANDS, esc };
        if (variant === 'ledger') { docHtml = V.renderLedger(args); variantCss = V.LEDGER_CSS; }
        if (variant === 'xref') { docHtml = V.renderXref(args); variantCss = V.XREF_CSS; variantJs = V.XREF_JS; }
        if (variant === 'sticky') {
            const out = V.renderSticky(args);
            docHtml = out.bays; pickInner = `<div class="st">${out.panels}</div>`;
            variantCss = V.STICKY_CSS; variantJs = V.STICKY_JS;
        }
    }

    return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(page.title)} — Dioreo</title>
<meta name="description" content="${esc(page.desc)}">
${C.THEME_BOOT}
<style>${C.TOKENS}${C.COMPONENT_CSS}${C.BAR_CSS}${C.PAGE_CSS}${C.SWITCHER_CSS}${accent}${COMMANDS_CSS}${C.cmdRoleCss('.cx-line')}${variantCss}</style>
</head><body>
<a class="skip" href="#main">Skip to content</a>
${C.GOO_SVG}
<!-- ⚠️ THE EXACT SHAPE shell() USES, and the three ways this page deviated from it
     are what "the whole page is misaligned" was. (1) The four controls belong in a
     <nav>: .bar nav margin-left:auto is what pushes them to the right edge, and
     as direct children of .bar they crammed left and wrapped to a second row.
     (2) The content belongs in .page, the shared column — not a private wrapper at
     a different max-width with no top padding for the fixed bar. (3) The footer is
     the LAST CHILD of .page: outside it, it stretches to the full viewport instead
     of the document column. Do not flatten any of these back out. -->
<div class="bar">
  ${C.wordmark('./', page)}
  <nav>${C.navSwitcher(page)}${C.repoBtn}${C.installBtn()}${C.themeBtn()}</nav>
</div>
${C.mobileNav(page, slots.join(''))}
<div class="page cx-floor">
<main id="main" tabindex="-1">
  <div class="cx-head">
    <p class="cx-kick">${esc(page.kicker)}</p>
    <h1>${esc(page.title)}</h1>
    <p>${esc(page.lede)}</p>
  </div>

  <!-- The Composer sits ABOVE both columns, not inside the reading one. It is the
       page's instrument rather than a feature of the bays, and docking it flush under
       the fixed bar makes the two read as one block of chrome instead of two things
       that happen to be sticky. -->
  <div class="cx-comp" id="cx-comp">
    <span class="cx-line" id="cx-line"><span class="cmd-c">/</span></span>
    <button class="cx-copy" id="cx-copy" type="button">Copy</button>
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
      <button class="cx-fold" id="cx-fold" type="button" aria-expanded="true">Browse all commands</button>${pickInner ? '\n      ' + pickInner : ''}
    </nav>

    <div class="cx-doc">
      ${docHtml}
    </div>
  </div>
</main>
  ${C.pageFoot(page)}
</div>
<!-- Outside .page: a fixed element is trapped by any ancestor with a transform or
     a filter, and MORPH_JS bails cleanly when #gotop is absent — which is why this
     page had the back-to-top CSS from COMPONENT_CSS and no button to apply it to.
     No #prog: a reading-progress bar measures linear progress through a document,
     and this page is a picker over a reference list, not a read. -->
${C.TOTOP_HTML}
<script>${C.THEME_JS}</script>
<script>${C.NAV_JS}</script>
<script>${C.MORPH_JS}</script>
<script>${C.TOTOP_TRACK_JS}</script>
<script>${COMMANDS_JS}</script>
${variantJs ? `<script>${variantJs}</script>` : ''}
</body></html>`;
}

module.exports = { commandsShell, CHROME_KEYS, SIGNAL, COMMANDS_CSS, COMMANDS_JS, VISIBLE_CHOICES, orderOptions };
