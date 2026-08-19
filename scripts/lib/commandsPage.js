/**
 * The /commands page — the site's FOURTH family. "THE BENCH."
 *
 * WHY IT IS A FAMILY AND NOT A FOURTH VOICE OF AN EXISTING ONE. `PAGES` is the numbered legal set: instruments, and the numbering is what says "these bind you". `EXTRA_PAGES` is the invitation. `chronicle.js` is the record. This page is none of those — it is a TOOL, read by someone mid-task who wants to leave as fast as possible with a command that works. The three existing families are all things you READ; this is a thing you USE, and the difference shows up in the grid rather than in the palette.
 *
 * ── THE SPATIAL IDEA, and the three rounds it took to find it ────────────── TWO ZONES, BOTH ALWAYS ON SCREEN. You do not scroll a list of commands; you pick one and a panel fills. The index never moves. Its resting state is a plain-language ask index, so ONE object answers both "I know exactly which command I want" and "I have no idea what this thing does".
 *
 * ⚠️ THE INTERACTION IS `:target` AND THEREFORE NEEDS NO JAVASCRIPT. Every command has a real URL, deep links work, and the page's core function survives with scripting off — which the previous design's filter-driven page did not. The home panel sits LAST in the DOM so `.cx-p:target ~ .cx-home` can hide it with a following-sibling selector; putting it first would need `:has()`, and this generator's own rules warn against making rendering depend on a selector feature behaving identically across engines.
 *
 * 🔴 THREE ROUNDS OF DESIGN WERE REJECTED BEFORE THIS ONE. Writing down why, because each failure is re-reachable:
 *   1. The page-wide COMPOSER — a bordered monospace box with a blinking caret that was READ-ONLY. Harkirat tried to type in it every single time he opened the site (2026-08-18 18:17 EDT). The page also had a second, quieter box you COULD type in, which made it exactly backwards. ⚠️ Never reintroduce a global command bar. ⚠️ And the lesson generalises DOWN: the search field must never be dressed as a command line either — a leading mono slash on a dark bed is the same promise in miniature.
 *   2. Three grid variants (ledger / xref / sticky) — INVALIDATED rather than judged, because all three contained the Composer. The round varied the layout while the real defect sat inside every option.
 *   3. Three more (askrack / rack / ask) — rejected on sight, 2026-08-18 22:05 EDT. All three were A SINGLE COLUMN YOU SCROLL, differing only in how much list sat above the fold: hairline rules, mono micro-labels, a dense one-column field. That is verbatim one of the three looks AI design defaults to, arrived at while avoiding the other two. A tidier list is not a spatial idea.
 *
 * ⚠️ THE PAGE IS POLYCHROME, AND THE COLOURS ARE THE BOT'S OWN. Every earlier attempt painted fourteen commands in one Signal Green while the bot itself ships a per-command accent — `.claude/rules/rendering-and-ui.md`'s live nav-order map. Using the real ones is not decoration, it is RECOGNITION: a reader who has seen /patch notes come back gold in Discord knows the panel before reading its name. ⚠️ Signal Green remains the PAGE's own accent (nav tab, Install button, focus rings) and must not be replaced by a command colour; the two do different jobs.
 *
 * ⚠️ SIX OF THE FOURTEEN HAVE NO FIXED COLOUR BY DESIGN and must never be given an invented one. `/settings`, `/colors`, `/dmz`, `/gunsmiths search`, `/gunsmiths list` and `/draw calculator` derive an accent per render from what you asked for. The index draws that as a HOLLOW dot — a true and unusual fact about this bot, drawn rather than written.
 *
 * 🚫 RULED OUT ON EVIDENCE, NOT TASTE, so it is not re-proposed: a page leading with pictures of the replies the bot actually SENDS. Rendering them at build time needs Mongo (draws, loadouts, the calendar) and the site builds with no DB — the same wall that kills a live season countdown. Screenshots would go stale on every Discord or bot UI change, breaking this page's whole no-drift premise. Harkirat ruled it out 2026-08-18 22:15 EDT.
 *
 * ⚠️ NO NUMBERED MARKERS ANYWHERE. Commands are a set, not a sequence, and the 01/02/03 device would be borrowed from the legal pages where the numbering is true and load-bearing. Options DO sort required-first, because that order is real information: it is what you must supply.
 *
 * ⚠️ NO BACKTICKS ANYWHERE INSIDE THE CSS AND JS CONSTANTS BELOW, and no braces inside a CSS comment. They are template literals: a backtick — including one inside a comment — ends the string and fails the build with a SyntaxError pointing at prose, and a brace in a comment is destroyed by the hover-guard transform. Quote with " instead.
 */

const { assertProseCoverage, assertAskCoverage, optionProse, GUIDES, ASKS, COMMANDS, SHARED_OPTIONS } = require('./commandProse');

const CHROME_KEYS = [
    'esc', 'TOKENS', 'COMPONENT_CSS', 'SWITCHER_CSS', 'THEME_BOOT', 'THEME_JS', 'NAV_JS',
    'GOO_SVG', 'MORPH_JS', 'wordmark', 'repoBtn', 'installBtn', 'themeBtn', 'navSwitcher',
    'mobileNav', 'pageFoot', 'BAR_CSS', 'PAGE_CSS', 'SLOT_CSS', 'TOTOP_HTML', 'TOTOP_TRACK_JS', 'cmdRoleCss',
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
 * The page's accent. 121 degrees, the midpoint of the widest gap on the site's tab hue wheel (citron 62 to teal 180), which leaves 59 degrees of clearance each way — the six document tabs are held to 30. ⚠️ The Changelog's phosphor is 131 degrees, ten away. That is KNOWN AND ACCEPTED, not an oversight: the record group is withdrawn from the nav everywhere except inside /changelog/, so the two are never seen together at tab size. ⚠️ The bot's own /help command briefly took this green on 2026-08-16 20:38 EDT and Harkirat reversed it the same evening — /help and /invite keep coral. That reversal was about the DISCORD surface only; the website page keeps green.
 */
/* `dark` MIRRORS buildLegalPages.js's BRAND.signal and exists to be asserted against it,
   never to be used as the value — see the accent block. `light` is the hand-tuned
   --accent-t for light theme (the Accent Lab's own value for 121 degrees, measured
   against the light desk rather than mixed toward black by TOKENS' 38% formula). */
const SIGNAL = { light: '#1E6B1F', dark: '#58D05A' };

/* 🔴 THE SITE HAS EXACTLY TWO SURFACES — --desk (the page) and --raised (a card).
   There is no third. An earlier version of this file used `--sunk` five times and it
   is declared NOWHERE in the repo; every one was an invalid background that painted
   nothing, and the build stayed green because contrastAudit() reads `--name: #hex`
   declarations only, so a rule painting its own surface is invisible to it. The
   site's idiom for a recessed bed is an INK TINT over whatever surface it lands on,
   exactly as the landing page's command pill does. It inverts correctly per theme
   with no second declaration, because --ink is near-white on the dark page and
   near-black on the light one. ⚠️ A color-mix() surface is invisible to the contrast
   gate; these percentages are hand-checked, not gate-covered. */
const BED = 'color-mix(in srgb,var(--ink) 6%,transparent)';
const LINE = 'color-mix(in srgb,var(--ink) 12%,transparent)';

/* ═══ THE BOT'S OWN PER-COMMAND COLOURS ═════════════════════════════════════
   Read back out of the command modules' PRESET_ACCENT constants rather than copied
   from the rules table, so the page and the bot cannot silently stop agreeing. The
   table and the code were byte-identical when this shipped (2026-08-18 22:19 EDT).
   ⚠️ /help and /invite SHARE coral deliberately: they are the bot's two META commands,
   about Dioreo itself rather than about CODM data, and both show the coral mascot. Do
   not "resolve" the duplicate by minting /invite a colour of its own — that has been
   considered and refused. */
const ACCENT_SOURCE = {
    '/help': 'help', '/invite': 'invite', '/calendar': 'calendar',
    '/draw prices': 'drawprices', '/season end': 'seasonend',
    '/patch notes': 'patchnotes', '/draws': 'draws', '/timestamp': 'timestamp',
};

/** The six that derive an accent per render, so the page can SAY so rather than invent one. */
const DERIVED = new Set(['/settings', '/colors', '/dmz', '/gunsmiths search', '/gunsmiths list', '/draw calculator']);

function loadAccents() {
    const fs = require('fs');
    const path = require('path');
    const out = {};
    for (const [cmd, mod] of Object.entries(ACCENT_SOURCE)) {
        const file = path.join(__dirname, '..', '..', 'commands', mod + '.js');
        const m = fs.readFileSync(file, 'utf8').match(/PRESET_ACCENT\s*=\s*(\d+)/);
        // A missing constant would hand the page a silently grey command. Loud instead.
        if (!m) throw new Error('commandsPage.js: commands/' + mod + '.js has no PRESET_ACCENT for ' + cmd);
        out[cmd] = '#' + Number(m[1]).toString(16).toUpperCase().padStart(6, '0');
    }
    return out;
}

/* ═══ COLOUR MATHS — SOLVED AGAINST THE REAL SURFACES, NEVER A FIXED MIX ═════
   TOKENS derives light --accent-t as 38% accent over near-black, and this repo's own
   rules record what that does to a saturated hue: it desaturates toward mud, which is
   why the page's own Signal Green light value is HAND-TUNED. Eight hand tunes is not
   maintainable, so this SOLVES instead — walk the colour's lightness until it actually
   MEASURES 4.5:1 against the real desk, one answer per theme. Same discipline as the
   nav indicator's dilation constants: measure the renderer, do not model it.
   ⚠️ Only lightness moves. The hue is the thing a reader recognises from Discord and
   must survive the correction. */
/* 🔴 SOLVE AGAINST THE HARDER GROUND IN EACH THEME, WHICH IS NOT THE SAME SURFACE.
   The site has two: --desk (the page) and --raised (a panel). Dark theme's --raised is
   LIGHTER than its --desk (#241F30 vs #16131B), so for near-white text the panel is the
   harder ground; light theme's --desk is DARKER than its --raised (#E7E4EC vs #EEECF2), so
   for near-black text the page is. ⚠️ Solving both against --desk was tried and MEASURED
   WRONG: /calendar, /draws and /draw prices came out at 4.00, 4.05 and 4.08 on the panel —
   the surface every command name is actually painted on — while reporting 4.60, 4.66 and 4.69
   against the desk and passing. This is the trap `.claude/rules/legal-site.md` already names:
   "tune a colour against the HARDER background of its theme". Every value here now clears
   4.5:1 on BOTH surfaces of its own theme, which is asserted in commandCatalog.test.js. */
const GROUND_DARK = '#241F30';
const GROUND_LIGHT = '#E7E4EC';

const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).toUpperCase().padStart(2, '0')).join('');

function lum(hex) {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const [r, g, b] = hex2rgb(hex).map(f);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

function rgb2hsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) {
        if (mx === r) h = ((g - b) / d) % 6;
        else if (mx === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
    }
    h *= 60; if (h < 0) h += 360;
    const l = (mx + mn) / 2;
    return [h, d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)), l];
}
function hsl2rgb([h, s, l]) {
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    const t = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
        : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return t.map(v => (v + m) * 255);
}

/** The nearest version of `hex` clearing `target` against `ground`, moving lightness only. */
function solveText(hex, ground, target = 4.5) {
    if (ratio(hex, ground) >= target) return hex;
    const [h, s, l0] = rgb2hsl(hex2rgb(hex));
    const up = lum(ground) < 0.5;
    let out = hex;
    for (let i = 1; i <= 100; i++) {
        const l = up ? Math.min(1, l0 + i / 100) : Math.max(0, l0 - i / 100);
        out = rgb2hex(hsl2rgb([h, s, l]));
        if (ratio(out, ground) >= target) break;
    }
    return out;
}

/**
 * The inline custom properties one command carries everywhere it appears. ⚠️ BOTH solved values are emitted, and the STYLESHEET picks between them into --ci. An inline style beats every stylesheet rule, so a single inline --ct could never be corrected for light theme — which is precisely the 1.69:1 failure this page shipped once already.
 */
function colourVars(cmdPath, accents) {
    const raw = accents[cmdPath];
    if (!raw) return '--cc:var(--ink3);--ct:var(--ink2);--ctl:var(--ink2)';
    return '--cc:' + raw + ';--ct:' + solveText(raw, GROUND_DARK) + ';--ctl:' + solveText(raw, GROUND_LIGHT);
}

const COMMANDS_CSS = `
/* Page-scoped. Every selector is prefixed cx- so nothing can collide with the shared
   chrome, which classCollisionAudit() checks across every template on the site. */

/* No wrapper of its own: this page sits in the site's .page, the same centred column
   every other family uses. A private wrapper at a different max-width is one of the
   three deviations that made this page render visibly misaligned once. */
.cx-floor{padding-bottom:3rem}

/* ── masthead ─────────────────────────────────────────────────────────────── */
.cx-head{padding:.4rem 0 2rem;max-width:44rem}
.cx-kick{margin:0 0 .7rem;font-family:var(--mono);font-size:.7rem;letter-spacing:.16em;
  text-transform:uppercase;color:var(--ink3)}
.cx-kick i{font-style:normal;color:var(--accent-t)}
.cx-head h1{margin:0;font-family:var(--display);font-weight:800;letter-spacing:-.03em;
  font-size:clamp(2.3rem,6vw,3.5rem);line-height:.98}
/* Sans with serif-italic set inside one line: the single most repeated device across the
   nine reference sites, and used nowhere else here. It costs no asset — --serif is
   already the site's body face. */
.cx-lede{margin:.85rem 0 0;font-family:var(--serif);font-size:1.1rem;line-height:1.55;
  color:var(--ink2);max-width:42ch}
.cx-lede em{font-style:italic;color:var(--ink)}

/* ── the bench ────────────────────────────────────────────────────────────── */
.cx-bench{display:grid;grid-template-columns:16rem minmax(0,1fr);gap:2.3rem;align-items:start}
.cx-ix{position:sticky;top:5.2rem;display:flex;flex-direction:column;
  padding-right:1.4rem;border-right:1px solid ${LINE}}

/* THE ONE INPUT ON THE PAGE, and it must read as a search field and nothing else. It
   used to wear a leading mono slash on a dark bed, which is the visual language of the
   read-only Composer that was deleted for looking like an input it was not. */
.cx-find{display:flex;align-items:center;gap:.5rem;margin:0 0 1.1rem;padding:.5rem .7rem;
  border-radius:8px;border:1px solid ${LINE};background:${BED}}
.cx-find svg{width:13px;height:13px;flex:none;stroke:var(--ink3);fill:none;stroke-width:2}
.cx-find input{flex:1;min-width:0;border:0;background:none;color:var(--ink);
  font-family:var(--display);font-size:.92rem;padding:0}
.cx-find input:focus{outline:none}
/* ⚠️ THE NATIVE CLEAR BUTTON ON type=search IS SYSTEM BLUE and belongs to no palette on this
   site — Harkirat's own screenshot caught it sitting in the field looking like a stray control
   from another application. It is replaced rather than hidden: a search field with fourteen
   filterable rows genuinely wants a one-tap clear, and removing it would push that job onto a
   keyboard the phone reader does not have. Drawn as a mask so it takes currentColor and
   therefore inverts with the theme by construction. */
.cx-find input::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none;
  width:14px;height:14px;cursor:pointer;background:var(--ink3);
  -webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 4l8 8M12 4l-8 8' stroke='black' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") center/contain no-repeat;
  mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 4l8 8M12 4l-8 8' stroke='black' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") center/contain no-repeat}
.cx-find input::-webkit-search-cancel-button:hover{background:var(--ink)}
.cx-find:focus-within{border-color:var(--accent-t)}
.cx-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

.cx-g{margin:.95rem 0 .3rem;font-family:var(--mono);font-size:.63rem;letter-spacing:.18em;
  text-transform:uppercase;color:var(--ink3)}
.cx-g:first-of-type{margin-top:0}
.cx-i{display:flex;align-items:center;gap:.6rem;padding:.34rem .45rem;border-radius:6px;
  font-family:var(--mono);font-size:.83rem;color:var(--ink2);text-decoration:none}
/* 🔴 DISPLAY BEATS THE hidden ATTRIBUTE — the UA rule for [hidden] sits at the bottom of the
   cascade, so any element given an explicit display keeps it while script sets .hidden = true.
   The filter therefore set the attribute on all fourteen index rows and NOTHING moved: typing
   "loadout" reported "1 of 14 match" while all fourteen stayed on screen, because .cx-i is
   display:flex. The group labels DID vanish, which made it look like a half-working filter
   rather than a cascade problem. This restores the intent explicitly, for every control the
   filter and the choice fold can hide. */
.cx-i[hidden],.cx-g[hidden],.cx-pill[hidden]{display:none}
/* THE DOT COLUMN IS THE PAGE'S SIGNATURE. Each dot is the command's real Discord accent;
   a HOLLOW dot means the command has no fixed colour and derives one per render. It is an
   index, a legend and a portrait of the product in one object — and it is true, which is
   why it earns the space. */
.cx-dot{width:8px;height:8px;border-radius:50%;background:var(--cc);flex:none}
.cx-dot.cx-drv{background:none;border:1px solid var(--ink3)}
.cx-i:hover{background:${BED};color:var(--ink)}
.cx-i.on{background:color-mix(in srgb,var(--cc) 18%,transparent);color:var(--ci)}
.cx-i:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.cx-none{margin:.6rem .45rem 0;font-family:var(--serif);font-size:.9rem;color:var(--ink3)}

/* ── the stage ────────────────────────────────────────────────────────────── */
/* :target does the switching, so the page needs no script to work at all. */
.cx-p{display:none}
.cx-p:target{display:block}
.cx-home{display:block}
.cx-p:target ~ .cx-home{display:none}

/* scroll-margin, because :target SCROLLS. Without it the browser pins the panel to the
   very top and the masthead disappears under the fixed bar, which reads as a headline
   clipped in half rather than as a page that moved. */
.cx-p{scroll-margin-top:7rem}
/* The panel takes focus programmatically via the fragment, so it must not paint a focus ring —
   :focus-visible already withholds one for a pointer-driven focus, and this makes it explicit
   for engines that treat a script-moved focus as keyboard-driven. The panel's own accent rule
   and heading are what tell a sighted reader where they landed. */
.cx-p:focus{outline:none}
.cx-p:focus-visible{outline:2px solid var(--accent);outline-offset:4px}

.cx-p,.cx-home{position:relative;padding:1.7rem 1.8rem 1.8rem;border-radius:14px;
  background:var(--raised);border:1px solid color-mix(in srgb,var(--ink) 8%,transparent);
  overflow:hidden}
/* THE ONE PIECE OF BOLDNESS: the stage wears the selected command's colour as a rule
   across the top and a soft aura bleeding from the corner. The reference set's most
   repeated ornament, which this site otherwise has nowhere. */
.cx-p::before{content:"";position:absolute;inset:0 0 auto;height:3px;background:var(--cc)}
.cx-p::after{content:"";position:absolute;top:-42%;right:-16%;width:58%;height:150%;
  border-radius:50%;background:var(--cc);opacity:.13;filter:blur(48px);pointer-events:none}
.cx-p > *{position:relative;z-index:1}

.cx-eyebrow{margin:0 0 .45rem;font-family:var(--mono);font-size:.65rem;letter-spacing:.18em;
  text-transform:uppercase;color:var(--ink3)}
.cx-p h2{margin:0;font-family:var(--mono);font-size:clamp(1.35rem,3.2vw,1.85rem);
  font-weight:700;letter-spacing:-.02em;color:var(--ci)}
.cx-why{margin:.5rem 0 1.3rem;font-family:var(--serif);font-size:1.1rem;line-height:1.5;
  color:var(--ink);max-width:46ch}
.cx-home h2{margin:0;font-family:var(--display);font-size:1.15rem;font-weight:700;
  letter-spacing:-.01em;color:var(--ink)}

/* 🔴 THE THEME-CORRECT TEXT COLOUR CANNOT BE CHOSEN INLINE. Each command carries both
   solved values as inline custom properties, because an inline style beats any stylesheet
   rule and one inline --ct could never be corrected for light. The stylesheet picks
   between them into --ci, and light arrives BOTH ways — an explicit toggle and a system
   preference with no toggle — so this is three blocks, mirroring TOKENS. With only the
   toggle branch a reader whose OS is light and who never pressed the switch gets the
   dark-solved colour on light paper, which is the exact failure this page shipped once. */
.cx-p,.cx-i,.cx-ask{--ci:var(--ct)}
:root[data-theme=light] .cx-p,:root[data-theme=light] .cx-i,:root[data-theme=light] .cx-ask{--ci:var(--ctl)}
@media (prefers-color-scheme:light){
  :root:not([data-theme=dark]) .cx-p,:root:not([data-theme=dark]) .cx-i,
  :root:not([data-theme=dark]) .cx-ask{--ci:var(--ctl)}
}

/* ── slots: a command's options, drawn as the blanks you fill ─────────────── */
/* A CODM gunsmith build IS a weapon with named slots you fill, and a slash command IS a
   command with named options you fill. The structures are identical and every reader of
   this page already knows the first one cold. The page never says "attachment" — the
   metaphor is the rationale for the shape, not a label printed on it.
   ⚠️ REQUIRED versus OPTIONAL is carried by SHAPE, never colour: a solid rule and a
   filled bed against a dashed rule and none. Locked decision, and the accessible one. */
.cx-rack{display:flex;flex-wrap:wrap;gap:.65rem;align-items:flex-start}
/* flex-GROW is 0 deliberately. With grow, a command carrying one optional slot stretched
   it the full width of the panel, which reads as an empty box rather than as one blank. */
.cx-slot{flex:0 1 19rem;min-width:0;display:flex;flex-direction:column;gap:.45rem;
  padding:.62rem .75rem .7rem;border-radius:8px;
  border:1px dashed color-mix(in srgb,var(--ink) 24%,transparent)}
.cx-slot.cx-wide{flex:0 1 30rem}
.cx-slot.cx-req{border-style:solid;border-color:color-mix(in srgb,var(--ink) 30%,transparent);
  background:${BED}}
.cx-lab{display:flex;align-items:center;gap:.45rem;font-family:var(--mono);font-size:.68rem;
  letter-spacing:.13em;text-transform:uppercase;color:var(--ink3)}
.cx-lab b{font-family:var(--mono);font-size:.56rem;font-weight:400;letter-spacing:.1em;
  padding:.12rem .34rem;border-radius:3px;color:var(--ink2);
  background:color-mix(in srgb,var(--ink) 14%,transparent)}
.cx-vals{display:flex;flex-wrap:wrap;gap:.3rem}
/* A choice is a real button: clicking it writes that value into this panel's copy line.
   This is the only interactive mechanism on the page and it is LOCAL to one command, which
   is what the page-wide Composer never was. */
.cx-pill{font-family:var(--mono);font-size:.74rem;padding:.2rem .44rem;border-radius:4px;
  color:var(--ink2);background:color-mix(in srgb,var(--ink) 10%,transparent);
  border:1px solid transparent;cursor:pointer;text-align:left}
.cx-pill:hover{color:var(--ink);border-color:color-mix(in srgb,var(--ink) 22%,transparent)}
.cx-pill[aria-pressed=true]{color:var(--ci);border-color:var(--cc);
  background:color-mix(in srgb,var(--cc) 18%,transparent)}
.cx-pill:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.cx-hint{display:block;font-size:.68rem;color:var(--ink3);margin-top:.1rem}
.cx-more{font-family:var(--mono);font-size:.72rem;padding:.2rem .3rem;border:0;
  background:none;color:var(--ink3);cursor:pointer;text-decoration:underline}
.cx-free{font-family:var(--serif);font-size:.92rem;line-height:1.42;color:var(--ink2)}
.cx-free i{font-style:normal;color:var(--ink3)}
.cx-eg{display:block;margin-top:.26rem;font-family:var(--mono);font-size:.74rem;color:var(--ink3)}
.cx-bare{margin:0;font-family:var(--mono);font-size:.76rem;letter-spacing:.05em;color:var(--ink3)}

/* ── the line you copy, inside the panel it belongs to ────────────────────── */
/* One row: the command and the button. COMMANDS_CSS used to draw a header strip saying
   "Copy this" above the code, and a button that says Copy needs no heading that says
   Copy this. ⚠️ --accent-t is rebound here so the shared cmd-* roles draw the command in
   the PANEL's colour; without it the copy line rendered the same words in Signal Green
   underneath a gold heading. */
.cx-run{margin-top:1.15rem;display:flex;align-items:center;justify-content:space-between;
  gap:1rem;flex-wrap:wrap}
/* ⚠️ BOTH accent variables are rebound, and rebinding only one was a real bug. cmdRoleCss draws
   the command name from --accent-t but the VALUE bed from --accent (a 26% mix), so with only
   --accent-t rebound a teal /timestamp panel rendered its value chips in Signal Green — the
   page accent leaking into a command's own object. Scoped to .cx-line, so the Copy button's
   focus ring still uses the page accent, which is what a focus ring should be. */
.cx-line{font-family:var(--mono);font-size:.9rem;min-width:0;overflow-wrap:anywhere;
  --accent:var(--cc);--accent-t:var(--ci)}
/* 🔴 AN OPTION AND ITS VALUE ARE ONE PILL AND MUST NEVER BREAK ACROSS LINES. They are two
   adjacent inline-blocks deliberately overlapped by -1px to close an iOS hairline, so a line
   break between them does not merely look untidy — it splits one object in half and leaves a
   square-edged stub. Measured on a real phone: /timestamp with three options picked put
   "timezone" on one line and its value on the next. */
.cx-pair{white-space:nowrap;display:inline-block}
.cx-copy{font-family:var(--mono);font-size:.72rem;letter-spacing:.06em;padding:.36rem .7rem;
  border-radius:6px;cursor:pointer;color:var(--ink2);background:${BED};
  border:1px solid ${LINE}}
.cx-copy:hover{color:var(--ink);border-color:color-mix(in srgb,var(--ink) 26%,transparent)}
.cx-copy[data-done]{color:var(--ci);border-color:var(--cc)}
.cx-copy:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

.cx-note{margin:1rem 0 0;font-family:var(--mono);font-size:.7rem;letter-spacing:.04em;
  color:var(--ink3)}
.cx-note a{color:var(--ink3)}

/* THE ONE LIVE THING ON THE PAGE, and it is a demonstration rather than an ornament:
   /timestamp exists so a posted time reads correctly in every reader's own zone, and the
   page proves that in the reader's own browser. No data source, nothing to go stale.
   ⚠️ Hidden until script fills it — an empty clock is worse than no clock. */
.cx-live{margin:.9rem 0 0;font-family:var(--serif);font-size:.95rem;color:var(--ink2)}
.cx-live b{font-family:var(--mono);font-size:.85rem;font-weight:400;color:var(--ci);
  padding:.1rem .34rem;border-radius:4px;background:color-mix(in srgb,var(--cc) 16%,transparent)}

/* ── the resting state: what do you need ──────────────────────────────────── */
/* TWO columns, not three. At three the questions wrapped to two lines each and the command
   floated off beside a half-empty row, which turns a scannable list into a paragraph field.
   A question and its command want to sit on ONE line — that is the whole reading gesture. */
.cx-asks{display:grid;grid-template-columns:repeat(auto-fill,minmax(21rem,1fr));
  gap:0 2rem;margin:1rem 0 0}
.cx-ask{display:flex;align-items:baseline;gap:.6rem;padding:.5rem .1rem;text-decoration:none;
  border-bottom:1px solid color-mix(in srgb,var(--ink) 8%,transparent)}
.cx-ask span{flex:1;font-family:var(--serif);font-size:.98rem;color:var(--ink2)}
.cx-ask em{font-family:var(--mono);font-style:normal;font-size:.74rem;color:var(--ink3);
  white-space:nowrap}
.cx-ask:hover span{color:var(--ink)}
.cx-ask:hover em{color:var(--ci)}
.cx-ask:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}

/* the two guides, on the home panel only */
.cx-guide{margin-top:1.9rem;padding-top:1.4rem;border-top:1px solid ${LINE}}
.cx-guide h3{margin:0 0 .7rem;font-family:var(--display);font-size:1rem;font-weight:700;
  color:var(--ink)}
.cx-two{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.7rem}
.cx-card{padding:.7rem .8rem;border-radius:7px;background:${BED};
  border-left:2px solid color-mix(in srgb,var(--ink) 24%,transparent)}
.cx-card b{display:block;font-family:var(--mono);font-size:.78rem;color:var(--ink)}
.cx-card span{display:block;margin-top:.2rem;font-family:var(--serif);font-size:.9rem;
  line-height:1.42;color:var(--ink2)}
.cx-gnote{margin:.7rem 0 0;font-family:var(--serif);font-size:.88rem;line-height:1.5;
  color:var(--ink3)}

/* ── motion: ONE orchestrated moment, and it is the click being answered ──── */
/* The panel rises and fades, and the accent rule wipes in from the left. Nothing else on
   the page animates — scattered effects are what read as machine-made. */
@keyframes cx-rise{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
@keyframes cx-wipe{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.cx-p:target{animation:cx-rise .26s cubic-bezier(.2,.7,.3,1) both}
.cx-p:target::before{transform-origin:left;animation:cx-wipe .34s cubic-bezier(.2,.7,.3,1) both}

/* WCAG 2.5.5: a coarse pointer gets real targets. These controls are functional, not
   decorative, so they take the full 44px rather than the relaxed 24px minimum. */
@media (pointer:coarse){
  .cx-i{min-height:44px}
  .cx-pill{min-height:32px;padding:.4rem .6rem}
  .cx-copy{min-height:44px;padding:.6rem 1rem}
  .cx-ask{min-height:44px}
}

@media (max-width:900px){
  /* 🔴 THE STAGE COMES FIRST ON A PHONE, AND THE INDEX SECOND. Measured at 375px with a real
     coarse pointer: the index is 876px tall once its targets are 44px, so whichever zone sits
     first costs the other a full screen of scrolling. It goes to the reader who is LOST —
     Harkirat's own framing of who this page is for ("the user is literally only here because
     they need help") — so the resting stage, which is the plain-language ask index, is what a
     phone lands on. Tapping a command still works from below: :target hides the home panel and
     the browser scrolls the chosen one into view against its scroll-margin.
     ⚠️ This is flex "order", so the DOM order is unchanged and the tab order still runs
     search -> commands -> stage, which is the order a keyboard user wants either way. */
  /* ⚠️ align-items MUST be reset here. The desktop rule carries align-items:start so the
     sticky index does not stretch to the stage's height — but in a flex COLUMN that same
     value governs the CROSS axis, which is now width, and it shrink-wrapped the whole index
     to 192px inside a 375px viewport. One narrow column of fourteen commands, measured. */
  .cx-bench{display:flex;flex-direction:column;gap:1.6rem;align-items:stretch}
  .cx-stage{order:1}
  .cx-ix{order:2}
  /* The mobile chrome is TWO stacked bars, not one: .bar ends at 54px and the section strip
     at 116px (161px while it is open). At the desktop 7rem the panel landed at 112px and the
     command name sat under the strip — measured, and visible in Harkirat's own screenshots. */
  .cx-p{scroll-margin-top:8.5rem}
  /* The index becomes a wrapping grid rather than a tower of links — a 452px single-column
     rail before any content was measured as a real defect on a real 390px viewport once. */
  .cx-ix{position:static;border-right:0;padding-right:0;display:block}
  .cx-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(10.5rem,1fr));gap:.1rem .7rem}
  .cx-g{grid-column:1/-1;margin:.75rem 0 .15rem}
  .cx-slot,.cx-slot.cx-wide{flex:1 1 100%}
  .cx-p,.cx-home{padding:1.3rem 1.15rem 1.4rem}
  .cx-head{padding-bottom:1.5rem}
  .cx-asks{grid-template-columns:minmax(0,1fr)}
}

/* Below ~560px a question no longer fits on one line beside its command, and the command then
   hangs off the first line's baseline while the question runs under it. Stacking is the honest
   shape at that width: the question, then the command it resolves to. */
@media (max-width:560px){
  .cx-ask{display:block;padding:.6rem .1rem}
  .cx-ask em{display:block;margin-top:.15rem}
}
`;

/* ⚠️ Plain string concatenation rather than one template literal, because this script is
   emitted INSIDE one and a stray backtick would end it. Joined with newlines so
   scriptSyntaxAudit()'s node --check reports a usable line number. */
const COMMANDS_JS = [
    '(function(){',
    '  var bench=document.getElementById("cx-bench"); if(!bench) return;',
    '  var items=[].slice.call(document.querySelectorAll(".cx-i"));',
    '  var panels=[].slice.call(document.querySelectorAll(".cx-p"));',
    '',
    '  /* The active mark on the index. CSS cannot express this: no selector reaches',
    '     BACKWARD from the targeted panel to the link that points at it. Everything else',
    '     about switching panels is :target and works with this script absent. */',
    '  function mark(){',
    '    var h=location.hash;',
    '    for(var i=0;i<items.length;i++) items[i].classList.toggle("on", items[i].getAttribute("href")===h);',
    '  }',
    '  addEventListener("hashchange",mark); mark();',
    '',
    '  /* EACH PANEL OWNS ITS OWN LINE. There is no page-wide composer, so a panel repaints',
    '     only itself and nothing has to work out which command you mean. The build already',
    '     rendered a correct line (the command plus its required options at real sample',
    '     values), which is what a reader with no JS gets and what this starts from. */',
    '  function span(cls,text){ var e=document.createElement("span"); e.className=cls; e.textContent=text; return e; }',
    '  function picked(p){ if(!p.__pick) p.__pick={}; return p.__pick; }',
    '  function plain(p){',
    '    var s=p.getAttribute("data-cmd"), pick=picked(p);',
    '    [].slice.call(p.querySelectorAll(".cx-slot")).forEach(function(o){',
    '      var n=o.getAttribute("data-opt");',
    '      if(pick[n]!=null) s+=" "+n+" "+pick[n];',
    '    });',
    '    return s;',
    '  }',
    '  function paint(p){',
    '    var line=p.querySelector(".cx-line"), btn=p.querySelector(".cx-copy");',
    '    if(!line) return;',
    '    line.textContent="";',
    '    line.appendChild(span("cmd-c",p.getAttribute("data-cmd")));',
    '    var pick=picked(p);',
    '    [].slice.call(p.querySelectorAll(".cx-slot")).forEach(function(o){',
    '      var n=o.getAttribute("data-opt");',
    '      if(pick[n]==null) return;',
    '      line.appendChild(document.createTextNode(" "));',
    '      var pair=document.createElement("span"); pair.className="cx-pair";',
    '      pair.appendChild(span("cmd-o",n));',
    /* No separator between the two beds: cmdRoleCss overlaps them by -1px to close an
       iOS hairline that Chrome measures as a zero gap, and a text node here reopens it. */
    '      pair.appendChild(span("cmd-v",pick[n]));',
    '      line.appendChild(pair);',
    '    });',
    '    if(btn){ btn.removeAttribute("data-done"); btn.textContent="Copy";',
    '      btn.setAttribute("aria-label","Copy "+plain(p)); }',
    '  }',
    '',
    '  panels.forEach(function(p){',
    '    var btn=p.querySelector(".cx-copy");',
    '    if(btn) btn.addEventListener("click",function(){',
    '      var text=plain(p);',
    '      if(navigator.clipboard) navigator.clipboard.writeText(text)["catch"](function(){});',
    '      btn.textContent="Copied"; btn.setAttribute("data-done","1");',
    '    });',
    '    [].slice.call(p.querySelectorAll(".cx-pill")).forEach(function(b){',
    '      b.addEventListener("click",function(){',
    '        var slot=b.closest(".cx-slot"), n=slot.getAttribute("data-opt"), v=b.getAttribute("data-val");',
    '        var pick=picked(p), was=pick[n]===v;',
    '        [].slice.call(slot.querySelectorAll(".cx-pill")).forEach(function(x){ x.setAttribute("aria-pressed","false"); });',
    '        if(was) delete pick[n]; else { pick[n]=v; b.setAttribute("aria-pressed","true"); }',
    '        paint(p);',
    '      });',
    '    });',
    '    [].slice.call(p.querySelectorAll(".cx-more")).forEach(function(m){',
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
    '  /* Search filters the INDEX, not the stage — the stage already shows exactly one',
    '     command. It matches the command, what it does, its option NAMES and its choice',
    '     LABELS, so "timezone" finds /timestamp and "nameplate" finds /colors. That is the',
    '     thing a reference page can do that Discord own picker cannot, and it is the only',
    '     reason this field earns its place beside a list of fourteen visible items. */',
    '  var q=document.getElementById("cx-q"), count=document.getElementById("cx-count");',
    '  function filter(){',
    '    var v=q.value.trim().toLowerCase(), hits=0, live={};',
    '    items.forEach(function(it){',
    '      var on=!v||(it.getAttribute("data-find")||"").toLowerCase().indexOf(v)>-1;',
    '      it.hidden=!on; if(on){ hits++; live[it.getAttribute("data-group")]=1; }',
    '    });',
    '    [].slice.call(document.querySelectorAll(".cx-g")).forEach(function(g){',
    '      g.hidden=!live[g.getAttribute("data-group")];',
    '    });',
    '    /* WCAG 4.1.3: say what the filter did, and say NOTHING while it is idle. */',
    '    count.textContent = !v ? "" : (hits ? (hits+" of "+items.length+" match") :',
    '      "Nothing matches. Try a weapon, a season, or \\"timezone\\".");',
    '  }',
    '  q.addEventListener("input",filter);',
    '  q.addEventListener("keydown",function(e){',
    '    if(e.key!=="Enter") return;',
    '    var first=items.filter(function(i){ return !i.hidden; })[0];',
    '    if(first){ e.preventDefault(); location.hash=first.getAttribute("href"); }',
    '  });',
    '  filter();',
    '',
    '  /* The live clock in /timestamp panel. It is the one live thing on the page and it is',
    '     a DEMONSTRATION: that command exists so a posted time reads correctly in every',
    '     reader own zone, and this proves it in the reader own browser. No data source, so',
    '     nothing can go stale. Hidden in the markup and revealed here, because an empty',
    '     clock is worse than no clock. */',
    '  var live=document.getElementById("cx-live");',
    '  if(live){',
    '    var slot=live.querySelector("b");',
    '    function tick(){',
    '      var d=new Date();',
    '      var t=d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});',
    '      var z="";',
    '      try{ z=Intl.DateTimeFormat().resolvedOptions().timeZone||""; }catch(e){}',
    '      slot.textContent=z?(t+"  "+z):t;',
    '    }',
    '    tick(); setInterval(tick,20000); live.hidden=false;',
    '  }',
    '})();',
].join('\n');

/**
 * A few choices carry a HINT as well as a name, packed into one string because Discord has only one field for it. /timestamp's style option is the case. The choice is the name; the rest describes what that format looks like. Both halves show — the name as the pill's label, the hint on a second line where it explains rather than competes — and only the name goes into the command line, where the example would read as part of the value.
 */
const splitChoice = choice => {
    const i = choice.indexOf(' — ');
    return i === -1
        ? { label: choice, hint: '' }
        : { label: choice.slice(0, i).trim(), hint: choice.slice(i + 3).trim() };
};

/** How many choices show before the rest fold away. */
const VISIBLE_CHOICES = 6;

/* `visibility` is on every single command and means the same thing every time, so it is
   NOT drawn as a slot: it is a property of the ANSWER rather than of the query. Harkirat
   made exactly this call on the bot side (2026-08-10 19:28 EDT: "visibility is shared in
   all the commands so having it individually under each of them makes no sense"). It is
   explained once in the "Who sees your answer" guide, and each panel carries a one-line
   footnote linking there rather than repeating the sentence fourteen times. */
function isShared(command, option) {
    return Object.prototype.hasOwnProperty.call(SHARED_OPTIONS, option.name)
        && !((COMMANDS[command.path] || {}).options || {})[option.name];
}

/** Required first — that order is information, not styling. */
const ownOptions = command => command.options
    .filter(o => !isShared(command, o))
    .slice().sort((a, b) => Number(b.required) - Number(a.required));

function renderSlot(option, command, examples, C) {
    const { esc } = C;
    const takes = optionProse(command.path, option.name) || '';
    let body;
    if (option.choices.length) {
        const pills = option.choices.map((choice, i) => {
            const hidden = i >= VISIBLE_CHOICES ? ' hidden' : '';
            const { label, hint } = splitChoice(choice);
            return '<button type="button" class="cx-pill" aria-pressed="false" data-val="' + esc(label) + '"' +
                hidden + '>' + esc(label) + (hint ? '<span class="cx-hint">' + esc(hint) + '</span>' : '') + '</button>';
        }).join('');
        const label = 'Show all ' + option.choices.length;
        const more = option.choices.length > VISIBLE_CHOICES
            ? '<button type="button" class="cx-more" data-open="0" data-visible="' + VISIBLE_CHOICES +
              '" data-label="' + esc(label) + '">' + esc(label) + '</button>'
            : '';
        body = '<span class="cx-vals">' + pills + more + '</span>';
    } else {
        const eg = (examples || {})[option.name];
        body = '<span class="cx-free">' + esc(takes) + (option.autocomplete ? ' <i>&middot; type to search</i>' : '') +
            (eg ? '<span class="cx-eg">' + esc(eg.map(e => '"' + e + '"').join('  ')) + '</span>' : '') + '</span>';
    }
    return '<div class="cx-slot' + (option.required ? ' cx-req' : '') +
        (option.choices.length > 3 ? ' cx-wide' : '') + '" data-opt="' + esc(option.name) + '">' +
        '<span class="cx-lab">' + esc(option.name) + (option.required ? '<b>required</b>' : '') + '</span>' +
        body + '</div>';
}

/**
 * The invocation a reader copies, rendered at BUILD time so it is correct with no JS at all: the command, then each REQUIRED option at the real sample value from commandProse.js. Optional options are left off — a line you can paste and have work beats a line showing everything the command could take, which the slots above already do. Drawn with the shared cmd-* roles, so it is the same object the landing page draws and the same one Discord itself draws.
 */
function runLine(command, C) {
    const { esc } = C;
    const sample = (COMMANDS[command.path] || {}).sample || {};
    const parts = ['<span class="cmd-c">' + esc(command.path) + '</span>'];
    let plain = command.path;
    for (const option of command.options) {
        if (!option.required) continue;
        const value = sample[option.name]
            || (option.choices.length ? splitChoice(option.choices[0]).label : null);
        if (!value) continue;
        parts.push(' <span class="cx-pair"><span class="cmd-o">' + esc(option.name) +
            '</span><span class="cmd-v">' + esc(value) + '</span></span>');
        plain += ' ' + option.name + ' ' + value;
    }
    return '<div class="cx-run"><code class="cx-line">' + parts.join('') + '</code>' +
        '<button type="button" class="cx-copy" aria-label="Copy ' + esc(plain) + '">Copy</button></div>';
}

/** One command's panel — the thing the stage shows. */
function renderPanel(command, group, C, accents) {
    const { esc } = C;
    const entry = COMMANDS[command.path] || {};
    const options = ownOptions(command);
    const live = command.path === '/timestamp'
        ? '<p class="cx-live" id="cx-live" hidden>Where you are it is <b></b> — and a Dioreo timestamp shows everyone their own version of the same moment.</p>'
        : '';
    /* tabindex="-1" so the fragment jump moves FOCUS into the panel, not just the viewport.
       A <section> is not focusable, so without it a keyboard or screen-reader user activates a
       command in the index, the stage silently swaps behind them, and their focus stays on the
       link — they are told nothing changed. It is the same technique the shared skip link uses
       on <main>, and for the same reason. -1 keeps it out of the tab sequence. */
    return '<section class="cx-p" tabindex="-1" id="' + esc(command.id) + '" style="' + colourVars(command.path, accents) + '" ' +
        'data-cmd="' + esc(command.path) + '" data-group="' + esc(group.key) + '">' +
        '<p class="cx-eyebrow">' + esc(group.label) + '</p>' +
        '<h2>' + esc(command.path) + '</h2>' +
        '<p class="cx-why">' + esc(entry.purpose || command.description) + '</p>' +
        (options.length
            ? '<div class="cx-rack">' + options.map(o => renderSlot(o, command, entry.examples, C)).join('') + '</div>'
            : '<p class="cx-bare">No options &mdash; just run it.</p>') +
        runLine(command, C) + live +
        '<p class="cx-note">' + (DERIVED.has(command.path)
            ? 'Its colour comes from what you asked for, so no two answers match.'
            : 'Always comes back in this colour.') +
        ' <a href="#' + esc(GUIDES[0].id) + '">Who sees it</a></p>' +
        '</section>';
}

function renderGuide(guide, C) {
    const { esc } = C;
    const cards = guide.compare.map(([head, body]) =>
        '<div class="cx-card"><b>' + esc(head) + '</b><span>' + esc(body) + '</span></div>').join('');
    return '<div class="cx-guide" id="' + esc(guide.id) + '">' +
        '<h3>' + esc(guide.title) + '</h3>' +
        '<div class="cx-two">' + cards + '</div>' +
        '<p class="cx-gnote">' + esc(guide.note) + '</p></div>';
}

/**
 * Renders the whole page. `catalog` is scripts/lib/commandCatalog.js's output; `page` is the entry from buildLegalPages.js's page table.
 */
function commandsShell({ page, catalog, C }) {
    requireChrome(C);
    assertProseCoverage(catalog);
    assertAskCoverage(catalog);
    // The page table's accent and this module's own idea of the hue are two reads of one colour. They disagreed for a day and it showed on the bar; a build is the right place to find that out, not a colour picker.
    if (page.accent.toUpperCase() !== SIGNAL.dark.toUpperCase()) {
        throw new Error('commandsPage.js: TOOL_PAGES declares accent ' + page.accent + ' but SIGNAL.dark is ' +
            SIGNAL.dark + '. These feed the SAME colour by two routes — :root{--accent} and the tab\'s ' +
            'data-accent, which the nav paints its indicator from — so a mismatch renders a pill and an ' +
            'Install button in two different shades. Change BRAND.signal, not this constant.');
    }
    const { esc } = C;
    const accents = loadAccents();

    /* The lede's emphasised phrase comes from the page table as PLAIN TEXT and is wrapped
       here, because a page table feeds escaped strings and markup in one would render as
       visible angle brackets. It throws rather than falling back: an emphasis that silently
       stops applying is a design decision quietly reverting itself, and nothing else on the
       page would report it. */
    if (!page.lede.includes(page.ledeEm)) {
        throw new Error('commandsPage.js: TOOL_PAGES ledeEm ' + JSON.stringify(page.ledeEm) +
            ' does not occur in lede ' + JSON.stringify(page.lede) + '. The serif-italic phrase ' +
            'is a substring of the lede, so the two must be edited together.');
    }
    const ledeHtml = esc(page.lede).replace(esc(page.ledeEm), '<em>' + esc(page.ledeEm) + '</em>');

    const index = [];
    const panels = [];
    const slots = [];
    const byPath = new Map();

    for (const group of catalog.groups) {
        if (!group.commands.length) continue;
        index.push('<p class="cx-g" data-group="' + esc(group.key) + '">' + esc(group.label) + '</p>');
        slots.push('<a href="#' + esc(group.commands[0].id) + '" class="slot"><i>&mdash;</i><span>' +
            esc(group.label) + '</span></a>');
        for (const command of group.commands) {
            byPath.set(command.path, command);
            const entry = COMMANDS[command.path] || {};
            // Everything the search can match on, in one attribute: the command, what it does, its option names and its choice labels.
            const find = [command.path, entry.purpose || '',
                command.options.map(o => o.name + ' ' + o.choices.join(' ')).join(' ')].join(' ');
            index.push('<a class="cx-i" href="#' + esc(command.id) + '" data-group="' + esc(group.key) + '" ' +
                'data-find="' + esc(find) + '" style="' + colourVars(command.path, accents) + '">' +
                '<i class="cx-dot' + (DERIVED.has(command.path) ? ' cx-drv' : '') + '" aria-hidden="true"></i>' +
                esc(command.path) + '</a>');
            panels.push(renderPanel(command, group, C, accents));
        }
    }

    const asks = ASKS.map(a => {
        const command = byPath.get(a.to);
        // A silent miss would leave the index quietly pointing nowhere. assertAskCoverage already caught this at the top; belt and braces, because this one renders a dead link rather than throwing.
        if (!command) throw new Error('commandsPage.js: the ask "' + a.q + '" points at ' + a.to + ', which the bot no longer registers.');
        return '<a class="cx-ask" href="#' + esc(command.id) + '" style="' + colourVars(a.to, accents) + '">' +
            '<span>' + esc(a.q) + '</span><em>' + esc(a.to) + '</em></a>';
    }).join('');

    /* ⚠️ THIS SITE IS DARK-FIRST, and getting the polarity backwards is silent. The bare
       :root block IS the dark theme — TOKENS declares the dark values there and light
       arrives as an override. Writing it the other way round renders a dark-on-dark page
       AND reads as correct in the source.
       🔴 EVERY OTHER PAGE DECLARES `:root{--accent:<hex>}` AND THIS ONE ONCE DID NOT, which
       is not an error but an invalid value that paints nothing: --accent-t died with it and
       the Install button rendered with NO background, the current tab lost its --rest tint,
       and focus rings, selection colour and the skip link all fell back to initial values.
       ⚠️ --accent stays the BRIGHT hue in both themes (it is a FILL); only --accent-t, the
       text-safe value, darkens for light — and it is HAND-TUNED, never inherited, because
       TOKENS' 38% formula desaturates a saturated hue toward mud.
       ⚠️ THREE BLOCKS, NOT TWO, mirroring TOKENS: light arrives as an explicit toggle AND as
       a system preference with no toggle, and CSS cannot share a declaration list between
       them. With only the toggle branch, #58D05A on #EEECF2 is 1.69:1. */
    const lightVars = '--accent-t:' + SIGNAL.light;
    const accent = ':root{--accent:' + esc(page.accent) + ';--glow:' + esc(page.glow) + '}' +
        ':root[data-theme=light]{' + lightVars + '}' +
        '@media (prefers-color-scheme:light){:root:not([data-theme=dark]){' + lightVars + '}}';

    return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(page.title)} — Dioreo</title>
<meta name="description" content="${esc(page.desc)}">
${C.THEME_BOOT}
<style>${C.TOKENS}${C.COMPONENT_CSS}${C.BAR_CSS}${C.PAGE_CSS}${C.SLOT_CSS}${C.SWITCHER_CSS}${accent}${COMMANDS_CSS}${C.cmdRoleCss('.cx-line', false)}</style>
</head><body>
<a class="skip" href="#main">Skip to content</a>
${C.GOO_SVG}
<!-- ⚠️ THE EXACT SHAPE shell() USES, and the three ways this page once deviated from it
     are what "the whole page is misaligned" was. (1) The four controls belong in a
     <nav>: .bar nav margin-left:auto is what pushes them to the right edge, and as
     direct children of .bar they crammed left and wrapped to a second row. (2) The
     content belongs in .page, the shared column — not a private wrapper at a different
     max-width with no top padding for the fixed bar. (3) The footer is the LAST CHILD of
     .page: outside it, it stretches to the full viewport instead of the document column.
     Do not flatten any of these back out. -->
<div class="bar">
  ${C.wordmark('./', page)}
  <nav>${C.navSwitcher(page)}${C.repoBtn}${C.installBtn()}${C.themeBtn()}</nav>
</div>
${C.mobileNav(page, slots.join(''))}
<div class="page cx-floor">
<main id="main" tabindex="-1">
  <header class="cx-head">
    <p class="cx-kick">${esc(page.kicker)} <i>&middot;</i> ${catalog.commandCount} commands</p>
    <h1>${esc(page.title)}</h1>
    <p class="cx-lede">${ledeHtml}</p>
  </header>

  <div class="cx-bench" id="cx-bench">
    <nav class="cx-ix" aria-label="All commands">
      <div class="cx-find">
        <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6"/><path d="M13.5 13.5 18 18"/></svg>
        <label class="cx-sr" for="cx-q">Search commands</label>
        <input id="cx-q" type="search" placeholder="Search" autocomplete="off" spellcheck="false">
      </div>
      <div class="cx-list">${index.join('')}</div>
      <!-- WCAG 4.1.3 Status Messages. Filtering hides index items, and without a status region
           a screen-reader user gets no signal that the list changed or emptied. role="status" is
           polite so it never interrupts, and it stays EMPTY at rest — a region that announces
           "14 commands" on load is noise rather than information. -->
      <p class="cx-none" id="cx-count" role="status"></p>
    </nav>

    <div class="cx-stage">
      ${panels.join('')}
      <section class="cx-home">
        <h2>What do you need</h2>
        <div class="cx-asks">${asks}</div>
        ${GUIDES.map(g => renderGuide(g, C)).join('')}
      </section>
    </div>
  </div>
</main>
  ${C.pageFoot(page)}
</div>
<!-- Outside .page: a fixed element is trapped by any ancestor with a transform or a
     filter, and MORPH_JS bails cleanly when the button is absent. No #prog: a reading
     progress bar measures linear progress through a document, and this page is an
     instrument, not a read. -->
${C.TOTOP_HTML}
<script>${C.THEME_JS}</script>
<script>${C.NAV_JS}</script>
<script>${C.MORPH_JS}</script>
<script>${C.TOTOP_TRACK_JS}</script>
<script>${COMMANDS_JS}</script>
</body></html>`;
}

module.exports = {
    commandsShell, CHROME_KEYS, SIGNAL, COMMANDS_CSS, COMMANDS_JS,
    VISIBLE_CHOICES, ownOptions, isShared, solveText, loadAccents, DERIVED, GROUND_DARK, GROUND_LIGHT,
};
