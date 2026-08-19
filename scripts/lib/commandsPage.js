/**
 * The website's /commands page — "the Receiver".
 *
 * THE PAGE'S ONE RULE: the command line is never off screen. It is the artifact a reader came for, so everything else is arranged around keeping it visible and always valid. The reader picks a command from a rail, fills its options, and watches the line assemble. They copy it and paste it into Discord.
 *
 * ⚠️ FIFTH ARCHITECTURE. Harkirat chose it 2026-08-19 13:40 EDT, and the reason was MOBILE — measured on the previous design at 375x812: the command index began at y=1850 (2.3 screenfuls down) and was 855px tall, the panel for ONE command was 1282px, and its command line sat at y=1339. So on a phone the two-zone "Bench" was not two zones at all: it was a stack, and it degraded into exactly the single-scrolling-column shape that had already been rejected in round two. A layout whose entire premise is "both zones always on screen" cannot have a mobile mode where neither is.
 *
 * ⚠️ ONE SHAPE IN BOTH MODES. The rail wraps into grouped rows on a wide screen and scrolls horizontally on a narrow one, but it is the same object in the same place. The previous design had two unrelated behaviours and only one of them was ever designed.
 *
 * ⚠️ THE INTERACTION IS STILL `:target` AND STILL NEEDS NO JAVASCRIPT. Every command has a real URL, deep links work, and the page's core function survives with scripting off. The home panel sits LAST in the DOM so `.rx-p:target ~ .rx-home` can hide it with a following-sibling selector; putting it first would need `:has()`, and this generator's own rules warn against making rendering depend on a selector feature behaving identically across engines.
 *
 * ⚠️ THERE IS ALWAYS A WAY BACK, and there was not before. `:target` has no native "un-target", so the rail's first chip is a real link to the bare page URL and Escape does the same thing. The previous design's only route home was the "Who sees it" link — it pointed at a guide inside the home panel, so following it silently discarded the command you were reading, and nothing said so. That is what "HOW DO I GET BACK TO THE /commands LANDING PAGE???" was.
 *
 * ⚠️ A REQUIRED OPTION CANNOT VANISH FROM THE LINE. The line is built from the command's OPTION LIST, not from the set of values the reader has picked, and every option holds a permanent position in it. The previous `paint()` rebuilt the line from the picked set alone, so a free-text required option — which can never be in that set — disappeared the moment any other option was touched, and the page handed the reader a command Discord would reject. Verified live before this rewrite: `/timestamp datetime sun 4:30pm` became `/timestamp timezone (UTC-04:00) Eastern` after one tap.
 *
 * ⚠️ THE ACCENT IS A FILL, NEVER A TEXT COLOUR. This is the fix for the single worst thing in the previous version. Each command's accent is chosen for a Discord embed; bending it into a text colour by walking its lightness until it clears 4.5:1 turned Patch Gold #F2C230 into #7C5F08 in light theme — a 31-point lightness drop, which is brown — while the raw hex sat in a dot forty pixels away. The page was showing two different colours for one command and calling it recognition. So the accent now appears ONLY as a fill or a mark: the left rule, the dot, the command token, the filled value chip, the aura. Where text sits ON that fill, the FOREGROUND is solved (black or white) against it — a binary choice per hue that can never muddy. Headings are --ink.
 *
 * ⚠️ SIGNAL GREEN REMAINS THE PAGE'S OWN ACCENT (nav tab, Install button, focus rings). It must not be replaced by a command colour; the two do different jobs.
 *
 * ⚠️ THE SIX "COLOURLESS" COMMANDS ARE THE MOST ALIVE ONES NOW. Six commands derive an accent per render rather than carrying a fixed one, and the previous page drew that as a hollow outlined dot, which reads as unfinished rather than as a fact — "why are all of these commands missing unique colors??". They now carry a conic sweep of the SEVEN REAL weapon-category colours read out of utils/loadoutRender.js, and /gunsmiths list goes further: picking a scope re-tints the whole panel to that category's actual accent, because that is precisely what the bot will do. The page demonstrates its own sentence instead of asserting it.
 *
 * ⚠️ NO BACKTICKS ANYWHERE INSIDE THE CSS AND JS CONSTANTS BELOW, and no braces inside a CSS comment. They are template literals: a backtick — including one inside a comment — ends the string and fails the build with a SyntaxError pointing at prose, and a brace in a comment is destroyed by the hover-guard transform. Quote with " instead.
 *
 * ⚠️ THIS PAGE OPTS OUT OF TWO PIECES OF SHARED CHROME, deliberately, and neither is an oversight. It passes NO section slots to mobileNav(), so the "On this page" accordion does not render — the rail already is that navigation, and stacking a second one cost 107px above the fold on a phone. And it calls pageFoot() with disc=false, so the trademark disclaimer does not repeat here; it earns its place under a legal instrument and is noise under a command reference. Two other templates already do the same.
 *
 * Everything the page says about a command is read from the bot's own registered builders at build time (scripts/lib/commandCatalog.js) plus a prose layer (scripts/lib/commandProse.js), so the page cannot drift from what the bot actually does.
 */

const fs = require('fs');
const path = require('path');
const { assertProseCoverage, assertAskCoverage, assertSearchCoverage, searchHaystack, optionProse, GUIDES, ASKS, COMMANDS, SHARED_OPTIONS } = require('./commandProse');

const CHROME_KEYS = [
    'esc', 'TOKENS', 'COMPONENT_CSS', 'THEME_BOOT', 'THEME_JS', 'NAV_JS', 'MORPH_JS', 'GOO_SVG',
    'wordmark', 'navSwitcher', 'repoBtn', 'installBtn', 'themeBtn',
    'mobileNav', 'pageFoot', 'BAR_CSS', 'PAGE_CSS', 'SLOT_CSS', 'TOTOP_HTML', 'TOTOP_TRACK_JS', 'cmdRoleCss',
    'SWITCHER_CSS',
];

function requireChrome(C) {
    const missing = CHROME_KEYS.filter(k => C[k] === undefined);
    if (missing.length) {
        throw new Error('commandsPage.js: buildLegalPages.js did not pass ' + missing.join(', ') +
            '. This page draws the SAME chrome as every other page by calling the same builders — ' +
            'a missing key means a second copy is about to be written, which is how the bar and the ' +
            'footer drifted apart before.');
    }
}

/** The page's own accent, the one the nav tab and the Install button wear. NOT a command colour. */
const SIGNAL = { light: '#1E6B1F', dark: '#58D05A' };

const BED = 'color-mix(in srgb,var(--ink) 6%,transparent)';
const LINE = 'color-mix(in srgb,var(--ink) 12%,transparent)';

/**
 * Which command module owns each fixed accent. Read back out of the modules' PRESET_ACCENT constants rather than copied here, so the page and the bot cannot silently stop agreeing about what colour a command is.
 */
const ACCENT_SOURCE = {
    '/help': 'help', '/invite': 'invite', '/calendar': 'calendar',
    '/draw prices': 'drawprices', '/season end': 'seasonend',
    '/patch notes': 'patchnotes', '/draws': 'draws', '/timestamp': 'timestamp',
};

/** The six that derive an accent per render, so the page can SAY so rather than invent one. */
const DERIVED = new Set(['/settings', '/colors', '/dmz', '/gunsmiths search', '/gunsmiths list', '/draw calculator']);

const REPO = path.resolve(__dirname, '..', '..');
const intToHex = n => '#' + Number(n).toString(16).toUpperCase().padStart(6, '0');

function loadAccents() {
    const out = {};
    for (const [cmd, mod] of Object.entries(ACCENT_SOURCE)) {
        const file = path.join(REPO, 'commands', mod + '.js');
        const m = fs.readFileSync(file, 'utf8').match(/PRESET_ACCENT\s*=\s*(\d+)/);
        if (!m) throw new Error('commandsPage.js: commands/' + mod + '.js has no PRESET_ACCENT for ' + cmd +
            '. The page reads the bot\'s own constant so the two cannot drift; if the command genuinely ' +
            'stopped having a fixed colour, move it into DERIVED instead of hardcoding a hex here.');
        out[cmd] = intToHex(m[1]);
    }
    return out;
}

/**
 * The seven weapon-category accents, read out of utils/loadoutRender.js's MP_CATEGORY_ACCENT.
 *
 * These are the colours /gunsmiths and /dmz actually answer in — the bot looks a weapon's own category up in this exact map at render time. They are why the "derived" commands are not colourless: their colour is real, it just is not fixed. Keyed by the uppercase category string, which is also verbatim what /gunsmiths list offers as its `scope` choices, so a scope pill can be tinted with the colour that choice will genuinely produce.
 */
function loadCategoryAccents() {
    const src = fs.readFileSync(path.join(REPO, 'utils', 'loadoutRender.js'), 'utf8');
    const block = src.match(/const MP_CATEGORY_ACCENT\s*=\s*\{([\s\S]*?)\}/);
    if (!block) throw new Error('commandsPage.js: utils/loadoutRender.js no longer declares MP_CATEGORY_ACCENT. ' +
        'The page reads it so the six derived commands can show their REAL possible colours rather than a ' +
        'hollow dot. If the map moved, point this at its new home — do not paste the hexes in here.');
    const out = {};
    for (const m of block[1].matchAll(/(\w+)\s*:\s*(\d+)/g)) out[m[1].toUpperCase()] = intToHex(m[2]);
    if (Object.keys(out).length < 5) throw new Error('commandsPage.js: parsed only ' + Object.keys(out).length +
        ' weapon-category accents out of MP_CATEGORY_ACCENT. That map is the whole basis of the derived-colour ' +
        'treatment, so a near-empty parse is a silent downgrade to the hollow dot this replaced.');
    return out;
}

/* Both grounds a borrowed colour has to survive, one per theme, and they are NOT the same
   surface. Dark --raised #241F30 is LIGHTER than dark --desk #16131B; light --desk #E7E4EC is
   DARKER than light --raised #EEECF2. Solving both against --desk once put three colours at
   4.00-4.08 on the panel they are actually painted on while reporting 4.60-4.69 and passing. */
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

/**
 * The nearest version of `hex` clearing `target` against `ground`, moving lightness only.
 *
 * ⚠️ KEPT, BUT NO LONGER USED FOR HEADINGS. It is the honest tool for one job — a HAIRLINE or a small mark that must read against the page and has no fill of its own — and the wrong tool for body text, which is what it was doing. Walking gold down 31 points of lightness clears 4.5:1 and produces brown; the ratio passes and the recognition it existed to serve is gone. Text that has to be the accent gets solveOn() instead, below.
 */
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
 * The foreground to print ON a solid fill of `hex` — near-black or near-white, whichever reads better.
 *
 * This is the whole colour strategy in one function, and unlike the one it replaces it CANNOT FAIL. Solve the crossover — the fill where black and white are equally bad — and it sits at relative luminance 0.1791, where the better of the two still measures 4.58:1. Every fill in existence is at least that legible. Solving the accent into a text colour against a fixed ground had no such floor, which is why it was quietly producing brown. A hue used as a FILL keeps every bit of its identity, and the only question left is which of two inks sits on it. That question has a right answer, it never muddies, and it is the same answer in both themes because the fill is the same colour in both themes. Contrast is solved once, at the boundary, instead of being smeared across every piece of text the accent touches.
 */
/* ⚠️ PURE BLACK, not the site's near-black --ink. The guarantee below is what makes this
   whole approach safe, and it is sensitive to exactly this: with #16131B the worst-case
   fill clears only 4.27:1, and CP Emerald #1F8A5E measured 4.33 (white) / 4.25 (near-black)
   — the one fill in the palette that fell in the gap. With pure black the floor rises to
   4.58 and #1F8A5E clears at 4.86. This ink is only ever printed ON an accent fill, never
   on a page surface, so it does not touch the site's own ink scale. */
const INK_ON_LIGHT = '#000000';
const INK_ON_DARK = '#FFFFFF';
function solveOn(hex) {
    return ratio(INK_ON_DARK, hex) >= ratio(INK_ON_LIGHT, hex) ? INK_ON_DARK : INK_ON_LIGHT;
}

/**
 * The inline custom properties one command carries everywhere it appears.
 *
 * --cc  the raw accent, used ONLY as a fill or a mark --con the ink that prints on top of that fill --ct / --ctl  a text-safe variant per theme, kept for HAIRLINES and small marks only
 *
 * ⚠️ BOTH text-safe values are emitted and the STYLESHEET picks between them into --ci. An inline style beats every stylesheet rule, so a single inline --ct could never be corrected for light theme — which is precisely the 1.69:1 failure this page shipped once already.
 */
function colourVars(cmdPath, accents, fallback) {
    const raw = accents[cmdPath] || fallback;
    if (!raw) return '--cc:var(--ink3);--con:var(--desk);--ct:var(--ink2);--ctl:var(--ink2)';
    return '--cc:' + raw + ';--con:' + solveOn(raw) +
        ';--ct:' + solveText(raw, GROUND_DARK) + ';--ctl:' + solveText(raw, GROUND_LIGHT);
}

/**
 * The neutral a derived command wears until it is told otherwise. It is a REAL colour, not var(--ink3): the previous page gave derived commands an ink token as their accent, so a selected chip tinted with it came out grey and read as unselected sitting beside a command whose chips tinted properly. "Blatant inconsistency in design", and correctly so.
 */
const DERIVED_NEUTRAL = '#7A6E8C';

const RECEIVER_CSS = `
/* Page-scoped. Every selector is prefixed rx- so nothing can collide with the shared
   chrome, which this page draws from the same builders as every other page. */

/* ── THE HEAD ──────────────────────────────────────────────────────────────────
   Two lines and the rail. The previous version opened with a display title, a
   two-line serif lede and ~45% of the band empty beside them, then changed shape
   into a full-width instrument further down; on a phone that cost 320px before
   anything you could act on. The kicker also started on the exact pixel the fixed
   bar ended, because .bar is 54px tall and .page pads 54px — no clearance at all. */
.rx-top{padding-top:1.4rem}
.rx-kick{margin:0;font-family:var(--mono);font-size:.72rem;letter-spacing:.14em;
  text-transform:uppercase;color:var(--ink3)}
.rx-kick i{font-style:normal;color:var(--accent)}
.rx-h1{margin:.35rem 0 0;font-family:var(--display);font-size:clamp(1.9rem,5vw,2.7rem);
  font-weight:800;letter-spacing:-.03em;line-height:1}
.rx-sub{margin:.5rem 0 0;font-family:var(--serif);font-size:1.02rem;color:var(--ink2);max-width:46ch}
.rx-sub em{font-style:italic;color:var(--ink)}

/* ── THE RAIL ──────────────────────────────────────────────────────────────────
   Fourteen commands as one strip. It WRAPS into grouped rows when there is width
   and SCROLLS horizontally when there is not, but it is the same element in the
   same place either way — the thing the previous design got wrong was having two
   unrelated layouts and only designing one of them. Its first chip is the way
   back to the landing state, which :target cannot otherwise provide. */
.rx-rail{position:sticky;top:54px;z-index:30;margin:1.3rem 0 0;padding:.7rem 0 .6rem;
  background:color-mix(in srgb,var(--desk) 92%,transparent);backdrop-filter:blur(10px)}
.rx-scroll{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center}
.rx-sep{width:1px;height:18px;background:${LINE};margin:0 .35rem;flex:none}
.rx-gl{flex:none;font-family:var(--mono);font-size:.62rem;letter-spacing:.14em;
  text-transform:uppercase;color:var(--ink3);padding:0 .5rem 0 .7rem;white-space:nowrap;
  border-left:1px solid ${LINE};margin-left:.25rem;line-height:1.9}
.rx-scroll > .rx-gl:first-of-type{border-left:0}
.rx-chip{display:inline-flex;align-items:center;gap:.45rem;flex:none;
  padding:.42rem .7rem;border-radius:999px;border:1px solid ${LINE};background:${BED};
  font-family:var(--mono);font-size:.8rem;color:var(--ink2);text-decoration:none;
  white-space:nowrap;transition:background .18s ease,border-color .18s ease,color .18s ease}
.rx-chip:hover{color:var(--ink);border-color:color-mix(in srgb,var(--cc) 55%,transparent)}
.rx-chip.on{background:var(--cc);border-color:var(--cc);color:var(--con);font-weight:600}
.rx-chip.on .rx-dot{background:var(--con);border-color:var(--con)}
.rx-chip:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.rx-dot{width:8px;height:8px;border-radius:50%;background:var(--cc);flex:none;
  transition:background .18s ease}
/* The derived six. A conic sweep of the seven REAL weapon-category accents says
   "many", where the hollow outline it replaces said "missing". */
.rx-dot.rx-drv{background:var(--sweep)}
.rx-home-chip{font-weight:600}
.rx-home-chip .rx-dot{background:none;border:1.5px solid var(--ink3)}

/* ── THE STAGE ─────────────────────────────────────────────────────────────── */
/* NO min-height. It was 60vh, to stop the footer moving when you switch commands — and it
   bought that by leaving a void under every short panel, which is the "literally wtf is this
   spacing" the previous version was pulled up on. A page that is short when its content is
   short is the correct behaviour; a stable footer is not worth a screenful of nothing. */
.rx-stage{margin:1.1rem 0 0}
.rx-p{display:none}
.rx-p:target{display:block}
.rx-home{display:block}
.rx-p:target ~ .rx-home{display:none}
.rx-p:focus{outline:none}

.rx-card{position:relative;overflow:hidden;border-radius:16px;background:var(--raised);
  border:1px solid color-mix(in srgb,var(--ink) 8%,transparent);
  padding:1.5rem 1.6rem 1.7rem 1.9rem}
/* The accent rule runs down the LEFT edge, which is where Discord puts it. It was
   across the top, and the page was asked why, given it is imitating an embed. */
.rx-card::before{content:"";position:absolute;inset:0 auto 0 0;width:4px;background:var(--cc)}
.rx-card::after{content:"";position:absolute;right:-90px;top:-90px;width:280px;height:280px;
  border-radius:50%;background:var(--cc);opacity:.12;filter:blur(60px);pointer-events:none}

.rx-eyebrow{margin:0;font-family:var(--mono);font-size:.7rem;letter-spacing:.16em;
  text-transform:uppercase;color:var(--ink3)}
/* The command name is a FILLED TOKEN, not coloured text — the same object Discord
   draws for a command mention, and the reason the accent never has to be bent into
   a text colour to be recognisable. */
.rx-name{display:inline-flex;align-items:center;margin:.5rem 0 0;padding:.3rem .62rem;
  border-radius:8px;background:var(--cc);color:var(--con);
  font-family:var(--mono);font-size:1.22rem;font-weight:600;letter-spacing:-.01em}
.rx-why{margin:.75rem 0 0;font-family:var(--serif);font-size:1.06rem;line-height:1.5;
  color:var(--ink);max-width:52ch}

/* ── THE LINE ──────────────────────────────────────────────────────────────────
   The artifact. It is built from the command's OPTION LIST, so every option holds a
   permanent seat and a required one can never fall out of it. On a wide screen it
   sticks under the rail; on a phone it pins to the bottom of the viewport, because
   measured on the previous design the line sat at y=1339 on a 812px-tall screen —
   the one thing the reader came for was the last thing on the page. */
.rx-bar{position:sticky;top:calc(54px + 3.3rem);z-index:20;margin:1.2rem 0 0;
  display:flex;align-items:center;gap:.6rem;padding:.6rem .7rem;border-radius:12px;
  background:color-mix(in srgb,var(--raised) 94%,var(--ink) 6%);
  border:1px solid color-mix(in srgb,var(--cc) 34%,transparent)}
.rx-line{flex:1;min-width:0;overflow-x:auto;display:flex;align-items:center;gap:.34rem;
  font-family:var(--mono);font-size:.86rem;scrollbar-width:none;padding:.1rem 0}
.rx-line::-webkit-scrollbar{display:none}
.rx-cmd{flex:none;padding:.2rem .44rem;border-radius:5px;background:var(--cc);color:var(--con);
  font-weight:600}
.rx-tok{flex:none;display:inline-flex;align-items:stretch;border-radius:5px;overflow:hidden;
  transition:opacity .18s ease}
.rx-tok .rx-o{padding:.2rem .4rem;background:color-mix(in srgb,var(--ink) 12%,transparent);
  color:var(--ink2)}
.rx-tok .rx-v{padding:.2rem .44rem;background:color-mix(in srgb,var(--cc) 26%,transparent);
  color:var(--ink);font-weight:500}
/* An option with no value still shows. Optional reads as a quiet dashed ghost;
   required reads as a gap that WANTS something, in the command's own colour. */
.rx-tok[data-state=empty]{opacity:.55}
.rx-tok[data-state=empty] .rx-o{background:none;border:1px dashed ${LINE};border-radius:5px}
.rx-tok[data-state=need]{opacity:1}
.rx-tok[data-state=need] .rx-o{background:none;color:var(--ci);
  border:1px dashed color-mix(in srgb,var(--cc) 70%,transparent);border-radius:5px}
.rx-copy{flex:none;font-family:var(--mono);font-size:.74rem;letter-spacing:.06em;
  text-transform:uppercase;padding:.5rem .8rem;border-radius:8px;cursor:pointer;
  border:1px solid ${LINE};background:${BED};color:var(--ink2);
  transition:background .18s ease,color .18s ease,border-color .18s ease}
.rx-copy:hover{color:var(--ink);border-color:color-mix(in srgb,var(--cc) 60%,transparent)}
.rx-copy[data-done]{background:var(--cc);border-color:var(--cc);color:var(--con)}
.rx-copy[aria-disabled=true]{opacity:.45;cursor:not-allowed}
.rx-copy:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

/* ── THE SLOTS ─────────────────────────────────────────────────────────────────
   Required first and always open, because it is the one that has to be filled.
   Optional slots are a native <details>, which collapses a 348px timezone list to a
   44px row, works with scripting off, and is keyboard-operable without any help. */
.rx-slots{margin:1.3rem 0 0;display:flex;flex-direction:column;gap:.5rem}
.rx-slot{border-radius:11px;border:1px solid ${LINE};background:${BED}}
.rx-slot[open]{border-color:color-mix(in srgb,var(--cc) 34%,transparent)}
.rx-sum{display:flex;align-items:center;gap:.6rem;padding:.7rem .85rem;cursor:pointer;
  list-style:none;min-height:44px}
.rx-sum::-webkit-details-marker{display:none}
.rx-sum:focus-visible{outline:2px solid var(--accent);outline-offset:-2px;border-radius:11px}
.rx-caret{width:9px;height:9px;flex:none;border-right:1.5px solid var(--ink3);
  border-bottom:1.5px solid var(--ink3);transform:rotate(-45deg);margin-left:auto;
  transition:transform .2s ease}
.rx-slot[open] .rx-caret{transform:rotate(45deg)}
.rx-lab{font-family:var(--mono);font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;
  color:var(--ink2);flex:none}
.rx-cur{font-family:var(--mono);font-size:.8rem;color:var(--ink3);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.rx-cur[data-set]{color:var(--ink)}
.rx-body{padding:0 .85rem .85rem}
/* The option's blurb lives in the OPEN body, not on the summary row. On the summary it sat
   beside the label and was ellipsised to "Yours, if it is not yo…", which is a sentence
   truncated into nonsense; the row's job there is to say what is CHOSEN. */
.rx-takes{margin:0 0 .55rem;font-family:var(--serif);font-size:.94rem;color:var(--ink2)}

/* The required slot is not a <details> and not a read-only block. It is an INPUT.
   It was a bordered read-only box with a REQUIRED badge, which every convention on
   the web reads as disabled — so the one control that actually mattered was the one
   control you could not touch, on a page whose whole offer is "try the command". */
.rx-req{border-color:color-mix(in srgb,var(--cc) 40%,transparent);
  background:color-mix(in srgb,var(--cc) 7%,transparent)}
.rx-head{display:flex;align-items:center;gap:.5rem;padding:.7rem .85rem .1rem}
.rx-need{font-family:var(--mono);font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;
  padding:.1rem .34rem;border-radius:4px;background:var(--cc);color:var(--con)}
.rx-in{display:block;width:100%;box-sizing:border-box;margin:.5rem 0 0;padding:.62rem .7rem;
  min-height:44px;border-radius:9px;border:1px solid color-mix(in srgb,var(--cc) 45%,transparent);
  background:var(--desk);color:var(--ink);font-family:var(--mono);font-size:.92rem}
.rx-in:focus{outline:none;border-color:var(--cc);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--cc) 22%,transparent)}
.rx-in::placeholder{color:var(--ink3)}
.rx-egs{display:flex;flex-wrap:wrap;gap:.32rem;margin:.5rem 0 0}
.rx-eg{font-family:var(--mono);font-size:.74rem;padding:.3rem .5rem;min-height:32px;
  border-radius:6px;border:1px dashed ${LINE};background:none;color:var(--ink3);cursor:pointer}
.rx-eg:hover{color:var(--ink);border-style:solid;
  border-color:color-mix(in srgb,var(--cc) 55%,transparent)}
.rx-eg:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

.rx-vals{display:flex;flex-wrap:wrap;gap:.34rem}
.rx-pill{font-family:var(--mono);font-size:.78rem;text-align:left;padding:.42rem .6rem;
  min-height:36px;border-radius:7px;cursor:pointer;color:var(--ink2);background:${BED};
  border:1px solid ${LINE};transition:background .16s ease,border-color .16s ease,color .16s ease}
.rx-pill:hover{color:var(--ink);border-color:color-mix(in srgb,var(--cc) 55%,transparent)}
.rx-pill[aria-pressed=true]{background:var(--cc);border-color:var(--cc);color:var(--con);font-weight:600}
.rx-pill:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.rx-hint{display:block;font-size:.68rem;opacity:.72;margin-top:.12rem}
/* "Show all 11" was a bare underlined link wedged into the chip row — a different
   shape, weight and colour to everything beside it. It is now the last chip. */
.rx-more{font-family:var(--mono);font-size:.78rem;padding:.42rem .6rem;min-height:36px;
  border-radius:7px;cursor:pointer;color:var(--ink3);background:none;
  border:1px dashed ${LINE}}
.rx-more:hover{color:var(--ink);border-style:solid}
.rx-more:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.rx-bare{margin:1.2rem 0 0;font-family:var(--serif);font-size:1rem;color:var(--ink2)}

/* The one-line footnote each panel carries. It used to be a LINK to a guide inside
   the home panel — following it un-targeted the panel, so the only route back to the
   landing state was a link that appeared to be about privacy, and taking it silently
   threw away the command you were reading. The fact is one sentence; it is stated. */
.rx-foot{margin:1.1rem 0 0;padding-top:.9rem;border-top:1px solid ${LINE};
  font-family:var(--mono);font-size:.74rem;color:var(--ink3);line-height:1.6}
.rx-foot b{font-weight:400;color:var(--ink2)}

.rx-live{margin:.9rem 0 0;font-family:var(--serif);font-size:.98rem;color:var(--ink2)}
.rx-live b{font-family:var(--mono);font-size:.85rem;font-weight:500;color:var(--ink);
  padding:.12rem .36rem;border-radius:4px;background:color-mix(in srgb,var(--cc) 22%,transparent)}
.rx-tzbtn{font-family:var(--mono);font-size:.74rem;padding:.34rem .56rem;margin-left:.3rem;
  border-radius:6px;cursor:pointer;border:1px solid color-mix(in srgb,var(--cc) 55%,transparent);
  background:none;color:var(--ink2)}
.rx-tzbtn:hover{background:var(--cc);color:var(--con);border-color:var(--cc)}
.rx-tzbtn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

/* ── THE HOME STATE ────────────────────────────────────────────────────────────
   ONE object, not three stacked ones. It was an ask grid, then a visibility guide,
   then an install guide, with no hierarchy between them — "I'm genuinely so lost by
   wtf this card/page is even supposed to be". The asks are the home state; the two
   facts that used to be guides are now a line in each panel and a small object of
   their own respectively. */
.rx-home h2{margin:0;font-family:var(--display);font-size:1.3rem;font-weight:700;
  letter-spacing:-.02em}
.rx-lead{margin:.4rem 0 1.1rem;font-family:var(--serif);font-size:1rem;color:var(--ink2)}
.rx-asks{display:grid;grid-template-columns:repeat(auto-fill,minmax(20rem,1fr));gap:.1rem 2rem}
/* They ARE links and now they look like it. They had no underline, ink2 text and no
   arrow — "apparently those are supposed to be links but none of them feel that way". */
.rx-ask{display:flex;align-items:center;gap:.7rem;padding:.72rem .5rem .72rem .1rem;
  min-height:44px;text-decoration:none;border-bottom:1px solid ${LINE};
  transition:padding-left .16s ease}
.rx-ask:hover{padding-left:.5rem}
.rx-ask span{flex:1;font-family:var(--serif);font-size:1rem;color:var(--ink)}
.rx-ask em{font-family:var(--mono);font-style:normal;font-size:.74rem;color:var(--ink3);flex:none}
.rx-ask i{width:7px;height:7px;border-radius:50%;background:var(--cc);flex:none}
.rx-ask i.rx-drv{background:var(--sweep)}
.rx-ask:hover em{color:var(--ink2)}
.rx-ask:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:5px}

/* User-install vs guild-install is genuinely the confusing part of adding a bot, and
   it was two flat text cards. It is now a switch you throw, so the difference is
   something you DO rather than a paragraph you parse. */
.rx-inst{margin:1.8rem 0 0;padding:1.1rem 1.2rem;border-radius:13px;border:1px solid ${LINE};
  background:${BED}}
.rx-inst h3{margin:0;font-family:var(--display);font-size:1rem;font-weight:700}
.rx-toggle{display:inline-flex;margin:.8rem 0 0;padding:3px;border-radius:999px;
  background:color-mix(in srgb,var(--ink) 9%,transparent);gap:2px}
.rx-toggle button{font-family:var(--mono);font-size:.76rem;padding:.42rem .8rem;min-height:36px;
  border:0;border-radius:999px;background:none;color:var(--ink3);cursor:pointer;
  transition:background .2s ease,color .2s ease}
.rx-toggle button[aria-pressed=true]{background:var(--accent);color:var(--accent-on)}
.rx-toggle button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.rx-instbody{margin:.85rem 0 0;font-family:var(--serif);font-size:1rem;color:var(--ink);
  min-height:3.2em}
.rx-instbody b{display:block;font-family:var(--mono);font-size:.76rem;font-weight:500;
  letter-spacing:.06em;text-transform:uppercase;color:var(--ink3);margin-bottom:.3rem}

.rx-none{margin:.7rem 0 0;font-family:var(--mono);font-size:.76rem;color:var(--ink3)}
.rx-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

/* ── MOTION ────────────────────────────────────────────────────────────────────
   Three moments, not scattered effects: the panel arrives, a value lands in the
   line, and the rail chip it came from takes the colour. Everything here is inside
   the no-preference guard, so a reader who has asked for stillness gets the page
   with no motion at all rather than a reduced version of it. */
/* 🔴 FILL-MODE IS "backwards", NEVER "both", AND THAT IS LOAD-BEARING, NOT STYLE.
   An animation filling FORWARDS leaves its final keyframe applied as a computed value, and
   a final keyframe of "transform:none" computes to the IDENTITY MATRIX rather than to none.
   A transform of any kind — identity included — makes the element a containing block for
   every fixed-position descendant, so .rx-bar stopped being pinned to the viewport on a
   phone and was found rendering at top:1268px in an 812px window: position:fixed, painted
   nowhere anyone could see it. Measured, not theorised — getComputedStyle(.rx-card).transform
   read "matrix(1, 0, 0, 1, 0, 0)". Every keyframe here ENDS at the element's natural state, so
   releasing the fill costs nothing and keeps the card out of the containing-block business.
   The same trap is why TOTOP_HTML sits outside .page; see its comment below. */
@media (prefers-reduced-motion:no-preference){
  /* 🔴 .rx-card ITSELF ANIMATES OPACITY ONLY — NEVER A TRANSFORM. It contains .rx-bar, which
     is position:fixed on a phone, and a transform of ANY value (including the identity matrix
     that a final keyframe of "transform: none" computes to) makes its element a containing block for
     every fixed descendant. With translateY on the card the pinned line was measured at
     top:1268px in an 812px window — painted, correct in the source, and off screen. Filling
     "backwards" released it after 300ms but did NOT fix it DURING, so every command switch
     threw the line off screen for the length of the animation. The arrival motion therefore
     lives on the heading block and on the rule, neither of which has a fixed descendant. */
  .rx-p:target .rx-card{animation:rx-fade .26s ease backwards}
  .rx-p:target .rx-card::before{animation:rx-wipe .42s cubic-bezier(.2,.7,.3,1) backwards}
  .rx-p:target .rx-eyebrow,.rx-p:target .rx-name,.rx-p:target .rx-why{
    animation:rx-in .34s cubic-bezier(.2,.7,.3,1) backwards}
  .rx-p:target .rx-name{animation-delay:.04s}
  .rx-p:target .rx-why{animation-delay:.08s}
  .rx-tok.rx-land{animation:rx-land .22s cubic-bezier(.2,.8,.3,1)}
  .rx-slot[open] .rx-body{animation:rx-open .22s ease backwards}
}
@keyframes rx-fade{from{opacity:0}to{opacity:1}}
@keyframes rx-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes rx-wipe{from{transform:scaleY(0);transform-origin:top}to{transform:scaleY(1)}}
@keyframes rx-land{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
@keyframes rx-open{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}

/* ── NARROW ────────────────────────────────────────────────────────────────────
   The rail becomes ONE horizontally scrolling row — 52px instead of the 855px the
   previous index cost — and the line leaves the flow and pins to the bottom of the
   viewport, so it is on screen from the moment the panel opens. */
@media (max-width:900px){
  .rx-top{padding-top:1rem}
  .rx-sub{font-size:.96rem}
  .rx-rail{margin-top:1rem;padding:.55rem 0;
    top:calc(54px + env(safe-area-inset-top,0px))}
  .rx-scroll{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;
    scroll-snap-type:x proximity;padding-bottom:.15rem}
  .rx-scroll::-webkit-scrollbar{display:none}
  .rx-chip{scroll-snap-align:start;min-height:44px}
  .rx-gl{font-size:.58rem;padding:0 .4rem 0 .55rem}
  .rx-card{padding:1.2rem 1.1rem 1.3rem 1.4rem;border-radius:14px}
  .rx-why{font-size:1rem}
  .rx-asks{grid-template-columns:minmax(0,1fr);gap:0}
  /* The line leaves the document flow. .rx-floor below reserves its height so the
     last slot is never trapped underneath it. */
  .rx-bar{position:fixed;left:.6rem;right:.6rem;bottom:calc(.6rem + env(safe-area-inset-bottom,0px));
    top:auto;margin:0;border-radius:13px;
    box-shadow:0 6px 26px color-mix(in srgb,#000 42%,transparent)}
  .rx-p:not(:target) .rx-bar{display:none}
  .rx-floor{padding-bottom:5.6rem}
}
/* WCAG 2.5.5. Applied on POINTER, not on width — a coarse pointer is the thing that makes a
   36px target hard to hit, and a narrow window on a mouse is not the same situation. Verified
   with the media query actually matching, so the pass is not vacuous. */
@media (pointer:coarse){
  .rx-chip,.rx-pill,.rx-more,.rx-eg,.rx-copy,.rx-tzbtn,.rx-toggle button{min-height:44px}
  .rx-ask{min-height:48px}
  .rx-sum{min-height:48px}
}
@media (max-width:520px){
  .rx-name{font-size:1.05rem}
  .rx-line{font-size:.8rem}
}
`;

const RECEIVER_JS = [
    '(function(){',
    '  var bench=document.getElementById("rx-bench"); if(!bench) return;',
    '  var panels=[].slice.call(document.querySelectorAll(".rx-p"));',
    '  var chips=[].slice.call(document.querySelectorAll(".rx-chip[data-for]"));',
    '',
    '  function span(cls,txt){ var s=document.createElement("span"); s.className=cls; s.textContent=txt; return s; }',
    '',
    '  /* Every option keeps its seat in the line. This is the whole fix for the bug where',
    '     a required free-text option vanished the moment anything else was touched: the',
    '     loop walks the SLOTS, never the picked set, so an unfilled option renders as a',
    '     visible gap and the reader is told what is missing instead of handed a command',
    '     Discord will reject. */',
    '  function paint(p,landed){',
    '    var line=p.querySelector(".rx-line"); if(!line) return;',
    '    var btn=p.querySelector(".rx-copy");',
    '    line.textContent="";',
    '    line.appendChild(span("rx-cmd",p.getAttribute("data-cmd")));',
    '    var plain=p.getAttribute("data-cmd"), missing=null;',
    '    [].slice.call(p.querySelectorAll("[data-opt]")).forEach(function(o){',
    '      var name=o.getAttribute("data-opt"), val=value(o), req=o.getAttribute("data-req")==="1";',
    '      var tok=document.createElement("span");',
    '      tok.className="rx-tok"+(landed===name?" rx-land":"");',
    '      tok.setAttribute("data-state", val?"filled":(req?"need":"empty"));',
    '      tok.appendChild(span("rx-o",name));',
    '      if(val){ tok.appendChild(span("rx-v",val)); plain+=" "+name+" "+val; }',
    '      else if(req && !missing) missing=name;',
    '      line.appendChild(tok);',
    '    });',
    '    if(btn){',
    '      btn.removeAttribute("data-done");',
    '      btn.textContent=missing?"Needs "+missing:"Copy";',
    '      btn.setAttribute("aria-disabled",missing?"true":"false");',
    '      btn.setAttribute("aria-label",missing?("Fill "+missing+" before copying"):("Copy "+plain));',
    '      btn.setAttribute("data-plain",plain);',
    '    }',
    '    if(landed) line.scrollLeft=line.scrollWidth;',
    '  }',
    '',
    '  function value(slot){',
    '    var input=slot.querySelector(".rx-in");',
    '    if(input) return input.value.trim();',
    '    var on=slot.querySelector(".rx-pill[aria-pressed=true]");',
    '    return on?on.getAttribute("data-val"):"";',
    '  }',
    '',
    '  /* The summary line of a collapsed slot has to say what is in it, or collapsing the',
    '     slot would hide the answer the reader just chose. */',
    '  function summarise(slot){',
    '    var cur=slot.querySelector(".rx-cur"); if(!cur) return;',
    '    var v=value(slot);',
    '    cur.textContent=v||cur.getAttribute("data-empty");',
    '    if(v) cur.setAttribute("data-set","1"); else cur.removeAttribute("data-set");',
    '  }',
    '',
    '  /* /gunsmiths list answers in the colour of the CATEGORY you asked for. The scope',
    '     choices are the same uppercase strings utils/loadoutRender.js keys its accent map',
    '     by, so the panel can adopt the colour the bot will genuinely reply in. This is the',
    '     page demonstrating "its colour comes from what you asked for" instead of asserting',
    '     it, and it is the reason the six derived commands stopped looking unfinished. */',
    '  function retint(p,slot){',
    '    var map=p.getAttribute("data-tint"); if(!map) return;',
    '    var on=slot.querySelector(".rx-pill[aria-pressed=true]");',
    '    var table=JSON.parse(map), key=on?on.getAttribute("data-val").toUpperCase():"";',
    '    var pair=table[key];',
    '    if(pair){ p.style.setProperty("--cc",pair[0]); p.style.setProperty("--con",pair[1]); }',
    '    else { p.style.removeProperty("--cc"); p.style.removeProperty("--con"); }',
    '  }',
    '',
    '  panels.forEach(function(p){',
    '    var tintSlot=p.getAttribute("data-tint-opt");',
    '    [].slice.call(p.querySelectorAll(".rx-pill")).forEach(function(b){',
    '      b.addEventListener("click",function(){',
    '        var slot=b.closest("[data-opt]"), was=b.getAttribute("aria-pressed")==="true";',
    '        /* Clicking the chosen pill of a REQUIRED option does not clear it. There is no',
    '           such thing as a valid empty required option, so offering the reader a way into',
    '           that state would only ever produce a command Discord rejects. */',
    '        var req=slot.getAttribute("data-req")==="1";',
    '        [].slice.call(slot.querySelectorAll(".rx-pill")).forEach(function(x){ x.setAttribute("aria-pressed","false"); });',
    '        if(!was || req) b.setAttribute("aria-pressed","true");',
    '        summarise(slot);',
    '        if(tintSlot && slot.getAttribute("data-opt")===tintSlot) retint(p,slot);',
    '        paint(p,slot.getAttribute("data-opt"));',
    '      });',
    '    });',
    '    [].slice.call(p.querySelectorAll(".rx-in")).forEach(function(i){',
    '      i.addEventListener("input",function(){ paint(p,null); });',
    '    });',
    '    [].slice.call(p.querySelectorAll(".rx-eg")).forEach(function(e){',
    '      e.addEventListener("click",function(){',
    '        var input=p.querySelector(".rx-in"); if(!input) return;',
    '        input.value=e.getAttribute("data-val"); input.focus();',
    '        paint(p,input.closest("[data-opt]").getAttribute("data-opt"));',
    '      });',
    '    });',
    '    [].slice.call(p.querySelectorAll(".rx-more")).forEach(function(m){',
    '      m.addEventListener("click",function(){',
    '        var box=m.parentNode, open=m.getAttribute("data-open")==="1";',
    '        [].slice.call(box.querySelectorAll(".rx-pill")).forEach(function(x,i){',
    '          if(i>=Number(m.getAttribute("data-visible"))) x.hidden=open;',
    '        });',
    '        m.setAttribute("data-open",open?"0":"1");',
    '        m.textContent=open?m.getAttribute("data-label"):"Show fewer";',
    '      });',
    '    });',
    '    var btn=p.querySelector(".rx-copy");',
    '    if(btn) btn.addEventListener("click",function(){',
    '      if(btn.getAttribute("aria-disabled")==="true"){',
    '        var input=p.querySelector(".rx-in"); if(input) input.focus();',
    '        return;',
    '      }',
    '      var text=btn.getAttribute("data-plain")||"";',
    '      if(navigator.clipboard) navigator.clipboard.writeText(text)["catch"](function(){});',
    '      btn.textContent="Copied"; btn.setAttribute("data-done","1");',
    '    });',
    '    [].slice.call(p.querySelectorAll("[data-opt]")).forEach(summarise);',
    '    paint(p,null);',
    '  });',
    '',
    '  /* CSS cannot reach backward from a :target to the link pointing at it, so the rail',
    '     marks its own active chip. With scripting off the panel itself is still obviously',
    '     the answer — this is a nicety, not the mechanism. */',
    '  function mark(){',
    '    var id=location.hash.slice(1);',
    '    chips.forEach(function(c){',
    '      var on=c.getAttribute("data-for")===id;',
    '      c.classList.toggle("on",on);',
    '      if(on){ c.setAttribute("aria-current","true"); if(c.scrollIntoView) c.scrollIntoView({block:"nearest",inline:"center"}); }',
    '      else c.removeAttribute("aria-current");',
    '    });',
    '    var home=document.getElementById("rx-homechip");',
    '    if(home) home.classList.toggle("on",!document.querySelector(".rx-p:target"));',
    '  }',
    '  addEventListener("hashchange",mark); mark();',
    '',
    '  /* Escape returns to the landing state. :target has no native un-target, and a reader',
    '     who has opened a command has no other keyboard route back. */',
    '  addEventListener("keydown",function(e){',
    '    if(e.key!=="Escape") return;',
    '    if(!document.querySelector(".rx-p:target")) return;',
    '    if(document.activeElement && document.activeElement.tagName==="INPUT") return;',
    '    /* 🔴 location.hash, NOT history.pushState. pushState changes the URL without',
    '       performing a navigation, so :target does NOT update and the panel stayed open —',
    '       the key appeared to do nothing. Setting the hash is a same-document navigation:',
    '       it clears :target, fires hashchange, and does not reload, so anything the reader',
    '       has typed into the panel survives. */',
    '    location.hash="";',
    '  });',
    '',
    '  /* Search filters the RAIL. It matches the command, what it does, its option NAMES and',
    '     its choice LABELS, so "timezone" finds /timestamp and "nameplate" finds /colors.',
    '     ⚠️ It also matches a hand-written KEYWORD set, because matching only what the bot',
    '     declares meant "loadout" returned /gunsmiths search alone while /gunsmiths list and',
    '     /dmz — both entirely about loadouts — did not match at all. */',
    '  var q=document.getElementById("rx-q"), count=document.getElementById("rx-count");',
    '  function filter(){',
    '    var v=q.value.trim().toLowerCase(), hits=0;',
    '    chips.forEach(function(c){',
    '      var on=!v||(c.getAttribute("data-find")||"").toLowerCase().indexOf(v)>-1;',
    '      c.hidden=!on; if(on) hits++;',
    '    });',
    '    [].slice.call(document.querySelectorAll(".rx-sep")).forEach(function(s){ s.hidden=!!v; });',
    '    count.textContent=!v?"":(hits?hits+" of "+chips.length+" match":"Nothing matches "+q.value.trim());',
    '  }',
    '  if(q){ q.addEventListener("input",filter); filter(); }',
    '',
    '  /* The install switch. Two states, one body — the difference is something you throw',
    '     rather than two cards you compare. */',
    '  var tog=document.getElementById("rx-toggle");',
    '  if(tog){',
    '    var body=document.getElementById("rx-instbody");',
    '    [].slice.call(tog.querySelectorAll("button")).forEach(function(b){',
    '      b.addEventListener("click",function(){',
    '        [].slice.call(tog.querySelectorAll("button")).forEach(function(x){ x.setAttribute("aria-pressed","false"); });',
    '        b.setAttribute("aria-pressed","true");',
    '        body.innerHTML="<b>"+b.getAttribute("data-h")+"</b>"+b.getAttribute("data-b");',
    '      });',
    '    });',
    '  }',
    '',
    '  /* The reader\'s own timezone, offered rather than mentioned. Most people do not know',
    '     the IANA name of where they live, and the browser does; the previous page printed',
    '     it in a sentence and left them to find it in a fifteen-item list themselves. */',
    '  var live=document.getElementById("rx-live");',
    '  if(live && window.Intl){',
    '    try{',
    '      var zone=Intl.DateTimeFormat().resolvedOptions().timeZone;',
    '      var now=new Intl.DateTimeFormat([], {hour:"numeric",minute:"2-digit"}).format(new Date());',
    '      live.querySelector("b").textContent=now+" "+zone;',
    '      live.hidden=false;',
    '      var use=live.querySelector(".rx-tzbtn");',
    '      if(use){',
    '        var panel=live.closest(".rx-p");',
    '        var slot=panel.querySelector("[data-opt=timezone]");',
    '        var match=slot&&[].slice.call(slot.querySelectorAll(".rx-pill")).filter(function(b){',
    '          return b.getAttribute("data-val").indexOf(zone.split("/").pop())>-1;',
    '        })[0];',
    '        if(match){',
    '          use.hidden=false;',
    '          use.addEventListener("click",function(){ match.hidden=false; match.click(); });',
    '        }',
    '      }',
    '    }catch(e){}',
    '  }',
    '})();',
].join('\n');

/**
 * A few choices carry a HINT as well as a name, packed into one string because Discord has only one field for it. /timestamp's style option is the case. Only the name goes into the command line, where the example would read as part of the value.
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
   stated as one line in each panel's footnote — NOT as a link to a guide, which is what it
   was, and which un-targeted the panel and threw the reader back to the landing state. */
function isShared(command, option) {
    return Object.prototype.hasOwnProperty.call(SHARED_OPTIONS, option.name)
        && !((COMMANDS[command.path] || {}).options || {})[option.name];
}

/** Required first — that order is information, not styling. */
const ownOptions = command => command.options
    .filter(o => !isShared(command, o))
    .slice().sort((a, b) => Number(b.required) - Number(a.required));

/**
 * The required slot. Always open, never collapsed, and never read-only.
 *
 * ⚠️ IT BRANCHES ON WHETHER DISCORD ACCEPTS FREE TEXT, and the first version of this did not — it made every required option an input, including `/gunsmiths list scope`, which only accepts one of seven registered choices. That is the page inviting a reader to type something the bot will reject, and it also silently killed the category re-tint, because there were no pills for it to hang off.
 *
 * Free text gets a real input seeded with the sample the line is built from, so the line is correct and copyable with scripting off and repaints as you type with scripting on; the examples beside it are tap-to-fill rather than decoration. A fixed choice list gets pills with one already chosen, because a required option is never legitimately empty.
 *
 * Either way it is an INPUT, not a display. It used to be a bordered read-only block wearing a REQUIRED badge, which every convention on the web reads as disabled — the one control that mattered was the one control you could not touch, on a page whose whole offer is "try the command".
 */
function renderRequired(option, command, C, tints) {
    const { esc } = C;
    const entry = COMMANDS[command.path] || {};
    const takes = optionProse(command.path, option.name) || '';
    const head = '<div class="rx-head"><span class="rx-lab">' + esc(option.name) + '</span>' +
        '<span class="rx-need">needs a value</span></div>';

    if (option.choices.length) {
        const chosen = (entry.sample || {})[option.name] || splitChoice(option.choices[0]).label;
        const pills = option.choices.map((choice, i) => {
            const { label, hint } = splitChoice(choice);
            const tint = tints && tints[label.toUpperCase()];
            /* A required pill that is folded away but SELECTED would be a value the reader
               cannot see, so the chosen one is always visible whatever its position. */
            const fold = i >= VISIBLE_CHOICES && label !== chosen;
            return '<button type="button" class="rx-pill" aria-pressed="' + (label === chosen ? 'true' : 'false') +
                '" data-val="' + esc(label) + '"' +
                (tint ? ' style="--cc:' + tint + ';--con:' + solveOn(tint) + '"' : '') +
                (fold ? ' hidden' : '') + '>' + esc(label) +
                (hint ? '<span class="rx-hint">' + esc(hint) + '</span>' : '') + '</button>';
        }).join('');
        const label = '+' + (option.choices.length - VISIBLE_CHOICES) + ' more';
        const more = option.choices.length > VISIBLE_CHOICES
            ? '<button type="button" class="rx-more" data-open="0" data-visible="' + VISIBLE_CHOICES +
              '" data-label="' + esc(label) + '">' + esc(label) + '</button>'
            : '';
        return '<div class="rx-slot rx-req" data-opt="' + esc(option.name) + '" data-req="1">' + head +
            '<div class="rx-body"><div class="rx-vals">' + pills + more + '</div></div></div>';
    }

    const seed = (entry.sample || {})[option.name] || '';
    const egs = ((entry.examples || {})[option.name] || [])
        .map(e => '<button type="button" class="rx-eg" data-val="' + esc(e) + '">' + esc(e) + '</button>').join('');
    return '<div class="rx-slot rx-req" data-opt="' + esc(option.name) + '" data-req="1">' + head +
        '<div class="rx-body">' +
        '<label class="rx-sr" for="rx-' + esc(command.id) + '-' + esc(option.name) + '">' +
        esc(option.name) + ' — ' + esc(takes) + '</label>' +
        '<input class="rx-in" id="rx-' + esc(command.id) + '-' + esc(option.name) + '" type="text" ' +
        'value="' + esc(seed) + '" placeholder="' + esc(takes) + '" autocomplete="off" spellcheck="false">' +
        (egs ? '<div class="rx-egs">' + egs + '</div>' : '') +
        '</div></div>';
}

/** An optional slot: a native <details>, so a fifteen-item list costs one row until it is wanted. */
function renderOptional(option, command, C, tints) {
    const { esc } = C;
    const takes = optionProse(command.path, option.name) || '';
    let body;
    if (option.choices.length) {
        const pills = option.choices.map((choice, i) => {
            const { label, hint } = splitChoice(choice);
            const tint = tints && tints[label.toUpperCase()];
            return '<button type="button" class="rx-pill" aria-pressed="false" data-val="' + esc(label) + '"' +
                (tint ? ' style="--cc:' + tint + ';--con:' + solveOn(tint) + '"' : '') +
                (i >= VISIBLE_CHOICES ? ' hidden' : '') + '>' + esc(label) +
                (hint ? '<span class="rx-hint">' + esc(hint) + '</span>' : '') + '</button>';
        }).join('');
        const label = '+' + (option.choices.length - VISIBLE_CHOICES) + ' more';
        const more = option.choices.length > VISIBLE_CHOICES
            ? '<button type="button" class="rx-more" data-open="0" data-visible="' + VISIBLE_CHOICES +
              '" data-label="' + esc(label) + '">' + esc(label) + '</button>'
            : '';
        body = '<div class="rx-vals">' + pills + more + '</div>';
    } else {
        body = '<p class="rx-bare" style="margin:0">' + esc(takes) +
            (option.autocomplete ? ' &middot; type to search in Discord' : '') + '</p>';
    }
    return '<details class="rx-slot" data-opt="' + esc(option.name) + '" data-req="0">' +
        '<summary class="rx-sum"><span class="rx-lab">' + esc(option.name) + '</span>' +
        '<span class="rx-cur" data-empty="Not set">Not set</span>' +
        '<i class="rx-caret" aria-hidden="true"></i></summary>' +
        '<div class="rx-body">' + (takes ? '<p class="rx-takes">' + esc(takes) + '</p>' : '') +
        body + '</div></details>';
}

/**
 * The line, rendered at BUILD time so it is right with no JS at all.
 *
 * ⚠️ IT WALKS EVERY OPTION, not the ones that happen to have a value. That is the structural fix for the defect this page shipped: the client repaint built the line from the picked set, a free-text required option could never be in that set, and so the required option disappeared as soon as anything optional was chosen. An option with no value renders as a gap here for exactly the same reason it does at runtime — the reader can see what the command is still missing.
 */
function runLine(command, C) {
    const { esc } = C;
    const sample = (COMMANDS[command.path] || {}).sample || {};
    const options = ownOptions(command);
    const parts = ['<span class="rx-cmd">' + esc(command.path) + '</span>'];
    let plain = command.path, missing = null;
    for (const option of options) {
        const value = option.required
            ? (sample[option.name] || (option.choices.length ? splitChoice(option.choices[0]).label : ''))
            : '';
        const state = value ? 'filled' : (option.required ? 'need' : 'empty');
        parts.push('<span class="rx-tok" data-state="' + state + '">' +
            '<span class="rx-o">' + esc(option.name) + '</span>' +
            (value ? '<span class="rx-v">' + esc(value) + '</span>' : '') + '</span>');
        if (value) plain += ' ' + option.name + ' ' + value;
        else if (option.required && !missing) missing = option.name;
    }
    return '<div class="rx-bar">' +
        '<code class="rx-line">' + parts.join('') + '</code>' +
        '<button type="button" class="rx-copy" data-plain="' + esc(plain) + '" ' +
        'aria-disabled="' + (missing ? 'true' : 'false') + '" ' +
        'aria-label="' + (missing ? 'Fill ' + esc(missing) + ' before copying' : 'Copy ' + esc(plain)) + '">' +
        (missing ? 'Needs ' + esc(missing) : 'Copy') + '</button></div>';
}

/** One command's panel. */
function renderPanel(command, group, C, accents, cats) {
    const { esc } = C;
    const entry = COMMANDS[command.path] || {};
    const options = ownOptions(command);
    const derived = DERIVED.has(command.path);

    /* /gunsmiths list is the one command whose choice IS the thing that decides the answer's
       colour, so it is the one that can show it. The table is emitted as data rather than
       hardcoded in the script because it is read from the bot's own map at build time. */
    const tintOpt = command.path === '/gunsmiths list' ? 'scope' : '';
    const tintTable = tintOpt
        ? Object.fromEntries(Object.entries(cats).map(([k, v]) => [k, [v, solveOn(v)]]))
        : null;

    const live = command.path === '/timestamp'
        ? '<p class="rx-live" id="rx-live" hidden>Where you are it is <b></b>' +
          '<button type="button" class="rx-tzbtn" hidden>Use this timezone</button></p>'
        : '';

    /* tabindex="-1" so the fragment jump moves FOCUS into the panel, not just the viewport.
       A <section> is not focusable, so without it a keyboard or screen-reader user activates a
       command in the rail, the stage silently swaps behind them, and their focus stays on the
       link — they are told nothing changed. Same technique the shared skip link uses on <main>. */
    return '<section class="rx-p" tabindex="-1" id="' + esc(command.id) + '" ' +
        'style="' + colourVars(command.path, accents, derived ? DERIVED_NEUTRAL : null) + '" ' +
        'data-cmd="' + esc(command.path) + '"' +
        (tintOpt ? ' data-tint-opt="' + tintOpt + '" data-tint=\'' + JSON.stringify(tintTable) + '\'' : '') + '>' +
        '<div class="rx-card">' +
        '<p class="rx-eyebrow">' + esc(group.label) + '</p>' +
        '<p class="rx-name">' + esc(command.path) + '</p>' +
        '<p class="rx-why">' + esc(entry.purpose || command.description) + '</p>' +
        runLine(command, C) +
        (options.length
            ? '<div class="rx-slots">' + options.map(o => {
                const tint = tintOpt && o.name === tintOpt ? cats : null;
                return o.required ? renderRequired(o, command, C, tint) : renderOptional(o, command, C, tint);
            }).join('') + '</div>'
            : '<p class="rx-bare">No options — just run it.</p>') +
        live +
        '<p class="rx-foot">' + (derived
            ? 'Answers in a colour taken from what you asked for, so no two replies match. '
            : 'Always answers in this colour. ') +
        '<b>Public by default</b> — only you see it if you set visibility to hidden, and a server ' +
        'admin can require that Dioreo stays hidden in their server.</p>' +
        '</div></section>';
}

/**
 * Renders the whole page. `catalog` is scripts/lib/commandCatalog.js's output; `page` is the entry from buildLegalPages.js's page table.
 */
function commandsShell({ page, catalog, C }) {
    requireChrome(C);
    assertProseCoverage(catalog);
    assertAskCoverage(catalog);
    assertSearchCoverage(catalog);
    // The page table's accent and this module's own idea of the hue are two reads of one colour. They disagreed for a day and it showed on the bar; a build is the right place to find that out, not a colour picker.
    if (page.accent.toUpperCase() !== SIGNAL.dark.toUpperCase()) {
        throw new Error('commandsPage.js: TOOL_PAGES declares accent ' + page.accent + ' but SIGNAL.dark is ' +
            SIGNAL.dark + '. These feed the SAME colour by two routes — :root{--accent} and the tab\'s ' +
            'data-accent, which the nav paints its indicator from — so a mismatch renders a pill and an ' +
            'Install button in two different shades. Change BRAND.signal, not this constant.');
    }
    const { esc } = C;
    const accents = loadAccents();
    const cats = loadCategoryAccents();
    const sweep = 'conic-gradient(from 210deg,' + Object.values(cats).join(',') + ',' + Object.values(cats)[0] + ')';

    /* The lede's emphasised phrase comes from the page table as PLAIN TEXT and is wrapped
       here, because a page table feeds escaped strings and markup in one would render as
       visible angle brackets. It throws rather than falling back: an emphasis that silently
       stops applying is a design decision quietly reverting itself. */
    if (!page.lede.includes(page.ledeEm)) {
        throw new Error('commandsPage.js: TOOL_PAGES ledeEm ' + JSON.stringify(page.ledeEm) +
            ' does not occur in lede ' + JSON.stringify(page.lede) + '. The serif-italic phrase ' +
            'is a substring of the lede, so the two must be edited together.');
    }
    const ledeHtml = esc(page.lede).replace(esc(page.ledeEm), '<em>' + esc(page.ledeEm) + '</em>');

    const rail = [];
    const panels = [];
    const byPath = new Map();

    for (const group of catalog.groups) {
        if (!group.commands.length) continue;
        /* The group name rides IN the rail rather than being dropped. The bot's own taxonomy
           (Gunsmiths, Draws, Seasonal…) is real information even though nobody arrives asking
           for "Utilities" — the ask index is what answers that question, and this is what
           orients a reader who already knows roughly where they are going. It is aria-hidden
           because the rail is one <nav> and a screen reader reading "Gunsmiths" as a link
           label between two links would be a third thing to tab past for no gain. */
        rail.push('<span class="rx-gl" aria-hidden="true">' + esc(group.label) + '</span>');
        for (const command of group.commands) {
            byPath.set(command.path, command);
            const derived = DERIVED.has(command.path);
            /* Everything the search can match on, in one attribute: the command, what it does,
               its option names, its choice labels, its group — AND a hand-written keyword set.
               ⚠️ The keywords are the fix for a real miss: searching "loadout" matched only
               /gunsmiths search, because /gunsmiths list and /dmz never use that word in any
               field Discord declares, while being entirely about loadouts. */
            const find = searchHaystack(command, group.label);
            rail.push('<a class="rx-chip" href="#' + esc(command.id) + '" data-for="' + esc(command.id) + '" ' +
                'data-find="' + esc(find) + '" style="' + colourVars(command.path, accents, derived ? DERIVED_NEUTRAL : null) + '">' +
                '<i class="rx-dot' + (derived ? ' rx-drv' : '') + '" aria-hidden="true"></i>' +
                esc(command.path) + '</a>');
            panels.push(renderPanel(command, group, C, accents, cats));
        }
    }

    const asks = ASKS.map(a => {
        const command = byPath.get(a.to);
        // A silent miss would leave the index quietly pointing nowhere. assertAskCoverage already caught this at the top; belt and braces, because this one renders a dead link rather than throwing.
        if (!command) throw new Error('commandsPage.js: the ask "' + a.q + '" points at ' + a.to + ', which the bot no longer registers.');
        const derived = DERIVED.has(a.to);
        return '<a class="rx-ask" href="#' + esc(command.id) + '" style="' +
            colourVars(a.to, accents, derived ? DERIVED_NEUTRAL : null) + '">' +
            '<i class="' + (derived ? 'rx-drv' : '') + '" aria-hidden="true"></i>' +
            '<span>' + esc(a.q) + '</span><em>' + esc(a.to) + '</em></a>';
    }).join('');

    const install = GUIDES.find(g => g.id === 'guide-install');
    const instBtns = install.compare.map(([head, body], i) =>
        '<button type="button" aria-pressed="' + (i === 0 ? 'true' : 'false') + '" ' +
        'data-h="' + esc(head) + '" data-b="' + esc(body) + '">' + esc(head) + '</button>').join('');

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
    const accent = ':root{--accent:' + esc(page.accent) + ';--glow:' + esc(page.glow) +
        ';--accent-on:' + solveOn(page.accent) + ';--sweep:' + sweep + '}' +
        ':root[data-theme=light]{' + lightVars + '}' +
        '@media (prefers-color-scheme:light){:root:not([data-theme=dark]){' + lightVars + '}}' +
        /* --ci is kept for HAIRLINES and small marks only. Both solved values are emitted
           inline per command and the stylesheet picks between them here, because an inline
           style beats every stylesheet rule and one inline value could never be corrected
           for light. Light arrives BOTH ways, so this is three blocks like TOKENS. */
        '.rx-p,.rx-chip,.rx-ask{--ci:var(--ct)}' +
        ':root[data-theme=light] .rx-p,:root[data-theme=light] .rx-chip,' +
        ':root[data-theme=light] .rx-ask{--ci:var(--ctl)}' +
        '@media (prefers-color-scheme:light){:root:not([data-theme=dark]) .rx-p,' +
        ':root:not([data-theme=dark]) .rx-chip,:root:not([data-theme=dark]) .rx-ask{--ci:var(--ctl)}}';

    return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(page.title)} — Dioreo</title>
<meta name="description" content="${esc(page.desc)}">
${C.THEME_BOOT}
<style>${C.TOKENS}${C.COMPONENT_CSS}${C.BAR_CSS}${C.PAGE_CSS}${C.SLOT_CSS}${C.SWITCHER_CSS}${accent}${RECEIVER_CSS}</style>
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
<!-- ⚠️ NO SECTION SLOTS ON PURPOSE. mobileNav() renders its "On this page" accordion only
     when it is given some, and this page's rail already IS that navigation. Stacking both
     cost 107px above the fold on a phone, under a 54px bar, on a page whose entire problem
     was that nothing you could act on was on the first screen. -->
${C.mobileNav(page, '')}
<div class="page rx-floor">
<main id="main" tabindex="-1">
  <header class="rx-top">
    <p class="rx-kick">${esc(page.kicker)} <i>&middot;</i> ${catalog.commandCount} commands</p>
    <h1 class="rx-h1">${esc(page.title)}</h1>
    <p class="rx-sub">${ledeHtml}</p>
  </header>

  <div class="rx-rail">
    <nav class="rx-scroll" aria-label="All commands">
      <!-- href="#" clears the fragment as a SAME-DOCUMENT navigation, so :target stops
           matching and the landing state returns without reloading the page or losing what
           the reader has filled in. ./commands.html would work too and would cost a reload. -->
      <a class="rx-chip rx-home-chip" id="rx-homechip" href="#"><i class="rx-dot" aria-hidden="true"></i>All commands</a>
      ${rail.join('')}
    </nav>
  </div>

  <div class="rx-bench" id="rx-bench">
    <label class="rx-sr" for="rx-q">Search commands</label>
    <input class="rx-sr" id="rx-q" type="search" placeholder="Search" autocomplete="off" spellcheck="false">
    <!-- WCAG 4.1.3 Status Messages. Filtering hides rail chips, and without a status region
         a screen-reader user gets no signal that the strip changed or emptied. role="status" is
         polite so it never interrupts, and it stays EMPTY at rest — a region that announces
         "14 commands" on load is noise rather than information. -->
    <p class="rx-none" id="rx-count" role="status"></p>

    <div class="rx-stage">
      ${panels.join('')}
      <section class="rx-home">
        <div class="rx-card" style="--cc:var(--accent);--con:var(--accent-on)">
          <h2>What do you need</h2>
          <p class="rx-lead">Pick the thing you are trying to do. Every one of them is a command you can copy.</p>
          <div class="rx-asks">${asks}</div>
          <div class="rx-inst">
            <h3>${esc(install.title)}</h3>
            <div class="rx-toggle" id="rx-toggle" role="group" aria-label="${esc(install.title)}">${instBtns}</div>
            <p class="rx-instbody" id="rx-instbody"><b>${esc(install.compare[0][0])}</b>${esc(install.compare[0][1])}</p>
            <p class="rx-foot" style="border:0;padding:0;margin-top:.7rem">${esc(install.note)}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</main>
  ${C.pageFoot(page, null, false)}
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
<script>${RECEIVER_JS}</script>
</body></html>`;
}

module.exports = {
    commandsShell, CHROME_KEYS, SIGNAL, RECEIVER_CSS, RECEIVER_JS,
    VISIBLE_CHOICES, ownOptions, isShared, solveText, solveOn, loadAccents, loadCategoryAccents,
    DERIVED, DERIVED_NEUTRAL, GROUND_DARK, GROUND_LIGHT,
};
